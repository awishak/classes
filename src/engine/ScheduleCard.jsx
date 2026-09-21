// The Schedule card. One view, and everybody reads the same one.
//
// Weeks rendered clean: the topic, the days in the order they happen, and what
// each day carries, with readings and challenges linking out.
//
// Andrew, 2026-09-21: "i want you to make my schedule view the same as their
// schedule view. if i want to make changes, I'll do it in dashboard." So the
// week composer that used to open here for the instructor is gone. The
// schedule is a thing to read, not a second place to build a term, and the
// dashboard is where a day gets built.
//
// Weeks live in the store at data.schedule, seeded from config.scheduleWeeks,
// and the dashboard writes them.

import { useState, useEffect } from "react";
import { normSlot, kindOf } from "./dayplan.js";
import { ComingBox, AwayList } from "./Attendance.jsx";
import { isAway, idFor, awayIds } from "./attendance.js";
import { dayTitles } from "./days.js";
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
const SURFACE_CARD = TOKENS.SURFACE.card;   // a text box takes the card's own surface, which is dark after dark
const SURFACE_SUNK = TOKENS.SURFACE.sunk;   // the ground a reading sits on, a shade under the card
const TAP = 44;

const TYPE_META = {
  reading: { color: "#2563eb", label: "Reading" },
  assignment: { color: "#d97706", label: "Challenge" },
  activity: { color: "#047857", label: "Activity" },
};
const Dot = ({ color }) => <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />;

const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;

// ─── data access (seed from config until the store has its own copy) ───
const getWeeks = (data, config) => data?.schedule || config.scheduleWeeks || [];

// ─── date helpers ───
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s + ", 2026");
  return isNaN(d) ? null : d;
}
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayOf = (s) => { const d = parseDate(s); return d ? WEEKDAYS[d.getDay()] : null; };

// The date a week's item falls on. A class day is one of the week's own dates.
// A deadline can land on a day with no class, the Sunday after the week or the
// Friday of finals week, and that date is worked out from the week's Monday,
// because "Sun" on its own made a student work out which Sunday.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function dateInWeek(week, day) {
  const own = (week.dates || []).find(d => dayOf(d) === day);
  if (own) return own;
  const first = parseDate((week.dates || [])[0]);
  const want = WEEKDAYS.indexOf(day);
  if (!first || want < 0) return "";
  const monday = new Date(first.getFullYear(), first.getMonth(), first.getDate() - ((first.getDay() + 6) % 7));
  const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + ((want + 6) % 7));
  return MONTHS[d.getMonth()] + " " + d.getDate();
}
// A week, broken into the days it happens on.
//
// Andrew, 2026-09-20: "each week should have individual days with readings, a
// topic, and assignments due, so that means include sundays if there is
// something due on sundays." So the class days are always there, in order,
// and any other day of that week turns up when something is due on it. A
// deadline on a Sunday is the reason the list is not just the class days.
//
// An item with no day on it belongs to the week rather than to a day, and
// sits above them.
export function daysOfWeek(week, items) {
  const rows = new Map();
  const touch = (date) => {
    if (!rows.has(date)) rows.set(date, { date, classDay: (week.dates || []).includes(date), items: [] });
    return rows.get(date);
  };
  (week.dates || []).forEach(d => touch(d));
  const loose = [];
  (items || []).forEach(it => {
    const date = it.date ? dateInWeek(week, it.date) : "";
    if (!date) { loose.push(it); return; }
    touch(date).items.push(it);
  });
  const days = [...rows.values()]
    .filter(d => d.classDay || d.items.length)
    .sort((a, b) => (parseDate(a.date)?.getTime() || 0) - (parseDate(b.date)?.getTime() || 0));
  return { days, loose };
}

// "Monday, September 22", which is a heading a student can read at a glance.
const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function dayHeading(date) {
  const d = parseDate(date);
  return d ? WEEKDAY_FULL[d.getDay()] + ", " + MONTH_FULL[d.getMonth()] + " " + d.getDate() : date;
}

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

// ─────────────────────────────────────────────────────────────
// Item row (used in both views)
// ─────────────────────────────────────────────────────────────
// Where a reading came from: the source written on its block, or the site the
// link points at. theatlantic.com says enough, and www. in front of it says
// nothing. A chapter with neither says nothing rather than something made up.
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
export const sourceOf = (item, block) => (block?.source || "").trim() || hostOf(item.url || block?.url || "");

