// Rename the Sit-Down 1 memo to Scouting Report, point both Sit-Down 1
// assignments at the Sit-Down page, and open them to students.
//
// Andrew, 2026-10-15: "change sit down Memo #1 to Scouting Report ... you
// can open up the Scouting Report and the Sit Down #1." The assignments live
// on the plan row (`<storageKey>-plan`). The Details link goes to
// /comm118/sitdown, the page with the box, so a link turned in on either
// page lands on the memo's log (sitdownAssignment in worktopia/sitdown.js
// takes the first assignment whose Details link ends in /sitdown).
//
//   node scripts/sitdown-assignments.mjs [--class comm118-f26-v1] [--write]
//
// Without --write it prints what would change and writes nothing. With it,
// a backup row is written first, the way add-day-reminder.mjs does.

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
const DETAILS = "https://classes.andrewishak.com/" + classId + "/sitdown";

const CHANGES = {
  "s1-memo": { title: "Scouting Report", opens: "now", opensAt: "", instructionsUrl: DETAILS },
  "s1": { opens: "now", opensAt: "", instructionsUrl: DETAILS },
};

const planKey = classKey + "-plan";
const data = await read(planKey);
if (!data) { console.error(`${planKey}: no row`); process.exit(1); }
const assignments = (data.assignments || []).map(a => CHANGES[a.id] ? { ...a, ...CHANGES[a.id] } : a);
let touched = 0;
(data.assignments || []).forEach((a, i) => {
  if (!CHANGES[a.id]) return;
  touched++;
  console.log(`${a.id}:`);
  Object.entries(CHANGES[a.id]).forEach(([k, v]) => { if (a[k] !== v) console.log(`  ${k}: ${JSON.stringify(a[k])} -> ${JSON.stringify(v)}`); });
  console.log(`  (due ${assignments[i].due} ${assignments[i].dueTime || ""}, weight ${assignments[i].weight}, unchanged)`);
});
if (!touched) { console.error("Neither s1-memo nor s1 is on the plan row. Nothing to do."); process.exit(1); }
if (!write) { console.log("\n(say --write to do it)"); process.exit(0); }

const fresh = await read(planKey);
if (JSON.stringify(fresh) !== JSON.stringify(data)) {
  console.error("\nThe plan changed while this was being worked out. Nothing written. Run it again.");
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
await put(`${planKey}-bak-sitdown-${today}`, data);
await put(planKey, { ...data, assignments });
const after = await read(planKey);
const memo = (after.assignments || []).find(a => a.id === "s1-memo");
const ok = memo?.title === "Scouting Report" && memo?.opens === "now" && memo?.instructionsUrl === DETAILS;
console.log(ok ? `\nWritten. Backup: ${planKey}-bak-sitdown-${today}` : "\nWrite went out but the row does not read back as expected.");
process.exit(ok ? 0 : 1);
