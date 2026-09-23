// The first time a student signs in.
//
// Andrew, 2026-09-20: "i'd love to have cards that are like: welcome to class.
// I'd like to know a little bit about you. and then each card has a question:
// I have your name as: but i'd love to know your preferred names. can you fill
// this in? next, we need a photo. can you find one where we can clearly see
// your face so others in class can recognize you? then the other stuff for the
// roster? use a warm tone, my voice. end with thank you! let's go to the site
// now."
//
// One question a card, in the order he said them. The same fields as Your
// card, asked rather than laid out as a form, because a form on a first visit
// is a thing to close and a question is a thing to answer.
//
// Nothing here is compulsory. Every card can be stepped past, the deck comes
// back on the next visit while the card is unfinished, and the first challenge
// of the term, Please tell me about yourself, is the same profile read from
// the other end.

import { useState, useEffect, useRef } from "react";
import * as TOKENS from "./tokens.js";
import { fileToAvatar, AvatarPreview } from "./YouCard.jsx";
import { PHOTO_MARK } from "./photos.js";
import { profileComplete } from "./profileTask.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const BG = TOKENS.SURFACE.page;
const WHITE = TOKENS.SURFACE.card;
const TAP = TOKENS.TAP;

const label = { fontFamily: TOKENS.FONT.label, fontSize: 13, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT_MUTED };
const YEARS = ["First-year", "Sophomore", "Junior", "Senior", "Graduate", "Other"];
const PRIORITIES = ["Learning new material", "Getting a good grade", "Getting course credit"];

// Has this student been through the cards?
//
// Not "have they answered anything": a student who typed one letter and closed
// the tab had answered something, and would never be asked again with a
// profile two fields deep. The deck comes up until either the card is complete
// or they have stepped through it, and stepping through is recorded whichever
// way they leave, so nobody is nagged.
export const needsWelcome = (data, name) => {
  if (!name) return false;
  if ((data?.welcomeSeen || {})[name]) return false;
  return !profileComplete((data?.profiles || {})[name]);
};

export const markWelcomed = (data, name) => ({
  ...data,
  welcomeSeen: { ...(data?.welcomeSeen || {}), [name]: Date.now() },
});

// A box a student types in, holding the words while they type.
//
// Andrew, 2026-09-21: "same thing is happening to student when they put in
// their home town on the cards."
//
// Every keystroke wrote the profile into the class store: one save a letter,
// each one a round trip, and the class coming back over the top of the box. An
// echo of an earlier save landing mid-word put the box back to what the server
// held and the caret to the front of it. The comment box on the grading screen
// was the same bug through a different door.
//
// So the box keeps the words and hands them over when the student leaves the
// box, or when the card goes, which is what the note on the front page already
// does. Next is a tap that can land before a blur on a phone, so the card going
// saves as well.
function Answer({ value, onSave, multiline, ...rest }) {
  const [draft, setDraft] = useState(value || "");
  const latest = useRef(value || "");
  const saved = useRef(value || "");
  const save = () => {
    if (latest.current === saved.current) return;
    saved.current = latest.current;
    onSave(latest.current);
  };
  useEffect(() => save, []);   // eslint-disable-line react-hooks/exhaustive-deps
  const Box = multiline ? "textarea" : "input";
  return <Box value={draft} onChange={e => { latest.current = e.target.value; setDraft(e.target.value); }}
    onBlur={save} {...rest} />;
}

