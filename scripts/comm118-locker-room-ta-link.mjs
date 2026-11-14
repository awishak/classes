// Link the Locker Room TA mode page on COMM 118's wc3 challenge, so Control,
// Review, Board and Grade Flow all carry it. The page is a private artifact.
//
//   node scripts/comm118-locker-room-ta-link.mjs            prints
//   node scripts/comm118-locker-room-ta-link.mjs --write    writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const ID = "comm118-f26-v1-plan";
const LINK = { say: "TA mode", href: "https://claude.ai/artifact/Qj5kgn2W36iRTUfGnpQJsT" };

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
const asg = (plan?.assignments || []).find(a => a.id === "wc3");
if (!asg) { console.error("no wc3 challenge on the plan row"); process.exit(1); }
const links = (Array.isArray(asg.links) ? asg.links : []).filter(l => l.href !== LINK.href).concat([LINK]);
console.log(`${asg.title}: links now ${JSON.stringify(asg.links || [])}\n  -> ${JSON.stringify(links)}`);
if (write) {
  const assignments = plan.assignments.map(a => (a.id === "wc3" ? { ...a, links } : a));
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, assignments }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
