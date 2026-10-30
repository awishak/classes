// The instructor's pages for the two audio story sheets, besides the board.
//
// ResearchReview is /comm3/worksheets/audio-research?review: every sheet, by
// student, with who is in and who is not, asked again every half minute.
//
// AudioControl is ?control on either sheet. Andrew, 2026-10-29: "every single
// time we do a worksheet, I want like a control page, an instructor page that
// tells me exactly why everything's happening and exactly how everything is
// happening." So the page states the mechanism from the code itself: the
// fields and which are required, where every answer lives, how a mark is
// stored and read back, how often each page asks, who can see what, and the
// addresses. Then one student, chosen from the roster, as the data holds
// them. Nothing is written here.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { localWorksheet, openTo } from "../localWorksheets.js";
import { useClassState } from "../store.js";
import * as I from "./ideas.jsx";
import * as R from "./research.jsx";
import { linesOf } from "./bits.jsx";
import { audioOf } from "./audio.js";
import { StudentLink } from "../StudentPage.jsx";
import * as TOKENS from "../tokens.js";

const call = async (body) => {
  const r = await fetch("/api/worksheet-submits", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};
const lower = (s) => String(s || "").trim().toLowerCase();
const when = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Signed links for the clips on a set of sheets, through the server, so the
// PIN sign-in can play them too. { [path]: url }.
function useClipUrls(config, worksheetKey, sheets) {
  const [urls, setUrls] = useState({});
  const paths = (sheets || []).map(s => audioOf(s.answers?.audio)?.path).filter(Boolean).sort().join("\n");
  useEffect(() => {
    if (!paths) return undefined;
    let alive = true;
    call({ groupKey: config.id, key: worksheetKey, sign: paths.split("\n") }).then(out => { if (alive) setUrls(out.urls || {}); }).catch(() => {});
    return () => { alive = false; };
  }, [config.id, worksheetKey, paths]);
  return urls;
}

function useAllSheets(config, worksheetKey, every = 30000) {
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const ask = () => call({ groupKey: config.id, key: worksheetKey, all: true })
      .then(out => { if (alive) setSheets(out.sheets); })
      .catch(e => { if (alive) setError(e.message); });
    ask();
    const t = setInterval(ask, every);
    return () => { alive = false; clearInterval(t); };
  }, [config.id, worksheetKey, every]);
  return [sheets, error];
}

export function ResearchReview({ config, worksheetKey, roster }) {
  const [sheets, error] = useAllSheets(config, worksheetKey);
  const urls = useClipUrls(config, worksheetKey, sheets);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  if (error) return <Shell><p className="aic-p">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="aic-p">Loading the sheets.</p></Shell>;
  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const rows = people.map(p => ({ student: p, sheet: byEmail.get(lower(p.email)) || null }));
  const submitted = rows.filter(r => r.sheet?.submitted_at).length;
  const notIn = rows.filter(r => !r.sheet?.submitted_at).map(r => r.student.name);
  return (
    <Shell>
      <h1 className="aic-title">{R.DEFAULT_COPY.title}, every sheet</h1>
      {sections.length > 1 ? (
        <div className="aic-tabs" role="tablist">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"aic-tab" + (s === section ? " aic-on" : "")} onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}
      <p className="aic-p">{submitted + " submitted, " + (rows.filter(r => r.sheet).length - submitted) + " started, " + rows.filter(r => !r.sheet).length + " not opened. This page asks again every half minute."}</p>
      {notIn.length ? <p className="aic-muted">Not submitted yet: {notIn.join(", ")}.</p> : <p className="aic-muted">Everyone is in.</p>}
      {rows.filter(r => r.sheet).map(({ student, sheet }) => (
        <article key={student.email} className="aic-row">
          <div className="aic-head">
            <b className="aic-name"><StudentLink config={config} student={student} /></b>
            <span className={"aic-chip" + (sheet.submitted_at ? " aic-ok" : "")}>{sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) : "Started"}</span>
          </div>
          <ResearchAnswers answers={sheet.answers} urls={urls} />
        </article>
      ))}
    </Shell>
  );
}

