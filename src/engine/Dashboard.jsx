// Dashboard — the surface I open when I teach. Its own mode, not the instructor
// home. Everything needed to run one session, in panels I can drag into the
// arrangement I want, plus the cast controls for the Classroom View.
//
// Panels are drag-to-reorder and 1x/2x wide. Arrangement is per class and saved
// to this browser (it is a preference about my screen, not class data).
//
// Reads and writes the same class store as the rest of the engine:
//   data.dayPlans[date]   built by the Day Plan card
//   data.stocked[date]    things stocked for today that are not in the plan
//   data.attendance[date] instructor-taken; everyone starts Here
//   data.scratch[date]    scratch pad
// Casting goes through live.js; questions through questions.js.

import { useState, useEffect, useRef, useCallback } from "react";
import { useClassData } from "./store.js";
import { useLive, ANIMS, BIG_ANIMS } from "./live.js";
import { useQuestions } from "./questions.js";
import { usePoll } from "./poll.js";
import PollPanel, { oneSentence } from "./PollPanel.jsx";
import HornBoard from "./HornBoard.jsx";
import { useHeadlines } from "./headlines.js";
import HeadlinesBoard from "./HeadlinesBoard.jsx";
import { allDays, currentDay, parseDay } from "./days.js";
import { genId } from "../utils.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#646b75"; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = "#eef0f2";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";
const SURFACE_2 = "#f4f3f1";
const LIVE = "#e11d48";
const OK = "#0f766e";
const WARN = "#b45309";
const TAP = 44;  // student-facing surfaces: students are on phones
const HIT = 34;  // this screen: a trackpad under my hands, where density is the point

const label = { fontFamily: MONO, fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: ".12em" };
const mini = { minHeight: HIT, padding: "0 12px", borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_SECONDARY, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const solid = (a) => ({ ...mini, background: a, borderColor: a, color: "#fff" });
const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: 40, background: "#fff", color: TEXT_PRIMARY };
const label2 = { fontFamily: MONO, fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: ".12em" };
const Muted = ({ children, style }) => <div style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;

const CSS = `
.dash-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-content:start}
@media (max-width:700px){.dash-grid{grid-template-columns:minmax(0,1fr)}.dash-panel[data-span="2"]{grid-column:span 1 !important}}
.dash-panel[data-span="2"]{grid-column:span 2}
.dash-panel.dragging{position:fixed;z-index:60;pointer-events:none;transform:rotate(-1deg);
  box-shadow:0 12px 32px -8px rgba(23,19,16,.35);opacity:.97}
.dash-ghost{border:1.5px dashed ${BORDER_STRONG};border-radius:14px;background:rgba(0,0,0,.02)}
.dash-ghost[data-span="2"]{grid-column:span 2}
.dash-item:hover{background:#fff;border-color:${BORDER_STRONG}}
.dash-item:hover .dash-go{opacity:1}

/* Keyboard users had no idea where they were on this screen. */
.dash-focus:focus-visible{outline:2px solid var(--dash-accent);outline-offset:2px;border-radius:8px}
.dash-focus:focus:not(:focus-visible){outline:none}

/* The class accent and the live red are 1.71:1 apart, which is no distance at
   all. So live stops relying on colour: it says LIVE, and the dot pulses. */
.dash-live{display:inline-flex;align-items:center;gap:5px;flex:none;
  font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.1em;
  padding:3px 7px;border-radius:5px;background:${LIVE};color:#fff}
.dash-live i{display:block;width:5px;height:5px;border-radius:50%;background:#fff;animation:dashPulse 1.6s ease-in-out infinite}
@keyframes dashPulse{0%,100%{opacity:1}50%{opacity:.35}}

/* The panel grid animates while being dragged and never asked about this. */
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
}
`;

// One badge, used everywhere something is on the room screen. The word carries
// the meaning; the colour only reinforces it.
const LiveTag = () => <span className="dash-live"><i />LIVE</span>;

// ─────────────────────────────────────────────────────────────
// small pieces
// ─────────────────────────────────────────────────────────────
function Grip({ onPointerDown }) {
  return (
    <span onPointerDown={onPointerDown} role="button" tabIndex={0} aria-label="Drag panel"
      style={{ cursor: "grab", touchAction: "none", display: "flex", flexDirection: "column", gap: 2.5, padding: "6px 3px", marginLeft: -3, borderRadius: 5 }}>
      {[0, 1, 2].map(i => <i key={i} style={{ display: "block", width: 11, height: 1.5, background: BORDER_STRONG, borderRadius: 1 }} />)}
    </span>
  );
}

function Panel({ id, title, right, span, onDrag, onSize, children, refCb, dragging }) {
  return (
    <section ref={refCb} className={"dash-panel" + (dragging ? " dragging" : "")} data-id={id} data-span={span}
      style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid " + BORDER }}>
        <Grip onPointerDown={onDrag} />
        <span style={{ ...label, color: TEXT_SECONDARY, marginRight: "auto" }}>{title}</span>
        {right}
        <button onClick={onSize} style={{ ...mini, minHeight: HIT, padding: "0 10px", fontFamily: MONO, fontSize: 10, color: TEXT_MUTED }}>
          {span === "2" ? "2×" : "1×"}
        </button>
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>{children}</div>
    </section>
  );
}

// A castable row.
function Item({ kind, kindColor, title, sub, live, onCast, onDismiss }) {
  return (
    <button className="dash-item" onClick={live && onDismiss ? onDismiss : onCast}
      title={live ? "Take it back down" : "Send it to the room screen"}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
        background: live ? "rgba(225,29,72,.07)" : SURFACE_2, border: "1px solid " + (live ? LIVE : "transparent"),
        borderRadius: 10, padding: "9px 11px", minHeight: TAP, fontFamily: F, transition: "background .14s, border-color .14s" }}>
      <span style={{ flex: "none", fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
        padding: "3px 6px", borderRadius: 5, background: "#fff", border: "1px solid " + (kindColor || BORDER_STRONG), color: kindColor || TEXT_MUTED }}>{kind}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <b style={{ display: "block", fontWeight: 500, fontSize: 14, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</b>
        {sub ? <small style={{ color: TEXT_MUTED, fontSize: 12 }}>{sub}</small> : null}
      </span>
      {live ? <LiveTag /> : (
        <span className="dash-go" style={{ flex: "none", fontFamily: MONO, fontSize: 10, letterSpacing: ".08em",
          color: TEXT_MUTED, fontWeight: 400, opacity: 0, transition: "opacity .14s" }}>CAST →</span>
      )}
    </button>
  );
}

// Nothing goes up as a label. Before a thing can be cast it needs a claim —
// one full sentence saying what it shows. "Media rights" is a topic; "Rights
// fees have risen 45% in ten years" is what the room can actually read.
function Castable({ kind, kindColor, title, sub, url, claim, live, accent, onCast, onDismiss, onSaveClaim }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(claim || "");
  useEffect(() => { setDraft(claim || ""); }, [claim]);

  const commit = (thenCast) => {
    const c = oneSentence(draft);
    if (!c || c.split(" ").length < 3) return;
    onSaveClaim(c);
    setEditing(false);
    if (thenCast) onCast(c);
  };

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, border: "1px solid " + accent, borderRadius: 10, background: "#fff" }}>
        <span style={{ ...label, color: accent }}>Say it in one sentence</span>
        <div style={{ fontSize: 12.5, color: TEXT_MUTED }}>{title}</div>
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") commit(true); if (e.key === "Escape") setEditing(false); }}
          placeholder="Rights fees have increased 45% over the last 10 years."
          style={inputStyle} />
        <div style={{ display: "flex", gap: 7 }}>
          <button style={solid(accent)} onClick={() => commit(true)}>Save and cast</button>
          <button style={mini} onClick={() => commit(false)}>Just save</button>
          <button style={{ ...mini, marginLeft: "auto" }} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  const act = { ...mini, minHeight: HIT, padding: "0 10px", fontSize: 12.5 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 11px", borderRadius: 10,
      background: live ? "rgba(225,29,72,.07)" : SURFACE_2, border: "1px solid " + (live ? LIVE : "transparent") }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ flex: "none", marginTop: 2, fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: ".08em",
          textTransform: "uppercase", padding: "3px 6px", borderRadius: 5, background: "#fff",
          border: "1px solid " + (kindColor || BORDER_STRONG), color: kindColor || TEXT_MUTED }}>{kind}</span>
        {live ? <LiveTag /> : null}
        <span style={{ minWidth: 0, flex: 1 }}>
          <b style={{ display: "block", fontWeight: 500, fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.35 }}>{claim || title}</b>
          {claim || sub ? (
            <small style={{ color: TEXT_MUTED, fontSize: 12, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {claim ? title : sub}
            </small>
          ) : null}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer"
            style={{ ...act, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Open here ↗</a>
        ) : null}
        {live ? (
          <button style={{ ...act, borderColor: LIVE, color: LIVE }} onClick={onDismiss}>Take it down ×</button>
        ) : (
          <button style={{ ...act, borderColor: accent, color: accent }}
            onClick={() => { if (claim) onCast(claim); else setEditing(true); }}>To the room →</button>
        )}
        <button style={{ ...act, marginLeft: "auto", color: TEXT_MUTED }} onClick={() => setEditing(true)}>
          {claim ? "Claim" : "Write claim"}
        </button>
      </div>
    </div>
  );
}

