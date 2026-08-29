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
  { file: "src/engine/RepoPage.jsx", name: "CSS", min: 30 },
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

if (bad) { console.error(`\ncheck-css: ${bad} problem(s) with the stylesheets.`); process.exit(1); }
console.log("check-css: stylesheets intact");
