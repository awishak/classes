// The four instructor pages of the Primary Bold mockups, on the site's own data:
// Class home, To Grade, Grade Flow, and Control for one challenge.
//
// docs/primary-bold/BRIEF.md has the rules. The ones that shape this file:
// "Once something is graded, students are ordered by grade, highest to
// lowest, with ties by name", "Late and resubmitted stay hidden until a
// button is pressed", "Bars are one solid full bar", and a click changes only
// what was clicked and its panel.
//
// A grade is written the way Grade Flow writes one today (grades.js:
// placeCard, then releasePatch on Release), so a card placed here is the same
// card on the live grading page. The comment and the private note on a card
// are still written there; Comments and notes opens the live page.

import { useEffect, useMemo, useState } from "react";
import { rosterOf, nameShown } from "../roster.js";
import { realStudents, isHouse, sectionsOf } from "../sections.js";
import { INSTRUCTOR_EMAILS, schedulingLinkOf } from "../../instructors.js";
import { assignmentsOf } from "../profileTask.js";
import { inDueOrder } from "../AssignmentCards.jsx";
import { unanswered } from "../AssignmentsCard.jsx";
import { alive, boardOf, bucketsFor, bucketOf, cardLetter, placeCard, releasePatch, releaseCounts } from "../grades.js";
import { latenessOf } from "../lateness.js";
import { loadClass } from "../store.js";
import { useWorksheetSheets, withWorksheetSubmits } from "../worksheetSubmits.js";
import { queueOf } from "../GradingPage.jsx";
import { rowOf, controlHref } from "../ControlPage.jsx";
import { studentHref } from "../StudentPage.jsx";
import { weekWords } from "../portal/StudentHome.jsx";
import { nextClassFacts, followingClassFacts } from "../HomeCards.jsx";
import { kindOf } from "../dayplan.js";
import { dueWords } from "../portal/bits.jsx";
import { currentClasses } from "../../config/registry.js";
import { Face, Cell, Pill, Tile, Stamp, Total } from "./bits.jsx";
import { photoOf } from "./data.js";

const lower = (s) => String(s || "").trim().toLowerCase();
/** The students a count is out of: the roster without the test students and without him. */
const peopleOf = (config, data) => realStudents(config, rosterOf(config, data)).filter(s => !isHouse(s.name) && !INSTRUCTOR_EMAILS.includes(lower(s.email)));
const last = (log, type) => { for (let i = log.length - 1; i >= 0; i--) if (log[i].type === type) return log[i]; return null; };

/** Where one student stands on one challenge for grading: "", "grade" (in, no grade yet) or "again" (in again after the grade). */
function waitOf(data, aid, name) {
  const log = alive(data?.assignmentLog?.[aid]?.[name]);
  const s = [last(log, "submission"), last(log, "regrade")].filter(Boolean).sort((x, y) => y.ts - x.ts)[0], g = last(log, "grade");
  if (!s) return "";
  return !g ? "grade" : s.ts > g.ts ? "again" : "";
}

// ─── Class home ───

