// A comment with its formatting, wherever one is read: the challenge page
// the student opens, the card on the grade board, the assignment log. The
// HTML is what toHtml in grades.js makes of a card's comment, or what the
// rich editor wrote, and both read the same here: paragraphs with a little
// air between them, bullets indented, bold where bold was asked for, and a
// link that opens in a new tab. The text colour is whatever the surface
// around the comment set, so a bubble and a card keep their own.

import * as TOKENS from "./tokens.js";

const TEXT_MUTED = TOKENS.TEXT.muted;

const CSS = `
.rc{line-height:1.5;overflow-wrap:anywhere}
.rc p,.rc ul,.rc div{margin:0}
.rc p+p,.rc ul+p,.rc div+div,.rc ul+ul{margin-top:10px}
.rc p+ul{margin-top:4px}
.rc ul{padding-left:20px}
.rc li{margin:2px 0}
.rc li::marker{color:${TEXT_MUTED}}
.rc strong{font-weight:700}
.rc a{color:inherit;font-weight:600;word-break:break-all}
`;

export function RichComment({ html, size = 15, style }) {
  if (!html) return null;
  return (
    <>
      <style>{CSS}</style>
      <div className="rc" style={{ fontSize: size, ...style }} dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
