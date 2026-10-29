// Point COMM 3's Audio story assignment at the builder, so its submits count.
//
// The builder is /comm3/worksheets/audio-story (src/engine/audiostory/story
// .jsx). An assignment whose instructionsUrl names a worksheet on this site
// gets that sheet's submits in its log (worksheetSubmits.js), its Review,
// Student view and Control buttons on the assignment row (portal/Tools.jsx),
// and the sheet's lateness read. Nothing else on the assignment changes:
// the title, the due date, the weight and the scale stay as they are.
//
// What this writes, on comm3-f26-v1-plan:
//   assignments     the one with id "audio" gets
//                   instructionsUrl /comm3/worksheets/audio-story
//
//   node scripts/comm3-audio-story-link.mjs           prints what would change
//   node scripts/comm3-audio-story-link.mjs --write   writes
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
const URL_TO = "/comm3/worksheets/audio-story";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan || !Array.isArray(plan.assignments)) { console.error("no plan row, or assignments is not a list"); process.exit(1); }

const asg = plan.assignments.find(a => a.id === "audio");
if (!asg) { console.error("no assignment with id audio on the plan row"); process.exit(1); }
console.log(`${asg.title}: due ${asg.due} ${asg.dueTime}, weight ${asg.weight}, link now ${JSON.stringify(asg.instructionsUrl || "")}`);
if (asg.instructionsUrl === URL_TO) { console.log("already points at the builder; nothing to do"); process.exit(0); }
const assignments = plan.assignments.map(a => (a.id === "audio" ? { ...a, instructionsUrl: URL_TO } : a));
console.log(`  -> ${URL_TO}`);

if (write) {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, assignments }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  const back = await w.json();
  if (!back || !back[0]) throw new Error("the write returned no row");
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
