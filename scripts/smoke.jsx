// Render every surface once, on the server, and fail if any of them throws.
//
// check-refs catches a JSX component used with no definition. It cannot catch a
// plain variable, because it works on `<Foo` and nothing else. That gap has now
// cost two crashes: the room screen's idle board on 23 August, and Class Flow
// today, both from a name that was legal JavaScript right up until it ran.
//
// Actually rendering the thing catches both, and every other reference error
// that only exists at runtime. No new dependency: react-dom is already here.
//
// Run with `npm run smoke`. The build runs it too.

import "./smoke-globals.js";
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import Dashboard, {
  FlowPanel, TodoPanel, NowPanel, ScratchPanel, AttendancePanel, QuestionsPanel,
  BoardsPanel, StockedPanel, AssignmentsPanel, CommandBar, Readings, IdeasPanel,
  ColorsSheet, NoteSheet, ShortcutSheet, Reminders,
} from "../src/engine/Dashboard.jsx";
import ClassroomView, { Content as CastContent } from "../src/engine/ClassroomView.jsx";
import { Castable } from "../src/engine/Dashboard.jsx";
import { mediaSteps, liveStep, mediaKind } from "../src/engine/media.js";
import { pathFor } from "../api/upload.js";
import { baseCSS } from "../src/engine/themes.js";
import RosterSheet from "../src/engine/RosterSheet.jsx";
import LoginPage from "../src/LoginPage.jsx";
import { whereTo, studentFor } from "../src/engine/session.js";
import { parseRoster, mergeRoster } from "../src/engine/roster.js";
import { makeCode, looksLikeEmail } from "../api/logins.js";
import ClassApp, { OnScreenNow } from "../src/engine/ClassApp.jsx";
import BoardPage from "../src/engine/BoardPage.jsx";
import GamePage, { RunGamePage } from "../src/engine/GamePage.jsx";
import { GameAdmin, StudentAnswerView, TriviaPlayer, TriviaPresenter, Accolades, ReboundPanel } from "../src/engine/GameSystem.jsx";
import { DayPlanSummary, DayPlanDetail, rowsOf, countRows } from "../src/engine/DayPlanCard.jsx";
import { FREEFORM } from "../src/engine/dayplan.js";
import { weekdayOf } from "../src/engine/schedule.js";
import { sittingsOf, minutesLeft, sittingLength } from "../src/engine/meets.js";
import { THEMES, THEME, THEME_LABELS, themeCSS, varsOf, fontHref, hasNight } from "../src/engine/themes.js";
import { ThemePicker, DayNightPicker } from "../src/engine/ThemeShell.jsx";
import { Tubey, TubeySays, ThemeTopper, ThemeSponsor, ThemeLegal, ThemeBadge, TubeyPeek, ThemeStickers,
  StoryBar, ThemeIdentity, ThemeCamera, ClassLeader, Avatar, StatusMark, cardStyle, CHROME_CSS,
  MARQUEE_SECONDS_PER_ITEM, marqueeSeconds } from "../src/engine/ThemeChrome.jsx";
import { ALL_FACTS, factsFor, shuffledFacts } from "../src/engine/crashing-facts.js";
import { saveWeek, openWeek, answerWeek, scoreWeek, scoresFor, perfectRuns, pointsOf, mergeAnswers } from "../src/engine/game.js";
import { idOf, slugOf, withIds } from "../src/engine/roster.js";
import comm999 from "../src/config/comm999.js";
import RepoPage, { Row as RepoRow, Detail as RepoDetail, Place as RepoPlace,
  TypeSheet as RepoType, Views as RepoViews, Bulk as RepoBulk, Health as RepoHealth,
  Steps as RepoSteps, Sticker as RepoSticker, Term as RepoTerm, DayAdd as RepoDayAdd,
  Toggle as RepoToggle } from "../src/engine/RepoPage.jsx";
import { FLAGS, healthCounts, carries, allClear } from "../src/engine/health.js";
import { remember, undoPatches, pushEntry, sayEntry, LIMIT } from "../src/engine/undo.js";
import { Seeds as RepoSeeds, Room as RepoRoom, BlockTypes as RepoTypes } from "../src/engine/RepoMore.jsx";
import { termOf, termCounts, nearestDay } from "../src/engine/term.js";
import QuestionPicker from "../src/engine/QuestionPicker.jsx";
import PickMark, { PICK_LABEL } from "../src/engine/Pick.jsx";
import { bankOf, questionOf, parseOptions, parseAnswer, searchBank, isReady, asChoice, asFree }
  from "../src/engine/qbank.js";
import { readTypes, readAdded, addType, renameType, resetName, dropType, idForLabel, orphanTypes }
  from "../src/engine/types.js";
import { registerTypes, typeOf, allTypes } from "../src/engine/blocks.js";
import { colorOfType, writeTypeColor } from "../src/engine/colors.js";
import { readFilters, filterQuery, isStep, viewWords, readViews, saveView, dropView, viewFor, BLANK }
  from "../src/engine/views.js";
import { tagPatches, typePatches, sharePatches, wouldShare, tagsAcross } from "../src/engine/bulk.js";
import { parseSeeds, seedPatch, newSeeds } from "../src/engine/seeds.js";
import { roomItems, roomCounts, blockFromRoom, stampOf } from "../src/engine/room.js";
import { archived, pastPolls, worthKeeping } from "../src/engine/poll.js";
import { SEEDS } from "../src/config/seed-library.js";
import RepoIdeas, { Idea } from "../src/engine/RepoIdeas.jsx";
import { Duplicates, LooseEnds, Tags, Links } from "../src/engine/RepoTidy.jsx";
import { tagIndex, lookalikes, retagPatches, normTag } from "../src/engine/tags.js";
import { linkables, verdict, linkPatches } from "../src/engine/links.js";
import { findDuplicates, findLooseEnds, applyMerge } from "../src/engine/tidy.js";
import AskPage from "../src/engine/AskPage.jsx";
import PlanPage from "../src/PlanPage.jsx";
import RetreatPage from "../src/RetreatPage.jsx";
import InstructorLinks from "../src/InstructorLinks.jsx";
import { ENGINE_LIST } from "../src/config/registry.js";
import { warmClassData } from "../src/engine/store.js";
import GradeView from "../src/engine/GradeView.jsx";
import GradeDeck from "../src/engine/GradeDeck.jsx";
import DueDeck, { dueSoon, dismissDue, deadlineOf } from "../src/engine/DueCard.jsx";
import { NextClassHero, nextClassFacts, timeText, PinnedLinks, RequestForm, InstructorProfile } from "../src/engine/HomeCards.jsx";
import { instructorOf } from "../src/instructors.js";
import TopNav, { NAV_CLASS, activeFor } from "../src/engine/TopNav.jsx";
import HornApp from "../src/engine/HornApp.jsx";
import { assignmentsOf } from "../src/engine/profileTask.js";
import { YouDetail, MessagesDetail, MessagesSummary } from "../src/engine/YouCard.jsx";
import comm118Cfg from "../src/config/comm118.js";
import { AssignmentCards, AssignmentPage, statusOf, inDueOrder, feedOf } from "../src/engine/AssignmentCards.jsx";
import { appsFor } from "../src/engine/apps.js";
import InstructorBar from "../src/engine/InstructorBar.jsx";
import comm3Cfg from "../src/config/comm3.js";
import { bucketsFor, placeCard, writeCard, releasePatch, hidePatch, changedSinceRelease, releaseCounts, unseenGrades, markSeen, letterOf, BUCKETS } from "../src/engine/grades.js";
import GradeParade from "../src/engine/GradeParade.jsx";
import { computeGrade, dueText, AssignmentsSummary, waitingOn, waitingCount, appreciatePatch, deletePatch } from "../src/engine/AssignmentsCard.jsx";
import { sectionsOf, takeGroup, placeGroup, parseRange, sumRanges, rangeLabel, placeSection, splitSection, templateOf, applyTemplate } from "../src/engine/dayplan.js";
import { dayTitles } from "../src/engine/days.js";
import { normSlot as normSlotT } from "../src/engine/dayplan.js";
import Drawer, { SHELVES, shelfOf } from "../src/engine/Drawer.jsx";
import Slide, { slideOf } from "../src/engine/Slide.jsx";
import RoomSlide from "../src/engine/RoomSlide.jsx";
import { castFor } from "../src/engine/gameCast.js";
import GamesPage from "../src/engine/GamesPage.jsx";
import DayDoc from "../src/engine/DayDoc.jsx";
import { ScheduleDetail, studentItems, dateInWeek } from "../src/engine/ScheduleCard.jsx";
import TermOutline from "../src/engine/TermOutline.jsx";
import { SHARED_KEY } from "../src/engine/blocks.js";
import { DEFAULT_REPO_FONTS } from "../src/engine/fonts.js";

// Warm every class's store BEFORE anything renders, so <Dashboard/> gets past
// its loading gate and the body actually runs. Until now it did not: the whole
// component above the panels — layout, rails, counts, every derived value —
// was untested, and that is exactly where the crashes have come from.
//
// Two shapes per class, because an empty day and a full one take different
// paths through almost every one of those derived values.
const stocked = { day: [], week: [], any: [] };
// The ported classes keep their weeks in the store rather than in config, so
// a config-only warm gives them no schedule and the dashboard correctly shows
// "no sessions" — correct, and useless as a test. Every class gets a schedule
// here, its own where it has one.
const weeksOf = (cfg) => (cfg.scheduleWeeks?.length ? cfg.scheduleWeeks
  : [{ id: "w1", topic: "A week", dates: ["Sep 1", "Sep 3"], text: "", plan: "", slides: "", items: [] }]);
const dayOf = (cfg) => weeksOf(cfg)[0].dates[0];
const warmShapes = (cfg, full) => ({
  courseTitle: cfg.desc || "",
  schedule: weeksOf(cfg),
  library: cfg.library || [],
  assignments: cfg.assignments || [],
  students: cfg.students || [],
  stocked,
  blocks: full ? { wb1: { id: "wb1", type: "link", title: "A block", body: "b", url: "https://example.com",
    headline: "A headline.", children: [], tags: ["t"], concept: "c", source: "", refId: "",
    created: "2026-08-01", scheduled: [dayOf(cfg)] } } : {},
  dayPlans: full ? { [dayOf(cfg)]: {
    sequenceId: "motivated", notes: "a day note", slides: "https://docs.google.com/x", slidesClaim: "The deck.",
    done: [], boards: {},
    slots: { opener: { title: "Open", items: [
      { id: "i1", text: "A note", claim: "A claim.", links: [{ id: "l1", label: "Read", url: "https://example.com" }] },
      { id: "i2", blockId: "wb1" },
    ] } },
    blocks: [{ id: "b1", title: "A block", body: "body", links: [] }],
  } } : {},
  scratch: full ? { [dayOf(cfg)]: "scratch" } : {},
});

const cases = [];
for (const cfg of ENGINE_LIST) {
  warmClassData(SHARED_KEY, { blocks: {} });
  warmClassData(cfg.storageKey, warmShapes(cfg, false));
  cases.push([cfg.code + " dashboard, empty day", <Dashboard config={cfg} />, "dash-stage"]);
  cases.push([cfg.code + " room screen", <ClassroomView config={cfg} />]);
  cases.push([cfg.code + " class site", <ClassApp config={cfg} />]);
  cases.push([cfg.code + " class site, on a phone", atWidth(PHONE, () => <ClassApp config={cfg} />)]);
  cases.push([cfg.code + " ask page", <AskPage config={cfg} />]);
}
// and again with a day that has things on it
for (const cfg of ENGINE_LIST) {
  warmClassData(cfg.storageKey, warmShapes(cfg, true));
  cases.push([cfg.code + " dashboard, full day", <Dashboard config={cfg} />, "dash-stage"]);
}
// Rendering <Dashboard/> alone only reaches its loading screen, because the
// store load happens in an effect and effects do not run here. The panels are
// where the work is, so they get rendered with props directly — an empty day
// and a populated one, since today's crash only appeared on one of those.
const noop = () => {};
let failedEarly = 0;

// Render at a given viewport width.
//
// The globals set innerWidth to 1440 and never moved it, so every test in this
// file has only ever rendered the desktop layout. The class site has two: a
// desktop grid and a phone column, with their own headers and their own bottom
// bar. The phone one is what students actually use, and nothing rendered it
// until now. That is how the phone header kept four theme buttons, a badge and
// a role toggle for a day after the desktop header was tidied.
const PHONE = 390, LAPTOP = 1440;
function atWidth(px, fn) {
  const was = globalThis.innerWidth;
  globalThis.innerWidth = px;
  try { return fn(); } finally { globalThis.innerWidth = was; }
}
const seq = { id: "s", name: "Test", slots: [{ slot: "opener" }, { slot: "problem" }] };
const emptyPlan = { sequenceId: "s", slots: {}, blocks: [] };
const fullPlan = {
  sequenceId: "s", slides: "https://docs.google.com/x", slidesClaim: "The deck.",
  notes: "a day note",
  slots: { opener: { title: "Open", items: [{ id: "i1", text: "A note", claim: "A claim.", links: [{ id: "l1", label: "Read", url: "https://example.com" }] }] } },
  blocks: [{ id: "b1", title: "A block", body: "body", links: [] }],
};
const seeds = [{ id: "sd1", title: "A seed", concept: "x", body: "b", slots: ["opener"] }];
const loose = [{ id: "x1", type: "reading", title: "Unplanned reading", url: "https://example.com", loose: false }];

for (const [tag, plan] of [["empty day", emptyPlan], ["full day", fullPlan]]) {
  const cfg = ENGINE_LIST[0];
  cases.push(["Class Flow, " + tag, <FlowPanel plan={plan} seq={seq} seeds={seeds}
    castNow={noop} dismiss={noop} liveLabel={null} accent={cfg.accent} onClaim={noop}
    features={["Headlines"]} onFeature={noop} planHref="/x" onSlidesClaim={noop} onBlockClaim={noop}
    where="COMM 1 · Sep 1" loose={loose} onAddScheduled={noop} onAddItem={noop} onRemoveItem={noop}
    onMoveItem={noop} onSetSequence={noop} onSetSlotTitle={noop} sequences={[seq]} />]);
  cases.push(["To-Do, " + tag, <TodoPanel plan={plan} seq={seq} features={[]} boards={{}}
    assignments={cfg.assignments || []} shelves={{ day: [], week: [], any: [] }}
    students={cfg.students || []} data={{}} accent={cfg.accent} where="COMM 1 · Sep 1" loose={loose} />]);
  cases.push(["Now, " + tag, <NowPanel config={cfg} plan={plan} seq={seq} engagedAt={Date.now()} onEngaged={noop} onSlot={noop} />]);
  cases.push(["Notes, " + tag, <ScratchPanel value="" onSave={noop} dayNote={plan.notes}
    weekPlan="wp" weekText="wt" planHref="/x" schedHref="/y" accent={cfg.accent} day="Sep 1" />]);
}
const cfg0 = ENGINE_LIST[0];
cases.push(["Attendance", <AttendancePanel students={cfg0.students || []} marks={{}} onMark={noop} onReset={noop} />]);
cases.push(["Questions", <QuestionsPanel items={[{ id: "q", text: "why", who: "A", anon: false, at: Date.now(), state: "open" }]} setState={noop} archiveOpen={noop} castNow={noop} accent={cfg0.accent} />]);
cases.push(["Before & After", <BoardsPanel boards={{}} proposals={{ pre: { title: "t", ideas: ["a"] }, post: { title: "t", ideas: ["b"] } }} onSave={noop} castNow={noop} dismiss={noop} liveCast={null} accent={cfg0.accent} />]);
// A day with no proposals at all, which crashed the editor once the boards
// moved into the flow and started rendering on every day.
cases.push(["Before & After, no proposals", <BoardsPanel boards={{}} proposals={{}} onSave={noop}
  castNow={noop} dismiss={noop} liveCast={null} accent={cfg0.accent} />]);
cases.push(["Stocked", <StockedPanel shelves={{ day: [{ id: "s1", kind: "Link", title: "t", url: "https://e.com" }], week: [], any: [] }} onAdd={noop} onRemove={noop} onClaim={noop} castNow={noop} dismiss={noop} liveLabel={null} accent={cfg0.accent} />]);
// With a path, so the Grade link on each row renders; a wrong name in that
// link only ever throws once the link is drawn.
cases.push(["Assignments", <AssignmentsPanel assignments={cfg0.assignments?.length ? cfg0.assignments : [{ id: "x", title: "An assignment", due: "Sep 3", weight: 10 }]} castNow={noop} dismiss={noop} liveLabel={null} path={cfg0.path} />, "/grade?a="]);
// The rail panels, with a reading that has a long title and a URL — the shape
// that was rendering one word per line.
const longRead = [{ id: "r1", type: "reading", url: "https://www.nytimes.com/athletic/1/x/",
  title: "Cardinals-Cubs: Michael Busch Nearly Hits for the Cycle", claim: "" }];
cases.push(["Readings, long title", <Readings items={longRead} accent={cfg0.accent} castNow={noop}
  dismiss={noop} liveLabel={null} onAdd={noop} onRemove={noop} onClaim={noop} blocks={[]}
  onPickBlock={noop} onNote={noop} inFlow={new Set()} onDropIn={noop} blockOf={() => null} />, "read-src"]);
// A reading pointing at a block Andrew picked out wears the drawing, here and
// on the class site, because a recommendation nobody receives is not one.
cases.push(["Readings, a Drew's Pick", <Readings items={longRead} accent={cfg0.accent} castNow={noop}
  dismiss={noop} liveLabel={null} onAdd={noop} onRemove={noop} onClaim={noop} blocks={[]}
  onPickBlock={noop} onNote={noop} inFlow={new Set()} onDropIn={noop}
  blockOf={() => ({ id: "r1", pick: true })} />, "chef.png"]);
cases.push(["Readings, empty", <Readings items={[]} accent={cfg0.accent} castNow={noop}
  dismiss={noop} liveLabel={null} onAdd={noop} onRemove={noop} onClaim={noop} blocks={[]}
  onPickBlock={noop} onNote={noop} inFlow={new Set()} onDropIn={noop} blockOf={() => null} />]);
cases.push(["Readings, with my note", <Readings accent={cfg0.accent} castNow={noop} dismiss={noop}
  liveLabel={null} onAdd={noop} onRemove={noop} onClaim={noop} onNote={noop} blocks={[]}
  onPickBlock={noop} blockOf={() => null}
  items={[{ ...longRead[0], note: "Good on the money side. Pairs with week 4." }]} />, "read-card"]);
cases.push(["Ideas", <IdeasPanel blocks={[{ id: "b", type: "activity", title: "An idea", body: "How it runs",
  tags: ["teaching move"], children: [] }]} accent={cfg0.accent} sections={[]} days={[]} today="Sep 1"
  onPick={noop} onAdd={noop} onEdit={noop} onRemove={noop} onDuplicate={noop} />]);
// A seed is a story I can tell on any day and a move is something the room
// does on any day, so both live in the one panel and the chips say which.
cases.push(["Ideas, with seeds in it", <IdeasPanel blocks={[
  { id: "b", type: "activity", title: "Think, pair, share", body: "How it runs", tags: ["teaching move"], children: [] },
  { id: "s", type: "story", title: "Ira Glass and the gap", body: "The turn", tags: ["seed", "the gap"], children: [] },
  { id: "x", type: "link", title: "Not in the panel", tags: ["betting"], children: [] },
]} accent={cfg0.accent} sections={[]} days={[]} today="Sep 1"
  onPick={noop} onAdd={noop} onEdit={noop} onRemove={noop} onDuplicate={noop} />, "Seeds 1"]);
// Every sheet that opens over the screen. None of them was rendered here, and
// that is exactly how ColorsSheet shipped using an accent prop it never took:
// the build was green and the button threw the moment it was pressed.
cases.push(["Look sheet", <ColorsSheet colors={{}} fonts={{}} bold={false} accent={cfg0.accent}
  onPick={noop} onFont={noop} onBold={noop} onReset={noop} onClose={noop} />, "Column headings"]);
cases.push(["Look sheet, with choices", <ColorsSheet colors={{ readings: "purple-deep" }}
  fonts={{ cols: "fraunces", sections: "grotesk", rows: "georgia" }} bold accent={cfg0.accent}
  onPick={noop} onFont={noop} onBold={noop} onReset={noop} onClose={noop} />, "Fraunces"]);
cases.push(["Note sheet", <NoteSheet sections={[["opener", "The hook"]]} accent={cfg0.accent}
  sources={[{ from: "This day", body: "a note", onSave: noop }, { from: "The week", body: "", onSave: noop }]}
  onAdd={noop} onClose={noop} />, "A new item"]);
cases.push(["Shortcut sheet", <ShortcutSheet onClose={noop} />]);
cases.push(["Command bar", <CommandBar targets={[{ key: "k", group: "g", title: "t", run: noop }]} accent={cfg0.accent} onClose={noop} />]);

