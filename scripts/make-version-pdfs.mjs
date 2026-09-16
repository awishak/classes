// Prints the three student versions on the AI example page as PDFs that look
// like turned-in assignments: Times New Roman, double spaced, one-inch
// margins, name and course block top left. The text comes straight out of
// public/AIexample/index.html, with the highlight marks and margin notes
// stripped, so the PDFs never drift from the page.
//
//   node scripts/make-version-pdfs.mjs
//
// Needs Google Chrome installed; prints with its headless mode.
// Output: public/AIexample/<Name>-Sports-and-Identity-Analysis.pdf, one each.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const PAGE = resolve("public/AIexample/index.html");
const OUT_DIR = resolve("public/AIexample");
const TMP = resolve("node_modules/.version-pdfs");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const students = [
  { file: "Gabriel", name: "Gabriel Moreno", date: "October 14, 2026", title: "Sports and Identity Analysis" },
  { file: "Emily", name: "Emily Reyes", date: "October 14, 2026", title: null },
  { file: "Seb", name: "Seb Kowalski", date: "October 14, 2026", title: "Sports and Identity Analysis" },
];

const html = readFileSync(PAGE, "utf8");
// The three graded versions are the .doc blocks followed by an aside. The
// five-more docs at the bottom are followed by a notice, so they don't match.
const docs = [...html.matchAll(/<div class="doc">([\s\S]*?)<\/div>\s*<div class="aside">/g)].map(m => m[1]);
if (docs.length !== 3) throw new Error("expected 3 version docs, found " + docs.length);

const clean = s => s
  .replace(/<span class="note[^"]*"[^>]*>[\s\S]*?<\/span>/g, "")
  .replace(/<\/?mark[^>]*>/g, "")
  .replace(/<h3 class="headline">/g, '<h1 class="headline">')
  .replace(/<\/h3>\s*<p>/g, (m) => m) // keep structure
  .replace(/\s+\n/g, "\n");

// Emily's headline is an h3.headline in the page; after clean() it is an h1
// and we close it properly.
const fixHeadline = s => s.replace(/<h1 class="headline">([\s\S]*?)<\/h3>/, '<h1 class="headline">$1</h1>');

const template = (s, body) => `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { size: Letter; margin: 1in; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 2; color: #000; margin: 0; }
  .head p { margin: 0; }
  h1.title { font-size: 12pt; font-weight: normal; text-align: center; margin: 0; }
  h1.headline { font-size: 14pt; font-weight: bold; text-align: center; margin: 0 0 0; }
  h3 { font-size: 12pt; font-weight: bold; margin: 0; }
  p { margin: 0; text-indent: 0.5in; }
  .refs p { text-indent: -0.5in; padding-left: 0.5in; }
  .refs p strong { font-weight: bold; }
  .refs { margin-top: 0; }
  ul { margin: 0; padding-left: 0.5in; }
  li { margin: 0; }
  em { font-style: italic; }
</style></head>
<body>
<div class="head">
  <p>${s.name}</p>
  <p>Professor Ishak</p>
  <p>COMM 172A</p>
  <p>${s.date}</p>
</div>
${s.title ? `<h1 class="title">${s.title}</h1>` : ""}
${body}
</body></html>`;

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

students.forEach((s, i) => {
  const body = fixHeadline(clean(docs[i]));
  const src = join(TMP, s.file + ".html");
  const out = join(OUT_DIR, `${s.file}-Sports-and-Identity-Analysis.pdf`);
  writeFileSync(src, template(s, body));
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
    "--print-to-pdf=" + out, "file://" + src,
  ], { stdio: "ignore" });
  console.log("wrote " + out);
});

rmSync(TMP, { recursive: true, force: true });
