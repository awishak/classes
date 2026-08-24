// Student questions. The ask page appends; the Dashboard reads, pushes to the
// classroom screen, and archives. Own key so a burst of questions during class
// never collides with a day-plan save.
//
// Shape at `${storageKey}-questions`: { items: [{ id, text, who, anon, at, state }] }
// state: "open" | "answered" | "archived" | "trashed"

import { useState, useEffect, useCallback, useRef } from "react";

export const questionsKey = (storageKey) => storageKey + "-questions";

export function useQuestions(storageKey) {
  const key = questionsKey(storageKey);
  const [items, setItems] = useState(null);
  const pending = useRef(0);
  const ref = useRef([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(key, true);
        const v = r ? JSON.parse(r.value) : {};
        if (!alive) return;
        ref.current = v.items || [];
        setItems(ref.current);
      } catch { if (alive) { ref.current = []; setItems([]); } }
    })();
    const off = window.storage?.onUpdate?.(key, (val) => {
      if (pending.current > 0) return;   // our own write coming back
      try {
        const v = JSON.parse(val);
        ref.current = v.items || [];
        setItems(ref.current);
      } catch { /* ignore */ }
    });
    return () => { alive = false; if (off) off(); };
  }, [key]);

  const write = useCallback((next) => {
    ref.current = next;
    setItems([...next]);
    pending.current++;
    Promise.resolve(window.storage.set(key, JSON.stringify({ items: next }), true)).catch(() => {}).finally(() => { pending.current--; });
  }, [key]);

  const add = useCallback((q) => {
    write([...(ref.current || []), { id: "q" + Date.now() + Math.random().toString(36).slice(2, 6), state: "open", at: Date.now(), ...q }]);
  }, [write]);

  const setState = useCallback((id, state) => {
    write((ref.current || []).map(q => q.id === id ? { ...q, state } : q));
  }, [write]);

  // End of session: everything still open goes to the archive, unanswered.
  const archiveOpen = useCallback(() => {
    write((ref.current || []).map(q => q.state === "open" ? { ...q, state: "archived" } : q));
  }, [write]);

  return { items, add, setState, archiveOpen };
}
