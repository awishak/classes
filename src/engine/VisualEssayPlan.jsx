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
  ["Name", "Visual story, the name already on the site."],
  ["Where", "Students build the story on a laptop, in a portal on the class site, instead of a Google Doc."],
  ["Images", "Six to eight images of any kind, photos they took and graphics they made. The feature image is one of the images."],
  ["Words", "150 to 300 words in captions and text blocks, with a word counter on the page. The headline and the one sentence do not count."],
  ["Shape", "The story scrolls. Students put blocks in order by drag and drop, the way 3x5 works."],
  ["Captions", "A caption sits under any photo. Text beside a photo, on the left or the right, is for portrait photos only. Square and landscape images are full width."],
  ["Cropping", "None. Every image shows in its own shape."],
  ["Topic", "A new topic, different from the student's exercise. Students choose one of three prompts, then explain their topic in two or three sentences. A scene with its own rules: a group with its own language and look, like a climbing gym, a car meet, a chess club or a run club. A tradition: a ritual that a team, club, family or culture keeps alive, and who does the keeping. Someone who creates their own values: a person living by rules they chose rather than the rules they were handed."],
  ["Pre-production", "The topic page is Visual story pre-production, due Friday, October 16, at 11:59 PM. The prompt they chose and their topic, a headline, the one sentence, and the prompts: what are some image ideas that will help you tell this story? Which photo can your story not live without, and what will you do if you can't get the photo? Entman's frame: what problem does your story define, what causes the problem, and what should happen next? Is this story ongoing or over: is there a what-happens-next feel, or a complete beginning, middle and end?"],
  ["The one sentence", "In one well-worded sentence or question, what do you hope readers will learn after enjoying your story?"],
  ["Approving", "You mark each topic approved or needs work, with a note the student sees. A student edits a topic that needs work and the topic comes back to you."],
  ["Why each image", "For every image, the student marks why the picture made the cut, one or more of: define the problem or situation, show the cause, show rooting interests, explain what could or should happen next, contains action, contains emotion, is beautiful, other. Other asks for a few words. The marks sit on each image in the portal and are required before hand in. You see the marks, and classmates never do."],
  ["Sources", "Every graphic needs a source line."],
  ["Link", "An optional link to an interactive version, shown at the top of the story, with the instruction: if you want to include a link, the link will go at the top of your story as an alternate way to read your work."],
  ["AI", "Allowed, and the instructions say nothing about AI."],
  ["Preview", "A preview button shows the whole story the way a classmate will see the story."],
  ["Hand in", "A hand-in button, with the story editable until the due date. At the due date the story locks."],
  ["Late work", "A button in Grade view unlocks one student's story. A late story goes into the grid outside any pod, with the note: because your work is submitted late, it's not a guarantee that students will be assigned to offer comments on your story."],
  ["Sections", "The 8:00 and 10:30 sections never see each other's stories. You get a showcase for each section."],
  ["Pods", "Pods of five inside a section. I suggest pods by topic, and you move people and approve."],
  ["The grid", "Stories sit in a grid, about six across on a laptop and two across on a phone, each tile a headline and the feature image. The four pod stories wear a red box and a Required reading chip, and the student's own story wears a red box and a My story chip. A story read and commented on turns green with a checkmark. The page shows the count, like You have read 10. Students can read past eight, which helps their grade."],
  ["Phones", "Readers can read and comment on a phone."],
  ["Comments", "Three comments on each story read, the first being the best image and why. Then one way the story shone, and one thing they would encourage the author to do. Students comment on their own story last, after the eight, with the same three prompts. The prompt: please make sure your comments are substantial. A well-crafted sentence is acceptable, and longer than that is also okay."],
  ["Who sees comments", "While comments are open, nobody sees anyone else's comments. Afterward a student sees only the comments on their own story, with names. You see every comment."],
  ["Reminders", "A banner on your dashboard, on the right day, with the button for the next stage."],
  ["Stuck students", "A Report a problem button sends you what went wrong, with the details."],
  ["Instructions", "A short version in the portal and the full version on a page. I draft from your own words and your earlier assignment docs, and you edit on the page."],
  ["Demo and sample", "You walk through the portal in class with Marty McFly as the test student. You make a sample with your own photos, and the sample sits as a Sample tile at the front of the grid in both sections. The sample's topic is open."],
  ["Testing", "Two or three students you pick try the photo part a day early."],
  ["Stages", "Everyone hands in. You set the pods. The stories open to classmates with no names. Comments are due. Comments close, and the names of every author and every commenter come out."],
  ["Dates", "Pre-production due Friday, October 16, at 11:59 PM. Pods set by Wednesday, October 21, from the topics. Story due Friday, October 23, at 11:59 PM. Stories open Monday, October 26, the no-class day, and comments are due that night at 11:59 PM. Names come out in class Wednesday, October 28. The characters exercise moves to Sunday, November 1."],
  ["This week", "Wednesday, October 14: going over the assignment, about 30 of the 60 minutes, then Canva. Friday, October 16: the parts of a story, a short opener on where a story ends, and the workshop."],
  ["Canva", "Free accounts. Students practice fixing a photo's light, color and straightening, building a chart from real numbers with a source line, putting text on an image without hiding the subject, and making a graphic with AI to compare with a hand-made one. Any edit before upload is fine, cropping included."],
  ["Grading", "A - Excellent, B - Very Good, C - Complete, D - Complete, with issues, Please revise, Not submitted, Unacceptable work. The scale is for the visual story, the audio story and the final project. Comments are done or not done, three comments on eight stories, toward class culture, and you see how many stories each student read."],
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
  { id: "r5-explain", title: "Explaining the topic", ask: "After choosing one of the three prompts, how much does a student write about their topic on the pre-production page?",
    mine: 0, options: ["Two or three sentences", "A full paragraph"] },
  { id: "r5-storytime", title: "The time on October 23", ask: "The story is due Friday, October 23. At what time?",
    mine: 0, options: ["11:59 PM, so you set pods over the weekend", "Before class that day"] },
  { id: "r5-comments", title: "When comments are due", ask: "Stories open Monday, October 26. When are the comments due?",
    mine: 0, options: ["Tuesday, October 27, at 11:59 PM", "Wednesday, October 28, before class", "Friday, October 30, at 11:59 PM"] },
  { id: "r5-names", title: "When names come out", ask: "When do comments close and names come out?",
    mine: 0, options: ["In class the day after comments are due", "The moment comments are due"] },
  { id: "r5-oct23", title: "October 23 and the characters exercise", ask: "October 23 is the workshop for the characters exercise, due Sunday, October 25. With the visual story now due October 23, students have two things due in three days.",
    mine: 1, options: ["Keep both as they are", "Move the characters exercise to Sunday, November 1", "October 23 becomes a visual story workshop and the characters workshop moves"] },
  { id: "r5-deadline", title: "The deadline lesson", ask: "Wednesday's lesson as written: the Boston Marathon manhunt as two arcs side by side, the police one with a deadline and the Reddit one with no deadline and no editors, then the college admissions scandal, where the class finds four different endings. The point is that where a story ends is a choice the storyteller makes. Where does the lesson go?",
    mine: 1, options: ["Drop the lesson", "A short opener at Friday's workshop, the ending part only", "Move the lesson to next week"] },
  { id: "r5-wednesday", title: "Wednesday, October 14", ask: "Wednesday becomes the parts of a story, the October 12 lesson with the Chilean miners and Apollo 13, plus graphics and Canva practice. In what order?",
    mine: 0, options: ["Parts of a story first, then Canva", "Canva first, then parts of a story", "Parts of a story Wednesday, Canva Friday at the workshop"] },
  { id: "r5-canva", title: "The Canva practice", ask: "What do students practice in Canva? Pick as many as you want.", multi: true,
    mine: [0, 1, 2],
    options: ["Fix a photo: light, color and straightening", "Build a chart from real numbers, with a source line", "Put text on an image without hiding the subject", "Remove a background", "Make a graphic with AI and compare the result with a hand-made one"] },
  { id: "r5-canvaaccess", title: "Canva accounts", ask: "Do students have Canva?",
    options: ["Free Canva accounts are enough", "The school has Canva for Education", "Not sure, and I'll check"] },
  { id: "r5-canvacrop", title: "Cropping in Canva", ask: "The portal does no cropping. Can students crop and adjust a photo in Canva or on their phone before upload?",
    mine: 0, options: ["Yes, any edit before upload is fine", "Light and color only, no cropping"] },
  { id: "r5-sitedates", title: "Changing the dates on the site", ask: "The site still says pre-production October 14 and the story October 21, and the Wednesday lesson is still the deadline lesson. Changing them needs your sign-in.",
    mine: 1, options: ["I change them on the dashboard", "You change them in Chrome while I am signed in"] },
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
        <div className={"vp-opts" + (q.multi ? " vp-opts-multi" : "")} role={q.multi ? "group" : "radiogroup"} aria-label={q.title}>
          {q.options.map((o, i) => {
            const picks = Array.isArray(a.pick) ? a.pick : [];
            const on = q.multi ? picks.includes(o) : a.pick === o;
            const mine = Array.isArray(q.mine) ? q.mine.includes(i) : q.mine === i;
            return (
              <button key={o} type="button" role={q.multi ? "checkbox" : "radio"} aria-checked={on} disabled={!ready}
                className={"vp-opt" + (on ? " vp-opt-on" : "")}
                onClick={() => onChange({ pick: q.multi ? (on ? picks.filter(x => x !== o) : [...picks, o]) : (on ? null : o) })}>
                {o}{mine ? <span className="vp-mine">My pick</span> : null}
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
        <h1 className="vp-title">The COMM 3 visual story</h1>
        <p className="vp-intro">
          The visual story moves out of the Google Doc and into a portal on the class site. Students
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

        <h2 className="vp-h2">Instructions, a demo and a sample</h2>
        <p className="vp-p">
          The instructions should be your words, not mine. You have already said most of what students need
          in this planning, from the one sentence to the comment prompt to the note on late work, so my
          plan is to build the instructions out of those sentences and your earlier assignment docs, put the
          draft on a page, and let you edit the draft in place. I fill gaps only where you have said nothing,
          and I mark those lines so you can see which words are mine.
        </p>
        <p className="vp-p">
          A demo and a sample do different jobs. The demo shows how the portal works: upload, drag, caption,
          preview, hand in. The sample shows what a good story looks like. The demo can run in COMM 999, the
          practice class, so nothing touches a real student's work, and your sample can be the story you
          build during the demo.
        </p>

        <h2 className="vp-h2">Questions</h2>
        <p className="vp-p">
          Your answers so far are in the list above. These are the fifth round. Pick an option on each
          question, or several where the question says so, and add anything the options miss in the box.
          Your answers save as you go, and I read them from here.
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
.vp-opts-multi{flex-direction:column;align-items:stretch}
.vp-opts-multi .vp-opt{border-radius:12px;justify-content:space-between}
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
