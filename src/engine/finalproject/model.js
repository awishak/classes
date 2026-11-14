// The final project's first step, as plain JS: the fields of the preferences
// sheet, the people the review reads off the sheets, the pairs suggested from
// who picked whom, and the decisions file. No React, so the smoke run can try
// every rule here.
//
// Andrew, 2026-11-13: students "submit final project preferences to me ... by
// Wednesday night. I will review them and assign them to either work
// individually or in pairs. And I will assign them one or two topics." Both
// classes use the one sheet; COMM 3's project is on social justice and
// COMM 118's on communication and sport.

export const FINAL_PREFS_KEY = "final-prefs";
export const FINAL_PREFS_TITLE = "Final project preferences";
export const FINAL_PRE_KEY = "final-pre";
export const FINAL_PRE_TITLE = "Final project pre-production";
export const FINAL_PROJECT_KEY = "final-project";
export const FINAL_PROJECT_TITLE = "Final project";

// The four ways to answer, his words, in his order. `pair` is whether the
// answer lets him put the student in a pair: "I will only put you in a pair
// if you choose pair."
export const WORK = [
  { id: "pair2", say: "Absolutely, I want to work in a pair.", short: "Absolutely a pair", pair: true },
  { id: "pair1", say: "Prefer to work in a pair.", short: "Prefers a pair", pair: true },
  { id: "solo1", say: "Prefer to work by myself.", short: "Prefers solo", pair: false },
  { id: "solo2", say: "I definitely want to work by myself.", short: "Definitely solo", pair: false },
];
export const workOf = (id) => WORK.find(w => w.id === id) || null;
/** Whether an answer asks for a partner at all: everyone but the definite solo. */
export const picksPartner = (id) => id !== "solo2";

// He named the first four; the other six are Claude's, his to cut or rename.
export const STRENGTHS = ["Audio", "Video", "Images", "Research", "Writing", "Interviewing", "Design and layout", "Data and charts", "Interactive ideas", "Editing"];

export const SLOTS = ["a", "b", "c"];
export const TOPIC_FIELDS = SLOTS.flatMap(s => ["topic:" + s, "ask:" + s]);
export const SITE_FIELDS = SLOTS.flatMap(s => ["site:" + s, "like:" + s, "build:" + s]);
export const FIELDS = ["work", "top", "also", "strengths", ...TOPIC_FIELDS, ...SITE_FIELDS];

// COMM 3's sheet asks more. Andrew, 2026-11-14: "i want them to define social
// justice using an academic definition, not something from a random site. and
// then they'll propose ideas, and for each idea, they have to explain why they
// think it's interesting, what angle will they take to have a unique and
// engaging story, and how it qualifies as a social justice topic." So a
// social justice class has two fields for the definition (the words and the
// academic source), and each idea carries three explanations in place of the
// questions the topic raises. COMM 118's sheet is as it was.
export const JUSTICE_CLASSES = ["comm3"];
export const isJustice = (classId) => JUSTICE_CLASSES.includes(classId);
export const DEFINE_FIELDS = ["define", "defineSource"];
export const IDEA_PARTS = ["why", "angle", "justice"];
export const topicFieldsFor = (classId) => (isJustice(classId) ? SLOTS.flatMap(s => ["topic:" + s, ...IDEA_PARTS.map(part => part + ":" + s)]) : TOPIC_FIELDS);
const neededFor = (classId) => [...(isJustice(classId) ? DEFINE_FIELDS : []), "work", "strengths", ...topicFieldsFor(classId), ...SITE_FIELDS];

const lines = (v) => String(v || "").split("\n").map(l => l.trim()).filter(Boolean);
const filled = (a, f) => !!String((a || {})[f] || "").trim();

/** The fields a sheet still needs before it can be handed in. */
export function missingOf(answers, classId = "") {
  const a = answers || {};
  const need = neededFor(classId);
  if (picksPartner(a.work)) need.push("top");
  return need.filter(f => !filled(a, f));
}
export const requiredCount = (answers, classId = "") => neededFor(classId).length + (picksPartner((answers || {}).work) ? 1 : 0);

