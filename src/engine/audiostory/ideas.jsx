// Audio story ideas: COMM 3's sheet for Friday, October 30, in class, at
// /comm3/worksheets/audio-ideas.
//
// Andrew, 2026-10-29: students come "prepped with five ideas" and put three
// of them here. Before the ideas, two questions for any audio story and two
// about them (strengths, and how they want to work, "that way, I'll be able
// to potentially put them in pairs"). Each idea has why someone would want to
// hear the story and what it will take to make this story succeed. The
// questions are his words, spelling fixed.
//
// Nothing shows on the board until the student presses submit: "I don't think
// you have the ideas pop up every single time somebody writes one. I think
// they have to press a submit button." After the first submit the answers
// keep saving as typed, so an edit after submitting shows on the board too.
//
// His marks on an idea are one row in worksheet_reviews (the pre-production
// table), the note holding { a: "top", b: "ohno" } and the status approved
// when any idea is okayed. Nobody writes that row from a browser: board.jsx
// writes through /api/worksheet-submits, and the student reads their own row
// under the rules every four seconds while the page is open, which is how
// the mark shows up on their screen without a refresh.

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { gameClient } from "../gameClient.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { CSS, STATUS, when, blank, linesOf, useSheet, handIn, handSay, Lines, Choices, Line } from "./bits.jsx";

export const AUDIO_IDEAS_KEY = "audio-ideas";
export const AUDIO_IDEAS_TITLE = "Audio story ideas";
export const ideasHref = (classId) => "/" + classId + "/worksheets/" + AUDIO_IDEAS_KEY;

export const SLOTS = ["a", "b", "c"];
export const IDEA_PARTS = ["idea", "why", "plan"];
export const STRENGTHS = ["Technical strength", "Storytelling", "Research", "Other"];
export const WORK = ["Individually", "In a pair", "Either one"];
const slotFields = (s) => IDEA_PARTS.map(p => p + ":" + s);
export const FIELDS = ["any", "tools", "strength", "other", "work", ...SLOTS.flatMap(slotFields)];
export const REQUIRED = FIELDS.filter(f => f !== "other");
export const missingOf = (answers) => REQUIRED.filter(f => blank(answers, f));
export const doneOf = (answers, s) => slotFields(s).filter(f => !blank(answers, f)).length;

// His marks, in the order he said them. Andrew, 2026-10-29: "a green okay
// mark, a green mark with a star that's like top idea. An orange that's like
// not quite there. A yellow that's like, would not advise, and a red that's
// like, oh, no."
export const MARKS = [
  { id: "top", say: "Top idea", star: true, good: true },
  { id: "ok", say: "Okay", good: true },
  { id: "close", say: "Not quite there" },
  { id: "no", say: "Would not advise" },
  { id: "ohno", say: "Oh no" },
];
export const markOf = (id) => MARKS.find(m => m.id === id) || null;
/** The marks on a sheet, { slot: markId }, from its review row. */
export const marksOf = (review) => {
  try {
    const got = JSON.parse(review?.note || "{}");
    const out = {};
    SLOTS.forEach(s => { if (markOf(got?.[s])) out[s] = got[s]; });
    return out;
  } catch { return {}; }
};
/** The review row's status for a set of marks: approved once any idea is okayed, clear when none is marked. */
export const statusFor = (marks) => {
  const ids = Object.values(marks || {});
  if (!ids.length) return "clear";
  return ids.some(id => markOf(id)?.good) ? "approved" : "needs_work";
};

/** A student's own review row, read under the rules. */
export async function reviewFor({ worksheetKey, classId, viewerId }) {
  const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", worksheetKey).eq("group_key", classId).eq("viewer_id", viewerId);
  const id = s.data && s.data[0] && s.data[0].id;
  if (!id) return null;
  const r = await gameClient.from("worksheet_reviews").select("status,note,reviewed_at").eq("sheet_id", id);
  return (r.data && r.data[0]) || null;
}

// The words students read, Andrew's to edit in place.
export const COPY_ROW = "worksheet-audio-ideas-plan";
export const DEFAULT_COPY = {
  title: AUDIO_IDEAS_TITLE,
  credit: "COMM 3 · Friday, October 30, in class",
  intro: "",
  anyAsk: "What will you have to do to make any audio story successful?",
  toolsAsk: "What do you think you should use to put together your audio story?",
  toolsHint: "It would be good to ask classmates, friends, and the internet first.",
  strengthAsk: "What are your strengths?",
  otherHint: "Other",
  workAsk: "How do you want to work? Click all that you're okay with.",
  ideaAsk: "The idea",
  ideaHint: "The story, in a line",
  whyAsk: "Why would someone want to hear this story?",
  planAsk: "What will you have to do to make this story (specifically this story) successful?",
  submit: "submit ideas",
  again: "submit again",
};

export const POLL = 4000;

/** The mark on an idea, as the student and the board see one. */
export function Mark({ id }) {
  const m = markOf(id);
  if (!m) return null;
  return <span className={"mark " + m.id}>{m.star ? <span aria-hidden="true">★</span> : null}{m.say}</span>;
}

