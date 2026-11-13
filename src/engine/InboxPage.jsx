// The inbox: /inbox. Everything students have written that waits on Andrew,
// every class in one list, laid out the way mail is.
//
// Andrew, 2026-11-13: "i need an inbox ... i want this to work for an idiot
// ... make it look like gmail or something." The rules are in owed.js: an
// item stays here until he replies, presses Done, or puts it off with Later.
// Opening a row does nothing to it. Oldest first, and a row waiting more
// than two days is red.
//
// A row opens in place: the conversation, the reply box with his canned
// answers, and the buttons. Notes that are only about turning work in late
// are on To Grade instead (LateNotes below, drawn by GradingPage.jsx), and
// any row can be moved between the two.

import { useEffect, useMemo, useState } from "react";
import { currentClasses } from "../config/registry.js";
import { useClassData } from "./store.js";
import { usePhotos, useWithPhotos } from "./photos.js";
import { assignmentsOf } from "./profileTask.js";
import { realStudents } from "./sections.js";
import { rosterOf, nameShown } from "./roster.js";
import { owedOf, isOverdue, donePatch, replyPatch, laterPatch, routePatch, plain } from "./owed.js";
import { PORTAL_CSS } from "./portal/style.js";
import { Face } from "./portal/bits.jsx";
import { baseCSS } from "./themes.js";
import { ThemeStyle } from "./ThemeShell.jsx";
import TopNav, { NAV_TEACH } from "./TopNav.jsx";
import { lastClass } from "./InstructorNav.jsx";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
// His canned answers, the same three the class's Messages page offers (YouCard.jsx).
const CANNED = ["Hope you're feeling better!", "Thanks for letting me know.", "Okay, take care."];
const DAY = 86400000;

const dateWords = (ts, now = Date.now()) => {
  const d = new Date(ts), n = new Date(now);
  const same = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  return same ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const fullWords = (ts) => new Date(ts).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
// Tomorrow morning, and a week from this morning.
const morning = (days) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(8, 0, 0, 0); return d.getTime(); };

