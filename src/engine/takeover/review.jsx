// Andrew's side of Takeover: /comm118/worksheets/takeover?review.
//
// What every student did: who is in, what the class spent its capital on,
// how the polls went, and each season read back whole (SeasonLog from
// game.jsx, the same words the student saw). Reads through
// /api/worksheet-submits (all: true), the way the topics review does, and
// asks again every half minute while open. Nothing is written here. How the
// game works is the control page (control.jsx), not this one.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { isLurker } from "../sections.js";
import { useCopy } from "../visualstory/pre.jsx";
import * as E from "./engine.js";
import { SeasonLog, CSS as GAME_CSS } from "./game.jsx";
import * as TOKENS from "../tokens.js";
import { StudentLink } from "../StudentPage.jsx";

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

/** The class's choices and polls, counted across every sheet. */
export function tally(sheets) {
  const kinds = Object.fromEntries(Object.keys(E.TAGS).map(t => [t, 0]));
  const polls = {};
  const cultures = [], skills = [], successes = [];
  let wins = 0, losses = 0, defined = 0, definedRight = 0;
  sheets.forEach(sh => {
    const def = E.defineOf(sh.answers[E.F.define]);
    if (def) { defined += 1; if (def.right) definedRight += 1; }
    const { results, state } = E.replay(sh.answers, sh.student?.name || "");
    results.forEach(r => { const o = E.optionOf(E.situationOf(r.situation), r.option); if (o) kinds[o.tag] = (kinds[o.tag] || 0) + 1; });
    if (results.length) { cultures.push(state.culture); skills.push(state.skills); successes.push(state.success); wins += state.wins; losses += state.losses; }
    E.POLL_WEEKS.forEach(w => {
      const a = String(sh.answers[E.F.poll(w)] || "").trim();
      if (!a) return;
      const concept = Object.keys(E.POLLS).find(k => E.POLLS[k].includes(a));
      if (!concept) return;
      const p = (polls[concept] = polls[concept] || Object.fromEntries(E.POLLS[concept].map(o => [o, 0])));
      p[a] += 1;
    });
  });
  const avg = (xs) => xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;
  return { kinds, polls, culture: avg(cultures), skills: avg(skills), success: avg(successes), wins, losses, seasons: cultures.length, defined, definedRight };
}

