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

// `blurb` is the short line under the column header, for Andrew. `means` is
// the sentence a student reads under the letter on the deck card.
export const BUCKETS = [
  { id: "exceptional", label: "Exceptional", letter: "A", score: 100, blurb: "above an A",
    means: "Work that stood out above the whole class. An A, and then some." },
  { id: "a", label: "A", letter: "A", score: 95, blurb: "did the work, did it well",
    means: "You did the challenge, and you did it well." },
  { id: "b", label: "B", letter: "B", score: 85, blurb: "did the work",
    means: "You did the challenge. Solid work, with room to sharpen." },
  { id: "c", label: "C", letter: "C", score: 75, blurb: "missed some of the requirements",
    means: "You turned something in, but the challenge asked for more than you gave. Some of the requirements were missed." },
  { id: "d", label: "D", letter: "D", score: 65, blurb: "bad work",
    means: "This fell well short of the challenge. Read the challenge again, and come talk to me." },
  { id: "incomplete", label: "Incomplete", letter: "Incomplete", score: 0, blurb: "counts as a zero",
    means: "Not finished, or not enough of the challenge to grade. An Incomplete counts as a zero until you finish." },
  { id: "f", label: "F", letter: "F", score: 0, blurb: "zero",
    means: "No credit for this one." },
];

// The other way to grade a challenge: did the student do what was asked.
// Andrew, 2026-09-15: "on some challenges, i don't want to give letter
// grades. For some, it's complete, off the mark, and incomplete, and not
// submitted." Off the mark became Not quite. Complete counts 100, Not quite
// 50, Incomplete and Not submitted 0. No sentence under these on the grade
// card: the word is the whole message.
export const COMPLETE_BUCKETS = [
  { id: "complete", label: "Complete", letter: "Complete", score: 100, blurb: "did what was asked", means: "" },
  { id: "notquite", label: "Not quite", letter: "Not quite", score: 50, blurb: "tried, not what was asked", means: "" },
  { id: "incomplete-c", label: "Incomplete", letter: "Incomplete", score: 0, blurb: "counts as a zero", means: "" },
  { id: "notsubmitted", label: "Not submitted", letter: "Not submitted", score: 0, blurb: "counts as a zero", means: "" },
];

// How a challenge is graded: "letters", the default, or "complete".
export const SCALES = { letters: "Letters", complete: "Complete" };
export const scaleOf = (asg) => (asg?.scale === "complete" ? "complete" : "letters");
export const bucketsFor = (asg) => (scaleOf(asg) === "complete" ? COMPLETE_BUCKETS : BUCKETS);

export const bucketOf = (id) => BUCKETS.find(b => b.id === id) || COMPLETE_BUCKETS.find(b => b.id === id) || null;

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

// The other way: a comment written in the rich editor, as the plain text a
// deck card or a grade card draws.
export const htmlToText = (html) => String(html || "")
  .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div)>\s*<(p|div)[^>]*>/gi, "\n\n").replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim();

// The board's own events are the ones marked `board`, so Hide and a second
// Release can take out exactly what the board wrote and nothing a student
// posted or an earlier grading flow left behind.
const notBoard = (log) => (log || []).filter(e => !e.board);

let seq = 0;
const eid = (now) => "gb-" + now.toString(36) + "-" + (seq++).toString(36);

// The grade a student was last sent from this board: the board's event in
// their log, or the one Hide put aside.
const sentTo = (board, log, name) => {
  const inLog = (log || []).filter(e => e.board);
  return inLog[inLog.length - 1] || board.hidden?.[name] || null;
};

// What a release would do for one student: "new" or "changed" when the card
// differs from what the student was last sent, "same" when the letter and the
// comment are what the student already has, "withdrawn" when the card was
// taken out of every column, and null when there is nothing to send.
const releaseStateOf = (board, log, name) => {
  const card = board.cards?.[name] || {};
  const b = bucketOf(card.bucket);
  const sent = sentTo(board, log, name);
  if (!b) return sent && (log || []).some(e => e.board) ? "withdrawn" : null;
  if (!sent) return "new";
  const same = sent.bucket === b.id && (sent.html || null) === (toHtml(card.comment) || null);
  return same ? "same" : "changed";
};

// Release: every sorted card becomes a grade in that student's log, with the
// comment on the grade.
//
// Andrew, 2026-09-15: "i don't want to have a grade released twice, unless i
// modified it or added a comment to it." A release used to rewrite every grade
// with a new time and wipe every seen stamp, so a second release after grading
// five more students put the same card in front of the thirty who had already
// read theirs. Now a grade whose letter and comment are unchanged keeps its
// original event, time and all, so the student's seen stamp still covers
// that grade and no card comes round again. The private note never counts
// as a change, because the student never sees the note.
export const releasePatch = (data, aid, now = Date.now()) => {
  const board = boardOf(data, aid);
  const logs = { ...((data?.assignmentLog || {})[aid] || {}) };
  const names = new Set([...Object.keys(board.cards || {}), ...Object.keys(board.hidden || {})]);
  names.forEach(name => {
    const card = board.cards?.[name] || {};
    const b = bucketOf(card.bucket);
    const state = releaseStateOf(board, logs[name], name);
    const kept = notBoard(logs[name]);
    if (!b) { if (logs[name]) logs[name] = kept; return; }
    if (state === "same") {
      logs[name] = [...kept, sentTo(board, logs[name], name)];
      return;
    }
    const html = toHtml(card.comment);
    logs[name] = [...kept, { id: eid(now), ts: now, type: "grade", board: true,
      score: b.score, letter: b.letter, bucket: b.id, html: html || null }];
  });
  const next = withBoard(data, aid, brd => {
    const { hidden, ...rest } = brd;
    return { ...rest, released: { at: now }, seen: brd.seen || {} };
  });
  return { ...next, assignmentLog: { ...(data?.assignmentLog || {}), [aid]: logs } };
};

