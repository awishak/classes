// Build the local grade view: Claude's draft grades in a panel above each
// student's story, one page, the story drawn by the site's own component.
// Writes view.html, view.js and view-data.js into ~/Projects/visual-story-grading.
// Local only; student names and grades are not published or committed.
//
//   node scripts/comm3-visual-grade-table.mjs --json     first, for the letters
//   node scripts/comm3-visual-grade-view.mjs
//   open ~/Projects/visual-story-grading/view.html

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const BASE = homedir() + "/Projects/visual-story-grading";
const rows = JSON.parse(readFileSync(BASE + "/table.json", "utf8"));
const notes = JSON.parse(readFileSync(BASE + "/claude-notes.json", "utf8"));
const pre = JSON.parse(readFileSync(BASE + "/claude-pre.json", "utf8"));
// Andrew's rulings override Claude's letters and notes (andrew.json, from his transcript).
const andrew = existsSync(BASE + "/andrew.json") ? JSON.parse(readFileSync(BASE + "/andrew.json", "utf8")) : {};
const ov = (r) => andrew[r.id]?.overall || r.overall || "";
const data = JSON.parse(readFileSync(BASE + "/data.json", "utf8"));
const byId = new Map(data.students.map(s => [s.id, s]));
const surname = (n) => n.split(" ").slice(1).join(" ").toLowerCase();

// Sorted by the grade Claude would give, best first (Andrew, 2026-11-10: "sort
// by what grade you think they deserve"), and inside a letter by the weighted
// score, so the strongest A is first and the weakest C is last of the C's.
const PT = { A: 4, B: 3, C: 2, D: 1 };
const ORDER = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "Not submitted"];
const scoreOf = (r) => (PT[r.imagery] || 0) * 0.35 + (PT[r.story] || 0) * 0.35 + (PT[r.directions] || 0) * 0.15 + (PT[r.work] || 0) * 0.15;
const rank = (r) => { const i = ORDER.indexOf(ov(r)); return i < 0 ? ORDER.length : i; };
// Pre-production beside the final (Andrew, 2026-11-10: "i need to know how
// their pre-production idea translates to their final idea. did i okay their idea?").
const TYPES = { scene: "A scene with its own rules", tradition: "A tradition", values: "Someone who creates their own values" };
const one = (t) => String(t || "").replace(/\s+/g, " ").trim();
const preOf = (s) => {
  const p = s.pre, a = p?.answers || {}, r = p?.review, mine = pre[s.id] || {};
  const onTime = p?.submitted && Date.parse(p.submitted) <= Date.parse(data.preDue) + 60000;
  const day = (t) => new Date(t).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" });
  if (!p) return { none: true, kept: mine.kept || "", say: mine.say || "No pre-production page." };
  return {
    type: TYPES[a.prompt] || "No type chosen",
    review: r ? (r.status === "approved" ? "You approved it" : "You marked it needs work") + (r.note ? ": “" + one(r.note) + "”" : "") : "You did not review it",
    // A review dated before the Submit stamp means Submit was pressed (or pressed again) after
    // Andrew's note. The database keeps only the page as it stands now, so the pitch shown may
    // be a rewrite, and the stamp does not prove the first version was late.
    when: !p.submitted ? "Never submitted" : onTime ? "On time" : r && Date.parse(r.at) < Date.parse(p.submitted)
      ? `You reviewed it ${day(r.at)}; Submit was last pressed ${day(p.submitted)}. The pitch below is the page as it stands now, which may be a rewrite after your note`
      : "Late, " + day(p.submitted),
    topic: one(a.topic), learn: one(a.learn), headline: one(a.headline), kept: mine.kept || "", say: mine.say || "",
  };
};
const people = rows.slice().sort((a, b) => rank(a) - rank(b) || scoreOf(b) - scoreOf(a) || surname(a.name).localeCompare(surname(b.name))).map(r => {
  const s = byId.get(r.id), st = s.story, a = andrew[r.id] || {}, n = { ...(notes[r.id] || {}), ...a };
  const hasStory = !!(st && (st.images || st.html));
  const htmlFile = `${BASE}/images/${r.id}/story.html`;
  const blocks = hasStory ? st.blocks.map((b, i) => b.type === "text" ? { id: "t" + i, type: "text", text: b.text }
    : { id: "i" + b.no, path: "i" + b.no, type: "image", w: b.w, h: b.h, layout: b.layout, caption: b.caption, graphic: b.graphic, source: b.source, by: b.by ? "other" : "", byName: b.by || "" }) : [];
  return {
    id: r.id, name: r.name, section: r.section, overall: ov(r), ruled: !!a.overall, mine: r.overall || "", note: a.note || "", flag: a.flag || "",
    facts: !hasStory ? "No story started." : st.html ? "Made as a web page." + (st.htmlFile ? "" : " The file was never uploaded.") : `${st.images} images, ${st.graphics} of them graphics, ${st.words} words.`,
    best: Object.entries(s.received.votes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `image ${k} (${v})`).join(", "),
    story: hasStory ? { headline: st.headline, link: st.link, look: st.look, kind: st.kind, feature: "", blocks } : null,
    urls: Object.fromEntries(blocks.filter(b => b.type === "image").map(b => [b.id, `images/${r.id}/${b.id.slice(1)}.jpg`])),
    htmlSrc: hasStory && st.html && existsSync(htmlFile) ? `images/${r.id}/story.html` : "",
    pre: preOf(s),
    parts: [
      r.imagery ? { label: "Imagery", letter: a.i || r.imagery, yours: !!a.i, near: !a.i && !a.overall && r.near === "i", plus: n.ip || "", enc: n.ie || "" } : null,
      r.story ? { label: "Storytelling", letter: a.s || r.story, yours: !!a.s, near: !a.s && !a.overall && r.near === "s", plus: n.sp || "", enc: n.se || "" } : null,
      { label: "Directions", letter: a.d || (r.directions === "-" ? "None" : r.directions === "revise" ? "Short of the minimum" : r.directions), yours: !!a.d, plus: a.d || !r.slips.length ? "Everything asked for is there." : "", off: a.d ? "" : r.slips.join("; ") },
      { label: "Work", letter: r.work === "-" ? "None" : r.work, counted: r.workSay },
    ].filter(Boolean),
  };
});

writeFileSync(BASE + "/view-data.js", "window.VS = " + JSON.stringify(people).replace(/</g, "\\u003c") + ";\n");
execFileSync(ROOT + "node_modules/.bin/esbuild", [ROOT + "scripts/comm3-visual-grade-view.jsx", "--bundle", "--format=iife", "--jsx=automatic", "--loader:.js=jsx", "--minify", "--log-level=error", "--define:process.env.NODE_ENV=\"production\"", "--outfile=" + BASE + "/view.js"], { cwd: ROOT, stdio: "inherit" });
const fonts = readFileSync(ROOT + "index.html", "utf8").match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]+>/)?.[0] || "";
writeFileSync(BASE + "/view.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Visual story grades</title>${fonts}</head><body><div id="root"></div><script src="view-data.js"></script><script src="view.js"></script></body></html>\n`);
console.log("wrote " + BASE + "/view.html, " + people.length + " students");
