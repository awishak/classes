// The audio story review as rules. Plain JS, no React, so the server route,
// the pages and the smoke run all read the same numbers.
//
// Andrew, 2026-11-13: "build me something for students to review other
// people's audio stories, the same way that we built something for the
// visual stories." Then, the same day: "Students are gonna be assigned 3 for
// sure ... and they have to review an additional two. They have to listen to
// 5 audio stories. Yes, they can review extra ... Students who did not submit
// still get three stories to review." And on the window: "open up Tuesday ...
// and it'll close on Wednesday night ... I'm not opening it up later. Or
// opening up earlier, closing later." So the window is written here and
// nowhere else, and no button moves the window for a real class.

export const NEED_ASSIGNED = 3;
export const NEED_TOTAL = 5;
export const MIN_CHARS = 50;

// Pacific standard time, eight hours behind UTC in November.
//   opens     Tuesday, November 17, 12:00 AM
//   closes    Wednesday, November 18, 11:59 PM (the minute runs out at midnight)
//   releases  Thursday, November 19, 12:05 AM, comments with names attached
export const WINDOW = {
  comm3: { opens: "2026-11-17T08:00:00.000Z", closes: "2026-11-19T08:00:00.000Z", releases: "2026-11-19T08:05:00.000Z" },
};
/** When the bright bar on the home steps down: Sunday, November 22, 11:59 PM. */
export const BAR_UNTIL = { comm3: "2026-11-23T07:59:00.000Z" };

/** building, reading, closed or released, from the clock alone. A class with no window is building. */
export function windowStage(groupKey, now = Date.now()) {
  const w = WINDOW[groupKey];
  if (!w || now < Date.parse(w.opens)) return "building";
  if (now < Date.parse(w.closes)) return "reading";
  return now < Date.parse(w.releases) ? "closed" : "released";
}
export const barUp = (stage, groupKey, now = Date.now()) =>
  stage !== "released" || !BAR_UNTIL[groupKey] || now < Date.parse(BAR_UNTIL[groupKey]);

// A fixed order that is not the roster's, the same on every run.
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const mixed = (list) => [...new Set(list)].sort((a, b) => hash(a) - hash(b) || (a < b ? -1 : 1));

/** Three stories for every reviewer: { [reviewer]: [owner, owner, owner] }.
 * The owners stand in a ring. A reviewer with a story in gets the next three
 * around the ring, so every story is assigned three times by the owners
 * alone. A reviewer with no story in takes the next three from a pointer
 * that keeps walking the ring, so their reviews spread evenly. Nobody gets
 * their own story, and nobody gets the same story twice. */
export function assignAll(reviewers, owners, need = NEED_ASSIGNED) {
  const ring = mixed(owners), n = ring.length;
  const out = {};
  if (!n) return out;
  const at = new Map(ring.map((e, i) => [e, i]));
  let p = 0;
  mixed(reviewers).forEach(r => {
    const picks = [];
    if (at.has(r)) {
      for (let k = 1; k < n && picks.length < need; k++) picks.push(ring[(at.get(r) + k) % n]);
    } else {
      for (let k = 0; k < n && picks.length < need; k++) picks.push(ring[(p + k) % n]);
      p = (p + picks.length) % n;
    }
    out[r] = picks;
  });
  return out;
}

/** Three for one reviewer who came onto the roster after the others were
 * assigned: the stories assigned the fewest times so far. */
export function assignOne(reviewer, assign, owners, need = NEED_ASSIGNED) {
  const count = new Map(mixed(owners).filter(o => o !== reviewer).map(o => [o, 0]));
  Object.values(assign || {}).forEach(list => (list || []).forEach(o => { if (count.has(o)) count.set(o, count.get(o) + 1); }));
  return [...count.entries()].sort((a, b) => a[1] - b[1] || hash(a[0]) - hash(b[0])).slice(0, need).map(([o]) => o);
}

// Andrew, 2026-11-13, after seeing the page: "the strongest 10-30 seconds
// thing isnt great. needs to be easier to review. i think it should be which
// chapter was the best and why." So the first comment picks one chapter.
import { secondsOf } from "./storymodel.js";
/** The chapters a listener can pick: named, with a time, in order. */
export const chaptersOf = (story) => ((story && story.chapters) || []).filter(c => String(c.name || "").trim() && secondsOf(c.at) !== null).sort((x, y) => secondsOf(x.at) - secondsOf(y.at));
/** The picked chapter, kept in the comment's best_where column as chapter:<id>. */
export const chapterWord = (id) => "chapter:" + id;
export const chapterOf = (word) => { const m = /^chapter:(.{1,80})$/.exec(String(word || "")); return m ? m[1] : ""; };
/** Where a chapter starts and ends in seconds; the last one ends with the story. */
export function chapterSpan(story, id) {
  const list = chaptersOf(story), i = list.findIndex(c => c.id === id);
  if (i < 0) return null;
  return { name: list[i].name.trim(), from: secondsOf(list[i].at), to: i + 1 < list.length ? secondsOf(list[i + 1].at) : Math.ceil((story.audio && story.audio.seconds) || 0) || null };
}

