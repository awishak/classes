// What a game does to a class, as functions rather than as button handlers.
//
// The game system came across from the forks as four thousand lines of screen,
// with every rule about what a game is worth living inside a click handler. So
// the rules could only be checked by clicking, and nothing checked them: three
// forked copies ran a term of games with no test between them, and the accolades
// panel shipped a crash that had been sitting in both big copies the whole time.
//
// These are the transitions a game makes: open one, take an answer, score it,
// and work out who got everything right. Each takes the class store and hands
// back a new one, so the build can play a whole game through and read the
// gradebook afterwards.
//
// The screens call these functions. Nothing here touches storage or React.

import { genId } from "../utils.jsx";

// A right answer in the weekly game is ten points. Ten on Ten splits twenty
// points across however many questions the week has, which is where the odd
// decimals in the log come from.
export const GAME_PTS = 10;
export const KINDS = {
  game: { store: "weeklyGames", source: (w) => "Game Wk" + w, rebound: (w) => "game-" + w },
  tot: { store: "weeklyToT", source: (w) => "ToT Wk" + w, rebound: (w) => "tot-" + w },
};

const kindOf = (kind) => KINDS[kind] || KINDS.game;
const weeksOf = (data, kind) => data?.[kindOf(kind).store] || {};

// What one question is worth in this kind of game.
export const perQuestion = (kind, questions) => {
  if (kind !== "tot") return GAME_PTS;
  const n = (questions || []).length;
  return n > 0 ? 20 / n : 20;
};

// Written but not yet open to the room.
export function saveWeek(data, kind, week, questions) {
  const k = kindOf(kind);
  const all = weeksOf(data, kind);
  return { ...data, [k.store]: { ...all, [week]: { ...(all[week] || {}), week, questions, scored: false } } };
}

// Open to the room.
export function openWeek(data, kind, week) {
  const k = kindOf(kind);
  const all = weeksOf(data, kind);
  const w = all[week];
  if (!w) return data;
  return { ...data, [k.store]: { ...all,
    [week]: { ...w, phase: "live", active: true, scored: false, currentQ: 0, lockedQs: [], countdown: null } } };
}

// One answer from one student. Answers are keyed by student and question index,
// which is the shape every screen in the game system already reads.
export function answerWeek(data, kind, week, studentId, qi, choice) {
  const k = kindOf(kind);
  const all = weeksOf(data, kind);
  const w = all[week];
  if (!w || w.phase !== "live") return data;
  const responses = { ...(w.responses || {}), [studentId + "-" + qi]: choice };
  return { ...data, [k.store]: { ...all, [week]: { ...w, responses } } };
}

// What each student scored, before any of it reaches the log.
export function scoresFor(data, kind, week) {
  const w = weeksOf(data, kind)[week];
  const out = {};
  if (!w) return out;
  const qs = w.questions || [];
  const each = perQuestion(kind, qs);
  (data?.students || []).forEach(s => {
    let pts = 0;
    qs.forEach((q, qi) => { if (w.responses?.[s.id + "-" + qi] === q.correct) pts += each; });
    out[s.id] = Math.round(pts * 10) / 10;
  });
  return out;
}

// Score the week and put the points in the log the gradebook reads.
//
// Scoring twice has to be safe, because I score a week, a student turns up with
// a makeup, and I score the same week again. A student whose score has not
// moved keeps the entry they have, timestamp and all; a student whose score has
// moved has their old entry replaced rather than added to. The timestamp is the
// one from the first scoring, so a makeup graded in week nine does not land in
// week nine's leaderboard.
export function scoreWeek(data, kind, week, now) {
  const k = kindOf(kind);
  const all = weeksOf(data, kind);
  const w = all[week];
  if (!w) return data;

  const scores = scoresFor(data, kind, week);
  const source = k.source(week);
  const rebounds = data.rebounds || {};
  const rKey = k.rebound(week);
  const at = rebounds[rKey]?.scoredTs || now || Date.now();

  const log = data.log || [];
  const existing = log.filter(e => e.source === source);
  const entries = [];
  (data.students || []).forEach(s => {
    const pts = scores[s.id] || 0;
    const had = existing.find(e => e.studentId === s.id);
    if (had && had.amount === pts) return;          // nothing moved
    if (pts > 0) entries.push({ id: genId(), studentId: s.id, amount: pts, source, ts: at });
  });
  const kept = log.filter(e => !(e.source === source && entries.find(n => n.studentId === e.studentId)));

  return {
    ...data,
    [k.store]: { ...all, [week]: { ...w, scored: true, active: false, phase: "done" } },
    log: [...kept, ...entries],
    rebounds: { ...rebounds, [rKey]: { ...(rebounds[rKey] || {}), scoredTs: at } },
  };
}

// Everyone who got a whole scored game right, oldest week first.
//
// Counted over the questions the game has. Both forks walked ten indices and
// read the tenth question with no guard, which held only while every game was
// exactly ten questions written by hand. Games are built off the question bank
// now and come in other lengths.
export function perfectRuns(data) {
  const out = [];
  Object.entries(data?.weeklyGames || {}).forEach(([w, game]) => {
    if (!game.scored) return;
    const qs = game.questions || [];
    if (!qs.length) return;
    (data?.students || []).forEach(s => {
      const right = qs.filter((q, i) => game.responses?.[s.id + "-" + i] === q.correct).length;
      if (right === qs.length) out.push({ week: parseInt(w, 10), student: s });
    });
  });
  return out.sort((a, b) => a.week - b.week);
}

// What one student has, out of the log, which is what the gradebook adds up.
export const pointsOf = (log, studentId) =>
  (log || []).filter(e => e.studentId === studentId).reduce((n, e) => n + e.amount, 0);
