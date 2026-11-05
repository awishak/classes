// Put the sorted read of Audio story ideas on the challenge, so Control,
// Review, Board and Grade Flow all link it. Andrew, 2026-11-05: "you have
// to make it easy for me to find this on the site."
//
// What this writes, on comm3-f26-v1-plan:
//   assignments   the one with id "audio-ideas" gets
//                 links: [{ say: "TA mode", href: <artifact> }]
//
//   node scripts/comm3-audio-ideas-sorted-link.mjs           prints
//   node scripts/comm3-audio-ideas-sorted-link.mjs --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const ID = "comm3-f26-v1-plan";
const LINK = { say: "TA mode", href: "https://claude.ai/artifact/STMUE8TRgDQBTaUZT9ShSr" };

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
const asg = (plan?.assignments || []).find(a => a.id === "audio-ideas");
if (!asg) { console.error("no audio-ideas challenge on the plan row"); process.exit(1); }
// Andrew, 2026-11-05: "call sorted by claude TA mode." The same address, renamed.
const links = (Array.isArray(asg.links) ? asg.links : []).filter(l => l.href !== LINK.href).concat([LINK]);
console.log(`${asg.title}: links now ${JSON.stringify(asg.links || [])}\n  -> ${JSON.stringify(links)}`);
if (write) {
  const assignments = plan.assignments.map(a => (a.id === "audio-ideas" ? { ...a, links } : a));
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, assignments }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
