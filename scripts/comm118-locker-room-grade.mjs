// Grade COMM 118's Locker Room (wc3) and release, grades only, no comments.
// Andrew, 2026-11-13, approved the sort: everyone Complete except the names
// in private/ta-mode/locker-room/late.json, who are Late but complete.
//
//   esbuild scripts/comm118-locker-room-grade.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.lr-grade.mjs
//   node node_modules/.lr-grade.mjs [--write]

import { readFileSync } from "node:fs";
import { placeCard, releasePatch } from "../src/engine/grades.js";
import { schedulingLinkOf } from "../src/instructors.js";
import comm118 from "../src/config/comm118.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const ID = "comm118-f26-v1", PLAN = "comm118-f26-v1-plan", AID = "wc3";
const NOT_STUDENTS = ["Pepe LeFritz", "Jan Itor", "Marty McFly"];
const LATE = JSON.parse(readFileSync(ROOT + "private/ta-mode/locker-room/late.json", "utf8"));
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + " " + r.status); return r.json(); };
let next = (await get(`app_data?id=eq.${ID}&select=data`))[0].data;
const names = (await get(`app_data?id=eq.${PLAN}&select=data`))[0].data.students.map(s => s.name).filter(n => !NOT_STUDENTS.includes(n));
if (names.length !== 25) throw new Error("expected 25 students, found " + names.length);
if (Object.keys(next.gradeBoard?.[AID]?.cards || {}).length) throw new Error(AID + " already has cards");
const now = Date.now();
names.forEach((n, i) => { next = placeCard(next, AID, n, LATE.includes(n) ? "late-c" : "complete", now + i); });
next = releasePatch(next, AID, now + names.length, { meetingLink: schedulingLinkOf(comm118) });
const log = next.assignmentLog[AID];
const got = names.map(n => [n, (log[n] || []).filter(e => e.type === "grade" && e.board).pop()?.letter]);
const counts = {}; got.forEach(g => { counts[g[1]] = (counts[g[1]] || 0) + 1; });
console.log(JSON.stringify(counts), "| released", !!next.gradeBoard[AID].released, "| without a grade:", got.filter(g => !g[1]).map(g => g[0]).join(", ") || "none");
if (!process.argv.includes("--write")) { console.log("Nothing written."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
const back = (await w.json())[0].data;
console.log("wrote: " + Object.keys(back.assignmentLog[AID]).length + " students with a released grade on " + AID);
