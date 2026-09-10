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
// until I write another one. So one title can run across two days of a week
// without a spans table or a pair of drag handles to set the ends. Writing a
// title on a day starts a new one there; clearing it hands the day back to
// whatever came before.
//
// A carried title STOPS at a week that has a topic of its own.
//
// Without that stop, carrying forward never ended. COMM 118 had a title on
// Sep 21 and Sep 23 and none after, so week 1's title was the name of all
// thirty-two days of the term, right through to Dec 9 — every later week's
// topic overridden by a sentence written for the first week. A week topic is
// something Andrew set on purpose about that week; a title carried out of an
// earlier week is a guess, and the thing set on purpose wins.
//
// A week with no topic still carries, which is what makes a title able to run
// across a week boundary when that is what he meant.
export function dayTitles(weeks, dayPlans) {
  const days = allDays(weeks);
  const out = {};
  let carried = null;          // { from, title }
  let lastWeek = null;
  days.forEach(d => {
    // A new week that names itself takes its own name back.
    if (d.weekId !== lastWeek) {
      if ((d.topic || "").trim()) carried = null;
      lastWeek = d.weekId;
    }
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
  // How far a title reaches, counted by what a day SAYS rather than by where
  // the words came from.
  //
  // Grouping by source looked right and read wrong: a title written on the
  // second day of a week whose topic is the same words made the first day
  // show that title and sit outside the run, so the screen said day 1 of 30
  // on the second day and nothing at all on the first. Two days showing the
  // same words are the same run, however each one got them.
  const runs = [];
  days.forEach(d => {
    const last = runs[runs.length - 1];
    if (last && last.title === out[d.date].title) last.dates.push(d.date);
    else runs.push({ title: out[d.date].title, dates: [d.date] });
  });
  runs.forEach(run => run.dates.forEach((date, i) => {
    out[date].span = run.dates.length;
    out[date].nth = i + 1;
    out[date].dates = run.dates;
  }));
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