// A week's items in the order the week happens: Monday's first, then
// Wednesday's, then Friday's, and within a day in the order they were added.
// They were in the order they were added across the whole week, so a reading
// put on Monday after the term was built landed under Friday's.
const DAY_ORDER = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
export const inWeekOrder = (items) => (items || [])
  .map((it, i) => [it, i])
  .sort((a, b) => (DAY_ORDER[a[0].date] || 9) - (DAY_ORDER[b[0].date] || 9) || a[1] - b[1])
  .map(([it]) => it);

// What students see on a week: the games and Headlines, the readings, and the
// assignments. Nothing else.
//
// The games and Headlines come from the day plans, because the day plan is
// where a class is actually built. The week carried activity rows of its own,
// copied in from Spring, and those never followed the day: COMM 118's week
// listed a Game on seven weeks while the games were really sets placed on
// other days, and a Game or Headlines moved on the dashboard stayed put on the
// schedule. Readings and assignments are the week's own, which is also where
// the dashboard's readings list writes them.
const GAME_FEATURES = new Set(["Game", "Team Trivia"]);
const STUDENT_TYPES = new Set(["reading", "assignment"]);
const isGameSet = (block, blockOf) => block?.type === "set" && (/\b(game|trivia)\b/i.test(block.title || "")
  || (block.children || []).some(id => (blockOf(id)?.tags || []).some(t => /game|trivia/i.test(t))));

export function studentItems(week, dayPlans, blockOf) {
  const lookup = blockOf || (() => null);
  const fromFlow = [];
  (week.dates || []).forEach(date => {
    const plan = (dayPlans || {})[date];
    if (!plan) return;
    const seen = new Set();
    Object.values(plan.slots || {}).forEach(slot => normSlot(slot).items.forEach(it => {
      const block = it.blockId ? lookup(it.blockId) : null;
      // A game row wears the name the day gave it. Emptied, it is still a game
      // that happens in the room, so it says what a Game row says.
      const title = it.gameId ? (it.text || "Game")
        : it.feature && (GAME_FEATURES.has(it.feature) || it.feature === "Headlines") ? it.feature
        : isGameSet(block, lookup) ? block.title : "";
      if (!title || seen.has(title)) return;
      seen.add(title);
      fromFlow.push({ id: "flow-" + date + "-" + it.id, type: "activity", title, date: dayOf(date) || "" });
    }));
  });
  return [...(week.items || []).filter(it => STUDENT_TYPES.has(it.type)), ...fromFlow];
}

