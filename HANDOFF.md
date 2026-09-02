# Where things stand

Written 2026-08-28, at the end of a long session, so that clearing the
conversation costs nothing. The Brief at `/plan` is the running changelog and
carries the reasoning; this file is the shape of the thing.

## What this is

One codebase renders every class from a config object. Five classes are live:
COMM 118, COMM 2, COMM 4, COMM 3, COMM 999. Deployed at
`classes.andrewishak.com` on Vercel.

## The surfaces

| Route | Who | What |
| --- | --- | --- |
| `/<class>` | students | the class home, cards |
| `/<class>/dashboard` | me | where I plan and teach |
| `/<class>/today` | the room | the projector screen |
| `/<class>/ask` | students | questions and headlines |
| `/<class>/board` | students | discussion boards |
| `/<class>/game` | students | where the room plays |
| `/<class>/rungame` | me | where I run the game |
| `/plan` | me | The Brief, the changelog |

The presenter screen opens in a window of its own at
`/<class>?game=<gameId>&class=<class>`. The frozen forks still answer to
`?presenter=`, and the two read different stores under the same class id, which
is why the engine's presenter has a parameter of its own.

## The dashboard, in its current shape

Three columns with fixed jobs, named at the top, each seam draggable:

- **Materials** — Activities, Readings, Assignments
- **Flow** — the day itself, and nothing else
- **Live** — Questions, Poll, Answers, with the room preview pinned above

The top bar: class name (a menu holding the other classes and the ways out),
the date button, then Cast · Look · Around the Horn · Here.

Above the Flow: `WEEK 1, MONDAY`, then the day's title, editable in place.

A row in the Flow is a full-colour bar with white text. Its number opens
everything that row can do — done, nest under the row above, write the
headline, put on today's readings, take off the day. Only Cast sits out on the
right.

## The ideas that hold it together

- **Blocks.** Content is stored once and referenced everywhere. Editing a
  block changes it in every place it is used. `src/engine/blocks.js`.
- **Day titles carry.** A title starts on the day it is written and covers
  every class day after it until the next one. Runs are counted by what a day
  says, not by where the words came from. `src/engine/days.js`.
- **Colour by kind.** Readings blue, ideas green, notes yellow, assignments
  red, questions orange, poll deeper orange, Enter/Exit purple. Twenty
  swatches, all carrying white text, all checked against 4.5:1 by the build.
  Sections take a colour by name. `src/engine/colors.js`.
- **Type is choosable.** Column headings, section names and row text each take
  one of eight faces. `src/engine/fonts.js`.
- **Assigned and in-the-flow are separate facts.** A reading can be either,
  both, or neither, and dragging between them is one gesture.
- **My colours, fonts and blocks live in the shared store**, so they hold
  across all five classes. Everything else is per class.

## The build refuses to ship five kinds of mistake

`npm run build` runs all of these, then the smoke test, then vite.

| Check | Catches |
| --- | --- |
| `check-refs` | a JSX component used with no definition |
| `check-handlers` | a handler wired to `() => {}` |
| `check-contrast` | a colour under 4.5:1 |
| `check-voice` | a clause closing on a bare "it", an em dash in UI copy |
| `check-jsx-text` | an escape sequence stranded in JSX text |
| `smoke` | 134 surfaces rendered server-side, plus a game played through |

Each was written after the matching mistake reached production. Do not remove
one because it is inconvenient; add the case instead.

## How it gets deployed

`vercel --prod` is rate limited at 100 a day and that limit gets hit. **Pushing
to `main` deploys through the repo integration**, which is the reliable path.
Verify by comparing the live bundle hash against `dist/assets/*.js`, and read
twice, because one edge can serve the old bundle briefly.

## Things known to be unfinished

- COMM 3 has the real days, times and room, and nothing else: no schedule
  weeks, no roster, no assignments. Its term view is empty, and the fields are
  placeholders on purpose until the real class arrives.
- The COMM 3 roster filter is decided and unbuilt. The two sections are one
  class. A student belongs to a section, and the surfaces made of people (the
  roster, attendance, discussion boards, groups) filter down to the section in
  the room. Everything else is single: change a day plan, an assignment or a
  block once and both sections have the change.
- Six `onDone` handlers in the pre-engine Comm118/2/4 files do nothing. Those
  files are frozen.
- 57 linked readings never had `scheduled` backfilled onto their blocks.
- **Team Trivia's live flow has no test beyond rendering.** The weekly game and
  Ten on Ten are played end to end by the build, through `src/engine/game.js`.
  Trivia's rounds, reveals and team scoring still live inside click handlers,
  so the only thing checked there is that the screens draw.
- **Nobody has clicked through the game on a real device.** The rules are
  checked and every surface renders, and neither of those is a phone answering
  a question over the realtime channel. Do that before running a game in front
  of a room.
- Nothing was migrated out of the forks. The three legacy files still hold a
  term of games and grades at their own keys, and an engine class starts with
  no games.

## The game, ported

`src/engine/GameSystem.jsx` is one copy of what used to be three:
`GameSystem.jsx` at 4203 lines for COMM 118, `GameSystem4.jsx` at 4125 for
COMM 4, and a shorter `Comm2Game.jsx`. The difference between the two big ones
was a storage key, an accent, two category labels, a handful of compound
surnames and one word in a URL. Everything else was the same code written
twice, so a fix went in three times or went in once and stayed broken twice.

The class the module is running for is held in a module variable rather than
threaded through thirty components, set by whichever entry point mounted. A
page shows one class: every route is `/<class>/...` and the presenter opens in
a window of its own.

Games live in the class store rather than at a key of their own, because the
game needs the roster and awards points, and both the roster and the `log` the
gradebook reads are already there.

`src/engine/game.js` holds what a game is worth: write a week, open it, take an
answer, score it, and work out who got everything right. Each function takes the
class store and hands back a new one, so the build plays a whole game through
and reads the gradebook afterwards. The screens call those functions. Scoring
the same week twice is safe on purpose, because that is what a makeup is: a
student whose score has not moved keeps the entry they have, a student whose
score has moved has the old entry replaced rather than added to, and the
timestamp stays on the first scoring so a makeup graded in week nine does not
land in week nine's leaderboard.

The surfaces wear the engine's palette now rather than the forks' own, which
also took three colours past 4.5:1 for the first time: the muted grey was
2.5:1, the green 2.3:1 and the amber 3.2:1. Andrew's themes are untouched;
`clean` is the engine's card and every other theme draws as it did.

The forked files are untouched and stay frozen.
