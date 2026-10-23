// Questions for Andrew, on the site: /<class>/decisions.
//
// Andrew, 2026-10-22: "use my html style for asking me questions" and, when
// the first draft was an artifact, "no i want it within
// classes.andrewishak.com." So a question set is a page of his own in the
// Sit-Down sheet's clothes: one card a question, the options as tap targets,
// a notes box under each, saved to the plan row the moment he taps. The sets
// are in decisions.js, and scripts/decisions.mjs reads the answers back.
//
// Only the instructor sees the page. The address is in his menu as Decisions.

import { useEffect, useRef, useState } from "react";
import { useClassData } from "./store.js";
import { useSession } from "./session.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_STUDENT } from "./TopNav.jsx";
import { CSS, FONTS } from "./SitdownPage.jsx";
import { setsFor, answersOf, withAnswer, answeredCount, answerLines } from "./decisions.js";

export default function DecisionsPage({ config, setId = "" }) {
  const [data, update, , status] = useClassData(config.storageKey);
  const { session, email, instructor } = useSession();
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const sets = setsFor(config.id).filter(s => !setId || s.id === setId);

  useEffect(() => {
    document.title = config.code + " · Decisions";
    setClassFavicon(config);
  }, [config]);

  const next = typeof window !== "undefined" ? window.location.pathname : config.path;
  let gate = null;
  if (!session) gate = (<>
    <p className="p">This page runs on your email sign-in.</p>
    <a className="dl" href={"/login?next=" + encodeURIComponent(next)}>Sign in</a>
  </>);
  else if (!instructor) gate = <p className="p">{email + " is not an instructor on this site."}</p>;
  else if (data === null) gate = <p className="p">Loading the class.</p>;

  return (
    <div className="sd-root" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      {FONTS}
      <style>{CSS}</style>
      <style>{DC_CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      {gate ? <div className="sd gate">{gate}</div> : (
        <DecisionsBody config={config} data={data} update={update} sets={sets} busy={!!status?.busy} trouble={!!status?.trouble} />
      )}
    </div>
  );
}

// The page under the bar. Exported for the smoke run, which hands in a class
// and its sets.
export function DecisionsBody({ config, data, update, sets, busy = false, trouble = false }) {
  const one = sets.length === 1 ? sets[0] : null;
  return (
    <div className="sd dc">
      <header className="top">
        <div className="eyebrow">{config.code + " · Questions for you"}</div>
        <h1 className="h1">{one ? one.title : "Decisions"}</h1>
        {one && one.intro ? <p className="intro">{one.intro}</p> : null}
        {!sets.length ? <p className="p">No questions are waiting for you.</p> : null}
      </header>
      {sets.map(set => <SetBody key={set.id} set={set} data={data} update={update} busy={busy} trouble={trouble} single={!!one} />)}
    </div>
  );
}

function SetBody({ set, data, update, busy, trouble, single }) {
  const answers = answersOf(data, set.id);
  const when = data?.decisions?.[set.id]?.updatedAt || "";
  const done = answeredCount(set, answers);
  const change = (qid, patch) => update(d => withAnswer(d, set.id, qid, patch));
  return (<>
    {!single ? (
      <header className="top">
        <div className="eyebrow">{set.date}</div>
        <h2 className="h2">{set.title}</h2>
        {set.intro ? <p className="intro">{set.intro}</p> : null}
      </header>
    ) : null}
    <p className="meta">{stateLine(busy, trouble, when, done, set.questions.length)}</p>
    {set.questions.map((q, i) => <QuestionCard key={q.id} set={set} q={q} n={i + 1} answer={answers[q.id] || {}} onChange={(patch) => change(q.id, patch)} />)}
    <CopyAnswers set={set} answers={answers} />
  </>);
}

// "Saved 9:42 AM. 3 of 6 answered." The saving and the trouble lines come
// first, because they are the ones to act on.
function stateLine(busy, trouble, when, done, total) {
  const count = done + " of " + total + " answered.";
  if (trouble) return "Not saved yet. Your answers are kept here until the server answers. " + count;
  if (busy) return "Saving. " + count;
  if (when) return "Saved " + new Date(when).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ". " + count;
  return "Nothing answered yet.";
}

function QuestionCard({ set, q, n, answer, onChange }) {
  const base = "dc-" + set.id + "-" + q.id;
  const picks = Array.isArray(answer.picks) ? answer.picks : [];
  const togglePick = (v) => {
    const next = picks.includes(v) ? picks.filter(x => x !== v) : [...picks, v];
    onChange({ picks: next });
  };
  return (
    <section className="sec" id={base}>
      <div className="tag"><span className="num">{n}</span><h2 className="h2">{q.ask}</h2></div>
      {q.why ? <p className="p">{q.why}</p> : null}
      {q.kind === "many" ? <p className={"tally" + (picks.length > (q.max || 99) ? " over" : "")}>{"Cut " + picks.length + " of " + (q.max || q.options.length)}</p> : null}
      {q.kind === "one" ? (
        <ul className="opts" role="radiogroup" aria-label={q.ask}>
          {q.options.map(o => (
            <li key={o.v} className="opt one">
              <input type="radio" name={base} id={base + "-" + o.v} value={o.v} checked={answer.pick === o.v} onChange={() => onChange({ pick: o.v })} />
              <label htmlFor={base + "-" + o.v}><span className="box" aria-hidden="true"></span><span>{o.label}{o.sub ? <span className="sub">{o.sub}</span> : null}</span></label>
            </li>
          ))}
        </ul>
      ) : null}
      {q.kind === "many" ? (
        <ul className="opts" aria-label={q.ask}>
          {q.options.map(o => (
            <li key={o.v} className="opt">
              <input type="checkbox" name={base} id={base + "-" + o.v} value={o.v} checked={picks.includes(o.v)} onChange={() => togglePick(o.v)} />
              <label htmlFor={base + "-" + o.v}><span className="box" aria-hidden="true"></span><span>{o.label}{o.sub ? <span className="sub">{o.sub}</span> : null}</span></label>
            </li>
          ))}
        </ul>
      ) : null}
      <Notes id={base + "-notes"} value={answer.notes || ""} placeholder={q.placeholder || ""} onCommit={(notes) => onChange({ notes })} />
    </section>
  );
}

// The notes box keeps its own draft and hands the words over after a pause
// or on blur, so a save does not go out on every key.
function Notes({ id, value, placeholder, onCommit }) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const timer = useRef(null);
  const last = useRef(value);
  useEffect(() => { if (!editing && value !== last.current) { last.current = value; setDraft(value); } }, [value, editing]);
  const commit = (text) => { if (text !== last.current) { last.current = text; onCommit(text); } };
  const onChange = (e) => {
    const text = e.target.value;
    setDraft(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(text), 900);
  };
  const onBlur = () => { clearTimeout(timer.current); setEditing(false); commit(draft); };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <label className="field" htmlFor={id}>Notes
      <textarea id={id} rows={2} value={draft} placeholder={placeholder} onFocus={() => setEditing(true)} onChange={onChange} onBlur={onBlur} />
    </label>
  );
}

