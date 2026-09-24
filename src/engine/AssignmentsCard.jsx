// The Assignments card.
// Each assignment is a running LOG per student: "Assignment posted · due X",
// the student's submissions (link and/or text, timestamped, flagged late),
// the grade I assign (or regrade), and my rich-text comments back — in order.
//
// Student: see the card (description, instructions link, due, weight), the log,
// and submit a link + text (can add more). Instructor: manage assignments and
// grade fast (global inbox or per-assignment), one student at a time.
//
// Scored out of 100; weight is the percent of the final grade. Rubric criteria
// sum to 100, or leave the rubric empty for a free-form score.

import { useState, useRef, useEffect } from "react";
import { assignmentsOf, isProfileTask, profileComplete } from "./profileTask.js";
import { realStudents, studentsIn, hasSections, sectionsOf } from "./sections.js";
import { rosterOf } from "./roster.js";
import { Avatar, profileOf } from "./Face.jsx";
import { genId } from "../utils.jsx";
import { draftFeedback, textToHtml } from "./feedback.js";
import { gradeText, scaleOf, SCALES, alive } from "./grades.js";
import * as TOKENS from "./tokens.js";

// The theme's face. Outfit on Clean and Business, Nunito on Snapchat,
// Fredoka on Crashing Out. One declaration, and every use below follows.
const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const BG = TOKENS.SURFACE.page;
const LATE = TOKENS.STATE.late;
const SOON = TOKENS.STATE.warn;
const SURFACE_CARD = TOKENS.SURFACE.card;   // a text box takes the card's own surface, which is dark after dark
const TAP = 44;

const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;
const Pill = ({ accent, children }) => (
  <span style={{ flex: "none", fontSize: 13, fontWeight: 700, color: "#fff", background: accent, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>{children}</span>
);
// The way to a challenge's instructions. Andrew, 2026-09-24: the Details
// button "is almost too prominent. it needs a way to be clearer that students
// find details there." So it is outlined rather than filled, and it says what
// it does: a page icon, a verb and its object, and the arrow that means a new
// tab.
export function DetailsLink({ href, accent, style }) {
  return (
    <a className="ca-focus" href={href} target="_blank" rel="noreferrer"
      style={{ position: "relative", alignSelf: "flex-start", minHeight: TAP, padding: "0 16px", borderRadius: 12, border: "1.5px solid " + accent,
        background: "transparent", color: accent, display: "inline-flex", alignItems: "center", gap: 8,
        fontFamily: F, fontSize: 16, fontWeight: 600, textDecoration: "none", ...style }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h6" />
      </svg>
      Open details
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17 17 7" /><path d="M8 7h9v9" />
      </svg>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>(opens in a new tab)</span>
    </a>
  );
}

const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: TAP, background: SURFACE_CARD, color: TEXT_PRIMARY };

// ─── data ───
const getAssignments = (data, config) => assignmentsOf(config, data);
const logOf = (data, aid, name) => alive(data?.assignmentLog?.[aid]?.[name]);
const lastOf = (log, type) => { for (let i = log.length - 1; i >= 0; i--) if (log[i].type === type) return log[i]; return null; };
const currentGrade = (log) => lastOf(log, "grade");
const needsGrade = (log) => { const s = lastOf(log, "submission"); const g = lastOf(log, "grade"); return !!s && (!g || s.ts > g.ts); };

// Weighted current grade for a student: weighted average (0-100) over graded
// assignments only. Returns { pct, rows }. pct is null if nothing graded yet.
export function computeGrade(config, data, name) {
  const assignments = getAssignments(data, config);
  let earned = 0, weight = 0;
  const rows = assignments.map(asg => {
    const g = currentGrade(logOf(data, asg.id, name));
    // A grade with no score is skipped rather than read as zero.
    if (g && g.score != null) { earned += g.score * (asg.weight || 0); weight += (asg.weight || 0); }
    return { id: asg.id, title: asg.title, weight: asg.weight || 0, score: g ? g.score : null, letter: g?.letter || null };
  });
  return { pct: weight > 0 ? Math.round(earned / weight) : null, rows };
}

function addEvent(update, aid, name, event) {
  update(prev => {
    const al = { ...(prev.assignmentLog || {}) };
    const byStudent = { ...(al[aid] || {}) };
    byStudent[name] = [...(byStudent[name] || []), { id: genId(), ts: Date.now(), ...event }];
    al[aid] = byStudent;
    return { ...prev, assignmentLog: al };
  });
}

function mutateLog(update, aid, name, fn) {
  update(prev => {
    const al = { ...(prev.assignmentLog || {}) };
    const byStudent = { ...(al[aid] || {}) };
    byStudent[name] = fn(byStudent[name] || []);
    al[aid] = byStudent;
    return { ...prev, assignmentLog: al };
  });
}
// actor is "instructor" or the student's full name; toggles their appreciation.
const appreciate = (update, aid, name, eid, actor) => mutateLog(update, aid, name, log => log.map(e => e.id === eid ? { ...e, appreciatedBy: e.appreciatedBy === actor ? null : actor } : e));
const deleteEvent = (update, aid, name, eid) => mutateLog(update, aid, name, log => log.map(e => e.id === eid ? { ...e, deleted: { at: Date.now(), by: "instructor" } } : e));

function ungradedQueue(assignments, data, onlyAid) {
  const q = [];
  assignments.forEach(asg => {
    if (onlyAid && asg.id !== onlyAid) return;
    const byStudent = data?.assignmentLog?.[asg.id] || {};
    Object.keys(byStudent).forEach(name => { if (needsGrade(alive(byStudent[name]))) q.push({ aid: asg.id, name }); });
  });
  return q;
}

// ─── dates ───
function parseDue(s) { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d : null; }
export function isLate(ts, due) { const d = parseDue(due); if (!d) return false; const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59); return ts > end.getTime(); }
function fmtTime(ts) { try { return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } }
function fmtClose(s) { try { return new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return s; } }
function nextDueOf(assignments) {
  const t0 = (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); })();
  let best = null, diff0 = Infinity;
  assignments.forEach(a => { const d = parseDue(a.due); if (!d) return; const diff = d.getTime() - t0; if (diff >= 0 && diff < diff0) { diff0 = diff; best = a; } });
  return best || assignments[0] || null;
}

