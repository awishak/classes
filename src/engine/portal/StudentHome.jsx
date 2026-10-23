// The student's home, top to bottom: the pinned link as a notice bar, the
// next class as the filled card, what is new, My work with only the next
// challenge, Questions, Dr. Ishak.
//
// What is new is what has happened since the student last looked: a grade
// they have not opened, a message from Dr. Ishak they have not read. When
// nothing is new the section is not drawn, and the next class comes first.

import { useState } from "react";
import { nextClassFacts, nextMeeting, followingClassFacts } from "../HomeCards.jsx";
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
import { StoriesRow, useStoriesStage, storiesHref, STORIES_CLASSES } from "../visualstory/door.jsx";
import { portalHref } from "../visualstory/portal.jsx";
import { PreRow } from "../visualstory/prerow.jsx";
import { TEAM_TOPICS_KEY, topicsHref } from "../teamtopics/sheet.jsx";
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
  const when = session ? session.day + ", " + session.time + " AM, " + SITDOWN.room : "Your group and time are on the page.";
  const say = mine ? "Your Scouting Report is in." + (released(now) ? " Your group's reports are open." : "")
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

// Monday's link, bright and green at the top of the home. Andrew,
// 2026-10-23: "The link needs to be very like prominent, kind of the way like
// we pin a link, but make it nice and bright and green in terms of, hey,
// here's where you go." Reading opens the stories; released opens the portal,
// where the comments on the student's own story are; closed says Tuesday.
export function StoryPhaseBar({ config }) {
  const stage = useStoriesStage(config);
  const w = stage === "reading" ? { name: "Read and comment on your classmates' stories", say: "We don't have class on Monday. View and comment on at least 8 other students' stories.", href: storiesHref(config) }
    : stage === "released" ? { name: "Your classmates' comments are in", say: "See what people think of your work, by reviewer or by question.", href: portalHref(config) + "#comments" }
    : stage === "closed" ? { name: "Comments are closed", say: "The comments on your story, with names attached, come out on Tuesday.", href: portalHref(config) }
    : null;
  if (!w) return null;
  return (
    <a className="pt-gobar pt-focus" href={w.href}>
      <span className="pt-gobar-main">
        <span className="pt-gobar-name">{w.name}</span>
        <span className="pt-gobar-say">{w.say}</span>
      </span>
      <span className="pt-gobar-go" aria-hidden="true">Open</span>
    </a>
  );
}

