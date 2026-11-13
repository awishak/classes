// Claude's read of COMM 3's audio story pre-production, said to the student.
// Andrew, 2026-11-12, on what a student gets back: "what about the info,
// opening closing etc?" The read's sentences were written about the student
// for him. ~/Projects/audio-pre-grading/you.json is { [email]: { opener,
// thesis, closer, interview, structure, news } }, the same sentences with
// every fact kept and the student addressed as you. This puts each on the
// student's read as `you`; /api/sitdown-sheet?sheet=audio-pre-feedback
// hands a student their own.
//
//   node scripts/comm3-audio-pre-you.mjs           prints
//   node scripts/comm3-audio-pre-you.mjs --write   uploads

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

const you = JSON.parse(readFileSync(homedir() + "/Projects/audio-pre-grading/you.json", "utf8"));
const got = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { headers: H });
if (!got.ok) throw new Error("no read file: " + got.status);
const read = await got.json();
let n = 0;
for (const [email, r] of Object.entries(read.students)) { if (you[email]) { r.you = you[email]; n++; } else delete r.you; }
console.log(`${n} reads said to the student, of ${Object.keys(read.students).length}.`);
if (!process.argv.includes("--write")) { console.log("Nothing uploaded. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${PATH}`, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(read) });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("uploaded " + PATH);
