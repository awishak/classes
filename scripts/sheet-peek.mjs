// One student's worksheet at a glance: when it was submitted, how much is in
// each field, their card and their log on the challenge. Reads only. Prints a
// student's name and messages, so run it for yourself.
//
//   node scripts/sheet-peek.mjs comm3 audio-research ex5 "<name on the roster>"
import { readFileSync } from "node:fs";
const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + ": " + r.status); return r.json(); };
const [cls, key, aid, name] = process.argv.slice(2);
const ID = { comm3: "comm3-f26-v1", comm118: "comm118-f26-v1" }[cls];
const row = (await get(`app_data?id=eq.${ID}&select=data`))[0].data, plan = (await get(`app_data?id=eq.${ID}-plan&select=data`))[0].data;
const st = plan.students.find(s => s.name === name);
if (!st) { console.error("Not on the roster: " + name); process.exit(1); }
const sh = (await get(`worksheet_sheets?group_key=eq.${cls}&worksheet_key=eq.${key}&select=*`)).find(s => String(s.viewer_id).toLowerCase() === String(st.email).trim().toLowerCase());
const pt = (t) => t ? new Date(t).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never";
console.log(name + "\n  sheet: " + (sh ? "first submitted " + pt(sh.first_submitted_at) + ", last " + pt(sh.submitted_at) : "none"));
console.log("  card: " + JSON.stringify(plan.gradeBoard?.[aid]?.cards?.[name] || null));
for (const e of (row.assignmentLog?.[aid]?.[name] || []).filter(x => !x.deleted)) console.log("  " + pt(e.ts) + " " + e.type + (e.auto ? " (automatic)" : "") + " " + JSON.stringify(e.letter || e.text || e.link || "").slice(0, 500));
if (sh) {
  const ans = await get(`worksheet_answers?select=field,value,position&sheet_id=eq.${sh.id}&order=field,position`);
  const by = {}; ans.forEach(a => { by[a.field] = (by[a.field] || "") + String(a.value || ""); });
  for (const [f, v] of Object.entries(by)) console.log("  " + f + " (" + v.trim().length + "): " + v.trim().replace(/\s+/g, " ").slice(0, process.argv.includes("--full") ? 4000 : 160));
}
