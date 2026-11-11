// Put the visual story grades and comments on COMM 3's grade board. It sorts
// the cards and writes the comments; it does not release. Andrew looks the
// board over and presses Release himself.
//
// The grades come from the local grade view's data
// (~/Projects/visual-story-grading/view-data.js, built by
// comm3-visual-grade-view.mjs from Andrew's rulings in andrew.json over
// Claude's draft). Student names and grades live there, not in this repo.
//
// Andrew, 2026-11-10: pluses and minuses ("I'd like to give some minuses on
// these things"), no numbers behind them, and nothing turned in is Not
// submitted with his line on the card.
//
//   esbuild scripts/comm3-visual-story-grade.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.grade-vs.mjs && node node_modules/.grade-vs.mjs
//   ... node node_modules/.grade-vs.mjs --write

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { placeCard, writeCard, releasePatch, boardOf, BUCKETS, cardLetter, bucketOf } from "../src/engine/grades.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const show = process.argv.includes("--show") ? process.argv[process.argv.indexOf("--show") + 1] : "";
const ID = "comm3-f26-v1", PLAN = "comm3-f26-v1-plan", AID = "visual";

const src = readFileSync(homedir() + "/Projects/visual-story-grading/view-data.js", "utf8");
const people = JSON.parse(src.slice(src.indexOf("=") + 1).trim().replace(/;$/, ""));

// The overall grade as a column and a sign.
const PLACE = { "A": ["a", ""], "A-": ["a", "-"], "B+": ["b", "+"], "B": ["b", ""], "B-": ["b", "-"], "C+": ["c", "+"], "C": ["c", ""], "C-": ["c", "-"], "D": ["d", ""], "Not submitted": ["nosub", ""] };
if (!BUCKETS.find(b => b.id === "nosub")) throw new Error("the Not submitted column is missing from grades.js");

// The comment a student reads: the line under the grade first, then imagery
// and storytelling, each with what worked and what to do next time.
const commentOf = (p) => {
  const out = [];
  if (p.note) out.push(p.note);
  p.parts.filter(x => x.label === "Imagery" || x.label === "Storytelling").forEach(x => {
    const lines = [x.plus, x.enc].filter(Boolean);
    if (lines.length) out.push("**" + x.label + "**\n" + lines.join("\n"));
  });
  return out.join("\n\n");
};

const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`read ${q}: ${r.status}`); return r.json(); };
const rowOf = async (id) => ((await get(`app_data?id=eq.${id}&select=data`))[0] || {}).data;
const cls = await rowOf(ID), plan = await rowOf(PLAN);
if (!cls || !plan) throw new Error("no class row or no plan row");
// The board lives on whichever row already holds gradeBoard for this class.
const where = plan.gradeBoard ? PLAN : cls.gradeBoard ? ID : null;
if (!where) throw new Error("neither row has a gradeBoard");
const cur = where === PLAN ? plan : cls;
const assignments = [plan.assignments, cls.assignments].map(a => (Array.isArray(a) ? a : Object.values(a || {}))).flat();
const asg = assignments.find(a => a && a.id === AID);
console.log(`board on ${where}; assignment ${AID}: ${asg ? asg.title + ", scale " + (asg.scale || "letters") : "NOT FOUND in the saved assignments (it may come from the config file)"}`);
const board = boardOf(cur, AID);
console.log(`cards on the board now: ${Object.keys(board.cards || {}).length}, sorted ${Object.values(board.cards || {}).filter(c => c.bucket).length}, released: ${board.released ? new Date(board.released.at).toISOString() : "no"}`);

const roster = (plan.students || []).map(s => s.name);
const missing = people.filter(p => !roster.includes(p.name)).map(p => p.name);
if (missing.length) throw new Error("not on the roster by that name: " + missing.join(", "));
const bad = people.filter(p => !PLACE[p.overall]);
if (bad.length) throw new Error("no column for: " + bad.map(p => p.name + " (" + p.overall + ")").join(", "));

let next = cur;
const now = Date.now();
people.forEach((p, i) => {
  const [bucket, sign] = PLACE[p.overall];
  next = writeCard(next, AID, p.name, { comment: commentOf(p), sign }, now + i);
  next = placeCard(next, AID, p.name, bucket, now + i);
});
const counts = {};
people.forEach(p => { counts[p.overall] = (counts[p.overall] || 0) + 1; });
console.log(Object.keys(PLACE).filter(k => counts[k]).map(k => counts[k] + " " + k).join(", "));
const unruled = people.filter(p => !p.ruled);
if (unruled.length) console.log("still Claude's grade, not Andrew's: " + unruled.map(p => p.name + " " + p.overall).join(", "));

// What a release would send, worked out on a copy and thrown away.
const after = releasePatch(next, AID, now + people.length, {});
const sent = people.map(p => (after.assignmentLog[AID][p.name] || []).filter(e => e.board).pop());
const wrong = people.filter((p, i) => !sent[i] || sent[i].letter !== p.overall);
console.log(wrong.length ? "A release would NOT send the right letter to: " + wrong.map(p => p.name).join(", ") : "a release would send every student the letter above");
if (show) { const p = people.find(x => x.name.toLowerCase().includes(show.toLowerCase())); if (p) console.log(`\n--- ${p.name}, ${cardLetter(next.gradeBoard[AID].cards[p.name], bucketOf(PLACE[p.overall][0]))} ---\n${commentOf(p)}\n`); }

if (!write) { console.log("\nNothing written. Say --write to sort the cards and write the comments. Release stays with Andrew."); process.exit(0); }
if (wrong.length) throw new Error("not writing: the letters would not come out right");
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
  method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
  body: JSON.stringify({ id: where, data: next, updated_at: new Date().toISOString() }),
});
if (!w.ok) throw new Error(`write ${where}: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log(`wrote ${where}: ${people.length} cards sorted with comments on ${AID}. Not released.`);
