// The audio story pre-production: COMM 3's sheet at /comm3/worksheets/audio-pre,
// due Wednesday, November 11, at 11:59 PM.
//
// Andrew, 2026-11-06: "present students with their topic and previous ideas,
// ask a few new questions, get a 5-min audio clip, ask for a few sources, and
// ask them what they think about their work, and what they have to do going
// forward. I think a lot of this stuff can be pre-filled to be edited as
// well. Make this pretty." Then by voice: keep what they included on the
// exercise and let them edit it; seven questions, "choose 3 of these
// questions and answer them as part of your audio story pre-production"; the
// clip "is your first attempt at the story"; show the sources they already
// have, then "what sources would you like to add or edit?"; a checklist they
// can edit; open to COMM 3 the moment it is built.
//
// The shape is the audio story builder's: the sheet on the left and, on the
// right, the pre-production document, live, the way Dr. Ishak reads it on
// the review. Every answer is a worksheet row (bits.jsx useSheet). The first
// time the sheet opens, the story line, the treatment, what the story
// includes and the four sources come across from the student's audio
// exercise sheet, read under the rules, into this sheet's own fields, and the
// checklist is laid in; the field prefilled says it happened, so nothing is
// copied twice and nothing typed is ever overwritten. The ideas and his marks
// are read live off the ideas sheet and only shown.

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { gameClient } from "../gameClient.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { supabaseStore } from "../worktopia/store.js";
import { CSS, STATUS, when, blank, linesOf, useSheet, handIn, handSay, Lines, Line, Para } from "./bits.jsx";
import { AUDIO_IDEAS_KEY, Mark, ideasHref } from "./ideas.jsx";
import { AUDIO_RESEARCH_KEY, RESEARCH, markedIdeas, researchHref, AudioBox } from "./research.jsx";
import { audioOf, linkFor, FORMAT_SAY } from "./audio.js";
import { MAX_STORY_SECONDS, clock } from "./storymodel.js";
import { pairsFor } from "./all.jsx";
import { pairOf } from "./pairs.js";
import * as TOKENS from "../tokens.js";

export const AUDIO_PRE_KEY = "audio-pre";
export const AUDIO_PRE_TITLE = "Audio story pre-production";
export const preHref = (classId) => "/" + classId + "/worksheets/" + AUDIO_PRE_KEY;

// His seven questions, 2026-11-06, by voice. A student answers three.
export const QUESTIONS = [
  ["start", "How are you planning to start your story? What will make it have an impactful opening?"],
  ["away", "What's the one thing you want your listener to walk away with?"],
  ["right", "Why are you the right person to tell this story?"],
  ["new", "What's the new piece of information in here that no other story will have?"],
  ["you", "How are you putting “you” into this work?"],
  ["who", "Who are you interviewing, and when, and why?"],
  ["after", "What questions do you think a listener might have after listening to your story?"],
];
export const PICK = 3;
// The checklist laid into Going forward, theirs to edit. His to change here or in place.
export const CHECKLIST = [
  "Record every interview",
  "Capture sound at your place",
  "Pull your music and sound effects, and note where each came from",
  "Edit a full cut, under five minutes",
  "Write your headline and your listen line",
  "Listen back with someone and fix what they caught",
];