// The next thing this student still has to turn in: due today or later, and
// nothing submitted for it yet. Something already handed in is not what a
// student needs pointed at.
export function nextOwed(assignments, data, name) {
  let best = null, bestAt = Infinity;
  (assignments || []).forEach(asg => {
    const st = dueState(asg.due);
    if (!st || st.tone === "late") return;
    if (logOf(data, asg.id, name).some(e => e.type === "submission")) return;
    if (isProfileTask(asg) && profileComplete(data?.profiles?.[name])) return;
    const at = parseDue(asg.due).getTime();
    if (at < bestAt) { bestAt = at; best = asg; }
  });
  return best;
}

// What is waiting on Andrew, challenge by challenge. Andrew, 2026-09-15:
// "how will i know if a student has written a new message to me on their
// assignment? or submitted? ... on the challenges card, it should show each
// assignment that has an outstanding comment or assignment submission with
// the number of comments and number of submissions."
//
// A submission counts while nothing has been graded since it arrived. A
// message counts while the last word on that student's challenge is theirs.
export function lastFrom(log, who) {
  for (let i = (log || []).length - 1; i >= 0; i--) {
    const e = log[i];
    if (who === "student" && e.type === "comment" && e.from === "student") return e;
    if (who === "instructor" && ((e.type === "comment" && e.from !== "student") || e.type === "grade")) return e;
  }
  return null;
}
// Appreciating a message answers it. Andrew, 2026-09-15: "sometimes i don't
// need to respond to a student message ... if i click that, it should say
// 'andrew appreciated this' and clear the message."
export const unanswered = (log) => {
  const theirs = lastFrom(log, "student");
  if (!theirs || theirs.appreciatedBy === "instructor") return false;
  const mine = lastFrom(log, "instructor");
  return !mine || mine.ts < theirs.ts;
};

// Taking a message back. Andrew, 2026-09-15: "i and students have to be able
// to delete messages. yes keep a log of them somewhere, but we need to be
// able to delete messages." So a deleted message is marked rather than
// removed: it leaves every screen and every count, and the words stay in the
// class record with who deleted it and when.
export const deletePatch = (data, aid, name, eid, by, now = Date.now()) => {
  const al = { ...(data?.assignmentLog || {}) };
  const byStudent = { ...(al[aid] || {}) };
  byStudent[name] = (byStudent[name] || []).map(e => e.id === eid ? { ...e, deleted: { at: now, by } } : e);
  al[aid] = byStudent;
  return { ...data, assignmentLog: al };
};

// The same toggle as the log's Appreciate, as a patch, so Grade view can use
// it without the log component.
export const appreciatePatch = (data, aid, name, eid, actor) => {
  const al = { ...(data?.assignmentLog || {}) };
  const byStudent = { ...(al[aid] || {}) };
  byStudent[name] = (byStudent[name] || []).map(e => e.id === eid ? { ...e, appreciatedBy: e.appreciatedBy === actor ? null : actor } : e);
  al[aid] = byStudent;
  return { ...data, assignmentLog: al };
};

export function waitingOn(data, assignments) {
  return (assignments || []).map(asg => {
    const byStudent = data?.assignmentLog?.[asg.id] || {};
    let toGrade = 0, messages = 0;
    Object.keys(byStudent).forEach(name => {
      const log = alive(byStudent[name]);
      if (needsGrade(log)) toGrade++;
      if (unanswered(log)) messages++;
    });
    return { id: asg.id, title: asg.title, toGrade, messages };
  }).filter(r => r.toGrade || r.messages);
}
export const waitingCount = (data, assignments) => waitingOn(data, assignments)
  .reduce((n, r) => ({ toGrade: n.toGrade + r.toGrade, messages: n.messages + r.messages }), { toGrade: 0, messages: 0 });

// What is coming up, and how much of the class has handed it in.
//
// Andrew, 2026-09-20: "you should show me what challenges are coming up, and
// how many students have turned them in out of how many students i have in
// the class", and then: "bc i have two sections of comm 3, give me numbers by
// section." A class with two sittings is two rooms, and 21 out of 34 says
// nothing about which room is behind.
//
// The card challenge has nothing to hand in, so its numerator is the students
// whose card is filled in. The test student is in nobody's count.
export function turnedIn(config, data, asg, section) {
  const all = realStudents(config, data?.students || config?.students || []);
  const roll = studentsIn(all, section);
  const byStudent = data?.assignmentLog?.[asg.id] || {};
  const done = roll.filter(st => isProfileTask(asg)
    ? profileComplete(data?.profiles?.[st.name])
    : alive(byStudent[st.name] || []).some(e => e.type === "submission"));
  return { section: section || "", in: done.length, of: roll.length };
}

// Every challenge with a date, nearest first, from a week back so something
// still coming in does not fall off the day it was due. Ongoing pieces have
// no date and nothing to hand in, so they are not on this list.
export function comingUp(config, data, assignments, limit = 4) {
  const day = 86400000;
  const now = Date.now();
  const rows = (assignments || []).map(asg => {
    const d = parseDue(asg.due);
    return d ? { asg, at: d.getTime() } : null;
  }).filter(Boolean)
    .filter(r => r.at > now - 7 * day)
    .sort((x, y) => x.at - y.at)
    .slice(0, limit);
  const secs = hasSections(config) ? sectionsOf(config) : [""];
  const waiting = waitingOn(data, assignments);
  return rows.map(({ asg }) => ({
    id: asg.id, title: asg.title, due: asg.due, dueTime: asg.dueTime,
    counts: secs.map(sec => turnedIn(config, data, asg, sec)),
    ...(waiting.find(w => w.id === asg.id) || { toGrade: 0, messages: 0 }),
  }));
}

