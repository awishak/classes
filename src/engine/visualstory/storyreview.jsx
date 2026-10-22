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
import { storyOf, problemsOf, wordCount, imageCount, stageAt } from "./model.js";
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
      <ReadingPanel config={config} section={section} />
      <h2 className="vsv-h2">Building{section ? ", " + section : ""}</h2>
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
      {started ? <p className="vsv-muted">{story.headline ? "“" + story.headline + "”, " : ""}{story.kind === "html" ? "HTML story, " + (story.html ? "file up" : "no file yet") + ", feature image " + (imageCount(story) ? "set" : "missing") : imageCount(story) + " pictures, " + wordCount(story) + " words"}{left ? ", " + left + " thing" + (left === 1 ? "" : "s") + " left before Submit" : ""}.</p> : null}
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

// ─── the reading phase: stages, pods, counts, comments ───

const storyApi = async (config, body) => {
  const r = await fetch("/api/visual-story", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), groupKey: config.id, ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};
const NEXT = { building: ["reading", "Open the stories for reading"], reading: ["closed", "Close comments"], closed: ["released", "Release the names"] };
const STAGE_SAY = { building: "Students are still building. Classmates cannot see any story yet.", reading: "The stories are open with no names. Students are reading and commenting.", closed: "Comments are closed. Names are still hidden.", released: "Names are out. Each student sees the comments on their own story." };
const BACK = { reading: "building", closed: "reading", released: "closed" };
// A time for the datetime-local box, in this computer's zone, and back to ISO.
const localOf = (iso) => { if (!iso) return ""; const d = new Date(iso); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

/** Pods of about five from a list already sorted so similar topics sit together. */
export function suggestPods(people, size = 5) {
  const n = people.length;
  if (!n) return [];
  const k = Math.max(1, Math.round(n / size));
  const out = [];
  let at = 0;
  for (let i = 0; i < k; i++) {
    const take = Math.floor(n / k) + (i < n % k ? 1 : 0);
    people.slice(at, at + take).forEach(p => out.push({ email: p.email, pod: i + 1 }));
    at += take;
  }
  return out;
}

export function ReadingPanel({ config, section }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [pods, setPods] = useState({});            // email -> pod number
  const [busy, setBusy] = useState("");
  const [opensAt, setOpensAt] = useState({});      // section -> the datetime-local box
  const load = () => storyApi(config, { action: "admin" }).then(out => {
    setData(out);
    setPods(Object.fromEntries(out.pods.map(p => [p.email, p.pod])));
    setOpensAt(Object.fromEntries(Object.entries(out.opens || {}).map(([k, v]) => [k, localOf(v)])));
  }).catch(e => setError(e.message));
  useEffect(() => { load(); }, [config.id]);
  if (error) return <p className="vsv-bad">Could not read the reading phase: {error}{/opens_at|best_where/.test(error) ? " Run sql/visual-story-html.sql in Supabase." : /relation|does not exist/.test(error) ? " Run sql/visual-story-reading.sql in Supabase." : ""}</p>;
  if (!data) return <p className="vsv-muted">Loading the reading phase.</p>;
  const sec = data.sections.includes(section) ? section : (data.sections[0] || "");
  const stage = data.stages[sec] || "building";
  const people = data.people.filter(p => p.section === sec && !isLurker(p.name));
  const run = async (what, fn) => { setBusy(what); try { await fn(); await load(); setBusy(""); } catch (e) { setBusy("Not done: " + e.message); } };
  const suggest = async () => {
    // Similar topics together: the prompt each student chose on pre-production, then their topic words.
    let pre = [];
    try { pre = (await call({ groupKey: config.id, key: "visual-pre", all: true })).sheets || []; } catch { /* no topics yet */ }
    const by = new Map(pre.map(s => [s.viewer_id, s.answers || {}]));
    const sorted = people.slice().sort((a, b) => {
      const A = by.get(a.email) || {}, B = by.get(b.email) || {};
      return String(A.prompt || "~").localeCompare(String(B.prompt || "~")) || String(A.topic || "").localeCompare(String(B.topic || "")) || a.name.localeCompare(b.name);
    });
    setPods(p => ({ ...p, ...Object.fromEntries(people.map(x => [x.email, 0])), ...Object.fromEntries(suggestPods(sorted).map(x => [x.email, x.pod])) }));
  };
  const podCount = Math.max(1, ...people.map(p => pods[p.email] || 0), Math.round(people.length / 5));
  const stories = data.stories.filter(s => s.section === sec);
  const nextStage = NEXT[stage];
  const opens = (data.opens || {})[sec] || null;
  const saveOpens = (at) => run("opens", () => storyApi(config, { action: "opens", section: sec, opensAt: at ? new Date(at).toISOString() : null }));
  return (
    <section className="vsv-reading">
      <h2 className="vsv-h2">Reading and comments{sec ? ", " + sec : ""}</h2>
      <p className="vsv-p"><b>{STAGE_SAY[stage]}</b> {stories.length} submitted {stories.length === 1 ? "story" : "stories"} in this section.</p>
      <div className="vsv-row">
        {nextStage ? <button type="button" className="vsv-btn vsv-btn-main" disabled={!!busy && !busy.startsWith("Not")} onClick={() => run("stage", () => storyApi(config, { action: "stage", section: sec, stage: nextStage[0] }))}>{nextStage[1]}</button> : null}
        {BACK[stage] ? <button type="button" className="vsv-btn" disabled={!!busy && !busy.startsWith("Not")} onClick={() => run("stage", () => storyApi(config, { action: "stage", section: sec, stage: BACK[stage] }))}>Go back a step</button> : null}
        <a className="vsv-link" href={"/" + config.id + "/stories"} target="_blank" rel="noreferrer">The students' page</a>
        {busy && busy.startsWith("Not") ? <span className="vsv-bad">{busy}</span> : null}
      </div>
      {stage === "building" ? (
        <div className="vsv-row">
          <label className="vsv-row">Opens for reading on its own at <input className="vsv-time" type="datetime-local" value={opensAt[sec] || ""} onChange={e => setOpensAt(o => ({ ...o, [sec]: e.target.value }))} /></label>
          <button type="button" className="vsv-btn" disabled={busy === "opens" || !opensAt[sec]} onClick={() => saveOpens(opensAt[sec])}>Save the time</button>
          {opens ? <button type="button" className="vsv-btn" disabled={busy === "opens"} onClick={() => saveOpens(null)}>Take the time away</button> : null}
          {opens ? <span className="vsv-muted">Set for {when(opens)}.</span> : null}
        </div>
      ) : null}

      <h3 className="vsv-h3">Pods</h3>
      <p className="vsv-muted">Pods of about five, inside this section. Suggest groups students by the prompt and topic from pre-production; move anyone, then save.</p>
      <div className="vsv-row">
        <button type="button" className="vsv-btn" onClick={suggest}>Suggest pods</button>
        <button type="button" className="vsv-btn vsv-btn-main" disabled={busy === "pods"} onClick={() => run("pods", () => storyApi(config, { action: "pods", section: sec, pods: people.filter(p => pods[p.email] > 0).map(p => ({ email: p.email, pod: pods[p.email] })) }))}>Save pods</button>
      </div>
      <div className="vsv-pods">
        {Array.from({ length: podCount + 1 }, (_, i) => i + 1).map(n => {
          const members = people.filter(p => pods[p.email] === n);
          if (!members.length && n > podCount) return null;
          return (
            <div key={n} className="vsv-pod">
              <b>Pod {n}</b>
              {members.map(p => <PodMember key={p.email} p={p} pod={n} max={podCount + 1} onMove={(to) => setPods(x => ({ ...x, [p.email]: to }))} />)}
              {!members.length ? <span className="vsv-muted">Empty</span> : null}
            </div>
          );
        })}
        <div className="vsv-pod">
          <b>No pod</b>
          {people.filter(p => !(pods[p.email] > 0)).map(p => <PodMember key={p.email} p={p} pod={0} max={podCount + 1} onMove={(to) => setPods(x => ({ ...x, [p.email]: to }))} />)}
        </div>
      </div>

      <h3 className="vsv-h3">Stories each student commented on</h3>
      <ul className="vsv-counts">
        {people.map(p => <li key={p.email}><span>{p.name}</span><b>{data.counts[p.email] || 0}</b></li>)}
      </ul>

      <details className="vsv-details">
        <summary>Every comment, with names ({data.comments.filter(c => stories.some(s => s.id === c.story)).length})</summary>
        {stories.map(s => {
          const list = data.comments.filter(c => c.story === s.id);
          if (!list.length) return null;
          return (
            <div key={s.id} className="vsv-cgroup">
              <b>{s.name}: {s.headline || "Untitled"}</b>
              {list.map((c, i) => <p key={i} className="vsv-msg"><i>{c.author}</i> Best image{c.bestPicture ? ", picture " + c.bestPicture : c.bestWhere ? ", " + c.bestWhere : ""}: {c.best} Shone: {c.shone} Encourage: {c.encourage}</p>)}
            </div>
          );
        })}
      </details>

      {config.id === "comm999" ? (
        <div className="vsv-row">
          <button type="button" className="vsv-btn" disabled={!!busy && !busy.startsWith("Not")} onClick={() => run("fill", () => storyApi(config, { action: "practice-fill" }))}>Fill with practice stories</button>
          <button type="button" className="vsv-btn" disabled={!!busy && !busy.startsWith("Not")} onClick={() => run("clear", () => storyApi(config, { action: "practice-clear" }))}>Clear practice stories</button>
          <span className="vsv-muted">The practice class only. Copies your own story to every practice student, submitted.</span>
        </div>
      ) : null}
    </section>
  );
}

function PodMember({ p, pod, max, onMove }) {
  return (
    <label className="vsv-member">
      <span>{p.name}</span>
      <select value={pod} onChange={e => onMove(Number(e.target.value))} aria-label={"Pod for " + p.name}>
        <option value={0}>No pod</option>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => <option key={n} value={n}>Pod {n}</option>)}
      </select>
    </label>
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
  if (!fresh.length) return <StageBanner config={config} />;
  const open = () => { try { localStorage.setItem(SEEN + ":" + config.id, String(Date.now())); } catch { /* none */ } };
  return (
    <div className="vsv-banner" role="status">
      <style>{BANNER_CSS}</style>
      <b>{fresh.length === 1 ? "A student reported a problem" : fresh.length + " students reported problems"} on the visual story.</b>
      <a className="vsv-banner-link" href={"/" + config.id + "/worksheets/" + VISUAL_STORY_KEY + "?review"} onClick={open}>Read the reports</a>
    </div>
  );
}
// The day each stage is due, so the dashboard can say which button to press.
// Andrew, planning 2026-10-13: "is there a way for you to prompt me to push a
// button?" and then "A banner on your dashboard with the button on the right day".
const STAGE_DAYS = {
  comm3: [
    ["2026-10-21T00:00:00-07:00", "2026-10-26T00:00:00-07:00", "pods", "Pods are due today. Suggest and save the pods on the stories page."],
    ["2026-10-26T00:00:00-07:00", "2026-10-27T00:00:00-07:00", "building", "The stories open for reading today. Press Open the stories for reading on the stories page."],
    ["2026-10-27T00:00:00-07:00", "2026-10-28T00:00:00-07:00", "reading", "Comments were due last night. Press Close comments on the stories page."],
    ["2026-10-28T00:00:00-07:00", "2026-10-30T00:00:00-07:00", "closed", "Names come out in class today. Press Release the names on the stories page."],
  ],
};
function StageBanner({ config }) {
  const [say, setSay] = useState("");
  useEffect(() => {
    const now = Date.now();
    const today = (STAGE_DAYS[config.id] || []).filter(([from, to]) => now >= Date.parse(from) && now < Date.parse(to));
    if (!today.length) return;
    let alive = true;
    // The stage as the route sees it: a section past its open time is reading, button or no button.
    gameClient.from("story_stage").select("section,stage,opens_at").eq("worksheet_key", VISUAL_STORY_KEY).eq("group_key", config.id).then(r => {
      if (!alive) return;
      const stages = (r.data || []).map(x => stageAt(x));
      const at = stages.length ? stages : ["building"];
      const hit = today.find(([, , when]) => when === "pods" ? at.every(s => s === "building") : at.includes(when));
      if (hit) setSay(hit[3]);
    });
    return () => { alive = false; };
  }, [config.id]);
  if (!say) return null;
  return (
    <div className="vsv-banner vsv-banner-stage" role="status">
      <style>{BANNER_CSS}</style>
      <b>Visual story: {say}</b>
      <a className="vsv-banner-link" href={"/" + config.id + "/worksheets/" + VISUAL_STORY_KEY + "?review"}>Open the stories page</a>
    </div>
  );
}