/** A sheet's answers as the review reads them. Picks are roster names. */
export function readAnswers(answers) {
  const a = answers || {};
  return {
    work: workOf(a.work) ? a.work : "",
    top: String(a.top || "").trim(),
    also: lines(a.also),
    strengths: lines(a.strengths),
    define: String(a.define || "").trim(),
    defineSource: String(a.defineSource || "").trim(),
    topics: SLOTS.map(s => ({ slot: s, topic: String(a["topic:" + s] || "").trim(), asks: lines(a["ask:" + s]), why: String(a["why:" + s] || "").trim(), angle: String(a["angle:" + s] || "").trim(), justice: String(a["justice:" + s] || "").trim() })),
    sites: SLOTS.map(s => ({ slot: s, site: String(a["site:" + s] || "").trim(), like: String(a["like:" + s] || "").trim(), build: String(a["build:" + s] || "").trim() })),
  };
}

// ─── who picked whom ───

/** How a picked b: "top", "also", or "". A person is { id, top, also }, picks as ids. */
export const pickOf = (a, b) => (a.top === b.id ? "top" : (a.also || []).includes(b.id) ? "also" : "");

// A tie between two people who picked each other: 3 when each is the other's
// top choice, 2 when one is, 1 when both are on the longer list.
export const TIERS = [
  { n: 3, id: "both-top", say: "each other's top choice" },
  { n: 2, id: "one-top", say: "a top choice and a pick back" },
  { n: 1, id: "both-also", say: "on each other's lists" },
];
export function tieOf(a, b) {
  const ab = pickOf(a, b), ba = pickOf(b, a);
  if (!ab || !ba) return 0;
  return ab === "top" && ba === "top" ? 3 : ab === "top" || ba === "top" ? 2 : 1;
}
const wantsPair = (p) => !!workOf(p.work)?.pair;
const first = (p) => p.first || String(p.name || "").split(" ")[0];

/** The sentence under a suggested pair, in the shape he gave: "Emmy and Lucy K
 * should work together because they both want to work in pairs and they are
 * each other's top choice." */
export function whyOf(a, b) {
  const tie = tieOf(a, b);
  const head = first(a) + " and " + first(b) + " should work together because they both want to work in pairs and ";
  if (tie === 3) return head + "they are each other's top choice.";
  if (tie === 2) {
    const [x, y] = pickOf(a, b) === "top" ? [a, b] : [b, a];
    return head + first(y) + " is " + first(x) + "'s top choice, with " + first(x) + " on " + first(y) + "'s list.";
  }
  return head + "each is on the other's list.";
}

/** Why two people are not a clean pair, or "" when they are. */
export function blockOf(a, b) {
  if (a.section !== b.section) return first(a) + " and " + first(b) + " are in different sections.";
  const solo = [a, b].filter(p => !wantsPair(p));
  if (solo.length) return solo.map(first).join(" and ") + (solo.length === 1 ? " did not ask" : " did not ask") + " to work in a pair.";
  const ab = pickOf(a, b), ba = pickOf(b, a);
  if (!ab && !ba) return "Neither picked the other.";
  if (!ab) return first(a) + " did not pick " + first(b) + ".";
  if (!ba) return first(b) + " did not pick " + first(a) + ".";
  return "";
}

