// The Day Plan card: what the dashboard has, on the class site.
//
// This card used to be a second place to build a day, and it understood the
// model the engine had before blocks existed: seeds and typed snippets. So a
// block placed on a day from the repository rendered here as a card with no
// title and no body, and the card got worse every time the repository got
// used. Two writers of one shape, disagreeing, which is the same fault that
// broke placing this morning.
//
// Andrew: "i want the dayplan to basically mirror whats in dashboard." So the
// dashboard is where a day gets built and this is where a day gets read. Same
// store, same sections, same rows, one writer.
//
// Day plans live at data.dayPlans[date] = { sequenceId, slots, blocks, slides,
// notes, done }, and slots[slot] = { title?, items: [...] }, where an item
// points at a block, names a seed, or carries its own words.

import { normSlot, dayPlanFor, sectionsOf } from "./dayplan.js";
import { typeOf } from "./blocks.js";
import { hostOf } from "./links.js";
import PickMark from "./Pick.jsx";
import * as TOKENS from "./tokens.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use.
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const TAP = 44;

const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };
const selectStyle = { fontFamily: F, fontSize: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, minHeight: TAP, background: "#fff", color: TEXT_PRIMARY, maxWidth: "100%" };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;

// ─── data access ───
const getWeeks = (data, config) => data?.schedule || config.scheduleWeeks || [];
const getSeeds = (data, config) => data?.seeds || config.seeds || [];

// ─── dates ───
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s + ", 2026");
  return isNaN(d) ? null : d;
}

export function allDays(weeks) {
  const days = [];
  (weeks || []).forEach((w, wi) => (w.dates || []).forEach(ds =>
    days.push({ date: ds, weekId: w.id, weekIndex: wi, topic: w.topic || "" })));
  return days;
}

// The next class day, or the first one when the term has finished.
export function defaultDay(weeks) {
  const days = allDays(weeks);
  if (!days.length) return null;
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let upcoming = null;
  let best = Infinity;
  days.forEach(d => {
    const dt = parseDate(d.date);
    if (!dt) return;
    const diff = dt.getTime() - t0;
    if (diff >= 0 && diff < best) { best = diff; upcoming = d; }
  });
  return (upcoming || days[0]).date;
}

// Every row on a day, in the order the dashboard draws them, with whatever the
// row points at already resolved. One reader for both surfaces means the card
// cannot drift from the day plan again.
export function rowsOf({ config, data, plan, blockOf }) {
  const seeds = getSeeds(data, config);
  const done = new Set(plan.done || []);
  return sectionsOf(config, plan).map(([slot, name]) => {
    const bucket = normSlot(plan.slots[slot]);
    return {
      slot,
      name: bucket.title || name,
      note: bucket.note || "",
      items: bucket.items.map(it => {
        const block = it.blockId && blockOf ? blockOf(it.blockId) : null;
        const seed = it.seedId ? seeds.find(s => s.id === it.seedId) : null;
        const words = it.claim || block?.headline || block?.title || seed?.title || it.text || "";
        return {
          id: it.id,
          words,
          body: block?.body || (seed ? (it.bodyOverride ?? seed.body) : "") || "",
          kind: it.feature ? "Activity" : block ? typeOf(block.type).label : seed ? "Seed" : "Note",
          url: block?.url || "",
          links: it.links || [],
          pick: !!block?.pick,
          depth: it.depth || 0,
          done: done.has(it.id),
        };
      }),
    };
  });
}

export const countRows = (sections) => sections.reduce((n, s) => n + s.items.length, 0);

