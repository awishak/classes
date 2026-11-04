// The audio file drop box for Wednesday, November 4, at
// /comm3/worksheets/audio-nov4. Andrew, 2026-11-04: "make me an audio file
// drop box page for today. Pin it for students. Make it a page with 'Audio
// Exercise Nov 4', Names (choose from list, can choose more than 1),
// headline, audio file."
//
// One student sends the file for the group and taps every name on it, so a
// file is one sheet row under the sender, with the names one a line in
// `names` (the Choices rule, bits.jsx), the headline in `headline`, and the
// clip in `audio` the way the audio exercise keeps one (audio.js, JSON
// { path, seconds, name }). The clip goes into the student's own folder in
// the visual-story bucket. Up to ten minutes, since this is the day's
// exercise and not the 60-second preview.
//
// ?review is his page: every file, newest first, with the names, the
// headline and the player, and who on the roster is on no file yet.

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { CSS, STATUS, when, blank, linesOf, useSheet, handIn, handSay, Line, Choices } from "./bits.jsx";
import { audioOf, sendAudio, linkFor, FORMAT_SAY } from "./audio.js";
import { useAllSheets, useClipUrls, Shell } from "./control.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { StudentLink } from "../StudentPage.jsx";

export const AUDIO_DROP_KEY = "audio-nov4";
export const AUDIO_DROP_TITLE = "Audio Exercise Nov 4";
export const dropHref = (classId) => "/" + classId + "/worksheets/" + AUDIO_DROP_KEY;
export const DROP_MAX_SECONDS = 600;

export const REQUIRED = ["names", "headline", "audio"];
export const missingOf = (answers) => REQUIRED.filter(f => blank(answers, f));

export const COPY_ROW = "worksheet-audio-nov4-plan";
export const DEFAULT_COPY = {
  title: AUDIO_DROP_TITLE,
  credit: "COMM 3. Wednesday, November 4.",
  namesAsk: "Names",
  namesSay: "Choose everyone on this file. You can choose more than one name.",
  headlineAsk: "Headline",
  audioAsk: "Audio file",
  audioHint: FORMAT_SAY + ".",
  submit: "submit",
  again: "submit again",
};

// Everyone who can be on a file: the student first, then the class by name.
const peopleOf = (viewer, classmates) => {
  const me = String(viewer?.name || "").trim();
  const rest = (classmates || []).map(n => String(n || "").trim()).filter(n => n && n !== me).sort((a, b) => a.localeCompare(b));
  return me ? [me, ...rest] : rest;
};

