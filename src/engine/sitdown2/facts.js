// Sit-Down 2: when, where, and who has which ten minutes.
//
// Andrew, 2026-11-06: "time slots: Thursday Nov 12 8:30 to 11:30 am pacific,
// Thursday 2:30 to 3:30 pm, Friday 9:15 to 10:15 am, Friday 11:45 to 2 pm."
// "all are Vari. due date is Wednesday night." The move lock is the same
// Wednesday night. The page is sitdown2/page.jsx at /<class>/sitdown2, the
// guide is sitdown2/guide.jsx at /<class>/worksheets/culture-guide, and the
// assigning page is sitdown2/assign.jsx.
//
// A booking lives on the class row as sitdown2Slots[slotKey] = { name, at },
// written through saveMerged with mergeSlots below, so two students tapping
// the same minute never overwrite each other: the server's row is re-read,
// this writer's one change is laid on it, and a slot somebody else took in
// the meantime stays theirs. Nothing else on the row is touched.

export const SITDOWN2_CLASSES = ["comm118", "comm999"];
export const SLOTS_KEY = "sitdown2Slots";
export const ASSIGNED_KEY = "cultureAssigned";
// Claude's suggested pair, kept apart from the assigned one so a suggestion never shows a student a Required chip.
export const SUGGESTED_KEY = "cultureSuggested";

const YEAR = 2026;
export const SITDOWN2 = {
  title: "Sit-Down 2",
  room: "Vari Hall 206",
  minutes: 10,
  due: new Date(YEAR, 10, 11, 23, 59, 59).getTime(),
  dueText: "Wednesday, November 11, at 11:59 PM",
  lock: new Date(YEAR, 10, 11, 23, 59, 59).getTime(),
  lockText: "Wednesday, November 11, at 11:59 PM",
};
export const locked = (now = Date.now()) => now > SITDOWN2.lock;
export const pastDue = (now = Date.now()) => now > SITDOWN2.due;

// The four blocks, each cut into ten-minute slots from `from` up to `to`.
//
// Andrew, 2026-11-11: "block off all times tomorrow morning before 9:10 am
// and after 11:10 am." Thursday morning was 8:30 to 11:30; the six slots cut
// (8:30 to 9:00, 11:10, 11:20) were all open. A slot's key is its clock time,
// so the five bookings inside the new hours keep their keys.
export const BLOCKS = [
  { key: "thu-am", day: "Thursday, November 12", part: "morning", month: 10, date: 12, from: [9, 10], to: [11, 10] },
  { key: "thu-pm", day: "Thursday, November 12", part: "afternoon", month: 10, date: 12, from: [14, 30], to: [15, 30] },
  { key: "fri-am", day: "Friday, November 13", part: "morning", month: 10, date: 13, from: [9, 15], to: [10, 15] },
  { key: "fri-mid", day: "Friday, November 13", part: "midday", month: 10, date: 13, from: [11, 45], to: [14, 0] },
];

const pad = (n) => String(n).padStart(2, "0");
export const clock = (h, m) => ((h + 11) % 12 + 1) + ":" + pad(m) + " " + (h < 12 ? "AM" : "PM");
export const SLOTS = BLOCKS.flatMap(b => {
  const out = [];
  const end = b.to[0] * 60 + b.to[1];
  for (let t = b.from[0] * 60 + b.from[1]; t + SITDOWN2.minutes <= end; t += SITDOWN2.minutes) {
    const h = Math.floor(t / 60), m = t % 60;
    out.push({ key: b.key + "-" + pad(h) + pad(m), block: b.key, day: b.day, say: clock(h, m), ms: new Date(YEAR, b.month, b.date, h, m).getTime() });
  }
  return out;
});
export const slotOf = (key) => SLOTS.find(s => s.key === key) || null;
export const blockOf = (key) => BLOCKS.find(b => b.key === key) || null;
export const slotsIn = (block) => SLOTS.filter(s => s.block === block.key);
/** "Thursday, November 12, 9:40 AM" */
export const whenOf = (slot) => slot ? slot.day + ", " + slot.say : "";
export const blockHours = (b) => clock(b.from[0], b.from[1]).replace(":00", "") + " to " + clock(b.to[0], b.to[1]).replace(":00", "");

