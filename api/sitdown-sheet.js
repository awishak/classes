// The instructor's Sit-Down 1 sheet, for the instructor only.
//
// Andrew, 2026-10-20: "deploy and make sure only i have access." The sheet
// says who worked hard and who is thin, by name, and this repo is public, so
// the file is not in the repo and not in a row the anon key can read. It sits
// in the private `instructor` bucket (scripts/sitdown-sheet.mjs puts it there)
// and comes out through here, only to a session whose email teaches.
//
// GET /api/sitdown-sheet?class=comm118  with the instructor's session in the
// bearer header, or the PIN as ?pin=.

import { callerAllowed, callerEmail, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceHeaders } from "./_supabase.js";

const BUCKET = "instructor";
// ?sheet=2 is the Sit-Down 2 file, Claude's read of each Culture Guide, kept
// the same way for the same reason. Andrew, 2026-11-12: "when i meet with a
// student, i need to see their culture guide as well as your small analysis."
// ?sheet=audio-pre is Claude's read of COMM 3's audio story pre-production
// clips, kept the same way. Andrew, 2026-11-12: "deploy a page for me to
// see, following our standard structure for review of assignments."
const objectFor = (id, n) => {
  const cls = String(id || "").toLowerCase().replace(/[^a-z0-9-]+/g, "");
  // ?sheet=audio-pre-notes is his own notes on each student's pre-production,
  // what he will say to them, kept private until he releases anything.
  // Andrew, 2026-11-12: "don't push anything to students until i say so. i
  // will have notes for them." POST { email, note } writes one student's note.
  if (String(n) === "audio-pre-notes") return `${cls}-audio-pre-notes.json`;
  return String(n) === "audio-pre" ? `${cls}-audio-pre-read.json` : `${cls}-sitdown-${String(n) === "2" ? 2 : 1}.json`;
};

export default async function handler(req, res) {
  const q = req.query || {};
  const notes = String(q.sheet) === "audio-pre-notes";
  if (req.method !== "GET" && !(req.method === "POST" && notes)) return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");
  const body = req.method === "POST" ? readBody(req) || {} : {};
  // ?sheet=audio-pre-feedback is the one way a note leaves this file for a
  // student: their own note, to their own session, and only once the notes
  // file says released. Andrew, 2026-11-12: "it should have some feedback up
  // top" of the audio story page. An instructor reads any one student's note
  // with &as=<email>, released or not, to see the page as that student will.
  if (String(q.sheet) === "audio-pre-feedback") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const teaches = await callerAllowed(req, { pin: q.pin });
    const me = teaches ? String(q.as || "").trim().toLowerCase() : await callerEmail(req);
    if (!me) return res.status(200).json({ ok: true, note: "" });
    const f = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectFor(q.class || "comm3", "audio-pre-notes")}`, { headers: serviceHeaders() });
    const file = (f.ok ? await f.json().catch(() => null) : null) || {};
    if (!teaches && file.released !== true) return res.status(200).json({ ok: true, note: "" });
    // With the note go the parts of Claude's read a student sees about their
    // own clip: the three lines in their own words, the marks, the timeline,
    // and their own transcript to quote from. Nothing Claude wrote about the
    // clip goes out. Andrew, 2026-11-12: "remove ALL your shitty commentary."
    // `rate` is his note's call on a part, which outranks the read's mark.
    const g = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectFor(q.class || "comm3", "audio-pre")}`, { headers: serviceHeaders() });
    const all = (g.ok ? await g.json().catch(() => null) : null) || {};
    const mine = all.students?.[me] || null;
    const part = (x) => (x ? { kind: x.kind, verdict: x.verdict, quote: x.quote, at: x.at, marks: x.marks } : null);
    const read = mine ? { opener: part(mine.opener), thesis: part(mine.thesis), closer: part(mine.closer), interview: mine.interview ? { has: !!mine.interview.has } : null, structure: mine.structure ? { level: mine.structure.level } : null, news: mine.news ? { level: mine.news.level } : null, rate: mine.you?.rate || null, timeline: mine.timeline || null, transcript: mine.transcript || [], seconds: mine.seconds } : null;
    return res.status(200).json({ ok: true, note: String(file.notes?.[me]?.note || ""), read, links: read ? all.links || {} : {} });
  }
  if (!(await callerAllowed(req, { pin: body.pin || q.pin }))) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ ok: false, error: "This sheet is the instructor's." });
  }
  const object = objectFor(q.class || "comm118", q.sheet);
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${object}`, { headers: serviceHeaders() });
  if (notes) {
    // One file, { notes: { [email]: { note, at } } }. One editor, so read, set, write.
    if (!r.ok && r.status !== 404 && r.status !== 400) return res.status(502).json({ ok: false, error: `The store said ${r.status}.` });
    const file = (r.ok ? await r.json().catch(() => null) : null) || { notes: {} };
    if (req.method === "GET") return res.status(200).json({ ok: true, notes: file.notes || {} });
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: "No student named." });
    file.notes = { ...(file.notes || {}), [email]: { note: String(body.note || "").slice(0, 20000), at: new Date().toISOString() } };
    const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${object}`, { method: "POST", headers: { ...serviceHeaders(), "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(file) });
    if (!w.ok) return res.status(502).json({ ok: false, error: `The store said ${w.status}.` });
    return res.status(200).json({ ok: true, at: file.notes[email].at });
  }
  if (r.status === 404 || r.status === 400) return res.status(404).json({ ok: false, error: "No sheet is written for this class yet." });
  if (!r.ok) return res.status(502).json({ ok: false, error: `The store said ${r.status}.` });
  const sheet = await r.json().catch(() => null);
  if (!sheet) return res.status(502).json({ ok: false, error: "The sheet is not JSON." });
  return res.status(200).json(sheet);
}
