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
