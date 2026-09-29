// Tiny persistence layer for the engine. Uses the same Supabase-backed
// window.storage the live classes use, keyed by the class config's storageKey,
// with realtime updates so the student and instructor views stay in sync.

import { useState, useEffect, useCallback, useRef } from "react";
import { ENGINE_LIST } from "../config/registry.js";
import { getSession } from "./session.js";
import { isInstructorEmail } from "../instructors.js";
import { PLAN_KEYS, PLAN_SUFFIX, splitParts } from "./plan-keys.js";

// What the server holds for a key: the class, {} when there is no row by
// that key, and null when the read failed.
//
// Andrew, 2026-09-28: "it keeps not saving my headlines." The day's title,
// a section's name and a seed row he had taken off Sep 28 all came back
// during class, with his own rows untouched. A failed read used to come back
// as {}, the same as a class nothing has been written for. A phone in the
// room that could not reach the server came up with an empty class, the site
// seeded itself from config, and the merge, measuring against nothing, wrote
// the seed's titles and rows over his. A read that fails is nothing now,
// and everything above the shim reads through here.
export async function loadRow(key) {
  try {
    const r = await window.storage.get(key, true);
    if (r === undefined) return null;
    if (r === null) return {};
    return JSON.parse(r.value);
  } catch {
    return null;
  }
}

// A class as one object, read off its two rows. See SPLIT.md, and the
// section on the two rows below.
export async function loadClass(key) {
  if (!isClassKey(key)) return loadRow(key);
  const [c, p] = await Promise.all([loadRow(key), loadRow(planKeyOf(key))]);
  if (c === null || p === null) return null;
  return { ...c, ...p };
}

// ─── the history of a day ───
//
// Andrew, 2026-09-23, after a morning when a day looked wiped: version history,
// so any earlier state of a day can be looked at and put back, from any
// machine.
//
// Each version is a row of its own, `<class>-history-<date>-<time>`, so saving
// one never needs anything read first. The first version of this lived in one
// row per day, read and written back whole, and a read that failed on bad
// wifi would have written a list of one over thirty. Rows in that older shape
// are still read.
//
// A version is the day as it was just before an editing session touched it:
// the first change to a day after five quiet minutes writes down what the day
// was. Everything since is the day as it is now. Thirty kept per day. The
// History sheet on the dashboard (DayTools.jsx) lists these, whichever
// machine wrote them, above the daily backups.
const HISTORY_GAP = 5 * 60 * 1000;
const HISTORY_KEEP = 30;
export const historyKey = (key, date) => key + "-history-" + String(date || "").trim().toLowerCase().replace(/\s+/g, "-");
const versionKey = (key, date, at) => historyKey(key, date) + "-" + String(at).padStart(13, "0");
const lastVersion = new Map();
const lastPlan = new Map();

export async function recordDay(key, date, plan, force = false) {
  if (!key || !date || !plan) return;
  const k = historyKey(key, date);
  const now = Date.now();
  if (!force && now - (lastVersion.get(k) || 0) < HISTORY_GAP) return;
  lastVersion.set(k, now);
  const same = canon(plan);
  if (lastPlan.get(k) === same) return;
  try {
    const ok = await window.storage.set(versionKey(key, date, now), JSON.stringify({ date, at: now, plan }), true);
    if (!ok) { lastVersion.delete(k); return; }
    lastPlan.set(k, same);
    // Thirty kept. Trimming is the only part that reads, and a read that
    // fails only means nothing is trimmed this time.
    const listed = await window.storage.list(k + "-", true);
    const keys = (listed?.keys || []).filter(x => /-\d{13}$/.test(x)).sort().reverse();
    for (const old of keys.slice(HISTORY_KEEP)) await window.storage.delete(old, true);
  } catch { /* the class save is what matters; a version missed is a version missed */ }
}

