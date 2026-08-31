// The two questions only the repository can ask.
//
// Both questions need every store open at once, which is why neither belongs
// on a dashboard. A dashboard sees one class, and the faults here are faults
// between classes.
//
//   Duplicates. The porting script deduped inside a class and never across
//   classes, using a URL where there was one and the title otherwise. So the
//   same article can sit in five stores at once, each copy carrying its own
//   headline and its own tags, and editing one changes nothing anywhere else.
//   That is the exact failure blocks were built to end, still present in the
//   material that arrived before the rule existed. The key here is the same key
//   the porting script used, on purpose.
//
//   Loose ends. A row in a day plan holds a blockId and nothing else, and a
//   schedule item holds a libId. When either points at a block that is gone,
//   the row renders blank and says nothing about why. Deleting a block from
//   the repository creates exactly that kind of row, and link-readings.mjs
//   left behind every scheduled item whose old library id never matched a
//   block by URL or by title.
//
// Everything here is pure. The page decides what to write, and these functions
// only say what is wrong and what a repair would look like.

import { normSlot } from "./dayplan.js";
import { todayStamp } from "./blocks.js";

// ─── keys ───
// A web address, stripped of the parts that are not the address: the scheme,
// the www, a trailing slash, the query, and the fragment. Two links to the
// same reading rarely agree on any of those.
export const normUrl = (u) => {
  const s = (u || "").trim().toLowerCase();
  if (!s) return "";
  try {
    const x = new URL(s.startsWith("http") ? s : "https://" + s);
    return x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/+$/, "");
  } catch {
    return s.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
};

// A title, stripped to the words. Punctuation and case are how the same
// reading gets typed two different ways in two different quarters.
export const normTitle = (t) => (t || "").trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, " ").trim().replace(/^(a|an|the) /, "");

// A link is the same thing whatever kind I filed the link under. A title is
// only the same thing inside one kind, because "Framing" the note and
// "Framing" the activity are two different objects.
export const keyOf = (b) => {
  const u = normUrl(b.url);
  if (u) return "u:" + u;
  const t = normTitle(b.title);
  return t ? "t:" + (b.type || "note") + ":" + t : "";
};

// ─── duplicates ───
// Takes the index the page already builds: blocks carrying their owner, the
// store they live in, and every place they turn up.
export function findDuplicates(items) {
  const by = new Map();
  (items || []).forEach(b => {
    const k = keyOf(b);
    if (!k) return;
    if (!by.has(k)) by.set(k, []);
    by.get(k).push(b);
  });

  const clusters = [];
  by.forEach((blocks, key) => {
    if (blocks.length < 2) return;
    // Best survivor first: the copy carrying the most uses, then the oldest,
    // then the one with the most written on it. A merge defaults to the copy
    // that most of the term is already pointing at.
    const ranked = [...blocks].sort((a, b) =>
      b.uses.length - a.uses.length
      || String(a.created || "").localeCompare(String(b.created || ""))
      || filled(b) - filled(a));
    const homes = new Set(ranked.map(b => b.target));
    clusters.push({
      key, on: key.startsWith("u:") ? "link" : "title",
      what: key.slice(key.indexOf(":", 2) + 1) || key.slice(2),
      blocks: ranked,
      spans: homes.size > 1,
      uses: ranked.reduce((n, b) => n + b.uses.length, 0),
    });
  });

  // The ones that cross a class come first, because those are the ones costing
  // me an edit that does not travel.
  return clusters.sort((a, b) =>
    (b.spans ? 1 : 0) - (a.spans ? 1 : 0) || b.blocks.length - a.blocks.length || b.uses - a.uses);
}

const FIELDS = ["title", "headline", "body", "url", "concept", "source"];
// What a flow row can carry besides the pointer at a block.
const ROW_EXTRAS = ["text", "links", "schedItemId", "feature", "bodyOverride", "done"];
const filled = (b) => FIELDS.filter(f => (b[f] || "").trim()).length;

// One block out of many: the survivor keeps everything it has and takes what
// it is missing, oldest copy first, so a headline written once is never lost.
export function foldInto(survivor, losers) {
  const out = { ...survivor };
  delete out.owner; delete out.target; delete out.uses;
  const tags = [...(out.tags || [])];
  const scheduled = [...(out.scheduled || [])];
  const children = [...(out.children || [])];
  losers.forEach(l => {
    FIELDS.forEach(f => { if (!(out[f] || "").trim() && (l[f] || "").trim()) out[f] = l[f]; });
    (l.tags || []).forEach(t => { if (!tags.includes(t)) tags.push(t); });
    (l.scheduled || []).forEach(d => { if (!scheduled.includes(d)) scheduled.push(d); });
    (l.children || []).forEach(c => { if (!children.includes(c)) children.push(c); });
    if (String(l.created || "") < String(out.created || "")) out.created = l.created;
  });
  return { ...out, tags, scheduled, children };
}