// The box at the top of the class page, one case per thing that can be on the
// projector, because each one produces a different door.
{
  const c0 = ENGINE_LIST[0];
  const NOW = [
    ["a discussion prompt", { type: "board", boardLabel: "Enter", idea: "What would you read more about?" }, null],
    ["an article", { type: "reading", title: "A reading", openUrl: "https://example.com", tag: "Reading" }, null],
    ["an assignment", { type: "reveal", title: "Media Diary", due: "Due Oct 9" }, null],
    ["a game", { type: "feature", title: "Team Trivia", body: "Teams and buzzers." }, null],
    ["headlines", { type: "headlines" }, null],
    ["a poll", null, { phase: "vote1", question: "Which one?" }],
    ["a quote", { type: "quote", tag: "The hook", title: "Rights fees are up." }, null],
  ];
  for (const [what, cast, poll] of NOW) {
    cases.push(["On the screen now, " + what,
      <OnScreenNow config={c0} live={cast ? { cast, at: 1 } : null} poll={poll} />, "On the screen now"]);
  }
}
// The one mark, at the two sizes it is drawn at: small on a row, and big
// enough to read from the back of a room.
cases.push(["Drew's Pick, on a row", <PickMark size={20} />, "chef.png"]);
// The words beside the drawing, so a student knows what the drawing means.
// Matched on the escaped form, because an apostrophe reaches the page as
// &#x27; and a case that never matches is a case that proves nothing.
cases.push(["Drew's Pick, on the wall", <PickMark size={80} label />, PICK_LABEL.replace("'", "&#x27;")]);
// ─── the Day Plan card, mirroring the dashboard ───
// The card used to understand seeds and typed snippets and nothing else, so a
// block placed from the repository drew an empty card. It reads the same
// sections the dashboard draws now, with whatever a row points at resolved.
{
  const cfgD = ENGINE_LIST[0];
  const dayDate = weeksOf(cfgD)[0].dates[0];
  const mirrorData = {
    schedule: weeksOf(cfgD),
    blocks: { mb1: { id: "mb1", type: "link", title: "Why We Bet", headline: "The house always knows.",
      url: "https://example.com/bet", pick: true } },
    dayPlans: { [dayDate]: { sequenceId: FREEFORM, done: ["i2"], notes: "Open on the headline.",
      slots: { "sec-1": { title: "The hook", items: [
        { id: "i1", blockId: "mb1" },
        { id: "i2", text: "A typed line", depth: 1 },
        { id: "i3", seedId: "sd1" },
      ] } } } },
    seeds: [{ id: "sd1", title: "A seed", body: "How the seed runs" }],
  };
  const blockOfM = (id) => mirrorData.blocks[id] || null;
  const plan = mirrorData.dayPlans[dayDate];
  const secs = rowsOf({ config: cfgD, data: mirrorData, plan, blockOf: blockOfM });
  if (secs.length !== 1) { console.error("  FAIL  day plan: " + secs.length + " sections out of one"); failedEarly++; }
  if (countRows(secs) !== 3) { console.error("  FAIL  day plan: " + countRows(secs) + " rows out of three"); failedEarly++; }
  const [r1, r2, r3] = secs[0].items;
  // A block row says what the block says, which is the whole point: the old
  // card rendered it with no title at all.
  if (r1.words !== "The house always knows.") { console.error("  FAIL  day plan: a block row says " + JSON.stringify(r1.words)); failedEarly++; }
  if (!r1.pick) { console.error("  FAIL  day plan: a picked block lost its sticker"); failedEarly++; }
  if (r1.kind !== "Article") { console.error("  FAIL  day plan: a block row is filed as " + r1.kind); failedEarly++; }
  if (r2.words !== "A typed line" || !r2.done || r2.depth !== 1) { console.error("  FAIL  day plan: a typed row came back wrong"); failedEarly++; }
  if (r3.words !== "A seed" || r3.body !== "How the seed runs") { console.error("  FAIL  day plan: a seed row came back wrong"); failedEarly++; }
  cases.push(["Day Plan card", <DayPlanDetail config={cfgD} data={mirrorData} blockOf={blockOfM} date={dayDate} />,
    "The house always knows."]);
  cases.push(["Day Plan card, a day with nothing on it", <DayPlanDetail config={cfgD}
    data={{ schedule: weeksOf(cfgD) }} blockOf={() => null} />, "Day Plan"]);
  cases.push(["Day Plan tile", <DayPlanSummary config={cfgD} data={mirrorData} blockOf={blockOfM} />, "Next class"]);
}
cases.push(["Discussion board", <BoardPage config={cfg0} />]);
cases.push(["Repository", <RepoPage />]);
// The page itself is behind a load, so a server render of the page stops at
// the loading line. The rows are the part that can throw, so they get rendered
// on their own, with the shape the index actually builds: a block, the class
// that owns the block, and everywhere the block turns up.
{
  const blk = {
    id: "b1", type: "link", title: "Why We Bet", headline: "The house always knows.",
    url: "https://example.com/bet", body: "How the odds get set.", tags: ["betting", "money", "media", "law"],
    concept: "Framing", source: "The Atlantic", created: "2026-08-01",
    owner: cfg0, target: cfg0.id,
    uses: [{ cls: cfg0, date: "Sep 23", section: "opener" }, { cls: cfg0, date: "Sep 25", section: "Assigned" }],
  };
  const bare = { ...blk, id: "b2", headline: "", owner: null, target: "shared", tags: [], uses: [] };
  const hue = () => "#0369a1";
  const planOf = (c, date) => ({ sequenceId: c.defaultSequenceId, slots: {}, blocks: [], slides: "", notes: "", date });
  const stores = { [cfg0.id]: {}, shared: {} };
  const table = (row) => <table><tbody>{row}</tbody></table>;
  cases.push(["Repository row", table(<RepoRow block={blk} hue={hue} open={false} onOpen={noop} onTag={noop}
    picked={false} onPick={noop} onStar={noop} />), "Why We Bet"]);
  cases.push(["Repository row, picked out", table(<RepoRow block={{ ...blk, pick: true }} hue={hue} open={false}
    onOpen={noop} onTag={noop} picked={false} onPick={noop} onStar={noop} />), "repo-sticker-on"]);
  cases.push(["The sticker, off", <RepoSticker on={false} onToggle={noop} />, "Pick"]);
  cases.push(["The sticker, on", <RepoSticker on onToggle={noop} />, "/chef.png"]);
  cases.push(["Repository row, selected", table(<RepoRow block={blk} hue={hue} open={false} onOpen={noop}
    onTag={noop} picked onPick={noop} />), "repo-tr-picked"]);
  cases.push(["Repository row, never used", table(<RepoRow block={bare} hue={hue} open onOpen={noop} onTag={noop}
    picked={false} onPick={noop} />), "Never"]);
  cases.push(["Repository open row", <RepoDetail block={blk} hue={hue} planOf={planOf} stores={stores}
    onSave={noop} onDelete={noop} onPlace={noop} onAssign={noop} />, "Attach a clip"]);
  cases.push(["Repository open row, with a clip on it", <RepoDetail
    block={{ ...blk, media: { kind: "video", src: "https://e.com/clip.mov", name: "clip.mov", size: 8 * 1024 * 1024 }, ask: "Who was that for?" }}
    hue={hue} planOf={planOf} stores={stores} onSave={noop} onDelete={noop} onPlace={noop} onAssign={noop} />, "Take the file off"]);
  cases.push(["Repository placer", <RepoPlace block={blk} planOf={planOf} stores={stores}
    onPlace={noop} onAssign={noop} />, "Add to day plan"]);

  // ─── the sections a day actually has ───
  // A day set to Freeform has none of a sequence's slots, and every class
  // inherits the same two sequences from the template, so reading a day's
  // sections off the sequence alone said "no sections to land in" while the
  // dashboard was drawing the sections made by hand on that same day. A
  // section made by hand, and any slot holding something, is a section.
  const noSeq = { id: "noseq", code: "COMM 0", sequences: [], defaultSequenceId: "" };
  const handMade = { sequenceId: "", slots: {
    "sec-1": { title: "The hook", items: [] },
    opener: { title: "Left over", items: [{ id: "i1", text: "A note" }] },
    empty: { title: "Nothing in here", items: [] },
  } };
  const found = sectionsOf(noSeq, handMade);
  if (found.length !== 2) { console.error("  FAIL  sections: found " + found.length + " of the two real sections"); failedEarly++; }
  if (found[0][1] !== "The hook") { console.error("  FAIL  sections: the section is called " + found[0][1]); failedEarly++; }
  if (found.some(([k]) => k === "empty")) { console.error("  FAIL  sections: an empty slot counted as a section"); failedEarly++; }
  if (sectionsOf(noSeq, { slots: {} }).length) { console.error("  FAIL  sections: a day with nothing on it claimed a section"); failedEarly++; }
  // Sequences are gone: a class that still carries them in its config draws
  // none of their empty slots on a day with nothing in it.
  const seqDay = sectionsOf(ENGINE_LIST.find(c => (c.sequences || []).length) || cfg0, { sequenceId: "motivated", slots: {} });
  if (seqDay.length) { console.error("  FAIL  sections: a sequence's empty slots are drawing again"); failedEarly++; }
  // The placer names the sections rather than their keys.
  const planWithSections = () => handMade;
  cases.push(["Repository placer, a day with hand-made sections",
    <RepoPlace block={blk} planOf={planWithSections} stores={{ [ENGINE_LIST[0].id]: {
      schedule: [{ id: "w1", topic: "A week", dates: ["Sep 1"] }] } }}
      onPlace={noop} onAssign={noop} />, "Add to day plan"]);
  cases.push(["Repository type sheet", <RepoType fonts={DEFAULT_REPO_FONTS} bold={false}
    onFont={noop} onBold={noop} onReset={noop} onClose={noop} />, "Column headings"]);
  // The lenses, on an index built the way the page builds one: the same
  // reading in two classes, and a day pointing at a block that is gone.
  const dupA = { ...blk, id: "d1", owner: cfg0, target: cfg0.id, uses: [{ cls: cfg0, date: "Sep 23", section: "opener" }] };
  const dupB = { ...blk, id: "d2", headline: "", title: "why we bet", owner: ENGINE_LIST[1], target: ENGINE_LIST[1].id, uses: [] };
  const dupC = { ...blk, id: "d3", url: "", title: "A Hook With No Link", owner: null, target: "shared", uses: [] };
  const clusters = findDuplicates([dupA, dupB, dupC, { ...dupC, id: "d4", owner: cfg0, target: cfg0.id, uses: [] }]);
  if (clusters.length !== 2) { console.error("  FAIL  tidy: expected 2 clusters, got " + clusters.length); failedEarly++; }

  // Two games called "Weekly Game, week 1" in two classes hold ten completely
  // different questions each. Matching those on the title offered a merge that
  // would have repointed a day at the wrong questions and deleted the loser.
  const setA = { id: "s1", type: "set", title: "Weekly Game, week 1", children: ["a", "b"], owner: cfg0, target: cfg0.id, uses: [] };
  const setB = { ...setA, id: "s2", children: ["c", "d"], owner: ENGINE_LIST[1], target: ENGINE_LIST[1].id };
  const setC = { ...setA, id: "s3", children: ["b", "a"], owner: ENGINE_LIST[1], target: ENGINE_LIST[1].id };
  if (findDuplicates([setA, setB]).length) { console.error("  FAIL  tidy: two different games with one name were called copies"); failedEarly++; }
  if (findDuplicates([setA, setC]).length !== 1) { console.error("  FAIL  tidy: two sets holding the same blocks were not matched"); failedEarly++; }
  cases.push(["Repository duplicates", <Duplicates clusters={clusters} hue={hue} onMerge={() => ""} />, "copies"]);
  // Two assignments called In-Class describing different weeks were two
  // identical rows on screen, and merging them would have pointed one class's
  // days at the other class's words.
  const saidDifferent = findDuplicates([
    { id: "x1", type: "assignment", title: "In-Class", body: "Weekly Game, This or That", owner: cfg0, target: cfg0.id, uses: [] },
    { id: "x2", type: "assignment", title: "In-Class", body: "Weekly Game, Around the Horn", owner: ENGINE_LIST[1], target: ENGINE_LIST[1].id, uses: [] },
  ]);
  cases.push(["Repository duplicates, copies that disagree",
    <Duplicates clusters={saidDifferent} hue={hue} onMerge={() => ""} />, "The copies say different things"]);
  cases.push(["Repository duplicates, none", <Duplicates clusters={[]} hue={hue} onMerge={() => ""} />, "No copies"]);

  const looseStores = { [cfg0.id]: {
    blocks: {},
    dayPlans: { "Sep 23": { slots: { opener: { title: "Opener", items: [{ id: "x1", blockId: "gone" }] } } } },
    schedule: [{ id: "w1", dates: ["Sep 21", "Sep 23"], items: [{ id: "s1", libId: "r1", title: "Why We Bet", url: "https://e.com", date: "Wed" }] }],
    library: [{ id: "r1", type: "reading", title: "Why We Bet" }],
  }, shared: {} };
  const ends = findLooseEnds(looseStores, [cfg0]);
  if (ends.length !== 2) { console.error("  FAIL  tidy: expected 2 loose ends, got " + ends.length); failedEarly++; }
  cases.push(["Repository loose ends", <LooseEnds ends={ends} onDrop={noop} onUnlink={noop} onMakeBlock={noop} />, "Add item"]);
  cases.push(["Repository loose ends, none", <LooseEnds ends={[]} onDrop={noop} onUnlink={noop} onMakeBlock={noop} />, "Nothing dangling"]);

  // The merge itself, on stores rather than on a screen: the loser leaves, the
  // day that pointed at the loser points at the survivor, and the loser is
  // kept whole in the merged list.
  const mStores = {
    [cfg0.id]: { blocks: { d1: { id: "d1", type: "link", title: "Why We Bet", url: "https://e.com/bet", tags: ["a"] } },
      dayPlans: { "Sep 23": { slots: { opener: { items: [{ id: "r", blockId: "d2" }] } } } },
      schedule: [{ id: "w1", dates: ["Sep 23"], items: [{ id: "s", libId: "d2", title: "t", date: "Wed" }] }] },
    shared: { blocks: { d2: { id: "d2", type: "link", title: "Why We Bet", url: "https://e.com/bet", headline: "Kept.", tags: ["b"] } } },
  };
  const cl = findDuplicates([
    { ...mStores[cfg0.id].blocks.d1, owner: cfg0, target: cfg0.id, uses: [] },
    { ...mStores.shared.blocks.d2, owner: null, target: "shared", uses: [{ cls: cfg0, date: "Sep 23", section: "opener" }] },
  ])[0];
  const merged = applyMerge({ stores: mStores, classes: [cfg0], cluster: cl, survivorId: "d1", toShared: true });
  const after = merged.patches;
  const row = after[cfg0.id].dayPlans["Sep 23"].slots.opener.items[0];
  const kept = after.shared.blocks.d1;
  const gone = after[cfg0.id].blocks.d1 || after.shared.blocks.d2;
  if (row.blockId !== "d1") { console.error("  FAIL  tidy merge: the day still points at " + row.blockId); failedEarly++; }
  if (after[cfg0.id].schedule[0].items[0].libId !== "d1") { console.error("  FAIL  tidy merge: the week was not repointed"); failedEarly++; }
  if (!kept || kept.headline !== "Kept.") { console.error("  FAIL  tidy merge: the headline did not fold across"); failedEarly++; }
  if (!kept || kept.tags.join() !== "a,b") { console.error("  FAIL  tidy merge: tags did not union, got " + (kept && kept.tags)); failedEarly++; }
  if (gone) { console.error("  FAIL  tidy merge: the loser is still on a shelf"); failedEarly++; }
  if ((after.shared.merged || []).length !== 1) { console.error("  FAIL  tidy merge: no tombstone kept"); failedEarly++; }

  // Tags, on an index with the same word filed three ways.
  const tagged = [
    { id: "t1", type: "link", title: "One", tags: ["framing", "Sport"], owner: cfg0, target: cfg0.id, uses: [] },
    { id: "t2", type: "link", title: "Two", tags: ["Framing", "sport"], owner: null, target: "shared", uses: [] },
    { id: "t3", type: "link", title: "Three", tags: ["framing"], owner: cfg0, target: cfg0.id, uses: [] },
  ];
  const tix = tagIndex(tagged);
  const alike = lookalikes(tix);
  if (tix.length !== 4) { console.error("  FAIL  tags: expected 4 tags, got " + tix.length); failedEarly++; }
  if (tix[0].tag !== "framing" || tix[0].n !== 2) { console.error("  FAIL  tags: most used first is wrong"); failedEarly++; }
  if (alike.length !== 2) { console.error("  FAIL  tags: expected 2 lookalike groups, got " + alike.length); failedEarly++; }
  if (normTag(" Framing. ") !== "framing") { console.error("  FAIL  tags: normTag"); failedEarly++; }

  // A rename onto a tag a block already carries must not leave the block
  // holding the same tag twice.
  const tagStores = { [cfg0.id]: { blocks: { t1: { id: "t1", tags: ["framing", "Sport"] } } }, shared: { blocks: { t2: { id: "t2", tags: ["Framing", "sport"] } } } };
  const rp = retagPatches({ stores: tagStores, classes: [cfg0], from: "Framing", to: "framing" });
  if (rp.shared.blocks.t2.tags.join() !== "framing,sport") { console.error("  FAIL  tags rename: got " + rp.shared.blocks.t2.tags.join()); failedEarly++; }
  const dp = retagPatches({ stores: tagStores, classes: [cfg0], from: "Sport", to: "" });
  if (dp[cfg0.id].blocks.t1.tags.join() !== "framing") { console.error("  FAIL  tags delete: got " + dp[cfg0.id].blocks.t1.tags.join()); failedEarly++; }
  const merged2 = retagPatches({ stores: { a: { blocks: { x: { id: "x", tags: ["a", "b"] } } } }, classes: [{ id: "a" }], from: "a", to: "b" });
  if (merged2.a.blocks.x.tags.join() !== "b") { console.error("  FAIL  tags merge: got " + merged2.a.blocks.x.tags.join()); failedEarly++; }

  cases.push(["Repository tags", <Tags index={tix} alike={alike} onRetag={noop} />, "The same word"]);
  cases.push(["Repository tags, none", <Tags index={[]} alike={[]} onRetag={noop} />, "No tags anywhere"]);

  // Links, with one of each answer.
  const linked = [
    { id: "L1", title: "Fine one", url: "https://a.com/x", link: { at: "2026-08-31", status: 200, to: "" }, owner: cfg0, target: cfg0.id, uses: [] },
    { id: "L2", title: "Dead one", url: "https://b.com/y", link: { at: "2026-08-31", status: 404, to: "" }, owner: null, target: "shared", uses: [] },
    { id: "L3", title: "Moved one", url: "https://c.com/z", link: { at: "2026-08-31", status: 200, to: "https://c.com/new" }, owner: cfg0, target: cfg0.id, uses: [] },
    { id: "L4", title: "Never checked", url: "https://d.com", owner: cfg0, target: cfg0.id, uses: [] },
    { id: "L5", title: "No link at all", url: "", owner: cfg0, target: cfg0.id, uses: [] },
  ];
  if (linkables(linked).length !== 4) { console.error("  FAIL  links: linkables counted wrong"); failedEarly++; }
  if (!verdict(linked[1].link).bad) { console.error("  FAIL  links: a 404 is not bad news"); failedEarly++; }
  if (verdict(linked[0].link).bad) { console.error("  FAIL  links: a 200 read as bad"); failedEarly++; }
  if (!verdict(linked[3].link).dim) { console.error("  FAIL  links: unchecked did not read as unchecked"); failedEarly++; }
  const lp = linkPatches({ stores: { [cfg0.id]: { blocks: { L1: { id: "L1" } } }, shared: { blocks: { L2: { id: "L2" } } } },
    classes: [cfg0], results: { L1: { at: "x", status: 200 }, L2: { at: "x", status: 404 } }, index: linked });
  if (lp[cfg0.id].blocks.L1.link.status !== 200 || lp.shared.blocks.L2.link.status !== 404) {
    console.error("  FAIL  links: results did not land on the right stores"); failedEarly++; }

  cases.push(["Repository links", <Links blocks={linkables(linked)} busy={false} done={0} total={0}
    onCheck={noop} onlyBad={false} setOnlyBad={noop} />, "Check 4 links"]);
  cases.push(["Repository links, checking", <Links blocks={linkables(linked)} busy done={8} total={40}
    onCheck={noop} onlyBad setOnlyBad={noop} />, "Checking 8 of 40"]);

  cases.push(["Repository type sheet, chosen", <RepoType fonts={{ cols: "fraunces", rows: "grotesk", page: "plex" }}
    bold onFont={noop} onBold={noop} onReset={noop} onClose={noop} />, "Heavier rows"]);

  // ─── a game built out of the shelf ───
  // Every quiz question Andrew has written is a block, and each old game is a
  // set holding its questions. The porting script flattened the options into a
  // sentence and dropped which one was right, so both readings have to work:
  // the structure where a repair put it back, and the sentence where nothing
  // did.
  const qStore = { blocks: {
    qq1: { id: "qq1", type: "question", title: "What does libero mean in Italian?",
      body: "Answer: Free, liberty", tags: ["team trivia"] },
    qq2: { id: "qq2", type: "question", title: "What earned the Spurs a fine?",
      body: "Options: He complained · He sat his best players · He bet on the game · He tanked",
      q: { options: ["He complained", "He sat his best players", "He bet on the game", "He tanked"],
        correct: 1, answer: "", category: "on_topic" }, tags: ["weekly game"] },
    qq3: { id: "qq3", type: "question", title: "An old one with no answer kept",
      body: "Options: One · Two · Three", tags: ["weekly game"] },
    gs1: { id: "gs1", type: "set", title: "Weekly Game, week 2", children: ["qq2", "qq3"], tags: ["weekly game"] },
    nb1: { id: "nb1", type: "note", title: "Not a question at all" },
  } };
  const shelfBank = bankOf(qStore, { blocks: {} });
  if (shelfBank.questions.length !== 3) { console.error("  FAIL  qbank: read " + shelfBank.questions.length + " questions"); failedEarly++; }
  if (shelfBank.sets.length !== 1 || shelfBank.sets[0].items.length !== 2) {
    console.error("  FAIL  qbank: a set did not come back holding its questions"); failedEarly++; }
  if (parseOptions("Options: a · b · c").length !== 3) { console.error("  FAIL  qbank: the flattened options did not read back"); failedEarly++; }
  if (parseAnswer("Answer: Free, liberty") !== "Free, liberty") { console.error("  FAIL  qbank: the flattened answer did not read back"); failedEarly++; }
  const structured = questionOf(qStore.blocks.qq2);
  if (structured.correct !== 1) { console.error("  FAIL  qbank: the right answer was lost"); failedEarly++; }
  if (!isReady(structured)) { console.error("  FAIL  qbank: a question with options and an answer is not ready"); failedEarly++; }
  if (isReady(questionOf(qStore.blocks.qq3))) { console.error("  FAIL  qbank: a question with no right answer called itself ready"); failedEarly++; }
  if (searchBank(shelfBank.questions, "libero").length !== 1) { console.error("  FAIL  qbank: the search missed"); failedEarly++; }
  if (searchBank(shelfBank.questions, "").length !== 3) { console.error("  FAIL  qbank: an empty search hid rows"); failedEarly++; }

  const choice = asChoice(structured);
  if (choice.options.length !== 4 || choice.correct !== 1) {
    console.error("  FAIL  qbank: a question arrived at the weekly game editor wrong"); failedEarly++; }
  // No category comes across. Every new question is worth ten, and a question
  // carrying an old category is scored the old way, so importing one with a
  // category on it would quietly make it worth fifteen.
  if (choice.category) { console.error("  FAIL  qbank: a category came across onto a new question"); failedEarly++; }
  // A question with two options still fills four boxes, because that editor
  // draws four and an undefined option would render as nothing at all.
  if (asChoice(questionOf(qStore.blocks.qq1)).options.length !== 4) {
    console.error("  FAIL  qbank: the option boxes came up short"); failedEarly++; }
  const free = asFree(questionOf(qStore.blocks.qq1));
  if (free.expectedAnswer !== "Free, liberty" || !free.id) {
    console.error("  FAIL  qbank: a question arrived at Team Trivia wrong"); failedEarly++; }

  cases.push(["Question picker", <QuestionPicker storageKey="x" mode="choice"
    onAdd={noop} onClose={noop} />, "From the repository"]);
  cases.push(["Question picker, free answers", <QuestionPicker storageKey="x" mode="free"
    onAdd={noop} onClose={noop} />, "Search every question you have written"]);

  // ─── the term, day by day ───
  // What is week six made of, which the page could only answer one block at a
  // time. Two sources per day: the sections the room works through, and what
  // the students were told to read.
  const termCfg = ENGINE_LIST[0];
  const d1 = "Sep 1";
  const d2 = "Sep 3";
  const termStore = {
    schedule: [{ id: "w1", topic: "Framing", dates: [d1, d2], items: [
      { id: "s1", libId: "tb1", type: "reading", title: "Why We Bet", url: "https://e.com/bet", date: weekdayOf(d1) },
      { id: "s2", type: "assignment", title: "Media diary", url: "", date: "" },
    ] }],
    dayPlans: { [d1]: { sequenceId: FREEFORM, slots: { "sec-1": { title: "The hook", items: [
      { id: "i1", blockId: "tb1" }, { id: "i2", text: "A note" },
    ] } } } },
  };
  const termBlocks = { tb1: { id: "tb1", type: "link", title: "Why We Bet", headline: "The house always knows.",
    url: "https://e.com/bet", pick: true } };
  const termDays = termOf({ cls: termCfg, store: termStore, blockOf: (id) => termBlocks[id] || null });
  if (termDays.length !== 2) { console.error("  FAIL  term: " + termDays.length + " days out of two"); failedEarly++; }
  if (termDays[0].sections.length !== 1 || termDays[0].sections[0].items.length !== 2) {
    console.error("  FAIL  term: the first day's sections came back wrong"); failedEarly++; }
  if (termDays[0].sections[0].items[0].words !== "The house always knows.") {
    console.error("  FAIL  term: a block row says " + termDays[0].sections[0].items[0].words); failedEarly++; }
  if (!termDays[0].sections[0].items[0].pick) { console.error("  FAIL  term: a picked block lost its sticker"); failedEarly++; }
  // An item with a weekday belongs to that day; an item with none belongs to
  // the week and still needs a day, so it shows on both and says so.
  if (termDays[0].assigned.length !== 2) { console.error("  FAIL  term: day one was assigned " + termDays[0].assigned.length); failedEarly++; }
  if (!termDays[1].assigned.some(a => a.loose)) { console.error("  FAIL  term: an item with no day did not say so"); failedEarly++; }
  if (termDays[1].rows) { console.error("  FAIL  term: a day with no plan came back with rows"); failedEarly++; }
  const tc = termCounts(termDays);
  if (tc.days !== 2 || tc.planned !== 1 || tc.empty !== 1 || tc.rows !== 2) {
    console.error("  FAIL  term: the counts came out " + JSON.stringify(tc)); failedEarly++; }
  if (!nearestDay(termDays)) { console.error("  FAIL  term: no day came back as the nearest"); failedEarly++; }

  // The same row the shelf draws, under a date and a section, which is what
  // makes the view a view of the shelf rather than a report about it.
  const termIndexed = { tb1: { ...termBlocks.tb1, owner: termCfg, target: termCfg.id, uses: [], tags: ["betting"] } };
  const termTable = (el) => <table><tbody>{el}</tbody></table>;
  cases.push(["The term, day by day", termTable(
    <RepoTerm days={termDays} here={termDays[0].date} rowOf={id => termIndexed[id] || null} hue={hue}
      openId="" onOpen={noop} onTag={noop} pickedSet={new Set()} onPick={noop} onStar={noop}
      detail={() => null} />), "The house always knows."]);
  // A row that points at nothing on the shelf still gets a line, or the day
  // would read as emptier than it is.
  cases.push(["The term, a row with no block behind it", termTable(
    <RepoTerm days={termDays} here="" rowOf={() => null} hue={hue}
      openId="" onOpen={noop} onTag={noop} pickedSet={new Set()} onPick={noop} onStar={noop}
      detail={() => null} />), "repo-tr-plain"]);
  // Adding to a day from the day. The two destinations are the two a day has:
  // a section of the plan, or the readings the students are given.
  cases.push(["Add to a day", <RepoDayAdd day={termDays[0]} shelf={[termIndexed.tb1]} hue={hue}
    onAdd={() => ""} onMake={() => ""} />, "The readings students see"]);
  cases.push(["Add to a day, a day with no sections", <RepoDayAdd day={termDays[1]} shelf={[]} hue={hue}
    onAdd={() => ""} onMake={() => ""} />, "Add new item"]);
  // Off the day, still on the shelf. A row on a day is a pointer at a block, so
  // taking the row away leaves the block and every other day using it alone.
  cases.push(["The term, with a way off the day", termTable(
    <RepoTerm days={termDays} here="" rowOf={id => termIndexed[id] || null} hue={hue} openId="" onOpen={noop}
      onTag={noop} pickedSet={new Set()} onPick={noop} onStar={noop} detail={() => null}
      shelf={[]} onAdd={() => ""} onMake={() => ""} onOff={() => ""} />), "Remove from " + d1]);
  // and the shelf's own rows have no such button, because a row there is not
  // on a day at all.
  cases.push(["Repository row, no day to come off", table(<RepoRow block={blk} hue={hue} open={false}
    onOpen={noop} onTag={noop} picked={false} onPick={noop} onStar={noop} />), "Why We Bet"]);
  cases.push(["The term, with an add button", termTable(
    <RepoTerm days={termDays} here="" rowOf={() => null} hue={hue} openId="" onOpen={noop} onTag={noop}
      pickedSet={new Set()} onPick={noop} onStar={noop} detail={() => null}
      shelf={[]} onAdd={() => ""} onMake={() => ""} />), "+ Add to " + d1]);
  cases.push(["The term, a day header", termTable(
    <RepoTerm days={termDays} here={termDays[0].date} rowOf={() => null} hue={hue}
      openId="" onOpen={noop} onTag={noop} pickedSet={new Set()} onPick={noop} onStar={noop}
      detail={() => null} />), "Nearest today"]);

  // ─── what is wrong with the shelf ───
  const shelf = [
    { id: "h1", type: "link", title: "Tagged and used", headline: "A headline.", url: "https://a.com",
      tags: ["framing"], uses: [{ cls: cfg0, date: "Sep 1", section: "opener" }], link: { at: "x", status: 200 } },
    { id: "h2", type: "link", title: "Bare", headline: "", url: "", tags: [], uses: [] },
    { id: "h3", type: "note", title: "A note with no link, which is fine", headline: "Said.", url: "",
      tags: ["framing"], uses: [{ cls: cfg0, date: "Sep 1", section: "opener" }] },
    { id: "h4", type: "link", title: "Dead", headline: "Gone.", url: "https://b.com", tags: ["x"],
      uses: [{ cls: cfg0, date: "Sep 1", section: "opener" }], link: { at: "x", status: 404 } },
  ];
  const hc = healthCounts(shelf);
  if (hc.untagged !== 1) { console.error("  FAIL  health: counted " + hc.untagged + " untagged"); failedEarly++; }
  if (hc.nohead !== 1) { console.error("  FAIL  health: counted " + hc.nohead + " with no headline"); failedEarly++; }
  // A note with no link is not a fault; an article with no link is.
  if (hc.nolink !== 1) { console.error("  FAIL  health: counted " + hc.nolink + " articles with no link"); failedEarly++; }
  if (hc.never !== 1) { console.error("  FAIL  health: counted " + hc.never + " never used"); failedEarly++; }
  if (hc.broken !== 1) { console.error("  FAIL  health: counted " + hc.broken + " broken links"); failedEarly++; }
  if (shelf.filter(b => carries(b, "untagged")).length !== 1) { console.error("  FAIL  health: the untagged filter caught the wrong rows"); failedEarly++; }
  // An id from a stale address hides nothing rather than emptying the table.
  if (shelf.filter(b => carries(b, "nonsense")).length !== shelf.length) { console.error("  FAIL  health: an unknown flag emptied the shelf"); failedEarly++; }
  if (allClear(hc)) { console.error("  FAIL  health: a shelf with five faults called itself clear"); failedEarly++; }
  if (!allClear(healthCounts([shelf[0]]))) { console.error("  FAIL  health: a clean shelf still claimed a fault"); failedEarly++; }
  if (FLAGS.length !== 5) { console.error("  FAIL  health: " + FLAGS.length + " numbers rather than five"); failedEarly++; }

  cases.push(["Repository health", <RepoHealth counts={hc} flag="" onFlag={noop} />, "Never used"]);
  cases.push(["Repository health, one pressed", <RepoHealth counts={hc} flag="untagged" onFlag={noop} />, "Untagged"]);
  cases.push(["Repository health, all clear", <RepoHealth counts={healthCounts([shelf[0]])} flag="" onFlag={noop} />,
    "Nothing is missing"]);

  // ─── the way back ───
  // The photograph is taken before the change and written straight over the
  // top, only on the blocks it holds, so an edit made to another block in
  // between survives.
  const undoStores = {
    [cfg0.id]: { blocks: { u1: { id: "u1", type: "link", title: "Before", tags: ["a"] },
      u2: { id: "u2", type: "note", title: "Untouched" } } },
    shared: { blocks: {} },
  };
  const step = remember({ stores: undoStores, classes: [cfg0], ids: ["u1", "u3"], what: "Edited Before" });
  if (step.before.length !== 2) { console.error("  FAIL  undo: the photograph holds " + step.before.length); failedEarly++; }
  if (step.before[1].block !== null) { console.error("  FAIL  undo: a block that does not exist was photographed as one that does"); failedEarly++; }
  if (sayEntry(step) !== "Edited Before, 2 blocks") { console.error("  FAIL  undo: the line says " + sayEntry(step)); failedEarly++; }

  // The change: u1 edited and moved to the shared shelf, u3 created there.
  const changed = {
    [cfg0.id]: { blocks: { u2: undoStores[cfg0.id].blocks.u2 } },
    shared: { blocks: { u1: { id: "u1", type: "story", title: "After", tags: [] }, u3: { id: "u3", title: "New" } } },
  };
  const restored = undoPatches({ stores: changed, classes: [cfg0], entry: step });
  if (restored[cfg0.id].blocks.u1.title !== "Before") { console.error("  FAIL  undo: the block did not come home"); failedEarly++; }
  if (restored.shared.blocks.u1) { console.error("  FAIL  undo: the moved block was left on the shared shelf as well"); failedEarly++; }
  if (restored.shared.blocks.u3) { console.error("  FAIL  undo: a block made by the change survived the undo"); failedEarly++; }
  if (!restored[cfg0.id].blocks.u2) { console.error("  FAIL  undo: a block nobody touched was thrown away"); failedEarly++; }

  let stack = [];
  stack = pushEntry(stack, step);
  stack = pushEntry(stack, remember({ stores: undoStores, classes: [cfg0], ids: [], what: "Nothing" }));
  if (stack.length !== 1) { console.error("  FAIL  undo: a change touching no blocks went on the stack"); failedEarly++; }
  for (let i = 0; i < LIMIT + 5; i++) stack = pushEntry(stack, { ...step, what: "Step " + i });
  if (stack.length !== LIMIT) { console.error("  FAIL  undo: the stack grew to " + stack.length); failedEarly++; }
  if (stack[0].what !== "Step " + (LIMIT + 4)) { console.error("  FAIL  undo: the newest step is not on top"); failedEarly++; }

  cases.push(["Repository steps", <RepoSteps steps={[step]} onBack={noop} />, "Undo"]);
  cases.push(["Repository steps, none", <RepoSteps steps={[]} onBack={noop} />]);

  // ─── the types, as a list Andrew edits ───
  // Eight types shipped in the code, and eight is a guess about how one person
  // files their material. A type he adds has to reach every reader, including
  // the dozen call sites that only ever call typeOf.
  let kindStore = {};
  const kindUpdate = (m) => { kindStore = m(kindStore); };
  addType(kindUpdate, "Video", "Something to watch.");
  addType(kindUpdate, "Video");
  const added = readAdded(kindStore);
  if (added.length !== 2) { console.error("  FAIL  types: adding two kinds made " + added.length); failedEarly++; }
  if (added[0].id !== "video" || added[1].id !== "video-2") {
    console.error("  FAIL  types: the ids came out as " + added.map(t => t.id).join()); failedEarly++; }
  if (idForLabel("Article", []) !== "article") { console.error("  FAIL  types: a plain name made a bad id"); failedEarly++; }
  if (idForLabel("Note", []) !== "note-2") { console.error("  FAIL  types: a name clashing with a built-in kind was not numbered"); failedEarly++; }

  renameType(kindUpdate, "link", "Reading");
  const renamed = readTypes(kindStore);
  if ((renamed.find(t => t.id === "link") || {}).label !== "Reading") {
    console.error("  FAIL  types: renaming a built-in kind did not take"); failedEarly++; }
  if (renamed.length !== 10) { console.error("  FAIL  types: the whole list came to " + renamed.length); failedEarly++; }
  renameType(kindUpdate, "video", "Watch");
  if ((readAdded(kindStore)[0] || {}).label !== "Watch") { console.error("  FAIL  types: renaming an added kind did not take"); failedEarly++; }

  // Every reader goes through typeOf, so the registry is what makes a renamed
  // kind say the new word on the dashboard as well as here.
  registerTypes({ added: readAdded(kindStore), labels: kindStore.typeLabels });
  if (typeOf("link").label !== "Reading") { console.error("  FAIL  types: typeOf still says " + typeOf("link").label); failedEarly++; }
  if (typeOf("video").label !== "Watch") { console.error("  FAIL  types: typeOf does not know an added kind"); failedEarly++; }
  if (allTypes().length !== 10) { console.error("  FAIL  types: the registry holds " + allTypes().length); failedEarly++; }
  // A kind deleted while blocks still carry it says the id back rather than
  // calling the block a Note.
  if (typeOf("gone").label !== "gone") { console.error("  FAIL  types: a kind with no name became " + typeOf("gone").label); failedEarly++; }

  writeTypeColor(kindUpdate, "video", "purple-mid");
  if (colorOfType(kindStore.colors, "video") !== "#6e30b5") {
    console.error("  FAIL  types: an added kind got the colour " + colorOfType(kindStore.colors, "video")); failedEarly++; }
  if (colorOfType(kindStore.colors, "link") !== colorOfType({}, "link")) {
    console.error("  FAIL  types: colouring one kind moved another"); failedEarly++; }

  dropType(kindUpdate, "note");
  if (readTypes(kindStore).length !== 10) { console.error("  FAIL  types: a built-in kind was deleted"); failedEarly++; }
  dropType(kindUpdate, "video-2");
  if (readAdded(kindStore).length !== 1) { console.error("  FAIL  types: deleting an added kind left " + readAdded(kindStore).length); failedEarly++; }
  resetName(kindUpdate, "link");
  if ((readTypes(kindStore).find(t => t.id === "link") || {}).label !== "Article") {
    console.error("  FAIL  types: putting a built-in name back did not take"); failedEarly++; }

  const strays = orphanTypes([{ type: "video" }, { type: "gone" }, { type: "gone" }], readTypes(kindStore));
  if (strays.length !== 1 || strays[0].n !== 2) { console.error("  FAIL  types: the blocks with no kind were miscounted"); failedEarly++; }

  cases.push(["Repository types", <RepoTypes types={readTypes(kindStore)} counts={{ link: 12, video: 1 }}
    orphans={strays} hue={hue} onAdd={noop} onRename={noop} onReset={noop} onColor={noop} onDrop={noop}
    onRetype={noop} />, "Add type"]);
  cases.push(["Repository types, none added", <RepoTypes types={readTypes({})} counts={{}} orphans={[]}
    hue={hue} onAdd={noop} onRename={noop} onReset={noop} onColor={noop} onDrop={noop} onRetype={noop} />,
    "Reset name"]);
  // Left as the page found it, so no later case renders against a shelf that
  // has a Watch kind on it.
  registerTypes({});

  // ─── the filters, as an address and as a saved view ───
  const asked = { ...BLANK, q: "betting", kind: "link", where: cfg0.id, tag: "framing" };
  if (filterQuery(asked) !== "?q=betting&kind=link&class=" + cfg0.id + "&tag=framing") {
    console.error("  FAIL  views: the address came out as " + filterQuery(asked)); failedEarly++; }
  if (filterQuery(BLANK) !== "") { console.error("  FAIL  views: a blank shelf still wrote a query"); failedEarly++; }
  const back = readFilters(filterQuery(asked));
  if (back.q !== "betting" || back.where !== cfg0.id || back.tag !== "framing" || back.kind !== "link") {
    console.error("  FAIL  views: the address did not read back as the same question"); failedEarly++; }
  if (readFilters("?sort=made&dir=asc").col !== "made") { console.error("  FAIL  views: sort did not survive the address"); failedEarly++; }
  if (filterQuery({ ...BLANK, pick: "yes" }) !== "?pick=yes") { console.error("  FAIL  views: the picked-out filter is not in the address"); failedEarly++; }
  if (readFilters("?pick=yes").pick !== "yes") { console.error("  FAIL  views: the picked-out filter did not read back"); failedEarly++; }
  // A chip is a step in the history and a keystroke is not.
  if (!isStep(BLANK, { ...BLANK, kind: "link" })) { console.error("  FAIL  views: a kind chip is not a step"); failedEarly++; }
  if (isStep(BLANK, { ...BLANK, q: "bet" })) { console.error("  FAIL  views: a keystroke counted as a step"); failedEarly++; }
  const said = viewWords(asked, { classes: [cfg0], label: () => "Article", sharedLabel: "Shared" });
  if (!said.includes("Article") || !said.includes(cfg0.code)) {
    console.error("  FAIL  views: a view described itself as " + said); failedEarly++; }

  let pinboard = { repoViews: [] };
  const shelfUpdate = (m) => { pinboard = m(pinboard); };
  saveView(shelfUpdate, { id: "v1", name: "Untagged readings", filters: asked });
  if (readViews(pinboard).length !== 1) { console.error("  FAIL  views: pinning kept nothing"); failedEarly++; }
  if (!viewFor(readViews(pinboard), asked)) { console.error("  FAIL  views: the pinned question was not recognised"); failedEarly++; }
  dropView(shelfUpdate, "v1");
  if (readViews(pinboard).length) { console.error("  FAIL  views: unpinning kept the view"); failedEarly++; }

  cases.push(["Repository views", <RepoViews views={[{ id: "v1", name: "Untagged readings", filters: asked }]}
    pinned={null} blank={false} naming={null} here={asked} say={() => "COMM 1"} onGo={noop} onName={noop}
    onPin={noop} onDrop={noop} onClear={noop} />, "Pin view"]);
  cases.push(["Repository views, naming one", <RepoViews views={[]} pinned={null} blank={false} naming="A name"
    here={asked} say={() => "COMM 1"} onGo={noop} onName={noop} onPin={noop} onDrop={noop} onClear={noop} />, "Pin view"]);

  // ─── many rows at once ───
  const bulkStores = {
    [cfg0.id]: { blocks: { p1: { id: "p1", type: "link", title: "One", tags: ["framing"] },
      p2: { id: "p2", type: "link", title: "Two", tags: [] } } },
    shared: { blocks: { p3: { id: "p3", type: "note", title: "Three", tags: ["framing"] } } },
  };
  const tagged2 = tagPatches({ stores: bulkStores, classes: [cfg0], ids: ["p1", "p2", "p3"], add: ["betting"], remove: ["framing"] });
  if (tagged2[cfg0.id].blocks.p1.tags.join() !== "betting") {
    console.error("  FAIL  bulk: tags came out as " + tagged2[cfg0.id].blocks.p1.tags.join()); failedEarly++; }
  if (tagged2.shared.blocks.p3.tags.join() !== "betting") { console.error("  FAIL  bulk: the shared shelf was not retagged"); failedEarly++; }
  const twice = tagPatches({ stores: bulkStores, classes: [cfg0], ids: ["p1"], add: ["framing"], remove: [] });
  if (Object.keys(twice).length) { console.error("  FAIL  bulk: a tag a block already carries wrote a save"); failedEarly++; }
  const retyped = typePatches({ stores: bulkStores, classes: [cfg0], ids: ["p1", "p3"], type: "story" });
  if (retyped[cfg0.id].blocks.p1.type !== "story" || retyped.shared.blocks.p3.type !== "story") {
    console.error("  FAIL  bulk: the kind did not change on both stores"); failedEarly++; }
  if (retyped[cfg0.id].blocks.p2.type !== "link") { console.error("  FAIL  bulk: an unselected block was changed"); failedEarly++; }
  const shared2 = sharePatches({ stores: bulkStores, classes: [cfg0], ids: ["p1", "p2"] });
  if (shared2[cfg0.id].blocks.p1 || shared2[cfg0.id].blocks.p2) { console.error("  FAIL  bulk: the class kept the moved blocks"); failedEarly++; }
  if (!shared2.shared.blocks.p1 || shared2.shared.blocks.p1.id !== "p1") {
    console.error("  FAIL  bulk: the block did not arrive on the shared shelf with its id"); failedEarly++; }
  const picked = [{ id: "p1", owner: cfg0, tags: ["framing"] }, { id: "p3", owner: null, tags: ["framing", "money"] }];
  if (wouldShare(picked, ["p1", "p3"]) !== 1) { console.error("  FAIL  bulk: counted the wrong number to move"); failedEarly++; }
  if (tagsAcross(picked, ["p1", "p3"])[0].tag !== "framing") { console.error("  FAIL  bulk: the carried tags came out wrong"); failedEarly++; }

  cases.push(["Repository bulk bar", <RepoBulk n={2} rows={picked} planOf={planOf} stores={stores}
    onTag={noop} onType={noop} onShare={noop} onClear={noop} onStar={noop} onPlace={() => ""}
    onAssign={() => ""} />, "Drew&#x27;s Pick"]);
  // The selection already carries the sticker, so the switch reads on and the
  // press takes the sticker off.
  cases.push(["Repository bulk bar, the selection is picked", <RepoBulk n={2}
    rows={picked.map(r => ({ ...r, pick: true }))} planOf={planOf} stores={stores}
    onTag={noop} onType={noop} onShare={noop} onClear={noop} onStar={noop} onPlace={() => ""}
    onAssign={() => ""} />, "repo-toggle-on"]);
  cases.push(["A switch, off", <RepoToggle on={false} label="Schedule by day" onClick={noop} color="#0f766e" />,
    "repo-toggle-track"]);
  cases.push(["A switch, on", <RepoToggle on label="Schedule by day" onClick={noop} color="#0f766e" />,
    "repo-toggle-on"]);

  // ─── the seed library ───
  const md = "## Seeds\n\n### A seed with a turn\n- **Concept:** framing / stakes\n- **Class:** Comm 2 / any\n"
    + "- **Slot:** connect, explain\n- **Source:** a game I watched\n\nThe hook, in a sentence. The turn: it lands framing.\n";
  const parsed = parseSeeds(md);
  if (parsed.length !== 1) { console.error("  FAIL  seeds: parsed " + parsed.length + " seeds out of one"); failedEarly++; }
  else {
    const one = seedPatch(parsed[0]);
    if (one.type !== "story") { console.error("  FAIL  seeds: a seed came in as " + one.type); failedEarly++; }
    if (one.id !== "seed-a-seed-with-a-turn") { console.error("  FAIL  seeds: the id came out as " + one.id); failedEarly++; }
    if (one.tags.join() !== "seed,framing,stakes,connect,explain") {
      console.error("  FAIL  seeds: the tags came out as " + one.tags.join()); failedEarly++; }
    if (one.concept !== "framing") { console.error("  FAIL  seeds: the concept came out as " + one.concept); failedEarly++; }
    if (newSeeds(parsed, [{ id: one.id }]).length) { console.error("  FAIL  seeds: a seed already on the shelf came back as new"); failedEarly++; }
    if (newSeeds(parsed, [{ id: "x", title: "A seed with a turn" }]).length) {
      console.error("  FAIL  seeds: a seed added by hand came back as new"); failedEarly++; }
  }
  if (!SEEDS.length) { console.error("  FAIL  seeds: the generated library is empty"); failedEarly++; }
  cases.push(["Repository seeds", <RepoSeeds seeds={SEEDS} fresh={SEEDS} onBring={noop} onBringAll={noop} />,
    "Add " + SEEDS.length + " seeds"]);
  cases.push(["Repository seeds, all in", <RepoSeeds seeds={SEEDS} fresh={[]} onBring={noop} onBringAll={noop} />,
    "All seeds added"]);

  // ─── what the room made ───
  const roomRaw = {
    boards: { boards: { b1: { id: "b1", prompt: "What would you read more about?", at: 1756600000000,
      posts: [{ id: "pp1", who: "Sam", text: "Sports betting and the law", at: 1756600100000 }] } } },
    questions: { items: [{ id: "q1", text: "How does framing work in a headline?", who: "Alex", at: 1756600200000, state: "answered" }] },
    headlines: { items: [{ id: "h1", text: "Rights fees are up again", url: "https://example.com/rights",
      submittedBy: "Jo", ts: 1756600300000, realCategories: ["Money"], realConcepts: ["Framing"] }] },
    poll: { id: "p", question: "Which one moved you?", options: ["The first", "The second"],
      r1: { Sam: 0, Alex: 1 }, r2: { Sam: 1, Alex: 1 }, correct: 1, at: 1756600400000 },
  };
  const made = roomItems(cfg0, roomRaw);
  if (made.length !== 4) { console.error("  FAIL  room: read " + made.length + " things out of four"); failedEarly++; }

  // ─── a term of polls, rather than the last one ───
  // A poll is kept when the next question starts, so the archive has to hold
  // the votes and the room lens has to read the archive alongside the live one.
  if (worthKeeping({ question: "Asked and never answered", r1: {}, r2: {} })) {
    console.error("  FAIL  poll: a question nobody answered was kept as history"); failedEarly++; }
  const kept1 = archived(roomRaw.poll);
  if (kept1.length !== 1 || kept1[0].question !== "Which one moved you?") {
    console.error("  FAIL  poll: the finished poll was not archived"); failedEarly++; }
  if (kept1[0].past) { console.error("  FAIL  poll: the archive carried itself into the archive"); failedEarly++; }
  if (kept1[0].r2.Sam !== 1) { console.error("  FAIL  poll: the second round did not survive archiving"); failedEarly++; }
  const twicePolled = archived({ ...roomRaw.poll, past: kept1 });
  if (twicePolled.length !== 1) { console.error("  FAIL  poll: the same poll was kept twice"); failedEarly++; }
  const withHistory = { ...roomRaw, poll: { ...roomRaw.poll, id: "p2", question: "And now?",
    past: [{ ...roomRaw.poll, endedAt: 1756500000000 }] } };
  const both = roomItems(cfg0, withHistory).filter(i => i.kind === "poll");
  if (both.length !== 2) { console.error("  FAIL  room: read " + both.length + " polls where two were kept"); failedEarly++; }
  if (both.some(i => !i.title)) { console.error("  FAIL  room: an archived poll came back with no question"); failedEarly++; }
  if (pastPolls({ past: [{ id: "a", at: 1 }, { id: "b", at: 2 }] })[0].id !== "b") {
    console.error("  FAIL  poll: the archive is not newest first"); failedEarly++; }
  const counts2 = roomCounts(made);
  if (counts2.board !== 1 || counts2.question !== 1 || counts2.headline !== 1 || counts2.poll !== 1) {
    console.error("  FAIL  room: the counts by kind came out wrong"); failedEarly++; }
  if (!made.every(i => i.words === i.words.toLowerCase())) { console.error("  FAIL  room: a row is not searchable in lower case"); failedEarly++; }
  const askedAbout = made.filter(i => i.words.includes("framing"));
  if (askedAbout.length !== 2) { console.error("  FAIL  room: searching for framing found " + askedAbout.length); failedEarly++; }
  const asBlock = blockFromRoom(made.find(i => i.kind === "headline"));
  if (asBlock.type !== "link" || !asBlock.url) { console.error("  FAIL  room: a headline kept badly"); failedEarly++; }
  if (blockFromRoom(made.find(i => i.kind === "board")).type !== "board") { console.error("  FAIL  room: a board kept badly"); failedEarly++; }
  if (!stampOf(1756600000000)) { console.error("  FAIL  room: no day on a room row"); failedEarly++; }

  cases.push(["Repository room", <RepoRoom items={made} counts={counts2} kind="" setKind={noop} busy={false}
    kept={new Set()} onKeep={noop} />, "Rights fees are up again"]);
  cases.push(["Repository room, reading", <RepoRoom items={[]} counts={{}} kind="" setKind={noop} busy
    kept={new Set()} onKeep={noop} />, "Reading the boards"]);
  cases.push(["Repository room, nothing matched", <RepoRoom items={[]} counts={{}} kind="" setKind={noop}
    busy={false} kept={new Set()} onKeep={noop} />, "Nothing from the room matches"]);
}
// Each kind of cast, drawn on its own, because mounting the room screen with
// nothing live proves only that the empty screen draws.
cases.push(["On the wall, a discussion", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "board", tag: "Discussion", title: "Discussion", idea: "What did you notice?",
    at: 0, count: 1, join: "board" }} />, "Answer on your phone"]);
