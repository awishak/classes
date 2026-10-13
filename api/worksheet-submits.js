// Who has submitted a class's worksheets, for the instructor's screens.
//
// The browser can read worksheet_sheets itself, but only as a host signed in
// by email; the rules show a PIN-only or lapsed session nothing. Weekly
// Challenge 1 in COMM 118 kept showing Andrew's three hand entries instead of
// 25 submitted sheets for that reason. So the instructor's screens ask here,
// where the PIN or an instructor's session is checked the same way as every
// other route, and the service key does the read.
//
// POST /api/worksheet-submits { pin?, groupKey, keys: ["stakeholder-map"] }
//   -> { ok, sheets: { [key]: [{ viewer_id, submitted_at }] } }
// POST /api/worksheet-submits { pin?, groupKey, key, viewer } -> { ok, sheet, answers }

import { callerAllowed, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";

const SLUG = /^[a-z0-9-]{1,64}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!(await callerAllowed(req, body))) return res.status(401).json({ ok: false, error: "Not signed in as the instructor." });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const groupKey = String(body.groupKey || "");

  // Every sheet on one worksheet, opened or handed in, with its answers joined
  // and its review: the visual story's pre-production page for Andrew.
  // { groupKey, key, all: true } -> { ok, sheets: [{ viewer_id, submitted_at, answers, review }], noReviews }
  if (body.all) {
    const key = String(body.key || "");
    if (!SLUG.test(groupKey) || !SLUG.test(key)) return res.status(400).json({ ok: false, error: "A class and a worksheet are needed." });
    const s = await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${key}&group_key=eq.${groupKey}`, { headers: serviceHeaders() });
    if (!s.ok) return res.status(502).json({ ok: false, error: "Could not read the worksheet." });
    const list = await s.json();
    if (!list.length) return res.status(200).json({ ok: true, sheets: [] });
    const ids = list.map(x => x.id).join(",");
    const a = await fetch(SUPABASE_URL + `/rest/v1/worksheet_answers?select=sheet_id,field,value,position,created_at&sheet_id=in.(${ids})&order=position&limit=20000`, { headers: serviceHeaders() });
    if (!a.ok) return res.status(502).json({ ok: false, error: "Could not read the answers." });
    // Rows to words, the way answersOf does in the browser: later row wins a position.
    const slot = {};
    for (const r of await a.json()) slot[r.sheet_id + "\u0000" + r.field + "\u0000" + (r.position || 0)] = r;
    const answers = {};
    Object.values(slot).sort((x, y) => (x.position || 0) - (y.position || 0)).forEach(r => {
      const m = (answers[r.sheet_id] = answers[r.sheet_id] || {});
      m[r.field] = (m[r.field] || "") + r.value;
    });
    const rv = await fetch(SUPABASE_URL + `/rest/v1/worksheet_reviews?select=sheet_id,status,note,reviewed_at&sheet_id=in.(${ids})`, { headers: serviceHeaders() });
    const reviews = rv.ok ? await rv.json() : [];
    const reviewOf = new Map(reviews.map(r => [r.sheet_id, r]));
    return res.status(200).json({
      ok: true, noReviews: !rv.ok,
      sheets: list.map(x => ({ viewer_id: x.viewer_id, submitted_at: x.submitted_at, answers: answers[x.id] || {}, review: reviewOf.get(x.id) || null })),
    });
  }

  // Andrew's review of one student's sheet: approved or needs work, with a note.
  // { groupKey, key, viewer, review: { status, note } } -> { ok, sheet, review }
  if (body.review && body.viewer) {
    const key = String(body.key || ""), viewer = String(body.viewer).trim().toLowerCase();
    const status = String(body.review.status || ""), note = String(body.review.note || "").slice(0, 2000);
    if (!SLUG.test(groupKey) || !SLUG.test(key) || !/^[^\s@&=?#]+@[^\s@&=?#]+$/.test(viewer)) return res.status(400).json({ ok: false, error: "A class, a worksheet and a student are needed." });
    if (!["approved", "needs_work"].includes(status)) return res.status(400).json({ ok: false, error: "A review is approved or needs work." });
    const s = await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id,viewer_id&worksheet_key=eq.${key}&group_key=eq.${groupKey}&viewer_id=eq.${encodeURIComponent(viewer)}`, { headers: serviceHeaders() });
    if (!s.ok) return res.status(502).json({ ok: false, error: "Could not read the worksheet." });
    const [sheet] = await s.json();
    if (!sheet) return res.status(404).json({ ok: false, error: "That student has not opened the worksheet." });
    const w = await fetch(SUPABASE_URL + "/rest/v1/worksheet_reviews?on_conflict=sheet_id", {
      method: "POST",
      headers: { ...serviceHeaders(), "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({ sheet_id: sheet.id, status, note, reviewed_at: new Date().toISOString() }),
    });
    const rows = w.ok ? await w.json() : null;
    // Ask for the row back: an empty answer is a failed write, never a tick.
    if (!rows || !rows[0]) return res.status(502).json({ ok: false, error: "The review did not save." });
    return res.status(200).json({ ok: true, sheet: { viewer_id: sheet.viewer_id }, review: rows[0] });
  }

  // One student's sheet, for opening their file from the grade view.
  // { groupKey, key, viewer: "<email>" } -> { ok, sheet, answers }
  if (body.viewer) {
    const key = String(body.key || ""), viewer = String(body.viewer).trim().toLowerCase();
    if (!SLUG.test(groupKey) || !SLUG.test(key) || !/^[^\s@&=?#]+@[^\s@&=?#]+$/.test(viewer)) return res.status(400).json({ ok: false, error: "A class, a worksheet and a student are needed." });
    const s = await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${key}&group_key=eq.${groupKey}&viewer_id=eq.${encodeURIComponent(viewer)}`, { headers: serviceHeaders() });
    if (!s.ok) return res.status(502).json({ ok: false, error: "Could not read the worksheet." });
    const [sheet] = await s.json();
    if (!sheet) return res.status(200).json({ ok: true, sheet: null, answers: [] });
    const a = await fetch(SUPABASE_URL + `/rest/v1/worksheet_answers?select=id,field,value,position,created_at,verdict&sheet_id=eq.${sheet.id}&order=created_at`, { headers: serviceHeaders() });
    if (!a.ok) return res.status(502).json({ ok: false, error: "Could not read the answers." });
    return res.status(200).json({ ok: true, sheet, answers: await a.json() });
  }

  const keys = (Array.isArray(body.keys) ? body.keys : []).map(String).filter(k => SLUG.test(k)).slice(0, 20);
  if (!SLUG.test(groupKey) || !keys.length) return res.status(400).json({ ok: false, error: "A class and at least one worksheet are needed." });

  const sheets = {};
  for (const key of keys) {
    const q = `/rest/v1/worksheet_sheets?select=viewer_id,submitted_at&worksheet_key=eq.${key}&group_key=eq.${groupKey}&submitted_at=not.is.null`;
    const r = await fetch(SUPABASE_URL + q, { headers: serviceHeaders() });
    if (!r.ok) return res.status(502).json({ ok: false, error: "Could not read the worksheet." });
    sheets[key] = await r.json();
  }
  return res.status(200).json({ ok: true, sheets });
}
