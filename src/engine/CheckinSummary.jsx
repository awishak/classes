// The Summary read of a check-in, the third switch on the check-in answers
// page (CheckinAnswers.jsx). Andrew, 2026-11-03: "i need the review page for
// this to be better. do a qualitative analysis and give me summary info."
//
// Two reads, the way the team topics review does it (teamtopics/review.jsx).
// The counted read is worked out here from the answers (checkinSummary.js):
// who answered, what the challenges and the plans group into, who asked for a
// change, who sounds like a struggle, who wrote almost nothing, and the words
// each box keeps using. Claude's read is on a button, every answer with no
// names, through /api/generate-feedback, kept in the tab.
//
// Students' words and names stay behind "Show private words" until pressed,
// every visit (Andrew, 2026-10-29). The counts and the themes show at once.

import { useState } from "react";
import { authHeaders } from "./session.js";
import { checkinSummary, checkinLines } from "./checkinSummary.js";
import { realStudents } from "./sections.js";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const WHITE = TOKENS.SURFACE.card;
const SUNK = TOKENS.SURFACE.sunk;
const HIT = TOKENS.HIT;

const h2 = { margin: 0, fontSize: 17, lineHeight: 1.4, fontWeight: 700 };
const p = { margin: "8px 0 0", fontSize: 17, lineHeight: 1.55, color: TEXT_PRIMARY };
const muted = { margin: "8px 0 0", fontSize: 15, lineHeight: 1.5, color: TEXT_SECONDARY };
const sec = { marginTop: 28, paddingTop: 20, borderTop: "1px solid " + LINE };

const READ_SYSTEM = "You are reading a college class's week 4 check-in for the instructor, who will read this before class. Each student answered four questions: how things are going, what they should do differently to reach their goals, what the course or instructor could do differently to support them, and their biggest challenge for the rest of the quarter. Write plain, specific, direct prose for the instructor. No em dashes. No emojis. No headings. No bullet lists. Do not count things in a sentence opener. Quote students' own phrases where they are sharp. Keep it under 450 words, in five short paragraphs: how the room feels about the class right now, what students are asking the instructor to change and which asks come up more than once, where the struggles are and what kind they are, what students say they will do differently, and which answers sound like a student who needs a conversation, described by what they wrote and not by any name.";

function ClaudeRead({ lines, keyOf, accent }) {
  const key = "ci-read:" + keyOf + ":" + lines.length;
  const [text, setText] = useState(() => { try { return sessionStorage.getItem(key) || ""; } catch { return ""; } });
  const [busy, setBusy] = useState("");
  const ask = async () => {
    setBusy("asking");
    try {
      const r = await fetch("/api/generate-feedback", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ model: "claude-opus-5-5", max_tokens: 1400, system: READ_SYSTEM, prompt: "Here are the answers, " + lines.length + " students in all.\n\n" + lines.join("\n\n") }) });
      const out = await r.json().catch(() => null);
      const got = out && out.content && out.content.map(c => c.text || "").join("").trim();
      if (!r.ok || !got) throw new Error((out && (out.error?.message || out.error)) || "no answer");
      setText(got); try { sessionStorage.setItem(key, got); } catch { /* the words still show */ }
      setBusy("");
    } catch (e) { setBusy("Claude did not answer: " + String(e.message || e)); }
  };
  const btn = { minHeight: HIT, padding: "0 14px", borderRadius: 8, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", background: accent, color: "#fff", border: "1px solid " + accent };
  return (
    <section style={sec}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={h2}>Claude's read</h2>
        <button type="button" style={{ ...btn, opacity: busy === "asking" ? .6 : 1 }} disabled={busy === "asking" || !lines.length} onClick={ask}>{busy === "asking" ? "Reading every answer" : text ? "Read again" : "Ask Claude to read the answers"}</button>
      </div>
      {busy && busy !== "asking" ? <p style={muted}>{busy}</p> : null}
      {text ? text.split(/\n{2,}/).map((t, i) => <p key={i} style={{ ...p, maxWidth: 720 }}>{t}</p>) : <p style={muted}>How the room feels, what they ask you to change, where the struggles are, what they say they will do, and which answers sound like a conversation is owed. Names are not sent.</p>}
    </section>
  );
}

function Bars({ themes, accent, shown, onOpen }) {
  const max = Math.max(1, ...themes.map(t => t.names.length));
  return (
    <ol style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: 8, maxWidth: 720 }}>
      {themes.map(t => (
        <li key={t.id}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 220px) 1fr 40px", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{t.say}</span>
            <span style={{ display: "block", height: 14, borderRadius: 7, background: accent + "22", overflow: "hidden" }}><i style={{ display: "block", height: "100%", width: Math.round(100 * t.names.length / max) + "%", background: accent }} /></span>
            <span style={{ fontSize: 15, color: TEXT_SECONDARY, textAlign: "right" }}>{t.names.length}</span>
          </div>
          {shown ? <div style={{ fontSize: 13, color: TEXT_MUTED, margin: "2px 0 0", lineHeight: 1.5 }}>{t.names.map((n, i) => <span key={n}>{i ? ", " : ""}<Name name={n} onOpen={onOpen} /></span>)}</div> : null}
        </li>
      ))}
    </ol>
  );
}

