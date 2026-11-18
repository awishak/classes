// Put five COMM 118 grade boards where the site reads them: Sit-Down 1,
// Concepts, Locker Room, Culture Guide and Sit-Down 2.
//
// The same fault as comm3-audio-boards-to-plan.mjs. The grade board is a plan
// key (plan-keys.js): the site reads data.gradeBoard off the plan row,
// comm118-f26-v1-plan. The scripts that graded and released these five wrote
// the boards to the class row, comm118-f26-v1. The grades are in every
// student's log, but with no board on the plan row his Grade view shows
// nothing sorted. Andrew, 2026-11-17: "how come when i go here it says
// nothing is sorted yet".
//
// Copies each board from the class row to the plan row, as it stands, release
// stamp included. A board already on the plan row is left alone. Nothing is
// taken off the class row.
//
//   node scripts/comm118-boards-to-plan.mjs           prints
//   node scripts/comm118-boards-to-plan.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const CLASS = "comm118-f26-v1", PLAN = "comm118-f26-v1-plan", AIDS = ["s1", "concepts", "wc3", "s2-memo", "s2"];
const rowOf = async (id) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H }); if (!r.ok) throw new Error(id + ": " + r.status); return ((await r.json())[0] || {}).data || {}; };

const cls = await rowOf(CLASS), plan = await rowOf(PLAN);
const boards = { ...(plan.gradeBoard || {}) };
const moved = [];
for (const aid of AIDS) {
  const from = cls.gradeBoard?.[aid];
  if (!from) { console.log(`${aid}: no board on the class row`); continue; }
  if (boards[aid] && Object.keys(boards[aid].cards || {}).length) { console.log(`${aid}: the plan row already has a board, left alone`); continue; }
  boards[aid] = from;
  moved.push(aid);
  console.log(`${aid}: ${Object.keys(from.cards || {}).length} cards, released ${from.released?.at ? new Date(from.released.at).toISOString() : "no"}`);
}
if (!process.argv.includes("--write")) { console.log("Nothing written. Say --write."); process.exit(0); }
if (!moved.length) { console.log("Nothing to write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify({ id: PLAN, data: { ...plan, gradeBoard: boards }, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
console.log("wrote " + moved.join(", ") + " to the plan row");
