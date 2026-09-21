// Student questions. The ask page appends; the Dashboard reads, pushes to the
// classroom screen, and archives. Own key so a burst of questions during class
// never collides with a day-plan save.
//
// Shape at `${storageKey}-questions`:
//   { items: [{ id, text, who, anon, at, state, answer, answeredAt,
//               thanksQ: [name], thanksA: [name] }] }
// state: "open" | "archived" | "trashed"
//
// Since 2026-09-20 this store is the class's FAQ. Andrew: "so basically it's
// an FAQ site. students can peruse the FAQs, and they can ask one, and they
// can ask to keep it anonymous, and the questions will show up at the top.
// and when i choose to answer a question, i can keep it anonymous and then
// publish my answer. i can also archive a question if i think it's not worth
// answering."
//
// Andrew again, later the same night, with the whole shape of it: "on my
// side, as the instructor, i choose whether to answer a question, leave it
// alone, or archive it. but students see the questions, so they can say if
// they appreciate the question. when i answer, it appears live."
//
// So there is no publishing. A question is on the class's page the moment it
// is asked, an answer is on it the moment it is written, and archiving is the
// one thing that takes a question off. Three states were two too many: a
// question either counts or it is archived.
//
// A name comes off at the student's word: `anon`, ticked when they ask. A
// question asked in the open says who asked it, because a class where people
// put their name to a question is a better class than one where nobody does.
//
// `published` and `answered` are states this file used while publishing was a
// press of its own. Both read as a question on the page, which is what they
// were.

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

  // His answer, saved as he writes it, and live as soon as it is saved.
  const answer = useCallback((id, text) => {
    const words = String(text || "").trim();
    patch(id, { answer: words, answeredAt: words ? Date.now() : null });
  }, [patch]);

  // Not worth answering, or not worth the class reading. It stays in the
  // store and comes off the page, so a question nobody needs is not deleted
  // evidence. Back again with the same press.
  const archive = useCallback((id) => patch(id, { state: "archived" }), [patch]);
  const unarchive = useCallback((id) => patch(id, { state: "open" }), [patch]);

  // Thanks, for a question worth asking or an answer worth reading. Andrew,
  // 2026-09-20: "please have people be able to appreciate a question or
  // appreciate an answer." One per person per thing, and pressing it again
  // takes it back. Names are kept so nobody can thank a thing twice, and only
  // the count is ever shown.
  const appreciate = useCallback((id, part, who) => {
    const name = String(who || "").trim();
    if (!name) return;
    const field = part === "answer" ? "thanksA" : "thanksQ";
    const q = (ref.current || []).find(x => x.id === id);
    const had = (q?.[field] || []);
    patch(id, { [field]: had.includes(name) ? had.filter(n => n !== name) : [...had, name] });
  }, [patch]);

  // End of session: everything still open goes to the archive, unanswered.
  const archiveOpen = useCallback(() => {
    write((ref.current || []).map(q => q.state === "open" ? { ...q, state: "archived" } : q));
  }, [write]);

  return { items, add, setState, archiveOpen, answer, archive, unarchive, appreciate };
}
