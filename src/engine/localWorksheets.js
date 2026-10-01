// Worksheets that live in this repo rather than in the worksheets package.
//
// The package (vendor/ishak-worksheets) carries the stakeholder map and the
// pages that read it. JobBot 5000 is built here, on the package's tables, so
// the same addresses work for it: /<class>/worksheets/<key> for a student,
// ?s=<roster id> for the instructor reading one file, and the submits count
// on the assignment that links to it (worksheetSubmits.js reads by key, so
// nothing there needs to know which repo a sheet came from).
//
// A local worksheet is { key, title, mount }. mount(root, { store, viewer,
// photo, readOnly }) draws it and returns { destroy }.

import { JOBBOT_KEY, JOBBOT_TITLE, mountJobBot } from "./jobbot/terminal.js";

export const LOCAL_WORKSHEETS = [
  { key: JOBBOT_KEY, title: JOBBOT_TITLE, mount: mountJobBot },
];

export const localWorksheet = (key) => LOCAL_WORKSHEETS.find(w => w.key === key) || null;
