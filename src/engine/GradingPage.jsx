// To Grade: what needs grading, every class together, oldest due date first.
// The first tab of the Grades portal (GradesPortal.jsx).
//
// Andrew, 2026-11-03: "i want to grade stuff for my classes. let's go in
// chrono order. what assignments need grading? also this should be a page
// for me, with beautiful UI." A row is an assignment; pressing it opens
// Grade Flow on that assignment, inside the portal.
//
// "To grade" is the rule the instructor home already uses (waitingOn in
// AssignmentsCard.jsx): a submission, a worksheet hand-in, a check-in or a
// regrade request newer than the last grade. The worksheet hand-ins are laid
// over the log the way every other instructor surface reads them
// (worksheetSubmits.js), so Locker Room and the stakeholder map count. The
// test students and the lurkers are in nobody's count.
//
// The look is the portal's own (portal/style.js): rows on a white page, the
// count that matters in large type, the class as a chip.

import { useEffect, useMemo, useState } from "react";
import { loadClass } from "./store.js";
import { useWorksheetSheets, withWorksheetSubmits } from "./worksheetSubmits.js";
import { assignmentsOf } from "./profileTask.js";
import { inDueOrder, isOngoing } from "./AssignmentCards.jsx";
import { deadlineOf } from "./DueCard.jsx";
import { waitingOn, turnedIn } from "./AssignmentsCard.jsx";
import { boardOf, sortedCount } from "./grades.js";
import { realStudents } from "./sections.js";
import { dueWords } from "./portal/bits.jsx";

/** One class's assignments as queue rows: what is waiting, in, graded, released. */
export function queueOf(config, data) {
  if (!data) return [];
  const assignments = inDueOrder(assignmentsOf(config, data));
  const waiting = waitingOn(data, assignments);
  const students = realStudents(config, data.students || config.students || []);
  return assignments.map(asg => {
    const w = waiting.find(x => x.id === asg.id) || {};
    const board = boardOf(data, asg.id);
    const t = turnedIn(config, data, asg);
    return {
      key: config.id + ":" + asg.id, classId: config.id, code: config.code, accent: config.accent, path: config.path,
      id: asg.id, title: asg.title, due: asg.due, dueTime: asg.dueTime, ongoing: isOngoing(asg),
      at: deadlineOf(asg.due, asg.dueTime) || 0,
      toGrade: w.toGrade || 0, messages: w.messages || 0,
      in: t.in || 0, of: students.length, sorted: sortedCount(board), released: !!board.released,
      href: "/grades/" + config.id + "/flow?a=" + encodeURIComponent(asg.id),
    };
  }).filter(r => !r.ongoing);
}

// One class, loaded and laid over with its worksheet hand-ins, reported up.
// A hook a class, so the page can hold any number of them.
function ClassQueue({ config, onRows }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    loadClass(config.storageKey).then(d => { if (alive) setData(d || {}); }).catch(() => { if (alive) setData({}); });
    return () => { alive = false; };
  }, [config.storageKey]);
  const sheets = useWorksheetSheets(config, data);
  const rows = useMemo(() => data ? queueOf(config, withWorksheetSubmits(data, config, sheets)) : null, [config, data, sheets]);
  useEffect(() => { if (rows) onRows(config.id, rows); }, [config.id, rows, onRows]);
  return null;
}

const whenDue = (r) => r.due ? dueWords(r.due, r.dueTime) : "";

