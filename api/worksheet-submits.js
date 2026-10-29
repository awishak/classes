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
    const un = await fetch(SUPABASE_URL + `/rest/v1/worksheet_unlocks?select=sheet_id,until&sheet_id=in.(${ids})`, { headers: serviceHeaders() });
    const unlockOf = new Map((un.ok ? await un.json() : []).map(u => [u.sheet_id, u.until]));
    return res.status(200).json({
      ok: true, noReviews: !rv.ok,
      sheets: list.map(x => ({ viewer_id: x.viewer_id, submitted_at: x.submitted_at, answers: answers[x.id] || {}, review: reviewOf.get(x.id) || null, unlockedUntil: unlockOf.get(x.id) || null })),
    });
  }

  // Signed links for files students put in the visual-story bucket, for the
  // instructor's pages, which may be signed in by PIN alone. Only paths in
  // the class's own folder.
  // { groupKey, key, sign: [paths] } -> { ok, urls: { [path]: url } }
  if (Array.isArray(body.sign)) {
    if (!SLUG.test(groupKey)) return res.status(400).json({ ok: false, error: "A class is needed." });
    const paths = body.sign.map(String).filter(p => p.startsWith(groupKey + "/") && !p.includes("..")).slice(0, 500);
    if (!paths.length) return res.status(200).json({ ok: true, urls: {} });
    const r = await fetch(SUPABASE_URL + "/storage/v1/object/sign/visual-story", { method: "POST", headers: { ...serviceHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 3600, paths }) });
    if (!r.ok) return res.status(502).json({ ok: false, error: "The links could not be signed." });
    const urls = {};
    for (const x of await r.json()) if (x && x.signedURL && !x.error) urls[x.path] = SUPABASE_URL + "/storage/v1" + x.signedURL;
    return res.status(200).json({ ok: true, urls });
  }

  // Problem reports students filed from a worksheet, newest first.
  // { groupKey, key, reports: true } -> { ok, reports: [{ viewer_id, message, details, created_at }] }
  if (body.reports) {
    const key = String(body.key || "");
    if (!SLUG.test(groupKey) || !SLUG.test(key)) return res.status(400).json({ ok: false, error: "A class and a worksheet are needed." });
    const r = await fetch(SUPABASE_URL + `/rest/v1/worksheet_reports?select=id,viewer_id,message,details,created_at&worksheet_key=eq.${key}&group_key=eq.${groupKey}&order=created_at.desc&limit=200`, { headers: serviceHeaders() });
    if (!r.ok) return res.status(502).json({ ok: false, error: "Could not read the reports." });
    return res.status(200).json({ ok: true, reports: await r.json() });
  }

  // Late work: open one student's sheet past the deadline until a time, or lock it again.
  // { groupKey, key, viewer, unlock: { until: ISO } | { until: null } } -> { ok, until }
  if (body.unlock && body.viewer) {
    const key = String(body.key || ""), viewer = String(body.viewer).trim().toLowerCase();
    if (!SLUG.test(groupKey) || !SLUG.test(key) || !/^[^\s@&=?#]+@[^\s@&=?#]+$/.test(viewer)) return res.status(400).json({ ok: false, error: "A class, a worksheet and a student are needed." });
    const s = await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id&worksheet_key=eq.${key}&group_key=eq.${groupKey}&viewer_id=eq.${encodeURIComponent(viewer)}`, { headers: serviceHeaders() });
    if (!s.ok) return res.status(502).json({ ok: false, error: "Could not read the worksheet." });
    const [sheet] = await s.json();
    if (!sheet) return res.status(404).json({ ok: false, error: "That student has not opened the worksheet." });
    const until = body.unlock.until ? new Date(body.unlock.until) : null;
    if (!until) {
      const d = await fetch(SUPABASE_URL + `/rest/v1/worksheet_unlocks?sheet_id=eq.${sheet.id}`, { method: "DELETE", headers: serviceHeaders() });
      return d.ok ? res.status(200).json({ ok: true, until: null }) : res.status(502).json({ ok: false, error: "The lock did not go back on." });
    }
    if (Number.isNaN(until.getTime())) return res.status(400).json({ ok: false, error: "That is not a time." });
    const w = await fetch(SUPABASE_URL + "/rest/v1/worksheet_unlocks?on_conflict=sheet_id", {
      method: "POST",
      headers: { ...serviceHeaders(), Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify({ sheet_id: sheet.id, until: until.toISOString() }),
    });
    const rows = w.ok ? await w.json() : null;
    if (!rows || !rows[0]) return res.status(502).json({ ok: false, error: "The unlock did not save." });
    return res.status(200).json({ ok: true, until: rows[0].until });
  }

  // Andrew's review of one student's sheet: approved or needs work, with a note.
  // { groupKey, key, viewer, review: { status, note } } -> { ok, sheet, review }
  if (body.review && body.viewer) {
    const key = String(body.key || ""), viewer = String(body.viewer).trim().toLowerCase();
    const status = String(body.review.status || ""), note = String(body.review.note || "").slice(0, 2000);
    if (!SLUG.test(groupKey) || !SLUG.test(key) || !/^[^\s@&=?#]+@[^\s@&=?#]+$/.test(viewer)) return res.status(400).json({ ok: false, error: "A class, a worksheet and a student are needed." });
    if (!["approved", "needs_work", "clear"].includes(status)) return res.status(400).json({ ok: false, error: "A review is approved or needs work." });
    const s = await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id,viewer_id&worksheet_key=eq.${key}&group_key=eq.${groupKey}&viewer_id=eq.${encodeURIComponent(viewer)}`, { headers: serviceHeaders() });
    if (!s.ok) return res.status(502).json({ ok: false, error: "Could not read the worksheet." });
    const [sheet] = await s.json();
    if (!sheet) return res.status(404).json({ ok: false, error: "That student has not opened the worksheet." });
    // Take a review back, so a sheet reads as not reviewed: the demo sheet
    // before class, or a mark given by mistake.
    if (status === "clear") {
      const d = await fetch(SUPABASE_URL + `/rest/v1/worksheet_reviews?sheet_id=eq.${sheet.id}`, { method: "DELETE", headers: serviceHeaders() });
      if (!d.ok) return res.status(502).json({ ok: false, error: "The review did not clear." });
      return res.status(200).json({ ok: true, sheet: { viewer_id: sheet.viewer_id }, review: null });
    }
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
    // first_submitted_at dates the submit for lateness (lateness.js). The
    // read falls back without the column until
    // sql/worksheet-first-submitted.sql has run on the live table.
    const tail = `&worksheet_key=eq.${key}&group_key=eq.${groupKey}&submitted_at=not.is.null`;
    let r = await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at,first_submitted_at` + tail, { headers: serviceHeaders() });
    if (!r.ok) r = await fetch(SUPABASE_URL + `/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at` + tail, { headers: serviceHeaders() });
    if (!r.ok) return res.status(502).json({ ok: false, error: "Could not read the worksheet." });
    const list = await r.json();
    // 3x5 is group work: a roll on one sheet names up to five students, and
    // every one of them handed it in. The names ride along so the grade view
    // can credit each. Andrew, 2026-10-21: "if students work together make
    // sure both names are on there."
    if (key === "3x5" && list.length) {
      const a = await fetch(SUPABASE_URL + `/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${list.map(x => x.id).join(",")})&field=like.roll:*&order=position&limit=20000`, { headers: serviceHeaders() });
      const slot = {};
      for (const row of a.ok ? await a.json() : []) slot[row.sheet_id + "\u0000" + row.field + "\u0000" + (row.position || 0)] = row;
      const joined = {};
      Object.values(slot).sort((x, y) => (x.position || 0) - (y.position || 0)).forEach(row => {
        const m = (joined[row.sheet_id] = joined[row.sheet_id] || {});
        m[row.field] = (m[row.field] || "") + row.value;
      });
      list.forEach(x => {
        const names = new Set();
        Object.values(joined[x.id] || {}).forEach(v => { try { (JSON.parse(v).names || []).forEach(n => { if (typeof n === "string" && n.trim()) names.add(n.trim()); }); } catch { /* an unreadable roll names nobody */ } });
        x.names = [...names];
      });
    }
    sheets[key] = list.map(({ id, ...x }) => x);
  }
  return res.status(200).json({ ok: true, sheets });
}
