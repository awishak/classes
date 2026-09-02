// One design system, and every surface reading from it.
//
// The engine had a design system in src/engine/tokens.js and not one file
// imported the module. So eighteen files each declared their own palette, and
// the app ended up with three different greys for body text: #111827 on the
// class site, #1c1917 on the dashboard and the game, #171310 on the repository.
// Nobody chose three. Each file just picked one, because there was nothing to
// point at from inside the file.
//
// Two rules, both of which the build can hold:
//
//   1. No surface declares its own colour. A top-level colour constant in an
//      engine file has to come from tokens.js. Colour inside a style object is
//      not checked yet; the constants at the top of a file are what set a
//      surface's character, and those are what drifted.
//   2. Every token reads on every surface the token actually sits on. The old
//      contrast pass only ever checked against white, which is how the live red
//      and the late red got in at 4.28 and 4.40 on the sunk surface: passing on
//      a card, failing in a panel, and a panel is where both get used.

import { readFileSync, readdirSync } from "node:fs";

const ENGINE = new URL("../src/engine/", import.meta.url);
const read = (f) => readFileSync(new URL(f, ENGINE), "utf8");

let bad = 0;
const fail = (where, why) => { bad++; console.error("  " + where + "  " + why); };

// ─── rule 1: nobody keeps their own palette ───
//
// colors.js owns the twenty swatches a section can wear and check-contrast
// already holds that file to the line. tokens.js is the system itself.
const OWNS_COLOUR = new Set(["tokens.js", "colors.js"]);
const COLOUR_NAME = /^const ([A-Z][A-Z_0-9]*)\s*=\s*("(?:#[0-9a-fA-F]{3,8}|rgba?\([^"]*\))")/;

for (const f of readdirSync(ENGINE).sort()) {
  if (!/\.jsx?$/.test(f) || OWNS_COLOUR.has(f)) continue;
  read(f).split("\n").forEach((line, i) => {
    const m = line.match(COLOUR_NAME);
    if (m) fail(`src/engine/${f}:${i + 1}`, `${m[1]} is a colour of its own. Take it from tokens.js.`);
  });
}

// ─── rule 2: every token reads where the token sits ───
const src = read("tokens.js");
const group = (name) => {
  const m = src.match(new RegExp("export const " + name + " = \\{([\\s\\S]*?)\\n\\};"));
  if (!m) { fail("src/engine/tokens.js", "no " + name + " group"); return {}; }
  return Object.fromEntries([...m[1].matchAll(/(\w+):\s*"(#[0-9a-fA-F]{3,8})"/g)].map(x => [x[1], x[2]]));
};

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

const TEXT = group("TEXT"), STATE = group("STATE"), SURFACE = group("SURFACE"), ROOM = group("ROOM");
const AA = 4.5;

// The light surfaces: a card, the page behind it, and the sunk panel.
const lightOn = { card: SURFACE.card || "#fff", page: SURFACE.page, sunk: SURFACE.sunk };
const check = (label, hex, grounds) => {
  for (const [gname, ground] of Object.entries(grounds)) {
    if (!ground) continue;
    const r = ratio(hex, ground);
    if (r < AA) fail("src/engine/tokens.js", `${label} ${hex} is ${r.toFixed(2)}:1 on ${gname}, under ${AA}.`);
  }
};
Object.entries(TEXT).forEach(([k, v]) => check("TEXT." + k, v, lightOn));
Object.entries(STATE).forEach(([k, v]) => check("STATE." + k, v, lightOn));
// The room screen inverts, so its two readable values are checked on the stage.
["ink", "dim"].forEach(k => { if (ROOM[k]) check("ROOM." + k, ROOM[k], { stage: ROOM.stage }); });

const counted = Object.keys(TEXT).length + Object.keys(STATE).length + 2;
if (bad) {
  console.error(`\ncheck-tokens: ${bad} place(s) outside the system.`);
  process.exit(1);
}
console.log(`check-tokens: every surface reads from tokens.js, and all ${counted} readable tokens clear ${AA}:1 where they sit`);
