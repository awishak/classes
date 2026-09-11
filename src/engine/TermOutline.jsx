// The whole term, in one popup, from the date.
//
// The dashboard is one day at a time on purpose — teaching is a 65-minute
// window and the day needs the screen. But planning is not one day at a time,
// and until now the only way to see the shape of a term was to click through
// thirty-two days one at a time and hold the result in your head.
//
// It opens from the date rather than from a button of its own, because the
// date already means "which day am I on" and this is the same question asked
// of the whole term. That also means no new control on a bar Andrew asked to
// keep still.
//
// Two ways to read it, one toggle:
//
//   OUTLINE  week, day, section, row, each folding. The document.
//   MAP      the quarter on one screen, three day cells a week. The shape.
//
// Both are built on the same fact, which reading the live store turned up:
// most of a term is empty for most of the term. COMM 118 in September has 8
// of 32 days built and 61 readings sitting on weeks rather than on days. So
// an empty day says so and offers to be built, rather than being drawn as a
// gap and left to be inferred.

import { useState } from "react";
import * as TOKENS from "./tokens.js";
import { allDays, dayTitles } from "./days.js";
import { normSlot, sectionsOf } from "./dayplan.js";
import { typeOf } from "./blocks.js";

// Where a thing came from, for the second half of a row.
const hostOf = (url) => {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
};

const F = TOKENS.FONT.body;
const MONO = TOKENS.FONT.label;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const GHOST = TOKENS.LINE.ghost;
const SURFACE_2 = TOKENS.SURFACE.sunk;
const LIVE = TOKENS.STATE.live;
const WARN = TOKENS.STATE.warn;

// What a day amounts to: its sections, how many rows, how many done.
const readDay = (config, plans, date) => {
  const plan = (plans || {})[date];
  if (!plan) return { rows: 0, done: 0, sections: [] };
  const secs = sectionsOf(config, plan);
  let rows = 0, done = 0;
  const doneSet = new Set(plan.done || []);
  const sections = secs.map(([slot, name]) => {
    const items = normSlot(plan.slots[slot]).items || [];
    rows += items.length;
    items.forEach(it => { if (doneSet.has(it.id)) done++; });
    return {
      slot, name, n: items.length, named: !!(normSlot(plan.slots[slot]).title || "").trim(),
      items: items.map(it => ({ id: it.id, item: it, done: doneSet.has(it.id) })),
    };
  }).filter(s => s.n || s.slot.startsWith("sec-"));
  return { rows, done, sections };
};

