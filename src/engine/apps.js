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
      { id: "ask", label: "Ask in class", href: p + "/ask" },
    ];
  }
  return [
    { id: "games", label: "Games", card: "games" },
    // Andrew, 2026-09-20: "there's a way to ask questions from the menu, and
    // i have no idea where that goes." Two doors need two names: this one is
    // the room, where a question can go up on the screen while the class is
    // happening, and Questions on the class page is the sheet everybody reads
    // afterwards. Both write to the same store, so one question can do both.
    { id: "ask", label: "Ask in class", href: p + "/ask" },
    { id: "today", label: "Room screen", href: p + "/today" },
  ];
}
