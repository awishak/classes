// COMM 118: Turkey Bowl's dates move. Andrew, 2026-11-14: "turkey bowl will
// open wednesday and will [be due] sun nov 29," then "change due date to nov 20." Writes the plan row
// comm118-f26-v1-plan: wc4's due date becomes Friday, November 20. The game's
// own opening is OPENS in api/turkey-bowl.js.
//
//   node scripts/comm118-wc4-dates.mjs           prints
//   node scripts/comm118-wc4-dates.mjs --write   writes

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
console.log("wc4:", JSON.stringify(asg));
console.log("wc4 due:", asg.due, "->", "Nov 20");
if (!write) { console.log("\nNothing written. Say --write."); process.exit(0); }
const next = { ...cur, assignments: cur.assignments.map(a => (a.id === "wc4" ? { ...a, due: "Nov 20" } : a)) };
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: PLAN, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status);
console.log("wrote " + PLAN + ", wc4 due " + (await w.json())[0].data.assignments.find(a => a.id === "wc4").due);
