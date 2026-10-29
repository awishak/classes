// The audio exercise: COMM 3's second sheet, at
// /comm3/worksheets/audio-research, due Tuesday, November 3, at 11:59 PM.
// Built 2026-10-29 as Audio story research; later that day Andrew folded the
// audio exercise into it: "i want to combine audio exercise and audio story
// research and this second part is basically that assignment," and added
// "a 60 second audio story to go with their idea" (audio.js). The address
// kept its first name.
//
// Andrew, 2026-10-29: "We're not going to have class on Monday. The work
// that they do on Monday is they have to do research." On the idea okayed
// Friday: "a paragraph treatment," what the story actually includes ("we do
// this first, then this, then this, like what would we talk about?"), and
// research that "has to include at least one article, at least one other
// piece of media, and then one person they could interview, and another
// place they could go to capture some audio." And "they have to bring a good
// audio story as well." Due Tuesday night.
//
// The idea comes across from the ideas sheet: the student's own sheet and
// its marks are read under the rules, and the okayed ideas sit at the top as
// chips to tap into the story line. Answers are worksheet rows, one field
// each, saved as typed (bits.jsx).

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { gameClient } from "../gameClient.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { supabaseStore } from "../worktopia/store.js";
import { CSS, STATUS, when, blank, useSheet, handIn, handSay, Lines, Line, Para } from "./bits.jsx";
import { AUDIO_IDEAS_KEY, SLOTS, marksOf, markOf, reviewFor, Mark } from "./ideas.jsx";
import { audioOf, sendAudio, linkFor, FORMAT_SAY, MAX_SECONDS } from "./audio.js";

export const AUDIO_RESEARCH_KEY = "audio-research";
export const AUDIO_RESEARCH_TITLE = "Audio exercise";
export const researchHref = (classId) => "/" + classId + "/worksheets/" + AUDIO_RESEARCH_KEY;

// The research, four things, each its own field.
export const RESEARCH = [
  { field: "article", ask: "At least one article" },
  { field: "media", ask: "At least one other piece of media" },
  { field: "person", ask: "One person you could interview" },
  { field: "place", ask: "Another place you could go to capture some audio" },
];
export const FIELDS = ["story", "treatment", "includes", ...RESEARCH.map(r => r.field), "example", "audio"];
export const REQUIRED = FIELDS;
export const missingOf = (answers) => REQUIRED.filter(f => blank(answers, f));

export const COPY_ROW = "worksheet-audio-research-plan";
export const DEFAULT_COPY = {
  title: AUDIO_RESEARCH_TITLE,
  credit: "COMM 3 · Due Tuesday, November 3, at 11:59 PM",
  intro: "",
  storyAsk: "Your story",
  storyHint: "The idea that got okayed on Friday, in a line",
  treatmentAsk: "A paragraph treatment",
  includesAsk: "What does the story actually include? We do this first, then this, then this. What would we talk about?", // voice-ok: his words
  researchHead: "Research",
  ...Object.fromEntries(RESEARCH.map(r => ["ask." + r.field, r.ask])),
  exampleAsk: "A good audio story you found",
  exampleHint: "The name, and the link",
  audioAsk: "A 60-second audio story to go with your idea",
  audioHint: FORMAT_SAY + ", up to " + MAX_SECONDS + " seconds",
  submit: "submit",
  again: "submit again",
};

/** The student's okayed ideas off the ideas sheet, [{ slot, idea, mark }], read under the rules. */
export async function okayedIdeas({ classId, viewerId }) {
  const store = supabaseStore({ supabase: gameClient, worksheetKey: AUDIO_IDEAS_KEY, groupKey: classId, viewerId });
  const [got, review] = await Promise.all([store.load(), reviewFor({ worksheetKey: AUDIO_IDEAS_KEY, classId, viewerId })]);
  const marks = marksOf(review);
  return SLOTS.map(s => ({ slot: s, idea: String(got.answers["idea:" + s] || "").trim(), mark: marks[s] || null })).filter(x => x.idea && x.mark && markOf(x.mark).good);
}

