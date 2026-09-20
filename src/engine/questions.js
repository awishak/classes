// Student questions. The ask page appends; the Dashboard reads, pushes to the
// classroom screen, and archives. Own key so a burst of questions during class
// never collides with a day-plan save.
//
// Shape at `${storageKey}-questions`:
//   { items: [{ id, text, who, anon, at, state, answer, answeredAt, publishedAt, hideName }] }
// state: "open" | "published" | "archived" | "trashed"
//
// Since 2026-09-20 this store is the class's FAQ. Andrew: "so basically it's
// an FAQ site. students can peruse the FAQs, and they can ask one, and they
// can ask to keep it anonymous, and the questions will show up at the top.
// and when i choose to answer a question, i can keep it anonymous and then
// publish my answer. i can also archive a question if i think it's not worth
// answering."
//
// So writing an answer is not publishing. An answer can sit in the queue
// while he works on the words; publishing is a press of its own, and it is
// the only thing that puts a question in front of the class. Archiving takes
// a question out of the queue without answering it.
//
// Two ways a name comes off. `anon` is the student's, ticked when they ask.
// `hideName` is his, chosen when he publishes, for a question that names
// somebody or that would embarrass the person who asked. Either one is
// enough, and neither can be undone by the other.
//
// `answered` is the state this file used before publishing was its own
// press. An old one with words in its answer reads as published.

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

  const patch = useCallback((id, fields) => {
    write((ref.current || []).map(q => q.id === id ? { ...q, ...fields } : q));
  }, [write]);

  // His answer, saved as he writes it. The class does not see it until he
  // publishes, so there is no half-finished answer on the page.
  const answer = useCallback((id, text) => {
    const words = String(text || "").trim();
    patch(id, { answer: words, answeredAt: words ? Date.now() : null });
  }, [patch]);

  // The press that puts a question and its answer in front of the class.
  const publish = useCallback((id, hideName) => {
    patch(id, { state: "published", publishedAt: Date.now(), hideName: !!hideName });
  }, [patch]);

  // Back to the queue, for a published answer he wants to rewrite.
  const unpublish = useCallback((id) => patch(id, { state: "open", publishedAt: null }), [patch]);

  // Not worth answering. It stays in the store and leaves both the queue and
  // the page, so a question nobody needs is not deleted evidence.
  const archive = useCallback((id) => patch(id, { state: "archived" }), [patch]);

  // End of session: everything still open goes to the archive, unanswered.
  const archiveOpen = useCallback(() => {
    write((ref.current || []).map(q => q.state === "open" ? { ...q, state: "archived" } : q));
  }, [write]);

  return { items, add, setState, archiveOpen, answer, publish, unpublish, archive };
}
