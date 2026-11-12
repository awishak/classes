// Add the writing style line to Claude's read of COMM 3's audio story
// pre-production. Andrew, 2026-11-12: "can you also give me a 'does this
// have ChatGPT AI writing style' below music and field audio."
//
// The read is a judgment of each transcript, written by Claude after reading
// all of them, and kept out of this public repo with the rest of the reads:
// ~/Projects/audio-pre-grading/ai-style.json, { note, students: { [the part
// of the email before the @]: { level: strong | some | little, say, quotes }
// } }. This checks every quoted line is in that student's transcript, then
// puts each one on the student's read as `ai` and the note at the end of the
// class notes, in the private instructor bucket.
//
//   node scripts/comm3-audio-pre-ai.mjs           prints
//   node scripts/comm3-audio-pre-ai.mjs --write   uploads

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
const LEVELS = ["strong", "some", "little"];

const mine = JSON.parse(readFileSync(homedir() + "/Projects/audio-pre-grading/ai-style.json", "utf8"));
const got = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { headers: H });
if (!got.ok) throw new Error("no read file: " + got.status);
const read = await got.json();

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean).join(" ");
const stop = [];
for (const [email, r] of Object.entries(read.students)) {
  const a = mine.students[email.split("@")[0]];
  if (!a) { stop.push(email.split("@")[0] + ": no style read"); continue; }
  if (!LEVELS.includes(a.level) || !a.say) stop.push(email.split("@")[0] + ": no level or no words");
  const said = norm((r.transcript || []).map(t => t.text).join(" "));
  for (const q of a.quotes || []) if (!said.includes(norm(q))) stop.push(email.split("@")[0] + ": a quoted line is not in the transcript");
  r.ai = { level: a.level, say: a.say, quotes: a.quotes || [] };
}
if (stop.length) { console.error("Not ready:\n  " + stop.join("\n  ")); process.exit(1); }
read.notes = [...(read.notes || []).filter(n => !n.startsWith("The ChatGPT writing style line")), mine.note];
const list = Object.values(read.students);
console.log(`${list.length} reads. ` + LEVELS.map(l => `${l} ${list.filter(r => r.ai.level === l).length}`).join(", ") + ".");
if (!process.argv.includes("--write")) { console.log("Nothing uploaded. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(read) });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("uploaded " + PATH);
