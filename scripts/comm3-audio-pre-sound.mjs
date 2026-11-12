// Sound notes on Claude's read of COMM 3's audio story pre-production.
// Andrew, 2026-11-12: "when you comment on sound, clip them and show them."
// On the review each note carries the time the problem starts, and pressing
// the time plays the clip from there.
//
// ~/Projects/audio-pre-grading/sound.json is { [email]: [{ say, at }] },
// written by sound.py there from measure.py's numbers: a voice far under the
// class's usual level, a clip that distorts, another voice much quieter or
// louder than the narration. Only what is off; a clip with nothing off has no
// notes. This puts each list on the student's read as `sound`.
//
//   node scripts/comm3-audio-pre-sound.mjs           prints
//   node scripts/comm3-audio-pre-sound.mjs --write   uploads

import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const PATH = "instructor/comm3-audio-pre-read.json";

const sound = JSON.parse(readFileSync(homedir() + "/Projects/audio-pre-grading/sound.json", "utf8"));
const got = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { headers: H });
if (!got.ok) throw new Error("no read file: " + got.status);
const read = await got.json();
let n = 0;
for (const [email, r] of Object.entries(read.students)) { if (sound[email]) { r.sound = sound[email]; n++; } else delete r.sound; }
console.log(`${n} reads with sound notes, of ${Object.keys(read.students).length}.`);
if (!process.argv.includes("--write")) { console.log("Nothing uploaded. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(read) });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("uploaded " + PATH);
