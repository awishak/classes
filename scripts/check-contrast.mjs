// The section colours have to stay readable.
//
// They are generated, so nobody looks at them one at a time, and three of the
// first eight were under the line — the greens and cyans, which come out pale
// at a lightness that suits blue. This recomputes every one of them against
// white and fails the build if any drops below WCAG AA for body text.

import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/engine/Dashboard.jsx", import.meta.url), "utf8");
const m = src.match(/const SEC = (\[\[[\d,\s\[\]]+\]\]);/);
if (!m) { console.error("check-contrast: could not find the SEC table"); process.exit(1); }
const SEC = JSON.parse(m[1]);

const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const hsl = (h, s, l) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)];
};
const AA = 4.5;
let bad = 0;
for (const [hue, l] of SEC) {
  const [r, g, b] = hsl(hue, 0.62, l / 100);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = 1.05 / (L + 0.05);
  if (ratio < AA) { bad++; console.error(`  FAIL  hue ${hue} at ${l}% is ${ratio.toFixed(2)}:1 on white, under ${AA}`); }
}

// ─── the palette ───
// Every swatch carries WHITE text, and that is the whole reason the light tier
// of each hue is only as light as it is. A genuinely light yellow with white on
// it cannot be read, so the palette does not contain one. This recomputes all
// twenty and fails the build if any drops under the line.
const pal = readFileSync(new URL("../src/engine/colors.js", import.meta.url), "utf8");
const swatches = [...pal.matchAll(/name: "([^"]+)",\s+hex: "(#[0-9a-f]{6})"/g)];
if (!swatches.length) { console.error("check-contrast: no swatches found in colors.js"); process.exit(1); }
for (const [, name, hex] of swatches) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = 1.05 / (L + 0.05);          // white text sitting on this swatch
  if (ratio < AA) { bad++; console.error(`  FAIL  ${name} ${hex} gives white text ${ratio.toFixed(2)}:1, under ${AA}`); }
}

if (bad) { console.error(`check-contrast: ${bad} colour(s) below AA.`); process.exit(1); }
console.log(`check-contrast: ${SEC.length} section colours and ${swatches.length} palette swatches, all at or above ${AA}:1`);

// ─── the same swatches, as ink ───
//
// A library row is a grey card with its words in the kind's colour, which is
// the opposite job from the fills above: those carry white, these have to be
// read ON white and on the sunk grey. The light tier fails that job by a hair,
// so the ink is derived by darkening each channel to 85%. Checked here, not
// trusted, because a swatch added later has to earn the same clearance.
// Imported rather than copied. The first version of this check carried its own
// darkening rule, so changing the one the app uses left the check passing: a
// check that tests its own copy of a thing tests nothing.
const INK_ON = [["white", "#ffffff"], ["the sunk grey", "#f6f4f1"]];
const { inkOf } = await import("../src/engine/colors.js");
let inkBad = 0;
for (const [, name, hex] of swatches) {
  const ink = inkOf(hex);
  const [r, g, b] = [1, 3, 5].map(i => parseInt(ink.slice(i, i + 2), 16) / 255);
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  for (const [where, ground] of INK_ON) {
    const [gr, gg, gb] = [1, 3, 5].map(i => parseInt(ground.slice(i, i + 2), 16) / 255);
    const GL = 0.2126 * lin(gr) + 0.7152 * lin(gg) + 0.0722 * lin(gb);
    const [hi, lo] = [L, GL].sort((x, y) => y - x);
    const ratio = (hi + 0.05) / (lo + 0.05);
    if (ratio < AA) {
      inkBad++;
      console.error(`  FAIL  ${name} as ink is ${ink} at ${ratio.toFixed(2)}:1 on ${where}, under ${AA}`);
    }
  }
}
if (inkBad) {
  console.error(`\ncheck-contrast: ${inkBad} swatch(es) unreadable as ink.`);
  process.exit(1);
}
console.log(`check-contrast: all ${swatches.length} swatches read as ink on white and on the sunk grey`);
