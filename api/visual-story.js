// The visual story's reading phase: classmates read each other's stories
// with no names on them, and leave three comments on each.
//
// Planned with Andrew on 2026-10-13 at /comm3/visualessayplanning. The
// browser can read only a student's own sheet and photos, so reading anyone
// else's story comes here, where the service key reads and this route decides
// what goes back out:
//   - Only a student on the class's roster gets anything, and only stories
//     from their own section ("These two classes should be completely
//     separate").
//   - No names until Andrew releases them, and a student's reasons for each
//     picture never leave this route.
//   - Photos go out as links signed for an hour, one story at a time.
//   - Comments open and close on Andrew's stage buttons, not on the page.
//   - A student comments on their own story last, after eight others.
//
// POST /api/visual-story { groupKey, action, ... } with the student's session
// in the bearer header, or the PIN or an instructor session for Andrew. In the
// practice class (COMM 999) Andrew can act as a student with { as: email }.

import { callerAllowed, callerEmail, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";
import { answersOf } from "../src/engine/worktopia/store.js";
import { storyOf } from "../src/engine/visualstory/model.js";

const KEY = "visual-story";
const BUCKET = "visual-story";
const STORAGE = { comm3: "comm3-f26-v1", comm999: "comm999-v1" };
const PRACTICE = new Set(["comm999"]);
const STAGES = ["building", "reading", "closed", "released"];
const OTHERS_BEFORE_OWN = 8;
const MIN_WORDS = 5;
const PAGE = 1000;

const lower = (s) => String(s || "").trim().toLowerCase();
const clean = (s) => String(s || "").trim();
const words = (s) => (String(s || "").trim().match(/\S+/g) || []).length;

const rows = async (path) => {
  const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() });
  return r.ok ? await r.json().catch(() => null) : null;
};
const write = async (path, method, body, prefer = "return=representation") => {
  const r = await fetch(SUPABASE_URL + path, { method, headers: { ...serviceHeaders(), Prefer: prefer }, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.ok ? await r.json().catch(() => []) : null;
};

async function rosterOf(groupKey) {
  const plan = await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(STORAGE[groupKey] + "-plan")}&select=data`);
  const slug = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // The practice class's names have no email, so each gets a made-up one there, and only there.
  return (plan?.[0]?.data?.students || [])
    .map(s => (s && !s.email && PRACTICE.has(groupKey) && s.name ? { ...s, email: slug(s.name) + "@practice.test" } : s))
    .filter(s => s && s.email).map(s => ({ name: s.name || "", email: lower(s.email), section: clean(s.section) }));
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

async function stageOf(groupKey, section) {
  const r = await rows(`/rest/v1/story_stage?select=stage&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&section=eq.${encodeURIComponent(section)}`);
  return r?.[0]?.stage || "building";
}

async function dueOf(groupKey) {
  const r = await rows(`/rest/v1/worksheet_deadlines?select=due_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}`);
  return r?.[0]?.due_at || null;
}

// The submitted stories of one section, with their owners and their stories.
async function sectionStories(groupKey, roster, section) {
  const inSection = new Map(roster.filter(s => s.section === section).map(s => [s.email, s]));
  const sheets = await rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&submitted_at=not.is.null&limit=${PAGE}`);
  if (!sheets) return null;
  const mine = sheets.filter(s => inSection.has(s.viewer_id));
  const by = mine.length ? await answersFor(mine.map(s => s.id)) : {};
  if (!by) return null;
  return mine.map(s => ({ id: s.id, owner: inSection.get(s.viewer_id), submitted_at: s.submitted_at, story: storyOf(answersOf(by[s.id] || [])) }));
}

const featurePath = (story) => {
  const images = story.blocks.filter(b => b.type === "image");
  return (images.find(b => b.id === story.feature) || images[0] || {}).path || "";
};