/** One class, loaded once and reported up: its config, data, writer and what is owed. */
function ClassFeed({ config, onFeed }) {
  const [stored, update] = useClassData(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const data = useWithPhotos(stored, photos);
  const owed = useMemo(() => data ? owedOf(data, assignmentsOf(config, data), realStudents(config, rosterOf(config, data)).map(s => s.name)) : null, [config, data]);
  useEffect(() => { if (owed) onFeed(config.id, { config, data, update, owed }); }, [config, data, update, owed, onFeed]);
  return null;
}

/** Every running class's feed, by class id, and whether all of them are in. */
export function useFeeds() {
  const classes = useMemo(() => currentClasses().filter(c => !c.demo), []);
  const [feeds, setFeeds] = useState({});
  const onFeed = useMemo(() => (id, feed) => setFeeds(prev => ({ ...prev, [id]: feed })), []);
  const nodes = classes.map(c => <ClassFeed key={c.id} config={c} onFeed={onFeed} />);
  return { classes, feeds, nodes, loaded: classes.every(c => feeds[c.id]) };
}

const rowsOf = (classes, feeds, slot) => classes.flatMap(c => (feeds[c.id]?.owed[slot] || []).map(item => ({ ...item, classId: c.id, id: c.id + "|" + item.key })))
  .sort((x, y) => x.since - y.since);

// What the row is about, where a subject line would be.
const subjectOf = (item) => item.kind === "challenge" ? item.title : item.kind === "request" ? (item.bug ? "Bug" : "Request") : "";

// The conversation an open row shows: the thread, or the words on the challenge.
function talkOf(item) {
  if (item.kind === "thread") return item.thread.filter(m => m.text || m.kind === "meeting" || m.kind === "got_it")
    .map(m => ({ id: m.id, mine: m.from === "instructor", ts: m.ts, text: m.text || (m.kind === "got_it" ? "Thumbs up" : "Make a meeting") }));
  if (item.kind === "challenge") return item.log.filter(e => e.type === "comment" || e.type === "regrade" || (e.type === "submission" && (e.why || e.text)))
    .filter(e => !e.auto).map(e => ({ id: e.id, mine: e.type === "comment" && e.from !== "student", ts: e.ts, text: e.text || e.why || plain(e.html) }));
  return [{ id: item.key, mine: false, ts: item.ts, text: item.text }];
}

function Open({ item, feed, act, where }) {
  const { config, data } = feed;
  const [draft, setDraft] = useState("");
  const talk = talkOf(item);
  const send = () => { if (draft.trim()) act(item, d => replyPatch(d, item, draft)); };
  const href = item.kind === "challenge" ? "/grades/" + config.id + "/flow?a=" + encodeURIComponent(item.aid)
    : item.name ? config.path + "/messages/" + encodeURIComponent(item.name) : "";
  return (
    <div className="ib-open">
      <div className="ib-talk">
        {talk.map(m => (
          <div key={m.id} className={"ib-msg" + (m.mine ? " mine" : "")}>
            <p className="ib-who">{m.mine ? "You" : nameShown(data, item.name)}<span>{fullWords(m.ts)}</span></p>
            <p className="ib-words">{m.text}</p>
          </div>
        ))}
      </div>
      {item.name ? (
        <>
          <textarea className="pt-field pt-focus ib-box" value={draft} onChange={e => setDraft(e.target.value)} aria-label={"Reply to " + nameShown(data, item.name)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send(); }} />
          <div className="ib-canned">{CANNED.map(c => <button key={c} type="button" className="pt-chip pt-focus" onClick={() => setDraft(d => (d.trim() ? d.trim() + " " : "") + c)}>{c}</button>)}</div>
        </>
      ) : null}
      <div className="ib-acts">
        {item.name ? <button type="button" className="pt-btn pt-focus" disabled={!draft.trim()} onClick={send}>Send</button> : null}
        <button type="button" className="pt-chip pt-focus" onClick={() => act(item, d => donePatch(d, item))}>Done</button>
        {where !== "later" ? <button type="button" className="pt-chip pt-focus" onClick={() => act(item, d => laterPatch(d, item, morning(1)))}>Later: tomorrow</button> : null}
        {where !== "later" ? <button type="button" className="pt-chip pt-focus" onClick={() => act(item, d => laterPatch(d, item, morning(7)))}>Later: next week</button> : null}
        {where === "later" ? <button type="button" className="pt-chip pt-focus" onClick={() => act(item, d => laterPatch(d, item, 0))}>Back to inbox</button> : null}
        {item.kind !== "request" ? <button type="button" className="pt-chip pt-focus" onClick={() => act(item, d => routePatch(d, item, item.route === "late" ? "msg" : "late"))}>{item.route === "late" ? "Move to inbox" : "Move to To Grade"}</button> : null}
        {href ? <a className="ib-link pt-focus" href={href}>{item.kind === "challenge" ? "Grade Flow" : "Thread"}</a> : null}
      </div>
    </div>
  );
}

/** The list, mail's way: a tick box, the face and name, the subject and first words, the date. */
export function MailList({ rows, feeds, where }) {
  const [openId, setOpenId] = useState("");
  const [picked, setPicked] = useState({});
  const now = Date.now();
  const act = (item, patch) => { feeds[item.classId].update(patch); setOpenId(""); setPicked(p => { const { [item.id]: _, ...rest } = p; return rest; }); };
  const chosen = rows.filter(r => picked[r.id]);
  const all = rows.length > 0 && chosen.length === rows.length;
  return (
    <div className="ib-list">
      {rows.length ? (
        <div className="ib-bar">
          <input type="checkbox" className="ib-tick" checked={all} aria-label="Select all" onChange={() => setPicked(all ? {} : Object.fromEntries(rows.map(r => [r.id, true])))} />
          {chosen.length ? <button type="button" className="pt-chip pt-focus" onClick={() => chosen.forEach(r => act(r, d => donePatch(d, r)))}>{"Done with " + chosen.length}</button> : null}
        </div>
      ) : null}
      {rows.map(item => {
        const feed = feeds[item.classId];
        const open = openId === item.id;
        const red = where !== "later" && isOverdue(item, now);
        const subject = subjectOf(item);
        return (
          <div key={item.id} className={"ib-item" + (open ? " open" : "") + (red ? " red" : "")}>
            <div className="ib-row">
              <input type="checkbox" className="ib-tick" checked={!!picked[item.id]} aria-label={"Select " + (item.name || subject)} onChange={() => setPicked(p => ({ ...p, [item.id]: !p[item.id] }))} />
              <button type="button" className="ib-hit pt-focus" aria-expanded={open} onClick={() => setOpenId(open ? "" : item.id)}>
                {item.name ? <Face config={feed.config} data={feed.data} name={item.name} size={32} /> : <span className="ib-noface" />}
                <span className="ib-name">{item.name ? nameShown(feed.data, item.name) : subject}</span>
                <span className="ib-code" style={{ color: feed.config.accent }}>{feed.config.code}</span>
                <span className="ib-line">{subject && item.name ? <b>{subject}</b> : null}<span className="ib-snip">{item.text.replace(/\s+/g, " ")}</span></span>
                <span className="ib-date">{where === "later" ? "Back " + dateWords(item.until, now) : dateWords(item.since, now)}</span>
              </button>
            </div>
            {open ? <Open item={item} feed={feed} act={act} where={where} /> : null}
          </div>
        );
      })}
    </div>
  );
}

