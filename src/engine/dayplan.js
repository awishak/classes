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

export const sequenceOptions = (config) =>
  [...(config.sequences || []), { id: FREEFORM, name: "Freeform (no sequence)", slots: [] }];

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
  return [
    ...seqSlots.map(x => [x.slot, normSlot(sl[x.slot]).title || x.slot]),
    ...mine.map(k => [k, normSlot(sl[k]).title || "Untitled section"]),
    ...left.map(k => [k, normSlot(sl[k]).title || k]),
  ];
}

// Which slot a seed wants: the first one it declares that this day's sequence
// actually has, otherwise the front of the sequence.
export function slotForSeed(config, plan, seed) {
  const seq = sequenceFor(config, plan.sequenceId || config.defaultSequenceId);
  const slots = (seq.slots || []).map(s => s.slot);
  if (!slots.length) return null;
  const wanted = (seed.slots || []).find(s => slots.includes(s));
  return wanted || slots[0];
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
    landed = slot;
    const slots = { ...(day.slots || {}) };
    const bucket = normSlot(slots[slot]);
    // Adding the same seed twice to one slot is almost always a misclick.
    if (bucket.items.some(it => it.seedId === seed.id)) return prev;
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
