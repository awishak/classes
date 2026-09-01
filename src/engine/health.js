// What is wrong with the repository, as five numbers.
//
// The page could always answer what do I have. It could not answer what is
// wrong with what I have without me interrogating it: filter by a class, sort
// by tags, scroll, and count in my head. So the answer sits across the top,
// and every number is a filter, because a count I cannot act on is a fact I
// read once and forget.
//
// Five, and each one is a chore rather than a fault. Untagged material is
// material the tag filter cannot find. A block with no headline has no sentence
// for the room to read. An article with no link is a reading nobody can open.
// Never used is material I forgot I had. A broken link gets discovered in front
// of a room.

import { isBad } from "./links.js";

export const FLAGS = [
  { id: "untagged", label: "Untagged", hex: "#7c3aed",
    test: b => !(b.tags || []).length },
  { id: "nohead", label: "No headline", hex: "#b45309",
    test: b => !(b.headline || "").trim() },
  { id: "nolink", label: "Articles with no link", hex: "#0369a1",
    test: b => b.type === "link" && !(b.url || "").trim() },
  { id: "never", label: "Never used", hex: "#4b5563",
    test: b => !(b.uses || []).length },
  { id: "broken", label: "Link broken", hex: "#9f1239",
    test: b => isBad(b) },
];

export const flagOf = (id) => FLAGS.find(f => f.id === id) || null;

// Whether a block answers to a flag. An id nothing knows about hides nothing,
// so a stale address cannot empty the table.
export const carries = (block, id) => {
  const f = flagOf(id);
  return f ? !!f.test(block) : true;
};

// The five numbers, over whatever the rest of the filters have already left on
// screen, so the strip describes what I am looking at rather than the shelf.
export const healthCounts = (items) => {
  const c = {};
  FLAGS.forEach(f => { c[f.id] = 0; });
  (items || []).forEach(b => FLAGS.forEach(f => { if (f.test(b)) c[f.id]++; }));
  return c;
};

// Nothing wrong anywhere is worth saying out loud, and it is rare enough to be
// worth a different line than five zeroes.
export const allClear = (counts) => FLAGS.every(f => !counts[f.id]);