function CopyAnswers({ set, answers }) {
  const [said, setSaid] = useState("");
  const copy = () => {
    const text = [set.title + ", " + set.date].concat(answerLines(set, answers)).join("\n");
    const done = () => setSaid("Copied.");
    const fail = () => setSaid("The browser would not copy. Select the answers above instead.");
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail); else fail();
  };
  return (
    <section className="sec">
      <div className="bar">
        <button type="button" className="btn" onClick={copy}>Copy my answers</button>
        <span className="meta">{said || "The answers save as you tap. Copying is for pasting them to me."}</span>
      </div>
    </section>
  );
}

const DC_CSS = `
.dc .opts{list-style:none;margin:0;padding:0;display:grid;gap:8px;width:100%}
.dc .opt{position:relative}
.dc .opt input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.dc .opt label{display:flex;gap:12px;align-items:flex-start;min-height:44px;box-sizing:border-box;padding:10px 14px;border:1px solid var(--line);border-radius:var(--rr);background:var(--card);cursor:pointer;font-size:17px;line-height:1.4;color:var(--ink)}
.dc .opt label:hover{border-color:var(--accent)}
.dc .box{flex:none;width:22px;height:22px;margin-top:2px;border-radius:6px;border:2px solid var(--line);display:grid;place-items:center;color:var(--on-accent);font-size:15px;font-weight:700;line-height:1}
.dc .opt.one .box{border-radius:999px}
.dc .opt input:checked+label{border-color:var(--accent);background:var(--accent-tint)}
.dc .opt input:checked+label .box{background:var(--accent);border-color:var(--accent)}
.dc .opt input:checked+label .box::after{content:"\\2713"}
.dc .opt input:focus-visible+label{outline:2px solid var(--accent);outline-offset:2px}
.dc .sub{display:block;font-size:15px;line-height:1.4;color:var(--ink2)}
.dc .tally{margin:0;font-size:15px;color:var(--ink2);font-variant-numeric:tabular-nums}
.dc .tally.over{color:var(--warn);font-weight:600}
.dc .field{display:grid;gap:6px;width:100%;font-size:15px;color:var(--ink2)}
.dc textarea{width:100%;box-sizing:border-box;font-family:var(--sans);font-size:16px;line-height:1.5;color:var(--ink);background:var(--sunk);border:1px solid var(--line);border-radius:var(--rr);padding:10px 12px;min-height:44px;resize:vertical}
.dc textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.dc .tag{align-items:flex-start}
.dc .tag .num{margin-top:4px}
`;
