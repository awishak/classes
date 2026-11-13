// Put Andrew's notes to students into the private notes file the review
// page's "Your notes for" boxes read (instructor/comm3-audio-pre-notes.json,
// through /api/sitdown-sheet?sheet=audio-pre-notes). He dictates feedback;
// Claude writes each student's note from his words, positive first and then
// one to three things to work on, into a file outside this repo:
// ~/Projects/audio-pre-grading/<file>.json, { [the part of the email before
// the @]: note }. Nothing here reaches a student. A note he has already
// edited on the page is kept unless --over is given.
//
//   node scripts/comm3-audio-pre-notes.mjs notes-1.json           prints
//   node scripts/comm3-audio-pre-notes.mjs notes-1.json --write   uploads

import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const BASE = `${SUPABASE_URL}/storage/v1/object/instructor/`;
const name = process.argv[2];
if (!name || name.startsWith("--")) { console.error("Name the notes file."); process.exit(1); }
const mine = JSON.parse(readFileSync(homedir() + "/Projects/audio-pre-grading/" + name, "utf8"));
const read = await (await fetch(BASE + "comm3-audio-pre-read.json", { headers: H })).json();
// Students with no audio have no read and no card, so their emails come from
// the local pull. Their notes are stored for the release step.
const pull = JSON.parse(readFileSync(homedir() + "/Projects/audio-pre-grading/data.json", "utf8"));
const emails = Object.fromEntries([...pull.students.map(x => x.email), ...Object.keys(read.students)].map(e => [e.split("@")[0], e]));
const got = await fetch(BASE + "comm3-audio-pre-notes.json", { headers: H });
const file = (got.ok ? await got.json().catch(() => null) : null) || { notes: {} };
const at = new Date().toISOString();
for (const [who, note] of Object.entries(mine)) {
  const email = emails[who];
  if (!email) { console.error(who + ": not a student in the pull"); process.exit(1); }
  const had = String(file.notes?.[email]?.note || "").trim();
  if (had && had !== note && !process.argv.includes("--over")) { console.log(`${who}: kept the note already there (${had.length} characters)`); continue; }
  file.notes = { ...(file.notes || {}), [email]: { note, at } };
  console.log(`${who}: ${note.length} characters`);
}
if (!process.argv.includes("--write")) { console.log("Nothing uploaded. Say --write."); process.exit(0); }
const w = await fetch(BASE + "comm3-audio-pre-notes.json", { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(file) });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("uploaded the notes");
