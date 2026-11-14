// COMM 3, the week of November 16: the audio story reviews and the final
// project preferences go on the schedule. Andrew, 2026-11-14: "open both on
// tuesday, and make reviews due wednesday and final project preferences due
// thursday."
//
// Writes the plan row comm3-f26-v1-plan only:
//   - worksheetsOpen["final-prefs"] is a time, so the sheet opens to COMM 3
//     on its own Tuesday, November 17, at 12:00 AM Pacific. (The reviews open
//     at the same minute from src/engine/audiostory/reviewmodel.js.)
//   - the challenge final-ideas is renamed Final project preferences, due
//     Nov 19 at 11:59 PM, and tied to the sheet by instructionsUrl.
//   - week w9: its due item moves from Friday to Thursday, a Wednesday item
//     for the reviews is added, and the last sentence of the week's text
//     names both dates.
// No worksheet_deadlines row is written, so the sheet does not lock itself
// on Thursday night.
//
//   node scripts/comm3-week9-plan.mjs           prints
//   node scripts/comm3-week9-plan.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const PLAN = "comm3-f26-v1-plan";
const OPENS = "2026-11-17T00:00:00-08:00";
const AID = "final-ideas", WEEK = "w9";
const ASG = { title: "Final project preferences", due: "Nov 19", dueTime: "11:59 PM", instructionsUrl: "/comm3/worksheets/final-prefs" };
const OLD_LINE = "Final project ideas due Friday, November 20.";
const NEW_LINE = "Audio story reviews due Wednesday, November 18. Final project preferences due Thursday, November 19.";
const REVIEWS = { id: "i-w9-reviews", url: "/comm3/audio-stories", date: "Wed", type: "assignment", title: "Audio story reviews due" };

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${PLAN}: ${r.status}`);
const cur = ((await r.json())[0] || {}).data;
if (!cur) throw new Error("no plan row");
const asg = (cur.assignments || []).find(a => a.id === AID);
const week = (cur.schedule || []).find(w => w.id === WEEK);
if (!asg || !week) throw new Error("no " + AID + " or no " + WEEK + " on the plan row");
if (!String(week.text || "").includes(OLD_LINE) && !String(week.text || "").includes(NEW_LINE)) throw new Error("the week's text has changed: " + week.text);

const items = (week.items || []).map(it => (it.asgId === AID ? { ...it, date: "Thu", title: "Final project preferences due" } : it)).filter(it => it.id !== REVIEWS.id);
const at = items.findIndex(it => it.asgId === AID);
items.splice(at < 0 ? items.length : at, 0, REVIEWS);
const next = {
  ...cur,
  worksheetsOpen: { ...(cur.worksheetsOpen || {}), "final-prefs": OPENS },
  assignments: cur.assignments.map(a => (a.id === AID ? { ...a, ...ASG } : a)),
  schedule: cur.schedule.map(w => (w.id === WEEK ? { ...w, text: String(w.text).replace(OLD_LINE, NEW_LINE), items } : w)),
};
const pick = (a) => ({ title: a.title, due: a.due, dueTime: a.dueTime, instructionsUrl: a.instructionsUrl });
console.log("open now:", JSON.stringify(cur.worksheetsOpen?.["final-prefs"] ?? null), "\nopen to: ", JSON.stringify(OPENS));
console.log("challenge now:", JSON.stringify(pick(asg)), "\nchallenge to: ", JSON.stringify(pick(next.assignments.find(a => a.id === AID))));
console.log("week now:", JSON.stringify({ text: week.text, items: week.items }, null, 1), "\nweek to: ", JSON.stringify({ text: next.schedule.find(w => w.id === WEEK).text, items }, null, 1));
console.log("dueCards:", JSON.stringify(cur.dueCards).slice(0, 400));
if (!write) { console.log("\nNothing written. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
  method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
  body: JSON.stringify({ id: PLAN, data: next, updated_at: new Date().toISOString() }),
});
if (!w.ok) throw new Error(`write ${PLAN}: ${w.status} ${(await w.text()).slice(0, 200)}`);
const back = (await w.json())[0]?.data;
console.log("wrote " + PLAN + ": open " + back?.worksheetsOpen?.["final-prefs"] + ", " + back?.assignments?.find(a => a.id === AID)?.due);
