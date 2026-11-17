// Put Claude's read of COMM 3's audio stories where the review page finds
// the file: comm3-audio-story-read.json in the private instructor bucket.
// The reads name students and this repo is public, so the file is never in
// the repo; /api/sitdown-sheet?sheet=audio-story hands the file to a
// signed-in instructor and nobody else (storypages.jsx AudioStoryReview). No
// student route reads this file.
//
// Andrew, 2026-11-16: "let's now grade audio stories. you do a quick read and
// go through the transcripts of each audio story and you tell me what your
// read is. make me a page to read all this. and let me know if a student was
// late or did not submit the pre-production."
//
// Reads, from ~/Projects/audio-story-grading/:
//   data.json              the pull (comm3-audio-story-pull.mjs)
//   claude-read.json       { notes: [..], students: { [slug]: { read, letter,
//                          why, opener, thesis, closer, interview, structure,
//                          news, heard, voices } } }; the same parts as the
//                          pre-production read, so the page draws both alike
//   transcripts/<slug>.json  the transcriber's words with their times
// Adds to each student the transcript by turn, the clip by voice, the
// stretches with no speech, the count of parts that meet the board, and the
// flags: story late, story not submitted, pre-production late or never
// submitted. A student with no read is listed with their flags under absent.
//
//   node scripts/comm3-audio-story-read-push.mjs             prints
//   node scripts/comm3-audio-story-read-push.mjs --partial   prints, reads so far
//   node scripts/comm3-audio-story-read-push.mjs --write     uploads

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const BASE = homedir() + "/Projects/audio-story-grading";
const PATH = "instructor/comm3-audio-story-read.json";
const GAP = 6, QUIET = 2.5;
const write = process.argv.includes("--write"), partial = process.argv.includes("--partial");

const data = JSON.parse(readFileSync(BASE + "/data.json", "utf8"));
const mine = JSON.parse(readFileSync(BASE + "/claude-read.json", "utf8"));
const mmss = (s) => { const n = Math.max(0, Math.round(s)); return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); };
const r1 = (n) => Math.round(n * 10) / 10;
const PTS = { meets: 2, partly: 1, not: 0 };
const KINDS = { opener: ["Story", "Reversal of conventional wisdom", "Small conversation", "Field audio", "Confession", "Data", "Bold statement", "Question", "Introduction", "None"], closer: ["Callback", "Open questions", "The last word", "The turn", "Reflection", "Look ahead", "Field audio", "Listener", "Summary", "None"] };
const LETTERS = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
const day = (iso) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// What he asked to be told about each student.
const flagsOf = (s) => [
  !s.sheet || !s.submitted ? (s.audio ? "Story not submitted, audio is up" : "Story not submitted") : null,
  s.late ? "Story submitted late, " + day(s.submitted) : null,
  !s.pre.submitted ? "No pre-production" : s.pre.late ? "Pre-production late, " + day(s.pre.submitted) : null,
].filter(Boolean);

