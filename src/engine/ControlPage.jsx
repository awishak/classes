// A challenge's control page, for the instructor: /<class>/control/<id>.
//
// Andrew, 2026-11-05: the Worksheets page was "too messy ... it should
// instead have cards for each assignment, and then at each assignment, give
// me organized links and a cleaner skylight style dashboard." Then, off the
// mockups: "I like the ledger. but i also like roster map ... what i want you
// to do better is inform me what is ungraded and what has been resubmitted by
// students ... would want to be able to toggle."
//
// So: the challenge's facts in one line, the open switch where the challenge
// is a worksheet, the pages it has, one thin bar of the class split by state,
// then Ledger or Map. Ledger is every student a row: section, when it came
// in, how much is filled, the grade or what is owed, Open sheet. Map is every
// name tinted by state with the hand-in time under it. Then what students
// wrote on the challenge, newest first, and the addresses at the bottom.
//
// The states, worst first, so the exceptions are what the eye lands on:
//   resubmitted   turned in again after the grade went on, or after the sheet
//                 was reviewed; the grade may be stale
//   ungraded      turned in, nothing graded since
//   late          turned in after the deadline (and graded)
//   graded        graded, nothing since
//   started       opened the sheet, not handed in
//   missed        nothing in and the deadline has gone
//   open          nothing in yet, still time
// Nothing here is written except the open switch, which is the plan row's
// worksheetsOpen, the same key the old Worksheets page wrote.

import { useEffect, useMemo, useState } from "react";
import { useClassData } from "./store.js";
import { usePhotos, useWithPhotos } from "./photos.js";
import { useWithWorksheetSubmits } from "./worksheetSubmits.js";
import { assignmentsOf } from "./profileTask.js";
import { statusOf } from "./AssignmentCards.jsx";
import { rosterOf, nameShown, idOf } from "./roster.js";
import { realStudents, isHouse, sectionOf, sectionsOf } from "./sections.js";
import { alive, htmlToText } from "./grades.js";
import { deadlineOf } from "./DueCard.jsx";
import { StudentLink } from "./StudentPage.jsx";
import { INSTRUCTOR_EMAILS } from "../instructors.js";
import { useSession, authHeaders } from "./session.js";
import { savedPin } from "../InstructorGate.jsx";
import { LOCAL_WORKSHEETS, openTo } from "./localWorksheets.js";
import { progressOf, percentOf } from "./worksheetProgress.js";
import { sheetOfAssignment, assignmentTools, sheetsFor, sheetLinks } from "./portal/Tools.jsx";
import { opensState, opensWords } from "./portal/work.js";
import { Chip, Io, Face, dueWords, whenWords } from "./portal/bits.jsx";
import { PORTAL_CSS } from "./portal/style.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_TEACH } from "./TopNav.jsx";
import * as TOKENS from "./tokens.js";

const lower = (s) => String(s || "").trim().toLowerCase();
const emailOf = (s) => lower(s?.email);

export { controlHref } from "./portal/Tools.jsx";
export const SHEET_ID = /^sheet-([a-z0-9-]+)$/;

// The states in the order the ledger sorts them and the key reads them.
export const STATES = [
  { id: "resubmitted", say: "Resubmitted", tint: "late" },
  { id: "ungraded", say: "Ungraded", tint: "due" },
  { id: "late", say: "Late", tint: "late" },
  { id: "graded", say: "Graded", tint: "done" },
  { id: "started", say: "Started", tint: "me" },
  { id: "missed", say: "Missed", tint: "late" },
  { id: "open", say: "Not in", tint: "" },
];
const stateOf = (id) => STATES.find(s => s.id === id) || STATES[STATES.length - 1];

/** Every sheet row for a worksheet, with answers and review, through the server. */
function useAllSheets(config, key) {
  const [sheets, setSheets] = useState(null);
  useEffect(() => {
    if (!key) { setSheets(null); return undefined; }
    let alive = true;
    const ask = async () => {
      try {
        const r = await fetch("/api/worksheet-submits", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, key, all: true }),
        });
        const out = r.ok ? await r.json() : null;
        if (alive) setSheets(out?.ok ? out.sheets || [] : []);
      } catch { if (alive) setSheets([]); }
    };
    ask();
    const t = setInterval(ask, 30000);
    window.addEventListener("focus", ask);
    return () => { alive = false; clearInterval(t); window.removeEventListener("focus", ask); };
  }, [config.id, key]);
  return sheets;
}

