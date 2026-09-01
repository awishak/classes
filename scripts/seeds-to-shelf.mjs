// The seed library, onto the shared shelf.
//
// The repository has a button for this, and the button had not been pressed,
// so the seven best stories Andrew has were still a markdown file nothing
// could search. Andrew: "how can we make seeds more like activities? like
// easily accessible."
//
// Same parser and the same shape the page writes, so pressing the button after
// running this adds nothing: a seed's id is made from its title.
//
//   node scripts/seeds-to-shelf.mjs           dry run
//   node scripts/seeds-to-shelf.mjs --write   writes

import { readFileSync } from "node:fs";
import { parseSeeds, seedPatch } from "../src/engine/seeds.js";

const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const BASE = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const WRITE = process.argv.includes("--write");
const SHELF = "ishak-blocks-v1";
const TODAY = new Date().toISOString().slice(0, 10);

const get = async (id) =>
  (await (await fetch(BASE + "/rest/v1/app_data?id=eq." + id + "&select=data", { headers })).json())?.[0]?.data || null;

const md = readFileSync(new URL("../teaching/seeds.md", import.meta.url), "utf8");
const seeds = parseSeeds(md);
const shelf = (await get(SHELF)) || {};
const blocks = { ...(shelf.blocks || {}) };
const titles = new Set(Object.values(blocks).map(b => (b.title || "").trim().toLowerCase()));

let added = 0;
seeds.forEach(seed => {
  const patch = seedPatch(seed);
  if (blocks[patch.id] || titles.has(patch.title.trim().toLowerCase())) return;
  blocks[patch.id] = {
    id: patch.id, type: patch.type, title: patch.title, body: patch.body, url: "", headline: "",
    children: [], tags: patch.tags, concept: patch.concept, source: patch.source, refId: "",
    created: TODAY, scheduled: [],
  };
  added++;
  console.log("   " + patch.title + "  ·  " + patch.tags.join(", "));
});

console.log((WRITE ? "seeds-to-shelf: " : "seeds-to-shelf: dry run, ") + added + " of " + seeds.length
  + " added, shelf holds " + Object.keys(blocks).length + " blocks");
if (added && WRITE) {
  const r = await fetch(BASE + "/rest/v1/app_data?id=eq." + SHELF, {
    method: "PATCH", headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ data: { ...shelf, blocks } }),
  });
  if (!r.ok) throw new Error("write failed: " + r.status + " " + (await r.text()));
  console.log("   written to " + SHELF);
}