// A date on its own makes a student do the arithmetic, and the thing students
// say most about every LMS they have used is that they could not tell what was
// actually due. So say the number of days, and say it in a colour.
export function dueState(due) {
  if (!due || due === "Ongoing") return null;
  const d = parseDue(due);
  if (!d) return null;
  // Calendar days, not hours rounded up. Counting hours made Thursday noon
  // "Due in 2 days" for something due Friday night, which is tomorrow.
  const now = new Date(Date.now());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - today) / 86400000);
  if (days < 0) { const n = -days; return { text: n === 1 ? "1 day past due" : n + " days past due", tone: "late" }; }
  if (days === 0) return { text: "Due today", tone: "now" };
  if (days === 1) return { text: "Due tomorrow", tone: "soon" };
  if (days <= 7) return { text: "Due in " + days + " days", tone: "soon" };
  return { text: "Due " + due, tone: "calm" };
}

export const dueColor = (tone) => tone === "late" ? LATE : (tone === "now" || tone === "soon") ? SOON : TEXT_MUTED;

// Used by the home page to work out what needs doing.
export const nextDue = (config, data) => nextDueOf(getAssignments(data, config));
export const ungradedCount = (config, data) => ungradedQueue(getAssignments(data, config), data).length;

// The badge says the weekday and the time as well as the date. COMM 3's
// exercises are due on Sundays, a day the class never meets, and "Due Sep 27"
// left a student to work out that Sep 27 is a Sunday and whether that means
// the morning or the night.
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function dueText(due, time) {
  const st = dueState(due);
  if (!st) return "Ongoing";
  const at = time ? ", " + time : "";
  if (st.tone === "calm") { const d = parseDue(due); return "Due " + WEEKDAY[d.getDay()] + " " + due + at; }
  if (st.tone === "late") return st.text;
  return st.text.startsWith("Due in") ? st.text : st.text + at;
}

// A piece that counts toward another one, like pre-production toward its
// project, carries no weight of its own, and "0%" beside it read as worthless.
const weightText = (weight) => weight ? " · " + weight + "%" : "";

function DueBadge({ due, time, weight }) {
  const st = dueState(due);
  const c = st ? dueColor(st.tone) : TEXT_MUTED;
  return (
    <span style={{ fontSize: 15, color: c, fontWeight: st && st.tone !== "calm" ? 700 : 400, flexShrink: 0 }}>
      {dueText(due, time)}{weightText(weight)}
    </span>
  );
}

function Btn({ accent, onClick, children, disabled, ghost }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ minHeight: TAP, padding: "0 18px", borderRadius: 10, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: disabled ? "default" : "pointer",
        border: ghost ? "1px solid " + BORDER_STRONG : "none", background: ghost ? "#fff" : (disabled ? BORDER_STRONG : accent), color: ghost ? TEXT_PRIMARY : "#fff" }}>
      {children}
    </button>
  );
}

const RichText = ({ html }) => <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: html || "" }} />;

// Appreciation animation: pulse. (An unhinged version is planned for the "Crashing Out" theme.)
const APPR_CSS = `@keyframes apprPulse{0%{transform:scale(.8);opacity:0;filter:brightness(1.7)}50%{transform:scale(1.12);filter:brightness(1.4)}100%{transform:scale(1);opacity:1;filter:brightness(1)}} .appr-badge{display:inline-block;animation:apprPulse .5s ease-out}`;

// ─── the running log, shared by student + instructor views ───
// Instructor entries (grade, instructor comment) align right; student entries
// (submission, student comment) align left. onLike toggles appreciation for the
// current actor; onDelete (instructor only) removes a grade or comment.
// A row of the log, on its own side of the conversation. It was declared inside
// AssignmentLog, which makes a new component type on every render, so React
// threw the whole conversation away and built it again every time anything
// above it changed. On the grading screen that is every draft save.
const Wrap = ({ right, children }) => (
  <div style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start" }}>
    <div style={{ maxWidth: "88%" }}>{children}</div>
  </div>
);

