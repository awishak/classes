// Questions, in the row language. A question is one compact row with the
// words, who asked in italics, the thumb with its count, and See answer,
// which folds the answer open under it on Dr. Ishak's side. On his page the
// button says Answer and opens the box.
//
// The store and its rules are questions.js: a question is on the page the
// moment it is asked, an answer the moment it is written.

import { useState } from "react";
import { useQuestions } from "../questions.js";
import { onThePage, isAnswered, sortQuestions, askedBy, SORTS } from "../QuestionsCard.jsx";
import { Sec, Chip, Btn, Io, DrFace, Badge, I } from "./bits.jsx";
import { hideLurkers } from "../sections.js";

const when = (ts) => { try { return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); } catch { return ""; } };
const drName = (config) => String(config?.instructor?.name || "").trim() || "Your instructor";

function Thumb({ names, mine, onPress, what }) {
  const n = (names || []).length;
  const on = !!mine && (names || []).includes(mine);
  return (
    <button type="button" className={"pt-io pt-focus" + (on ? " go" : "")} onClick={onPress} aria-pressed={on}
      aria-label={"Appreciate the " + what} style={{ minHeight: 28, padding: "0 8px", gap: 4, fontSize: 13 }}>
      {I.thumb(14)}{n ? <span style={{ fontFamily: "var(--font-label)" }}>{n}</span> : null}
    </button>
  );
}

export function QuestionRows({ config, q, me, profiles, api, instructor, open, onToggle }) {
  const asked = askedBy(q, profiles);
  const answered = isAnswered(q);
  const btn = answered
    ? <Io kind={open ? "" : "go"} onClick={onToggle} label={(open ? "Hide" : "See") + " the answer"}>{open ? "Hide answer" : "See answer"}</Io>
    : instructor ? <Io kind="go" onClick={onToggle}>Answer</Io> : null;
  return (
    <>
      <div className="pt-row me" style={{ padding: "12px 14px" }}>
        <div className="pt-main">
          <p className="pt-text" style={{ fontSize: 16 }}>{q.text}</p>
          <p className="pt-meta" style={{ gap: 8 }}>
            <span style={{ fontStyle: "italic", fontFamily: "var(--pt-serif)" }}>{asked ? "asked by " + asked : "asked anonymously"}</span>
            <span>{when(q.at)}</span>
          </p>
          <div className="pt-acts">{btn}<Thumb names={q.thanksQ} mine={me} what="question" onPress={() => api.appreciate(q.id, "question", me)} /></div>
        </div>
      </div>
      {open && answered ? (
        <div className="pt-row dr right" style={{ padding: "12px 14px" }}>
          <div className="pt-dcol"><DrFace config={config} /></div>
          <div className="pt-main">
            <p className="pt-text" style={{ fontSize: 16 }}><b>{drName(config)}:</b> {q.answer}</p>
            <p className="pt-meta" style={{ gap: 8 }}><span>{when(q.answeredAt || q.at)}</span><Thumb names={q.thanksA} mine={me} what="answer" onPress={() => api.appreciate(q.id, "answer", me)} /></p>
            {instructor ? <div className="pt-acts"><Io onClick={onToggle}>Edit answer</Io><Io onClick={() => api.archive(q.id)}>Archive</Io></div> : null}
          </div>
        </div>
      ) : null}
      {open && instructor && !answered ? <AnswerBox config={config} q={q} api={api} onDone={onToggle} /> : null}
    </>
  );
}

// His answer box, under a question. Nothing reaches the class until Save answer.
function AnswerBox({ config, q, api, onDone }) {
  const [draft, setDraft] = useState(q.answer || "");
  const save = () => { if (!draft.trim()) return; api.answer(q.id, draft); onDone(); };
  return (
    <div className="pt-row dr right" style={{ padding: "12px 14px" }}>
      <div className="pt-dcol"><DrFace config={config} /></div>
      <div className="pt-main">
        <textarea className="pt-field pt-focus" value={draft} onChange={e => setDraft(e.target.value)} rows={3} autoFocus
          placeholder={"Answer as " + drName(config)} aria-label="Answer" />
        <div className="pt-acts"><Btn onClick={save} disabled={!draft.trim()}>Save answer</Btn><Io onClick={onDone}>Cancel</Io><Io onClick={() => api.archive(q.id)}>Archive</Io></div>
      </div>
    </div>
  );
}

export function AskBox({ api, name }) {
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const ask = () => { if (!text.trim()) return; api.add({ text: text.trim(), who: name || "", anon }); setText(""); };
  return (
    <div className="pt-stack">
      <div style={{ display: "flex", gap: 8 }}>
        <input className="pt-field pt-focus" style={{ flex: 1 }} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); ask(); } }} placeholder="Ask a question" aria-label="Ask a question" />
        <Btn onClick={ask} disabled={!text.trim()}>Ask</Btn>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, fontSize: 15, padding: "0 4px" }}>
        <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--ca-accent)" }} />
        Ask this anonymously
      </label>
    </div>
  );
}

// The section under My work on the home: the box, and the latest answered
// question folded. The title opens the page.
export function QuestionsSection({ config, name, profiles, instructor, go, limit = 1 }) {
  const api = useQuestions(config.storageKey);
  const [open, setOpen] = useState(null);
  // Drawn while the questions are still on their way, so the box to ask is
  // on the page from the first frame.
  const page = instructor ? onThePage(api.items || []) : hideLurkers(onThePage(api.items || []), name);
  const shown = instructor ? sortQuestions(page, "asked").slice(0, 3) : sortQuestions(page.filter(isAnswered), "answered").slice(0, limit);
  const waiting = page.filter(q => !isAnswered(q)).length;
  return (
    <div className="pt-day">
      <Sec name={<button type="button" className="pt-focus" onClick={() => go("questions")} style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}>Questions</button>}
        sub={instructor && waiting ? waiting + " waiting" : page.length + " asked"} />
      {instructor ? null : <AskBox api={api} name={name} />}
      <div className="pt-stack">
        {shown.map(q => <QuestionRows key={q.id} config={config} q={q} me={name} profiles={profiles} api={api} instructor={instructor}
          open={open === q.id} onToggle={() => setOpen(open === q.id ? null : q.id)} />)}
      </div>
    </div>
  );
}

// The page: the box, the three sorts, every question.
export function QuestionsPage({ config, name, profiles, instructor }) {
  const api = useQuestions(config.storageKey);
  const [how, setHow] = useState(instructor ? "asked" : "answered");
  const [open, setOpen] = useState(null);
  if (api.items === null) return <p className="pt-quiet">Loading.</p>;
  const page = sortQuestions(instructor ? onThePage(api.items) : hideLurkers(onThePage(api.items), name), how);
  return (
    <div className="pt-body" style={{ gap: 16 }}>
      {instructor ? null : <AskBox api={api} name={name} />}
      <div className="pt-chips">
        {SORTS.map(([id, say]) => <Chip key={id} on={how === id} onClick={() => setHow(id)}>{say}</Chip>)}
      </div>
      <div className="pt-stack">
        {page.length ? page.map(q => <QuestionRows key={q.id} config={config} q={q} me={name} profiles={profiles} api={api} instructor={instructor}
          open={open === q.id} onToggle={() => setOpen(open === q.id ? null : q.id)} />)
          : <p className="pt-quiet" style={{ textAlign: "center", padding: "16px 0" }}>Nothing asked yet.</p>}
      </div>
      {instructor ? <p className="pt-quiet">The class reads this page at {config.path}/questions.</p> : null}
    </div>
  );
}

export { Badge };
