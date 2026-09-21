// The class's questions.
//
// Andrew, 2026-09-20, with the whole shape of it: "here's how it works. first
// of all, keep it simple. Questions / ask questions here. previously answered
// questions are below. / dialog box, submit / sort by: recently answered,
// recently asked, most appreciated / then you have all the questions here."
//
// And his half: "on my side, as the instructor, i choose whether to answer a
// question, leave it alone, or archive it. but students see the questions, so
// they can say if they appreciate the question. when i answer, it appears
// live."
//
// So: every question is on the page the moment it is asked, an answer is on
// it the moment it is written, and archiving is the one thing that takes a
// question off. Publishing was a press between him and the class that only
// ever made the page later than it needed to be.
//
// "if a student is okay not being anonymous, it says asked by Pepe LeFritz in
// italics below the question. When i answer, it says Dr. Ishak:" and "the two
// appreciation buttons are right after, in the same line, of the question and
// the answer."

import { useState } from "react";
import * as TOKENS from "./tokens.js";
import { useQuestions } from "./questions.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const TAP = TOKENS.TAP;

const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };
const Muted = ({ children }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5 }}>{children}</div>;

const words = (s) => String(s || "").trim();
export const isAnswered = (q) => !!words(q?.answer);

// On the page: everything asked and not archived. A question counts from the
// moment it is asked, answered or not, because a class that can see what has
// been asked is a class that does not ask it twice.
export const onThePage = (items) => (items || [])
  .filter(q => q.state !== "archived" && q.state !== "trashed");

export const archivedOf = (items) => (items || []).filter(q => q.state === "archived");

// Who asked, as the class sees it. A student who does not tick the box is
// named, which is the point of the box.
export const askedBy = (q) => (q?.anon ? "" : words(q?.who));

const thanksCount = (q) => (q?.thanksQ || []).length + (q?.thanksA || []).length;

// The three ways to read the page. Andrew: "sort by: recently answered /
// recently asked / most appreciated."
export const SORTS = [
  ["answered", "Recently answered"],
  ["asked", "Recently asked"],
  ["thanked", "Most appreciated"],
];

export function sortQuestions(items, how) {
  const rows = [...(items || [])];
  if (how === "asked") return rows.sort((a, b) => (b.at || 0) - (a.at || 0));
  if (how === "thanked") return rows.sort((a, b) => thanksCount(b) - thanksCount(a) || (b.at || 0) - (a.at || 0));
  // Recently answered, and the unanswered ones after them rather than nowhere:
  // a question waiting for an answer is the one a student most wants to see is
  // already asked.
  return rows.sort((a, b) => {
    const ans = (isAnswered(b) ? 1 : 0) - (isAnswered(a) ? 1 : 0);
    if (ans) return ans;
    return (b.answeredAt || b.at || 0) - (a.answeredAt || a.at || 0);
  });
}

const when = (ts) => { try { return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return ""; } };

const field = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG,
  fontFamily: F, fontSize: 16, background: "var(--surface-card)", color: TEXT_PRIMARY, lineHeight: 1.5,
};

const ThumbsUp = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 10.5V20H4.6A1.6 1.6 0 0 1 3 18.4v-6.3A1.6 1.6 0 0 1 4.6 10.5H7z" />
    <path d="M7 10.5l4.2-7.1a1.3 1.3 0 0 1 2.4.7V9h4.7a2 2 0 0 1 2 2.5l-1.6 6.6A2.4 2.4 0 0 1 16.4 20H7" />
  </svg>
);

// Thanks, on the same line as the thing it is about. One press per person,
// pressing again takes it back, and only the count is ever shown.
export function Thanks({ names, mine, onPress, what }) {
  const n = (names || []).length;
  const on = !!mine && (names || []).includes(mine);
  return (
    <button className="ca-focus" onClick={onPress ? () => onPress() : undefined} disabled={!onPress}
      aria-pressed={on} aria-label={"Appreciate the " + what}
      title={onPress ? (on ? "Take your thanks back" : "Appreciate the " + what) : n + " appreciated the " + what}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, verticalAlign: "middle", marginLeft: 8,
        minHeight: 26, padding: "0 8px", borderRadius: 999,
        border: "1px solid " + (on ? "transparent" : BORDER_STRONG),
        background: on ? "var(--ca-accent, #e5e5e5)" : "none", color: on ? "#fff" : TEXT_MUTED,
        fontFamily: F, fontSize: 13, fontWeight: 600, cursor: onPress ? "pointer" : "default" }}>
      <ThumbsUp />{n ? <span>{n}</span> : null}
    </button>
  );
}

