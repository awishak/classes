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

import { useEffect, useRef, useState } from "react";
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
import { PORTAL_CSS } from "../portal/style.js";
import { Face, Chip, Io } from "../portal/bits.jsx";
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
export function useClipUrls(config, worksheetKey, sheets) {
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

export function useAllSheets(config, worksheetKey, every = 30000) {
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

// The four parts of a sheet, each its own colour on the page, and what counts
// as done in each. Andrew, 2026-11-02: "make it easier for me to go through
// diff parts, give me a running summary." A part tab shows that part alone on
// every card; the counts in the tabs and the bar follow the sheets as the page
// asks again.
const filled = (a, f) => !!String(a?.[f] || "").trim();
export const PARTS = [
  { id: "audio", say: "Audio", done: (a) => !!audioOf(a?.audio) },
  { id: "story", say: "Story", done: (a) => ["story", "treatment", "includes"].every(f => filled(a, f)) },
  { id: "research", say: "Research", done: (a) => R.RESEARCH.every(r => filled(a, r.field)) },
  { id: "example", say: "Good audio story", done: (a) => filled(a, "example") },
];

export function ResearchReview({ config, worksheetKey, roster }) {
  const [sheets, error] = useAllSheets(config, worksheetKey);
  const [data] = useClassState(config.storageKey);
  const urls = useClipUrls(config, worksheetKey, sheets);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  const [part, setPart] = useState("all");
  const [at, setAt] = useState(0);
  const list = useRef(null);
  const root = useRef(null);
  // Which card sits under the bar, read as the page scrolls; the bar's
  // buttons step from there. The bar sticks under the class's own nav, whose
  // height is read off the page.
  useEffect(() => {
    const read = () => {
      const nav = root.current?.previousElementSibling;
      if (nav && root.current) root.current.style.setProperty("--aic-nav", Math.round(nav.getBoundingClientRect().height) + "px");
      const cards = [...(list.current?.querySelectorAll(".aic-card") || [])];
      const top = (document.querySelector(".aic-bar")?.getBoundingClientRect().bottom || 0) + 12;
      const i = cards.findIndex(c => c.getBoundingClientRect().bottom > top);
      setAt(i < 0 ? Math.max(0, cards.length - 1) : i);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [sheets, part, section]);
  const jump = (i) => { const c = list.current?.querySelectorAll(".aic-card")[i]; if (c) { setAt(i); c.scrollIntoView({ block: "start", behavior: "smooth" }); } };
  if (error) return <Shell config={config}><p className="pt-sub">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell config={config}><p className="pt-sub">Loading the sheets.</p></Shell>;
  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const rows = people.map(p => ({ student: p, sheet: byEmail.get(lower(p.email)) || null }));
  const submitted = rows.filter(r => r.sheet?.submitted_at).length;
  const started = rows.filter(r => r.sheet && !r.sheet.submitted_at).length;
  const notIn = rows.filter(r => !r.sheet?.submitted_at).map(r => r.student.name);
  const done = Object.fromEntries(PARTS.map(p => [p.id, rows.filter(r => r.sheet && p.done(r.sheet.answers)).length]));
  // Submitted sheets first, newest hand-in first; then the started ones by name.
  const cards = rows.filter(r => r.sheet).sort((x, y) => (y.sheet.submitted_at ? 1 : 0) - (x.sheet.submitted_at ? 1 : 0)
    || String(y.sheet.submitted_at || "").localeCompare(String(x.sheet.submitted_at || "")) || x.student.name.localeCompare(y.student.name));
  const here = Math.min(at, Math.max(0, cards.length - 1));
  return (
    <Shell config={config} root={root}>
      <header className="aic-top">
        <div className="aic-titles">
          <h1 className="pt-h1">{R.DEFAULT_COPY.title}</h1>
          <p className="pt-sub">{R.DEFAULT_COPY.credit} This page asks again every half minute.</p>
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
      <div className="aic-bar">
        <div className="pt-chips aic-parts" role="tablist" aria-label="Part">
          <Chip on={part === "all"} onClick={() => setPart("all")}>Everything</Chip>
          {PARTS.map(p => (
            <button key={p.id} type="button" role="tab" aria-selected={part === p.id} className={"pt-chip pt-focus aic-p-" + p.id + (part === p.id ? " on" : "")} onClick={() => setPart(part === p.id ? "all" : p.id)}>
              {p.say} <b>{done[p.id]} of {rows.length}</b>
            </button>
          ))}
        </div>
        <div className="aic-pos">
          <span className="aic-where">{cards.length ? <><b>{here + 1} of {cards.length}</b> {cards[here].student.name}</> : "No sheets yet"}</span>
          <Io onClick={() => jump(here - 1)} disabled={here <= 0} label="Previous student">Previous</Io>
          <Io kind="go" onClick={() => jump(here + 1)} disabled={here >= cards.length - 1} label="Next student">Next</Io>
        </div>
      </div>
      {notIn.length ? (
        <details className="aic-fold">
          <summary className="pt-focus">Not submitted yet, {notIn.length}</summary>
          <div className="aic-names">{notIn.map(n => <span key={n} className="pt-gpill off">{n}</span>)}</div>
        </details>
      ) : <p className="pt-quiet">Everyone is in.</p>}
      <div className="pt-stack aic-cards" ref={list}>
        {cards.map(({ student, sheet }) => {
          const a = sheet.answers || {};
          const clip = audioOf(a.audio);
          const empty = R.missingOf(a).length;
          const meta = [pickedSay(a.picked), empty ? empty + (empty === 1 ? " box empty" : " boxes empty") : "Every box filled"].filter(Boolean);
          return (
            <article key={student.email} className={"pt-row aic-card" + (sheet.submitted_at ? "" : " due")}>
              <div className="aic-head">
                <div className="aic-who">
                  <Face config={config} data={data} name={student.name} size={40} />
                  <div className="pt-main">
                    <p className="pt-title"><StudentLink config={config} student={student} /></p>
                    <p className={"pt-when " + (sheet.submitted_at ? "done" : "due")}><span>{sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) : "Started, not submitted"}</span></p>
                    <p className="pt-meta">{meta.join(" · ")}</p>
                  </div>
                </div>
                <Clip clip={clip} urls={urls} />
              </div>
              <ResearchAnswers answers={a} urls={urls} clipShown part={part} />
            </article>
          );
        })}
      </div>
    </Shell>
  );
}

// Which idea the student chose: a slot off the ideas sheet, or the pair's story.
const pickedSay = (p) => {
  const slot = String(p || "").trim();
  return slot === "pair" ? "Chose the pair's story" : I.SLOTS.includes(slot) ? "Chose idea " + (I.SLOTS.indexOf(slot) + 1) : "";
};

function Clip({ clip, urls }) {
  if (!clip) return <span className="pt-gpill aic-noclip">No audio yet</span>;
  return (
    <div className="aic-clip aic-p-audio">
      {urls[clip.path] ? <audio controls preload="metadata" src={urls[clip.path]} /> : <span className="aic-muted">Signing the link.</span>}
      <span className="aic-secs">{clip.seconds ? Math.round(clip.seconds) + " s" : ""}</span>
    </div>
  );
}

// The answers as they read: the story down the left, the four research
// finds and the example in a grid down the right, each part in its colour.
// An empty box says so, rather than going missing, so a half-done sheet
// shows its holes. With a part chosen, only that part.
function Lines({ v }) {
  const ls = linesOf(v);
  if (!ls.length) return <p className="aic-empty">Empty.</p>;
  return ls.length > 1 ? <ul className="aic-lines">{ls.map((l, i) => <li key={i}>{l}</li>)}</ul> : <p className="aic-line">{ls[0]}</p>;
}
function Field({ k, v, big = false }) {
  const text = String(v || "").trim();
  return (
    <div className="aic-field">
      <span className="aic-k">{R.DEFAULT_COPY[k]}</span>
      {big ? (text ? <p className="aic-big">{text}</p> : <p className="aic-empty">Empty.</p>) : <Lines v={v} />}
    </div>
  );
}
function ResearchAnswers({ answers, urls = {}, clipShown = false, part = "all" }) {
  const a = answers || {};
  const show = (p) => part === "all" || part === p;
  if (part === "audio") return <div className="aic-body aic-p-story"><Field k="storyAsk" v={a.story} big /></div>;
  return (
    <div className="aic-body">
      {clipShown ? null : <Clip clip={audioOf(a.audio)} urls={urls} />}
      <div className={"aic-cols" + (part === "all" ? "" : " aic-one")}>
        {show("story") ? (
          <section className="aic-story aic-p-story">
            <Field k="storyAsk" v={a.story} big />
            <Field k="treatmentAsk" v={a.treatment} />
            <Field k="includesAsk" v={a.includes} />
          </section>
        ) : null}
        {show("research") || show("example") ? (
          <section className="aic-research">
            {show("research") ? (
              <div className="aic-grid">
                {R.RESEARCH.map(r => <div key={r.field} className="aic-cell aic-p-research"><Field k={"ask." + r.field} v={a[r.field]} /></div>)}
              </div>
            ) : null}
            {show("example") ? <div className="aic-cell aic-p-example"><Field k="exampleHead" v={a.example} /></div> : null}
          </section>
        ) : null}
      </div>
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
        <p className="aic-p">Five marks, pressed on the review page, one per idea: {I.MARKS.map(m => m.say + " (" + m.id + ")").join(", ")}. Pressing the mark already on takes the mark off. A sheet's marks are one row in worksheet_reviews: note holds JSON by slot, like {"{"}"a":"top","c":"ohno"{"}"}; status is approved when any mark is Top idea or Good to go!, needs_work when only the other three are on, and the row is deleted when no mark is on. A marked idea can carry reasons, under <code>says</code> in the same note by slot, like {"{"}"says":{"{"}"a":["Needs to be more specific"]{"}"}{"}"}: three are in the code to start, every reason typed on any sheet is a press on every other, and taking a mark off drops its reasons. The student sees the reasons under the mark on their sheet; the board does not show them. The write goes through /api/worksheet-submits with the service key, so no browser writes a mark. A student reads their own row under the rules (worksheet_owns) every {I.POLL / 1000} seconds while their tab is showing, which is how the mark appears on their sheet.</p>
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
        <p className="aic-p">Under the title the student sees all three ideas the way the ideas sheet shows them, three boxes with his mark on each, read under the rules from their own ideas sheet and review row once on load; only one marked Top idea or Good to go! carries a choose button (Andrew, 2026-11-01: "list all three, but they can't choose the one that's not approved"), with the story set for their pair on the Pairs view beside them, and a button back to the ideas sheet (Andrew, 2026-11-01: "go look at your audio story ideas"). Andrew, 2026-11-01: "only let them choose from the ideas that were approved by me. They must choose one of the ideas to move forward." A tap picks the idea (the field <code>picked</code>, a slot or <code>pair</code>) and fills the story line, which the student can then change; Submit refuses a sheet with no pick, or a pick whose mark has since come off. A student with no approved idea and no pair story sees the sheet shut, the words in <code>blockedSay</code> in a box beside the title, editable in place like every other line.</p>
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
const researchFieldSay = (f) => ({ picked: " the approved idea chosen, a slot (a, b, c) or pair", audio: " the 60-second audio story, JSON { path, seconds, name }", story: " the story, a line", treatment: " the paragraph treatment", includes: " what the story includes, lines", article: " articles, lines", media: " other media, lines", person: " people to interview, lines", place: " places to capture audio, lines", example: " a good audio story found, lines" })[f] || "";

export function Shell({ children, config, root }) {
  const accent = config?.accent || TOKENS.TEXT.primary;
  return (
    <div ref={root} className="ca-root pt-root aic" style={{ "--ca-accent": accent, "--ca-accent-ink": accent }}>
      <style>{PORTAL_CSS + CSS}</style>
      <div className="aic-in pt-body">{children}</div>
    </div>
  );
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.aic{padding:20px 16px 80px;background:var(--surface-page)}
.aic-in{max-width:1100px;margin:0 auto}
.aic-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
.aic-titles{display:flex;flex-direction:column;gap:8px}
.aic-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.aic-h2{margin:12px 0 0;font-size:20px;font-weight:700}
.aic-p{margin:0;font-size:16px;line-height:1.5;color:var(--text-secondary)}
.aic-p code,.aic-list code{font-size:14px;background:var(--surface-sunk);padding:1px 6px;border-radius:6px;color:var(--text-primary)}
.aic-a{color:var(--text-primary);font-weight:600}
.aic-list{margin:0;padding-left:20px;font-size:15.5px;line-height:1.6;color:var(--text-secondary)}
.aic-tabs{display:flex;gap:8px;flex-wrap:wrap}
.aic-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid var(--line-strong);background:var(--surface-card);color:var(--text-secondary);cursor:pointer;min-height:34px}
.aic-on{background:var(--text-primary);border-color:var(--text-primary);color:var(--surface-page)}
.aic-select{font:inherit;font-size:16px;padding:8px 12px;border-radius:10px;border:1px solid var(--line-strong);background:var(--surface-card);color:var(--text-primary);max-width:360px}
.aic .pt-tiles{max-width:520px}
.aic-t-done .pt-tileN{color:var(--pt-done-ink)}
.aic-t-due .pt-tileN{color:var(--pt-due-ink)}
.aic-bar{position:sticky;top:var(--aic-nav,56px);z-index:5;display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 -16px;padding:10px 16px;background:var(--surface-page);box-shadow:0 1px 0 var(--line-soft)}
.aic-parts{flex:1 1 auto;min-width:0}
.aic .pt-chip b{font-weight:700;font-variant-numeric:tabular-nums}
.aic .pt-chip.aic-p-audio,.aic .pt-chip.aic-p-story,.aic .pt-chip.aic-p-research,.aic .pt-chip.aic-p-example{color:var(--p-c);background:var(--p-bg);box-shadow:0 0 0 1px var(--p-c)}
.aic .pt-chip.aic-p-audio.on,.aic .pt-chip.aic-p-story.on,.aic .pt-chip.aic-p-research.on,.aic .pt-chip.aic-p-example.on{background:var(--p-c);color:#ffffff;box-shadow:none}
.aic-pos{display:flex;align-items:center;gap:8px;margin-left:auto;font-size:15px;color:var(--text-secondary);white-space:nowrap}
.aic-where b{font-variant-numeric:tabular-nums;color:var(--text-primary);font-weight:600;margin-right:4px}
.aic-fold summary{cursor:pointer;font-size:15px;font-weight:600;color:var(--text-secondary);min-height:34px;display:flex;align-items:center;padding:0 4px}
.aic-names{display:flex;flex-wrap:wrap;gap:6px;padding:4px 4px 8px}
.aic .pt-row.aic-card{flex-direction:column;align-items:stretch;gap:14px;padding:16px 20px 20px;scroll-margin-top:calc(var(--aic-nav,56px) + 72px)}
.aic-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.aic-who{display:flex;align-items:center;gap:12px;min-width:0}
.aic-who .pt-title a{color:inherit;text-decoration:none}
.aic-p-audio{--p-c:#5b21b6;--p-bg:#f3f0ff}
.aic-p-story{--p-c:#1d4ed8;--p-bg:#eef2ff}
.aic-p-research{--p-c:#9a3412;--p-bg:#fff1e6}
.aic-p-example{--p-c:#9d174d;--p-bg:#fdf2f8}
.aic-noclip{background:var(--pt-late);color:var(--pt-late-ink)}
.aic-clip{display:flex;align-items:center;gap:10px;padding:4px 12px 4px 4px;border-radius:12px;background:var(--p-bg);color:var(--p-c)}
.aic-clip audio{width:300px;max-width:100%;height:36px}
.aic-secs{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;min-width:32px}
.aic-body{display:flex;flex-direction:column;gap:12px}
.aic-cols{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px}
.aic-cols.aic-one{grid-template-columns:1fr}
.aic-story{display:flex;flex-direction:column;gap:14px;padding-left:14px;box-shadow:inset 3px 0 0 var(--p-c)}
.aic-research{display:flex;flex-direction:column;gap:10px}
.aic-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.aic-cell{padding:10px 12px 10px 14px;border-radius:12px;background:var(--p-bg);color:#1c1917;box-shadow:inset 3px 0 0 var(--p-c)}
.aic-card.due .aic-cell{background:var(--surface-card)}
.aic-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.aic-k{display:block;font-size:13px;font-weight:600;color:var(--p-c,var(--text-secondary));text-transform:uppercase;letter-spacing:.08em}
.aic-big{margin:0;font-family:var(--pt-serif);font-size:22px;font-weight:600;line-height:1.25;overflow-wrap:anywhere}
.aic-line{margin:0;font-size:15.5px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
.aic-lines{margin:0;padding-left:18px;font-size:15.5px;line-height:1.5}
.aic-lines li{overflow-wrap:anywhere}
.aic-empty{margin:0;font-size:15px;color:var(--text-muted)}
.aic-cell .aic-empty{color:#6b655f}
.aic-entry{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:10px;background:var(--surface-sunk)}
.aic-idea{display:flex;flex-direction:column;gap:4px;padding:8px 10px;border-radius:8px;background:var(--surface-card)}
.aic-muted{margin:0;font-size:14.5px;color:var(--text-muted)}
@media (max-width:900px){.aic-cols{grid-template-columns:1fr}.aic-grid{grid-template-columns:1fr}.aic-pos{margin-left:0}.aic .pt-tiles{max-width:none}}
`;
