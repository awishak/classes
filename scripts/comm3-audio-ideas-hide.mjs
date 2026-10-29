// Hide the audio story ideas challenge from COMM 3 students until class
// starts on Friday, October 30, at 8:00 AM Pacific.
//
// Andrew, 2026-10-29: "don't show students the audio story due card until
// class starts tomorrow." So the challenge's `visible` becomes a time
// (profileTask.js isHidden): until then it is off the due card, My work, the
// schedule rows, search and the check-in list, and the instructor's row says
// Hidden until. The sheet itself closes to students until the same minute
// through the class's worksheetsOpen switch, which already takes a time
// (localWorksheets.js openTo).
//
//   node scripts/comm3-audio-ideas-hide.mjs           prints what would change
//   node scripts/comm3-audio-ideas-hide.mjs --write   writes
//   node scripts/comm3-audio-ideas-hide.mjs --show    puts the challenge and the sheet back to visible now
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
const write = process.argv.includes("--write") || process.argv.includes("--show");
const show = process.argv.includes("--show");
const ID = "comm3-f26-v1-plan";
const ASG = "audio-ideas";
const AT = "2026-10-30T08:00:00-07:00";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan || !Array.isArray(plan.assignments)) { console.error("no plan row, or assignments is not a list"); process.exit(1); }
const asg = plan.assignments.find(a => a.id === ASG);
if (!asg) { console.error("no " + ASG + " on the plan row"); process.exit(1); }

const visible = show ? true : AT;
const open = show ? true : AT;
console.log(`${asg.title}: visible ${JSON.stringify(asg.visible ?? true)} -> ${JSON.stringify(visible)}`);
console.log(`worksheetsOpen.${ASG}: ${JSON.stringify(plan.worksheetsOpen?.[ASG] ?? null)} -> ${JSON.stringify(open)}`);
console.log(show ? "The challenge and the sheet show now." : "Students see neither until " + new Date(AT).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }) + " Pacific.");

if (write) {
  const assignments = plan.assignments.map(a => a.id === ASG ? { ...a, visible } : a);
  const worksheetsOpen = { ...(plan.worksheetsOpen || {}), [ASG]: open };
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, assignments, worksheetsOpen }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  const back = await w.json();
  if (!back || !back[0]) throw new Error("the write returned no row");
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
