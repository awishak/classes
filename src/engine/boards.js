// Discussion boards: a prompt, and what the room wrote under it.
//
// The old hubs had four of these with sixty-six posts between them, and the
// engine had nowhere to put a post. So the Enter and Exit boards I write and
// cast are the prompt, and this is where the answers land.
//
// Its own realtime key, like questions and the poll, so a post appears on
// every phone in the room without anyone reloading.
//
// State at `${storageKey}-boards`:
//   { boards: { [id]: { id, prompt, at, closed, posts: [{ id, who, text, at }] } } }

import { useState, useEffect, useCallback, useRef } from "react";
import { genId } from "../utils.jsx";

export const boardsKey = (storageKey) => storageKey + "-boards";

// One board per prompt, so casting the same prompt twice lands in one thread
// rather than starting a second one nobody can find.
export const idForPrompt = (prompt) =>
  "b" + [...(prompt || "").trim().toLowerCase().replace(/\s+/g, " ")]
    .reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36);

export const postsOf = (board) => (board?.posts || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0));

export function useBoards(storageKey) {
  const key = boardsKey(storageKey);
  const [boards, setBoards] = useState(null);
  const ref = useRef({});
  const pending = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await window.storage.get(key, true);
        const v = r ? JSON.parse(r.value) : {};
        if (!alive) return;
        ref.current = v.boards || {};
        setBoards(ref.current);
      } catch { if (alive) { ref.current = {}; setBoards({}); } }
    })();
    const off = window.storage?.onUpdate?.(key, (val) => {
      if (pending.current > 0) return;      // our own write coming back
      try { const v = JSON.parse(val); ref.current = v.boards || {}; setBoards(ref.current); } catch { /* ignore */ }
    });
    return () => { alive = false; if (off) off(); };
  }, [key]);

  const write = useCallback((next) => {
    ref.current = next;
    setBoards({ ...next });
    pending.current++;
    Promise.resolve(window.storage.set(key, JSON.stringify({ boards: next }), true))
      .catch(() => {}).finally(() => { pending.current--; });
  }, [key]);

  // Opening a board that already exists returns the one that is there, so a
  // prompt cast on Tuesday and again on Thursday is one conversation.
  const open = useCallback((prompt) => {
    const id = idForPrompt(prompt);
    if (ref.current[id]) return id;
    write({ ...ref.current, [id]: { id, prompt, at: Date.now(), closed: false, posts: [] } });
    return id;
  }, [write]);

  const post = useCallback((id, who, text) => {
    const t = (text || "").trim();
    const b = ref.current[id];
    if (!t || !b || b.closed) return false;
    write({ ...ref.current, [id]: { ...b, posts: [...(b.posts || []), { id: genId(), who, text: t, at: Date.now() }] } });
    return true;
  }, [write]);

  const remove = useCallback((id, postId) => {
    const b = ref.current[id];
    if (!b) return;
    write({ ...ref.current, [id]: { ...b, posts: (b.posts || []).filter(p => p.id !== postId) } });
  }, [write]);

  const setClosed = useCallback((id, closed) => {
    const b = ref.current[id];
    if (!b) return;
    write({ ...ref.current, [id]: { ...b, closed } });
  }, [write]);

  return { boards, open, post, remove, setClosed };
}