function ResearchAnswers({ answers, urls = {} }) {
  const a = answers || {};
  const clip = audioOf(a.audio);
  const line = (k, v) => (String(v || "").trim() ? <p key={k} className="aic-line"><span className="aic-k">{R.DEFAULT_COPY[k]}</span>{v}</p> : null);
  return (
    <div className="aic-entry">
      {clip ? (
        <div className="aic-clip">
          <span className="aic-k">{R.DEFAULT_COPY.audioHead}</span>
          {urls[clip.path] ? <audio controls preload="metadata" src={urls[clip.path]} /> : <span className="aic-muted">Signing the link.</span>}
          <span className="aic-muted">{clip.name}{clip.seconds ? " · " + Math.round(clip.seconds) + " s" : ""}</span>
        </div>
      ) : null}
      {line("storyAsk", a.story)}
      {line("treatmentAsk", a.treatment)}
      {line("includesAsk", linesOf(a.includes).join("\n"))}
      {R.RESEARCH.map(r => line("ask." + r.field, linesOf(a[r.field]).join("\n")))}
      {line("exampleHead", linesOf(a.example).join("\n"))}
      {R.missingOf(a).length ? <p className="aic-muted">{R.missingOf(a).length} boxes empty.</p> : null}
    </div>
  );
}

function IdeasAnswers({ answers, review }) {
  const a = answers || {};
  const marks = I.marksOf(review);
  const line = (label, v) => (String(v || "").trim() ? <p className="aic-line"><span className="aic-k">{label}</span>{v}</p> : null);
  return (
    <div className="aic-entry">
      {line(I.DEFAULT_COPY.anyAsk, linesOf(a.any).join("\n"))}
      {line(I.DEFAULT_COPY.toolsAsk, linesOf(a.tools).join("\n"))}
      {line(I.DEFAULT_COPY.strengthAsk, [...linesOf(a.strength), String(a.other || "").trim()].filter(Boolean).join(", "))}
      {line(I.DEFAULT_COPY.workAsk, linesOf(a.work).join(", "))}
      {I.SLOTS.map((s, i) => (
        <div key={s} className="aic-idea">
          <span className="aic-k">Idea {i + 1}{marks[s] ? ": " + I.markOf(marks[s]).say : ": no mark"}</span>
          {line(I.DEFAULT_COPY.ideaAsk, a["idea:" + s])}
          {line(I.DEFAULT_COPY.whyAsk, linesOf(a["why:" + s]).join("\n"))}
          {line(I.DEFAULT_COPY.planAsk, linesOf(a["plan:" + s]).join("\n"))}
        </div>
      ))}
      <p className="aic-muted">Review row: {review ? review.status + ", note " + review.note + ", at " + when(review.reviewed_at) : "none"}. Status the sheet reads as: {I.statusFor(marks)}.</p>
    </div>
  );
}

