// Put the approved "topics you seemed interested in" lists on COMM 118's plan
// row (finalInterests), where the final project preferences sheet shows each
// student their own. Reads private/comm118-final-interests.json,
// { [roster name]: { topics: [...] } }. Run only after Andrew approves the
// lists. --clear takes every list off the row.
//
//   node scripts/comm118-final-interests.mjs            prints
//   node scripts/comm118-final-interests.mjs --write    writes

import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const PLAN = "comm118-f26-v1-plan";
const write = process.argv.includes("--write"), clear = process.argv.includes("--clear");
const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=data`, { headers: H });
const plan = (await r.json())[0].data;
const names = new Set((plan.students || []).map(s => s.name));
const file = clear ? {} : JSON.parse(readFileSync(new URL("private/comm118-final-interests.json", ROOT), "utf8"));
const lists = {};
Object.entries(file).forEach(([name, v]) => {
  if (!names.has(name)) throw new Error("not on the roster: " + name);
  const topics = (Array.isArray(v) ? v : v.topics || []).map(t => String(t || "").trim()).filter(Boolean);
  if (topics.length) lists[name] = topics;
});
console.log(Object.keys(lists).length + " students with a list, " + Object.values(lists).reduce((n, l) => n + l.length, 0) + " topics; on the row now: " + Object.keys(plan.finalInterests || {}).length);
if (!write) { console.log("Nothing written. Say --write to do it."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify({ id: PLAN, data: { ...plan, finalInterests: lists }, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
console.log("wrote " + PLAN);
process.exit(0);