export default function TermOutline({ config, weeks, plans, assignments, day, onPick, onClose, onWeekTopic, onDayTitle, onMoveRow, onAddRow, blockOf, startView }) {
  const [view, setView] = useState(startView || "outline");
  const [only, setOnly] = useState("");            // "" | "planned" | "empty"
  const [openWeeks, setOpenWeeks] = useState(() => new Set());
  const [openDays, setOpenDays] = useState(() => new Set([day]));
  const [over, setOver] = useState("");        // the section a drag is hovering
  const [dragging, setDragging] = useState("");
  const [adding, setAdding] = useState("");   // "<date>|<slot>"
  const [draft, setDraft] = useState("");

  const days = allDays(weeks);
  const titles = dayTitles(weeks, plans);
  const info = {};
  days.forEach(d => { info[d.date] = readDay(config, plans, d.date); });

  const built = days.filter(d => info[d.date].rows).length;
  const onWeek = (w) => (w.items || []).length;
  const dueOn = {};
  (assignments || []).forEach(a => { if (a.due) (dueOn[a.due] = dueOn[a.due] || []).push(a.title); });

  const dueThisWeek = (w) => (w.dates || []).flatMap(date => dueOn[date] || []);

  const show = (d) => only === "planned" ? info[d.date].rows > 0
    : only === "empty" ? !info[d.date].rows : true;

  const go = (date) => { onPick(date); onClose(); };

  const filters = [["", "All " + days.length + " days"], ["planned", "Built " + built], ["empty", "Empty " + (days.length - built)]];

  return (
    <>
      <div className="term-veil" onClick={onClose} />
      <div className="term" role="dialog" aria-label="The whole term">
        <div className="term-head">
          <div className="term-head-top">
            <span className="term-name">
              {config.name}<span className="term-quarter"> · {config.quarter}</span>
            </span>
            <div className="term-toggle" role="tablist" aria-label="How to read the term">
              <button role="tab" aria-selected={view === "outline"} className="dash-focus"
                data-on={view === "outline" ? "1" : "0"} onClick={() => setView("outline")}>Outline</button>
              <button role="tab" aria-selected={view === "map"} className="dash-focus"
                data-on={view === "map" ? "1" : "0"} onClick={() => setView("map")}>Map</button>
            </div>
            <span className="term-count">{built} of {days.length} days built</span>
            <span style={{ flex: "1 1 auto" }} />
            <button className="dash-focus term-x" onClick={onClose} aria-label="Close">×</button>
          </div>
          {view === "outline" ? (
            <div className="term-filters">
              {filters.map(([id, lbl]) => (
                <button key={id || "all"} className="dash-focus term-chip" data-on={only === id ? "1" : "0"}
                  onClick={() => setOnly(id)}>{lbl}</button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="term-body">
          {view === "outline" ? weeks.map((w, wi) => {
            const wd = days.filter(d => d.weekId === w.id).filter(show);
            const shut = !openWeeks.has(w.id) && !wd.some(d => d.date === day);
            const rows = wd.reduce((n, d) => n + info[d.date].rows, 0);
            if (only && !wd.length) return null;
            return (
              <div key={w.id} className="term-week">
                <div className="term-week-head">
                  <span className="term-wn">WEEK {wi + 1}</span>
                  {/* The week's own name, renamed where it is read. */}
                  <input className="dash-focus term-wtopic" defaultValue={w.topic || ""}
                    placeholder={"Name week " + (wi + 1)}
                    onBlur={e => { const v = e.target.value.trim(); if (v !== (w.topic || "")) onWeekTopic(w.id, v); }}
                    onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
                  {/* What is due this week, on the week's own line, so a folded
                      week still says the one thing you cannot afford to miss.
                      Folded is the normal state for ten of eleven weeks, so
                      anything only visible when open is effectively invisible. */}
                  {dueThisWeek(w).length ? (
                    <span className="term-due">{dueThisWeek(w).join(", ")} due</span>
                  ) : null}
                  <span className="term-wmeta">
                    {rows ? rows + " placed" : "nothing placed"}
                    {onWeek(w) ? " · " + onWeek(w) + " on the week" : ""}
                  </span>
                  <button className="dash-focus term-fold" aria-expanded={!shut}
                    onClick={() => setOpenWeeks(prev => {
                      const next = new Set(prev);
                      if (next.has(w.id)) next.delete(w.id); else next.add(w.id);
                      return next;
                    })}>{shut ? "▶" : "▼"}</button>
                </div>

                {shut ? null : wd.map(d => {
                  const it = info[d.date];
                  const dayShut = !openDays.has(d.date);
                  return (
                    <div key={d.date} className="term-day">
                      <div className="term-day-head">
                        <button className="dash-focus term-date" onClick={() => go(d.date)}
                          data-today={d.date === day ? "1" : "0"}>{d.date}</button>
                        {/* Every day names itself, the same way a week does.
                            A title written here carries forward until the next
                            one, and stops at a week that names itself — so
                            naming one day names the run of days after it. */}
                        <input className="dash-focus term-dtitle" defaultValue={titles[d.date]?.own ? titles[d.date].title : ""}
                          placeholder={titles[d.date]?.title || "Name this day"}
                          onBlur={e => {
                            const v = e.target.value.trim();
                            if (v !== (titles[d.date]?.own ? titles[d.date].title : "")) onDayTitle(d.date, v);
                          }}
                          onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
                        {dueOn[d.date] ? <span className="term-due">{dueOn[d.date].join(", ")} due</span> : null}
                        <span style={{ flex: "1 1 auto" }} />
                        {it.rows ? (
                          <>
                            <span className="term-dmeta">{it.done} of {it.rows} done</span>
                            <button className="dash-focus term-fold" aria-expanded={!dayShut}
                              onClick={() => setOpenDays(prev => {
                                const next = new Set(prev);
                                if (next.has(d.date)) next.delete(d.date); else next.add(d.date);
                                return next;
                              })}>{dayShut ? "▶" : "▼"}</button>
                          </>
                        ) : (
                          <button className="dash-focus term-build" onClick={() => go(d.date)}>Build this day</button>
                        )}
                      </div>
                      {/* An open day is the day, row for row, the way the
                          dashboard sets it. Section headers alone were a
                          summary of a summary — the Map is where a day is a
                          count, and this is where a day is its contents. */}
                      {dayShut || !it.rows ? null : (
                        <div className="term-secs">
                          {it.sections.map(s => (
                            <div key={s.slot} className="term-sec"
                              data-over={over === d.date + "|" + s.slot ? "1" : "0"}
                              onDragOver={e => { e.preventDefault(); setOver(d.date + "|" + s.slot); }}
                              onDragLeave={() => setOver("")}
                              onDrop={e => {
                                e.preventDefault();
                                setOver("");
                                try {
                                  const p = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
                                  if (p.id && p.from && p.slot) onMoveRow(p.from, p.slot, p.id, d.date, s.slot);
                                } catch { /* not ours */ }
                              }}>
                              <div className="term-sechead">
                                <span className="term-sname" data-unnamed={s.named ? "0" : "1"}>{s.name}</span>
                                <span className="term-snum">{s.n}</span>
                              </div>
                              {s.items.map(({ id, item, done }, n) => {
                                const b = item.blockId ? blockOf(item.blockId) : null;
                                const words = (b ? b.headline || b.title : item.claim || item.text) || "a row";
                                const kind = item.feature ? "activity" : b ? typeOf(b.type).label.toLowerCase() : "note";
                                const src = b?.source || hostOf(b?.url);
                                return (
                                  <div key={id} className="term-row" data-done={done ? "1" : "0"} draggable
                                    onDragStart={e => {
                                      e.dataTransfer.effectAllowed = "move";
                                      e.dataTransfer.setData("text/plain", JSON.stringify({ from: d.date, slot: s.slot, id }));
                                      setDragging(id);
                                    }}
                                    onDragEnd={() => setDragging("")}
                                    title="Drag onto another section, on this day or any other">
                                    <span className="term-grip" aria-hidden="true">&#10303;</span>
                                    <span className="term-rn">{done ? "✓" : n + 1}</span>
                                    <span className="term-rw">{words}</span>
                                    {src ? <span className="term-rsrc">{src}</span> : null}
                                    <span className="term-rk">{kind}</span>
                                  </div>
                                );
                              })}
                              {/* Type a line straight into any section of any
                                  day, the same box the day plan uses. */}
                              {adding === d.date + "|" + s.slot ? (
                                <div className="term-add">
                                  <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                                    placeholder="Type a note, or paste a link"
                                    onKeyDown={e => {
                                      if (e.key === "Enter" && draft.trim()) { onAddRow(d.date, s.slot, draft.trim()); setDraft(""); setAdding(""); }
                                      if (e.key === "Escape") { setDraft(""); setAdding(""); }
                                    }} />
                                  <button className="dash-focus" disabled={!draft.trim()}
                                    onClick={() => { onAddRow(d.date, s.slot, draft.trim()); setDraft(""); setAdding(""); }}>Add</button>
                                </div>
                              ) : (
                                <button className="dash-focus term-addrow"
                                  onClick={() => { setAdding(d.date + "|" + s.slot); setDraft(""); }}>
                                  + Add to {s.name}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }) : (
            /* THE MAP. Section titles, not colours — the titles are what say
               what a day is, and Andrew said so. */
            <div className="term-map">
              <div className="term-maprow term-maphead">
                <span>Week</span><span>Monday</span><span>Wednesday</span><span>Friday</span>
              </div>
              {weeks.map((w, wi) => {
                const wd = days.filter(d => d.weekId === w.id);
                return (
                  <div key={w.id} className="term-maprow">
                    <span className="term-mapweek">
                      <span className="term-mapname">{w.topic || "Week " + (wi + 1)}</span>
                      <span className="term-mapsub">W{wi + 1}{onWeek(w) ? " · " + onWeek(w) + " on the week" : ""}</span>
                    </span>
                    {[0, 1, 2].map(n => {
                      const d = wd[n];
                      if (!d) return <span key={n} />;
                      const it = info[d.date];
                      return (
                        <button key={d.date} className="dash-focus term-cell" onClick={() => go(d.date)}
                          data-empty={it.rows ? "0" : "1"} data-today={d.date === day ? "1" : "0"}>
                          <span className="term-cellday">
                            {d.date}{d.date === day ? <b> today</b> : null}
                          </span>
                          {/* What the day is called. The sections say what
                              happens in it; the title says what it is about,
                              and a map of thirty-two days without that is a
                              map of thirty-two dates. */}
                          {titles[d.date]?.title ? (
                            <span className="term-celltitle" data-own={titles[d.date].own ? "1" : "0"}>
                              {titles[d.date].title}
                            </span>
                          ) : null}
                          {it.sections.length ? it.sections.map(s => (
                            <span key={s.slot} className="term-cellsec">
                              <span data-unnamed={s.named ? "0" : "1"}>{s.name}</span>
                              <span className="term-snum">{s.n}</span>
                            </span>
                          )) : <span className="term-cellempty">empty</span>}
                          {dueOn[d.date] ? <span className="term-due">{dueOn[d.date].join(", ")} due</span> : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const TERM_CSS = `
.term-veil{position:fixed;inset:0;background:rgba(23,19,16,.34);z-index:80}
.term{position:fixed;top:34px;left:50%;transform:translateX(-50%);width:min(1120px,calc(100vw - 48px));
  max-height:calc(100vh - 68px);background:#fff;border-radius:20px;z-index:81;display:flex;flex-direction:column;
  overflow:hidden;box-shadow:0 40px 90px -30px rgba(23,19,16,.5),0 0 0 1px rgba(23,19,16,.08);font-family:${F}}
.term-head{padding:18px 22px 12px;border-bottom:1px solid ${BORDER_STRONG};display:flex;flex-direction:column;gap:11px}
.term-head-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.term-name{font-size:23px;font-weight:600;letter-spacing:-.02em;color:${TEXT_PRIMARY}}
.term-quarter{color:${TEXT_MUTED};font-weight:500}
.term-count{font-size:13px;color:${TEXT_MUTED}}
.term-toggle{display:flex;gap:2px;background:rgba(23,19,16,.045);border-radius:11px;padding:3px}
.term-toggle button{min-height:32px;padding:0 14px;border:none;border-radius:9px;background:none;cursor:pointer;
  font-family:${F};font-size:14px;font-weight:500;color:${TEXT_SECONDARY}}
.term-toggle button[data-on="1"]{background:var(--dash-accent);color:#fff;font-weight:600}
.term-x{width:34px;height:34px;border:1px solid ${BORDER_STRONG};border-radius:9px;background:#fff;
  cursor:pointer;color:${TEXT_SECONDARY};font-size:17px;line-height:1;padding:0}
.term-x:hover{background:${SURFACE_2};color:${TEXT_PRIMARY}}
.term-filters{display:flex;gap:5px;flex-wrap:wrap}
.term-chip{min-height:32px;padding:0 12px;border-radius:999px;border:1px solid ${BORDER_STRONG};background:#fff;
  color:${TEXT_SECONDARY};cursor:pointer;font-family:${F};font-size:13px;font-weight:600}
.term-chip[data-on="1"]{background:${TEXT_PRIMARY};border-color:${TEXT_PRIMARY};color:#fff}
.term-body{flex:1 1 auto;overflow-y:auto;padding:6px 22px 22px}

.term-week{padding-top:16px}
.term-week-head{display:flex;align-items:center;gap:11px;padding-bottom:8px;border-bottom:2px solid ${TEXT_PRIMARY}}
.term-wn{flex:none;width:62px;font-family:${MONO};font-size:13px;font-weight:600;color:var(--dash-accent)}
.term-wtopic{flex:1 1 auto;min-width:0;border:none;background:none;outline:none;padding:2px 6px;border-radius:7px;
  font-family:${F};font-size:18px;font-weight:600;letter-spacing:-.015em;color:${TEXT_PRIMARY}}
.term-wtopic:hover{background:${SURFACE_2}}
.term-wtopic:focus{background:#fff;box-shadow:inset 0 -2px 0 var(--dash-accent)}
.term-wmeta{flex:none;font-size:13px;color:${TEXT_MUTED}}
.term-fold{flex:none;width:28px;height:28px;border:none;border-radius:8px;background:none;cursor:pointer;
  color:${TEXT_SECONDARY};font-size:11px;padding:0}
.term-fold:hover{background:${SURFACE_2};color:${TEXT_PRIMARY}}

.term-day{border-bottom:1px solid ${BORDER}}
.term-day-head{display:flex;align-items:center;gap:11px;min-height:40px;padding-left:62px}
.term-date{flex:none;width:58px;border:none;background:none;cursor:pointer;text-align:left;padding:2px 4px;
  border-radius:6px;font-family:${MONO};font-size:13px;color:${TEXT_SECONDARY}}
.term-date:hover{background:${SURFACE_2};color:${TEXT_PRIMARY}}
.term-date[data-today="1"]{color:${LIVE};font-weight:600}
.term-dtitle{flex:1 1 auto;min-width:0;border:none;background:none;outline:none;padding:2px 6px;border-radius:7px;
  font-family:${F};font-size:15px;color:${TEXT_PRIMARY}}
.term-dtitle::placeholder{color:${TEXT_MUTED}}
.term-dtitle:hover{background:${SURFACE_2}}
.term-dtitle:focus{background:#fff;box-shadow:inset 0 -2px 0 var(--dash-accent)}
.term-dmeta{flex:none;font-size:13px;color:${TEXT_MUTED}}
.term-due{flex:none;padding:2px 9px;border-radius:999px;background:#fff7ed;color:${WARN};
  font-size:13px;font-weight:600;white-space:nowrap}
.term-build{flex:none;min-height:28px;padding:0 11px;border-radius:999px;border:1px dashed ${BORDER_STRONG};
  background:none;cursor:pointer;font-family:${F};font-size:13px;color:${TEXT_MUTED}}
.term-build:hover{border-style:solid;color:${TEXT_PRIMARY}}
.term-secs{display:flex;flex-direction:column;gap:10px;padding:4px 0 12px 120px}
.term-sec{display:flex;flex-direction:column;gap:0}
.term-sechead{display:flex;align-items:baseline;gap:8px;padding-bottom:5px;border-bottom:1px solid ${TEXT_PRIMARY}}
.term-sname{font-size:15px;font-weight:600;color:${TEXT_PRIMARY}}
.term-sname[data-unnamed="1"]{color:${TEXT_MUTED};font-weight:500}
.term-snum{font-family:${MONO};font-size:13px;color:${TEXT_MUTED}}
/* A row of the day, the way the day sets one: a numeral, the words, where it
   came from, what it is. Set quieter than the dashboard's because here you are
   reading thirty of them rather than running one. */
.term-sec[data-over="1"]{background:${SURFACE_2};border-radius:10px;
  box-shadow:inset 0 0 0 2px var(--dash-accent)}
.term-row{display:flex;align-items:baseline;gap:10px;min-height:30px;padding:2px 0;
  border-bottom:1px solid ${BORDER};cursor:grab}
.term-row:hover{background:${SURFACE_2}}
.term-grip{flex:none;width:12px;font-size:12px;color:${GHOST};line-height:1}
.term-row:hover .term-grip{color:${TEXT_MUTED}}
/* Adding a line to any section of any day, from here. */
.term-addrow{display:flex;align-items:center;width:100%;min-height:30px;margin-top:3px;padding:0 4px;
  border:none;border-radius:7px;background:none;cursor:pointer;text-align:left;
  font-family:${F};font-size:13px;color:${TEXT_MUTED}}
.term-addrow:hover{background:${SURFACE_2};color:${TEXT_PRIMARY}}
.term-add{display:flex;gap:6px;margin-top:4px}
.term-add input{flex:1 1 auto;min-width:0;border:1px solid ${BORDER_STRONG};border-radius:9px;
  padding:6px 10px;font-family:${F};font-size:16px;color:${TEXT_PRIMARY}}
.term-add input:focus{outline:none;border-color:var(--dash-accent)}
.term-add button{flex:none;min-height:32px;padding:0 12px;border:none;border-radius:9px;
  background:var(--dash-accent);color:#fff;cursor:pointer;font-family:${F};font-size:13px;font-weight:600}
.term-add button:disabled{opacity:.45;cursor:default}
.term-row:last-child{border-bottom:none}
.term-rn{flex:none;width:22px;font-family:${MONO};font-size:13px;color:${TEXT_MUTED};
  font-variant-numeric:tabular-nums}
.term-rw{flex:0 1 auto;min-width:0;font-size:14px;line-height:1.35;color:${TEXT_PRIMARY};overflow-wrap:anywhere}
.term-row[data-done="1"] .term-rw{text-decoration:line-through;color:${TEXT_MUTED}}
.term-row[data-done="1"] .term-rn{color:${TOKENS.STATE.ok}}
.term-rsrc{flex:none;font-size:13px;color:${TEXT_MUTED};padding:0 6px;border-radius:999px;background:${SURFACE_2}}
.term-rk{flex:none;margin-left:auto;font-family:${MONO};font-size:13px;color:${TEXT_MUTED}}

.term-map{display:flex;flex-direction:column;gap:6px;padding-top:10px}
.term-maprow{display:grid;grid-template-columns:228px repeat(3,minmax(0,1fr));gap:8px;align-items:stretch}
.term-maphead span{font-family:${MONO};font-size:13px;font-weight:600;letter-spacing:.1em;
  text-transform:uppercase;color:#8a9098}
.term-mapweek{display:flex;flex-direction:column;gap:1px;justify-content:center;padding-right:6px;min-width:0}
.term-mapname{font-size:14px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.25}
.term-mapsub{font-family:${MONO};font-size:13px;color:${TEXT_MUTED}}
.term-cell{display:flex;flex-direction:column;gap:3px;align-items:stretch;text-align:left;min-height:56px;
  padding:8px 11px;border-radius:11px;border:none;background:${SURFACE_2};cursor:pointer;font-family:${F}}
.term-cell:hover{background:rgba(23,19,16,.07)}
.term-cell[data-empty="1"]{background:none;border:1.5px dashed ${BORDER_STRONG};justify-content:center}
.term-cell[data-today="1"]{background:#fff1f2;box-shadow:inset 0 0 0 2px ${LIVE}}
.term-cellday{font-family:${MONO};font-size:13px;color:${TEXT_MUTED}}
.term-cell[data-today="1"] .term-cellday{color:${LIVE};font-weight:600}
/* A title Andrew wrote reads as ink. One carried in from an earlier day, or
   borrowed from the week, reads quieter — so the map shows at a glance which
   days he has actually named. */
.term-celltitle{font-size:14px;font-weight:600;line-height:1.3;color:${TEXT_PRIMARY};
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.term-celltitle[data-own="0"]{font-weight:500;color:${TEXT_SECONDARY}}
.term-cellsec{display:flex;align-items:baseline;gap:8px;font-size:14px;color:${TEXT_PRIMARY};line-height:1.3}
.term-cellsec span:first-child{flex:1 1 auto;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.term-cellsec span[data-unnamed="1"]{font-weight:500;color:${TEXT_MUTED}}
.term-cellempty{font-size:13px;color:${TEXT_MUTED}}
@media (max-width:900px){
  .term-maprow{grid-template-columns:minmax(0,1fr)}
  .term-maphead{display:none}
  .term-day-head{padding-left:0;flex-wrap:wrap}
  .term-secs{padding-left:62px}}
`;
