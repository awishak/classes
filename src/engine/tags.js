// Tags, across every store at once.
//
// Tags are free text, which is the right call when writing one and the wrong
// call a year later: framing, Framing and "framing " are three tags to the
// filter and one word to me. A facet that splits its own matches is worse than
// no facet, because the filter looks like it worked.
//
// So: every tag with a count and the classes it appears in, the tags that are
// the same word wearing different clothes, and one operation that covers
// renaming and merging both. Renaming a tag onto a tag that already exists is
// a merge, and there is no reason for those to be two different buttons.

// The comparison form. Not what gets stored, only what decides sameness.
import { SHARED_LABEL } from "./blocks.js";

export const normTag = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?]+$/, "");

// Every tag on the shelf, most used first.
export function tagIndex(items) {
  const by = new Map();
  (items || []).forEach(b => {
    (b.tags || []).forEach(t => {
      const key = t;
      if (!by.has(key)) by.set(key, { tag: t, n: 0, where: new Set(), blocks: [] });
      const e = by.get(key);
      e.n++;
      e.where.add(b.owner ? b.owner.code : SHARED_LABEL);
      e.blocks.push(b.id);
    });
  });
  return [...by.values()]
    .map(e => ({ ...e, where: [...e.where].sort() }))
    .sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
}

// The same word, filed more than one way. Only groups worth acting on come
// back, so a tag that is already the only spelling of itself is left alone.
export function lookalikes(index) {
  const by = new Map();
  index.forEach(e => {
    const k = normTag(e.tag);
    if (!k) return;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(e);
  });
  const out = [];
  by.forEach((tags, key) => {
    if (tags.length < 2) return;
    // The spelling most of the shelf already uses is the one to keep.
    out.push({ key, tags: [...tags].sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag)) });
  });
  return out.sort((a, b) => b.tags.length - a.tags.length || a.key.localeCompare(b.key));
}

// ─── writing ───
// One walk per store. `to` empty means delete the tag; `to` naming a tag that
// already exists means merge, and the block keeps one copy rather than two.
export function retagPatches({ stores, classes, from, to }) {
  const next = {};
  const want = (to || "").trim();
  const targets = [...(classes || []).map(c => c.id), "shared"];

  targets.forEach(target => {
    const cur = stores[target] || {};
    const blocks = cur.blocks || {};
    let changed = false;
    const out = {};
    Object.entries(blocks).forEach(([id, b]) => {
      const tags = b.tags || [];
      if (!tags.includes(from)) { out[id] = b; return; }
      const kept = [];
      tags.forEach(t => {
        const value = t === from ? want : t;
        if (!value) return;
        if (!kept.includes(value)) kept.push(value);
      });
      out[id] = { ...b, tags: kept };
      changed = true;
    });
    if (changed) next[target] = { ...cur, blocks: out };
  });

  return next;
}

// How many blocks a rename or a delete would touch, said before it happens.
export const wouldTouch = (index, from) => (index.find(e => e.tag === from) || { n: 0 }).n;
