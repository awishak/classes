// Pull everything the visual story grade needs to disk. Reads only; writes
// nothing to the database.
//
// Andrew, 2026-11-10: four parts to the grade, imagery, storytelling,
// directions, and the work around the story (pre-production and peer
// comments). "I need you to tell me where people stand on peer comments ...
// if they turned in pre-production on time ... and then they follow
// directions."
//
// For every COMM 3 student on the roster this writes, into
// ~/Projects/visual-story-grading/:
//   data.json            one row a student: the story, the rules the story
//                        misses, pre-production, comments given and received
//   images/<slug>/N.jpg  the story's pictures, in story order
//
//   node scripts/comm3-visual-grade-pull.mjs
//   node scripts/comm3-visual-grade-pull.mjs --no-images

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { answersOf } from "../src/engine/worktopia/store.js";
import { storyOf, problemsOf, wordCount, imageCount, isHtmlStory, mostlyDone, COMMENTS_UNTIL } from "../src/engine/visualstory/model.js";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const OUT = homedir() + "/Projects/visual-story-grading";
const GROUP = "comm3", PLAN = "comm3-f26-v1-plan";
const PRE_DUE_FALLBACK = "2026-10-17T06:59:00+00:00";      // Friday, October 16, 11:59 PM Pacific
const COMMENTS_FIRST_DUE = "2026-10-27T18:59:00+00:00";    // Tuesday, October 27, 11:59 AM Pacific
const withImages = !process.argv.includes("--no-images");

const lower = (s) => String(s || "").trim().toLowerCase();
const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`read ${q}: ${r.status} ${await r.text()}`); return r.json(); };
const paged = async (q) => { const out = []; for (let offset = 0; ; offset += 1000) { const page = await get(`${q}&offset=${offset}&limit=1000`); out.push(...page); if (page.length < 1000) return out; } };
const answersFor = async (ids) => {
  const by = {};
  for (let i = 0; i < ids.length; i += 60) {
    const rows = await paged(`worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids.slice(i, i + 60).join(",")})&order=id`);
    rows.forEach(a => { (by[a.sheet_id] = by[a.sheet_id] || []).push(a); });
  }
  return by;
};
const sheetsOf = (wk) => get(`worksheet_sheets?worksheet_key=eq.${wk}&group_key=eq.${GROUP}&select=*&limit=1000`);

const roster = ((await get(`app_data?id=eq.${PLAN}&select=data`))[0]?.data?.students || [])
  .filter(s => s.email && !/@(practice|example)\.test$/.test(s.email) && !/lurker/i.test(s.name || ""))
  .map(s => ({ name: s.name, email: lower(s.email), section: String(s.section || "").trim() }));
const nameOf = new Map(roster.map(s => [s.email, s.name]));

const deadlines = await get(`worksheet_deadlines?group_key=eq.${GROUP}&select=worksheet_key,due_at`);
const dueOf = (wk) => deadlines.find(d => d.worksheet_key === wk)?.due_at || null;
const storyDue = dueOf("visual-story");
const preDue = dueOf("visual-pre") || PRE_DUE_FALLBACK;

const [storySheets, preSheets, pre2Sheets] = await Promise.all([sheetsOf("visual-story"), sheetsOf("visual-pre"), sheetsOf("visual-pre-2")]);
const allIds = [...storySheets, ...preSheets, ...pre2Sheets].map(s => s.id);
const answers = await answersFor(allIds);
const reviews = allIds.length ? await get(`worksheet_reviews?select=sheet_id,status,note,reviewed_at&limit=1000`) : [];
const reviewOf = new Map(reviews.map(r => [r.sheet_id, r]));
const unlocks = new Map((await get(`worksheet_unlocks?select=sheet_id,until`)).map(u => [u.sheet_id, u.until]));
const pods = await get(`story_pods?select=section,pod,viewer_id&group_key=eq.${GROUP}`);
const storyIds = storySheets.map(s => s.id);
const comments = [];
for (let i = 0; i < storyIds.length; i += 60) comments.push(...await paged(`story_comments?select=*&story_sheet=in.(${storyIds.slice(i, i + 60).join(",")})&order=id`));

