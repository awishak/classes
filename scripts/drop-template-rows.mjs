// Take the template class's placeholder rows out of a real class.
//
// COMM 118's config starts as a copy of COMM 999 and never blanked the
// template's weeks and library, so the seed bump pushed the template's three
// placeholders into the live store: a reading called Why We Bet, a challenge
// called Intro post, and an activity called This or That. Andrew, 2026-09-24:
// "only what i include should be there." This drops those rows from the
// weeks and from the library and writes nothing else.
//
//   node scripts/drop-template-rows.mjs <storageKey>           dry run
//   node scripts/drop-template-rows.mjs <storageKey> --write   writes

import { readFileSync } from "node:fs";
import comm999 from "../src/config/comm999.js";

const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const BASE = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const key = process.argv[2];
const write = process.argv.includes("--write");
if (!key) { console.error("Pass the class's storageKey."); process.exit(1); }

// The template's rows, by id. A real class's own rows never reuse these.
const itemIds = new Set(comm999.scheduleWeeks.flatMap(w => (w.items || []).map(it => it.id)));
const libIds = new Set(comm999.library.map(x => x.id));
const isTemplateItem = (it) => itemIds.has(it.id) || libIds.has(it.libId);

const get = async (id) => (await (await fetch(BASE + "/rest/v1/app_data?id=eq." + encodeURIComponent(id) + "&select=data", { headers })).json())?.[0]?.data || null;

// Only the two branches this script owns change. Everything else is the
// store's, as read.
function strip(data) {
  const dropped = [];
  const schedule = (data.schedule || []).map(w => {
    const keep = (w.items || []).filter(it => {
      const out = isTemplateItem(it);
      if (out) dropped.push(w.id + ": " + it.type + " " + JSON.stringify(it.title) + " (" + it.id + ")");
      return !out;
    });
    return keep.length === (w.items || []).length ? w : { ...w, items: keep };
  });
  const library = (data.library || []).filter(x => {
    const out = libIds.has(x.id);
    if (out) dropped.push("library: " + x.type + " " + JSON.stringify(x.title) + " (" + x.id + ")");
    return !out;
  });
  return { next: { ...data, schedule, library }, dropped };
}

const cur = await get(key);
if (!cur) { console.error("Nothing stored at " + key + "."); process.exit(1); }
const { dropped } = strip(cur);
console.log(dropped.length ? "Dropping:\n  " + dropped.join("\n  ") : "Nothing to drop.");
if (!dropped.length || !write) { if (!write) console.log("\nDry run. Add --write to write."); process.exit(0); }

// Re-read at the moment of writing, so a save that landed while this ran is
// not written over.
const { next } = strip(await get(key));
const r = await fetch(BASE + "/rest/v1/app_data?on_conflict=id", {
  method: "POST",
  headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
  body: JSON.stringify({ id: key, data: next, updated_at: new Date().toISOString() }),
});
if (!r.ok) { console.error("Write failed:", r.status, await r.text()); process.exit(1); }
const left = strip(await get(key)).dropped.length;
console.log(left ? "Written, but " + left + " template rows still read back." : "Written. No template rows read back.");