export async function loadDayHistory(key, date) {
  const k = historyKey(key, date);
  try {
    // Versions written since the split live under the plan row's key, and
    // the ones from before under the class's. Both are the day's history.
    const prefixes = isClassKey(key) ? [k, historyKey(planKeyOf(key), date)] : [k];
    const [lists, legacy] = await Promise.all([
      Promise.all(prefixes.map(pre => (window.storage.rows ? window.storage.rows(pre + "-") : null))),
      window.storage.get(k, true),
    ]);
    const own = lists.flatMap(rows => rows || [])
      .filter(r => /-\d{13}$/.test(r.id) && r.data && r.data.plan)
      .map(r => ({ at: r.data.at, plan: r.data.plan }));
    const old = legacy?.value ? (JSON.parse(legacy.value).versions || []) : [];
    return [...own, ...old].sort((a, b) => b.at - a.at);
  } catch { return []; }
}

// Every day an edit is about to change, written down as it was.
const noteDays = (key, before, after) => {
  const was = before?.dayPlans || {}, now = after?.dayPlans || {};
  if (was === now) return;
  Object.keys(was).forEach(date => {
    if (was[date] && was[date] !== now[date]) recordDay(key, date, was[date]);
  });
};

// True when it landed, false when the database refused it (a plan row and
// not an instructor), null when it could not be sent.
export async function saveClass(key, data) {
  try {
    const r = await window.storage.set(key, JSON.stringify(data), true);
    if (r === false) return false;
    return r ? true : null;
  } catch {
    return null;
  }
}

// A whole state written raw, the way the repository writes a class, split
// by row for a class. Only a row whose keys changed goes out, and the class
// row keeps whatever copies of plan keys it still holds from before the
// split, so writing it never quietly migrates a class.
export async function saveSplit(key, cur, next) {
  if (!isClassKey(key)) return saveClass(key, next);
  const was = cur || {};
  const keys = new Set([...Object.keys(next || {}), ...Object.keys(was)]);
  const changed = (k) => (next || {})[k] !== was[k];
  const { plan, rest } = splitParts(next);
  const jobs = [];
  if ([...keys].some(k => PLAN_KEYS.has(k) && changed(k))) jobs.push(saveClass(planKeyOf(key), plan));
  if ([...keys].some(k => !PLAN_KEYS.has(k) && changed(k))) {
    jobs.push(loadRow(key).then(raw => (raw === null ? null : saveClass(key, { ...splitParts(raw).plan, ...rest }))));
  }
  const out = await Promise.all(jobs);
  return out.every(Boolean);
}

// The last data we saw for a key, held for the life of the page.
//
// Without it, every trip back to a class I was on ten seconds ago is a spinner
// while the fetch goes out again, and switching between two classes flashes
// one on every switch. With it the screen comes up on what it had and the
// fetch quietly replaces it. It also means the whole dashboard can be rendered
// without effects, which is what the smoke test needs — the panels alone were
// never the part that broke.
const WARM = new Map();

// ─── two rows behind one class ───
//
// SPLIT.md has the reasoning. A class is two rows: `<storageKey>`, which
// students write, and `<storageKey>-plan`, which only an instructor session
// may write, and the database refuses anyone else. Every surface still asks
// for the class by its storageKey and gets one object, plan keys over class
// keys, the way the photographs come back onto the profiles. A save is split
// by key, and only the row whose keys changed goes out.
//
// Before the migration has run, the class row still holds copies of the plan
// keys. A plan key the plan row lacks falls back to the class row, and the
// first edit writes every plan key into the plan row, so the plan row wins
// from then on. The class row keeps its stale copies until the migration
// takes them off; nothing here deletes them, so nothing here migrates a class
// by accident.
export { PLAN_KEYS, PLAN_SUFFIX, splitParts };
export const classKeys = new Set(ENGINE_LIST.map(c => c.storageKey));
export const isClassKey = (k) => classKeys.has(k);
export const planKeyOf = (k) => k + PLAN_SUFFIX;
export const isPlanRow = (k) => typeof k === "string" && (k.endsWith(PLAN_SUFFIX) || k.includes(PLAN_SUFFIX + "-"));
// The rows a key is read from.
const rowsOf = (key) => (isClassKey(key) ? [key, planKeyOf(key)] : [key]);
// The class as one object, or null until both rows are here. Both, because
// a view drawn from the class row alone, before the plan row has arrived,
// would be a class with no lesson plans and no seed version, and the site
// would seed it.
export const mergedView = (key) => {
  if (!isClassKey(key)) return WARM.has(key) ? { ...WARM.get(key) } : null;
  const planKey = planKeyOf(key);
  if (!WARM.has(key) || !WARM.has(planKey)) return null;
  return { ...WARM.get(key), ...WARM.get(planKey) };
};
// Whether this browser may write a plan row: an instructor session, or the
// PIN the gate remembered. The database only counts the session; the PIN is
// for the podium machine until it signs in.
let planWriter = () => {
  if (isInstructorEmail(getSession()?.user?.email)) return true;
  try { return !!localStorage.getItem("classes-instructor-pin"); } catch { return false; }
};
export const mayWritePlan = () => planWriter();
/** For the smoke: stand in for who is at the keyboard. */
export const asPlanWriter = (fn) => { planWriter = fn || (() => false); };

