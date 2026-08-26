// The instructor strip at the bottom of the front page: every dashboard, every
// room screen, every ask page, in one place.
//
// This used to email a sign-in link. That needed two things configured inside
// the Supabase project that are not in this repo — the redirect allowlist, and
// a mail template carrying {{ .Token }} so the six-digit code was actually in
// the message — and neither was, so the link went nowhere and the email had no
// code in it. One PIN, checked on the server, replaces the whole arrangement.

import { useState } from "react";
import { ENGINE_LIST } from "./config/registry.js";
import { useInstructor, PinForm } from "./InstructorGate.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = "#111827";
const INK2 = "#4b5563";
const MUTED = "#646b75";
const LINE = "#eef0f2";
const LINE2 = "#e5e7eb";
const TAP = 44;

const label = { fontFamily: MONO, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: ".12em" };

export default function InstructorLinks() {
  const { ok, signIn, signOut } = useInstructor();
  const [open, setOpen] = useState(false);

  if (ok) {
    return (
      <div style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid " + LINE2 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
          <span style={label}>Teaching</span>
          <button onClick={signOut}
            style={{ marginLeft: "auto", background: "none", border: "none", fontFamily: F, fontSize: 13, color: MUTED, cursor: "pointer" }}>
            sign out
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

  return (
    <div style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid " + LINE2 }}>
      <PinForm title="Instructor sign-in" onDone={signIn} />
      <button onClick={() => setOpen(false)}
        style={{ marginTop: 10, background: "none", border: "none", fontFamily: F, fontSize: 14, color: MUTED, cursor: "pointer", minHeight: TAP }}>
        Cancel
      </button>
    </div>
  );
}
