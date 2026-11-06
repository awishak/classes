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
// chips. Andrew, 2026-11-01: "only let them choose from the ideas that were
// approved by me. They must choose one of the ideas to move forward. They
// can modify, but must choose one." A tap picks the idea (the field picked,
// a slot, or pair for the story Andrew set on the Pairs view) and fills the
// story line, which stays theirs to change; Submit wants a pick. With no
// approved idea the sheet is shut behind his words (blockedSay). Answers are
// worksheet rows, one field each, saved as typed (bits.jsx).

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { gameClient } from "../gameClient.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { supabaseStore } from "../worktopia/store.js";
import { CSS, STATUS, when, blank, useSheet, handIn, handSay, Lines, Line, Para } from "./bits.jsx";
import { AUDIO_IDEAS_KEY, SLOTS, marksOf, markOf, reopenOf, reviewFor, Mark, ideasHref } from "./ideas.jsx";
import { audioOf, sendAudio, linkFor, FORMAT_SAY, MAX_SECONDS } from "./audio.js";
import { pairsFor } from "./all.jsx";
import { pairOf } from "./pairs.js";

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
export const FIELDS = ["picked", "story", "treatment", "includes", ...RESEARCH.map(r => r.field), "example", "audio"];
export const REQUIRED = FIELDS;
export const missingOf = (answers) => REQUIRED.filter(f => blank(answers, f));
/** The approved ideas a student can pick from: their own okayed ones, and the story Andrew set for their pair. Reopened (ideas.jsx reopenOf), every idea of theirs counts. */
export const approvedOf = (ideas, pair, reopened = false) => {
  const list = (ideas || []).filter(x => reopened || (x.mark && markOf(x.mark)?.good));
  const story = String(pair?.story || "").trim();
  if (story && !list.some(x => x.idea.toLowerCase() === story.toLowerCase())) list.push({ slot: "pair", idea: story, mark: null });
  return list;
};
/** The approved idea the student picked, or null when none is picked or the pick is no longer approved. */
export const chosenOf = (answers, approved) => approved.find(x => x.slot === String(answers?.picked || "").trim()) || null;

export const COPY_ROW = "worksheet-audio-research-plan";
// Andrew's words, 2026-10-29, by voice, for every line a student reads.
// "Only give hints if I say you should give hints."
export const DEFAULT_COPY = {
  title: AUDIO_RESEARCH_TITLE,
  credit: "COMM 3. Due Tuesday, November 3, at 11:59 PM.",
  intro: "Please fill in the information below as a sort of pre-production for your audio story.",
  storyAsk: "Your story",
  // Andrew, 2026-11-01, spelling fixed.
  sideHead: "Approved ideas",
  // Andrew, 2026-11-01: "a bar or like a button that says go look at your
  // audio story ideas," back to the ideas sheet, where every mark and reason
  // of his is.
  ideasGo: "Go look at your audio story ideas",
  pickSay: "Choose one of the ideas approved by Dr. Ishak to move forward. You can modify the idea, but you must choose one idea.",
  // Andrew, 2026-11-06, for a student he reopened the exercise for.
  reopenSay: "Dr. Ishak reopened this for you. Choose any of your ideas to move forward.",
  blockedSay: "This assignment cannot be started until you get an idea approved. The deadlines for me to review your audio story ideas are Friday, October 30, at 5 PM, and Monday, November 2, at 5 PM. If you don't have an idea approved, you won't be able to move forward.",
  treatmentAsk: "A paragraph treatment",
  treatmentSay: "Share a preview of this story in 2 to 4 sentences.",
  includesAsk: "What does the story actually include?",
  includesSay: "Explain the parts of the story that are likely to be included within your allotted 5 minutes.",
  researchHead: "Research",
  ...Object.fromEntries(RESEARCH.map(r => ["ask." + r.field, r.ask])),
  exampleHead: "A good audio story",
  exampleSay: "I'd like you to share with me an audio story that you think is high quality. This could be a podcast, a news story, or something else. It's always good for us to consume high quality media because what we take in is often what we put out.",
  audioHead: "Your audio story",
  audioSay: "I'd like you to give me a practice idea or a preview of what this audio story might be like. You don't have to include sound effects, music, or interviews here, but give me 40 to 60 seconds of what your voice might sound like and what type of ideas you might be covering. Again, this is just a preview or practice and can be partial. You can take a particular part of your story and explain it here. It does not have to be your entire story. We're doing this as a practice exercise.",
  audioHint: FORMAT_SAY + ". Up to " + MAX_SECONDS + " seconds.",
  submit: "submit",
  again: "submit again",
};

