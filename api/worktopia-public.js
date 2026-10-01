// Worktopia's public files, at classes.andrewishak.com/worktopia.
//
// A visitor is not signed in, and the worksheet tables let a person write
// only their own rows by the email on their token, so a visitor's answers
// come here and the service key writes them. Andrew, 2026-10-01: "save what
// people write! i want to see it." A visitor is a UUID the browser makes and
// keeps; the sheet is worksheet_key "worktopia", group_key "public",
// viewer_id "visitor-<uuid>". Nothing here can read or touch a class's rows:
// every query carries the public group.
//
// POST { visitor, action: "load" }                 -> { ok, answers, submitted_at }
// POST { visitor, action: "save", field, value }   -> { ok }
// POST { visitor, action: "submit" }               -> { ok, submitted_at }
// POST { visitor, action: "reset" }                -> { ok }
// The instructor, by PIN or session:
// POST { action: "list" }                          -> { ok, sheets: [{ viewer_id, submitted_at, name }] }
// POST { action: "read", viewer }                  -> { ok, sheet, answers }

import { callerAllowed, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";

const KEY = "worktopia", GROUP = "public";
const VISITOR = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FIELD = /^[a-z]{1,24}(:[a-z]{1,4})?$/;
const CHUNK = 500, MAX_VALUE = 4000, MAX_ROWS = 400;

const base = `/rest/v1/worksheet_sheets?worksheet_key=eq.${KEY}&group_key=eq.${GROUP}`;
const rows = async (path, init = {}) => {
  const r = await fetch(SUPABASE_URL + path, { ...init, headers: { ...serviceHeaders(), ...(init.headers || {}) } });
  return { ok: r.ok, status: r.status, data: r.ok ? await r.json().catch(() => null) : null, total: r.headers.get("content-range") };
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const action = String(body.action || "");

  // The instructor's side.
  if (action === "list" || action === "read") {
    if (!(await callerAllowed(req, body))) return res.status(401).json({ ok: false, error: "Not signed in as the instructor." });
    if (action === "list") {
      const s = await rows(base + "&select=id,viewer_id,submitted_at&order=submitted_at.desc.nullslast&limit=1000");
      if (!s.ok) return res.status(502).json({ ok: false, error: "Could not read the files." });
      const ids = s.data.map(x => x.id);
      const names = ids.length ? await rows(`/rest/v1/worksheet_answers?select=sheet_id,value&field=eq.name&position=eq.0&sheet_id=in.(${ids.join(",")})`) : { ok: true, data: [] };
      if (!names.ok) return res.status(502).json({ ok: false, error: "Could not read the names." });
      const nameOf = Object.fromEntries(names.data.map(n => [n.sheet_id, n.value]));
      return res.status(200).json({ ok: true, sheets: s.data.map(x => ({ viewer_id: x.viewer_id, submitted_at: x.submitted_at, name: nameOf[x.id] || "" })) });
    }
    const viewer = String(body.viewer || "").toLowerCase();
    if (!/^visitor-[0-9a-f-]{36}$/.test(viewer)) return res.status(400).json({ ok: false, error: "A visitor is needed." });
    const s = await rows(base + `&select=id,viewer_id,submitted_at&viewer_id=eq.${viewer}`);
    if (!s.ok) return res.status(502).json({ ok: false, error: "Could not read the file." });
    const [sheet] = s.data;
    if (!sheet) return res.status(200).json({ ok: true, sheet: null, answers: [] });
    const a = await rows(`/rest/v1/worksheet_answers?select=id,field,value,position,created_at&sheet_id=eq.${sheet.id}&order=created_at`);
    if (!a.ok) return res.status(502).json({ ok: false, error: "Could not read the answers." });
    return res.status(200).json({ ok: true, sheet, answers: a.data });
  }

  // A visitor's own file.
  const visitor = String(body.visitor || "").toLowerCase();
  if (!VISITOR.test(visitor)) return res.status(400).json({ ok: false, error: "A visitor id is needed." });
  const viewerId = "visitor-" + visitor;
  const find = () => rows(base + `&select=id,submitted_at&viewer_id=eq.${viewerId}`);

  if (action === "load") {
    const s = await find();
    if (!s.ok) return res.status(502).json({ ok: false, error: "Could not read the file." });
    const [sheet] = s.data;
    if (!sheet) return res.status(200).json({ ok: true, answers: [], submitted_at: null });
    const a = await rows(`/rest/v1/worksheet_answers?select=field,value,position&sheet_id=eq.${sheet.id}&order=position&limit=2000`);
    if (!a.ok) return res.status(502).json({ ok: false, error: "Could not read the answers." });
    return res.status(200).json({ ok: true, answers: a.data, submitted_at: sheet.submitted_at || null });
  }

  // The sheet, started on the first write. Two tabs can race; the table's
  // unique key lets one in and the other reads the winner's row.
  const sheet = async () => {
    const s = await find();
    if (s.ok && s.data[0]) return s.data[0];
    const made = await rows("/rest/v1/worksheet_sheets?select=id,submitted_at", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ worksheet_key: KEY, group_key: GROUP, viewer_id: viewerId }) });
    if (made.ok && made.data && made.data[0]) return made.data[0];
    const again = await find();
    return (again.ok && again.data[0]) || null;
  };

  if (action === "save") {
    const field = String(body.field || ""), value = String(body.value ?? "");
    if (!FIELD.test(field)) return res.status(400).json({ ok: false, error: "That is not a field." });
    if (value.length > MAX_VALUE) return res.status(400).json({ ok: false, error: "That answer is too long." });
    const sh = await sheet();
    if (!sh) return res.status(502).json({ ok: false, error: "Could not start the file." });
    const count = await rows(`/rest/v1/worksheet_answers?select=id&sheet_id=eq.${sh.id}&limit=1`, { headers: { Prefer: "count=exact" } });
    const have = parseInt(String(count.total || "").split("/")[1] || "0", 10) || 0;
    if (have > MAX_ROWS) return res.status(429).json({ ok: false, error: "This file is full." });
    const gone = await rows(`/rest/v1/worksheet_answers?sheet_id=eq.${sh.id}&field=eq.${field}`, { method: "DELETE" });
    if (!gone.ok) return res.status(502).json({ ok: false, error: "Could not replace the answer." });
    const parts = [];
    for (let i = 0; i < value.length; i += CHUNK) parts.push({ sheet_id: sh.id, field, value: value.slice(i, i + CHUNK), position: parts.length });
    if (!parts.length) parts.push({ sheet_id: sh.id, field, value: "", position: 0 });
    const r = await rows("/rest/v1/worksheet_answers?select=id", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(parts) });
    if (!r.ok || !r.data || r.data.length !== parts.length) return res.status(502).json({ ok: false, error: "Could not save the answer." });
    return res.status(200).json({ ok: true });
  }

  if (action === "submit" || action === "reset") {
    const sh = await sheet();
    if (!sh) return res.status(502).json({ ok: false, error: "Could not start the file." });
    if (action === "reset") {
      const gone = await rows(`/rest/v1/worksheet_answers?sheet_id=eq.${sh.id}`, { method: "DELETE" });
      if (!gone.ok) return res.status(502).json({ ok: false, error: "Could not clear the file." });
    }
    const when = action === "submit" ? new Date().toISOString() : null;
    const r = await rows(`/rest/v1/worksheet_sheets?id=eq.${sh.id}&select=submitted_at`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ submitted_at: when }) });
    if (!r.ok || !r.data || !r.data[0]) return res.status(502).json({ ok: false, error: "Could not update the file." });
    return res.status(200).json({ ok: true, submitted_at: r.data[0].submitted_at || null });
  }

  return res.status(400).json({ ok: false, error: "Unknown action." });
}
