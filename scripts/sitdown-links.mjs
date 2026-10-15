// Every Sit-Down 1 table with the link each student turned in. Read-only.
//
// The links live on the COMM 118 class row as sitdownLinks[rosterName], and
// on the My Work assignment's log when one points at /comm118/sitdown. This
// prints both merged, newest wins, the way the page reads them, so a session
// writing the instructor's sheet (teaching/comm118/sit-down-1.md) has the
// list in one go.
//
//   node scripts/sitdown-links.mjs
//   node scripts/sitdown-links.mjs --class comm118-f26-v1 --json
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";
import { SESSIONS, SITDOWN, tableOf, sitdownAssignment, linkOf } from "../src/engine/worktopia/sitdown.js";

const SUPABASE_URL = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8")
  .match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };

const read = async (id) => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`, { headers: H });
  if (!r.ok) throw new Error(`read ${id}: ${r.status}`);
  return ((await r.json())[0] || {}).data ?? null;
};

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf("--" + name); return i >= 0 ? args[i + 1] : ""; };
const classKey = flag("class") || "comm118-f26-v1";
const asJson = args.includes("--json");

const cls = (await read(classKey)) || {};
const plan = (await read(classKey + "-plan")) || {};
const data = { ...cls, ...plan };
const asg = sitdownAssignment(data.assignments);
const when = (ms) => new Date(ms).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const out = SESSIONS.map(s => ({
  key: s.key, when: s.day + ", " + s.time + " AM",
  people: tableOf(s, data.sitdownRoles || {}).map(p => {
    const l = linkOf(data, p.roster, asg);
    return { name: p.name, roster: p.roster, role: p.role?.role || null, field: p.role?.field || null, link: l?.link || null, at: l?.at || null, late: !!(l && l.at > SITDOWN.prepDue) };
  }),
}));

if (asJson) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

const total = out.reduce((n, t) => n + t.people.length, 0);
const inCount = out.reduce((n, t) => n + t.people.filter(p => p.link).length, 0);
console.log(`${classKey}: ${inCount} of ${total} turned in. ${asg ? "Assignment: " + asg.title : "No assignment points at /sitdown."}\n`);
for (const t of out) {
  console.log(`${t.when}  (${t.people.filter(p => p.link).length} of ${t.people.length} in)`);
  for (const p of t.people) {
    const role = p.role ? `, ${p.role}` : ", no role yet";
    console.log(`  ${p.name}${role}`);
    console.log(`    ${p.link ? p.link + "  " + when(p.at) + (p.late ? "  (after the deadline)" : "") : "not turned in"}`);
  }
  console.log("");
}
