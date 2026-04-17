import React, { useState } from "react";
import { ReboundPanel } from "./GameSystem4";

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const TEXT_SECONDARY = "#6b7280";
const TEXT_MUTED = "#9ca3af";
const ACCENT = "#9f1239";
const GREEN = "#16a34a";
const RED = "#dc2626";
const AMBER = "#d97706";

const crd = { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" };
const pill = { padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillInactive = { ...pill, background: "#f3f4f6", color: "#4b5563" };
const sectionLabel = { fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F };
const inp = { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", color: "#111827", fontFamily: F, fontSize: 14, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

const ADMIN_NAME = "Andrew Ishak";
const GUEST_NAME = "__guest__";

function parseDueDate(dueStr) {
  if (!dueStr) return null;
  const year = new Date().getFullYear();
  const parsed = new Date(dueStr + ", " + year);
  if (isNaN(parsed.getTime())) return null;
  parsed.setHours(23, 59, 59, 999);
  return parsed;
}

export const DEFAULT_ASSIGNMENTS = [
  { id: "idea_gen", name: "Group Project #1: Idea Generation", weight: 10, due: "Apr 24", link: "", notes: "" },
  { id: "references", name: "Group Project #2: References", weight: 10, due: "May 1", link: "", notes: "" },
  { id: "synthesis", name: "Group Project #3: Article Synthesis", weight: 10, due: "May 22", link: "", notes: "" },
  { id: "presentation", name: "Final Presentation/Project", weight: 25, due: "Jun 1", link: "", notes: "" },
  { id: "peer_eval", name: "Peer Evaluation", weight: 10, due: "Jun 8", link: "", notes: "" },
  { id: "final_reflection", name: "Final Reflection", weight: 10, due: "Jun 8", link: "", notes: "" },
  { id: "participation", name: "Participation", weight: 25, due: "", link: "", notes: "Weekly Game, Around the Horn, Rotating Fishbowl" },
  { id: "interview", name: "Interview Assignment", weight: 5, due: "Apr 17", link: "", notes: "Interview someone who works in sports in a job you're interested in" },
  { id: "woc_proposal", name: "Intersections Proposal", weight: 5, due: "Apr 24", link: "", notes: "" },
  { id: "woc_submission", name: "Intersections Submission", weight: 20, due: "May 8", link: "", notes: "" },
  { id: "leadership_guide", name: "Leadership Guide", weight: 15, due: "May 20", link: "", notes: "" },
  { id: "final_project", name: "Final Project: Teach Me Something New", weight: 30, due: "Jun 8", link: "", notes: "" },
  { id: "participation", name: "Participation", weight: 25, due: "", link: "", notes: "Weekly Game, Around the Horn, Rotating Fishbowl" },
];

export const QUIZ_BREAKDOWN = [
  { id: "on_topic", label: "On Reading", count: 6, gamePts: 10, gradePts: 15 },
  { id: "extra", label: "Extra", count: 4, gamePts: 10, gradePts: 2.5 },
];

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }

function lastName(name) { if (name === "Ava da Cunha") return "da Cunha"; if (name === "Nogbou Chris Junior Tadjo") return "Tadjo"; if (name === "Anne Sephora Pohan") return "Pohan"; if (name === "Santino Rafael Diaz") return "Diaz"; return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }

async function saveData(data) { try { const STORAGE_KEY = "comm4-v1"; await window.storage.set(STORAGE_KEY, JSON.stringify(data), true); return true; } catch { return false; } }

/* ─── ASSIGNMENTS TAB ─── */
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function TogglePanel({ label, count, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setShow(!show)} style={{ ...pillInactive, fontSize: 12, width: "100%" }}>{show ? "Hide Submissions" : label + " (" + count + ")"}</button>
      {show && children}
    </div>
  );
}

export function AssignmentsView({ data, setData, isAdmin, userName, setView }) {
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const grades = data.grades || {};
  const [editId, setEditId] = useState(null);
  const [editLocal, setEditLocal] = useState(null);
  const [editBlurb, setEditBlurb] = useState(false);
  const [blurbLocal, setBlurbLocal] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const isGuest = userName === GUEST_NAME;
  const student = !isAdmin && !isGuest ? data.students.find(s => s.name === userName) : null;
  const studentId = student?.id;

  // Leaderboard points for current student
  const studentPts = studentId ? data.log.filter(e => e.studentId === studentId).reduce((s, e) => s + e.amount, 0) : 0;
  const ranked = data.students.map(s => ({ ...s, points: data.log.filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) })).sort((a, b) => b.points - a.points);
  const studentRank = studentId ? ranked.findIndex(s => s.id === studentId) + 1 : null;

  const startEdit = (a) => {
    setEditId(a.id);
    setEditLocal({ name: a.name, weight: a.weight, due: a.due || "", link: a.link || "", notes: a.notes || "" });
  };

  const saveEdit = async () => {
    if (!editId || !editLocal) return;
    let updated = { ...data, assignments: (data.assignments || DEFAULT_ASSIGNMENTS).map(a => a.id === editId ? { ...a, ...editLocal, weight: parseInt(editLocal.weight) || 0 } : a) };
    // Sync due date to schedule
    if (editLocal.due && data.schedule) {
      const assignment = (data.assignments || DEFAULT_ASSIGNMENTS).find(a => a.id === editId);
      if (assignment) {
        const newSchedule = data.schedule.map(week => ({
          ...week,
          dates: week.dates.map(d => {
            const cleanedAssignment = (d.assignment || "").split(", ").filter(a => a !== assignment.name && a !== assignment.name + " due").join(", ");
            if (d.date === editLocal.due) {
              const newAssignment = cleanedAssignment ? cleanedAssignment + ", " + editLocal.name + " due" : editLocal.name + " due";
              return { ...d, assignment: newAssignment };
            }
            return { ...d, assignment: cleanedAssignment };
          })
        }));
        updated.schedule = newSchedule;
      }
    }
    await saveData(updated); setData(updated);
    setEditId(null); setEditLocal(null); showMsg("Saved");
  };

  const addAssignment = async () => {
    const newA = { id: genId(), name: "New Assignment", weight: 0, due: "", link: "", notes: "" };
    const updated = { ...data, assignments: [...assignments, newA] };
    await saveData(updated); setData(updated);
    startEdit(newA); showMsg("Added");
  };

  const removeAssignment = async (id) => {
    if (id === "participation") return;
    const updated = { ...data, assignments: assignments.filter(a => a.id !== id) };
    await saveData(updated); setData(updated); setEditId(null); setEditLocal(null); showMsg("Removed");
  };

  const defaultBlurb = "Here's how your grade works. There are four major assignments worth 75% of your grade, and a participation bucket worth the other 25%. The participation bucket is where the weekly game, Around the Horn, and Rotating Fishbowl all live.\n\nThe game leaderboard and your actual grade are two different things. They pull from some of the same activities but weight them differently. The weekly game is the biggest example: the game weights all question types equally (10 pts each), but your grade weights On Reading questions much more heavily (15 pts each) than Extra questions (2.5 pts each). So if you want to climb the leaderboard, be good at everything. If you want a good grade, focus on the course material.\n\nThe top 5 on the leaderboard at the end of the quarter get automatic A's. That's real. Everything else, just do the work, show up, and engage.";
  const blurbText = data.assignmentsBlurb || defaultBlurb;

  const saveBlurb = async () => {
    const updated = { ...data, assignmentsBlurb: blurbLocal };
    await saveData(updated); setData(updated);
    setEditBlurb(false); showMsg("Saved");
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ ...sectionLabel }}>Assignments & Weights</div>
          <div style={{ display: "flex", gap: 6 }}>
            {isAdmin && <button onClick={addAssignment} style={{ ...pillInactive, fontSize: 11 }}>+ Add</button>}
            {isAdmin && setView && <button onClick={() => setView("grades")} style={{ ...pillInactive, fontSize: 11 }}>Gradebook</button>}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <a href="https://camino.instructure.com/courses/117721/assignments" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
            For detailed info, see Camino
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>

        {/* Student: overall grade summary */}
        {studentId && (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            {(() => {
              const gradeAssignments = assignments.filter(a => a.id !== "participation");
              let weightGraded = 0;
              let weightedScore = 0;
              gradeAssignments.forEach(a => {
                const g = grades[studentId + "-" + a.id] || {};
                if (g.score !== undefined && g.score !== "") {
                  weightGraded += a.weight;
                  weightedScore += (parseFloat(g.score) / (g.outOf || 100)) * a.weight;
                }
              });
              const totalWeight = assignments.reduce((s, a) => s + a.weight, 0);
              const pctAssessed = Math.round(weightGraded / totalWeight * 100);
              const currentGrade = weightGraded > 0 ? Math.round(weightedScore / weightGraded * 1000) / 10 : null;
              return (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ ...sectionLabel, marginBottom: 2 }}>Current Grade</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: currentGrade === null ? "#d1d5db" : currentGrade >= 90 ? GREEN : currentGrade >= 80 ? "#111827" : currentGrade >= 70 ? AMBER : RED }}>
                        {currentGrade !== null ? currentGrade + "%" : "---"}
                      </div>
                    </div>
                    <div style={{ width: 1, height: 36, background: "#f3f4f6" }} />
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ ...sectionLabel, marginBottom: 2 }}>Rank</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: studentRank <= 5 ? "#d4a017" : "#111827" }}>#{studentRank}</div>
                    </div>
                    <div style={{ width: 1, height: 36, background: "#f3f4f6" }} />
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div style={{ ...sectionLabel, marginBottom: 2 }}>Game Points</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>{studentPts}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
                    {pctAssessed === 0
                      ? "No assignments have been graded yet."
                      : pctAssessed < 30
                      ? "This reflects " + pctAssessed + "% of your total grade. We still have a long way to go."
                      : pctAssessed < 70
                      ? "This reflects " + pctAssessed + "% of your total grade so far."
                      : "This reflects " + pctAssessed + "% of your total grade."}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div style={{ ...crd, padding: 16, marginBottom: 16, cursor: isAdmin ? "pointer" : "default" }} onClick={() => { if (isAdmin && !editBlurb) { setBlurbLocal(blurbText); setEditBlurb(true); } }}>
          {isAdmin && editBlurb ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }} onClick={e => e.stopPropagation()}>
              <textarea value={blurbLocal} onChange={e => setBlurbLocal(e.target.value)} rows={8} style={{ ...inp, fontSize: 14, lineHeight: 1.6, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveBlurb} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 0", flex: 1 }}>Done</button>
                <button onClick={() => setEditBlurb(false)} style={{ ...pillInactive, padding: "10px 16px" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {blurbText}
              {isAdmin && <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 6, fontStyle: "italic" }}>Click to edit</div>}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(() => {
            const today = new Date();
            const year = today.getFullYear();
            const nextDueId = assignments.reduce((found, a) => {
              if (found || !a.due) return found;
              const parsed = new Date(a.due + ", " + year);
              if (parsed >= new Date(year, today.getMonth(), today.getDate())) return a.id;
              return found;
            }, null);
            const sorted = [...assignments].sort((a, b) => {
              if (!a.due && !b.due) return 0;
              if (!a.due) return 1;
              if (!b.due) return -1;
              return new Date(a.due + ", " + year) - new Date(b.due + ", " + year);
            });
            return sorted.map(a => {
            const isEdit = isAdmin && editId === a.id;
            const g = studentId ? (grades[studentId + "-" + a.id] || {}) : null;
            const submissions = data.submissions || {};
            const mySubKey = studentId ? studentId + "-" + a.id : null;
            const mySub = mySubKey ? submissions[mySubKey] : null;
            const isNext = a.id === nextDueId;
            return (
              <div key={a.id} style={{ ...crd, padding: 16, cursor: isAdmin && !isEdit ? "pointer" : "default", border: isNext ? "2px solid " + ACCENT : crd.border }} onClick={() => isAdmin && !isEdit && startEdit(a)}>
                {isEdit && editLocal ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }} onClick={e => e.stopPropagation()}>
                    <input value={editLocal.name} onChange={e => setEditLocal({ ...editLocal, name: e.target.value })} style={{ ...inp, fontWeight: 700, fontSize: 15 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Weight (%)</div>
                        <input type="number" value={editLocal.weight} onChange={e => setEditLocal({ ...editLocal, weight: e.target.value })} style={{ ...inp }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Due Date</div>
                        <input value={editLocal.due} onChange={e => setEditLocal({ ...editLocal, due: e.target.value })} placeholder="e.g. Apr 20" style={{ ...inp }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ ...sectionLabel, marginBottom: 4 }}>Google Doc Link</div>
                      <input value={editLocal.link} onChange={e => setEditLocal({ ...editLocal, link: e.target.value })} placeholder="https://docs.google.com/..." style={{ ...inp }} />
                    </div>
                    <div>
                      <div style={{ ...sectionLabel, marginBottom: 4 }}>Notes</div>
                      <input value={editLocal.notes} onChange={e => setEditLocal({ ...editLocal, notes: e.target.value })} placeholder="Optional notes" style={{ ...inp }} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveEdit} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 0", flex: 1 }}>Done</button>
                      {a.id !== "participation" && <button onClick={() => { if (window.confirm("Remove " + a.name + "?")) removeAssignment(a.id); }} style={{ ...pill, background: "#fef2f2", color: "#ef4444", padding: "10px 16px" }}>Delete</button>}
                    </div>
                  </div>
                ) : (
                  <div onClick={e => e.stopPropagation()}>
                    <div onClick={() => isAdmin && startEdit(a)} style={{ cursor: isAdmin ? "pointer" : "default" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: a.id === "participation" ? "#f3f4f6" : ACCENT + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: a.id === "participation" ? "#6b7280" : ACCENT, flexShrink: 0 }}>{a.weight}%</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: isNext ? ACCENT : TEXT_SECONDARY, fontWeight: isNext ? 700 : 400, marginTop: 2 }}>
                            {a.due && <span>{isNext ? "Due next: " : "Due "}{a.due}</span>}
                            {a.notes && <span>{a.due ? " / " : ""}{a.notes}</span>}
                          </div>
                        </div>
                        {/* Status badge for students */}
                        {studentId && !isAdmin && a.id !== "participation" && (() => {
                          const hasGrade = g && g.score !== undefined && g.score !== "";
                          const isZero = hasGrade && parseFloat(g.score) === 0;
                          const dueDate = parseDueDate(a.due);
                          const isPastDue = dueDate && Date.now() > dueDate.getTime();
                          const isLate = mySub && dueDate && mySub.ts > dueDate.getTime();
                          if (isZero) return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "#fef2f2", color: RED }}>Action Required</span>;
                          if (hasGrade) return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "#ecfdf5", color: GREEN }}>Graded</span>;
                          if (mySub && isLate) return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "#fffbeb", color: AMBER }}>Submitted Late</span>;
                          if (mySub) return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "#eff6ff", color: "#2563eb" }}>Submitted</span>;
                          if (isPastDue && !mySub) return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8, background: "#fef2f2", color: RED }}>Missing</span>;
                          return null;
                        })()}
                        {a.link && (
                          <a href={a.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ ...pillInactive, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            Details <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                        )}
                        {isAdmin && !a.link && <span style={{ fontSize: 11, color: "#d1d5db", fontStyle: "italic" }}>Click to edit</span>}
                      </div>
                    </div>
                    {studentId && a.id !== "participation" && g && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f3f4f6" }}>
                        {g.score !== undefined && g.score !== "" ? (
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{g.score}</span>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>/ {g.outOf || 100}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "#d1d5db", fontStyle: "italic" }}>Not graded yet</div>
                        )}
                        {g.comment && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, padding: "6px 8px", background: "#f8fafc", borderRadius: 6, lineHeight: 1.4 }}>{g.comment}</div>}
                      </div>
                    )}
                    {studentId && !isAdmin && a.id !== "participation" && (
                      <StudentSubmission assignmentId={a.id} data={data} setData={setData} studentId={studentId} existing={mySub} />
                    )}
                    {isAdmin && a.id !== "participation" && (
                      <div onClick={e => e.stopPropagation()}>
                        <TogglePanel label="View Submissions" count={data.students.filter(s => s.name !== ADMIN_NAME && submissions[s.id + "-" + a.id]).length}>
                          <AdminSubmissions assignmentId={a.id} data={data} setData={setData} />
                        </TogglePanel>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          });
          })()}
        </div>
        <div style={{ ...crd, padding: 16, marginTop: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Participation Breakdown (25%)</div>
          {studentId ? (() => {
            const log = data.log || [];
            const participation = data.participation || {};
            const getPart = (w, cat) => { const k = studentId + "-w" + w + "-" + cat; return participation[k]; };
            // Game log totals by source type
            const gamePts = {};
            log.filter(e => e.studentId === studentId).forEach(e => {
              const src = e.source || "Other";
              let bucket = "Other";
              if (src.startsWith("Game Wk")) bucket = "Weekly Game";
              else if (src.startsWith("ToT")) bucket = "This or That";
              else if (src === "PTI" || src === "Around the Horn") bucket = "PTI";
              else if (src.startsWith("Fishbowl")) bucket = "Fishbowl";
              else if (src.startsWith("Team Win")) bucket = "Team Win";
              else bucket = src;
              gamePts[bucket] = (gamePts[bucket] || 0) + e.amount;
            });
            // Grade-side participation totals
            let gradeQuizTotal = 0, gradeTotTotal = 0, gradePtiTotal = 0, gradeFbTotal = 0;
            let quizWeeks = 0, totWeeks = 0, ptiWeeks = 0, fbWeeks = 0;
            for (let w = 1; w <= 10; w++) {
              const qv = getPart(w, "quiz");
              if (qv !== undefined && qv !== null && qv !== "") {
                const scores = typeof qv === "object" ? qv : {};
                QUIZ_BREAKDOWN.forEach(q => { gradeQuizTotal += (scores[q.id] || 0) * q.gradePts; });
                quizWeeks++;
              }
              const tv = getPart(w, "tot"); if (tv !== undefined && tv !== null && tv !== "") { gradeTotTotal += parseFloat(tv) || 0; totWeeks++; }
              const pv = getPart(w, "pti"); if (pv !== undefined && pv !== null && pv !== "") { gradePtiTotal += parseFloat(pv) || 0; ptiWeeks++; }
              const fv = getPart(w, "fishbowl"); if (fv !== undefined && fv !== null && fv !== "") { gradeFbTotal += parseFloat(fv) || 0; fbWeeks++; }
            }
            return (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Weekly Game", game: gamePts["Weekly Game"] || 0, grade: Math.round(gradeQuizTotal * 10) / 10, weeks: quizWeeks, icon: "Q" },
                    { label: "This or That", game: gamePts["This or That"] || 0, grade: gradeTotTotal, weeks: totWeeks, icon: "TT" },
                    { label: "Around the Horn", game: gamePts["PTI"] || 0, grade: gradePtiTotal, weeks: ptiWeeks, icon: "P" },
                    { label: "Fishbowl", game: gamePts["Fishbowl"] || 0, grade: gradeFbTotal, weeks: fbWeeks, icon: "FB" },
                  ].map(p => (
                    <div key={p.label} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #f3f4f6" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#6b7280", flexShrink: 0 }}>{p.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{p.label}</div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Game</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{p.game}</div>
                        </div>
                        {p.grade > 0 && (
                          <div>
                            <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Grade</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{Math.round(p.grade * 10) / 10}</div>
                          </div>
                        )}
                      </div>
                      {p.weeks > 0 && <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 4 }}>{p.weeks} week{p.weeks !== 1 ? "s" : ""} recorded</div>}
                    </div>
                  ))}
                </div>
                {(gamePts["Team Win"] || 0) > 0 && (
                  <div style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #f3f4f6", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Team Win Bonuses</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{gamePts["Team Win"]}</span>
                  </div>
                )}
              </div>
            );
          })() : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Weekly Game", detail: "100 pts/week, dual weighted", icon: "Q" },
                { label: "This or That", detail: "20 pts/week, game only", icon: "TT" },
                { label: "Around the Horn", detail: "Variable, game + grade", icon: "P" },
                { label: "Rotating Fishbowl", detail: "20 pts/time, game + grade", icon: "FB" },
              ].map(p => (
                <div key={p.label} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#6b7280", flexShrink: 0 }}>{p.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f3f4f6" }}>
            <div style={{ ...sectionLabel, marginBottom: 6 }}>Game Dual Weighting</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "4px 12px", fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: "#9ca3af" }}></div>
              <div style={{ fontWeight: 700, color: "#9ca3af" }}>Qs</div>
              <div style={{ fontWeight: 700, color: "#9ca3af" }}>Game</div>
              <div style={{ fontWeight: 700, color: "#9ca3af" }}>Grade</div>
              {QUIZ_BREAKDOWN.map(q => (
                <React.Fragment key={q.id}>
                  <div style={{ fontWeight: 600, color: "#374151" }}>{q.label}</div>
                  <div style={{ color: "#6b7280" }}>{q.count}</div>
                  <div style={{ color: "#6b7280" }}>{q.gamePts} pts ea</div>
                  <div style={{ color: "#6b7280" }}>{q.gradePts} pts ea</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GRADEBOOK ─── */
/* --- STUDENT SUBMISSION (doc link only) --- */
function StudentSubmission({ assignmentId, data, setData, studentId, existing }) {
  const [docUrl, setDocUrl] = useState(existing?.docUrl || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  React.useEffect(() => {
    setDocUrl(existing?.docUrl || "");
    setNotes(existing?.notes || "");
  }, [existing?.docUrl, existing?.notes]);

  const submit = async () => {
    if (!docUrl.trim()) return;
    const key = studentId + "-" + assignmentId;
    const submissions = data.submissions || {};
    const updated = { ...data, submissions: { ...submissions, [key]: { docUrl: docUrl.trim(), notes: notes.trim(), ts: Date.now() } } };
    await saveData(updated); setData(updated); showMsg("Submitted");
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
      {msg && <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>{msg}</div>}
      <div style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Your Submission</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="Google Doc link" style={{ ...inp, fontSize: 13, padding: "8px 10px" }} />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes for your instructor (optional)" rows={2} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical" }} />
        <button onClick={submit} style={{ ...pill, background: "#111827", color: "#fff", width: "100%" }}>{existing?.ts ? "Resubmit" : "Submit"}</button>
      </div>
      {existing?.ts && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>Submitted {new Date(existing.ts).toLocaleString()}</div>}
    </div>
  );
}

function RegradeRequest({ assignmentId, data, setData, studentId }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const key = studentId + "-" + assignmentId;
  const existing = (data.regradeRequests || {})[key];

  const submit = async () => {
    if (!note.trim()) return;
    const regradeRequests = { ...(data.regradeRequests || {}), [key]: { note: note.trim(), ts: Date.now() } };
    const updated = { ...data, regradeRequests };
    await saveData(updated); setData(updated);
    setOpen(false); setNote(""); showMsg("Regrade requested");
  };

  const cancel = async () => {
    if (!window.confirm("Cancel your regrade request?")) return;
    const regradeRequests = { ...(data.regradeRequests || {}) };
    delete regradeRequests[key];
    const updated = { ...data, regradeRequests };
    await saveData(updated); setData(updated); showMsg("Request cancelled");
  };

  if (existing) {
    return (
      <div style={{ marginTop: 8, padding: "8px 10px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
        {msg && <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>{msg}</div>}
        <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Regrade Requested</div>
        <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.4 }}>{existing.note}</div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Sent {new Date(existing.ts).toLocaleString()}</div>
        <button onClick={cancel} style={{ ...pill, background: "#fff", color: TEXT_SECONDARY, border: "1px solid #e5e7eb", fontSize: 11, marginTop: 6 }}>Cancel Request</button>
      </div>
    );
  }

  if (open) {
    return (
      <div style={{ marginTop: 8, padding: "8px 10px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Request Regrade</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Tell your instructor what to look for (required)..." rows={3} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical", marginBottom: 6 }} />
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={submit} disabled={!note.trim()} style={{ ...pill, background: note.trim() ? "#111827" : "#d1d5db", color: "#fff", flex: 1 }}>Submit Request</button>
          <button onClick={() => { setOpen(false); setNote(""); }} style={pillInactive}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      {msg && <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 4 }}>{msg}</div>}
      <button onClick={() => setOpen(true)} style={{ ...pill, background: "#fff", color: ACCENT, border: "1px solid " + ACCENT + "40", fontSize: 12, width: "100%" }}>Request Regrade</button>
    </div>
  );
}

/* --- ADMIN SUBMISSIONS VIEW --- */
function AdminSubmissions({ assignmentId, data, setData }) {
  const submissions = data.submissions || {};
  const grades = data.grades || {};
  const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME).sort(lastSortObj);
  const [editGrades, setEditGrades] = useState({});
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const saveGrade = async (studentId) => {
    const eg = editGrades[studentId] || {};
    const key = studentId + "-" + assignmentId;
    const existing = grades[key] || {};
    const newGrade = {
      ...existing,
      score: eg.score !== undefined ? (eg.score === "" ? undefined : parseFloat(eg.score)) : existing.score,
      outOf: eg.outOf !== undefined ? (parseFloat(eg.outOf) || 100) : (existing.outOf || 100),
      comment: eg.comment !== undefined ? eg.comment : (existing.comment || ""),
      gradedTs: Date.now(),
    };
    const regradeRequests = { ...(data.regradeRequests || {}) };
    delete regradeRequests[key];
    const gradeNotifications = { ...(data.gradeNotifications || {}), [key]: { ts: Date.now() } };
    const updated = {
      ...data,
      grades: { ...grades, [key]: newGrade },
      regradeRequests,
      gradeNotifications,
    };
    await saveData(updated); setData(updated);
    setEditGrades(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    showMsg("Saved");
  };

  const startGradeEdit = (studentId) => {
    const key = studentId + "-" + assignmentId;
    const g = grades[key] || {};
    setEditGrades(prev => ({ ...prev, [studentId]: { score: g.score !== undefined ? String(g.score) : "", outOf: String(g.outOf || 100), comment: g.comment || "" } }));
  };

  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      {msg && <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{msg}</div>}
      {sorted.map(s => {
        const sub = submissions[s.id + "-" + assignmentId];
        const grade = grades[s.id + "-" + assignmentId] || {};
        const isEditing = editGrades[s.id] !== undefined;
        const eg = editGrades[s.id] || {};

        return (
          <div key={s.id} style={{ padding: 12, borderRadius: 10, background: sub ? "#f9fafb" : "transparent", border: "1px solid " + (sub ? "#e5e7eb" : "#f3f4f6") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sub ? 6 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{s.name}</div>
              {grade.score !== undefined && !isEditing && (
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{grade.score}<span style={{ fontSize: 12, color: "#9ca3af" }}>/{grade.outOf || 100}</span></div>
              )}
              {!sub && !isEditing && <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No submission</span>}
            </div>
            {sub && (
              <div style={{ marginBottom: 8 }}>
                {sub.docUrl && <a href={sub.docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ACCENT, textDecoration: "none", fontWeight: 500, display: "block", marginBottom: 2 }}>Google Doc</a>}
                {sub.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.4 }}>"{sub.notes}"</div>}
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Submitted {new Date(sub.ts).toLocaleString()}</div>
              </div>
            )}
            {grade.comment && !isEditing && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, padding: "6px 8px", background: "#eff6ff", borderRadius: 6, lineHeight: 1.4 }}>{grade.comment}</div>}
            {/* Regrade request */}
            {(() => {
              const rr = (data.regradeRequests || {})[s.id + "-" + assignmentId];
              if (!rr || isEditing) return null;
              return (
                <div style={{ marginTop: 6, padding: "6px 8px", background: "#fffbeb", borderRadius: 6, border: "1px solid #fde68a" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, marginBottom: 2 }}>Regrade Request</div>
                  <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.4 }}>{rr.note}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{new Date(rr.ts).toLocaleString()}</div>
                </div>
              );
            })()}
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={eg.score} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, score: e.target.value } }))} placeholder="Score" style={{ ...inp, fontSize: 13, padding: "6px 8px", width: 70 }} type="number" />
                  <span style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center" }}>/</span>
                  <input value={eg.outOf} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, outOf: e.target.value } }))} placeholder="Out of" style={{ ...inp, fontSize: 13, padding: "6px 8px", width: 70 }} type="number" />
                </div>
                <textarea value={eg.comment} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, comment: e.target.value } }))} placeholder="Comment for student..." rows={2} style={{ ...inp, fontSize: 13, padding: "6px 8px", resize: "vertical" }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => saveGrade(s.id)} style={{ ...pill, background: "#111827", color: "#fff", flex: 1 }}>Save</button>
                  <button onClick={() => setEditGrades(prev => { const n = { ...prev }; delete n[s.id]; return n; })} style={pillInactive}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => startGradeEdit(s.id)} style={{ ...pillInactive, fontSize: 12, marginTop: 6, width: "100%" }}>Grade</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Gradebook({ data, setData, userName, isAdmin }) {
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const grades = data.grades || {};
  const participation = data.participation || {};
  const [selStudent, setSelStudent] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reboundModal, setReboundModal] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const isGuest = userName === GUEST_NAME;

  const student = isAdmin ? (selStudent ? data.students.find(s => s.id === selStudent) : null) : data.students.find(s => s.name === userName);
  const studentId = student?.id;

  const updateGrade = async (studentId, assignmentId, field, value) => {
    const key = studentId + "-" + assignmentId;
    const existing = grades[key] || {};
    const newGrade = { ...existing, [field]: value };
    let extra = {};
    if (field === "score") {
      newGrade.gradedTs = Date.now();
      const regradeRequests = { ...(data.regradeRequests || {}) };
      delete regradeRequests[key];
      const gradeNotifications = { ...(data.gradeNotifications || {}), [key]: { ts: Date.now() } };
      extra = { regradeRequests, gradeNotifications };
    }
    const updated = { ...data, grades: { ...grades, [key]: newGrade }, ...extra };
    await saveData(updated); setData(updated);
  };

  const updateParticipation = async (studentId, week, category, value) => {
    const key = studentId + "-w" + week + "-" + category;
    const updated = { ...data, participation: { ...participation, [key]: value } };
    await saveData(updated); setData(updated);
  };

  const getParticipation = (sid, week, cat) => {
    const key = sid + "-w" + week + "-" + cat;
    return participation[key];
  };

  const calcQuizScores = (sid) => {
    let totalGame = 0, totalGrade = 0, totalGamePossible = 0, totalGradePossible = 0;
    let weekDetails = [];
    for (let w = 1; w <= 10; w++) {
      const val = getParticipation(sid, w, "quiz");
      if (val === undefined || val === null || val === "") continue;
      const scores = typeof val === "object" ? val : { on_topic: 0, sports_world: 0 };
      let weekGame = 0, weekGrade = 0;
      QUIZ_BREAKDOWN.forEach(q => {
        const correct = scores[q.id] || 0;
        weekGame += correct * q.gamePts;
        weekGrade += correct * q.gradePts;
      });
      totalGame += weekGame;
      totalGrade += weekGrade;
      totalGamePossible += 100;
      totalGradePossible += 100;
      weekDetails.push({ week: w, game: Math.round(weekGame), grade: Math.round(weekGrade * 10) / 10, scores });
    }
    return { totalGame, totalGrade: Math.round(totalGrade * 10) / 10, totalGamePossible, totalGradePossible, weekDetails };
  };

  const calcCategoryTotal = (sid, cat) => {
    let total = 0, count = 0;
    for (let w = 1; w <= 10; w++) {
      const val = getParticipation(sid, w, cat);
      if (val !== undefined && val !== null && val !== "") {
        total += parseFloat(val) || 0;
        count++;
      }
    }
    return { total, count };
  };

  const computeAutoParticipation = (sid) => {
    const log = data.log || [];
    const weeklyGames = data.weeklyGames || {};
    const reboundGrades = data.reboundGrades || {};

    let gameGradeEarned = 0;
    let gameGradePossible = 0;
    const scoredGames = Object.keys(weeklyGames).filter(w => weeklyGames[w]?.scored);
    scoredGames.forEach(w => {
      const game = weeklyGames[w];
      gameGradePossible += 100;
      let original = 0;
      (game.questions || []).forEach((q, qi) => {
        const ans = game.responses?.[sid + "-" + qi];
        if (ans === q.correct) {
          const cat = q.category || "on_topic";
          const catPts = cat === "on_topic" ? 15 : 2.5;
          original += catPts;
        }
      });
      const rg = reboundGrades[sid + "-game-" + w];
      let earned = original;
      if (rg && typeof rg.gradePoints === "number") {
        let cap;
        if (rg.type === "absence_override") cap = 60;
        else if (original < 50) cap = 60;
        else if (original <= 65) cap = 70;
        else if (original <= 79) cap = 80;
        else cap = 100;
        const capped = Math.min(rg.gradePoints, cap);
        earned = Math.max(original, capped);
      }
      gameGradeEarned += earned;
    });

    const totEntries = log.filter(e => e.studentId === sid && (e.source || "").startsWith("ToT Wk"));
    const totEarned = totEntries.reduce((s, e) => s + e.amount, 0);
    const scoredToTs = Object.keys(data.weeklyToT || {}).filter(w => (data.weeklyToT[w] || {}).scored).length;
    const totPossible = scoredToTs * 20;

    const fbEntries = log.filter(e => e.studentId === sid && (e.source || "").startsWith("Fishbowl Wk"));
    const fbEarned = fbEntries.reduce((s, e) => s + e.amount, 0);
    const confirmedFishbowls = Object.keys(data.weeklyFishbowl || {}).filter(w => (data.weeklyFishbowl[w] || {}).confirmed).length;
    const fbPossible = confirmedFishbowls * 20;

    const athEntries = log.filter(e => e.studentId === sid && ((e.source || "") === "Around the Horn" || (e.source || "") === "PTI"));
    const athEarned = athEntries.reduce((s, e) => s + e.amount, 0);

    const totalEarned = gameGradeEarned + totEarned + fbEarned + athEarned;
    const totalPossible = gameGradePossible + totPossible + fbPossible;
    const participationPct = totalPossible > 0 ? (totalEarned / totalPossible) : 0;
    const participationGrade = participationPct * 25;

    return {
      gameGradeEarned: Math.round(gameGradeEarned * 10) / 10,
      gameGradePossible,
      totEarned: Math.round(totEarned * 10) / 10,
      totPossible,
      fbEarned: Math.round(fbEarned * 10) / 10,
      fbPossible,
      athEarned: Math.round(athEarned * 10) / 10,
      totalEarned: Math.round(totalEarned * 10) / 10,
      totalPossible,
      participationPct,
      participationGrade: Math.round(participationGrade * 10) / 10,
    };
  };

  // ─── HELPERS FOR NEW GRADEBOOK ───

  const getScoredWeeks = (type) => {
    const store = type === "game" ? data.weeklyGames : type === "tot" ? data.weeklyToT : data.weeklyFishbowl;
    const weeks = Object.keys(store || {})
      .filter(w => type === "fishbowl" ? store[w]?.confirmed : store[w]?.scored)
      .map(w => parseInt(w))
      .filter(w => !isNaN(w))
      .sort((a, b) => a - b);
    return weeks;
  };

  const getWeeklyGameBreakdown = (sid) => {
    const weeklyGames = data.weeklyGames || {};
    const reboundGrades = data.reboundGrades || {};
    const weeks = getScoredWeeks("game");
    return weeks.map(w => {
      const game = weeklyGames[w];
      let original = 0;
      let correctCount = 0;
      let answered = false;
      (game.questions || []).forEach((q, qi) => {
        const ans = game.responses?.[sid + "-" + qi];
        if (ans !== undefined) answered = true;
        if (ans === q.correct) {
          const cat = q.category || "on_topic";
          original += cat === "on_topic" ? 15 : 2.5;
          correctCount++;
        }
      });
      const rg = reboundGrades[sid + "-game-" + w];
      let cap = null, applied = null;
      if (rg && typeof rg.gradePoints === "number") {
        if (rg.type === "absence_override") cap = 60;
        else if (original < 50) cap = 60;
        else if (original <= 65) cap = 70;
        else if (original <= 79) cap = 80;
        else cap = 100;
        applied = Math.max(original, Math.min(rg.gradePoints, cap));
      }
      return {
        week: w,
        original: Math.round(original * 10) / 10,
        applied: applied !== null ? Math.round(applied * 10) / 10 : null,
        cap,
        rebound: rg || null,
        correctCount,
        totalQs: (game.questions || []).length,
        answered,
      };
    });
  };

  const getWeeklyToTBreakdown = (sid) => {
    const tots = data.weeklyToT || {};
    const weeks = getScoredWeeks("tot");
    return weeks.map(w => {
      const tot = tots[w];
      const ptsEach = tot.questions?.length > 0 ? 20 / tot.questions.length : 20;
      let pts = 0, answered = false;
      (tot.questions || []).forEach((q, qi) => {
        const ans = tot.responses?.[sid + "-" + qi];
        if (ans !== undefined) answered = true;
        if (ans === q.correct) pts += ptsEach;
      });
      return { week: w, score: Math.round(pts * 10) / 10, max: 20, answered };
    });
  };

  const getWeeklyFishbowlBreakdown = (sid) => {
    const fbs = data.weeklyFishbowl || {};
    const weeks = getScoredWeeks("fishbowl");
    return weeks.map(w => {
      const fb = fbs[w];
      const score = fb.scores?.[sid] ?? 0;
      return { week: w, score, max: 20 };
    });
  };

  const getCounters = (sid) => {
    const rebounds = data.rebounds || {};
    const reboundGrades = data.reboundGrades || {};
    let planned = 0, unannounced = 0;
    Object.values(rebounds).forEach(rd => {
      const ss = (rd.studentStatuses || {})[sid];
      if (!ss) return;
      if (ss.status === "planned_makeup") planned++;
      else if (ss.status === "unannounced") unannounced++;
    });
    const reboundCount = Object.keys(reboundGrades).filter(k => k.startsWith(sid + "-game-")).length;
    return { planned, unannounced, rebounds: reboundCount };
  };

  const getATHTotal = (sid) => {
    return (data.log || [])
      .filter(e => e.studentId === sid && (e.source === "Around the Horn" || e.source === "PTI"))
      .reduce((s, e) => s + e.amount, 0);
  };

  const getAZone = () => {
    const ranked = data.students
      .filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis")
      .map(s => ({ id: s.id, points: (data.log || []).filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) }))
      .sort((a, b) => b.points - a.points);
    return new Set(ranked.slice(0, 5).map(s => s.id));
  };

  const getRank = (sid) => {
    const ranked = data.students
      .filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis")
      .map(s => ({ id: s.id, points: (data.log || []).filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) }))
      .sort((a, b) => b.points - a.points);
    const idx = ranked.findIndex(s => s.id === sid);
    return idx === -1 ? null : idx + 1;
  };

  const cellColor = (pct, hasRebound) => {
    if (hasRebound) return { bg: "#dbeafe", color: "#1e40af" };
    if (pct === null || pct === 0) return { bg: "#f3f4f6", color: "#9ca3af" };
    if (pct >= 80) return { bg: "#dcfce7", color: "#166534" };
    return { bg: "#fef3c7", color: "#92400e" };
  };


  const renderStudentGrades = (sid) => {
    const p = computeAutoParticipation(sid);
    const gameWeeks = getWeeklyGameBreakdown(sid);
    const totWeeks = getWeeklyToTBreakdown(sid);
    const fbWeeks = getWeeklyFishbowlBreakdown(sid);

    return (
      <div>
        <div style={{ ...sectionLabel, marginBottom: 8 }}>Assignment Grades</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {assignments.filter(a => a.id !== "participation").map(a => {
            const g = grades[sid + "-" + a.id] || {};
            return (
              <div key={a.id} style={{ ...crd, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{a.weight}%</div>
                </div>
                {isAdmin ? (
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                      <input type="number" value={g.score ?? ""} onChange={e => updateGrade(sid, a.id, "score", e.target.value)} placeholder="Score" style={{ ...inp, width: 80, padding: "6px 10px", fontSize: 13 }} />
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>/</span>
                      <input type="number" value={g.outOf ?? 100} onChange={e => updateGrade(sid, a.id, "outOf", e.target.value)} placeholder="100" style={{ ...inp, width: 60, padding: "6px 10px", fontSize: 13 }} />
                      <input value={g.comment || ""} onChange={e => updateGrade(sid, a.id, "comment", e.target.value)} placeholder="Comment..." style={{ ...inp, flex: 1, padding: "6px 10px", fontSize: 13 }} />
                    </div>
                    {(() => {
                      const rr = (data.regradeRequests || {})[sid + "-" + a.id];
                      if (!rr) return null;
                      const dismissRegrade = async () => {
                        const regradeRequests = { ...(data.regradeRequests || {}) };
                        delete regradeRequests[sid + "-" + a.id];
                        const updated = { ...data, regradeRequests };
                        await saveData(updated); setData(updated);
                      };
                      return (
                        <div style={{ marginTop: 6, padding: "8px 10px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: AMBER, textTransform: "uppercase", marginBottom: 4 }}>Regrade Request</div>
                          <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.4 }}>{rr.note}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{new Date(rr.ts).toLocaleString()}</div>
                          <button onClick={dismissRegrade} style={{ ...pill, background: "#fff", color: TEXT_SECONDARY, border: "1px solid #e5e7eb", fontSize: 11, marginTop: 6 }}>Dismiss Request</button>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div>
                    {g.score !== undefined && g.score !== "" ? (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>{g.score}</span>
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>/ {g.outOf || 100}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic" }}>Not graded yet</div>
                    )}
                    {g.comment && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4, padding: "8px 10px", background: "#f8fafc", borderRadius: 8, lineHeight: 1.4 }}>{g.comment}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8 }}>Weekly Game Breakdown</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          {gameWeeks.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No games scored yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {gameWeeks.map(g => {
                const final = g.applied !== null ? g.applied : g.original;
                const status = !g.answered ? "absent" : g.applied !== null ? "rebound" : final >= 80 ? "ok" : "low";
                return (
                  <div key={g.week} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: status === "rebound" ? "#dbeafe" : status === "ok" ? "#f0fdf4" : status === "absent" ? "#fef2f2" : "#fffbeb" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Week {g.week}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                      {!g.answered ? (
                        <span style={{ color: "#dc2626", fontStyle: "italic" }}>Absent</span>
                      ) : (
                        <span style={{ color: "#6b7280" }}>{g.correctCount}/{g.totalQs} correct</span>
                      )}
                      {g.applied !== null ? (
                        <span style={{ fontWeight: 700 }}>
                          <span style={{ color: "#9ca3af", textDecoration: "line-through", fontWeight: 500, marginRight: 6 }}>{g.original}</span>
                          <span style={{ color: "#1e40af" }}>{g.applied}/100</span>
                          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 6, fontWeight: 500 }}>({g.rebound.type === "absence_override" ? "Override" : "Rebound"})</span>
                        </span>
                      ) : (
                        <span style={{ fontWeight: 700, color: status === "ok" ? "#166534" : status === "absent" ? "#9ca3af" : "#92400e" }}>{g.original}/100</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8 }}>This or That Breakdown</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          {totWeeks.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>None yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {totWeeks.map(t => (
                <div key={t.week} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: !t.answered ? "#fef2f2" : t.score >= 16 ? "#f0fdf4" : "#fffbeb" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Week {t.week}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: !t.answered ? "#dc2626" : t.score >= 16 ? "#166534" : "#92400e" }}>
                    {!t.answered ? "Absent" : t.score + "/" + t.max}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8 }}>Fishbowl Breakdown</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          {fbWeeks.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>None yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fbWeeks.map(f => (
                <div key={f.week} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: f.score === 0 ? "#f3f4f6" : f.score >= 16 ? "#f0fdf4" : "#fffbeb" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Week {f.week}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: f.score === 0 ? "#9ca3af" : f.score >= 16 ? "#166534" : "#92400e" }}>{f.score}/{f.max}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8 }}>Participation (25%) - auto-calculated</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Weekly Game (Grade pts)</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Recomputed from responses / On Reading 15pts, Extra 2.5pts</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{p.gameGradeEarned}<span style={{ fontSize: 12, color: "#9ca3af" }}> / {p.gameGradePossible}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>This or That</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>20 pts each</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{p.totEarned}<span style={{ fontSize: 12, color: "#9ca3af" }}> / {p.totPossible}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Fishbowl</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>20 pts each</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", fontVariantNumeric: "tabular-nums" }}>{p.fbEarned}<span style={{ fontSize: 12, color: "#9ca3af" }}> / {p.fbPossible}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Around the Horn</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>Bonus, not in denominator</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#059669", fontVariantNumeric: "tabular-nums" }}>+{p.athEarned}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: ACCENT + "10", borderRadius: 8, marginTop: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: ACCENT }}>Total</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>{p.totalEarned} / {p.totalPossible} <span style={{ fontSize: 13, fontWeight: 700 }}>({Math.round(p.participationPct * 1000) / 10}%)</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isGuest) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ ...sectionLabel, marginBottom: 8 }}>Grades</div><div style={{ fontSize: 14, color: TEXT_SECONDARY }}>Sign in as a student to view grades.</div></div>;
  }

  if (isAdmin) {
    const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME && s.name !== "Bruce Willis").sort(lastSortObj);
    const gradeAssignments = assignments.filter(a => a.id !== "participation");

    const META_COLS = [
      { id: "__inclass", label: "In-Class", sublabel: "25%" },
      { id: "__ath", label: "ATH", sublabel: "Bonus" },
      { id: "__absences", label: "Absences", sublabel: "P / U" },
      { id: "__rebounds", label: "Rebounds", sublabel: "Count" },
    ];
    const allOrderableIds = [...gradeAssignments.map(a => a.id), ...META_COLS.map(m => m.id)];
    const savedOrder = (data.assignmentOrder || []).filter(id => allOrderableIds.includes(id));
    const missingIds = allOrderableIds.filter(id => !savedOrder.includes(id));
    const colOrder = [...savedOrder, ...missingIds];

    const moveCol = async (id, direction) => {
      const idx = colOrder.indexOf(id);
      if (idx === -1) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= colOrder.length) return;
      const next = [...colOrder];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      const updated = { ...data, assignmentOrder: next };
      await saveData(updated); setData(updated);
    };

    const colLabel = (id) => {
      const meta = META_COLS.find(m => m.id === id);
      if (meta) return meta;
      const a = gradeAssignments.find(x => x.id === id);
      return a ? { id, label: a.name, sublabel: a.weight + "%" } : null;
    };

    const submissions = data.submissions || {};
    const regradeRequests = data.regradeRequests || {};

    let zeroCount = 0, missingCount = 0, regradeCount = 0, lateUngradedCount = 0;
    const zeroCells = new Set();
    const missingCells = new Set();
    const regradeCells = new Set();
    const lateCells = new Set();

    sorted.forEach(s => {
      gradeAssignments.forEach(a => {
        const key = s.id + "-" + a.id;
        const g = grades[key] || {};
        const sub = submissions[key];
        const dueDate = parseDueDate(a.due);
        const isPastDue = dueDate && Date.now() > dueDate.getTime();
        const hasGrade = g.score !== undefined && g.score !== "";
        const isZero = hasGrade && parseFloat(g.score) === 0;
        const isLate = sub && dueDate && sub.ts > dueDate.getTime();
        const hasRegrade = !!regradeRequests[key];

        if (isZero) { zeroCount++; zeroCells.add(key); }
        if (isPastDue && !sub && !hasGrade) { missingCount++; missingCells.add(key); }
        if (hasRegrade) { regradeCount++; regradeCells.add(key); }
        if (isLate && !hasGrade) { lateUngradedCount++; lateCells.add(key); }
      });
    });

    const aZone = getAZone();
    const gameWeeksAll = getScoredWeeks("game");
    const totWeeksAll = getScoredWeeks("tot");
    const fbWeeksAll = getScoredWeeks("fishbowl");

    return (
      <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ ...sectionLabel }}>Gradebook</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setActivityFilter("all")} style={{ ...pill, background: activityFilter === "all" ? ACCENT : "#f3f4f6", color: activityFilter === "all" ? "#fff" : "#4b5563", fontSize: 11, padding: "4px 10px" }}>All</button>
              <button onClick={() => setActivityFilter("game")} style={{ ...pill, background: activityFilter === "game" ? ACCENT : "#f3f4f6", color: activityFilter === "game" ? "#fff" : "#4b5563", fontSize: 11, padding: "4px 10px" }}>Game</button>
              <button onClick={() => setActivityFilter("tot")} style={{ ...pill, background: activityFilter === "tot" ? ACCENT : "#f3f4f6", color: activityFilter === "tot" ? "#fff" : "#4b5563", fontSize: 11, padding: "4px 10px" }}>ToT</button>
              <button onClick={() => setActivityFilter("fb")} style={{ ...pill, background: activityFilter === "fb" ? ACCENT : "#f3f4f6", color: activityFilter === "fb" ? "#fff" : "#4b5563", fontSize: 11, padding: "4px 10px" }}>FB</button>
              <button onClick={() => setReorderOpen(!reorderOpen)} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>{reorderOpen ? "Done" : "Reorder columns"}</button>
            </div>
          </div>

          {(zeroCount > 0 || missingCount > 0 || regradeCount > 0 || lateUngradedCount > 0) && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {regradeCount > 0 && (
                <button onClick={() => setHighlight(h => h === "regrade" ? null : "regrade")} style={{ ...pill, padding: "8px 16px", background: highlight === "regrade" ? AMBER : "#fffbeb", color: highlight === "regrade" ? "#fff" : "#92400e", border: "1px solid #fde68a" }}>
                  {regradeCount} Regrade Request{regradeCount !== 1 ? "s" : ""}
                </button>
              )}
              {zeroCount > 0 && (
                <button onClick={() => setHighlight(h => h === "zero" ? null : "zero")} style={{ ...pill, padding: "8px 16px", background: highlight === "zero" ? RED : "#fef2f2", color: highlight === "zero" ? "#fff" : RED, border: "1px solid #fecaca" }}>
                  {zeroCount} Zero{zeroCount !== 1 ? "s" : ""}
                </button>
              )}
              {missingCount > 0 && (
                <button onClick={() => setHighlight(h => h === "missing" ? null : "missing")} style={{ ...pill, padding: "8px 16px", background: highlight === "missing" ? "#7c3aed" : "#f5f3ff", color: highlight === "missing" ? "#fff" : "#7c3aed", border: "1px solid #c4b5fd" }}>
                  {missingCount} Missing
                </button>
              )}
              {lateUngradedCount > 0 && (
                <button onClick={() => setHighlight(h => h === "late" ? null : "late")} style={{ ...pill, padding: "8px 16px", background: highlight === "late" ? AMBER : "#fffbeb", color: highlight === "late" ? "#fff" : AMBER, border: "1px solid #fde68a" }}>
                  {lateUngradedCount} Late (ungraded)
                </button>
              )}
              {highlight && (
                <button onClick={() => setHighlight(null)} style={{ ...pillInactive, padding: "8px 12px", fontSize: 11 }}>Clear</button>
              )}
            </div>
          )}

          {reorderOpen && (
            <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>Use up/down to reorder. Per-week columns are fixed at the right.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {colOrder.map((id, i) => {
                  const c = colLabel(id);
                  if (!c) return null;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f9fafb", borderRadius: 6 }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.label} <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>({c.sublabel})</span></span>
                      <button onClick={() => moveCol(id, "up")} disabled={i === 0} style={{ ...pillInactive, fontSize: 11, padding: "2px 8px", opacity: i === 0 ? 0.3 : 1 }}>up</button>
                      <button onClick={() => moveCol(id, "down")} disabled={i === colOrder.length - 1} style={{ ...pillInactive, fontSize: 11, padding: "2px 8px", opacity: i === colOrder.length - 1 ? 0.3 : 1 }}>down</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ ...crd, overflow: "auto", marginBottom: 20 }}>
            <table style={{ fontSize: 12, borderCollapse: "collapse", fontFamily: F }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", position: "sticky", left: 0, background: "#fff", zIndex: 2, minWidth: 200 }}>Student</th>
                  {colOrder.map(id => {
                    const c = colLabel(id);
                    if (!c) return null;
                    const short = c.label.split(" ").slice(0, 2).join(" ");
                    return (
                      <th key={id} style={{ textAlign: "center", padding: "10px 8px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", minWidth: 70 }}>
                        <div>{short}</div>
                        <div style={{ fontSize: 9, color: "#d1d5db", fontWeight: 500 }}>{c.sublabel}</div>
                      </th>
                    );
                  })}
                  {(activityFilter === "all" || activityFilter === "game") && gameWeeksAll.map(w => (
                    <th key={"gh-" + w} style={{ textAlign: "center", padding: "10px 6px", color: "#1e40af", fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 50, background: "#eff6ff" }}>
                      <div>W{w}</div>
                      <div style={{ fontSize: 9, color: "#60a5fa", fontWeight: 500 }}>Game</div>
                    </th>
                  ))}
                  {(activityFilter === "all" || activityFilter === "tot") && totWeeksAll.map(w => (
                    <th key={"th-" + w} style={{ textAlign: "center", padding: "10px 6px", color: "#7c3aed", fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 50, background: "#f5f3ff" }}>
                      <div>W{w}</div>
                      <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 500 }}>ToT</div>
                    </th>
                  ))}
                  {(activityFilter === "all" || activityFilter === "fb") && fbWeeksAll.map(w => (
                    <th key={"fh-" + w} style={{ textAlign: "center", padding: "10px 6px", color: "#059669", fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 50, background: "#ecfdf5" }}>
                      <div>W{w}</div>
                      <div style={{ fontSize: 9, color: "#34d399", fontWeight: 500 }}>FB</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => {
                  const pCalc = computeAutoParticipation(s.id);
                  const counters = getCounters(s.id);
                  const ath = getATHTotal(s.id);
                  const inAZone = aZone.has(s.id);
                  const rank = getRank(s.id);
                  const photo = (data.bios || {})[s.id]?.photo;
                  const gameBd = (activityFilter === "all" || activityFilter === "game") ? getWeeklyGameBreakdown(s.id) : [];
                  const totBd = (activityFilter === "all" || activityFilter === "tot") ? getWeeklyToTBreakdown(s.id) : [];
                  const fbBd = (activityFilter === "all" || activityFilter === "fb") ? getWeeklyFishbowlBreakdown(s.id) : [];
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "8px 12px", whiteSpace: "nowrap", position: "sticky", left: 0, background: "#fff", zIndex: 1, cursor: "pointer" }} onClick={() => setSelStudent(selStudent === s.id ? null : s.id)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {photo ? (
                            <img src={photo} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af", flexShrink: 0 }}>{s.name[0]}</div>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", borderBottom: selStudent === s.id ? "2px solid " + ACCENT : "none", paddingBottom: 1, lineHeight: 1.2 }}>{s.name}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: inAZone ? "#16a34a" : "#9ca3af", marginTop: 2 }}>
                              {inAZone ? "A ZONE" : rank ? "#" + rank : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      {colOrder.map(id => {
                        if (id === "__inclass") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>{pCalc.totalEarned}/{pCalc.totalPossible}</span>
                              <div style={{ fontSize: 10, color: "#9ca3af" }}>({Math.round(pCalc.participationPct * 1000) / 10}%)</div>
                            </td>
                          );
                        }
                        if (id === "__ath") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: ath > 0 ? "#059669" : "#d1d5db", fontVariantNumeric: "tabular-nums" }}>{ath > 0 ? "+" + ath : "0"}</span>
                            </td>
                          );
                        }
                        if (id === "__absences") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                                <span style={{ color: "#10b981" }}>{counters.planned}P</span>
                                <span style={{ color: "#9ca3af", margin: "0 3px" }}>/</span>
                                <span style={{ color: "#dc2626" }}>{counters.unannounced}U</span>
                              </span>
                            </td>
                          );
                        }
                        if (id === "__rebounds") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: counters.rebounds > 0 ? "#1e40af" : "#d1d5db", fontVariantNumeric: "tabular-nums" }}>{counters.rebounds}</span>
                            </td>
                          );
                        }
                        const cellKey = s.id + "-" + id;
                        const g = grades[cellKey] || {};
                        const isEditing = editingCell === cellKey;
                        const score = g.score;
                        const outOf = g.outOf || 100;
                        return (
                          <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                            {isEditing ? (
                              <input autoFocus type="number" value={score ?? ""} onChange={e => updateGrade(s.id, id, "score", e.target.value)} onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)} style={{ ...inp, width: 48, padding: "4px 4px", fontSize: 12, textAlign: "center" }} />
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setEditingCell(cellKey); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 700, padding: "4px 8px", borderRadius: 6, color: score !== undefined && score !== "" ? "#111827" : "#d1d5db", minWidth: 40 }}>
                                {score !== undefined && score !== "" ? score + "/" + outOf : "-"}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      {(activityFilter === "all" || activityFilter === "game") && gameBd.map(b => {
                        const final = b.applied !== null ? b.applied : b.original;
                        const pct = b.answered ? final : null;
                        const c = cellColor(pct, b.applied !== null);
                        return (
                          <td key={"g-" + b.week} style={{ textAlign: "center", padding: "2px 4px" }}>
                            <button onClick={(e) => { e.stopPropagation(); setReboundModal({ type: "game", week: b.week }); }} style={{ background: c.bg, color: c.color, border: "none", borderRadius: 6, padding: "6px 4px", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer", fontVariantNumeric: "tabular-nums", minWidth: 42 }}>
                              {!b.answered ? "abs" : final}
                              {b.applied !== null && <sup style={{ fontSize: 9, marginLeft: 2 }}>R</sup>}
                            </button>
                          </td>
                        );
                      })}
                      {(activityFilter === "all" || activityFilter === "tot") && totBd.map(b => {
                        const pct = b.answered ? Math.round(b.score / b.max * 100) : null;
                        const c = cellColor(pct, false);
                        return (
                          <td key={"t-" + b.week} style={{ textAlign: "center", padding: "2px 4px" }}>
                            <button onClick={(e) => { e.stopPropagation(); setReboundModal({ type: "tot", week: b.week }); }} style={{ background: c.bg, color: c.color, border: "none", borderRadius: 6, padding: "6px 4px", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer", fontVariantNumeric: "tabular-nums", minWidth: 42 }}>
                              {!b.answered ? "abs" : b.score}
                            </button>
                          </td>
                        );
                      })}
                      {(activityFilter === "all" || activityFilter === "fb") && fbBd.map(b => {
                        const pct = b.score === 0 ? null : Math.round(b.score / b.max * 100);
                        const c = cellColor(pct, false);
                        return (
                          <td key={"f-" + b.week} style={{ textAlign: "center", padding: "2px 4px" }}>
                            <button onClick={(e) => { e.stopPropagation(); setReboundModal({ type: "fishbowl", week: b.week }); }} style={{ background: c.bg, color: c.color, border: "none", borderRadius: 6, padding: "6px 4px", fontSize: 12, fontWeight: 700, fontFamily: F, cursor: "pointer", fontVariantNumeric: "tabular-nums", minWidth: 42 }}>
                              {b.score}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selStudent && (
            <div style={{ ...crd, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{data.students.find(s => s.id === selStudent)?.name}</div>
                <button onClick={() => setSelStudent(null)} style={pillInactive}>Close</button>
              </div>
              {renderStudentGrades(selStudent)}
            </div>
          )}

          {reboundModal && (
            <div onClick={() => setReboundModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 700, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>
                    {reboundModal.type === "game" ? "Weekly Game" : reboundModal.type === "tot" ? "This or That" : "Fishbowl"} - Week {reboundModal.week}
                  </div>
                  <button onClick={() => setReboundModal(null)} style={pillInactive}>Close</button>
                </div>
                <ReboundPanel data={data} setData={setData} activityType={reboundModal.type} week={reboundModal.week} isAdmin={true} userName="Andrew Ishak" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!studentId) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: TEXT_SECONDARY }}>Student not found.</div>;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>My Grades</div>
        {renderStudentGrades(studentId)}
      </div>
    </div>
  );
}
