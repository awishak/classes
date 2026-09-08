// Hands the phone a place to put a file.
//
// A clip, a photo or a voice memo goes into the `notes` bucket, and the bucket
// takes writes only from the service role. That key stays on the server, so
// the browser asks here for a signed upload link, then sends the file straight
// to Supabase on that link. The link is good for one file at one path and
// expires on its own, which is as much as the bundle's anon key should ever
// be able to do.
//
// POST /api/upload  { pin, name, type, size, classId }
//   -> { ok, path, uploadUrl, publicUrl }
//
// The route checks the instructor PIN, the file's type and size, and nothing
// else; the file itself never passes through here.

import { pinMatches, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";

export const BUCKET = "notes";
export const MAX_BYTES = 50 * 1024 * 1024;   // the bucket's own cap
const ALLOWED = /^(video|image|audio)\//;

// A path Supabase will take: the class, the month, a stamp, and the file's own
// name with anything odd squeezed out. The stamp keeps two files with the same
// name from ever colliding.
export function pathFor({ classId, name, now = new Date() }) {
  const cls = String(classId || "shared").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "shared";
  const month = now.toISOString().slice(0, 7);
  const stamp = now.getTime().toString(36);
  const clean = String(name || "file").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(-60) || "file";
  return `${cls}/${month}/${stamp}-${clean}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });

  if (!pinMatches(body.pin)) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ ok: false, error: "That PIN does not match." });
  }

  const type = String(body.type || "");
  const size = Number(body.size || 0);
  if (!ALLOWED.test(type)) return res.status(400).json({ ok: false, error: "Only a video, a photo or an audio file can go up." });
  if (!size || size > MAX_BYTES) return res.status(400).json({ ok: false, error: "The file has to be under 50 MB." });

  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });

  const path = pathFor({ classId: body.classId, name: body.name });
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
    method: "POST", headers: serviceHeaders(), body: "{}",
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.url) {
    return res.status(502).json({ ok: false, error: "Supabase would not sign an upload: " + (out.message || out.error || r.status) });
  }

  return res.status(200).json({
    ok: true,
    path,
    uploadUrl: `${SUPABASE_URL}/storage/v1${out.url}`,
    publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`,
  });
}
