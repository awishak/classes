// My work: one page, two views, and the page for one challenge.
//
// Flow is the conversation between the student and Dr. Ishak, newest first,
// with the challenge they still owe pinned on top. List is every challenge in
// due order. My performance is a sheet: three counts and every challenge with
// its own word, each row opening that challenge. A challenge's own page is its
// state card at the top (the instructions in full before the work goes in,
// folded after), the box to write, and everything said about that one piece,
// newest first, Dr. Ishak on the right.
//
// The questions and comments on the canvas were made up; nothing here is.
// Every word comes from the store or is a label the app owns.

import { useState, useEffect } from "react";
import { genId } from "../../utils.jsx";
import { feedOf } from "../AssignmentCards.jsx";
import { deletePatch } from "../AssignmentsCard.jsx";
import { markSeen, regradeOf, alive } from "../grades.js";
import { isProfileTask } from "../profileTask.js";
import { schedulingLinkOf } from "../../instructors.js";
import { useMarkThreadSeen } from "../YouCard.jsx";
import { Sec, Row, Io, Btn, Chip, Lnk, Check, Gm, Face, DrFace, I, dcolOf, dueWords, whenWords, dayWords, firstLink, hostOf, drShort } from "./bits.jsx";
import { visibleAssignments, workOf, unseenOf, nextOwedOf, counts, flowOf, FLOW_FILTERS, opensWords } from "./work.js";

// ─── a challenge as a row ───
const tintOf = (st) => st.state === "graded" || st.state === "turnedIn" ? "done"
  : st.state === "closed-until" ? "off" : st.state === "missed" ? "late" : st.state === "open" ? "due" : "";
const lineOf = (asg, st) => st.state === "graded" ? "Graded " + st.letter
  : st.state === "turnedIn" ? "Turned in " + whenWords(st.last?.ts)
  : st.state === "closed-until" ? st.opens
  : st.state === "missed" ? "Missed, was due " + dueWords(asg.due, asg.dueTime)
  : st.state === "ongoing" ? "Ongoing, all quarter"
  : "Due " + dueWords(asg.due, asg.dueTime);

export function WorkRow({ asg, st, ring, onOpen }) {
  const tint = tintOf(st);
  const side = st.state === "open" ? <Io kind="go" onClick={onOpen}>Submit</Io>
    : st.state === "graded" || st.state === "turnedIn" ? <Check />
    : st.state === "closed-until" ? null
    : <Io kind="go" onClick={onOpen}>Open</Io>;
  return (
    <Row tint={tint} d={dcolOf(asg.due)} ring={ring} onOpen={onOpen} side={side}>
      <p className="pt-title">{asg.title}</p>
      <p className={"pt-when " + tint}><span>{lineOf(asg, st)}</span>{asg.weight ? <Gm>{asg.weight}%</Gm> : null}</p>
      {st.state === "graded" && st.last ? <p className="pt-meta">Turned in {whenWords(st.last.ts)}</p> : null}
    </Row>
  );
}

// ─── a flow entry as a row ───
const Say = ({ say }) => {
  const [before, name, after] = say;
  return <p className="pt-title say">{before}{name ? <b>{name}</b> : null}{after}</p>;
};
export function FlowRow({ config, data, name, e, onOpen }) {
  const face = e.who === "me" ? <Face config={config} data={data} name={name} /> : <DrFace config={config} />;
  const side = e.btn && e.aid ? <Io kind="go" onClick={() => onOpen(e.aid)}>{e.btn}</Io>
    : e.grade && e.aid ? <Io kind="go" onClick={() => onOpen(e.aid)}>Open</Io> : null;
  return (
    <div className={"pt-row " + e.tint + (e.who !== "me" ? " right" : "")}>
      <div className="pt-dcol">{face}</div>
      {e.who !== "me" && side ? <div className="pt-side">{side}</div> : null}
      <div className="pt-main">
        <Say say={e.say} />
        {e.grade ? <p className="pt-when done"><span>{e.grade}</span>{e.weight ? <Gm>{e.weight}%</Gm> : null}</p> : null}
        {e.means ? <p className="pt-text">{e.means}</p> : null}
        {e.text ? <p className="pt-text">{e.text}</p> : null}
        {e.link ? <div><Lnk href={e.link}>{hostOf(e.link)}</Lnk></div> : null}
        <p className="pt-meta"><span>{whenWords(e.at)}</span></p>
      </div>
      {e.who === "me" && side ? <div className="pt-side">{side}</div> : null}
    </div>
  );
}