// Warming a class puts each part on its row.
export const warmClassData = (key, data) => {
  if (!isClassKey(key)) { WARM.set(key, data); return; }
  const { plan, rest } = splitParts(data);
  WARM.set(key, rest);
  WARM.set(planKeyOf(key), plan);
};

// ─── work that has not landed yet ───
//
// Andrew, 2026-09-22: "i worked on tomorrows lesson plan for COMM 3 on my
// laptop, then i came home to a differnet desktop, and it wasn't updated."
// Nothing of that day's work was on the server, and nothing had told him. A
// save that fails answers null, the queued state is dropped, and the page goes
// on showing the words as though they were kept.
//
// Two things follow from that. A save that fails is tried again, and until one
// lands the state sits in this browser under its own key, so a closed lid, a
// dead tab or a walk out of wifi cannot eat it. The next time any page opens
// that class here, what was never saved is merged into what the server holds
// now, by the same rule two people editing at once already use.
const PENDING = "classes-unsaved:";

// The event storage-shim.js sends when its socket is back after a drop. Named
// here rather than imported, because importing the shim opens a socket.
const RECONNECTED = "ishak:realtime-back";

// The state that was wanted, and the state it was built on top of. Both,
// because the merge rule needs to know which branches this page actually
// touched: without the basis, work held overnight would put a stale copy of
// every other branch back over whatever happened since.
// Writing to localStorage is the main thread standing still, and a class is
// half a megabyte, so a copy on every keystroke would be felt in the typing.
// At most one a second, and always one last write on the way out.
const lastKept = new Map();
const keepTimer = new Map();
const wanted = new Map();
const writePending = (key) => {
  const held = wanted.get(key);
  clearTimeout(keepTimer.get(key));
  keepTimer.delete(key);
  if (!held) return;
  lastKept.set(key, Date.now());
  try { localStorage.setItem(PENDING + key, JSON.stringify({ at: Date.now(), ...held })); }
  catch { /* private window, or no room: the queue in memory is still trying */ }
};
const keepPending = (key, data, base) => {
  wanted.set(key, { data, base });
  const since = Date.now() - (lastKept.get(key) || 0);
  if (since >= 1000) { writePending(key); return; }
  if (!keepTimer.has(key)) keepTimer.set(key, setTimeout(() => writePending(key), 1000 - since));
  // The last word before the tab goes: whatever is still waiting gets written
  // now, because a page being closed is exactly when this matters.
  if (typeof window !== "undefined" && !keepPending.bound) {
    keepPending.bound = true;
    window.addEventListener("pagehide", () => { [...wanted.keys()].forEach(writePending); });
  }
};
const readPending = (key) => {
  try {
    const raw = localStorage.getItem(PENDING + key);
    const held = raw ? JSON.parse(raw) : null;
    return held && held.data && held.base ? held : null;
  } catch { return null; }
};
const dropPending = (key) => {
  wanted.delete(key);
  clearTimeout(keepTimer.get(key));
  keepTimer.delete(key);
  try { localStorage.removeItem(PENDING + key); } catch { /* nothing to drop */ }
};

