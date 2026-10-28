// Open the visual story for every COMM 3 student who has not submitted it.
//
// Andrew, 2026-10-28: "students need to be able to submit their visual story
// if they haven't."
//
// The lock lives in the database (sql/visual-story-portal.sql): a sheet is
// locked past the due date unless worksheet_unlocks has a row for it with an
// `until` still ahead. So this gives each unsubmitted student that row. A
// student on the roster with no sheet yet gets one made first, since the
// unlock hangs off the sheet. Submitted stories are left locked. The student's
// page already reads the unlock and says "Dr. Ishak unlocked your story until
// ...", and the Visual stories review page has Lock again per student.
//
//   node scripts/visual-story-open-unsubmitted.mjs                   prints
//   node scripts/visual-story-open-unsubmitted.mjs --write           writes
//   node scripts/visual-story-open-unsubmitted.mjs --until <ISO>     another end
//
// Default end: Sunday, November 1, 11:59 PM Pacific.
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const argv = process.argv.slice(2);
const write = argv.includes("--write");
const UNTIL = argv.includes("--until") ? argv[argv.indexOf("--until") + 1] : "2026-11-02T07:59:00+00:00";
const KEY = "visual-story", GROUP = "comm3", PLAN = "comm3-f26-v1-plan";
const ME = "andrewishak@gmail.com";

const get = async (path) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: H }); if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); };
const post = async (path, body, prefer = "return=representation") => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "POST", headers: { ...H, Prefer: prefer }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json();
};
const email = (s) => String(s || "").trim().toLowerCase();

const roster = ((await get(`app_data?id=eq.${PLAN}&select=data`))[0]?.data?.students || [])
  .filter(s => s.email && !/@(practice|example)\.test$/.test(s.email) && !/lurker/i.test(s.name || ""));
const sheets = await get(`worksheet_sheets?worksheet_key=eq.${KEY}&group_key=eq.${GROUP}&select=id,viewer_id,submitted_at`);
const unlocks = await get(`worksheet_unlocks?select=sheet_id,until`);
const sheetOf = new Map(sheets.map(s => [email(s.viewer_id), s]));
const unlockOf = new Map(unlocks.map(u => [u.sheet_id, u.until]));
const nameOf = new Map(roster.map(s => [email(s.email), s.name]));

const noSheet = roster.filter(s => !sheetOf.has(email(s.email)) && email(s.email) !== ME);
const started = sheets.filter(s => !s.submitted_at && email(s.viewer_id) !== ME && nameOf.has(email(s.viewer_id)));
const strangers = sheets.filter(s => !s.submitted_at && email(s.viewer_id) !== ME && !nameOf.has(email(s.viewer_id)));

console.log(`Roster ${roster.length}. Sheets ${sheets.length}, submitted ${sheets.filter(s => s.submitted_at).length}.`);
console.log(`\nNo sheet yet, a sheet gets made (${noSheet.length}):`); noSheet.forEach(s => console.log(`  ${s.name} <${email(s.email)}>`));
console.log(`\nStarted, not submitted (${started.length}):`); started.forEach(s => console.log(`  ${nameOf.get(email(s.viewer_id))} <${s.viewer_id}>${unlockOf.has(s.id) ? "  (unlocked until " + unlockOf.get(s.id) + ")" : ""}`));
if (strangers.length) { console.log(`\nUnsubmitted sheets not on the roster, left alone (${strangers.length}):`); strangers.forEach(s => console.log("  " + s.viewer_id)); }
console.log(`\nUnlock until ${UNTIL} (${new Date(UNTIL).toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "full", timeStyle: "short" })} Pacific).`);

if (!write) { console.log("\nNothing written. Say --write to do it."); process.exit(0); }

const made = noSheet.length ? await post("worksheet_sheets", noSheet.map(s => ({ worksheet_key: KEY, group_key: GROUP, viewer_id: email(s.email) }))) : [];
console.log(`\nmade ${made.length} sheets`);
const ids = [...started.map(s => s.id), ...made.map(s => s.id)];
const rows = ids.map(sheet_id => ({ sheet_id, until: UNTIL }));
const out = await post("worksheet_unlocks?on_conflict=sheet_id", rows, "return=representation,resolution=merge-duplicates");
console.log(`unlocked ${out.length} sheets until ${UNTIL}`);