function AssignmentLog({ asg, log, accent, studentName, actor, onLike, onDelete }) {
  const delBtn = (eid) => onDelete && <button onClick={() => onDelete(eid)} style={{ background: "none", border: "none", color: "#dc2626", fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>Delete</button>;
  const apprLabel = (by) => (by === "instructor" ? "Dr. Ishak" : (by ? by.split(" ")[0] : "")) + " appreciated this";
  const likeBtn = (e) => {
    if (e.appreciatedBy) {
      const badge = <span key={e.appreciatedBy} className="appr-badge" style={{ fontSize: 13, fontWeight: 700, color: accent }}>{apprLabel(e.appreciatedBy)}</span>;
      return (onLike && e.appreciatedBy === actor)
        ? <button onClick={() => onLike(e.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>{badge}</button>
        : badge;
    }
    return onLike ? <button onClick={() => onLike(e.id)} style={{ background: "none", border: "none", color: TEXT_MUTED, fontFamily: F, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}>Appreciate</button> : null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <style>{APPR_CSS}</style>
      <div style={{ textAlign: "center" }}><span style={{ fontSize: 13, color: TEXT_MUTED, background: BG, padding: "4px 12px", borderRadius: 999 }}>Challenge posted · Due {asg.due || "TBD"}</span></div>
      {log.map(e => {
        if (e.type === "submission") {
          const late = isLate(e.ts, asg.due);
          return (
            <Wrap key={e.id} right={false}>
              <div style={{ background: SURFACE_CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ ...label, color: TEXT_SECONDARY }}>Submitted</div>
                  <div style={{ fontSize: 13, color: late ? "#dc2626" : TEXT_MUTED }}>{fmtTime(e.ts)}{late ? " · Late" : ""}</div>
                </div>
                {e.link && <div style={{ marginTop: 6 }}><a href={e.link} target="_blank" rel="noreferrer" style={{ fontSize: 15, fontWeight: 600, color: accent, wordBreak: "break-all" }}>{e.link}</a></div>}
                {e.text && <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.5, marginTop: 6, whiteSpace: "pre-wrap" }}>{e.text}</div>}
                {(onLike || e.appreciatedBy) && <div style={{ marginTop: 8 }}>{likeBtn(e)}</div>}
              </div>
            </Wrap>
          );
        }
        if (e.type === "grade") {
          return (
            <Wrap key={e.id} right>
              <div style={{ background: accent + "0e", border: "1px solid " + accent + "33", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ ...label, color: accent }}>Grade</div>
                    <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>{fmtTime(e.ts)}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: accent, flexShrink: 0 }}>{gradeText(e)}</div>
                </div>
                {asg.rubric?.length > 0 && e.rubric && (
                  <div style={{ marginTop: 8 }}>
                    {asg.rubric.map(c => <div key={c.id} style={{ fontSize: 15, color: TEXT_SECONDARY }}>{c.name}: {e.rubric[c.id] ?? 0}/{c.points}</div>)}
                  </div>
                )}
                {e.html && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + accent + "22" }}><RichText html={e.html} /></div>}
                {onDelete && <div style={{ marginTop: 8, textAlign: "right" }}>{delBtn(e.id)}</div>}
              </div>
            </Wrap>
          );
        }
        // comment: instructor rich text (right), or student plain text (left)
        const fromStudent = e.from === "student";
        const who = fromStudent ? (studentName ? studentName.split(" ")[0] : "Student") : "Dr. Ishak";
        return (
          <Wrap key={e.id} right={!fromStudent}>
            <div style={{ background: fromStudent ? BG : "#fff", border: "1px solid " + BORDER, borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ ...label, color: TEXT_SECONDARY }}>Comment from {who}</div>
                <div style={{ fontSize: 13, color: TEXT_MUTED }}>{fmtTime(e.ts)}</div>
              </div>
              {fromStudent
                ? <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.5, marginTop: 6, whiteSpace: "pre-wrap" }}>{e.text}</div>
                : <div style={{ marginTop: 6 }}><RichText html={e.html} /></div>}
              <div style={{ marginTop: 8, display: "flex", gap: 14, alignItems: "center", justifyContent: fromStudent ? "flex-start" : "flex-end" }}>
                {likeBtn(e)}
                {delBtn(e.id)}
              </div>
            </div>
          </Wrap>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export function AssignmentsSummary({ config, data, role, name }) {
  const assignments = getAssignments(data, config);
  if (role === "instructor") {
    // What is coming up, how much of each room has handed it in, and what is
    // waiting on him. The card used to hold the waiting rows alone, which
    // said nothing about what was coming or how many people were behind.
    // The next one due, and another only while something on it is waiting on
    // him. Andrew, 2026-09-24: "why is the mywork box so tall. only needs to
    // have the next assigmment." The work to grade stays, since that is what
    // the card is for on his side; the rest are a tap away.
    const all = comingUp(config, data, assignments);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const next = all.find(r => { const d = parseDue(r.due); return d && d.getTime() >= today.getTime(); });
    const rows = all.filter(r => r === next || r.toGrade || r.messages);
    if (!rows.length) return <Muted>No challenge has a due date yet.</Muted>;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(r => {
          const st = dueState(r.due);
          return (
            <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                {r.toGrade ? <Pill accent={config.accent}>{r.toGrade} to grade</Pill> : null}
                {r.messages ? <Pill accent={config.accent}>{r.messages} message{r.messages === 1 ? "" : "s"}</Pill> : null}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, color: st ? dueColor(st.tone) : TEXT_MUTED, fontWeight: st && st.tone !== "calm" ? 700 : 400 }}>
                  {dueText(r.due, r.dueTime)}
                </span>
                {r.counts.map(c => (
                  <span key={c.section || "all"} style={{ fontSize: 14, color: TEXT_SECONDARY }}>
                    {c.section ? <b style={{ fontWeight: 600 }}>{c.section}</b> : null}{c.section ? " " : ""}{c.in}/{c.of} in
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  const next = name ? nextOwed(assignments, data, name) : nextDueOf(assignments);
  if (!next) return <Muted>No upcoming challenges.</Muted>;
  const st = dueState(next.due);
  // The next one by name and when it is due, and nothing else. The count of
  // the others went on 2026-09-24: "only needs to have the next assigmment."
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...label, color: TEXT_MUTED, flex: "none" }}>Next</span>
        <span style={{ minWidth: 0, fontWeight: 600 }}>{next.title}</span>
      </div>
      <div style={{ fontSize: 15, marginTop: 2, color: st ? dueColor(st.tone) : TEXT_MUTED, fontWeight: st && st.tone !== "calm" ? 700 : 400 }}>
        {dueText(next.due, next.dueTime)}{weightText(next.weight)}
      </div>
    </div>
  );
}

// The instructor's Assignments page. A student's side is the cards and the
// page for each assignment, in AssignmentCards.jsx.
export function AssignmentsDetail({ config, data, update }) {
  return <InstructorAssignments config={config} data={data} update={update} />;
}

// ─── STUDENT ───
// `bare` leaves out the title, due, description, Details and grade, for the
// assignment's own page, which draws those itself above the log.
export function StudentAssignmentRow({ asg, accent, config, data, update, name, bare }) {
  const log = logOf(data, asg.id, name);
  const grade = currentGrade(log);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [adding, setAdding] = useState(false);
  const email = config.instructor?.email || "your instructor";
  const closed = asg.closeAt ? Date.now() > new Date(asg.closeAt).getTime() : false;

  const submit = () => {
    if (!link.trim() && !note.trim()) return;
    addEvent(update, asg.id, name, { type: "submission", link: link.trim(), text: note.trim() });
    setLink(""); setNote(""); setAdding(false);
  };
  const postComment = () => {
    if (!comment.trim()) return;
    addEvent(update, asg.id, name, { type: "comment", from: "student", text: comment.trim() });
    setComment("");
  };

  const hasSubmitted = log.some(e => e.type === "submission");

  return (
    <div id={"asg-" + asg.id} style={bare ? {} : { background: SURFACE_CARD, borderRadius: 16, border: "1px solid " + BORDER, padding: 18, scrollMarginTop: 80 }}>
      {bare ? null : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{asg.title}</div>
            <DueBadge due={asg.due} time={asg.dueTime} weight={asg.weight} />
          </div>
          {asg.description && <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: 6 }}>{asg.description}</div>}
          {asg.instructionsUrl && <div style={{ marginTop: 10 }}><DetailsLink href={asg.instructionsUrl} accent={accent} /></div>}
          {grade && <div style={{ marginTop: 10, fontSize: 22, fontWeight: 700, color: accent }}>Grade: {gradeText(grade)}</div>}
        </>
      )}

      <div style={bare ? {} : { marginTop: 14, paddingTop: 14, borderTop: "1px solid " + BORDER }}>
        <AssignmentLog asg={asg} log={log} accent={accent} studentName={name} actor={name} onLike={(eid) => appreciate(update, asg.id, name, eid, name)} />
      </div>

      {/* submit a link */}
      <div style={{ marginTop: 16 }}>
        {closed ? (
          <Muted style={{ color: TEXT_SECONDARY }}>Submissions closed{asg.closeAt ? " · " + fmtClose(asg.closeAt) : ""}.</Muted>
        ) : adding || !hasSubmitted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={label}>Submit a link</div>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="A link" style={inputStyle} />
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="A note (optional)" style={{ ...inputStyle, minHeight: 64, lineHeight: 1.5, resize: "vertical" }} />
            <Muted style={{ color: "#b45309" }}>Please ensure that {email} has access to your link.</Muted>
            {asg.closeAt && <Muted>Submissions close {fmtClose(asg.closeAt)}.</Muted>}
            <div><Btn accent={accent} onClick={submit} disabled={!link.trim() && !note.trim()}>Submit link</Btn></div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ background: "none", border: "none", color: accent, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0 }}>+ Submit another link</button>
        )}
      </div>

      {/* post a comment */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid " + BORDER }}>
        <div style={label}>Add a comment</div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="A question, or a note" style={{ ...inputStyle, minHeight: 64, lineHeight: 1.5, resize: "vertical", marginTop: 8 }} />
        <div style={{ marginTop: 8 }}><Btn accent={accent} ghost onClick={postComment} disabled={!comment.trim()}>Post comment</Btn></div>
      </div>
    </div>
  );
}

