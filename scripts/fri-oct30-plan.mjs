// Friday, October 30, COMM 118: the day, as Andrew set it the night before,
// and Monday, November 2, which is the Zoom with Brendan Shanahan and nothing
// else.
//
// Andrew, 2026-10-29: "Let's start with headlines, also looking at a summary
// of their concepts stuff. make the summary really pretty for me. and then
// walk them through their assignment, oh and tell them that they have to
// prepare some questions for brendan shanahan zoom call, and the link will
// be on the class site and emailed to them. just having the zoom call at 9:15
// and that's it. Remind them: energy kinda sucked last time. you need to
// step up and ask questions."
//
// What this writes, on comm118-f26-v1-plan:
//   dayPlans["Oct 30"]   the whole day: the earlier placeholder sections go
//   dayPlans["Nov 2"]    one section: the Zoom at 9:15
//
//   node scripts/fri-oct30-plan.mjs           prints what would change
//   node scripts/fri-oct30-plan.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const ID = "comm118-f26-v1-plan";

const sec = (id, title, time, items) => [id, { title, time, items: items.map(([text, depth], i) => ({ id: id.replace("sec-", "") + "-" + (i + 1), text, ...(depth ? { depth } : {}) })) }];
const day = (title, sections) => ({ title, order: sections.map(s => s[0]), slots: Object.fromEntries(sections) });

const OCT30 = day("Headlines, the concepts, Locker Room, Shanahan on Monday", [
  sec("sec-oct30-headlines", "Headlines", "10 min", [["Headlines, the usual way."]]),
  sec("sec-oct30-concepts", "What the class noticed, thought and wondered", "10 min", [
    ["The summary on the room screen: /comm118/worksheets/team-topics?review&v=summary. The concepts the class picked most, then the questions under the top ones, no names."],
    ["Read a few of the questions aloud and ask who wrote them, if they want to say.", 1],
  ]),
  sec("sec-oct30-lockerroom", "Weekly Challenge 3: Locker Room", "12 min", [
    ["Walk through the assignment on the room screen: /comm118/worksheets/locker-room. Due Tuesday, November 3, 11:59 PM."],
    ["Define culture in your own words first. Then seven weeks as the new head coach: each week something happens, you choose what to do, the players react, and the three numbers move. Trust Coins pay for everything.", 1],
    ["After every week: the question from your own concepts sheet, two to four sentences, with a source. At the end, four questions and the leaderboard.", 1],
    ["Their own concepts set their season, so the question they wrote is the one they answer.", 1],
  ]),
  sec("sec-oct30-shanahan", "Brendan Shanahan on Monday", "8 min", [
    ["Monday is the Zoom call with Brendan Shanahan at 9:15, and that's it. The link will be on the class site and emailed."],
    ["Prepare questions. Everyone comes with questions written down."],
    ["Energy kinda sucked last time. You need to step up and ask questions.", 1],
  ]),
  sec("sec-oct30-out", "Out the door", "2 min", [["Locker Room due Tuesday night. Questions for Shanahan ready for Monday at 9:15."]]),
]);

const NOV2 = day("Guest speaker: Brendan Shanahan", [
  sec("sec-nov2-zoom", "Zoom with Brendan Shanahan, 9:15", "", [
    ["The Zoom link is on the class site and in their email. Students ask the questions they prepared."],
  ]),
]);

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan) { console.error("no plan row"); process.exit(1); }
for (const [d, next] of [["Oct 30", OCT30], ["Nov 2", NOV2]]) {
  const was = plan.dayPlans?.[d];
  console.log(`${d}: "${was?.title || ""}" -> "${next.title}"`);
  next.order.forEach(id => { const s = next.slots[id]; console.log(`  ${s.time ? s.time + "  " : ""}${s.title}`); s.items.forEach(it => console.log("    " + (it.depth ? "  - " : "- ") + it.text)); });
}
if (write) {
  const dayPlans = { ...(plan.dayPlans || {}), "Oct 30": { ...(plan.dayPlans?.["Oct 30"] || {}), ...OCT30 }, "Nov 2": { ...(plan.dayPlans?.["Nov 2"] || {}), ...NOV2 } };
  await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: ID + "-backup-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-"), data: plan, updated_at: new Date().toISOString() }) });
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, dayPlans }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
