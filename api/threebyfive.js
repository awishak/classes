// 3x5's shared rolls: a classmate named on a roll reads and writes it here.
//
// A roll lives on the sheet of the student who started it, and the database
// rules keep every student to their own rows. So the others on the roll come
// through this route, which holds the service key and checks two things off
// the session: the caller is on the class's roster, and their roster name is
// on the roll as it is stored. Andrew, 2026-10-21: "if two students are
// working, it should update on both simultaneously," and yes to anyone on a
// roll removing it, changing its names, or handing it in.
//
// POST /api/threebyfive { groupKey, action, owner?, field?, value? }, with the
// student's session in the bearer header.
//   load            -> { ok, shared: [{ owner, ownerName, submitted_at, field, value }] }
//   save            -> { ok }        the roll at field on owner's sheet, whole
//   remove          -> { ok }
//   submit | recall -> { ok, submitted_at }   owner's sheet, which is where the roll is
//
// A member may change a roll that already names them, including taking their
// own name off. Nobody but the owner starts a roll on the owner's sheet.

import { callerEmail, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceHeaders } from "./_supabase.js";

const KEY = "3x5";
const STORAGE = { comm3: "comm3-f26-v1", comm999: "comm999-v1" };
const PRACTICE = new Set(["comm999"]);
const FIELD = /^roll:[a-z]{1,4}$/;
const CHUNK = 500;
const MAX_VALUE = 40000;

const lower = (s) => String(s || "").trim().toLowerCase();
const clean = (s) => String(s || "").trim();

const rows = async (path) => {
  const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() });
  return r.ok ? await r.json().catch(() => null) : null;
};
const write = async (path, method, body) => {
  const r = await fetch(SUPABASE_URL + path, { method, headers: { ...serviceHeaders(), Prefer: "return=representation" }, body: body === undefined ? undefined : JSON.stringify(body) });
  return r.ok ? await r.json().catch(() => []) : null;
};

async function rosterOf(groupKey) {
  const plan = await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(STORAGE[groupKey] + "-plan")}&select=data`);
  const slug = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (plan?.[0]?.data?.students || [])
    .map(s => (s && !s.email && PRACTICE.has(groupKey) && s.name ? { ...s, email: slug(s.name) + "@practice.test" } : s))
    .filter(s => s && s.email).map(s => ({ name: clean(s.name), email: lower(s.email) }));
}

const sheetsOf = (groupKey) => rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}`);

// Every roll on the given sheets, chunks joined: { [sheet_id]: { [field]: value } }.
async function rollsOn(sheetIds) {
  const out = {};
  for (let i = 0; i < sheetIds.length; i += 100) {
    const ids = sheetIds.slice(i, i + 100).join(",");
    const list = await rows(`/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids})&field=like.roll:*&order=position&limit=20000`);
    if (!list) return null;
    const slot = {};
    for (const r of list) slot[r.sheet_id + "\u0000" + r.field + "\u0000" + (r.position || 0)] = r;
    Object.values(slot).sort((x, y) => (x.position || 0) - (y.position || 0)).forEach(r => {
      const m = (out[r.sheet_id] = out[r.sheet_id] || {});
      m[r.field] = (m[r.field] || "") + r.value;
    });
  }
  return out;
}

const namesIn = (value) => { try { const r = JSON.parse(value); return Array.isArray(r?.names) ? r.names.map(lower) : []; } catch { return []; } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ ok: false, error: "No body" });
  const groupKey = String(body.groupKey || "");
  if (!STORAGE[groupKey]) return res.status(400).json({ ok: false, error: "No such class." });
  const email = await callerEmail(req);
  if (!email) return res.status(401).json({ ok: false, error: "Sign in to work on a roll." });
  const roster = await rosterOf(groupKey);
  const me = roster.find(s => s.email === email);
  if (!me) return res.status(401).json({ ok: false, error: "You are not on this class's roster." });
  const myName = lower(me.name);
  const nameOf = new Map(roster.map(s => [s.email, s.name]));
  const action = String(body.action || "");

  const sheets = await sheetsOf(groupKey);
  if (!sheets) return res.status(502).json({ ok: false, error: "Could not read the sheets." });

  if (action === "load") {
    const others = sheets.filter(s => s.viewer_id !== email);
    const rolls = others.length ? await rollsOn(others.map(s => s.id)) : {};
    if (!rolls) return res.status(502).json({ ok: false, error: "Could not read the rolls." });
    const shared = [];
    others.forEach(s => Object.entries(rolls[s.id] || {}).forEach(([field, value]) => {
      if (namesIn(value).includes(myName)) shared.push({ owner: s.viewer_id, ownerName: nameOf.get(s.viewer_id) || s.viewer_id, submitted_at: s.submitted_at || null, field, value });
    }));
    shared.sort((a, b) => a.ownerName.localeCompare(b.ownerName) || a.field.localeCompare(b.field));
    return res.status(200).json({ ok: true, shared });
  }

  const owner = lower(body.owner);
  const sheet = sheets.find(s => s.viewer_id === owner);
  if (!sheet) return res.status(404).json({ ok: false, error: "That student has no 3x5 sheet." });
  const stored = (await rollsOn([sheet.id]))?.[sheet.id] || {};
  const onRoll = (field) => namesIn(stored[field] || "").includes(myName);

  if (action === "save" || action === "remove") {
    const field = String(body.field || "");
    if (!FIELD.test(field)) return res.status(400).json({ ok: false, error: "That is not a roll." });
    if (!stored[field]) return res.status(403).json({ ok: false, error: "Only the student whose sheet it is can start a roll there." });
    if (!onRoll(field)) return res.status(403).json({ ok: false, error: "You are not on this roll." });
    const gone = await write(`/rest/v1/worksheet_answers?sheet_id=eq.${sheet.id}&field=eq.${encodeURIComponent(field)}`, "DELETE");
    if (!gone) return res.status(502).json({ ok: false, error: "Could not replace the roll." });
    if (action === "remove") return res.status(200).json({ ok: true });
    const value = String(body.value || "");
    if (!value || value.length > MAX_VALUE) return res.status(400).json({ ok: false, error: "The roll is empty or too long." });
    try { if (!JSON.parse(value) || typeof JSON.parse(value) !== "object") throw new Error(); } catch { return res.status(400).json({ ok: false, error: "The roll is not readable." }); }
    const parts = [];
    for (let i = 0; i < value.length; i += CHUNK) parts.push({ sheet_id: sheet.id, field, value: value.slice(i, i + CHUNK), position: parts.length });
    const made = await write("/rest/v1/worksheet_answers", "POST", parts);
    if (!made || made.length !== parts.length) return res.status(502).json({ ok: false, error: "The roll did not save." });
    return res.status(200).json({ ok: true });
  }

  if (action === "submit" || action === "recall") {
    if (!Object.keys(stored).some(onRoll)) return res.status(403).json({ ok: false, error: "You are not on a roll on this sheet." });
    const when = action === "submit" ? new Date().toISOString() : null;
    const r = await write(`/rest/v1/worksheet_sheets?id=eq.${sheet.id}`, "PATCH", { submitted_at: when });
    if (!r || !r[0]) return res.status(502).json({ ok: false, error: action === "submit" ? "Could not hand in." : "Could not take back." });
    return res.status(200).json({ ok: true, submitted_at: r[0].submitted_at || null });
  }

  return res.status(400).json({ ok: false, error: "No such action." });
}
