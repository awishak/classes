// Headlines. Students bring real sports headlines; the room reads each one
// twice — first for what it looks like on the surface, then for the course
// concept actually at work underneath. The gap between those two reads is the
// whole point of the exercise.
//
// A session runs one headline at a time through three phases:
//   surface  → students pick the categories they think apply, I reveal the real ones
//   concept  → students pick the concepts at work, I reveal those
//   done     → both reads are stamped onto the headline and kept
//
// State at `${storageKey}-headlines`:
//   { categories: [str], concepts: [{id,name,...}], items: [...], sessions: [...] }
//   item:    { id, text, url, submittedBy, sessionId, ts, realCategories, realConcepts, notes }
//   session: { id, name, ts, activeId, phase, realCategories, realConcepts, votes, conceptVotes }
//   votes are { [studentName]: [category, ...] } — picking more than one is allowed.

import { useState, useEffect, useCallback, useRef } from "react";
import { genId } from "../utils.jsx";

export const headlinesKey = (storageKey) => storageKey + "-headlines";
export const EMPTY_HL = { categories: [], concepts: [], items: [], sessions: [] };

export const liveSession = (hl) => (hl?.sessions || []).find(s => s.phase !== "done" && s.open !== false) || null;
export const activeItem = (hl, session) => session?.activeId ? (hl.items || []).find(i => i.id === session.activeId) : null;

// Counts across a { name: [picks] } map, plus how many people answered at all.
export function pickTally(votes) {
  const counts = {};
  let voters = 0;
  Object.values(votes || {}).forEach(picks => {
    voters++;
    (Array.isArray(picks) ? picks : [picks]).forEach(p => { counts[p] = (counts[p] || 0) + 1; });
  });
  return { counts, voters };
}

export function useHeadlines(storageKey, seed) {
  const key = headlinesKey(storageKey);
  const [hl, setHl] = useState(null);
  const pending = useRef(0);
  const ref = useRef(EMPTY_HL);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(key, true);
        const v = { ...EMPTY_HL, ...(r ? JSON.parse(r.value) : {}) };
        if (!v.categories.length && seed?.categories) v.categories = seed.categories;
        if (!v.concepts.length && seed?.concepts) v.concepts = seed.concepts;
        if (!alive) return;
        ref.current = v; setHl(v);
      } catch { if (alive) { ref.current = EMPTY_HL; setHl(EMPTY_HL); } }
    })();
    const off = window.storage?.onUpdate?.(key, (val) => {
      if (pending.current > 0) return;   // our own write coming back
      try { const v = { ...EMPTY_HL, ...JSON.parse(val) }; ref.current = v; setHl(v); } catch { /* ignore */ }
    });
    return () => { alive = false; if (off) off(); };
  }, [key]);

  const write = useCallback((patch) => {
    const next = { ...ref.current, ...patch };
    ref.current = next; setHl(next);
    pending.current++;
    Promise.resolve(window.storage.set(key, JSON.stringify(next), true)).catch(() => {}).finally(() => { pending.current--; });
    return next;
  }, [key]);

  const patchSession = useCallback((id, fn) =>
    write({ sessions: (ref.current.sessions || []).map(s => s.id === id ? fn(s) : s) }), [write]);

  const api = {
    // ── instructor ──
    openSession: () => {
      const s = { id: genId(), name: "Session " + ((ref.current.sessions || []).length + 1), ts: Date.now(),
        activeId: null, phase: "surface", realCategories: [], realConcepts: [], votes: {}, conceptVotes: {} };
      write({ sessions: [...(ref.current.sessions || []), s] });
      return s.id;
    },
    activate: (sid, itemId) => patchSession(sid, s => ({
      ...s, activeId: itemId, phase: "surface", realCategories: [], realConcepts: [], votes: {}, conceptVotes: {},
    })),
    revealSurface: (sid, real) => patchSession(sid, s => ({ ...s, phase: "concept", realCategories: real })),
    revealConcept: (sid, real) => {
      const s = (ref.current.sessions || []).find(x => x.id === sid);
      if (!s) return;
      write({
        items: (ref.current.items || []).map(it => it.id === s.activeId
          ? { ...it, realCategories: s.realCategories, realConcepts: real, surfaceVotes: s.votes, conceptVotes: s.conceptVotes }
          : it),
        sessions: (ref.current.sessions || []).map(x => x.id === sid ? { ...x, phase: "done", realConcepts: real } : x),
      });
    },
    closeSession: (sid) => patchSession(sid, s => ({ ...s, phase: "done", open: false, activeId: null })),
    addCategory: (name) => {
      const c = (name || "").trim();
      if (!c || (ref.current.categories || []).includes(c)) return;
      write({ categories: [...(ref.current.categories || []), c] });
    },

    // ── students ──
    submit: (sessionId, text, url, who) => {
      if (!text.trim()) return;
      write({ items: [...(ref.current.items || []),
        { id: genId(), text: text.trim(), url: (url || "").trim(), submittedBy: who, sessionId, ts: Date.now() }] });
    },
    lockIn: (sid, who, picks, which) => patchSession(sid, s => ({
      ...s, [which]: { ...(s[which] || {}), [who]: picks },
    })),
  };

  return { hl, ...api };
}
