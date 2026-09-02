// The theme, on a student's own screen.
//
// A theme is one attribute. `data-theme` on a surface's root picks which block
// of custom properties applies, and every colour in the engine is one of those
// properties, so nothing re-renders and nothing needs threading through.
//
// The choice is the student's and it lives in their browser, not in the class
// store. Two reasons. A theme is a preference about a screen rather than a fact
// about a class, and the class store is shared, so writing a theme there would
// mean one student's taste changing the site for thirty people.

import { useState, useEffect, useCallback } from "react";
import { THEMES, THEME_LABELS, THEME_DESCS, themeCSS, fontHref } from "./themes.js";

const keyOf = (config) => (config?.storageKey || "class") + "-theme";
const known = (v) => (THEMES.includes(v) ? v : "clean");

export function useStudentTheme(config) {
  const key = keyOf(config);
  // Read on the first render so the page never flashes Clean at somebody who
  // chose Crashing Out.
  const [theme, setTheme] = useState(() => {
    try { return known(localStorage.getItem(key)); } catch { return "clean"; }
  });
  useEffect(() => {
    const onPick = (e) => { if (e.detail?.key === key) setTheme(known(e.detail.theme)); };
    window.addEventListener("themepick", onPick);
    return () => window.removeEventListener("themepick", onPick);
  }, [key]);
  // Every surface this student has open follows, which matters when the phone
  // and the laptop are both on the class site.
  const pick = useCallback((next) => {
    const t = known(next);
    setTheme(t);
    try { localStorage.setItem(key, t); } catch { /* private mode */ }
    try { window.dispatchEvent(new CustomEvent("themepick", { detail: { key, theme: t } })); } catch { /* older browser */ }
  }, [key]);
  return [theme, pick];
}

// The stylesheet and the fonts one theme needs. Every theme's block ships, so
// switching is instant; only the font file for the chosen theme is fetched.
export function ThemeStyle({ theme }) {
  return (
    <>
      <link rel="stylesheet" href={fontHref(known(theme))} />
      <style>{themeCSS()}</style>
    </>
  );
}

// The switcher. Named, described, and always reachable: a student who picked
// Crashing Out in week one has to be able to get back out of it in week two.
export function ThemePicker({ theme, onPick, compact }) {
  const on = known(theme);
  if (compact) {
    return (
      <div role="radiogroup" aria-label="Theme" style={{ display: "flex", gap: 4 }}>
        {THEMES.map(t => (
          <button key={t} role="radio" aria-checked={t === on} aria-label={THEME_LABELS[t]}
            title={THEME_LABELS[t] + " · " + THEME_DESCS[t]} onClick={() => onPick(t)}
            style={{ width: 44, height: 44, padding: 0, borderRadius: 999, cursor: "pointer",
              background: "var(--surface-card)", border: t === on ? "2px solid var(--text-primary)" : "1px solid var(--line-strong)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span aria-hidden="true" data-theme={t}
              style={{ width: 20, height: 20, borderRadius: 999, background: "var(--surface-page)",
                border: "2px solid var(--text-primary)", display: "block" }} />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label="Theme" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {THEMES.map(t => (
        <button key={t} role="radio" aria-checked={t === on} onClick={() => onPick(t)}
          style={{ minHeight: 44, padding: "12px 16px", textAlign: "left", cursor: "pointer",
            borderRadius: "var(--card-radius)", background: "var(--surface-card)",
            border: t === on ? "2px solid var(--text-primary)" : "var(--card-border)",
            display: "flex", alignItems: "center", gap: 14, fontFamily: "var(--font-body)" }}>
          <span aria-hidden="true" data-theme={t}
            style={{ width: 34, height: 34, flex: "none", borderRadius: 999, background: "var(--surface-page)",
              border: "2px solid var(--text-primary)", display: "block" }} />
          <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>{THEME_LABELS[t]}</span>
            <span style={{ fontSize: 15, color: "var(--text-muted)" }}>{THEME_DESCS[t]}</span>
          </span>
          {t === on ? <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>On</span> : null}
        </button>
      ))}
    </div>
  );
}