/**
 * One student's row. log is the student's entries on the challenge with the
 * worksheet submit laid over; sheet is their worksheet row, if the challenge
 * is a sheet. Pure, so the smoke can read it.
 */
export function rowOf({ config, data, asg, student, sheet, progress, now = Date.now() }) {
  const name = student.name;
  const st = asg ? statusOf(config, data, asg, name, new Set(), now) : { state: "open", letter: null, grade: null, last: null };
  const log = asg ? alive(data?.assignmentLog?.[asg.id]?.[name]) : [];
  const grade = st.grade;
  const subs = log.filter(e => e.type === "submission");
  const lastSub = subs[subs.length - 1] || null;
  const sheetAt = sheet?.submitted_at ? Date.parse(sheet.submitted_at) : 0;
  const handedAt = Math.max(lastSub?.ts || 0, sheetAt) || 0;
  const deadline = asg ? deadlineOf(asg.due, asg.dueTime) : null;
  const pct = sheet ? percentOf(progress?.[lower(sheet.viewer_id)]) : null;
  const reviewedAt = sheet?.review?.reviewed_at ? Date.parse(sheet.review.reviewed_at) : 0;
  const resubmitted = !!handedAt && ((grade && handedAt > grade.ts) || (reviewedAt && sheetAt > reviewedAt));
  let state;
  if (resubmitted) state = "resubmitted";
  else if (st.letter) state = deadline && handedAt && handedAt > deadline ? "late" : "graded";
  else if (handedAt) state = "ungraded";
  else if (sheet && pct > 0) state = "started";
  else if (deadline && deadline < now) state = "missed";
  else state = "open";
  const late = !!(deadline && handedAt && handedAt > deadline);
  const comments = log.filter(e => e.type === "comment" && e.from === "student").length + log.filter(e => e.type === "regrade").length;
  return { student, name, section: sectionOf(student), state, late, handedAt, pct, letter: st.letter, grade, link: lastSub?.link || "", comments };
}

/** What students wrote on the challenge, newest first: comments and regrade asks. */
export function saidOf(data, asg, roster) {
  if (!asg) return [];
  const out = [];
  roster.forEach(s => {
    alive(data?.assignmentLog?.[asg.id]?.[s.name]).forEach(e => {
      if (e.type === "comment" && e.from === "student") out.push({ id: e.id, at: e.ts, name: s.name, student: s, kind: "wrote", text: htmlToText(e.html || e.text) });
      else if (e.type === "regrade") out.push({ id: e.id, at: e.ts, name: s.name, student: s, kind: "asked for a regrade", text: e.text || "" });
    });
  });
  return out.sort((x, y) => (y.at || 0) - (x.at || 0));
}

