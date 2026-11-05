// Every student's every grade, one grid: Summary in the Grades portal
// (GradesPortal.jsx), and /<class>/grades before 2026-11-03.
//
// Andrew, 2026-10-29: "I need a way to look at all student grades, the
// whole, like, this is, like, a grid of all student grades as well." One row
// a student, one column an assignment in due order, the letter in the cell.
// A letter that is on the sorting board but not yet released reads faded; a
// released one reads full. Turned in and ungraded is a dot, a miss a dash.
// The last columns are the standing so far, the same number the parade on
// the student's card is built from (computeGrade), and the status. Sections
// are chips. Nothing is written here.
//
// Andrew, 2026-11-03: "make summary prettier ... give me sort options in
// summary. and one sort option should be 'status.' status is like 'all
// great' 'all good' 'fine' 'worried' 'should drop'." The cells are colored by
// meaning, the row starts with the face, and the status is a pill at the
// right: "green with star, green, yellow, orange, red". The status column is
// his alone; this page is behind the instructor gate.

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
import { Chip, Gm, Face } from "./bits.jsx";
import * as TOKENS from "../tokens.js";

const F = TOKENS.FONT.body;
// What a cell reads. The long words need short forms to fit a cell.
const SHORT = { Incomplete: "Inc", Complete: "✓", "Not quite": "NQ", "Not submitted": "NS", "Completed with Revisions": "Rev", "Late but complete": "Late" };
const short = (letter) => SHORT[letter] || letter || "";
// What a letter means, as a color: great, good, ok, bad.
const TONE = { A: "great", Exceptional: "great", Complete: "great", B: "good", "Completed with Revisions": "good", "Late but complete": "good", C: "ok", "Not quite": "ok", D: "bad", F: "bad", Incomplete: "bad", "Not submitted": "bad" };

/** One cell: { say, kind, tone, title } for a student on an assignment. kind is done, pending, in, missed or "". */
export function cellOf(config, data, asg, name) {
  const st = statusOf(config, data, asg, name, new Set());
  const own = (score, b) => score != null && b && score !== b.score ? " " + score : "";
  if (st.letter) { const b = bucketOf(st.grade?.bucket); return { say: short(st.letter) + own(st.grade?.score, b), kind: "done", tone: TONE[st.letter] || "", title: st.letter + (st.grade?.score != null ? ", " + st.grade.score : ""), letter: st.letter }; }
  const card = boardOf(data, asg.id).cards?.[name] || {};
  const b = card.bucket ? bucketOf(card.bucket) : null;
  if (b) return { say: short(b.letter) + own(card.score, b), kind: "pending", tone: TONE[b.letter] || "", title: b.letter + (card.score != null ? ", " + card.score : "") + ", not released", letter: b.letter };
  if (st.state === "turnedIn") return { say: "•", kind: "in", tone: "", title: "Turned in, not graded", letter: null };
  if (st.state === "missed") return { say: "–", kind: "missed", tone: "", title: "Nothing in", letter: null };
  return { say: "", kind: "", tone: "", title: "", letter: null };
}

// The status, worst first so a sort puts the worry at the top. Andrew,
// 2026-11-03, on the rule: "yeah that's good", and "a student with nothing
// is should drop."
export const STATUSES = [
  { id: "drop", label: "Should drop", rank: 0 },
  { id: "worried", label: "Worried", rank: 1 },
  { id: "fine", label: "Fine", rank: 2 },
  { id: "good", label: "All good", rank: 3 },
  { id: "great", label: "All great", rank: 4 },
];
const statusById = (id) => STATUSES.find(s => s.id === id) || null;

/**
 * A student's status from what is graded, released or on the board, and what
 * was never turned in on an assignment whose grades have gone out. Andrew,
 * 2026-11-03: "you are counting things that aren't graded yet." An
 * assignment he has not released yet says nothing about anyone, so a miss
 * on it is not a miss here. Not submitted as a grade counts as a miss.
 * Nothing graded and nothing turned in is Should drop; nothing graded with
 * work waiting is no status yet.
 */
