// The control page for the final project preferences: ?control. How the
// sheet, the pair suggestions, the approvals and the release work, and why.
// Andrew, 2026-10-29: "a control page, an instructor page that tells me
// exactly why everything's happening and exactly how everything is happening."

import * as TOKENS from "../tokens.js";
import * as M from "./model.js";

const RULES = [
  ["The sheet", [
    "A student writes three topics with the questions each raises, three sites they like with what to borrow from each, their strengths, and one of four work preferences.",
    "The partner picker shows for every preference except \"" + M.WORK[3].say + "\" It lists only the classmates in the student's own section.",
    "Every answer saves as typed. Nothing counts as submitted until the student presses submit, and a later edit saves over the earlier answer.",
    "Nobody sees who picked them. The picks sit on the student's own sheet, which only the student and the instructor can read.",
  ]],
  ["Who can be paired", [
    "Two students are a clean pair when both chose \"" + M.WORK[0].say + "\" or \"" + M.WORK[1].say + "\", each picked the other, and both are in the same section.",
    "A student who chose either by-myself answer is never suggested for a pair.",
    "A pair that breaks one of these rules can still be made by hand. The page states which rule is broken and waits for Pair anyway.",
  ]],
  ["COMM 3's sheet", [
    "COMM 3 answers two things COMM 118 does not. First, a definition of social justice with the academic source the definition comes from; both boxes have to be filled before the sheet can be handed in. The page cannot tell an academic source from any other, so the source line is there for the review.",
    "Second, each of the three ideas carries three explanations in place of the questions the topic raises: why the idea is interesting, the angle for a unique and engaging story, and how the idea qualifies as a social justice topic. All nine are required.",
    "The review shows the definition and its source above the student's topics, and the three explanations under each topic.",
  ]],
  ["How pairs are suggested", [
    "The suggestions are the largest set of clean pairs the picks allow. Every way of pairing off each group of connected students is tried, so the count is the true maximum.",
    "Between two sets of the same size, the one with stronger ties wins. Each other's top choice counts 3, one top choice with a pick back counts 2, and two students on each other's longer lists count 1.",
    "Each suggestion carries one sentence of why. Pass removes a suggestion for good, and the rest are worked out again around the pass.",
    "One-way picks are listed under the suggestions, for students who are still on their own after the clean pairs.",
    "Two students with no pick between them are never suggested.",
  ]],
  ["Approving topics", [
    "Approve marks one topic. A student can have two approved at most, so a pair can have four between them.",
    "Reasons are tags on a topic, approved or not. A reason typed on one topic becomes a tag for every other student.",
  ]],
  ["The release", [
    "Students see nothing until Release. The decisions are one private file on the server, which no student's browser can read.",
    "After Release, a student's sheet shows whether they work individually or in a pair, their partner, the approved topics of the pair, and any reasons on their own topics.",
    "Take back hides all of it again.",
  ]],
];

export default function FinalControl({ config, worksheetKey }) {
  const base = "/" + config.id + "/worksheets/" + worksheetKey;
  return (
    <div className="fpc">
      <style>{CSS}</style>
      <div className="fpc-in">
        <h1>{M.FINAL_PREFS_TITLE}, how the page works</h1>
        <p className="fpc-links"><a href={base}>The sheet</a><a href={base + "?review"}>Review</a><a href={base + "?review&demo"}>Review on made-up answers</a></p>
        {RULES.map(([head, lines]) => (
          <section key={head}>
            <h2>{head}</h2>
            <ul>{lines.map(l => <li key={l}>{l}</li>)}</ul>
          </section>
        ))}
        <section>
          <h2>The lines from an open student</h2>
          <table>
            <tbody>
              <tr><td><i className="fpc-line fpc-t3" /></td><td>Each other's top choice</td></tr>
              <tr><td><i className="fpc-line fpc-t2" /></td><td>One top choice, picked back</td></tr>
              <tr><td><i className="fpc-line fpc-t1" /></td><td>On each other's lists</td></tr>
              <tr><td><i className="fpc-line fpc-dash" /></td><td>A one-way pick</td></tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

const T = TOKENS.TEXT, L = TOKENS.LINE;
const CSS = `
.fpc{padding:20px 16px 80px;color:${T.primary}}
.fpc-in{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:22px}
.fpc h1{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.fpc h2{margin:0 0 8px;font-size:20px;font-weight:600}
.fpc ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px;font-size:17px;line-height:1.5}
.fpc-links{margin:0;display:flex;gap:18px;flex-wrap:wrap;font-size:16px}
.fpc-links a{color:${T.primary};font-weight:600}
.fpc table{border-collapse:collapse;font-size:17px}
.fpc td{padding:6px 14px 6px 0;border-bottom:1px solid ${L.soft}}
.fpc-line{display:block;width:44px;border-top:4px solid var(--c)}
.fpc-t3{--c:#d4a106}.fpc-t2{--c:#8b5cf6}.fpc-t1{--c:#0ea5e9}.fpc-dash{--c:${T.secondary};border-top-style:dashed;border-top-width:2px}
`;