/** The late notes, on To Grade: the same rows, from the "late" side of every class. */
export function LateNotes({ filter = "" }) {
  const { classes, feeds, nodes, loaded } = useFeeds();
  const rows = loaded ? rowsOf(classes, feeds, "late").filter(r => !filter || r.classId === filter) : [];
  return (
    <>
      <style>{INBOX_CSS}</style>
      {nodes}
      {rows.length ? (
        <section className="ib-late">
          <h2 className="pt-secName">Late notes</h2>
          <MailList rows={rows} feeds={feeds} where="late" />
        </section>
      ) : null}
    </>
  );
}

/** How many wait in the inbox, every class together, or null until known. */
export function InboxCount() {
  const { classes, feeds, nodes, loaded } = useFeeds();
  const n = loaded ? rowsOf(classes, feeds, "msg").length : 0;
  // Drawn in the top bar of every page, so its look is its own, not this page's sheet.
  return <>{nodes}{n ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 20, height: 20, padding: "0 6px", marginLeft: 6, borderRadius: 999, background: TOKENS.TEXT.primary, color: "#fff", fontSize: 12, fontWeight: 700 }}>{n}</span> : null}</>;
}

export default function InboxPage() {
  const { classes, feeds, nodes, loaded } = useFeeds();
  const [tab, setTab] = useState("msg");
  const [filter, setFilter] = useState("");
  useEffect(() => { document.title = "Inbox"; }, []);
  const of = (slot) => loaded ? rowsOf(classes, feeds, slot).filter(r => !filter || r.classId === filter) : [];
  const msg = of("msg"), later = of("later"), late = of("late");
  const rows = tab === "later" ? later : msg;
  return (
    <div data-theme="clean" data-mode="day" className="ca-root pt-root" style={{ minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: F }}>
      <ThemeStyle theme="clean" />
      <style>{baseCSS() + PORTAL_CSS + INBOX_CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 10 }}><TopNav config={lastClass()} tabs={NAV_TEACH} active="inbox" /></div>
      {nodes}
      <div className="ib">
        <div className="ib-head">
          <h1 className="ib-h1">Inbox</h1>
          <nav className="ib-tabs" aria-label="Inbox">
            <button type="button" className={"ib-tab pt-focus" + (tab === "msg" ? " on" : "")} onClick={() => setTab("msg")}>Inbox{loaded ? <span className="ib-n">{msg.length}</span> : null}</button>
            <button type="button" className={"ib-tab pt-focus" + (tab === "later" ? " on" : "")} onClick={() => setTab("later")}>Later{loaded ? <span className="ib-n">{later.length}</span> : null}</button>
            <a className="ib-tab pt-focus" href="/grades">Late notes{loaded ? <span className="ib-n">{late.length}</span> : null}</a>
          </nav>
          <div className="pt-chips ib-classes">
            <button type="button" className={"pt-chip pt-focus" + (!filter ? " on" : "")} onClick={() => setFilter("")}>All</button>
            {classes.map(c => <button key={c.id} type="button" className={"pt-chip pt-focus" + (filter === c.id ? " on" : "")} onClick={() => setFilter(c.id)}>{c.code}</button>)}
          </div>
        </div>
        {loaded ? <MailList key={tab} rows={rows} feeds={feeds} where={tab} /> : null}
      </div>
    </div>
  );
}