// One question: the words in bold with its thanks beside them, who asked in
// italics under it, and the answer under that with Dr. Ishak's name in front
// and its own thanks on the same line.
export function QuestionEntry({ q, me, who, onThank, answering }) {
  const asked = askedBy(q);
  return (
    <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: TEXT_PRIMARY, whiteSpace: "pre-wrap" }}>
        {q.text}
        <Thanks names={q.thanksQ} mine={me} what="question" onPress={onThank ? () => onThank(q.id, "question") : null} />
      </div>
      <div style={{ fontSize: 14, fontStyle: "italic", color: TEXT_MUTED }}>
        {asked ? "asked by " + asked + " on " + when(q.at) : "asked on " + when(q.at)}
      </div>
      {isAnswered(q) ? (
        <div style={{ fontSize: 16, lineHeight: 1.55, color: TEXT_PRIMARY, whiteSpace: "pre-wrap", marginTop: 4 }}>
          <b style={{ fontWeight: 600 }}>{who}:</b> {q.answer}
          <Thanks names={q.thanksA} mine={me} what="answer" onPress={onThank ? () => onThank(q.id, "answer") : null} />
        </div>
      ) : answering ? null : (
        <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 2 }}>Not answered yet.</div>
      )}
      {answering}
    </div>
  );
}

// ─── the tile ───
export function QuestionsSummary({ config, role, asStudent }) {
  const { items } = useQuestions(config.storageKey);
  if (items === null) return <Muted>Loading.</Muted>;
  const page = onThePage(items);
  const answered = page.filter(isAnswered);
  if (role === "instructor") {
    const waiting = page.length - answered.length;
    return waiting
      ? <div><div style={{ fontSize: 22, fontWeight: 700, color: config.accent }}>{waiting}</div><Muted>to answer</Muted></div>
      : <Muted>{answered.length} answered for the class.</Muted>;
  }
  if (!page.length) return <Muted>Ask a question about anything in the class.</Muted>;
  const top = sortQuestions(page, "answered")[0];
  return (
    <div>
      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{top.text}</div>
      <Muted>{answered.length} answered · {page.length} asked</Muted>
    </div>
  );
}

// ─── the page ───
export function QuestionsDetail({ config, role, asStudent }) {
  const api = useQuestions(config.storageKey);
  if (api.items === null) return <Muted>Loading.</Muted>;
  return role === "instructor"
    ? <InstructorQuestions config={config} api={api} />
    : <StudentQuestions config={config} api={api} name={asStudent} />;
}

const instructorName = (config) => words(config?.instructor?.name) || "Your instructor";

function StudentQuestions({ config, api, name }) {
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [sent, setSent] = useState(false);
  const [how, setHow] = useState("answered");
  const page = sortQuestions(onThePage(api.items), how);
  const ask = () => {
    if (!text.trim()) return;
    api.add({ text: text.trim(), who: name || "", anon });
    setText(""); setSent(true);
  };
  return (
    <div>
      <div style={h2}>Questions</div>
      <Muted>Ask questions here. Previously answered questions are below.</Muted>

      <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <textarea value={text} onChange={e => { setText(e.target.value); setSent(false); }} rows={2}
          placeholder="Ask your question here"
          style={{ ...field, minHeight: 58, resize: "vertical", flex: 1 }} />
        <button className="ca-focus" onClick={ask} disabled={!text.trim()}
          style={{ flex: "none", minHeight: 44, padding: "0 18px", borderRadius: 10, border: "none",
            cursor: text.trim() ? "pointer" : "default", background: "var(--ca-accent, " + config.accent + ")",
            color: "#fff", fontFamily: F, fontSize: 16, fontWeight: 600, opacity: text.trim() ? 1 : .5 }}>Submit</button>
      </div>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ fontSize: 15, color: TEXT_SECONDARY, display: "inline-flex", alignItems: "center", gap: 8, minHeight: TAP }}>
          <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ width: 18, height: 18 }} />
          Ask this anonymously
        </label>
        {sent ? <span style={{ fontSize: 14, color: TEXT_MUTED }}>Asked. It is on the page below.</span> : null}
      </div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={label}>Sort by</span>
        {SORTS.map(([id, say]) => (
          <button key={id} className="ca-focus" onClick={() => setHow(id)} aria-pressed={how === id}
            style={{ minHeight: 30, padding: "0 10px", borderRadius: 999, cursor: "pointer",
              border: "1px solid " + (how === id ? "transparent" : BORDER_STRONG),
              background: how === id ? "var(--ca-accent, #e5e5e5)" : "none",
              color: how === id ? "#fff" : TEXT_SECONDARY, fontFamily: F, fontSize: 13, fontWeight: 600 }}>{say}</button>
        ))}
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        {page.length
          ? page.map(q => (
            <QuestionEntry key={q.id} q={q} me={name} who={instructorName(config)}
              onThank={(id, part) => api.appreciate(id, part, name)} />
          ))
          : <Muted>Nothing asked yet.</Muted>}
      </div>
    </div>
  );
}

