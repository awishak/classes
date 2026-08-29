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
| `/plan` | me | The Brief, the changelog |

## The dashboard, in its current shape

Three columns with fixed jobs, named at the top, each seam draggable:

- **Materials** — Activities, Readings, Assignments
- **Flow** — the day itself, and nothing else
- **Live** — Questions, Poll, with the room preview pinned above

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
| `smoke` | 58 surfaces rendered server-side, including every sheet |

Each was written after the matching mistake reached production. Do not remove
one because it is inconvenient; add the case instead.

## How it gets deployed

`vercel --prod` is rate limited at 100 a day and that limit gets hit. **Pushing
to `main` deploys through the repo integration**, which is the reliable path.
Verify by comparing the live bundle hash against `dist/assets/*.js`, and read
twice, because one edge can serve the old bundle briefly.

## Things known to be unfinished

- No instructor view of a discussion board; I can cast a prompt and students
  can answer, but I cannot read the answers on the dashboard.
- Ported boards are closed, and nothing opens them.
- A row menu near the bottom of a long day opens downward and can run past the
  card. It does not flip up.
- Six `onDone` handlers in the pre-engine Comm118/2/4 files do nothing. Those
  files are frozen.
- 57 linked readings never had `scheduled` backfilled onto their blocks.

## What is being built next

A full-page searchable repository of everything: links, readings, ideas, notes.
Same colour coding as the dashboard, able to add items, and it says where each
item sits in the schedule.