// The most pairs, then the best ones. Andrew, 2026-11-13: "I want you to use
// an algorithm to figure that out ... We want as many pairs as possible."
// Two people can pair when both asked for a pair and each picked the other.
// Among every way to pair a group off, the one with the most pairs wins, and
// between two with the same count, the one whose ties add up higher. The
// search is exact: each connected group of people is tried every way, with
// the answers remembered by who is left, so the count is the true maximum
// and not a first-come guess. A group too large to try every way (more than
// 24 people all tied together) falls back to best tie first.
function bestOf(group, tie) {
  const n = group.length;
  if (n > 24) {
    const used = new Set(), out = [];
    const all = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (tie(i, j)) all.push([i, j, tie(i, j)]);
    all.sort((x, y) => y[2] - x[2]).forEach(([i, j]) => { if (!used.has(i) && !used.has(j)) { used.add(i); used.add(j); out.push([i, j]); } });
    return out;
  }
  const memo = new Map();
  const solve = (mask) => {
    if (!mask) return { count: 0, sum: 0, pairs: [] };
    if (memo.has(mask)) return memo.get(mask);
    let i = 0;
    while (!(mask & (1 << i))) i++;
    const rest = mask & ~(1 << i);
    let best = solve(rest);
    for (let j = i + 1; j < n; j++) {
      if (!(rest & (1 << j)) || !tie(i, j)) continue;
      const sub = solve(rest & ~(1 << j));
      const got = { count: sub.count + 1, sum: sub.sum + tie(i, j), pairs: [[i, j], ...sub.pairs] };
      if (got.count > best.count || (got.count === best.count && got.sum > best.sum)) best = got;
    }
    memo.set(mask, best);
    return best;
  };
  return solve(n >= 31 ? 0 : (1 << n) - 1).pairs;
}

/**
 * The pairs to suggest for a list of people, and the one-way picks left over.
 * `taken` is the ids already placed (in a pair, or set to work alone), who
 * are left out; `passed` is the pair keys he turned down, never suggested
 * again. Pairs never cross a section.
 * Returns { pairs: [{ a, b, tie, why }], maybe: [{ a, b, why }] }, a and b ids.
 */
export function suggest(people, { taken = new Set(), passed = new Set() } = {}) {
  const open = people.filter(p => wantsPair(p) && !taken.has(p.id));
  const ok = (a, b) => a.section === b.section && !passed.has(pairKey(a.id, b.id));
  const pairs = [];
  // Each connected group on its own, so the search stays small.
  const seen = new Set();
  for (const start of open) {
    if (seen.has(start.id)) continue;
    const group = [start];
    seen.add(start.id);
    for (let k = 0; k < group.length; k++) {
      for (const q of open) if (!seen.has(q.id) && ok(group[k], q) && tieOf(group[k], q)) { seen.add(q.id); group.push(q); }
    }
    if (group.length < 2) continue;
    group.sort((x, y) => x.name.localeCompare(y.name));
    bestOf(group, (i, j) => (ok(group[i], group[j]) ? tieOf(group[i], group[j]) : 0))
      .forEach(([i, j]) => pairs.push({ a: group[i].id, b: group[j].id, tie: tieOf(group[i], group[j]), why: whyOf(group[i], group[j]) }));
  }
  pairs.sort((x, y) => y.tie - x.tie || x.why.localeCompare(y.why));
  const matched = new Set(pairs.flatMap(p => [p.a, p.b]));
  // One-way picks between two people still on their own, for him to decide.
  const left = open.filter(p => !matched.has(p.id));
  const maybe = [];
  for (let i = 0; i < left.length; i++) for (let j = i + 1; j < left.length; j++) {
    const a = left[i], b = left[j];
    if (!ok(a, b) || tieOf(a, b)) continue;
    const ab = pickOf(a, b), ba = pickOf(b, a);
    if (!ab && !ba) continue;
    const [x, y] = ab ? [a, b] : [b, a];
    maybe.push({ a: x.id, b: y.id, top: pickOf(x, y) === "top", why: first(y) + " is " + (pickOf(x, y) === "top" ? first(x) + "'s top choice" : "on " + first(x) + "'s list") + ". " + first(y) + " did not pick " + first(x) + "." });
  }
  maybe.sort((x, y) => (y.top - x.top) || x.why.localeCompare(y.why));
  return { pairs, maybe };
}

// ─── the decisions file ───
//
// One private file a class, written only through /api/final-project:
// { released, pairs: [[idA, idB]], solo: [id], passed: [pairKey],
//   topics: { [id]: { a: true } }, says: { [id]: { a: [reason] } } }.
// An id is the student's email, lower case.

