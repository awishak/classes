// Turkey Bowl's scores and its one leaderboard, for the class and for anyone.
//
// Andrew, 2026-11-14: "make it available for anybody else to play ... the
// leaderboard is one singular leaderboard between my class and any of my
// friends who want to play. And the only thing that's identifiable here is
// that if you're in my class, you have a notation of COMM 118 next to you."
// And: "Everyone gets credit but they have to at least get to level three."
//
// The browser sends what the player did (the run's seed, the option picked
// at each decision, each run or pass call) and never a score. The score is
// worked out here from src/turkeybowl/script.js, the same file the page
// draws from, so a made-up number cannot be posted. A player's row keeps
// their best score and the furthest level they have reached.
//
// Who a player is:
//   - Signed in on the class site with an email on COMM 118's roster: the
//     name is the one they go by, first name and last initial, and the row
//     carries the COMM 118 tag. The row's key is their email.
//   - Anyone else: a UUID their browser made, and the name they typed, cut
//     to first name and last initial. No tag.
// Rows live in app_data as turkeybowl-<key>-plan, written only by this route
// with the service key; a "-plan" row is one no student's browser can write.
//
// The game opens Tuesday, November 17, 2026, at 12:00 AM Pacific. Before
// then only the instructor can play or post.
//
// POST { action: "me" }                              -> { ok, open, name, tag, instructor }
// POST { action: "board", visitor? }                 -> { ok, rows: [{ name, tag, score, level, me }] }
// POST { action: "post", visitor?, name?, log }      -> { ok, result, best, rows }
// POST { action: "admin" } (PIN or instructor)       -> { ok, rows } with emails, for the credit

import { pinMatches, callerEmail, readBody } from "./_auth.js";
import { isInstructorEmail } from "../src/instructors.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";
import { scoreRun, shortName, PLAY_COUNT } from "../src/turkeybowl/script.js";
import { shownName } from "../src/engine/roster.js";

export const OPENS = "2026-11-17T08:00:00.000Z";
const CLASS = { id: "comm118", tag: "COMM 118", storage: "comm118-f26-v1" };
const VISITOR = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PREFIX = "turkeybowl-";

const lower = (s) => String(s || "").trim().toLowerCase();
const slug = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const rows = async (path) => {
  const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() });
  return r.ok ? await r.json().catch(() => null) : null;
};
const upsert = async (id, data) => {
  const r = await fetch(SUPABASE_URL + "/rest/v1/app_data?on_conflict=id", {
    method: "POST", headers: { ...serviceHeaders(), Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  return r.ok;
};

/** The student behind an email, or null: { name (as they go by), email }. */
async function studentOf(email) {
  if (!email) return null;
  const [plan, cls] = await Promise.all([
    rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(CLASS.storage + "-plan")}&select=data`),
    rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(CLASS.storage)}&select=data`),
  ]);
  const s = (plan?.[0]?.data?.students || []).find(x => x && lower(x.email) === email);
  if (!s) return null;
  return { email, name: shownName((cls?.[0]?.data?.profiles || {})[s.name], s.name) };
}

const cleanName = (n) => shortName(String(n || "").replace(/[^\p{L}\p{M}' .-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40)).slice(0, 24);

async function allRows() {
  const list = (await rows(`/rest/v1/app_data?id=like.${encodeURIComponent(PREFIX + "*")}&select=data&limit=5000`)) || [];
  return list.map(r => r.data).filter(d => d && d.key && typeof d.best === "number");
}
const board = (list, myKey) => list
  .slice().sort((a, b) => b.best - a.best || String(a.bestAt).localeCompare(String(b.bestAt)))
  .slice(0, 300).map(d => ({ name: d.name, tag: d.tag || "", score: d.best, level: d.level || 1, me: d.key === myKey }));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });
  const action = String(body.action || "");
  const email = pinMatches(body.pin) ? "" : await callerEmail(req);
  const instructor = pinMatches(body.pin) || isInstructorEmail(email);
  const open = Date.now() >= Date.parse(OPENS);

  if (action === "admin") {
    if (!instructor) return res.status(401).json({ ok: false, error: "Only the instructor can see that." });
    const list = await allRows();
    return res.status(200).json({ ok: true, opens: OPENS, rows: list.sort((a, b) => b.best - a.best).map(d => ({ name: d.name, tag: d.tag || "", email: d.email || "", score: d.best, level: d.level || 1, runs: d.runs || 0, at: d.at || "" })) });
  }

  const student = instructor ? null : await studentOf(email);
  const visitor = VISITOR.test(String(body.visitor || "")) ? String(body.visitor) : "";
  const key = student ? "s-" + slug(student.email) : instructor && email ? "i-" + slug(email) : visitor ? "v-" + visitor : "";

  if (action === "me") return res.status(200).json({ ok: true, open: open || instructor, opens: OPENS, name: student ? shortName(student.name) : "", tag: student ? CLASS.tag : "", instructor });
  if (action === "board") return res.status(200).json({ ok: true, rows: board(await allRows(), key) });

  if (action === "post") {
    if (!open && !instructor) return res.status(403).json({ ok: false, closed: true, error: "Turkey Bowl opens Tuesday, November 17." });
    if (!key) return res.status(400).json({ ok: false, error: "No player." });
    const log = body.log && typeof body.log === "object" ? body.log : null;
    const seed = String(log?.seed || "");
    if (!log || !/^[a-z0-9]{6,24}$/.test(seed) || !log.picks || typeof log.picks !== "object" || !Array.isArray(log.calls) || log.calls.length > PLAY_COUNT || Object.keys(log.picks).length > 40) return res.status(400).json({ ok: false, error: "Not a run." });
    const name = student ? shortName(student.name) : instructor ? "Dr. Ishak" : cleanName(body.name);
    if (name.length < 2) return res.status(400).json({ ok: false, error: "Type your first name and last initial." });
    const result = scoreRun({ seed, picks: log.picks, calls: log.calls });
    const id = PREFIX + key + "-plan";
    const was = (await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`))?.[0]?.data || null;
    const now = new Date().toISOString();
    const better = !was || result.score > was.best;
    const data = {
      key, name, tag: student ? CLASS.tag : "", email: student ? student.email : "",
      best: better ? result.score : was.best, bestAt: better ? now : was.bestAt,
      level: Math.max(result.level, was?.level || 1),
      done: !!(was?.done || result.done), hired: !!(was?.hired || result.hired),
      runs: (was?.runs || 0) + (was?.lastSeed === seed ? 0 : 1), lastSeed: seed,
      last: { score: result.score, level: result.level, over: result.over, lost: result.lost, done: result.done }, at: now,
    };
    if (!(await upsert(id, data))) return res.status(502).json({ ok: false, error: "The score did not save." });
    const list = await allRows();
    return res.status(200).json({ ok: true, result, best: data.best, rows: board(list, key) });
  }

  return res.status(400).json({ ok: false, error: "Unknown action." });
}
