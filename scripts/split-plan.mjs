// Takes the lesson plan out of the class row. SPLIT.md has the reasoning.
//
// For each current class: a backup of the whole row as `<key>-before-split-
// <date>`, then the plan keys copied into `<key>-plan` and taken off the
// class row. Run once, after the code that reads two rows is live and every
// dashboard tab has been reloaded. Safe to run again: a class already split
// is left alone.
//
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/split-plan.mjs
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/split-plan.mjs --dry
//
// The service role bypasses row security, so this works before or after the
// policies in SPLIT.md are in place. The key is read from the environment and
// never printed.

import { PLAN_KEYS, splitParts } from "../src/engine/plan-keys.js";

const URL = "https://ybuchgebudixbyrcxpik.supabase.co/rest/v1/app_data";
const KEYS = ["comm118-f26-v1", "comm3-f26-v1", "comm999-v1"];
const DRY = process.argv.includes("--dry");

const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!key) { console.error("Set SUPABASE_SERVICE_ROLE_KEY in the environment first."); process.exit(1); }
const headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "return=representation,resolution=merge-duplicates" };

async function read(id) {
  const r = await fetch(URL + "?id=eq." + encodeURIComponent(id) + "&select=data", { headers });
  if (!r.ok) throw new Error("read " + id + ": " + r.status);
  const rows = await r.json();
  return rows.length ? rows[0].data : null;
}
async function write(id, data) {
  if (DRY) { console.log("  would write", id, sizeOf(data)); return; }
  const r = await fetch(URL + "?on_conflict=id", { method: "POST", headers, body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }) });
  if (!r.ok) throw new Error("write " + id + ": " + r.status + " " + await r.text());
}
const sizeOf = (v) => Math.round(JSON.stringify(v).length / 1024) + " KB";
const today = new Date().toISOString().slice(0, 10);

for (const k of KEYS) {
  console.log("== " + k);
  const row = await read(k);
  if (!row) { console.log("  no row, skipped"); continue; }
  const planKey = k + "-plan";
  const havePlan = await read(planKey);
  const { plan, rest } = splitParts(row);
  if (havePlan && !Object.keys(plan).length) { console.log("  already split"); continue; }

  const backupKey = k + "-before-split-" + today;
  if (await read(backupKey)) console.log("  backup exists:", backupKey);
  else { await write(backupKey, row); if (!DRY) console.log("  backup written:", backupKey, sizeOf(row)); }

  // What the plan row already holds is newer than the class row's copy: the
  // deployed code has been writing every edit there since it went live.
  const merged = { ...plan, ...(havePlan || {}) };
  await write(planKey, merged);
  console.log("  plan row:", Object.keys(merged).sort().join(" "), sizeOf(merged));

  await write(k, rest);
  console.log("  class row:", Object.keys(rest).sort().join(" "), sizeOf(rest));

  if (!DRY) {
    const [c, p] = await Promise.all([read(k), read(planKey)]);
    const left = Object.keys(c || {}).filter(x => PLAN_KEYS.has(x));
    if (left.length) console.log("  STILL ON THE CLASS ROW:", left.join(" "));
    console.log("  read back: class " + sizeOf(c) + ", plan " + sizeOf(p));
  }
}
console.log(DRY ? "dry run, nothing written" : "done");
