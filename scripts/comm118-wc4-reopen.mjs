// COMM 118: Turkey Bowl is reopened through Thanksgiving Day, with a card
// that says so. Andrew, 2026-11-21, after the challenge read "Not open yet"
// for the three days the game was open: "lets reopen it through thanksgiving
// day. and put a card on the front page to let them know that. my mistake
// sorry class, enjoy it with your families."
//
// Plan row: wc4 is due Thursday, November 26, 11:59 PM.
// Class row: the class's notice card, his words, down after that moment.
// The game never writes a hand-in, so comm118-wc4-turkey-bowl-submits.mjs
// has to be run again after Thanksgiving for whoever plays this week.
//
//   node scripts/comm118-wc4-reopen.mjs           prints
//   node scripts/comm118-wc4-reopen.mjs --write   writes

import { readFileSync } from "node:fs";

const ROW = "comm118-f26-v1", PLAN = ROW + "-plan", AID = "wc4";
const DUE = "Nov 26", DUE_TIME = "11:59 PM";
const UNTIL = Date.parse("2026-11-27T07:59:59.000Z");   // 11:59 PM Pacific on Thanksgiving Day
const TEXT = "Turkey Bowl is open again through Thanksgiving Day. My mistake, sorry class. Enjoy it with your families.";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const get = async (id) => ((await (await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H })).json())[0] || {}).data;
const put = async (id, data) => {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }) });
  if (!w.ok) throw new Error("write " + id + ": " + w.status);
  return (await w.json())[0].data;
};
// The id notice.js gives a card: the deadline and the words together.
const noticeId = (text, until) => String(until || 0) + ":" + text.trim().length + ":" + [...text.trim()].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36);

const plan = await get(PLAN), base = await get(ROW);
const asg = (plan.assignments || []).find(a => a.id === AID);
if (!asg) throw new Error("no wc4");
console.log(`wc4 due: ${asg.due} ${asg.dueTime} -> ${DUE} ${DUE_TIME} (opens: ${asg.opens})`);
const live = base.notice && String(base.notice.text || "").trim() && !(base.notice.until && Date.now() > base.notice.until) ? base.notice : null;
if (live) { console.log("A class card is live now and this would replace it:\n  " + live.text); if (!process.argv.includes("--replace")) { console.log("Stopped. Add --replace to put the new card over it."); process.exit(1); } }
console.log("card: " + TEXT);
console.log("card comes down: " + new Date(UNTIL).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) + " Pacific");
if (!write) { console.log("\nNothing written. Say --write."); process.exit(0); }

const freshPlan = await get(PLAN);
const backPlan = await put(PLAN, { ...freshPlan, assignments: freshPlan.assignments.map(a => (a.id === AID ? { ...a, due: DUE, dueTime: DUE_TIME, opens: "now" } : a)) });
const b = backPlan.assignments.find(a => a.id === AID);
console.log(`wrote ${PLAN}: wc4 due ${b.due} ${b.dueTime}`);
const fresh = await get(ROW);
const back = await put(ROW, { ...fresh, notice: { id: noticeId(TEXT, UNTIL), text: TEXT, until: UNTIL } });
console.log(`wrote ${ROW}: card "${back.notice.text}"`);
