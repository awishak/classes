// COMM 118 gets the final pre-production challenge COMM 3 already has, due
// Thursday, December 3, at 11:59 PM, closed until the builder ships.
// Andrew, 2026-11-23: "yeah do that".
//
//   node scripts/comm118-final-pre.mjs           prints
//   node scripts/comm118-final-pre.mjs --write   writes
import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const get = async (id) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H }); if (!r.ok) throw new Error(`read ${id}: ${r.status}`); return (await r.json())[0].data; };
const model = (await get("comm3-f26-v1-plan")).assignments.find(a => a.id === "final-pre");
const id = "comm118-f26-v1-plan", cur = await get(id);
if (cur.assignments.some(a => a.id === "final-pre")) { console.log("already there:", JSON.stringify(cur.assignments.find(a => a.id === "final-pre"))); process.exit(0); }
const row = { ...model, id: "final-pre", due: "Dec 3", dueTime: "11:59 PM", opens: "never", instructionsUrl: "" };
const at = cur.assignments.findIndex(a => a.id === "final");
const assignments = [...cur.assignments.slice(0, at), row, ...cur.assignments.slice(at)];
console.log("adds before final:", JSON.stringify(row));
console.log("order:", assignments.map(a => a.id).slice(-5).join(", "));
if (write) {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=id`, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ data: { ...cur, assignments } }) });
  const out = await w.json();
  if (!w.ok || !out.length) throw new Error(`write: ${w.status} ${JSON.stringify(out)}`);
  console.log("written");
}
