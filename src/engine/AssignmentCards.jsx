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

import { useEffect, useRef } from "react";
import * as TOKENS from "./tokens.js";
import { StudentAssignmentRow, dueText, dueState, isLate } from "./AssignmentsCard.jsx";
import { unseenGrades, markSeen, bucketOf, htmlToText, letterOf } from "./grades.js";
import { deadlineOf } from "./DueCard.jsx";
import { dateInWeek } from "./ScheduleCard.jsx";
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

// Pieces this size or smaller drop to half height once they are turned in.
export const SMALL_WEIGHT = 5;

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dateOf = (s) => { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d : null; };
const when = (ts) => { try { return new Date(ts).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
const isOngoing = (asg) => !asg.due || asg.due === "Ongoing" || !dateOf(asg.due);

// Where one student stands on one assignment.
export function statusOf(config, data, asg, name, unseen, now = Date.now()) {
  const log = data?.assignmentLog?.[asg.id]?.[name] || [];
  const subs = log.filter(e => e.type === "submission");
  const grades = log.filter(e => e.type === "grade");
  const grade = grades[grades.length - 1] || null;
  const at = deadlineOf(asg.due, asg.dueTime);
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
    small: (asg.weight || 0) <= SMALL_WEIGHT && (state === "turnedIn" || state === "graded"),
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
  const assignments = inDueOrder(data?.assignments || config.assignments || []);
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
      <div style={{ ...DISPLAY, fontSize: 22, color: TEXT_PRIMARY, letterSpacing: "-0.02em", marginBottom: 16 }}>Challenges</div>
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

// "Your grade: C", the same size as every other line, at the bottom and to
// the right. The grade is not the headline of the card.
const YourGrade = ({ letter }) => (
  <span style={{ fontSize: 15, color: TEXT_SECONDARY, flex: "none" }}>Your grade: <strong style={{ color: TEXT_PRIMARY }}>{letter}</strong></span>
);

function AssignmentCard({ asg, st, current, onOpen }) {
  const solid = st.state === "graded";
  const edge = solid ? "1px solid " + SOLID_EDGE
    : st.state === "turnedIn" ? "2px solid " + OK
    : st.state === "missed" ? "2px solid " + LATE
    : st.soon ? "2px solid " + WARN
    : "1px solid " + LINE_STRONG;
  const open = (e) => { if (e.type === "click" || e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } };
  const weight = asg.weight ? asg.weight + "%" : "";
  const ongoing = st.state === "ongoing" || (solid && isOngoing(asg));

  const base = { background: solid ? SOLID : CARD, color: TEXT_PRIMARY, border: edge, borderRadius: 16, fontFamily: F, cursor: "pointer",
    scrollMarginTop: 96, textAlign: "left" };

  // Half height: one line, for a small piece already in.
  if (st.small) {
    return (
      <div role="link" tabIndex={0} className="ca-focus" data-current={current ? "1" : "0"} onClick={open} onKeyDown={open}
        style={{ ...base, padding: "10px 14px", minHeight: TAP, display: "flex", alignItems: "center", gap: 12 }}>
        <Marker st={st} size={22} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asg.title}</span>
        {st.isNew ? <NewPill /> : null}
        {st.letter ? <YourGrade letter={st.letter} />
          : <span style={{ fontSize: 14, color: TEXT_SECONDARY, flex: "none" }}>{WEEKDAY[dateOf(asg.due).getDay()]} {asg.due}</span>}
      </div>
    );
  }

  return (
    <div role="link" tabIndex={0} className="ca-focus" data-current={current ? "1" : "0"} onClick={open} onKeyDown={open}
      style={{ ...base, padding: ongoing ? "12px 16px" : 18, display: "flex", flexDirection: "column", gap: ongoing ? 2 : 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: ongoing ? 16 : 18, fontWeight: 600, lineHeight: 1.3 }}>{asg.title}</span>
        {st.isNew ? <NewPill /> : null}
        <Marker st={st} />
      </div>

      {ongoing ? (
        <span style={{ fontSize: 14, color: TEXT_SECONDARY }}>{["Ongoing", weight].filter(Boolean).join(" · ")}{asg.description ? " · " + asg.description : ""}</span>
      ) : solid ? (
        <>
          <span style={{ fontSize: 15, color: TEXT_SECONDARY }}>
            {[st.last ? "Turned in " + when(st.last.ts) : WEEKDAY[dateOf(asg.due).getDay()] + " " + asg.due, weight].filter(Boolean).join(" · ")}
          </span>
          {st.comments[0] ? (
            <span style={{ fontSize: 15, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{st.comments[0]}</span>
          ) : null}
        </>
      ) : (
        <span style={{ fontSize: 15, color: st.state === "missed" ? LATE : st.soon ? WARN : TEXT_SECONDARY, fontWeight: st.state === "missed" || st.soon ? 700 : 400 }}>
          {st.state === "turnedIn" && st.last ? "Turned in " + when(st.last.ts) : dueText(asg.due, asg.dueTime)}
          {weight ? <span style={{ fontWeight: 400, color: TEXT_SECONDARY }}>{" · " + weight}</span> : null}
        </span>
      )}

      {(!ongoing && asg.instructionsUrl) || st.letter ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 28 }}>
          {!ongoing && asg.instructionsUrl ? (
            <a href={asg.instructionsUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}
              style={{ minHeight: TAP, margin: "-8px 0", display: "inline-flex", alignItems: "center", fontSize: 15, fontWeight: 600, color: "var(--ca-accent)", textDecoration: "none" }}>
              Details
            </a>
          ) : <span />}
          {st.letter ? <YourGrade letter={st.letter} /> : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── one assignment's page ───

// How the work went in against the deadline, in days, said the way a person
// would: "a day early", "on the day", "2 days late".
function timing(ts, deadline) {
  if (!ts || !deadline) return "";
  const day = (t) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  const n = Math.round((day(deadline) - day(ts)) / 86400000);
  if (ts > deadline) return n === 0 ? "late, on the day" : Math.abs(n) === 1 ? "a day late" : Math.abs(n) + " days late";
  return n === 0 ? "on the day" : n === 1 ? "a day early" : n + " days early";
}

export function AssignmentPage({ config, data, update, name, id, go }) {
  const ordered = inDueOrder(data?.assignments || config.assignments || []);
  const i = ordered.findIndex(a => a.id === id);
  const asg = ordered[i];
  const unseen = new Set(unseenGrades(config, data, name).map(u => u.aid));
  const st = asg ? statusOf(config, data, asg, name, unseen) : null;

  // Opening the page is reading the grade: New goes, and so does the grade
  // card in front of the site.
  useEffect(() => {
    if (st?.isNew && update) update(prev => markSeen(prev, id, name));
  }, [id, st?.isNew]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { window.scrollTo({ top: 0 }); } catch { /* server */ } }, [id]);

  const back = (
    <button className="ca-focus" onClick={() => go && go("assignments")}
      style={{ alignSelf: "flex-start", minHeight: TAP, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F, fontSize: 16, fontWeight: 600, color: "var(--ca-accent)" }}>
      ‹ All challenges
    </button>
  );
  if (!asg) return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{back}<div style={{ fontSize: 15, color: TEXT_MUTED }}>No challenge here.</div></div>;

  const due = dateOf(asg.due);
  const rel = dueState(asg.due);
  const bucket = st.grade?.bucket ? bucketOf(st.grade.bucket) : null;
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const onSchedule = weeks.flatMap(w => (w.items || []).filter(it => it.asgId === asg.id).map(it => ({ day: it.date, date: dateInWeek(w, it.date) })));
  const prev = ordered[i - 1], next = ordered[i + 1];
  const stateWord = { graded: "Graded", turnedIn: "Turned in", missed: "Missed", open: "Not turned in yet", ongoing: "Ongoing" }[st.state];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {back}

      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h2 style={{ ...DISPLAY, margin: 0, fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.02em", color: TEXT_PRIMARY, textWrap: "balance" }}>{asg.title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Marker st={st} size={22} />
          <span style={{ fontSize: 16, fontWeight: 600, color: st.state === "missed" ? LATE : TEXT_PRIMARY }}>{stateWord}</span>
          {st.state === "turnedIn" || st.state === "graded" ? (
            st.last ? <span style={{ fontSize: 15, color: TEXT_SECONDARY }}>{when(st.last.ts)}{timing(st.last.ts, st.deadline) ? ", " + timing(st.last.ts, st.deadline) : ""}</span> : null
          ) : null}
        </div>
        {due ? (
          <div style={{ fontSize: 16, color: TEXT_SECONDARY }}>
            Due {WEEKDAY[due.getDay()]} {asg.due}{asg.dueTime ? ", " + asg.dueTime : ""}
            {rel && rel.tone !== "calm" && st.state === "open" ? <strong style={{ color: WARN }}>{" · " + rel.text}</strong> : null}
            {asg.weight ? " · " + asg.weight + "%" : ""}
          </div>
        ) : (
          <div style={{ fontSize: 16, color: TEXT_SECONDARY }}>{["Ongoing", asg.weight ? asg.weight + "%" : ""].filter(Boolean).join(" · ")}</div>
        )}
      </header>

      {st.letter ? (
        <section aria-label="Grade" style={{ background: SOLID, border: "1px solid " + SOLID_EDGE, color: TEXT_PRIMARY, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          {bucket?.means ? <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>{bucket.means}</p> : null}
          {st.comments.map((c, k) => (
            <p key={k} style={{ margin: 0, fontSize: 16, lineHeight: 1.5, whiteSpace: "pre-wrap", paddingTop: k || bucket?.means ? 10 : 0, borderTop: k || bucket?.means ? "1px solid " + SOLID_EDGE : "none" }}>{c}</p>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {st.grade?.ts ? <span style={{ fontSize: 15, color: TEXT_SECONDARY }}>Graded {when(st.grade.ts)}</span> : <span />}
            <YourGrade letter={st.letter} />
          </div>
        </section>
      ) : null}

      {asg.instructionsUrl || asg.description ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {asg.description ? <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: TEXT_PRIMARY, maxWidth: "65ch" }}>{asg.description}</p> : null}
          {asg.instructionsUrl ? (
            <a className="ca-focus" href={asg.instructionsUrl} target="_blank" rel="noreferrer"
              style={{ alignSelf: "flex-start", minHeight: TAP, padding: "0 18px", borderRadius: 12, background: "var(--ca-accent)", color: "#fff",
                display: "inline-flex", alignItems: "center", fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
              Details
            </a>
          ) : null}
        </section>
      ) : null}

      {onSchedule.length ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={small}>On the schedule</span>
          {onSchedule.map((s, k) => (
            <button key={k} className="ca-focus" onClick={() => go && go("schedule")}
              style={{ minHeight: TAP, padding: "0 14px", borderRadius: 999, border: "1px solid " + LINE_STRONG, background: CARD, color: TEXT_PRIMARY, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              {s.day} {s.date}
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ borderTop: "1px solid " + LINE, paddingTop: 16 }}>
        <StudentAssignmentRow asg={asg} accent={config.accent} config={config} data={data} update={update} name={name} bare />
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

const navBtn = (side) => ({ minHeight: TAP, maxWidth: "48%", background: "none", border: "none", padding: "6px 0", cursor: "pointer", fontFamily: F,
  display: "flex", flexDirection: "column", alignItems: side === "left" ? "flex-start" : "flex-end", textAlign: side, gap: 2 });
