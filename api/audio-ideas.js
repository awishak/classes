// Every submitted audio story idea in a class, for the students.
//
// Andrew, 2026-10-29: "i need a way to review all ideas and for students to
// request to work on someone else's ideas." A student can read only their own
// rows under the database's rules, so the page of everyone's ideas asks here.
// The caller's session email has to be on the class roster (or be the
// instructor); what comes back is only what the room already saw on the
// board, plus names: each submitted sheet's three ideas, its marks, and the
// ideas its owner asked to work on. Strengths, how they want to work and the
// general answers stay with the instructor. Nothing is written here; a
// request is the student's own `want` field, written as them.
//
// POST /api/audio-ideas { groupKey }
//   -> { ok, me, sheets: [{ viewer_id, name, section, submitted_at, ideas: { a: { idea, why }, ... }, marks: { a: "top" }, wants: ["owner|slot"] }] }

import { callerEmail, pinMatches, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";
import { isInstructorEmail } from "../src/instructors.js";

const STORAGE = { comm3: "comm3-f26-v1", comm999: "comm999-v1" };
const KEY = "audio-ideas";
const SLOTS = ["a", "b", "c"];
const MARKS = new Set(["top", "ok", "close", "no", "ohno"]);
const lower = (s) => String(s || "").trim().toLowerCase();

const rows = async (path) => {
  const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() });
  if (!r.ok) throw new Error("read " + r.status);
  return r.json();
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const groupKey = String(body.groupKey || "");
  if (!STORAGE[groupKey]) return res.status(400).json({ ok: false, error: "This class has no audio story." });

  const me = pinMatches(body.pin) ? "" : await callerEmail(req);
  const instructor = pinMatches(body.pin) || isInstructorEmail(me);
  try {
    const plan = await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(STORAGE[groupKey] + "-plan")}&select=data`);
    const roster = (plan?.[0]?.data?.students || []).filter(s => s && s.email).map(s => ({ name: s.name || "", email: lower(s.email), section: String(s.section || "").trim() }));
    const byEmail = new Map(roster.map(s => [s.email, s]));
    if (!instructor && !byEmail.has(me)) return res.status(401).json({ ok: false, error: "Sign in with your class email to see the ideas." });

    const sheets = await rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&submitted_at=not.is.null`);
    if (!sheets.length) return res.status(200).json({ ok: true, me, sheets: [] });
    const ids = sheets.map(s => s.id);
    const answers = await rows(`/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids.join(",")})&order=position&limit=20000`);
    const slot = {};
    for (const r of answers) slot[r.sheet_id + "\u0000" + r.field + "\u0000" + (r.position || 0)] = r;
    const joined = {};
    Object.values(slot).sort((x, y) => (x.position || 0) - (y.position || 0)).forEach(r => {
      const m = (joined[r.sheet_id] = joined[r.sheet_id] || {});
      m[r.field] = (m[r.field] || "") + r.value;
    });
    const reviews = await rows(`/rest/v1/worksheet_reviews?select=sheet_id,note&sheet_id=in.(${ids.join(",")})`).catch(() => []);
    const noteOf = new Map(reviews.map(r => [r.sheet_id, r.note]));
    const marksOf = (note) => {
      try { const got = JSON.parse(note || "{}"); const out = {}; SLOTS.forEach(s => { if (MARKS.has(got?.[s])) out[s] = got[s]; }); return out; } catch { return {}; }
    };

    const out = sheets.map(sh => {
      const a = joined[sh.id] || {};
      const who = byEmail.get(lower(sh.viewer_id)) || { name: sh.viewer_id, section: "" };
      const ideas = {};
      SLOTS.forEach(s => { ideas[s] = { idea: String(a["idea:" + s] || "").trim(), why: String(a["why:" + s] || "").trim() }; });
      return {
        viewer_id: lower(sh.viewer_id), name: who.name, section: who.section, submitted_at: sh.submitted_at,
        ideas, marks: marksOf(noteOf.get(sh.id)),
        wants: String(a.want || "").split("\n").map(x => x.trim()).filter(Boolean),
      };
    });
    return res.status(200).json({ ok: true, me, sheets: out });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Could not read the ideas." });
  }
}
