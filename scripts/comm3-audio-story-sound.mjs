// Sound notes on Claude's read of COMM 3's audio stories, measured off the
// audio itself. The pre-production read had these (comm3-audio-pre-sound.mjs);
// Andrew, 2026-11-16, of the stories: "did what we did with the pre-pro
// stories ... give me the timelines and all that." Only what is off is
// noted; a story with nothing off gets no notes.
//
// Reads ~/Projects/audio-story-grading/data.json and claude-read.json, and
// the timelines from the read file in the bucket (who is speaking when).
// Measures with the ffmpeg in ~/Projects/transcribe/bin: the whole file's
// level and its loudest sample, then the level of each stretch of the
// timeline. Writes each student's notes into claude-read.json as `sound`,
// [{ say, at }]; comm3-audio-story-read-push.mjs carries them to the page.
//   - the story is far quieter or louder than the class's usual level
//   - the loudest samples sit at the ceiling, which can sound distorted
//   - an interview or a clip much quieter or louder than the narration
//   - music louder than the narration
//
//   node scripts/comm3-audio-story-sound.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE = homedir() + "/Projects/audio-story-grading";
const FFMPEG = homedir() + "/Projects/transcribe/bin/ffmpeg";

const data = JSON.parse(readFileSync(BASE + "/data.json", "utf8"));
const mine = JSON.parse(readFileSync(BASE + "/claude-read.json", "utf8"));
const up = await (await fetch(`${SUPABASE_URL}/storage/v1/object/instructor/comm3-audio-story-read.json`, { headers: { apikey: key, Authorization: "Bearer " + key } })).json();

const mmss = (s) => { const n = Math.max(0, Math.round(s)); return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); };
const levelOf = (file, from = null, len = null) => {
  const args = ["-hide_banner", "-nostats", ...(from != null ? ["-ss", String(from), "-t", String(len)] : []), "-i", file, "-af", "volumedetect", "-vn", "-f", "null", "-"];
  const out = spawnSync(FFMPEG, args, { encoding: "utf8" }).stderr || "";
  const num = (re) => { const m = out.match(re); return m ? Number(m[1]) : null; };
  return { mean: num(/mean_volume: (-?[\d.]+) dB/), max: num(/max_volume: (-?[\d.]+) dB/), top: num(/histogram_0db: (\d+)/) || 0 };
};
const median = (list) => { const v = list.filter(x => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };

const rows = [];
for (const s of data.students) {
  const r = mine.students[s.id], t = up.students?.[s.email]?.timeline;
  if (!r || !s.audio?.file) continue;
  const whole = levelOf(s.audio.file);
  const parts = (t?.parts || []).filter(([a, b]) => b - a >= 4).map(([a, b, k]) => ({ a, b, k, mean: levelOf(s.audio.file, a, b - a).mean }));
  rows.push({ s, whole, parts });
  process.stdout.write(".");
}
console.log("");
const usual = median(rows.map(x => x.whole.mean));
console.log(`class's usual level: ${usual} dB, over ${rows.length} stories`);
let noted = 0;
for (const { s, whole, parts } of rows) {
  const notes = [];
  const you = median(parts.filter(p => p.k === "you").map(p => p.mean));
  if (whole.mean != null && whole.mean <= usual - 7) notes.push({ say: `The whole story is quiet, about ${Math.round(usual - whole.mean)} dB under the class's usual level.`, at: "" });
  if (whole.mean != null && whole.mean >= usual + 7) notes.push({ say: `The whole story is loud, about ${Math.round(whole.mean - usual)} dB over the class's usual level.`, at: "" });
  if (whole.max != null && whole.max >= -0.1 && whole.top > 2000) notes.push({ say: "The loudest moments sit at the ceiling, which can sound distorted.", at: "" });
  for (const [kind, name] of [["interview", "interview"], ["broadcast", "outside clip"]]) {
    if (you == null) continue;
    const off = parts.filter(p => p.k === kind && p.mean != null && Math.abs(p.mean - you) >= 7).sort((p, q) => Math.abs(q.mean - you) - Math.abs(p.mean - you))[0];
    if (off) notes.push({ say: `The ${name} here is about ${Math.round(Math.abs(off.mean - you))} dB ${off.mean < you ? "quieter" : "louder"} than the narration.`, at: mmss(off.a) });
  }
  const music = parts.filter(p => p.k === "music" && p.mean != null && you != null && p.mean >= you + 4).sort((p, q) => q.mean - p.mean)[0];
  if (music) notes.push({ say: `The music or field audio here is about ${Math.round(music.mean - you)} dB louder than the narration.`, at: mmss(music.a) });
  if (notes.length) { mine.students[s.id].sound = notes; noted++; console.log(`${s.name}: ${notes.map(n => (n.at ? n.at + " " : "") + n.say).join(" | ")}`); }
  else delete mine.students[s.id].sound;
}
writeFileSync(BASE + "/claude-read.json", JSON.stringify(mine, null, 1));
console.log(`${noted} stories with sound notes, written to claude-read.json`);
