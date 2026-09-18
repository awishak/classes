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

// A day as part of an address, and back.
//
// Andrew, 2026-09-17: "what would it take for each day to be a url ... on
// the dashboard." The address names the day, so a refresh stays put and a
// link can point at a day: /comm3/dashboard/oct-7.
//
// Two spellings resolve, and only the first is ever written:
//
//   oct-7         the date, the way it reads on the day. Written on every
//                 change of day, because it is what you would type.
//   week-3-wed    the week and the weekday. Never written, always read. This
//                 is the spelling that survives a quarter: a term's dates all
//                 move, and its third Wednesday is still its third Wednesday,
//                 so a link from a template, a reminder or the Brief that
//                 wants to outlive the term uses this one. week-3 alone is
//                 that week's first class day.
//
// A slug that names no day of the term resolves to nothing, and the
// dashboard falls back to today's rule, so a last-quarter date link opens the
// dashboard rather than a dead page.
const SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const daySlug = (date) => String(date || "").trim().toLowerCase().replace(/\s+/g, "-");
export function dayFromSlug(slug, weeks) {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return null;
  const days = allDays(weeks);
  const byDate = days.find(d => daySlug(d.date) === s);
  if (byDate) return byDate.date;
  const m = s.match(/^week-(\d+)(?:-([a-z]{3}))?$/);
  if (!m) return null;
  const wi = parseInt(m[1], 10) - 1;
  const inWeek = days.filter(d => d.weekIndex === wi);
  if (!inWeek.length) return null;
  if (!m[2]) return inWeek[0].date;
  const hit = inWeek.find(d => { const p = parseDay(d.date); return p && SHORT[p.getDay()] === m[2]; });
  return hit ? hit.date : null;
}
