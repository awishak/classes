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
// Every colour is a custom property now, so a student can change the theme and
// the whole site follows without a re-render. The hexes live in themes.js, one
// block per theme; this file is the names the rest of the engine reads.
//
// A surface sets `data-theme` on its root and drops `themeCSS()` into a style
// tag. A surface that does neither gets Clean, because Clean is also on bare
// `:root`.
export const TEXT = {
  primary: "var(--text-primary)",
  secondary: "var(--text-secondary)",
  muted: "var(--text-muted)",
};

export const LINE = {
  soft: "var(--line-soft)",      // hairline between rows
  strong: "var(--line-strong)",  // input and button borders
  ghost: "var(--line-ghost)",    // decorative only — never put text in this colour
};

export const SURFACE = {
  page: "var(--surface-page)",
  card: "var(--surface-card)",
  sunk: "var(--surface-sunk)",
};

// State colours. Each one means exactly one thing, everywhere, in every theme.
export const STATE = {
  live: "var(--state-live)",  // on the room screen right now. Never decorative.
  ok: "var(--state-ok)",      // done, ready, nothing to do
  warn: "var(--state-warn)",  // needs attention before the problem lands
  late: "var(--state-late)",  // past due
};

// The room screen inverts on purpose: a projector in a lit room, where a white
// page is a lamp pointed at thirty people. Each theme takes the wall somewhere
// of its own.
export const ROOM = {
  stage: "var(--room-stage)",
  ink: "var(--room-ink)",
  dim: "var(--room-dim)",
  line: "var(--room-line)",
};

// A card is more than a background: the themes differ by border and shadow more
// than by colour. Snapchat is 3px of black with a hard offset; Crashing Out
// stacks two shadows; Clean is a hairline and nothing else.
export const CARD = {
  border: "var(--card-border)",
  shadow: "var(--card-shadow)",
  radius: "var(--card-radius)",
};

export const FONT = {
  body: "var(--font-body)",
  display: "var(--font-display)",
  label: "var(--font-label)",
  displayWeight: "var(--display-weight)",
};

export { THEMES, THEME_LABELS, THEME_DESCS, THEME, themeCSS, fontHref } from "./themes.js";

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
