// When a class meets, and which sitting the clock is inside.
//
// A class used to meet once a day: `config.meets` was one `{ start, end }`, and
// two places in the Dashboard did the same string-to-minutes arithmetic to work
// out whether the room was in session. COMM 3 meets twice on the same day, so
// one pair of times cannot say when that class is.
//
// A config carries a list now. A config carrying one pair still works, because
// most classes meet once and rewriting five configs to hold a list of one is a
// worse trade than reading both shapes here. The arithmetic lives in this file
// rather than in two copies that can drift apart.

const minsOf = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return isNaN(h) ? null : h * 60 + (m || 0);
};

// Every sitting a class has, in the order of the day. Anything missing a start
// or an end is dropped, because a sitting that runs from nowhere to nowhere
// would answer "is class on" with a yes.
export function sittingsOf(config) {
  const raw = config?.meets;
  const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return list
    .map(s => ({ label: s.label || "", start: minsOf(s.start), end: minsOf(s.end) }))
    .filter(s => s.start != null && s.end != null)
    .sort((a, b) => a.start - b.start);
}

// The wall clock as minutes past midnight, which is the only unit the rest of
// this file works in.
export const minsNow = (now) => {
  const d = now instanceof Date ? now : new Date(now || Date.now());
  return d.getHours() * 60 + d.getMinutes();
};

// The sitting the clock is inside, or null in the gap between two of them.
export function sittingNow(config, now) {
  const cur = minsNow(now);
  return sittingsOf(config).find(s => cur >= s.start && cur <= s.end) || null;
}

// Minutes left in the sitting that is running, or null when none is running.
// Null rather than zero, so a screen opened at seven in the morning says
// nothing about a class rather than saying no minutes are left in one.
export function minutesLeft(config, now) {
  const s = sittingNow(config, now);
  return s ? Math.max(0, s.end - minsNow(now)) : null;
}

// How far into the running sitting the clock is. A sequence is a budget, and
// the budget is divided out of the whole sitting rather than out of what is
// left of it.
export function minutesIn(config, now) {
  const s = sittingNow(config, now);
  return s ? Math.max(0, minsNow(now) - s.start) : null;
}

// The length of the running sitting, for the same division.
export function sittingLength(config, now) {
  const s = sittingNow(config, now);
  return s ? s.end - s.start : null;
}
