// Worksheets that live in this repo rather than in the worksheets package.
//
// The package (vendor/ishak-worksheets) carries the stakeholder map and the
// pages that read it. Worktopia is built here, on the package's tables, so
// the same addresses work for it: /<class>/worksheets/<key> for a student,
// ?s=<roster id> for the instructor reading one file, and the submits count
// on the assignment that links to it (worksheetSubmits.js reads by key, so
// nothing there needs to know which repo a sheet came from).
//
// A local worksheet is { key, title, mount, open, classes?, review?, read? }.
// review is the instructor's page for the whole class at ?review, and read,
// when a sheet has one, draws one student's file at ?s=<id> in place of the
// read-only mount. mount(root, {
// store, viewer, photo, classmates, readOnly, theme }) draws it and returns
// { destroy }. open: true opens it to every class's students; a list of class
// ids opens it to those classes only (COMM 999, the rig with Pepe and Jan, for
// trying the student path); false keeps it to the instructor. Andrew,
// 2026-10-01: "don't make it student facing yet but i will want to see it in
// the morning."
//
// The instructor can also open a sheet from the Worksheets page, the switch
// beside its address. That writes worksheetsOpen on the class's plan row,
// { [key]: true | false }, and a value there wins over `open`. Andrew,
// 2026-10-04, on 3x5: "a worksheet that I can enable for students."
//
// classes, when given, lists the classes a sheet belongs to; the Worksheets
// page shows it only there.

import { WORKTOPIA_KEY, WORKTOPIA_TITLE, mountWorktopia } from "./worktopia/terminal.js";
import { THREE_BY_FIVE_KEY, THREE_BY_FIVE_TITLE, mountThreeByFive } from "./threebyfive/sheet.js";
import { ThreeByFiveReview, ThreeByFiveRoll } from "./threebyfive/review.jsx";
import { VISUAL_PRE_KEY, VISUAL_PRE_TITLE, mountVisualPre, VISUAL_PRE_2_KEY, VISUAL_PRE_2_TITLE, mountVisualPre2 } from "./visualstory/pre.jsx";
import PreReview from "./visualstory/review.jsx";
import { VISUAL_STORY_KEY, VISUAL_STORY_TITLE, mountVisualStory } from "./visualstory/story.jsx";
import StoryReview from "./visualstory/storyreview.jsx";

export const LOCAL_WORKSHEETS = [
  // Andrew, 2026-10-01: "let's open it now." Weekly Challenge 2, due Oct 7.
  { key: WORKTOPIA_KEY, title: WORKTOPIA_TITLE, mount: mountWorktopia, open: ["comm999", "comm118"], classes: ["comm118", "comm999"] },
  // Andrew, 2026-10-16: "i need to make 3x5 available for my comm 3 classes."
  // The rolls read big, one page a group, and the class's index. Andrew,
  // 2026-10-21: "a nice page for each submission for each class."
  { key: THREE_BY_FIVE_KEY, title: THREE_BY_FIVE_TITLE, mount: mountThreeByFive, review: ThreeByFiveReview, read: ThreeByFiveRoll, open: ["comm999", "comm3"], classes: ["comm3", "comm999"] },
  // The visual story's topic page, planned 2026-10-13. Tried in COMM 999 with
  // Marty first, then opened to COMM 3 from the Worksheets page. review is the
  // instructor's page at ?review.
  { key: VISUAL_PRE_KEY, title: VISUAL_PRE_TITLE, mount: mountVisualPre, review: PreReview, open: ["comm999"], classes: ["comm3", "comm999"] },
  // A second topic on its own sheet. Andrew, 2026-10-19: "some students want
  // to do a whole second preproduction on a different topic." Open wherever
  // the first is, from the start.
  { key: VISUAL_PRE_2_KEY, title: VISUAL_PRE_2_TITLE, mount: mountVisualPre2, review: PreReview, open: ["comm999", "comm3"], classes: ["comm3", "comm999"] },
  // The visual story portal itself, planned 2026-10-13. COMM 999 first.
  { key: VISUAL_STORY_KEY, title: VISUAL_STORY_TITLE, mount: mountVisualStory, review: StoryReview, open: ["comm999"], classes: ["comm3", "comm999"] },
];

export const localWorksheet = (key) => LOCAL_WORKSHEETS.find(w => w.key === key) || null;

// The package's sheets carry no class of their own. The stakeholder map is the
// COMM 118 AFL Grand Final sheet. Andrew, 2026-10-04, on COMM 3: "all i see
// are afl and worktopia ... those shouldn't even be in there."
const PACKAGE_CLASSES = { "stakeholder-map": ["comm118", "comm999"] };

/** Whether a worksheet, local or from the package, belongs to a class. */
export const listedFor = (sheet, classId) => { const list = sheet.classes || PACKAGE_CLASSES[sheet.key]; return !list || list.includes(classId); };

/** Whether a local worksheet is open to the students of a class. data is the class, for the switch. */
export const openTo = (local, classId, data, now = Date.now()) => {
  const set = data?.worksheetsOpen?.[local.key];
  if (typeof set === "boolean") return set;
  // A time: the sheet opens on its own then. Andrew, 2026-10-13, on
  // pre-production: "open the assignment starting tonight at 11:59 pm."
  if (typeof set === "string" && !Number.isNaN(Date.parse(set))) return now >= Date.parse(set);
  return local.open === true || (Array.isArray(local.open) && local.open.includes(classId));
};

/** When a sheet set to open at a time opens, or null. */
export const opensAt = (local, data) => {
  const set = data?.worksheetsOpen?.[local.key];
  return typeof set === "string" && !Number.isNaN(Date.parse(set)) ? new Date(set) : null;
};