// A reading is a card, and the day it belongs to is the loud thing.
//
// Andrew, 2026-09-21: "the schedule view for students is still too cluttered.
// what if you made the readings looks like cards on a slightly gray background
// or something like tht. like why is the title of the day not as prominent as
// a reading. come on man." Fair. A reading's title was 16px on white and the
// day's own title was 16px on white under a 17px heading, so twelve readings
// and the day they are for all read as one long list.
//
// So the day's title is the biggest thing in the day, the date above it is a
// label, and every reading sits on the sunk surface as a card of its own: the
// kind in small caps, the title under it, where it came from under that.
function ItemView({ item, picked, when, source, href, anchor }) {
  const m = TYPE_META[item.type] || {};
  // The date column is for the week's own rows, which have no day heading over
  // them to say which day they are on. Under a day the heading has said it.
  const stamp = when === "" ? "" : (when || item.date || "");
  const card = (
    <span style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Dot color={m.color} />
        <span style={{ fontSize: 11, fontWeight: 700, color: m.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</span>
        {stamp ? <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stamp}</span> : null}
        {picked ? <PickMark size={22} label /> : null}
      </span>
      <span style={{ display: "block", fontSize: 15, lineHeight: 1.4, color: TEXT_PRIMARY, marginTop: 3 }}>{item.title}</span>
      {source ? <span style={{ display: "block", fontSize: 13, color: TEXT_MUTED, marginTop: 1 }}>{source}</span> : null}
    </span>
  );
  const seat = { display: "block", background: SURFACE_SUNK, borderRadius: 12, padding: "10px 12px",
    textDecoration: "none", scrollMarginTop: 130, overflowWrap: "anywhere" };
  const url = href || item.url;
  if (!url) return <div id={anchor || undefined} style={seat}>{card}</div>;
  return (
    <a id={anchor || undefined} href={url} style={seat}
      {...(href ? {} : { target: "_blank", rel: "noreferrer" })}>{card}</a>
  );
}

// A week whose topic says "Finals" reads "Finals Week"; otherwise "Week N".
// The plural matters: "Final project" is a topic three weeks of COMM 3 share.
const isFinals = (w) => /\bfinals\b/i.test(w.topic || "");
const weekTag = (w, i) => isFinals(w) ? "Finals Week" : "Week " + (i + 1);
const weekLabel = (w, i) => isFinals(w) ? "Finals Week" : "Week " + (i + 1) + (w.topic ? ": " + w.topic : "");

// Dropdown to jump to a week.
function WeekNav({ weeks, accent }) {
  if ((weeks || []).length < 2) return null;
  const go = (id) => { const el = document.getElementById("wk-" + id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <div style={{ marginBottom: 16 }}>
      <select onChange={e => { if (e.target.value) go(e.target.value); }} defaultValue=""
        style={{ fontFamily: F, fontSize: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, minHeight: TAP, background: SURFACE_CARD, color: TEXT_PRIMARY, maxWidth: "100%" }}>
        <option value="" disabled>Jump to week…</option>
        {weeks.map((w, i) => <option key={w.id} value={w.id}>{weekLabel(w, i)}</option>)}
      </select>
    </div>
  );
}

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

export function ScheduleDetail({ config, data, blockOf, focusDay, instructor, me, mark }) {
  return <StudentSchedule config={config} data={data} blockOf={blockOf} focusDay={focusDay}
    instructor={instructor} me={me} mark={mark} />;
}

// A day of the schedule, as part of an address: /comm3/schedule/sep-23, which
// is what the readings link on the front page opens. Andrew, 2026-09-20: "when
// you click, it goes to the TOP of that day on the schedule." The first row of
// that day carries the anchor, because a week has no heading for a day inside
// it and the row is where that day starts.
export const dayAnchor = (date) => "day-" + String(date || "").trim().toLowerCase().replace(/\s+/g, "-");

// A day's rows, with a long reading list folded up.
//
// Andrew, 2026-09-21: "if there's more than 3 readings in a day, put the 3
// readings adn then and exapnad all readings box." COMM 118 sets six and seven
// readings on a day, and a day that long pushes the next day off the screen, so
// a week stops being something you can take in.
//
// Three readings, then his box. Only readings are counted and only readings are
// folded away: a challenge is due whether or not the list is open, and a game
// is what happens in the room that day.
function DayItems({ items, row, accent }) {
  const [all, setAll] = useState(false);
  const readings = items.filter(it => it.type === "reading");
  const folded = all ? [] : readings.slice(3);
  const hidden = new Set(folded.map(it => it.id));
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
      {items.filter(it => !hidden.has(it.id)).map(row)}
      {folded.length ? (
        <button onClick={() => setAll(true)} className="ca-focus"
          style={{ minHeight: TAP, padding: 0, marginTop: 2, background: "none", border: "none", cursor: "pointer",
            fontFamily: F, fontSize: 15, fontWeight: 600, color: accent, textAlign: "left" }}>
          Expand all readings
        </button>
      ) : null}
    </div>
  );
}

function StudentSchedule({ config, data, blockOf, focusDay, instructor, me, mark }) {
  const weeks = getWeeks(data, config);
  // A week item points at a block, and the pick lives on the block, so what
  // the students see is worked out from the block rather than stamped on the
  // row when the pick was made.
  const isPicked = (it) => !!(blockOf && blockOf(it.blockId || it.libId)?.pick);
  const current = nearestWeekId(weeks);
  // What each class day is about, carried the way the rest of the app carries
  // it: a title written on a day covers the days after it until the next one.
  const titles = dayTitles(weeks, data?.dayPlans);
  // Who this is, for the day this student is answering about. A page being read
  // by nobody in particular, which is what the features page is, gets no box.
  const myId = me ? idFor(config, data, me) : "";
  // A day of the term the class is in the room for. A day with no in-person
  // meeting and a day of sit-downs take no answer, and neither does a Sunday
  // that only turned up because something is due on it.
  const meets = (d) => d.classDay && kindOf((data?.dayPlans || {})[d.date]) === "class";
  // Andrew, 2026-09-21: "i see the names in the schedule. every day." Every day
  // of the term, past ones included, so a student can say now that they will
  // miss a day in three weeks.
  //
  // The box sits on the day's own line, beside the date: "attendance click
  // button needs to be in the same line as the class date, except on the hero."
  // The names are a list and stay under the day, where a list has room.
  const comingBox = (d) => (meets(d) && myId && mark && !instructor
    ? <ComingBox accent={config.accent} checked={!isAway(data, d.date, myId)}
        onChange={(coming) => mark(d.date, myId, !coming)} />
    : null);
  const awayLine = (d) => (meets(d) && instructor && awayIds(data, d.date).length
    ? <div style={{ marginTop: 4 }}><AwayList config={config} data={data} date={d.date} /></div>
    : null);
  // The day named in the address, scrolled to after the weeks are drawn. A day
  // the term does not have leaves the page where it opened.
  useEffect(() => {
    if (!focusDay) return;
    const el = document.getElementById(dayAnchor(focusDay));
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusDay]);
  return (
    <div>
      <div style={{ ...h2, marginBottom: 8 }}>Schedule</div>
      {/* Andrew's words, unedited. A schedule that changes and does not say so
          is a schedule students stop trusting. */}
      <p style={{ margin: "0 0 16px", fontSize: 15, lineHeight: 1.55, color: TEXT_SECONDARY, maxWidth: "62ch" }}>
        The best way for me to ensure this class is as useful for you as possible is for us both to be flexible.
        Therefore, this schedule and list of assignments are subject to change in all sorts of ways. I'll make sure
        to keep you in the loop on important changes.
      </p>
      <WeekNav weeks={weeks} accent={config.accent} />
      {/* Andrew, 2026-09-21: "i think each day needs its own card in a way."
          The week was one box with every day inside it, so a week of three
          days was one tall card and a day was a paragraph in it. The week is
          a heading now and each day is a card of its own, with its readings
          on the sunk surface inside. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {weeks.map((w, wi) => {
          const isNow = w.id === current;
          const { days, loose } = daysOfWeek(w, studentItems(w, data?.dayPlans, blockOf));
          const row = (it) => {
            const block = blockOf ? blockOf(it.blockId || it.libId) : null;
            // A deadline opens the challenge itself, where the instructions
            // link and the place to hand the work in are.
            const href = it.type === "assignment" && it.asgId && config.path
              ? config.path + "/challenges/" + encodeURIComponent(it.asgId) : "";
            return <ItemView key={it.id} item={it} picked={isPicked(it)} href={href} when=""
              source={href ? "" : sourceOf(it, block)} />;
          };
          // The week this week is in keeps the class's colour around its days.
          const seat = {
            background: SURFACE_CARD, borderRadius: 16, padding: 16, scrollMarginTop: 130,
            border: (isNow ? "1.5px solid " + config.accent : "1px solid " + BORDER_STRONG),
          };
          return (
            <div key={w.id} id={"wk-" + w.id} style={{ scrollMarginTop: 130 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                <span style={{ ...label, color: config.accent }}>{weekTag(w, wi)}</span>
                {isNow && <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", background: config.accent, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>This week</span>}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: TEXT_PRIMARY }}>{w.topic || "Untitled week"}</div>
              {w.text && <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: 8, whiteSpace: "pre-wrap" }}>{w.text}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {/* A row the week carries rather than a day, which is what a
                    reading with no day on it is. */}
                {loose.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{inWeekOrder(loose).map(row)}</div>
                ) : null}
                {days.map(d => (
                  <div key={d.date} id={dayAnchor(d.date)} style={seat}>
                    {/* The date is a label over the day, and what the day is
                        about is the heading under it. "Wed" on its own made a
                        student work out which Wednesday, and a deadline on a
                        Sunday needs to say Sunday. */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ ...label, color: TEXT_SECONDARY }}>{dayHeading(d.date)}</span>
                      {d.classDay ? null : <span style={{ ...label, color: TEXT_MUTED }}>No class</span>}
                      {comingBox(d)}
                    </div>
                    {/* A day with no title of its own falls back to the
                        week's topic, and the week's topic is the heading over
                        these cards, so a day that has not been named says the
                        date and nothing else rather than the same words three
                        times down the week. */}
                    {titles[d.date]?.title && !titles[d.date].fromWeek ? (
                      <div style={{ fontSize: 19, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.25, letterSpacing: "-0.01em", marginTop: 2, textWrap: "balance" }}>{titles[d.date].title}</div>
                    ) : null}
                    {/* A day with nothing on it yet says nothing: "dont put
                        nothing set for this day". The card is the day. */}
                    {d.items.length ? <DayItems items={inWeekOrder(d.items)} row={row} accent={config.accent} /> : null}
                    {awayLine(d)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

