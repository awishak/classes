// The design system. One place for the decisions that were being made again in
// every file, and the reasoning for each, so the next component does not have to
// invent a fourteenth font size.
//
// Three things drove this pass:
//
// 1. CONTRAST. The muted grey used for body text across the whole app was
//    #9ca3af, which is 2.54:1 against white. WCAG AA wants 4.5:1 for text.
//    Every "Muted" line in the app failed, and there were 138 of them.
//    Checking the replacement caught a second miss: the obvious #6b7280 clears
//    white at 4.83 but lands at 4.36 on the sunk surface the dashboard rows sit
//    on. TEXT.muted below is checked against all three backgrounds. The old grey
//    survives only as LINE.ghost, a border colour, where contrast rules do not
//    apply and it always looked right.
//
// 2. COLOUR MEANS ONE THING. The class accent (#9f1239) and the live-on-the-
//    projector red (#e11d48) are 1.71:1 apart. Nobody can tell those apart
//    across a room, and they mean completely different things. The fix is not a
//    third red: colour stops being the only signal. Anything live carries the
//    word LIVE, and the accent is reserved for things you can click.
//
// 3. TOUCH AND POINTER ARE DIFFERENT. Apple's 44pt minimum is a *touch*
//    guideline, and the reason we adopted it is that students are on phones. The
//    dashboard is a laptop under my hands with a trackpad, where 44 everywhere
//    would push half the panels below the fold. So TAP is for the student site
//    and HIT is the pointer floor for the dashboard.

// ─── colour ───
//
// Warm, not cool. The engine ended up with three greys: #111827 on the class
// site, #1c1917 on the dashboard and the game, #171310 on the repository. The
// warm one is where the newest work kept landing, so the warm one wins and the
// other two go away.
//
// Every value is checked against all three surfaces below, not just white.
// Checking only against white is how the two reds got here: both clear 4.5 on a
// card and neither cleared it on the sunk surface the dashboard's panels use.
// The number after each colour is its worst ratio of the three.
export const TEXT = {
  primary: "#1c1917",   // 15.93:1
  secondary: "#57534e", //  6.95:1
  muted: "#6b655f",     //  5.24:1
};

export const LINE = {
  soft: "#f0edea",      // hairline between rows
  strong: "#e3ded8",    // input and button borders
  ghost: "#c9c2ba",     // decorative only — never put text in this colour
};

export const SURFACE = {
  page: "#fafaf9",
  card: "#fff",
  sunk: "#f6f4f1",
};

// State colours. Each one means exactly one thing, everywhere, forever.
export const STATE = {
  live: "#be123c",  // 5.73:1 — on the room screen right now. Never decorative.
  ok: "#0f766e",    // 4.99:1 — done, ready, nothing to do
  warn: "#b45309",  // 4.57:1 — needs attention before the problem lands
  late: "#c81e1e",  // 5.23:1 — past due
};

// The two reds moved. `live` was #e11d48 and `late` was #dc2626, and both sat
// at 4.28 and 4.40 on the sunk surface: passing on a card, failing in a panel,
// which is exactly where both of them get used. Deep enough now to read
// anywhere, and still far enough apart from each other to mean two things.

// The room screen inverts on purpose: a projector in a lit room, where a white
// page is a lamp pointed at thirty people. Its four values live here rather
// than in that one file, so the surface that inverts is still inside the system.
// Checked against STAGE, which is the only background any of them sit on.
export const ROOM = {
  stage: "#0f0d0c",
  ink: "#f6f2ec",   // 17.38:1 on stage
  dim: "#a79c92",   //  7.21:1 on stage
  line: "#2b2622",  // decorative only
};

// ─── type ───
// Seven steps. The engine was using twenty sizes between 9 and 32, most of them
// a half-pixel apart and none of them chosen. Note what is missing: 16. Inputs
// stay at 16 because anything smaller makes iOS zoom the page on focus, so 16 is
// a functional requirement rather than a step on a scale.
export const TYPE = {
  micro: 12,   // label floor. The HIG rule we adopted says never below ~12.
  small: 13,   // secondary detail under a row
  body: 15,    // the default. Reading size.
  lead: 17,    // a row's own title
  title: 22,   // panel and page headings
  display: 28, // the one number a screen is about
  hero: 32,    // the room screen only
};

// ─── space ───
// A 4px grid. Gaps that were 7, 9, 11 and 13 are now one of these.
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 999 };

// ─── hit targets ───
export const TAP = 44; // student site, because students are on phones
export const HIT = 34; // dashboard, because it is a trackpad and density matters

// ─── focus ───
// Keyboard users could not see where they were on either surface. This is the
// one ring, and it goes on a .focusable class in each surface's stylesheet.
export const focusCSS = (accent) => `
.focusable:focus-visible{outline:2px solid ${accent};outline-offset:2px;border-radius:${RADIUS.sm}px}
.focusable:focus:not(:focus-visible){outline:none}
`;

// ─── motion ───
// The room screen already honours this. The dashboard did not, and it animates
// panels while being dragged.
export const REDUCED = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

export const motionCSS = `
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
}
`;
