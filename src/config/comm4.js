// COMM 4 — Approaches to Communication Research. On the shared engine.
//
// Its own storageKey, so nothing here touches the existing /comm4 hub, which
// still runs on the older forked file until this one has real content in it.

import comm999 from "./comm999.js";

const comm4 = {
  ...comm999,

  id: "comm4",
  path: "/comm4",
  code: "COMM 4",
  name: "Approaches to Communication Research",
  quarter: "Spring 2026",
  desc: "MWF 11:45 am to 12:50 pm · Lucas 207",

  meets: { start: "11:45", end: "12:50" },

  // The same colour lifted for text after dark: the class colour reads on
  // white and vanishes on the dark card (crimson 2.15:1, purple 3.03:1).
  accent: "#047857",
  accentDark: "#5ecfa8",
  accentLight: "#ecfdf5",

  storageKey: "comm4-s26-v1",

  // "current" | "archived" — what the front page does with it.
  status: "archived",
  adminPin: "444444",

  openAccess: true,

  // Spring 2026, ported out of the old forked hub into the engine's shape by
  // scripts/port-spring.mjs. The store holds the real term; these blanks stop
  // the template's sports schedule showing through wherever the port left a gap.
  scheduleWeeks: [],
  library: [],
  assignments: [],
  students: [],
  testStudent: "",
};

export default comm4;
