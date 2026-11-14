// Open COMM 118's Final project preferences on Monday, November 16, 2026, at
// noon Pacific: the sheet (worksheetsOpen on the plan row) and its card
// (fg-topic). Andrew, 2026-11-14: "open it monday at noon".
//
//   node scripts/comm118-final-prefs-open.mjs            prints
//   node scripts/comm118-final-prefs-open.mjs --write    writes

import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const PLAN = "comm118-f26-v1-plan", KEY = "final-prefs", AID = "fg-topic";
const SHEET_AT = "2026-11-16T12:00:00-08:00", CARD_AT = "2026-11-16T12:00";
const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=data`, { headers: H });
const plan = (await r.json())[0].data;
const asg = (plan.assignments || []).find(a => a.id === AID);
if (!asg) throw new Error("no " + AID + " card");
console.log("sheet switch now: " + JSON.stringify(plan.worksheetsOpen?.[KEY]) + " -> " + JSON.stringify(SHEET_AT));
console.log("card now: opens " + JSON.stringify(asg.opens) + " " + JSON.stringify(asg.opensAt) + " -> \"date\" " + JSON.stringify(CARD_AT));
if (!process.argv.includes("--write")) { console.log("Nothing written. Say --write to do it."); process.exit(0); }
const next = { ...plan, worksheetsOpen: { ...(plan.worksheetsOpen || {}), [KEY]: SHEET_AT }, assignments: plan.assignments.map(a => a.id === AID ? { ...a, opens: "date", opensAt: CARD_AT } : a) };
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify({ id: PLAN, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
console.log("wrote " + PLAN);
process.exit(0);
