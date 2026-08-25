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
// Every value here is checked against white. The number after each is its
// contrast ratio; anything used for text is above 4.5.
export const TEXT = {
  primary: "#111827",   // 17.74:1
  secondary: "#4b5563", //  7.56:1
  muted: "#646b75",     //  5.38 on card, 5.15 on page, 4.85 on sunk. All pass.
};

export const LINE = {
  soft: "#eef0f2",      // hairline between rows
  strong: "#e5e7eb",    // input and button borders
  ghost: "#9ca3af",     // decorative only — never put text in this colour
};

export const SURFACE = {
  page: "#fafaf9",
  card: "#fff",
  sunk: "#f4f3f1",
};

// State colours. Each one means exactly one thing, everywhere, forever.
export const STATE = {
  live: "#e11d48",  // on the room screen right now. Never decorative.
  ok: "#0f766e",    // done, ready, nothing to do
  warn: "#b45309",  // needs attention before it bites
  late: "#dc2626",  // past due
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