// ─── INSTRUCTOR ───
function InstructorAssignments({ config, data, update }) {
  const a = config.accent;
  const assignments = getAssignments(data, config);
  const [view, setView] = useState("grade");
  const [queue, setQueue] = useState(null);

  if (queue) return <GradeFlow config={config} data={data} update={update} queue={queue} onExit={() => setQueue(null)} />;

  const writeAssignments = (fn) => update(prev => ({ ...prev, assignments: fn(prev.assignments || config.assignments || []) }));

  return (
    <div>
      <div style={{ ...h2, marginBottom: 12 }}>My Work</div>
      <div style={{ display: "flex", gap: 4, background: BG, padding: 3, borderRadius: 999, border: "1px solid " + BORDER, width: "fit-content", marginBottom: 16 }}>
        {[["grade", "To grade"], ["manage", "Manage"]].map(([k, lbl]) => (
          <span key={k} onClick={() => setView(k)}
            style={{ fontSize: 15, fontWeight: 600, padding: "8px 16px", borderRadius: 999, cursor: "pointer", background: view === k ? a : "transparent", color: view === k ? "#fff" : TEXT_SECONDARY }}>{lbl}</span>
        ))}
      </div>
      {view === "grade"
        ? <GradeHub config={config} data={data} assignments={assignments} onStart={setQueue} />
        : <ManageAssignments config={config} data={data} update={update} assignments={assignments} writeAssignments={writeAssignments} />}
    </div>
  );
}

