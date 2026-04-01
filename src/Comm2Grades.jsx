import React, { useState } from "react";

const F = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const ACCENT = "#2563eb";
const TEXT_SECONDARY = "#52525b";
const TEXT_MUTED = "#a1a1aa";
const BORDER = "#e8e8ec";
const GREEN = "#059669";
const RED = "#dc2626";

const crd = { background: "#fff", borderRadius: 14, border: "1px solid " + BORDER, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
const pill = { padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillInactive = { ...pill, background: "#f4f4f5", color: "#52525b" };
const sectionLabel = { fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F };
const inp = { background: "#fff", border: "1.5px solid " + BORDER, borderRadius: 10, padding: "10px 14px", color: "#18181b", fontFamily: F, fontSize: 15, fontWeight: 400, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

const ADMIN_NAME = "Andrew Ishak";
const GUEST_NAME = "__guest__";

export const DEFAULT_ASSIGNMENTS = [
  { id: "speech_college", name: "Why I Chose to Go to College", weight: 3, due: "Apr 6", link: "", notes: "Position speech, ~60 seconds, pass/fail" },
  { id: "speech_character", name: "Does Character Matter in College?", weight: 3, due: "Apr 10", link: "", notes: "Response to Brooks & Lamb, must include a story, ~60 seconds, pass/fail" },
  { id: "speech_ethics", name: "Ethics Bowl", weight: 5, due: "Apr 17", link: "", notes: "" },
  { id: "speech_occasion", name: "Special Occasion", weight: 10, due: "Apr 24", link: "", notes: "Submit Fri Apr 24, present in class Mon Apr 27" },
  { id: "speech_wildcard", name: "Wildcard", weight: 3, due: "May 1", link: "", notes: "Press conference, interviewing, something local, or influencer. ~60 seconds, pass/fail" },
  { id: "speech_preview", name: "Preview", weight: 5, due: "May 8", link: "", notes: "" },
  { id: "speech_3things", name: "3 Things to Know", weight: 20, due: "May 15", link: "", notes: "" },
  { id: "speech_goodchange1", name: "A Good Change Rd 1", weight: 10, due: "May 27", link: "", notes: "In class" },
  { id: "speech_improvements", name: "Improvements", weight: 3, due: "Jun 5", link: "", notes: "~60 seconds, pass/fail, in class" },
  { id: "speech_goodchange2", name: "A Good Change Rd 2", weight: 20, due: "Jun 10", link: "", notes: "Finals week, 12:10 PM. Revised version of Rd 1" },
  { id: "video_account", name: "Video Account Setup", weight: 1, due: "", link: "", notes: "Set up Vimeo, YouTube, or TikTok account and grant access" },
  { id: "peer_review_1", name: "Peer Review #1", weight: 1, due: "", link: "", notes: "Using course resources" },
  { id: "peer_review_2", name: "Peer Review #2", weight: 1, due: "", link: "", notes: "Using course resources" },
  { id: "teach_class", name: "Teach the Class", weight: 5, due: "", link: "", notes: "Sign-up slots" },
  { id: "contribution", name: "Contribution Summary", weight: 10, due: "", link: "", notes: "End of quarter, includes discussion boards throughout the quarter" },
];

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#18181b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function lastName(name) { return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }

async function saveData(data) { try { await window.storage.set("comm2-v1", JSON.stringify(data), true); return true; } catch { return false; } }

/* --- ASSIGNMENTS TAB --- */
export function AssignmentsView({ data, setData, isAdmin, userName }) {
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
    const updated = { ...data, assignments: assignments.filter(a => a.id !== id) };
    await saveData(updated); setData(updated); setEditId(null); setEditLocal(null); showMsg("Removed");
  };

  const defaultBlurb = "This class has 15 things to accomplish. 10 are speeches, and the rest are setup, peer reviews, teaching the class, and your contribution summary.\n\nSmall speeches (marked with *) are pass/fail, about 60 seconds each. Bigger speeches have a quality component and pre-work documents that factor into the grade.\n\nThe top 5 on the leaderboard at the end of the quarter get automatic A's. That's real. Everything else, do the work, submit on time, and engage.";
  const blurbText = data.assignmentsBlurb || defaultBlurb;

  const saveBlurb = async () => {
    const updated = { ...data, assignmentsBlurb: blurbLocal };
    await saveData(updated); setData(updated);
    setEditBlurb(false); showMsg("Saved");
  };

  const totalWeight = assignments.reduce((s, a) => s + (a.weight || 0), 0);

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ ...sectionLabel }}>Assignments & Weights</div>
          <div style={{ display: "flex", gap: 6 }}>
            {isAdmin && <button onClick={() => { setEditBlurb(!editBlurb); setBlurbLocal(blurbText); }} style={pillInactive}>{editBlurb ? "Cancel" : "Edit Blurb"}</button>}
            {isAdmin && <button onClick={addAssignment} style={pillInactive}>+ Add</button>}
          </div>
        </div>

        {/* Student header */}
        {studentId && (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: TEXT_MUTED }}>Your Rank</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: studentRank <= 5 ? GREEN : "#18181b" }}>#{studentRank}{studentRank <= 5 && <span style={{ fontSize: 12, color: GREEN, marginLeft: 6, fontWeight: 600 }}>A Zone</span>}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: TEXT_MUTED }}>Game Points</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#18181b" }}>{studentPts}</div>
              </div>
            </div>
          </div>
        )}

        {/* Blurb */}
        {editBlurb ? (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <textarea value={blurbLocal} onChange={e => setBlurbLocal(e.target.value)} rows={8} style={{ ...inp, resize: "vertical", fontSize: 13 }} />
            <button onClick={saveBlurb} style={{ ...pill, background: "#18181b", color: "#fff", marginTop: 8, width: "100%" }}>Save</button>
          </div>
        ) : (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{blurbText}</div>
          </div>
        )}

        {/* Weight total */}
        <div style={{ fontSize: 12, color: totalWeight === 100 ? GREEN : RED, fontWeight: 700, marginBottom: 12 }}>Total weight: {totalWeight}%</div>

        {/* Assignment cards */}
        {assignments.map(a => {
          const isEditing = editId === a.id;
          const grade = studentId ? grades[studentId + "-" + a.id] : null;
          const submissions = data.submissions || {};
          const mySubKey = studentId ? studentId + "-" + a.id : null;
          const mySub = mySubKey ? submissions[mySubKey] : null;
          const [showSubs, setShowSubs] = React.useState(false);

          return (
            <div key={a.id} style={{ ...crd, padding: 16, marginBottom: 8 }}>
              {isEditing && isAdmin ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input value={editLocal.name} onChange={e => setEditLocal({ ...editLocal, name: e.target.value })} placeholder="Name" style={{ ...inp, fontSize: 13 }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={editLocal.weight} onChange={e => setEditLocal({ ...editLocal, weight: e.target.value })} placeholder="Weight %" style={{ ...inp, fontSize: 13, width: 80 }} type="number" />
                    <input value={editLocal.due} onChange={e => setEditLocal({ ...editLocal, due: e.target.value })} placeholder="Due date" style={{ ...inp, fontSize: 13, flex: 1 }} />
                  </div>
                  <input value={editLocal.link} onChange={e => setEditLocal({ ...editLocal, link: e.target.value })} placeholder="Google Doc / link" style={{ ...inp, fontSize: 13 }} />
                  <textarea value={editLocal.notes} onChange={e => setEditLocal({ ...editLocal, notes: e.target.value })} placeholder="Notes" rows={2} style={{ ...inp, fontSize: 13, resize: "vertical" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={saveEdit} style={{ ...pill, background: "#18181b", color: "#fff", flex: 1 }}>Save</button>
                    <button onClick={() => { setEditId(null); setEditLocal(null); }} style={pillInactive}>Cancel</button>
                    <button onClick={() => removeAssignment(a.id)} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div onClick={() => isAdmin && startEdit(a)} style={{ cursor: isAdmin ? "pointer" : "default" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#18181b" }}>{a.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{a.weight}%</div>
                    </div>
                    {a.due && <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>Due: {a.due}</div>}
                    {a.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.4 }}>{a.notes}</div>}
                    {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: ACCENT, marginTop: 4, display: "block", textDecoration: "none", fontWeight: 600 }}>Open assignment link</a>}
                  </div>

                  {/* Student grade + comment display */}
                  {grade && grade.score !== undefined && grade.score !== "" && (
                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#eff6ff", borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>{grade.score}</span>
                        <span style={{ fontSize: 12, color: TEXT_MUTED }}>/{grade.outOf || 100}</span>
                      </div>
                      {grade.comment && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.4 }}>{grade.comment}</div>}
                    </div>
                  )}

                  {/* Student submission form */}
                  {studentId && !isAdmin && (
                    <StudentSubmission assignmentId={a.id} data={data} setData={setData} studentId={studentId} existing={mySub} />
                  )}

                  {/* Admin: view submissions */}
                  {isAdmin && (
                    <div style={{ marginTop: 10 }}>
                      {(() => {
                        const subCount = data.students.filter(s => s.name !== "Andrew Ishak" && submissions[s.id + "-" + a.id]).length;
                        return (
                          <button onClick={() => setShowSubs(!showSubs)} style={{ ...pillInactive, fontSize: 12, width: "100%" }}>
                            {showSubs ? "Hide Submissions" : "View Submissions (" + subCount + ")"}
                          </button>
                        );
                      })()}
                      {showSubs && (
                        <AdminSubmissions assignmentId={a.id} data={data} setData={setData} />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- GRADEBOOK --- */
/* --- STUDENT SUBMISSION --- */
function StudentSubmission({ assignmentId, data, setData, studentId, existing }) {
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl || "");
  const [docUrl, setDocUrl] = useState(existing?.docUrl || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  React.useEffect(() => {
    setVideoUrl(existing?.videoUrl || "");
    setDocUrl(existing?.docUrl || "");
    setNotes(existing?.notes || "");
  }, [existing?.videoUrl, existing?.docUrl, existing?.notes]);

  const submit = async () => {
    if (!videoUrl.trim() && !docUrl.trim()) return;
    const key = studentId + "-" + assignmentId;
    const submissions = data.submissions || {};
    const updated = { ...data, submissions: { ...submissions, [key]: { videoUrl: videoUrl.trim(), docUrl: docUrl.trim(), notes: notes.trim(), ts: Date.now() } } };
    await saveData(updated); setData(updated); showMsg("Submitted");
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
      {msg && <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginBottom: 4 }}>{msg}</div>}
      <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Your Submission</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Video link (Vimeo, YouTube, TikTok...)" style={{ ...inp, fontSize: 13, padding: "8px 10px" }} />
        <input value={docUrl} onChange={e => setDocUrl(e.target.value)} placeholder="Google Doc link" style={{ ...inp, fontSize: 13, padding: "8px 10px" }} />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes for your instructor (optional)" rows={2} style={{ ...inp, fontSize: 13, padding: "8px 10px", resize: "vertical" }} />
        <button onClick={submit} style={{ ...pill, background: "#18181b", color: "#fff", width: "100%" }}>{existing?.ts ? "Resubmit" : "Submit"}</button>
      </div>
      {existing?.ts && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 6 }}>Submitted {new Date(existing.ts).toLocaleString()}</div>}
    </div>
  );
}

/* --- ADMIN SUBMISSIONS VIEW --- */
function AdminSubmissions({ assignmentId, data, setData }) {
  const submissions = data.submissions || {};
  const grades = data.grades || {};
  const sorted = [...data.students].filter(s => s.name !== "Andrew Ishak").sort(lastSortObj);
  const [editGrades, setEditGrades] = useState({});
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const saveGrade = async (studentId) => {
    const eg = editGrades[studentId] || {};
    const key = studentId + "-" + assignmentId;
    const existing = grades[key] || {};
    const updated = {
      ...data,
      grades: {
        ...grades,
        [key]: {
          ...existing,
          score: eg.score !== undefined ? (eg.score === "" ? undefined : parseFloat(eg.score)) : existing.score,
          outOf: eg.outOf !== undefined ? (parseFloat(eg.outOf) || 100) : (existing.outOf || 100),
          comment: eg.comment !== undefined ? eg.comment : (existing.comment || ""),
        }
      }
    };
    await saveData(updated); setData(updated);
    setEditGrades(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    showMsg("Saved");
  };

  const startEdit = (studentId) => {
    const key = studentId + "-" + assignmentId;
    const g = grades[key] || {};
    setEditGrades(prev => ({ ...prev, [studentId]: { score: g.score !== undefined ? String(g.score) : "", outOf: String(g.outOf || 100), comment: g.comment || "" } }));
  };

  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      {msg && <div style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>{msg}</div>}
      {sorted.map(s => {
        const sub = submissions[s.id + "-" + assignmentId];
        const grade = grades[s.id + "-" + assignmentId] || {};
        const isEditing = editGrades[s.id] !== undefined;
        const eg = editGrades[s.id] || {};

        return (
          <div key={s.id} style={{ padding: 12, borderRadius: 10, background: sub ? "#f9fafb" : "transparent", border: "1px solid " + (sub ? BORDER : "#f4f4f5") }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: sub ? 6 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>{s.name}</div>
              {grade.score !== undefined && !isEditing && (
                <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>{grade.score}<span style={{ fontSize: 12, color: TEXT_MUTED }}>/{grade.outOf || 100}</span></div>
              )}
              {!sub && !isEditing && <span style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>No submission</span>}
            </div>

            {sub && (
              <div style={{ marginBottom: 8 }}>
                {sub.videoUrl && <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ACCENT, textDecoration: "none", fontWeight: 500, display: "block", marginBottom: 2 }}>Video</a>}
                {sub.docUrl && <a href={sub.docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ACCENT, textDecoration: "none", fontWeight: 500, display: "block", marginBottom: 2 }}>Google Doc</a>}
                {sub.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 1.4 }}>"{sub.notes}"</div>}
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>Submitted {new Date(sub.ts).toLocaleString()}</div>
              </div>
            )}

            {grade.comment && !isEditing && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, padding: "6px 8px", background: "#eff6ff", borderRadius: 6, lineHeight: 1.4 }}>{grade.comment}</div>}

            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={eg.score} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, score: e.target.value } }))} placeholder="Score" style={{ ...inp, fontSize: 13, padding: "6px 8px", width: 70 }} type="number" />
                  <span style={{ fontSize: 13, color: TEXT_MUTED, display: "flex", alignItems: "center" }}>/</span>
                  <input value={eg.outOf} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, outOf: e.target.value } }))} placeholder="Out of" style={{ ...inp, fontSize: 13, padding: "6px 8px", width: 70 }} type="number" />
                </div>
                <textarea value={eg.comment} onChange={e => setEditGrades(prev => ({ ...prev, [s.id]: { ...eg, comment: e.target.value } }))} placeholder="Comment for student..." rows={2} style={{ ...inp, fontSize: 13, padding: "6px 8px", resize: "vertical" }} />
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => saveGrade(s.id)} style={{ ...pill, background: "#18181b", color: "#fff", flex: 1 }}>Save</button>
                  <button onClick={() => setEditGrades(prev => { const n = { ...prev }; delete n[s.id]; return n; })} style={pillInactive}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => startEdit(s.id)} style={{ ...pillInactive, fontSize: 12, marginTop: 6, width: "100%" }}>Grade</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Gradebook({ data, setData, isAdmin, userName }) {
  const assignments = data.assignments || DEFAULT_ASSIGNMENTS;
  const grades = data.grades || {};
  const [editingCell, setEditingCell] = useState(null);
  const [selStudent, setSelStudent] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const isGuest = userName === GUEST_NAME;

  const updateGrade = async (studentId, assignmentId, field, value) => {
    const key = studentId + "-" + assignmentId;
    const existing = grades[key] || {};
    const updated = { ...data, grades: { ...grades, [key]: { ...existing, [field]: value === "" ? undefined : parseFloat(value), outOf: existing.outOf || 100 } } };
    await saveData(updated); setData(updated);
  };

  const getParticipation = (sid, week, type) => {
    return data.participation?.[sid + "-w" + week + "-" + type];
  };

  const updateParticipation = async (sid, week, type, value) => {
    const key = sid + "-w" + week + "-" + type;
    const updated = { ...data, participation: { ...(data.participation || {}), [key]: value === "" ? undefined : parseFloat(value) || value } };
    await saveData(updated); setData(updated);
  };

  const renderStudentGrades = (sid) => {
    const student = data.students.find(s => s.id === sid);
    if (!student) return null;
    return (
      <div>
        {assignments.map(a => {
          const g = grades[sid + "-" + a.id] || {};
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f4f4f5" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>{a.name}</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED }}>{a.weight}%{a.due ? " / Due: " + a.due : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input type="number" value={g.score ?? ""} onChange={e => updateGrade(sid, a.id, "score", e.target.value)} style={{ ...inp, width: 56, padding: "4px 6px", fontSize: 13, textAlign: "center" }} placeholder="-" />
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>/{g.outOf || 100}</span>
              </div>
            </div>
          );
        })}

        {/* Weekly participation breakdown */}
        <div style={{ marginTop: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Weekly Participation</div>
          <div style={{ ...crd, padding: 12 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", fontFamily: F }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f4f4f5" }}>
                  <th style={{ textAlign: "left", padding: "6px 4px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Wk</th>
                  <th style={{ textAlign: "left", padding: "6px 4px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>Game</th>
                  <th style={{ textAlign: "left", padding: "6px 4px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>ToT</th>
                  <th style={{ textAlign: "left", padding: "6px 4px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>PTI</th>
                  <th style={{ textAlign: "left", padding: "6px 4px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>FB</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, wi) => {
                  const w = wi + 1;
                  return (
                    <tr key={w} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "4px", fontWeight: 800, color: "#18181b" }}>{w}</td>
                      <td style={{ padding: "4px" }}><input type="number" value={getParticipation(sid, w, "game") ?? ""} onChange={e => updateParticipation(sid, w, "game", e.target.value)} style={{ ...inp, width: 40, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                      <td style={{ padding: "4px" }}><input type="number" value={getParticipation(sid, w, "tot") ?? ""} onChange={e => updateParticipation(sid, w, "tot", e.target.value)} style={{ ...inp, width: 40, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                      <td style={{ padding: "4px" }}><input type="number" value={getParticipation(sid, w, "pti") ?? ""} onChange={e => updateParticipation(sid, w, "pti", e.target.value)} style={{ ...inp, width: 40, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                      <td style={{ padding: "4px" }}><input type="number" value={getParticipation(sid, w, "fishbowl") ?? ""} onChange={e => updateParticipation(sid, w, "fishbowl", e.target.value)} style={{ ...inp, width: 40, padding: "3px 4px", fontSize: 12, textAlign: "center" }} placeholder="-" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (isGuest) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ ...sectionLabel, marginBottom: 8 }}>Grades</div><div style={{ fontSize: 14, color: TEXT_SECONDARY }}>Sign in as a student to view grades.</div></div>;
  }

  if (isAdmin) {
    const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME).sort(lastSortObj);
    const gradeAssignments = assignments;

    return (
      <div style={{ padding: "20px 16px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Gradebook</div>
          <div style={{ ...crd, overflow: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", fontFamily: F, minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f4f4f5" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", position: "sticky", left: 0, background: "#fff", zIndex: 2 }}>Student</th>
                  {gradeAssignments.map(a => (
                    <th key={a.id} style={{ textAlign: "center", padding: "10px 8px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase", maxWidth: 100 }}>
                      <div>{a.name.split(" ").slice(0, 2).join(" ")}</div>
                      <div style={{ fontSize: 9, color: "#d4d4d8", fontWeight: 500 }}>{a.weight}%</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#18181b", fontSize: 13, whiteSpace: "nowrap", position: "sticky", left: 0, background: "#fff", zIndex: 1, cursor: "pointer" }} onClick={() => setSelStudent(selStudent === s.id ? null : s.id)}>
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
                            <button onClick={() => setEditingCell(cellKey)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 700, padding: "4px 8px", borderRadius: 6, color: score !== undefined && score !== "" ? "#18181b" : "#d4d4d8", minWidth: 40 }}>
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
                <div style={{ fontSize: 16, fontWeight: 800, color: "#18181b" }}>{data.students.find(s => s.id === selStudent)?.name}</div>
                <button onClick={() => setSelStudent(null)} style={pillInactive}>Close</button>
              </div>
              {renderStudentGrades(selStudent)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Student view
  const studentId2 = data.students.find(s => s.name === userName)?.id;
  if (!studentId2) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: TEXT_SECONDARY }}>Student not found.</div>;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>My Grades</div>
        {renderStudentGrades(studentId2)}
      </div>
    </div>
  );
}
