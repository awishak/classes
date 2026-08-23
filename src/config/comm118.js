// COMM 118 — Communication and Sport, Fall 2026.
// Starting point for the live teaching surfaces (Dashboard, Classroom View,
// Ask). It inherits the template class's schedule shape, sequences, seeds, and
// roster so there is something real to run against on day one; replace those
// fields here as the real term takes shape.
//
// Its own storageKey, so nothing here touches the existing /comm118 hub
// (which still runs on comm118-game-v14).

import comm999 from "./comm999.js";

const comm118 = {
  ...comm999,

  id: "comm118",
  path: "/comm118",
  code: "COMM 118",
  name: "Communication and Sport",
  quarter: "Fall 2026",
  desc: "MWF 8:00 to 9:05 am · Vari 128",

  // Used by the Now panel to count down the minutes left in the session.
  meets: { start: "08:00", end: "09:05" },

  accent: "#9f1239",
  accentLight: "#fff1f2",

  storageKey: "comm118-f26-v1",
};

export default comm118;
