// The student's home, top to bottom: the pinned link as a notice bar, the
// next class as the filled card, what is new, My work with only the next
// challenge, Questions, Dr. Ishak.
//
// What is new is what has happened since the student last looked: a grade
// they have not opened, a message from Dr. Ishak they have not read. When
// nothing is new the section is not drawn, and the next class comes first.

import { useState } from "react";
import { nextClassFacts, nextMeeting } from "../HomeCards.jsx";
import { isAway, idFor } from "../attendance.js";
import { kindOf } from "../dayplan.js";
import { daySlug } from "../days.js";
import { unreadNotes } from "../YouCard.jsx";
import { unseenGrades } from "../grades.js";
import { Sec, Row, Io, Btn, Chip, DrFace, I, dueWords, whenWords } from "./bits.jsx";
import { nextOwedOf } from "./work.js";
import { WorkRow } from "./MyWork.jsx";
import { QuestionsSection } from "./Questions.jsx";
import { DrCard, DrSheet } from "./ClassPage.jsx";

// The week the class is in: its number and its first and last class day.
export function weekWords(config, data) {
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const next = nextMeeting(config, data);
  const i = next ? weeks.indexOf(next.week) : -1;
  const dates = next ? (next.week.dates || []) : [];
  const range = dates.length ? dates[0] + (dates.length > 1 ? " to " + dates[dates.length - 1] : "") : "";
  return { n: i >= 0 ? i + 1 : 0, range, topic: next?.week?.topic || "" };
}

export function PinBar({ data, go }) {
  const pins = data?.pins || [];
  const pin = pins[pins.length - 1];
  if (!pin) return null;
  return (
    <div className="pt-notice">
      {I.pin()}
      <span className="txt"><b>Pinned</b> {pin.title || pin.url}</span>
      <Io kind="go" href={pin.url}>Open</Io>
    </div>
  );
}

// The next class, filled in the class colour.
export function Hero({ config, data, blockOf, section, me, mark, go, instructor, children }) {
  const facts = nextClassFacts(config, data, blockOf, section);
  if (!facts) {
    return (
      <div className="pt-hero" aria-label="Next class">
        <span className="pt-eyebrow">Next class</span>
        <div className="pt-heroWhat">No classes scheduled.</div>
      </div>
    );
  }
  const myId = me ? idFor(config, data, me) : "";
  const meets = kindOf((data?.dayPlans || {})[facts.date]) === "class";
  const readings = facts.readings.length > 3 ? "Readings" : facts.readings.length === 1 ? "1 reading" : facts.readings.length ? facts.readings.length + " readings" : "";
  return (
    <div className="pt-hero" aria-label="Next class">
      <div className="pt-head">
        <span className="pt-eyebrow">Next class {section ? <span className="pt-heroPill">{section}</span> : null}</span>
        <span className="pt-heroPill">{config.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className="pt-heroDate">{facts.weekday}, {facts.longDate}</div>
        {facts.title ? <div className="pt-heroWhat">{facts.title}</div> : null}
      </div>
      {!instructor && facts.note ? <div className="pt-heroNote">{facts.note}</div> : null}
      {children}
      {!instructor && meets && myId && mark ? (
        <Coming checked={!isAway(data, facts.date, myId)} onChange={(coming) => mark(facts.date, myId, !coming)} />
      ) : null}
      {instructor ? (
        <div style={{ display: "flex", gap: 8 }}>
          <Btn kind="light" href={config.path + "/dashboard"}>Open dashboard</Btn>
          <Btn kind="glass" href={config.path + "/today"}>Room screen</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          {readings ? <Btn kind="light" onClick={() => go("schedule/" + daySlug(facts.date))}>{readings}</Btn> : null}
          <Btn kind={readings ? "glass" : "light"} onClick={() => go("schedule")}>Schedule</Btn>
        </div>
      )}
    </div>
  );
}

// I'll be there, in white on the hero. The same promise ComingBox makes on
// the schedule: the box answers at once and settles when the mark lands.
function Coming({ checked, onChange }) {
  const [want, setWant] = useState(null);
  const shown = want === null ? checked : want;
  const press = async (v) => { setWant(v); try { await onChange(v); } finally { setWant(null); } };
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, minHeight: 44, fontSize: 16, fontWeight: 600, color: "#fff", cursor: "pointer" }}>
      <input type="checkbox" checked={shown} onChange={e => press(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#fff", cursor: "pointer" }} />
      I'll be there
    </label>
  );
}

export function StudentHome({ config, data, update, blockOf, section, name, mark, go, notice }) {
  const [more, setMore] = useState(false);
  const owed = nextOwedOf(config, data, name);
  const unseen = unseenGrades(config, data, name);
  const unread = unreadNotes(data, name);
  const fresh = [];
  unseen.forEach(u => fresh.push(
    <div key={"g-" + u.aid} className="pt-row done right">
      <div className="pt-dcol"><DrFace config={config} /></div>
      <div className="pt-side"><Io kind="go" onClick={() => go("assignments/" + u.aid)}>Open</Io></div>
      <div className="pt-main">
        <p className="pt-title say">Your <b>{u.title}</b> submission has been graded</p>
        <p className="pt-when done"><span>{u.letter}</span></p>
        <p className="pt-meta"><span>{whenWords(u.gradedAt)}</span></p>
      </div>
    </div>
  ));
  if (unread) fresh.push(
    <div key="m" className="pt-row dr right">
      <div className="pt-dcol"><DrFace config={config} /></div>
      <div className="pt-side"><Io kind="go" onClick={() => go("messages")}>Open</Io></div>
      <div className="pt-main">
        <p className="pt-title say">{unread === 1 ? "A message from " : unread + " messages from "}<b>{config.instructor?.name || "your instructor"}</b></p>
      </div>
    </div>
  );
  if (notice) fresh.push(
    <div key="n" className="pt-row dr right">
      <div className="pt-dcol"><DrFace config={config} /></div>
      <div className="pt-main">
        <p className="pt-title say">Note to the class</p>
        <p className="pt-text">{notice}</p>
      </div>
    </div>
  );
  return (
    <div className="pt-body">
      <PinBar data={data} go={go} />
      <Hero config={config} data={data} blockOf={blockOf} section={section} me={name} mark={mark} go={go} />
      {fresh.length ? <div className="pt-day"><Sec name="New" sub="Today" /><div className="pt-stack">{fresh}</div></div> : null}
      <div className="pt-day">
        <Sec name={<button type="button" className="pt-focus" onClick={() => go("assignments")} style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}>My work</button>}
          sub={owed ? "Next up" : ""} right={<Chip onClick={() => go("performance")}>My performance</Chip>} />
        <div className="pt-stack">
          {owed ? <WorkRow asg={owed.asg} st={owed.st} ring onOpen={() => go("assignments/" + owed.asg.id)} />
            : <p className="pt-quiet">Nothing is waiting on you.</p>}
        </div>
      </div>
      <QuestionsSection config={config} name={name} profiles={data?.profiles} go={go} />
      <div className="pt-day">
        <Sec name={config.instructor?.name ? "Dr. " + String(config.instructor.name).trim().split(/\s+/).pop() : "Your instructor"} />
        <div className="pt-stack"><DrCard config={config} go={go} onMore={() => setMore(true)} /></div>
      </div>
      {more ? <DrSheet config={config} go={go} onClose={() => setMore(false)} /> : null}
      <p className="pt-quiet" style={{ textAlign: "center" }}>{config.code} · {config.name}</p>
    </div>
  );
}

export { Row, dueWords };
