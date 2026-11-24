// What the Primary Bold pages read, in the shapes their pieces draw. Nothing is
// worked out again here: every fact comes from the function the live page
// already uses (portal/work.js, AssignmentCards.jsx, grades.js), and this
// file only renames a state to the mockup's five.

import { visibleAssignments, workOf, unseenOf, opensWords } from "../portal/work.js";
import { isOngoing } from "../AssignmentCards.jsx";
import { profileOf } from "../Face.jsx";
import { dueWords } from "../portal/bits.jsx";

// The site's states, as the blocks' colours: graded, to do, turned in, not
// open yet, ongoing, and late (coral, "coral is late").
const STATE = { graded: "done", turnedIn: "in", open: "todo", missed: "late", "closed-until": "off", ongoing: "on", none: "off" };

/** What a block carries: "ok" draws the check, a letter is the letter, a longer word stays off the block. */
export function markOf(st) {
  if (!st || st.state !== "graded") return "";
  const l = String(st.letter || "").trim();
  if (/^complete$/i.test(l)) return "ok";
  return l.length <= 2 ? l : "";
}

/** The words under a challenge's title. */
export function lineFor(asg, st) {
  const due = dueWords(asg.due, asg.dueTime);
  if (st.state === "graded") return "Graded";
  if (st.state === "turnedIn") return "Turned in, due " + due;
  if (st.state === "closed-until") return st.opens || opensWords(asg) || "Not open yet";
  if (st.state === "ongoing") return "Ongoing, all quarter";
  if (st.state === "missed") return "Missed, was due " + due;
  if (st.state === "none") return "No submission needed";
  return "Due " + due;
}

/** One student's quarter, in due order: [{ id, asg, st, title, weight, state, mark }]. */
export function rowsFor(config, data, name) {
  const unseen = unseenOf(config, data, name);
  const rows = visibleAssignments(config, data).map(asg => {
    const st = workOf(config, data, asg, name, unseen);
    return { id: asg.id, asg, st, title: asg.title, weight: Number(asg.weight) || 0, state: STATE[st.state] || "off", mark: markOf(st) };
  });
  // What runs all quarter has no due date, so it closes the strip and the list, as in the mockups.
  return [...rows.filter(r => !isOngoing(r.asg)), ...rows.filter(r => isOngoing(r.asg))];
}

/** The day a challenge is due, for a list: "Wed Nov 11", or All quarter. */
export const dueDay = (asg) => (isOngoing(asg) ? "All quarter" : dueWords(asg.due, ""));

/** A person's photo address, or "" when there is only a name to go on. */
export function photoOf(data, name) {
  const a = String(profileOf(data, name)?.avatar || "");
  return /^(data:image\/|https?:\/\/)/.test(a) ? a : "";
}

const MONTHS = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", May: "May", Jun: "June", Jul: "July", Aug: "August", Sep: "September", Oct: "October", Nov: "November", Dec: "December" };
/** The month a due date falls in, for the headings on My work. */
export const monthOf = (due) => { const m = String(due || "").trim().split(/\s+/)[0]; return MONTHS[m] || "All quarter"; };
