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
import { shuffledFacts } from "./crashing-facts.js";

// The sponsor's palette, from the system rather than from here. `onCream` and
// `onYellow` are the two that carry words; everything else is a fill or a line.
const HT = BRAND.homeworkTubes;
const { yellow: YEL, green: GRN, blue: BLU, red: RED, orange: ORA, purple: PUR, pink: PNK, cream: CREAM } = HT;
const INK = HT.onYellow;

// The keyframes each theme's furniture needs. Mounted once by ThemeChrome.
// How long one item spends crossing the strip.
//
// A fixed duration was the wrong shape for this. The animation moves a
// proportion of the element rather than a distance, so a longer strip at the
// same duration is a faster strip: adding a championship between every class
// fact doubled the length and doubled the speed with it, and putting all
// hundred and four on there would have made the thing unreadable. The duration
// is computed from the number of items instead, so the apparent speed holds
// whatever goes on the banner.
export const MARQUEE_SECONDS_PER_ITEM = 3.2;
export const marqueeSeconds = (items) => Math.round(Math.max(items, 8) * MARQUEE_SECONDS_PER_ITEM);

export const CHROME_CSS = `
@keyframes tcMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes tcWave { 0%,100% { transform: rotate(-14deg); } 50% { transform: rotate(16deg); } }
@keyframes tcBob { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-9px) rotate(4deg); } }
@keyframes tcFlicker { 0%,100% { transform: rotate(-4deg) scale(1); } 50% { transform: rotate(6deg) scale(1.1); } }
@keyframes tcPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.24); } }
@keyframes tcTwinkle { 0%,100% { opacity: 1; transform: scale(1) rotate(0); } 50% { opacity: .35; transform: scale(.7) rotate(20deg); } }
@media (prefers-reduced-motion:reduce){
  .tc-anim,.tc-anim *{animation:none !important}
}
/* The page moves. --surface-page is a six-stop gradient on Crashing Out and was
   painting once and holding still, which is a gradient rather than a wobble.
   Set on the element carrying data-theme, so nothing has to know about it. */
[data-theme="crashing"]{background-size:300% 300% !important;animation:tcWobble 16s ease-in-out infinite}
@keyframes tcWobble { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@media (prefers-reduced-motion:reduce){ [data-theme="crashing"]{animation:none} }

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
export function ThemeTopper({ theme, lines = [], fixed, seed = 0 }) {
  if (theme !== "crashing") return null;
  // Some surfaces centre their content in a flex row, where a full-width strip
  // would become a squeezed sibling. Those pin it to the top of the viewport
  // instead of putting it in the flow.
  const seat = fixed
    ? { position: "fixed", top: 0, left: 0, right: 0, zIndex: 40 }
    : null;
  // Every championship in the file, in this reader's own order, with the class's
  // own news coming round every fifth item so a student's grade never scrolls
  // away for good. The result has nothing to do with anybody's grade, which is
  // the point: this is a class about sport and the banner has opinions.
  const own = (lines.length ? lines : ["THIS IS A CLASS", "YOU ARE DOING FINE"]).map(l => String(l).toUpperCase());
  const facts = shuffledFacts(seed);
  const mixed = [];
  facts.forEach((f, i) => {
    if (i % 5 === 0 && own.length) mixed.push(own[(i / 5) % own.length]);
    mixed.push(f);
  });
  const text = mixed.map(l => "★ " + l).join(" ") + " ★ ";
  const seconds = marqueeSeconds(mixed.length);
  return (
    <div className="tc-torn" style={{ background: INK, whiteSpace: "nowrap", padding: "9px 0",
      borderBottom: "3px solid " + PNK, ...seat }}>
      <div style={{ overflow: "hidden" }}>
      <div className="tc-anim" style={{ display: "inline-block", animation: `tcMarquee ${seconds}s linear infinite`,
        fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: YEL }}>{text.repeat(2)}</div>
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

// ─── stickers ───
// Crashing Out scatters marks that twinkle and pulse. Pinned to the page rather
// than in the flow, and pointer-events off, so nothing they land on stops
// working. Positions are fixed rather than random: a layout that moves every
// render is a layout nobody can point at.
const STICKERS = [
  { c: "\u2726", top: "12%", left: "2.5%", size: 30, anim: "tcTwinkle 1.6s ease-in-out infinite" },
  { c: "\u2665", top: "38%", right: "2%", size: 26, anim: "tcPulse 1.1s ease-in-out infinite" },
  { c: "\u2605", top: "68%", left: "1.5%", size: 24, anim: "tcTwinkle 2.1s ease-in-out infinite" },
  { c: "\u2726", top: "84%", right: "3.5%", size: 22, anim: "tcPulse 1.4s ease-in-out infinite" },
];
export function ThemeStickers({ theme }) {
  if (theme !== "crashing") return null;
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {STICKERS.map((s, i) => (
        <span key={i} className="tc-anim" style={{ position: "absolute", top: s.top, left: s.left, right: s.right,
          fontSize: s.size, color: [PNK, PUR, ORA, BLU][i % 4], animation: s.anim }}>{s.c}</span>
      ))}
    </div>
  );
}

// Tubey, half behind whatever he is standing next to.
export function TubeyPeek({ theme, size = 72 }) {
  if (theme !== "crashing") return null;
  return (
    <div aria-hidden="true" style={{ position: "absolute", right: -18, bottom: -14, pointerEvents: "none" }}>
      <Tubey size={size} title="Tubey the Worm" />
    </div>
  );
}

// ─── the story bar ───
// The row of hooped faces along the top of Snapchat, which is the single most
// recognisable thing about it. Your own story first, then the class.
export function StoryBar({ theme, roster = [], me, seenAfter = 5 }) {
  if (theme !== "snapchat" || !roster.length) return null;
  const others = roster.filter(s => s.name !== me).slice(0, 8);
  const hue = ["#0FADFF", "#A05FFF", "#3CBB57", "#FF8C1A", "#F23C57", "#2B7CE9", "#9B4DFF", "#0f766e"];
  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "2px 0 6px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: "none", width: 62 }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#fff", border: "3px solid #000",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900 }}>+</div>
        <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap" }}>your story</span>
      </div>
      {others.map((s, i) => (
        <div key={s.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: "none", width: 62 }}>
          <Avatar theme="snapchat" name={s.name} size={54} bg={hue[i % hue.length]} seen={i >= seenAfter} />
          <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden",
            textOverflow: "ellipsis", maxWidth: "100%", opacity: i >= seenAfter ? .5 : 1 }}>
            {String(s.name).split(" ")[0].toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

// The ghost and the score, which is where Snapchat puts your identity.
export function ThemeIdentity({ theme, points }) {
  if (theme !== "snapchat") return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div aria-hidden="true" style={{ width: 40, height: 40, borderRadius: "50%", background: "#000",
        color: "#FFFC00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flex: "none" }}>&#128123;</div>
      <span style={{ fontSize: 13, fontWeight: 800, opacity: .6, whiteSpace: "nowrap" }}>
        snap score {Math.round((points || 0) * 30 + 1208)}
      </span>
    </div>
  );
}

// The camera, in the middle of the bottom bar, bigger than everything beside it.
export function ThemeCamera({ theme }) {
  if (theme !== "snapchat") return null;
  return (
    <div aria-hidden="true" style={{ width: 58, height: 58, borderRadius: "50%", border: "4px solid #000",
      background: "#fff", boxShadow: "4px 4px 0 #000", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 24, flex: "none", marginTop: -14 }}>&#128247;</div>
  );
}

// ─── the leader talks ───
//
// Whoever is top of the in-class points turns up on Crashing Out and addresses
// the person looking at the screen. A leaderboard is a number in a card that
// nobody feels; a classmate saying the number out loud is a different thing.
//
// The line is picked off the gap between the two of you, so it says something
// true rather than something generic. Being first gets its own line, because
// the leader taunting themselves is a bug.
const LEAD_FAR = [
  "i am {gap} points ahead of you and i do think about that.",
  "{gap} points. i am not going to pretend i have not counted.",
  "you are {gap} behind. i say this with love and a spreadsheet.",
];
const LEAD_NEAR = [
  "{gap} points in it. i have started checking this between classes.",
  "you are {gap} back. that is nothing. that is one bad week for me.",
  "{gap} points. i can hear you.",
];
const LEAD_SELF = [
  "you are first. everyone can see that. no pressure.",
  "top of the class. the only way from here is the other way.",
  "first. enjoy the next four days.",
];
const pick = (list, seed) => list[Math.abs(seed || 0) % list.length];

export function ClassLeader({ theme, roster = [], log = [], me }) {
  if (theme !== "crashing" || !roster.length) return null;
  const points = (id) => (log || []).filter(e => e.studentId === id).reduce((n, e) => n + (e.amount || 0), 0);
  const ranked = roster.map(s => ({ ...s, pts: points(s.id) })).sort((a, b) => b.pts - a.pts);
  const leader = ranked[0];
  // Nobody has scored anything yet, so there is no leader to hear from.
  if (!leader || leader.pts <= 0) return null;

  const mine = ranked.find(s => s.name === me);
  const isMe = mine && mine.name === leader.name;
  const gap = Math.round(leader.pts - (mine ? mine.pts : 0));
  const seed = (me || "").length + (leader.name || "").length;
  const line = isMe ? pick(LEAD_SELF, seed)
    : pick(gap > 40 ? LEAD_FAR : LEAD_NEAR, seed).replace("{gap}", String(Math.max(gap, 1)));

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: "none" }}>
        <div style={{ position: "relative" }}>
          <Avatar theme="crashing" name={leader.name} size={62} bg={PUR} />
          <span aria-hidden="true" style={{ position: "absolute", top: -12, left: -10, fontSize: 24,
            transform: "rotate(-18deg)" }}>&#128081;</span>
        </div>
        <span style={{ fontFamily: "var(--font-label)", fontSize: 13, color: INK, maxWidth: 74,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {String(leader.name).split(" ")[0]}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0, background: "#fff", border: "3px solid " + PUR,
        borderRadius: "8px 26px 6px 22px", boxShadow: "3px 3px 0 " + YEL + ", 5px 5px 0 " + INK,
        transform: "rotate(-0.5deg)", padding: "12px 14px", position: "relative" }}>
        <span aria-hidden="true" style={{ position: "absolute", left: -11, top: 20, width: 15, height: 15,
          background: "#fff", borderLeft: "3px solid " + PUR, borderBottom: "3px solid " + PUR,
          transform: "rotate(45deg)" }} />
        <div style={{ fontFamily: "var(--font-label)", fontSize: 13, color: PUR, marginBottom: 3 }}>
          TOP OF THE CLASS
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.4, color: INK, position: "relative" }}>{line}</div>
      </div>
    </div>
  );
}

