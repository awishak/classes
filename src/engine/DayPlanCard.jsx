// The Day Plan card (instructor-only).
// Open a class day and build its lesson as a flow: pick the day, pick a sequence,
// and work each slot (section). A slot holds an ORDERED LIST of content items —
// stack as many seeds / text snippets in one section as you like. Everything is
// editable for the day without touching the template:
//   - per-day slot title + subtitle (reset to the sequence default any time)
//   - add multiple library seeds, quick per-day text, or create+title new
//     reusable seeds, all into the same section
//   - edit an item's body, saving the edit for this day only or back to the
//     library (everywhere it's used)
//   - attach links (clips, docs, articles) to any item or block
//   - freeform titled blocks you can drag to reorder
//   - per-day slides link + notes (explicit Save), at the top
//
// Day plans live in the store at data.dayPlans[date] =
//   { sequenceId, slots, blocks, slides, notes }
// where slots[slot] = { title?, note?, items: [{ id, seedId?, text?, bodyOverride?, links? }] }.
// (Older single-item slots are normalized on read.) Sequences are read from
// config. Seeds are store-backed (data.seeds overrides config.seeds) so they can
// be edited and created in-app, like the schedule.

import { useState } from "react";
import { genId } from "../utils.jsx";
import { normSlot, blankDay, sequenceOptions, sequenceFor, dayPlanFor, FREEFORM } from "./dayplan.js";
import { scheduledFor, plannedItemIds, addScheduleItemToDay, TYPE_COLOR, typeLabel } from "./schedule.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#646b75"; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = "#eef0f2";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";
const TAP = 44;

const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: TAP, background: "#fff", color: TEXT_PRIMARY };
const selectStyle = { fontFamily: F, fontSize: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, minHeight: TAP, background: "#fff", color: TEXT_PRIMARY, maxWidth: "100%" };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;
const ghostBtn = { minHeight: 32, padding: "0 12px", borderRadius: 8, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_SECONDARY, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const linkBtn = (accent) => ({ background: "none", border: "none", color: accent, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0 });
const primaryBtn = (accent) => ({ minHeight: 40, padding: "0 16px", borderRadius: 10, border: "none", background: accent, color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" });

// per-card color palette (item cards can be tinted to color-code the flow)
const ITEM_COLORS = ["#ef4444", "#f59e0b", "#eab308", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

// ─── data access ───
const getWeeks = (data, config) => data?.schedule || config.scheduleWeeks || [];
const getDayPlans = (data) => data?.dayPlans || {};
const getSeeds = (data, config) => data?.seeds || config.seeds || [];
const slotLabel = (s) => s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

const setDrag = (e, id) => e.dataTransfer.setData("text/plain", id);
const getDrag = (e) => e.dataTransfer.getData("text/plain");

// ─── dates ───
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s + ", 2026");
  return isNaN(d) ? null : d;
}
function allDays(weeks) {
  const days = [];
  weeks.forEach((w, wi) => (w.dates || []).forEach(ds => days.push({ date: ds, weekId: w.id, weekIndex: wi, topic: w.topic || "" })));
  return days;
}
function defaultDay(weeks) {
  const days = allDays(weeks);
  if (!days.length) return null;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let upcoming = null, best = Infinity;
  days.forEach(d => {
    const dt = parseDate(d.date);
    if (!dt) return;
    const diff = dt.getTime() - t0;
    if (diff >= 0 && diff < best) { best = diff; upcoming = d; }
  });
  return (upcoming || days[0]).date;
}

// ─── matching: rank seeds for a given slot + topic ───
const words = (s) => (s || "").toLowerCase().split(/\W+/).filter(w => w.length > 2);
function scoreSeed(seed, topic) {
  if (!topic) return 0;
  const hay = (seed.concept + " " + seed.title + " " + (seed.body || "")).toLowerCase();
  return words(topic).reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
}
function candidatesFor(seeds, slot, topic, usedIds) {
  return seeds
    .filter(s => (s.slots || []).includes(slot) && !usedIds.has(s.id))
    .map(s => ({ seed: s, score: scoreSeed(s, topic) }))
    .sort((a, b) => b.score - a.score);
}

// ─── day-plan read helpers ───

// ─────────────────────────────────────────────────────────────
// SUMMARY (instructor home tile)
// ─────────────────────────────────────────────────────────────
export function DayPlanSummary({ config, data }) {
  const weeks = getWeeks(data, config);
  const date = defaultDay(weeks);
  if (!date) return <Muted>No class days scheduled.</Muted>;
  const day = allDays(weeks).find(d => d.date === date);
  const plan = dayPlanFor(data, config, date);
  const seq = sequenceFor(config, plan.sequenceId);
  const filled = seq.slots.filter(s => normSlot(plan.slots[s.slot]).items.length > 0).length;
  const detail = seq.slots.length
    ? `${filled} of ${seq.slots.length} slots planned`
    : `${(plan.blocks || []).length} block${(plan.blocks || []).length === 1 ? "" : "s"}`;
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: config.accent }}>Next class · {date}</div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{day?.topic || "Untitled"}</div>
      <div style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 4 }}>{detail}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL (the planning surface)
