// The final project's exhibits: one file a project, kept where no browser can
// reach, and everything that touches a file goes through here.
//
// Andrew, 2026-11-23, set the rules this route holds:
//   - "One shared exhibit": a pair opens the same file and either partner
//     edits. Who is a pair comes from the decisions file the preferences
//     review writes (final-project.js); everyone else works alone.
//   - It "locks at noon" on Thursday, December 10. After that nothing is
//     saved or uploaded, unless he has reopened that one project.
//   - Nothing is public until he presses Release, one button a class. Before
//     that a project is read by its makers, by him, and by anyone holding
//     its private preview link.
//   - Anyone with the preview link can leave a note on a block; only the
//     makers and he read the notes.
//
// The files sit in the private `instructor` bucket beside the decisions
// file. Pictures, audio and HTML files go to the public `notes` bucket on a
// link signed here, the way /api/upload does for him.
//
// GET  ?class=&mine=1                   a maker: { ok, doc, locked, due, released }
// GET  ?class=&id=[&preview=]           a reader: { ok, doc, can }
// GET  ?class=&id=&notes=1              makers and instructor: { ok, notes }
// GET  ?class=&gallery=1                { ok, released, cards } (instructor: every project)
// POST ?class=  { op: "save", doc }     a maker: { ok, doc }
// POST ?class=  { op: "upload", name, type, size }  a maker: { ok, uploadUrl, publicUrl }
// POST ?class=  { op: "note", id, preview, block, text, name }  a reader with the link
// POST ?class=  { op: "noteGone", id, note }       a maker or the instructor
// POST ?class=  { op: "state", released, unlock: { id, until } }   the instructor

