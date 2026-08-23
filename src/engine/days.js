// Class-day helpers shared by the Dashboard and Classroom View.
// Day keys are the same short strings the schedule uses ("Sep 23").

export function parseDay(s, year) {
  if (!s) return null;
  const d = new Date(s + ", " + (year || 2026));
  return isNaN(d) ? null : d;
}

export function allDays(weeks) {
  const days = [];
  (weeks || []).forEach((w, wi) => (w.dates || []).forEach(ds =>
    days.push({ date: ds, weekId: w.id, weekIndex: wi, topic: w.topic || "" })));
  return days;
}

// The day the Dashboard opens on: today if it is a class day, otherwise the
// next one on the calendar.
export function currentDay(weeks) {
  const days = allDays(weeks);
  if (!days.length) return null;
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let best = null, gap = Infinity;
  days.forEach(d => {
    const dt = parseDay(d.date);
    if (!dt) return;
    const diff = dt.getTime() - t0;
    if (diff >= 0 && diff < gap) { gap = diff; best = d; }
  });
  return best || days[days.length - 1];
}
