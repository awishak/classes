// COMM 118: Turkey Bowl runs become hand-ins on Weekly Challenge 4. Emme
// Munn wrote on 2026-11-21 that the challenge said "Not open yet", let her
// through to the game, and then showed her late with nothing saved. Her run
// was saved, in the game's own row, on time. The game never wrote anything
// to the challenge, and wc4 was left on "Not yet", so every student who
// played reads as having turned in nothing.
//
// For each COMM 118 game row that reached Level 3 (the credit line, Andrew's
// rule), this adds one submission to assignmentLog.wc4 for that student,
// stamped with when the run was saved. It goes in time order, ahead of a
// later hand-in of their own (Emme's, marked late at 11:25 PM). Run twice, it adds nothing. It also sets wc4 to open on the plan row so it stops saying "Not
// open yet".
//
//   node scripts/comm118-wc4-turkey-bowl-submits.mjs           prints
//   node scripts/comm118-wc4-turkey-bowl-submits.mjs --write   writes

import { readFileSync } from "node:fs";

const ROW = "comm118-f26-v1", PLAN = ROW + "-plan", AID = "wc4";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const get = async (q) => (await fetch(`${SUPABASE_URL}/rest/v1/app_data?${q}`, { headers: H })).json();
const put = async (id, data) => {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }) });
  if (!w.ok) throw new Error("write " + id + ": " + w.status);
  return (await w.json())[0].data;
};
const when = (t) => new Date(t).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const games = (await get("id=like.turkeybowl-s-*&select=id,data")).map(r => r.data).filter(d => d && d.tag === "COMM 118" && (d.level || 1) >= 3);
const base = (await get(`id=eq.${ROW}&select=data`))[0].data;
const plan = (await get(`id=eq.${PLAN}&select=data`))[0].data;
const mail = (s) => String(s || "").trim().toLowerCase();
const byEmail = new Map();
(plan.students || []).forEach(s => { if (s.email) byEmail.set(mail(s.email), s.name); });
Object.entries(base.profiles || {}).forEach(([name, p]) => { if (p?.email && !byEmail.has(mail(p.email))) byEmail.set(mail(p.email), name); });

const log = { ...(base.assignmentLog?.[AID] || {}) };
let added = 0;
for (const g of games.sort((x, y) => Date.parse(x.at) - Date.parse(y.at))) {
  const name = byEmail.get(mail(g.email));
  if (!name) { console.log("NO ROSTER NAME for", g.email, "- skipped"); continue; }
  const has = (log[name] || []).some(e => String(e.id).startsWith("tb-"));
  const ts = Date.parse(g.bestAt || g.at);
  console.log(`${has ? "has one " : "adds    "} ${name} | Level ${g.level} | ${g.best} points | ${when(ts)}`);
  if (has) continue;
  // In time order, so a run saved before a student's own later hand-in is the first one, which is what lateness reads.
  log[name] = [...(log[name] || []), { id: "tb-" + g.key, ts, type: "submission", link: "", text: "Turkey Bowl: reached Level " + g.level + ", " + g.best + " points." }].sort((x, y) => (x.ts || 0) - (y.ts || 0));
  added++;
}
const asg = (plan.assignments || []).find(a => a.id === AID);
console.log(`\n${added} to add. wc4 opens: "${asg.opens}" -> "now"`);
if (!write) { console.log("Nothing written. Say --write."); process.exit(0); }

// The student row is read again right before the write, so only the wc4 log is laid over what is there now.
const fresh = (await get(`id=eq.${ROW}&select=data`))[0].data;
const merged = { ...(fresh.assignmentLog?.[AID] || {}) };
Object.keys(log).forEach(n => {
  const add = log[n].find(e => String(e.id).startsWith("tb-"));
  if (add && !(merged[n] || []).some(e => e.id === add.id)) merged[n] = [...(merged[n] || []), add].sort((x, y) => (x.ts || 0) - (y.ts || 0));
});
const back = await put(ROW, { ...fresh, assignmentLog: { ...(fresh.assignmentLog || {}), [AID]: merged } });
console.log("wrote " + ROW + ": wc4 has hand-ins from " + Object.values(back.assignmentLog[AID]).filter(l => l.some(e => e.type === "submission")).length + " students");
const freshPlan = (await get(`id=eq.${PLAN}&select=data`))[0].data;
const backPlan = await put(PLAN, { ...freshPlan, assignments: freshPlan.assignments.map(a => (a.id === AID ? { ...a, opens: "now" } : a)) });
console.log("wrote " + PLAN + ": wc4 opens " + backPlan.assignments.find(a => a.id === AID).opens);
