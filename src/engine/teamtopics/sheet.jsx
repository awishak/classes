// Five concepts from the Ishak chapters: COMM 118's reading sheet for
// Wednesday, October 28, at /comm118/worksheets/team-topics.
//
// Andrew wrote the first block himself on 2026-10-23 (the intro below is his
// text, kept as the default): read either chapter, choose five concepts, and
// for each note something you noticed, something you think, and something you
// wonder about. "The goal here is to be observant, opinionated, and most of
// all, curious." Due end of day Tuesday. Which chapter they read is not asked:
// "don't care which one they read."
//
// The look is the AFL Grand Final sheet's, because he asked for that one:
// "make this look better like it looked for the AFL worksheet." Outfit and
// IBM Plex Mono, the same day and night palettes, one white sheet with a head,
// progress pills, and the three boxes (Observations, Opinions, Questions) with
// "Start with: I notice…" under each. The sheet's stylesheet is not exported
// by the worksheets package, so the rules that matter are copied here.
//
// Answers are worksheet rows (worktopia/store.js), one field each, saved
// through saver.js so nothing typed is lost. Fields are letters with a part:
// topic:a, finding:a, opinion:a, wonder:a, through e. The field names are the
// October 22 ones, so nothing already written is lost.

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "../visualstory/saver.js";
import { useCopy, Words } from "../visualstory/pre.jsx";

export const TEAM_TOPICS_KEY = "team-topics";
export const TEAM_TOPICS_TITLE = "Five concepts from the Ishak chapters";
export const topicsHref = (classId) => "/" + classId + "/worksheets/" + TEAM_TOPICS_KEY;

export const SLOTS = ["a", "b", "c", "d", "e"];
export const REQUIRED_SLOTS = SLOTS;
export const PARTS = [
  { field: "finding", box: "Observations" },
  { field: "opinion", box: "Opinions" },
  { field: "wonder", box: "Questions" },
];
// The chapters' own section titles, for tapping. Typing is the other way in.
export const TOPICS = [
  "Teamwork and coaching", "Physical and mental coordination", "Knowledge sharing", "Clarity of roles", "Goal setting",
  "Motivation and motivational climate", "Social support", "Negative messaging", "Decision making", "Coaching and complexity",
  "Cohesion", "Culture", "Power", "Conflict and dissent", "Emotion", "Failure", "Nonverbal communication", "Time and time-outs",
  "Gender", "Lessons from sports teams for other teams",
];
const slotFields = (s) => ["topic:" + s, ...PARTS.map(p => p.field + ":" + s)];
export const FIELDS = SLOTS.flatMap(slotFields);
const blank = (answers, f) => !String((answers || {})[f] || "").trim();
export const missingOf = (answers) => FIELDS.filter(f => blank(answers, f));
export const doneOf = (answers, s) => slotFields(s).filter(f => !blank(answers, f)).length;

// The words students read, Andrew's to edit in place.
export const COPY_ROW = "worksheet-team-topics-plan";
export const DEFAULT_COPY = {
  title: TEAM_TOPICS_TITLE,
  credit: "COMM 118 · Due end of day Tuesday, October 27",
  intro: "Before class on Wednesday, October 28, please read some of the article and/or chapter I've written and posted for you here: Communication in Sports Teams: A Review (2017) or Communicating in Sports Teams (2021). The second one is based on the first one, so you'll see some overlap.\n\nThere are a number of concepts relating to team communication and culture. Peruse the different concepts and choose five that you are interested in. Read those sections. Then, please note three things for each chapter:\n\n1. Something you noticed (an interesting finding)\n2. Something you think (an opinion about that finding or another one)\n3. Something you wonder about (a question that you would want to explore on this concept.\n\nThe goal here is to be observant, opinionated, and most of all, curious. Please complete this by end of day on Tuesday.",
  conceptAsk: "Concept",
  conceptHint: "Name the concept, or tap one from the chapters.",
  "box.finding": "Observations",
  "desc.finding": "Something you noticed (an interesting finding)",
  "start.finding": "Start with: I notice…",
  "box.opinion": "Opinions",
  "desc.opinion": "Something you think (an opinion about that finding or another one)",
  "start.opinion": "Start with: I think…",
  "box.wonder": "Questions",
  "desc.wonder": "Something you wonder about (a question that you would want to explore on this concept)",
  "start.wonder": "Start with: I wonder…",
};

