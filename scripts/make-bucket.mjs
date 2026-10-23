// Makes the `notes` bucket, once. Files that come up from the phone live
// here: clips, photos, voice memos, and later the captions beside a clip.
//
// The bucket is public to read, because the room screen and the dashboard
// load files by plain URL, and private to write: the anon key that ships in
// the bundle gets no policy here, so the only way in is the signed upload
// link the API hands out. Needs SUPABASE_SERVICE_ROLE_KEY in .env.local,
// which `vercel env pull .env.local` writes and git ignores.
//
//   node scripts/make-bucket.mjs

import { readFileSync } from "node:fs";
// storage-shim.js opens a socket on import, so read the address off the file.
const SUPABASE_URL = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8")
  .match(/SUPABASE_URL = "([^"]+)"/)[1];

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }

const headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const MB = 1024 * 1024;

const have = await (await fetch(SUPABASE_URL + "/storage/v1/bucket", { headers })).json();
if (Array.isArray(have) && have.some(b => b.id === "notes")) {
  console.log("make-bucket: notes already exists");
} else {
  const r = await fetch(SUPABASE_URL + "/storage/v1/bucket", {
    method: "POST", headers,
    body: JSON.stringify({ id: "notes", name: "notes", public: true, file_size_limit: 50 * MB,
      // Documents too. Andrew, 2026-10-23, attaching the Ishak chapters to
      // their readings: "doesn't support pdfs." The site's upload route had
      // taken a PDF since the handouts, but the bucket, made before that,
      // still turned one away. The live bucket was widened by hand that day.
      allowed_mime_types: ["video/*", "image/*", "audio/*", "text/vtt",
        "application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/x-iwork-keynote-sffkey",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/x-iwork-pages-sffpages",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/x-iwork-numbers-sffnumbers",
        "text/csv", "text/plain", "text/markdown", "application/rtf", "application/zip", "application/octet-stream"] }),
  });
  console.log("make-bucket:", r.status, await r.text());
}

const after = await (await fetch(SUPABASE_URL + "/storage/v1/bucket", { headers })).json();
console.log("buckets:", after.map(b => `${b.id} (${b.public ? "public read" : "private"}, ${b.file_size_limit / MB} MB cap)`).join(", "));
