// Ask page — where the QR code on the room screen lands. Students sign in with
// their school email once (kept in this browser), then send a question that
// shows up on my Dashboard.
//
// Confidential, not anonymous: I see who asked unless they tick the box, and
// even then the class never sees a name. This is an honor-system gate, not real
// auth — anyone who knows a class email can post as that address.

import { useState, useEffect } from "react";
import { useQuestions } from "./questions.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";

const input = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: 48, background: "#fff", color: TEXT_PRIMARY };

export default function AskPage({ config }) {
  const { add } = useQuestions(config.storageKey);
  const KEY = "ask:" + config.id;
  const [who, setWho] = useState(null);
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = config.code + " — Ask";
    try { const v = localStorage.getItem(KEY); if (v) setWho(v); } catch { /* private mode */ }
  }, [config.code, KEY]);

  const domain = config.emailDomain || "scu.edu";
  const signIn = () => {
    const e = email.trim().toLowerCase();
    if (!e.endsWith("@" + domain)) return;
    try { localStorage.setItem(KEY, e); } catch { /* private mode */ }
    setWho(e);
  };

  const send = () => {
    if (!text.trim()) return;
    add({ text: text.trim(), who: anon ? "" : who, anon });
    setText(""); setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  const wrap = { minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", justifyContent: "center", padding: "40px 20px" };
  const card = { width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 14 };

  if (!who) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600 }}>{config.code}</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>Ask me anything</h1>
          <p style={{ margin: 0, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
            Sign in with your {domain} email. I see who asked; the class never does.
          </p>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && signIn()}
            type="email" autoComplete="email" placeholder={"you@" + domain} style={input} />
          <button onClick={signIn} disabled={!email.trim().toLowerCase().endsWith("@" + domain)}
            style={{ ...input, minHeight: 48, cursor: "pointer", fontWeight: 600, border: "none",
              background: email.trim().toLowerCase().endsWith("@" + domain) ? config.accent : BORDER_STRONG,
              color: "#fff", textAlign: "center" }}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600 }}>{config.code} · {who}</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>Ask me anything</h1>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's your question?"
          style={{ ...input, minHeight: 130, resize: "vertical", lineHeight: 1.5 }} />
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 15, color: TEXT_SECONDARY, cursor: "pointer", minHeight: 44 }}>
          <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ width: 20, height: 20 }} />
          Send this one anonymously
        </label>
        <button onClick={send} disabled={!text.trim()}
          style={{ ...input, minHeight: 48, cursor: "pointer", fontWeight: 600, border: "none",
            background: text.trim() ? config.accent : BORDER_STRONG, color: "#fff", textAlign: "center" }}>
          Send
        </button>
        {sent ? <div style={{ color: config.accent, fontWeight: 600, fontSize: 15 }}>Sent. Ask another any time.</div> : null}
        <a href={config.path} style={{ color: TEXT_MUTED, fontSize: 14, textDecoration: "none", marginTop: 6 }}>← {config.name}</a>
      </div>
    </div>
  );
}
