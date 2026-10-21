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

import { callerAllowed } from "./_auth.js";
import { SUPABASE_URL, serviceHeaders } from "./_supabase.js";

const BUCKET = "instructor";
const objectFor = (id) => `${String(id || "").toLowerCase().replace(/[^a-z0-9-]+/g, "")}-sitdown-1.json`;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store");
  const q = req.query || {};
  if (!(await callerAllowed(req, { pin: q.pin }))) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ ok: false, error: "This sheet is the instructor's." });
  }
  const object = objectFor(q.class || "comm118");
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${object}`, { headers: serviceHeaders() });
  if (r.status === 404 || r.status === 400) return res.status(404).json({ ok: false, error: "No sheet is written for this class yet." });
  if (!r.ok) return res.status(502).json({ ok: false, error: `The store said ${r.status}.` });
  const sheet = await r.json().catch(() => null);
  if (!sheet) return res.status(502).json({ ok: false, error: "The sheet is not JSON." });
  return res.status(200).json(sheet);
}