export const MAX_TOPICS = 2;
export const pairKey = (a, b) => [a, b].sort().join("+");
export const emptyFile = () => ({ released: false, pairs: [], solo: [], passed: [], topics: {}, says: {} });
export function tidyFile(file) {
  const f = file && typeof file === "object" ? file : {};
  return {
    released: f.released === true,
    pairs: (Array.isArray(f.pairs) ? f.pairs : []).filter(p => Array.isArray(p) && p.length === 2 && p[0] && p[1] && p[0] !== p[1]).map(p => [String(p[0]), String(p[1])]),
    solo: (Array.isArray(f.solo) ? f.solo : []).map(String),
    passed: (Array.isArray(f.passed) ? f.passed : []).map(String),
    topics: f.topics && typeof f.topics === "object" ? f.topics : {},
    says: f.says && typeof f.says === "object" ? f.says : {},
  };
}
export const partnerOf = (file, id) => { const p = (file.pairs || []).find(x => x.includes(id)); return p ? p.find(x => x !== id) : ""; };
export const approvedOf = (file, id) => SLOTS.filter(s => file.topics?.[id]?.[s]);
/** Where a student stands: "pair", "solo", or "" for not placed yet. */
export const placeOf = (file, id) => (partnerOf(file, id) ? "pair" : (file.solo || []).includes(id) ? "solo" : "");
/** Placed, with a topic approved: nothing left for him to decide. */
export const decidedOf = (file, id) => !!placeOf(file, id) && approvedOf(file, id).length > 0;

/** Pair two people. Either one's old pair parts, and neither stays solo. */
export function pairUp(file, a, b) {
  if (!a || !b || a === b) return file;
  return { ...file,
    pairs: [...file.pairs.filter(p => !p.includes(a) && !p.includes(b)), [a, b]],
    solo: file.solo.filter(x => x !== a && x !== b),
    passed: file.passed.filter(k => k !== pairKey(a, b)) };
}
export const splitUp = (file, id) => ({ ...file, pairs: file.pairs.filter(p => !p.includes(id)) });
/** Set a student to work alone, or take that back. Their pair parts. */
export function setSolo(file, id, on) {
  return { ...file, pairs: on ? file.pairs.filter(p => !p.includes(id)) : file.pairs, solo: on ? [...file.solo.filter(x => x !== id), id] : file.solo.filter(x => x !== id) };
}
export const passOn = (file, a, b) => ({ ...file, passed: [...file.passed.filter(k => k !== pairKey(a, b)), pairKey(a, b)] });
/** Press a topic: approve, or take the approval back. Returns null when two are already approved. */
export function toggleTopic(file, id, slot) {
  const mine = { ...(file.topics[id] || {}) };
  if (mine[slot]) delete mine[slot];
  else { if (approvedOf(file, id).length >= MAX_TOPICS) return null; mine[slot] = true; }
  // A reason stays on a topic either way: "Needs to be more specific" is for
  // the topic that was not approved.
  return { ...file, topics: { ...file.topics, [id]: mine } };
}
export function toggleReason(file, id, slot, reason) {
  const had = file.says?.[id]?.[slot] || [];
  const on = had.some(x => x.toLowerCase() === reason.toLowerCase());
  const next = on ? had.filter(x => x.toLowerCase() !== reason.toLowerCase()) : [...had, reason];
  return { ...file, says: { ...file.says, [id]: { ...(file.says[id] || {}), [slot]: next } } };
}
// His three reasons from the audio ideas, 2026-11-01, there before any is typed.
export const REASONS = ["Make sure to follow the instructions", "This doesn't fit what we're doing", "Needs to be more specific"];
export function reasonsOf(file) {
  const seen = new Map(REASONS.map(r => [r.toLowerCase(), r]));
  Object.values(file.says || {}).forEach(by => Object.values(by || {}).forEach(list => (list || []).forEach(x => { if (!seen.has(x.toLowerCase())) seen.set(x.toLowerCase(), x); })));
  return [...seen.values()];
}

// ─── made-up answers, for looking at the review before anyone has submitted ───
//
// ?review&demo draws the class's own faces with invented sheets. Nothing is
// read from or written to the server; the decisions stay in the browser.
// The same people get the same answers every visit (the dice are seeded by
// the names), so a pair he liked is still there after a refresh.

