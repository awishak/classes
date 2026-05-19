import React, { useState } from "react";
import { useTheme, themedInteriorCrd, themedHeadingFont } from "./styles.jsx";
import { genId, gp, Toast } from "./utils.jsx";

const F = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const ACCENT = "#9f1239";
const GREEN = "#10b981";
const RED = "#ef4444";
const TEXT_PRIMARY = "#1c1917";
const TEXT_SECONDARY = "#57534e";
const TEXT_MUTED = "#a8a29e";
const BORDER = "#e5e5e4";
const AMBER = "#d97706";

const crd = { background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6", overflow: "hidden" };
const pill = { padding: "6px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillActive = { ...pill, background: "#111827", color: "#fff" };
const pillInactive = { ...pill, background: "#f3f4f6", color: "#4b5563" };
const sectionLabel = { fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F };
const inp = { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, padding: "10px 12px", color: "#111827", fontFamily: F, fontSize: 14, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" };
const sel = { ...inp, width: "auto" };

const GAME_CATS = [
  { id: "on_topic", label: "On Reading" },
  { id: "extra", label: "Extra" },
];
const GAME_GRADE_PTS = { on_topic: 15, extra: 2.5 };
const GAME_PTS = 10;
const OPT_COLORS = [
  { bg: "#dc2626", light: "#fef2f2" },
  { bg: "#2563eb", light: "#eff6ff" },
  { bg: "#d97706", light: "#fffbeb" },
  { bg: "#059669", light: "#ecfdf5" },
];

function lastName(name) { if (name === "Ava da Cunha") return "da Cunha"; if (name === "Nogbou Chris Junior Tadjo") return "Tadjo"; if (name === "Anne Sephora Pohan") return "Pohan"; if (name === "Santino Rafael Diaz") return "Diaz"; return name.split(" ").slice(-1)[0]; }
function lastSortObj(a, b) { return lastName(a.name).localeCompare(lastName(b.name)); }
async function saveData(data) { try { await window.storage.set("comm4-v1", JSON.stringify(data), true); return true; } catch { return false; } }
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
    category: i < 6 ? "on_topic" : "extra",
  }));
}

