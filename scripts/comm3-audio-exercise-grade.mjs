// Grade COMM 3's Audio exercise (ex5) from the TA mode sort and release.
// Andrew, 2026-11-06: "ok grade the audio exercise and release. let's forget
// about examining their audio for now. the 11 shut out need it to be
// reopened and let them know with a card." Then: deadline Sunday; the eleven
// stay Not submitted with the card; he marks the three late ideas sheets
// himself before this runs.
//
// Places every student's card the way Grade Flow does (grades.js placeCard,
// writeCard), then releases (releasePatch, with the meeting link the way the
// Release button sends it). Late but complete carries no comment, the way
// the ideas release ended up. The eleven, read off their live review rows:
// one with nothing approved gets the reopen flag on the row (ideas.jsx
// reopenOf) and card A; one he has since approved an idea for gets card B,
// since the gate opens by itself; one with no review row stops the script.
//
//   node scripts/comm3-audio-exercise-grade.mjs private/ta-mode/graded_ex.json           prints
//   node scripts/comm3-audio-exercise-grade.mjs private/ta-mode/graded_ex.json --write   writes
//
// Bundle first (grades.js is JSX-adjacent ESM):
//   esbuild scripts/comm3-audio-exercise-grade.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.grade-ex.mjs && node node_modules/.grade-ex.mjs ...

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
if (!file) { console.error("Say which graded_ex.json."); process.exit(1); }
const ID = "comm3-f26-v1";
const PLAN = "comm3-f26-v1-plan";
const AID = "ex5";
const GROUP = "comm3";
const IDEAS_KEY = "audio-ideas";
const BUCKET_ID = { "Complete": "complete", "Late but complete": "late-c", "Not submitted": "notsubmitted" };
const DUE = "Sunday, November 8, at 11:59 PM";
// The eleven shut out with no approved idea when the exercise was due.
const ELEVEN = ["Alejandro Lopez jimenez", "Avery Lotuff", "Bruno Der", "Caelin Darrow", "Dillon Boszhardt", "Lucy Marashian", "Marcus Chin", "Raima Falor", "Sofie Collet", "Whitaker Tollmann", "Zeina Stallings Jaber"];
// Card A: still nothing approved, reopened with the flag. Card B: an idea of theirs is approved now.
const CARD_A = "The audio exercise is reopened for you. No idea on your ideas sheet was approved, so the exercise was shut. You can now choose any of your three ideas on the exercise sheet and finish it by " + DUE + ".";
const CARD_B = "The audio exercise is reopened for you. No idea on your ideas sheet was approved when the exercise was due. One is approved now. Choose an approved idea on the exercise sheet and finish it by " + DUE + ".";
const GOOD = new Set(["top", "ok"]);

const rows = JSON.parse(readFileSync(file, "utf8"));
const plan = rows.map(r => ({ name: r.name, bucket: r.bucket, comment: "" }));
ELEVEN.forEach(n => { const p = plan.find(p => p.name === n); if (!p) throw new Error(n + " is not in the sort"); if (p.bucket !== "Not submitted") throw new Error(n + " is " + p.bucket + ", not Not submitted"); });
plan.forEach(p => { if (!BUCKET_ID[p.bucket]) throw new Error(p.name + ": no bucket id for " + p.bucket); });
if (!COMPLETE_BUCKETS.find(b => b.id === "late-c")) throw new Error("bucket ids changed");

const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`read ${q}: ${r.status}`); return r.json(); };
const cur = ((await get(`app_data?id=eq.${ID}&select=data`))[0] || {}).data;
if (!cur) throw new Error("no class row");
const roster = ((await get(`app_data?id=eq.${PLAN}&select=data`))[0] || {}).data?.students || [];
const emailOf = (name) => { const s = roster.find(s => s.name === name); if (!s?.email) throw new Error("no email on the plan roster for " + name); return s.email.trim().toLowerCase(); };

