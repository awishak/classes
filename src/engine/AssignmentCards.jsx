// Assignments as cards, and a page for each one.
//
// Andrew, 2026-09-15: "each assignment is a card. they are in chrono order.
// when students get a grade, the card turns a different color and displays
// grade. and they have to click on an assignment to go to that assignment
// page." Then, answering questions about it:
//
//   - a green circle with a check when the work is turned in, and still green
//     once graded; Not quite is a yellow neutral face, Incomplete an amber
//     dash, an F a red X, and a deadline gone by with nothing in is red
//   - a challenge is graded in letters or as Complete, Not quite, Incomplete
//     and Not submitted, chosen in the editor
//   - a circle marker and an outline together; graded work is solid light
//     blue, every other card is white
//   - a graded card shows the comment and Details, New until the grade is
//     read, and "Your grade: C" as an ordinary line at the bottom right
//   - they are called challenges, everywhere a person reads the word
//   - the page opens at the top and scrolls smoothly to today
//   - the ongoing bucket is a shorter card at the top
//   - small pieces (creative exercises, pre-production) drop to half height
//     once they are turned in
//   - tapping a card opens a URL of its own
//
// The Grades card is gone from the home page; this is where grades live.

import { useState, useEffect, useRef } from "react";
import * as TOKENS from "./tokens.js";
import { dueText, dueState, isLate, deletePatch } from "./AssignmentsCard.jsx";
import { unseenGrades, markSeen, bucketOf, htmlToText, letterOf, alive } from "./grades.js";
import { deadlineOf } from "./DueCard.jsx";
import { assignmentsOf, isProfileTask, profileComplete } from "./profileTask.js";
import { genId } from "../utils.jsx";
import { swatch } from "./colors.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const OK = TOKENS.STATE.ok;
const LATE = TOKENS.STATE.late;
const WARN = TOKENS.STATE.warn;
const CARD = "var(--surface-card)";
const TAP = TOKENS.TAP;
const DISPLAY = { fontFamily: TOKENS.FONT.display, fontWeight: TOKENS.FONT.displayWeight, textShadow: TOKENS.FONT.displayShadow };
const small = { fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };

// Graded work is solid light blue, mixed into the card colour so the same
// card sits a shade of blue after dark as well. Andrew, 2026-09-15: "the
// card should not be black. it should be a more neutral pleasant color.
// let's go with light blue." Text on it is the ordinary ink.
// The blue is the palette's own, the one a reading already wears.
const BLUE = swatch("blue-light").hex;
const SOLID = "color-mix(in srgb, " + BLUE + " 12%, var(--surface-card))";
const SOLID_EDGE = "color-mix(in srgb, " + BLUE + " 28%, var(--surface-card))";


