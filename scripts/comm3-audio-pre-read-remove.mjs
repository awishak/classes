// Take named students' reads back out of Claude's read of COMM 3's audio
// story pre-production, leaving every other read as it is. The undo of
// comm3-audio-pre-read-add.mjs. Keeps a copy of what was removed in
// ~/Projects/audio-pre-grading/removed-<time>.json.
//
//   node scripts/comm3-audio-pre-read-remove.mjs <email> [<email> ..]           prints
//   node scripts/comm3-audio-pre-read-remove.mjs <email> [<email> ..] --write   uploads

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const PATH = `${SUPABASE_URL}/storage/v1/object/instructor/comm3-audio-pre-read.json`;
const who = process.argv.slice(2).filter(a => !a.startsWith("--")).map(e => e.toLowerCase());
if (!who.length) { console.error("Name the students by email."); process.exit(1); }

const got = await fetch(PATH, { headers: H });
if (!got.ok) throw new Error("no read file in the bucket: " + got.status);
const file = await got.json();
const out = {};
for (const e of who) { if (file.students[e]) { out[e] = file.students[e]; delete file.students[e]; console.log("removing " + e); } else console.log(e + ": no read there"); }
console.log(`${Object.keys(file.students).length} reads would be left.`);
if (!process.argv.includes("--write")) { console.log("Nothing uploaded. Say --write."); process.exit(0); }
if (!Object.keys(out).length) process.exit(0);
writeFileSync(`${homedir()}/Projects/audio-pre-grading/removed-${Date.now()}.json`, JSON.stringify(out, null, 1));
const w = await fetch(PATH, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(file) });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("uploaded");
