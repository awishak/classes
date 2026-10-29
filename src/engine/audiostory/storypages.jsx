// Andrew's pages for the audio story: ?review and ?control on
// /comm3/worksheets/audio-story.
//
// The review is the visual story review's shape: problem reports, then where
// every student stands by section, with the cover, the headline, the clip to
// play, what is left before Submit, a link to open the story, and the
// late-work unlock. The control page states the mechanism from the code
// itself (Andrew, 2026-10-29: "a control page, an instructor page that tells
// me exactly why everything's happening and exactly how everything is
// happening"). Reads and writes go through /api/worksheet-submits, which
// checks the PIN or an instructor session and holds the service key.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { idOf } from "../roster.js";
import { gameClient } from "../gameClient.js";
import { localWorksheet, openTo } from "../localWorksheets.js";
import { useClassState } from "../store.js";
import { StudentLink } from "../StudentPage.jsx";
import { audioStoryOf, problemsOf, clock, MAX_STORY_SECONDS, MAX_LISTEN_WORDS } from "./storymodel.js";
import { AUDIO_STORY_KEY, AUDIO_STORY_COPY_ROW, STEPS } from "./story.jsx";
import { AUDIO_RESEARCH_KEY } from "./research.jsx";
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
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Signed links for every cover and clip on a set of sheets, through the
// server, so the PIN sign-in can see and play them too. { [path]: url }.
function useUrls(config, sheets) {
  const [urls, setUrls] = useState({});
  const paths = (sheets || []).flatMap(s => { const st = audioStoryOf(s.answers); return [st.cover?.path, st.audio?.path]; }).filter(Boolean).sort().join("\n");
  useEffect(() => {
    if (!paths) return undefined;
    let alive = true;
    call({ groupKey: config.id, key: AUDIO_STORY_KEY, sign: paths.split("\n") }).then(out => { if (alive) setUrls(out.urls || {}); }).catch(() => {});
    return () => { alive = false; };
  }, [config.id, paths]);
  return urls;
}

