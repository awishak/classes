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

// What this page changed is this page's. Everything else is the server's.
//
// Andrew, 2026-09-21: "students are adding pictures and then it's going away.
// do we have the problem with people doing it at the same time?" Yes, and not
// only for pictures. Every save here is the whole class as one page holds it,
// so two students onboarding in the same minute each write a class that does
// not have the other one in it, and the second write wins. A photo, a hometown,
// a submission: whatever landed in between is gone, and nothing anywhere says
// so.
//
// The rule is the one the game's answers and the attendance marks already use,
// written once for the whole class. Walk what this page wants against what it
// started from: a branch it never touched is still the same object, because
// React state copies the spine and shares the rest, so that branch comes from
// the server. A branch it did touch is this page's, down to the leaf. A key it
// took out stays out, so deleting still deletes.
//
// A list of things that carry their own ids merges by id. Andrew, 2026-09-21:
// "and please fix the array issue." Two students posting to one discussion
// board in the same second each hold a list the other post is not in, and the
// list that landed second used to be the whole list. A post, a submission, a
// request, a row of the roster: every one of them carries an id already.
//
// A list of plain values stays a leaf, because in a list of values the ORDER is
// the meaning: the options under a question are ["This", "That"], and a merge
// that took one out and put its replacement on the end would quietly move the
// right answer.
const isPlain = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const byId = (list) => {
  if (!Array.isArray(list)) return null;
  const m = new Map();
  for (const x of list) {
    if (!isPlain(x) || typeof x.id !== "string" || !x.id || m.has(x.id)) return null;
    m.set(x.id, x);
  }
  return m;
};

// Which version of one row survives, by the same rule the rest of the merge
// uses: whoever touched it owns it, and if both did, field by field.
function pickRow(id, was, mine, theirs) {
  const before = was.get(id), now = mine.get(id), there = theirs.get(id);
  if (before && !now) return undefined;                 // this page took it out
  if (before && !there) return undefined;               // somebody else took it out
  if (!now) return there;                               // only on the server
  if (!there) return now;                               // added here
  if (now === before) return there;                     // untouched here
  if (there === before) return now;                     // untouched there
  return mergeClass(before, now, there);
}

export function mergeList(was, mine, theirs) {
  const w = byId(was) || new Map(), m = byId(mine), t = byId(theirs);
  if (!m || !t) return mine;                            // not rows with ids: a leaf
  // Whose order to follow. A page that only added rows keeps the other side's
  // order and puts its own on the end; a page that moved rows about meant to.
  const orderOf = (list, keep) => list.filter(x => keep.has(x.id)).map(x => x.id).join("|");
  const moved = orderOf(mine, w) !== orderOf(Array.isArray(was) ? was : [], m);
  const order = [];
  const seen = new Set();
  const add = (x) => { if (!seen.has(x.id)) { seen.add(x.id); order.push(x.id); } };
  (moved ? mine : theirs).forEach(add);
  (moved ? theirs : mine).forEach(add);
  const out = [];
  order.forEach(id => { const row = pickRow(id, w, m, t); if (row !== undefined) out.push(row); });
  return out;
}

export function mergeClass(base, next, server) {
  if (!isPlain(next) || !isPlain(server)) return next;
  const was = isPlain(base) ? base : {};
  const out = { ...server };
  new Set([...Object.keys(next), ...Object.keys(was)]).forEach(k => {
    if (!(k in next)) { delete out[k]; return; }        // this page took it out
    const mine = next[k], before = was[k];
    if (mine === before) {                               // untouched: the server's
      if (k in server) out[k] = server[k]; else delete out[k];
      return;
    }
    out[k] = isPlain(mine) && isPlain(server[k]) ? mergeClass(before, mine, server[k])
      : Array.isArray(mine) && Array.isArray(server[k]) ? mergeList(before, mine, server[k])
      : mine;
  });
  return out;
}

