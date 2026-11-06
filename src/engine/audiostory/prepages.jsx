// The instructor's pages for the audio story pre-production (pre.jsx).
//
// PreReview is /comm3/worksheets/audio-pre?review: every sheet, by student,
// as the document the student watched fill in, with who is in and who is
// not, asked again every half minute. PreControl is ?control: how the sheet
// works, from the code itself, the way every worksheet gets one (Andrew,
// 2026-10-29: "an instructor page that tells me exactly why everything's
// happening and exactly how everything is happening").

import { useState } from "react";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { localWorksheet, openTo } from "../localWorksheets.js";
import { useClassState } from "../store.js";
import { Shell, useAllSheets, useClipUrls } from "./control.jsx";
import { Face } from "../portal/bits.jsx";
import { StudentLink } from "../StudentPage.jsx";
import { audioOf, FORMAT_SAY, MAX_BYTES } from "./audio.js";
import { MAX_STORY_SECONDS } from "./storymodel.js";
import * as P from "./pre.jsx";
import * as R from "./research.jsx";
import * as I from "./ideas.jsx";

const lower = (s) => String(s || "").trim().toLowerCase();
const when = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function PreReview({ config, worksheetKey, roster }) {
  const [sheets, error] = useAllSheets(config, worksheetKey);
  const [data] = useClassState(config.storageKey);
  const urls = useClipUrls(config, worksheetKey, sheets);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  if (error) return <Shell config={config}><p className="pt-sub">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell config={config}><p className="pt-sub">Loading the sheets.</p></Shell>;
  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const rows = people.map(p => ({ student: p, sheet: byEmail.get(lower(p.email)) || null }));
  const submitted = rows.filter(r => r.sheet?.submitted_at).length;
  const started = rows.filter(r => r.sheet && !r.sheet.submitted_at).length;
  const notIn = rows.filter(r => !r.sheet?.submitted_at).map(r => r.student.name);
  const cards = rows.filter(r => r.sheet).sort((x, y) => (y.sheet.submitted_at ? 1 : 0) - (x.sheet.submitted_at ? 1 : 0)
    || String(y.sheet.submitted_at || "").localeCompare(String(x.sheet.submitted_at || "")) || x.student.name.localeCompare(y.student.name));
  return (
    <Shell config={config}>
      <style>{REVIEW_CSS}</style>
      <header className="aic-top">
        <div className="aic-titles">
          <h1 className="pt-h1">{P.DEFAULT_COPY.title}</h1>
          <p className="pt-sub">{P.DEFAULT_COPY.credit} This page asks again every half minute.</p>
        </div>
        {sections.length > 1 ? (
          <div className="pt-seg" role="tablist" aria-label="Section">
            {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"pt-focus" + (s === section ? " on" : "")} onClick={() => setSection(s)}>{s}</button>)}
          </div>
        ) : null}
      </header>
      <div className="pt-tiles" aria-label="Running summary">
        <div className="pt-tile aic-t-done"><span className="pt-tileN">{submitted}</span><span className="pt-tileL">Submitted</span></div>
        <div className="pt-tile aic-t-due"><span className="pt-tileN">{started}</span><span className="pt-tileL">Started</span></div>
        <div className="pt-tile"><span className="pt-tileN">{rows.length - submitted - started}</span><span className="pt-tileL">Not opened</span></div>
      </div>
      {notIn.length ? (
        <details className="aic-fold">
          <summary className="pt-focus">Not submitted yet, {notIn.length}</summary>
          <div className="aic-names">{notIn.map(n => <span key={n} className="pt-gpill off">{n}</span>)}</div>
        </details>
      ) : <p className="pt-quiet">Everyone is in.</p>}
      <div className="pt-stack aic-cards">
        {cards.map(({ student, sheet }) => {
          const a = sheet.answers || {};
          const clip = audioOf(a.audio);
          const left = P.missingOf(a).length;
          return (
            <article key={student.email} className={"pt-row aic-card" + (sheet.submitted_at ? "" : " due")}>
              <div className="aic-head">
                <div className="aic-who">
                  <Face config={config} data={data} name={student.name} size={40} />
                  <div className="pt-main">
                    <p className="pt-title"><StudentLink config={config} student={student} /></p>
                    <p className={"pt-when " + (sheet.submitted_at ? "done" : "due")}><span>{sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) : "Started, not submitted"}</span></p>
                    <p className="pt-meta">{left ? left + (left === 1 ? " part empty" : " parts empty") : "Every part filled"}</p>
                  </div>
                </div>
              </div>
              <div className="apr-doc"><style>{P.PRE_CSS}</style><P.PreView answers={a} url={clip ? urls[clip.path] || "" : ""} /></div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}

const REVIEW_CSS = `
.apr-doc{margin-top:12px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
.apr-doc .aspd{padding:26px 28px 30px}
`;

export function PreControl({ config, worksheetKey, roster }) {
  const [data] = useClassState(config.storageKey);
  const [sheets] = useAllSheets(config, worksheetKey);
  const local = localWorksheet(worksheetKey);
  const base = "/" + config.id + "/worksheets/" + worksheetKey;
  const asg = (data?.assignments || config.assignments || []).find(a => a.id === "audio-pre") || null;
  const n = sheets ? sheets.length : null;
  return (
    <Shell>
      <h1 className="aic-title">{P.DEFAULT_COPY.title + ", how the sheet works"}</h1>
      <p className="aic-p"><a className="aic-a" href={base}>The sheet</a> · <a className="aic-a" href={base + "?review"}>Review</a> · <a className="aic-a" href={"/" + config.id + "/worksheets/" + R.AUDIO_RESEARCH_KEY + "?control"}>Audio exercise control</a> · <a className="aic-a" href={"/" + config.id + "/worksheets/" + I.AUDIO_IDEAS_KEY + "?control"}>Ideas control</a></p>

      <h2 className="aic-h2">Open</h2>
      <p className="aic-p">{local ? (openTo(local, config.id, data) ? "Open to " + config.code + " students now." : "Not open to " + config.code + " students.") : "Not registered."} The registry says {JSON.stringify(local?.open)}; the class's worksheetsOpen switch, when set, wins: {JSON.stringify(data?.worksheetsOpen?.[worksheetKey] ?? null)}. Andrew, 2026-11-06: "let's open this to comm 3 the moment it's built."</p>

      <h2 className="aic-h2">The challenge</h2>
      <p className="aic-p">The plan row's challenge <code>audio-pre</code>{asg ? <>, {asg.title}, due {asg.due} {asg.dueTime}, scale {asg.scale || "letters"}, weight {asg.weight}</> : ", not on the plan row"}. Its instructionsUrl {asg?.instructionsUrl ? <>is <code>{asg.instructionsUrl}</code></> : "is empty"}; that address is what ties the sheet to the challenge: the assignment page shows the student their sheet read back, the Grade view lays every hand-in over the challenge, and the door on the student home runs until the due date. The database locks the sheet after the due date only once a worksheet_deadlines row for <code>{worksheetKey}</code> and <code>{config.id}</code> is there (sql/audio-story.sql is the pattern); without it nothing locks.</p>

      <h2 className="aic-h2">Where the words come from</h2>
      <p className="aic-p">Every line a student reads is in <code>pre.jsx</code> DEFAULT_COPY, in his words of 2026-11-06, and editable in place on the sheet by the instructor (Edit the words); edits live on the row <code>{P.COPY_ROW}</code>. The seven questions are <code>q.&lt;id&gt;</code> there, {P.QUESTIONS.map(q => q[0]).join(", ")}; the checklist laid in is CHECKLIST in the code.</p>

      <h2 className="aic-h2">Pre-filled, once</h2>
      <p className="aic-p">The first time a student opens the sheet, after their answers and their audio exercise sheet have both loaded, four things come across from the exercise into this sheet's own fields when the field here is blank: <code>story</code>, <code>treatment</code>, <code>includes</code>, and <code>sources</code> (the exercise's article, media, person and place lines, in that order). The checklist is laid into <code>todo</code> when it is empty. Then <code>prefilled</code> is set to 1 and the copy never runs again, so nothing a student typed is ever overwritten. A student with no exercise sheet gets the checklist only. The exercise is read under the rules (worksheet_owns), the way the exercise reads the ideas sheet.</p>

      <h2 className="aic-h2">Shown, not copied</h2>
      <p className="aic-p">The three ideas with his marks are read live off the ideas sheet and its review row (research.jsx markedIdeas), the chosen one marked from the exercise's <code>picked</code>; the pair line reads the row <code>audio-pairs-plan</code>. The sources the student already has are shown from the exercise sheet above the editable list. None of that is stored here.</p>

      <h2 className="aic-h2">Fields</h2>
      <p className="aic-p">One worksheet row a field, saved as typed: {P.FIELDS.map(f => <code key={f}>{f} </code>)}. <code>asked</code> holds the chosen question ids, one a line, at most {P.PICK}; each answer is <code>q:&lt;id&gt;</code>. <code>audio</code> is JSON with the path, the seconds and the file's name. <code>todo</code> is JSON, a list of {"{ text, done }"}. Submit wants: story, treatment, includes, {P.PICK} questions chosen and each answered, the clip, at least one source, the reflection, and at least one step on the checklist. The sheet counts {P.PARTS_TO_FILL} parts.</p>

      <h2 className="aic-h2">The clip</h2>
      <p className="aic-p">One file, {FORMAT_SAY}, up to {Math.round(MAX_STORY_SECONDS / 60)} minutes (a file that reads as {MAX_STORY_SECONDS}.9 seconds passes, for rounding) and under {Math.round(MAX_BYTES / 1024 / 1024)} MB, the audio story's limits. The browser reads the length off the file first. The file goes into the private visual-story bucket at {config.id}/(email)/audio-(id).(ext) as the student, the same place and rules as the exercise and the story; no new bucket rule was needed. The student plays it back through a signed link an hour long made with their own token; the review signs links through the server.</p>

      <h2 className="aic-h2">The document on the right</h2>
      <p className="aic-p">The right side of the sheet is the pre-production as a page, drawn from the same answers as they type (pre.jsx PreView). The review shows each student's sheet as that same page, and so does the instructor's read at ?s=. A part that is empty is not drawn.</p>

      <h2 className="aic-h2">Now</h2>
      <p className="aic-p">{n === null ? "Reading the sheets." : n + (n === 1 ? " sheet" : " sheets") + " started, " + (sheets.filter(s => s.submitted_at).length) + " submitted, of " + roster.filter(s => s.email && !isLurker(s.name)).length + " on the roster."}</p>
    </Shell>
  );
}
