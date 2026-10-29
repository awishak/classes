// The control page: /comm118/worksheets/takeover?control. The instructor's.
//
// Andrew, 2026-10-29: "every single time we do a worksheet, I want like a
// control page, an instructor page that tells me exactly why everything's
// happening and exactly how everything is happening." So this page states
// the mechanism, all of it, from engine.js itself rather than from a copy:
// how a season is built, the capital, the five parts, every event, every
// line, the polls, and then one student's season as the engine will deal it,
// with a simulator to try any six spends. What students did is the review
// page (review.jsx). Nothing is written here.

import { useEffect, useMemo, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { isLurker } from "../sections.js";
import * as E from "./engine.js";
import { parseConcepts, castOf, teamOf, weekLines } from "./game.jsx";
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
const TOPICS_KEY = "team-topics";

/** A whole season for a name and six spends, from the engine alone. */
export function simulate({ name, concepts, topicsAnswers, spends, cast, sport, team }) {
  const plan = E.planSeason({ name, concepts, topicsAnswers });
  let state = E.start();
  const weeks = [];
  for (let i = 0; i < E.WEEKS; i++) {
    const week = plan[i];
    const wanted = E.spendOf(spends[i]) || E.affordable(state.capital, state.culture)[0];
    const can = E.affordable(state.capital, state.culture);
    const spend = can.find(s => s.id === wanted.id) || can[0];
    const result = E.resolve({ name, week: week.week, state, spendId: spend.id, eventId: week.event });
    const { lines } = weekLines({ plan: week, result, cast, sport, team, name });
    weeks.push({ week, result, lines, could: can.map(s => s.id), wanted: wanted.id });
    state = E.after(result);
  }
  return { plan, weeks, state };
}

export default function TakeoverControl({ config, worksheetKey, roster }) {
  const people = roster.filter(s => s.email && !isLurker(s.name));
  const [who, setWho] = useState(people[0]?.email || "");
  const [topics, setTopics] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [sportId, setSportId] = useState(E.SPORTS[0].id);
  const [spends, setSpends] = useState(E.LETTERS.map(() => "teach"));
  const student = people.find(p => p.email === who) || null;

  useEffect(() => {
    if (!student) return undefined;
    let alive = true;
    setTopics(null); setFile(null); setError("");
    Promise.all([
      call({ groupKey: config.id, key: TOPICS_KEY, viewer: student.email }),
      call({ groupKey: config.id, key: worksheetKey, viewer: student.email }),
    ]).then(([t, f]) => { if (alive) { setTopics(t.answers || {}); setFile(f.sheet ? { answers: f.answers || {}, submitted: f.sheet.submitted_at } : { answers: {}, submitted: null }); } })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [student?.email, config.id, worksheetKey]);

  const name = student?.name || "";
  const classmates = useMemo(() => people.map(p => p.name).filter(n => n !== name), [people, name]);
  const answers = file?.answers || {};
  const concepts = parseConcepts(answers[E.F.concepts]).length ? parseConcepts(answers[E.F.concepts]) : E.conceptsFor(topics || {});
  const cast = castOf(answers, name, classmates);
  const team = teamOf(answers, name);
  const sport = E.sportOf(answers[E.F.sport]) || E.sportOf(sportId);
  const sim = useMemo(() => name && topics ? simulate({ name, concepts, topicsAnswers: topics, spends, cast, sport, team }) : null, [name, topics, concepts, spends, cast, sport, team]);
  const onFile = E.replay(answers);

  return (
    <div className="tkc"><style>{CSS}</style><div className="tkc-in">
      <h1 className="tkc-title">How {E.TAKEOVER_TITLE} works</h1>
      <p className="tkc-p">Everything on this page is read from the engine (src/engine/takeover/engine.js), not written separately, so the page cannot drift from the game. What students did is on the <a href={config.path + "/worksheets/" + worksheetKey + "?review"}>review page</a>.</p>

      <h2 className="tkc-h">A season, built</h2>
      <ol className="tkc-list">
        <li>Nothing is random. Every roll is a hash of the student's name plus where they are in the season, so a reload shows the same season and a resumed file replays exactly.</li>
        <li>The student picks a sport (volleyball, Aussie rules football, softball) and a team from six names the hash deals them out of {E.TEAM_NAMES.length} that do not fit the place. Opponents are the other names.</li>
        <li>Five classmates are dealt the five parts below, in an order the name sets, from the roster less the student and the house accounts. The cast is saved on the file, so a roster change later never reshuffles a season.</li>
        <li>The student's five concepts come from their Concepts in Team Communication sheet, slots a to e, matched to the chapter's twenty titles. A short or missing sheet is filled from the class's most chosen: {E.CLASS_TOP.map(c => E.conceptOf(c).name).join(", ")}.</li>
        <li>Weeks 1 to 5 are the five concepts in sheet order. Week 6 is one of the five again, by the hash, with that concept's other event.</li>
        <li>Each week's event is one of that concept's two, by the hash. Each event lands on one part.</li>
        <li>The prompt after a week is Andrew's line with the student's own wonder on that concept in the blank. Week 6 shows the student's own opinion instead and asks whether they still think so. A student with no wonder on file gets the class's, unattributed.</li>
        <li>The concepts and the cast are saved when the team is picked. Each week's result is saved packed in its own row the moment the spend is chosen, so later changes to these words never change a week already played.</li>
      </ol>

      <h2 className="tkc-h">Capital and culture</h2>
      <ul className="tkc-list">
        <li>Start: {E.START_CAPITAL} capital, culture {E.START_CULTURE}. Each week earns 1 capital, a win earns 1 more.</li>
        <li>Establish dominance costs {E.SPENDS.find(s => s.id === "dominate").cost} while culture is under {E.READY}, and 2 from {E.READY} up, when the room is ready. Ready also turns the star and the veteran toward dominance, and dominance then raises culture 2 instead of cutting it.</li>
        <li>Culture change in a week = the spend's base + 2 × the event's fit for that spend + the crowd (+1 for each player up, −1 for each down) + a swing. The swing is −2 one week in ten, −1 two in ten, 0 four in ten, +1 two in ten, +2 one in ten.</li>
        <li>A player's mood = their affinity for the spend, +1 or −1 when the event landed on them and the spend fit or did not, and one week in ten a step of their own either way. 1 or more is up, −1 or less is down.</li>
        <li>Chance of winning the match = 0.3 + (culture − {E.START_CULTURE}) / 150 + 0.08 × the spend's win number + 0.03 × the event's fit, held between 0.1 and 0.9.</li>
        <li>Grade at the end: A from 80, B from 65, C from 50, D from 35, else F.</li>
      </ul>
      <table className="tkc-table"><thead><tr><th>Spend</th><th>Cost</th><th>Culture</th><th>Win</th><th>The line</th></tr></thead><tbody>
        {E.SPENDS.map(s => <tr key={s.id}><td>{s.label}</td><td>{s.cost}</td><td>{s.culture}</td><td>{s.win}</td><td>{s.line}</td></tr>)}
      </tbody></table>

      <h2 className="tkc-h">The five parts</h2>
      <table className="tkc-table"><thead><tr><th>Part</th><th>Blurb</th>{E.SPENDS.map(s => <th key={s.id}>{s.label}</th>)}</tr></thead><tbody>
        {E.CHARACTERS.map(c => <tr key={c.id}><td>{c.label}</td><td>{c.blurb}</td>{E.SPENDS.map(s => <td key={s.id} className="tkc-n">{c.affinity[s.id]}{s.id === "dominate" && c.readyDominate ? " (+" + c.readyDominate * 2 + " ready)" : ""}</td>)}</tr>)}
      </tbody></table>

      <h2 className="tkc-h">The events</h2>
      <table className="tkc-table"><thead><tr><th>Concept</th><th>On</th><th>What happens</th>{E.SPENDS.map(s => <th key={s.id}>{s.label}</th>)}</tr></thead><tbody>
        {E.EVENTS.map(e => <tr key={e.id}><td>{E.conceptOf(e.concept).name}</td><td>{E.characterOf(e.who).label}</td><td>{e.text}</td>{E.SPENDS.map(s => <td key={s.id} className="tkc-n">{e.fit[s.id]}</td>)}</tr>)}
      </tbody></table>

      <h2 className="tkc-h">What the players say</h2>
      {E.CHARACTERS.map(c => (
        <table key={c.id} className="tkc-table"><thead><tr><th>{c.label}</th><th>Up</th><th>Flat</th><th>Down</th></tr></thead><tbody>
          {E.SPENDS.map(s => <tr key={s.id}><td>{s.label}</td><td>{E.LINES[c.id][s.id].up}</td><td>{E.LINES[c.id][s.id].flat}</td><td>{E.LINES[c.id][s.id].down}</td></tr>)}
        </tbody></table>
      ))}

      <h2 className="tkc-h">The polls, and the class's wonders</h2>
      <p className="tkc-p">A poll on weeks 2, 4 and 6, from that week's concept. The wonder is what a student sees when their own sheet has none for the concept.</p>
      <table className="tkc-table"><thead><tr><th>Concept</th><th>This</th><th>That</th><th>The class's wonder</th></tr></thead><tbody>
        {E.CONCEPTS.map(c => <tr key={c.id}><td>{c.name}</td><td>{E.POLLS[c.id][0]}</td><td>{E.POLLS[c.id][1]}</td><td>{E.CLASS_WONDERS[c.id]}</td></tr>)}
      </tbody></table>

      <h2 className="tkc-h">One student's season</h2>
      <div className="tkc-row">
        <label className="tkc-label">Student <select className="tkc-select" value={who} onChange={e => setWho(e.target.value)}>{people.map(p => <option key={p.email} value={p.email}>{p.name}</option>)}</select></label>
        {!E.sportOf(answers[E.F.sport]) ? <label className="tkc-label">Sport <select className="tkc-select" value={sportId} onChange={e => setSportId(e.target.value)}>{E.SPORTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label> : null}
      </div>
      {error ? <p className="tkc-p">Could not read the student's sheets: {error}</p> : null}
      {student && topics && file ? (
        <>
          <p className="tkc-p">
            {file.submitted ? "Handed in. " : onFile.results.length ? onFile.results.length + " of " + E.WEEKS + " weeks on file. " : "Not started. "}
            Team: {team}. Team choices dealt: {E.teamChoicesFor(name).join(", ")}. Sport: {sport.name}.
          </p>
          <p className="tkc-p">Cast: {E.CHARACTERS.map(c => c.label + " is " + cast[c.id]).join("; ")}.</p>
          <p className="tkc-p">Concepts: {concepts.map(c => E.conceptOf(c.id).name + (c.slot ? " (slot " + c.slot + ")" : " (class)")).join(", ")}.</p>
          <div className="tkc-row">
            {E.LETTERS.map((w, i) => (
              <label key={w} className="tkc-label">Week {i + 1} <select className="tkc-select" value={spends[i]} onChange={e => setSpends(s => s.map((x, j) => j === i ? e.target.value : x))}>{E.SPENDS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
            ))}
          </div>
          {sim ? (
            <table className="tkc-table"><thead><tr><th>Week</th><th>Concept</th><th>What happens</th><th>Spend</th><th>Could afford</th><th>Culture</th><th>Match</th><th>Capital</th><th>Moods</th><th>The prompt</th></tr></thead><tbody>
              {sim.weeks.map(({ week, result, lines, could, wanted }) => (
                <tr key={week.week}>
                  <td>{week.n}{week.last ? " (final)" : ""}</td>
                  <td>{E.conceptOf(week.concept).name}</td>
                  <td>{lines[0].text}</td>
                  <td>{E.spendOf(result.spend).label}{result.spend !== wanted ? " (could not afford " + E.spendOf(wanted).label + ")" : ""}</td>
                  <td>{could.map(id => E.spendOf(id).label).join(", ")}</td>
                  <td className="tkc-n">{result.culture - result.delta} to {result.culture} ({result.delta >= 0 ? "+" : ""}{result.delta}, swing {result.swing})</td>
                  <td>{result.won ? "Won" : "Lost"} ({result.p}%)</td>
                  <td className="tkc-n">{result.capital}</td>
                  <td>{E.CHARACTERS.map(c => c.label.replace("The ", "") + " " + result.moods[c.id]).join(", ")}</td>
                  <td>{week.prompt.kind === "thought" ? "You thought: " : "You wondered: "}{week.prompt.text}</td>
                </tr>
              ))}
            </tbody></table>
          ) : null}
          {sim ? <p className="tkc-p">End of that season: {sim.state.wins}-{sim.state.losses}, culture {sim.state.culture}, grade {E.gradeOf(sim.state.culture)}.</p> : null}
        </>
      ) : student ? <p className="tkc-p">Loading the student's sheets.</p> : <p className="tkc-p">Nobody on the roster yet.</p>}
    </div></div>
  );
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;
const CSS = `
.tkc{padding:20px 16px 80px;color:${T.primary}}
.tkc-in{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.tkc-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.tkc-h{margin:18px 0 0;font-size:20px;font-weight:600}
.tkc-p{margin:0;font-size:15.5px;line-height:1.5;color:${T.secondary}}
.tkc-p a{color:inherit}
.tkc-list{margin:0;padding-left:22px;font-size:15.5px;line-height:1.5;display:grid;gap:6px}
.tkc-table{border-collapse:collapse;font-size:14px;width:100%}
.tkc-table th{text-align:left;padding:6px 10px 6px 0;border-bottom:2px solid ${L.strong};font-weight:600;vertical-align:bottom}
.tkc-table td{padding:6px 10px 6px 0;border-bottom:1px solid ${L.soft};vertical-align:top}
.tkc-n{font-variant-numeric:tabular-nums;white-space:nowrap}
.tkc-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.tkc-label{display:inline-flex;gap:6px;align-items:center;font-size:14px}
.tkc-select{font:inherit;font-size:14px;padding:4px 8px;border:1px solid ${L.strong};border-radius:8px;background:${S.card};color:${T.primary}}
`;
