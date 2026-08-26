// Point the readings already on a schedule at the blocks they are.
//
// A scheduled item made before blocks existed carries a libId from the old
// library, which no block answers to. So a headline written on one stays on
// that day instead of following the reading everywhere it is used. Matching is
// by web address, because the same reading has the same link.
//
//   node scripts/link-readings.mjs           dry run
//   node scripts/link-readings.mjs --write   writes

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

const norm = (u) => (u || "").trim().toLowerCase().replace(/\/+$/, "");
const STORES = ["comm118-f26-v1", "comm4-s26-v1", "comm2-s26-v1"];
const write = process.argv.includes("--write");

for (const key of STORES) {
  const d = await get(key);
  if (!d) { console.log("  " + key + ": no data"); continue; }

  const byUrl = new Map();
  const byTitle = new Map();
  Object.values(d.blocks || {}).forEach(b => {
    if (b.url) byUrl.set(norm(b.url), b.id);
    if (b.title) byTitle.set(norm(b.title), b.id);
  });

  let linked = 0, already = 0, noMatch = 0, total = 0;
  const misses = [];
  const schedule = (d.schedule || []).map(w => ({
    ...w,
    items: (w.items || []).map(it => {
      total++;
      if (it.libId && (d.blocks || {})[it.libId]) { already++; return it; }
      const hit = (it.url && byUrl.get(norm(it.url))) || byTitle.get(norm(it.title));
      if (!hit) { noMatch++; if (misses.length < 4) misses.push(it.title); return it; }
      linked++;
      return { ...it, libId: hit };
    }),
  }));

  console.log("  " + key.padEnd(18) + total + " scheduled items · " + linked + " newly linked · " +
              already + " already · " + noMatch + " no block");
  if (misses.length) console.log("     unmatched, e.g.: " + misses.join(" | "));
  if (write && linked) { await put(key, { ...d, schedule }); console.log("     written"); }
}

if (!write) console.log("\n  dry run. add --write to do it.");
