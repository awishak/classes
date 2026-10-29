// Weekly Challenge 3 becomes Locker Room: a new title, the Details link, and
// Tuesday, November 3. Andrew, 2026-10-29: "let's change the coach interview
// to something fun and interactive like a worksheet or game ... the due
// date's going to be November 3rd, Tuesday ... we'll keep it as the weekly
// challenge, number three." The assignment stays closed to students
// (opens: never) until he opens it on the dashboard, the way the worksheet
// stays COMM 999's until the Worksheets page switch.
//
//   node scripts/takeover-assignment.mjs [--class comm118-f26-v1] [--title "Weekly Challenge 3: Takeover"] [--write]
//
// Without --write it prints what would change and writes nothing. With it,
// a backup row is written first, the way sitdown-assignments.mjs does.

import { readFileSync } from "node:fs";

const SUPABASE_URL = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8")
  .match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };

const read = async (id) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  return ((await r.json())[0] || {}).data ?? null;
};
const put = async (id, data) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`write ${id}: ${r.status} ${(await r.text()).slice(0, 200)}`);
};

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : ""; };
const write = args.includes("--write");
const classKey = flag("class") || "comm118-f26-v1";
const classId = classKey.split("-")[0];
const title = flag("title") || "Weekly Challenge 3: Locker Room";
const DETAILS = "https://classes.andrewishak.com/" + classId + "/worksheets/locker-room";

const CHANGES = {
  wc3: { title, due: "Nov 3", dueTime: "11:59 PM", instructionsUrl: DETAILS, description: "Take over a team. Six weeks, a different situation every week, your classmates as the players." },
};

const planKey = classKey + "-plan";
const data = await read(planKey);
if (!data) { console.error(`${planKey}: no row`); process.exit(1); }
let touched = 0;
const assignments = (data.assignments || []).map(a => {
  if (!CHANGES[a.id]) return a;
  touched++;
  const next = { ...a, ...CHANGES[a.id] };
  Object.keys(CHANGES[a.id]).forEach(k => { if (a[k] !== next[k]) console.log(`${a.id}.${k}: ${JSON.stringify(a[k])} -> ${JSON.stringify(next[k])}`); });
  return next;
});
if (!touched) { console.error("wc3 is not on the plan row"); process.exit(1); }
if (!write) { console.log("\nDry run. Add --write to save."); process.exit(0); }
await put(planKey + "-backup-" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-"), data);
await put(planKey, { ...data, assignments });
console.log("Saved to " + planKey + ".");
