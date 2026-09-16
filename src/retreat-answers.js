// The retreat answers, and the themes read from them.
//
// SAMPLE is true only while the answers are made up. Paste the real answers
// word for word and tag each one with its themes. Counts are
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
    themes: [],
    answers: [],
  },
  {
    id: "usage",
    question: "In 2-3 sentences, how would you describe your current usage of AI?",
    themes: [],
    answers: [],
  },
];
