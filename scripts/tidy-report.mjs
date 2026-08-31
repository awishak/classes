// What the tidying lenses would find in the live stores. Reads, never writes.
//
// The duplicates lens and the loose-ends lens both run in the browser against
// whatever is in front of me. This runs the same two functions against every
// store at once, from here, so the size of the problem is a number before the
// tool to fix the problem gets used.
//
//   npm run tidy
//
// Read-only on purpose. Nothing here has a --write, because merging is a
// decision per cluster and a script cannot make the decision.

import { readFileSync } from "node:fs";
import { findDuplicates, findLooseEnds } from "../src/engine/tidy.js";
import { ENGINE_LIST } from "../src/config/registry.js";
import { SHARED_KEY, SHARED_LABEL } from "../src/engine/blocks.js";
import { normSlot } from "../src/engine/dayplan.js";
import { weekdayOf } from "../src/engine/schedule.js";

const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const BASE = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY };
const get = async (id) =>
  (await (await fetch(BASE + "/rest/v1/app_data?id=eq." + id + "&select=data", { headers })).json())?.[0]?.data || {};

const stores = { shared: await get(SHARED_KEY) };
for (const c of ENGINE_LIST) stores[c.id] = await get(c.storageKey);

// The index the page builds, built the same way here.
const uses = {};
const note = (id, u) => { if (id) (uses[id] = uses[id] || []).push(u); };
for (const c of ENGINE_LIST) {
  const d = stores[c.id];
  Object.entries(d.dayPlans || {}).forEach(([date, plan]) =>
    Object.entries(plan?.slots || {}).forEach(([slot, bucket]) =>
      normSlot(bucket).items.forEach(it => note(it.blockId, { cls: c, date, section: slot }))));
  (d.schedule || c.scheduleWeeks || []).forEach(w =>
    (w.items || []).forEach(it => note(it.libId, {
      cls: c, date: it.date ? ((w.dates || []).find(x => weekdayOf(x) === it.date) || "") : "", section: "Assigned" })));
}
const items = [];
for (const c of ENGINE_LIST)
  Object.values(stores[c.id].blocks || {}).forEach(b => items.push({ ...b, owner: c, target: c.id, uses: uses[b.id] || [] }));
Object.values(stores.shared.blocks || {}).forEach(b => items.push({ ...b, owner: null, target: "shared", uses: uses[b.id] || [] }));

console.log("");
console.log("  " + items.length + " blocks across " + ENGINE_LIST.length + " classes and the shared shelf");
for (const c of ENGINE_LIST) console.log("     " + c.code.padEnd(10) + Object.keys(stores[c.id].blocks || {}).length);
console.log("     " + SHARED_LABEL.padEnd(10) + Object.keys(stores.shared.blocks || {}).length);

const clusters = findDuplicates(items);
const copies = clusters.reduce((n, c) => n + c.blocks.length - 1, 0);
console.log("");
console.log("  DUPLICATES: " + clusters.length + " groups, " + copies + " blocks that could merge away");
console.log("     " + clusters.filter(c => c.spans).length + " groups cross a class, which are the ones costing an edit that does not travel");
console.log("     " + clusters.filter(c => c.on === "link").length + " matched on the web address, " +
            clusters.filter(c => c.on === "title").length + " on the title alone");
clusters.slice(0, 12).forEach(c => {
  console.log("     " + String(c.blocks.length) + "x  " + (c.blocks[0].title || "").slice(0, 52).padEnd(54) +
              c.blocks.map(b => (b.owner ? b.owner.code : SHARED_LABEL)).join(" + ") + (c.spans ? "   <- crosses" : ""));
});
if (clusters.length > 12) console.log("     and " + (clusters.length - 12) + " more groups");

const ends = findLooseEnds(stores, ENGINE_LIST);
console.log("");
console.log("  LOOSE ENDS: " + ends.length + " pointers with nothing on the other end");
console.log("     " + ends.filter(e => e.kind === "flow").length + " flow rows, blank on the day");
console.log("     " + ends.filter(e => e.kind === "week").length + " week items, repairable into the block each one stands for");
console.log("     " + ends.filter(e => e.legacy).length + " point at the library the engine had before blocks existed");
ends.slice(0, 10).forEach(e =>
  console.log("     " + e.cls.code.padEnd(10) + e.kind.padEnd(6) + (e.words || "(blank)").slice(0, 44).padEnd(46) + e.points));
if (ends.length > 10) console.log("     and " + (ends.length - 10) + " more");
console.log("");
