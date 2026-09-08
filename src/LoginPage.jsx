// The front door. Everyone signs in here, the same way.
//
// Email and a six-digit code in one form, and "Email me a code" under it for
// anyone without theirs. The box takes the permanent code or the one from
// the email; session.js tries both. After sign-in the roster says where to go:
// a student in one class goes there, a student in two picks here, and the
// instructor lands on the front page. ?next= sends somebody back to the page
// they were trying to open.

import { useEffect, useState } from "react";
import { signInWithCode, sendCode, takeRedirect, getSession, whereTo, signOut } from "./engine/session.js";
import { loadClass } from "./engine/store.js";
import { currentClasses } from "./config/registry.js";
import * as TOKENS from "./engine/tokens.js";

const F = TOKENS.FONT.body;
const MONO = TOKENS.FONT.label;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BORDER_STRONG = TOKENS.LINE.strong;
const BG = TOKENS.SURFACE.page;
const LATE = TOKENS.STATE.late;
const TAP = 44;

const input = { width: "100%", boxSizing: "border-box", fontFamily: F, fontSize: 16, padding: "12px 14px",
  border: "1px solid " + BORDER_STRONG, borderRadius: 12, background: "#fff", color: TEXT_PRIMARY, minHeight: TAP };
const button = { width: "100%", minHeight: TAP, borderRadius: 12, border: "none", fontFamily: F, fontSize: 16, fontWeight: 600, cursor: "pointer" };

// Every current class's roster, for whereTo. Five small loads, once.
async function rosters() {
  const list = currentClasses();
  const out = await Promise.all(list.map(async cls => {
    const data = await loadClass(cls.storageKey).catch(() => null);
    return { cls, students: (data && data.students) || cls.students || [] };
  }));
  return out;
}

const go = (path) => { window.location.href = path; };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [picking, setPicking] = useState(null);   // classes to choose from
  const [nobody, setNobody] = useState("");

  const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") || "" : "";
  const safeNext = /^\/[a-z0-9-]+(\/[a-z0-9-]+)*\/?$/.test(next) ? next : "";

  // Land the person. Called with a fresh session, and on arrival when one is
  // already kept, so a signed-in student who opens /login goes straight in.
  const land = async (session) => {
    const where = whereTo(session.user.email, await rosters());
    if (where.kind === "nobody") { setNobody(session.user.email); return; }
    if (safeNext && where.kind !== "nobody") return go(safeNext);
    if (where.kind === "pick") { setPicking(where.classes); return; }
    go(where.path);
  };

  useEffect(() => {
    (async () => {
      const fromLink = await takeRedirect();
      const s = fromLink || getSession();
      if (s) { setBusy(true); await land(s); setBusy(false); }
    })();
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    const r = await signInWithCode(email, code);
    if (!r.ok) { setError(r.error); setBusy(false); return; }
    await land(r.session);
    setBusy(false);
  };

  const mail = async () => {
    setError(""); setBusy(true);
    const r = await sendCode(email);
    setBusy(false);
    if (!r.ok) setError(r.error); else setSent(true);
  };

  const leave = async () => { await signOut(); setNobody(""); setPicking(null); setCode(""); };

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: TEXT_MUTED, marginBottom: 18 }}>Ishak Classes</div>
      <div style={{ width: 360, maxWidth: "100%", background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {picking ? (
          <>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>Which class?</h1>
            <p style={{ margin: 0, fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5 }}>You are on more than one roster. Pick the class to open.</p>
            {picking.map(c => (
              <button key={c.id} onClick={() => go(c.path)} style={{ ...button, background: c.accent, color: "#fff", textAlign: "left", padding: "0 16px" }}>
                {c.code} · {c.name}
              </button>
            ))}
            <button onClick={leave} style={{ ...button, background: "none", color: TEXT_MUTED, fontWeight: 500 }}>Not you? Sign out</button>
          </>
        ) : nobody ? (
          <>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>You are signed in, but not in a class yet.</h1>
            <p style={{ margin: 0, fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              {nobody} is not on any roster this term. Ask Andrew to add that address, then come back.
            </p>
            <button onClick={leave} style={{ ...button, background: TEXT_PRIMARY, color: "#fff" }}>Sign out</button>
          </>
        ) : (
          <>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>Sign in</h1>
            <p style={{ margin: 0, fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              Your email and your six-digit code. No code yet? Have one emailed to you below.
            </p>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@scu.edu"
                autoComplete="email" aria-label="Email" style={input} />
              <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} required
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="6-digit code" aria-label="Six-digit code"
                style={{ ...input, fontFamily: MONO, letterSpacing: ".3em", textAlign: "center", fontSize: 20, fontWeight: 600 }} />
              <button type="submit" disabled={busy || !email.trim() || code.length < 6} style={{ ...button, background: TEXT_PRIMARY, color: "#fff", opacity: busy ? .7 : 1 }}>
                {busy ? "Signing in" : "Sign in"}
              </button>
              {error ? <div style={{ fontSize: 14, color: LATE, fontWeight: 600 }}>{error}</div> : null}
            </form>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
              <span style={{ flex: 1, height: 1, background: BORDER_STRONG }} />
              <span style={{ fontFamily: MONO, fontSize: 13, letterSpacing: ".1em", color: TEXT_MUTED }}>OR</span>
              <span style={{ flex: 1, height: 1, background: BORDER_STRONG }} />
            </div>
            {sent ? (
              <p style={{ margin: 0, fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.5, textAlign: "center" }}>
                Check your email. Type the code from the message into the box above, or tap the link in the email.
              </p>
            ) : (
              <>
                <button type="button" onClick={mail} disabled={busy} style={{ ...button, background: "#fff", border: "1px solid " + BORDER_STRONG, color: TEXT_PRIMARY }}>
                  Email me a code
                </button>
                <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, textAlign: "center" }}>
                  Once you are in, the site shows you your own code. That code never expires.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
