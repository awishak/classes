// Builds the Sports and Identity Analysis Guide as a plain Word document,
// word for word from Andrew's PDF (Guide – Sports Identity Analysis.pdf), with
// no formatting beyond the bold he used. A .docx is a zip of XML, so this
// writes the three files Word needs and zips them; no dependency required.
//
//   node scripts/make-guide-docx.mjs
//
// Output: public/AIexample/Sports-and-Identity-Analysis-Guide.docx

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const OUT = resolve("public/AIexample/Sports-and-Identity-Analysis-Guide.docx");
const TMP = resolve("node_modules/.guide-docx");

// Each block is a paragraph: a list of [text, bold] runs. An empty list is a
// blank line. `indent` marks the continuation paragraphs inside a numbered part.
const B = (text) => [text, true];
const T = (text) => [text, false];
const blocks = [
  { runs: [B("Guide – Sports and Identity Analysis")] },
  { runs: [T("COMM 172A - Ishak – 40 pts")] },
  { runs: [] },
  { runs: [B("Purpose: "), T("research and analyze a topic that sits at the intersection of sports and identity.")] },
  { runs: [] },
  { runs: [T("What do I mean by intersection? Your topic should have something to do with sports, and something to do with identity. And each one should be relatively specific. It can’t be “gender in sports” (way too broad) or “women in basketball” (still way to broad). It has to make the reader go: “oh! That’s interesting.”")] },
  { runs: [] },
  { runs: [T("Some examples:")] },
  { runs: [T("• Dealing with Islamaphobia in European soccer")], indent: true },
  { runs: [T("• Female referees in the NFL")], indent: true },
  { runs: [T("• How broadcasters stereotype athletes by race")], indent: true },
  { runs: [T("• How “deceptive speed” is related to race at the wide receiver position in football")], indent: true },
  { runs: [] },
  { runs: [T("Important: your research subject must be approved by me before starting.")] },
  { runs: [] },
  { runs: [T("Please respond clearly and thoughtfully to the following prompts. Answer each prompt separately, and use topic sentences. There are six parts:")] },
  { runs: [] },
  { runs: [T("1. Clearly state your "), B("research intersection (2 pts)"), T(", as well as why you think this is an interesting intersection to research.")] },
  { runs: [] },
  { runs: [T("2. "), B("Popular Press Research (10 pts): "), T("Write a 200-300 word summary of at least 3 popular press articles on this topic. High-quality please. It’s better to find long-form analysis than simply news articles that tell you who, what, when, where, etc. For example, a game summary or quick news story on ESPN doesn’t work well. But a well-researched long-form article about a particular players’ journey to the U.S. Olympic Team can be effective. It might be in the New York Times, or Slate, or the Wall Street Journal, as examples.")] },
  { runs: [] },
  { runs: [T("Then, after this section, please make a reference list in APA or MLA format. (I hate formatting references, too, but it’s the only way to properly pass on sources.)")], indent: true },
  { runs: [] },
  { runs: [T("3. "), B("Visual Media (6 pts): "), T("Write a 150-200 word summary of a TV show, or shows, or similar programming on your topic. Must be at least 30 minutes of viewing, and can be from multiple programs. Must be from a reputable media company or other reputable source. YouTube videos do not count. I repeat: do not watch a random YouTube video and pass it off as sports and identity programming. If you find a video on ESPN’s YouTube page, that works, because it’s ESPN. So the source is ESPN. But YouTube user JordanKobe35 isn’t a reputable source, so don’t use something that isn’t attached to a journalistic source, reputable media producer, or documentary filmmaker.")] },
  { runs: [] },
  { runs: [T("Again, please cite your source or sources in APA or MLA format.")], indent: true },
  { runs: [] },
  { runs: [T("4. "), B("Academic Research (12 pts): "), T("Write a 200-300 word summary of some academic research on this topic. Find at least 3 academic articles that relate to your topic in some way. Some will deal exactly with your topic. Some will be tangentially related. And that’s okay! We’re looking for you to surround the idea and give us a holistic picture. Choose good articles, and find what’s interesting.")] },
  { runs: [] },
  { runs: [T("Then, after this section, please make a reference list in APA or MLA format.")], indent: true },
  { runs: [] },
  { runs: [T("5. "), B("Personal Conversations (5 pts): "), T("Write a 200-300 word summary of personal conversations regarding this topic. First, find at least 3 friends, family, or colleagues who are thoughtful and would be willing to read an article or two (popular press, probably). Share with them what you have found. Then, jump on a call with them. Your summary should include their analysis, their questions, and potential directions for future research based on your conversation. Then, after this section, please include a list of those you spoke with, as well as relevant identity markers (for example, “was the only girl on her high school baseball team”).")] },
  { runs: [] },
  { runs: [T("6. "), B("Summary (5 pts): "), T("Write a 150-250 word summary of your topic. What is it, why does it matter, what makes it interesting, and what are its effects? I recommend outlining this as your first task, and then rewriting it when you have finished all your other responses.")] },
];

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const run = ([text, bold]) =>
  `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const para = ({ runs, indent }) =>
  runs.length === 0
    ? "<w:p/>"
    : `<w:p>${indent ? '<w:pPr><w:ind w:left="720"/></w:pPr>' : ""}${runs.map(run).join("")}</w:p>`;

const body = blocks.map(para).join("");

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
