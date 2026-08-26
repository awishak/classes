// Move a class's Spring 2026 term out of its old forked store and into the
// shape the engine reads.
//
// The old hubs kept a week as { week, label, theme, dates: [{ day, date, topic,
// notes, adminNotes, assignment }] } — a topic and a set of notes per DAY. The
// engine keeps one topic per week and a day plan per date. That is a better fit
// than it looks: each Spring day becomes a day plan carrying its own notes and
// its Canva link, which is exactly what the dashboard's Notes panel and Class
// Flow now read.
//
// Reads the old key, writes a new one. It never writes to the old key and never
// deletes anything, so the Spring hubs at /<class>/legacy keep working.
//
//   node scripts/port-spring.mjs            dry run, prints what it would write
//   node scripts/port-spring.mjs --write    actually writes

import { readFileSync } from "node:fs";

const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const URL_ = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const JOBS = [
  { from: "comm2-v1", to: "comm2-s26-v1", code: "COMM 2" },
  { from: "comm4-v1", to: "comm4-s26-v1", code: "COMM 4" },
];

const get = async (id) => {
  const res = await fetch(URL_ + "/rest/v1/app_data?id=eq." + encodeURIComponent(id) + "&select=data", { headers });
  const rows = await res.json();
  return rows?.[0]?.data || null;
};

const put = async (id, data) => {
  const res = await fetch(URL_ + "/rest/v1/app_data?on_conflict=id", {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(id + ": " + res.status + " " + (await res.text()).slice(0, 160));
};

// A real class date. "TBD" and the blanks are not dates and must not become one.
//
// The `holiday` flag is NOT a reason to drop a day. Ten days a class carry it,
// and they include "Special Occasion Speeches" with notes, "Work on Ethics Bowl
// presentation", and days with an assignment due. Whatever the old hub meant by
// it, it did not mean nothing happened. Dropping on that flag would have thrown
// away eight real days a class. It is carried through as a note instead.
const realDate = (d) => !!d?.date && !/^tbd$/i.test(d.date.trim());

function port(old) {
  const weeks = [];
  const dayPlans = {};

  (old.schedule || []).forEach((w, i) => {
    const days = (w.dates || []).filter(realDate);
    const items = [];

    days.forEach(d => {
      // Each day's own notes, topic and deck become that day's plan. This is
      // the half the old hub could show and the dashboard could not.
      const notes = [
        d.holiday ? "(marked no-class in the Spring hub)" : "",
        d.topic ? "Topic: " + d.topic : "",
        d.notes || "",
      ].filter(Boolean).join("\n\n").trim();
      if (notes || d.adminNotes) {
        dayPlans[d.date] = {
          sequenceId: "motivated", slots: {}, blocks: [],
          slides: d.adminNotes || "",
          notes,
        };
      }
      if (d.assignment) {
        items.push({ id: "sp-" + (w.week || i) + "-" + d.date.replace(/\s+/g, ""), libId: "", type: "assignment",
          title: d.assignment, url: "", date: d.day || "" });
      }
    });

    weeks.push({
      id: "w" + (w.week || i + 1),
      topic: w.theme || w.label || "",
      dates: days.map(d => d.date),
      // The week's own text stays empty: everything written in Spring was
      // written against a day, and that is where it has gone.
      text: "",
      plan: "",
      slides: "",
      items,
    });
  });

  const assignments = (old.assignments || []).map(a => ({
    id: a.id,
    title: a.name || a.title || "Untitled",
    due: a.due || "",
    weight: Number(a.weight) || 0,
    description: a.notes || "",
    instructionsUrl: a.link || "",
    rubric: [],
  }));

  const students = (old.students || []).map(s => ({ name: s.name, from: "", goals: "" }));

  return {
    portedFrom: null, // filled in by the caller
    courseTitle: old.courseTitle || "",
    schedule: weeks,
    library: [],
    assignments,
    students,
    dayPlans,
    seedVersion: 1,
  };
}

const write = process.argv.includes("--write");
let bad = 0;

for (const job of JOBS) {
  const old = await get(job.from);
  if (!old) { console.error("  " + job.code + ": no data at " + job.from); bad++; continue; }

  const existing = await get(job.to);
  const next = port(old);
  next.portedFrom = job.from + " (Spring 2026)";

  const days = Object.keys(next.dayPlans).length;
  console.log("  " + job.code + "  " + job.from + " → " + job.to);
  console.log("     weeks " + next.schedule.length +
              " · dates " + next.schedule.reduce((n, w) => n + w.dates.length, 0) +
              " · day plans " + days +
              " · with a deck " + Object.values(next.dayPlans).filter(p => p.slides).length +
              " · assignments " + next.assignments.length +
              " · roster " + next.students.length);
  console.log("     week 1: " + JSON.stringify(next.schedule[0].topic) + " " + JSON.stringify(next.schedule[0].dates));
  if (existing) console.log("     NOTE: " + job.to + " already exists and would be overwritten.");

  if (write) { await put(job.to, next); console.log("     written"); }
}

if (!write) console.log("\ndry run. nothing written. add --write to do it.");
process.exit(bad ? 1 : 0);
