// The class's FAQ.
//
// Andrew, 2026-09-20: "i would rather just have a card on the front page that
// says 'ask a question' and then give a checkbox for 'please keep this
// anonymous'. and then i have a place where all the questions go, and then i
// can PUBLISH the questions. so basically it's an FAQ site. students can
// peruse the FAQs, and they can ask one, and they can ask to keep it
// anonymous, and the questions will show up at the top. and when i choose to
// answer a question, i can keep it anonymous and then publish my answer. i
// can also archive a question if i think it's not worth answering."
//
// So: one card, one place to ask, and the published ones underneath. Writing
// an answer is not publishing; publishing is a press of its own. A question
// carries the asker's name unless the student ticked the box or he takes it
// off on the way out.
//
// It reads the store the class has always kept its questions in, so anything
// asked before this is in the queue rather than lost.

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

// On the page: published, newest first. A question answered before publishing
// was a press of its own counts, so nothing already answered disappears.
export const publishedOf = (items) => (items || [])
  .filter(q => q.state === "published" || (q.state === "answered" && words(q.answer)))
  .sort((a, b) => (b.publishedAt || b.answeredAt || b.at || 0) - (a.publishedAt || a.answeredAt || a.at || 0));

// In his queue: everything asked and not yet published or archived, newest
// first, which is what "the questions will show up at the top" means.
export const queueOf = (items) => (items || [])
  .filter(q => q.state !== "published" && q.state !== "archived" && q.state !== "trashed" && !(q.state === "answered" && words(q.answer)))
  .sort((a, b) => (b.at || 0) - (a.at || 0));

export const archivedOf = (items) => (items || [])
  .filter(q => q.state === "archived")
  .sort((a, b) => (b.at || 0) - (a.at || 0));

// Whose question it is, as the class sees it. Either tick takes the name off.
export const askedBy = (q) => (q.anon || q.hideName) ? "Anonymous" : (words(q.who) || "Anonymous");

const when = (ts) => { try { return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return ""; } };

const ThumbsUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 10.5V20H4.6A1.6 1.6 0 0 1 3 18.4v-6.3A1.6 1.6 0 0 1 4.6 10.5H7z" />
    <path d="M7 10.5l4.2-7.1a1.3 1.3 0 0 1 2.4.7V9h4.7a2 2 0 0 1 2 2.5l-1.6 6.6A2.4 2.4 0 0 1 16.4 20H7" />
  </svg>
);

// Thanks for a question worth asking, or an answer worth reading. Andrew,
// 2026-09-20: "please have people be able to appreciate a question or
// appreciate an answer." The count is everyone's; who pressed it is nobody's.
function Thanks({ names, mine, onPress, what, say: words }) {
  const n = (names || []).length;
  const on = !!mine && (names || []).includes(mine);
  const say = on ? "Take your thanks back" : "Appreciate the " + what;
  return (
    <button className="ca-focus" onClick={onPress ? () => onPress() : undefined} disabled={!onPress}
      aria-pressed={on} title={onPress ? say : n + " appreciated the " + what}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 30, padding: "0 10px",
        borderRadius: 999, border: "1px solid " + (on ? "var(--ca-accent, " + BORDER_STRONG + ")" : BORDER_STRONG),
        background: on ? "var(--ca-accent, #eee)" : "none", color: on ? "#fff" : TEXT_SECONDARY,
        fontFamily: F, fontSize: 13, fontWeight: 600, cursor: onPress ? "pointer" : "default" }}>
      <ThumbsUp />{words ? <span>{words}</span> : null}{n ? <span style={{ opacity: .8 }}>{n}</span> : null}
    </button>
  );
}

const field = {
  width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG,
  fontFamily: F, fontSize: 16, minHeight: TAP, background: "var(--surface-card)", color: TEXT_PRIMARY, lineHeight: 1.5,
};
const tick = { width: 18, height: 18, flex: "none" };

