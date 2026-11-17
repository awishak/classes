// Pull COMM 3's audio stories to disk: every answer on the audio-story sheet
// and every story's audio file, with where each student stood on the
// pre-production. Reads only; writes nothing to the database.
//
// Andrew, 2026-11-16: "let's now grade audio stories. you do a quick read and
// go through the transcripts of each audio story and you tell me what your
// read is ... and let me know if a student was late or did not submit the
// pre-production."
//
// Writes into ~/Projects/audio-story-grading/:
//   data.json           one row a student on the roster: the story sheet's
//                       answers, when the story was first and last submitted,
//                       whether that was past the due date, the audio, who
//                       they work with, and the pre-production: submitted or
//                       not, late or not, and the grade he gave
//   clips/<slug>.<ext>  the audio, named by the roster slug. A file is pulled
//                       again when the student has put up a different one.
//
//   node scripts/comm3-audio-story-pull.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { answersOf } from "../src/engine/worktopia/store.js";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const OUT = homedir() + "/Projects/audio-story-grading";
const GROUP = "comm3", CLASS = "comm3-f26-v1", PLAN = "comm3-f26-v1-plan";

const lower = (s) => String(s || "").trim().toLowerCase();
const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`read ${q}: ${r.status} ${await r.text()}`); return r.json(); };
const rowOf = async (id) => ((await get(`app_data?id=eq.${id}&select=data`))[0] || {}).data || {};
const json = (s, d) => { try { return JSON.parse(s || "null") ?? d; } catch { return d; } };

const cls = await rowOf(CLASS), plan = await rowOf(PLAN);
const roster = (plan.students || [])
  .filter(s => s.email && !/@(practice|example)\.test$/.test(s.email) && !/lurker/i.test(s.name || ""))
  .map(s => ({ name: s.name, email: lower(s.email), section: String(s.section || "").trim() }));
const nameOf = new Map(roster.map(s => [s.email, s.name]));
const deadlines = await get(`worksheet_deadlines?group_key=eq.${GROUP}&select=worksheet_key,due_at`);
const dueOf = (k) => (deadlines.find(d => d.worksheet_key === k) || {}).due_at || null;
const sheetsOf = (k) => get(`worksheet_sheets?worksheet_key=eq.${k}&group_key=eq.${GROUP}&select=*&limit=1000`);
const stories = await sheetsOf("audio-story"), pres = await sheetsOf("audio-pre");
const answers = [];
const ids = stories.map(s => s.id);
for (let i = 0; i < ids.length; i += 60) {
  for (let offset = 0; ; offset += 1000) {
    const page = await get(`worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids.slice(i, i + 60).join(",")})&order=id&offset=${offset}&limit=1000`);
    answers.push(...page);
    if (page.length < 1000) break;
  }
}
let pairs = [];
try { const row = await rowOf("audio-pairs-plan"); const all = typeof row === "string" ? JSON.parse(row) : row || {}; pairs = (all[GROUP] && all[GROUP].pairs) || []; } catch (e) { console.error("  no pairs read: " + e.message); }

const late = (first, due) => !!(first && due && Date.parse(first) > Date.parse(due) + 60000);
const had = existsSync(OUT + "/data.json") ? JSON.parse(readFileSync(OUT + "/data.json", "utf8")).students : [];
mkdirSync(OUT + "/clips", { recursive: true });
let pulled = 0, kept = 0, failed = 0;
const rows = [];
for (const who of roster) {
  const id = slug(who.name);
  const sheet = stories.find(s => lower(s.viewer_id) === who.email);
  const pre = pres.find(s => lower(s.viewer_id) === who.email);
  const preFirst = pre ? pre.first_submitted_at || pre.submitted_at || null : null;
  const grade = [...(cls.assignmentLog?.["audio-pre"]?.[who.name] || [])].filter(e => !e.deleted && e.type === "grade").pop() || null;
  const preSay = { submitted: preFirst, late: late(preFirst, dueOf("audio-pre")), grade: grade ? grade.letter : "" };
  const pair = pairs.find(p => (p.members || []).map(lower).includes(who.email));
  const partner = pair ? pair.members.map(lower).filter(m => m !== who.email).map(m => nameOf.get(m) || m) : [];
  if (!sheet) { rows.push({ id, ...who, partner, pre: preSay, sheet: null }); continue; }
  const a = answersOf(answers.filter(x => x.sheet_id === sheet.id));
  const clip = json(a.audio, null);
  let file = null;
  if (clip?.path) {
    const ext = (clip.path.match(/\.([a-z0-9]+)$/i) || [, "m4a"])[1].toLowerCase();
    file = `${OUT}/clips/${id}.${ext}`;
    const before = had.find(x => x.id === id);
    if (existsSync(file) && before?.audio?.path === clip.path) kept++;
    else {
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/visual-story/${clip.path.split("/").map(encodeURIComponent).join("/")}`, { headers: H });
      if (!r.ok) { failed++; file = null; console.error(`  could not fetch ${who.name}: ${r.status}`); }
      else { writeFileSync(file, Buffer.from(await r.arrayBuffer())); pulled++; }
    }
  }
  const first = sheet.first_submitted_at || sheet.submitted_at || null;
  rows.push({
    id, ...who, partner, pre: preSay,
    sheet: sheet.id, submitted: first, last: sheet.submitted_at || null, late: late(first, dueOf("audio-story")),
    headline: a.headline || "", listen: a.listen || "", credits: a.credits || "",
    voices: json(a.voices, []), sounds: json(a.sounds, []), chapters: json(a.chapters, []), sources: a.sources || "",
    audio: clip?.path ? { path: clip.path, seconds: clip.seconds, name: clip.name, file } : null,
  });
}
writeFileSync(OUT + "/data.json", JSON.stringify({ pulledAt: new Date().toISOString(), due: dueOf("audio-story"), preDue: dueOf("audio-pre"), students: rows }, null, 1));
const started = rows.filter(r => r.sheet);
console.log(`Roster ${rows.length}. Story sheets ${started.length}, submitted ${started.filter(r => r.submitted).length}, late ${started.filter(r => r.late).length}, with audio ${started.filter(r => r.audio).length}.`);
console.log(`Pre-production: ${rows.filter(r => r.pre.submitted).length} submitted, ${rows.filter(r => r.pre.late).length} late, ${rows.filter(r => !r.pre.submitted).length} never submitted.`);
console.log(`Audio: ${pulled} pulled, ${kept} already here, ${failed} failed.`);
console.log("wrote " + OUT + "/data.json");
