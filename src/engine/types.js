// The kinds a block can be, as something Andrew sets rather than something the
// code decides.
//
// Eight kinds shipped in the code, and eight is a guess about how one person
// files their material. A video is not an article, a reading is not the same
// word as Article to the person who teaches the reading, and the day the guess
// is wrong the only fix is a deploy. So the list is his: rename any of the
// eight, add as many as he wants, colour each one, and delete one he added.
//
// What a custom kind does NOT get is behaviour. The eight built-in ids are
// wired into things that do work: an assignment goes onto the readings as an
// assignment, a set holds children, a board holds posts. A kind added here is
// a label and a colour on a block, which is exactly what a filing category is.
//
// Everything is kept in the shared store, because how I file my own material
// is a fact about me and not about COMM 118.
//
//   shared.blockTypes  [{ id, label, hint }]     the kinds he added
//   shared.typeLabels  { link: "Reading" }       the built-in kinds he renamed
//   shared.colors.types { video: "purple-mid" }  a swatch for either sort

import { TYPES } from "./blocks.js";

export const BUILT_IN = new Set(TYPES.map(t => t.id));

export const readAdded = (shared) =>
  (shared?.blockTypes || []).filter(t => t && t.id && !BUILT_IN.has(t.id));

export const readLabels = (shared) => shared?.typeLabels || {};

// The whole list, in the order the chips read: the built-in kinds first,
// wearing whatever names he has given them, then his own.
export const readTypes = (shared) => {
  const labels = readLabels(shared);
  return [
    ...TYPES.map(t => (labels[t.id] ? { ...t, label: labels[t.id] } : t)),
    ...readAdded(shared),
  ];
};

// An id made from the name, so a kind called Video is `video` and the store
// stays readable. A collision gets a number rather than silently merging two
// kinds that share a first word.
export function idForLabel(label, taken) {
  const base = (label || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  if (!base) return "";
  const has = new Set([...BUILT_IN, ...(taken || [])]);
  if (!has.has(base)) return base;
  let n = 2;
  while (has.has(base + "-" + n)) n++;
  return base + "-" + n;
}

// ─── writing ───
export const addType = (updateShared, label, hint) => updateShared(prev => {
  const added = readAdded(prev);
  const id = idForLabel(label, added.map(t => t.id));
  if (!id) return prev;
  return { ...prev, blockTypes: [...added, { id, label: (label || "").trim(), hint: (hint || "").trim() }] };
});

// One control for both sorts of kind. Renaming a built-in leaves an override
// beside the code's own name, so the id every block carries never changes and
// nothing has to be migrated to call a Link an Article.
export const renameType = (updateShared, id, label) => updateShared(prev => {
  const name = (label || "").trim();
  if (!name) return prev;
  if (BUILT_IN.has(id)) return { ...prev, typeLabels: { ...readLabels(prev), [id]: name } };
  return { ...prev, blockTypes: readAdded(prev).map(t => (t.id === id ? { ...t, label: name } : t)) };
});

// Put a built-in kind's name back to the one in the code.
export const resetName = (updateShared, id) => updateShared(prev => {
  const labels = { ...readLabels(prev) };
  delete labels[id];
  return { ...prev, typeLabels: labels };
});

// Only a kind he added can go. A built-in kind is wired into things that do
// work, and deleting the word would leave the work with no name on it.
export const dropType = (updateShared, id) => updateShared(prev => {
  if (BUILT_IN.has(id)) return prev;
  return { ...prev, blockTypes: readAdded(prev).filter(t => t.id !== id) };
});

// How many blocks a kind is holding, which is what says whether deleting the
// kind would leave anything stranded.
export const countTypes = (items) => {
  const c = {};
  (items || []).forEach(b => { c[b.type] = (c[b.type] || 0) + 1; });
  return c;
};

// A kind on the shelf that no list knows about, which is what deleting a kind
// while blocks still carry it leaves behind.
export const orphanTypes = (items, types) => {
  const known = new Set((types || []).map(t => t.id));
  const counts = countTypes(items);
  return Object.keys(counts).filter(id => id && !known.has(id))
    .map(id => ({ id, n: counts[id] }));
};