export function ResearchSheet({ store, viewer, classId, readOnly = false, storage, editor = false, theme }) {
  const copy = useCopy(editor, COPY_ROW, DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [handing, setHanding] = useState("");
  const [okayed, setOkayed] = useState([]);
  const draftKey = AUDIO_RESEARCH_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
  const { answers, set, submitted, setSubmitted, status, saver } = useSheet({ store, draftKey, readOnly, storage });

  useEffect(() => {
    if (readOnly || !classId || !viewer?.id) return undefined;
    let alive = true;
    okayedIdeas({ classId, viewerId: viewer.id }).then(list => { if (alive) setOkayed(list); }).catch(() => {});
    return () => { alive = false; };
  }, [readOnly, classId, viewer?.id]);

  const root = { className: "as" + (readOnly ? " ro" : ""), "data-theme": theme || undefined };
  if (!answers) return <div {...root}><style>{CSS}</style><div className="sheet"><div className="foot"><span className="status">{STATUS[status] || "Loading…"}</span></div></div></div>;
  const left = missingOf(answers);
  const say = handSay(handing, left) || (submitted ? <>Submitted <b>{when(submitted)}</b>.</> : <><b>{REQUIRED.length - left.length} of {REQUIRED.length}</b> answered</>);
  const tick = (f) => <span className="sub">{blank(answers, f) ? "" : "✓"}</span>;

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

        <section className="part" aria-label="Your story">
          <div className="phead"><span className="n">Your story</span>{tick("story")}</div>
          {okayed.length && !readOnly ? (
            <div className="chips" aria-label="Your okayed ideas">
              {okayed.map(x => <button key={x.slot} type="button" className="chip focusable" onClick={() => set("story", x.idea)}><Mark id={x.mark} />&nbsp;{x.idea}</button>)}
            </div>
          ) : null}
          <label className="field">
            <Words k="storyAsk" copy={copy} editing={editing} className="ask" />
            <Line id="ar-story" label={copy.say("storyAsk")} value={answers.story} readOnly={readOnly} placeholder={copy.say("storyHint")} onChange={v => set("story", v)} />
          </label>
          <label className="field">
            <Words k="treatmentAsk" copy={copy} editing={editing} className="ask" />
            <Para id="ar-treatment" label={copy.say("treatmentAsk")} value={answers.treatment} readOnly={readOnly} rows={6} onChange={v => set("treatment", v)} />
          </label>
          <div className="field">
            <Words k="includesAsk" copy={copy} editing={editing} className="ask" />
            <Lines id="ar-includes" label={copy.say("includesAsk")} value={answers.includes || ""} readOnly={readOnly} placeholder="First" onChange={v => set("includes", v)} />
          </div>
        </section>

        <section className="part" aria-label="Research">
          <div className="phead"><Words k="researchHead" copy={copy} editing={editing} className="n" /><span className="sub">{RESEARCH.filter(r => !blank(answers, r.field)).length} of {RESEARCH.length}</span></div>
          {RESEARCH.map(r => (
            <div key={r.field} className="field">
              <Words k={"ask." + r.field} copy={copy} editing={editing} className="ask" />
              <Lines id={"ar-" + r.field} label={copy.say("ask." + r.field)} value={answers[r.field] || ""} readOnly={readOnly} onChange={v => set(r.field, v)} />
            </div>
          ))}
        </section>

        <section className="part" aria-label="A good audio story">
          <div className="phead"><span className="n">A good audio story</span>{tick("example")}</div>
          <div className="field">
            <Words k="exampleAsk" copy={copy} editing={editing} className="ask" />
            <Lines id="ar-example" label={copy.say("exampleAsk")} value={answers.example || ""} readOnly={readOnly} placeholder={copy.say("exampleHint")} onChange={v => set("example", v)} />
          </div>
        </section>

        <section className="part" aria-label="Your audio story">
          <div className="phead"><span className="n">Your audio story</span>{tick("audio")}</div>
          <div className="field">
            <Words k="audioAsk" copy={copy} editing={editing} className="ask" />
            <Words k="audioHint" copy={copy} editing={editing} as="p" className="hint" />
            <AudioBox value={answers.audio} readOnly={readOnly} classId={classId} viewerId={viewer?.id} onChange={v => set("audio", v)} />
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

// The clip: pick a file, see the upload go, then play the clip back. The
// length is read before anything goes up, and a file over the limit or in
// another format is refused with the reason. Remove clears the field; a
// new file goes up under a new name.
export function AudioBox({ value, readOnly, classId, viewerId, onChange, url: givenUrl }) {
  const clip = audioOf(value);
  const [progress, setProgress] = useState(-1);   // -1 idle, 0..1 sending
  const [why, setWhy] = useState("");
  const [url, setUrl] = useState(givenUrl || "");
  useEffect(() => {
    if (givenUrl) { setUrl(givenUrl); return undefined; }
    if (!clip?.path) { setUrl(""); return undefined; }
    let alive = true;
    linkFor(clip.path).then(u => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [clip?.path, givenUrl]);
  const pick = async (file) => {
    if (!file) return;
    setWhy(""); setProgress(0);
    try {
      const v = await sendAudio({ file, classId, viewerId, onProgress: setProgress });
      onChange(v);
    } catch (e) {
      const m = String(e.message || "");
      setWhy(/refused \(415\)/.test(m) ? "Audio files are not switched on for this sheet yet. Tell Dr. Ishak." : m);
    }
    setProgress(-1);
  };
  return (
    <div className="audio">
      {clip ? (
        <div className="clip">
          {url ? <audio controls preload="metadata" src={url} /> : null}
          <span className="sub">{clip.name}{clip.seconds ? " · " + Math.round(clip.seconds) + " s" : ""}</span>
          {readOnly ? null : <button type="button" className="btn small focusable" onClick={() => { onChange(""); setUrl(""); }}>Remove</button>}
        </div>
      ) : null}
      {readOnly ? null : progress >= 0 ? (
        <div className="bar" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: Math.round(progress * 100) + "%" }} /></div>
      ) : (
        <label className="btn primary pick focusable">
          {clip ? "Send a different file" : "Send your audio file"}
          <input type="file" accept=".m4a,.mp3,.wav,.aac,audio/*" onChange={e => { pick(e.target.files && e.target.files[0]); e.target.value = ""; }} />
        </label>
      )}
      {why ? <p className="hint bad">{why}</p> : null}
    </div>
  );
}

/** The worksheet registry's mount: React inside the plain-DOM contract. */
export function mountAudioResearch(root, { store, viewer, readOnly = false, classId, editor = false, theme } = {}) {
  const r = createRoot(root);
  r.render(<ResearchSheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} theme={theme} />);
  return { destroy() { r.unmount(); } };
}
