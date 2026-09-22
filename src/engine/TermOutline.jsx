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
import { normSlot, sectionsOf, orderSlots, kindOf, KINDS } from "./dayplan.js";
import { typeOf } from "./blocks.js";
import Slide, { slideOf, readSlidesOn, writeSlidesOn } from "./Slide.jsx";

const dayStamp = (s) => { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d : null; };
function inWeek(week, date) {
  const first = dayStamp((week.dates || [])[0]);
  const d = dayStamp(date);
  if (!first || !d) return false;
  const monday = new Date(first.getFullYear(), first.getMonth(), first.getDate() - ((first.getDay() + 6) % 7));
  const days = Math.round((d - monday) / 86400000);
  return days >= 0 && days < 7;
}

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


// The three class days of a week, in order, are its Mon, Wed and Fri markers,
// which is where the readings and the games hang.
const MARKERS = ["Mon", "Wed", "Fri"];
const weekDayInfo = (weeks, days) => {
  const out = {};
  weeks.forEach(w => {
    days.filter(d => d.weekId === w.id).forEach((d, i) => {
      const on = (w.items || []).filter(it => (it.date || "") === MARKERS[i]);
      out[d.date] = {
        readings: on.filter(it => it.type === "reading").length,
        game: on.some(it => it.type === "activity" && /game/i.test(it.title || "")),
      };
    });
  });
  return out;
};

// A deadline that lands on a Sunday belonged to nobody: the map draws class
// days, and a due date off a class day was drawn nowhere at all. Every
// deadline now lands on the first class day on or after it, carrying its own
// date, and one after the last class day lands on the last one.
export function deadlinesByDay(assignments, dates) {
  const stamps = dates.map(dayStamp);
  const out = {};
  (assignments || []).forEach(a => {
    const t = dayStamp(a.due);
    if (!t) return;                                   // "Ongoing" is not a date
    let i = stamps.findIndex(s => s && s >= t);
    if (i < 0) i = dates.length - 1;
    if (i < 0) return;
    (out[dates[i]] = out[dates[i]] || []).push({ title: a.title, due: a.due, onTheDay: a.due === dates[i] });
  });
  return out;
}

// What a day amounts to: its sections, how many rows, how many done.
const readDay = (config, plans, date) => {
  const plan = (plans || {})[date];
  if (!plan) return { rows: 0, done: 0, sections: [] };
  const secs = sectionsOf(config, orderSlots(plan));
  let rows = 0, done = 0;
  const doneSet = new Set(plan.done || []);
  // A day can have a plan and no slots at all — a sequence was picked and
  // nothing put in it yet, so the stored plan is `{ sequenceId }` and nothing
  // more. sectionsOf still answers with that sequence's own slots, because the
  // shape of the day is real even when it is empty. So the sections are named
  // and the slots object they point into does not exist, and reading one threw
  // the whole outline away: undefined["opener"].
  const slots = plan.slots || {};
  const sections = secs.map(([slot, name]) => {
    const bucket = normSlot(slots[slot]);
    const items = bucket.items || [];
    rows += items.length;
    items.forEach(it => { if (doneSet.has(it.id)) done++; });
    return {
      slot, name, n: items.length, named: !!(bucket.title || "").trim(),
      items: items.map(it => ({ id: it.id, item: it, done: doneSet.has(it.id) })),
    };
  }).filter(s => s.n || s.slot.startsWith("sec-"));
  return { rows, done, sections };
};