const students = {}, absent = {};
const stop = [], unplaced = [];
for (const s of data.students) {
  const r = mine.students[s.id];
  if (!s.audio || !r) {
    if (s.audio && !partial) stop.push(s.name + ": has audio and no read");
    const f = flagsOf(s);
    if (f.length) absent[s.email] = f;
    continue;
  }
  for (const k of ["opener", "thesis", "closer"]) {
    if (!r[k] || !(r[k].verdict in PTS)) stop.push(`${s.name}: ${k} has no verdict`);
    if (KINDS[k] && !KINDS[k].includes(r[k]?.kind)) stop.push(`${s.name}: ${k} kind "${r[k]?.kind}" is not on the board`);
  }
  for (const k of ["interview", "structure", "news"]) if (!r[k]?.say) stop.push(`${s.name}: ${k} is empty`);
  if (!r.read) stop.push(`${s.name}: no summary`);
  if (!LETTERS.includes(r.letter)) stop.push(`${s.name}: letter "${r.letter}"`);
  const tf = `${BASE}/transcripts/${s.id}.json`;
  if (!existsSync(tf)) { stop.push(s.name + ": no transcript"); continue; }
  const segs = (JSON.parse(readFileSync(tf, "utf8")).segments || []).filter(x => String(x.text || "").trim());
  const turns = [];
  for (const x of segs) {
    const last = turns[turns.length - 1];
    if (last && x.start - last.end < 2) { last.text += " " + x.text.trim(); last.end = x.end; }
    else turns.push({ start: x.start, end: x.end, text: x.text.trim() });
  }
  const words = segs.flatMap(x => (x.words || []).filter(w => Number.isFinite(w.start) && Number.isFinite(w.end)));
  const spans = (words.length ? words : segs).map(w => [w.start, w.end]).sort((a, b) => a[0] - b[0]);
  const quiet = [];
  let at = 0;
  for (const [a, b] of spans) { if (a - at >= GAP) quiet.push([at, a]); at = Math.max(at, b); }
  const total = s.audio.seconds || at;
  if (total - at >= GAP) quiet.push([at, total]);
  const quietSay = quiet.length
    ? "No speech at " + quiet.map(([a, b]) => mmss(a) + " to " + mmss(b)).join(", ") + ", which is likely music or field audio."
    : "Speech runs the whole story with no gap of " + GAP + " seconds or more. Music under the voice would not show in a transcript.";
  const said = words.map(w => norm(w.word)[0] || "");
  const find = (phrase, from = 0) => {
    const q = norm(phrase).slice(0, 5);
    if (q.length < 3) return -1;
    for (let i = from; i + q.length <= said.length; i++) if (q.every((w, j) => said[i + j] === w)) return i;
    return -1;
  };
  for (const k of ["opener", "thesis", "closer"]) if (r[k]?.quote && !r[k].at) { const i = find(r[k].quote); r[k].at = i < 0 ? "" : mmss(words[i].start); if (i < 0) unplaced.push(`${s.name}: ${k}`); }
  // The clip by voice, the way comm3-audio-pre-timeline.mjs draws one.
  const changes = [];
  let from = 0;
  for (const [phrase, kind] of r.voices || []) {
    if (!["you", "broadcast", "interview", "music"].includes(kind)) { stop.push(`${s.name}: voice kind "${kind}"`); continue; }
    if (typeof phrase === "number") { changes.push({ at: phrase, kind }); while (from < words.length && words[from].start < phrase) from++; continue; }
    const hit = find(phrase, from);
    if (hit < 0) { stop.push(`${s.name}: voice change not found: "${phrase}"`); continue; }
    changes.push({ at: hit === 0 ? 0 : words[hit].start, kind });
    from = hit + 1;
  }
  const speech = [];
  for (const x of segs) { const last = speech[speech.length - 1]; if (last && x.start - last[1] < QUIET) last[1] = x.end; else speech.push([x.start, x.end]); }
  if (speech.length && speech[0][0] < QUIET) speech[0][0] = 0;
  if (speech.length && total - speech[speech.length - 1][1] < QUIET) speech[speech.length - 1][1] = total;
  const kindAt = (time) => { let k = "you"; for (const c of changes) if (c.at <= time + 0.001) k = c.kind; return k; };
  const parts = [];
  const put = (a, b, k) => { if (b - a < 0.05) return; const last = parts[parts.length - 1]; if (last && last[2] === k && a - last[1] < 0.05) last[1] = b; else parts.push([a, b, k]); };
  const still = (a, b) => { const cuts = [a, ...changes.map(c => c.at).filter(c => c > a && c < b), b]; for (let i = 0; i + 1 < cuts.length; i++) put(cuts[i], cuts[i + 1], kindAt(cuts[i]) === "broadcast" ? "broadcast" : "music"); };
  let upTo = 0;
  for (const [a, b] of speech) {
    if (a > upTo) still(upTo, a);
    const cuts = [a, ...changes.map(c => c.at).filter(c => c > a && c < b), b];
    for (let i = 0; i + 1 < cuts.length; i++) put(cuts[i], cuts[i + 1], kindAt(cuts[i]));
    upTo = b;
  }
  if (total > upTo) still(upTo, total);
  const meets = ["opener", "thesis", "closer"].filter(k => r[k]?.verdict === "meets").length;
  const entry = { ...r, meets, flags: flagsOf(s), headline: s.headline || "", gaps: { say: [r.heard, quietSay].filter(Boolean).join(" ") }, seconds: s.audio.seconds,
    transcript: turns.map(x => ({ at: mmss(x.start), text: x.text })), timeline: { seconds: r1(total), parts: parts.map(([a, b, k]) => [r1(a), r1(b), k]) } };
  delete entry.heard; delete entry.voices;
  students[s.email] = entry;
}
if (stop.length) { console.error("Not ready:\n  " + stop.join("\n  ")); process.exit(1); }

const out = { at: data.pulledAt, notes: mine.notes || [], students, absent };
const body = JSON.stringify(out);
const list = Object.values(students);
console.log(`${list.length} reads, ${Object.keys(absent).length} with no read and a flag, ${(body.length / 1024).toFixed(0)} KB.`);
console.log("  letters: " + LETTERS.map(l => [l, list.filter(r => r.letter === l).length]).filter(x => x[1]).map(x => x.join(" ")).join(", "));
for (const k of ["opener", "thesis", "closer"]) console.log(`  ${k}: ${list.filter(r => r[k].verdict === "meets").length} meet, ${list.filter(r => r[k].verdict === "partly").length} partly, ${list.filter(r => r[k].verdict === "not").length} not yet`);
console.log(`  interview: ${list.filter(r => r.interview.has).length}`);
if (unplaced.length) console.log("  quotes with no time found (shown without one): " + unplaced.join("; "));
if (!write) { console.log("\nNothing uploaded. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, {
  method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", "x-upsert": "true" }, body,
});
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("uploaded " + PATH);
