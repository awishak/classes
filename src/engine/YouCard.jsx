// The "You" card: a two-way channel between instructor and each student.
// Student view: see notes from the instructor, reply, tap Got it / I'm confused
// / Make a meeting, and ask a question. Instructor view: an inbox of every
// student thread. Threads persist via the shared store (Supabase + realtime).

import { useState } from "react";
import { genId } from "../utils.jsx";
import { schedulingLinkOf } from "../instructors.js";
import * as TOKENS from "./tokens.js";

// The theme's face. Outfit on Clean and Business, Nunito on Snapchat,
// Fredoka on Crashing Out. One declaration, and every use below follows.
const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const BG = TOKENS.SURFACE.page;
const TAP = 44;

// ─── helpers ───
const threadOf = (data, name) => (data?.threads?.[name] || []);

function addMessage(update, name, msg) {
  update(prev => {
    const threads = { ...(prev.threads || {}) };
    threads[name] = [...(threads[name] || []), { id: genId(), ts: Date.now(), ...msg }];
    return { ...prev, threads };
  });
}

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return ""; }
}

const lastMsg = (data, name) => { const t = threadOf(data, name); return t[t.length - 1]; };
const waitingOnInstructor = (data, name) => { const m = lastMsg(data, name); return m && m.from === "student"; };

// ─── shared bits ───
const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };

function Field({ value, onChange, placeholder }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", minHeight: 80, padding: 14, borderRadius: 12, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, lineHeight: 1.5, resize: "vertical" }} />
  );
}

function SendBtn({ accent, onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ minHeight: TAP, padding: "0 20px", borderRadius: 999, border: "none", fontFamily: F, fontSize: 15, fontWeight: 600,
        background: disabled ? BORDER_STRONG : accent, color: "#fff", cursor: disabled ? "default" : "pointer" }}>
      {children}
    </button>
  );
}

function GhostBtn({ accent, onClick, children, href, label }) {
  const style = { minHeight: TAP, padding: "0 16px", borderRadius: 999, border: "1px solid " + BORDER_STRONG, background: "#fff",
    fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none" };
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={{ ...style, color: accent }} aria-label={label}>{children}</a>;
  return <button onClick={onClick} style={style} aria-label={label} title={label}>{children}</button>;
}

const ThumbsUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 10.5V20H4.6A1.6 1.6 0 0 1 3 18.4v-6.3A1.6 1.6 0 0 1 4.6 10.5H7z" />
    <path d="M7 10.5l4.2-7.1a1.3 1.3 0 0 1 2.4.7V9h4.7a2 2 0 0 1 2 2.5l-1.6 6.6A2.4 2.4 0 0 1 16.4 20H7" />
  </svg>
);

function Bubble({ m, accent }) {
  // status messages render centered
  if (m.kind === "got_it" || m.kind === "confused" || m.kind === "meeting") {
    const text = m.kind === "got_it" ? "Thumbs up" : m.kind === "confused" ? "Said: I'm confused" : "Requested a meeting";
    const color = m.kind === "got_it" ? "#059669" : m.kind === "confused" ? "#d97706" : accent;
    return (
      <div style={{ textAlign: "center", margin: "4px 0" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color, background: color + "14", padding: "5px 12px", borderRadius: 999 }}>{text}</span>
      </div>
    );
  }
  const mine = m.from === "instructor";
  const isQuestion = m.kind === "question";
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-start" : "flex-end" }}>
      <div style={{ maxWidth: "82%" }}>
        {isQuestion && <div style={{ ...label, color: "#d97706", marginBottom: 4 }}>Question</div>}
        <div style={{ padding: "10px 14px", borderRadius: 16, fontSize: 15, lineHeight: 1.45,
          background: mine ? accent + "12" : "#f3f4f6",
          color: TEXT_PRIMARY, border: isQuestion ? "1px solid #f59e0b55" : "none" }}>
          {m.text}
        </div>
        <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3, textAlign: mine ? "left" : "right" }}>
          {mine ? "Instructor" : "You"} · {fmtTime(m.ts)}
        </div>
      </div>
    </div>
  );
}

