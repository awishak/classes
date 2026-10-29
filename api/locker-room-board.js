// The Locker Room leaderboard: every season in a class, one row a coach.
//
// Andrew, 2026-10-29: "would like a leaderboard ... sortable by Overall (all
// three added together), skills, culture, or success, or record." A student
// can read only their own worksheet rows, so the class's board comes from
// here, where the service key reads every file and this route sends back
// numbers and names, nothing a student wrote. Anyone on the class roster
// gets the board, and so does the instructor; anybody else gets nothing.
//
// POST /api/locker-room-board { pin?, groupKey, storageKey, instructorName? }
//   -> { ok, rows: [{ name, team, sport, weeks, culture, skills, success, overall, wins, losses, submitted }] }

import { callerAllowed, callerEmail, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";
import { answersOf } from "../src/engine/worktopia/store.js";
import { TAKEOVER_KEY, F, replay } from "../src/engine/takeover/engine.js";

const SLUG = /^[a-z0-9-]{1,64}$/;
const PAGE = 1000;

const rows = async (path) => {
  const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() });
  return r.ok ? await r.json().catch(() => null) : null;
};

// Only the rows the board needs: the sport, the team, and the packed weeks.
async function fileRows(sheetIds) {
  const out = [];
  for (let i = 0; i < sheetIds.length; i += 100) {
    const ids = sheetIds.slice(i, i + 100).join(",");
    for (let offset = 0; ; offset += PAGE) {
      const page = await rows(`/rest/v1/worksheet_answers?select=sheet_id,field,value,position&sheet_id=in.(${ids})&or=(field.eq.${F.sport},field.eq.${F.team},field.like.result:*)&order=id&offset=${offset}&limit=${PAGE}`);
      if (!page) return null;
      out.push(...page);
      if (page.length < PAGE) break;
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const groupKey = String(body.groupKey || ""), storageKey = String(body.storageKey || "");
  if (!SLUG.test(groupKey) || !SLUG.test(storageKey) || !storageKey.startsWith(groupKey + "-")) return res.status(400).json({ ok: false, error: "A class is needed." });

  const plan = await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(storageKey + "-plan")}&select=data`);
  const students = (plan?.[0]?.data?.students || []).filter(s => s && s.email);
  const nameOf = new Map(students.map(s => [String(s.email).trim().toLowerCase(), String(s.name || "").trim()]));

  const named = await callerAllowed(req, body);
  const caller = await callerEmail(req);
  if (!named) {
    if (!caller) return res.status(401).json({ ok: false, error: "Not signed in." });
    if (!nameOf.has(caller)) return res.status(403).json({ ok: false, error: "Not on the roster for this class." });
  }

  const sheets = await rows(`/rest/v1/worksheet_sheets?select=id,viewer_id,submitted_at&worksheet_key=eq.${TAKEOVER_KEY}&group_key=eq.${groupKey}&limit=${PAGE}`);
  if (!sheets) return res.status(502).json({ ok: false, error: "Could not read the files." });
  const answers = sheets.length ? await fileRows(sheets.map(s => s.id)) : [];
  if (!answers) return res.status(502).json({ ok: false, error: "Could not read the files." });
  const by = {};
  answers.forEach(a => { (by[a.sheet_id] = by[a.sheet_id] || []).push(a); });

  const out = [];
  for (const s of sheets) {
    const email = String(s.viewer_id || "").trim().toLowerCase();
    // A sheet under an email that is not a student's is the instructor's own
    // season, which the page gives them under their login. Named as such;
    // the season was dealt from the name on the page, which replay needs.
    const name = nameOf.get(email) || String(body.instructorName || "Instructor").trim();
    const a = answersOf(by[s.id] || []);
    const { results, state } = replay(a, name);
    if (!results.length) continue;
    out.push({
      name: nameOf.get(email) || "Instructor", me: !!caller && caller === email, team: String(a[F.team] || "").trim(), sport: String(a[F.sport] || "").trim(), weeks: results.length,
      culture: state.culture, skills: state.skills, success: state.success, overall: state.culture + state.skills + state.success,
      wins: state.wins, losses: state.losses, submitted: !!s.submitted_at,
    });
  }
  return res.status(200).json({ ok: true, rows: out });
}
