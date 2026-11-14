// Sit-Down 1 (s1) for COMM 118: every student an A on the grade board, no
// comment, unreleased. Andrew, 2026-11-13: "just give them all As".
//
//   esbuild scripts/comm118-sitdown1-board.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.s1-board.mjs
//   node node_modules/.s1-board.mjs [--write]

import { readFileSync } from "node:fs";
import { placeCard } from "../src/engine/grades.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const ID = "comm118-f26-v1", PLAN = "comm118-f26-v1-plan", AID = "s1";
const NOT_STUDENTS = ["Pepe LeFritz", "Jan Itor", "Marty McFly"];
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + " " + r.status); return r.json(); };
let next = (await get(`app_data?id=eq.${ID}&select=data`))[0].data;
const names = (await get(`app_data?id=eq.${PLAN}&select=data`))[0].data.students.map(s => s.name).filter(n => !NOT_STUDENTS.includes(n));
if (names.length !== 25) throw new Error("expected 25 students, found " + names.length);
if (Object.keys(next.gradeBoard?.[AID]?.cards || {}).length) throw new Error(AID + " already has cards");
const now = Date.now();
names.forEach((n, i) => { next = placeCard(next, AID, n, "a", now + i); });
const cards = next.gradeBoard[AID].cards;
console.log(Object.keys(cards).length + " cards, all " + [...new Set(Object.values(cards).map(c => c.bucket))].join(",") + ", released " + JSON.stringify(next.gradeBoard[AID].released || null));
if (!process.argv.includes("--write")) { console.log("Nothing written."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
console.log("wrote: " + Object.keys((await w.json())[0].data.gradeBoard[AID].cards).length + " cards on " + AID);
