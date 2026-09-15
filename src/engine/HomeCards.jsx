// The pieces of the class home that are not a plain card.
//
// Andrew, 2026-09-15, looking at the page as a student: "make the schedule
// the hero ... here's what you need to know for next class." Then Assignments
// with a highlight as a deadline gets close, Class (your card, the roster and
// your instructor), Grades, and Games at the bottom "if students want to
// review past game scores." More holds the theme, day or night, and "requests
// and bugs." And, instead of a discussion board, "a way for me to simply pin a
// google docs link on the front page."
//
// Every word a student reads here is either Andrew's (a day's title, a
// reading's title, a pinned link's name) or the interface naming its own parts.

import { useState } from "react";
import { genId } from "../utils.jsx";
import * as TOKENS from "./tokens.js";
import { dayTitles } from "./days.js";
import { studentItems, sourceOf } from "./ScheduleCard.jsx";
import { Avatar, profileOf } from "./RosterCard.jsx";
import { dueState } from "./AssignmentsCard.jsx";
import PickMark from "./Pick.jsx";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const WARN = TOKENS.STATE.warn;
const TAP = TOKENS.TAP;

const DISPLAY = { fontFamily: TOKENS.FONT.display, fontWeight: TOKENS.FONT.displayWeight, textShadow: TOKENS.FONT.displayShadow };
const small = { fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;

// The card title. On Clean the uppercase mono label read as a caption, so the
// title takes the face the bottom bar already uses, bigger. The other themes
// keep their own label faces, which are the point of those themes.
export const tileTitle = (theme) => theme === "clean"
  ? { fontFamily: F, fontSize: 20, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.01em", lineHeight: 1.2 }
  : { fontFamily: TOKENS.FONT.label, fontSize: 15, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };

// ─── the next class ───

// Readings on the card before the rest fold behind Show all.
export const READINGS_SHOWN = 3;

const WEEKDAY_FULL =["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dateOf = (s) => { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d : null; };
const meetsOf = (config) => (Array.isArray(config.meets) ? config.meets : config.meets ? [config.meets] : []);

const clock = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  return { h12: ((h + 11) % 12) + 1, m: m || 0, pm: h >= 12 };
};
const hm = (c) => c.h12 + ":" + String(c.m).padStart(2, "0");
// "9:15 to 10:20 am", or "11:00 am to 12:05 pm" when the sitting crosses noon.
export function timeText(sitting) {
  const s = clock(sitting.start), e = clock(sitting.end);
  if (!s || !e) return "";
  return s.pm === e.pm
    ? hm(s) + " to " + hm(e) + (e.pm ? " pm" : " am")
    : hm(s) + (s.pm ? " pm" : " am") + " to " + hm(e) + (e.pm ? " pm" : " am");
}

// Where the class meets: the config's own field, or the room named after the
// dot in its description line ("MWF 9:15 to 10:20 am · Vari 133").
export const locationOf = (config) => config.location
  || (String(config.desc || "").split("·").slice(1).join("·").trim());

// The sittings this student goes to. A student in a section sees that
// section's time; everyone else sees every sitting.
const sittingsFor = (config, section) => {
  const all = meetsOf(config);
  const mine = section ? all.filter(m => String(m.label || "").trim() === String(section).trim()) : [];
  return mine.length ? mine : all;
};

// The class day this page is about: today until the last sitting ends, then
// the next date on the schedule.
export function nextMeeting(config, data, now = Date.now()) {
  const weeks = data?.schedule || config.scheduleWeeks || [];
  // The stored times are 24-hour, "10:20" and "11:35", so minutes are arithmetic.
  const ends = meetsOf(config).map(m => String(m.end || "").split(":").map(Number))
    .filter(([h]) => Number.isFinite(h)).map(([h, m]) => h * 60 + (m || 0));
  const endMinutes = ends.length ? Math.max(...ends) : 24 * 60 - 1;
  let best = null;
  weeks.forEach(week => (week.dates || []).forEach(date => {
    const d = dateOf(date);
    if (!d) return;
    const over = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, endMinutes).getTime();
    if (over < now) return;
    if (!best || d < best.d) best = { d, date, week };
  }));
  return best;
}

// What a student needs to know for that class: the day, the time and room,
// the day's title, the readings and any game.
export function nextClassFacts(config, data, blockOf, section, now = Date.now()) {
  const next = nextMeeting(config, data, now);
  if (!next) return null;
  const plans = data?.dayPlans || {};
  const plan = plans[next.date] || {};
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const title = (dayTitles(weeks, plans)[next.date] || {}).title || next.week.topic || "";
  const weekday = WEEKDAY_FULL[next.d.getDay()];
  const onDay = studentItems(next.week, plans, blockOf).filter(it => it.date === weekday.slice(0, 3));
  const readings = onDay.filter(it => it.type === "reading").map(it => {
    const block = blockOf ? blockOf(it.blockId || it.libId) : null;
    return { id: it.id, title: it.title, url: it.url || block?.url || "", source: sourceOf(it, block), pick: !!block?.pick };
  })
    // Drew's Picks first, and otherwise the order the day lists them.
    .map((r, i) => [r, i]).sort((x, y) => (y[0].pick - x[0].pick) || (x[1] - y[1])).map(([r]) => r);
  const games = onDay.filter(it => it.type === "activity" && it.title !== "Headlines").map(it => it.title);
  return {
    date: next.date, weekday, title,
    time: sittingsFor(config, section).map(timeText).filter(Boolean).join(" and "),
    location: locationOf(config),
    noMeeting: !!plan.noMeeting,
    note: String(plan.studentNote || "").trim(),
    directions: config.directionsUrl || "",
    readings, games,
  };
}

// The note an instructor leaves for the next class, typed on the front page.
// Saved when the box loses focus, so there is no Save button to forget.
function NoteEditor({ date, value, update }) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);
  const save = () => {
    const next = draft.trim();
    if (next === value) return;
    update(prev => {
      const plans = { ...(prev.dayPlans || {}) };
      plans[date] = { ...(plans[date] || {}), studentNote: next };
      return { ...prev, dayPlans: plans };
    });
    setSaved(true);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={"note-" + date} style={small}>Note to students</label>
      <textarea id={"note-" + date} value={draft} onChange={e => { setDraft(e.target.value); setSaved(false); }} onBlur={save}
        style={{ fontFamily: F, fontSize: 16, minHeight: 84, padding: 12, borderRadius: 10, border: "1px solid " + BORDER_STRONG,
          background: "var(--surface-card)", color: TEXT_PRIMARY, lineHeight: 1.5, resize: "vertical" }} />
      {saved ? <span style={{ fontSize: 13, fontWeight: 600, color: TOKENS.STATE.ok }}>Saved</span> : null}
    </div>
  );
}

