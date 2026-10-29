// Andrew's home, in the same bones: the pinned links, the next class with
// the note box and the two doors, Needs you (what is waiting on him, each
// with its button), and questions waiting. Andrew, 2026-10-15: My work and
// the inbox came off the home, since each is a tab in the right pane, which
// opens to the class flow. My work, for him, is where the challenges are
// built.

import { useState } from "react";
import { StudentLink } from "../StudentPage.jsx";
import { PinnedLinks, NoteEditor, nextClassFacts } from "../HomeCards.jsx";
import { AwayList } from "../Attendance.jsx";
import { assignmentsOf } from "../profileTask.js";
import { turnedIn, waitingOn, AssignmentEditor } from "../AssignmentsCard.jsx";
import { inDueOrder } from "../AssignmentCards.jsx";
import { hasSections, sectionsOf } from "../sections.js";
import { rosterOf, nameShown } from "../roster.js";
import { useQuestions } from "../questions.js";
import { onThePage, isAnswered } from "../QuestionsCard.jsx";
import { isProfileTask, PROFILE_TASK_OFF, hiddenWords } from "../profileTask.js";
import { Sec, Row, Io, Btn, Chip, Face, DrFace, Gm, dcolOf, dueWords, whenWords } from "./bits.jsx";
import { alive, htmlToText, boardOf } from "../grades.js";
import { Days } from "./MyWork.jsx";
import { opensState, opensWords } from "./work.js";
import { deadlineOf } from "../DueCard.jsx";
import { waitingOnInstructor } from "../YouCard.jsx";
import { Hero, StoryPhaseBar, StoryDoor, AudioStoryDoor, TopicsDoor, DOOR_CSS } from "./StudentHome.jsx";
import { QuestionsSection } from "./Questions.jsx";
import { ToolsPanel, Links, assignmentTools, useSubmitCounts, sheetOfAssignment } from "./Tools.jsx";
import { INSTRUCTOR_EMAILS } from "../../instructors.js";

const secs = (config) => hasSections(config) ? sectionsOf(config) : [""];

// How much of each section is in, as chips in a line.
const InLine = ({ config, data, asg }) => (
  <p className="pt-meta">
    {secs(config).map(s => { const t = turnedIn(config, data, asg, s); return <span key={s || "all"}>{s ? <b>{s}</b> : null}{s ? " " : ""}{t.in} of {t.of}</span>; })}
  </p>
);

const past = (asg) => { const d = asg.due ? new Date(asg.due + ", 2026") : null; return d && !isNaN(d) && d.getTime() + 86400000 < Date.now(); };

// One challenge as he reads it: the state, the weight, how many are waiting
// to be graded, and how much of each section is in.
//
// An assignment that is a worksheet carries the sheet's buttons here, Home
// first beside Edit, since 2026-10-29 (Tools.jsx). `sheetLine` is the
// sheet's own count, submitted off its rows.
export function HisWorkRow({ config, data, asg, toGrade, side, tools = [], sheetLine = "" }) {
  const ongoing = !asg.due || asg.due === "Ongoing";
  const open = opensState(asg);
  const tint = ongoing ? "" : open !== "open" ? "off" : past(asg) ? "done" : "due";
  const line = ongoing ? "Ongoing, all quarter" : open !== "open" ? opensWords(asg) : past(asg) ? "Closed " + dueWords(asg.due, asg.dueTime) : "Due " + dueWords(asg.due, asg.dueTime);
  const home = tools.find(l => l.main) || null;
  const rail = home ? <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "stretch" }}><Io kind="go" href={home.href}>{home.say}</Io>{side}</div> : side;
  return (
    <Row tint={tint} d={ongoing ? ["", ""] : dcolOf(asg.due)} side={rail}>
      <p className="pt-title">{asg.title}{hiddenWords(asg) ? <span className="pt-kind" style={{ color: "var(--text-muted)" }}> · {hiddenWords(asg)}</span> : null}</p>
      <p className={"pt-when " + tint}><span>{line}{sheetLine ? " · " + sheetLine : ""}</span>{asg.weight ? <Gm>{asg.weight}%</Gm> : null}{toGrade ? <span className="pt-gm" style={{ color: "var(--pt-due-ink)" }}>{toGrade} to grade</span> : null}</p>
      {ongoing || open !== "open" ? null : <InLine config={config} data={data} asg={asg} />}
      {tools.length > 1 ? <Links links={tools} /> : null}
    </Row>
  );
}

