import React, { useState } from "react";
import { ReboundPanel } from "./Comm2Game.jsx";

const F = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const ACCENT = "#2563eb";
const TEXT_SECONDARY = "#52525b";
const TEXT_MUTED = "#a1a1aa";
const BORDER = "#e8e8ec";
const GREEN = "#059669";
const RED = "#dc2626";
const AMBER = "#d97706";

const crd = { background: "#fff", borderRadius: 14, border: "1px solid " + BORDER, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
const pill = { padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillInactive = { ...pill, background: "#f4f4f5", color: "#52525b" };
const sectionLabel = { fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F };
const inp = { background: "#fff", border: "1.5px solid " + BORDER, borderRadius: 10, padding: "10px 14px", color: "#18181b", fontFamily: F, fontSize: 15, fontWeight: 400, outline: "none", width: "100%", boxSizing: "border-box" };
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
function TogglePanel({ label, count, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setShow(!show)} style={{ ...pillInactive, fontSize: 12, width: "100%" }}>{show ? "Hide Submissions" : label + " (" + count + ")"}</button>
      {show && children}
    </div>
  );
}

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
          const isEditing = editId === a.id;
          const grade = studentId ? grades[studentId + "-" + a.id] : null;
          const submissions = data.submissions || {};
          const mySubKey = studentId ? studentId + "-" + a.id : null;
          const mySub = mySubKey ? submissions[mySubKey] : null;
          const isNext = a.id === nextDueId;

          return (
            <div key={a.id} style={{ ...crd, padding: 16, marginBottom: 8, border: isNext ? "2px solid " + ACCENT : crd.border }}>
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
                    {a.due && <div style={{ fontSize: 13, color: isNext ? ACCENT : TEXT_SECONDARY, fontWeight: isNext ? 700 : 500, marginTop: 4 }}>{isNext ? "Due next: " : "Due: "}{a.due}</div>}
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
                    <TogglePanel label="View Submissions" count={data.students.filter(s => s.name !== "Andrew Ishak" && submissions[s.id + "-" + a.id]).length}>
                      <AdminSubmissions assignmentId={a.id} data={data} setData={setData} />
                    </TogglePanel>
                  )}
                </div>
              )}
            </div>
          );
        });
        })()}
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
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reboundModal, setReboundModal] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [activityFilter, setActivityFilter] = useState("all");
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
          original += 10;
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

    const athEntries = log.filter(e => e.studentId === sid && (e.source || "") === "Participation");
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
          original += 10;
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
      .filter(e => e.studentId === sid && e.source === "Participation")
      .reduce((s, e) => s + e.amount, 0);
  };

  const getAZone = () => {
    const ranked = data.students
      .filter(s => s.name !== ADMIN_NAME)
      .map(s => ({ id: s.id, points: (data.log || []).filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) }))
      .sort((a, b) => b.points - a.points);
    return new Set(ranked.slice(0, 5).map(s => s.id));
  };

  const getRank = (sid) => {
    const ranked = data.students
      .filter(s => s.name !== ADMIN_NAME)
      .map(s => ({ id: s.id, points: (data.log || []).filter(e => e.studentId === s.id).reduce((t, e) => t + e.amount, 0) }))
      .sort((a, b) => b.points - a.points);
    const idx = ranked.findIndex(s => s.id === sid);
    return idx === -1 ? null : idx + 1;
  };

  const cellColor = (pct, hasRebound) => {
    if (hasRebound) return { bg: "#dbeafe", color: "#1e40af" };
    if (pct === null || pct === 0) return { bg: "#f4f4f5", color: TEXT_MUTED };
    if (pct >= 80) return { bg: "#dcfce7", color: "#166534" };
    return { bg: "#fef3c7", color: "#92400e" };
  };


  const renderStudentGrades = (sid) => {
    const student = data.students.find(s => s.id === sid);
    if (!student) return null;
    const p = computeAutoParticipation(sid);
    const gameWeeks = getWeeklyGameBreakdown(sid);
    const totWeeks = getWeeklyToTBreakdown(sid);
    const fbWeeks = getWeeklyFishbowlBreakdown(sid);
    return (
      <div>
        {assignments.map(a => {
          const g = grades[sid + "-" + a.id] || {};
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f4f4f5" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>{a.name}</div>
                <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>{a.weight}%{a.due ? " / Due: " + a.due : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input type="number" value={g.score ?? ""} onChange={e => updateGrade(sid, a.id, "score", e.target.value)} style={{ ...inp, width: 56, padding: "4px 6px", fontSize: 13, textAlign: "center" }} placeholder="-" />
                <span style={{ fontSize: 12, color: TEXT_MUTED }}>/{g.outOf || 100}</span>
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Weekly Game Breakdown</div>
          <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
            {gameWeeks.length === 0 ? (
              <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic" }}>No games scored yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {gameWeeks.map(g => {
                  const final = g.applied !== null ? g.applied : g.original;
                  const status = !g.answered ? "absent" : g.applied !== null ? "rebound" : final >= 80 ? "ok" : "low";
                  return (
                    <div key={g.week} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: status === "rebound" ? "#dbeafe" : status === "ok" ? "#f0fdf4" : status === "absent" ? "#fef2f2" : "#fffbeb" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>Week {g.week}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                        {!g.answered ? (
                          <span style={{ color: RED, fontStyle: "italic" }}>Absent</span>
                        ) : (
                          <span style={{ color: TEXT_SECONDARY }}>{g.correctCount}/{g.totalQs} correct</span>
                        )}
                        {g.applied !== null ? (
                          <span style={{ fontWeight: 700 }}>
                            <span style={{ color: TEXT_MUTED, textDecoration: "line-through", fontWeight: 500, marginRight: 6 }}>{g.original}</span>
                            <span style={{ color: "#1e40af" }}>{g.applied}/100</span>
                            <span style={{ fontSize: 11, color: TEXT_SECONDARY, marginLeft: 6, fontWeight: 500 }}>({g.rebound.type === "absence_override" ? "Override" : "Rebound"})</span>
                          </span>
                        ) : (
                          <span style={{ fontWeight: 700, color: status === "ok" ? "#166534" : status === "absent" ? TEXT_MUTED : "#92400e" }}>{g.original}/100</span>
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
              <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic" }}>None yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {totWeeks.map(t => (
                  <div key={t.week} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: !t.answered ? "#fef2f2" : t.score >= 16 ? "#f0fdf4" : "#fffbeb" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>Week {t.week}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: !t.answered ? RED : t.score >= 16 ? "#166534" : "#92400e" }}>
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
              <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic" }}>None yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {fbWeeks.map(f => (
                  <div key={f.week} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: 8, background: f.score === 0 ? "#f4f4f5" : f.score >= 16 ? "#f0fdf4" : "#fffbeb" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>Week {f.week}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: f.score === 0 ? TEXT_MUTED : f.score >= 16 ? "#166534" : "#92400e" }}>{f.score}/{f.max}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Participation (25%) - auto-calculated</div>
          <div style={{ ...crd, padding: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f4f4f5" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>Weekly Game (Grade pts)</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>Recomputed from responses / 10 pts per correct</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#18181b", fontVariantNumeric: "tabular-nums" }}>{p.gameGradeEarned}<span style={{ fontSize: 12, color: TEXT_MUTED }}> / {p.gameGradePossible}</span></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f4f4f5" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>This or That</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>20 pts each</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#18181b", fontVariantNumeric: "tabular-nums" }}>{p.totEarned}<span style={{ fontSize: 12, color: TEXT_MUTED }}> / {p.totPossible}</span></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f4f4f5" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>Fishbowl</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>20 pts each</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#18181b", fontVariantNumeric: "tabular-nums" }}>{p.fbEarned}<span style={{ fontSize: 12, color: TEXT_MUTED }}> / {p.fbPossible}</span></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #f4f4f5" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>PTI / Culture Points</div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED }}>Bonus, not in denominator</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: GREEN, fontVariantNumeric: "tabular-nums" }}>+{p.athEarned}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_SECONDARY }}>Total earned / possible</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#18181b", fontVariantNumeric: "tabular-nums" }}>{p.totalEarned} / {p.totalPossible}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: ACCENT + "10", borderRadius: 8, marginTop: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: ACCENT }}>Participation grade</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: ACCENT, fontVariantNumeric: "tabular-nums" }}>{p.participationGrade} / 25 <span style={{ fontSize: 13, fontWeight: 700 }}>({Math.round(p.participationPct * 1000) / 10}%)</span></div>
              </div>
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
    const sorted = [...data.students].filter(s => s.name !== ADMIN_NAME).sort(lastSortObj);
    const gradeAssignments = assignments.filter(a => a.id !== "participation");

    const META_COLS = [
      { id: "__inclass", label: "In-Class", sublabel: "25%" },
      { id: "__ath", label: "PTI", sublabel: "Bonus" },
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
        <Toast message={msg} />
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ ...sectionLabel }}>Gradebook</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setActivityFilter("all")} style={{ ...pill, background: activityFilter === "all" ? ACCENT : "#f4f4f5", color: activityFilter === "all" ? "#fff" : "#52525b", fontSize: 11, padding: "4px 10px" }}>All</button>
              <button onClick={() => setActivityFilter("game")} style={{ ...pill, background: activityFilter === "game" ? ACCENT : "#f4f4f5", color: activityFilter === "game" ? "#fff" : "#52525b", fontSize: 11, padding: "4px 10px" }}>Game</button>
              <button onClick={() => setActivityFilter("tot")} style={{ ...pill, background: activityFilter === "tot" ? ACCENT : "#f4f4f5", color: activityFilter === "tot" ? "#fff" : "#52525b", fontSize: 11, padding: "4px 10px" }}>ToT</button>
              <button onClick={() => setActivityFilter("fb")} style={{ ...pill, background: activityFilter === "fb" ? ACCENT : "#f4f4f5", color: activityFilter === "fb" ? "#fff" : "#52525b", fontSize: 11, padding: "4px 10px" }}>FB</button>
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
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 8 }}>Use up/down to reorder. Per-week columns are fixed at the right.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {colOrder.map((id, i) => {
                  const c = colLabel(id);
                  if (!c) return null;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#f9fafb", borderRadius: 6 }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#18181b" }}>{c.label} <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400 }}>({c.sublabel})</span></span>
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
                <tr style={{ borderBottom: "2px solid #f4f4f5" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", position: "sticky", left: 0, background: "#fff", zIndex: 2, minWidth: 200 }}>Student</th>
                  {colOrder.map(id => {
                    const c = colLabel(id);
                    if (!c) return null;
                    const short = c.label.split(" ").slice(0, 2).join(" ");
                    return (
                      <th key={id} style={{ textAlign: "center", padding: "10px 8px", color: TEXT_MUTED, fontWeight: 600, fontSize: 10, textTransform: "uppercase", minWidth: 70 }}>
                        <div>{short}</div>
                        <div style={{ fontSize: 9, color: "#d4d4d8", fontWeight: 500 }}>{c.sublabel}</div>
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
                    <th key={"fh-" + w} style={{ textAlign: "center", padding: "10px 6px", color: GREEN, fontWeight: 700, fontSize: 10, textTransform: "uppercase", minWidth: 50, background: "#ecfdf5" }}>
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
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: TEXT_MUTED, flexShrink: 0 }}>{s.name[0]}</div>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#18181b", borderBottom: selStudent === s.id ? "2px solid " + ACCENT : "none", paddingBottom: 1, lineHeight: 1.2 }}>{s.name}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: inAZone ? "#16a34a" : TEXT_MUTED, marginTop: 2 }}>
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
                              <div style={{ fontSize: 10, color: TEXT_MUTED }}>({Math.round(pCalc.participationPct * 1000) / 10}%)</div>
                            </td>
                          );
                        }
                        if (id === "__ath") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: ath > 0 ? GREEN : "#d4d4d8", fontVariantNumeric: "tabular-nums" }}>{ath > 0 ? "+" + ath : "0"}</span>
                            </td>
                          );
                        }
                        if (id === "__absences") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#18181b", fontVariantNumeric: "tabular-nums" }}>
                                <span style={{ color: "#10b981" }}>{counters.planned}P</span>
                                <span style={{ color: TEXT_MUTED, margin: "0 3px" }}>/</span>
                                <span style={{ color: RED }}>{counters.unannounced}U</span>
                              </span>
                            </td>
                          );
                        }
                        if (id === "__rebounds") {
                          return (
                            <td key={id} style={{ textAlign: "center", padding: "4px 6px" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: counters.rebounds > 0 ? "#1e40af" : "#d4d4d8", fontVariantNumeric: "tabular-nums" }}>{counters.rebounds}</span>
                            </td>
                          );
                        }
                        const cellKey = s.id + "-" + id;
                        const g = grades[cellKey] || {};
                        const isEditing = editingCell === cellKey;
                        const score = g.score;
                        const outOf = g.outOf || 100;
                        const hasRegrade = !!regradeRequests[cellKey];
                        const isHighlighted = (highlight === "zero" && zeroCells.has(cellKey))
                          || (highlight === "missing" && missingCells.has(cellKey))
                          || (highlight === "regrade" && regradeCells.has(cellKey))
                          || (highlight === "late" && lateCells.has(cellKey));
                        const isDimmed = highlight && !isHighlighted;
                        const sub = submissions[cellKey];
                        const hasSubmission = !!sub;
                        const hasGrade = score !== undefined && score !== "";
                        const cellBg = isHighlighted
                          ? (highlight === "zero" ? "#fecaca" : highlight === "missing" ? "#ddd6de" : highlight === "regrade" ? "#fde68a" : "#fde68a")
                          : zeroCells.has(cellKey) ? "#fef2f2"
                          : missingCells.has(cellKey) ? "#f5f3ff"
                          : "transparent";
                        return (
                          <td key={id} style={{ textAlign: "center", padding: "4px 6px", background: cellBg, opacity: isDimmed ? 0.3 : 1, transition: "opacity 0.15s" }}>
                            {isEditing ? (
                              <input autoFocus type="number" value={score ?? ""} onChange={e => updateGrade(s.id, id, "score", e.target.value)} onBlur={() => setEditingCell(null)} onKeyDown={e => e.key === "Enter" && setEditingCell(null)} style={{ ...inp, width: 48, padding: "4px 4px", fontSize: 12, textAlign: "center" }} />
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setEditingCell(cellKey); }} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 13, fontWeight: 700, padding: "4px 8px", borderRadius: 6, color: hasGrade ? (parseFloat(score) === 0 ? RED : "#18181b") : "#d4d4d8", minWidth: 40, position: "relative" }}>
                                {hasGrade ? score + "/" + outOf : missingCells.has(cellKey) ? "miss" : hasSubmission ? "\uD83D\uDCC4" : "-"}
                                {hasRegrade && <sup style={{ fontSize: 9, marginLeft: 2, color: AMBER }}>RG</sup>}
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
                <div style={{ fontSize: 16, fontWeight: 800, color: "#18181b" }}>{data.students.find(s => s.id === selStudent)?.name}</div>
                <button onClick={() => setSelStudent(null)} style={pillInactive}>Close</button>
              </div>
              {renderStudentGrades(selStudent)}
            </div>
          )}

          {reboundModal && (
            <div onClick={() => setReboundModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", overflowY: "auto" }}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 700, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#18181b" }}>
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
