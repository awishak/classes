// COMM 2 — Public Speaking. On the shared engine.
//
// Its own storageKey, so nothing here touches the existing /comm2 hub, which
// still runs on the older forked file until this one has real content in it.

import comm999 from "./comm999.js";

const comm2 = {
  ...comm999,

  id: "comm2",
  path: "/comm2",
  code: "COMM 2",
  name: "Public Speaking",
  quarter: "Spring 2026",
  desc: "MWF 9:15 to 10:20 am · Vari 128",

  // Used by the Now panel to count the minutes left in the session.
  meets: { start: "09:15", end: "10:20" },

  accent: "#2563eb",
  accentLight: "#eff6ff",

  storageKey: "comm2-s26-v1",

  // "current" | "archived" — what the front page does with it.
  status: "archived",
  adminPin: "222222",

  // Roster and schedule come across when the Fall list lands. Until then this
  // inherits the template's ten placeholder names, so the gate stays open.
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

export default comm2;