export const FIELDS = ["story", "treatment", "includes", "asked", ...QUESTIONS.map(q => "q:" + q[0]), "audio", "sources", "reflect", "todo", "prefilled"];
/** The question ids the student chose, in order, at most PICK. */
export const askedOf = (answers) => linesOf(answers?.asked).filter(id => QUESTIONS.some(q => q[0] === id)).slice(0, PICK);
/** The checklist, [{ text, done }], from its field. */
export const todoOf = (value) => {
  try { const v = JSON.parse(value || "[]"); return Array.isArray(v) ? v.filter(x => x && typeof x.text === "string").map(x => ({ text: x.text, done: !!x.done })) : []; } catch { return []; }
};
/** The sources on the exercise sheet, [{ ask, lines }], only the filled ones. */
export const exerciseSourcesOf = (ex) => RESEARCH.map(r => ({ field: r.field, ask: r.ask, lines: linesOf(ex?.[r.field]) })).filter(r => r.lines.length);
/** What still has to be there before Submit. */
export const missingOf = (answers) => {
  const a = answers || {};
  const out = [];
  ["story", "treatment", "includes"].forEach(f => { if (blank(a, f)) out.push(f); });
  // Three answered questions count as three parts: an unchosen slot is a
  // part still to fill, the same as a chosen question left blank.
  const asked = askedOf(a);
  for (let i = asked.length; i < PICK; i++) out.push("asked");
  asked.forEach(id => { if (blank(a, "q:" + id)) out.push("q:" + id); });
  if (!audioOf(a.audio)) out.push("audio");
  if (blank(a, "sources")) out.push("sources");
  if (blank(a, "reflect")) out.push("reflect");
  if (!todoOf(a.todo).some(t => t.text.trim())) out.push("todo");
  return out;
};
export const PARTS_TO_FILL = 7 + PICK;
export const progressOf = (answers) => Math.max(0, Math.min(1, 1 - missingOf(answers).length / PARTS_TO_FILL));

export const COPY_ROW = "worksheet-audio-pre-plan";
// His words, 2026-11-06, for every line a student reads; each editable in place.
export const DEFAULT_COPY = {
  title: AUDIO_PRE_TITLE,
  credit: "COMM 3. Due Wednesday, November 11, at 11:59 PM.",
  intro: "",
  soFarHead: "Your story so far",
  soFarSay: "This is what you included on your audio exercise. Edit any line you want.",
  ideasGo: "Go look at your audio story ideas",
  exerciseGo: "Go look at your audio exercise",
  storyAsk: "Your story",
  treatmentAsk: "A paragraph treatment",
  includesAsk: "What does the story actually include?",
  questionsHead: "New questions",
  questionsSay: "Choose 3 of these questions and answer them as part of your audio story pre-production.",
  ...Object.fromEntries(QUESTIONS.map(([id, say]) => ["q." + id, say])),
  audioHead: "Your five-minute clip",
  audioSay: "This is your first attempt at the story. There should be efforts to edit, include music, sound effects, and more. The expectation is that this story is a version of your final story, but your final version will be better.",
  audioHint: FORMAT_SAY + ". Up to five minutes.",
  sourcesHead: "Sources",
  sourcesHave: "The sources you already have",
  sourcesAsk: "What sources would you like to add or edit?",
  reflectHead: "Your work",
  reflectAsk: "What do you think about your work so far?",
  forwardHead: "Going forward",
  forwardAsk: "What do you have to do going forward?",
  forwardSay: "Here is a checklist. Edit it so it is yours.",
  docKicker: "Audio story pre-production",
  submit: "submit",
  again: "submit again",
};

const lower = (s) => String(s || "").trim().toLowerCase();

// ─── the document: the live preview now, the review later ───