const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dateOf = (s) => { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d : null; };
const when = (ts) => { try { return new Date(ts).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
const isOngoing = (asg) => !asg.due || asg.due === "Ongoing" || !dateOf(asg.due);

// Where one student stands on one assignment.
export function statusOf(config, data, asg, name, unseen, now = Date.now()) {
  const log = alive(data?.assignmentLog?.[asg.id]?.[name]);
  const subs = log.filter(e => e.type === "submission");
  const grades = log.filter(e => e.type === "grade");
  const grade = grades[grades.length - 1] || null;
  const at = deadlineOf(asg.due, asg.dueTime);
  // The card challenge reads the profile rather than the log: every field
  // filled is Complete, and there is nothing to turn in.
  if (isProfileTask(asg)) {
    const done = profileComplete(data?.profiles?.[name]);
    const pstate = done ? "graded" : at && at < now ? "missed" : "open";
    const ptone = dueState(asg.due)?.tone;
    return { state: pstate, letter: done ? "Complete" : null, grade: null, comments: [], last: null, deadline: at,
      isNew: false, soon: pstate === "open" && (ptone === "soon" || ptone === "now"), late: false };
  }
  const letter = grade ? (grade.letter || letterOf(grade.score)) : null;
  const comments = grade
    ? [htmlToText(grade.html), ...log.filter(e => e.type === "comment" && e.from !== "student" && e.ts > grade.ts).map(e => htmlToText(e.html || e.text))].filter(Boolean)
    : [];
  const last = subs[subs.length - 1] || null;
  const state = isOngoing(asg) ? (letter ? "graded" : "ongoing")
    : letter ? "graded"
    : subs.length ? "turnedIn"
    : at && at < now ? "missed"
    : "open";
  const tone = dueState(asg.due)?.tone;
  return {
    state, letter, grade, comments, last, deadline: at,
    isNew: !!letter && unseen.has(asg.id),
    soon: state === "open" && (tone === "soon" || tone === "now"),
    late: last ? isLate(last.ts, asg.due) : false,
  };
}

// In the order they come due, with anything ongoing first.
export function inDueOrder(assignments) {
  return (assignments || []).map((a, i) => [a, i]).sort((x, y) => {
    const ox = isOngoing(x[0]), oy = isOngoing(y[0]);
    if (ox !== oy) return ox ? -1 : 1;
    const dx = deadlineOf(x[0].due, x[0].dueTime) || 0, dy = deadlineOf(y[0].due, y[0].dueTime) || 0;
    return (dx - dy) || (x[1] - y[1]);
  }).map(([a]) => a);
}

// Green once the work is in, and still green once graded. An F is a red X,
// and a deadline that went by with nothing in is a red circle with an
// exclamation mark. Not quite is the yellow neutral face; Incomplete is an
// amber circle with a dash, so the two never look alike; Not submitted is
// red like a missed deadline.
function Marker({ st, size = 26 }) {
  const { state, letter } = st;
  if (state === "graded" && letter === "Not quite") return <NeutralFace size={size} label="Not quite" />;
  if (state === "graded" && letter === "Incomplete") return <Dot bg={WARN} fg="#fff" size={size} label="Incomplete">–</Dot>;
  if (state === "graded" && letter === "Not submitted") return <Dot bg={LATE} fg="#fff" size={size} label="Not submitted">!</Dot>;
  if (state === "graded" && letter === "F") return <Dot bg={LATE} fg="#fff" size={size} label="F">✕</Dot>;
  if (state === "turnedIn" || state === "graded") return <Dot bg={OK} fg="#fff" size={size} label={state === "graded" ? "Graded" : "Turned in"}>✓</Dot>;
  if (state === "missed") return <Dot bg={LATE} fg="#fff" size={size} label="Missed">!</Dot>;
  return null;
}

// Drawn rather than an emoji, so every phone draws the same face.
const NeutralFace = ({ size, label = "Not quite" }) => (
  <svg role="img" aria-label={label} width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <circle cx="12" cy="12" r="12" fill="#facc15" />
    <circle cx="8.3" cy="9.6" r="1.6" fill="#1c1917" />
    <circle cx="15.7" cy="9.6" r="1.6" fill="#1c1917" />
    <rect x="7.4" y="15" width="9.2" height="1.9" rx=".95" fill="#1c1917" />
  </svg>
);
const Dot = ({ bg, fg, size, label, children }) => (
  <span role="img" aria-label={label} style={{ width: size, height: size, borderRadius: "50%", background: bg, color: fg, flex: "none",
    display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.58), fontWeight: 800, lineHeight: 1 }}>{children}</span>
);

const NewPill = () => (
  <span style={{ fontSize: 13, fontWeight: 700, color: CARD, background: TEXT_PRIMARY, borderRadius: 999, padding: "3px 10px", flex: "none" }}>New</span>
);

// ─── the cards ───

export function AssignmentCards({ config, data, name, go }) {
  const assignments = inDueOrder(assignmentsOf(config, data));
  const unseen = new Set(unseenGrades(config, data, name).map(u => u.aid));
  const now = Date.now();
  const listRef = useRef(null);

  // An old link, /assignments#asg-<id>, opens that assignment's page.
  useEffect(() => {
    let hash = "";
    try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { /* not ours */ }
    if (hash.startsWith("asg-") && go) go("assignments/" + hash.slice(4));
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // Opens at the top, then glides to the first thing not yet due, with the
  // card before it just showing above.
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const target = root.querySelector('[data-current="1"]');
    if (!target || target === root.firstElementChild) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 250);
    return () => clearTimeout(t);
  }, [assignments.length]);

  const currentId = (assignments.find(a => !isOngoing(a) && (deadlineOf(a.due, a.dueTime) || 0) >= now) || {}).id;

  return (
    <div>
      <div style={{ ...DISPLAY, fontSize: 22, color: TEXT_PRIMARY, letterSpacing: "-0.02em", marginBottom: 16 }}>My Work</div>
      {!assignments.length ? <div style={{ fontSize: 15, color: TEXT_MUTED }}>No challenges yet.</div> : null}
      <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {assignments.map(asg => (
          <AssignmentCard key={asg.id} asg={asg} st={statusOf(config, data, asg, name, unseen, now)}
            current={asg.id === currentId} onOpen={() => go && go("assignments/" + asg.id)} />
        ))}
      </div>
    </div>
  );
}

