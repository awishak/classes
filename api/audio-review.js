// The audio story review: classmates listen to each other's audio stories
// and leave three comments on each.
//
// Andrew, 2026-11-13: "take what we did for the visual story ... and do the
// exact same thing." So this is api/visual-story.js's shape for sound. The
// browser can read only a student's own sheet and files, so listening to
// anyone else's story comes here, where the service key reads and this route
// decides what goes back out:
//   - Only a student on the class's roster gets anything, and only stories
//     from their own section.
//   - Only submitted stories go out. The cover and the headline are on the
//     grid with no name; the name is on the story's own page (Andrew: "Hide
//     the names on the front page, but once they click on them, they can see
//     the names").
//   - Whether a voice knew they were being recorded never leaves this route.
//   - The file and the cover go out as links signed for an hour.
//   - Every student in a section is assigned three stories the first time
//     anyone in the section asks after the window opens (reviewmodel.js), and
//     the three are saved in one app_data row a section. The row's id is the
//     table's key, so two students asking in the same second cannot make two
//     sets: the second insert is refused and reads the first.
//   - Comments save only inside the window in reviewmodel.js. Nothing here
//     moves the window for a real class. The practice class (COMM 999) has no
//     window, so Andrew's stage buttons are the word there, and only there.
//   - A comment is a row in story_comments, the visual story's table. The
//     best chapter rides in best_where as chapter:<id>.
//   - Two answers were added after the table was made: the sound quality
//     and how the story made the listener feel. story_comments has no columns for them, so they are one
//     app_data row a reviewer a story (audio-said-...-plan), written just
//     before the comment's own row. A comment counts when its row exists.
//   - A student does not comment on their own story.
//   - What a student actually heard of a classmate's story is kept: the page
//     sends the seconds of the file that played, and the union is saved in
//     one app_data row a listener a story (audio-listen-...-plan), which only
//     this route and an instructor can write. Students are never shown it.
//   - The comments on a student's story reach them, names attached, once the
//     stage is released.
//
// POST /api/audio-review { groupKey, action, ... } with the student's session
// in the bearer header, or the PIN or an instructor session for Andrew. In the
// practice class Andrew can act as a student with { as: email }.

import { pinMatches, callerEmail, readBody } from "./_auth.js";
import { isInstructorEmail } from "../src/instructors.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";
import { answersOf } from "../src/engine/worktopia/store.js";
import { audioStoryOf } from "../src/engine/audiostory/storymodel.js";
import { WINDOW, windowStage, assignAll, assignOne, chapterWord, chapterOf, chaptersOf, joinRanges, heardSeconds, SOUNDS, FEEL_MIN, FEEL_MAX, NEED_ASSIGNED, NEED_TOTAL, MIN_CHARS } from "../src/engine/audiostory/reviewmodel.js";

const KEY = "audio-story";
const BUCKET = "visual-story";
const STORAGE = { comm3: "comm3-f26-v1", comm999: "comm999-v1" };
const PRACTICE = new Set(["comm999"]);
const STAGES = ["building", "reading", "closed", "released"];
const PAGE = 1000;