/** Whether this browser is holding work for a class that never reached the server. */
export const unsavedFor = (key) => rowsOf(key).some(k => !!readPending(k));

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
  // Whose order to follow. A side that moved rows about meant to, and when
  // neither did, or both did, this page's order stands.
  //
  // Andrew, 2026-09-28: "when i add a new line to a section, no matter where
  // i add it, it adds it to the bottom." The line landed where Enter was
  // pressed, and the save came back with it on the end: this used to follow
  // the server's order unless this page had moved rows, and a line typed into
  // the middle moves nothing, so it was put on after everything the server
  // held. The other side's new rows go in after the row they were put after,
  // for the same reason.
  const base = Array.isArray(was) ? was : [];
  const orderOf = (list, keep) => list.filter(x => keep.has(x.id)).map(x => x.id).join("|");
  const mineMoved = orderOf(mine, w) !== orderOf(base, m);
  const theirsMoved = orderOf(theirs, w) !== orderOf(base, t);
  const [lead, follow] = theirsMoved && !mineMoved ? [theirs, mine] : [mine, theirs];
  const order = lead.map(x => x.id);
  follow.forEach((x, i) => {
    if (order.includes(x.id)) return;
    let j = i - 1;
    while (j >= 0 && !order.includes(follow[j].id)) j--;
    order.splice((j >= 0 ? order.indexOf(follow[j].id) : -1) + 1, 0, x.id);
  });
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
// A read that fails is asked once more, and if it fails again the save does
// not happen this time round: a student's own words are held in this browser
// and sent when the server can be reached, and the whole class is never
// written blind over whatever is there.
export const REFUSED = Symbol("refused");
export async function saveAgainstServer(key, base, next) {
  let server = null;
  for (let i = 0; i < 2 && server === null; i++) server = await loadRow(key);
  // Could not read: nothing goes out on top of what cannot be seen. The save
  // is tried again, and the words are held in this browser until it lands.
  if (server === null) return null;
  const out = Object.keys(server).length ? mergeClass(base, next, server) : next;
  const ok = await saveClass(key, out);
  if (ok === false) return REFUSED;
  return ok ? out : null;
}

// ─── one pipeline per class ───
//
// Andrew, 2026-09-27: "the dashboard keeps not saving what i write on it."
// Two lines survived on Sep 30 of COMM 3 and nothing on Oct 2. The bar mounts
// Around the Horn on every page I am on, and Horn opens a reader of its own on
// the class the dashboard is editing. The two hooks shared WARM, which every
// keystroke builds its next state on, but each kept its own idea of what was
// in flight. The dashboard's hook knew to ignore the echoes of its own saves;
// Horn's hook had nothing in flight, so it took every echo and every re-read
// on focus and put that older state into WARM. The next line typed was built
// on it, and the lines typed in between were gone from the screen, and then
// from the server, because the merge read them as lines this page took out.
//
// So the queue, what is in flight, what was sent and what this page and the
// server last agreed on live here, once per class, and every hook on a class
// reads the same one. A hook is a subscription to it and nothing more.
const PIPES = new Map();
const pipeFor = (key) => {
  let p = PIPES.get(key);
  if (!p) {
    p = {
      // Waiting states, at most one. A newer state replaces the one waiting.
      queued: [],
      // How many states this page has sent or is about to send that have not
      // landed, so an echo is not taken while it could be older than what is
      // held.
      pending: 0,
      // One save at a time. Every save is the whole class, and two a second
      // apart could land in either order.
      flying: false,
      // The last few states sent, so a late echo of an older one can be told
      // apart from somebody else's write.
      sent: [],
      // The last state this page and the server agreed on, which is what a
      // save measures this page's changes against.
      basis: {},
      tries: 0,
      retry: null,
      trouble: false,
      busy: false,
      hooks: new Set(),
      off: null,
      loading: false,
      retryLoad: null,
    };
    PIPES.set(key, p);
  }
  return p;
};

