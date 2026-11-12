// Put Claude's read of COMM 3's audio story pre-production where the review
// page finds the file: comm3-audio-pre-read.json in the private instructor
// bucket, beside the Sit-Down sheets. The reads name students and this repo
// is public, so the file is never in the repo; /api/sitdown-sheet?sheet=
// audio-pre hands the file to a signed-in instructor and nobody else
// (control.jsx useInstructorRead, prepages.jsx PreReview).
//
// Andrew, 2026-11-12: "deploy a page for me to see, following our standard
// structure for review of assignments."
//
// Reads, from ~/Projects/audio-pre-grading/:
//   data.json            the pull (comm3-audio-pre-pull.mjs)
//   claude-read.json     { notes: [..], students: { [slug]: { opener, thesis,
//                        closer, interview, structure, news, heard } } }
//   transcripts/<slug>.json   whisper's words with their times
// Adds to each student the transcript by turn, the stretches with no speech
// (the start, any gap of six seconds or more, the end), the count of parts
// that meet the board, and a score to sort by. --local also writes the file
// to ~/Projects/audio-pre-grading/read.json, for looking before uploading.
//
//   node scripts/comm3-audio-pre-read-push.mjs           prints
//   node scripts/comm3-audio-pre-read-push.mjs --write   uploads

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const BASE = homedir() + "/Projects/audio-pre-grading";
const PATH = "instructor/comm3-audio-pre-read.json";
const GAP = 6;
const write = process.argv.includes("--write");

const data = JSON.parse(readFileSync(BASE + "/data.json", "utf8"));
const mine = JSON.parse(readFileSync(BASE + "/claude-read.json", "utf8"));
const mmss = (s) => { const n = Math.max(0, Math.round(s)); return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); };
const PTS = { meets: 2, partly: 1, not: 0 };
const KINDS = { opener: ["Story", "Reversal of conventional wisdom", "Small conversation", "Field audio", "Confession", "Data", "Bold statement", "Question", "Introduction", "None"], closer: ["Callback", "Open questions", "The last word", "The turn", "Reflection", "Look ahead", "Field audio", "Listener", "Summary", "None"] };

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
const students = {};
const stop = [], unplaced = [];
for (const s of data.students) {
  if (!s.clip) continue;
  const r = mine.students[s.id];
  // --partial puts up the reads written so far, to look at the page early.
  if (!r) { if (!process.argv.includes("--partial")) stop.push(s.name + ": no read"); continue; }
  for (const k of ["opener", "thesis", "closer"]) {
    if (!r[k] || !(r[k].verdict in PTS)) stop.push(`${s.name}: ${k} has no verdict`);
    if (KINDS[k] && !KINDS[k].includes(r[k]?.kind)) stop.push(`${s.name}: ${k} kind "${r[k]?.kind}" is not on the board`);
  }
  for (const k of ["interview", "structure", "news"]) if (!r[k]?.say) stop.push(`${s.name}: ${k} is empty`);
  // The short summary that opens each read, kept in one map so they read as a set.
  r.read = r.read || (mine.reads || {})[s.id] || "";
  if (!r.read) stop.push(`${s.name}: no summary`);
  const file = `${BASE}/transcripts/${s.id}.json`;
  if (!existsSync(file)) { stop.push(s.name + ": no transcript"); continue; }
  const t = JSON.parse(readFileSync(file, "utf8"));
  const segs = (t.segments || []).filter(x => String(x.text || "").trim());
  // Turns: segments joined until a pause of two seconds.
  const turns = [];
  for (const x of segs) {
    const last = turns[turns.length - 1];
    if (last && x.start - last.end < 2) { last.text += " " + x.text.trim(); last.end = x.end; }
    else turns.push({ start: x.start, end: x.end, text: x.text.trim() });
  }
  // Stretches with no speech, off the word times where there are any.
  const words = segs.flatMap(x => (x.words || []).filter(w => Number.isFinite(w.start) && Number.isFinite(w.end)));
  const spans = (words.length ? words : segs).map(w => [w.start, w.end]).sort((a, b) => a[0] - b[0]);
  const quiet = [];
  let at = 0;
  for (const [a, b] of spans) { if (a - at >= GAP) quiet.push([at, a]); at = Math.max(at, b); }
  const total = s.clip.seconds || at;
  if (total - at >= GAP) quiet.push([at, total]);
  const quietSay = quiet.length
    ? "No speech at " + quiet.map(([a, b]) => mmss(a) + " to " + mmss(b)).join(", ") + ", which is likely music or field audio."
    : "Speech runs the whole clip with no gap of " + GAP + " seconds or more. Music under the voice would not show in a transcript.";
  // When each quoted line is said: its first five words found in the words.
  const said = words.map(w => norm(w.word)[0] || "");
  const whenSaid = (quote) => {
    const q = norm(quote).slice(0, 5);
    if (q.length < 3) return "";
    for (let i = 0; i + q.length <= said.length; i++) if (q.every((w, j) => said[i + j] === w)) return mmss(words[i].start);
    return "";
  };
  for (const k of ["opener", "thesis", "closer"]) if (r[k]?.quote && !r[k].at) { r[k].at = whenSaid(r[k].quote); if (!r[k].at) unplaced.push(`${s.name}: ${k}`); }
  const meets = ["opener", "thesis", "closer"].filter(k => r[k]?.verdict === "meets").length;
  const score = ["opener", "thesis", "closer"].reduce((n, k) => n + (PTS[r[k]?.verdict] || 0), 0) * 10
    + (r.interview?.has ? 3 : 0) + ({ reported: 3, some: 1 }[r.news?.level] || 0) + (r.structure?.level === "clear" ? 2 : 0);
  students[s.email] = {
    ...r, meets, score,
    gaps: { say: [r.heard, quietSay].filter(Boolean).join(" ") },
    seconds: s.clip.seconds,
    transcript: turns.map(x => ({ at: mmss(x.start), text: x.text })),
  };
  delete students[s.email].heard;
}
if (stop.length) { console.error("Not ready:\n  " + stop.join("\n  ")); process.exit(1); }

// at is when the sheets were pulled, so a later hand-in shows as newer than the read.
const out = { at: data.pulledAt, notes: mine.notes || [], students };
if (process.argv.includes("--local")) writeFileSync(BASE + "/read.json", JSON.stringify(out, null, 1));
const body = JSON.stringify(out);
const list = Object.values(students);
console.log(`${list.length} reads, ${(body.length / 1024).toFixed(0)} KB.`);
for (const k of ["opener", "thesis", "closer"]) console.log(`  ${k}: ${list.filter(r => r[k].verdict === "meets").length} meet, ${list.filter(r => r[k].verdict === "partly").length} partly, ${list.filter(r => r[k].verdict === "not").length} not yet`);
console.log(`  interview: ${list.filter(r => r.interview.has).length}`);
if (unplaced.length) console.log("  quotes with no time found (shown without one): " + unplaced.join("; "));
if (!write) { console.log("\nNothing uploaded. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, {
  method: "POST", headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", "x-upsert": "true" }, body,
});
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("uploaded " + PATH);