// ─── the merge ───
// Returns one new store per store that changes, and nothing for the stores
// that do not. The page hands each result to the writer for that store.
//
// The losing blocks are never thrown away. Each one is kept whole in the
// shared store under `merged`, with the store the block came from and the
// block it was merged into, so a merge made in error can be read back.
export function applyMerge({ stores, classes, cluster, survivorId, toShared, now }) {
  const survivor = cluster.blocks.find(b => b.id === survivorId) || cluster.blocks[0];
  const losers = cluster.blocks.filter(b => b.id !== survivor.id);
  if (!losers.length) return { patches: {}, repointed: 0, home: survivor.target };

  const map = {};
  losers.forEach(l => { map[l.id] = survivor.id; });
  const home = toShared ? "shared" : survivor.target;
  const folded = foldInto(survivor, losers);
  const next = {};
  const take = (target) => next[target] || (next[target] = { ...(stores[target] || {}) });
  let repointed = 0;

  // Every class: point the rows and the weeks at the survivor, and drop the
  // losing blocks that live in this class.
  classes.forEach(c => {
    const cur = stores[c.id] || {};
    let touched = false;

    const dayPlans = {};
    let plansChanged = false;
    Object.entries(cur.dayPlans || {}).forEach(([date, plan]) => {
      const slots = {};
      let dayChanged = false;
      Object.entries(plan?.slots || {}).forEach(([slot, bucket]) => {
        const b = normSlot(bucket);
        let hit = false;
        const items = b.items.map(it => {
          if (!it.blockId || !map[it.blockId]) return it;
          hit = true; repointed++;
          return { ...it, blockId: map[it.blockId] };
        });
        if (!hit) { slots[slot] = bucket; return; }
        // Repointing can land the survivor twice in one section, and two rows
        // for one block is a row I would then delete by hand. The first row
        // stays, and takes anything the second row was carrying that the
        // first row has not got: a reading dragged in keeps its link, a row
        // pointing back at a schedule item keeps the pointer.
        const at = new Map();
        const once = [];
        items.forEach(it => {
          if (!it.blockId) { once.push(it); return; }
          const had = at.get(it.blockId);
          if (had === undefined) { at.set(it.blockId, once.length); once.push(it); return; }
          const keepRow = { ...once[had] };
          ROW_EXTRAS.forEach(f => { if (keepRow[f] === undefined && it[f] !== undefined) keepRow[f] = it[f]; });
          once[had] = keepRow;
        });
        slots[slot] = { ...b, items: once };
        dayChanged = true;
      });
      dayPlans[date] = dayChanged ? { ...plan, slots } : plan;
      if (dayChanged) plansChanged = true;
    });

    let schedule = cur.schedule;
    if (Array.isArray(schedule)) {
      let schedChanged = false;
      schedule = schedule.map(w => {
        let hit = false;
        const items = (w.items || []).map(i => {
          if (!i.libId || !map[i.libId]) return i;
          hit = true; repointed++;
          return { ...i, libId: map[i.libId] };
        });
        if (!hit) return w;
        schedChanged = true;
        const seen = new Set();
        return { ...w, items: items.filter(i => {
          if (!i.libId) return true;
          const k = i.libId + "|" + (i.date || "");
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }) };
      });
      if (schedChanged) touched = true; else schedule = cur.schedule;
    }

    const blocks = { ...(cur.blocks || {}) };
    let blocksChanged = false;
    Object.keys(map).forEach(id => {
      if (blocks[id]) { delete blocks[id]; blocksChanged = true; }
    });
    // A set holding a losing block now holds the survivor instead.
    Object.keys(blocks).forEach(k => {
      const kids = blocks[k].children || [];
      if (!kids.some(id => map[id])) return;
      const moved = [];
      kids.forEach(id => { const to = map[id] || id; if (!moved.includes(to)) moved.push(to); });
      blocks[k] = { ...blocks[k], children: moved };
      blocksChanged = true;
    });
    if (home !== c.id && blocks[survivor.id] && survivor.target === c.id) {
      delete blocks[survivor.id];
      blocksChanged = true;
    }
    if (home === c.id) { blocks[folded.id] = folded; blocksChanged = true; }

    if (plansChanged || touched || blocksChanged) {
      const d = take(c.id);
      if (plansChanged) d.dayPlans = dayPlans;
      if (touched) d.schedule = schedule;
      if (blocksChanged) d.blocks = blocks;
    }
  });

  // The shared shelf: the survivor when the survivor moves here, the losing
  // blocks that lived here, and the record of what was merged away.
  const shared = take("shared");
  const sBlocks = { ...(shared.blocks || {}) };
  Object.keys(map).forEach(id => { delete sBlocks[id]; });
  if (home !== "shared") delete sBlocks[survivor.id];
  if (home === "shared") sBlocks[folded.id] = folded;
  shared.blocks = sBlocks;
  shared.merged = [
    ...(shared.merged || []),
    ...losers.map(l => {
      const { owner, target, uses, ...block } = l;
      return { at: todayStamp(now), into: survivor.id, from: target, block };
    }),
  ];

  return { patches: next, repointed, home, folded, losers: losers.length };
}