cases.push(["On the wall, the Enter board", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "board", tag: "Enter", title: "Enter", idea: "One word for today",
    at: 0, count: 3, showAsk: true }} />, "Ask me anything"]);
// The three ways a link goes up. Server-side nothing is fetched, so these prove
// the screens draw before the article arrives: Read says so, Page shows the
// frame, Card shows the headline on the stage with the way out.
cases.push(["On the wall, an article, read", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "doc", mode: "read", kind: "espn.com", url: "https://www.espn.com/x", openUrl: "https://www.espn.com/x", title: "The Cowboys spent the offseason arguing with themselves." }} />, "Reading the page"]);
cases.push(["On the wall, an article, page", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "doc", mode: "embed", kind: "wikipedia.org", url: "https://en.wikipedia.org/wiki/Super_Bowl", openUrl: "https://en.wikipedia.org/wiki/Super_Bowl", title: "The one game everybody watches." }} />, "<iframe"]);
cases.push(["On the wall, an article, card", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "doc", mode: "card", kind: "espn.com", url: "https://www.espn.com/x", openUrl: "https://www.espn.com/x", title: "The Cowboys spent the offseason arguing with themselves." }} />, "Open espn.com"]);
cases.push(["On the wall, a clip from my phone", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "media", media: "video", src: "https://e.com/clip.mov", title: "The ad that ran during the game" }} />]);
cases.push(["On the wall, a photo", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "media", media: "image", src: "https://e.com/shot.jpg", title: "The billboard on 101" }} />]);
cases.push(["On the wall, a voice memo", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "media", media: "audio", src: "https://e.com/memo.m4a", title: "What I noticed on the drive in" }} />]);
cases.push(["On the wall, a question from the room", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "question", tag: "From the room", title: "Why does that work?", cite: "Anonymous" }} />]);
cases.push(["Ideas for the repository", <RepoIdeas />, "Merge the duplicates"]);
cases.push(["One idea", <Idea idea={{ n: 7, group: "reuse", size: "small", first: true,
  title: "Last used", what: "A last-used column.", why: "A count cannot say when." }} />, "Start here"]);
// The reminders band, on its own, because <Dashboard/> stops at its loading
// screen here. The big one has to be in the markup.
cases.push(["Dashboard reminders", <Reminders />, "love of learning"]);
cases.push(["The Brief", <PlanPage />]);
// Throws when a theme's quote is not tagged with the theme.
cases.push(["Retreat", <RetreatPage />]);
cases.push(["Instructor links", <InstructorLinks />]);

// A surface can render clean and still be the loading screen — that is how the
// first version of this test passed code that was crashing in production. So a
// case may name a string its output MUST contain, and a dashboard names the
// stage: if the layout is not in the markup, the body did not run and the pass
// is worth nothing.
// The game system, ported out of three forked class files into one. Every
// entry point, on a real class config, with a game in each state the room can
// put it in. A port that renders is the least this can be asked to prove, and
// the forks had no test at all.
{
  const gcfg = cfg0;
  const gstudents = (gcfg.students || []).slice(0, 4);
  const noop2 = () => {};
  const qs = [{ id: "q1", text: "Who won?", options: ["A", "B", "C", "D"], correct: 1, pts: 10 }];
  const base = { students: gstudents, log: [], teams: [], weeklyGames: {}, weeklyToT: {},
    weeklyFishbowl: {}, triviaGames: {}, triviaQuestionPool: [], rebounds: {}, reboundGrades: {} };
  const liveWeek = { ...base, weeklyGames: { 3: { week: 3, phase: "live", questions: qs, responses: {} } } };
  const liveTrivia = { ...base, teams: [{ id: "t1", name: "Red", color: 0 }],
    triviaGames: { g1: { id: "g1", week: 3, phase: "live", questions: qs, rounds: [], answers: {} } } };
  const done = { ...base, weeklyGames: { 3: { week: 3, phase: "done", scored: true, questions: qs, responses: {} } } };

  const who = gstudents[0]?.name || "A Student";
  cases.push(["Game, running it", <RunGamePage config={gcfg} />]);
  cases.push(["Game, the admin with nothing set up", <GameAdmin config={gcfg} data={base} setData={noop2} />]);
  cases.push(["Game, the admin with a week live", <GameAdmin config={gcfg} data={liveWeek} setData={noop2} />]);
  cases.push(["Game, the admin with a game finished", <GameAdmin config={gcfg} data={done} setData={noop2} />]);
  cases.push(["Game, a student playing", <GamePage config={gcfg} />]);
  cases.push(["Game, the week's answers", <StudentAnswerView config={gcfg} data={liveWeek} setData={noop2} userName={who} />]);
  cases.push(["Game, nothing to answer", <StudentAnswerView config={gcfg} data={base} setData={noop2} userName={who} />]);
  cases.push(["Game, trivia on a phone", <TriviaPlayer config={gcfg} data={liveTrivia} setData={noop2} userName={who} />]);
  cases.push(["Game, the presenter", <TriviaPresenter gameId="g1" classKey={gcfg.id} />]);
  cases.push(["Game, accolades", <Accolades config={gcfg} data={done} />]);
  cases.push(["Game, the rebound", <ReboundPanel config={gcfg} data={base} setData={noop2} activityType="game" week={3} isAdmin={false} userName={who} />]);
}

// The instructor's own class site, which is where the way in to seeing the class
// as a student lives. The role is read off localStorage on the first render, so
// the stub answers to the admin key for this one render and goes back to
// answering nothing straight after.
{
  const admin = cfg0.storageKey + "-admin";
  const was = globalThis.localStorage.getItem;
  globalThis.localStorage.getItem = (k) => (k === admin ? "1" : was(k));
  for (const [where, px] of [["laptop", LAPTOP], ["phone", PHONE]]) {
  try {
    const html = atWidth(px, () => renderToString(<ClassApp config={cfg0} />));
    // The header used to carry thirteen controls and now carries two: the
    // Dashboard, and a menu holding everything else. So this checks the closed
    // header, which is all a render test can see.
    //
    // What that costs, said out loud: the roster picker, the class switcher and
    // the teaching links are inside the menu and no longer appear in the
    // markup until somebody clicks. Nothing checks their contents any more.
    // Andrew's apps are tabs in his bar; on a phone, where the bar is the
    // compact header, they stay behind the Apps button.
    const reachable = html.includes('href="' + cfg0.path + '/dashboard"') || /aria-haspopup="menu"/.test(html);
    if (!reachable) {
      console.error(`  FAIL  class site, instructor, ${where}: no way through to the dashboard`); failedEarly++; }
    // And the header stays small. Counting the tap targets across the top is a
    // blunt measure and it is the one that would have caught this drifting.
    // Every bar across the top, not the first one. The phone and the desktop are
    // separate headers, and only the desktop got tidied: the phone kept four
    // theme buttons, a badge and a two-button role toggle for a day, because
    // this check stopped at the first bar it found.
    const bars = html.split("borderBottom:1px solid").slice(1);
    bars.forEach((bar, i) => {
      const taps = (bar.slice(0, 3000).match(/min-height:44px/g) || []).length;
      if (taps > 6) {
        console.error(`  FAIL  class site, instructor, ${where}: ${taps} tap targets across top bar ${i + 1}`); failedEarly++; }
    });
    // And the picker belongs in the menu, not loose in a bar.
    //
    // The marker is what only a picker renders. Looking for a theme's name
    // matched a CSS comment inside the chrome stylesheet, which is the third
    // time a check here has matched a string that lives somewhere else.
    const beforeMenu = html.split('aria-haspopup="menu"')[0] || "";
    if (beforeMenu.includes('aria-label="Theme"')) {
      console.error(`  FAIL  class site, ${where}: the theme picker is loose in the header instead of inside the menu`); failedEarly++; }
  } catch (err) {
    console.error(`  FAIL  class site, instructor, ${where}: ` + err.message); failedEarly++;
  }
  }
  globalThis.localStorage.getItem = was;
}

// The three doors, on all three surfaces.
//
// The class page, the dashboard and the repository each used to know about some
// of the others: two of the nine ways across were missing outright and the rest
// were three different shapes in three different places. One strip fixed that,
// and this is the check that keeps it fixed, because the way it broke the first
// time was one surface at a time over months.
//
// Each surface must carry the strip, all three doors must be in it, and exactly
// one must be marked as where I am — a strip with two current entries is a
// strip that has stopped tracking the page it is on.
{
  const admin = cfg0.storageKey + "-admin";
  const was = globalThis.localStorage.getItem;
  globalThis.localStorage.getItem = (k) => (k === admin ? "1" : was(k));
  warmClassData(cfg0.storageKey, warmShapes(cfg0, true));
  // Every screen a surface can return, not just the one it settles on. The
  // strip went in and was missing from four of these, because each of the three
  // files returns early before its own header: a dashboard still loading, a
  // class with no dates yet, and a repository still reading. Those are exactly
  // the screens I want to leave, and Back was the only way off them.
  //
  // A class with no dates is not hypothetical. COMM 118 sits on that screen
  // until its term is built.
  const noDates = { ...cfg0, storageKey: "smoke-nav-nodates", scheduleWeeks: [] };
  warmClassData(noDates.storageKey, { schedule: [] });
  const unloaded = { ...cfg0, storageKey: "smoke-nav-unwarmed" };
  // The class page carries the three doors as TABS rather than as the strip —
  // on a phone they are the bottom bar, which is where Andrew wanted them. So
  // it is checked separately, below.
  const surfaces = [
    ["dashboard", () => renderToString(<Dashboard config={cfg0} />)],
    ["dashboard, still loading", () => renderToString(<Dashboard config={unloaded} />)],
    ["dashboard, a class with no dates", () => renderToString(<Dashboard config={noDates} />)],
    ["repository", () => renderToString(<RepoPage />)],
  ];
  for (const [where, render] of surfaces) {
    try {
      const html = render();
      if (!html.includes('aria-label="Teaching surfaces"')) {
        console.error(`  FAIL  ${where}: no strip, so two of the three doors are missing`); failedEarly++; continue;
      }
      // Only the strip's own markup. The class page marks the open card with
      // aria-current too, so counting across the whole page counts that.
      const strip = (html.split('aria-label="Teaching surfaces"')[1] || "").split("</nav>")[0];
      // The same five tabs as the class page, each a link back to it, and the
      // Apps button, which is where the Dashboard and the Repository live now.
      for (const door of ["Home", "Schedule", "Challenges", "Class", "More"]) {
        if (!strip.includes(">" + door + "<")) {
          console.error(`  FAIL  ${where}: the strip has no ${door} tab`); failedEarly++; }
      }
      for (const app of ["Dashboard", "Repository", "Grade view", "Around the Horn"]) {
        if (!strip.includes(">" + app + "<")) {
          console.error(`  FAIL  ${where}: the bar has no ${app} tab`); failedEarly++; }
      }
      if (/>Apps<span/.test(html)) {
        console.error(`  FAIL  ${where}: the instructor's bar still has the Apps button`); failedEarly++; }
      const current = (strip.match(/aria-current="page"/g) || []).length;
      if (current > 1) {
        console.error(`  FAIL  ${where}: ${current} entries in the strip marked as the current page`); failedEarly++; }
    } catch (err) {
      console.error(`  FAIL  ${where}: ` + err.message); failedEarly++;
    }
  }

  // The class page, both widths. An instructor's tabs are Home, Dashboard,
  // Repository, More — the three doors among them — and the three cards that
  // used to be tabs are gone from the bar because they are already in his grid.
  // A student's tabs must not change at all.
  for (const [where, px] of [["laptop", LAPTOP], ["phone", PHONE]]) {
    try {
      const html = atWidth(px, () => renderToString(<ClassApp config={cfg0} />));
      // Andrew's tabs are the students' tabs; his extra reach is in Apps.
      ["Schedule", "Challenges", "Class", "More"].forEach(tab => {
        if (!html.includes(">" + tab + "<")) {
          console.error(`  FAIL  class page, instructor, ${where}: no ${tab} tab`); failedEarly++; }
      });
      if (where === "laptop" && !html.includes(">Grade view<")) {
        console.error(`  FAIL  class page, instructor, ${where}: the apps are not tabs in the bar`); failedEarly++; }
      // The duplicates are gone: a tab AND a card for the same thing was the
      // whole complaint. Schedule still exists as a card, just not as a tab.
      const bar = html.split('aria-haspopup="menu"')[0] || "";
      if (/>Community</.test(bar)) {
        console.error(`  FAIL  class page, instructor, ${where}: Community is still a tab as well as a card`); failedEarly++; }
    } catch (err) {
      console.error(`  FAIL  class page, instructor, ${where}: ` + err.message); failedEarly++;
    }
  }
  globalThis.localStorage.getItem = was;

  // And the student's bar is untouched.
  try {
    const html = atWidth(PHONE, () => renderToString(<ClassApp config={cfg0} />));
    ["Schedule", "Challenges", "Class"].forEach(tab => {
      if (!html.includes(">" + tab + "<")) {
        console.error(`  FAIL  class page, student: ${tab} left the student's tabs`); failedEarly++; }
    });
    // Andrew, 2026-09-15: the next class is the hero, then Assignments, then
    // Class, Grades toward the bottom and Games at the very bottom.
    const at = (t) => html.indexOf(t);
    if (html.includes('aria-label="Next class"')) {
      const order = ['aria-label="Next class"', ">Challenges</span>", ">Message with Dr. Ishak</span>", ">Class</span>", ">Games</span>"].map(at);
      if (order.some(n => n < 0) || order.some((n, i) => i && n < order[i - 1])) {
        console.error("  FAIL  class page, student: the home page is not Next class, Challenges, Messages, Class, Games: " + JSON.stringify(order)); failedEarly++; }
    } else {
      console.error("  FAIL  class page, student: the home page has no Next class hero"); failedEarly++;
    }
    if (html.includes(">Community<")) {
      console.error("  FAIL  class page, student: Community is still on the page"); failedEarly++; }
  } catch (err) {
    console.error("  FAIL  class page, student: " + err.message); failedEarly++;
  }

  // A student cannot switch themselves to the instructor side. The switch sat
  // in every student's menu and the page believed the flag it set.
  try {
    const was = globalThis.localStorage.getItem;
    const cfgS = { ...cfg0, students: [{ id: "ada", name: "Ada Lovelace", email: "ada@student.test" }] };
    const SESSION_S = JSON.stringify({ access_token: "t", refresh_token: "r", expires_at: 4102444800, user: { id: "u-ada", email: "ada@student.test" } });
    globalThis.localStorage.getItem = (k) => (k === "classes-session" ? SESSION_S : k === cfgS.storageKey + "-admin" ? "1" : k === cfgS.storageKey + "-user" ? "Ada Lovelace" : null);
    warmClassData(cfgS.storageKey, { ...warmShapes(cfgS, true), students: cfgS.students });
    const html = atWidth(PHONE, () => renderToString(<ClassApp config={cfgS} />));
    globalThis.localStorage.getItem = was;
    if (!html.includes('aria-label="Next class"')) {
      console.error("  FAIL  class page, student with the old instructor flag: the page did not render as the student"); failedEarly++; }
    if (html.includes('href="' + cfgS.path + '/dashboard"') || html.includes("Nothing to grade") || html.includes("Pin link")) {
      console.error("  FAIL  class page, student with the old instructor flag: the student got the instructor side"); failedEarly++; }
    // The top-right button is Apps for a student, not their name.
    if (!/aria-label="Menu"[^>]*>Apps<span/.test(html)) {
      console.error("  FAIL  class page, student: the top-right button does not say Apps"); failedEarly++; }
    if (html.includes('href="/repo"')) {
      console.error("  FAIL  class page, student: the repository is showing to a student"); failedEarly++; }
  } catch (err) {
    console.error("  FAIL  class page, student: " + err.message); failedEarly++;
  }
}

// Every class colour, measured where it is actually used.
//
// check-tokens measures the theme's own palette; a class colour lives in its
// config and nothing measured it. Crimson as text on the dark card is 2.15:1
// and purple is 3.03:1, so Directions, a pinned link and Show all were close
// to invisible after dark. Each class carries accentDark for those words.
{
  const say = (m) => { console.error("  FAIL  class colours: " + m); failedEarly++; };
  const chan = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = (h) => { const [r, g, b] = chan(h).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (x, y) => { const p = lum(x), q = lum(y); return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05); };
  const DAY = { card: "#ffffff", page: "#fafaf9" };
  const NIGHT = { card: "#1f1a16", page: "#171310" };
  ENGINE_LIST.forEach(c => {
    if (!/^#[0-9a-f]{6}$/i.test(c.accent || "")) { say(c.code + " has no accent to measure"); return; }
    // White sits on the accent, so the accent is a background anywhere.
    if (ratio(c.accent, "#ffffff") < 4.5) say(`${c.code}: white on ${c.accent} is ${ratio(c.accent, "#ffffff").toFixed(2)}:1`);
    Object.entries(DAY).forEach(([where, g]) => {
      if (ratio(c.accent, g) < 4.5) say(`${c.code}: ${c.accent} as text on the ${where} by day is ${ratio(c.accent, g).toFixed(2)}:1`);
    });
    if (!c.accentDark) { say(c.code + " has no accentDark, so its links vanish after dark"); return; }
    Object.entries(NIGHT).forEach(([where, g]) => {
      if (ratio(c.accentDark, g) < 4.5) say(`${c.code}: ${c.accentDark} as text on the ${where} at night is ${ratio(c.accentDark, g).toFixed(2)}:1`);
    });
  });
  // And the page actually hands the lifted value to the words.
  const html = renderToString(<ClassApp config={cfg0} />);
  if (!html.includes("--ca-accent-ink")) say("the class site never sets the lifted accent");
}

// One bar on every page Andrew opens. Andrew, 2026-09-15: "every page that i
// access as instructor, including grade view, has to have the exact same top
// nav." Checked from the source, because the pages are routed in App.jsx and
// a new page added there without the bar is exactly the mistake to catch.
{
  const say = (m) => { console.error("  FAIL  one bar: " + m); failedEarly++; };
  const { readFileSync: readSrc } = await import("node:fs");
  const app = readSrc(new URL("../src/App.jsx", import.meta.url), "utf8");
  // Pages that draw TopNav themselves.
  const SELF = { ClassApp: "engine/ClassApp.jsx", Dashboard: "engine/Dashboard.jsx", RepoPage: "engine/RepoPage.jsx", GamesPage: "engine/GamesPage.jsx" };
  // What the projector shows, and the page you sign in on before you are anybody.
  const EXEMPT = new Set(["ClassroomView", "EnginePresenter", "TriviaPresenter4", "TriviaPresenter118", "LoginPage", "InstructorGate", "InstructorBar", "RetreatPage"]);
  const routed = [...app.matchAll(/return\s*\(?\s*<([A-Z]\w*)/g), ...app.matchAll(/<InstructorGate[^>]*>\s*<([A-Z]\w*)/g)].map(m => m[1]);
  [...new Set(routed)].forEach(name => {
    if (EXEMPT.has(name) || SELF[name]) return;
    if (!new RegExp("<InstructorBar[^>]*>\\s*<" + name + "\\b").test(app)) say(name + " is routed without the top bar");
  });
  Object.entries(SELF).forEach(([name, file]) => {
    const src = readSrc(new URL("../src/" + file, import.meta.url), "utf8");
    if (!src.includes("<TopNav")) say(name + " draws no top bar");
    // Exactly the same bar: nothing handed into it but the theme furniture
    // the class page carries for a student's theme.
    const calls = [...src.matchAll(/<TopNav[\s\S]*?\/>/g)].map(m => m[0]);
    calls.forEach(c => { if (/moreNode=/.test(c) || (name !== "ClassApp" && /right=/.test(c))) say(name + " adds its own controls to the top bar"); });
  });
  try {
    const html = renderToString(<InstructorBar config={cfg0} always><div>page</div></InstructorBar>);
    if (!html.includes('aria-label="Teaching surfaces"') || !html.includes(">Challenges<") || !html.includes(">Grade view<")) say("the wrapper does not draw the same bar");
  } catch (err) { say("the wrapper threw: " + err.message); }
}

// Four themes, and a student switching between them.
//
// Every colour in the engine is a custom property now, so a theme that forgets
// one does not break loudly: the value falls through to Clean and a dark theme
// quietly gets black text on a black card. So the stylesheet is checked for
// every property of every theme, and the class site is rendered under each one.
{
  const say = (m) => { console.error("  FAIL  theme: " + m); failedEarly++; };
  const css = themeCSS();
  const KEYS = Object.keys(varsOf(THEME.clean));

  const NAMED = ["clean", "snapchat", "crashing"];
  if (THEMES.length !== NAMED.length) say(`${THEMES.length} themes where the ${NAMED.length} are ` + NAMED.join(", "));
  NAMED.forEach(t => {
    if (!THEMES.includes(t)) say(t + " is not in the list a student can pick from");
    if (!THEME_LABELS[t]) say(t + " has no name a student could read");
  });
  // Clean also sits on bare :root, so a surface that sets nothing still draws.
  if (!css.includes(":root{")) say("Clean is not on bare :root, so an unthemed surface has no colours at all");
  THEMES.forEach(t => {
    if (!css.includes(`[data-theme="${t}"]{`)) say(t + " has no block in the stylesheet");
    const block = (css.split(`[data-theme="${t}"]{`)[1] || "").split("}")[0];
    KEYS.forEach(k => {
      // A missing value does not vanish from the stylesheet: it renders as the
      // literal word undefined, which paints nothing and warns nobody. So the
      // presence of the property name proves less than the shape of its value.
      const m = block.match(new RegExp("(?:^|;)" + k + ":([^;]*)"));
      if (!m) say(`${t} never sets ${k}`);
      else if (!m[1].trim() || m[1].includes("undefined")) say(`${t} sets ${k} to "${m[1]}"`);
    });
    if (!fontHref(t).startsWith("https://fonts.googleapis.com/")) say(t + " asks for fonts from somewhere unexpected");
  });
  // A student's own screen: the whole class site, under each theme.
  THEMES.forEach(t => {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : was(k));
    [["laptop", LAPTOP], ["phone", PHONE]].forEach(([where, px]) => {
      try {
        const html = atWidth(px, () => renderToString(<ClassApp config={cfg0} />));
        if (!html.includes(`data-theme="${t}"`)) say(`${t} did not reach the class site's root on the ${where}`);
        if (!html.includes("--text-primary")) say(`${t}: the ${where} shipped without the stylesheet`);
      } catch (err) { say(`${t} threw on the ${where}: ` + err.message); }
    });
    globalThis.localStorage.getItem = was;
  });
  // A theme nobody has heard of falls back rather than painting nothing.
  {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? "vaporwave" : was(k));
    try {
      const html = renderToString(<ClassApp config={cfg0} />);
      if (!html.includes('data-theme="clean"')) say("an unknown theme did not fall back to Clean");
    } catch (err) { say("an unknown theme threw — " + err.message); }
    globalThis.localStorage.getItem = was;
  }
}

