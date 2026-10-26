// The visual story's full instructions, for students: /comm3/visual-story/instructions.
// The portal (portal.jsx) took the shorter address on 2026-10-23.
//
// Andrew chose a short version in the portal and the full version on a page
// (planning, 2026-10-13), drafted from his planning answers for him to edit in
// place, the way the pre-production words are. Lines in quotation marks in
// the planning are his exact words; the rest is Claude's first draft. His
// edits live in one instructor-only row that every class reads.

import { useEffect, useState } from "react";
import { useSession } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { useCopy, Words } from "./pre.jsx";
import { PortalBar } from "./portal.jsx";
import * as TOKENS from "../tokens.js";
import TopNav, { NAV_STUDENT } from "../TopNav.jsx";
import { useStudentTheme, useDayNight, ThemeStyle } from "../ThemeShell.jsx";

export const INSTRUCTIONS_ROW = "visual-story-instructions-plan";

// Each section is a heading and a body. Keys are stable; the words are his to change.
export const SECTIONS = [
  ["what", "What you're making", "Your visual story is a short story told mostly in pictures: six to eight images, photos you take and graphics you make, with 150 to 300 words. You build your story on the class site, and your classmates read and comment on your story."],
  ["topic", "Your topic", "Choose one of three prompts: a special culture, a tradition, or a person with unique values. Your topic has to be different from your visual language exercise. Tell me your topic on the pre-production page, due Friday, October 16, at 11:59 PM, and I'll mark your topic approved or needs work."],
  ["images", "Your images", "Six to eight images of any kind, photos you took and graphics you made. Pick one as your feature image: your headline and your feature image are what classmates see first.\n\nFor each image, mark why the image made the cut: define the problem or situation, show the cause, show rooting interests, explain what could or should happen next, contains action, contains emotion, is beautiful, or other. Only I see those marks.\n\nEvery graphic needs a source line. You can edit a photo in Canva or on your phone before you upload the photo, cropping included. The site does no cropping, so every image shows in its own shape."],
  ["words", "Your words", "150 to 300 words in captions and text blocks. A counter on the page keeps track. Your headline and your one sentence do not count toward the total.\n\nYou can put links in your captions and text blocks. Select the words you want readers to click, press Add a link, and paste the web address. The link shows up underlined in your story."],
  ["layout", "Your layout", "Your story scrolls. Drag blocks into the order you want: a photo with a caption under the photo, a portrait photo with text beside the photo on the left or the right, or a block of text on its own."],
  ["link", "A link, if you have one", "If you want to include a link, it will go at the top of your story as an alternate way to read your work."],
  ["submit", "Submitting", "Press Preview to see your story the way a classmate will. When you're done, press Submit. You can keep editing until the due date, Sunday, October 25, at 11:59 PM, and then your story locks.\n\nIf you submit late: because your work is submitted late, it's not a guarantee that students will be assigned to offer comments on your story."],
  ["read", "Reading and commenting", "On Monday, October 26, the stories open with no names on them. We don't have class that day. Your goal is to view and comment on at least 8 other students' stories: the 4 stories outlined in red, then at least 4 more that you choose. You can review as many as you want.\n\nOn each story, leave three comments: the best image and why, one way the story shone, and one thing you would encourage the author to do. Comment on your own story last, with the same three. Please make sure your comments are substantial. A well-crafted sentence is acceptable, and longer than that is also okay.\n\nComments are due Tuesday, October 27, at 11:59 AM. While the stories are anonymous, each student receives non-anonymized comments (your name will be attached) on Tuesday, October 27, after comments close. Check back then to see what people think of your work."],
  ["grade", "Grading", "A - Excellent\nB - Very Good\nC - Complete\nD - Complete, with issues\nPlease revise\nNot submitted\nUnacceptable work"],
  ["help", "Getting help", "If an upload fails or something looks wrong, press Report a problem, and the details come to me."],
];
export const DEFAULTS = {
  title: "Visual story",
  ...Object.fromEntries(SECTIONS.flatMap(([k, head, body]) => [["head." + k, head], ["body." + k, body]])),
};

export default function VisualStoryInstructions({ config }) {
  const { session, instructor } = useSession();
  const editor = !!(session && instructor);
  const copy = useCopy(editor, INSTRUCTIONS_ROW, DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  useEffect(() => { document.title = config.code + " · Visual story"; }, [config]);
  return (
    <div className="vsi" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30, margin: "-28px -16px 20px" }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      <div className="vsi-in">
        <PortalBar config={config} here="" />
        <Words k="title" copy={copy} editing={editing} as="h1" className="vsi-title" />
        {editor ? (
          <div className="vsi-bar">
            <button type="button" className="vsi-btn" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
            <span className="vsi-muted" aria-live="polite">{editing ? copy.status || "Change any line students read. Clear a line to put the original back." : copy.status}</span>
          </div>
        ) : !savedPin() ? null : <p className="vsi-muted">Sign in by email to edit the words.</p>}
        <a className="vsi-link" href={"/" + config.id + "/worksheets/visual-pre"}>Open the pre-production page</a>
        {SECTIONS.map(([k]) => (
          <section key={k} className="vsi-sec">
            <Words k={"head." + k} copy={copy} editing={editing} as="h2" className="vsi-h2" />
            <Words k={"body." + k} copy={copy} editing={editing} as="p" className="vsi-p" />
          </section>
        ))}
      </div>
    </div>
  );
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;
const CSS = `
.vsi{min-height:100vh;background:${S.page};color:${T.primary};font-family:${TOKENS.FONT.body};padding:28px 16px 80px}
.vsi-in{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.vsi-title{margin:0;font-size:32px;font-weight:700;letter-spacing:-.02em}
.vsi-bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.vsi-btn{font:inherit;font-size:14px;font-weight:600;padding:6px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.vsi-btn[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vsi-muted{margin:0;font-size:14px;color:${T.muted}}
.vsi-link{align-self:flex-start;font-size:16px;font-weight:600;color:${T.primary}}
.vsi-sec{display:flex;flex-direction:column;gap:6px;border-top:1px solid ${L.soft};padding-top:16px}
.vsi-h2{margin:0;font-size:21px;font-weight:700}
.vsi-p{margin:0;font-size:16.5px;line-height:1.65;color:${T.secondary};white-space:pre-line}
.vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.6;padding:4px 8px;margin:0;border:1.5px dashed ${L.strong};border-radius:8px;background:${S.card};resize:none;overflow:hidden}
.vsp-edit:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.vsp-edit.vsi-title{font-size:32px;font-weight:700}
.vsp-edit.vsi-h2{font-size:21px;font-weight:700}
.vsp-edit.vsi-p{font-size:16.5px}
`;
