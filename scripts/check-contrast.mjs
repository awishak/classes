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
if (bad) { console.error(`check-contrast: ${bad} section colour(s) below AA.`); process.exit(1); }
console.log(`check-contrast: ${SEC.length} section colours, all at or above ${AA}:1`);
