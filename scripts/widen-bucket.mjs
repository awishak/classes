// The notes bucket's allowed file types: read them, and with --write let the
// document types the upload route already accepts (PDF, decks, docs, sheets)
// through. Andrew, 2026-10-23, attaching the Ishak chapters: "doesn't support
// pdfs." Needs SUPABASE_SERVICE_ROLE_KEY in .env.local.
//
//   node scripts/widen-bucket.mjs           prints the list
//   node scripts/widen-bucket.mjs --write   adds the document types
import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const BASE = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#")).map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "Content-Type": "application/json" };
const b = await (await fetch(BASE + "/storage/v1/bucket/notes", { headers: H })).json();
console.log("now:", JSON.stringify({ public: b.public, file_size_limit: b.file_size_limit, allowed_mime_types: b.allowed_mime_types }));
if (process.argv.includes("--write")) {
  const DOCS = ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/x-iwork-keynote-sffkey",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/x-iwork-pages-sffpages",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/x-iwork-numbers-sffnumbers",
    "text/csv", "text/plain", "text/markdown", "application/rtf", "application/zip", "application/octet-stream"];
  const was = Array.isArray(b.allowed_mime_types) ? b.allowed_mime_types : null;
  const next = was === null ? null : [...new Set([...was, ...DOCS])];
  if (next === null) { console.log("the bucket already takes every type; nothing to change"); process.exit(0); }
  const r = await fetch(BASE + "/storage/v1/bucket/notes", { method: "PUT", headers: H, body: JSON.stringify({ public: b.public, file_size_limit: b.file_size_limit, allowed_mime_types: next }) });
  console.log(r.ok ? "wrote: " + JSON.stringify(next) : "failed " + r.status + " " + await r.text());
}
