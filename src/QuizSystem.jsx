import React, { useState } from "react";

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const ACCENT = "#9f1239";

const crd = { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" };
const pill = { padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillActive = { ...pill, background: "#111827", color: "#fff" };
const pillInactive = { ...pill, background: "#f3f4f6", color: "#4b5563" };
const sectionLabel = { fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F };
const inp = { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", color: "#111827", fontFamily: F, fontSize: 14, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

const QUIZ_CATS = [
  { id: "on_topic", label: "On Topic" },
  { id: "reading", label: "From Reading" },
  { id: "sports_world", label: "Sports World" },
];

const QUIZ_GRADE_PTS = { on_topic: 13, reading: 17, sports_world: 2.5 };
const QUIZ_GAME_PTS = 10;

const OPT_COLORS = [
  { bg: "#dc2626", light: "#fef2f2" },
  { bg: "#2563eb", light: "#eff6ff" },
  { bg: "#d97706", light: "#fffbeb" },
  { bg: "#059669", light: "#ecfdf5" },
];

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }

function lastName(name) { if (name === "Alexander Watanabe Eriksson") return "Watanabe Eriksson"; return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }

async function saveData(data) { try { const STORAGE_KEY = "comm118-game-v14"; await window.storage.set(STORAGE_KEY, JSON.stringify(data), true); return true; } catch { return false; } }

function emptyQuiz() {
  return Array.from({ length: 10 }).map((_, i) => ({
    text: "",
    options: ["", "", "", ""],
    correct: 0,
    category: i < 3 ? "on_topic" : i < 6 ? "reading" : "sports_world",
  }));
}

function emptyToT() {
  return [{ prompt: "", options: ["", ""], correct: 0 }];
}

/* ─── ADMIN: QUIZ SETUP ─── */
export function QuizAdmin({ data, setData }) {
  const [week, setWeek] = useState(null);
  const [mode, setMode] = useState("quiz");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const quizzes = data.weeklyQuizzes || {};
  const tots = data.weeklyToT || {};

  const saveQuiz = async (w, questions) => {
    const updated = { ...data, weeklyQuizzes: { ...quizzes, [w]: { questions, active: true, scored: false } } };
    await saveData(updated); setData(updated); showMsg("Quiz " + w + " saved");
  };

  const saveToT = async (w, questions) => {
    const updated = { ...data, weeklyToT: { ...tots, [w]: { questions, active: true, scored: false } } };
    await saveData(updated); setData(updated); showMsg("This or That " + w + " saved");
  };

  const scoreQuiz = async (w) => {
    const quiz = quizzes[w];
    if (!quiz) return;
    const updated = { ...data, weeklyQuizzes: { ...quizzes, [w]: { ...quiz, scored: true, active: false } } };
    await saveData(updated); setData(updated); showMsg("Week " + w + " scored");
  };

  const scoreToT = async (w) => {
    const tot = tots[w];
    if (!tot) return;
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...tot, scored: true, active: false } } };
    await saveData(updated); setData(updated); showMsg("This or That " + w + " scored");
  };

  const deleteQuiz = async (w) => {
    const { [w]: _, ...rest } = quizzes;
    const updated = { ...data, weeklyQuizzes: rest };
    await saveData(updated); setData(updated); setWeek(null); showMsg("Deleted");
  };

  const deleteToT = async (w) => {
    const { [w]: _, ...rest } = tots;
    const updated = { ...data, weeklyToT: rest };
    await saveData(updated); setData(updated); setWeek(null); showMsg("Deleted");
  };

  if (week !== null && mode === "quiz") {
    const existing = quizzes[week];
    return <QuizEditor week={week} initial={existing?.questions || emptyQuiz()} scored={existing?.scored} responses={existing?.responses || {}} students={data.students} onSave={qs => saveQuiz(week, qs)} onScore={() => scoreQuiz(week)} onDelete={() => { if (window.confirm("Delete quiz week " + week + "?")) deleteQuiz(week); }} onBack={() => setWeek(null)} msg={msg} />;
  }

  if (week !== null && mode === "tot") {
    const existing = tots[week];
    return <ToTEditor week={week} initial={existing?.questions || emptyToT()} scored={existing?.scored} responses={existing?.responses || {}} students={data.students} onSave={qs => saveToT(week, qs)} onScore={() => scoreToT(week)} onDelete={() => { if (window.confirm("Delete This or That week " + week + "?")) deleteToT(week); }} onBack={() => setWeek(null)} msg={msg} />;
  }

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Quiz Manager</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button onClick={() => setMode("quiz")} style={mode === "quiz" ? pillActive : pillInactive}>Weekly Quiz</button>
          <button onClick={() => setMode("tot")} style={mode === "tot" ? pillActive : pillInactive}>This or That</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const w = i + 1;
            const item = mode === "quiz" ? quizzes[w] : tots[w];
            const exists = !!item;
            const scored = item?.scored;
            const responses = item?.responses ? Object.keys(item.responses).length : 0;
            return (
              <button key={w} onClick={() => setWeek(w)} style={{
                ...crd, padding: "14px 8px", cursor: "pointer", textAlign: "center", border: exists ? scored ? "2px solid #10b981" : "2px solid " + ACCENT : "1px solid #f3f4f6",
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: scored ? "#10b981" : exists ? ACCENT : "#d1d5db" }}>{w}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{scored ? "Scored" : exists ? responses + " resp" : "Empty"}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuizEditor({ week, initial, scored, responses, students, onSave, onScore, onDelete, onBack, msg }) {
  const [questions, setQuestions] = useState(JSON.parse(JSON.stringify(initial)));

  const updateQ = (i, field, value) => {
    const updated = [...questions];
    if (field === "option") {
      updated[i] = { ...updated[i], options: updated[i].options.map((o, oi) => oi === value.idx ? value.text : o) };
    } else {
      updated[i] = { ...updated[i], [field]: value };
    }
    setQuestions(updated);
  };

  const uniqueStudents = new Set(Object.keys(responses).map(k => k.split("-")[0])).size;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} Quiz</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{uniqueStudents} responses</div>
        </div>
        {scored && <div style={{ textAlign: "center", fontSize: 13, color: "#10b981", fontWeight: 700, marginBottom: 12, padding: "8px", background: "#ecfdf5", borderRadius: 8 }}>Already scored</div>}

        {questions.map((q, i) => (
          <div key={i} style={{ ...crd, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
              <select value={q.category} onChange={e => updateQ(i, "category", e.target.value)} style={{ ...sel, fontSize: 12, padding: "4px 8px", flex: 0 }}>
                {QUIZ_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Game: {QUIZ_GAME_PTS}pts / Grade: {QUIZ_GRADE_PTS[q.category]}pts</div>
            </div>
            <input value={q.text} onChange={e => updateQ(i, "text", e.target.value)} placeholder="Question text (your reference only)" style={{ ...inp, fontSize: 12, padding: "6px 10px", marginBottom: 6 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => updateQ(i, "correct", oi)} style={{
                    width: 24, height: 24, borderRadius: 6, border: "2px solid " + (q.correct === oi ? "#10b981" : "#e5e7eb"),
                    background: q.correct === oi ? "#ecfdf5" : "#fff", cursor: "pointer", fontSize: 10, fontWeight: 900,
                    color: q.correct === oi ? "#10b981" : "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{String.fromCharCode(65 + oi)}</button>
                  <input value={opt} onChange={e => updateQ(i, "option", { idx: oi, text: e.target.value })} placeholder={"Option " + String.fromCharCode(65 + oi)} style={{ ...inp, fontSize: 12, padding: "5px 8px" }} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => onSave(questions)} style={{ ...pill, background: "#111827", color: "#fff", flex: 1, padding: "12px 0" }}>Save</button>
          {!scored && <button onClick={onScore} style={{ ...pill, background: "#10b981", color: "#fff", flex: 1, padding: "12px 0" }}>Score</button>}
          <button onClick={onDelete} style={{ ...pill, background: "#fef2f2", color: "#ef4444", padding: "12px 16px" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ToTEditor({ week, initial, scored, responses, students, onSave, onScore, onDelete, onBack, msg }) {
  const [questions, setQuestions] = useState(JSON.parse(JSON.stringify(initial)));

  const updateQ = (i, field, value) => {
    const updated = [...questions];
    if (field === "optionText") {
      updated[i] = { ...updated[i], options: updated[i].options.map((o, oi) => oi === value.idx ? value.text : o) };
    } else {
      updated[i] = { ...updated[i], [field]: value };
    }
    setQuestions(updated);
  };

  const addQ = () => { if (questions.length < 4) setQuestions([...questions, { prompt: "", options: ["", ""], correct: 0 }]); };
  const removeQ = (i) => { if (questions.length > 1) setQuestions(questions.filter((_, qi) => qi !== i)); };

  const ptsEach = questions.length > 0 ? Math.round(20 / questions.length * 10) / 10 : 20;
  const uniqueStudents = new Set(Object.keys(responses).map(k => k.split("-")[0])).size;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} This or That</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{uniqueStudents} responses</div>
        </div>
        {scored && <div style={{ textAlign: "center", fontSize: 13, color: "#10b981", fontWeight: 700, marginBottom: 12, padding: "8px", background: "#ecfdf5", borderRadius: 8 }}>Already scored</div>}
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>{questions.length} question{questions.length !== 1 ? "s" : ""}, {ptsEach} pts each (20 total)</div>

        {questions.map((q, i) => (
          <div key={i} style={{ ...crd, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#111827" }}>#{i + 1}</div>
              {questions.length > 1 && <button onClick={() => removeQ(i)} style={{ ...pill, background: "#fef2f2", color: "#ef4444", fontSize: 11, padding: "3px 8px" }}>Remove</button>}
            </div>
            <input value={q.prompt} onChange={e => updateQ(i, "prompt", e.target.value)} placeholder="Statement or prompt" style={{ ...inp, fontSize: 13, padding: "8px 10px", marginBottom: 6 }} />
            <div style={{ display: "flex", gap: 6 }}>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => updateQ(i, "correct", oi)} style={{
                    width: 24, height: 24, borderRadius: 6, border: "2px solid " + (q.correct === oi ? "#10b981" : "#e5e7eb"),
                    background: q.correct === oi ? "#ecfdf5" : "#fff", cursor: "pointer", fontSize: 11, fontWeight: 900,
                    color: q.correct === oi ? "#10b981" : "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{oi === 0 ? "A" : "B"}</button>
                  <input value={opt} onChange={e => updateQ(i, "optionText", { idx: oi, text: e.target.value })} placeholder={oi === 0 ? "This" : "That"} style={{ ...inp, fontSize: 12, padding: "5px 8px" }} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {questions.length < 4 && <button onClick={addQ} style={{ ...pillInactive, width: "100%", marginBottom: 12 }}>+ Add Question</button>}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={() => onSave(questions)} style={{ ...pill, background: "#111827", color: "#fff", flex: 1, padding: "12px 0" }}>Save</button>
          {!scored && <button onClick={onScore} style={{ ...pill, background: "#10b981", color: "#fff", flex: 1, padding: "12px 0" }}>Score</button>}
          <button onClick={onDelete} style={{ ...pill, background: "#fef2f2", color: "#ef4444", padding: "12px 16px" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── STUDENT: QUIZ ANSWER VIEW ─── */
export function StudentQuizView({ data, setData, userName }) {
  const [week, setWeek] = useState(null);
  const [mode, setMode] = useState("quiz");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;
  const quizzes = data.weeklyQuizzes || {};
  const tots = data.weeklyToT || {};

  const submitQuizAnswer = async (w, qIdx, answerIdx) => {
    const quiz = quizzes[w];
    if (!quiz || !sid) return;
    const key = sid + "-" + qIdx;
    const responses = { ...(quiz.responses || {}), [key]: answerIdx };
    const updated = { ...data, weeklyQuizzes: { ...quizzes, [w]: { ...quiz, responses } } };
    await saveData(updated); setData(updated);
    showMsg("Locked in");
    setSelected(null);
    if (qIdx < 9) {
      setCurrentQ(qIdx + 1);
    }
  };

  const submitToTAnswer = async (w, qIdx, answerIdx) => {
    const tot = tots[w];
    if (!tot || !sid) return;
    const key = sid + "-" + qIdx;
    const responses = { ...(tot.responses || {}), [key]: answerIdx };
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...tot, responses } } };
    await saveData(updated); setData(updated);
    showMsg("Locked in");
    setSelected(null);
    if (qIdx < (tot.questions.length - 1)) {
      setCurrentQ(qIdx + 1);
    }
  };

  // Week selection
  if (week === null) {
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Answer</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <button onClick={() => setMode("quiz")} style={mode === "quiz" ? pillActive : pillInactive}>Weekly Quiz</button>
            <button onClick={() => setMode("tot")} style={mode === "tot" ? pillActive : pillInactive}>This or That</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const w = i + 1;
              const item = mode === "quiz" ? quizzes[w] : tots[w];
              const isActive = item?.active;
              const isScored = item?.scored;
              const hasResponded = sid && item?.responses && Object.keys(item.responses).some(k => k.startsWith(sid));
              return (
                <button key={w} onClick={() => { if (isActive || isScored) { setWeek(w); setCurrentQ(0); setSelected(null); } }} style={{
                  ...crd, padding: "14px 8px", cursor: isActive || isScored ? "pointer" : "default", textAlign: "center",
                  opacity: isActive || isScored ? 1 : 0.4,
                  border: hasResponded ? "2px solid #10b981" : "1px solid #f3f4f6",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: hasResponded ? "#10b981" : isActive ? "#111827" : "#d1d5db" }}>{w}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{isScored ? "View results" : hasResponded ? "Done" : isActive ? "Open" : ""}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Results view (after scoring)
  if (mode === "quiz" && quizzes[week]?.scored) {
    const quiz = quizzes[week];
    const qs = quiz.questions;
    let gameTotal = 0, gradeTotal = 0;
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <button onClick={() => setWeek(null)} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Week {week} Quiz Results</div>
          {qs.map((q, i) => {
            const myAnswer = sid ? quiz.responses?.[sid + "-" + i] : undefined;
            const correct = myAnswer === q.correct;
            if (correct) {
              gameTotal += QUIZ_GAME_PTS;
              gradeTotal += QUIZ_GRADE_PTS[q.category];
            }
            return (
              <div key={i} style={{ ...crd, padding: 12, marginBottom: 6, borderColor: correct ? "#bbf7d0" : "#fecaca" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: correct ? "#10b981" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{QUIZ_CATS.find(c => c.id === q.category)?.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: correct ? "#10b981" : "#ef4444", marginLeft: "auto" }}>{correct ? "Correct" : "Incorrect"}</div>
                </div>
                {!correct && myAnswer !== undefined && (
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4, marginTop: 4 }}>
                    You picked <strong style={{ color: "#ef4444" }}>{q.options[myAnswer]}</strong>, but the answer was <strong style={{ color: "#10b981" }}>{q.options[q.correct]}</strong>.
                  </div>
                )}
                {!correct && myAnswer === undefined && (
                  <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic", marginTop: 4 }}>No answer submitted. Correct answer: <strong>{q.options[q.correct]}</strong></div>
                )}
              </div>
            );
          })}
          <div style={{ ...crd, padding: 14, marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "center" }}>
              <div>
                <div style={{ ...sectionLabel, marginBottom: 2 }}>Game Points</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{gameTotal}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 100</span></div>
              </div>
              <div>
                <div style={{ ...sectionLabel, marginBottom: 2 }}>Grade Points</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{Math.round(gradeTotal * 10) / 10}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 100</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "tot" && tots[week]?.scored) {
    const tot = tots[week];
    const qs = tot.questions;
    const ptsEach = qs.length > 0 ? 20 / qs.length : 20;
    let total = 0;
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <button onClick={() => setWeek(null)} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Week {week} This or That Results</div>
          {qs.map((q, i) => {
            const myAnswer = sid ? tot.responses?.[sid + "-" + i] : undefined;
            const correct = myAnswer === q.correct;
            if (correct) total += ptsEach;
            return (
              <div key={i} style={{ ...crd, padding: 12, marginBottom: 6, borderColor: correct ? "#bbf7d0" : "#fecaca" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{q.prompt || "Question " + (i + 1)}</div>
                {!correct && myAnswer !== undefined && (
                  <div style={{ fontSize: 13, color: "#6b7280" }}>You picked <strong style={{ color: "#ef4444" }}>{q.options[myAnswer]}</strong>, but the answer was <strong style={{ color: "#10b981" }}>{q.options[q.correct]}</strong>.</div>
                )}
                {correct && <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700 }}>Correct: {q.options[q.correct]}</div>}
                {myAnswer === undefined && <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No answer. Correct: <strong>{q.options[q.correct]}</strong></div>}
              </div>
            );
          })}
          <div style={{ ...crd, padding: 14, marginTop: 12, textAlign: "center" }}>
            <div style={{ ...sectionLabel, marginBottom: 2 }}>Game Points</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{Math.round(total * 10) / 10}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 20</span></div>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz answering
  if (mode === "quiz") {
    const quiz = quizzes[week];
    if (!quiz?.active) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: "#9ca3af" }}>This quiz is not open yet.<br /><button onClick={() => setWeek(null)} style={{ ...pillInactive, marginTop: 12 }}>Back</button></div>;
    const q = quiz.questions[currentQ];
    const myAnswer = sid ? quiz.responses?.[sid + "-" + currentQ] : undefined;
    const allDone = sid && Array.from({ length: 10 }).every((_, i) => quiz.responses?.[sid + "-" + i] !== undefined);

    if (allDone) {
      return (
        <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: F }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>All done</div>
          <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16 }}>You'll see your results after scoring.</div>
          <button onClick={() => setWeek(null)} style={pillInactive}>Back</button>
        </div>
      );
    }

    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => setWeek(null)} style={pillInactive}>Back</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>Wk {week}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{currentQ + 1}/10</span>
          </div>

          <div style={{ fontSize: 48, fontWeight: 900, color: "#111827", marginBottom: 24 }}>Q{currentQ + 1}</div>

          {myAnswer !== undefined ? (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>Locked in: {q.options[myAnswer]}</div>
              {currentQ < 9 && <button onClick={() => { setCurrentQ(currentQ + 1); setSelected(null); }} style={{ ...pillInactive, marginTop: 12 }}>Next</button>}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 340, margin: "0 auto", marginBottom: 20 }}>
                {q.options.map((opt, oi) => {
                  if (!opt) return null;
                  const c = OPT_COLORS[oi];
                  const isSel = selected === oi;
                  return (
                    <button key={oi} onClick={() => setSelected(oi)} style={{
                      padding: "16px 20px", borderRadius: 12, width: "100%", textAlign: "left",
                      fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "all 0.15s",
                      background: isSel ? c.bg : c.light,
                      color: isSel ? "#fff" : c.bg,
                      border: "2px solid " + c.bg,
                      transform: isSel ? "scale(1.02)" : "scale(1)",
                    }}>
                      <span style={{ fontWeight: 900, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {selected !== null && (
                <button onClick={() => submitQuizAnswer(week, currentQ, selected)} style={{
                  ...pill, fontSize: 14, padding: "12px 40px", background: "#111827", color: "#fff", border: "1px solid #111827", fontWeight: 700,
                }}>Lock in answer</button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Active This or That answering
  if (mode === "tot") {
    const tot = tots[week];
    if (!tot?.active) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: "#9ca3af" }}>This or That is not open yet.<br /><button onClick={() => setWeek(null)} style={{ ...pillInactive, marginTop: 12 }}>Back</button></div>;
    const q = tot.questions[currentQ];
    const myAnswer = sid ? tot.responses?.[sid + "-" + currentQ] : undefined;
    const allDone = sid && tot.questions.every((_, i) => tot.responses?.[sid + "-" + i] !== undefined);

    if (allDone) {
      return (
        <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: F }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>All done</div>
          <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16 }}>You'll see your results after scoring.</div>
          <button onClick={() => setWeek(null)} style={pillInactive}>Back</button>
        </div>
      );
    }

    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => setWeek(null)} style={pillInactive}>Back</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>Wk {week}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{currentQ + 1}/{tot.questions.length}</span>
          </div>

          {q.prompt && <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20, lineHeight: 1.4 }}>{q.prompt}</div>}

          {myAnswer !== undefined ? (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>Locked in: {q.options[myAnswer]}</div>
              {currentQ < tot.questions.length - 1 && <button onClick={() => { setCurrentQ(currentQ + 1); setSelected(null); }} style={{ ...pillInactive, marginTop: 12 }}>Next</button>}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 340, margin: "0 auto", marginBottom: 20 }}>
                {q.options.map((opt, oi) => {
                  const isSel = selected === oi;
                  return (
                    <button key={oi} onClick={() => setSelected(oi)} style={{
                      padding: "24px 16px", borderRadius: 12, width: "100%",
                      fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: F, transition: "all 0.15s",
                      background: isSel ? "#111827" : "#f3f4f6",
                      color: isSel ? "#fff" : "#111827",
                      border: isSel ? "2px solid #111827" : "2px solid #e5e7eb",
                      transform: isSel ? "scale(1.02)" : "scale(1)",
                    }}>{opt}</button>
                  );
                })}
              </div>
              {selected !== null && (
                <button onClick={() => submitToTAnswer(week, currentQ, selected)} style={{
                  ...pill, fontSize: 14, padding: "12px 40px", background: "#111827", color: "#fff", border: "1px solid #111827", fontWeight: 700,
                }}>Lock in answer</button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
