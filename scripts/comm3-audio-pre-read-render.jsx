// Draw every read through the review page's own panel, off the local copy
// (~/Projects/audio-pre-grading/read.json, from the push script's --local),
// to catch a read the panel cannot draw before the file goes up.
//
//   esbuild scripts/comm3-audio-pre-read-render.jsx --bundle --platform=node --format=esm --packages=external --jsx=automatic --loader:.js=jsx --outfile=node_modules/.read-render.mjs --log-level=error && node node_modules/.read-render.mjs

import "./smoke-globals.js";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { renderToStaticMarkup } from "react-dom/server";
import { ReadPanel, ReadSummary } from "../src/engine/audiostory/prepages.jsx";

const BASE = homedir() + "/Projects/audio-pre-grading";
const read = JSON.parse(readFileSync(BASE + "/read.json", "utf8"));
const list = Object.entries(read.students);
let html = renderToStaticMarkup(<ReadSummary reads={list.map(x => x[1])} notes={read.notes} />);
for (const [email, r] of list) {
  const one = renderToStaticMarkup(<ReadPanel read={r} sheet={{ submitted_at: read.at }} at={read.at} />);
  if (!one.includes("apr-three")) throw new Error(email + ": opening, thesis and closing not drawn");
  html += "<h1>" + email + "</h1>" + one;
}
writeFileSync(BASE + "/render.html", "<!doctype html><meta charset=utf-8><body style='font-family:sans-serif;max-width:1000px;margin:auto'>" + html);
console.log("drew " + list.length + " reads, " + html.length + " characters; wrote " + BASE + "/render.html");