// The hero. A stone grey drawn from the theme's own ink, so the card stands
// apart from the white cards without the class colour and without an outline,
// and after dark the same mix lands a step lighter than the cards. A day with
// no meeting in the room carries an orange badge.
export function NextClassHero({ config, data, blockOf, section, onOpen, seat, instructor, update }) {
  const facts = nextClassFacts(config, data, blockOf, section);
  const [allReadings, setAllReadings] = useState(false);
  // White, like every other card. The tinted versions did not work, and the
  // Drew's Pick drawing has a white ground of its own that showed as a box on
  // anything else.
  const frame = {
    ...seat, padding: 20, fontFamily: F, textAlign: "left", width: "100%",
    background: "var(--surface-card)",
    display: "flex", flexDirection: "column", gap: 14,
  };
  if (!facts) {
    return (
      <section aria-label="Next class" style={frame}>
        <span style={small}>Next class</span>
        <Muted>No classes scheduled.</Muted>
      </section>
    );
  }
  return (
    <section aria-label="Next class" style={frame}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minHeight: 28 }}>
          <span style={{ ...small, color: TEXT_SECONDARY }}>Next class</span>
          {facts.noMeeting ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--surface-card)", background: WARN, borderRadius: 999, padding: "4px 10px" }}>
              No in-person meeting
            </span>
          ) : null}
          <button className="ca-focus" onClick={onOpen} aria-label="Schedule"
            style={{ marginLeft: "auto", minHeight: TAP, minWidth: TAP, background: "none", border: "none", cursor: "pointer", fontSize: 26, lineHeight: 1, color: TEXT_MUTED, padding: 0 }}>
            ›
          </button>
        </span>
        <span style={{ ...DISPLAY, fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.02em", color: TEXT_PRIMARY }}>{facts.weekday}, {facts.date}</span>
        {!facts.noMeeting && (facts.time || facts.location) ? (
          <span style={{ fontSize: 17, lineHeight: 1.3, color: TEXT_SECONDARY }}>{[facts.time, facts.location].filter(Boolean).join(" · ")}</span>
        ) : null}
        {/* Tight under the room line: the link keeps its 44px to tap in, and
            the negative margin takes the extra height back out of the gap. */}
        {!facts.noMeeting && facts.directions ? (
          <a className="ca-focus" href={facts.directions} target="_blank" rel="noreferrer"
            style={{ alignSelf: "flex-start", minHeight: TAP, margin: "-10px 0", display: "inline-flex", alignItems: "center", fontSize: 16, fontWeight: 600, lineHeight: 1.3, color: "var(--ca-accent)", textDecoration: "none" }}>
            Directions
          </a>
        ) : null}
        {facts.title ? <span style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.3, marginTop: 10, color: TEXT_PRIMARY }}>{facts.title}</span> : null}
      </div>

      {instructor && update ? (
        <div style={{ borderTop: "1px solid " + BORDER_STRONG, paddingTop: 12 }}>
          <NoteEditor key={facts.date} date={facts.date} value={facts.note} update={update} />
        </div>
      ) : facts.note ? (
        <div style={{ borderTop: "1px solid " + BORDER_STRONG, paddingTop: 12, fontSize: 17, lineHeight: 1.5, color: TEXT_PRIMARY, whiteSpace: "pre-wrap" }}>
          {facts.note}
        </div>
      ) : null}

      {facts.readings.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, borderTop: "1px solid " + BORDER_STRONG, paddingTop: 12 }}>
          <span style={small}>Readings</span>
          {(allReadings ? facts.readings : facts.readings.slice(0, READINGS_SHOWN)).map(r => {
            const inner = (
              <>
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>{r.title}</span>
                  {r.source ? <span style={{ fontSize: 14, color: TEXT_MUTED }}>{r.source}</span> : null}
                </span>
                {r.pick ? <PickMark size={24} /> : null}
              </>
            );
            const row = { display: "flex", alignItems: "center", gap: 10, minHeight: TAP, padding: "4px 0", textDecoration: "none" };
            return r.url
              ? <a key={r.id} className="ca-focus" href={r.url} target="_blank" rel="noreferrer" style={row}>{inner}</a>
              : <div key={r.id} style={row}>{inner}</div>;
          })}
          {facts.readings.length > READINGS_SHOWN ? (
            <button className="ca-focus" onClick={() => setAllReadings(v => !v)} aria-expanded={allReadings}
              style={{ alignSelf: "flex-start", minHeight: TAP, background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: F, fontSize: 16, fontWeight: 600, color: "var(--ca-accent)" }}>
              {allReadings ? "Show fewer" : "Show all " + facts.readings.length + " readings"}
            </button>
          ) : null}
        </div>
      ) : null}

      {facts.games.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: "1px solid " + BORDER_STRONG, paddingTop: 12 }}>
          <span style={small}>Game</span>
          {facts.games.map(g => <span key={g} style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY }}>{g}</span>)}
        </div>
      ) : null}
    </section>
  );
}

