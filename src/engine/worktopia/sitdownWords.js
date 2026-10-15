// The words a student reads on the Sit-Down page, editable by Andrew in place.
//
// His sentences are kept where he said them on 2026-10-15; the rest is
// Claude's first draft for him to change on the page. His edits live in one
// instructor-only row (a -plan row, so the database refuses anyone else's
// write), the way the visual story's instructions do. Clearing a line on the
// page puts the default back.
//
// The dates are the ones in SITDOWN (sitdown.js). If the due date moves,
// change both.

export const WORDS_ROW = "sitdown-1-words-plan";

export const WORDS = {
  title: "Sit-Down 1",
  intro: "A sit-down is a meeting in my office with the people at your table. Everyone at the table has a job in sports. We talk about how those jobs relate to each other, and how each job changes when AI can do part of the work. I ask the questions, and I can ask anyone at the table about any of the jobs, so be ready to talk about every job at the table, yours most of all.",

  "head.steps": "How the sit-down works",
  "step.1": "Write your Sit-Down prep: a Google Doc, two to three pages, due Monday, October 19, at 11:59 PM. Turn the link in on this page.",
  "step.2": "Read your table's prep. At 12:01 AM on Tuesday, October 20, every document from your table shows up on this page. Read every one before your sit-down, and know your own well.",
  "step.3": "The sit-down. We meet in Vari Hall 206 at your time. The conversation is recorded on video.",

  "head.prep": "The Sit-Down prep",
  "prep.what": "Two to three pages that your table reads before you meet. Page one is about your job. The rest is about the people at your table, about half a page each. Five questions in all, written out, that I might ask you.",
  "head.page1": "Page one: your job",
  "prep.page1": "Say what your job is and where you sit in sports: who you work for, who you work with, what the work is day to day. Then where you see the job going. How will AI change the job? What could you do with AI that would make your work better? What do you still bring as the human? Close with two open questions about where your field is going, questions you don't have an answer to yet.",
  "head.others": "Pages two and three: the people at your table",
  "prep.others": "About half a page for each person at your table. How does your job relate to theirs now? How does that relationship change when machine learning takes over parts of one job or the other? End each one with an open question about where the relationship is going. The prompts below are a start. Disagree with a prompt if you see the relationship differently.",
  "head.questions": "The five questions",
  "prep.questions": "At least one question for each person at your table, and two about your own job. These are questions I might ask you in the room, or ask someone else at the table about you. The test is whether you can talk about each one out loud.",
  "head.sources": "Base what you say on something",
  "prep.sources": "Include one or two links to things you've read, wherever they fit. You can say what you think, and you should, and the document is stronger when you can point to where a claim comes from.",
  "head.ai": "Using AI",
  "prep.ai": "You can use AI to help you write the prep. The sit-down is a conversation, and you answer out loud, so write a document you can talk about.",

  "head.turnin": "Turn in your prep",
  "prep.turnin": "A Google Doc. Set sharing so anyone with the link can view, then paste the link here. Your table reads your document from this page, so the sharing setting matters.",

  "head.docs": "Your table's documents",
  "docs.before": "Your table's documents show up here at 12:01 AM on Tuesday, October 20, the minute the prep is due.",
  "docs.after": "Read every one before your sit-down.",

  "head.room": "In the room",
  "room.1": "Be in Vari Hall 206 five to ten minutes early. We start on time, and I won't wait for anybody.",
  "room.2": "If you're seriously ill, don't come. We'll find another way to do your sit-down. We won't do Zoom.",
  "room.3": "If you're not seriously ill, come, even if you're not ready. Be honest about which one you are.",
  "room.4": "The sit-down is recorded on video.",

  "prompt.same": "You're in the same field. Where do the two jobs differ, and which parts of each does AI take first?",
  "prompt.ask": "Where is this relationship going, and what does AI do to the relationship?",
  "prompt.none": "Worktopia has no line for these two jobs yet. Where do they meet, and who needs whom?",
};

// The words with nothing behind them, for a render with no browser.
export const plainWords = (over = {}) => ({
  say: (k) => (over[k] != null && String(over[k]).trim() ? over[k] : WORDS[k]),
  raw: (k) => (over[k] != null ? over[k] : WORDS[k]),
  def: (k) => WORDS[k],
  edit: () => {},
  status: "",
});
