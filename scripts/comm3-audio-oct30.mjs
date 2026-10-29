// COMM 3's two audio story sheets, on the assignments and the schedule.
//
// Andrew, 2026-10-29, by voice: ideas are approved in class on Friday,
// October 30 ("they're gonna get an idea approved by the end of the day"),
// and the research on the okayed idea is due Tuesday night ("they're going
// to work on that Monday and Tuesday"). The sheets are
// /comm3/worksheets/audio-ideas and /comm3/worksheets/audio-research
// (src/engine/audiostory). Both count their submits on the assignment that
// links to them (worksheetSubmits.js).
//
// What this writes, on comm3-f26-v1-plan:
//   assignments     audio-ideas (Oct 30, 11:59 PM) and audio-research
//                   (Nov 3, 11:59 PM), complete scale, weight 0, the shape
//                   of audio-pre, each linking to its sheet, placed before
//                   the audio exercise
//   schedule        a row under week 6 (Fri) and week 7 (Tue)
//   library         the row each schedule row points at
//
//   node scripts/comm3-audio-oct30.mjs           prints what would change
//   node scripts/comm3-audio-oct30.mjs --write   writes
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
const ID = "comm3-f26-v1-plan";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan || !Array.isArray(plan.assignments)) { console.error("no plan row, or assignments is not a list"); process.exit(1); }

const NEW = [
  { id: "audio-ideas", title: "Audio story ideas", due: "Oct 30", url: "/comm3/worksheets/audio-ideas", week: "w6", date: "Fri", item: "i-w6-10", lib: "lib-w6-10" },
  { id: "audio-research", title: "Audio story research", due: "Nov 3", url: "/comm3/worksheets/audio-research", week: "w7", date: "Tue", item: "i-w7-10", lib: "lib-w7-10" },
];

// Assignments: the shape of audio-pre, before the audio exercise.
const shape = plan.assignments.find(a => a.id === "audio-pre") || { scale: "complete", dueTime: "11:59 PM", rubric: [], description: "" };
const assignments = [...plan.assignments];
console.log("assignments:");
for (const n of NEW) {
  if (assignments.some(a => a.id === n.id)) { console.log(`  ${n.title} already there`); continue; }
  const at = Math.max(0, assignments.findIndex(a => a.id === "ex5"));
  assignments.splice(at, 0, { ...shape, id: n.id, title: n.title, due: n.due, dueTime: "11:59 PM", weight: 0, scale: "complete", rubric: [], description: "", instructionsUrl: n.url });
  console.log(`  added: ${n.title}, due ${n.due} 11:59 PM, complete, weight 0, ${n.url}`);
}

// Schedule rows and library rows.
const weeks = plan.schedule.map(w => ({ ...w, items: [...(w.items || [])] }));
let library = plan.library;
console.log("schedule rows:");
for (const n of NEW) {
  const w = weeks.find(x => x.id === n.week);
  if (!w) { console.log(`  no week ${n.week}; row for ${n.title} not placed`); continue; }
  if (w.items.some(it => it.asgId === n.id)) { console.log(`  ${n.title} already on ${n.week}`); continue; }
  w.items.push({ id: n.item, url: "", date: n.date, type: "assignment", asgId: n.id, libId: n.lib, title: n.title + " due" });
  console.log(`  ${n.title} due -> ${n.week} ${n.date}`);
  const libRow = { id: n.lib, url: "", type: "assignment", title: n.title + " due" };
  if (Array.isArray(library)) { if (!library.some(b => b.id === libRow.id)) library = [...library, libRow]; }
  else if (library && typeof library === "object" && !library[libRow.id]) library = { ...library, [libRow.id]: libRow };
}

if (write) {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, assignments, schedule: weeks, library }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  const back = await w.json();
  if (!back || !back[0]) throw new Error("the write returned no row");
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
