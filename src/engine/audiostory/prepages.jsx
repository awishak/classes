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
import { Shell, useAllSheets, useClipUrls, useInstructorRead } from "./control.jsx";
import { Face, Chip } from "../portal/bits.jsx";
import { StudentLink } from "../StudentPage.jsx";
import { audioOf, FORMAT_SAY, MAX_BYTES } from "./audio.js";
import { MAX_STORY_SECONDS } from "./storymodel.js";
import * as P from "./pre.jsx";
import * as R from "./research.jsx";
import * as I from "./ideas.jsx";

const lower = (s) => String(s || "").trim().toLowerCase();
const when = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Claude's read of each clip, beside the student's own page. Andrew,
// 2026-11-12: "analyze it, including analyzing their 5 min audio clips
// transcripts ... openings, thesis statements and closings that meet what i
// have" on the three boards (best openers, best thesis statements, closers),
// then "if they have an interview, if they have a good structure, if they are
// bringing in new information as opposed to saying only what they think," and
// "deploy a page for me to see, following our standard structure for review."
// The structure is the Culture Guide Review's (sitdown2/control.jsx): Claude's
// read above each student's work, everything running down the page, then a
// line naming whose work follows. The read is one file for the instructor
// alone (control.jsx useInstructorRead), written by
// scripts/comm3-audio-pre-read-push.mjs: { at, notes: [..], students: {
// [email]: { read, meets, opener, thesis, closer, interview, structure, news,
// gaps, transcript } } }. Students never see the file.
export const READ_SHEET = "audio-pre";
const VERDICT = { meets: "Meets the board", partly: "Partly", not: "Not yet" };
const MARKS = [["direct", "Direct"], ["eloquent", "Eloquent"], ["shift", "Shift"], ["tension", "Tension"], ["bigger", "Bigger picture"], ["money", "Money"]];

function ReadPart({ label, part, marks = false }) {
  const p = part || {};
  return (
    <section className={"apr-part apr-" + (p.verdict || "not")}>
      <div className="apr-ph">
        <h3 className="apr-pl">{label}</h3>
        {p.kind ? <span className="apr-kind">{p.kind}</span> : null}
        <span className="apr-v">{VERDICT[p.verdict] || VERDICT.not}</span>
      </div>
      {p.quote ? <p className="apr-quote">{p.at ? <span className="apr-at">{p.at}</span> : null}{p.quote}</p> : null}
      {p.say ? <p className="apr-say">{p.say}</p> : null}
      {marks ? <div className="apr-marks">{MARKS.map(([id, say]) => <span key={id} className={"apr-mark" + ((p.marks || []).includes(id) ? " on" : "")}>{say}</span>)}</div> : null}
    </section>
  );
}

export function ReadPanel({ read, sheet, at }) {
  const fact = (label, x) => (x && x.say ? <p className="apr-fact"><b>{label}</b> {x.say}</p> : null);
  // A read written before the student handed in again says so.
  const again = !!(sheet?.submitted_at && at && new Date(sheet.submitted_at).getTime() > new Date(at).getTime());
  return (
    <div className="apr-read">
      <div className="apr-rh"><h2 className="apr-rt">Claude's read</h2><span className="apr-n">{read.meets} of 3 meet the board</span></div>
      {again ? <p className="apr-fact"><b>{"Handed in again " + when(sheet.submitted_at) + ", after this read was written."}</b></p> : null}
      {read.read ? <p className="apr-fact">{read.read}</p> : null}
      <div className="apr-parts">
        <ReadPart label="Opener" part={read.opener} />
        <ReadPart label="Thesis" part={read.thesis} marks />
        <ReadPart label="Closer" part={read.closer} />
      </div>
      <div className="apr-facts">
        {fact("Interview.", read.interview)}
        {fact("Structure.", read.structure)}
        {fact("New information.", read.news)}
        {fact("Music and field audio.", read.gaps)}
      </div>
      {(read.transcript || []).length ? (
        <details className="aic-fold">
          <summary className="pt-focus">The transcript</summary>
          <div className="apr-script">{read.transcript.map((t, i) => <p key={i}><span className="apr-at">{t.at}</span>{t.text}</p>)}</div>
        </details>
      ) : null}
    </div>
  );
}