const lower = (s) => String(s || "").trim().toLowerCase();
const clean = (s) => String(s || "").trim();
const slug = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const rows = async (path) => {
  const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() });
  return r.ok ? await r.json().catch(() => null) : null;
};
const writeOrError = async (path, method, body, prefer = "return=representation") => {
  const r = await fetch(SUPABASE_URL + path, { method, headers: { ...serviceHeaders(), Prefer: prefer }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (r.ok) return { rows: await r.json().catch(() => []), error: "" };
  const said = await r.json().catch(() => null);
  return { rows: null, error: said?.message || said?.error || ("HTTP " + r.status) };
};
const write = async (path, method, body, prefer) => (await writeOrError(path, method, body, prefer)).rows;

// The roster, with the test students left out of a real class.
async function rosterOf(groupKey) {
  const plan = await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(STORAGE[groupKey] + "-plan")}&select=data`);
  const practice = PRACTICE.has(groupKey);
  return (plan?.[0]?.data?.students || [])
    .map(s => (s && !s.email && practice && s.name ? { ...s, email: slug(s.name) + "@practice.test" } : s))
    .filter(s => s && s.email).map(s => ({ name: s.name || "", email: lower(s.email), section: clean(s.section) }))
    .filter(s => practice || !/@(practice|example)\.test$/.test(s.email));
}

async function answersFor(sheetIds) {
  const out = [];
  for (let i = 0; i < sheetIds.length; i += 100) {
    const ids = sheetIds.slice(i, i + 100).join(",");
    for (let offset = 0; ; offset += PAGE) {
      const page = await rows(`/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids})&order=id&offset=${offset}&limit=${PAGE}`);
      if (!page) return null;
      out.push(...page);
      if (page.length < PAGE) break;
    }
  }
  const by = {};
  out.forEach(a => { (by[a.sheet_id] = by[a.sheet_id] || []).push(a); });
  return by;
}

async function sign(paths) {
  const list = [...new Set(paths.filter(Boolean))];
  if (!list.length) return {};
  const r = await fetch(SUPABASE_URL + "/storage/v1/object/sign/" + BUCKET, { method: "POST", headers: serviceHeaders(), body: JSON.stringify({ expiresIn: 3600, paths: list }) });
  if (!r.ok) return {};
  const out = {};
  ((await r.json()) || []).forEach(x => { if (x && x.signedURL && !x.error) out[x.path] = SUPABASE_URL + "/storage/v1" + x.signedURL; });
  return out;
}

// The stage: the clock for a real class, Andrew's button for the practice class.
async function stageOf(groupKey, section) {
  if (!PRACTICE.has(groupKey)) return windowStage(groupKey);
  const r = await rows(`/rest/v1/story_stage?select=stage&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&section=eq.${encodeURIComponent(section)}`);
  return STAGES.includes(r?.[0]?.stage) ? r[0].stage : "building";
}

const sheetsOf = (groupKey) => rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&limit=${PAGE}`);
const dueOf = async (groupKey) => (await rows(`/rest/v1/worksheet_deadlines?select=due_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}`))?.[0]?.due_at || null;

// ─── what a listener heard of a story ───
const listenId = (groupKey, sheetId, email) => "audio-listen-" + groupKey + "-" + sheetId + "-" + slug(email) + "-plan";
const listensOf = async (groupKey) => ((await rows(`/rest/v1/app_data?id=like.${encodeURIComponent("audio-listen-" + groupKey + "-*")}&select=data&limit=5000`)) || []).map(r => r.data).filter(Boolean);

// ─── the two later answers, beside the comment's row ───
const moreId = (groupKey, sheetId, email) => "audio-said-" + groupKey + "-" + sheetId + "-" + slug(email) + "-plan";
/** { "<story id> <reviewer>": { sound, feel } } for a class, or for one story. */
async function moreOf(groupKey, sheetId = "") {
  const list = (await rows(`/rest/v1/app_data?id=like.${encodeURIComponent("audio-said-" + groupKey + "-" + (sheetId ? sheetId + "-" : "") + "*")}&select=data&limit=5000`)) || [];
  return new Map(list.map(r => r.data).filter(Boolean).map(d => [d.story + " " + d.reviewer, d]));
}

