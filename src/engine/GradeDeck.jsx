// The grade deck. A released grade is a full-screen card the next time a
// student opens the class, one per assignment, and the site waits behind the
// stack until every card has been read. See DESIGN.md on what a deck is: one
// card, one thing, the way forward as the only control, and the way back to
// the card before as the only other.
//
// The card says one thing — the challenge was evaluated, or nothing was
// turned in and the grade is a zero — and points at the challenge, where the
// grade, what it means, the comments and the work all live. Got it writes the
// seen stamp so the same card never comes round twice.

import { useState } from "react";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BG = TOKENS.SURFACE.page;
const WHITE = TOKENS.SURFACE.card;
const SUNK = TOKENS.SURFACE.sunk;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const OK = TOKENS.STATE.ok;
const TAP = TOKENS.TAP;

const label = { fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const when = (ts) => ts ? new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "your link"; } };

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
  const missed = !card.submittedAt && !card.link && (card.bucket === "notsubmitted" || card.letter === "F" || card.letter === "Incomplete");
  const who = config.instructor?.name || "your instructor";
  const ghost = { minHeight: TAP, padding: "0 16px", borderRadius: 12, background: WHITE, border: "1px solid " + LINE_STRONG,
    fontFamily: F, fontSize: 16, fontWeight: 600, color: a, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none" };

  return (
    <div aria-label="Your grades" style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: TAP }}>
          <span style={label}>{config.code} · A grade is in</span>
          <span style={{ fontSize: 15, color: TEXT_MUTED }}>{i + 1} of {stack.length}</span>
        </div>

        <section style={{ background: WHITE, border: "1px solid " + LINE, borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 12px 32px -20px rgba(23,19,16,.35)" }}>
          {/* One sentence, and the way to the challenge. Andrew, 2026-09-15:
              "it doesn't need to include all the info. in fact, it should say:
              your Visual Story has been evaluated / you didn't submit your
              Visual Story so you received a grade of 0." Everything else — the
              grade, what it means, the comments, what they turned in — is on
              the challenge's own page, one press away. */}
          <p style={{ margin: 0, fontSize: 20, lineHeight: 1.45 }}>
            {missed
              ? <>You didn't submit your <strong>{card.title}</strong>, so you received a grade of 0.</>
              : <>Your <strong>{card.title}</strong> has been evaluated.</>}
          </p>
          {/* No meeting button here: a grade rough enough to need one sends
              the link into the challenge's conversation on its own. */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <a href={config.path + "/challenges/" + encodeURIComponent(card.aid)} style={ghost}>Open the challenge</a>
          </div>
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
