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

## The class site's top bar

Two controls. **Dashboard**, which is the button pressed with a class about to
start, and a **menu** holding everything else: the room screen, Ask, Run the
game, the class switcher, View as a student, the theme picker, the role toggle
and sign out. That section is headed **Theme**, and both shapes of the picker
name every theme: four unlabelled swatches is a row of dots asking you to
guess, and Crashing Out and Snapchat are not colours anybody can infer. A student sees the same menu with the teaching half missing.

The bar carried thirteen controls before: four theme buttons, a view-as select,
a class select, four teaching links, sign out and a two-button role toggle.
Everything competed and nothing led.

The phone and the desktop are separate headers in the same file. The desktop got
this tidy a day before the phone did, because an edit to the phone header threw
before it wrote and nothing noticed: **`innerWidth` is 1440 in the test globals,
so every test in this repo had only ever rendered the desktop layout.** The
class site's phone column, which is what students actually use, had no coverage
at all. Every class-site check runs at both widths now, and the failure message
names which one.

**What that costs:** the roster picker, the class switcher and the teaching
links live inside a closed menu, so they are not in the markup until somebody
clicks, and no render test covers their contents any more. The build counts tap
targets across the bar instead and fails over six, which is the blunt measure
that would have caught the drift in the first place.

## Four themes, and a student picks one

`src/engine/themes.js` holds them: **Clean** is the standard, **Business** is the
other serious one, **Snapchat** and **Crashing Out** are Andrew's, carried over
from spring 2026 and rebuilt on this system rather than on their own.

Each theme has its own faces, and every student surface takes them. `F` and
`MONO` in those files point at `TOKENS.FONT.body` and `TOKENS.FONT.label`, so
one declaration per file carries all 88 uses. Headings take
`TOKENS.FONT.display` with the weight that comes with the face, because 600 on
Bangers is not a thing.

| Theme | Body | Headings | Labels |
| --- | --- | --- | --- |
| Clean | Outfit | Outfit | IBM Plex Mono |
| Business | Outfit | Fraunces | IBM Plex Mono |
| Snapchat | Nunito | Nunito 900 | Nunito |
| Crashing Out | Shantell Sans | Bangers | Lilita One |

Snapchat speaks its own language on the class home: a story bar of hooped faces
with your own story first and the ones you have seen greyed out, a ghost and a
snap score beside the class name, the camera in the middle of the bottom bar,
and the status diamond on anything with a state.

Crashing Out's page moves. `--surface-page` is a six-stop gradient there and was
painting once and holding still, which is a gradient rather than a wobble; the
travel is set on the element carrying `data-theme`, so nothing else has to know.
Stickers twinkle and pulse down both edges, pinned and pointer-events off.
Headings carry a pink shadow, which is a token like everything else. Tubey peeks
out from behind the first card.

Two more things only Crashing Out does. **The class leader talks to whoever is
looking.** Whoever is top of the in-class points turns up with a crown and says
the gap out loud, because a leaderboard is a number in a card that nobody feels
and a classmate saying the number is a different thing. The leader looking at
their own screen gets a different line, since a leader taunting themselves is a
bug and the build says so.

**The marquee carries every championship.** `src/engine/crashing-facts.js` holds 104
results: every Super Bowl, NBA Finals and World Series from the 1990 season to
the 2024 season. All of them go on the strip, shuffled into an order that
belongs to that reader, with the class's own news coming round every fifth item
so a student's grade never scrolls away for good.

The duration is computed from the number of items rather than fixed, because the
animation moves a proportion of the element rather than a distance: a longer
strip at the same duration is a faster strip. `MARQUEE_SECONDS_PER_ITEM` is the
one number, and 125 items works out at about 400 seconds.
The last two seasons are deliberately absent rather than guessed, because a
banner that states a result confidently is worse than a shorter banner. **This
is the one part of the app that can be factually wrong.** Check any of them
before quoting one at a room. The build checks the shape, not the truth: every
line starts with a season inside the range the file claims, the picks are
seeded so a re-render does not reshuffle under a reader, and one banner never
repeats a result.

Crashing Out cuts its cards up. Each one takes its own border colour, its own
shadow colour, four different corner radii and a fraction of a degree of tilt,
so a grid reads as a stack of things somebody put down rather than six copies of
one box. The tilt stays under a degree: enough to look hand-placed, small enough
that nothing overlaps a neighbour. Clip-path would cut a better corner and would
also clip the shadows off, which is the part doing the work, so the cutting is
done with radii. The marquee's torn bottom edge is two gradients for the same
reason.

Press Start 2P is not a label face anywhere: it is roughly twice as wide per
character as anything else here, so a label in it overflows every card. The
pixel font stays in the marquee, where the strip scrolls and width costs
nothing.

A theme is furniture as well as colour. `src/engine/ThemeChrome.jsx` holds the
pieces: the marquee across the top, Tubey the Worm and what he says, the
Homework Tubes sponsor bar and its legal line, the streak badge, the story ring
on a face, the status diamond, and the rotating card borders. Every piece
renders nothing at all for the themes that do not want it, so surfaces call them
unconditionally and Clean stays clean.

The furniture is on every student surface: the class home, the ask page, the
discussion board, the game and the room screen. Each takes what suits it. The
board rings every poster's face and puts Tubey under the composer, where a
student is deciding whether to post. The game carries the streak in its header
and a worm who cannot help. The wall runs the marquee across the top and stands
Tubey in the corner at 140px. A surface that centres its content in a flex row
pins the marquee to the viewport instead of putting it in the flow.

