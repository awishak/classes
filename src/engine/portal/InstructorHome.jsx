// Andrew's home, in the same bones: the pinned links, the next class with
// the note box and the two doors, Needs you (what is waiting on him, each
// with its button), his challenges with how much of each section is in,
// questions waiting, and the inbox as mail. My work, for him, is where the
// challenges are built.

import { PinnedLinks, NoteEditor, nextClassFacts } from "../HomeCards.jsx";
import { AwayList } from "../Attendance.jsx";
import { assignmentsOf } from "../profileTask.js";
import { turnedIn, waitingOn, AssignmentEditor } from "../AssignmentsCard.jsx";
import { inDueOrder } from "../AssignmentCards.jsx";
import { hasSections, sectionsOf } from "../sections.js";
import { rosterOf, nameShown } from "../roster.js";
import { useQuestions } from "../questions.js";
import { onThePage, isAnswered } from "../QuestionsCard.jsx";
import { isProfileTask, PROFILE_TASK_OFF } from "../profileTask.js";
import { Sec, Row, Io, Btn, Chip, Face, Gm, dcolOf, dueWords, whenWords } from "./bits.jsx";
import { opensState, opensWords } from "./work.js";
import { Hero } from "./StudentHome.jsx";
import { QuestionsSection } from "./Questions.jsx";

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
export function HisWorkRow({ config, data, asg, toGrade, side }) {
  const ongoing = !asg.due || asg.due === "Ongoing";
  const open = opensState(asg);
  const tint = ongoing ? "" : open !== "open" ? "off" : past(asg) ? "done" : "due";
  const line = ongoing ? "Ongoing, all quarter" : open !== "open" ? opensWords(asg) : past(asg) ? "Closed " + dueWords(asg.due, asg.dueTime) : "Due " + dueWords(asg.due, asg.dueTime);
  return (
    <Row tint={tint} d={ongoing ? ["", ""] : dcolOf(asg.due)} side={side}>
      <p className="pt-title">{asg.title}{asg.visible === false ? <span className="pt-kind" style={{ color: "var(--text-muted)" }}> · Hidden</span> : null}</p>
      <p className={"pt-when " + tint}><span>{line}</span>{asg.weight ? <Gm>{asg.weight}%</Gm> : null}{toGrade ? <span className="pt-gm" style={{ color: "var(--pt-due-ink)" }}>{toGrade} to grade</span> : null}</p>
      {ongoing || open !== "open" ? null : <InLine config={config} data={data} asg={asg} />}
    </Row>
  );
}

// The inbox as mail: every thread, newest first, a line or two of the last
// message under the name, bold and New while it waits on him.
export function Inbox({ config, data, go, limit }) {
  const rows = rosterOf(config, data).map(s => {
    const t = data?.threads?.[s.name] || [];
    const last = t[t.length - 1];
    return last ? { s, last, waiting: last.from === "student" } : null;
  }).filter(Boolean).sort((x, y) => (y.last.ts || 0) - (x.last.ts || 0));
  const shown = limit ? rows.slice(0, limit) : rows;
  if (!rows.length) return <p className="pt-quiet">Nobody has written yet.</p>;
  return (
    <div className="pt-stack">
      {shown.map(({ s, last, waiting }) => (
        <button type="button" key={s.name} className="pt-row pt-focus" style={{ padding: "12px 14px", alignItems: "flex-start" }} onClick={() => go("messages/" + encodeURIComponent(s.name))}>
          <Face config={config} data={data} name={s.name} size={40} />
          <div className="pt-main">
            <div className="pt-head"><p className="pt-title" style={{ fontWeight: waiting ? 700 : 500 }}>{nameShown(data, s.name)}</p><span className="pt-meta" style={{ flex: "none" }}>{whenWords(last.ts)}</span></div>
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

export function InstructorHome({ config, data, update, blockOf, go, saving, online }) {
  const assignments = inDueOrder(assignmentsOf(config, data));
  const waiting = waitingOn(data, assignments);
  const toGradeOf = (asg) => (waiting.find(w => w.id === asg.id) || {}).toGrade || 0;
  const graded = assignments.map(asg => ({ asg, n: toGradeOf(asg) })).filter(r => r.n);
  const inbox = rosterOf(config, data).filter(s => { const t = data?.threads?.[s.name] || []; const last = t[t.length - 1]; return last && last.from === "student"; });
  const q = useQuestions(config.storageKey);
  const askWaiting = q.items === null ? 0 : onThePage(q.items).filter(x => !isAnswered(x)).length;
  const facts = nextClassFacts(config, data, blockOf, "");
  const coming = assignments.filter(a => a.due && a.due !== "Ongoing" && !past(a)).slice(0, 2);
  return (
    <div className="pt-body">
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
      <div className="pt-day">
        <Sec name={<button type="button" className="pt-focus" onClick={() => go("assignments")} style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}>My work</button>} sub="Coming up" />
        <div className="pt-stack">
          {coming.map(asg => <HisWorkRow key={asg.id} config={config} data={data} asg={asg} toGrade={toGradeOf(asg)} side={<Io onClick={() => go("assignments/" + asg.id)}>Edit</Io>} />)}
          {!coming.length ? <p className="pt-quiet">Nothing coming up.</p> : null}
        </div>
        <div><Chip onClick={() => go("assignments/new")}>New challenge</Chip></div>
      </div>
      <QuestionsSection config={config} name={config.instructor?.name || "Instructor"} profiles={data?.profiles} go={go} instructor />
      <div className="pt-day">
        <Sec name={<button type="button" className="pt-focus" onClick={() => go("messages")} style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}>Inbox</button>} sub={inbox.length ? inbox.length + " waiting" : ""} />
        <Inbox config={config} data={data} go={go} limit={7} />
      </div>
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
  return (
    <div className="pt-body" style={{ gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Btn onClick={() => go("assignments/new")}>New challenge</Btn>
        <Chip href={config.path + "/grade"}>Grade view</Chip>
        {toGrade ? <Chip href={config.path + "/grade"}>{toGrade} to grade</Chip> : null}
      </div>
      {Object.entries(months).map(([m, rows]) => (
        <div key={m} className="pt-day"><Sec name={m} /><div className="pt-stack">
          {rows.map(asg => <HisWorkRow key={asg.id} config={config} data={data} asg={asg} toGrade={toGradeOf(asg)} side={<Io kind="go" onClick={() => go("assignments/" + asg.id)}>Edit</Io>} />)}
        </div></div>
      ))}
      {ongoing.length ? <div className="pt-day"><Sec name="All quarter" /><div className="pt-stack">
        {ongoing.map(asg => <HisWorkRow key={asg.id} config={config} data={data} asg={asg} toGrade={toGradeOf(asg)} side={<Io kind="go" onClick={() => go("assignments/" + asg.id)}>Edit</Io>} />)}
      </div></div> : null}
    </div>
  );
}

