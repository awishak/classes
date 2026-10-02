// Everyone's Worktopia file, by question: /<class>/worksheets/worktopia/answers.
//
// Andrew, 2026-10-02: "make me a page where i will see everyone's answers to
// worktopia." The worksheets tab shows who submitted and opens one file at a
// time; this page turns the class sideways, so one question's answers sit
// together. The positions first, as a table with the three titles on each
// row and the five follow-ups under the row. Then the three questions about
// the industry, every answer in full. Then the tallies: co-workers named,
// meeting dates, the Thursday, the stars. The reviews last. Under the class,
// the same for whoever ran the public /worktopia page.
//
// One address, two views. The server (api/worktopia-answers.js) sends names
// to the instructor and no names to a student on the roster, in an order
// that is not the roster's, so the class can read the same page.

import { useEffect, useMemo, useState } from "react";
import { useClassState } from "./store.js";
import { rosterOf } from "./roster.js";
import { useSession, studentFor, authHeaders } from "./session.js";
import { savedPin } from "../InstructorGate.jsx";
import { INSTRUCTOR_EMAILS } from "../instructors.js";
import { QUESTIONS, MEETINGS, WORKTOPIA_TITLE } from "./worktopia/terminal.js";
import * as TOKENS from "./tokens.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_STUDENT } from "./TopNav.jsx";

