// The COMM 3 visual essay, planned on a page before any of the portal is built.
//
// Andrew asked for the summary at /comm3/visualessayplanning, 2026-10-13, so
// the decisions and the open questions survive a cleared conversation. The
// questions are numbered so he can answer by number. Behind the instructor
// gate, because students should meet the assignment when he announces it.

import { useState, useEffect, useRef } from "react";
import * as TOKENS from "./tokens.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const BG = TOKENS.SURFACE.page;
const TEXT = TOKENS.TEXT.primary;
const SECOND = TOKENS.TEXT.secondary;
const MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.soft;
const EDGE = TOKENS.LINE.strong;
const CARD = TOKENS.SURFACE.card;

const DECIDED = [
  ["Where", "Students build the essay on a laptop, in a portal on the class site, instead of a Google Doc."],
  ["Images", "Seven images of any kind, photos they took and graphics they made."],
  ["Words", "150 to 300 words, with a word counter on the page."],
  ["Shape", "The story scrolls. Students put blocks in order by drag and drop, the way 3x5 works."],
  ["Captions", "A caption can sit under a photo or beside the photo, with the photo on the left or the right."],
  ["Cropping", "None. Every image shows in its own shape."],
  ["Topic", "A headline, plus one sentence on what a reader will learn. Both go in on October 14 so you can approve topics."],
  ["Feature image", "Each student picks a feature image. Classmates choose stories by the headline and the feature image."],
  ["Link", "An optional link to an interactive version, shown at the top of the story, with the instruction: if you want to include a link, the link will go at the top of your story as an alternate way to read your work."],
  ["AI", "Allowed, and the instructions say nothing about AI."],
  ["Preview", "A preview button shows the whole story the way a classmate will see the story."],
  ["Sections", "The 8:00 and 10:30 sections never see each other's stories. You get a showcase for each section."],
  ["Names", "Stories are anonymous to students and named for you."],
  ["Reading", "Pods of five. Each student reads the four other stories in their pod, then chooses four more."],
  ["Comments", "Three comments on each story read: one way the story shone, one thing they would encourage the author to do, and a third still to decide."],
  ["Due date", "Whatever the site says. At the due date the story locks and no more changes go in. Late work is yours to decide."],
];

const BLOCKS = [
  ["Photo, full width", "The image across the page, with an optional caption under the image."],
  ["Photo with text on the right", "The image on the left, about 60 percent of the width, and the caption beside the image."],
  ["Photo with text on the left", "The same block, mirrored."],
  ["Text", "A paragraph on its own, for the parts of the story no image carries."],
];

// Each question has options, the one I would pick first and marked, and a box
// for anything the options miss. Answers go to an instructor-only row, so I
// can read the answers back from the database rather than from a chat.
const QUESTIONS = [
  { id: "count", title: "Exactly seven", ask: "Is the rule exactly seven images, or at least seven? The sheet can refuse to hand in below the number either way.",
    options: ["Exactly seven", "At least seven", "Seven to ten"] },
  { id: "counter", title: "What the counter counts", ask: "What counts toward the 150 to 300 words?",
    mine: 0, options: ["Captions and text blocks only", "Everything, headline and sentence too"] },
  { id: "feature", title: "Feature image", ask: "Is the feature image one of the seven, or an eighth image on top?",
    mine: 0, options: ["One of the seven", "An eighth image"] },
  { id: "landscape", title: "Landscape photos", ask: "A landscape photo beside text gets small. Should a landscape photo start at full width, with a switch to put text beside the photo?",
    mine: 0, options: ["Start at full width, student can switch", "Students choose every layout from the start"] },
  { id: "phones", title: "Readers on phones", ask: "Writing happens on a laptop. Can readers read and comment on a phone? A photo with text beside the photo stacks on a phone, photo first.",
    mine: 0, options: ["Phones can read and comment", "Laptop only, for reading too"] },
  { id: "pods", title: "Making pods", ask: "Pods of five, inside one section. Who makes the pods?",
    mine: 1, options: ["I make the pods by hand", "You propose pods from the one sentence, I move people", "Random inside each section"] },
  { id: "third", title: "Third comment", ask: "One way the story shone, one thing to encourage, and what third comment?",
    options: ["One question the story left you with", "The image that stayed with you and why", "Something else, in the box"] },
  { id: "comments", title: "Who sees comments", ask: "Who sees the comments a reader leaves?",
    mine: 0, options: ["The author, with no names on the comments", "The author, with names", "Only me"] },
  { id: "dates", title: "Dates", ask: "When do the stories open to classmates, and when are the comments due? Type the dates in the box.",
    options: [] },
  { id: "approve", title: "Approving topics", ask: "On October 14, how do you approve topics?",
    mine: 1, options: ["I read a list of headlines and sentences", "I mark each topic approved or needs work, with a note the student sees"] },
  { id: "tomorrow", title: "Tomorrow", ask: "Classes start at 8:00 tomorrow. The photo part needs the upload tested end to end first.",
    mine: 0, options: ["Topic page tomorrow, photos after", "Launch everything at once, later"] },
  { id: "handin", title: "Hand in", ask: "How does a story count as handed in?",
    mine: 0, options: ["A hand-in button, editable until the due date", "Whatever is on the page at the due date"] },
  { id: "late", title: "Late work", ask: "For a late student, what do you want in Grade view?",
    mine: 0, options: ["A button that unlocks one student's story", "Nothing for now, I decide later"] },
  { id: "list", title: "Reading list", ask: "Should each student see the eight stories they owe, the four from their pod and the four they chose, with a mark on each story done?",
    mine: 0, options: ["Show the list with marks", "No list"] },
  { id: "grade", title: "Grading the story", ask: "How is the story graded?",
    mine: 0, options: ["Completed or Completed with Revisions", "Something else, in the box"] },
  { id: "gradecomments", title: "Grading the comments", ask: "Do the comments count toward the grade?",
    options: ["Comments count toward the grade", "Comments are required, not graded", "Comments are optional"] },
];