const Name = ({ name, onOpen }) => (
  <button type="button" onClick={() => onOpen && onOpen(name)} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>{name}</button>
);

export default function CheckinSummary({ config, data, asg, roster: everyone, onOpen }) {
  const a = config.accent;
  // The test students are in nobody's count.
  const roster = realStudents(config, everyone);
  const s = checkinSummary(data, asg, roster);
  const lines = checkinLines(data, asg, roster);
  const [shown, setShown] = useState(false);
  const chip = { minHeight: HIT, padding: "0 14px", borderRadius: 999, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", background: shown ? TEXT_PRIMARY : WHITE, color: shown ? WHITE : TEXT_PRIMARY, border: "1px solid " + (shown ? TEXT_PRIMARY : LINE_STRONG) };
  const q = (id) => s.questions.find(x => x.id === id);

  return (
    <article>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.25 }}>{asg.title}</h1>
        <button type="button" style={{ ...chip, marginLeft: "auto" }} aria-pressed={shown} onClick={() => setShown(v => !v)}>{shown ? "Hide private words" : "Show private words"}</button>
      </div>
      <p style={p}>
        <b>{s.answered} of {s.of}</b> answered{s.bySection.length > 1 ? " (" + s.bySection.map(b => b.section + ": " + b.answered + " of " + b.of).join(", ") + ")" : ""}.
        {" "}<b>{s.nothing}</b> said nothing needs to change and <b>{s.asks.length}</b> asked for something.
        {" "}<b>{s.struggling.length}</b> {s.struggling.length === 1 ? "sounds" : "sound"} like a struggle in the first box, <b>{s.fine}</b> sound fine.
        {s.thin.length ? <> <b>{s.thin.length}</b> wrote almost nothing.</> : null}
      </p>
      {s.waiting.length ? <p style={muted}><b style={{ color: TEXT_PRIMARY }}>No answer yet: </b>{s.waiting.join(", ")}.</p> : null}

      <ClaudeRead lines={lines} keyOf={config.id + ":" + asg.id} accent={a} />

      <section style={sec}>
        <h2 style={h2}>{q("challenge").text}</h2>
        <p style={muted}>{q("challenge").avg} words on average. A student can land in more than one.</p>
        <Bars themes={s.challenges} accent={a} shown={shown} onOpen={onOpen} />
      </section>

      <section style={sec}>
        <h2 style={h2}>{q("differently").text}</h2>
        <p style={muted}>{q("differently").avg} words on average.</p>
        <Bars themes={s.plans} accent={a} shown={shown} onOpen={onOpen} />
      </section>

      <section style={sec}>
        <h2 style={h2}>{q("support").text}</h2>
        <p style={muted}>{s.nothing} said nothing, {s.asks.length} asked for something.</p>
        {shown ? s.asks.map(x => (
          <div key={x.name} style={{ marginTop: 12, padding: "10px 14px", background: SUNK, borderRadius: 10, maxWidth: 720 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}><Name name={x.name} onOpen={onOpen} /></div>
            <p style={{ ...p, fontSize: 16, margin: "4px 0 0" }}>{x.text}</p>
          </div>
        )) : <p style={muted}>Press Show private words to read the asks.</p>}
      </section>

      <section style={sec}>
        <h2 style={h2}>{q("going").text}</h2>
        <p style={muted}>{s.struggling.length} {s.struggling.length === 1 ? "answer reads" : "answers read"} like a struggle.</p>
        {shown ? s.struggling.map(x => (
          <div key={x.name} style={{ marginTop: 12, padding: "10px 14px", background: SUNK, borderRadius: 10, maxWidth: 720 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}><Name name={x.name} onOpen={onOpen} /></div>
            <p style={{ ...p, fontSize: 16, margin: "4px 0 0" }}>{x.text}</p>
          </div>
        )) : null}
      </section>

      <section style={sec}>
        <h2 style={h2}>Almost nothing written</h2>
        <p style={muted}>Under 35 words in all, or three boxes of five words or fewer.</p>
        {shown ? (s.thin.length ? <ul style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 16, lineHeight: 1.7 }}>{s.thin.map(t => <li key={t.name}><Name name={t.name} onOpen={onOpen} /> <span style={{ color: TEXT_MUTED }}>{t.total} words</span></li>)}</ul> : <p style={muted}>Nobody.</p>) : null}
      </section>

      <section style={sec}>
        <h2 style={h2}>The words they keep using</h2>
        {s.questions.map(x => (
          <div key={x.id} style={{ marginTop: 14, maxWidth: 720 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_SECONDARY }}>{x.text} <span style={{ fontWeight: 400, color: TEXT_MUTED }}>{x.avg} words on average</span></div>
            <p style={{ margin: "4px 0 0", lineHeight: 1.9 }}>{x.words.length ? x.words.map(([w, c]) => <span key={w} style={{ display: "inline-block", marginRight: 14, fontSize: 14 + Math.min(14, c * 2) }}>{w}<i style={{ fontStyle: "normal", fontSize: 12, color: TEXT_MUTED, marginLeft: 3 }}>{c}</i></span>) : <span style={{ fontSize: 15, color: TEXT_MUTED }}>Not enough answers yet.</span>}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
