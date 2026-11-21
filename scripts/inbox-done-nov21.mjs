// COMM 3: marks eleven inbox threads Done with nothing sent. Andrew,
// 2026-11-21, after reading the list: "mark second group done." Sets
// inboxDone["t:<name>"] on the plan row to the ts of the student's last
// message, the mark the inbox's own Done button makes (donePatch in owed.js).
// A newer message from the student brings the thread back.
//
//   node scripts/inbox-done-nov21.mjs <storageKey>           prints
//   node scripts/inbox-done-nov21.mjs <storageKey> --write   writes

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const BASE = process.argv[2], PLAN = BASE + "-plan";
const NAMES = ["Avery Lotuff", "Whitaker Tollmann", "Bruno Der", "Wenqi Sang", "Hannah Hsu", "Garrett Schaden",
  "Lorenza Camou Balderrama", "Ileana Garcia Huerta", "Melissa McNelly", "Raima Falor", "Talia Rudowitz"];

const row = async (id) => ((await (await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${id}&select=data`, { headers: H })).json())[0] || {}).data;
const base = await row(BASE), cur = await row(PLAN);
if (!base || !cur) throw new Error("row missing");
const done = { ...(cur.inboxDone || {}) };
for (const n of NAMES) {
  const thread = (base.threads?.[n] || []).filter(m => !m.deleted);
  const last = thread[thread.length - 1];
  if (!last || last.from !== "student") throw new Error("last word is not the student's: " + n);
  done["t:" + n] = last.ts;
  console.log(n, "->", last.ts, "|", String(last.text || "").slice(0, 60));
}
if (!write) { console.log("\nNothing written. Say --write."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: PLAN, data: { ...cur, inboxDone: done }, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status);
console.log("wrote " + PLAN + ", inboxDone now has " + Object.keys((await w.json())[0].data.inboxDone).length + " marks");
