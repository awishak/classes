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

// What each day is called, and how far a title reaches.
//
// A title starts on the day I write it and covers every class day after it
// until I write another one. So one title can run across two days of a week,
// or across a week boundary, without a spans table or a pair of drag handles
// to set the ends. Writing a title on a day starts a new one there; clearing
// it hands the day back to whatever came before.
//
// Days before the first title fall back to the week's topic, which is what
// every day used to show.
export function dayTitles(weeks, dayPlans) {
  const days = allDays(weeks);
  const out = {};
  let carried = null;          // { from, title }
  days.forEach(d => {
    const own = ((dayPlans || {})[d.date] || {}).title;
    if ((own || "").trim()) carried = { from: d.date, title: own.trim() };
    const title = carried ? carried.title : (d.topic || "");
    out[d.date] = {
      title,
      own: !!(own || "").trim(),
      from: carried ? carried.from : null,
      fromWeek: !carried,
    };
  });
  // How many days each title covers, and where this day sits inside the run.
  const runs = {};
  days.forEach(d => {
    const k = out[d.date].from || "week:" + d.weekId;
    (runs[k] = runs[k] || []).push(d.date);
  });
  days.forEach(d => {
    const k = out[d.date].from || "week:" + d.weekId;
    out[d.date].span = runs[k].length;
    out[d.date].nth = runs[k].indexOf(d.date) + 1;
    out[d.date].dates = runs[k];
  });
  return out;
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
