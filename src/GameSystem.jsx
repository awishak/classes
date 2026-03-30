import React, { useState } from "react";

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const ACCENT = "#9f1239";
const GREEN = "#10b981";
const RED = "#ef4444";

const crd = { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" };
const pill = { padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillActive = { ...pill, background: "#111827", color: "#fff" };
const pillInactive = { ...pill, background: "#f3f4f6", color: "#4b5563" };
const sectionLabel = { fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F };
const inp = { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", color: "#111827", fontFamily: F, fontSize: 14, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

const GAME_CATS = [
  { id: "on_topic", label: "On Topic" },
  { id: "sports_world", label: "Sports World" },
];
const GAME_GRADE_PTS = { on_topic: 15, sports_world: 2.5 };
const GAME_PTS = 10;
const OPT_COLORS = [
  { bg: "#dc2626", light: "#fef2f2" },
  { bg: "#2563eb", light: "#eff6ff" },
  { bg: "#d97706", light: "#fffbeb" },
  { bg: "#059669", light: "#ecfdf5" },
];

function Toast({ message }) { if (!message) return null; return <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", background: "#1e293b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>; }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function lastName(name) { if (name === "Alexander Watanabe Eriksson") return "Watanabe Eriksson"; return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }
async function saveData(data) { try { await window.storage.set("comm118-game-v14", JSON.stringify(data), true); return true; } catch { return false; } }
function gp(log, sid) { return log.filter(e => e.studentId === sid).reduce((s, e) => s + e.amount, 0); }
function rs(students, log) { return students.map(s => ({ ...s, points: gp(log, s.id) })).sort((a, b) => b.points - a.points); }
function shuffleTeams(students, log, teams) {
  const ranked = rs(students, log);
  const numTeams = teams.length;
  const assignments = {};
  teams.forEach(t => { assignments[t.id] = []; });
  const teamOrder = teams.map(t => t.id);
  ranked.forEach((s, idx) => {
    const round = Math.floor(idx / numTeams);
    const pos = idx % numTeams;
    const teamIdx = round === 0 ? pos : (numTeams - 1 - pos);
    assignments[teamOrder[teamIdx]].push(s.id);
  });
  return students.map(s => {
    const tid = Object.keys(assignments).find(tid => assignments[tid].includes(s.id));
    return { ...s, teamId: tid || s.teamId };
  });
}

function emptyGame() {
  return Array.from({ length: 10 }).map((_, i) => ({
    text: "", options: ["", "", "", ""], correct: 0,
    category: i < 6 ? "on_topic" : "sports_world",
  }));
}

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
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...(games[w] || {}), questions, active: true, scored: false } } };
    await saveData(updated); setData(updated); showMsg("Week " + w + " saved");
  };

  const scoreGame = async (w) => {
    const game = games[w]; if (!game) return;
    const entries = [];
    const playerScores = {};
    data.students.forEach(s => {
      let pts = 0;
      for (let q = 0; q < 10; q++) {
        const ans = game.responses?.[s.id + "-" + q];
        if (ans === game.questions[q].correct) pts += GAME_PTS;
      }
      playerScores[s.id] = pts;
      if (pts > 0) entries.push({ id: genId(), studentId: s.id, amount: pts, source: "Game Wk" + w, ts: Date.now() });
    });

    // Calculate winning team (top 3 scores per team)
    const shuffled = shuffleTeams(data.students, data.log, data.teams);
    const teamScores = {};
    data.teams.forEach(t => {
      const members = shuffled.filter(s => s.teamId === t.id);
      const scores = members.map(m => playerScores[m.id] || 0).sort((a, b) => b - a);
      teamScores[t.id] = scores.slice(0, 3).reduce((sum, s) => sum + s, 0);
    });
    const maxTeamScore = Math.max(...Object.values(teamScores));
    const winningTeamId = maxTeamScore > 0 ? Object.keys(teamScores).find(tid => teamScores[tid] === maxTeamScore) : null;

    // Award 10 bonus to winning team members
    if (winningTeamId) {
      const winMembers = shuffled.filter(s => s.teamId === winningTeamId);
      const winTeam = data.teams.find(t => t.id === winningTeamId);
      winMembers.forEach(m => {
        entries.push({ id: genId(), studentId: m.id, amount: 10, source: "Team Win Wk" + w, ts: Date.now() });
      });
    }

    const weeklyWins = { ...(data.weeklyTeamWins || {}), [w]: winningTeamId };
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...game, scored: true, active: false } }, log: [...data.log, ...entries], weeklyTeamWins: weeklyWins };
    await saveData(updated); setData(updated);
    const winName = winningTeamId ? data.teams.find(t => t.id === winningTeamId)?.name : "None";
    showMsg("Scored! Winning team: " + winName + " (+10 bonus each)");
  };

  const deleteGame = async (w) => {
    const { [w]: _, ...rest } = games;
    const updated = { ...data, weeklyGames: rest };
    await saveData(updated); setData(updated); setWeek(null); showMsg("Deleted");
  };

  const saveToT = async (w, questions) => {
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...(tots[w] || {}), questions, active: true, scored: false } } };
    await saveData(updated); setData(updated); showMsg("Week " + w + " saved");
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
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...tot, scored: true, active: false } }, log: [...data.log, ...entries] };
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
    return <GameEditor week={week} initial={existing?.questions || emptyGame()} scored={existing?.scored} responses={existing?.responses || {}} students={data.students} onSave={qs => saveGame(week, qs)} onScore={() => scoreGame(week)} onDelete={() => { if (window.confirm("Delete game week " + week + "?")) deleteGame(week); }} onBack={() => setWeek(null)} msg={msg} />;
  }

  if (week !== null && mode === "tot") {
    const existing = tots[week];
    return <ToTEditor week={week} initial={existing?.questions || [{ prompt: "", options: ["", ""], correct: 0 }]} scored={existing?.scored} responses={existing?.responses || {}} students={data.students} onSave={qs => saveToT(week, qs)} onScore={() => scoreToT(week)} onDelete={() => { if (window.confirm("Delete This or That week " + week + "?")) deleteToT(week); }} onBack={() => setWeek(null)} msg={msg} />;
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
            const responses = item?.responses ? Object.keys(item.responses).length : 0;
            return (
              <button key={w} onClick={() => setWeek(w)} style={{
                ...crd, padding: "14px 8px", cursor: "pointer", textAlign: "center",
                border: exists ? scored ? "2px solid " + GREEN : "2px solid " + ACCENT : "1px solid #f3f4f6",
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: scored ? GREEN : exists ? ACCENT : "#d1d5db" }}>{w}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{scored ? "Done" : exists ? responses + " resp" : "Empty"}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GameEditor({ week, initial, scored, responses, students, onSave, onScore, onDelete, onBack, msg }) {
  const [questions, setQuestions] = useState(JSON.parse(JSON.stringify(initial)));
  const updateQ = (i, field, value) => {
    const u = [...questions];
    if (field === "option") { u[i] = { ...u[i], options: u[i].options.map((o, oi) => oi === value.idx ? value.text : o) }; }
    else { u[i] = { ...u[i], [field]: value }; }
    setQuestions(u);
  };
  const uniqueStudents = new Set(Object.keys(responses).map(k => k.split("-")[0])).size;

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} Game</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{uniqueStudents} responses</div>
        </div>
        {scored && <div style={{ textAlign: "center", fontSize: 13, color: GREEN, fontWeight: 700, marginBottom: 12, padding: 8, background: "#ecfdf5", borderRadius: 8 }}>Already scored</div>}
        {questions.map((q, i) => (
          <div key={i} style={{ ...crd, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
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
          {!scored && <button onClick={onScore} style={{ ...pill, background: GREEN, color: "#fff", flex: 1, padding: "12px 0" }}>Score</button>}
          <button onClick={onDelete} style={{ ...pill, background: "#fef2f2", color: RED, padding: "12px 16px" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ToTEditor({ week, initial, scored, responses, students, onSave, onScore, onDelete, onBack, msg }) {
  const [questions, setQuestions] = useState(JSON.parse(JSON.stringify(initial)));
  const updateQ = (i, field, value) => {
    const u = [...questions];
    if (field === "optionText") { u[i] = { ...u[i], options: u[i].options.map((o, oi) => oi === value.idx ? value.text : o) }; }
    else { u[i] = { ...u[i], [field]: value }; }
    setQuestions(u);
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
        {scored && <div style={{ textAlign: "center", fontSize: 13, color: GREEN, fontWeight: 700, marginBottom: 12, padding: 8, background: "#ecfdf5", borderRadius: 8 }}>Already scored</div>}
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>{questions.length} question{questions.length !== 1 ? "s" : ""}, {ptsEach} pts each (20 total)</div>
        {questions.map((q, i) => (
          <div key={i} style={{ ...crd, padding: 14, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 900 }}>#{i + 1}</div>
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
          {!scored && <button onClick={onScore} style={{ ...pill, background: GREEN, color: "#fff", flex: 1, padding: "12px 0" }}>Score</button>}
          <button onClick={onDelete} style={{ ...pill, background: "#fef2f2", color: RED, padding: "12px 16px" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── FISHBOWL ADMIN ─── */
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
    // Star bonus
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
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} Fishbowl</div>
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
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ ...sectionLabel }}>Scores (default 20)</div>
          </div>
          {sorted.map(s => {
            const pts = scores[s.id] ?? 20;
            const isStar = star === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    {s.name}
                    {isStar && <span style={{ marginLeft: 6, fontSize: 12, color: "#d97706" }}>&#9733;</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <button onClick={() => adjust(s.id, -20)} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 6px", minWidth: 32 }}>-20</button>
                  <button onClick={() => adjust(s.id, -5)} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 6px", minWidth: 28 }}>-5</button>
                  <button onClick={() => adjust(s.id, -1)} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 6px", minWidth: 28 }}>-1</button>
                  <div style={{ fontSize: 18, fontWeight: 900, color: pts === 20 ? "#111827" : pts === 0 ? RED : "#d97706", width: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{pts}</div>
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
      </div>
    </div>
  );
}

/* ─── STUDENT: GAME + TOT ANSWER VIEW ─── */
export function StudentAnswerView({ data, setData, userName }) {
  const [week, setWeek] = useState(null);
  const [mode, setMode] = useState("game");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;
  const games = data.weeklyGames || {};
  const tots = data.weeklyToT || {};

  const submitGameAnswer = async (w, qIdx, answerIdx) => {
    const game = games[w]; if (!game || !sid) return;
    const key = sid + "-" + qIdx;
    const responses = { ...(game.responses || {}), [key]: answerIdx };
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...game, responses } } };
    await saveData(updated); setData(updated);
    showMsg("Locked in"); setSelected(null);
    if (qIdx < 9) setCurrentQ(qIdx + 1);
  };

  const submitToTAnswer = async (w, qIdx, answerIdx) => {
    const tot = tots[w] || tots[String(w)]; if (!tot || !sid) return;
    const key = sid + "-" + qIdx;
    const responses = { ...(tot.responses || {}), [key]: answerIdx };
    const wKey = tots[w] ? w : String(w);
    const updated = { ...data, weeklyToT: { ...tots, [wKey]: { ...tot, responses } } };
    await saveData(updated); setData(updated);
    showMsg("Locked in"); setSelected(null);
    if (qIdx < tot.questions.length - 1) setTimeout(() => setCurrentQ(qIdx + 1), 100);
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
              const item = mode === "game" ? games[w] : tots[w];
              const isActive = item?.active;
              const isScored = item?.scored;
              const hasResponded = sid && item?.responses && Object.keys(item.responses).some(k => k.startsWith(sid));
              return (
                <button key={w} onClick={() => { if (isActive || isScored) { setWeek(w); setCurrentQ(0); setSelected(null); } }} style={{
                  ...crd, padding: "14px 8px", cursor: isActive || isScored ? "pointer" : "default", textAlign: "center",
                  opacity: isActive || isScored ? 1 : 0.4,
                  border: hasResponded ? "2px solid " + GREEN : "1px solid #f3f4f6",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: hasResponded ? GREEN : isActive ? "#111827" : "#d1d5db" }}>{w}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{isScored ? "Results" : hasResponded ? "Done" : isActive ? "Open" : ""}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Game results
  if (mode === "game" && games[week]?.scored) {
    const game = games[week]; const qs = game.questions;
    let gameTotal = 0, gradeTotal = 0;
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <button onClick={() => setWeek(null)} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Week {week} Results</div>
          {qs.map((q, i) => {
            const my = sid ? game.responses?.[sid + "-" + i] : undefined;
            const correct = my === q.correct;
            if (correct) { gameTotal += GAME_PTS; gradeTotal += GAME_GRADE_PTS[q.category]; }
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
          <div style={{ ...crd, padding: 14, marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "center" }}>
              <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Game Points</div><div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{gameTotal}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 100</span></div></div>
              <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Grade Points</div><div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{Math.round(gradeTotal * 10) / 10}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 100</span></div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ToT results
  if (mode === "tot" && tots[week]?.scored) {
    const tot = tots[week]; const qs = tot.questions;
    const ptsEach = qs.length > 0 ? 20 / qs.length : 20;
    let total = 0;
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <button onClick={() => setWeek(null)} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Week {week} This or That Results</div>
          {qs.map((q, i) => {
            const my = sid ? tot.responses?.[sid + "-" + i] : undefined;
            const correct = my === q.correct;
            if (correct) total += ptsEach;
            return (
              <div key={i} style={{ ...crd, padding: 12, marginBottom: 6, borderColor: correct ? "#bbf7d0" : "#fecaca" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{q.prompt || "Question " + (i + 1)}</div>
                {!correct && my !== undefined && <div style={{ fontSize: 13, color: "#6b7280" }}>You picked <strong style={{ color: RED }}>{q.options[my]}</strong>, but the answer was <strong style={{ color: GREEN }}>{q.options[q.correct]}</strong>.</div>}
                {correct && <div style={{ fontSize: 13, color: GREEN, fontWeight: 700 }}>Correct: {q.options[q.correct]}</div>}
                {my === undefined && <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No answer. Correct: <strong>{q.options[q.correct]}</strong></div>}
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

  // Active game answering
  if (mode === "game") {
    const game = games[week];
    if (!game?.active) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: "#9ca3af" }}>Not open yet.<br /><button onClick={() => setWeek(null)} style={{ ...pillInactive, marginTop: 12 }}>Back</button></div>;
    const q = game.questions[currentQ];
    const myAnswer = sid ? game.responses?.[sid + "-" + currentQ] : undefined;
    const allDone = sid && Array.from({ length: 10 }).every((_, i) => game.responses?.[sid + "-" + i] !== undefined);
    if (allDone) return <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>All done</div><div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16 }}>Results after scoring.</div><button onClick={() => setWeek(null)} style={pillInactive}>Back</button></div>;

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
              <div style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>Locked in: {q.options[myAnswer]}</div>
              {currentQ < 9 && <button onClick={() => { setCurrentQ(currentQ + 1); setSelected(null); }} style={{ ...pillInactive, marginTop: 12 }}>Next</button>}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 340, margin: "0 auto", marginBottom: 20 }}>
                {q.options.map((opt, oi) => {
                  if (!opt) return null;
                  const c = OPT_COLORS[oi]; const isSel = selected === oi;
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
              {selected !== null && <button onClick={() => submitGameAnswer(week, currentQ, selected)} style={{ ...pill, fontSize: 14, padding: "12px 40px", background: "#111827", color: "#fff", fontWeight: 700 }}>Lock in answer</button>}
            </>
          )}
        </div>
      </div>
    );
  }

  // Active ToT answering
  if (mode === "tot") {
    const tot = tots[week] || tots[String(week)];
    if (!tot?.active) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: "#9ca3af" }}>Not open yet.<br /><button onClick={() => setWeek(null)} style={{ ...pillInactive, marginTop: 12 }}>Back</button></div>;
    const q = tot.questions[currentQ];
    const wKey = tots[week] ? week : String(week);
    const myAnswer = sid ? tot.responses?.[sid + "-" + currentQ] : undefined;
    const allDone = sid && tot.questions.every((_, i) => tot.responses?.[sid + "-" + i] !== undefined);
    if (allDone) return <div style={{ padding: 40, textAlign: "center", fontFamily: F }}><div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>All done</div><div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16 }}>Results after scoring.</div><button onClick={() => setWeek(null)} style={pillInactive}>Back</button></div>;

    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => setWeek(null)} style={pillInactive}>Back</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>Wk {week}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{currentQ + 1}/{tot.questions.length}</span>
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#111827", marginBottom: 24 }}>Question {currentQ + 1}</div>
          {myAnswer !== undefined ? (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: GREEN }}>Locked in: {q.options[myAnswer]}</div>
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
                      fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: F,
                      background: isSel ? "#111827" : "#f3f4f6", color: isSel ? "#fff" : "#111827",
                      border: isSel ? "2px solid #111827" : "2px solid #e5e7eb",
                      transform: isSel ? "scale(1.02)" : "scale(1)", transition: "all 0.15s",
                    }}>{opt}</button>
                  );
                })}
              </div>
              {selected !== null && <button onClick={() => submitToTAnswer(week, currentQ, selected)} style={{ ...pill, fontSize: 14, padding: "12px 40px", background: "#111827", color: "#fff", fontWeight: 700 }}>Lock in answer</button>}
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
}

/* ─── ACCOLADES ─── */
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
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Fishbowl Star of the Week</div>
          </div>
          {starEntries.length === 0 && <div style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic" }}>No stars awarded yet.</div>}
          {starEntries.map(([w, sid]) => {
            const student = data.students.find(s => s.id === sid);
            return (
              <div key={w} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#d97706", flexShrink: 0 }}>{w}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{student?.name || "Unknown"}</div>
              </div>
            );
          })}
        </div>

        <div style={{ ...crd, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>&#128175;</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Perfect Game Scores</div>
          </div>
          {perfectScores.length === 0 && <div style={{ fontSize: 13, color: "#d1d5db", fontStyle: "italic" }}>No perfect scores yet.</div>}
          {perfectScores.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f9fafb" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: GREEN, flexShrink: 0 }}>{p.week}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{p.student.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>100/100</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
