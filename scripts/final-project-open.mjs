// Opens the final project builder to one class. Andrew, 2026-11-24, once
// COMM 118's teams and topics were released: "probably now".
//
// Three changes on the class's plan row, and nothing else:
//   1. worksheetsOpen["final-project"] = true, so the builder's address opens
//      for students (it was COMM 999 only).
//   2. The pre-production challenge (final-pre) opens and points at the builder.
//   3. The final challenge (final) points at the builder too. It stays "not
//      open yet": the builder itself keeps a team on pre-production until he
//      marks the team complete.
// With --title, the final challenge is renamed as well.
//
//   node scripts/final-project-open.mjs comm118                                  prints
//   node scripts/final-project-open.mjs comm118 --title "Sports Comm Exhibit"    prints, with the new name
//   node scripts/final-project-open.mjs comm118 --write                          writes
import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const args = process.argv.slice(2), cls = args.find(a => !a.startsWith("--") && a !== args[args.indexOf("--title") + 1]) || "";
const PLAN = { comm3: "comm3-f26-v1-plan", comm118: "comm118-f26-v1-plan" }[cls];
if (!PLAN) { console.error("Which class? comm3 or comm118."); process.exit(1); }
const write = args.includes("--write");
const title = args.includes("--title") ? String(args[args.indexOf("--title") + 1] || "").trim() : "";
const link = `/${cls}/worksheets/final-project`;

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=data`, { headers: H });
if (!r.ok) throw new Error("read: " + r.status);
const cur = (await r.json())[0].data;
const show = (a) => JSON.stringify({ title: a.title, opens: a.opens, instructionsUrl: a.instructionsUrl });
const assignments = cur.assignments.map(a => {
  if (a.id === "final-pre") return { ...a, opens: "now", opensAt: "", instructionsUrl: link };
  if (a.id === "final") return { ...a, instructionsUrl: link, ...(title ? { title } : {}) };
  return a;
});
for (const id of ["final-pre", "final"]) {
  const was = cur.assignments.find(a => a.id === id), now = assignments.find(a => a.id === id);
  if (!was) { console.error("No challenge " + id + " on the plan row."); process.exit(1); }
  console.log(id + "\n  was " + show(was) + "\n  now " + show(now));
}
console.log("worksheetsOpen final-project\n  was " + JSON.stringify(cur.worksheetsOpen?.["final-project"]) + "\n  now true");
if (!write) { console.log("\nNothing written. Add --write to make the change."); process.exit(0); }
const next = { ...cur, assignments, worksheetsOpen: { ...(cur.worksheetsOpen || {}), "final-project": true } };
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${PLAN}&select=id`, { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ data: next }) });
const out = await w.json();
if (!w.ok || !out.length) throw new Error(`write: ${w.status} ${JSON.stringify(out)}`);
console.log("\nWritten.");
