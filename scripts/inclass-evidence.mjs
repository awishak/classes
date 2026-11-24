// What the site knows that bears on an in-class grade, a row a student: the
// grade on each challenge that carries no weight, and how many class days the
// student was marked away. Reads only. Prints names, so run it for yourself.
//
// Andrew, 2026-11-24, on COMM 118's In-Class: "take what I just gave you and
// then look at also the ungraded assignments."
//
//   node scripts/inclass-evidence.mjs comm118
import { readFileSync } from "node:fs";
const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + ": " + r.status); return r.json(); };
const cls = process.argv[2];
const ID = { comm3: "comm3-f26-v1", comm118: "comm118-f26-v1" }[cls];
const row = (await get(`app_data?id=eq.${ID}&select=data`))[0].data, plan = (await get(`app_data?id=eq.${ID}-plan&select=data`))[0].data;
const roster = (plan.students || []).filter(s => s.email && !/\.test$/.test(s.email) && !/lurker/i.test(s.name || ""));
const free = [...(plan.assignments || []).filter(a => !(a.weight > 0) && !/ongoing/i.test(a.due || "")), ...Object.keys(row.assignmentLog || {}).filter(k => /^checkin-/.test(k)).map(k => ({ id: k, title: "check-in", due: "" }))];
console.log("No-weight challenges: " + free.map(a => a.id + " (" + a.title + ", due " + a.due + ")").join("; "));
const away = row.away || plan.away || {};
const days = Object.keys(away).sort();
console.log("Days with anyone marked away: " + days.length + (days.length ? " (" + days[0] + " to " + days[days.length - 1] + ")" : ""));
console.log("Roster entry keys: " + Object.keys(roster[0]).join(", "));
const last = (log) => (log || []).filter(e => e.type === "grade" && !e.deleted).sort((a, b) => a.ts - b.ts).pop();
for (const s of roster) {
  const ids = [s.id, s.name, s.email].filter(Boolean);
  const gone = days.filter(d => ids.some(i => away[d] && away[d][i]));
  const cells = free.map(a => { const g = last(row.assignmentLog?.[a.id]?.[s.name]); return a.id + ": " + (g ? g.letter : "none"); });
  console.log(s.name.padEnd(24) + " away " + String(gone.length).padStart(2) + "  " + cells.join("  "));
}