const ROW = "comm3-visualessay-plan";
const DRAFT = "vp-answers-draft";
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch { return null; } };
const writeDraft = (d) => { try { localStorage.setItem(DRAFT, JSON.stringify(d)); } catch {} };

// The answers, loaded once, saved a beat after each change. A copy sits in the
// browser first, so a failed save loses nothing, and the newer of the two
// copies wins on load.
function useAnswers() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("Loading");
  const timer = useRef(null);
  const latest = useRef(null);

  const push = async () => {
    const d = latest.current;
    if (!d) return;
    setStatus("Saving");
    const res = await window.storage.set(ROW, JSON.stringify(d));
    if (latest.current !== d) return;
    if (res === false) setStatus("Not saved. Sign in as the instructor to save");
    else if (!res) { setStatus("Not saved, trying again"); timer.current = setTimeout(push, 4000); }
    else setStatus("Saved");
  };

  useEffect(() => {
    let live = true;
    (async () => {
      let server = null;
      try { const got = await window.storage.get(ROW); server = got ? JSON.parse(got.value) : null; } catch { server = undefined; }
      if (!live) return;
      const local = readDraft();
      const pick = local && (!server || (local.at || 0) > (server.at || 0)) ? local : server;
      const d = pick || { at: 0, answers: {} };
      latest.current = d;
      setData(d);
      if (server === undefined) setStatus("Not loaded, trying again");
      else if (pick === local && local) push();
      else setStatus("Saved");
    })();
    const flush = () => { if (timer.current) { clearTimeout(timer.current); push(); } };
    window.addEventListener("pagehide", flush);
    return () => { live = false; window.removeEventListener("pagehide", flush); };
  }, []);

  const change = (id, patch) => {
    const prev = latest.current || { answers: {} };
    const d = { at: Date.now(), answers: { ...prev.answers, [id]: { ...(prev.answers[id] || {}), ...patch } } };
    latest.current = d;
    setData(d);
    writeDraft(d);
    setStatus("Saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(push, 800);
  };

  return { data, status, change };
}

