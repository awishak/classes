// Writes src/engine/primarybold/style.js from the mockup page's stylesheet, so the
// built pages and the mockups Andrew approved are the same rules and not a
// retyped copy. Run again whenever the mockup's stylesheet changes:
//
//   node scripts/primary-bold-style-from-mockup.mjs
//
// Every selector is put under .pbold, the root the built pages share, so a rule
// here cannot reach the rest of the site and the site's rules for .row or
// .panel cannot reach in. Keyframes get a pbold- name for the same reason.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "docs/primary-bold/primary-bold-mockups.html"), "utf8");
const from = html.indexOf("/* ── the site ── */"), to = html.indexOf("</style>", from);
if (from < 0 || to < 0) throw new Error("the mockup's stylesheet was not found");
let css = html.slice(from, to).replace(/\/\*[\s\S]*?\*\//g, "");

// Split a block into its top-level rules: [{ head, body }].
function rules(text) {
  const out = []; let depth = 0, start = 0, head = "", open = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "{") { if (depth === 0) { head = text.slice(start, i).trim(); open = i + 1; } depth++; }
    else if (c === "}") { depth--; if (depth === 0) { out.push({ head, body: text.slice(open, i) }); start = i + 1; } }
  }
  return out;
}
const frames = new Set();
rules(css).forEach(r => { const m = r.head.match(/^@keyframes\s+(\S+)/); if (m) frames.add(m[1]); });

// .site is the root in the mockup; here the root is .cu, and a ground is a class on it.
const sel = (s) => s.split(",").map(x => {
  x = x.trim();
  if (x === ".site") return ".pbold";
  if (x.startsWith(".site.") || x.startsWith(".site ") || x.startsWith(".site:")) return ".pbold" + x.slice(5);
  return ".pbold " + x;
}).join(",");
const names = (body) => body.replace(/animation:([^;}]+)/g, (m, v) => "animation:" + v.replace(/[a-z]+/g, w => (frames.has(w) ? "pbold-" + w : w)));
function emit(text) {
  return rules(text).map(r => {
    if (/^@keyframes/.test(r.head)) return r.head.replace(/^@keyframes\s+/, "@keyframes pbold-") + "{" + r.body.trim() + "}";
    if (r.head.startsWith("@")) return r.head + "{\n" + emit(r.body).split("\n").map(l => "  " + l).join("\n") + "\n}";
    return sel(r.head) + "{" + names(r.body.trim()) + "}";
  }).join("\n");
}
const out = emit(css);
const file = resolve(root, "src/engine/primarybold/mockup.css.js");
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, "// Written by scripts/primary-bold-style-from-mockup.mjs from docs/primary-bold. Do not edit by hand:\n// change the mockup's stylesheet, or add a rule to style.js, and run the script.\n\nexport const MOCKUP_CSS = `\n" + out.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "\n`;\n");
console.log("wrote " + file + ", " + out.split("\n").length + " lines");