/** Class home: the next class, and one row per challenge with the faces of who is waiting on him. */
export function Desk({ config, data, go, toHis }) {
  const [open, setOpen] = useState("");
  const wk = weekWords(config, data);
  const people = useMemo(() => peopleOf(config, data), [config, data]);
  const rows = useMemo(() => {
    const out = [];
    inDueOrder(assignmentsOf(config, data)).forEach(asg => {
      const grade = people.filter(s => waitOf(data, asg.id, s.name) === "grade"), again = people.filter(s => waitOf(data, asg.id, s.name) === "again");
      const said = people.filter(s => unanswered(alive(data?.assignmentLog?.[asg.id]?.[s.name])));
      if (grade.length) out.push({ key: asg.id + ":g", asg, who: grade, say: grade.length + " turned in", color: "due", btn: "Grade" });
      if (again.length) out.push({ key: asg.id + ":a", asg, who: again, say: again.length + " resubmitted", color: "warn", btn: "Grade" });
      if (said.length) out.push({ key: asg.id + ":m", asg, who: said, say: said.length + (said.length === 1 ? " message" : " messages"), color: "c118", btn: "Reply" });
    });
    return out;
  }, [config, data, people]);
  const next = nextClassFacts(config, data, null, "");
  const after = next ? followingClassFacts(config, data, null, "", next.date) : null;
  return <div className="body">
    <div className="rowx"><p className="t1">{wk.n ? "Week " + wk.n : config.code}</p>{wk.range ? <span className="t3">{wk.range}</span> : null}<span className="sp" /><Pill onClick={() => go("flow")}>Class flow</Pill><Pill onClick={() => go("assignments")}>Challenges</Pill></div>
    <div className="main" style={{ gridTemplateColumns: "minmax(0,.8fr) minmax(0,1.2fr)" }}>
      {next ? <div className="hero">
        <p className="t1">{next.weekday}, {next.longDate}</p>
        {next.title ? <p>{next.title}</p> : kindOf((data?.dayPlans || {})[next.date]) === "off" ? <p>No class</p> : null}
        {next.note ? <p className="text">{next.note}</p> : null}
        {after && after.date !== next.date ? <><hr /><p className="t3">{after.weekday}, {after.longDate}{after.title ? ": " + after.title : ""}</p></> : null}
      </div> : <span />}
      <div className="list">
        {rows.length === 0 ? <p className="empty">Nothing is waiting on you.</p> : null}
        {rows.map(r => { const on = open === r.key;
          return <div key={r.key} className={"flow" + (on ? " open" : "")} onClick={() => setOpen(on ? "" : r.key)}>
            {on ? <span /> : <span className="faces">{r.who.slice(0, 5).map(s => <Face key={s.name} name={nameShown(data, s.name)} photo={photoOf(data, s.name)} size="sm" ring={r.color} />)}</span>}
            <span><b>{r.asg.title}</b> <span className="t3">{r.say}</span></span>
            <span onClick={e => e.stopPropagation()}><Pill kind={r.color === "c118" ? "" : "due"} onClick={() => (r.btn === "Reply" ? go("messages") : toHis("grade-flow", r.asg.id))}>{r.btn}</Pill></span>
            {on ? <div className="spread">{r.who.map(s => <Cell key={s.name} name={nameShown(data, s.name)} photo={photoOf(data, s.name)} ring={r.color} />)}</div> : null}
          </div>; })}
      </div>
    </div>
  </div>;
}

// ─── To Grade ───

// One class, loaded with its worksheet hand-ins laid over, the way the live queue reads a class.
function Queue({ config, onRows }) {
  const [data, setData] = useState(null);
  useEffect(() => { let on = true; loadClass(config.storageKey).then(d => { if (on) setData(d || {}); }).catch(() => { if (on) setData({}); }); return () => { on = false; }; }, [config.storageKey]);
  const sheets = useWorksheetSheets(config, data);
  const rows = useMemo(() => (data ? queueOf(config, withWorksheetSubmits(data, config, sheets)) : null), [config, data, sheets]);
  useEffect(() => { if (rows) onRows(config.id, rows); }, [config.id, rows, onRows]);
  return null;
}
const colorOf = (classId) => (classId === "comm3" ? "c3" : "c118");

