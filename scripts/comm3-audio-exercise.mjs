// The audio exercise and the audio story research become one assignment.
//
// Andrew, 2026-10-29: "i want to combine audio exercise and audio story
// research and this second part is basically that assignment," due Tuesday,
// named Audio exercise. So the research sheet, /comm3/worksheets/audio-
// research, is the audio exercise's sheet (title and due line changed in
// src/engine/audiostory/research.jsx), and the plan row changes to match.
//
// What this writes, on comm3-f26-v1-plan:
//   assignments     ex5 (Audio exercise) due Nov 3, linking to the research
//                   sheet; audio-research removed
//   schedule        ex5's row moved to Tuesday; the audio-research row removed
//   library         the audio-research row removed
//   week text       w7: "Audio exercise due Monday, November 2." becomes
//                   "... Tuesday, November 3."
//
//   node scripts/comm3-audio-exercise.mjs           prints what would change
//   node scripts/comm3-audio-exercise.mjs --write   writes
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
const SHEET = "/comm3/worksheets/audio-research";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan || !Array.isArray(plan.assignments)) { console.error("no plan row, or assignments is not a list"); process.exit(1); }

console.log("assignments:");
const gone = plan.assignments.find(a => a.id === "audio-research");
const assignments = plan.assignments.filter(a => a.id !== "audio-research").map(a => {
  if (a.id !== "ex5") return a;
  console.log(`  ${a.title}: due ${a.due} -> Nov 3, link ${JSON.stringify(a.instructionsUrl || "")} -> ${SHEET}`);
  return { ...a, due: "Nov 3", dueTime: "11:59 PM", instructionsUrl: SHEET };
});
console.log(gone ? `  removed: ${gone.title} (was due ${gone.due})` : "  audio-research already gone");

console.log("schedule rows:");
const weeks = plan.schedule.map(w => ({ ...w, items: [...(w.items || [])] }));
weeks.forEach(w => {
  const n = w.items.length;
  w.items = w.items.filter(it => it.asgId !== "audio-research");
  if (w.items.length < n) console.log(`  Audio story research row removed from ${w.id}`);
  w.items = w.items.map(it => {
    if (it.asgId !== "ex5" || it.date === "Tue") return it;
    console.log(`  ${it.title} on ${w.id}: ${it.date} -> Tue`);
    return { ...it, date: "Tue" };
  });
});
let library = plan.library;
if (Array.isArray(library)) library = library.filter(b => b.id !== "lib-w7-10");
else if (library && typeof library === "object" && library["lib-w7-10"]) { library = { ...library }; delete library["lib-w7-10"]; }

console.log("week text:");
const w7 = weeks.find(w => w.id === "w7");
if (w7 && /Audio exercise due Monday, November 2\./.test(w7.text)) { w7.text = w7.text.replace("Audio exercise due Monday, November 2.", "Audio exercise due Tuesday, November 3."); console.log(`  w7: "${w7.text}"`); }
else console.log(`  w7: pattern not found, left as is: "${w7?.text}"`);

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
