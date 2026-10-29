// Every student's every grade, one grid: /<class>/grades.
//
// Andrew, 2026-10-29: "I need a way to look at all student grades, the
// whole, like, this is, like, a grid of all student grades as well." One row
// a student, one column an assignment in due order, the letter in the cell.
// A letter that is on the sorting board but not yet released reads faded; a
// released one reads full. Turned in and ungraded reads "in", a miss reads
// a dash. The last column is the standing so far, the same number the
// parade on the student's card is built from (computeGrade). Sections are
// tabs. Nothing is written here.

import { useState, useMemo } from "react";
import { useClassData } from "../store.js";
import { usePhotos, useWithPhotos } from "../photos.js";
import { useWithWorksheetSubmits } from "../worksheetSubmits.js";
import { assignmentsOf, hiddenWords } from "../profileTask.js";
import { inDueOrder, statusOf } from "../AssignmentCards.jsx";
import { computeGrade } from "../AssignmentsCard.jsx";
import { rosterOf, nameShown } from "../roster.js";
import { realStudents, isHouse, sectionOf, sectionsOf } from "../sections.js";
import { boardOf, bucketOf, letterOf } from "../grades.js";
import { studentHref } from "../StudentPage.jsx";
import { ThemeStyle } from "../ThemeShell.jsx";
import { PORTAL_CSS } from "./style.js";
import { Chip, Gm } from "./bits.jsx";
import * as TOKENS from "../tokens.js";

const F = TOKENS.FONT.body;
// What a cell reads. The long words need short forms to fit a cell.
const SHORT = { Incomplete: "Inc", Complete: "✓", "Not quite": "NQ", "Not submitted": "NS", "Completed with Revisions": "Rev" };
const short = (letter) => SHORT[letter] || letter || "";

/** One cell: { say, kind } for a student on an assignment. kind is done, pending, in, missed or "". */
export function cellOf(config, data, asg, name) {
  const st = statusOf(config, data, asg, name, new Set());
  if (st.letter) return { say: short(st.letter), kind: "done", title: st.letter };
  const bucket = boardOf(data, asg.id).cards?.[name]?.bucket;
  const b = bucket ? bucketOf(bucket) : null;
  if (b) return { say: short(b.letter), kind: "pending", title: b.letter + ", not released" };
  if (st.state === "turnedIn") return { say: "in", kind: "in", title: "Turned in, not graded" };
  if (st.state === "missed") return { say: "–", kind: "missed", title: "Nothing in" };
  return { say: "", kind: "", title: "" };
}

export default function GradesGrid({ config }) {
  const [stored] = useClassData(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const data = useWithWorksheetSubmits(useWithPhotos(stored, photos), config);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  const roster = useMemo(() => realStudents(config, rosterOf(config, data)).filter(s => !isHouse(s.name)), [config, data]);
  const people = roster.filter(s => !section || sectionOf(s) === section).sort((a, b) => nameShown(data, a.name).localeCompare(nameShown(data, b.name)));
  const assignments = useMemo(() => inDueOrder(assignmentsOf(config, data)), [config, data]);
  const a = config.accent;

  if (stored === null) return <div data-theme="clean" className="ca-root pt-root" style={{ minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: F }}><ThemeStyle theme="clean" /><style>{PORTAL_CSS}</style><p className="pt-quiet">Loading.</p></div>;

  return (
    <div data-theme="clean" className="ca-root pt-root" style={{ minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: F, "--ca-accent": a, "--ca-accent-ink": a }}>
      <ThemeStyle theme="clean" />
      <style>{PORTAL_CSS}{CSS}</style>
      <div className="gg">
        <div className="pt-head" style={{ alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h1 className="pt-h1">All grades</h1>
          {sections.length > 1 ? <div className="pt-chips">{sections.map(s => <Chip key={s} on={s === section} onClick={() => setSection(s)}>{s}</Chip>)}</div> : null}
          <span className="pt-sub">{people.length} students · {assignments.length} assignments</span>
        </div>
        <div className="gg-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th className="gg-name">Student</th>
                {assignments.map(asg => (
                  <th key={asg.id} title={asg.title + (asg.due ? ", due " + asg.due : "")}>
                    <a className="gg-th pt-focus" href={config.path + "/grade?a=" + encodeURIComponent(asg.id)}>
                      <span className="gg-tt">{asg.title}</span>
                      <span className="gg-td">{asg.due || ""}{asg.weight ? <Gm>{asg.weight}%</Gm> : null}{hiddenWords(asg) ? " · " + hiddenWords(asg).toLowerCase() : ""}</span>
                    </a>
                  </th>
                ))}
                <th className="gg-sofar">So far</th>
              </tr>
            </thead>
            <tbody>
              {people.map(s => {
                const g = computeGrade(config, data, s.name);
                return (
                  <tr key={s.name}>
                    <th className="gg-name" scope="row"><a className="gg-who" href={studentHref(config, s)}>{nameShown(data, s.name)}</a>{!section && sectionOf(s) ? <span className="gg-sec">{sectionOf(s)}</span> : null}</th>
                    {assignments.map(asg => { const c = cellOf(config, data, asg, s.name); return <td key={asg.id} className={"gg-cell " + c.kind} title={c.title}>{c.say}</td>; })}
                    <td className="gg-sofar">{g.pct == null ? "" : <><b>{letterOf(g.pct)}</b> <span className="gg-pct">{g.pct}</span></>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="pt-meta">A full letter is released. A faded letter is on the board and not released. in is turned in and not graded.</p>
      </div>
    </div>
  );
}

const CSS = `
.gg{padding:20px 16px 80px;display:flex;flex-direction:column;gap:14px;max-width:none}
.gg-wrap{overflow:auto;border:1px solid var(--line-strong);border-radius:12px;background:var(--surface-card);max-height:calc(100vh - 180px)}
.gg-table{border-collapse:separate;border-spacing:0;font-size:15px;min-width:100%}
.gg-table th,.gg-table td{padding:8px 10px;border-bottom:1px solid var(--line-soft);white-space:nowrap;text-align:center;vertical-align:middle}
.gg-table thead th{position:sticky;top:0;background:var(--surface-card);z-index:2;font-weight:600;border-bottom:1px solid var(--line-strong)}
.gg-table .gg-name{position:sticky;left:0;background:var(--surface-card);z-index:1;text-align:left;font-weight:600;min-width:180px}
.gg-who{color:inherit;text-decoration:none}
.gg-who:hover{text-decoration:underline}
.gg-table thead .gg-name{z-index:3}
.gg-th{display:flex;flex-direction:column;gap:2px;align-items:center;color:inherit;text-decoration:none;max-width:120px}
.gg-tt{white-space:normal;line-height:1.2;font-size:13px}
.gg-td{font-size:12px;color:var(--text-muted);font-weight:400;display:flex;gap:6px;align-items:center}
.gg-sec{display:block;font-size:12px;color:var(--text-muted);font-weight:400}
.gg-cell{font-weight:600;min-width:52px}
.gg-cell.pending{opacity:.45}
.gg-cell.in{color:var(--text-muted);font-weight:500;font-style:italic}
.gg-cell.missed{color:var(--text-muted);font-weight:400}
.gg-sofar{font-variant-numeric:tabular-nums}
.gg-pct{color:var(--text-muted);font-size:13px}
.gg-table tbody tr:hover td,.gg-table tbody tr:hover th{background:var(--surface-sunk)}
`;
