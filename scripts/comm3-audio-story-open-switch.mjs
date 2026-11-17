// Flip the Audio story challenge's own "Submissions open" switch to Now.
//
// The challenge (plan row, assignments, id "audio") was still set to "Not
// yet" (opens: "never"), so a student's assignments list drew the Audio
// story faded with "Not open yet," while the story page itself was open and
// 46 had submitted through it. Andrew, 2026-11-16: "why does audio story say
// not open yet online."
//
// Changes that one field on that one assignment and nothing else.
//
//   node scripts/comm3-audio-story-open-switch.mjs           prints
//   node scripts/comm3-audio-story-open-switch.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const PLAN = "comm3-f26-v1-plan";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=data`, { headers: H });
const plan = (await r.json())[0].data;
console.log("every challenge's switch:");
for (const a of plan.assignments || []) console.log(`  ${String(a.opens || "now").padEnd(6)} ${a.opensAt || ""} ${a.title}`);
const asg = (plan.assignments || []).find(a => a.id === "audio");
if (!asg) throw new Error("no audio challenge on the plan row");
if (asg.opens !== "never") { console.log(`\nAudio story is already "${asg.opens || "now"}". Nothing to do.`); process.exit(0); }
if (!process.argv.includes("--write")) { console.log('\nAudio story is "never". Say --write to set it to now.'); process.exit(0); }
const assignments = plan.assignments.map(a => (a.id === "audio" ? { ...a, opens: "now", opensAt: "" } : a));
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify({ id: PLAN, data: { ...plan, assignments }, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
console.log("\nAudio story: submissions open now.");
