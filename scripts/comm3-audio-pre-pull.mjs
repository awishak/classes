// Pull COMM 3's audio story pre-production to disk: every answer on the
// audio-pre sheet and every five-minute clip. Reads only; writes nothing to
// the database.
//
// Andrew, 2026-11-12: "students just turned in work for comm 3. it's their
// audio story pre production. can you please analyze it, including analyzing
// their 5 min audio clips transcripts?"
//
// Writes into ~/Projects/audio-pre-grading/:
//   data.json           one row a student on the roster: the sheet's answers,
//                       when it was submitted, the clip, who they work with
//   clips/<slug>.<ext>  the clip, named by the roster slug. A file already
//                       there is skipped.
//
//   node scripts/comm3-audio-pre-pull.mjs

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
const OUT = homedir() + "/Projects/audio-pre-grading";
const GROUP = "comm3", PLAN = "comm3-f26-v1-plan", WK = "audio-pre";
const QUESTIONS = { start: "How are you planning to start your story?", away: "The one thing the listener walks away with", right: "Why are you the right person to tell this story?", new: "The new piece of information", you: "How are you putting you into this work?", who: "Who are you interviewing, and when, and why?", after: "Questions a listener might have after" };

const lower = (s) => String(s || "").trim().toLowerCase();
const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`read ${q}: ${r.status} ${await r.text()}`); return r.json(); };

const roster = ((await get(`app_data?id=eq.${PLAN}&select=data`))[0]?.data?.students || [])
  .filter(s => s.email && !/@(practice|example)\.test$/.test(s.email) && !/lurker/i.test(s.name || ""))
  .map(s => ({ name: s.name, email: lower(s.email), section: String(s.section || "").trim() }));
const nameOf = new Map(roster.map(s => [s.email, s.name]));

const due = (await get(`worksheet_deadlines?group_key=eq.${GROUP}&worksheet_key=eq.${WK}&select=due_at`))[0]?.due_at || null;
const sheets = await get(`worksheet_sheets?worksheet_key=eq.${WK}&group_key=eq.${GROUP}&select=*&limit=1000`);
const answers = [];
const ids = sheets.map(s => s.id);
for (let i = 0; i < ids.length; i += 60) {
  for (let offset = 0; ; offset += 1000) {
    const page = await get(`worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids.slice(i, i + 60).join(",")})&order=id&offset=${offset}&limit=1000`);
    answers.push(...page);
    if (page.length < 1000) break;
  }
}
let pairs = [];
try {
  const row = (await get(`app_data?id=eq.audio-pairs-plan&select=data`))[0]?.data;
  const all = typeof row === "string" ? JSON.parse(row) : row || {};
  pairs = (all[GROUP] && all[GROUP].pairs) || [];
} catch (e) { console.error("  no pairs read: " + e.message); }

mkdirSync(OUT + "/clips", { recursive: true });
let pulled = 0, kept = 0, failed = 0;
const rows = [];
for (const who of roster) {
  const id = slug(who.name);
  const sheet = sheets.find(s => lower(s.viewer_id) === who.email);
  const pair = pairs.find(p => (p.members || []).map(lower).includes(who.email));
  const partner = pair ? pair.members.map(lower).filter(m => m !== who.email).map(m => nameOf.get(m) || m) : [];
  if (!sheet) { rows.push({ id, ...who, partner, sheet: null }); continue; }
  // A long answer is several rows, joined in order of position.
  const a = answersOf(answers.filter(x => x.sheet_id === sheet.id));
  let clip = null; try { clip = JSON.parse(a.audio || "null"); } catch { clip = null; }
  let file = null;
  if (clip?.path) {
    const ext = (clip.path.match(/\.([a-z0-9]+)$/i) || [, "m4a"])[1].toLowerCase();
    file = `${OUT}/clips/${id}.${ext}`;
    if (existsSync(file)) kept++;
    else {
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/visual-story/${clip.path.split("/").map(encodeURIComponent).join("/")}`, { headers: H });
      if (!r.ok) { failed++; file = null; console.error(`  could not fetch ${who.name}: ${r.status}`); }
      else { writeFileSync(file, Buffer.from(await r.arrayBuffer())); pulled++; }
    }
  }
  const first = sheet.first_submitted_at || sheet.submitted_at || null;
  const asked = String(a.asked || "").split("\n").map(s => s.trim()).filter(s => QUESTIONS[s]);
  rows.push({
    id, ...who, partner, pairStory: pair?.story || "",
    sheet: sheet.id, submitted: first, resubmitted: sheet.first_submitted_at && sheet.submitted_at !== sheet.first_submitted_at ? sheet.submitted_at : null,
    late: !!(first && due && Date.parse(first) > Date.parse(due) + 60000),
    story: a.story || "", treatment: a.treatment || "", includes: a.includes || "",
    questions: asked.map(q => ({ id: q, ask: QUESTIONS[q], answer: a["q:" + q] || "" })),
    sources: a.sources || "", reflect: a.reflect || "",
    clip: clip?.path ? { seconds: clip.seconds, name: clip.name, file } : null,
  });
}
writeFileSync(OUT + "/data.json", JSON.stringify({ pulledAt: new Date().toISOString(), due, students: rows }, null, 1));
const started = rows.filter(r => r.sheet);
console.log(`Roster ${rows.length}. Sheets ${started.length}, submitted ${started.filter(r => r.submitted).length}, late ${started.filter(r => r.late).length}, clips ${started.filter(r => r.clip).length}.`);
console.log(`Clips: ${pulled} pulled, ${kept} already here, ${failed} failed.`);
console.log("wrote " + OUT + "/data.json");