// The things we actually do in class. They are features, not content: a mode
// the room goes into. Scheduled on a day in the week's items, run from Class
// Flow. Around the Horn opens its own board; the rest announce themselves on
// the room screen until they are built out.
export const FEATURES = {
  "Headlines": "Students bring real headlines. The room votes them into categories.",
  "Game": "The weekly game. Six On Topic, four Sports World.",
  "Fishbowl": "Rotating fishbowl on the assigned readings.",
  "This or That": "Fast forced choice.",
  "Around the Horn": "The seating board. Points for the room.",
  "Team Trivia": "Teams, buzzers, the works.",
};

function FeatureRow({ name, live, accent, onRun, onDismiss }) {
  const blurb = FEATURES[name] || "";
  return (
    <button onClick={live ? onDismiss : onRun}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
        background: live ? "rgba(225,29,72,.07)" : "#fff", border: "1px solid " + (live ? LIVE : BORDER_STRONG),
        borderRadius: 10, padding: "9px 12px", minHeight: TAP, fontFamily: F }}>
      <span style={{ flex: "none", width: 7, height: 7, borderRadius: "50%", background: live ? LIVE : accent }} />
      <span style={{ minWidth: 0, flex: 1 }}>
        <b style={{ display: "block", fontWeight: 600, fontSize: 14.5, color: TEXT_PRIMARY }}>{name}</b>
        <small style={{ color: TEXT_MUTED, fontSize: 12 }}>{blurb}</small>
      </span>
      {live ? <LiveTag /> : (
        <span style={{ flex: "none", fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", color: TEXT_MUTED, fontWeight: 500 }}>RUN →</span>
      )}
    </button>
  );
}

const KIND_COLOR = { Deck: "#7c3aed", PDF: "#b91c1c", Web: "#0369a1", Video: "#b45309", Seed: "#9f1239", Ask: OK, Link: "#0369a1", Note: TEXT_MUTED };

// Whether a link can actually be framed. This has to be an allowlist: most of
// the web sends X-Frame-Options and an iframe that gets refused renders as a
// black rectangle with no error we can catch. Anything not on the list becomes
// a title card, which is a fine thing to project and never a broken one.
const EMBED_HOSTS = /(^|\.)(docs\.google\.com|drive\.google\.com|canva\.com|youtube\.com|youtu\.be|vimeo\.com|loom\.com|figma\.com|desmos\.com|codepen\.io|wikipedia\.org|archive\.org)$/i;
const EMBED_FILES = /\.(pdf|png|jpe?g|gif|webp|svg)(\?|#|$)/i;

export function canEmbed(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (typeof window !== "undefined" && u.origin === window.location.origin) return true;
  if (EMBED_FILES.test(u.pathname)) return true;
  return EMBED_HOSTS.test(u.hostname.replace(/^www\./, ""));
}

// YouTube only frames from its embed path.
function framable(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return "https://www.youtube.com/embed" + u.pathname;
    if (host === "youtube.com" && u.searchParams.get("v")) return "https://www.youtube.com/embed/" + u.searchParams.get("v");
  } catch { /* leave it alone */ }
  return url;
}

export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function castFromLink(l, force) {
  const host = hostOf(l.url);
  const mode = force || (canEmbed(l.url) ? "embed" : "read");
  return {
    type: "doc", kind: host || "Link", title: l.label || l.url,
    url: mode === "embed" ? framable(l.url) : l.url, openUrl: l.url,
    mode, label: l.label || host || "Link",
  };
}

// ─────────────────────────────────────────────────────────────
// panels
// ─────────────────────────────────────────────────────────────
function NowPanel({ config, engagedAt, onEngaged, plan, seq, onSlot }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(t); }, []);

  // The number that matters is not how long is left, it is how long since the
  // room last had to produce something. Attention does not run down on a clock.
  const since = engagedAt ? Math.floor((now - engagedAt) / 60000) : null;
  const cold = since != null && since >= 10;

  const meets = config.meets || {};
  const mins = (hhmm) => { const [h, m] = (hhmm || "").split(":").map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
  const d = new Date(now);
  const cur = d.getHours() * 60 + d.getMinutes();
  const start = mins(meets.start), end = mins(meets.end);
  const inClass = start != null && end != null && cur >= start && cur <= end;
  const left = end != null ? Math.max(0, end - cur) : null;

  const slots = seq ? seq.slots.map(x => x.slot) : [];
  const current = plan?.currentSlot;
  // How long the current slot has been running. A sequence is a budget, and
  // the only way to notice you are eating the whole hour on the opener is to
  // see the number while you are still in it.
  const slotStarted = (plan?.slotAt || {})[current];
  const inSlot = slotStarted ? Math.floor((now - slotStarted) / 60000) : null;
  const fair = slots.length && left != null ? Math.round((left + (start != null ? cur - start : 0)) / slots.length) : null;
  const over = fair != null && inSlot != null && inSlot > fair;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, letterSpacing: "-.03em", lineHeight: 1,
          color: cold ? WARN : TEXT_PRIMARY }}>
          {since == null ? "—" : since + " min"}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, paddingBottom: 3 }}>
          since they did anything{inClass && left != null ? " · " + left + " min of class left" : ""}
        </span>
        <button onClick={onEngaged} style={{ ...mini, marginLeft: "auto" }}>They just did something</button>
      </div>
      {cold ? (
        <Muted style={{ color: WARN }}>Ten minutes of listening. Ask them for something.</Muted>
      ) : (
        <Muted style={{ fontSize: 12 }}>Resets on a poll, a pushed question, or the button.</Muted>
      )}
      {slots.length ? (
        <>
        <div style={{ display: "flex", gap: 5 }}>
          {slots.map(x => {
            const on = x === current;
            return (
              <button key={x} onClick={() => onSlot(on ? null : x)}
                style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <i style={{ display: "block", height: 4, borderRadius: 2, background: on ? config.accent : BORDER }} />
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".09em", textTransform: "uppercase", color: on ? config.accent : TEXT_MUTED, fontWeight: on ? 700 : 400 }}>{x}</span>
              </button>
            );
          })}
        </div>
        {current ? (
          <Muted style={{ fontSize: 12, color: over ? WARN : TEXT_MUTED }}>
            {inSlot == null ? "In " + current + "." : inSlot + " min in " + current + (fair != null ? " · " + fair + " min is an even share" : "")}
          </Muted>
        ) : (
          <Muted style={{ fontSize: 12 }}>Tap a slot when you get to it. The clock starts there.</Muted>
        )}
        </>
      ) : null}
    </>
  );
}

const GoTo = ({ href, accent, children }) => (
  <a className="dash-focus" href={href}
    style={{ ...mini, borderColor: accent, color: accent, textDecoration: "none",
      display: "inline-flex", alignItems: "center", alignSelf: "flex-start" }}>{children}</a>
);