/** The queue. `classes` are the configs to read; `onOpen(classId, assignmentId)` opens Grade Flow. */
export function ToGrade({ classes, onOpen }) {
  const [byClass, setByClass] = useState({});
  const [filter, setFilter] = useState("");
  const onRows = useMemo(() => (id, rows) => setByClass(prev => ({ ...prev, [id]: rows })), []);

  const loaded = classes.every(c => byClass[c.id]);
  const now = Date.now();
  const all = classes.flatMap(c => byClass[c.id] || []).filter(r => !filter || r.classId === filter).sort((a, b) => a.at - b.at);
  const waiting = all.filter(r => r.toGrade);
  const quiet = all.filter(r => !r.toGrade && r.at <= now);
  const ahead = all.filter(r => !r.toGrade && r.at > now);
  const total = waiting.reduce((n, r) => n + r.toGrade, 0);
  const oldest = waiting[0] || null;
  const open = (r) => (e) => { if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); onOpen(r.classId, r.id); };

  return (
    <>
      <style>{CSS}</style>
      {classes.map(c => <ClassQueue key={c.id} config={c} onRows={onRows} />)}
      <div className="gq-head">
        {loaded ? <p className="gq-sum">{total ? <><b>{total}</b> to grade{oldest ? <>, oldest due <b>{whenDue(oldest)}</b></> : null}</> : "Nothing to grade"}</p> : null}
        <div className="pt-chips">
          <button type="button" className={"pt-chip pt-focus" + (!filter ? " on" : "")} onClick={() => setFilter("")}>All</button>
          {classes.map(c => <button key={c.id} type="button" className={"pt-chip pt-focus" + (filter === c.id ? " on" : "")} onClick={() => setFilter(c.id)}>{c.code}</button>)}
        </div>
      </div>
      {loaded ? (
        <div className="pt-body">
          {waiting.map(r => (
            <a key={r.key} className="pt-row link due gq-row pt-focus" href={r.href} onClick={open(r)}>
              <div className="gq-n"><span className="pt-tileN">{r.toGrade}</span><span className="gq-nl">to grade</span></div>
              <div className="pt-main">
                <p className="pt-title"><span className="gq-code" style={{ color: r.accent }}>{r.code}</span>{r.title}</p>
                <p className="pt-when due"><span>Due {whenDue(r)}</span></p>
                <p className="pt-meta"><span>{r.in + " of " + r.of + " in"}</span><span>·</span><span>{r.sorted + " sorted"}</span><span>·</span><span>{r.released ? "Released" : "Not released"}</span>{r.messages ? <><span>·</span><span>{r.messages + (r.messages === 1 ? " message" : " messages")}</span></> : null}</p>
              </div>
              <div className="pt-side"><span className="pt-io go" style={{ background: r.accent }}>Grade</span></div>
            </a>
          ))}
          {quiet.map(r => (
            <a key={r.key} className="pt-row link done gq-row gq-quiet pt-focus" href={r.href} onClick={open(r)}>
              <div className="pt-main">
                <p className="pt-title"><span className="gq-code" style={{ color: r.accent }}>{r.code}</span>{r.title}</p>
              </div>
              <p className="pt-meta"><span>{whenDue(r)}</span><span>·</span><span>{r.in + " of " + r.of + " in"}</span><span>·</span><span>{r.released ? "Released" : r.sorted ? r.sorted + " sorted" : "Nothing in"}</span></p>
            </a>
          ))}
          {ahead.length ? <div className="gq-rule" /> : null}
          {ahead.map(r => (
            <a key={r.key} className="pt-row link off gq-row gq-quiet pt-focus" href={r.href} onClick={open(r)}>
              <div className="pt-main">
                <p className="pt-title"><span className="gq-code">{r.code}</span>{r.title}</p>
              </div>
              <p className="pt-meta"><span>Due {whenDue(r)}</span>{r.in ? <><span>·</span><span>{r.in + " of " + r.of + " in"}</span></> : null}</p>
            </a>
          ))}
        </div>
      ) : null}
    </>
  );
}

const CSS = `
.gq-head{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:space-between}
.gq-sum{margin:0;font-size:16px;color:var(--text-secondary)}
.gq-sum b{color:var(--text-primary);font-weight:700}
.gq-row{text-decoration:none;color:inherit}
.gq-row:hover{box-shadow:inset 0 0 0 2px var(--line-strong)}
.gq-n{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none;width:84px;gap:0}
.gq-n .pt-tileN{font-size:40px;line-height:1;font-weight:700;color:var(--pt-due-ink)}
.gq-nl{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--pt-due-ink)}
.gq-code{display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-right:10px;vertical-align:2px}
.gq-quiet{padding:10px 16px}
.gq-quiet .pt-title{font-size:15px;font-weight:500}
.gq-quiet .pt-meta{flex:none}
.gq-rule{height:1px;background:var(--line-soft);margin:6px 0}
@media (max-width:560px){.gq-n{width:64px}.gq-n .pt-tileN{font-size:32px}.gq-quiet{flex-wrap:wrap}}
`;
