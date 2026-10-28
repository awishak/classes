// The morning messages: what students have said that is still waiting on
// Andrew, important first, each with a reply drafted in his voice. Nothing is
// sent to a student from here until he presses Send on /digest.
//
// Andrew, 2026-10-28: "I want a summary that's sent to me every morning ...
// Monday through Friday, not on the weekends ... we just build a system where
// the messages are just really easy to respond to ... I don't want you to
// send these things without my permission ... you can be important stuff
// first." Standard cases, in his words: a late submission ("sorry, I
// submitted late") and a missed class ("I won't be in class ... you can check
// a box ... thanks for letting me know, in the future you can click the
// box").
//
// Where the messages come from:
//   threads          the student's thread with him, on the class row: the
//                    last word is the student's, and later than inboxSeen
//   assignmentLog    a comment from the student on a challenge with no reply
//                    from him after it
//
// Calls:
//   GET  /api/digest                       the cron (Authorization: Bearer CRON_SECRET)
//                                          builds the digest and emails it
//   POST { action: "preview" }             the instructor: the digest as JSON, no email
//   POST { action: "send" }                the instructor: build and email it now
//   POST { action: "reply", classKey, name, text, aid? }
//                                          the instructor: post the reply into the
//                                          student's thread (or the challenge, with aid)
//   POST { action: "seen", classKey, name } the instructor: mark the thread read
//
// Env: ANTHROPIC_API_KEY (drafts), CRON_SECRET (the cron's word), RESEND_API_KEY
// and DIGEST_FROM (the email), DIGEST_TO (default aishak@scu.edu). Without a
// Resend key the digest still builds and /digest still works; the email is
// skipped and the response says so.

import Anthropic from "@anthropic-ai/sdk";
import { SUPABASE_URL, serviceHeaders, serviceKey } from "./_supabase.js";
import { callerAllowed, readBody } from "./_auth.js";

const CLASSES = { comm3: { key: "comm3-f26-v1", code: "COMM 3" }, comm118: { key: "comm118-f26-v1", code: "COMM 118" } };
const SITE = "https://classes.andrewishak.com";
const TO = process.env.DIGEST_TO || "aishak@scu.edu";
const FROM = process.env.DIGEST_FROM || "Classes <classes@andrewishak.com>";
const MODEL = "claude-opus-5-5";

// What the drafts need to know this week. Edit as the term moves.
const STANDING = `
Today's standing facts, for replies that need them:
- COMM 3 visual story: students who had not submitted are unlocked until Friday, October 30 at 11:59 PM. A late submission is marked late; it still counts.
- COMM 3 visual story comments on classmates' stories are open until Thursday, October 29 at 11:59 AM (noon). Names stay hidden.
- COMM 3 dates moved on October 28: audio exercise Monday November 2, audio pre-production Friday November 6, audio story Sunday November 15, final project ideas Friday November 20, final pre-production Friday December 4, final project Friday December 11. The characters exercise is cut.
- A student who will miss class should use the box on the class home page under the next class day, "I'll be there" unchecked, rather than messaging. The reply thanks them and points there.
- Office hours are on the instructor card on the class site. Meetings: https://calendly.com/andrewishak/meet
`;

const VOICE = `You draft replies from Andrew Ishak, a college instructor, to his students' messages on his class site. Write as Andrew, first person, the way he writes: direct, warm without gushing, short. Plain sentences. No em dashes, no emojis, no exclamation points, no "I hope this finds you well", no sign-off. One to four sentences. Say the concrete thing: what is true, what to do, by when. Never promise a grade change, an extension, or an exception; if the student asks for one, draft a reply that says Andrew will look at it, and mark it high priority so he decides. Never invent facts beyond the standing facts given.

Triage every message:
- "high": asks for a decision from Andrew (a grade, an extension, an exception, a problem only he can fix), reports being blocked by the site, or raises something personal or serious.
- "normal": a routine note he should answer: a late submission notice, a missed class notice, a logistics question the standing facts answer.
- "none": needs no reply at all: thanks, "see you Wednesday", a thumbs up, an acknowledgement.

Standard replies, in Andrew's words, adapted to the message:
- Late submission notice: thanks for letting me know, submit when you can, it is marked late and still counts.
- Missed class notice: thanks for the heads up. Next time, uncheck the box on the class home page under the next class day instead of messaging, and I'll see it there.
- Cannot comment or submit on the visual story: tell them the current window from the standing facts and that the page is open.`;