/* ─── ADMIN: GAME + TOT + FISHBOWL SETUP ─── */
export function GameAdmin({ data, setData }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const [week, setWeek] = useState(null);
  const [triviaId, setTriviaId] = useState(null);
  const [mode, setMode] = useState("game");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const games = data.weeklyGames || {};
  const tots = data.weeklyToT || {};
  const fishbowls = data.weeklyFishbowl || {};
  const triviaGames = data.triviaGames || {};

  const saveTrivia = async (id, patch) => {
    const existing = triviaGames[id] || {};
    const updated = { ...data, triviaGames: { ...triviaGames, [id]: { ...existing, ...patch } } };
    await saveData(updated); setData(updated);
  };

  const createTrivia = async () => {
    const id = "trivia_" + Date.now();
    const game = {
      id, title: "Untitled Trivia", ts: Date.now(),
      phase: "setup", scored: false,
      defaultPointsPerQ: 5,
      questions: [],
      teams: [],
      sittingOut: data.students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis").map(s => s.id),
      openQs: [], lockedQs: [], revealedQs: [],
      answers: {},
      bonusPoints: { teams: {}, students: {} },
    };
    const updated = { ...data, triviaGames: { ...triviaGames, [id]: game } };
    await saveData(updated); setData(updated); showMsg("Trivia game created"); setTriviaId(id);
  };

  const deleteTrivia = async (id) => {
    const { [id]: _, ...rest } = triviaGames;
    const updated = { ...data, triviaGames: rest };
    await saveData(updated); setData(updated); showMsg("Deleted");
    if (triviaId === id) setTriviaId(null);
  };

  const saveGame = async (w, questions) => {
    const existing = games[w] || {};
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...existing, questions, scored: false } } };
    await saveData(updated); setData(updated); showMsg("Week " + w + " saved");
  };

  const goLiveGame = async (w) => {
    const game = games[w]; if (!game) return;
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...game, phase: "live", currentQ: 0, lockedQs: [], countdown: null, active: true, scored: false } } };
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
    });
    const rebounds = data.rebounds || {};
    const rKey = "game-" + w;
    const originalTs = rebounds[rKey]?.scoredTs || Date.now();
    // Only add log entries for students who don't already have one for this source, or whose score changed
    const source = "Game Wk" + w;
    const existingEntries = data.log.filter(e => e.source === source);
    data.students.forEach(s => {
      const pts = playerScores[s.id] || 0;
      const existing = existingEntries.find(e => e.studentId === s.id);
      if (existing && existing.amount === pts) return; // no change
      if (existing) { /* remove old entry, will add new */ }
      if (pts > 0) entries.push({ id: genId(), studentId: s.id, amount: pts, source, ts: originalTs });
    });
    const cleanLog = data.log.filter(e => !(e.source === source && entries.find(n => n.studentId === e.studentId)));
    const newRebounds = { ...rebounds, [rKey]: { ...(rebounds[rKey] || {}), scoredTs: originalTs } };
    const updated = { ...data, weeklyGames: { ...games, [w]: { ...game, scored: true, active: false, phase: "done" } }, log: [...cleanLog, ...entries], rebounds: newRebounds };
    await saveData(updated); setData(updated); showMsg("Scored!");
  };

  const applyTeamBonus = async (w) => {
    const game = games[w]; if (!game) return;
    const playerScores = {};
    data.students.forEach(s => {
      let pts = 0;
      for (let q = 0; q < (game.questions || []).length; q++) {
        if (game.responses?.[s.id + "-" + q] === game.questions[q].correct) pts += GAME_PTS;
      }
      playerScores[s.id] = pts;
    });
    const shuffled = shuffleTeams(data.students, data.log, data.teams);
    const teamScores = {};
    (data.teams || []).forEach(t => {
      const members = shuffled.filter(s => s.teamId === t.id);
      const scores = members.map(m => playerScores[m.id] || 0).sort((a, b) => b - a);
      teamScores[t.id] = scores.slice(0, 3).reduce((sum, s) => sum + s, 0);
    });
    const maxTeamScore = Math.max(...Object.values(teamScores), 0);
    const winningTeamId = maxTeamScore > 0 ? Object.keys(teamScores).find(tid => teamScores[tid] === maxTeamScore) : null;
    if (!winningTeamId) { showMsg("No winning team"); return; }
    const entries = [];
    const winMembers = shuffled.filter(s => s.teamId === winningTeamId);
    winMembers.forEach(m => { entries.push({ id: genId(), studentId: m.id, amount: 10, source: "Team Win Wk" + w, ts: Date.now() }); });
    const weeklyWins = { ...(data.weeklyTeamWins || {}), [w]: winningTeamId };
    const updated = { ...data, log: [...data.log, ...entries], weeklyTeamWins: weeklyWins };
    await saveData(updated); setData(updated);
    const winName = (data.teams || []).find(t => t.id === winningTeamId)?.name || "Unknown";
    showMsg("Team bonus: " + winName + " (+10 each)");
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
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...tot, phase: "live", currentQ: 0, lockedQs: [], countdown: null, active: true, scored: false } } };
    await saveData(updated); setData(updated); showMsg("This or That is LIVE");
  };

  const scoreToT = async (w) => {
    const tot = tots[w]; if (!tot) return;
    const ptsEach = tot.questions.length > 0 ? 20 / tot.questions.length : 20;
    const entries = [];
    const playerScores = {};
    data.students.forEach(s => {
      let pts = 0;
      tot.questions.forEach((q, qi) => {
        if (tot.responses?.[s.id + "-" + qi] === q.correct) pts += ptsEach;
      });
      const rounded = Math.round(pts * 10) / 10;
      playerScores[s.id] = rounded;
    });
    const rebounds = data.rebounds || {};
    const rKey = "tot-" + w;
    const originalTs = rebounds[rKey]?.scoredTs || Date.now();
    const source = "ToT Wk" + w;
    const existingEntries = data.log.filter(e => e.source === source);
    data.students.forEach(s => {
      const pts = playerScores[s.id] || 0;
      const existing = existingEntries.find(e => e.studentId === s.id);
      if (existing && existing.amount === pts) return;
      if (pts > 0) entries.push({ id: genId(), studentId: s.id, amount: pts, source, ts: originalTs });
    });
    const cleanLog = data.log.filter(e => !(e.source === source && entries.find(n => n.studentId === e.studentId)));
    const newRebounds = { ...rebounds, [rKey]: { ...(rebounds[rKey] || {}), scoredTs: originalTs } };
    const updated = { ...data, weeklyToT: { ...tots, [w]: { ...tot, scored: true, active: false, phase: "done" } }, log: [...cleanLog, ...entries], rebounds: newRebounds };
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
      return <LiveActivityAdmin type="game" week={week} data={data} setData={setData} onBack={() => setWeek(null)} onScore={() => scoreGame(week)} onTeamBonus={() => applyTeamBonus(week)} msg={msg} showMsg={showMsg} />;
    }
    return (
      <div>
        <GameEditor week={week} initial={existing?.questions || emptyGame()} scored={isDone} onSave={qs => saveGame(week, qs)} onGoLive={() => goLiveGame(week)} onDelete={() => { if (window.confirm("Delete game week " + week + "?")) deleteGame(week); }} onBack={() => setWeek(null)} msg={msg} />
        {isDone && <ReviewAnswers type="game" week={week} data={data} setData={setData} />}
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
        {isDone && <ReviewAnswers type="tot" week={week} data={data} setData={setData} />}
        {isDone && <div style={{ padding: "0 20px 40px" }}><div style={{ maxWidth: 600, margin: "0 auto" }}><ReboundPanel data={data} setData={setData} activityType="tot" week={week} isAdmin={true} userName="Andrew Ishak" /></div></div>}
      </div>
    );
  }

  // Trivia: route to setup view when one is selected
  if (triviaId !== null && mode === "trivia") {
    const game = triviaGames[triviaId];
    if (!game) { setTriviaId(null); return null; }
    if (game.phase === "done") {
      return (
        <TriviaFinalize
          game={game}
          students={data.students}
          data={data}
          setData={setData}
          onSave={(patch) => saveTrivia(triviaId, patch)}
          onAwardPoints={(logEntries, finalizedTs) => {
            // Append to log + flag finalized + scored
            const updated = {
              ...data,
              log: [...(data.log || []), ...logEntries],
              triviaGames: { ...triviaGames, [triviaId]: { ...game, finalizedTs, scored: true } },
            };
            saveData(updated); setData(updated);
            showMsg("Points awarded");
          }}
          onUnfinalize={() => {
            // Strip out log entries that match this trivia game, clear flags
            const tag = "Team Trivia: " + (game.title || "");
            const filteredLog = (data.log || []).filter(e => !(e.source === tag && e.triviaGameId === game.id));
            const updated = {
              ...data,
              log: filteredLog,
              triviaGames: { ...triviaGames, [triviaId]: { ...game, finalizedTs: null, scored: false } },
            };
            saveData(updated); setData(updated);
            showMsg("Unfinalized");
          }}
          onBackToLive={() => saveTrivia(triviaId, { phase: "live" })}
          onBack={() => setTriviaId(null)}
          msg={msg} showMsg={showMsg}
        />
      );
    }
    if (game.phase === "live") {
      return (
        <TriviaLiveAdmin
          game={game}
          students={data.students}
          data={data}
          setData={setData}
          onSave={(patch) => saveTrivia(triviaId, patch)}
          onBack={() => setTriviaId(null)}
          onBackToSetup={() => {
            if (!window.confirm("Return to Setup? This clears all opened/locked/revealed questions and answers, but keeps your questions and teams.")) return;
            saveTrivia(triviaId, { phase: "setup", openQs: [], lockedQs: [], revealedQs: [], answers: {} });
          }}
          onFinalize={() => saveTrivia(triviaId, { phase: "done" })}
          onEndGameAndPool={() => {
            // End game early. Auto-reveal any locked rounds. Send any open OR never-opened questions to the shared pool.
            const questions = game.questions || [];
            const openQs = game.openQs || [];
            const lockedQs = game.lockedQs || [];
            const revealedQs = game.revealedQs || [];
            const touchedSet = new Set([...openQs, ...lockedQs, ...revealedQs]);
            const unopenedIdxs = questions.map((_, i) => i).filter(i => !touchedSet.has(i));
            // Questions to bank: open + unopened (NOT locked — those got graded and will be revealed)
            const toPoolIdxs = [...openQs, ...unopenedIdxs];
            const poolAdditions = toPoolIdxs.map(i => {
              const q = questions[i];
              return {
                id: q.id || ("q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6)),
                text: q.text || "",
                expectedAnswer: q.expectedAnswer || "",
                pointsOverride: q.pointsOverride ?? null,
                fromGameId: game.id,
                fromGameTitle: game.title || "",
                savedTs: Date.now(),
              };
            }).filter(q => q.text.trim().length > 0);
            const msg = "End game now? " + (lockedQs.length > 0 ? "Locked round will be revealed. " : "") + (poolAdditions.length > 0 ? poolAdditions.length + " unused question" + (poolAdditions.length !== 1 ? "s" : "") + " will be saved to the pool. " : "") + "You'll go to the Finalize screen.";
            if (!window.confirm(msg)) return;
            const newRevealed = [...revealedQs, ...lockedQs];
            const updatedGame = {
              ...game,
              phase: "done",
              openQs: [],
              lockedQs: [],
              revealedQs: newRevealed,
            };
            const updated = {
              ...data,
              triviaGames: { ...triviaGames, [triviaId]: updatedGame },
              triviaQuestionPool: [...(data.triviaQuestionPool || []), ...poolAdditions],
            };
            saveData(updated); setData(updated);
            showMsg(poolAdditions.length > 0 ? "Saved " + poolAdditions.length + " to pool" : "Ending game");
          }}
          msg={msg} showMsg={showMsg}
        />
      );
    }
    return (
      <TriviaSetup
        game={game}
        students={data.students}
        rosterTeams={data.teams}
        pool={data.triviaQuestionPool || []}
        onPoolUpdate={(newPool) => {
          const updated = { ...data, triviaQuestionPool: newPool };
          saveData(updated); setData(updated);
        }}
        onSave={(patch) => saveTrivia(triviaId, patch)}
        onDelete={() => deleteTrivia(triviaId)}
        onBack={() => setTriviaId(null)}
        msg={msg} showMsg={showMsg}
      />
    );
  }

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 12 }}>Game Manager</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setMode("game")} style={mode === "game" ? pillActive : pillInactive}>Weekly Game</button>
          <button onClick={() => setMode("tot")} style={mode === "tot" ? pillActive : pillInactive}>This or That</button>
          <button onClick={() => setMode("fishbowl")} style={mode === "fishbowl" ? pillActive : pillInactive}>Fishbowl</button>
          <button onClick={() => setMode("trivia")} style={mode === "trivia" ? pillActive : pillInactive}>Team Trivia</button>
        </div>

        {mode === "trivia" ? (
          <div>
            <button onClick={createTrivia} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "10px 16px", marginBottom: 12 }}>+ New Trivia Game</button>
            {Object.values(triviaGames).length === 0 && (
              <div style={{ ...crd, padding: 24, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No trivia games yet. Create one above.</div>
            )}
            {Object.values(triviaGames).sort((a, b) => b.ts - a.ts).map(g => {
              const numQs = (g.questions || []).length;
              const numTeams = (g.teams || []).length;
              const phaseLabel = g.scored ? "Done" : g.phase === "live" ? "LIVE" : "Setup";
              const phaseColor = g.scored ? GREEN : g.phase === "live" ? "#d97706" : ACCENT;
              return (
                <button key={g.id} onClick={() => setTriviaId(g.id)} style={{
                  ...crd, width: "100%", textAlign: "left", padding: 14, marginBottom: 8, cursor: "pointer",
                  border: "2px solid " + phaseColor,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>{g.title || "Untitled"}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{numQs} question{numQs !== 1 ? "s" : ""} · {numTeams} team{numTeams !== 1 ? "s" : ""}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: phaseColor, padding: "3px 8px", borderRadius: 6, background: phaseColor + "15", textTransform: "uppercase", letterSpacing: "0.05em" }}>{phaseLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

/* ─── TEAM TRIVIA: SETUP VIEW ─────────────────────────────────────────
   Admin builds questions + drag-drop teams + sitting-out list.
   Phase progression:
     setup → live (admin clicks Go Live) → done (admin clicks Finalize)
*/
function TriviaSetup({ game, students, rosterTeams, pool, onPoolUpdate, onSave, onDelete, onBack, msg, showMsg }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const [dragSrc, setDragSrc] = useState(null);
  const [showPool, setShowPool] = useState(false);
  const [poolSelection, setPoolSelection] = useState(new Set());

  const poolList = pool || [];
  const importSelected = () => {
    if (poolSelection.size === 0) { showMsg("Nothing selected"); return; }
    const picked = poolList.filter(p => poolSelection.has(p.id));
    const existingQs = game.questions || [];
    // Add picked questions to the game; assign fresh ids so they're independent of the pool entries
    const newQs = picked.map(p => ({
      id: "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      text: p.text || "",
      expectedAnswer: p.expectedAnswer || "",
      pointsOverride: p.pointsOverride ?? null,
    }));
    onSave({ questions: [...existingQs, ...newQs] });
    // Remove from pool
    const remaining = poolList.filter(p => !poolSelection.has(p.id));
    onPoolUpdate(remaining);
    setPoolSelection(new Set());
    showMsg("Imported " + picked.length + " from pool");
  };
  const togglePoolItem = (id) => {
    setPoolSelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const deletePoolItem = (id) => {
    if (!window.confirm("Delete this question from the pool? It will not be recoverable.")) return;
    onPoolUpdate(poolList.filter(p => p.id !== id));
    setPoolSelection(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const questions = game.questions || [];
  const teams = game.teams || [];
  const sittingOut = game.sittingOut || [];
  const eligibleStudents = students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis");
  const studentById = (id) => eligibleStudents.find(s => s.id === id);

  // Compute unassigned: students not in any team and not sitting out
  const inAnyTeam = new Set();
  teams.forEach(t => (t.memberIds || []).forEach(id => inAnyTeam.add(id)));
  const sittingSet = new Set(sittingOut);
  const unassigned = eligibleStudents.filter(s => !inAnyTeam.has(s.id) && !sittingSet.has(s.id)).map(s => s.id);

  const TEAM_PALETTE = [
    { bg: "#fef2f2", accent: "#dc2626" },
    { bg: "#eff6ff", accent: "#2563eb" },
    { bg: "#ecfdf5", accent: "#059669" },
    { bg: "#fffbeb", accent: "#d97706" },
    { bg: "#f5f3ff", accent: "#7c3aed" },
    { bg: "#ecfeff", accent: "#0891b2" },
    { bg: "#fdf2f8", accent: "#db2777" },
    { bg: "#f7fee7", accent: "#65a30d" },
  ];

  // Question helpers — operate on full questions array
  const addQ = () => {
    const newQ = { id: "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), text: "", expectedAnswer: "", pointsOverride: null };
    onSave({ questions: [...questions, newQ] });
  };
  const updateQ = (idx, patch) => {
    const next = questions.map((q, i) => i === idx ? { ...q, ...patch } : q);
    onSave({ questions: next });
  };
  const removeQ = (idx) => {
    if (!window.confirm("Delete question " + (idx + 1) + "?")) return;
    onSave({ questions: questions.filter((_, i) => i !== idx) });
  };

  // Team helpers
  const addTeam = () => {
    const usedIdxs = new Set(teams.map(t => t.colorIdx));
    let colorIdx = 0;
    while (usedIdxs.has(colorIdx) && colorIdx < TEAM_PALETTE.length) colorIdx++;
    if (colorIdx >= TEAM_PALETTE.length) colorIdx = teams.length % TEAM_PALETTE.length;
    const newTeam = {
      id: "team_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: "Team " + (teams.length + 1),
      colorIdx,
      memberIds: [],
    };
    onSave({ teams: [...teams, newTeam] });
  };
  const renameTeam = (id, name) => onSave({ teams: teams.map(t => t.id === id ? { ...t, name } : t) });
  const removeTeam = (id) => {
    if (!window.confirm("Remove this team? Members go back to Sitting Out.")) return;
    const team = teams.find(t => t.id === id);
    const memberIds = team?.memberIds || [];
    onSave({
      teams: teams.filter(t => t.id !== id),
      sittingOut: [...sittingOut, ...memberIds.filter(mid => !sittingOut.includes(mid))],
    });
  };
  const cycleTeamColor = (id) => {
    onSave({ teams: teams.map(t => t.id === id ? { ...t, colorIdx: ((t.colorIdx || 0) + 1) % TEAM_PALETTE.length } : t) });
  };

  // Drag and drop
  const onDragStart = (studentId, sourceType, sourceId) => (e) => {
    setDragSrc({ studentId, sourceType, sourceId });
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", studentId); } catch(_) {}
  };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const moveStudent = (studentId, sourceType, sourceId, destType, destId) => {
    if (sourceType === destType && sourceId === destId) return;
    let newSitting = [...sittingOut];
    let newTeams = teams.map(t => ({ ...t, memberIds: [...(t.memberIds || [])] }));

    if (sourceType === "sitting") newSitting = newSitting.filter(id => id !== studentId);
    else if (sourceType === "team") {
      const t = newTeams.find(t => t.id === sourceId);
      if (t) t.memberIds = t.memberIds.filter(id => id !== studentId);
    }
    if (sourceType === "unassigned") {
      newSitting = newSitting.filter(id => id !== studentId);
      newTeams.forEach(t => { t.memberIds = t.memberIds.filter(id => id !== studentId); });
    }

    if (destType === "sitting") {
      if (!newSitting.includes(studentId)) newSitting.push(studentId);
    } else if (destType === "team") {
      const t = newTeams.find(t => t.id === destId);
      if (t && !t.memberIds.includes(studentId)) t.memberIds.push(studentId);
    }

    onSave({ sittingOut: newSitting, teams: newTeams });
  };
  const onDrop = (destType, destId) => (e) => {
    e.preventDefault();
    if (!dragSrc) return;
    moveStudent(dragSrc.studentId, dragSrc.sourceType, dragSrc.sourceId, destType, destId);
    setDragSrc(null);
  };

  // Auto-distribute: drains BOTH unassigned AND Sitting Out into teams (round-robin).
  const autoDistribute = () => {
    if (teams.length === 0) { showMsg("Add at least one team first"); return; }
    const pool = [...unassigned, ...sittingOut];
    if (pool.length === 0) { showMsg("Nobody to distribute"); return; }
    if (!window.confirm("Distribute " + pool.length + " student" + (pool.length !== 1 ? "s" : "") + " (Sitting Out + Unassigned) evenly across teams?")) return;
    const newTeams = teams.map(t => ({ ...t, memberIds: [...(t.memberIds || [])] }));
    let ti = 0;
    pool.forEach(sid => {
      newTeams[ti].memberIds.push(sid);
      ti = (ti + 1) % newTeams.length;
    });
    onSave({ teams: newTeams, sittingOut: [] });
  };

  // Import roster teams: create a trivia team for each project team in data.teams,
  // pre-populated from each student's teamId field. Existing trivia teams are replaced.
  const importFromRoster = () => {
    if (!rosterTeams || rosterTeams.length === 0) { showMsg("No roster teams found"); return; }
    if (teams.length > 0 && !window.confirm("Replace existing trivia teams with roster teams?")) return;
    const newTeams = rosterTeams.map(rt => {
      const memberIds = eligibleStudents.filter(s => s.teamId === rt.id).map(s => s.id);
      return {
        id: "team_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        name: rt.name,
        colorIdx: (rt.colorIdx !== undefined && rt.colorIdx !== null) ? rt.colorIdx : 0,
        memberIds,
      };
    }).filter(t => t.memberIds.length > 0);
    // Sitting Out becomes anyone not in a roster team
    const inSomeTeam = new Set();
    newTeams.forEach(t => t.memberIds.forEach(id => inSomeTeam.add(id)));
    const newSitting = eligibleStudents.filter(s => !inSomeTeam.has(s.id)).map(s => s.id);
    onSave({ teams: newTeams, sittingOut: newSitting });
    showMsg("Imported " + newTeams.length + " team" + (newTeams.length !== 1 ? "s" : "") + " from roster");
  };

  const allInSittingOut = () => {
    if (!window.confirm("Reset everyone to Sitting Out?")) return;
    onSave({ sittingOut: eligibleStudents.map(s => s.id), teams: teams.map(t => ({ ...t, memberIds: [] })) });
  };

  // Validation for Go Live
  const teamsWithMembers = teams.filter(t => (t.memberIds || []).length > 0);
  const canGoLive = questions.length > 0 && teamsWithMembers.length >= 2 && questions.every(q => (q.text || "").trim().length > 0);
  const goLive = async () => {
    if (!canGoLive) {
      showMsg("Need at least 2 teams with members and all questions filled");
      return;
    }
    if (!window.confirm("Go live with this trivia? Teams will see open questions immediately.")) return;
    await onSave({ phase: "live", openQs: [], lockedQs: [], revealedQs: [], answers: {} });
    showMsg("Trivia is LIVE");
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <button onClick={onBack} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>

        {/* Title + global settings */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>Trivia Game</div>
          <TitlePtsEditor
            initialTitle={game.title || ""}
            initialPts={game.defaultPointsPerQ || 5}
            onSaveTitle={(t) => onSave({ title: t.trim() || "Untitled Trivia" })}
            onSavePts={(n) => onSave({ defaultPointsPerQ: n })}
          />
        </div>

        {/* Questions */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
            <div style={{ ...sectionLabel }}>Questions ({questions.length})</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setShowPool(!showPool)} style={{ ...pillInactive, fontSize: 11, padding: "5px 10px" }}>{showPool ? "Hide" : "View"} pool ({poolList.length})</button>
              <button onClick={addQ} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12, padding: "5px 12px" }}>+ Add Question</button>
            </div>
          </div>

          {/* Pool panel */}
          {showPool && (
            <div style={{ background: "#fafaf9", border: "1.5px dashed " + BORDER, borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>Question Pool</div>
                {poolSelection.size > 0 && (
                  <button onClick={importSelected} style={{ ...pill, background: GREEN, color: "#fff", fontSize: 11, padding: "4px 10px" }}>Import {poolSelection.size} selected</button>
                )}
              </div>
              {poolList.length === 0 && <div style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>Pool is empty. Questions saved from "End Game & Finalize Now" will appear here.</div>}
              {poolList.map(p => {
                const selected = poolSelection.has(p.id);
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, background: selected ? "#ecfdf5" : "#fff", border: "1px solid " + (selected ? GREEN : BORDER), borderRadius: 8, marginBottom: 4 }}>
                    <input type="checkbox" checked={selected} onChange={() => togglePoolItem(p.id)} style={{ cursor: "pointer" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{p.text}</div>
                      {p.fromGameTitle && <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>from "{p.fromGameTitle}"</div>}
                    </div>
                    <button onClick={() => deletePoolItem(p.id)} title="Delete from pool" style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 10, padding: "3px 7px" }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}

          {questions.length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic" }}>No questions yet.</div>}
          {questions.map((q, i) => (
            <QuestionRow
              key={q.id}
              idx={i} question={q}
              defaultPts={game.defaultPointsPerQ || 5}
              onUpdate={(patch) => updateQ(i, patch)}
              onRemove={() => removeQ(i)}
            />
          ))}
        </div>

        {/* Team builder */}
        <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
            <div style={{ ...sectionLabel }}>Teams ({teams.length})</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={importFromRoster} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Import from roster</button>
              <button onClick={autoDistribute} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Auto-distribute</button>
              <button onClick={allInSittingOut} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Reset</button>
              <button onClick={addTeam} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12, padding: "5px 12px" }}>+ Add Team</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 10 }}>Drag students between Sitting Out and team boxes. Anyone in Sitting Out won&apos;t answer this round.</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {/* Sitting Out column */}
            <div
              onDragOver={onDragOver} onDrop={onDrop("sitting", null)}
              style={{ background: "#f9fafb", border: "2px dashed " + BORDER, borderRadius: 10, padding: 10, minHeight: 120 }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Sitting Out ({sittingOut.length})</div>
              {sittingOut.map(sid => {
                const s = studentById(sid); if (!s) return null;
                return (
                  <div
                    key={sid} draggable
                    onDragStart={onDragStart(sid, "sitting", null)}
                    style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 8, padding: "6px 10px", marginBottom: 4, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, cursor: "grab" }}
                  >{s.name}</div>
                );
              })}
              {unassigned.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: AMBER, marginTop: 8, marginBottom: 4, textTransform: "uppercase" }}>Unassigned ({unassigned.length})</div>
                  {unassigned.map(sid => {
                    const s = studentById(sid); if (!s) return null;
                    return (
                      <div
                        key={sid} draggable
                        onDragStart={onDragStart(sid, "unassigned", null)}
                        style={{ background: "#fffbeb", border: "1px solid " + AMBER, borderRadius: 8, padding: "6px 10px", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "#92400e", cursor: "grab" }}
                      >{s.name}</div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Team columns */}
            {teams.map(t => {
              const palette = TEAM_PALETTE[(t.colorIdx || 0) % TEAM_PALETTE.length];
              return (
                <div
                  key={t.id} onDragOver={onDragOver} onDrop={onDrop("team", t.id)}
                  style={{ background: palette.bg, border: "2px solid " + palette.accent, borderRadius: 10, padding: 10, minHeight: 120 }}
                >
                  <TeamHeader
                    team={t}
                    accent={palette.accent}
                    onRename={(name) => renameTeam(t.id, name)}
                    onCycleColor={() => cycleTeamColor(t.id)}
                    onRemove={() => removeTeam(t.id)}
                  />
                  <div style={{ fontSize: 10, fontWeight: 700, color: palette.accent, marginBottom: 6, textTransform: "uppercase" }}>{(t.memberIds || []).length} member{(t.memberIds || []).length !== 1 ? "s" : ""}</div>
                  {(t.memberIds || []).map(sid => {
                    const s = studentById(sid); if (!s) return null;
                    return (
                      <div
                        key={sid} draggable
                        onDragStart={onDragStart(sid, "team", t.id)}
                        style={{ background: "#fff", border: "1px solid " + palette.accent, borderRadius: 8, padding: "6px 10px", marginBottom: 4, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, cursor: "grab" }}
                      >{s.name}</div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={goLive} disabled={!canGoLive} style={{
            ...pill, padding: "12px 20px",
            background: canGoLive ? GREEN : "#e4e4e7",
            color: canGoLive ? "#fff" : TEXT_MUTED, cursor: canGoLive ? "pointer" : "not-allowed",
            flex: 1, fontSize: 14, fontWeight: 700,
          }}>Go Live</button>
          <button onClick={() => { if (window.confirm("Delete this trivia game?")) onDelete(); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
        </div>
        {!canGoLive && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 8, textAlign: "center" }}>Need at least 2 teams with members, plus all questions filled in.</div>}
      </div>
    </div>
  );
}

// ─── Subcomponents that hold local state for inputs ──────────────────────
// React inputs lose focus / cursor position when the parent re-renders on
// every keystroke (because parent saves to storage on every onChange).
// These components keep input state local and only push it up on blur.

function TitlePtsEditor({ initialTitle, initialPts, onSaveTitle, onSavePts }) {
  const [title, setTitle] = useState(initialTitle);
  const [pts, setPts] = useState(initialPts);
  return (
    <>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={() => onSaveTitle(title)}
        placeholder="Title (e.g. Methods Trivia Round 1)"
        style={{ ...inp, fontSize: 16, fontWeight: 700, marginBottom: 10 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 600 }}>Default points per correct answer:</label>
        <input
          type="number" min={0}
          value={pts}
          onChange={e => setPts(e.target.value)}
          onBlur={() => onSavePts(parseInt(pts) || 0)}
          style={{ ...inp, width: 70, textAlign: "center" }}
        />
      </div>
    </>
  );
}

function QuestionRow({ idx, question, defaultPts, onUpdate, onRemove }) {
  const [text, setText] = useState(question.text || "");
  const [expectedAnswer, setExpectedAnswer] = useState(question.expectedAnswer || "");
  const [pts, setPts] = useState(question.pointsOverride === null || question.pointsOverride === undefined ? "" : question.pointsOverride);
  return (
    <div style={{ padding: 12, borderRadius: 10, border: "1px solid " + BORDER, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED }}>Q{idx + 1}</span>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => onUpdate({ text })}
          placeholder="Question text"
          style={{ ...inp, flex: 1 }}
        />
        <button onClick={onRemove} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 8px" }}>✕</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={expectedAnswer}
          onChange={e => setExpectedAnswer(e.target.value)}
          onBlur={() => onUpdate({ expectedAnswer })}
          placeholder="Expected answer (admin reference, optional)"
          style={{ ...inp, flex: 1, fontSize: 12, color: TEXT_SECONDARY }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: TEXT_MUTED }}>pts:</span>
          <input
            type="number" min={0}
            value={pts}
            onChange={e => setPts(e.target.value)}
            onBlur={() => onUpdate({ pointsOverride: pts === "" ? null : parseInt(pts) || 0 })}
            placeholder={String(defaultPts)}
            style={{ ...inp, width: 56, textAlign: "center", fontSize: 12 }}
          />
        </div>
      </div>
    </div>
  );
}

function TeamHeader({ team, accent, onRename, onCycleColor, onRemove }) {
  const [name, setName] = useState(team.name);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={() => onRename(name)}
        style={{ ...inp, fontSize: 13, fontWeight: 800, color: accent, padding: "4px 6px", flex: 1, background: "#fff" }}
      />
      <button onClick={onCycleColor} title="Cycle color" style={{ ...pillInactive, padding: "4px 8px", fontSize: 10 }}>🎨</button>
      <button onClick={onRemove} style={{ ...pill, background: "#fff", color: RED, fontSize: 10, padding: "4px 8px", border: "1px solid " + BORDER }}>✕</button>
    </div>
  );
}

/* ─── TEAM TRIVIA: LIVE ADMIN VIEW ─────────────────────────────────────
   Admin runs the trivia game.
   Flow: pick 1-4 questions to open → teams answer → admin locks the round
   → admin grades each team's answer ✓/✗ → admin reveals (students see
   results grid) → admin opens next round.
   When all questions are revealed, "Finalize" button enables (step 4).
*/
function TriviaLiveAdmin({ game, students, data, setData, onSave, onBack, onBackToSetup, onFinalize, onEndGameAndPool, msg, showMsg }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);

  const TEAM_PALETTE = [
    { bg: "#fef2f2", accent: "#dc2626" },
    { bg: "#eff6ff", accent: "#2563eb" },
    { bg: "#ecfdf5", accent: "#059669" },
    { bg: "#fffbeb", accent: "#d97706" },
    { bg: "#f5f3ff", accent: "#7c3aed" },
    { bg: "#ecfeff", accent: "#0891b2" },
    { bg: "#fdf2f8", accent: "#db2777" },
    { bg: "#f7fee7", accent: "#65a30d" },
  ];

  const questions = game.questions || [];
  const teams = game.teams || [];
  const openQs = game.openQs || [];
  const lockedQs = game.lockedQs || [];
  const revealedQs = game.revealedQs || [];
  const answers = game.answers || {};
  const defaultPts = game.defaultPointsPerQ || 5;

  // A question is "in progress" if open or locked but not revealed
  const inProgressQs = [...openQs, ...lockedQs];
  // Eligible to be picked next: not currently in progress and not revealed
  const usedSet = new Set([...inProgressQs, ...revealedQs]);
  const availableQs = questions.map((q, idx) => ({ q, idx })).filter(({ idx }) => !usedSet.has(idx));

  // Selection for next round
  const [selectedQs, setSelectedQs] = useState([]);
  const toggleSelect = (idx) => {
    setSelectedQs(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      if (prev.length >= 4) { showMsg("Max 4 questions per round"); return prev; }
      return [...prev, idx];
    });
  };

  // Read-only auto-refresh from Supabase. Calls setData directly (never onSave)
  // so admin edits to teams/questions can never be clobbered. Updates the
  // entire data blob whenever Supabase has a different snapshot.
  React.useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const raw = await window.storage.get("comm4-v1", true);
        if (raw?.value) {
          const d = JSON.parse(raw.value);
          // Cheap shallow-ish check: only update if the trivia game's
          // serialized snapshot differs.
          const cur = data?.triviaGames?.[game.id];
          const fresh = d?.triviaGames?.[game.id];
          if (JSON.stringify(cur) !== JSON.stringify(fresh)) {
            setData(d);
          }
        }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(iv);
    // eslint-disable-next-line
  }, [game.id]);

  // Open the selected round
  const openRound = () => {
    if (selectedQs.length === 0) { showMsg("Select at least one question"); return; }
    onSave({ openQs: [...openQs, ...selectedQs] });
    setSelectedQs([]);
    showMsg("Round opened — teams can now answer");
  };

  // Lock all currently open questions
  const lockRound = () => {
    if (openQs.length === 0) return;
    if (!window.confirm("Lock these " + openQs.length + " question" + (openQs.length !== 1 ? "s" : "") + "? Teams won't be able to change answers.")) return;
    onSave({ openQs: [], lockedQs: [...lockedQs, ...openQs] });
    showMsg("Locked");
  };

  // Reveal all currently locked questions
  const revealRound = () => {
    if (lockedQs.length === 0) return;
    // Check that every locked question has every team's answer graded
    const allGraded = lockedQs.every(qi => teams.every(t => {
      const a = answers[t.id + "-" + qi];
      return a && (a.gradedCorrect === true || a.gradedCorrect === false);
    }));
    if (!allGraded) {
      if (!window.confirm("Some answers haven't been graded yet. Reveal anyway?")) return;
    }
    onSave({ lockedQs: [], revealedQs: [...revealedQs, ...lockedQs] });
    showMsg("Revealed");
  };

  // Grade an answer
  const gradeAnswer = (teamId, qIdx, correct) => {
    const key = teamId + "-" + qIdx;
    const a = answers[key] || { text: "", ts: 0 };
    onSave({ answers: { ...answers, [key]: { ...a, gradedCorrect: correct } } });
  };

  // Compute running team totals based on revealed questions PLUS any admin
  // bonus points stored at game.bonusPoints.teams[teamId].
  const teamBonus = (teamId) => {
    const b = (game.bonusPoints?.teams || {})[teamId];
    return typeof b === "number" ? b : 0;
  };
  const teamRunningTotal = (teamId) => {
    let total = teamBonus(teamId);
    revealedQs.forEach(qi => {
      const key = teamId + "-" + qi;
      const a = answers[key];
      if (a && a.gradedCorrect === true) {
        const q = questions[qi];
        const pts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
        total += pts;
      }
    });
    return total;
  };

  const setTeamBonus = (teamId, value) => {
    const newBonusPoints = {
      ...(game.bonusPoints || { teams: {}, students: {} }),
      teams: { ...((game.bonusPoints || {}).teams || {}), [teamId]: value },
    };
    onSave({ bonusPoints: newBonusPoints });
  };

  const teamColor = (t) => TEAM_PALETTE[(t.colorIdx || 0) % TEAM_PALETTE.length];

  // Sort teams by running total descending for display
  const sortedTeams = [...teams].sort((a, b) => teamRunningTotal(b.id) - teamRunningTotal(a.id));

  // Are we ready to finalize?
  const allDone = revealedQs.length === questions.length && questions.length > 0;

  // ─── EDITING (mid-game): questions + teams panels ───
  const [editQuestionsOpen, setEditQuestionsOpen] = useState(false);
  const [editTeamsOpen, setEditTeamsOpen] = useState(false);
  const [editDragSrc, setEditDragSrc] = useState(null);

  // Question edit handlers
  const addQ = () => {
    const newQ = { id: "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), text: "", expectedAnswer: "", pointsOverride: null };
    onSave({ questions: [...questions, newQ] });
  };
  const updateQ = (idx, patch) => {
    const next = questions.map((q, i) => i === idx ? { ...q, ...patch } : q);
    onSave({ questions: next });
  };
  // Touched = locked or revealed; only allow delete on untouched questions to avoid orphaned answers
  const isQTouched = (idx) => lockedQs.includes(idx) || revealedQs.includes(idx) || openQs.includes(idx);
  const removeQ = (idx) => {
    if (isQTouched(idx)) { showMsg("Can't delete a question that's been opened or revealed"); return; }
    if (!window.confirm("Delete question " + (idx + 1) + "?")) return;
    // Re-index: shift openQs/lockedQs/revealedQs and answer keys for higher-index questions
    const next = questions.filter((_, i) => i !== idx);
    const shift = (arr) => arr.filter(i => i !== idx).map(i => i > idx ? i - 1 : i);
    const newAnswers = {};
    Object.entries(answers).forEach(([k, v]) => {
      const [tid, qiStr] = k.split("-");
      const qi = parseInt(qiStr);
      if (qi === idx) return; // drop
      const newQi = qi > idx ? qi - 1 : qi;
      newAnswers[tid + "-" + newQi] = v;
    });
    onSave({ questions: next, openQs: shift(openQs), lockedQs: shift(lockedQs), revealedQs: shift(revealedQs), answers: newAnswers });
  };

  // Team edit handlers
  const addTeam = () => {
    const usedIdxs = new Set(teams.map(t => t.colorIdx));
    let colorIdx = 0;
    while (usedIdxs.has(colorIdx) && colorIdx < TEAM_PALETTE.length) colorIdx++;
    if (colorIdx >= TEAM_PALETTE.length) colorIdx = teams.length % TEAM_PALETTE.length;
    const newTeam = {
      id: "team_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: "Team " + (teams.length + 1),
      colorIdx, memberIds: [],
    };
    onSave({ teams: [...teams, newTeam] });
  };
  const renameTeam = (id, name) => onSave({ teams: teams.map(t => t.id === id ? { ...t, name } : t) });
  const cycleTeamColor = (id) => onSave({ teams: teams.map(t => t.id === id ? { ...t, colorIdx: ((t.colorIdx || 0) + 1) % TEAM_PALETTE.length } : t) });
  const removeTeam = (id) => {
    if (!window.confirm("Remove this team mid-game? Members go back to Sitting Out. Past answers are kept but become orphaned.")) return;
    const team = teams.find(t => t.id === id);
    const memberIds = team?.memberIds || [];
    const sittingOut = game.sittingOut || [];
    onSave({
      teams: teams.filter(t => t.id !== id),
      sittingOut: [...sittingOut, ...memberIds.filter(mid => !sittingOut.includes(mid))],
    });
  };

  // Drag/drop for mid-game team editing
  const eligibleStudents = students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis");
  const studentById = (id) => eligibleStudents.find(s => s.id === id);
  const sittingOut = game.sittingOut || [];
  const inAnyTeamSet = new Set();
  teams.forEach(t => (t.memberIds || []).forEach(id => inAnyTeamSet.add(id)));
  const sittingSet = new Set(sittingOut);
  const unassigned = eligibleStudents.filter(s => !inAnyTeamSet.has(s.id) && !sittingSet.has(s.id)).map(s => s.id);

  const onEditDragStart = (studentId, sourceType, sourceId) => (e) => {
    setEditDragSrc({ studentId, sourceType, sourceId });
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", studentId); } catch(_) {}
  };
  const onEditDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const moveStudent = (studentId, sourceType, sourceId, destType, destId) => {
    if (sourceType === destType && sourceId === destId) return;
    let newSitting = [...sittingOut];
    let newTeams = teams.map(t => ({ ...t, memberIds: [...(t.memberIds || [])] }));
    if (sourceType === "sitting") newSitting = newSitting.filter(id => id !== studentId);
    else if (sourceType === "team") {
      const t = newTeams.find(t => t.id === sourceId);
      if (t) t.memberIds = t.memberIds.filter(id => id !== studentId);
    } else if (sourceType === "unassigned") {
      newSitting = newSitting.filter(id => id !== studentId);
      newTeams.forEach(t => { t.memberIds = t.memberIds.filter(id => id !== studentId); });
    }
    if (destType === "sitting") {
      if (!newSitting.includes(studentId)) newSitting.push(studentId);
    } else if (destType === "team") {
      const t = newTeams.find(t => t.id === destId);
      if (t && !t.memberIds.includes(studentId)) t.memberIds.push(studentId);
    }
    onSave({ sittingOut: newSitting, teams: newTeams });
  };
  const onEditDrop = (destType, destId) => (e) => {
    e.preventDefault();
    if (!editDragSrc) return;
    moveStudent(editDragSrc.studentId, editDragSrc.sourceType, editDragSrc.sourceId, destType, destId);
    setEditDragSrc(null);
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={onBack} style={pillInactive}>Back</button>
            {onBackToSetup && <button onClick={onBackToSetup} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>← Back to Setup</button>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", padding: "3px 10px", borderRadius: 6, background: "#fffbeb", textTransform: "uppercase", letterSpacing: "0.05em" }}>LIVE</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{game.title}</span>
          </div>
        </div>

        {/* Edit panels (collapsed by default) */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <button onClick={() => setEditQuestionsOpen(!editQuestionsOpen)} style={editQuestionsOpen ? pillActive : pillInactive}>
            {editQuestionsOpen ? "Close Questions" : "Edit Questions"}
          </button>
          <button onClick={() => setEditTeamsOpen(!editTeamsOpen)} style={editTeamsOpen ? pillActive : pillInactive}>
            {editTeamsOpen ? "Close Teams" : "Edit Teams"}
          </button>
        </div>

        {/* Edit Questions panel */}
        {editQuestionsOpen && (
          <div style={{ ...crd, padding: 16, marginBottom: 16, border: "2px solid " + ACCENT }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ ...sectionLabel }}>Questions ({questions.length})</div>
              <button onClick={addQ} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12, padding: "5px 12px" }}>+ Add Question</button>
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 10 }}>Edit any question text or expected answer at any time. Questions that have been opened, locked, or revealed can&apos;t be deleted.</div>
            {questions.map((q, i) => {
              const touched = isQTouched(i);
              const status = revealedQs.includes(i) ? "REVEALED" : lockedQs.includes(i) ? "LOCKED" : openQs.includes(i) ? "OPEN" : "AVAILABLE";
              const statusColor = status === "REVEALED" ? GREEN : status === "LOCKED" ? "#d97706" : status === "OPEN" ? "#2563eb" : TEXT_MUTED;
              return (
                <div key={q.id} style={{ marginBottom: 8, position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: statusColor, background: statusColor + "15", padding: "2px 6px", borderRadius: 4 }}>{status}</span>
                    {touched && <span style={{ fontSize: 10, color: TEXT_MUTED, fontStyle: "italic" }}>(can&apos;t delete — already used)</span>}
                  </div>
                  <QuestionRow
                    idx={i} question={q} defaultPts={defaultPts}
                    onUpdate={(patch) => updateQ(i, patch)}
                    onRemove={() => removeQ(i)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Edit Teams panel */}
        {editTeamsOpen && (
          <div style={{ ...crd, padding: 16, marginBottom: 16, border: "2px solid " + ACCENT }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
              <div style={{ ...sectionLabel }}>Teams ({teams.length})</div>
              <button onClick={addTeam} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12, padding: "5px 12px" }}>+ Add Team</button>
            </div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 10 }}>Drag students between Sitting Out and team boxes. Past answers stay credited to whichever team submitted them.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {/* Sitting Out + Unassigned column */}
              <div onDragOver={onEditDragOver} onDrop={onEditDrop("sitting", null)} style={{ background: "#f9fafb", border: "2px dashed " + BORDER, borderRadius: 10, padding: 10, minHeight: 120 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Sitting Out ({sittingOut.length})</div>
                {sittingOut.map(sid => {
                  const s = studentById(sid); if (!s) return null;
                  return (
                    <div key={sid} draggable onDragStart={onEditDragStart(sid, "sitting", null)} style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 8, padding: "6px 10px", marginBottom: 4, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, cursor: "grab" }}>{s.name}</div>
                  );
                })}
                {unassigned.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 700, color: AMBER, marginTop: 8, marginBottom: 4, textTransform: "uppercase" }}>Unassigned ({unassigned.length})</div>
                    {unassigned.map(sid => {
                      const s = studentById(sid); if (!s) return null;
                      return (
                        <div key={sid} draggable onDragStart={onEditDragStart(sid, "unassigned", null)} style={{ background: "#fffbeb", border: "1px solid " + AMBER, borderRadius: 8, padding: "6px 10px", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "#92400e", cursor: "grab" }}>{s.name}</div>
                      );
                    })}
                  </>
                )}
              </div>
              {/* Team columns */}
              {teams.map(t => {
                const palette = TEAM_PALETTE[(t.colorIdx || 0) % TEAM_PALETTE.length];
                return (
                  <div key={t.id} onDragOver={onEditDragOver} onDrop={onEditDrop("team", t.id)} style={{ background: palette.bg, border: "2px solid " + palette.accent, borderRadius: 10, padding: 10, minHeight: 120 }}>
                    <TeamHeader
                      team={t} accent={palette.accent}
                      onRename={(name) => renameTeam(t.id, name)}
                      onCycleColor={() => cycleTeamColor(t.id)}
                      onRemove={() => removeTeam(t.id)}
                    />
                    <div style={{ fontSize: 10, fontWeight: 700, color: palette.accent, marginBottom: 6, textTransform: "uppercase" }}>{(t.memberIds || []).length} member{(t.memberIds || []).length !== 1 ? "s" : ""}</div>
                    {(t.memberIds || []).map(sid => {
                      const s = studentById(sid); if (!s) return null;
                      return (
                        <div key={sid} draggable onDragStart={onEditDragStart(sid, "team", t.id)} style={{ background: "#fff", border: "1px solid " + palette.accent, borderRadius: 8, padding: "6px 10px", marginBottom: 4, fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY, cursor: "grab" }}>{s.name}</div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Running standings strip */}
        <div style={{ ...crd, padding: 14, marginBottom: 16, background: "#fafafa" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
            <div style={{ ...sectionLabel }}>Standings ({revealedQs.length} of {questions.length} questions revealed)</div>
            <button
              onClick={() => {
                const url = window.location.origin + window.location.pathname + "?presenter=" + encodeURIComponent(game.id) + "&class=comm4";
                window.open(url, "trivia-presenter", "width=1280,height=800");
              }}
              style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}
            >Open Presenter →</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sortedTeams.map((t, idx) => {
              const pal = teamColor(t);
              const total = teamRunningTotal(t.id);
              const bonus = teamBonus(t.id);
              return (
                <div key={t.id} style={{ background: pal.bg, border: "2px solid " + pal.accent, borderRadius: 10, padding: "8px 12px", minWidth: 130 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: pal.accent, letterSpacing: "0.05em" }}>#{idx + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.1 }}>{t.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: pal.accent, fontVariantNumeric: "tabular-nums" }}>{total}</div>
                  <TeamBonusEditor
                    bonus={bonus}
                    accent={pal.accent}
                    onSave={(v) => setTeamBonus(t.id, v)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* In-progress questions: open or locked */}
        {inProgressQs.length > 0 && (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 6, flexWrap: "wrap" }}>
              <div style={{ ...sectionLabel }}>{openQs.length > 0 ? "Open Round" : "Locked — Grade Answers"}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {openQs.length > 0 && (
                  <button onClick={lockRound} style={{ ...pill, background: "#d97706", color: "#fff", fontSize: 12 }}>Lock {openQs.length} question{openQs.length !== 1 ? "s" : ""}</button>
                )}
                {lockedQs.length > 0 && (
                  <button onClick={revealRound} style={{ ...pill, background: GREEN, color: "#fff", fontSize: 12 }}>Reveal Round</button>
                )}
              </div>
            </div>

            {inProgressQs.map(qi => {
              const q = questions[qi];
              if (!q) return null;
              const isLocked = lockedQs.includes(qi);
              const qPts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
              return (
                <div key={qi} style={{ padding: 14, borderRadius: 10, border: "1px solid " + BORDER, marginBottom: 10, background: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED }}>Q{qi + 1} · {qPts} pt{qPts !== 1 ? "s" : ""}</div>
                    {isLocked ? (
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#d97706", background: "#fffbeb", padding: "2px 6px", borderRadius: 4 }}>LOCKED</span>
                    ) : (
                      <span style={{ fontSize: 9, fontWeight: 800, color: GREEN, background: "#ecfdf5", padding: "2px 6px", borderRadius: 4 }}>OPEN</span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 4 }}>{q.text}</div>
                  {q.expectedAnswer && (
                    <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 8, fontStyle: "italic" }}>Expected: {q.expectedAnswer}</div>
                  )}

                  {/* Team answer cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginTop: 8 }}>
                    {teams.map(t => {
                      const pal = teamColor(t);
                      const a = answers[t.id + "-" + qi];
                      const submitted = !!a && a.text;
                      const correct = a?.gradedCorrect === true;
                      const incorrect = a?.gradedCorrect === false;
                      return (
                        <div key={t.id} style={{
                          background: correct ? "#ecfdf5" : incorrect ? "#fef2f2" : pal.bg,
                          border: "2px solid " + (correct ? GREEN : incorrect ? RED : pal.accent),
                          borderRadius: 10, padding: 10,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: pal.accent, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{t.name}</div>
                          {submitted ? (
                            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6, wordBreak: "break-word" }}>{a.text}</div>
                          ) : (
                            <div style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic", marginBottom: 6 }}>Waiting for answer...</div>
                          )}
                          {isLocked && submitted && (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => gradeAnswer(t.id, qi, true)} style={{
                                flex: 1, padding: "5px 8px", borderRadius: 6,
                                background: correct ? GREEN : "#fff", color: correct ? "#fff" : GREEN,
                                border: "1.5px solid " + GREEN, cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: 13,
                              }}>✓</button>
                              <button onClick={() => gradeAnswer(t.id, qi, false)} style={{
                                flex: 1, padding: "5px 8px", borderRadius: 6,
                                background: incorrect ? RED : "#fff", color: incorrect ? "#fff" : RED,
                                border: "1.5px solid " + RED, cursor: "pointer", fontFamily: F, fontWeight: 700, fontSize: 13,
                              }}>✗</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Question picker for next round */}
        {availableQs.length > 0 && lockedQs.length === 0 && openQs.length === 0 && (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 6 }}>
              <div style={{ ...sectionLabel }}>Pick Next Round (1-4 questions)</div>
              <button onClick={openRound} disabled={selectedQs.length === 0} style={{
                ...pill, padding: "8px 16px",
                background: selectedQs.length === 0 ? "#e4e4e7" : GREEN,
                color: selectedQs.length === 0 ? TEXT_MUTED : "#fff",
                cursor: selectedQs.length === 0 ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 700,
              }}>Open {selectedQs.length} question{selectedQs.length !== 1 ? "s" : ""}</button>
            </div>
            {availableQs.map(({ q, idx }) => {
              const isSelected = selectedQs.includes(idx);
              const qPts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
              return (
                <button key={q.id} onClick={() => toggleSelect(idx)} style={{
                  width: "100%", textAlign: "left", padding: 10, borderRadius: 8, marginBottom: 6,
                  background: isSelected ? "#ecfdf5" : "#fff",
                  border: "1.5px solid " + (isSelected ? GREEN : BORDER),
                  cursor: "pointer", fontFamily: F,
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED, flexShrink: 0 }}>Q{idx + 1}</span>
                    <span style={{ fontSize: 13, color: TEXT_PRIMARY, flex: 1 }}>{q.text}</span>
                    <span style={{ fontSize: 10, color: TEXT_MUTED, flexShrink: 0 }}>{qPts} pt{qPts !== 1 ? "s" : ""}</span>
                    {isSelected && <span style={{ fontSize: 14, color: GREEN, fontWeight: 800 }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Already-revealed questions summary (collapsible) */}
        {revealedQs.length > 0 && (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 8 }}>Revealed ({revealedQs.length})</div>
            {revealedQs.map(qi => {
              const q = questions[qi];
              if (!q) return null;
              const qPts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
              return (
                <div key={qi} style={{ padding: 10, borderRadius: 8, background: "#fafafa", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED, marginBottom: 2 }}>Q{qi + 1}</div>
                  <div style={{ fontSize: 13, color: TEXT_PRIMARY, marginBottom: 6 }}>{q.text}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {teams.map(t => {
                      const pal = teamColor(t);
                      const a = answers[t.id + "-" + qi];
                      const correct = a?.gradedCorrect === true;
                      return (
                        <button key={t.id} onClick={() => gradeAnswer(t.id, qi, !correct)} title="Click to flip" style={{
                          background: correct ? "#ecfdf5" : "#fef2f2",
                          border: "1.5px solid " + (correct ? GREEN : RED),
                          borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: F,
                          fontSize: 11, fontWeight: 700, color: correct ? GREEN : RED,
                        }}>
                          {t.name}: {correct ? "+" + qPts : "0"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Finalize controls — always available */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {allDone ? (
            <button onClick={onFinalize} style={{ ...pill, padding: "12px 20px", background: TEXT_PRIMARY, color: "#fff", width: "100%", fontSize: 14, fontWeight: 700 }}>
              All questions revealed — Finalize Game
            </button>
          ) : (
            <>
              <div style={{ fontSize: 11, color: TEXT_MUTED, textAlign: "center" }}>{revealedQs.length} of {questions.length} questions revealed</div>
              <button onClick={onEndGameAndPool} style={{ ...pill, padding: "10px 16px", background: "#fff", color: TEXT_PRIMARY, border: "1.5px solid " + TEXT_PRIMARY, width: "100%", fontSize: 13, fontWeight: 700 }}>
                End Game & Finalize Now
              </button>
              <div style={{ fontSize: 11, color: TEXT_MUTED, textAlign: "center" }}>Unused questions will be saved to the pool for next time</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─── REVIEW / OVERRIDE ANSWERS ─── */
function ReviewAnswers({ type, week, data, setData }) {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const activities = type === "game" ? (data.weeklyGames || {}) : (data.weeklyToT || {});
  const activity = activities[week] || activities[String(week)];
  const wKey = activities[week] ? week : String(week);
  if (!activity || !activity.scored) return null;

  const qs = activity.questions || [];
  const students = data.students.filter(s => s.name !== "Andrew Ishak");
  const sorted = [...students].sort((a, b) => a.name.split(" ").slice(-1)[0].localeCompare(b.name.split(" ").slice(-1)[0]));

  const changeAnswer = async (studentId, qIdx, newAnswer) => {
    const key = studentId + "-" + qIdx;
    const responses = { ...(activity.responses || {}), [key]: newAnswer };
    const dataKey = type === "game" ? "weeklyGames" : "weeklyToT";
    const updated = { ...data, [dataKey]: { ...activities, [wKey]: { ...activity, responses } } };

    // Auto-rescore: remove old log entries for this activity and recalculate
    const sourcePrefix = type === "game" ? "Game Wk" + week : "ToT Wk" + week;
    const oldLog = (data.log || []).filter(e => e.source !== sourcePrefix);
    const newEntries = [];
    const updatedActivity = { ...activity, responses };

    data.students.forEach(s => {
      let pts = 0;
      if (type === "game") {
        for (let q = 0; q < qs.length; q++) {
          const ans = responses[s.id + "-" + q];
          if (ans === qs[q].correct) pts += GAME_PTS;
        }
      } else {
        const ptsEach = qs.length > 0 ? 20 / qs.length : 20;
        qs.forEach((q, qi) => {
          if (responses[s.id + "-" + qi] === q.correct) pts += ptsEach;
        });
        pts = Math.round(pts * 10) / 10;
      }
      if (pts > 0) newEntries.push({ id: genId(), studentId: s.id, amount: pts, source: sourcePrefix, ts: Date.now() });
    });

    updated.log = [...oldLog, ...newEntries];
    await saveData(updated); setData(updated); showMsg("Answer changed and rescored");
  };

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <div style={{ padding: "0 20px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {msg && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#111", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 999 }}>{msg}</div>}
        <button onClick={() => setShow(!show)} style={{ ...pillInactive, width: "100%", marginBottom: show ? 12 : 0 }}>{show ? "Hide Answer Review" : "Review / Override Answers"}</button>
        {show && (
          <div>
            {qs.map((q, qi) => (
              <div key={qi} style={{ ...crd, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: ACCENT + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: ACCENT }}>{qi + 1}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{q.text || q.prompt || "(no text)"}</div>
                </div>
                <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginBottom: 8 }}>
                  Correct: {type === "game" ? (q.options?.[q.correct] || letters[q.correct]) : (q.options?.[q.correct] || "Option " + (q.correct + 1))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {sorted.map(s => {
                    const ansKey = s.id + "-" + qi;
                    const ans = activity.responses?.[ansKey];
                    const correct = ans === q.correct;
                    const noAnswer = ans === undefined || ans === null;
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 6, background: noAnswer ? "#f9fafb" : correct ? "#ecfdf5" : "#fef2f2" }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY, flex: 1, minWidth: 0 }}>{s.name.split(" ")[0]}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: noAnswer ? TEXT_MUTED : correct ? GREEN : RED, marginRight: 4 }}>
                          {noAnswer ? "No answer" : type === "game" ? (q.options?.[ans] || letters[ans] || "?") : (q.options?.[ans] || "Option " + (ans + 1))}
                        </span>
                        <select value={ans !== undefined && ans !== null ? ans : ""} onChange={e => { const v = e.target.value; changeAnswer(s.id, qi, v === "" ? undefined : parseInt(v)); }} style={{ fontSize: 11, padding: "2px 4px", borderRadius: 4, border: "1px solid " + BORDER, fontFamily: F, background: "#fff" }}>
                          <option value="">No answer</option>
                          {(q.options || []).map((o, oi) => (
                            <option key={oi} value={oi}>{type === "game" ? (letters[oi] + ") " + (o || "Option " + (oi + 1))) : (o || "Option " + (oi + 1))}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GameEditor({ week, initial, scored, onSave, onGoLive, onDelete, onBack, msg }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
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
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
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
          <button onClick={() => { onSave(questions); setTimeout(onGoLive, 300); }} style={{ ...pill, background: "#d97706", color: "#fff", flex: 1, padding: "12px 0" }}>{scored ? "Re-Open Live" : "Go Live"}</button>
          <button onClick={onDelete} style={{ ...pill, background: "#fef2f2", color: RED, padding: "12px 16px" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── TOT EDITOR (setup phase, with drag reorder) ─── */
function ToTEditor({ week, initial, scored, onSave, onGoLive, onDelete, onBack, msg }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
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
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
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
          <button onClick={() => { onSave(questions); setTimeout(onGoLive, 300); }} style={{ ...pill, background: "#d97706", color: "#fff", flex: 1, padding: "12px 0" }}>{scored ? "Re-Open Live" : "Go Live"}</button>
          <button onClick={onDelete} style={{ ...pill, background: "#fef2f2", color: RED, padding: "12px 16px" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── LIVE ACTIVITY ADMIN (question control + live monitor) ─── */
function LiveActivityAdmin({ type, week, data, setData, onBack, onScore, onTeamBonus, msg, showMsg }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
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
    const deadline = activity.countdown;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
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
        const raw = await window.storage.get("comm4-v1", true);
        if (raw?.value) { const d = JSON.parse(raw.value); setData(d); }
      } catch(e) {}
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const startCountdown = async () => {
    const key = type === "game" ? "weeklyGames" : "weeklyToT";
    const deadline = Date.now() + 5000;
    const updated = { ...data, [key]: { ...activities, [wKey]: { ...activity, countdown: deadline } } };
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

  const [presenterMode, setPresenterMode] = useState(false);
  if (presenterMode) {
    const q = qs[currentQ];
    const totalStudents = sorted.length;
    const lockedCount = sorted.filter(s => activity.responses?.[s.id + "-" + currentQ] !== undefined).length;
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#fafaf9", color: "#111827", fontFamily: F, padding: "24px 32px", zIndex: 9999, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label} / Week {week} / Q{currentQ + 1} of {qs.length}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {countdownActive && <div style={{ fontSize: 32, fontWeight: 900, color: RED, fontVariantNumeric: "tabular-nums" }}>{countdownSecs}</div>}
            <div style={{ background: "#fff", border: "2px solid " + BORDER, borderRadius: 12, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 700, textTransform: "uppercase" }}>Locked</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: GREEN, fontVariantNumeric: "tabular-nums" }}>{lockedCount}<span style={{ color: TEXT_MUTED, fontSize: 16 }}> / {totalStudents}</span></span>
            </div>
            <button onClick={() => setPresenterMode(false)} style={{ background: "#fff", color: TEXT_PRIMARY, border: "1px solid " + BORDER, padding: "8px 16px", borderRadius: 10, fontFamily: F, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Exit</button>
          </div>
        </div>
        {q ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
            <div style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "#111827", lineHeight: 1.2, marginBottom: 32, textAlign: "center", padding: "0 20px" }}>{q.text || q.prompt || "(no text)"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 1200, width: "100%", margin: "0 auto" }}>
              {(q.options || []).map((opt, oi) => {
                if (!opt && type === "game") return null;
                const c = OPT_COLORS[oi] || OPT_COLORS[0];
                return (
                  <div key={oi} style={{
                    background: c.light, border: "3px solid " + c.bg, borderRadius: 16,
                    padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, minHeight: 80,
                  }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{String.fromCharCode(65 + oi)}</div>
                    <div style={{ fontSize: "clamp(18px, 2vw, 28px)", fontWeight: 700, color: c.bg, flex: 1, lineHeight: 1.3, wordBreak: "break-word" }}>{opt}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: TEXT_MUTED }}>No question</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} {label} <span style={{ color: "#d97706" }}>LIVE</span></div>
          <button onClick={() => setPresenterMode(true)} style={{ ...pill, background: "#0f172a", color: "#fff", fontSize: 13 }}>Presenter</button>
        </div>

        {/* Close game controls */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {!activity.scored && (
            <button onClick={() => { if (window.confirm("Close the game and score it now? Points will be posted to the leaderboard.")) onScore(); }} style={{ ...pill, background: GREEN, color: "#fff", fontSize: 13 }}>Close and Score</button>
          )}
          <button onClick={() => { if (window.confirm("Close the game WITHOUT scoring? No points will be awarded.")) endGame(); }} style={{ ...pill, background: "#fff", color: RED, border: "1px solid " + RED + "44", fontSize: 13 }}>Close without Scoring</button>
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
            {isAllLocked && !activity.scored && type === "game" && onTeamBonus && (
              <button onClick={onTeamBonus} style={{ ...pill, background: "#2563eb", color: "#fff", padding: "10px 12px", fontSize: 13 }}>Apply Team Bonus</button>
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
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const fishbowls = data.weeklyFishbowl || {};
  const existing = fishbowls[week] || {};
  const isConfirmed = existing.confirmed;
  const sorted = [...data.students].filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis").sort(lastSortObj);

  const initScores = () => {
    const s = {};
    sorted.forEach(st => { s[st.id] = existing.scores?.[st.id] ?? 20; });
    return s;
  };
  const initGroups = () => {
    const g = {};
    sorted.forEach(st => { g[st.id] = existing.groups?.[st.id] || null; });
    return g;
  };
  const [scores, setScores] = useState(initScores);
  const [groups, setGroups] = useState(initGroups);
  const [star, setStar] = useState(existing.star || null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const adjust = (sid, amount) => { setScores(prev => ({ ...prev, [sid]: Math.max(0, (prev[sid] || 0) + amount) })); };

  const setGroup = (sid, g) => { setGroups(prev => ({ ...prev, [sid]: g })); };

  const randomizeGroups = () => {
    const shuffled = [...sorted].sort(() => Math.random() - 0.5);
    const newGroups = {};
    shuffled.forEach((s, i) => { newGroups[s.id] = (i % 3) + 1; });
    setGroups(newGroups);
    showMsg("Groups randomized");
  };

  const clearGroups = () => {
    const newGroups = {};
    sorted.forEach(s => { newGroups[s.id] = null; });
    setGroups(newGroups);
  };

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
      weeklyFishbowl: { ...fishbowls, [week]: { scores, groups, star, confirmed: true } },
      fishbowlStars: stars,
      log: [...data.log, ...entries],
    };
    await saveData(updated); setData(updated); showMsg("Confirmed! Points posted.");
  };

  const saveDraft = async () => {
    const updated = {
      ...data,
      weeklyFishbowl: { ...fishbowls, [week]: { ...existing, scores, groups, star } },
    };
    await saveData(updated); setData(updated); showMsg("Draft saved");
  };

  const deleteFishbowl = async () => {
    const { [week]: _, ...rest } = fishbowls;
    const updated = { ...data, weeklyFishbowl: rest };
    await saveData(updated); setData(updated); onBack();
  };

  const GROUP_COLORS = {
    1: { bg: "#eff6ff", text: "#2563eb", border: "#2563eb" },
    2: { bg: "#fffbeb", text: "#d97706", border: "#d97706" },
    3: { bg: "#ecfdf5", text: "#059669", border: "#059669" },
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={onBack} style={pillInactive}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>Week {week} Fishbowl</div>
          <div style={{ width: 60 }} />
        </div>
        {isConfirmed && <div style={{ textAlign: "center", fontSize: 13, color: GREEN, fontWeight: 700, marginBottom: 12, padding: 8, background: "#ecfdf5", borderRadius: 8 }}>Confirmed and posted</div>}

        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ ...sectionLabel }}>Groups</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={randomizeGroups} style={pillInactive}>Randomize</button>
              <button onClick={clearGroups} style={pillInactive}>Clear</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: TEXT_MUTED }}>Click a number (1, 2, 3) next to each student to assign, or use Randomize to split evenly.</div>
        </div>

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
            const myGroup = groups[s.id];
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  {[1, 2, 3].map(g => {
                    const gc = GROUP_COLORS[g];
                    const active = myGroup === g;
                    return (
                      <button key={g} onClick={() => setGroup(s.id, active ? null : g)} style={{
                        width: 22, height: 22, borderRadius: 6, fontFamily: F, fontWeight: 800, fontSize: 11, cursor: "pointer",
                        background: active ? gc.border : gc.bg, color: active ? "#fff" : gc.text,
                        border: "1px solid " + gc.border,
                      }}>{g}</button>
                    );
                  })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    {s.name}
                    {isStar && <span style={{ marginLeft: 6, fontSize: 12, color: "#d97706" }}>&#9733;</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <button onClick={() => adjust(s.id, -20)} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 6px", minWidth: 32 }}>-20</button>
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
          {!isConfirmed && <button onClick={saveDraft} style={{ ...pillInactive, padding: "12px 16px" }}>Save Draft</button>}
          <button onClick={() => { if (window.confirm("Delete fishbowl week " + week + "?")) deleteFishbowl(); }} style={{ ...pill, background: "#fef2f2", color: RED, padding: "12px 16px" }}>Delete</button>
        </div>

        {isConfirmed && <ReboundPanel data={data} setData={setData} activityType="fishbowl" week={week} isAdmin={true} userName="Andrew Ishak" />}
      </div>
    </div>
  );
}

/* ─── STUDENT: GAME + TOT ANSWER VIEW ─── */
export function StudentAnswerView({ data, setData, userName }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const [week, setWeek] = useState(null);
  const [mode, setMode] = useState("game");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [countdown, setCountdown] = useState(0);
  const lastSubmitRef = React.useRef(0);
  // Freeze activity while student is mid-selection so admin advances and live updates
  // don't kick them out of the question they're answering. (Hook must be at top level.)
  const frozenActivityRef = React.useRef(null);
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 1500); };

  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;
  const games = data.weeklyGames || {};
  const tots = data.weeklyToT || {};

  // Compute liveActivity at top level so the freeze effect can depend on it.
  // Re-derived during render; if no live activity, this is undefined and the
  // effect is a no-op until one appears.
  const _topLevelActivities = mode === "game" ? games : tots;
  const _topLevelLive = (week !== null) ? (_topLevelActivities[week] || _topLevelActivities[String(week)]) : null;
  React.useEffect(() => {
    if (selected !== null && _topLevelLive) {
      if (!frozenActivityRef.current) frozenActivityRef.current = _topLevelLive;
    } else {
      frozenActivityRef.current = null;
    }
  }, [selected, _topLevelLive]);

  // Auto-jump to live activity if one exists.
  React.useEffect(() => {
    if (week !== null) return;
    const liveGameWeek = Object.keys(games).find(w => games[w]?.phase === "live");
    if (liveGameWeek) { setMode("game"); setWeek(parseInt(liveGameWeek) || liveGameWeek); return; }
    const liveTotWeek = Object.keys(tots).find(w => tots[w]?.phase === "live");
    if (liveTotWeek) { setMode("tot"); setWeek(parseInt(liveTotWeek) || liveTotWeek); return; }
  }, [week, games, tots]);

  // Auto-refresh data every 5 seconds for live sync; pauses when student has a pending selection
  React.useEffect(() => {
    if (week === null) return;
    const activity = mode === "game" ? games[week] : (tots[week] || tots[String(week)]);
    if (!activity || activity.phase !== "live") return;
    if (selected !== null) return;
    if (saving) return;
    const iv = setInterval(async () => {
      try {
        const raw = await window.storage.get("comm4-v1", true);
        if (raw?.value) {
          const d = JSON.parse(raw.value);
          if (sid) {
            const dataKey = mode === "game" ? "weeklyGames" : "weeklyToT";
            const localAct = mode === "game" ? games[week] : (tots[week] || tots[String(week)]);
            const wKey = (d[dataKey] || {})[week] ? week : String(week);
            const remoteAct = (d[dataKey] || {})[wKey];
            if (localAct && remoteAct) {
              const merged = { ...(remoteAct.responses || {}) };
              Object.keys(localAct.responses || {}).forEach(k => {
                if (k.startsWith(sid)) merged[k] = localAct.responses[k];
              });
              d[dataKey] = { ...d[dataKey], [wKey]: { ...remoteAct, responses: merged } };
            }
          }
          setData(d);
        }
      } catch(e) {}
    }, 5000);
    return () => clearInterval(iv);
  }, [week, mode, sid, selected, saving]);

  // Countdown effect
  React.useEffect(() => {
    if (week === null) return;
    const activity = mode === "game" ? games[week] : (tots[week] || tots[String(week)]);
    if (!activity?.countdown) { setCountdown(0); return; }
    const deadline = activity.countdown;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setCountdown(left);
    };
    tick();
    const iv = setInterval(tick, 200);
    return () => clearInterval(iv);
  }, [week, mode, data]);

  const submitAnswer = async (actType, w, qIdx, answerIdx) => {
    if (!sid) return;
    const dataKey = actType === "game" ? "weeklyGames" : "weeklyToT";
    const myKey = sid + "-" + qIdx;
    setSaving(true);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const raw = await window.storage.get("comm4-v1", true);
        if (!raw?.value) {
          if (attempt === 2) { setSaving(false); showMsg("Save failed. Try again."); return; }
          continue;
        }
        const fresh = JSON.parse(raw.value);
        const activities = fresh[dataKey] || {};
        const wKey = activities[w] !== undefined ? w : (activities[String(w)] !== undefined ? String(w) : w);
        const activity = activities[wKey];
        if (!activity || activity.phase !== "live") {
          setSaving(false); showMsg("This question closed"); setSelected(null); return;
        }
        const mergedResponses = { ...(activity.responses || {}), [myKey]: answerIdx };
        const updated = { ...fresh, [dataKey]: { ...activities, [wKey]: { ...activity, responses: mergedResponses } } };
        const ok = await saveData(updated);
        if (!ok) {
          if (attempt === 2) { setSaving(false); showMsg("Save failed. Try again."); return; }
          continue;
        }
        const verifyRaw = await window.storage.get("comm4-v1", true);
        if (verifyRaw?.value) {
          try {
            const verifyData = JSON.parse(verifyRaw.value);
            const va = (verifyData[dataKey] || {})[wKey];
            if (va && va.responses && va.responses[myKey] === answerIdx) {
              setData(verifyData);
              lastSubmitRef.current = Date.now();
              setSelected(null);
              setSaving(false);
              showMsg("Locked in");
              return;
            }
          } catch(e) {}
        }
        if (attempt === 2) { setSaving(false); showMsg("Save failed. Try again."); return; }
      } catch(e) {
        if (attempt === 2) { setSaving(false); showMsg("Save failed. Try again."); return; }
      }
      await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
    }
  };

  // Week selector
  // When no live activity, render nothing here. Past events are listed by ActivitiesView.
  if (week === null) {
    return null;
  }

  // Get activity
  const actType = mode;
  const activities = actType === "game" ? games : tots;
  const liveActivity = activities[week] || activities[String(week)];

  const activity = (selected !== null && frozenActivityRef.current) ? frozenActivityRef.current : liveActivity;

  if (!activity) return <div style={{ padding: 40, textAlign: "center", fontFamily: F, color: "#9ca3af" }}>Not available.<br /><button onClick={() => setWeek(null)} style={{ ...pillInactive, marginTop: 12 }}>Back</button></div>;

  const qs = activity.questions || [];
  const currentQ = activity.currentQ || 0;
  const lockedQs = activity.lockedQs || [];
  const isLive = activity.phase === "live";

  // Game results (scored)
  if (actType === "game" && activity.scored) {
    let gameTotal = 0, gradeTotal = 0;
    const responses = activity.responses || {};
    const allStudents = (data.students || []).filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis");
    const playedStudents = allStudents.filter(s => qs.some((_, qi) => responses[s.id + "-" + qi] !== undefined));
    const letters = ["A", "B", "C", "D", "E", "F"];
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => setWeek(null)} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Week {week} Results</div>
          {qs.map((q, qi) => {
            const my = sid ? responses[sid + "-" + qi] : undefined;
            const isCorrect = my === q.correct;
            if (isCorrect) { gameTotal += GAME_PTS; gradeTotal += GAME_GRADE_PTS[q.category] || 0; }
            const counts = (q.options || []).map(() => 0);
            let totalAnswered = 0;
            playedStudents.forEach(s => {
              const ans = responses[s.id + "-" + qi];
              if (ans !== undefined && ans !== null && counts[ans] !== undefined) {
                counts[ans]++;
                totalAnswered++;
              }
            });
            return (
              <div key={qi} style={{ padding: 14, marginBottom: 10, background: "#fafafa", borderRadius: 10, border: "1px solid #e5e5e4" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "#9f123915", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#9f1239", flexShrink: 0 }}>{qi + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{GAME_CATS.find(c => c.id === q.category)?.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>{q.text || q.prompt || "(no text)"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(q.options || []).map((opt, oi) => {
                    const isCorrectOpt = oi === q.correct;
                    const isMine = oi === my;
                    const pct = totalAnswered > 0 ? Math.round(counts[oi] / totalAnswered * 100) : 0;
                    let bg = "#fff";
                    let borderColor = "#e5e5e4";
                    let textColor = "#111827";
                    if (isCorrectOpt) { bg = "#ecfdf5"; borderColor = GREEN; textColor = "#065f46"; }
                    if (isMine && !isCorrectOpt) { bg = "#fef2f2"; borderColor = RED; textColor = "#991b1b"; }
                    return (
                      <div key={oi} style={{ position: "relative", padding: "10px 14px", borderRadius: 8, background: bg, border: "2px solid " + borderColor, overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: pct + "%", background: isCorrectOpt ? "rgba(16,185,129,0.1)" : isMine && !isCorrectOpt ? "rgba(220,38,38,0.1)" : "rgba(0,0,0,0.04)", transition: "width 0.3s" }} />
                        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: textColor, minWidth: 16 }}>{letters[oi]}.</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: textColor, flex: 1 }}>{opt}</span>
                          {isMine && <span style={{ fontSize: 10, fontWeight: 700, color: textColor, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.05)" }}>YOU</span>}
                          {isCorrectOpt && <span style={{ fontSize: 10, fontWeight: 700, color: "#065f46", padding: "2px 6px", borderRadius: 4, background: GREEN + "30" }}>CORRECT</span>}
                          <span style={{ fontSize: 12, fontWeight: 700, color: textColor }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {my === undefined && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, fontStyle: "italic" }}>You did not answer this question</div>}
              </div>
            );
          })}
          <div style={{ ...crd, padding: 14, marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, textAlign: "center" }}>
              <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Game Points</div><div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{gameTotal}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 100</span></div></div>
              <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Grade Points</div><div style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>{Math.round(gradeTotal * 10) / 10}<span style={{ fontSize: 13, color: "#9ca3af" }}> / 100</span></div></div>
            </div>
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
    const responses = activity.responses || {};
    const allStudents = (data.students || []).filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis");
    const playedStudents = allStudents.filter(s => qs.some((_, qi) => responses[s.id + "-" + qi] !== undefined));
    const letters = ["A", "B", "C", "D", "E", "F"];
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => setWeek(null)} style={{ ...pillInactive, marginBottom: 12 }}>Back</button>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 12 }}>Week {week} This or That Results</div>
          {qs.map((q, qi) => {
            const my = sid ? responses[sid + "-" + qi] : undefined;
            const isCorrect = my === q.correct;
            if (isCorrect) total += ptsEach;
            const counts = (q.options || []).map(() => 0);
            let totalAnswered = 0;
            playedStudents.forEach(s => {
              const ans = responses[s.id + "-" + qi];
              if (ans !== undefined && ans !== null && counts[ans] !== undefined) {
                counts[ans]++;
                totalAnswered++;
              }
            });
            return (
              <div key={qi} style={{ padding: 14, marginBottom: 10, background: "#fafafa", borderRadius: 10, border: "1px solid #e5e5e4" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "#9f123915", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#9f1239", flexShrink: 0 }}>{qi + 1}</div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.4 }}>{q.text || q.prompt || "(no text)"}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(q.options || []).map((opt, oi) => {
                    const isCorrectOpt = oi === q.correct;
                    const isMine = oi === my;
                    const pct = totalAnswered > 0 ? Math.round(counts[oi] / totalAnswered * 100) : 0;
                    let bg = "#fff";
                    let borderColor = "#e5e5e4";
                    let textColor = "#111827";
                    if (isCorrectOpt) { bg = "#ecfdf5"; borderColor = GREEN; textColor = "#065f46"; }
                    if (isMine && !isCorrectOpt) { bg = "#fef2f2"; borderColor = RED; textColor = "#991b1b"; }
                    return (
                      <div key={oi} style={{ position: "relative", padding: "10px 14px", borderRadius: 8, background: bg, border: "2px solid " + borderColor, overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: pct + "%", background: isCorrectOpt ? "rgba(16,185,129,0.1)" : isMine && !isCorrectOpt ? "rgba(220,38,38,0.1)" : "rgba(0,0,0,0.04)", transition: "width 0.3s" }} />
                        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: textColor, minWidth: 16 }}>{letters[oi]}.</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: textColor, flex: 1 }}>{opt}</span>
                          {isMine && <span style={{ fontSize: 10, fontWeight: 700, color: textColor, padding: "2px 6px", borderRadius: 4, background: "rgba(0,0,0,0.05)" }}>YOU</span>}
                          {isCorrectOpt && <span style={{ fontSize: 10, fontWeight: 700, color: "#065f46", padding: "2px 6px", borderRadius: 4, background: GREEN + "30" }}>CORRECT</span>}
                          <span style={{ fontSize: 12, fontWeight: 700, color: textColor }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {my === undefined && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, fontStyle: "italic" }}>You did not answer this question</div>}
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
      <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
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
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
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
            <div style={{ fontSize: 18, fontWeight: 700, color: GREEN, wordBreak: "break-word", lineHeight: 1.35 }}>Locked in: {q.options[myAnswer]}</div>
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
                    whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.35,
                  }}><span style={{ fontWeight: 900, marginRight: 8 }}>{String.fromCharCode(65 + oi)}.</span>{opt}</button>
                );
              })}
            </div>
            {selected !== null && <button onClick={() => submitAnswer(actType, week, currentQ, selected)} disabled={saving} style={{ ...pill, fontSize: 14, padding: "12px 40px", background: saving ? "#6b7280" : "#111827", color: "#fff", fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.85 : 1 }}>{saving ? "Saving..." : "Lock in answer"}</button>}
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

/* ─── TEAM TRIVIA: FINALIZE SCREEN ─────────────────────────────────────
   After admin clicks "Finalize" on the live admin, the game's phase becomes
   "done" and they land here. Final adjustments before awarding points:

   1. Per-team bonus editor (reuses bonusPoints.teams)
   2. Per-team-member attendance toggle (default on); off = no team-share
   3. Per-student bonus editor (bonusPoints.students); applies regardless of team
   4. Sitting-out + unassigned students also listed for personal bonuses
   5. Big "Finalize and award points" button writes log entries

   Idempotent: finalizedTs is set on award. If already finalized, the screen
   shows the awarded summary and an "Unfinalize" button to undo (deletes
   matching log entries).

   "Back to live" returns the game to phase=live (e.g., admin needs to fix
   a grading mistake).
*/
function TriviaFinalize({ game, students, data, setData, onSave, onAwardPoints, onUnfinalize, onBackToLive, onBack, msg, showMsg }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);

  const TEAM_PALETTE = [
    { bg: "#fef2f2", accent: "#dc2626" },
    { bg: "#eff6ff", accent: "#2563eb" },
    { bg: "#ecfdf5", accent: "#059669" },
    { bg: "#fffbeb", accent: "#d97706" },
    { bg: "#f5f3ff", accent: "#7c3aed" },
    { bg: "#ecfeff", accent: "#0891b2" },
    { bg: "#fdf2f8", accent: "#db2777" },
    { bg: "#f7fee7", accent: "#65a30d" },
  ];
  const teamColor = (t) => TEAM_PALETTE[(t.colorIdx || 0) % TEAM_PALETTE.length];

  const questions = game.questions || [];
  const teams = game.teams || [];
  const answers = game.answers || {};
  const revealedQs = game.revealedQs || [];
  const defaultPts = game.defaultPointsPerQ || 5;
  const sittingOut = game.sittingOut || [];
  const isFinalized = !!game.finalizedTs;
  const eligibleStudents = students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis");
  const studentById = (id) => eligibleStudents.find(s => s.id === id);

  // Attendance (defaults to true for all members). Stored at game.attendance[studentId].
  const attendance = game.attendance || {};
  const isPresent = (sid) => attendance[sid] !== false; // default true

  const setAttendance = (sid, present) => {
    onSave({ attendance: { ...attendance, [sid]: present } });
  };

  const teamCorrectPoints = (teamId) => {
    let total = 0;
    revealedQs.forEach(qi => {
      const a = answers[teamId + "-" + qi];
      if (a && a.gradedCorrect === true) {
        const q = questions[qi];
        const pts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
        total += pts;
      }
    });
    return total;
  };
  const teamBonus = (teamId) => {
    const b = (game.bonusPoints?.teams || {})[teamId];
    return typeof b === "number" ? b : 0;
  };
  const studentBonus = (sid) => {
    const b = (game.bonusPoints?.students || {})[sid];
    return typeof b === "number" ? b : 0;
  };

  // What this student would receive on Finalize:
  // - if on a team and present: teamCorrectPoints(team) + teamBonus(team) + studentBonus(sid)
  // - if on a team and NOT present: teamBonus(team) + studentBonus(sid)
  // - if not on any team (sitting out or unassigned): just studentBonus(sid)
  const studentTotal = (sid) => {
    const team = teams.find(t => (t.memberIds || []).includes(sid));
    if (team) {
      const teamShare = isPresent(sid) ? teamCorrectPoints(team.id) : 0;
      return teamShare + teamBonus(team.id) + studentBonus(sid);
    }
    return studentBonus(sid);
  };

  const setTeamBonus = (teamId, value) => {
    onSave({ bonusPoints: { ...(game.bonusPoints || { teams: {}, students: {} }), teams: { ...((game.bonusPoints || {}).teams || {}), [teamId]: value } } });
  };
  const setStudentBonus = (sid, value) => {
    onSave({ bonusPoints: { ...(game.bonusPoints || { teams: {}, students: {} }), students: { ...((game.bonusPoints || {}).students || {}), [sid]: value } } });
  };

  // Build the list of all students who would get an entry: every team member + sitting out + unassigned.
  // They get an entry as long as their final amount is non-zero (we'll filter at award time).
  const inAnyTeam = new Set();
  teams.forEach(t => (t.memberIds || []).forEach(id => inAnyTeam.add(id)));
  const sittingSet = new Set(sittingOut);
  const unassigned = eligibleStudents.filter(s => !inAnyTeam.has(s.id) && !sittingSet.has(s.id));

  const sortedTeams = [...teams].sort((a, b) => (teamCorrectPoints(b.id) + teamBonus(b.id)) - (teamCorrectPoints(a.id) + teamBonus(a.id)));

  const award = () => {
    if (!window.confirm("Award points to everyone? This adds entries to the leaderboard log. You can Unfinalize to undo.")) return;
    const tag = "Team Trivia: " + (game.title || "Trivia");
    const ts = Date.now();
    const entries = [];
    eligibleStudents.forEach(s => {
      const amt = studentTotal(s.id);
      if (amt === 0) return;
      entries.push({
        id: "log_" + ts + "_" + s.id + "_" + Math.random().toString(36).slice(2, 6),
        studentId: s.id,
        amount: amt,
        source: tag,
        triviaGameId: game.id,
        ts,
      });
    });
    onAwardPoints(entries, ts);
  };

  const unfinalize = () => {
    if (!window.confirm("Unfinalize? This removes the log entries that were awarded. You can re-finalize after.")) return;
    onUnfinalize();
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onBack} style={pillInactive}>Back</button>
            {!isFinalized && <button onClick={onBackToLive} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>← Back to Live</button>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: isFinalized ? GREEN : "#d97706", padding: "3px 10px", borderRadius: 6, background: isFinalized ? "#ecfdf5" : "#fffbeb", textTransform: "uppercase", letterSpacing: "0.05em" }}>{isFinalized ? "Finalized" : "Ready to Finalize"}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{game.title}</span>
          </div>
        </div>

        {isFinalized && (
          <div style={{ ...crd, padding: 14, marginBottom: 16, background: "#ecfdf5", border: "2px solid " + GREEN }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>Awarded {new Date(game.finalizedTs).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 4 }}>Points are in the leaderboard. To make changes, click Unfinalize, edit, then re-finalize.</div>
            <button onClick={unfinalize} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 12, padding: "6px 14px", marginTop: 10 }}>Unfinalize</button>
          </div>
        )}

        {/* Final standings preview */}
        <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Final Standings</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sortedTeams.map((t, idx) => {
              const pal = teamColor(t);
              const correct = teamCorrectPoints(t.id);
              const bonus = teamBonus(t.id);
              return (
                <div key={t.id} style={{ background: pal.bg, border: "2px solid " + pal.accent, borderRadius: 10, padding: "10px 14px", minWidth: 150 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: pal.accent, letterSpacing: "0.05em" }}>#{idx + 1}{idx === 0 ? " 🏆" : ""}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>{t.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: pal.accent, fontVariantNumeric: "tabular-nums" }}>{correct + bonus}</div>
                  <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>{correct} correct{bonus !== 0 ? " " + (bonus > 0 ? "+" : "") + bonus + " bonus" : ""}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team adjustments: bonus + per-member attendance + personal bonus */}
        <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Adjust Each Team</div>
          {teams.map(t => {
            const pal = teamColor(t);
            const correct = teamCorrectPoints(t.id);
            const bonus = teamBonus(t.id);
            return (
              <div key={t.id} style={{ background: pal.bg, border: "2px solid " + pal.accent, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: pal.accent }}>{t.name} <span style={{ color: TEXT_MUTED, fontWeight: 500, fontSize: 12 }}>· {correct} from correct answers</span></div>
                  <FinalBonusEditor
                    label="Team bonus"
                    bonus={bonus}
                    accent={pal.accent}
                    onSave={(v) => setTeamBonus(t.id, v)}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(t.memberIds || []).map(sid => {
                    const s = studentById(sid); if (!s) return null;
                    const present = isPresent(sid);
                    const pBonus = studentBonus(sid);
                    const pTotal = studentTotal(sid);
                    return (
                      <div key={sid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "#fff", borderRadius: 6, border: "1px solid " + BORDER, flexWrap: "wrap" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
                          <input type="checkbox" checked={present} onChange={e => setAttendance(sid, e.target.checked)} style={{ cursor: "pointer" }} />
                          <span>{s.name}</span>
                        </label>
                        <div style={{ flex: 1 }} />
                        <FinalBonusEditor
                          label="Bonus"
                          bonus={pBonus}
                          accent={pal.accent}
                          onSave={(v) => setStudentBonus(sid, v)}
                        />
                        <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums", minWidth: 50, textAlign: "right" }}>= {pTotal}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sitting out + unassigned students */}
        {(sittingOut.length > 0 || unassigned.length > 0) && (
          <div style={{ ...crd, padding: 14, marginBottom: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Other Students (Bonus only)</div>
            <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 8 }}>Students sitting out or not on any team. They don&apos;t get team points but you can still award personal bonus.</div>
            {[...sittingOut, ...unassigned.map(s => s.id)].map(sid => {
              const s = studentById(sid); if (!s) return null;
              const sittingFlag = sittingSet.has(sid);
              const pBonus = studentBonus(sid);
              const pTotal = studentTotal(sid);
              return (
                <div key={sid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#fafafa", borderRadius: 6, border: "1px solid " + BORDER, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>{s.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: TEXT_MUTED, padding: "2px 6px", background: "#fff", borderRadius: 4, border: "1px solid " + BORDER, textTransform: "uppercase" }}>{sittingFlag ? "Sitting out" : "Unassigned"}</span>
                  <div style={{ flex: 1 }} />
                  <FinalBonusEditor
                    label="Bonus"
                    bonus={pBonus}
                    accent={ACCENT}
                    onSave={(v) => setStudentBonus(sid, v)}
                  />
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums", minWidth: 50, textAlign: "right" }}>= {pTotal}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Award button */}
        {!isFinalized && (
          <button onClick={award} style={{
            ...pill, padding: "14px 20px", background: GREEN, color: "#fff",
            width: "100%", fontSize: 15, fontWeight: 800,
          }}>Finalize &amp; Award Points to Everyone</button>
        )}
      </div>
    </div>
  );
}

// Editable bonus pill used in finalize for both team-bonus and student-bonus inputs.
function FinalBonusEditor({ label, bonus, accent, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(bonus || 0));
  React.useEffect(() => { setValue(String(bonus || 0)); }, [bonus]);
  const commit = () => {
    const n = parseInt(value);
    onSave(isNaN(n) ? 0 : n);
    setEditing(false);
  };
  if (editing) {
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: TEXT_MUTED }}>{label}:</span>
        <input
          type="number" autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); else if (e.key === "Escape") { setValue(String(bonus || 0)); setEditing(false); } }}
          style={{ ...inp, width: 64, fontSize: 12, padding: "2px 6px", textAlign: "center" }}
        />
      </div>
    );
  }
  if (!bonus || bonus === 0) {
    return (
      <button onClick={() => setEditing(true)} style={{
        fontSize: 10, fontWeight: 700, color: accent, background: "transparent",
        border: "1px dashed " + accent + "60", borderRadius: 6, padding: "2px 8px",
        cursor: "pointer", fontFamily: F,
      }}>+ {label.toLowerCase()}</button>
    );
  }
  const positive = bonus > 0;
  return (
    <button onClick={() => setEditing(true)} style={{
      fontSize: 11, fontWeight: 800, color: "#fff",
      background: positive ? accent : "#6b7280",
      border: "none", borderRadius: 999, padding: "3px 10px",
      cursor: "pointer", fontFamily: F,
    }}>{positive ? "+" : ""}{bonus} {label.toLowerCase()}</button>
  );
}


/* ─── TEAM TRIVIA: STUDENT PLAYER VIEW ────────────────────────────────
   Used inside ActivitiesView. Routed when a trivia game has phase=live.
   Determines the student's team. Sitting out students see a passive
   message. Active team members see open questions, can submit on behalf
   of the team (locked once any teammate submits). Locked questions show
   "Waiting for results". Revealed questions show the round reveal grid
   with running totals and an animated points count-up for their team.
*/
export function TriviaPlayer({ data, setData, userName }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const TEAM_PALETTE = [
    { bg: "#fef2f2", accent: "#dc2626" },
    { bg: "#eff6ff", accent: "#2563eb" },
    { bg: "#ecfdf5", accent: "#059669" },
    { bg: "#fffbeb", accent: "#d97706" },
    { bg: "#f5f3ff", accent: "#7c3aed" },
    { bg: "#ecfeff", accent: "#0891b2" },
    { bg: "#fdf2f8", accent: "#db2777" },
    { bg: "#f7fee7", accent: "#65a30d" },
  ];

  const triviaGames = data.triviaGames || {};
  const liveGame = Object.values(triviaGames).find(g => g.phase === "live");

  // Auto-refresh every 2 seconds (pause if mid-typing on a draft answer)
  const lastDraftRef = React.useRef(0);
  React.useEffect(() => {
    if (!liveGame) return;
    const iv = setInterval(async () => {
      if (Date.now() - lastDraftRef.current < 3000) return; // pause refresh while typing
      try {
        const raw = await window.storage.get("comm4-v1", true);
        if (raw?.value) { const d = JSON.parse(raw.value); setData(d); }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(iv);
  }, [liveGame?.id]);

  // Local draft answers per question. Keyed by question index.
  const [drafts, setDrafts] = useState({});

  if (!liveGame) {
    return null; // ActivitiesView shouldn't route here, but safe fallback
  }

  const me = data.students.find(s => s.name === userName);
  const myId = me?.id;
  const teams = liveGame.teams || [];
  const questions = liveGame.questions || [];
  const openQs = liveGame.openQs || [];
  const lockedQs = liveGame.lockedQs || [];
  const revealedQs = liveGame.revealedQs || [];
  const answers = liveGame.answers || {};
  const defaultPts = liveGame.defaultPointsPerQ || 5;
  const sittingOut = liveGame.sittingOut || [];

  const myTeam = teams.find(t => (t.memberIds || []).includes(myId));
  const isSittingOut = sittingOut.includes(myId) || (!myTeam && !sittingOut.includes(myId));

  const teamColor = (t) => TEAM_PALETTE[(t.colorIdx || 0) % TEAM_PALETTE.length];

  // Submit an answer for the team
  const submitAnswer = async (qi, text) => {
    if (!myTeam || !text.trim()) return;
    const key = myTeam.id + "-" + qi;
    if (answers[key] && answers[key].text) return; // already submitted
    const updated = {
      ...data,
      triviaGames: {
        ...triviaGames,
        [liveGame.id]: {
          ...liveGame,
          answers: { ...answers, [key]: { text: text.trim(), gradedCorrect: null, ts: Date.now(), submittedBy: userName } },
        },
      },
    };
    await saveData(updated); setData(updated);
    // Clear local draft
    setDrafts(d => { const x = { ...d }; delete x[qi]; return x; });
  };

  // Compute team running total from revealed questions
  const teamTotal = (teamId) => {
    let total = 0;
    revealedQs.forEach(qi => {
      const a = answers[teamId + "-" + qi];
      if (a && a.gradedCorrect === true) {
        const q = questions[qi];
        const pts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
        total += pts;
      }
    });
    return total;
  };

  // ─── SITTING OUT VIEW ───
  if (!myTeam) {
    return (
      <div style={{ padding: "24px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ ...crd, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Live: {liveGame.title}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 8 }}>You&apos;re sitting this one out</div>
            <div style={{ fontSize: 14, color: TEXT_SECONDARY, marginBottom: 16 }}>Cheer the teams on. Live standings below.</div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {[...teams].sort((a, b) => teamTotal(b.id) - teamTotal(a.id)).map((t, i) => {
                const pal = teamColor(t);
                return (
                  <div key={t.id} style={{ background: pal.bg, border: "2px solid " + pal.accent, borderRadius: 10, padding: "8px 12px", minWidth: 100 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: pal.accent, letterSpacing: "0.05em" }}>#{i + 1}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TEXT_PRIMARY }}>{t.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: pal.accent, fontVariantNumeric: "tabular-nums" }}>{teamTotal(t.id)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── TEAM PLAYER VIEW ───
  const myPal = teamColor(myTeam);
  const myTotal = teamTotal(myTeam.id);

  // Are there any open questions to answer right now?
  const myOpenQs = openQs;
  const myLockedAwaitingReveal = lockedQs;
  const lastRevealedBatch = revealedQs.slice(-4); // show the most recent reveal

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Team banner */}
        <div style={{
          background: myPal.bg, border: "3px solid " + myPal.accent, borderRadius: 14, padding: 16, marginBottom: 16,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: myPal.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>{liveGame.title}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: TEXT_PRIMARY, lineHeight: 1.1 }}>{myTeam.name}</div>
          <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 4 }}>{(myTeam.memberIds || []).length} member{(myTeam.memberIds || []).length !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: myPal.accent, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
            <SnapCountUp value={myTotal} />
          </div>
        </div>

        {/* Open questions to answer */}
        {myOpenQs.length > 0 && (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Answer these now</div>
            {myOpenQs.map(qi => {
              const q = questions[qi]; if (!q) return null;
              const key = myTeam.id + "-" + qi;
              const submitted = answers[key];
              const draft = drafts[qi] !== undefined ? drafts[qi] : "";
              const qPts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
              return (
                <div key={qi} style={{ padding: 14, borderRadius: 10, border: "1px solid " + BORDER, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTED }}>Q{qi + 1} · {qPts} pt{qPts !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 10 }}>{q.text}</div>
                  {submitted ? (
                    <div style={{ padding: 10, background: "#ecfdf5", border: "1.5px solid " + GREEN, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: GREEN, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Locked in</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{submitted.text}</div>
                      <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>by {submitted.submittedBy || "teammate"}</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <textarea
                        value={draft}
                        onChange={e => { lastDraftRef.current = Date.now(); setDrafts(d => ({ ...d, [qi]: e.target.value })); }}
                        placeholder="Type your team's answer..."
                        rows={2}
                        style={{ ...inp, resize: "vertical", fontSize: 14, lineHeight: 1.4 }}
                      />
                      <button
                        onClick={() => submitAnswer(qi, draft)}
                        disabled={!draft.trim()}
                        style={{
                          ...pill, padding: "10px 16px",
                          background: draft.trim() ? myPal.accent : "#e4e4e7",
                          color: draft.trim() ? "#fff" : TEXT_MUTED,
                          cursor: draft.trim() ? "pointer" : "not-allowed",
                          fontSize: 14, fontWeight: 700,
                        }}>
                        Submit for {myTeam.name}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Locked, waiting for reveal */}
        {myOpenQs.length === 0 && myLockedAwaitingReveal.length > 0 && (
          <div style={{ ...crd, padding: 20, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#d97706", marginBottom: 6 }}>Locked in</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>Waiting for results...</div>
          </div>
        )}

        {/* No open or locked = waiting for next round or game over */}
        {myOpenQs.length === 0 && myLockedAwaitingReveal.length === 0 && revealedQs.length < questions.length && (
          <div style={{ ...crd, padding: 20, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>Get ready for the next round</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY }}>Waiting for the next questions to open...</div>
          </div>
        )}

        {/* Reveal grid: shown when there are revealedQs and nothing else active */}
        {revealedQs.length > 0 && myOpenQs.length === 0 && myLockedAwaitingReveal.length === 0 && (
          <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Reveal · Round {Math.ceil(revealedQs.length / 4)}</div>
            <TriviaRevealGrid
              questions={questions}
              roundQs={lastRevealedBatch}
              teams={teams}
              answers={answers}
              defaultPts={defaultPts}
              myTeamId={myTeam.id}
              palette={TEAM_PALETTE}
              teamTotal={teamTotal}
            />
          </div>
        )}

        {/* All done! */}
        {revealedQs.length === questions.length && questions.length > 0 && (
          <div style={{ ...crd, padding: 24, textAlign: "center", background: myPal.bg, border: "3px solid " + myPal.accent, borderRadius: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: myPal.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Game Over</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY }}>{myTeam.name} finished with {myTotal} pts</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Animated count-up for the team total
function SnapCountUp({ value }) {
  const [display, setDisplay] = useState(value);
  const lastValueRef = React.useRef(value);
  React.useEffect(() => {
    if (value === lastValueRef.current) return;
    const start = lastValueRef.current;
    const end = value;
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        setDisplay(end);
        lastValueRef.current = end;
        return;
      }
      const t = elapsed / duration;
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{display}</span>;
}

// Reveal grid: rows = teams sorted by running total desc, columns = round questions,
// cells = each team's answer with green box around correct ones.
function TriviaRevealGrid({ questions, roundQs, teams, answers, defaultPts, myTeamId, palette, teamTotal }) {
  const sorted = [...teams].sort((a, b) => teamTotal(b.id) - teamTotal(a.id));

  const teamColor = (t) => palette[(t.colorIdx || 0) % palette.length];

  // Round points earned per team (for this round only)
  const roundPts = (teamId) => {
    let total = 0;
    roundQs.forEach(qi => {
      const a = answers[teamId + "-" + qi];
      if (a && a.gradedCorrect === true) {
        const q = questions[qi];
        const pts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
        total += pts;
      }
    });
    return total;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Header row: question labels */}
      <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${roundQs.length}, 1fr) 80px`, gap: 4, alignItems: "center", marginBottom: 4 }}>
        <div></div>
        {roundQs.map(qi => (
          <div key={qi} style={{ fontSize: 10, fontWeight: 800, color: TEXT_MUTED, textAlign: "center" }}>Q{qi + 1}</div>
        ))}
        <div style={{ fontSize: 10, fontWeight: 800, color: TEXT_MUTED, textAlign: "right" }}>+ROUND</div>
      </div>
      {sorted.map((t, idx) => {
        const pal = teamColor(t);
        const isMe = t.id === myTeamId;
        const earned = roundPts(t.id);
        return (
          <div
            key={t.id}
            style={{
              display: "grid", gridTemplateColumns: `140px repeat(${roundQs.length}, 1fr) 80px`,
              gap: 4, alignItems: "stretch",
              background: isMe ? pal.bg : "#fff",
              border: "2px solid " + (isMe ? pal.accent : BORDER),
              borderRadius: 10, padding: 6,
              transition: "all 0.5s ease",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: pal.accent }}>#{idx + 1}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.1 }}>{t.name}{isMe ? " ★" : ""}</div>
            </div>
            {roundQs.map(qi => {
              const a = answers[t.id + "-" + qi];
              const correct = a?.gradedCorrect === true;
              const text = a?.text || "—";
              return (
                <div key={qi} style={{
                  background: correct ? "#ecfdf5" : "#fafafa",
                  border: correct ? "2px solid " + GREEN : "1px solid " + BORDER,
                  borderRadius: 6, padding: "4px 6px",
                  fontSize: 11, fontWeight: correct ? 700 : 500,
                  color: correct ? GREEN : TEXT_SECONDARY,
                  display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                  wordBreak: "break-word",
                }}>{text}</div>
              );
            })}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: pal.accent, fontVariantNumeric: "tabular-nums",
            }}>+<SnapCountUp value={earned} /></div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── BONUS EDITOR (admin) ────────────────────────────────────────────
   Click-to-edit pill for adjusting a team's bonus points. Local state +
   blur-saves so typing isn't disrupted by parent re-renders.
*/
function TeamBonusEditor({ bonus, accent, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(bonus || 0));
  React.useEffect(() => { setValue(String(bonus || 0)); }, [bonus]);
  const commit = () => {
    const n = parseInt(value);
    onSave(isNaN(n) ? 0 : n);
    setEditing(false);
  };
  if (editing) {
    return (
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
        <input
          type="number" autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); else if (e.key === "Escape") { setValue(String(bonus || 0)); setEditing(false); } }}
          style={{ ...inp, width: 64, fontSize: 11, padding: "2px 6px", textAlign: "center" }}
        />
      </div>
    );
  }
  if (!bonus || bonus === 0) {
    return (
      <button onClick={() => setEditing(true)} style={{
        marginTop: 4, fontSize: 9, fontWeight: 700, color: accent, background: "transparent",
        border: "1px dashed " + accent + "60", borderRadius: 6, padding: "1px 6px",
        cursor: "pointer", fontFamily: F,
      }}>+ bonus</button>
    );
  }
  const positive = bonus > 0;
  return (
    <button onClick={() => setEditing(true)} style={{
      marginTop: 4, fontSize: 10, fontWeight: 800,
      color: positive ? "#fff" : "#fff",
      background: positive ? accent : "#6b7280",
      border: "none", borderRadius: 999, padding: "2px 8px",
      cursor: "pointer", fontFamily: F,
    }}>{positive ? "+" : ""}{bonus} bonus</button>
  );
}

/* ─── TRIVIA PRESENTER VIEW ──────────────────────────────────────────
   Read-only big-screen projector display. Opened in a separate window via
   `?presenter=<gameId>&class=comm4` URL param. Routed from App.jsx (or
   the per-class entry component) when the param is present.

   Auto-refreshes from Supabase every 1 second so it stays in sync with
   admin actions and student submissions.
*/
export function TriviaPresenter({ gameId, classKey }) {
  const STORAGE_KEY = classKey === "comm118" ? "comm118-game-v14" : "comm4-v1";
  const [data, setData] = useState(null);
  const [pulseCount, setPulseCount] = useState(0); // for reveal pop animation

  React.useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    const load = async () => {
      try {
        const raw = await window.storage.get(STORAGE_KEY, true);
        if (!cancelled && raw?.value) setData(JSON.parse(raw.value));
      } catch(e) {}
    };
    load();
    const iv = setInterval(load, 1000);
    return () => { cancelled = true; clearInterval(iv); unsub(); };
  }, [STORAGE_KEY]);

  // Detect reveal change and bump pulse for the pop animation
  const prevRevealCountRef = React.useRef(0);
  const game = data?.triviaGames?.[gameId];
  React.useEffect(() => {
    const cur = (game?.revealedQs || []).length;
    if (cur > prevRevealCountRef.current) setPulseCount(p => p + 1);
    prevRevealCountRef.current = cur;
  }, [game?.revealedQs?.length]);

  if (!data) {
    return <div style={{ background: "#0f172a", color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 24 }}>Loading...</div>;
  }
  if (!game) {
    return <div style={{ background: "#0f172a", color: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 24 }}>Trivia game not found.</div>;
  }

  const TEAM_PALETTE = [
    { bg: "#fef2f2", accent: "#dc2626" },
    { bg: "#eff6ff", accent: "#2563eb" },
    { bg: "#ecfdf5", accent: "#059669" },
    { bg: "#fffbeb", accent: "#d97706" },
    { bg: "#f5f3ff", accent: "#7c3aed" },
    { bg: "#ecfeff", accent: "#0891b2" },
    { bg: "#fdf2f8", accent: "#db2777" },
    { bg: "#f7fee7", accent: "#65a30d" },
  ];
  const teamColor = (t) => TEAM_PALETTE[(t.colorIdx || 0) % TEAM_PALETTE.length];

  const questions = game.questions || [];
  const teams = game.teams || [];
  const openQs = game.openQs || [];
  const lockedQs = game.lockedQs || [];
  const revealedQs = game.revealedQs || [];
  const answers = game.answers || {};
  const defaultPts = game.defaultPointsPerQ || 5;

  const teamBonus = (teamId) => {
    const b = (game.bonusPoints?.teams || {})[teamId];
    return typeof b === "number" ? b : 0;
  };
  const teamTotal = (teamId) => {
    let total = teamBonus(teamId);
    revealedQs.forEach(qi => {
      const a = answers[teamId + "-" + qi];
      if (a && a.gradedCorrect === true) {
        const q = questions[qi];
        const pts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
        total += pts;
      }
    });
    return total;
  };
  const sortedTeams = [...teams].sort((a, b) => teamTotal(b.id) - teamTotal(a.id));

  // Determine current phase for main display
  const inProgress = [...openQs, ...lockedQs];
  const lastRevealedBatch = revealedQs.slice(-4);
  const isReveal = inProgress.length === 0 && revealedQs.length > 0 && revealedQs.length < questions.length;
  const isOpen = openQs.length > 0;
  const isLocked = openQs.length === 0 && lockedQs.length > 0;
  const isDone = revealedQs.length === questions.length && questions.length > 0;
  const isWaiting = !isOpen && !isLocked && !isReveal && !isDone;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "#fff", minHeight: "100vh", fontFamily: F,
      padding: "20px 28px", boxSizing: "border-box",
      display: "flex", flexDirection: "column",
    }}>
      {/* Title + standings strip */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.1em" }}>{game.title}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{revealedQs.length} of {questions.length} revealed</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {sortedTeams.map((t, idx) => {
          const pal = teamColor(t);
          return (
            <div key={t.id} style={{
              background: pal.accent, color: "#fff", borderRadius: 10,
              padding: "8px 14px", minWidth: 140,
              border: idx === 0 ? "3px solid #fbbf24" : "none",
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.8, letterSpacing: "0.05em" }}>#{idx + 1}{idx === 0 ? " 👑" : ""}</div>
              <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.05 }}>{t.name}</div>
              <div style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
                <PresenterCountUp value={teamTotal(t.id)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {isWaiting && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#fbbf24", textAlign: "center" }}>Get ready</div>
            <div style={{ fontSize: 20, color: "#94a3b8", marginTop: 8 }}>Next round opening soon...</div>
          </div>
        )}

        {isOpen && (
          <PresenterOpenView
            qs={openQs} questions={questions} teams={teams} answers={answers}
            defaultPts={defaultPts} teamColor={teamColor}
          />
        )}

        {isLocked && (
          <PresenterLockedView
            qs={lockedQs} questions={questions} teams={teams} answers={answers}
            defaultPts={defaultPts} teamColor={teamColor}
          />
        )}

        {isReveal && (
          <PresenterRevealView
            key={pulseCount}
            roundQs={lastRevealedBatch} questions={questions}
            teams={teams} answers={answers}
            defaultPts={defaultPts} teamColor={teamColor}
            sortedTeams={sortedTeams} teamTotal={teamTotal}
          />
        )}

        {isDone && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.1em", textTransform: "uppercase" }}>Final Standings</div>
            <div style={{ fontSize: 80, fontWeight: 900, color: "#fbbf24", marginTop: 8 }}>🏆 {sortedTeams[0]?.name}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginTop: 4 }}>{teamTotal(sortedTeams[0]?.id)} points</div>
          </div>
        )}

      </div>
    </div>
  );
}

// Presenter sub-views
function PresenterOpenView({ qs, questions, teams, answers, defaultPts, teamColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#22d3ee", textTransform: "uppercase", letterSpacing: "0.1em" }}>Now Answering</div>
      {qs.map(qi => {
        const q = questions[qi]; if (!q) return null;
        const qPts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
        const submittedTeams = teams.filter(t => answers[t.id + "-" + qi]?.text);
        const waitingTeams = teams.filter(t => !answers[t.id + "-" + qi]?.text);
        return (
          <div key={qi} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 24, border: "2px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8" }}>Q{qi + 1}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{qPts} pt{qPts !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>{q.text}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {submittedTeams.map(t => {
                const pal = teamColor(t);
                return (
                  <div key={t.id} style={{ background: pal.accent, color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 14, fontWeight: 700 }}>
                    ✓ {t.name}
                  </div>
                );
              })}
              {waitingTeams.map(t => (
                <div key={t.id} style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", fontSize: 14, fontWeight: 700 }}>
                  ... {t.name}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PresenterLockedView({ qs, questions, teams, answers, defaultPts, teamColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.1em" }}>Locked In · Grading</div>
      {qs.map(qi => {
        const q = questions[qi]; if (!q) return null;
        const qPts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
        return (
          <div key={qi} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 24, border: "2px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8" }}>Q{qi + 1}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>{qPts} pt{qPts !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>{q.text}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {teams.map(t => {
                const pal = teamColor(t);
                const a = answers[t.id + "-" + qi];
                const submitted = !!a?.text;
                const correct = a?.gradedCorrect === true;
                const incorrect = a?.gradedCorrect === false;
                return (
                  <div key={t.id} style={{
                    background: correct ? "#16a34a" : incorrect ? "#dc2626" : pal.accent,
                    color: "#fff", borderRadius: 10, padding: "10px 14px",
                    border: correct ? "3px solid #fbbf24" : "none",
                    transition: "all 0.4s",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.9 }}>{t.name}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, wordBreak: "break-word" }}>
                      {submitted ? a.text : <span style={{ opacity: 0.6 }}>(no answer)</span>}
                    </div>
                    {correct && <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4 }}>+{qPts}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PresenterRevealView({ roundQs, questions, teams, answers, defaultPts, teamColor, sortedTeams, teamTotal }) {
  const roundPts = (teamId) => {
    let total = 0;
    roundQs.forEach(qi => {
      const a = answers[teamId + "-" + qi];
      if (a && a.gradedCorrect === true) {
        const q = questions[qi];
        const pts = (q.pointsOverride !== null && q.pointsOverride !== undefined) ? q.pointsOverride : defaultPts;
        total += pts;
      }
    });
    return total;
  };
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#22d3ee", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Reveal</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: `200px repeat(${roundQs.length}, 1fr) 100px`,
        gap: 8, alignItems: "center", marginBottom: 8,
      }}>
        <div></div>
        {roundQs.map(qi => (
          <div key={qi} style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8", textAlign: "center" }}>Q{qi + 1}</div>
        ))}
        <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", textAlign: "right" }}>+ROUND</div>
      </div>
      {sortedTeams.map((t, idx) => {
        const pal = teamColor(t);
        const earned = roundPts(t.id);
        return (
          <div key={t.id} style={{
            display: "grid",
            gridTemplateColumns: `200px repeat(${roundQs.length}, 1fr) 100px`,
            gap: 8, alignItems: "stretch", marginBottom: 8,
            background: "rgba(255,255,255,0.06)", border: "2px solid " + pal.accent,
            borderRadius: 10, padding: 10,
          }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: pal.accent }}>#{idx + 1}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.05 }}>{t.name}</div>
            </div>
            {roundQs.map(qi => {
              const a = answers[t.id + "-" + qi];
              const correct = a?.gradedCorrect === true;
              const text = a?.text || "—";
              return (
                <div key={qi} style={{
                  background: correct ? "#16a34a" : "rgba(255,255,255,0.04)",
                  border: correct ? "3px solid #fbbf24" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "8px 10px",
                  fontSize: 14, fontWeight: correct ? 800 : 600,
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
                  wordBreak: "break-word",
                }}>{text}</div>
              );
            })}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 900, color: "#fbbf24", fontVariantNumeric: "tabular-nums",
            }}>+<PresenterCountUp value={earned} /></div>
          </div>
        );
      })}
    </div>
  );
}

function PresenterCountUp({ value }) {
  const [display, setDisplay] = useState(value);
  const lastRef = React.useRef(value);
  React.useEffect(() => {
    if (value === lastRef.current) return;
    const start = lastRef.current;
    const end = value;
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) { setDisplay(end); lastRef.current = end; return; }
      const t = elapsed / duration;
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{display}</span>;
}


export function Accolades({ data }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
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
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
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

/* ─── REBOUND / MAKEUP SYSTEM ─── */

const REBOUND_TIERS = [
  { max: 50, target: 60, label: "Under 50% -> can reach 60%" },
  { max: 65, target: 70, label: "50-65% -> can reach 70%" },
  { max: 79, target: 80, label: "66-79% -> can reach 80%" },
];

function getReboundTarget(gradePercent) {
  if (gradePercent < 50) return 60;
  if (gradePercent <= 65) return 70;
  if (gradePercent <= 79) return 80;
  return null;
}

const STATUS_COLORS = {
  present: { bg: "#fff", border: "#e5e5e4", label: "Present", color: TEXT_PRIMARY },
  rebound: { bg: "#fffbeb", border: "#f59e0b", label: "Rebound", color: "#92400e" },
  planned_makeup: { bg: "#ecfdf5", border: "#10b981", label: "Planned Makeup", color: "#065f46" },
  unannounced: { bg: "#fef2f2", border: "#ef4444", label: "Unannounced Absence", color: "#991b1b" },
  unannounced_override: { bg: "#fff7ed", border: "#f97316", label: "Unannounced (Override)", color: "#9a3412" },
};

export function ReboundPanel({ data, setData, activityType, week, isAdmin, userName }) {
  const { theme } = useTheme("comm4-v1");
  const crd = themedInteriorCrd(theme, 0);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const [reboundLink, setReboundLink] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);
  const [fbEditOpen, setFbEditOpen] = useState(false);
  const [fbEditVals, setFbEditVals] = useState({});

  // Save a single student's fishbowl score for this week. Touches only this
  // student: updates weeklyFishbowl[week].scores[sid] (what the gradebook cell
  // shows) and replaces only this student's "Fishbowl Wk<week>" log entry (what
  // the participation total counts). Leaves all other students, the star bonus,
  // and any Rebound/Makeup Fishbowl entries untouched.
  const saveFishbowlScore = async (studentId, rawVal) => {
    const newScore = Math.max(0, parseFloat(rawVal) || 0);
    const fbAll = data.weeklyFishbowl || {};
    const fbWeek = fbAll[week] || {};
    const newScores = { ...(fbWeek.scores || {}), [studentId]: newScore };
    const fbSource = "Fishbowl Wk" + week;
    const oldEntry = (data.log || []).find(e => e.studentId === studentId && e.source === fbSource);
    const newLog = (data.log || []).filter(e => !(e.studentId === studentId && e.source === fbSource));
    if (newScore > 0) {
      newLog.push({
        id: genId(),
        studentId,
        amount: newScore,
        source: fbSource,
        ts: oldEntry ? oldEntry.ts : Date.now(),
      });
    }
    const updated = {
      ...data,
      weeklyFishbowl: { ...fbAll, [week]: { ...fbWeek, scores: newScores } },
      log: newLog,
    };
    await saveData(updated); setData(updated);
    showMsg("Saved");
  };

  const rebounds = data.rebounds || {};
  const reboundKey = activityType + "-" + week;
  const reboundData = rebounds[reboundKey] || {};
  const statuses = reboundData.studentStatuses || {};
  const students = data.students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis");
  const sorted = [...students].sort(lastSortObj);
  const student = data.students.find(s => s.name === userName);
  const sid = student?.id;

  const maxPts = activityType === "game" ? 100 : 20;

  const getStudentScore = (s) => {
    if (activityType === "game") {
      const game = (data.weeklyGames || {})[week];
      if (!game?.scored) return null;
      let gamePts = 0, gradePts = 0;
      for (let q = 0; q < (game.questions || []).length; q++) {
        if (game.responses?.[s.id + "-" + q] === game.questions[q].correct) {
          gamePts += GAME_PTS;
          gradePts += GAME_GRADE_PTS[game.questions[q].category] || 0;
        }
      }
      return { gamePts, gradePts, gradePercent: Math.round(gradePts / 100 * 100), responded: Object.keys(game.responses || {}).some(k => k.startsWith(s.id)) };
    }
    if (activityType === "tot") {
      const tot = (data.weeklyToT || {})[week] || (data.weeklyToT || {})[String(week)];
      if (!tot?.scored) return null;
      const ptsEach = tot.questions.length > 0 ? 20 / tot.questions.length : 20;
      let pts = 0;
      tot.questions.forEach((q, qi) => {
        if (tot.responses?.[s.id + "-" + qi] === q.correct) pts += ptsEach;
      });
      const score = Math.round(pts * 10) / 10;
      return { gamePts: score, gradePts: score, gradePercent: Math.round(score / 20 * 100), responded: Object.keys(tot.responses || {}).some(k => k.startsWith(s.id)) };
    }
    if (activityType === "fishbowl") {
      const fb = (data.weeklyFishbowl || {})[week];
      if (!fb?.confirmed) return null;
      const pts = fb.scores?.[s.id] ?? 0;
      return { gamePts: pts, gradePts: pts, gradePercent: Math.round(pts / 20 * 100), responded: true };
    }
    return null;
  };

  const allScores = sorted.map(s => { const r = getStudentScore(s); return r ? r.gamePts : 0; });
  const classAvg = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0;

  const isScored = activityType === "game" ? (data.weeklyGames || {})[week]?.scored
    : activityType === "tot" ? ((data.weeklyToT || {})[week] || (data.weeklyToT || {})[String(week)])?.scored
    : (data.weeklyFishbowl || {})[week]?.confirmed;

  if (!isScored) return null;

  const scoredTs = reboundData.scoredTs || Date.now();
  const reboundDeadline = scoredTs + 48 * 60 * 60 * 1000;
  const makeupDeadline = scoredTs + 7 * 24 * 60 * 60 * 1000;
  const reboundOpen = Date.now() < reboundDeadline;
  const makeupOpen = Date.now() < makeupDeadline;
  const reboundHoursLeft = Math.max(0, Math.round((reboundDeadline - Date.now()) / (1000 * 60 * 60)));
  const makeupDaysLeft = Math.max(0, Math.round((makeupDeadline - Date.now()) / (1000 * 60 * 60 * 24)));

  const ensureScoredTs = async () => {
    if (!reboundData.scoredTs) {
      const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, scoredTs: Date.now() } } };
      await saveData(updated); setData(updated);
    }
  };
  if (!reboundData.scoredTs && isScored) ensureScoredTs();

  const setStudentStatus = async (studentId, status) => {
    const ss = { ...statuses, [studentId]: { ...(statuses[studentId] || {}), status } };
    const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, studentStatuses: ss } } };
    await saveData(updated); setData(updated); showMsg("Set: " + STATUS_COLORS[status].label);
  };

  const approveRebound = async (studentId) => {
    const result = getStudentScore(data.students.find(s => s.id === studentId));
    if (!result) return;
    const ss = statuses[studentId] || {};
    const status = ss.status || "present";
    const gradeOnly = status === "rebound" || status === "unannounced_override";

    // Grade-only path for weekly games: write to data.reboundGrades (does NOT touch log or leaderboard)
    if (gradeOnly && activityType === "game") {
      const originalGradePts = result.gradePts || 0;
      let cap;
      if (status === "unannounced_override") cap = 60;
      else if (originalGradePts < 50) cap = 60;
      else if (originalGradePts <= 65) cap = 70;
      else if (originalGradePts <= 79) cap = 80;
      else { showMsg("Not eligible (already 80%+)"); return; }

      const inputPts = ss.customPts !== undefined ? ss.customPts : cap;
      if (inputPts <= originalGradePts) { showMsg("Must exceed original grade of " + originalGradePts); return; }
      const cappedPts = Math.min(inputPts, cap);

      const rgKey = studentId + "-game-" + week;
      const rgType = status === "unannounced_override" ? "absence_override" : "rebound";
      const reboundGrades = { ...(data.reboundGrades || {}), [rgKey]: {
        gradePoints: cappedPts, type: rgType, enteredTs: Date.now(), enteredBy: userName || "Admin",
      }};
      const newSS = { ...statuses, [studentId]: { ...ss, approved: true, reboundGradePts: cappedPts, gradeOnly: true } };
      const updated = { ...data, reboundGrades, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, studentStatuses: newSS } } };
      await saveData(updated); setData(updated); showMsg("Rebound grade set: " + cappedPts + " / 100");
      return;
    }

    // Legacy game-points path: used for planned_makeup (all activity types) and for ToT/Fishbowl rebounds (not scoped in this rework)
    let targetPts;
    if (status === "planned_makeup") {
      targetPts = maxPts;
    } else {
      const targetPercent = getReboundTarget(result.gradePercent);
      if (!targetPercent) { showMsg("Not eligible"); return; }
      targetPts = Math.round(maxPts * targetPercent / 100 * 10) / 10;
    }
    let reboundPts = Math.round(Math.max(0, targetPts - result.gamePts) * 10) / 10;
    if (ss.customPts !== undefined) reboundPts = ss.customPts;
    if (reboundPts <= 0) { showMsg("No points to award"); return; }

    const source = (gradeOnly ? "Rebound " : "Makeup ") + (activityType === "game" ? "Game" : activityType === "tot" ? "ToT" : "Fishbowl") + " Wk" + week;
    const entry = { id: genId(), studentId, amount: reboundPts, source, ts: Date.now(), gradeOnly: gradeOnly || undefined };
    const newSS = { ...statuses, [studentId]: { ...ss, approved: true, reboundPts, gradeOnly } };
    const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, studentStatuses: newSS } }, log: [...data.log, entry] };
    await saveData(updated); setData(updated); showMsg((gradeOnly ? "Rebound" : "Makeup") + " +" + reboundPts);
  };

  const setCustomPts = async (studentId, pts) => {
    const ss = { ...statuses, [studentId]: { ...(statuses[studentId] || {}), customPts: parseFloat(pts) || 0 } };
    const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, studentStatuses: ss } } };
    await saveData(updated); setData(updated);
  };

  const submitRebound = async () => {
    if (!reboundLink.trim() || !sid) return;
    const ss = { ...statuses, [sid]: { ...(statuses[sid] || {}), link: reboundLink.trim(), linkTs: Date.now() } };
    const updated = { ...data, rebounds: { ...rebounds, [reboundKey]: { ...reboundData, studentStatuses: ss } } };
    await saveData(updated); setData(updated);
    setReboundLink(""); showMsg("Submitted! Your instructor will review.");
  };

  const actLabel = activityType === "game" ? "Weekly Game" : activityType === "tot" ? "This or That" : "Fishbowl";

  const policyText = `Planned Makeup: You had an excused absence. Retake the activity live during office hours within one week. Full points available for both leaderboard and grade.

Unannounced Absence: You missed without notice. By default, no makeup available. Your instructor may grant an override, in which case you can submit a rebound video. Points count for grade only, not leaderboard.

Rebound: You were present but scored below 80%. Submit a video of you explaining the material with a friend or family member within 48 hours. Points count for grade only, not leaderboard.
  Under 50% -> can earn back to 60%
  50-65% -> can earn back to 70%
  66-79% -> can earn back to 80%`;

  // ─── ADMIN VIEW ───
  if (isAdmin) {
    return (
      <div style={{ marginTop: 16 }}>
        <Toast message={msg} />
        <div style={{ ...crd, padding: 16 }}>
          <div style={{ ...sectionLabel, marginBottom: 4 }}>Results and Makeups</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 4 }}>
            Class average: <strong>{classAvg}</strong> / {maxPts} | Rebound: {reboundOpen ? reboundHoursLeft + "h left" : "Closed"} | Makeup: {makeupOpen ? makeupDaysLeft + "d left" : "Closed"}
          </div>
          <button onClick={() => setShowPolicy(!showPolicy)} style={{ fontSize: 11, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600, padding: 0, marginBottom: 10 }}>{showPolicy ? "Hide Policy" : "View Policy"}</button>
          {showPolicy && <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: 12, background: "#f9fafb", borderRadius: 8, marginBottom: 12, border: "1px solid " + BORDER }}>{policyText}</div>}

          {activityType === "fishbowl" && (
            <div style={{ marginBottom: 12, padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid " + BORDER }}>
              <button onClick={() => setFbEditOpen(!fbEditOpen)} style={{ fontSize: 12, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 700, padding: 0 }}>
                {fbEditOpen ? "Hide Score Editor" : "Edit Individual Scores"}
              </button>
              {fbEditOpen && (
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 4 }}>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>
                    Change one student's fishbowl score for Week {week}. Saving updates only that student. Out of {maxPts}.
                  </div>
                  {sorted.map(s => {
                    const cur = (data.weeklyFishbowl || {})[week]?.scores?.[s.id] ?? 0;
                    const val = fbEditVals[s.id] !== undefined ? fbEditVals[s.id] : cur;
                    return (
                      <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "#fff", borderRadius: 6, border: "1px solid " + BORDER }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, flex: 1 }}>{s.name}</span>
                        <input
                          type="number"
                          value={val}
                          onChange={e => setFbEditVals(prev => ({ ...prev, [s.id]: e.target.value }))}
                          style={{ ...inp, width: 64, fontSize: 13, textAlign: "center", padding: "4px" }}
                        />
                        <span style={{ fontSize: 12, color: TEXT_MUTED }}>/ {maxPts}</span>
                        <button
                          onClick={async () => { await saveFishbowlScore(s.id, val); setFbEditVals(prev => { const n = { ...prev }; delete n[s.id]; return n; }); }}
                          style={{ ...pill, background: GREEN, color: "#fff", fontSize: 12, padding: "4px 12px" }}
                        >Save</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
            {sorted.map(s => {
              const result = getStudentScore(s);
              const score = result ? result.gamePts : 0;
              const gradePts = result ? result.gradePts : 0;
              const gradePercent = result ? result.gradePercent : 0;
              const responded = result ? result.responded : false;
              const missed = !responded && activityType !== "fishbowl";
              const ss = statuses[s.id] || {};
              const status = ss.status || (missed ? "" : gradePercent < 80 ? "" : "present");
              const sc = STATUS_COLORS[status] || STATUS_COLORS.present;

              const targetPercent = getReboundTarget(gradePercent);
              let targetPts, defaultRebound;
              if (status === "planned_makeup") {
                targetPts = maxPts;
                defaultRebound = Math.round(Math.max(0, maxPts - score) * 10) / 10;
              } else {
                targetPts = targetPercent ? Math.round(maxPts * targetPercent / 100 * 10) / 10 : 0;
                defaultRebound = Math.round(Math.max(0, targetPts - score) * 10) / 10;
              }
              const reboundPts = ss.customPts !== undefined ? ss.customPts : defaultRebound;
              const eligible = (status === "planned_makeup" || targetPercent !== null) && !ss.approved;

              // Grade-points path (only applies to weekly game rebound/override)
              const isGameGradePath = activityType === "game" && (status === "rebound" || status === "unannounced_override");
              const origGradePts = gradePts;
              let gradeCap;
              if (status === "unannounced_override") gradeCap = 60;
              else if (origGradePts < 50) gradeCap = 60;
              else if (origGradePts <= 65) gradeCap = 70;
              else if (origGradePts <= 79) gradeCap = 80;
              else gradeCap = 100;
              const defaultGradeInput = ss.customPts !== undefined ? ss.customPts : gradeCap;

              return (
                <div key={s.id} style={{ padding: "10px 12px", borderRadius: 10, background: ss.approved ? "#ecfdf5" : sc.bg, borderLeft: "4px solid " + (ss.approved ? GREEN : sc.border) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{s.name}</span>
                      {missed && !status && <span style={{ fontSize: 11, fontWeight: 600, color: RED, marginLeft: 6 }}>MISSED</span>}
                      {status && <span style={{ fontSize: 11, fontWeight: 600, color: sc.color, marginLeft: 6 }}>{sc.label}</span>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: gradePercent >= 80 ? GREEN : gradePercent === 0 ? RED : "#d97706" }}>{gradePercent}%<span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}> grade</span></div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED }}>{score}/{maxPts} game</div>
                    </div>
                  </div>

                  {/* Status selector */}
                  {!ss.approved && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + BORDER }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                        {Object.entries(STATUS_COLORS).map(([key, val]) => (
                          <button key={key} onClick={() => setStudentStatus(s.id, key)} style={{
                            ...pill, fontSize: 10, padding: "3px 8px",
                            background: status === key ? val.border : "transparent",
                            color: status === key ? "#fff" : val.color,
                            border: "1px solid " + val.border,
                          }}>{val.label}</button>
                        ))}
                      </div>

                      {/* Rebound video link */}
                      {ss.link && (
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 2 }}>Rebound video:</div>
                          <a href={ss.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#2563eb", wordBreak: "break-all" }}>{ss.link}</a>
                          <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>Submitted {new Date(ss.linkTs).toLocaleString()}</div>
                        </div>
                      )}

                      {/* Points + approve: grade-points path for game rebound/override */}
                      {eligible && isGameGradePath && (
                        <div>
                          <div style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 4 }}>
                            Original grade: <strong>{origGradePts}</strong> / 100 | Cap: <strong>{gradeCap}</strong> / 100 {status === "unannounced_override" ? "(absence override: lowest tier)" : ""}
                          </div>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: TEXT_MUTED }}>Rebound grade:</span>
                            <input type="number" defaultValue={defaultGradeInput} onBlur={e => setCustomPts(s.id, e.target.value)} style={{ ...inp, width: 60, fontSize: 13, textAlign: "center", padding: "4px" }} />
                            <span style={{ fontSize: 12, color: TEXT_MUTED }}>/ 100 grade pts</span>
                            <button onClick={() => approveRebound(s.id)} style={{ ...pill, background: GREEN, color: "#fff", fontSize: 12, marginLeft: "auto" }}>Apply Grade</button>
                          </div>
                        </div>
                      )}

                      {/* Points + approve: legacy game-points path (planned_makeup, or ToT/Fishbowl) */}
                      {eligible && !isGameGradePath && (status === "rebound" || status === "unannounced_override" || status === "planned_makeup") && (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: TEXT_MUTED }}>{status === "planned_makeup" ? "Makeup" : "Rebound"}:</span>
                          <input type="number" defaultValue={reboundPts} onBlur={e => setCustomPts(s.id, e.target.value)} style={{ ...inp, width: 60, fontSize: 13, textAlign: "center", padding: "4px" }} />
                          <span style={{ fontSize: 12, color: TEXT_MUTED }}>pts{status !== "planned_makeup" && targetPercent ? " (to " + targetPercent + "%)" : ""}</span>
                          {(ss.link || status === "planned_makeup") && (
                            <button onClick={() => approveRebound(s.id)} style={{ ...pill, background: GREEN, color: "#fff", fontSize: 12, marginLeft: "auto" }}>Apply Points</button>
                          )}
                        </div>
                      )}

                      {/* Unannounced: no override yet */}
                      {status === "unannounced" && (
                        <div style={{ fontSize: 12, color: RED, fontStyle: "italic" }}>Makeup unavailable. Set to "Override" to allow rebound.</div>
                      )}
                    </div>
                  )}

                  {ss.approved && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: GREEN, marginTop: 4 }}>
                      {ss.reboundGradePts !== undefined
                        ? "Rebound grade applied: " + ss.reboundGradePts + " / 100 (grade only)"
                        : (ss.gradeOnly ? "Rebound" : "Makeup") + " applied: +" + ss.reboundPts + " pts " + (ss.gradeOnly ? "(grade only)" : "(leaderboard + grade)")}
                    </div>
                  )}
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
  const myScore = myResult ? myResult.gamePts : 0;
  const myGradePercent = myResult ? myResult.gradePercent : 0;
  const mySS = statuses[sid] || {};
  const myStatus = mySS.status || "";
  const myTargetPercent = getReboundTarget(myGradePercent);
  const eligible = myTargetPercent !== null && !mySS.approved;

  const canSubmitRebound = (myStatus === "rebound" || myStatus === "unannounced_override") && reboundOpen && !mySS.link && eligible;
  const waitingMakeup = myStatus === "planned_makeup" && makeupOpen && !mySS.approved;
  const showReboundSubmitted = (myStatus === "rebound" || myStatus === "unannounced_override") && mySS.link && !mySS.approved;

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

        {mySS.approved && (
          <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf5", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>{mySS.gradeOnly ? "Rebound" : "Makeup"} approved: +{mySS.reboundPts} pts</div>
          </div>
        )}

        {/* Unannounced, no override */}
        {myStatus === "unannounced" && !mySS.approved && (
          <div style={{ padding: 12, borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>Makeup Unavailable</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>Your absence was unannounced. Contact your instructor if you believe this is an error.</div>
          </div>
        )}

        {/* Approved makeup waiting */}
        {waitingMakeup && (
          <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#065f46", marginBottom: 4 }}>Planned Makeup</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5 }}>Come to office hours to retake this activity. You have <strong>{makeupDaysLeft} days</strong> left. Full points available.</div>
          </div>
        )}

        {/* Rebound available */}
        {canSubmitRebound && (
          <div style={{ padding: 12, borderRadius: 10, background: "#fffbeb", border: "1px solid #fef3c7", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>Rebound Available</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.5, marginBottom: 6 }}>
              Your grade was {myGradePercent}%. You can earn back to {myTargetPercent}% by submitting a video of you explaining the material with a friend or family member.
              {" "}You have <strong>{reboundHoursLeft} hours</strong> left to submit. Points count for your grade only.
            </div>
            <button onClick={() => setShowPolicy(!showPolicy)} style={{ fontSize: 11, color: ACCENT, background: "none", border: "none", cursor: "pointer", fontFamily: F, fontWeight: 600, padding: 0, marginBottom: 6 }}>{showPolicy ? "Hide Policy" : "View Full Policy"}</button>
            {showPolicy && <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: "pre-wrap", padding: 10, background: "#f9fafb", borderRadius: 8, marginBottom: 8, border: "1px solid " + BORDER }}>{policyText}</div>}
            <div style={{ display: "flex", gap: 6 }}>
              <input value={reboundLink} onChange={e => setReboundLink(e.target.value)} placeholder="Paste your video link here..." style={{ ...inp, flex: 1, fontSize: 13 }} />
              <button onClick={submitRebound} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Submit</button>
            </div>
          </div>
        )}

        {showReboundSubmitted && (
          <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf5", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>Rebound submitted! Waiting for instructor review.</div>
          </div>
        )}

        {eligible && (myStatus === "rebound" || myStatus === "unannounced_override") && !reboundOpen && !mySS.link && (
          <div style={{ fontSize: 13, color: TEXT_MUTED, fontStyle: "italic", marginBottom: 12 }}>Rebound window has closed.</div>
        )}
      </div>
    </div>
  );
}
