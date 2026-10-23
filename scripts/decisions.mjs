// Andrew's answers to a question set, read off the plan row. Read-only.
//
//   node scripts/decisions.mjs                     every set for comm118
//   node scripts/decisions.mjs --set section-2     one set
//   node scripts/decisions.mjs --class comm118-f26-v1 --json
//
// The sets are in src/engine/decisions.js; the page is /<class>/decisions.
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";
import { DECISIONS, answersOf, answerLines, answeredCount } from "../src/engine/decisions.js";

const SUPABASE_URL = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : ""; };
const classKey = flag("class") || "comm118-f26-v1";
const only = flag("set");
const asJson = args.includes("--json");

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${encodeURIComponent(classKey + "-plan")}&select=data`, { headers: H });
if (!r.ok) { console.error(`read ${classKey}-plan: ${r.status}`); process.exit(1); }
const plan = ((await r.json())[0] || {}).data || {};
const classId = classKey.replace(/-f\d\d-v\d+$/, "");
const sets = DECISIONS.filter(s => s.classId === classId && (!only || s.id === only));
if (!sets.length) { console.log("No question set " + (only ? JSON.stringify(only) : "") + " for " + classId + "."); process.exit(0); }

if (asJson) { console.log(JSON.stringify(Object.fromEntries(sets.map(s => [s.id, plan.decisions?.[s.id] || null])), null, 2)); process.exit(0); }
for (const s of sets) {
  const answers = answersOf(plan, s.id);
  const when = plan.decisions?.[s.id]?.updatedAt;
  console.log(`${s.title} (${s.id}, ${s.date}): ${answeredCount(s, answers)} of ${s.questions.length} answered${when ? ", last " + new Date(when).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) : ""}`);
  for (const line of answerLines(s, answers)) console.log("  " + line);
  console.log("");
}