// Andrew, 2026-11-13: "i want you to record if a student actually listens to
// a story or not." The page notes each second of the file that played, as
// ranges of whole seconds, and the server keeps the union across visits, so
// playing the same ten seconds six times is ten seconds heard.
export const HEARD_FULL = 0.9;   // heard in full: nine tenths of the file
export const HEARD_LITTLE = 0.5; // commented having heard under half
/** A set of whole seconds to ranges: [[0, 12], [40, 55]]. */
export function rangesOf(seconds) {
  const list = [...new Set(seconds)].filter(n => Number.isInteger(n) && n >= 0).sort((a, b) => a - b);
  const out = [];
  list.forEach(n => { const last = out[out.length - 1]; if (last && n <= last[1] + 1) last[1] = n; else out.push([n, n]); });
  return out;
}
/** Two lists of ranges as one, overlaps joined, nothing past the end of the file. */
export function joinRanges(a, b, length = Infinity) {
  const top = Number.isFinite(length) ? Math.max(0, Math.ceil(length) - 1) : Infinity;
  const all = [...(a || []), ...(b || [])].filter(r => Array.isArray(r) && Number.isInteger(r[0]) && Number.isInteger(r[1]) && r[0] >= 0 && r[1] >= r[0] && r[0] <= top)
    .map(r => [r[0], Math.min(r[1], top)]).sort((x, y) => x[0] - y[0]);
  const out = [];
  all.forEach(r => { const last = out[out.length - 1]; if (last && r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1]); else out.push([r[0], r[1]]); });
  return out;
}
export const heardSeconds = (ranges) => (ranges || []).reduce((n, r) => n + r[1] - r[0] + 1, 0);

const lower = (s) => String(s || "").trim().toLowerCase();

/** The numbers for the instructor, from the admin feed: one row a student, one a story. */
export function tally(feed, section) {
  const people = (feed.people || []).filter(p => !section || p.section === section);
  const stories = (feed.stories || []).filter(s => (!section || s.section === section) && s.submitted_at);
  const storyOwner = new Map(stories.map(s => [s.id, lower(s.email)]));
  const submitted = new Set(stories.map(s => lower(s.email)));
  const assign = feed.assign || {};
  const byAuthor = new Map(), onStory = new Map();
  (feed.comments || []).forEach(c => {
    const owner = storyOwner.get(c.story), author = lower(c.authorEmail);
    if (!owner || owner === author) return;
    if (!byAuthor.has(author)) byAuthor.set(author, new Set());
    byAuthor.get(author).add(owner);
    if (!onStory.has(c.story)) onStory.set(c.story, []);
    onStory.get(c.story).push(c);
  });
  const assignedTo = new Map();
  Object.entries(assign).forEach(([r, list]) => (list || []).forEach(o => { if (!assignedTo.has(o)) assignedTo.set(o, []); assignedTo.get(o).push(r); }));
  const nameOf = new Map((feed.people || []).map(p => [lower(p.email), p.name]));
  // What each student heard of each story: "<reviewer> <story id>" to a share of the file.
  const share = new Map((feed.listens || []).map(l => [lower(l.reviewer) + " " + l.story, l.length ? Math.min(1, l.heard / l.length) : 0]));
  const idOfOwner = new Map(stories.map(s => [lower(s.email), s.id]));
  const rows = people.map(p => {
    const email = lower(p.email);
    const heardFull = stories.filter(s => lower(s.email) !== email && (share.get(email + " " + s.id) || 0) >= HEARD_FULL).length;
    const unheard = [...(byAuthor.get(email) || [])].filter(o => (share.get(email + " " + idOfOwner.get(o)) || 0) < HEARD_LITTLE).length;
    const need = (assign[email] || []).filter(o => submitted.has(o));
    const did = byAuthor.get(email) || new Set();
    const requiredDone = need.filter(o => did.has(o)).length;
    const othersDone = [...did].filter(o => !need.includes(o)).length;
    const total = requiredDone + othersDone;
    const complete = need.length > 0 && requiredDone >= need.length && total >= NEED_TOTAL;
    return { name: p.name, email, section: p.section, submitted: submitted.has(email), requiredDone, requiredNeed: need.length, othersDone, total, complete, heardFull, unheard, extra: Math.max(0, total - NEED_TOTAL),
      missing: complete ? "" : [need.length - requiredDone > 0 ? (need.length - requiredDone) + " in red" : "", total < NEED_TOTAL ? (NEED_TOTAL - total) + " more in all" : ""].filter(Boolean).join(", ") };
  });
  const perStory = stories.map(s => ({ id: s.id, headline: s.headline || "Untitled story", name: s.name, email: lower(s.email), section: s.section, submitted_at: s.submitted_at,
    reviews: (onStory.get(s.id) || []).length, reviewers: (onStory.get(s.id) || []).map(c => c.author).sort(),
    assigned: (assignedTo.get(lower(s.email)) || []).map(e => nameOf.get(e) || e).sort() }));
  return { rows, perStory, commentCount: [...onStory.values()].reduce((n, l) => n + l.length, 0) };
}
