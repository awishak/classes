// The grade deck. A released grade is a full-screen card the next time a
// student opens the class, one per assignment, and the site waits behind the
// stack until every card has been read. See DESIGN.md on what a deck is: one
// card, one thing, the way forward as the only control, and the way back to
// the card before as the only other.
//
// The cards come from grades.js's unseenGrades, and Got it writes the seen
// stamp so the same card never comes round twice.

import { useState } from "react";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BG = TOKENS.SURFACE.page;
const WHITE = TOKENS.SURFACE.card;
const LINE = TOKENS.LINE.soft;
const TAP = TOKENS.TAP;

export default function GradeDeck({ config, items, onSeen, onDone, children }) {
  // The stack is fixed when the deck opens. Got it writes a seen stamp, and
  // that write comes back through the store and would shorten a live list
  // under the reader's thumb.
  const [stack] = useState(() => items || []);
  const [i, setI] = useState(0);
  const a = config.accent;
  if (i >= stack.length) return children || null;

  const card = stack[i];
  const gotIt = () => { onSeen?.(card.aid); if (i + 1 >= stack.length) onDone?.(); setI(i + 1); };
  const paragraphs = card.comment ? card.comment.split(/\n{2,}/).filter(Boolean) : [];

  return (
    <div aria-label="Your grades" style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: TAP }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>{config.code} · A grade is in</span>
          <span style={{ fontSize: 15, color: TEXT_MUTED }}>{i + 1} of {stack.length}</span>
        </div>

        <section style={{ background: WHITE, border: "1px solid " + LINE, borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 12px 32px -20px rgba(23,19,16,.35)" }}>
          <div style={{ fontSize: 20, fontWeight: 500, color: TEXT_SECONDARY, lineHeight: 1.3 }}>{card.title}</div>
          <div style={{ fontSize: card.letter.length > 2 ? 32 : 72, fontWeight: 700, color: a, lineHeight: 1, letterSpacing: "-0.03em" }}>{card.letter}</div>
          {paragraphs.length ? (
            <div style={{ borderTop: "1px solid " + LINE, paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>From {config.instructor?.name || "your instructor"}</div>
              {paragraphs.map((p, k) => <p key={k} style={{ margin: 0, fontSize: 20, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p}</p>)}
            </div>
          ) : null}
        </section>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
          {i > 0 ? (
            <button onClick={() => setI(i - 1)}
              style={{ minHeight: TAP, padding: "0 16px", borderRadius: 12, background: "none", border: "1px solid " + LINE, fontFamily: F, fontSize: 16, fontWeight: 600, color: TEXT_SECONDARY, cursor: "pointer" }}>← Back</button>
          ) : null}
          <button onClick={gotIt}
            style={{ flex: 1, minHeight: 52, padding: "0 20px", borderRadius: 12, background: a, color: "#fff", border: "none", fontFamily: F, fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
            {i < stack.length - 1 ? "Got it, next →" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
