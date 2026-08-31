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
  TypeSheet as RepoType } from "../src/engine/RepoPage.jsx";
import RepoIdeas, { Idea } from "../src/engine/RepoIdeas.jsx";
import { Duplicates, LooseEnds } from "../src/engine/RepoTidy.jsx";
import { findDuplicates, findLooseEnds, applyMerge } from "../src/engine/tidy.js";
import AskPage from "../src/engine/AskPage.jsx";
import PlanPage from "../src/PlanPage.jsx";
import InstructorLinks from "../src/InstructorLinks.jsx";
import { ENGINE_LIST } from "../src/config/registry.js";
import { warmClassData } from "../src/engine/store.js";
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
  cases.push(["Repository row", table(<RepoRow block={blk} hue={hue} open={false} onOpen={noop} onTag={noop} />), "Why We Bet"]);
  cases.push(["Repository row, never used", table(<RepoRow block={bare} hue={hue} open onOpen={noop} onTag={noop} />), "Never"]);
  cases.push(["Repository open row", <RepoDetail block={blk} hue={hue} planOf={planOf} stores={stores}
    onSave={noop} onDelete={noop} onPlace={noop} onAssign={noop} />, "Put the block on a day"]);
  cases.push(["Repository placer", <RepoPlace block={blk} planOf={planOf} stores={stores}
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

  cases.push(["Repository type sheet, chosen", <RepoType fonts={{ cols: "fraunces", rows: "grotesk", page: "plex" }}
    bold onFont={noop} onBold={noop} onReset={noop} onClose={noop} />, "Heavier rows"]);
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
