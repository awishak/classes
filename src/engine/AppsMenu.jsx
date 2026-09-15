// The Apps button, at the right end of the top bar on every surface.
//
// Andrew, 2026-09-15: "top bar has apps. Apps are the same, the only
// difference is I have access to more than they do. and the More on the nav
// or on the bottom card is basically the admin menu, both in instructor view
// and in student view." So this button holds apps and nothing else; the
// theme, the account and the class settings are on More.

import { useState, useEffect } from "react";
import * as TOKENS from "./tokens.js";
import { appsFor } from "./apps.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const LINE_STRONG = TOKENS.LINE.strong;
const TAP = TOKENS.TAP;

export default function AppsMenu({ config, role = "instructor", onPick }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!config) return null;

  const row = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", minHeight: TAP,
    padding: "0 14px", background: "none", border: "none", borderRadius: 10, cursor: "pointer",
    fontFamily: F, fontSize: 16, fontWeight: 500, color: TEXT_PRIMARY, textAlign: "left", textDecoration: "none" };
  const chevron = <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1, color: TEXT_MUTED }}>›</span>;

  return (
    <div style={{ position: "relative", flex: "none" }}>
      <button className="dash-focus ca-focus repo-focus" onClick={() => setOpen(v => !v)}
        aria-haspopup="menu" aria-expanded={open} aria-label="Menu"
        style={{ minHeight: TAP, padding: "0 14px", borderRadius: 999, cursor: "pointer",
          background: "var(--surface-card)", border: "1px solid " + LINE_STRONG,
          fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY,
          display: "inline-flex", alignItems: "center", gap: 8 }}>Apps<span aria-hidden="true" style={{ fontSize: 13, color: TEXT_MUTED }}>▾</span></button>
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div role="menu" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 41,
            width: 260, maxWidth: "calc(100vw - 32px)", padding: 6, background: "var(--surface-card)", border: "var(--card-border)",
            borderRadius: "var(--card-radius)", boxShadow: "0 20px 44px -14px rgba(23,19,16,.34)" }}>
            {appsFor(config, role).map(app => {
              const card = app.card && onPick;
              return card ? (
                <button key={app.id} role="menuitem" className="dash-focus ca-focus repo-focus" style={row}
                  onClick={() => { setOpen(false); onPick(app.card); }}>{app.label}{chevron}</button>
              ) : (
                <a key={app.id} role="menuitem" className="dash-focus ca-focus repo-focus" style={row}
                  href={app.href || config.path + "/" + app.card}>{app.label}{chevron}</a>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