Tubey belongs to Homework Tubes and appears by arrangement. He is drawn rather
than borrowed from an emoji font, he talks, and he is not permitted to help with
anybody's homework. Their palette lives in `themes.js` under `BRAND`, with two
text pairs corrected: their blue on their yellow is 2.81:1 and their red on
their cream is 4.18:1, so the URL pill takes ink on yellow and the eyebrow takes
a deeper red. The check measures those two the same as everything else.

A theme is one attribute. Every colour in the engine is a CSS custom property,
so `data-theme` on a surface's root picks which block applies and nothing
re-renders. Each theme also carries its own card treatment and its own faces:
Clean is a hairline, Snapchat is 3px of black with a hard offset, Crashing Out
stacks two shadows and mixes five typefaces.

The choice is the student's and lives in their browser rather than in the class
store, because a theme is a preference about a screen and the class store is
shared. The picker sits in the header on every student surface and in full under
More, so a student who picked Crashing Out in week one can get back out in week
two. It follows them across the class site, the ask page, the board, the game
and the room screen.

`check-tokens` holds three rules: no surface keeps a colour of its own, every
theme defines every property, and every readable value clears 4.5:1 on every
ground that theme puts text on. That last one is why Crashing Out's ok and late
are deeper than the other themes' equivalents: its page is a gradient and text
has to clear the darkest band as well as the lightest.

**Locked In is gone from the engine.** It stays in `styles.jsx` for the frozen
forked files, which still use it.

## One design system

`src/engine/tokens.js` is the palette, the type scale, the 4px spacing grid, the
radii and the two hit targets, and every surface reads from that file. For a
while the file existed and **nothing imported the module**, so eighteen files
each declared their own palette and the app had three greys for body text:
`#111827` on the class site, `#1c1917` on the dashboard and the game, `#171310`
on the repository. Nobody chose three. Each file picked one because there was
nothing to point at from inside the file.

The warm grey won, because that is where the newest work kept landing. 104
constants across 18 files now come off the tokens, through a namespace import,
so no local name can ever collide with a token name and the diff touches
declarations rather than the thousands of places that use them.

Two colours moved. `live` was `#e11d48` and `late` was `#dc2626`, and the old
contrast pass only ever checked against white, where both pass. On the sunk
surface the dashboard's panels use, they were 4.28 and 4.40, and a panel is
exactly where both get used. They are `#be123c` and `#c81e1e` now, checked
against a card, the page and the sunk panel.

The room screen inverts on purpose, so its four values are `ROOM` in the same
file, checked against the stage rather than against white.

**Still local:** colour written inline inside a style object. `check-tokens`
holds the constants at the top of a file, because those are what set a surface's
character and those are what drifted. Font sizes are not held to `TYPE` yet.

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
| `check-css` | a stylesheet that lost a rule |
| `check-tokens` | a surface with a colour of its own, a theme missing a token, or a colour that fails where it sits |
| `smoke` | 146 surfaces rendered server-side, a game played through, and every theme's colours and furniture |

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
  of a room. `teaching/testing-a-game.md` says how.
- Nothing was migrated out of the forks. The three legacy files still hold a
  term of games and grades at their own keys, and an engine class starts with
  no games.

## Who a student is

`src/engine/roster.js`. The seeded roster was `{ name, from, goals }` with no
id, and nothing in the engine ever assigned one, so `student.id` was `undefined`
for every student in a fresh class. Everything keyed by it collapsed onto one
key: `responses["undefined-0"]` was every student's answer to question one, and
every log entry was `{ studentId: undefined }`.

Two phones answering the same question wrote the same key, and the second answer
replaced the first. **That is a different bug from the write race fixed the night
before.** A merge cannot help when both writers are aiming at the same key.

The id comes from the name, because a name is the identity the whole app already
uses: students sign in by picking one, the board stores one, the roster is a list
of them. So the fix needs no migration and works on data already in the store.
An explicit id always wins, so a class whose roster came from somewhere with real
ids keeps them.

`withIds` normalises at the door rather than at the eighty-odd places that read
`student.id`, which is a much smaller and safer change. The doors are the five
game entry points, `game.js`, the class site, the game page and the board.

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

One write cannot take somebody's answer with it. The store is one JSON blob per
class, every screen writes the whole blob, and nothing re-read before writing,
so the last write won and everything that had arrived since that screen last
synced was gone. A phone locked in an answer, I pressed "next question" a second
later, and my snapshot went over the top of the answer. Every write now merges
against what the server holds: what the writer changed is the writer's, and
everything the writer did not touch comes from the server. `mergeAnswers` in
`src/engine/game.js` is the rule, and seven cases in the build reproduce the
ways a room lost answers.

Answering is one press. Tapping an option sends the answer; tapping another
changes it until the question locks. It used to be tap, then press "Lock in
answer", and while the choice sat there unsent the screen stopped taking live
updates.

The surfaces wear the engine's palette now rather than the forks' own, which
also took three colours past 4.5:1 for the first time: the muted grey was
2.5:1, the green 2.3:1 and the amber 3.2:1. Andrew's themes are untouched;
`clean` is the engine's card and every other theme draws as it did.

The forked files are untouched and stay frozen.
