// The box a student ticks, and the names it turns into on my side.
//
// Andrew, 2026-09-21: "create a checkbox on the schedule next to each day for
// the students ... when they do, on my page as instructor, it shows who will
// not be in attendance." Both sit on a day of the schedule and on the next
// class card, so both live here rather than twice over.
//
// The box is checked until a student says otherwise, which means the checked
// state is not a fact in the store: it is the absence of one. See attendance.js.

import { useState } from "react";
import * as TOKENS from "./tokens.js";
import { awayBySitting } from "./attendance.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const TAP = TOKENS.TAP;

const label = { fontFamily: TOKENS.FONT.label, fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };

// One day, one student, one answer.
//
// The write goes to the server and back, and the first write of a day waits for
// a backup before it lands, so the box shows what was pressed while that is in
// flight. A write that does not land puts the box back where it was, because
// the only thing worse than a slow box is one that says a student told me
// something they did not tell me.
export function ComingBox({ checked, onChange, accent }) {
  const [want, setWant] = useState(null);
  const shown = want === null ? checked : want;
  const press = async (v) => {
    setWant(v);
    try { await onChange(v); } finally { setWant(null); }
  };
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, minHeight: TAP, fontFamily: F,
      fontSize: 16, color: TEXT_PRIMARY, cursor: "pointer" }}>
      <input type="checkbox" checked={shown} onChange={e => press(e.target.checked)}
        style={{ width: 20, height: 20, accentColor: accent || "var(--ca-accent)", cursor: "pointer" }} />
      I'll be there
    </label>
  );
}

// Who will not be there, in the sittings they belong to. Nothing at all when
// nobody has said, because a line that says nobody is missing is a line to read
// on every day of the term.
export function AwayList({ config, data, date }) {
  const groups = awayBySitting(config, data, date);
  if (!groups.length) return null;
  return (
    <div style={{ fontFamily: F, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={label}>Will not be in attendance</span>
      {groups.map(g => (
        <div key={g.label || "all"} style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 15, lineHeight: 1.5 }}>
          {g.label ? (
            <span style={{ fontFamily: TOKENS.FONT.label, fontWeight: 700, color: TEXT_SECONDARY, flex: "none" }}>{g.label}</span>
          ) : null}
          <span style={{ color: TEXT_PRIMARY, minWidth: 0 }}>{g.rows.map(r => r.name).join(", ")}</span>
        </div>
      ))}
    </div>
  );
}
