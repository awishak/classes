// The apps: things you open that have a screen and a job of their own.
//
// Andrew, 2026-09-15: "let's rename how we think about the things like
// dashboard, repo, games, and more. let's call them apps." They sit in the
// top bar's More for him, and behind an Apps button at the top right for a
// student, "generally the same as mine."
//
// Each app is a link to its own page, or a card on the class page.

export function appsFor(config, role) {
  const p = config.path;
  if (role === "instructor") {
    return [
      { id: "dashboard", label: "Dashboard", href: p + "/dashboard" },
      { id: "repo", label: "Repository", href: "/repo" },
      { id: "games", label: "Games", href: p + "/games" },
      { id: "grade", label: "Grade view", href: p + "/grade" },
      { id: "horn", label: "Around the Horn", opens: "horn" },
      { id: "today", label: "Room screen", href: p + "/today" },
    ];
  }
  return [
    { id: "games", label: "Games", card: "games" },
    // Asking is not in here. Andrew, 2026-09-20: "there's a way to ask
    // questions from the menu, and i have no idea where that goes", and then
    // "remove the whole ask feature for now." Questions is a card on the
    // class page, which is where a student already is.
    { id: "today", label: "Room screen", href: p + "/today" },
  ];
}
