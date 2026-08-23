// The cast bus. The Dashboard writes what is on the classroom screen right now;
// Classroom View reads it and renders it. Both sides ride the same Supabase
// realtime channel the rest of the engine uses, on their own key so a cast
// never fights a day-plan edit for the same row.
//
// Live state at `${storageKey}-live`:
//   { cast, anim, bigAnim, n, at }
// `cast` is null for the idle screen, otherwise a cast payload:
//   { type, kind, title, body, cite, tag, stamp, due, url, mode, label, big }
// `n` increments on every cast so re-casting the same thing still animates.

import { useState, useEffect, useCallback, useRef } from "react";

export const liveKey = (storageKey) => storageKey + "-live";

export const EMPTY_LIVE = { cast: null, anim: "rise", bigAnim: "drop", n: 0, at: 0 };

// Everyday animations, in the order they appear in the picker.
export const ANIMS = [
  { id: "cut", name: "Cut", hint: "No transition. Fastest, least distracting." },
  { id: "rise", name: "Rise", hint: "Lifts in from below. Quiet and quick." },
  { id: "push", name: "Push", hint: "Old slides out, new slides in. Like turning a page." },
  { id: "iris", name: "Iris", hint: "Circular wipe from the center. Pulls eyes to the middle." },
  { id: "flip", name: "Flip", hint: "The screen turns over. The theatrical one." },
];

// Reserved for anything marked big (assignment reveals).
export const BIG_ANIMS = [
  { id: "drop", name: "Drop", hint: "Slams in oversized with a shake. Loud and short." },
  { id: "spot", name: "Spotlight", hint: "Room goes dark, a beam opens. Slower burn." },
];

export function useLive(storageKey) {
  const key = liveKey(storageKey);
  const [live, setLive] = useState(null); // null until first load
  const ref = useRef(EMPTY_LIVE);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(key, true);
        const v = r ? JSON.parse(r.value) : EMPTY_LIVE;
        if (!alive) return;
        ref.current = { ...EMPTY_LIVE, ...v };
        setLive(ref.current);
      } catch {
        if (alive) { ref.current = EMPTY_LIVE; setLive(EMPTY_LIVE); }
      }
    })();
    const off = window.storage?.onUpdate?.(key, (val) => {
      try {
        const v = { ...EMPTY_LIVE, ...JSON.parse(val) };
        ref.current = v;
        setLive(v);
      } catch { /* ignore */ }
    });
    return () => { alive = false; if (off) off(); };
  }, [key]);

  const push = useCallback((patch) => {
    const next = { ...ref.current, ...patch, at: Date.now() };
    ref.current = next;
    setLive(next);
    try { window.storage.set(key, JSON.stringify(next), true); } catch { /* ignore */ }
  }, [key]);

  // cast(payload) — payload null clears the screen back to idle.
  const cast = useCallback((payload) => {
    push({ cast: payload || null, n: (ref.current.n || 0) + 1 });
  }, [push]);

  return [live, cast, push];
}
