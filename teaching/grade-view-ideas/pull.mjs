// Read-only pull of one class's two rows, summarised for the grade dashboard mockups.
// node pull.mjs comm3-f26-v1
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = "/Users/ishak/Projects/classes/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key };
const read = async (id) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data,updated_at`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  const row = (await r.json())[0];
  return row ? row.data : null;
};

const sk = process.argv[2] || "comm3-f26-v1";
const cls = await read(sk);
const plan = await read(sk + "-plan");
const data = { ...(cls || {}), ...(plan || {}) };

const sizes = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, JSON.stringify(v).length]));
console.log("CLASS ROW KEYS", sizes(cls));
console.log("PLAN ROW KEYS", sizes(plan));

const students = data.students || [];
console.log("\nSTUDENTS", students.length, "sections", [...new Set(students.map(s => s.section))]);
console.log("student shape", JSON.stringify(students[0] || {}).slice(0, 300));

const asgs = data.assignments || [];
console.log("\nASSIGNMENTS", asgs.length);
const fmt = (ts) => Number.isFinite(ts) && ts ? new Date(ts).toISOString().slice(0, 16) : "";
const out = { students: students.map(s => ({ name: s.name, section: s.section || "" })), assignments: [] };
for (const a of asgs) {
  const logs = data.assignmentLog?.[a.id] || {};
  const board = data.gradeBoard?.[a.id] || {};
  const subs = [];
  let comments = 0, studentMsgs = 0, regrades = 0;
  for (const [name, log] of Object.entries(logs)) {
    const live = (log || []).filter(e => !e.deleted);
    const s = live.filter(e => e.type === "submission");
    if (s.length) subs.push({ name, first: s[0].ts, last: s[s.length - 1].ts, n: s.length, link: !!s.some(e => e.link) });
    comments += live.filter(e => e.type === "comment" && e.from !== "student").length;
    studentMsgs += live.filter(e => e.type === "comment" && e.from === "student").length;
    regrades += live.filter(e => e.type === "regrade").length;
  }
  const buckets = {};
  for (const c of Object.values(board.cards || {})) if (c.bucket) buckets[c.bucket] = (buckets[c.bucket] || 0) + 1;
  const row = { id: a.id, title: a.title, due: a.due, dueTime: a.dueTime, scale: a.scale || "letters", weight: a.weight, details: a.detailsUrl || a.instructionsUrl || a.link || "",
    submitted: subs.length, firstIn: fmt(Math.min(...subs.map(s => s.first))), lastIn: fmt(Math.max(...subs.map(s => s.last))),
    buckets, released: fmt(board.released?.at), seen: Object.keys(board.seen || {}).length, comments, studentMsgs, regrades,
    subs: subs.map(s => ({ name: s.name, at: s.first, last: s.last, n: s.n })),
    cards: Object.fromEntries(Object.entries(board.cards || {}).map(([n, c]) => [n, c.bucket || null])) };
  out.assignments.push(row);
  console.log(`\n- ${a.id} | ${a.title} | due ${a.due} ${a.dueTime || ""} | ${row.scale} | w${a.weight}`);
  console.log(`  submitted ${subs.length}/${students.length}  first ${row.firstIn}  last ${row.lastIn}  buckets ${JSON.stringify(buckets)}  released ${row.released || "no"}  seen ${row.seen}  comments ${comments}  studentMsgs ${studentMsgs}  regrades ${regrades}`);
}
// other keys of interest
const log = data.log || [];
console.log("\nGAME LOG entries", log.length, "sample", JSON.stringify(log[0] || {}).slice(0, 300));
console.log("GAMES", Object.keys(data.games || {}).length);
console.log("THREADS", Object.keys(data.threads || {}).length, "msgs", Object.values(data.threads || {}).reduce((n, t) => n + t.length, 0));
console.log("BOARDS keys", Object.keys(data.boards || {}).slice(0, 10), "posts", JSON.stringify(data.boards || {}).length);
console.log("CHECKINS", Object.keys(data.checkins || {}).length);
console.log("ATTENDANCE", JSON.stringify(data.attendance || {}).slice(0, 300));
console.log("WORKSHEETS keys", Object.keys(data).filter(k => /work|sheet|sitdown|visual|story|3x5|three/i.test(k)));
console.log("PROFILES", Object.keys(data.profiles || {}).length);
out.gameLog = log.map(e => ({ studentId: e.studentId, ts: e.ts, pts: e.points ?? e.pts ?? e.score, type: e.type, week: e.week }));
out.threads = Object.fromEntries(Object.entries(data.threads || {}).map(([n, t]) => [n, t.map(m => ({ from: m.from, ts: m.ts, kind: m.kind || "text" }))]));
out.boards = data.boards || null;
out.attendance = data.attendance || null;
out.checkins = data.checkins || null;
writeFileSync(new URL("./comm3-summary.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("\nwrote comm3-summary.json");

// per-student engagement: comments they posted on assignments, regrades, profile fields filled, check-in answered, photo
const eng = {};
for (const s of students) {
  const name = s.name;
  let comments = 0, regrades = 0, appreciated = 0;
  for (const a of asgs) {
    const live = (data.assignmentLog?.[a.id]?.[name] || []).filter(e => !e.deleted);
    comments += live.filter(e => e.type === "comment" && e.from === "student").length;
    regrades += live.filter(e => e.type === "regrade").length;
  }
  const prof = data.profiles?.[name] || {};
  const fields = ["email","avatar","about","year","hometown","motto","goals","priority","strength"].filter(f => String(prof[f] || "").trim()).length;
  const checkin = !!data.checkins?.["checkin-4"]?.[name];
  const seen = Object.values(data.gradeSeen || {}).filter(m => m[name]).length;
  eng[name] = { comments, regrades, profileFields: fields, photo: prof.avatar === "photo", checkin, gradesSeen: seen };
}
out.engagement = eng;
writeFileSync(new URL("./comm3-summary.json", import.meta.url), JSON.stringify(out, null, 1));
console.log("engagement sample", JSON.stringify(Object.entries(eng).slice(0, 3)));
console.log("profile complete", Object.values(eng).filter(e => e.profileFields >= 9).length, "photo", Object.values(eng).filter(e => e.photo).length, "checkin", Object.values(eng).filter(e => e.checkin).length, "commented", Object.values(eng).filter(e => e.comments > 0).length);
