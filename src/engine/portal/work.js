// What the portal knows about a student's work: which challenges they can
// see, whether each one takes submissions yet, where each one stands, the
// events that make up the flow, and the counts on My performance.
//
// Two fields on a challenge are new with the portal, both the instructor's:
//
//   visible   false hides the challenge from students altogether. Missing
//             means visible, so every challenge made before today still shows.
//   opens     "now" (or missing), "date" with `opensAt` as a datetime-local
//             string, or "never". A challenge not yet open is drawn faded with
//             Opens <day> on it and takes nothing in.

import { assignmentsOf } from "../profileTask.js";
import { statusOf, inDueOrder } from "../AssignmentCards.jsx";
import { unseenGrades, alive, htmlToText, bucketOf, letterOf } from "../grades.js";
import { deadlineOf } from "../DueCard.jsx";
import { dueWords } from "./bits.jsx";

export const visibleAssignments = (config, data) =>
  inDueOrder(assignmentsOf(config, data).filter(a => a.visible !== false));

// "open", "later" or "never".
export function opensState(asg, now = Date.now()) {
  if (asg?.opens === "never") return "never";
  if (asg?.opens === "date" && asg.opensAt) {
    const t = Date.parse(asg.opensAt);
    if (Number.isFinite(t) && t > now) return "later";
  }
  return "open";
}
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function opensWords(asg) {
  const s = opensState(asg);
  if (s === "never") return "Not open yet";
  if (s === "later") { const d = new Date(asg.opensAt); return "Opens " + WD[d.getDay()] + " " + MO[d.getMonth()] + " " + d.getDate(); }
  return "";
}

// Where one student stands on one challenge, with the portal's own state for
// a challenge that does not take submissions yet.
export function workOf(config, data, asg, name, unseen, now = Date.now()) {
  const st = statusOf(config, data, asg, name, unseen || new Set(), now);
  if (st.state === "open" && opensState(asg, now) !== "open") return { ...st, state: "closed-until", opens: opensWords(asg) };
  return st;
}

export const unseenOf = (config, data, name) => new Set(unseenGrades(config, data, name).map(u => u.aid));

// The next thing this student owes: the first open challenge with nothing in.
export function nextOwedOf(config, data, name, now = Date.now()) {
  const unseen = unseenOf(config, data, name);
  return visibleAssignments(config, data).map(asg => ({ asg, st: workOf(config, data, asg, name, unseen, now) }))
    .find(r => r.st.state === "open") || null;
}

// My performance: how many are graded, to do, and missed.
export function counts(config, data, name) {
  const unseen = unseenOf(config, data, name);
  const out = { graded: 0, todo: 0, missed: 0, turnedIn: 0 };
  visibleAssignments(config, data).forEach(asg => {
    const st = workOf(config, data, asg, name, unseen);
    if (st.state === "graded") out.graded++;
    else if (st.state === "missed") out.missed++;
    else if (st.state === "turnedIn") out.turnedIn++;
    else if (st.state === "open" || st.state === "closed-until") out.todo++;
  });
  return out;
}

// ─── the flow ───
//
// Every event between this student and the class, newest first: what they
// turned in, what was said about each piece, each grade, every message either
// way, every note he wrote for a class day, and every due date a challenge
// has had. Each carries the words the row says and the chips it answers to.
//
//   tags  work      submissions, grades, due dates, what was said on a challenge
//         messages  the thread with Dr. Ishak
//         feedback  grades and what he said on a challenge
//         notes     his notes to the class
const dayStart = (s) => { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d.getTime() : 0; };

export function flowOf(config, data, name, now = Date.now()) {
  const out = [];
  const push = (e) => { if (e.at) out.push(e); };
  const assignments = visibleAssignments(config, data);
  const titles = Object.fromEntries(assignments.map(a => [a.id, a.title]));

  assignments.forEach(asg => {
    const log = alive(data?.assignmentLog?.[asg.id]?.[name]);
    log.forEach(e => {
      if (e.type === "submission") {
        push({ id: e.id, at: e.ts, who: "me", tint: "me", tags: ["work"], aid: asg.id,
          say: ["You turned in ", asg.title], text: [e.why ? "Late: " + e.why : "", e.text || ""].filter(Boolean).join("\n"), link: e.link || "" });
      } else if (e.type === "regrade") {
        push({ id: e.id, at: e.ts, who: "me", tint: "me", tags: ["work"], aid: asg.id,
          say: ["You asked for a regrade on ", asg.title], text: e.text || "", link: e.link || "" });
      } else if (e.type === "comment") {
        const mine = e.from === "student";
        push({ id: e.id, at: e.ts, who: mine ? "me" : "dr", tint: mine ? "me" : "dr", tags: mine ? ["work"] : ["work", "feedback"], aid: asg.id,
          say: mine ? ["You wrote on ", asg.title] : [null, asg.title, " has a comment"], text: htmlToText(e.html || e.text) });
      } else if (e.type === "grade") {
        const b = e.bucket ? bucketOf(e.bucket) : null;
        push({ id: e.id, at: e.ts, who: "class", tint: "done", tags: ["work", "feedback"], aid: asg.id,
          say: ["Your ", asg.title, " submission has been graded"], grade: e.letter || letterOf(e.score), means: b?.means || "", text: htmlToText(e.html), weight: asg.weight });
      }
    });
    (data?.dueLog?.[asg.id] || []).forEach((d, i) => {
      push({ id: "due-" + asg.id + "-" + i, at: d.at, who: "class", tint: "due", tags: ["work"], aid: asg.id,
        say: ["Your ", asg.title, " is due " + dueWords(d.due, d.dueTime)], weight: asg.weight,
        btn: deadlineOf(d.due, d.dueTime) > now ? "Open" : "" });
    });
  });

  (data?.threads?.[name] || []).forEach(m => {
    const mine = m.from !== "instructor";
    const text = String(m.text || "").trim();
    if (!text && m.kind === "got_it") return;
    push({ id: m.id, at: m.ts, who: mine ? "me" : "dr", tint: mine ? "me" : "dr", tags: ["messages"],
      say: mine ? ["You wrote"] : [null, "", "Message from " + (config.instructor?.name || "your instructor")], text });
  });

  Object.entries(data?.dayPlans || {}).forEach(([date, plan]) => {
    const note = String(plan?.studentNote || "").trim();
    if (!note) return;
    push({ id: "note-" + date, at: dayStart(date), who: "dr", tint: "dr", tags: ["notes"], say: [null, "", "Note to the class"], text: note, date });
  });

  return out.sort((x, y) => y.at - x.at).map(e => ({ ...e, title: e.aid ? titles[e.aid] : "" }));
}

export const FLOW_FILTERS = [
  { id: "all", label: "All", kind: "" },
  { id: "work", label: "My work and grades", kind: "due" },
  { id: "messages", label: "Messages", kind: "dr" },
  { id: "feedback", label: "Feedback", kind: "done" },
];
