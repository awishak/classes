// COMM 3 — Digital Storytelling. Schedule, roster and assignments to come.
//
// This is the one to copy when a new class turns up: it takes the engine's
// shape from the template and then clears out everything that was COMM 999's
// content, so what is left is the fields to fill in.

import comm999 from "./comm999.js";

const comm3 = {
  ...comm999,

  id: "comm3",
  path: "/comm3",
  code: "COMM 3",
  name: "Digital Storytelling",
  quarter: "Fall 2026",
  desc: "MWF 8:00 to 9:05 am and 10:30 to 11:35 am \u00b7 Vari 133",

  // Two sittings on the same day, which is why `meets` takes a list. The Now
  // panel counts down whichever sitting the clock is inside.
  //
  // The two sections stay one class. A student belongs to a section, and the
  // surfaces made of people — the roster, attendance, discussion boards,
  // groups — filter down to the section sitting in the room. Everything else
  // is single: change a day plan, an assignment or a block once and both
  // sections have the change. The filter is not built yet, and the fields
  // below are placeholders until the real class arrives.
  meets: [
    { label: "8:00", start: "08:00", end: "09:05" },
    { label: "10:30", start: "10:30", end: "11:35" },
  ],

  accent: "#7c3aed",
  accentLight: "#f5f3ff",

  storageKey: "comm3-f26-v1",

  // "current" | "archived" — what the front page does with it.
  status: "current",
  adminPin: "333333",
  openAccess: true,

  // ─── cleared ───
  // The sequences and the seed library carry over, because those are how I
  // teach rather than what this class is about. Everything else starts empty.
  testStudent: "",
  students: [],
  scheduleWeeks: [],
  library: [],
  assignments: [],
  seedVersion: 1,
};

export default comm3;
