// Live poll — Peer Instruction, the way Mazur runs it.
//
//   ask  →  everyone commits alone  →  they argue  →  they commit again  →  show
//           what moved
//
// The point is the second vote. Students seeing the room change its mind is the
// part that lands, so the room screen holds both rounds side by side at the end.
// Aim for a question 35-70% get right first time; below that the argument dies.
//
// State at `${storageKey}-poll`:
//   { id, question, options, phase, r1, r2, correct, at, past: [...] }
//   phase: "idle" | "vote1" | "discuss" | "vote2" | "done"
//   r1/r2: { [studentName]: optionIndex }
//
// The poll that is running sits at the top of the object, which is where every
// reader has always looked, and the ones that have finished sit under `past`.
// The store held one poll and overwrote it on the next question, so a term of
// polls left nothing behind: what a room believed in week two, and what
// changed their minds, was gone the moment I asked the next question. A poll
// is archived when the next one starts and when the floor is cleared, never
// while the poll is live.

import { useState, useEffect, useCallback, useRef } from "react";

export const pollKey = (storageKey) => storageKey + "-poll";

export const EMPTY_POLL = { id: null, question: "", options: [], phase: "idle", r1: {}, r2: {}, correct: null, at: 0 };

// A poll worth keeping is one that was asked and answered. A question typed
// and abandoned before anybody voted is not history, it is a false start.
export const worthKeeping = (p) =>
  !!(p && p.question && (Object.keys(p.r1 || {}).length || Object.keys(p.r2 || {}).length));

// Every finished poll, newest first.
export const pastPolls = (poll) =>
  (poll?.past || []).slice().sort((a, b) => (b.at || 0) - (a.at || 0));

// The archive as it would be with the current poll folded in. The archive does
// not carry itself, so `past` comes off the poll before the poll goes in, and
// a poll already kept is not kept twice.
export function archived(prev) {
  const past = prev?.past || [];
  if (!worthKeeping(prev) || past.some(p => p.id === prev.id)) return past;
  const done = { ...prev };
  delete done.past;
  return [...past, { ...done, phase: "done", endedAt: Date.now() }];
}

// No options means they write their own answer.
export const isFreeForm = (poll) => !((poll?.options || []).length);

// Which round a vote lands in, or null when the floor is closed.
export const openRound = (poll) =>
  poll?.phase === "vote1" ? "r1" : poll?.phase === "vote2" ? "r2" : null;

// What people wrote, most repeated first, with who said it.
export function written(votes) {
  const out = [];
  Object.entries(votes || {}).forEach(([who, v]) => {
    if (typeof v !== "string" || !v.trim()) return;
    out.push({ who, text: v.trim() });
  });
  return out;
}

export function tally(votes, optionCount) {
  const counts = new Array(optionCount).fill(0);
  Object.values(votes || {}).forEach(i => { if (typeof i === "number" && i >= 0 && i < optionCount) counts[i]++; });
  const total = counts.reduce((a, b) => a + b, 0);
  return { counts, total };
}

export function usePoll(storageKey) {
  const key = pollKey(storageKey);
  const [poll, setPoll] = useState(null);
  const pending = useRef(0);
  const ref = useRef(EMPTY_POLL);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(key, true);
        const v = r ? { ...EMPTY_POLL, ...JSON.parse(r.value) } : EMPTY_POLL;
        if (!alive) return;
        ref.current = v; setPoll(v);
      } catch { if (alive) { ref.current = EMPTY_POLL; setPoll(EMPTY_POLL); } }
    })();
    const off = window.storage?.onUpdate?.(key, (val) => {
      if (pending.current > 0) return;   // our own write coming back
      try { const v = { ...EMPTY_POLL, ...JSON.parse(val) }; ref.current = v; setPoll(v); } catch { /* ignore */ }
    });
    return () => { alive = false; if (off) off(); };
  }, [key]);

  const write = useCallback((patch) => {
    const next = { ...ref.current, ...patch, at: Date.now() };
    ref.current = next;
    setPoll(next);
    pending.current++;
    Promise.resolve(window.storage.set(key, JSON.stringify(next), true)).catch(() => {}).finally(() => { pending.current--; });
    return next;
  }, [key]);

  const start = useCallback((question, options) => write({
    past: archived(ref.current),
    id: "p" + Date.now(), question, options, phase: "vote1", r1: {}, r2: {}, correct: null,
  }), [write]);

  const setPhase = useCallback((phase) => write({ phase }), [write]);
  const setCorrect = useCallback((i) => write({ correct: i }), [write]);
  // Clearing the floor puts the question away rather than throwing it away.
  const clear = useCallback(() => write({ ...EMPTY_POLL, past: archived(ref.current) }), [write]);

  // One vote per student per round; changing your mind before the round closes
  // is fine, and is part of the point.
  // An answer is an option index on a normal poll and the student's own words
  // on a free-form one. Both go in the same place; the reader tells them apart
  // by type rather than by asking the poll.
  const vote = useCallback((student, answer) => {
    const round = openRound(ref.current);
    if (!round) return false;
    write({ [round]: { ...(ref.current[round] || {}), [student]: answer } });
    return true;
  }, [write]);

  return { poll, start, setPhase, setCorrect, clear, vote };
}
