// "Dr. Ishak at NCA" as the line under Wednesday's and Friday's headings,
// November 18 and 20, in COMM 3 and COMM 118. Andrew, 2026-11-14: "Dr. Ishak
// at NCA is still fine for wed and fri as subheading for both classes."
// Writes dayPlans[day].sub on each plan row; the schedule draws the line.
//
//   node scripts/week9-nca-sub.mjs           prints
//   node scripts/week9-nca-sub.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const SUB = "Dr. Ishak at NCA";

for (const id of ["comm3-f26-v1-plan", "comm118-f26-v1-plan"]) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H });
  const cur = ((await r.json())[0] || {}).data;
  if (!cur) throw new Error("no row " + id);
  const dp = { ...(cur.dayPlans || {}) };
  for (const day of ["Nov 18", "Nov 20"]) { dp[day] = { ...(dp[day] || {}), sub: SUB }; console.log(id, day, JSON.stringify(dp[day].title), "+", JSON.stringify(SUB)); }
  if (!write) continue;
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data: { ...cur, dayPlans: dp }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${id}: ${w.status}`);
  console.log("wrote " + id);
}
if (!write) console.log("\nNothing written. Say --write.");
