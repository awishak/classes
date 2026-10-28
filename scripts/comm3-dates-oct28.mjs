// COMM 3's assignments, moved back, from October 28.
//
// Andrew, 2026-10-28, by voice: final project Friday, December 11; final
// pre-production Friday, December 4, "I want to give people the whole finals
// week to work on this"; audio story Sunday, November 15; final project ideas
// Friday, November 20; audio story pre-production Friday, November 6; audio
// exercise Monday, November 2; "cut the characters exercise."
//
// What this writes, on comm3-f26-v1-plan:
//   assignments     the due dates, ex4 removed, final-ideas added (weight 0,
//                   complete scale, the pre-productions' shape)
//   schedule        each assignment row under the week its new date is in,
//                   and the week texts' dates (his sentences, dates changed)
//   dayPlans        the four day titles that said when a pre-production or
//                   the final was due
//
//   node scripts/comm3-dates-oct28.mjs           prints what would change
//   node scripts/comm3-dates-oct28.mjs --write   writes
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const ID = "comm3-f26-v1-plan";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan || !Array.isArray(plan.assignments)) { console.error("no plan row, or assignments is not a list"); process.exit(1); }

// Assignments.
const DUE = { "audio-pre": "Nov 6", ex5: "Nov 2", audio: "Nov 15", "final-pre": "Dec 4", final: "Dec 11" };
const assignments = plan.assignments.filter(a => a.id !== "ex4").map(a => (DUE[a.id] ? { ...a, due: DUE[a.id] } : a));
const ex4 = plan.assignments.find(a => a.id === "ex4");
console.log("assignments:");
plan.assignments.forEach(a => { if (DUE[a.id]) console.log(`  ${a.title}: ${a.due} -> ${DUE[a.id]}`); });
console.log(ex4 ? `  removed: ${ex4.title} (was due ${ex4.due})` : "  ex4 already gone");
if (!assignments.some(a => a.id === "final-ideas")) {
  const pre = plan.assignments.find(a => a.id === "final-pre");
  assignments.splice(assignments.findIndex(a => a.id === "final-pre"), 0, { ...pre, id: "final-ideas", title: "Final project ideas", due: "Nov 20", weight: 0, rubric: [], description: "", instructionsUrl: "" });
  console.log("  added: Final project ideas, due Nov 20 11:59 PM, complete, weight 0");
}

// Schedule rows and week text.
const weeks = plan.schedule.map(w => ({ ...w, items: [...(w.items || [])] }));
const week = (id) => weeks.find(w => w.id === id);
const take = (fromId, itemId) => { const w = week(fromId); const i = w.items.findIndex(it => it.id === itemId); if (i < 0) return null; return w.items.splice(i, 1)[0]; };
const put = (toId, item, date) => { if (!item) return; week(toId).items = week(toId).items.filter(it => it.id !== item.id); week(toId).items.push({ ...item, date }); console.log(`  ${item.title} -> ${toId} ${date}`); };
console.log("schedule rows:");
weeks.forEach(w => { const n = w.items.length; w.items = w.items.filter(it => it.asgId !== "ex4"); if (w.items.length < n) console.log(`  Characters exercise row removed from ${w.id}`); });
put("w7", take("w6", "i-w6-7"), "Mon");
put("w7", take("w6", "i-w6-6"), "Fri");
put("w8", take("w7", "i-w7-8"), "Sun");
if (!week("w9").items.some(it => it.asgId === "final-ideas")) put("w9", { id: "i-w9-11", url: "", type: "assignment", asgId: "final-ideas", libId: "lib-w9-11", title: "Final project ideas due" }, "Fri");
// The library row the schedule row points at, the shape of lib-w6-6.
const libRow = { id: "lib-w9-11", url: "", type: "assignment", title: "Final project ideas due" };
let library = plan.library;
if (Array.isArray(library)) { if (!library.some(b => b.id === libRow.id)) library = [...library, libRow]; }
else if (library && typeof library === "object" && !library[libRow.id]) library = { ...library, [libRow.id]: libRow };
put("w10", take("w10", "i-w10-9"), "Fri");
put("w11", take("w11", "i-w11-10"), "Fri");

const TEXT = {
  w6: [/ Audio story pre-production due Friday\. Exercise due Sunday, November 1\./, " Exercise due Monday, November 2."],
  w7: [/ Audio story due Sunday, November 8\./, " Audio exercise due Monday, November 2. Audio story pre-production due Friday, November 6."],
  w8: [/ Groups form Wednesday\.$/, " Groups form Wednesday. Audio story due Sunday, November 15."],
  w9: [/ Groups work on the final\.$/, " Groups work on the final. Final project ideas due Friday, November 20."],
  w10: [/ Groups present Wednesday and submit pre-production that night\. Friday is a workshop\./, " Groups present Wednesday. Friday is a workshop, and pre-production is due that night."],
  w11: [/Final project due Wednesday, December 9\./, "Final project due Friday, December 11."],
};
console.log("week text:");
for (const [id, [from, to]] of Object.entries(TEXT)) {
  const w = week(id);
  if (!from.test(w.text)) { console.log(`  ${id}: pattern not found, left as is: "${w.text}"`); continue; }
  w.text = w.text.replace(from, to);
  console.log(`  ${id}: "${w.text}"`);
}

// Day titles.
const TITLES = {
  "Oct 30": ["Workshop for the audio story. Pre-production due.", "Workshop for the audio story."],
  "Nov 6": ["Workshop for the audio story.", "Workshop for the audio story. Pre-production due."],
  "Dec 2": ["Groups present their story to the class. Pre-production due tonight.", "Groups present their story to the class."],
  "Dec 4": ["Workshop for the final.", "Workshop for the final. Pre-production due tonight."],
  "Dec 9": ["Final project due.", "Final project due Friday, December 11."],
};
const dayPlans = { ...plan.dayPlans };
console.log("day titles:");
for (const [d, [from, to]] of Object.entries(TITLES)) {
  const was = dayPlans[d]?.title;
  if (was !== from) { console.log(`  ${d}: expected "${from}", found "${was}", left as is`); continue; }
  dayPlans[d] = { ...dayPlans[d], title: to };
  console.log(`  ${d}: "${from}" -> "${to}"`);
}

if (write) {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, assignments, schedule: weeks, dayPlans, library }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
