// The Schedule card.
// Student view: clean rendered weeks (topic, dates, items; readings/assignments link out).
// Instructor view: a day/week-planning surface — editable week composer with free text,
// drag-from-library, drag-to-reorder, inline add-to-library, plus lesson plan, slides,
// and seed suggestions per week.
//
// Data lives in the store: data.schedule (weeks) and data.library (reusable items),
// seeded from config.scheduleWeeks / config.library on first edit. Native HTML5
// drag-and-drop, no dependencies.

import { useState } from "react";
import { genId } from "../utils.jsx";
import { addSeedToDay, dayHasSeed } from "./dayplan.js";
import PickMark from "./Pick.jsx";
import * as TOKENS from "./tokens.js";

// The theme's face. Outfit on Clean and Business, Nunito on Snapchat,
// Fredoka on Crashing Out. One declaration, and every use below follows.
const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const BG = TOKENS.SURFACE.page;
const TAP = 44;

const TYPE_META = {
  reading: { color: "#2563eb", label: "Reading" },
  assignment: { color: "#d97706", label: "Assignment" },
  activity: { color: "#047857", label: "Activity" },
};
const TYPES = ["reading", "assignment", "activity"];
const Dot = ({ color }) => <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />;

const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: TAP, background: "#fff", color: TEXT_PRIMARY };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;

// ─── data access (seed from config until the store has its own copy) ───
const getWeeks = (data, config) => data?.schedule || config.scheduleWeeks || [];
const getLibrary = (data, config) => data?.library || config.library || [];

// ─── date helpers ───
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s + ", 2026");
  return isNaN(d) ? null : d;
}
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayOf = (s) => { const d = parseDate(s); return d ? WEEKDAYS[d.getDay()] : null; };
function nearestWeekId(weeks) {
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let best = null, bestDiff = Infinity;
  weeks.forEach(w => {
    (w.dates || []).forEach(ds => {
      const d = parseDate(ds);
      if (!d) return;
      const diff = Math.abs(d.getTime() - t0);
      if (diff < bestDiff) { bestDiff = diff; best = w.id; }
    });
  });
  return best;
}
function nextClass(weeks) {
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let best = null, bestDiff = Infinity;
  weeks.forEach(w => (w.dates || []).forEach(ds => {
    const d = parseDate(ds);
    if (!d) return;
    const diff = d.getTime() - t0;
    if (diff >= 0 && diff < bestDiff) { bestDiff = diff; best = { date: ds, topic: w.topic }; }
  }));
  return best || (weeks[0] ? { date: (weeks[0].dates || [])[0] || "", topic: weeks[0].topic } : null);
}

// ─── drag payload helpers ───
const setDrag = (e, payload) => e.dataTransfer.setData("text/plain", JSON.stringify(payload));
const getDrag = (e) => { try { return JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return null; } };

