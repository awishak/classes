// Where the final project stands for one class, read only: whether the teams
// and topics are released, how many pairs and approved topics there are,
// whether the builder is open on the plan row, and what the two challenges
// (final-pre, final) say. Prints counts, never a student's name.
//
//   node scripts/final-project-state.mjs comm118
import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const cls = process.argv[2] || "comm118";
const PLAN = { comm3: "comm3-f26-v1-plan", comm118: "comm118-f26-v1-plan", comm999: "comm999-v1-plan" }[cls];
const file = async (name) => { const r = await fetch(`${SUPABASE_URL}/storage/v1/object/instructor/${name}`, { headers: H }); return r.ok ? await r.json().catch(() => null) : null; };

const prefs = (await file(`${cls}-final-prefs.json`)) || {};
const topics = Object.values(prefs.topics || {}).map(t => Object.values(t || {}).filter(Boolean).length);
console.log(cls + " decisions: released " + (prefs.released === true) + ", saved " + (prefs.at || "never"));
console.log("  pairs " + (prefs.pairs || []).length + ", set to individual " + (prefs.solo || []).length + ", students with an approved topic " + topics.filter(n => n > 0).length + ", approved topics " + topics.reduce((a, b) => a + b, 0));

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=data`, { headers: H });
const plan = r.ok ? (await r.json())[0]?.data : null;
if (!plan) { console.log("  no plan row"); process.exit(0); }
console.log("  roster " + (plan.students || []).length);
console.log("  worksheetsOpen final-project: " + JSON.stringify(plan.worksheetsOpen?.["final-project"]) + ", final-prefs: " + JSON.stringify(plan.worksheetsOpen?.["final-prefs"]));
for (const id of ["final-prefs", "final-pre", "final"]) {
  const a = (plan.assignments || []).find(x => x.id === id);
  console.log("  challenge " + id + ": " + (a ? JSON.stringify({ title: a.title, due: a.due, dueTime: a.dueTime, opens: a.opens, opensAt: a.opensAt, visible: a.visible, instructionsUrl: a.instructionsUrl }) : "none"));
}
const list = await fetch(`${SUPABASE_URL}/storage/v1/object/list/instructor`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ prefix: `exhibits/${cls}/`, limit: 1000 }) });
const rows = list.ok ? await list.json() : [];
console.log("  projects started in the builder: " + rows.filter(x => /^[a-f0-9]{10}\.json$/.test(x.name)).length);
