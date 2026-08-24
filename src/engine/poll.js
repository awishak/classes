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
//   { id, question, options, phase, r1, r2, correct, at }
//   phase: "idle" | "vote1" | "discuss" | "vote2" | "done"
//   r1/r2: { [studentName]: optionIndex }

import { useState, useEffect, useCallback, useRef } from "react";

export const pollKey = (storageKey) => storageKey + "-poll";

export const EMPTY_POLL = { id: null, question: "", options: [], phase: "idle", r1: {}, r2: {}, correct: null, at: 0 };

// Which round a vote lands in, or null when the floor is closed.
export const openRound = (poll) =>
  poll?.phase === "vote1" ? "r1" : poll?.phase === "vote2" ? "r2" : null;

export function tally(votes, optionCount) {
  const counts = new Array(optionCount).fill(0);
  Object.values(votes || {}).forEach(i => { if (i >= 0 && i < optionCount) counts[i]++; });
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
    id: "p" + Date.now(), question, options, phase: "vote1", r1: {}, r2: {}, correct: null,
  }), [write]);

  const setPhase = useCallback((phase) => write({ phase }), [write]);
  const setCorrect = useCallback((i) => write({ correct: i }), [write]);
  const clear = useCallback(() => write(EMPTY_POLL), [write]);

  // One vote per student per round; changing your mind before the round closes
  // is fine, and is part of the point.
  const vote = useCallback((student, optionIndex) => {
    const round = openRound(ref.current);
    if (!round) return false;
    write({ [round]: { ...(ref.current[round] || {}), [student]: optionIndex } });
    return true;
  }, [write]);

  return { poll, start, setPhase, setCorrect, clear, vote };
}
