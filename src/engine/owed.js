// What students have written that still waits on Andrew, every kind, by one
// set of rules. The inbox page, the count in the top bar, the bold on a
// class's Messages list and the late notes on To Grade all read this file.
//
// Andrew, 2026-11-13: "it's really about me responding to stuff. i need an
// inbox ... i want this to work for an idiot ... how would you make sure
// nothing slips between the cracks." And: "anything students write to me
// that's just about 'oh I turned it in late' should go to the grading inbox,
// not the message inbox."
//
// The rule. Something a student wrote waits until he does something about
// it: a reply, Done, or Later. Opening it does not clear it. Before this a
// thread stopped waiting the moment he opened it (inboxSeen), and 18 COMM 3
// threads ended on the student's message with nothing saying so.
//
//   thread     a direct message; waits while the last word is the student's
//              and it is more than a thumbs up or a short thank-you
//   challenge  a message on a challenge; the rule AssignmentsCard already
//              keeps (unanswered), minus regrade asks, which are grading
//   request    a request or a bug from the More page, until marked done
//
// Each item is routed to "msg" (the inbox) or "late" (To Grade). A note
// about turning something in late is "late"; LATE below guesses, and he can
// move any item either way, which is remembered for that message.
//
// Where the marks live, all on the plan row so only his session writes them:
//   inboxDone[key]  = ts of the student's message that was marked done
//   inboxLater[key] = { ts, until }   hidden until then
//   inboxRoute[key] = { ts, to }      his move, for that message
// A newer message from the student has a newer ts, so none of the three
// carries over to it.

import { alive } from "./grades.js";
import { unanswered, lastFrom, appreciatePatch } from "./AssignmentsCard.jsx";
import { textToHtml } from "./feedback.js";
import { genId } from "../utils.jsx";

// A note that is only about turning work in late: it says the work went in
// (or will) and says late, and asks nothing. Tried on the live threads
// 2026-11-13, where a looser rule took "sorry for the late notice" and sick
// notes for lateness; anything this misses stays in the inbox, the safe side.
const ACT = "(turn(ed|ing)?|submit(ted|ting)?|hand(ed|ing)?|upload(ed|ing)?|sent|finish(ed|ing)?)";
export const LATE = new RegExp("\\b" + ACT + "\\b[^.?!\\n]{0,40}\\blate\\b|\\blate\\b[^.?!\\n]{0,25}\\b" + ACT + "\\b|\\blate (submission|work|assignment|turn-?in)\\b|\\b(it|this|that|mine)('s| is| was| will be) (a (bit|little|day) )?late\\b", "i");
export const aboutLateness = (text) => { const t = String(text || ""); return LATE.test(t) && !t.includes("?"); };

// A thank-you or an okay closes a conversation the way a thumbs up does.
const THANKS = /^\W*(got it|ok(ay)?|perfect|great|awesome|sounds good|will do|thanks?( you)?( so much)?|thank you)\b/i;
const justThanks = (m) => m.kind === "got_it" || (THANKS.test(m.text || "") && (m.text || "").length <= 80 && !(m.text || "").includes("?"));

const RED_AFTER = 2 * 86400000;
export const isOverdue = (item, now = Date.now()) => now - item.since > RED_AFTER;

const wordsOf = (m) => m.text || (m.kind === "meeting" ? "Make a meeting" : "");

/** A student's thread as an item, or null when nothing in it waits. */
export function threadItem(data, name) {
  const thread = (data?.threads?.[name] || []).filter(m => !m.deleted);
  let i = thread.length;
  while (i > 0 && thread[i - 1].from === "student") i--;
  // What the student has said since his last word, thumbs up aside.
  const theirs = thread.slice(i).filter(m => m.kind !== "got_it");
  if (!theirs.length || theirs.every(justThanks)) return null;
  const last = theirs[theirs.length - 1];
  const key = "t:" + name;
  if ((data?.inboxDone?.[key] || 0) >= (last.ts || 0)) return null;
  return { key, kind: "thread", name, ts: last.ts || 0, since: theirs[0].ts || 0, text: theirs.map(wordsOf).filter(Boolean).join("\n"), thread };
}

