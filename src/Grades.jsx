import React, { useState } from "react";

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const TEXT_SECONDARY = "#6b7280";
const ACCENT = "#9f1239";

const crd = { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" };
const pill = { padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillInactive = { ...pill, background: "#f3f4f6", color: "#4b5563" };
const sectionLabel = { fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F };
const inp = { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", color: "#111827", fontFamily: F, fontSize: 14, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

const ADMIN_NAME = "Andrew Ishak";
const GUEST_NAME = "__guest__";

export const DEFAULT_ASSIGNMENTS = [
  { id: "interview", name: "Interview Assignment", weight: 5, due: "Apr 17", link: "", notes: "Interview someone who works in sports in a job you're interested in" },
  { id: "woc_proposal", name: "Intersections Proposal", weight: 5, due: "Apr 24", link: "", notes: "" },
  { id: "woc_submission", name: "Intersections Submission", weight: 20, due: "May 8", link: "", notes: "" },
  { id: "leadership_guide", name: "Leadership Guide", weight: 15, due: "May 20", link: "", notes: "" },
  { id: "final_project", name: "Final Project: Teach Me Something New", weight: 30, due: "Jun 8", link: "", notes: "" },
  { id: "participation", name: "Participation", weight: 25, due: "", link: "", notes: "Weekly Game, This or That, PTI, Rotating Fishbowl" },
];

export const QUIZ_BREAKDOWN = [
  { id: "on_topic", label: "On Topic", count: 3, gamePts: 10, gradePts: 13 },
  { id: "reading", label: "From Reading", count: 3, gamePts: 10, gradePts: 17 },
  { id: "sports_world", label: "Sports World", count: 4, gamePts: 10, gradePts: 2.5 },
];

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }

function lastName(name) { if (name === "Alexander Watanabe Eriksson") return "Watanabe Eriksson"; return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }

async function saveData(data) { try { const STORAGE_KEY = "comm118-game-v14"; await window.storage.set(STORAGE_KEY, JSON.stringify(data), true); return true; } catch { return false; } }

/* ─── ASSIGNMENTS TAB ─── */
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export function AssignmentsView({ data, setData, isAdmin, userName, setView }) {
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const grades = data.grades || {};
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const isGuest = userName === GUEST_NAME;
  const student = !isAdmin && !isGuest ? data.students.find(s => s.name === userName) : null;
  const studentId = student?.id;

  // Leaderboard points for current student
  const studentPts = studentId ? data.log.filter(e => e.studentId === studentId).reduce((s, e) => s + e.amount, 0) : 0;
  const ranked = data.students.map(s => ({ ...s, points: data.log.filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) })).sort((a, b) => b.points - a.points);
  const studentRank = studentId ? ranked.findIndex(s => s.id === studentId) + 1 : null;

  const updateAssignment = async (id, field, value) => {
    const updated = { ...data, assignments: (data.assignments || DEFAULT_ASSIGNMENTS).map(a => a.id === id ? { ...a, [field]: value } : a) };
    if (field === "due" && value && data.schedule) {
      const assignment = (data.assignments || DEFAULT_ASSIGNMENTS).find(a => a.id === id);
      if (assignment) {
        const newSchedule = data.schedule.map(week => ({
          ...week,
          dates: week.dates.map(d => {
            const cleanedAssignment = (d.assignment || "").split(", ").filter(a => a !== assignment.name && a !== assignment.name + " due").join(", ");
            if (d.date === value) {
              const newAssignment = cleanedAssignment ? cleanedAssignment + ", " + assignment.name + " due" : assignment.name + " due";
              return { ...d, assignment: newAssignment };
            }
            return { ...d, assignment: cleanedAssignment };
          })
        }));
        updated.schedule = newSchedule;
      }
    }
    await saveData(updated); setData(updated);
  };

  const save = () => { setEditId(null); showMsg("Saved"); };

  const addAssignment = async () => {
    const newA = { id: genId(), name: "New Assignment", weight: 0, due: "", link: "", notes: "" };
    const updated = { ...data, assignments: [...assignments, newA] };
    await saveData(updated); setData(updated);
    setEditId(newA.id); showMsg("Added");
  };

  const removeAssignment = async (id) => {
    if (id === "participation") return;
    const updated = { ...data, assignments: assignments.filter(a => a.id !== id) };
    await saveData(updated); setData(updated); showMsg("Removed");
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

        {/* Student: current points summary */}
        {studentId && (
          <div style={{ ...crd, padding: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
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
        )}

        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
            Here's how your grade works. There are four major assignments worth 75% of your grade, and a participation bucket worth the other 25%. The participation bucket is where the weekly game, This or That, PTI, and Rotating Fishbowl all live.
          </div>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginTop: 10 }}>
            The game leaderboard and your actual grade are two different things. They pull from some of the same activities but weight them differently. The weekly game is the biggest example: the game weights all question types equally, but your grade weights On Topic and From Reading questions much more heavily than Sports World questions. So if you want to climb the leaderboard, be good at everything. If you want a good grade, make sure you're doing the reading.
          </div>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginTop: 10 }}>
            The top 5 on the leaderboard at the end of the quarter get automatic A's. That's real. Everything else, just do the work, show up, and engage.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {assignments.map(a => {
            const isEdit = isAdmin && editId === a.id;
            const g = studentId ? (grades[studentId + "-" + a.id] || {}) : null;
            return (
              <div key={a.id} style={{ ...crd, padding: 16, cursor: isAdmin && !isEdit ? "pointer" : "default" }} onClick={() => isAdmin && !isEdit && setEditId(a.id)}>
                {isEdit ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }} onClick={e => e.stopPropagation()}>
                    <input value={a.name} onChange={e => updateAssignment(a.id, "name", e.target.value)} style={{ ...inp, fontWeight: 700, fontSize: 15 }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Weight (%)</div>
                        <input type="number" value={a.weight} onChange={e => updateAssignment(a.id, "weight", parseInt(e.target.value) || 0)} style={{ ...inp }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...sectionLabel, marginBottom: 4 }}>Due Date</div>
                        <input value={a.due} onChange={e => updateAssignment(a.id, "due", e.target.value)} placeholder="e.g. Apr 20" style={{ ...inp }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ ...sectionLabel, marginBottom: 4 }}>Google Doc Link</div>
                      <input value={a.link || ""} onChange={e => updateAssignment(a.id, "link", e.target.value)} placeholder="https://docs.google.com/..." style={{ ...inp }} />
                    </div>
                    <div>
                      <div style={{ ...sectionLabel, marginBottom: 4 }}>Notes</div>
                      <input value={a.notes || ""} onChange={e => updateAssignment(a.id, "notes", e.target.value)} placeholder="Optional notes" style={{ ...inp }} />
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={save} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 0", flex: 1 }}>Done</button>
                      {a.id !== "participation" && <button onClick={() => { if (window.confirm("Remove " + a.name + "?")) removeAssignment(a.id); }} style={{ ...pill, background: "#fef2f2", color: "#ef4444", padding: "10px 16px" }}>Delete</button>}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: a.id === "participation" ? "#f3f4f6" : ACCENT + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: a.id === "participation" ? "#6b7280" : ACCENT, flexShrink: 0 }}>{a.weight}%</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                          {a.due && <span>Due {a.due}</span>}
                          {a.notes && <span>{a.due ? " / " : ""}{a.notes}</span>}
                        </div>
                      </div>
                      {a.link && (
                        <a href={a.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ ...pillInactive, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          Details <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      )}
                      {isAdmin && !a.link && <span style={{ fontSize: 11, color: "#d1d5db", fontStyle: "italic" }}>Click to edit</span>}
                    </div>
                    {/* Student grade inline */}
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
                  </div>
                )}
              </div>
            );
          })}
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
              else if (src === "PTI") bucket = "PTI";
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
                    { label: "PTI", game: gamePts["PTI"] || 0, grade: gradePtiTotal, weeks: ptiWeeks, icon: "P" },
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
                { label: "PTI", detail: "Variable, game + grade", icon: "P" },
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
export function Gradebook({ data, setData, userName, isAdmin }) {
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const grades = data.grades || {};
  const participation = data.participation || {};
  const [selStudent, setSelStudent] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const isGuest = userName === GUEST_NAME;

  const student = isAdmin ? (selStudent ? data.students.find(s => s.id === selStudent) : null) : data.students.find(s => s.name === userName);
  const studentId = student?.id;

  const updateGrade = async (studentId, assignmentId, field, value) => {
    const key = studentId + "-" + assignmentId;
    const existing = grades[key] || {};
    const updated = { ...data, grades: { ...grades, [key]: { ...existing, [field]: value } } };
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
      const scores = typeof val === "object" ? val : { on_topic: 0, reading: 0, sports_world: 0 };
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

  const renderStudentGrades = (sid) => {
    const quizData = calcQuizScores(sid);
    const totData = calcCategoryTotal(sid, "tot");
    const ptiData = calcCategoryTotal(sid, "pti");
    const fbData = calcCategoryTotal(sid, "fishbowl");

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
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                    <input type="number" value={g.score ?? ""} onChange={e => updateGrade(sid, a.id, "score", e.target.value)} placeholder="Score" style={{ ...inp, width: 80, padding: "6px 10px", fontSize: 13 }} />
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>/</span>
                    <input type="number" value={g.outOf ?? 100} onChange={e => updateGrade(sid, a.id, "outOf", e.target.value)} placeholder="100" style={{ ...inp, width: 60, padding: "6px 10px", fontSize: 13 }} />
                    <input value={g.comment || ""} onChange={e => updateGrade(sid, a.id, "comment", e.target.value)} placeholder="Comment..." style={{ ...inp, flex: 1, padding: "6px 10px", fontSize: 13 }} />
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

        <div style={{ ...sectionLabel, marginBottom: 8 }}>Participation (25%)</div>
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ ...sectionLabel, marginBottom: 2 }}>Game (Game)</div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{quizData.totalGame}</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}> / {quizData.totalGamePossible}</span>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ ...sectionLabel, marginBottom: 2 }}>Game (Grade)</div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{quizData.totalGrade}</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}> / {quizData.totalGradePossible}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ ...sectionLabel, marginBottom: 2 }}>This or That</div>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{totData.total}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}> ({totData.count} wks)</span>
              <div style={{ fontSize: 10, color: "#d1d5db" }}>Game only</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ ...sectionLabel, marginBottom: 2 }}>PTI</div>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{ptiData.total}</span>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Game + Grade</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ ...sectionLabel, marginBottom: 2 }}>Fishbowl</div>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{fbData.total}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}> ({fbData.count}x)</span>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Game + Grade</div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div style={{ ...crd, padding: 14 }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Weekly Participation Entry</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", fontFamily: F }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Wk</th>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>On Topic</th>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Reading</th>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Sports W.</th>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>ToT</th>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>PTI</th>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>FB</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, wi) => {
                    const w = wi + 1;
                    const quizVal = getParticipation(sid, w, "quiz") || {};
                    const quizScores = typeof quizVal === "object" ? quizVal : {};
                    return (
                      <tr key={w} style={{ borderBottom: "1px solid #f9fafb" }}>
                        <td style={{ padding: "4px", fontWeight: 900, color: "#111827" }}>{w}</td>
                        <td style={{ padding: "4px" }}><input type="number" min="0" max="3" value={quizScores.on_topic ?? ""} onChange={e => { const v = { ...quizScores, on_topic: parseInt(e.target.value) || 0 }; updateParticipation(sid, w, "quiz", v); }} style={{ ...inp, width: 36, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                        <td style={{ padding: "4px" }}><input type="number" min="0" max="3" value={quizScores.reading ?? ""} onChange={e => { const v = { ...quizScores, reading: parseInt(e.target.value) || 0 }; updateParticipation(sid, w, "quiz", v); }} style={{ ...inp, width: 36, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                        <td style={{ padding: "4px" }}><input type="number" min="0" max="4" value={quizScores.sports_world ?? ""} onChange={e => { const v = { ...quizScores, sports_world: parseInt(e.target.value) || 0 }; updateParticipation(sid, w, "quiz", v); }} style={{ ...inp, width: 36, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                        <td style={{ padding: "4px" }}><input type="number" value={getParticipation(sid, w, "tot") ?? ""} onChange={e => updateParticipation(sid, w, "tot", e.target.value)} style={{ ...inp, width: 36, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                        <td style={{ padding: "4px" }}><input type="number" value={getParticipation(sid, w, "pti") ?? ""} onChange={e => updateParticipation(sid, w, "pti", e.target.value)} style={{ ...inp, width: 36, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                        <td style={{ padding: "4px" }}><input type="number" value={getParticipation(sid, w, "fishbowl") ?? ""} onChange={e => updateParticipation(sid, w, "fishbowl", e.target.value)} style={{ ...inp, width: 36, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isGuest) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ ...sectionLabel, marginBottom: 8 }}>Grades</div><div style={{ fontSize: 14, color: TEXT_SECONDARY }}>Sign in as a student to view grades.</div></div>;
  }

  if (isAdmin) {
    const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME).sort(lastSortObj);
    const gradeAssignments = assignments.filter(a => a.id !== "participation");

    return (
      <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Gradebook</div>
          <div style={{ ...crd, overflow: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", fontFamily: F, minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", position: "sticky", left: 0, background: "#fff", zIndex: 2 }}>Student</th>
                  {gradeAssignments.map(a => (
                    <th key={a.id} style={{ textAlign: "center", padding: "10px 8px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase", maxWidth: 100 }}>
                      <div>{a.name.split(" ").slice(0, 2).join(" ")}</div>
                      <div style={{ fontSize: 9, color: "#d1d5db", fontWeight: 500 }}>{a.weight}%</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", fontSize: 13, whiteSpace: "nowrap", position: "sticky", left: 0, background: "#fff", zIndex: 1, cursor: "pointer" }} onClick={() => setSelStudent(selStudent === s.id ? null : s.id)}>
                      <span style={{ borderBottom: selStudent === s.id ? "2px solid " + ACCENT : "none", paddingBottom: 1 }}>{s.name}</span>
                    </td>
                    {gradeAssignments.map(a => {
                      const cellKey = s.id + "-" + a.id;
                      const g = grades[cellKey] || {};
                      const isEditing = editingCell === cellKey;
                      const score = g.score;
                      const outOf = g.outOf || 100;
                      return (
                        <td key={a.id} style={{ textAlign: "center", padding: "4px 6px" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "center" }} onClick={e => e.stopPropagation()}>
                              <input autoFocus type="number" value={score ?? ""} onChange={e => updateGrade(s.id, a.id, "score", e.target.value)} onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)} style={{ ...inp, width: 48, padding: "4px 4px", fontSize: 12, textAlign: "center" }} />
                            </div>
                          ) : (
                            <button onClick={() => setEditingCell(cellKey)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 700, padding: "4px 8px", borderRadius: 6, color: score !== undefined && score !== "" ? "#111827" : "#d1d5db", minWidth: 40 }}>
                              {score !== undefined && score !== "" ? score + "/" + outOf : "-"}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
