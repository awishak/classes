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
} from "../src/engine/Dashboard.jsx";
import ClassroomView from "../src/engine/ClassroomView.jsx";
import ClassApp, { OnScreenNow } from "../src/engine/ClassApp.jsx";
import AskPage from "../src/engine/AskPage.jsx";
import PlanPage from "../src/PlanPage.jsx";
import InstructorLinks from "../src/InstructorLinks.jsx";
import { ENGINE_LIST } from "../src/config/registry.js";
import { warmClassData } from "../src/engine/store.js";
import { SHARED_KEY } from "../src/engine/blocks.js";

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
cases.push(["The Brief", <PlanPage />]);
cases.push(["Instructor links", <InstructorLinks />]);

// A surface can render clean and still be the loading screen — that is how the
// first version of this test passed code that was crashing in production. So a
// case may name a string its output MUST contain, and a dashboard names the
// stage: if the layout is not in the markup, the body did not run and the pass
// is worth nothing.
let failed = 0;
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
