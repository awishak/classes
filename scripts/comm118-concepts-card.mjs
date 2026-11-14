// Make COMM 118's Concepts in Team Communication sheet (worksheet key
// team-topics) count: a challenge card on the plan row and a grade for each
// student on its board, from the sheets. Andrew, 2026-11-14: "i want it to
// count", then, to five questions: "late but complete, complete, not
// submitted, no weight. yes to that name".
//
// The rules: handed in by the end of Tuesday, October 27 is Complete; handed
// in after is Late but complete; all five concepts written and never handed in
// is Complete; no sheet is Not submitted. Weight 0. The card is made hidden
// and the board is left unreleased; --release shows the card and releases.
//
//   esbuild scripts/comm118-concepts-card.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.concepts.mjs
//   node node_modules/.concepts.mjs                     prints
//   node node_modules/.concepts.mjs --write             card and board
//   node node_modules/.concepts.mjs --release --write   show the card, release

import { readFileSync } from "node:fs";
import { placeCard, releasePatch } from "../src/engine/grades.js";
import { schedulingLinkOf } from "../src/instructors.js";
import comm118 from "../src/config/comm118.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write"), release = process.argv.includes("--release");
const ID = "comm118-f26-v1", PLAN = "comm118-f26-v1-plan", AID = "concepts", AFTER = "s1";
const NOT_STUDENTS = ["Pepe LeFritz", "Jan Itor", "Marty McFly"];
// End of day Tuesday, October 27, Pacific, with the minute after midnight allowed.
const DUE = Date.parse("2026-10-28T07:01:00Z");
const CARD = {
  id: AID, title: "Concepts in Team Communication", due: "Oct 27", dueTime: "11:59 PM", opens: "now", opensAt: "", closeAt: "",
  scale: "complete", rubric: [], weight: 0, visible: false,
  description: "The goal here is to be observant, opinionated, and most of all, curious.",
  instructionsUrl: "https://classes.andrewishak.com/comm118/worksheets/team-topics",
};
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + " " + r.status); return r.json(); };
const put = async (id, data) => { const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }) }); if (!w.ok) throw new Error("write " + id + ": " + w.status + " " + (await w.text()).slice(0, 200)); return (await w.json())[0].data; };

const plan = (await get(`app_data?id=eq.${PLAN}&select=data`))[0].data;
let cls = (await get(`app_data?id=eq.${ID}&select=data`))[0].data;
const has = (plan.assignments || []).find(a => a.id === AID);

if (release) {
  if (!has) throw new Error("no " + AID + " card yet; run without --release first");
  const cards = cls.gradeBoard?.[AID]?.cards || {};
  if (Object.keys(cards).length !== 25 || cls.gradeBoard[AID].released) throw new Error("board is not 25 unreleased cards");
  const next = releasePatch(cls, AID, Date.now(), { meetingLink: schedulingLinkOf(comm118) });
  const counts = {}; Object.keys(cards).forEach(n => { const g = (next.assignmentLog[AID][n] || []).filter(e => e.type === "grade").pop(); counts[g?.letter || "none"] = (counts[g?.letter || "none"] || 0) + 1; });
  console.log("release:", JSON.stringify(counts));
  if (!write) { console.log("Nothing written."); process.exit(0); }
  await put(PLAN, { ...plan, assignments: plan.assignments.map(a => a.id === AID ? { ...a, visible: true } : a) });
  const back = await put(ID, next);
  console.log("card shown, released " + Object.keys(back.assignmentLog[AID]).length + " grades");
  process.exit(0);
}

if (has) throw new Error(AID + " is already on the plan row");
const students = plan.students.filter(s => !NOT_STUDENTS.includes(s.name));
if (students.length !== 25) throw new Error("expected 25 students, found " + students.length);
const sheets = await get("worksheet_sheets?worksheet_key=eq.team-topics&group_key=eq.comm118&select=*&limit=1000");
const now = Date.now(), counts = {};
for (const [i, s] of students.entries()) {
  const sh = sheets.find(x => x.viewer_id.toLowerCase() === String(s.email || "").trim().toLowerCase());
  let bucket = "notsubmitted";
  if (sh?.first_submitted_at) bucket = Date.parse(sh.first_submitted_at) <= DUE ? "complete" : "late-c";
  else if (sh) { const an = await get(`worksheet_answers?select=field,value&sheet_id=eq.${sh.id}&limit=2000`); if (new Set(an.filter(a => /^topic:/.test(a.field) && String(a.value).trim()).map(a => a.field)).size >= 5) bucket = "complete"; }
  counts[bucket] = (counts[bucket] || 0) + 1;
  cls = placeCard(cls, AID, s.name, bucket, now + i);
}
const at = plan.assignments.findIndex(a => a.id === AFTER);
const assignments = [...plan.assignments.slice(0, at + 1), CARD, ...plan.assignments.slice(at + 1)];
console.log("card after " + AFTER + ": " + CARD.title + ", weight " + CARD.weight + ", hidden");
console.log("board:", JSON.stringify(counts));
if (!write) { console.log("Nothing written."); process.exit(0); }
await put(PLAN, { ...plan, assignments });
const back = await put(ID, cls);
console.log("wrote the card and " + Object.keys(back.gradeBoard[AID].cards).length + " cards on the board, unreleased");
