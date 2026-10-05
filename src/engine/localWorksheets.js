// Worksheets that live in this repo rather than in the worksheets package.
//
// The package (vendor/ishak-worksheets) carries the stakeholder map and the
// pages that read it. Worktopia is built here, on the package's tables, so
// the same addresses work for it: /<class>/worksheets/<key> for a student,
// ?s=<roster id> for the instructor reading one file, and the submits count
// on the assignment that links to it (worksheetSubmits.js reads by key, so
// nothing there needs to know which repo a sheet came from).
//
// A local worksheet is { key, title, mount, open, classes? }. mount(root, {
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

export const LOCAL_WORKSHEETS = [
  // Andrew, 2026-10-01: "let's open it now." Weekly Challenge 2, due Oct 7.
  { key: WORKTOPIA_KEY, title: WORKTOPIA_TITLE, mount: mountWorktopia, open: ["comm999", "comm118"], classes: ["comm118", "comm999"] },
  // Closed until he opens it from the Worksheets page.
  { key: THREE_BY_FIVE_KEY, title: THREE_BY_FIVE_TITLE, mount: mountThreeByFive, open: ["comm999"], classes: ["comm3", "comm999"] },
];

export const localWorksheet = (key) => LOCAL_WORKSHEETS.find(w => w.key === key) || null;

// The package's sheets carry no class of their own. The stakeholder map is the
// COMM 118 AFL Grand Final sheet. Andrew, 2026-10-04, on COMM 3: "all i see
// are afl and worktopia ... those shouldn't even be in there."
const PACKAGE_CLASSES = { "stakeholder-map": ["comm118", "comm999"] };

/** Whether a worksheet, local or from the package, belongs to a class. */
export const listedFor = (sheet, classId) => { const list = sheet.classes || PACKAGE_CLASSES[sheet.key]; return !list || list.includes(classId); };

/** Whether a local worksheet is open to the students of a class. data is the class, for the switch. */
export const openTo = (local, classId, data) => {
  const set = data?.worksheetsOpen?.[local.key];
  if (typeof set === "boolean") return set;
  return local.open === true || (Array.isArray(local.open) && local.open.includes(classId));
};
