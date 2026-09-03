// Four themes, and a student picks one.
//
// The engine used to bake its palette in at import: every surface read a hex out
// of tokens.js into a module constant, so a colour could not change after the
// page loaded. Themes were only possible in the old forked hubs, which carried
// their own copy of everything.
//
// So the tokens are CSS custom properties now. Every surface still reads
// `TOKENS.TEXT.primary`; that value is `var(--text-primary)` rather than a hex,
// and the hex arrives from whichever block below matches the `data-theme` on the
// root. Switching a theme is one attribute, and nothing re-renders.
//
// Clean is the standard. Business is the other serious one. Snapchat and
// Crashing Out are Andrew's, carried over from spring 2026 and rebuilt on this
// system rather than on their own.
//
// Every readable value in every theme is checked against every surface that
// theme actually puts it on. `npm run tokens` fails the build otherwise, so a
// theme cannot ship a colour nobody can read.

export const THEMES = ["clean", "business", "snapchat", "crashing"];

export const THEME_LABELS = {
  clean: "Clean",
  business: "Business",
  snapchat: "Snapchat",
  crashing: "Crashing Out",
};

export const THEME_DESCS = {
  clean: "Calm and out of the way",
  business: "Dark, serious, a bit of weight",
  snapchat: "Yellow, loud, streaks",
  crashing: "Maximum chaos, sponsored",
};

