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

import { useState, useRef } from "react";
import { genId } from "../utils.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#eef0f2";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";
const LATE = "#e11d48";
const SOON = "#b45309";
const TAP = 44;

const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;
const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: TAP, background: "#fff", color: TEXT_PRIMARY };

// ─── data ───
const getAssignments = (data, config) => data?.assignments || config.assignments || [];
const logOf = (data, aid, name) => data?.assignmentLog?.[aid]?.[name] || [];
const lastOf = (log, type) => { for (let i = log.length - 1; i >= 0; i--) if (log[i].type === type) return log[i]; return null; };
const currentGrade = (log) => lastOf(log, "grade");
const needsGrade = (log) => { const s = lastOf(log, "submission"); const g = lastOf(log, "grade"); return !!s && (!g || s.ts > g.ts); };

// Weighted current grade for a student: weighted average (0-100) over graded
// assignments only. Returns { pct, rows }. pct is null if nothing graded yet.
export function computeGrade(config, data, name) {
  const assignments = getAssignments(data, config);
  let earned = 0, weight = 0;
  const rows = assignments.map(asg => {
    const g = currentGrade(data?.assignmentLog?.[asg.id]?.[name] || []);
    if (g) { earned += g.score * (asg.weight || 0); weight += (asg.weight || 0); }
    return { id: asg.id, title: asg.title, weight: asg.weight || 0, score: g ? g.score : null };
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
const deleteEvent = (update, aid, name, eid) => mutateLog(update, aid, name, log => log.filter(e => e.id !== eid));

function ungradedQueue(assignments, data, onlyAid) {
  const q = [];
  assignments.forEach(asg => {
    if (onlyAid && asg.id !== onlyAid) return;
    const byStudent = data?.assignmentLog?.[asg.id] || {};
    Object.keys(byStudent).forEach(name => { if (needsGrade(byStudent[name])) q.push({ aid: asg.id, name }); });
  });
  return q;
}

// ─── dates ───
function parseDue(s) { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d : null; }
function isLate(ts, due) { const d = parseDue(due); if (!d) return false; const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59); return ts > end.getTime(); }
function fmtTime(ts) { try { return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } }
function fmtClose(s) { try { return new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return s; } }
function nextDueOf(assignments) {
  const t0 = (() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(); })();
  let best = null, diff0 = Infinity;
  assignments.forEach(a => { const d = parseDue(a.due); if (!d) return; const diff = d.getTime() - t0; if (diff >= 0 && diff < diff0) { diff0 = diff; best = a; } });
  return best || assignments[0] || null;
}

// A date on its own makes a student do the arithmetic, and the thing students
// say most about every LMS they have used is that they could not tell what was
// actually due. So say the number of days, and say it in a colour.
export function dueState(due) {
  if (!due || due === "Ongoing") return null;
  const d = parseDue(due);
  if (!d) return null;
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
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

function DueBadge({ due, weight }) {
  const st = dueState(due);
  const c = st ? dueColor(st.tone) : TEXT_MUTED;
  return (
    <span style={{ fontSize: 14, color: c, fontWeight: st && st.tone !== "calm" ? 700 : 400, flexShrink: 0 }}>
      {st ? st.text : "Ongoing"}{weight != null ? " · " + weight + "%" : ""}
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
function AssignmentLog({ asg, log, accent, studentName, actor, onLike, onDelete }) {
  const Wrap = ({ right, children }) => (
    <div style={{ display: "flex", justifyContent: right ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "88%" }}>{children}</div>
    </div>
  );
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
      <div style={{ textAlign: "center" }}><span style={{ fontSize: 13, color: TEXT_MUTED, background: BG, padding: "4px 12px", borderRadius: 999 }}>Assignment posted · Due {asg.due || "TBD"}</span></div>
      {log.map(e => {
        if (e.type === "submission") {
          const late = isLate(e.ts, asg.due);
          return (
            <Wrap key={e.id} right={false}>
              <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 12, padding: 12 }}>
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
                  <div style={{ fontSize: 24, fontWeight: 700, color: accent, flexShrink: 0 }}>{e.score}/100</div>
                </div>
                {asg.rubric?.length > 0 && e.rubric && (
                  <div style={{ marginTop: 8 }}>
                    {asg.rubric.map(c => <div key={c.id} style={{ fontSize: 14, color: TEXT_SECONDARY }}>{c.name}: {e.rubric[c.id] ?? 0}/{c.points}</div>)}
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
export function AssignmentsSummary({ config, data, role }) {
  const assignments = getAssignments(data, config);
  if (role === "instructor") {
    const n = ungradedQueue(assignments, data).length;
    return n > 0
      ? <div><div style={{ fontSize: 22, fontWeight: 700, color: config.accent }}>{n}</div><Muted>to grade</Muted></div>
      : <Muted>Nothing to grade.</Muted>;
  }
  const next = nextDueOf(assignments);
  if (!next) return <Muted>No upcoming assignments.</Muted>;
  const st = dueState(next.due);
  return (
    <div>
      <div style={{ fontWeight: 600 }}>{next.title}</div>
      <div style={{ fontSize: 15, marginTop: 2, color: st ? dueColor(st.tone) : TEXT_MUTED, fontWeight: st && st.tone !== "calm" ? 700 : 400 }}>
        {st ? st.text : "Ongoing"} · {next.weight}%
      </div>
    </div>
  );
}

export function AssignmentsDetail({ config, role, data, update, asStudent }) {
  if (role === "instructor") return <InstructorAssignments config={config} data={data} update={update} />;
  return <StudentAssignments config={config} data={data} update={update} name={asStudent} />;
}

// ─── STUDENT ───
function StudentAssignments({ config, data, update, name }) {
  const a = config.accent;
  const assignments = getAssignments(data, config);
  return (
    <div>
      <div style={{ ...h2, marginBottom: 16 }}>Assignments</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {assignments.map(asg => <StudentAssignmentRow key={asg.id} asg={asg} accent={a} config={config} data={data} update={update} name={name} />)}
      </div>
    </div>
  );
}

function StudentAssignmentRow({ asg, accent, config, data, update, name }) {
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
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + BORDER, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{asg.title}</div>
        <DueBadge due={asg.due} weight={asg.weight} />
      </div>
      {asg.description && <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: 6 }}>{asg.description}</div>}
      {asg.instructionsUrl && <a href={asg.instructionsUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, fontSize: 15, fontWeight: 600, color: accent }}>Assignment instructions</a>}
      {grade && <div style={{ marginTop: 10, fontSize: 22, fontWeight: 700, color: accent }}>Grade: {grade.score}/100</div>}

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + BORDER }}>
        <AssignmentLog asg={asg} log={log} accent={accent} studentName={name} actor={name} onLike={(eid) => appreciate(update, asg.id, name, eid, name)} />
      </div>

      {/* submit a link */}
      <div style={{ marginTop: 16 }}>
        {closed ? (
          <Muted style={{ color: TEXT_SECONDARY }}>Submissions closed{asg.closeAt ? " · " + fmtClose(asg.closeAt) : ""}.</Muted>
        ) : adding || !hasSubmitted ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={label}>Submit a link</div>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="Paste a link (Google Doc, video, ...)" style={inputStyle} />
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note with your link (optional)" style={{ ...inputStyle, minHeight: 64, lineHeight: 1.5, resize: "vertical" }} />
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
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Ask a question or leave a note for your instructor" style={{ ...inputStyle, minHeight: 64, lineHeight: 1.5, resize: "vertical", marginTop: 8 }} />
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
      <div style={{ ...h2, marginBottom: 12 }}>Assignments</div>
      <div style={{ display: "flex", gap: 4, background: BG, padding: 3, borderRadius: 999, border: "1px solid " + BORDER, width: "fit-content", marginBottom: 16 }}>
        {[["grade", "To grade"], ["manage", "Manage"]].map(([k, lbl]) => (
          <span key={k} onClick={() => setView(k)}
            style={{ fontSize: 14, fontWeight: 600, padding: "8px 16px", borderRadius: 999, cursor: "pointer", background: view === k ? a : "transparent", color: view === k ? "#fff" : TEXT_SECONDARY }}>{lbl}</span>
        ))}
      </div>
      {view === "grade"
        ? <GradeHub config={config} data={data} assignments={assignments} onStart={setQueue} />
        : <ManageAssignments config={config} data={data} assignments={assignments} writeAssignments={writeAssignments} />}
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
          <div style={{ fontSize: 14, fontWeight: 700, color: "#b45309" }}>Reminders</div>
          {needInstructions.map(x => <div key={x.id} style={{ fontSize: 14, color: "#92400e", marginTop: 4 }}>Post instructions for {x.title}</div>)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
        <div><span style={{ fontSize: 22, fontWeight: 700, color: a }}>{all.length}</span> <span style={{ color: TEXT_SECONDARY }}>to grade</span></div>
        {all.length > 0 && <Btn accent={a} onClick={() => onStart(all)}>Grade all</Btn>}
      </div>
      <Muted style={{ marginBottom: 8 }}>Tap an assignment to open its full roster (review or regrade anyone), or Grade (N) for just the ungraded.</Muted>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {assignments.map(asg => {
          const total = Object.keys(data?.assignmentLog?.[asg.id] || {}).filter(n => logOf(data, asg.id, n).some(e => e.type === "submission")).length;
          const ungraded = ungradedQueue(assignments, data, asg.id);
          const roster = (config.students || []).map(s => ({ aid: asg.id, name: s.name }));
          return (
            <div key={asg.id} style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, overflow: "hidden" }}>
              <button onClick={() => onStart(roster)} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: F, padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{asg.title}</div>
                <Muted>{total} submitted · {ungraded.length} to grade</Muted>
              </button>
              {ungraded.length > 0 && <div style={{ paddingRight: 14, flexShrink: 0 }}><Btn accent={a} ghost onClick={() => onStart(ungraded)}>Grade ({ungraded.length})</Btn></div>}
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
        <Btn accent={a} onClick={onExit}>Back to assignments</Btn>
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
        <div style={{ fontSize: 14, color: TEXT_MUTED }}>{i + 1} of {queue.length}</div>
      </div>
      <GradeForm key={aid + "|" + name} config={config} asg={asg} name={name} log={log} draftHtml={draft} onDraft={saveDraft} onSubmit={submit} onSkip={() => setI(i + 1)}
        onLike={(eid) => appreciate(update, aid, name, eid, "instructor")} onDelete={(eid) => deleteEvent(update, aid, name, eid)} />
    </div>
  );
}

const CANT_ACCESS_HTML = "<i>I cannot access your link. This assignment currently is scored as a 0. Please resubmit within 24 hours for credit.</i>";

function GradeForm({ config, asg, name, log, draftHtml, onDraft, onSubmit, onSkip, onLike, onDelete }) {
  const a = config.accent;
  const hasRubric = (asg?.rubric || []).length > 0;
  const prev = currentGrade(log);
  const [rubric, setRubric] = useState(() => { const r = {}; (asg?.rubric || []).forEach(c => { r[c.id] = prev?.rubric?.[c.id] ?? ""; }); return r; });
  const [scoreDraft, setScoreDraft] = useState(prev && !hasRubric ? String(prev.score) : "");
  const editorRef = useRef(null);

  const rubricScore = (asg?.rubric || []).reduce((s, c) => s + (Number(rubric[c.id]) || 0), 0);

  const buildGrade = () => (hasRubric || scoreDraft !== "")
    ? { score: hasRubric ? rubricScore : (Number(scoreDraft) || 0), rubric: hasRubric ? Object.fromEntries(Object.entries(rubric).map(([k, v]) => [k, Number(v) || 0])) : null }
    : null;
  const currentComment = () => { const html = editorRef.current?.innerHTML || ""; return html.replace(/<[^>]*>/g, "").trim() ? html : null; };

  const doSubmit = (advance) => {
    onSubmit({ grade: buildGrade(), commentHtml: currentComment(), advance });
    if (!advance && editorRef.current) editorRef.current.innerHTML = "";
  };
  const cantAccess = () => {
    const grade = { score: 0, rubric: hasRubric ? Object.fromEntries(asg.rubric.map(c => [c.id, 0])) : null };
    onSubmit({ grade, commentHtml: CANT_ACCESS_HTML, advance: true });
  };

  return (
    <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 16, padding: 18 }}>
      <div style={label}>{asg?.title} · {asg?.weight}%</div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{name}</div>
      {prev && <div style={{ fontSize: 14, fontWeight: 600, color: a, marginTop: 2 }}>Current grade: {prev.score}/100 — change it below and Submit</div>}

      <div style={{ marginTop: 14 }}><AssignmentLog asg={asg} log={log} accent={a} studentName={name} actor="instructor" onLike={onLike} onDelete={onDelete} /></div>

      {hasRubric ? (
        <div style={{ marginTop: 16 }}>
          <div style={label}>Rubric</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {asg.rubric.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, fontSize: 15 }}>{c.name}</div>
                <input type="number" min="0" max={c.points} value={rubric[c.id]} onChange={e => setRubric(r => ({ ...r, [c.id]: e.target.value }))} style={{ ...inputStyle, width: 80, minHeight: 40, textAlign: "right" }} />
                <div style={{ width: 44, fontSize: 14, color: TEXT_MUTED }}>/ {c.points}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700, color: a }}>Score: {rubricScore}/100</div>
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

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Btn accent={a} onClick={() => doSubmit(true)}>Submit & next</Btn>
        <Btn accent={a} ghost onClick={() => doSubmit(false)}>Submit</Btn>
        <Btn accent={a} ghost onClick={onSkip}>Skip</Btn>
      </div>
      <button onClick={cantAccess} style={{ marginTop: 12, minHeight: TAP, padding: "0 16px", borderRadius: 10, border: "1px solid #fca5a5", background: "#fff", color: "#dc2626", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        Can't access link → 0 + resubmit notice
      </button>
    </div>
  );
}

function RichEditor({ editorRef, initialHtml, onDraft }) {
  const timer = useRef(null);
  const cmd = (c, v) => document.execCommand(c, false, v);
  const flush = () => { if (onDraft && editorRef.current) onDraft(editorRef.current.innerHTML); };
  const onInput = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(flush, 600); };
  const tb = { minHeight: 36, minWidth: 40, borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: "#fff", cursor: "pointer", fontFamily: F, fontSize: 15 };
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button onMouseDown={e => e.preventDefault()} onClick={() => cmd("bold")} style={{ ...tb, fontWeight: 800 }}>B</button>
        <button onMouseDown={e => e.preventDefault()} onClick={() => cmd("italic")} style={{ ...tb, fontStyle: "italic" }}>I</button>
        <button onMouseDown={e => e.preventDefault()} onClick={() => { const u = prompt("Link URL"); if (u) cmd("createLink", u); }} style={{ ...tb, fontWeight: 600 }}>Link</button>
      </div>
      <div contentEditable ref={editorRef} suppressContentEditableWarning onInput={onInput} onBlur={flush}
        dangerouslySetInnerHTML={{ __html: initialHtml || "" }}
        style={{ ...inputStyle, minHeight: 100, lineHeight: 1.5, padding: 12, textAlign: "left" }} />
    </div>
  );
}

function ManageAssignments({ config, data, assignments, writeAssignments }) {
  const a = config.accent;
  const [editing, setEditing] = useState(null);

  if (editing) {
    const asg = editing === "new" ? null : assignments.find(x => x.id === editing);
    return <AssignmentEditor config={config} asg={asg}
      onCancel={() => setEditing(null)}
      onSave={(next) => { writeAssignments(list => asg ? list.map(x => x.id === asg.id ? next : x) : [...list, next]); setEditing(null); }}
      onDelete={asg ? () => { writeAssignments(list => list.filter(x => x.id !== asg.id)); setEditing(null); } : null} />;
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {assignments.map(asg => (
          <button key={asg.id} onClick={() => setEditing(asg.id)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", background: "#fff", border: "1px solid " + BORDER, borderRadius: 12, padding: 14, cursor: "pointer", fontFamily: F, minHeight: TAP }}>
            <div><div style={{ fontWeight: 600, fontSize: 16 }}>{asg.title}</div><Muted>Due {asg.due} · {asg.weight}% · {asg.rubric?.length ? asg.rubric.length + " criteria" : "free-form"}</Muted></div>
            <span style={{ color: a, fontSize: 14, fontWeight: 600 }}>Edit</span>
          </button>
        ))}
      </div>
      <button onClick={() => setEditing("new")} style={{ marginTop: 12, minHeight: TAP, padding: "0 18px", borderRadius: 999, border: "1px dashed " + BORDER_STRONG, background: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY, cursor: "pointer" }}>+ Add assignment</button>
    </div>
  );
}

function AssignmentEditor({ config, asg, onSave, onCancel, onDelete }) {
  const a = config.accent;
  const [title, setTitle] = useState(asg?.title || "");
  const [due, setDue] = useState(asg?.due || "");
  const [weight, setWeight] = useState(asg?.weight != null ? String(asg.weight) : "");
  const [description, setDescription] = useState(asg?.description || "");
  const [instructionsUrl, setInstructionsUrl] = useState(asg?.instructionsUrl || "");
  const [closeAt, setCloseAt] = useState(asg?.closeAt || "");
  const [rubric, setRubric] = useState(asg?.rubric || []);

  const setCrit = (id, field, val) => setRubric(r => r.map(c => c.id === id ? { ...c, [field]: val } : c));
  const rubricTotal = rubric.reduce((s, c) => s + (Number(c.points) || 0), 0);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: asg?.id || genId(), title: title.trim(), due: due.trim(), weight: Number(weight) || 0,
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
        <div style={{ width: 120 }}><div style={fieldL}>Weight %</div><input type="number" min="0" value={weight} onChange={e => setWeight(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} /></div>
      </div>
      <div style={fieldL}>Short description</div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 64, lineHeight: 1.5, resize: "vertical", marginTop: 6 }} />
      <div style={fieldL}>Instructions link</div>
      <input value={instructionsUrl} onChange={e => setInstructionsUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, marginTop: 6 }} />
      <div style={fieldL}>Submissions close (optional)</div>
      <input type="datetime-local" value={closeAt} onChange={e => setCloseAt(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
      <Muted style={{ marginTop: 6 }}>After this time students can't submit (they can still comment).</Muted>

      <div style={{ ...fieldL }}>Rubric {rubric.length > 0 && "(" + rubricTotal + "/100)"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {rubric.map(c => (
          <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={c.name} onChange={e => setCrit(c.id, "name", e.target.value)} placeholder="Criterion" style={{ ...inputStyle, flex: 1, minHeight: 40 }} />
            <input type="number" min="0" value={c.points} onChange={e => setCrit(c.id, "points", e.target.value)} style={{ ...inputStyle, width: 80, minHeight: 40, textAlign: "right" }} />
            <button onClick={() => setRubric(r => r.filter(x => x.id !== c.id))} style={{ minHeight: 40, minWidth: 40, borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_MUTED, cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => setRubric(r => [...r, { id: genId(), name: "", points: 0 }])} style={{ marginTop: 8, background: "none", border: "none", color: a, fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}>+ Add criterion</button>
      <Muted style={{ marginTop: 6 }}>Leave the rubric empty to grade free-form (just a score out of 100).</Muted>

      <div style={{ display: "flex", gap: 8, marginTop: 18, alignItems: "center" }}>
        <Btn accent={a} onClick={save} disabled={!title.trim()}>Save</Btn>
        {onDelete && <button onClick={onDelete} style={{ minHeight: TAP, padding: "0 16px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "#fff", color: "#dc2626", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Delete</button>}
      </div>
    </div>
  );
}