export default function AudioControl({ config, worksheetKey, roster }) {
  const ideas = worksheetKey === I.AUDIO_IDEAS_KEY;
  const [data] = useClassState(config.storageKey);
  const [sheets, error] = useAllSheets(config, worksheetKey);
  const urls = useClipUrls(config, worksheetKey, sheets);
  const people = roster.filter(s => s.email && !isLurker(s.name));
  const [who, setWho] = useState("");
  const local = localWorksheet(worksheetKey);
  const base = "/" + config.id + "/worksheets/" + worksheetKey;
  const sheet = sheets && who ? sheets.find(s => s.viewer_id === lower(who)) || null : null;
  const copyRow = ideas ? I.COPY_ROW : R.COPY_ROW;
  const fields = ideas ? I.FIELDS : R.FIELDS;
  const required = ideas ? I.REQUIRED : R.REQUIRED;

  return (
    <Shell>
      <h1 className="aic-title">{(ideas ? I.DEFAULT_COPY.title : R.DEFAULT_COPY.title) + ", how the sheet works"}</h1>
      <p className="aic-p"><a className="aic-a" href={base}>The sheet</a> · <a className="aic-a" href={base + "?review"}>Review</a>{ideas ? <> · <a className="aic-a" href={base + "?board"}>Board</a></> : null}{ideas ? <> · <a className="aic-a" href={"/" + config.id + "/worksheets/" + R.AUDIO_RESEARCH_KEY + "?control"}>Research control</a></> : <> · <a className="aic-a" href={"/" + config.id + "/worksheets/" + I.AUDIO_IDEAS_KEY + "?control"}>Ideas control</a></>}</p>

      <h2 className="aic-h2">Open</h2>
      <p className="aic-p">{local ? (openTo(local, config.id, data) ? "Open to " + config.code + " students now." : "Not open to " + config.code + " students.") : "Not registered."} The registry says {JSON.stringify(local?.open)}; the class's worksheetsOpen switch, when set, wins: {JSON.stringify(data?.worksheetsOpen?.[worksheetKey] ?? null)}.</p>

      <h2 className="aic-h2">Fields</h2>
      <p className="aic-p">One row per field per student in worksheet_answers, written as typed, 700 ms after the last keystroke, with a copy kept in the browser until the server has the same words. Required to submit: {required.join(", ")}.{ideas ? " Not required: other." : ""}</p>
      <ul className="aic-list">
        {fields.map(f => <li key={f}><code>{f}</code>{ideas ? ideaFieldSay(f) : researchFieldSay(f)}</li>)}
      </ul>
      {ideas ? <p className="aic-p">Strength options: {I.STRENGTHS.join(", ")}. Work options: {I.WORK.join(", ")}. Chosen options are stored one a line in the field.</p> : null}

      <h2 className="aic-h2">Submit</h2>
      <p className="aic-p">Submit writes submitted_at on the student's worksheet_sheets row; the first submit also sets first_submitted_at, which the lateness read uses. {ideas ? "Nothing shows on the review or the board until submitted_at is set. From then on every answer still saves as typed, so an edit after submitting shows on the board on its next ask." : "The review shows started and submitted sheets."} Submitting again overwrites submitted_at only.</p>

      {ideas ? (<>
        <h2 className="aic-h2">Marks</h2>
        <p className="aic-p">Five marks, pressed on the review page, one per idea: {I.MARKS.map(m => m.say + " (" + m.id + ")").join(", ")}. Pressing the mark already on takes the mark off. A sheet's marks are one row in worksheet_reviews: note holds JSON by slot, like {"{"}"a":"top","c":"ohno"{"}"}; status is approved when any mark is Top idea or Good to go!, needs_work when only the other three are on, and the row is deleted when no mark is on. The write goes through /api/worksheet-submits with the service key, so no browser writes a mark. A student reads their own row under the rules (worksheet_owns) every {I.POLL / 1000} seconds while their tab is showing, which is how the mark appears on their sheet.</p>
        <h2 className="aic-h2">Everyone's ideas, and asking for an idea</h2>
        <p className="aic-p">?all is a page any signed-in student on the roster can open: every submitted idea in their section with the name and the mark, Top ideas first, read through /api/audio-ideas, which checks the caller's session email against the roster and returns ideas, marks and asks only (never strengths, work preference or the general answers). Under another student's idea, Ask to work on this writes the student's own field <code>want</code>, one owner|slot a line; under their own idea, who asked. The page asks again every ten seconds. The sheet links to the page once submitted.</p>
        <h2 className="aic-h2">Pairs</h2>
        <p className="aic-p">The Pairs view on the review (per section) lists everyone who submitted. Suggest pairs scores every two people who said In a pair or Either one: 3 when one asked for the other's idea, 2 when their Top or Good to go! ideas share a word, 1 when one is technical and the other tells stories or researches, 1 when both said In a pair outright; highest first, then anyone left who said In a pair is paired with the next such person, and everyone else is on their own. The story is the idea asked for, else a Top idea, else a Good to go!. Tap a person then another to pair them, Split to part a pair, pick the story from either member's ideas or type one. Every change writes the row <code>{"audio-pairs-plan"}</code> (instructor-only), which the student's everyone's-ideas page and audio exercise read to say who they work with and on what.</p>
        <h2 className="aic-h2">The board and the review</h2>
        <p className="aic-p">Both ask /api/worksheet-submits for every sheet on this key every {I.POLL / 1000} seconds while the tab is showing, and stop asking while the tab is hidden. The board shows no names and no strengths, only ideas and marks, newest sheet first. The review shows names, strengths, work preference, and the two general answers under a fold. Sections: the 8:00 and the 10:30 are tabs, off the student's section on the roster.</p>
      </>) : (<>
        <h2 className="aic-h2">The audio story</h2>
        <p className="aic-p">One file, m4a, mp3, wav or aac, at most 60 seconds (a file that reads as 60.9 passes, for rounding) and under 30 MB. The browser reads the length off the file first and refuses a longer one or another format before anything goes up. The file goes straight into the private visual-story bucket at comm3/(email)/audio-(id).(ext) as the student; the bucket's rules keep a student to their own folder and let the instructor read every folder. The field <code>audio</code> holds JSON with the path, the seconds and the file's name. Remove clears the field and leaves the file in the bucket. The student plays the clip back through a signed link an hour long made with their own token; this page and the review sign links through the server. The bucket takes audio only once sql/audio-exercise-bucket.sql has run; before that the upload is refused and the sheet says so.</p>
        <h2 className="aic-h2">The okayed idea</h2>
        <p className="aic-p">At the top of the sheet the student sees their ideas marked Top idea or Good to go! on the ideas sheet, read under the rules from their own ideas sheet and review row once on load, as chips that fill the story line when tapped. A student with no okayed idea sees no chips and types the story line.</p>
      </>)}

      <h2 className="aic-h2">Words</h2>
      <p className="aic-p">Every line a student reads has a default in the code and can be changed in place on the sheet while signed in as the instructor (Edit the words). Edits live in the app_data row <code>{copyRow}</code>, which only an instructor can write. A cleared line puts the default back.</p>

      <h2 className="aic-h2">Who sees what</h2>
      <p className="aic-p">A student signed in by email sees and writes their own sheet only. The instructor's own email gets a sheet of its own for trying the page. The review, the board and this page need an instructor session or the PIN. Reads of every sheet go through the server with the service key.</p>

      <h2 className="aic-h2">One student</h2>
      {error ? <p className="aic-p">Could not read the sheets: {error}</p> : null}
      <select className="aic-select" value={who} onChange={e => setWho(e.target.value)} aria-label="Student">
        <option value="">Choose a student</option>
        {people.map(p => <option key={p.email} value={p.email}>{p.name}{sectionOf(p) ? " · " + sectionOf(p) : ""}</option>)}
      </select>
      {who && sheets ? (sheet ? (<>
        <p className="aic-p">{sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) + "." : "Started, not submitted."} {Object.keys(sheet.answers || {}).length} fields on the server.</p>
        {ideas ? <IdeasAnswers answers={sheet.answers} review={sheet.review} /> : <ResearchAnswers answers={sheet.answers} urls={urls} />}
      </>) : <p className="aic-p">No sheet opened yet.</p>) : null}
    </Shell>
  );
}

