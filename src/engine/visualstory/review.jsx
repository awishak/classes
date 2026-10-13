// Andrew's side of pre-production: every topic in a section, with Approved,
// Needs work and a note. /comm3/worksheets/visual-pre?review.
//
// Reads and writes through /api/worksheet-submits, which checks the PIN or an
// instructor session and holds the service key, so the page works however he
// signed in. A review is one row per sheet in worksheet_reviews; the student
// sees the newest one on their sheet. Grouped by section, because the 8:00
// and the 10:30 never mix (planning, 2026-10-13).

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { PROMPTS, BOXES, standing, missingOf, useCopy } from "./pre.jsx";
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


const LABEL = { open: "Not submitted", waiting: "Waiting for you", approved: "Approved", needs: "Needs work" };

export default function PreReview({ config, worksheetKey, roster }) {
  const copy = useCopy(false);
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const [noTable, setNoTable] = useState(false);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");

  useEffect(() => {
    call({ groupKey: config.id, key: worksheetKey, all: true })
      .then(out => { setSheets(out.sheets); setNoTable(!!out.noReviews); })
      .catch(e => setError(e.message));
  }, [config.id, worksheetKey]);

  if (error) return <Shell><p className="vpr-p">Could not read the topics: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="vpr-p">Loading the topics.</p></Shell>;

  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  // Sheets from anyone off the roster, like the instructor's own test sheet.
  const onRoster = new Set(roster.filter(s => s.email).map(s => String(s.email).trim().toLowerCase()));
  const others = sheets.filter(s => !onRoster.has(s.viewer_id));
  const save = async (student, status, note) => {
    const out = await call({ groupKey: config.id, key: worksheetKey, viewer: String(student.email).trim().toLowerCase(), review: { status, note } });
    setSheets(list => list.map(s => s.viewer_id === out.sheet.viewer_id ? { ...s, review: out.review } : s));
  };
  const count = (kind) => people.filter(p => standing(byEmail.get(String(p.email).toLowerCase())?.submitted_at, byEmail.get(String(p.email).toLowerCase())?.review).kind === kind).length;

  return (
    <Shell>
      <h1 className="vpr-title">Pre-production topics</h1>
      {noTable ? <p className="vpr-warn">The reviews table is not in the database yet, so reviews cannot be saved. Run sql/visual-story-pre.sql in Supabase.</p> : null}
      {sections.length > 1 ? (
        <div className="vpr-tabs" role="tablist">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"vpr-tab" + (s === section ? " vpr-on" : "")} onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}
      <p className="vpr-p">{count("waiting")} waiting for you, {count("approved")} approved, {count("needs")} needs work, {count("open")} not submitted.</p>
      {people.map(p => <Row key={p.email} student={p} sheet={byEmail.get(String(p.email).trim().toLowerCase())} onSave={save} disabled={noTable} copy={copy} />)}
      {others.length ? <h2 className="vpr-h2">Not on the roster</h2> : null}
      {others.map(s => <Row key={s.viewer_id} student={{ name: s.viewer_id, email: s.viewer_id }} sheet={s} onSave={save} disabled={noTable} copy={copy} />)}
    </Shell>
  );
}

function Row({ student, sheet, onSave, disabled, copy }) {
  const promptName = (id) => (PROMPTS.some(p => p.id === id) ? copy.say("prompt." + id + ".name") : "No prompt chosen");
  const a = sheet?.answers || {};
  const where = standing(sheet?.submitted_at, sheet?.review);
  const [note, setNote] = useState(sheet?.review?.note || "");
  const [busy, setBusy] = useState("");
  const send = async (status) => {
    setBusy("saving");
    try { await onSave(student, status, note); setBusy("saved"); } catch (e) { setBusy("Not saved: " + e.message); }
  };
  return (
    <article className="vpr-row">
      <div className="vpr-head">
        <b className="vpr-name">{student.name}</b>
        <span className={"vpr-chip vpr-" + where.kind}>{LABEL[where.kind]}</span>
      </div>
      {!sheet ? <p className="vpr-muted">Has not opened the sheet.</p> : (
        <>
          <p className="vpr-line"><span className="vpr-k">Prompt</span>{promptName(a.prompt)}</p>
          {BOXES.map(b => a[b.field] ? <p key={b.field} className="vpr-line"><span className="vpr-k">{copy.say("box." + b.field)}</span>{a[b.field]}</p> : null)}
          {missingOf(a).length ? <p className="vpr-muted">{missingOf(a).length} boxes empty.</p> : null}
          <textarea className="vpr-note" rows={2} value={note} placeholder="A note the student sees" onChange={e => setNote(e.target.value)} disabled={disabled} />
          <div className="vpr-act">
            <button type="button" className="vpr-btn" disabled={disabled || busy === "saving"} onClick={() => send("approved")}>Approved</button>
            <button type="button" className="vpr-btn" disabled={disabled || busy === "saving"} onClick={() => send("needs_work")}>Needs work</button>
            {busy ? <span className="vpr-muted">{busy === "saving" ? "Saving" : busy === "saved" ? "Saved" : busy}</span> : null}
          </div>
        </>
      )}
    </article>
  );
}

function Shell({ children }) {
  return <div className="vpr"><style>{CSS}</style><div className="vpr-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.vpr{padding:20px 16px 80px;color:${T.primary}}
.vpr-in{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.vpr-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.vpr-h2{margin:18px 0 0;font-size:19px;font-weight:700}
.vpr-p{margin:0;font-size:16px;color:${T.secondary}}
.vpr-warn{margin:0;font-size:16px;color:${ST.late}}
.vpr-tabs{display:flex;gap:8px}
.vpr-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer}
.vpr-on{background:${T.primary};border-color:${T.primary};color:${S.page}}
.vpr-row{border-top:1px solid ${L.soft};padding:16px 0 4px;display:flex;flex-direction:column;gap:8px}
.vpr-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.vpr-name{font-size:18px}
.vpr-chip{font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px;border:1px solid ${L.strong};color:${T.secondary}}
.vpr-waiting{border-color:${ST.warn};color:${ST.warn}}
.vpr-approved{border-color:${ST.ok};color:${ST.ok}}
.vpr-needs{border-color:${ST.late};color:${ST.late}}
.vpr-line{margin:0;font-size:15.5px;line-height:1.5;white-space:pre-wrap}
.vpr-k{display:block;font-size:12.5px;font-weight:600;color:${T.muted}}
.vpr-muted{margin:0;font-size:14.5px;color:${T.muted}}
.vpr-note{width:100%;box-sizing:border-box;font:inherit;font-size:15px;padding:8px 10px;border:1px solid ${L.strong};border-radius:10px;background:${S.card};color:${T.primary};resize:vertical}
.vpr-act{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.vpr-btn{font:inherit;font-size:15px;font-weight:600;padding:8px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.vpr-btn:disabled{opacity:.5;cursor:default}
`;