// ─── the Assignments card's highlight ───

// A week out the card takes an amber outline; two days out it fills as well.
export function owedStyle(asg) {
  const st = asg ? dueState(asg.due) : null;
  if (!st || st.tone === "calm") return null;
  const days = st.tone === "now" ? 0 : st.text === "Due tomorrow" ? 1 : Number((st.text.match(/\d+/) || [7])[0]);
  return days <= 2
    ? { border: "2px solid " + WARN, background: "color-mix(in srgb, " + WARN + " 8%, var(--surface-card))" }
    : { border: "2px solid " + WARN };
}

// ─── pinned links ───

export function PinnedLinks({ data, update, instructor, seat }) {
  const pins = data?.pins || [];
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  if (!pins.length && !instructor) return null;
  const add = () => {
    if (!url.trim()) return;
    update(prev => ({ ...prev, pins: [...(prev.pins || []), { id: genId(), title: title.trim(), url: url.trim(), at: Date.now() }] }));
    setTitle(""); setUrl("");
  };
  const remove = (id) => update(prev => ({ ...prev, pins: (prev.pins || []).filter(p => p.id !== id) }));
  const input = { fontFamily: F, fontSize: 16, minHeight: TAP, padding: "0 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "var(--surface-card)", color: TEXT_PRIMARY, minWidth: 0 };
  return (
    <section aria-label="Pinned" style={{ ...seat, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={small}>Pinned</span>
      {pins.map(p => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a className="ca-focus" href={p.url} target="_blank" rel="noreferrer"
            style={{ flex: 1, minWidth: 0, minHeight: TAP, display: "flex", alignItems: "center", fontSize: 17, fontWeight: 600, color: "var(--ca-accent)", textDecoration: "none", overflowWrap: "anywhere" }}>
            {p.title || p.url}
          </a>
          {instructor ? (
            <button className="ca-focus" onClick={() => remove(p.id)}
              style={{ flex: "none", minHeight: TAP, padding: "0 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "var(--surface-card)", color: TEXT_SECONDARY, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Unpin
            </button>
          ) : null}
        </div>
      ))}
      {instructor ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: pins.length ? 8 : 4 }}>
          <input aria-label="Name" value={title} onChange={e => setTitle(e.target.value)} placeholder="Name" style={{ ...input, flex: "1 1 160px" }} />
          <input aria-label="Link" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" style={{ ...input, flex: "2 1 220px" }}
            onKeyDown={e => { if (e.key === "Enter") add(); }} />
          <button className="ca-focus" onClick={add} disabled={!url.trim()}
            style={{ minHeight: TAP, padding: "0 18px", borderRadius: 10, border: "none", background: "var(--ca-accent)", color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: url.trim() ? "pointer" : "default", opacity: url.trim() ? 1 : .5 }}>
            Pin link
          </button>
        </div>
      ) : null}
    </section>
  );
}

// ─── Class ───

const rosterOf = (config, data) => data?.students || config.students || [];

export function ClassSummary({ config, data }) {
  const students = rosterOf(config, data);
  const shown = students.slice(0, 6);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex" }}>
        {shown.map((s, i) => (
          <div key={s.name} style={{ marginLeft: i === 0 ? 0 : -10 }}>
            <Avatar profile={profileOf(data, s.name)} name={s.name} accent={config.accent} size={34} />
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 600, fontSize: 16 }}>{students.length} students</div>
    </div>
  );
}

// Your card on the Class page: your own face and name.
export function YourCardSummary({ config, data, name }) {
  const p = profileOf(data, name);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar profile={p} name={name} accent={config.accent} size={44} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 16 }}>{name}</div>
        {[p.year, p.hometown].filter(Boolean).length ? <Muted>{[p.year, p.hometown].filter(Boolean).join(" · ")}</Muted> : null}
      </div>
    </div>
  );
}

