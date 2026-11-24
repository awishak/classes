// Move cards Andrew has called, one challenge at a time, and release only
// those. The board is on the plan row and the logs are on the class row, so
// both are written. Reads a moves file kept out of the repo (it names
// students): { "aid": "audio-pre", "moves": [{ "name", "was", "bucket",
// "sign"?, "comment"? }] }. `was` is the column the card must be in now.
//
// Stops if a card is not where the file says, and stops unless a release
// changes exactly the students in the file. A comment on a card is left alone
// unless the move names one. Add --no-release to move without releasing.
//
//   node scripts/grade-moves.mjs comm3 private/grade-flow/moves.json            prints
//   node scripts/grade-moves.mjs comm3 private/grade-flow/moves.json --write    writes
import { readFileSync } from "node:fs";
import { placeCard, writeCard, releasePatch, boardOf, bucketOf, cardLetter } from "../src/engine/grades.js";
import { schedulingLinkOf } from "../src/instructors.js";
import comm3 from "../src/config/comm3.js";
import comm118 from "../src/config/comm118.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" };
const args = process.argv.slice(2), flags = args.filter(a => a.startsWith("--")), [which, file] = args.filter(a => !a.startsWith("--"));
const config = { comm3, comm118 }[which];
if (!config || !file) { console.error("Say the class (comm3 or comm118) and the moves file."); process.exit(1); }
const ID = config.storageKey, PLAN = ID + "-plan";
// With --board the second word is a challenge id, not a file: every sorted
// card stays where it is and the whole board is released.
const whole = flags.includes("--board");
let { aid, moves } = whole ? { aid: file, moves: null } : JSON.parse(readFileSync(ROOT + file, "utf8"));
const rowOf = async (id) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H }); if (!r.ok) throw new Error("read " + id + ": " + r.status); return (await r.json())[0].data; };
const cls = await rowOf(ID), plan = await rowOf(PLAN);
if (!plan.gradeBoard) throw new Error("the plan row has no gradeBoard");
if (whole) moves = Object.entries(plan.gradeBoard[aid]?.cards || {}).filter(([, c]) => c.bucket).map(([name, c]) => ({ name, was: c.bucket, bucket: c.bucket, sign: c.sign || "" }));
const last = (d, n) => (d.assignmentLog?.[aid]?.[n] || []).filter(e => e.type === "grade" && !e.deleted).sort((a, b) => a.ts - b.ts).pop();
let next = { ...cls, gradeBoard: plan.gradeBoard }, now = Date.now();
for (const m of moves) {
  const card = boardOf(next, aid).cards?.[m.name] || {};
  if ((card.bucket || null) !== (m.was || null)) throw new Error(m.name + " is in " + (card.bucket || "the pile") + ", not " + (m.was || "the pile"));
  if (!bucketOf(m.bucket)) throw new Error("no column " + m.bucket);
  next = writeCard(next, aid, m.name, { sign: m.sign || "", ...(m.comment !== undefined ? { comment: m.comment } : {}) }, now++);
  next = placeCard(next, aid, m.name, m.bucket, now++);
  const c = boardOf(next, aid).cards[m.name];
  console.log(m.name + ": " + (m.was ? bucketOf(m.was).label : "not sorted") + " -> " + cardLetter(c, bucketOf(c.bucket)) + ", comment " + JSON.stringify(c.comment || ""));
}
const release = !flags.includes("--no-release");
if (release) {
  // --no-meeting: the grade goes out without the meeting link a zero brings.
  next = releasePatch(next, aid, now++, flags.includes("--no-meeting") ? {} : { meetingLink: schedulingLinkOf(config) });
  const names = [...new Set([...Object.keys(cls.assignmentLog?.[aid] || {}), ...Object.keys(next.assignmentLog[aid])])];
  const touched = names.filter(n => JSON.stringify(last(cls, n) || null) !== JSON.stringify(last(next, n) || null));
  if (touched.length !== moves.length || touched.some(n => !moves.find(m => m.name === n))) throw new Error("a release would change " + touched.length + " grades, not the " + moves.length + " in the file: " + touched.join(", "));
  touched.forEach(n => { const had = cls.assignmentLog?.[aid]?.[n] || []; console.log("  release adds for " + n + ": " + next.assignmentLog[aid][n].filter(e => !had.some(o => o.id === e.id)).map(e => e.type + (e.auto ? " (meeting link)" : "")).join(", ")); });
}
if (!flags.includes("--write")) { console.log("\nNothing written."); process.exit(0); }
const patch = async (id, data) => { const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=id`, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ data }) }); const out = await w.json(); if (!w.ok || !out.length) throw new Error("write " + id + ": " + w.status); };
if (release) await patch(ID, { ...cls, assignmentLog: next.assignmentLog });
await patch(PLAN, { ...plan, gradeBoard: next.gradeBoard });
const back = await rowOf(ID), board = boardOf(await rowOf(PLAN), aid);
console.log("\nWritten" + (release ? " and released" : ", not released") + ". Read back: " + moves.map(m => m.name + " " + (release ? last(back, m.name).letter : cardLetter(board.cards[m.name], bucketOf(board.cards[m.name].bucket)))).join(", "));
