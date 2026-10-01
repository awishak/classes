// Worksheets that live in this repo rather than in the worksheets package.
//
// The package (vendor/ishak-worksheets) carries the stakeholder map and the
// pages that read it. Worktopia is built here, on the package's tables, so
// the same addresses work for it: /<class>/worksheets/<key> for a student,
// ?s=<roster id> for the instructor reading one file, and the submits count
// on the assignment that links to it (worksheetSubmits.js reads by key, so
// nothing there needs to know which repo a sheet came from).
//
// A local worksheet is { key, title, mount, open }. mount(root, { store,
// viewer, photo, classmates, readOnly }) draws it and returns { destroy }.
// open: true opens it to every class's students; a list of class ids opens
// it to those classes only (COMM 999, the rig with Pepe and Jan, for trying
// the student path); false keeps it to the instructor. Andrew, 2026-10-01:
// "don't make it student facing yet but i will want to see it in the
// morning."

import { WORKTOPIA_KEY, WORKTOPIA_TITLE, mountWorktopia } from "./worktopia/terminal.js";

export const LOCAL_WORKSHEETS = [
  { key: WORKTOPIA_KEY, title: WORKTOPIA_TITLE, mount: mountWorktopia, open: ["comm999"] },
];

export const localWorksheet = (key) => LOCAL_WORKSHEETS.find(w => w.key === key) || null;

/** Whether a local worksheet is open to the students of a class. */
export const openTo = (local, classId) => local.open === true || (Array.isArray(local.open) && local.open.includes(classId));
