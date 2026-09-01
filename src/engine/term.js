// A class, day by day, as one list.
//
// Andrew: "i want a schedule view in the repository. What this means is, you
// should give me a particular class like 118 and show me what has been
// assigned to each day in order."
//
// The repository could already say where a block turns up, one block at a
// time, on the open row. The question underneath is the other way round: what
// is week six made of, and what does the term look like from the top. Nothing
// answered that, because the dashboard shows one day and the schedule editor
// shows one week's assignments without the day plan beside them.
//
// Two sources per day, which is the point of putting them together:
//   the day plan   what the room does, in sections, in order
//   the schedule   what the students were told to read or hand in
//
// Reading only. The writing a term needs from here is adding something to a
// day and taking something off a day, and both go through the writers the rest
// of the page already uses.

import { normSlot, dayPlanFor, sectionsOf } from "./dayplan.js";
import { weekdayOf } from "./schedule.js";
import { typeOf } from "./blocks.js";

const weeksOf = (store, cls) => store?.schedule || cls.scheduleWeeks || [];

// A week whose topic mentions "final" is Finals Week, the same reading the
// class site gives it, so the two surfaces name a week the same way.
const weekName = (w, i) => (/final/i.test(w.topic || "") ? "Finals Week" : "Week " + (i + 1));

// One row on a day, whatever the row points at.
function rowOf(it, { blockOf, seeds, slot }) {
  const block = it.blockId && blockOf ? blockOf(it.blockId) : null;
  const seed = it.seedId ? (seeds || []).find(s => s.id === it.seedId) : null;
  return {
    id: it.id,
    slot,
    words: it.claim || block?.headline || block?.title || seed?.title || it.text || "Untitled",
    kind: it.feature ? "Activity" : block ? typeOf(block.type).label : seed ? "Seed" : "Note",
    type: block?.type || "note",
    url: block?.url || "",
    blockId: it.blockId || "",
    pick: !!block?.pick,
    depth: it.depth || 0,
  };
}

// Every class day in order, with what the room does and what the students were
// given. Days with nothing on them are kept, because an empty week in the
// middle of a term is the thing worth seeing.
export function termOf({ cls, store, blockOf }) {
  const weeks = weeksOf(store, cls);
  const seeds = store?.seeds || cls.seeds || [];
  const days = [];

  weeks.forEach((w, wi) => {
    (w.dates || []).forEach(date => {
      const plan = dayPlanFor(store, cls, date);
      const wd = weekdayOf(date);
      const sections = sectionsOf(cls, plan)
        .map(([slot, name]) => {
          const bucket = normSlot(plan.slots[slot]);
          return { slot, name: bucket.title || name,
            items: bucket.items.map(it => rowOf(it, { blockOf, seeds, slot })) };
        })
        .filter(s => s.items.length);
      const assigned = (w.items || [])
        .filter(it => !it.date || it.date === wd)
        .map(it => ({
          id: it.id, weekId: w.id, words: it.title || "Untitled", type: it.type || "reading",
          url: it.url || "", blockId: it.libId || it.blockId || "",
          pick: !!(blockOf && blockOf(it.libId || it.blockId)?.pick),
          loose: !it.date,
        }));
      days.push({
        date, weekday: wd, week: weekName(w, wi), weekId: w.id, topic: plan.title || w.topic || "",
        notes: plan.notes || "", slides: plan.slides || "",
        sections, assigned,
        rows: sections.reduce((n, s) => n + s.items.length, 0),
      });
    });
  });

  return days;
}

// What the term adds up to, said in one line over the list.
export function termCounts(days) {
  const planned = (days || []).filter(d => d.rows).length;
  const assigned = (days || []).reduce((n, d) => n + d.assigned.length, 0);
  return {
    days: (days || []).length,
    planned,
    empty: (days || []).length - planned,
    rows: (days || []).reduce((n, d) => n + d.rows, 0),
    assigned,
  };
}

// The day a class is nearest to, so a long term opens where I am rather than
// in the first week of September.
export function nearestDay(days, now) {
  const today = now || new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let best = null;
  let gap = Infinity;
  (days || []).forEach(d => {
    const dt = new Date(d.date + ", " + today.getFullYear());
    if (isNaN(dt)) return;
    const diff = Math.abs(dt.getTime() - t0);
    if (diff < gap) { gap = diff; best = d.date; }
  });
  return best;
}