function FlowPanel({ plan, seq, seeds, castNow, dismiss, liveLabel, accent, onClaim, features, onFeature, planHref }) {
  const featureBlock = features && features.length ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ ...label, color: accent }}>Today we run</div>
      {features.map(f => (
        <FeatureRow key={f} name={f} accent={accent} live={liveLabel === f}
          onRun={() => onFeature(f)} onDismiss={dismiss} />
      ))}
    </div>
  ) : null;

  if (!plan || !seq) return (
    <>
      {featureBlock}
      <Muted>{featureBlock ? "No sequence built for this day yet." : "Nothing planned for this day yet."}</Muted>
      <GoTo href={planHref} accent={accent}>Build it in Day Plan →</GoTo>
    </>
  );
  const seedById = (id) => seeds.find(s => s.id === id);
  const slotItems = plan.slots || {};
  const any = seq.slots.some(s => (slotItems[s.slot]?.items || []).length);
  if (!any) return (
    <>
      {featureBlock}
      <Muted>This day has a sequence with nothing in it yet.</Muted>
      <GoTo href={planHref} accent={accent}>Fill the slots in Day Plan →</GoTo>
    </>
  );

  return (
    <>
      {featureBlock}
      {seq.slots.map(s => {
        const bucket = slotItems[s.slot] || {};
        const items = bucket.items || [];
        if (!items.length) return null;
        return (
          <div key={s.slot} style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
            <div style={{ ...label, color: accent }}>{bucket.title || s.slot}</div>
            {items.map(it => {
              const seed = it.seedId ? seedById(it.seedId) : null;
              const title = seed ? seed.title : (it.text || "Untitled");
              const body = it.bodyOverride || (seed ? seed.body : "");
              return (
                <div key={it.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Castable kind={seed ? "Seed" : "Note"} kindColor={KIND_COLOR[seed ? "Seed" : "Note"]}
                    title={title} sub={body ? body.slice(0, 70) : ""} claim={it.claim} accent={accent}
                    live={liveLabel === (it.claim || title)} onDismiss={dismiss}
                    onSaveClaim={(c) => onClaim(s.slot, it.id, c)}
                    onCast={(c) => castNow({ type: "quote", tag: bucket.title || s.slot, title: c, cite: seed ? seed.concept : "", label: c })} />
                  {(it.links || []).map(l => (
                    <div key={l.id} style={{ paddingLeft: 16 }}>
                      <Castable kind="Link" kindColor={KIND_COLOR.Link} title={l.label} sub={l.url} url={l.url}
                        claim={l.claim} accent={accent} live={liveLabel === (l.claim || l.label)} onDismiss={dismiss}
                        onSaveClaim={(c) => onClaim(s.slot, it.id, c, l.id)}
                        onCast={(c) => castNow({ ...castFromLink(l), title: c, label: c })} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

const STOCK_KINDS = ["Link", "Video", "PDF", "Deck", "Web", "Note"];

// Three shelves, three lifetimes. Subtopic ideas are for today, topic ideas
// last the week, and the random shelf is always there.
const SHELVES = [
  { id: "day", label: "Subtopic ideas", scope: "today" },
  { id: "week", label: "Topic ideas", scope: "this week" },
  { id: "any", label: "Random", scope: "anything" },
];

function StockedPanel({ shelves, onAdd, onRemove, onClaim, castNow, dismiss, liveLabel, accent }) {
  return (
    <>
      {SHELVES.map(sh => (
        <Shelf key={sh.id} shelf={sh} items={shelves[sh.id] || []} accent={accent}
          onAdd={(item) => onAdd(sh.id, item)} onRemove={(id) => onRemove(sh.id, id)}
          onClaim={(id, c) => onClaim(sh.id, id, c)}
          castNow={castNow} dismiss={dismiss} liveLabel={liveLabel} />
      ))}
    </>
  );
}

function Shelf({ shelf, items, onAdd, onRemove, onClaim, castNow, dismiss, liveLabel, accent }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("Link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    if (!title.trim() && !url.trim()) return;
    onAdd({ id: genId(), kind, title: title.trim() || url.trim(), url: url.trim() });
    setTitle(""); setUrl(""); setOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...label, color: accent }}>{shelf.label}</span>
        <span style={{ ...label, fontSize: 10 }}>{shelf.scope}</span>
      </div>
      {(items || []).map(s => (
        <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Castable kind={s.kind} kindColor={KIND_COLOR[s.kind]} title={s.title} sub={s.url} url={s.url}
              claim={s.claim} accent={accent} live={liveLabel === (s.claim || s.title)} onDismiss={dismiss}
              onSaveClaim={(c) => onClaim(s.id, c)}
              onCast={(c) => castNow(s.url
                ? { ...castFromLink({ label: s.title, url: s.url }), title: c, label: c }
                : { type: "quote", tag: shelf.label, title: c, label: c })} />
          </div>
          <button onClick={() => onRemove(s.id)} title="Remove"
            style={{ ...mini, minHeight: HIT, padding: "0 10px", color: TEXT_MUTED }}>✕</button>
        </div>
      ))}
      {open ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <select value={kind} onChange={e => setKind(e.target.value)} style={{ ...inputStyle, fontSize: 14 }}>
            {STOCK_KINDS.map(k => <option key={k}>{k}</option>)}
          </select>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What is it" style={inputStyle} />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://… (optional)" style={inputStyle} />
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={add} style={solid(accent)}>Add</button>
            <button onClick={() => setOpen(false)} style={mini}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{ ...mini, alignSelf: "flex-start" }}>+ Add</button>
      )}
    </div>
  );
}

// Three states, three tabs. An answered question is worth keeping — it is the
// record of what the room did not understand — and an archived one still needs
// a way back to open when it turns out to matter next week.
const Q_TABS = [["open", "Open"], ["answered", "Answered"], ["archived", "Archived"]];

function QuestionsPanel({ items, setState, archiveOpen, castNow, accent }) {
  const [tab, setTab] = useState("open");
  if (items === null) return <Muted>Loading…</Muted>;
  const open = items.filter(q => q.state === tab);
  const unanswered = items.filter(q => q.state === "archived").length;
  const countOf = (st) => items.filter(q => q.state === st).length;

  return (
    <>
      <div style={{ display: "flex", gap: 5 }}>
        {Q_TABS.map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k}
            style={{ ...mini, minHeight: 30, padding: "0 10px", fontSize: 12.5,
              ...(tab === k ? { background: accent, borderColor: accent, color: "#fff" } : {}) }}>
            {lbl} {countOf(k) || ""}
          </button>
        ))}
      </div>
      {open.length === 0 ? <Muted>{tab === "open" ? "Nothing from the room right now." : "Nothing here."}</Muted> : null}
      {open.map(q => (
        <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, border: "1px solid " + BORDER, borderRadius: 10, background: SURFACE_2 }}>
          <div style={{ ...label, fontSize: 10, display: "flex", gap: 7, alignItems: "center" }}>
            {q.anon
              ? <span style={{ color: accent, border: "1px solid " + accent + "55", borderRadius: 4, padding: "1px 5px" }}>Anon</span>
              : <span>{q.who || "Unknown"}</span>}
            <span>{new Date(q.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: TEXT_PRIMARY }}>{q.text}</p>
          <div style={{ display: "flex", gap: 7 }}>
            <button style={solid(accent)}
              onClick={() => castNow({ type: "question", tag: "From the room", title: q.text, cite: q.anon ? "Anonymous" : (q.who || ""), label: "Question · " + (q.anon ? "anonymous" : q.who) })}>
              Push to screen
            </button>
            {q.state === "answered"
              ? <button style={mini} onClick={() => setState(q.id, "open")}>Reopen</button>
              : <button style={mini} onClick={() => setState(q.id, "answered")}>Answered</button>}
            {q.state !== "archived"
              ? <button style={{ ...mini, marginLeft: "auto", color: TEXT_MUTED }} onClick={() => setState(q.id, "archived")}>Later</button>
              : null}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 4 }}>
        <button style={mini} onClick={archiveOpen}>Archive session</button>
        <Muted style={{ fontSize: 12 }}>{unanswered} archived unanswered</Muted>
      </div>
    </>
  );
}

// Everyone starts Here. Tap to walk it down.
const ATT_STATES = ["here", "late", "excused", "out"];
const ATT_STYLE = {
  here: { bg: "rgba(15,118,110,.12)", bd: "rgba(15,118,110,.45)", fg: OK },
  late: { bg: "rgba(180,83,9,.13)", bd: "rgba(180,83,9,.45)", fg: WARN },
  excused: { bg: "rgba(3,105,161,.12)", bd: "rgba(3,105,161,.4)", fg: "#0369a1" },
  out: { bg: "#fff", bd: BORDER_STRONG, fg: TEXT_MUTED },
};

// Everyone starts Here, so taking attendance is only ever about the exceptions.
// Type a few letters to find someone, and once you have marked the room, flip to
// Exceptions so the twenty-five people who showed up stop taking the space.
function AttendancePanel({ students, marks, onMark, onReset }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState(false);
  const stateOf = (n) => marks[n] || "here";
  const count = (s) => students.filter(st => stateOf(st.name) === s).length;
  const lc = q.trim().toLowerCase();
  const shown = students.filter(st => {
    if (lc && !st.name.toLowerCase().includes(lc)) return false;
    if (only && !lc && stateOf(st.name) === "here") return false;
    return true;
  });
  const marked = students.filter(st => stateOf(st.name) !== "here").length;
  return (
    <>
      <div style={{ display: "flex", gap: 14, fontFamily: MONO, fontSize: 11, color: TEXT_MUTED, alignItems: "center" }}>
        {ATT_STATES.map(s => <span key={s}>{s} <b style={{ color: TEXT_PRIMARY }}>{count(s)}</b></span>)}
        <button style={{ ...mini, minHeight: HIT, padding: "0 10px", marginLeft: "auto", fontSize: 11.5 }}
          disabled={!marked} onClick={onReset} title="Put everyone back to here">Reset</button>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a name"
          style={{ ...inputStyle, minHeight: 36, fontSize: 15 }} />
        <button onClick={() => setOnly(v => !v)} aria-pressed={only}
          style={{ ...mini, minHeight: 36, whiteSpace: "nowrap", ...(only ? { borderColor: WARN, color: WARN } : {}) }}>
          Exceptions
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {shown.map(st => {
          const s = stateOf(st.name);
          const c = ATT_STYLE[s];
          return (
            <button key={st.name} onClick={() => onMark(st.name, ATT_STATES[(ATT_STATES.indexOf(s) + 1) % ATT_STATES.length])}
              style={{ border: "1px solid " + c.bd, background: c.bg, color: c.fg, borderRadius: 999, padding: "0 13px", minHeight: 34,
                fontSize: 13.5, fontFamily: F, fontWeight: s === "out" ? 400 : 500, cursor: "pointer",
                textDecoration: s === "out" ? "line-through" : "none", opacity: s === "out" ? .55 : 1 }}>
              {st.name}
            </button>
          );
        })}
      </div>
      {!shown.length ? <Muted style={{ fontSize: 13 }}>{only ? "Nobody is marked. The whole room is here." : "No name matches that."}</Muted> : null}
      <Muted style={{ fontSize: 12 }}>Everyone starts here. Tap to cycle here → late → excused → out.</Muted>
    </>
  );
}

// Pre-class and post-class boards. I always drive these by hand — the app
// proposes, I edit, I decide when they go up. Never a bullet list: the screen
// holds one idea at a time and I step through them.
function BoardsPanel({ boards, proposals, onSave, castNow, dismiss, liveCast, accent }) {
  return (
    <>
      {["pre", "post"].map(which => {
        const saved = boards[which];
        const board = saved || proposals[which];
        const label = which === "pre" ? "Before class" : "After class";
        const liveHere = liveCast?.type === "board" && liveCast.boardLabel === label;
        return (
          <BoardEditor key={which} label={label} board={board} isProposal={!saved} accent={accent}
            onSave={(b) => onSave(which, b)} onReset={() => onSave(which, null)}
            liveIndex={liveHere ? liveCast.at : null}
            onCast={(i) => castNow({
              type: "board", tag: label, boardLabel: label, title: board.title,
              idea: (board.ideas || [])[i] || "", at: i, count: (board.ideas || []).length,
              showAsk: which === "pre", label: label + " · " + (i + 1),
            })}
            onDismiss={dismiss} />
        );
      })}
    </>
  );
}

function BoardEditor({ label, board, isProposal, accent, onSave, onReset, liveIndex, onCast, onDismiss }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [text, setText] = useState((board.ideas || []).join("\n"));
  const ideasKey = (board.ideas || []).join("\n");
  useEffect(() => { setTitle(board.title); setText(ideasKey); }, [board.title, ideasKey]);

  const ideas = board.ideas || [];
  const live = liveIndex != null;

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, border: "1px solid " + BORDER, borderRadius: 10 }}>
        <span style={label2}>{label}</span>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Headline" style={inputStyle} />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="One idea per line. Each one gets the screen to itself."
          style={{ ...inputStyle, minHeight: 96, resize: "vertical", lineHeight: 1.5, fontSize: 15 }} />
        <div style={{ display: "flex", gap: 7 }}>
          <button style={solid(accent)} onClick={() => {
            onSave({ title, ideas: text.split("\n").map(l => l.trim()).filter(Boolean) });
            setEditing(false);
          }}>Save</button>
          <button style={mini} onClick={() => setEditing(false)}>Cancel</button>
          {!isProposal ? <button style={{ ...mini, marginLeft: "auto", color: TEXT_MUTED }} onClick={() => { onReset(); setEditing(false); }}>Reset to proposed</button> : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 11,
      border: "1px solid " + (live ? LIVE : BORDER), borderRadius: 10,
      background: live ? "rgba(225,29,72,.06)" : SURFACE_2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={label2}>{label}</span>
        {isProposal ? <span style={{ ...label2, color: accent, fontSize: 10 }}>proposed</span> : null}
        <button style={{ ...mini, minHeight: HIT, padding: "0 10px", marginLeft: "auto", fontSize: 12 }} onClick={() => setEditing(true)}>Edit</button>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{board.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {ideas.map((idea, i) => (
          <button key={i} onClick={() => (liveIndex === i ? onDismiss() : onCast(i))}
            style={{ display: "flex", gap: 9, alignItems: "flex-start", textAlign: "left", cursor: "pointer",
              background: liveIndex === i ? "rgba(225,29,72,.1)" : "#fff",
              border: "1px solid " + (liveIndex === i ? LIVE : "transparent"),
              borderRadius: 9, padding: "8px 10px", minHeight: 40, fontFamily: F, fontSize: 14, color: TEXT_PRIMARY }}>
            <span style={{ ...label2, fontSize: 10, color: liveIndex === i ? LIVE : TEXT_MUTED, paddingTop: 2 }}>{i + 1}</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{idea}</span>
            <span style={{ ...label2, fontSize: 9, color: liveIndex === i ? LIVE : "transparent", paddingTop: 3 }}>up</span>
          </button>
        ))}
        {!ideas.length ? <Muted style={{ fontSize: 13 }}>No ideas yet. Edit to add some.</Muted> : null}
      </div>
      {live ? (
        <div style={{ display: "flex", gap: 7 }}>
          <button style={mini} disabled={liveIndex <= 0} onClick={() => onCast(liveIndex - 1)}>‹ Back</button>
          <button style={mini} disabled={liveIndex >= ideas.length - 1} onClick={() => onCast(liveIndex + 1)}>Next ›</button>
          <button style={{ ...mini, marginLeft: "auto", borderColor: LIVE, color: LIVE }} onClick={onDismiss}>Take it down</button>
        </div>
      ) : null}
    </div>
  );
}

// Saving on blur meant a note written at 8:40 and never clicked away from was
// gone at 9:05. It saves a second after the typing stops instead.
function ScratchPanel({ value, onSave }) {
  const [v, setV] = useState(value || "");
  const [saved, setSaved] = useState(true);
  const boxRef = useRef(null);
  const seen = useRef(value || "");
  useEffect(() => {
    if (value === seen.current) return;
    seen.current = value || "";
    setV(value || "");
  }, [value]);
  useEffect(() => {
    if (v === seen.current) return;
    setSaved(false);
    const t = setTimeout(() => { seen.current = v; onSave(v); setSaved(true); }, 900);
    return () => clearTimeout(t);
  }, [v, onSave]);

  const stamp = () => {
    const t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setV(prev => (prev && !prev.endsWith("\n") ? prev + "\n" : prev) + t + " — ");
    boxRef.current?.focus();
  };

  return (
    <>
      <textarea ref={boxRef} value={v} onChange={e => setV(e.target.value)} onBlur={() => { seen.current = v; onSave(v); setSaved(true); }}
        placeholder="Notes to myself during class."
        style={{ ...inputStyle, minHeight: 130, resize: "vertical", lineHeight: 1.5, fontSize: 15 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <button style={mini} onClick={stamp}>Stamp the time</button>
        <Muted style={{ fontSize: 12, marginLeft: "auto" }}>{saved ? "Saved" : "Saving…"}</Muted>
      </div>
    </>
  );
}

// The to-do panel. Two horizons, because they are two different jobs. TODAY is
// what stops the next fifty minutes going wrong. COMING UP is the assignment on
// the horizon, which is the work I put off until a student emails me about it.
// Green is permission to stop reading the panel.
function Line({ ok, children, tone }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.4,
      color: ok ? TEXT_MUTED : TEXT_PRIMARY }}>
      <span style={{ flex: "none", width: 7, height: 7, borderRadius: "50%", marginTop: 5.5,
        background: ok ? OK : (tone === "late" ? LIVE : WARN) }} />
      <span>{children}</span>
    </div>
  );
}

function Horizon({ title, count, checks, accent, right }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...label, color: accent }}>{title}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: count ? WARN : OK }}>
          {count ? count + " to do" : "clear"}
        </span>
        {right ? <span style={{ ...label, fontSize: 10, marginLeft: "auto", color: TEXT_MUTED }}>{right}</span> : null}
      </div>
      {checks.map((c, i) => <Line key={i} ok={c.ok} tone={c.tone}>{c.ok ? c.good : c.bad}</Line>)}
      {!checks.length ? <Muted style={{ fontSize: 13 }}>Nothing on the calendar.</Muted> : null}
    </div>
  );
}

