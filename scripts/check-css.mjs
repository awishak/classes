// The stylesheet has to still be there.
//
// A surgical edit meant to remove five rules removed a hundred and four,
// because it cut from a marker to the next marker and the next marker was
// much further down the file than I thought. Every check passed and the smoke
// test passed, because a page with no styles renders perfectly well; it just
// looks like 1994.
//
// So: count the rules, and refuse a build that has lost a big share of them.
// The floor is written down rather than guessed, and raising it after adding
// rules is the normal thing to do.

import { readFileSync } from "node:fs";

const FLOORS = [
  { file: "src/engine/Dashboard.jsx", name: "CSS", min: 120 },
  { file: "src/engine/RepoPage.jsx", name: "CSS", min: 75 },
  { file: "src/engine/RepoIdeas.jsx", name: "CSS", min: 30 },
];

let bad = 0;
for (const { file, name, min } of FLOORS) {
  const src = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  const start = src.indexOf("const " + name + " = `");
  if (start < 0) { bad++; console.error(`  ${file}: no ${name} block at all`); continue; }
  const end = src.indexOf("`;", start);
  const block = src.slice(start, end);
  // Interpolations hold braces of their own, so they come out before counting.
  const plain = block.replace(/\$\{[^}]*\}/g, "X");
  const opens = (plain.match(/\{/g) || []).length;
  const closes = (plain.match(/\}/g) || []).length;
  if (opens !== closes) {
    bad++;
    console.error(`  ${file}: ${name} has ${opens} { and ${closes} }, so a rule is cut in half`);
  }
  if (opens < min) {
    bad++;
    console.error(`  ${file}: ${name} is down to ${opens} rules, under the floor of ${min}`);
    console.error("      Either a lot of styling was deleted, or the floor needs raising on purpose.");
  }
}

// A table cell that lays itself out as a flex box is not a table cell any
// more: colSpan stops meaning anything, and a band meant to run the width of
// the table collapses into the first column. That shipped once, on the day
// header of the schedule view, and looked like a layout mystery rather than
// one property in the wrong place.
const CELL_FLEX = /([^{}\n]*)\{([^{}]*)\}/g;
for (const { file } of FLOORS) {
  const src = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  CELL_FLEX.lastIndex = 0;
  let m;
  while ((m = CELL_FLEX.exec(src))) {
    const sel = m[1].trim();
    const body = m[2];
    // Only selectors that end on a cell: `td`, `.repo-tr td`, `th.x`. A class
    // whose name happens to contain those letters is not a cell.
    if (!/(^|[\s>+~])(td|th)([.:#[][^\s]*)?$/.test(sel)) continue;
    if (!/display\s*:\s*(flex|grid|inline-flex|inline-grid)/.test(body)) continue;
    bad++;
    console.error(`  ${file}: ${sel} lays a table cell out as a flex or grid box`);
    console.error("      A cell that does that is no longer a cell, so its colSpan is ignored");
    console.error("      and a row meant to span the table collapses into the first column.");
    console.error("      Put the flex on a box inside the cell instead.");
  }
}

if (bad) { console.error(`\ncheck-css: ${bad} problem(s) with the stylesheets.`); process.exit(1); }

// ─── a class name with no rule ───
//
// A day-title block was rewritten on 28 August. The markup arrived with five
// class names and only one of them kept a rule, so `clear` and `rename`
// rendered as bare browser buttons jammed against the words, and the rename
// hint, which is meant to appear on hover, never went away. Nothing said so for
// six days, because a missing rule is not an error anywhere: the attribute is
// valid, the element renders, and it only looks wrong.
//
// Pooled across the engine rather than checked file by file, because a
// component does not have to own the stylesheet that dresses it: RepoMore and
// RepoTidy render inside RepoPage and are styled by RepoPage's block.
//
// Two things are skipped. A name ending in a dash is a prefix joined to a
// value, and an attribute selector like [class*="cv-out-"] covers the family it
// names.
import { readdirSync } from "node:fs";

const ENGINE = new URL("../src/engine/", import.meta.url);
const files = readdirSync(ENGINE).filter(f => /\.jsx$/.test(f)).sort();
const styled = new Set();
const partial = [];
const used = [];
for (const file of files) {
  const src = readFileSync(new URL(file, ENGINE), "utf8");
  for (const m of src.matchAll(/\.([a-zA-Z][\w-]*)/g)) styled.add(m[1]);
  for (const m of src.matchAll(/\[class\*="([^"]+)"\]/g)) partial.push(m[1]);
  const here = new Set();
  for (const m of src.matchAll(/className="([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && here.add(c));
  for (const m of src.matchAll(/className=\{"([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && here.add(c));
  for (const c of here) used.push([file, c]);
}
let orphans = 0;
for (const [file, c] of used) {
  if (c.endsWith("-") || styled.has(c)) continue;
  if (partial.some(pre => c.startsWith(pre))) continue;
  orphans++;
  console.error(`  src/engine/${file}  .${c} is used and has no rule anywhere`);
}
if (orphans) {
  console.error(`\ncheck-css: ${orphans} class name(s) with nothing behind them.`);
  process.exit(1);
}
console.log("check-css: stylesheets intact, and every class name has a rule");
