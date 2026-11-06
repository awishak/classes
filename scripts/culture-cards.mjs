// The two My Work cards for Sit-Down 2, on the COMM 118 plan row.
//
//   node scripts/culture-cards.mjs            prints what would change
//   node scripts/culture-cards.mjs --write    writes it
//
// s2-memo becomes the Culture Guide: due Wednesday, November 11, at 11:59 PM,
// open now, pointed at the guide so the control page and grading read the
// sheet. s2 (Sit-Down 2, the meeting) opens now and points at the slot page,
// no submission. Everything else on both cards stays as Andrew set it.

import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#")).map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const PLAN = "comm118-f26-v1-plan";
const write = process.argv.includes("--write");

const CHANGES = {
  "s2-memo": {
    title: "Culture Guide", due: "Nov 11", dueTime: "11:59 PM", opens: "now", opensAt: "", visible: true,
    description: "We are building a Culture Guide that you can use to guide you as you work with teams now and in the future. This is also the document you will be becoming an expert on: you will submit it to me before your Sit-Down, and you'll be expected to know it well.",
    instructionsUrl: "https://classes.andrewishak.com/comm118/worksheets/culture-guide",
  },
  "s2": {
    title: "Sit-Down 2", due: "Nov 13", dueTime: "", opens: "now", opensAt: "", visible: true, submission: "none",
    description: "A sit-down is a meeting with me. Last time it was your whole group. This time it's just you and me, for ten minutes, and we talk about your Culture Guide. Pick your time at the link.",
    instructionsUrl: "https://classes.andrewishak.com/comm118/sitdown2",
  },
};

const plan = (await (await fetch(SUPABASE_URL + "/rest/v1/app_data?id=eq." + PLAN + "&select=data", { headers: H })).json())?.[0]?.data;
if (!plan) { console.error("No plan row."); process.exit(1); }
const next = (plan.assignments || []).map(a => CHANGES[a.id] ? { ...a, ...CHANGES[a.id] } : a);
for (const id of Object.keys(CHANGES)) {
  const was = (plan.assignments || []).find(a => a.id === id), now = next.find(a => a.id === id);
  if (!was) { console.log(id + ": not on the row, nothing changed"); continue; }
  console.log("\n" + id);
  Object.keys(CHANGES[id]).forEach(k => { if (JSON.stringify(was[k]) !== JSON.stringify(now[k])) console.log("  " + k + ": " + JSON.stringify(was[k]) + " -> " + JSON.stringify(now[k])); });
}
if (!write) { console.log("\nNothing written. Say --write to do it."); process.exit(0); }
const fresh = (await (await fetch(SUPABASE_URL + "/rest/v1/app_data?id=eq." + PLAN + "&select=data", { headers: H })).json())?.[0]?.data;
const r = await fetch(SUPABASE_URL + "/rest/v1/app_data?on_conflict=id", { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify([{ id: PLAN, data: { ...fresh, assignments: (fresh.assignments || []).map(a => CHANGES[a.id] ? { ...a, ...CHANGES[a.id] } : a) } }]) });
console.log(r.ok ? "\nWritten." : "\nWrite failed: " + r.status + " " + await r.text());
