// The schedule in the row language. A week is a section: its topic as the
// name, its number and dates beside it, Andrew's words for the week under
// that. Each day of the week is a row with the date column, the day's own
// title, the readings on the sunk surface inside it (three, then all of
// them), what is due that day in amber, and I'll be there at the right on a
// day the class meets. The next class wears the ring.

import { useState, useEffect } from "react";
import { daysOfWeek, studentItems, sourceOf, inWeekOrder, dayAnchor, dayHeading } from "../ScheduleCard.jsx";
import { dayTitles, daySlug } from "../days.js";
import { kindOf } from "../dayplan.js";
import { isAway, idFor, awayIds } from "../attendance.js";
import { AwayList } from "../Attendance.jsx";
import { nextMeeting } from "../HomeCards.jsx";
import { Sec, Chip, Io, I, dcolOf } from "./bits.jsx";

const parseDate = (s) => { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d : null; };
const isFinals = (w) => /\bfinals\b/i.test(w.topic || "");
const weekTag = (w, i) => isFinals(w) ? "Finals Week" : "Week " + (i + 1);
const rangeOf = (w) => { const d = w.dates || []; return d.length ? d[0] + (d.length > 1 ? " to " + d[d.length - 1] : "") : ""; };
const today = () => { const t = new Date(Date.now()); return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime(); };

// I'll be there, as the row's own button: a green check while coming, an
// outline once the student has said no.
function Coming({ checked, onChange }) {
  const [want, setWant] = useState(null);
  const shown = want === null ? checked : want;
  const press = async () => { const v = !shown; setWant(v); try { await onChange(v); } finally { setWant(null); } };
  return (
    <button type="button" className={"pt-io pt-focus" + (shown ? " ok" : "")} onClick={press} role="checkbox" aria-checked={shown}
      aria-label={shown ? "I'll be there" : "I will not be there"} title={shown ? "I'll be there" : "I will not be there"}
      style={shown ? undefined : { width: 36, padding: 0, borderRadius: 999 }}>
      {I.check()}
    </button>
  );
}