// ─────────────────────────────────────────────────────────────
export function DayPlanDetail({ config, data, update, initialDate }) {
  const a = config.accent;
  const weeks = getWeeks(data, config);
  const days = allDays(weeks);
  const [date, setDate] = useState(initialDate || defaultDay(weeks) || (days[0] && days[0].date) || "");

  if (!days.length) return <div><div style={{ ...h2, marginBottom: 12 }}>Day Plan</div><Muted>No class days scheduled yet. Add dates in the Schedule.</Muted></div>;

  const day = days.find(d => d.date === date) || days[0];
  const topic = day.topic;
  const plan = dayPlanFor(data, config, date);
  const seq = sequenceFor(config, plan.sequenceId);
  const seeds = getSeeds(data, config);

  // ─── day-plan mutators ───
  const writeDay = (fn) => update(prev => {
    const dayPlans = { ...(prev.dayPlans || {}) };
    dayPlans[date] = fn({ ...blankDay(config), ...(dayPlans[date] || {}) });
    return { ...prev, dayPlans };
  });
  const setSequence = (id) => writeDay(d => ({ ...d, sequenceId: id }));
  const writeSlot = (slot, fn) => writeDay(d => ({ ...d, slots: { ...d.slots, [slot]: fn(normSlot(d.slots[slot])) } }));
  const addItem = (slot, item) => writeSlot(slot, s => ({ ...s, items: [...s.items, { id: genId(), ...item }] }));
  const updateItem = (slot, id, patch) => writeSlot(slot, s => ({ ...s, items: s.items.map(it => it.id === id ? { ...it, ...patch } : it) }));
  const removeItem = (slot, id) => writeSlot(slot, s => ({ ...s, items: s.items.filter(it => it.id !== id) }));
  const setHeader = (slot, title, note) => writeSlot(slot, s => ({ ...s, title, note }));

  const addBlock = () => writeDay(d => ({ ...d, blocks: [...(d.blocks || []), { id: genId(), title: "", body: "", links: [] }] }));
  const updateBlock = (id, patch) => writeDay(d => ({ ...d, blocks: (d.blocks || []).map(b => b.id === id ? { ...b, ...patch } : b) }));
  const removeBlock = (id) => writeDay(d => ({ ...d, blocks: (d.blocks || []).filter(b => b.id !== id) }));
  const moveBlock = (dragId, beforeId) => writeDay(d => {
    if (dragId === beforeId) return d;
    const blocks = [...(d.blocks || [])];
    const from = blocks.findIndex(b => b.id === dragId);
    if (from < 0) return d;
    const [moved] = blocks.splice(from, 1);
    const to = beforeId ? blocks.findIndex(b => b.id === beforeId) : blocks.length;
    blocks.splice(to < 0 ? blocks.length : to, 0, moved);
    return { ...d, blocks };
  });

  // ─── seed (library) mutators ───
  const writeSeeds = (fn) => update(prev => ({ ...prev, seeds: fn(prev.seeds || config.seeds || []) }));
  const updateSeedBody = (seedId, body) => writeSeeds(s => s.map(x => x.id === seedId ? { ...x, body } : x));
  const createSeedInSlot = (slot, { title, body, concept }) => {
    const id = genId();
    writeSeeds(s => [...s, { id, title: title.trim(), body: body.trim(), concept: (concept || "").trim(), classes: ["any"], slots: [slot], source: "Created in day plan" }]);
    addItem(slot, { seedId: id });
  };

  return (
    <div>
      <div style={{ ...h2, marginBottom: 4 }}>Day Plan</div>
      <Muted style={{ marginBottom: 14 }}>Build the day. Stack seeds and text in each section, edit anything for the day, attach links.</Muted>

      {/* day + sequence pickers */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ ...label, marginBottom: 4 }}>Class day</div>
          <select value={date} onChange={e => setDate(e.target.value)} style={selectStyle}>
            {days.map(d => <option key={d.date} value={d.date}>{d.date}{d.topic ? " — " + d.topic : ""}</option>)}
          </select>
        </div>
        <div>
          <div style={{ ...label, marginBottom: 4 }}>Sequence</div>
          <select value={plan.sequenceId} onChange={e => setSequence(e.target.value)} style={selectStyle}>
            {sequenceOptions(config).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* topic */}
      <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: a + "0c", border: "1px solid " + a + "33" }}>
        <div style={{ ...label, color: a }}>Topic</div>
        <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{topic || "No topic set for this week"}</div>
        {seq.desc && <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6 }}>{seq.name} · {seq.desc}</div>}
      </div>

      <OnTheSchedule config={config} data={data} update={update} date={date} accent={a} slots={seq.slots.map(x => x.slot)} />

      {/* slides + notes — top of the day, explicit Save (remounts per day) */}
      <SlidesNotes key={date} plan={plan} accent={a}
        onSave={(slides, notes) => writeDay(d => ({ ...d, slides, notes }))} />

      {/* slots */}
      {seq.slots.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {seq.slots.map((slotDef, i) => {
            const sl = normSlot(plan.slots[slotDef.slot]);
            return (
              <SlotRow key={slotDef.slot} index={i} slotDef={slotDef} accent={a} slotData={sl} seeds={seeds} topic={topic}
                onSetHeader={(title, note) => setHeader(slotDef.slot, title, note)}
                onResetHeader={() => setHeader(slotDef.slot, undefined, undefined)}
                onAddSeed={(seedId) => addItem(slotDef.slot, { seedId })}
                onAddText={(text) => addItem(slotDef.slot, { text })}
                onCreateSeed={(payload) => createSeedInSlot(slotDef.slot, payload)}
                onUpdateItem={(id, patch) => updateItem(slotDef.slot, id, patch)}
                onRemoveItem={(id) => removeItem(slotDef.slot, id)}
                onSaveSeedBody={(seedId, body) => updateSeedBody(seedId, body)} />
            );
          })}
        </div>
      )}

      {/* custom blocks */}
      <div style={{ marginTop: 16 }}>
        {seq.slots.length > 0 && (plan.blocks || []).length > 0 && <div style={{ ...label, marginBottom: 8 }}>Extra blocks</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(plan.blocks || []).map(b => (
            <BlockRow key={b.id} block={b} accent={a}
              onChange={(patch) => updateBlock(b.id, patch)} onRemove={() => removeBlock(b.id)}
              onDropBefore={(dragId) => moveBlock(dragId, b.id)} />
          ))}
        </div>
        {seq.slots.length === 0 && (plan.blocks || []).length === 0 && (
          <Muted style={{ marginBottom: 10 }}>Freeform day — add blocks to build the flow.</Muted>
        )}
        <button onClick={addBlock}
          style={{ marginTop: (plan.blocks || []).length ? 12 : 0, minHeight: TAP, padding: "0 16px", borderRadius: 999, border: "1px dashed " + BORDER_STRONG, background: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY, cursor: "pointer" }}>+ Add block</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SLOT (a section that holds a list of items)