const ideaFieldSay = (f) => {
  const say = { any: " any audio story, lines", tools: " the tools, lines", strength: " strengths chosen, lines", other: " the Other strength, a line", work: " work preference chosen, lines", want: " ideas asked for, owner|slot a line, written from ?all" };
  if (say[f]) return say[f];
  const [part, slot] = f.split(":");
  return " idea " + (I.SLOTS.indexOf(slot) + 1) + ", " + ({ idea: "the idea, a line", why: "why someone would want to hear the story, lines", plan: "what this story takes, lines" })[part];
};
const researchFieldSay = (f) => ({ audio: " the 60-second audio story, JSON { path, seconds, name }", story: " the story, a line", treatment: " the paragraph treatment", includes: " what the story includes, lines", article: " articles, lines", media: " other media, lines", person: " people to interview, lines", place: " places to capture audio, lines", example: " a good audio story found, lines" })[f] || "";

function Shell({ children }) {
  return <div className="aic"><style>{CSS}</style><div className="aic-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.aic{padding:20px 16px 80px;color:${T.primary}}
.aic-in{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.aic-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.aic-h2{margin:12px 0 0;font-size:20px;font-weight:700}
.aic-p{margin:0;font-size:16px;line-height:1.5;color:${T.secondary}}
.aic-p code,.aic-list code{font-size:14px;background:${S.sunk};padding:1px 6px;border-radius:6px;color:${T.primary}}
.aic-a{color:${T.primary};font-weight:600}
.aic-list{margin:0;padding-left:20px;font-size:15.5px;line-height:1.6;color:${T.secondary}}
.aic-tabs{display:flex;gap:8px;flex-wrap:wrap}
.aic-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer;min-height:34px}
.aic-on{background:${T.primary};border-color:${T.primary};color:${S.page}}
.aic-select{font:inherit;font-size:16px;padding:8px 12px;border-radius:10px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};max-width:360px}
.aic-row{border-top:1px solid ${L.soft};padding:16px 0 4px;display:flex;flex-direction:column;gap:10px}
.aic-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.aic-name{font-size:18px}
.aic-chip{font-size:13px;font-weight:600;border-radius:999px;padding:3px 10px;border:1px solid ${L.strong};color:${T.secondary}}
.aic-ok{border-color:${ST.ok};color:${ST.ok}}
.aic-entry{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:10px;background:${S.sunk}}
.aic-clip{display:flex;flex-direction:column;gap:6px;align-items:flex-start}
.aic-clip audio{width:min(100%,480px)}
.aic-idea{display:flex;flex-direction:column;gap:4px;padding:8px 10px;border-radius:8px;background:${S.card}}
.aic-line{margin:0;font-size:15.5px;line-height:1.5;white-space:pre-wrap}
.aic-k{display:block;font-size:13px;font-weight:600;color:${T.muted}}
.aic-muted{margin:0;font-size:14.5px;color:${T.muted}}
`;
