// Ask page — where the QR on the room screen lands. Students sign in with the
// same accounts the classes already use: pick your name, enter your 6-digit
// PIN. The PIN lives in data.pins, keyed by student name; a student with no PIN
// set yet just picks their name, which matches how the older classes behave.
//
// Confidential, not anonymous: I see who asked unless they tick the box, and
// the room screen never shows a name either way.

import { useState, useEffect } from "react";
import { useQuestions } from "./questions.js";
import { useClassData } from "./store.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#eef0f2";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";
const RED = "#dc2626";

const input = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: 48, background: "#fff", color: TEXT_PRIMARY };
const bigBtn = (bg) => ({ ...input, minHeight: 48, cursor: "pointer", fontWeight: 600, border: "none", background: bg, color: "#fff", textAlign: "center" });

// Sort by last name, the way the roster reads in the room.
const byLast = (a, b) => {
  const last = (n) => n.trim().split(/\s+/).slice(-1)[0].toLowerCase();
  return last(a).localeCompare(last(b)) || a.localeCompare(b);
};

export default function AskPage({ config }) {
  const { add } = useQuestions(config.storageKey);
  const [data] = useClassData(config.storageKey);
  const REMEMBER = config.storageKey + "-user";

  const [who, setWho] = useState(null);
  const [picking, setPicking] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = config.code + " — Ask";
    try { const v = localStorage.getItem(REMEMBER); if (v) setWho(v); } catch { /* private mode */ }
  }, [config.code, REMEMBER]);

  const students = (data?.students || config.students || []).map(s => s.name).filter(n => n !== config.testStudent);
  const pins = data?.pins || {};

  const signIn = () => {
    const correct = pins[picking];
    if (correct && pin !== String(correct)) { setError("Wrong PIN"); setPin(""); return; }
    if (remember) { try { localStorage.setItem(REMEMBER, picking); } catch { /* private mode */ } }
    setWho(picking);
  };

  const send = () => {
    if (!text.trim()) return;
    add({ text: text.trim(), who: anon ? "" : who, anon });
    setText(""); setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  const wrap = { minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", justifyContent: "center", padding: "40px 20px" };
  const card = { width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 };
  const header = (
    <>
      <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600 }}>{config.code} · {config.name}</div>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>Ask me anything</h1>
    </>
  );

  // ─── PIN step ───
  if (!who && picking) {
    const needsPin = !!pins[picking];
    return (
      <div style={wrap}>
        <div style={card}>
          {header}
          <div style={{ fontSize: 20, fontWeight: 600 }}>{picking}</div>
          {needsPin ? (
            <>
              <input autoFocus type="password" inputMode="numeric" maxLength={6} value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                onKeyDown={e => e.key === "Enter" && signIn()}
                placeholder="6-digit PIN"
                style={{ ...input, textAlign: "center", fontSize: 22, fontWeight: 600, letterSpacing: ".3em" }} />
              {error ? <div style={{ color: RED, fontWeight: 500, textAlign: "center" }}>{error}</div> : null}
            </>
          ) : (
            <div style={{ color: TEXT_SECONDARY, lineHeight: 1.5 }}>No PIN set on your account yet, so this is just your name for now.</div>
          )}
          <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 15, color: TEXT_SECONDARY, cursor: "pointer", minHeight: 44 }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 20, height: 20 }} />
            Remember me on this device
          </label>
          <button onClick={signIn} style={bigBtn(config.accent)}>Sign in</button>
          <button onClick={() => { setPicking(null); setPin(""); setError(""); }}
            style={{ ...input, minHeight: 44, cursor: "pointer", fontWeight: 500, color: TEXT_SECONDARY, background: "#fff", textAlign: "center" }}>Back</button>
        </div>
      </div>
    );
  }

  // ─── name step ───
  if (!who) {
    return (
      <div style={wrap}>
        <div style={card}>
          {header}
          <p style={{ margin: 0, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
            Find your name. I see who asked; the class never does.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {students.slice().sort(byLast).map(n => (
              <button key={n} onClick={() => { setPicking(n); setPin(""); setError(""); }}
                style={{ ...input, minHeight: 52, textAlign: "left", cursor: "pointer", fontWeight: 500, border: "1px solid " + BORDER }}>
                {n}
              </button>
            ))}
            {students.length === 0 ? <div style={{ color: TEXT_MUTED }}>No roster loaded yet.</div> : null}
          </div>
        </div>
      </div>
    );
  }

  // ─── ask step ───
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
        <button onClick={send} disabled={!text.trim()} style={bigBtn(text.trim() ? config.accent : BORDER_STRONG)}>Send</button>
        {sent ? <div style={{ color: config.accent, fontWeight: 600, fontSize: 15 }}>Sent. Ask another any time.</div> : null}
        <button onClick={() => { setWho(null); setPicking(null); try { localStorage.removeItem(REMEMBER); } catch { /* private mode */ } }}
          style={{ background: "none", border: "none", color: TEXT_MUTED, fontSize: 14, cursor: "pointer", textAlign: "left", padding: 0, marginTop: 4 }}>
          Not {who}?
        </button>
      </div>
    </div>
  );
}