// ─── who reviews what, saved once a section ───
const assignId = (groupKey, section) => "audio-review-" + groupKey + "-" + (slug(section) || "all") + "-plan";
const readAssign = async (groupKey, section) => (await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(assignId(groupKey, section))}&select=data`))?.[0]?.data || null;

/** The section's assignments, made now if nobody has made them. Null before any story is in. */
async function ensureAssign(groupKey, section, roster, sheets) {
  const saved = await readAssign(groupKey, section);
  if (saved && saved.assign) return saved;
  const inSection = roster.filter(s => s.section === section).map(s => s.email);
  const here = new Set(inSection);
  const owners = (sheets || []).filter(s => s.submitted_at && here.has(s.viewer_id)).map(s => s.viewer_id);
  if (!owners.length) return null;
  const data = { section, at: new Date().toISOString(), owners, assign: assignAll(inSection, owners) };
  // A plain insert: the row's id is the key, so a second set is refused.
  const w = await writeOrError("/rest/v1/app_data", "POST", { id: assignId(groupKey, section), data, updated_at: data.at });
  if (w.rows && w.rows[0]) return data;
  return (await readAssign(groupKey, section)) || null;
}

/** One reviewer's three, adding them to the row when they joined the roster late. */
async function assignedTo(groupKey, section, saved, email, sheets, roster) {
  if (!saved) return [];
  if (saved.assign[email]) return saved.assign[email];
  const here = new Set(roster.filter(s => s.section === section).map(s => s.email));
  const owners = (sheets || []).filter(s => s.submitted_at && here.has(s.viewer_id)).map(s => s.viewer_id);
  const picks = assignOne(email, saved.assign, owners);
  if (picks.length) await write(`/rest/v1/app_data?id=eq.${encodeURIComponent(assignId(groupKey, section))}`, "PATCH", { data: { ...saved, assign: { ...saved.assign, [email]: picks } }, updated_at: new Date().toISOString() });
  return picks;
}

// Only what a tile needs: the headline and the cover, as a signed link.
async function tilesOf(ids) {
  const head = {};
  if (ids.length) {
    const top = (await rows(`/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids.join(",")})&field=in.(headline,cover,audio)&order=position&limit=${PAGE * 4}`)) || [];
    top.forEach(r => { const m = (head[r.sheet_id] = head[r.sheet_id] || {}); m[r.field] = (m[r.field] || "") + r.value; });
  }
  const tile = {};
  ids.forEach(id => { const s = audioStoryOf(head[id] || {}); tile[id] = { headline: s.headline, path: s.cover?.path || "", seconds: s.audio?.seconds || 0 }; });
  const urls = await sign(ids.map(id => tile[id].path));
  return { tile, urls };
}

// What a classmate may see of a story: everything on the story page, and no
// mark for whether a voice knew they were being recorded.
const forListener = (story) => ({ ...story, voices: story.voices.map(v => ({ ...v, knew: null })) });
const said = (c, more) => { const m = (more && more.get(c.story_sheet + " " + c.author)) || {}; return { chapter: chapterOf(c.best_where), best: c.best, shone: c.shone, encourage: c.encourage, sound: m.sound || "", feel: m.feel || "" }; };
const lateOf = (s, due) => !!(s.submitted_at && due && Date.parse(s.submitted_at) > Date.parse(due));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const groupKey = String(body.groupKey || "");
  if (!STORAGE[groupKey]) return res.status(400).json({ ok: false, error: "This class has no audio story." });
  const action = String(body.action || "");
  const sessionEmail = pinMatches(body.pin) ? "" : await callerEmail(req);
  const instructor = pinMatches(body.pin) || isInstructorEmail(sessionEmail);
  const practice = PRACTICE.has(groupKey);

  // ─── Andrew's pages ───
  if (["admin", "every", "peek", "stage", "practice-fill", "practice-clear"].includes(action)) {
    if (!instructor) return res.status(401).json({ ok: false, error: "Only the instructor can do that." });
    const roster = await rosterOf(groupKey);
    const byEmail = new Map(roster.map(s => [s.email, s]));
    const sections = [...new Set(roster.map(s => s.section))];

    // The practice class only: the stage button, and copies of Andrew's own
    // practice story for every fake student, so the review can be tried.
    if (action === "stage" || action === "practice-fill" || action === "practice-clear") {
      if (!practice) return res.status(400).json({ ok: false, error: "A real class opens and closes on the clock. Only the practice class has buttons." });
      if (action === "stage") {
        const stage = String(body.stage || "");
        if (!STAGES.includes(stage)) return res.status(400).json({ ok: false, error: "Not a stage." });
        const w = await write("/rest/v1/story_stage?on_conflict=worksheet_key,group_key,section", "POST",
          { worksheet_key: KEY, group_key: groupKey, section: clean(body.section), stage, opens_at: null, updated_at: new Date().toISOString() }, "return=representation,resolution=merge-duplicates");
        return w && w[0] ? res.status(200).json({ ok: true, stage: w[0].stage }) : res.status(502).json({ ok: false, error: "The stage did not save." });
      }
      const fakes = roster.filter(r => /@(practice|example)\.test$/.test(r.email));
      const fakeList = fakes.map(f => encodeURIComponent(f.email)).join(",");
      const old = fakeList ? ((await rows(`/rest/v1/worksheet_sheets?select=id&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&viewer_id=in.(${fakeList})`)) || []) : [];
      if (old.length && (await write(`/rest/v1/worksheet_sheets?id=in.(${old.map(o => o.id).join(",")})`, "DELETE")) === null) return res.status(502).json({ ok: false, error: "The old practice stories did not clear." });
      for (const s of sections) await write(`/rest/v1/app_data?id=eq.${encodeURIComponent(assignId(groupKey, s))}`, "DELETE");
      await write(`/rest/v1/app_data?id=like.${encodeURIComponent("audio-listen-" + groupKey + "-*")}`, "DELETE");
      await write(`/rest/v1/app_data?id=like.${encodeURIComponent("audio-said-" + groupKey + "-*")}`, "DELETE");
      await write(`/rest/v1/story_stage?worksheet_key=eq.${KEY}&group_key=eq.${groupKey}`, "DELETE");
      if (action === "practice-clear") return res.status(200).json({ ok: true, cleared: old.length });
      const from = lower(body.from) || await callerEmail(req);
      const src = await rows(`/rest/v1/worksheet_sheets?select=id&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&viewer_id=eq.${encodeURIComponent(from)}`);
      if (!src || !src[0]) return res.status(404).json({ ok: false, error: "Make your own practice audio story first; the copies are made from yours." });
      const srcRows = (await answersFor([src[0].id]))?.[src[0].id] || [];
      if (!srcRows.length) return res.status(404).json({ ok: false, error: "Your practice audio story is empty." });
      let made = 0;
      for (const [n, f] of fakes.entries()) {
        const sh = await write("/rest/v1/worksheet_sheets", "POST", { worksheet_key: KEY, group_key: groupKey, viewer_id: f.email, submitted_at: new Date().toISOString() });
        if (!sh || !sh[0]) continue;
        const copy = srcRows.filter(r => r.field !== "headline").map(r => ({ sheet_id: sh[0].id, field: r.field, value: r.value, position: r.position }));
        copy.push({ sheet_id: sh[0].id, field: "headline", value: "Practice story " + (n + 1), position: 0 });
        if (await write("/rest/v1/worksheet_answers", "POST", copy)) made++;
      }
      return res.status(200).json({ ok: true, made });
    }

    const [sheets, due] = await Promise.all([sheetsOf(groupKey), dueOf(groupKey)]);
    if (!sheets) return res.status(502).json({ ok: false, error: "Could not read the stories." });
    const list = sheets.filter(s => byEmail.has(s.viewer_id));

    // One story, with the name, the marks and every comment so far.
    if (action === "peek") {
      const sheet = list.find(s => s.id === String(body.id || ""));
      if (!sheet) return res.status(404).json({ ok: false, error: "That story is not in this class." });
      const by = await answersFor([sheet.id]);
      if (!by) return res.status(502).json({ ok: false, error: "Could not read the story." });
      const story = audioStoryOf(answersOf(by[sheet.id] || []));
      const urls = await sign([story.audio?.path, story.cover?.path]);
      const who = byEmail.get(sheet.viewer_id);
      const heardBy = new Map((await listensOf(groupKey)).filter(l => l.story === sheet.id).map(l => [l.reviewer, l]));
      const more = await moreOf(groupKey, sheet.id);
      const comments = ((await rows(`/rest/v1/story_comments?select=*&story_sheet=eq.${sheet.id}&order=updated_at`)) || [])
        .map(c => ({ author: byEmail.get(c.author)?.name || c.author, ...said(c, more), heard: heardBy.get(c.author)?.heard || 0, length: story.audio?.seconds || 0 }));
      return res.status(200).json({ ok: true, story, urls, author: who.name, section: who.section, submitted_at: sheet.submitted_at, late: lateOf(sheet, due), comments });
    }

    // Every story in the class, submitted or not, with names.
    if (action === "every") {
      const { tile, urls } = await tilesOf(list.map(s => s.id));
      const started = new Set(list.map(s => s.viewer_id));
      return res.status(200).json({
        ok: true, sections, due,
        stories: list.map(s => { const who = byEmail.get(s.viewer_id); return { id: s.id, headline: tile[s.id].headline, image: urls[tile[s.id].path] || "", seconds: tile[s.id].seconds, author: who.name, section: who.section, submitted_at: s.submitted_at, late: lateOf(s, due) }; })
          .sort((a, b) => a.author.localeCompare(b.author)),
        notStarted: roster.filter(s => !started.has(s.email)).map(s => ({ name: s.name, section: s.section })),
      });
    }

    // admin: who was assigned what, every submitted story, every comment.
    const stages = {}, assign = {}, assignedAt = {};
    for (const s of sections) {
      stages[s] = await stageOf(groupKey, s);
      const saved = stages[s] === "building" ? await readAssign(groupKey, s) : await ensureAssign(groupKey, s, roster, sheets);
      if (saved) { Object.assign(assign, saved.assign); assignedAt[s] = saved.at; }
    }
    const tile = {};
    const head = list.length ? ((await rows(`/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${list.map(s => s.id).join(",")})&field=in.(headline,chapters)&order=position&limit=${PAGE * 4}`)) || []) : [];
    const chapterText = {};
    head.forEach(r => { const m = r.field === "headline" ? tile : chapterText; m[r.sheet_id] = (m[r.sheet_id] || "") + r.value; });
    const chapterName = (sheetId, id) => (chaptersOf(audioStoryOf({ chapters: chapterText[sheetId] || "" })).find(ch => ch.id === id)?.name || "").trim();
    const submitted = list.filter(s => s.submitted_at);
    const ids = submitted.map(s => s.id);
    const comments = ids.length ? ((await rows(`/rest/v1/story_comments?select=*&story_sheet=in.(${ids.join(",")})&limit=5000`)) || []) : [];
    const ownerOf = new Map(submitted.map(s => [s.id, s.viewer_id]));
    const more = await moreOf(groupKey);
    const listens = (await listensOf(groupKey)).filter(l => ownerOf.has(l.story) && byEmail.has(l.reviewer))
      .map(l => ({ story: l.story, reviewer: l.reviewer, heard: l.heard || 0, length: l.length || 0, updated_at: l.updated_at || null }));
    return res.status(200).json({
      listens,
      ok: true, sections, stages, assignedAt, window: WINDOW[groupKey] || null, due, need: { assigned: NEED_ASSIGNED, total: NEED_TOTAL },
      people: roster.map(r => ({ name: r.name, email: r.email, section: r.section })),
      assign,
      stories: list.map(s => ({ id: s.id, email: s.viewer_id, name: byEmail.get(s.viewer_id).name, section: byEmail.get(s.viewer_id).section, submitted_at: s.submitted_at, late: lateOf(s, due), headline: clean(tile[s.id]) })),
      comments: comments.map(c => ({ story: c.story_sheet, owner: byEmail.get(ownerOf.get(c.story_sheet))?.name || "", ownerEmail: ownerOf.get(c.story_sheet) || "", author: byEmail.get(c.author)?.name || c.author, authorEmail: c.author, ...said(c, more), chapterName: chapterName(c.story_sheet, chapterOf(c.best_where)), updated_at: c.updated_at })),
    });
  }

  // ─── a student, or Andrew acting as one in the practice class ───
  const roster = await rosterOf(groupKey);
  let email = instructor ? "" : sessionEmail;
  if (instructor && body.as && practice) email = lower(body.as);
  // Andrew's own home shows the students' bar, at the stage the clock says.
  if (instructor && !email && action === "status") {
    const sections = [...new Set(roster.map(s => s.section))];
    const stages = await Promise.all(sections.map(s => stageOf(groupKey, s)));
    return res.status(200).json({ ok: true, stage: stages.sort((a, b) => STAGES.indexOf(b) - STAGES.indexOf(a))[0] || "building" });
  }
  if (!email) return res.status(instructor ? 400 : 401).json({ ok: false, error: instructor ? "Open the stories as a student in the practice class with ?as=<email>." : "Not signed in." });
  const me = roster.find(s => s.email === email);
  if (!me) return res.status(403).json({ ok: false, error: "Not on the roster for this class." });

  const stage = await stageOf(groupKey, me.section);
  if (stage === "building") {
    if (action === "comment" || action === "story" || action === "heard") return res.status(409).json({ ok: false, error: "The stories are not open yet." });
    return res.status(200).json({ ok: true, stage, stories: [], need: { assigned: NEED_ASSIGNED, total: NEED_TOTAL } });
  }

  const [sheets, myRows, due] = await Promise.all([
    sheetsOf(groupKey),
    rows(`/rest/v1/story_comments?select=*&author=eq.${encodeURIComponent(email)}&limit=${PAGE}`),
    dueOf(groupKey),
  ]);
  if (!sheets) return res.status(502).json({ ok: false, error: "Could not read the stories." });
  const inSection = new Map(roster.filter(s => s.section === me.section).map(s => [s.email, s]));
  const list = sheets.filter(s => s.submitted_at && inSection.has(s.viewer_id)).map(s => ({ id: s.id, owner: inSection.get(s.viewer_id), submitted_at: s.submitted_at }));
  const byId = new Map(list.map(s => [s.id, s]));
  const saved = await ensureAssign(groupKey, me.section, roster, sheets);
  const mine = new Set(await assignedTo(groupKey, me.section, saved, email, sheets, roster));
  const ownId = list.find(s => s.owner.email === email)?.id || null;
  const myComments = (myRows || []).filter(c => byId.has(c.story_sheet) && c.story_sheet !== ownId);
  const doneSet = new Set(myComments.map(c => c.story_sheet));
  const required = list.filter(s => mine.has(s.owner.email) && s.id !== ownId);
  const requiredDone = required.filter(s => doneSet.has(s.id)).length;
  const counts = { required: required.length, requiredDone, total: doneSet.size, need: { assigned: NEED_ASSIGNED, total: NEED_TOTAL } };
  const open = stage === "reading";

  // One light read for the row under My work and the bar on the home.
  if (action === "status") return res.status(200).json({ ok: true, stage, ...counts, mine: ownId });

  if (action === "list") {
    const { tile, urls } = await tilesOf(list.map(s => s.id));
    const tiles = list.map(s => ({
      id: s.id, headline: tile[s.id].headline, image: urls[tile[s.id].path] || "", seconds: tile[s.id].seconds,
      mine: s.id === ownId, required: s.id !== ownId && mine.has(s.owner.email), done: doneSet.has(s.id), late: lateOf(s, due),
    }));
    // The three in red first, then the student's own, then everyone else in a fixed order that is not the roster's.
    const rank = (t) => (t.required ? 0 : t.mine ? 1 : 2);
    tiles.sort((a, b) => rank(a) - rank(b) || (a.id < b.id ? -1 : 1));
    return res.status(200).json({ ok: true, stage, commentsOpen: open, stories: tiles, ...counts });
  }

  const story = byId.get(String(body.id || ""));
  if (!story) return res.status(404).json({ ok: false, error: "That story is not in your section." });
  const isMine = story.id === ownId;

  if (action === "story") {
    const by = await answersFor([story.id]);
    if (!by) return res.status(502).json({ ok: false, error: "Could not read the story." });
    const full = audioStoryOf(answersOf(by[story.id] || []));
    const urls = await sign([full.audio?.path, full.cover?.path]);
    let comments = null;
    if (stage === "released" && isMine) {
      const nameOf = new Map(roster.map(s => [s.email, s.name]));
      const more = await moreOf(groupKey, story.id);
      comments = ((await rows(`/rest/v1/story_comments?select=*&story_sheet=eq.${story.id}&order=updated_at`)) || [])
        .filter(c => c.author !== email).map(c => ({ author: nameOf.get(c.author) || "A classmate", ...said(c, more) }));
    }
    const my = myComments.find(c => c.story_sheet === story.id);
    const mineMore = my ? new Map([[story.id + " " + email, (await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(moreId(groupKey, story.id, email))}&select=data`))?.[0]?.data || {}]]) : null;
    return res.status(200).json({ ok: true, stage, story: forListener(full), urls, mine: isMine, author: story.owner.name, myComment: my ? said(my, mineMore) : null, commentsOpen: open, comments, ...counts });
  }

  // The seconds of a classmate's story that played on the listener's page.
  if (action === "heard") {
    if (isMine) return res.status(200).json({ ok: true });
    const audioRows = (await rows(`/rest/v1/worksheet_answers?select=field,value,position&sheet_id=eq.${story.id}&field=eq.audio&order=position`)) || [];
    const length = audioStoryOf(answersOf(audioRows)).audio?.seconds || 0;
    if (!length) return res.status(200).json({ ok: true });
    const id = listenId(groupKey, story.id, email);
    const was = (await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`))?.[0]?.data || null;
    const ranges = joinRanges(was?.ranges, (Array.isArray(body.ranges) ? body.ranges : []).slice(0, 400), length);
    const now = new Date().toISOString();
    const data = { story: story.id, reviewer: email, ranges, heard: Math.min(heardSeconds(ranges), Math.ceil(length)), length, first_at: was?.first_at || now, updated_at: now };
    const w = await write("/rest/v1/app_data?on_conflict=id", "POST", { id, data, updated_at: now }, "return=representation,resolution=merge-duplicates");
    return w && w[0] ? res.status(200).json({ ok: true, heard: data.heard }) : res.status(502).json({ ok: false, error: "The listening did not save." });
  }

  if (action === "comment") {
    if (!open) return res.status(409).json({ ok: false, error: "Comments are closed." });
    if (isMine) return res.status(409).json({ ok: false, error: "This story is yours. Comment on your classmates' stories." });
    const c = { best: clean(body.best).slice(0, 3000), shone: clean(body.shone).slice(0, 3000), encourage: clean(body.encourage).slice(0, 3000) };
    const feel = clean(body.feel).slice(0, FEEL_MAX), sound = String(body.sound || "");
    const short = Object.entries(c).filter(([, v]) => v.length < MIN_CHARS).map(([k]) => k);
    const taps = [];
    if (feel.length < FEEL_MIN) { short.push("feel"); taps.push("say how the story made you feel"); }
    if (!SOUNDS.some(x => x[0] === sound)) { short.push("sound"); taps.push("mark the sound quality"); }
    // The best chapter has to be one of the story's own. A story with no
    // chapters takes the comment with no pick.
    const chapterRows = (await rows(`/rest/v1/worksheet_answers?select=field,value,position&sheet_id=eq.${story.id}&field=eq.chapters&order=position`)) || [];
    const chapters = chaptersOf(audioStoryOf(answersOf(chapterRows)));
    const chapter = String(body.chapter || "");
    const picked = !chapters.length || chapters.some(ch => ch.id === chapter);
    if (!picked) { short.unshift("chapter"); taps.unshift("choose the best chapter"); }
    if (short.length) {
      const boxes = short.some(k => ["best", "shone", "encourage"].includes(k)) ? [`write at least ${MIN_CHARS} characters in each box`] : [];
      const todo = [...boxes, ...taps].join(", ");
      return res.status(400).json({ ok: false, error: "Still to do: " + todo + ".", short });
    }
    const now = new Date().toISOString();
    const m = await write("/rest/v1/app_data?on_conflict=id", "POST", { id: moreId(groupKey, story.id, email), data: { story: story.id, reviewer: email, sound, feel, updated_at: now }, updated_at: now }, "return=representation,resolution=merge-duplicates");
    if (!m || !m[0]) return res.status(502).json({ ok: false, error: "The comment did not save." });
    const w = await writeOrError("/rest/v1/story_comments?on_conflict=story_sheet,author", "POST",
      { story_sheet: story.id, author: email, best_image: "", best_where: chapters.length ? chapterWord(chapter) : "", ...c, updated_at: new Date().toISOString() }, "return=representation,resolution=merge-duplicates");
    if (!w.rows || !w.rows[0]) return res.status(502).json({ ok: false, error: "The comment did not save. " + w.error });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ ok: false, error: "Unknown action." });
}