const LETTERS = ["a", "b", "c"];
const FOLLOW = ["skills", "human", "why", "duties", "value"];
const emailOf = (s) => String(s?.email || "").trim().toLowerCase();
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
const fmtWhen = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Counts of each value, biggest first. `split` breaks one answer into several
// (the co-workers, named with commas).
function tally(files, field, map = (v) => v, split = null) {
  const counts = {};
  files.forEach(f => {
    const raw = f.answers[field];
    if (raw == null || raw === "") return;
    const parts = split ? split(raw) : [raw];
    parts.forEach(p => { const k = map(p); if (k) counts[k] = (counts[k] || 0) + 1; });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

const meetingLabel = (k) => (MEETINGS.find(m => m.key === k) || {}).label || k;
const thursdayLabel = (k) => (k === "YES" ? "available" : k === "NO" ? "not available" : k);
const starCount = (v) => (v || "").split("★").length - 1;
const coworkerSplit = (v) => String(v).split(",").map(s => s.trim()).filter(s => s && s.toLowerCase() !== "none");
// How many of Worktopia's assignments a person took before declining one.
const taken = (answers) => Object.keys(answers).filter(k => k.startsWith("accept:") && answers[k] === "YES").length;

function Tally({ rows, suffix }) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  if (!rows.length) return <p className="none">No answers yet.</p>;
  return (
    <ol className="tally">
      {rows.map(([k, n]) => (
        <li key={k}>
          <span className="num">{n}</span>
          <span className="bar"><i style={{ width: Math.round(n / max * 100) + "%" }} /></span>
          <span className="lab">{k}{suffix ? " " + suffix : ""}</span>
        </li>
      ))}
    </ol>
  );
}

function Quotes({ field, files, who }) {
  const list = files.filter(f => f.answers[field]);
  return (
    <section className="sec" id={"q-" + field}>
      <header className="sh"><h3>{QUESTIONS[field]}</h3><span className="meta">{plural(list.length, "answer")}</span></header>
      {list.length ? list.map((f, i) => (
        <figure key={i} className="quote">
          <blockquote>{f.answers[field]}</blockquote>
          {who(f) ? <figcaption>{who(f)}</figcaption> : null}
        </figure>
      )) : <p className="none">No answers yet.</p>}
    </section>
  );
}

// The three positions on every file, one row each, with the follow-ups under
// the row when the row is opened.
function Positions({ files, who, named }) {
  const [open, setOpen] = useState(() => new Set());
  const rows = files.filter(f => LETTERS.some(l => f.answers["title:" + l]));
  const all = open.size === rows.length && rows.length > 0;
  const toggle = (i) => setOpen(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  const toggleAll = () => setOpen(all ? new Set() : new Set(rows.map((_, i) => i)));
  return (
    <section className="sec" id="positions">
      <header className="sh">
        <h3>The three positions</h3>
        <span className="meta">{plural(rows.length, "file")}</span>
        {rows.length ? <button type="button" className="lnk" onClick={toggleAll}>{all ? "Close every row" : "Open every row"}</button> : null}
      </header>
      {rows.length ? (
        <div className="scroll">
          <table>
            <thead><tr>{named ? <th>Who</th> : null}<th>A</th><th>B</th><th>C</th><th className="when">Submitted</th></tr></thead>
            <tbody>
              {rows.map((f, i) => (
                <PositionRow key={i} f={f} who={who(f)} named={named} open={open.has(i)} onToggle={() => toggle(i)} />
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="none">No positions yet.</p>}
    </section>
  );
}

function PositionRow({ f, who, named, open, onToggle }) {
  const cols = (named ? 1 : 0) + 4;
  return (<>
    <tr className={"row" + (open ? " open" : "")} onClick={onToggle} aria-expanded={open}>
      {named ? <td className="who">{who}</td> : null}
      {LETTERS.map(l => <td key={l}>{f.answers["title:" + l] || <span className="dim">unnamed</span>}</td>)}
      <td className="when">{f.submitted_at ? fmtWhen(f.submitted_at) : <span className="dim">in progress</span>}</td>
    </tr>
    {open ? (
      <tr className="more"><td colSpan={cols}>
        <div className="three">
          {LETTERS.map(l => (
            <div key={l} className="pos">
              <h4>{"Position " + l.toUpperCase() + ": " + (f.answers["title:" + l] || "unnamed")}</h4>
              {FOLLOW.map(q => f.answers[q + ":" + l] ? (
                <div key={q} className="qa"><div className="q">{QUESTIONS[q]}</div><div className="a">{f.answers[q + ":" + l]}</div></div>
              ) : null)}
            </div>
          ))}
        </div>
      </td></tr>
    ) : null}
  </>);
}

// One group of files: the class, or the visitors. Exported for the smoke
// run, which hands in files of its own.
export function Group({ title, files, who, named, roster }) {
  const submitted = files.filter(f => f.submitted_at).length;
  const facts = named
    ? [plural(submitted, "file") + " submitted", files.length - submitted ? (files.length - submitted) + " in progress" : ""].filter(Boolean).join(" · ")
    : plural(files.length, "file");
  const coworkers = tally(files, "coworkers", (v) => v, coworkerSplit);
  const stars = tally(files, "stars", (v) => starCount(v)).sort((a, b) => b[0] - a[0]).map(([k, n]) => [k + (k === 1 ? " star" : " stars"), n]);
  // How many of Worktopia's assignments each person took before declining.
  const offered = files.filter(f => Object.keys(f.answers).some(k => k.startsWith("accept:")));
  const offers = Object.entries(offered.reduce((acc, f) => { const n = taken(f.answers); acc[n] = (acc[n] || 0) + 1; return acc; }, {}))
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, n]) => [k === "0" ? "Declined the first offer" : "Took " + k + " before declining", n]);
  const reviews = files.filter(f => f.answers.review);
  return (
    <div className="grp">
      <header className="gh"><h2>{title}</h2><span className="meta">{facts}</span></header>
      {!files.length ? <p className="none">Nobody has started.</p> : (<>
        <Positions files={files} who={who} named={named} />
        <section className="sec"><header className="sh"><h3>Worktopia's own offers</h3><span className="meta">{plural(offered.length, "file")}</span></header><Tally rows={offers} /></section>
        <Quotes field="industry" files={files} who={who} />
        <Quotes field="fading" files={files} who={who} />
        <Quotes field="rising" files={files} who={who} />
        {roster ? (<>
          <section className="sec"><header className="sh"><h3>{QUESTIONS.coworkers}</h3><span className="meta">{plural(coworkers.length, "name")}</span></header><Tally rows={coworkers} /></section>
          <section className="sec"><header className="sh"><h3>{QUESTIONS.meeting}</h3></header><Tally rows={tally(files, "meeting", meetingLabel)} /></section>
          <section className="sec"><header className="sh"><h3>{QUESTIONS.thursday}</h3></header><Tally rows={tally(files, "thursday", thursdayLabel)} /></section>
        </>) : null}
        <section className="sec"><header className="sh"><h3>{QUESTIONS.stars}</h3></header><Tally rows={stars} /></section>
        <section className="sec" id="reviews">
          <header className="sh"><h3>{QUESTIONS.review}</h3><span className="meta">{plural(reviews.length, "review")}</span></header>
          {reviews.length ? reviews.map((f, i) => (
            <figure key={i} className="quote">
              <blockquote>{f.answers.review}</blockquote>
              <figcaption>{[f.answers.stars, who(f)].filter(Boolean).join(" · ")}</figcaption>
            </figure>
          )) : <p className="none">No reviews yet.</p>}
        </section>
      </>)}
    </div>
  );
}

export default function WorktopiaAnswersPage({ config }) {
  const [data] = useClassState(config.storageKey);
  const { session, email, instructor } = useSession();
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const [out, setOut] = useState(null);
  const [failed, setFailed] = useState("");

  useEffect(() => {
    document.title = config.code + " · " + WORKTOPIA_TITLE + " answers";
    setClassFavicon(config);
  }, [config]);

  const roster = rosterOf(config, data);
  const allowed = !!session && (instructor || !!studentFor(email, roster));

  useEffect(() => {
    if (!allowed) return undefined;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/worktopia-answers", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, storageKey: config.storageKey }),
        });
        const body = await r.json().catch(() => null);
        if (!alive) return;
        if (body?.ok) { setOut(body); setFailed(""); } else setFailed(body?.error || "Could not read the files.");
      } catch { if (alive) setFailed("Could not read the files."); }
    };
    load();
    window.addEventListener("focus", load);
    return () => { alive = false; window.removeEventListener("focus", load); };
  }, [allowed, config.id, config.storageKey]);

  // Who wrote a file, for the instructor: the roster's name for the email,
  // else the name typed into the terminal, else the email. A student sees
  // nobody's name, the server having sent none.
  const nameOf = useMemo(() => new Map(roster.map(s => [emailOf(s), s.name])), [roster]);
  const named = !!out?.named;
  const whoClass = (f) => (named ? nameOf.get(f.viewer) || f.answers.name || f.viewer || "" : "");
  const whoVisitor = (f) => (named ? f.answers.name || "Visitor" : "");
  const sheets = useMemo(() => (out?.sheets || []).filter(f => !INSTRUCTOR_EMAILS.includes(f.viewer || "")), [out]);
  const visitors = out?.visitors || [];

  const next = typeof window !== "undefined" ? window.location.pathname : config.path;
  let gate = null;
  if (!session) gate = (<>
    <p style={{ fontSize: 17, margin: "0 0 12px" }}>This page runs on your email sign-in.</p>
    <a className="ca-focus" href={"/login?next=" + encodeURIComponent(next)} style={{ fontSize: 17, fontWeight: 600, color: config.accent }}>Sign in</a>
  </>);
  else if (!allowed) gate = data === null
    ? <p style={{ fontSize: 17, margin: 0 }}>Loading the roster.</p>
    : <p style={{ fontSize: 17, margin: 0 }}>{email} is not on the roster for {config.code} yet.</p>;
  else if (failed) gate = <p style={{ fontSize: 17, margin: 0 }}>{failed}</p>;
  else if (!out) gate = <p style={{ fontSize: 17, margin: 0 }}>Reading the files.</p>;

  return (
    <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body, "--accent": config.accent }}>
      <ThemeStyle theme={theme} />
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      {gate ? <div style={{ padding: 32 }}>{gate}</div> : (
        <div className="wa">
          <header className="top">
            <div className="eyebrow">{config.code}</div>
            <h1>{WORKTOPIA_TITLE + ", every file"}</h1>
            <div className="facts">{named ? "Names are showing. A student who opens this address sees the same answers with no names." : "Answers are shown without names, in no particular order."}</div>
          </header>
          <Group title="The class" files={sheets} who={whoClass} named={named} roster />
          <Group title="Visitors on the public page" files={visitors} who={whoVisitor} named={named} roster={false} />
          <p className="foot">Answers are exactly as written. The page reads again each time you come back to the tab.</p>
        </div>
      )}
    </div>
  );
}

