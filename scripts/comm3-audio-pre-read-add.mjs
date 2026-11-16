// Add late reads to Claude's read of COMM 3's audio story pre-production
// without touching the reads already there.
//
// Andrew, 2026-11-16, on four clips that came in after the read of
// 2026-11-12: "yes" to reading them and adding them to the review page.
//
// comm3-audio-pre-read-push.mjs writes the whole file from claude-read.json,
// and the file in the bucket has since been given the timeline, the writing
// style line, the sound notes, his calls on each part and the source names by
// other scripts. Running the push again would drop all of those. This reads
// the file from the bucket, builds only the students named, the same way the
// push does, and puts the file back with those students added. A student who
// already has a read is left alone unless --over is given.
//
//   node scripts/comm3-audio-pre-read-add.mjs <slug> [<slug> ..]           prints
//   node scripts/comm3-audio-pre-read-add.mjs <slug> [<slug> ..] --write   uploads

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
const PATH = `${SUPABASE_URL}/storage/v1/object/instructor/comm3-audio-pre-read.json`;
const GAP = 6;
const slugs = process.argv.slice(2).filter(a => !a.startsWith("--"));
const write = process.argv.includes("--write"), over = process.argv.includes("--over");
if (!slugs.length) { console.error("Name the students by slug."); process.exit(1); }

const data = JSON.parse(readFileSync(BASE + "/data.json", "utf8"));
const mine = JSON.parse(readFileSync(BASE + "/claude-read.json", "utf8"));
const got = await fetch(PATH, { headers: H });
if (!got.ok) throw new Error("no read file in the bucket: " + got.status);
const file = await got.json();
const before = Object.keys(file.students || {}).length;

const mmss = (s) => { const n = Math.max(0, Math.round(s)); return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); };
const PTS = { meets: 2, partly: 1, not: 0 };
const KINDS = { opener: ["Story", "Reversal of conventional wisdom", "Small conversation", "Field audio", "Confession", "Data", "Bold statement", "Question", "Introduction", "None"], closer: ["Callback", "Open questions", "The last word", "The turn", "Reflection", "Look ahead", "Field audio", "Listener", "Summary", "None"] };
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);

const stop = [], unplaced = [], added = [];
for (const id of slugs) {
  const s = data.students.find(x => x.id === id);
  if (!s) { stop.push(id + ": not in the pull"); continue; }
  // A student with no pre-production clip can be read off the audio story
  // they submitted: the read says story: { seconds }, and the transcript is
  // in story-transcripts/. Andrew, 2026-11-16, on David Castillo and Sidi
  // Gueye: "you rated opening, thesis, closing, and more."
  const fromStory = !s.clip && !!mine.students[id]?.story;
  if (!s.clip && !fromStory) { stop.push(s.name + ": no clip"); continue; }
  const length = fromStory ? mine.students[id].story.seconds : s.clip.seconds;
  if (file.students[s.email] && !over) { console.log(`${s.name}: already has a read, left alone`); continue; }
  const r = mine.students[id];
  if (!r) { stop.push(s.name + ": no read in claude-read.json"); continue; }
  for (const k of ["opener", "thesis", "closer"]) {
    if (!r[k] || !(r[k].verdict in PTS)) stop.push(`${s.name}: ${k} has no verdict`);
    if (KINDS[k] && !KINDS[k].includes(r[k]?.kind)) stop.push(`${s.name}: ${k} kind "${r[k]?.kind}" is not on the board`);
  }
  for (const k of ["interview", "structure", "news"]) if (!r[k]?.say) stop.push(`${s.name}: ${k} is empty`);
  r.read = r.read || (mine.reads || {})[id] || "";
  if (!r.read) stop.push(`${s.name}: no summary`);
  const tf = `${BASE}/${fromStory ? "story-transcripts" : "transcripts"}/${id}.json`;
  if (!existsSync(tf)) { stop.push(s.name + ": no transcript"); continue; }
  const segs = (JSON.parse(readFileSync(tf, "utf8")).segments || []).filter(x => String(x.text || "").trim());
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
  const total = length || at;
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
  // The clip by voice, the way comm3-audio-pre-timeline.mjs draws one: the
  // read's `voices` is [[first words or seconds, kind], ..] where the voice
  // changes; a clip starts as the student, and 2.5 seconds with no speech is
  // music and field audio.
  const QUIET = 2.5, r1 = (n) => Math.round(n * 10) / 10;
  const changes = [];
  let from = 0;
  for (const [phrase, kind] of r.voices || []) {
    if (!["you", "broadcast", "interview", "music"].includes(kind)) { stop.push(`${s.name}: voice kind "${kind}"`); continue; }
    if (typeof phrase === "number") { changes.push({ at: phrase, kind }); while (from < words.length && words[from].start < phrase) from++; continue; }
    const q = norm(phrase).slice(0, 5);
    let hit = -1;
    for (let i = from; i + q.length <= said.length; i++) if (q.every((w, j) => said[i + j] === w)) { hit = i; break; }
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
  const timeline = { seconds: r1(total), parts: parts.map(([a, b, k]) => [r1(a), r1(b), k]) };
  const entry = { ...r, meets, score, gaps: { say: [r.heard, quietSay].filter(Boolean).join(" ") }, seconds: length, transcript: turns.map(x => ({ at: mmss(x.start), text: x.text })), timeline };
  delete entry.heard; delete entry.voices; delete entry.story;
  console.log(`  ${s.name} by voice: ` + ["you", "broadcast", "interview", "music"].map(k => k + " " + mmss(timeline.parts.filter(p => p[2] === k).reduce((n, p) => n + p[1] - p[0], 0))).join(", "));
  file.students[s.email] = entry;
  added.push(`${s.name}: opener ${r.opener.verdict} (${r.opener.at || "no time"}), thesis ${r.thesis.verdict} (${r.thesis.at || "no time"}), closer ${r.closer.verdict} (${r.closer.at || "no time"}), score ${score}`);
}
if (stop.length) { console.error("Not ready:\n  " + stop.join("\n  ")); process.exit(1); }
console.log(`In the bucket: ${before} reads. Adding ${added.length}:`);
added.forEach(a => console.log("  " + a));
if (unplaced.length) console.log("  quotes with no time found (shown without one): " + unplaced.join("; "));
if (!write) { console.log("\nNothing uploaded. Say --write."); process.exit(0); }
if (!added.length) { console.log("Nothing to add."); process.exit(0); }
const w = await fetch(PATH, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(file) });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log(`uploaded: ${Object.keys(file.students).length} reads`);
