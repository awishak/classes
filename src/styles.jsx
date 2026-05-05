// ─── SHARED STYLES + THEME MODULE ─────────────────────────────────────
// Imported by Comm118.jsx, Comm4.jsx, Comm2.jsx and their related files
// (Grades.jsx, Grades4.jsx, Comm2Grades.jsx, GameSystem.jsx, etc.).
// Single source of truth for color palette, typography, reusable inline-style
// objects, and the theme system (Clean / Locked In / Crashing Out).

import React, { useState, useEffect } from "react";


// ─── COLOR PALETTE ────────────────────────────────────────────────────
export const BG = "#ffffff";
export const BORDER = "#f3f4f6";
export const BORDER_STRONG = "#e5e7eb";
export const TEXT_PRIMARY = "#111827";
export const TEXT_SECONDARY = "#4b5563";
export const TEXT_MUTED = "#9ca3af";
export const GREEN = "#10b981";
export const RED = "#ef4444";
export const AMBER = "#f59e0b";
export const PURPLE = "#8b5cf6";

// ─── LAYOUT ───────────────────────────────────────────────────────────
export const CONTAINER_MAX = 960;

// ─── CLASS CONSTANTS ─────────────────────────────────────────────────
// These are shared across all three classes. Used in roster filtering,
// admin checks, etc.
export const ADMIN_NAME = "Andrew Ishak";
export const TEST_STUDENT = "Bruce Willis";
export const GUEST_NAME = "__guest__";

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────
export const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── REUSABLE INLINE STYLE OBJECTS ────────────────────────────────────
// These match the Comm 118 style values. Comm 4 and Comm 2 had slightly
// different values (e.g., pill padding 8px vs 7px); unifying to Comm 118
// values for consistency across classes.

export const crd = {
  background: "#fff", borderRadius: 14, border: "1px solid #d1d5db", overflow: "hidden",
  boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)",
};

export const pill = {
  padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
  fontFamily: F, border: "none", transition: "all 0.15s", letterSpacing: "-0.005em",
};
export const pillActive = { ...pill, background: "#111827", color: "#fff" };
export const pillInactive = { ...pill, background: "#f3f4f6", color: "#4b5563" };

export const bt = {
  padding: "9px 18px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, cursor: "pointer",
  fontFamily: F, fontWeight: 700, fontSize: 13, transition: "all 0.15s",
  background: "#fff", color: "#4b5563", letterSpacing: "-0.005em",
};

export const sectionLabel = {
  fontSize: 10, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase",
  letterSpacing: "0.1em", fontFamily: F,
};

export const linkPill = {
  padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
  fontFamily: F, border: "none", background: "#f3f4f6", color: TEXT_PRIMARY,
  transition: "all 0.15s", letterSpacing: "-0.005em",
};

export const inp = {
  background: "#fff", border: "1.5px solid " + BORDER_STRONG, borderRadius: 10,
  padding: "10px 14px", color: TEXT_PRIMARY, fontFamily: F, fontSize: 15, fontWeight: 500,
  outline: "none", width: "100%", boxSizing: "border-box",
};
export const sel = { ...inp, width: "auto" };

