// A button wired to nothing.
//
// check-refs catches a component with no definition. The smoke run catches
// anything that throws on render. Neither catches onSaveClaim={() => {}} —
// it renders perfectly and only fails when somebody presses it, which is how
// Readings & Media shipped with a Save button that threw the headline away.
//
// So: an on-something prop handed an empty function is almost certainly a
// stub somebody meant to come back to. Where it is deliberate, say so with a
// comment on the same line and this leaves it alone.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".jsx")) files.push(p);
  }
})("src");

// on<Something>={() => {}} or ={()=>{}} or ={function(){}}
const DEAD = /\bon[A-Z]\w*=\{\s*(\(\s*\)|\([^)]*\))\s*=>\s*\{\s*\}\s*\}/g;
const LEGACY = /^src\/(Comm\d+|Grades\d*|components|AdminDash|QuizSystem|GameSystem\d*)\.jsx$/;

let failed = 0;
for (const file of files) {
  const norm = file.split("\\").join("/");
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    DEAD.lastIndex = 0;
    const m = DEAD.exec(line);
    if (!m) return;
    if (/\/\/|\/\*/.test(line.slice(m.index))) return; // explained on the line
    const label = m[0].split("=")[0];
    if (LEGACY.test(norm)) { console.warn(`  warn  ${norm}:${i + 1}  ${label} does nothing`); return; }
    console.error(`  FAIL  ${norm}:${i + 1}  ${label} is wired to an empty function`);
    failed++;
  });
}

if (failed) {
  console.error(`\ncheck-handlers: ${failed} handler(s) wired to nothing. Give it a real function, or say on the same line why it is empty.`);
  process.exit(1);
}
console.log(`check-handlers: ${files.length} files scanned, nothing wired to nothing`);
