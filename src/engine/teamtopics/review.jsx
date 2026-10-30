// Andrew's side of the topics: /comm118/worksheets/team-topics?review.
//
// Andrew, 2026-10-23: "a page for me as the instructor, where I can see all
// this information, not only coming in real time, but eventually we'll use it
// to create kind of like a summary of all the data." So the page asks again
// every half minute while open, and names who is in and who is not.
//
// Two views of the same sheets. By topic: every topic anyone chose, most
// chosen first, with each student's finding, opinion and wonder under the
// topic, which is the view for running Wednesday's discussion. By student:
// one row each, their five. Reads through
// /api/worksheet-submits (all: true), the way the pre-production review does.
// Nothing is written here.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { SLOTS, PARTS, MORE_FIELD, TOPICS, missingOf, DEFAULT_COPY } from "./sheet.jsx";
import * as TOKENS from "../tokens.js";
import { StudentLink } from "../StudentPage.jsx";
import { matchConcept, conceptOf } from "../takeover/engine.js";

const call = async (body) => {
  const r = await fetch("/api/worksheet-submits", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};

const lower = (s) => String(s || "").trim().toLowerCase();
const when = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// A student's five, from their answers: the slots with a topic written.
export const topicsOf = (answers) => SLOTS.map(s => ({
  slot: s, topic: String((answers || {})["topic:" + s] || "").trim(),
  ...Object.fromEntries(PARTS.map(p => [p.field, String((answers || {})[p.field + ":" + s] || "").trim()])),
})).filter(t => t.topic);

// Every topic chosen in a set of sheets, most chosen first, each with who
// chose the topic and what they wrote. Spelling and case are folded, and a
// topic typed as a word of a chapter title ("Motivation", "Team Chemistry")
// is listed under that title, the way the game reads them (matchConcept).
export function byTopic(sheets) {
  const map = new Map();
  sheets.forEach(sh => topicsOf(sh.answers).forEach(t => {
    const id = matchConcept(t.topic);
    const k = id || lower(t.topic).replace(/[.!?]+$/, "");
    if (!map.has(k)) map.set(k, { topic: id ? conceptOf(id).name : t.topic, entries: [] });
    map.get(k).entries.push({ student: sh.student, ...t });
  }));
  return [...map.values()].sort((a, b) => b.entries.length - a.entries.length || a.topic.localeCompare(b.topic));
}

export default function TopicsReview({ config, worksheetKey, roster }) {
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState(() => { try { const v = new URLSearchParams(window.location.search).get("v"); return v === "summary" || v === "student" ? v : "topic"; } catch { return "topic"; } });
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");

  useEffect(() => {
    let alive = true;
    const ask = () => call({ groupKey: config.id, key: worksheetKey, all: true })
      .then(out => { if (alive) setSheets(out.sheets); })
      .catch(e => { if (alive && !sheets) setError(e.message); });
    ask();
    const t = setInterval(ask, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [config.id, worksheetKey]);

  if (error) return <Shell><p className="ttr-p">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="ttr-p">Loading the sheets.</p></Shell>;

  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const rows = people.map(p => ({ student: p, sheet: byEmail.get(lower(p.email)) || null }));
  const withSheets = rows.filter(r => r.sheet).map(r => ({ ...r.sheet, student: r.student }));
  const submitted = withSheets.filter(s => s.submitted_at).length;
  const topics = byTopic(withSheets);
  const notIn = rows.filter(r => !r.sheet?.submitted_at).map(r => r.student.name);

  // Andrew, 2026-10-29: "this is ugly. make it better to read." One concept
  // at a time, its three parts stacked, each entry one line with the name
  // run in, and a list of the concepts at the top to jump by. No boxes.
  const slug = (t) => "c-" + lower(t).replace(/[^a-z0-9]+/g, "-");
  return (
    <Shell>
      <h1 className="ttr-title">Five concepts, every sheet</h1>
      {sections.length > 1 ? (
        <div className="ttr-tabs" role="tablist">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"ttr-tab" + (s === section ? " ttr-on" : "")} onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}
      <p className="ttr-p">{submitted + " submitted · " + (withSheets.length - submitted) + " started · " + (rows.length - withSheets.length) + " not opened · " + topics.length + " concepts"}</p>
      {notIn.length ? <p className="ttr-muted">Not submitted yet: {notIn.join(", ")}.</p> : null}
      <div className="ttr-tabs" role="tablist" aria-label="View">
        <button type="button" role="tab" aria-selected={view === "topic"} className={"ttr-tab" + (view === "topic" ? " ttr-on" : "")} onClick={() => setView("topic")}>By concept</button>
        <button type="button" role="tab" aria-selected={view === "student"} className={"ttr-tab" + (view === "student" ? " ttr-on" : "")} onClick={() => setView("student")}>By student</button>
        <button type="button" role="tab" aria-selected={view === "summary"} className={"ttr-tab" + (view === "summary" ? " ttr-on" : "")} onClick={() => setView("summary")}>Summary</button>
      </div>
      {view === "summary" ? <Summary topics={topics} students={withSheets.length} accent={config.accent} section={section} sheets={withSheets} /> : null}
      {view === "summary" ? null : view === "topic" ? (
        <>
          <ol className="ttr-index">
            {topics.map(t => <li key={t.topic}><a href={"#" + slug(t.topic)}>{t.topic}</a><span className="ttr-count">{t.entries.length}</span></li>)}
          </ol>
          {topics.map(t => (
            <section key={t.topic} id={slug(t.topic)} className="ttr-concept">
              <h2 className="ttr-h2">{t.topic} <span className="ttr-count">{t.entries.length}</span></h2>
              {PARTS.map(p => {
                const said = t.entries.filter(e => e[p.field]);
                if (!said.length) return null;
                return (
                  <div key={p.field} className="ttr-part">
                    <h3 className="ttr-h3">{DEFAULT_COPY["box." + p.field]}</h3>
                    {said.map(e => <p key={e.student.email + e.slot} className="ttr-entry"><b><StudentLink config={config} student={e.student} /></b> {e[p.field]}</p>)}
                  </div>
                );
              })}
            </section>
          ))}
        </>
      ) : rows.map(({ student, sheet }) => (
        <section key={student.email} className="ttr-concept">
          <h2 className="ttr-h2"><StudentLink config={config} student={student} /> <span className="ttr-count">{sheet ? (sheet.submitted_at ? "submitted " + when(sheet.submitted_at) : "started") : "not opened"}</span></h2>
          {sheet ? (<>
            {topicsOf(sheet.answers).map(t => (
              <div key={t.slot} className="ttr-part">
                <h3 className="ttr-h3">{t.topic}</h3>
                {PARTS.map(p => t[p.field] ? <p key={p.field} className="ttr-entry"><b>{DEFAULT_COPY["box." + p.field]}</b> {t[p.field]}</p> : null)}
              </div>
            ))}
            {String(sheet.answers?.[MORE_FIELD] || "").trim() ? <div className="ttr-part"><h3 className="ttr-h3">{DEFAULT_COPY.moreAsk}</h3><p className="ttr-entry">{sheet.answers[MORE_FIELD]}</p></div> : null}
            {missingOf(sheet.answers).length ? <p className="ttr-muted">{missingOf(sheet.answers).length} boxes empty.</p> : null}
          </>) : null}
        </section>
      ))}
    </Shell>
  );
}

// The room screen. Andrew, 2026-10-29: "a summary of their concepts stuff.
// make the summary really pretty for me." The concepts the class picked, as
// bars, then the questions under the top ones. No names on the screen.
// ─── the analysis ───
//
// Andrew, 2026-10-30: "make the comm 118 worksheets team topic review much
// more interesting! where is the analysis!" Two kinds. The counted kind is
// worked out here from the sheets: how the class spread across the chapter,
// which concepts nobody touched, which get picked together, and the words the
// questions keep coming back to. The read kind is Claude's, asked for with a
// button, over every entry with no names attached, and kept in the tab so a
// second look costs nothing.

const STOP = new Set("the a an and or but of to in on at for with by from as is are was were be been being it its this that these those they them their there here how what when where which who why do does did done can could should would will just like than then so if not no yes more most some any all each every one two about into over very really also i you we he she my our your his her me us think thinks wonder wonders feel feels team teams player players coach coaches sport sports athlete athletes people person someone something things thing way ways lot much many get gets make makes".split(" "));
const words = (t) => String(t || "").toLowerCase().replace(/[^a-z\s'-]/g, " ").split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));

/** The counted analysis for one section's sheets. */
export function analysisOf(topics, sheets) {
  const n = Math.max(1, sheets.length);
  const chosen = new Set(topics.map(t => lower(t.topic)));
  const untouched = TOPICS.filter(t => !chosen.has(lower(t)) && !topics.some(x => lower(x.topic).includes(lower(t).split(" ")[0]) && lower(t).split(" ")[0].length > 4));
  // Concepts picked by more than half, and by one person only.
  const majority = topics.filter(t => t.entries.length / n >= 0.5);
  const lone = topics.filter(t => t.entries.length === 1);
  // Pairs chosen together, from each student's own five.
  const pairs = new Map();
  const nameOf = (t) => { const hit = topics.find(x => x.entries.some(e => lower(e.topic) === lower(t))); return hit ? hit.topic : t; };
  sheets.forEach(sh => {
    const mine = [...new Set(topicsOf(sh.answers).map(t => nameOf(t.topic)))].sort();
    for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) { const k = mine[i] + " + " + mine[j]; pairs.set(k, (pairs.get(k) || 0) + 1); }
  });
  const together = [...pairs.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 6);
  // The words the questions keep coming back to, and the words the opinions do.
  const tally = (field) => { const m = new Map(); topics.forEach(t => t.entries.forEach(e => new Set(words(e[field])).forEach(w => m.set(w, (m.get(w) || 0) + 1)))); return [...m.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 12); };
  const askWords = tally("wonder"), sayWords = tally("opinion");
  // Where the words went: how long the class wrote, by part.
  const lengths = PARTS.map(p => { const all = topics.flatMap(t => t.entries.map(e => String(e[p.field] || "").trim().split(/\s+/).filter(Boolean).length)).filter(x => x > 0); return { part: p.box, avg: all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0, n: all.length }; });
  // The questions that more than one student asked, by shared words on the same concept.
  const shared = [];
  topics.forEach(t => {
    const qs = t.entries.filter(e => e.wonder).map(e => ({ e, w: new Set(words(e.wonder)) }));
    const used = new Set();
    qs.forEach((a, i) => {
      if (used.has(i)) return;
      const kin = qs.filter((b, j) => j !== i && !used.has(j) && [...a.w].filter(x => b.w.has(x)).length >= 2);
      if (kin.length) { used.add(i); kin.forEach(b => used.add(qs.indexOf(b))); shared.push({ topic: t.topic, n: kin.length + 1, wonder: a.e.wonder }); }
    });
  });
  shared.sort((a, b) => b.n - a.n);
  return { n: sheets.length, untouched, majority, lone, together, askWords, sayWords, lengths, shared: shared.slice(0, 6) };
}

function Analysis({ topics, sheets }) {
  const a = analysisOf(topics, sheets);
  const pct = (k) => Math.round(100 * k / Math.max(1, a.n)) + "%";
  return (
    <section className="ttr-an">
      <h2 className="ttr-sum-h">The read</h2>
      <div className="ttr-an-grid">
        <div className="ttr-an-box">
          <h3 className="ttr-h3">Where the class went</h3>
          {a.majority.length ? <p className="ttr-an-p">{a.majority.map(t => <span key={t.topic}><b>{t.topic}</b> ({pct(t.entries.length)}) </span>)}{a.majority.length === 1 ? "was picked by at least half the room." : "were picked by at least half the room."}</p> : <p className="ttr-an-p">No concept was picked by half the room. The class spread out.</p>}
          {a.lone.length ? <p className="ttr-an-p">One person alone chose {a.lone.map(t => t.topic).join(", ")}.</p> : null}
          {a.untouched.length ? <p className="ttr-an-p">Nobody touched {a.untouched.join(", ")}.</p> : <p className="ttr-an-p">Every section title in the chapter was chosen by someone.</p>}
        </div>
        <div className="ttr-an-box">
          <h3 className="ttr-h3">Picked together</h3>
          {a.together.length ? <ul className="ttr-an-list">{a.together.map(([k, c]) => <li key={k}><b>{k}</b><span className="ttr-count"> {c} students</span></li>)}</ul> : <p className="ttr-an-p">No two concepts were picked together by more than one student.</p>}
        </div>
        <div className="ttr-an-box">
          <h3 className="ttr-h3">The questions keep saying</h3>
          <p className="ttr-an-words">{a.askWords.length ? a.askWords.map(([w, c]) => <span key={w} style={{ fontSize: 14 + Math.min(14, c * 2) }}>{w}<i>{c}</i></span>) : "Not enough questions yet."}</p>
          <h3 className="ttr-h3">The opinions keep saying</h3>
          <p className="ttr-an-words">{a.sayWords.length ? a.sayWords.map(([w, c]) => <span key={w} style={{ fontSize: 14 + Math.min(14, c * 2) }}>{w}<i>{c}</i></span>) : "Not enough opinions yet."}</p>
        </div>
        <div className="ttr-an-box">
          <h3 className="ttr-h3">How much they wrote</h3>
          <ul className="ttr-an-list">{a.lengths.map(l => <li key={l.part}><b>{l.part}</b><span className="ttr-count"> {l.avg} words on average, {l.n} written</span></li>)}</ul>
        </div>
      </div>
      {a.shared.length ? (
        <div className="ttr-an-box">
          <h3 className="ttr-h3">Asked by more than one student</h3>
          <ul className="ttr-an-list">{a.shared.map((q, i) => <li key={i}><b>{q.topic}</b><span className="ttr-count"> {q.n} asked</span><br />{q.wonder}</li>)}</ul>
        </div>
      ) : null}
    </section>
  );
}

// Claude's read of every entry, no names, on a button. Through
// /api/generate-feedback, the route the grades pages use.
const READ_SYSTEM = "You are reading a college class's worksheet for a sports communication course (COMM 118, Communication and Sport). Each student chose five concepts from a chapter on team communication and wrote, for each, an observation, an opinion, and a question. You are writing for the instructor, who will run Wednesday's discussion from this. Write plain, specific, direct prose. No em dashes. No emojis. No headings with counts. No bullet lists. Quote students' own phrases where they are sharp. Keep it under 450 words, in five short paragraphs: what the class as a whole seems to believe about teams, where students disagree with each other (name the two sides), what they notice that the chapter would push back on, the three questions most worth opening the discussion with and why, and one minority view worth bringing to the front of the room.";
function ClaudeRead({ topics, section }) {
  const key = "ttr-read:" + section + ":" + topics.reduce((n, t) => n + t.entries.length, 0);
  const [text, setText] = useState(() => { try { return sessionStorage.getItem(key) || ""; } catch { return ""; } });
  const [busy, setBusy] = useState("");
  const ask = async () => {
    setBusy("asking");
    const lines = topics.flatMap(t => t.entries.map(e => "Concept: " + t.topic + "\nObservation: " + e.finding + "\nOpinion: " + e.opinion + "\nQuestion: " + e.wonder));
    try {
      const r = await fetch("/api/generate-feedback", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ model: "claude-opus-5-5", max_tokens: 1400, system: READ_SYSTEM, prompt: "Here are the entries, " + lines.length + " in all.\n\n" + lines.join("\n\n") }) });
      const out = await r.json().catch(() => null);
      const got = out && out.content && out.content.map(c => c.text || "").join("").trim();
      if (!r.ok || !got) throw new Error((out && (out.error?.message || out.error)) || "no answer");
      setText(got); try { sessionStorage.setItem(key, got); } catch { /* the words still show */ }
      setBusy("");
    } catch (e) { setBusy("Claude did not answer: " + String(e.message || e)); }
  };
  return (
    <section className="ttr-an">
      <div className="ttr-an-head">
        <h2 className="ttr-sum-h">Claude's read</h2>
        <button type="button" className="ttr-tab" disabled={busy === "asking"} onClick={ask}>{busy === "asking" ? "Reading every entry" : text ? "Read again" : "Ask Claude to read the sheets"}</button>
      </div>
      {busy && busy !== "asking" ? <p className="ttr-muted">{busy}</p> : null}
      {text ? text.split(/\n{2,}/).map((p, i) => <p key={i} className="ttr-read-p">{p}</p>) : <p className="ttr-muted">What the class believes, where it splits, what the chapter would push back on, the questions to open with, and one minority view. Names are not sent.</p>}
    </section>
  );
}

function Summary({ topics, students, accent, section, sheets = [] }) {
  const max = Math.max(1, ...topics.map(t => t.entries.length));
  const top = topics.slice(0, 6);
  return (
    <div className="ttr-sum">
      <p className="ttr-sum-lede">{students + " students, five concepts each"}</p>
      <Analysis topics={topics} sheets={sheets} />
      <ClaudeRead topics={topics} section={section} />
      <ol className="ttr-bars">
        {topics.map(t => (
          <li key={t.topic}>
            <span className="ttr-bar-label">{t.topic}</span>
            <span className="ttr-bar" style={{ background: accent + "22" }}><i style={{ width: Math.round(100 * t.entries.length / max) + "%", background: accent }} /></span>
            <span className="ttr-bar-n">{t.entries.length}</span>
          </li>
        ))}
      </ol>
      {top.map(t => {
        const wonders = t.entries.map(e => String(e.wonder || "").trim()).filter(Boolean).slice(0, 4);
        if (!wonders.length) return null;
        return (
          <section key={t.topic} className="ttr-sum-sec">
            <h2 className="ttr-sum-h">{t.topic}</h2>
            <ul className="ttr-sum-q">{wonders.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </section>
        );
      })}
    </div>
  );
}

function Shell({ children }) {
  return <div className="ttr"><style>{CSS}</style><div className="ttr-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.ttr{padding:24px 16px 96px;color:${T.primary}}
.ttr-in{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.ttr-title{margin:0;font-size:30px;font-weight:700;letter-spacing:-.02em}
.ttr-p{margin:0;font-size:16px;color:${T.secondary}}
.ttr-tabs{display:flex;gap:8px;flex-wrap:wrap}
.ttr-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer;min-height:34px}
.ttr-on{background:${T.primary};border-color:${T.primary};color:${S.page}}
.ttr-index{margin:6px 0 10px;padding:0;list-style:none;columns:2 220px;column-gap:28px;font-size:15.5px;line-height:1.7}
.ttr-index li{display:flex;justify-content:space-between;gap:10px;break-inside:avoid;border-bottom:1px solid ${L.soft};padding:2px 0}
.ttr-index a{color:inherit;text-decoration:none}
.ttr-index a:hover{text-decoration:underline}
.ttr-count{font-size:14px;color:${T.muted};font-weight:400;font-variant-numeric:tabular-nums}
.ttr-concept{border-top:2px solid ${T.primary};padding:18px 0 6px;display:flex;flex-direction:column;gap:14px;scroll-margin-top:72px}
.ttr-h2{margin:0;font-size:24px;font-weight:700;letter-spacing:-.01em;display:flex;align-items:baseline;gap:12px}
.ttr-part{display:flex;flex-direction:column;gap:8px}
.ttr-h3{margin:0;font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${T.muted}}
.ttr-entry{margin:0;font-size:16.5px;line-height:1.55;max-width:70ch}
.ttr-entry b{font-weight:600}
.ttr-muted{margin:0;font-size:14.5px;color:${T.muted}}
.ttr-sum{display:flex;flex-direction:column;gap:28px;padding-top:8px}
.ttr-sum-lede{margin:0;font-size:20px;color:${T.secondary}}
.ttr-bars{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.ttr-bars li{display:grid;grid-template-columns:minmax(180px,2fr) 5fr 2.5ch;align-items:center;gap:14px;font-size:19px}
.ttr-bar-label{overflow-wrap:anywhere}
.ttr-bar{display:block;height:18px;border-radius:4px;overflow:hidden}
.ttr-bar i{display:block;height:100%;border-radius:4px}
.ttr-bar-n{text-align:right;font-variant-numeric:tabular-nums;color:${T.secondary}}
.ttr-sum-sec{border-top:2px solid ${T.primary};padding-top:14px;display:flex;flex-direction:column;gap:10px}
.ttr-sum-h{margin:0;font-size:30px;font-weight:700;letter-spacing:-.02em}
.ttr-sum-q{margin:0;padding-left:26px;display:grid;gap:10px;font-size:22px;line-height:1.4}
.ttr-an{display:flex;flex-direction:column;gap:14px;border-top:2px solid ${T.primary};padding-top:14px}
.ttr-an-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.ttr-an-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ttr-an-box{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border-radius:14px;background:${S.sunk}}
.ttr-an-p{margin:0;font-size:16px;line-height:1.55}
.ttr-an-list{margin:0;padding-left:18px;display:grid;gap:6px;font-size:16px;line-height:1.5}
.ttr-an-words{margin:0;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;line-height:1.3}
.ttr-an-words span{font-weight:600}
.ttr-an-words i{font-style:normal;font-weight:400;font-size:12px;color:${T.muted};margin-left:3px}
.ttr-read-p{margin:0;font-size:17.5px;line-height:1.6;max-width:70ch}
@media (max-width:640px){.ttr-an-grid{grid-template-columns:1fr}}
@media (max-width:640px){.ttr-bars li{grid-template-columns:1fr 3fr 2.5ch;font-size:16px}.ttr-sum-h{font-size:24px}.ttr-sum-q{font-size:18px}}
`;