/** The student's ideas off the ideas sheet with his marks, { ideas: [{ slot, idea, mark }], reopened }, read under the rules. Andrew, 2026-11-01: "list all three, but they can't choose the one that's not approved." */
export async function markedIdeas({ classId, viewerId }) {
  const store = supabaseStore({ supabase: gameClient, worksheetKey: AUDIO_IDEAS_KEY, groupKey: classId, viewerId });
  const [got, review] = await Promise.all([store.load(), reviewFor({ worksheetKey: AUDIO_IDEAS_KEY, classId, viewerId })]);
  const marks = marksOf(review);
  const ideas = SLOTS.map(s => ({ slot: s, idea: String(got.answers["idea:" + s] || "").trim(), mark: marks[s] || null })).filter(x => x.idea);
  return { ideas, reopened: reopenOf(review) };
}

export function ResearchSheet({ store, viewer, classId, readOnly = false, storage, editor = false, theme, ideas: givenIdeas }) {
  const copy = useCopy(editor, COPY_ROW, DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [handing, setHanding] = useState("");
  const [ideas, setIdeas] = useState(givenIdeas || null);   // null until read; given for a mockup or a test
  const [pair, setPair] = useState(null);
  const [reopened, setReopened] = useState(false);
  const draftKey = AUDIO_RESEARCH_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
  const { answers, set, submitted, setSubmitted, status, saver } = useSheet({ store, draftKey, readOnly, storage });

  useEffect(() => {
    if (readOnly || givenIdeas || !classId || !viewer?.id) return undefined;
    let alive = true;
    markedIdeas({ classId, viewerId: viewer.id }).then(got => { if (alive) { setIdeas(got.ideas); setReopened(got.reopened); } }).catch(() => {});
    pairsFor(classId).then(list => { if (alive) setPair(pairOf(list)[String(viewer.id).trim().toLowerCase()] || null); });
    return () => { alive = false; };
  }, [readOnly, classId, viewer?.id]);

  const root = { className: "as" + (readOnly ? " ro" : ""), "data-theme": theme || undefined };
  if (!answers) return <div {...root}><style>{CSS}</style><div className="sheet"><div className="foot"><span className="status">{STATUS[status] || "Loading…"}</span></div></div></div>;
  const approved = approvedOf(ideas, pair, reopened);
  const chosen = chosenOf(answers, approved);
  // The pick counts only while it names an idea still approved.
  const left = [...missingOf(answers), ...(!readOnly && ideas && !chosen && !blank(answers, "picked") ? ["picked"] : [])];
  // Shut until an idea is approved; the editor sees the sheet anyway, to edit the words.
  const blocked = !readOnly && !editor && ideas !== null && !approved.length;
  const say = handSay(handing, left) || (submitted ? <>Submitted <b>{when(submitted)}</b>.</> : <><b>{REQUIRED.length - left.length} of {REQUIRED.length}</b> answered</>);
  const tick = (f) => <span className="sub">{blank(answers, f) ? "" : "✓"}</span>;
  const pick = (x) => { set("picked", x.slot); set("story", x.idea); };

  // With nothing approved, the blocked words sit in a box beside the title.
  // Andrew, 2026-11-01: "it's only a bar on the side if people haven't
  // gotten any approved yet."
  const shut = !readOnly && (blocked || (editor && !approved.length));
  const goIdeas = classId ? <a className="btn small focusable goideas" href={ideasHref(classId)}>{copy.say("ideasGo")}</a> : null;
  const side = shut ? (
    <aside className="side shut" aria-label={copy.say("sideHead")}>
      <Words k="blockedSay" copy={copy} editing={editing} as="p" className="blocked" />
      {goIdeas}
    </aside>
  ) : null;
  // The ideas the way the ideas sheet shows them, three boxes in a row with
  // his mark on each, and a choose button on the approved ones. Andrew,
  // 2026-11-01: "they should not be sidebars. they should appear as they did
  // on the other doc," and "make it clear that you're supposed to choose one."
  const listed = [...(ideas || []), ...approved.filter(x => x.slot === "pair")];
  const boxOf = (x, i) => {
    const can = approved.some(a => a.slot === x.slot);
    const on = can && chosen?.slot === x.slot;
    return (
      <div key={x.slot} className={"box pickbox" + (can ? " can" : " off") + (on ? " on" : "")} aria-label={x.slot === "pair" ? "Your pair's story" : "Idea " + (i + 1)}>
        <div className="bh"><h2>{x.slot === "pair" ? "Your pair's story" : "Idea " + (i + 1)}</h2>{x.mark ? <Mark id={x.mark} /> : null}</div>
        <p className="pickidea">{x.idea}</p>
        {can ? <button type="button" className={"btn focusable pickgo" + (on ? "" : " primary")} aria-pressed={on} onClick={() => pick(x)}>{on ? "chosen ✓" : "choose this idea"}</button> : null}
      </div>
    );
  };
  const pickPart = !readOnly && !shut && listed.length ? (
    <section className="part pickpart" aria-label="Choose an idea">
      <Words k={reopened ? "reopenSay" : "pickSay"} copy={copy} editing={editing} as="p" className="pickhead" />
      <div className="ideas" role="group" aria-label={copy.say("sideHead")}>{listed.map(boxOf)}</div>
      {goIdeas}
    </section>
  ) : null;
  const head = (
    <div className={"head" + (side ? " withside" : "")}>
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
      {side}
    </div>
  );
  if (blocked) return (
    <div {...root}>
      <style>{CSS}</style>
      <div className="sheet">{head}</div>
    </div>
  );

  return (
    <div {...root}>
      <style>{CSS}</style>
      <div className="sheet">
        {head}
        {pickPart}

        <section className="part" aria-label="Your story">
          {pair && !readOnly ? (
            <p className="pair">{(() => { const me = String(viewer?.id || "").trim().toLowerCase(); const others = (pair.names || []).filter((n, i) => pair.members[i] !== me); return others.length ? <>You are working with <b>{others.join(" and ")}</b></> : <>You are working on your own</>; })()}{pair.story ? <> on <b>{pair.story}</b></> : null}.</p>
          ) : null}
          <label className="field">
            <Words k="storyAsk" copy={copy} editing={editing} className="ask" />
            <Line id="ar-story" label={copy.say("storyAsk")} value={answers.story} readOnly={readOnly} onChange={v => set("story", v)} />
          </label>
          <label className="field">
            <Words k="treatmentAsk" copy={copy} editing={editing} className="ask" />
            <Words k="treatmentSay" copy={copy} editing={editing} as="p" className="hint" />
            <Para id="ar-treatment" label={copy.say("treatmentAsk")} value={answers.treatment} readOnly={readOnly} rows={5} onChange={v => set("treatment", v)} />
          </label>
          <div className="field">
            <Words k="includesAsk" copy={copy} editing={editing} className="ask" />
            <Words k="includesSay" copy={copy} editing={editing} as="p" className="hint" />
            <Lines id="ar-includes" label={copy.say("includesAsk")} value={answers.includes || ""} readOnly={readOnly} onChange={v => set("includes", v)} />
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
          <div className="phead"><Words k="exampleHead" copy={copy} editing={editing} className="n" />{tick("example")}</div>
          <div className="field">
            <Words k="exampleSay" copy={copy} editing={editing} as="p" className="hint" />
            <Lines id="ar-example" label={copy.say("exampleHead")} value={answers.example || ""} readOnly={readOnly} onChange={v => set("example", v)} />
          </div>
        </section>

        <section className="part" aria-label="Your audio story">
          <div className="phead"><Words k="audioHead" copy={copy} editing={editing} className="n" />{tick("audio")}</div>
          <div className="field">
            <Words k="audioSay" copy={copy} editing={editing} as="p" className="hint" />
            <Words k="audioHint" copy={copy} editing={editing} as="p" className="sub" />
            <AudioBox value={answers.audio} readOnly={readOnly} classId={classId} viewerId={viewer?.id} onChange={v => set("audio", v)} />
          </div>
        </section>

        {!readOnly ? (
          <div className="foot">
            <div className="say" aria-live="polite">{say}</div>
            <span className={"status" + (status === "retrying" || status === "failed-load" ? " bad" : "")} aria-live="polite">{STATUS[status]}</span>
            <button type="button" className="btn primary focusable" disabled={handing === "sending"} onClick={() => handIn({ saver, store, missing: left, setHanding, setSubmitted })}>
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
export function AudioBox({ value, readOnly, classId, viewerId, onChange, url: givenUrl, maxSeconds }) {
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
      const v = await sendAudio({ file, classId, viewerId, onProgress: setProgress, ...(maxSeconds ? { maxSeconds } : {}) });
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