export default function ControlPage({ config, id }) {
  const [stored, update] = useClassData(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const data = useWithWorksheetSubmits(useWithPhotos(stored, photos), config);
  const { session, instructor } = useSession();
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const [view, setView] = useState(() => { try { return localStorage.getItem("control-view") || "ledger"; } catch { return "ledger"; } });
  const pickView = (v) => { setView(v); try { localStorage.setItem("control-view", v); } catch { /* fine */ } };
  const sections = sectionsOf(config);
  const [section, setSection] = useState("");

  const assignments = assignmentsOf(config, data || {});
  const sheetKeyAsked = (String(id).match(SHEET_ID) || [])[1] || "";
  // sheet-<key> lands on the challenge that carries the sheet, once the class has loaded.
  const asg = sheetKeyAsked ? assignments.find(a => sheetOfAssignment(config, a)?.key === sheetKeyAsked) || null : assignments.find(a => a.id === id) || null;
  const sheet = asg ? sheetOfAssignment(config, asg) : sheetsFor(config).find(w => w.key === sheetKeyAsked) || null;
  const local = sheet ? LOCAL_WORKSHEETS.find(w => w.key === sheet.key) || null : null;
  const title = asg ? asg.title : sheet ? sheet.title : "";
  const sheets = useAllSheets(config, sheet?.key || "");

  useEffect(() => { document.title = config.code + " · " + (title || "Control"); setClassFavicon(config); }, [config, title]);

  const people = useMemo(() => realStudents(config, rosterOf(config, data || {})).filter(s => !isHouse(s.name) && !INSTRUCTOR_EMAILS.includes(emailOf(s))), [config, data]);
  const bySheet = useMemo(() => new Map((sheets || []).map(s => [lower(s.viewer_id), s])), [sheets]);
  const progress = useMemo(() => (sheet && sheets ? progressOf(sheet.key, sheets) : null), [sheet, sheets]);
  const rows = useMemo(() => people.map(s => rowOf({ config, data: data || {}, asg, student: s, sheet: bySheet.get(emailOf(s)) || null, progress })), [people, config, data, asg, bySheet, progress]);
  const shown = rows.filter(r => !section || r.section === section);
  const said = useMemo(() => saidOf(data || {}, asg, people), [data, asg, people]);

  const root = { minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: TOKENS.FONT.body, "--ca-accent": config.accent, "--ca-accent-ink": config.accent };
  const bar = <div style={{ position: "sticky", top: 0, zIndex: 30 }}><TopNav config={config} tabs={NAV_TEACH} active="" /></div>;
  if (!session || !instructor) {
    return <div data-theme={theme} data-mode={mode} className="ca-root pt-root" style={root}><ThemeStyle theme={theme} /><style>{PORTAL_CSS + CSS}</style>{bar}
      <div style={{ padding: 32 }}><a href="/login" style={{ fontSize: 17, fontWeight: 600, color: config.accent }}>Sign in</a></div></div>;
  }
  if (stored === null) return <div data-theme={theme} data-mode={mode} className="ca-root pt-root" style={root}><ThemeStyle theme={theme} /><style>{PORTAL_CSS + CSS}</style>{bar}<div className="cp"><p className="pt-quiet">Loading.</p></div></div>;
  if (!asg && !sheet) return <div data-theme={theme} data-mode={mode} className="ca-root pt-root" style={root}><ThemeStyle theme={theme} /><style>{PORTAL_CSS + CSS}</style>{bar}<div className="cp"><p className="pt-quiet">No challenge here.</p></div></div>;

  // The facts, as data.
  const ongoing = asg && (!asg.due || asg.due === "Ongoing");
  const open = asg ? opensState(asg) : "open";
  const due = !asg ? "" : ongoing ? "Ongoing" : open !== "open" ? opensWords(asg) : "Due " + dueWords(asg.due, asg.dueTime);
  const isOpen = local ? openTo(local, config.id, data) : null;
  const setOpen = (on) => update(prev => ({ ...prev, worksheetsOpen: { ...(prev.worksheetsOpen || {}), [sheet.key]: on } }));
  // The pages: the sheet's buttons, Grade for the challenge, Edit.
  const links = (asg ? assignmentTools(config, asg) : sheet ? sheetLinks(config, sheet) : []).filter(l => !l.main);
  if (asg) links.unshift({ say: "Grade", href: "/grades/" + config.id + "/flow?a=" + encodeURIComponent(asg.id) });

  const count = (st) => shown.filter(r => r.state === st).length;
  const inAll = shown.filter(r => r.handedAt).length;
  const seg = STATES.map(s => ({ ...s, n: count(s.id) })).filter(s => s.n);
  const order = Object.fromEntries(STATES.map((s, i) => [s.id, i]));
  const ledger = shown.slice().sort((x, y) => (order[x.state] - order[y.state]) || x.name.localeCompare(y.name));
  const studentUrl = sheet ? config.path + "/worksheets/" + sheet.key : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const reviewUrl = local && local.review ? origin + studentUrl + "?review" : "";
  const addresses = [studentUrl ? ["Students open this at", origin + studentUrl] : null, reviewUrl ? ["Review every sheet", reviewUrl] : null].filter(Boolean);

  const gradeCell = (r) => r.state === "resubmitted" ? <span className="cp-flag late">Resubmitted{r.letter ? " · was " + r.letter : ""}</span>
    : r.state === "ungraded" ? <span className="cp-flag due">Ungraded</span>
    : r.letter ? <span>{r.letter}</span> : "";
  const whenCell = (r) => r.handedAt ? <span className={r.late ? "cp-late" : ""}>{whenWords(r.handedAt)}{r.late ? " · late" : ""}</span>
    : r.state === "started" ? "Not submitted" : r.state === "missed" ? "Nothing in" : sheet ? "Not opened" : "";
  const openLink = (r) => sheet && (r.handedAt || r.pct > 0) ? <a className="cp-a" href={studentUrl + "?s=" + encodeURIComponent(idOf(r.student))}>Open sheet</a>
    : r.link ? <a className="cp-a" href={r.link} target="_blank" rel="noreferrer">Open</a> : null;

  return (
    <div data-theme={theme} data-mode={mode} className="ca-root pt-root" style={root}>
      <ThemeStyle theme={theme} /><style>{PORTAL_CSS + CSS}</style>
      {bar}
      <div className="cp">
        <div className="cp-head">
          <div>
            <h1 className="cp-h1">{title}{asg ? <a className="cp-pencil" href={config.path + "/assignments/" + encodeURIComponent(asg.id)} aria-label="Edit">{PENCIL}</a> : null}</h1>
            <div className="cp-facts">
              {due ? <span>{due}</span> : null}
              {asg?.weight ? <span><b>{asg.weight}%</b></span> : null}
              {sheet ? <span>Worksheet</span> : null}
              <span><b>{inAll}</b> of {shown.length} in</span>
              {count("ungraded") ? <span className="due"><b>{count("ungraded")}</b> ungraded</span> : null}
              {count("resubmitted") ? <span className="late"><b>{count("resubmitted")}</b> resubmitted</span> : null}
            </div>
          </div>
          <div className="cp-ctl">
            {local ? <button type="button" role="switch" aria-checked={!!isOpen} className={"cp-switch" + (isOpen ? " on" : "")} onClick={() => setOpen(!isOpen)}>
              <span>{isOpen ? "Open to " + config.code + " students" : "Closed to students"}</span><i /></button> : null}
            {sections.length > 1 ? (
              <div className="pt-seg" role="tablist" aria-label="Section">
                <button type="button" role="tab" aria-selected={!section} className={!section ? "on" : ""} onClick={() => setSection("")}>Both</button>
                {sections.map(s => <button key={s} type="button" role="tab" aria-selected={section === s} className={section === s ? "on" : ""} onClick={() => setSection(s)}>{s}</button>)}
              </div>
            ) : null}
          </div>
        </div>

        {links.length ? <div className="pt-chips cp-wrap">{links.map(l => <Chip key={l.href} href={l.href}>{l.say}</Chip>)}</div> : null}

        {shown.length ? (
          <div className="cp-bar">
            <div className="cp-seg">{seg.map(s => <i key={s.id} className={"cp-s-" + s.id} style={{ width: (s.n / shown.length * 100) + "%" }} title={s.say + " " + s.n} />)}</div>
            <div className="cp-key">{seg.map(s => <span key={s.id}><i className={"cp-s-" + s.id} />{s.say} {s.n}</span>)}</div>
          </div>
        ) : null}

        <div className="cp-viewbar">
          <div className="pt-seg" role="tablist" aria-label="View">
            <button type="button" role="tab" aria-selected={view === "ledger"} className={view === "ledger" ? "on" : ""} onClick={() => pickView("ledger")}>Ledger</button>
            <button type="button" role="tab" aria-selected={view === "map"} className={view === "map" ? "on" : ""} onClick={() => pickView("map")}>Map</button>
          </div>
          {sheet && sheets === null ? <span className="pt-quiet">Reading every sheet.</span> : null}
        </div>

        {view === "ledger" ? (
          <table className="cp-t">
            <thead><tr><th>Student</th>{sections.length > 1 ? <th>Section</th> : null}<th>Handed in</th>{sheet ? <th className="r">Filled</th> : null}<th>Grade</th><th></th></tr></thead>
            <tbody>
              {ledger.map(r => (
                <tr key={r.name} className={"cp-r-" + r.state}>
                  <td className="n"><StudentLink config={config} student={r.student}>{nameShown(data, r.name)}</StudentLink>{r.comments ? <span className="cp-dot" title={r.comments + " written"}>{r.comments}</span> : null}</td>
                  {sections.length > 1 ? <td className="m">{r.section}</td> : null}
                  <td className="m">{whenCell(r)}</td>
                  {sheet ? <td className="r">{r.pct != null && (r.handedAt || r.pct > 0) ? r.pct + "%" : ""}</td> : null}
                  <td>{gradeCell(r)}</td>
                  <td className="r">{openLink(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="cp-map">
            {shown.slice().sort((x, y) => x.name.localeCompare(y.name)).map(r => {
              const href = sheet && (r.handedAt || r.pct > 0) ? studentUrl + "?s=" + encodeURIComponent(idOf(r.student)) : r.link || "";
              const sub = r.state === "resubmitted" ? "Resubmitted" : r.state === "ungraded" ? "Ungraded" : r.handedAt ? whenWords(r.handedAt) + (r.late ? " · late" : "") : r.state === "started" ? r.pct + "% filled" : r.state === "missed" ? "Nothing in" : "";
              const inner = <><Face config={config} data={data} name={r.name} size={28} /><span className="cp-nm"><b>{nameShown(data, r.name)}</b>{r.letter && r.state !== "resubmitted" ? <span className="cp-g">{r.letter}</span> : null}<small>{sub}</small></span></>;
              return href ? <a key={r.name} className={"cp-cell cp-r-" + r.state} href={href}>{inner}</a> : <div key={r.name} className={"cp-cell cp-r-" + r.state}>{inner}</div>;
            })}
          </div>
        )}

        {said.length ? (
          <div className="cp-sec">
            <p className="cp-label">On this challenge</p>
            <div className="pt-stack">
              {said.map(e => (
                <div key={e.id} className="pt-row">
                  <Face config={config} data={data} name={e.name} size={36} />
                  <div className="pt-main">
                    <p className="pt-title"><StudentLink config={config} student={e.student}>{nameShown(data, e.name)}</StudentLink> <span className="cp-m">{e.kind}</span></p>
                    {e.text ? <p className="pt-text">{e.text}</p> : null}
                    <p className="pt-meta">{whenWords(e.at)}</p>
                  </div>
                  <div className="pt-side"><Io kind="go" href={config.path + "/grade?a=" + encodeURIComponent(asg.id)}>Reply</Io></div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {addresses.length ? (
          <div className="cp-sec">
            <p className="cp-label">Addresses</p>
            <div className="pt-stack">{addresses.map(([say, url]) => <AddressBox key={url} say={say} url={url} />)}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AddressBox({ say, url }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* the box is selectable */ } };
  return (
    <div className="cp-addr">
      <span className="cp-addr-t">{say}</span>
      <div className="cp-addr-in"><input readOnly value={url} aria-label={say} onFocus={e => e.target.select()} /><Io onClick={copy}>{copied ? "Copied" : "Copy"}</Io></div>
    </div>
  );
}

const PENCIL = <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;

const CSS = `
.cp{max-width:1100px;margin:0 auto;padding:24px 16px 64px;display:flex;flex-direction:column;gap:18px}
.cp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.cp-h1{font-family:var(--pt-serif);font-size:30px;font-weight:600;margin:0;line-height:1.15;display:flex;align-items:center;gap:10px}
.cp-pencil{display:inline-flex;width:28px;height:28px;border-radius:999px;align-items:center;justify-content:center;color:var(--text-muted)}
.cp-pencil:hover{background:var(--surface-sunk);color:var(--text-primary)}
.cp-facts{display:flex;gap:16px;flex-wrap:wrap;font-size:15px;color:var(--text-secondary);margin-top:4px}
.cp-facts b{color:var(--text-primary);font-weight:600}
.cp-facts .due,.cp-facts .due b{color:var(--pt-due-ink)}.cp-facts .late,.cp-facts .late b{color:var(--pt-late-ink)}
.cp-ctl{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.cp-switch{display:inline-flex;align-items:center;gap:10px;font:inherit;font-size:15px;font-weight:600;color:var(--text-primary);background:none;border:0;padding:0;cursor:pointer}
.cp-switch i{width:46px;height:26px;border-radius:999px;background:var(--line-strong);position:relative;flex:none;transition:background .15s}
.cp-switch i::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:999px;background:#fff;transition:left .15s}
.cp-switch.on i{background:var(--ca-accent)}.cp-switch.on i::after{left:23px}
.cp-wrap{flex-wrap:wrap;overflow:visible}
.cp-bar{display:grid;gap:8px}
.cp-seg{display:flex;height:10px;border-radius:999px;overflow:hidden;gap:2px}
.cp-seg i{display:block;height:100%}
.cp-key{display:flex;gap:14px;flex-wrap:wrap;font-size:14px;color:var(--text-secondary)}
.cp-key span{display:inline-flex;align-items:center;gap:6px}.cp-key i{width:10px;height:10px;border-radius:2px;display:inline-block}
.cp-s-graded{background:var(--ca-accent)}.cp-s-late{background:#b45309}.cp-s-ungraded{background:#d97706}.cp-s-resubmitted{background:#dc2626}.cp-s-started{background:#a8a29e}.cp-s-missed{background:#f1a5a5}.cp-s-open{background:var(--line-strong)}
.cp-viewbar{display:flex;align-items:center;gap:14px}
.cp-t{width:100%;border-collapse:collapse;font-size:15px}
.cp-t th{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);font-weight:600;text-align:left;padding:8px 10px;border-bottom:1px solid var(--line-strong)}
.cp-t td{padding:8px 10px;border-bottom:1px solid var(--line-soft);vertical-align:middle}
.cp-t td.n{font-weight:600}.cp-t td.m{color:var(--text-secondary)}.cp-t .r{text-align:right;font-variant-numeric:tabular-nums}
.cp-t tr.cp-r-missed td,.cp-t tr.cp-r-open td{color:var(--text-muted)}
.cp-t tr.cp-r-resubmitted td.n{color:var(--pt-late-ink)}
.cp-late{color:var(--pt-late-ink)}
.cp-flag{display:inline-block;font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px}
.cp-flag.due{background:var(--pt-due);color:var(--pt-due-ink)}.cp-flag.late{background:var(--pt-late);color:var(--pt-late-ink)}
.cp-a{color:var(--ca-accent);font-weight:600;text-decoration:none;white-space:nowrap}
.cp-dot{display:inline-block;margin-left:8px;font-size:11px;font-weight:700;min-width:18px;height:18px;line-height:18px;text-align:center;border-radius:999px;background:var(--surface-sunk);color:var(--text-secondary)}
.cp-map{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px}
.cp-cell{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:var(--surface-card);box-shadow:0 0 0 1px var(--line-soft);color:inherit;text-decoration:none;min-width:0}
.cp-cell.cp-r-graded,.cp-cell.cp-r-late{background:var(--pt-done)}.cp-cell.cp-r-ungraded{background:var(--pt-due)}.cp-cell.cp-r-resubmitted{background:var(--pt-late);box-shadow:inset 0 0 0 2px var(--pt-late-ink)}.cp-cell.cp-r-started{background:var(--pt-me)}.cp-cell.cp-r-missed{background:var(--pt-late);opacity:.75}.cp-cell.cp-r-open{color:var(--text-muted)}
.cp-nm{display:flex;flex-direction:column;min-width:0;font-size:14px;line-height:1.2}
.cp-nm b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-nm small{font-size:12px;color:var(--text-secondary)}
.cp-g{font-size:12px;font-weight:600}
.cp-sec{display:flex;flex-direction:column;gap:8px}
.cp-label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);font-weight:600;margin:0;padding:0 4px}
.cp-m{color:var(--text-secondary);font-weight:400}
.cp-addr{display:grid;gap:8px;padding:12px 14px;border-radius:16px;background:var(--surface-card);box-shadow:0 0 0 1px var(--line-soft)}
.cp-addr-t{font-size:15px;font-weight:600}
.cp-addr-in{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}
.cp-addr-in input{min-width:0;font-family:ui-monospace,Menlo,monospace;font-size:13px;min-height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--line-strong);background:var(--surface-sunk);color:var(--text-primary)}
`;
