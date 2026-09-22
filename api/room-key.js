// A key pressed on the room screen, on a machine that is not the dashboard's.
//
// The room screen never writes to the cast bus with the key that ships in the
// bundle, because then any student with /today open could drive the class.
// So a key pressed there comes here with the instructor PIN, and after the
// PIN checks out the request is written onto the class's live row with the
// service key. The dashboard, open anywhere, sees the request arrive on the
// realtime feed and makes the move: Next, back, or Black.
//
// POST /api/room-key  { pin, room, what, id }
//   room  the class's storageKey
//   what  next | prev | black
//   id    the press, so a dashboard that also heard it over the same-browser
//         channel makes the move once
//   -> { ok }

import { callerAllowed, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";

const WHAT = new Set(["next", "prev", "black"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });

  const room = String(body.room || "");
  const what = String(body.what || "");
  const id = String(body.id || "");
  if (!/^[a-z0-9-]+$/i.test(room) || !WHAT.has(what) || !id) return res.status(400).json({ ok: false, error: "Not a key the screen knows." });

  if (!(await callerAllowed(req, body))) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ ok: false, error: "That PIN does not match, and nobody is signed in." });
  }
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });

  // The row as it is, so the cast on the wall stays; only the request changes.
  const key = room + "-live";
  const got = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(key)}&select=data`, { headers: serviceHeaders() });
  const rows = got.ok ? await got.json().catch(() => []) : [];
  const data = { ...((rows[0] && rows[0].data) || {}), ask: { what, id, at: Date.now() } };

  const put = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST",
    headers: { ...serviceHeaders(), Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: key, data, updated_at: new Date().toISOString() }),
  });
  if (!put.ok) return res.status(502).json({ ok: false, error: "Supabase would not take the key: " + put.status });
  return res.status(200).json({ ok: true });
}