// The inbox as mail: every thread, newest first, a line or two of the last
// message under the name, bold and New while it waits on him.
export function Inbox({ config, data, go, limit }) {
  const rows = rosterOf(config, data).map(s => {
    const t = data?.threads?.[s.name] || [];
    const last = t[t.length - 1];
    return last ? { s, last, waiting: waitingOnInstructor(data, s.name) } : null;
  }).filter(Boolean).sort((x, y) => (y.last.ts || 0) - (x.last.ts || 0));
  const shown = limit ? rows.slice(0, limit) : rows;
  if (!rows.length) return <p className="pt-quiet">Nobody has written yet.</p>;
  return (
    <div className="pt-stack">
      {shown.map(({ s, last, waiting }) => (
        <button type="button" key={s.name} className="pt-row pt-focus" style={{ padding: "12px 14px", alignItems: "flex-start" }} onClick={() => go("messages/" + encodeURIComponent(s.name))}>
          <Face config={config} data={data} name={s.name} size={40} />
          <div className="pt-main">
            <div className="pt-head"><p className="pt-title" style={{ fontWeight: waiting ? 700 : 500 }}><StudentLink config={config} student={s}>{nameShown(data, s.name)}</StudentLink></p><span className="pt-meta" style={{ flex: "none" }}>{whenWords(last.ts)}</span></div>
            <p className="pt-text" style={{ color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "normal" }}>
              {last.from === "instructor" ? <span style={{ color: "var(--text-muted)" }}>You: </span> : null}{last.text || (last.kind === "got_it" ? "Thumbs up" : last.kind === "meeting" ? "Make a meeting" : "")}
            </p>
            <p className="pt-meta">{s.section ? <Gm>{s.section}</Gm> : null}{waiting ? <span style={{ color: "var(--ca-accent-ink)", fontWeight: 600 }}>New</span> : null}</p>
          </div>
        </button>
      ))}
      {limit && rows.length > limit ? <div><Chip onClick={() => go("messages")}>All {rows.length} threads</Chip></div> : null}
    </div>
  );
}

