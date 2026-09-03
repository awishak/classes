// What makes a theme a theme, past the palette.
//
// The first pass moved colour, type and card treatment into custom properties
// and called that a theme. It was not one. Snapchat is story rings, a streak
// that flickers, and the status diamond it already uses for sent, delivered and
// opened. Crashing Out is a marquee, a mascot who talks, five typefaces on one
// screen, and a sponsor. None of that is a colour.
//
// So a theme can also mount furniture. Every piece below is one component that
// renders nothing at all for the themes that do not want it, which is why the
// surfaces can call them unconditionally and Clean stays clean.
//
// Tubey the Worm belongs to Homework Tubes and appears by arrangement. He is not
// permitted to help with anybody's homework, and he says so himself.

import { THEME, BRAND } from "./themes.js";

// The sponsor's palette, from the system rather than from here. `onCream` and
// `onYellow` are the two that carry words; everything else is a fill or a line.
const HT = BRAND.homeworkTubes;
const { yellow: YEL, green: GRN, blue: BLU, red: RED, orange: ORA, purple: PUR, pink: PNK, cream: CREAM } = HT;
const INK = HT.onYellow;

// The keyframes each theme's furniture needs. Mounted once by ThemeChrome.
export const CHROME_CSS = `
@keyframes tcMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes tcWave { 0%,100% { transform: rotate(-14deg); } 50% { transform: rotate(16deg); } }
@keyframes tcBob { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-9px) rotate(4deg); } }
@keyframes tcFlicker { 0%,100% { transform: rotate(-4deg) scale(1); } 50% { transform: rotate(6deg) scale(1.1); } }
@keyframes tcPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@media (prefers-reduced-motion:reduce){
  .tc-anim,.tc-anim *{animation:none !important}
}
/* A torn bottom edge. Two gradients rather than a clip-path, because a clip
   would take the drop shadows with it, and the shadows are half the theme. */
.tc-torn{position:relative}
.tc-torn::after{content:"";position:absolute;left:0;right:0;bottom:-11px;height:12px;
  background:
    linear-gradient(-45deg, transparent 0 8px, ${PNK} 8px 100%) 0 0/18px 12px repeat-x,
    linear-gradient(45deg, transparent 0 8px, ${PNK} 8px 100%) 0 0/18px 12px repeat-x;
  -webkit-mask:linear-gradient(#000,#000);mask:linear-gradient(#000,#000);
  transform:scaleY(-1)}
`;

// ─── Tubey ───
// Blobby on purpose: four segments getting fatter toward the head, eyes too big
// and pointing slightly different ways, a grin wider than the mouth should be,
// mismatched antennae. A worm who lives in a tube should not look engineered.
export function Tubey({ size = 84, title = "Tubey the Worm" }) {
  return (
    <svg viewBox="0 0 120 100" width={size} height={Math.round(size * 100 / 120)}
      role="img" aria-label={title} className="tc-anim"
      style={{ display: "block", overflow: "visible", animation: "tcBob 2.6s ease-in-out infinite", flex: "none" }}>
      <ellipse cx="20" cy="72" rx="13" ry="12" fill="#2f9e49" stroke={INK} strokeWidth="4" />
      <ellipse cx="38" cy="76" rx="16" ry="15" fill="#35ad51" stroke={INK} strokeWidth="4" />
      <ellipse cx="60" cy="73" rx="20" ry="19" fill={GRN} stroke={INK} strokeWidth="4" />
      <path d="M74 34 q-6 -16 2 -23" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="77" cy="9" r="5.5" fill={PNK} stroke={INK} strokeWidth="3" />
      <path d="M98 33 q8 -12 16 -14" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="115" cy="17" r="5" fill={YEL} stroke={INK} strokeWidth="3" />
      <ellipse cx="87" cy="57" rx="27" ry="25" fill="#4ecb69" stroke={INK} strokeWidth="4" />
      <ellipse cx="79" cy="52" rx="9.5" ry="11" fill="#fff" stroke={INK} strokeWidth="3" />
      <ellipse cx="99" cy="53" rx="8.5" ry="10" fill="#fff" stroke={INK} strokeWidth="3" />
      <circle cx="82.5" cy="55" r="4.2" fill={INK} />
      <circle cx="96" cy="56.5" r="4" fill={INK} />
      <path d="M76 69 q12 12 25 1" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <ellipse cx="67" cy="68" rx="6" ry="4" fill={PNK} opacity=".5" />
      <ellipse cx="108" cy="68" rx="6" ry="4" fill={PNK} opacity=".5" />
    </svg>
  );
}

