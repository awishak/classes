// The audio story reviews and both Final project preferences sheets are due
// Friday, November 20, at 11:59 PM. Andrew, 2026-11-17: "Change all three of
// those deadlines to Friday night. and make the cards say so."
//
// The review window itself is src/engine/audiostory/reviewmodel.js. This
// writes the rest:
//   worksheet_deadlines  final-prefs for comm3 and comm118, the lock the
//                        database enforces, moves to Friday 11:59 PM Pacific.
//   comm3 plan row       the Final project preferences challenge is due
//                        Nov 20; week w9 says Friday, in its text and on
//                        both of its due items.
//   comm118 plan row     the Final project preferences challenge is due
//                        Nov 20, and week w9's due item is on Friday.
//   comm3 class row      the class card says Friday night and stands until
//                        then.
//
//   esbuild scripts/comm3-comm118-friday-nov20.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.friday.mjs
//   node node_modules/.friday.mjs           prints
//   node node_modules/.friday.mjs --write   writes

import { readFileSync } from "node:fs";
import { setNotice } from "../src/engine/notice.js";

const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const DUE = "2026-11-21T07:59:00Z";
const CARD = "Hey, sorry, audio story comments were closed, but now they're open. I'll give you until Friday night to do them. Thank you.";
const OLD_TEXT = "Audio story reviews due Thursday, November 19. Final project preferences due Thursday, November 19.";
const NEW_TEXT = "Audio story reviews due Friday, November 20. Final project preferences due Friday, November 20.";
const CLASSES = [
  { plan: "comm3-f26-v1-plan", aid: "final-ideas", items: ["i-w9-reviews", "i-w9-11"], text: true },
  { plan: "comm118-f26-v1-plan", aid: "fg-topic", items: ["i-w9-final-prefs"], text: false },
];

const get = async (id) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H }); if (!r.ok) throw new Error("read " + id + ": " + r.status); return (await r.json())[0].data; };
const put = async (id, data) => { const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }) }); if (!w.ok) throw new Error("write " + id + ": " + w.status + " " + (await w.text()).slice(0, 200)); return (await w.json())[0].data; };

const next = [];
for (const c of CLASSES) {
  const plan = await get(c.plan);
  const asg = (plan.assignments || []).find(a => a.id === c.aid), week = (plan.schedule || []).find(w => w.id === "w9");
  if (!asg || !week) throw new Error(c.plan + ": no " + c.aid + " or no w9");
  const have = (week.items || []).filter(it => c.items.includes(it.id)).length;
  if (have !== c.items.length) throw new Error(c.plan + ": w9 has " + have + " of " + c.items.length + " due items");
  const text = String(week.text || "");
  if (c.text && !text.includes(OLD_TEXT) && !text.includes(NEW_TEXT)) throw new Error("the week's text has changed: " + text);
  const nextWeek = { ...week, text: c.text ? text.replace(OLD_TEXT, NEW_TEXT) : week.text, items: week.items.map(it => c.items.includes(it.id) ? { ...it, date: "Fri" } : it) };
  next.push({ id: c.plan, data: { ...plan, assignments: plan.assignments.map(a => a.id === c.aid ? { ...a, due: "Nov 20" } : a), schedule: plan.schedule.map(w => w.id === "w9" ? nextWeek : w) } });
  console.log(c.plan + ": " + asg.title + " due " + asg.due + " -> Nov 20");
  if (c.text) console.log("  week text: " + nextWeek.text);
  console.log("  week items: " + JSON.stringify(nextWeek.items.filter(it => c.items.includes(it.id)).map(it => it.date + " " + it.title)));
}
const dl = await fetch(`${SUPABASE_URL}/rest/v1/worksheet_deadlines?worksheet_key=eq.final-prefs&select=*`, { headers: H }).then(r => r.json());
console.log("deadlines: " + JSON.stringify(dl.map(d => d.group_key + " " + d.due_at)) + " -> " + DUE);
console.log("card: " + CARD + "\n  until " + DUE);
if (!write) { console.log("Nothing written. Say --write to do it."); process.exit(0); }

const w = await fetch(`${SUPABASE_URL}/rest/v1/worksheet_deadlines?worksheet_key=eq.final-prefs&group_key=in.(comm3,comm118)`, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ due_at: DUE }) });
if (!w.ok) throw new Error("deadlines: " + w.status + " " + (await w.text()).slice(0, 200));
const rows = await w.json();
if (rows.length !== 2) throw new Error("deadlines: wrote " + rows.length + " rows, expected 2");
console.log("deadlines now: " + JSON.stringify(rows.map(d => d.group_key + " " + d.due_at)));
for (const n of next) { const back = await put(n.id, n.data); console.log(n.id + ": due " + back.assignments.find(a => /final-ideas|fg-topic/.test(a.id)).due); }
// The class row is the one students write, so it is read and written back in one breath.
const back = await put("comm3-f26-v1", setNotice(await get("comm3-f26-v1"), CARD, Date.parse(DUE)));
console.log("comm3 class row: card " + JSON.stringify(back.notice));
process.exit(0);