/** Whether anything for this class is on its way to the server, or waiting to go. */
export const inFlight = (key) => {
  const p = PIPES.get(key);
  return !!p && (p.pending > 0 || p.flying || p.queued.length > 0);
};

// Every hook on the class takes the state.
const tell = (key, d) => {
  WARM.set(key, d);
  pipeFor(key).hooks.forEach(h => h.data());
};
const tellStatus = (p, patch) => {
  Object.assign(p, patch);
  p.hooks.forEach(h => h.status());
};

// A state the server holds, taken only when nothing from here is on its way:
// a save in flight is merged against the server as it goes out, and what
// lands is taken then. An echo of a state this page sent is nothing new, and
// taking it would undo whatever was saved after it. Answers whether it was
// taken.
export function takeServer(key, d) {
  if (!isPlain(d)) return false;
  const p = pipeFor(key);
  if (inFlight(key)) return false;
  const same = canon(d);
  if (p.sent.includes(same)) return false;
  const have = WARM.get(key);
  if (have && canon(have) === same) return false;
  p.basis = d;
  tell(key, d);
  return true;
}

// What this page wants, from the newest state held for the class, whichever
// hook is asking: a write from one must not undo what another has not saved
// yet. Held in this browser until a save lands, so a tab that dies between
// the keystroke and the write still has the words.
export function pushUpdate(key, mutator) {
  if (!isClassKey(key)) return pushRow(key, mutator);
  const view = mergedView(key);
  if (!view) return null;
  const next = mutator(view);
  if (!next || next === view) return next;
  const keys = new Set([...Object.keys(next), ...Object.keys(view)]);
  const changedPlan = [...keys].some(k => PLAN_KEYS.has(k) && next[k] !== view[k]);
  const changedRest = [...keys].some(k => !PLAN_KEYS.has(k) && next[k] !== view[k]);
  if (changedPlan) {
    if (mayWritePlan()) pushRow(planKeyOf(key), () => splitParts(next).plan);
    else console.warn("A change to the lesson plan from a page that is not the instructor's was not saved.");
  }
  if (changedRest) {
    // The class row: its own keys as they are now, and whatever copies of
    // plan keys it still holds, untouched.
    const held = splitParts(WARM.get(key) || {}).plan;
    pushRow(key, () => ({ ...held, ...splitParts(next).rest }));
  }
  return next;
}

function pushRow(key, mutator) {
  const p = pipeFor(key);
  const before = WARM.get(key) || {};
  const next = mutator(before);
  noteDays(key, before, next);
  tell(key, next);
  // A state still waiting is replaced rather than queued behind, so it is
  // counted once.
  if (p.queued.length) p.queued[p.queued.length - 1] = next;
  else { p.queued.push(next); p.pending++; }
  keepPending(key, next, p.basis);
  tellStatus(p, { busy: true });
  pump(key);
  return next;
}

function pump(key) {
  const p = pipeFor(key);
  if (p.flying || !p.queued.length) return;
  const v = p.queued.shift();
  p.flying = true;
  Promise.resolve(saveAgainstServer(key, p.basis, v)).then((out) => {
    if (out === REFUSED) {
      // The database said no: a plan row, and this is not an instructor's
      // session. Nothing to retry. The words stay on the screen until the
      // server's copy comes back over them, and the bar says Not saved.
      console.warn("The server refused a save to " + key + ". Sign in as the instructor to write the lesson plan.");
      p.tries = 0;
      if (!p.queued.length) dropPending(key);
      tellStatus(p, { trouble: true });
      return;
    }
    if (out) {
      p.tries = 0;
      p.sent = [...p.sent.slice(-9), canon(out)];
      // What landed is what everybody holds now. Not while something newer is
      // waiting: that state was built from the basis and is merged against it
      // on the way out.
      if (!p.queued.length) {
        p.basis = out;
        tell(key, out);
        dropPending(key);
      }
      tellStatus(p, { trouble: false });
      return;
    }
    // Nothing landed. Put it back at the head of the queue, unless newer work
    // is already waiting there, and come round again: a second of dropped
    // wifi should cost nothing. The copy in this browser stays put until
    // something lands, so closing the tab now loses nothing either.
    p.tries += 1;
    if (!p.queued.length) p.queued.unshift(v);
    else p.pending--;
    const wait = Math.min(30000, 1000 * 2 ** (p.tries - 1));
    clearTimeout(p.retry);
    p.retry = setTimeout(() => pump(key), wait);
    tellStatus(p, { trouble: true });
  }).finally(() => {
    p.flying = false;
    if (!p.tries) p.pending--;
    if (!p.tries) pump(key);
    tellStatus(p, { busy: p.flying || p.queued.length > 0 });
  });
}

