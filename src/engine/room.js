// What the room made.
//
// Everything on the shelf so far is material I wrote or found. The other half
// of a quarter is what the students put into the machine: posts on a
// discussion board and questions they asked. That material accumulates faster
// than mine, none of it has ever been searchable, and there has never been an
// instructor view of a board at all. So "what did students ask about framing
// last year" has no answer today.
//
// Two extra stores per class hold it, one key each, because a burst of posts
// during class must never collide with a day-plan save. This reads both and
// puts them in one shape the repository can search beside the blocks.
//
// Headlines and polls were two more kinds here until 2026-09-20, when both
// features came out of the app. Anything a class already collected is still
// in its store and unread, so bringing either back brings its history with
// it.
//
// Reading is deliberately separate from the shelf. Twenty more fetches on a
// page I open to find one article is a page that got slower for nothing, so
// the room is read when I ask for the room and not before.

export const roomKeys = (storageKey) => ({
  boards: storageKey + "-boards",
  questions: storageKey + "-questions",
});

export const ROOM_KINDS = [
  { id: "board", label: "Board posts", hex: "#0f766e" },
  { id: "question", label: "Questions", hex: "#7c3aed" },
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

// One class's two stores, as rows. Newest first, because a question asked
// last Tuesday is worth more than a question asked in the first week of a
// quarter that has finished.
export function roomItems(cls, got) {
  const out = [];
  const boards = (got?.boards || {}).boards || {};
  const questions = (got?.questions || {}).items || [];

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


  return out.sort((a, b) => (b.at || 0) - (a.at || 0));
}

export const roomCounts = (items) => {
  const c = {};
  (items || []).forEach(i => { c[i.kind] = (c[i.kind] || 0) + 1; });
  return c;
};

// What one room item says, as a block, so a question a student asked or a
// board they filled can be kept and taught with next year.
//
// The id is made from where the item came from, so keeping the same post twice
// writes one block rather than two.
export function blockFromRoom(item) {
  const base = { id: "room-" + item.key, tags: ["from the room", item.cls.code] };
  if (item.kind === "question") {
    return { ...base, type: "question", title: item.title,
      body: item.who ? "Asked by " + item.who : "" };
  }
  return { ...base, type: "board", title: item.title,
    body: (item.posts || []).map(p => p.who + ": " + p.text).join("\n") };
}