export const CSS = `
.wa{max-width:1180px;margin:0 auto;padding:24px 16px 64px;display:grid;gap:32px}
.wa .top{display:grid;gap:8px}
.wa .eyebrow{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.wa h1{margin:0;font-family:var(--font-display);font-size:28px;font-weight:700;letter-spacing:-.02em;text-wrap:balance;color:var(--text-primary)}
.wa .facts{font-size:15px;color:var(--text-secondary);max-width:72ch}
.wa .grp{display:grid;gap:16px}
.wa .gh{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;padding-top:8px}
.wa h2{margin:0;font-size:22px;font-weight:600;color:var(--text-primary)}
.wa .meta{font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.wa .sec{background:var(--surface-card);border:1px solid var(--line-soft);border-radius:16px;padding:20px;display:grid;gap:12px;min-width:0}
.wa .sh{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.wa .sh h3{margin:0;font-size:18px;font-weight:600;color:var(--text-primary);max-width:72ch;flex:1 1 320px}
.wa .lnk{font:inherit;font-size:14px;font-weight:600;color:var(--accent);background:transparent;border:0;padding:0;cursor:pointer;min-height:36px}
.wa .none{margin:0;font-size:15px;color:var(--text-secondary)}
.wa .quote{margin:0;display:grid;gap:4px;padding-top:12px;border-top:1px solid var(--line-soft)}
.wa blockquote{margin:0;font-size:17px;line-height:1.45;color:var(--text-primary);overflow-wrap:anywhere;max-width:72ch;white-space:pre-wrap}
.wa figcaption{font-size:13px;color:var(--text-muted)}
.wa .tally{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.wa .tally li{display:grid;grid-template-columns:28px 120px minmax(0,1fr);gap:10px;align-items:center}
.wa .num{font-size:15px;font-weight:600;color:var(--text-primary);text-align:right;font-variant-numeric:tabular-nums}
.wa .bar{height:8px;background:var(--surface-sunk);border-radius:999px;overflow:hidden}
.wa .bar i{display:block;height:100%;background:var(--accent);border-radius:999px}
.wa .lab{font-size:15px;color:var(--text-primary);overflow-wrap:anywhere}
.wa .scroll{overflow-x:auto;margin:0 -4px}
.wa table{width:100%;border-collapse:collapse;min-width:640px}
.wa th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);text-align:left;padding:8px 10px;border-bottom:1px solid var(--line-soft)}
.wa td{padding:10px;border-bottom:1px solid var(--line-soft);font-size:15px;vertical-align:top;color:var(--text-primary);overflow-wrap:anywhere}
.wa .row{cursor:pointer}
.wa .row:hover td{background:var(--surface-sunk)}
.wa .row.open td{border-bottom:0}
.wa .who{font-weight:600;white-space:nowrap}
.wa .when{white-space:nowrap;color:var(--text-secondary)}
.wa .dim{color:var(--text-muted)}
.wa .more td{padding:0 10px 16px}
.wa .three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.wa .pos{display:grid;gap:10px;align-content:start;padding:12px;border-radius:12px;background:var(--surface-sunk)}
.wa .pos h4{margin:0;font-size:15px;font-weight:600;color:var(--text-primary)}
.wa .qa{display:grid;gap:2px}
.wa .q{font-size:13px;color:var(--text-muted)}
.wa .a{font-size:15px;line-height:1.4;color:var(--text-primary);white-space:pre-wrap}
.wa .foot{font-size:13px;color:var(--text-muted)}
.wa .lnk:focus-visible,.wa .row:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:860px){.wa .three{grid-template-columns:1fr}.wa .sec{padding:16px}.wa .tally li{grid-template-columns:28px 80px minmax(0,1fr)}}
`;
