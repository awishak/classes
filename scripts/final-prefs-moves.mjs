// Build the moves file that sorts Final project preferences as Complete for
// every student who handed in by the deadline. Andrew, 2026-11-24: "can we
// grade some other assignments as complete?" Students who handed in after the
// deadline and students with nothing in are left unsorted for him to call.
// Reads only; writes one file under private/ (it names students) for
// grade-moves.mjs. Prints counts, and the late names for him.
//
//   node scripts/final-prefs-moves.mjs comm3
import { readFileSync, writeFileSync } from "node:fs";
const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + ": " + r.status); return r.json(); };
const cls = process.argv[2];
const ID = { comm3: "comm3-f26-v1", comm118: "comm118-f26-v1" }[cls];
if (!ID) { console.error("Which class? comm3 or comm118."); process.exit(1); }
const plan = (await get(`app_data?id=eq.${ID}-plan&select=data`))[0].data;
const asg = plan.assignments.find(a => /\/worksheets\/final-prefs/.test(a.instructionsUrl || ""));
if (!asg) throw new Error("no challenge links to final-prefs");
const set = (await get(`worksheet_deadlines?group_key=eq.${cls}&worksheet_key=eq.final-prefs&select=due_at`))[0]?.due_at;
const due = Date.parse(set || "2026-11-21T07:59:59Z");   // Friday, November 20, 11:59 PM Pacific
const sheets = await get(`worksheet_sheets?group_key=eq.${cls}&worksheet_key=eq.final-prefs&select=viewer_id,submitted_at,first_submitted_at`);
const roster = (plan.students || []).filter(s => s.email && !/\.test$/.test(s.email) && !/lurker/i.test(s.name || ""));
const cards = plan.gradeBoard?.[asg.id]?.cards || {};
// With --rest: the late ones go to Late but complete and the ones with
// nothing in go to Not submitted. Andrew, 2026-11-24: "either complete, late
// but complete, or not submitted". A hand-in is a submitted sheet or a
// submission on the challenge itself, whichever came first.
const rest = process.argv.includes("--rest");
const log = (await get(`app_data?id=eq.${ID}&select=data`))[0].data.assignmentLog?.[asg.id] || {};
const moves = [], late = [], none = [], sorted = [];
for (const s of roster) {
  const sh = sheets.find(x => String(x.viewer_id).toLowerCase() === String(s.email).trim().toLowerCase() && x.submitted_at);
  const times = [sh ? Date.parse(sh.first_submitted_at || sh.submitted_at) : null, ...(log[s.name] || []).filter(e => e.type === "submission" && !e.deleted).map(e => e.ts)].filter(Boolean);
  const at = times.length ? Math.min(...times) : null;
  if (cards[s.name]?.bucket) sorted.push(s.name);
  else if (!at) { none.push(s.name); if (rest) moves.push({ name: s.name, was: null, bucket: "notsubmitted" }); }
  else if (at > due) { late.push(s.name); if (rest) moves.push({ name: s.name, was: null, bucket: "late-c" }); }
  else moves.push({ name: s.name, was: null, bucket: "complete" });
}
const out = "private/grade-flow/moves-final-prefs-" + cls + ".json";
writeFileSync(ROOT + out, JSON.stringify({ aid: asg.id, moves }, null, 2) + "\n");
console.log(cls + " " + asg.title + " [" + asg.id + "], scale " + (asg.scale || "letters") + ", deadline " + new Date(due).toISOString() + (set ? "" : " (no deadline row, the plan's date used)"));
console.log("  on time, to sort as Complete: " + moves.length + "\n  already sorted: " + sorted.length);
console.log("  handed in after the deadline (" + late.length + "): " + late.join(", "));
console.log("  nothing handed in (" + none.length + "): " + none.join(", "));
console.log("wrote " + out);
