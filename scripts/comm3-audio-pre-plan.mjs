// Point COMM 3's Audio story pre-production challenge at its sheet and move
// it to Wednesday. Andrew, 2026-11-06: "let's make it due on Wednesday night,
// Wednesday the 11th, and it's called the audio story pre-production."
//
// Writes two things: on the plan row comm3-f26-v1-plan, the challenge
// audio-pre gets due Nov 11, 11:59 PM and instructionsUrl
// /comm3/worksheets/audio-pre (what ties a sheet to a challenge for the
// assignment page, the Grade view and the door); and a worksheet_deadlines
// row so the database locks the sheet after Wednesday night Pacific.
//
//   node scripts/comm3-audio-pre-plan.mjs           prints
//   node scripts/comm3-audio-pre-plan.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const PLAN = "comm3-f26-v1-plan";
const AID = "audio-pre";
const DUE = { due: "Nov 11", dueTime: "11:59 PM", instructionsUrl: "/comm3/worksheets/audio-pre" };
const LOCK = { worksheet_key: "audio-pre", group_key: "comm3", due_at: "2026-11-11 23:59:00-08" };

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${PLAN}: ${r.status}`);
const cur = ((await r.json())[0] || {}).data;
if (!cur) throw new Error("no plan row");
const asg = (cur.assignments || []).find(a => a.id === AID);
if (!asg) throw new Error("no " + AID + " on the plan row");
console.log("now:", JSON.stringify({ title: asg.title, due: asg.due, dueTime: asg.dueTime, instructionsUrl: asg.instructionsUrl }));
console.log("to: ", JSON.stringify({ title: asg.title, ...DUE }));
console.log("lock:", JSON.stringify(LOCK));
const next = { ...cur, assignments: cur.assignments.map(a => a.id === AID ? { ...a, ...DUE } : a) };
if (!write) { console.log("\nNothing written. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
  method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
  body: JSON.stringify({ id: PLAN, data: next, updated_at: new Date().toISOString() }),
});
if (!w.ok) throw new Error(`write ${PLAN}: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("wrote " + PLAN);
const d = await fetch(`${SUPABASE_URL}/rest/v1/worksheet_deadlines?on_conflict=worksheet_key,group_key`, {
  method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify(LOCK),
});
const got = d.ok ? await d.json() : [];
if (!d.ok || got.length !== 1) throw new Error(`deadline: ${d.status} ${got.length} rows`);
console.log("deadline row:", JSON.stringify(got[0]));
