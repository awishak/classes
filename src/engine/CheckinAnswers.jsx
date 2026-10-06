// The check-in answers, read two ways. /<class>/checkins.
//
// Andrew, 2026-10-06: "a page where i can read all the answers by student or
// by answer. this kind of page needs to be better", and of the answer pages
// so far: "they are messy, not easy to understand how to get to either. the
// chips on the answers are kind of sloppy and too narrow sometimes."
//
// So: one page, reached from the class menu and from Grade view. Two plain
// switches at the top, the week and the way of reading. By student is one
// student at a time, their goal and their work above their four answers.
// By question is one question at a time, everyone's answer under their name
// at reading width. No chips. The arrow keys step to the next one, and the
// address holds where you are so a refresh stays put.

import { useState, useEffect, useMemo } from "react";
import { useClassData } from "./store.js";
import { usePhotos, useWithPhotos } from "./photos.js";
import { Avatar, profileOf } from "./Face.jsx";
import { ThemeStyle } from "./ThemeShell.jsx";
import { withIds } from "./roster.js";
import { checkinTasksOf, answersOf, CHECKIN_QUESTIONS } from "./checkins.js";
import { workSoFar } from "./CheckinCard.jsx";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const WHITE = TOKENS.SURFACE.card;
const LATE = TOKENS.STATE.late;
const HIT = TOKENS.HIT;

const label = { fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const GOAL = { id: "goal", text: "Goal for the class" };

const param = (k) => { try { return new URLSearchParams(window.location.search).get(k) || ""; } catch { return ""; } };
const setParams = (o) => {
  try {
    const q = new URLSearchParams(window.location.search);
    Object.entries(o).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)));
    window.history.replaceState({}, "", window.location.pathname + "?" + q.toString());
  } catch { /* a render with no window */ }
};
const fmtDay = (ts) => ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