// ─── the class flow ───
//
// Andrew, 2026-10-15: the right pane opens to the class flow, "the work flow
// but with maybe messages and more." The student's Flow, for the whole room:
// every submission, regrade ask and comment on a challenge, every message
// either way, each grade release and each note to the class, newest first.
//
//   tags  work      submissions, regrades, comments, releases
//         messages  the threads
//         notes     his notes to the class
//
// Andrew, 2026-10-15: submissions stay out of the flow until the deadline.
// Then the ones that came in on time are one row at the deadline, "24 turned
// in" the challenge. Anything after the deadline is its own row, marked late.
// A challenge with no date shows each submission as it comes.
export function classFlowOf(config, data, now = Date.now()) {
  const out = [];
  const push = (e) => { if (e.at) out.push(e); };
  const assignments = assignmentsOf(config, data);
  const first = (n) => nameShown(data, n).split(" ")[0];
  const roster = rosterOf(config, data);
  assignments.forEach(asg => {
    const due = asg.due && asg.due !== "Ongoing" ? deadlineOf(asg.due, asg.dueTime) : null;
    const onTime = new Set();
    roster.forEach(s => {
      alive(data?.assignmentLog?.[asg.id]?.[s.name]).forEach(e => {
        if (e.type === "submission" && due && e.ts <= due) { onTime.add(s.name); return; }
        if (e.type === "submission") push({ id: e.id, at: e.ts, who: s.name, tint: due ? "due" : "me", tags: ["work"], aid: asg.id,
          say: [first(s.name) + " turned in ", asg.title, due ? " late" : ""], text: [e.why ? "Late: " + e.why : "", e.text || ""].filter(Boolean).join("\n"), link: e.link || "", btn: "grade" });
        else if (e.type === "regrade") push({ id: e.id, at: e.ts, who: s.name, tint: "due", tags: ["work"], aid: asg.id,
          say: [first(s.name) + " asked for a regrade on ", asg.title], text: e.text || "", link: e.link || "", btn: "grade" });
        else if (e.type === "comment" && e.from === "student") push({ id: e.id, at: e.ts, who: s.name, tint: "me", tags: ["work"], aid: asg.id,
          say: [first(s.name) + " wrote on ", asg.title], text: htmlToText(e.html || e.text), btn: "reply" });
      });
    });
    if (due && due <= now && onTime.size) push({ id: "in-" + asg.id, at: due, who: "", tint: "me", tags: ["work"], aid: asg.id,
      say: [onTime.size + " turned in ", asg.title], text: "", btn: "grade" });
    const rel = boardOf(data, asg.id).released;
    if (rel?.at) push({ id: "rel-" + asg.id, at: rel.at, who: "", tint: "done", tags: ["work"], aid: asg.id,
      say: ["You released grades on ", asg.title], text: "", btn: "grade" });
  });
  // Andrew, 2026-10-15: once he has written back, that exchange leaves the
  // flow, his message and theirs. What a student wrote after his last reply
  // stays until he answers it.
  roster.forEach(s => { const t = data?.threads?.[s.name] || []; const answered = Math.max(0, ...t.filter(m => m.from === "instructor").map(m => m.ts || 0)); t.filter(m => (m.ts || 0) > answered).forEach(m => {
    const text = String(m.text || "").trim();
    if (!text && m.kind === "got_it") return;
    const his = m.from === "instructor";
    push({ id: m.id, at: m.ts, who: his ? "" : s.name, tint: his ? "dr" : "me", tags: ["messages"], to: s.name,
      say: his ? ["You wrote to ", nameShown(data, s.name)] : [nameShown(data, s.name) + " wrote"], text, btn: "reply" });
  }); });
  Object.entries(data?.dayPlans || {}).forEach(([date, plan]) => {
    const note = String(plan?.studentNote || "").trim();
    const d = new Date(date + ", 2026");
    if (note && !isNaN(d)) push({ id: "note-" + date, at: d.getTime(), who: "", tint: "dr", tags: ["notes"], say: ["Note to the class"], text: note });
  });
  return out.sort((x, y) => y.at - x.at);
}
const CLASS_FLOW_FILTERS = [["all", "All"], ["work", "Work"], ["messages", "Messages"], ["notes", "Notes"]];

// What a student wrote, and that a piece came in late, is theirs and his,
// not the room's. Andrew, 2026-10-29: "stop putting students' messages text
// on the class flow page, or saying someone turned in work late. that is
// private stuff." So the flow opens with those hidden, every time, and a
// button shows them for as long as the page is open. His own notes to the
// class and the release rows are not private.
const isPrivate = (e) => !!e.who || e.tags.includes("messages");
export function ClassFlow({ config, data, go }) {
  const [filter, setFilter] = useState("all");
  const [more, setMore] = useState(false);
  const [shown, setShown] = useState(false);
  const all = classFlowOf(config, data).filter(e => filter === "all" || e.tags.includes(filter));
  const rows = more ? all : all.slice(0, 60);
  const sideOf = (e) => e.btn === "grade" ? <Io kind="go" href={config.path + "/grade?a=" + encodeURIComponent(e.aid)}>Grade</Io>
    : e.btn === "reply" && (e.to || e.who) ? <Io onClick={() => go("messages/" + encodeURIComponent(e.to || e.who))}>Reply</Io> : null;
  const hidden = (e) => !shown && isPrivate(e);
  const sayOf = (e) => hidden(e) && e.say[2] === " late" ? [e.say[0], e.say[1], ""] : e.say;
  return (
    <div className="pt-body" style={{ gap: 16 }}>
      <div className="pt-chips">
        {CLASS_FLOW_FILTERS.map(([id, say]) => <Chip key={id} on={filter === id} onClick={() => { setFilter(id); setMore(false); }}>{say}</Chip>)}
        <Chip on={shown} onClick={() => setShown(v => !v)}>{shown ? "Hide private words" : "Show private words"}</Chip>
      </div>
      {rows.length ? (
        <Days rows={rows} render={e => (
          <div key={e.id} className={"pt-row " + e.tint}>
            <div className="pt-dcol">{e.who ? <Face config={config} data={data} name={e.who} /> : <DrFace config={config} />}</div>
            <div className="pt-main">
              <p className="pt-title say">{sayOf(e)[0]}{sayOf(e)[1] ? <b>{sayOf(e)[1]}</b> : null}{sayOf(e)[2] || null}</p>
              {e.text && !hidden(e) ? <p className="pt-text" style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.text}</p> : null}
              <p className="pt-meta"><span>{whenWords(e.at)}</span></p>
            </div>
            {sideOf(e) ? <div className="pt-side">{sideOf(e)}</div> : null}
          </div>
        )} />
      ) : <p className="pt-quiet" style={{ textAlign: "center", padding: "16px 0" }}>Nothing here yet.</p>}
      {!more && all.length > rows.length ? <div><Chip onClick={() => setMore(true)}>Show all {all.length}</Chip></div> : null}
    </div>
  );
}