/** To Grade: one bar per challenge across his classes. The only number on a row is how many to grade. */
export function ToGrade({ config, onOpen }) {
  const classes = useMemo(() => currentClasses().filter(c => !c.demo), []);
  const [by, setBy] = useState({});
  const [f, setF] = useState("");
  const onRows = useMemo(() => (id, rows) => setBy(prev => ({ ...prev, [id]: rows })), []);
  const loaded = classes.every(c => by[c.id]);
  const now = Date.now();
  const rows = classes.flatMap(c => by[c.id] || []).filter(r => r.toGrade && (!f || r.classId === f)).sort((a, b) => a.at - b.at);
  const sum = rows.reduce((t, r) => ({ g: t.g + Math.max(r.in - r.toGrade, 0), p: t.p + r.toGrade, n: t.n + Math.max(r.of - r.in, 0) }), { g: 0, p: 0, n: 0 });
  return <div className="body">
    {classes.map(c => <Queue key={c.id} config={c} onRows={onRows} />)}
    <div className="rowx"><p className="t1">Grades</p><Pill kind="on">To Grade</Pill><Pill href={"/grades/" + config.id + "/summary"}>Summary</Pill><span className="sp" />
      <Pill kind={!f ? "on" : ""} onClick={() => setF("")}>All</Pill>{classes.map(c => <Pill key={c.id} kind={f === c.id ? "on" : ""} onClick={() => setF(c.id)}>{c.code}</Pill>)}</div>
    {!loaded ? <p className="empty">Loading.</p> : rows.length === 0 ? <p className="empty">Nothing to grade.</p> : <>
      <div className="rowx"><span className="num" style={{ fontSize: 30 }}>{sum.p}</span><div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 4 }}>
        <Total label={sum.p + " to grade"} parts={[{ n: sum.g, color: "mute" }, { n: sum.p, color: "due" }, { n: sum.n }]} />
        <div className="key t3"><span><i className="dot sq" style={{ "--w": "var(--mute)" }} />Graded</span><span><i className="dot sq" style={{ "--w": "var(--due)" }} />To grade</span><span><i className="dot sq" style={{ "--w": "color-mix(in srgb,var(--none) 45%,var(--card))" }} />Not in</span></div>
      </div></div>
      <div className="list">{rows.map(r => {
        const g = Math.max(r.in - r.toGrade, 0), n = Math.max(r.of - r.in, 0);
        return <div key={r.key} className="pilerow" style={{ "--w": `var(--${colorOf(r.classId)})` }}>
          <span><b>{r.title}</b> <span className={"t3" + (r.at < now - 7 * 86400000 ? " old" : "")}>{r.code} · {r.due ? dueWords(r.due, "") : ""}</span></span>
          <span className="stack" role="img" aria-label={g + " graded, " + r.toGrade + " to grade, " + n + " not in"}>{g ? <i style={{ flex: g }} /> : null}<i className="p" style={{ flex: r.toGrade }} />{n ? <i className="n" style={{ flex: n }} /> : null}</span>
          <span className="num">{r.toGrade}</span>
          <Pill kind="due" onClick={() => onOpen(r.classId, r.id)}>Grade</Pill>
        </div>; })}</div>
    </>}
  </div>;
}

// ─── Grade Flow ───
const ZONE = { exceptional: "go", a: "go", complete: "go", b: "c118", c: "due", notquite: "due", d: "warn", revisions: "warn", "revisions-c": "warn", "late-c": "warn", incomplete: "bad", "incomplete-c": "bad", f: "bad", nosub: "none", notsubmitted: "none" };
const TOP = ["exceptional", "a", "b", "c", "d", "complete", "late-c", "notquite"];

function ChallengePills({ config, id, on, toHis }) {
  return <>
    <Pill onClick={() => toHis("to-grade")}>To Grade</Pill>
    <Pill kind={on === "flow" ? "on" : ""} onClick={() => toHis("grade-flow", id)}>Grade Flow</Pill>
    <Pill kind={on === "control" ? "on" : ""} onClick={() => toHis("control", id)}>Control</Pill>
  </>;
}

