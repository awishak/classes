// Questions for Andrew, answered on the site.
//
// Andrew, 2026-10-22, when a plan came back with four questions at the foot
// of a terminal reply: "use my html style for asking me questions." And when
// the first draft was an artifact: "no i want it within
// classes.andrewishak.com." So a question set is a page of his own, one card
// a question, the options as tap targets, saved to the plan row the moment he
// taps. A session reads the answers back with scripts/decisions.mjs.
//
// A set lives here, in the repo: the questions are about planning a class
// and name no student. The answers live on `decisions` on the plan row,
// keyed by the set's id:
//
//   decisions: { [setId]: { answers: { [qid]: { pick, picks, notes } }, updatedAt } }
//
// A question is `one` (pick one), `many` (tick up to `max`) or `text` (notes
// only). Every question has a notes box.

export const DECISIONS = [
  {
    id: "section-2",
    classId: "comm118",
    date: "2026-10-22",
    title: "Five calls on the culture section",
    intro: "The plan is in teaching/comm118/section-2-culture.md. Tap an answer and the answer saves. Notes under each one come to me too.",
    questions: [
      {
        id: "travel", kind: "one",
        ask: "Oct 26, Nov 6 and Nov 9 are no-meeting days on the site. Is that right?",
        why: "The plan counts three teaching days before Sit-Down 2: Oct 28, Oct 30 and Nov 4.",
        options: [
          { v: "yes", label: "Right, all three are off" },
          { v: "no", label: "Not right, the notes say which" },
        ],
        placeholder: "Which days are off, and which are guest speakers",
      },
      {
        id: "block", kind: "one",
        ask: "Where does the third block of Sit-Down 2 slots go?",
        why: "25 students in two class periods is 5 minutes each. A third block gets everyone to 8.",
        options: [
          { v: "thu-nov-12", label: "Thursday, November 12", sub: "Like the Thursday group this week" },
          { v: "mon-nov-9", label: "Monday, November 9, in my office", sub: "Sign-up slots on a no-meeting day" },
          { v: "none", label: "No third block", sub: "Five minutes each, Wednesday and Friday" },
        ],
      },
      {
        id: "assignment", kind: "one",
        ask: "What is the one assignment before the memo?",
        why: "Weekly Challenge 3, the former coach interview, is already on the site, due Sunday, November 1.",
        options: [
          { v: "interview", label: "Keep the coach interview, pointed at four concepts", sub: "One question per concept; a page on what the coach said and which concept the answer shows" },
          { v: "rank", label: "Replace the interview with the rank-the-concepts worksheet", sub: "The Worktopia shape: rank the ten, write your top three, name your one" },
          { v: "both", label: "Both, the interview as the challenge and the ranking inside the memo" },
        ],
      },
      {
        id: "cut", kind: "many", max: 2,
        ask: "Twelve concepts are in the plan. Which two go?",
        why: "Tick the ones to cut. Coordination and emotion-and-time overlap the rest the most.",
        options: [
          { v: "coordination", label: "Coordination, physical and mental" },
          { v: "knowledge-sharing", label: "Knowledge sharing" },
          { v: "roles", label: "Role clarity and role ambiguity" },
          { v: "goals", label: "Goal setting" },
          { v: "climate", label: "Motivational climate" },
          { v: "culture", label: "Culture" },
          { v: "conflict", label: "Conflict and dissent" },
          { v: "cohesion", label: "Cohesion" },
          { v: "power", label: "Power" },
          { v: "coaching", label: "Coaching as complexity" },
          { v: "emotion-time", label: "Emotion and time" },
          { v: "model-for-work", label: "Sports as a model for work" },
        ],
        placeholder: "A concept to add, or a rename",
      },
      {
        id: "oct28", kind: "one",
        ask: "October 28 is titled “Identity, informal play, and who plays what,” with a Game. What happens to that day?",
        why: "The plan makes the 28th the Ishak chapter day.",
        options: [
          { v: "retitle", label: "Retitle the day to the chapter; the Game stays" },
          { v: "split", label: "Identity for the Game, then open the chapter in the second half" },
          { v: "drop", label: "Identity is done; drop the topic" },
        ],
      },
      {
        id: "other", kind: "text",
        ask: "Anything else",
        placeholder: "Readings to add or drop, a guest speaker I do not know about, the memo length",
      },
    ],
  },
];

export const DECISION_CLASSES = [...new Set(DECISIONS.map(s => s.classId))];
export const setsFor = (classId) => DECISIONS.filter(s => s.classId === classId).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
export const setOf = (setId) => DECISIONS.find(s => s.id === setId) || null;

export const answersOf = (data, setId) => (data && data.decisions && data.decisions[setId] && data.decisions[setId].answers) || {};

// The class with one answer changed. `patch` is any of pick, picks, notes.
export function withAnswer(data, setId, qid, patch) {
  const all = (data && data.decisions) || {};
  const set = all[setId] || {};
  const answers = { ...(set.answers || {}) };
  answers[qid] = { ...(answers[qid] || {}), ...patch };
  return { ...data, decisions: { ...all, [setId]: { ...set, answers, updatedAt: new Date().toISOString() } } };
}

// How many of a set's questions have an answer or a note.
export const answeredCount = (set, answers) => set.questions.filter(q => {
  const a = answers[q.id] || {};
  return !!a.pick || (Array.isArray(a.picks) && a.picks.length > 0) || !!(a.notes && a.notes.trim());
}).length;

// The answers as lines of text, for the script and for the copy button.
export function answerLines(set, answers) {
  const labelOf = (q, v) => { const o = (q.options || []).find(x => x.v === v); return o ? o.label : v; };
  return set.questions.map((q, i) => {
    const a = answers[q.id] || {};
    let body = "";
    if (q.kind === "one") body = a.pick ? labelOf(q, a.pick) : "(no answer)";
    else if (q.kind === "many") body = Array.isArray(a.picks) && a.picks.length ? a.picks.map(v => labelOf(q, v)).join("; ") : "(none)";
    const notes = a.notes && a.notes.trim() ? a.notes.trim() : "";
    const head = (i + 1) + ". " + q.ask;
    if (q.kind === "text") return head + " " + (notes || "(nothing)");
    return head + " " + body + (notes ? " | " + notes : "");
  });
}