// A theme is one flat table. `grounds` names the backgrounds this theme puts
// text on, which is what the contrast check measures against.
export const THEME = {
  clean: {
    text:    { primary: "#1c1917", secondary: "#57534e", muted: "#6b655f" },
    line:    { soft: "#f0edea", strong: "#e3ded8", ghost: "#c9c2ba" },
    surface: { page: "#fafaf9", card: "#ffffff", sunk: "#f6f4f1" },
    state:   { live: "#be123c", ok: "#0f766e", warn: "#b45309", late: "#c81e1e" },
    room:    { stage: "#0f0d0c", ink: "#f6f2ec", dim: "#a79c92", line: "#2b2622" },
    card:    { border: "1px solid #f0edea", shadow: "none", radius: "16px" },
    font:    { body: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
               display: "'Outfit', -apple-system, sans-serif",
               label: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
    weight:  { display: "600" },
    grounds: ["#ffffff", "#fafaf9", "#f6f4f1"],
  },

  business: {
    text:    { primary: "#f6f2ec", secondary: "#cbc2b9", muted: "#a79c92" },
    line:    { soft: "#2b2622", strong: "#3a332e", ghost: "#4a423b" },
    surface: { page: "#1c1917", card: "#241f1c", sunk: "#2b2622" },
    state:   { live: "#ff8fa8", ok: "#5ecfa8", warn: "#f0b45c", late: "#ff9c8f" },
    room:    { stage: "#1c1917", ink: "#f6f2ec", dim: "#a79c92", line: "#2b2622" },
    card:    { border: "1px solid #2b2622", shadow: "none", radius: "16px" },
    font:    { body: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
               display: "'Fraunces', Georgia, serif",
               label: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace" },
    weight:  { display: "600" },
    grounds: ["#1c1917", "#241f1c", "#2b2622"],
  },

  snapchat: {
    text:    { primary: "#000000", secondary: "#2b2b2b", muted: "#4a4a4a" },
    line:    { soft: "#000000", strong: "#000000", ghost: "#8a8a8a" },
    surface: { page: "#FFFC00", card: "#ffffff", sunk: "#FFFC00" },
    state:   { live: "#a4132f", ok: "#0f766e", warn: "#8a4a00", late: "#a4132f" },
    room:    { stage: "#FFFC00", ink: "#000000", dim: "#4a4a4a", line: "#000000" },
    card:    { border: "3px solid #000000", shadow: "4px 4px 0 #000000", radius: "16px" },
    font:    { body: "'Nunito', 'Avenir Next', -apple-system, sans-serif",
               display: "'Nunito', 'Avenir Next', sans-serif",
               label: "'Nunito', sans-serif" },
    weight:  { display: "900" },
    grounds: ["#ffffff", "#FFFC00"],
  },

  crashing: {
    text:    { primary: "#1f2937", secondary: "#3f4a5a", muted: "#4b5563" },
    line:    { soft: "#1f2937", strong: "#1f2937", ghost: "#9aa3ae" },
    // The gradient lives on the page; a card is still white so text has a
    // ground that holds still.
    surface: { page: "linear-gradient(135deg,#fce7f3 0%,#fef3c7 20%,#dbeafe 40%,#ddd6fe 60%,#fbcfe8 80%,#fef3c7 100%)",
               card: "#ffffff", sunk: "#fef3c7" },
    // Deeper than the other themes' equivalents, because this page is a
    // gradient and text has to clear its darkest band as well as its lightest.
    state:   { live: "#b31655", ok: "#0d6660", warn: "#8a4a00", late: "#b31c1c" },
    room:    { stage: "#1f2937", ink: "#FFD233", dim: "#FF5FA2", line: "#FF5FA2" },
    card:    { border: "3px solid #FF5FA2", shadow: "4px 4px 0 #FF8C1A, 6px 6px 0 #1f2937",
               radius: "28px 6px 24px 8px" },
    // Four faces at once, which is the point of this theme. Press Start 2P is
    // not among them: it is roughly twice as wide per character as anything
    // else here, so a label in it overflows every card it lands in. The pixel
    // font stays in the marquee, where the strip scrolls and width costs
    // nothing.
    font:    { body: "'Shantell Sans', 'Comic Neue', 'Fredoka', cursive",
               display: "'Bangers', 'Rubik Mono One', cursive",
               label: "'Lilita One', 'Fredoka', cursive" },
    weight:  { display: "400" },
    // Every band of the gradient, plus the card, because text lands on both.
    grounds: ["#ffffff", "#fce7f3", "#fef3c7", "#dbeafe", "#ddd6fe", "#fbcfe8"],
  },
};

// The custom properties one theme sets. Kept in one place so the stylesheet and
// the contrast check cannot disagree about what a theme contains.
export const varsOf = (t) => ({
  "--text-primary": t.text.primary, "--text-secondary": t.text.secondary, "--text-muted": t.text.muted,
  "--line-soft": t.line.soft, "--line-strong": t.line.strong, "--line-ghost": t.line.ghost,
  "--surface-page": t.surface.page, "--surface-card": t.surface.card, "--surface-sunk": t.surface.sunk,
  "--state-live": t.state.live, "--state-ok": t.state.ok, "--state-warn": t.state.warn, "--state-late": t.state.late,
  "--room-stage": t.room.stage, "--room-ink": t.room.ink, "--room-dim": t.room.dim, "--room-line": t.room.line,
  "--card-border": t.card.border, "--card-shadow": t.card.shadow, "--card-radius": t.card.radius,
  "--font-body": t.font.body, "--font-display": t.font.display, "--font-label": t.font.label,
  "--display-weight": t.weight.display,
});

// The whole stylesheet: one block per theme, Clean also on bare :root so a
// surface that never sets `data-theme` still draws.
export const themeCSS = () => {
  const block = (sel, name) =>
    sel + "{" + Object.entries(varsOf(THEME[name])).map(([k, v]) => k + ":" + v).join(";") + "}";
  return [block(":root", "clean"), ...THEMES.map(n => block(`[data-theme="${n}"]`, n))].join("\n");
};

// Which fonts a theme needs, so a surface loads those and no others.
export const THEME_FONTS = {
  clean: "family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600",
  business: "family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600",
  snapchat: "family=Nunito:wght@400;600;700;800;900",
  crashing: "family=Bangers&family=Lilita+One&family=Shantell+Sans:ital,wght@0,300..800;1,300..800&family=Rubik+Mono+One&family=Press+Start+2P&family=Fredoka:wght@400;500;600;700",
};
export const fontHref = (name) =>
  "https://fonts.googleapis.com/css2?" + (THEME_FONTS[name] || THEME_FONTS.clean) + "&display=swap";

// ─── someone else's brand ───
//
// Crashing Out is sponsored, so the Homework Tubes palette lives here rather
// than loose inside a component. Lifted from ~/Projects/homework-tubes, with two
// text pairs corrected: their blue on their yellow is 2.81:1 and their red on
// their cream is 4.18:1, so the URL pill takes ink on yellow at 10.15:1 and the
// eyebrow takes a deeper red at 6.26:1. Fills, borders and shadows keep the
// brand exactly as it is, because contrast rules do not apply to those.
export const BRAND = {
  homeworkTubes: {
    red: "#E8243C", yellow: "#FFD233", blue: "#2B7CE9", green: "#3CBB57",
    purple: "#9B4DFF", orange: "#FF8C1A", pink: "#FF5FA2", cream: "#FFF8E7", ink: "#1A1230",
    // The two that carry words.
    onCream: "#b81428",   // 6.26:1 on cream
    onYellow: "#1f2937",  // 10.15:1 on yellow
    url: "https://homeworktubes.com",
    // Checked as text, against the ground each one actually sits on.
    text: [["onCream", "#b81428", "#FFF8E7"], ["onYellow", "#1f2937", "#FFD233"]],
  },
};