function Thread({ data, name, accent }) {
  const msgs = threadOf(data, name);
  if (!msgs.length) return <Muted>No messages yet.</Muted>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {msgs.map(m => <Bubble key={m.id} m={m} accent={accent} />)}
    </div>
  );
}

const Muted = ({ children }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5 }}>{children}</div>;

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────
const YEARS = ["First-year", "Sophomore", "Junior", "Senior", "Graduate", "Other"];
const PRIORITIES = ["Learning new material", "Getting a good grade", "Getting course credit"];

const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: TAP, background: "#fff", color: TEXT_PRIMARY };

// Downscale an uploaded image to a small square data URL so it fits in the store.
export function fileToAvatar(file, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const size = 220;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      cb(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export function AvatarPreview({ value, accent, size = 72 }) {
  const isPhoto = typeof value === "string" && value.startsWith("data:");
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
      background: accent + "22", border: "2px solid " + accent + "55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5 }}>
      {isPhoto ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (value || "")}
    </div>
  );
}

function FieldRow({ title, children }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={label}>{title}</div>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

function ProfileForm({ student, initial, update, accent }) {
  const [f, setF] = useState({
    email: initial.email || "", avatar: initial.avatar || "", about: initial.about || "",
    year: initial.year || "", hometown: initial.hometown || "", motto: initial.motto || "",
    goals: initial.goals || "", priority: initial.priority || "",
  });
  const [saved, setSaved] = useState(false);
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setSaved(false); };
  const a = accent;

  const save = () => {
    update(prev => ({ ...prev, profiles: { ...(prev.profiles || {}), [student]: f } }));
    setSaved(true);
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) fileToAvatar(file, (url) => set("avatar", url));
  };

  return (
    <div>
      <div style={h2}>Your profile</div>
      <Muted>Tell the class a little about yourself.</Muted>

      <FieldRow title="Email address (this is only for your instructor)">
        <input type="email" value={f.email} onChange={e => set("email", e.target.value)} style={inputStyle} />
      </FieldRow>

      <FieldRow title="Avatar">
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <AvatarPreview value={f.avatar} accent={a} />
          <label style={{ display: "inline-flex", alignItems: "center", minHeight: TAP, padding: "0 16px", borderRadius: 999, border: "1px solid " + BORDER_STRONG, fontSize: 15, fontWeight: 600, color: a, cursor: "pointer" }}>
            Upload a photo
            <input type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
          </label>
        </div>
        <Muted>If you need a new photo, please choose one where your face is clearly visible.</Muted>
      </FieldRow>

      <FieldRow title="About me">
        <textarea value={f.about} onChange={e => set("about", e.target.value)}
          style={{ ...inputStyle, minHeight: 96, lineHeight: 1.5, resize: "vertical" }} />
      </FieldRow>

      <FieldRow title="Year">
        <select value={f.year} onChange={e => set("year", e.target.value)} style={inputStyle}>
          <option value=""></option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </FieldRow>

      <FieldRow title="Hometown">
        <input value={f.hometown} onChange={e => set("hometown", e.target.value)} style={inputStyle} />
      </FieldRow>

      <FieldRow title="Motto">
        <input value={f.motto} onChange={e => set("motto", e.target.value)} style={inputStyle} />
      </FieldRow>

      <FieldRow title="Goals for the class (this is only for your instructor)">
        <textarea value={f.goals} onChange={e => set("goals", e.target.value)}
          style={{ ...inputStyle, minHeight: 80, lineHeight: 1.5, resize: "vertical" }} />
      </FieldRow>

      <FieldRow title="What matters to you most? (this is only for your instructor)">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => set("priority", p)}
              style={{ minHeight: TAP, padding: "0 16px", borderRadius: 999, cursor: "pointer", fontFamily: F, fontSize: 15, fontWeight: 600,
                background: f.priority === p ? a : "#fff", color: f.priority === p ? "#fff" : TEXT_PRIMARY, border: "1px solid " + (f.priority === p ? a : BORDER_STRONG) }}>{p}</button>
          ))}
        </div>
      </FieldRow>

      <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <SendBtn accent={a} onClick={save}>Save profile</SendBtn>
        {saved && <span style={{ fontSize: 15, fontWeight: 600, color: "#059669" }}>Saved</span>}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// STUDENT VIEW
