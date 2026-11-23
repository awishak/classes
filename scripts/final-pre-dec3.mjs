// COMM 3's final pre-production is due Thursday, December 3, at 11:59 PM, not
// Friday. Andrew, 2026-11-23: "let's make pre-pro due thursday not friday."
//
//   node scripts/final-pre-dec3.mjs           prints
//   node scripts/final-pre-dec3.mjs --write   writes
import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const id = "comm3-f26-v1-plan";
const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
const cur = (await r.json())[0].data;
const was = cur.assignments.find(a => a.id === "final-pre");
if (!was) throw new Error("no final-pre");
const OLD = "Friday is a workshop, and pre-production is due that night.";
const NEW = "Pre-production is due Thursday, December 3. Friday is a workshop.";
const next = {
  assignments: cur.assignments.map(a => (a.id === "final-pre" ? { ...a, due: "Dec 3", dueTime: "11:59 PM" } : a)),
  schedule: cur.schedule.map(w => ((w.items || []).some(i => i.asgId === "final-pre")
    ? { ...w, text: String(w.text || "").replace(OLD, NEW), items: w.items.map(i => (i.asgId === "final-pre" ? { ...i, date: "Thu" } : i)) } : w)),
};
console.log("final-pre:", was.due, was.dueTime, "->", "Dec 3 11:59 PM");
console.log(JSON.stringify(next.schedule.filter(w => (w.items || []).some(i => i.asgId === "final-pre")).map(w => [w.id, w.text, w.items.map(i => i.date)])));
if (write) {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=id`, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ data: { ...cur, ...next } }) });
  const out = await w.json();
  if (!w.ok || !out.length) throw new Error(`write: ${w.status} ${JSON.stringify(out)}`);
  console.log("written");
}
