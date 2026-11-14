// The week of November 16 in COMM 3 and COMM 118. Andrew, 2026-11-14: "lock
// on thursday. monday is final project introduction. wednesday is no class,
// work on these two things. friday is no class, have a happy thanksgiving.
// same by the way for comm 118, except they are only working on one thing."
//
// Writes, for each class, on its plan row:
//   - the titles of the three days (dayPlans, the line students read on the
//     schedule). COMM 118's Monday keeps its topic after the new words.
//   - COMM 3: the week's text and topic.
//   - COMM 118: the sheet opens Tuesday, November 17, at 12:00 AM Pacific
//     (worksheetsOpen); the challenge Field Guide topic becomes Final
//     project preferences, due Nov 19 and tied to the sheet; and the week
//     gets its Thursday item.
// and one worksheet_deadlines row a class, so the database refuses every
// save and submit on the preferences sheet after Thursday, November 19,
// 11:59 PM Pacific.
//
//   node scripts/week9-final-prefs-plan.mjs           prints
//   node scripts/week9-final-prefs-plan.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const OPENS = "2026-11-17T00:00:00-08:00";
const DUE_AT = "2026-11-19 23:59:00-08";
const WEEK = "w9";

const read = async (id) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  const d = ((await r.json())[0] || {}).data;
  if (!d) throw new Error("no row " + id);
  return d;
};
const titled = (plans, day, title) => ({ ...plans, [day]: { ...(plans[day] || {}), title } });

const plans = [];

// ─── COMM 3 ───
{
  const id = "comm3-f26-v1-plan", cur = await read(id);
  let dp = cur.dayPlans || {};
  dp = titled(dp, "Nov 16", "Final project introduction.");
  dp = titled(dp, "Nov 18", "No class. Work on your audio story reviews and your final project preferences.");
  dp = titled(dp, "Nov 20", "No class. Have a happy Thanksgiving.");
  const text = "Final project introduction Monday. No class Wednesday or Friday, and no class Thanksgiving week. Audio story reviews due Wednesday, November 18. Final project preferences due Thursday, November 19.";
  const next = { ...cur, dayPlans: dp, schedule: cur.schedule.map(w => (w.id === WEEK ? { ...w, text, topic: "Final project introduction" } : w)) };
  plans.push({ id, cur, next, classId: "comm3" });
}

// ─── COMM 118 ───
{
  const id = "comm118-f26-v1-plan", cur = await read(id);
  let dp = cur.dayPlans || {};
  const monday = String(dp["Nov 16"]?.title || "").replace(/^Final project introduction\.\s*/, "");
  dp = titled(dp, "Nov 16", ("Final project introduction. " + monday).trim());
  dp = titled(dp, "Nov 18", "No class. Work on your final project preferences.");
  dp = titled(dp, "Nov 20", "No class. Have a happy Thanksgiving.");
  // COMM 118 already has the challenge this sheet is: Field Guide topic, due
  // Friday with no link. The challenge is renamed, moved to Thursday and tied
  // to the sheet, the way COMM 3's Final project ideas was.
  const AID = "fg-topic";
  if (!(cur.assignments || []).some(a => a.id === AID)) throw new Error("no " + AID + " on " + id);
  const item = { id: "i-w9-final-prefs", url: "", date: "Thu", type: "assignment", asgId: AID, title: "Final project preferences due" };
  const next = {
    ...cur, dayPlans: dp,
    worksheetsOpen: { ...(cur.worksheetsOpen || {}), "final-prefs": OPENS },
    assignments: cur.assignments.map(a => (a.id === AID ? { ...a, title: "Final project preferences", due: "Nov 19", dueTime: "11:59 PM", instructionsUrl: "/comm118/worksheets/final-prefs" } : a)),
    schedule: cur.schedule.map(w => (w.id === WEEK ? { ...w, items: [...(w.items || []).filter(it => it.id !== item.id), item] } : w)),
  };
  plans.push({ id, cur, next, classId: "comm118" });
}

for (const p of plans) {
  console.log("\n=====", p.id);
  for (const day of ["Nov 16", "Nov 18", "Nov 20"]) console.log(day + ":", JSON.stringify(p.cur.dayPlans?.[day]?.title), "->", JSON.stringify(p.next.dayPlans[day].title));
  const was = p.cur.schedule.find(w => w.id === WEEK), will = p.next.schedule.find(w => w.id === WEEK);
  console.log("text:", JSON.stringify(was.text), "->", JSON.stringify(will.text));
  console.log("topic:", JSON.stringify(was.topic), "->", JSON.stringify(will.topic));
  console.log("items:", (will.items || []).map(it => it.date + " " + it.type + " " + it.title).join(" | "));
  console.log("open:", JSON.stringify(p.cur.worksheetsOpen?.["final-prefs"] ?? null), "->", JSON.stringify(p.next.worksheetsOpen?.["final-prefs"] ?? null));
  console.log("challenges:", p.next.assignments.filter(a => /prefs|final-ideas|fg-topic/.test(a.id)).map(a => JSON.stringify(a)).join("\n"));
  console.log("lock:", JSON.stringify({ worksheet_key: "final-prefs", group_key: p.classId, due_at: DUE_AT }));
}
if (!write) { console.log("\nNothing written. Say --write."); process.exit(0); }
for (const p of plans) {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: p.id, data: p.next, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${p.id}: ${w.status} ${(await w.text()).slice(0, 200)}`);
  console.log("wrote " + p.id);
  const d = await fetch(`${SUPABASE_URL}/rest/v1/worksheet_deadlines?on_conflict=worksheet_key,group_key`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ worksheet_key: "final-prefs", group_key: p.classId, due_at: DUE_AT }),
  });
  const got = d.ok ? await d.json() : [];
  if (!d.ok || got.length !== 1) throw new Error(`deadline ${p.classId}: ${d.status}`);
  console.log("deadline row:", JSON.stringify(got[0]));
}
