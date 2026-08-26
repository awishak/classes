// The bridge between the schedule and a day plan.
//
// The schedule knows a reading is assigned on Wednesday. The day plan knows how
// Wednesday is going to run. Until now those two never spoke, so a reading sat
// on the schedule and the dashboard had no idea it existed.
//
// Everything here answers one of two questions: what is on the schedule for this
// day, and which of it has not made it into the plan yet.

import { genId } from "../utils.jsx";
import { blankDay, normSlot, sequenceFor } from "./dayplan.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Sep 23" -> "Wed". The Dashboard used to do this by looking up the date's
// position in the week and indexing into ["Mon","Wed","Fri"], which is only
// right for a class that meets on exactly those days, in that order.
export function weekdayOf(date, year) {
  const d = new Date(date + ", " + (year || 2026));
  return isNaN(d) ? "" : WEEKDAYS[d.getDay()];
}

export const weekOf = (weeks, date) => (weeks || []).find(w => (w.dates || []).includes(date)) || null;

// What the schedule has for this day. An item with a weekday belongs to that
// day; an item with no weekday belongs to the week and therefore still needs
// putting somewhere, so it shows up as loose.
export function scheduledFor(weeks, date) {
  const week = weekOf(weeks, date);
  if (!week) return [];
  const wd = weekdayOf(date);
  return (week.items || [])
    .filter(it => !it.date || it.date === wd)
    .map(it => ({ ...it, loose: !it.date }));
}

// Every schedule item id already sitting in this day's plan.
export function plannedItemIds(data, config, date) {
  const plan = { ...blankDay(config), ...((data?.dayPlans || {})[date] || {}) };
  const ids = new Set();
  Object.values(plan.slots || {}).forEach(s =>
    normSlot(s).items.forEach(it => { if (it.schedItemId) ids.add(it.schedItemId); }));
  (plan.blocks || []).forEach(b => { if (b.schedItemId) ids.add(b.schedItemId); });
  return ids;
}

// On the schedule for this day, and not yet in the plan.
//
// An item with a weekday is checked against that day alone. An undated one
// belongs to the whole week, so it counts as placed once it is in any day of
// that week — otherwise putting Tuesday's activity into Monday would leave
// Wednesday and Friday still asking for it.
export function unplanned(data, config, date) {
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const week = weekOf(weeks, date);
  const here = plannedItemIds(data, config, date);
  const anywhereThisWeek = new Set();
  (week?.dates || []).forEach(d => plannedItemIds(data, config, d).forEach(id => anywhereThisWeek.add(id)));
  return scheduledFor(weeks, date)
    .filter(it => (it.loose ? !anywhereThisWeek.has(it.id) : !here.has(it.id)));
}

export const slotsOf = (config, plan) =>
  (sequenceFor(config, plan.sequenceId || config.defaultSequenceId).slots || []).map(s => s.slot);

// Put a schedule item into a day, in the slot given or the first one there is.
// The item keeps a pointer back to the schedule row so it stops showing up as
// unplanned, and its link comes across so it is castable straight away.
export function addScheduleItemToDay(update, config, date, item, slot) {
  let landed = null;
  update(prev => {
    const plans = { ...(prev.dayPlans || {}) };
    const day = { ...blankDay(config), ...(plans[date] || {}) };
    const available = slotsOf(config, day);
    const target = slot || available[0];
    if (!target) return prev;
    landed = target;
    const slots = { ...(day.slots || {}) };
    const bucket = normSlot(slots[target]);
    if (bucket.items.some(it => it.schedItemId === item.id)) return prev;
    slots[target] = {
      ...bucket,
      items: [...bucket.items, {
        id: genId(),
        schedItemId: item.id,
        text: item.title,
        links: item.url ? [{ id: genId(), label: item.title, url: item.url }] : [],
      }],
    };
    plans[date] = { ...day, slots };
    return { ...prev, dayPlans: plans };
  });
  return landed;
}

// The other direction. Everything above reads the schedule into the day; this
// writes back out to it, so a reading I put on Wednesday while building the
// class is a reading the students see on Wednesday. Same store, same field the
// Schedule editor writes, so there is one answer to "what is assigned".
export function addScheduleItem(update, config, date, item) {
  const wd = weekdayOf(date);
  const id = "f-" + genId();
  update(prev => {
    const weeks = prev.schedule || config.scheduleWeeks || [];
    const week = weeks.find(w => (w.dates || []).includes(date));
    if (!week) return prev;
    return {
      ...prev,
      schedule: weeks.map(w => w.id !== week.id ? w : {
        ...w,
        items: [...(w.items || []), {
          id, libId: item.blockId || "", type: item.type || "reading",
          title: item.title || "", url: item.url || "", date: wd,
        }],
      }),
    };
  });
  return id;
}

export const removeScheduleItem = (update, config, itemId) => update(prev => ({
  ...prev,
  schedule: (prev.schedule || config.scheduleWeeks || [])
    .map(w => ({ ...w, items: (w.items || []).filter(i => i.id !== itemId) })),
}));

// Assignments worth flagging on a given day: due on or after it, soonest first,
// and only the ones close enough to be worth saying out loud.
export function comingUp(assignments, date, withinDays) {
  const from = new Date(date + ", 2026");
  if (isNaN(from)) return [];
  const t0 = from.getTime();
  return (assignments || [])
    .map(a => {
      const d = new Date((a.due || "") + ", 2026");
      if (isNaN(d)) return null;
      return { a, days: Math.round((d.getTime() - t0) / 86400000) };
    })
    .filter(x => x && x.days >= 0 && x.days <= (withinDays || 21))
    .sort((x, y) => x.days - y.days);
}

// A dot colour per kind, matching the Schedule card so the same thing looks the
// same on both screens.
export const TYPE_COLOR = {
  reading: "#2563eb",
  video: "#b45309",
  podcast: "#7c3aed",
  assignment: "#d97706",
  activity: "#059669",
};
export const typeLabel = (t) => (t || "item").charAt(0).toUpperCase() + (t || "item").slice(1);