import { createHash, randomBytes } from "node:crypto";
import { callerAllowed, callerEmail, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";
import { isInstructorEmail } from "../src/instructors.js";
import { CLASSES, PRACTICE, FINAL_DUE, MAX_DOC, MAX_COMMENT, emptyDoc, mergeDocs, publicDoc, lockedAt, checklist, outlineDone, wordCount, idOfSlug } from "../src/engine/exhibit/model.js";

const BUCKET = "instructor";
const MEDIA = "notes";
const MAX_BYTES = 50 * 1024 * 1024;
const lower = (s) => String(s || "").trim().toLowerCase();
const clsOf = (id) => String(id || "").toLowerCase().replace(/[^a-z0-9-]+/g, "");
const fileFor = (cls, id) => `exhibits/${cls}/${id}.json`;
const notesFor = (cls, id) => `exhibits/${cls}/${id}.notes.json`;
const stateFor = (cls) => `exhibits/${cls}/_state.json`;

async function readJson(object) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${object}`, { headers: serviceHeaders(), cache: "no-store" });
  if (!r.ok) return r.status === 404 || r.status === 400 ? null : { __error: r.status };
  return await r.json().catch(() => null);
}
async function writeJson(object, value) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${object}`, { method: "POST", headers: { ...serviceHeaders(), "x-upsert": "true", "cache-control": "no-store" }, body: JSON.stringify(value) });
  return r.ok;
}
async function rosterOf(cls) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(CLASSES[cls] + "-plan")}&select=data`, { headers: serviceHeaders() });
  const plan = r.ok ? await r.json().catch(() => null) : null;
  const slug = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (plan?.[0]?.data?.students || [])
    .map(s => (s && !s.email && PRACTICE.includes(cls) && s.name ? { ...s, email: slug(s.name) + "@practice.test" } : s))
    .filter(s => s && s.email).map(s => ({ name: s.name || "", email: lower(s.email), section: String(s.section || "").trim() }));
}
// Who this student makes the project with: their pair off the decisions file, or themselves.
async function makersOf(cls, email) {
  const file = await readJson(`${cls}-final-prefs.json`);
  const pair = (Array.isArray(file?.pairs) ? file.pairs : []).find(p => Array.isArray(p) && p.map(lower).includes(email));
  return (pair ? pair.map(lower) : [email]).sort();
}
const idFor = (cls, makers) => createHash("sha256").update(cls + "\n" + makers.join("\n")).digest("hex").slice(0, 10);
const stateOf = async (cls) => { const s = await readJson(stateFor(cls)); return s && !s.__error ? s : {}; };
const lockOf = (state, id, now = Date.now()) => lockedAt(now, { due: FINAL_DUE, until: state?.unlocks?.[id] || "" });

// What a card on the gallery or on his page carries.
const cardOf = (doc, cls, full) => ({
  id: doc.id, cls, headline: doc.headline || "", summary: doc.summary || "", names: doc.names || [], way: doc.way, area: doc.area || "",
  cover: doc.cover || {}, pal: doc.pal, type: doc.type, updated: doc.updated,
  ...(full ? { makers: doc.makers, preview: doc.preview, outline: outlineDone(doc), words: wordCount(doc), list: checklist(doc, cls), pages: (doc.pages || []).map(p => ({ name: p.name, plan: p.plan, blocks: (p.blocks || []).length })), who: doc.who || "" } : {}),
});

async function listDocs(cls) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, { method: "POST", headers: serviceHeaders(), body: JSON.stringify({ prefix: `exhibits/${cls}/`, limit: 1000 }) });
  const rows = r.ok ? await r.json().catch(() => []) : [];
  const ids = (Array.isArray(rows) ? rows : []).map(x => x.name).filter(n => /^[a-f0-9]{10}\.json$/.test(n)).map(n => n.slice(0, 10));
  const docs = await Promise.all(ids.map(id => readJson(fileFor(cls, id))));
  return docs.filter(d => d && !d.__error && d.id);
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");
  const q = req.query || {};
  const cls = clsOf(q.class);
  if (!CLASSES[cls]) return res.status(400).json({ ok: false, error: "This class has no final project here." });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const body = req.method === "POST" ? readBody(req) || {} : {};
  const email = lower(await callerEmail(req));
  const instructor = isInstructorEmail(email) || (await callerAllowed(req, { pin: body.pin || q.pin }));
  const state = await stateOf(cls);
  const released = state.released === true;

  // ── reading ──
  if (req.method === "GET") {
    if (q.gallery) {
      if (!released && !instructor) return res.status(200).json({ ok: true, released: false, cards: [] });
      const docs = await listDocs(cls);
      const shown = instructor && q.all ? docs : docs.filter(d => d.headline && !d.staff);
      return res.status(200).json({ ok: true, released, unlocks: instructor ? state.unlocks || {} : undefined, due: FINAL_DUE, cards: shown.map(d => cardOf(d, cls, instructor && !!q.all)) });
    }
    if (q.mine) {
      if (!email) return res.status(401).json({ ok: false, error: "Sign in to open your project." });
      const roster = await rosterOf(cls);
      const as = instructor && q.as ? lower(q.as) : email;
      // The instructor can build a project of his own to try the builder; the file is marked and never reaches the gallery.
      const staff = instructor && as === email && !roster.some(s => s.email === as);
      if (!staff && !roster.some(s => s.email === as)) return res.status(403).json({ ok: false, error: "Not on the roster for this class." });
      const makers = staff ? [as] : await makersOf(cls, as);
      const id = idFor(cls, makers);
      let doc = await readJson(fileFor(cls, id));
      if (doc?.__error) return res.status(502).json({ ok: false, error: `The store said ${doc.__error}.` });
      const nameOf = new Map(roster.map(s => [s.email, s.name]));
      if (!doc) {
        doc = { ...emptyDoc({ id, cls, makers, names: makers.map(m => nameOf.get(m) || (staff ? "Dr. Ishak" : m)) }), preview: randomBytes(9).toString("base64url"), ...(staff ? { staff: true } : {}) };
        // A solo file started before he paired two students is carried into the pair's file, the fuller one first.
        if (makers.length > 1) {
          const olds = (await Promise.all(makers.map(m => readJson(fileFor(cls, idFor(cls, [m])))))).filter(d => d && !d.__error && d.id);
          const best = olds.sort((a, b) => JSON.stringify(b.pages || []).length - JSON.stringify(a.pages || []).length)[0];
          if (best) doc = { ...best, id, makers, names: doc.names, preview: doc.preview, rev: 0 };
        }
        if (!lockOf(state, id)) await writeJson(fileFor(cls, id), doc);
      }
      return res.status(200).json({ ok: true, doc, locked: lockOf(state, id), due: FINAL_DUE, released, me: as });
    }
    const id = idOfSlug(q.id);
    if (!id) return res.status(400).json({ ok: false, error: "Which project?" });
    const doc = await readJson(fileFor(cls, id));
    if (!doc || doc.__error) return res.status(404).json({ ok: false, error: "There is no project at this address." });
    const maker = !!email && (doc.makers || []).includes(email);
    const holder = !!q.preview && String(q.preview) === doc.preview;
    if (q.notes) {
      if (!maker && !instructor) return res.status(403).json({ ok: false, error: "The notes are for the makers." });
      const notes = await readJson(notesFor(cls, id));
      return res.status(200).json({ ok: true, notes: Array.isArray(notes) ? notes : [] });
    }
    if (!released && !maker && !instructor && !holder) return res.status(403).json({ ok: false, error: "This project is not public yet." });
    return res.status(200).json({ ok: true, doc: publicDoc(doc), released, can: { note: holder || maker || instructor, edit: maker } });
  }

  // ── writing ──
  const op = String(body.op || "");
  if (op === "state") {
    if (!instructor) return res.status(401).json({ ok: false, error: "Releasing is the instructor's." });
    const next = { ...state };
    if (typeof body.released === "boolean") next.released = body.released;
    if (body.unlock?.id) { next.unlocks = { ...(next.unlocks || {}) }; if (body.unlock.until) next.unlocks[idOfSlug(body.unlock.id)] = String(body.unlock.until); else delete next.unlocks[idOfSlug(body.unlock.id)]; }
    if (!(await writeJson(stateFor(cls), next))) return res.status(502).json({ ok: false, error: "The store did not take the change." });
    return res.status(200).json({ ok: true, state: next });
  }

  if (op === "note") {
    const id = idOfSlug(body.id);
    const doc = id ? await readJson(fileFor(cls, id)) : null;
    if (!doc || doc.__error) return res.status(404).json({ ok: false, error: "There is no project at this address." });
    const maker = !!email && (doc.makers || []).includes(email);
    if (!(String(body.preview || "") === doc.preview || maker || instructor)) return res.status(403).json({ ok: false, error: "Notes need the preview link." });
    const text = String(body.text || "").trim().slice(0, MAX_COMMENT);
    if (!text) return res.status(400).json({ ok: false, error: "The note is empty." });
    const roster = email ? await rosterOf(cls) : [];
    const known = roster.find(s => s.email === email);
    const name = instructor ? "Dr. Ishak" : known ? known.name : String(body.name || "").trim().slice(0, 60);
    if (!name) return res.status(400).json({ ok: false, error: "Add your name." });
    const notes = await readJson(notesFor(cls, id));
    const list = Array.isArray(notes) ? notes : [];
    if (list.length >= 500) return res.status(400).json({ ok: false, error: "This project has all the notes it can hold." });
    const note = { id: randomBytes(6).toString("hex"), block: String(body.block || "").slice(0, 40), text, name, classmate: !!known, at: new Date().toISOString() };
    if (!(await writeJson(notesFor(cls, id), [...list, note]))) return res.status(502).json({ ok: false, error: "The note did not save." });
    return res.status(200).json({ ok: true, note });
  }

  if (!email) return res.status(401).json({ ok: false, error: "Sign in to work on your project." });
  const roster = await rosterOf(cls);
  const as = instructor && body.as ? lower(body.as) : email;
  const staff = instructor && as === email && !roster.some(s => s.email === as);
  if (!staff && !roster.some(s => s.email === as)) return res.status(403).json({ ok: false, error: "Not on the roster for this class." });
  const makers = staff ? [as] : await makersOf(cls, as);
  const id = idFor(cls, makers);

  if (op === "noteGone") {
    const notes = await readJson(notesFor(cls, id));
    const list = (Array.isArray(notes) ? notes : []).filter(n => n.id !== String(body.note || ""));
    if (!(await writeJson(notesFor(cls, id), list))) return res.status(502).json({ ok: false, error: "The note did not go." });
    return res.status(200).json({ ok: true });
  }

  if (lockOf(state, id)) return res.status(423).json({ ok: false, locked: true, error: "The final project closed on Thursday, December 10, at 12 PM." });

  if (op === "upload") {
    const type = String(body.type || ""), size = Number(body.size || 0), name = String(body.name || "file");
    const html = /\.html?$/i.test(name) || type === "text/html";
    if (!(/^(image|audio)\//.test(type) || html)) return res.status(400).json({ ok: false, error: "An image, an audio file or an HTML file can go up." });
    if (!size || size > MAX_BYTES) return res.status(400).json({ ok: false, error: "The file has to be under 50 MB." });
    const clean = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(-60) || "file";
    const path = `exhibits/${cls}/${id}/${Date.now().toString(36)}-${clean}`;
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${MEDIA}/${path}`, { method: "POST", headers: serviceHeaders(), body: "{}" });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.url) return res.status(502).json({ ok: false, error: "The store would not take a file: " + (out.message || out.error || r.status) });
    return res.status(200).json({ ok: true, uploadUrl: `${SUPABASE_URL}/storage/v1${out.url}`, publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${MEDIA}/${path}` });
  }

  if (op === "save") {
    const incoming = body.doc;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return res.status(400).json({ ok: false, error: "Nothing to save." });
    const server = await readJson(fileFor(cls, id));
    if (server?.__error) return res.status(502).json({ ok: false, error: `The store said ${server.__error}.` });
    if (!server) return res.status(404).json({ ok: false, error: "Open the project first." });
    const merged = mergeDocs(server, incoming);
    merged.rev = (server.rev || 0) + 1;
    merged.updated = Date.now();
    const text = JSON.stringify(merged);
    if (text.length > MAX_DOC) return res.status(400).json({ ok: false, error: "The project is too large to save. Shorten a text block." });
    if (!(await writeJson(fileFor(cls, id), merged))) return res.status(502).json({ ok: false, error: "The project did not save." });
    // The whole file goes back only when a partner's work came in with it.
    const moved = (server.rev || 0) !== (incoming.rev || 0);
    return res.status(200).json({ ok: true, rev: merged.rev, doc: moved ? merged : undefined });
  }

  return res.status(400).json({ ok: false, error: "Nothing to do." });
}
