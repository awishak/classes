// COMM 3 — Digital Storytelling. Schedule, roster and assignments to come.
//
// This is the one to copy when a new class turns up: it takes the engine's
// shape from the template and then clears out everything that was COMM 999's
// content, so what is left is the fields to fill in.

import comm999 from "./comm999.js";
import { scheduleWeeks, library, assignments, dayPlans } from "./comm3-term.js";

const comm3 = {
  ...comm999,

  id: "comm3",
  path: "/comm3",
  code: "COMM 3",
  name: "Digital Storytelling",
  quarter: "Fall 2026",
  desc: "MWF 8:00 to 9:05 am and 10:30 to 11:35 am \u00b7 Vari 133",
  // directionsUrl: a link here puts Directions under the room on the Next
  // class card. Off for now: the Vari Hall search landed on Varsi Hall.

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

  // The same colour lifted for text after dark: the class colour reads on
  // white and vanishes on the dark card (crimson 2.15:1, purple 3.03:1).
  accent: "#7c3aed",
  accentDark: "#b794f6",
  accentLight: "#f5f3ff",

  storageKey: "comm3-f26-v1",

  // The first-week challenge: fill in your card, every field, due Sep 22.
  // No weight. The challenge itself lives in engine/profileTask.js.
  profileTask: { due: "Sep 22" },

  // "current" | "archived" — what the front page does with it.
  status: "current",
  adminPin: "333333",
  openAccess: true,

  // The sequences and the seed library carry over, because those are how I
  // teach rather than what this class is about. The term itself, the weeks,
  // the assignments and one plan per class day, is generated in
  // comm3-term.js from the September 8 handoff. Roster to come.
  testStudent: "",
  // Nobody real yet. Pepe LeFritz is the fake one Andrew looks at his own
  // site through and writes test messages as: his on his roster and in View
  // as a student, and nobody else's, so he stays out of the roster students
  // read and out of every count of who is in the class.
  // Names that do not split on the last space, so the roster files them where
  // a person would look. Taken from the registrar's own Last Name column when
  // the roster was imported, rather than guessed from the name.
  lastNameOverrides: {
    "Ileana Garcia Huerta": "Garcia Huerta",
    "Zeina Stallings Jaber": "Stallings Jaber",
    "Camila Valeros Barrera": "Valeros Barrera",
    "Yoshirha Valeros Barrera": "Valeros Barrera",
    "Lorenza Camou Balderrama": "Camou Balderrama",
    "Alejandro Lopez jimenez": "Lopez jimenez",
  },

  testStudent: "Pepe LeFritz",
  students: [
    { id: "pepe-lefritz", name: "Pepe LeFritz", email: "pepe@example.test", section: "10:30", from: "", goals: "" },
  ],
  scheduleWeeks,
  library,
  assignments,
  dayPlans,
  seedVersion: 3,
};

export default comm3;
