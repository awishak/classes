// The grade deck. A released grade is a full-screen card the next time a
// student opens the class, one per assignment, and the site waits behind the
// stack until every card has been read. See DESIGN.md on what a deck is: one
// card, one thing, the way forward as the only control, and the way back to
// the card before as the only other.
//
// The card reads top to bottom the way a conversation would: the assignment,
// the letter and what the letter means, Andrew's comment with its date, the
// student's own note and file under that with their date, then a way to
// open the assignment and a way to ask for a meeting. Got it writes the seen
// stamp so the same card never comes round twice.

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

export default function GradeDeck({ config, items, onSeen, onDone, onMeeting, children }) {
  // The stack is fixed when the deck opens. Got it writes a seen stamp, and
  // that write comes back through the store and would shorten a live list
  // under the reader's thumb.
  const [stack] = useState(() => items || []);
  const [i, setI] = useState(0);
  const [asked, setAsked] = useState(() => new Set());
  const a = config.accent;
  if (i >= stack.length) return children || null;

  const card = stack[i];
  const gotIt = () => { onSeen?.(card.aid); if (i + 1 >= stack.length) onDone?.(); setI(i + 1); };
  const meet = () => {
    onMeeting?.(card);
    setAsked(s => new Set([...s, card.aid]));
    const link = config.instructor?.schedulingLink;
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };
  const paragraphs = card.comment ? card.comment.split(/\n{2,}/).filter(Boolean) : [];
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
          {/* the assignment, and the grade */}
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{card.title}</div>
            {card.due ? <div style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 4 }}>Due {card.due}</div> : null}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: a, lineHeight: 1, letterSpacing: "-0.02em" }}>{card.letter}</span>
            <span style={{ fontSize: 15, color: TEXT_MUTED }}>Graded {when(card.gradedAt)}</span>
          </div>
          {card.means ? <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: TEXT_SECONDARY }}>{card.means}</p> : null}

          {/* the comment */}
          {paragraphs.length ? (
            <div style={{ borderTop: "1px solid " + LINE, paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={label}>From {who}</span>
                <span style={{ fontSize: 13, color: TEXT_MUTED }}>{when(card.gradedAt)}</span>
              </div>
              {paragraphs.map((p, k) => <p key={k} style={{ margin: 0, fontSize: 17, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{p}</p>)}
            </div>
          ) : null}

          {/* what they turned in */}
          {card.link || card.note ? (
            <div style={{ background: SUNK, borderRadius: 12, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={label}>What you turned in</span>
                <span style={{ fontSize: 13, color: TEXT_MUTED }}>{when(card.submittedAt)}</span>
              </div>
              {card.note ? <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: TEXT_SECONDARY, whiteSpace: "pre-wrap" }}>{card.note}</p> : null}
              {card.link ? (
                <a href={card.link} target="_blank" rel="noreferrer" style={{ fontSize: 15, fontWeight: 600, color: a, textDecoration: "none", minHeight: TAP, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Open your file ↗ <span style={{ fontWeight: 400, color: TEXT_MUTED, fontSize: 13 }}>{hostOf(card.link)}</span>
                </a>
              ) : null}
            </div>
          ) : null}

          {/* ways on from here */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <a href={config.path + "/assignments"} style={ghost}>Open the assignment</a>
            {asked.has(card.aid)
              ? <span style={{ fontSize: 15, fontWeight: 600, color: OK, minHeight: TAP, display: "inline-flex", alignItems: "center" }}>Meeting requested. Andrew will reply on your You card.</span>
              : <button onClick={meet} style={ghost}>Make a meeting with {who.split(" ")[0]}</button>}
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
