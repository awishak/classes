// Saving for the visual story sheets, built so typing is never lost.
//
// Andrew, 2026-10-13: "If you have a situation in which students type
// something that disappears, real trouble, and then you won't be able to use
// this at all." So every change goes to the browser first, then to the
// server a beat later, one field at a time through worktopia/store.js. A
// field stays in the browser's copy until the server has the same words, so
// a failed save, a closed tab or a dead battery leaves the words on this
// computer, and the next load puts them back and sends them again.
//
// Plain JS, no React, so the smoke run can drive it with a store that fails.
// createSaver({ store, draftKey, storage, onStatus, delay, retry }) answers
// { load, change, flush, pending, destroy }. Status is one of "loading",
// "saved", "saving", "retrying" or "failed-load".

const readDraft = (storage, key) => { try { return JSON.parse(storage?.getItem(key) || "{}") || {}; } catch { return {}; } };
const writeDraft = (storage, key, d) => {
  try { if (Object.keys(d).length) storage?.setItem(key, JSON.stringify(d)); else storage?.removeItem(key); } catch { /* private mode: the server copy still goes */ }
};

export function createSaver({ store, draftKey, storage, onStatus = () => {}, delay = 700, retry = 4000 }) {
  let pending = readDraft(storage, draftKey);   // field -> words not yet on the server
  let timer = null, running = false, again = false, dead = false;
  const say = (s) => { if (!dead) onStatus(s); };

  async function flush() {
    clearTimeout(timer); timer = null;
    if (running) { again = true; return; }
    const fields = Object.keys(pending);
    if (!fields.length) { say("saved"); return; }
    running = true; say("saving");
    let failed = false;
    for (const field of fields) {
      const value = pending[field];
      try {
        // A blank answer is no row at all: the table holds 1 to 500 characters a row.
        if (String(value).trim()) await store.save(field, value);
        else await store.remove(field);
        // Typed again while the save was out: keep the newer words pending.
        if (pending[field] === value) { delete pending[field]; writeDraft(storage, draftKey, pending); }
      } catch { failed = true; }
    }
    running = false;
    if (dead) return;
    if (again) { again = false; return flush(); }
    if (failed) { say("retrying"); timer = setTimeout(flush, retry); }
    else say(Object.keys(pending).length ? "saving" : "saved");
  }

  return {
    // The server's answers with this computer's unsaved words laid on top.
    async load() {
      say("loading");
      const got = await store.load();
      const answers = { ...(got.answers || {}), ...pending };
      if (Object.keys(pending).length) flush(); else say("saved");
      return { answers, submitted_at: got.submitted_at || null };
    },
    change(field, value) {
      pending[field] = value;
      writeDraft(storage, draftKey, pending);
      say("saving");
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    flush,
    pending: () => ({ ...pending }),
    destroy() { dead = true; clearTimeout(timer); },
  };
}
