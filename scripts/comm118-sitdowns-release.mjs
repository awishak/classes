// Release COMM 118's Sit-Down 1 (s1), Sit-Down 2 (s2) and Culture Guide
// (s2-memo) from the boards as they stand. Andrew, 2026-11-13: "release
// grades", after "Say release for all three".
//
//   esbuild scripts/comm118-sitdowns-release.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.sd-release.mjs
//   node node_modules/.sd-release.mjs [--write]

import { readFileSync } from "node:fs";
import { releasePatch } from "../src/engine/grades.js";
import { schedulingLinkOf } from "../src/instructors.js";
import comm118 from "../src/config/comm118.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const ID = "comm118-f26-v1", AIDS = ["s1", "s2", "s2-memo"];
const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
let next = (await r.json())[0].data;
const now = Date.now();
AIDS.forEach((aid, i) => {
  const cards = next.gradeBoard?.[aid]?.cards || {};
  if (Object.keys(cards).length !== 25 || Object.values(cards).some(c => !c.bucket)) throw new Error(aid + ": not 25 sorted cards");
  if (next.gradeBoard[aid].released) throw new Error(aid + " is already released");
  next = releasePatch(next, aid, now + i, { meetingLink: schedulingLinkOf(comm118) });
  const log = next.assignmentLog[aid], counts = {}; let withComment = 0;
  Object.keys(cards).forEach(n => { const g = (log[n] || []).filter(e => e.type === "grade" && e.board).pop(); counts[g?.letter || "none"] = (counts[g?.letter || "none"] || 0) + 1; if (g?.html) withComment++; });
  console.log(aid, JSON.stringify(counts), "| with a comment:", withComment);
});
if (!process.argv.includes("--write")) { console.log("Nothing written."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
const back = (await w.json())[0].data;
console.log("wrote: " + AIDS.map(a => a + " " + Object.keys(back.assignmentLog[a] || {}).length + " released").join(", "));
