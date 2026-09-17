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
  desc: "MWF 9:15 to 10:20 am \u00b7 Vari 133",
  // directionsUrl: a link here puts Directions under the room on the Next
  // class card. Off for now: the Vari Hall search landed on Varsi Hall.

  // Used by the Now panel to count down the minutes left in the session.
  meets: { start: "09:15", end: "10:20" },

  // The same colour lifted for text after dark: the class colour reads on
  // white and vanishes on the dark card (crimson 2.15:1, purple 3.03:1).
  accent: "#1e40af",
  accentDark: "#93b9ff",
  accentLight: "#eef2ff",

  storageKey: "comm118-f26-v1",

  // The first-week challenge: fill in your card, every field, due Sep 22.
  // No weight. The challenge itself lives in engine/profileTask.js.
  profileTask: { due: "Sep 22" },

  // "current" | "archived" — what the front page does with it.
  status: "current",
};

export default comm118;
