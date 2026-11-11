// The visual story grade, four parts, as a table. Reads only the files the
// pull wrote (scripts/comm3-visual-grade-pull.mjs); touches no database.
//
// Andrew, 2026-11-10: imagery and storytelling "like 35, 35", then
// directions, then the work around the story (pre-production and peer
// comments). Imagery and storytelling letters come from a JSON file of
// letters, Claude's by default; directions and work are counted from the data.
//
//   node scripts/comm3-visual-grade-table.mjs
//   node scripts/comm3-visual-grade-table.mjs --letters ~/Projects/visual-story-grading/andrew-grades.json
//   node scripts/comm3-visual-grade-table.mjs --why      each directions and work letter explained
//
// Directions: A nothing wrong, B one slip, C two or more, D short of the
//   minimum but published to classmates. A slip is: submitted late; complete
//   but Submit never pressed; anything Submit would have refused (a missing
//   reason, a missing source line); or a slip written into the letters file.
// Work: pre-production on time 2, late or written but unsubmitted 1, none 0;
//   comments on classmates 8 or more 2, 4 to 7 is 1, 1 to 3 is half, none 0.
//   4 is A, 3 is B, 2 is C, under 2 is D.
// Overall: A 4, B 3, C 2, D 1, weighted 35 / 35 / 15 / 15, rounded to a letter.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const BASE = homedir() + "/Projects/visual-story-grading";
const argv = process.argv.slice(2);
const lettersFile = argv.includes("--letters") ? argv[argv.indexOf("--letters") + 1].replace(/^~/, homedir()) : BASE + "/claude-grades.json";
const why = argv.includes("--why");
const d = JSON.parse(readFileSync(BASE + "/data.json", "utf8"));
const L = JSON.parse(readFileSync(lettersFile, "utf8"));
const W = { i: 0.35, s: 0.35, d: 0.15, w: 0.15 };
const PT = { A: 4, B: 3, C: 2, D: 1 };
const letterOf = (x) => (x >= 3.5 ? "A" : x >= 2.5 ? "B" : x >= 1.5 ? "C" : "D");
const GRACE = 60 * 1000;   // a pre-production stamped inside the 11:59 PM minute is on time

function directions(s, g) {
  const st = s.story, slips = [];
  if (!st || (!st.images && !st.html)) return { letter: "-", slips: ["no story"] };
  if (st.html && !st.htmlFile) return { letter: "-", slips: ["HTML file never uploaded"] };
  const short = !st.html && (st.images < 6 || st.words < 150);
  if (st.late) slips.push("submitted late");
  if (!st.submitted) slips.push("Submit never pressed");
  const other = st.missing.filter(m => !/^Add \d+ more/.test(m));
  if (other.length) slips.push(other.length + " thing" + (other.length === 1 ? "" : "s") + " Submit would refuse: " + other.join(" "));
  if (!st.html && (st.images > 8 || st.words > 300)) slips.push("over the limit");
  (g?.slips || []).forEach(x => slips.push(x));
  if (short) return { letter: st.images >= 6 ? "D" : "revise", slips: [`${st.images} images, ${st.words} words`, ...slips] };
  return { letter: slips.length === 0 ? "A" : slips.length === 1 ? "B" : "C", slips };
}

function work(s) {
  const p = s.pre, c = s.comments.onOthers;
  const onTime = p?.submitted && Date.parse(p.submitted) <= Date.parse(d.preDue) + GRACE;
  const written = p && Object.values(p.answers || {}).some(v => String(v || "").trim());
  const pre = onTime ? 2 : p?.submitted || written ? 1 : 0;
  const com = c >= 8 ? 2 : c >= 4 ? 1 : c >= 1 ? 0.5 : 0;
  const sum = pre + com;
  const say = `pre-production ${onTime ? "on time" : p?.submitted ? "late" : written ? "written, never submitted" : "none"}; ${c} comment${c === 1 ? "" : "s"} on classmates${s.comments.onOwn ? ", and their own" : ""}`;
  return { letter: sum >= 4 ? "A" : sum >= 3 ? "B" : sum >= 2 ? "C" : sum > 0 ? "D" : "-", say };
}

const pad = (x, n) => String(x).padEnd(n);
const rowsOut = [];
for (const sec of [...new Set(d.students.map(s => s.section))]) {
  console.log(`\n${sec}\n${pad("", 26)}Imag  Story  Dir     Work  Overall`);
  for (const s of d.students.filter(x => x.section === sec).sort((a, b) => a.name.split(" ").pop().localeCompare(b.name.split(" ").pop()))) {
    const g = L[s.id], dir = directions(s, g), wk = work(s);
    let overall = "";
    if (g && PT[dir.letter] && PT[wk.letter]) overall = letterOf(PT[g.i] * W.i + PT[g.s] * W.s + PT[dir.letter] * W.d + PT[wk.letter] * W.w);
    else if (dir.letter === "revise") overall = "Please revise";
    else if (dir.letter === "-") overall = "Not submitted";
    else if (g && PT[dir.letter]) overall = letterOf(PT[g.i] * W.i + PT[g.s] * W.s + PT[dir.letter] * W.d) + "?";
    const near = g?.near ? ` (${g.near === "i" ? "imagery" : "story"} close to the next letter up)` : "";
    console.log(`${pad(s.name, 26)}${pad(g?.i || "-", 6)}${pad(g?.s || "-", 7)}${pad(dir.letter, 8)}${pad(wk.letter, 6)}${overall}${near}`);
    rowsOut.push({ id: s.id, name: s.name, section: s.section, imagery: g?.i || "", story: g?.s || "", near: g?.near || "", directions: dir.letter, slips: dir.slips, work: wk.letter, workSay: wk.say, overall });
    if (why) { if (dir.slips.length) console.log("      directions: " + dir.slips.join("; ")); console.log("      work: " + wk.say); }
  }
}

// --json also writes the rows to table.json, for the page (comm3-visual-grade-page.mjs).
if (argv.includes("--json")) { const { writeFileSync } = await import("node:fs"); writeFileSync(BASE + "/table.json", JSON.stringify(rowsOut, null, 1)); console.log("\nwrote " + BASE + "/table.json"); }