// He talks. He is contractually barred from being useful.
const TUBEY_LINES = [
  "hi. i live in the tubes. i am not allowed near your assignment but i am rooting for you extremely hard.",
  "i read every reading. i cannot tell you what happens. i can tell you it is short.",
  "if you are behind, being behind on purpose and being behind by accident feel identical. pick one and act like it.",
  "i have said the wrong thing in a mall in front of two hundred people. you can post on the board.",
];
export const tubeyLine = (seed) => TUBEY_LINES[Math.abs(seed || 0) % TUBEY_LINES.length];

export function TubeySays({ theme, seed = 0 }) {
  if (theme !== "crashing") return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <Tubey size={68} />
      <div style={{ flex: 1, minWidth: 0, background: "#fff", border: "3px solid " + INK, borderRadius: "26px 8px 22px 6px",
        boxShadow: "3px 3px 0 " + BLU, transform: "rotate(0.4deg)", padding: "12px 14px", position: "relative" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: -11, top: 22, width: 16, height: 16,
          background: "#fff", borderLeft: "3px solid " + INK, borderBottom: "3px solid " + INK, transform: "rotate(45deg)" }} />
        <div style={{ fontSize: 15, lineHeight: 1.4, color: INK, position: "relative" }}>{tubeyLine(seed)}</div>
      </div>
    </div>
  );
}

// ─── the strip across the top ───
// Crashing Out puts a marquee above everything. Nothing else does.
export function ThemeTopper({ theme, lines = [], fixed }) {
  if (theme !== "crashing") return null;
  // Some surfaces centre their content in a flex row, where a full-width strip
  // would become a squeezed sibling. Those pin it to the top of the viewport
  // instead of putting it in the flow.
  const seat = fixed
    ? { position: "fixed", top: 0, left: 0, right: 0, zIndex: 40 }
    : null;
  const text = (lines.length ? lines : ["THIS IS A CLASS", "YOU ARE DOING FINE"])
    .map(l => "★ " + String(l).toUpperCase()).join(" ") + " ★ ";
  return (
    <div className="tc-torn" style={{ background: INK, whiteSpace: "nowrap", padding: "9px 0",
      borderBottom: "3px solid " + PNK, ...seat }}>
      <div style={{ overflow: "hidden" }}>
      <div className="tc-anim" style={{ display: "inline-block", animation: "tcMarquee 22s linear infinite",
        fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: YEL }}>{text.repeat(4)}</div>
      </div>
    </div>
  );
}

// ─── the sponsor ───
// Crashing Out is brought to you by Homework Tubes. The retired catchphrase
// stays retired, on the advice of their counsel.
export function ThemeSponsor({ theme, compact }) {
  if (theme !== "crashing") return null;
  return (
    <a href={HT.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: CREAM, border: "3px solid " + INK, borderRadius: "30px 8px 26px 6px",
        boxShadow: "4px 4px 0 " + RED + ", 6px 6px 0 " + INK, transform: "rotate(-0.5deg)",
        padding: compact ? "12px 14px" : "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <Tubey size={compact ? 44 : 54} title="Tubey the Worm, the Homework Tubes mascot" />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-label)", fontSize: 13, color: HT.onCream }}>BROUGHT TO YOU BY</span>
          <span style={{ fontFamily: "'Lilita One', cursive", fontSize: compact ? 22 : 30, color: INK, lineHeight: 1.05 }}>
            HOMEWORK TUBES<span style={{ fontSize: ".5em", verticalAlign: "super" }}>&trade;</span>
          </span>
        </div>
        <span style={{ fontFamily: "'Bangers', cursive", fontSize: compact ? 17 : 22, color: HT.onYellow, whiteSpace: "nowrap",
          minHeight: 44, display: "flex", alignItems: "center", padding: "0 16px", background: YEL,
          border: "3px solid " + INK, borderRadius: 999, boxShadow: "3px 3px 0 " + INK }}>HOMEWORKTUBES.COM</span>
      </div>
    </a>
  );
}

export function ThemeLegal({ theme }) {
  if (theme !== "crashing") return null;
  return (
    <div style={{ fontSize: 13, lineHeight: 1.45, color: INK, opacity: .62 }}>
      Tubey&trade; appears courtesy of Homework Tubes Inc. Tubey is not permitted to complete, assist with,
      or provide answers to any assignment in this class. Anything Tubey says is his own opinion.
    </div>
  );
}