export function InstructorHome({ config, data, update, blockOf, go, saving, online }) {
  const assignments = inDueOrder(assignmentsOf(config, data));
  const waiting = waitingOn(data, assignments);
  const toGradeOf = (asg) => (waiting.find(w => w.id === asg.id) || {}).toGrade || 0;
  const graded = assignments.map(asg => ({ asg, n: toGradeOf(asg) })).filter(r => r.n);
  const inbox = rosterOf(config, data).filter(s => waitingOnInstructor(data, s.name));
  const q = useQuestions(config.storageKey);
  const askWaiting = q.items === null ? 0 : onThePage(q.items).filter(x => !isAnswered(x)).length;
  const facts = nextClassFacts(config, data, blockOf, "");
  return (
    <div className="pt-body">
      {/* The bars students see at the top of their home, on his too. Andrew,
          2026-10-23: "if it's there for the students, i want to see it too." */}
      <style>{DOOR_CSS}</style>
      <StoryPhaseBar config={config} />
      <StoryDoor config={config} data={data} />
      <AudioStoryDoor config={config} data={data} />
      <TopicsDoor config={config} data={data} />
      <PinnedLinks data={data} update={update} instructor seat={{ background: "var(--surface-sunk)", borderRadius: 16 }} />
      <Hero config={config} data={data} blockOf={blockOf} section="" go={go} instructor>
        {facts ? <div style={{ background: "var(--surface-card)", color: "var(--text-primary)", borderRadius: 12, padding: "10px 12px" }}><NoteEditor key={facts.date} date={facts.date} value={facts.note} update={update} saving={saving} online={online} /></div> : null}
        {facts ? <div style={{ background: "var(--surface-card)", color: "var(--text-primary)", borderRadius: 12, padding: "10px 12px" }}><AwayList config={config} data={data} date={facts.date} /></div> : null}
      </Hero>
      {graded.length || inbox.length || askWaiting ? (
        <div className="pt-day">
          <Sec name="Needs you" sub="Today" />
          <div className="pt-stack">
            {graded.map(({ asg, n }) => (
              <Row key={asg.id} tint="due" d={dcolOf(asg.due)} side={<Io kind="go" href={config.path + "/grade?a=" + encodeURIComponent(asg.id)}>Grade {n}</Io>}>
                <p className="pt-title">{n} turned in {asg.title}</p>
                <p className="pt-when due"><span>{n} to grade</span></p>
                <InLine config={config} data={data} asg={asg} />
              </Row>
            ))}
            {inbox.length ? (
              <Row tint="due" d={["", String(inbox.length)]} side={<Io kind="go" onClick={() => go("messages")}>Open</Io>}>
                <p className="pt-title">{inbox.length} message{inbox.length === 1 ? "" : "s"} waiting on you</p>
                <p className="pt-meta">{inbox.slice(0, 3).map(s => nameShown(data, s.name).split(" ")[0]).join(", ")}{inbox.length > 3 ? " and " + (inbox.length - 3) + " more" : ""}</p>
              </Row>
            ) : null}
            {askWaiting ? (
              <Row tint="due" d={["", "?"]} side={<Io kind="go" onClick={() => go("questions")}>Answer</Io>}>
                <p className="pt-title">{askWaiting} question{askWaiting === 1 ? "" : "s"} waiting</p>
              </Row>
            ) : null}
          </div>
        </div>
      ) : null}
      {/* Andrew, 2026-10-16: the buttons for everything the class is doing, on the front page. */}
      <ToolsPanel config={config} data={data} />
      <QuestionsSection config={config} name={config.instructor?.name || "Instructor"} profiles={data?.profiles} go={go} instructor />
    </div>
  );
}

