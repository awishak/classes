// The final project decisions: who works with whom, and which topics are
// approved. One private file a class.
//
// Andrew, 2026-11-13: "Students should not see my decisions the moment I
// press. I think we're gonna release them all together." So the decisions do
// not sit in a row a student's browser can read. The file is in the private
// `instructor` bucket, the way the sit-down sheets are (sitdown-sheet.js),
// and leaves only through here: whole to the instructor, and to a student
// only their own part, only once the file says released.
//
// GET  /api/final-project?class=comm3            instructor: { ok, file }
// POST /api/final-project?class=comm3 { file }   instructor: writes the file
// GET  /api/final-project?class=comm3&mine=1     student: { ok, released, mine }
//   mine is { place: "pair" | "solo", partner, topics: [{ slot, topic, says }],
//   partnerTopics: [{ slot, topic }] }, or null before the release.

import { callerAllowed, callerEmail, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";

const BUCKET = "instructor";
const KEY = "final-prefs";
const SLOTS = ["a", "b", "c"];
const clsOf = (id) => String(id || "").toLowerCase().replace(/[^a-z0-9-]+/g, "");
const objectFor = (cls) => `${cls}-final-prefs.json`;

async function readFile(cls) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectFor(cls)}`, { headers: serviceHeaders() });
  if (!r.ok && r.status !== 404 && r.status !== 400) return { error: r.status };
  return { file: (r.ok ? await r.json().catch(() => null) : null) || {} };
}

// One student's topic lines off their sheet, { a: "..." }, read with the service key.
async function topicsOf(cls, email) {
  const s = await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id&worksheet_key=eq.${KEY}&group_key=eq.${cls}&viewer_id=eq.${encodeURIComponent(email)}`, { headers: serviceHeaders() });
  const [sheet] = s.ok ? await s.json() : [];
  if (!sheet) return {};
  const a = await fetch(SUPABASE_URL + `/rest/v1/worksheet_answers?select=field,value,position,created_at&sheet_id=eq.${sheet.id}&field=like.topic:*&order=position,created_at`, { headers: serviceHeaders() });
  const rows = a.ok ? await a.json() : [];
  const slot = {};
  for (const r of rows) slot[r.field + "\u0000" + (r.position || 0)] = r;
  const out = {};
  Object.values(slot).sort((x, y) => (x.position || 0) - (y.position || 0)).forEach(r => { const k = r.field.split(":")[1]; out[k] = (out[k] || "") + r.value; });
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");
  const q = req.query || {};
  const cls = clsOf(q.class);
  if (!cls) return res.status(400).json({ ok: false, error: "A class is needed." });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });

  // A student's own part, after the release.
  if (q.mine) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const me = String((await callerEmail(req)) || "").trim().toLowerCase();
    if (!me) return res.status(200).json({ ok: true, released: false, mine: null });
    const got = await readFile(cls);
    const file = got.file || {};
    if (file.released !== true) return res.status(200).json({ ok: true, released: false, mine: null });
    const pair = (Array.isArray(file.pairs) ? file.pairs : []).find(p => Array.isArray(p) && p.includes(me));
    const partner = pair ? pair.find(x => x !== me) : "";
    const approved = (id) => SLOTS.filter(s => file.topics?.[id]?.[s]);
    const mineText = await topicsOf(cls, me);
    const theirText = partner ? await topicsOf(cls, partner) : {};
    return res.status(200).json({ ok: true, released: true, mine: {
      place: partner ? "pair" : "solo",
      partner,
      topics: approved(me).map(s => ({ slot: s, topic: String(mineText[s] || "").trim() })),
      says: file.says?.[me] || {},
      partnerTopics: partner ? approved(partner).map(s => ({ slot: s, topic: String(theirText[s] || "").trim() })) : [],
    } });
  }

  const body = req.method === "POST" ? readBody(req) || {} : {};
  if (!(await callerAllowed(req, { pin: body.pin || q.pin }))) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ ok: false, error: "The decisions are the instructor's." });
  }
  if (req.method === "GET") {
    const got = await readFile(cls);
    if (got.error) return res.status(502).json({ ok: false, error: `The store said ${got.error}.` });
    return res.status(200).json({ ok: true, file: got.file });
  }
  // One editor, so the page sends the whole file and the whole file is kept.
  const f = body.file;
  if (!f || typeof f !== "object" || Array.isArray(f)) return res.status(400).json({ ok: false, error: "No file to save." });
  const text = JSON.stringify({ ...f, at: new Date().toISOString() });
  if (text.length > 400000) return res.status(400).json({ ok: false, error: "The file is too large." });
  const w = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectFor(cls)}`, { method: "POST", headers: { ...serviceHeaders(), "Content-Type": "application/json", "x-upsert": "true" }, body: text });
  if (!w.ok) return res.status(502).json({ ok: false, error: `The store said ${w.status}.` });
  return res.status(200).json({ ok: true });
}
