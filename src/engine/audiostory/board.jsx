// Andrew's side of the ideas, two ways.
//
// ?review is his laptop: every submitted sheet with the student's name, the
// three ideas side by side, and the five marks on each idea. ?board is the
// projector: the same ideas with no names, big, newest first, each carrying
// its mark. Andrew, 2026-10-29: "I want these to pop up in real time on a
// page that I can use to show the whole class, and to okay an idea, and the
// students would see me okaying it on the screen." Then: "this projector
// should not show student names."
//
// Both ask /api/worksheet-submits (all: true) again every four seconds, the
// way the games ask again rather than hold a channel. Only sheets that have
// been submitted show. A mark is written through the same route as the
// pre-production review (worksheet_reviews, one row a sheet, the note holding
// the marks by slot), so the student's sheet reads the mark back on its next
// ask.

import { useEffect, useRef, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { SLOTS, MARKS, marksOf, statusFor, Mark, POLL, DEFAULT_COPY } from "./ideas.jsx";
import { linesOf as linesOfIdea, loadFont } from "./bits.jsx";
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
const when = (iso) => new Date(iso).toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });

/** A student's three ideas off their answers, with the parts as lines. */
export const ideasOf = (answers) => SLOTS.map(s => ({
  slot: s,
  idea: String((answers || {})["idea:" + s] || "").trim(),
  why: linesOfIdea((answers || {})["why:" + s]),
  plan: linesOfIdea((answers || {})["plan:" + s]),
}));

/** The submitted sheets, asked for again every four seconds while the tab shows. */
function useSheets(config, worksheetKey) {
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const had = useRef(false);
  useEffect(() => {
    let alive = true;
    const ask = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      call({ groupKey: config.id, key: worksheetKey, all: true })
        .then(out => { if (alive) { had.current = true; setSheets(out.sheets); setError(""); } })
        .catch(e => { if (alive && !had.current) setError(e.message); });
    };
    ask();
    const t = setInterval(ask, POLL);
    return () => { alive = false; clearInterval(t); };
  }, [config.id, worksheetKey]);
  return [sheets, setSheets, error];
}

function useSectionTabs(config) {
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  const tabs = sections.length > 1 ? (
    <div className="aib-tabs" role="tablist">
      {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"aib-tab" + (s === section ? " aib-on" : "")} onClick={() => setSection(s)}>{s}</button>)}
    </div>
  ) : null;
  return [section, tabs];
}

/** The roster's people in a section, each with their sheet if one exists,
 * then any sheet from off the roster (the instructor's own, for a dry run),
 * named by its email and shown in every section. */
function rowsOf(roster, sheets, section) {
  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const onRoster = new Set(roster.filter(s => s.email).map(s => lower(s.email)));
  const others = sheets.filter(s => !onRoster.has(s.viewer_id)).map(s => ({ student: { name: s.viewer_id, email: s.viewer_id }, sheet: s }));
  return [...people.map(p => ({ student: p, sheet: byEmail.get(lower(p.email)) || null })), ...others];
}

