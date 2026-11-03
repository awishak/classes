// The counted read of a check-in: what the room said, worked out from the
// answers with nothing sent anywhere. Andrew, 2026-11-03, on the week 4
// answers: "i need the review page for this to be better. do a qualitative
// analysis and give me summary info."
//
// Four questions (checkins.js). For each, how long the answers run and the
// words they keep using. Then the parts that answer his question: who wrote
// almost nothing, who asked for a change versus said nothing needs to change,
// what the challenges and the plans group into, and whose "going" box reads
// like a struggle. Names come back in the lists so the page can show them
// behind the private-words chip; the counts carry no names.

import { CHECKIN_QUESTIONS, answersOf } from "./checkins.js";

const STOP = new Set("the a an and or but of to in on at for with by from as is are was were be been being it its this that these those they them their there here how what when where which who why do does did done can could should would will just like than then so if not no yes more most some any all each every one two about into over very really also i you me we us he she my our your his her think thinks feel feels class classes going right now going forward rest quarter differently biggest challenge things thing way ways lot much many get gets make makes have has had been being would should could don't doesn't i'm i've it's that's there's".split(" "));
const words = (t) => String(t || "").toLowerCase().replace(/[^a-z\s'-]/g, " ").split(/\s+/).filter(w => w.length > 3 && !STOP.has(w));
const count = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

// A support answer that asks for something. An answer that opens by saying
// nothing needs to change counts as nothing unless a "but" follows; after
// that, an ask is a word that asks: more, could, examples, feedback, a
// meeting, and so on. Praise alone asks for nothing.
const NOTHING = /^(n\/?a|na|none|nothing|no\b|nope|not really|i (don'?t|do not|can'?t|cannot) think (that )?(there'?s |theres |there is |of )?anything|i (feel|am) (very |pretty )?supported|you'?re doing (a )?great|he is doing great|everything is (good|fine)|all good|keep doing what)/i;
const TURN = /\b(but|though|although|maybe|if|except|however)\b/i;
const ASK = /\b(more|could|would|should|want|wish|maybe|help|helpful|explain\w*|example\w*|feedback|hint\w*|option\w*|meet\w*|tell|heads up|give|add\w*|less|confus\w*|forget|slides|material\w*|pdf|office hours|suggestion\w*)\b/i;
const asksFor = (t) => { const s = String(t || "").trim(); if (!s) return false; if (NOTHING.test(s) && !TURN.test(s)) return false; return ASK.test(s); };

// The "going" box: words that read as a struggle, and words that read fine.
const STRUGGLE = /\b(struggl|hard|difficult|behind|lost|confus|overwhelm|disappoint|stress|trouble|tough|not great|didn't do great|catching up|survive|okay|so-so|rough)/i;
const FINE = /\b(good|great|well|enjoy|love|fun|interest|excit|smooth|favorite|engag)/i;

// What the challenges and the plans group into. A student can land in more
// than one; a student who matches none lands in "something else".
export const CHALLENGE_THEMES = [
  { id: "time", say: "Time and balance", re: /\b(time|balanc|busy|schedule|manag|juggl|commitment|workload)/i },
  { id: "classes", say: "Other classes and work", re: /\b(other class\w*|classes|midterm\w*|finals?|capstone|jobs?|pledg\w*|season|dance|major|working|balancing work|work (and|or|,|meetings|schedule|outside)|and work\b)/i },
  { id: "ideas", say: "Ideas and creativity", re: /\b(idea|creativ|brainstorm|inspir)/i },
  { id: "photos", say: "Photos and skills", re: /\b(photo|picture|camera|skill|graphic|audio|craft)/i },
  { id: "quality", say: "Doing their best work", re: /\b(best work|quality|satisf|effort|refine|polish|proud|my best)/i },
  { id: "keeping", say: "Keeping up and showing up", re: /\b(consisten|procrastinat|on time|keep up|keeping up|stay on top|stay on task|turning in|submit|attend|sleep|falling off|focus)/i },
  { id: "speaking", say: "Speaking up and asking", re: /\b(participat|speak|discussion|question|ask)/i },
  { id: "news", say: "Following sports", re: /\b(sports|espn|current events|news)/i },
  { id: "language", say: "Language", re: /\b(english|language)/i },
  { id: "none", say: "No challenge named", re: /^(none|nothing|n\/?a)\b|don't (have|know if there is)|no (significant|real) challenge/i },
];
export const PLAN_THEMES = [
  { id: "read", say: "Read more", re: /\b(read|textbook|chapter)/i },
  { id: "news", say: "Follow sports and the news", re: /\b(espn|news|current events|sports)/i },
  { id: "speak", say: "Speak up and ask questions", re: /\b(speak|participat|discussion|question|ask|office hours|talk|meet)/i },
  { id: "early", say: "Start earlier and plan", re: /\b(earlier|procrastinat|plan\w*|ahead|on time|last (second|minute)|planner|organiz\w*|routine|more time)/i },
  { id: "photos", say: "Take more photos", re: /\b(photo|picture|camera)/i },
  { id: "apply", say: "Apply the feedback and the framework", re: /\b(feedback|framing|framework|apply|comments|technique)/i },
  { id: "effort", say: "More effort and focus", re: /\b(effort|focus|energy|push|challenge myself|best work|improve|revise|double check)/i },
  { id: "risk", say: "Take more risks", re: /\b(risk|experiment|fun with|comfort zone|different styles)/i },
  { id: "same", say: "Keep doing the same", re: /^(nothing|n\/?a)\b|keep doing|not sure|keeping up well|continue doing what/i },
];

const themesOf = (themes, rows, field) => {
  const out = themes.map(t => ({ ...t, names: rows.filter(r => t.re.test(r.a[field] || "")).map(r => r.name) }));
  const matched = new Set(out.flatMap(t => t.names));
  const rest = rows.filter(r => String(r.a[field] || "").trim() && !matched.has(r.name)).map(r => r.name);
  return [...out.filter(t => t.names.length).sort((x, y) => y.names.length - x.names.length), ...(rest.length ? [{ id: "else", say: "Something else", names: rest }] : [])];
};

/** The counted read of one check-in for a roster. */
export function checkinSummary(data, asg, roster) {
  const rows = (roster || []).map(s => ({ name: s.name, section: s.section || "", a: answersOf(data, asg?.id, s.name) })).filter(r => r.a);
  const waiting = (roster || []).filter(s => !answersOf(data, asg?.id, s.name)).map(s => s.name);
  // Sections in clock order, so 8:00 comes before 10:30.
  const clock = (t) => { const m = String(t).match(/(\d+)(?::(\d+))?/); return m ? Number(m[1]) + Number(m[2] || 0) / 60 : 99; };
  const sections = [...new Set((roster || []).map(s => s.section || ""))].filter(Boolean).sort((x, y) => clock(x) - clock(y));
  const bySection = sections.map(sec => ({ section: sec, answered: rows.filter(r => r.section === sec).length, of: (roster || []).filter(s => (s.section || "") === sec).length }));

  const questions = CHECKIN_QUESTIONS.map(q => {
    const lens = rows.map(r => count(r.a[q.id])).filter(n => n > 0);
    const m = new Map();
    rows.forEach(r => new Set(words(r.a[q.id])).forEach(w => m.set(w, (m.get(w) || 0) + 1)));
    const keep = [...m.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return { id: q.id, text: q.text, avg: lens.length ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 0, written: lens.length, words: keep };
  });

  // Almost nothing: under 35 words in all, or three boxes of five words or fewer.
  const thin = rows.map(r => ({ name: r.name, total: CHECKIN_QUESTIONS.reduce((n, q) => n + count(r.a[q.id]), 0), short: CHECKIN_QUESTIONS.filter(q => count(r.a[q.id]) <= 5).length }))
    .filter(r => r.total < 35 || r.short >= 3).sort((a, b) => a.total - b.total);

  const asks = rows.filter(r => asksFor(r.a.support)).map(r => ({ name: r.name, text: String(r.a.support).trim() }));
  const nothing = rows.length - asks.length;

  const going = rows.map(r => ({ name: r.name, text: String(r.a.going || "").trim() }));
  const struggling = going.filter(g => STRUGGLE.test(g.text));
  const fine = going.filter(g => FINE.test(g.text) && !STRUGGLE.test(g.text)).length;

  return {
    answered: rows.length, of: (roster || []).length, waiting, bySection,
    questions, thin, asks, nothing, struggling, fine,
    challenges: themesOf(CHALLENGE_THEMES, rows, "challenge"),
    plans: themesOf(PLAN_THEMES, rows, "differently"),
  };
}

/** The answers with no names, one block a student, for Claude's read. */
export function checkinLines(data, asg, roster) {
  return (roster || []).map(s => answersOf(data, asg?.id, s.name)).filter(Boolean)
    .map(a => CHECKIN_QUESTIONS.map(q => q.text + "\n" + String(a[q.id] || "").trim()).join("\n"));
}
