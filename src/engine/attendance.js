// Who says they will not be there.
//
// Andrew, 2026-09-21: "create a checkbox on the schedule next to each day for
// the students. it should start checked. it should say 'I'll be there' next to
// it. students can uncheck it, and when they do, on my page as instructor, it
// shows who will not be in attendance."
//
// Checked is the default and nothing is written for it, so the store holds the
// exceptions only: `away["Sep 23"]["ada-lovelace"] = true`. A class of thirty
// with two people out is two keys, and a student who never opens the page
// writes nothing at all. The dashboard the forks carried was built the same
// way, and the changelog says why: "Everyone starts Here, so the panel was
// showing thirty pills to find the two that mattered."
//
// A mark is keyed on the student id, the same id the boards, the games and the
// gradebook use, so a student who changes the name they go by keeps their mark.

import { withIds, findStudent, idOf, nameShown, lastNameOf } from "./roster.js";
import { sectionsOf, sectionOf, hasSections } from "./sections.js";

export const awayMap = (data, date) => ((data || {}).away || {})[date] || {};
export const isAway = (data, date, id) => !!awayMap(data, date)[id];
export const awayIds = (data, date) => {
  const day = awayMap(data, date);
  return Object.keys(day).filter(id => day[id]);
};

// The store with one student's answer for one day. Saying they will be there
// takes the key out rather than writing false, and a day nobody is missing
// takes its own key out, so the map never fills up with the ordinary case.
export function setAway(data, date, id, away) {
  if (!date || !id) return data;
  const all = { ...((data || {}).away || {}) };
  const day = { ...(all[date] || {}) };
  if (away) day[id] = true; else delete day[id];
  if (Object.keys(day).length) all[date] = day; else delete all[date];
  return { ...(data || {}), away: all };
}

// One write cannot take somebody else's mark with it.
//
// The class is one JSON blob and every screen writes the whole blob, so a room
// unchecking a box in the same minute is thirty writers each holding a snapshot
// taken before the others marked. That is the shape of the bug that ate a
// room's answers in the game, and `mergeAnswers` in game.js is the same rule
// written for answers.
//
// So the write that lands is the SERVER's class with the marks merged into it,
// not this page's copy of the class. This writer touched one map and nothing
// else, and everything it did not touch belongs to whoever did touch it, which
// may be me on the dashboard while a student's phone sat open.
export function mergeAway(next, base, server) {
  if (!next || !server) return next;
  const mine = next.away || {};
  const was = (base || {}).away || {};
  const theirs = server.away || {};
  const out = {};
  new Set([...Object.keys(mine), ...Object.keys(was), ...Object.keys(theirs)]).forEach(date => {
    const m = mine[date] || {}, w = was[date] || {}, t = theirs[date] || {};
    const day = { ...t };
    // What this writer changed, this writer keeps: a mark put on,
    Object.keys(m).forEach(id => { if (m[id] !== w[id]) day[id] = m[id]; });
    // and a mark taken back off, so unchecking and checking again still clears.
    Object.keys(w).forEach(id => { if (!(id in m)) delete day[id]; });
    if (Object.keys(day).length) out[date] = day;
  });
  return { ...server, away: out };
}

// The names, in the sittings they belong to.
//
// A class that meets once hands back one group with no label, because there is
// nothing to tell apart. COMM 3 meets at 8:00 and at 10:30, and Andrew,
// 2026-09-21: "split my list by sitting." A student the roster has since lost
// still shows, under no sitting, because their mark is real.
export function awayBySitting(config, data, date) {
  const ids = awayIds(data, date);
  if (!ids.length) return [];
  const roster = withIds((data || {}).students || (config || {}).students || []);
  const rows = ids.map(id => {
    const s = findStudent(roster, id);
    const name = (s || {}).name || id;
    const profile = ((data || {}).profiles || {})[name];
    return {
      id,
      name: s ? nameShown(data, name) : id,
      section: sectionOf(s),
      last: lastNameOf(name, (config || {}).lastNameOverrides, profile),
    };
  }).sort((a, b) => a.last.localeCompare(b.last) || a.name.localeCompare(b.name));
  if (!hasSections(config)) return [{ label: "", rows }];
  const labels = sectionsOf(config);
  const groups = labels
    .map(label => ({ label, rows: rows.filter(r => r.section === label) }))
    .filter(g => g.rows.length);
  const rest = rows.filter(r => !labels.includes(r.section));
  return rest.length ? [...groups, { label: "", rows: rest }] : groups;
}

// The id to write a mark under, from the name the page is being read as.
export const idFor = (config, data, name) => {
  const roster = withIds((data || {}).students || (config || {}).students || []);
  return idOf(findStudent(roster, name) || name);
};
