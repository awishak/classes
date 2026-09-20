// The slide templates: what an item looks like on the room screen.
//
// Designed on the Room Slides canvas (2026-09-14) and built from it. Three rules
// came with them from Andrew, and each one is a line in how this file works:
//
//   No words he did not write. Every piece of text here is read off the block,
//   the row or the class: a title, a headline, content, notes, a source, a due
//   date. Nothing is filled in. A field that is empty is left out.
//   Nothing in the corners. No kind label, no "activity", no link parked in the
//   bottom right. A link lives on the words that already name the thing.
//   Notes on a slide are his call per item: `notes` only arrives when the row
//   asks for them.
//
// One stage, 1280 by 720, in Outfit on paper or slate. The room screen scales
// the stage to fill the wall; the dashboard's thumbnails scale it to 200px wide.

import { useEffect, useState } from "react";
import { SLIDE, TEXT } from "./tokens.js";
import { GameDuring, GameSpread, GameQuestions, GameQuestion, GameTeams } from "./GameSlides.jsx";

const FONT = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const W = 1280;
const H = 720;
const CRIMSON = SLIDE.crimson;
export const GROUNDS = { paper: SLIDE.paper, slate: SLIDE.slate };

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

// A link on the words that already name the thing.
function L({ url, children, underline }) {
  if (!url) return children;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: "inherit", textDecoration: underline ? "underline" : "none", textUnderlineOffset: 6 }}>{children}</a>
  );
}

// Words with their web addresses made into links.
function Linked({ text, accent }) {
  return String(text || "").split(/(https?:\/\/[^\s<>"')]+)/g).map((p, i) => (i % 2
    ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" style={{ color: accent, textDecoration: "underline", textUnderlineOffset: 6, overflowWrap: "anywhere" }}>{p}</a>
    : p));
}

// The picture an article's own page names, read through the class site's reader.
function useLeadImage(url, have) {
  const [img, setImg] = useState(have || "");
  useEffect(() => {
    if (have || !url || typeof fetch === "undefined") return undefined;
    let alive = true;
    fetch("/api/read?url=" + encodeURIComponent(url))
      .then(r => r.json())
      .then(d => { if (alive && d && d.ok && d.image) setImg(d.image); })
      .catch(() => {});
    return () => { alive = false; };
  }, [url, have]);
  return img;
}

// Fill the viewport with the stage, keeping its shape.
function useFit(fit) {
  const [s, setS] = useState(1);
  useEffect(() => {
    if (!fit || typeof window === "undefined") return undefined;
    const size = () => setS(Math.min(window.innerWidth / W, window.innerHeight / H));
    size();
    window.addEventListener("resize", size);
    return () => window.removeEventListener("resize", size);
  }, [fit]);
  return s;
}

const Bullets = ({ list, size, g }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: Math.round(size * 0.6) }}>
    {list.map((n, i) => (
      <div key={i} style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
        <div style={{ flex: "none", width: 14, height: 14, borderRadius: 3, background: g.accent, transform: `translateY(-${Math.round(size * 0.22)}px)` }} />
        <div style={{ fontSize: size, lineHeight: 1.25, fontWeight: 500, textWrap: "pretty" }}><Linked text={n} accent={g.accent} /></div>
      </div>
    ))}
  </div>
);

const Site = ({ s, g }) => (s.site ? (
  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "0.02em", color: g.accent }}><L url={s.url}>{s.site}</L></div>
) : null);

// ─── the templates ───

function Section({ s, g }) {
  return (
    <div style={{ position: "absolute", left: 110, right: 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 36 }}>
      <div style={{ width: 110, height: 10, borderRadius: 5, background: g.accent }} />
      <div style={{ fontSize: 132, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 0.98 }}>{s.title}</div>
    </div>
  );
}

