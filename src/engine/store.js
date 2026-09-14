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

// The same data written out the same way whatever order its keys are in.
// Postgres hands a row back with its keys re-sorted, so the echo of a save never
// matches the string that was sent.
// Kept as a short hash, because a class is a large object and a page holds
// several of them.
const canon = (v) => {
  const s = JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x)
    ? Object.keys(x).sort().reduce((o, key) => { o[key] = x[key]; return o; }, {})
    : x));
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return s.length + ":" + h;
};

export function useClassData(key) {
  const [data, setData] = useState(() => WARM.get(key) || null);
  const dataRef = useRef({});
  // Every save comes back to us as a realtime event. Blindly taking that echo
  // rolls local state back to whatever the server had, which quietly ate edits
  // made while a write was still in flight — and writes are slow here, because
  // the storage shim takes a daily backup before each one. So while we have
  // writes outstanding, we already hold the newest state: ignore the echo.
  const pending = useRef(0);
  // One save at a time, and only the newest state waiting behind it.
  //
  // Saves used to go out all at once. Every save is the whole class, and the
  // first save of the day takes a backup before it writes, so two saves a
  // second apart could land in either order. Make a thing, type its title, and
  // the save holding the blank title could arrive after the one holding the
  // real one. The server kept the blank, and so did the screen once the echo
  // came back. Now a save waits for the one ahead of it, and edits made in the
  // meantime go out together as one.
  const flying = useRef(false);
  // Waiting saves, at most one per key in a row. Almost always zero or one.
  const queued = useRef([]);
  // The last few states this page sent, so a late echo of an older one can be
  // told apart from somebody else's write.
  const sent = useRef([]);

  const pump = useCallback(() => {
    if (flying.current || !queued.current.length) return;
    const [{ k, v }, ...rest] = queued.current;
    queued.current = rest;
    flying.current = true;
    sent.current = [...sent.current.slice(-9), canon(v)];
    Promise.resolve(saveClass(k, v)).finally(() => {
      flying.current = false;
      pending.current--;
      pump();
    });
  }, []);

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
        // Our own save coming back. If it is what we hold, there is nothing to
        // do; if it is an older one arriving late, taking it would undo
        // whatever was saved after it.
        if (sent.current.length && sent.current.includes(canon(d))) return;
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
    // A state still waiting is replaced rather than queued behind, so it is
    // counted once.
    const q = queued.current;
    if (q.length && q[q.length - 1].k === key) q[q.length - 1] = { k: key, v: next };
    else { q.push({ k: key, v: next }); pending.current++; }
    pump();
  }, [key, pump]);

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