// A theme is furniture as well as colour, and the furniture is conditional, so
// each piece is rendered under a theme that wants it and one that does not.
{
  const say = (m) => { console.error("  FAIL  chrome: " + m); failedEarly++; };
  const off = ["clean"];
  const html = (el) => renderToString(el);
  // Crashing Out brings a marquee, a mascot, a sponsor and a legal line.
  if (!html(<ThemeTopper theme="crashing" lines={["a", "b"]} />).includes("animation:tcMarquee")) say("no marquee on Crashing Out");
  if (!html(<TubeySays theme="crashing" seed={1} />).includes("<svg")) say("Tubey is not drawn on Crashing Out");
  const sp = html(<ThemeSponsor theme="crashing" />);
  if (!sp.includes("homeworktubes.com")) say("the sponsor bar does not link to Homework Tubes");
  if (!sp.includes("HOMEWORK TUBES")) say("the sponsor bar does not name Homework Tubes");
  if (!html(<ThemeLegal theme="crashing" />).includes("not permitted")) say("Tubey's homework ban is missing");
  // Snapchat brings a streak and a ringed face.
  if (!html(<ThemeBadge theme="snapchat" points={140} />).includes("140")) say("no streak on Snapchat");
  if (!html(<Avatar theme="snapchat" name="Ada Byron" />).includes("linear-gradient")) say("no story ring on Snapchat");
  if (html(<Avatar theme="clean" name="Ada Byron" />).includes("linear-gradient")) say("Clean grew a story ring");
  // The calm themes get none of it.
  off.forEach(t => {
    [["marquee", <ThemeTopper theme={t} lines={["a"]} />], ["Tubey", <TubeySays theme={t} />],
     ["a sponsor", <ThemeSponsor theme={t} />], ["a legal line", <ThemeLegal theme={t} />],
     ["a streak", <ThemeBadge theme={t} points={9} />]].forEach(([what, el]) => {
      if (html(el) !== "") say(`${t} rendered ${what}, and should render nothing`);
    });
    if (cardStyle(t, 3).border !== "var(--card-border)") say(t + " does not use the system's card border");
  });
  // Crashing Out rotates its card borders, so a grid is never one card six times.
  if (cardStyle("crashing", 0).border === cardStyle("crashing", 1).border) say("Crashing Out draws every card the same");
  // Cut up, not rounded. Four different corners and a lean.
  const cut = cardStyle("crashing", 0);
  if (String(cut.borderRadius).split(/\s+/).length < 4) say("a Crashing Out card is still a rounded rectangle");
  if (!String(cut.transform || "").includes("rotate")) say("a Crashing Out card sits perfectly square");
  if (cardStyle("clean", 0).transform) say("a Clean card is tilted, and should not be");
  // And the treatment has to actually reach the page, which it did not for a
  // whole pass: cardStyle was exported and nothing called it.
  ["snapchat", "crashing"].forEach(t => {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : was(k));
    try {
      const html = renderToString(<ClassApp config={cfg0} />);
      // Counted, not looked for, and looking for the right thing.
      //
      // Two mistakes here before this worked. Checking whether a string appears
      // passed with every card unwired, because the sponsor bar carries the
      // same shadow. And checking for a literal shadow only ever works on
      // Crashing Out, whose cards are computed; the other three arrive through
      // var(--card-shadow) and resolve in CSS, so the hex is never in the
      // markup at all.
      const want = t === "crashing" ? "6px 6px 0 #1f2937" : "var(--card-shadow)";
      const n = html.split(want).length - 1;
      if (n < 3) say(`${t}: ${n} element(s) wear the theme's card, so the grid is not taking it`);
    } catch (err) { say(t + ": " + err.message); }
    globalThis.localStorage.getItem = was;
  });
  // Both faces of the status mark.
  if (!html(<StatusMark theme="snapchat" tone="live" label="new" />).includes("rotate(45deg)")) say("no diamond on Snapchat");
  if (html(<StatusMark theme="clean" tone="live" label="new" />).includes("rotate(45deg)")) say("Clean drew a diamond");
}

// The faces, which were defined and unused for a whole pass. A theme that
// declares Bangers and then renders Outfit is not a theme, and nothing said so.
{
  const say = (m) => { console.error("  FAIL  fonts: " + m); failedEarly++; };
  const FACE = {
    clean:    { body: "Outfit", display: "Outfit",  label: "IBM Plex Mono" },
    snapchat: { body: "Nunito", display: "Nunito",  label: "Nunito" },
    crashing: { body: "Shantell Sans", display: "Bangers", label: "Lilita One" },
  };
  const css = themeCSS();
  Object.entries(FACE).forEach(([t, want]) => {
    const block = (css.split(`[data-theme="${t}"]{`)[1] || "").split("}")[0];
    Object.entries(want).forEach(([slot, face]) => {
      const m = block.match(new RegExp("(?:^|;)--font-" + slot + ":([^;]*)"));
      if (!m) say(`${t} sets no --font-${slot}`);
      else if (!m[1].includes(face)) say(`${t}'s ${slot} face is ${m[1].trim()}, not ${face}`);
    });
    // The file the browser fetches has to carry the faces the block names.
    const href = fontHref(t);
    Object.values(want).forEach(face => {
      const q = face.replace(/ /g, "+");
      if (!href.includes(q)) say(`${t} asks for ${face} and never loads it`);
    });
  });
  // The two loud themes must not quietly render the calm one's face.
  ["snapchat", "crashing"].forEach(t => {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : was(k));
    try {
      const html = renderToString(<ClassApp config={cfg0} />);
      if (!html.includes("var(--font-body)")) say(t + ": the class site hardcodes a face instead of taking the theme's");
      if (!html.includes("var(--font-display)")) say(t + ": no heading takes the display face");
    } catch (err) { say(t + ": " + err.message); }
    globalThis.localStorage.getItem = was;
  });
}

// Everything added in the last pass, checked the way the earlier misses taught:
// does the piece render for the theme that wants it, stay away from the ones
// that do not, and actually reach the page it was written for.
{
  const say = (m) => { console.error("  FAIL  chrome: " + m); failedEarly++; };
  const html = (el) => renderToString(el);
  const ROSTER = [{ name: "Ada Byron", id: "s1" }, { name: "Bo Diaz", id: "s2" }, { name: "Kaz Osei", id: "s3" }];

  // The page has to move. A six-stop gradient painting once is a gradient.
  if (!CHROME_CSS.includes('[data-theme="crashing"]')) say("nothing animates the Crashing Out page");
  if (!CHROME_CSS.includes("background-size:300% 300%")) say("the gradient has no room to travel, so the wobble does nothing");
  if (!CHROME_CSS.includes("prefers-reduced-motion")) say("the wobble ignores reduced motion");
  // The strip is only readable if each item gets a few seconds of screen.
  if (MARQUEE_SECONDS_PER_ITEM < 2) say("each item gets " + MARQUEE_SECONDS_PER_ITEM + "s, which is faster than anybody reads one");
  if (marqueeSeconds(125) <= marqueeSeconds(20)) say("a longer strip does not take longer, so more facts means a faster banner");

  if (!html(<ThemeStickers theme="crashing" />).includes("tcTwinkle")) say("no stickers on Crashing Out");
  if (!html(<TubeyPeek theme="crashing" />).includes("<svg")) say("Tubey does not peek");
  const bar = html(<StoryBar theme="snapchat" roster={ROSTER} me="Ada Byron" />);
  if (!bar.includes("your story")) say("the story bar has no story of your own");
  if (!bar.includes("linear-gradient")) say("the story bar draws no rings");
  if (bar.includes("ada")) say("the story bar shows you to yourself");
  if (!html(<ThemeIdentity theme="snapchat" points={12} />).includes("snap score")) say("no snap score");
  if (!html(<ThemeCamera theme="snapchat" />).includes("4px 4px 0 #000")) say("no camera in the bar");

  ["clean"].forEach(t => {
    [["stickers", <ThemeStickers theme={t} />], ["Tubey peeking", <TubeyPeek theme={t} />],
     ["a story bar", <StoryBar theme={t} roster={ROSTER} me="Ada Byron" />],
     ["a snap score", <ThemeIdentity theme={t} points={4} />], ["a camera", <ThemeCamera theme={t} />]]
      .forEach(([what, el]) => { if (html(el) !== "") say(`${t} rendered ${what}`); });
  });

  // And the pieces have to land on the class site, not just exist.
  const onSite = (t, needle, what) => {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : was(k));
    try {
      const out = renderToString(<ClassApp config={cfg0} />);
      if (!out.includes(needle)) say(`${t}: ${what} never reaches the class site`);
    } catch (err) { say(t + ": " + err.message); }
    globalThis.localStorage.getItem = was;
  };
  onSite("snapchat", "your story", "the story bar");
  onSite("snapchat", "snap score", "the snap score");
  onSite("crashing", "tcTwinkle", "the stickers");
  // Not the hex: the stylesheet ships every theme's block, so that string is in
  // the output whatever theme is on. The marker is a heading using the variable.
  onSite("crashing", "text-shadow:var(--display-shadow)", "the heading shadow");
  onSite("clean", "text-shadow:var(--display-shadow)", "the heading shadow");
}

// The leader, and the championships. Both are Crashing Out only, both have to
// say something true, and the facts are the one part of this theme that can be
// factually wrong, so they are held to a shape.
{
  const say = (m) => { console.error("  FAIL  crashing: " + m); failedEarly++; };
  const html = (el) => renderToString(el);
  const ROSTER = [{ name: "Ada Byron", id: "s1" }, { name: "Bo Diaz", id: "s2" }];
  const LOG = [{ studentId: "s1", amount: 30 }, { studentId: "s2", amount: 90 }];

  // Bo leads Ada by 60, and the line says so rather than saying something vague.
  const toAda = html(<ClassLeader theme="crashing" roster={ROSTER} log={LOG} me="Ada Byron" />);
  if (!toAda.includes("Bo")) say("the leader does not say who they are");
  if (!toAda.includes("60")) say("the leader never names the gap, so the line says nothing true");
  if (!toAda.includes("TOP OF THE CLASS")) say("the leader is not marked as the leader");
  // The leader looking at their own screen must not be taunted by themselves.
  const toBo = html(<ClassLeader theme="crashing" roster={ROSTER} log={LOG} me="Bo Diaz" />);
  if (toBo.includes("ahead of you")) say("the leader is taunting themselves");
  if (!toBo.includes("first")) say("the leader is not told they are first");
  // Nobody has scored, so nobody is leading.
  if (html(<ClassLeader theme="crashing" roster={ROSTER} log={[]} me="Ada Byron" />) !== "")
    say("a leader appeared before anybody scored a point");
  ["clean", "snapchat"].forEach(t => {
    if (html(<ClassLeader theme={t} roster={ROSTER} log={LOG} me="Ada Byron" />) !== "")
      say(t + " grew a class leader");
  });

  // The facts. Shape, not truth: nothing here can check a score, so the check
  // is that every line names a season in range and reads as a result.
  if (ALL_FACTS.length < 90) say("only " + ALL_FACTS.length + " championships, which is not thirty-five years of three sports");
  ALL_FACTS.forEach(f => {
    const m = f.match(/^(\d{4}) · /);
    if (!m) say("a fact does not start with its season: " + f);
    else {
      const y = Number(m[1]);
      if (y < 1990 || y > 2024) say("a fact is outside the range the file claims: " + f);
    }
    if (f !== f.toUpperCase()) say("a fact is not in the marquee's case: " + f);
  });
  // Every fact rotates, in this reader's own order. The first version put four
  // on the strip and repeated those four forever, so a student saw the same
  // three championships all term.
  const mine = shuffledFacts(7), again = shuffledFacts(7), theirs = shuffledFacts(8);
  if (mine.length !== ALL_FACTS.length) say(`only ${mine.length} of ${ALL_FACTS.length} facts rotate`);
  if (new Set(mine).size !== mine.length) say("a shuffle repeats a result");
  if (mine.join("|") !== again.join("|")) say("the same reader gets a different order each render");
  if (mine.join("|") === theirs.join("|")) say("every reader gets the same order");

  // And the whole lot has to reach the strip, not a sample of it.
  const strip = html(<ThemeTopper theme="crashing" lines={["A CLASS FACT"]} seed={11} />);
  if (!strip.includes("A CLASS FACT")) say("the marquee dropped the class's own line");
  // renderToString escapes an apostrophe, and one of these is "THE A'S", so the
  // strip is decoded before matching rather than the check being loosened.
  const plain = strip.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&");
  const onStrip = ALL_FACTS.filter(f => plain.includes(f)).length;
  if (onStrip !== ALL_FACTS.length) say(`${onStrip} of ${ALL_FACTS.length} championships reached the marquee`);
  const dur = Number((strip.match(/animation:tcMarquee (\d+)s/) || [])[1] || 0);
  if (dur < 200) say("the strip carries every fact and crosses in " + dur + "s, which nobody can read");
}

// Clean at night, and the override.
//
// Auto follows the machine and is the default. Day and night are overrides, and
// each has to beat the rule it overrides, which is a specificity question
// rather than an opinion. So the shape of the selectors is the thing checked.
{
  const say = (m) => { console.error("  FAIL  dark: " + m); failedEarly++; };
  const css = themeCSS();
  const q = "@media (prefers-color-scheme: dark)";
  if (!css.includes(q)) say("nothing follows the system after dark");
  const night = css.split(q)[1] || "";

  // Auto: the machine decides, unless somebody asked for day.
  if (!night.includes(':root:not([data-mode="day"])')) say("a surface with no theme stays light after dark");
  if (!night.includes('[data-theme="clean"]:not([data-mode="day"])')) say("Clean does not follow the machine");
  // Forced day works by the media query stepping aside, so the exclusion is the
  // whole mechanism and its absence would make Day do nothing in a dark OS.
  if (!/:not\(\[data-mode="day"\]\)\{/.test(night)) say("asking for Day would not survive a dark system");

  // Forced night lives outside the media query, or it would only work at night,
  // which is the one time nobody needs it.
  const forced = css.split("\n").filter(l => l.includes('[data-mode="night"]'));
  if (!forced.length) say("asking for Night does nothing");
  if (forced.some(l => l.startsWith("@media"))) say("Night only works when the machine already says night");
  // Two attribute selectors beat one, which is why no !important is needed.
  if (!forced.every(l => l.startsWith('[data-theme="clean"][data-mode="night"]')))
    say("the Night rule is not specific enough to beat the daytime block");
  if (css.includes("!important")) say("something is winning by force rather than by specificity");

  // Every property the day has, the night has, or a value falls through and a
  // dark page gets one daytime colour in the middle of it.
  const KEYS = Object.keys(varsOf(THEME.clean));
  const cleanNight = (forced[0] || "").split("{")[1] || "";
  KEYS.forEach(k => {
    const m = cleanNight.match(new RegExp("(?:^|;)" + k + ":([^;]*)"));
    if (!m) say(`Clean's night never sets ${k}`);
    else if (!m[1].trim() || m[1].includes("undefined")) say(`Clean's night sets ${k} to "${m[1]}"`);
  });
  // And it is genuinely dark, rather than the day repeated.
  const dayPage = (css.split('[data-theme="clean"]{')[1] || "").split("}")[0].match(/--surface-page:([^;]*)/);
  const nightPage = cleanNight.match(/--surface-page:([^;]*)/);
  if (dayPage && nightPage && dayPage[1] === nightPage[1]) say("Clean's night is the same page as its day");

  // The two loud themes have no night and offer no control for one.
  ["snapchat", "crashing"].forEach(t => {
    if (night.includes(`[data-theme="${t}"]`)) say(t + " grew a dark mode, and should not have one");
    if (hasNight(t)) say(t + " claims to have a night");
    if (renderToString(<DayNightPicker theme={t} mode="auto" onPick={noop} />) !== "")
      say(t + " offers a day and night control that would do nothing");
  });
  // Clean offers all three.
  const ctl = renderToString(<DayNightPicker theme="clean" mode="auto" onPick={noop} />);
  ["Auto", "Day", "Night"].forEach(w => { if (!ctl.includes(w)) say("the control never offers " + w); });
  if (!ctl.includes('aria-checked="true"')) say("the control shows nothing as chosen");

  // And the choice reaches the page.
  [["auto", LAPTOP], ["night", PHONE]].forEach(([m, px]) => {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-mode") ? m : k.endsWith("-theme") ? "clean" : was(k));
    try {
      const html = atWidth(px, () => renderToString(<ClassApp config={cfg0} />));
      if (!html.includes(`data-mode="${m}"`)) say(`asking for ${m} never reaches the page root`);
    } catch (err) { say(`${m} threw: ` + err.message); }
    globalThis.localStorage.getItem = was;
  });
  // A mode nobody has heard of falls back rather than breaking the page.
  {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-mode") ? "dusk" : was(k));
    try {
      const html = renderToString(<ClassApp config={cfg0} />);
      if (!html.includes('data-mode="auto"')) say("an unknown mode did not fall back to auto");
    } catch (err) { say("an unknown mode threw: " + err.message); }
    globalThis.localStorage.getItem = was;
  }
}

cases.push(["Day and night control", <DayNightPicker theme="clean" mode="night" onPick={noop} />, "Auto"]);

cases.push(["Tubey", <Tubey size={120} />]);
cases.push(["Crashing Out, the leader speaks", <ClassLeader theme="crashing"
  roster={[{ name: "Ada Byron", id: "s1" }, { name: "Bo Diaz", id: "s2" }]}
  log={[{ studentId: "s2", amount: 90 }]} me="Ada Byron" />, "TOP OF THE CLASS"]);
cases.push(["Snapchat, the story bar", <StoryBar theme="snapchat" roster={[{ name: "Bo Diaz" }, { name: "Kaz Osei" }]} me="Ada Byron" />, "your story"]);
// The furniture on the four surfaces it was just carried to. A room screen
// under Crashing Out has to hold the worm; under Clean it must hold nothing.
{
  const say = (m) => { console.error("  FAIL  chrome: " + m); failedEarly++; };
  const withTheme = (t, el) => {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : was(k));
    try { return renderToString(el); } catch (err) { say(t + ": " + err.message); return ""; }
    finally { globalThis.localStorage.getItem = was; }
  };
  const SURFACES = [["room screen", <ClassroomView config={cfg0} />],
                    ["ask page", <AskPage config={cfg0} />],
                    ["discussion board", <BoardPage config={cfg0} />],
                    ["game", <GamePage config={cfg0} />]];
  // The name tcMarquee is in the keyframes on every theme, because the
  // stylesheet ships whole. What is conditional is the element that uses it, so
  // the marker is the inline animation rather than the name on its own. The
  // first version of this test checked the name and therefore checked nothing.
  const RUNS = "animation:tcMarquee";
  SURFACES.forEach(([name, el]) => {
    const loud = withTheme("crashing", el);
    if (!loud.includes(RUNS)) say(`no marquee on the ${name} under Crashing Out`);
    if (!loud.includes('data-theme="crashing"')) say(`the ${name} did not take the theme`);
    const calm = withTheme("clean", el);
    if (calm.includes(RUNS)) say(`Clean put a marquee on the ${name}`);
    if (calm.includes("HOMEWORKTUBES")) say(`Clean put a sponsor on the ${name}`);
  });
  if (!withTheme("crashing", <ClassroomView config={cfg0} />).includes("Tubey the Worm")) say("Tubey is not on the wall");
  if (withTheme("clean", <ClassroomView config={cfg0} />).includes("Tubey the Worm")) say("Tubey wandered onto a Clean wall");
}
cases.push(["Crashing Out, the sponsor", <ThemeSponsor theme="crashing" />, "HOMEWORKTUBES.COM"]);
cases.push(["Crashing Out, Tubey talking", <TubeySays theme="crashing" seed={2} />]);
cases.push(["Theme picker, full", <ThemePicker theme="clean" onPick={noop} />, "Crashing Out"]);
{
  const say = (m) => { console.error("  FAIL  theme: " + m); failedEarly++; };
  [["full", <ThemePicker theme="clean" onPick={noop} />],
   ["compact", <ThemePicker theme="clean" onPick={noop} compact />]].forEach(([shape, el]) => {
    const out = renderToString(el);
    THEMES.forEach(t => {
      if (!out.includes(THEME_LABELS[t])) say(`the ${shape} picker never names ${THEME_LABELS[t]}`);
    });
  });
}
cases.push(["Theme picker, in the header", <ThemePicker theme="snapchat" onPick={noop} compact />, "Crashing Out"]);