// "Your grade: C", the same size as every other line. The grade is not the
// headline of a card or of the page.
const YourGrade = ({ letter }) => (
  <span style={{ fontSize: 16, color: TEXT_PRIMARY }}>Your grade: <strong>{letter}</strong></span>
);

// Every card reads the same way: the name in full, the date and the weight
// under it, and one marker in the top right corner. Andrew, 2026-09-15: "you
// can't have some of the green/yellow/red icons on one side and one on the
// other," and "we need to see the entire assignment name and the weight and
// the date." Nothing is half height any more, because a half-height card
// could not hold all three.
//
// Every state carries an outline: green once the work is in, blue and shaded
// once graded, red once a deadline has gone by with nothing in, amber inside
// a week of one. A challenge with nothing turned in yet carries a chevron, to
// say there is something to open.
// A challenge reads the way a day on the schedule reads.
//
// Andrew, 2026-09-21: "maybe take the same approach we took to making the
// schedule look cleaner ... take that approach to teh assignmetns, i'm not a
// fan of little gray text." The card was a 17px title with three lines of grey
// under it, all the same size, so the thing to read and the things about it
// looked alike.
//
// One label across the top, in the colour of what it says. The name of the
// challenge, big, under it. Then the lines that matter, in the ink everything
// else is written in rather than a shade of grey.
function AssignmentCard({ asg, st, current, onOpen }) {
  const graded = st.state === "graded";
  const edge = graded ? "2px solid " + SOLID_EDGE
    : st.state === "turnedIn" ? "2px solid " + OK
    : st.state === "missed" ? "2px solid " + LATE
    : st.soon ? "2px solid " + WARN
    : "1px solid " + LINE_STRONG;
  const open = (e) => { if (e.type === "click" || e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } };
  const ongoing = st.state === "ongoing";
  const showChevron = !graded && st.state !== "turnedIn";

  // What the top line says, and the colour it says it in. The words are the
  // ones the markers already use, so a card and its circle agree.
  const head = ongoing ? "Ongoing"
    : graded ? "Graded"
    : st.state === "turnedIn" ? "Turned in"
    : dueText(asg.due, asg.dueTime);
  const tone = st.state === "missed" ? LATE
    : st.soon ? WARN
    : st.state === "turnedIn" ? OK
    : TEXT_PRIMARY;
  const due = "Due " + (dateOf(asg.due) ? WEEKDAY[dateOf(asg.due).getDay()] + " " + asg.due : asg.due) + (asg.dueTime ? ", " + asg.dueTime : "");

  return (
    <div role="link" tabIndex={0} className="ca-focus" data-current={current ? "1" : "0"} onClick={open} onKeyDown={open}
      style={{ background: graded ? SOLID : CARD, color: TEXT_PRIMARY, border: edge, borderRadius: 16, fontFamily: F,
        cursor: "pointer", scrollMarginTop: 96, textAlign: "left", padding: 16, display: "flex", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ ...small, color: tone, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {head}{asg.weight ? <span style={{ color: TEXT_PRIMARY }}>{asg.weight}%</span> : null}
        </span>
        <span style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{asg.title}</span>
        {/* When it was wanted, on a card whose top line is about what happened
            to it rather than when it is due. */}
        {!ongoing && (graded || st.state === "turnedIn") ? (
          <span style={{ fontSize: 15, color: TEXT_PRIMARY }}>
            {st.last ? "Turned in " + when(st.last.ts) + " \u00b7 " : ""}{due}
          </span>
        ) : null}
        {graded && st.comments[0] ? (
          <span style={{ fontSize: 15, lineHeight: 1.45, color: TEXT_PRIMARY, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{st.comments[0]}</span>
        ) : null}
        {st.letter ? <span style={{ marginTop: 2 }}><YourGrade letter={st.letter} /></span> : null}
      </div>
      {/* One corner, always: the marker, or the chevron when there is nothing
          turned in yet. */}
      <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        {st.isNew ? <NewPill /> : null}
        <Marker st={st} />
        {showChevron ? <span aria-hidden="true" style={{ fontSize: 24, lineHeight: 1, color: tone }}>›</span> : null}
      </div>
    </div>
  );
}

// ─── one challenge's page ───

// How the work went in against the deadline, in days, said the way a person
// would: "a day early", "on the day", "2 days late".
function timing(ts, deadline) {
  if (!ts || !deadline) return "";
  const day = (t) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  const n = Math.round((day(deadline) - day(ts)) / 86400000);
  if (ts > deadline) return n === 0 ? "late, on the day" : Math.abs(n) === 1 ? "a day late" : Math.abs(n) + " days late";
  return n === 0 ? "on the day" : n === 1 ? "a day early" : n + " days early";
}

const dueLine = (due, dueTime) => "Due " + (dateOf(due) ? WEEKDAY[dateOf(due).getDay()] + " " + due : due) + (dueTime ? ", " + dueTime : "");

// A student's words with their links live. Everything they send goes in one
// box: a message, a link, or both. Andrew, 2026-09-15: "forget about having a
// different link field."
const LINK = /(https?:\/\/[^\s]+)/g;
const withLinks = (text, color) => String(text || "").split(LINK).map((part, i) => (
  LINK.test(part) && /^https?:/.test(part)
    ? <a key={i} href={part} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color, fontWeight: 600, wordBreak: "break-all" }}>{part}</a>
    : <span key={i}>{part}</span>
));

// The conversation on a challenge, newest first: what the student sent, what
// Andrew wrote, the grade, and every due date the challenge has had.
export function feedOf(config, data, asg, name) {
  const log = alive(data?.assignmentLog?.[asg.id]?.[name]);
  const out = [];
  log.forEach(e => {
    if (e.type === "submission") out.push({ id: e.id, at: e.ts, from: "student", kind: "sent", liked: e.appreciatedBy, text: [e.text, e.link].filter(Boolean).join("\n") });
    else if (e.type === "comment") out.push({ id: e.id, at: e.ts, from: e.from === "student" ? "student" : "instructor", kind: "note", liked: e.appreciatedBy, text: htmlToText(e.html || e.text) });
    else if (e.type === "grade") {
      const b = e.bucket ? bucketOf(e.bucket) : null;
      out.push({ id: e.id, at: e.ts, from: "instructor", kind: "grade", letter: e.letter || letterOf(e.score), means: b?.means || "", text: htmlToText(e.html) });
    }
  });
  const dues = data?.dueLog?.[asg.id] || [];
  if (dues.length) dues.forEach((d, i) => out.push({ id: "due-" + i, at: d.at, from: "instructor", kind: "due", text: dueLine(d.due, d.dueTime) }));
  else if (asg.due) out.push({ id: "due-0", at: 0, from: "instructor", kind: "due", text: dueLine(asg.due, asg.dueTime) });
  return out.sort((x, y) => y.at - x.at);
}

export function AssignmentPage({ config, data, update, name, id, go }) {
  const ordered = inDueOrder(assignmentsOf(config, data));
  const i = ordered.findIndex(a => a.id === id);
  const asg = ordered[i];
  const unseen = new Set(unseenGrades(config, data, name).map(u => u.aid));
  const st = asg ? statusOf(config, data, asg, name, unseen) : null;
  const [draft, setDraft] = useState("");

  // Opening the page is reading the grade: New goes, and so does the grade
  // card in front of the site.
  useEffect(() => {
    if (st?.isNew && update) update(prev => markSeen(prev, id, name));
  }, [id, st?.isNew]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { window.scrollTo({ top: 0 }); } catch { /* server */ } }, [id]);

  if (!asg) return <div style={{ fontSize: 15, color: TEXT_MUTED }}>No challenge here.</div>;

  const accent = "var(--ca-accent)";
  const feed = feedOf(config, data, asg, name);
  const prev = ordered[i - 1], next = ordered[i + 1];

  // A message with a web address in it is work turned in; anything else is a
  // note. Either way the student wrote one thing in one box.
  const send = () => {
    const text = draft.trim();
    if (!text || !update) return;
    const link = (text.match(LINK) || [])[0] || "";
    update(prev2 => {
      const al = { ...(prev2.assignmentLog || {}) };
      const byStudent = { ...(al[asg.id] || {}) };
      const event = link
        ? { id: genId(), ts: Date.now(), type: "submission", link, text: text.replace(link, "").trim() }
        : { id: genId(), ts: Date.now(), type: "comment", from: "student", text };
      byStudent[name] = [...(byStudent[name] || []), event];
      al[asg.id] = byStudent;
      return { ...prev2, assignmentLog: al };
    });
    setDraft("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* What the challenge is. Nothing else lives up here. */}
      <section style={{ background: CARD, border: "1px solid " + LINE_STRONG, borderRadius: 16, padding: 18, display: "flex", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ ...DISPLAY, margin: 0, fontSize: 24, lineHeight: 1.2, letterSpacing: "-0.02em", color: TEXT_PRIMARY, textWrap: "balance" }}>{asg.title}</h2>
          {asg.description ? <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: TEXT_PRIMARY, maxWidth: "65ch" }}>{asg.description}</p> : null}
          {asg.instructionsUrl ? (
            <a className="ca-focus" href={asg.instructionsUrl} target="_blank" rel="noreferrer"
              style={{ alignSelf: "flex-start", minHeight: TAP, padding: "0 18px", borderRadius: 12, background: accent, color: "#fff",
                display: "inline-flex", alignItems: "center", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
              Details
            </a>
          ) : null}
        </div>
        <div style={{ flex: "none" }}><Marker st={st} /></div>
      </section>

      {/* One box for anything the student sends: a message, a link, or both.
          The card challenge has no box: the card is the work, so the button
          goes there. */}
      {isProfileTask(asg) ? (
        <button className="ca-focus" onClick={() => go && go("you")}
          style={{ alignSelf: "flex-start", minHeight: TAP, padding: "0 20px", borderRadius: 12, border: "none", background: accent, color: "#fff",
            fontFamily: F, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
          Your card
        </button>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea aria-label="Send a message or a link" value={draft} onChange={e => setDraft(e.target.value)}
          placeholder="A message, a link, or both"
          style={{ fontFamily: F, fontSize: 16, minHeight: 72, padding: 12, borderRadius: 12, border: "1px solid " + LINE_STRONG,
            background: CARD, color: TEXT_PRIMARY, lineHeight: 1.5, resize: "vertical" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="ca-focus" onClick={send} disabled={!draft.trim()}
            style={{ minHeight: TAP, padding: "0 20px", borderRadius: 12, border: "none", background: accent, color: "#fff",
              fontFamily: F, fontSize: 16, fontWeight: 600, cursor: draft.trim() ? "pointer" : "default", opacity: draft.trim() ? 1 : .5 }}>
            Send
          </button>
          <span style={{ fontSize: 15, color: TEXT_SECONDARY }}>{config.instructor?.email || "Your instructor"} needs access to your link.</span>
        </div>
      </div>
      )}

      {/* The conversation, newest first. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {feed.map(m => (
          <Message key={m.id} m={m} deadline={st.deadline} who={config.instructor?.name || "your instructor"}
            onDelete={m.from === "student" && m.kind !== "grade" && update
              ? () => update(prev => deletePatch(prev, asg.id, name, m.id, name)) : null} />
        ))}
      </div>

      {prev || next ? (
        <nav aria-label="Other challenges" style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid " + LINE, paddingTop: 12 }}>
          {prev ? (
            <button className="ca-focus" onClick={() => go && go("assignments/" + prev.id)} style={navBtn("left")}>
              <span style={small}>‹ Before</span><span style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>{prev.title}</span>
            </button>
          ) : <span />}
          {next ? (
            <button className="ca-focus" onClick={() => go && go("assignments/" + next.id)} style={navBtn("right")}>
              <span style={small}>After ›</span><span style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>{next.title}</span>
            </button>
          ) : <span />}
        </nav>
      ) : null}
    </div>
  );
}

// A message in the conversation. The student's sit left, Andrew's sit right,
// the way a phone draws a thread.
function Message({ m, deadline, who, onDelete }) {
  const mine = m.from === "student";
  const grade = m.kind === "grade";
  const bubble = {
    maxWidth: "88%", padding: "10px 14px", borderRadius: 16, fontSize: 16, lineHeight: 1.5,
    background: grade ? SOLID : mine ? "var(--surface-sunk)" : "color-mix(in srgb, var(--ca-accent) 10%, var(--surface-card))",
    border: grade ? "1px solid " + SOLID_EDGE : "none", color: TEXT_PRIMARY, whiteSpace: "pre-wrap", overflowWrap: "anywhere",
  };
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-start" : "flex-end" }}>
      <div style={{ maxWidth: "88%", display: "flex", flexDirection: "column", gap: 4, alignItems: mine ? "flex-start" : "flex-end" }}>
        <div style={bubble}>
          {grade ? (
            <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <YourGrade letter={m.letter} />
              {m.means ? <span style={{ color: TEXT_SECONDARY }}>{m.means}</span> : null}
              {m.text ? <span>{m.text}</span> : null}
            </span>
          ) : withLinks(m.text, mine ? "var(--ca-accent-ink)" : TEXT_PRIMARY)}
        </div>
        {m.liked === "instructor" && mine ? <span style={{ fontSize: 13, fontWeight: 700, color: OK }}>{who.split(" ")[0]} appreciated this</span> : null}
        <span style={{ fontSize: 13, color: TEXT_MUTED, display: "flex", alignItems: "center", gap: 8 }}>
          <span>
            {mine ? "You" : who}
            {m.at ? " \u00b7 " + when(m.at) : ""}
            {m.kind === "sent" && m.at && deadline && timing(m.at, deadline) ? " \u00b7 " + timing(m.at, deadline) : ""}
          </span>
          {/* Your own words are yours to take back. The class keeps the record. */}
          {onDelete ? (
            <button className="ca-focus" onClick={onDelete}
              style={{ background: "none", border: "none", padding: 0, minHeight: TAP, fontFamily: F, fontSize: 13, fontWeight: 600, color: LATE, cursor: "pointer" }}>
              Delete
            </button>
          ) : null}
        </span>
      </div>
    </div>
  );
}

const navBtn = (side) => ({ minHeight: TAP, maxWidth: "48%", background: "none", border: "none", padding: "6px 0", cursor: "pointer", fontFamily: F,
  display: "flex", flexDirection: "column", alignItems: side === "left" ? "flex-start" : "flex-end", textAlign: side, gap: 2 });
