// The instructor's tools, one row per thing the class is doing: each
// worksheet (Worktopia, 3x5, the visual story and its pre-production), the
// classmates' stories, Sit-Down 1, and the grade view.
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
import { VISUAL_STORY_KEY } from "../visualstory/story.jsx";
import { rosterOf } from "../roster.js";
import { INSTRUCTOR_EMAILS } from "../../instructors.js";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { Sec, Row, Io, Chip } from "./bits.jsx";

const emailOf = (s) => String(s?.email || "").trim().toLowerCase();

// Every worksheet this class can be handed: the package's, then this repo's.
export const sheetsFor = (config) => [...WORKSHEETS, ...LOCAL_WORKSHEETS].filter(w => listedFor(w, config.id));

// The addresses of one worksheet, for the instructor.
export function sheetLinks(config, sheet) {
  const student = config.path + "/worksheets/" + sheet.key;
  const local = LOCAL_WORKSHEETS.find(w => w.key === sheet.key) || null;
  // The same buttons on every row, in the same order. Andrew, 2026-10-16:
  // "please be consistent. just put the buttons on there in the same way."
  // Home is the instructor's page for the sheet, with who is done and every
  // student's completion. Review is the review where one exists. Student
  // view is the sheet as students open it.
  const links = [{ say: "Home", href: config.path + "/worksheets?w=" + encodeURIComponent(sheet.key), main: true }];
  if (local && local.review) links.push({ say: "Review", href: student + "?review" });
  links.push({ say: "Student view", href: student });
  if (hasReadout(config.id, sheet.key)) links.push({ say: "Readout", href: student + "/readout" });
  if (sheet.key === WORKTOPIA_KEY) links.push({ say: "Answers by question", href: student + "/answers" });
  return links;
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
  out.push({ key: "grade", title: "Grades", line: "Every challenge, every student, what is released.", links: [{ say: "Home", href: config.path + "/grade", main: true }] });
  return out;
}

// How many of the class submitted each sheet: { key: n }, or null while reading.
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
        joined.split(",").forEach(k => { got[k] = new Set((out?.ok && out.sheets?.[k] || []).map(s => String(s.viewer_id || "").toLowerCase())); });
        setCounts(got);
      } catch { if (alive) setCounts({}); }
    })();
    return () => { alive = false; };
  }, [config.id, joined]);
  return counts;
}

const Links = ({ links }) => (
  <div className="pt-chips" style={{ paddingTop: 4 }}>
    {links.filter(l => !l.main).map(l => <Chip key={l.href} href={l.href}>{l.say}</Chip>)}
  </div>
);

// The panel: a section of rows. counts=false draws the links only, for More.
export function ToolsPanel({ config, data, counts: wantCounts = true, name = "Tools" }) {
  const sheets = sheetsFor(config);
  const people = rosterOf(config, data).filter(s => s.email && !INSTRUCTOR_EMAILS.includes(emailOf(s)));
  const emails = new Set(people.map(emailOf));
  const counts = useSubmitCounts(config, wantCounts ? sheets.map(w => w.key) : []);
  const rows = sheets.map(sheet => {
    const local = LOCAL_WORKSHEETS.find(w => w.key === sheet.key) || null;
    const open = local ? openTo(local, config.id, data) : true;
    const done = counts && counts[sheet.key] ? [...counts[sheet.key]].filter(e => emails.has(e)).length : null;
    const line = !wantCounts ? "" : (open ? "Open to students" : "Closed to students") + (counts === null ? "" : " · " + (done ?? 0) + " of " + people.length + " submitted");
    return { key: sheet.key, title: sheet.title, line, tint: !wantCounts ? "" : open ? "due" : "off", links: sheetLinks(config, sheet) };
  }).concat(otherTools(config).map(t => ({ ...t, line: wantCounts ? t.line : "", tint: "" })));
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