export default function TermOutline({ config, weeks, plans, assignments, day, onPick, onClose, onWeekTopic, onDayTitle, onDayKind, onMoveRow, onAddRow, blockOf, startView, features, ground }) {
  const [view, setView] = useState(startView || "outline");
  const [only, setOnly] = useState("");            // "" | "planned" | "empty"
  const [openWeeks, setOpenWeeks] = useState(() => new Set());
  const [openDays, setOpenDays] = useState(() => new Set([day]));
  const [over, setOver] = useState("");        // the section a drag is hovering
  const [dragging, setDragging] = useState("");
  const [adding, setAdding] = useState("");   // "<date>|<slot>"
  const [draft, setDraft] = useState("");
  const [slidesOn, setSlidesOnState] = useState(readSlidesOn);
  const setSlidesOn = (on) => { setSlidesOnState(on); writeSlidesOn(on); };

  const days = allDays(weeks);
  const titles = dayTitles(weeks, plans);
  const info = {};
  days.forEach(d => { info[d.date] = readDay(config, plans, d.date); });

  const built = days.filter(d => info[d.date].rows).length;
  const onWeek = (w) => (w.items || []).length;
  const dueOn = {};
  (assignments || []).forEach(a => { if (a.due) (dueOn[a.due] = dueOn[a.due] || []).push(a.title); });
  const onDay = weekDayInfo(weeks, days);
  const deadlines = deadlinesByDay(assignments, days.map(d => d.date));

  // A deadline belongs to the week it falls inside, Monday to Sunday, not only
  // to the days the class meets: COMM 3's exercises are due on Sundays, and a
  // week listing only its class dates never said so.
  const dueThisWeek = (w) => Object.keys(dueOn).filter(due => inWeek(w, due)).flatMap(due => dueOn[due]);

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
            {view === "outline" ? (
              <button className="dash-focus term-slidetoggle" aria-pressed={slidesOn}
                onClick={() => setSlidesOn(!slidesOn)}>{slidesOn ? "Hide slides" : "Show slides"}</button>
            ) : null}
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
                              {/* A row and the notes under it are one group, with
                                  the row's slide beside the whole group, so the
                                  notes stay right under the row they belong to. */}
                              {s.items.reduce((groups, entry) => {
                                if ((entry.item.depth || 0) > 0 && groups.length) groups[groups.length - 1].push(entry);
                                else groups.push([entry]);
                                return groups;
                              }, []).map(group => {
                                const parts = group.map(({ id, item, done }) => {
                                const n = s.items.findIndex(x => x.id === id);
                                const b = item.blockId ? blockOf(item.blockId) : null;
                                const words = (b ? b.headline || b.title : item.claim || item.text) || "a row";
                                const kind = item.feature ? "activity" : b ? typeOf(b.type).label.toLowerCase() : "note";
                                const src = b?.source || hostOf(b?.url);
                                const depth = item.depth || 0;
                                // The same slide the day plan draws beside this
                                // row. Here it is a preview: the outline is where
                                // a term is planned, not where a class is run.
                                const slide = slidesOn && !depth
                                  ? slideOf({ item, block: b, title: (b ? b.title : item.text) || "", claim: item.claim || b?.headline || "", tag: s.name, features, assignments })
                                  : null;
                                return { id, slide, words, node: (
                                  <div key={id} className="term-row" data-done={done ? "1" : "0"} draggable
                                    onDragStart={e => {
                                      e.dataTransfer.effectAllowed = "move";
                                      e.dataTransfer.setData("text/plain", JSON.stringify({ from: d.date, slot: s.slot, id }));
                                      setDragging(id);
                                    }}
                                    onDragEnd={() => setDragging("")}
                                    title="Drag onto another section, on this day or any other">
                                    <span className="term-rtext" style={{ marginLeft: depth * 30 }}>
                                      <span className="term-rline">
                                        <span className="term-grip" aria-hidden="true">&#10303;</span>
                                        <span className="term-rn">{done ? "✓" : n + 1}</span>
                                        <span className="term-rw">{words}</span>
                                        {src ? <span className="term-rsrc">{src}</span> : null}
                                        <span className="term-rk">{kind}</span>
                                      </span>
                                      {b?.body ? <span className="term-rbody">{b.body}</span> : null}
                                    </span>
                                  </div>
                                ) };
                                });
                                return (
                                  <div key={parts[0].id} className={"term-group" + (slidesOn ? " with-slides" : "")}>
                                    <div className="term-grouptext">{parts.map(p => p.node)}</div>
                                    {slidesOn ? (
                                      <span className="term-rslide">
                                        {parts[0].slide ? <Slide cast={parts[0].slide} config={{ path: config.path || "" }} ground={ground} label={parts[0].words} /> : null}
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })}
                              {/* Type a line straight into any section of any
                                  day, the same box the day plan uses. */}
                              {adding === d.date + "|" + s.slot ? (
                                <div className="term-add">
                                  <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                                    placeholder="Type an item, or paste a link"
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
                      const kind = kindOf(plans[d.date]);
                      // Slides, readings, and whether there is a game. The
                      // section names were a summary of a summary; what a day
                      // is planning-wise is how much of it exists.
                      const slides = it.sections.reduce((n2, s) => n2 + s.items.filter(x => !(x.item.depth || 0)).length, 0);
                      const counts = [
                        slides ? slides + (slides === 1 ? " slide" : " slides") : "",
                        onDay[d.date]?.readings ? onDay[d.date].readings + (onDay[d.date].readings === 1 ? " reading" : " readings") : "",
                        onDay[d.date]?.game ? "Game" : "",
                      ].filter(Boolean);
                      const due = deadlines[d.date] || [];
                      return (
                        <div key={d.date} className="term-cell" data-kind={kind}
                          data-empty={it.rows || counts.length ? "0" : "1"} data-today={d.date === day ? "1" : "0"}>
                          <button className="dash-focus term-cellopen" onClick={() => go(d.date)}>
                            <span className="term-cellday">
                              {d.date}{d.date === day ? <b> today</b> : null}
                            </span>
                            {/* What the day is called. The counts say how much
                                of it exists; the title says what it is about,
                                and a map of thirty-two days without that is a
                                map of thirty-two dates. */}
                            {titles[d.date]?.title ? (
                              <span className="term-celltitle" data-own={titles[d.date].own ? "1" : "0"}>
                                {titles[d.date].title}
                              </span>
                            ) : null}
                            <span className="term-cellcounts">{counts.length ? counts.join(" · ") : "empty"}</span>
                            {/* A deadline off a class day lands on the next one
                                and says its own date, so nothing is due on a
                                Sunday the map never draws. */}
                            {due.map(x => (
                              <span key={x.title} className="term-due">
                                {x.title}{x.onTheDay ? " due" : " due " + x.due}
                              </span>
                            ))}
                          </button>
                          {onDayKind ? (
                            <select className="dash-focus term-cellkind" value={kind} aria-label={"What kind of day " + d.date + " is"}
                              onChange={e => onDayKind(d.date, e.target.value)}>
                              {KINDS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                            </select>
                          ) : null}
                        </div>
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
  max-height:calc(100vh - 68px);background:var(--surface-page);border-radius:20px;z-index:81;display:flex;flex-direction:column;
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

/* A DAY IS A CARD, here as on the schedule and on the map. Andrew,
   2026-09-22: "in the outline the card is the day i think? definitely it;s a
   day on teh map." A rule under each day made the quarter one long ruled list,
   which is the shape the schedule had before a day got a card. The card is the
   day rather than the section, because the outline is the whole quarter: a
   card per section here is a hundred and fifty cards on one screen. */
.term-day{background:var(--surface-card);border:var(--card-border);box-shadow:var(--card-shadow);border-radius:var(--card-radius);
  padding:4px 14px 6px;margin-bottom:8px}
.term-day-head{display:flex;align-items:center;gap:11px;min-height:40px;padding-left:48px}
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
.term-secs{display:flex;flex-direction:column;gap:10px;padding:4px 0 8px 106px}
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
/* The outline reads as the same document as the day: no rule under each row,
   the content right under the words, and the slide in a column beside it. */
.term-group{display:grid;grid-template-columns:minmax(0,1fr);column-gap:18px;align-items:start;padding:2px 0}
.term-group.with-slides{grid-template-columns:minmax(0,1fr) 200px}
.term-grouptext{min-width:0;display:flex;flex-direction:column}
.term-row{display:flex;flex-direction:column;padding:2px 4px;border-radius:8px;cursor:grab}
.term-row:hover{background:${SURFACE_2}}
.term-rtext{min-width:0;display:flex;flex-direction:column;gap:0}
.term-rline{display:flex;align-items:baseline;gap:10px;min-height:26px;padding-top:3px}
.term-rbody{padding-left:56px;margin-top:-1px;padding-bottom:3px;font-size:14px;line-height:1.45;color:${TEXT_SECONDARY};white-space:pre-wrap;
  overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;max-width:72ch}
.term-rslide{display:flex;justify-content:flex-end;padding:3px 0}
.term-slidetoggle{min-height:32px;padding:0 12px;border:1px solid ${BORDER_STRONG};border-radius:8px;background:#fff;
  font-family:${F};font-size:13px;font-weight:600;color:${TEXT_SECONDARY};cursor:pointer}
.term-slidetoggle:hover{color:${TEXT_PRIMARY};background:${SURFACE_2}}
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
/* A day on the map is the same card again, not a sunk box with a radius of
   its own. */
.term-cell{display:flex;flex-direction:column;min-height:56px;font-family:${F};
  background:var(--surface-card);border:var(--card-border);box-shadow:var(--card-shadow);border-radius:var(--card-radius)}
.term-cellopen{flex:1 1 auto;display:flex;flex-direction:column;gap:3px;align-items:stretch;text-align:left;
  padding:8px 11px;border:none;border-radius:11px;background:none;cursor:pointer;font-family:${F}}
.term-cell:hover{background:rgba(23,19,16,.07)}
.term-cell[data-empty="1"]{background:none;box-shadow:inset 0 0 0 1.5px ${BORDER_STRONG};justify-content:center}
/* What kind of day it is, in colour. A day with no in-person meeting takes the
   warning amber the rest of the system uses for "this is not the usual"; a
   sit-down takes the class's own colour, because it is still a day in a room
   with students in it. Both beat the empty state: a day can be a sit-down and
   have nothing planned on it, and the colour is the more important fact. */
.term-cell[data-kind="off"], .term-cell[data-kind="off"][data-empty="1"]{
  background:color-mix(in srgb, ${WARN} 10%, #fff);box-shadow:inset 0 0 0 1.5px color-mix(in srgb, ${WARN} 45%, #fff)}
.term-cell[data-kind="off"]:hover{background:color-mix(in srgb, ${WARN} 16%, #fff)}
.term-cell[data-kind="sitdown"], .term-cell[data-kind="sitdown"][data-empty="1"]{
  background:color-mix(in srgb, var(--dash-accent) 11%, #fff);box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--dash-accent) 45%, #fff)}
.term-cell[data-kind="sitdown"]:hover{background:color-mix(in srgb, var(--dash-accent) 17%, #fff)}
.term-cell[data-today="1"]{background:#fff1f2;box-shadow:inset 0 0 0 2px ${LIVE}}
/* The picker sits at the foot of the cell and stays quiet until it is wanted. */
.term-cellkind{flex:none;margin:0 8px 8px;min-height:28px;border:1px solid transparent;border-radius:8px;
  background:none;font-family:${F};font-size:13px;color:${TEXT_MUTED};cursor:pointer;padding:0 4px;
  appearance:none;-webkit-appearance:none;text-overflow:ellipsis}
.term-cell:hover .term-cellkind,.term-cellkind:focus{border-color:${BORDER_STRONG};background:#fff;color:${TEXT_SECONDARY}}
.term-cell[data-kind="off"] .term-cellkind{color:${WARN};font-weight:600}
.term-cell[data-kind="sitdown"] .term-cellkind{color:var(--dash-accent);font-weight:600}
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
/* How much of the day exists: slides, readings, and whether there is a game. */
.term-cellcounts{font-family:${MONO};font-size:13px;color:${TEXT_SECONDARY};line-height:1.35}
/* A deadline is a whole assignment name, so it wraps rather than running off
   the edge of the cell. One line per deadline, and the cell grows. */
.term-map .term-due{white-space:normal;overflow-wrap:anywhere;line-height:1.35;padding:3px 9px;
  align-self:flex-start;max-width:100%;text-align:left}
@media (max-width:900px){
  .term-maprow{grid-template-columns:minmax(0,1fr)}
  .term-maphead{display:none}
  .term-day-head{padding-left:0;flex-wrap:wrap}
  .term-secs{padding-left:62px}}
`;
