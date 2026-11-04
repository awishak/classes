// Pin the November 4 audio drop box on COMM 3's home, for students.
//
// The home shows the last pin on the plan row (PinBar, portal/StudentHome
// .jsx reads data.pins). Andrew, 2026-11-04: "make me an audio file drop box
// page for today. Pin it for students."
//
// What this writes, on comm3-f26-v1-plan:
//   pins   gets { id, title: "Audio Exercise Nov 4", url: /comm3/worksheets/audio-nov4, at }
//
//   node scripts/comm3-audio-nov4-pin.mjs           prints what would change
//   node scripts/comm3-audio-nov4-pin.mjs --write   writes
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (vercel env pull .env.local).

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const ID = "comm3-f26-v1-plan";
const PIN = { title: "Audio Exercise Nov 4", url: "/comm3/worksheets/audio-nov4" };

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
if (!r.ok) throw new Error(`read ${ID}: ${r.status}`);
const plan = ((await r.json())[0] || {}).data;
if (!plan) { console.error("no plan row"); process.exit(1); }

const pins = Array.isArray(plan.pins) ? plan.pins : [];
console.log("pins now: " + (pins.length ? pins.map(p => `${p.title} -> ${p.url}`).join("; ") : "none"));
if (pins.some(p => p.url === PIN.url)) { console.log("already pinned; nothing to do"); process.exit(0); }
const next = [...pins, { id: "pin-" + Math.random().toString(36).slice(2, 10), ...PIN, at: Date.now() }];
console.log(`  -> add ${PIN.title} -> ${PIN.url}`);

if (write) {
  const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, {
    method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id: ID, data: { ...plan, pins: next }, updated_at: new Date().toISOString() }),
  });
  if (!w.ok) throw new Error(`write ${ID}: ${w.status} ${await w.text()}`);
  const back = await w.json();
  if (!back || !back[0]) throw new Error("the write returned no row");
  console.log("wrote " + ID);
} else console.log("\nNothing written. Say --write to do it.");
