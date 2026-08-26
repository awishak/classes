// The instructor strip at the bottom of the front page: every dashboard, every
// room screen, every ask page, in one place.
//
// Gated by email, on the same Supabase auth the ask page already uses. Read
// this honestly: the gate hides the links from a visitor, and that is all it
// does. The dashboards themselves are still unlisted URLs that anybody who
// knows them can open, exactly as they were before this existed. Locking the
// surfaces themselves is a separate job and needs a check on the page, not on
// the link to it.

import { useState, useEffect } from "react";
import { sendSignInEmail, verifyEmailCode, emailFromRedirect } from "./engine/auth.js";
import { ENGINE_LIST, INSTRUCTOR_EMAILS } from "./config/registry.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = "#111827";
const INK2 = "#4b5563";
const MUTED = "#646b75";
const LINE = "#eef0f2";
const LINE2 = "#e5e7eb";
const TAP = 44;

const REMEMBER = "classes-instructor-email";
const label = { fontFamily: MONO, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: ".12em" };
const isInstructor = (addr) => INSTRUCTOR_EMAILS.includes((addr || "").toLowerCase());

const input = {
  width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid " + LINE2,
  fontFamily: F, fontSize: 16, minHeight: TAP, background: "#fff", color: INK,
};
const btn = (solid) => ({
  minHeight: TAP, padding: "0 18px", borderRadius: 999, cursor: "pointer", fontFamily: F,
  fontSize: 15, fontWeight: 600, border: "1px solid " + (solid ? INK : LINE2),
  background: solid ? INK : "#fff", color: solid ? "#fff" : INK,
});

export default function InstructorLinks() {
  const [who, setWho] = useState(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const v = localStorage.getItem(REMEMBER);
      if (v && isInstructor(v)) setWho(v);
    } catch { /* private mode */ }
    emailFromRedirect().then(addr => { if (addr) accept(addr); });
  }, []);

  const accept = (addr) => {
    if (!isInstructor(addr)) { setError("That address is not on the list."); return; }
    try { localStorage.setItem(REMEMBER, addr.toLowerCase()); } catch { /* private mode */ }
    setWho(addr.toLowerCase());
    setOpen(false);
  };

  const mail = async () => {
    const addr = email.trim().toLowerCase();
    if (!addr) { setError("Enter your email first."); return; }
    if (!isInstructor(addr)) { setError("That address is not on the list."); return; }
    setBusy(true); setError("");
    const r = await sendSignInEmail(addr, window.location.origin + "/");
    setBusy(false);
    if (r.ok) setSent(true); else setError(r.error);
  };

  const useCode = async () => {
    const addr = email.trim().toLowerCase();
    if (!addr || code.trim().length < 6) return;
    setBusy(true); setError("");
    const r = await verifyEmailCode(addr, code.trim());
    setBusy(false);
    if (r.ok) accept(r.email); else setError(r.error);
  };

  const signOut = () => {
    try { localStorage.removeItem(REMEMBER); } catch { /* private mode */ }
    setWho(null); setSent(false); setEmail(""); setCode("");
  };

  // ─── signed in: the whole teaching surface, in one grid ───
  if (who) {
    return (
      <div style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid " + LINE2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
          <span style={label}>Teaching</span>
          <button onClick={signOut}
            style={{ marginLeft: "auto", background: "none", border: "none", fontFamily: F, fontSize: 13, color: MUTED, cursor: "pointer" }}>
            {who} · sign out
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ENGINE_LIST.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              background: "#fff", border: "1px solid " + LINE, borderRadius: 12, padding: "10px 14px" }}>
              <span style={{ minWidth: 78, fontSize: 13, fontWeight: 700, color: c.accent }}>{c.code}</span>
              <span style={{ flex: 1, minWidth: 120, fontSize: 14, color: INK2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              {[["/dashboard", "Dashboard"], ["/today", "Room"], ["/ask", "Ask"]].map(([suffix, name]) => (
                <a key={suffix} href={c.path + suffix}
                  style={{ display: "inline-flex", alignItems: "center", minHeight: 36, padding: "0 12px",
                    borderRadius: 999, border: "1px solid " + (suffix === "/dashboard" ? c.accent : LINE2),
                    color: suffix === "/dashboard" ? c.accent : INK2, fontSize: 13, fontWeight: 600,
                    textDecoration: "none", whiteSpace: "nowrap" }}>{name}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <a href="/plan" style={{ fontSize: 14, fontWeight: 600, color: INK, textDecoration: "none" }}>The Brief →</a>
        </div>
      </div>
    );
  }

  // ─── closed ───
  if (!open) {
    return (
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid " + LINE2, textAlign: "center" }}>
        <button onClick={() => setOpen(true)}
          style={{ background: "none", border: "none", fontFamily: F, fontSize: 13, color: MUTED, cursor: "pointer", minHeight: TAP }}>
          Instructor sign-in
        </button>
      </div>
    );
  }

  // ─── signing in ───
  return (
    <div style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid " + LINE2 }}>
      <div style={{ ...label, marginBottom: 10 }}>Instructor sign-in</div>
      {sent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 340 }}>
          <div style={{ fontSize: 15, color: INK2, lineHeight: 1.5 }}>
            Sent a link to {email.trim().toLowerCase()}. Click it, or paste the six-digit code from the same email.
          </div>
          <input value={code} onChange={e => { setCode(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") useCode(); }}
            inputMode="numeric" placeholder="Six-digit code" style={input} />
          {error ? <div style={{ fontSize: 14, color: "#dc2626", fontWeight: 600 }}>{error}</div> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={useCode} disabled={busy} style={btn(true)}>{busy ? "Checking…" : "Sign in"}</button>
            <button onClick={() => { setSent(false); setCode(""); setError(""); }} style={btn(false)}>Back</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 340 }}>
          <input value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") mail(); }}
            type="email" placeholder="Your email" style={input} autoFocus />
          {error ? <div style={{ fontSize: 14, color: "#dc2626", fontWeight: 600 }}>{error}</div> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={mail} disabled={busy} style={btn(true)}>{busy ? "Sending…" : "Email me a link"}</button>
            <button onClick={() => { setOpen(false); setError(""); }} style={btn(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
