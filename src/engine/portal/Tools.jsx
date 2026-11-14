// The instructor's tools: the buttons for everything the class is doing.
//
// Since 2026-10-29 a worksheet that an assignment links to carries its
// buttons on that assignment's own row (InstructorHome.jsx, HisWorkRow), and
// the Tools panel keeps only what is not an assignment. Andrew: "Most of
// these things are just assignments. So if something is an assignment ... I
// should have all those buttons for all of those, and the home button, but
// just, for me, put it on the assignment tile. Otherwise, just there's too
// many things going on." The classmates' stories ride on the visual story's
// row the same way: "That is technically the visual story."
//
// Andrew, 2026-10-16: "i need clear links to all the stuff we're doing in
// comm 3 and comm 118. Think about Worktopia or 3x5 or whatever ... we just
// need a system where these buttons are available for me very easily ... I
// need a 3x5 control panel like who's done with it." Every row says whether
// the sheet is open to students and how many have submitted, and carries
// every address that exists for it: who is done, the sheet as a student
// sees it, the review where there is one, the readout, the answers.
//
// The counts are one read of /api/worksheet-submits for every key at once,
// the same read the Worksheets page and the assignment cards make.

import { useEffect, useState } from "react";
import { WORKSHEETS } from "@ishak/worksheets";
import { LOCAL_WORKSHEETS, listedFor, openTo } from "../localWorksheets.js";
import { hasReadout } from "../ReadoutPage.jsx";
import { WORKTOPIA_KEY } from "../worktopia/terminal.js";
import { SITDOWN_CLASSES } from "../worktopia/sitdown.js";
import { STORIES_CLASSES, storiesHref } from "../visualstory/door.jsx";
import { AUDIO_REVIEW_CLASSES, audioStoriesHref } from "../audiostory/listendoor.jsx";
import { VISUAL_STORY_KEY } from "../visualstory/story.jsx";
import { rosterOf } from "../roster.js";
import { INSTRUCTOR_EMAILS } from "../../instructors.js";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { Sec, Row, Io, Chip } from "./bits.jsx";
import { worksheetOf } from "../worksheetSubmits.js";
import { VISUAL_PRE_KEY, VISUAL_PRE_2_KEY } from "../visualstory/pre.jsx";
import { assignmentsOf } from "../profileTask.js";

const emailOf = (s) => String(s?.email || "").trim().toLowerCase();

// Every worksheet this class can be handed: the package's, then this repo's.
export const sheetsFor = (config) => [...WORKSHEETS, ...LOCAL_WORKSHEETS].filter(w => listedFor(w, config.id));

// The addresses of one worksheet, for the instructor.
export function sheetLinks(config, sheet, data) {
  const student = config.path + "/worksheets/" + sheet.key;
  const local = LOCAL_WORKSHEETS.find(w => w.key === sheet.key) || null;
  // The same buttons on every row, in the same order. Andrew, 2026-10-16:
  // "please be consistent. just put the buttons on there in the same way."
  // Home is the instructor's page for the sheet, with who is done and every
  // student's completion. Review is the review where one exists. Student
  // view is the sheet as students open it.
  // Home is the control page since 2026-11-05: the challenge that carries
  // the sheet, or the sheet's own page when no challenge does.
  const links = [{ say: "Home", href: controlHrefOfSheet(config, sheet, data), main: true }];
  if (local && local.review) links.push({ say: "Review", href: student + "?review" });
  links.push({ say: "Student view", href: student });
  if (hasReadout(config.id, sheet.key)) links.push({ say: "Readout", href: student + "/readout" });
  if (local && local.board) links.push({ say: "Board", href: student + "?board" });
  if (local && local.control) links.push({ say: "Control", href: student + "?control" });
  if (sheet.key === WORKTOPIA_KEY) links.push({ say: "Answers by question", href: student + "/answers" });
  return links;
}

/** The address of a challenge's control page (ControlPage.jsx). A sheet with no challenge is sheet-<key>. */
export const controlHref = (config, id) => config.path + "/control/" + encodeURIComponent(id);
/** The control page for a sheet: its challenge's, or its own. */
export function controlHrefOfSheet(config, sheet, data) {
  const asg = assignmentsOf(config, data || {}).find(a => sheetOfAssignment(config, a)?.key === sheet.key);
  return controlHref(config, asg ? asg.id : "sheet-" + sheet.key);
}

