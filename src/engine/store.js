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
// The last data we saw for a key, held for the life of the page.
//
// Without it, every trip back to a class I was on ten seconds ago is a spinner
// while the fetch goes out again, and switching between two classes flashes
// one on every switch. With it the screen comes up on what it had and the
// fetch quietly replaces it. It also means the whole dashboard can be rendered
// without effects, which is what the smoke test needs — the panels alone were
// never the part that broke.
const WARM = new Map();
export const warmClassData = (key, data) => { WARM.set(key, data); };

export function useClassData(key) {
  const [data, setData] = useState(() => WARM.get(key) || null);
  const dataRef = useRef({});
  // Every save comes back to us as a realtime event. Blindly taking that echo
  // rolls local state back to whatever the server had, which quietly ate edits
  // made while a write was still in flight — and writes are slow here, because
  // the storage shim takes a daily backup before each one. So while we have
  // writes outstanding, we already hold the newest state: ignore the echo.
  const pending = useRef(0);

  useEffect(() => {
    let alive = true;
    const warm = WARM.get(key);
    if (warm) dataRef.current = warm;
    loadClass(key).then(d => {
      if (!alive) return;
      dataRef.current = d || {};
      WARM.set(key, dataRef.current);
      setData(dataRef.current);
    });
    const off = window.storage?.onUpdate?.(key, (val) => {
      if (pending.current > 0) return;
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
    WARM.set(key, next);
    setData({ ...next });
    pending.current++;
    Promise.resolve(saveClass(key, next)).finally(() => { pending.current--; });
  }, [key]);

  return [data, update];
}

// The same reader, without the writer.
//
// The game system saves through a path of its own, because a student sending an
// answer merges against what the server holds and retries, so that code has to
// see whether the write landed. Having saved, it hands back the object it
// saved. Passing that object through `update` would write the same JSON a
// second time. So this returns the class data and a way to take what was just
// written, and saves nothing itself.
export function useClassState(key) {
  const [data, setData] = useState(() => WARM.get(key) || null);
  const ref = useRef(null);
  const mine = useRef(0);

  useEffect(() => {
    let alive = true;
    const warm = WARM.get(key);
    if (warm) ref.current = warm;
    loadClass(key).then(d => {
      if (!alive) return;
      ref.current = d || {};
      WARM.set(key, ref.current);
      setData(ref.current);
    });
    const off = window.storage?.onUpdate?.(key, (val) => {
      // Our own write coming back. The caller already holds the newer state.
      if (mine.current > 0) { mine.current--; return; }
      try {
        const d = JSON.parse(val);
        ref.current = d;
        WARM.set(key, d);
        setData(d);
      } catch { /* ignore */ }
    });
    return () => { alive = false; if (off) off(); };
  }, [key]);

  const take = useCallback((next) => {
    ref.current = next;
    WARM.set(key, next);
    mine.current++;
    setData({ ...next });
  }, [key]);

  return [data, take];
}
