// Send a note from Andrew to one student, with a picture if there is one.
//
// Andrew, 2026-10-19: a message to each student to show he cares and wants
// the best for them, and a picture he picked for each. The note lands in the
// student's thread on the class site, the one behind the envelope, as a
// message from the instructor; the picture goes up to the class's media
// bucket first and rides along as `image`. YouCard.jsx draws it.
//
//   node scripts/send-note.mjs --class comm3-f26-v1 --to "Bobby Chen" --text "..." [--image path/to.jpg]
//   node scripts/send-note.mjs --class comm3-f26-v1 --batch notes.json
//
// A batch file is a list of { to, text, image }. Say --write to send;
// without it every note is printed and nothing goes out. Needs
// SUPABASE_SERVICE_ROLE_KEY in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const BUCKET = "notes";
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".heic": "image/heic" };

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : ""; };
const write = args.includes("--write");
const storageKey = flag("class");
if (!storageKey) { console.error("Say --class <storageKey>, like comm3-f26-v1."); process.exit(1); }

const read = async (id) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  return ((await r.json())[0] || {}).data ?? null;
};
const put = async (id, data) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`write ${id}: ${r.status} ${(await r.text()).slice(0, 200)}`);
};
// The same path shape api/upload.js uses: class, month, a stamp, the file's own name.
const pathFor = (classId, name, now = new Date()) => {
  const cls = String(classId || "shared").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") || "shared";
  const clean = String(name || "file").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "").slice(-60) || "file";
  return `${cls}/${now.toISOString().slice(0, 7)}/${now.getTime().toString(36)}-${clean}`;
};
const upload = async (file) => {
  const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
  const path = pathFor(storageKey.replace(/-f26-v1$/, ""), basename(file));
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { ...H, "Content-Type": type, "x-upsert": "false" }, body: readFileSync(file) });
  if (!r.ok) throw new Error(`upload ${file}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
};
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const notes = flag("batch") ? JSON.parse(readFileSync(flag("batch"), "utf8")) : [{ to: flag("to"), text: flag("text"), image: flag("image") }];
const data = await read(storageKey);
if (!data) { console.error("No class row at " + storageKey); process.exit(1); }
const roster = (data.students || []).map(s => s.name);
const planRoster = roster.length ? roster : ((await read(storageKey + "-plan"))?.students || []).map(s => s.name);
const names = new Set(planRoster);

const out = [];
for (const n of notes) {
  if (!n.to || !names.has(n.to)) { console.error("Not on the roster: " + JSON.stringify(n.to)); process.exit(1); }
  if (!String(n.text || "").trim() && !n.image) { console.error("Nothing to send to " + n.to); process.exit(1); }
  out.push(n);
  console.log(`${write ? "sending" : "would send"} to ${n.to}: ${String(n.text || "").replace(/\s+/g, " ").slice(0, 80)}${n.image ? " + " + basename(n.image) : ""}`);
}
if (!write) { console.log(`\n${out.length} note(s). Say --write to send.`); process.exit(0); }

// Read, append, write, once per note, so a reply landing between two sends is kept.
for (const n of out) {
  const image = n.image ? await upload(n.image) : "";
  const cur = await read(storageKey) || {};
  const threads = { ...(cur.threads || {}) };
  const msg = { id: genId(), ts: Date.now(), from: "instructor", kind: "note", text: String(n.text || "").trim() };
  if (image) msg.image = image;
  threads[n.to] = [...(threads[n.to] || []), msg];
  await put(storageKey, { ...cur, threads });
  console.log("sent to " + n.to + (image ? " with " + image : ""));
}
