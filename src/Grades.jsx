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
  { id: "woc_proposal", name: "Web of Connections Proposal", weight: 5, due: "Apr 20", link: "", notes: "" },
  { id: "woc_submission", name: "Web of Connections Submission", weight: 20, due: "May 6", link: "", notes: "" },
  { id: "leadership_guide", name: "Leadership Guide", weight: 20, due: "May 20", link: "", notes: "" },
  { id: "final_project", name: "Final Project: Teach Me Something New", weight: 30, due: "Jun 8", link: "", notes: "" },
  { id: "participation", name: "Participation", weight: 25, due: "", link: "", notes: "Quizzes, Real or Fake, PTI, Rotating Fishbowl" },
];

export const QUIZ_BREAKDOWN = [
  { id: "on_topic", label: "On Topic", count: 3, gamePts: 10, gradePts: 40/3 },
  { id: "reading", label: "From Reading", count: 3, gamePts: 10, gradePts: 50/3 },
  { id: "sports_world", label: "Sports World", count: 4, gamePts: 10, gradePts: 10/4 },
];

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }

function lastName(name) { if (name === "Alexander Watanabe Eriksson") return "Watanabe Eriksson"; return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }

async function saveData(data) { try { const STORAGE_KEY = "comm118-game-v14"; await window.storage.set(STORAGE_KEY, JSON.stringify(data), true); return true; } catch { return false; } }

/* ─── ASSIGNMENTS TAB ─── */
export function AssignmentsView({ data, setData, isAdmin }) {
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const updateAssignment = async (id, field, value) => {
    const updated = { ...data, assignments: (data.assignments || DEFAULT_ASSIGNMENTS).map(a => a.id === id ? { ...a, [field]: value } : a) };
    await saveData(updated); setData(updated);
  };

  const save = () => { setEditId(null); showMsg("Saved"); };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Assignments & Weights</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {assignments.map(a => {
            const isEdit = isAdmin && editId === a.id;
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
                    <button onClick={save} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 0", width: "100%" }}>Done</button>
                  </div>
                ) : (
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
                )}
              </div>
            );
          })}
        </div>
        <div style={{ ...crd, padding: 16, marginTop: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Participation Breakdown (25%)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Weekly Quiz", detail: "100 pts/week, dual weighted", icon: "Q" },
              { label: "Real or Fake", detail: "10 pts/week, game only", icon: "RF" },
              { label: "PTI (Culture Points)", detail: "Variable, game + grade", icon: "P" },
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
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f3f4f6" }}>
            <div style={{ ...sectionLabel, marginBottom: 6 }}>Quiz Dual Weighting</div>
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
                  <div style={{ color: "#6b7280" }}>{Math.round(q.gradePts * 100) / 100} pts ea</div>
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
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
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

  const renderStudentGrades = (sid, sName) => {
    const quizData = calcQuizScores(sid);
    const rofData = calcCategoryTotal(sid, "rof");
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
              <div style={{ ...sectionLabel, marginBottom: 2 }}>Quiz (Game)</div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{quizData.totalGame}</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}> / {quizData.totalGamePossible}</span>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ ...sectionLabel, marginBottom: 2 }}>Quiz (Grade)</div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>{quizData.totalGrade}</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}> / {quizData.totalGradePossible}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div style={{ padding: 10, borderRadius: 8, background: "#f8fafc" }}>
              <div style={{ ...sectionLabel, marginBottom: 2 }}>Real or Fake</div>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{rofData.total}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}> ({rofData.count} wks)</span>
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
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#9ca3af", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>RoF</th>
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
                        <td style={{ padding: "4px" }}><input type="number" value={getParticipation(sid, w, "rof") ?? ""} onChange={e => updateParticipation(sid, w, "rof", e.target.value)} style={{ ...inp, width: 36, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
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
    const sorted = [...data.students].sort(lastSortObj);
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Gradebook</div>
          <div style={{ marginBottom: 16 }}>
            <select value={selStudent || ""} onChange={e => setSelStudent(e.target.value || null)} style={{ ...sel, width: "100%", fontSize: 14, padding: "10px 12px" }}>
              <option value="">Select a student...</option>
              {sorted.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {studentId && renderStudentGrades(studentId, student.name)}
          {!studentId && <div style={{ textAlign: "center", color: "#d1d5db", fontSize: 14, padding: 40 }}>Pick a student above to view and edit grades.</div>}
        </div>
      </div>
    );
  }

  if (!studentId) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: TEXT_SECONDARY }}>Student not found.</div>;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>My Grades</div>
        {renderStudentGrades(studentId, student.name)}
      </div>
    </div>
  );
}