// ─────────────────────────────────────────────────────────────
// The schedule already knows a reading is assigned on Wednesday. Until now the
// day plan could not see it, so the reading sat on one screen and the plan for
// that day sat on another. This is that list, under the topic, with a way into
// a slot for each one.
function OnTheSchedule({ config, data, update, date, accent, slots }) {
  const [picking, setPicking] = useState(null);
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const items = scheduledFor(weeks, date);
  if (!items.length) return null;

  const have = plannedItemIds(data, config, date);

  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: "1px solid " + BORDER_STRONG, background: "#fff" }}>
      <div style={{ ...label, marginBottom: 8 }}>On the schedule for {date}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(it => {
          const inPlan = have.has(it.id);
          const open = picking === it.id;
          return (
            <div key={it.id} style={{ border: "1px solid " + BORDER, borderRadius: 10, padding: "9px 11px", background: inPlan ? BG : "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: TYPE_COLOR[it.type] || TEXT_MUTED }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLOR[it.type] || TEXT_MUTED, textTransform: "uppercase", letterSpacing: ".04em" }}>{typeLabel(it.type)}</span>
                <span style={{ flex: 1, minWidth: 120, fontSize: 15, color: TEXT_PRIMARY }}>{it.title}</span>
                {it.loose ? <span style={{ ...label, fontSize: 11 }}>this week</span> : null}
                {inPlan ? (
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f766e" }}>In the plan</span>
                ) : (
                  <button onClick={() => setPicking(open ? null : it.id)}
                    style={{ minHeight: 36, padding: "0 12px", borderRadius: 999, border: "1px solid " + accent,
                      background: "#fff", color: accent, fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    {open ? "Cancel" : "Add"}
                  </button>
                )}
              </div>
              {open ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
                  {slots.map(sl => (
                    <button key={sl} onClick={() => { addScheduleItemToDay(update, config, date, it, sl); setPicking(null); }}
                      style={{ minHeight: 36, padding: "0 12px", borderRadius: 999, border: "1px solid " + BORDER_STRONG,
                        background: "#fff", fontFamily: F, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{sl}</button>
                  ))}
                  {!slots.length ? <Muted style={{ fontSize: 14 }}>This day has no sequence to add it to.</Muted> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlotRow({ index, slotDef, accent, slotData, seeds, topic, onSetHeader, onResetHeader, onAddSeed, onAddText, onCreateSeed, onUpdateItem, onRemoveItem, onSaveSeedBody }) {
  const [editHeader, setEditHeader] = useState(false);
  const slot = slotDef.slot;
  const items = slotData.items || [];
  const customHeader = slotData.title != null || slotData.note != null;
  const headerTitle = slotData.title != null && slotData.title !== "" ? slotData.title : slotLabel(slot);
  const headerNote = slotData.note != null ? slotData.note : slotDef.note;
  const usedIds = new Set(items.map(it => it.seedId).filter(Boolean));

  return (
    <div style={{ borderRadius: 12, border: "1px solid " + BORDER_STRONG, padding: 14, background: "#fff" }}>
      {/* header (editable per day) */}
      {editHeader ? (
        <HeaderEditor accent={accent} defaultTitle={slotLabel(slot)} defaultNote={slotDef.note}
          title={slotData.title != null ? slotData.title : slotLabel(slot)} note={headerNote}
          onSave={(t, n) => { onSetHeader(t, n); setEditHeader(false); }}
          onReset={() => { onResetHeader(); setEditHeader(false); }}
          onCancel={() => setEditHeader(false)} canReset={customHeader} />
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: accent + "22", color: accent, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{index + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: customHeader ? TEXT_PRIMARY : accent, textTransform: customHeader ? "none" : "uppercase", letterSpacing: customHeader ? "normal" : "0.04em" }}>{headerTitle}</span>
              {customHeader && <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", background: BG, border: "1px solid " + BORDER, borderRadius: 999, padding: "2px 8px" }}>{slotLabel(slot)}</span>}
            </div>
            {headerNote && <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4, lineHeight: 1.45 }}>{headerNote}</div>}
          </div>
          <button onClick={() => setEditHeader(true)} title="Edit title & subtitle for this day" style={{ ...ghostBtn, flexShrink: 0 }}>Edit</button>
        </div>
      )}

      {/* items in this section */}
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {items.map(item => (
            <ItemCard key={item.id} item={item} accent={accent}
              seed={item.seedId ? seeds.find(s => s.id === item.seedId) : null}
              onUpdate={(patch) => onUpdateItem(item.id, patch)} onRemove={() => onRemoveItem(item.id)}
              onSaveSeedBody={onSaveSeedBody} />
          ))}
        </div>
      )}

      {/* add another item to this section */}
      <AddToSlot slot={slot} accent={accent} seeds={seeds} topic={topic} usedIds={usedIds} startOpen={items.length === 0}
        onAddSeed={onAddSeed} onAddText={onAddText} onCreateSeed={onCreateSeed} />
    </div>
  );
}

// ─── one content item: a seed or a text snippet, with body edit + links ───
function ItemCard({ item, accent, seed, onUpdate, onRemove, onSaveSeedBody }) {
  const [editBody, setEditBody] = useState(false);
  const overridden = seed && item.bodyOverride != null;
  const shownBody = seed ? (overridden ? item.bodyOverride : seed.body) : item.text;
  const c = item.color;

  return (
    <div style={{ position: "relative", padding: 12, paddingRight: 34, borderRadius: 10, background: c ? c + "14" : BG, border: "1px solid " + (c ? c + "55" : BORDER), borderLeft: "4px solid " + (c || BORDER_STRONG) }}>
      <ColorPicker value={c} onChange={(color) => onUpdate({ color })} />
      {seed && <div style={{ fontSize: 16, fontWeight: 600 }}>{seed.title}</div>}
      {editBody ? (
        <BodyEditor accent={accent} initial={shownBody || ""} seed={seed}
          onSaveDay={(b) => { onUpdate(seed ? { bodyOverride: b } : { text: b }); setEditBody(false); }}
          onSaveLibrary={(b) => { onSaveSeedBody(seed.id, b); onUpdate({ bodyOverride: undefined }); setEditBody(false); }}
          onCancel={() => setEditBody(false)} />
      ) : (
        <>
          <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: seed ? 6 : 0, whiteSpace: "pre-wrap" }}>{shownBody}</div>
          {overridden && <div style={{ fontSize: 12, color: accent, marginTop: 6, fontWeight: 600 }}>Edited for this day</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => setEditBody(true)} style={ghostBtn}>Edit text</button>
            <button onClick={onRemove} style={{ ...ghostBtn, color: "#b91c1c", borderColor: "#fca5a5" }}>Remove</button>
          </div>
          <LinksEditor links={item.links} accent={accent} onChange={(links) => onUpdate({ links })} />
        </>
      )}
    </div>
  );
}

// a single color dot in the card corner; click to pop out the chooser
function ColorPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const pick = (col) => { onChange(col); setOpen(false); };
  const swatch = (col, content) => (
    <button key={col || "none"} onClick={() => pick(col)} title={content ? "No color" : col}
      style={{ width: 24, height: 24, borderRadius: "50%", cursor: "pointer", padding: 0,
        background: col || "#fff", border: value === (col || undefined) ? "2px solid " + TEXT_PRIMARY : "1px solid " + BORDER_STRONG,
        color: TEXT_MUTED, fontSize: 12, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{content}</button>
  );
  return (
    <div style={{ position: "absolute", top: 8, right: 8 }}>
      <button onClick={() => setOpen(o => !o)} title="Card color"
        style={{ width: 18, height: 18, borderRadius: "50%", cursor: "pointer", padding: 0,
          background: value || "#fff", border: "1px solid " + (value || BORDER_STRONG), boxShadow: "0 0 0 2px #fff" }} />
      {open && (
        <div style={{ position: "absolute", top: 24, right: 0, zIndex: 5, background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 12, padding: 8, boxShadow: "0 6px 18px rgba(0,0,0,0.12)", display: "flex", gap: 6, flexWrap: "wrap", width: 132 }}>
          {swatch(null, "✕")}
          {ITEM_COLORS.map(col => swatch(col, null))}
        </div>
      )}
    </div>
  );
}

function BodyEditor({ accent, initial, seed, onSaveDay, onSaveLibrary, onCancel }) {
  const [text, setText] = useState(initial);
  return (
    <div style={{ marginTop: seed ? 8 : 0 }}>
      <textarea value={text} onChange={e => setText(e.target.value)} autoFocus
        style={{ ...inputStyle, minHeight: 96, lineHeight: 1.5, resize: "vertical" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        <button onClick={() => onSaveDay(text)} style={primaryBtn(accent)}>{seed ? "Save for this day" : "Save"}</button>
        {seed && <button onClick={() => onSaveLibrary(text)} style={{ ...ghostBtn, minHeight: 40 }}>Save to library</button>}
        <button onClick={onCancel} style={{ ...ghostBtn, minHeight: 40 }}>Cancel</button>
      </div>
      {seed && <Muted style={{ marginTop: 6, fontSize: 13 }}>"This day" overrides just {seed.title} here. "Library" changes the seed everywhere.</Muted>}
    </div>
  );
}

function HeaderEditor({ accent, title, note, defaultTitle, defaultNote, onSave, onReset, onCancel, canReset }) {
  const [t, setT] = useState(title);
  const [n, setN] = useState(note || "");
  return (
    <div>
      <div style={label}>Slot title (this day)</div>
      <input value={t} onChange={e => setT(e.target.value)} autoFocus placeholder={defaultTitle}
        style={{ ...inputStyle, fontWeight: 600, marginTop: 6 }} />
      <div style={{ ...label, marginTop: 10 }}>Subtitle (this day)</div>
      <textarea value={n} onChange={e => setN(e.target.value)} placeholder={defaultNote}
        style={{ ...inputStyle, minHeight: 60, lineHeight: 1.5, resize: "vertical", marginTop: 6 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button onClick={() => onSave(t.trim(), n)} style={primaryBtn(accent)}>Save</button>
        {canReset && <button onClick={onReset} style={{ ...ghostBtn, minHeight: 40 }}>Reset to template</button>}
        <button onClick={onCancel} style={{ ...ghostBtn, minHeight: 40 }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── add a seed / quick text / new seed into a section ───
function AddToSlot({ slot, accent, seeds, topic, usedIds, startOpen, onAddSeed, onAddText, onCreateSeed }) {
  const [open, setOpen] = useState(startOpen);
  const [mode, setMode] = useState(null); // null | "text" | "seed"
  const [draft, setDraft] = useState("");
  const [seedTitle, setSeedTitle] = useState("");
  const [seedBody, setSeedBody] = useState("");
  const close = () => { setOpen(false); setMode(null); setDraft(""); setSeedTitle(""); setSeedBody(""); };

  if (!open) {
    return (
      <div style={{ marginTop: 10 }}>
        <button onClick={() => setOpen(true)} style={linkBtn(accent)}>+ Add to this section</button>
      </div>
    );
  }

  if (mode === "text") {
    return (
      <div style={{ marginTop: 10 }}>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus placeholder={"Quick " + slotLabel(slot).toLowerCase() + " text for this day..."}
          style={{ ...inputStyle, minHeight: 72, lineHeight: 1.5, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => { if (draft.trim()) { onAddText(draft.trim()); close(); } }} style={primaryBtn(accent)}>Add</button>
          <button onClick={() => setMode(null)} style={{ ...ghostBtn, minHeight: 40 }}>Back</button>
        </div>
      </div>
    );
  }

  if (mode === "seed") {
    return (
      <div style={{ marginTop: 10 }}>
        <input value={seedTitle} onChange={e => setSeedTitle(e.target.value)} autoFocus placeholder="Seed title"
          style={{ ...inputStyle, fontWeight: 600 }} />
        <textarea value={seedBody} onChange={e => setSeedBody(e.target.value)} placeholder="The hook itself, in a sentence or two..."
          style={{ ...inputStyle, minHeight: 80, lineHeight: 1.5, resize: "vertical", marginTop: 8 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => { if (seedTitle.trim()) { onCreateSeed({ title: seedTitle, body: seedBody, concept: "" }); close(); } }} style={primaryBtn(accent)}>Create & add</button>
          <button onClick={() => setMode(null)} style={{ ...ghostBtn, minHeight: 40 }}>Back</button>
        </div>
        <Muted style={{ marginTop: 6, fontSize: 13 }}>Saved to your library, tagged for the {slotLabel(slot)} slot.</Muted>
      </div>
    );
  }

  const top = candidatesFor(seeds, slot, topic, usedIds).slice(0, 3);
  return (
    <div style={{ marginTop: 10 }}>
      {top.length > 0 ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>Suggested seeds</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {top.map(({ seed, score }) => (
              <button key={seed.id} onClick={() => { onAddSeed(seed.id); close(); }}
                style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%", minHeight: TAP, padding: "8px 12px", borderRadius: 10, border: "1px solid " + (score > 0 ? accent + "66" : BORDER_STRONG), background: score > 0 ? accent + "0c" : "#fff", cursor: "pointer", fontFamily: F }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>{seed.title}</span>
                  <span style={{ display: "block", fontSize: 13, color: TEXT_MUTED, marginTop: 1 }}>{seed.concept}{score > 0 ? " · matches topic" : ""}</span>
                </span>
                <span style={{ color: accent, fontSize: 22, flexShrink: 0 }}>+</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <Muted style={{ marginTop: 2 }}>No more seeds tagged for this slot.</Muted>
      )}
      <div style={{ display: "flex", gap: 14, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={() => setMode("text")} style={linkBtn(accent)}>+ Quick text</button>
        <button onClick={() => setMode("seed")} style={linkBtn(accent)}>+ Create seed</button>
        <button onClick={close} style={linkBtn(TEXT_MUTED)}>Done</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LINKS (shared by items and blocks)
// ─────────────────────────────────────────────────────────────
function LinksEditor({ links, accent, onChange }) {
  const list = links || [];
  const [adding, setAdding] = useState(false);
  const [lbl, setLbl] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    if (!url.trim()) return;
    onChange([...list, { id: genId(), label: lbl.trim() || url.trim(), url: url.trim() }]);
    setLbl(""); setUrl(""); setAdding(false);
  };
  const remove = (id) => onChange(list.filter(l => l.id !== id));

  return (
    <div style={{ marginTop: 10 }}>
      {list.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: adding ? 8 : 0 }}>
          {list.map(l => (
            <span key={l.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 999, padding: "4px 6px 4px 12px" }}>
              <a href={l.url} target="_blank" rel="noreferrer" style={{ color: accent, textDecoration: "none" }}>{l.label} ↗</a>
              <button onClick={() => remove(l.id)} title="Remove link" style={{ minWidth: 22, minHeight: 22, borderRadius: "50%", border: "none", background: "transparent", color: TEXT_MUTED, cursor: "pointer", fontSize: 13 }}>✕</button>
            </span>
          ))}
        </div>
      )}
      {adding ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={lbl} onChange={e => setLbl(e.target.value)} placeholder="Label (optional)" style={{ ...inputStyle, minHeight: 38, width: 160 }} />
          <input value={url} onChange={e => setUrl(e.target.value)} autoFocus placeholder="https://..." style={{ ...inputStyle, minHeight: 38, flex: 1, minWidth: 160 }} />
          <button onClick={add} style={{ ...primaryBtn(accent), minHeight: 38 }}>Add</button>
          <button onClick={() => { setAdding(false); setLbl(""); setUrl(""); }} style={{ ...ghostBtn, minHeight: 38 }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={linkBtn(accent)}>+ Add link</button>
      )}
    </div>
  );
}

// ─── slides + day notes, edited together with an explicit Save ───
function SlidesNotes({ plan, accent, onSave }) {
  const [editing, setEditing] = useState(false);
  const [slides, setSlides] = useState(plan.slides || "");
  const [notes, setNotes] = useState(plan.notes || "");
  const has = plan.slides || plan.notes;

  if (editing) {
    return (
      <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: "1px solid " + BORDER_STRONG, background: "#fff" }}>
        <div style={label}>Slides</div>
        <input value={slides} onChange={e => setSlides(e.target.value)} placeholder="Slides link (https://...)"
          style={{ ...inputStyle, marginTop: 6 }} />
        <div style={{ ...label, marginTop: 14 }}>Day notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Scratch notes for the whole day..."
          style={{ ...inputStyle, minHeight: 80, lineHeight: 1.5, resize: "vertical", marginTop: 6 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => { onSave(slides.trim(), notes); setEditing(false); }} style={{ ...primaryBtn(accent), minHeight: TAP }}>Save</button>
          <button onClick={() => { setSlides(plan.slides || ""); setNotes(plan.notes || ""); setEditing(false); }} style={{ ...ghostBtn, minHeight: TAP }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: "1px solid " + BORDER_STRONG, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={label}>Slides & notes</div>
        <button onClick={() => setEditing(true)} style={ghostBtn}>{has ? "Edit" : "Add"}</button>
      </div>
      {has ? (
        <div style={{ marginTop: 8 }}>
          {plan.slides && <a href={plan.slides} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", fontSize: 15, fontWeight: 600, color: accent, textDecoration: "underline" }}>Open slides</a>}
          {plan.notes && <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: plan.slides ? 8 : 0, whiteSpace: "pre-wrap" }}>{plan.notes}</div>}
        </div>
      ) : <Muted style={{ marginTop: 6 }}>No slides or notes yet.</Muted>}
    </div>
  );
}

// ─── a freeform titled block in the day flow (drag the handle to reorder) ───
function BlockRow({ block, accent, onChange, onRemove, onDropBefore }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const id = getDrag(e); if (id) onDropBefore(id); }}
      style={{ borderRadius: 12, border: "1px solid " + (over ? accent : BORDER_STRONG), padding: 14, background: "#fff", boxShadow: over ? "0 -2px 0 " + accent : "none" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span draggable onDragStart={e => setDrag(e, block.id)} title="Drag to reorder"
          style={{ cursor: "grab", color: TEXT_MUTED, fontSize: 17, padding: "0 4px", flexShrink: 0, lineHeight: 1, userSelect: "none" }}>⠿</span>
        <input value={block.title} onChange={e => onChange({ title: e.target.value })} placeholder="Block title (e.g. Logistics, Hand back quizzes)"
          style={{ ...inputStyle, fontWeight: 600, minHeight: 40, padding: "8px 10px" }} />
        <button onClick={onRemove} title="Remove block"
          style={{ minHeight: 40, minWidth: 40, borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_MUTED, cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
      </div>
      <textarea value={block.body} onChange={e => onChange({ body: e.target.value })} placeholder="What happens here..."
        style={{ ...inputStyle, minHeight: 64, lineHeight: 1.5, resize: "vertical", marginTop: 8 }} />
      <LinksEditor links={block.links} accent={accent} onChange={(links) => onChange({ links })} />
    </div>
  );
}
