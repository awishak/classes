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
//   - A section opens on its own at its opens_at (Andrew, 2026-10-21: 12:05 AM
//     Monday for both COMM 3 sections), so nobody has to press the button.
//   - A section that opens with no pods saved gets pods on its own, pods of
//     about five from the stories in at that moment, similar topics together
//     (Andrew, 2026-10-23, from out of town: "I want this all to work
//     automatically"). Pods he saved himself before then stand.
//   - The comments come out on their own on Tuesday (RELEASES_AT in model.js).
//   - An HTML story (kind "html") goes out as a signed link to the file, and
//     the reader says the best image in words instead of tapping one.
//
// POST /api/visual-story { groupKey, action, ... } with the student's session
// in the bearer header, or the PIN or an instructor session for Andrew. In the
// practice class (COMM 999) Andrew can act as a student with { as: email }.

import { pinMatches, callerEmail, readBody } from "./_auth.js";
import { isInstructorEmail } from "../src/instructors.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";
import { answersOf } from "../src/engine/worktopia/store.js";
import { storyOf, stageAt, RELEASES_AT, mostlyDone, commentsOpen } from "../src/engine/visualstory/model.js";

const KEY = "visual-story";
const BUCKET = "visual-story";
const STORAGE = { comm3: "comm3-f26-v1", comm999: "comm999-v1" };
const PRACTICE = new Set(["comm999"]);
const STAGES = ["building", "reading", "closed", "released"];
const OTHERS_BEFORE_OWN = 8;
const MIN_CHARS = 50;
const MIN_WHERE = 3;
const PAGE = 1000;

const lower = (s) => String(s || "").trim().toLowerCase();
const clean = (s) => String(s || "").trim();

