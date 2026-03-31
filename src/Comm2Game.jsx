import React, { useState } from "react";

const F = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const ACCENT = "#2563eb";
const GREEN = "#059669";
const RED = "#dc2626";
const BORDER = "#e8e8ec";
const TEXT_MUTED = "#a1a1aa";
const TEXT_PRIMARY = "#18181b";
const TEXT_SECONDARY = "#52525b";
const AMBER = "#d97706";

const crd = { background: "#fff", borderRadius: 14, border: "1px solid " + BORDER, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
const pill = { padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillActive = { ...pill, background: "#18181b", color: "#fff" };
const pillInactive = { ...pill, background: "#f4f4f5", color: "#52525b" };
const sectionLabel = { fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F };
const inp = { background: "#fff", border: "1.5px solid " + BORDER, borderRadius: 10, padding: "10px 14px", color: "#18181b", fontFamily: F, fontSize: 15, fontWeight: 400, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

const GAME_CATS = [
  { id: "on_topic", label: "On Topic" },
  { id: "general", label: "General" },
];
const GAME_PTS = 10;
const OPT_COLORS = [
  { bg: "#dc2626", light: "#fef2f2" },
  { bg: "#2563eb", light: "#eff6ff" },
  { bg: "#d97706", light: "#fffbeb" },
  { bg: "#059669", light: "#ecfdf5" },
];

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#18181b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function lastName(name) { return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }
async function saveData(data) { try { await window.storage.set("comm2-v1", JSON.stringify(data), true); return true; } catch { return false; } }

function emptyGame() {
  return Array.from({ length: 10 }).map((_, i) => ({
    text: "", options: ["", "", "", ""], correct: 0,
    category: i < 6 ? "on_topic" : "general",
  }));
}

function gp(log, sid) { return log.filter(e => e.studentId === sid).reduce((s, e) => s + e.amount, 0); }
function rs(students, log) { return students.map(s => ({ ...s, points: gp(log, s.id) })).sort((a, b) => b.points - a.points); }


/* ─── ADMIN: GAME + TOT + FISHBOWL SETUP ─── */
export function GameAdmin({ data, setData }) {
  const [week, setWeek] = useState(null);
  const [mode, setMode] = useState("game");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const games = data.weeklyGames || {};
  const tots = data.weeklyToT || {};
  const fishbowls = data.weeklyFishbowl || {};

  const saveGame = async (w, questions) => {
    const existing = games[w] || {};
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...existing, questions, scored: false } } };
    await saveData(updated); setData(updated); showMsg("Week " + w + " saved");
  };

  const goLiveGame = async (w) => {
    const game = games[w]; if (!game) return;
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...game, phase: "live", currentQ: 0, lockedQs: [], countdown: null, active: true } } };
    await saveData(updated); setData(updated); showMsg("Game is LIVE");
  };

  const scoreGame = async (w) => {
    const game = games[w]; if (!game) return;
    const entries = [];
    const playerScores = {};
    data.students.forEach(s => {
      let pts = 0;
      for (let q = 0; q < (game.questions || []).length; q++) {
        const ans = game.responses?.[s.id + "-" + q];
        if (ans === game.questions[q].correct) pts += GAME_PTS;
      }
      playerScores[s.id] = pts;
      if (pts > 0) entries.push({ id: genId(), studentId: s.id, amount: pts, source: "Game Wk" + w, ts: Date.now() });
    });
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...game, scored: true, active: false, phase: "done" } }, log: [...data.log, ...entries] };
    await saveData(updated); setData(updated); showMsg("Scored!");
  };


  const deleteGame = async (w) => {
    const { [w]: _, ...rest } = games;
    const updated = { ...data, weeklyGames: rest };
    await saveData(updated); setData(updated); setWeek(null); showMsg("Deleted");
  };

  const saveToT = async (w, questions) => {
    const existing = tots[w] || {};
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...existing, questions, scored: false } } };
    await saveData(updated); setData(updated); showMsg("Week " + w + " saved");
  };

  const goLiveToT = async (w) => {
    const tot = tots[w]; if (!tot) return;
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...tot, phase: "live", currentQ: 0, lockedQs: [], countdown: null, active: true } } };
    await saveData(updated); setData(updated); showMsg("This or That is LIVE");
  };

  const scoreToT = async (w) => {
    const tot = tots[w]; if (!tot) return;
    const ptsEach = tot.questions.length > 0 ? 20 / tot.questions.length : 20;
    const entries = [];
    data.students.forEach(s => {
      let pts = 0;
      tot.questions.forEach((q, qi) => {
        if (tot.responses?.[s.id + "-" + qi] === q.correct) pts += ptsEach;
      });
      if (pts > 0) entries.push({ id: genId(), studentId: s.id, amount: Math.round(pts * 10) / 10, source: "ToT Wk" + w, ts: Date.now() });
    });
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...tot, scored: true, active: false, phase: "done" } }, log: [...data.log, ...entries] };
    await saveData(updated); setData(updated); showMsg("Scored!");
  };

  const deleteToT = async (w) => {
    const { [w]: _, ...rest } = tots;
    const updated = { ...data, weeklyToT: rest };
    await saveData(updated); setData(updated); setWeek(null); showMsg("Deleted");
  };

  // Fishbowl
  if (week !== null && mode === "fishbowl") {
    return <FishbowlAdmin week={week} data={data} setData={setData} onBack={() => setWeek(null)} />;
  }

  if (week !== null && mode === "game") {
    const existing = games[week];
    const isLive = existing?.phase === "live";
    const isDone = existing?.scored;
    if (isLive) {
    }
    return (
      <div>
        <GameEditor week={week} initial={existing?.questions || emptyGame()} scored={isDone} onSave={qs => saveGame(week, qs)} onGoLive={() => goLiveGame(week)} onDelete={() => { if (window.confirm("Delete game week " + week + "?")) deleteGame(week); }} onBack={() => setWeek(null)} msg={msg} />
        {isDone && <div style={{ padding: "0 20px 40px" }}><div style={{ maxWidth: 600, margin: "0 auto" }}><ReboundPanel data={data} setData={setData} activityType="game" week={week} isAdmin={true} userName="Andrew Ishak" /></div></div>}
      </div>
    );
  }

  if (week !== null && mode === "tot") {
    const existing = tots[week];
    const isLive = existing?.phase === "live";
    const isDone = existing?.scored;
    if (isLive) {
      return <LiveActivityAdmin type="tot" week={week} data={data} setData={setData} onBack={() => setWeek(null)} onScore={() => scoreToT(week)} msg={msg} showMsg={showMsg} />;
    }
    return (
      <div>
        <ToTEditor week={week} initial={existing?.questions || [{ prompt: "", options: ["", ""], correct: 0 }]} scored={isDone} onSave={qs => saveToT(week, qs)} onGoLive={() => goLiveToT(week)} onDelete={() => { if (window.confirm("Delete This or That week " + week + "?")) deleteToT(week); }} onBack={() => setWeek(null)} msg={msg} />
        {isDone && <div style={{ padding: "0 20px 40px" }}><div style={{ maxWidth: 600, margin: "0 auto" }}><ReboundPanel data={data} setData={setData} activityType="tot" week={week} isAdmin={true} userName="Andrew Ishak" /></div></div>}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Game Manager</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button onClick={() => setMode("game")} style={mode === "game" ? pillActive : pillInactive}>Weekly Game</button>
          <button onClick={() => setMode("tot")} style={mode === "tot" ? pillActive : pillInactive}>This or That</button>
          <button onClick={() => setMode("fishbowl")} style={mode === "fishbowl" ? pillActive : pillInactive}>Fishbowl</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const w = i + 1;
            const item = mode === "game" ? games[w] : mode === "tot" ? tots[w] : fishbowls[w];
            const exists = !!item;
            const scored = item?.scored || item?.confirmed;
            const isLive = item?.phase === "live";
            return (
              <button key={w} onClick={() => setWeek(w)} style={{
                ...crd, padding: "14px 8px", cursor: "pointer", textAlign: "center",
                border: exists ? scored ? "2px solid " + GREEN : isLive ? "2px solid #d97706" : "2px solid " + ACCENT : "1px solid #f3f4f6",
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: scored ? GREEN : isLive ? "#d97706" : exists ? ACCENT : "#d1d5db" }}>{w}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{scored ? "Done" : isLive ? "LIVE" : exists ? "Ready" : "Empty"}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── GAME EDITOR (setup phase, with drag reorder) ─── */
function GameEditor({ week, initial, scored, onSave, onGoLive, onDelete, onBack, msg }) {
  const [questions, setQuestions] = useState(JSON.parse(JSON.stringify(initial)));
  const [dragIdx, setDragIdx] = useState(null);

  const updateQ = (i, field, value) => {
    const u = [...questions];
    if (field === "option") { u[i] = { ...u[i], options: u[i].options.map((o, oi) => oi === value.idx ? value.text : o) }; }
    else { u[i] = { ...u[i], [field]: value }; }
    setQuestions(u);
  };

  const moveQ = (from, to) => {
    if (to < 0 || to >= questions.length) return;
    const u = [...questions];
    const [item] = u.splice(from, 1);
    u.splice(to, 0, item);
    setQuestions(u);
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} Game</div>
          <div style={{ width: 60 }} />
        </div>
        {scored && <div style={{ textAlign: "center", fontSize: 13, color: GREEN, fontWeight: 700, marginBottom: 12, padding: 8, background: "#ecfdf5", borderRadius: 8 }}>Scored</div>}
        {questions.map((q, i) => (
          <div key={i} style={{ ...crd, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => moveQ(i, i - 1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#e5e7eb" : "#9ca3af", fontSize: 12, padding: 0, lineHeight: 1 }}>&#9650;</button>
                <button onClick={() => moveQ(i, i + 1)} disabled={i === questions.length - 1} style={{ background: "none", border: "none", cursor: i === questions.length - 1 ? "default" : "pointer", color: i === questions.length - 1 ? "#e5e7eb" : "#9ca3af", fontSize: 12, padding: 0, lineHeight: 1 }}>&#9660;</button>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
              <select value={q.category} onChange={e => updateQ(i, "category", e.target.value)} style={{ ...sel, fontSize: 12, padding: "4px 8px" }}>
                {GAME_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>Game: {GAME_PTS}pts / Grade: {GAME_GRADE_PTS[q.category]}pts</div>
            </div>
            <input value={q.text} onChange={e => updateQ(i, "text", e.target.value)} placeholder="Question text (your reference only)" style={{ ...inp, fontSize: 12, padding: "6px 10px", marginBottom: 6 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => updateQ(i, "correct", oi)} style={{
                    width: 24, height: 24, borderRadius: 6, border: "2px solid " + (q.correct === oi ? GREEN : "#e5e7eb"),
                    background: q.correct === oi ? "#ecfdf5" : "#fff", cursor: "pointer", fontSize: 10, fontWeight: 900,
                    color: q.correct === oi ? GREEN : "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{String.fromCharCode(65 + oi)}</button>
                  <input value={opt} onChange={e => updateQ(i, "option", { idx: oi, text: e.target.value })} placeholder={"Option " + String.fromCharCode(65 + oi)} style={{ ...inp, fontSize: 12, padding: "5px 8px" }} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => onSave(questions)} style={{ ...pill, background: "#111827", color: "#fff", flex: 1, padding: "12px 0" }}>Save</button>
          {!scored && <button onClick={() => { onSave(questions); setTimeout(onGoLive, 300); }} style={{ ...pill, background: "#d97706", color: "#fff", flex: 1, padding: "12px 0" }}>Go Live</button>}
          <button onClick={onDelete} style={{ ...pill, background: "#fef2f2", color: RED, padding: "12px 16px" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── TOT EDITOR (setup phase, with drag reorder) ─── */
function ToTEditor({ week, initial, scored, onSave, onGoLive, onDelete, onBack, msg }) {
  const [questions, setQuestions] = useState(JSON.parse(JSON.stringify(initial)));
  const updateQ = (i, field, value) => {
    const u = [...questions];
    if (field === "optionText") { u[i] = { ...u[i], options: u[i].options.map((o, oi) => oi === value.idx ? value.text : o) }; }
    else { u[i] = { ...u[i], [field]: value }; }
    setQuestions(u);
  };
  const addQ = () => { if (questions.length < 4) setQuestions([...questions, { prompt: "", options: ["", ""], correct: 0 }]); };
  const removeQ = (i) => { if (questions.length > 1) setQuestions(questions.filter((_, qi) => qi !== i)); };
  const moveQ = (from, to) => {
    if (to < 0 || to >= questions.length) return;
    const u = [...questions]; const [item] = u.splice(from, 1); u.splice(to, 0, item); setQuestions(u);
  };
  const ptsEach = questions.length > 0 ? Math.round(20 / questions.length * 10) / 10 : 20;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} This or That</div>
          <div style={{ width: 60 }} />
        </div>
        {scored && <div style={{ textAlign: "center", fontSize: 13, color: GREEN, fontWeight: 700, marginBottom: 12, padding: 8, background: "#ecfdf5", borderRadius: 8 }}>Scored</div>}
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>{questions.length} question{questions.length !== 1 ? "s" : ""}, {ptsEach} pts each (20 total)</div>
        {questions.map((q, i) => (
          <div key={i} style={{ ...crd, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button onClick={() => moveQ(i, i - 1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#e5e7eb" : "#9ca3af", fontSize: 12, padding: 0, lineHeight: 1 }}>&#9650;</button>
                  <button onClick={() => moveQ(i, i + 1)} disabled={i === questions.length - 1} style={{ background: "none", border: "none", cursor: i === questions.length - 1 ? "default" : "pointer", color: i === questions.length - 1 ? "#e5e7eb" : "#9ca3af", fontSize: 12, padding: 0, lineHeight: 1 }}>&#9660;</button>
                </div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>#{i + 1}</div>
              </div>
              {questions.length > 1 && <button onClick={() => removeQ(i)} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "3px 8px" }}>Remove</button>}
            </div>
            <input value={q.prompt} onChange={e => updateQ(i, "prompt", e.target.value)} placeholder="Statement or prompt" style={{ ...inp, fontSize: 13, padding: "8px 10px", marginBottom: 6 }} />
            <div style={{ display: "flex", gap: 6 }}>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => updateQ(i, "correct", oi)} style={{
                    width: 24, height: 24, borderRadius: 6, border: "2px solid " + (q.correct === oi ? GREEN : "#e5e7eb"),
                    background: q.correct === oi ? "#ecfdf5" : "#fff", cursor: "pointer", fontSize: 11, fontWeight: 900,
                    color: q.correct === oi ? GREEN : "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{oi === 0 ? "A" : "B"}</button>
                  <input value={opt} onChange={e => updateQ(i, "optionText", { idx: oi, text: e.target.value })} placeholder={oi === 0 ? "This" : "That"} style={{ ...inp, fontSize: 12, padding: "5px 8px" }} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {questions.length < 4 && <button onClick={addQ} style={{ ...pillInactive, width: "100%", marginBottom: 12 }}>+ Add Question</button>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onSave(questions)} style={{ ...pill, background: "#111827", color: "#fff", flex: 1, padding: "12px 0" }}>Save</button>
          {!scored && <button onClick={() => { onSave(questions); setTimeout(onGoLive, 300); }} style={{ ...pill, background: "#d97706", color: "#fff", flex: 1, padding: "12px 0" }}>Go Live</button>}
          <button onClick={onDelete} style={{ ...pill, background: "#fef2f2", color: RED, padding: "12px 16px" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── LIVE ACTIVITY ADMIN (question control + live monitor) ─── */
function LiveActivityAdmin({ type, week, data, setData, onBack, onScore, msg, showMsg }) {
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownSecs, setCountdownSecs] = useState(0);
  const activities = type === "game" ? (data.weeklyGames || {}) : (data.weeklyToT || {});
  const activity = activities[week] || activities[String(week)];
  const wKey = activities[week] ? week : String(week);
  if (!activity) return null;

  const qs = activity.questions || [];
  const currentQ = activity.currentQ || 0;
  const lockedQs = activity.lockedQs || [];
  const sorted = [...data.students].filter(s => s.name !== "Andrew Ishak").sort(lastSortObj);
  const isAllLocked = lockedQs.length >= qs.length;
  const maxPts = type === "game" ? 100 : 20;

  // Countdown effect
  React.useEffect(() => {
    if (!activity.countdown) { setCountdownActive(false); setCountdownSecs(0); return; }
    const endTime = activity.countdown + 5000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setCountdownSecs(left);
      if (left <= 0) {
        setCountdownActive(false);
        // Auto-lock the question
        lockQuestion();
      }
    };
    setCountdownActive(true);
    tick();
    const iv = setInterval(tick, 200);
    return () => clearInterval(iv);
  }, [activity.countdown]);

  // Refresh data every 2 seconds for live updates
  React.useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const raw = await window.storage.get("comm2-v1", true);
        if (raw?.value) { const d = JSON.parse(raw.value); setData(d); }
      } catch(e) {}
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const startCountdown = async () => {
    const key = type === "game" ? "weeklyGames" : "weeklyToT";
    const updated = { ...data, [key]: { ...activities, [wKey]: { ...activity, countdown: Date.now() } } };
    await saveData(updated); setData(updated);
  };

  const lockQuestion = async () => {
    const newLocked = [...new Set([...(activity.lockedQs || []), activity.currentQ])];
    const key = type === "game" ? "weeklyGames" : "weeklyToT";
    const updated = { ...data, [key]: { ...activities, [wKey]: { ...activity, lockedQs: newLocked, countdown: null } } };
    await saveData(updated); setData(updated);
  };

  const nextQuestion = async () => {
    if (currentQ >= qs.length - 1) return;
    const key = type === "game" ? "weeklyGames" : "weeklyToT";
    const updated = { ...data, [key]: { ...activities, [wKey]: { ...activity, currentQ: currentQ + 1, countdown: null } } };
    await saveData(updated); setData(updated);
  };

  const endGame = async () => {
    const key = type === "game" ? "weeklyGames" : "weeklyToT";
    const updated = { ...data, [key]: { ...activities, [wKey]: { ...activity, phase: "done", active: false } } };
    await saveData(updated); setData(updated);
  };

  // Calculate scores
  const getScore = (sid) => {
    let pts = 0;
    const ptsEach = type === "game" ? GAME_PTS : (qs.length > 0 ? 20 / qs.length : 20);
    qs.forEach((q, qi) => {
      if (activity.responses?.[sid + "-" + qi] === q.correct) pts += ptsEach;
    });
    return Math.round(pts * 10) / 10;
  };

  const label = type === "game" ? "Weekly Game" : "This or That";
  const isLocked = (qi) => lockedQs.includes(qi);

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} {label} <span style={{ color: "#d97706" }}>LIVE</span></div>
          <div style={{ width: 60 }} />
        </div>

        {/* Question controls */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>Q{currentQ + 1}<span style={{ fontSize: 14, color: "#9ca3af" }}> / {qs.length}</span></div>
            {countdownActive && <div style={{ fontSize: 36, fontWeight: 900, color: RED, fontVariantNumeric: "tabular-nums" }}>{countdownSecs}</div>}
          </div>
          {qs[currentQ] && (
            <div style={{ fontSize: 14, color: TEXT_SECONDARY, marginBottom: 12 }}>
              {qs[currentQ].text || (type === "tot" ? qs[currentQ].prompt : "(no text)")}
              <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {qs[currentQ].options.map((opt, oi) => (
                  <span key={oi} style={{ fontSize: 13, padding: "4px 10px", borderRadius: 8, background: qs[currentQ].correct === oi ? "#ecfdf5" : "#f4f4f5", color: qs[currentQ].correct === oi ? GREEN : TEXT_SECONDARY, fontWeight: qs[currentQ].correct === oi ? 700 : 400, border: "1px solid " + (qs[currentQ].correct === oi ? GREEN + "40" : "#e5e7eb") }}>
                    {String.fromCharCode(65 + oi)}. {opt}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!isLocked(currentQ) && !countdownActive && (
              <button onClick={startCountdown} style={{ ...pill, background: RED, color: "#fff", padding: "10px 20px", fontSize: 14 }}>5 Seconds Left</button>
            )}
            {isLocked(currentQ) && currentQ < qs.length - 1 && (
              <button onClick={nextQuestion} style={{ ...pill, background: "#111827", color: "#fff", padding: "10px 20px", fontSize: 14 }}>Next Question</button>
            )}
            {isAllLocked && !activity.scored && (
              <button onClick={onScore} style={{ ...pill, background: GREEN, color: "#fff", padding: "10px 20px", fontSize: 14 }}>Score and Post Points</button>
            )}
            {isLocked(currentQ) && <span style={{ fontSize: 13, fontWeight: 700, color: GREEN, display: "flex", alignItems: "center" }}>Q{currentQ + 1} Locked</span>}
          </div>
        </div>

        {/* Question dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {qs.map((_, qi) => (
            <div key={qi} style={{
              width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800,
              background: isLocked(qi) ? GREEN + "20" : qi === currentQ ? "#d97706" + "20" : "#f4f4f5",
              color: isLocked(qi) ? GREEN : qi === currentQ ? "#d97706" : "#d1d5db",
              border: qi === currentQ ? "2px solid #d97706" : "1px solid transparent",
            }}>{qi + 1}</div>
          ))}
        </div>

        {/* Live monitor grid */}
        <div style={{ ...crd, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: F }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: TEXT_PRIMARY, position: "sticky", left: 0, background: "#f9fafb", minWidth: 120 }}>Student</th>
                {qs.map((_, qi) => (
                  <th key={qi} style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: qi === currentQ ? "#d97706" : TEXT_MUTED, minWidth: 40 }}>Q{qi + 1}</th>
                ))}
                <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: TEXT_PRIMARY, minWidth: 50 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => {
                const score = getScore(s.id);
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f4f4f5" }}>
                    <td style={{ padding: "6px 12px", fontWeight: 600, color: TEXT_PRIMARY, position: "sticky", left: 0, background: "#fff", whiteSpace: "nowrap" }}>{lastName(s.name)}</td>
                    {qs.map((q, qi) => {
                      const ans = activity.responses?.[s.id + "-" + qi];
                      const answered = ans !== undefined;
                      const correct = answered && ans === q.correct;
                      const showResult = isLocked(qi);
                      const letter = answered ? String.fromCharCode(65 + ans) : "";
                      return (
                        <td key={qi} style={{
                          padding: "6px 6px", textAlign: "center", fontWeight: 700,
                          background: showResult ? (correct ? "#ecfdf5" : answered ? "#fef2f2" : "transparent") : (answered ? "#f0f0ff" : "transparent"),
                          color: showResult ? (correct ? GREEN : RED) : (answered ? "#6366f1" : "#e5e7eb"),
                        }}>{answered ? letter : "-"}</td>
                      );
                    })}
                    <td style={{ padding: "6px 12px", textAlign: "center", fontWeight: 800, color: score > 0 ? TEXT_PRIMARY : TEXT_MUTED }}>{score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {activity.scored && (
          <div style={{ marginTop: 16 }}>
            <ReboundPanel data={data} setData={setData} activityType={type} week={week} isAdmin={true} userName="Andrew Ishak" />
          </div>
        )}
      </div>
    </div>
  );
}

function FishbowlAdmin({ week, data, setData, onBack }) {
  const fishbowls = data.weeklyFishbowl || {};
  const existing = fishbowls[week] || {};
  const isConfirmed = existing.confirmed;
  const sorted = [...data.students].sort(lastSortObj);

  const initScores = () => {
    const s = {};
    sorted.forEach(st => { s[st.id] = existing.scores?.[st.id] ?? 20; });
    return s;
  };
  const [scores, setScores] = useState(initScores);
  const [star, setStar] = useState(existing.star || null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const adjust = (sid, amount) => { setScores(prev => ({ ...prev, [sid]: Math.max(0, (prev[sid] || 0) + amount) })); };

  const confirm = async () => {
    const entries = [];
    data.students.forEach(s => {
      const pts = scores[s.id] || 0;
      if (pts > 0) entries.push({ id: genId(), studentId: s.id, amount: pts, source: "Fishbowl Wk" + week, ts: Date.now() });
    });
    if (star) {
      entries.push({ id: genId(), studentId: star, amount: 1, source: "Fishbowl Star Wk" + week, ts: Date.now() });
    }
    const stars = { ...(data.fishbowlStars || {}), [week]: star };
    const updated = {
      ...data,
      weeklyFishbowl: { ...fishbowls, [week]: { scores, star, confirmed: true } },
      fishbowlStars: stars,
      log: [...data.log, ...entries],
    };
    await saveData(updated); setData(updated); showMsg("Confirmed! Points posted.");
  };

  const deleteFishbowl = async () => {
    const { [week]: _, ...rest } = fishbowls;
    const updated = { ...data, weeklyFishbowl: rest };
    await saveData(updated); setData(updated); onBack();
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#18181b" }}>Week {week} Fishbowl</div>
          <div style={{ width: 60 }} />
        </div>
        {isConfirmed && <div style={{ textAlign: "center", fontSize: 13, color: GREEN, fontWeight: 700, marginBottom: 12, padding: 8, background: "#ecfdf5", borderRadius: 8 }}>Confirmed and posted</div>}
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Fishbowl Star of the Week</div>
          <select value={star || ""} onChange={e => setStar(e.target.value || null)} style={{ ...sel, width: "100%", fontSize: 14, padding: "10px 12px" }}>
            <option value="">None</option>
            {sorted.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {star && <div style={{ fontSize: 12, color: "#d97706", marginTop: 6, fontWeight: 600 }}>+1 bonus point for the star</div>}
        </div>
        <div style={{ ...crd, padding: 0 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid " + BORDER }}>
            <div style={{ ...sectionLabel }}>Scores (default 20)</div>
          </div>
          {sorted.map(s => {
            const pts = scores[s.id] ?? 20;
            const isStar = star === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>
                    {s.name}
                    {isStar && <span style={{ marginLeft: 6, fontSize: 12, color: "#d97706" }}>&#9733;</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <button onClick={() => adjust(s.id, -20)} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 6px", minWidth: 32 }}>-20</button>
                  <button onClick={() => adjust(s.id, -5)} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 6px", minWidth: 28 }}>-5</button>
                  <button onClick={() => adjust(s.id, -1)} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 6px", minWidth: 28 }}>-1</button>
                  <div style={{ fontSize: 18, fontWeight: 800, color: pts === 20 ? "#18181b" : pts === 0 ? RED : "#d97706", width: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{pts}</div>
                  <button onClick={() => adjust(s.id, 1)} style={{ ...pill, background: "#ecfdf5", color: GREEN, fontSize: 11, padding: "4px 6px", minWidth: 28 }}>+1</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {!isConfirmed && <button onClick={confirm} style={{ ...pill, background: GREEN, color: "#fff", flex: 1, padding: "12px 0" }}>Confirm and Post Points</button>}
          <button onClick={() => { if (window.confirm("Delete fishbowl week " + week + "?")) deleteFishbowl(); }} style={{ ...pill, background: "#fef2f2", color: RED, padding: "12px 16px" }}>Delete</button>
        </div>

        {isConfirmed && <ReboundPanel data={data} setData={setData} activityType="fishbowl" week={week} isAdmin={true} userName="Andrew Ishak" />}
      </div>
    </div>
  );
}

/* ─── STUDENT: GAME + TOT ANSWER VIEW ─── */
export function StudentAnswerView({ data, setData, userName }) {
  const [week, setWeek] = useState(null);
  const [mode, setMode] = useState("game");
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");
  const [countdown, setCountdown] = useState(0);
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;
  const games = data.weeklyGames || {};
  const tots = data.weeklyToT || {};

  // Auto-refresh data every 2 seconds for live sync
  React.useEffect(() => {
    if (week === null) return;
    const activity = mode === "game" ? games[week] : (tots[week] || tots[String(week)]);
    if (!activity || activity.phase !== "live") return;
    const iv = setInterval(async () => {
      try {
        const raw = await window.storage.get("comm2-v1", true);
        if (raw?.value) { const d = JSON.parse(raw.value); setData(d); }
      } catch(e) {}
    }, 2000);
    return () => clearInterval(iv);
  }, [week, mode]);

  // Countdown effect
  React.useEffect(() => {
    if (week === null) return;
    const activity = mode === "game" ? games[week] : (tots[week] || tots[String(week)]);
    if (!activity?.countdown) { setCountdown(0); return; }
    const endTime = activity.countdown + 5000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setCountdown(left);
    };
    tick();
    const iv = setInterval(tick, 200);
    return () => clearInterval(iv);
  }, [week, mode, data]);

  const submitAnswer = async (actType, w, qIdx, answerIdx) => {
    const activities = actType === "game" ? games : tots;
    const activity = activities[w] || activities[String(w)];
    if (!activity || !sid) return;
    const key = sid + "-" + qIdx;
    const responses = { ...(activity.responses || {}), [key]: answerIdx };
    const wKey = activities[w] ? w : String(w);
    const dataKey = actType === "game" ? "weeklyGames" : "weeklyToT";
    const updated = { ...data, [dataKey]: { ...activities, [wKey]: { ...activity, responses } } };
    await saveData(updated); setData(updated);
    showMsg("Locked in"); setSelected(null);
  };

  // Week selector
  if (week === null) {
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Answer</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <button onClick={() => setMode("game")} style={mode === "game" ? pillActive : pillInactive}>Weekly Game</button>
            <button onClick={() => setMode("tot")} style={mode === "tot" ? pillActive : pillInactive}>This or That</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const w = i + 1;
              const item = mode === "game" ? games[w] : (tots[w] || tots[String(w)]);
              const isLive = item?.phase === "live";
              const isScored = item?.scored;
              const hasResponded = sid && item?.responses && Object.keys(item.responses).some(k => k.startsWith(sid));
              const isAvailable = isLive || isScored;
              return (
                <button key={w} onClick={() => { if (isAvailable) { setWeek(w); setSelected(null); } }} style={{
                  ...crd, padding: "14px 8px", cursor: isAvailable ? "pointer" : "default", textAlign: "center",
                  opacity: isAvailable ? 1 : 0.4,
                  border: isLive ? "2px solid #d97706" : hasResponded ? "2px solid " + GREEN : "1px solid #f3f4f6",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: isLive ? "#d97706" : hasResponded ? GREEN : isScored ? "#111827" : "#d1d5db" }}>{w}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{isScored ? "Results" : isLive ? "LIVE" : ""}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Get activity
  const actType = mode;
  const activities = actType === "game" ? games : tots;
  const activity = activities[week] || activities[String(week)];
  if (!activity) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: "#9ca3af" }}>Not available.<br /><button onClick={() => setWeek(null)} style={{ ...pillInactive, marginTop: 12 }}>Back</button></div>;

  const qs = activity.questions || [];
  const currentQ = activity.currentQ || 0;
  const lockedQs = activity.lockedQs || [];
  const isLive = activity.phase === "live";

  // Game results (scored)
  if (actType === "game" && activity.scored) {
    let gameTotal = 0;
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <button onClick={() => setWeek(null)} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Week {week} Results</div>
          {qs.map((q, i) => {
            const my = sid ? activity.responses?.[sid + "-" + i] : undefined;
            const correct = my === q.correct;
            if (correct) { gameTotal += GAME_PTS; }
            return (
              <div key={i} style={{ ...crd, padding: 12, marginBottom: 6, borderColor: correct ? "#bbf7d0" : "#fecaca" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: correct ? GREEN : RED, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{GAME_CATS.find(c => c.id === q.category)?.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: correct ? GREEN : RED, marginLeft: "auto" }}>{correct ? "Correct" : "Incorrect"}</div>
                </div>
                {!correct && my !== undefined && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>You picked <strong style={{ color: RED }}>{q.options[my]}</strong>, but the answer was <strong style={{ color: GREEN }}>{q.options[q.correct]}</strong>.</div>}
                {!correct && my === undefined && <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic", marginTop: 4 }}>No answer. Correct: <strong>{q.options[q.correct]}</strong></div>}
              </div>
            );
          })}
          <div style={{ ...crd, padding: 14, marginTop: 12, textAlign: "center" }}>
            <div style={{ ...sectionLabel, marginBottom: 2 }}>Game Points</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{gameTotal}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 100</span></div>
          </div>
          <ReboundPanel data={data} setData={setData} activityType="game" week={week} isAdmin={false} userName={userName} />
        </div>
      </div>
    );
  }

  // ToT results (scored)
  if (actType === "tot" && activity.scored) {
    const ptsEach = qs.length > 0 ? 20 / qs.length : 20;
    let total = 0;
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <button onClick={() => setWeek(null)} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Week {week} This or That Results</div>
          {qs.map((q, i) => {
            const my = sid ? activity.responses?.[sid + "-" + i] : undefined;
            const correct = my === q.correct;
            if (correct) total += ptsEach;
            return (
              <div key={i} style={{ ...crd, padding: 12, marginBottom: 6, borderColor: correct ? "#bbf7d0" : "#fecaca" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Question {i + 1}</div>
                {correct && <div style={{ fontSize: 13, color: GREEN, fontWeight: 700 }}>Correct: {q.options[q.correct]}</div>}
                {!correct && my !== undefined && <div style={{ fontSize: 13, color: "#6b7280" }}>You picked <strong style={{ color: RED }}>{q.options[my]}</strong>, but the answer was <strong style={{ color: GREEN }}>{q.options[q.correct]}</strong>.</div>}
                {my === undefined && <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No answer. Correct: <strong>{q.options[q.correct]}</strong></div>}
              </div>
            );
          })}
          <div style={{ ...crd, padding: 14, marginTop: 12, textAlign: "center" }}>
            <div style={{ ...sectionLabel, marginBottom: 2 }}>Game Points</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{Math.round(total * 10) / 10}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 20</span></div>
          </div>
          <ReboundPanel data={data} setData={setData} activityType="tot" week={week} isAdmin={false} userName={userName} />
        </div>
      </div>
    );
  }

  // Not live yet
  if (!isLive) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: "#9ca3af" }}>Not open yet.<br /><button onClick={() => setWeek(null)} style={{ ...pillInactive, marginTop: 12 }}>Back</button></div>;
  }

  // Live answering - student sees admin-controlled current question
  const myAnswer = sid ? activity.responses?.[sid + "-" + currentQ] : undefined;
  const isCurrentLocked = lockedQs.includes(currentQ);
  const q = qs[currentQ];
  if (!q) return null;

  // Show result for locked question
  if (isCurrentLocked) {
    const correct = myAnswer !== undefined && myAnswer === q.correct;
    const allLocked = lockedQs.length >= qs.length;
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => setWeek(null)} style={pillInactive}>Back</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>Wk {week}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{currentQ + 1}/{qs.length}</span>
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Q{currentQ + 1}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: correct ? GREEN : RED, marginBottom: 8 }}>{correct ? "Correct!" : "Incorrect"}</div>
          {!correct && myAnswer !== undefined && (
            <div style={{ fontSize: 15, color: "#6b7280", marginBottom: 8 }}>
              You picked <strong style={{ color: RED }}>{q.options[myAnswer]}</strong>. Answer: <strong style={{ color: GREEN }}>{q.options[q.correct]}</strong>
            </div>
          )}
          {myAnswer === undefined && (
            <div style={{ fontSize: 15, color: "#9ca3af", marginBottom: 8 }}>
              No answer. The answer was <strong style={{ color: GREEN }}>{q.options[q.correct]}</strong>
            </div>
          )}
          {allLocked && <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 16 }}>All questions complete. Results coming soon.</div>}
          {!allLocked && <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 16 }}>Waiting for next question...</div>}
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16 }}>
            {qs.map((qq, qi) => {
              const a = sid ? activity.responses?.[sid + "-" + qi] : undefined;
              const locked = lockedQs.includes(qi);
              const c = locked && a !== undefined && a === qq.correct;
              const w2 = locked && (a === undefined || a !== qq.correct);
              return <div key={qi} style={{ width: 12, height: 12, borderRadius: 6, background: c ? GREEN : w2 ? RED : qi === currentQ ? "#d97706" : "#e5e7eb" }} />;
            })}
          </div>
        </div>
      </div>
    );
  }

  // Show current question for answering
  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => setWeek(null)} style={pillInactive}>Back</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#d97706" }}>Wk {week}</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{currentQ + 1}/{qs.length}</span>
        </div>

        {/* Countdown overlay */}
        {countdown > 0 && (
          <div style={{ fontSize: 64, fontWeight: 900, color: RED, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>{countdown}</div>
        )}

        <div style={{ fontSize: 48, fontWeight: 900, color: "#111827", marginBottom: 24 }}>Q{currentQ + 1}</div>

        {myAnswer !== undefined ? (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>Locked in: {q.options[myAnswer]}</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 8 }}>Waiting for results...</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 340, margin: "0 auto", marginBottom: 20 }}>
              {q.options.map((opt, oi) => {
                if (!opt && actType === "game") return null;
                const c = OPT_COLORS[oi] || OPT_COLORS[0]; const isSel = selected === oi;
                return (
                  <button key={oi} onClick={() => setSelected(oi)} style={{
                    padding: "16px 20px", borderRadius: 12, width: "100%", textAlign: "left",
                    fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "all 0.15s",
                    background: isSel ? c.bg : c.light, color: isSel ? "#fff" : c.bg,
                    border: "2px solid " + c.bg, transform: isSel ? "scale(1.02)" : "scale(1)",
                  }}><span style={{ fontWeight: 900, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</span>{opt}</button>
                );
              })}
            </div>
            {selected !== null && <button onClick={() => submitAnswer(actType, week, currentQ, selected)} style={{ ...pill, fontSize: 14, padding: "12px 40px", background: "#111827", color: "#fff", fontWeight: 700 }}>Lock in answer</button>}
          </>
        )}

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 24 }}>
          {qs.map((qq, qi) => {
            const a = sid ? activity.responses?.[sid + "-" + qi] : undefined;
            const locked = lockedQs.includes(qi);
            const c2 = locked && a !== undefined && a === qq.correct;
            const w2 = locked && (a === undefined || a !== qq.correct);
            return <div key={qi} style={{ width: 12, height: 12, borderRadius: 6, background: c2 ? GREEN : w2 ? RED : qi === currentQ ? "#d97706" : "#e5e7eb" }} />;
          })}
        </div>
      </div>
    </div>
  );
}

/* --- ACCOLADES --- */
export function Accolades({ data }) {
  const stars = data.fishbowlStars || {};
  const games = data.weeklyGames || {};

  const perfectScores = [];
  Object.entries(games).forEach(([w, game]) => {
    if (!game.scored) return;
    data.students.forEach(s => {
      let pts = 0;
      for (let q = 0; q < 10; q++) {
        if (game.responses?.[s.id + "-" + q] === game.questions[q].correct) pts += GAME_PTS;
      }
      if (pts === 100) perfectScores.push({ week: parseInt(w), student: s });
    });
  });
  perfectScores.sort((a, b) => a.week - b.week);

  const starEntries = Object.entries(stars).filter(([_, sid]) => sid).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 16 }}>Accolades</div>
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>&#9733;</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#18181b" }}>Fishbowl Star of the Week</div>
          </div>
          {starEntries.length === 0 && <div style={{ fontSize: 13, color: "#d4d4d8", fontStyle: "italic" }}>No stars awarded yet.</div>}
          {starEntries.map(([w, sid]) => {
            const student = data.students.find(s => s.id === sid);
            return (
              <div key={w} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#d97706", flexShrink: 0 }}>{w}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>{student?.name || "Unknown"}</div>
              </div>
            );
          })}
        </div>
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>&#128175;</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#18181b" }}>Perfect Game Scores</div>
          </div>
          {perfectScores.length === 0 && <div style={{ fontSize: 13, color: "#d4d4d8", fontStyle: "italic" }}>No perfect scores yet.</div>}
          {perfectScores.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: GREEN, flexShrink: 0 }}>{p.week}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#18181b" }}>{p.student.name}</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginLeft: "auto" }}>100/100</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/* ─── REBOUND SYSTEM ─── */
export function ReboundPanel({ data, setData, activityType, week, isAdmin, userName }) {
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const [reboundLink, setReboundLink] = useState("");

  const rebounds = data.rebounds || {};
  const reboundKey = activityType + "-" + week;
  const reboundData = rebounds[reboundKey] || {};
  const students = data.students.filter(s => s.name !== "Andrew Ishak");
  const sorted = [...students].sort(lastSortObj);
  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;

  // Calculate scores based on activity type
  const getStudentScore = (s) => {
    if (activityType === "game") {
      const game = (data.weeklyGames || {})[week];
      if (!game?.scored) return null;
      let pts = 0;
      for (let q = 0; q < 10; q++) {
        if (game.responses?.[s.id + "-" + q] === game.questions[q].correct) pts += GAME_PTS;
      }
      return { score: pts, max: 100, responded: Object.keys(game.responses || {}).some(k => k.startsWith(s.id)) };
    }
    if (activityType === "tot") {
      const tot = (data.weeklyToT || {})[week] || (data.weeklyToT || {})[String(week)];
      if (!tot?.scored) return null;
      const ptsEach = tot.questions.length > 0 ? 20 / tot.questions.length : 20;
      let pts = 0;
      tot.questions.forEach((q, qi) => {
        if (tot.responses?.[s.id + "-" + qi] === q.correct) pts += ptsEach;
      });
      return { score: Math.round(pts * 10) / 10, max: 20, responded: Object.keys(tot.responses || {}).some(k => k.startsWith(s.id)) };
    }
    if (activityType === "fishbowl") {
      const fb = (data.weeklyFishbowl || {})[week];
      if (!fb?.confirmed) return null;
      const pts = fb.scores?.[s.id] ?? 0;
      return { score: pts, max: 20, responded: true };
    }
    return null;
  };

  // Calculate class average (including zeros)
  const allScores = sorted.map(s => {
    const result = getStudentScore(s);
    return result ? result.score : 0;
  });
  const classAvg = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0;
  const maxPts = activityType === "game" ? 100 : 20;

  // Check if scored
  const isScored = activityType === "game" ? (data.weeklyGames || {})[week]?.scored
    : activityType === "tot" ? ((data.weeklyToT || {})[week] || (data.weeklyToT || {})[String(week)])?.scored
    : (data.weeklyFishbowl || {})[week]?.confirmed;

  if (!isScored) return null;

  // Score timestamp (when it was scored)
  const scoredTs = reboundData.scoredTs || Date.now();
  const reboundDeadline = scoredTs + 48 * 60 * 60 * 1000;
  const reboundOpen = Date.now() < reboundDeadline;
  const hoursLeft = Math.max(0, Math.round((reboundDeadline - Date.now()) / (1000 * 60 * 60)));

  // Save scored timestamp if not set
  const ensureScoredTs = async () => {
    if (!reboundData.scoredTs) {
      const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, scoredTs: Date.now() } } };
      await saveData(updated); setData(updated);
    }
  };
  if (!reboundData.scoredTs && isScored) ensureScoredTs();

  // Admin: set absence type
  const setAbsenceType = async (studentId, type) => {
    const subs = { ...(reboundData.submissions || {}), [studentId]: { ...(reboundData.submissions?.[studentId] || {}), absenceType: type } };
    const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, submissions: subs } } };
    await saveData(updated); setData(updated); showMsg("Set to " + type);
  };

  // Admin: approve rebound
  const approveRebound = async (studentId) => {
    const result = getStudentScore(data.students.find(s => s.id === studentId));
    if (!result) return;
    const sub = reboundData.submissions?.[studentId] || {};
    const cap = maxPts * 0.8;
    const reboundTarget = Math.min(classAvg, cap);
    let reboundPts;
    if (activityType === "fishbowl") {
      reboundPts = Math.min(10, cap - result.score);
    } else if (sub.absenceType === "unannounced") {
      reboundPts = Math.round(Math.min(reboundTarget / 2, cap - result.score) * 10) / 10;
    } else {
      reboundPts = Math.round(Math.max(0, Math.min(reboundTarget, cap) - result.score) * 10) / 10;
    }
    if (sub.customPts !== undefined) reboundPts = sub.customPts;
    if (reboundPts <= 0) { showMsg("No points to rebound"); return; }

    const source = "Rebound " + (activityType === "game" ? "Game" : activityType === "tot" ? "ToT" : "Fishbowl") + " Wk" + week;
    const entry = { id: genId(), studentId, amount: reboundPts, source, ts: Date.now() };
    const subs = { ...(reboundData.submissions || {}), [studentId]: { ...sub, approved: true, reboundPts } };
    const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, submissions: subs } }, log: [...data.log, entry] };
    await saveData(updated); setData(updated); showMsg("Rebounded +" + reboundPts);
  };

  // Admin: set custom rebound points
  const setCustomPts = async (studentId, pts) => {
    const subs = { ...(reboundData.submissions || {}), [studentId]: { ...(reboundData.submissions?.[studentId] || {}), customPts: parseFloat(pts) || 0 } };
    const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, submissions: subs } } };
    await saveData(updated); setData(updated);
  };

  // Student: submit rebound link
  const submitRebound = async () => {
    if (!reboundLink.trim() || !sid) return;
    const subs = { ...(reboundData.submissions || {}), [sid]: { ...(reboundData.submissions?.[sid] || {}), link: reboundLink.trim(), ts: Date.now() } };
    const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, submissions: subs } } };
    await saveData(updated); setData(updated);
    setReboundLink(""); showMsg("Submitted! Your instructor will review.");
  };

  const actLabel = activityType === "game" ? "Weekly Game" : activityType === "tot" ? "This or That" : "Fishbowl";

  // ─── ADMIN VIEW ───
  if (isAdmin) {
    return (
      <div style={{ marginTop: 16 }}>
        <Toast message={msg} />
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 4 }}>Results and Rebounds</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>
            Class average: <strong>{classAvg}</strong> / {maxPts} | Cap: <strong>{maxPts * 0.8}</strong> (80%) | Rebound: {reboundOpen ? hoursLeft + "h left" : "Closed"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
            {sorted.map(s => {
              const result = getStudentScore(s);
              const score = result ? result.score : 0;
              const responded = result ? result.responded : false;
              const missed = !responded && activityType !== "fishbowl";
              const belowAvg = score < classAvg;
              const sub = reboundData.submissions?.[s.id] || {};
              const cap = maxPts * 0.8;
              const reboundTarget = Math.min(classAvg, cap);
              const eligible = activityType === "fishbowl" ? score < 20 : (belowAvg || missed) && score < cap;
              const defaultRebound = activityType === "fishbowl" ? Math.min(10, cap - score)
                : sub.absenceType === "unannounced" ? Math.round(Math.min(reboundTarget / 2, cap - score) * 10) / 10
                : Math.round(Math.max(0, reboundTarget - score) * 10) / 10;
              const reboundPts = sub.customPts !== undefined ? sub.customPts : defaultRebound;

              return (
                <div key={s.id} style={{ padding: "10px 12px", borderRadius: 10, background: sub.approved ? "#ecfdf5" : missed ? "#fef2f2" : "#fff", border: "1px solid " + (sub.approved ? GREEN + "30" : missed ? RED + "30" : BORDER) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{s.name}</span>
                      {missed && <span style={{ fontSize: 11, fontWeight: 600, color: RED, marginLeft: 6 }}>MISSED</span>}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: score >= classAvg ? GREEN : score === 0 ? RED : "#d97706" }}>{score}<span style={{ fontSize: 12, color: TEXT_MUTED }}>/{maxPts}</span></div>
                  </div>

                  {eligible && !sub.approved && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + BORDER }}>
                      {missed && !sub.absenceType && (
                        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                          <button onClick={() => setAbsenceType(s.id, "announced")} style={{ ...pill, background: "#eff6ff", color: "#2563eb", fontSize: 11 }}>Announced Absence</button>
                          <button onClick={() => setAbsenceType(s.id, "unannounced")} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Unannounced Absence</button>
                        </div>
                      )}
                      {sub.absenceType && <div style={{ fontSize: 11, color: sub.absenceType === "announced" ? "#2563eb" : RED, fontWeight: 600, marginBottom: 4 }}>{sub.absenceType === "announced" ? "Announced" : "Unannounced"} absence</div>}
                      {sub.link && (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 2 }}>Rebound video:</div>
                          <a href={sub.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563eb", wordBreak: "break-all" }}>{sub.link}</a>
                          <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>Submitted {new Date(sub.ts).toLocaleString()}</div>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: TEXT_MUTED }}>Rebound:</span>
                        <input type="number" defaultValue={reboundPts} onBlur={e => setCustomPts(s.id, e.target.value)} style={{ ...inp, width: 60, fontSize: 13, textAlign: "center", padding: "4px" }} />
                        <span style={{ fontSize: 12, color: TEXT_MUTED }}>pts</span>
                        {sub.link && <button onClick={() => approveRebound(s.id)} style={{ ...pill, background: GREEN, color: "#fff", fontSize: 12, marginLeft: "auto" }}>Approve</button>}
                      </div>
                    </div>
                  )}
                  {sub.approved && <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginTop: 4 }}>Rebounded +{sub.reboundPts} pts</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── STUDENT VIEW ───
  if (!sid) return null;
  const myResult = getStudentScore(student);
  const myScore = myResult ? myResult.score : 0;
  const cap = maxPts * 0.8;
  const belowAvg = myScore < classAvg;
  const mySub = reboundData.submissions?.[sid] || {};
  const eligible = activityType === "fishbowl" ? myScore < 20 : belowAvg && myScore < cap;

  return (
    <div style={{ marginTop: 16 }}>
      <Toast message={msg} />
      <div style={{ ...crd, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ ...sectionLabel }}>Class Results</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED }}>Average: <strong>{classAvg}</strong> / {maxPts}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "center", marginBottom: 12 }}>
          <div style={{ padding: 12, borderRadius: 10, background: myScore >= classAvg ? "#ecfdf5" : "#fef2f2" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>Your Score</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: myScore >= classAvg ? GREEN : "#d97706" }}>{myScore}<span style={{ fontSize: 13, color: TEXT_MUTED }}>/{maxPts}</span></div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: "#f4f4f5" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>Class Average</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: TEXT_PRIMARY }}>{classAvg}<span style={{ fontSize: 13, color: TEXT_MUTED }}>/{maxPts}</span></div>
          </div>
        </div>

        {mySub.approved && (
          <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf5", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>Rebound approved: +{mySub.reboundPts} pts</div>
          </div>
        )}

        {eligible && !mySub.approved && reboundOpen && (
          <div style={{ padding: 12, borderRadius: 10, background: "#fffbeb", border: "1px solid #fef3c7", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>Rebound Available</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, marginBottom: 8 }}>
              {activityType === "fishbowl"
                ? "Submit a video of you reviewing all the fishbowl articles with a friend or family member to earn up to 10 points back. Rebounds are capped at 80% of the total points for this activity."
                : "If your score is below the class average, you can earn rebound points by submitting a video of you explaining the material you missed with a friend or family member. You can earn up to the class average, capped at 80% of the total points for this activity."
              }
              {" "}You have <strong>{hoursLeft} hours</strong> left to submit.
            </div>
            {mySub.link ? (
              <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>Submitted! Waiting for instructor review.</div>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input value={reboundLink} onChange={e => setReboundLink(e.target.value)} placeholder="Paste your video link here..." style={{ ...inp, flex: 1, fontSize: 13 }} />
                <button onClick={submitRebound} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Submit</button>
              </div>
            )}
          </div>
        )}

        {eligible && !mySub.approved && !reboundOpen && !mySub.link && (
          <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic", marginBottom: 12 }}>Rebound window has closed.</div>
        )}
      </div>
    </div>
  );
}
