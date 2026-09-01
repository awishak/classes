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
console.log("check-css: stylesheets intact");