// One published question and its answer.
// One question, the way the class reads it. Andrew, 2026-09-20: "the FAQ is
// poorly done. It should be a bold question, and an answer underneath it."
// So: the question, in bold, at the size of a heading. The answer straight
// under it, in the colour everything else is read in. Then one quiet line for
// who asked, when, and the two ways to say thanks.
export function FaqEntry({ q, me, onThank }) {
  return (
    <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.35, color: TEXT_PRIMARY, whiteSpace: "pre-wrap" }}>{q.text}</div>
      <div style={{ fontSize: 16, lineHeight: 1.55, color: TEXT_PRIMARY, whiteSpace: "pre-wrap" }}>{q.answer}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
        <span style={{ fontSize: 13, color: TEXT_MUTED }}>{askedBy(q)} · {when(q.publishedAt || q.answeredAt || q.at)}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Thanks names={q.thanksQ} mine={me} what="question" say="Good question"
            onPress={onThank ? () => onThank(q.id, "question") : null} />
          <Thanks names={q.thanksA} mine={me} what="answer" say="Helpful"
            onPress={onThank ? () => onThank(q.id, "answer") : null} />
        </span>
      </div>
    </div>
  );
}

// ─── the tile ───
export function QuestionsSummary({ config, role, asStudent }) {
  const { items } = useQuestions(config.storageKey);
  if (items === null) return <Muted>Loading.</Muted>;
  const out = publishedOf(items);
  if (role === "instructor") {
    const waiting = queueOf(items).length;
    return waiting
      ? <div><div style={{ fontSize: 22, fontWeight: 700, color: config.accent }}>{waiting}</div><Muted>to answer</Muted></div>
      : <Muted>{out.length} published for the class.</Muted>;
  }
  const mine = queueOf(items).filter(q => words(q.who) && q.who === asStudent).length;
  if (!out.length) return <Muted>{mine ? "Your question is in. Nothing published yet." : "Ask a question about anything in the class."}</Muted>;
  return (
    <div>
      <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{out[0].text}</div>
      <Muted>{out.length} question{out.length === 1 ? "" : "s"} answered{mine ? " · yours is in the queue" : ""}</Muted>
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
  const out = publishedOf(api.items);
  const mine = queueOf(api.items).filter(q => words(q.who) && q.who === name);
  const ask = () => {
    if (!text.trim()) return;
    api.add({ text: text.trim(), who: name || "", anon });
    setText(""); setSent(true);
  };
  return (
    <div>
      <div style={h2}>Questions</div>
      <Muted>Ask anything about the class. Answered questions turn up here for everybody to read.</Muted>

      <div style={{ marginTop: 18 }}>
        <div style={label}>Ask a question</div>
        <div style={{ marginTop: 8 }}>
          {/* Small, and it says the one thing it needs to. Andrew,
              2026-09-20: "wtf is that shit. remove that. just say ask your
              question here", and "have the question dialog box be way
              smaller." */}
          <textarea value={text} onChange={e => { setText(e.target.value); setSent(false); }} rows={2}
            placeholder="Ask your question here"
            style={{ ...field, minHeight: 64, resize: "vertical" }} />
        </div>
        <label style={{ marginTop: 8, fontSize: 15, color: TEXT_SECONDARY, display: "flex", alignItems: "center", gap: 8, minHeight: TAP }}>
          <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={tick} />
          Please keep this anonymous
        </label>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="ca-focus" onClick={ask} disabled={!text.trim()}
            style={{ minHeight: TAP, padding: "0 18px", borderRadius: 999, border: "none", cursor: text.trim() ? "pointer" : "default",
              background: "var(--ca-accent, " + config.accent + ")", color: "#fff", fontFamily: F, fontSize: 16, fontWeight: 600,
              opacity: text.trim() ? 1 : .5 }}>Ask</button>
          <span style={{ fontSize: 14, color: TEXT_MUTED }}>
            {sent ? "Asked. Your question turns up here once Dr. Ishak answers." : anon ? "Your name stays off the question." : "Dr. Ishak sees your name with the question."}
          </span>
        </div>
      </div>

      {mine.length ? (
        <div style={{ marginTop: 22 }}>
          <div style={label}>Yours, waiting</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {mine.map(q => (
              <div key={q.id} style={{ borderTop: "1px solid " + BORDER, paddingTop: 10 }}>
                <div style={{ fontSize: 16, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{q.text}</div>
                <Muted>Asked {when(q.at)}</Muted>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 22 }}>
        <div style={label}>Answered</div>
        {out.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {out.map(q => <FaqEntry key={q.id} q={q} me={name} onThank={(id, part) => api.appreciate(id, part, name)} />)}
          </div>
        ) : <Muted>Nothing published yet.</Muted>}
      </div>
    </div>
  );
}

function InstructorQuestions({ config, api }) {
  const [showArchive, setShowArchive] = useState(false);
  const queue = queueOf(api.items);
  const out = publishedOf(api.items);
  const archived = archivedOf(api.items);
  return (
    <div>
      <div style={h2}>Questions</div>
      <Muted>
        Answer, then press Publish. Writing an answer saves it and nobody sees it; publishing is what puts the
        question and the answer on the class's page, at <b style={{ fontWeight: 600 }}>{config.path}/questions</b>.
      </Muted>

      <div style={{ marginTop: 18 }}>
        <div style={label}>To answer</div>
        {queue.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
            {queue.map(q => <Answering key={q.id} q={q} config={config} api={api} />)}
          </div>
        ) : <Muted>Nothing waiting.</Muted>}
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={label}>On the class's page</div>
        {out.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
            {out.map(q => <Answering key={q.id} q={q} config={config} api={api} published />)}
          </div>
        ) : <Muted>Nothing published yet.</Muted>}
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
                  <button className="ca-focus" onClick={() => api.unpublish(q.id)}
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

// One question, with the answer box and the two presses that decide what
// happens to it. The answer saves when he leaves the box, so there is no Save
// to forget, and publishing is separate from writing.
function Answering({ q, config, api, published }) {
  const [draft, setDraft] = useState(q.answer || "");
  const [hide, setHide] = useState(!!q.hideName);
  const ready = !!draft.trim();
  return (
    <div style={{ borderTop: "1px solid " + BORDER, paddingTop: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{q.text}</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 4 }}>
        <span style={{ ...label, flex: 1, minWidth: 0 }}>
          {(words(q.who) || "Anonymous") + " · " + when(q.at) + (q.anon ? " · asked to stay anonymous" : "")}
          {(q.thanksQ || []).length ? " · " + q.thanksQ.length + " appreciated it" : ""}
          {(q.thanksA || []).length ? " · " + q.thanksA.length + " appreciated the answer" : ""}
        </span>
      </div>
      <textarea value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => api.answer(q.id, draft)} rows={3}
        placeholder="Your answer, for the whole class to read"
        style={{ ...field, marginTop: 8, resize: "vertical" }} />
      <label style={{ marginTop: 6, fontSize: 15, color: TEXT_SECONDARY, display: "flex", alignItems: "center", gap: 8, minHeight: TAP }}>
        <input type="checkbox" checked={hide || !!q.anon} disabled={!!q.anon} style={tick}
          onChange={e => { setHide(e.target.checked); if (published) api.publish(q.id, e.target.checked); }} />
        {q.anon ? "Anonymous, because they asked" : "Publish it without their name"}
      </label>
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: published ? TOKENS.STATE.ok : TOKENS.STATE.warn }}>
          {published ? "On the class's page" : ready ? "Answered, and the class cannot see the answer yet" : "Not answered"}
        </span>
        {published ? (
          <>
            <button className="ca-focus" onClick={() => { api.answer(q.id, draft); api.publish(q.id, hide); }} disabled={!ready}
              style={{ minHeight: TAP, padding: "0 16px", borderRadius: 999, border: "1px solid " + BORDER_STRONG,
                background: "var(--surface-card)", color: TEXT_PRIMARY, fontFamily: F, fontSize: 15, fontWeight: 600,
                cursor: ready ? "pointer" : "default", opacity: ready ? 1 : .5 }}>Save the changes</button>
            <button className="ca-focus" onClick={() => api.unpublish(q.id)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_MUTED, minHeight: TAP }}>
              Take it off the page
            </button>
          </>
        ) : (
          <>
            <button className="ca-focus" onClick={() => { api.answer(q.id, draft); api.publish(q.id, hide); }} disabled={!ready}
              style={{ minHeight: TAP, padding: "0 18px", borderRadius: 999, border: "none",
                background: "var(--ca-accent, " + config.accent + ")", color: "#fff", fontFamily: F, fontSize: 16, fontWeight: 600,
                cursor: ready ? "pointer" : "default", opacity: ready ? 1 : .5 }}>Publish</button>
            <button className="ca-focus" onClick={() => api.archive(q.id)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_MUTED, minHeight: TAP }}>
              Archive
            </button>
          </>
        )}
      </div>
    </div>
  );
}
