// How late a piece of work was, judged on the first time it went in.
//
// Andrew, 2026-10-28: "no grace window but you tell me if they are 3 min late
// vs 3 days." And: "if a student submits something and it's complete and then
// they resubmit it and just kind of fix something, that's fine. You can count
// it as on time." So the first submission is the one that is judged, against
// the moment the work was due (deadlineOf: the date and the time, end of day
// when there is no time), and the answer is how long after that it landed.
//
// The log is the assignment's entries for one student, worksheet submits laid
// over (worksheetSubmits.js, which uses the sheet's first_submitted_at once
// sql/worksheet-first-submitted.sql has run).

import { deadlineOf } from "./DueCard.jsx";

const alive = (log) => (log || []).filter(e => !e.deleted);

export const firstSubmission = (log) =>
  alive(log).filter(e => e.type === "submission").sort((a, b) => (a.ts || 0) - (b.ts || 0))[0] || null;

export const lateBy = (ts, deadline) => (ts && deadline && ts > deadline ? ts - deadline : 0);

// "3 min late", "2 hr 10 min late", "3 days late".
export function lateText(ms) {
  if (!(ms > 0)) return "";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "late by under a minute";
  if (min < 60) return min + " min late";
  const hr = Math.floor(min / 60), m = min % 60;
  if (hr < 24) return hr + " hr" + (m ? " " + m + " min" : "") + " late";
  const days = Math.floor(hr / 24), h = hr % 24;
  return days + (days === 1 ? " day" : " days") + (h ? " " + h + " hr" : "") + " late";
}

export function latenessOf(asg, log) {
  const first = firstSubmission(log);
  const deadline = asg ? deadlineOf(asg.due, asg.dueTime) : null;
  const ms = first ? lateBy(first.ts, deadline) : 0;
  return { first, deadline, ms, late: ms > 0, text: lateText(ms) };
}