function GradeHub({ config, data, assignments, onStart }) {
  const a = config.accent;
  const all = ungradedQueue(assignments, data);
  const needInstructions = assignments.filter(x => !x.instructionsUrl && !x.description);

  return (
    <div>
      {needInstructions.length > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#b45309" }}>Reminders</div>
          {needInstructions.map(x => <div key={x.id} style={{ fontSize: 15, color: "#92400e", marginTop: 4 }}>Post details for {x.title}</div>)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div><span style={{ fontSize: 22, fontWeight: 700, color: a }}>{all.length}</span> <span style={{ color: TEXT_SECONDARY }}>to grade</span></div>
        {all.length > 0 && <Btn accent={a} onClick={() => onStart(all)}>Grade all</Btn>}
      </div>
      <a href={config.path + "/grade"} style={{ display: "inline-flex", alignItems: "center", minHeight: TAP, fontSize: 15, fontWeight: 600, color: a, textDecoration: "none", marginBottom: 12 }}>Open grade view: sort the class into columns →</a>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {assignments.map(asg => {
          // Out of how many, and by room where there are two of them.
          const counts = (hasSections(config) ? sectionsOf(config) : [""]).map(sec => turnedIn(config, data, asg, sec));
          const inWords = counts.map(c => (c.section ? c.section + " " : "") + c.in + "/" + c.of).join(" · ");
          const ungraded = ungradedQueue(assignments, data, asg.id);
          const waiting = Object.keys(data?.assignmentLog?.[asg.id] || {}).filter(n => unanswered(logOf(data, asg.id, n))).length;
          const roster = rosterOf(config, data).map(s => ({ aid: asg.id, name: s.name }));
          return (
            <div key={asg.id} style={{ background: SURFACE_CARD, border: "1px solid " + BORDER, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, overflow: "hidden" }}>
              <button onClick={() => onStart(roster)} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: F, padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{asg.title}</div>
                <Muted>{inWords} turned in · {ungraded.length} to grade{waiting ? " · " + waiting + " message" + (waiting === 1 ? "" : "s") : ""}</Muted>
              </button>
              <div style={{ paddingRight: 14, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                <a href={config.path + "/grade?a=" + encodeURIComponent(asg.id)} style={{ fontSize: 15, fontWeight: 600, color: a, textDecoration: "none", minHeight: TAP, display: "inline-flex", alignItems: "center" }}>Grade view</a>
                {ungraded.length > 0 && <Btn accent={a} ghost onClick={() => onStart(ungraded)}>Grade ({ungraded.length})</Btn>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GradeFlow({ config, data, update, queue, onExit }) {
  const a = config.accent;
  const [i, setI] = useState(0);
  const assignments = getAssignments(data, config);

  if (i >= queue.length) {
    return (
      <div style={{ textAlign: "center", padding: "30px 0" }}>
        <div style={{ ...h2, marginBottom: 8 }}>All done</div>
        <Muted style={{ marginBottom: 16 }}>Worked through {queue.length} submission{queue.length === 1 ? "" : "s"}.</Muted>
        <Btn accent={a} onClick={onExit}>Back to My Work</Btn>
      </div>
    );
  }

  const { aid, name } = queue[i];
  const asg = assignments.find(x => x.id === aid);
  const log = logOf(data, aid, name);
  const draft = data?.commentDrafts?.[aid]?.[name] || "";

  const saveDraft = (html) => update(prev => {
    const d = { ...(prev.commentDrafts || {}) }; d[aid] = { ...(d[aid] || {}), [name]: html }; return { ...prev, commentDrafts: d };
  });
  const clearDraft = () => update(prev => {
    const d = { ...(prev.commentDrafts || {}) }; if (d[aid]) { d[aid] = { ...d[aid] }; delete d[aid][name]; } return { ...prev, commentDrafts: d };
  });

  const submit = ({ grade, commentHtml, advance }) => {
    if (grade) addEvent(update, aid, name, { type: "grade", score: grade.score, rubric: grade.rubric, html: commentHtml || null });
    else if (commentHtml) addEvent(update, aid, name, { type: "comment", from: "instructor", html: commentHtml });
    clearDraft();
    if (advance) setI(i + 1);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <button onClick={onExit} style={{ background: "none", border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, color: a, cursor: "pointer", minHeight: TAP, padding: 0 }}>← Exit</button>
        <div style={{ fontSize: 15, color: TEXT_MUTED }}>{i + 1} of {queue.length}</div>
      </div>
      <GradeForm key={aid + "|" + name} config={config} asg={asg} name={name} profile={profileOf(data, name)} log={log} draftHtml={draft} onDraft={saveDraft} onSubmit={submit} onSkip={() => setI(i + 1)}
        onLike={(eid) => appreciate(update, aid, name, eid, "instructor")} onDelete={(eid) => deleteEvent(update, aid, name, eid)} />
    </div>
  );
}

const CANT_ACCESS_HTML = "<i>I cannot access your link. This challenge currently is scored as a 0. Please resubmit within 24 hours for credit.</i>";

function GradeForm({ config, asg, name, profile, log, draftHtml, onDraft, onSubmit, onSkip, onLike, onDelete }) {
  const a = config.accent;
  const hasRubric = (asg?.rubric || []).length > 0;
  const prev = currentGrade(log);
  const [rubric, setRubric] = useState(() => { const r = {}; (asg?.rubric || []).forEach(c => { r[c.id] = prev?.rubric?.[c.id] ?? ""; }); return r; });
  const [scoreDraft, setScoreDraft] = useState(prev && !hasRubric ? String(prev.score) : "");
  const editorRef = useRef(null);
  const [drafting, setDrafting] = useState(false);
  const [draftErr, setDraftErr] = useState("");
  const [steer, setSteer] = useState("");

  const rubricScore = (asg?.rubric || []).reduce((s, c) => s + (Number(rubric[c.id]) || 0), 0);

  const buildGrade = () => (hasRubric || scoreDraft !== "")
    ? { score: hasRubric ? rubricScore : (Number(scoreDraft) || 0), rubric: hasRubric ? Object.fromEntries(Object.entries(rubric).map(([k, v]) => [k, Number(v) || 0])) : null }
    : null;
  const currentComment = () => { const html = editorRef.current?.innerHTML || ""; return html.replace(/<[^>]*>/g, "").trim() ? html : null; };

  const doSubmit = (advance) => {
    onSubmit({ grade: buildGrade(), commentHtml: currentComment(), advance });
    if (!advance && editorRef.current) editorRef.current.innerHTML = "";
  };
  const draft = async () => {
    setDrafting(true); setDraftErr("");
    const r = await draftFeedback({
      asg, name, log, rubric,
      score: hasRubric ? rubricScore : (scoreDraft !== "" ? Number(scoreDraft) : null),
      note: steer.trim(),
    });
    setDrafting(false);
    if (!r.ok) { setDraftErr(r.error); return; }
    const html = textToHtml(r.text);
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      onDraft(html);
    }
  };

  const cantAccess = () => {
    const grade = { score: 0, rubric: hasRubric ? Object.fromEntries(asg.rubric.map(c => [c.id, 0])) : null };
    onSubmit({ grade, commentHtml: CANT_ACCESS_HTML, advance: true });
  };

  return (
    <div style={{ background: SURFACE_CARD, border: "1px solid " + BORDER, borderRadius: 16, padding: 18 }}>
      <div style={label}>{asg?.title} · {asg?.weight}%</div>
      {/* Whose work this is, as a face. Andrew, 2026-09-23: "avatars anywhere
          their names appear." */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
        <Avatar profile={profile} name={name} accent={a} size={40} />
        <div style={{ fontSize: 22, fontWeight: 600 }}>{name}</div>
      </div>
      {prev && <div style={{ fontSize: 15, fontWeight: 600, color: a, marginTop: 2 }}>Current grade: {prev.score}/100 — change it below and Submit</div>}

      <div style={{ marginTop: 14 }}><AssignmentLog asg={asg} log={log} accent={a} studentName={name} actor="instructor" onLike={onLike} onDelete={onDelete} /></div>

      {hasRubric ? (
        <div style={{ marginTop: 16 }}>
          <div style={label}>Rubric</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {asg.rubric.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, fontSize: 15 }}>{c.name}</div>
                <input type="number" min="0" max={c.points} value={rubric[c.id]} onChange={e => setRubric(r => ({ ...r, [c.id]: e.target.value }))} style={{ ...inputStyle, width: 80, minHeight: 40, textAlign: "right" }} />
                <div style={{ width: 44, fontSize: 15, color: TEXT_MUTED }}>/ {c.points}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 17, fontWeight: 700, color: a }}>Score: {rubricScore}/100</div>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div style={label}>Score (out of 100)</div>
          <input type="number" min="0" max="100" value={scoreDraft} onChange={e => setScoreDraft(e.target.value)} style={{ ...inputStyle, width: 120, marginTop: 6 }} />
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={label}>Comment back</div>
        <RichEditor editorRef={editorRef} initialHtml={draftHtml} onDraft={onDraft} />
      </div>

      {/* Draft it, then edit it. Nothing here sends anything to the student. */}
      <div style={{ marginTop: 12, padding: 12, border: "1px solid " + BORDER, borderRadius: 12, background: BG }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Btn accent={a} ghost disabled={drafting} onClick={draft}>
            {drafting ? "Drafting…" : "Draft a comment"}
          </Btn>
          <input value={steer} onChange={e => setSteer(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !drafting) draft(); }}
            placeholder="A note (optional)"
            style={{ ...inputStyle, flex: 1, minWidth: 200, minHeight: 40 }} />
        </div>
        <Muted style={{ fontSize: 13, marginTop: 8 }}>
          {draftErr
            ? <span style={{ color: "#dc2626", fontWeight: 600 }}>{draftErr}</span>
            : "Writes into the box above from the rubric you just scored and what they turned in. Read it and change it before you submit."}
        </Muted>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Btn accent={a} onClick={() => doSubmit(true)}>Submit & next</Btn>
        <Btn accent={a} ghost onClick={() => doSubmit(false)}>Submit</Btn>
        <Btn accent={a} ghost onClick={onSkip}>Skip</Btn>
      </div>
      <button onClick={cantAccess} style={{ marginTop: 12, minHeight: TAP, padding: "0 16px", borderRadius: 10, border: "1px solid #fca5a5", background: SURFACE_CARD, color: "#dc2626", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Can't access link → 0 + resubmit notice
      </button>
    </div>
  );
}

// The box that holds the comment, and the box holds it.
//
// Andrew, 2026-09-21: "when i type in assignment details, the cursor keeps
// going to the beginning."
//
// It was handed its HTML on every render, through dangerouslySetInnerHTML.
// Typing saves a draft after 600ms of quiet, the draft goes into the class
// store, the store comes back as a new `initialHtml`, and React answers a
// changed __html by replacing what is inside the node. The words survive that.
// The caret does not: it lands back at the top of the box, mid-sentence, about
// once a second, for as long as you keep typing.
//
// So the draft seeds the box once, when the box is made, and after that the box
// owns what is in it. GradeForm carries a key of assignment and student, so the
// next person to grade is a new box, seeded again from their own draft. The
// Draft a comment button writes through the same ref, which is why it still
// lands.
function RichEditor({ editorRef, initialHtml, onDraft }) {
  const timer = useRef(null);
  const cmd = (c, v) => document.execCommand(c, false, v);
  const flush = () => { if (onDraft && editorRef.current) onDraft(editorRef.current.innerHTML); };
  const onInput = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(flush, 600); };
  // Seeded once. The draft this opens on is whatever was typed and left behind
  // last time, and a save in flight must never come back and move the caret.
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml || "";
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  const tb = { minHeight: 36, minWidth: 40, borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: SURFACE_CARD, cursor: "pointer", fontFamily: F, fontSize: 15 };
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button onMouseDown={e => e.preventDefault()} onClick={() => cmd("bold")} style={{ ...tb, fontWeight: 800 }}>B</button>
        <button onMouseDown={e => e.preventDefault()} onClick={() => cmd("italic")} style={{ ...tb, fontStyle: "italic" }}>I</button>
        <button onMouseDown={e => e.preventDefault()} onClick={() => { const u = prompt("Link URL"); if (u) cmd("createLink", u); }} style={{ ...tb, fontWeight: 600 }}>Link</button>
      </div>
      <div contentEditable ref={editorRef} suppressContentEditableWarning onInput={onInput} onBlur={flush}
        style={{ ...inputStyle, minHeight: 100, lineHeight: 1.5, padding: 12, textAlign: "left" }} />
    </div>
  );
}

function ManageAssignments({ config, data, update, assignments, writeAssignments }) {
  const a = config.accent;
  const [editing, setEditing] = useState(null);

  if (editing) {
    const asg = editing === "new" ? null : assignments.find(x => x.id === editing);
    return <AssignmentEditor config={config} asg={asg}
      onCancel={() => setEditing(null)}
      onSave={(next) => {
        // A due date that moves is news, so it lands in the conversation on
        // the challenge's page as a message of its own.
        update(prev => {
          const list = prev.assignments || config.assignments || [];
          const before = list.find(x => x.id === next.id);
          const moved = !before || before.due !== next.due || (before.dueTime || "") !== (next.dueTime || "");
          const log = { ...(prev.dueLog || {}) };
          if (moved && next.due) log[next.id] = [...(log[next.id] || []), { at: Date.now(), due: next.due, dueTime: next.dueTime || "" }];
          return { ...prev, dueLog: log, assignments: asg ? list.map(x => x.id === asg.id ? next : x) : [...list, next] };
        });
        setEditing(null);
      }}
      onDelete={asg ? () => { writeAssignments(list => list.filter(x => x.id !== asg.id)); setEditing(null); } : null} />;
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {assignments.map(asg => (
          <button key={asg.id} onClick={() => setEditing(asg.id)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", background: SURFACE_CARD, border: "1px solid " + BORDER, borderRadius: 12, padding: 14, cursor: "pointer", fontFamily: F, minHeight: TAP }}>
            <div><div style={{ fontWeight: 600, fontSize: 16 }}>{asg.title}</div><Muted>Due {asg.due}{asg.dueTime ? ", " + asg.dueTime : ""} · {asg.weight || 0}% · {asg.rubric?.length ? asg.rubric.length + " criteria" : "free-form"}</Muted></div>
            <span style={{ color: a, fontSize: 15, fontWeight: 600 }}>Edit</span>
          </button>
        ))}
      </div>
      <button onClick={() => setEditing("new")} style={{ marginTop: 12, minHeight: TAP, padding: "0 18px", borderRadius: 999, border: "1px dashed " + BORDER_STRONG, background: SURFACE_CARD, fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY, cursor: "pointer" }}>+ Add challenge</button>
    </div>
  );
}

function AssignmentEditor({ config, asg, onSave, onCancel, onDelete }) {
  const a = config.accent;
  const [title, setTitle] = useState(asg?.title || "");
  const [due, setDue] = useState(asg?.due || "");
  const [dueTime, setDueTime] = useState(asg?.dueTime || "");
  const [weight, setWeight] = useState(asg?.weight != null ? String(asg.weight) : "");
  const [description, setDescription] = useState(asg?.description || "");
  const [instructionsUrl, setInstructionsUrl] = useState(asg?.instructionsUrl || "");
  const [closeAt, setCloseAt] = useState(asg?.closeAt || "");
  const [rubric, setRubric] = useState(asg?.rubric || []);
  const [scale, setScale] = useState(scaleOf(asg));

  const setCrit = (id, field, val) => setRubric(r => r.map(c => c.id === id ? { ...c, [field]: val } : c));
  const rubricTotal = rubric.reduce((s, c) => s + (Number(c.points) || 0), 0);

  const save = () => {
    if (!title.trim()) return;
    // Starts from the assignment as stored, so a field this form has no box
    // for survives a save. Saving used to rebuild the object from the boxes,
    // and every COMM 118 assignment lost its 11:59 PM the first time it was
    // edited.
    onSave({
      ...(asg || {}),
      id: asg?.id || genId(), title: title.trim(), due: due.trim(), dueTime: dueTime.trim(), weight: Number(weight) || 0, scale,
      description: description.trim(), instructionsUrl: instructionsUrl.trim(), closeAt: closeAt || "",
      rubric: rubric.filter(c => c.name.trim()).map(c => ({ id: c.id, name: c.name.trim(), points: Number(c.points) || 0 })),
    });
  };

  const fieldL = { ...label, marginTop: 14 };
  return (
    <div>
      <button onClick={onCancel} style={{ background: "none", border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, color: a, cursor: "pointer", minHeight: TAP, padding: 0 }}>← Back</button>
      <div style={fieldL}>Title</div>
      <input value={title} onChange={e => setTitle(e.target.value)} autoFocus style={{ ...inputStyle, marginTop: 6 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><div style={fieldL}>Due</div><input value={due} onChange={e => setDue(e.target.value)} placeholder="Oct 9" style={{ ...inputStyle, marginTop: 6 }} /></div>
        <div style={{ flex: 1 }}><div style={fieldL}>Due time</div><input value={dueTime} onChange={e => setDueTime(e.target.value)} placeholder="11:59 PM" style={{ ...inputStyle, marginTop: 6 }} /></div>
        <div style={{ width: 120 }}><div style={fieldL}>Weight %</div><input type="number" min="0" value={weight} onChange={e => setWeight(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} /></div>
      </div>
      {/* How the challenge is graded, chosen when it is made. Letters are the
          seven columns; Complete is Complete, Not quite, Incomplete and Not
          submitted. */}
      <div style={fieldL}>Graded with</div>
      <div role="radiogroup" aria-label="Graded with" style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        {Object.entries(SCALES).map(([id, name]) => (
          <button key={id} role="radio" aria-checked={scale === id} onClick={() => setScale(id)}
            style={{ minHeight: TAP, padding: "0 18px", borderRadius: 999, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
              border: "1px solid " + (scale === id ? a : BORDER_STRONG), background: scale === id ? a : "#fff", color: scale === id ? "#fff" : TEXT_PRIMARY }}>
            {name}
          </button>
        ))}
      </div>
      <Muted style={{ marginTop: 6 }}>{scale === "complete" ? "Complete, Not quite, Incomplete or Not submitted." : "A, B, C, D, Incomplete or F."}</Muted>
      <div style={fieldL}>Short description</div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 64, lineHeight: 1.5, resize: "vertical", marginTop: 6 }} />
      <div style={fieldL}>Details link</div>
      <input value={instructionsUrl} onChange={e => setInstructionsUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, marginTop: 6 }} />
      <div style={fieldL}>Submissions close (optional)</div>
      <input type="datetime-local" value={closeAt} onChange={e => setCloseAt(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
      <Muted style={{ marginTop: 6 }}>Comments stay open after the deadline.</Muted>

      <div style={{ ...fieldL }}>Rubric {rubric.length > 0 && "(" + rubricTotal + "/100)"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {rubric.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={c.name} onChange={e => setCrit(c.id, "name", e.target.value)} placeholder="Criterion" style={{ ...inputStyle, flex: 1, minHeight: 40 }} />
            <input type="number" min="0" value={c.points} onChange={e => setCrit(c.id, "points", e.target.value)} style={{ ...inputStyle, width: 80, minHeight: 40, textAlign: "right" }} />
            <button onClick={() => setRubric(r => r.filter(x => x.id !== c.id))} style={{ minHeight: 40, minWidth: 40, borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: SURFACE_CARD, color: TEXT_MUTED, cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => setRubric(r => [...r, { id: genId(), name: "", points: 0 }])} style={{ marginTop: 8, background: "none", border: "none", color: a, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0 }}>+ Add criterion</button>
      <Muted style={{ marginTop: 6 }}>No rubric means a score out of 100.</Muted>

      <div style={{ display: "flex", gap: 8, marginTop: 18, alignItems: "center" }}>
        <Btn accent={a} onClick={save} disabled={!title.trim()}>Save</Btn>
        {onDelete && <button onClick={onDelete} style={{ minHeight: TAP, padding: "0 16px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: SURFACE_CARD, color: "#dc2626", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Delete</button>}
      </div>
    </div>
  );
}