// ─── Games ───

export function GamesSummary({ games = [] }) {
  const open = games.find(g => g.open);
  if (open) return <div style={{ fontWeight: 600, fontSize: 16 }}>{open.deck.title}</div>;
  const scored = games.filter(g => g.score);
  const last = scored[scored.length - 1];
  if (last) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{last.deck.title}</span>
        <span style={{ fontFamily: TOKENS.FONT.label, fontSize: 17, color: TEXT_PRIMARY }}>{last.score.right} / {last.score.answered}</span>
      </div>
    );
  }
  return <Muted>No games yet.</Muted>;
}

// ─── requests and bugs ───

export function RequestForm({ update, name }) {
  const [kind, setKind] = useState("request");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const send = () => {
    if (!text.trim()) return;
    update(prev => ({ ...prev, requests: [...(prev.requests || []), { id: genId(), ts: Date.now(), from: name || "", kind, text: text.trim() }] }));
    setText(""); setSent(true);
  };
  const pill = (on) => ({ minHeight: TAP, padding: "0 16px", borderRadius: 999, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
    border: "1px solid " + (on ? "var(--ca-accent)" : BORDER_STRONG), background: on ? "var(--ca-accent)" : "var(--surface-card)", color: on ? "#fff" : TEXT_SECONDARY });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={small}>Requests and bugs</span>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="ca-focus" aria-pressed={kind === "request"} onClick={() => setKind("request")} style={pill(kind === "request")}>Request</button>
        <button className="ca-focus" aria-pressed={kind === "bug"} onClick={() => setKind("bug")} style={pill(kind === "bug")}>Bug</button>
      </div>
      <textarea aria-label={kind === "bug" ? "Bug" : "Request"} value={text} onChange={e => { setText(e.target.value); setSent(false); }}
        style={{ fontFamily: F, fontSize: 16, minHeight: 96, padding: 12, borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "var(--surface-card)", color: TEXT_PRIMARY, lineHeight: 1.5, resize: "vertical" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ca-focus" onClick={send} disabled={!text.trim()}
          style={{ minHeight: TAP, padding: "0 20px", borderRadius: 10, border: "none", background: "var(--ca-accent)", color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: text.trim() ? "pointer" : "default", opacity: text.trim() ? 1 : .5 }}>
          Send
        </button>
        {sent ? <span style={{ fontSize: 15, fontWeight: 600, color: TOKENS.STATE.ok }}>Sent</span> : null}
      </div>
    </div>
  );
}

const when = (ts) => { try { return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };

export function RequestInbox({ data, update }) {
  const open = (data?.requests || []).filter(r => !r.done).slice().reverse();
  const done = (id) => update(prev => ({ ...prev, requests: (prev.requests || []).map(r => r.id === id ? { ...r, done: Date.now() } : r) }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={small}>Requests and bugs</span>
      {!open.length ? <Muted>Nothing waiting.</Muted> : open.map(r => (
        <div key={r.id} style={{ border: "1px solid " + BORDER, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 6, background: "var(--surface-card)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", fontSize: 13, color: TEXT_MUTED }}>
            <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.kind === "bug" ? "Bug" : "Request"}{r.from ? " · " + r.from : ""}</span>
            <span>{when(r.ts)}</span>
          </div>
          <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.text}</div>
          <button className="ca-focus" onClick={() => done(r.id)}
            style={{ alignSelf: "flex-start", minHeight: TAP, padding: "0 14px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "var(--surface-card)", color: TEXT_SECONDARY, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Done
          </button>
        </div>
      ))}
    </div>
  );
}

export const openRequests = (data) => (data?.requests || []).filter(r => !r.done).length;