// The two library panels read as the day plan, inverted.
//
// A row on the plan is a solid block of its kind's colour carrying white text.
// Activities and Readings are the same family the other way round: one grey
// card with the words in that kind's colour. The palette was generated to CARRY
// white, which is the opposite job, so the ink is the swatch darkened to 85%
// per channel and check-contrast measures all twenty of them.
{
  const say = (m) => { console.error("  FAIL  library: " + m); failedEarly++; };
  const src = readFileSync(new URL("../src/engine/Dashboard.jsx", import.meta.url), "utf8");

  // One row shape, used by both panels.
  if (!src.includes(".lib-row{")) say("no library row style");
  const ideas = src.slice(src.indexOf("export function IdeasPanel"), src.indexOf("export function QuestionsPanel"));
  if (!ideas.includes("lib-row")) say("the activities panel does not use the library row");
  if (!src.includes('className="read-card"') || !src.slice(src.indexOf('className="read-card"'), src.indexOf('className="read-card"') + 900).includes("lib-row"))
    say("the readings card does not use the library row");
  // The filled pill is gone: the words carry the colour now.
  if (src.includes('className="read-kind"')) say("the readings pill survived, so the colour is in two places");
  if (ideas.includes('textTransform: "uppercase" }}>Idea<')) say("the activities pill survived");
  // Ink, not fill.
  const inks = (src.match(/"--ink": inkOf\(/g) || []).length;
  if (inks < 2) say(`${inks} row(s) take an ink colour, where both panels should`);
  // And the Answers tab is gone, with the boards themselves untouched.
  if (src.includes("AnswersPanel")) say("the Answers panel is back");
  const rail = src.match(/const LIVE_RAIL = (\[[^\]]*\]);/);
  if (rail && JSON.parse(rail[1].replace(/'/g, '"')).includes("answers")) say("the Answers tab is back in the rail");
  if (!src.includes("DB.open(prompt)")) say("casting a board no longer opens its thread, which the student page needs");

  // A card has to look like a card. At the sunk grey the edge against the white
  // panel was 1.10:1, which is no edge at all.
  const { inkOf, LIBRARY_CARD, LIBRARY_CARD_HOVER } = await import("../src/engine/colors.js");
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = (h) => { const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(h.slice(i, i + 2), 16) / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const edge = ratio(LIBRARY_CARD, "#ffffff");
  if (edge < 1.10) say(`the library card is ${edge.toFixed(2)}:1 against the panel behind it, which nobody can see as a card`);
  if (!src.includes("${LIBRARY_CARD}")) say("the library row does not sit on the library card");

  // The hover lifts toward white. Deeper reads as the obvious direction and it
  // breaks the ink: at 96% one step down puts teal at 4.17, under the line.
  if (!src.includes("${LIBRARY_CARD_HOVER}")) say("the library row hover is back to a hex nothing measures");
  if (lum(LIBRARY_CARD_HOVER) <= lum(LIBRARY_CARD)) say("the library row hover goes deeper than the card, which the ink cannot survive");

  // A tab has to sit on the panel it opens. The room preview used to stand
  // between them, so Questions named something a screen further down.
  const liveRail = src.slice(src.indexOf('<Rail side="Live"'), src.indexOf('<Rail side="Live"') + 1400);
  if (!liveRail.includes("head={")) say("the room preview is back between the Live tabs and their panel");
  // The card the rail draws. Andrew: "the readings cards are too tall."
  // Height came from a 44px row on a trackpad surface and a note strip that
  // rendered "+ note" on a reading with no note. Both are gone, and both come
  // back silently if anyone edits the wrong line.
  if (/\.lib-row\{[^}]*min-height:var\(--row-h/.test(src))
    say("the library row is back on the day plan's density height instead of the instructor target");
  if (!/\.lib-row\{[^}]*min-height:34px/.test(src)) say("the library row is no longer 34px");
  if (src.includes("+ note")) say("the + note placeholder is back in the note field");
  const bodyAt = src.indexOf('<div className="read-body">');
  if (bodyAt < 0) say("the readings card no longer has a note strip at all");
  else if (!/note \|\| adding \?/.test(src.slice(bodyAt - 140, bodyAt)))
    say("the note strip renders on a reading that has no note, which is where the height went");
  if (src.includes("lib-kind")) say("the kind label is back in the readings card, saying Reading inside Today's readings");
  if (!src.includes('<span className="lib-when">')) say("neither card shows the day it is placed on");
  if (src.includes("read-flag")) say("the on-the-day-plan flag is back in place of the date");
  if (!src.includes('className="dash-focus lib-peek"')) say("an idea no longer shows the first lines of how it runs");

  // placedOn is the whole date feature, so test the function rather than grep
  // for the call. A thing on several days shows the day nearest the one I am
  // looking at, which reads as the last time I used a seed when the seed is
  // behind me and the next time when the seed is ahead.
  const { placedOn, whenLabel } = await import("../src/engine/Dashboard.jsx");
  // Keys are the schedule's own short days, "Sep 23", not ISO dates. Feeding a
  // key to the Date constructor put "Invalid Date" on every card that shipped.
  const plans = {
    "Sep 1":  { slots: { a: { items: [{ blockId: "seed1" }, { schedItemId: "r9" }] } } },
    "Sep 11": { slots: { a: { items: [{ blockId: "seed1" }] } } },
    "Sep 5":  { slots: { a: { items: [{ blockId: "seed1" }] } } },
  };
  const at = placedOn(plans, "Sep 4");
  if (at.get("b:seed1") !== "Sep 5")
    say(`a seed on three days shows ${at.get("b:seed1")}, not the day nearest the one I am on`);
  if (at.get("r9") !== "Sep 1") say("a reading placed by its schedule row is not found");
  if (at.get("b:nothing")) say("placedOn invents a day for a block on no day");
  if (placedOn(null, "Sep 4").size) say("placedOn throws or invents days on a class with no plans");
  for (const d of Object.keys(plans).concat("Sep 23")) {
    const out = whenLabel(d);
    if (!out || /invalid|nan|undefined/i.test(out))
      say(`the card renders "${out}" for the day ${d}`);
  }
  if (whenLabel("") !== "" || whenLabel(null) !== "") say("the date slot prints something on a thing placed on no day");

  // Two columns, then one. The stage was three — Materials, the day, the room
  // — which made the day the narrowest thing on a screen that exists to run
  // the day, and split finding a thing from putting it up across opposite
  // edges. Now the day takes everything the rail does not.
  //
  // A server render cannot run a media query, so what is worth testing is the
  // arithmetic: the wide default and the narrow band must not disagree, and
  // below the break there must be no seam left pointing at a column that is
  // no longer beside anything.
  const wide = /const gridFor = \(cols, railOpen, teaching\) =>\s*\n?\s*\(railOpen && !teaching \? "minmax\(0,1fr\) 16px " \+ cols\.live \+ "px" : "minmax\(0,1fr\)"\)/.test(src);
  if (!wide) say("the wide stage is no longer the day plus one rail");

  const bands = [...src.matchAll(/@media ([^{]*?)\{[^@]*?\.dash-stage\{grid-template-columns:([^!]*)!important/g)]
    .map(m => {
      const q = m[1];
      const max = /max-width:(\d+)px/.exec(q), min = /min-width:(\d+)px/.exec(q);
      return { lo: min ? +min[1] : 0, hi: max ? +max[1] : Infinity, cols: m[2].trim() };
    });
  if (bands.length !== 1) say(`the stage has ${bands.length} narrow bands, want exactly 1`);
  else {
    const b = bands[0];
    if (b.cols.split(/\s+(?![^(]*\))/).length !== 1)
      say(`below ${b.hi} the stage is "${b.cols}", which is not a single column`);
    if (b.hi !== 1240) say(`the stage stops being two columns at ${b.hi}, not 1240`);
    // The rail has to actually go somewhere when the stage stops making room
    // for it, or it lands under the day at 400px and wastes the width.
    if (!/\.dash-room\{grid-column:1\/-1\}/.test(src))
      say("below the break the rail does not take the full width");
  }
  if (!/@media \(max-width:1240px\)\{[^@]*?\.dash-seam\{display:none\}/.test(src))
    say("a seam is still drawn below 1240, where there is no column on the far side of it");
  if (!src.includes('data-which={which}')) say("the seam no longer says which column it resizes");

  const railStart = src.indexOf("function Rail({");
  const railFn = src.slice(railStart, src.indexOf("\n}", railStart));
  const atHead = railFn.indexOf("{head}"), atTabs = railFn.indexOf('role="tablist"');
  if (atHead < 0) say("Rail no longer renders its head slot at all");
  else if (atHead > atTabs) say("the preview renders below the tabs rather than above them");
}

// The dashboard, above the day.
//
// Two rows of controls that had grown where nobody would want them.
{
  const say = (m) => { console.error("  FAIL  dashboard: " + m); failedEarly++; };
  const src = readFileSync(new URL("../src/engine/Dashboard.jsx", import.meta.url), "utf8");

  // Ten shortcuts were live and the only way to see the list was a shortcut.
  // ViewMenu carries the Keyboard row and was written months ago and never
  // mounted, so the component existed and nothing rendered it.
  if (!/<ViewMenu\b/.test(src)) say("ViewMenu is defined and never rendered, so the shortcut list is unreachable without knowing a shortcut");
  const menu = src.slice(src.indexOf("function ViewMenu"), src.indexOf("function ViewMenu") + 1800);
  if (!menu.includes("onKeys")) say("the view menu no longer opens the shortcut sheet");

  // The row under the day title: four planning controls sitting on the line I
  // read off the screen while talking.
  const flow = src.slice(src.indexOf("export function FlowPanel"), src.indexOf("export function ComingUp") + 1);
  const bare = ["+ New section", "Merge sections", "+ New note"].filter(t => flow.includes(">" + t + "<"));
  if (bare.length) say(`${bare.length} planning control(s) loose under the day title: ${bare.join(", ")}`);
  if (!src.includes("Build the day")) say("nothing gathers the day-building controls");
}

// The dashboard's left column.
//
// Three tabs did not fit a 300px column and the row scrolled sideways with its
// scrollbar hidden, so Assignments was off the edge with nothing to say so. It
// is two tabs now, and the panel that went was a duplicate: it listed every
// assignment and cast a reveal, which is what Coming up already does with the
// days remaining beside each one.
{
  const say = (m) => { console.error("  FAIL  materials: " + m); failedEarly++; };
  const src = readFileSync(new URL("../src/engine/Dashboard.jsx", import.meta.url), "utf8");

  const m = src.match(/const MATERIAL = (\[[^\]]*\]);/);
  if (!m) say("no MATERIAL list");
  else {
    const tabs = JSON.parse(m[1].replace(/'/g, '"'));
    if (tabs.length > 2) say(`${tabs.length} tabs in a 300px column, which is where the last one went off the edge`);
    if (tabs.includes("assignments")) say("the assignments tab is back, and Coming up already casts the same thing");
  }
  // Dropping a tab must not leave a hole in the number keys, which run left
  // rail then right.
  const live = src.match(/const LIVE_RAIL = (\[[^\]]*\]);/);
  if (!live) say("no LIVE_RAIL list");
  // Nothing becomes unreachable: Coming up covers three weeks and the link
  // covers everything past that, plus anything marked Ongoing, which has no
  // date to sort by at all.
  if (!src.includes("All challenges")) say("nothing on the dashboard reaches the challenges beyond three weeks");
  // The row never scrolls out of sight again.
  if (src.includes(".dash-rail-tabs{display:flex;gap:4px") && !src.includes("flex-wrap:wrap"))
    say("the tab row can still hide a tab off its edge");
  // And a 300px trackpad column stops using the student touch floor.
  const panel = src.slice(src.indexOf("export function IdeasPanel"), src.indexOf("export function QuestionsPanel"));
  const small = [...panel.matchAll(/fontSize: (\d+(?:\.\d+)?)/g)].map(x => Number(x[1])).filter(n => n < 13);
  if (small.length) say(`${small.length} size(s) under the 13px floor in the activities panel: ${small.join(", ")}`);
}

// Two people writing at once, which is the bug the room actually hit.
//
// Andrew: "when one person would submit their answer, it would clear everyone
// else's." The store is one JSON blob, every screen writes the whole blob, and
// nothing re-read before writing. So the last write wins and everything that
// arrived since that screen last synced is gone. Each case below is a way that
// happened.
{
  const say = (m) => { console.error("  FAIL  race: " + m); failedEarly++; };
  const wk = (responses, extra) => ({ weeklyGames: { 3: { week: 3, phase: "live", questions: [], responses, ...extra } } });
  const got = (d) => d.weeklyGames[3].responses;

  // Two students answer at the same moment. Both keep their answer.
  {
    const base = wk({});
    const mine = wk({ "s1-0": 0 });
    const server = wk({ "s2-0": 1 });
    const out = got(mergeAnswers(mine, base, server));
    if (out["s1-0"] !== 0) say("my own answer did not survive my own write");
    if (out["s2-0"] !== 1) say("submitting cleared the other student's answer");
  }

  // I press "next question" holding a snapshot from before three phones
  // answered. This is the one that emptied the room.
  {
    const base = wk({});
    const mine = wk({}, { currentQ: 1 });
    const server = wk({ "s1-0": 0, "s2-0": 1, "s3-0": 2 });
    const out = mergeAnswers(mine, base, server);
    if (Object.keys(got(out)).length !== 3) say("advancing the question wiped " + (3 - Object.keys(got(out)).length) + " answers");
    if (out.weeklyGames[3].currentQ !== 1) say("advancing the question did not advance the question");
  }

  // A student changes their mind. Their new answer beats the server's copy of
  // their old one, and nobody else is touched.
  {
    const base = wk({ "s1-0": 0 });
    const mine = wk({ "s1-0": 1 });
    const server = wk({ "s1-0": 0, "s2-0": 1 });
    const out = got(mergeAnswers(mine, base, server));
    if (out["s1-0"] !== 1) say("changing an answer did not take");
    if (out["s2-0"] !== 1) say("changing an answer cleared somebody else's");
  }

  // Clearing a week really clears it, and does not resurrect from the server.
  {
    const base = wk({ "s1-0": 0 });
    const mine = wk({});
    const server = wk({ "s1-0": 0, "s2-0": 1 });
    const out = got(mergeAnswers(mine, base, server));
    if ("s1-0" in out) say("an answer I cleared came back");
    if (out["s2-0"] !== 1) say("clearing one answer cleared another");
  }

  // A week the server has never seen goes across whole.
  {
    const out = mergeAnswers(wk({ "s1-0": 0 }), { weeklyGames: {} }, { weeklyGames: {} });
    if (got(out)["s1-0"] !== 0) say("a brand new week lost its answers");
  }

  // A week somebody else created while I was writing stays where it is.
  {
    const mine = wk({ "s1-0": 0 });
    const server = { weeklyGames: { 3: { responses: {} }, 4: { week: 4, responses: { "s2-0": 1 } } } };
    const out = mergeAnswers(mine, { weeklyGames: {} }, server);
    if (!out.weeklyGames[4]) say("a week created by somebody else disappeared");
  }

  // Trivia answers merge on the same rule.
  {
    const base = { triviaGames: { g1: { answers: {} } } };
    const mine = { triviaGames: { g1: { answers: { "t1-0": "us" } } } };
    const server = { triviaGames: { g1: { answers: { "t2-0": "them" } } } };
    const out = mergeAnswers(mine, base, server).triviaGames.g1.answers;
    if (out["t1-0"] !== "us" || out["t2-0"] !== "them") say("a trivia round lost a team's answer");
  }
}

// Who a student is.
//
// The seeded roster was { name, from, goals } with no id, and nothing ever
// assigned one. So student.id was undefined for every student in a fresh class
// and every answer key was "undefined-0": two phones answering the same
// question wrote the same key and the second replaced the first. Not a race,
// which the write merge already handles. The same key, which no merge can help
// with. This is what would have made the phone test look broken.
{
  const say = (m) => { console.error("  FAIL  roster: " + m); failedEarly++; };

  // Every seeded student in every class has an id, and no two share one.
  const seeded = comm999.students || [];
  if (!seeded.length) say("the template class has no roster to seed from");
  seeded.forEach(st => { if (!st.id) say(`${st.name} is seeded without an id`); });
  if (new Set(seeded.map(st => st.id)).size !== seeded.length) say("two seeded students share an id");

  // And a roster from anywhere else gets one at the door.
  const bare = withIds([{ name: "Ada Byron" }, { name: "Bo Diaz" }]);
  if (bare.some(st => !st.id)) say("a roster with no ids came back with no ids");
  if (bare[0].id === bare[1].id) say("two different students normalise to the same id");
  if (withIds([{ id: "keep-me", name: "Ada Byron" }])[0].id !== "keep-me") say("a real id was thrown away");
  if (idOf({ name: "Joe Hanna" }) === idOf({ name: "George Hanna" })) say("two Hannas are the same student");

  // The whole point: two students, one question, two answers that both survive.
  const roster = [{ name: "Ada Byron" }, { name: "Bo Diaz" }];
  const qs = [{ id: "q", text: "One", options: ["a", "b"], correct: 0 }];
  let d = { students: roster, log: [] };
  d = openWeek(saveWeek(d, "game", 2, qs), "game", 2);
  d = answerWeek(d, "game", 2, idOf(roster[0]), 0, 0);   // Ada, right
  d = answerWeek(d, "game", 2, idOf(roster[1]), 0, 1);   // Bo, wrong
  const keys = Object.keys(d.weeklyGames[2].responses);
  if (keys.length !== 2) say(`two students answering one question made ${keys.length} answer(s)`);
  if (keys.some(k => k.startsWith("undefined"))) say("an answer is keyed to undefined");
  const sc = scoresFor(d, "game", 2);
  d = scoreWeek(d, "game", 2, 1756000000000);
  if (pointsOf(d.log, idOf(roster[0])) !== 10) say("the student who was right scored " + pointsOf(d.log, idOf(roster[0])));
  if (pointsOf(d.log, idOf(roster[1])) !== 0) say("the student who was wrong scored something");
  if (d.log.some(e => !e.studentId || String(e.studentId).includes("undefined")))
    say("a log entry has no student on it, so the gradebook cannot attribute the points");
}

// A game, played all the way through.
//
// Nothing checked this before: three forked copies ran a term of games with the
// rules buried in click handlers, and the one bug anybody found was found by a
// render test. So a game gets written, opened, answered by two students, scored,
// and the gradebook gets read afterwards. Then it gets scored again, because
// scoring twice is what a makeup is.
{
  const say = (m) => { console.error("  FAIL  game: " + m); failedEarly++; };
  const students = [{ id: "s1", name: "Ada Byron" }, { id: "s2", name: "Bo Diaz" }];
  const qs = [
    { id: "q1", text: "One", options: ["a", "b"], correct: 0 },
    { id: "q2", text: "Two", options: ["a", "b"], correct: 1 },
    { id: "q3", text: "Three", options: ["a", "b"], correct: 0 },
  ];
  const T = 1756000000000;

  let d = { students, log: [] };
  d = saveWeek(d, "game", 3, qs);
  if (d.weeklyGames[3].questions.length !== 3) say("a written week did not keep its questions");

  // Answering before the week is open changes nothing.
  const early = answerWeek(d, "game", 3, "s1", 0, 0);
  if (early.weeklyGames[3].responses) say("an answer landed on a week that was not open");

  d = openWeek(d, "game", 3);
  if (d.weeklyGames[3].phase !== "live") say("the week did not open");

  // Ada gets all three. Bo gets the first two.
  d = answerWeek(d, "game", 3, "s1", 0, 0);
  d = answerWeek(d, "game", 3, "s1", 1, 1);
  d = answerWeek(d, "game", 3, "s1", 2, 0);
  d = answerWeek(d, "game", 3, "s2", 0, 0);
  d = answerWeek(d, "game", 3, "s2", 1, 1);
  d = answerWeek(d, "game", 3, "s2", 2, 1);

  const pre = scoresFor(d, "game", 3);
  if (pre.s1 !== 30) say("three right came to " + pre.s1 + " rather than 30");
  if (pre.s2 !== 20) say("two right came to " + pre.s2 + " rather than 20");

  d = scoreWeek(d, "game", 3, T);
  if (d.weeklyGames[3].phase !== "done" || !d.weeklyGames[3].scored) say("a scored week is not done");
  if (d.weeklyGames[3].active) say("a scored week is still open to the room");
  if (pointsOf(d.log, "s1") !== 30) say("Ada has " + pointsOf(d.log, "s1") + " in the gradebook rather than 30");
  if (pointsOf(d.log, "s2") !== 20) say("Bo has " + pointsOf(d.log, "s2") + " rather than 20");
  if (d.log.length !== 2) say(d.log.length + " log entries where two students played");
  if (d.log.some(e => e.ts !== T)) say("a log entry did not take the scoring time");

  // Scoring the same week again changes nothing at all.
  const again = scoreWeek(d, "game", 3, T + 99999);
  if (again.log.length !== 2) say("scoring twice wrote " + again.log.length + " entries");
  if (pointsOf(again.log, "s1") !== 30) say("scoring twice moved a score");
  if (again.log.some(e => e.ts !== T)) say("scoring twice moved the timestamp off the first scoring");

  // Bo comes back and fixes the third question. One entry, replaced, not added.
  let fixed = { ...again, weeklyGames: { ...again.weeklyGames,
    3: { ...again.weeklyGames[3], phase: "live" } } };
  fixed = answerWeek(fixed, "game", 3, "s2", 2, 0);
  fixed = scoreWeek(fixed, "game", 3, T + 99999);
  if (fixed.log.length !== 2) say("a makeup made " + fixed.log.length + " entries out of two students");
  if (pointsOf(fixed.log, "s2") !== 30) say("a makeup left Bo on " + pointsOf(fixed.log, "s2"));
  if (fixed.log.some(e => e.ts !== T)) say("a makeup dated itself to the week it was graded in");

  // Who got everything right.
  const runs = perfectRuns(fixed);
  if (runs.length !== 2) say(runs.length + " perfect runs where both students ended on three");
  if (perfectRuns(d).length !== 1) say("the first scoring should have had one perfect run");
  // The crash the forks carried: a scored game shorter than ten questions.
  if (perfectRuns({ students, weeklyGames: { 9: { scored: true, questions: qs.slice(0, 2), responses: {} } } }).length !== 0) {
    say("a two-question game invented a perfect run");
  }

  // Ten on Ten splits twenty points across the week's questions.
  let t = { students, log: [] };
  t = saveWeek(t, "tot", 4, qs);
  t = openWeek(t, "tot", 4);
  t = answerWeek(t, "tot", 4, "s1", 0, 0);
  t = answerWeek(t, "tot", 4, "s1", 1, 1);
  t = answerWeek(t, "tot", 4, "s1", 2, 0);
  t = scoreWeek(t, "tot", 4, T);
  if (pointsOf(t.log, "s1") !== 20) say("a whole Ten on Ten came to " + pointsOf(t.log, "s1") + " rather than 20");
  if (t.weeklyToT[4].phase !== "done") say("a scored Ten on Ten is not done");
  if (t.log[0].source !== "ToT Wk4") say("a Ten on Ten entry is filed as " + t.log[0].source);
}

// Two sittings on one day is what COMM 3 needs and what one pair of times
// cannot say. Fixed clocks, so the build does not pass or fail by the hour.
{
  const at = (h, m) => new Date(2026, 8, 2, h, m);
  const two = { meets: [{ start: "08:00", end: "09:05" }, { start: "10:30", end: "11:35" }] };
  const one = { meets: { start: "09:15", end: "10:20" } };
  const bad = { meets: { start: "", end: "" } };
  if (sittingsOf(two).length !== 2) { console.error("  FAIL  meets: two sittings read as " + sittingsOf(two).length); failedEarly++; }
  if (sittingsOf(one).length !== 1) { console.error("  FAIL  meets: one pair of times stopped working"); failedEarly++; }
  if (minutesLeft(two, at(8, 30)) !== 35) { console.error("  FAIL  meets: the first sitting does not count down"); failedEarly++; }
  if (minutesLeft(two, at(10, 45)) !== 50) { console.error("  FAIL  meets: the second sitting does not count down"); failedEarly++; }
  if (minutesLeft(two, at(9, 40)) !== null) { console.error("  FAIL  meets: the gap between two sittings reads as class"); failedEarly++; }
  if (minutesLeft(one, at(9, 30)) !== 50) { console.error("  FAIL  meets: a class that meets once does not count down"); failedEarly++; }
  if (sittingLength(two, at(10, 45)) !== 65) { console.error("  FAIL  meets: a sitting came out the wrong length"); failedEarly++; }
  if (minutesLeft(bad, at(9, 30)) !== null) { console.error("  FAIL  meets: a class with no times is in session"); failedEarly++; }
}

// A note with a file plays as slides behind one button: the headline, the
// clip, then the question. The rule that turns a block into those slides, and
// the rule that says which slide is up, are checked here without a screen.
{
  const clip = { kind: "video", src: "https://e.com/clip.mov", name: "clip.mov", size: 12345678 };
  const withAsk = { title: "The ad", headline: "The ad ran twice in one break.", media: clip, ask: "Who was that for?" };
  const noAsk = { title: "The ad", headline: "The ad ran twice in one break.", media: clip, ask: "" };
  const plain = { title: "The ad", headline: "The ad ran twice in one break." };
  const s3 = mediaSteps(withAsk, withAsk.headline, "Open");
  const s2 = mediaSteps(noAsk, noAsk.headline, "Open");
  if (!s3 || s3.length !== 3) { console.error("  FAIL  media: a note with a clip and a question plays as " + (s3 ? s3.length : "no") + " slides, not three"); failedEarly++; }
  if (!s2 || s2.length !== 2) { console.error("  FAIL  media: a note with a clip and no question plays as " + (s2 ? s2.length : "no") + " slides, not two"); failedEarly++; }
  if (mediaSteps(plain, plain.headline, "Open") !== null) { console.error("  FAIL  media: a note with no file got slides"); failedEarly++; }
  if (s3 && s3[1].payload.type !== "media") { console.error("  FAIL  media: the second slide is " + s3[1].payload.type + ", not the clip"); failedEarly++; }
  if (s3 && s3[2].payload.title !== "Who was that for?") { console.error("  FAIL  media: the question slide lost the question"); failedEarly++; }
  if (s3 && !s3.every(st => st.payload.label === withAsk.headline)) { console.error("  FAIL  media: the slides do not share a label, so the row would not read as live"); failedEarly++; }
  if (liveStep(s3 && s3[1].payload, withAsk.headline) !== 1) { console.error("  FAIL  media: the clip slide is up and the row does not know"); failedEarly++; }
  if (liveStep({ type: "quote", label: "something else" }, withAsk.headline) !== -1) { console.error("  FAIL  media: another row's cast counted as this row's"); failedEarly++; }
  if (liveStep(null, withAsk.headline) !== -1) { console.error("  FAIL  media: an idle wall counted as live"); failedEarly++; }
  if (mediaKind("video/quicktime") !== "video" || mediaKind("audio/m4a") !== "audio" || mediaKind("application/pdf") !== "") { console.error("  FAIL  media: a MIME type was filed under the wrong kind"); failedEarly++; }
  // The path a file lands at: class, month, stamp, the file's own name cleaned
  // up, and nothing Supabase would refuse.
  const path = pathFor({ classId: "comm118", name: "Screen Recording 2026-09-04 at 8.12.03 PM.mov", now: new Date("2026-09-04T20:12:03Z") });
  if (!/^comm118\/2026-09\/[a-z0-9]+-screen-recording-2026-09-04-at-8\.12\.03-pm\.mov$/.test(path)) { console.error("  FAIL  media: the upload path came out as " + path); failedEarly++; }

  const row = (step) => (
    <Castable num={3} kind="Note" kindColor="#646b75" title="The ad" claim={withAsk.headline} accent="#7c3aed"
      live={step >= 0} onCast={noop} onDismiss={noop} onSaveClaim={noop} onTick={noop}
      steps={s3} step={step} onStep={noop} />
  );
  cases.push(["Flow row with a clip, not live", row(-1), "→"]);
  cases.push(["Flow row with a clip, headline up, offers the clip", row(0), "Clip →"]);
  cases.push(["Flow row with a clip, clip up, offers the question", row(1), "Question →"]);
  cases.push(["Flow row with a clip, question up, nothing left to offer", row(2), "Take it back down"]);
}

// Every variable a token reads has to be defined at the root of the app, or a
// surface that never mounts a theme draws with nothing: no greys, no borders,
// a white button on a white header. That is how the dashboard and the
// repository looked for a week.
{
  const tokensSrc = readFileSync(new URL("../src/engine/tokens.js", import.meta.url), "utf8");
  const used = [...new Set([...tokensSrc.matchAll(/var\((--[a-z0-9-]+)\)/g)].map(m => m[1]))];
  const base = baseCSS();
  const missing = used.filter(v => !base.includes(v + ":"));
  if (missing.length) { console.error("  FAIL  tokens: read at the root but never defined there: " + missing.join(", ")); failedEarly++; }
  if (!/^:root\{/.test(base)) { console.error("  FAIL  tokens: the base block is not on :root"); failedEarly++; }
}

// The roster, pasted. Commas or tabs, a header row, "Last, First" from a
// registrar export, and a merge that never changes an id.
{
  const csv = "Name,Email,Section\nDan Patry, dpatry@scu.edu, 8:00\nJoe Hanna,jhanna@scu.edu\n\n";
  const rows = parseRoster(csv);
  if (rows.length !== 2) { console.error("  FAIL  roster: " + rows.length + " rows out of two, the header or the blank line got in"); failedEarly++; }
  if (rows[0]?.name !== "Dan Patry" || rows[0]?.email !== "dpatry@scu.edu" || rows[0]?.section !== "8:00") { console.error("  FAIL  roster: the first row read as " + JSON.stringify(rows[0])); failedEarly++; }
  const tsv = parseRoster("Hanna, Joe\tjhanna@scu.edu");
  if (tsv[0]?.name !== "Joe Hanna") { console.error("  FAIL  roster: a registrar's Last, First came out as " + JSON.stringify(tsv[0]?.name)); failedEarly++; }
  const emailOnly = parseRoster("someone@scu.edu");
  if (emailOnly.length !== 1 || emailOnly[0].email !== "someone@scu.edu") { console.error("  FAIL  roster: an email on its own was dropped"); failedEarly++; }
  const before = [{ id: "joe-hanna", name: "Joe Hanna", from: "", goals: "" }, { id: "dan-patry", name: "Dan Patry", from: "", goals: "" }];
  const merged = mergeRoster(before, rows);
  if (merged.added !== 0 || merged.updated !== 2) { console.error("  FAIL  roster: merging two known students added " + merged.added + " and updated " + merged.updated); failedEarly++; }
  if (merged.students.find(s => s.name === "Joe Hanna")?.id !== "joe-hanna") { console.error("  FAIL  roster: a merge changed a student's id"); failedEarly++; }
  if (merged.students.find(s => s.name === "Joe Hanna")?.email !== "jhanna@scu.edu") { console.error("  FAIL  roster: the email did not land on the student"); failedEarly++; }
  const again = mergeRoster(merged.students, parseRoster("Kirellos Zamary, kzamary@scu.edu"));
  if (again.added !== 1 || again.students.length !== 3) { console.error("  FAIL  roster: a new student was not added"); failedEarly++; }
  const byEmail = mergeRoster(merged.students, parseRoster("J. Hanna, jhanna@scu.edu, 10:30"));
  if (byEmail.added !== 0 || byEmail.students.find(s => s.id === "joe-hanna")?.section !== "10:30") { console.error("  FAIL  roster: a row with a known email and a different name made a duplicate"); failedEarly++; }
  if (!/^[1-9]\d{5}$/.test(makeCode())) { console.error("  FAIL  logins: a code came out as " + makeCode()); failedEarly++; }
  if (!looksLikeEmail("a@b.co") || looksLikeEmail("not an email")) { console.error("  FAIL  logins: the email check is wrong"); failedEarly++; }
  cases.push(["Roster sheet, empty", <RosterSheet students={[]} accent="#7c3aed" onSave={noop} />, "Paste the list below"]);
  cases.push(["Roster sheet, with students and sections", <RosterSheet students={merged.students} accent="#7c3aed" onSave={noop} sections />, "jhanna@scu.edu"]);
}

// Where a signed-in person goes. The roster answers by email: one class goes
// there, two classes pick, no class is told, and the instructor gets the
// front page whatever the rosters say.
{
  const c118 = { id: "comm118", path: "/comm118" }, c3 = { id: "comm3", path: "/comm3" };
  const rosters = [
    { cls: c118, students: [{ id: "a", name: "A", email: "a@scu.edu" }, { id: "b", name: "B", email: "b@scu.edu" }] },
    { cls: c3, students: [{ id: "b3", name: "B", email: "B@scu.edu" }] },
  ];
  const one = whereTo("a@scu.edu", rosters);
  if (one.kind !== "student" || one.path !== "/comm118") { console.error("  FAIL  login: a student in one class went to " + JSON.stringify(one)); failedEarly++; }
  const two = whereTo("b@scu.edu", rosters);
  if (two.kind !== "pick" || two.classes.length !== 2) { console.error("  FAIL  login: a student in two classes got " + JSON.stringify(two)); failedEarly++; }
  const none = whereTo("z@scu.edu", rosters);
  if (none.kind !== "nobody") { console.error("  FAIL  login: a stranger got " + JSON.stringify(none)); failedEarly++; }
  const me = whereTo("AndrewIshak@gmail.com", rosters);
  if (me.kind !== "instructor" || me.path !== "/") { console.error("  FAIL  login: the instructor got " + JSON.stringify(me)); failedEarly++; }
  if (studentFor("B@SCU.EDU", rosters[0].students)?.id !== "b") { console.error("  FAIL  login: the roster lookup is case-sensitive"); failedEarly++; }
  cases.push(["The sign-in page", <LoginPage />, "Email me a code"]);
}

// Grade view: cards sorted into columns, released all at once, taken back
// all at once. The logic is pure, so the shape of a release is asserted
// here, and both surfaces render.
{
  const say = (m) => { console.error("  FAIL  grade view: " + m); failedEarly++; };
  const cfg = { ...cfg0, profileTask: null, assignments: [{ id: "ex1", title: "Exercise 1", weight: 50, due: "Sep 3" }, { id: "ex2", title: "Exercise 2", weight: 50, due: "Sep 10" }],
    students: [{ name: "Ada Lovelace" }, { name: "Bob Ross" }, { name: "Cy Twombly" }] };
  const sub = { id: "s1", ts: 1, type: "submission", link: "https://docs.google.com/x", text: "" };
  let d = { assignments: cfg.assignments, students: cfg.students, assignmentLog: { ex1: { "Ada Lovelace": [sub], "Bob Ross": [sub] } } };
  d = placeCard(d, "ex1", "Ada Lovelace", "exceptional", 10);
  d = placeCard(d, "ex1", "Bob Ross", "incomplete", 10);
  d = writeCard(d, "ex1", "Ada Lovelace", { comment: "Sharp work.\n\nKeep going.", note: "mine" }, 11);
  // Nothing reaches a student before release.
  if (computeGrade(cfg, d, "Ada Lovelace").pct != null) say("a sorted card counted before release");
  if (unseenGrades(cfg, d, "Ada Lovelace").length) say("a deck card showed before release");
  d = releasePatch(d, "ex1", 20);
  const ada = d.assignmentLog.ex1["Ada Lovelace"];
  const g = ada[ada.length - 1];
  if (ada[0] !== sub) say("release lost the submission");
  if (g.type !== "grade" || g.letter !== "A" || g.score !== 100 || g.bucket !== "exceptional") say("exceptional did not release as an A worth 100: " + JSON.stringify(g));
  if (!g.html || !g.html.includes("<p>Sharp work.</p>")) say("the comment did not ride on the grade: " + g.html);
  if (g.html.includes("mine")) say("the private note reached the student");
  if (computeGrade(cfg, d, "Ada Lovelace").pct !== 100) say("the average did not take the released grade");
  const bob = computeGrade(cfg, d, "Bob Ross");
  if (bob.pct !== 0 || bob.rows[0].letter !== "Incomplete") say("an Incomplete did not count as a zero: " + JSON.stringify(bob));
  if (d.assignmentLog.ex1["Cy Twombly"]) say("an unsorted student got a log entry");
  const deck = unseenGrades(cfg, d, "Ada Lovelace");
  if (deck.length !== 1 || deck[0].letter !== "A" || !deck[0].comment.startsWith("Sharp")) say("the deck card is wrong: " + JSON.stringify(deck));
  if (unseenGrades(cfg, markSeen(d, "ex1", "Ada Lovelace", 30), "Ada Lovelace").length) say("Got it did not clear the deck card");
  if (changedSinceRelease(d.gradeBoard.ex1)) say("a fresh release reads as changed");
  const moved = placeCard(d, "ex1", "Ada Lovelace", "b", 40);
  if (!changedSinceRelease(moved.gradeBoard.ex1)) say("moving a card after release does not read as changed");
  const again = releasePatch(moved, "ex1", 50);
  const adaAgain = again.assignmentLog.ex1["Ada Lovelace"];
  if (adaAgain.filter(e => e.type === "grade").length !== 1 || adaAgain[adaAgain.length - 1].letter !== "B") say("releasing again stacked a second grade");
  const hid = hidePatch(again, "ex1");
  if (hid.assignmentLog.ex1["Ada Lovelace"].length !== 1 || hid.assignmentLog.ex1["Ada Lovelace"][0] !== sub) say("hide did not take the grade back, or took the submission");
  if (hid.gradeBoard.ex1.cards["Ada Lovelace"].bucket !== "b") say("hide unsorted the board");
  if (computeGrade(cfg, hid, "Ada Lovelace").pct != null) say("a hidden grade still counts");
  if (BUCKETS.find(b => b.id === "exceptional").letter !== "A") say("exceptional shows as something other than A");

  // A grade is sent once. Andrew, 2026-09-15: release, grade more, release
  // again, and the students who already had theirs get no second card unless
  // the letter or the comment changed.
  {
    let r = releasePatch(d, "ex1", 20);                       // Ada A with a comment, Bob Incomplete
    r = markSeen(r, "ex1", "Ada Lovelace", 25);
    r = markSeen(r, "ex1", "Bob Ross", 25);
    const adaEvent = r.assignmentLog.ex1["Ada Lovelace"].slice(-1)[0];
    r = placeCard(r, "ex1", "Cy Twombly", "b", 30);             // grade one more
    r = writeCard(r, "ex1", "Bob Ross", { note: "private" }, 31); // a note only Andrew sees
    const counts = releaseCounts(r, "ex1");
    if (counts.new !== 1 || counts.changed !== 0 || counts.same !== 2) say("the next release counts the wrong students: " + JSON.stringify(counts));
    r = releasePatch(r, "ex1", 40);
    if (r.assignmentLog.ex1["Ada Lovelace"].slice(-1)[0] !== adaEvent) say("a second release rewrote a grade that had not changed");
    if (unseenGrades(cfg, r, "Ada Lovelace").length) say("a second release brought back a card the student had already read");
    if (unseenGrades(cfg, r, "Bob Ross").length) say("a change to the private note brought the card back");
    if (unseenGrades(cfg, r, "Cy Twombly").length !== 1) say("the newly graded student got no card");
    if (changedSinceRelease(r.gradeBoard.ex1, r, "ex1")) say("a release with nothing left to send reads as changed");
    // A new comment is a change.
    let c = writeCard(r, "ex1", "Bob Ross", { comment: "Finish the second half." }, 50);
    if (unseenGrades(cfg, c, "Bob Ross").length) say("an unreleased comment reached the deck");
    if (!changedSinceRelease(c.gradeBoard.ex1, c, "ex1")) say("a new comment does not read as changed");
    c = releasePatch(c, "ex1", 60);
    const bobCard = unseenGrades(cfg, c, "Bob Ross");
    if (bobCard.length !== 1 || !bobCard[0].comment.includes("second half")) say("a changed comment did not bring the card back: " + JSON.stringify(bobCard));
    if (unseenGrades(cfg, c, "Ada Lovelace").length) say("releasing Bob's comment brought Ada's card back");
    // A comment on the assignment is a comment on the grade: the card comes
    // back with the comment on it, and only for that student.
    const commented = { ...r, assignmentLog: { ...r.assignmentLog, ex1: { ...r.assignmentLog.ex1,
      "Ada Lovelace": [...r.assignmentLog.ex1["Ada Lovelace"], { id: "c9", ts: 55, type: "comment", from: "instructor", html: "<p>One more thing.</p>" }] } } };
    const adaMore = unseenGrades(cfg, commented, "Ada Lovelace");
    if (adaMore.length !== 1 || adaMore[0].more?.[0]?.text !== "One more thing.") say("a comment posted on the assignment did not bring the grade card back: " + JSON.stringify(adaMore));
    if (unseenGrades(cfg, markSeen(commented, "ex1", "Ada Lovelace", 56), "Ada Lovelace").length) say("Got it on a commented card did not clear the card");
    if (unseenGrades(cfg, commented, "Bob Ross").length) say("a comment to Ada brought Bob's card back");
    const withStudentNote = { ...r, assignmentLog: { ...r.assignmentLog, ex1: { ...r.assignmentLog.ex1,
      "Ada Lovelace": [...r.assignmentLog.ex1["Ada Lovelace"], { id: "c8", ts: 55, type: "comment", from: "student", text: "Thanks" }] } } };
    if (unseenGrades(cfg, withStudentNote, "Ada Lovelace").length) say("the student's own comment brought their card back");
    // A card moved and not released yet: the deck shows what was sent.
    const early = placeCard(markSeen(r, "ex1", "Cy Twombly", 45), "ex1", "Cy Twombly", "a", 46);
    const unseenCy = unseenGrades(cfg, placeCard(r, "ex1", "Cy Twombly", "a", 46), "Cy Twombly");
    if (unseenCy.length !== 1 || unseenCy[0].letter !== "B") say("the deck showed a letter that was never released: " + JSON.stringify(unseenCy));
    if (unseenGrades(cfg, early, "Cy Twombly").length) say("a moved card that was not released came back as a card");
    // Hide and release the same grades again: no second card.
    const back = releasePatch(hidePatch(r, "ex1"), "ex1", 70);
    if (unseenGrades(cfg, back, "Ada Lovelace").length) say("hide then release brought back a card the student had read");
    if (computeGrade(cfg, back, "Ada Lovelace").pct !== 100) say("hide then release did not put the grade back");
  }
  // Both surfaces render, on the board just built.
  warmClassData(cfg.storageKey, again);
  try {
    const html = renderToString(<GradeView config={cfg} />);
    ["Not sorted yet", "Cy Twombly", "Hide grades", "Open their file", "Exceptional", "Incomplete"].forEach(t => { if (!html.includes(t)) say("the page never showed " + JSON.stringify(t)); });
  } catch (err) { say("the page threw: " + err.message); }
  try {
    const deckCard = unseenGrades(cfg, again, "Ada Lovelace")[0];
    if (!deckCard.link || !deckCard.means || !deckCard.gradedAt || !deckCard.submittedAt) say("the deck card is missing the file, the meaning or a time: " + JSON.stringify(deckCard));
    const html = renderToString(<GradeDeck config={cfg} items={[deckCard]} onSeen={noop} onDone={noop} onMeeting={noop} />);
    // One sentence and a way through, and nothing else.
    ["Exercise 1", "has been evaluated", "Got it", "Open the challenge"].forEach(t => { if (!html.includes(t)) say("the deck never showed " + JSON.stringify(t)); });
    ["Sharp work.", "room to sharpen", "Open your file", "Graded "].forEach(t => { if (html.includes(t)) say("the deck is still carrying " + JSON.stringify(t)); });
    const nothingIn = renderToString(<GradeDeck config={cfg} items={[{ ...deckCard, letter: "Incomplete", bucket: "incomplete", link: "", submittedAt: null }]} onSeen={noop} onDone={noop} onMeeting={noop} />).replace(/<!-- -->/g, "");
    if (!nothingIn.includes("so you received a grade of 0")) say("a challenge with nothing turned in does not say so on the card");
    if (!html.includes('/challenges/ex1"')) say("Open the assignment does not point at the assignment itself");
    // The calendar is not a button here any more: a rough grade sends the
    // link into the challenge's conversation when it is released.
    const withCal = renderToString(<GradeDeck config={{ ...cfg, instructor: { name: "Andrew Ishak", schedulingLink: "https://calendly.com/x" } }} items={[deckCard]} onSeen={noop} onDone={noop} />);
    if (withCal.includes("https://calendly.com/x")) say("the grade card still carries the calendar");
    const rough = releasePatch(placeCard(d, "ex1", "Bob Ross", "d", 70), "ex1", 80, { meetingLink: "https://calendly.com/x" });
    const auto = (rough.assignmentLog.ex1["Bob Ross"] || []).slice(-1)[0];
    if (!auto || auto.type !== "comment" || auto.from !== "instructor" || !auto.auto || !auto.text.includes("make a meeting with Dr. Ishak") || !auto.text.includes("https://calendly.com/x")) {
      say("a D does not send the meeting link into the conversation: " + JSON.stringify(auto)); }
    const fine = releasePatch(placeCard(d, "ex1", "Bob Ross", "a", 70), "ex1", 80, { meetingLink: "https://calendly.com/x" });
    if ((fine.assignmentLog.ex1["Bob Ross"] || []).some(e => e.auto)) say("an A sends the meeting link too");
    // Appreciating a message answers it.
    const asked2 = { ...d, assignmentLog: { ...d.assignmentLog, ex1: { ...d.assignmentLog.ex1,
      "Cy Twombly": [{ id: "q1", ts: 90, type: "comment", from: "student", text: "Is the deadline firm?" }] } } };
    if (!waitingOn(asked2, cfg.assignments).find(r => r.id === "ex1")?.messages) say("a student message is not waiting");
    const liked = appreciatePatch(asked2, "ex1", "Cy Twombly", "q1", "instructor");
    if (waitingOn(liked, cfg.assignments).find(r => r.id === "ex1")?.messages) say("an appreciated message is still waiting");
    if (liked.assignmentLog.ex1["Cy Twombly"][0].appreciatedBy !== "instructor") say("Appreciate did not mark the message");
  } catch (err) { say("the deck threw: " + err.message); }
  // Due inside 48 hours with nothing turned in: one card, dismissed once.
  {
    const now = new Date(2026, 8, 25, 12, 0).getTime();          // Fri Sep 25, noon
    const asgs = [
      { id: "sun", title: "Framing exercise", due: "Sep 27", dueTime: "11:59 PM" },   // Sun night, 60 hours out
      { id: "sat", title: "Short piece", due: "Sep 26", dueTime: "11:59 PM" },        // 36 hours out
      { id: "fri", title: "Pre-production", due: "Sep 25", dueTime: "5:00 PM" },      // 5 hours out
      { id: "gone", title: "Last week", due: "Sep 24", dueTime: "11:59 PM" },         // past
      { id: "done", title: "Handed in", due: "Sep 26", dueTime: "" },
    ];
    const dd = { assignments: asgs, assignmentLog: { done: { "Ada Lovelace": [sub] } } };
    if (deadlineOf("Sep 25", "5:00 PM") !== new Date(2026, 8, 25, 17, 0, 59).getTime()) say("5:00 PM does not read as five in the evening");
    if (deadlineOf("Sep 25", "12:00 AM") !== new Date(2026, 8, 25, 0, 0, 59).getTime()) say("12:00 AM does not read as midnight");
    const ids = dueSoon(cfg, dd, "Ada Lovelace", now).map(a => a.id).join(",");
    if (ids !== "sat,fri") say("the due-soon cards are for the wrong assignments: " + ids);
    const dismissed = dismissDue(dd, asgs[1], "Ada Lovelace", now);
    if (dueSoon(cfg, dismissed, "Ada Lovelace", now).map(a => a.id).join(",") !== "fri") say("Got it did not dismiss the due card");
    // Bob turned nothing in, so he also gets a card for the one Ada handed in.
    if (dueSoon(cfg, dismissed, "Bob Ross", now).map(a => a.id).join(",") !== "sat,fri,done") say("one student's dismissal hid another student's card");
    const moved = { ...dismissed, assignments: asgs.map(a => a.id === "sat" ? { ...a, due: "Sep 27", dueTime: "9:00 AM" } : a) };
    if (!dueSoon(cfg, moved, "Ada Lovelace", now).some(a => a.id === "sat")) say("a deadline moved after a dismissal never brought the card back");
    try {
      const html = renderToString(<DueDeck config={cfg} items={[asgs[1], asgs[2]]} onDismiss={noop} onOpen={noop} onDone={noop} />).replace(/<!-- -->/g, "");
      ["Short piece", "Got it", "Go to challenges", "1 of 2"].forEach(t => { if (!html.includes(t)) say("the due card never showed " + JSON.stringify(t)); });
    } catch (err) { say("the due card threw: " + err.message); }
  }

  // The Next class hero: the day, the time for this student's sitting, the
  // room, the day's title, that day's readings and games, and a day with no
  // meeting in the room says so.
  {
    const hcfg = { ...cfg, path: "/comm3", desc: "MWF 8:00 to 9:05 am and 10:30 to 11:35 am · Vari 133",
      meets: [{ label: "8:00", start: "08:00", end: "09:05" }, { label: "10:30", start: "10:30", end: "11:35" }] };
    const hdata = {
      schedule: [{ id: "w1", topic: "Framing", dates: ["Sep 21", "Sep 23"], items: [
        { id: "r1", type: "reading", title: "Katrina captions", url: "https://www.nytimes.com/k", date: "Wed" },
        { id: "r2", type: "reading", title: "A Monday reading", url: "https://x.com/m", date: "Mon" },
      ] }],
      dayPlans: {
        "Sep 21": { title: "What makes something a story at all?" },
        "Sep 23": { title: "Same event, different stories", slots: { a: { items: [{ id: "g", gameId: "x", text: "Week 1" }, { id: "h", feature: "Headlines" }] } } },
      },
    };
    const mon = new Date(2026, 8, 21, 12, 0).getTime();     // Monday after both sittings end
    const f = nextClassFacts(hcfg, hdata, () => null, "10:30", mon);
    if (!f || f.date !== "Sep 23" || f.weekday !== "Wednesday") say("the hero is not on the next class after today's sittings end: " + JSON.stringify(f));
    else {
      if (f.time !== "10:30 to 11:35 am") say("a student in the 10:30 section sees the wrong time: " + f.time);
      if (f.location !== "Vari 133") say("the hero has no room: " + f.location);
      if (f.title !== "Same event, different stories") say("the hero shows the wrong title: " + f.title);
      if (f.readings.map(r => r.title).join("|") !== "Katrina captions") say("the hero shows the wrong readings: " + JSON.stringify(f.readings));
      if (f.games.join("|") !== "Week 1") say("the hero shows the wrong games, or counts Headlines as a game: " + JSON.stringify(f.games));
    }
    if (nextClassFacts(hcfg, hdata, () => null, "", new Date(2026, 8, 21, 8, 30).getTime())?.date !== "Sep 21") say("the hero skipped today while class was still on");
    if (timeText({ start: "11:00", end: "12:05" }) !== "11:00 am to 12:05 pm") say("a sitting across noon reads wrong: " + timeText({ start: "11:00", end: "12:05" }));
    try {
      const plain = renderToString(<NextClassHero config={hcfg} data={hdata} blockOf={() => null} section="" onOpen={noop} seat={{}} />).replace(/<!-- -->/g, "");
      if (plain.includes("No in-person meeting")) say("a day that meets shows the no-meeting badge");
      const off = { ...hdata, dayPlans: Object.fromEntries(Object.entries(hdata.dayPlans).map(([k, p]) => [k, { ...p, noMeeting: true }])) };
      const none = renderToString(<NextClassHero config={hcfg} data={off} blockOf={() => null} section="" onOpen={noop} seat={{}} />).replace(/<!-- -->/g, "");
      if (!none.includes("No in-person meeting")) say("a day with no meeting has no badge");
      if (!plain.includes("border:2px solid var(--ca-accent)")) say("the hero has no outline in the class colour");
      if (none.includes("dashed")) say("a day with no meeting is back to a dashed outline");
      if (!/background:var\(--state-warn\)[^"]*"[^>]*>No in-person meeting/.test(none)) say("the no-meeting badge is not orange");
      if (none.includes("Vari 133")) say("a day with no meeting still names the room");
      // Directions under the room, the note above the readings only when there
      // is one, and Drew's Pick on a picked reading.
      const withAll = { ...hdata, dayPlans: { ...hdata.dayPlans, "Sep 23": { ...hdata.dayPlans["Sep 23"], studentNote: "Bring the Katrina photo." } } };
      const pickOf = (id) => (id === "r1" ? { id: "r1", pick: true } : null);
      const hcfgD = { ...hcfg, directionsUrl: "https://maps.example/vari" };
      const realNow = Date.now;
      Date.now = () => mon;
      const full = renderToString(<NextClassHero config={hcfgD} data={{ ...withAll, schedule: [{ ...withAll.schedule[0], items: withAll.schedule[0].items.map(it => ({ ...it, libId: it.id })) }] }} blockOf={pickOf} section="" onOpen={noop} seat={{}} />).replace(/<!-- -->/g, "");
      const bare = renderToString(<NextClassHero config={hcfgD} data={hdata} blockOf={() => null} section="" onOpen={noop} seat={{}} />).replace(/<!-- -->/g, "");
      const edit = renderToString(<NextClassHero config={hcfgD} data={withAll} blockOf={() => null} section="" onOpen={noop} seat={{}} instructor update={noop} />).replace(/<!-- -->/g, "");
      Date.now = realNow;
      if (!full.includes('href="https://maps.example/vari"') || full.indexOf("Directions") < full.indexOf("Vari 133")) say("Directions is not under the time and the room");
      if (!full.includes("Bring the Katrina photo.") || full.indexOf("Bring the Katrina photo.") > full.indexOf("Readings")) say("the note to students is not above the readings");
      if (bare.includes("Note to students")) say("a student sees a note box with no note in it");
      if (!full.includes("Drew&#x27;s Pick") && !full.includes("Drew's Pick")) say("a picked reading has no Drew's Pick mark");
      if (!edit.includes("Note to students") || !edit.includes("<textarea")) say("the instructor has no box for the note on the front page");
      // White, like the other cards: the Drew's Pick drawing has a white ground.
      if (plain.includes("color-mix") || !plain.includes("background:var(--surface-card)")) say("the hero is not white");
      // No class sends students anywhere by a Directions link until the link is right.
      [comm118Cfg, comm3Cfg].forEach(c => { if (c.directionsUrl) say(c.code + " has a Directions link again; the last one landed on Varsi Hall"); });
      // Drew's Picks first, and past three readings the rest fold behind Show all.
      const many = { ...hdata, schedule: [{ ...hdata.schedule[0], items: ["a", "b", "c", "d", "e"].map((x, i) => ({ id: x, libId: x, type: "reading", title: "Reading " + x.toUpperCase(), url: "https://x.test/" + x, date: "Wed" })) }] };
      Date.now = () => mon;
      const folded = nextClassFacts(hcfg, many, (id) => (id === "d" ? { id: "d", pick: true } : null), "");
      const five = renderToString(<NextClassHero config={hcfg} data={many} blockOf={(id) => (id === "d" ? { id: "d", pick: true } : null)} section="" onOpen={noop} seat={{}} />).replace(/<!-- -->/g, "");
      Date.now = realNow;
      if (folded.readings[0].title !== "Reading D") say("Drew's Pick is not the first reading: " + folded.readings.map(r => r.title).join(", "));
      if (!five.includes("Show all 5 readings")) say("five readings have no Show all");
      if (five.includes("Reading C") || five.includes("Reading E") || !five.includes("Reading B")) say("the card does not show exactly the pick and the next two before Show all");
      const pins = renderToString(<PinnedLinks data={{ pins: [{ id: "p", title: "Discussion doc", url: "https://docs.google.com/d" }] }} update={noop} seat={{}} />);
      if (!pins.includes("Discussion doc") || !pins.includes('href="https://docs.google.com/d"')) say("a pinned link does not show");
      if (renderToString(<PinnedLinks data={{}} update={noop} seat={{}} />)) say("a student with nothing pinned sees an empty Pinned box");
      if (!renderToString(<RequestForm update={noop} name="Ada" />).includes("Requests and bugs")) say("the requests and bugs form does not render");
      // Andrew's own card: the class ships one, the shared store overrides it,
      // and an empty field falls back rather than blanking the name.
      const merged = instructorOf({ instructor: { name: "Andrew Ishak", email: "aishak@scu.edu", bio: "From the config." } },
        { instructor: { name: "Dr. Andrew Ishak", bio: "", schedulingLink: "https://calendly.com/x" } });
      if (merged.name !== "Dr. Andrew Ishak" || merged.bio !== "From the config." || merged.email !== "aishak@scu.edu" || merged.schedulingLink !== "https://calendly.com/x") {
        say("the instructor's card does not merge over the class config: " + JSON.stringify(merged)); }
      const prof = renderToString(<InstructorProfile config={hcfg} shared={{}} updateShared={noop} />);
      ["Your card", "Name", "Office hours", "Calendar link", "Choose a photo"].forEach(t => { if (!prof.includes(t)) say("the profile editor has no " + JSON.stringify(t)); });
    } catch (err) { say("the home cards threw: " + err.message); }
  }

  // The first-week challenge: fill in your card. Andrew, 2026-09-17: "we make
  // it a task in the first week to fill in their info ... need all fields
  // filled. this assignment/challenge has no weight." The card is the
  // submission: every field filled and the challenge is Complete on its own.
  {
    const say = (m) => { console.error("  FAIL  card challenge: " + m); failedEarly++; };
    const N = "Sam Student";
    const pcfg = { ...cfg, path: "/comm118", profileTask: { due: "Sep 27" }, assignments: [{ id: "ex1", title: "Exercise 1", due: "Oct 4", dueTime: "11:59 PM", weight: 10 }] };
    const full = { email: "s@scu.edu", avatar: "data:image/jpeg;base64,x", about: "Me", year: "Junior", hometown: "Reno", motto: "Go", goals: "Learn", priority: "Family" };
    const short = { profiles: { [N]: { ...full, motto: "" } } };
    const done = { profiles: { [N]: full } };
    const now = new Date(2026, 8, 22, 12).getTime();
    try {
      const list = assignmentsOf(pcfg, {});
      if (list[0]?.id !== "card" || list.length !== 2) say("the card challenge is not in front of the class's list: " + list.map(a => a.id).join(","));
      if (assignmentsOf(pcfg, { assignments: [{ id: "wc1", title: "Weekly Challenge 1" }] })[0]?.id !== "card") say("a store carrying its own list loses the card challenge");
      if (assignmentsOf({ ...pcfg, profileTask: null }, {}).length !== 1) say("a class that did not ask for it got the card challenge");
      if (list[0].weight !== 0 || list[0].title !== "Please tell me about yourself") say("the card challenge is not his title at no weight: " + JSON.stringify(list[0]));
      const task = list[0];
      const at = (d, t) => statusOf(pcfg, d, task, N, new Set(), t);
      if (at(short, now).state !== "open") say("one field short still reads " + at(short, now).state);
      if (at(done, now).state !== "graded" || at(done, now).letter !== "Complete") say("a filled card is not Complete: " + JSON.stringify(at(done, now)));
      const late = new Date(2026, 8, 28, 12).getTime();
      if (at(short, late).state !== "missed") say("an empty card after the deadline is not missed");
      if (at(done, late).state !== "graded") say("a filled card is missed once the deadline passes");
      if (computeGrade(pcfg, done, N).pct !== null) say("the card challenge moved the grade: " + JSON.stringify(computeGrade(pcfg, done, N)));
      if (dueSoon(pcfg, done, N, new Date(2026, 8, 27, 12).getTime()).length) say("a filled card still gets a due-soon card");
      if (!dueSoon(pcfg, short, N, new Date(2026, 8, 27, 12).getTime()).some(a => a.id === "card")) say("a card one field short gets no due-soon card");
      const page = renderToString(<AssignmentPage config={pcfg} data={short} name={N} id="card" go={noop} />);
      if (!page.includes("Your card")) say("the card challenge's page has no way to the card");
      if (page.includes("A message, a link, or both")) say("the card challenge's page still has a box to send from");
      const form = renderToString(<YouDetail config={pcfg} role="student" data={short} update={noop} asStudent={N} />);
      ["Email address (this is only for your instructor)", "Goals for the class (this is only for your instructor)", "What matters to you most? (this is only for your instructor)"]
        .forEach(t => { if (!form.includes(t)) say("the form does not mark " + JSON.stringify(t)); });
      ["About me (this is only", "Motto (this is only", "Hometown (this is only"].forEach(t => { if (form.includes(t)) say("a field classmates see is marked private: " + t); });
    } catch (err) { say("the card challenge threw: " + err.message); }
  }

  // Messages are a card of their own on the front page. Andrew, 2026-09-17:
  // "can we move them from the bottom of the bio card to a card on the front
  // page please?" Your card keeps the profile; the thread, Done / I'm
  // confused / Make a meeting and the question moved.
  {
    const say = (m) => { console.error("  FAIL  messages card: " + m); failedEarly++; };
    const N = "Sam Student";
    const mcfg = { ...cfg, students: [{ name: N }] };
    const talked = { threads: { [N]: [{ id: "m1", ts: 1, from: "student", kind: "question", text: "What is framing?" }] } };
    try {
      const you = renderToString(<YouDetail config={mcfg} role="student" data={{}} update={noop} asStudent={N} />);
      if (!you.includes("Your profile")) say("Your card lost the profile");
      ["I don&#x27;t understand something", "I&#x27;m confused", "Message with Dr. Ishak"].forEach(t => { if (you.includes(t)) say("Your card still carries " + JSON.stringify(t)); });
      const msgs = renderToString(<MessagesDetail config={mcfg} role="student" data={talked} update={noop} asStudent={N} />);
      ["Message with Dr. Ishak", "I don&#x27;t understand something", "I&#x27;m confused", "Make a meeting", "What is framing?"].forEach(t => { if (!msgs.includes(t)) say("the messages card has no " + JSON.stringify(t)); });
      if (msgs.includes("Your profile")) say("the messages card carries the profile");
      const inbox = renderToString(<MessagesDetail config={mcfg} role="instructor" data={talked} update={noop} />);
      if (!inbox.includes("Inbox") || !inbox.includes(N)) say("Andrew's messages card is not the inbox");
      const tile = renderToString(<MessagesSummary config={mcfg} role="instructor" data={talked} />);
      if (!tile.includes("waiting on your reply")) say("Andrew's tile does not count who is waiting");
      const mine = renderToString(<MessagesSummary config={mcfg} role="student" data={talked} asStudent={N} />);
      if (!mine.includes("What is framing?")) say("the student's tile does not show the last thing said");
    } catch (err) { say("the messages card threw: " + err.message); }
  }

  // The top bar lights the tab the address says, on every page the same way,
  // and never wraps. Andrew, 2026-09-17: "can we have some consistency for
  // how the top nav is highlighted? and making sure it doesn't wrap around
  // for two levels."
  {
    const say = (m) => { console.error("  FAIL  top bar: " + m); failedEarly++; };
    const p = cfg0.path;
    const at = (path, search) => activeFor(cfg0, "instructor", path, search);
    const want = {
      [p]: "home", [p + "/"]: "home", [p + "/schedule"]: "schedule", [p + "/challenges"]: "assignments", [p + "/challenges/wc1"]: "assignments",
      [p + "/class"]: "class", [p + "/you"]: "class", [p + "/roster"]: "class", [p + "/messages"]: "class", [p + "/more"]: "more",
      [p + "/dashboard"]: "dashboard", ["/repo"]: "repo", [p + "/games"]: "games", [p + "/rungame"]: "games", [p + "/grade"]: "grade",
      [p + "/today"]: "today", [p + "/ask"]: "ask",
    };
    Object.entries(want).forEach(([path, id]) => { if (at(path) !== id) say(path + " lights " + JSON.stringify(at(path)) + ", not " + id); });
    if (at(p + "/dashboard", "?app=horn") !== "dashboard") say("the dashboard with the Horn up lights " + JSON.stringify(at(p + "/dashboard", "?app=horn")));
    if (at(p + "/board") !== "") say("a board page lights " + JSON.stringify(at(p + "/board")));
    try {
      // A page that says nothing gets the tab off the address; the smoke
      // globals put the address at /, so a class path is set for the render.
      const was = globalThis.location;
      globalThis.location = { ...was, pathname: p + "/grade", search: "" };
      const bar = renderToString(<TopNav config={cfg0} tabs={NAV_CLASS} active="" />);
      globalThis.location = was;
      const lit = (bar.match(/aria-current="page"[^>]*>([^<]*)</g) || []).map(s => s.replace(/.*>([^<]*)</, "$1"));
      if (lit.join() !== "Grade view") say("on Grade view the lit tabs are " + JSON.stringify(lit));
      if (/flex-wrap:wrap/.test(bar)) say("the bar still wraps");
      if (!/overflow-x:auto/.test(bar)) say("the tabs do not scroll sideways when the bar is short of room");
    } catch (err) { say("the bar threw: " + err.message); }
  }

  // Around the Horn opens over whatever page is up. Andrew, 2026-09-17: "it
  // should load on top of whatever page i'm on and that's it." The tab is a
  // button, not a link to the dashboard, and the board is mounted by the bar.
  {
    const say = (m) => { console.error("  FAIL  the Horn: " + m); failedEarly++; };
    try {
      const bar = renderToString(<TopNav config={cfg0} tabs={NAV_CLASS} active="" />);
      if (!/<button[^>]*>Around the Horn<\/button>/.test(bar)) say("Around the Horn is not a button in the bar");
      if (bar.includes("app=horn")) say("the bar still links the Horn to the dashboard");
      const closed = renderToString(<HornApp config={cfg0} />);
      if (closed.trim() !== "") say("the Horn draws something while closed: " + closed.slice(0, 80));
      const dash = readFileSync(new URL("../src/engine/Dashboard.jsx", import.meta.url), "utf8");
      if (dash.includes("<HornBoard")) say("the dashboard still mounts a board of its own");
      if (!dash.includes("openHorn()")) say("the dashboard's own button no longer opens the Horn");
    } catch (err) { say("the Horn threw: " + err.message); }
  }

  // The day's schedule at the top of the Flow, Enter above the day and Exit
  // below it. Andrew, 2026-09-17: "why am i not seeing game and headline on
  // oct 5, or the readings on oct 7?" and "didn't we work on having an entry
  // and exit part of each day on the dashboard?"
  {
    const say = (m) => { console.error("  FAIL  flow strip: " + m); failedEarly++; };
    try {
      const sched = [
        { id: "s1", type: "reading", title: "Chapter 8 on the day", url: "https://example.com/8", placed: false },
        { id: "s2", type: "activity", title: "Game on the day", placed: true },
      ];
      const props = { plan: fullPlan, seq, seeds, castNow: noop, dismiss: noop, liveLabel: null, accent: "#123456", onClaim: noop,
        features: ["Headlines"], onFeature: noop, planHref: "/x", onSlidesClaim: noop, onBlockClaim: noop, where: "COMM 1 · Sep 1",
        loose: [], onAddScheduled: noop, onAddItem: noop, onRemoveItem: noop, onMoveItem: noop, onSetSequence: noop, onSetSlotTitle: noop, sequences: [seq],
        schedToday: sched, onCastScheduled: noop, boards: {}, proposals: { pre: { title: "Enter headline", ideas: ["first idea"] }, post: { title: "Exit headline", ideas: ["last idea"] } },
        onSaveBoard: noop, onCastBoard: noop, boardHue: "#7c3aed" };
      const html = renderToString(<FlowPanel {...props} />).replace(/<!-- -->/g, "");
      const at = (t) => html.indexOf(t);
      ["On the schedule today", "Chapter 8 on the day", "Game on the day", "Enter headline", "first idea", "Exit headline", "last idea"]
        .forEach(t => { if (at(t) < 0) say("the Flow does not show " + JSON.stringify(t)); });
      if (!(at("Enter headline") < at("On the schedule today"))) say("Enter is not above the schedule");
      const firstSection = Object.values(fullPlan.slots || {}).map(s => s.title).filter(Boolean)[0];
      if (firstSection && !(at("On the schedule today") < at(firstSection))) say("the schedule is not above the day");
      if (firstSection && !(at(firstSection) < at("Exit headline"))) say("Exit is not below the day");
      if (/IN THE FLOW[\s\S]*Chapter 8 on the day|Chapter 8 on the day[\s\S]{0,300}IN THE FLOW[\s\S]{0,100}<\/div>\s*<div[^>]*>[\s\S]{0,200}Game on the day/.test(html) === false) {
        // The placed one says so and has no Add; the unplaced one has Add.
        const chapter = html.slice(at("Chapter 8 on the day"), at("Game on the day"));
        if (!/>Add</.test(chapter)) say("an unplaced reading has no Add");
        const game = html.slice(at("Game on the day"), at("Game on the day") + 900);
        if (!/IN THE FLOW/.test(game)) say("a placed activity does not say it is in the flow");
        if (/>Add</.test(game)) say("a placed activity still offers Add");
      }
      if (html.includes("what is still unplaced")) say("the fold still claims to hold the unplaced");
      // An idea on a board is a line that drags into a section, and the
      // board's headline is set as a heading, the way a section's name is.
      if (!/class="flow-board-row" draggable="true"/.test(html)) say("a board idea is not draggable");
      if (!/flow-board-title[^>]*>Enter headline</.test(html)) say("the Enter headline is not set as a heading");
      const bare = renderToString(<FlowPanel {...props} schedToday={undefined} boards={undefined} proposals={undefined} onSaveBoard={undefined} />);
      if (bare.includes("Enter headline")) say("a Flow with no board handler still draws a board");
    } catch (err) { say("the Flow threw: " + err.message); }
  }

  // Assignments as cards, in the order they come due, and a page for each one.
  // Andrew, 2026-09-15: graded is solid with the letter, a green circle for
  // turned in, yellow for came back, red for a missed deadline, New until the
  // grade is read, small pieces at half height once in.
  {
    const now = new Date(2026, 8, 20, 12).getTime();
    const acfg = { ...cfg, path: "/comm118", profileTask: null, assignments: [
      { id: "later", title: "Leadership Guide", due: "Nov 20", dueTime: "11:59 PM", weight: 15 },
      { id: "inclass", title: "In-Class", due: "Ongoing", weight: 25, description: "Weekly Game" },
      { id: "missed", title: "Missed piece", due: "Sep 10", dueTime: "11:59 PM", weight: 20 },
      { id: "graded", title: "Graded piece", due: "Sep 12", dueTime: "11:59 PM", weight: 30, instructionsUrl: "https://docs.test/g" },
      { id: "small", title: "Small piece", due: "Sep 14", dueTime: "11:59 PM", weight: 3 },
      { id: "waiting", title: "Waiting piece", due: "Sep 18", dueTime: "11:59 PM", weight: 20 },
    ] };
    const N = "Ada Lovelace";
    let ad = { assignments: acfg.assignments, assignmentLog: {
      graded: { [N]: [{ id: "s1", ts: now - 9e8, type: "submission", link: "https://x.test" }] },
      small: { [N]: [{ id: "s2", ts: now - 5e8, type: "submission", link: "https://x.test" }] },
      waiting: { [N]: [{ id: "s3", ts: now - 1e8, type: "submission", link: "https://x.test" }] },
    } };
    ad = releasePatch(writeCard(placeCard(ad, "graded", N, "b", 10), "graded", N, { comment: "Tighten the ending." }, 11), "graded", now - 1e7);
    const order = inDueOrder(acfg.assignments).map(a => a.id).join(",");
    if (order !== "inclass,missed,graded,small,waiting,later") say("the assignment cards are not ongoing first, then by due date: " + order);
    const realNow = Date.now;
    Date.now = () => now;
    try {
      const unseen = new Set(unseenGrades(acfg, ad, N).map(u => u.aid));
      const st = (id) => statusOf(acfg, ad, acfg.assignments.find(a => a.id === id), N, unseen, now);
      if (st("graded").state !== "graded" || st("graded").letter !== "B" || !st("graded").isNew) say("a released grade is not a graded, New card: " + JSON.stringify(st("graded")));
      if (st("waiting").state !== "turnedIn") say("work turned in reads " + st("waiting").state);
      if (st("missed").state !== "missed") say("a deadline gone by with nothing in reads " + st("missed").state);
      if (st("later").state !== "open") say("work not due yet reads " + st("later").state);
      // Every card is the same shape now: the whole name, the date and the
      // weight, one marker in the corner, and a chevron on anything with
      // nothing turned in.
      const cardsHtml = renderToString(<AssignmentCards config={acfg} data={ad} name={N} go={noop} />).replace(/<!-- -->/g, "");
      ["Leadership Guide", "Nov 20", "15%", "Missed piece", "20%"].forEach(t => { if (!cardsHtml.includes(t)) say("a card does not show " + JSON.stringify(t)); });
      if (/text-overflow:ellipsis/.test(cardsHtml)) say("a card is still cutting a name short");
      const chevrons = (cardsHtml.match(/›/g) || []).length;
      if (chevrons !== 3) say("the chevron is not on exactly the three challenges with nothing turned in: " + chevrons);
      if (st("inclass").state !== "ongoing") say("the ongoing bucket reads " + st("inclass").state);
      const cards = renderToString(<AssignmentCards config={acfg} data={ad} name={N} go={noop} />).replace(/<!-- -->/g, "");
      // Graded is light blue, not black, and the grade is one ordinary line.
      if (!/background:color-mix\(in srgb, #276fce 12%, var\(--surface-card\)\)[^>]*>[\s\S]*?Graded piece/.test(cards)) say("the graded card is not light blue");
      if (/background:var\(--text-primary\)[^>]*>[\s\S]{0,200}Graded piece/.test(cards)) say("the graded card is black again");
      if (!/Your grade: <strong[^>]*>B<\/strong>/.test(cards)) say("the graded card does not say Your grade: B");
      if (/font-size:36px/.test(cards)) say("the grade is drawn big again");
      // Graded stays green; Incomplete is the yellow neutral face; F is a red X.
      const withLetter = (bucket) => {
        const d2 = releasePatch(placeCard(ad, "graded", N, bucket, 20), "graded", now - 5e6);
        return renderToString(<AssignmentCards config={acfg} data={d2} name={N} go={noop} />);
      };
      if (!/aria-label="Graded"[^>]*background:var\(--state-ok\)|background:var\(--state-ok\)[^>]*aria-label="Graded"|aria-label="Graded" style="[^"]*background:var\(--state-ok\)/.test(cards)) say("a graded card's marker is not green");
      if (!withLetter("incomplete").includes('aria-label="Incomplete"')) say("an Incomplete has no marker");
      if (!/aria-label="F"[^>]*>✕/.test(withLetter("f"))) say("an F does not get the red X");
      // Graded as Complete: Complete 100, Not quite 50, Incomplete and Not
      // submitted 0; Not quite is the yellow face and Incomplete is not.
      const byScale = { ...acfg, assignments: acfg.assignments.map(x => x.id === "graded" ? { ...x, scale: "complete" } : x) };
      const scaled = (bucket) => releasePatch(placeCard({ ...ad, assignments: byScale.assignments }, "graded", N, bucket, 20), "graded", now - 5e6);
      const scoreOf = (bucket) => computeGrade(byScale, scaled(bucket), N).rows.find(r => r.id === "graded");
      [["complete", 100, "Complete"], ["notquite", 50, "Not quite"], ["incomplete-c", 0, "Incomplete"], ["notsubmitted", 0, "Not submitted"]].forEach(([b, score, word]) => {
        const r = scoreOf(b);
        if (r.score !== score || r.letter !== word) say(`${word} does not count ${score}: ` + JSON.stringify(r));
      });
      const nq = renderToString(<AssignmentCards config={byScale} data={scaled("notquite")} name={N} go={noop} />);
      if (!/<svg[^>]*aria-label="Not quite"/.test(nq) || !/Your grade: <strong[^>]*>Not quite</.test(nq)) say("Not quite has no yellow face, or no Your grade: Not quite");
      if (/<svg[^>]*aria-label="Incomplete"/.test(renderToString(<AssignmentCards config={byScale} data={scaled("incomplete-c")} name={N} go={noop} />))) say("Incomplete still wears the face that means Not quite");
      if (bucketsFor(byScale.assignments.find(x => x.id === "graded")).map(b => b.label).join("|") !== "Complete|Not quite|Incomplete|Not submitted") say("a Complete challenge has the wrong columns");
      if (bucketsFor({}).length !== 7) say("a challenge with no scale is not graded in letters");
      const gcfg = { ...cfg, storageKey: "smoke-complete-scale", profileTask: null, assignments: [{ id: "cx", title: "Exercise", due: "Sep 27", weight: 3, scale: "complete" }] };
      warmClassData(gcfg.storageKey, { assignments: gcfg.assignments, students: cfg.students });
      const gv = renderToString(<GradeView config={gcfg} />);
      ['aria-label="Complete"', 'aria-label="Not quite"', 'aria-label="Not submitted"'].forEach(t => { if (!gv.includes(t)) say("Grade view has no column " + t); });
      if (gv.includes('aria-label="Exceptional"')) say("Grade view shows letter columns for a Complete challenge");
      ["Tighten the ending.", ">New<", 'aria-label="Turned in"', 'aria-label="Missed"', 'aria-label="Graded"', "Ongoing", "Small piece", "Waiting piece"].forEach(t => { if (!cards.includes(t)) say("the assignment cards never show " + JSON.stringify(t)); });
      if (!/data-current="1"[^>]*>[\s\S]{0,400}Leadership Guide/.test(cards)) say("the page does not scroll to the next thing due");
      if (/Instructions/.test(cards)) say("a card still says Instructions");
      const pg = renderToString(<AssignmentPage config={acfg} data={ad} update={noop} name={N} id="graded" go={noop} />).replace(/<!-- -->/g, "");
      ["Graded piece", "Your grade: <strong", "Tighten the ending.", "room to sharpen", "Details", "Before", "After", "Send", "A message, a link, or both"].forEach(t => { if (!pg.includes(t)) say("the assignment page never shows " + JSON.stringify(t)); });
      if (!pg.includes("days early") && !pg.includes("a day early")) say("the assignment page does not say how early the work went in");
      // The conversation: newest first, the grade and the due date from
      // Andrew, the student's own message and link from them, and one box to
      // send with. Andrew, 2026-09-15: "it's like imessage."
      const withDue = { ...ad, dueLog: { graded: [{ at: now - 8e8, due: "Sep 12", dueTime: "11:59 PM" }, { at: now - 2e8, due: "Sep 14", dueTime: "11:59 PM" }] } };
      const chat = feedOf(acfg, withDue, acfg.assignments.find(x => x.id === "graded"), N);
      const kinds = chat.map(m => m.kind + ":" + m.from).join(",");
      if (kinds !== "grade:instructor,due:instructor,due:instructor,sent:student") say("the conversation is not newest first, or is missing a message: " + kinds);
      if (!chat.find(m => m.kind === "due").text.startsWith("Due Mon Sep 14")) say("a moved due date does not read as its own message");
      const pg2 = renderToString(<AssignmentPage config={acfg} data={withDue} update={noop} name={N} id="graded" go={noop} />).replace(/<!-- -->/g, "");
      if (!/href="https:\/\/x.test"/.test(pg2)) say("a link a student sent is not a link in the conversation");
      if ((pg2.match(/Sep 14/g) || []).length > 2) say("the page is repeating the date all over again");
      if (pg2.includes("Submit a link") || pg2.includes("All challenges")) say("the page still has the old submit box or the second back link");
    } catch (err) { say("the assignment cards threw: " + err.message); }
    Date.now = realNow;
    // What is waiting on Andrew: work turned in and not graded, and messages
    // with no reply after them, counted per challenge.
    {
      const said = (aid, ts, from, text) => ({ ...ad, assignmentLog: { ...ad.assignmentLog, [aid]: { ...ad.assignmentLog[aid],
        [N]: [...(ad.assignmentLog[aid]?.[N] || []), { id: "m" + ts, ts, type: "comment", from, text }] } } });
      const asked = said("waiting", now - 1e6, "student", "Can I hand this in late?");
      const rows = waitingOn(asked, acfg.assignments);
      const row = rows.find(r => r.id === "waiting");
      if (!row || row.toGrade !== 1 || row.messages !== 1) say("what is waiting on a challenge is counted wrong: " + JSON.stringify(rows));
      if (rows.find(r => r.id === "graded")) say("a graded challenge with nothing new is still listed as waiting");
      const answered = { ...asked, assignmentLog: { ...asked.assignmentLog, waiting: { [N]: [...asked.assignmentLog.waiting[N], { id: "r1", ts: now - 5e5, type: "comment", from: "instructor", text: "Yes, by Friday." }] } } };
      if (waitingOn(answered, acfg.assignments).find(r => r.id === "waiting")?.messages) say("a message that was answered is still waiting");
      const tile = renderToString(<AssignmentsSummary config={acfg} data={asked} role="instructor" />).replace(/<!-- -->/g, "");
      ["Waiting piece", "1 to grade", "1 message"].forEach(t => { if (!tile.includes(t)) say("the instructor's Challenges card never shows " + JSON.stringify(t)); });
      if (waitingCount(asked, acfg.assignments).messages !== 1) say("the messages waiting are counted wrong for the home page");
      // Deleting a message takes it off every screen and every count, and
      // leaves the words in the class record.
      const gone = deletePatch(asked, "waiting", N, "m" + (now - 1e6), N);
      if (waitingOn(gone, acfg.assignments).find(r => r.id === "waiting")?.messages) say("a deleted message is still waiting");
      const kept = gone.assignmentLog.waiting[N].find(e => e.id === "m" + (now - 1e6));
      if (!kept || kept.text !== "Can I hand this in late?" || kept.deleted?.by !== N) say("a deleted message did not stay in the record: " + JSON.stringify(kept));
      if (feedOf(acfg, gone, acfg.assignments.find(x => x.id === "waiting"), N).some(m => m.text === "Can I hand this in late?")) say("a deleted message is still in the conversation");
      // Deleting the work turned in puts the challenge back to not turned in.
      const undone = deletePatch(ad, "waiting", N, "s3", N);
      if (statusOf(acfg, undone, acfg.assignments.find(x => x.id === "waiting"), N, new Set(), now).state === "turnedIn") say("deleting the work still reads as turned in");
    }

    // Apps: yours in More, a student's behind the top-right button.
    const mine = appsFor(acfg, "instructor").map(a => a.label).join(", ");
    if (!/Dashboard/.test(mine) || !/Repository/.test(mine) || !/Games/.test(mine) || !/Around the Horn/.test(mine)) say("your apps are missing one: " + mine);
    if (appsFor(acfg, "student").some(a => /Dashboard|Repository|Grade view/.test(a.label))) say("a student's apps include an instructor surface");
  }

  // Grades so far: a tile per assignment, grey until graded, then the letter.
  // An old number out of 100 reads as the same letter the columns would give.
  if (letterOf(92) !== "A" || letterOf(80) !== "B" || letterOf(79.5) !== "C" || letterOf(60) !== "D" || letterOf(59) !== "F" || letterOf(null) !== null) say("letterOf bands are off");
  try {
    const html = renderToString(<GradeParade config={cfg} data={again} name="Ada Lovelace" accent={cfg.accent} />);
    if (!html.includes(">B<")) say("the parade never showed Ada's B");
    if (!html.includes("Exercise 2")) say("the parade dropped the ungraded assignment");
    if (!html.includes("Exercise 1")) say("the parade dropped the graded assignment's title");
    const small = renderToString(<GradeParade config={cfg} data={again} name="Ada Lovelace" accent={cfg.accent} compact />);
    if (!small.includes(">B<") || !small.includes("not graded yet")) say("the compact parade is missing a tile");
  } catch (err) { say("the parade threw: " + err.message); }
  warmClassData(cfg0.storageKey, warmShapes(cfg0, true));
}

// How far a day title reaches.
//
// COMM 118 had a title written on Sep 21 and Sep 23 and none after, and
// dayTitles carried a written title forward until the next written one — so
// week 1's title was the name of all thirty-two days of the term and every
// later week's topic was overridden. Whatever date Andrew opened, the
// dashboard said "What Our Sports Behaviors Can Tell Us About America".
//
// The rule: a carried title stops at a week that names itself. A week with no
// topic still carries, so a title can still run across a boundary on purpose.
{
  const say = (msg) => { console.error("  FAIL  day titles: " + msg); failedEarly++; };
  const weeks = [
    { id: "w1", topic: "Week one", dates: ["Sep 21", "Sep 23", "Sep 25"] },
    { id: "w2", topic: "Week two", dates: ["Sep 28", "Sep 30"] },
    { id: "w3", topic: "", dates: ["Oct 5", "Oct 7"] },
  ];
  const t = dayTitles(weeks, { "Sep 21": { title: "A title I wrote" } });

  if (t["Sep 21"].title !== "A title I wrote") say("the day it was written on lost it");
  if (t["Sep 23"].title !== "A title I wrote") say("it did not carry to the next day of its own week");
  if (t["Sep 25"].title !== "A title I wrote") say("it did not carry to the third day of its own week");
  if (t["Sep 28"].title !== "Week two") say("a week that names itself did not take its name back: got " + JSON.stringify(t["Sep 28"].title));
  if (t["Sep 30"].title !== "Week two") say("the second day of week two lost the week topic");
  if (t["Sep 21"].span !== 3) say("the run should be the three days of week one, got " + t["Sep 21"].span);

  // A week with no topic of its own still carries what came before.
  const u = dayTitles(weeks, { "Sep 28": { title: "Written in week two" } });
  if (u["Oct 5"].title !== "Written in week two") say("a week with no topic should still carry, got " + JSON.stringify(u["Oct 5"].title));

  // And with nothing written anywhere, every day is its own week's topic.
  const v = dayTitles(weeks, {});
  if (v["Sep 21"].title !== "Week one" || v["Sep 28"].title !== "Week two") say("with no titles written, days should read their week topic");
}

// Teach: the day one thing at a time. And the day's total from section times.
{
  const say = (msg) => { console.error("  FAIL  teach and totals: " + msg); failedEarly++; };
  const none = () => {}; // smoke render, never pressed
  const slotItems = {
    open: { title: "Open", time: "5-10", items: [{ id: "i1", text: "Start with headlines" }, { id: "n1", text: "Ask about the weekend", depth: 1 }] },
    talk: { title: "Talk", time: "20-25", items: [{ id: "i2", text: "Why we care" }] },
  };
  const props = { sections: [["open", "Open"], ["talk", "Talk"]], slotItems, named: new Set(), firstMovable: 0,
    blockOf: () => null, seedById: () => null, doneSet: new Set(), nextId: "i1", pickedId: null, liveLabel: null,
    castItem: none, castSection: (s, n) => ({ type: "quote", title: n, label: n }), dismiss: none, features: {}, hue: () => "#333",
    slidesOn: true, classHref: "/comm118", onSetSlotTitle: none, onSaveItem: none, onSaveBlock: none, onInsertRow: () => "x",
    onRemoveItem: none, onNest: none, onTick: none, isAssigned: () => false, onToggleAssigned: none, drop: none,
    onSetSlotTime: none, onPlaceSection: none, classMinutes: 65 };
  let html = "";
  try { html = renderToString(<DayDoc {...props} />); } catch (e) { say("the document threw: " + e.message); }
  if (!/25–35(<!-- -->)? min/.test(html)) say("the day's total of 5-10 and 20-25 is not shown as 25–35 min");
  if (!/planned of (<!-- -->)?65/.test(html)) say("the total does not say out of how many minutes");
  if ((html.match(/class="doc-time"/g) || []).length !== 2) say("a section has no place for its time");
  if ((html.match(/doc-secgrip/g) || []).length !== 2) say("a section has no handle to drag it by");
  try { html = renderToString(<DayDoc {...props} teach onTeach={none} />); } catch (e) { say("teach threw: " + e.message); html = ""; }
  if (!html.includes('class="teach"')) say("teach does not draw");
  if (!html.includes("Start with headlines")) say("teach does not open on the next thing to do");
  if (!html.includes("Ask about the weekend")) say("teach does not show the notes under the item");
  if (!html.includes("Next: Talk")) say("teach does not say what comes next");
}

// Time on sections, as ranges, and the day's total.
{
  const say = (msg) => { console.error("  FAIL  section times: " + msg); failedEarly++; };
  const r = (t) => JSON.stringify(parseRange(t));
  if (r("5-10") !== '{"lo":5,"hi":10}') say("5-10 read as " + r("5-10"));
  if (r("5–10 min") !== '{"lo":5,"hi":10}') say("an en dash and 'min' did not read");
  if (r("10") !== '{"lo":10,"hi":10}') say("a single number did not read");
  if (r("10 to 5") !== '{"lo":5,"hi":10}') say("a range written backwards did not read");
  if (parseRange("about ten") !== null) say("words were read as a time");
  const t = sumRanges(["5-10", "10", "", "nonsense", "15-20m"]);
  if (t.lo !== 30 || t.hi !== 40 || t.n !== 3) say("the total came to " + JSON.stringify(t) + ", want 30 to 40 over 3 sections");
  if (rangeLabel({ lo: 30, hi: 40 }) !== "30–40" || rangeLabel({ lo: 20, hi: 20 }) !== "20") say("the total is written wrong");
  // A section's time survives the reader every write goes through.
  if (normSlotT({ title: "Open", time: "5-10", items: [] }).time !== "5-10") say("reading a section drops its time, so the next write erases it");
}

// Sections move, split, and come from templates.
{
  const say = (msg) => { console.error("  FAIL  sections and templates: " + msg); failedEarly++; };
  const slots = { a: { title: "A", items: [{ id: "1" }] }, b: { title: "B", items: [] }, c: { title: "C", items: [] } };
  if (Object.keys(placeSection(slots, "c", "a")).join() !== "c,a,b") say("a section dragged above another did not land there");
  if (Object.keys(placeSection(slots, "a", null)).join() !== "b,c,a") say("a section dragged to the end did not land there");
  const day = { a: { title: "Open", items: [{ id: "x" }, { id: "y", text: "Discussion" }, { id: "z" }, { id: "z1", depth: 1 }] } };
  const split = splitSection(day, "a", "y", "Discussion", "sec-new");
  if (Object.keys(split.slots).join() !== "a,sec-new") say("the new section is not straight after the one it split");
  if (split.slots.a.items.map(i => i.id).join() !== "x") say("rows before the line did not stay");
  if (split.slots["sec-new"].title !== "Discussion" || split.slots["sec-new"].items.map(i => i.id).join() !== "z,z1") say("rows after the line did not move into the new section");
  const tpl = { sections: templateOf({ slots: { a: { title: "Game day", time: "5-10", items: [{ id: "old", blockId: "g1", depth: 0 }, { id: "n", text: "Rules", depth: 1 }] } } }) };
  if (JSON.stringify(tpl.sections[0].items[0]) !== '{"blockId":"g1"}') say("a template kept more than what a row points at: " + JSON.stringify(tpl.sections[0].items[0]));
  let n = 0;
  const applied = applyTemplate({ keep: { title: "Already here", items: [] } }, tpl, () => "id" + (++n));
  const keys = Object.keys(applied);
  if (keys[0] !== "keep") say("applying a template replaced what the day had");
  const added = applied[keys[1]];
  if (!added || added.title !== "Game day" || added.time !== "5-10") say("the template's section did not arrive with its name and time");
  if (added && added.items.some(i => i.id === "old")) say("a template row kept an id from the day it came from");
}

// An item and its notes move together.
//
// Moving an item's row alone left its notes behind, where they became notes on
// whatever item came before.
{
  const say = (msg) => { console.error("  FAIL  moving an item: " + msg); failedEarly++; };
  const list = [
    { id: "a" }, { id: "a1", depth: 1 }, { id: "a2", depth: 1 },
    { id: "b" }, { id: "b1", depth: 1 },
    { id: "c" },
  ];
  const ids = (xs) => xs.map(x => x.id).join(",");
  const { group, rest } = takeGroup(list, "a");
  if (ids(group) !== "a,a1,a2") say("lifting an item did not bring its notes: " + ids(group));
  if (ids(placeGroup(rest, group, null)) !== "b,b1,c,a,a1,a2") say("dropping at the end went wrong");
  if (ids(placeGroup(rest, group, "c")) !== "b,b1,a,a1,a2,c") say("dropping before an item went wrong");
  // Dropped onto another item's note, the group goes after that item's notes, not in among them.
  if (ids(placeGroup(rest, group, "b1")) !== "b,b1,a,a1,a2,c") say("an item dropped among another item's notes split them up");
  // A note moves alone.
  const one = takeGroup(list, "a1");
  if (ids(one.group) !== "a1") say("lifting a note took more than the note");
  if (ids(placeGroup(one.rest, one.group, "b1")) !== "a,a2,b,a1,b1,c") say("a note should land exactly before the note it was dropped on");
}

// What a section with no name is called.
//
// It used to be three different things at once: the words "Untitled section"
// on a section Andrew made, the raw storage key on a slot an old sequence left
// behind (so a Freeform day showed the word "opener" as if it were a title),
// and the sequence's own word on a sequence slot. Now: a sequence slot keeps
// the sequence's word, and everything else is Section N, counting down the day.
{
  const say = (msg) => { console.error("  FAIL  section names: " + msg); failedEarly++; };
  const cfg = { defaultSequenceId: "seq", sequences: [{ id: "seq", name: "A sequence", slots: [{ slot: "opener" }, { slot: "problem" }] }] };

  // Sequences are gone. A day that stored one reads like any other: its slot
  // has no word of its own any more, and the empty "problem" slot the sequence
  // declared does not draw.
  const onSeq = sectionsOf(cfg, { sequenceId: "seq", slots: {
    opener: { items: [{ id: "a" }] },
    "sec-1": { items: [{ id: "b" }] },
    "sec-2": { title: "Fishbowl", items: [{ id: "c" }] },
  } });
  const seqMap = Object.fromEntries(onSeq);
  if (seqMap.opener === "opener") say("a slot is still showing the sequence's word, which is gone");
  if (!/^Section \d+$/.test(seqMap.opener || "")) say("a slot that held rows should be Section N, got " + JSON.stringify(seqMap.opener));
  if ("problem" in seqMap) say("an empty slot the sequence declared is still drawing");
  if (seqMap["sec-2"] !== "Fishbowl") say("a section with a real title lost it");
  if (seqMap["sec-1"] !== "Section 1") say("a nameless section should count down the whole day, got " + JSON.stringify(seqMap["sec-1"]));

  // Freeform: no sequence slots at all, so the leftovers number 1, 2, 3.
  const free = sectionsOf(cfg, { sequenceId: "__freeform", slots: {
    opener: { items: [{ id: "a" }] },
    two: { title: "Introduction", items: [{ id: "b" }] },
    three: { items: [{ id: "c" }] },
  } });
  const freeMap = Object.fromEntries(free);
  if (freeMap.two !== "Introduction") say("a written title was overwritten by a number");
  if (freeMap.opener === "opener") say("a Freeform day is still showing the raw slot key as a title");
  if (!/^Section \d+$/.test(freeMap.opener || "")) say("a leftover slot should be Section N, got " + JSON.stringify(freeMap.opener));
  if (!/^Section \d+$/.test(freeMap.three || "")) say("a second leftover slot should be Section N, got " + JSON.stringify(freeMap.three));
  if (freeMap.opener === freeMap.three) say("two nameless sections were given the same number");

  // A title that is only whitespace is not a title.
  const blank = Object.fromEntries(sectionsOf(cfg, { sequenceId: "__freeform", slots: { x: { title: "   ", items: [{ id: "a" }] } } }));
  if (blank.x !== "Section 1") say("a whitespace title should be treated as no title, got " + JSON.stringify(blank.x));
}

// The drawer's three shelves, against every kind that actually exists.
//
// Media / Activities / Notes only works if every kind lands on exactly one
// shelf. A kind that lands on none is a block that cannot be found from the
// dashboard at all, which is the failure nobody would notice until they went
// looking for a podcast during class.
{
  const say = (msg) => { console.error("  FAIL  drawer shelves: " + msg); failedEarly++; };
  const kinds = ["note", "link", "story", "activity", "question", "assignment", "board", "set",
    "video", "podcast", "book-chapter", "quote", "book", "post", "image", "study", "broadcast", "slides", "other"];
  kinds.forEach(k => {
    const hits = SHELVES.filter(s => s.holds(k)).map(s => s.id);
    if (hits.length !== 1) say(`"${k}" lands on ${hits.length} shelves (${hits.join(", ") || "none"}), want exactly 1`);
  });
  // And the ones with an obvious home are in it.
  const where = (k) => shelfOf(k);
  [["link", "media"], ["video", "media"], ["podcast", "media"], ["book-chapter", "media"],
   ["study", "media"], ["broadcast", "media"], ["slides", "media"], ["image", "media"],
   ["activity", "activities"], ["board", "activities"],
   ["note", "notes"], ["story", "notes"]].forEach(([k, want]) => {
    if (where(k) !== want) say(`"${k}" should be on ${want}, is on ${where(k)}`);
  });
  // Every shelf can make something, and what it makes belongs to it.
  SHELVES.forEach(s => {
    if (!s.make) say(s.id + " has nothing New can make");
    else if (shelfOf(s.make) !== s.id) say(`New on ${s.id} makes a "${s.make}", which files to ${shelfOf(s.make)}`);
  });
}

// The whole block under its row, and the day's notes under the day.
//
// A row was only the header of its block. A note's content, a photo and a
// game's questions were a click away in the drawer.
{
  const say = (m) => { console.error("  FAIL  block in the day: " + m); failedEarly++; };
  const none = () => {}; // smoke render, never pressed
  const draw = (el) => { try { return renderToString(el); } catch (e) { say("threw: " + e.message); return ""; } };

  const note = { id: "n1", type: "note", title: "All the summer's big sports stories",
    body: "Start with the Olympics, then https://example.com/story" };
  let html = draw(<Castable kind="Note" title={note.title} block={note} onSaveBody={none} onCast={none} onTick={none} />);
  if (!html.includes("Start with the Olympics")) say("a note's content is not on the day");
  if (!html.includes('href="https://example.com/story"')) say("a web address in the content is not a link");
  if (!html.includes("editable")) say("a note's content cannot be edited on the day");

  const photo = { id: "p1", type: "note", title: "Theo", media: { kind: "image", src: "https://example.com/theo.jpg" } };
  html = draw(<Castable kind="Note" title="Theo" block={photo} onCast={none} onTick={none} />);
  if (!html.includes('src="https://example.com/theo.jpg"')) say("a photo on a block is not shown");

  const game = { id: "g1", type: "set", title: "Weekly Game", children: ["q1", "q2"] };
  const kids = [{ id: "q1", type: "question", title: "One?" }, { id: "q2", type: "question", title: "Two?" }];
  html = draw(<Castable kind="Set" title="Weekly Game" block={game} kids={kids} onCast={none} onTick={none} />);
  if (!html.includes("Show 2 questions")) say("a game does not offer its questions");

  const board = { id: "bd", type: "board", title: "Exit", body: "x".repeat(900) };
  html = draw(<Castable kind="Board" title="Exit" block={board} onCast={none} onTick={none} />);
  if (!html.includes("Show all")) say("long content does not fold");
  if (html.includes("flow-body folded editable")) say("a board's posts are editable from the day");

  const spring = { ...fullPlan, spring: { date: "Apr 6", mine: "Gianna picture", students: "I'm off to Austin" } };
  html = draw(<FlowPanel plan={spring} seq={seq} seeds={seeds} castNow={none} dismiss={none} liveLabel={null}
    accent="#333" onClaim={none} features={[]} onFeature={none} planHref="/x" onSlidesClaim={none} onBlockClaim={none}
    where="COMM 1 · Sep 1" loose={[]} onAddScheduled={none} onAddItem={none} onRemoveItem={none}
    onMoveItem={none} onSetSequence={none} onSetSlotTitle={none} sequences={[seq]} onSaveDayNote={none} onSaveSpring={none} />);
  if (!html.includes("Gianna picture")) say("the Spring 2026 note is not under the day");
  if (!html.includes("off to Austin")) say("the Spring 2026 note for students is not under the day");
  if (!html.includes("a day note")) say("the day note is not under the day");
}

// The students' schedule: a week's items in day order, with their dates and sources.
//
// Items were listed in the order they were added, so a reading put on Monday
// after the term was built sat under Friday's, and nothing said where a
// reading came from.
{
  const say = (m) => { console.error("  FAIL  student schedule: " + m); failedEarly++; };
  const week = { id: "w1", topic: "Week one", dates: ["Sep 21", "Sep 23", "Sep 25"], items: [
    { id: "a", type: "reading", title: "Friday reading", url: "https://www.theatlantic.com/x", date: "Fri" },
    { id: "b", type: "reading", title: "Wednesday reading", url: "https://www.nytimes.com/y", date: "Wed" },
    { id: "c", type: "reading", title: "Monday reading", libId: "blk", date: "Mon" },
  ] };
  const blockOf = (id) => (id === "blk" ? { id: "blk", source: "Billings, Communication and Sport" } : null);
  let html = "";
  try {
    html = renderToString(<ScheduleDetail config={{ accent: "#333", scheduleWeeks: [] }} role="student"
      data={{ schedule: [week] }} blockOf={blockOf} />);
  } catch (e) { say("threw: " + e.message); }
  if (html) {
    const at = (t) => html.indexOf(t);
    if (!(at("Monday reading") < at("Wednesday reading") && at("Wednesday reading") < at("Friday reading"))) say("readings are not in day order");
    if (!html.includes("theatlantic.com")) say("a link's site is not shown as its source");
    if (!html.includes("Billings, Communication and Sport")) say("a block's written source is not shown");
    if (!html.includes("Wed Sep 23")) say("a reading says Wed without saying which Wednesday");
  }

  // A deadline on a day the class does not meet. COMM 3's exercises are due on
  // Sundays, and the item sat under Friday reading "Due Sunday, Sep 27: ...",
  // because a week only knew its class dates.
  const due = { ...week, items: [{ id: "d", type: "assignment", title: "Framing exercise due", date: "Sun", asgId: "ex1" }] };
  let dueHtml = "";
  try {
    dueHtml = renderToString(<ScheduleDetail config={{ accent: "#333", path: "/comm3", scheduleWeeks: [] }} role="student"
      data={{ schedule: [due] }} blockOf={() => null} />);
  } catch (e) { say("a deadline threw: " + e.message); }
  if (dueHtml && !dueHtml.includes("Sun Sep 27")) say("a Sunday deadline does not say which Sunday");
  if (dueHtml && !dueHtml.includes('href="/comm3/challenges/ex1"')) say("a deadline does not open its assignment");
  if (dateInWeek({ dates: ["Dec 7", "Dec 9"] }, "Fri") !== "Dec 11") say("the Friday of a two-day finals week is not Dec 11");
  // The badge names the weekday and the time. Dates carry no year and are read
  // as 2026, so this only means something while Dec 31 is more than a week off.
  if (Date.now() < new Date(2026, 11, 20).getTime() && dueText("Dec 31", "11:59 PM") !== "Due Thu Dec 31, 11:59 PM")
    say("an assignment's due badge does not say the weekday and the time: " + dueText("Dec 31", "11:59 PM"));
  if (dueText("Ongoing", "") !== "Ongoing") say("an ongoing assignment does not say Ongoing");
  // Thursday noon, due Friday night: tomorrow, not two days.
  {
    const was = Date.now;
    Date.now = () => new Date(2026, 9, 8, 12, 0).getTime();
    const t = dueText("Oct 9", "11:59 PM"), same = dueText("Oct 8", "11:59 PM"), gone = dueText("Oct 7", "11:59 PM");
    Date.now = was;
    if (t !== "Due tomorrow, 11:59 PM") say("Thursday noon, something due Friday night reads " + JSON.stringify(t));
    if (same !== "Due today, 11:59 PM") say("something due tonight reads " + JSON.stringify(same));
    if (gone !== "1 day past due") say("something due yesterday reads " + JSON.stringify(gone));
  }
}

// What students see on a week: games and Headlines from the day plans, and the
// week's readings and assignments. The week's own activity rows, copied in from
// Spring, never followed the day, so they are not shown.
{
  const say = (m) => { console.error("  FAIL  student schedule items: " + m); failedEarly++; };
  const week = { id: "w1", dates: ["Sep 21", "Sep 23", "Sep 25"], items: [
    { id: "a1", type: "activity", title: "Fishbowl", date: "Wed" },
    { id: "a2", type: "activity", title: "Game", date: "Wed" },
    { id: "r1", type: "reading", title: "A reading", date: "Mon" },
    { id: "s1", type: "assignment", title: "Interview due", date: "Fri" },
  ] };
  const blocks = {
    g: { id: "g", type: "set", title: "Weekly Game, week 1", children: ["q"] },
    q: { id: "q", type: "question", title: "Q", tags: ["weekly game"] },
    sv: { id: "sv", type: "set", title: "Eating habits", children: ["q2"] },
    q2: { id: "q2", type: "question", title: "Q2", tags: ["survey"] },
  };
  const plans = {
    "Sep 21": { slots: { open: { title: "Open", items: [{ id: "x1", feature: "Headlines" }, { id: "x2", text: "A note" }] } } },
    "Sep 23": { slots: { mid: { title: "Mid", items: [{ id: "x3", blockId: "g" }, { id: "x4", blockId: "sv" }] } } },
    "Sep 25": { slots: { end: { title: "End", items: [{ id: "x5", feature: "Around the Horn" }, { id: "x6", feature: "Game" }] } } },
  };
  const got = studentItems(week, plans, (id) => blocks[id]).map(it => (it.date || "") + " " + it.title);
  const want = ["Mon A reading", "Fri Interview due", "Mon Headlines", "Wed Weekly Game, week 1", "Fri Game"];
  if (JSON.stringify(got.slice().sort()) !== JSON.stringify(want.slice().sort())) say("got " + JSON.stringify(got) + ", want " + JSON.stringify(want));
}

// The day as a document, with each block's slide beside it.
//
// A slide is one of the slide templates, chosen by the row's kind, drawn by the
// same component on the wall and in the column. So every kind has to land on
// its template, carry only words it was given, and draw without throwing, on
// both grounds.
{
  const say = (m) => { console.error("  FAIL  slides: " + m); failedEarly++; };
  const none = () => {}; // smoke render, never pressed
  const cfg = { path: "/comm118" };
  const I = { id: "i" };
  const assignments = [{ title: "Interview Assignment", due: "Oct 9", dueTime: "11:59 PM", instructionsUrl: "https://docs.google.com/d/1" }];
  const cases2 = [
    ["item", { item: I, block: { type: "note", title: "Tiger", body: "(while wearing a helmet)" }, title: "Tiger" }, "item"],
    ["headline wins", { item: I, block: { type: "note", title: "Tiger", headline: "Tiger changed golf." }, title: "Tiger", claim: "Tiger changed golf." }, "item"],
    ["article", { item: I, block: { type: "link", title: "Story", url: "https://www.theatlantic.com/x" }, title: "Story" }, "article"],
    ["photo", { item: I, block: { type: "note", title: "Theo", media: { kind: "image", src: "https://e.com/t.jpg" } }, title: "Theo" }, "image"],
    ["clip", { item: I, block: { type: "note", title: "Clip", media: { kind: "video", src: "https://e.com/c.mp4" } }, title: "Clip" }, "media"],
    ["memo", { item: I, block: { type: "note", title: "Memo", media: { kind: "audio", src: "https://e.com/m.m4a" } }, title: "Memo" }, "media"],
    ["image url", { item: I, block: { type: "image", title: "Chart", url: "https://e.com/chart.png" }, title: "Chart" }, "image"],
    ["activity row", { item: { id: "i", feature: "Around the Horn" }, title: "Around the Horn" }, "activity"],
    ["headlines", { item: { id: "i", feature: "Headlines" }, title: "Headlines" }, "headlines"],
    ["typed row", { item: { id: "i", text: "Start with headlines" }, title: "Start with headlines" }, "item"],
    ["game", { item: I, block: { type: "set", title: "Weekly Game, week 1", children: ["a", "b", "c"] }, title: "Weekly Game, week 1" }, "game"],
    ["question", { item: I, block: { type: "question", title: "Why?", q: { options: ["One", "Two", "Three"], correct: 1 } }, title: "Why?" }, "question"],
    ["board", { item: I, block: { type: "board", title: "Why care?", body: "Alec Berger: Sports matter. More here.\nJack L: They teach.\nSam C: Community!" }, title: "Why care?" }, "board"],
    ["assignment", { item: I, block: { type: "assignment", title: "Interview Assignment" }, title: "Interview Assignment", assignments }, "assignment"],
    ["quote", { item: I, block: { type: "quote", title: "Attention, not will.", body: "Simone Weil", url: "https://x.com/q" }, title: "Attention, not will." }, "quote"],
    ["podcast", { item: I, block: { type: "podcast", title: "A show", url: "https://www.nytimes.com/p" }, title: "A show" }, "podcast"],
    ["chapter", { item: I, block: { type: "book-chapter", title: "Communication and Sport, Chapter 8: Sport and Mythology", body: "Billings" }, title: "Communication and Sport, Chapter 8: Sport and Mythology" }, "chapter"],
    ["video", { item: I, block: { type: "link", title: "A clip", url: "https://www.youtube.com/watch?v=x" }, title: "A clip" }, "video"],
  ];
  cases2.forEach(([name, input, want]) => {
    const cast = slideOf(input);
    if (!cast) { say(name + " has no slide"); return; }
    const got = cast.type === "slide" ? cast.template : cast.type;
    if (got !== want) say(name + " makes a " + got + " slide, want " + want);
    for (const ground of ["paper", "slate"]) {
      try { renderToString(<Slide cast={cast} config={cfg} ground={ground} />); } catch (e) { say(name + " slide threw on " + ground + ": " + e.message); }
    }
  });
  const sl = (i) => slideOf(cases2[i][1]);
  if (sl(1).label !== "Tiger changed golf.") say("the slide does not go up under its headline");
  if (sl(10).count !== 3) say("a game's ticket does not count its questions");
  if (sl(12).posts.join("|") !== "Sports matter.|They teach.|Community!") say("a board's posts keep their names, or more than a first sentence: " + JSON.stringify(sl(12).posts));
  if (sl(13).due !== "Oct 9" || sl(13).dueTime !== "11:59 PM") say("an assignment does not carry its due date from the class");
  if (sl(13).url !== "https://docs.google.com/d/1") say("an assignment does not link to its instructions");
  if (sl(16).chapter !== "Chapter 8" || sl(16).chapterName !== "Sport and Mythology" || sl(16).book !== "Communication and Sport") say("a chapter's title is not split into book and chapter");
  // Notes are on a slide only when the row asks.
  if (sl(0).notes) say("notes arrived on a slide nobody asked for");
  const withNotes = slideOf({ ...cases2[0][1], notes: ["Daejon Love", "The World Cup"] });
  const nh = renderToString(<RoomSlide slide={withNotes} ground="paper" />);
  if (!nh.includes("Daejon Love") || !nh.includes("The World Cup")) say("notes asked for are not on the slide");
  // Nothing in the corners, and a link on the words that name the thing.
  const ah = renderToString(<RoomSlide slide={sl(2)} ground="slate" />);
  if (!ah.includes('href="https://www.theatlantic.com/x"')) say("an article's slide has no link to the article");
  // A row can settle an article's look: clipping, or picture beside the headline.
  const lookOf = (look) => slideOf({ ...cases2[2][1], item: { id: "i", slideLook: look } });
  if (lookOf("clipping").look !== "clipping") say("an article row's chosen look does not reach its slide");
  const asClip = renderToString(<RoomSlide slide={lookOf("clipping")} ground="paper" />);
  const asPic = renderToString(<RoomSlide slide={lookOf("picture")} ground="paper" />);
  if (asClip.includes("grid-template-columns:700px") || !asPic.includes("grid-template-columns:700px")) say("clipping and picture draw the same article slide");
  const all = cases2.map((c, i) => (sl(i)?.type === "slide" ? renderToString(<RoomSlide slide={sl(i)} ground="paper" />) : "")).join("");
  for (const word of [">activity<", ">article<", ">note<", ">item<", ">question<", ">link<"]) {
    if (all.toLowerCase().includes(word)) say("a slide carries a kind label: " + word);
  }
  const clip = renderToString(<Slide cast={sl(4)} config={cfg} />);
  if (/autoplay/i.test(clip)) say("a clip plays in its slide");

  // The day plan: a slide beside a block, none beside a note under it, and no arrow where the slide is the button.
  const day = { sequenceId: "s", slots: { opener: { title: "Open", items: [
    { id: "r1", text: "Start with headlines" },
    { id: "r2", text: "A note under it, see https://www.theatlantic.com/sports/story", depth: 1 },
  ] } } };
  const html = renderToString(<FlowPanel plan={day} seq={seq} seeds={[]} castNow={none} dismiss={none} liveLabel={null}
    accent="#333" onClaim={none} features={[]} onFeature={none} planHref="/x" onSlidesClaim={none} onBlockClaim={none}
    where="COMM 1 · Sep 1" loose={[]} onAddScheduled={none} onAddItem={none} onRemoveItem={none}
    onMoveItem={none} onSetSequence={none} onSetSlotTitle={none} sequences={[seq]} classHref="/comm118" />);
  const slides = (html.match(/class="slide slide-press/g) || []).length;
  // One for the section, one for the item, none for the comment under the item.
  if (slides !== 2) say(slides + " slides on a day with one section, one item and one comment under it, want 2");
  // The day is a document: every line a text box, at one of three levels.
  if (!html.includes("lv-section")) say("the section is not a line you can type into");
  if ((html.match(/doc-line lv-item/g) || []).length !== 1) say("the item is not a line you can type into");
  // The note holds a web address, so until the cursor goes into it the note is
  // shown as text with a link you can press.
  if ((html.match(/doc-line doc-linetext lv-comment/g) || []).length !== 1) say("a note holding a link is not shown as text you can click into");
  if (!/class="doc-inlink" href="https:\/\/www.theatlantic.com\/sports\/story"/.test(html)) say("the web address in a note is not a link you can press");
  // Every item that is not an activity or a seed can have its kind chosen.
  if (!html.includes('title="Choose kind"')) say("an item's kind cannot be chosen by pressing it");
  // A note given a slide gets one, stacked with its item's.
  const withNoteSlide = { ...day, slots: { opener: { ...day.slots.opener, items: day.slots.opener.items.map(r => (r.id === "r2" ? { ...r, slide: true } : r)) } } };
  const html2 = renderToString(<FlowPanel plan={withNoteSlide} seq={seq} seeds={[]} castNow={none} dismiss={none} liveLabel={null}
    accent="#333" onClaim={none} features={[]} onFeature={none} planHref="/x" onSlidesClaim={none} onBlockClaim={none}
    where="COMM 1 · Sep 1" loose={[]} onAddScheduled={none} onAddItem={none} onRemoveItem={none}
    onMoveItem={none} onSetSequence={none} onSetSlotTitle={none} sequences={[seq]} classHref="/comm118" />);
  const slides2 = (html2.match(/class="slide slide-press/g) || []).length;
  if (slides2 !== 3) say(slides2 + " slides once the note was given one, want 3");
  if (/flow-sec-n|flow-tally|flow-secmove/.test(html)) say("the section still carries its numeral, tally or move arrows");
  // A comment can be picked up, and a web address in a line is a link that goes on the room screen.
  if (!html.includes("doc-grip")) say("a comment has no handle to drag it by");
  // The address typed into the note is a link inside the note's own words now,
  // and pressing it offers the room screen; the pill beside a line is for a
  // block's own link, so the same address is not shown twice.
  if (/doc-link-go[^>]*>theatlantic.com</.test(html)) say("a web address typed into a note shows twice, in the words and as a pill");
  if (!html.includes('href="https://www.theatlantic.com/sports/story"')) say("the link cannot be opened in a tab");
  if (html.includes("Put this row on the room screen")) say("the arrow is still there beside a slide");
  if (!html.includes("Hide slides")) say("the slide column cannot be closed");
}

// Activities by kind, with a game's questions inside the game.
//
// Ninety-six questions listed one by one buried the ten teaching moves and the
// boards. A question in a game is drawn inside the game; a question in no game
// stays on the shelf, so none can go missing.
{
  const say = (m) => { console.error("  FAIL  activities shelf: " + m); failedEarly++; };
  const blocks = [
    { id: "a1", type: "activity", title: "Fishbowl move" },
    { id: "bd", type: "board", title: "Exit board" },
    { id: "g1", type: "set", title: "Weekly Game, week 1", children: ["q1", "q2", "q3"] },
    { id: "q1", type: "question", title: "Tucked question one" },
    { id: "q2", type: "question", title: "Tucked question two" },
    { id: "q3", type: "question", title: "Tucked question three" },
    { id: "q9", type: "question", title: "Loose question" },
  ];
  let html = "";
  try {
    html = renderToString(<Drawer blocks={blocks} hue={() => "#047857"} startShelf="activities"
      features={[]} onPick={() => {}} onNew={() => {}} blockOf={() => null} />); // smoke render, never clicked
  } catch (e) { say("threw: " + e.message); }
  if (html) {
    if (html.includes("Tucked question")) say("a question inside a game is listed on the shelf");
    if (!html.includes("Loose question")) say("a question in no game went missing");
    if (!html.includes("3 questions")) say("the game does not say how many questions it holds");
    const heads = (html.match(/class="draw-grouphead"/g) || []).length;
    if (heads !== 4) say(heads + " kind headings, want 4 (activity, question, board, set)");
    if (html.indexOf("Fishbowl move") > html.indexOf("Weekly Game")) say("kinds are out of order");
  }
}

// The whole term, both ways of reading it.
//
// It is a popup over the day, so nothing else on the dashboard renders it and
// it would otherwise go untested until it threw in front of a class. Both
// views get a real eleven-week shape with a built day, an empty day, a
// nameless section and an assignment due.
{
  const say = (msg) => { console.error("  FAIL  the whole term: " + msg); failedEarly++; };
  const weeks = [
    // Two readings and a game, hung on the Wednesday the way the real term
    // hangs them, so the map can count what is on a day.
    { id: "w1", topic: "Week one", dates: ["Sep 21", "Sep 23", "Sep 25"], items: [
      { id: "i1", type: "reading", date: "Wed", title: "A reading" },
      { id: "i2", type: "reading", date: "Wed", title: "Another reading" },
      { id: "i3", type: "activity", date: "Wed", title: "Game" },
    ] },
    { id: "w2", topic: "", dates: ["Sep 28", "Sep 30"], items: [] },
  ];
  const plans = { "Sep 21": { sequenceId: "__freeform", done: ["r1"], slots: {
    "sec-a": { title: "Introduction", items: [
      { id: "r1", text: "Wear a 49ers helmet" },
      { id: "r2", blockId: "b1" },
    ] },
    "sec-b": { items: [{ id: "r3", text: "A row in a nameless section" }] },
  } },
  // A day the room does not meet on, which the map draws in its own colour.
  "Sep 25": { noMeeting: true } };
  const block = { id: "b1", type: "link", title: "Are You Not Entertained?", url: "https://www.theatlantic.com/x", headline: "" };
  const props = { config: cfg0, weeks, plans, assignments: [{ due: "Sep 30", title: "Interview Assignment" }],
    day: "Sep 21", onPick: noop, onClose: noop, onWeekTopic: noop, onDayTitle: noop, onDayKind: noop,
    blockOf: (id) => (id === "b1" ? block : null) };

  // The shapes a day plan actually comes in, including the two that threw.
  //
  // A day can have a plan and NO slots — a sequence picked and nothing put in
  // it — so the stored plan is `{ sequenceId }` and nothing else. sectionsOf
  // still answers with that sequence's own slots, because the shape of the day
  // is real even when it is empty, so the outline asked an object that did not
  // exist for its "opener" and took the whole panel down with it. Andrew hit
  // this the first time he opened the quarter on a real term.
  {
    const rough = {
      "Sep 21": { sequenceId: "__freeform", slots: { "sec-a": { title: "Introduction", items: [{ id: "r1" }] } } },
      "Sep 23": { sequenceId: "motivated" },                 // a plan with no slots at all
      "Sep 25": {},                                          // a plan with nothing in it
      "Sep 28": { sequenceId: "motivated", slots: {} },       // slots present but empty
      "Sep 30": { slots: { opener: null } },                  // a slot key holding nothing
    };
    const weeks2 = [
      { id: "w1", topic: "Week one", dates: ["Sep 21", "Sep 23", "Sep 25"], items: [] },
      { id: "w2", topic: "Week two", dates: ["Sep 28", "Sep 30"], items: [] },
    ];
    for (const view of ["outline", "map"]) {
      try {
        renderToString(<TermOutline {...props} weeks={weeks2} plans={rough} startView={view} />);
      } catch (err) {
        say(`${view}: a day plan with no slots threw — ` + err.message);
      }
    }
  }

  for (const view of ["outline", "map"]) {
    try {
      const raw = renderToString(<TermOutline {...props} startView={view} />);
      // A sentence built from several expressions comes back with comment
      // markers between them — "1<!-- --> of <!-- -->3 done" — so a plain
      // includes() for the sentence fails on markup that is perfectly correct.
      const html = raw.replace(/<!-- -->/g, "");
      if (!html.includes(cfg0.name)) say(`${view}: the panel does not name the class`);
      if (!html.includes("Sep 21")) say(`${view}: today is missing`);
      if (view === "outline") {
        if (!html.includes("Introduction")) say("outline: a named section is missing");
        // The nameless one still has to say something, and it must be the same
        // words the day itself uses for it.
        if (!/Section \d+/.test(html)) say("outline: a nameless section shows nothing at all");
        // One day of the five has rows on it, and one of its three is done.
        if (!html.includes("1 of 3 done")) say("outline: the day does not say how far through it is");
        if (!html.includes("1 of 5 days built")) say("outline: the header count is wrong");
        if (!html.includes("Interview Assignment due")) say("outline: an assignment due date never shows");
        // A Sunday deadline is inside its week even though the class never meets on a Sunday.
        const sunday = renderToString(<TermOutline {...props} startView={view}
          assignments={[{ due: "Sep 27", title: "Framing exercise" }]} />).replace(/<!-- -->/g, "");
        if (!sunday.includes("Framing exercise due")) say("outline: a deadline on a day with no class never shows");
        if (!html.includes("3 on the week")) say("outline: what a week is carrying is not counted");
        // An open day is the day, row for row — section headers alone were a
        // summary of a summary, and the Map is where a day is a count.
        if (!html.includes("Wear a 49ers helmet")) say("outline: an open day is not showing its rows");
        if (!html.includes("Are You Not Entertained?")) say("outline: a row backed by a block shows nothing");
        if (!html.includes("theatlantic.com")) say("outline: a row does not say where it came from");
        if (!html.includes("A row in a nameless section")) say("outline: a nameless section hides its rows");
        // Every day is nameable, not just every week.
        if (!/term-dtitle/.test(html)) say("outline: a day cannot be named");
        if ((html.match(/term-dtitle/g) || []).length < 3) say("outline: not every day of the open week can be named");
        // The same hands as the day plan: drag a row, and add one.
        if (!/draggable/.test(html)) say("outline: rows cannot be dragged");
        if (!html.includes("+ Add to Introduction")) say("outline: a section offers no way to add to it");
        if ((html.match(/term-addrow/g) || []).length < 2) say("outline: not every section can be added to");
      }
      // And the Map stays a count: it must NOT print the rows.
      if (view === "map") {
        if (html.includes("Wear a 49ers helmet")) {
          say("map: rows leaked into the map, which is meant to be section titles only");
        }
        // But it must say what each day is CALLED. A map of dates is not a map.
        if (!html.includes("term-celltitle")) say("map: no day carries its title");
        if (!html.includes("Week one")) say("map: a day is not showing the title it inherits");
        // The sections came out of the map. What is left is how much of the
        // day exists: slides, readings, and whether there is a game.
        if (html.includes("Introduction") || /Section \d+/.test(html)) say("map: the sections are back");
        if (!/\d+ slides?/.test(html)) say("map: a built day does not say how many slides it holds");
        if (!/\d+ readings?/.test(html)) say("map: the readings on a day are not counted");
        if (!html.includes("Game")) say("map: a day with a game does not say so");
        // Every day can be named as a class, a day with no in-person meeting,
        // or a sit-down, and the cell carries the kind so colour can follow.
        if (!html.includes("term-cellkind")) say("map: a day cannot be told what kind of day it is");
        if (!html.includes('data-kind="off"')) say("map: a day with no in-person meeting is not marked");
        const sat = renderToString(<TermOutline {...props} startView="map"
          plans={{ ...props.plans, "Sep 23": { ...(props.plans["Sep 23"] || {}), kind: "sitdown" } }} />);
        if (!sat.includes('data-kind="sitdown"')) say("map: a sit-down is not marked");
        // A deadline off a class day lands on the next class day, with its own
        // date on it, rather than falling off the map.
        const sunday = renderToString(<TermOutline {...props} startView="map"
          assignments={[{ due: "Sep 27", title: "Framing exercise" }]} />).replace(/<!-- -->/g, "");
        if (!sunday.includes("Framing exercise due Sep 27")) say("map: a deadline on a day with no class never shows");
        // And one on a class day says nothing extra.
        const onDay = renderToString(<TermOutline {...props} startView="map"
          assignments={[{ due: "Sep 23", title: "Framing exercise" }]} />).replace(/<!-- -->/g, "");
        if (!onDay.includes("Framing exercise due<")) say("map: a deadline on a class day is not plain");
      }
      if (view === "map" && !html.includes("empty")) say("map: an empty day is not marked as one");
    } catch (err) {
      say(view + ": " + err.message);
    }
  }
}

// How you add a note to a section.
//
// The box to type one was a TAB called "Add", inside a panel opened by a button
// called "+ Add", and with blocks on the shelf the panel opened on the library
// list instead — so the answer to "how do I add a note" was a list of sixty-one
// readings somebody else wrote. Andrew asked how to do it, which is the only
// evidence that matters.
{
  const say = (m) => { console.error("  FAIL  adding a note: " + m); failedEarly++; };
  const src = readFileSync(new URL("../src/engine/Dashboard.jsx", import.meta.url), "utf8");
  const start = src.indexOf("function AddToFlow(");
  const fn = src.slice(start, src.indexOf("\n}", src.indexOf("// Move and remove, on the row itself", start)));
  if (start < 0) say("AddToFlow is gone");

  // Nothing is selected to begin with, so no list can hide the box.
  if (/useState\(blocks\?\.length \? "lib"/.test(fn)) say("the panel opens on the library again, burying the box");
  if (!/const \[mode, setMode\] = useState\(""\)/.test(fn)) say("the panel opens with a list chosen rather than none");
  // The box is not behind a mode.
  const boxAt = fn.indexOf("Type an item, or paste a link");
  if (boxAt < 0) say("the box lost its placeholder, so nothing says what it takes");
  const firstMode = fn.indexOf('mode === "');
  if (boxAt < 0 || (firstMode >= 0 && boxAt > firstMode)) {
    say("the box is behind a mode check again, so it is a tab rather than the first thing in the panel");
  }
  // And no tab is called the same thing as the button that opens the panel.
  if (/tab\("note", "Add"\)/.test(fn)) say('a tab is called "Add" again, like the button that opened it');
}

// Moving a row between sections, which the outline can do across days.
//
// The same-day case is the one that eats a row: remove from one slot and add to
// another, both on the same plan object, and reading the destination off the
// ORIGINAL plan throws the removal away — the row lands in the new section and
// is still sitting in the old one, or vanishes from both. So the arithmetic is
// tested here rather than discovered on a term Andrew has built.
{
  const say = (m) => { console.error("  FAIL  moving a row: " + m); failedEarly++; };
  const seed = () => ({
    dayPlans: {
      "Sep 21": { slots: { a: { items: [{ id: "r1" }, { id: "r2" }] }, b: { items: [{ id: "r3" }] } } },
      "Sep 23": { slots: { c: { items: [] } } },
    },
  });
  // The same mover the outline is given, lifted out so it can be run alone.
  const move = (prev, fromDate, fromSlot, itemId, toDate, toSlot) => {
    if (fromDate === toDate && fromSlot === toSlot) return prev;
    const plans = { ...(prev.dayPlans || {}) };
    const src = { ...(plans[fromDate] || {}) };
    const srcSlot = normSlotT((src.slots || {})[fromSlot]);
    const row = (srcSlot.items || []).find(x => x.id === itemId);
    if (!row) return prev;
    plans[fromDate] = { ...src, slots: { ...(src.slots || {}), [fromSlot]: { ...srcSlot, items: srcSlot.items.filter(x => x.id !== itemId) } } };
    const dstBase = fromDate === toDate ? plans[toDate] : { ...(plans[toDate] || {}) };
    const dstSlot = normSlotT((dstBase.slots || {})[toSlot]);
    plans[toDate] = { ...dstBase, slots: { ...(dstBase.slots || {}), [toSlot]: { ...dstSlot, items: [...(dstSlot.items || []), row] } } };
    return { ...prev, dayPlans: plans };
  };
  const ids = (st, date, slot) => (((st.dayPlans[date] || {}).slots || {})[slot]?.items || []).map(x => x.id);

  // Same day, one section to another.
  let st = move(seed(), "Sep 21", "a", "r1", "Sep 21", "b");
  if (ids(st, "Sep 21", "a").join() !== "r2") say("same day: the row did not leave the section it came from, got " + ids(st, "Sep 21", "a").join());
  if (ids(st, "Sep 21", "b").join() !== "r3,r1") say("same day: the row did not land where it was dropped, got " + ids(st, "Sep 21", "b").join());

  // Across days.
  st = move(seed(), "Sep 21", "b", "r3", "Sep 23", "c");
  if (ids(st, "Sep 21", "b").length) say("across days: the row is still on the day it left");
  if (ids(st, "Sep 23", "c").join() !== "r3") say("across days: the row never arrived, got " + ids(st, "Sep 23", "c").join());

  // Nothing is lost or duplicated, whichever way it goes.
  const all = (s) => Object.values(s.dayPlans).flatMap(p => Object.values(p.slots || {})).flatMap(x => (x.items || []).map(i => i.id)).sort().join();
  if (all(st) !== "r1,r2,r3") say("across days: the set of rows changed, got " + all(st));
  // A drop on the section it already sits in changes nothing.
  const same = move(seed(), "Sep 21", "a", "r1", "Sep 21", "a");
  if (all(same) !== "r1,r2,r3") say("a drop on its own section lost a row");
}

// Moving a section up and down the day.
//
// The day hides a slot that is neither one Andrew made nor holding anything —
// a leftover `opener` from a sequence the day no longer runs. Those keys are
// still in the stored order, so stepping one place through the RAW key list
// could swap a section past a slot that is not drawn, and the page would come
// back looking identical. A button that sometimes does nothing is a button you
// stop trusting, which is exactly what Andrew reported.
{
  const say = (m) => { console.error("  FAIL  moving a section: " + m); failedEarly++; };
  const isSec = (k) => k.startsWith("sec-");
  // The same mover the dashboard uses, lifted out so it can be run alone.
  const move = (slots, slot, delta) => {
    const shown = (k) => isSec(k) || (normSlotT(slots[k]).items || []).length;
    const all = Object.keys(slots);
    const vis = all.filter(shown);
    const at = vis.indexOf(slot);
    const to = at + delta;
    if (at < 0 || to < 0 || to >= vis.length) return slots;
    const other = vis[to];
    const ai = all.indexOf(slot), bi = all.indexOf(other);
    [all[ai], all[bi]] = [all[bi], all[ai]];
    const next = {};
    all.forEach(k => { next[k] = slots[k]; });
    return next;
  };
  const drawn = (slots) => Object.keys(slots).filter(k => isSec(k) || (normSlotT(slots[k]).items || []).length);

  // A hidden empty `opener` sits between the two sections Andrew can see.
  const seed = () => ({
    "sec-a": { title: "Introduction", items: [{ id: "x" }] },
    opener: { items: [] },                                   // drawn: no
    "sec-b": { title: "The weekly game", items: [{ id: "y" }] },
  });

  let s = move(seed(), "sec-a", 1);
  if (drawn(s).join() !== "sec-b,sec-a") {
    say("down past a hidden slot did nothing on screen, got " + drawn(s).join());
  }
  s = move(seed(), "sec-b", -1);
  if (drawn(s).join() !== "sec-b,sec-a") {
    say("up past a hidden slot did nothing on screen, got " + drawn(s).join());
  }
  // The hidden slot stays where it was rather than being shuffled about.
  if (!Object.keys(s).includes("opener")) say("the hidden slot was dropped");
  // The ends do not wrap.
  if (drawn(move(seed(), "sec-a", -1)).join() !== "sec-a,sec-b") say("the first section moved up off the top");
  if (drawn(move(seed(), "sec-b", 1)).join() !== "sec-a,sec-b") say("the last section moved down off the end");
  // Nothing is lost either way.
  if (Object.keys(move(seed(), "sec-a", 1)).sort().join() !== "opener,sec-a,sec-b") say("a slot went missing in the move");
}

// One menu on a right-click, not two.
//
// A row already had a context menu on its wrapper — a small one at the cursor
// offering Remove — and a second was added inside the row itself. Right-click
// fired both, and Andrew got two dropdowns. Only one handler may sit on the
// path from a row to the page.
{
  const say = (m) => { console.error("  FAIL  right-click: " + m); failedEarly++; };
  const src = readFileSync(new URL("../src/engine/Dashboard.jsx", import.meta.url), "utf8");
  const hits = (src.match(/onContextMenu=/g) || []).length;
  // One on the row, one on a section's name, and one inside a menu's own veil
  // to dismiss it. Any more and two of them are on the same element's path.
  if (hits > 3) say(hits + " context-menu handlers, which is more than the row, the section name and a veil");
  if (/function RowMenu\(/.test(src)) say("the second row menu is back");
  if (!/onContextMenu=\{e => \{ e\.preventDefault\(\); toggleMenu\(\); \}\}/.test(src)) {
    say("the row no longer opens its menu on right-click");
  }
  // And the menu's Edit has to reach the thing that opens the editor.
  // onEdit is the same open, plus bringing the rail back so the editor can be seen.
  if (!/onEdit \|\| onSelect \? \(\s*\n\s*<button className="dash-focus" onClick=\{\(\) => \{ setMenu\(false\); \(onEdit \|\| onSelect\)\(\); \}\}/.test(src)) {
    say("Edit this no longer calls the handler that opens a row");
  }
  if (!/const editPicked = \(p\) => \{\s*\n\s*setPicked\(p\);\s*\n\s*if \(!railRef\.current\.railOpen\) toggleRail\(\);/.test(src)) {
    say("Edit this no longer opens the rail the editor lives in");
  }
}

// The drawer's fields keep what you type.
//
// Field was declared inside the editor, which made it a new component on every
// render: each redraw of the dashboard threw the inputs away, with whatever had
// been typed and not yet saved.
{
  const say = (m) => { console.error("  FAIL  drawer fields: " + m); failedEarly++; };
  const src = readFileSync(new URL("../src/engine/Drawer.jsx", import.meta.url), "utf8");
  if (!/^function Field\(/m.test(src)) say("Field is no longer declared at the top of the module");
  if (/^\s+const Field = /m.test(src)) say("a Field is declared inside a component again");
}

// Games on the room screen: each Put on screen view becomes a slide, and no
// student's name reaches the wall.
{
  const say = (m) => { console.error("  FAIL  game slides: " + m); failedEarly++; };
  const game = {
    deck: { id: "d", title: "Week 1", teams: "none", time_limit_min: 20, opened_at: "2026-09-14T10:00:00Z" },
    cards: [
      { id: "c1", type: "question", position: 0, config: { text: "What did Gregg Popovich do that earned the Spurs a $250K fine?", answer: "choice", options: ["He complained about the schedule", "He had his four best players skip the game"] } },
      { id: "c2", type: "question", position: 1, config: { text: "What does Lacrosse mean?", answer: "typed" } },
    ],
    keys: { c1: [1], c2: ["The stick"] },
    accepts: [],
    responses: [
      { card_id: "c1", viewer_id: "ada@scu.edu", answer: { value: 1 }, review: false },
      { card_id: "c1", viewer_id: "ben@scu.edu", answer: { value: 0 }, review: true },
      { card_id: "c2", viewer_id: "ada@scu.edu", answer: { value: "the stick" } },
      { card_id: "c2", viewer_id: "ben@scu.edu", answer: { value: "Lake cross" }, review: true },
    ],
    progress: [{ viewer_id: "ada@scu.edu", completed_at: "2026-09-14T10:05:00Z" }, { viewer_id: "ben@scu.edu", completed_at: null }],
    teams: [],
  };
  const views = [{ view: "during" }, { view: "spread" }, { view: "questions" }, { view: "question", cardId: "c1" }, { view: "question", cardId: "c2" }];
  const want = { during: "gameDuring", spread: "gameSpread", questions: "gameQuestions", question: "gameQuestion" };
  for (const v of views) {
    const payload = castFor(v, game, 30);
    if (payload.template !== want[v.view]) say(v.view + " makes " + payload.template);
    for (const ground of ["paper", "slate"]) {
      try {
        const html = renderToString(<RoomSlide slide={payload} ground={ground} />);
        if (/ada@|ben@/.test(html)) say(v.view + " puts a student on the wall");
      } catch (e) { say(v.view + " threw on " + ground + ": " + e.message); }
    }
  }
  const during = castFor({ view: "during" }, game, 30);
  if (during.submitted !== 1 || during.of !== 30) say("during counts " + during.submitted + " of " + during.of);
  const q1 = castFor({ view: "question", cardId: "c1" }, game);
  if (JSON.stringify(q1.counts) !== "[1,1]" || JSON.stringify(q1.reviewBy) !== "[1,0]") say("a question does not carry picked and Please review per answer");
  const q2 = castFor({ view: "question", cardId: "c2" }, game);
  if (!q2.groups?.some(g => g.right && g.picked === 1)) say("a free-form question does not group its answers");
  const all = renderToString(<RoomSlide slide={castFor({ view: "questions" }, game)} ground="slate" />);
  if (!/All questions/.test(all) || !/Right/.test(all)) say("All questions lost its heading or axis");
  const spread = renderToString(<RoomSlide slide={castFor({ view: "spread" }, game)} ground="slate" />);
  if (!/Students/.test(spread) || !/Score/.test(spread)) say("the spread lost its axis labels");
  cases.push(["games page", <GamesPage config={comm999} />]);
}

// A day plan row that holds a game from the game panel: it wears the game's
// name, its slide is the game's ticket, and students see it on the schedule.
{
  const say = (m) => { console.error("  FAIL  game rows: " + m); failedEarly++; };
  const games = [{ id: "g1", title: "Weekly Game, week 1", questions: 10 }];
  const row = { id: "r1", gameId: "g1", text: "Weekly Game, week 1" };
  const slide = slideOf({ item: row, title: "Weekly Game, week 1", games });
  if (slide?.template !== "game" || slide.count !== 10) say("a game row's slide is " + slide?.template + " with " + slide?.count + " questions");
  const day = { slots: { opener: { title: "Open", items: [row] } } };
  const html = renderToString(<FlowPanel plan={day} seq={seq} seeds={[]} castNow={() => {}} dismiss={() => {}} liveLabel={null}
    accent="#333" onClaim={() => {}} features={[]} onFeature={() => {}} planHref="/x" onSlidesClaim={() => {}} onBlockClaim={() => {}}
    where="COMM 1 · Sep 23" loose={[]} onAddScheduled={() => {}} onAddItem={() => {}} onRemoveItem={() => {}}
    onMoveItem={() => {}} onSetSequence={() => {}} onSetSlotTitle={() => {}} sequences={[seq]} classHref="/comm118"
    games={games} gamesHref="/comm118/games" />);
  if (!html.includes("Weekly Game, week 1")) say("the row does not show the game's name");
  if (!html.includes('href="/comm118/games#game=g1"')) say("the row's kind does not open the game in Games");
  const items = studentItems({ dates: ["Sep 23"], items: [] }, { "Sep 23": day }, () => null);
  if (!items.some(i => i.title === "Weekly Game, week 1")) say("students do not see the game on the schedule");
}

let failed = failedEarly;
for (const [name, el, must] of cases) {
  try {
    const html = renderToString(el);
    if (must && !html.includes(must)) {
      failed++;
      console.error("  FAIL  " + name + ": rendered, but never reached " + JSON.stringify(must) + " \u2014 it stopped short.");
    }
  } catch (err) {
    failed++;
    console.error("  FAIL  " + name + ": " + err.message);
  }
}

if (failed) {
  console.error("\nsmoke: " + failed + " surface(s) threw on render.");
  process.exit(1);
}
console.log("smoke: " + cases.length + " surfaces rendered clean");
