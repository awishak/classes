// Grade COMM 3's Audio story pre-production (audio-pre) and release, grades
// only: students already have Andrew's notes on the review page. Reads
// private/comm3-audio-pre-board.json, { name: bucket }. A student left out
// of the file gets no card. Andrew approved the sort on 2026-11-14.
//
//   esbuild scripts/comm3-audio-pre-grade.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.c3-pre.mjs
//   node node_modules/.c3-pre.mjs [--write]

import { readFileSync } from "node:fs";
import { placeCard, releasePatch, bucketOf } from "../src/engine/grades.js";
import { schedulingLinkOf } from "../src/instructors.js";
import comm3 from "../src/config/comm3.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const ID = "comm3-f26-v1", AID = "audio-pre";
const sort = JSON.parse(readFileSync(ROOT + "private/comm3-audio-pre-board.json", "utf8"));
const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
let next = (await r.json())[0].data;
if (Object.keys(next.gradeBoard?.[AID]?.cards || {}).length) throw new Error(AID + " already has cards");
const now = Date.now();
Object.entries(sort).forEach(([name, bucket], i) => { if (!bucketOf(bucket)) throw new Error("no bucket " + bucket); next = placeCard(next, AID, name, bucket, now + i); });
next = releasePatch(next, AID, now + 1000, { meetingLink: schedulingLinkOf(comm3) });
const counts = {}; Object.keys(sort).forEach(n => { const g = (next.assignmentLog[AID][n] || []).filter(e => e.type === "grade").pop(); counts[g?.letter || "none"] = (counts[g?.letter || "none"] || 0) + 1; });
console.log(JSON.stringify(counts));
if (!process.argv.includes("--write")) { console.log("Nothing written."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
console.log("wrote and released " + Object.keys(sort).length + " grades on " + AID);
process.exit(0);