// His side is the student's side, with an answer box on each question and the
// one press that takes one off. Andrew, 2026-09-20: "make my UI as the
// instructor similar to what students see. the difference being that i can
// answer questions and archive them too."
function InstructorQuestions({ config, api }) {
  const [showArchive, setShowArchive] = useState(false);
  const [how, setHow] = useState("asked");
  const page = sortQuestions(onThePage(api.items), how);
  const archived = archivedOf(api.items);
  const waiting = page.filter(q => !isAnswered(q)).length;
  const me = instructorName(config);
  return (
    <div>
      <div style={h2}>Questions</div>
      <Muted>
        The class reads this page at {config.path}/questions. Answer one and they have it straight away; leave one
        alone and it sits there asked; archive one and it comes off the page.
      </Muted>
      {waiting ? <Muted>{waiting} waiting on an answer.</Muted> : null}

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={label}>Sort by</span>
        {SORTS.map(([id, say]) => (
          <button key={id} className="ca-focus" onClick={() => setHow(id)} aria-pressed={how === id}
            style={{ minHeight: 30, padding: "0 10px", borderRadius: 999, cursor: "pointer",
              border: "1px solid " + (how === id ? "transparent" : BORDER_STRONG),
              background: how === id ? "var(--ca-accent, #e5e5e5)" : "none",
              color: how === id ? "#fff" : TEXT_SECONDARY, fontFamily: F, fontSize: 13, fontWeight: 600 }}>{say}</button>
        ))}
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        {page.length
          ? page.map(q => (
            <QuestionEntry key={q.id} q={q} me={me} who={me}
              onThank={(id, part) => api.appreciate(id, part, me)}
              answering={<Answering q={q} config={config} api={api} />} />
          ))
          : <Muted>Nothing asked yet.</Muted>}
      </div>

      {archived.length ? (
        <div style={{ marginTop: 24 }}>
          <button className="ca-focus" onClick={() => setShowArchive(v => !v)} aria-expanded={showArchive}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F,
              fontSize: 15, fontWeight: 600, color: config.accent, minHeight: TAP }}>
            {showArchive ? "Hide the archive" : "Archive (" + archived.length + ")"}
          </button>
          {showArchive ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {archived.map(q => (
                <div key={q.id} style={{ borderTop: "1px solid " + BORDER, paddingTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: TEXT_SECONDARY, whiteSpace: "pre-wrap" }}>{q.text}</span>
                  <button className="ca-focus" onClick={() => api.unarchive(q.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 14, fontWeight: 600, color: config.accent, minHeight: TAP }}>
                    Put it back
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// The answer box, under the question, and the one press that takes a question
// off the page. The box saves when he leaves it, which is when the class gets
// what is in it.
function Answering({ q, config, api }) {
  const [draft, setDraft] = useState(q.answer || "");
  const answered = isAnswered(q);
  return (
    <div style={{ marginTop: 8 }}>
      <textarea value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => api.answer(q.id, draft)} rows={2}
        placeholder={answered ? "" : "Answer as " + instructorName(config) + ", and the class reads it straight away"}
        style={{ ...field, resize: "vertical" }} />
      <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: answered ? TOKENS.STATE.ok : TEXT_MUTED }}>
          {answered ? "The class has this answer" : "Asked, and waiting on you"}
        </span>
        <button className="ca-focus" onClick={() => api.archive(q.id)}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
            fontFamily: F, fontSize: 13, fontWeight: 600, color: TEXT_MUTED, minHeight: 30 }}>
          Archive
        </button>
      </div>
    </div>
  );
}
