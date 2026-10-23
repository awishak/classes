// Monday, October 26, on both class sites, and the visual story's new due
// date. One script, so the words on the front pages and the lock in the
// database change together.
//
// Andrew, 2026-10-23, from out of town:
//   "Students are gonna submit their visual story on Sunday."
//   "What's going on on Monday ... for comm three ... no class, please read
//    other students' stories ... For Com 118. It says no class, please read
//    for Wednesday ... for Wednesday for com three. It'll say, Audio story
//    introduction. For Wednesday and Com 118. It'll say introduction to team
//    introduction to culture and team communication."
//
// What this writes:
//   comm3-f26-v1-plan     dayPlans["Oct 26"].title, dayPlans["Oct 28"].title,
//                         the Oct 26 lesson-plan row, the visual assignment's
//                         description (Sunday, October 25)
//   comm118-f26-v1-plan   dayPlans["Oct 26"].title, dayPlans["Oct 28"].title,
//                         the two Ishak readings moved from Friday to
//                         Wednesday as required
//   worksheet_deadlines   visual-story / comm3 -> Sunday, October 25, 11:59 PM Pacific
//
//   node scripts/monday-oct26.mjs           prints what would change
//   node scripts/monday-oct26.mjs --write   writes
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");

const read = async (id) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  return ((await r.json())[0] || {}).data ?? null;
};
const put = async (id, data) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`write ${id}: ${r.status} ${await r.text()}`);
};

const TITLES = {
  "comm3-f26-v1": { "Oct 26": "No class. Please read other students' stories.", "Oct 28": "Audio story introduction" },
  "comm118-f26-v1": { "Oct 26": "No class. Please read for Wednesday.", "Oct 28": "Introduction to teams, culture and team communication" },
};
const DUE = "2026-10-26T06:59:00+00:00";   // Sunday, October 25, 11:59 PM Pacific

for (const [classKey, titles] of Object.entries(TITLES)) {
  const plan = await read(classKey + "-plan");
  if (!plan) { console.error("no plan row for " + classKey); process.exit(1); }
  const dayPlans = { ...(plan.dayPlans || {}) };
  for (const [date, title] of Object.entries(titles)) {
    const was = dayPlans[date]?.title || "";
    console.log(`${classKey} ${date}: "${was}" -> "${title}"`);
    dayPlans[date] = { ...(dayPlans[date] || {}), title, noMeeting: date === "Oct 26" ? true : dayPlans[date]?.noMeeting ?? false };
  }
  let assignments = plan.assignments;
  let schedule = plan.schedule;
  if (classKey === "comm3-f26-v1") {
    // The lesson-plan row on the no-class day, for his own eyes.
    const slot = dayPlans["Oct 26"].slots?.["sec-plan"];
    if (slot) {
      const items = slot.items.map(it => it.id === "c3-oct26-plan"
        ? { ...it, bodyOverride: "No class. Stories open at 12:05 AM; students read and comment on at least 8 each (their pod's 4, then 4 more). Comments come out to authors on their own Tuesday at 12:05 AM. Who reviewed what: /comm3/reviews." }
        : it);
      dayPlans["Oct 26"] = { ...dayPlans["Oct 26"], slots: { ...dayPlans["Oct 26"].slots, "sec-plan": { ...slot, items } } };
      console.log("comm3 Oct 26 lesson-plan row rewritten");
    }
    const list = Array.isArray(assignments) ? assignments : Object.values(assignments || {});
    const visual = list.find(a => a.id === "visual");
    if (visual) {
      const next = { ...visual, due: "Oct 25", dueTime: "11:59 PM", description: visual.description.replace(/Due Friday, October 23, at 11:59 PM\./, "Due Sunday, October 25, at 11:59 PM.") };
      console.log(`comm3 visual: due ${visual.due} ${visual.dueTime} -> ${next.due} ${next.dueTime}; description: "${next.description}"`);
      assignments = Array.isArray(assignments) ? assignments.map(a => (a.id === "visual" ? next : a)) : Object.fromEntries(Object.entries(assignments).map(([k, a]) => [k, a.id === "visual" ? next : a]));
    }
  }
  if (classKey === "comm118-f26-v1") {
    schedule = (plan.schedule || []).map(w => {
      if (!(w.dates || []).includes("Oct 28")) return w;
      const items = (w.items || []).map(it => (["b-5m", "b-5n"].includes(it.libId) ? { ...it, date: "Wed", level: "required" } : it));
      items.filter(it => ["b-5m", "b-5n"].includes(it.libId)).forEach(it => console.log(`comm118 reading "${it.title}" -> Wed, required`));
      return { ...w, items };
    });
  }
  if (write) { await put(classKey + "-plan", { ...plan, dayPlans, assignments, schedule }); console.log("wrote " + classKey + "-plan"); }
}

// The lock in the database.
const dl = await fetch(`${SUPABASE_URL}/rest/v1/worksheet_deadlines?worksheet_key=eq.visual-story&group_key=eq.comm3&select=due_at`, { headers: H });
const was = (await dl.json())?.[0]?.due_at || "(none)";
console.log(`worksheet_deadlines visual-story/comm3: ${was} -> ${DUE}`);
if (write) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/worksheet_deadlines?on_conflict=worksheet_key,group_key`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ worksheet_key: "visual-story", group_key: "comm3", due_at: DUE }),
  });
  if (!r.ok) { console.error("deadline write failed: " + r.status + " " + await r.text()); process.exit(1); }
  console.log("wrote the deadline");
}
if (!write) console.log("\nNothing written. Say --write to do it.");
