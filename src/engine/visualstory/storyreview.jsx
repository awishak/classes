// Andrew's side of the visual story: /comm3/worksheets/visual-story?review.
//
// One page for what he needs while the stories are being built: problem
// reports from students (planning, 2026-10-13: "A Report a problem button
// that sends you what went wrong, with the details"), where every student
// stands, a link to open any student's story, and the late-work unlock
// ("A button that unlocks one student's story"). Grouped by section, because
// the 8:00 and the 10:30 never mix.
//
// Reads and writes through /api/worksheet-submits, which checks the PIN or an
// instructor session and holds the service key.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { idOf } from "../roster.js";
import { gameClient } from "../gameClient.js";
import { storyOf, problemsOf, wordCount, imageCount } from "./model.js";
import { VISUAL_STORY_KEY } from "./story.jsx";
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
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function StoryReview({ config, worksheetKey = VISUAL_STORY_KEY, roster }) {
  const [sheets, setSheets] = useState(null);
  const [reports, setReports] = useState([]);
  const [due, setDue] = useState(null);
  const [error, setError] = useState("");
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");

  useEffect(() => {
    call({ groupKey: config.id, key: worksheetKey, all: true }).then(out => setSheets(out.sheets)).catch(e => setError(e.message));
    call({ groupKey: config.id, key: worksheetKey, reports: true }).then(out => setReports(out.reports)).catch(() => {});
    gameClient.from("worksheet_deadlines").select("due_at").eq("worksheet_key", worksheetKey).eq("group_key", config.id)
      .then(r => setDue(r.data && r.data[0] ? r.data[0].due_at : null));
  }, [config.id, worksheetKey]);

  if (error) return <Shell><p className="vsv-p">Could not read the stories: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="vsv-p">Loading the stories.</p></Shell>;

  const nameOf = new Map(roster.filter(s => s.email).map(s => [String(s.email).trim().toLowerCase(), s.name]));
  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const onRoster = new Set(roster.filter(s => s.email).map(s => String(s.email).trim().toLowerCase()));
  const others = sheets.filter(s => !onRoster.has(s.viewer_id));
  const past = due && Date.now() > Date.parse(due);
  const setUnlock = async (email, until) => {
    const out = await call({ groupKey: config.id, key: worksheetKey, viewer: email, unlock: { until } });
    setSheets(list => list.map(s => (s.viewer_id === email ? { ...s, unlockedUntil: out.until } : s)));
  };
  const submittedCount = people.filter(p => byEmail.get(String(p.email).trim().toLowerCase())?.submitted_at).length;

  return (
    <Shell>
      <h1 className="vsv-title">Visual stories</h1>
      <p className="vsv-p">{due ? (past ? "Locked since " : "Locks ") + when(due) + "." : "No due date is set in the database."} Students' work saves as they go; a story counts as submitted once they press Submit.</p>

      <section className="vsv-reports">
        <h2 className="vsv-h2">Problem reports {reports.length ? <span className="vsv-badge">{reports.length}</span> : null}</h2>
        {!reports.length ? <p className="vsv-muted">No student has reported a problem.</p> : reports.map(r => (
          <article key={r.id} className="vsv-report">
            <div className="vsv-row"><b>{nameOf.get(r.viewer_id) || r.viewer_id}</b><span className="vsv-muted">{when(r.created_at)}</span></div>
            {r.message ? <p className="vsv-msg">{r.message}</p> : <p className="vsv-muted">No note.</p>}
            <details className="vsv-details">
              <summary>Details from the page</summary>
              <ul className="vsv-list">
                <li>Saving: {r.details?.status || "unknown"}{(r.details?.pending || []).length ? ", " + r.details.pending.length + " answer(s) not yet on the server" : ""}</li>
                {(r.details?.errors || []).map((e, i) => <li key={i}>{e.name}: {e.error}</li>)}
                <li>Browser: {r.details?.agent || "unknown"}</li>
              </ul>
            </details>
          </article>
        ))}
      </section>

      {sections.length > 1 ? (
        <div className="vsv-tabs" role="tablist">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className="vsv-tab" onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}
      <p className="vsv-p">{submittedCount} of {people.length} submitted.</p>
      {people.map(p => <Row key={p.email} config={config} name={p.name} email={String(p.email).trim().toLowerCase()} link={idOf(p)} sheet={byEmail.get(String(p.email).trim().toLowerCase())} due={due} past={past} onUnlock={setUnlock} />)}
      {others.length ? <h2 className="vsv-h2">Not on the roster</h2> : null}
      {others.map(s => <Row key={s.viewer_id} config={config} name={s.viewer_id} email={s.viewer_id} link={null} sheet={s} due={due} past={past} onUnlock={setUnlock} />)}
    </Shell>
  );
}

function Row({ config, name, email, link, sheet, due, past, onUnlock }) {
  const [busy, setBusy] = useState("");
  const story = storyOf(sheet?.answers || {});
  const started = !!sheet && Object.keys(sheet.answers || {}).length > 0;
  const late = sheet?.submitted_at && due && Date.parse(sheet.submitted_at) > Date.parse(due);
  const left = problemsOf(story).length;
  const unlocked = sheet?.unlockedUntil && Date.parse(sheet.unlockedUntil) > Date.now();
  const chip = sheet?.submitted_at ? (late ? ["late", "Submitted late"] : ["done", "Submitted"]) : started ? ["working", "Working"] : ["none", "Not started"];
  const act = async (until) => {
    setBusy("saving");
    try { await onUnlock(email, until); setBusy(""); } catch (e) { setBusy("Not saved: " + e.message); }
  };
  return (
    <article className="vsv-item">
      <div className="vsv-row">
        <b className="vsv-name">{name}</b>
        <span className={"vsv-chip vsv-" + chip[0]}>{chip[1]}</span>
        {sheet?.submitted_at ? <span className="vsv-muted">{when(sheet.submitted_at)}</span> : null}
        <span className="vsv-grow" />
        {started && link ? <a className="vsv-link" href={"/" + config.id + "/worksheets/" + VISUAL_STORY_KEY + "?s=" + encodeURIComponent(link)}>Open story</a> : null}
      </div>
      {started ? <p className="vsv-muted">{story.headline ? "“" + story.headline + "”, " : ""}{imageCount(story)} pictures, {wordCount(story)} words{left ? ", " + left + " thing" + (left === 1 ? "" : "s") + " left before Submit" : ""}.</p> : null}
      {past && sheet ? (
        <div className="vsv-row">
          {unlocked ? <span className="vsv-muted">Unlocked until {when(sheet.unlockedUntil)}.</span> : null}
          <button type="button" className="vsv-btn" disabled={busy === "saving"} onClick={() => act(new Date(Date.now() + 24 * 3600e3).toISOString())}>Unlock for 24 hours</button>
          <button type="button" className="vsv-btn" disabled={busy === "saving"} onClick={() => act(new Date(Date.now() + 72 * 3600e3).toISOString())}>Unlock for 3 days</button>
          {unlocked ? <button type="button" className="vsv-btn" disabled={busy === "saving"} onClick={() => act(null)}>Lock again</button> : null}
          {busy && busy !== "saving" ? <span className="vsv-bad">{busy}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

// A strip on the dashboard when a student has reported a problem since
// Andrew last looked. Only for the classes the visual story belongs to.
const SEEN = "visual-story-reports-seen";
export function ReportsBanner({ config }) {
  const [fresh, setFresh] = useState([]);
  useEffect(() => {
    if (!["comm3", "comm999"].includes(config.id)) return;
    let alive = true;
    let seen = 0;
    try { seen = Number(localStorage.getItem(SEEN + ":" + config.id) || 0); } catch { /* none */ }
    call({ groupKey: config.id, key: VISUAL_STORY_KEY, reports: true })
      .then(out => { if (alive) setFresh((out.reports || []).filter(r => Date.parse(r.created_at) > seen)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [config.id]);
  if (!fresh.length) return null;
  const open = () => { try { localStorage.setItem(SEEN + ":" + config.id, String(Date.now())); } catch { /* none */ } };
  return (
    <div className="vsv-banner" role="status">
      <style>{BANNER_CSS}</style>
      <b>{fresh.length === 1 ? "A student reported a problem" : fresh.length + " students reported problems"} on the visual story.</b>
      <a className="vsv-banner-link" href={"/" + config.id + "/worksheets/" + VISUAL_STORY_KEY + "?review"} onClick={open}>Read the reports</a>
    </div>
  );
}
const BANNER_CSS = `
.vsv-banner{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:10px 16px 0;padding:10px 16px;border-radius:12px;background:${TOKENS.SURFACE.sunk};box-shadow:inset 4px 0 0 ${TOKENS.STATE.late};font-size:15px;color:${TOKENS.TEXT.primary}}
.vsv-banner-link{font-weight:700;color:${TOKENS.TEXT.primary}}
`;

function Shell({ children }) {
  return <div className="vsv"><style>{CSS}</style><div className="vsv-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.vsv{padding:22px 16px 80px;color:${T.primary}}
.vsv-in{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.vsv-title{margin:0;font-size:30px;font-weight:700;letter-spacing:-.02em}
.vsv-h2{margin:10px 0 0;font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px}
.vsv-p{margin:0;font-size:16px;color:${T.secondary}}
.vsv-muted{margin:0;font-size:14.5px;color:${T.muted}}
.vsv-bad{color:${ST.late};font-size:14.5px}
.vsv-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.vsv-grow{flex:1}
.vsv-badge{font-size:12px;font-weight:700;color:#fff;background:${ST.late};border-radius:999px;padding:2px 9px}
.vsv-reports{display:flex;flex-direction:column;gap:10px}
.vsv-report{border-left:4px solid ${ST.warn};background:${S.sunk};border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:6px}
.vsv-msg{margin:0;font-size:15.5px;white-space:pre-wrap}
.vsv-details{font-size:14px;color:${T.secondary}}
.vsv-list{margin:6px 0 0;padding-left:20px}
.vsv-tabs{display:flex;gap:8px;margin-top:8px}
.vsv-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer}
.vsv-tab[aria-selected="true"]{background:${T.primary};border-color:${T.primary};color:${S.page}}
.vsv-item{border-top:1px solid ${L.soft};padding:12px 0 2px;display:flex;flex-direction:column;gap:6px}
.vsv-name{font-size:17px}
.vsv-chip{font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px;border:1px solid ${L.strong};color:${T.secondary}}
.vsv-done{border-color:${ST.ok};color:${ST.ok}}
.vsv-late{border-color:${ST.late};color:${ST.late}}
.vsv-working{border-color:${ST.warn};color:${ST.warn}}
.vsv-none{color:${T.muted}}
.vsv-link{font-size:15px;font-weight:600;color:${T.primary}}
.vsv-btn{font:inherit;font-size:14px;font-weight:600;padding:6px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.vsv-btn:disabled{opacity:.5;cursor:default}
`;
