// The questions on the shelf, in the shape a game editor can use.
//
// Every quiz, trivia and survey question Andrew has ever written is already a
// block: the porting script brought 157 of them across and kept each game as a
// set holding its own questions. And the game editor could not see any of it,
// so the questions were searchable and unusable at the same time and the next
// game got typed from scratch.
//
// A question block carries what it needs at `q`:
//
//   q: { options: [...], correct: 2, answer: "Free, liberty", category: "on_topic" }
//
// Blocks that came across before that field existed keep the flattened
// sentence the porting script wrote, so the words are read back out of the
// body rather than lost. scripts/answers-to-blocks.mjs put the structure back
// on the 83 questions the old games still knew the answers to.

import { loadClass } from "./store.js";
import { SHARED_KEY } from "./blocks.js";

// What the porting script wrote when it had nowhere structured to put it.
export const parseOptions = (body) => {
  const m = (body || "").match(/^Options:\s*(.+)$/m);
  return m ? m[1].split(/\s+·\s+/).map(s => s.trim()).filter(Boolean) : [];
};

export const parseAnswer = (body) => {
  const m = (body || "").match(/^Answer:\s*(.+)$/m);
  return m ? m[1].trim() : "";
};

// One block, as a question. The structured field wins where it exists and the
// sentence fills in where it does not.
export function questionOf(block) {
  const q = block?.q || {};
  const options = (q.options || []).length ? q.options : parseOptions(block?.body);
  return {
    id: block.id,
    text: block.title || "",
    options,
    correct: Number.isInteger(q.correct) ? q.correct : null,
    answer: q.answer || parseAnswer(block?.body),
    category: q.category || "",
    tags: block.tags || [],
    where: block.where || "",
  };
}

// A question is ready for a multiple-choice game when it has options and a
// right answer. Everything else can still be picked; the editor just has more
// to fill in, and saying which is which up front beats finding out in the row.
export const isReady = (q) => q.options.length >= 2 && Number.isInteger(q.correct);

// The shelf a game editor can reach: the class's own questions and the shared
// ones, plus the sets, each set holding the questions it points at.
export function bankOf(store, shared) {
  const blocks = { ...(shared?.blocks || {}), ...(store?.blocks || {}) };
  const questions = [];
  const sets = [];
  Object.values(blocks).forEach(b => {
    if (b.type === "question") questions.push(questionOf(b));
  });
  const byId = {};
  questions.forEach(q => { byId[q.id] = q; });
  Object.values(blocks).forEach(b => {
    if (b.type !== "set") return;
    const items = (b.children || []).map(id => byId[id]).filter(Boolean);
    if (items.length) sets.push({ id: b.id, title: b.title || "Untitled set", tags: b.tags || [], items });
  });
  questions.sort((a, b) => a.text.localeCompare(b.text));
  sets.sort((a, b) => a.title.localeCompare(b.title));
  return { questions, sets };
}

// Read the two stores a class can see. Called by the game editors, which live
// in the old forked files and have no store of their own to read blocks from.
export async function loadBank(storageKey) {
  const [store, shared] = await Promise.all([loadClass(storageKey), loadClass(SHARED_KEY)]);
  return bankOf(store, shared);
}

export function searchBank(list, text) {
  const t = (text || "").trim().toLowerCase();
  if (!t) return list;
  return list.filter(q =>
    [q.text, q.answer, (q.options || []).join(" "), (q.tags || []).join(" "), q.title]
      .filter(Boolean).join(" ").toLowerCase().includes(t));
}

// ─── what a game editor wants back ───
// Two editors, two shapes. The weekly game scores a chosen option and Team
// Trivia scores an answer a person reads out, so a question goes to each one
// in the shape that editor already saves.
//
// Four option boxes, because the weekly editor draws four and an option that
// is not there would render as nothing at all.
//
// No category. Andrew took categories off the quizzes on 1 September and every
// question is worth ten now, and a question carrying an old category is scored
// the old way, so bringing a category across from a block written last year
// would quietly make an imported question worth fifteen.
export const asChoice = (q) => ({
  text: q.text,
  options: [0, 1, 2, 3].map(i => q.options[i] || ""),
  correct: Number.isInteger(q.correct) ? q.correct : 0,
});

export const asFree = (q) => ({
  id: "q_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
  text: q.text,
  expectedAnswer: q.answer || "",
  pointsOverride: null,
});
