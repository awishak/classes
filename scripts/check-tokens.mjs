// One design system, four themes, and every surface reading from the system.
//
// The engine had a design system in src/engine/tokens.js and not one file
// imported the module. So eighteen files each declared their own palette, and
// the app ended up with three different greys for body text. Nobody chose
// three; each file picked one, because there was nothing to point at from
// inside the file.
//
// Since then the tokens became CSS custom properties and the palette moved to
// themes.js, one block per theme. A student can switch, so the check has more
// to hold: a colour that reads on Clean's white can be invisible on Snapchat's
// yellow, and Crashing Out puts text on six different bands of one gradient.
//
// Three rules, all mechanical, all enforced here:
//
//   1. No surface declares its own colour. A top-level colour constant in an
//      engine file has to come from tokens.js. Colour inside a style object is
//      not checked yet; the constants at the top of a file are what set a
//      surface's character, and those are what drifted.
//   2. Every theme defines every token. A missing one falls back to Clean's
//      value silently, which is how a dark theme ends up with black text.
//   3. Every readable value clears 4.5:1 on every ground that theme puts text
//      on. Checking only against white is how the live red and the late red
//      shipped at 4.28 and 4.40 on the sunk surface.

import { readFileSync, readdirSync } from "node:fs";
import { THEMES, THEME, BRAND, varsOf } from "../src/engine/themes.js";

const ENGINE = new URL("../src/engine/", import.meta.url);
let bad = 0;
const fail = (where, why) => { bad++; console.error("  " + where + "  " + why); };

// ─── rule 1: nobody keeps their own palette ───
const OWNS_COLOUR = new Set(["tokens.js", "themes.js", "colors.js"]);
const COLOUR_NAME = /^const ([A-Z][A-Z_0-9]*)\s*=\s*("(?:#[0-9a-fA-F]{3,8}|rgba?\([^"]*\))")/;
for (const f of readdirSync(ENGINE).sort()) {
  if (!/\.jsx?$/.test(f) || OWNS_COLOUR.has(f)) continue;
  readFileSync(new URL(f, ENGINE), "utf8").split("\n").forEach((line, i) => {
    const m = line.match(COLOUR_NAME);
    if (m) fail(`src/engine/${f}:${i + 1}`, `${m[1]} is a colour of its own. Take it from tokens.js.`);
  });
}

// ─── rule 2: every theme is complete ───
const KEYS = Object.keys(varsOf(THEME.clean));
for (const name of THEMES) {
  const t = THEME[name];
  if (!t) { fail("themes.js", `${name} is listed in THEMES and has no block`); continue; }
  const got = varsOf(t);
  for (const k of KEYS) if (got[k] == null || got[k] === "") fail("themes.js", `${name} is missing ${k}`);
}

// ─── rule 3: every readable value reads, on every ground the theme uses ───
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (hex) => {
  const h = hex.length === 4 ? "#" + [...hex.slice(1)].map(c => c + c).join("") : hex;
  const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const AA = 4.5;
let checked = 0;
for (const name of THEMES) {
  const t = THEME[name];
  if (!t) continue;
  const readable = [
    ...Object.entries(t.text).map(([k, v]) => ["text." + k, v]),
    ...Object.entries(t.state).map(([k, v]) => ["state." + k, v]),
  ];
  for (const [label, hex] of readable) {
    checked++;
    for (const ground of t.grounds) {
      const r = ratio(hex, ground);
      if (r < AA) fail("themes.js", `${name}: ${label} ${hex} is ${r.toFixed(2)}:1 on ${ground}, under ${AA}.`);
    }
  }
  // A theme with a night is a second palette on second grounds, and a red that
  // reads on white disappears on near-black, so the dark values are measured
  // the same way rather than assumed to inherit.
  if (t.dark) {
    const d = { ...t, ...t.dark };
    const readable = [
      ...Object.entries(d.text).map(([k, v]) => ["dark text." + k, v]),
      ...Object.entries(d.state).map(([k, v]) => ["dark state." + k, v]),
    ];
    for (const [label, hex] of readable) {
      checked++;
      for (const ground of d.grounds) {
        const r = ratio(hex, ground);
        if (r < AA) fail("themes.js", `${name}: ${label} ${hex} is ${r.toFixed(2)}:1 on ${ground}, under ${AA}.`);
      }
    }
  }
  // The wall inverts, so its two readable values are measured on the stage.
  for (const k of ["ink", "dim"]) {
    checked++;
    const r = ratio(t.room[k], t.room.stage);
    if (r < AA) fail("themes.js", `${name}: room.${k} ${t.room[k]} is ${r.toFixed(2)}:1 on its stage, under ${AA}.`);
  }
}

// A sponsor's brand is still text on a background. Their own blue on their own
// yellow is 2.81:1, which is why the pairs below are corrected rather than
// lifted, and why they are checked here rather than trusted.
for (const [name, b] of Object.entries(BRAND)) {
  for (const [label, hex, ground] of b.text || []) {
    checked++;
    const r = ratio(hex, ground);
    if (r < AA) fail("themes.js", `${name}: ${label} ${hex} is ${r.toFixed(2)}:1 on ${ground}, under ${AA}.`);
  }
}

if (bad) {
  console.error(`\ncheck-tokens: ${bad} place(s) outside the system.`);
  process.exit(1);
}
console.log(`check-tokens: every surface reads from tokens.js, and all ${checked} readable values across ${THEMES.length} themes clear ${AA}:1 where they sit`);
