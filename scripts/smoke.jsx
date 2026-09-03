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
  ColorsSheet, NoteSheet, ShortcutSheet,
} from "../src/engine/Dashboard.jsx";
import ClassroomView, { Content as CastContent } from "../src/engine/ClassroomView.jsx";
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
import InstructorLinks from "../src/InstructorLinks.jsx";
import { ENGINE_LIST } from "../src/config/registry.js";
import { warmClassData } from "../src/engine/store.js";
import { sectionsOf } from "../src/engine/dayplan.js";
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
cases.push(["Assignments", <AssignmentsPanel assignments={cfg0.assignments || []} castNow={noop} dismiss={noop} liveLabel={null} />]);
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
  onAdd={noop} onClose={noop} />, "A new note"]);
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
    onSave={noop} onDelete={noop} onPlace={noop} onAssign={noop} />, "Add this to class"]);
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
  // The template class has a sequence, and the sequence still leads.
  const seqDay = sectionsOf(ENGINE_LIST.find(c => (c.sequences || []).length) || cfg0, { slots: {} });
  if (!seqDay.length) { console.error("  FAIL  sections: a class with a sequence lost its sections"); failedEarly++; }
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
cases.push(["On the wall, a question from the room", <CastContent config={cfg0} plan={{}} data={{}}
  cast={{ type: "question", tag: "From the room", title: "Why does that work?", cite: "Anonymous" }} />]);
cases.push(["Ideas for the repository", <RepoIdeas />, "Merge the duplicates"]);
cases.push(["One idea", <Idea idea={{ n: 7, group: "reuse", size: "small", first: true,
  title: "Last used", what: "A last-used column.", why: "A count cannot say when." }} />, "Start here"]);
cases.push(["The Brief", <PlanPage />]);
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
  globalThis.localStorage.getItem = (k) => (k === admin ? "1" : null);
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
    if (!html.includes("Dashboard")) {
      console.error(`  FAIL  class site, instructor, ${where}: no way through to the dashboard`); failedEarly++; }
    if (!html.includes('aria-haspopup="menu"')) {
      console.error(`  FAIL  class site, instructor, ${where}: no menu, so everything behind it is unreachable`); failedEarly++; }
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
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : null);
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
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? "vaporwave" : null);
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
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : null);
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
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : null);
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
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : null);
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
    globalThis.localStorage.getItem = (k) => (k.endsWith("-mode") ? m : k.endsWith("-theme") ? "clean" : null);
    try {
      const html = atWidth(px, () => renderToString(<ClassApp config={cfg0} />));
      if (!html.includes(`data-mode="${m}"`)) say(`asking for ${m} never reaches the page root`);
    } catch (err) { say(`${m} threw: ` + err.message); }
    globalThis.localStorage.getItem = was;
  });
  // A mode nobody has heard of falls back rather than breaking the page.
  {
    const was = globalThis.localStorage.getItem;
    globalThis.localStorage.getItem = (k) => (k.endsWith("-mode") ? "dusk" : null);
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
    globalThis.localStorage.getItem = (k) => (k.endsWith("-theme") ? t : null);
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
  const plans = {
    "2026-09-01": { slots: { a: { items: [{ blockId: "seed1" }, { schedItemId: "r9" }] } } },
    "2026-09-11": { slots: { a: { items: [{ blockId: "seed1" }] } } },
    "2026-09-05": { slots: { a: { items: [{ blockId: "seed1" }] } } },
  };
  const at = placedOn(plans, "2026-09-04");
  if (at.get("b:seed1") !== "2026-09-05")
    say(`a seed on three days shows ${at.get("b:seed1")}, not the day nearest the one I am on`);
  if (at.get("r9") !== "2026-09-01") say("a reading placed by its schedule row is not found");
  if (at.get("b:nothing")) say("placedOn invents a day for a block on no day");
  if (placedOn(null, "2026-09-04").size) say("placedOn throws or invents days on a class with no plans");
  if (whenLabel("") !== "" || !/\d/.test(whenLabel("2026-09-05")))
    say("the date label is empty on a real date, or prints something on no date");

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
  if (!src.includes("All assignments")) say("nothing on the dashboard reaches the assignments beyond three weeks");
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
