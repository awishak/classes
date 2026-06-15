// COMM 999 — Fall 2026 template class.
// This is DATA only. The shared engine (src/engine/ClassApp.jsx) renders any
// class from a config object like this one. To make a new class, copy this file
// and change the data. Update the engine once and every class updates.

const comm999 = {
  // ─── Identity & routing ───
  id: "comm999",
  path: "/comm999",
  code: "COMM 999",
  name: "Template Class",
  quarter: "Fall 2026",
  desc: "MWF 0:00 to 0:00 · Room TBD",

  // ─── Branding ───
  accent: "#9f1239",
  accentLight: "#fff1f2",

  // ─── Storage & auth ───
  storageKey: "comm999-v1",
  adminPin: "999999",

  // ─── People ───
  // Goals get filled in on day one (first-day "what are your goals" seed).
  testStudent: "Zack Girgis",
  students: [
    { name: "Zack Girgis", from: "", goals: "" },
    { name: "Joe Hanna", from: "", goals: "" },
    { name: "Hanni Fakhoury", from: "", goals: "" },
    { name: "Kirellos Zamary", from: "", goals: "" },
    { name: "George Hanna", from: "", goals: "" },
    { name: "Brian Dong", from: "", goals: "" },
    { name: "Brett Dillon", from: "", goals: "" },
    { name: "Blake Michaelsen", from: "", goals: "" },
    { name: "Dan Patry", from: "", goals: "" },
    { name: "Theo Ishak", from: "", goals: "" },
  ],
  teams: null, // null = no teams; or [{ id, name }]

  // ─── Cards ───
  // Every class ships ALL cards. Toggle them off per class from the admin page.
  // Order here is the order shown on the home grid.
  cards: {
    you: true,
    assignments: true,
    schedule: true,
    community: true,
    leaderboard: true,
    roster: true,
    instructor: true,
  },

  // ─── Points ───
  pointSources: ["Assignment", "Participation", "Bonus", "Other"],

  // Bump this when scheduleWeeks/library below change and you want them pushed
  // to the live store (overwrites the stored schedule + library, keeps everything else).
  seedVersion: 2,

  // ─── Schedule (seed defaults; live edits are saved to the store) ───
  // Weeks, each with a topic, its class dates, free text, and a list of items.
  // Items reference the library and carry an optional date.
  scheduleWeeks: [
    {
      id: "w1", topic: "The Purpose of Sports", dates: ["Sep 21", "Sep 23", "Sep 25"],
      text: "", plan: "", slides: "",
      items: [
        { id: "i1", libId: "r1", type: "reading", title: "Why We Bet", url: "", date: "Wed" },
        { id: "i2", libId: "a1", type: "assignment", title: "Intro post", url: "", date: "Fri" },
      ],
    },
    {
      id: "w2", topic: "Value & Interest", dates: ["Sep 28", "Sep 30", "Oct 2"],
      text: "", plan: "", slides: "",
      items: [
        { id: "i3", libId: "act1", type: "activity", title: "This or That", url: "", date: "" },
      ],
    },
    { id: "w3", topic: "", dates: ["Oct 5", "Oct 7", "Oct 9"], text: "", plan: "", slides: "", items: [] },
    { id: "w4", topic: "", dates: ["Oct 12", "Oct 14", "Oct 16"], text: "", plan: "", slides: "", items: [] },
    { id: "w5", topic: "", dates: ["Oct 19", "Oct 21", "Oct 23"], text: "", plan: "", slides: "", items: [] },
    { id: "w6", topic: "", dates: ["Oct 26", "Oct 28", "Oct 30"], text: "", plan: "", slides: "", items: [] },
    { id: "w7", topic: "", dates: ["Nov 2", "Nov 4", "Nov 6"], text: "", plan: "", slides: "", items: [] },
    { id: "w8", topic: "", dates: ["Nov 9", "Nov 11", "Nov 13"], text: "", plan: "", slides: "", items: [] },
    { id: "w9", topic: "", dates: ["Nov 16", "Nov 18", "Nov 20"], text: "", plan: "", slides: "", items: [] },
    { id: "w10", topic: "", dates: ["Nov 30", "Dec 2", "Dec 4"], text: "", plan: "", slides: "", items: [] },
    { id: "w11", topic: "Finals", dates: ["Dec 7", "Dec 9"], text: "", plan: "", slides: "", items: [] },
  ],

  // The reusable pool. Drag these into weeks; new items created in the schedule
  // get added back here.
  library: [
    { id: "r1", type: "reading", title: "Why We Bet", url: "" },
    { id: "a1", type: "assignment", title: "Intro post", url: "" },
    { id: "act1", type: "activity", title: "This or That", url: "" },
  ],

  // ─── Assignments (seed defaults; live edits saved to the store) ───
  // Each scored out of 100; weight is its percent of the final grade.
  // rubric criteria points should sum to 100. Empty rubric = free-form score.
  assignments: [
    { id: "a1", title: "Intro post", due: "Sep 25", weight: 10, description: "Introduce yourself to the class in a short post.", instructionsUrl: "", rubric: [] },
    {
      id: "a2", title: "First essay", due: "Oct 9", weight: 15, description: "A short argumentative essay on this unit's theme.", instructionsUrl: "",
      rubric: [
        { id: "c1", name: "Argument", points: 40 },
        { id: "c2", name: "Evidence", points: 40 },
        { id: "c3", name: "Clarity", points: 20 },
      ],
    },
  ],

  // ─── Game ───
  game: { enabled: true, cats: ["On Topic", "General"], gradePts: { on_topic: 10, general: 10 } },

  // ─── Instructor ───
  instructor: {
    name: "Andrew Ishak",
    bio: "Department of Communication, Santa Clara University.",
    email: "aishak@scu.edu",
    photo: "",
    schedulingLink: "",
  },
};

export default comm999;
