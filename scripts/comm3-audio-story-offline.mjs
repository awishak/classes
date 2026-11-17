// Build a copy of the audio story review that opens from disk with no
// connection, for reading on another machine. Andrew, 2026-11-16: "i want to
// review all this on the plane tomorrow on a different machine."
//
// Reads ~/Projects/audio-story-grading/ (data.json from the pull, the audio
// in clips/) and the read file as the review page gets it from the bucket,
// and writes ~/Projects/audio-story-grading/offline/:
//   index.html   open this
//   app.js       the review page, the same component the site draws
//   data.js      the sheets, the roster and Claude's read
//   clips/       every story's audio
// The folder names students and holds their work, so it is never in this
// repo. Move it by AirDrop or a drive.
//
//   node scripts/comm3-audio-story-offline.mjs

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const BASE = homedir() + "/Projects/audio-story-grading", OUT = BASE + "/offline";

const data = JSON.parse(readFileSync(BASE + "/data.json", "utf8"));
const got = await fetch(`${SUPABASE_URL}/storage/v1/object/instructor/comm3-audio-story-read.json`, { headers: { apikey: key, Authorization: "Bearer " + key } });
if (!got.ok) throw new Error("no read file in the bucket: " + got.status);
const read = await got.json();
const unlocks = await (await fetch(`${SUPABASE_URL}/rest/v1/worksheet_unlocks?select=sheet_id,until`, { headers: { apikey: key, Authorization: "Bearer " + key } })).json();
const untilOf = new Map(unlocks.map(u => [u.sheet_id, u.until]));

mkdirSync(OUT + "/clips", { recursive: true });
const files = {}, sheets = [];
let bytes = 0;
for (const s of data.students) {
  if (!s.sheet) continue;
  const answers = {};
  for (const k of ["headline", "listen", "credits", "sources"]) if (s[k]) answers[k] = s[k];
  for (const k of ["voices", "sounds", "chapters"]) if ((s[k] || []).length) answers[k] = JSON.stringify(s[k]);
  if (s.audio) {
    answers.audio = JSON.stringify({ path: s.audio.path, seconds: s.audio.seconds, name: s.audio.name });
    if (s.audio.file && existsSync(s.audio.file)) {
      const name = s.audio.file.split("/").pop();
      copyFileSync(s.audio.file, `${OUT}/clips/${name}`);
      bytes += statSync(s.audio.file).size;
      files[s.audio.path] = "clips/" + name;
    }
  }
  sheets.push({ id: s.sheet, viewer_id: s.email, submitted_at: s.last || null, first_submitted_at: s.submitted || null, unlockedUntil: untilOf.get(s.sheet) || null, answers });
}
const roster = data.students.map(s => ({ name: s.name, email: s.email, section: s.section, id: s.id }));
writeFileSync(OUT + "/data.js", "window.OFFLINE = " + JSON.stringify({ builtAt: new Date().toISOString(), due: data.due, roster, sheets, read, files }) + ";\n");

execFileSync(ROOT + "node_modules/.bin/esbuild", [ROOT + "scripts/comm3-audio-story-offline.jsx", "--bundle", "--format=iife", "--platform=browser", "--jsx=automatic", "--loader:.js=jsx", "--minify", "--define:process.env.NODE_ENV=\"production\"", "--outfile=" + OUT + "/app.js", "--log-level=error"], { stdio: "inherit", cwd: ROOT });
writeFileSync(OUT + "/index.html", `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>COMM 3 · Audio stories, to read with no connection</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&display=swap" />
<style>* { margin: 0; padding: 0; box-sizing: border-box; } body { -webkit-font-smoothing: antialiased; }</style>
</head>
<body>
<div id="root"></div>
<script src="data.js"></script>
<script src="app.js"></script>
</body>
</html>
`);
console.log(`${sheets.length} sheets, ${Object.keys(read.students || {}).length} reads, ${Object.keys(files).length} audio files, ${(bytes / 1048576).toFixed(0)} MB of audio.`);
console.log("wrote " + OUT + "/index.html");
