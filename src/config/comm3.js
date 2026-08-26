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
  desc: "Days and room TBD",

  meets: { start: "", end: "" },

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