// ─────────────────────────────────────────────────────────────
// Item row (used in both views)
// ─────────────────────────────────────────────────────────────
function ItemView({ item, picked }) {
  const m = TYPE_META[item.type] || {};
  const inner = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <Dot color={m.color} />
      <span style={{ fontSize: 12, fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</span>
      <span style={{ fontSize: 16, color: TEXT_PRIMARY }}>{item.title}</span>
    </span>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid " + BORDER }}>
      <span style={{ width: 40, flexShrink: 0, fontSize: 13, fontWeight: 700, color: TEXT_SECONDARY }}>{item.date || ""}</span>
      {item.url ? <a href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{inner}</a> : inner}
      {picked ? <PickMark size={26} label /> : null}
    </div>
  );
}

// A week whose topic mentions "final" reads "Finals Week"; otherwise "Week N".
const isFinals = (w) => /final/i.test(w.topic || "");
const weekTag = (w, i) => isFinals(w) ? "Finals Week" : "Week " + (i + 1);
const weekLabel = (w, i) => isFinals(w) ? "Finals Week" : "Week " + (i + 1) + (w.topic ? ": " + w.topic : "");

// Dropdown to jump to a week.
function WeekNav({ weeks, accent }) {
  if ((weeks || []).length < 2) return null;
  const go = (id) => { const el = document.getElementById("wk-" + id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <div style={{ marginBottom: 16 }}>
      <select onChange={e => { if (e.target.value) go(e.target.value); }} defaultValue=""
        style={{ fontFamily: F, fontSize: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, minHeight: TAP, background: "#fff", color: TEXT_PRIMARY, maxWidth: "100%" }}>
        <option value="" disabled>Jump to week…</option>
        {weeks.map((w, i) => <option key={w.id} value={w.id}>{weekLabel(w, i)}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STUDENT VIEW
// ─────────────────────────────────────────────────────────────
export function ScheduleSummary({ config, data }) {
  const weeks = getWeeks(data, config);
  const next = nextClass(weeks);
  if (!next) return <Muted>No classes scheduled.</Muted>;
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: config.accent }}>Next class · {next.date}</div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{next.topic}</div>
    </div>
  );
}

export function ScheduleDetail({ config, role, data, update, blockOf }) {
  if (role === "instructor") return <ScheduleEditor config={config} data={data} update={update} />;
  return <StudentSchedule config={config} data={data} blockOf={blockOf} />;
}

function StudentSchedule({ config, data, blockOf }) {
  const weeks = getWeeks(data, config);
  // A week item points at a block, and the pick lives on the block, so what
  // the students see is worked out from the block rather than stamped on the
  // row when the pick was made.
  const isPicked = (it) => !!(blockOf && blockOf(it.blockId || it.libId)?.pick);
  const current = nearestWeekId(weeks);
  return (
    <div>
      <div style={{ ...h2, marginBottom: 16 }}>Schedule</div>
      <WeekNav weeks={weeks} accent={config.accent} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {weeks.map((w, wi) => {
          const isNow = w.id === current;
          return (
            <div key={w.id} id={"wk-" + w.id} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid " + (isNow ? config.accent : config.accent + "66"), padding: 18, scrollMarginTop: 130 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ ...label, color: config.accent }}>{weekTag(w, wi)}</span>
                {isNow && <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: config.accent, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>This week</span>}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{w.topic || "Untitled week"}</div>
              <div style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 3 }}>{(w.dates || []).join(" · ")}</div>
              {w.text && <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: 10, whiteSpace: "pre-wrap" }}>{w.text}</div>}
              {(w.items || []).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {w.items.map(it => <ItemView key={it.id} item={it} picked={isPicked(it)} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR VIEW — composer + library + planning
// ─────────────────────────────────────────────────────────────
function ScheduleEditor({ config, data, update }) {
  const a = config.accent;
  const weeks = getWeeks(data, config);
  const library = getLibrary(data, config);

  // all mutators reseed from config if the store has no copy yet
  const writeWeeks = (fn) => update(prev => ({ ...prev, schedule: fn(prev.schedule || config.scheduleWeeks || []) }));
  const writeLibrary = (fn) => update(prev => ({ ...prev, library: fn(prev.library || config.library || []) }));

  const setWeekField = (wid, field, val) => writeWeeks(ws => ws.map(w => w.id === wid ? { ...w, [field]: val } : w));
  const removeItem = (wid, iid) => writeWeeks(ws => ws.map(w => w.id === wid ? { ...w, items: (w.items || []).filter(i => i.id !== iid) } : w));
  const setItemDate = (wid, iid, date) => writeWeeks(ws => ws.map(w => w.id === wid ? { ...w, items: w.items.map(i => i.id === iid ? { ...i, date } : i) } : w));

  const insertItem = (wid, item, beforeId) => writeWeeks(ws => ws.map(w => {
    if (w.id !== wid) return w;
    const items = w.items || [];
    if (!beforeId) return { ...w, items: [...items, item] };
    const idx = items.findIndex(i => i.id === beforeId);
    return { ...w, items: idx < 0 ? [...items, item] : [...items.slice(0, idx), item, ...items.slice(idx)] };
  }));

  const addExistingToWeek = (wid, li) => insertItem(wid, { id: genId(), libId: li.id, type: li.type, title: li.title, url: li.url || "", date: "" });

  const dropOnWeek = (wid, beforeId, e) => {
    e.preventDefault(); e.stopPropagation();
    const p = getDrag(e);
    if (!p) return;
    if (p.kind === "lib") {
      const li = library.find(x => x.id === p.libId);
      if (li) insertItem(wid, { id: genId(), libId: li.id, type: li.type, title: li.title, url: li.url || "", date: "" }, beforeId);
    } else if (p.kind === "move") {
      // remove from source, insert into target
      writeWeeks(ws => {
        let moved = null;
        const stripped = ws.map(w => {
          if (w.id !== p.weekId) return w;
          const items = (w.items || []).filter(i => { if (i.id === p.itemId) { moved = i; return false; } return true; });
          return { ...w, items };
        });
        if (!moved) return ws;
        return stripped.map(w => {
          if (w.id !== wid) return w;
          const items = w.items || [];
          const idx = beforeId ? items.findIndex(i => i.id === beforeId) : -1;
          return { ...w, items: idx < 0 ? [...items, moved] : [...items.slice(0, idx), moved, ...items.slice(idx)] };
        });
      });
    }
  };

  const addWeek = () => writeWeeks(ws => [...ws, { id: genId(), topic: "New week", dates: [], text: "", plan: "", slides: "", items: [] }]);
  const removeWeek = (wid) => writeWeeks(ws => ws.filter(w => w.id !== wid));

  // create a brand-new library item and drop it straight into a week
  const addNewToWeek = (wid, type, title) => {
    if (!title.trim()) return;
    const id = genId();
    writeLibrary(lib => [...lib, { id, type, title: title.trim(), url: "" }]);
    insertItem(wid, { id: genId(), libId: id, type, title: title.trim(), url: "", date: "" });
  };

  return (
    <div>
      <div style={{ ...h2, marginBottom: 6 }}>Schedule · Planning</div>

      <WeekNav weeks={weeks} accent={a} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {weeks.map((w, i) => (
          <WeekEditor key={w.id} w={w} wIndex={i} accent={a} config={config} library={library} data={data} update={update}
            setWeekField={setWeekField} removeItem={removeItem} setItemDate={setItemDate}
            dropOnWeek={dropOnWeek} removeWeek={removeWeek} addNewToWeek={addNewToWeek} addExistingToWeek={addExistingToWeek} />
        ))}
      </div>

      <button onClick={addWeek} style={{ marginTop: 16, minHeight: TAP, padding: "0 18px", borderRadius: 999, border: "1px dashed " + BORDER_STRONG, background: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY, cursor: "pointer" }}>+ Add week</button>
    </div>
  );
}

// Searchable picker for adding library items to a week. Type to filter, or use
// a /reading, /activities, /assignments command to filter by type. Click to add.
function LibraryPicker({ library, accent, onPick, onCreate, onClose }) {
  const [q, setQ] = useState("");
  const trimmed = q.trim();
  let typeFilter = null, text = trimmed;
  if (trimmed.startsWith("/")) {
    const rest = trimmed.slice(1);
    const sp = rest.indexOf(" ");
    const word = (sp === -1 ? rest : rest.slice(0, sp)).toLowerCase();
    const map = { reading: "reading", readings: "reading", activity: "activity", activities: "activity", assignment: "assignment", assignments: "assignment" };
    typeFilter = map[word] || null;
    text = sp === -1 ? "" : rest.slice(sp + 1).trim();
  }
  const lc = text.toLowerCase();
  const results = library.filter(li => (!typeFilter || li.type === typeFilter) && li.title.toLowerCase().includes(lc));
  const canCreate = text.length > 0;

  return (
    <div style={{ marginTop: 10, border: "1px solid " + BORDER_STRONG, borderRadius: 12, background: "#fff", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 8, padding: 10, borderBottom: "1px solid " + BORDER }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search the library"
          style={{ ...inputStyle, minHeight: 40 }} />
        <button onClick={onClose} style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_MUTED, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
      <div style={{ maxHeight: 260, overflowY: "auto" }}>
        {results.length === 0 && <div style={{ padding: 14 }}><Muted>No matches.</Muted></div>}
        {results.map(li => {
          const m = TYPE_META[li.type] || {};
          return (
            <button key={li.id} onClick={() => onPick(li)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "#fff", border: "none", borderBottom: "1px solid " + BORDER, padding: "10px 12px", cursor: "pointer", fontFamily: F, minHeight: TAP }}>
              <Dot color={m.color} />
              <span style={{ fontSize: 12, fontWeight: 700, color: m.color, textTransform: "uppercase", width: 80, flexShrink: 0, letterSpacing: "0.04em" }}>{m.label}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{li.title}</span>
              <span style={{ color: accent, fontSize: 22, flexShrink: 0 }}>+</span>
            </button>
          );
        })}
      </div>
      {canCreate && (
        <div style={{ padding: 10, borderTop: "1px solid " + BORDER, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 15, color: TEXT_MUTED }}>Create "{text}" as</span>
          {(typeFilter ? [typeFilter] : TYPES).map(t => (
            <button key={t} onClick={() => onCreate(t, text)}
              style={{ minHeight: 36, padding: "0 14px", borderRadius: 999, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TYPE_META[t].color, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{TYPE_META[t].label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// A suggestion you cannot act on is decoration. These used to be plain spans:
// the right seed, named, with no way to put it anywhere, so nothing ever
// reached a day plan and nothing ever reached the dashboard. Now it asks which
// day and drops the seed into the slot the seed itself asks for.
function SeedSuggestion({ seed, week, accent, config, data, update }) {
  const [picking, setPicking] = useState(false);
  const [landed, setLanded] = useState(null);
  const dates = week.dates || [];

  const add = (date) => {
    const slot = addSeedToDay(update, config, date, seed);
    setPicking(false);
    setLanded(slot ? { date, slot } : { date, slot: null });
  };

  const already = dates.filter(d => dayHasSeed(data, config, d, seed.id));

  return (
    <div style={{ border: "1px solid " + BORDER_STRONG, borderRadius: 12, padding: "10px 12px", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ flex: 1, minWidth: 140, fontSize: 15, fontWeight: 600 }}>{seed.title}</span>
        {seed.slots?.length ? (
          <span style={{ ...label, fontSize: 11 }}>{seed.slots.join(" · ")}</span>
        ) : null}
        <button onClick={() => { setPicking(v => !v); setLanded(null); }}
          style={{ minHeight: TAP, padding: "0 14px", borderRadius: 999, border: "1px solid " + accent,
            background: "#fff", color: accent, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          {picking ? "Cancel" : "Add to a day"}
        </button>
      </div>

      {seed.body ? <div style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: 6 }}>{seed.body}</div> : null}

      {picking ? (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {dates.map(d => (
            <button key={d} onClick={() => add(d)}
              style={{ minHeight: TAP, padding: "0 16px", borderRadius: 999, border: "1px solid " + BORDER_STRONG,
                background: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{d}</button>
          ))}
          {!dates.length ? <Muted>This week has no dates yet.</Muted> : null}
        </div>
      ) : null}

      {landed ? (
        <div style={{ fontSize: 14, marginTop: 8, color: landed.slot ? "#0f766e" : "#b45309", fontWeight: 600 }}>
          {landed.slot
            ? "Added to " + landed.date + " in the " + landed.slot + " slot. It is on the dashboard now."
            : "That day has no sequence to put it in. Pick one in Day Plan first."}
        </div>
      ) : null}

      {!picking && !landed && already.length ? (
        <div style={{ fontSize: 14, marginTop: 8, color: TEXT_MUTED }}>Already on {already.join(", ")}.</div>
      ) : null}
    </div>
  );
}

function WeekEditor({ w, wIndex, accent, config, library, data, update, setWeekField, removeItem, setItemDate, dropOnWeek, removeWeek, addNewToWeek, addExistingToWeek }) {
  const [over, setOver] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editHead, setEditHead] = useState(false);
  const [topicDraft, setTopicDraft] = useState(w.topic || "");
  const [datesDraft, setDatesDraft] = useState((w.dates || []).join(", "));
  const [textDraft, setTextDraft] = useState(w.text || "");
  const [editPlan, setEditPlan] = useState(false);
  const [planDraft, setPlanDraft] = useState(w.plan || "");
  const [slidesDraft, setSlidesDraft] = useState(w.slides || "");

  const openEdit = () => { setTopicDraft(w.topic || ""); setDatesDraft((w.dates || []).join(", ")); setTextDraft(w.text || ""); setEditHead(true); };
  const saveHead = () => {
    setWeekField(w.id, "topic", topicDraft.trim() || "Untitled week");
    setWeekField(w.id, "dates", datesDraft.split(",").map(s => s.trim()).filter(Boolean));
    setWeekField(w.id, "text", textDraft);
    setEditHead(false);
  };
  const openPlanEdit = () => { setPlanDraft(w.plan || ""); setSlidesDraft(w.slides || ""); setEditPlan(true); };
  const savePlan = () => { setWeekField(w.id, "plan", planDraft); setWeekField(w.id, "slides", slidesDraft.trim()); setEditPlan(false); };
  const dayOptions = (() => {
    const fromDates = (w.dates || []).map(dayOf).filter(Boolean);
    return fromDates.length ? [...new Set(fromDates)] : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  })();

  const seeds = (config.seeds || []).filter(s => {
    const topic = (w.topic || "").toLowerCase();
    return topic && (s.concept || "").toLowerCase().split(/\s+/).some(word => word && topic.includes(word));
  });

  return (
    <div id={"wk-" + w.id} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid " + accent, padding: 18, scrollMarginTop: 130 }}>
      {/* header + free text: read-only with an Edit button; inline edit on demand */}
      {editHead ? (
        <div>
          <input value={topicDraft} onChange={e => setTopicDraft(e.target.value)} autoFocus placeholder="Week topic"
            style={{ ...inputStyle, fontSize: 17, fontWeight: 600, minHeight: 40, padding: "8px 10px" }} />
          <input value={datesDraft} onChange={e => setDatesDraft(e.target.value)} placeholder="Sep 21, Sep 23, Sep 25"
            style={{ ...inputStyle, fontSize: 15, minHeight: 38, padding: "6px 10px", marginTop: 6, color: TEXT_SECONDARY }} />
          <div style={{ ...label, marginTop: 12 }}>Notes for students</div>
          <textarea value={textDraft} onChange={e => setTextDraft(e.target.value)} placeholder="What students see"
            style={{ ...inputStyle, minHeight: 80, lineHeight: 1.5, resize: "vertical", marginTop: 6 }} />
          <button onClick={saveHead}
            style={{ marginTop: 10, minHeight: TAP, padding: "0 18px", borderRadius: 10, border: "none", background: accent, color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Save</button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...label, color: accent, marginBottom: 4 }}>{weekTag(w, wIndex)}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: TEXT_PRIMARY }}>{w.topic || "Untitled week"}</div>
              <div style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 3 }}>{(w.dates || []).join(" · ") || "No dates set"}</div>
            </div>
            <button onClick={openEdit} title="Edit week"
              style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_SECONDARY, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>Edit</button>
            <button onClick={() => removeWeek(w.id)} title="Remove week"
              style={{ minHeight: 40, minWidth: 40, borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_MUTED, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
          {w.text && <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: 10, whiteSpace: "pre-wrap" }}>{w.text}</div>}
        </div>
      )}

      {/* items — drop zone */}
      <div onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={e => { setOver(false); dropOnWeek(w.id, null, e); }}
        style={{ marginTop: 12, borderRadius: 12, border: "1.5px dashed " + (over ? accent : BORDER), padding: 10, background: over ? accent + "0c" : "transparent" }}>
        {(w.items || []).length === 0 && <Muted style={{ textAlign: "center", padding: "8px 0" }}>No items yet.</Muted>}
        {(w.items || []).map(it => {
          const m = TYPE_META[it.type] || {};
          return (
            <div key={it.id} draggable onDragStart={e => setDrag(e, { kind: "move", weekId: w.id, itemId: it.id })}
              onDragOver={e => e.preventDefault()} onDrop={e => dropOnWeek(w.id, it.id, e)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid " + BORDER, borderLeft: "3px solid " + m.color, borderRadius: 10, padding: "8px 10px", marginBottom: 8, cursor: "grab" }}>
              <select value={it.date || ""} onChange={e => setItemDate(w.id, it.id, e.target.value)}
                style={{ fontFamily: F, fontSize: 13, padding: "6px 8px", borderRadius: 8, border: "1px solid " + BORDER_STRONG, minHeight: 36, flexShrink: 0 }}>
                <option value="">no day</option>
                {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <Dot color={m.color} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</span>
              <button onClick={() => removeItem(w.id, it.id)} style={{ minHeight: 36, minWidth: 36, borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_MUTED, cursor: "pointer" }}>✕</button>
            </div>
          );
        })}
      </div>

      {/* add from library (search / slash command) or create new */}
      {addOpen ? (
        <LibraryPicker library={library} accent={accent}
          onPick={(li) => addExistingToWeek(w.id, li)}
          onCreate={(type, title) => addNewToWeek(w.id, type, title)}
          onClose={() => setAddOpen(false)} />
      ) : (
        <button onClick={() => setAddOpen(true)} style={{ marginTop: 10, background: "none", border: "none", color: accent, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0 }}>+ Add item</button>
      )}

      {/* lesson plan — its own section, shown if present */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + BORDER }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={label}>Lesson plan</div>
          {!editPlan && (w.plan || w.slides) && (
            <button onClick={openPlanEdit}
              style={{ minHeight: 36, padding: "0 12px", borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_SECONDARY, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
          )}
        </div>

        {editPlan ? (
          <div style={{ marginTop: 10 }}>
            <textarea value={planDraft} onChange={e => setPlanDraft(e.target.value)} autoFocus placeholder="The week"
              style={{ ...inputStyle, minHeight: 96, lineHeight: 1.5, resize: "vertical" }} />
            <input value={slidesDraft} onChange={e => setSlidesDraft(e.target.value)} placeholder="Slides link"
              style={{ ...inputStyle, marginTop: 8 }} />
            <button onClick={savePlan}
              style={{ marginTop: 10, minHeight: TAP, padding: "0 18px", borderRadius: 10, border: "none", background: accent, color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Save</button>
          </div>
        ) : (w.plan || w.slides) ? (
          <div style={{ marginTop: 8 }}>
            {w.plan && <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{w.plan}</div>}
            {w.slides && <a href={w.slides} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: w.plan ? 10 : 0, fontSize: 15, fontWeight: 600, color: accent, textDecoration: "underline" }}>Open slides</a>}
          </div>
        ) : (
          <button onClick={openPlanEdit}
            style={{ marginTop: 8, background: "none", border: "none", color: accent, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0 }}>+ Add lesson plan</button>
        )}

        <div style={{ ...label, marginTop: 14 }}>Seed suggestions</div>
        {seeds.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {seeds.map(s => (
              <SeedSuggestion key={s.id} seed={s} week={w} accent={accent}
                config={config} data={data} update={update} />
            ))}
          </div>
        ) : <Muted style={{ marginTop: 6 }}>No matching seeds.</Muted>}
      </div>
    </div>
  );
}