// Listening for the class, once however many hooks are on it: the echo of
// every save, and a read again whenever this page could have missed one.
//
// Andrew, 2026-09-23: his laptop showed the COMM 118 day from before the
// morning's work, long after the server had the newer one. Realtime only
// carries changes while the socket is alive, and a laptop lid kills it. So
// the class is read again whenever the socket comes back (the shim says so
// with RECONNECTED), the tab comes back into view or the window into focus,
// or the browser back online.
function watch(key) {
  const p = pipeFor(key);
  if (p.off) return;
  const off = window.storage?.onUpdate?.(key, (val) => {
    try { takeServer(key, JSON.parse(val)); } catch { /* ignore */ }
  });
  let lastLook = 0;
  const catchUp = () => {
    if (document.visibilityState === "hidden") return;
    const now = Date.now();
    if (now - lastLook < 5000) return;
    lastLook = now;
    loadRow(key).then(d => { if (p.off && d && Object.keys(d).length) takeServer(key, d); });
  };
  document.addEventListener("visibilitychange", catchUp);
  window.addEventListener("focus", catchUp);
  window.addEventListener("online", catchUp);
  window.addEventListener(RECONNECTED, catchUp);
  p.off = () => {
    if (off) off();
    document.removeEventListener("visibilitychange", catchUp);
    window.removeEventListener("focus", catchUp);
    window.removeEventListener("online", catchUp);
    window.removeEventListener(RECONNECTED, catchUp);
    p.off = null;
  };
}
const unwatch = (key) => {
  const p = PIPES.get(key);
  if (p && !p.hooks.size && p.off) p.off();
};

// Reading the class in, and again until it comes.
//
// A read that fails is tried again with a backoff for as long as a hook is
// on the class, and the page stays on its loading screen until the class is
// really here. It used to come up as an empty class, and an empty class is
// something a page will happily seed and write.
function loadInto(key) {
  const p = pipeFor(key);
  if (p.loading) return;
  p.loading = true;
  const attempt = (n) => loadRow(key).then(async d => {
    if (!p.hooks.size) { p.loading = false; return; }
    if (d === null) { p.retryLoad = setTimeout(() => attempt(n + 1), Math.min(30000, 2000 * 2 ** n)); return; }
    p.loading = false;
    takeServer(key, d);
    // Work this browser is still holding, from a page whose save never
    // landed. Merged against what the server has now, from the state that
    // page started on, so only what was actually written here goes back in.
    // Not while something is on its way: that save carries the held state
    // itself, and lands or keeps trying.
    if (inFlight(key)) return;
    const held = readPending(key);
    if (!held || canon(held.data) === canon(d)) { dropPending(key); return; }
    // Through the pipeline, so nothing typed meanwhile goes out under it.
    p.flying = true;
    tellStatus(p, { busy: true });
    const out = await saveAgainstServer(key, held.base, held.data);
    p.flying = false;
    if (out) {
      p.sent = [...p.sent.slice(-9), canon(out)];
      if (!p.queued.length) {
        p.basis = out;
        tell(key, out);
        dropPending(key);
      }
      p.hooks.forEach(h => h.restored());
    }
    tellStatus(p, { trouble: !out, busy: p.queued.length > 0 });
    pump(key);
  });
  attempt(0);
}

