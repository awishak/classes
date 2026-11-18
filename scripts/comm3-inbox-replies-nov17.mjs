// COMM 3 inbox, Tuesday, November 17: seven short replies in Andrew's words
// and one challenge message marked done. Andrew, 2026-11-17: "short, like a
// one sentence, 2 sentence, positive cheery messages back", then each reply
// dictated, and of late work: "I never agree to, like, yes ... I hold them
// to the deadline till I decide to grade." A reply lands in the student's
// thread on the class row, which is what clears it from the inbox (owed.js).
//
//   node scripts/comm3-inbox-replies-nov17.mjs           prints
//   node scripts/comm3-inbox-replies-nov17.mjs --write   sends

import { readFileSync } from "node:fs";
const ROOT = process.cwd() + "/";
const SUPABASE_URL = readFileSync(ROOT + "src/storage-shim.js", "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const ID = "comm3-f26-v1";
const OPEN = "Hey, sorry about that. It's open now. Thank you for alerting me.";
const NY = "Hey, sorry about that. I was in New York. Hope we got your question answered in class.";
const REPLIES = {
  "Cathryn Lam": OPEN,
  "Parker Fryberger": OPEN,
  "Joaquin Guzman": NY,
  "Dillon Boszhardt": NY,
  "Madison Graciano": "I'm so sorry that I didn't see this message from you earlier. I understand if you weren't able to get it in quite on time. I appreciate your work no matter what.",
  "Alejandro Lopez jimenez": "I appreciate you, Alejandro.",
  "Scarlett Mercer": "Thank you, Scarlett. I did talk in class on Monday about how important it is to be on time, but I also appreciate that you got it in close to the deadline. I'll take a look.",
};
const DONE = { aid: "audio", name: "Ethan Dwyer" };
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const r = await fetch(`${SUPABASE_URL}/rest/v1/app_data?id=eq.${ID}&select=data`, { headers: H });
const data = (await r.json())[0].data;
const threads = { ...(data.threads || {}) };
let now = Date.now();
for (const [name, text] of Object.entries(REPLIES)) {
  const thread = (threads[name] || []).filter(m => !m.deleted);
  const last = thread[thread.length - 1];
  if (!last || last.from !== "student") throw new Error(name + ": the last word is not the student's");
  console.log(name + "\n  theirs: " + String(last.text || "").slice(0, 90).replace(/\n/g, " ") + "\n  reply:  " + text);
  threads[name] = [...(threads[name] || []), { id: genId(), ts: now++, from: "instructor", kind: "note", text }];
}
const log = (data.assignmentLog?.[DONE.aid]?.[DONE.name] || []);
const theirs = [...log].reverse().find(e => !e.deleted && e.type === "comment" && e.from === "student");
if (!theirs) throw new Error("no message from " + DONE.name + " on " + DONE.aid);
console.log(DONE.name + "\n  theirs: " + String(theirs.text || "").slice(0, 90) + "\n  marked done, no reply");
const next = { ...data, threads, assignmentLog: { ...data.assignmentLog, [DONE.aid]: { ...data.assignmentLog[DONE.aid], [DONE.name]: log.map(e => e.id === theirs.id ? { ...e, appreciatedBy: "instructor" } : e) } } };
if (!write) { console.log("Nothing sent. Say --write to do it."); process.exit(0); }
const w = await fetch(`${SUPABASE_URL}/rest/v1/app_data?on_conflict=id`, { method: "POST", headers: { ...H, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ id: ID, data: next, updated_at: new Date().toISOString() }) });
if (!w.ok) throw new Error("write: " + w.status + " " + (await w.text()).slice(0, 200));
const back = (await w.json())[0].data;
console.log("sent " + Object.keys(REPLIES).filter(n => back.threads[n].slice(-1)[0].from === "instructor").length + " of " + Object.keys(REPLIES).length + " replies");
process.exit(0);
