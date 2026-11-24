// The five student pages of the Primary Bold mockups, on the site's own data:
// Home, My work, Schedule, Class and Questions.
//
// docs/primary-bold/BRIEF.md has the rules. Each page takes what the page
// it stands in for takes (portal/Shell.jsx) and calls the same functions, so
// a challenge, a day or a question cannot read differently here.
//
// Left out on purpose, because Andrew has not answered yet (the brief's open
// questions): the Remind me buttons on a to-do challenge.

import { useEffect, useMemo, useState } from "react";
import { nameShown } from "../roster.js";
import { nextOwedOf } from "../portal/work.js";
import { weekWords } from "../portal/StudentHome.jsx";
import { nextClassFacts, followingClassFacts, nextMeeting } from "../HomeCards.jsx";
import { daysOfWeek, studentItems, inWeekOrder, withoutHidden, sourceOf } from "../ScheduleCard.jsx";
import { dayTitles } from "../days.js";
import { kindOf } from "../dayplan.js";
import { isAway, idFor } from "../attendance.js";
import { classmatesOf } from "../RosterCard.jsx";
import { profileOf } from "../Face.jsx";
import { ProfileSheet, DrSheet } from "../portal/ClassPage.jsx";
import { useQuestions } from "../questions.js";
import { SORTS, sortQuestions, onThePage, isAnswered, askedBy } from "../QuestionsCard.jsx";
import { hideLurkers } from "../sections.js";
import { directHref, sendMessage } from "../portal/MyWork.jsx";
import { feedOf } from "../AssignmentCards.jsx";
import { markSeen, regradeOf, alive } from "../grades.js";
import { isProfileTask } from "../profileTask.js";
import { isCheckin } from "../checkins.js";
import { CheckinForm } from "../CheckinCard.jsx";
import { genId } from "../../utils.jsx";
import { dueWords, whenWords, firstLink, hostOf, drShort, dateOf } from "../portal/bits.jsx";
import { Face, Cell, Pill, Tile, Strip, StripKey, Stamp, Timeline, Check, Chevron, Up } from "./bits.jsx";
import { rowsFor, lineFor, photoOf, monthOf, dueDay } from "./data.js";

