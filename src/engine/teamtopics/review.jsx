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
import { SLOTS, PARTS, missingOf, DEFAULT_COPY } from "./sheet.jsx";
import * as TOKENS from "../tokens.js";

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
// chose the topic and what they wrote. Spelling and case are folded.
export function byTopic(sheets) {
  const map = new Map();
  sheets.forEach(sh => topicsOf(sh.answers).forEach(t => {
    const k = lower(t.topic).replace(/[.!?]+$/, "");
    if (!map.has(k)) map.set(k, { topic: t.topic, entries: [] });
    map.get(k).entries.push({ student: sh.student, ...t });
  }));
  return [...map.values()].sort((a, b) => b.entries.length - a.entries.length || a.topic.localeCompare(b.topic));
}

export default function TopicsReview({ config, worksheetKey, roster }) {
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("topic");
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

  return (
    <Shell>
      <h1 className="ttr-title">Five concepts, every sheet</h1>
      {sections.length > 1 ? (
        <div className="ttr-tabs" role="tablist">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"ttr-tab" + (s === section ? " ttr-on" : "")} onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}
      <p className="ttr-p">{submitted + " submitted, " + (withSheets.length - submitted) + " started, " + (rows.length - withSheets.length) + " not opened. " + topics.length + " different concepts. This page asks again every half minute."}</p>
      {notIn.length ? <p className="ttr-muted">Not submitted yet: {notIn.join(", ")}.</p> : <p className="ttr-muted">Everyone is in.</p>}
      <div className="ttr-tabs" role="tablist" aria-label="View">
        <button type="button" role="tab" aria-selected={view === "topic"} className={"ttr-tab" + (view === "topic" ? " ttr-on" : "")} onClick={() => setView("topic")}>By concept</button>
        <button type="button" role="tab" aria-selected={view === "student"} className={"ttr-tab" + (view === "student" ? " ttr-on" : "")} onClick={() => setView("student")}>By student</button>
      </div>
      {view === "topic" ? topics.map(t => (
        <section key={t.topic} className="ttr-row">
          <div className="ttr-head"><b className="ttr-name">{t.topic}</b><span className="ttr-chip">{t.entries.length + (t.entries.length === 1 ? " student" : " students")}</span></div>
          {t.entries.map(e => (
            <div key={e.student.email + e.slot} className="ttr-entry">
              <span className="ttr-who">{e.student.name}</span>
              {PARTS.map(p => e[p.field] ? <p key={p.field} className="ttr-line"><span className="ttr-k">{DEFAULT_COPY["box." + p.field]}</span>{e[p.field]}</p> : null)}
            </div>
          ))}
        </section>
      )) : rows.map(({ student, sheet }) => (
        <article key={student.email} className="ttr-row">
          <div className="ttr-head">
            <b className="ttr-name">{student.name}</b>
            <span className={"ttr-chip" + (sheet?.submitted_at ? " ttr-ok" : "")}>{sheet ? (sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) : "Started") : "Not opened"}</span>
          </div>
          {sheet ? (<>
            {topicsOf(sheet.answers).map(t => (
              <div key={t.slot} className="ttr-entry">
                <span className="ttr-who">{t.topic}</span>
                {PARTS.map(p => t[p.field] ? <p key={p.field} className="ttr-line"><span className="ttr-k">{DEFAULT_COPY["box." + p.field]}</span>{t[p.field]}</p> : null)}
              </div>
            ))}
            {missingOf(sheet.answers).length ? <p className="ttr-muted">{missingOf(sheet.answers).length} boxes empty.</p> : null}
          </>) : null}
        </article>
      ))}
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="ttr"><style>{CSS}</style><div className="ttr-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.ttr{padding:20px 16px 80px;color:${T.primary}}
.ttr-in{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.ttr-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.ttr-p{margin:0;font-size:16px;color:${T.secondary}}
.ttr-tabs{display:flex;gap:8px;flex-wrap:wrap}
.ttr-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer;min-height:34px}
.ttr-on{background:${T.primary};border-color:${T.primary};color:${S.page}}
.ttr-row{border-top:1px solid ${L.soft};padding:16px 0 4px;display:flex;flex-direction:column;gap:10px}
.ttr-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ttr-name{font-size:18px}
.ttr-chip{font-size:13px;font-weight:600;border-radius:999px;padding:3px 10px;border:1px solid ${L.strong};color:${T.secondary}}
.ttr-ok{border-color:${ST.ok};color:${ST.ok}}
.ttr-entry{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:10px;background:${S.sunk}}
.ttr-who{font-size:15px;font-weight:600}
.ttr-line{margin:0;font-size:15.5px;line-height:1.5;white-space:pre-wrap}
.ttr-k{display:block;font-size:13px;font-weight:600;color:${T.muted}}
.ttr-muted{margin:0;font-size:14.5px;color:${T.muted}}
`;
