// The retreat answers, and the themes read from them.
//
// SAMPLE is true while these are made up for the mockup. Swap in the real
// answers word for word, retag each one, and set SAMPLE to false. Counts are
// never typed here: RetreatPage counts the tags, so a count cannot drift from
// the answers.
//
// A theme's quote names an answer and a stretch of its text. The page refuses
// to render if that answer is not tagged with the theme or the text is not in
// the answer exactly, so a quote cannot be paraphrased by accident.
//
// This lives in a .js file on purpose. The voice check reads string fallbacks
// in .jsx files, and these are other people's words, not copy to correct.

export const SAMPLE = true;

export const QUESTIONS = [
  {
    id: "students",
    question: "In 2-3 sentences, what is your estimate of how your students are using AI for class?",
    themes: [
      { id: "tutor", label: "Study partner", quote: { answer: 10, text: "They treat it like a tutor that's always awake." } },
      { id: "start", label: "Getting started and polishing", quote: { answer: 11, text: "I think they use it to start and then get stuck with its ideas." } },
      { id: "doing", label: "Doing the work for them", quote: { answer: 3, text: "You can see it when ten posts use the same three words." } },
      { id: "unsure", label: "Hard to tell", quote: { answer: 6, text: "Nobody mentions it unless I ask, and when I ask, almost everyone says yes." } },
    ],
    answers: [
      { text: "I think most of them use it to get started on papers. They ask for topic ideas or an outline, then write on their own. A few probably go further than that.", tags: ["start", "doing"] },
      { text: "Mostly as a study partner. They paste in a reading they don't understand and ask for a simpler explanation. I've had students tell me this openly.", tags: ["tutor"] },
      { text: "Honestly, I can't tell anymore. The writing is cleaner than it used to be, but I have no way of knowing who used what.", tags: ["unsure"] },
      { text: "Some are having it write whole discussion posts. You can see it when ten posts use the same three words. Others seem to avoid it completely.", tags: ["doing"] },
      { text: "Grammar and polishing, mostly. My multilingual students especially run their drafts through it before turning them in.", tags: ["start"] },
      { text: "They use it to make flashcards and practice questions before exams. That seems pretty healthy to me.", tags: ["tutor"] },
      { text: "I suspect more than I realize. Nobody mentions it unless I ask, and when I ask, almost everyone says yes.", tags: ["unsure"] },
      { text: "Brainstorming, summarizing articles, and fixing citations. Probably some full drafts in the week before finals.", tags: ["start", "tutor", "doing"] },
      { text: "My guess is a lot of them use it to skip the reading. They get a summary and come to class with the general idea but none of the details.", tags: ["tutor", "doing"] },
      { text: "I really don't know. I've never asked, and I'm not sure they'd tell me the truth if I did.", tags: ["unsure"] },
      { text: "They treat it like a tutor that's always awake. Late at night they ask it to explain problems step by step.", tags: ["tutor"] },
      { text: "I think they use it to start and then get stuck with its ideas. The papers all make the same argument now.", tags: ["start"] },
      { text: "Some use it to answer the quiz questions in online sections. It's hard to stop without proctoring.", tags: ["doing"] },
      { text: "Mostly outlines and topic ideas. A few use it to check whether their argument makes sense.", tags: ["start", "tutor"] },
      { text: "Hard to estimate. Some students are enthusiastic, some think it's cheating to even open it, and most are somewhere in between.", tags: ["unsure"] },
      { text: "They use it to rewrite their sentences so they sound more academic. The result often sounds less like them.", tags: ["start"] },
      { text: "I'd guess the majority use it to summarize readings and a smaller group has it write for them. The second group worries me more.", tags: ["tutor", "doing"] },
      { text: "Probably for everything, quietly. They don't know where the line is and neither do we.", tags: ["unsure", "doing"] },
      { text: "Brainstorming mostly. When I've seen their chat histories, it's lots of back and forth on ideas.", tags: ["start"] },
      { text: "They ask it to explain concepts from lecture in different words. That seems like a good use.", tags: ["tutor"] },
    ],
  },
  {
    id: "usage",
    question: "In 2-3 sentences, how would you describe your current usage of AI?",
    themes: [
      { id: "admin", label: "Everyday work tasks", quote: { answer: 16, text: "Rewording an email, checking a formula, outlining a talk." } },
      { id: "teaching", label: "Building course materials", quote: { answer: 11, text: "It's become part of how I prep each week." } },
      { id: "trying", label: "Testing it out", quote: { answer: 7, text: "I'll ask it something when I'm stuck, but I don't have a routine." } },
      { id: "little", label: "Rarely or never", quote: { answer: 9, text: "I'd need someone to show me where it fits before I spend time on it." } },
    ],
    answers: [
      { text: "I use it almost daily for email drafts and meeting notes. I haven't brought it into my teaching yet.", tags: ["admin"] },
      { text: "I've used it to build rubrics and rewrite assignment prompts. It saves time, but I always edit what it gives me.", tags: ["teaching"] },
      { text: "Very little. I tried it once last year and didn't find it useful.", tags: ["little"] },
      { text: "I experiment with it now and then, mostly out of curiosity. I ask it the same questions my students might and see what comes back.", tags: ["trying"] },
      { text: "I don't use it, on purpose. I have real concerns about accuracy and the environmental cost.", tags: ["little"] },
      { text: "Weekly, for summarizing research articles before I read them closely. I also use it to draft letters of recommendation.", tags: ["admin"] },
      { text: "I've made practice quizzes and discussion questions with it. The first versions are rough, but they get me started.", tags: ["teaching"] },
      { text: "Occasionally. I'll ask it something when I'm stuck, but I don't have a routine.", tags: ["trying"] },
      { text: "Pretty heavily. Emails, agendas, reports, and I've started using it for lecture slides.", tags: ["admin", "teaching"] },
      { text: "Not at all right now. I'd need someone to show me where it fits before I spend time on it.", tags: ["little"] },
      { text: "I've been testing it to understand what students are doing. I don't use it for my own work.", tags: ["trying"] },
      { text: "I use it to generate case studies and example problems for class. It's become part of how I prep each week.", tags: ["teaching"] },
      { text: "Mostly for admin work, like cleaning up committee documents. It's a big time saver there.", tags: ["admin"] },
      { text: "I dabble. I've tried a few tools but haven't settled on anything.", tags: ["trying"] },
      { text: "Rarely. I opened it a few times and felt it gave confident answers that were wrong.", tags: ["little"] },
      { text: "I use it to plan my classes and write feedback templates. I'm more comfortable with it than I expected to be.", tags: ["teaching"] },
      { text: "Every day for something small. Rewording an email, checking a formula, outlining a talk.", tags: ["admin"] },
      { text: "I'm just starting. I took a workshop this summer and I'm trying one thing a week.", tags: ["trying"] },
      { text: "I use it for research and for building assignments that ask students to critique AI output.", tags: ["admin", "teaching"] },
      { text: "Never for teaching. I sometimes use it to plan trips, but that's all.", tags: ["little"] },
    ],
  },
];
