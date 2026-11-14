// One student, whole: /<class>/student/<id>. The instructor's.
//
// Andrew, 2026-10-29: "a beautiful profile, a page for every student. So,
// when I click on their name, make it kind of full screen here and it has
// their image, it has, like, all the notes they filled in before at the
// start of the class. It also has their week 4 check in notes. And then I
// want you to tell me how they're doing on every assignment. And I want you
// to tell me how I've graded it as well. And the comments there too, and
// make it really pretty. like make it with cards ... I should be able to
// click on any assignment and it takes me directly to the assignment that
// they worked on ... when I click on the student's visual story, I should
// see everyone's comments on that story."
//
// Everything here is read from what the other screens already keep: the
// profile and the check-ins on the class row, the grade board and the
// assignment log for grades, comments and links, the submitted worksheets
// laid over the log (worksheetSubmits.js), a page assignment's Google Doc
// from its sheet (api/worksheet-submits), and the story and its comments
// from api/visual-story's admin feed. Nothing is written here. The labels
// are the ones the student saw on the profile task and the check-in, and
// the assignments' own titles. The AI summary he mentioned is for later.

import { readingsRow, readingsFor } from "./takeover/engine.js";
import { mergedView } from "./store.js";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import StudentPeek from "./StudentPeek.jsx";
import { useClassData } from "./store.js";
import { usePhotos, useWithPhotos } from "./photos.js";
import { useWithWorksheetSubmits } from "./worksheetSubmits.js";
import { assignmentsOf, isProfileTask } from "./profileTask.js";
import { inDueOrder, statusOf } from "./AssignmentCards.jsx";
import { computeGrade } from "./AssignmentsCard.jsx";
import { rosterOf, findStudent, nameShown, idOf } from "./roster.js";
import { sectionOf } from "./sections.js";
import { boardOf, bucketOf, bucketsFor, signOf, alive, htmlToText, letterOf, placeCard, writeCard, releasePatch, releaseStateOf } from "./grades.js";
import { Reopen, canReopen } from "./Reopen.jsx";
import { Linked } from "./linkText.jsx";
import { isCheckin, checkinTasksOf, CHECKIN_QUESTIONS, answersOf } from "./checkins.js";
import { hasPage, sheetKeyOf } from "./submissionPages.js";
import { Avatar, profileOf } from "./Face.jsx";
import { ThemeStyle } from "./ThemeShell.jsx";
import { PORTAL_CSS } from "./portal/style.js";
import { authHeaders, getSession } from "./session.js";
import { savedPin, useInstructor } from "../InstructorGate.jsx";
import { schedulingLinkOf, isInstructorEmail } from "../instructors.js";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;

// The profile questions, as the student read them on the You card.
const PROFILE_FIELDS = [
  ["about", "About me"],
  ["motto", "Motto"],
  ["goals", "Goals for the class"],
  ["strength", "What would you say is your biggest strength as a student?"],
  ["priority", "What matters to you most?"],
];

const when = (ts) => { try { return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
const day = (ts) => { try { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return ""; } };
const lower = (s) => String(s || "").trim().toLowerCase();

/** The address of one student's page. */
export const studentHref = (config, student) => config.path + "/student/" + encodeURIComponent(idOf(student));

/**
 * A student's name as the link to their page, wherever a name is printed
 * for the instructor. Andrew, 2026-10-29: "be able to click on a student's
 * name anywhere to take me to their page." student is a roster entry or a
 * name; the words are the children, or the name.
 */
// `plain`: no underline on hover, for a link that is a whole card or row.
export function StudentLink({ config, student, children, className, style, plain = false }) {
  // The name they go by, off their profile, the way every surface that shows people reads it (roster.js shownName).
  const data = mergedView(config.storageKey);
  const name = typeof student === "string" ? student : student?.name || "";
  const who = nameShown(data, name);
  // A press opens the student in the popup over the page he is on (StudentPeek.jsx);
  // the address is still their page, for a new tab. Andrew, 2026-11-13, asked
  // whether names on Grades and the roster should open the popup too: "yes."
  // The popup is drawn on the body, and what happens in it stays in it, so a
  // press inside never reaches the row or card the name sits in.
  //
  // Only for him. A student sees these names too (Classmates), and for a
  // student the press must stay what it was, a link to a page behind the
  // instructor gate. So the popup opens only in a browser that carries an
  // instructor session or the PIN, and PeekGate checks that for real, the
  // way the gate does, before anything is drawn.
  const [peek, setPeek] = useState(false);
  const stop = (e) => e.stopPropagation();
  const maybeHis = () => { try { return isInstructorEmail(getSession()?.user?.email) || !!savedPin(); } catch { return false; } };
  return (
    <>
      <a href={studentHref(config, student)} className={className} style={{ color: "inherit", textDecoration: "none", ...(style || {}) }}
        onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1 || !maybeHis()) return; e.preventDefault(); e.stopPropagation(); setPeek(true); }}
        onMouseEnter={plain ? undefined : e => { e.currentTarget.style.textDecoration = "underline"; }} onMouseLeave={plain ? undefined : e => { e.currentTarget.style.textDecoration = "none"; }}>{children ?? who}</a>
      {peek && typeof document !== "undefined" ? createPortal(
        <div onClick={stop} onMouseDown={stop} onMouseUp={stop} onKeyDown={stop} onKeyUp={stop} onPointerDown={stop} onDragStart={stop}>
          <PeekGate href={studentHref(config, student)} onClose={() => setPeek(false)}><StudentPeek config={config} data={data} name={name} onClose={() => setPeek(false)} /></PeekGate>
        </div>, document.body) : null}
    </>
  );
}