// ─── the badge in the corner ───
// Snapchat counts a streak. The number is the student's own points, which is a
// real fact wearing a flame.
export function ThemeBadge({ theme, points }) {
  if (theme !== "snapchat" || points == null) return null;
  return (
    <div style={{ background: "#fff", border: "2.5px solid #000", borderRadius: 999, padding: "6px 14px",
      boxShadow: "3px 3px 0 #000", display: "inline-flex", alignItems: "center", gap: 7,
      fontWeight: 900, fontSize: 15, color: "#000", flex: "none" }}>
      <span className="tc-anim" aria-hidden="true"
        style={{ display: "inline-block", animation: "tcFlicker .8s ease-in-out infinite" }}>&#128293;</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(points)}</span>
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>points</span>
    </div>
  );
}

// ─── a face ───
// Snapchat rings an avatar the way a story is ringed. Everything else draws a
// circle. `seen` greys the ring, which is the difference between a story you
// have opened and one you have not.
export function Avatar({ theme, name, size = 44, bg, seen }) {
  const initials = String(name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const face = (
    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: bg || "var(--text-primary)",
      color: "var(--surface-card)", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: Math.round(size / 3) }}>{initials}</div>
  );
  if (theme !== "snapchat") {
    return <div style={{ width: size, height: size, flex: "none" }}>{face}</div>;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", padding: 2.5, flex: "none",
      background: seen ? "#d6d0c8" : "linear-gradient(135deg,#FFFC00 0%,#ec4899 50%,#a855f7 100%)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#fff", padding: 2,
        boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>{face}</div>
    </div>
  );
}

// ─── a status mark ───
// Snapchat already has a grammar for sent, delivered and opened, and an
// assignment has the same three states. Filled means new, hollow means you have
// been here before. Every other theme draws a dot.
const MARK = { live: "var(--state-live)", ok: "var(--state-ok)", warn: "var(--state-warn)", late: "var(--state-late)" };
export function StatusMark({ theme, tone = "live", open = false, label }) {
  const color = MARK[tone] || MARK.live;
  const common = { flex: "none", display: "inline-block" };
  if (theme === "snapchat") {
    return <span role="img" aria-label={label} title={label}
      style={{ ...common, width: 15, height: 15, borderRadius: 3, transform: "rotate(45deg)",
        background: open ? "transparent" : color, border: open ? "2.5px solid " + color : "none" }} />;
  }
  return <span role="img" aria-label={label} title={label}
    style={{ ...common, width: 8, height: 8, borderRadius: "50%", background: color }} />;
}

// Nothing in Crashing Out is a rounded rectangle.
//
// Each card takes its own border colour, its own shadow colour, four different
// corner radii and a fraction of a degree of tilt, so a grid reads as a stack
// of things somebody put down rather than six copies of one box. The tilt stays
// under a degree on purpose: enough to look hand-placed, small enough that
// nothing overlaps its neighbour.
//
// Clip-path would cut a better corner and would also clip the shadows off,
// which is the part doing the work here. So the cutting is done with radii.
const ROTATE = [
  { b: PNK, s: ORA, r: "28px 6px 24px 8px",  t: "-0.7deg" },
  { b: BLU, s: PUR, r: "8px 30px 6px 26px",  t: "0.6deg" },
  { b: GRN, s: PNK, r: "26px 26px 4px 20px", t: "-0.4deg" },
  { b: ORA, s: BLU, r: "6px 22px 28px 6px",  t: "0.8deg" },
  { b: PUR, s: GRN, r: "24px 8px 8px 28px",  t: "-0.6deg" },
  { b: RED, s: BLU, r: "10px 26px 22px 4px", t: "0.5deg" },
];
export function cardStyle(theme, i = 0) {
  if (theme !== "crashing") {
    return { background: "var(--surface-card)", border: "var(--card-border)",
      boxShadow: "var(--card-shadow)", borderRadius: "var(--card-radius)" };
  }
  const p = ROTATE[Math.abs(i) % ROTATE.length];
  return { background: "#fff", border: "3px solid " + p.b, borderRadius: p.r,
    boxShadow: "4px 4px 0 " + p.s + ", 6px 6px 0 " + INK, transform: "rotate(" + p.t + ")" };
}

// The one mount a themed surface needs: keyframes, plus the fonts the furniture
// uses that the palette does not already ask for.
export function ThemeChrome({ theme }) {
  return (
    <>
      {/* The faces arrive with the theme, from THEME_FONTS. This used to load
          Lilita One on its own, which meant a surface mounting the palette
          without the furniture drew its labels in a fallback. */}
      <style>{CHROME_CSS}</style>
    </>
  );
}

export const hasChrome = (theme) => theme === "crashing" || theme === "snapchat";
export const THEME_KEYS = Object.keys(THEME);
