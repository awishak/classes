// When the answers on a COMM 3 worksheet were written, next to when Submit was
// pressed and when Andrew reviewed it. Reads only. Written 2026-11-10 to find
// out whether a "late" page was late, or was on time and submitted afterward.
// The site keeps only the current answers, so an answer's time is the time it
// was last rewritten.
//
//   node scripts/comm3-visual-pre-history.mjs                          every late pre-production page
//   node scripts/comm3-visual-pre-history.mjs visual-story <start of an email>    one student's story

import { readFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const H = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY };
const get = async (q) => { const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: H }); if (!r.ok) throw new Error(`${q}: ${r.status} ${await r.text()}`); return r.json(); };

const key = process.argv[2] || "visual-pre", who = process.argv[3] || "";
const DUE = Date.parse(key === "visual-story" ? "2026-10-26T07:00:00Z" : "2026-10-17T07:00:00Z");
const pt = (t) => t ? new Date(t).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" }) : "-";
const all = await get(`worksheet_sheets?worksheet_key=eq.${key}&group_key=eq.comm3&select=*&limit=1000`);
const sheets = who ? all.filter(s => s.viewer_id.toLowerCase().startsWith(who.toLowerCase())) : all.filter(s => !s.submitted_at || Date.parse(s.submitted_at) > DUE);
const reviews = new Map((await get("worksheet_reviews?select=sheet_id,status,reviewed_at&limit=1000")).map(r => [r.sheet_id, r]));
for (const s of sheets) {
  const a = await get(`worksheet_answers?select=field,created_at&sheet_id=eq.${s.id}&order=created_at&limit=1000`);
  const before = a.filter(x => Date.parse(x.created_at) <= DUE).length;
  const r = reviews.get(s.id);
  console.log(`${s.viewer_id.split("@")[0].padEnd(16)} answers ${pt(a[0]?.created_at)} to ${pt(a[a.length - 1]?.created_at)} (${before} of ${a.length} rows written by the deadline); submitted ${pt(s.submitted_at)}; reviewed ${pt(r?.reviewed_at)} ${r?.status || ""}`);
}