// The door to the COMM 118 topics worksheet, from when the sheet opens until
// Wednesday's class is over. Andrew, 2026-10-23: "I want you putting things
// in a place where it's really clear."
const TOPICS_LAST = new Date(2026, 9, 28, 23, 59, 59).getTime();
export function TopicsDoor({ config, data, now = Date.now() }) {
  const sheet = localWorksheet(TEAM_TOPICS_KEY);
  if (!sheet || !listedFor(sheet, config.id) || !openTo(sheet, config.id, data, now) || now > TOPICS_LAST) return null;
  return (
    <a className="pt-door pt-focus" href={topicsHref(config.id)}>
      <span className="pt-door-main">
        <span className="pt-door-name">Five concepts from the Ishak chapters</span>
        <span className="pt-door-say">Read either chapter, choose five concepts, and for each note something you noticed, something you think, and something you wonder about. Due end of day Tuesday, October 27.</span>
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
  const kind = kindOf((data?.dayPlans || {})[facts.date]);
  const meets = kind === "class";
  // A day the class does not meet says so, and says what the next class day
  // holds: its title and its readings. Andrew, 2026-10-23: "no class, please
  // read for Wednesday, and you can have the links to the readings."
  const off = kind === "off";
  const after = off ? followingClassFacts(config, data, blockOf, section, facts.date) : null;
  const afterReadings = after ? (after.readings.length > 3 ? "Readings" : after.readings.length === 1 ? "1 reading" : after.readings.length ? after.readings.length + " readings" : "") : "";
  const readings = facts.readings.length > 3 ? "Readings" : facts.readings.length === 1 ? "1 reading" : facts.readings.length ? facts.readings.length + " readings" : "";
  return (
    <div className="pt-hero" aria-label={off ? "No class" : "Next class"}>
      <div className="pt-head">
        <span className="pt-eyebrow">{off ? "No class" : "Next class"} {section ? <span className="pt-heroPill">{section}</span> : null}</span>
        <span className="pt-heroPill">{config.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div className="pt-heroDate">{facts.weekday}, {facts.longDate}</div>
        {facts.title ? <div className="pt-heroWhat">{facts.title}</div> : null}
      </div>
      {!instructor && facts.note ? <div className="pt-heroNote">{facts.note}</div> : null}
      {off && after ? (
        <div className="pt-heroThen">
          <span className="pt-eyebrow">Next class</span>
          {/* The readings are a button below, not a list here. Andrew,
              2026-10-23, on a card with eight titles in it: "this is bad for
              comm 118. have a link that takes them to the list of readings." */}
          <div className="pt-heroWhat">{after.weekday}, {after.longDate}{after.title ? ": " + after.title : ""}</div>
        </div>
      ) : null}
      {children}
      {!instructor && meets && myId && mark ? (
        <Coming checked={!isAway(data, facts.date, myId)} onChange={(coming) => mark(facts.date, myId, !coming)} />
      ) : null}
      {instructor ? (
        <div style={{ display: "flex", gap: 8 }}>
          <Btn kind="light" href={config.path + "/dashboard"}>Open dashboard</Btn>
          <Btn kind="glass" href={config.path + "/today"}>Room screen</Btn>
        </div>
      ) : off ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STORIES_CLASSES.includes(config.id) ? <Btn kind="light" href={storiesHref(config)}>Read your classmates' stories</Btn> : null}
          {localWorksheet(TEAM_TOPICS_KEY) && listedFor(localWorksheet(TEAM_TOPICS_KEY), config.id) && openTo(localWorksheet(TEAM_TOPICS_KEY), config.id, data) ? <Btn kind="light" href={topicsHref(config.id)}>Concepts worksheet</Btn> : null}
          {after && afterReadings ? <Btn kind="glass" onClick={() => go("schedule/" + daySlug(after.date))}>{afterReadings + " for " + after.weekday}</Btn> : null}
          <Btn kind="glass" onClick={() => go("schedule")}>Schedule</Btn>
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
      <style>{DOOR_CSS}</style>
      <StoryPhaseBar config={config} />
      <PinBar data={data} go={go} />
      <SitdownDoor config={config} data={data} name={name} />
      <StoryDoor config={config} data={data} />
      <TopicsDoor config={config} data={data} />
      <Hero config={config} data={data} blockOf={blockOf} section={section} me={name} mark={mark} go={go} />
      {fresh.length ? <div className="pt-day"><Sec name="New" sub="Today" /><div className="pt-stack">{fresh}</div></div> : null}
      <div className="pt-day">
        <Sec name={<button type="button" className="pt-focus" onClick={() => go("assignments")} style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}>My work</button>}
          sub={owed ? "Next up" : ""} right={<Chip onClick={() => go("performance")}>My performance</Chip>} />
        <div className="pt-stack">
          <PreRow config={config} />
          <StoriesRow config={config} />
          {owed ? <WorkRow asg={owed.asg} st={owed.st} ring config={config} onOpen={() => go("assignments/" + owed.asg.id)} />
            : <p className="pt-quiet">Nothing is waiting on you.</p>}
          {/* Andrew, 2026-10-19: "make it easy for them to get to their assignments." The heading was the only way in, and it did not look like one. */}
          <div className="pt-acts"><Btn onClick={() => go("assignments")}>All my work</Btn></div>
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
.pt-gobar{display:flex;align-items:center;gap:14px;padding:18px 20px;border-radius:16px;background:#15803d;color:#fff;text-decoration:none;box-shadow:0 14px 36px -18px rgba(21,128,61,.8)}
.pt-gobar:hover{filter:brightness(1.05)}
.pt-gobar-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.pt-gobar-name{font-size:20px;font-weight:700;line-height:1.25}
.pt-gobar-say{font-size:15px;line-height:1.4;opacity:.95}
.pt-gobar-go{flex:none;font-size:15px;font-weight:700;padding:10px 18px;border-radius:999px;background:#fff;color:#15803d}
.pt-heroThen{border-top:1px solid rgba(255,255,255,.28);padding-top:12px;display:flex;flex-direction:column;gap:6px}
`;

export { Row, dueWords };
