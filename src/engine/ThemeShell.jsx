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
import { THEMES, THEME_LABELS, THEME_DESCS, MODES, MODE_LABELS, MODE_DESCS,
  hasNight, themeCSS, fontHref } from "./themes.js";

const keyOf = (config) => (config?.storageKey || "class") + "-theme";
const known = (v) => (THEMES.includes(v) ? v : "clean");
const knownMode = (v) => (MODES.includes(v) ? v : "auto");

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
  // Compact still names them. Four unlabelled swatches is a row of dots asking
  // you to guess, and Crashing Out and Snapchat are not colours somebody can
  // infer. Two columns, because four named pills do not fit across a menu.
  if (compact) {
    return (
      <div role="radiogroup" aria-label="Theme"
        style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
        {THEMES.map(t => (
          <button key={t} role="radio" aria-checked={t === on}
            title={THEME_DESCS[t]} onClick={() => onPick(t)}
            style={{ minHeight: 44, padding: "0 10px", borderRadius: 999, cursor: "pointer",
              background: "var(--surface-card)",
              border: t === on ? "2px solid var(--text-primary)" : "1px solid var(--line-strong)",
              display: "flex", alignItems: "center", gap: 8, minWidth: 0,
              fontFamily: "var(--font-body)", fontSize: 13,
              fontWeight: t === on ? 700 : 500, color: "var(--text-primary)" }}>
            <span aria-hidden="true" data-theme={t}
              style={{ width: 18, height: 18, flex: "none", borderRadius: 999, background: "var(--surface-page)",
                border: "2px solid var(--text-primary)", display: "block" }} />
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {THEME_LABELS[t]}
            </span>
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

// Day, night, or whatever this device says.
//
// Auto is the default because most people never touch it and the machine
// already knows. The other two exist because some people read in a bright room
// at night, or in a dark one at noon, and a preference the app cannot express
// is a preference the app is arguing with.
//
// Stored beside the theme, in the student's own browser, for the same reason:
// it is a fact about a screen rather than about a class.
export function useDayNight(config) {
  const key = (config?.storageKey || "class") + "-mode";
  const [mode, setMode] = useState(() => {
    try { return knownMode(localStorage.getItem(key)); } catch { return "auto"; }
  });
  useEffect(() => {
    const onPick = (e) => { if (e.detail?.key === key) setMode(knownMode(e.detail.mode)); };
    window.addEventListener("modepick", onPick);
    return () => window.removeEventListener("modepick", onPick);
  }, [key]);
  const pick = useCallback((next) => {
    const m = knownMode(next);
    setMode(m);
    try { localStorage.setItem(key, m); } catch { /* private mode */ }
    try { window.dispatchEvent(new CustomEvent("modepick", { detail: { key, mode: m } })); } catch { /* older browser */ }
  }, [key]);
  return [mode, pick];
}

// The control. Only drawn for a theme that has a night, because on Snapchat or
// Crashing Out these three buttons would all do the same nothing.
export function DayNightPicker({ theme, mode, onPick }) {
  if (!hasNight(known(theme))) return null;
  const on = knownMode(mode);
  return (
    <div role="radiogroup" aria-label="Day or night"
      style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
      {MODES.map(m => (
        <button key={m} role="radio" aria-checked={m === on}
          title={MODE_DESCS[m]} onClick={() => onPick(m)}
          style={{ minHeight: 44, padding: "0 8px", borderRadius: 999, cursor: "pointer",
            background: m === on ? "var(--text-primary)" : "var(--surface-card)",
            border: m === on ? "2px solid var(--text-primary)" : "1px solid var(--line-strong)",
            color: m === on ? "var(--surface-card)" : "var(--text-primary)",
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: m === on ? 700 : 500,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