/** Grade Flow: click a face, then click a letter, and the face lands there. Click a placed face to move the face again. */
export function GradeFlow({ config, data, update, id, toHis }) {
  const assignments = useMemo(() => inDueOrder(assignmentsOf(config, data)), [config, data]);
  const people = useMemo(() => peopleOf(config, data), [config, data]);
  const asg = assignments.find(a => a.id === id) || assignments.find(a => people.some(s => waitOf(data, a.id, s.name))) || null;
  const sections = sectionsOf(config);
  const [section, setSection] = useState("");
  const [sel, setSel] = useState("");
  const [show, setShow] = useState(false);
  const [sure, setSure] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { setSel(""); setSure(false); setDone(false); }, [asg?.id]);
  if (!asg) return <div className="body"><p className="empty">No challenge to grade.</p></div>;
  const board = boardOf(data, asg.id), cards = board.cards || {};
  const shown = people.filter(s => !section || s.section === section);
  const at = (name) => cards[name]?.bucket || "";
  const loose = shown.filter(s => !at(s.name)), placed = shown.length - loose.length;
  const flags = (name) => { const log = alive(data?.assignmentLog?.[asg.id]?.[name]); return { late: !!latenessOf(asg, log)?.late, again: waitOf(data, asg.id, name) === "again", has: !!last(log, "submission") }; };
  const drop = (bucket) => { if (!sel || !update) return; const name = sel; update(prev => placeCard(prev, asg.id, name, bucket)); setSel(""); setDone(false); };
  const face = (s) => { const fl = flags(s.name), b = at(s.name);
    const ring = show && fl.again ? "c118" : show && fl.late ? "warn" : b ? "go" : "";
    return <Cell key={s.name} name={nameShown(data, s.name)} photo={photoOf(data, s.name)} ring={ring} hollow={!b && !fl.has} on={sel === s.name} dim={!!sel && sel !== s.name}
      tick={b ? (cardLetter(cards[s.name], bucketOf(b)) || "").length <= 2 ? cardLetter(cards[s.name], bucketOf(b)) : "" : ""}
      onClick={(e) => { e.stopPropagation(); setSel(sel === s.name ? "" : s.name); }} />; };
  const buckets = bucketsFor(asg);
  const zone = (b, big) => { const m = shown.filter(s => at(s.name) === b.id);
    return <div key={b.id} className={"zone" + (m.length ? " solid" : "") + (sel ? " lit" : "")} style={{ "--c": `var(--${ZONE[b.id] || "line"})` }} onClick={() => drop(b.id)} role="group" aria-label={b.label}>
      <div className="zh"><span className={big ? "t1" : ""} style={{ fontWeight: 600 }}>{b.label}</span><span className="t3">{m.length || ""}</span></div>
      {big && b.blurb ? <span className="t3">{b.blurb}</span> : null}
      <div className="zb">{m.map(face)}</div>
    </div>; };
  const counts = releaseCounts(data, asg.id) || {};
  const pending = (counts.new || 0) + (counts.changed || 0) + (counts.withdrawn || 0);
  const release = () => { update(prev => releasePatch(prev, asg.id, Date.now(), { meetingLink: schedulingLinkOf(config) })); setSure(false); setDone(true); };
  return <div className="body">
    <div className="rowx"><p className="t1">{asg.title}</p><ChallengePills config={config} id={asg.id} on="flow" toHis={toHis} /><span className="sp" />
      <Pill onClick={() => setShow(v => !v)}>{show ? "Hide late and resubmitted" : "Show late and resubmitted"}</Pill>
      <Pill href={"/grades/" + config.id + "/flow?a=" + encodeURIComponent(asg.id)}>Comments and notes</Pill>
      {done ? <Stamp>Released</Stamp> : sure
        ? <><Pill kind="go" onClick={release}>{"Release to " + pending + (pending === 1 ? " student" : " students")}</Pill><Pill onClick={() => setSure(false)}>Cancel</Pill></>
        : <Pill kind="go" disabled={!pending || !update} onClick={() => setSure(true)}>Release grades</Pill>}</div>
    <div className="rowx">
      {sections.length > 1 ? <><Pill kind={!section ? "on" : ""} onClick={() => setSection("")}>All</Pill>{sections.map(x => <Pill key={x} kind={section === x ? "on" : ""} onClick={() => setSection(x)}>{x}</Pill>)}</> : null}
      <div style={{ flex: 1, minWidth: 160 }}><Total label={placed + " of " + shown.length + " placed"} parts={[{ n: placed, color: "go" }, { n: loose.length }]} /></div><span className="t3">{placed} of {shown.length}</span></div>
    {show ? <div className="key t3"><span><i className="dot" style={{ "--w": "var(--warn)" }} />Late</span><span><i className="dot" style={{ "--w": "var(--c118)" }} />Resubmitted</span></div> : null}
    <div className={"zone" + (sel && at(sel) ? " lit" : "")} onClick={() => drop(null)} role="group" aria-label="Not placed"><div className="zb">{loose.map(face)}</div></div>
    <div className="scale">{buckets.filter(b => TOP.includes(b.id)).map(b => zone(b, true))}</div>
    <div className="others">{buckets.filter(b => !TOP.includes(b.id)).map(b => zone(b, false))}</div>
  </div>;
}

// ─── Control ───
const RANK = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "Complete", "Late but complete", "Completed with Revisions", "Not quite", "Incomplete", "F", "Not submitted"];
const rankOf = (l) => { const i = RANK.indexOf(String(l || "")); return i < 0 ? RANK.length : i; };
const short = (l) => (String(l || "").length <= 2 ? l : "");

