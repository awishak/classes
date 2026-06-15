// Tiny persistence layer for the engine. Uses the same Supabase-backed
// window.storage the live classes use, keyed by the class config's storageKey,
// with realtime updates so the student and instructor views stay in sync.

import { useState, useEffect, useCallback, useRef } from "react";

export async function loadClass(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : {};
  } catch {
    return {};
  }
}

export async function saveClass(key, data) {
  try {
    return !!(await window.storage.set(key, JSON.stringify(data), true));
  } catch {
    return false;
  }
}

// Returns [data, update]. data is null until first load.
// update(mutator) applies mutator(prev) -> next, saves, and updates state.
export function useClassData(key) {
  const [data, setData] = useState(null);
  const dataRef = useRef({});

  useEffect(() => {
    let alive = true;
    loadClass(key).then(d => {
      if (!alive) return;
      dataRef.current = d || {};
      setData(dataRef.current);
    });
    const off = window.storage?.onUpdate?.(key, (val) => {
      try {
        const d = JSON.parse(val);
        dataRef.current = d;
        setData(d);
      } catch { /* ignore */ }
    });
    return () => { alive = false; if (off) off(); };
  }, [key]);

  const update = useCallback((mutator) => {
    const next = mutator(dataRef.current || {});
    dataRef.current = next;
    setData({ ...next });
    saveClass(key, next);
  }, [key]);

  return [data, update];
}
