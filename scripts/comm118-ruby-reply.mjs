// COMM 118: Andrew's reply to Ruby McAlister on the Scouting Report, where
// she asked twice which requirements were missed. Andrew dictated it,
// 2026-11-21. A comment on the challenge, the shape the inbox's replyPatch
// writes (owed.js). The row is read and written back at once; only her
// s1-memo log changes.
//
//   node scripts/comm118-ruby-reply.mjs           prints
//   node scripts/comm118-ruby-reply.mjs --write   writes

import { readFileSync } from "node:fs";

const WORDS = "Ruby, sorry for the slow reply. I'd love to chat with you about your work so we can make sure we're on the same page. Can we talk by phone early Thanksgiving week, or would you rather meet in office hours Week 10?";
const NAME = "Ruby McAlister", AID = "s1-memo", ROW = "comm118-f26-v1";
const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };

const cur = ((await (await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ROW}&select=data`, { headers: H })).json())[0] || {}).data;
const log = cur?.assignmentLog?.[AID]?.[NAME];
if (!log) throw new Error("no log");
const last = log[log.length - 1];
if (!(last.type === "comment" && last.from === "student")) throw new Error("the last word on it is not hers any more");
const now = Date.now();
const entry = { id: now.toString(36) + Math.random().toString(36).slice(2, 7), ts: now, type: "comment", from: "instructor", html: "<p>" + WORDS + "</p>" };
console.log("answers:", last.text);
console.log("adds:", JSON.stringify(entry));
if (!process.argv.includes("--write")) { console.log("\nNothing written. Say --write."); process.exit(0); }
const next = { ...cur, assignmentLog: { ...cur.assignmentLog, [AID]: { ...cur.assignmentLog[AID], [NAME]: [...log, entry] } } };
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: ROW, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status);
const back = (await w.json())[0].data.assignmentLog[AID][NAME];
console.log("wrote. her log has", back.length, "entries, last from", back[back.length - 1].from);