/** Whether a thread waits on him. The one rule, for every surface. */
export const threadWaiting = (data, name) => !!threadItem(data, name);

function challengeItems(data, assignments) {
  const out = [];
  (assignments || []).forEach(asg => {
    const byStudent = data?.assignmentLog?.[asg.id] || {};
    Object.keys(byStudent).forEach(name => {
      const log = alive(byStudent[name]);
      if (!unanswered(log)) return;
      const theirs = lastFrom(log, "student");
      if (theirs.type === "regrade") return;   // counted on To Grade already
      out.push({ key: "c:" + asg.id + ":" + name, kind: "challenge", name, aid: asg.id, title: asg.title, eid: theirs.id, ts: theirs.ts || 0, since: theirs.ts || 0, text: theirs.text || "", log });
    });
  });
  return out;
}

const requestItems = (data) => (data?.requests || []).filter(r => !r.done && !r.deleted)
  .map(r => ({ key: "r:" + r.id, kind: "request", name: r.from || "", rid: r.id, bug: r.kind === "bug", ts: r.ts || 0, since: r.ts || 0, text: r.text || "" }));

const routeOf = (data, item) => {
  const set = data?.inboxRoute?.[item.key];
  if (set && set.ts === item.ts) return set.to;
  return item.kind !== "request" && aboutLateness(item.text) ? "late" : "msg";
};

/**
 * Everything waiting in one class: { msg, late, later }, each oldest first.
 * `names` limits it to the roster's real students, so a test student's
 * thread is nobody's inbox.
 */
export function owedOf(data, assignments, names, now = Date.now()) {
  if (!data) return { msg: [], late: [], later: [] };
  const known = names ? new Set(names) : null;
  const threads = Object.keys(data.threads || {}).filter(n => !known || known.has(n)).map(n => threadItem(data, n)).filter(Boolean);
  const all = [...threads, ...challengeItems(data, assignments).filter(i => !known || known.has(i.name)), ...requestItems(data)];
  const out = { msg: [], late: [], later: [] };
  all.forEach(item => {
    const hold = data.inboxLater?.[item.key];
    const route = routeOf(data, item);
    if (hold && hold.ts === item.ts && hold.until > now) out.later.push({ ...item, route, until: hold.until });
    else out[route].push({ ...item, route });
  });
  Object.values(out).forEach(list => list.sort((x, y) => x.since - y.since));
  return out;
}

// ─── what he can do to an item ───

const mark = (data, slot, key, value) => ({ ...data, [slot]: { ...(data[slot] || {}), [key]: value } });

/** Done, with nothing sent. A challenge message is appreciated, the mark it already had. */
export const donePatch = (data, item) =>
  item.kind === "challenge" ? appreciatePatch(data, item.aid, item.name, item.eid, "instructor")
    : item.kind === "request" ? { ...data, requests: (data.requests || []).map(r => r.id === item.rid ? { ...r, done: Date.now() } : r) }
    : mark(data, "inboxDone", item.key, item.ts);

/** His reply, where the student will read it. Replying is what clears the item. */
export const replyPatch = (data, item, text, now = Date.now()) => {
  const words = String(text || "").trim();
  if (!words) return data;
  if (item.kind === "challenge") {
    const al = { ...(data.assignmentLog || {}) };
    const byStudent = { ...(al[item.aid] || {}) };
    byStudent[item.name] = [...(byStudent[item.name] || []), { id: genId(), ts: now, type: "comment", from: "instructor", html: textToHtml(words) }];
    al[item.aid] = byStudent;
    return { ...data, assignmentLog: al };
  }
  const threads = { ...(data.threads || {}) };
  threads[item.name] = [...(threads[item.name] || []), { id: genId(), ts: now, from: "instructor", kind: "note", text: words }];
  const next = { ...data, threads };
  return item.kind === "request" ? donePatch(next, item) : next;
};

export const laterPatch = (data, item, until) => mark(data, "inboxLater", item.key, { ts: item.ts, until });
export const routePatch = (data, item, to) => mark(data, "inboxRoute", item.key, { ts: item.ts, to });

/** A comment kept as HTML, as the words in it. */
export const plain = (html) => String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p>/gi, "\n\n").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