const ownerOfSheet = new Map(storySheets.map(s => [s.id, lower(s.viewer_id)]));
const storyByEmail = new Map(storySheets.map(s => [lower(s.viewer_id), s]));
const pickOf = (c) => { const m = /^image:([a-z]+)$/.exec(c.best_where || ""); return { bestImage: c.best_image || (m ? m[1] : ""), bestWhere: m ? "" : (c.best_where || "") }; };
const preOf = (sheets, email) => {
  const s = sheets.find(x => lower(x.viewer_id) === email);
  if (!s) return null;
  const a = answersOf(answers[s.id] || []);
  const r = reviewOf.get(s.id);
  // submitted_at moves every time a student presses Submit again; lateness is
  // dated from the first press (first_submitted_at), as the site does.
  const first = s.first_submitted_at || s.submitted_at;
  return { started: s.created_at || s.started_at || null, submitted: first, resubmitted: s.first_submitted_at && s.submitted_at !== s.first_submitted_at ? s.submitted_at : null, onTime: !!(first && Date.parse(first) <= Date.parse(preDue) + 60000), answers: a, review: r ? { status: r.status, note: r.note, at: r.reviewed_at } : null };
};

if (withImages) mkdirSync(OUT + "/images", { recursive: true });
let pulled = 0, kept = 0, failed = 0;
const rows = [];
for (const who of roster) {
  const id = slug(who.name);
  const sheet = storyByEmail.get(who.email);
  const story = sheet ? storyOf(answersOf(answers[sheet.id] || [])) : null;
  const images = story ? story.blocks.filter(b => b.type === "image") : [];
  const pictureNo = (blockId) => { const i = images.findIndex(b => b.id === blockId); return i < 0 ? null : i + 1; };

  if (withImages && images.length) {
    mkdirSync(`${OUT}/images/${id}`, { recursive: true });
    for (const [i, b] of images.entries()) {
      const file = `${OUT}/images/${id}/${i + 1}.jpg`;
      if (existsSync(file)) { kept++; continue; }
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/visual-story/${b.path.split("/").map(encodeURIComponent).join("/")}`, { headers: H });
      if (!r.ok) { failed++; console.error(`  could not fetch ${who.name} image ${i + 1}: ${r.status}`); continue; }
      writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      pulled++;
    }
  }
  if (withImages && story?.html?.path) {
    mkdirSync(`${OUT}/images/${id}`, { recursive: true });
    const file = `${OUT}/images/${id}/story.html`;
    if (!existsSync(file)) {
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/visual-story/${story.html.path.split("/").map(encodeURIComponent).join("/")}`, { headers: H });
      if (r.ok) writeFileSync(file, Buffer.from(await r.arrayBuffer())); else failed++;
    }
  }

  // Comments this student wrote, and the ones written on their story.
  const wrote = comments.filter(c => c.author === who.email);
  const onOthers = wrote.filter(c => ownerOfSheet.get(c.story_sheet) !== who.email);
  const myPod = pods.find(p => p.viewer_id === who.email);
  const podMates = myPod ? pods.filter(p => p.pod === myPod.pod && p.section === myPod.section && p.viewer_id !== who.email).map(p => p.viewer_id) : [];
  const podDone = podMates.filter(m => onOthers.some(c => ownerOfSheet.get(c.story_sheet) === m));
  const received = sheet ? comments.filter(c => c.story_sheet === sheet.id && c.author !== who.email) : [];
  const votes = {};
  received.forEach(c => { const n = pictureNo(pickOf(c).bestImage); if (n) votes[n] = (votes[n] || 0) + 1; });

  rows.push({
    id, name: who.name, email: who.email, section: who.section,
    story: !story ? null : {
      sheet: sheet.id, submitted: sheet.first_submitted_at || sheet.submitted_at, resubmitted: sheet.first_submitted_at && sheet.submitted_at !== sheet.first_submitted_at ? sheet.submitted_at : null,
      late: !!((sheet.first_submitted_at || sheet.submitted_at) && storyDue && Date.parse(sheet.first_submitted_at || sheet.submitted_at) > Date.parse(storyDue)),
      unlockedUntil: unlocks.get(sheet.id) || null, kind: story.kind, htmlFile: story.html?.name || "",
      headline: story.headline, link: story.link, look: story.look,
      words: wordCount(story), images: imageCount(story), graphics: images.filter(b => b.graphic).length,
      byOthers: images.filter(b => b.by === "other").length,
      featureNo: pictureNo(story.feature), mostlyDone: mostlyDone(story), html: isHtmlStory(story),
      missing: problemsOf(story),
      blocks: story.blocks.map(b => b.type === "text" ? { type: "text", text: b.text || "" }
        : { type: "image", no: pictureNo(b.id), w: b.w, h: b.h, layout: b.layout || "full", caption: b.caption || "", graphic: !!b.graphic, source: b.source || "", by: b.by === "other" ? (b.byName || "someone else") : "", reasons: b.reasons || [], other: b.other || "" }),
    },
    pre: preOf(preSheets, who.email),
    pre2: preOf(pre2Sheets, who.email),
    comments: {
      onOthers: onOthers.length, onOwn: wrote.length - onOthers.length,
      pod: myPod ? myPod.pod : null, podSize: podMates.length, podDone: podDone.length,
      podMissed: podMates.filter(m => !podDone.includes(m)).map(m => nameOf.get(m) || m),
      byFirstDeadline: onOthers.filter(c => Date.parse(c.created_at) <= Date.parse(COMMENTS_FIRST_DUE)).length,
      first: wrote.map(c => c.created_at).sort()[0] || null, last: wrote.map(c => c.updated_at).sort().pop() || null,
      chars: wrote.length ? Math.round(wrote.reduce((n, c) => n + c.best.length + c.shone.length + c.encourage.length, 0) / wrote.length) : 0,
      given: wrote.map(c => ({ to: nameOf.get(ownerOfSheet.get(c.story_sheet)) || "", own: ownerOfSheet.get(c.story_sheet) === who.email, best: c.best, shone: c.shone, encourage: c.encourage, at: c.created_at })),
    },
    received: { count: received.length, votes, comments: received.map(c => ({ from: nameOf.get(c.author) || c.author, bestPicture: pictureNo(pickOf(c).bestImage), bestWhere: pickOf(c).bestWhere, best: c.best, shone: c.shone, encourage: c.encourage })) },
  });
}

mkdirSync(OUT, { recursive: true });
writeFileSync(OUT + "/data.json", JSON.stringify({ pulledAt: new Date().toISOString(), storyDue, preDue, commentsFirstDue: COMMENTS_FIRST_DUE, commentsFinalDue: COMMENTS_UNTIL[GROUP], students: rows }, null, 1));
const withStory = rows.filter(r => r.story);
console.log(`Roster ${rows.length}. Stories started ${withStory.length}, submitted ${withStory.filter(r => r.story.submitted).length}, late ${withStory.filter(r => r.story.late).length}.`);
console.log(`Pre-production: ${rows.filter(r => r.pre?.submitted).length} submitted, ${rows.filter(r => r.pre?.onTime).length} on time (due ${preDue}).`);
console.log(`Comments: ${comments.length} in all; ${rows.filter(r => r.comments.onOthers >= 8).length} students with 8 or more on others.`);
if (withImages) console.log(`Images: ${pulled} pulled, ${kept} already here, ${failed} failed.`);
console.log("wrote " + OUT + "/data.json");
