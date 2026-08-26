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
  quarter: "Fall 2026",
  desc: "MWF 11:45 am to 12:50 pm · Lucas 207",

  meets: { start: "11:45", end: "12:50" },

  accent: "#059669",
  accentLight: "#ecfdf5",

  storageKey: "comm4-f26-v1",

  // "current" | "archived" — what the front page does with it.
  status: "archived",
  adminPin: "444444",

  openAccess: true,
};

export default comm4;