function Item({ s, g }) {
  const notes = s.notes || [];
  const long = notes.length > 4 || notes.some(n => n.length > 60);
  if (!notes.length) {
    return (
      <div style={{ position: "absolute", left: 110, right: 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <div style={{ fontSize: (s.headline || s.title).length > 70 ? 68 : 88, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.02, textWrap: "balance" }}>
          <L url={s.url}>{s.headline || s.title}</L>
        </div>
        {s.sub ? <div style={{ fontSize: 40, color: g.dim, lineHeight: 1.3, whiteSpace: "pre-wrap" }}><Linked text={s.sub} accent={g.accent} /></div> : null}
        <Site s={s} g={g} />
      </div>
    );
  }
  if (long) {
    return (
      <div style={{ position: "absolute", left: 110, right: 110, top: 84, bottom: 72, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05 }}><L url={s.url}>{s.headline || s.title}</L></div>
          {s.sub ? <div style={{ fontSize: 30, color: g.dim, lineHeight: 1.3 }}><Linked text={s.sub} accent={g.accent} /></div> : null}
        </div>
        <Bullets list={notes} size={notes.length > 6 ? 30 : 38} g={g} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 0, bottom: 0, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 72, alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 68, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.04, textWrap: "balance" }}><L url={s.url}>{s.headline || s.title}</L></div>
        {s.sub ? <div style={{ fontSize: 34, color: g.dim, lineHeight: 1.3 }}><Linked text={s.sub} accent={g.accent} /></div> : null}
        <Site s={s} g={g} />
      </div>
      <div style={{ paddingLeft: 56, borderLeft: "3px solid " + g.rule }}><Bullets list={notes} size={44} g={g} /></div>
    </div>
  );
}

// Two looks an item or a section's name can wear instead of plain type: a
// sticky note and an index card. Made things, for a line worth stopping on.
// The paper is the same on either ground, so the ink is set here and not read
// off the ground. Notes shown on the slide sit under the words.
const MADE_INK = TEXT.primary;
const madeSize = (words) => (words.length > 110 ? 44 : words.length > 60 ? 56 : 72);

function StickyNote({ s, g }) {
  const words = s.headline || s.title;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 640, minHeight: 560, boxSizing: "border-box", padding: "72px 60px 60px", background: "#fde68a", color: MADE_INK,
        transform: "rotate(-2deg)", boxShadow: g.shadow, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <div style={{ fontSize: madeSize(words), fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}><L url={s.url}>{words}</L></div>
        {(s.notes || []).map((n, i) => <div key={i} style={{ fontSize: 30, lineHeight: 1.3 }}>{n}</div>)}
      </div>
    </div>
  );
}

function IndexCard({ s, g }) {
  const words = s.headline || s.title;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 960, height: 560, boxSizing: "border-box", padding: "96px 72px 56px", borderRadius: 10, color: MADE_INK, boxShadow: g.shadow,
        background: "linear-gradient(#c81e1e, #c81e1e) 0 72px / 100% 3px no-repeat, repeating-linear-gradient(#fffdf7, #fffdf7 54px, #c9dcef 54px, #c9dcef 56px)",
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        <div style={{ fontSize: madeSize(words), fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, textWrap: "balance" }}><L url={s.url}>{words}</L></div>
        {(s.notes || []).map((n, i) => <div key={i} style={{ fontSize: 30, lineHeight: 1.3 }}>{n}</div>)}
      </div>
    </div>
  );
}

function NotesBeside({ s, g, children, width }) {
  if (!(s.notes || []).length) {
    return <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children(false)}</div>;
  }
  return (
    <div style={{ position: "absolute", left: 90, right: 96, top: 0, bottom: 0, display: "grid", gridTemplateColumns: width + "px minmax(0, 1fr)", gap: 72, alignItems: "center" }}>
      {children(true)}
      {s.notes.length === 1 && s.notes[0].length < 90
        ? <div style={{ fontSize: 54, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.12, textWrap: "balance" }}><Linked text={s.notes[0]} accent={g.accent} /></div>
        : <Bullets list={s.notes} size={s.notes.length > 4 ? 30 : 36} g={g} />}
    </div>
  );
}

