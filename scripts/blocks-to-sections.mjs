// Turn the old freeform "blocks" into real sections, and the two magic slots
// with them.
//
// A section used to be a single row in plan.blocks, and there were two reserved
// slots — __after and __coming — that behaved like sections but were not ones.
// Everything becomes an ordinary named section, so there is one kind of thing
// on the screen instead of three.
//
//   node scripts/blocks-to-sections.mjs           dry run
//   node scripts/blocks-to-sections.mjs --write   writes

import { readFileSync } from "node:fs";
const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const BASE = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const get = async (id) => (await (await fetch(BASE + "/rest/v1/app_data?id=eq." + id + "&select=data", { headers })).json())?.[0]?.data || null;
const put = async (id, data) => {
  const r = await fetch(BASE + "/rest/v1/app_data?on_conflict=id", {
    method: "POST", headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(id + " " + r.status);
};

const norm = (x) => !x ? { items: [] }
  : Array.isArray(x.items) ? x : ((x.seedId || x.text) ? { title: x.title, items: [{ id: "legacy", ...x }] } : { title: x.title, items: [] });

let n = 0;
const key = () => "sec-m" + (++n).toString(36);
const STORES = ["comm118-f26-v1", "comm4-s26-v1", "comm2-s26-v1", "comm999-v1", "comm3-f26-v1"];
const write = process.argv.includes("--write");

for (const store of STORES) {
  const d = await get(store);
  if (!d) continue;
  let madeFromBlocks = 0, renamedAfter = 0, renamedComing = 0;

  const dayPlans = {};
  Object.entries(d.dayPlans || {}).forEach(([date, plan]) => {
    const slots = { ...(plan.slots || {}) };

    // each old block becomes a section holding one note
    (plan.blocks || []).forEach(b => {
      if (!b.title && !b.body && !(b.links || []).length) return;
      slots[key()] = { title: b.title || "Untitled section",
        items: [{ id: "b" + key(), text: b.body || b.title || "", links: b.links || [] }] };
      madeFromBlocks++;
    });

    // the two reserved slots become ordinary sections when they hold something
    [["__after", "After the main section"], ["__coming", "Coming up"]].forEach(([k, name]) => {
      const b = norm(slots[k]);
      if (!b.items.length) { delete slots[k]; return; }
      slots[key()] = { title: b.title || name, items: b.items };
      delete slots[k];
      if (k === "__after") renamedAfter++; else renamedComing++;
    });

    const { blocks, ...rest } = plan;
    dayPlans[date] = { ...rest, slots };
  });

  const total = madeFromBlocks + renamedAfter + renamedComing;
  console.log("  " + store.padEnd(18) + total + " new sections  (" + madeFromBlocks + " from blocks, " +
              renamedAfter + " after, " + renamedComing + " coming up)");
  if (write && total) { await put(store, { ...d, dayPlans }); console.log("     written"); }
}
if (!write) console.log("\n  dry run. add --write to do it.");