// Returns [data, update, apply, saving]. data is null until first load.
// update(mutator) applies mutator(prev) -> next, saves, and tells every hook
// on the class.
export function useClassData(key) {
  const [data, setData] = useState(() => mergedView(key));
  const [trouble, setTrouble] = useState(() => rowsOf(key).some(k => pipeFor(k).trouble));
  const [busy, setBusy] = useState(() => rowsOf(key).some(k => pipeFor(k).busy));
  // Work that was held in this browser and has now been put back.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const rows = rowsOf(key);
    const me = {
      data: () => setData(mergedView(key)),
      status: () => { setTrouble(rows.some(k => pipeFor(k).trouble)); setBusy(rows.some(k => pipeFor(k).busy)); },
      restored: () => setRestored(true),
    };
    rows.forEach(k => { pipeFor(k).hooks.add(me); watch(k); });
    // The key changed under this hook, or the class moved on between this
    // hook's first render and now.
    me.data();
    me.status();
    rows.forEach(k => loadInto(k));
    return () => rows.forEach(k => { pipeFor(k).hooks.delete(me); unwatch(k); });
  }, [key]);

  const update = useCallback((mutator) => { pushUpdate(key, mutator); }, [key]);

  // Taking a state that was written somewhere else.
  //
  // An attendance mark cannot go out through `update`: every save here is the
  // whole class as this page holds it, and a room unchecking a box at the same
  // time is thirty pages each holding a snapshot taken before the others
  // marked. `saveMerged` re-reads, merges and writes for itself, and hands the
  // result back here to be held. Nothing is queued, because it is already on
  // the server, so it is what the next save measures against as well.
  // `next` is the class row as the server holds it, not the merged view:
  // saveMerged reads and writes that row alone.
  const apply = useCallback((next) => {
    pipeFor(key).basis = next;
    tell(key, next);
  }, [key]);

  // Nothing leaves this browser while a save is still trying, so say so before
  // the window closes. The browser shows its own words, not ours.
  useEffect(() => {
    if (!trouble) return undefined;
    const ask = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", ask);
    return () => window.removeEventListener("beforeunload", ask);
  }, [trouble]);

  // A fourth thing, so a screen can say what the saving is doing: `trouble` is
  // a save that has not landed and is still being tried, `busy` is a save on
  // its way, `restored` is work this browser was holding and has now put back.
  return [data, update, apply, { trouble, busy, restored, clearRestored: () => setRestored(false) }];
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
    const server = await loadRow(key);
    // A read that failed writes nothing. And a class this page is holding
    // data for has a row, so no row is a failed read in another coat, and
    // writing on top of it would put this page's idea of the class over
    // everybody else's.
    if (server === null) return null;
    if (!Object.keys(server).length && Object.keys(base).length) return null;
    const out = Object.keys(server).length ? merge(next, base, server) : next;
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
  const [data, setData] = useState(() => mergedView(key));

  useEffect(() => {
    const rows = rowsOf(key);
    const me = { data: () => setData(mergedView(key)), status: () => {}, restored: () => {} };
    rows.forEach(k => { pipeFor(k).hooks.add(me); watch(k); });
    me.data();
    rows.forEach(k => loadInto(k));
    return () => rows.forEach(k => { pipeFor(k).hooks.delete(me); unwatch(k); });
  }, [key]);

  // A state the caller's own save path has already put on the server, taken
  // here so the next read measures against it.
  const take = useCallback((next) => {
    if (!isClassKey(key)) { pipeFor(key).basis = next; tell(key, next); return; }
    const { plan, rest } = splitParts(next);
    const held = splitParts(WARM.get(key) || {}).plan;
    const planKey = planKeyOf(key);
    pipeFor(planKey).basis = plan; tell(planKey, plan);
    pipeFor(key).basis = { ...held, ...rest }; tell(key, { ...held, ...rest });
  }, [key]);

  return [data, take];
}