// An article is a clipping or its picture beside its headline. Left to itself
// it uses the picture when the article's page has one, which is why two
// articles on one day can look different; `look` on the row settles it.
function Article({ s, g }) {
  const clipping = s.look === "clipping";
  const img = useLeadImage(s.image || clipping ? "" : s.url, s.image);
  if (!clipping && (img || s.look === "picture")) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "700px minmax(0, 1fr)" }}>
        <L url={s.url}><div style={{ position: "relative", overflow: "hidden", height: H, background: g.card }}>
          {img ? <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null}
        </div></L>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, padding: "0 72px 0 64px" }}>
          <Site s={s} g={g} />
          <div style={{ fontSize: s.headline ? 62 : 58, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, textWrap: "balance" }}>
            <L url={s.url}>{s.headline || s.title}</L>
          </div>
          {s.headline ? <div style={{ fontSize: 30, lineHeight: 1.3, color: g.dim }}><L url={s.url}>{s.title}</L></div> : null}
          {(s.notes || []).length ? <Bullets list={s.notes} size={30} g={g} /> : null}
        </div>
      </div>
    );
  }
  return (
    <NotesBeside s={s} g={g} width={620}>
      {(beside) => (
        <div style={{ width: beside ? 620 : 860, boxSizing: "border-box", padding: "60px 60px 88px", background: "#fffdf8", color: "#1c1917", transform: "rotate(1.2deg)", boxShadow: g.shadow,
          clipPath: "polygon(0 0, 100% 0, 100% 92%, 94% 100%, 86% 94%, 77% 100%, 68% 95%, 58% 100%, 49% 94%, 39% 100%, 30% 95%, 20% 100%, 11% 94%, 0 99%)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            {s.site ? <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "0.02em", color: CRIMSON }}><L url={s.url}>{s.site}</L></div> : null}
            <div style={{ fontSize: beside ? 72 : 96, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1 }}><L url={s.url}>{s.headline || s.title}</L></div>
            <div style={{ height: 3, background: "#1c1917" }} />
            {s.headline ? <div style={{ fontSize: beside ? 28 : 36, lineHeight: 1.3, color: "#57534e" }}>{s.title}</div> : null}
            {s.sub ? <div style={{ fontSize: beside ? 28 : 38, lineHeight: 1.3, color: "#57534e" }}>{s.sub}</div> : null}
          </div>
        </div>
      )}
    </NotesBeside>
  );
}

function Video({ s, g }) {
  const img = useLeadImage(s.image ? "" : s.url, s.image);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
      <a href={s.url || undefined} target="_blank" rel="noopener noreferrer"
        style={{ display: "block", width: 960, height: 480, position: "relative", borderRadius: 16, overflow: "hidden", boxShadow: g.shadow, background: g.card }}>
        {img ? <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 132, height: 132, margin: "-66px 0 0 -66px", borderRadius: "50%", background: "rgba(255,255,255,0.94)",
          boxShadow: "0 16px 40px -12px rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="54" height="54" viewBox="0 0 24 24" style={{ marginLeft: 8 }} aria-hidden="true"><path d="M6 4.5v15l13-7.5z" fill={CRIMSON} /></svg>
        </div>
      </a>
      <div style={{ width: 960, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.12 }}><L url={s.url}>{s.headline || s.title}</L></div>
        {s.sub ? <div style={{ fontSize: 26, color: g.dim }}>{s.sub}</div> : null}
      </div>
    </div>
  );
}

function Image({ s }) {
  return <img src={s.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
}

function Podcast({ s, g }) {
  const bars = Array.from({ length: 58 }, (_, i) => Math.min(150, 26 + Math.round(Math.abs(Math.sin(i * 1.7) * 70 + Math.sin(i * 0.37) * 60))));
  return (
    <>
      <div style={{ position: "absolute", left: 110, right: 110, top: 110, display: "flex", flexDirection: "column", gap: 24 }}>
        <Site s={s} g={g} />
        <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.03, textWrap: "balance" }}><L url={s.url}>{s.headline || s.title}</L></div>
      </div>
      <div style={{ position: "absolute", left: 110, right: 110, bottom: 96, height: 150, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {bars.map((h, i) => <div key={i} style={{ flex: "none", width: 10, height: h, borderRadius: 5, background: g.accent, opacity: i % 9 === 0 ? 1 : 0.78 }} />)}
      </div>
    </>
  );
}

function Chapter({ s, g }) {
  return (
    <div style={{ position: "absolute", left: 120, right: 110, top: 0, bottom: 0, display: "grid", gridTemplateColumns: "330px minmax(0, 1fr)", gap: 96, alignItems: "center" }}>
      <div style={{ width: 330, height: 470, position: "relative", borderRadius: "6px 14px 14px 6px", background: CRIMSON, color: "#ffffff", boxShadow: g.shadow, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 26, background: SLIDE.crimsonDeep }} />
        <div style={{ position: "absolute", left: 58, right: 30, top: 56, fontSize: 32, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{s.book}</div>
        {s.sub ? <div style={{ position: "absolute", left: 58, right: 30, bottom: 48, fontSize: 22, lineHeight: 1.3, opacity: 0.92 }}>{s.sub}</div> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {s.chapter ? <div style={{ fontSize: 40, fontWeight: 600, color: g.accent }}>{s.chapter}</div> : null}
        <div style={{ fontSize: (s.chapterName || "").length > 40 ? 68 : 96, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1 }}><L url={s.url}>{s.chapterName}</L></div>
      </div>
    </div>
  );
}

function Quote({ s, g }) {
  return (
    <div style={{ position: "absolute", left: 130, right: 150, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}>
      <svg width="120" height="96" viewBox="0 0 120 96" aria-hidden="true"><path d="M0 96V58C0 26 16 6 48 0l6 14C36 20 28 32 28 50h24v46zm66 0V58c0-32 16-52 48-58l6 14c-18 6-26 18-26 36h24v46z" fill={g.accent} /></svg>
      <div style={{ fontSize: s.title.length > 120 ? 56 : 76, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.12, textWrap: "balance" }}>{s.title}</div>
      {s.sub ? <div style={{ fontSize: 36, fontWeight: 500, color: g.dim }}><L url={s.url} underline>{s.sub}</L></div> : null}
    </div>
  );
}

function Activity({ s, g }) {
  const parts = s.title.split(/,\s*/);
  const columns = parts.length >= 2 && parts.length <= 4 && parts.every(p => p.length <= 14);
  return (
    <div style={{ position: "absolute", left: 100, right: 100, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 72 }}>
      {columns ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${parts.length}, minmax(0, 1fr))`, gap: 56 }}>
          {parts.map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div style={{ height: 10, borderRadius: 5, background: g.accent }} />
              <div style={{ fontSize: 104, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1 }}>{p}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ width: 110, height: 10, borderRadius: 5, background: g.accent }} />
          <div style={{ fontSize: 104, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, textWrap: "balance" }}><L url={s.url}>{s.title}</L></div>
        </div>
      )}
      {(s.notes || []).length ? (
        s.notes.length === 1
          ? <div style={{ fontSize: 46, fontWeight: 500, lineHeight: 1.2, color: g.dim }}><Linked text={s.notes[0]} accent={g.accent} /></div>
          : <Bullets list={s.notes} size={34} g={g} />
      ) : null}
    </div>
  );
}

function Headlines({ s, g }) {
  return (
    <div style={{ position: "absolute", left: 110, right: 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}>
      <div style={{ height: 10, background: g.ink }} />
      <div style={{ height: 3, background: g.ink }} />
      <div style={{ fontSize: 236, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 0.9, textAlign: "center" }}>{s.title}</div>
      <div style={{ height: 3, background: g.ink }} />
      <div style={{ height: 10, background: g.ink }} />
    </div>
  );
}

function Game({ s, g }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 1000, height: 380, display: "grid", gridTemplateColumns: s.count ? "minmax(0, 1fr) 24px 250px" : "minmax(0, 1fr)", transform: "rotate(-2deg)", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.28))" }}>
        <div style={{ background: CRIMSON, color: "#ffffff", borderRadius: s.count ? "20px 0 0 20px" : 20, padding: "0 64px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22,
          WebkitMask: "radial-gradient(circle at 0 50%, transparent 34px, #000 35px)", mask: "radial-gradient(circle at 0 50%, transparent 34px, #000 35px)" }}>
          <div style={{ height: 4, background: "rgba(255,255,255,.55)" }} />
          <div style={{ fontSize: s.title.length > 26 ? 68 : 88, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1 }}>{s.title}</div>
          <div style={{ height: 4, background: "rgba(255,255,255,.55)" }} />
        </div>
        {s.count ? (
          <>
            <div style={{ background: CRIMSON, display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center" }}>
              {Array.from({ length: 11 }, (_, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: g.bg }} />)}
            </div>
            <div style={{ background: CRIMSON, color: "#ffffff", borderRadius: "0 20px 20px 0", display: "flex", alignItems: "center", justifyContent: "center",
              WebkitMask: "radial-gradient(circle at 100% 50%, transparent 34px, #000 35px)", mask: "radial-gradient(circle at 100% 50%, transparent 34px, #000 35px)" }}>
              <div style={{ fontFamily: MONO, fontSize: 128, fontWeight: 500, letterSpacing: "-0.04em" }}>{s.count}</div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Question({ s, g }) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 72, bottom: 64, display: "flex", flexDirection: "column", gap: 48 }}>
      <div style={{ fontSize: s.title.length > 90 ? 46 : 58, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}>{s.title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 22 }}>
        {(s.options || []).slice(0, 6).map((o, i) => (
          <div key={i} style={{ display: "flex", gap: 26, alignItems: "flex-start", padding: "30px 34px", borderRadius: 16, background: g.card, boxShadow: "0 0 0 2px " + g.rule }}>
            <div style={{ flex: "none", fontFamily: MONO, fontSize: 38, fontWeight: 500, color: g.accent, lineHeight: 1.15 }}>{letters[i]}</div>
            <div style={{ fontSize: s.options.length > 4 ? 28 : 36, fontWeight: 500, lineHeight: 1.2, textWrap: "pretty" }}>{o}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Board({ s, g }) {
  const tilt = [-2, 1.5, -1];
  return (
    <div style={{ position: "absolute", left: 96, right: 96, top: 84, bottom: 72, display: "flex", flexDirection: "column", gap: 60 }}>
      <div style={{ fontSize: 78, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.02 }}>{s.title}</div>
      {(s.posts || []).length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 36, alignItems: "start" }}>
          {s.posts.slice(0, 3).map((p, i) => (
            <div key={i} style={{ padding: "36px 34px", background: g.card, borderRadius: 14, boxShadow: g.shadow, transform: `rotate(${tilt[i]}deg)` }}>
              <div style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.28, textWrap: "pretty" }}>{p}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Assignment({ s, g }) {
  const [mon, day] = String(s.due || "").split(" ");
  return (
    <div style={{ position: "absolute", left: 130, right: 110, top: 0, bottom: 0, display: "grid", gridTemplateColumns: day ? "330px minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 96, alignItems: "center" }}>
      {day ? (
        <div style={{ width: 330, borderRadius: 22, overflow: "hidden", background: g.card, boxShadow: g.shadow }}>
          <div style={{ background: CRIMSON, color: "#ffffff", textAlign: "center", fontSize: 56, fontWeight: 600, padding: "20px 0 22px" }}>{mon}</div>
          <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 190, fontWeight: 500, lineHeight: 1.12, padding: "18px 0 26px", letterSpacing: "-0.05em" }}>{day}</div>
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ fontSize: s.title.length > 30 ? 72 : 96, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1 }}><L url={s.url}>{s.title}</L></div>
        {s.dueTime ? <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 500, color: g.dim }}>{s.dueTime}</div> : null}
        {(s.notes || []).length ? <Bullets list={s.notes} size={30} g={g} /> : null}
      </div>
    </div>
  );
}

const TEMPLATES = {
  section: Section, item: Item, article: Article, video: Video, image: Image, podcast: Podcast, chapter: Chapter,
  quote: Quote, activity: Activity, headlines: Headlines, game: Game, question: Question, board: Board, assignment: Assignment,
  gameDuring: GameDuring, gameSpread: GameSpread, gameQuestions: GameQuestions, gameQuestion: GameQuestion, gameTeams: GameTeams,
  note: StickyNote, card: IndexCard,
};

// What the brush under a slide writes to a row. "paper" and "slate" are the
// ground for that one slide; "note" and "card" are a made thing in place of
// plain type, for an item or a section's name; "clipping" and "picture" are
// an article's. Anything else is the slide left to itself.
export function lookOnto(cast, look) {
  if (!cast || cast.type !== "slide" || !look) return cast;
  if (look === "paper" || look === "slate") return { ...cast, ground: look };
  if ((look === "note" || look === "card") && (cast.template === "item" || cast.template === "section")) return { ...cast, of: cast.template, template: look };
  return cast;
}

// A slide, drawn. `fit` scales the stage to the window, for the room screen;
// without it the stage is 1280 by 720 for whoever scales it.
export default function RoomSlide({ slide, ground, fit }) {
  // A slide can name its own ground; otherwise it stands on the class's.
  const g = GROUNDS[(slide?.ground || ground) === "paper" ? "paper" : "slate"];
  const s = useFit(!!fit);
  const T = TEMPLATES[slide?.template] || Item;
  const stage = (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden", background: g.bg, color: g.ink, fontFamily: FONT, boxSizing: "border-box" }}>
      <T s={{ ...slide, title: slide?.title || "" }} g={g} />
    </div>
  );
  if (!fit) return stage;
  return (
    <div style={{ position: "absolute", inset: 0, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: W * s, height: H * s, flex: "none" }}>
        <div style={{ transform: "scale(" + s + ")", transformOrigin: "top left" }}>{stage}</div>
      </div>
    </div>
  );
}

export const ROOM_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap";

// ─── choosing a template ───
//
// Which template a row gets, and what goes into it, read off the row, its
// block and the class. Only text that exists is passed; a template leaves out
// what it is not given.
const VIDEO_HOST = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/;
const IMAGE_URL = /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i;

// The slide a row gets, wearing the look its brush gave it.
export const slideFor = (args) => lookOnto(plainSlideFor(args), args?.item?.slideLook);

function plainSlideFor({ item, block, seed, title, claim, notes, tag, assignments, features, games }) {
  const words = claim || title || "";
  const url = block?.url || (item?.links || [])[0]?.url || (String(item?.text || "").match(/https?:\/\/[^\s<>"')]+/) || [])[0] || "";
  const base = { type: "slide", label: words, title: title || "", headline: claim || "", url, site: hostOf(url), notes: notes && notes.length ? notes : undefined,
    look: item?.slideLook || undefined };
  const sub = block?.type !== "board" ? (block?.body || "").trim() : "";

  // A game from the game panel is its ticket, with the count of its questions.
  if (item?.gameId) {
    const g = (games || []).find(x => x.id === item.gameId);
    const name = g?.title || title || item.text || "";
    return { ...base, template: "game", title: name, label: name, count: g?.questions || 0 };
  }
  if (item?.feature) {
    return item.feature === "Headlines"
      ? { ...base, template: "headlines", title: item.feature, label: item.feature }
      : { ...base, template: "activity", title: item.feature, label: item.feature };
  }
  if (block?.media?.src && block.media.kind === "image") return { ...base, template: "image", image: block.media.src };
  if (IMAGE_URL.test(url)) return { ...base, template: "image", image: url };

  const type = block?.type || (seed ? "story" : "note");
  if (type === "set") return { ...base, template: "game", count: (block.children || []).length || 0 };
  if (type === "question" && (block.q?.options || []).length >= 2) return { ...base, template: "question", options: block.q.options };
  if (type === "board") {
    const posts = String(block.body || "").split("\n").map(p => p.trim()).filter(Boolean)
      .map(p => p.replace(/^[^:]{2,40}:\s*/, "")).map(p => ((p.match(/^.*?[.!?](\s|$)/) || [p])[0]).trim()).slice(0, 3);
    return { ...base, template: "board", posts };
  }
  if (type === "assignment") {
    const a = (assignments || []).find(x => (x.title || "").trim() === (block.title || "").trim());
    return { ...base, template: "assignment", due: a?.due && /^[A-Z][a-z]{2} \d{1,2}$/.test(a.due) ? a.due : "", dueTime: a?.dueTime || "", url: url || a?.instructionsUrl || "" };
  }
  if (type === "quote") return { ...base, template: "quote", sub };
  if (type === "podcast") return { ...base, template: "podcast" };
  if (type === "book-chapter" || type === "book") {
    const [book, rest] = (block.title || "").split(/,\s*(?=Chapter\b)/);
    const [chapter, chapterName] = rest ? rest.split(/:\s*/) : ["", ""];
    return rest
      ? { ...base, template: "chapter", book, chapter, chapterName: chapterName || chapter, sub }
      : { ...base, template: "chapter", book: block.title || "", chapter: "", chapterName: block.title || "", sub };
  }
  if (type === "video" || VIDEO_HOST.test(hostOf(url))) return { ...base, template: "video", sub };
  if (type === "activity") return { ...base, template: "activity" };
  if (url && !["note", "story"].includes(type)) return { ...base, template: "article", sub };
  return { ...base, template: "item", sub };
}
