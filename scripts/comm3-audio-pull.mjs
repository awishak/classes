// Pull every audio clip handed in on COMM 3's audio sheets to disk, for
// transcription. Andrew, 2026-11-06: "pull all the audio files from their
// last two challenges, and do an analysis of the transcripts."
//
// Reads worksheet_sheets and worksheet_answers with the service key for the
// Audio exercise (audio-research) and the November 4 drop box (audio-nov4),
// then downloads each clip from the private visual-story bucket into
// ~/Projects/transcribe/clips/<folder>/<slug>.<ext>, one file a sheet, named
// by the roster slug of the sheet's owner. A file already there is skipped.
//
//   node scripts/comm3-audio-pull.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const OUT = homedir() + "/Projects/transcribe/clips";
const SHEETS = [["audio-research", "comm3-audio-exercise"], ["audio-nov4", "comm3-audio-nov4"]];
const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`read ${q}: ${r.status}`); return r.json(); };

const plan = (await get("app_data?id=eq.comm3-f26-v1-plan&select=data"))[0].data;
const nameOf = new Map(plan.students.filter(s => s.email).map(s => [s.email.trim().toLowerCase(), s.name]));
const index = {};
for (const [wk, folder] of SHEETS) {
  const dir = OUT + "/" + folder;
  mkdirSync(dir, { recursive: true });
  const sheets = await get(`worksheet_sheets?worksheet_key=eq.${wk}&group_key=eq.comm3&select=id,viewer_id,submitted_at`);
  const ids = sheets.map(s => s.id);
  const answers = ids.length ? await get(`worksheet_answers?sheet_id=in.(${ids.join(",")})&select=sheet_id,field,value`) : [];
  const rows = [];
  let pulled = 0, kept = 0;
  for (const s of sheets) {
    const mine = answers.filter(a => a.sheet_id === s.id);
    const audio = mine.find(a => a.field === "audio");
    let clip = null; try { clip = JSON.parse(audio?.value || "null"); } catch { clip = null; }
    const name = nameOf.get(s.viewer_id.toLowerCase()) || s.viewer_id;
    const headline = (mine.find(a => a.field === "headline") || {}).value || "";
    const names = (mine.find(a => a.field === "names") || {}).value || "";
    const story = (mine.find(a => a.field === "story") || {}).value || "";
    if (!clip?.path) { rows.push({ id: slug(name), name, email: s.viewer_id, submitted: s.submitted_at, clip: null, headline, names, story }); continue; }
    const ext = (clip.path.match(/\.([a-z0-9]+)$/i) || [, "m4a"])[1].toLowerCase();
    const file = dir + "/" + slug(name) + "." + ext;
    if (!existsSync(file)) {
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/visual-story/${clip.path}`, { headers: H });
      if (!r.ok) { console.error("  could not fetch " + clip.path + ": " + r.status); continue; }
      writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      pulled++;
    } else kept++;
    rows.push({ id: slug(name), name, email: s.viewer_id, submitted: s.submitted_at, clip: { ...clip, file }, headline, names, story });
  }
  index[folder] = rows;
  console.log(`${wk}: ${sheets.length} sheets, ${rows.filter(r => r.clip).length} clips, ${pulled} pulled, ${kept} already here`);
}
writeFileSync(OUT + "/index.json", JSON.stringify(index, null, 1));
console.log("wrote " + OUT + "/index.json");