export default function WelcomeDeck({ config, name, profile, update, setPhoto, onDone, pin }) {
  const [at, setAt] = useState(0);
  const a = config.accent;
  const p = profile || {};
  const set = (key, value) => {
    // A photograph goes to the class's photographs row; the card keeps the
    // mark, so the class itself stays light. See photos.js.
    const photo = key === "avatar" && typeof value === "string" && value.startsWith("data:");
    if (photo && setPhoto) setPhoto(name, value);
    update(prev => {
      const profiles = { ...(prev.profiles || {}) };
      profiles[name] = { ...(profiles[name] || {}), [key]: photo ? PHOTO_MARK : value };
      return { ...prev, profiles };
    });
  };

  const roster = String(name || "").trim().split(/\s+/);
  const input = { width: "100%", fontFamily: F, fontSize: 17, minHeight: TAP, padding: "0 12px", borderRadius: 10,
    border: "1px solid " + LINE_STRONG, background: WHITE, color: TEXT_PRIMARY };
  const area = { ...input, minHeight: 92, padding: 12, lineHeight: 1.5, resize: "vertical" };

  const cards = [
    {
      key: "hello",
      title: "Welcome to " + config.code + ".",
      say: "I'd like to know a little bit about you. A few quick questions, and then the site is yours.",
      body: null,
    },
    {
      key: "name",
      title: "I have your name as " + name + ".",
      say: "I'd love to know what you prefer to go by. Fill this in and it is what the whole class sees.",
      body: (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ flex: 1, minWidth: 140 }}>
            <span style={label}>First name</span>
            <Answer value={p.firstName} onSave={v => set("firstName", v)}
              placeholder={roster[0] || ""} style={{ ...input, marginTop: 6 }} />
          </label>
          <label style={{ flex: 1, minWidth: 140 }}>
            <span style={label}>Last name</span>
            <Answer value={p.lastName} onSave={v => set("lastName", v)}
              placeholder={roster.slice(1).join(" ")} style={{ ...input, marginTop: 6 }} />
          </label>
        </div>
      ),
    },
    {
      key: "photo",
      title: "Now a photo.",
      say: "Find one where we can clearly see your face, so people in class can recognize you.",
      body: (
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <AvatarPreview value={p.avatar} accent={a} size={88} />
          <label style={{ display: "inline-flex", alignItems: "center", minHeight: TAP, padding: "0 18px",
            borderRadius: 999, border: "1px solid " + LINE_STRONG, fontSize: 16, fontWeight: 600, color: a, cursor: "pointer" }}>
            {p.avatar ? "Choose another" : "Choose a photo"}
            <input type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) fileToAvatar(f, (v) => set("avatar", v)); e.target.value = ""; }} />
          </label>
        </div>
      ),
    },
    {
      key: "where",
      title: "Where are you coming from?",
      say: "Your year, and the place you call home.",
      body: (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <label style={{ flex: 1, minWidth: 150 }}>
            <span style={label}>Year</span>
            <select value={p.year || ""} onChange={e => set("year", e.target.value)} style={{ ...input, marginTop: 6 }}>
              <option value="">Pick your year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label style={{ flex: 1, minWidth: 150 }}>
            <span style={label}>Hometown</span>
            <Answer value={p.hometown} onSave={v => set("hometown", v)} style={{ ...input, marginTop: 6 }} />
          </label>
        </div>
      ),
    },
    {
      key: "about",
      title: "Tell the class something about you.",
      say: "No rules here. And if you have a favorite motto, verse, or lyric, include that too.",
      body: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label>
            <span style={label}>About me</span>
            <Answer multiline value={p.about} onSave={v => set("about", v)} style={{ ...area, marginTop: 6 }} />
          </label>
          <label>
            <span style={label}>Motto</span>
            <Answer value={p.motto} onSave={v => set("motto", v)} style={{ ...input, marginTop: 6 }} />
          </label>
        </div>
      ),
    },
    {
      key: "why",
      title: "What do you want out of this class?",
      say: "This answer is only for me, and it changes how I teach the class.",
      body: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label>
            <span style={label}>Goals for the class</span>
            <Answer multiline value={p.goals} onSave={v => set("goals", v)} style={{ ...area, marginTop: 6 }} />
          </label>
          <label>
            <span style={label}>What matters to you most</span>
            <select value={p.priority || ""} onChange={e => set("priority", e.target.value)} style={{ ...input, marginTop: 6 }}>
              <option value="">Pick what matters most</option>
              {PRIORITIES.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>
      ),
    },
    {
      key: "strength",
      title: "What would you say is your biggest strength as a student?",
      say: "This could be a characteristic (resilience, seeing connections) or a strongest activity (writing, creative work) or something else.",
      body: (
        <label style={{ display: "block" }}>
          <span style={label}>Your biggest strength</span>
          <Answer value={p.strength} onSave={v => set("strength", v)} style={{ ...input, marginTop: 6 }} />
        </label>
      ),
    },
    // His words, and the reason the card exists: a student who arrived by an
    // emailed link has never seen the code that works without one.
    ...(pin ? [{
      key: "pin",
      title: "One more thing that will be helpful.",
      // Andrew's own sentence, kept as he wrote it: the rule is a guardrail on
      // Claude's copy, not a correction of the author's.
      say: "If you forget it, you can still log in by having an email sent to you. Either way works.",   // voice-ok
      body: (
        <div>
          <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.55 }}>
            For future sessions, you can log in using this PIN:
          </div>
          <div style={{ fontFamily: TOKENS.FONT.label, fontSize: 30, fontWeight: 700, letterSpacing: ".2em",
            color: TEXT_PRIMARY, marginTop: 6 }}>{pin}</div>
        </div>
      ),
    }] : []),
    {
      key: "thanks",
      title: "Thank you!",
      say: "Let's go to the site now. You can change any of this later on Your card.",
      body: null,
    },
  ];

  const card = cards[Math.min(at, cards.length - 1)];
  const last = at >= cards.length - 1;
  const leave = () => { update(prev => markWelcomed(prev, name)); onDone?.(); };

  return (
    <div aria-label="Welcome" style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY,
      display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: TAP }}>
          <span style={label}>{config.code}</span>
          <span style={{ fontSize: 15, color: TEXT_MUTED }}>{at + 1} of {cards.length}</span>
        </div>

        <section key={card.key} style={{ background: WHITE, border: "1px solid " + LINE, borderRadius: 16, padding: 24,
          display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 12px 32px -20px rgba(23,19,16,.35)" }}>
          <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-.01em" }}>{card.title}</div>
          <div style={{ fontSize: 17, lineHeight: 1.55, color: TEXT_SECONDARY }}>{card.say}</div>
          {card.body}
        </section>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
          {at > 0 && !last ? (
            <button onClick={() => setAt(at - 1)}
              style={{ minHeight: 52, padding: "0 18px", borderRadius: 12, background: WHITE, border: "1px solid " + LINE_STRONG,
                fontFamily: F, fontSize: 17, fontWeight: 600, color: TEXT_PRIMARY, cursor: "pointer" }}>Back</button>
          ) : null}
          <button onClick={last ? leave : () => setAt(at + 1)}
            style={{ flex: 1, minHeight: 52, padding: "0 20px", borderRadius: 12, background: a, color: "#fff",
              border: "none", fontFamily: F, fontSize: 18, fontWeight: 600, cursor: "pointer" }}>
            {last ? "Go to the site" : at === 0 ? "Let's go" : "Next"}
          </button>
        </div>
        {!last ? (
          <button onClick={leave}
            style={{ alignSelf: "center", background: "none", border: "none", cursor: "pointer", fontFamily: F,
              fontSize: 15, color: TEXT_MUTED, minHeight: TAP }}>
            Finish this later
          </button>
        ) : null}
      </div>
    </div>
  );
}
