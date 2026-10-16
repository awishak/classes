// The words a student reads on the Sit-Down pages, editable by Andrew in
// place.
//
// Two pages: the sit-down itself (/<class>/sitdown) and the prep
// (/<class>/sitdown/prep). His sentences are kept where he said them on
// 2026-10-15; the rest is Claude's draft in his register, for him to change
// on the page. Andrew, 2026-10-15, second pass: "official and also delivered
// the way a 12 year old would understand it. So it's not infantilizing
// people, but it's explaining things in a way like they're unfamiliar with
// it." Complete sentences, no half sentences, no clause that ends on a word
// that names nothing. His edits live in one instructor-only row (a -plan
// row, so the database refuses anyone else's write). Clearing a line on the
// page puts the default back.
//
// The dates are the ones in SITDOWN (sitdown.js). If the due date moves,
// change both.

export const WORDS_ROW = "sitdown-1-words-plan";

export const WORDS = {
  // ─── the sit-down page ───
  title: "Sit-Down 1",
  intro: "A sit-down is a meeting in my office with the people at your table. Everyone at the table has a job in sports, and we talk about how those jobs connect to each other and how each job is changing. I ask the questions. I can ask anyone at the table about any of the jobs, so come ready to talk about every job at the table.",
  director: "Meeting director",

  "head.steps": "How the sit-down works",
  "step.1": "Write your Scouting Report in a Google Doc and turn the link in on this page by Monday, October 19, at 11:59 PM. The Scouting Report page explains exactly what goes in the document.",
  "step.1.link": "Read the Scouting Report page",
  "step.2": "Read the Scouting Reports from everyone at your table. They open on this page on Tuesday, October 20. Make sure you're familiar with every report at your table, and know your own well.",
  "step.3": "The meeting.",

  "head.guidelines": "Guidelines",
  "guide.1": "Please be five or ten minutes early. We will start on time.",
  "guide.2": "If you're seriously ill, don't come. We will find another way to do your sit-down later. Please only miss the meeting if you're ill.",
  "guide.3": "The sit-down is recorded on audio. You're welcome to come listen to the recording afterward if you'd like.",

  "head.turnin": "Turn in your Scouting Report",
  "prep.turnin": "Your Scouting Report is a Google Doc. Set sharing so that anyone with the link can view, then paste the link here. Everyone at your table reads your report from this page, so the sharing setting matters.",

  "head.docs": "Your table's Scouting Reports",
  "docs.before": "The Scouting Reports from your table show up here on Tuesday, October 20, at 12:01 AM, as soon as the reports are due.",
  "docs.after": "Read every report before your sit-down.",

  // ─── the prep page ───
  "prep.title": "Scouting Report",
  "prep.intro": "Before we meet, you will complete a document that has information about the following things: your position in sports, where that position is going, and how your position connects to each person at your table. You will also include five questions that might be asked of you or of any other person at your meeting. Here is how to put the document together.",
  "prep.shape": "Your Scouting Report is a Google Doc, two to three pages long. Page one is about your job. Pages two and three are about the people at your table. When you're done, turn the link in on the Sit-Down page.",

  "head.page1": "Page one: your job",
  "page1.intro": "Answer each of these in a short paragraph.",
  "page1.q1": "What's your job?",
  "page1.q2": "What's the current landscape for a position like this in sports?",
  "page1.q3": "Where do you see the job going?",
  "page1.q4": "How could AI change this job?",
  "page1.q5": "What could you do with AI that would make your work better?",
  "page1.q6": "What's going to be important for you to know how to do in this position?",
  "page1.open": "Finish page one with two open questions about your job or your field. An open question is one you don't have an answer to yet.",

  "head.others": "Pages two and three: the people at your table",
  "others.intro": "Write about half a page on each person at your table, and use the same structure for every person.",
  "others.q1": "How does your job connect to theirs right now?",
  "others.q2": "How does that connection change as AI takes over parts of one job or the other?",
  "others.q3": "End with one open question about where this connection is going.",
  "others.disagree": "The hints below are a start. If you see the relationship differently, say so. I want to know.",
  "hint.label": "A hint from your instructor",
  "hint.lead": "You might want to consider this:",
  "hint.hedge": "That's one way I could see the relationship going.",
  "hint.same": "You two are in the same field. You might want to consider where the two jobs differ, and which parts of each job AI takes first.",
  "hint.none": "I don't have a hint written for these two jobs yet. Start with where the two jobs meet and who needs whom.",

  "head.questions": "Your questions",
  "questions.body": "These are questions I may ask you in the room, or ask somebody else at the table about you. Write at least two questions on page one and at least one question for each connection on pages two and three.",

  "faq.q1": "How many questions do I need to write?",
  "faq.a1": "Five at a table of four, and six at a table of five: two questions on the first page, and one question for each person at your table.",
  "faq.q2": "Do I need to use links?",
  "faq.a2": "Yes. Base what you say on something you've read. Include one or two links where they fit, so I can see where a claim comes from.",
  "faq.q3": "Can I use AI?",
  "faq.a3": "Yes. My preference is that you use something called the INQUIRE method, which I explain on my page about teaching in the age of AI. Understand that you own everything you write. If AI writes something you don't like, I'm going to attribute it to you. Write a document you can talk about, and one you're proud of.",
  "faq.a3.link": "Read about the INQUIRE method",
};

// His page on teaching in the age of AI, where INQUIRE is explained. Andrew,
// 2026-10-15: "give them a link to my teaching about AI page."
export const AI_PAGE_URL = "https://drewi.sh/teaching/human-centered-education#drive";

// The words with nothing behind them, for a render with no browser.
export const plainWords = (over = {}) => ({
  say: (k) => (over[k] != null && String(over[k]).trim() ? over[k] : WORDS[k]),
  raw: (k) => (over[k] != null ? over[k] : WORDS[k]),
  def: (k) => WORDS[k],
  edit: () => {},
  status: "",
});
