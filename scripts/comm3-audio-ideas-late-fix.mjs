// Move the ten late Audio story ideas grades from Completed with Revisions
// to Late but complete and release again. Andrew, 2026-11-05: "how can
// something be completed with revisions if they didn't do revisions?" and
// then "marked as late but complete." The "Submitted late." line comes off,
// since the mark now says it.
//
//   node scripts/comm3-audio-ideas-late-fix.mjs           prints
//   node scripts/comm3-audio-ideas-late-fix.mjs --write   writes and releases
// Bundle first, the way comm3-audio-ideas-grade.mjs is bundled.

import { readFileSync } from "node:fs";
import { placeCard, writeCard, releasePatch, boardOf } from "../src/engine/grades.js";
import { schedulingLinkOf } from "../src/instructors.js";
import comm3 from "../src/config/comm3.js";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const ID = "comm3-f26-v1", AID = "audio-ideas";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
const cur = ((await r.json())[0] || {}).data;
const board = boardOf(cur, AID);
const late = Object.entries(board.cards || {}).filter(([, c]) => c.bucket === "revisions-c").map(([n]) => n);
console.log(late.length + " on Completed with Revisions: " + late.join(", "));
let next = cur; const now = Date.now();
late.forEach((name, i) => { next = placeCard(next, AID, name, "late-c", now + i); next = writeCard(next, AID, name, { comment: "" }, now + i); });
next = releasePatch(next, AID, now + late.length, { meetingLink: schedulingLinkOf(comm3) });
const after = late.map(n => { const g = (next.assignmentLog[AID][n] || []).filter(e => e.type === "grade" && e.board).pop(); return n + ": " + g?.letter; });
console.log(after.join("\n"));
if (!write) { console.log("\nNothing written. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error(`write ${ID}: ${w.status}`);
console.log("wrote " + ID);
