// The question sheet.
//
// Andrew, 2026-09-20: "i almost want like an anonymous question sheet that
// students can access from the front page. there, they can see questions
// people have asked, along with my answers."
//
// It reads the store the ask page already writes, so a question typed in the
// room and a question typed on the front page land in one place and either
// can be answered later. Writing the answer is what publishes it: a student
// sees the answered ones and their own, and no names anywhere.
//
// Asking is anonymous to the class either way. The box for his eyes says so:
// he sees who asked unless the student ticks it, which is the rule the ask
// page has always used.

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

export const answeredOf = (items) => (items || [])
  .filter(q => q.state === "answered" && String(q.answer || "").trim())
  .sort((a, b) => (b.answeredAt || b.at || 0) - (a.answeredAt || a.at || 0));

// A question of your own that he has not answered yet: yours to see, so you
// know it arrived and do not ask it twice.
const mineWaiting = (items, name) => (items || [])
  .filter(q => q.state !== "trashed" && !String(q.answer || "").trim() && q.who && q.who === name)
  .sort((a, b) => (b.at || 0) - (a.at || 0));

const when = (ts) => { try { return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return ""; } };

const field = {
  width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG,
  fontFamily: F, fontSize: 16, minHeight: TAP, background: "var(--surface-card)", color: TEXT_PRIMARY, lineHeight: 1.5,
};

function QA({ q, showWho }) {
  return (
    <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: TEXT_PRIMARY, whiteSpace: "pre-wrap" }}>{q.text}</div>
      <div style={{ ...label, marginTop: 4 }}>{[showWho ? (q.anon ? "Anonymous" : q.who || "Anonymous") : "", when(q.answeredAt || q.at)].filter(Boolean).join(" · ")}</div>
      {String(q.answer || "").trim() ? (
        <div style={{ marginTop: 8, borderLeft: "3px solid var(--ca-accent, " + BORDER_STRONG + ")", paddingLeft: 12,
          fontSize: 16, lineHeight: 1.55, color: TEXT_SECONDARY, whiteSpace: "pre-wrap" }}>{q.answer}</div>
      ) : <Muted>Waiting on an answer.</Muted>}
    </div>
  );
}

// ─── the tile ───
export function QuestionsSummary({ config, role, asStudent }) {
  const { items } = useQuestions(config.storageKey);
  if (items === null) return <Muted>Loading.</Muted>;
  const answered = answeredOf(items);
  if (role === "instructor") {
    const waiting = (items || []).filter(q => q.state === "open" && !String(q.answer || "").trim()).length;
    return waiting
      ? <div><div style={{ fontSize: 22, fontWeight: 700, color: config.accent }}>{waiting}</div><Muted>waiting on an answer</Muted></div>
      : <Muted>{answered.length} answered for the class.</Muted>;
  }
  const mine = mineWaiting(items, asStudent).length;
  if (!answered.length) return <Muted>{mine ? "Your question is in. Nothing answered yet." : "Ask anything about the class."}</Muted>;
  return (
    <div>
      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{answered[0].text}</div>
      <Muted>{answered.length} answered question{answered.length === 1 ? "" : "s"}</Muted>
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

function StudentQuestions({ config, api, name }) {
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [sent, setSent] = useState(false);
  const answered = answeredOf(api.items);
  const waiting = mineWaiting(api.items, name);
  const ask = () => {
    if (!text.trim()) return;
    api.add({ text: text.trim(), who: anon ? "" : name || "", anon });
    setText(""); setSent(true);
  };
  return (
    <div>
      <div style={h2}>Questions</div>
      <Muted>Questions from the class, with Dr. Ishak's answers. No names, ever.</Muted>

      <div style={{ marginTop: 18 }}>
        <div style={label}>Ask a question</div>
        <div style={{ marginTop: 8 }}>
          <textarea value={text} onChange={e => { setText(e.target.value); setSent(false); }} rows={3}
            placeholder="Anything about the class, the readings or a challenge."
            style={{ ...field, resize: "vertical" }} />
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="ca-focus" onClick={ask} disabled={!text.trim()}
            style={{ minHeight: TAP, padding: "0 18px", borderRadius: 999, border: "none", cursor: text.trim() ? "pointer" : "default",
              background: "var(--ca-accent, " + config.accent + ")", color: "#fff", fontFamily: F, fontSize: 16, fontWeight: 600,
              opacity: text.trim() ? 1 : .5 }}>Ask</button>
          <label style={{ fontSize: 15, color: TEXT_SECONDARY, display: "inline-flex", alignItems: "center", gap: 8, minHeight: TAP }}>
            <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} />
            Hide my name from Dr. Ishak too
          </label>
        </div>
        {sent ? <Muted>Asked. It turns up here once it is answered.</Muted> : null}
      </div>

      {waiting.length ? (
        <div style={{ marginTop: 22 }}>
          <div style={label}>Yours, waiting</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {waiting.map(q => <QA key={q.id} q={q} />)}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 22 }}>
        <div style={label}>Answered</div>
        {answered.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {answered.map(q => <QA key={q.id} q={q} />)}
          </div>
        ) : <Muted>Nothing answered yet.</Muted>}
      </div>
    </div>
  );
}

function InstructorQuestions({ config, api }) {
  const open = (api.items || []).filter(q => q.state !== "trashed" && !String(q.answer || "").trim())
    .sort((a, b) => (b.at || 0) - (a.at || 0));
  const answered = answeredOf(api.items);
  return (
    <div>
      <div style={h2}>Questions</div>
      <Muted>Asked on the front page and in the room. An answer puts the question on the class's sheet.</Muted>

      <div style={{ marginTop: 18 }}>
        <div style={label}>Waiting</div>
        {open.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {open.map(q => <Answering key={q.id} q={q} accent={config.accent} onSave={(t) => api.answer(q.id, t)} onTrash={() => api.setState(q.id, "trashed")} />)}
          </div>
        ) : <Muted>Nothing waiting.</Muted>}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={label}>On the sheet</div>
        {answered.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {answered.map(q => <Answering key={q.id} q={q} accent={config.accent} onSave={(t) => api.answer(q.id, t)} onTrash={() => api.setState(q.id, "trashed")} />)}
          </div>
        ) : <Muted>Nothing on the sheet yet.</Muted>}
      </div>
    </div>
  );
}

// One question, with the box the answer goes in. It saves when he leaves it,
// like every other box in here, so there is no Save to forget.
function Answering({ q, accent, onSave, onTrash }) {
  const [draft, setDraft] = useState(q.answer || "");
  return (
    <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{q.text}</div>
      <div style={{ ...label, marginTop: 4 }}>{(q.anon ? "Anonymous" : q.who || "Anonymous") + " · " + when(q.at)}</div>
      <textarea value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => onSave(draft)} rows={2}
        placeholder="Answer, for the whole class to read"
        style={{ ...field, marginTop: 8, resize: "vertical" }} />
      <div style={{ marginTop: 6, display: "flex", gap: 14, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: TEXT_MUTED }}>{String(q.answer || "").trim() ? "On the sheet" : "Not on the sheet yet"}</span>
        <button className="ca-focus" onClick={onTrash}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 14, fontWeight: 600, color: TEXT_MUTED, minHeight: TAP }}>
          Take it off
        </button>
      </div>
    </div>
  );
}
