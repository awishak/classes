// The retreat answers, and the themes read from them.
//
// SAMPLE is true only while the answers are made up. Paste the real answers
// word for word and tag each one with its themes. An answer with no
// tags counts toward the total and sits under no theme. Counts are
// never typed here: RetreatPage counts the tags, so a count cannot drift from
// the answers.
//
// A theme's quote names an answer and a stretch of its text. The page refuses
// to render if that answer is not tagged with the theme or the text is not in
// the answer exactly, so a quote cannot be paraphrased by accident.
//
// This lives in a .js file on purpose. The voice check reads string fallbacks
// in .jsx files, and these are other people's words, not copy to correct.

export const SAMPLE = false;

export const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeT3FuVe-0gwvHoK8iBOZiE7LP2BPu3urCW7nQq1FXswcSnzw/viewform?usp=publish-editor";

export const QUESTIONS = [
  {
    id: "students",
    question: "In 2-3 sentences, what is your estimate of how your students are using AI for class?",
    themes: [
      { id: "assign", label: "Completing assignments", quote: { answer: 6, text: "They are using it for all written assignments including in-class work" } },
      { id: "research", label: "Research and sources", quote: { answer: 14, text: "Most use it per guidelines for initial fact-finding to be verified later." } },
      { id: "brainstorm", label: "Brainstorming and outlining", quote: { answer: 1, text: "To generate story ideas, direct research, and polish their writing." } },
      { id: "editing", label: "Editing and proofreading", quote: { answer: 7, text: "Generating text, expanding text, editing text." } },
    ],
    answers: [
      { text: "They search for the answers to their weekly quizzes.", tags: ["assign"] },
      { text: "To generate story ideas, direct research, and polish their writing.", tags: ["research",  "brainstorm",  "editing"] },
      { text: "Maybe some post production tools", tags: [] },
      { text: "They are all using it for all aspects of the course, including assignments, editing, managing course notes, and synthesizing readings", tags: ["assign",  "editing"] },
      { text: "More in discussion posts or they try to, less in essays , longer assignments because of class conversations on policy and penalties", tags: ["assign"] },
      { text: "Bibliography research, study help, writing,  brainstorming ideas", tags: ["assign",  "research",  "brainstorm"] },
      { text: "They are using it for all written assignments including in-class work", tags: ["assign"] },
      { text: "Generating text, expanding text, editing text. Also brainstorming topics.", tags: ["assign",  "brainstorm",  "editing"] },
      { text: "I had an informal non punitive discussion about this and was impressed with how they used it not to outsource creativity but to cross check their work.", tags: [] },
      { text: "To proofread, brainstorm ideas, search for sources, and sometimes to write while assignments.", tags: ["assign",  "research",  "brainstorm",  "editing"] },
      { text: "Preliminary research, learning about a topic, outlining, slide/image generation", tags: ["research",  "brainstorm"] },
      { text: "Finding sources, responding to assignment prompts.", tags: ["assign",  "research"] },
      { text: "Students are using AI to find \"sources,\" create entire outlines (even though a template is given), for citing, summarize texts, and often complete entire assignments for them.", tags: ["assign",  "research",  "brainstorm"] },
      { text: "I assume that any assignment I accept in digital format is going to be at risk of AI-supported work. So, rather than fighting against the reality, I try to incorporate active learning opportunities in class that alleviate the lack of effort students might put in elsewhere while still affording them opportunities to leverage these tools.", tags: ["assign"] },
      { text: "Most use it per guidelines for initial fact-finding to be verified later. A few use it unethically as substitute for their own research and writing/rewriting.", tags: ["assign",  "research"] },
      { text: "Because I teach film production classes, it is used less frequently. Maybe 10-20% for pre-production materials.", tags: [] },
    ],
  },
  {
    id: "usage",
    question: "In 2-3 sentences, how would you describe your current usage of AI?",
    themes: [
      { id: "research", label: "Research and searching", quote: { answer: 14, text: "Initial check of facts, research, or citation, which I then check from original sources." } },
      { id: "organizing", label: "Organizing and formatting", quote: { answer: 8, text: "I use chat gpt for organization more than anything else." } },
      { id: "course", label: "Course materials", quote: { answer: 13, text: "I use it in development and delivery of course materials." } },
      { id: "minimal", label: "Minimal", quote: { answer: 0, text: "Minimal, or my use of AI is forced on me by the tech companies.." } },
    ],
    answers: [
      { text: "Minimal, or my use of AI is forced on me by the tech companies..", tags: ["minimal"] },
      { text: "Organize schedule and tasks. Direct and plot research. Create notes and slides for class. I would like to be using it better for efficiency.", tags: ["research",  "organizing",  "course"] },
      { text: "Tools that fix sound issues, general searches, language translation, re-organizing documents, storyboards", tags: ["research",  "organizing"] },
      { text: "I use Claude for some tasks including proofreading, outlining, formatting, and some statistical analysis", tags: ["organizing"] },
      { text: "Use it for info seeking", tags: ["research"] },
      { text: "Bibliography research, crafting study questions, drafting study helps", tags: ["research",  "course"] },
      { text: "I use it as little as possible. I have used it productively to write first drafts of multiple choice quiz questions and to provide me a few examples (that I modified/edited) for specific scenarios regarding entrepreneurship for a study I am doing.", tags: ["course",  "minimal"] },
      { text: "I use chat GPT for information of different kinds.", tags: ["research"] },
      { text: "I use chat gpt for organization more than anything else. Or as a search engine with tailored prompts when Google won't suffice.", tags: ["research",  "organizing"] },
      { text: "To summarize research in a topic, search for academic sources and news examples.", tags: ["research"] },
      { text: "Preliminary research/summaries about topics, assistance with framing in specific terms,", tags: ["research"] },
      { text: "I use the Google Gemini API to interact with my notes.", tags: ["organizing"] },
      { text: "My current usage is minimal. If I use it it is to see what type of answer and AI model would give for an assignment.", tags: ["minimal"] },
      { text: "I use it in development and delivery of course materials.", tags: ["course"] },
      { text: "Initial check of facts, research, or citation, which I then check from original sources.", tags: ["research"] },
      { text: "I use it accidentally when researching on the web.", tags: ["research",  "minimal"] },
    ],
  },
];
