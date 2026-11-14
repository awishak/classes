// Put COMM 118's Sit-Down 2 (s2) and Culture Guide (s2-memo) grades and
// comments on the two grade boards, unreleased, and send the cards listed in
// the same file. Andrew, 2026-11-13: "yeah put the comments where they
// belong."
//
// Reads private/sitdown2-board.json: a letter with an optional sign for each
// card, or "nosub", or null when the letter is still his call (the comment
// goes on the card, the card stays unsorted). Does not release.
//
//   esbuild scripts/comm118-sitdown2-board.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.s2-board.mjs
//   node node_modules/.s2-board.mjs            prints
//   node node_modules/.s2-board.mjs --write    writes

import { readFileSync } from "node:fs";
import { placeCard, writeCard, BUCKETS } from "../src/engine/grades.js";
import { sendCard } from "../src/engine/notice.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const ID = "comm118-f26-v1", PLAN = "comm118-f26-v1-plan";
const file = JSON.parse(readFileSync(ROOT + "private/sitdown2-board.json", "utf8"));

const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`read ${q}: ${r.status}`); return r.json(); };
const cur = ((await get(`app_data?id=eq.${ID}&select=data`))[0] || {}).data;
if (!cur) throw new Error("no class row");
const roster = (((await get(`app_data?id=eq.${PLAN}&select=data`))[0] || {}).data?.students || []).map(s => s.name);
for (const aid of ["s2", "s2-memo"]) if (Object.keys(cur.gradeBoard?.[aid]?.cards || {}).length) throw new Error(aid + " already has cards on its board; not writing over them");

const split = (g) => {
  if (g === "nosub") return { bucket: "nosub", sign: "" };
  const m = /^([ABCD])([+-]?)$/.exec(g || "");
  if (!m) throw new Error("not a grade: " + g);
  const b = BUCKETS.find(b => b.id === m[1].toLowerCase());
  if (!b) throw new Error("no bucket for " + g);
  return { bucket: b.id, sign: m[2] };
};
let next = cur, now = Date.now(), i = 0;
const put = (aid, name, grade, comment) => {
  if (grade) { const { bucket, sign } = split(grade); next = placeCard(next, aid, name, bucket, now + i); next = writeCard(next, aid, name, { sign, comment }, now + i); }
  else next = writeCard(next, aid, name, { comment }, now + i);
  i++;
};
file.students.forEach(s => {
  if (!roster.includes(s.name)) throw new Error("not on the roster: " + s.name);
  put("s2", s.name, s.sitdown, s.sitdownComment);
  put("s2-memo", s.name, s.guide, s.guideComment);
  console.log(`${s.name.padEnd(22)} sit-down ${(s.sitdown || "unsorted").padEnd(9)} guide ${s.guide}`);
});
file.cards.forEach((c, k) => {
  if (!roster.includes(c.to)) throw new Error("not on the roster: " + c.to);
  next = sendCard(next, (now + k).toString(36) + Math.random().toString(36).slice(2, 7), c.text, 0, [c.to], now + k);
  console.log("card to " + c.to + ": " + c.text);
});
for (const aid of ["s2", "s2-memo"]) { const cards = next.gradeBoard[aid].cards; console.log(aid + ": " + Object.keys(cards).length + " cards, " + Object.values(cards).filter(c => c.bucket).length + " sorted, " + Object.values(cards).filter(c => c.comment).length + " with a comment, released " + JSON.stringify(next.gradeBoard[aid].released || null)); }

if (!write) { console.log("\nNothing written. Say --write to do it."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
  method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
  body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }),
});
if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${(await w.text()).slice(0, 200)}`);
const back = (await w.json())[0]?.data;
console.log("wrote " + ID + ": s2 " + Object.keys(back?.gradeBoard?.s2?.cards || {}).length + " cards, s2-memo " + Object.keys(back?.gradeBoard?.["s2-memo"]?.cards || {}).length + " cards, notice cards " + (back?.noticeCards || []).length);