// The sheet an assignment is, if any: the worksheet its link names, or the
// visual story for a link to the story builder.
const STORY_LINK = /^(?:https?:\/\/[^/]+)?\/(comm\w+)\/(?:worksheets\/)?visual-story\/?(?:[?#].*)?$/;
export function sheetOfAssignment(config, asg) {
  const story = String(asg?.instructionsUrl || "").trim().match(STORY_LINK);
  const key = story ? VISUAL_STORY_KEY : worksheetOf(asg, config)?.key;
  if (!key) return null;
  return sheetsFor(config).find(w => w.key === key) || null;
}

// The buttons an assignment's row carries: its sheet's, plus what belongs
// with that sheet (the classmates' stories on the visual story, the second
// topic on pre-production).
export function assignmentTools(config, asg) {
  const sheet = sheetOfAssignment(config, asg);
  if (!sheet) return [];
  const links = sheetLinks(config, sheet);
  links[0] = { say: "Home", href: controlHref(config, asg.id), main: true };
  if (sheet.key === VISUAL_STORY_KEY && STORIES_CLASSES.includes(config.id)) links.push({ say: "Classmates' stories", href: storiesHref(config) });
  if (sheet.key === "audio-story" && AUDIO_REVIEW_CLASSES.includes(config.id)) links.push({ say: "Classmates' audio stories", href: audioStoriesHref(config) }, { say: "Who reviewed what", href: config.path + "/audio-reviews" });
  if (sheet.key === VISUAL_PRE_KEY) links.push({ say: "Second topic review", href: config.path + "/worksheets/" + VISUAL_PRE_2_KEY + "?review" });
  return links;
}

// Every page a challenge has, in one order everywhere: Control, Grade,
// then the sheet's pages, then any pages written on the challenge itself
// (`links`, [{ say, href }], such as TA mode, the sorted read Claude made). Andrew,
// 2026-11-05: "we have to be better about combining review and grading.
// links should be connected." `here` is the page drawing the strip, marked.
export function challengePages(config, asg, data) {
  if (!asg) return [];
  const out = [{ say: "Control", href: controlHref(config, asg.id), key: "control" }];
  if (asg.submission !== "none") out.push({ say: "Grade", href: "/grades/" + config.id + "/flow?a=" + encodeURIComponent(asg.id), key: "grade" });
  assignmentTools(config, asg).forEach(l => { if (!l.main) out.push({ ...l, key: keyOfLink(l) }); });
  (Array.isArray(asg.links) ? asg.links : []).forEach(l => { if (l && l.href) out.push({ say: String(l.say || l.href), href: String(l.href), key: "link:" + l.href, outside: true }); });
  return out;
}
const keyOfLink = (l) => /\?review$/.test(l.href) ? "review" : /\?board$/.test(l.href) ? "board" : /\?control$/.test(l.href) ? "sheet-control" : /\/readout$/.test(l.href) ? "readout" : l.say === "Student view" ? "student" : "link:" + l.href;

/** The strip of a challenge's pages, the current one lit. */
export function PagesStrip({ config, asg, data, here }) {
  const links = challengePages(config, asg, data);
  if (!links.length) return null;
  return (
    <div className="pt-chips" style={{ flexWrap: "wrap", overflow: "visible", gap: 8 }} aria-label="Pages">
      {links.map(l => <Chip key={l.key} href={l.href} on={l.key === here}>{l.say}</Chip>)}
    </div>
  );
}

/** Lines of "Name | https://..." to the links a challenge carries, and back. */
export const parseLinks = (text) => String(text || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => {
  const i = l.indexOf("|");
  const say = i >= 0 ? l.slice(0, i).trim() : "", href = (i >= 0 ? l.slice(i + 1) : l).trim();
  return href ? { say: say || href, href } : null;
}).filter(Boolean);
export const linksText = (links) => (Array.isArray(links) ? links : []).map(l => (l.say && l.say !== l.href ? l.say + " | " : "") + l.href).join("\n");

// The sheets the assignments already carry, so the Tools panel skips them.
export function carriedKeys(config, data) {
  const keys = new Set();
  assignmentsOf(config, data).forEach(asg => {
    const sheet = sheetOfAssignment(config, asg);
    if (!sheet) return;
    keys.add(sheet.key);
    if (sheet.key === VISUAL_PRE_KEY) keys.add(VISUAL_PRE_2_KEY);
    if (sheet.key === VISUAL_STORY_KEY) keys.add("stories");
  });
  return keys;
}

// The rest of the class's tools, beyond the worksheets.
export function otherTools(config) {
  const out = [];
  if (STORIES_CLASSES.includes(config.id)) out.push({
    key: "stories", title: "Classmates' stories", line: "The stage of each section is set on the page.",
    links: [{ say: "Home", href: storiesHref(config), main: true }, { say: "Review", href: config.path + "/worksheets/" + VISUAL_STORY_KEY + "?review" }],
  });
  if (SITDOWN_CLASSES.includes(config.id)) out.push({
    key: "sitdown", title: "Sit-Down 1", line: "Every table, its time and its documents.",
    links: [{ say: "Home", href: config.path + "/sitdown", main: true }, { say: "The prep", href: config.path + "/sitdown/prep" }, { say: "Roles", href: config.path + "/worksheets/worktopia/roles" }],
  });
  out.push({ key: "grade", title: "Grades", line: "Every challenge, every student, what is released.", links: [{ say: "Home", href: "/grades/" + config.id + "/flow", main: true }, { say: "Summary", href: "/grades/" + config.id + "/summary" }] });
  return out;
}

// Who submitted each sheet and when: { key: Map(email -> submitted_at) },
// or null while reading. The time is the latest submit, which is how a
// resubmit after a grade is seen (InstructorHome.jsx).
export function useSubmitCounts(config, keys) {
  const [counts, setCounts] = useState(null);
  const joined = keys.join(",");
  useEffect(() => {
    if (!joined) { setCounts({}); return undefined; }
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/worksheet-submits", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, keys: joined.split(",") }),
        });
        const out = r.ok ? await r.json() : null;
        if (!alive) return;
        const got = {};
        joined.split(",").forEach(k => { got[k] = new Map((out?.ok && out.sheets?.[k] || []).map(s => [String(s.viewer_id || "").toLowerCase(), s.submitted_at || ""])); });
        setCounts(got);
      } catch { if (alive) setCounts({}); }
    })();
    return () => { alive = false; };
  }, [config.id, joined]);
  return counts;
}

