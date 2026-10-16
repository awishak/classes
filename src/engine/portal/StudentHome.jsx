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
import { localWorksheet, listedFor, openTo } from "../localWorksheets.js";
import { VISUAL_STORY_KEY } from "../visualstory/story.jsx";
import { assignmentsOf } from "../profileTask.js";
import { deadlineOf } from "../DueCard.jsx";
import { SITDOWN_CLASSES, SITDOWN, released, sessionOf, tableOf, sitdownAssignment, linkOf } from "../worktopia/sitdown.js";

// The door to Sit-Down 1, in the classes that hold one, from now until the
// last sit-down is over. Andrew, 2026-10-15: "how do students reach the
// sitdown page why is that not on the front page already?" The door says the
// student's day and time, whether their Scouting Report is in, and opens
// /<class>/sitdown. A student off the tables still gets the door.
const LAST_SITDOWN = new Date(2026, 9, 23, 23, 59, 59).getTime();
export function SitdownDoor({ config, data, name, now = Date.now() }) {
  if (!SITDOWN_CLASSES.includes(config.id) || now > LAST_SITDOWN) return null;
  const session = sessionOf(name);
  const me = session ? tableOf(session, data?.sitdownRoles || {}).find(p => p.roster === name || p.name === name) : null;
  const mine = me ? linkOf(data, me.roster, sitdownAssignment(data?.assignments || config.assignments)) : null;
  const when = session ? session.day + ", " + session.time + " AM, " + SITDOWN.room : "Your table and time are on the page.";
  const say = mine ? "Your Scouting Report is in." + (released(now) ? " Your table's reports are open." : "")
    : now > SITDOWN.prepDue ? "Your Scouting Report was due " + SITDOWN.prepDueText + "."
    : "Scouting Report due " + SITDOWN.prepDueText + ".";
  return (
    <a className="pt-door pt-focus" href={"/" + config.id + "/sitdown"}>
      <span className="pt-door-main">
        <span className="pt-door-name">{SITDOWN.title + ": " + when}</span>
        <span className="pt-door-say">{say}</span>
      </span>
      <span className="pt-door-go" aria-hidden="true">Open</span>
    </a>
  );
}

// The visual story's door on the home. Andrew, 2026-10-15: students should
// not have to go into the assignment to reach the builder, so a green box
// opens it straight away, from when the builder opens to the class until the
// story's due date, read from the assignment so a moved date follows.
export function StoryDoor({ config, data, now = Date.now() }) {
  const sheet = localWorksheet(VISUAL_STORY_KEY);
  if (!sheet || !listedFor(sheet, config.id) || !openTo(sheet, config.id, data, now)) return null;
  const asg = assignmentsOf(config, data).find(a => a.id === "visual");
  const end = asg ? deadlineOf(asg.due, asg.dueTime) : null;
  if (!end || now > end) return null;
  return (
    <a className="pt-door pt-focus" href={"/" + config.id + "/worksheets/" + VISUAL_STORY_KEY}>
      <span className="pt-door-main">
        <span className="pt-door-name">Work on your visual story</span>
        <span className="pt-door-say">Due {dueWords(asg.due, asg.dueTime)}. Your work saves as you go.</span>
      </span>
      <span className="pt-door-go" aria-hidden="true">Open</span>
    </a>
  );
}

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
      <SitdownDoor config={config} data={data} name={name} />
      <StoryDoor config={config} data={data} />
      <style>{DOOR_CSS}</style>
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

const DOOR_CSS = `
.pt-door{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:16px;background:var(--pt-done);color:var(--pt-done-ink);text-decoration:none;box-shadow:0 0 0 1.5px var(--pt-done-ink)}
.pt-door:hover{filter:brightness(.97)}
.pt-door-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.pt-door-name{font-size:19px;font-weight:700;line-height:1.25}
.pt-door-say{font-size:14.5px;line-height:1.4;opacity:.9}
.pt-door-go{flex:none;font-size:14px;font-weight:700;padding:8px 16px;border-radius:999px;background:var(--pt-done-ink);color:var(--pt-done)}
`;

export { Row, dueWords };
