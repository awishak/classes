// Grade COMM 3's Audio story ideas from the TA mode sort. Andrew, 2026-11-05:
// "you can count parkers as complete bc she came to office hours to discuss.
// otherwise, go ahead and sort all those students and assign them the grades."
//
// Places every student's card on the challenge's grade board the way Grade
// Flow does (grades.js placeCard, writeCard), then releases (releasePatch,
// with the meeting link the way the Release button sends it). The late ten
// get the one flat line late work gets. The sort is read from the file TA
// mode was built from, one bucket a student.
//
//   node scripts/comm3-audio-ideas-grade.mjs <graded.json>           prints
//   node scripts/comm3-audio-ideas-grade.mjs <graded.json> --write   writes
//
// Bundle first (grades.js is JSX-adjacent ESM):
//   esbuild scripts/comm3-audio-ideas-grade.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.grade-ideas.mjs && node node_modules/.grade-ideas.mjs ...

import { readFileSync } from "node:fs";
import { placeCard, writeCard, releasePatch, COMPLETE_BUCKETS } from "../src/engine/grades.js";
import { schedulingLinkOf } from "../src/instructors.js";
import comm3 from "../src/config/comm3.js";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const args = process.argv.slice(2);
const write = args.includes("--write");
const file = args.find(a => !a.startsWith("--"));
if (!file) { console.error("Say which graded.json."); process.exit(1); }
const ID = "comm3-f26-v1";
const AID = "audio-ideas";
const BUCKET_ID = { "Complete": "complete", "Completed with Revisions": "revisions-c", "Not quite": "notquite", "Not submitted": "notsubmitted" };
// His calls on the proposal, 2026-11-05.
const OVERRIDE = { "Parker Fryberger": "Complete" };
const LATE_LINE = "Submitted late.";

const rows = JSON.parse(readFileSync(file, "utf8"));
const plan = rows.map(r => ({ name: r.name, bucket: OVERRIDE[r.name] || r.bucket, late: !!r.late }));
const counts = {};
plan.forEach(p => { counts[p.bucket] = (counts[p.bucket] || 0) + 1; });
console.log(Object.entries(counts).map(([b, n]) => n + " " + b).join(", "));
plan.filter(p => p.bucket !== "Complete" || p.late).forEach(p => console.log(`  ${p.bucket.padEnd(26)} ${p.name}${p.late ? "  · " + LATE_LINE : ""}`));
if (!COMPLETE_BUCKETS.find(b => b.id === "revisions-c")) throw new Error("bucket ids changed");

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const cur = ((await r.json())[0] || {}).data;
if (!cur) throw new Error("no class row");
const roster = new Set((cur.students || []).map(s => s.name));
const missing = plan.filter(p => !roster.has(p.name)).map(p => p.name);
if (missing.length) console.log("not on the class row's roster (plan row holds it; fine):", missing.join(", "));

let next = cur;
const now = Date.now();
plan.forEach((p, i) => {
  next = placeCard(next, AID, p.name, BUCKET_ID[p.bucket], now + i);
  if (p.late) next = writeCard(next, AID, p.name, { comment: LATE_LINE }, now + i);
});
next = releasePatch(next, AID, now + plan.length, { meetingLink: schedulingLinkOf(comm3) });
const log = next.assignmentLog[AID];
const grades = plan.map(p => { const g = (log[p.name] || []).filter(e => e.type === "grade" && e.board).pop(); return [p.name, g?.letter, g?.score, g?.html ? "comment" : ""]; });
console.log("\nafter release:", grades.filter(g => g[1]).length, "grade entries;", grades.filter(g => !g[1]).map(g => g[0]).join(", ") || "everyone has one");
console.log("sample:", JSON.stringify(grades.slice(0, 3)));

if (!write) { console.log("\nNothing written. Say --write to place and release."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
  method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
  body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }),
});
if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("wrote " + ID + ": released " + grades.filter(g => g[1]).length + " grades on " + AID);