function Question({ n, q, answer, onChange, ready }) {
  const a = answer || {};
  return (
    <li className="vp-q">
      <div className="vp-q-title"><strong>{n}. {q.title}.</strong> {q.ask}</div>
      {q.options.length ? (
        <div className="vp-opts" role="radiogroup" aria-label={q.title}>
          {q.options.map((o, i) => {
            const on = a.pick === o;
            return (
              <button key={o} type="button" role="radio" aria-checked={on} disabled={!ready}
                className={"vp-opt" + (on ? " vp-opt-on" : "")}
                onClick={() => onChange({ pick: on ? null : o })}>
                {o}{q.mine === i ? <span className="vp-mine">My pick</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      <textarea className="vp-note" rows={2} disabled={!ready} value={a.note || ""}
        placeholder={q.options.length ? "Anything to add" : "Your answer"}
        onChange={(e) => onChange({ note: e.target.value })} />
    </li>
  );
}

export default function VisualEssayPlan() {
  const { data, status, change } = useAnswers();
  const ready = !!data;
  return (
    <div style={{ fontFamily: F, background: BG, color: TEXT, minHeight: "100vh" }}>
      <style>{CSS}</style>
      <div className="vp-body">
        <h1 className="vp-title">The COMM 3 visual essay</h1>
        <p className="vp-intro">
          The visual essay moves out of the Google Doc and into a portal on the class site. Students
          lay out photos, graphics and words as a story that scrolls, and classmates in their own
          section read and comment once you release the stories. What follows is what you have
          decided, how I would build the portal, and what is still open.
        </p>

        <h2 className="vp-h2">What you decided</h2>
        <dl className="vp-dl">
          {DECIDED.map(([k, v]) => (
            <div className="vp-row" key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>

        <h2 className="vp-h2">The blocks</h2>
        <p className="vp-p">
          A story is a list of blocks the student drags into order. A caption beside a photo works on a
          laptop and reads like a magazine spread. Portrait photos suit the side-by-side block best. A
          landscape photo beside text gets small, so the sheet would start a landscape photo at full
          width and let the student switch.
        </p>
        <dl className="vp-dl">
          {BLOCKS.map(([k, v]) => (
            <div className="vp-row" key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>

        <h2 className="vp-h2">How I would build the portal</h2>
        <p className="vp-p">
          The portal is a worksheet, next to 3x5 and Worktopia. Students sign in with their school email,
          each student reads and writes only their own sheet, and the database enforces the privacy rather
          than the page. Hand-ins show up in Grade view the way the 3x5 hand-ins do.
        </p>
        <p className="vp-p">
          Photos go into a private store, through a server route that checks the student is on the COMM 3
          roster. The browser shrinks each photo to about 2000 pixels on the long side before upload, so a
          12 MB phone photo goes up as about 500 KB, with a progress bar and a retry button. iPhone HEIC
          files get converted in the browser, and I test with real iPhone files.
        </p>
        <p className="vp-p">
          Typing saves to the browser first, on every keystroke, and to the server about a second later. A
          line on the page says Saved, Saving, or Not saved, trying again. The sheet saves again when the
          tab closes, warns before leaving with a save still pending, and on load keeps whichever copy is
          newer. Before you announce the assignment, you do one run on your laptop with a real iPhone photo.
        </p>

        <h2 className="vp-h2">Questions</h2>
        <p className="vp-p">
          Pick an option on each question and add anything the options miss in the box. Your answers
          save as you go, and I read them from here.
        </p>
        <div className="vp-status" aria-live="polite">{status}</div>
        <ol className="vp-ol">
          {QUESTIONS.map((q, i) => (
            <Question key={q.id} n={i + 1} q={q} ready={ready}
              answer={data?.answers?.[q.id]} onChange={(patch) => change(q.id, patch)} />
          ))}
        </ol>
        <p className="vp-p vp-foot">
          Once the questions are settled, the topic part goes up first and the photo part follows.
        </p>
      </div>
    </div>
  );
}

const CSS = `
.vp-body{max-width:760px;margin:0 auto;padding:28px 16px 80px}
.vp-title{margin:0 0 12px;font-size:30px;font-weight:700;letter-spacing:-.02em;line-height:1.15}
.vp-intro{margin:0;font-size:17px;line-height:1.6;color:${SECOND}}
.vp-h2{margin:36px 0 10px;padding-top:14px;border-top:1px solid ${BORDER};font-size:21px;font-weight:700;letter-spacing:-.015em}
.vp-p{margin:0 0 12px;font-size:16px;line-height:1.6;color:${SECOND}}
.vp-dl{margin:6px 0 0}
.vp-row{display:grid;grid-template-columns:150px 1fr;gap:14px;padding:9px 0;border-bottom:1px solid ${BORDER}}
.vp-row dt{font-family:${MONO};font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};padding-top:3px}
.vp-row dd{margin:0;font-size:16px;line-height:1.55;color:${TEXT}}
.vp-ol{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:22px}
.vp-q{display:flex;flex-direction:column;gap:10px;padding-bottom:20px;border-bottom:1px solid ${BORDER}}
.vp-q-title{font-size:16px;line-height:1.55;color:${TEXT}}
.vp-opts{display:flex;flex-wrap:wrap;gap:8px}
.vp-opt{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:6px 14px;border-radius:999px;border:1px solid ${EDGE};
  background:${CARD};color:${SECOND};font-family:inherit;font-size:15px;cursor:pointer;text-align:left}
.vp-opt:hover:not(:disabled){border-color:${TEXT};color:${TEXT}}
.vp-opt:disabled{opacity:.5;cursor:default}
.vp-opt-on{background:${TEXT};border-color:${TEXT};color:${BG}}
.vp-opt-on:hover:not(:disabled){color:${BG}}
.vp-opt:focus-visible,.vp-note:focus-visible{outline:2.5px solid ${TEXT};outline-offset:2px}
.vp-mine{font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;opacity:.75}
.vp-note{width:100%;box-sizing:border-box;font-family:inherit;font-size:15px;line-height:1.5;padding:9px 12px;
  border:1px solid ${EDGE};border-radius:10px;background:${CARD};color:${TEXT};resize:vertical}
.vp-status{position:sticky;top:8px;align-self:flex-start;display:inline-block;margin:0 0 14px;font-family:${MONO};font-size:12px;
  color:${MUTED};background:${BG};border:1px solid ${BORDER};border-radius:999px;padding:4px 12px;z-index:5}
.vp-foot{margin-top:22px;color:${MUTED}}
@media (max-width:620px){
  .vp-row{grid-template-columns:1fr;gap:2px}
  .vp-title{font-size:25px}
}
`;
