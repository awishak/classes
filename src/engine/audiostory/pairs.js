// Pairs for the audio story, suggested from the ideas sheets and then set
// by hand. Plain JS, no React, so the smoke run can try it.
//
// Andrew, 2026-10-29: "a way for me to assign them to stories based on their
// interests and the interests in working individually or in pairs." A
// person here is { email, name, section, work: [..], strengths: [..],
// ideas: [{ slot, idea, mark }], wants: [{ owner, slot }] }. A pair is
// { id, members: [email, email], story, from: { owner, slot } | null }, and a
// solo is the same with one member.
//
// The suggestion, per section, among the people who said In a pair or
// Either one: two people score 3 when one asked to work on the other's idea,
// 2 when their okayed ideas share a word, 1 when their strengths differ
// (someone technical with someone who tells stories or digs), and 1 when
// both said In a pair outright. Highest scores pair first; anyone left who
// said In a pair is paired with the next such person; everyone else is solo.
// The pair's story is the idea that was asked for, else the Top idea of
// either, else the first Okay.

export const PAIRS_ROW = "audio-pairs-plan";
export const WANT_FIELD = "want";
const GOOD = new Set(["top", "ok"]);
const STOP = new Set(["the", "and", "that", "with", "this", "from", "about", "what", "when", "where", "their", "there", "story", "stories", "people", "someone", "something", "into", "have", "they", "them", "your", "will", "would", "like", "just", "over", "than", "then", "some", "more", "most", "been", "being", "were", "also", "very", "much", "many", "make", "made"]);

export const wantKey = (owner, slot) => String(owner || "").trim().toLowerCase() + "|" + slot;
export const parseWant = (line) => { const [owner, slot] = String(line || "").split("|"); return owner && slot ? { owner: owner.trim().toLowerCase(), slot: slot.trim() } : null; };

const words = (s) => new Set(String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 3 && !STOP.has(w)));
const goodIdeas = (p) => (p.ideas || []).filter(i => i.idea && GOOD.has(i.mark));
const wantsPair = (p) => (p.work || []).some(w => /pair|either/i.test(w));
const pairOnly = (p) => (p.work || []).some(w => /pair/i.test(w)) && !(p.work || []).some(w => /individ|either/i.test(w));
const technical = (p) => (p.strengths || []).some(s => /technical/i.test(s));
const telling = (p) => (p.strengths || []).some(s => /story|research/i.test(s));

/** The best story for a set of people: the one asked for, a Top idea, an Okay. */
export function storyFor(members) {
  for (const p of members) for (const w of p.wants || []) {
    const other = members.find(m => m.email === w.owner && m !== p);
    const idea = other && (other.ideas || []).find(i => i.slot === w.slot && i.idea);
    if (idea) return { story: idea.idea, from: { owner: other.email, slot: idea.slot } };
  }
  for (const mark of ["top", "ok"]) for (const p of members) {
    const idea = (p.ideas || []).find(i => i.idea && i.mark === mark);
    if (idea) return { story: idea.idea, from: { owner: p.email, slot: idea.slot } };
  }
  const p = members.find(m => (m.ideas || []).some(i => i.idea));
  const idea = p && p.ideas.find(i => i.idea);
  return idea ? { story: idea.idea, from: { owner: p.email, slot: idea.slot } } : { story: "", from: null };
}

export function scoreOf(a, b) {
  let n = 0;
  if ((a.wants || []).some(w => w.owner === b.email) || (b.wants || []).some(w => w.owner === a.email)) n += 3;
  const wa = new Set(goodIdeas(a).flatMap(i => [...words(i.idea)])), wb = new Set(goodIdeas(b).flatMap(i => [...words(i.idea)]));
  if ([...wa].some(w => wb.has(w))) n += 2;
  if ((technical(a) && telling(b) && !technical(b)) || (technical(b) && telling(a) && !technical(a))) n += 1;
  if (pairOnly(a) && pairOnly(b)) n += 1;
  return n;
}

const idOf = (members) => members.map(m => m.email).sort().join("+");

/** Suggested pairs and solos for one list of people (one section). */
export function suggest(people) {
  const open = people.filter(wantsPair);
  const free = new Set(open.map(p => p.email));
  const scored = [];
  for (let i = 0; i < open.length; i++) for (let j = i + 1; j < open.length; j++) scored.push({ a: open[i], b: open[j], n: scoreOf(open[i], open[j]) });
  scored.sort((x, y) => y.n - x.n || x.a.name.localeCompare(y.a.name));
  const pairs = [];
  const take = (a, b) => { free.delete(a.email); free.delete(b.email); pairs.push([a, b]); };
  scored.forEach(s => { if (s.n > 0 && free.has(s.a.email) && free.has(s.b.email)) take(s.a, s.b); });
  // Anyone who asked for a pair outright and is still alone: the next such person.
  const left = open.filter(p => free.has(p.email) && pairOnly(p));
  for (let i = 0; i + 1 < left.length; i += 2) take(left[i], left[i + 1]);
  const out = pairs.map(members => ({ id: idOf(members), members: members.map(m => m.email), ...storyFor(members) }));
  people.filter(p => !pairs.some(pr => pr.includes(p))).forEach(p => out.push({ id: idOf([p]), members: [p.email], ...storyFor([p]) }));
  return out;
}

/** Everyone's standing in a set of pairs: { [email]: pair }. */
export const pairOf = (pairs) => Object.fromEntries((pairs || []).flatMap(p => (p.members || []).map(m => [m, p])));

/** Join two cards (a pair or a solo each) into one pair, at most two people. Returns the new list or null. */
export function join(pairs, idA, idB) {
  const a = pairs.find(p => p.id === idA), b = pairs.find(p => p.id === idB);
  if (!a || !b || a === b) return null;
  if (a.members.length + b.members.length > 2) return null;
  const members = [...a.members, ...b.members];
  const story = a.story || b.story;
  const from = a.from || b.from;
  return [...pairs.filter(p => p !== a && p !== b), { id: members.slice().sort().join("+"), members, story, from }];
}

/** Split a pair back into solos, each keeping no story unless it was theirs. */
export function split(pairs, id) {
  const p = pairs.find(x => x.id === id);
  if (!p || p.members.length < 2) return pairs;
  return [...pairs.filter(x => x !== p), ...p.members.map(m => ({ id: m, members: [m], story: p.from?.owner === m ? p.story : "", from: p.from?.owner === m ? p.from : null }))];
}