// ─────────────────────────────────────────────────────────────
// SUMMARY (the tile on the class home)
// ─────────────────────────────────────────────────────────────
export function DayPlanSummary({ config, data, blockOf }) {
  const weeks = getWeeks(data, config);
  const date = defaultDay(weeks);
  if (!date) return <Muted>No class days scheduled.</Muted>;
  const day = allDays(weeks).find(d => d.date === date);
  const plan = dayPlanFor(data, config, date);
  const sections = rowsOf({ config, data, plan, blockOf });
  const n = countRows(sections);
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: config.accent }}>Next class · {date}</div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{day?.topic || "Untitled"}</div>
      <div style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 4 }}>
        {n ? n + (n === 1 ? " thing planned" : " things planned") + ", in " + sections.filter(s => s.items.length).length + " sections"
           : "Nothing planned yet"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL (the mirror)
// ─────────────────────────────────────────────────────────────
export function DayPlanDetail({ config, data, initialDate, blockOf, date, onDate }) {
  const weeks = getWeeks(data, config);
  const days = allDays(weeks);
  if (!days.length) {
    return <div><div style={{ ...h2, marginBottom: 12 }}>Day Plan</div><Muted>No class days scheduled.</Muted></div>;
  }

  const chosen = date || initialDate || defaultDay(weeks) || days[0].date;
  const day = days.find(d => d.date === chosen) || days[0];
  const plan = dayPlanFor(data, config, day.date);
  const sections = rowsOf({ config, data, plan, blockOf });
  const n = countRows(sections);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={h2}>Day Plan</div>
        <select value={day.date} onChange={e => onDate && onDate(e.target.value)} aria-label="Choose date"
          style={{ ...selectStyle, marginLeft: "auto" }}>
          {days.map(d => <option key={d.date} value={d.date}>{d.date}{d.topic ? " · " + d.topic : ""}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ ...label, color: config.accent }}>{day.date}</span>
        <span style={{ fontSize: 17, fontWeight: 600 }}>{day.topic || config.name}</span>
        <span style={{ ...label, marginLeft: "auto" }}>{n ? n + " on the plan" : "Nothing yet"}</span>
      </div>

      {plan.notes ? (
        <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, whiteSpace: "pre-wrap",
          background: "#fafaf9", border: "1px solid " + BORDER, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          {plan.notes}
        </div>
      ) : null}

      {plan.slides ? (
        <a href={plan.slides} target="_blank" rel="noreferrer"
          style={{ display: "inline-block", marginBottom: 12, fontSize: 15, fontWeight: 600, color: config.accent }}>
          {plan.slidesClaim || "The deck"} ↗
        </a>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sections.map(s => (
          <section key={s.slot}>
            <div style={{ ...label, marginBottom: 6 }}>{s.name}</div>
            {s.note ? <Muted style={{ marginBottom: 6 }}>{s.note}</Muted> : null}
            {s.items.length ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {s.items.map((it, i) => <RowView key={it.id} row={it} num={i + 1} accent={config.accent} />)}
              </div>
            ) : <Muted>Nothing in this section.</Muted>}
          </section>
        ))}
        {!sections.length ? <Muted>This day has no sections yet.</Muted> : null}
      </div>

      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + BORDER }}>
        <a href={config.path + "/dashboard"} style={{ fontSize: 15, fontWeight: 600, color: config.accent }}>
          Build the day on the dashboard →
        </a>
        <Muted style={{ marginTop: 4 }}>
          The dashboard writes the day plan and this card reads it, so what you see here is what the room gets.
        </Muted>
      </div>
    </div>
  );
}

function RowView({ row, num, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0",
      marginLeft: row.depth * 22, borderTop: "1px solid " + BORDER, opacity: row.done ? 0.55 : 1 }}>
      <span style={{ flex: "none", minWidth: 26, height: 26, borderRadius: 8, background: "#f4f3f1",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY }}>
        {row.done ? "✓" : num}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 16, lineHeight: 1.35, color: TEXT_PRIMARY,
          textDecoration: row.done ? "line-through" : "none", wordBreak: "break-word" }}>
          {row.words || "Untitled"}
        </span>
        {row.body ? (
          <span style={{ display: "block", fontSize: 14.5, lineHeight: 1.45, color: TEXT_MUTED, marginTop: 3,
            whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{row.body}</span>
        ) : null}
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <span style={{ ...label, fontSize: 11 }}>{row.kind}</span>
          {row.url ? (
            <a href={row.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 13, fontWeight: 600, color: accent }}>{hostOf(row.url)} ↗</a>
          ) : null}
          {row.links.map(l => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 13, fontWeight: 600, color: accent }}>{l.label || hostOf(l.url)} ↗</a>
          ))}
        </span>
      </span>
      {row.pick ? <PickMark size={22} /> : null}
    </div>
  );
}
