// Put the instructor's Sit-Down 1 sheet where only he can read it.
//
// The sheet names students and says who worked hard and who is thin, and this
// repo is public on GitHub, so the file never goes in the repo. It lives in
// the private `instructor` bucket on Supabase, and /api/sitdown-sheet hands it
// to a signed-in instructor and nobody else. The working copy on this laptop
// is private/comm118-sitdown-1.json, which .gitignore keeps out.
//
//   node scripts/sitdown-sheet.mjs                       prints what is up there
//   node scripts/sitdown-sheet.mjs --file private/comm118-sitdown-1.json --write
//
// --class picks the class (default comm118). Needs SUPABASE_SERVICE_ROLE_KEY
// in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : ""; };
const write = args.includes("--write");
const classId = flag("class") || "comm118";
export const BUCKET = "instructor";
export const objectFor = (id) => `${String(id || "").toLowerCase().replace(/[^a-z0-9-]+/g, "")}-sitdown-1.json`;
const object = objectFor(classId);

// The bucket, private, made the first time.
const buckets = await (await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers: H })).json();
if (!buckets.some(b => b.id === BUCKET)) {
  if (!write) { console.log(`No ${BUCKET} bucket yet. Say --write to make it.`); }
  else {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }) });
    if (!r.ok) { console.error(`make bucket: ${r.status} ${(await r.text()).slice(0, 200)}`); process.exit(1); }
    console.log(`made the private ${BUCKET} bucket`);
  }
}

const file = flag("file");
if (file) {
  const text = readFileSync(new URL(file, ROOT), "utf8");
  const sheet = JSON.parse(text);
  const people = Object.values(sheet.tables || {}).flatMap(t => t.people || []);
  console.log(`${file}: written ${sheet.written}, ${Object.keys(sheet.tables || {}).length} tables, ${people.length} people, ${people.reduce((n, p) => n + (p.questions || []).length, 0)} questions, ${text.length} bytes`);
  if (!write) { console.log(`Say --write to put it at ${BUCKET}/${object}.`); process.exit(0); }
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${object}`, { method: "POST", headers: { ...H, "Content-Type": "application/json", "x-upsert": "true" }, body: text });
  if (!r.ok) { console.error(`upload: ${r.status} ${(await r.text()).slice(0, 200)}`); process.exit(1); }
  console.log(`up at ${BUCKET}/${object}`);
}

// What is up there now, and that the anon key cannot read it.
const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${object}`, { headers: H });
console.log(up.ok ? `${BUCKET}/${object}: written ${(await up.json()).written}` : `${BUCKET}/${object}: nothing there (${up.status})`);
const anon = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_KEY = "([^"]+)"/)?.[1];
if (anon) {
  const a = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${object}`, { headers: { apikey: anon, Authorization: "Bearer " + anon } });
  console.log(a.ok ? "WARNING: the anon key can read the sheet" : `the anon key cannot read the sheet (${a.status})`);
  const pub = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${object}`);
  console.log(pub.ok ? "WARNING: the sheet is public" : `the public path gives ${pub.status}`);
}