// ─── loose ends ───
// A pointer with nothing on the other end. Two shapes, because a flow row and
// a week item break differently: a flow row carries only the pointer, so a
// broken one is blank on the screen and can only be taken off. A week item
// carries its own title and link, so a broken one can be repaired into the
// block the item always should have been.
export function findLooseEnds(stores, classes) {
  const out = [];
  const shared = (stores.shared || {}).blocks || {};
  (classes || []).forEach(c => {
    const d = stores[c.id] || {};
    const blocks = d.blocks || {};
    const has = (id) => !!(blocks[id] || shared[id]);
    // An id from the library the engine had before blocks existed is a
    // different fault from an id pointing at nothing at all, and it says so.
    const legacy = new Set((d.library || c.library || []).map(l => l.id));

    Object.entries(d.dayPlans || {}).forEach(([date, plan]) => {
      Object.entries(plan?.slots || {}).forEach(([slot, bucket]) => {
        const b = normSlot(bucket);
        b.items.forEach(it => {
          if (!it.blockId || has(it.blockId)) return;
          out.push({ id: c.id + ":" + date + ":" + slot + ":" + it.id, kind: "flow", cls: c,
            date, slot, section: b.title || slot, itemId: it.id, points: it.blockId,
            words: (it.text || "").trim(), legacy: legacy.has(it.blockId) });
        });
      });
    });

    // A class with no saved schedule is running the seed weeks out of its
    // config, and those weeks point at the seed library in the same config.
    // The pair is consistent, so counting it as breakage is noise that hides
    // the breakage that is real.
    const seeded = !Array.isArray(d.schedule);
    (d.schedule || c.scheduleWeeks || []).forEach(w => {
      (w.items || []).forEach(it => {
        if (!it.libId || has(it.libId)) return;
        if (seeded && legacy.has(it.libId)) return;
        out.push({ id: c.id + ":" + (w.id || "") + ":" + it.id, kind: "week", cls: c,
          weekId: w.id || "", itemId: it.id, points: it.libId, words: (it.title || "").trim(),
          url: it.url || "", type: it.type || "reading", date: it.date || "",
          dates: w.dates || [], legacy: legacy.has(it.libId), stored: Array.isArray(d.schedule) });
      });
    });
  });
  return out;
}

// ─── the repairs ───
// Each one takes the store as it is and gives back the store as it should be,
// so the page can hand the result straight to a writer.
export const dropFlowRow = (data, le) => {
  const plan = (data.dayPlans || {})[le.date];
  if (!plan) return data;
  const bucket = normSlot((plan.slots || {})[le.slot]);
  return {
    ...data,
    dayPlans: { ...data.dayPlans, [le.date]: { ...plan, slots: { ...plan.slots,
      [le.slot]: { ...bucket, items: bucket.items.filter(it => it.id !== le.itemId) } } } },
  };
};

const weeksOf = (data, cls) => data.schedule || cls.scheduleWeeks || [];

export const dropWeekItem = (data, cls, le) => ({
  ...data,
  schedule: weeksOf(data, cls).map(w => w.id !== le.weekId ? w
    : { ...w, items: (w.items || []).filter(i => i.id !== le.itemId) }),
});

// Keep the item, drop the pointer. The words and the link were always on the
// item, so the day loses nothing and the item stops claiming a block.
export const unlinkWeekItem = (data, cls, le) => ({
  ...data,
  schedule: weeksOf(data, cls).map(w => w.id !== le.weekId ? w
    : { ...w, items: (w.items || []).map(i => i.id === le.itemId ? { ...i, libId: "" } : i) }),
});

// The repair worth making: turn the item into the block the item was standing
// in for, and point the item at the new block.
export const blockFromWeekItem = (data, cls, le, block) => ({
  ...data,
  blocks: { ...(data.blocks || {}), [block.id]: block },
  schedule: weeksOf(data, cls).map(w => w.id !== le.weekId ? w
    : { ...w, items: (w.items || []).map(i => i.id === le.itemId ? { ...i, libId: block.id } : i) }),
});
