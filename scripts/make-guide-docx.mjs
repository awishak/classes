// Builds the Sports and Identity Analysis Guide as a plain Word document, in
// Andrew's wording, with no formatting beyond a bold title and bold part
// names. A .docx is a zip of XML, so this writes the three files Word needs
// and zips them; no dependency required.
//
//   node scripts/make-guide-docx.mjs
//
// Output: public/AIexample/Sports-and-Identity-Analysis-Guide.docx

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const OUT = resolve("public/AIexample/Sports-and-Identity-Analysis-Guide.docx");
const TMP = resolve("node_modules/.guide-docx");

const title = "Sports and Identity Analysis Guide, COMM 172A, 40 pts";

const purpose = [
  ["Purpose: ", true],
  ["research and analyze a topic that sits at the intersection of sports and identity. The intersection has to be specific enough to make the reader think, “oh, that’s interesting,” not something broad like “gender in sports.” Research subject must be approved before starting.", false],
];

const parts = [
  ["Research intersection (2 pts): ", "state it clearly, and explain why it’s interesting."],
  ["Popular press research (10 pts): ", "200 to 300 word summary of at least three high-quality popular press articles, long-form analysis rather than quick news pieces, plus a reference list."],
  ["Visual media (6 pts): ", "150 to 200 word summary of at least 30 minutes of TV or similar programming from a reputable source, plus a citation."],
  ["Academic research (12 pts): ", "200 to 300 word summary of at least three academic articles, plus a reference list."],
  ["Personal conversations (5 pts): ", "200 to 300 word summary of conversations with at least three thoughtful people you shared the research with, including their analysis, questions, and future directions, plus a list of who you spoke with and relevant identity markers."],
  ["Summary (5 pts): ", "150 to 250 word summary of what the topic is, why it matters, what’s interesting, and its effects."],
];

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const run = (text, bold) =>
  `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const para = runs => `<w:p>${runs.map(([t, b]) => run(t, b)).join("")}</w:p>`;
const blank = () => "<w:p/>";

const body = [
  para([[title, true]]),
  blank(),
  para(purpose),
  blank(),
  ...parts.map(([name, text], i) => para([[`${i + 1}. `, false], [name, true], [text, false]])),
].join("");

const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

rmSync(TMP, { recursive: true, force: true });
mkdirSync(join(TMP, "_rels"), { recursive: true });
mkdirSync(join(TMP, "word"), { recursive: true });
writeFileSync(join(TMP, "[Content_Types].xml"), contentTypes);
writeFileSync(join(TMP, "_rels", ".rels"), rels);
writeFileSync(join(TMP, "word", "document.xml"), document);

rmSync(OUT, { force: true });
execFileSync("zip", ["-X", "-r", OUT, "[Content_Types].xml", "_rels", "word"], { cwd: TMP, stdio: "ignore" });
rmSync(TMP, { recursive: true, force: true });
console.log("wrote " + OUT);
