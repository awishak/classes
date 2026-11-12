// The clip as a timeline on Claude's read of COMM 3's audio story
// pre-production. Andrew, 2026-11-12: "make the music and field audio part a
// colored timeline. their speech, broadcast, interview, music and field
// audio."
//
// Reads, from ~/Projects/audio-pre-grading/:
//   data.json            the pull (comm3-audio-pre-pull.mjs), for who each clip is
//   segments/<slug>.json the transcriber's segments with their times
//                        (~/Projects/transcribe bin/transcribe.py on clips/)
//   voices.json          { [the part of the email before the @]: [[phrase,
//                        kind], ..] }: where the voice changes, in order, by
//                        the first words said, or by a time in seconds. kind is you, broadcast,
//                        interview or music. Claude's reading of each
//                        transcript; a clip starts as the student.
// A stretch of 2.5 seconds or more with no speech is music and field audio.
// Music under a voice does not show: the times come from speech alone. A
// change of voice inside a segment is placed by the word's position in the
// segment. Puts { seconds, parts: [[from, to, kind], ..] } on each read as
// `timeline`, in the private instructor bucket.
//
//   node scripts/comm3-audio-pre-timeline.mjs           prints
//   node scripts/comm3-audio-pre-timeline.mjs --write   uploads

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const BASE = homedir() + "/Projects/audio-pre-grading";
const PATH = "instructor/comm3-audio-pre-read.json";
const QUIET = 2.5;
const KINDS = ["you", "broadcast", "interview", "music"];

const data = JSON.parse(readFileSync(BASE + "/data.json", "utf8"));
const voices = JSON.parse(readFileSync(BASE + "/voices.json", "utf8"));
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
const r1 = (n) => Math.round(n * 10) / 10;

const show = process.argv.includes("--show");
const mmss = (n) => Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
const lines = {}, stop = [];
for (const s of data.students) {
  if (!s.clip) continue;
  const who = s.email.split("@")[0];
  const file = `${BASE}/segments/${s.id}.json`;
  if (!existsSync(file)) { stop.push(who + ": no segments"); continue; }
  const t = JSON.parse(readFileSync(file, "utf8"));
  const segs = (t.segments || []).filter(x => String(x.text || "").trim() && x.end > x.start);
  const total = Math.max(t.duration || 0, s.clip.seconds || 0, segs.length ? segs[segs.length - 1].end : 0);
  // Every word with a time, placed evenly inside its segment. A clip whose
  // broadcast audio the transcriber's voice filter skipped has a second pass
  // with the filter off (novad/<slug>.json); the words to find come from that
  // pass, and the stretches of speech still come from the first.
  const second = `${BASE}/novad/${s.id}.json`;
  const heard = existsSync(second) ? JSON.parse(readFileSync(second, "utf8")).segments.filter(x => String(x.text || "").trim() && x.end > x.start) : segs;
  const words = [];
  for (const x of heard) { const w = norm(x.text); w.forEach((word, i) => words.push({ word, at: x.start + ((x.end - x.start) * i) / w.length })); }
  // Where the voice changes, searched forward from the change before.
  const turns = [];
  let from = 0;
  for (const [phrase, kind] of voices[who] || []) {
    if (!KINDS.includes(kind)) { stop.push(`${who}: kind "${kind}"`); continue; }
    // A number is a time in seconds, for a change the transcriber's words do not show.
    if (typeof phrase === "number") { turns.push({ at: phrase, kind }); while (from < words.length && words[from].at < phrase) from++; if (show) console.log(`  ${who} ${mmss(phrase).padStart(5)} ${kind.padEnd(9)} (set by time)`); continue; }
    const q = norm(phrase);
    let at = -1;
    for (const n of [q.length, 4]) {
      const need = q.slice(0, Math.min(n, q.length));
      for (let i = from; i + need.length <= words.length; i++) if (need.every((w, j) => words[i + j].word === w)) { at = i; break; }
      if (at >= 0) break;
    }
    if (at < 0) { stop.push(`${who}: not found after ${Math.round(words[from]?.at || 0)}s: "${phrase}"`); continue; }
    turns.push({ at: at === 0 ? 0 : words[at].at, kind });
    if (show) console.log(`  ${who} ${mmss(words[at].at).padStart(5)} ${kind.padEnd(9)} ${words.slice(at, at + 9).map(w => w.word).join(" ")}`);
    from = at + 1;
  }
  if (!voices[who]) stop.push(who + ": no voices entry");
  // Stretches of speech: segments joined across a pause shorter than QUIET.
  const speech = [];
  for (const x of segs) { const last = speech[speech.length - 1]; if (last && x.start - last[1] < QUIET) last[1] = x.end; else speech.push([x.start, x.end]); }
  if (speech.length && speech[0][0] < QUIET) speech[0][0] = 0;
  if (speech.length && total - speech[speech.length - 1][1] < QUIET) speech[speech.length - 1][1] = total;
  const kindAt = (time) => { let k = "you"; for (const c of turns) if (c.at <= time + 0.001) k = c.kind; return k; };
  const parts = [];
  const add = (a, b, k) => { if (b - a < 0.05) return; const last = parts[parts.length - 1]; if (last && last[2] === k && a - last[1] < 0.05) last[1] = b; else parts.push([a, b, k]); };
  // A stretch with no speech is music and field audio, unless the voice then
  // is a broadcast clip the voice filter passed over.
  const quiet = (a, b) => { const cuts = [a, ...turns.map(c => c.at).filter(c => c > a && c < b), b]; for (let i = 0; i + 1 < cuts.length; i++) add(cuts[i], cuts[i + 1], kindAt(cuts[i]) === "broadcast" ? "broadcast" : "music"); };
  let at = 0;
  for (const [a, b] of speech) {
    if (a > at) quiet(at, a);
    const cuts = [a, ...turns.map(c => c.at).filter(c => c > a && c < b), b];
    for (let i = 0; i + 1 < cuts.length; i++) add(cuts[i], cuts[i + 1], kindAt(cuts[i]));
    at = b;
  }
  if (total > at) quiet(at, total);
  lines[s.email] = { seconds: r1(total), parts: parts.map(([a, b, k]) => [r1(a), r1(b), k]) };
}
for (const [email, l] of Object.entries(lines)) {
  const sum = (k) => l.parts.filter(p => p[2] === k).reduce((n, p) => n + p[1] - p[0], 0);
  console.log(email.split("@")[0].padEnd(18), mmss(l.seconds).padStart(5), KINDS.map(k => k + " " + mmss(sum(k))).join("  "), " parts", l.parts.length);
}
if (stop.length) { console.error("Not ready:\n  " + stop.join("\n  ")); process.exit(1); }
if (!process.argv.includes("--write")) { console.log("Nothing uploaded. Say --write."); process.exit(0); }
const got = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { headers: H });
if (!got.ok) throw new Error("no read file: " + got.status);
const read = await got.json();
let n = 0;
for (const [email, r] of Object.entries(read.students)) if (lines[email]) { r.timeline = lines[email]; n++; }
const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(read) });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log(`uploaded ${PATH}, ${n} timelines`);
