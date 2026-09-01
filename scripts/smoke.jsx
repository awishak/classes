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
import { renderToString } from "react-dom/server";
import Dashboard, {
  FlowPanel, TodoPanel, NowPanel, ScratchPanel, AttendancePanel, QuestionsPanel,
  BoardsPanel, StockedPanel, AssignmentsPanel, CommandBar, Readings, IdeasPanel,
  ColorsSheet, NoteSheet, ShortcutSheet,
} from "../src/engine/Dashboard.jsx";
import ClassroomView from "../src/engine/ClassroomView.jsx";
import ClassApp, { OnScreenNow } from "../src/engine/ClassApp.jsx";
import BoardPage from "../src/engine/BoardPage.jsx";
import RepoPage, { Row as RepoRow, Detail as RepoDetail, Place as RepoPlace,
  TypeSheet as RepoType, Views as RepoViews, Bulk as RepoBulk, Health as RepoHealth,
  Steps as RepoSteps } from "../src/engine/RepoPage.jsx";
import { FLAGS, healthCounts, carries, allClear } from "../src/engine/health.js";
import { remember, undoPatches, pushEntry, sayEntry, LIMIT } from "../src/engine/undo.js";
import { Seeds as RepoSeeds, Room as RepoRoom, BlockTypes as RepoTypes } from "../src/engine/RepoMore.jsx";
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
    picked={false} onPick={noop} />), "Why We Bet"]);
  cases.push(["Repository row, selected", table(<RepoRow block={blk} hue={hue} open={false} onOpen={noop}
    onTag={noop} picked onPick={noop} />), "repo-tr-picked"]);
  cases.push(["Repository row, never used", table(<RepoRow block={bare} hue={hue} open onOpen={noop} onTag={noop}
    picked={false} onPick={noop} />), "Never"]);
  cases.push(["Repository open row", <RepoDetail block={blk} hue={hue} planOf={planOf} stores={stores}
    onSave={noop} onDelete={noop} onPlace={noop} onAssign={noop} />, "Put the block on a day"]);
  cases.push(["Repository placer", <RepoPlace block={blk} planOf={planOf} stores={stores}
    onPlace={noop} onAssign={noop} />, "Into the flow"]);

  // ─── the sections a day actually has ───
  // Four of the five classes have no sequences in their config, so reading a
  // day's sections off the sequence alone said "no sections to land in" while
  // the dashboard was drawing four sections on that same day. A section made
  // by hand, and any slot holding something, is a section.
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
      onPlace={noop} onAssign={noop} />, "Into the flow"]);
  cases.push(["Repository type sheet", <RepoType fonts={DEFAULT_REPO_FONTS} bold={false}
    onFont={noop} onBold={noop} onReset={noop} onClose={noop} />, "Column headings"]);
  // The lenses, on an index built the way the page builds one: the same
  // reading in two classes, and a day pointing at a block that is gone.
  const dupA = { ...blk, id: "d1", owner: cfg0, target: cfg0.id, uses: [{ cls: cfg0, date: "Sep 23", section: "opener" }] };
  const dupB = { ...blk, id: "d2", headline: "", title: "why we bet", owner: ENGINE_LIST[1], target: ENGINE_LIST[1].id, uses: [] };
  const dupC = { ...blk, id: "d3", url: "", title: "A Hook With No Link", owner: null, target: "shared", uses: [] };
  const clusters = findDuplicates([dupA, dupB, dupC, { ...dupC, id: "d4", owner: cfg0, target: cfg0.id, uses: [] }]);
  if (clusters.length !== 2) { console.error("  FAIL  tidy: expected 2 clusters, got " + clusters.length); failedEarly++; }
  cases.push(["Repository duplicates", <Duplicates clusters={clusters} hue={hue} onMerge={() => ""} />, "copies"]);
  cases.push(["Repository duplicates, none", <Duplicates clusters={[]} hue={hue} onMerge={() => ""} />, "No copies"]);

  const looseStores = { [cfg0.id]: {
    blocks: {},
    dayPlans: { "Sep 23": { slots: { opener: { title: "Opener", items: [{ id: "x1", blockId: "gone" }] } } } },
    schedule: [{ id: "w1", dates: ["Sep 21", "Sep 23"], items: [{ id: "s1", libId: "r1", title: "Why We Bet", url: "https://e.com", date: "Wed" }] }],
    library: [{ id: "r1", type: "reading", title: "Why We Bet" }],
  }, shared: {} };
  const ends = findLooseEnds(looseStores, [cfg0]);
  if (ends.length !== 2) { console.error("  FAIL  tidy: expected 2 loose ends, got " + ends.length); failedEarly++; }
  cases.push(["Repository loose ends", <LooseEnds ends={ends} onDrop={noop} onUnlink={noop} onMakeBlock={noop} />, "Make a block"]);
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
    onCheck={noop} onlyBad={false} setOnlyBad={noop} />, "Check all 4"]);
  cases.push(["Repository links, checking", <Links blocks={linkables(linked)} busy done={8} total={40}
    onCheck={noop} onlyBad setOnlyBad={noop} />, "Checking 8 of 40"]);

  cases.push(["Repository type sheet, chosen", <RepoType fonts={{ cols: "fraunces", rows: "grotesk", page: "plex" }}
    bold onFont={noop} onBold={noop} onReset={noop} onClose={noop} />, "Heavier rows"]);

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

  cases.push(["Repository steps", <RepoSteps steps={[step]} onBack={noop} />, "Put it back"]);
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
    onRetype={noop} />, "Add the type"]);
  cases.push(["Repository types, none added", <RepoTypes types={readTypes({})} counts={{}} orphans={[]}
    hue={hue} onAdd={noop} onRename={noop} onReset={noop} onColor={noop} onDrop={noop} onRetype={noop} />,
    "Put the name back"]);
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
    onPin={noop} onDrop={noop} onClear={noop} />, "Pin this view"]);
  cases.push(["Repository views, naming one", <RepoViews views={[]} pinned={null} blank={false} naming="A name"
    here={asked} say={() => "COMM 1"} onGo={noop} onName={noop} onPin={noop} onDrop={noop} onClear={noop} />, "Pin it"]);

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
    onTag={noop} onType={noop} onShare={noop} onClear={noop} onPlace={() => ""} onAssign={() => ""} />, "2 selected"]);

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
    "Bring in the " + SEEDS.length + " that are new"]);
  cases.push(["Repository seeds, all in", <RepoSeeds seeds={SEEDS} fresh={[]} onBring={noop} onBringAll={noop} />,
    "Every seed is already a block"]);

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
