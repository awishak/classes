// Count the week 8 check-in answers as week 9. The second check-in moved
// from week 8 to week 9 on 2026-11-09 after a few students had answered.
// Andrew, 2026-11-14: "don't make them answer week 9 again. just count it."
// Copies each answer and its submission from checkin-8 to checkin-9 in both
// classes; a student already in checkin-9 is left alone; checkin-8 stays.
//
//   node scripts/checkin-8-to-9.mjs            prints
//   node scripts/checkin-8-to-9.mjs --write    writes

import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
for (const id of ["comm3-f26-v1", "comm118-f26-v1"]) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H });
  const data = (await r.json())[0].data;
  const from = data.checkins?.["checkin-8"] || {}, to = { ...(data.checkins?.["checkin-9"] || {}) };
  const logTo = { ...(data.assignmentLog?.["checkin-9"] || {}) }, logFrom = data.assignmentLog?.["checkin-8"] || {};
  let n = 0;
  Object.entries(from).forEach(([name, a]) => { if (to[name]) return; to[name] = a; if (!logTo[name]) logTo[name] = (logFrom[name] || []).filter(e => e.type === "submission"); n++; });
  console.log(id + ": " + n + " answers copied to week 9, " + Object.keys(to).length + " in week 9 now");
  if (!write || !n) continue;
  const next = { ...data, checkins: { ...data.checkins, "checkin-9": to }, assignmentLog: { ...data.assignmentLog, "checkin-9": logTo } };
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify({ id, data: next, updated_at: new Date().toISOString() }) });
  if (!w.ok) throw new Error("write " + id + ": " + w.status + " " + (await w.text()).slice(0, 200));
  console.log("  wrote " + id);
}
if (!write) console.log("Nothing written. Say --write to do it.");
process.exit(0);
