// The due-soon card. When an assignment is due inside 48 hours and the student
// has turned nothing in, a card comes up before the class site, the way a
// released grade does, and says so once.
//
// Andrew, 2026-09-15: "if an assignment is due within 48 hours, and the
// student has not yet submitted, can we add a card for them to dismiss once?
// to say: this is due, go to assignments to submit?"
//
// Once means once per deadline. Got it, or Go to challenges, writes the
// dismissal into the class store under data.dueCards[assignmentId][name],
// so the card stays gone on every device. The dismissal remembers which due
// date it was for, so a deadline moved later brings the card back for the new
// date rather than staying silent.

import { useState } from "react";
import { assignmentsOf, isProfileTask, profileComplete } from "./profileTask.js";
import { dueText } from "./AssignmentsCard.jsx";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BG = TOKENS.SURFACE.page;
const WHITE = TOKENS.SURFACE.card;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const WARN = TOKENS.STATE.warn;
const TAP = TOKENS.TAP;

export const DUE_SOON_HOURS = 48;

const label = { fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };

// "Sep 27" and "11:59 PM" as the moment the work is due. No time means the end
// of the day, which is how a late submission is already judged.
export function deadlineOf(due, time) {
  const d = due ? new Date(due + ", 2026") : null;
  if (!d || isNaN(d)) return null;
  let h = 23, m = 59;
  const t = String(time || "").match(/^\s*(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])?\s*$/);
  if (t) {
    h = Number(t[1]) % 12;
    m = Number(t[2] || 0);
    if (!t[3] && Number(t[1]) >= 12) h = Number(t[1]);
    if (t[3] && /p/i.test(t[3])) h += 12;
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 59).getTime();
}

const dueKey = (asg) => (asg.due || "") + " " + (asg.dueTime || "");

// The assignments this student should get a card for right now.
export function dueSoon(config, data, name, now = Date.now()) {
  if (!name) return [];
  const assignments = assignmentsOf(config, data);
  return assignments.filter(asg => {
    if (isProfileTask(asg) && profileComplete(data?.profiles?.[name])) return false;
    const at = deadlineOf(asg.due, asg.dueTime);
    if (!at || at <= now || at - now > DUE_SOON_HOURS * 3600000) return false;
    const log = data?.assignmentLog?.[asg.id]?.[name] || [];
    if (log.some(e => e.type === "submission")) return false;
    return data?.dueCards?.[asg.id]?.[name]?.due !== dueKey(asg);
  });
}

export const dismissDue = (data, asg, name, now = Date.now()) => {
  const cards = { ...(data?.dueCards || {}) };
  cards[asg.id] = { ...(cards[asg.id] || {}), [name]: { due: dueKey(asg), at: now } };
  return { ...data, dueCards: cards };
};

export default function DueDeck({ config, items, onDismiss, onOpen, onDone }) {
  // Fixed when the deck opens, for the same reason as the grade deck: the
  // dismissal comes back through the store and would shorten the list mid-tap.
  const [stack] = useState(() => items || []);
  const [i, setI] = useState(0);
  const a = config.accent;
  if (i >= stack.length) return null;

  const asg = stack[i];
  const gotIt = () => { onDismiss?.(asg); if (i + 1 >= stack.length) onDone?.(); setI(i + 1); };
  const open = () => { onDismiss?.(asg); onDone?.(); onOpen?.(asg); };

  return (
    <div aria-label="Due soon" style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: TAP }}>
          <span style={label}>{config.code}</span>
          {stack.length > 1 ? <span style={{ fontSize: 15, color: TEXT_MUTED }}>{i + 1} of {stack.length}</span> : null}
        </div>

        <section style={{ background: WHITE, border: "1px solid " + LINE, borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 12px 32px -20px rgba(23,19,16,.35)" }}>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{asg.title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: WARN, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{dueText(asg.due, asg.dueTime)}</div>
        </section>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
          <button onClick={gotIt}
            style={{ minHeight: 52, padding: "0 20px", borderRadius: 12, background: WHITE, border: "1px solid " + LINE_STRONG, fontFamily: F, fontSize: 18, fontWeight: 600, color: TEXT_PRIMARY, cursor: "pointer" }}>
            Got it
          </button>
          <button onClick={open}
            style={{ flex: 1, minHeight: 52, padding: "0 20px", borderRadius: 12, background: a, color: "#fff", border: "none", fontFamily: F, fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
            Go to My Work
          </button>
        </div>
      </div>
    </div>
  );
}
