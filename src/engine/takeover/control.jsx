// The control page: /comm118/worksheets/takeover?control. The instructor's.
//
// Andrew, 2026-10-29: "every single time we do a worksheet, I want like a
// control page, an instructor page that tells me exactly why everything's
// happening and exactly how everything is happening." So this page states
// the mechanism, all of it, from engine.js itself rather than from a copy:
// how a season is built, the three numbers and the coins, the five parts,
// every situation with its options and the research under each, every chat
// line, the polls, and then one student's season as the engine will deal
// it, with a simulator to try any six choices. What students did is the
// review page (review.jsx). Nothing is written here.

import { useEffect, useMemo, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { isLurker } from "../sections.js";
import * as E from "./engine.js";
import { parseConcepts, castOf, teamOf, benchNameOf, weekLines } from "./game.jsx";
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

/** A whole season for a name and its choices, from the engine alone. choices are option ids, one a week (or a list from MULTI_FROM on), or blank for the cheapest. */
export function simulate({ name, concepts, topicsAnswers, choices, cast, sport, team, bench }) {
  const plan = E.planSeason({ name, concepts, topicsAnswers });
  let state = E.startState(name);
  const weeks = [];
  for (let i = 0; i < E.WEEKS; i++) {
    const week = plan[i];
    const sit = E.situationOf(week.situation);
    const can = sit.options.filter(o => o.cost <= state.capital);
    const askedRaw = [].concat((choices || [])[i] || []).filter(Boolean);
    const asked = askedRaw[0] === "all" && week.multi ? sit.options.map(o => o.id) : askedRaw;
    const wanted = asked.length ? asked : [can[0].id];
    // What was asked for, trimmed to what the coach can pay for this week.
    let left = state.capital;
    const taken = wanted.filter(id => { const o = E.optionOf(sit, id); if (!o || o.cost > left) return false; left -= o.cost; return true; });
    const ids = taken.length ? taken : [can[0].id];
    const result = E.resolve({ name, week: week.week, state, situationId: sit.id, optionIds: ids });
    const { lines, ctx } = weekLines({ plan: week, result, cast, sport, team, name, bench });
    weeks.push({ week, sit, result, lines, ctx, could: can.map(o => o.id), wanted });
    state = E.after(result);
  }
  return { plan, weeks, state };
}

const who = (ids) => ids.length ? ids.map(id => E.characterOf(id).label.replace("The ", "")).join(", ") : "nobody";

export default function TakeoverControl({ config, worksheetKey, roster }) {
  const people = roster.filter(s => s.email && !isLurker(s.name));
  const [whoEmail, setWho] = useState(people[0]?.email || "");
  const [topics, setTopics] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [sportId, setSportId] = useState(E.SPORTS[0].id);
  const [choices, setChoices] = useState(E.LETTERS.map(() => ""));
  const student = people.find(p => p.email === whoEmail) || null;

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
  const bench = benchNameOf(cast, classmates, name);
  const sport = E.sportOf(answers[E.F.sport]) || E.sportOf(sportId);
  const sim = useMemo(() => name && topics ? simulate({ name, concepts, topicsAnswers: topics, choices, cast, sport, team, bench }) : null, [name, topics, concepts, choices, cast, sport, team, bench]);
  const onFile = E.replay(answers, name);
  const start = name ? E.startState(name) : null;

  return (
    <div className="tkc"><style>{CSS}</style><div className="tkc-in">
      <h1 className="tkc-title">How {E.TAKEOVER_TITLE} works</h1>
      <p className="tkc-p">Everything on this page is read from the engine (src/engine/takeover/engine.js), not written separately, so the page cannot drift from the game. What students did is on the <a href={config.path + "/worksheets/" + worksheetKey + "?review"}>review page</a>.</p>

      <h2 className="tkc-h">A season, built</h2>
      <ol className="tkc-list">
        <li>Nothing is random. Every roll is a hash of the student's name plus where they are in the season, so a reload shows the same season and a resumed file replays exactly.</li>
        <li>The student picks a sport (volleyball, Aussie rules football, softball) and a team from six names the hash deals them out of {E.TEAM_NAMES.length} that do not fit the place. Opponents are six other names, a different one each week.</li>
        <li>Five classmates are dealt the five parts below, in an order the name sets, from the roster less the student and the house accounts. The cast is saved on the file, so a roster change later never reshuffles a season.</li>
        <li>The student's five concepts come from their Concepts in Team Communication sheet, slots a to e, matched to the chapter's twenty titles. A short or missing sheet is filled from the class's most chosen: {E.CLASS_TOP.map(c => E.conceptOf(c).name).join(", ")}.</li>
        <li>Week 1 is the opener, with the first concept's question. Week 2 is the second concept's situation. Week 3 is the press: Lisa Davis of the Pacifica Times. Weeks 4 to 6 are the last three concepts' situations. Week 7 is the finale.</li>
        <li>From week {E.MULTI_FROM} on, a student may choose more than one option in a week, as many as they can pay for. A pop-up says so the first time. The chat answers the dearest option chosen; every option's culture, skills and win numbers add, and every option's likes and dislikes add per player.</li>
        <li>The prompt after a week is Andrew's line with the student's own wonder on that concept in the blank. The press week asks what a coach should say in public about a player who had a bad night. The final week asks what makes for a good team culture. A student with no wonder on file gets the class's, unattributed.</li>
        <li>The concepts and the cast are saved when the team is picked. Each week's result is saved packed in its own row the moment the choice is made, so later changes to these words never change a week already played.</li>
      </ol>

      <h2 className="tkc-h">The three numbers and the coins</h2>
      <ul className="tkc-list">
        <li>Culture and skills start between 35 and 65, each by the hash. Success starts halfway between culture and skills.</li>
        <li>Capital starts at {E.START_CAPITAL}. Every option costs 0 to 4 coins. After the week each of the five players reacts: up gives {E.RETURN.up} coin back, flat gives {E.RETURN.flat}, down gives {E.RETURN.down}. So a week can return up to five coins or none.</li>
        <li>A player is up when the option lists that player under Up, down when the option lists that player under Down, and flat otherwise. One week in ten a player swings a step of their own either way.</li>
        <li>Culture after = culture + the option's culture number + a swing: −2 one week in ten, −1 two in ten, 0 four in ten, +1 two in ten, +2 one in ten. Skills after = skills + the option's skills number + a nudge of −1, 0 or +1 (one in four each way). Both held to 0 to 100.</li>
        <li>Chance of winning the match = 0.08 + 0.84 × (culture + skills) / 200 + 0.05 × the option's win number, held between 5% and 95%. At 50 and 50 that is 50%; at 65 and 65, 63%; at 35 and 35, 37%.</li>
        <li>A win moves success +{E.WIN_SUCCESS}, a loss {E.LOSS_SUCCESS}. Grade at the end, on success: A from 80, B from 65, C from 50, D from 35, else F.</li>
      </ul>
      <table className="tkc-table"><thead><tr><th>Kind of action</th><th>What it is</th></tr></thead><tbody>
        {Object.entries(E.TAGS).map(([id, t]) => <tr key={id}><td>{t.label}</td><td>{t.line}</td></tr>)}
      </tbody></table>

      <h2 className="tkc-h">The five parts</h2>
      <table className="tkc-table"><thead><tr><th>Part</th><th>Blurb</th></tr></thead><tbody>
        {E.CHARACTERS.map(c => <tr key={c.id}><td>{c.label}</td><td>{c.blurb}</td></tr>)}
      </tbody></table>

      <h2 className="tkc-h">The weeks, and what the coach can do</h2>
      <p className="tkc-p">Culture and skills are what the option adds before the swing. Win is the bonus to the chance of winning. Who is up and who is down is the option's own list; everyone else is flat. Under each situation is the research it is built from, and whose sheet raised the question where the class did.</p>
      {E.SITUATIONS.map(s => (
        <section key={s.id} className="tkc-sit">
          <h3 className="tkc-h3">{s.concept ? E.conceptOf(s.concept).name : s.id === "opener" ? "Week 1, the opener" : s.id === "press" ? "Week 3, the press" : "Week 7, the finale"}{s.who ? " · lands on " + E.characterOf(s.who).label.toLowerCase() : ""}</h3>
          <p className="tkc-p"><b>{s.text}</b></p>
          <p className="tkc-p">{s.research}</p>
          <table className="tkc-table"><thead><tr><th>Option</th><th>Cost</th><th>Culture</th><th>Skills</th><th>Win</th><th>Kind</th><th>Up</th><th>Down</th><th>Why</th></tr></thead><tbody>
            {s.options.map(o => <tr key={o.id}><td><b>{o.label}</b><br />{o.line}</td><td className="tkc-n">{o.cost}</td><td className="tkc-n">{o.culture}</td><td className="tkc-n">{o.skills}</td><td className="tkc-n">{o.win}</td><td>{E.TAGS[o.tag].label}</td><td>{who(o.likes)}</td><td>{who(o.dislikes)}</td><td>{o.note}</td></tr>)}
          </tbody></table>
        </section>
      ))}

      <h2 className="tkc-h">What the players say</h2>
      <p className="tkc-p">One line per part, per kind of action, per mood.</p>
      {E.CHARACTERS.map(c => (
        <table key={c.id} className="tkc-table"><thead><tr><th>{c.label}</th><th>Up</th><th>Flat</th><th>Down</th></tr></thead><tbody>
          {Object.keys(E.TAGS).map(t => <tr key={t}><td>{E.TAGS[t].label}</td><td>{E.LINES[c.id][t].up}</td><td>{E.LINES[c.id][t].flat}</td><td>{E.LINES[c.id][t].down}</td></tr>)}
        </tbody></table>
      ))}

      <h2 className="tkc-h">The polls, and the class's wonders</h2>
      <p className="tkc-p">A poll on weeks 2, 4 and 6, from that week's concept. The wonder is what a student sees when their own sheet has none for the concept.</p>
      <table className="tkc-table"><thead><tr><th>Concept</th><th>This</th><th>That</th><th>The class's wonder</th></tr></thead><tbody>
        {E.CONCEPTS.map(c => <tr key={c.id}><td>{c.name}</td><td>{E.POLLS[c.id][0]}</td><td>{E.POLLS[c.id][1]}</td><td>{E.CLASS_WONDERS[c.id]}</td></tr>)}
      </tbody></table>

      <h2 className="tkc-h">One student's season</h2>
      <div className="tkc-row">
        <label className="tkc-label">Student <select className="tkc-select" value={whoEmail} onChange={e => setWho(e.target.value)}>{people.map(p => <option key={p.email} value={p.email}>{p.name}</option>)}</select></label>
        {!E.sportOf(answers[E.F.sport]) ? <label className="tkc-label">Sport <select className="tkc-select" value={sportId} onChange={e => setSportId(e.target.value)}>{E.SPORTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label> : null}
      </div>
      {error ? <p className="tkc-p">Could not read the student's sheets: {error}</p> : null}
      {student && topics && file && sim && start ? (
        <>
          <p className="tkc-p">
            {file.submitted ? "Handed in. " : onFile.results.length ? onFile.results.length + " of " + E.WEEKS + " weeks on file. " : "Not started. "}
            {"Starts at culture " + start.culture + ", skills " + start.skills + ", success " + start.success + ". Team: " + team + ". Team choices dealt: " + E.teamChoicesFor(name).join(", ") + ". Sport: " + sport.name + "."}
          </p>
          <p className="tkc-p">Cast: {E.CHARACTERS.map(c => c.label + " is " + cast[c.id]).join("; ")}. Hurt in the finale: {bench}.</p>
          <p className="tkc-p">Concepts: {concepts.map(c => E.conceptOf(c.id).name + (c.slot ? " (slot " + c.slot + ")" : " (class)")).join(", ")}.</p>
          <div className="tkc-row">
            {sim.weeks.map(({ week, sit }, i) => (
              <label key={week.week} className="tkc-label">Week {i + 1} <select className="tkc-select" value={choices[i]} onChange={e => setChoices(s => s.map((x, j) => j === i ? e.target.value : x))}><option value="">(cheapest)</option>{sit.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}{week.multi ? <option value="all">(everything affordable)</option> : null}</select></label>
            ))}
          </div>
          <table className="tkc-table"><thead><tr><th>Week</th><th>Concept</th><th>What happens</th><th>Choice</th><th>Could afford</th><th>Culture</th><th>Skills</th><th>Match</th><th>Success</th><th>Coins</th><th>Moods</th><th>The prompt</th></tr></thead><tbody>
            {sim.weeks.map(({ week, sit, result, lines, ctx, could, wanted }) => (
              <tr key={week.week}>
                <td>{week.n}{week.last ? " (final)" : ""}</td>
                <td>{week.label}</td>
                <td>{lines[0].text}</td>
                <td>{result.options.map(id => E.tell(E.optionOf(sit, id).label, ctx)).join(" + ")}{wanted.join(",") !== result.options.join(",") && wanted[0] !== "all" ? " (asked for " + wanted.map(id => (E.optionOf(sit, id) || { label: id }).label).join(" + ") + ")" : ""}</td>
                <td>{could.map(id => E.optionOf(sit, id).label).join(", ")}</td>
                <td className="tkc-n">{result.culture - result.dCulture} to {result.culture} (swing {result.swing})</td>
                <td className="tkc-n">{result.skills - result.dSkills} to {result.skills} (nudge {result.nudge})</td>
                <td>{result.won ? "Won" : "Lost"} ({result.p}%)</td>
                <td className="tkc-n">{result.success}</td>
                <td className="tkc-n">−{result.cost} +{result.back} = {result.capital}</td>
                <td>{E.CHARACTERS.map(c => c.label.replace("The ", "") + " " + result.moods[c.id]).join(", ")}</td>
                <td>{week.prompt.kind === "press" ? "The press question" : week.prompt.kind === "final" ? "What makes a good team culture" : "You wrote: " + week.prompt.text}</td>
              </tr>
            ))}
          </tbody></table>
          <p className="tkc-p">End of that season: {sim.state.wins}-{sim.state.losses}, culture {sim.state.culture}, skills {sim.state.skills}, success {sim.state.success}, grade {E.gradeOf(sim.state.success)}.</p>
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
.tkc-h3{margin:14px 0 0;font-size:16px;font-weight:600}
.tkc-sit{display:flex;flex-direction:column;gap:8px}
.tkc-p{margin:0;font-size:15.5px;line-height:1.5;color:${T.secondary}}
.tkc-p b{color:${T.primary}}
.tkc-p a{color:inherit}
.tkc-list{margin:0;padding-left:22px;font-size:15.5px;line-height:1.5;display:grid;gap:6px}
.tkc-table{border-collapse:collapse;font-size:14px;width:100%}
.tkc-table th{text-align:left;padding:6px 10px 6px 0;border-bottom:2px solid ${L.strong};font-weight:600;vertical-align:bottom}
.tkc-table td{padding:6px 10px 6px 0;border-bottom:1px solid ${L.soft};vertical-align:top}
.tkc-n{font-variant-numeric:tabular-nums;white-space:nowrap}
.tkc-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.tkc-label{display:inline-flex;gap:6px;align-items:center;font-size:14px}
.tkc-select{font:inherit;font-size:14px;padding:4px 8px;border:1px solid ${L.strong};border-radius:8px;background:${S.card};color:${T.primary};max-width:260px}
`;
