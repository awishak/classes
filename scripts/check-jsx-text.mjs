// Catch text that renders as itself instead of as what it meant.
//
// JSX children are not JavaScript strings. A backslash-u escape written there
// is six literal characters on the screen, and that is exactly what shipped:
// a button reading backslash-u-2192 where an arrow belonged. Andrew found it
// before I did, by asking what the button was for.
//
// The check looks only at true JSX text: a run between a closing > and the
// next <, containing no braces at all. Inside braces it is JavaScript and an
// escape there is correct, which is why the first version of this check
// reported forty-four lines and meant none of them.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../src/", import.meta.url).pathname;
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    if (/\.jsx$/.test(full)) files.push(full);
  }
})(ROOT);

let bad = 0;
for (const file of files) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    // Every run of plain text between tags on this line.
    for (const m of line.matchAll(/>([^<>{}]+)</g)) {
      const text = m[1];
      if (!/\\u[0-9a-fA-F]{4}|\\n|\\t/.test(text)) continue;
      bad++;
      console.error(`  ${file.replace(ROOT, "src/")}:${i + 1}  an escape in JSX text renders as its own characters`);
      console.error(`      ${JSON.stringify(text.trim().slice(0, 80))}`);
    }
  });
}

if (bad) {
  console.error(`\ncheck-jsx-text: ${bad} place(s) render as source rather than as content.`);
  process.exit(1);
}
console.log(`check-jsx-text: ${files.length} files scanned, no escapes stranded in JSX text`);
