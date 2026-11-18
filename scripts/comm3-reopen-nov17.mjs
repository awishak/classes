// COMM 3, Tuesday, November 17: the audio story reviews are open again and
// close Thursday night, the final project preferences sheet opens, and the
// class gets a card. Andrew, 2026-11-17: "open comments and then keep it
// open until Thursday night now ... and then give people a card. Hey, sorry,
// audio stories, comments were closed, but now they're open. I'll give you
// till Thursday night to do them. Thank you." Then: "also open final project
// preferences."
//
// The review window itself is src/engine/audiostory/reviewmodel.js. This
// writes the rest:
//   plan row   worksheetsOpen["final-prefs"] is true; week w9 says the
//              reviews are due Thursday, in its text and on its item.
//   class row  the class card, his words, standing until Thursday,
//              November 19, at 11:59 PM Pacific.
//
//   esbuild scripts/comm3-reopen-nov17.mjs --bundle --platform=node --format=esm --packages=external --loader:.js=jsx --outfile=node_modules/.reopen.mjs
//   node node_modules/.reopen.mjs           prints
//   node node_modules/.reopen.mjs --write   writes

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
const ID = "comm3-f26-v1", PLAN = "comm3-f26-v1-plan", WEEK = "w9", ITEM = "i-w9-reviews";
const OLD_LINE = "Audio story reviews due Wednesday, November 18.";
const NEW_LINE = "Audio story reviews due Thursday, November 19.";
const CARD = "Hey, sorry, audio story comments were closed, but now they're open. I'll give you until Thursday night to do them. Thank you.";
const UNTIL = Date.parse("2026-11-20T07:59:00Z");

const get = async (id) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H }); if (!r.ok) throw new Error("read " + id + ": " + r.status); return (await r.json())[0].data; };
const put = async (id, data) => { const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }) }); if (!w.ok) throw new Error("write " + id + ": " + w.status + " " + (await w.text()).slice(0, 200)); return (await w.json())[0].data; };

const plan = await get(PLAN);
const week = (plan.schedule || []).find(w => w.id === WEEK);
if (!week) throw new Error("no " + WEEK + " on the plan row");
const text = String(week.text || "");
if (!text.includes(OLD_LINE) && !text.includes(NEW_LINE)) throw new Error("the week's text has changed: " + text);
const nextWeek = { ...week, text: text.replace(OLD_LINE, NEW_LINE), items: (week.items || []).map(it => it.id === ITEM ? { ...it, date: "Thu" } : it) };
const nextPlan = { ...plan, worksheetsOpen: { ...(plan.worksheetsOpen || {}), "final-prefs": true }, schedule: plan.schedule.map(w => w.id === WEEK ? nextWeek : w) };
console.log("final-prefs switch: " + JSON.stringify(plan.worksheetsOpen?.["final-prefs"]) + " -> true");
console.log("week text: " + nextWeek.text);
console.log("week items: " + JSON.stringify(nextWeek.items.map(it => it.date + " " + it.title)));
console.log("card: " + CARD + "\n  until " + new Date(UNTIL).toISOString());
if (!write) { console.log("Nothing written. Say --write to do it."); process.exit(0); }

const planBack = await put(PLAN, nextPlan);
console.log("plan row: final-prefs " + JSON.stringify(planBack.worksheetsOpen["final-prefs"]));
// The class row is the one students write, so it is read and written back in one breath.
const back = await put(ID, setNotice(await get(ID), CARD, UNTIL));
console.log("class row: card " + JSON.stringify(back.notice));
process.exit(0);