export function DropSheet({ store, viewer, classId, classmates = [], readOnly = false, storage, editor = false, theme }) {
  const copy = useCopy(editor, COPY_ROW, DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [handing, setHanding] = useState("");
  const draftKey = AUDIO_DROP_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
  const { answers, set, submitted, setSubmitted, status, saver } = useSheet({ store, draftKey, readOnly, storage });
  const people = peopleOf(viewer, classmates);

  // The sender's own name starts picked.
  useEffect(() => {
    if (readOnly || !answers || !viewer?.name || !blank(answers, "names")) return;
    set("names", viewer.name);
  }, [answers === null, readOnly, viewer?.name]);   // eslint-disable-line react-hooks/exhaustive-deps

  const root = { className: "as" + (readOnly ? " ro" : ""), "data-theme": theme || undefined };
  if (!answers) return <div {...root}><style>{CSS}</style><div className="sheet"><div className="foot"><span className="status">{STATUS[status] || "Loading…"}</span></div></div></div>;
  const left = missingOf(answers);
  const say = handSay(handing, left) || (submitted ? <>Submitted <b>{when(submitted)}</b>.</> : <><b>{REQUIRED.length - left.length} of {REQUIRED.length}</b> answered</>);
  const tick = (f) => <span className="sub">{blank(answers, f) ? "" : "✓"}</span>;
  // A name on the file that is not on the list any more still shows, read only.
  const named = linesOf(answers.names).filter(n => !people.includes(n));
  const options = readOnly ? [...people, ...named] : people;

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
          </div>
        </div>

        <section className="part" aria-label={copy.say("namesAsk")}>
          <div className="phead"><Words k="namesAsk" copy={copy} editing={editing} className="n" />{tick("names")}</div>
          <div className="field">
            <Words k="namesSay" copy={copy} editing={editing} as="p" className="hint" />
            <Choices label={copy.say("namesAsk")} options={options} value={answers.names} readOnly={readOnly} onChange={v => set("names", v)} />
          </div>
        </section>

        <section className="part" aria-label={copy.say("headlineAsk")}>
          <div className="phead"><Words k="headlineAsk" copy={copy} editing={editing} className="n" />{tick("headline")}</div>
          <div className="field">
            <Line id="ad-headline" label={copy.say("headlineAsk")} value={answers.headline} readOnly={readOnly} onChange={v => set("headline", v)} />
          </div>
        </section>

        <section className="part" aria-label={copy.say("audioAsk")}>
          <div className="phead"><Words k="audioAsk" copy={copy} editing={editing} className="n" />{tick("audio")}</div>
          <div className="field">
            <Words k="audioHint" copy={copy} editing={editing} as="p" className="sub" />
            <DropAudio value={answers.audio} readOnly={readOnly} classId={classId} viewerId={viewer?.id} onChange={v => set("audio", v)} />
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

// The clip, the audio exercise's box with the longer limit.
export function DropAudio({ value, readOnly, classId, viewerId, onChange, url: givenUrl }) {
  const clip = audioOf(value);
  const [progress, setProgress] = useState(-1);
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
      const v = await sendAudio({ file, classId, viewerId, onProgress: setProgress, maxSeconds: DROP_MAX_SECONDS });
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
export function mountAudioDrop(root, { store, viewer, classmates = [], readOnly = false, classId, editor = false, theme } = {}) {
  const r = createRoot(root);
  r.render(<DropSheet store={store} viewer={viewer} classmates={classmates} readOnly={readOnly} classId={classId} editor={editor && !readOnly} theme={theme} />);
  return { destroy() { r.unmount(); } };
}

const lower = (s) => String(s || "").trim().toLowerCase();

// His page: every file, newest first, and who is on none yet.
export function DropReview({ config, worksheetKey, roster }) {
  const [sheets, error] = useAllSheets(config, worksheetKey);
  const urls = useClipUrls(config, worksheetKey, sheets);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  if (error) return <Shell config={config}><p className="pt-sub">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell config={config}><p className="pt-sub">Loading the files.</p></Shell>;
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const byEmail = new Map(people.map(p => [lower(p.email), p]));
  const files = sheets.filter(s => byEmail.has(lower(s.viewer_id)) && (audioOf(s.answers?.audio) || !blank(s.answers, "headline")))
    .map(s => ({ sheet: s, sender: byEmail.get(lower(s.viewer_id)), names: linesOf(s.answers?.names), clip: audioOf(s.answers?.audio) }))
    .sort((x, y) => String(y.sheet.submitted_at || y.sheet.updated_at || "").localeCompare(String(x.sheet.submitted_at || x.sheet.updated_at || "")));
  const onFile = new Set(files.flatMap(f => [...f.names, f.sender.name].map(lower)));
  const notIn = people.map(p => p.name).filter(n => !onFile.has(lower(n)));
  return (
    <Shell config={config}>
      <header className="aic-top">
        <div className="aic-titles">
          <h1 className="pt-h1">{DEFAULT_COPY.title}</h1>
          <p className="pt-sub">{DEFAULT_COPY.credit} This page asks again every half minute.</p>
        </div>
        {sections.length > 1 ? (
          <div className="pt-seg" role="tablist" aria-label="Section">
            {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"pt-focus" + (s === section ? " on" : "")} onClick={() => setSection(s)}>{s}</button>)}
          </div>
        ) : null}
      </header>
      <div className="pt-tiles" aria-label="Running summary">
        <div className="pt-tile aic-t-done"><span className="pt-tileN">{files.filter(f => f.clip).length}</span><span className="pt-tileL">Files</span></div>
        <div className="pt-tile"><span className="pt-tileN">{people.length - notIn.length}</span><span className="pt-tileL">On a file</span></div>
        <div className="pt-tile aic-t-due"><span className="pt-tileN">{notIn.length}</span><span className="pt-tileL">On none yet</span></div>
      </div>
      {notIn.length ? (
        <details className="aic-fold">
          <summary className="pt-focus">On no file yet, {notIn.length}</summary>
          <div className="aic-names">{notIn.map(n => <span key={n} className="pt-gpill off">{n}</span>)}</div>
        </details>
      ) : <p className="pt-quiet">Everyone is on a file.</p>}
      <div className="pt-stack aic-cards">
        {files.map(({ sheet, sender, names, clip }) => (
          <article key={sheet.viewer_id} className={"pt-row aic-card" + (sheet.submitted_at ? "" : " due")}>
            <div className="aic-head">
              <div className="pt-main">
                <p className="pt-title">{String(sheet.answers?.headline || "").trim() || "No headline yet"}</p>
                <p className="pt-meta">{names.length ? names.join(", ") : sender.name}</p>
                <p className={"pt-when " + (sheet.submitted_at ? "done" : "due")}><span>{sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) : "Started, not submitted"} · sent by <StudentLink config={config} student={sender} /></span></p>
              </div>
              {clip ? (
                <div className="aic-clip aic-p-audio">
                  {urls[clip.path] ? <audio controls preload="metadata" src={urls[clip.path]} /> : <span className="aic-muted">Signing the link.</span>}
                  <span className="aic-secs">{clip.seconds ? Math.round(clip.seconds) + " s" : ""}</span>
                </div>
              ) : <span className="pt-gpill aic-noclip">No audio yet</span>}
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}
