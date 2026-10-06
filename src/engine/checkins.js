// The check-ins: week 4 and week 8, in every class.
//
// Andrew, 2026-10-06: "a check in at the start of week 4 and the start of
// week 8. You show them a card with their work so far and evals, and we ask:
// how are things going in the class for you right now? What should you do
// differently going forward to reach your goals in the class (and remind them
// of what they said their goal was). What can the course or instructor do
// differently to support you? What is your biggest challenge for the rest of
// the quarter?" And: "just create it as a challenge and make me the same kind
// of sorting for it", ungraded, open the whole week, editable, "make it
// standard in all classes."
//
// Each check-in is a challenge built here from the term, the way the card
// challenge is built in profileTask.js, so no class has to carry it. It opens
// on the Monday of its week and is due that Sunday at 11:59 PM.
//
// The answers live on the class row, which a student may write:
//
//   data.checkins[checkinId][studentName] = { going, differently, support,
//     challenge, at, updatedAt }
//
// The first Submit also drops a submission into the challenge's log, so Grade
// view, the turned-in counts and the student's own list all read it as
// turned in without knowing anything about check-ins.

import { parseDay } from "./days.js";

export const CHECKIN_WEEKS = [4, 8];
export const checkinId = (week) => "checkin-" + week;
export const isCheckin = (asg) => asg?.completes === "checkin";

// The questions, in his words, in the order he gave them. The goal reminder
// sits above `differently`.
export const CHECKIN_QUESTIONS = [
  { id: "going", text: "How are things going in the class for you right now?" },
  { id: "differently", text: "What should you do differently going forward to reach your goals in the class?" },
  { id: "support", text: "What can the course or instructor do differently to support you?" },
  { id: "challenge", text: "What is your biggest challenge for the rest of the quarter?" },
];
export const NO_GOAL = "You didn't write a goal during week one. Please write one now.";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const short = (d) => MONTHS[d.getMonth()] + " " + d.getDate();
const pad = (n) => String(n).padStart(2, "0");

// The Monday and Sunday around the first class day of week N.
export function weekSpan(weeks, n) {
  const w = (weeks || [])[n - 1];
  const first = w && (w.dates || []).map(s => parseDay(s)).filter(Boolean).sort((x, y) => x - y)[0];
  if (!first) return null;
  const mon = new Date(first.getFullYear(), first.getMonth(), first.getDate() - ((first.getDay() + 6) % 7));
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return { mon, sun };
}

const weeksOf = (config, data) => (data?.schedule?.length ? data.schedule : config?.scheduleWeeks) || [];

// The check-in challenges this class has, from its term. A class with no
// fourth week yet has no week 4 check-in yet.
export function checkinTasksOf(config, data) {
  const weeks = weeksOf(config, data);
  return CHECKIN_WEEKS.map(n => {
    const span = weekSpan(weeks, n);
    if (!span) return null;
    const { mon } = span;
    return {
      id: checkinId(n),
      title: "Week " + n + " check-in",
      due: short(span.sun),
      dueTime: "11:59 PM",
      weight: 0,
      scale: "complete",
      completes: "checkin",
      week: n,
      opens: "date",
      opensAt: mon.getFullYear() + "-" + pad(mon.getMonth() + 1) + "-" + pad(mon.getDate()) + "T00:00",
      description: "",
      instructionsUrl: "",
      rubric: [],
    };
  }).filter(Boolean);
}

// Open from Monday morning to the end of Sunday.
export function checkinOpen(asg, now = Date.now()) {
  if (!isCheckin(asg)) return false;
  const start = Date.parse(asg.opensAt);
  const end = parseDay(asg.due);
  if (!Number.isFinite(start) || !end) return false;
  const close = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).getTime();
  return now >= start && now <= close;
}

export const answersOf = (data, id, name) => data?.checkins?.[id]?.[name] || null;

// The check-in this student still owes right now, if any: the card in front
// of the site.
export function checkinDue(config, data, name, now = Date.now()) {
  if (!name) return null;
  return checkinTasksOf(config, data).find(asg => checkinOpen(asg, now) && !answersOf(data, asg.id, name)) || null;
}

// Saving: the answers, the goal on the profile when the student had none,
// and a submission in the log the first time.
export function saveCheckin(data, asg, name, answers, goal, now = Date.now()) {
  const prev = answersOf(data, asg.id, name);
  const checkins = { ...(data?.checkins || {}) };
  checkins[asg.id] = { ...(checkins[asg.id] || {}), [name]: { ...answers, at: prev?.at || now, updatedAt: now } };
  let next = { ...(data || {}), checkins };
  if (String(goal || "").trim()) {
    const profiles = { ...(next.profiles || {}) };
    profiles[name] = { ...(profiles[name] || {}), goals: String(goal).trim() };
    next = { ...next, profiles };
  }
  if (!prev) {
    const al = { ...(next.assignmentLog || {}) };
    const byStudent = { ...(al[asg.id] || {}) };
    byStudent[name] = [...(byStudent[name] || []), { id: "ci-" + now.toString(36), ts: now, type: "submission", link: "", text: "", checkin: true }];
    al[asg.id] = byStudent;
    next = { ...next, assignmentLog: al };
  }
  return next;
}