export const INBOX_CSS = `
.ib{max-width:1040px;margin:0 auto;padding:28px 16px 96px;display:flex;flex-direction:column;gap:18px}
.ib-head{display:flex;align-items:baseline;gap:14px 28px;flex-wrap:wrap}
.ib-h1{margin:0;font-family:var(--pt-serif);font-size:34px;font-weight:600;letter-spacing:-.01em;line-height:1.1}
.ib-tabs{display:flex;gap:22px;align-items:baseline}
.pt-root .ib-tab{font-family:inherit;font-size:18px;font-weight:600;color:var(--text-secondary);text-decoration:none;padding:4px 0 6px;border:0;border-bottom:2px solid transparent;background:none;cursor:pointer;display:inline-flex;gap:8px;align-items:baseline}
.pt-root .ib-tab.on{color:var(--text-primary);border-bottom-color:var(--text-primary)}
.ib-n{font-size:14px;font-weight:600;color:var(--text-secondary)}
.ib-classes{margin-left:auto}
.ib-list{background:var(--surface-card);border-radius:16px;box-shadow:0 0 0 1px var(--line-soft);overflow:hidden}
.ib-list:empty{display:none}
.ib-bar{display:flex;align-items:center;gap:14px;min-height:52px;padding:6px 16px;border-bottom:1px solid var(--line-soft)}
.ib-item{border-bottom:1px solid var(--line-soft)}
.ib-item:last-child{border-bottom:0}
.ib-item.open{background:var(--surface-page);box-shadow:inset 3px 0 0 var(--text-primary)}
.ib-row{display:flex;align-items:center;gap:0;padding-left:16px}
.ib-row:hover{background:var(--surface-page)}
.ib-tick{width:18px;height:18px;flex:none;margin:0;accent-color:var(--text-primary);cursor:pointer}
.ib-hit{flex:1 1 auto;min-width:0;display:grid;grid-template-columns:32px minmax(120px,190px) auto minmax(0,1fr) auto;align-items:center;gap:12px;min-height:56px;padding:8px 16px 8px 14px;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}
.ib-noface{width:32px;height:32px}
.ib-name{font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ib-code{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.ib-line{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px;color:var(--text-secondary)}
.ib-snip{font-weight:400}
.ib-line b{color:var(--text-primary);font-weight:600;margin-right:8px}
.ib-date{font-size:14px;font-weight:600;color:var(--text-secondary);white-space:nowrap}
.ib-item.red .ib-date{color:var(--pt-late-ink)}
.ib-item.red .ib-row{box-shadow:inset 3px 0 0 var(--pt-late-ink)}
.ib-open{padding:6px 20px 20px 62px;display:flex;flex-direction:column;gap:12px}
.ib-talk{display:flex;flex-direction:column;gap:12px;max-height:420px;overflow:auto}
.ib-msg{max-width:72ch}
.ib-msg.mine{padding-left:14px;border-left:2px solid var(--line-strong)}
.ib-who{margin:0;font-size:14px;font-weight:700;display:flex;gap:10px;align-items:baseline}
.ib-who span{font-weight:500;color:var(--text-secondary);font-size:13px}
.ib-words{margin:2px 0 0;font-size:16px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.ib-box{min-height:96px;resize:vertical;font-family:inherit;max-width:72ch}
.ib-canned,.ib-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.ib-acts .pt-btn{background:var(--text-primary)}
.ib-acts .pt-btn:disabled{opacity:.4}
.ib-link{font-size:15px;font-weight:600;color:var(--text-primary);padding:0 6px}
.ib-late{display:flex;flex-direction:column;gap:10px}
@media (max-width:720px){
  .ib-classes{margin-left:0}
  .ib-hit{grid-template-columns:32px minmax(0,1fr) auto;row-gap:2px}
  .ib-code{display:none}
  .ib-line{grid-column:2 / 4}
  .ib-open{padding-left:20px}
}
`;
