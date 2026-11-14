// COMM 118: Weekly Challenge 4 is Turkey Bowl. Andrew, 2026-11-14: "this is
// basically challenge number four. We'll make it due on Friday ... It can
// open up on Tuesday." Writes the plan row comm118-f26-v1-plan: the challenge
// wc4 is renamed and its link goes to the game. The due date stays Friday,
// November 20. The game opens itself Tuesday (OPENS in api/turkey-bowl.js).
// Wednesday's schedule line names both things students have that week.
//
//   node scripts/comm118-wc4-turkey-bowl.mjs           prints
//   node scripts/comm118-wc4-turkey-bowl.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const PLAN = "comm118-f26-v1-plan";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=data`, { headers: H });
const cur = ((await r.json())[0] || {}).data;
if (!cur) throw new Error("no plan row");
const asg = (cur.assignments || []).find(a => a.id === "wc4");
if (!asg) throw new Error("no wc4");
const to = { title: "Weekly Challenge 4: Turkey Bowl", instructionsUrl: "https://classes.andrewishak.com/comm118/turkey-bowl" };
const wed = "No class. Work on your final project preferences and Weekly Challenge 4.";
console.log("wc4 now:", JSON.stringify({ title: asg.title, due: asg.due, instructionsUrl: asg.instructionsUrl }));
console.log("wc4 to: ", JSON.stringify({ ...to, due: asg.due }));
console.log("Nov 18:", JSON.stringify(cur.dayPlans?.["Nov 18"]?.title), "->", JSON.stringify(wed));
console.log("week items naming wc4:", (cur.schedule || []).flatMap(w => (w.items || []).filter(it => it.asgId === "wc4").map(it => w.id + " " + it.date + " " + it.title)).join(" | ") || "none");
if (!write) { console.log("\nNothing written. Say --write."); process.exit(0); }
const next = {
  ...cur,
  assignments: cur.assignments.map(a => (a.id === "wc4" ? { ...a, ...to } : a)),
  dayPlans: { ...cur.dayPlans, "Nov 18": { ...(cur.dayPlans?.["Nov 18"] || {}), title: wed } },
  schedule: cur.schedule.map(w => ({ ...w, items: (w.items || []).map(it => (it.asgId === "wc4" ? { ...it, title: "Weekly Challenge 4: Turkey Bowl due" } : it)) })),
};
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: PLAN, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status);
console.log("wrote " + PLAN);
