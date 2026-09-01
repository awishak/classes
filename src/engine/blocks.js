// Blocks. The one repository everything is made of.
//
// Before this a piece of content could live in five places that did not know
// about each other — config.seeds, config.library, week.items, data.stocked,
// and the flow itself — so the same article could exist four times over and
// changing it in one place changed nothing anywhere else.
//
// Now there is one kind of thing. A block is stored once and REFERENCED
// wherever it is used, so editing it changes it everywhere: the day plan, the
// schedule, the room screen. That is the whole point, and it is why the
// headline lives on the block rather than on the placement.
//
// Two stores. A class's own blocks live in its class data at `data.blocks`.
// Blocks that belong to me rather than to any one class live in a shared store
// of their own, and every class can see them.

import { genId } from "../utils.jsx";

export const SHARED_KEY = "ishak-blocks-v1";
export const SHARED_OWNER = "ishak";
// What the shared shelf is called on a screen. It was written out by hand in
// eight places, which is how a one-word rename turns into a hunt.
export const SHARED_LABEL = "Shared";

// The building blocks, in the order they are offered.
export const TYPES = [
  { id: "note",       label: "Note",       color: "#646b75", hint: "Something I want to say." },
  { id: "link",       label: "Article",    color: "#0369a1", hint: "A reading, an article, a video." },
  { id: "story",      label: "Story",      color: "#9f1239", hint: "A story or hook I can tell." },
  { id: "activity",   label: "Activity",   color: "#047857", hint: "Something the room does." },
  { id: "question",   label: "Question",   color: "#7c3aed", hint: "A poll, a quiz question, a prompt." },
  { id: "assignment", label: "Assignment", color: "#b45309", hint: "What an assignment asks for." },
  { id: "board",      label: "Board",      color: "#0f766e", hint: "A discussion board and what got posted." },
  { id: "set",        label: "Set",        color: "#4b5563", hint: "A group of the above, kept together." },
];

// ─── the kinds Andrew added, and the ones he renamed ───
//
// The eight above are what the code knows how to do things with. The list of
// kinds a person wants is longer and is nobody's business but his: a video is
// not an article, and Article was called Link until he said otherwise.
//
// Custom kinds live in the shared store, and they are also held here, because
// typeOf is called from a dozen places that have no business loading a store to
// answer what a block is called. The repository and the dashboard both hand
// this the shared store's version as they render, which is idempotent and
// derived from state either way. Nothing here is the source of truth; the
// shared store is, and this is the copy every reader can reach.
let ADDED = [];
let RENAMED = {};

export function registerTypes({ added, labels } = {}) {
  ADDED = (added || []).filter(t => t && t.id);
  RENAMED = labels || {};
}

export const allTypes = () => [
  ...TYPES.map(t => (RENAMED[t.id] ? { ...t, label: RENAMED[t.id] } : t)),
  ...ADDED,
];

// An id with no kind behind it is a kind that was deleted while blocks still
// carried it. Saying the id back is worth more than calling the block a Note,
// which is what a silent fallback to the first kind did.
export const typeOf = (id) => {
  if (!id) return TYPES[0];
  return allTypes().find(t => t.id === id) || { id, label: id, color: "#646b75", hint: "" };
};

// Today, as the schedule writes dates. Passed in so nothing here reaches for a
// clock of its own.
export const todayStamp = (d) => (d || new Date()).toISOString().slice(0, 10);

export function makeBlock(patch, now) {
  return {
    id: genId(),
    type: "note",
    title: "",
    body: "",
    url: "",
    headline: "",     // the one sentence the room reads. Follows the block.
    children: [],     // one level deep, and no deeper.
    tags: [],         // topics I add by hand
    concept: "",
    source: "",
    refId: "",        // an assignment block points at the assignment it details
    created: todayStamp(now),
    scheduled: [],    // every class date it has been placed on. Filled in on placement.
    ...patch,
  };
}

// ─── reading ───
// A class sees its own blocks and the shared ones, always. The shared ones are
// last so a class's own version of something wins a name collision.
export const allBlocks = (data, shared) => [
  ...Object.values(data?.blocks || {}),
  ...Object.values(shared?.blocks || {}),
];

export const blockById = (data, shared, id) =>
  (data?.blocks || {})[id] || (shared?.blocks || {})[id] || null;

export const isShared = (data, id) => !(data?.blocks || {})[id];

// One level of nesting: a block's children, resolved.
export const childrenOf = (data, shared, block) =>
  (block?.children || []).map(id => blockById(data, shared, id)).filter(Boolean);

// ─── tags ───
// Faceted rather than hierarchical: a block is filtered by several independent
// axes at once instead of living in one folder. Two of the facets are written
// for me — when I made it, and every class date it has been used on.
export function facets(blocks) {
  const topics = new Set();
  const concepts = new Set();
  const types = new Set();
  blocks.forEach(b => {
    (b.tags || []).forEach(t => topics.add(t));
    if (b.concept) concepts.add(b.concept);
    if (b.type) types.add(b.type);
  });
  return {
    topics: [...topics].sort(),
    concepts: [...concepts].sort(),
    types: allTypes().filter(t => types.has(t.id)),
  };
}

export function matches(block, q) {
  const { text, type, topic, concept } = q || {};
  if (type && block.type !== type) return false;
  if (topic && !(block.tags || []).includes(topic)) return false;
  if (concept && block.concept !== concept) return false;
  if (text) {
    const hay = [block.title, block.body, block.headline, block.source, ...(block.tags || [])]
      .filter(Boolean).join(" ").toLowerCase();
    if (!hay.includes(text.trim().toLowerCase())) return false;
  }
  return true;
}

export const sortBlocks = (blocks, by) => {
  const out = [...blocks];
  if (by === "title") out.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  else out.sort((a, b) => String(b.created || "").localeCompare(String(a.created || "")) || (a.title || "").localeCompare(b.title || ""));
  return out;
};

// ─── writing ───
// Every write goes to the store the block belongs to, so editing a shared block
// from inside COMM 118 updates it for every class, which is the point.
export const writeBlock = (update, block) => update(prev => ({
  ...prev,
  blocks: { ...(prev.blocks || {}), [block.id]: block },
}));

export const deleteBlock = (update, id) => update(prev => {
  const blocks = { ...(prev.blocks || {}) };
  delete blocks[id];
  // and take it out of anything holding it as a child
  Object.keys(blocks).forEach(k => {
    if ((blocks[k].children || []).includes(id)) {
      blocks[k] = { ...blocks[k], children: blocks[k].children.filter(c => c !== id) };
    }
  });
  return { ...prev, blocks };
});

// Placing a block on a day stamps that date onto it, so "where has this been
// used" is answerable without walking every plan.
export const stampScheduled = (update, id, date) => update(prev => {
  const blocks = { ...(prev.blocks || {}) };
  const b = blocks[id];
  if (!b || (b.scheduled || []).includes(date)) return prev;
  blocks[id] = { ...b, scheduled: [...(b.scheduled || []), date] };
  return { ...prev, blocks };
});
