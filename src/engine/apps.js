// The apps: things you open that have a screen and a job of their own.
//
// Andrew, 2026-09-15: "let's rename how we think about the things like
// dashboard, repo, games, and more. let's call them apps." They sit in the
// top bar's More for him, and behind an Apps button at the top right for a
// student, "generally the same as mine."
//
// Each app is a link to its own page, or a card on the class page.

import { localWorksheet, openTo } from "./localWorksheets.js";
import { WORKTOPIA_KEY } from "./worktopia/terminal.js";

// Sit-Down 1 lives in COMM 118, and COMM 999 is the rig for trying the
// student path. The tables themselves are in worktopia/sitdown.js.
const SITDOWN_CLASSES = ["comm118", "comm999"];

export function appsFor(config, role) {
  const p = config.path;
  const sitdown = SITDOWN_CLASSES.includes(config.id) ? [{ id: "sitdown", label: "Sit-Down 1", href: p + "/sitdown" }] : [];
  if (role === "instructor") {
    // Everyone's Worktopia file by question, in the classes Worktopia is
    // open to. Andrew, 2026-10-02: "make it easy for me to access."
    const worktopia = localWorksheet(WORKTOPIA_KEY);
    const answers = worktopia && openTo(worktopia, config.id)
      ? [{ id: "worktopia-answers", label: "Worktopia answers", href: p + "/worksheets/worktopia/answers" }] : [];
    return [
      { id: "dashboard", label: "Dashboard", href: p + "/dashboard" },
      { id: "repo", label: "Repository", href: "/repo" },
      { id: "games", label: "Games", href: p + "/games" },
      { id: "worksheets", label: "Worksheets", href: p + "/worksheets" },
      ...answers,
      ...sitdown,
      { id: "grade", label: "Grade view", href: p + "/grade" },
      { id: "checkins", label: "Check-in answers", href: p + "/checkins" },
      { id: "horn", label: "Around the Horn", opens: "horn" },
      { id: "today", label: "Room screen", href: p + "/today" },
    ];
  }
  return [
    ...sitdown,
    { id: "games", label: "Games", card: "games" },
    // Asking is not in here. Andrew, 2026-09-20: "there's a way to ask
    // questions from the menu, and i have no idea where that goes", and then
    // "remove the whole ask feature for now." Questions is a card on the
    // class page, which is where a student already is.
    { id: "today", label: "Room screen", href: p + "/today" },
  ];
}
