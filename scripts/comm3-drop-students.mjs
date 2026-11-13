// Take students who dropped off the COMM 3 roster.
//
// Andrew, 2026-11-12: "please drop kayla fu and kyliee hill from my comm 3
// classes." The roster is `students` on the plan row, and every surface made
// of people reads it through rosterOf, so leaving the list is leaving the
// class: the roster, attendance, the grading queue, the pickers, sign-in.
//
// Only the roster rows go. Everything they handed in, every grade card,
// thread, profile and photo stays where it is, keyed by name, so putting a
// student back is putting the row back. The plan row is copied to
// comm3-f26-v1-plan-bak-drop-<date> before the write.
//
//   node scripts/comm3-drop-students.mjs           prints what would change
//   node scripts/comm3-drop-students.mjs --write   writes
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
const DROP = ["kayla-fu", "kylee-hill"];

const slug = (s) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const idOf = (s) => String(s?.id || "") || slug(s?.name);

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan || !Array.isArray(plan.students)) { console.error("no plan row, or students is not a list"); process.exit(1); }

const going = plan.students.filter(s => DROP.includes(idOf(s)));
const students = plan.students.filter(s => !DROP.includes(idOf(s)));
going.forEach(s => console.log(`drop ${s.name} (${s.section || "no section"})`));
const missing = DROP.filter(d => !going.some(s => idOf(s) === d));
if (missing.length) console.log("not on the roster: " + missing.join(", "));
console.log(`students: ${plan.students.length} -> ${students.length}`);
if (!going.length) { console.log("Nothing to do."); process.exit(0); }

const put = async (id, data) => {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${id}: ${w.status} ${await w.text()}`);
  const back = await w.json();
  if (!back || !back[0]) throw new Error("the write to " + id + " returned no row");
  return back[0];
};

if (write) {
  const bak = `${ID}-bak-drop-${new Date().toISOString().slice(0, 10)}`;
  await put(bak, plan);
  console.log("backed up to " + bak);
  const back = await put(ID, { ...plan, students });
  console.log("wrote " + ID + ", students now " + (back.data?.students || []).length);
} else console.log("\nNothing written. Say --write to do it.");