const drName = (config) => config.instructor?.name || "Instructor";
const Dr = ({ config, size = "" }) => <Face name={drName(config)} photo={config.instructor?.photo || ""} size={size} ring="c118" />;
const Me = ({ data, name, size = "", ring = "go" }) => <Face name={nameShown(data, name)} photo={photoOf(data, name)} size={size} ring={ring} />;
const dayOf = (ts) => { try { return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); } catch { return ""; } };
const timeOf = (ts) => { try { return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
// A grade longer than two letters (Completed with Revisions) is written out beside the block.
const wordOf = (r) => (r.st.state === "graded" && !r.mark ? String(r.st.letter || "") : "");

// ─── the next class, as the dark card ───
function NextClass({ config, data, blockOf, section }) {
  const next = nextClassFacts(config, data, blockOf, section);
  if (!next) return null;
  const after = followingClassFacts(config, data, blockOf, section, next.date);
  const off = kindOf((data?.dayPlans || {})[next.date]) === "off";
  return <div className="hero">
    <p className="t1">{next.weekday}, {next.longDate}</p>
    {next.title ? <p>{next.title}</p> : null}
    {!off && (next.time || next.location) ? <p className="t3">{[next.time, next.location].filter(Boolean).join(" · ")}</p> : null}
    {next.note ? <p className="text">{next.note}</p> : null}
    {after && after.date !== next.date ? <><hr /><p className="t3">{after.weekday}, {after.longDate}{after.title ? ": " + after.title : ""}</p></> : null}
  </div>;
}

// One challenge in the small panel on Home.
function Detail({ config, row, go }) {
  if (!row) return null;
  const { asg, st } = row;
  return <div className={"panel s-" + row.state}>
    <div className="hd"><Tile state={row.state} mark={row.mark} size="lg" />
      <div><p className="t1">{asg.title}</p><p className="t3">{[wordOf(row), lineFor(asg, st), asg.weight ? asg.weight + "%" : ""].filter(Boolean).join(" · ")}</p></div></div>
    {st.comments?.[0] ? <div className="say"><Dr config={config} /><p>{st.comments[0]}</p></div> : null}
    {st.state === "closed-until" ? null : <div className="rowx"><Pill kind={row.state === "todo" || row.state === "late" ? "due" : ""} onClick={() => go("assignments/" + asg.id)}>Open</Pill></div>}
  </div>;
}

/** Home: the quarter as one strip, the next class, and the challenge under the block that was clicked. */
export function Home({ config, data, blockOf, section, name, go, notice }) {
  const rows = useMemo(() => rowsFor(config, data, name), [config, data, name]);
  const owed = useMemo(() => nextOwedOf(config, data, name), [config, data, name]);
  const [pick, setPick] = useState("");
  const sel = pick || owed?.asg.id || (rows.find(r => r.state === "in") || rows[0] || {}).id || "";
  const wk = weekWords(config, data);
  const api = useQuestions(config.storageKey);
  const latest = sortQuestions(hideLurkers(onThePage(api.items), name), "answered").find(isAnswered);
  return <div className="body">
    <div className="rowx"><p className="t1">{nameShown(data, name)}</p>{wk.n ? <span className="t3">Week {wk.n}{wk.range ? ", " + wk.range : ""}</span> : null}</div>
    <div className="main" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", alignItems: "stretch" }}>
      <NextClass config={config} data={data} blockOf={blockOf} section={section} />
      <Detail config={config} row={rows.find(r => r.id === sel)} go={go} />
    </div>
    {rows.length ? <><Strip items={rows} sel={sel} touched={!!pick} onPick={setPick} /><StripKey /></> : null}
    <div className="main" style={{ gridTemplateColumns: notice ? "1fr 1fr" : "1fr", alignItems: "stretch" }}>
      {notice ? <div className="panel" style={{ animation: "none" }}><p style={{ fontWeight: 600 }}>Note to the class</p><div className="say"><Dr config={config} /><p>{notice}</p></div></div> : null}
      <div className="panel" style={{ animation: "none" }}>
        <div className="rowx"><Pill onClick={() => go("questions")}>Questions</Pill></div>
        {latest ? <>
          <div className="bub"><Face name={askedBy(latest, data?.profiles) || "Classmate"} size="sm" ring="c118" /><span className="b">{latest.text}</span></div>
          <div className="bub his"><Dr config={config} size="sm" /><span className="b">{latest.answer}</span></div>
        </> : null}
      </div>
    </div>
  </div>;
}

// ─── My work ───

// The whole challenge: the grade, his comment, the dates on a line, the buttons, the write box, then the instructions.
function Full({ config, data, update, name, row, go }) {
  const { asg, st } = row;
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const [shake, setShake] = useState(false);
  const [asking, setAsking] = useState(false);
  const [why, setWhy] = useState("");
  const [lateLink, setLateLink] = useState("");
  const [lateWhy, setLateWhy] = useState("");
  useEffect(() => { setDraft(""); setSent(false); setAsking(false); setWhy(""); setLateLink(""); setLateWhy(""); }, [asg.id]);
  // Opening the challenge is reading the grade, as on the live page.
  useEffect(() => { if (st.isNew && update) update(prev => markSeen(prev, asg.id, name)); }, [asg.id, st.isNew]);   // eslint-disable-line react-hooks/exhaustive-deps

  const add = (event) => update && update(prev => {
    const al = { ...(prev.assignmentLog || {}) }, by = { ...(al[asg.id] || {}) };
    by[name] = [...(by[name] || []), { id: genId(), ts: Date.now(), ...event }];
    al[asg.id] = by;
    return { ...prev, assignmentLog: al };
  });
  // A message with a web address in it is work turned in; anything else is a note. The live page's rule.
  const send = () => {
    const text = draft.trim();
    if (!text) { setShake(true); setTimeout(() => setShake(false), 450); return; }
    const link = firstLink(text);
    add(link ? { type: "submission", link, text: text.replace(link, "").trim() } : { type: "comment", from: "student", text });
    setDraft(""); setSent(true);
  };
  const direct = directHref(asg);
  const special = isProfileTask(asg) || isCheckin(asg);
  const has = st.state === "graded" || st.state === "turnedIn";
  const canSend = st.state !== "closed-until" && !special && !!update;
  const asked = regradeOf(alive(data?.assignmentLog?.[asg.id]?.[name]));
  const words = String(asg.description || "").trim();
  const feed = feedOf(config, data, asg, name).filter(m => m.kind !== "due" && m.kind !== "grade" && m.at);
  const shown = st.state !== "closed-until" && st.state !== "ongoing" && st.state !== "none";
  const first = st.first || st.last;
  return <div className={"panel s-" + row.state}>
    <div className="hd"><Tile state={row.state} mark={row.mark} size="lg" />
      <div><p className="t1">{asg.title}</p><p className="t3">{[wordOf(row), asg.weight ? asg.weight + "%" : lineFor(asg, st)].filter(Boolean).join(" · ")}</p></div></div>
    {st.comments?.[0] ? <div className="say"><Dr config={config} /><p>{st.comments[0]}</p></div> : null}
    {shown ? <Timeline points={[
      { label: "Turned in", day: first ? dayOf(first.ts) : "", time: first ? timeOf(first.ts) : "", on: !!first },
      { label: "Due", day: dueWords(asg.due, ""), time: asg.dueTime || "", on: !!first },
      { label: "Graded", day: st.grade ? dayOf(st.grade.ts) : "", time: st.grade ? timeOf(st.grade.ts) : "", on: st.state === "graded" },
    ]} /> : null}
    {st.state === "closed-until" ? <p className="t3">{lineFor(asg, st)}</p> : null}
    {isCheckin(asg) ? <div className="old"><CheckinForm config={config} data={data} update={update} name={name} asg={asg} /></div> : null}
    {isProfileTask(asg) ? <div className="rowx"><Pill kind="due" onClick={() => go("you")}>Your card</Pill></div> : null}
    {!special && st.state !== "closed-until" ? <div className="rowx">
      {direct ? (has ? <><Pill href={direct}>Your sheet</Pill><Pill href={direct}>Reopen</Pill></> : <Pill kind="due" href={direct}>Open</Pill>) : null}
      {!direct && st.last?.link ? <a className="pill" href={st.last.link} target="_blank" rel="noreferrer">{hostOf(st.last.link)}</a> : null}
      {st.state === "graded" && !asked && update ? <Pill kind={asking ? "on" : ""} onClick={() => setAsking(v => !v)}>Request a regrade</Pill> : null}
      {st.state === "graded" && asked ? <Stamp>Regrade asked</Stamp> : null}
    </div> : null}
    {asking ? <div className="rowx">
      <input className="write" value={why} onChange={e => setWhy(e.target.value)} placeholder="Why should this be regraded?" aria-label="Why should this be regraded?" />
      <Pill kind="go" disabled={!why.trim()} onClick={() => { add({ type: "regrade", text: why.trim(), link: "" }); setAsking(false); setWhy(""); }}>Send request</Pill>
    </div> : null}
    {st.state === "missed" && !direct && canSend ? <div className="rowx">
      <input className="write" value={lateLink} onChange={e => setLateLink(e.target.value)} placeholder="A link" aria-label="A link" />
      <input className="write" value={lateWhy} onChange={e => setLateWhy(e.target.value)} placeholder="You're welcome to give context as to why this is being submitted late." aria-label="You're welcome to give context as to why this is being submitted late." />
      <Pill kind="due" disabled={!lateLink.trim()} onClick={() => { add({ type: "submission", link: lateLink.trim(), text: "", why: lateWhy.trim(), late: true }); setLateLink(""); setLateWhy(""); }}>Turn in late</Pill>
    </div> : null}
    {canSend ? <div className={"rowx" + (shake ? " shake" : "")}>
      <input className="write" value={draft} onChange={e => { setDraft(e.target.value); setSent(false); }} onKeyDown={e => { if (e.key === "Enter") send(); }}
        placeholder={st.state === "open" && !direct ? "A message, a link, or both" : "Write to " + drShort(config) + " about this"} aria-label={"Write to " + drShort(config) + " about this"} />
      {sent ? <Stamp>Sent</Stamp> : <Pill kind="go" onClick={send}>{st.state === "open" && !direct ? "Submit link" : "Send"}</Pill>}
    </div> : null}
    {feed.length ? <div className="th" style={{ margin: 0, gap: 6 }}>{feed.map(m => {
      const mine = m.from === "student";
      const link = m.kind === "sent" ? firstLink(m.text) : m.kind === "regrade" ? m.link : "";
      const text = [m.why ? "Late: " + m.why : "", m.kind === "sent" ? String(m.text || "").replace(link, "").trim() : m.text].filter(Boolean).join("\n") || (m.kind === "sent" ? "Turned in" : "");
      return <div key={m.id} className={"bub" + (mine ? "" : " his")}>
        {mine ? <Me data={data} name={name} size="sm" /> : <Dr config={config} size="sm" />}
        <span className="b"><span className="text" style={{ display: "block" }}>{text}</span>{link ? <a className="lnk" href={link} target="_blank" rel="noreferrer">{hostOf(link)}</a> : null}<small className="t3" style={{ display: "block" }}>{whenWords(m.at)}</small></span>
      </div>;
    })}</div> : null}
    {words || asg.instructionsUrl ? <>
      <p style={{ fontWeight: 600 }}>Instructions</p>
      {words ? <p className="text">{words}</p> : null}
      {asg.instructionsUrl && !direct ? <div><a className="lnk" href={asg.instructionsUrl}>More instructions</a></div> : null}
    </> : null}
  </div>;
}

/** My work: the list on the narrow side, the whole challenge on the large side. On a phone the challenge takes the screen. */
export function MyWork({ config, data, update, name, go, id }) {
  const rows = useMemo(() => rowsFor(config, data, name), [config, data, name]);
  const owed = useMemo(() => nextOwedOf(config, data, name), [config, data, name]);
  const [f, setF] = useState("All");
  const sel = id || owed?.asg.id || (rows[0] || {}).id || "";
  const row = rows.find(r => r.id === sel);
  const list = rows.filter(r => (f === "To do" ? r.state === "todo" || r.state === "late" : f === "Done" ? r.state === "done" : true));
  let mo = "";
  return <div className={"body" + (id ? " isopen" : "")}>
    <button type="button" className="pill flat back" onClick={() => go("assignments")}><Chevron />Back to My work</button>
    <div className="rowx whead"><p className="t1">My work</p><span className="sp" />{["All", "To do", "Done"].map(x => <Pill key={x} kind={f === x ? "on" : ""} onClick={() => setF(x)}>{x}</Pill>)}</div>
    <div className={"main work" + (id ? " opened" : "")}>
      <div className="list">
        {list.length === 0 ? <p className="empty">Nothing here.</p> : null}
        {list.map(r => {
          const m = monthOf(r.asg.due), head = m && m !== mo ? <p className="t3 mo">{m}</p> : null; mo = m || mo;
          return <div key={r.id} style={{ display: "contents" }}>{head}
            <button type="button" className={"row s-" + r.state + (r.id === sel ? " sel" : "")} aria-pressed={r.id === sel} onClick={() => go("assignments/" + r.id)}>
              <Tile state={r.state} mark={r.mark} /><span>{r.title}</span><span className="dt">{dueDay(r.asg)}</span>
            </button></div>;
        })}
      </div>
      <div className="side">{row ? <Full config={config} data={data} update={update} name={name} row={row} go={go} /> : null}</div>
    </div>
  </div>;
}

// ─── Schedule ───
const isFinals = (w) => /\bfinals\b/i.test(w.topic || "");
const rangeOf = (w) => { const d = w.dates || []; return d.length ? d[0] + (d.length > 1 ? " to " + d[d.length - 1] : "") : ""; };
const startOfToday = () => { const t = new Date(Date.now()); return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(); };

function Coming({ checked, onChange }) {
  const [want, setWant] = useState(null);
  const shown = want === null ? checked : want;
  const press = async () => { const v = !shown; setWant(v); try { await onChange(v); } finally { setWant(null); } };
  return <button type="button" className={"pill" + (shown ? " go" : "")} onClick={press} role="checkbox" aria-checked={shown}>{shown ? <><Check label="" />I'll be there</> : "I will not be there"}</button>;
}

/** Schedule: the quarter as a row of weeks; the picked week's days under the row. */
export function Schedule({ config, data, blockOf, name, mark, go, instructor }) {
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const plans = data?.dayPlans || {};
  const titles = dayTitles(weeks, plans);
  const myId = name && !instructor ? idFor(config, data, name) : "";
  const next = nextMeeting(config, data);
  const t0 = startOfToday();
  const ends = weeks.map(w => Math.max(0, ...(w.dates || []).map(d => dateOf(d)?.getTime() || 0)));
  const nowIdx = next ? weeks.indexOf(next.week) : weeks.findIndex((w, i) => ends[i] >= t0);
  const [wk, setWk] = useState(-1);
  const k = wk >= 0 ? wk : Math.max(nowIdx, 0);
  const w = weeks[k];
  const rows = useMemo(() => (name && !instructor ? rowsFor(config, data, name) : []), [config, data, name, instructor]);
  if (!w) return <div className="body"><p className="empty">No schedule yet.</p></div>;
  const { days, loose } = daysOfWeek(w, withoutHidden(studentItems(w, plans, blockOf), config, data, !!instructor));
  const label = (x, i) => (isFinals(x) ? "Finals" : String(i + 1));
  return <div className="body">
    <div className="strip weeks" style={{ height: 44 }}>{weeks.map((x, i) =>
      <button type="button" key={x.id || i} className={"blk " + (isFinals(x) ? "wd " : "") + (i === nowIdx ? "now" : ends[i] < t0 ? "s-done" : "s-off") + (i === k ? " sel" : "")} style={{ "--x": 1 }} aria-pressed={i === k} aria-label={isFinals(x) ? "Finals" : "Week " + (i + 1)} onClick={() => setWk(i)}>{label(x, i)}</button>)}</div>
    <div className="rowx"><p className="t1">{w.topic || (isFinals(w) ? "Finals" : "Week " + (k + 1))}</p><span className="t3">{[isFinals(w) || !w.topic ? "" : "Week " + (k + 1), rangeOf(w)].filter(Boolean).join(" · ")}</span></div>
    {w.text ? <p className="text">{w.text}</p> : null}
    <div className="list">
      {loose.length ? <div className="day"><span className="when">This week</span><div className="dm"><div className="sunk">{inWeekOrder(loose).map(it => <a key={it.id} className="read" href={it.type === "assignment" && it.asgId ? config.path + "/challenges/" + encodeURIComponent(it.asgId) : it.url || undefined}>{it.title}</a>)}</div></div><span /></div> : null}
      {days.map(d => {
        const items = inWeekOrder(d.items || []);
        const readings = items.filter(it => it.type === "reading"), due = items.filter(it => it.type === "assignment"), other = items.filter(it => it.type !== "reading" && it.type !== "assignment");
        const plan = plans[d.date] || {};
        const meets = d.classDay && kindOf(plan) === "class";
        const t = titles[d.date];
        const title = t?.title && !t.fromWeek ? t.title : "";
        const note = String(plan.studentNote || "").trim(), sub = String(plan.sub || "").trim();
        if (!d.classDay && !items.length) return null;
        return <div key={d.date} className={"day" + (next && next.date === d.date ? " next" : "")}>
          <span className="when">{dueWords(d.date, "")}</span>
          <div className="dm">
            {title ? <span>{title}</span> : d.classDay && kindOf(plan) === "off" ? <span>No class</span> : null}
            {sub ? <span className="t3">{sub}</span> : null}
            {note ? <span className="text">{note}</span> : null}
            {readings.length ? <div className="sunk"><span className="t3">Readings</span>{readings.map(it => {
              const block = blockOf ? blockOf(it.blockId || it.libId) : null, url = it.url || block?.url || "", src = sourceOf(it, block);
              return url ? <a key={it.id} className="read" href={url} target="_blank" rel="noreferrer">{it.title}{src ? <small>{src}</small> : null}</a> : <span key={it.id} className="read">{it.title}{src ? <small>{src}</small> : null}</span>;
            })}</div> : null}
            {other.map(it => <span key={it.id}>{it.title}</span>)}
            {due.map(it => { const r = rows.find(x => x.id === it.asgId);
              return <button type="button" key={it.id} className="dueit" onClick={() => (it.asgId ? go("assignments/" + it.asgId) : it.url ? window.location.assign(it.url) : null)}><Tile state={r ? r.state : "todo"} mark={r ? r.mark : ""} />{String(it.title || "").replace(/\s+due$/i, "")}</button>; })}
          </div>
          {meets && myId && mark ? <Coming checked={!isAway(data, d.date, myId)} onChange={(coming) => mark(d.date, myId, !coming)} /> : <span />}
        </div>;
      })}
    </div>
  </div>;
}

// ─── Class ───

/** Class: the student's own card, then Dr. Ishak, then the classmates in their section as big faces. */
export function ClassPg({ config, data, update, setPhoto, name, go }) {
  const [sel, setSel] = useState("");
  const [editing, setEditing] = useState(false);
  const [more, setMore] = useState(false);
  const mates = classmatesOf(config, data, "student", name).filter(s => s.name !== name);
  const p = sel ? profileOf(data, sel) || {} : null;
  return <div className="body">
    <div className="main" style={{ gridTemplateColumns: "1fr 1fr" }}>
      <div className="panel" style={{ animation: "none" }}><div className="me"><Me data={data} name={name} size="lg" /><p className="t1">{nameShown(data, name)}</p><span className="sp" />{update ? <Pill onClick={() => setEditing(true)}>Edit profile</Pill> : null}</div></div>
      <div className="panel" style={{ animation: "none" }}><div className="me"><Dr config={config} size="lg" /><div><p className="t1">{drShort(config)}</p><p className="t3">Your instructor</p></div></div>
        <div className="rowx"><Pill onClick={() => go("messages")}>Message</Pill><Pill onClick={() => setMore(true)}>See more</Pill></div></div>
    </div>
    <div className="main" style={sel ? undefined : { gridTemplateColumns: "1fr" }}>
      <div className="zone solid" style={{ "--c": "var(--line)" }}><div className="zb" style={{ gap: "14px 10px" }}>
        {mates.map(s => <Cell key={s.name} name={nameShown(data, s.name)} photo={photoOf(data, s.name)} size="lg" ring="c118" on={sel === s.name} dim={!!sel && sel !== s.name} onClick={() => setSel(sel === s.name ? "" : s.name)} />)}
      </div></div>
      {sel ? <div className="panel" key={sel}><div className="hd"><Face name={nameShown(data, sel)} photo={photoOf(data, sel)} size="lg" ring="c118" /><p className="t1">{nameShown(data, sel)}</p></div>
        <div className="who">
          {[p.year, p.hometown].filter(Boolean).length ? <p className="t3">{[p.year, p.hometown].filter(Boolean).join(" · ")}</p> : null}
          {p.motto ? <p>{p.motto}</p> : null}
          {p.about ? <p className="text">{p.about}</p> : null}
        </div></div> : null}
    </div>
    {editing ? <ProfileSheet config={config} data={data} update={update} setPhoto={setPhoto} name={name} onClose={() => setEditing(false)} /> : null}
    {more ? <DrSheet config={config} go={go} onClose={() => setMore(false)} /> : null}
  </div>;
}

// ─── Questions ───

/** Questions, as a conversation: a question is a bubble from the student, his answer a bubble back. */
export function Questions({ config, data, name, instructor }) {
  const api = useQuestions(config.storageKey);
  const [how, setHow] = useState("answered");
  const [open, setOpen] = useState({});
  const [draft, setDraft] = useState("");
  const [shake, setShake] = useState(false);
  const [reply, setReply] = useState({});
  const items = sortQuestions(instructor ? onThePage(api.items) : hideLurkers(onThePage(api.items), name), how);
  const ask = () => {
    const text = draft.trim();
    if (!text) { setShake(true); setTimeout(() => setShake(false), 450); return; }
    api.add({ text, who: name, anon: false }); setDraft(""); setHow("asked");
  };
  return <div className="body"><div className="th">
    <div className="rowx"><p className="t1">Questions</p><span className="sp" />{SORTS.map(([id, say]) => <Pill key={id} kind={how === id ? "on" : ""} onClick={() => setHow(id)}>{say}</Pill>)}</div>
    {instructor ? null : <div className={"bub ask" + (shake ? " shake" : "")}><Me data={data} name={name} /><span className="b"><input className="write" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(); }} placeholder="Ask a question" aria-label="Ask a question" /><Pill kind="go" onClick={ask}>Ask</Pill></span></div>}
    {api.items === null ? <p className="empty">Loading.</p> : items.length === 0 ? <p className="empty">No questions yet.</p> : null}
    {items.map(q => {
      const who = askedBy(q, data?.profiles), answered = isAnswered(q), shown = answered && open[q.id] !== false;
      const mine = (q.thanksQ || []).includes(name);
      return <div className="qa" key={q.id}>
        <div className="bub"><Face name={who || "Classmate"} photo={who ? photoOf(data, q.who) : ""} ring="c118" />
          {answered ? <button type="button" className="b" aria-expanded={shown} onClick={() => setOpen(o => ({ ...o, [q.id]: !shown }))}>{q.text}</button> : <span className="b">{q.text}</span>}</div>
        <div className="meta">{who ? <span className="t3">{who}</span> : null}<Pill kind={mine ? "on" : ""} label="Appreciate" onClick={() => api.appreciate(q.id, "question", name)}><Up />{(q.thanksQ || []).length}</Pill></div>
        {shown ? <div className="bub his"><Dr config={config} /><span className="b text">{q.answer}</span></div> : null}
        {instructor && !answered ? <div className="bub his ask"><Dr config={config} /><span className="b"><input className="write" value={reply[q.id] || ""} onChange={e => setReply(r => ({ ...r, [q.id]: e.target.value }))} placeholder="Answer" aria-label="Answer" /><Pill kind="go" disabled={!String(reply[q.id] || "").trim()} onClick={() => { api.answer(q.id, reply[q.id].trim()); setReply(r => ({ ...r, [q.id]: "" })); }}>Answer</Pill></span></div> : null}
      </div>;
    })}
  </div></div>;
}