export default function TakeoverReview({ config, worksheetKey, roster }) {
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const copy = useCopy(false, E.COPY_ROW, E.DEFAULT_COPY);

  useEffect(() => {
    let alive = true;
    const ask = () => call({ groupKey: config.id, key: worksheetKey, all: true })
      .then(out => { if (alive) setSheets(out.sheets); })
      .catch(e => { if (alive) setError(e.message); });
    ask();
    const t = setInterval(ask, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [config.id, worksheetKey]);

  if (error && !sheets) return <Shell><p className="tkr-p">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="tkr-p">Loading the sheets.</p></Shell>;

  const byEmail = new Map(sheets.map(s => [lower(s.viewer_id), s]));
  const people = roster.filter(s => s.email && !isLurker(s.name));
  const rows = people.map(p => ({ student: p, sheet: byEmail.get(lower(p.email)) || null }));
  const withSheets = rows.filter(r => r.sheet).map(r => ({ ...r.sheet, student: r.student }));
  const submitted = withSheets.filter(s => s.submitted_at).length;
  const t = tally(withSheets);
  const notIn = rows.filter(r => !r.sheet?.submitted_at).map(r => r.student.name);
  const classmatesOf = (student) => people.map(s => s.name).filter(n => n !== student.name);

  return (
    <Shell>
      <h1 className="tkr-title">{copy.say("title")}, every season</h1>
      <p className="tkr-p">{submitted + " handed in, " + (withSheets.length - submitted) + " started, " + (rows.length - withSheets.length) + " not opened. This page asks again every half minute."}</p>
      {notIn.length ? <p className="tkr-muted">Not handed in yet: {notIn.join(", ")}.</p> : <p className="tkr-muted">Everyone is in.</p>}
      <p className="tkr-muted"><a href={config.path + "/worksheets/" + worksheetKey + "?control"}>How the game works, and what each student gets</a></p>
      {t.seasons ? (
        <section className="tkr-row">
          <div className="tkr-head"><b className="tkr-name">What the class did</b><span className="tkr-chip">{t.seasons + (t.seasons === 1 ? " season" : " seasons") + ", " + t.wins + "-" + t.losses + ", culture " + t.culture + ", skills " + t.skills + ", success " + t.success + " on average"}</span>{t.defined ? <span className="tkr-chip">{t.definedRight + " of " + t.defined + " picked the right definition of culture"}</span> : null}</div>
          <table className="tkr-table"><tbody>
            {Object.keys(E.TAGS).map(k => <tr key={k}><td>{E.TAGS[k].label}</td><td className="tkr-n">{t.kinds[k]}</td></tr>)}
          </tbody></table>
          {Object.keys(t.polls).length ? (
            <table className="tkr-table"><tbody>
              {Object.entries(t.polls).map(([c, p]) => <tr key={c}><td>{E.conceptOf(c).name}</td>{Object.entries(p).map(([o, n]) => <td key={o}>{o} <b className="tkr-n">{n}</b></td>)}</tr>)}
            </tbody></table>
          ) : null}
        </section>
      ) : null}
      {rows.map(({ student, sheet }) => (
        <article key={student.email} className="tkr-row">
          <div className="tkr-head">
            <b className="tkr-name"><StudentLink config={config} student={student} /></b>
            <span className={"tkr-chip" + (sheet?.submitted_at ? " tkr-ok" : "")}>{sheet ? (sheet.submitted_at ? "Handed in " + when(sheet.submitted_at) : "Started") : "Not opened"}</span>
            {sheet ? <a className="tkr-link" href={config.path + "/worksheets/" + worksheetKey + "?s=" + encodeURIComponent(student.email)}>Open the file</a> : null}
          </div>
          {sheet ? (
            <details className="tkr-details">
              <summary>{summaryOf(sheet.answers, student.name)}</summary>
              <div className="tk tkr-game"><style>{GAME_CSS}</style><SeasonLog answers={sheet.answers} name={student.name} classmates={classmatesOf(student)} copy={copy} /></div>
            </details>
          ) : null}
        </article>
      ))}
    </Shell>
  );
}

const summaryOf = (answers, name) => {
  const sport = E.sportOf(answers[E.F.sport]);
  const { results, state } = E.replay(answers, name);
  if (!sport) return "Opened, no sport picked yet.";
  const team = String(answers[E.F.team] || "").trim() || "no team yet";
  return team + " · " + sport.name + " · " + results.length + " of " + E.WEEKS + " weeks · " + state.wins + "-" + state.losses + " · culture " + state.culture + " · skills " + state.skills + " · success " + state.success;
};

function Shell({ children }) {
  return <div className="tkr"><style>{CSS}</style><div className="tkr-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.tkr{padding:20px 16px 80px;color:${T.primary}}
.tkr-in{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.tkr-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.tkr-p{margin:0;font-size:16px;color:${T.secondary}}
.tkr-muted{margin:0;font-size:14.5px;color:${T.muted}}
.tkr-muted a,.tkr-link{color:inherit}
.tkr-row{border-top:1px solid ${L.soft};padding:16px 0 4px;display:flex;flex-direction:column;gap:10px}
.tkr-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tkr-name{font-size:18px}
.tkr-chip{font-size:13px;font-weight:600;border-radius:999px;padding:3px 10px;border:1px solid ${L.strong};color:${T.secondary}}
.tkr-ok{border-color:${ST.ok};color:${ST.ok}}
.tkr-link{font-size:14px}
.tkr-table{border-collapse:collapse;font-size:15px}
.tkr-table td{padding:4px 14px 4px 0;border-bottom:1px solid ${L.soft}}
.tkr-n{font-weight:600}
.tkr-details summary{cursor:pointer;font-size:15px;color:${T.secondary}}
.tkr-game{margin-top:10px;padding:16px;min-height:0}
`;
