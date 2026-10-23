// Topics from the Ishak chapter: COMM 118's reading sheet for Wednesday,
// October 28, at /comm118/worksheets/team-topics.
//
// Andrew, 2026-10-23, from out of town: "they're going to choose, I think we
// said 4 topics, maybe five, that they're going to do 3 things for ... an
// observation ... I notice ... their opinion ... I think ... a curious
// question, which is, I wonder. So this is similar to the way we did the AFL
// worksheet at the very start of the year." So four topics are required and
// a fifth card is there if they want one; the three boxes are I notice, I
// think and I wonder. The stored field names (finding, opinion, wonder) stay,
// so nothing written on October 22 is lost.
//
// Andrew, 2026-10-22: "I want them to read Ishak 2017 or Ishak 2021 for this
// coming wednesday. asking them to peruse the different topics, and come to
// class ready to discuss five of them with: a finding they thought was
// interesting, an opinion they have, and a wonder. Those three things like we
// did for AFL assignment." So: which chapter they read, then five topic cards,
// each with the topic and the three boxes. A topic is typed, or tapped from
// the chapters' own section titles.
//
// The same bones as the visual story's pre-production sheet: answers are
// worksheet rows (worktopia/store.js), one field each, saved through saver.js
// so nothing typed is lost; the words students read are editable by Andrew in
// place (useCopy). Fields are letters with a part: topic:a, finding:a,
// opinion:a, wonder:a, through e, plus chapter.

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "../visualstory/saver.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import * as TOKENS from "../tokens.js";

export const TEAM_TOPICS_KEY = "team-topics";
export const TEAM_TOPICS_TITLE = "Topics from the Ishak chapter";
export const topicsHref = (classId) => "/" + classId + "/worksheets/" + TEAM_TOPICS_KEY;

export const SLOTS = ["a", "b", "c", "d", "e"];
export const REQUIRED_SLOTS = ["a", "b", "c", "d"];   // the fifth is theirs to add
export const PARTS = [
  { field: "finding", rows: 3 },
  { field: "opinion", rows: 2 },
  { field: "wonder", rows: 2 },
];
export const CHAPTERS = [
  { id: "2017", name: "Ishak (2017), Communication in Sports Teams: A Review" },
  { id: "2021", name: "Ishak (2021), Communicating in Sports Teams" },
  { id: "both", name: "Both" },
];
// The chapters' own section titles, for tapping. Typing is the other way in.
export const TOPICS = [
  "Teamwork and coaching", "Physical and mental coordination", "Knowledge sharing", "Clarity of roles", "Goal setting",
  "Motivation and motivational climate", "Social support", "Negative messaging", "Decision making", "Coaching and complexity",
  "Cohesion", "Culture", "Power", "Conflict and dissent", "Emotion", "Failure", "Nonverbal communication", "Time and time-outs",
  "Gender", "Lessons from sports teams for other teams",
];
export const FIELDS = ["chapter", ...SLOTS.flatMap(s => ["topic:" + s, ...PARTS.map(p => p.field + ":" + s)])];
const slotFields = (s) => ["topic:" + s, ...PARTS.map(p => p.field + ":" + s)];
const blank = (answers, f) => !String((answers || {})[f] || "").trim();
// What still needs an answer: the chapter and the first four topics in full,
// and a fifth topic in full only once something is written on the fifth card.
export const missingOf = (answers) => {
  const need = ["chapter", ...REQUIRED_SLOTS.flatMap(slotFields)];
  SLOTS.filter(s => !REQUIRED_SLOTS.includes(s)).forEach(s => { if (slotFields(s).some(f => !blank(answers, f))) need.push(...slotFields(s)); });
  return need.filter(f => blank(answers, f));
};

// The words students read, Andrew's to edit in place. The defaults are his
// sentences from October 22 with the joins written in.
export const COPY_ROW = "worksheet-team-topics-plan";
export const DEFAULT_COPY = {
  intro: "Before class on Wednesday, October 28, read one of the two Ishak chapters: Communication in Sports Teams: A Review (2017) or Communicating in Sports Teams (2021). You can read both if you want. Read through the different topics and choose four you want to discuss; add a fifth if you like. For each topic, write three things, the same way we did the AFL worksheet at the start of the quarter: something you notice (an observation), something you think (your opinion), and something you wonder (a curious question). Come to class ready to discuss them. Your answers save as you type. When you have all four, press Submit.",
  chapterAsk: "Which chapter did you read?",
  topicAsk: "Topic",
  topicHint: "Tap a topic from the chapters, or type your own.",
  "part.finding": "I notice: something you observed in the reading",
  "part.opinion": "I think: your opinion on the topic",
  "part.wonder": "I wonder: a question you're curious about",
  fifth: "A fifth topic, if you want a fifth",
  ...Object.fromEntries(CHAPTERS.map(c => ["chapter." + c.id, c.name])),
};