function TodoPanel({ plan, seq, features, boards, assignments, shelves, students, data, accent }) {
  // ─── today ───
  const slotItems = plan?.slots || {};
  const flowItems = seq ? seq.slots.flatMap(sl => (slotItems[sl.slot]?.items) || []) : [];
  const noClaim = flowItems.filter(it => !it.claim).length
    + flowItems.flatMap(it => it.links || []).filter(l => !l.claim).length;
  const stocked = (shelves.day || []).length + (shelves.week || []).length;

  const today = [
    { ok: !!plan && flowItems.length > 0, good: flowItems.length + " things in the flow", bad: "No content in the flow yet — build it in Day Plan" },
    { ok: noClaim === 0, good: "Every item has its claim written", bad: noClaim + " item" + (noClaim === 1 ? "" : "s") + " will stop and ask for a claim mid-class" },
    { ok: !!boards.pre, good: "Before-class board is written", bad: "Before-class board is still the proposed one" },
    { ok: !!boards.post, good: "After-class board is written", bad: "After-class board is still the proposed one" },
    { ok: stocked > 0, good: stocked + " stocked and ready to reach for", bad: "Nothing stocked for today or this week" },
  ];

  // ─── the assignment on the horizon ───
  const dated = assignments.filter(a => a.due && a.due !== "Ongoing");
  const now = Date.now();
  const daysTo = (due) => {
    const d = new Date(due + ", 2026");
    if (isNaN(d)) return null;
    return Math.ceil((new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime() - now) / 86400000);
  };
  const upcoming = dated
    .map(a => ({ a, days: daysTo(a.due) }))
    .filter(x => x.days != null && x.days >= 0)
    .sort((x, y) => x.days - y.days)[0];

  let coming = [], comingTitle = "Coming up";
  if (upcoming) {
    const { a, days } = upcoming;
    comingTitle = a.title;
    const byStudent = data?.assignmentLog?.[a.id] || {};
    const roster = students.length || 1;
    const submitted = Object.keys(byStudent).filter(n => (byStudent[n] || []).some(e => e.type === "submission")).length;
    const ungraded = Object.keys(byStudent).filter(n => {
      const log = byStudent[n] || [];
      const last = (t) => { for (let i = log.length - 1; i >= 0; i--) if (log[i].type === t) return log[i]; return null; };
      const sub = last("submission"), g = last("grade");
      return !!sub && (!g || sub.ts > g.ts);
    }).length;

    coming = [
      { ok: days > 3, tone: days <= 1 ? "late" : "warn",
        good: "Due " + a.due + ", " + days + " days out",
        bad: days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : "Due in " + days + " days" },
      { ok: !!(a.instructionsUrl || a.description), good: "Instructions are posted", bad: "No instructions posted yet" },
      { ok: !!a.closeAt, good: "Submissions close " + String(a.closeAt).slice(0, 10), bad: "No close date set, so late work lands silently" },
      { ok: submitted >= roster, good: "All " + roster + " have submitted", bad: submitted + " of " + roster + " have submitted" },
      { ok: ungraded === 0, good: "Nothing waiting to be graded", bad: ungraded + " submission" + (ungraded === 1 ? "" : "s") + " waiting to be graded" },
    ];
  }

  const todayLeft = today.filter(c => !c.ok).length;
  const comingLeft = coming.filter(c => !c.ok).length;

  return (
    <>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Horizon title="Today" count={todayLeft} checks={today} accent={accent}
          right={features.length ? features.join(" · ") : ""} />
        <Horizon title={comingTitle} count={comingLeft} checks={coming} accent={accent} />
      </div>
    </>
  );
}

