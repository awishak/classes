// The COMM 3 visual essay, planned on a page before any of the portal is built.
//
// Andrew asked for the summary at /comm3/visualessayplanning, 2026-10-13, so
// the decisions and the open questions survive a cleared conversation. The
// questions are numbered so he can answer by number. Behind the instructor
// gate, because students should meet the assignment when he announces it.

import * as TOKENS from "./tokens.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const BG = TOKENS.SURFACE.page;
const TEXT = TOKENS.TEXT.primary;
const SECOND = TOKENS.TEXT.secondary;
const MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.soft;

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

const QUESTIONS = [
  ["Exactly seven", "Is the rule exactly seven images, or at least seven? The sheet can refuse to hand in below the number either way."],
  ["What the counter counts", "I'd count captions and text blocks toward the 150 to 300 words, and leave out the headline and the one sentence. Agree?"],
  ["Feature image", "Is the feature image one of the seven, or an eighth image on top? I'd make the feature image one of the seven."],
  ["Readers on phones", "Writing happens on a laptop. Can readers read and comment on a phone? If yes, a photo with text beside the photo stacks on a phone, photo first."],
  ["Making pods", "Do you make the pods by hand, or do I propose pods from the one sentence on what a reader will learn and you move people around?"],
  ["Third comment", "Two candidates: one question the story left you with, or the image that stayed with you and why."],
  ["Who sees comments", "Does the author see the comments? Are the comments anonymous to the author? Do other readers see each other's comments?"],
  ["Dates", "When do the stories open to classmates, and when are the comments due?"],
  ["Approving topics", "On October 14, do you just read the list of headlines and sentences, or do you mark each topic approved or needs work, with a note the student sees?"],
  ["Tomorrow", "Classes start at 8:00 tomorrow, so the topic part has to go up tonight, ahead of the photos. The photo part follows once the upload has been tested end to end. Is a topic-only page tomorrow fine?"],
  ["Hand in", "Is there a hand-in button, with the story editable until the due date, or does whatever is on the page at the due date count as handed in?"],
  ["Late work", "For a late student, do you want a button in Grade view that unlocks one student's story for a set time?"],
  ["Reading list", "Should each student see the eight stories they owe, the four from their pod and the four they chose, with a mark on each one done? I'd show the list."],
  ["Grading", "Graded on the usual words, Completed or Completed with Revisions? Do the comments count toward the grade?"],
];

export default function VisualEssayPlan() {
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
        <ol className="vp-ol">
          {QUESTIONS.map(([k, v]) => (
            <li key={k}><strong>{k}.</strong> {v}</li>
          ))}
        </ol>
        <p className="vp-p vp-foot">
          Answer by number in the chat. Once the questions are settled, the topic part goes up first and
          the photo part follows.
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
.vp-ol{margin:0;padding-left:26px;display:flex;flex-direction:column;gap:10px}
.vp-ol li{font-size:16px;line-height:1.55;color:${TEXT}}
.vp-foot{margin-top:22px;color:${MUTED}}
@media (max-width:620px){
  .vp-row{grid-template-columns:1fr;gap:2px}
  .vp-title{font-size:25px}
}
`;
