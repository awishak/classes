// The check-in, as the student fills it in. See checkins.js for what it is.
//
// The same form in two places: in front of the site during weeks 4 and 8,
// with Later beside Submit, and on the check-in's own challenge page, where
// it stays editable until Sunday night. Their work so far comes first, every
// challenge with a word on it and what he said, then the four questions with
// the goal they wrote above the second one.

import { useState } from "react";
import { CHECKIN_QUESTIONS, NO_GOAL, answersOf, saveCheckin, isCheckin, checkinOpen } from "./checkins.js";
import { isProfileTask } from "./profileTask.js";
import { visibleAssignments, workOf, unseenOf } from "./portal/work.js";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BG = TOKENS.SURFACE.page;
const WHITE = TOKENS.SURFACE.card;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const LATE = TOKENS.STATE.late;
const TAP = TOKENS.TAP;

const label = { fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const box = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12, border: "1px solid " + LINE_STRONG,
  fontFamily: F, fontSize: 16, lineHeight: 1.5, color: TEXT_PRIMARY, background: WHITE, minHeight: 88, resize: "vertical" };

// Every challenge with something to say: a grade, turned in, or missed. The
// check-ins themselves are left out.
export function workSoFar(config, data, name) {
  const unseen = unseenOf(config, data, name);
  return visibleAssignments(config, data).filter(a => !isCheckin(a)).map(asg => {
    const st = workOf(config, data, asg, name, unseen);
    const word = st.state === "graded" ? st.letter : st.state === "turnedIn" ? "Turned in" : st.state === "missed" ? "Missed" : "";
    return word ? { id: asg.id, title: asg.title, word, missed: st.state === "missed", comments: isProfileTask(asg) ? [] : (st.comments || []) } : null;
  }).filter(Boolean);
}

export function CheckinForm({ config, data, update, name, asg, onDone, onLater }) {
  const saved = answersOf(data, asg.id, name);
  const goal = String(data?.profiles?.[name]?.goals || "").trim();
  const [a, setA] = useState(() => Object.fromEntries(CHECKIN_QUESTIONS.map(q => [q.id, saved?.[q.id] || ""])));
  const [newGoal, setNewGoal] = useState("");
  const [sent, setSent] = useState(false);
  const open = checkinOpen(asg);
  const work = workSoFar(config, data, name);
  const ready = CHECKIN_QUESTIONS.every(q => a[q.id].trim()) && (goal || newGoal.trim());
  const submit = () => {
    if (!ready || !update) return;
    const answers = Object.fromEntries(CHECKIN_QUESTIONS.map(q => [q.id, a[q.id].trim()]));
    update(prev => saveCheckin(prev, asg, name, answers, goal ? "" : newGoal));
    setSent(true);
    onDone?.();
  };
  const accent = config.accent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: F, color: TEXT_PRIMARY }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={label}>Your work so far</div>
        {work.length ? work.map(w => (
          <div key={w.id} style={{ borderTop: "1px solid " + LINE, paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{w.title}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: w.missed ? LATE : accent }}>{w.word}</span>
            </div>
            {w.comments.map((c, i) => <p key={i} style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.5, color: TEXT_SECONDARY, whiteSpace: "pre-wrap" }}>{c}</p>)}
          </div>
        )) : <p style={{ margin: 0, fontSize: 15, color: TEXT_SECONDARY }}>Nothing graded or due yet.</p>}
      </section>

      {CHECKIN_QUESTIONS.map(q => (
        <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {q.id === "differently" ? (
            goal
              ? <span style={{ fontSize: 15, lineHeight: 1.5, color: TEXT_SECONDARY }}>You said your goal was: <em>"{goal}"</em></span>
              : <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{NO_GOAL}</span>
                  <textarea value={newGoal} onChange={e => setNewGoal(e.target.value)} aria-label="Your goal for the class" style={box} disabled={!open} />
                </span>
          ) : null}
          <span id={"ci-" + q.id} style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{q.text}</span>
          <textarea value={a[q.id]} onChange={e => setA(v => ({ ...v, [q.id]: e.target.value }))} aria-labelledby={"ci-" + q.id} style={box} disabled={!open} />
        </div>
      ))}

      {open ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={submit} disabled={!ready}
            style={{ minHeight: 52, padding: "0 24px", borderRadius: 12, background: accent, color: "#fff", border: "none", fontFamily: F, fontSize: 18, fontWeight: 600, cursor: ready ? "pointer" : "default", opacity: ready ? 1 : .5 }}>
            Submit
          </button>
          {onLater ? (
            <button onClick={onLater}
              style={{ minHeight: 52, padding: "0 20px", borderRadius: 12, background: WHITE, color: TEXT_PRIMARY, border: "1px solid " + LINE_STRONG, fontFamily: F, fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
              Later
            </button>
          ) : null}
          {sent && !onDone ? <span style={{ fontSize: 15, color: TEXT_SECONDARY }}>Saved.</span> : null}
        </div>
      ) : null}
    </div>
  );
}

// In front of the site, the way a grade card is.
export default function CheckinCard({ config, data, update, name, asg, onDone }) {
  return (
    <div aria-label={asg.title} style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 620, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...label, minHeight: TAP, display: "flex", alignItems: "center" }}>{config.code}</div>
        <section style={{ background: WHITE, border: "1px solid " + LINE, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 12px 32px -20px rgba(23,19,16,.35)" }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>{asg.title}</h1>
          <CheckinForm config={config} data={data} update={update} name={name} asg={asg} onDone={onDone} onLater={onDone} />
        </section>
      </div>
    </div>
  );
}
