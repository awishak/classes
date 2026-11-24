// Who has no approved topic, and whether every approved topic has words the
// builder can show. Read only. Prints names, so run it for yourself and do
// not paste the output anywhere students can read.
//
//   node scripts/final-project-topics-check.mjs comm118
import { readFileSync } from "node:fs";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local."); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key };
const cls = process.argv[2] || "comm118";
const PLAN = { comm3: "comm3-f26-v1-plan", comm118: "comm118-f26-v1-plan" }[cls];
const lower = (s) => String(s || "").trim().toLowerCase();
const get = async (url) => { const r = await fetch(SUPABASE_URL + url, { headers: H }); return r.ok ? r.json() : null; };

const prefs = (await get(`/storage/v1/object/instructor/${cls}-final-prefs.json`)) || {};
const plan = (await get(`/rest/v1/app_data?id=eq.${PLAN}&select=data`))?.[0]?.data || {};
const roster = (plan.students || []).filter(s => s && s.email).map(s => ({ name: s.name, email: lower(s.email) }));
const nameOf = new Map(roster.map(s => [s.email, s.name]));
const pairs = (prefs.pairs || []).map(p => p.map(lower)), solo = (prefs.solo || []).map(lower);
const placed = new Set([...pairs.flat(), ...solo]);
const marks = (email) => { const k = Object.keys(prefs.topics || {}).find(x => lower(x) === email); return ["a", "b", "c"].filter(s => prefs.topics?.[k]?.[s]); };

// The same two reads the builder's route makes for a student's topic lines.
async function lines(email) {
  const sheet = (await get(`/rest/v1/worksheet_sheets?select=id&worksheet_key=eq.final-prefs&group_key=eq.${cls}&viewer_id=eq.${encodeURIComponent(email)}`))?.[0];
  if (!sheet) return null;
  const rows = (await get(`/rest/v1/worksheet_answers?select=field,value,position,created_at&sheet_id=eq.${sheet.id}&field=like.topic:*&order=position,created_at`)) || [];
  const slot = {}; for (const r of rows) slot[r.field + "\u0000" + (r.position || 0)] = r;
  const out = {}; Object.values(slot).sort((x, y) => (x.position || 0) - (y.position || 0)).forEach(r => { const k = r.field.split(":")[1]; out[k] = (out[k] || "") + r.value; });
  return out;
}

console.log(cls + ": " + roster.length + " on the roster with an email, " + placed.size + " placed (" + pairs.length + " pairs, " + solo.length + " individual)");
const none = [...placed].filter(e => marks(e).length === 0);
console.log("\nPlaced, with no approved topic of their own (" + none.length + "):");
for (const e of none) { const pair = pairs.find(p => p.includes(e)); const mate = pair ? pair.find(x => x !== e) : ""; console.log("  " + (nameOf.get(e) || e) + (mate ? ", paired with " + (nameOf.get(mate) || mate) + " (" + marks(mate).length + " approved)" : ", individual")); }
const loose = roster.filter(s => !placed.has(s.email));
console.log("\nOn the roster, not in a pair and not set to individual (" + loose.length + "):");
for (const s of loose) console.log("  " + s.name + " (" + marks(s.email).length + " approved)");
const teams = [...pairs, ...solo.map(e => [e])].filter(t => t.every(e => marks(e).length === 0));
console.log("\nTeams with no approved topic between them (" + teams.length + "):");
for (const t of teams) console.log("  " + t.map(e => nameOf.get(e) || e).join(" and "));
let ok = 0, blank = [];
for (const e of placed) { const m = marks(e); if (!m.length) continue; const text = await lines(e); for (const s of m) { if (text && String(text[s] || "").trim()) ok++; else blank.push((nameOf.get(e) || e) + " topic " + s + (text ? "" : " (no sheet found)")); } }
console.log("\nApproved topics with words the builder can show: " + ok + ". With none: " + blank.length);
for (const b of blank) console.log("  " + b);