const lower = (s) => String(s || "").trim().toLowerCase();
const rows = async (path) => { const r = await fetch(SUPABASE_URL + path, { headers: serviceHeaders() }); return r.ok ? r.json().catch(() => null) : null; };
const rowOf = async (id) => ((await rows(`/rest/v1/app_data?id=eq.${encodeURIComponent(id)}&select=data`)) || [])[0]?.data || null;
const put = async (id, data) => {
  const r = await fetch(SUPABASE_URL + "/rest/v1/app_data?on_conflict=id", {
    method: "POST", headers: { ...serviceHeaders(), Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  return r.ok;
};
const alive = (log) => (log || []).filter(e => !e.deleted);
const said = (m) => m.kind === "got_it" ? "Thumbs up" : m.kind === "confused" ? "I'm confused" : m.kind === "meeting" ? "Requested a meeting"
  : m.kind === "question" ? "Q: " + (m.text || "") : String(m.text || m.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const when = (ts) => new Date(ts).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Everything waiting, across the classes.
async function gather() {
  const items = [];
  for (const [slug, c] of Object.entries(CLASSES)) {
    const cls = await rowOf(c.key), plan = await rowOf(c.key + "-plan");
    if (!cls || !plan) continue;
    const roster = (plan.students || []).filter(s => s.name && s.email && !/@(practice|example)\.test$/.test(s.email));
    const seen = plan.inboxSeen || {};
    for (const s of roster) {
      const t = cls.threads?.[s.name] || [];
      const last = t[t.length - 1];
      if (!last || last.from !== "student" || (last.ts || 0) <= (seen[s.name] || 0)) continue;
      let i = t.length - 1; while (i > 0 && t[i - 1].from === "student") i--;
      const run = t.slice(i);
      items.push({ id: slug + ":" + s.name, slug, classKey: c.key, code: c.code, name: s.name, email: s.email, section: s.section || "",
        at: last.ts, kind: "thread", text: run.map(said).filter(Boolean).join("\n"), link: SITE + "/" + slug + "/messages" });
    }
    const asgs = Array.isArray(plan.assignments) ? plan.assignments : Object.values(plan.assignments || {});
    const titleOf = new Map(asgs.map(a => [a.id, a.title]));
    for (const [aid, byName] of Object.entries(cls.assignmentLog || {})) {
      for (const [name, log] of Object.entries(byName || {})) {
        const live = alive(log);
        const last = live[live.length - 1];
        if (!last || last.type !== "comment" || last.from !== "student") continue;
        const who = roster.find(s => s.name === name);
        if (!who) continue;
        let i = live.length - 1; while (i > 0 && live[i - 1].type === "comment" && live[i - 1].from === "student") i--;
        items.push({ id: slug + ":" + name + ":" + aid, slug, classKey: c.key, code: c.code, name, email: who.email, section: who.section || "",
          at: last.ts, kind: "challenge", aid, assignment: titleOf.get(aid) || aid, text: live.slice(i).map(said).filter(Boolean).join("\n"),
          link: SITE + "/" + slug + "/grade" });
      }
    }
  }
  return items.sort((a, b) => (b.at || 0) - (a.at || 0));
}

// Claude reads the lot once and hands back a priority and a draft per item.
async function draft(items) {
  if (!items.length) return items;
  if (!process.env.ANTHROPIC_API_KEY) return items.map(it => ({ ...it, priority: "normal", about: "", reply: "" }));
  const client = new Anthropic();
  const today = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const payload = items.map(it => ({ id: it.id, class: it.code, student: it.name, sent: when(it.at), where: it.kind === "challenge" ? "on the challenge: " + it.assignment : "in their thread", message: it.text }));
  const schema = {
    type: "object", additionalProperties: false, required: ["items"],
    properties: { items: { type: "array", items: {
      type: "object", additionalProperties: false, required: ["id", "priority", "about", "reply"],
      properties: { id: { type: "string" }, priority: { type: "string", enum: ["high", "normal", "none"] }, about: { type: "string" }, reply: { type: "string" } },
    } } },
  };
  const response = await client.messages.create({
    model: MODEL, max_tokens: 16000,
    system: [{ type: "text", text: VOICE + "\n\nToday is " + today + ".\n" + STANDING, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema } },
    messages: [{ role: "user", content: "Triage these messages and draft a reply for each. 'about' is a label of at most six words saying what the message is about. For priority 'none', reply is an empty string.\n\n" + JSON.stringify(payload, null, 1) }],
  });
  if (response.stop_reason === "refusal") throw new Error("The drafts were refused" + (response.stop_details?.explanation ? ": " + response.stop_details.explanation : "."));
  const text = response.content.filter(b => b.type === "text").map(b => b.text).join("");
  const out = JSON.parse(text);
  const byId = new Map((out.items || []).map(x => [x.id, x]));
  return items.map(it => { const d = byId.get(it.id); return { ...it, priority: d?.priority || "normal", about: d?.about || "", reply: d?.reply || "" }; });
}

const ORDER = { high: 0, normal: 1, none: 2 };
const sorted = (items) => [...items].sort((a, b) => (ORDER[a.priority] ?? 1) - (ORDER[b.priority] ?? 1) || (b.at || 0) - (a.at || 0));

const esc = (s) => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function html(items) {
  const list = sorted(items);
  const counts = { high: 0, normal: 0, none: 0 };
  list.forEach(it => { counts[it.priority] = (counts[it.priority] || 0) + 1; });
  const block = (it) => `
    <div style="margin:0 0 22px;padding:0 0 18px;border-bottom:1px solid #e5e7eb">
      <div style="font-size:13px;color:#6b7280">${esc(it.code)} · ${esc(it.name)}${it.section ? " · " + esc(it.section) : ""} · ${esc(when(it.at))}${it.kind === "challenge" ? " · on " + esc(it.assignment) : ""}</div>
      ${it.about ? `<div style="font-size:15px;font-weight:700;margin-top:4px">${esc(it.about)}</div>` : ""}
      <div style="font-size:15px;line-height:1.5;margin-top:6px;white-space:pre-wrap">${esc(it.text)}</div>
      ${it.reply ? `<div style="font-size:13px;color:#6b7280;margin-top:10px">Draft</div><div style="font-size:15px;line-height:1.5;margin-top:2px;white-space:pre-wrap;border-left:3px solid #1f2937;padding-left:10px">${esc(it.reply)}</div>` : ""}
    </div>`;
  const section = (title, p) => list.some(it => it.priority === p) ? `<h2 style="font-size:16px;margin:26px 0 12px">${title}</h2>` + list.filter(it => it.priority === p).map(block).join("") : "";
  const none = list.filter(it => it.priority === "none");
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111827;max-width:640px;padding:8px">
    <p style="font-size:15px;line-height:1.5">${list.length ? `${list.length} waiting. Send any reply from <a href="${SITE}/digest">${SITE}/digest</a>; nothing here goes to a student on its own.` : "Nothing is waiting."}</p>
    ${section("Needs you", "high")}${section("Routine", "normal")}
    ${none.length ? `<h2 style="font-size:16px;margin:26px 0 12px">No reply needed</h2><p style="font-size:15px;line-height:1.5">${none.map(it => esc(it.name) + " (" + esc(it.code) + "): " + esc(it.text.slice(0, 80))).join("<br>")}</p>` : ""}
  </div>`;
}

async function email(items) {
  if (!process.env.RESEND_API_KEY) return { sent: false, why: "No RESEND_API_KEY is set, so no email went out." };
  const day = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "long", day: "numeric" });
  const high = items.filter(it => it.priority === "high").length;
  const subject = items.length ? `Messages, ${day}: ${items.length} waiting${high ? `, ${high} need you` : ""}` : `Messages, ${day}: nothing waiting`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [TO], subject, html: html(items) }),
  });
  if (!r.ok) return { sent: false, why: "Resend said " + r.status + ": " + (await r.text()).slice(0, 300) };
  return { sent: true, to: TO, subject };
}

export default async function handler(req, res) {
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });

  // The cron. Vercel sends the secret; nobody else knows it.
  if (req.method === "GET") {
    const auth = req.headers?.authorization || "";
    if (!process.env.CRON_SECRET || auth !== "Bearer " + process.env.CRON_SECRET) return res.status(401).json({ ok: false, error: "Not the cron." });
    try {
      const items = sorted(await draft(await gather()));
      const mail = await email(items);
      return res.status(200).json({ ok: true, count: items.length, mail });
    } catch (e) { return res.status(500).json({ ok: false, error: String(e?.message || e) }); }
  }

  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  if (!(await callerAllowed(req, body))) return res.status(401).json({ ok: false, error: "Not signed in as the instructor." });
  const action = String(body.action || "");

  if (action === "preview" || action === "send") {
    try {
      const items = sorted(await draft(await gather()));
      const mail = action === "send" ? await email(items) : null;
      return res.status(200).json({ ok: true, items, mail, to: TO });
    } catch (e) { return res.status(500).json({ ok: false, error: String(e?.message || e) }); }
  }

  const classKey = String(body.classKey || ""), name = String(body.name || "").trim();
  const known = Object.values(CLASSES).some(c => c.key === classKey);
  if (!known || !name) return res.status(400).json({ ok: false, error: "A class and a student are needed." });

  if (action === "seen") {
    const plan = await rowOf(classKey + "-plan");
    if (!plan) return res.status(404).json({ ok: false, error: "No plan row." });
    const ok = await put(classKey + "-plan", { ...plan, inboxSeen: { ...(plan.inboxSeen || {}), [name]: Date.now() } });
    return ok ? res.status(200).json({ ok: true }) : res.status(502).json({ ok: false, error: "The mark did not save." });
  }

  if (action === "reply") {
    const text = String(body.text || "").trim().slice(0, 4000);
    if (!text) return res.status(400).json({ ok: false, error: "Nothing to send." });
    const cls = await rowOf(classKey);
    if (!cls) return res.status(404).json({ ok: false, error: "No class row." });
    const ts = Date.now();
    let next;
    if (body.aid) {
      const aid = String(body.aid);
      const log = [...(cls.assignmentLog?.[aid]?.[name] || []), { id: genId(), ts, type: "comment", from: "instructor", text }];
      next = { ...cls, assignmentLog: { ...(cls.assignmentLog || {}), [aid]: { ...(cls.assignmentLog?.[aid] || {}), [name]: log } } };
    } else {
      const thread = [...(cls.threads?.[name] || []), { id: genId(), ts, from: "instructor", kind: "note", text }];
      next = { ...cls, threads: { ...(cls.threads || {}), [name]: thread } };
    }
    if (!(await put(classKey, next))) return res.status(502).json({ ok: false, error: "The reply did not save." });
    const plan = await rowOf(classKey + "-plan");
    if (plan) await put(classKey + "-plan", { ...plan, inboxSeen: { ...(plan.inboxSeen || {}), [name]: ts } });
    return res.status(200).json({ ok: true, ts });
  }

  return res.status(400).json({ ok: false, error: "Unknown action." });
}