export default function IdeasReview({ config, worksheetKey, roster }) {
  const [sheets, setSheets, error] = useSheets(config, worksheetKey);
  const [section, tabs] = useSectionTabs(config);
  const [busy, setBusy] = useState("");
  const [failed, setFailed] = useState("");
  useEffect(() => { loadFont(); }, []);

  if (error) return <Shell><p className="aib-p">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="aib-p">Loading the sheets.</p></Shell>;

  const rows = rowsOf(roster, sheets, section);
  const submitted = rows.filter(r => r.sheet?.submitted_at).sort((a, b) => Date.parse(b.sheet.submitted_at) - Date.parse(a.sheet.submitted_at));
  const started = rows.filter(r => r.sheet && !r.sheet.submitted_at).map(r => r.student.name);
  const notOpened = rows.filter(r => !r.sheet).map(r => r.student.name);

  // Press a mark to put it on, press the same mark to take it off.
  const mark = async (row, slot, id) => {
    const marks = marksOf(row.sheet.review);
    const next = { ...marks };
    if (next[slot] === id) delete next[slot]; else next[slot] = id;
    const key = row.student.email + slot;
    setBusy(key); setFailed("");
    try {
      const out = await call({ groupKey: config.id, key: worksheetKey, viewer: lower(row.student.email), review: { status: statusFor(next), note: JSON.stringify(next) } });
      setSheets(list => list.map(s => s.viewer_id === out.sheet.viewer_id ? { ...s, review: out.review } : s));
    } catch (e) { setFailed(e.message); }
    setBusy("");
  };

  return (
    <Shell>
      <h1 className="aib-title">{DEFAULT_COPY.title}, every sheet</h1>
      {tabs}
      <p className="aib-p">{submitted.length + " submitted, " + started.length + " started, " + notOpened.length + " not opened. This page asks again every four seconds."}</p>
      <p className="aib-p"><a className="aib-a" href={"/" + config.id + "/worksheets/" + worksheetKey + "?board"} target="_blank" rel="noreferrer">The board for the projector, no names ↗</a> · <a className="aib-a" href={"/" + config.id + "/worksheets/" + worksheetKey + "?control"}>Control page</a></p>
      {failed ? <p className="aib-bad">The mark did not save: {failed}</p> : null}
      {submitted.map(row => {
        const marks = marksOf(row.sheet.review);
        const a = row.sheet.answers || {};
        return (
          <article key={row.student.email} className="aib-row">
            <div className="aib-head">
              <b className="aib-name">{row.student.name}</b>
              <span className="aib-chip">Submitted {when(row.sheet.submitted_at)}</span>
              <span className="aib-small">{[...linesOfIdea(a.strength).filter(x => x !== "Other"), String(a.other || "").trim()].filter(Boolean).join(", ")}{a.work ? " · " + linesOfIdea(a.work).join(", ") : ""}</span>
            </div>
            <div className="aib-ideas">
              {ideasOf(a).map((it, i) => (
                <div key={it.slot} className={"aib-idea" + (marks[it.slot] ? " aib-marked aib-m-" + marks[it.slot] : "")}>
                  <div className="aib-ihead"><span className="aib-k">Idea {i + 1}</span>{marks[it.slot] ? <Mark id={marks[it.slot]} /> : null}</div>
                  <p className="aib-line aib-big">{it.idea || "Nothing written"}</p>
                  {it.why.length ? <p className="aib-line"><span className="aib-k">{DEFAULT_COPY.whyAsk}</span>{it.why.join("\n")}</p> : null}
                  {it.plan.length ? <p className="aib-line"><span className="aib-k">{DEFAULT_COPY.planAsk}</span>{it.plan.join("\n")}</p> : null}
                  <div className="aib-marks" role="group" aria-label={"Mark idea " + (i + 1) + " for " + row.student.name}>
                    {MARKS.map(m => (
                      <button key={m.id} type="button" className={"aib-mark aib-m-" + m.id + (marks[it.slot] === m.id ? " aib-set" : "")} aria-pressed={marks[it.slot] === m.id}
                        disabled={busy === row.student.email + it.slot} onClick={() => mark(row, it.slot, m.id)}>
                        {m.star ? <span aria-hidden="true">★ </span> : null}{m.say}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <details className="aib-more">
              <summary className="aib-k">Any audio story, and the tools</summary>
              {linesOfIdea(a.any).length ? <p className="aib-line"><span className="aib-k">{DEFAULT_COPY.anyAsk}</span>{linesOfIdea(a.any).join("\n")}</p> : null}
              {linesOfIdea(a.tools).length ? <p className="aib-line"><span className="aib-k">{DEFAULT_COPY.toolsAsk}</span>{linesOfIdea(a.tools).join("\n")}</p> : null}
            </details>
          </article>
        );
      })}
      {started.length ? <p className="aib-muted">Started, not submitted: {started.join(", ")}.</p> : null}
      {notOpened.length ? <p className="aib-muted">Not opened: {notOpened.join(", ")}.</p> : null}
    </Shell>
  );
}

// The projector. No names. Every submitted idea, newest sheet first, with
// its mark. A sheet that just came in rises into place.
export function IdeasBoard({ config, worksheetKey, roster }) {
  const [sheets, , error] = useSheets(config, worksheetKey);
  const [section, tabs] = useSectionTabs(config);
  useEffect(() => { loadFont(); }, []);

  if (error) return <Shell board><p className="aib-p">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell board><p className="aib-p">Loading.</p></Shell>;

  const rows = rowsOf(roster, sheets, section);
  const submitted = rows.filter(r => r.sheet?.submitted_at).sort((a, b) => Date.parse(b.sheet.submitted_at) - Date.parse(a.sheet.submitted_at));

  return (
    <Shell board>
      <div className="aib-bar">
        <h1 className="aib-title">{DEFAULT_COPY.title}</h1>
        {tabs}
        <span className="aib-count">{submitted.length} of {rows.length} in</span>
      </div>
      <div className="aib-grid">
        {submitted.map(row => {
          const marks = marksOf(row.sheet.review);
          return ideasOf(row.sheet.answers).map((it, i) => (
            <div key={row.student.email + it.slot} className={"aib-card" + (marks[it.slot] ? " aib-marked aib-m-" + marks[it.slot] : "")}>
              <div className="aib-ihead"><span className="aib-k">Idea {i + 1}</span>{marks[it.slot] ? <Mark id={marks[it.slot]} /> : null}</div>
              <p className="aib-line aib-huge">{it.idea || "Nothing written"}</p>
              {it.why.length ? <p className="aib-line aib-why">{it.why.join("\n")}</p> : null}
            </div>
          ));
        })}
      </div>
    </Shell>
  );
}

function Shell({ children, board = false }) {
  return <div className={"aib" + (board ? " aib-board" : "")}><style>{CSS}</style><div className="aib-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;
const CSS = `
.aib{padding:20px 16px 80px;color:${T.primary};--m-top:#15803d;--m-ok:#16a34a;--m-close:#ea580c;--m-no:#ca8a04;--m-ohno:#dc2626;--m-ink:#ffffff}
.aib-in{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.aib-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.aib-p{margin:0;font-size:16px;color:${T.secondary}}
.aib-a{color:${T.primary};font-weight:600}
.aib-bad{margin:0;font-size:15px;color:#b45309}
.aib-tabs{display:flex;gap:8px;flex-wrap:wrap}
.aib-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer;min-height:34px}
.aib-on{background:${T.primary};border-color:${T.primary};color:${S.page}}
.aib-row{border-top:1px solid ${L.soft};padding:16px 0 8px;display:flex;flex-direction:column;gap:10px}
.aib-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.aib-name{font-size:20px}
.aib-chip{font-size:13px;font-weight:600;border-radius:999px;padding:3px 10px;border:1px solid ${L.strong};color:${T.secondary}}
.aib-small{font-size:14px;color:${T.muted}}
.aib-ideas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.aib-idea,.aib-card{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:12px;background:${S.sunk};border:2px solid transparent}
.aib-marked{border-color:var(--m-c)}
.aib-m-top{--m-c:var(--m-top)} .aib-m-ok{--m-c:var(--m-ok)} .aib-m-close{--m-c:var(--m-close)} .aib-m-no{--m-c:var(--m-no)} .aib-m-ohno{--m-c:var(--m-ohno)}
.aib-ihead{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:30px}
.aib-k{display:block;font-size:13px;font-weight:600;color:${T.muted}}
.aib-line{margin:0;font-size:15.5px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.aib-big{font-size:18px;font-weight:600}
.aib-marks{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:6px}
.aib-mark{font:inherit;font-size:13px;font-weight:600;padding:5px 10px;border-radius:999px;border:1.5px solid var(--m-c);background:transparent;color:var(--m-c);cursor:pointer;min-height:30px}
.aib-mark.aib-set{background:var(--m-c);color:var(--m-ink)}
.aib-mark.aib-m-no.aib-set{color:#1c1917}
.aib-mark[disabled]{opacity:.5;cursor:default}
.aib-more{font-size:15px}
.aib-more summary{cursor:pointer}
.aib-more .aib-line{margin-top:8px}
.aib-muted{margin:0;font-size:14.5px;color:${T.muted}}
.aib .mark{display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600;border-radius:999px;padding:4px 12px;color:var(--m-ink);background:var(--m-c)}
.aib .mark.top{--m-c:var(--m-top)} .aib .mark.ok{--m-c:var(--m-ok)} .aib .mark.close{--m-c:var(--m-close)} .aib .mark.no{--m-c:var(--m-no);color:#1c1917} .aib .mark.ohno{--m-c:var(--m-ohno)}
.aib-board{padding:24px 28px 80px;min-height:100vh}
.aib-board .aib-in{max-width:none;gap:20px}
.aib-bar{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.aib-board .aib-title{font-size:34px}
.aib-count{margin-left:auto;font-size:20px;color:${T.secondary}}
.aib-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.aib-card{padding:16px 18px;animation:aib-rise .5s ease}
.aib-board .aib-ihead{min-height:34px}
.aib-board .mark{font-size:17px;padding:6px 14px}
.aib-huge{font-size:24px;font-weight:600;line-height:1.25}
.aib-why{font-size:16px;color:${T.secondary}}
@keyframes aib-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media (max-width:860px){.aib-ideas{grid-template-columns:1fr}}
@media (prefers-reduced-motion: reduce){.aib-card{animation:none}}
`;
