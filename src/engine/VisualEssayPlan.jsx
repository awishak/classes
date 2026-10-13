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
  ["Where", "Students build the story on a laptop, in a portal on the class site, instead of a Google Doc."],
  ["Images", "Six to eight images of any kind, photos they took and graphics they made. The feature image is one of the images."],
  ["Words", "150 to 300 words in captions and text blocks, with a word counter on the page. The headline and the one sentence do not count."],
  ["Shape", "The story scrolls. Students put blocks in order by drag and drop, the way 3x5 works."],
  ["Captions", "A caption sits under any photo. Text beside a photo, on the left or the right, is for portrait photos only."],
  ["Cropping", "None. Every image shows in its own shape."],
  ["Topic", "A headline, plus one sentence on what a reader will learn. Both go in on October 14. You mark each topic approved or needs work, with a note the student sees."],
  ["Link", "An optional link to an interactive version, shown at the top of the story, with the instruction: if you want to include a link, the link will go at the top of your story as an alternate way to read your work."],
  ["AI", "Allowed, and the instructions say nothing about AI."],
  ["Preview", "A preview button shows the whole story the way a classmate will see the story."],
  ["Hand in", "A hand-in button, with the story editable until the due date. At the due date the story locks."],
  ["Late work", "A button in Grade view unlocks one student's story."],
  ["Sections", "The 8:00 and 10:30 sections never see each other's stories. You get a showcase for each section."],
  ["Pods", "Pods of five inside a section. I suggest pods by topic, and you move people and approve."],
  ["The grid", "Stories sit in a grid, about six across on a laptop and two across on a phone. The four pod stories wear a red box and a Required reading chip. A story read and commented on turns green with a checkmark. Students choose four more, and can read past eight, which you see later and which helps their grade."],
  ["Phones", "Readers can read and comment on a phone."],
  ["Comments", "Three comments on each story read, the first being the best image and why. Then one way the story shone, and one thing they would encourage the author to do."],
  ["Stages", "Everyone hands in. You set the pods. The stories open to classmates with no names. Comments are due. Comments close, and the names of every author and every commenter come out."],
  ["Grading", "A - Excellent, B - Very Good, C - Complete, D - Complete, with issues, Please revise, Not submitted, Unacceptable work. Comments are required, and may count toward the class culture grade."],
]

const BLOCKS = [
  ["Photo, full width", "The image across the page, with an optional caption under the image."],
  ["Portrait with text on the right", "A portrait image on the left, about half the width, and the caption beside the image."],
  ["Portrait with text on the left", "The same block, mirrored."],
  ["Text", "A paragraph on its own, for the parts of the story no image carries."],
];

// Each question has options, the one I would pick first and marked, and a box
// for anything the options miss. Answers go to an instructor-only row, so I
// can read the answers back from the database rather than from a chat.
const QUESTIONS = [
  { id: "r2-name", title: "What students call the assignment", ask: "The site calls the assignment Visual story. You have been saying visual essay. Which name goes on the portal?",
    mine: 0, options: ["Visual story", "Visual essay", "Photo essay"] },
  { id: "r2-pre", title: "Topic page and pre-production", ask: "Visual story pre-production is on the site, due tomorrow, Wednesday, October 14, at 11:59 PM. Is the topic page that assignment?",
    mine: 0, options: ["Yes, the topic page is the pre-production", "No, the topic page is a separate step"] },
  { id: "r2-sentence", title: "The prompt for the one sentence", ask: "What does the topic page say above the one-sentence box?",
    mine: 0, options: ["In one sentence, what will somebody learn from your story?", "What will a reader learn from your story? Write a sentence or a question."] },
  { id: "r2-more", title: "More on the topic page", ask: "Does the topic page ask for anything beyond the headline and the one sentence?",
    mine: 0, options: ["Headline and sentence only", "A short plan of the photos and graphics too", "Whether the trend is going up or going down too"] },
  { id: "r2-needswork", title: "A topic that needs work", ask: "When you mark a topic needs work, what happens next?",
    mine: 0, options: ["The student edits the topic and the topic comes back to you", "You talk with the student in class"] },
  { id: "r2-dates", title: "Dates", ask: "My suggestion. Topic due Wednesday, October 14. Story due Wednesday, October 21, at 11:59 PM, as on the site. Pods out and stories open Friday, October 23, in class. Comments due Tuesday, October 27, at 11:59 PM. Names out Wednesday, October 28, in class.",
    mine: 0, options: ["These dates work", "Change the dates, in the box"] },
  { id: "r2-stages", title: "Moving between stages", ask: "How does the assignment move from one stage to the next?",
    mine: 0, options: ["I press a button for each stage", "Each stage opens on its date by itself"] },
  { id: "r2-seecomments", title: "Other readers' comments", ask: "While comments are open, can a reader see what other readers wrote on a story?",
    mine: 0, options: ["No, hidden until comments close", "Yes, visible as they come in"] },
  { id: "r2-authorsees", title: "When the author sees comments", ask: "When does an author see the comments on their own story?",
    mine: 0, options: ["When comments close, with names", "As they come in, with no names"] },
  { id: "r2-length", title: "Comment length", ask: "Is there a minimum on each of the three comments?",
    options: ["One full sentence each", "At least 25 words each", "No minimum"] },
  { id: "r2-tile", title: "A tile in the grid", ask: "What sits on a story's tile in the grid?",
    mine: 0, options: ["Headline and feature image", "Headline, feature image and the one sentence"] },
  { id: "r2-square", title: "Square images", ask: "Text beside a photo is for portraits only. Does a square image count as a portrait?",
    options: ["Square works beside text", "Square is full width only"] },
  { id: "r2-latestory", title: "A story handed in after pods are set", ask: "Where does a late story go?",
    mine: 0, options: ["Into the grid, outside any pod", "I add the student to a pod"] },
  { id: "r2-readcount", title: "Reading past eight", ask: "Does a student see how many stories they have read?",
    mine: 0, options: ["Show the count, like You have read 10", "No count on the page"] },
  { id: "r2-scale", title: "The grade scale", ask: "Your scale differs from the words on the site now, Completed and Completed with Revisions. Where does your scale apply?",
    options: ["The visual story only", "Every assignment from now on", "Every assignment from the visual story on"] },
  { id: "r2-culture", title: "Comments and class culture", ask: "If comments count toward class culture, how?",
    mine: 0, options: ["Done or not done: three comments on eight stories", "You read the comments and judge them"] },
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
          A story is a list of blocks the student drags into order. The sheet reads each image's shape on
          upload, so the side-by-side blocks are offered for portrait images and never for landscape ones.
          On a phone a side-by-side block stacks, image first.
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
          Your first answers are in the list above. These are the next round. Pick an option on each
          question and add anything the options miss in the box. Your answers save as you go, and I read
          them from here.
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
