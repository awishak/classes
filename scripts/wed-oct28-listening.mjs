// Wednesday, October 28, COMM 3: what the day was, in the schedule.
//
// Andrew, 2026-10-28: "today for comm 3, we did intentional listening to
// music. students partnered up by genre and listened to a song that their
// partner liked. it was a fantastic idea for understanding the idea of making
// an engaging audio story. Rhythm, Dynamism, layering, components, etc.
// please put that in my schedule."
//
// What this writes, on comm3-f26-v1-plan:
//   dayPlans["Oct 28"].title              the day's name on the schedule
//   the "What makes for good listening"   a row under "Think pair share great
//   section of the day                    songs" saying what was done
//
//   node scripts/wed-oct28-listening.mjs           prints what would change
//   node scripts/wed-oct28-listening.mjs --write   writes
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
const DAY = "Oct 28";
const SECTION = "sec-mvs8mj18khf0i";   // "What makes for good listening"
const ROW_ID = "c3-oct28-listening";
const TITLE = "Audio story introduction. Intentional listening to music.";
const ROW = "Intentional listening to music. Students partnered up by genre and listened to a song their partner liked. A fantastic way into understanding what makes an engaging audio story: rhythm, dynamism, layering, components.";

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan) { console.error("no plan row"); process.exit(1); }

const day = plan.dayPlans?.[DAY];
const slot = day?.slots?.[SECTION];
if (!day || !slot) { console.error("Oct 28 or its listening section is missing"); process.exit(1); }
console.log(`${DAY} title: "${day.title}" -> "${TITLE}"`);
const items = slot.items.filter(it => it.id !== ROW_ID);
const at = items.findIndex(it => it.id === "mvs8mw78t0qb4") + 1;   // after "Think pair share great songs"
items.splice(at, 0, { id: ROW_ID, text: ROW, depth: 0 });
console.log(`"${slot.title}" rows:`); items.forEach(it => console.log("  - " + it.text));

if (write) {
  const dayPlans = { ...plan.dayPlans, [DAY]: { ...day, title: TITLE, slots: { ...day.slots, [SECTION]: { ...slot, items } } } };
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, dayPlans }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