// ─── DOM-LEVEL FONT + RESPONSIVE GRID INJECTION ───────────────────────
// Inject Outfit font + a small set of responsive grid + animation rules
// into <head>. Idempotent — safe to call multiple times.
export function injectGlobalStyles() {
  if (typeof document === "undefined") return;
  if (!document.getElementById("outfit-font")) {
    const link = document.createElement("link");
    link.id = "outfit-font";
    link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (!document.getElementById("class-app-responsive")) {
    const style = document.createElement("style");
    style.id = "class-app-responsive";
    style.textContent = `
      body { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; background: #ffffff; }
      .schedule-days { grid-template-columns: 1fr !important; }
      .home-grid { grid-template-columns: 1fr !important; }
      @media (min-width: 700px) { .schedule-days { grid-template-columns: repeat(3, 1fr) !important; } }
      @media (min-width: 700px) { .schedule-days[data-cols="2"] { grid-template-columns: repeat(2, 1fr) !important; } }
      @media (min-width: 700px) { .home-grid { grid-template-columns: 1fr 1fr !important; } }
      @keyframes tickerPulse { 0% { transform: scale(1.15); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    `;
    document.head.appendChild(style);
  }
}

// Run on import — once per page load.
injectGlobalStyles();

// ─── THEME SYSTEM (Clean / Locked In / Crashing Out) ─────────────────

export const THEMES = ["clean", "locked", "crashing", "snap"];
export const THEME_LABELS = { clean: "Clean", locked: "Locked In", crashing: "Crashing Out", snap: "Snapchat" };
export const THEME_DESCS = {
  clean: "Calm and minimal",
  locked: "Bold and confident",
  crashing: "Maximum chaos",
  snap: "Yellow, ephemeral, kinda thirsty",
};

// useTheme takes the class's storage key and reads/writes that class's theme.
// Each class has its own theme stored under `${storageKey}-theme`.
// The custom "themechange" event keeps multiple useTheme() calls in the same
// page in sync (e.g. Nav and HomeView both listen).
export function useTheme(storageKey) {
  const themeKey = storageKey + "-theme";
  const [theme, setThemeRaw] = useState(() => {
    try { return localStorage.getItem(themeKey) || "clean"; } catch(e) { return "clean"; }
  });
  useEffect(() => {
    const onChange = (e) => setThemeRaw(e.detail);
    window.addEventListener("themechange", onChange);
    return () => window.removeEventListener("themechange", onChange);
  }, []);
  const setTheme = (t) => {
    try { localStorage.setItem(themeKey, t); } catch(e) {}
    setThemeRaw(t);
    try { window.dispatchEvent(new CustomEvent("themechange", { detail: t })); } catch(e) {}
  };
  const cycleTheme = () => {
    const i = THEMES.indexOf(theme);
    setTheme(THEMES[(i + 1) % THEMES.length]);
  };
  return { theme, setTheme, cycleTheme };
}

// ─── STYLE HELPERS ──────────────────────────────────────────────────────

// Page background by theme
export function themedPageBg(theme) {
  if (theme === "locked") return "#f3f4f6";
  if (theme === "crashing") {
    return "linear-gradient(135deg, #fce7f3 0%, #fef3c7 20%, #dbeafe 40%, #ddd6fe 60%, #fbcfe8 80%, #fef3c7 100%)";
  }
  if (theme === "snap") return "#FFFC00";
  return "#fafaf9";
}

// Heading font by theme. Default font passed in so each importer keeps its own brand font.
export function themedHeadingFont(theme, defaultFont) {
  if (theme === "crashing") return "'Rubik Mono One', 'Bricolage Grotesque', 'Outfit', sans-serif";
  if (theme === "locked") return "'Space Grotesk', 'Outfit', -apple-system, sans-serif";
  if (theme === "snap") return "'Nunito', 'Avenir Next', -apple-system, sans-serif";
  return defaultFont;
}

// Body font (only used where headings differ from body)
export function themedBodyFont(theme, defaultFont) {
  return themedHeadingFont(theme, defaultFont);
}

// Theme accent color. Default accent passed in for Clean.
export function themedAccent(theme, defaultAccent) {
  if (theme === "locked") return "#dc2626";
  if (theme === "crashing") return "#ec4899";
  // Snap keeps the class accent so each class retains its identity
  return defaultAccent;
}

// Crashing Out card border palette — rotates through these for variety.
export const CRASHING_PALETTE = [
  { border: "#ec4899", shadow1: "#f59e0b", shadow2: "#1f2937" },
  { border: "#0ea5e9", shadow1: "#a855f7", shadow2: "#1f2937" },
  { border: "#16a34a", shadow1: "#ec4899", shadow2: "#1f2937" },
  { border: "#f59e0b", shadow1: "#0ea5e9", shadow2: "#1f2937" },
  { border: "#a855f7", shadow1: "#16a34a", shadow2: "#1f2937" },
  { border: "#dc2626", shadow1: "#0ea5e9", shadow2: "#1f2937" },
];

// Quieter interior card style for theme. Used by Schedule, Assignments, Activities,
// Boards, Leaderboard, Roster, More. No rotation on interior cards.
export function themedInteriorCrd(theme, idx) {
  if (theme === "locked") {
    return {
      background: "#fff", borderRadius: 12, border: "2px solid #1f2937", overflow: "hidden",
      boxShadow: "inset 0 -3px 0 #dc2626, 0 2px 6px rgba(17, 24, 39, 0.12)",
    };
  }
  if (theme === "crashing") {
    const p = CRASHING_PALETTE[(idx || 0) % CRASHING_PALETTE.length];
    return {
      background: "#fff", borderRadius: 14, border: "3px solid " + p.border, overflow: "hidden",
      boxShadow: "4px 4px 0 " + p.shadow1 + ", 6px 6px 0 " + p.shadow2,
    };
  }
  if (theme === "snap") {
    return {
      background: "#fff", borderRadius: 16, border: "3px solid #000", overflow: "hidden",
      boxShadow: "4px 4px 0 #000",
    };
  }
  return {
    background: "#fff", borderRadius: 14, border: "1px solid #d1d5db", overflow: "hidden",
    boxShadow: "0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)",
  };
}

// ─── PIXEL ART COMPONENTS (used in Crashing Out) ───────────────────────

export function PixelStar({ top, right, left, bottom, delay = 0, color = "#fbbf24" }) {
  const size = 24;
  return (
    <div style={{
      position: "absolute", top, right, left, bottom, width: size, height: size, zIndex: 5,
      animation: "pixelStarTwinkle 1.6s ease-in-out infinite",
      animationDelay: delay + "s",
      pointerEvents: "none",
    }}>
      <svg viewBox="0 0 24 24" width={size} height={size} shapeRendering="crispEdges">
        <rect x="10" y="2" width="4" height="4" fill={color} />
        <rect x="8" y="6" width="2" height="2" fill={color} />
        <rect x="14" y="6" width="2" height="2" fill={color} />
        <rect x="6" y="8" width="2" height="2" fill={color} />
        <rect x="16" y="8" width="2" height="2" fill={color} />
        <rect x="2" y="10" width="4" height="4" fill={color} />
        <rect x="6" y="10" width="12" height="4" fill={color} opacity="0.7" />
        <rect x="18" y="10" width="4" height="4" fill={color} />
        <rect x="6" y="14" width="2" height="2" fill={color} />
        <rect x="16" y="14" width="2" height="2" fill={color} />
        <rect x="8" y="16" width="2" height="2" fill={color} />
        <rect x="14" y="16" width="2" height="2" fill={color} />
        <rect x="10" y="18" width="4" height="4" fill={color} />
      </svg>
    </div>
  );
}

export function PixelArrow({ bottom, left, top, right, delay = 0, color = "#ec4899" }) {
  const size = 28;
  return (
    <div style={{
      position: "absolute", bottom, left, top, right, width: size, height: size, zIndex: 5,
      animation: "pixelArrowBounce 0.9s ease-in-out infinite",
      animationDelay: delay + "s",
      pointerEvents: "none",
    }}>
      <svg viewBox="0 0 28 28" width={size} height={size} shapeRendering="crispEdges">
        <rect x="12" y="2" width="4" height="4" fill={color} />
        <rect x="10" y="6" width="8" height="2" fill={color} />
        <rect x="8" y="8" width="12" height="2" fill={color} />
        <rect x="6" y="10" width="16" height="2" fill={color} />
        <rect x="12" y="12" width="4" height="14" fill={color} />
      </svg>
    </div>
  );
}

export function PixelHeart({ top, right, left, bottom, delay = 0 }) {
  const size = 26;
  return (
    <div style={{
      position: "absolute", top, right, left, bottom, width: size, height: size, zIndex: 5,
      animation: "pixelHeartPulse 1.1s ease-in-out infinite",
      animationDelay: delay + "s",
      pointerEvents: "none",
    }}>
      <svg viewBox="0 0 26 26" width={size} height={size} shapeRendering="crispEdges">
        <rect x="4" y="4" width="6" height="2" fill="#dc2626" />
        <rect x="16" y="4" width="6" height="2" fill="#dc2626" />
        <rect x="2" y="6" width="10" height="4" fill="#dc2626" />
        <rect x="14" y="6" width="10" height="4" fill="#dc2626" />
        <rect x="4" y="6" width="2" height="2" fill="#fca5a5" />
        <rect x="16" y="6" width="2" height="2" fill="#fca5a5" />
        <rect x="2" y="10" width="22" height="2" fill="#dc2626" />
        <rect x="4" y="12" width="18" height="2" fill="#dc2626" />
        <rect x="6" y="14" width="14" height="2" fill="#dc2626" />
        <rect x="8" y="16" width="10" height="2" fill="#dc2626" />
        <rect x="10" y="18" width="6" height="2" fill="#dc2626" />
        <rect x="12" y="20" width="2" height="2" fill="#dc2626" />
      </svg>
    </div>
  );
}

export function PixelMushroom({ top, right, left, bottom, delay = 0 }) {
  const size = 28;
  return (
    <div style={{
      position: "absolute", top, right, left, bottom, width: size, height: size, zIndex: 5,
      animation: "pixelWiggle 1.4s ease-in-out infinite",
      animationDelay: delay + "s",
      pointerEvents: "none",
    }}>
      <svg viewBox="0 0 28 28" width={size} height={size} shapeRendering="crispEdges">
        <rect x="8" y="2" width="12" height="2" fill="#dc2626" />
        <rect x="6" y="4" width="16" height="2" fill="#dc2626" />
        <rect x="4" y="6" width="20" height="4" fill="#dc2626" />
        <rect x="8" y="6" width="4" height="4" fill="#fff" />
        <rect x="16" y="6" width="4" height="4" fill="#fff" />
        <rect x="2" y="10" width="24" height="2" fill="#dc2626" />
        <rect x="6" y="10" width="4" height="2" fill="#fff" />
        <rect x="14" y="10" width="2" height="2" fill="#fff" />
        <rect x="18" y="10" width="4" height="2" fill="#fff" />
        <rect x="2" y="12" width="24" height="2" fill="#dc2626" />
        <rect x="8" y="14" width="12" height="6" fill="#fef3c7" />
        <rect x="10" y="16" width="2" height="2" fill="#1f2937" />
        <rect x="16" y="16" width="2" height="2" fill="#1f2937" />
        <rect x="8" y="20" width="12" height="4" fill="#fef3c7" />
      </svg>
    </div>
  );
}

export function PixelCoin({ top, right, left, bottom, delay = 0 }) {
  const size = 22;
  return (
    <div style={{
      position: "absolute", top, right, left, bottom, width: size, height: size, zIndex: 5,
      animation: "pixelCoinSpin 1.2s linear infinite",
      animationDelay: delay + "s",
      pointerEvents: "none",
    }}>
      <svg viewBox="0 0 22 22" width={size} height={size} shapeRendering="crispEdges">
        <rect x="8" y="2" width="6" height="2" fill="#fbbf24" />
        <rect x="6" y="4" width="2" height="2" fill="#fbbf24" />
        <rect x="14" y="4" width="2" height="2" fill="#fbbf24" />
        <rect x="4" y="6" width="2" height="10" fill="#fbbf24" />
        <rect x="16" y="6" width="2" height="10" fill="#fbbf24" />
        <rect x="6" y="6" width="10" height="10" fill="#fde047" />
        <rect x="9" y="7" width="4" height="2" fill="#f59e0b" />
        <rect x="9" y="9" width="2" height="6" fill="#f59e0b" />
        <rect x="6" y="16" width="2" height="2" fill="#fbbf24" />
        <rect x="14" y="16" width="2" height="2" fill="#fbbf24" />
        <rect x="8" y="18" width="6" height="2" fill="#fbbf24" />
      </svg>
    </div>
  );
}

export function PixelLightning({ top, right, left, bottom, delay = 0 }) {
  const size = 22;
  return (
    <div style={{
      position: "absolute", top, right, left, bottom, width: size, height: size, zIndex: 5,
      animation: "pixelFlash 0.8s ease-in-out infinite",
      animationDelay: delay + "s",
      pointerEvents: "none",
    }}>
      <svg viewBox="0 0 22 22" width={size} height={size} shapeRendering="crispEdges">
        <rect x="10" y="0" width="6" height="2" fill="#fde047" />
        <rect x="8" y="2" width="6" height="2" fill="#fde047" />
        <rect x="6" y="4" width="6" height="2" fill="#fde047" />
        <rect x="4" y="6" width="6" height="2" fill="#fde047" />
        <rect x="2" y="8" width="10" height="2" fill="#fde047" />
        <rect x="6" y="10" width="6" height="2" fill="#fde047" />
        <rect x="4" y="12" width="6" height="2" fill="#fde047" />
        <rect x="2" y="14" width="6" height="2" fill="#fde047" />
        <rect x="0" y="16" width="6" height="2" fill="#fde047" />
      </svg>
    </div>
  );
}

// ─── COPY (used by leaderboard speech bubbles + crashing marquee) ──────

export const TRASH_TALK = [
  "I'm winning",
  "I'm beating you",
  "That A is mine",
  "hey you gotta lock in my dude",
  "have you seen these?",
  "catch up",
  "stay mad",
];

export const ENCOURAGEMENT = [
  "hell yeah dude",
  "let's go",
  "snooby wooby!",
  "you are confident. you are capable",
  "i believe in you",
  "let __NAME__ cook!",
  "you've got this",
  "lock in",
  "we're built for this",
];

export const CHAMPIONSHIPS = ["Super Bowl", "World Series", "NBA Finals"];

export function randomChampionshipLine() {
  const year = 1989 + Math.floor(Math.random() * (2026 - 1989 + 1));
  const event = CHAMPIONSHIPS[Math.floor(Math.random() * CHAMPIONSHIPS.length)];
  return year + " " + event;
}

// ─── SNAP THEME COPY ────────────────────────────────────────────────────

export const SNAP_TALK = [
  "screenshot this real quick",
  "main character behavior fr",
  "they said and i quote: nothing",
  "ratio'd by __NAME__",
  "this you?",
  "best friend goals",
  "no bc why are u like this",
  "the audacity to lock in",
  "new pfp activated",
  "send this to your bsf",
  "streak is safe",
  "POV: you got the receipts",
  "she ate. left no crumbs",
];

// ─── SNAP THEME COMPONENTS ──────────────────────────────────────────────

// Cute Snapchat-style ghost. Three variants for visual variety.
export function SnapGhost({ top, right, left, bottom, delay = 0, size = 36, variant = 1 }) {
  const style = { position: "absolute", top, right, left, bottom, animation: "ghostBob 3s ease-in-out infinite", animationDelay: delay + "s", pointerEvents: "none" };
  // variant 1: basic smile, variant 2: winking, variant 3: tongue out
  return (
    <div style={style}>
      <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        {/* Ghost body — rounded top, wavy bottom */}
        <path d="M32 4 C18 4 10 14 10 28 L10 54 L14 50 L18 54 L22 50 L26 54 L30 50 L34 54 L38 50 L42 54 L46 50 L50 54 L54 50 L54 28 C54 14 46 4 32 4 Z" fill="#fff" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        {/* Eyes */}
        {variant === 2 ? (
          <>
            <path d="M22 24 Q26 20 30 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="40" cy="24" r="2.5" fill="#000" />
          </>
        ) : (
          <>
            <circle cx="24" cy="24" r="2.5" fill="#000" />
            <circle cx="40" cy="24" r="2.5" fill="#000" />
          </>
        )}
        {/* Mouth */}
        {variant === 3 ? (
          <>
            <ellipse cx="32" cy="36" rx="6" ry="4" fill="#ec4899" stroke="#000" strokeWidth="2" />
            <path d="M32 38 L32 44" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <path d="M26 34 Q32 40 38 34" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        )}
        {/* Cheek blush */}
        <circle cx="20" cy="32" r="3" fill="#fbcfe8" opacity="0.8" />
        <circle cx="44" cy="32" r="3" fill="#fbcfe8" opacity="0.8" />
      </svg>
    </div>
  );
}

// Fixed-position fire-streak counter shown when theme is snap. Reads game points
// from data.log for the given studentId. Shows "🔥 N" with a wiggle animation.
export function SnapStreakCounter({ data, studentId, top = 56 }) {
  if (!studentId) return null;
  const log = data?.log || [];
  const total = log.filter(e => e.studentId === studentId).reduce((s, e) => s + (e.amount || 0), 0);
  const display = Math.round(total);
  return (
    <div style={{ position: "fixed", top, right: 12, zIndex: 60, pointerEvents: "none" }}>
      <div style={{
        background: "#fff", border: "2.5px solid #000", borderRadius: 999,
        padding: "5px 12px", boxShadow: "3px 3px 0 #000",
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "'Nunito', -apple-system, sans-serif", fontWeight: 900, fontSize: 14, color: "#000",
      }}>
        <span style={{ display: "inline-block", animation: "streakFlicker 0.8s ease-in-out infinite" }}>🔥</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{display}</span>
      </div>
    </div>
  );
}

// Wraps an avatar (img) with a Snapchat-story-style gradient ring.
// Use anywhere a roster/leaderboard photo appears when theme === "snap".
export function SnapStoryRing({ children, size = 56 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", padding: 2.5,
      background: "linear-gradient(135deg, #FFFC00 0%, #ec4899 50%, #a855f7 100%)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fff", padding: 2, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ─── SHARED CSS for keyframes (pixel art animations + page wobble) ──────
// Inject this once at the top level of any class app's render tree when the
// theme is "crashing". It's safe to inject multiple times — duplicate
// keyframes are harmless.
export const THEME_KEYFRAMES_CSS = `
  @keyframes pixelStarTwinkle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7) rotate(20deg); } }
  @keyframes pixelArrowBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes pixelHeartPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.25); } }
  @keyframes pixelWiggle { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
  @keyframes pixelCoinSpin { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(-1); } }
  @keyframes pixelFlash { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  @keyframes pageWobble { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes ghostBob { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-8px) rotate(3deg); } }
  @keyframes snapPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
  @keyframes streakFlicker { 0%, 100% { transform: rotate(-4deg) scale(1); } 50% { transform: rotate(6deg) scale(1.1); } }
  @keyframes storyRingSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

// Returns the Google Fonts URL for the given theme, or null for clean.
export function themedFontsUrl(theme) {
  if (theme === "locked") return "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap";
  if (theme === "crashing") return "https://fonts.googleapis.com/css2?family=Rubik+Mono+One&family=Press+Start+2P&display=swap";
  if (theme === "snap") return "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap";
  return null;
}