// My work, for him: every challenge in due order with its counts, Edit on
// each, New challenge at the top, and the grading queue a chip away.
export function InstructorWork({ config, data, update, go, editing }) {
  const assignments = inDueOrder(assignmentsOf(config, data));
  const waiting = waitingOn(data, assignments);
  const toGradeOf = (asg) => (waiting.find(w => w.id === asg.id) || {}).toGrade || 0;
  if (editing) {
    const asg = editing === "new" ? null : assignments.find(x => x.id === editing);
    if (editing !== "new" && !asg) return <p className="pt-quiet">No challenge here.</p>;
    return (
      <div className="pt-body">
        <AssignmentEditor config={config} asg={asg}
          onCancel={() => go("assignments")}
          onSave={(next) => {
            // A due date that moves is news, so it lands in the conversation
            // on the challenge's page as a message of its own.
            update(prev => {
              const list = prev.assignments || config.assignments || [];
              const before = list.find(x => x.id === next.id);
              const moved = !before || before.due !== next.due || (before.dueTime || "") !== (next.dueTime || "");
              const log = { ...(prev.dueLog || {}) };
              if (moved && next.due) log[next.id] = [...(log[next.id] || []), { at: Date.now(), due: next.due, dueTime: next.dueTime || "" }];
              return { ...prev, dueLog: log, assignments: asg ? list.map(x => x.id === asg.id ? next : x) : [...list, next] };
            });
            go("assignments");
          }}
          onDelete={asg ? () => {
            if (isProfileTask(asg)) update(prev => ({ ...prev, [PROFILE_TASK_OFF]: true }));
            else update(prev => ({ ...prev, assignments: (prev.assignments || config.assignments || []).filter(x => x.id !== asg.id) }));
            go("assignments");
          } : null} />
      </div>
    );
  }

  const ongoing = assignments.filter(a => !a.due || a.due === "Ongoing"), dated = assignments.filter(a => a.due && a.due !== "Ongoing");
  const months = {};
  dated.forEach(a => { const d = new Date(a.due + ", 2026"); const k = isNaN(d) ? "Later" : d.toLocaleDateString("en-US", { month: "long" }); (months[k] = months[k] || []).push(a); });
  const toGrade = waiting.reduce((n, w) => n + (w.toGrade || 0), 0);
  // Each assignment that is a sheet: its buttons, and its own submitted count.
  const sheetKeys = [...new Set(assignments.map(a => sheetOfAssignment(config, a)?.key).filter(Boolean))];
  const counts = useSubmitCounts(config, sheetKeys);
  const people = rosterOf(config, data).filter(s => s.email && !INSTRUCTOR_EMAILS.includes(String(s.email).trim().toLowerCase()));
  const emails = new Set(people.map(s => String(s.email).trim().toLowerCase()));
  const sheetLineOf = (asg) => {
    const key = sheetOfAssignment(config, asg)?.key;
    if (!key || !counts || !counts[key]) return "";
    return [...counts[key]].filter(e => emails.has(e)).length + " of " + people.length + " submitted the sheet";
  };
  const row = (asg) => <HisWorkRow key={asg.id} config={config} data={data} asg={asg} toGrade={toGradeOf(asg)} tools={assignmentTools(config, asg)} sheetLine={sheetLineOf(asg)} side={<Io kind="go" onClick={() => go("assignments/" + asg.id)}>Edit</Io>} />;
  return (
    <div className="pt-body" style={{ gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn onClick={() => go("assignments/new")}>New challenge</Btn>
        <Chip href={config.path + "/grade"}>Grade view</Chip>
        {toGrade ? <Chip href={config.path + "/grade"}>{toGrade} to grade</Chip> : null}
        <Chip href={config.path + "/grades"}>All grades</Chip>
        <Chip href={config.path + "/grading"}>Grade view, round two</Chip>
      </div>
      <ToolsPanel config={config} data={data} />
      {Object.entries(months).map(([m, rows]) => (
        <div key={m} className="pt-day"><Sec name={m} /><div className="pt-stack">{rows.map(row)}</div></div>
      ))}
      {ongoing.length ? <div className="pt-day"><Sec name="All quarter" /><div className="pt-stack">{ongoing.map(row)}</div></div> : null}
    </div>
  );
}

