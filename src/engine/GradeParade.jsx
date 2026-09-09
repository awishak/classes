// Grades so far: every assignment as a tile in a row, grey until a grade
// comes in, and then the class colour with the letter on top.
//
// Andrew, 2026-09-09: "instead of current grade, I would rather show
// students: Grades so far, and have a little parade of grades." A percent
// was one number with nothing behind it, and the question students asked
// most was what was in it. The parade answers by showing every assignment
// at once: what is graded, what is still to come, and how the term is going,
// with no maths.
//
// A grade from the columns already carries its letter. A grade from the older
// flow is a number out of 100, and letterOf turns that into the same word so
// every tile speaks the same language.

import { computeGrade } from "./AssignmentsCard.jsx";
import { letterOf } from "./grades.js";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_MUTED = TOKENS.TEXT.muted;
const SUNK = TOKENS.SURFACE.sunk;
const LINE = TOKENS.LINE.soft;

// What a tile reads once graded. Incomplete needs a short form on a tile.
const short = (letter) => (letter === "Incomplete" ? "Inc" : letter);

export default function GradeParade({ config, data, name, accent, compact }) {
  const { rows } = computeGrade(config, data, name);
  if (!rows.length) return <div style={{ fontSize: 15, color: TEXT_MUTED }}>No assignments yet.</div>;
  const size = compact ? 36 : 84;
  return (
    <div aria-label="Grades so far" style={{ display: "flex", flexWrap: "wrap", gap: compact ? 6 : 8 }}>
      {rows.map(r => {
        const letter = r.letter || (r.score != null ? letterOf(r.score) : null);
        const graded = !!letter;
        // A full tile grows to its title rather than cutting the title to fit:
        // "Intersections Proposal" reads whole, on as many lines as the words
        // need, and no word is ever broken in the middle.
        const tile = { width: compact ? size : "auto", minWidth: size, maxWidth: compact ? size : 200, minHeight: size,
          borderRadius: compact ? 8 : 12, fontFamily: F, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center", padding: compact ? 0 : "8px 6px", boxSizing: "border-box",
          background: graded ? accent : SUNK, border: "1px solid " + (graded ? accent : LINE), color: graded ? "#fff" : TEXT_MUTED };
        if (compact) {
          return (
            <div key={r.id} title={r.title + (graded ? ": " + letter : ", not graded yet")} style={{ ...tile, fontSize: 15, fontWeight: 700 }}>
              {graded ? short(letter) : ""}
            </div>
          );
        }
        return (
          <div key={r.id} style={tile}>
            {graded ? <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" }}>{short(letter)}</div> : null}
            <div style={{ fontSize: 13, fontWeight: graded ? 600 : 500, lineHeight: 1.25, marginTop: graded ? 6 : 0,
              whiteSpace: "normal", overflowWrap: "normal", wordBreak: "keep-all", hyphens: "none" }}>{r.title}</div>
          </div>
        );
      })}
    </div>
  );
}