// The count of each kind across the cards on screen, most common first.
const tally = (list) => {
  const n = {};
  list.forEach(k => { if (k) n[k] = (n[k] || 0) + 1; });
  return Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

export function ReadSummary({ reads, notes }) {
  if (!reads.length) return null;
  const meets = (k) => reads.filter(r => r[k]?.verdict === "meets").length;
  const row = (label, pairs) => <p className="apr-fact"><b>{label}</b> {pairs.map(([k, n]) => k + " " + n).join(", ")}.</p>;
  return (
    <section className="apr-sum" aria-label="Claude's read of the class">
      <h2 className="apr-rt">Claude's read, {reads.length} clips in this section</h2>
      <div className="pt-tiles apr-tiles">
        <div className="pt-tile"><span className="pt-tileN">{meets("opener")}</span><span className="pt-tileL">Openers meet the board</span></div>
        <div className="pt-tile"><span className="pt-tileN">{meets("thesis")}</span><span className="pt-tileL">Thesis statements meet</span></div>
        <div className="pt-tile"><span className="pt-tileN">{meets("closer")}</span><span className="pt-tileL">Closers meet</span></div>
        <div className="pt-tile"><span className="pt-tileN">{reads.filter(r => r.interview?.has).length}</span><span className="pt-tileL">Have an interview</span></div>
      </div>
      {row("Openers by kind.", tally(reads.map(r => r.opener?.kind)))}
      {row("Closers by kind.", tally(reads.map(r => r.closer?.kind)))}
      {(notes || []).map((n, i) => <p key={i} className="apr-fact">{n}</p>)}
    </section>
  );
}

export function PreReview({ config, worksheetKey, roster }) {
  const [sheets, error] = useAllSheets(config, worksheetKey);
  const read = useInstructorRead(config, READ_SHEET);
  const [order, setOrder] = useState("read");
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
  const readOf = (r) => read?.students?.[lower(r.student.email)] || null;
  const byRead = !!read && order === "read";
  // Submitted first. Then by the read, most parts meeting the board first,
  // when there is one and it is asked for; else the newest hand-in first.
  const cards = rows.filter(r => r.sheet).sort((x, y) => (y.sheet.submitted_at ? 1 : 0) - (x.sheet.submitted_at ? 1 : 0)
    || (byRead ? (readOf(y)?.score ?? -1) - (readOf(x)?.score ?? -1) : 0)
    || (byRead ? 0 : String(y.sheet.submitted_at || "").localeCompare(String(x.sheet.submitted_at || ""))) || x.student.name.localeCompare(y.student.name));
  const reads = rows.map(readOf).filter(Boolean);
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
      {read ? <ReadSummary reads={reads} notes={read.notes} /> : null}
      {read ? (
        <div className="pt-chips" role="tablist" aria-label="Order">
          <Chip on={order === "read"} onClick={() => setOrder("read")}>Strongest first</Chip>
          <Chip on={order === "new"} onClick={() => setOrder("new")}>Newest first</Chip>
        </div>
      ) : null}
      <div className="pt-stack aic-cards">
        {cards.map(({ student, sheet }) => {
          const mine = readOf({ student });
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
              {mine ? <ReadPanel read={mine} sheet={sheet} at={read.at} /> : null}
              {mine ? <p className="apr-work">{student.name.split(" ")[0] + "'s pre-production, as written"}</p> : null}
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
.apr-sum{display:flex;flex-direction:column;gap:10px;margin:16px 0;padding:18px 20px;border-radius:16px;background:var(--surface-card);box-shadow:0 0 0 1px var(--line-strong)}
.aic .apr-tiles{max-width:none}
.apr-read{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:14px;background:var(--surface-sunk)}
.apr-rh{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.apr-rt{margin:0;font-size:20px;font-weight:700}
.apr-n{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
.apr-parts{display:flex;flex-direction:column;gap:10px}
.apr-part{display:flex;flex-direction:column;gap:8px;padding:14px 16px 14px 20px;border-radius:12px;background:var(--surface-card);box-shadow:inset 5px 0 0 var(--pt-late-ink)}
.apr-part.apr-meets{box-shadow:inset 5px 0 0 var(--pt-done-ink)}
.apr-part.apr-partly{box-shadow:inset 5px 0 0 var(--pt-due-ink)}
.apr-work{margin:4px 0 0;padding-top:16px;border-top:1px solid var(--line-strong);font-size:16px;font-weight:600}
.apr-ph{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.apr-pl{margin:0;font-size:17px;font-weight:700}
.apr-kind{font-size:15px;font-weight:600;padding:2px 10px;border-radius:999px;background:var(--surface-sunk);color:var(--text-primary)}
.apr-v{margin-left:auto;font-size:15px;font-weight:700;padding:2px 10px;border-radius:999px;background:var(--pt-late);color:var(--pt-late-ink)}
.apr-meets .apr-v{background:var(--pt-done);color:var(--pt-done-ink)}
.apr-partly .apr-v{background:var(--pt-due);color:var(--pt-due-ink)}
.apr-quote{margin:0;font-family:var(--pt-serif);font-size:17px;line-height:1.45;overflow-wrap:anywhere}
.apr-at{font-family:var(--font,inherit);font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text-secondary);margin-right:8px}
.apr-say{margin:0;font-size:17px;line-height:1.5;color:var(--text-primary)}
.apr-marks{display:flex;flex-wrap:wrap;gap:6px}
.apr-mark{font-size:14px;font-weight:600;padding:2px 10px;border-radius:999px;box-shadow:0 0 0 1px var(--line-strong);color:var(--text-secondary)}
.apr-mark.on{background:var(--text-primary);color:var(--surface-page);box-shadow:none}
.apr-facts{display:flex;flex-direction:column;gap:8px}
.apr-fact{margin:0;font-size:17px;line-height:1.5}
.apr-fact b{font-weight:700}
.apr-script{display:flex;flex-direction:column;gap:10px;padding:8px 4px}
.apr-script p{margin:0;font-size:16px;line-height:1.55;overflow-wrap:anywhere}
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
      <p className="aic-p">Every line a student reads is in <code>pre.jsx</code> DEFAULT_COPY, in his words of 2026-11-06, and editable in place on the sheet by the instructor (Edit the words); edits live on the row <code>{P.COPY_ROW}</code>. The seven questions are <code>q.&lt;id&gt;</code> there, {P.QUESTIONS.map(q => q[0]).join(", ")}. The going-forward checklist that used to close the sheet was removed 2026-11-09 at his word.</p>

      <h2 className="aic-h2">Pre-filled, once</h2>
      <p className="aic-p">The first time a student opens the sheet, after their answers and their audio exercise sheet have both loaded, four things come across from the exercise into this sheet's own fields when the field here is blank: <code>story</code>, <code>treatment</code>, <code>includes</code>, and <code>sources</code> (the exercise's article, media, person and place lines, in that order). Then <code>prefilled</code> is set to 1 and the copy never runs again, so nothing a student typed is ever overwritten. A student with no exercise sheet starts blank. The exercise is read under the rules (worksheet_owns), the way the exercise reads the ideas sheet.</p>

      <h2 className="aic-h2">Shown, not copied</h2>
      <p className="aic-p">The three ideas with his marks are read live off the ideas sheet and its review row (research.jsx markedIdeas), the chosen one marked from the exercise's <code>picked</code>; the pair line reads the row <code>audio-pairs-plan</code>. The sources the student already has are shown from the exercise sheet above the editable list. None of that is stored here.</p>

      <h2 className="aic-h2">Fields</h2>
      <p className="aic-p">One worksheet row a field, saved as typed: {P.FIELDS.map(f => <code key={f}>{f} </code>)}. <code>asked</code> holds the chosen question ids, one a line, at most {P.PICK}; each answer is <code>q:&lt;id&gt;</code>. <code>audio</code> is JSON with the path, the seconds and the file's name. Submit wants: story, treatment, includes, {P.PICK} questions chosen and each answered, the clip, at least one source, and the reflection. The sheet counts {P.PARTS_TO_FILL} parts.</p>

      <h2 className="aic-h2">The clip</h2>
      <p className="aic-p">One file, {FORMAT_SAY}, up to {Math.round(MAX_STORY_SECONDS / 60)} minutes (a file that reads as {MAX_STORY_SECONDS}.9 seconds passes, for rounding) and under {Math.round(MAX_BYTES / 1024 / 1024)} MB, the audio story's limits. The browser reads the length off the file first. The file goes into the private visual-story bucket at {config.id}/(email)/audio-(id).(ext) as the student, the same place and rules as the exercise and the story; no new bucket rule was needed. The student plays it back through a signed link an hour long made with their own token; the review signs links through the server.</p>

      <h2 className="aic-h2">The document on the right</h2>
      <p className="aic-p">The right side of the sheet is the pre-production as a page, drawn from the same answers as they type (pre.jsx PreView). The review shows each student's sheet as that same page, and so does the instructor's read at ?s=. A part that is empty is not drawn.</p>

      <h2 className="aic-h2">Now</h2>
      <p className="aic-p">{n === null ? "Reading the sheets." : n + (n === 1 ? " sheet" : " sheets") + " started, " + (sheets.filter(s => s.submitted_at).length) + " submitted, of " + roster.filter(s => s.email && !isLurker(s.name)).length + " on the roster."}</p>
    </Shell>
  );
}
