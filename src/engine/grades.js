// Grade view: the class as cards, sorted into columns, released all at once.
//
// Andrew, 2026-09-09: "I'm tired of giving people like 95 or 91. Did you do
// that assignment? Did you do it well enough? Did you get a C, like you didn't
// really meet all the requirements?" So a grade is a column, and a column is
// a word. The numbers underneath are only there so the weighted average on
// the You card still adds up; he said he does not care what they are, and
// that an Incomplete counts as a zero until the card moves.
//
// Sorting is private. Nothing reaches a student until he presses Release,
// and Release publishes every card at once: the grade and the comment land in
// each student's assignment log, and each student gets a deck card the next
// time they open the class. Hide takes all of that back and leaves the board
// exactly as sorted, so he can change his mind and release again.
//
// The board lives in the class store at data.gradeBoard[assignmentId]:
//
//   { cards: { [studentName]: { bucket, comment, note, at } },
//     released: { at } | null,
//     seen: { [studentName]: ts } }
//
// `comment` goes to the student on release. `note` never leaves this page.

export const BUCKETS = [
  { id: "exceptional", label: "Exceptional", letter: "A", score: 100, blurb: "above an A" },
  { id: "a", label: "A", letter: "A", score: 95, blurb: "did the work, did it well" },
  { id: "b", label: "B", letter: "B", score: 85, blurb: "did the work" },
  { id: "c", label: "C", letter: "C", score: 75, blurb: "missed some of the requirements" },
  { id: "d", label: "D", letter: "D", score: 65, blurb: "bad work" },
  { id: "incomplete", label: "Incomplete", letter: "Incomplete", score: 0, blurb: "counts as a zero" },
  { id: "f", label: "F", letter: "F", score: 0, blurb: "zero" },
];

export const bucketOf = (id) => BUCKETS.find(b => b.id === id) || null;

export const boardOf = (data, aid) => data?.gradeBoard?.[aid] || { cards: {}, released: null, seen: {} };

const withBoard = (data, aid, fn) => {
  const boards = { ...(data?.gradeBoard || {}) };
  boards[aid] = fn(boardOf(data, aid));
  return { ...data, gradeBoard: boards };
};

// A card moved into a column, or back out of every column when bucket is null.
export const placeCard = (data, aid, name, bucket, now = Date.now()) =>
  withBoard(data, aid, board => {
    const cards = { ...(board.cards || {}) };
    const prev = cards[name] || {};
    cards[name] = { ...prev, bucket: bucket || null, at: now };
    return { ...board, cards };
  });

// The two boxes on a card. `comment` reaches the student on release; `note`
// stays here.
export const writeCard = (data, aid, name, fields, now = Date.now()) =>
  withBoard(data, aid, board => {
    const cards = { ...(board.cards || {}) };
    cards[name] = { ...(cards[name] || {}), ...fields, at: now };
    return { ...board, cards };
  });

// Plain text to the same HTML the grading flow writes, so the student's log
// draws both the same way.
export const toHtml = (text) => String(text || "").trim().split(/\n{2,}/).filter(Boolean)
  .map(p => "<p>" + p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>") + "</p>").join("");

// The board's own events are the ones marked `board`, so Hide and a second
// Release can take out exactly what the board wrote and nothing a student
// posted or an earlier grading flow left behind.
const notBoard = (log) => (log || []).filter(e => !e.board);

let seq = 0;
const eid = (now) => "gb-" + now.toString(36) + "-" + (seq++).toString(36);

// Release: every sorted card becomes a grade in that student's log, with the
// comment on the grade, and the board stamps the time so the deck knows who
// has not seen theirs yet.
export const releasePatch = (data, aid, now = Date.now()) => {
  const board = boardOf(data, aid);
  const logs = { ...((data?.assignmentLog || {})[aid] || {}) };
  Object.entries(board.cards || {}).forEach(([name, card]) => {
    const b = bucketOf(card.bucket);
    const kept = notBoard(logs[name]);
    if (!b) { logs[name] = kept; return; }
    const html = toHtml(card.comment);
    logs[name] = [...kept, { id: eid(now), ts: now, type: "grade", board: true,
      score: b.score, letter: b.letter, bucket: b.id, html: html || null }];
  });
  const next = withBoard(data, aid, brd => ({ ...brd, released: { at: now }, seen: {} }));
  return { ...next, assignmentLog: { ...(data?.assignmentLog || {}), [aid]: logs } };
};

// Hide: the board's events come out of every log and the release stamp goes.
// The cards stay sorted.
export const hidePatch = (data, aid) => {
  const logs = { ...((data?.assignmentLog || {})[aid] || {}) };
  Object.keys(logs).forEach(name => { logs[name] = notBoard(logs[name]); });
  const next = withBoard(data, aid, brd => ({ ...brd, released: null, seen: {} }));
  return { ...next, assignmentLog: { ...(data?.assignmentLog || {}), [aid]: logs } };
};

// True when a card moved or changed after the last release, so the button can
// say the students are looking at an older sort.
export const changedSinceRelease = (board) => {
  const at = board?.released?.at;
  if (!at) return false;
  return Object.values(board.cards || {}).some(c => (c.at || 0) > at);
};

export const sortedCount = (board) => Object.values(board?.cards || {}).filter(c => c.bucket).length;

// ─── the student's side ───

// The released grades this student has not yet tapped through. One entry per
// assignment, in assignment order.
export const unseenGrades = (config, data, name) => {
  if (!name) return [];
  const assignments = data?.assignments || config.assignments || [];
  return assignments.flatMap(asg => {
    const board = boardOf(data, asg.id);
    const card = board.cards?.[name];
    const b = card && bucketOf(card.bucket);
    if (!board.released || !b) return [];
    if ((board.seen?.[name] || 0) >= board.released.at) return [];
    return [{ aid: asg.id, title: asg.title, letter: b.letter, bucket: b.id, comment: String(card.comment || "").trim() }];
  });
};

export const markSeen = (data, aid, name, now = Date.now()) =>
  withBoard(data, aid, board => ({ ...board, seen: { ...(board.seen || {}), [name]: now } }));

// What a grade event reads as on a card: the letter when the board wrote the
// grade, the score when the grading flow did.
export const gradeText = (g) => (g ? (g.letter || (g.score != null ? g.score + "/100" : "")) : "");