/** Control, for one challenge: the class as faces, grouped by where they stand, with the grade on each face. */
export function Control({ config, data, id, toHis }) {
  const assignments = useMemo(() => inDueOrder(assignmentsOf(config, data)), [config, data]);
  const asg = assignments.find(a => a.id === id) || null;
  const people = useMemo(() => peopleOf(config, data), [config, data]);
  const rows = useMemo(() => (asg ? people.map(s => rowOf({ config, data, asg, student: s, sheet: null, progress: null })) : []), [config, data, asg, people]);
  const [sel, setSel] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!asg) return <div className="body">
    <div className="rowx"><p className="t1">Control</p><Pill onClick={() => toHis("to-grade")}>To Grade</Pill></div>
    <div className="list">{assignments.map(a => <button type="button" key={a.id} className="row" onClick={() => toHis("control", a.id)}><Tile state="off" /><span>{a.title}</span><span className="dt">{a.due ? dueWords(a.due, "") : ""}</span></button>)}</div>
  </div>;
  const wait = rows.filter(r => r.state === "resubmitted" || r.state === "ungraded");
  const graded = rows.filter(r => r.state === "graded" || r.state === "late").sort((x, y) => rankOf(x.letter) - rankOf(y.letter) || x.name.localeCompare(y.name));
  const out = rows.filter(r => !wait.includes(r) && !graded.includes(r));
  const face = (r) => { const isWait = wait.includes(r), isGraded = graded.includes(r);
    return <Cell key={r.name} name={nameShown(data, r.name)} photo={photoOf(data, r.name)} ring={isWait ? "due" : isGraded ? (show && r.late ? "warn" : "go") : ""} hollow={!isWait && !isGraded}
      tick={isGraded ? short(r.letter) : ""} on={sel === r.name} dim={!!sel && sel !== r.name} onClick={() => setSel(sel === r.name ? "" : r.name)} />; };
  const zone = (say, color, list, solid) => <div className={"zone" + (solid ? " solid" : "")} style={{ "--c": `var(--${color})` }}><div className="zh"><span style={{ fontWeight: 600 }}>{say}</span><span className="t3">{list.length}</span></div><div className="zb">{list.map(face)}</div></div>;
  const r = rows.find(x => x.name === sel) || null;
  const copy = () => { const url = window.location.origin + config.path + "/challenges/" + encodeURIComponent(asg.id); (navigator.clipboard?.writeText(url) || Promise.reject()).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2400); }).catch(() => {}); };
  return <div className="body">
    <div className="rowx"><p className="t1">{asg.title}</p><span className="t3">{[asg.due ? dueWords(asg.due, "") : "", asg.weight ? asg.weight + "%" : ""].filter(Boolean).join(" · ")}</span><span className="sp" />
      <ChallengePills config={config} id={asg.id} on="control" toHis={toHis} /><Pill href={controlHref(config, asg.id)}>The live control page</Pill></div>
    <div className="rowx"><div style={{ flex: 1, minWidth: 160 }}><Total label={wait.length + " to grade, " + graded.length + " graded, " + out.length + " not in"} parts={[{ n: wait.length, color: "due" }, { n: graded.length, color: "go" }, { n: out.length }]} /></div>
      <Pill onClick={() => setShow(v => !v)}>{show ? "Hide late" : "Show late"}</Pill>{copied ? <Stamp>Copied</Stamp> : <Pill onClick={copy}>Copy student link</Pill>}</div>
    <div className="main" style={r ? undefined : { gridTemplateColumns: "1fr" }}>
      <div className="zones"><div className="main" style={{ gridTemplateColumns: "1fr 1fr" }}>{zone("To grade", "due", wait)}{zone("Not in", "none", out)}</div>{zone("Graded", "go", graded, true)}</div>
      {r ? <div className="panel" key={r.name}>
        <div className="hd"><Face name={nameShown(data, r.name)} photo={photoOf(data, r.name)} size="lg" ring={wait.includes(r) ? "due" : graded.includes(r) ? "go" : ""} />
          <div><p className="t1">{nameShown(data, r.name)}</p><p className="t3">{r.state === "resubmitted" ? "Resubmitted" : r.state === "ungraded" ? "Turned in" : graded.includes(r) ? "Graded" + (show && r.late ? " · late" : "") : r.state === "started" ? "Started" : "Not submitted"}</p></div>
          {graded.includes(r) && r.letter ? <span className={"tile lg s-done" + (short(r.letter) ? "" : " wide")} style={{ marginLeft: "auto" }}>{r.letter}</span> : null}</div>
        <div className="rowx">{wait.includes(r) ? <Pill kind="due" onClick={() => toHis("grade-flow", asg.id)}>Grade</Pill> : null}{r.link ? <a className="pill" href={r.link} target="_blank" rel="noreferrer">Their work</a> : null}<Pill href={studentHref(config, r.student)}>Student page</Pill></div>
      </div> : null}
    </div>
  </div>;
}