const STATUS = { loading: "Loading", saved: "Saved", saving: "Saving", retrying: "Not saved, trying again", "failed-load": "Could not load your answers. Reload the page." };
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function TopicsSheet({ store, viewer, classId, readOnly = false, storage, editor = false }) {
  const copy = useCopy(editor, COPY_ROW, DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const [handing, setHanding] = useState("");
  const saver = useRef(null);

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

  if (!answers) return <div className="tt"><style>{CSS}</style><p className="tt-p">{STATUS[status] || "Loading"}</p></div>;
  const left = missingOf(answers);

  return (
    <div className="tt">
      <style>{CSS}</style>
      <div className="tt-in">
        <div className="tt-top">
          <h1 className="tt-title">{TEAM_TOPICS_TITLE}</h1>
          {!readOnly ? <span className={"tt-status" + (status === "retrying" ? " tt-warn" : "")} aria-live="polite">{STATUS[status]}</span> : null}
        </div>
        {editor ? (
          <div className="tt-editbar">
            <button type="button" className="tt-editbtn" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
            <span className="tt-muted" aria-live="polite">{editing ? copy.status || "Change any line students read. Clear a line to put the original back." : copy.status}</span>
          </div>
        ) : null}
        <Words k="intro" copy={copy} editing={editing} as="p" className="tt-p" />

        <fieldset className="tt-q">
          <legend className="tt-ask"><Words k="chapterAsk" copy={copy} editing={editing} /></legend>
          <div className="tt-chapters">
            {CHAPTERS.map(c => {
              const on = answers.chapter === c.id;
              if (editing) return <div key={c.id} className="tt-chapter"><Words k={"chapter." + c.id} copy={copy} editing /></div>;
              return (
                <button key={c.id} type="button" className={"tt-chapter" + (on ? " tt-on" : "")} aria-pressed={on} disabled={readOnly}
                  onClick={() => set("chapter", on ? "" : c.id)}>{copy.say("chapter." + c.id)}</button>
              );
            })}
          </div>
        </fieldset>

        {SLOTS.map((s, i) => (
          <section key={s} className="tt-card" aria-label={"Topic " + (i + 1)}>
            <div className="tt-card-head"><span className="tt-n">{i + 1}</span>{REQUIRED_SLOTS.includes(s) ? <span className="tt-card-title">{"Topic " + (i + 1) + " of " + REQUIRED_SLOTS.length}</span> : <Words k="fifth" copy={copy} editing={editing} className="tt-card-title" />}</div>
            <label className="tt-q">
              <Words k="topicAsk" copy={copy} editing={editing} className="tt-ask" />
              <input className="tt-box" id={"tt-topic-" + s} value={answers["topic:" + s] || ""} readOnly={readOnly} maxLength={200} onChange={e => set("topic:" + s, e.target.value)} />
            </label>
            {!readOnly ? (
              <div className="tt-chips" aria-label={"Topics from the chapters for topic " + (i + 1)}>
                <Words k="topicHint" copy={copy} editing={editing} className="tt-hint" />
                <div className="tt-chiprow">
                  {TOPICS.map(t => {
                    const on = (answers["topic:" + s] || "").trim().toLowerCase() === t.toLowerCase();
                    return <button key={t} type="button" className={"tt-chip" + (on ? " tt-on" : "")} aria-pressed={on} onClick={() => set("topic:" + s, on ? "" : t)}>{t}</button>;
                  })}
                </div>
              </div>
            ) : null}
            {PARTS.map(p => (
              <label key={p.field} className="tt-q">
                <Words k={"part." + p.field} copy={copy} editing={editing} className="tt-ask" />
                <textarea className="tt-box" id={"tt-" + p.field + "-" + s} rows={p.rows} value={answers[p.field + ":" + s] || ""} readOnly={readOnly} maxLength={4000} onChange={e => set(p.field + ":" + s, e.target.value)} />
              </label>
            ))}
          </section>
        ))}

        {!readOnly ? (
          <div className="tt-hand">
            <button type="button" className="tt-go" disabled={handing === "sending"} onClick={handIn}>
              {handing === "sending" ? "Submitting" : submitted ? "Submit again" : "Submit"}
            </button>
            {handing === "missing" && left.length ? <span className="tt-warn">Every box on the first four topics needs an answer first. {left.length === 1 ? "One is" : left.length + " are"} still empty.</span> : null}
            {handing === "unsaved" ? <span className="tt-warn">Your answers are not saved yet, so the submission did not go through. Try again in a moment.</span> : null}
            {handing === "failed" ? <span className="tt-warn">The submission did not go through. Check your connection and try again.</span> : null}
            {submitted && !handing ? <span className="tt-muted">Submitted {when(submitted)}. You can keep editing until class.</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The worksheet registry's mount: React inside the plain-DOM contract. */
export function mountTeamTopics(root, { store, viewer, readOnly = false, classId, editor = false } = {}) {
  const r = createRoot(root);
  r.render(<TopicsSheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} />);
  return { destroy() { r.unmount(); } };
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;
const CSS = `
.tt{padding:20px 16px 80px;color:${T.primary}}
.tt-in{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.tt-top{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.tt-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.tt-status{margin-left:auto;font-size:13px;color:${T.muted};border:1px solid ${L.soft};border-radius:999px;padding:3px 11px}
.tt-p{margin:0;font-size:16.5px;line-height:1.6;color:${T.secondary};white-space:pre-line}
.tt-q{display:flex;flex-direction:column;gap:8px;border:0;margin:0;padding:0;min-width:0}
.tt-ask{font-size:16px;font-weight:600;line-height:1.45;padding:0}
.tt-hint{font-size:14px;color:${T.muted}}
.tt-box{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.5;padding:10px 12px;border:1px solid ${L.strong};border-radius:10px;background:${S.card};color:${T.primary};resize:vertical}
.tt-box:focus-visible,.tt-chapter:focus-visible,.tt-chip:focus-visible,.tt-go:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.tt-chapters{display:flex;flex-direction:column;gap:8px}
.tt-chapter{text-align:left;font:inherit;font-size:16px;padding:12px 14px;border:1px solid ${L.strong};border-radius:12px;background:${S.card};color:${T.primary};cursor:pointer;min-height:44px}
.tt-chapter:disabled{cursor:default}
.tt-on{border-color:${T.primary};box-shadow:inset 0 0 0 1.5px ${T.primary}}
.tt-card{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:16px;background:${S.sunk};border:1px solid ${L.soft}}
.tt-card-head{display:flex;align-items:center;gap:10px}
.tt-n{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:${T.primary};color:${S.page};font-weight:700;font-size:15px}
.tt-card-title{font-size:16px;font-weight:600;color:${T.secondary}}
.tt-chips{display:flex;flex-direction:column;gap:6px}
.tt-chiprow{display:flex;flex-wrap:wrap;gap:6px}
.tt-chip{font:inherit;font-size:14px;line-height:1.2;padding:8px 12px;min-height:36px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer}
.tt-chip.tt-on{background:${T.primary};color:${S.page};border-color:${T.primary};box-shadow:none}
.tt-hand{display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:8px}
.tt-go{font:inherit;font-size:16px;font-weight:600;padding:11px 22px;border-radius:999px;border:0;background:${T.primary};color:${S.page};cursor:pointer;min-height:44px}
.tt-go:disabled{opacity:.6;cursor:default}
.tt-warn{color:${TOKENS.STATE.late};font-size:15px}
.tt-muted{color:${T.muted};font-size:15px}
.tt-editbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.tt-editbtn{font:inherit;font-size:14px;font-weight:600;padding:6px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.tt-editbtn[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.tt .vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.5;padding:4px 8px;margin:0;border:1.5px dashed ${L.strong};border-radius:8px;background:${S.card};resize:none;overflow:hidden}
.tt .vsp-edit.tt-p{font-size:16.5px;color:${T.secondary}}
.tt .vsp-edit.tt-ask{font-size:16px;font-weight:600}
`;
