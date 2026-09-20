// Build guard for a bug the bundler cannot see: a JSX component used in a file
// where it is neither defined, imported, nor passed in as a prop. Undeclared
// identifiers are legal JavaScript until they run, so this only ever surfaced
// as a blank screen and a ReferenceError in the console.
//
// Engine and shared code fail the build. The older per-class files (Comm118,
// Comm2, Comm4) only warn — they carry findings that predate this check and
// blocking on them would just get the guard switched off.

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

const LEGACY = /^src\/(Comm\d+|Grades\d*|components|AdminDash|QuizSystem|GameSystem\d*)\.jsx$/;
const BUILT_IN = new Set(["React", "Fragment"]);

// Comments hold example JSX that is not a real reference, so they come out
// before anything is counted. Taking them out needs to know where a string is:
// `accept="image/*"` is not the start of a comment, and pairing it with the
// next `*/` swallowed everything between, so a file failed for two components
// it defines a hundred lines further down. A line comment is still only one
// that starts its line, because https:// is not a comment either.
const strip = (src) => {
  let out = "", i = 0, bare = true;   // bare: nothing but whitespace on this line so far
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "*") { const end = src.indexOf("*/", i + 2); i = end < 0 ? src.length : end + 2; continue; }
    if (c === "/" && d === "/" && bare) { const end = src.indexOf("\n", i); i = end < 0 ? src.length : end; continue; }
    if (c === '"' || c === "'" || c === "`") {
      out += c; i++;
      while (i < src.length) {
        const ch = src[i]; out += ch; i++;
        if (ch === "\\") { out += src[i] ?? ""; i++; continue; }
        if (ch === c) break;
      }
      bare = false;
      continue;
    }
    if (c === "\n") bare = true;
    else if (c !== " " && c !== "\t" && c !== "\r") bare = false;
    out += c; i++;
  }
  return out;
};

let failed = 0, warned = 0;

for (const file of files) {
  const src = strip(readFileSync(file, "utf8"));
  const used = new Set([...src.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)].map(m => m[1]));
  const known = new Set([
    ...[...src.matchAll(/function\s+([A-Z][A-Za-z0-9_]*)/g)].map(m => m[1]),
    ...[...src.matchAll(/(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=/g)].map(m => m[1]),
    ...[...src.matchAll(/import\s+([\s\S]+?)\s+from/g)].flatMap(m => [...m[1].matchAll(/[A-Z][A-Za-z0-9_]*/g)].map(x => x[0])),
    // Components handed in as props: function Foo({ BioComponent, ... })
    ...[...src.matchAll(/\{([^{}]*)\}\s*(?:=|\)|,)/g)].flatMap(m => [...m[1].matchAll(/\b([A-Z][A-Za-z0-9_]*)\b/g)].map(x => x[1])),
  ]);
  const missing = [...used].filter(n => !known.has(n) && !BUILT_IN.has(n)).sort();
  if (!missing.length) continue;
  const norm = file.split("\\").join("/");
  if (LEGACY.test(norm)) { console.warn(`  warn  ${norm}: ${missing.join(", ")}`); warned += missing.length; }
  else { console.error(`  FAIL  ${norm}: ${missing.join(", ")}`); failed += missing.length; }
}

if (failed) {
  console.error(`\ncheck-refs: ${failed} component reference(s) with no definition, import, or prop.`);
  process.exit(1);
}
console.log(`check-refs: ${files.length} files scanned, ${warned} legacy warning(s)`);
