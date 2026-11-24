// What the To Grade page counts, with the names behind each count. Reads only.
// Prints names, so run it for yourself.
//
// Andrew, 2026-11-24: "can we please grade everything that needs grading",
// then "it's unclear to me how to grade old stuff". This is the page's own
// rule (a hand-in or a regrade request newer than the last grade), split into
// work that has never had a grade and work that came in after one. A
// worksheet hand-in counts the way worksheetSubmits.js counts it: only for a
// student with no submission in the log yet, dated by the first submit.
//
//   node scripts/grading-queue.mjs

import { readFileSync } from "node:fs";
import { assignmentsOf } from "../src/engine/profileTask.js";
import { boardOf, alive, sortedCount } from "../src/engine/grades.js";
import comm3 from "../src/config/comm3.js";
import comm118 from "../src/config/comm118.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + ": " + r.status); return r.json(); };
const rowOf = async (id) => ((await get(`app_data?id=eq.${id}&select=data`))[0] || {}).data || {};
const last = (log, type) => log.filter(e => e.type === type).sort((a, b) => a.ts - b.ts).pop();
const day = (ts) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" });
const lower = (s) => String(s || "").trim().toLowerCase();

for (const config of [comm3, comm118]) {
  const cls = await rowOf(config.storageKey), plan = await rowOf(config.storageKey + "-plan");
  const data = { ...cls, ...plan };
  const sheets = await get(`worksheet_sheets?group_key=eq.${config.id}&select=worksheet_key,viewer_id,submitted_at,first_submitted_at&limit=5000`);
  const roster = (data.students || []).filter(s => s.email && !/\.test$/.test(s.email) && !/lurker/i.test(s.name || ""));
  console.log("\n" + config.code + ", " + roster.length + " students");
  for (const a of assignmentsOf(config, data)) {
    const board = boardOf(data, a.id), by = data.assignmentLog?.[a.id] || {};
    const key = (String(a.instructionsUrl || "").match(/\/worksheets\/([^/?#]+)/) || [])[1] || "";
    const fresh = [], after = [];
    roster.forEach(s => {
      const log = alive(by[s.name]).slice();
      const sheet = key && sheets.find(x => x.worksheet_key === key && x.submitted_at && lower(x.viewer_id) === lower(s.email));
      if (sheet && !log.some(e => e.type === "submission")) log.push({ type: "submission", ts: Date.parse(sheet.first_submitted_at || sheet.submitted_at) });
      const sub = [last(log, "submission"), last(log, "regrade")].filter(Boolean).sort((x, y) => y.ts - x.ts)[0], g = last(log, "grade");
      if (!sub || (g && sub.ts <= g.ts)) return;
      (g ? after : fresh).push(s.name + " (" + sub.type + " " + day(sub.ts) + (g ? ", graded " + (g.letter || g.bucket || "") + " " + day(g.ts) : "") + ")");
    });
    if (!fresh.length && !after.length) continue;
    console.log("\n  " + a.title + " [" + a.id + "]" + (a.scale === "complete" ? ", complete or not" : "") + ", weight " + (a.weight || 0) + ", due " + (a.due || "") + ", " + sortedCount(board) + " sorted, " + (board.released ? "released" : "not released") + (key ? ", worksheet " + key : ""));
    if (fresh.length) console.log("    never graded (" + fresh.length + "):\n      " + fresh.join("\n      "));
    if (after.length) console.log("    came in after a grade (" + after.length + "):\n      " + after.join("\n      "));
  }
}