// The eleven's ideas sheets and review rows decide the card and the flag.
const eleven = ELEVEN.map(name => ({ name, email: emailOf(name) }));
const sheets = await get(`worksheet_sheets?worksheet_key=eq.${IDEAS_KEY}&group_key=eq.${GROUP}&viewer_id=in.(${eleven.map(e => '"' + e.email + '"').join(",")})&select=id,viewer_id`);
eleven.forEach(e => { e.sheet = sheets.find(s => s.viewer_id.toLowerCase() === e.email)?.id; if (!e.sheet) throw new Error("no ideas sheet for " + e.name); });
const reviews = await get(`worksheet_reviews?sheet_id=in.(${eleven.map(e => e.sheet).join(",")})&select=sheet_id,status,note`);
eleven.forEach(e => { e.review = reviews.find(r => r.sheet_id === e.sheet) || null; });
const marksIn = (note) => { try { const n = JSON.parse(note || "{}"); return ["a", "b", "c"].filter(s => n[s]).map(s => n[s]); } catch { return []; } };
const stop = [];
eleven.forEach(e => {
  const marks = marksIn(e.review?.note);
  e.approved = marks.some(m => GOOD.has(m));
  e.flag = !!e.review && !e.approved;
  if (!e.review) stop.push(e.name + ": no review row, nothing marked; mark the ideas sheet first");
  plan.find(p => p.name === e.name).comment = e.approved ? CARD_B : CARD_A;
  console.log(`  ${e.name.padEnd(26)} ${e.email.padEnd(28)} ${(e.review?.status || "no review").padEnd(10)} ${(marks.join(",") || "-").padEnd(18)} ${e.flag ? "reopen flag, card A" : e.approved ? "approved, card B" : ""}`);
});
if (stop.length) { console.error("\nNot running:\n  " + stop.join("\n  ")); process.exit(1); }
const counts = {};
plan.forEach(p => { counts[p.bucket] = (counts[p.bucket] || 0) + 1; });
console.log("\n" + Object.entries(counts).map(([b, n]) => n + " " + b).join(", "));
plan.filter(p => p.bucket !== "Complete").forEach(p => console.log(`  ${p.bucket.padEnd(18)} ${p.name}${p.comment ? "  · card " + (p.comment === CARD_A ? "A" : "B") : ""}`));

let next = cur;
const now = Date.now();
plan.forEach((p, i) => {
  next = placeCard(next, AID, p.name, BUCKET_ID[p.bucket], now + i);
  if (p.comment) next = writeCard(next, AID, p.name, { comment: p.comment }, now + i);
});
next = releasePatch(next, AID, now + plan.length, { meetingLink: schedulingLinkOf(comm3) });
const log = next.assignmentLog[AID];
const grades = plan.map(p => { const g = (log[p.name] || []).filter(e => e.type === "grade" && e.board).pop(); return [p.name, g?.letter, g?.html ? "comment" : ""]; });
console.log("\nafter release:", grades.filter(g => g[1]).length, "grade entries;", grades.filter(g => !g[1]).map(g => g[0]).join(", ") || "everyone has one", ";", grades.filter(g => g[2]).length, "with a comment");

if (!write) { console.log("\nNothing written. Say --write to flag " + eleven.filter(e => e.flag).length + ", place and release."); process.exit(0); }
for (const e of eleven.filter(e => e.flag)) {
  const note = JSON.stringify({ ...JSON.parse(e.review.note || "{}"), reopen: true });
  const r = await fetch(`${SUPABASE_URL}/rest/v1/worksheet_reviews?sheet_id=eq.${e.sheet}`, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ note }) });
  const got = r.ok ? await r.json() : [];
  if (!r.ok || got.length !== 1) throw new Error(`reopen ${e.name}: ${r.status} ${got.length} rows`);
  console.log("reopened " + e.name);
}
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
  method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
  body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }),
});
if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${(await w.text()).slice(0, 200)}`);
console.log("wrote " + ID + ": released " + grades.filter(g => g[1]).length + " grades on " + AID);
