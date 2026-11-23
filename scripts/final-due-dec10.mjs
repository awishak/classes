// The final project in COMM 3 and COMM 118 is due Thursday, December 10, at
// 12:00 PM Pacific. Andrew, 2026-11-23: "dec 10 at 12 pm for both classes".
//
//   node scripts/final-due-dec10.mjs           prints what it finds
//   node scripts/final-due-dec10.mjs --write   writes
import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
for (const id of ["comm3-f26-v1-plan", "comm118-f26-v1-plan"]) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  const cur = (await r.json())[0].data;
  const was = cur.assignments.find(a => a.id === "final");
  if (!was) throw new Error("no final on " + id);
  const next = {
    assignments: cur.assignments.map(a => (a.id === "final" ? { ...a, due: "Dec 10", dueTime: "12:00 PM" } : a)),
    schedule: cur.schedule.map(w => {
      if (!(w.items || []).some(i => i.asgId === "final")) return w;
      return { ...w, text: String(w.text || "").replace("Final project due Friday, December 11.", "Final project due Thursday, December 10, at 12 PM."),
        items: w.items.map(i => (i.asgId === "final" ? { ...i, date: "Thu" } : i)) };
    }),
  };
  console.log(id, "final:", was.due, was.dueTime, "->", "Dec 10 12:00 PM");
  console.log("  week:", JSON.stringify(next.schedule.filter(w => (w.items || []).some(i => i.asgId === "final")).map(w => [w.id, w.text, w.items.map(i => i.date)])));
  if (!write) continue;
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=id`, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ data: { ...cur, ...next } }) });
  const out = await w.json();
  if (!w.ok || !out.length) throw new Error(`write ${id}: ${w.status} ${JSON.stringify(out)}`);
  console.log("  written");
}