export function IdeasSheet({ store, viewer, classId, readOnly = false, storage, editor = false, theme, marks: givenMarks }) {
  const copy = useCopy(editor, COPY_ROW, DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [handing, setHanding] = useState("");
  const [review, setReview] = useState(null);
  const draftKey = AUDIO_IDEAS_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
  const { answers, set, submitted, setSubmitted, status, saver } = useSheet({ store, draftKey, readOnly, storage });

  // The marks, asked for again every four seconds while the tab is showing.
  useEffect(() => {
    if (readOnly || !classId || !viewer?.id) return undefined;
    let alive = true;
    const ask = () => {
      if (document.visibilityState === "hidden") return;
      reviewFor({ worksheetKey: AUDIO_IDEAS_KEY, classId, viewerId: viewer.id }).then(r => { if (alive) setReview(r); }).catch(() => {});
    };
    ask();
    const t = setInterval(ask, POLL);
    return () => { alive = false; clearInterval(t); };
  }, [readOnly, classId, viewer?.id]);

  const marks = givenMarks || marksOf(review);
  const root = { className: "as" + (readOnly ? " ro" : ""), "data-theme": theme || undefined };
  if (!answers) return <div {...root}><style>{CSS}</style><div className="sheet"><div className="foot"><span className="status">{STATUS[status] || "Loading…"}</span></div></div></div>;
  const left = missingOf(answers);
  const say = handSay(handing, left) || (submitted ? <>Submitted <b>{when(submitted)}</b>.</> : <><b>{REQUIRED.length - left.length} of {REQUIRED.length}</b> answered</>);

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

        <section className="part" aria-label="Any audio story">
          <div className="phead"><span className="n">Any audio story</span><span className="sub">{blank(answers, "any") ? "" : "✓"}</span></div>
          <div className="field">
            <Words k="anyAsk" copy={copy} editing={editing} className="ask" />
            <Lines id="ai-any" label={copy.say("anyAsk")} value={answers.any || ""} readOnly={readOnly} onChange={v => set("any", v)} />
          </div>
          <div className="field">
            <Words k="toolsAsk" copy={copy} editing={editing} className="ask" />
            <Words k="toolsHint" copy={copy} editing={editing} as="p" className="hint" />
            <Lines id="ai-tools" label={copy.say("toolsAsk")} value={answers.tools || ""} readOnly={readOnly} onChange={v => set("tools", v)} />
          </div>
        </section>

        <section className="part" aria-label="You">
          <div className="phead"><span className="n">You</span><span className="sub">{blank(answers, "strength") || blank(answers, "work") ? "" : "✓"}</span></div>
          <div className="field">
            <Words k="strengthAsk" copy={copy} editing={editing} className="ask" />
            <Choices label={copy.say("strengthAsk")} options={STRENGTHS} value={answers.strength || ""} readOnly={readOnly} onChange={v => set("strength", v)} />
            {linesOf(answers.strength).includes("Other") || !blank(answers, "other")
              ? <Line id="ai-other" label={copy.say("otherHint")} value={answers.other} readOnly={readOnly} placeholder={copy.say("otherHint")} onChange={v => set("other", v)} />
              : null}
          </div>
          <div className="field">
            <Words k="workAsk" copy={copy} editing={editing} className="ask" />
            <Choices label={copy.say("workAsk")} options={WORK} value={answers.work || ""} readOnly={readOnly} onChange={v => set("work", v)} />
          </div>
        </section>

        <section className="part" aria-label="Your ideas">
          <div className="phead"><span className="n">Your ideas</span><span className="sub">{SLOTS.filter(s => doneOf(answers, s) === 3).length} of 3</span></div>
          <div className="ideas">
            {SLOTS.map((s, i) => (
              <div key={s} className="box" aria-label={"Idea " + (i + 1)}>
                <div className="bh">
                  <h2>Idea {i + 1}</h2>
                  {marks[s] ? <Mark id={marks[s]} /> : <span className="sub">{doneOf(answers, s) === 3 ? "✓" : ""}</span>}
                </div>
                <label className="field">
                  <Words k="ideaAsk" copy={copy} editing={editing} className="ask" />
                  <Line id={"ai-idea-" + s} label={copy.say("ideaAsk") + ", idea " + (i + 1)} value={answers["idea:" + s]} readOnly={readOnly} placeholder={copy.say("ideaHint")} onChange={v => set("idea:" + s, v)} />
                </label>
                <div className="field">
                  <Words k="whyAsk" copy={copy} editing={editing} className="ask" />
                  <Lines id={"ai-why-" + s} label={copy.say("whyAsk") + ", idea " + (i + 1)} value={answers["why:" + s] || ""} readOnly={readOnly} onChange={v => set("why:" + s, v)} />
                </div>
                <div className="field">
                  <Words k="planAsk" copy={copy} editing={editing} className="ask" />
                  <Lines id={"ai-plan-" + s} label={copy.say("planAsk") + ", idea " + (i + 1)} value={answers["plan:" + s] || ""} readOnly={readOnly} onChange={v => set("plan:" + s, v)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {!readOnly ? (
          <div className="foot">
            <div className="say" aria-live="polite">{say}</div>
            <span className={"status" + (status === "retrying" || status === "failed-load" ? " bad" : "")} aria-live="polite">{STATUS[status]}</span>
            <button type="button" className="btn primary focusable" disabled={handing === "sending"} onClick={() => handIn({ saver, store, missing: missingOf(answers), setHanding, setSubmitted })}>
              {handing === "sending" ? "Submitting…" : submitted ? copy.say("again") : copy.say("submit")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The worksheet registry's mount: React inside the plain-DOM contract. */
export function mountAudioIdeas(root, { store, viewer, readOnly = false, classId, editor = false, theme } = {}) {
  const r = createRoot(root);
  r.render(<IdeasSheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} theme={theme} />);
  return { destroy() { r.unmount(); } };
}