// Rows under day headings, newest first.
export function Days({ rows, render }) {
  const groups = [];
  rows.forEach(e => {
    const d = dayWords(e.at);
    const last = groups[groups.length - 1];
    if (last && last.key === d.key) last.rows.push(e); else groups.push({ ...d, rows: [e] });
  });
  return groups.map(g => (
    <div key={g.key} className="pt-day">
      <h2 className="pt-sec"><span className="pt-secName">{g.name}</span><span className="pt-secSub">{g.date}</span></h2>
      <div className="pt-stack">{g.rows.map(render)}</div>
    </div>
  ));
}

// ─── writing to Dr. Ishak ───
export function sendMessage(update, name, text) {
  const words = String(text || "").trim();
  if (!words || !update) return;
  update(prev => {
    const threads = { ...(prev.threads || {}) };
    threads[name] = [...(threads[name] || []), { id: genId(), ts: Date.now(), from: "student", kind: "reply", text: words }];
    return { ...prev, threads };
  });
}
export function Composer({ config, update, name, placeholder, meeting = true }) {
  const [draft, setDraft] = useState("");
  const send = () => { sendMessage(update, name, draft); setDraft(""); };
  const thumb = () => update && update(prev => {
    const threads = { ...(prev.threads || {}) };
    threads[name] = [...(threads[name] || []), { id: genId(), ts: Date.now(), from: "student", kind: "got_it", text: "" }];
    return { ...prev, threads };
  });
  const link = schedulingLinkOf(config);
  return (
    <div className="pt-compose">
      <div style={{ display: "flex", gap: 8 }}>
        <input className="pt-field pt-focus" style={{ flex: 1 }} value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
          placeholder={placeholder || "Write to " + drShort(config)} aria-label={"Write to " + drShort(config)} />
        <Btn onClick={send} disabled={!draft.trim()}>Send</Btn>
      </div>
      {meeting ? (
        <div style={{ display: "flex", gap: 8 }}>
          <Chip onClick={thumb} label="Thumbs up">{I.thumb()}</Chip>
          {link ? <Chip href={link}>Make a meeting</Chip> : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── the page ───
export function MyWorkPage({ config, data, update, name, go, view, setView, onPerformance, initialFilter }) {
  const [filter, setFilter] = useState(initialFilter || "all");
  const [q, setQ] = useState("");
  const [chip, setChip] = useState("all");
  useMarkThreadSeen(update, data, name);
  const open = (aid) => go("assignments/" + aid);
  const unseen = unseenOf(config, data, name);
  const owed = nextOwedOf(config, data, name);
  const sw = (
    <div className="pt-head">
      <div className="pt-seg" role="tablist">
        <button type="button" role="tab" aria-selected={view === "flow"} className={view === "flow" ? "on" : ""} onClick={() => setView("flow")}>Flow</button>
        <button type="button" role="tab" aria-selected={view === "list"} className={view === "list" ? "on" : ""} onClick={() => setView("list")}>List</button>
      </div>
      <Chip onClick={onPerformance}>My performance</Chip>
    </div>
  );

  if (view === "list") {
    const all = visibleAssignments(config, data).map(asg => ({ asg, st: workOf(config, data, asg, name, unseen) }));
    const rows = all.filter(r => chip === "todo" ? (r.st.state === "open" || r.st.state === "closed-until" || r.st.state === "missed")
      : chip === "done" ? (r.st.state === "graded" || r.st.state === "turnedIn") : true);
    const ongoing = rows.filter(r => r.st.state === "ongoing"), dated = rows.filter(r => r.st.state !== "ongoing");
    const months = {};
    dated.forEach(r => { const d = new Date(r.asg.due + ", 2026"); const k = isNaN(d) ? "Later" : d.toLocaleDateString("en-US", { month: "long" }); (months[k] = months[k] || []).push(r); });
    return (
      <div className="pt-body" style={{ gap: 16 }}>
        {sw}
        <div className="pt-chips">
          {[["all", "All", ""], ["todo", "To do", "due"], ["done", "Done", "done"]].map(([id, say, kind]) => (
            <Chip key={id} on={chip === id} kind={kind} onClick={() => setChip(id)}>{say}</Chip>
          ))}
        </div>
        {Object.entries(months).map(([m, rs]) => (
          <div key={m} className="pt-day"><Sec name={m} /><div className="pt-stack">
            {rs.map(r => <WorkRow key={r.asg.id} asg={r.asg} st={r.st} ring={owed && owed.asg.id === r.asg.id} onOpen={() => open(r.asg.id)} />)}
          </div></div>
        ))}
        {ongoing.length ? <div className="pt-day"><Sec name="All quarter" /><div className="pt-stack">
          {ongoing.map(r => <WorkRow key={r.asg.id} asg={r.asg} st={r.st} onOpen={() => open(r.asg.id)} />)}
        </div></div> : null}
        {!rows.length ? <p className="pt-quiet" style={{ textAlign: "center", padding: "16px 0" }}>Nothing here yet.</p> : null}
      </div>
    );
  }

  const needle = q.trim().toLowerCase();
  const rows = flowOf(config, data, name).filter(e => filter === "all" || e.tags.includes(filter))
    .filter(e => !needle || [e.title, e.text, ...e.say].filter(Boolean).join(" ").toLowerCase().includes(needle));
  const empty = filter === "messages" && !rows.length && !needle;
  return (
    <>
      <div className="pt-body" style={{ gap: 16 }}>
        {sw}
        <label className="pt-notice" style={{ padding: "0 14px", minHeight: 44, background: "var(--surface-card)", boxShadow: "0 0 0 1px var(--line-strong)" }}>
          {I.search()}
          <input type="search" className="pt-focus" value={q} onChange={e => setQ(e.target.value)} placeholder="Search" aria-label="Search my work"
            style={{ flex: 1, border: 0, background: "transparent", outline: 0, fontSize: 16, minWidth: 0 }} />
        </label>
        <div className="pt-chips">
          {FLOW_FILTERS.map(f => <Chip key={f.id} on={filter === f.id} kind={f.kind} onClick={() => setFilter(f.id)}>{f.label}</Chip>)}
        </div>
        {owed && (filter === "all" || filter === "work") ? (
          <div className="pt-notice" style={{ boxShadow: "inset 0 0 0 2px var(--ca-accent)", background: "var(--surface-card)" }}>
            {I.pin()}
            <span className="txt">Your <b>{owed.asg.title}</b> is due {dueWords(owed.asg.due, owed.asg.dueTime)}</span>
            <Io kind="go" onClick={() => open(owed.asg.id)}>Submit</Io>
          </div>
        ) : null}
        {empty ? (
          <div className="pt-empty">
            <DrFace config={config} size={72} />
            <span className="pt-secName" style={{ fontSize: 26 }}>{drShort(config)}</span>
            {config.instructor?.officeHours ? <p className="pt-quiet" style={{ fontSize: 15 }}><b>Office hours</b> {config.instructor.officeHours}</p> : null}
            {schedulingLinkOf(config) ? <Btn kind="plain" href={schedulingLinkOf(config)}>Make a meeting</Btn> : null}
          </div>
        ) : rows.length ? (
          <Days rows={rows} render={e => <FlowRow key={e.id} config={config} data={data} name={name} e={e} onOpen={open} />} />
        ) : <p className="pt-quiet" style={{ textAlign: "center", padding: "16px 0" }}>{needle ? "Nothing matches." : "Nothing here yet."}</p>}
      </div>
      <Composer config={config} update={update} name={name} />
    </>
  );
}

// ─── My performance, a sheet ───
export function PerformanceSheet({ config, data, name, go, onClose }) {
  const c = counts(config, data, name);
  const unseen = unseenOf(config, data, name);
  const rows = visibleAssignments(config, data).map(asg => ({ asg, st: workOf(config, data, asg, name, unseen) }));
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pt-scrim" onClick={onClose}>
      <div className="pt-sheet pt-root" role="dialog" aria-label="My performance" onClick={e => e.stopPropagation()}>
        <div className="pt-handle" />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="pt-secSub" style={{ color: "var(--ca-accent-ink)" }}>My performance</span>
            <h3 className="pt-h1" style={{ fontSize: 26 }}>{name}</h3>
          </div>
          <button type="button" className="pt-close pt-focus" onClick={onClose} aria-label="Close">{I.x(18)}</button>
        </div>
        <div className="pt-tiles">
          <div className="pt-tile"><span className="pt-tileN">{c.graded}</span><span className="pt-tileL">Graded</span></div>
          <div className="pt-tile"><span className="pt-tileN">{c.todo}</span><span className="pt-tileL">To do</span></div>
          <div className="pt-tile"><span className="pt-tileN">{c.missed}</span><span className="pt-tileL">Missed</span></div>
        </div>
        <div className="pt-grades">
          {rows.map(({ asg, st }) => (
            <button type="button" key={asg.id} className="r pt-focus" onClick={() => { onClose(); go("assignments/" + asg.id); }}>
              <span className="w">{asg.weight ? asg.weight + "%" : ""}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{asg.title}</span>
              <span className="g">
                {st.letter ? <span className="pt-gpill done">{st.letter}</span> : st.state === "ongoing" ? <span className="pt-gpill off">Ongoing</span> : null}
                <span className="pt-chev" aria-hidden="true">›</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── one challenge ───
export function ChallengePage({ config, data, update, name, id, go }) {
  const asg = visibleAssignments(config, data).find(a => a.id === id);
  const [draft, setDraft] = useState("");
  const [fold, setFold] = useState(false);
  // Turning it in late, and asking for a regrade: each a link and a reason.
  const [lateLink, setLateLink] = useState("");
  const [lateWhy, setLateWhy] = useState("");
  const [asking, setAsking] = useState(false);
  const [regradeWhy, setRegradeWhy] = useState("");
  const [regradeLink, setRegradeLink] = useState("");
  const unseen = unseenOf(config, data, name);
  const st = asg ? workOf(config, data, asg, name, unseen) : null;
  // Opening the page is reading the grade.
  useEffect(() => { if (st?.isNew && update) update(prev => markSeen(prev, id, name)); }, [id, st?.isNew]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { try { window.scrollTo({ top: 0 }); } catch { /* server */ } }, [id]);
  if (!asg) return <p className="pt-quiet">No challenge here.</p>;

  const canSend = st.state !== "closed-until";
  // A message with a web address in it is work turned in; anything else is a
  // note. Either way the student wrote one thing in one box.
  const send = () => {
    const text = draft.trim();
    if (!text || !update || !canSend) return;
    const link = firstLink(text);
    update(prev => {
      const al = { ...(prev.assignmentLog || {}) };
      const byStudent = { ...(al[asg.id] || {}) };
      const event = link
        ? { id: genId(), ts: Date.now(), type: "submission", link, text: text.replace(link, "").trim() }
        : { id: genId(), ts: Date.now(), type: "comment", from: "student", text };
      byStudent[name] = [...(byStudent[name] || []), event];
      al[asg.id] = byStudent;
      return { ...prev, assignmentLog: al };
    });
    setDraft("");
  };
  const addEvent = (event) => update && update(prev => {
    const al = { ...(prev.assignmentLog || {}) };
    const byStudent = { ...(al[asg.id] || {}) };
    byStudent[name] = [...(byStudent[name] || []), { id: genId(), ts: Date.now(), ...event }];
    al[asg.id] = byStudent;
    return { ...prev, assignmentLog: al };
  });
  // Andrew, 2026-10-06: "I also need the ability for students to turn in work
  // late", and "it says turn in late, and they can explain why." Past the due
  // date with nothing in, the challenge takes a link and a reason.
  const turnInLate = () => {
    const link = lateLink.trim();
    if (!link || !lateWhy.trim()) return;
    addEvent({ type: "submission", link, text: "", why: lateWhy.trim() });
    setLateLink(""); setLateWhy("");
  };
  // One regrade per challenge, once a grade is out.
  const asked = regradeOf(alive(data?.assignmentLog?.[asg.id]?.[name]));
  const requestRegrade = () => {
    if (!regradeWhy.trim() || asked) return;
    addEvent({ type: "regrade", text: regradeWhy.trim(), link: firstLink(regradeLink.trim()) || regradeLink.trim() });
    setRegradeWhy(""); setRegradeLink(""); setAsking(false);
  };
  const lateBox = st.state === "missed" && update && !isProfileTask(asg) ? (
    <div className="pt-stack">
      <Sec name="Turn in late" />
      <input className="pt-field pt-focus" value={lateLink} onChange={e => setLateLink(e.target.value)} aria-label="A link" placeholder="A link" />
      <textarea className="pt-field pt-focus" value={lateWhy} onChange={e => setLateWhy(e.target.value)} aria-label="Why is it late?" placeholder="Why is it late?" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Btn onClick={turnInLate} disabled={!lateLink.trim() || !lateWhy.trim()}>Turn in late</Btn>
        <span className="pt-quiet" style={{ padding: 0, fontSize: 15 }}>{config.instructor?.email || "Your instructor"} needs access to your link.</span>
      </div>
    </div>
  ) : null;
  const regradeBox = st.state === "graded" && update && !isProfileTask(asg) && !asked ? (
    asking ? (
      <div className="pt-stack">
        <textarea className="pt-field pt-focus" value={regradeWhy} onChange={e => setRegradeWhy(e.target.value)} aria-label="Why should this be regraded?" placeholder="Why should this be regraded?" autoFocus />
        <input className="pt-field pt-focus" value={regradeLink} onChange={e => setRegradeLink(e.target.value)} aria-label="A new link (optional)" placeholder="A new link (optional)" />
        <div className="pt-acts">
          <Btn onClick={requestRegrade} disabled={!regradeWhy.trim()}>Send request</Btn>
          <Io onClick={() => setAsking(false)}>Cancel</Io>
        </div>
      </div>
    ) : <div><Io onClick={() => setAsking(true)}>Request a regrade</Io></div>
  ) : null;

  const tint = tintOf(st) || "";
  const words = String(asg.description || "").trim();
  const more = asg.instructionsUrl ? <div><Lnk href={asg.instructionsUrl}>More instructions</Lnk></div> : null;
  const instructions = (words || asg.instructionsUrl) ? (
    st.state === "open" || st.state === "missed"
      ? <div className="pt-stack">{words ? <p className="pt-text" style={{ fontSize: 17 }}>{words}</p> : null}{more}</div>
      : <div className="pt-stack">
          <div className="pt-acts"><Io onClick={() => setFold(v => !v)}>Instructions</Io>{st.state === "turnedIn" && canSend ? <span className="pt-quiet" style={{ padding: 0 }}>Send another link below.</span> : null}</div>
          {fold ? <>{words ? <p className="pt-text" style={{ fontSize: 17 }}>{words}</p> : null}{more}</> : null}
        </div>
  ) : null;

  const box = canSend && !isProfileTask(asg) ? (
    <div className="pt-stack">
      <textarea className="pt-field pt-focus" value={draft} onChange={e => setDraft(e.target.value)} aria-label="Send a message or a link"
        placeholder={st.state === "graded" ? "Write to " + drShort(config) + " about this" : st.state === "open" ? "A message, a link, or both" : "Ask about this challenge"} style={{ minHeight: 72 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Btn onClick={send} disabled={!draft.trim()}>{st.state === "open" ? "Submit link" : "Send"}</Btn>
        {st.state === "open" ? <span className="pt-quiet" style={{ padding: 0, fontSize: 15 }}>{config.instructor?.email || "Your instructor"} needs access to your link.</span> : null}
      </div>
    </div>
  ) : isProfileTask(asg) ? <div><Btn onClick={() => go("you")}>Your card</Btn></div> : null;

  const top = (
    <div className={"pt-row " + tint} style={{ flexDirection: "column", alignItems: "stretch", gap: 12, padding: 20 }}>
      <p className="pt-title">{asg.title}</p>
      {st.state === "graded" ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          {/* A word as long as Completed with Revisions comes down a size and
              wraps, so it fits a phone. */}
          <span className="pt-tileN" style={{ fontSize: String(st.letter || "").length > 12 ? 28 : 40, lineHeight: 1.1, color: "var(--pt-done-ink)" }}>{st.letter}</span>
          <span className="pt-meta" style={{ color: "var(--text-primary)" }}><span>Graded {whenWords(st.grade?.ts)}</span>{asg.weight ? <Gm>{asg.weight}%</Gm> : null}</span>
        </div>
      ) : (
        <p className={"pt-when " + tint}><span>{lineOf(asg, st)}</span>{asg.weight ? <Gm>{asg.weight}%</Gm> : null}</p>
      )}
      {st.state === "graded" && st.grade?.bucket ? null : null}
      {st.state === "graded" && st.comments?.length === 0 ? null : null}
      {st.state === "graded" ? <p className="pt-meta">{st.last ? "Turned in " + whenWords(st.last.ts) + " · " : ""}Due {dueWords(asg.due, asg.dueTime)}</p>
        : st.state === "turnedIn" ? <p className="pt-meta">Due {dueWords(asg.due, asg.dueTime)}</p>
        : st.state === "closed-until" ? <div className="pt-acts"><span className="pt-io off">{opensWords(asg)}</span></div> : null}
      {instructions}
      {regradeBox}
      {st.state === "open" ? box : lateBox}
    </div>
  );

  const feed = feedOf(config, data, asg, name).filter(m => m.kind !== "due" || m.at);
  return (
    <div className="pt-body">
      {top}
      {st.state === "graded" ? <Sec name="About this work" /> : null}
      {st.state !== "open" ? box : null}
      <div className="pt-stack">
        {feed.map(m => {
          const mine = m.from === "student";
          const face = mine ? <Face config={config} data={data} name={name} /> : <DrFace config={config} />;
          const say = m.kind === "grade" ? ["Your ", asg.title, " submission has been graded"]
            : m.kind === "regrade" ? ["You asked for a regrade on " + dayWords(m.at).date + "."]
            : m.kind === "sent" ? ["You turned in ", asg.title]
            : m.kind === "due" ? ["Your ", asg.title, " is due " + m.text.replace(/^Due /, "")]
            : mine ? ["You wrote"] : [drShort(config) + " wrote"];
          const link = m.kind === "sent" ? firstLink(m.text) : m.kind === "regrade" ? m.link : "";
          const text = m.kind === "sent" ? m.text.replace(link, "").trim() : m.kind === "due" ? "" : m.text;
          const tintM = m.kind === "grade" ? "done" : m.kind === "due" ? "due" : mine ? "me" : "dr";
          return (
            <div key={m.id} className={"pt-row " + tintM + (mine ? "" : " right")}>
              <div className="pt-dcol">{face}</div>
              <div className="pt-main">
                <Say say={say} />
                {m.kind === "grade" ? <p className="pt-when done"><span>{m.letter}</span></p> : null}
                {m.kind === "grade" && m.means ? <p className="pt-text">{m.means}</p> : null}
                {m.why ? <p className="pt-text"><strong>Late: </strong>{m.why}</p> : null}
                {text ? <p className="pt-text">{text}</p> : null}
                {link ? <div><Lnk href={link}>{hostOf(link)}</Lnk></div> : null}
                <p className="pt-meta">
                  <span>{m.at ? whenWords(m.at) : ""}</span>
                  {mine && m.kind !== "grade" && m.kind !== "regrade" && update ? (
                    <button type="button" className="pt-focus" onClick={() => update(prev => deletePatch(prev, asg.id, name, m.id, name))}
                      style={{ background: "none", border: 0, padding: 0, minHeight: 28, fontSize: 13, fontWeight: 600, color: "var(--state-late)", cursor: "pointer" }}>Delete</button>
                  ) : null}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