export function AudioStoryReview({ config, worksheetKey = AUDIO_STORY_KEY, roster }) {
  const [sheets, setSheets] = useState(null);
  const [reports, setReports] = useState([]);
  const [due, setDue] = useState(null);
  const [error, setError] = useState("");
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  const urls = useUrls(config, sheets);

  useEffect(() => {
    let alive = true;
    const ask = () => call({ groupKey: config.id, key: worksheetKey, all: true }).then(out => { if (alive) setSheets(out.sheets); }).catch(e => { if (alive) setError(e.message); });
    ask();
    const t = setInterval(() => { if (document.visibilityState !== "hidden") ask(); }, 30000);
    call({ groupKey: config.id, key: worksheetKey, reports: true }).then(out => { if (alive) setReports(out.reports); }).catch(() => {});
    gameClient.from("worksheet_deadlines").select("due_at").eq("worksheet_key", worksheetKey).eq("group_key", config.id)
      .then(r => { if (alive) setDue(r.data && r.data[0] ? r.data[0].due_at : null); });
    return () => { alive = false; clearInterval(t); };
  }, [config.id, worksheetKey]);

  if (error) return <Shell><p className="asv-p">Could not read the stories: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="asv-p">Loading the stories.</p></Shell>;

  const nameOf = new Map(roster.filter(s => s.email).map(s => [lower(s.email), s.name]));
  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const onRoster = new Set(roster.filter(s => s.email).map(s => lower(s.email)));
  const others = sheets.filter(s => !onRoster.has(s.viewer_id));
  const past = due && Date.now() > Date.parse(due);
  const setUnlock = async (email, until) => {
    const out = await call({ groupKey: config.id, key: worksheetKey, viewer: email, unlock: { until } });
    setSheets(list => list.map(s => (s.viewer_id === email ? { ...s, unlockedUntil: out.until } : s)));
  };
  const submittedCount = people.filter(p => byEmail.get(lower(p.email))?.submitted_at).length;
  const base = "/" + config.id + "/worksheets/" + worksheetKey;

  return (
    <Shell>
      <h1 className="asv-title">Audio stories</h1>
      <p className="asv-p">{due ? (past ? "Locked since " : "Locks ") + when(due) + "." : "No due date is set in the database, so nothing locks."} Students' work saves as they go; a story counts as submitted once they press Submit. This page asks again every half minute. <a className="asv-link" href={base + "?control"}>How the sheet works</a>.</p>

      <section className="asv-reports">
        <h2 className="asv-h2">Problem reports {reports.length ? <span className="asv-badge">{reports.length}</span> : null}</h2>
        {!reports.length ? <p className="asv-muted">No student has reported a problem.</p> : reports.map(r => (
          <article key={r.id} className="asv-report">
            <div className="asv-row"><b>{nameOf.get(r.viewer_id) || r.viewer_id}</b><span className="asv-muted">{when(r.created_at)}</span></div>
            {r.message ? <p className="asv-msg">{r.message}</p> : <p className="asv-muted">No note.</p>}
            <details className="asv-details">
              <summary>Details from the page</summary>
              <ul className="asv-list">
                <li>Saving: {r.details?.status || "unknown"}{(r.details?.pending || []).length ? ", " + r.details.pending.length + " answer(s) not yet on the server" : ""}</li>
                {(r.details?.errors || []).map((e, i) => <li key={i}>{e.name}: {e.error}</li>)}
                <li>Browser: {r.details?.agent || "unknown"}</li>
              </ul>
            </details>
          </article>
        ))}
      </section>

      {sections.length > 1 ? (
        <div className="asv-tabs" role="tablist">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className="asv-tab" onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}
      <h2 className="asv-h2">Stories{section ? ", " + section : ""}</h2>
      <p className="asv-p">{submittedCount} of {people.length} submitted.</p>
      {people.map(p => <Row key={p.email} config={config} student={p} email={lower(p.email)} link={idOf(p)} sheet={byEmail.get(lower(p.email))} urls={urls} due={due} past={past} onUnlock={setUnlock} />)}
      {others.length ? <h2 className="asv-h2">Not on the roster</h2> : null}
      {others.map(s => <Row key={s.viewer_id} config={config} student={null} email={s.viewer_id} link={null} sheet={s} urls={urls} due={due} past={past} onUnlock={setUnlock} />)}
    </Shell>
  );
}

function Row({ config, student, email, link, sheet, urls, due, past, onUnlock }) {
  const [busy, setBusy] = useState("");
  const story = audioStoryOf(sheet?.answers || {});
  const started = !!sheet && Object.keys(sheet.answers || {}).length > 0;
  const late = sheet?.submitted_at && due && Date.parse(sheet.submitted_at) > Date.parse(due);
  const left = started ? problemsOf(story) : [];
  const unlocked = sheet?.unlockedUntil && Date.parse(sheet.unlockedUntil) > Date.now();
  const chip = sheet?.submitted_at ? (late ? ["late", "Submitted late"] : ["done", "Submitted"]) : started ? ["working", "Working"] : ["none", "Not started"];
  const act = async (until) => {
    if (!onUnlock) return;
    setBusy("saving");
    try { await onUnlock(email, until); setBusy(""); } catch (e) { setBusy("Not saved: " + e.message); }
  };
  const cover = story.cover && urls[story.cover.path];
  const clip = story.audio && urls[story.audio.path];
  return (
    <article className="asv-item">
      <div className="asv-row">
        <b className="asv-name">{student ? <StudentLink config={config} student={student} /> : email}</b>
        <span className={"asv-chip asv-" + chip[0]}>{chip[1]}</span>
        {sheet?.submitted_at ? <span className="asv-muted">{when(sheet.submitted_at)}</span> : null}
        <span className="asv-grow" />
        {started && link ? <a className="asv-link" href={"/" + config.id + "/worksheets/" + AUDIO_STORY_KEY + "?s=" + encodeURIComponent(link)}>Open story</a> : null}
      </div>
      {started ? (
        <div className="asv-story">
          {cover ? <img className="asv-cover" src={cover} alt="" /> : <span className="asv-cover asv-cover-none">No cover</span>}
          <div className="asv-story-body">
            <p className="asv-head">{story.headline.trim() || "No headline yet"}</p>
            {story.listen.trim() ? <p className="asv-muted">{story.listen}</p> : null}
            {story.audio ? (clip ? <audio controls preload="metadata" src={clip} /> : <span className="asv-muted">Signing the link.</span>) : <span className="asv-muted">No file yet.</span>}
            <p className="asv-muted">{story.audio ? clock(story.audio.seconds) + ", " : ""}{story.voices.length} voice{story.voices.length === 1 ? "" : "s"}{story.voices.some(v => v.knew === false) ? " (" + story.voices.filter(v => v.knew === false).map(v => v.name.trim() || "unnamed").join(", ") + " did not know)" : ""}, {story.sounds.length} sound{story.sounds.length === 1 ? "" : "s"}{left.length ? ", " + left.length + " thing" + (left.length === 1 ? "" : "s") + " left before Submit" : ""}.</p>
          </div>
        </div>
      ) : null}
      {past && sheet ? (
        <div className="asv-row">
          {unlocked ? <span className="asv-muted">Unlocked until {when(sheet.unlockedUntil)}.</span> : null}
          <button type="button" className="asv-btn" disabled={busy === "saving"} onClick={() => act(new Date(Date.now() + 24 * 3600e3).toISOString())}>Unlock for 24 hours</button>
          <button type="button" className="asv-btn" disabled={busy === "saving"} onClick={() => act(new Date(Date.now() + 72 * 3600e3).toISOString())}>Unlock for 3 days</button>
          {unlocked ? <button type="button" className="asv-btn" disabled={busy === "saving"} onClick={() => act(null)}>Lock again</button> : null}
          {busy && busy !== "saving" ? <span className="asv-bad">{busy}</span> : null}
        </div>
      ) : null}
    </article>
  );
}

const FIELD_SAY = {
  audio: "the file, JSON { path, seconds, name }",
  cover: "the cover picture, JSON { path, w, h }",
  headline: "the headline, a line",
  listen: "the listen line, up to " + MAX_LISTEN_WORDS + " words",
  voices: "everyone who talks, JSON [{ id, name, role, knew }], knew true, false or null",
  sounds: "the sounds, JSON [{ id, what, kind, from }], kind mine, music or found",
  look: "light or dark",
  credits: "who did what, a pair only",
};

export function AudioStoryControl({ config, worksheetKey = AUDIO_STORY_KEY, roster }) {
  const [data] = useClassState(config.storageKey);
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const [who, setWho] = useState("");
  const local = localWorksheet(worksheetKey);
  const base = "/" + config.id + "/worksheets/" + worksheetKey;
  const people = roster.filter(s => s.email && !isLurker(s.name));
  useEffect(() => {
    let alive = true;
    call({ groupKey: config.id, key: worksheetKey, all: true }).then(out => { if (alive) setSheets(out.sheets); }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [config.id, worksheetKey]);
  const urls = useUrls(config, sheets);
  const sheet = sheets && who ? sheets.find(s => s.viewer_id === lower(who)) || null : null;
  return (
    <Shell>
      <h1 className="asv-title">Audio story, how the sheet works</h1>
      <p className="asv-p"><a className="asv-link" href={base}>The sheet</a> · <a className="asv-link" href={base + "?review"}>Review</a> · <a className="asv-link" href={"/" + config.id + "/worksheets/" + AUDIO_RESEARCH_KEY + "?control"}>Audio exercise control</a></p>

      <h2 className="asv-h2">Open</h2>
      <p className="asv-p">{local ? (openTo(local, config.id, data) ? "Open to " + config.code + " students now." : "Not open to " + config.code + " students.") : "Not registered."} The registry says {JSON.stringify(local?.open)}; the class's worksheetsOpen switch on the Worksheets page, when set, wins: {JSON.stringify(data?.worksheetsOpen?.[worksheetKey] ?? null)}. The door on the student home shows while the sheet is open and the Audio story assignment's due date has not passed.</p>

      <h2 className="asv-h2">The page</h2>
      <p className="asv-p">Building on the left, the story page live on the right (one column on a phone, with Build and Hear your story tabs). The steps at the top are these, each editable in place with Edit the words:</p>
      <ol className="asv-list">{STEPS.map(([k, name, say]) => <li key={k}><b>{name}</b> {say}</li>)}</ol>

      <h2 className="asv-h2">Fields</h2>
      <p className="asv-p">One row per field per student in worksheet_answers, written 700 ms after the last change, with a copy kept in the browser until the server has the same words. A row holds 500 characters, so a longer value is cut into rows by position and joined on read.</p>
      <ul className="asv-list">{Object.keys(FIELD_SAY).map(f => <li key={f}><code>{f}</code> {FIELD_SAY[f]}</li>)}</ul>

      <h2 className="asv-h2">The file and the cover</h2>
      <p className="asv-p">The file is m4a, mp3, wav or aac, at most {clock(MAX_STORY_SECONDS)} (a file that reads a second over passes, for rounding) and under 30 MB, the bucket's cap, which a five-minute wav can exceed; m4a and mp3 do not. The browser reads the length off the file first and refuses a longer one or another format before anything goes up. The file goes straight into the private visual-story bucket at {config.id}/(email)/audio-(id).(ext) as the student. The cover is any picture, iPhone HEIC included, redrawn at most 2000 pixels on the long side as a JPEG in the browser, then up into the same folder. The bucket's rules keep a student to their own folder and let the instructor read every folder. Swapping a file leaves the old one in the bucket. The student plays the clip back through a signed link an hour long made with their own token; the review and this page sign links through the server.</p>

      <h2 className="asv-h2">Submit</h2>
      <p className="asv-p">Submit is refused in the browser until every rule holds, with the list of what is left: a file, a cover, a headline, a listen line of 1 to {MAX_LISTEN_WORDS} words, at least one voice, every voice named and marked whether they knew they were being recorded, and a line about where every piece of music or found audio came from. Then every pending answer is flushed and submitted_at is written on the student's worksheet_sheets row; the first submit also sets first_submitted_at, which the lateness read uses. Submitting again overwrites submitted_at only. After the due date in worksheet_deadlines (sql/audio-story.sql), the database refuses every save and submit for that sheet, and the Unlock buttons on the review write a worksheet_unlocks row that lets one student through until a time.</p>

      <h2 className="asv-h2">The headline, the pair and the knew mark</h2>
      <p className="asv-p">A story with no headline starts from the <code>story</code> line on the student's audio exercise sheet, read once on load. The pair line reads the row <code>audio-pairs-plan</code>, the one the Pairs view on the ideas review writes; each member of a pair has their own sheet and submits their own copy, with a Made with box for who did what, the way the audio exercise works. The knew-they-were-recorded mark is on each voice; the story page a classmate sees never draws it, and the instructor's read (?s=) and the review do.</p>

      <h2 className="asv-h2">Words</h2>
      <p className="asv-p">Every line a student reads has a default in the code and can be changed in place on the sheet while signed in as the instructor (Edit the words). Edits live in the app_data row <code>{AUDIO_STORY_COPY_ROW}</code>, which only an instructor can write. A cleared line puts the default back.</p>

      <h2 className="asv-h2">Who sees what</h2>
      <p className="asv-p">A student signed in by email sees and writes their own sheet only. The instructor's own email gets a sheet of its own for trying the page. The review and this page need an instructor session or the PIN. Reads of every sheet go through the server with the service key. Problem reports go into worksheet_reports and show at the top of the review.</p>

      <h2 className="asv-h2">One student</h2>
      {error ? <p className="asv-p">Could not read the sheets: {error}</p> : null}
      <select className="asv-select" value={who} onChange={e => setWho(e.target.value)} aria-label="Student">
        <option value="">Choose a student</option>
        {people.map(p => <option key={p.email} value={p.email}>{p.name}{sectionOf(p) ? " · " + sectionOf(p) : ""}</option>)}
      </select>
      {who && sheets ? (sheet ? (<>
        <p className="asv-p">{sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) + "." : "Started, not submitted."} {Object.keys(sheet.answers || {}).length} fields on the server.</p>
        <Row config={config} student={people.find(p => lower(p.email) === lower(who)) || null} email={lower(who)} link={null} sheet={sheet} urls={urls} due={null} past={false} onUnlock={null} />   {/* past is false, so no Unlock button draws here; the review has them */}
        <pre className="asv-pre">{JSON.stringify(sheet.answers, null, 2)}</pre>
      </>) : <p className="asv-p">No sheet opened yet.</p>) : null}
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="asv"><style>{CSS}</style><div className="asv-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.asv{padding:20px 16px 80px;color:${T.primary}}
.asv-in{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.asv-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.asv-h2{margin:12px 0 0;font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px}
.asv-badge{font-size:13px;font-weight:700;border-radius:999px;padding:2px 9px;background:${ST.late};color:#fff}
.asv-p{margin:0;font-size:16px;line-height:1.5;color:${T.secondary}}
.asv-p code,.asv-list code{font-size:14px;background:${S.sunk};padding:1px 6px;border-radius:6px;color:${T.primary}}
.asv-muted{margin:0;font-size:14.5px;line-height:1.5;color:${T.muted}}
.asv-bad{color:${ST.late};font-size:14px}
.asv-link{color:${T.primary};font-weight:600}
.asv-list{margin:0;padding-left:20px;font-size:15.5px;line-height:1.6;color:${T.secondary}}
.asv-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.asv-grow{flex:1}
.asv-tabs{display:flex;gap:8px;flex-wrap:wrap}
.asv-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer;min-height:34px}
.asv-tab[aria-selected="true"]{background:${T.primary};border-color:${T.primary};color:${S.page}}
.asv-reports{display:flex;flex-direction:column;gap:10px}
.asv-report{padding:10px 12px;border-radius:10px;background:${S.sunk};display:flex;flex-direction:column;gap:6px}
.asv-msg{margin:0;font-size:15.5px;white-space:pre-wrap}
.asv-details summary{font-size:14px;color:${T.muted};cursor:pointer}
.asv-item{border-top:1px solid ${L.soft};padding:14px 0 6px;display:flex;flex-direction:column;gap:10px}
.asv-name{font-size:18px}
.asv-chip{font-size:13px;font-weight:600;border-radius:999px;padding:3px 10px;border:1px solid ${L.strong};color:${T.secondary}}
.asv-done{border-color:${ST.ok};color:${ST.ok}}
.asv-late{border-color:${ST.late};color:${ST.late}}
.asv-working{border-color:${ST.warn};color:${ST.warn}}
.asv-story{display:grid;grid-template-columns:96px minmax(0,1fr);gap:14px;padding:10px 12px;border-radius:12px;background:${S.sunk}}
.asv-story-body{display:flex;flex-direction:column;gap:6px;min-width:0}
.asv-story-body audio{width:min(100%,480px)}
.asv-cover{display:block;width:96px;height:96px;object-fit:cover;border-radius:10px;background:${S.card}}
.asv-cover-none{display:flex;align-items:center;justify-content:center;font-size:12px;color:${T.muted};border:1px dashed ${L.strong};box-sizing:border-box}
.asv-head{margin:0;font-size:17px;font-weight:600;line-height:1.3}
.asv-btn{font:inherit;font-size:14px;font-weight:600;padding:6px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.asv-btn:disabled{opacity:.45;cursor:default}
.asv-select{font:inherit;font-size:16px;padding:8px 12px;border-radius:10px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};max-width:360px}
.asv-pre{margin:0;font-size:13px;line-height:1.5;padding:12px;border-radius:10px;background:${S.sunk};overflow:auto;white-space:pre-wrap;word-break:break-word}
@media (max-width:560px){ .asv-story{grid-template-columns:1fr} }
`;