// A reading on the sunk surface: the title, where it came from under it.
function ReadingChip({ item, block, href }) {
  const url = href || item.url || block?.url || "";
  const source = href ? "" : sourceOf(item, block);
  const inner = (
    <>
      <span style={{ display: "block", fontSize: 15, lineHeight: 1.35, color: "var(--text-primary)" }}>{item.title}</span>
      {source ? <span style={{ display: "block", fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{source}</span> : null}
    </>
  );
  const seat = { display: "block", background: "var(--surface-sunk)", borderRadius: 10, padding: "10px 12px", textDecoration: "none", overflowWrap: "anywhere", minWidth: 0 };
  return url
    ? <a className="pt-focus" href={url} style={seat} {...(href ? {} : { target: "_blank", rel: "noreferrer" })}>{inner}</a>
    : <div style={seat}>{inner}</div>;
}

function DayRow({ config, data, blockOf, day, title, ring, note, instructor, myId, mark, go }) {
  const [all, setAll] = useState(false);
  const items = inWeekOrder(day.items || []);
  const readings = items.filter(it => it.type === "reading");
  const due = items.filter(it => it.type === "assignment");
  const other = items.filter(it => it.type !== "reading" && it.type !== "assignment");
  const shown = all ? readings : readings.slice(0, 3);
  const meets = day.classDay && kindOf((data?.dayPlans || {})[day.date]) === "class";
  const side = !instructor && meets && myId && mark
    ? <Coming checked={!isAway(data, day.date, myId)} onChange={(coming) => mark(day.date, myId, !coming)} />
    : null;
  const tint = !day.classDay ? "off" : "";
  return (
    <div id={dayAnchor(day.date)} className={"pt-row " + tint + (ring ? " ring" : "")} style={{ alignItems: "flex-start", scrollMarginTop: 130 }}>
      <div className="pt-dcol"><span className="pt-dw">{dcolOf(day.date)[0]}</span><span className="pt-dn">{dcolOf(day.date)[1]}</span></div>
      <div className="pt-main">
        <p className="pt-title">{title || dayHeading(day.date)}</p>
        <p className="pt-meta">
          {title ? <span>{dayHeading(day.date)}</span> : null}
          {ring ? <span style={{ color: "var(--ca-accent-ink)", fontWeight: 600 }}>Next class</span> : null}
          {!day.classDay ? <span>No class</span> : null}
        </p>
        {note ? <p className="pt-text" style={{ borderLeft: "3px solid var(--line-strong)", paddingLeft: 10 }}>{note}</p> : null}
        {shown.length ? (
          <div className="pt-stack" style={{ gap: 6, marginTop: 4 }}>
            {shown.map(it => <ReadingChip key={it.id} item={it} block={blockOf ? blockOf(it.blockId || it.libId) : null} />)}
            {readings.length > 3 && !all ? <div><Chip onClick={() => setAll(true)}>All {readings.length} readings</Chip></div> : null}
          </div>
        ) : null}
        {other.map(it => <p key={it.id} className="pt-meta" style={{ color: "var(--text-primary)" }}>{it.title}</p>)}
        {due.map(it => (
          <div key={it.id} className="pt-acts">
            <Io kind="go" onClick={() => it.asgId && go && go("assignments/" + it.asgId)}>{it.title.replace(/\s+due$/i, "")}</Io>
            <span className="pt-when due" style={{ fontSize: 14 }}>Due</span>
          </div>
        ))}
        {instructor && meets && awayIds(data, day.date).length ? <AwayList config={config} data={data} date={day.date} /> : null}
      </div>
      {side ? <div className="pt-side">{side}</div> : null}
    </div>
  );
}

export function SchedulePage({ config, data, blockOf, focusDay, instructor, me, mark, go }) {
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const titles = dayTitles(weeks, data?.dayPlans || {});
  const myId = me ? idFor(config, data, me) : "";
  const next = nextMeeting(config, data);
  const t0 = today();
  // The week the class is in, lit on the chips and scrolled to on arrival.
  const nowIdx = weeks.findIndex(w => (w.dates || []).some(d => { const t = parseDate(d)?.getTime() || 0; return t >= t0 - 6 * 86400000 && t <= t0 + 6 * 86400000; }));
  useEffect(() => {
    const id = focusDay ? dayAnchor(focusDay.replace(/-/g, " ").replace(/^(\w)/, c => c.toUpperCase())) : nowIdx >= 0 ? "wk-" + (weeks[nowIdx].id || nowIdx) : "";
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusDay]);   // eslint-disable-line react-hooks/exhaustive-deps
  const jump = (i) => { const el = document.getElementById("wk-" + (weeks[i].id || i)); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <div className="pt-body">
      {/* Andrew's words, unedited. */}
      <p className="pt-quiet" style={{ fontSize: 15, maxWidth: "62ch" }}>
        The best way for me to ensure this class is as useful for you as possible is for us both to be flexible.
        Therefore, this schedule and list of assignments are subject to change in all sorts of ways. I'll make sure
        to keep you in the loop on important changes.
      </p>
      {weeks.length > 1 ? (
        <div className="pt-chips">
          {weeks.map((w, i) => <Chip key={w.id || i} on={i === nowIdx} onClick={() => jump(i)}>{isFinals(w) ? "Finals" : String(i + 1)}</Chip>)}
        </div>
      ) : null}
      {weeks.map((w, wi) => {
        const { days, loose } = daysOfWeek(w, studentItems(w, data?.dayPlans, blockOf));
        return (
          <div key={w.id || wi} id={"wk-" + (w.id || wi)} className="pt-day" style={{ scrollMarginTop: 130 }}>
            <Sec name={w.topic || weekTag(w, wi)} sub={weekTag(w, wi) + (rangeOf(w) ? " · " + rangeOf(w) : "")} />
            {w.text ? <p className="pt-quiet" style={{ fontSize: 15, whiteSpace: "pre-wrap" }}>{w.text}</p> : null}
            <div className="pt-stack">
              {loose.length ? (
                <div className="pt-row"><div className="pt-main"><div className="pt-stack" style={{ gap: 6 }}>
                  {inWeekOrder(loose).map(it => <ReadingChip key={it.id} item={it} block={blockOf ? blockOf(it.blockId || it.libId) : null}
                    href={it.type === "assignment" && it.asgId ? config.path + "/challenges/" + encodeURIComponent(it.asgId) : ""} />)}
                </div></div></div>
              ) : null}
              {days.map(d => {
                const t = titles[d.date];
                return <DayRow key={d.date} config={config} data={data} blockOf={blockOf} day={d}
                  title={t?.title && !t.fromWeek ? t.title : ""} note={String((data?.dayPlans || {})[d.date]?.studentNote || "").trim()}
                  ring={!!next && next.date === d.date} instructor={instructor} myId={myId} mark={mark} go={go} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { daySlug };
