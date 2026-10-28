// Every assignment turned in like a worksheet.
//
// Andrew, 2026-10-25: "moving forward, for all my classes, every assignment
// submission should feel like a worksheet submission. we have that now with
// most assignments, but even something like a google doc submission: let's
// make students a beautiful submission page, with instructions, maybe images,
// and ask them a couple of questions, like headline, what did you think of
// this assignment, biggest finding. so we can store this for later if we
// want, esp for winter 2026 classes."
//
// So an assignment carries a page: { intro, images, questions }. Students
// read the intro and the pictures on the assignment's own page, answer the
// questions, and press Submit. The answers are worksheet rows
// (worksheet_sheets and worksheet_answers, through worktopia/store.js), one
// sheet per student per assignment, keyed asg-<term>-<assignment id>, so a
// Winter COMM 3 that reuses an id never lands on Fall's rows. The submit
// counts on the assignment through worksheetSubmits.js, the same way the
// hand-built sheets count, so Grade view and the cards need nothing new.
//
// Which assignments: Andrew, same day, "just build it for assignments from
// after next week." An assignment saved with `page` set has one; `page:
// false` has none; anything older goes by its due date against CUTOVER.
// This file is plain JS so the smoke run can drive it.

import { deadlineOf } from "./DueCard.jsx";
import { isProfileTask } from "./profileTask.js";

// The first day an undecided assignment gets the page. Asked for on Saturday
// October 25; "after next week" is the week of November 2.
export const CUTOVER = "2026-11-02";

// "Fall 2026" -> "fall26". The sheet key has to be letters, digits and dashes.
export const termTag = (config) => String(config?.quarter || "term").toLowerCase().replace(/20(\d\d)/, "$1").replace(/[^a-z0-9]+/g, "") || "term";
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
export const SHEET_PREFIX = "asg-";
export const sheetKeyOf = (config, asg) => SHEET_PREFIX + termTag(config) + "-" + slug(asg?.id);

// The questions every new assignment starts with. Andrew's three, with the
// link to the work first. Each is editable per assignment.
export const DEFAULT_QUESTIONS = [
  { field: "link", ask: "A link to your work", kind: "link" },
  { field: "headline", ask: "Your headline", kind: "line" },
  { field: "thoughts", ask: "What did you think of this assignment?", kind: "text" },
  { field: "finding", ask: "Your biggest finding", kind: "text" },
];
export const KINDS = [["line", "One line"], ["text", "A paragraph"], ["link", "A link"]];

// A field name the table allows: letters only. Built from the question once,
// kept when the question is reworded, so the answers stay attached.
export function fieldFor(ask, taken = []) {
  const words = String(ask || "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  const skip = new Set(["a", "an", "the", "your", "you", "what", "did", "do", "of", "to", "this", "is", "in", "on", "for", "and", "or", "about", "with", "that", "it", "think"]);
  let base = words.filter(w => !skip.has(w)).slice(0, 2).join("") || words.slice(0, 2).join("") || "q";
  base = base.slice(0, 24);
  let out = base, n = 2;
  while (taken.includes(out)) out = base + "bcdefghijklmnopqrstuvwxyz"[Math.min(n++ - 2, 25)];
  return out;
}

// Every question with a field. One without (typed into the editor) is named
// here, so a page written by hand in a config works too.
export const withFields = (questions) => {
  const taken = (questions || []).map(q => q.field).filter(Boolean);
  return (questions || []).map(q => {
    if (q.field) return q;
    const field = fieldFor(q.ask, taken);
    taken.push(field);
    return { ...q, field };
  });
};

/** The page as the student reads it, defaults filled in. */
export const pageOf = (asg) => {
  const p = asg?.page && typeof asg.page === "object" ? asg.page : {};
  return { intro: String(p.intro || ""), images: Array.isArray(p.images) ? p.images.filter(i => i && i.src) : [],
    questions: withFields(Array.isArray(p.questions) ? p.questions.filter(q => q && String(q.ask || "").trim()) : DEFAULT_QUESTIONS) };
};

/** Whether an assignment takes its work on a submission page. */
export function hasPage(asg, config) {
  if (!asg || isProfileTask(asg)) return false;
  if (asg.page === false) return false;
  // A challenge with a worksheet of its own (Worktopia, 3x5, the visual
  // story) is turned in there, and takes no second page.
  if (/\/comm\w+\/worksheets\//.test(String(asg.instructionsUrl || ""))) return false;
  if (asg.page && typeof asg.page === "object") return true;
  const at = deadlineOf(asg.due, asg.dueTime);
  return !!at && at >= Date.parse(CUTOVER + "T00:00:00");
}

/** The questions still blank, for the Submit button. The link counts; the rest are asked, not required. */
export const missingOf = (page, answers) => page.questions.filter(q => q.kind === "link" && !String(answers?.[q.field] || "").trim());

/** Whether a page's address field holds a web address. */
export const LINK = /^https?:\/\/\S+$/i;

// Where submissions stand against the assignment's own switches: not open
// yet, open, or closed. Mirrors what the one-box page did.
export function windowOf(asg, now = Date.now()) {
  if (asg?.opens === "never") return { state: "later", at: null };
  if (asg?.opens === "date" && asg.opensAt && !Number.isNaN(Date.parse(asg.opensAt)) && Date.parse(asg.opensAt) > now) return { state: "later", at: new Date(asg.opensAt) };
  if (asg?.closeAt && !Number.isNaN(Date.parse(asg.closeAt)) && Date.parse(asg.closeAt) < now) return { state: "closed", at: new Date(asg.closeAt) };
  return { state: "open", at: null };
}

/** The assignments of a class that carry a page, with their sheet keys. */
export const pagedAssignments = (config, data) =>
  (data?.assignments || config?.assignments || []).filter(a => hasPage(a, config)).map(a => ({ asg: a, key: sheetKeyOf(config, a) }));