// What a classmate may see of a story: no reasons, and links instead of paths.
const forReader = (story, urls) => ({
  headline: story.headline, link: story.link, look: story.look,
  blocks: story.blocks.map(b => b.type === "text"
    ? { id: b.id, type: "text", text: b.text || "" }
    : { id: b.id, type: "image", url: urls[b.path] || "", w: b.w, h: b.h, layout: b.layout, caption: b.caption || "", graphic: !!b.graphic, source: b.source || "" }),
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const groupKey = String(body.groupKey || "");
  if (!STORAGE[groupKey]) return res.status(400).json({ ok: false, error: "This class has no visual story." });
  const action = String(body.action || "");
  const instructor = await callerAllowed(req, body);

  // ─── Andrew's controls ───
  if (["admin", "stage", "pods", "practice-fill", "practice-clear"].includes(action)) {
    if (!instructor) return res.status(401).json({ ok: false, error: "Only the instructor can do that." });
    const roster = await rosterOf(groupKey);
    // The practice class only: every fake student gets a copy of Andrew's own
    // story, submitted, so the reading phase can be tried and shown. Clear
    // takes the copies, their comments and the pods away again.
    if (action === "practice-fill" || action === "practice-clear") {
      if (!PRACTICE.has(groupKey)) return res.status(400).json({ ok: false, error: "Practice stories are for the practice class only." });
      const fakes = roster.filter(r => /@(practice|example)\.test$/.test(r.email));
      const fakeList = fakes.map(f => encodeURIComponent(f.email)).join(",");
      const old = fakeList ? ((await rows(`/rest/v1/worksheet_sheets?select=id&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&viewer_id=in.(${fakeList})`)) || []) : [];
      if (old.length && (await write(`/rest/v1/worksheet_sheets?id=in.(${old.map(o => o.id).join(",")})`, "DELETE")) === null) return res.status(502).json({ ok: false, error: "The old practice stories did not clear." });
      await write(`/rest/v1/story_pods?group_key=eq.${groupKey}`, "DELETE");
      await write(`/rest/v1/story_stage?worksheet_key=eq.${KEY}&group_key=eq.${groupKey}`, "DELETE");
      if (action === "practice-clear") return res.status(200).json({ ok: true, cleared: old.length });
      const from = lower(body.from) || await callerEmail(req);
      const src = await rows(`/rest/v1/worksheet_sheets?select=id&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&viewer_id=eq.${encodeURIComponent(from)}`);
      if (!src || !src[0]) return res.status(404).json({ ok: false, error: "Make your own practice story first; the copies are made from yours." });
      const srcRows = (await answersFor([src[0].id]))?.[src[0].id] || [];
      if (!srcRows.length) return res.status(404).json({ ok: false, error: "Your practice story is empty." });
      let made = 0;
      for (const f of fakes) {
        const sh = await write("/rest/v1/worksheet_sheets", "POST", { worksheet_key: KEY, group_key: groupKey, viewer_id: f.email, submitted_at: new Date().toISOString() });
        if (!sh || !sh[0]) continue;
        const copy = srcRows.filter(r => r.field !== "headline").map(r => ({ sheet_id: sh[0].id, field: r.field, value: r.value, position: r.position }));
        copy.push({ sheet_id: sh[0].id, field: "headline", value: "Practice story by " + f.name, position: 0 });
        if (await write("/rest/v1/worksheet_answers", "POST", copy)) made++;
      }
      return res.status(200).json({ ok: true, made });
    }
    if (action === "stage") {
      const section = clean(body.section), stage = String(body.stage || "");
      if (!STAGES.includes(stage)) return res.status(400).json({ ok: false, error: "Not a stage." });
      const w = await write("/rest/v1/story_stage?on_conflict=worksheet_key,group_key,section", "POST",
        { worksheet_key: KEY, group_key: groupKey, section, stage, updated_at: new Date().toISOString() }, "return=representation,resolution=merge-duplicates");
      return w && w[0] ? res.status(200).json({ ok: true, stage: w[0].stage }) : res.status(502).json({ ok: false, error: "The stage did not save." });
    }
    if (action === "pods") {
      const section = clean(body.section);
      const known = new Set(roster.filter(s => s.section === section).map(s => s.email));
      const list = (Array.isArray(body.pods) ? body.pods : []).map(p => ({ email: lower(p.email), pod: Number(p.pod) }))
        .filter(p => known.has(p.email) && Number.isInteger(p.pod) && p.pod >= 1 && p.pod <= 99);
      const gone = await write(`/rest/v1/story_pods?group_key=eq.${groupKey}&section=eq.${encodeURIComponent(section)}`, "DELETE");
      if (gone === null) return res.status(502).json({ ok: false, error: "The old pods did not clear." });
      if (list.length) {
        const w = await write("/rest/v1/story_pods", "POST", list.map(p => ({ group_key: groupKey, section, pod: p.pod, viewer_id: p.email })));
        if (!w || w.length !== list.length) return res.status(502).json({ ok: false, error: "The pods did not save." });
      }
      return res.status(200).json({ ok: true, saved: list.length });
    }
    // admin: everything, with names.
    const sections = [...new Set(roster.map(s => s.section))];
    const stages = {};
    for (const s of sections) stages[s] = await stageOf(groupKey, s);
    const pods = (await rows(`/rest/v1/story_pods?select=section,pod,viewer_id&group_key=eq.${groupKey}`)) || [];
    const nameOf = new Map(roster.map(s => [s.email, s.name]));
    const all = [];
    for (const s of sections) { const list = await sectionStories(groupKey, roster, s); if (list) all.push(...list); }
    const ids = all.map(s => s.id);
    const comments = ids.length ? ((await rows(`/rest/v1/story_comments?select=story_sheet,author,best,shone,encourage,updated_at&story_sheet=in.(${ids.join(",")})&limit=5000`)) || []) : [];
    const ownerOf = new Map(all.map(s => [s.id, s.owner.email]));
    const counts = {};
    comments.forEach(c => { if (ownerOf.get(c.story_sheet) !== c.author) counts[c.author] = (counts[c.author] || 0) + 1; });
    return res.status(200).json({
      ok: true, sections, stages, due: await dueOf(groupKey),
      people: roster.map(r => ({ name: r.name, email: r.email, section: r.section })),
      pods: pods.map(p => ({ section: p.section, pod: p.pod, email: p.viewer_id, name: nameOf.get(p.viewer_id) || p.viewer_id })),
      stories: all.map(s => ({ id: s.id, email: s.owner.email, name: s.owner.name, section: s.owner.section, submitted_at: s.submitted_at, headline: s.story.headline })),
      counts,
      comments: comments.map(c => ({ story: c.story_sheet, owner: nameOf.get(ownerOf.get(c.story_sheet)) || "", author: nameOf.get(c.author) || c.author, best: c.best, shone: c.shone, encourage: c.encourage, updated_at: c.updated_at })),
    });
  }

  // ─── a student, or Andrew acting as one in the practice class ───
  let email = instructor ? "" : await callerEmail(req);
  if (instructor && body.as && PRACTICE.has(groupKey)) email = lower(body.as);
  if (!email) return res.status(instructor ? 400 : 401).json({ ok: false, error: instructor ? "Open the stories as a student in the practice class with ?as=<email>." : "Not signed in." });
  const roster = await rosterOf(groupKey);
  const me = roster.find(s => s.email === email);
  if (!me) return res.status(403).json({ ok: false, error: "Not on the roster for this class." });
  const stage = await stageOf(groupKey, me.section);
  if (stage === "building") return res.status(200).json({ ok: true, stage, stories: [] });

  const list = await sectionStories(groupKey, roster, me.section);
  if (!list) return res.status(502).json({ ok: false, error: "Could not read the stories." });
  const byId = new Map(list.map(s => [s.id, s]));
  const myPod = (await rows(`/rest/v1/story_pods?select=pod&group_key=eq.${groupKey}&viewer_id=eq.${encodeURIComponent(email)}`))?.[0]?.pod || null;
  const podMates = myPod ? new Set(((await rows(`/rest/v1/story_pods?select=viewer_id&group_key=eq.${groupKey}&section=eq.${encodeURIComponent(me.section)}&pod=eq.${myPod}`)) || []).map(p => p.viewer_id)) : new Set();
  const podded = new Set(((await rows(`/rest/v1/story_pods?select=viewer_id&group_key=eq.${groupKey}`)) || []).map(p => p.viewer_id));
  const ids = list.map(s => s.id);
  const mineComments = ids.length ? ((await rows(`/rest/v1/story_comments?select=story_sheet,best,shone,encourage&author=eq.${encodeURIComponent(email)}&story_sheet=in.(${ids.join(",")})`)) || []) : [];
  const doneSet = new Set(mineComments.map(c => c.story_sheet));
  const ownId = list.find(s => s.owner.email === email)?.id || null;
  const doneOthers = [...doneSet].filter(id => id !== ownId).length;
  const due = await dueOf(groupKey);
  const released = stage === "released";

  if (action === "list") {
    const urls = await sign(list.map(s => featurePath(s.story)));
    const tiles = list.map(s => ({
      id: s.id, headline: s.story.headline, look: s.story.look, image: urls[featurePath(s.story)] || "",
      mine: s.owner.email === email, required: s.owner.email !== email && podMates.has(s.owner.email),
      done: doneSet.has(s.id), late: !!(due && Date.parse(s.submitted_at) > Date.parse(due)) || (podded.size > 0 && !podded.has(s.owner.email)),
      author: released ? s.owner.name : null,
    }));
    // The pod first, then the student's own, then everyone else in a fixed order that is not the roster's.
    const rank = (t) => (t.required ? 0 : t.mine ? 1 : 2);
    tiles.sort((a, b) => rank(a) - rank(b) || (a.id < b.id ? -1 : 1));
    return res.status(200).json({ ok: true, stage, stories: tiles, doneOthers, needed: OTHERS_BEFORE_OWN, read: doneOthers });
  }

  const story = byId.get(String(body.id || ""));
  if (!story) return res.status(404).json({ ok: false, error: "That story is not in your section." });
  const isMine = story.id === ownId;

  if (action === "story") {
    const urls = await sign(story.story.blocks.filter(b => b.type === "image").map(b => b.path));
    let comments = null;
    if (released && isMine) {
      const nameOf = new Map(roster.map(s => [s.email, s.name]));
      comments = ((await rows(`/rest/v1/story_comments?select=author,best,shone,encourage,updated_at&story_sheet=eq.${story.id}&order=updated_at`)) || [])
        .map(c => ({ author: c.author === email ? "You" : (nameOf.get(c.author) || "A classmate"), best: c.best, shone: c.shone, encourage: c.encourage }));
    }
    return res.status(200).json({
      ok: true, stage, story: forReader(story.story, urls), mine: isMine, author: released ? story.owner.name : null,
      myComment: mineComments.find(c => c.story_sheet === story.id) || null,
      canComment: stage === "reading" && (!isMine || doneOthers >= OTHERS_BEFORE_OWN),
      doneOthers, needed: OTHERS_BEFORE_OWN, comments,
    });
  }

  if (action === "comment") {
    if (stage !== "reading") return res.status(409).json({ ok: false, error: "Comments are closed." });
    if (isMine && doneOthers < OTHERS_BEFORE_OWN) return res.status(409).json({ ok: false, error: `Comment on ${OTHERS_BEFORE_OWN} classmates' stories first, then on your own.` });
    const c = { best: clean(body.best).slice(0, 3000), shone: clean(body.shone).slice(0, 3000), encourage: clean(body.encourage).slice(0, 3000) };
    const short = Object.entries(c).filter(([, v]) => words(v) < MIN_WORDS).map(([k]) => k);
    if (short.length) return res.status(400).json({ ok: false, error: "Each comment needs at least a full sentence.", short });
    const w = await write("/rest/v1/story_comments?on_conflict=story_sheet,author", "POST",
      { story_sheet: story.id, author: email, ...c, updated_at: new Date().toISOString() }, "return=representation,resolution=merge-duplicates");
    if (!w || !w[0]) return res.status(502).json({ ok: false, error: "The comment did not save." });
    return res.status(200).json({ ok: true, doneOthers: doneOthers + (isMine || doneSet.has(story.id) ? 0 : 1) });
  }

  return res.status(400).json({ ok: false, error: "Unknown action." });
}
