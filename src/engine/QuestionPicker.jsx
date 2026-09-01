// Build a game out of the shelf.
//
// Andrew, on finding every quiz question he has ever written sitting in the
// repository: "does that mean for games/quizzes, i can choose from a selection
// of available questions?" It did not, and now it does.
//
// The panel drops into a game editor, reads the class's questions and the
// shared ones, and hands back whatever is picked in the shape that editor
// saves. Sets come across whole, so a Team Trivia round from week 7 or a
// weekly game from week 2 arrives as the ten questions it was.
//
// Styled to sit inside the old forked class files rather than the engine, so
// it borrows nothing from the repository's stylesheet and carries its own.

import { useState, useEffect, useMemo } from "react";
import { loadBank, searchBank, isReady, asChoice, asFree } from "./qbank.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const INK = "#111827";
const INK2 = "#4b5563";
const MUTED = "#646b75";
const LINE = "#e5e7eb";
const GREEN = "#047857";

export default function QuestionPicker({ storageKey, mode, category, categories, onAdd, onClose }) {
  const [bank, setBank] = useState(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(() => new Set());
  const [openSet, setOpenSet] = useState("");
  const [said, setSaid] = useState("");

  useEffect(() => {
    let alive = true;
    loadBank(storageKey).then(b => { if (alive) setBank(b); });
    return () => { alive = false; };
  }, [storageKey]);

  const hits = useMemo(() => (bank ? searchBank(bank.questions, q) : []), [bank, q]);
  const sets = useMemo(() => {
    if (!bank) return [];
    const t = q.trim().toLowerCase();
    if (!t) return bank.sets;
    return bank.sets.filter(s =>
      s.title.toLowerCase().includes(t) || s.items.some(i => i.text.toLowerCase().includes(t)));
  }, [bank, q]);

  const shape = (one) => (mode === "free" ? asFree(one) : asChoice(one, category, categories));

  const addPicked = () => {
    const chosen = hits.filter(x => picked.has(x.id));
    if (!chosen.length) return;
    onAdd(chosen.map(shape));
    setSaid(chosen.length + (chosen.length === 1 ? " question added" : " questions added"));
    setPicked(new Set());
  };

  const addSet = (s) => {
    onAdd(s.items.map(shape));
    setSaid(s.title + ", all " + s.items.length + " of them");
  };

  const toggle = (id) => setPicked(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div style={box}>
      <div style={row}>
        <b style={{ fontSize: 14, color: INK }}>From the repository</b>
        <span style={dim}>
          {bank ? bank.questions.length + " questions, " + bank.sets.length + " sets" : "Reading the shelf…"}
        </span>
        <button onClick={onClose} style={{ ...pill, marginLeft: "auto" }}>Close</button>
      </div>

      <input value={q} onChange={e => setQ(e.target.value)} style={input}
        placeholder="Search every question you have written" aria-label="Search the repository for a question" />

      {sets.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {sets.map(s => (
            <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => addSet(s)} style={{ ...pill, borderColor: INK, color: INK }}>
                {s.title} · {s.items.length}
              </button>
              <button onClick={() => setOpenSet(openSet === s.id ? "" : s.id)} style={{ ...pill, padding: "4px 8px" }}
                aria-label={"What is in " + s.title}>
                {openSet === s.id ? "Hide" : "Look"}
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {openSet ? (
        <ul style={list}>
          {(sets.find(s => s.id === openSet)?.items || []).map(i => (
            <li key={i.id} style={{ fontSize: 13, color: INK2, padding: "3px 0" }}>{i.text}</li>
          ))}
        </ul>
      ) : null}

      {bank && !hits.length ? <div style={dim}>Nothing on the shelf matches those words.</div> : null}

      <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {hits.slice(0, 60).map(one => {
          const on = picked.has(one.id);
          const ready = isReady(one);
          return (
            <label key={one.id} style={{ ...card, borderColor: on ? INK : LINE, background: on ? "#f8f7f5" : "#fff" }}>
              <input type="checkbox" checked={on} onChange={() => toggle(one.id)} style={{ width: 17, height: 17, marginTop: 2 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, color: INK, lineHeight: 1.35 }}>{one.text}</span>
                {one.options.length ? (
                  <span style={{ display: "block", fontSize: 12, color: MUTED, marginTop: 3 }}>
                    {one.options.map((o, i) => (i === one.correct ? "✓ " + o : o)).join("  ·  ")}
                  </span>
                ) : null}
                {one.answer ? (
                  <span style={{ display: "block", fontSize: 12, color: GREEN, marginTop: 3 }}>{one.answer}</span>
                ) : null}
                {mode !== "free" && !ready ? (
                  <span style={{ display: "block", fontSize: 11, color: "#9f1239", marginTop: 3 }}>
                    No right answer was kept for this one, so pick the right option after adding
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <div style={row}>
        <button onClick={addPicked} disabled={!picked.size}
          style={{ ...pill, background: picked.size ? INK : "#f3f4f6", color: picked.size ? "#fff" : MUTED, borderColor: picked.size ? INK : LINE }}>
          {picked.size ? "Add " + picked.size + " to the game" : "Nothing picked yet"}
        </button>
        {hits.length > 60 ? <span style={dim}>Showing 60 of {hits.length}. Search to narrow the list.</span> : null}
        {said ? <span style={{ ...dim, color: GREEN }}>{said}</span> : null}
      </div>
    </div>
  );
}

const box = { border: "1px solid " + INK, borderRadius: 14, padding: 12, marginBottom: 10, background: "#fff",
  display: "flex", flexDirection: "column", gap: 8, fontFamily: F };
const row = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const dim = { fontSize: 12, color: MUTED };
const pill = { minHeight: 32, padding: "0 12px", borderRadius: 999, border: "1px solid " + LINE, background: "#fff",
  color: INK2, fontFamily: F, fontSize: 13, cursor: "pointer" };
const input = { width: "100%", minHeight: 40, padding: "0 12px", borderRadius: 10, border: "1px solid " + LINE,
  fontFamily: F, fontSize: 14, color: INK };
const card = { display: "flex", gap: 9, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10,
  border: "1px solid " + LINE, cursor: "pointer" };
const list = { margin: 0, padding: "6px 10px", listStyle: "none", background: "#f8f7f5", borderRadius: 10 };