const STATUS = { loading: "Loading…", saved: "Saved", saving: "Saving…", retrying: "Not saved yet. Trying again.", "failed-load": "Could not load your sheet. Reload to try again." };
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
const loadFont = () => {
  if (typeof document === "undefined" || document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = FONT_HREF; document.head.appendChild(l);
};

export function TopicsSheet({ store, viewer, classId, readOnly = false, storage, editor = false, theme }) {
  const copy = useCopy(editor, COPY_ROW, DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const [handing, setHanding] = useState("");
  const saver = useRef(null);

  useEffect(() => { loadFont(); }, []);
  useEffect(() => {
    const draftKey = TEAM_TOPICS_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
    const s = createSaver({ store, draftKey, storage: readOnly ? null : (storage ?? (typeof localStorage !== "undefined" ? localStorage : null)), onStatus: setStatus });
    saver.current = s;
    let alive = true;
    s.load().then(got => { if (alive) { setAnswers(got.answers); setSubmitted(got.submitted_at); } })
      .catch(() => { if (alive) setStatus("failed-load"); });
    if (readOnly) return () => { alive = false; s.destroy(); };
    const flush = () => s.flush();
    const hidden = () => { if (document.visibilityState === "hidden") s.flush(); };
    const leaving = (e) => { if (Object.keys(s.pending()).length) { s.flush(); e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("beforeunload", leaving);
    return () => {
      alive = false;
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("beforeunload", leaving);
      s.flush(); s.destroy();
    };
  }, [store, viewer?.id, classId, readOnly, storage]);

  const set = (field, value) => {
    if (readOnly) return;
    setAnswers(a => ({ ...a, [field]: value }));
    saver.current.change(field, value);
  };

  const handIn = async () => {
    const left = missingOf(answers);
    if (left.length) { setHanding("missing"); return; }
    setHanding("sending");
    try {
      await saver.current.flush();
      if (Object.keys(saver.current.pending()).length) { setHanding("unsaved"); return; }
      const at = await store.submit();
      setSubmitted(at || new Date().toISOString());
      setHanding("");
    } catch { setHanding("failed"); }
  };

  const root = { className: "tt" + (readOnly ? " ro" : ""), "data-theme": theme || undefined };
  if (!answers) return <div {...root}><style>{CSS}</style><div className="sheet"><div className="foot"><span className="status">{STATUS[status] || "Loading…"}</span></div></div></div>;
  const left = missingOf(answers);
  const complete = SLOTS.filter(s => doneOf(answers, s) === 4).length;
  const say = submitted && !handing ? <>Submitted <b>{when(submitted)}</b>. You can keep editing until class.</>
    : handing === "missing" && left.length ? <span className="bad">Every box needs an answer first. {left.length === 1 ? "One is" : left.length + " are"} still empty.</span>
    : handing === "unsaved" ? <span className="bad">Your answers are not saved yet, so the submission did not go through. Try again in a moment.</span>
    : handing === "failed" ? <span className="bad">The submission did not go through. Check your connection and try again.</span>
    : <><b>{complete} of {SLOTS.length}</b> concepts complete</>;

  return (
    <div {...root}>
      <style>{CSS}</style>
      <div className="sheet">
        <div className="head">
          <div className="title">
            <Words k="title" copy={copy} editing={editing} as="h2" className="name" />
            <Words k="credit" copy={copy} editing={editing} as="div" className="credit" />
            {editor ? (
              <div className="editbar">
                <button type="button" className="btn small" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
                <span className="status" aria-live="polite">{editing ? copy.status || "Change any line students read. Clear a line to put the original back." : copy.status}</span>
              </div>
            ) : null}
            <Words k="intro" copy={copy} editing={editing} as="p" className="intro" />
          </div>
        </div>

        <div className="progress" aria-label="Your progress">
          {SLOTS.map((s, i) => {
            const n = doneOf(answers, s);
            return (
              <div key={s} className="p">
                <div className="l">Concept {i + 1}<span>{n} of 4</span></div>
                <div className="bar"><i style={{ width: (n / 4) * 100 + "%" }} /></div>
              </div>
            );
          })}
        </div>

        {SLOTS.map((s, i) => {
          const named = !blank(answers, "topic:" + s);
          return (
            <section key={s} className="concept" aria-label={"Concept " + (i + 1)}>
              <div className="chead">
                <span className="n">Concept {i + 1}</span>
                <span className="sub">{doneOf(answers, s)} of 4</span>
              </div>
              <label className="field">
                <Words k="conceptAsk" copy={copy} editing={editing} className="ask" />
                <div className="row">
                  <input className="focusable" id={"tt-topic-" + s} value={answers["topic:" + s] || ""} readOnly={readOnly} maxLength={200} placeholder={copy.say("conceptHint")} onChange={e => set("topic:" + s, e.target.value)} />
                </div>
              </label>
              {!readOnly && !named ? (
                <div className="chips" aria-label={"Concepts from the chapters, for concept " + (i + 1)}>
                  {TOPICS.map(t => <button key={t} type="button" className="chip focusable" onClick={() => set("topic:" + s, t)}>{t}</button>)}
                </div>
              ) : null}
              <div className="ntw">
                {PARTS.map(p => (
                  <div key={p.field} className="box">
                    <div className="bh">
                      <Words k={"box." + p.field} copy={copy} editing={editing} as="h2" />
                      <span className="sub">{blank(answers, p.field + ":" + s) ? "" : "✓"}</span>
                    </div>
                    <Words k={"desc." + p.field} copy={copy} editing={editing} as="p" className="desc" />
                    <textarea className="focusable" id={"tt-" + p.field + "-" + s} rows={3} value={answers[p.field + ":" + s] || ""} readOnly={readOnly} maxLength={4000}
                      aria-label={copy.say("box." + p.field) + ", concept " + (i + 1)} onChange={e => set(p.field + ":" + s, e.target.value)} />
                    <Words k={"start." + p.field} copy={copy} editing={editing} as="p" className="start" />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {!readOnly ? (
          <div className="foot">
            <div className="say" aria-live="polite">{say}</div>
            <span className={"status" + (status === "retrying" || status === "failed-load" ? " bad" : "")} aria-live="polite">{STATUS[status]}</span>
            <button type="button" className="btn primary focusable" disabled={handing === "sending"} onClick={handIn}>
              {handing === "sending" ? "Submitting…" : submitted ? "submit again" : "submit worksheet"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The worksheet registry's mount: React inside the plain-DOM contract. */
export function mountTeamTopics(root, { store, viewer, readOnly = false, classId, editor = false, theme } = {}) {
  const r = createRoot(root);
  r.render(<TopicsSheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} theme={theme} />);
  return { destroy() { r.unmount(); } };
}

// The AFL sheet's two palettes (worksheets/src/sheet.js LIGHT and DARK), day
// on .tt, night when the machine is dark and nobody asked for light, or when
// the page asked for dark.
const LIGHT = `--page:#fafaf9;--card:#ffffff;--sunk:#f6f4f1;--ink:#1c1917;--secondary:#57534e;--muted:#6b655f;--line-soft:#f0edea;--line-strong:#e3ded8;--line-ghost:#c9c2ba;--accent:#7c3aed;--accent-light:#f5f3ff;--on-accent:#ffffff;--ok:#0f766e;--bad:#b45309`;
const DARK = `color-scheme:dark;--page:#171310;--card:#1f1a16;--sunk:#26201b;--ink:#f6f2ec;--secondary:#cdc3b9;--muted:#a79c92;--line-soft:#2b2622;--line-strong:#3a332e;--line-ghost:#4a423b;--accent:#b794f6;--accent-light:#2a2038;--on-accent:#171310;--ok:#5ecfa8;--bad:#fbbf24`;
const CSS = `
.tt{${LIGHT};--font:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;--mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
@media (prefers-color-scheme: dark){.tt:not([data-theme="light"]){${DARK}}}
.tt[data-theme="dark"]{${DARK}}
.tt{box-sizing:border-box;color:var(--ink);font-family:var(--font);font-size:17px;line-height:1.45;background:var(--page);padding-inline:16px;padding-block:24px 64px}
.tt *{box-sizing:border-box}
.tt .sheet{max-width:1100px;margin:0 auto;border-radius:16px;overflow:hidden;background:var(--card);border:1px solid var(--line-soft);display:grid;gap:20px;padding-bottom:4px}
.tt .head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:24px 28px 0;flex-wrap:wrap}
.tt .title{display:grid;gap:6px;width:100%}
.tt .name{font-size:26px;font-weight:600;line-height:1.2;margin:0;letter-spacing:-.01em}
.tt .credit{font-family:var(--mono);font-size:13px;color:var(--muted)}
.tt .intro{margin:0;font-size:17px;line-height:1.5;color:var(--ink);padding-top:6px;max-width:72ch;white-space:pre-line}
.tt .editbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-top:6px}
.tt .progress{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:0 28px}
.tt .progress .p{background:var(--sunk);border-radius:16px;padding:12px 16px;display:grid;gap:8px}
.tt .progress .l{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:15px;font-weight:500;color:var(--ink)}
.tt .progress .l span{color:var(--secondary);font-weight:400}
.tt .progress .bar{height:6px;border-radius:999px;background:var(--line-soft);overflow:hidden}
.tt .progress .bar i{display:block;height:100%;width:0;background:var(--accent);transition:width .4s ease}
.tt .concept{display:grid;gap:14px;padding:20px 28px 24px;border-top:1px solid var(--line-soft)}
.tt .chead{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.tt .chead .n{font-family:var(--mono);font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.tt .sub{font-family:var(--mono);font-size:13px;color:var(--muted)}
.tt .field{display:grid;gap:8px}
.tt .ask{font-size:20px;font-weight:500;line-height:1.3;color:var(--ink)}
.tt .row{display:flex;gap:8px;align-items:center}
.tt .row input{font-family:var(--font);font-size:17px;min-height:48px;padding:0 14px;border:1px solid var(--line-strong);border-radius:10px;background:var(--card);color:var(--ink);outline:none;min-width:0;flex:1;max-width:560px}
.tt .row input::placeholder{color:var(--muted)}
.tt .chips{display:flex;flex-wrap:wrap;gap:6px}
.tt .chip{font:inherit;font-family:var(--font);display:inline-flex;align-items:center;font-size:15px;font-weight:500;color:var(--ink);background:var(--sunk);border:1px solid var(--line-soft);border-radius:999px;padding:6px 12px;min-height:36px;cursor:pointer}
.tt .chip:hover{border-color:var(--accent);color:var(--accent)}
.tt .ntw{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.tt .box{background:var(--sunk);border-radius:16px;padding:16px;display:grid;gap:10px;align-content:start}
.tt .box .bh{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.tt .box h2{margin:0;font-size:20px;font-weight:500}
.tt .box .bh .sub{color:var(--ok)}
.tt .box .desc{margin:0;font-size:15px;color:var(--secondary);line-height:1.4}
.tt .box textarea{width:100%;font-family:var(--font);font-size:16px;line-height:1.5;min-height:96px;padding:10px 12px;border:1px solid var(--line-strong);border-radius:10px;background:var(--card);color:var(--ink);outline:none;resize:vertical}
.tt .box .start{margin:0;font-size:15px;color:var(--muted);font-style:italic}
.tt .foot{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:8px 28px 24px;flex-wrap:wrap;min-height:76px;border-top:1px solid var(--line-soft)}
.tt .foot .say{font-size:17px;color:var(--secondary);flex:1;min-width:200px}
.tt .foot .say b{color:var(--ink);font-weight:600}
.tt .bad{color:var(--bad)}
.tt .status{font-family:var(--mono);font-size:13px;color:var(--muted);min-height:1.4em}
.tt .status.bad{color:var(--bad)}
.tt .btn{font-family:var(--font);font-size:15px;font-weight:600;min-height:44px;padding:0 20px;border-radius:10px;border:1px solid var(--line-strong);background:var(--card);color:var(--ink);cursor:pointer}
.tt .btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.tt .btn.small{min-height:36px;padding:0 14px;font-size:14px}
.tt .btn[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--card)}
.tt .btn[disabled]{opacity:.4;cursor:default}
.tt .focusable:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.tt.ro .chips,.tt.ro .foot{display:none}
.tt .vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.45;padding:4px 8px;margin:0;border:1.5px dashed var(--line-strong);border-radius:8px;background:var(--card);resize:none;overflow:hidden}
.tt .vsp-edit.name{font-size:26px;font-weight:600}
.tt .vsp-edit.intro{font-size:17px}
@media (max-width:860px){.tt .ntw{grid-template-columns:1fr}.tt .progress{grid-template-columns:repeat(2,1fr)}.tt .head,.tt .concept,.tt .foot{padding-inline:18px}.tt .progress{padding-inline:18px}}
@media (prefers-reduced-motion: reduce){.tt *{transition:none!important}}
`;
