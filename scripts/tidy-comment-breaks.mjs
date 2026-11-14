// Take the stray line breaks out of grade comments that a script wrote.
//
// Some comments went onto the board from a script whose text was wrapped the
// way source code is wrapped: a break mid-sentence, and the next line
// indented. A comment keeps its line breaks when a student reads it (toHtml,
// grades.js), so those students read a paragraph broken every few words.
// Andrew, 2026-11-13, asked whether to clean them: "yes."
//
// What is changed: a paragraph in a card's comment where some line starts
// with two or more spaces is taken to be source-wrapped, and its lines are
// joined with single spaces. A bullet stays a bullet, and a wrapped line
// under a bullet joins that bullet. Paragraphs with no indented line are
// left exactly as they are, since a break typed on purpose looks the same.
//
// The released grade is changed in place, same id and same time, and only
// where it is word for word what the card said, so no student gets a new
// grade card and the board still reads as released with nothing waiting.
// The script checks that last part and stops before writing if it is not so.
// A card whose released grade already differs (a change waiting in Grade
// Flow) has its card tidied and its released grade left alone.
//
//   bundle, the way the other grade scripts are bundled:
//   npx esbuild scripts/tidy-comment-breaks.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.tidy-breaks.mjs
//   node node_modules/.tidy-breaks.mjs           prints what would change
//   node node_modules/.tidy-breaks.mjs --write   writes
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";
import { toHtml, releaseCounts } from "../src/engine/grades.js";
import { currentClasses } from "../src/config/registry.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");

const BULLET = /^\s*[-–*•]\s+/;
export const tidy = (text) => String(text || "").trim().split(/\n{2,}/).map(block => {
  const lines = block.split("\n");
  if (!lines.some(l => /^[ \t]{2,}\S/.test(l) && !BULLET.test(l))) return block;
  const out = [];
  lines.forEach(line => {
    const l = line.trim();
    if (!l) return;
    if (!out.length || BULLET.test(line)) out.push(BULLET.test(line) ? line.trimEnd() : l);
    else out[out.length - 1] += " " + l;
  });
  return out.join("\n");
}).join("\n\n");

const read = async (id) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H }); if (!r.ok) throw new Error(`read ${id}: ${r.status}`); return ((await r.json())[0] || {}).data || null; };
const put = async (id, data) => { const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }) }); if (!w.ok) throw new Error(`write ${id}: ${w.status}`); const rows = await w.json(); if (!rows.length) throw new Error(`write ${id}: nothing came back`); };

let shown = 0;
for (const c of currentClasses().filter(x => !x.demo)) {
  const ids = [c.storageKey, c.storageKey + "-plan"];
  const rows = Object.fromEntries(await Promise.all(ids.map(async id => [id, await read(id)])));
  // The board is the plan row's (the class row can hold an old copy from before the split); the log is the class row's.
  const boardRow = [...ids].reverse().find(id => rows[id]?.gradeBoard), logRow = ids.find(id => rows[id]?.assignmentLog);
  if (!boardRow) { console.log(c.id + ": no grade board"); continue; }
  const merged = () => ({ gradeBoard: rows[boardRow].gradeBoard, assignmentLog: logRow ? rows[logRow].assignmentLog : {} });
  const boards = JSON.parse(JSON.stringify(rows[boardRow].gradeBoard));
  const logs = logRow ? JSON.parse(JSON.stringify(rows[logRow].assignmentLog)) : {};
  const before = Object.fromEntries(Object.keys(boards).map(aid => [aid, JSON.stringify(releaseCounts(merged(), aid))]));
  let cards = 0, sent = 0, left = 0;
  Object.entries(boards).forEach(([aid, board]) => Object.entries(board.cards || {}).forEach(([name, card]) => {
    const was = card.comment, now = was ? tidy(was) : was;
    // Nothing a student would read differently: leave the card as typed.
    if (!was || toHtml(now) === toHtml(was)) return;
    cards++;
    const events = (logs[aid]?.[name] || []).filter(e => e.board && e.type === "grade" && !e.deleted);
    const last = events[events.length - 1];
    if (last && (last.html || null) === (toHtml(was) || null)) { last.html = toHtml(now) || null; sent++; } else if (last) left++;
    card.comment = now;
    if (shown < 3) { shown++; console.log(`\n--- ${c.id} ${aid} (before)\n${was}\n--- (after)\n${now}`); }
  }));
  const after = { gradeBoard: boards, assignmentLog: logs };
  const drift = Object.keys(boards).filter(aid => JSON.stringify(releaseCounts(after, aid)) !== before[aid]);
  console.log(`\n${c.id}: ${cards} comments tidied, ${sent} released grades changed in place, ${left} released grades left because a change is waiting`);
  if (drift.length) { console.error("Stopping: these boards would read differently after: " + drift.join(", ")); process.exit(1); }
  if (!write || !cards) continue;
  await put(boardRow, { ...rows[boardRow], gradeBoard: boards });
  if (logRow && sent) await put(logRow, { ...(logRow === boardRow ? { ...rows[boardRow], gradeBoard: boards } : rows[logRow]), assignmentLog: logs });
  console.log("wrote " + c.id);
}
if (!write) console.log("\nNothing written. Say --write.");