function AssignmentsPanel({ assignments, castNow, dismiss, liveLabel }) {
  if (!assignments.length) return <Muted>No assignments yet.</Muted>;
  return (
    <>
      {assignments.map(a => (
        <Item key={a.id} kind="Reveal" kindColor={LIVE} title={a.title} sub={"Due " + a.due + (a.weight ? " · " + a.weight + "%" : "")}
          live={liveLabel === a.title} onDismiss={dismiss}
          onCast={() => castNow({ type: "reveal", stamp: "Assignment", title: a.title, due: "Due " + a.due, big: true, label: a.title })} />
      ))}
      <Muted style={{ fontSize: 12 }}>Reveals use the big animation.</Muted>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// command bar
// ─────────────────────────────────────────────────────────────
// Mid-sentence, with the room watching, hunting for the right panel is the
// worst thing this screen asks of me. One box over everything castable: three
// letters, Enter, it is up. Cmd+K opens it.
function CommandBar({ targets, accent, onClose }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const lc = q.trim().toLowerCase();
  const hits = (lc ? targets.filter(t => (t.title + " " + t.group).toLowerCase().includes(lc)) : targets).slice(0, 9);
  useEffect(() => { setI(0); }, [lc]);

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setI(x => Math.min(x + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setI(x => Math.max(x - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const h = hits[i]; if (h) { h.run(); onClose(); } }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return (
    <div onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(23,19,16,.35)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "12vh 20px 20px" }}>
      <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Cast something"
        style={{ width: "100%", maxWidth: 620, background: "#fff", borderRadius: 16, border: "1px solid " + BORDER_STRONG, boxShadow: "0 24px 60px -20px rgba(23,19,16,.5)", overflow: "hidden" }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Cast anything — type a few letters"
          style={{ width: "100%", border: "none", borderBottom: "1px solid " + BORDER, outline: "none", padding: "16px 18px", fontFamily: F, fontSize: 18, color: TEXT_PRIMARY }} />
        <div style={{ maxHeight: "46vh", overflowY: "auto" }}>
          {hits.map((t, n) => (
            <button key={t.key} onMouseEnter={() => setI(n)} onClick={() => { t.run(); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", cursor: "pointer",
                background: n === i ? accent + "12" : "#fff", border: "none", borderLeft: "3px solid " + (n === i ? accent : "transparent"),
                padding: "11px 16px", minHeight: TAP, fontFamily: F }}>
              <span style={{ flex: "none", fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
                padding: "3px 6px", borderRadius: 5, border: "1px solid " + BORDER_STRONG, color: TEXT_MUTED }}>{t.group}</span>
              <span style={{ minWidth: 0, flex: 1, fontSize: 15, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
              {n === i ? <span style={{ flex: "none", fontFamily: MONO, fontSize: 10, color: accent, letterSpacing: ".08em" }}>ENTER</span> : null}
            </button>
          ))}
          {!hits.length ? <div style={{ padding: "18px 18px 22px", fontSize: 15, color: TEXT_MUTED }}>Nothing matches that.</div> : null}
        </div>
      </div>
    </div>
  );
}

// Shortcuts only help if I can see them. Recall is what makes people stop using
// them; this sheet turns it back into recognition.
const SHORTCUTS = [
  ["⌘ K", "Open the command bar and cast anything"],
  ["Esc", "Take down whatever is on the room screen"],
  ["⌘ B", "Black the room screen out, and again to bring it back"],
  ["← →", "Step the board that is up, one idea at a time"],
  ["⌘ /", "Show this list"],
];

function ShortcutSheet({ onClose }) {
  return (
    <div onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(23,19,16,.35)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts"
        style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 16, border: "1px solid " + BORDER_STRONG, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={label}>Keyboard</span>
        {SHORTCUTS.map(([k, what]) => (
          <div key={k} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <kbd style={{ flex: "none", minWidth: 46, textAlign: "center", fontFamily: MONO, fontSize: 12, padding: "4px 7px", borderRadius: 6, border: "1px solid " + BORDER_STRONG, background: SURFACE_2, color: TEXT_PRIMARY }}>{k}</kbd>
            <span style={{ fontSize: 14.5, lineHeight: 1.4 }}>{what}</span>
          </div>
        ))}
        <button style={{ ...mini, alignSelf: "flex-start", marginTop: 4 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// live monitor: a real preview of what the room sees
// ─────────────────────────────────────────────────────────────
function Monitor({ config, live, cast, push, recent, onRecast }) {
  const liveUrl = live?.cast?.openUrl || live?.cast?.url || "";
  const box = useRef(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1280));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const [since, setSince] = useState("");
  useEffect(() => {
    const t = setInterval(() => {
      if (!live?.cast || !live.at) { setSince(""); return; }
      const m = Math.floor((Date.now() - live.at) / 60000);
      setSince(m < 1 ? "just now" : m + " min");
    }, 5000);
    return () => clearInterval(t);
  }, [live]);

  const on = !!live?.cast;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, ...label, fontSize: 11 }}>
        {on ? <LiveTag /> : <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: BORDER_STRONG }} />}
        <span style={{ color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {on ? (live.cast.label || live.cast.title) : "Idle screen"}
        </span>
        <span style={{ marginLeft: "auto", color: TEXT_MUTED, flex: "none" }}>{since}</span>
      </div>

      {liveUrl ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10,
          background: "#fff", border: "1px solid " + config.accent, flexWrap: "wrap" }}>
          <a href={liveUrl} target="_blank" rel="noreferrer"
            style={{ ...mini, borderColor: config.accent, color: config.accent, textDecoration: "none",
              display: "inline-flex", alignItems: "center", flex: "none" }}>Open ↗</a>
          <span style={{ minWidth: 0, flex: 1, fontFamily: MONO, fontSize: 11, color: TEXT_MUTED,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={liveUrl}>{hostOf(liveUrl)}</span>
          <div style={{ display: "flex", gap: 4, flex: "none" }}>
            {[["read", "Read"], ["embed", "Page"], ["card", "Card"]].map(([m, lbl]) => (
              <button key={m} style={{ ...mini, minHeight: HIT, padding: "0 10px", fontSize: 11.5,
                ...(live.cast.mode === m ? { background: config.accent, borderColor: config.accent, color: "#fff" } : {}) }}
                onClick={() => cast({ ...live.cast, mode: m, url: m === "embed" ? framable(liveUrl) : liveUrl })}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={box} style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", border: "1px solid " + BORDER_STRONG, background: "#0f0d0c" }}>
        <iframe src={config.path + "/today"} title="Classroom view"
          style={{ width: 1280, height: 720, border: "none", transform: "scale(" + scale + ")", transformOrigin: "top left", position: "absolute", top: 0, left: 0 }} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...mini, flex: 1, ...(on ? {} : { borderColor: config.accent, color: config.accent }) }}
          onClick={() => cast(null)}>Idle screen</button>
        <button style={{ ...mini, flex: 1, ...(live?.cast?.type === "black" ? { background: "#111", borderColor: "#111", color: "#fff" } : {}) }}
          onClick={() => cast({ type: "black", label: "Black screen" })}>Black screen</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...mini, flex: 1, ...(on ? { borderColor: LIVE, color: LIVE } : { opacity: .45 }) }}
          disabled={!on} onClick={() => cast(null)}>Take it down</button>
        <a href={config.path + "/today"} target="_blank" rel="noreferrer" style={{ ...mini, flex: 1, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          Open room screen ↗
        </a>
      </div>

      {recent.length ? (
        <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={label}>Put it back</span>
          {recent.map(r => (
            <button key={r.key} onClick={() => onRecast(r.payload)}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
                background: SURFACE_2, border: "1px solid transparent", borderRadius: 9, padding: "8px 10px", minHeight: 38, fontFamily: F, fontSize: 13.5, color: TEXT_PRIMARY }}>
              <span style={{ minWidth: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              <span style={{ flex: "none", fontFamily: MONO, fontSize: 9.5, letterSpacing: ".08em", color: TEXT_MUTED }}>AGAIN →</span>
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ background: "#fff", border: "1px solid " + BORDER, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <Picker title="Everyday cast" opts={ANIMS} value={live?.anim || "rise"} onPick={v => push({ anim: v })} accent={config.accent} />
        <Picker title="Big reveal" opts={BIG_ANIMS} value={live?.bigAnim || "drop"} onPick={v => push({ bigAnim: v })} accent={config.accent} />
        <Muted style={{ fontSize: 12.5 }}>
          {[...ANIMS, ...BIG_ANIMS].find(a => a.id === (live?.anim || "rise"))?.hint}
        </Muted>
      </div>
    </div>
  );
}

function Picker({ title, opts, value, onPick, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={label}>{title}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {opts.map(o => {
          const on = o.id === value;
          return (
            <button key={o.id} onClick={() => onPick(o.id)} aria-pressed={on}
              style={{ ...mini, fontFamily: MONO, fontSize: 11, letterSpacing: ".05em", textTransform: "uppercase",
                background: on ? accent : "#fff", borderColor: on ? accent : BORDER_STRONG, color: on ? "#fff" : TEXT_SECONDARY }}>
              {o.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────
const DEFAULT_ORDER = ["todo", "now", "poll", "flow", "boards", "stocked", "questions", "attendance", "scratch", "assignments"];
const DEFAULT_SPANS = { todo: "2", now: "2", poll: "2", flow: "2", boards: "1", stocked: "1", questions: "1", attendance: "2", scratch: "1", assignments: "1" };

export default function Dashboard({ config }) {
  const [data, update] = useClassData(config.storageKey);
  const [live, cast, push] = useLive(config.storageKey);
  const q = useQuestions(config.storageKey);
  const P = usePoll(config.storageKey);
  const [hornOpen, setHornOpen] = useState(false);
  const [hlOpen, setHlOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  // What has been up today. Taking something down and wanting it back is the
  // most common thing I do on this screen, and until now it meant finding the
  // row again.
  const [recent, setRecent] = useState([]);
  const HL = useHeadlines(config.storageKey, { categories: data?.headlineCategories, concepts: config.concepts });

  const weeks = data?.schedule || config.scheduleWeeks || [];
  const days = allDays(weeks);
  const [day, setDay] = useState(null);
  useEffect(() => { if (!day && days.length) setDay(currentDay(weeks)?.date || days[0].date); }, [days.length]);

  const plan = (data?.dayPlans || {})[day] || null;
  const seqs = config.sequences || [];
  const seq = seqs.find(s => s.id === (plan?.sequenceId || config.defaultSequenceId)) || seqs[0] || null;
  const seeds = data?.seeds || config.seeds || [];
  const students = data?.students || config.students || [];
  const assignments = data?.assignments || config.assignments || [];
  const week = days.find(d => d.date === day);
  const weekId = week?.weekId || "w?";
  const weekTopic = week?.topic || "";
  const stock = data?.stocked || {};
  const shelves = {
    day: (stock.day || {})[day] || [],
    week: (stock.week || {})[weekId] || [],
    any: stock.any || [],
  };
  const marks = (data?.attendance || {})[day] || {};
  const dayMeta = days.find(d => d.date === day);

  // Features scheduled for this class day, in the order the week lists them.
  const weekRow = weeks.find(w => w.id === weekId);
  const dayName = ["Mon", "Wed", "Fri"][(weekRow?.dates || []).indexOf(day)] || "";
  const features = [];
  ((weekRow?.items) || []).forEach(it => {
    if (it.type !== "activity") return;
    if (it.date && dayName && it.date !== dayName) return;
    if (!features.includes(it.title)) features.push(it.title);
  });

  useEffect(() => { document.title = config.code + " — Dashboard"; }, [config.code]);

  // Keyboard, because during class my hands are the slow part. Nothing fires
  // while I am typing into a field, so the claim editors keep working.
  const liveRef = useRef(null);
  liveRef.current = live;
  const stepRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;
      const cur = liveRef.current?.cast;

      if (mod && (e.key === "k" || e.key === "K")) { e.preventDefault(); setKeysOpen(false); setCmdOpen(v => !v); return; }
      if (mod && e.key === "/") { e.preventDefault(); setCmdOpen(false); setKeysOpen(v => !v); return; }
      if (mod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        cast(cur?.type === "black" ? null : { type: "black", label: "Black screen" });
        return;
      }
      if (typing) return;
      if (e.key === "Escape" && cur) { e.preventDefault(); cast(null); return; }
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && cur?.type === "board" && stepRef.current) {
        e.preventDefault();
        stepRef.current(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cast]);

  // ─── panel layout (my screen preference, so it lives in this browser) ───
  const LKEY = "dash:" + config.id;
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [spans, setSpans] = useState(DEFAULT_SPANS);
  // A panel I am not using today is not neutral, it is one more thing to read
  // past. Hidden ones come off the grid entirely.
  const [hidden, setHidden] = useState([]);
  const [panelMenu, setPanelMenu] = useState(false);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(LKEY) || "null");
      if (v?.order) {
        const kept = v.order.filter(id => DEFAULT_ORDER.includes(id));
        setOrder([...kept, ...DEFAULT_ORDER.filter(id => !kept.includes(id))]);
      }
      if (v?.spans) setSpans({ ...DEFAULT_SPANS, ...v.spans });
      if (Array.isArray(v?.hidden)) setHidden(v.hidden.filter(id => DEFAULT_ORDER.includes(id)));
    } catch { /* first run */ }
  }, [LKEY]);
  const saveLayout = useCallback((o, s, h) => {
    try { localStorage.setItem(LKEY, JSON.stringify({ order: o, spans: s, hidden: h })); } catch { /* private mode */ }
  }, [LKEY]);
  const toggleSpan = (id) => { const s = { ...spans, [id]: spans[id] === "2" ? "1" : "2" }; setSpans(s); saveLayout(order, s, hidden); };
  const toggleHidden = (id) => {
    const h = hidden.includes(id) ? hidden.filter(x => x !== id) : [...hidden, id];
    setHidden(h); saveLayout(order, spans, h);
  };
  const shown = order.filter(id => !hidden.includes(id));

  // ─── drag to rearrange ───
  const gridRef = useRef(null);
  const panelRefs = useRef({});
  const refSetters = useRef({});
  const setPanelRef = useCallback((id) => {
    if (!refSetters.current[id]) refSetters.current[id] = (el) => { panelRefs.current[id] = el; };
    return refSetters.current[id];
  }, []);
  const orderRef = useRef(DEFAULT_ORDER);
  useEffect(() => { orderRef.current = order; }, [order]);
  const dragRef = useRef(null);
  const [dragId, setDragId] = useState(null);

  const onDragStart = (id) => (e) => {
    if (e.button) return;
    const el = panelRefs.current[id];
    if (!el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    dragRef.current = { id, dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height };
    el.style.width = r.width + "px"; el.style.height = r.height + "px";
    el.style.left = r.left + "px"; el.style.top = r.top + "px";
    setDragId(id);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  useEffect(() => {
    if (!dragId) return;
    const move = (e) => {
      const d = dragRef.current; if (!d) return;
      const el = panelRefs.current[d.id]; if (!el) return;
      el.style.left = (e.clientX - d.dx) + "px";
      el.style.top = (e.clientY - d.dy) + "px";
      // Which panel is the pointer over?
      let overId = null;
      order.forEach(id => {
        if (id === d.id) return;
        const p = panelRefs.current[id]; if (!p) return;
        const r = p.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          overId = id + (e.clientY > r.top + r.height / 2 ? ":after" : ":before");
        }
      });
      if (!overId) return;
      const [tid, side] = overId.split(":");
      setOrder(prev => {
        const rest = prev.filter(x => x !== d.id);
        const to = rest.indexOf(tid) + (side === "after" ? 1 : 0);
        const next = [...rest.slice(0, to), d.id, ...rest.slice(to)];
        if (next.join() === prev.join()) return prev;
        orderRef.current = next;
        return next;
      });
    };
    const up = () => {
      const d = dragRef.current;
      if (d) {
        const el = panelRefs.current[d.id];
        if (el) { el.style.width = ""; el.style.height = ""; el.style.left = ""; el.style.top = ""; }
      }
      dragRef.current = null;
      setDragId(null);
      saveLayout(orderRef.current, spans, hidden);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragId, order, spans, hidden, saveLayout]);

  // ─── writes ───
  const writeDay = (fn) => update(prev => {
    const plans = { ...(prev.dayPlans || {}) };
    plans[day] = fn(plans[day] || {});
    return { ...prev, dayPlans: plans };
  });
  const mark = (name, state) => update(prev => {
    const att = { ...(prev.attendance || {}) };
    att[day] = { ...(att[day] || {}), [name]: state };
    return { ...prev, attendance: att };
  });
  const resetAttendance = () => update(prev => {
    const att = { ...(prev.attendance || {}) };
    att[day] = {};
    return { ...prev, attendance: att };
  });
  // Each shelf lives at its own scope: today, this week, or the whole term.
  const setShelf = (shelf, fn) => update(prev => {
    const st = { ...(prev.stocked || {}) };
    if (shelf === "any") { st.any = fn(st.any || []); }
    else {
      const key = shelf === "day" ? day : weekId;
      st[shelf] = { ...(st[shelf] || {}) };
      st[shelf][key] = fn(st[shelf][key] || []);
    }
    return { ...prev, stocked: st };
  });
  // A claim written once stays on the item, so the second time it is one click.
  const saveFlowClaim = (slot, itemId, claim, linkId) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    const bucket = { ...(slots[slot] || {}) };
    bucket.items = (bucket.items || []).map(it => {
      if (it.id !== itemId) return it;
      if (!linkId) return { ...it, claim };
      return { ...it, links: (it.links || []).map(l => l.id === linkId ? { ...l, claim } : l) };
    });
    slots[slot] = bucket;
    return { ...d, slots };
  });
  const saveStockClaim = (shelf, id, claim) =>
    setShelf(shelf, list => list.map(x => x.id === id ? { ...x, claim } : x));

  const saveBoard = (which, board) => writeDay(d => ({ ...d, boards: { ...(d.boards || {}), [which]: board } }));
  const saveScratch = (v) => update(prev => ({ ...prev, scratch: { ...(prev.scratch || {}), [day]: v } }));

  const liveLabel = live?.cast?.label || null;
  const castNow = (payload) => {
    cast(payload);
    const name = payload?.label || payload?.title;
    if (!name || payload.type === "black") return;
    setRecent(prev => [{ key: name + ":" + Date.now(), label: name, payload }, ...prev.filter(r => r.label !== name)].slice(0, 5));
  };
  const dismiss = () => cast(null);
  const markEngaged = () => push({ engagedAt: Date.now() });

  const runFeature = (name) => {
    if (name === "Around the Horn") { setHornOpen(true); markEngaged(); return; }
    if (name === "Headlines") { setHlOpen(true); castNow({ type: "headlines", label: "Headlines" }); markEngaged(); return; }
    castNow({ type: "feature", title: name, body: FEATURES[name] || "", label: name });
    markEngaged();
  };

  const setSeats = (seats) => update(prev => ({ ...prev, athSeats: seats }));
  const awardHorn = (name, amount) => update(prev => ({
    ...prev,
    log: [...(prev.log || []), { id: genId(), student: name, amount, source: "Around the Horn", ts: Date.now(), date: day }],
  }));

  // What the boards say unless I edit them. Built from the schedule so there is
  // always something on the screen worth reading.
  const idx = days.findIndex(d => d.date === day);
  const nextDay = idx >= 0 ? days[idx + 1] : null;
  const weekItems = (weeks.find(w => w.id === weekId)?.items) || [];
  const dueSoon = assignments.filter(a => a.due && a.due !== "Ongoing").slice(0, 2);
  const proposals = {
    pre: {
      title: weekTopic || config.name,
      ideas: [
        plan?.notes || "",
        ...dueSoon.slice(0, 1).map(a => a.title + " is due " + a.due + "."),
      ].filter(Boolean),
    },
    post: {
      title: "Coming up",
      ideas: [
        nextDay ? "Next class " + nextDay.date + (nextDay.topic ? " — " + nextDay.topic : "") + "." : "That's the last session on the calendar.",
        ...dueSoon.map(a => a.title + " — due " + a.due + "."),
      ].filter(Boolean),
    },
  };

  // Arrow keys walk the board that is up. The board panel already knows how to
  // do this; the keyboard needed the same move without the mouse.
  const boardFor = (which) => (plan?.boards || {})[which] || proposals[which];
  stepRef.current = (dir) => {
    const c = liveRef.current?.cast;
    if (!c || c.type !== "board") return;
    const which = c.boardLabel === "Before class" ? "pre" : "post";
    const b = boardFor(which);
    const ideas = b?.ideas || [];
    const i = (c.at || 0) + dir;
    if (i < 0 || i >= ideas.length) return;
    cast({ ...c, idea: ideas[i], at: i, count: ideas.length, label: c.boardLabel + " · " + (i + 1) });
  };

  // Everything the command bar can reach, in the order I would look for it.
  const slotBuckets = plan?.slots || {};
  const cmdTargets = [];
  features.forEach(f => cmdTargets.push({ key: "f:" + f, group: "Run", title: f, run: () => runFeature(f) }));
  (seq?.slots || []).forEach(sl => {
    const bucket = slotBuckets[sl.slot] || {};
    const tag = bucket.title || sl.slot;
    (bucket.items || []).forEach(it => {
      const seed = it.seedId ? seeds.find(x => x.id === it.seedId) : null;
      const title = it.claim || (seed ? seed.title : it.text) || "Untitled";
      cmdTargets.push({ key: "i:" + it.id, group: tag, title,
        run: () => castNow({ type: "quote", tag, title, cite: seed ? seed.concept : "", label: title }) });
      (it.links || []).forEach(l => {
        const t = l.claim || l.label;
        cmdTargets.push({ key: "l:" + l.id, group: "Link", title: t,
          run: () => castNow({ ...castFromLink(l), title: t, label: t }) });
      });
    });
  });
  SHELVES.forEach(sh => (shelves[sh.id] || []).forEach(x => {
    const t = x.claim || x.title;
    cmdTargets.push({ key: "s:" + x.id, group: sh.label, title: t,
      run: () => castNow(x.url
        ? { ...castFromLink({ label: x.title, url: x.url }), title: t, label: t }
        : { type: "quote", tag: sh.label, title: t, label: t }) });
  }));
  ["pre", "post"].forEach(which => {
    const lbl = which === "pre" ? "Before class" : "After class";
    const b = boardFor(which);
    (b?.ideas || []).forEach((idea, i) => cmdTargets.push({ key: "b:" + which + i, group: lbl, title: idea,
      run: () => castNow({ type: "board", tag: lbl, boardLabel: lbl, title: b.title, idea, at: i,
        count: b.ideas.length, showAsk: which === "pre", label: lbl + " · " + (i + 1) }) }));
  });
  assignments.forEach(a => cmdTargets.push({ key: "a:" + a.id, group: "Reveal", title: a.title,
    run: () => castNow({ type: "reveal", stamp: "Assignment", title: a.title, due: "Due " + a.due, big: true, label: a.title }) }));
  (q.items || []).filter(x => x.state === "open").forEach(x => cmdTargets.push({ key: "q:" + x.id, group: "Question", title: x.text,
    run: () => { castNow({ type: "question", tag: "From the room", title: x.text, cite: x.anon ? "Anonymous" : (x.who || ""), label: "Question · " + (x.anon ? "anonymous" : x.who) }); markEngaged(); } }));
  cmdTargets.push({ key: "c:poll", group: "Screen", title: "Live poll", run: () => castNow({ type: "poll", label: "Live poll" }) });
  cmdTargets.push({ key: "c:idle", group: "Screen", title: "Idle screen", run: () => cast(null) });
  cmdTargets.push({ key: "c:black", group: "Screen", title: "Black screen", run: () => cast({ type: "black", label: "Black screen" }) });

  if (data === null || !day) {
    return <div style={{ minHeight: "100vh", background: BG, fontFamily: F, display: "grid", placeItems: "center", color: TEXT_MUTED }}>Loading…</div>;
  }

  const render = {
    todo: () => <TodoPanel plan={plan} seq={seq} features={features} boards={plan?.boards || {}}
      assignments={assignments} shelves={shelves} students={students} data={data} accent={config.accent} />,
    now: () => <NowPanel config={config} plan={plan} seq={seq} engagedAt={live?.engagedAt}
      onEngaged={markEngaged}
      onSlot={(x) => writeDay(d => ({ ...d, currentSlot: x, slotAt: x ? { ...(d.slotAt || {}), [x]: Date.now() } : (d.slotAt || {}) }))} />,
    poll: () => <PollPanel poll={P.poll} start={(qq, oo) => { P.start(qq, oo); markEngaged(); }}
      setPhase={(ph) => { P.setPhase(ph); if (ph === "vote2") markEngaged(); }}
      setCorrect={P.setCorrect} clear={() => { P.clear(); if (live?.cast?.type === "poll") cast(null); }}
      roster={students.length} accent={config.accent}
      onCast={() => cast({ type: "poll", label: "Live poll" })} />,
    flow: () => <FlowPanel plan={plan} seq={seq} seeds={seeds} castNow={castNow} dismiss={dismiss}
      liveLabel={liveLabel} accent={config.accent} onClaim={saveFlowClaim}
      features={features} onFeature={runFeature} planHref={config.path + "/dayplan"} />,
    boards: () => <BoardsPanel boards={plan?.boards || {}} proposals={proposals} onSave={saveBoard}
      castNow={castNow} dismiss={dismiss} liveCast={live?.cast} accent={config.accent} />,
    stocked: () => <StockedPanel shelves={shelves} castNow={castNow} dismiss={dismiss} liveLabel={liveLabel}
      accent={config.accent} onClaim={saveStockClaim}
      onAdd={(sh, item) => setShelf(sh, list => [...list, item])}
      onRemove={(sh, id) => setShelf(sh, list => list.filter(x => x.id !== id))} />,
    questions: () => <QuestionsPanel items={q.items} setState={q.setState} archiveOpen={q.archiveOpen}
      castNow={(pl) => { castNow(pl); markEngaged(); }} accent={config.accent} />,
    attendance: () => <AttendancePanel students={students} marks={marks} onMark={mark} onReset={resetAttendance} />,
    scratch: () => <ScratchPanel value={(data.scratch || {})[day]} onSave={saveScratch} />,
    assignments: () => <AssignmentsPanel assignments={assignments} castNow={castNow} dismiss={dismiss} liveLabel={liveLabel} />,
  };
  const TITLES = { todo: "To-Do", now: "Now", poll: "Poll", flow: "Class Flow", boards: "Before & After", stocked: "Stocked", questions: "Questions", attendance: "Attendance", scratch: "Scratch Pad", assignments: "Assignments" };
  const openQ = (q.items || []).filter(x => x.state === "open").length;
  // Casting from the wrong session is silent and total: the room gets last
  // Wednesday and nothing on this screen says so.
  const onDeck = currentDay(weeks)?.date;
  const offDay = onDeck && day !== onDeck;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, "--dash-accent": config.accent }}>
      <style>{CSS}</style>

      <header style={{ background: "#fff", borderBottom: "1px solid " + BORDER, padding: "13px 22px", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ marginRight: "auto" }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.02em" }}>{config.code} · Dashboard</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED }}>{config.name} · {config.desc}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={label}>Session</span>
          <select value={day} onChange={e => setDay(e.target.value)}
            style={{ ...inputStyle, minHeight: 36, fontSize: 14, width: "auto", padding: "6px 10px" }}>
            {days.map(d => <option key={d.date} value={d.date}>{d.date}{d.topic ? " · " + d.topic : ""}</option>)}
          </select>
        </div>
        <button style={{ ...mini, borderColor: config.accent, color: config.accent }} onClick={() => setCmdOpen(true)}>Cast · ⌘K</button>
        <button style={{ ...mini, borderColor: config.accent, color: config.accent }} onClick={() => setHlOpen(true)}>Headlines</button>
        <button style={{ ...mini, borderColor: config.accent, color: config.accent }} onClick={() => setHornOpen(true)}>Around the Horn</button>
        <div style={{ position: "relative" }}>
          <button style={mini} onClick={() => setPanelMenu(v => !v)} aria-expanded={panelMenu}>Panels</button>
          {panelMenu ? (
            <>
              <div onClick={() => setPanelMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 41, background: "#fff",
                border: "1px solid " + BORDER_STRONG, borderRadius: 12, padding: 8, minWidth: 200,
                boxShadow: "0 16px 36px -12px rgba(23,19,16,.32)", display: "flex", flexDirection: "column", gap: 2 }}>
                {DEFAULT_ORDER.map(id => {
                  const on = !hidden.includes(id);
                  return (
                    <button key={id} onClick={() => toggleHidden(id)}
                      style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer",
                        padding: "0 8px", minHeight: 36, borderRadius: 8, fontFamily: F, fontSize: 14, textAlign: "left",
                        color: on ? TEXT_PRIMARY : TEXT_MUTED }}>
                      <span style={{ flex: "none", width: 8, height: 8, borderRadius: "50%", background: on ? config.accent : BORDER_STRONG }} />
                      {TITLES[id]}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
        <button style={mini} onClick={() => setKeysOpen(true)} title="Keyboard shortcuts">⌘/</button>
        <a href="/plan" style={{ ...mini, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>The Brief</a>
        <a href={config.path} style={{ ...mini, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Class home</a>
      </header>

      {offDay ? (
        <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 22px",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 14, color: "#92400e" }}>
          <span>You are on {day}. The session on deck is {onDeck}, and anything you cast goes to the room either way.</span>
          <button style={{ ...mini, marginLeft: "auto", borderColor: WARN, color: WARN }} onClick={() => setDay(onDeck)}>Go to {onDeck}</button>
        </div>
      ) : null}

      <main style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 400px", gap: 20, padding: 20, alignItems: "start", maxWidth: 1560, margin: "0 auto" }}>
        <div className="dash-grid" ref={gridRef}>
          {shown.map(id => (
            <Panel key={id} id={id} title={TITLES[id] + (id === "questions" && openQ ? " · " + openQ : "")}
              span={spans[id]} onDrag={onDragStart(id)} onSize={() => toggleSpan(id)}
              dragging={dragId === id} refCb={setPanelRef(id)}>
              {render[id]()}
            </Panel>
          ))}
        </div>
        <div style={{ position: "sticky", top: 20 }}>
          <Monitor config={config} live={live} cast={cast} push={push} recent={recent} onRecast={castNow} />
        </div>
      </main>

      {cmdOpen ? <CommandBar targets={cmdTargets} accent={config.accent} onClose={() => setCmdOpen(false)} /> : null}
      {keysOpen ? <ShortcutSheet onClose={() => setKeysOpen(false)} /> : null}

      {hlOpen ? (
        <HeadlinesBoard hl={HL.hl} api={HL} accent={config.accent}
          onCast={() => { cast({ type: "headlines", label: "Headlines" }); markEngaged(); }}
          onClose={() => setHlOpen(false)} />
      ) : null}

      {hornOpen ? (
        <HornBoard students={students} seats={data.athSeats || {}} log={data.log || []} accent={config.accent}
          onSeats={setSeats} onAward={(n, a) => { awardHorn(n, a); markEngaged(); }} onClose={() => setHornOpen(false)} />
      ) : null}

      <div style={{ maxWidth: 1560, margin: "0 auto", padding: "0 20px 40px", fontSize: 12.5, color: TEXT_MUTED }}>
        {dayMeta?.topic ? dayMeta.topic + " · " : ""}Press ⌘K to cast anything, ⌘/ for the rest of the keyboard. Panel arrangement is saved to this browser; everything else syncs to the class.
      </div>
    </div>
  );
}
