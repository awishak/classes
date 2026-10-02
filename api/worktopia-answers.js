// Every Worktopia file in a class, laid out for reading, plus the visitors.
//
// Andrew, 2026-10-02: "make me a page where i will see everyone's answers to
// worktopia." The worksheet tables let a student read only their own rows,
// and the instructor read every row as a host, so a page the class can open
// too has to come here, where the service key reads and this route decides
// what goes back out. The instructor gets names; a student on the roster
// gets the same answers with nobody's name on them, in an order that is not
// the roster's. Anybody else gets nothing.
//
// POST /api/worktopia-answers { pin?, groupKey, storageKey }
//   -> { ok, named, sheets: [{ viewer?, submitted_at, answers }], visitors: [{ submitted_at, answers }] }
//
// `answers` is a map of field to value, chunks already joined. The viewers
// who ran the public page are the "visitors", under group_key "public",
// the way worktopia-public.js files them.

import { callerAllowed, callerEmail, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";
import { answersOf } from "../src/engine/worktopia/store.js";

const KEY = "worktopia", PUBLIC = "public";
const SLUG = /^[a-z0-9-]{1,64}$/;
const PAGE = 1000;

const rows = async (path) => {
  const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() });
  return r.ok ? await r.json().catch(() => null) : null;
};

// Supabase hands back a thousand rows at most per ask, so the answers come
// in pages until a short one arrives.
async function allAnswers(sheetIds) {
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
  return out;
}

async function files(groupKey) {
  const sheets = await rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${KEY}&group_key=eq.${groupKey}&order=submitted_at.asc.nullslast&limit=${PAGE}`);
  if (!sheets) return null;
  const answers = sheets.length ? await allAnswers(sheets.map(s => s.id)) : [];
  if (!answers) return null;
  const by = {};
  answers.forEach(a => { (by[a.sheet_id] = by[a.sheet_id] || []).push(a); });
  return sheets.map(s => ({ id: s.id, viewer: s.viewer_id, submitted_at: s.submitted_at || null, answers: answersOf(by[s.id] || []) }));
}

// The instructor's view keeps who wrote what. The class's view drops the
// viewer and the name the person typed, keeps only submitted files, and
// orders them by the sheet's own id, which is random, so the first row is
// not the first name on the roster.
const forClass = (list) => list
  .filter(f => f.submitted_at)
  .sort((a, b) => (a.id < b.id ? -1 : 1))
  .map(f => { const { name, ...rest } = f.answers; return { submitted_at: f.submitted_at, answers: rest }; });   // eslint-disable-line no-unused-vars
const forMe = (list) => list.map(f => ({ viewer: f.viewer, submitted_at: f.submitted_at, answers: f.answers }));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const groupKey = String(body.groupKey || ""), storageKey = String(body.storageKey || "");
  if (!SLUG.test(groupKey) || !SLUG.test(storageKey) || !storageKey.startsWith(groupKey + "-")) return res.status(400).json({ ok: false, error: "A class is needed." });

  let named = await callerAllowed(req, body);
  if (!named) {
    // A student: on this class's roster, which lives on the plan row.
    const email = await callerEmail(req);
    if (!email) return res.status(401).json({ ok: false, error: "Not signed in." });
    const plan = await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(storageKey + "-plan")}&select=data`);
    const students = plan?.[0]?.data?.students || [];
    const onRoster = students.some(s => String(s?.email || "").trim().toLowerCase() === email);
    if (!onRoster) return res.status(403).json({ ok: false, error: "Not on the roster for this class." });
  }

  const [mine, visitors] = await Promise.all([files(groupKey), files(PUBLIC)]);
  if (!mine || !visitors) return res.status(502).json({ ok: false, error: "Could not read the files." });
  const shape = named ? forMe : forClass;
  return res.status(200).json({ ok: true, named, sheets: shape(mine), visitors: shape(visitors) });
}
