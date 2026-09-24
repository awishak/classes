// The notice, as a card in front of the site.
//
// Andrew, 2026-09-21: "i want to create a card that will be there next time
// students log in." Built like the welcome cards, because a student has already
// met that shape: the class code at the top, the words, and one button on.
//
// Every word on it is his. See notice.js for when it shows and when it stops.

import { useState } from "react";
import * as TOKENS from "./tokens.js";
import { noticeOf, setNotice } from "./notice.js";
import { AvatarPreview } from "./YouCard.jsx";
import { SaveWord } from "./SaveWord.jsx";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const LINE = TOKENS.LINE.soft;
const BG = TOKENS.SURFACE.page;
const WHITE = TOKENS.SURFACE.card;
const TAP = TOKENS.TAP;

const label = { fontFamily: TOKENS.FONT.label, fontSize: 13, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT_MUTED };

export default function NoticeCard({ config, text, instructor, onDone }) {
  const a = config.accent;
  return (
    <div aria-label="A note from your instructor" style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY,
      display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: TAP }}>
          <span style={label}>{config.code}</span>
          {instructor ? <span style={{ fontSize: 15, color: TEXT_MUTED }}>The card students see</span> : null}
        </div>
        <section style={{ background: WHITE, border: "1px solid " + LINE, borderRadius: 16, padding: 24,
          display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 12px 32px -20px rgba(23,19,16,.35)" }}>
          {/* Who it is from, with his face, over the words rather than signed
              under them. Andrew, 2026-09-21: "where there's a message from me,
              can you say: A message from Dr. Ishak, and put my vatar?" The
              photo is the one on his own card, so there is one picture of him
              to keep up to date. */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {config.instructor?.photo ? <AvatarPreview value={config.instructor.photo} accent={a} size={44} /> : null}
            <span style={label}>A message from Dr. Ishak</span>
          </div>
          <div style={{ fontSize: 19, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{text}</div>
        </section>
        {/* Right under what it says. Andrew, 2026-09-21: "the go to the site
            button is too close to the bottom. can we put it right under the
            text?" It was pushed to the foot of the screen with a margin, which
            on a laptop put it a long way from the words it answers. */}
        <button onClick={onDone} className="ca-focus"
          style={{ minHeight: 52, padding: "0 20px", borderRadius: 12, background: a, color: "#fff",
            border: "none", fontFamily: F, fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
          Go to the site
        </button>
      </div>
    </div>
  );
}

// Writing one, and taking it down.
//
// His side of the same card, collapsed the way the pinned links are, because a
// class has a notice on it about one week in ten and the box should not take
// the page the other nine.
//
// The deadline is a moment he picks: "get rid of it after 11:30 tomorrow
// morning." Left empty, the card stands until he takes it down.
const local = (ms) => {
  if (!ms) return "";
  const d = new Date(ms);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
};

export function NoticeWriter({ data, update, seat, saving, online = true }) {
  const now = noticeOf(data);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [until, setUntil] = useState("");
  const [armed, setArmed] = useState(false);
  // The box seeds itself when Edit is pressed, from what is saved at that
  // moment. It used to seed once when the page first drew, which is before
  // the class has loaded, so it opened empty over a card that was there, and
  // Save then wrote the empty box over the card.
  const edit = () => { setDraft(now?.text || ""); setUntil(local(now?.until)); setArmed(false); setOpen(true); };
  const cancel = () => setOpen(false);
  const save = () => {
    const at = until ? new Date(until).getTime() : 0;
    update(prev => setNotice(prev, draft, Number.isFinite(at) ? at : 0));
    setArmed(true);
    setOpen(false);
  };
  const takeDown = () => {
    update(prev => setNotice(prev, "", 0));
    setArmed(true);
    setOpen(false);
  };
  const box = { fontFamily: F, fontSize: 16, padding: "10px 12px", borderRadius: 10, border: "1px solid " + TOKENS.LINE.strong,
    background: WHITE, color: TEXT_PRIMARY, minHeight: TAP };
  const pill = (text, onClick, filled) => (
    <button className="ca-focus" onClick={onClick}
      style={{ minHeight: TAP, padding: "0 18px", borderRadius: 10, cursor: "pointer", fontFamily: F, fontSize: 15, fontWeight: 600,
        border: filled ? "none" : "1px solid " + TOKENS.LINE.strong,
        background: filled ? "var(--ca-accent)" : WHITE, color: filled ? "#fff" : TEXT_PRIMARY }}>
      {text}
    </button>
  );
  return (
    <section aria-label="Card for students" style={{ ...seat, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...label, color: "var(--ca-accent-ink)" }}>Card for students</span>
        {open ? null : (
          <button className="ca-focus" onClick={edit}
            style={{ background: "none", cursor: "pointer", border: "1px solid " + TOKENS.LINE.strong, borderRadius: 999,
              padding: "0 14px", minHeight: 36, fontFamily: F, fontSize: 14, fontWeight: 700, color: "var(--ca-accent-ink)" }}>
            {now ? "Edit" : "Write a card"}
          </button>
        )}
        {open ? null : <SaveWord saving={saving} online={online} armed={armed} />}
      </div>
      {now && !open ? (
        <div style={{ fontSize: 15, lineHeight: 1.5, color: TEXT_PRIMARY, whiteSpace: "pre-wrap" }}>{now.text}</div>
      ) : null}
      {open ? (
        <>
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={4} autoFocus
            onKeyDown={e => { if (e.key === "Escape") cancel(); }}
            style={{ ...box, lineHeight: 1.5, resize: "vertical" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 15, color: TEXT_MUTED }}>
            Until
            <input type="datetime-local" value={until} onChange={e => setUntil(e.target.value)} style={box} />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pill("Save", save, true)}
            {pill("Cancel", cancel)}
            {now ? pill("Take it down", takeDown) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