const BANNER_CSS = `
.vsv-banner{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:10px 16px 0;padding:10px 16px;border-radius:12px;background:${TOKENS.SURFACE.sunk};box-shadow:inset 4px 0 0 ${TOKENS.STATE.late};font-size:15px;color:${TOKENS.TEXT.primary}}
.vsv-banner-link{font-weight:700;color:${TOKENS.TEXT.primary}}
.vsv-banner-stage{box-shadow:inset 4px 0 0 ${TOKENS.STATE.warn}}
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
.vsv-time{font:inherit;font-size:14px;padding:5px 8px;border-radius:8px;border:1px solid ${L.strong};background:${S.card};color:${T.primary}}
.vsv-btn:disabled{opacity:.5;cursor:default}
.vsv-btn-main{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vsv-reading{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:14px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.vsv-h3{margin:8px 0 0;font-size:17px;font-weight:700}
.vsv-pods{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.vsv-pod{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:10px;background:${S.sunk}}
.vsv-member{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:14.5px}
.vsv-counts{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px 18px}
.vsv-counts li{display:flex;justify-content:space-between;font-size:14.5px;border-bottom:1px dotted ${L.soft};padding:3px 0}
.vsv-cgroup{display:flex;flex-direction:column;gap:4px;margin-top:10px}
`;
