// Move a class's photographs out of the class row.
//
// Every save writes the whole class, so the weight of that row is the cost of
// every keystroke. COMM 3 was 452KB and 346KB of it was 23 faces. This puts
// each picture in `<key>-photos`, a plain map of name to data URL, and leaves
// the mark `photo` on the profile where the picture was, so a card still reads
// as filled in. See src/engine/photos.js: the app reads both shapes, so a
// class can be moved over or not and nothing else changes.
//
// Nothing is deleted. The class row is copied to `<key>-bak-photos-<date>`
// first, and the photographs row is read back and checked before the class row
// is touched.
//
//   node scripts/photos-out.mjs comm999-v1              # say what would happen
//   node scripts/photos-out.mjs comm999-v1 --write      # do it
//   node scripts/photos-out.mjs --undo comm999-v1 --write   # put them back

import { readFileSync } from "node:fs";

const SUPABASE_URL = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8")
  .match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };

const PHOTO_MARK = "photo";
const isPicture = (v) => typeof v === "string" && v.startsWith("data:");
const bytes = (v) => JSON.stringify(v ?? null).length;

const args = process.argv.slice(2);
const write = args.includes("--write");
const undo = args.includes("--undo");
const keys = args.filter(a => !a.startsWith("--"));
if (!keys.length) { console.error("Which class? e.g. node scripts/photos-out.mjs comm999-v1"); process.exit(1); }

const read = async (id) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  const rows = await r.json();
  return rows[0]?.data ?? null;
};
const put = async (id, data) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST",
    headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`write ${id}: ${r.status} ${(await r.text()).slice(0, 200)}`);
};

for (const k of keys) {
  const cls = await read(k);
  if (!cls) { console.log(`${k}: no row`); continue; }
  const photosKey = k + "-photos";

  if (undo) {
    const photos = (await read(photosKey)) || {};
    const profiles = { ...(cls.profiles || {}) };
    let back = 0;
    for (const [name, url] of Object.entries(photos)) {
      if (!isPicture(url)) continue;
      const p = profiles[name];
      if (p && isPicture(p.avatar)) continue;
      profiles[name] = { ...(p || {}), avatar: url };
      back += 1;
    }
    console.log(`${k}: ${back} picture(s) back on the profiles, row ${bytes(cls)} -> ${bytes({ ...cls, profiles })}`);
    if (write && back) await put(k, { ...cls, profiles });
    continue;
  }

  const profiles = { ...(cls.profiles || {}) };
  const photos = { ...((await read(photosKey)) || {}) };
  const moving = [];
  for (const [name, p] of Object.entries(profiles)) {
    if (!isPicture(p?.avatar)) continue;
    photos[name] = p.avatar;
    profiles[name] = { ...p, avatar: PHOTO_MARK };
    moving.push(name);
  }
  const after = { ...cls, profiles };
  console.log(`${k}: ${moving.length} picture(s), row ${bytes(cls)} -> ${bytes(after)}, photographs row ${bytes(photos)}`);
  if (!moving.length || !write) { if (!write) console.log("  (say --write to do it)"); continue; }

  const stamp = new Date().toISOString().slice(0, 10);
  await put(`${k}-bak-photos-${stamp}`, cls);
  await put(photosKey, photos);

  // Read the pictures back before the class row loses them.
  const check = await read(photosKey);
  const missing = moving.filter(n => !isPicture(check?.[n]));
  if (missing.length) { console.error(`  STOPPED: ${missing.length} picture(s) did not read back. The class row is untouched.`); continue; }

  await put(k, after);
  console.log(`  done. backup: ${k}-bak-photos-${stamp}`);
}
