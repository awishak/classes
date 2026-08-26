// One PIN, checked on the server, in front of anything that is mine.
//
// Wraps the Dashboard, and the same hook drives the teaching links on the front
// page. Once it is right the browser remembers it, so the podium machine asks
// once and the laptop asks once.
//
// The room screen and the ask page stay open on purpose: one lives on a
// projector that students look at and the other is where they are sent.

import { useState, useEffect, useCallback } from "react";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = "#111827";
const INK2 = "#4b5563";
const MUTED = "#646b75";
const LINE2 = "#e5e7eb";
const BG = "#fafaf9";
const TAP = 44;

const KEY = "classes-instructor-pin";

export async function checkPin(pin) {
  try {
    const res = await fetch("/api/instructor-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.ok) return { ok: true };
    return { ok: false, error: body.error || "That PIN does not match." };
  } catch {
    return { ok: false, error: "Could not reach the sign-in check." };
  }
}

// null while we are still asking, true / false once we know.
export function useInstructor() {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let alive = true;
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch { /* private mode */ }
    if (!saved) { setOk(false); return; }
    // Re-checked on every load rather than trusted, so revoking is a matter of
    // changing the env var.
    checkPin(saved).then(r => {
      if (!alive) return;
      if (!r.ok) { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
      setOk(r.ok);
    });
    return () => { alive = false; };
  }, []);

  const signIn = useCallback(async (pin) => {
    const r = await checkPin(pin);
    if (r.ok) {
      try { localStorage.setItem(KEY, pin); } catch { /* private mode */ }
      setOk(true);
    }
    return r;
  }, []);

  const signOut = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* private mode */ }
    setOk(false);
  }, []);

  return { ok, signIn, signOut };
}

export function PinForm({ title, note, onDone, compact }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!pin.trim()) return;
    setBusy(true); setError("");
    const r = await onDone(pin.trim());
    setBusy(false);
    if (!r.ok) { setError(r.error); setPin(""); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 300 }}>
      {title ? <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: ".12em" }}>{title}</div> : null}
      {note ? <div style={{ fontSize: 15, color: INK2, lineHeight: 1.5 }}>{note}</div> : null}
      <input autoFocus type="password" inputMode="numeric" value={pin}
        onChange={e => { setPin(e.target.value); setError(""); }}
        onKeyDown={e => { if (e.key === "Enter") go(); }}
        placeholder="PIN"
        style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid " + LINE2,
          fontFamily: F, fontSize: 16, minHeight: TAP, background: "#fff", color: INK }} />
      {error ? <div style={{ fontSize: 14, color: "#dc2626", fontWeight: 600 }}>{error}</div> : null}
      <button onClick={go} disabled={busy}
        style={{ minHeight: TAP, borderRadius: 999, border: "none", background: INK, color: "#fff",
          fontFamily: F, fontSize: 16, fontWeight: 600, cursor: busy ? "default" : "pointer" }}>
        {busy ? "Checking…" : "Sign in"}
      </button>
      {compact ? null : (
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
          This browser remembers it once it is right.
        </div>
      )}
    </div>
  );
}

// Wraps a whole surface.
export default function InstructorGate({ what, children }) {
  const { ok, signIn } = useInstructor();

  if (ok === null) {
    return <div style={{ minHeight: "100vh", background: BG, fontFamily: F, display: "grid", placeItems: "center", color: MUTED }}>Checking…</div>;
  }
  if (ok) return children;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: INK, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 300 }}>
        <PinForm title={what || "Instructor"} note="This screen is mine." onDone={signIn} />
      </div>
    </div>
  );
}