// The popup, once the browser is known to be the instructor's. Anyone else is
// sent to the student's page, where the gate asks who they are.
function PeekGate({ href, onClose, children }) {
  const { ok } = useInstructor();
  useEffect(() => { if (ok === false) { onClose(); window.location.assign(href); } }, [ok]);   // eslint-disable-line react-hooks/exhaustive-deps
  return ok === true ? children : null;
}

// The story assignment points at /<class>/visual-story, not at a worksheet.
const isStory = (asg, config) => /\/visual-story\/?$/.test(String(asg?.instructionsUrl || "").replace(/[?#].*$/, "")) || String(asg?.id || "") === "visual-story";

/** What one student did on one assignment, in the grade view's words. */
export function recordOf(config, data, asg, name) {
  const st = statusOf(config, data, asg, name, new Set());
  const log = alive(data?.assignmentLog?.[asg.id]?.[name]);
  const subs = log.filter(e => e.type === "submission");
  const linked = [...subs, ...log.filter(e => e.type === "regrade")].sort((x, y) => (y.ts || 0) - (x.ts || 0)).find(e => e.link) || null;
  const board = boardOf(data, asg.id);
  const card = board.cards?.[name] || null;
  const pending = !st.letter && card?.bucket ? bucketOf(card.bucket) : null;
  const thread = log.filter(e => e.type === "comment").map(e => ({ id: e.id, at: e.ts, mine: e.from !== "student", text: htmlToText(e.html || e.text) })).filter(c => c.text);
  const turnedIn = st.first ? st.first.ts : st.last ? st.last.ts : null;
  const status = asg.submission === "none" ? ""
    : turnedIn ? "Turned in " + when(turnedIn) + (st.late ? " · " + st.lateText : "")
    : st.state === "missed" ? "Not turned in"
    : st.state === "open" ? "Open" : st.state === "ongoing" ? "Ongoing" : "";
  return { st, link: linked?.link || "", card, pending, released: !!board.released, thread, status, late: !!st.late || st.state === "missed" };
}

// The grade on one challenge, changed from the popup: the column, the sign
// and the comment, the same three things a card holds in Grade Flow, written
// the same way (placeCard, writeCard). Save sorts the card and sends nothing.
// Save and release is offered only on a board that is already released and
// where nobody else has a change waiting, because a release sends every
// waiting card on the board, and from here that must be this student's alone.
function GradeEdit({ config, data, asg, name, update, onClose }) {
  const board = boardOf(data, asg.id);
  const card = board.cards?.[name] || {};
  const [bucket, setBucket] = useState(card.bucket || "");
  const [sign, setSign] = useState(signOf(card));
  const [comment, setComment] = useState(card.comment || "");
  const b = bucketOf(bucket);
  const signed = !!b && /^[A-D]$/.test(b.letter);
  const logs = data?.assignmentLog?.[asg.id] || {};
  const others = [...new Set([...Object.keys(board.cards || {}), ...Object.keys(logs)])].filter(n => n !== name)
    .some(n => { const s = releaseStateOf(board, logs[n], n); return s === "new" || s === "changed" || s === "withdrawn"; });
  const save = (send) => {
    update(prev => {
      const next = placeCard(writeCard(prev, asg.id, name, { comment, sign: signed ? sign : "" }), asg.id, name, bucket || null);
      return send ? releasePatch(next, asg.id, Date.now(), { meetingLink: schedulingLinkOf(config) }) : next;
    });
    onClose();
  };
  return (
    <div className="sp-edit">
      <div className="sp-acts">
        <select className="sp-btn" value={bucket} aria-label={"Grade, " + asg.title} onChange={e => setBucket(e.target.value)}>
          <option value="">No grade</option>
          {bucketsFor(asg).map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
        </select>
        {signed ? (
          <select className="sp-btn" value={sign} aria-label="Plus or minus" onChange={e => setSign(e.target.value)}>
            <option value="">{b.letter}</option><option value="+">{b.letter + "+"}</option><option value="-">{b.letter + "-"}</option>
          </select>
        ) : null}
      </div>
      <textarea className="sp-box" value={comment} aria-label={"Comment, " + asg.title} onChange={e => setComment(e.target.value)} />
      <div className="sp-acts">
        <button type="button" className="sp-btn" onClick={() => save(false)}>Save</button>
        {board.released && !others ? <button type="button" className="sp-btn sp-go" onClick={() => save(true)}>Save and release</button> : null}
        {board.released && others ? <a className="sp-lnk" href={"/grades/" + config.id + "/flow?a=" + encodeURIComponent(asg.id)}>Grade Flow</a> : null}
        <button type="button" className="sp-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// `embedded`: inside the popup (StudentPeek.jsx), which draws its own bar.
// The challenges come first there, and a challenge's title hands its file
// to onWork instead of opening a tab.
export default function StudentPage({ config, id, embedded = false, onWork }) {
  const [stored, update] = useClassData(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const data = useWithWorksheetSubmits(useWithPhotos(stored, photos), config);
  const [editing, setEditing] = useState("");    // the challenge whose grade is being changed, in the popup
  const [talkOpen, setTalkOpen] = useState(false); // their messages, shown on a press (his rule for private words)
  const roster = useMemo(() => rosterOf(config, data), [config, data]);
  const student = findStudent(roster, id) || findStudent(roster, decodeURIComponent(id));
  const name = student?.name || "";
  const [feed, setFeed] = useState(null);         // the story admin feed, for classes with a story
  const [docLinks, setDocLinks] = useState({});   // a page assignment's Google Doc, from its sheet
  const [readings, setReadings] = useState([]);   // the readings before Locker Room, from the class's readings row
  const assignments = useMemo(() => inDueOrder(assignmentsOf(config, data)).filter(a => !isProfileTask(a)), [config, data]);
  const storyAsg = assignments.find(a => isStory(a, config));
  const pageAsgs = useMemo(() => assignments.filter(a => hasPage(a, config)), [assignments, config]);

  useEffect(() => { if (!embedded) document.title = config.code + " · " + (name || "Student"); }, [config, name, embedded]);
  useEffect(() => {
    const row = readingsRow(config.storageKey);
    const S = typeof window !== "undefined" ? window.storage : null;
    if (!row || !S || !student?.email) return undefined;
    let alive = true;
    S.get(row).then(got => { if (!alive) return; let data = null; try { data = got ? JSON.parse(got.value) : null; } catch { data = null; } setReadings(readingsFor(data, student.email)); }).catch(() => {});
    return () => { alive = false; };
  }, [config.storageKey, student?.email]);

  // The story and every comment on it.
  useEffect(() => {
    if (!storyAsg) return undefined;
    let alive2 = true;
    (async () => {
      try {
        const r = await fetch("/api/visual-story", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), groupKey: config.id, action: "admin" }) });
        const out = await r.json().catch(() => null);
        if (alive2 && out && out.ok) setFeed(out);
      } catch { /* the card shows the link alone */ }
    })();
    return () => { alive2 = false; };
  }, [config.id, storyAsg?.id]);

  // The Google Doc turned in on a page assignment lives on the sheet, not the log.
  useEffect(() => {
    if (!student?.email || !pageAsgs.length) return undefined;
    let alive2 = true;
    (async () => {
      const found = {};
      for (const asg of pageAsgs) {
        try {
          const r = await fetch("/api/worksheet-submits", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), groupKey: config.id, key: sheetKeyOf(config, asg), viewer: lower(student.email) }) });
          const out = await r.json().catch(() => null);
          const link = out && out.ok && out.answers ? (Array.isArray(out.answers) ? (out.answers.find(a => a.field === "link") || {}).value : out.answers.link) : "";
          if (link) found[asg.id] = String(link);
        } catch { /* no link from the sheet */ }
      }
      if (alive2) setDocLinks(found);
    })();
    return () => { alive2 = false; };
  }, [config, student?.email, pageAsgs]);

  const shell = (children) => embedded ? (
    <div className="sp-root sp-in" style={{ color: "var(--text-primary)", fontFamily: F, "--ca-accent": config.accent, "--ca-accent-ink": config.accent }}>
      <style>{CSS}</style>
      <div className="sp">{children}</div>
    </div>
  ) : (
    <div data-theme="clean" className="ca-root sp-root" style={{ minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: F, "--ca-accent": config.accent, "--ca-accent-ink": config.accent }}>
      <ThemeStyle theme="clean" />
      <style>{PORTAL_CSS}{CSS}</style>
      <div className="sp">{children}</div>
    </div>
  );
  if (stored === null) return shell(<p className="sp-quiet">Loading.</p>);
  if (!student) return shell(<p className="sp-quiet">There is no student {id} on the {config.code} roster.</p>);

  const p = profileOf(data, name);
  const shown = nameShown(data, name);
  const section = sectionOf(student);
  const standing = computeGrade(config, data, name);
  const checkins = checkinTasksOf(config, data).map(c => ({ asg: c, answers: answersOf(data, c.id, name) })).filter(c => c.answers);
  const myStory = feed && student.email ? (feed.stories || []).find(s => lower(s.email) === lower(student.email)) : null;
  const myComments = myStory ? (feed.comments || []).filter(c => c.story === myStory.id && lower(c.authorEmail) !== lower(student.email)) : [];
  const back = () => { if (window.history.length > 1) window.history.back(); else window.location.assign("/grades/" + config.id + "/summary"); };

  // The profile answers: in the top card on the page, a card of their own under the challenges in the popup.
  const answered = PROFILE_FIELDS.filter(([k]) => String(p[k] || "").trim());
  const fields = answered.length ? (
    <dl className="sp-fields">
      {answered.map(([k, label]) => <div key={k} className="sp-field"><dt>{label}</dt><dd>{p[k]}</dd></div>)}
    </dl>
  ) : null;

  const talk = (data?.threads?.[name] || []).filter(m => !m.deleted && (m.text || m.kind === "got_it" || m.kind === "meeting"));

  return shell(
    <>
      {embedded ? null : (
        <div className="sp-nav">
          <button type="button" className="sp-btn sp-back" onClick={back}>{"‹ Back"}</button>
          <a className="sp-lnk" href={"/grades/" + config.id + "/summary"}>Grades</a>
        </div>
      )}

      <section className="sp-card sp-hero">
        <Avatar profile={p} name={shown} accent={config.accent} size={embedded ? 96 : 168} />
        <div className="sp-who">
          <h1 className="sp-name">{shown}</h1>
          <p className="sp-meta">{[student.email || p.email, section, [p.year, p.hometown].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</p>
          {standing.pct != null ? <p className="sp-meta"><b>{letterOf(standing.pct)}</b> so far</p> : null}
        </div>
        {embedded ? null : fields}
      </section>
      {embedded && fields ? <section className="sp-card">{fields}</section> : null}
      {embedded && talk.length ? (
        <section className="sp-card">
          <div className="sp-acts"><button type="button" className="sp-btn" aria-expanded={talkOpen} onClick={() => setTalkOpen(v => !v)}>{"Messages · " + talk.length}</button></div>
          {talkOpen ? (
            <div className="sp-thread">
              {talk.map(m => <p key={m.id} className={"sp-msg" + (m.from === "instructor" ? " mine" : "")}><b>{m.from === "instructor" ? "You" : shown}</b> <span className="sp-when">{when(m.ts)}</span><br /><Linked text={m.text || (m.kind === "got_it" ? "Thumbs up" : m.kind === "meeting" ? "Make a meeting" : "")} /></p>)}
            </div>
          ) : null}
        </section>
      ) : null}

      {checkins.map(({ asg, answers }) => (
        <section key={asg.id} className="sp-card">
          <h2 className="sp-h2"><a href={config.path + "/checkins?w=" + asg.week + "&s=" + encodeURIComponent(name)}>{asg.title}</a> <span className="sp-when">{answers.at ? when(answers.at) : ""}</span></h2>
          <dl className="sp-fields">
            {CHECKIN_QUESTIONS.filter(q => String(answers[q.id] || "").trim()).map(q => <div key={q.id} className="sp-field"><dt>{q.text}</dt><dd>{answers[q.id]}</dd></div>)}
          </dl>
        </section>
      ))}

      {readings.length ? (
        <section className="sp-card">
          <h2 className="sp-h2">Readings for Locker Room</h2>
          <ul className="sp-reads">
            {readings.map(r => <li key={r.id}>{r.url ? <a href={r.url} target="_blank" rel="noopener">{r.title}</a> : r.title}{r.source ? <span className="sp-when">{" · " + r.source}</span> : null}</li>)}
          </ul>
        </section>
      ) : null}

      <div className="sp-grid">
        {assignments.filter(a => !isCheckin(a)).map(asg => {
          const r = recordOf(config, data, asg, name);
          const story = isStory(asg, config);
          const href = story && myStory ? config.path + "/stories?s=" + encodeURIComponent(myStory.id) : docLinks[asg.id] || r.link || "";
          const grade = r.st.letter || (r.pending ? r.pending.letter : "");
          const comment = r.st.letter ? r.st.comments[0] : r.card?.comment;
          // A grade that did not come off the board (an older one, put in by hand) is not changed from here.
          const canGrade = asg.submission !== "none" && r.st.state !== "ongoing" && (!r.st.letter || !!r.card?.bucket);
          return (
            <section key={asg.id} className={"sp-card sp-asg" + (r.late ? " late" : "")}>
              <h2 className="sp-h2">{href && embedded && onWork ? <button type="button" onClick={() => onWork({ href, title: asg.title })}>{asg.title}</button> : href ? <a href={href} target="_blank" rel="noopener">{asg.title}</a> : asg.title}</h2>
              <p className="sp-meta">{"Due " + asg.due + (asg.dueTime ? " " + asg.dueTime : "") + (asg.weight ? " · " + asg.weight + "%" : "")}</p>
              {r.status ? <p className={"sp-status" + (r.late ? " late" : "")}>{r.status}</p> : null}
              {grade ? <p className="sp-grade"><b>{grade}</b>{r.pending ? <span className="sp-chip">not released</span> : null}</p> : null}
              {comment && editing !== asg.id ? <p className="sp-comment">{comment}</p> : null}
              {embedded && editing === asg.id ? <GradeEdit config={config} data={data} asg={asg} name={name} update={update} onClose={() => setEditing("")} /> : null}
              {embedded && editing !== asg.id && (canGrade || canReopen(config, asg, student)) ? (
                <div className="sp-acts">
                  {canGrade ? <button type="button" className="sp-btn" onClick={() => setEditing(asg.id)}>{grade ? "Change grade" : "Grade"}</button> : null}
                  <Reopen config={config} asg={asg} student={student} className="sp-btn" />
                </div>
              ) : null}
              {r.card?.note ? <p className="sp-note"><span className="sp-k">Your note</span>{r.card.note}</p> : null}
              {r.thread.length ? (
                <div className="sp-thread">
                  {r.thread.map(c => <p key={c.id} className={"sp-msg" + (c.mine ? " mine" : "")}><b>{c.mine ? "You" : shown}</b> <span className="sp-when">{day(c.at)}</span><br />{c.text}</p>)}
                </div>
              ) : null}
              {story && myStory ? (
                <div className="sp-thread">
                  {myStory.headline ? <p className="sp-meta">{myStory.headline}</p> : null}
                  {myComments.map((c, i) => (
                    <p key={i} className="sp-msg">
                      <b>{c.author}</b> <span className="sp-when">{c.updated_at ? day(c.updated_at) : ""}</span>
                      {[c.best, c.shone, c.encourage].filter(Boolean).map((t, j) => <span key={j}><br />{t}</span>)}
                      {c.bestPicture ? <span><br />{"Best picture: " + c.bestPicture + (c.bestWhere ? ", " + c.bestWhere : "")}</span> : null}
                    </p>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}

const CSS = `
.sp-root{font-size:16px}
.sp-quiet{margin:0;padding:24px 16px;font-size:16px;color:var(--text-secondary)}
.sp-btn{font:inherit;font-size:15px;font-weight:600;color:var(--text-primary);background:var(--surface-card);border:1px solid var(--line-strong);border-radius:999px;padding:6px 14px;min-height:34px;cursor:pointer}
.sp-lnk{font-size:15px;font-weight:600;color:var(--ca-accent-ink);text-decoration:none}
.sp-lnk:hover{text-decoration:underline}
.sp{max-width:1080px;margin:0 auto;padding:20px 16px 96px;display:flex;flex-direction:column;gap:18px}
.sp-nav{display:flex;justify-content:space-between;align-items:center;gap:12px}
.sp-back{font:inherit;font-size:15px;font-weight:600}
.sp-card{background:var(--surface-card);border:1px solid var(--line-soft);border-radius:18px;padding:20px 22px;display:flex;flex-direction:column;gap:10px;min-width:0}
.sp-hero{display:grid;grid-template-columns:auto 1fr;grid-template-areas:"face who" "fields fields";gap:16px 24px;align-items:center}
.sp-hero>:first-child{grid-area:face}
.sp-who{grid-area:who;display:flex;flex-direction:column;gap:6px;min-width:0}
.sp-name{margin:0;font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1.1}
.sp-meta{margin:0;font-size:15px;color:var(--text-secondary);overflow-wrap:anywhere}
.sp-fields{grid-area:fields;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px 28px}
.sp-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.sp-field dt{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.sp-field dd{margin:0;font-size:16px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.sp-reads{margin:0;padding-left:22px;display:grid;gap:6px;font-size:15.5px;line-height:1.5}
.sp-h2{margin:0;font-size:20px;font-weight:700;letter-spacing:-.01em;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.sp-h2 a{color:var(--ca-accent-ink);text-decoration:none}
.sp-h2 a:hover{text-decoration:underline}
.sp-h2 button{font:inherit;letter-spacing:inherit;color:var(--ca-accent-ink);background:none;border:0;padding:0;text-align:left;cursor:pointer}
.sp-h2 button:hover{text-decoration:underline}
.sp-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.sp-edit{display:flex;flex-direction:column;gap:10px}
.sp-box{font:inherit;font-size:15.5px;line-height:1.5;min-height:140px;resize:vertical;padding:10px 12px;border-radius:12px;border:1px solid var(--line-strong);background:var(--surface-card);color:var(--text-primary)}
.sp-btn.sp-go{background:var(--text-primary);color:var(--surface-card);border-color:var(--text-primary)}
.sp-btn:disabled{opacity:.5}
.sp-in .sp{max-width:none;padding:0}
.sp-in .sp-hero{order:-2}
.sp-in .sp-grid{order:-1}
.sp-in .sp-name{font-size:28px}
.sp-when{font-size:13px;color:var(--text-muted);font-weight:400}
.sp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;align-items:start}
.sp-asg.late{border-color:var(--state-late)}
.sp-status{margin:0;font-size:14px;color:var(--text-secondary)}
.sp-status.late{color:var(--state-late);font-weight:600}
.sp-grade{margin:0;font-size:22px;display:flex;align-items:center;gap:10px}
.sp-chip{font-size:12px;font-weight:600;color:var(--text-muted);border:1px solid var(--line-strong);border-radius:999px;padding:2px 9px}
.sp-comment{margin:0;font-size:15.5px;line-height:1.5;white-space:pre-wrap}
.sp-note{margin:0;font-size:14.5px;line-height:1.5;white-space:pre-wrap;background:var(--surface-sunk);border-radius:10px;padding:10px 12px}
.sp-k{display:block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px}
.sp-thread{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line-soft);padding-top:10px}
.sp-msg{margin:0;font-size:14.5px;line-height:1.5;white-space:pre-wrap}
.sp-msg.mine b{color:var(--ca-accent-ink)}
@media (max-width:640px){.sp-hero{grid-template-columns:1fr;grid-template-areas:"face" "who" "fields";justify-items:start}.sp-name{font-size:28px}}
`;