// Hide: the board's events come out of every log and the release stamp goes.
// The cards stay sorted, and each taken-back grade is put aside on the board,
// so releasing the same grade again later is not a second card.
export const hidePatch = (data, aid) => {
  const board = boardOf(data, aid);
  const logs = { ...((data?.assignmentLog || {})[aid] || {}) };
  const hidden = { ...(board.hidden || {}) };
  Object.keys(logs).forEach(name => {
    const sent = (logs[name] || []).filter(e => e.board);
    if (sent.length) hidden[name] = sent[sent.length - 1];
    logs[name] = notBoard(logs[name]);
  });
  const next = withBoard(data, aid, brd => ({ ...brd, released: null, hidden }));
  return { ...next, assignmentLog: { ...(data?.assignmentLog || {}), [aid]: logs } };
};

// Who the next release would reach: the students getting a grade for the
// first time, the ones whose letter or comment changed, and the ones whose
// grade comes back out. Everyone else already has what the board says.
export const releaseCounts = (data, aid) => {
  const board = boardOf(data, aid);
  const logs = (data?.assignmentLog || {})[aid] || {};
  const out = { new: 0, changed: 0, same: 0, withdrawn: 0 };
  const names = new Set([...Object.keys(board.cards || {}), ...Object.keys(logs)]);
  names.forEach(name => {
    const s = releaseStateOf(board, logs[name], name);
    if (s) out[s]++;
  });
  return out;
};

// True when a release would change what any student has.
export const changedSinceRelease = (board, data, aid) => {
  if (!board?.released?.at) return false;
  if (data && aid) { const c = releaseCounts(data, aid); return c.new + c.changed + c.withdrawn > 0; }
  return Object.values(board.cards || {}).some(c => (c.at || 0) > board.released.at);
};

export const sortedCount = (board) => Object.values(board?.cards || {}).filter(c => c.bucket).length;

// ─── the student's side ───

// The released grades this student has not yet tapped through. One entry per
// assignment, in assignment order, carrying what the deck card shows: the
// letter and what the letter means, the comment and when the grade went out,
// and what the student turned in, with its link, note and time.
export const unseenGrades = (config, data, name) => {
  if (!name) return [];
  const assignments = data?.assignments || config.assignments || [];
  return assignments.flatMap(asg => {
    const board = boardOf(data, asg.id);
    if (!board.released) return [];
    const log = data?.assignmentLog?.[asg.id]?.[name] || [];
    // The card shows the grade the student was sent, not the board as it
    // stands. A card moved after a release and not released again is still
    // private, and the deck used to show the new letter anyway.
    const sentAll = log.filter(e => e.board);
    const sent = sentAll[sentAll.length - 1];
    const b = sent && bucketOf(sent.bucket);
    if (!b) return [];
    // The time on the student's own grade, not the time of the last release,
    // so a release that left this grade alone does not bring the card back.
    const gradedAt = sent.ts;
    const card = board.cards?.[name] || {};
    const comment = (sent.html || null) === (toHtml(card.comment) || null)
      ? String(card.comment || "").trim()
      : htmlToText(sent.html);
    // A comment on the student's assignment is a comment on the grade.
    // Andrew, 2026-09-15: "commenting on a grade for a student is the same as
    // commenting on their assignment." Posted from the Assignments page, a
    // comment went into the log and never brought the card back, so the
    // student only found the comment by opening the assignment. Every
    // instructor comment posted after the grade went out is on the card, and
    // the newest one decides whether the card is new to the student.
    const more = log.filter(e => e.type === "comment" && e.from !== "student" && e.ts > sent.ts)
      .map(e => ({ text: htmlToText(e.html || e.text), at: e.ts })).filter(m => m.text);
    const changedAt = more.length ? Math.max(gradedAt, more[more.length - 1].at) : gradedAt;
    if ((board.seen?.[name] || 0) >= changedAt) return [];
    const subs = log.filter(e => e.type === "submission");
    const last = subs[subs.length - 1] || null;
    const linked = [...subs].reverse().find(e => e.link) || null;
    return [{ aid: asg.id, title: asg.title, due: asg.due || "", letter: b.letter, bucket: b.id, means: b.means,
      comment, more, gradedAt,
      link: linked?.link || "", note: String(last?.text || "").trim(), submittedAt: last?.ts || null }];
  });
};

// A meeting asked for from a deck card: the same message the You card's
// Make a meeting button posts, so the request lands in the same thread and
// draws the same way, with the assignment named in the text.
export const meetingPatch = (data, name, title, now = Date.now()) => {
  const threads = { ...(data?.threads || {}) };
  threads[name] = [...(threads[name] || []), { id: eid(now), ts: now, from: "student", kind: "meeting", text: title ? "About " + title : "" }];
  return { ...data, threads };
};

export const markSeen = (data, aid, name, now = Date.now()) =>
  withBoard(data, aid, board => ({ ...board, seen: { ...(board.seen || {}), [name]: now } }));

// A number out of 100 as the word the columns would have given. The older
// grading flow wrote numbers, and the parade on the You card shows every
// grade as a letter, so those get the plain bands: 90 and up is an A.
export const letterOf = (score) => {
  if (score == null || score === "") return null;
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  return n >= 90 ? "A" : n >= 80 ? "B" : n >= 70 ? "C" : n >= 60 ? "D" : "F";
};

// What a grade event reads as on a card: the letter when the board wrote the
// grade, the score when the grading flow did.
export const gradeText = (g) => (g ? (g.letter || (g.score != null ? g.score + "/100" : "")) : "");
