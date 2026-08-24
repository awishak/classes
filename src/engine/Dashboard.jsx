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
import { allDays, currentDay, parseDay } from "./days.js";
import { genId } from "../utils.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#eef0f2";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";
const SURFACE_2 = "#f4f3f1";
const LIVE = "#e11d48";
const OK = "#0f766e";
const WARN = "#b45309";
const TAP = 44;

const label = { fontFamily: MONO, fontSize: 11, fontWeight: 600, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: ".12em" };
const mini = { minHeight: 34, padding: "0 12px", borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_SECONDARY, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" };
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
`;

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
        <button onClick={onSize} style={{ ...mini, minHeight: 26, padding: "0 8px", fontFamily: MONO, fontSize: 10, color: TEXT_MUTED }}>
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
      <span className="dash-go" style={{ flex: "none", fontFamily: MONO, fontSize: 10, letterSpacing: ".08em",
        color: live ? LIVE : TEXT_MUTED, fontWeight: live ? 700 : 400, opacity: live ? 1 : 0, transition: "opacity .14s" }}>
        {live ? "TAKE DOWN ×" : "CAST →"}
      </span>
    </button>
  );
}

// Nothing goes up as a label. Before a thing can be cast it needs a claim —
// one full sentence saying what it shows. "Media rights" is a topic; "Rights
// fees have risen 45% in ten years" is what the room can actually read.
function Castable({ kind, kindColor, title, sub, claim, live, accent, onCast, onDismiss, onSaveClaim }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(claim || "");
  useEffect(() => { setDraft(claim || ""); }, [claim]);

  const commit = () => {
    const c = oneSentence(draft);
    if (!c || c.split(" ").length < 3) return;
    onSaveClaim(c);
    onCast(c);
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, border: "1px solid " + accent, borderRadius: 10, background: "#fff" }}>
        <span style={{ ...label, color: accent }}>Say it in one sentence</span>
        <div style={{ fontSize: 12.5, color: TEXT_MUTED }}>{title}</div>
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          placeholder="Rights fees have increased 45% over the last 10 years."
          style={inputStyle} />
        <div style={{ display: "flex", gap: 7 }}>
          <button style={solid(accent)} onClick={commit}>Cast it</button>
          <button style={mini} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Item kind={kind} kindColor={kindColor} title={claim || title} sub={claim ? title : sub}
        live={live} onDismiss={onDismiss}
        onCast={() => { if (claim) onCast(claim); else setEditing(true); }} />
      <button onClick={() => setEditing(true)}
        style={{ alignSelf: "flex-start", background: "none", border: "none", padding: "0 0 0 11px",
          color: TEXT_MUTED, fontFamily: F, fontSize: 12, cursor: "pointer" }}>
        {claim ? "Edit the claim" : "Write the claim"}
      </button>
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
      <span style={{ flex: "none", fontFamily: MONO, fontSize: 10, letterSpacing: ".08em",
        color: live ? LIVE : TEXT_MUTED, fontWeight: live ? 700 : 500 }}>
        {live ? "RUNNING ×" : "RUN →"}
      </span>
    </button>
  );
}

const KIND_COLOR = { Deck: "#7c3aed", PDF: "#b91c1c", Web: "#0369a1", Video: "#b45309", Seed: "#9f1239", Ask: OK, Link: "#0369a1", Note: TEXT_MUTED };

// Guess how a link should land on the screen. Anything we can embed, we embed;
// anything a site refuses to frame becomes a title card the room can read.
const NO_EMBED = /(^|\.)(x\.com|twitter\.com|instagram\.com|facebook\.com|linkedin\.com|nytimes\.com|wsj\.com|espn\.com)$/i;
function castFromLink(l) {
  let host = "";
  try { host = new URL(l.url).hostname.replace(/^www\./, ""); } catch { /* not a url */ }
  const embeddable = !!host && !NO_EMBED.test(host);
  return {
    type: "doc", kind: host || "Link", title: l.label || l.url, url: l.url,
    mode: embeddable ? "embed" : "card", label: l.label || host || "Link",
    body: embeddable ? "" : "Open it on the room machine: " + l.url,
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
      ) : null}
    </>
  );
}

function FlowPanel({ plan, seq, seeds, castNow, dismiss, liveLabel, accent, onClaim, features, onFeature }) {
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
      <Muted>{featureBlock ? "No sequence built for this day yet — add one in Day Plan." : "No plan for this day yet. Build it in Day Plan."}</Muted>
    </>
  );
  const seedById = (id) => seeds.find(s => s.id === id);
  const slotItems = plan.slots || {};
  const any = seq.slots.some(s => (slotItems[s.slot]?.items || []).length);
  if (!any) return (
    <>
      {featureBlock}
      <Muted>This day has a sequence but no content in it yet. Build it in Day Plan.</Muted>
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
                      <Castable kind="Link" kindColor={KIND_COLOR.Link} title={l.label} sub={l.url}
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
            <Castable kind={s.kind} kindColor={KIND_COLOR[s.kind]} title={s.title} sub={s.url}
              claim={s.claim} accent={accent} live={liveLabel === (s.claim || s.title)} onDismiss={dismiss}
              onSaveClaim={(c) => onClaim(s.id, c)}
              onCast={(c) => castNow(s.url
                ? { ...castFromLink({ label: s.title, url: s.url }), title: c, label: c }
                : { type: "quote", tag: shelf.label, title: c, label: c })} />
          </div>
          <button onClick={() => onRemove(s.id)} title="Remove"
            style={{ ...mini, minHeight: 28, padding: "0 8px", color: TEXT_MUTED }}>✕</button>
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

function QuestionsPanel({ items, setState, archiveOpen, castNow, accent }) {
  if (items === null) return <Muted>Loading…</Muted>;
  const open = items.filter(q => q.state === "open");
  const unanswered = items.filter(q => q.state === "archived").length;

  return (
    <>
      {open.length === 0 ? <Muted>Nothing from the room right now.</Muted> : null}
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
            <button style={mini} onClick={() => setState(q.id, "answered")}>Answered</button>
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

function AttendancePanel({ students, marks, onMark }) {
  const stateOf = (n) => marks[n] || "here";
  const count = (s) => students.filter(st => stateOf(st.name) === s).length;
  return (
    <>
      <div style={{ display: "flex", gap: 14, fontFamily: MONO, fontSize: 11, color: TEXT_MUTED }}>
        {ATT_STATES.map(s => <span key={s}>{s} <b style={{ color: TEXT_PRIMARY }}>{count(s)}</b></span>)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {students.map(st => {
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
        <button style={{ ...mini, minHeight: 26, padding: "0 9px", marginLeft: "auto", fontSize: 12 }} onClick={() => setEditing(true)}>Edit</button>
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

function ScratchPanel({ value, onSave }) {
  const [v, setV] = useState(value || "");
  useEffect(() => { setV(value || ""); }, [value]);
  return (
    <textarea value={v} onChange={e => setV(e.target.value)} onBlur={() => onSave(v)}
      placeholder="Notes to myself during class. Saves when I click away."
      style={{ ...inputStyle, minHeight: 130, resize: "vertical", lineHeight: 1.5, fontSize: 15 }} />
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
// live monitor: a real preview of what the room sees
// ─────────────────────────────────────────────────────────────
function Monitor({ config, live, cast, push }) {
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
        <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: on ? LIVE : BORDER_STRONG }} />
        <span style={{ color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {on ? (live.cast.label || live.cast.title) : "Idle screen"}
        </span>
        <span style={{ marginLeft: "auto", color: TEXT_MUTED, flex: "none" }}>{since}</span>
      </div>

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
const DEFAULT_ORDER = ["now", "poll", "flow", "boards", "stocked", "questions", "attendance", "scratch", "assignments"];
const DEFAULT_SPANS = { now: "2", poll: "2", flow: "2", boards: "1", stocked: "1", questions: "1", attendance: "2", scratch: "1", assignments: "1" };

export default function Dashboard({ config }) {
  const [data, update] = useClassData(config.storageKey);
  const [live, cast, push] = useLive(config.storageKey);
  const q = useQuestions(config.storageKey);
  const P = usePoll(config.storageKey);
  const [hornOpen, setHornOpen] = useState(false);

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

  // Cmd/Ctrl+B blacks the room screen out, and again brings it back.
  const liveRef = useRef(null);
  liveRef.current = live;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key !== "b" && e.key !== "B") || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      const cur = liveRef.current?.cast;
      cast(cur?.type === "black" ? null : { type: "black", label: "Black screen" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cast]);

  // ─── panel layout (my screen preference, so it lives in this browser) ───
  const LKEY = "dash:" + config.id;
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [spans, setSpans] = useState(DEFAULT_SPANS);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(LKEY) || "null");
      if (v?.order) {
        const kept = v.order.filter(id => DEFAULT_ORDER.includes(id));
        setOrder([...kept, ...DEFAULT_ORDER.filter(id => !kept.includes(id))]);
      }
      if (v?.spans) setSpans({ ...DEFAULT_SPANS, ...v.spans });
    } catch { /* first run */ }
  }, [LKEY]);
  const saveLayout = useCallback((o, s) => {
    try { localStorage.setItem(LKEY, JSON.stringify({ order: o, spans: s })); } catch { /* private mode */ }
  }, [LKEY]);
  const toggleSpan = (id) => { const s = { ...spans, [id]: spans[id] === "2" ? "1" : "2" }; setSpans(s); saveLayout(order, s); };

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
      saveLayout(orderRef.current, spans);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragId, order, spans, saveLayout]);

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
  const castNow = (payload) => cast(payload);
  const dismiss = () => cast(null);
  const markEngaged = () => push({ engagedAt: Date.now() });

  const runFeature = (name) => {
    if (name === "Around the Horn") { setHornOpen(true); markEngaged(); return; }
    cast({ type: "feature", title: name, body: FEATURES[name] || "", label: name });
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

  if (data === null || !day) {
    return <div style={{ minHeight: "100vh", background: BG, fontFamily: F, display: "grid", placeItems: "center", color: TEXT_MUTED }}>Loading…</div>;
  }

  const render = {
    now: () => <NowPanel config={config} plan={plan} seq={seq} engagedAt={live?.engagedAt}
      onEngaged={markEngaged} onSlot={(x) => writeDay(d => ({ ...d, currentSlot: x }))} />,
    poll: () => <PollPanel poll={P.poll} start={(qq, oo) => { P.start(qq, oo); markEngaged(); }}
      setPhase={(ph) => { P.setPhase(ph); if (ph === "vote2") markEngaged(); }}
      setCorrect={P.setCorrect} clear={() => { P.clear(); if (live?.cast?.type === "poll") cast(null); }}
      roster={students.length} accent={config.accent}
      onCast={() => cast({ type: "poll", label: "Live poll" })} />,
    flow: () => <FlowPanel plan={plan} seq={seq} seeds={seeds} castNow={castNow} dismiss={dismiss}
      liveLabel={liveLabel} accent={config.accent} onClaim={saveFlowClaim}
      features={features} onFeature={runFeature} />,
    boards: () => <BoardsPanel boards={plan?.boards || {}} proposals={proposals} onSave={saveBoard}
      castNow={castNow} dismiss={dismiss} liveCast={live?.cast} accent={config.accent} />,
    stocked: () => <StockedPanel shelves={shelves} castNow={castNow} dismiss={dismiss} liveLabel={liveLabel}
      accent={config.accent} onClaim={saveStockClaim}
      onAdd={(sh, item) => setShelf(sh, list => [...list, item])}
      onRemove={(sh, id) => setShelf(sh, list => list.filter(x => x.id !== id))} />,
    questions: () => <QuestionsPanel items={q.items} setState={q.setState} archiveOpen={q.archiveOpen}
      castNow={(pl) => { castNow(pl); markEngaged(); }} accent={config.accent} />,
    attendance: () => <AttendancePanel students={students} marks={marks} onMark={mark} />,
    scratch: () => <ScratchPanel value={(data.scratch || {})[day]} onSave={saveScratch} />,
    assignments: () => <AssignmentsPanel assignments={assignments} castNow={castNow} dismiss={dismiss} liveLabel={liveLabel} />,
  };
  const TITLES = { now: "Now", poll: "Poll", flow: "Class Flow", boards: "Before & After", stocked: "Stocked", questions: "Questions", attendance: "Attendance", scratch: "Scratch Pad", assignments: "Assignments" };
  const openQ = (q.items || []).filter(x => x.state === "open").length;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY }}>
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
        <button style={{ ...mini, borderColor: config.accent, color: config.accent }} onClick={() => setHornOpen(true)}>Around the Horn</button>
        <a href="/plan" style={{ ...mini, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>The Brief</a>
        <a href={config.path} style={{ ...mini, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Class home</a>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 400px", gap: 20, padding: 20, alignItems: "start", maxWidth: 1560, margin: "0 auto" }}>
        <div className="dash-grid" ref={gridRef}>
          {order.map(id => (
            <Panel key={id} id={id} title={TITLES[id] + (id === "questions" && openQ ? " · " + openQ : "")}
              span={spans[id]} onDrag={onDragStart(id)} onSize={() => toggleSpan(id)}
              dragging={dragId === id} refCb={setPanelRef(id)}>
              {render[id]()}
            </Panel>
          ))}
        </div>
        <div style={{ position: "sticky", top: 20 }}>
          <Monitor config={config} live={live} cast={cast} push={push} />
        </div>
      </main>

      {hornOpen ? (
        <HornBoard students={students} seats={data.athSeats || {}} log={data.log || []} accent={config.accent}
          onSeats={setSeats} onAward={(n, a) => { awardHorn(n, a); markEngaged(); }} onClose={() => setHornOpen(false)} />
      ) : null}

      <div style={{ maxWidth: 1560, margin: "0 auto", padding: "0 20px 40px", fontSize: 12.5, color: TEXT_MUTED }}>
        {dayMeta?.topic ? dayMeta.topic + " · " : ""}Panel arrangement is saved to this browser. Everything else syncs to the class.
      </div>
    </div>
  );
}