const DEMO_TOPICS = {
  comm3: ["Food deserts near campus", "Language access at the county clinic", "Who gets a bike lane", "Bail and the weekend in jail", "Farmworker housing in the valley", "Sidewalks and wheelchairs downtown", "Library hours in two neighborhoods", "Transfer students and credit loss", "Tenant organizing on one block", "Heat in classrooms without air conditioning", "Voting lines by precinct", "Night bus routes for late shifts"],
  comm118: ["Transnational athletes in the Olympics", "Female referees in male dominated sports", "Name, image and likeness at mid-major schools", "Athlete podcasts and the press conference", "Coaches mic'd up for broadcast", "Mental health statements from star players", "Fan forums and the firing of a coach", "Translators in the clubhouse", "Team captains on social media", "Retired players as analysts", "Pay disputes in women's national teams", "Mascots and community identity"],
};
const DEMO_ASKS = ["Who decides, and who is left out of the room?", "What changed in the last five years?", "Who tells this story now, and what do they skip?", "What does one day look like for one person?", "Where does the money come from?", "What would a fair version look like?"];
const DEMO_SITES = [
  ["wikipedia.org", "Lots of links, and every page leads to another.", "Link every name and term to a place to read more."],
  ["pudding.cool", "The charts move as the page scrolls.", "One chart that changes as the reader goes down the page."],
  ["nytimes.com/interactive", "Big photos with short captions.", "Open with one full-width photo."],
  ["geoguessr.com", "The page asks for a guess before telling the answer.", "A guess-first question before each section."],
  ["letterboxd.com", "Short reviews from regular people.", "Short quotes from the people interviewed."],
  ["99percentinvisible.org", "Audio with the pictures right beside the player.", "Put each audio clip next to its image."],
];
function dice(seed) {
  let h = 2166136261;
  for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
/** Invented sheets for a list of { id, name, section }: { [id]: answers }, picks as names, about one in eight left out as not submitted. */
export function demoSheets(people, classId) {
  const topics = DEMO_TOPICS[classId] || DEMO_TOPICS.comm118;
  const bySection = new Map();
  people.forEach(p => bySection.set(p.section || "", [...(bySection.get(p.section || "") || []), p]));
  const out = {};
  // Friends first: people next to each other in a shuffled order tend to pick each other.
  bySection.forEach((list, section) => {
    const roll = dice("order" + section + list.length);
    const order = [...list].sort((x, y) => x.name.localeCompare(y.name)).map(p => [roll(), p]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    order.forEach((p, i) => {
      const r = dice(p.name);
      if (order.length > 6 && r() < 0.12) return;
      const w = r();
      const work = w < 0.36 ? "pair2" : w < 0.66 ? "pair1" : w < 0.86 ? "solo1" : "solo2";
      const near = (k) => order[(i + k + order.length) % order.length];
      const buddy = i % 2 === 0 ? near(1) : near(-1);
      const top = r() < 0.86 ? buddy : near(r() < 0.5 ? 2 : -2);
      const also = [near(2), near(-2), near(3), buddy].filter(q => q !== p && q !== top && r() < 0.55);
      const a = { work, strengths: STRENGTHS.filter(() => r() < 0.3).slice(0, 4).join("\n") || STRENGTHS[Math.floor(r() * STRENGTHS.length)] };
      if (picksPartner(work) && top && top !== p) { a.top = top.name; a.also = [...new Set(also.map(q => q.name))].join("\n"); }
      const tb = Math.floor(r() * topics.length), sb = Math.floor(r() * DEMO_SITES.length);
      SLOTS.forEach((s, k) => {
        a["topic:" + s] = topics[(tb + k * 5) % topics.length];
        a["ask:" + s] = [DEMO_ASKS[Math.floor(r() * DEMO_ASKS.length)], DEMO_ASKS[Math.floor(r() * DEMO_ASKS.length)]].filter((x, n, l) => l.indexOf(x) === n).join("\n");
        const site = DEMO_SITES[(sb + k * 2) % DEMO_SITES.length];
        a["site:" + s] = site[0]; a["like:" + s] = site[1]; a["build:" + s] = site[2];
      });
      out[p.id] = a;
    });
  });
  return out;
}
