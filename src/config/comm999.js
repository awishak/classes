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

  // Names that do not split on the last space. "Alexander Watanabe Eriksson"
  // sorts under W, not E.
  lastNameOverrides: {},

  // ─── Cards ───
  // Every class ships ALL cards. Toggle them off per class from the admin page.
  // Order here is the order shown on the home grid.
  cards: {
    dayplan: true, // instructor-only; never shown on the student home
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
    {
      id: "a3", title: "Work Meeting 1", due: "Oct 9", weight: 25,
      description: "A four-person meeting that runs like a real work meeting. You are assigned a topic (e.g. A: multidimensional leadership theory, B: assessment, and so on) and write a three-page document (a 3-pager) on it. Post your 3-pager at least 24 hours before the meeting. In the 45-minute meeting you are asked questions about your own document AND about how your work connects to the other three people's documents. The meeting is recorded; you get an AI transcript and summary plus direct feedback from me, so you can see exactly what to sharpen for next time. The point is twofold: it mirrors what your professional life will actually be like, and it pushes you to become the expert on your topic while staying fluent in everyone else's. This is the first of two such meetings.",
      instructionsUrl: "",
      rubric: [
        { id: "c1", name: "3-pager posted 24h early", points: 20 },
        { id: "c2", name: "Depth on own topic", points: 40 },
        { id: "c3", name: "Connections to others' work", points: 40 },
      ],
    },
    {
      id: "a4", title: "Work Meeting 2", due: "Nov 6", weight: 25,
      description: "The second four-person work meeting, same format as the first: post your 3-pager at least 24 hours ahead, then field questions on your own topic and on how it connects to the other three documents. Recorded with AI transcript, summary, and direct feedback. By now your topic should be deeper and the connections sharper.",
      instructionsUrl: "",
      rubric: [
        { id: "c1", name: "3-pager posted 24h early", points: 20 },
        { id: "c2", name: "Depth on own topic", points: 40 },
        { id: "c3", name: "Connections to others' work", points: 40 },
      ],
    },
    {
      id: "a5", title: "Final Project", due: "Dec 4", weight: 25,
      description: "Week 10. You work in topic groups — all the leadership-theory people together, all the assessment people together, and so on (AAA, BBB, CCC) — but each person turns in their own individual deliverable, in the same shape as the 3-pagers you wrote for the meetings. Same topic, shared work, individual product.",
      instructionsUrl: "",
      rubric: [
        { id: "c1", name: "Depth and command of topic", points: 40 },
        { id: "c2", name: "Synthesis across the term", points: 40 },
        { id: "c3", name: "Clarity of the 3-pager", points: 20 },
      ],
    },
    {
      id: "a6", title: "Quizzes & Participation", due: "Ongoing", weight: 25,
      description: "Four quizzes across the term, plus the participation points I award throughout the quarter (extra credit folds in here). This bucket rewards keeping up and showing up.",
      instructionsUrl: "",
      rubric: [],
    },
  ],

  // ─── Sequences (lecture shapes) ───
  // An ordered list of slots. The day-planning view walks these slot by slot.
  // Mirrors teaching/sequences.md. defaultSequenceId is used for a fresh day.
  defaultSequenceId: "motivated",
  sequences: [
    {
      id: "motivated",
      name: "The Motivated Sequence",
      desc: "Default teaching shape. Monroe's bones, framed for learning.",
      slots: [
        { slot: "opener", note: "Earn attention and point at today's concept without naming it yet." },
        { slot: "problem", note: "The gap or tension: what doesn't work, why the concept is needed." },
        { slot: "solution", note: "The concept/method itself, taught plainly." },
        { slot: "visualization", note: "Make it stick: a story or image where the concept does its work." },
        { slot: "call-to-action", note: "What they should do, try, or notice before next class." },
      ],
    },
    {
      id: "monroe-classic",
      name: "Monroe's Motivated Sequence",
      desc: "The classic. Most persuasive structures are a variation of this.",
      slots: [
        { slot: "opener", note: "Attention. Earn the room." },
        { slot: "problem", note: "Need. Show the gap, the tension, the cost of the status quo." },
        { slot: "solution", note: "Satisfaction. Present the concept/method that resolves it." },
        { slot: "visualization", note: "Visualization. Let them feel the world with the solution in it." },
        { slot: "call-to-action", note: "Action. The concrete next move." },
      ],
    },
  ],

  // ─── Seeds (reusable stories/hooks) ───
  // Mirrors teaching/seeds.md as structured data. slots/concept drive the
  // day-planning suggestions. seeds.md stays the human writing scratchpad.
  seeds: [
    {
      id: "s-triangulation",
      title: "Don't judge too quickly",
      concept: "triangulation",
      classes: ["Comm 2", "any"],
      slots: ["opener", "problem"],
      source: "origin TBD",
      body: "A story about not judging someone too quickly. The turn: we extend that same patience to other cultures and people in our research. No single observation is enough; you triangulate across sources, methods, and perspectives before you conclude.",
    },
    {
      id: "s-goals",
      title: "What are your goals for this class?",
      concept: "first-day onboarding",
      classes: ["any"],
      slots: ["opener", "call-to-action"],
      source: "first-day-of-class ritual",
      body: "On the first day, ask every student what their goals are for the class. Capture each answer and post it on their (instructor-only) student page, so their goals stay visible all quarter and frame how you read their work.",
    },
    {
      id: "s-the-gap",
      title: "Ira Glass and the gap",
      concept: "the gap (taste vs. ability)",
      classes: ["any"],
      slots: ["opener", "problem", "call-to-action"],
      source: "Ira Glass on creative work",
      body: "Show this every class. Ira Glass: when you start out your taste is good but your work isn't there yet, and the gap between the two is what makes people quit. The turn: the only way to close it is volume — do a lot of work, on a deadline, and your ability catches up to your taste. Frame the class as a machine for closing that gap.",
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