// Read, merge, write. Hands back what was written, or null.
//
// A read that comes back with nothing is a failed read as often as it is a
// class nothing has ever been written for, and the shim cannot tell them apart,
// so it is asked twice. If the second answer is nothing as well, the page's own
// state goes out as it always did, because a student's own words are the one
// thing that must not be dropped on the floor.
export async function saveAgainstServer(key, base, next) {
  let server = null;
  for (let i = 0; i < 2 && !server; i++) {
    try {
      const raw = await window.storage.get(key, true);
      server = raw?.value ? JSON.parse(raw.value) : null;
    } catch { server = null; }
  }
  const out = server ? mergeClass(base, next, server) : next;
  const ok = await saveClass(key, out);
  return ok ? out : null;
}

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
  // The last state this page and the server agreed on, which is what a save
  // measures this page's changes against. It moves on when a merged save comes
  // back and nothing newer is waiting, because a state waiting in the queue was
  // built from this basis and has to be merged against the same one.
  const basis = useRef({});

  const pump = useCallback(() => {
    if (flying.current || !queued.current.length) return;
    const [{ k, v }, ...rest] = queued.current;
    queued.current = rest;
    flying.current = true;
    Promise.resolve(saveAgainstServer(k, basis.current, v)).then((out) => {
      if (out) {
        sent.current = [...sent.current.slice(-9), canon(out)];
        // What landed is what everybody holds now, this page included. Not
        // while something newer is waiting: that state was built from the
        // basis below and is merged against it on the way out.
        if (!queued.current.length) {
          basis.current = out;
          dataRef.current = out;
          WARM.set(k, out);
          setData({ ...out });
        }
      }
    }).finally(() => {
      flying.current = false;
      pending.current--;
      pump();
    });
  }, [setData]);

  useEffect(() => {
    let alive = true;
    const warm = WARM.get(key);
    if (warm) dataRef.current = warm;
    loadClass(key).then(d => {
      if (!alive) return;
      dataRef.current = d || {};
      basis.current = dataRef.current;
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
        basis.current = d;
        WARM.set(key, d);
        setData(d);
      } catch { /* ignore */ }
    });
    return () => { alive = false; if (off) off(); };
  }, [key]);

  const update = useCallback((mutator) => {
    // From the newest state this page holds, not this hook's own copy: two
    // hooks can read one class (the bar's Horn over the dashboard), and a
    // write from one must not undo what the other has not saved yet.
    const next = mutator(WARM.get(key) || dataRef.current || {});
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

  // Taking a state that was written somewhere else.
  //
  // An attendance mark cannot go out through `update`: every save here is the
  // whole class as this page holds it, and a room unchecking a box at the same
  // time is thirty pages each holding a snapshot taken before the others
  // marked. `saveMerged` re-reads, merges and writes for itself, and hands the
  // result back here to be held. Nothing is queued, because it is already on
  // the server.
  const apply = useCallback((next) => {
    dataRef.current = next;
    // It came back from the server, so it is what the next save measures
    // against as well.
    basis.current = next;
    WARM.set(key, next);
    setData({ ...next });
  }, [key]);

  return [data, update, apply];
}

// A write that re-reads before it saves.
//
// `mutate` is applied to what this page holds, `merge` is given what this page
// started from, what it wants, and what the server holds now, and its answer is
// what gets written. See mergeAway in attendance.js for the rule, and
// mergeAnswers in game.js for the same rule written for a game's answers.
//
// Hands back what was written, or null if nothing was, because after a merge
// the result is no longer the object the caller built.
export async function saveMerged(key, mutate, merge) {
  const base = WARM.get(key) || {};
  const next = mutate(base);
  try {
    const raw = await window.storage.get(key, true);
    const server = raw?.value ? JSON.parse(raw.value) : null;
    // The shim answers null both for a class nothing has ever been written for
    // and for a request that failed, and there is no telling those apart from
    // here. A class this page is holding data for has a row, so a null answer
    // to that is a failed read, and writing on top of it would put this page's
    // idea of the class over everybody else's.
    if (!server && Object.keys(base).length) return null;
    const out = server ? merge(next, base, server) : next;
    const ok = await saveClass(key, out);
    if (!ok) return null;
    warmClassData(key, out);
    return out;
  } catch { return null; }
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
