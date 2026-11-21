// COMM 118, three things Andrew asked for on 2026-11-21: "grade then if they
// did it, do done, do done."
//
// 1. Turkey Bowl (wc4): every student whose wc4 log holds the game's own
//    hand-in (id "tb-...", which means a saved run that reached Level 3) and
//    who has no card yet is placed in Complete, and the board is released.
//    Grades only, no comments. Run again after Thanksgiving, it grades whoever
//    played since and leaves the rest as they are.
// 2. Sophia Taylor's bug report of Sep 30 is marked done.
// 3. Will Tortorella's thread is marked Done in the inbox (plan row).
//
//   esbuild scripts/comm118-wc4-grade-and-done.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.wc4-grade.mjs
//   node node_modules/.wc4-grade.mjs [--write]

import { readFileSync } from "node:fs";
import { placeCard, releasePatch } from "../src/engine/grades.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const ID = "comm118-f26-v1", PLAN = ID + "-plan", AID = "wc4";
const BUG_FROM = "Sophia Taylor", DONE_THREAD = "Will Tortorella";
const get = async (id) => ((await (await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H })).json())[0] || {}).data;
const put = async (id, data) => {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }) });
  if (!w.ok) throw new Error("write " + id + ": " + w.status + " " + (await w.text()).slice(0, 200));
  return (await w.json())[0].data;
};
// The clock is read this way because a bundle that pulls in the smoke globals pins Date.now.
const now = Math.round(performance.timeOrigin + performance.now());

function patch(data) {
  let next = data;
  const log = next.assignmentLog?.[AID] || {};
  const played = Object.keys(log).filter(n => (log[n] || []).some(e => !e.deleted && e.type === "submission" && String(e.id).startsWith("tb-")));
  const cards = next.gradeBoard?.[AID]?.cards || {};
  const fresh = played.filter(n => !cards[n]?.bucket);
  fresh.forEach((n, i) => { next = placeCard(next, AID, n, "complete", now + i); });
  if (fresh.length) next = releasePatch(next, AID, now + fresh.length);
  const graded = played.map(n => [n, (next.assignmentLog[AID][n] || []).filter(e => e.type === "grade" && e.board).pop()?.letter || "none"]);
  const bugs = (next.requests || []).filter(r => r.from === BUG_FROM && !r.done && !r.deleted);
  if (bugs.length) next = { ...next, requests: next.requests.map(r => (bugs.includes(r) ? { ...r, done: now } : r)) };
  return { next, played, fresh, graded, bugs };
}

const base = await get(ID), plan = await get(PLAN);
const dry = patch(base);
console.log(`wc4: ${dry.played.length} played, ${dry.fresh.length} new cards in Complete, released: ${!!dry.next.gradeBoard?.[AID]?.released}`);
dry.graded.forEach(([n, g]) => console.log("  " + n + " | " + g));
console.log(`bug reports from ${BUG_FROM} to mark done: ${dry.bugs.length}` + dry.bugs.map(b => "\n  " + String(b.text).slice(0, 90)).join(""));
const thread = (base.threads?.[DONE_THREAD] || []).filter(m => !m.deleted);
const last = thread[thread.length - 1];
const mark = last && last.from === "student" ? last.ts : 0;
console.log(`${DONE_THREAD}: ` + (mark ? "Done on \"" + String(last.text).slice(0, 70) + "\"" : "last word is not his, nothing to mark"));
if (!process.argv.includes("--write")) { console.log("\nNothing written. Say --write."); process.exit(0); }

// Read again right before the write, so the patch is laid on the row as it is now.
const out = patch(await get(ID));
const back = await put(ID, out.next);
console.log("wrote " + ID + ": " + Object.values(back.assignmentLog[AID]).filter(l => l.some(e => e.type === "grade" && e.board)).length + " students with a released grade on wc4; bug reports done: " + out.bugs.length);
if (mark) {
  const p = await get(PLAN);
  const backPlan = await put(PLAN, { ...p, inboxDone: { ...(p.inboxDone || {}), ["t:" + DONE_THREAD]: mark } });
  console.log("wrote " + PLAN + ": inboxDone has " + Object.keys(backPlan.inboxDone).length + " marks");
}
