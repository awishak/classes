// What one COMM 3 student changed in their visual story since the November 10
// pull (~/Projects/visual-story-grading/data.json). Reads only. Prints the
// student's words, so run it for yourself.
//
//   node scripts/comm3-visual-story-changes.mjs "<name on the roster>"
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(q + ": " + r.status); return r.json(); };
const name = process.argv[2];
const old = JSON.parse(readFileSync(homedir() + "/Projects/visual-story-grading/data.json", "utf8"));
const rows = Array.isArray(old) ? old : old.students || Object.values(old);
const was = rows.find(r => r.name === name);
if (!was) { console.error("Not in the November pull: " + name); process.exit(1); }
console.log("Keys in the November row: " + Object.keys(was).join(", "));
const short = (v) => { const s = typeof v === "string" ? v : JSON.stringify(v); return s.length > 2600 ? s.slice(0, 2600) + " … (" + s.length + " characters)" : s; };
for (const k of Object.keys(was)) if (!/^(name|email|section)$/.test(k)) console.log("\n[then] " + k + ": " + short(was[k]));
const plan = (await get("app_data?id=eq.comm3-f26-v1-plan&select=data"))[0].data;
const st = plan.students.find(s => s.name === name);
const sheet = (await get("worksheet_sheets?group_key=eq.comm3&worksheet_key=eq.visual-story&select=*")).find(s => String(s.viewer_id).toLowerCase() === String(st.email).trim().toLowerCase());
console.log("\n[now] sheet: " + JSON.stringify({ submitted_at: sheet.submitted_at, first_submitted_at: sheet.first_submitted_at, updated_at: sheet.updated_at, created_at: sheet.created_at }));
const ans = await get(`worksheet_answers?select=*&sheet_id=eq.${sheet.id}&order=field,position`);
for (const a of ans) console.log("\n[now] " + a.field + " #" + (a.position || 0) + " (" + (a.updated_at || a.created_at) + "): " + short(a.value));