export default function CheckinAnswers({ config }) {
  const [stored] = useClassData(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const data = useWithPhotos(stored, photos);
  const a = config.accent;
  const checkins = checkinTasksOf(config, data);
  const roster = useMemo(() => withIds(data?.students?.length ? data.students : (config.students || [])).slice()
    .sort((x, y) => (x.name || "").localeCompare(y.name || "")), [data, config]);

  const [cid, setCid] = useState(() => param("w") ? "checkin-" + param("w") : "");
  const asg = checkins.find(c => c.id === cid) || checkins.find(c => Date.parse(c.opensAt) <= Date.now() && c.id === "checkin-8") || checkins[0] || null;
  const [view, setView] = useState(() => (param("v") === "question" ? "question" : "student"));
  const [who, setWho] = useState(() => param("s"));
  const [qid, setQid] = useState(() => param("q") || "going");

  const answered = asg ? roster.filter(s => answersOf(data, asg.id, s.name)) : [];
  const waiting = asg ? roster.filter(s => !answersOf(data, asg.id, s.name)) : [];
  // Who answered comes first, in the order of the roster, then everyone who
  // has not, so stepping through reads the answers before the gaps.
  const order = [...answered, ...waiting];
  const si = Math.max(0, order.findIndex(s => s.name === who));
  const student = order[si] || null;
  const questions = [...CHECKIN_QUESTIONS, GOAL];
  const qi = Math.max(0, questions.findIndex(q => q.id === qid));
  const question = questions[qi];

  const go = (o) => {
    if (o.w !== undefined) setCid("checkin-" + o.w);
    if (o.v !== undefined) setView(o.v);
    if (o.s !== undefined) setWho(o.s);
    if (o.q !== undefined) setQid(o.q);
    setParams(o);
  };
  const step = (d) => {
    if (view === "student" && order.length) go({ s: order[(si + d + order.length) % order.length].name });
    if (view === "question") go({ q: questions[(qi + d + questions.length) % questions.length].id });
  };
  useEffect(() => {
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || "")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); step(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const seg = (on) => ({ minHeight: HIT, padding: "0 14px", borderRadius: 8, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
    background: on ? a : WHITE, color: on ? "#fff" : TEXT_PRIMARY, border: "1px solid " + (on ? a : LINE_STRONG) });
  const stepBtn = { minHeight: HIT, minWidth: HIT, padding: "0 12px", borderRadius: 8, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
    background: WHITE, color: TEXT_PRIMARY, border: "1px solid " + LINE_STRONG };
  const select = { minHeight: HIT, padding: "0 10px", borderRadius: 8, border: "1px solid " + LINE_STRONG, fontFamily: F, fontSize: 16, background: WHITE, color: TEXT_PRIMARY, maxWidth: "100%" };

  const goalOf = (name) => String(data?.profiles?.[name]?.goals || "").trim();
  const answerOf = (name, id) => id === "goal" ? goalOf(name) : String(answersOf(data, asg.id, name)?.[id] || "").trim();

  return (
    <div style={{ minHeight: "100vh", background: WHITE, color: TEXT_PRIMARY, fontFamily: F }}>
      <ThemeStyle theme="clean" />
      <header style={{ position: "sticky", top: 0, zIndex: 5, background: WHITE, borderBottom: "1px solid " + LINE }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{config.code} · Check-in answers</div>
          <div role="radiogroup" aria-label="Which check-in" style={{ display: "flex", gap: 6 }}>
            {checkins.map(c => <button key={c.id} role="radio" aria-checked={asg?.id === c.id} style={seg(asg?.id === c.id)} onClick={() => go({ w: String(c.week) })}>{"Week " + c.week}</button>)}
          </div>
          <div role="radiogroup" aria-label="Read by" style={{ display: "flex", gap: 6 }}>
            <button role="radio" aria-checked={view === "student"} style={seg(view === "student")} onClick={() => go({ v: "student" })}>By student</button>
            <button role="radio" aria-checked={view === "question"} style={seg(view === "question")} onClick={() => go({ v: "question" })}>By question</button>
          </div>
          {asg ? <span style={{ marginLeft: "auto", fontSize: 15, color: TEXT_SECONDARY }}>{answered.length} of {roster.length} answered</span> : null}
        </div>
      </header>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px 64px" }}>
        {!asg ? <p style={{ fontSize: 17, color: TEXT_SECONDARY }}>This class has no fourth week on its schedule yet, so there is no check-in.</p>
          : view === "student" ? (
          student ? (
            <article>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                <button style={stepBtn} onClick={() => step(-1)} aria-label="Previous student">←</button>
                <select value={student.name} onChange={e => go({ s: e.target.value })} aria-label="Student" style={select}>
                  {order.map(s => <option key={s.name} value={s.name}>{s.name}{answersOf(data, asg.id, s.name) ? "" : " (no answer yet)"}</option>)}
                </select>
                <button style={stepBtn} onClick={() => step(1)} aria-label="Next student">→</button>
                <span style={{ fontSize: 15, color: TEXT_MUTED }}>{si + 1} of {order.length}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar profile={profileOf(data, student.name)} name={student.name} accent={a} size={56} />
                <div>
                  <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.15 }}>{student.name}</h1>
                  <div style={{ fontSize: 15, color: TEXT_SECONDARY, marginTop: 4 }}>
                    {answersOf(data, asg.id, student.name)
                      ? "Answered " + fmtDay(answersOf(data, asg.id, student.name).at) + (answersOf(data, asg.id, student.name).updatedAt > answersOf(data, asg.id, student.name).at + 60000 ? ", changed " + fmtDay(answersOf(data, asg.id, student.name).updatedAt) : "")
                      : "No answer yet"}{student.section ? " · " + student.section : ""}
                  </div>
                </div>
              </div>

              <section style={{ marginTop: 28 }}>
                <div style={label}>Goal for the class</div>
                <p style={{ margin: "8px 0 0", fontSize: 18, lineHeight: 1.55, color: goalOf(student.name) ? TEXT_PRIMARY : TEXT_MUTED }}>{goalOf(student.name) || "None written."}</p>
              </section>

              {CHECKIN_QUESTIONS.map(q => (
                <section key={q.id} style={{ marginTop: 28 }}>
                  <h2 style={{ margin: 0, fontSize: 17, lineHeight: 1.4, fontWeight: 700 }}>{q.text}</h2>
                  <p style={{ margin: "8px 0 0", fontSize: 18, lineHeight: 1.6, whiteSpace: "pre-wrap", maxWidth: 720, color: answerOf(student.name, q.id) ? TEXT_PRIMARY : TEXT_MUTED }}>
                    {answerOf(student.name, q.id) || "No answer yet."}
                  </p>
                </section>
              ))}

              <section style={{ marginTop: 36, paddingTop: 20, borderTop: "1px solid " + LINE }}>
                <div style={label}>Their work so far</div>
                {workSoFar(config, data, student.name).map(w => (
                  <div key={w.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid " + LINE, fontSize: 16 }}>
                    <span>{w.title}</span>
                    <span style={{ fontWeight: 700, color: w.missed ? LATE : a, textAlign: "right" }}>{w.word}</span>
                  </div>
                ))}
              </section>
            </article>
          ) : <p style={{ fontSize: 17, color: TEXT_SECONDARY }}>No students on the roster.</p>
        ) : (
          <article>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <button style={stepBtn} onClick={() => step(-1)} aria-label="Previous question">←</button>
              <select value={question.id} onChange={e => go({ q: e.target.value })} aria-label="Question" style={{ ...select, flex: "1 1 260px" }}>
                {questions.map(q => <option key={q.id} value={q.id}>{q.text}</option>)}
              </select>
              <button style={stepBtn} onClick={() => step(1)} aria-label="Next question">→</button>
            </div>
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.25, maxWidth: 720 }}>{question.text}</h1>
            {answered.map(s => (
              <section key={s.name} style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid " + LINE, maxWidth: 720 }}>
                <button onClick={() => go({ v: "student", s: s.name })}
                  style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F, fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, minHeight: HIT }}>
                  <Avatar profile={profileOf(data, s.name)} name={s.name} accent={a} size={32} />
                  {s.name}
                </button>
                <p style={{ margin: "8px 0 0", fontSize: 18, lineHeight: 1.6, whiteSpace: "pre-wrap", color: answerOf(s.name, question.id) ? TEXT_PRIMARY : TEXT_MUTED }}>
                  {answerOf(s.name, question.id) || "No answer."}
                </p>
              </section>
            ))}
            {waiting.length ? (
              <p style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid " + LINE, fontSize: 16, lineHeight: 1.6, color: TEXT_SECONDARY, maxWidth: 720 }}>
                <strong style={{ color: TEXT_PRIMARY }}>No answer yet: </strong>{waiting.map(s => s.name).join(", ")}.
              </p>
            ) : null}
          </article>
        )}
      </main>
    </div>
  );
}