export function studentStatus(config, data, assignments, name) {
  const cells = assignments.filter(asg => boardOf(data, asg.id).released).map(asg => cellOf(config, data, asg, name));
  const letters = cells.map(c => c.letter).filter(Boolean);
  const misses = cells.filter(c => c.kind === "missed").length + letters.filter(l => l === "Not submitted").length;
  const waiting = assignments.some(asg => cellOf(config, data, asg, name).kind === "in") ? 1 : 0;
  const pct = computeGrade(config, data, name).pct;
  const has = (...ls) => letters.some(l => ls.includes(l));
  if (!letters.length && !misses) return waiting ? null : statusById("drop");
  if (has("F") || misses >= 3 || (pct != null && pct < 60)) return statusById("drop");
  if (has("D", "Incomplete") || misses >= 2) return statusById("worried");
  if (has("C", "Not quite") || misses === 1) return statusById("fine");
  if (has("B", "Completed with Revisions", "Late but complete")) return statusById("good");
  return statusById("great");
}

const SORTS = [["name", "Name"], ["status", "Status"], ["sofar", "So far"], ["missing", "Missing"]];

// `embedded`: inside the Grades portal (GradesPortal.jsx), which draws the
// root, the bar and the tabs.
export default function GradesGrid({ config, embedded = false }) {
  const [stored] = useClassData(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const data = useWithWorksheetSubmits(useWithPhotos(stored, photos), config);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  const [sort, setSort] = useState("name");
  const roster = useMemo(() => realStudents(config, rosterOf(config, data)).filter(s => !isHouse(s.name)), [config, data]);
  const assignments = useMemo(() => inDueOrder(assignmentsOf(config, data)), [config, data]);
  const a = config.accent;

  // Every row's cells, standing and status, read once.
  const rows = useMemo(() => roster.map(s => {
    const cells = assignments.map(asg => cellOf(config, data, asg, s.name));
    const g = computeGrade(config, data, s.name);
    const status = studentStatus(config, data, assignments, s.name);
    const missing = cells.filter(c => c.kind === "missed").length + cells.filter(c => c.letter === "Not submitted").length;
    return { student: s, name: nameShown(data, s.name), section: sectionOf(s), cells, pct: g.pct, status, missing };
  }), [roster, assignments, config, data]);

  const byName = (x, y) => x.name.localeCompare(y.name);
  const order = {
    name: byName,
    status: (x, y) => ((x.status ? x.status.rank : 9) - (y.status ? y.status.rank : 9)) || byName(x, y),
    sofar: (x, y) => ((x.pct == null ? 999 : x.pct) - (y.pct == null ? 999 : y.pct)) || byName(x, y),
    missing: (x, y) => (y.missing - x.missing) || byName(x, y),
  }[sort] || byName;
  const people = rows.filter(r => !section || r.section === section).sort(order);

  if (stored === null) return embedded ? <p className="pt-quiet">Loading.</p> : <div data-theme="clean" className="ca-root pt-root" style={{ minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: F }}><ThemeStyle theme="clean" /><style>{PORTAL_CSS}</style><p className="pt-quiet">Loading.</p></div>;

  const Root = embedded ? ({ children }) => <div style={{ "--ca-accent": a, "--ca-accent-ink": a }}><style>{CSS}</style>{children}</div>
    : ({ children }) => <div data-theme="clean" className="ca-root pt-root" style={{ minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: F, "--ca-accent": a, "--ca-accent-ink": a }}><ThemeStyle theme="clean" /><style>{PORTAL_CSS}{CSS}</style>{children}</div>;
  return (
    <Root>
      <div className="gg">
        <div className="pt-head" style={{ alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          {embedded ? null : <h1 className="pt-h1">All grades</h1>}
          {sections.length > 1 ? <div className="pt-chips">{sections.map(s => <Chip key={s} on={s === section} onClick={() => setSection(s)}>{s}</Chip>)}</div> : null}
          <div className="pt-chips gg-sorts" role="radiogroup" aria-label="Sort">
            {SORTS.map(([id, say]) => <button key={id} type="button" role="radio" aria-checked={sort === id} className={"pt-chip pt-focus" + (sort === id ? " on" : "")} onClick={() => setSort(id)}>{say}</button>)}
          </div>
          <span className="pt-sub">{people.length} students · {assignments.length} assignments</span>
        </div>
        <div className="gg-wrap">
          <table className="gg-table">
            <thead>
              <tr>
                <th className="gg-name">Student</th>
                {assignments.map(asg => (
                  <th key={asg.id} title={asg.title + (asg.due ? ", due " + asg.due : "")}>
                    <a className="gg-th pt-focus" href={"/grades/" + config.id + "/flow?a=" + encodeURIComponent(asg.id)}>
                      <span className="gg-tt">{asg.title}</span>
                      <span className="gg-td">{asg.due || ""}{asg.weight ? <Gm>{asg.weight}%</Gm> : null}{hiddenWords(asg) ? " · " + hiddenWords(asg).toLowerCase() : ""}</span>
                    </a>
                  </th>
                ))}
                <th className="gg-sofar">So far</th>
                <th className="gg-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {people.map(r => (
                <tr key={r.student.name}>
                  <th className="gg-name" scope="row">
                    <a className="gg-who" href={studentHref(config, r.student)}>
                      <Face config={config} data={data} name={r.student.name} size={32} />
                      <span className="gg-whoText"><span>{r.name}</span>{r.section ? <span className="gg-sec">{r.section}</span> : null}</span>
                    </a>
                  </th>
                  {r.cells.map((c, i) => <td key={assignments[i].id} className="gg-cell" title={c.title}>{c.say ? <span className={"gg-pill " + c.kind + (c.tone ? " " + c.tone : "")}>{c.say}</span> : null}</td>)}
                  <td className="gg-sofar">{r.pct == null ? "" : <><b>{letterOf(r.pct)}</b> <span className="gg-pct">{r.pct}</span></>}</td>
                  <td className="gg-status">{r.status ? <span className={"gg-st " + r.status.id}>{r.status.id === "great" ? "★ " : ""}{r.status.label}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Root>
  );
}

const CSS = `
.gg{padding:20px 16px 80px;display:flex;flex-direction:column;gap:14px;max-width:none}
.gg-sorts{margin-left:auto}
.gg-wrap{overflow:auto;border:1px solid var(--line-soft);border-radius:16px;background:var(--surface-card);max-height:calc(100vh - 180px);box-shadow:0 1px 2px rgba(0,0,0,.04)}
.gg-table{border-collapse:separate;border-spacing:0;font-size:15px;min-width:100%}
.gg-table th,.gg-table td{padding:8px 10px;border-bottom:1px solid var(--line-soft);white-space:nowrap;text-align:center;vertical-align:middle}
.gg-table tbody tr:hover td,.gg-table tbody tr:hover th{background:var(--surface-sunk)}
.gg-table thead th{position:sticky;top:0;background:var(--surface-card);z-index:2;font-weight:600;border-bottom:1px solid var(--line-strong);padding-top:12px;padding-bottom:10px}
.gg-table .gg-name{position:sticky;left:0;background:var(--surface-card);z-index:1;text-align:left;font-weight:600;min-width:220px}
.gg-who{color:inherit;text-decoration:none;display:flex;align-items:center;gap:10px}
.gg-who:hover span:first-child{text-decoration:underline}
.gg-whoText{display:flex;flex-direction:column;line-height:1.2}
.gg-table thead .gg-name{z-index:3}
.gg-th{display:flex;flex-direction:column;gap:3px;align-items:center;color:inherit;text-decoration:none;max-width:120px}
.gg-th:hover .gg-tt{text-decoration:underline}
.gg-tt{white-space:normal;line-height:1.2;font-size:13px}
.gg-td{font-size:12px;color:var(--text-muted);font-weight:400;display:flex;gap:6px;align-items:center}
.gg-sec{font-size:12px;color:var(--text-muted);font-weight:400}
.gg-cell{min-width:56px}
.gg-pill{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:26px;padding:0 8px;border-radius:999px;font-weight:700;font-size:13px;background:var(--surface-sunk);color:var(--text-secondary)}
.gg-pill.great{background:#dcefdf;color:#1b6b3a}
.gg-pill.good{background:#e3ecf7;color:#2c4f80}
.gg-pill.ok{background:#fdf1e6;color:#7c3a05}
.gg-pill.bad{background:#fbe7e4;color:#8b2a1f}
.gg-pill.pending{opacity:.45}
.gg-pill.in{background:none;color:var(--text-muted);font-size:18px;font-weight:400}
.gg-pill.missed{background:none;color:var(--line-strong);font-weight:400}
.gg-sofar{font-variant-numeric:tabular-nums}
.gg-sofar b{font-size:16px}
.gg-pct{color:var(--text-muted);font-size:13px}
.gg-table .gg-status{min-width:132px;position:sticky;right:0;background:var(--surface-card);z-index:1;box-shadow:-1px 0 0 var(--line-soft)}
.gg-table thead .gg-status{z-index:3}
.gg-st{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:999px;font-weight:700;font-size:13px;white-space:nowrap}
.gg-st.great{background:#dcefdf;color:#1b6b3a}
.gg-st.good{background:#dcefdf;color:#1b6b3a}
.gg-st.fine{background:#fdf3c4;color:#6b5200}
.gg-st.worried{background:#fde4cc;color:#8a3f00}
.gg-st.drop{background:#fbe0dd;color:#8b2a1f}
`;