// ─────────────────────────────────────────────────────────────
// Your card. The profile comes first, because this page is where a student
// fills in who they are; grades have a card of their own on the home page.
function StudentYou({ config, data, update, asStudent, setAsStudent }) {
  const a = config.accent;
  const roster = config.students || [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={h2}>Your card</div>
        {setAsStudent ? (
          <label style={{ fontSize: 13, color: TEXT_SECONDARY, display: "flex", alignItems: "center", gap: 6 }}>
            Viewing as
            <select value={asStudent} onChange={e => setAsStudent(e.target.value)}
              style={{ fontFamily: F, fontSize: 15, padding: "8px 10px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, minHeight: TAP }}>
              {roster.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      <div style={{ marginTop: 14 }}>
        <ProfileForm key={asStudent} student={asStudent} initial={data?.profiles?.[asStudent] || {}} update={update} accent={a} />
      </div>
    </div>
  );
}

// Messages with Andrew: the thread, a reply, Done / I'm confused / Make a
// meeting, and a question for the class. These sat at the foot of the
// profile before. Andrew, 2026-09-17: "can we move them from the bottom of
// the bio card to a card on the front page please?" A card of their own now.
function StudentMessages({ config, data, update, asStudent }) {
  const a = config.accent;
  const [reply, setReply] = useState("");

  const send = (text) => { if (!text.trim()) return; addMessage(update, asStudent, { from: "student", kind: "reply", text: text.trim() }); setReply(""); };
  const status = (kind) => addMessage(update, asStudent, { from: "student", kind, text: "" });

  return (
    <div>
      <div style={h2}>Message with Dr. Ishak</div>
      <div style={{ marginTop: 14 }}><Thread data={data} name={asStudent} accent={a} /></div>

      <div style={{ marginTop: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}><Field value={reply} onChange={setReply} placeholder="Write a reply..." /></div>
        <SendBtn accent={a} onClick={() => send(reply)} disabled={!reply.trim()}>Send</SendBtn>
      </div>

      {/* Andrew, 2026-09-20: "let's remove the got it and i'm confused
          buttons, and go with a thumbs up. make a meeting is a link, which is
          good." Done and I'm confused were two words answering nothing in
          particular, and the record called the first one two different things.
          One thumb, which says the only thing a tap can say. The thumb is
          drawn rather than taken from an emoji font, like everything else
          here. Threads that already hold an I'm confused still render it. */}
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <GhostBtn accent={a} onClick={() => status("got_it")} label="Thumbs up"><ThumbsUp /></GhostBtn>
        <GhostBtn accent={a} href={schedulingLinkOf(config) || undefined} onClick={() => status("meeting")}>Make a meeting</GhostBtn>
      </div>

      {/* "I don't understand something" was a box here, and it is the
          Questions card now. One place to ask, which is the whole point of
          taking the ask page away: this card is for what is between the two
          of us, and a question the class would benefit from is not that. */}

      {/* Andrew, 2026-09-20: "always list my office hours underneath the
          messaging system." A student deciding whether to write to him is a
          student who may be better off turning up, and the hours were on the
          instructor's card where they had to go looking for them. */}
      <OfficeHours config={config} />
    </div>
  );
}

// When he is there, under every way of writing to him.
function OfficeHours({ config }) {
  const hours = String(config.instructor?.officeHours || "").trim();
  if (!hours) return null;
  return (
    <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid " + BORDER }}>
      <div style={label}>Office hours</div>
      <div style={{ marginTop: 6, fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{hours}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR VIEW (inbox)
// ─────────────────────────────────────────────────────────────
function InstructorYou({ config, data, update }) {
  const a = config.accent;
  const roster = config.students || [];
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");

  if (selected) {
    const send = () => { if (!note.trim()) return; addMessage(update, selected, { from: "instructor", kind: "note", text: note.trim() }); setNote(""); };
    return (
      <div>
        <button onClick={() => setSelected(null)}
          style={{ background: "none", border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, color: a, cursor: "pointer", minHeight: TAP, padding: "0 4px 0 0" }}>← Inbox</button>
        <div style={{ ...h2, marginTop: 4 }}>{selected}</div>
        <div style={{ marginTop: 14 }}><Thread data={data} name={selected} accent={a} /></div>
        <div style={{ marginTop: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}><Field value={note} onChange={setNote} placeholder={"Post a note to " + selected.split(" ")[0] + "..."} /></div>
          <SendBtn accent={a} onClick={send} disabled={!note.trim()}>Post</SendBtn>
        </div>
      </div>
    );
  }

  // sort: waiting-on-you first, then those with any thread, then the rest
  const sorted = [...roster].sort((x, y) => {
    const wx = waitingOnInstructor(data, x.name) ? 2 : threadOf(data, x.name).length ? 1 : 0;
    const wy = waitingOnInstructor(data, y.name) ? 2 : threadOf(data, y.name).length ? 1 : 0;
    return wy - wx;
  });

  return (
    <div>
      <div style={h2}>You · Inbox</div>
      <Muted>Every message a student sends lands here.</Muted>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        {sorted.map(s => {
          const m = lastMsg(data, s.name);
          const waiting = waitingOnInstructor(data, s.name);
          const preview = m ? (m.kind === "got_it" ? "Thumbs up" : m.kind === "confused" ? "I'm confused" : m.kind === "meeting" ? "Requested a meeting" : m.kind === "question" ? "Q: " + m.text : m.text) : "No messages yet";
          return (
            <button key={s.name} onClick={() => setSelected(s.name)}
              style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid " + BORDER, borderRadius: 14, padding: 14, cursor: "pointer", fontFamily: F, display: "flex", alignItems: "center", gap: 12, minHeight: TAP }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: a + "22", border: "2px solid " + a + "55", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{s.name}</div>
                <div style={{ fontSize: 15, color: TEXT_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>
              </div>
              {waiting && <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: a, padding: "4px 10px", borderRadius: 999, flexShrink: 0 }}>Reply</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Exports used by ClassApp
// ─────────────────────────────────────────────────────────────
// Your card: the profile. For Andrew, the same key still opens the inbox, so
// a saved link keeps working.
export function YouDetail({ config, role, data, update, asStudent, setAsStudent }) {
  if (role === "instructor") return <InstructorYou config={config} data={data} update={update} />;
  return <StudentYou config={config} data={data} update={update} asStudent={asStudent} setAsStudent={setAsStudent} />;
}

// Messages: the student's thread with Andrew, or Andrew's inbox.
export function MessagesDetail({ config, role, data, update, asStudent }) {
  if (role === "instructor") return <InstructorYou config={config} data={data} update={update} />;
  return <StudentMessages config={config} data={data} update={update} asStudent={asStudent} />;
}

// The home page tile. Andrew's counts who is waiting on him; a student's
// shows the last thing said.
export function MessagesSummary({ config, role, data, asStudent }) {
  const a = config.accent;
  if (role === "instructor") {
    const waiting = (config.students || []).filter(s => waitingOnInstructor(data, s.name)).length;
    return waiting > 0
      ? <div><div style={{ fontSize: 22, fontWeight: 700, color: a }}>{waiting}</div><Muted>waiting on your reply</Muted></div>
      : <Muted>Inbox: no replies needed.</Muted>;
  }
  const m = lastMsg(data, asStudent);
  if (!m) return <Muted>No messages yet.</Muted>;
  if (m.from === "instructor") return <><div style={{ fontWeight: 600 }}>New note from instructor</div><Muted>Tap to read</Muted></>;
  const preview = m.kind === "got_it" ? "Thumbs up" : m.kind === "confused" ? "I'm confused" : m.kind === "meeting" ? "Requested a meeting" : m.kind === "question" ? "Q: " + m.text : m.text;
  return <div style={{ fontSize: 15, color: TEXT_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>You: {preview}</div>;
}
