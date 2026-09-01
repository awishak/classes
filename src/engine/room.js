// What the room made.
//
// Everything on the shelf so far is material I wrote or found. The other half
// of a quarter is what the students put into the machine: posts on a
// discussion board, questions asked during class, headlines they brought in,
// and how a poll went. That material accumulates faster than mine, none of it
// has ever been searchable, and there has never been an instructor view of a
// board at all. So "what did students ask about framing last year" has no
// answer today.
//
// Four extra stores per class hold it, one key each, because a burst of posts
// during class must never collide with a day-plan save. This reads all four
// and puts them in one shape the repository can search beside the blocks.
//
// Reading is deliberately separate from the shelf. Twenty more fetches on a
// page I open to find one article is a page that got slower for nothing, so
// the room is read when I ask for the room and not before.

import { tally, written, isFreeForm, pastPolls } from "./poll.js";

export const roomKeys = (storageKey) => ({
  boards: storageKey + "-boards",
  questions: storageKey + "-questions",
  headlines: storageKey + "-headlines",
  poll: storageKey + "-poll",
});

export const ROOM_KINDS = [
  { id: "board", label: "Board posts", hex: "#0f766e" },
  { id: "question", label: "Questions", hex: "#7c3aed" },
  { id: "headline", label: "Headlines", hex: "#b45309" },
  { id: "poll", label: "Polls", hex: "#0369a1" },
];

// The day something happened, written the way a block writes the day it was
// made, so the two columns read as the same kind of fact.
export function stampOf(at) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  const two = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate());
}

const words = (...bits) => bits.filter(Boolean).join(" ").toLowerCase();

// One class's four stores, as rows. Newest first, because a question asked
// last Tuesday is worth more than a question asked in the first week of a
// quarter that has finished.
export function roomItems(cls, got) {
  const out = [];
  const boards = (got?.boards || {}).boards || {};
  const questions = (got?.questions || {}).items || [];
  const headlines = (got?.headlines || {}).items || [];
  const poll = got?.poll || null;

  Object.values(boards).forEach(b => {
    const posts = (b.posts || []).slice().sort((x, y) => (x.at || 0) - (y.at || 0));
    if (!posts.length && !b.prompt) return;
    out.push({
      key: cls.id + "-board-" + b.id, kind: "board", cls, at: b.at || 0,
      title: b.prompt || "A prompt with no words on it",
      count: posts.length, posts, closed: !!b.closed,
      words: words(b.prompt, posts.map(p => p.who + " " + p.text).join(" ")),
    });
  });

  questions.forEach(q => out.push({
    key: cls.id + "-question-" + q.id, kind: "question", cls, at: q.at || 0,
    title: q.text || "", who: q.anon ? "Anonymous" : (q.who || ""), state: q.state || "open",
    words: words(q.text, q.anon ? "" : q.who),
  }));

  headlines.forEach(h => out.push({
    key: cls.id + "-headline-" + h.id, kind: "headline", cls, at: h.ts || 0,
    title: h.text || "", url: h.url || "", who: h.submittedBy || "",
    reads: [...(h.realCategories || []), ...(h.realConcepts || [])],
    words: words(h.text, h.url, h.submittedBy, (h.realCategories || []).join(" "), (h.realConcepts || []).join(" ")),
  }));

  // The one on the floor, and every one that has finished. A poll used to be
  // overwritten by the next question, so anything from before the archive
  // existed is one poll per class and the rest is gone.
  [poll, ...pastPolls(poll)].forEach(p => {
    if (!p || !p.question) return;
    const options = p.options || [];
    const free = isFreeForm(p);
    const r1 = free ? null : tally(p.r1, options.length);
    const r2 = free ? null : tally(p.r2, options.length);
    const said = free ? [...written(p.r1), ...written(p.r2)] : [];
    out.push({
      key: cls.id + "-poll-" + (p.id || "last"), kind: "poll", cls, at: p.at || 0,
      title: p.question, options, r1, r2, said, correct: p.correct, over: !!p.endedAt,
      words: words(p.question, options.join(" "), said.map(x => x.text).join(" ")),
    });
  });

  return out.sort((a, b) => (b.at || 0) - (a.at || 0));
}

export const roomCounts = (items) => {
  const c = {};
  (items || []).forEach(i => { c[i.kind] = (c[i.kind] || 0) + 1; });
  return c;
};

// What one room item says, as a block, so a headline a student found or a
// question a student asked can be kept and taught with next year.
//
// The id is made from where the item came from, so keeping the same post twice
// writes one block rather than two.
export function blockFromRoom(item) {
  const base = { id: "room-" + item.key, tags: ["from the room", item.cls.code] };
  if (item.kind === "headline") {
    return { ...base, type: "link", title: item.title, url: item.url || "",
      source: item.who ? "Brought in by " + item.who : "",
      body: item.reads?.length ? "The room read it as: " + item.reads.join(", ") : "" };
  }
  if (item.kind === "question") {
    return { ...base, type: "question", title: item.title,
      body: item.who ? "Asked by " + item.who : "" };
  }
  if (item.kind === "poll") {
    return { ...base, type: "question", title: item.title,
      body: (item.options || []).join("\n") };
  }
  return { ...base, type: "board", title: item.title,
    body: (item.posts || []).map(p => p.who + ": " + p.text).join("\n") };
}