/** The pre-production as a page. url is the clip's signed link, when there is one. */
export function PreView({ answers, url = "", by = "", copy = null }) {
  const a = answers || {};
  const say = (k) => (copy ? copy.say(k) : DEFAULT_COPY[k]);
  const asked = askedOf(a).filter(id => !blank(a, "q:" + id));
  const clip = audioOf(a.audio);
  const includes = linesOf(a.includes);
  const sources = linesOf(a.sources);
  const todo = todoOf(a.todo).filter(t => t.text.trim());
  const qSay = (id) => say("q." + id);
  return (
    <article className="aspd">
      <header className="aspd-head">
        <span className="aspd-kicker">{say("docKicker")}{clip ? " · " + clock(clip.seconds) : ""}</span>
        {String(a.story || "").trim() ? <h1 className="aspd-h">{a.story}</h1> : null}
        {by ? <p className="aspd-by">{by}</p> : null}
      </header>
      {String(a.treatment || "").trim() ? <p className="aspd-treat">{a.treatment}</p> : null}
      {includes.length ? <section className="aspd-sec"><h2 className="aspd-h2">{say("includesAsk")}</h2><ul className="aspd-list">{includes.map((l, i) => <li key={i}>{l}</li>)}</ul></section> : null}
      {asked.length ? (
        <section className="aspd-sec aspd-qa">
          {asked.map(id => <div key={id} className="aspd-q"><h2 className="aspd-h2">{qSay(id)}</h2><p className="aspd-a">{a["q:" + id]}</p></div>)}
        </section>
      ) : null}
      {clip ? (
        <section className="aspd-sec">
          <h2 className="aspd-h2">{say("audioHead")}</h2>
          {url ? <audio className="aspd-player" controls preload="metadata" src={url} /> : <div className="aspd-wait">{clip.name}</div>}
        </section>
      ) : null}
      {sources.length ? <section className="aspd-sec"><h2 className="aspd-h2">{say("sourcesHead")}</h2><ul className="aspd-list">{sources.map((l, i) => <li key={i}>{l}</li>)}</ul></section> : null}
      {String(a.reflect || "").trim() ? <section className="aspd-sec"><h2 className="aspd-h2">{say("reflectAsk")}</h2><p className="aspd-a">{a.reflect}</p></section> : null}
      {todo.length ? (
        <section className="aspd-sec">
          <h2 className="aspd-h2">{say("forwardHead")}</h2>
          <ul className="aspd-check">{todo.map((t, i) => <li key={i} className={t.done ? "done" : ""}><span className="aspd-box" aria-hidden="true">{t.done ? "✓" : ""}</span><span>{t.text}</span></li>)}</ul>
        </section>
      ) : null}
    </article>
  );
}

// ─── the pieces of the sheet ───

// The checklist: a box, the words, and a × on each row; a row to add the next.
function Checklist({ value, readOnly, onChange, label }) {
  const items = todoOf(value);
  const [draft, setDraft] = useState("");
  const write = (next) => onChange(JSON.stringify(next));
  const add = () => { const t = draft.trim(); if (!t) return; write([...items, { text: t, done: false }]); setDraft(""); };
  return (
    <div className="asp-check" role="group" aria-label={label}>
      {items.map((t, i) => (
        <div key={i} className={"asp-check-row" + (t.done ? " done" : "")}>
          <input type="checkbox" className="asp-check-box focusable" checked={t.done} disabled={readOnly} aria-label={"Done: " + t.text} onChange={e => write(items.map((x, k) => k === i ? { ...x, done: e.target.checked } : x))} />
          {readOnly ? <span className="asp-check-text">{t.text}</span>
            : <input className="asp-check-text focusable" value={t.text} maxLength={300} aria-label={"Step " + (i + 1)} onChange={e => write(items.map((x, k) => k === i ? { ...x, text: e.target.value } : x))} />}
          {readOnly ? null : <button type="button" className="chip-x focusable" aria-label={"Remove: " + t.text} onClick={() => write(items.filter((_, k) => k !== i))}>×</button>}
        </div>
      ))}
      {readOnly ? null : (
        <div className="row">
          <input className="focusable" value={draft} maxLength={300} aria-label="Add a step" onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} onBlur={() => { if (draft.trim()) add(); }} />
          <button type="button" className="save focusable" aria-label="Add" onClick={add}>+</button>
        </div>
      )}
    </div>
  );
}

// ─── the student's sheet ───

