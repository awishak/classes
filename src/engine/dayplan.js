// Day plan shape, in one place.
//
// This exists because the shape was being re-derived in three files and they
// disagreed. Day Plan normalised a slot before reading it; the Dashboard read
// `slot.items` raw, so any slot still in the older single-item shape rendered
// fine in Day Plan and vanished on the Dashboard. Same data, two readers, one
// of them silently wrong.
//
//   data.dayPlans[date] = { sequenceId, slots, blocks, slides, slidesClaim, notes }
//   slots[slot]         = { title?, note?, items: [{ id, seedId?, text?, bodyOverride?, links? }] }

import { genId } from "../utils.jsx";

export const FREEFORM = "__freeform";

export const blankDay = (config) => ({
  sequenceId: config.defaultSequenceId, slots: {}, blocks: [], slides: "", notes: "",
});

// A slot as stored may predate the items array. Everything that reads a slot
// goes through here.
export function normSlot(s) {
  if (!s) return { items: [] };
  if (Array.isArray(s.items)) return { title: s.title, note: s.note, items: s.items };
  const { seedId, text, bodyOverride, links, title, note } = s;
  const items = (seedId || text) ? [{ id: "legacy", seedId, text, bodyOverride, links: links || [] }] : [];
  return { title, note, items };
}

// Sequences are gone. Andrew, 2026-09-14: "let's get rid of the different
// types of sequences, I'm not using them." A day is the sections it has and
// nothing else, so every day reads as Freeform whatever sequenceId it stored.
// The ids stay in the store, and config.sequences stays in the template class,
// untouched and unread, so bringing them back is this function and no data.
//
// What changed on screen: the sequence's empty slots (an "opener" with nothing
// in it) no longer draw, and a slot that holds rows but was only ever named by
// the sequence reads Section N like any other nameless section.
export const sequenceOptions = () => [{ id: FREEFORM, name: "Freeform", slots: [] }];

export const sequenceFor = (config, id) =>
  sequenceOptions(config).find(s => s.id === id) || sequenceOptions(config)[0] || { slots: [] };

export const dayPlanFor = (data, config, date) =>
  ({ ...blankDay(config), ...((data?.dayPlans || {})[date] || {}) });

// Every section a day actually has, as [slot, what the section is called].
//
// A sequence is one source of sections and not the only one. A day set to
// Freeform has none of a sequence's slots, and a day whose sequence has been
// changed keeps whatever the old sequence left behind, so reading the sections
// off the sequence alone says a day has nowhere to land while the dashboard is
// drawing sections on that same day. The sections made by hand on the day are
// the `sec-` keys, and a slot holding items is a section whatever put it
// there.
//
// The Dashboard worked this out inline and the repository asked the sequence,
// which is the same disagreement between two readers of one shape that this
// file was made to end. One reader now.
export function sectionsOf(config, plan) {
  const sl = plan?.slots || {};
  const seqSlots = sequenceFor(config, plan?.sequenceId || config.defaultSequenceId).slots || [];
  const named = new Set(seqSlots.map(x => x.slot));
  const mine = Object.keys(sl).filter(k => k.startsWith("sec-"));
  const left = Object.keys(sl).filter(k =>
    !named.has(k) && !k.startsWith("sec-") && normSlot(sl[k]).items.length);

  // A section with no name of its own is called Section N, counting down the
  // day. Not "Untitled section", which said the same nothing on every one of
  // them, and not the storage key — a day set to Freeform keeps the slot keys
  // an earlier sequence left behind, so the screen was showing the word
  // "opener" as if that were a title Andrew had written.
  //
  // A slot the day's SEQUENCE declares keeps the sequence's own word, because
  // opener and problem are names, chosen by picking that sequence. Only the
  // ones with nothing behind them get numbered.
  return nameSections([
    ...seqSlots.map(x => [x.slot, normSlot(sl[x.slot]).title || x.slot]),
    ...mine.map(k => [k, normSlot(sl[k]).title || ""]),
    ...left.map(k => [k, normSlot(sl[k]).title || ""]),
  ]);
}

// An item and the notes under it move as one.
//
// A note is a row with depth, sitting after its item in the same list, so
// moving the item's row alone left its notes behind on whatever came before
// it. takeGroup lifts an item with every note under it (a note on its own is
// just itself); placeGroup puts the group back down before a row, and never
// in among another item's notes, where they would stop being that item's.
export function takeGroup(items, id) {
  const list = items || [];
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return { group: [], rest: list };
  let j = i + 1;
  if (!((list[i].depth || 0) > 0)) while (j < list.length && (list[j].depth || 0) > 0) j++;
  return { group: list.slice(i, j), rest: [...list.slice(0, i), ...list.slice(j)] };
}

export function placeGroup(items, group, beforeId) {
  const list = [...(items || [])];
  let at = beforeId ? list.findIndex(x => x.id === beforeId) : -1;
  if (at >= 0 && group.length && !((group[0].depth || 0) > 0)) {
    while (at < list.length && (list[at].depth || 0) > 0) at++;
    if (at >= list.length) at = -1;
  }
  if (at < 0) return [...list, ...group];
  return [...list.slice(0, at), ...group, ...list.slice(at)];
}

// The one place that decides what a nameless section is called. Exported
// because the Dashboard builds its own ordered list of sections for numbering
// the rows, and three files each carrying their own fallback string is how
// "Untitled section", the raw slot key and a real title all ended up on screen
// as if they were the same kind of thing.
//
// Takes [slot, title] pairs IN THE ORDER THE DAY RUNS and fills the blanks.
export const nameSections = (rows) =>
  rows.map(([slot, label], i) => [slot, (label || "").trim() || "Section " + (i + 1)]);

// Which slot a seed wants: the first one it declares that this day's sequence
// actually has, otherwise the front of the sequence.
//
// With no sequences there are no slots for a seed to ask for, so a seed goes
// into the section it names if the day has one by that key, else the day's
// first section, else a new nameless section.
export function slotForSeed(config, plan, seed) {
  const have = sectionsOf(config, plan).map(([slot]) => slot);
  const wanted = (seed.slots || []).find(s => have.includes(s));
  return wanted || have[0] || "sec-" + genId();
}

// Drop a seed into a day. Returns the slot it landed in, or null when the day
// has no sequence to land in.
export function addSeedToDay(update, config, date, seed) {
  let landed = null;
  update(prev => {
    const plans = { ...(prev.dayPlans || {}) };
    const day = { ...blankDay(config), ...(plans[date] || {}) };
    const slot = slotForSeed(config, day, seed);
    if (!slot) return prev;
    const slots = { ...(day.slots || {}) };
    const bucket = normSlot(slots[slot]);
    // Adding the same seed twice to one slot is almost always a misclick.
    if (bucket.items.some(it => it.seedId === seed.id)) return prev;
    landed = slot;
    slots[slot] = { ...bucket, items: [...bucket.items, { id: genId(), seedId: seed.id }] };
    plans[date] = { ...day, slots };
    return { ...prev, dayPlans: plans };
  });
  return landed;
}

// Is this seed already somewhere in this day?
export const dayHasSeed = (data, config, date, seedId) => {
  const plan = dayPlanFor(data, config, date);
  return Object.values(plan.slots || {}).some(s => normSlot(s).items.some(it => it.seedId === seedId));
};
