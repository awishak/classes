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
function Item({ kind, kindColor, title, sub, live, onCast, accent }) {
  return (
    <button className="dash-item" onClick={onCast}
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
        {live ? "LIVE" : "CAST →"}
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
function NowPanel({ config, day, plan, seq, onSlot }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(t); }, []);
  const meets = config.meets || {};
  const mins = (hhmm) => { const [h, m] = (hhmm || "").split(":").map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
  const start = mins(meets.start), end = mins(meets.end);
  const cur = now.getHours() * 60 + now.getMinutes();
  const inClass = start != null && end != null && cur >= start && cur <= end;
  const left = end != null ? Math.max(0, end - cur) : null;
  const pct = (start != null && end != null && end > start) ? Math.min(100, Math.max(0, ((cur - start) / (end - start)) * 100)) : 0;
  const slots = seq ? seq.slots.map(s => s.slot) : [];
  const current = plan?.currentSlot;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, letterSpacing: "-.03em", lineHeight: 1, color: TEXT_PRIMARY }}>
          {inClass ? left + " min" : (start != null ? "—" : "no times set")}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, paddingBottom: 3 }}>
          {inClass ? "left · out at " + (meets.end || "") : (config.desc || "")}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: SURFACE_2, overflow: "hidden" }}>
        <i style={{ display: "block", height: "100%", width: pct + "%", background: config.accent, borderRadius: 3 }} />
      </div>
      {slots.length ? (
        <div style={{ display: "flex", gap: 5 }}>
          {slots.map(s => {
            const on = s === current;
            return (
              <button key={s} onClick={() => onSlot(on ? null : s)}
                style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <i style={{ display: "block", height: 4, borderRadius: 2, background: on ? config.accent : BORDER }} />
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".09em", textTransform: "uppercase", color: on ? config.accent : TEXT_MUTED, fontWeight: on ? 700 : 400 }}>{s}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

function FlowPanel({ plan, seq, seeds, castNow, liveLabel, accent }) {
  if (!plan || !seq) return <Muted>No plan for this day yet. Build it in Day Plan.</Muted>;
  const seedById = (id) => seeds.find(s => s.id === id);
  const slotItems = plan.slots || {};
  const any = seq.slots.some(s => (slotItems[s.slot]?.items || []).length);
  if (!any) return <Muted>This day has a sequence but no content in it yet. Build it in Day Plan.</Muted>;

  return (
    <>
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
              const c = { type: "quote", tag: bucket.title || s.slot, title, cite: seed ? seed.concept : "", label: title };
              return (
                <div key={it.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Item kind={seed ? "Seed" : "Note"} kindColor={KIND_COLOR[seed ? "Seed" : "Note"]}
                    title={title} sub={body ? body.slice(0, 70) : ""} live={liveLabel === title}
                    onCast={() => castNow(c)} accent={accent} />
                  {(it.links || []).map(l => (
                    <div key={l.id} style={{ paddingLeft: 16 }}>
                      <Item kind="Link" kindColor={KIND_COLOR.Link} title={l.label} sub={l.url}
                        live={liveLabel === (l.label || l.url)} onCast={() => castNow(castFromLink(l))} accent={accent} />
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

function StockedPanel({ stocked, onAdd, onRemove, castNow, liveLabel, accent }) {
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
    <>
      <Muted>Loaded before class. Not in the plan — here if I need it.</Muted>
      {(stocked || []).map(s => (
        <div key={s.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Item kind={s.kind} kindColor={KIND_COLOR[s.kind]} title={s.title} sub={s.url}
              live={liveLabel === s.title}
              onCast={() => castNow(s.url ? castFromLink({ label: s.title, url: s.url }) : { type: "quote", tag: "Stocked", title: s.title, label: s.title })}
              accent={accent} />
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
        <button onClick={() => setOpen(true)} style={{ ...mini, alignSelf: "flex-start" }}>+ Stock something</button>
      )}
    </>
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

function ScratchPanel({ value, onSave }) {
  const [v, setV] = useState(value || "");
  useEffect(() => { setV(value || ""); }, [value]);
  return (
    <textarea value={v} onChange={e => setV(e.target.value)} onBlur={() => onSave(v)}
      placeholder="Notes to myself during class. Saves when I click away."
      style={{ ...inputStyle, minHeight: 130, resize: "vertical", lineHeight: 1.5, fontSize: 15 }} />
  );
}

function AssignmentsPanel({ assignments, castNow, liveLabel, accent }) {
  if (!assignments.length) return <Muted>No assignments yet.</Muted>;
  return (
    <>
      {assignments.map(a => (
        <Item key={a.id} kind="Reveal" kindColor={LIVE} title={a.title} sub={"Due " + a.due + (a.weight ? " · " + a.weight + "%" : "")}
          live={liveLabel === a.title}
          onCast={() => castNow({ type: "reveal", stamp: "Assignment", title: a.title, due: "Due " + a.due, big: true, label: a.title })}
          accent={accent} />
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
        <button style={{ ...mini, flex: 1 }} onClick={() => cast(null)}>Back to idle</button>
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
const DEFAULT_ORDER = ["now", "flow", "stocked", "questions", "attendance", "scratch", "assignments"];
const DEFAULT_SPANS = { now: "2", flow: "2", stocked: "1", questions: "1", attendance: "2", scratch: "1", assignments: "1" };

export default function Dashboard({ config }) {
  const [data, update] = useClassData(config.storageKey);
  const [live, cast, push] = useLive(config.storageKey);
  const q = useQuestions(config.storageKey);

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
  const stocked = (data?.stocked || {})[day] || [];
  const marks = (data?.attendance || {})[day] || {};
  const dayMeta = days.find(d => d.date === day);

  useEffect(() => { document.title = config.code + " — Dashboard"; }, [config.code]);

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
  const setStocked = (fn) => update(prev => {
    const st = { ...(prev.stocked || {}) };
    st[day] = fn(st[day] || []);
    return { ...prev, stocked: st };
  });
  const saveScratch = (v) => update(prev => ({ ...prev, scratch: { ...(prev.scratch || {}), [day]: v } }));

  const liveLabel = live?.cast?.label || null;
  const castNow = (payload) => cast(payload);

  if (data === null || !day) {
    return <div style={{ minHeight: "100vh", background: BG, fontFamily: F, display: "grid", placeItems: "center", color: TEXT_MUTED }}>Loading…</div>;
  }

  const render = {
    now: () => <NowPanel config={config} day={day} plan={plan} seq={seq} onSlot={(s) => writeDay(d => ({ ...d, currentSlot: s }))} />,
    flow: () => <FlowPanel plan={plan} seq={seq} seeds={seeds} castNow={castNow} liveLabel={liveLabel} accent={config.accent} />,
    stocked: () => <StockedPanel stocked={stocked} castNow={castNow} liveLabel={liveLabel} accent={config.accent}
      onAdd={(s) => setStocked(list => [...list, s])} onRemove={(id) => setStocked(list => list.filter(x => x.id !== id))} />,
    questions: () => <QuestionsPanel items={q.items} setState={q.setState} archiveOpen={q.archiveOpen} castNow={castNow} accent={config.accent} />,
    attendance: () => <AttendancePanel students={students} marks={marks} onMark={mark} />,
    scratch: () => <ScratchPanel value={(data.scratch || {})[day]} onSave={saveScratch} />,
    assignments: () => <AssignmentsPanel assignments={assignments} castNow={castNow} liveLabel={liveLabel} accent={config.accent} />,
  };
  const TITLES = { now: "Now", flow: "Class Flow", stocked: "Stocked", questions: "Questions", attendance: "Attendance", scratch: "Scratch Pad", assignments: "Assignments" };
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

      <div style={{ maxWidth: 1560, margin: "0 auto", padding: "0 20px 40px", fontSize: 12.5, color: TEXT_MUTED }}>
        {dayMeta?.topic ? dayMeta.topic + " · " : ""}Panel arrangement is saved to this browser. Everything else syncs to the class.
      </div>
    </div>
  );
}