export function PreSheet({ store, viewer, classId, readOnly = false, storage, editor = false, theme }) {
  const copy = useCopy(editor, COPY_ROW, DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [handing, setHanding] = useState("");
  const [ideas, setIdeas] = useState(null);     // [{ slot, idea, mark }] off the ideas sheet
  const [ex, setEx] = useState(null);           // the exercise sheet's answers
  const [pair, setPair] = useState(null);
  const [url, setUrl] = useState("");
  const draftKey = AUDIO_PRE_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
  const { answers, set, submitted, setSubmitted, status, saver } = useSheet({ store, draftKey, readOnly, storage });

  useEffect(() => {
    if (readOnly || !classId || !viewer?.id) return undefined;
    let alive = true;
    markedIdeas({ classId, viewerId: viewer.id }).then(got => { if (alive) setIdeas(got.ideas); }).catch(() => { if (alive) setIdeas([]); });
    const exStore = supabaseStore({ supabase: gameClient, worksheetKey: AUDIO_RESEARCH_KEY, groupKey: classId, viewerId: viewer.id });
    exStore.load().then(got => { if (alive) setEx(got?.answers || {}); }).catch(() => { if (alive) setEx({}); });
    pairsFor(classId).then(list => { if (alive) setPair(pairOf(list)[lower(viewer.id)] || null); }).catch(() => {});
    return () => { alive = false; };
  }, [readOnly, classId, viewer?.id]);

  // The one-time copy across from the exercise, and the checklist laid in.
  useEffect(() => {
    if (readOnly || !answers || !ex || answers.prefilled === "1") return;
    const fill = (f, v) => { if (blank(answers, f) && String(v || "").trim()) set(f, String(v)); };
    fill("story", ex.story);
    fill("treatment", ex.treatment);
    fill("includes", ex.includes);
    fill("sources", exerciseSourcesOf(ex).flatMap(r => r.lines).join("\n"));
    if (!todoOf(answers.todo).length) set("todo", JSON.stringify(CHECKLIST.map(text => ({ text, done: false }))));
    set("prefilled", "1");
  }, [readOnly, answers === null, ex]);   // eslint-disable-line react-hooks/exhaustive-deps

  const clip = audioOf(answers?.audio);
  useEffect(() => {
    if (!clip?.path) { setUrl(""); return undefined; }
    let alive = true;
    linkFor(clip.path).then(u => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [clip?.path]);

  const root = { className: "as asp" + (readOnly ? " ro" : ""), "data-theme": theme || undefined };
  if (!answers) return <div {...root}><style>{CSS + PRE_CSS}</style><div className="sheet"><div className="foot"><span className="status">{STATUS[status] || "Loading…"}</span></div></div></div>;
  if (readOnly) return <div {...root}><style>{CSS + PRE_CSS}</style><div className="asp-solo"><PreView answers={answers} url={url} by={viewer?.name || ""} copy={copy} /></div></div>;

  const left = missingOf(answers);
  const asked = askedOf(answers);
  const toggle = (id) => {
    if (asked.includes(id)) set("asked", asked.filter(x => x !== id).join("\n"));
    else if (asked.length < PICK) set("asked", [...asked, id].join("\n"));
  };
  const picked = String(ex?.picked || "").trim();
  const haveSources = exerciseSourcesOf(ex);
  const say = handSay(handing, left) || (submitted ? <>Submitted <b>{when(submitted)}</b>.</> : <><b>{PARTS_TO_FILL - left.length} of {PARTS_TO_FILL}</b> answered</>);
  const tick = (ok) => <span className="sub">{ok ? "✓" : ""}</span>;
  const me = lower(viewer?.id);
  const others = pair ? (pair.names || []).filter((n, i) => pair.members[i] !== me) : [];
  // The bar across the top: one pill a part, ticked as the part is done, a
  // tap scrolls there. Andrew, 2026-11-06: "give them like a checklist at the
  // top as they go through each part. sticky menu bar."
  const answered = asked.filter(id => !blank(answers, "q:" + id)).length;
  const parts = [
    { id: "sofar", say: copy.say("soFarHead"), ok: !blank(answers, "story") && !blank(answers, "treatment") && !blank(answers, "includes") },
    { id: "questions", say: copy.say("questionsHead"), ok: answered === PICK, n: answered + " of " + PICK },
    { id: "audio", say: copy.say("audioHead"), ok: !!clip },
    { id: "sources", say: copy.say("sourcesHead"), ok: !blank(answers, "sources") },
    { id: "reflect", say: copy.say("reflectHead"), ok: !blank(answers, "reflect") },
    { id: "forward", say: copy.say("forwardHead"), ok: todoOf(answers.todo).some(t => t.text.trim()) },
  ];
  const go = (id) => { const el = document.getElementById("asp-" + id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const bar = (
    <nav className="asp-bar" aria-label="Parts">
      {parts.map(p => (
        <button key={p.id} type="button" className={"asp-bar-item focusable" + (p.ok ? " on" : "")} onClick={() => go(p.id)}>
          <span className="asp-bar-box" aria-hidden="true">{p.ok ? "\u2713" : ""}</span>
          <span>{p.say}{p.n ? <b className="asp-bar-n">{p.n}</b> : null}</span>
        </button>
      ))}
      <span className="asp-bar-count"><b>{PARTS_TO_FILL - left.length} of {PARTS_TO_FILL}</b> answered</span>
    </nav>
  );

  return (
    <div {...root}>
      <style>{CSS + PRE_CSS}</style>
      {bar}
      <div className="asp-work">
        <div className="sheet asp-build">
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

          <section className="part" id="asp-sofar" aria-label={copy.say("soFarHead")}>
            <div className="phead"><Words k="soFarHead" copy={copy} editing={editing} className="n" />{tick(!blank(answers, "story") && !blank(answers, "treatment") && !blank(answers, "includes"))}</div>
            {ideas && ideas.length ? (
              <div className="ideas asp-ideas" role="group" aria-label="Your ideas">
                {ideas.map((x, i) => (
                  <div key={x.slot} className={"box pickbox" + (x.slot === picked ? " on" : "")} aria-label={"Idea " + (i + 1)}>
                    <div className="bh"><h2>{"Idea " + (i + 1)}</h2>{x.mark ? <Mark id={x.mark} /> : null}</div>
                    <p className="pickidea">{x.idea}</p>
                    {x.slot === picked ? <span className="asp-picked">chosen ✓</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
            {pair ? <p className="pair">{others.length ? <>You are working with <b>{others.join(" and ")}</b></> : <>You are working on your own</>}{pair.story ? <> on <b>{pair.story}</b></> : null}.</p> : null}
            <Words k="soFarSay" copy={copy} editing={editing} as="p" className="hint" />
            <label className="field">
              <Words k="storyAsk" copy={copy} editing={editing} className="ask" />
              <Line id="ap-story" label={copy.say("storyAsk")} value={answers.story} readOnly={readOnly} onChange={v => set("story", v)} />
            </label>
            <label className="field">
              <Words k="treatmentAsk" copy={copy} editing={editing} className="ask" />
              <Para id="ap-treatment" label={copy.say("treatmentAsk")} value={answers.treatment} readOnly={readOnly} rows={5} onChange={v => set("treatment", v)} />
            </label>
            <div className="field">
              <Words k="includesAsk" copy={copy} editing={editing} className="ask" />
              <Lines id="ap-includes" label={copy.say("includesAsk")} value={answers.includes || ""} readOnly={readOnly} onChange={v => set("includes", v)} />
            </div>
            <div className="asp-doors">
              {classId ? <a className="btn small focusable goideas" href={ideasHref(classId)}>{copy.say("ideasGo")}</a> : null}
              {classId ? <a className="btn small focusable goideas" href={researchHref(classId)}>{copy.say("exerciseGo")}</a> : null}
            </div>
          </section>

          <section className="part" id="asp-questions" aria-label={copy.say("questionsHead")}>
            <div className="phead"><Words k="questionsHead" copy={copy} editing={editing} className="n" /><span className="sub">{asked.filter(id => !blank(answers, "q:" + id)).length} of {PICK}</span></div>
            <Words k="questionsSay" copy={copy} editing={editing} as="p" className="pickhead" />
            <div className="asp-qs" role="group" aria-label={copy.say("questionsHead")}>
              {QUESTIONS.map(([id]) => {
                const on = asked.includes(id);
                const full = !on && asked.length >= PICK;
                return (
                  <div key={id} className={"asp-q" + (on ? " on" : "") + (full ? " full" : "")}>
                    <button type="button" className="asp-q-pick focusable" aria-pressed={on} disabled={full} onClick={() => toggle(id)}>
                      <span className="asp-q-box" aria-hidden="true">{on ? "✓" : ""}</span>
                      <Words k={"q." + id} copy={copy} editing={editing} className="asp-q-say" />
                    </button>
                    {on ? <Para id={"ap-q-" + id} label={copy.say("q." + id)} value={answers["q:" + id]} readOnly={readOnly} rows={4} onChange={v => set("q:" + id, v)} /> : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="part" id="asp-audio" aria-label={copy.say("audioHead")}>
            <div className="phead"><Words k="audioHead" copy={copy} editing={editing} className="n" />{tick(!!clip)}</div>
            <div className="field">
              <Words k="audioSay" copy={copy} editing={editing} as="p" className="hint" />
              <Words k="audioHint" copy={copy} editing={editing} as="p" className="sub" />
              <AudioBox value={answers.audio} readOnly={readOnly} classId={classId} viewerId={viewer?.id} maxSeconds={MAX_STORY_SECONDS} url={url} onChange={v => set("audio", v)} />
            </div>
          </section>

          <section className="part" id="asp-sources" aria-label={copy.say("sourcesHead")}>
            <div className="phead"><Words k="sourcesHead" copy={copy} editing={editing} className="n" />{tick(!blank(answers, "sources"))}</div>
            {haveSources.length ? (
              <div className="asp-have">
                <Words k="sourcesHave" copy={copy} editing={editing} as="p" className="asp-have-h" />
                {haveSources.map(r => <div key={r.field} className="asp-have-row"><span className="asp-have-ask">{r.ask}</span><span className="asp-have-lines">{r.lines.join(" · ")}</span></div>)}
              </div>
            ) : null}
            <div className="field">
              <Words k="sourcesAsk" copy={copy} editing={editing} className="ask" />
              <Lines id="ap-sources" label={copy.say("sourcesAsk")} value={answers.sources || ""} readOnly={readOnly} onChange={v => set("sources", v)} />
            </div>
          </section>

          <section className="part" id="asp-reflect" aria-label={copy.say("reflectHead")}>
            <div className="phead"><Words k="reflectHead" copy={copy} editing={editing} className="n" />{tick(!blank(answers, "reflect"))}</div>
            <label className="field">
              <Words k="reflectAsk" copy={copy} editing={editing} className="ask" />
              <Para id="ap-reflect" label={copy.say("reflectAsk")} value={answers.reflect} readOnly={readOnly} rows={5} onChange={v => set("reflect", v)} />
            </label>
          </section>

          <section className="part" id="asp-forward" aria-label={copy.say("forwardHead")}>
            <div className="phead"><Words k="forwardHead" copy={copy} editing={editing} className="n" />{tick(todoOf(answers.todo).some(t => t.text.trim()))}</div>
            <div className="field">
              <Words k="forwardAsk" copy={copy} editing={editing} className="ask" />
              <Words k="forwardSay" copy={copy} editing={editing} as="p" className="hint" />
              <Checklist value={answers.todo} readOnly={readOnly} label={copy.say("forwardAsk")} onChange={v => set("todo", v)} />
            </div>
          </section>

          <div className="foot">
            <div className="say" aria-live="polite">{say}</div>
            <span className={"status" + (status === "retrying" || status === "failed-load" ? " bad" : "")} aria-live="polite">{STATUS[status]}</span>
            <button type="button" className="btn primary focusable" disabled={handing === "sending"} onClick={() => handIn({ saver, store, missing: left, setHanding, setSubmitted })}>
              {handing === "sending" ? "Submitting…" : submitted ? copy.say("again") : copy.say("submit")}
            </button>
          </div>
        </div>

        <aside className="asp-see" aria-label="Your pre-production, the way Dr. Ishak reads the page">
          <div className="asp-see-frame"><PreView answers={answers} url={url} by={viewer?.name || ""} copy={copy} /></div>
        </aside>
      </div>
    </div>
  );
}

/** The worksheet registry's mount: React inside the plain-DOM contract. */
export function mountAudioPre(root, { store, viewer, readOnly = false, classId, editor = false, theme } = {}) {
  const r = createRoot(root);
  r.render(<PreSheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} theme={theme} />);
  return { destroy() { r.unmount(); } };
}

// The document is a white page whatever the site theme, like the story page.
const T = TOKENS.TEXT, ST = TOKENS.STATE;
const SERIF = "'Lora', 'Iowan Old Style', Charter, Georgia, serif";
export const PRE_CSS = `
.as.asp{padding-inline:20px}
.asp-work{max-width:1360px;margin:0 auto;display:grid;grid-template-columns:minmax(380px,600px) minmax(0,1fr);gap:28px;align-items:start}
.asp-build{max-width:none;margin:0}
.asp-see{position:sticky;top:140px;min-width:0}
.asp-bar{position:sticky;top:64px;z-index:6;max-width:1360px;margin:0 auto 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;background:var(--card);box-shadow:0 1px 2px rgba(0,0,0,.06),0 0 0 1px var(--line-soft)}
.as .asp-bar-item{display:inline-flex;align-items:center;gap:8px;font-family:var(--font);font-size:14px;font-weight:600;line-height:1.2;padding:6px 12px 6px 7px;border-radius:999px;border:1px solid var(--line-strong);background:var(--sunk);color:var(--ink);cursor:pointer;text-align:left}
.as .asp-bar-item:hover{border-color:var(--accent)}
.as .asp-bar-item.on{border-color:var(--ok);color:var(--ok)}
.as .asp-bar-box{flex:none;width:20px;height:20px;border-radius:50%;border:2px solid var(--line-strong);background:var(--card);display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff}
.as .asp-bar-item.on .asp-bar-box{background:var(--ok);border-color:var(--ok)}
.as .asp-bar-n{font-weight:700;margin-left:6px;color:inherit}
.as .asp-bar-count{margin-left:auto;font-size:14px;color:var(--secondary)}
.as .asp-bar-count b{color:var(--ink)}
.as .asp-build .part{scroll-margin-top:130px}
.asp-see-frame{border-radius:16px;overflow:auto;max-height:calc(100vh - 110px);box-shadow:0 10px 40px -12px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.08);background:#fff}
.asp-solo{max-width:820px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px -12px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.08);background:#fff}
.as .asp-ideas .pickbox{border-color:var(--line-strong);box-shadow:none}
.as .asp-ideas .pickbox.on{border-color:var(--accent);background:var(--accent-light)}
.as .asp-picked{font-size:14px;font-weight:600;color:var(--accent)}
.as .asp-doors{display:flex;gap:8px;flex-wrap:wrap}
.as .asp-qs{display:grid;gap:10px}
.as .asp-q{display:grid;gap:10px;padding:12px 14px;border-radius:14px;border:2px solid var(--line-strong);background:var(--card)}
.as .asp-q.on{border-color:var(--accent);background:var(--accent-light)}
.as .asp-q.full{opacity:.55}
.as .asp-q-pick{display:flex;align-items:flex-start;gap:12px;text-align:left;font:inherit;color:var(--ink);background:none;border:0;padding:0;cursor:pointer;width:100%}
.as .asp-q-pick[disabled]{cursor:default}
.as .asp-q-box{flex:none;width:26px;height:26px;border-radius:8px;border:2px solid var(--line-strong);background:var(--card);display:grid;place-items:center;font-size:16px;font-weight:700;color:var(--on-accent);margin-top:1px}
.as .asp-q.on .asp-q-box{background:var(--accent);border-color:var(--accent)}
.as .asp-q-say{font-size:18px;font-weight:500;line-height:1.35}
.as .asp-q .para{max-width:none}
.as .asp-have{display:grid;gap:8px;padding:14px 16px;border-radius:12px;background:var(--sunk)}
.as .asp-have-h{margin:0;font-size:15px;font-weight:600;color:var(--secondary)}
.as .asp-have-row{display:grid;grid-template-columns:minmax(120px,200px) minmax(0,1fr);gap:12px;font-size:15px;line-height:1.4}
.as .asp-have-ask{color:var(--secondary)}
.as .asp-have-lines{overflow-wrap:anywhere}
.as .asp-check{display:grid;gap:8px}
.as .asp-check-row{display:flex;align-items:center;gap:10px}
.as .asp-check-row.done .asp-check-text{text-decoration:line-through;color:var(--secondary)}
.as .asp-check-box{width:22px;height:22px;flex:none;accent-color:var(--accent);cursor:pointer}
.as .asp-check-text{flex:1;min-width:0;font-family:var(--font);font-size:16px;min-height:40px;padding:0 12px;border:1px solid var(--line-strong);border-radius:10px;background:var(--card);color:var(--ink);outline:none}
.as span.asp-check-text{display:flex;align-items:center;border-color:transparent;background:none;padding:0}

.aspd{font-family:${SERIF};color:#1c1917;background:#fff;padding:36px 40px 44px;display:grid;gap:22px;min-height:320px}
.aspd-head{display:grid;gap:10px}
.aspd-kicker{font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;font-size:12.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#78716c}
.aspd-h{margin:0;font-size:34px;font-weight:600;line-height:1.12;letter-spacing:-.015em;overflow-wrap:anywhere}
.aspd-by{margin:0;font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;font-size:15px;color:#57534e}
.aspd-treat{margin:0;font-size:19px;line-height:1.55;white-space:pre-line}
.aspd-sec{display:grid;gap:8px;padding-top:18px;border-top:1px solid #e7e5e4}
.aspd-h2{margin:0;font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#57534e;line-height:1.35}
.aspd-qa{gap:18px}
.aspd-q{display:grid;gap:6px}
.aspd-a{margin:0;font-size:17px;line-height:1.55;white-space:pre-line}
.aspd-list{margin:0;padding-left:22px;font-size:17px;line-height:1.5;display:grid;gap:4px}
.aspd-player{width:100%}
.aspd-wait{font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:#78716c}
.aspd-check{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:17px;line-height:1.45}
.aspd-check li{display:flex;align-items:flex-start;gap:12px}
.aspd-check li.done{color:#78716c;text-decoration:line-through}
.aspd-box{flex:none;width:22px;height:22px;border-radius:6px;border:2px solid #a8a29e;display:grid;place-items:center;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#fff;margin-top:2px}
.aspd-check li.done .aspd-box{background:${ST.ok};border-color:${ST.ok}}
@media (max-width:1060px){
  .asp-bar{top:56px}
  .as .asp-bar-count{display:none}
  .asp-work{grid-template-columns:1fr}
  .asp-see{position:static}
  .asp-see-frame{max-height:none}
}
@media (max-width:620px){
  .aspd{padding:26px 22px 32px}
  .aspd-h{font-size:28px}
  .as .asp-have-row{grid-template-columns:1fr}
}
`;