const rows = async (path) => {
  const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() });
  return r.ok ? await r.json().catch(() => null) : null;
};
// A write answers with the rows, or with what the database said went wrong.
// 2026-10-26: every comment in COMM 3 failed for a day with "The comment did
// not save" and nothing more, because the error was thrown away here. The
// cause was a column the live table never got (best_image, from
// sql/visual-story-best-image.sql, which was never run).
const writeOrError = async (path, method, body, prefer = "return=representation") => {
  const r = await fetch(SUPABASE_URL + path, { method, headers: { ...serviceHeaders(), Prefer: prefer }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (r.ok) return { rows: await r.json().catch(() => []), error: "" };
  const said = await r.json().catch(() => null);
  return { rows: null, error: said?.message || said?.error || ("HTTP " + r.status) };
};
const write = async (path, method, body, prefer) => (await writeOrError(path, method, body, prefer)).rows;

// The best image a reader picked, from the column when the live table has
// one, or from best_where where the pick rode while the column was missing.
const pickOf = (c) => {
  const m = /^image:([a-z]+)$/.exec(c.best_where || "");
  return { bestImage: c.best_image || (m ? m[1] : ""), bestWhere: m ? "" : (c.best_where || "") };
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
  const r = await rows(`/rest/v1/story_stage?select=stage,opens_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&section=eq.${encodeURIComponent(section)}`);
  return stageAt(r?.[0], Date.now(), RELEASES_AT[groupKey] || null);
}

async function dueOf(groupKey) {
  const r = await rows(`/rest/v1/worksheet_deadlines?select=due_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}`);
  return r?.[0]?.due_at || null;
}

// Pods of about five, the same arithmetic as the review page's Suggest pods,
// from a list already sorted so similar topics sit together.
function podsOf(emails, size = 5) {
  const n = emails.length;
  if (!n) return [];
  const k = Math.max(1, Math.round(n / size));
  const out = [];
  let at = 0;
  for (let i = 0; i < k; i++) {
    const take = Math.floor(n / k) + (i < n % k ? 1 : 0);
    emails.slice(at, at + take).forEach(email => out.push({ email, pod: i + 1 }));
    at += take;
  }
  return out;
}

// Pods for a section that opened with none saved: the students whose stories
// are in, sorted by the prompt and topic on their pre-production page so a
// pod reads similar stories, then cut into fives. Written with the table's
// own key (group_key, viewer_id), so two students opening the page in the
// same second cannot make two sets.
async function autoPods(groupKey, section, emails) {
  if (!emails.length) return [];
  const pre = (await rows(`/rest/v1/worksheet_sheets?select=id,viewer_id&worksheet_key=eq.visual-pre&group_key=eq.${groupKey}&limit=${PAGE}`)) || [];
  const mine = pre.filter(p => emails.includes(p.viewer_id));
  const by = mine.length ? (await answersFor(mine.map(p => p.id))) || {} : {};
  const answers = new Map(mine.map(p => [p.viewer_id, answersOf(by[p.id] || [])]));
  const sorted = emails.slice().sort((a, b) => {
    const A = answers.get(a) || {}, B = answers.get(b) || {};
    return String(A.prompt || "~").localeCompare(String(B.prompt || "~")) || String(A.topic || "").localeCompare(String(B.topic || "")) || a.localeCompare(b);
  });
  const list = podsOf(sorted).map(p => ({ group_key: groupKey, section, pod: p.pod, viewer_id: p.email }));
  const w = await write("/rest/v1/story_pods?on_conflict=group_key,viewer_id", "POST", list, "return=representation,resolution=merge-duplicates");
  return w ? list.map(p => ({ section, pod: p.pod, viewer_id: p.viewer_id })) : [];
}

// The submitted stories of one section, with their owners and their stories.
async function sectionStories(groupKey, roster, section) {
  const inSection = new Map(roster.filter(s => s.section === section).map(s => [s.email, s]));
  const sheets = await rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&limit=${PAGE}`);
  if (!sheets) return null;
  const mine = sheets.filter(s => inSection.has(s.viewer_id));
  const by = mine.length ? await answersFor(mine.map(s => s.id)) : {};
  if (!by) return null;
  // Submitted, or most of the way there and published unsubmitted, the same
  // stories the students' grid shows.
  return mine.map(s => ({ id: s.id, owner: inSection.get(s.viewer_id), submitted_at: s.submitted_at, story: storyOf(answersOf(by[s.id] || [])) }))
    .filter(s => s.submitted_at || mostlyDone(s.story));
}

// Only what a tile needs: the headline, the look, and the star picture, as a
// signed link. Shared by the students' grid and Andrew's.
async function tilesOf(ids) {
  const head = {};
  if (ids.length) {
    const top = (await rows(`/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids.join(",")})&field=in.(headline,look,feature,order)&order=position&limit=${PAGE * 4}`)) || [];
    top.forEach(r => { const m = (head[r.sheet_id] = head[r.sheet_id] || {}); m[r.field] = (m[r.field] || "") + r.value; });
    const want = ids.map(id => { const m = head[id] || {}; let first = ""; try { first = (JSON.parse(m.order || "[]") || [])[0] || ""; } catch { /* no order */ } return [id, m.feature || first]; }).filter(([, b]) => /^[a-z]+$/.test(b));
    if (want.length) {
      const blocks = (await rows(`/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${want.map(w => w[0]).join(",")})&field=in.(${want.map(w => '"block:' + w[1] + '"').join(",")})&order=position&limit=${PAGE}`)) || [];
      const joined = {};
      blocks.forEach(r => { const k = r.sheet_id + " " + r.field; joined[k] = (joined[k] || "") + r.value; });
      want.forEach(([id, b]) => { try { head[id].path = JSON.parse(joined[id + " block:" + b] || "{}").path || ""; } catch { /* no picture */ } });
    }
  }
  const urls = await sign(ids.map(id => head[id]?.path));
  return { head, urls };
}

/** The picture's place in the story, 1 for the first picture, or null. */
const pictureNo = (story, id) => { const i = story && id ? story.blocks.filter(b => b.type === "image").findIndex(b => b.id === id) : -1; return i < 0 ? null : i + 1; };

const featurePath = (story) => {
  const images = story.blocks.filter(b => b.type === "image");
  return (images.find(b => b.id === story.feature) || images[0] || {}).path || "";
};

// What a classmate may see of a story: no reasons, and links instead of paths.
// Someone else's name on a photo waits for release, like the author's. An
// HTML story's file name could carry a name too, so only its link goes out.
const forReader = (story, urls, released) => ({
  headline: story.headline, link: story.link, look: story.look, kind: story.kind,
  html: story.html ? { url: urls[story.html.path] || "" } : null,
  blocks: story.blocks.map(b => b.type === "text"
    ? { id: b.id, type: "text", text: b.text || "" }
    : { id: b.id, type: "image", url: urls[b.path] || "", w: b.w, h: b.h, layout: b.layout, caption: b.caption || "", graphic: !!b.graphic, source: b.source || "", by: b.by === "other" ? "other" : "", byName: released && b.by === "other" ? b.byName || "" : "" }),
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const groupKey = String(body.groupKey || "");
  if (!STORAGE[groupKey]) return res.status(400).json({ ok: false, error: "This class has no visual story." });
  const action = String(body.action || "");
  // Who is asking, with one look at the sign-in: the PIN, or the session's email.
  const sessionEmail = pinMatches(body.pin) ? "" : await callerEmail(req);
  const instructor = pinMatches(body.pin) || isInstructorEmail(sessionEmail);

  // ─── Andrew's controls ───
  if (["admin", "stage", "opens", "pods", "practice-fill", "practice-clear"].includes(action)) {
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
      for (const [n, f] of fakes.entries()) {
        const sh = await write("/rest/v1/worksheet_sheets", "POST", { worksheet_key: KEY, group_key: groupKey, viewer_id: f.email, submitted_at: new Date().toISOString() });
        if (!sh || !sh[0]) continue;
        const copy = srcRows.filter(r => r.field !== "headline").map(r => ({ sheet_id: sh[0].id, field: r.field, value: r.value, position: r.position }));
        copy.push({ sheet_id: sh[0].id, field: "headline", value: "Practice story " + (n + 1), position: 0 });
        if (await write("/rest/v1/worksheet_answers", "POST", copy)) made++;
      }
      return res.status(200).json({ ok: true, made });
    }
    // Pressing a stage button is the word on the stage, so it also clears the open time.
    if (action === "stage") {
      const section = clean(body.section), stage = String(body.stage || "");
      if (!STAGES.includes(stage)) return res.status(400).json({ ok: false, error: "Not a stage." });
      const w = await write("/rest/v1/story_stage?on_conflict=worksheet_key,group_key,section", "POST",
        { worksheet_key: KEY, group_key: groupKey, section, stage, opens_at: null, updated_at: new Date().toISOString() }, "return=representation,resolution=merge-duplicates");
      return w && w[0] ? res.status(200).json({ ok: true, stage: w[0].stage }) : res.status(502).json({ ok: false, error: "The stage did not save." });
    }
    // The time a building section opens for reading on its own; null takes the time away.
    if (action === "opens") {
      const section = clean(body.section);
      const at = body.opensAt ? new Date(body.opensAt) : null;
      if (at && Number.isNaN(at.getTime())) return res.status(400).json({ ok: false, error: "Not a time." });
      const w = await write("/rest/v1/story_stage?on_conflict=worksheet_key,group_key,section", "POST",
        { worksheet_key: KEY, group_key: groupKey, section, opens_at: at ? at.toISOString() : null, updated_at: new Date().toISOString() }, "return=representation,resolution=merge-duplicates");
      return w && w[0] ? res.status(200).json({ ok: true, opensAt: w[0].opens_at || null }) : res.status(502).json({ ok: false, error: "The time did not save." });
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
    const stageRows = (await rows(`/rest/v1/story_stage?select=section,stage,opens_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}`)) || [];
    const stages = {}, opens = {};
    for (const s of sections) { const row = stageRows.find(r => r.section === s); stages[s] = stageAt(row, Date.now(), RELEASES_AT[groupKey] || null); opens[s] = row?.opens_at || null; }
    const pods = (await rows(`/rest/v1/story_pods?select=section,pod,viewer_id&group_key=eq.${groupKey}`)) || [];
    const nameOf = new Map(roster.map(s => [s.email, s.name]));
    const all = [];
    for (const s of sections) { const list = await sectionStories(groupKey, roster, s); if (list) all.push(...list); }
    const ids = all.map(s => s.id);
    const comments = ids.length ? ((await rows(`/rest/v1/story_comments?select=*&story_sheet=in.(${ids.join(",")})&limit=5000`)) || []) : [];
    const ownerOf = new Map(all.map(s => [s.id, s.owner.email]));
    const storyById = new Map(all.map(s => [s.id, s.story]));
    const counts = {};
    comments.forEach(c => { if (ownerOf.get(c.story_sheet) !== c.author) counts[c.author] = (counts[c.author] || 0) + 1; });
    return res.status(200).json({
      ok: true, sections, stages, opens, due: await dueOf(groupKey), releasesAt: RELEASES_AT[groupKey] || null,
      people: roster.map(r => ({ name: r.name, email: r.email, section: r.section })),
      pods: pods.map(p => ({ section: p.section, pod: p.pod, email: p.viewer_id, name: nameOf.get(p.viewer_id) || p.viewer_id })),
      stories: all.map(s => ({ id: s.id, email: s.owner.email, name: s.owner.name, section: s.owner.section, submitted_at: s.submitted_at, headline: s.story.headline, kind: s.story.kind })),
      counts,
      comments: comments.map(c => ({ story: c.story_sheet, owner: nameOf.get(ownerOf.get(c.story_sheet)) || "", ownerEmail: ownerOf.get(c.story_sheet) || "", author: nameOf.get(c.author) || c.author, authorEmail: c.author, bestPicture: pictureNo(storyById.get(c.story_sheet), pickOf(c).bestImage), bestWhere: pickOf(c).bestWhere, best: c.best, shone: c.shone, encourage: c.encourage, updated_at: c.updated_at })),
    });
  }

  // ─── Andrew's grid: every story, in progress or not, with names ───
  // Andrew, 2026-10-23: "let me as the instructor see all the student stories
  // in progress on that page, and you can give me a chip for not yet
  // submitted. students won't see anything until monday." The stage stays
  // whatever it is for students; this branch is his alone.
  if (action === "every" || action === "peek") {
    if (!instructor) return res.status(401).json({ ok: false, error: "Only the instructor can see every story." });
    const roster = await rosterOf(groupKey);
    const byEmail = new Map(roster.map(s => [s.email, s]));
    const due = await dueOf(groupKey);
    if (action === "every") {
      const sheets = (await rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&limit=${PAGE}`)) || [];
      const list = sheets.filter(s => byEmail.has(s.viewer_id));
      const { head, urls } = await tilesOf(list.map(s => s.id));
      const started = new Set(list.map(s => s.viewer_id));
      const sections = [...new Set(roster.map(s => s.section))];
      return res.status(200).json({
        ok: true, sections, due,
        stories: list.map(s => {
          const who = byEmail.get(s.viewer_id);
          return { id: s.id, headline: head[s.id]?.headline || "", look: head[s.id]?.look === "dark" ? "dark" : "light", image: urls[head[s.id]?.path] || "",
            author: who.name, section: who.section, submitted_at: s.submitted_at, late: !!(s.submitted_at && due && Date.parse(s.submitted_at) > Date.parse(due)) };
        }).sort((a, b) => a.author.localeCompare(b.author)),
        notStarted: roster.filter(s => !started.has(s.email)).map(s => ({ name: s.name, section: s.section })),
      });
    }
    const id = String(body.id || "");
    if (!/^[0-9a-f-]{36}$/.test(id)) return res.status(400).json({ ok: false, error: "Not a story." });
    const sheet = (await rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&id=eq.${id}&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}`))?.[0];
    if (!sheet) return res.status(404).json({ ok: false, error: "That story is not in this class." });
    const by = await answersFor([sheet.id]);
    if (!by) return res.status(502).json({ ok: false, error: "Could not read the story." });
    const story = storyOf(answersOf(by[sheet.id] || []));
    const urls = await sign([...story.blocks.filter(b => b.type === "image").map(b => b.path), story.html?.path]);
    const who = byEmail.get(sheet.viewer_id);
    return res.status(200).json({ ok: true, story: forReader(story, urls, true), author: who?.name || sheet.viewer_id, section: who?.section || "", submitted_at: sheet.submitted_at, late: !!(sheet.submitted_at && due && Date.parse(sheet.submitted_at) > Date.parse(due)) });
  }

  // ─── a student, or Andrew acting as one in the practice class ───
  // The queries that do not depend on each other go out together: a class of
  // 35 opening the grid at once should wait on one round trip, not ten.
  const roster = await rosterOf(groupKey);
  let email = instructor ? "" : sessionEmail;
  if (instructor && body.as && PRACTICE.has(groupKey)) email = lower(body.as);
  // Andrew's own home shows the students' bars. Andrew, 2026-10-23: "if it's
  // there for the students, i want to see it too." With no student to be, the
  // status is the furthest along any section is.
  if (instructor && !email && action === "status") {
    const sections = [...new Set(roster.map(s => s.section))];
    const stages = await Promise.all(sections.map(s => stageOf(groupKey, s)));
    const furthest = stages.sort((a, b) => STAGES.indexOf(b) - STAGES.indexOf(a))[0] || "building";
    return res.status(200).json({ ok: true, stage: furthest, stages: Object.fromEntries(sections.map((s, i) => [s, stages[i]])) });
  }
  if (!email) return res.status(instructor ? 400 : 401).json({ ok: false, error: instructor ? "Open the stories as a student in the practice class with ?as=<email>." : "Not signed in." });
  const me = roster.find(s => s.email === email);
  if (!me) return res.status(403).json({ ok: false, error: "Not on the roster for this class." });

  // ─── where the student's section stands ───
  // One light read for the door under My work, so the portal can say whether
  // the classmates' stories are open without pulling the grid. Andrew,
  // 2026-10-16: "it needs to be a link under My work when appropriate."
  if (action === "status") return res.status(200).json({ ok: true, stage: await stageOf(groupKey, me.section) });

  let [stage, sheets, podRows, myRows, due] = await Promise.all([
    stageOf(groupKey, me.section),
    rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&limit=${PAGE}`),
    rows(`/rest/v1/story_pods?select=section,pod,viewer_id&group_key=eq.${groupKey}`),
    rows(`/rest/v1/story_comments?select=*&author=eq.${encodeURIComponent(email)}&limit=${PAGE}`),
    dueOf(groupKey),
  ]);
  if (stage === "building") return res.status(200).json({ ok: true, stage, stories: [] });
  if (!sheets) return res.status(502).json({ ok: false, error: "Could not read the stories." });

  const inSection = new Map(roster.filter(s => s.section === me.section).map(s => [s.email, s]));
  // A story that is most of the way there goes out with the submitted ones.
  // Andrew, 2026-10-26: "if a student didn't complete their story, but has
  // most of it done, publish it anyway." mostlyDone in model.js says how much.
  const own = sheets.filter(s => inSection.has(s.viewer_id));
  const unfinished = own.filter(s => !s.submitted_at);
  const byUnfinished = unfinished.length ? await answersFor(unfinished.map(s => s.id)) : {};
  const published = new Set(unfinished.filter(s => byUnfinished && mostlyDone(storyOf(answersOf(byUnfinished[s.id] || [])))).map(s => s.id));
  const list = own.filter(s => s.submitted_at || published.has(s.id)).map(s => ({ id: s.id, owner: inSection.get(s.viewer_id), submitted_at: s.submitted_at }));
  const byId = new Map(list.map(s => [s.id, s]));
  // The section is open and nobody made pods: make them now, from the stories in.
  if (!(podRows || []).some(p => p.section === me.section)) {
    const made = await autoPods(groupKey, me.section, list.map(s => s.owner.email));
    podRows = [...(podRows || []), ...made];
  }
  const myPod = (podRows || []).find(p => p.viewer_id === email)?.pod || null;
  const podMates = new Set((podRows || []).filter(p => myPod && p.pod === myPod && p.section === me.section).map(p => p.viewer_id));
  const mineComments = (myRows || []).filter(c => byId.has(c.story_sheet)).map(c => ({ story_sheet: c.story_sheet, ...pickOf(c), best: c.best, shone: c.shone, encourage: c.encourage }));
  const doneSet = new Set(mineComments.map(c => c.story_sheet));
  const ownId = list.find(s => s.owner.email === email)?.id || null;
  const doneOthers = [...doneSet].filter(id => id !== ownId).length;
  const released = stage === "released";
  const open = commentsOpen(stage, groupKey);

  if (action === "list") {
    // Only what a tile needs: the headline, the look, and the star picture.
    const { head, urls } = await tilesOf(list.map(s => s.id));
    const tiles = list.map(s => ({
      id: s.id, headline: head[s.id]?.headline || "", look: head[s.id]?.look === "dark" ? "dark" : "light", image: urls[head[s.id]?.path] || "",
      mine: s.owner.email === email, required: s.owner.email !== email && podMates.has(s.owner.email),
      done: doneSet.has(s.id), late: !!(s.submitted_at && due && Date.parse(s.submitted_at) > Date.parse(due)),
      author: released ? s.owner.name : null,
    }));
    // The pod first, then the student's own, then everyone else in a fixed order that is not the roster's.
    const rank = (t) => (t.required ? 0 : t.mine ? 1 : 2);
    tiles.sort((a, b) => rank(a) - rank(b) || (a.id < b.id ? -1 : 1));
    return res.status(200).json({ ok: true, stage, commentsOpen: open, stories: tiles, doneOthers, needed: OTHERS_BEFORE_OWN, read: doneOthers });
  }

  const story = byId.get(String(body.id || ""));
  if (!story) return res.status(404).json({ ok: false, error: "That story is not in your section." });
  const isMine = story.id === ownId;

  if (action === "story") {
    const by = await answersFor([story.id]);
    if (!by) return res.status(502).json({ ok: false, error: "Could not read the story." });
    story.story = storyOf(answersOf(by[story.id] || []));
    const urls = await sign([...story.story.blocks.filter(b => b.type === "image").map(b => b.path), story.story.html?.path]);
    let comments = null;
    if (released && isMine) {
      const nameOf = new Map(roster.map(s => [s.email, s.name]));
      comments = ((await rows(`/rest/v1/story_comments?select=*&story_sheet=eq.${story.id}&order=updated_at`)) || [])
        .map(c => ({ author: c.author === email ? "You" : (nameOf.get(c.author) || "A classmate"), ...pickOf(c), best: c.best, shone: c.shone, encourage: c.encourage }));
    }
    return res.status(200).json({
      ok: true, stage, story: forReader(story.story, urls, released), mine: isMine, author: released ? story.owner.name : null,
      myComment: mineComments.find(c => c.story_sheet === story.id) || null,
      commentsOpen: open, canComment: open && (!isMine || doneOthers >= OTHERS_BEFORE_OWN),
      doneOthers, needed: OTHERS_BEFORE_OWN, comments,
    });
  }

  if (action === "comment") {
    if (!open) return res.status(409).json({ ok: false, error: "Comments are closed." });
    if (isMine && doneOthers < OTHERS_BEFORE_OWN) return res.status(409).json({ ok: false, error: `Comment on ${OTHERS_BEFORE_OWN} classmates' stories first, then on your own.` });
    const c = { best: clean(body.best).slice(0, 3000), shone: clean(body.shone).slice(0, 3000), encourage: clean(body.encourage).slice(0, 3000) };
    const short = Object.entries(c).filter(([, v]) => v.length < MIN_CHARS).map(([k]) => k);
    // The best image is picked from the story's own pictures, so the pick has
    // to be one of them. An HTML story has none to tap, so the reader says
    // which image and where in words instead.
    const kindRow = await rows(`/rest/v1/worksheet_answers?select=value&sheet_id=eq.${story.id}&field=eq.kind&limit=1`);
    const htmlStory = kindRow?.[0]?.value === "html";
    const bestImage = htmlStory ? "" : String(body.bestImage || "");
    const bestWhere = htmlStory ? clean(body.bestWhere).slice(0, 1000) : "";
    const picked = htmlStory
      ? bestWhere.length >= MIN_WHERE
      : /^[a-z]+$/.test(bestImage) && ((await rows(`/rest/v1/worksheet_answers?select=value&sheet_id=eq.${story.id}&field=eq.${encodeURIComponent("block:" + bestImage)}&limit=1`)) || []).length > 0;
    if (!picked) short.unshift(htmlStory ? "bestWhere" : "bestImage");
    const pickSay = htmlStory ? "say which image was the best, and where it is" : "tap the best image";
    if (short.length) return res.status(400).json({ ok: false, error: !picked && short.length === 1 ? pickSay[0].toUpperCase() + pickSay.slice(1) + "." : `Each comment needs at least ${MIN_CHARS} characters${picked ? "" : ", and " + pickSay}.`, short });
    const path = "/rest/v1/story_comments?on_conflict=story_sheet,author", prefer = "return=representation,resolution=merge-duplicates";
    const row = { story_sheet: story.id, author: email, best_image: bestImage, best_where: bestWhere, ...c, updated_at: new Date().toISOString() };
    let w = await writeOrError(path, "POST", row, prefer);
    // The live table has no best_image column until sql/visual-story-best-image.sql
    // runs. Until then the pick rides in best_where as image:<id>, which
    // pickOf reads back, so no comment waits on the schema.
    if (w.error && /best_image/.test(w.error)) {
      const { best_image, ...without } = row;
      w = await writeOrError(path, "POST", { ...without, best_where: best_image ? "image:" + best_image : bestWhere }, prefer);
    }
    if (!w.rows || !w.rows[0]) return res.status(502).json({ ok: false, error: "The comment did not save. " + w.error });
    return res.status(200).json({ ok: true, doneOthers: doneOthers + (isMine || doneSet.has(story.id) ? 0 : 1) });
  }

  return res.status(400).json({ ok: false, error: "Unknown action." });
}
