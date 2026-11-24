// For every released board in both classes: how many cards a press on
// Release would send now. Reads only, counts only. Run after a change to how
// grades are scored, to be sure no released grade reads as changed.
//
//   node scripts/release-check.mjs
import { readFileSync } from "node:fs";
import { releaseCounts, boardOf } from "../src/engine/grades.js";
const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + ": " + r.status); return r.json(); };
for (const id of ["comm3-f26-v1", "comm118-f26-v1"]) {
  const data = { ...(await get(`app_data?id=eq.${id}&select=data`))[0].data, ...(await get(`app_data?id=eq.${id}-plan&select=data`))[0].data };
  for (const aid of Object.keys(data.gradeBoard || {})) {
    const c = releaseCounts(data, aid);
    console.log(id + " " + aid.padEnd(14) + (boardOf(data, aid).released ? "released    " : "not released") + " " + JSON.stringify(c));
  }
}
