// Release his feedback on COMM 3's audio story pre-production to students.
// Andrew, 2026-11-12: "okay release it to students." The notes file in the
// private instructor bucket carries `released`; until it is true,
// /api/sitdown-sheet?sheet=audio-pre-feedback hands a student nothing.
//
//   node scripts/comm3-audio-pre-release.mjs           prints the state
//   node scripts/comm3-audio-pre-release.mjs --write   releases
//   node scripts/comm3-audio-pre-release.mjs --write --off   takes it back

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const PATH = `${SUPABASE_URL}/storage/v1/object/instructor/comm3-audio-pre-notes.json`;

const got = await fetch(PATH, { headers: H });
if (!got.ok) throw new Error("no notes file: " + got.status);
const file = await got.json();
console.log(`${Object.keys(file.notes || {}).length} notes. released: ${file.released === true}${file.releasedAt ? ", " + file.releasedAt : ""}`);
if (!process.argv.includes("--write")) process.exit(0);
const on = !process.argv.includes("--off");
file.released = on;
if (on) file.releasedAt = new Date().toISOString(); else delete file.releasedAt;
const w = await fetch(PATH, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(file) });
if (!w.ok) throw new Error(`upload: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log(on ? "released" : "taken back");