// The buttons wrap rather than scroll, so every one is on the screen.
export const Links = ({ links }) => (
  <div className="pt-chips" style={{ paddingTop: 4, flexWrap: "wrap", overflow: "visible" }}>
    {links.filter(l => !l.main).map(l => <Chip key={l.href} href={l.href}>{l.say}</Chip>)}
  </div>
);

// The panel: a section of rows. counts=false draws the links only, for More.
export function ToolsPanel({ config, data, counts: wantCounts = true, name = "Tools" }) {
  const carried = carriedKeys(config, data);
  const sheets = sheetsFor(config).filter(w => !carried.has(w.key));
  const people = rosterOf(config, data).filter(s => s.email && !INSTRUCTOR_EMAILS.includes(emailOf(s)));
  const emails = new Set(people.map(emailOf));
  const counts = useSubmitCounts(config, wantCounts ? sheets.map(w => w.key) : []);
  const rows = sheets.map(sheet => {
    const local = LOCAL_WORKSHEETS.find(w => w.key === sheet.key) || null;
    const open = local ? openTo(local, config.id, data) : true;
    const done = counts && counts[sheet.key] ? [...counts[sheet.key].keys()].filter(e => emails.has(e)).length : null;
    const line = !wantCounts ? "" : (open ? "Open to students" : "Closed to students") + (counts === null ? "" : " · " + (done ?? 0) + " of " + people.length + " submitted");
    return { key: sheet.key, title: sheet.title, line, tint: !wantCounts ? "" : open ? "due" : "off", links: sheetLinks(config, sheet, data) };
  }).concat(otherTools(config).filter(t => !carried.has(t.key)).map(t => ({ ...t, line: wantCounts ? t.line : "", tint: "" })));
  if (!rows.length) return null;
  return (
    <div className="pt-day">
      <Sec name={name} sub={wantCounts ? "Where everything is" : ""} />
      <div className="pt-stack">
        {rows.map(r => {
          const main = r.links.find(l => l.main) || r.links[0];
          return (
            <Row key={r.key} tint={r.tint} side={<Io kind="go" href={main.href}>{main.say}</Io>}>
              <p className="pt-title">{r.title}</p>
              {r.line ? <p className={"pt-when " + r.tint}><span>{r.line}</span></p> : null}
              {r.links.length > 1 ? <Links links={r.links} /> : null}
            </Row>
          );
        })}
      </div>
    </div>
  );
}