const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
export const bookings = (data) => (data && data[SLOTS_KEY]) || {};
/** The slot a student holds, or null. */
export const slotFor = (data, name) => {
  const all = bookings(data);
  const key = Object.keys(all).find(k => all[k] && same(all[k].name, name));
  return key ? slotOf(key) : null;
};
/** Everyone with no slot, from a roster. */
export const unplaced = (data, roster) => roster.filter(s => !slotFor(data, s.name));

/** The class with `name` on one slot and nowhere else. `key` empty takes them off. */
export function book(data, key, name, now = Date.now()) {
  const all = { ...bookings(data) };
  Object.keys(all).forEach(k => { if (all[k] && same(all[k].name, name)) delete all[k]; });
  if (key && slotOf(key)) all[key] = { name, at: now };
  return { ...(data || {}), [SLOTS_KEY]: all };
}

// The rule, after mergeAway: the write that lands is the server's row with
// this writer's change laid on it. A slot this writer took is theirs unless
// the server already shows somebody else there who was not there when this
// writer started, in which case the server's holder keeps it and the caller
// sees that their name did not land.
export function mergeSlots(next, base, server) {
  if (!next || !server) return next;
  const mine = next[SLOTS_KEY] || {}, was = (base || {})[SLOTS_KEY] || {}, theirs = server[SLOTS_KEY] || {};
  const out = { ...theirs };
  new Set([...Object.keys(mine), ...Object.keys(was)]).forEach(k => {
    const m = mine[k], w = was[k];
    if ((m && m.name) === (w && w.name)) return;   // this writer did not touch it
    if (!m) { if (out[k] && w && same(out[k].name, w.name)) delete out[k]; return; }   // taken off, and nobody new has it
    if (out[k] && !same(out[k].name, m.name) && !(w && same(out[k].name, w.name))) return;   // someone else got there first
    out[k] = m;
  });
  // One person, one slot, whatever two tabs did.
  const seen = new Set();
  Object.keys(out).sort((a, b) => (out[b].at || 0) - (out[a].at || 0)).forEach(k => { const n = String(out[k].name || "").toLowerCase(); if (seen.has(n)) delete out[k]; else seen.add(n); });
  return { ...server, [SLOTS_KEY]: out };
}

const dayStart = (ms) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
/** "Today", "Tomorrow", "In 6 days", or "" once it has passed. */
export const countdown = (slot, now = Date.now()) => {
  if (!slot || slot.ms + SITDOWN2.minutes * 60000 < now) return "";
  const days = Math.round((dayStart(slot.ms) - dayStart(now)) / 86400000);
  return days <= 0 ? "Today" : days === 1 ? "Tomorrow" : "In " + days + " days";
};
export const isToday = (slot, now = Date.now()) => !!slot && dayStart(slot.ms) === dayStart(now);

// ─── the two concepts Andrew assigns ───
//
// On the plan row as cultureAssigned[email] = { ids: [id, id], why: { [id]: sentence } },
// written from the assign page, so only an instructor session can set them.
export const assignedFor = (data, email) => {
  const a = (data && data[ASSIGNED_KEY]) || {};
  const got = a[String(email || "").trim().toLowerCase()];
  return got && Array.isArray(got.ids) ? { ids: got.ids.filter(Boolean).slice(0, 2), why: got.why || {} } : { ids: [], why: {} };
};
export const withAssigned = (data, email, ids, why) => ({
  ...(data || {}),
  [ASSIGNED_KEY]: { ...((data || {})[ASSIGNED_KEY] || {}), [String(email || "").trim().toLowerCase()]: { ids: (ids || []).filter(Boolean).slice(0, 2), why: why || {} } },
});

export const suggestedFor = (data, email) => {
  const a = (data && data[SUGGESTED_KEY]) || {};
  const got = a[String(email || "").trim().toLowerCase()];
  return got && Array.isArray(got.ids) ? { ids: got.ids.filter(Boolean).slice(0, 2), why: got.why || {} } : { ids: [], why: {} };
};
export const withSuggested = (data, email, ids, why) => ({
  ...(data || {}),
  [SUGGESTED_KEY]: { ...((data || {})[SUGGESTED_KEY] || {}), [String(email || "").trim().toLowerCase()]: { ids: (ids || []).filter(Boolean).slice(0, 2), why: why || {} } },
});

export const sitdown2Href = (config) => config.path + "/sitdown2";
export const assignHref = (config) => config.path + "/sitdown2/assign";
export const guideHref = (config) => config.path + "/worksheets/culture-guide";
