// Move COMM 3 students whose work came in after their grade, one card each,
// and release only those cards. Reads private/comm3-regrades.json:
// [{ aid, name, bucket, was }]. Stops if a student's current grade is not
// `was` (null for a student with no grade yet). Andrew, 2026-11-14, approved
// each move in the file.
//
//   esbuild scripts/comm3-regrades.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.c3-regrades.mjs
//   node node_modules/.c3-regrades.mjs [--write]

import { readFileSync } from "node:fs";
import { placeCard, writeCard, releasePatch, bucketOf } from "../src/engine/grades.js";
import { schedulingLinkOf } from "../src/instructors.js";
import comm3 from "../src/config/comm3.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const ID = "comm3-f26-v1";
const MEETING = schedulingLinkOf(comm3);
const moves = JSON.parse(readFileSync(ROOT + "private/comm3-regrades.json", "utf8"));
const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
let next = (await r.json())[0].data;
const lastGrade = (d, aid, name) => (d.assignmentLog?.[aid]?.[name] || []).filter(e => e.type === "grade" && !e.deleted).sort((a, b) => a.ts - b.ts).pop();
let now = Date.now();
for (const aid of [...new Set(moves.map(m => m.aid))]) {
  const mine = moves.filter(m => m.aid === aid);
  const before = Object.fromEntries([...new Set([...Object.keys(next.assignmentLog?.[aid] || {}), ...mine.map(m => m.name)])].map(n => [n, JSON.stringify(lastGrade(next, aid, n) || null)]));
  mine.forEach(m => {
    const g = lastGrade(next, aid, m.name);
    if ((g?.bucket || null) !== (m.was || null)) throw new Error(`${m.name} on ${aid} is ${g?.bucket}, not ${m.was}`);
    if (!bucketOf(m.bucket)) throw new Error("no bucket " + m.bucket);
    next = placeCard(next, aid, m.name, m.bucket, now++);
    // A comment on the card is left alone unless the move names a new one.
    if (m.comment !== undefined) next = writeCard(next, aid, m.name, { comment: m.comment }, now++);
  });
  next = releasePatch(next, aid, now++, { meetingLink: MEETING });
  const touched = Object.keys(before).filter(n => JSON.stringify(lastGrade(next, aid, n) || null) !== before[n]);
  console.log(aid + ": changed " + touched.length + " student(s); " + mine.map(m => (m.was || "no grade") + " -> " + lastGrade(next, aid, m.name).letter).join(", "));
  if (touched.length !== mine.length) throw new Error(aid + ": a release would touch " + touched.length + " grades, expected " + mine.length);
}
if (!process.argv.includes("--write")) { console.log("Nothing written."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
console.log("wrote " + ID); process.exit(0);
