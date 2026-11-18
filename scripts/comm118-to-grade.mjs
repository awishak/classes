// What is left to grade in COMM 118. Reads only.
//
// Andrew, 2026-11-17: "have we given grades for everything in comm 118?"
//
// For each assignment on the plan: when it is due, how many on the roster
// have handed in (for an assignment tied to a worksheet, off the sheets), how
// many are sorted on the grade board, whether the board is released, and how
// many have a grade in their log. Pending regrade requests are listed last.
//
//   esbuild scripts/comm118-to-grade.mjs --bundle --platform=node --format=esm --packages=external --jsx=automatic --loader:.js=jsx --outfile=node_modules/.to-grade.mjs && node node_modules/.to-grade.mjs

import { readFileSync } from "node:fs";
import { assignmentsOf } from "../src/engine/profileTask.js";
import { boardOf, alive, sortedCount, regradePending } from "../src/engine/grades.js";
import comm3 from "../src/config/comm118.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + ": " + r.status); return r.json(); };
const rowOf = async (id) => ((await get(`app_data?id=eq.${id}&select=data`))[0] || {}).data || {};

const cls = await rowOf("comm118-f26-v1"), plan = await rowOf("comm118-f26-v1-plan");
const data = { ...cls, ...plan, gradeBoard: { ...(plan.gradeBoard || {}), ...(cls.gradeBoard || {}) } }; // boards sit on both rows
const roster = (plan.students || []).filter(s => s.email && !/@(practice|example)\.test$/.test(s.email) && !/lurker/i.test(s.name || ""));
const emails = new Set(roster.map(s => String(s.email).trim().toLowerCase()));
const sheets = await get("worksheet_sheets?group_key=eq.comm118&select=worksheet_key,viewer_id,submitted_at&limit=5000");

console.log(`COMM 118, ${roster.length} on the roster.\n`);
console.log("weight  due      handed in  sorted  graded  released  assignment");
for (const a of assignmentsOf(comm3, data)) {
  const board = boardOf(data, a.id);
  const key = (String(a.instructionsUrl || "").match(/\/worksheets\/([^/?#]+)/) || [])[1] || "";
  const inSheets = key ? sheets.filter(s => s.worksheet_key === key && s.submitted_at && emails.has(String(s.viewer_id).toLowerCase())).length : null;
  const logs = data.assignmentLog?.[a.id] || {};
  const inLog = roster.filter(s => alive(logs[s.name]).some(e => e.type === "submit" || e.type === "submission")).length;
  const graded = roster.filter(s => alive(logs[s.name]).some(e => e.type === "grade")).length;
  const handed = inSheets != null ? inSheets : inLog;
  console.log(`${String(a.weight || 0).padStart(5)}   ${String(a.due || "").padEnd(7)}  ${String(handed).padStart(9)}  ${String(sortedCount(board)).padStart(6)}  ${String(graded).padStart(6)}  ${(board.released ? "yes" : "no").padEnd(8)}  ${a.title}${a.scale === "complete" ? " (complete)" : ""}${key ? "" : "  [no worksheet]"}`);
}
console.log("\nRegrade requests waiting:");
let n = 0;
for (const a of assignmentsOf(comm3, data)) for (const s of roster) {
  if (regradePending(alive(data.assignmentLog?.[a.id]?.[s.name]))) { console.log(`  ${s.name}: ${a.title}`); n++; }
}
if (!n) console.log("  none");
const types = new Set();
Object.values(data.assignmentLog || {}).forEach(by => Object.values(by).forEach(log => (log || []).forEach(e => types.add(e.type))));
console.log("\n(log entry types seen: " + [...types].join(", ") + ")");

console.log("\nHanded in or sorted, no grade in the log:");
for (const a of assignmentsOf(comm3, data)) {
  const logs = data.assignmentLog?.[a.id] || {};
  const miss = roster.filter(s => { const l = alive(logs[s.name]); return !l.some(e => e.type === "grade"); }).map(s => s.name);
  console.log(`  ${a.id} (${a.title}): ${miss.length} without a grade${miss.length && miss.length <= 8 ? ": " + miss.join(", ") : ""}`);
}
