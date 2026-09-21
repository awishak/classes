# Where things stand

Written 2026-08-28 and brought up to date 2026-09-20, so that clearing the
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
| `/<class>/schedule`, `/challenges`, `/questions`, `/class`, `/more` | students | the same home with that card open, so a card is a link you can send |
| `/<class>/schedule/<day>` | students | the schedule at the top of one day |
| `/<class>/dashboard` | me | where I plan and teach, opened on today |
| `/<class>/dashboard/<day>` | me | one day of the term, named in the address |
| `/<class>/today` | the room | the projector screen |
| `/<class>/board` | students | discussion boards |
| `/<class>/game` | students | where the room plays |
| `/<class>/games` | me | the games, written and run |
| `/<class>/grade` | me | the class as cards, sorted into columns |
| `/<class>/rungame` | me | the spring game system, kept reachable |
| `/repo`, `/repo/ideas` | me | everything across every class, and its backlog |
| `/plan` | me | The Brief, the changelog |
| `/features` | anyone | the site, shown, with placeholder students |
| `/progress`, `/archive` | me | what got built, and what came off |
| `/retreat` | the room | retreat answers on AI, read for themes, one projector screen |

Around the Horn has no address of its own. It is mounted once inside the top
bar, so it opens over whatever page I am on rather than sending me to the
dashboard. `src/engine/HornApp.jsx`.

The presenter screen opens in a window of its own at
`/<class>?game=<gameId>&class=<class>`. The frozen forks still answer to
`?presenter=`, and the two read different stores under the same class id, which
is why the engine's presenter has a parameter of its own.

**Each day of the dashboard is an address.** `/comm3/dashboard/oct-7` opens
October 7, and picking a day writes the address, so a refresh stays put and the
back button walks back through the days. A second spelling is read and never
written: `week-3-wed` is the third Wednesday of whatever term is loaded, and
`week-3` alone is that week's first class day. That is the spelling a link from
a template or from the Brief uses, because a term's dates all move and its
third Wednesday is still its third Wednesday. A slug that names no day of the
term resolves to nothing and the dashboard falls back to today, so a link from
last quarter opens the dashboard rather than a dead page. `daySlug` and
`dayFromSlug` in `src/engine/days.js`.

## The dashboard, in its current shape

**Two modes: Plan and Teach.** Andrew, 2026-09-20: "basically i need a
planning view (doc and drawer) and a teaching view: slides or doc, and live
image, and drawer underneath."

- **Plan** is the day as a document with the drawer beside it. Nothing is on
  the screen while the day is being built, so there is no picture of one.
- **Teach** adds the room: the live picture at the top of the rail, what is
  next under it, and the drawer under that.

Each mode opens on the view it is for, Plan on Doc and Teach on Slides, and
either view is reachable from either mode, so the mode decides what starts and
never what is allowed. The choice per mode is remembered in the browser. It
always opens in Plan. `⌘E` swaps the modes, which is what that key did before
except that it used to hide the rail, the opposite of what teaching wants.

**Teaching, the slides are a run.** One slide wide down the day column, with
everything written under that row beside it, every note on its own line and
nothing cut off. The grid of thumbnails stays in Plan, where laying out a day
means looking at the shape of the whole thing. The room's screen is the rail on
the right, so the slide, what to say over it and what the room can see are all
in one glance.

**What is next, drawn rather than described.** "give me a view of like what the
next slide is with all the notes for it." Under the picture: the words Next
will put up, the slide the room would see, and the notes written under that row
in the document. Pressing the slide is Next.

Two columns underneath it all: the day, and the rail. It was three, with
Materials on the left and the room on the right, which made the day the
narrowest thing on the screen and split one job across opposite edges. The rail
is always on the screen now; `railOpen`, which nothing could toggle, and the
old focus mode are both gone. The seam is draggable and the drag is
remembered.

**The full-screen Teach is gone.** It read the day out one line at a time with
the slide beside it, and it had the same name as the mode. "drop it." What it
did for the next thing up, the rail does beside the picture.

**One bar.** Left to right: the class, which is a menu of every other page; the
day, with a step either way and the date button between them; Outline and Map,
which open the quarter as a document and on one screen; Doc and Slides, the two
ways to read the day; Around the Horn; and Here at the right end, carrying
who is in the room over who is on the roster. The second menu bar under it is
gone, and so is the Remember line. `WEEK 1, MONDAY` is gone from beside the
button that already says so.

**The Flow is a document.** Three levels, like headings: a SECTION, an ITEM
under it, and NOTES under an item. Every line takes the cursor and the keys move
the way a document moves. Arrows cross between lines at the ends, `Alt` plus an
arrow moves a line, `Tab` and `Shift+Tab` change its level, `Enter` opens the
next line of the same kind and `Backspace` on an empty one deletes it. `/` opens
the command menu, `@` finds something already in the library, `# ` at the start
of a line makes it a section and `- ` makes it a note. `src/engine/DayDoc.jsx`.

**Lines are picked out of the margin and copied as Markdown.** Every line is
its own text box, so a mouse drag cannot cross them and there was nothing to
select. Clicking the number picks that line, shift takes the range, the
platform's key adds or removes one, and a strip above the day says how many are
picked with Copy and Clear on it. ⌘C copies while a pick is up, Escape lets it
go, and Copy and Copy section are on the right-click menus for when picking is
more work than it is worth. A section comes out as a heading, an item bold on
its own line, a note as a bullet under it, and a block's content indented.
`docMarkdown` in `src/engine/DayDoc.jsx`.

**Nothing on a row at rest.** The margin holds the item's number and gives way
to Put on screen under the pointer. A plain item wears no kind word, a link is
one chip, and the row on the room screen is the only filled row. Right click or
hold any line for one menu: Put on screen, Put link on screen, Open in new tab,
Highlight, and the rest. Highlight takes the selected words, or the whole line
when nothing is selected.

**Doc and Slides are two views of the same day.** A brush under each slide steps
its look: every slide can take the other ground, an item or a section can be a
sticky note or an index card, and an article can be a clipping or its picture.
The brush beside a section's name steps every slide under it at once.

**Time is on the sections and the sum is at the foot.** A section carries its
minutes in a chip beside its name, and the foot of the day says what is left
rather than what is planned: 15 to 25 min left of 65, with 40 to 50 planned.
Over reads as over by so many minutes. The day's housekeeping sits on the same
line: Templates, History and Meets in person.

**The rail is the picture and the drawer.** The picture is a live frame of
`/<class>/today` with five controls under it: back, Next, Take down, Black, and
three dots. What I press with the room watching stays out; everything else is
behind the dots, which holds the screen in its own window, how a link is shown
(Read, Page, Card), the ground, the transitions and putting something back up.
Under the controls, one line says what Next will put up, numbered the way the
day numbers its rows. Next is the first unticked row after whatever last went
up, so a cast from a row, a link or a line moves the running order with it.

The drawer sits directly under the screen rather than behind a tab, because
finding the next thing is what I am doing all lesson. With nothing typed it
opens on everything dated to the day; typing searches everything, including the
games and the activities by name. Every row takes the same menu a line of the
Flow takes. Three shelves under the search: Media, Activities and Items, with
Media taking anything the other two do not claim, so a kind I add later cannot
go missing.

**What is not on the screen.** Attendance is not a tab: Here opens over
everything. To-do opens off the day itself. Questions, Poll and On the week
open from the class menu, because each is something I go and look at rather
than something that should sit there all lesson. Enter and Exit are out of the
dashboard; a day's written boards stay in the store and nothing reads them.

## One top bar, worn by three surfaces

`src/engine/TopNav.jsx` is the bar, and the class page, the dashboard and the
repository all wear the same component, so the three cannot drift apart again.
Before this each had its own, with its own height and its own idea of where the
way out lives, and then a strip of doors on top of two of them, which is a
second bar admitting the first one was wrong.

The bar answers one question, WHERE AM I, and nothing else. A control that acts
on the thing you are looking at is not navigation and does not belong here,
which is why the dashboard's date and its room tools sit with the day.

**No tabs anywhere.** Andrew, 2026-09-20: "tabs go in the dropdown. same on
phone i think." The bar carries the class and what is happening right now, and
every page of the class is behind the class's name.

**The class name at the left is the menu**, on the class site and on the
dashboard, out of one file: `src/engine/ClassMenu.jsx`. It holds the five pages
first (Home, Schedule, Challenges, Class, More), then the apps. The switcher at
the foot lists only the classes being taught, with one row through to the
archived ones, and the menu scrolls rather than running off the bottom of the
window: it had grown long enough to push the classes off the end of it. Mine carries
more under those: the room panels, The Brief, Colour and type, the keyboard
list and the other classes. The page you are on is marked in the class colour,
since no bar says it any more. The apps are Dashboard, Repository, Games, Grade
view, Around the Horn and Room screen for me, and Games and Room screen for a
student. `src/engine/apps.js`.

**The phone has no bar across the bottom.** The menu is the navigation there
too. With a card open the class shrinks to its code and the way back sits
beside it, so another page is always one press away. Snapchat's camera, which
lived in the middle of that bar, moved up beside the score.

Each class in the switcher is two lines, the code over its meeting times: side
by side in a 270px menu, COMM 3 broke across two lines and the times were cut
off after four words.

**The lit tab is read off the address**, the same way on every page. Before
this each surface said which tab it was and most said nothing, so Grade view,
Ask, Run the game and Games lit nothing at all and the dashboard stayed lit
with Around the Horn up. A surface can still pass `active` to say otherwise.

**One row, always.** The tabs scroll sideways inside their row and the class
stays pinned at the left, so the bar cannot wrap into two levels.

The theme picker is not in the bar. It lives under More, with Auto, Day and
Night beneath it, and the Apps button holds apps and nothing else.

## The class site, in its current shape

The home is a grid of cards with the full page beside it on a laptop and a
full-screen takeover on a phone. The order is Challenges, Messages, Class,
Games, under the next-class hero and the pinned links.

**The next class card is the day and two ways on.** Next class, the day's
title, the weekday and the date, the time and the room, my note to the class,
then the readings counted as a link and the full schedule. The count opens the
schedule at the top of that day: `/<class>/schedule/sep-23`, with the anchor on
the first row of that day. The readings listed out with their sources and
Drew's Picks, the game line, Directions and the badge for a day that does not
meet in the room all came off the card on 2026-09-20, because a card that lists
the readings is a card a student reads instead of the schedule.

**A week of the schedule is its days.** Each class day gets a heading in full,
`Monday, September 22`, the day's own title under it, and what is on it. A day
the class does not meet joins the week when something is due on it, marked No
class, which is how a Sunday deadline gets a place of its own. A row under a
day heading no longer repeats the date the heading has said, and each day
carries the anchor the next class card links to.

**One schedule, and I read the one the students read.** Andrew, 2026-09-21: "i
want you to make my schedule view the same as their schedule view. if i want to
make changes, I'll do it in dashboard." `/<class>/schedule` drew a week
composer for me and the rendered weeks for them, so the term had two places it
could be built. The composer is deleted, about 360 lines: the week editor, the
library picker, the seed suggestions and the drag helpers. `ScheduleDetail`
takes no role now, and the smoke renders the page as me and as a student and
fails if the two come out different. The dashboard is where a day gets built.

**"I'll be there", and the exceptions are the data.** Andrew, 2026-09-21:
"create a checkbox on the schedule next to each day for the students. it should
start checked ... when they do, on my page as instructor, it shows who will not
be in attendance." Every class day of the term carries the box, past days
included, and so does the next class card. On the schedule the box sits on the
day's own line, beside the date: "attendance click button needs to be in the
same line as the class date, except on the hero." The hero keeps it under the
note, where the card has room. Checked is the default and writes
nothing, so the store holds only the people who said no:
`away["Sep 23"]["ada-lovelace"]`. Keyed on the student id, so a change of the
name a student goes by keeps the mark. A day with no in-person meeting and a
day of sit-downs take no box, which is what moved `kindOf` out of
`TermOutline.jsx` and into `dayplan.js`. On my side the same line says who will
not be in attendance, split by sitting for COMM 3. `attendance.js` and
`Attendance.jsx`.

**A mark is the one write a whole room makes at once.** `update` in `store.js`
builds the next class from the page's own snapshot and writes the whole blob,
which is right while there is one writer and wrong for thirty phones
unchecking a box in the same minute: the last snapshot in wins and the marks
that arrived while it sat open are gone. That is the bug that ate a room's
answers, in a different map. So a mark goes through `saveMerged`, which
re-reads, merges and writes what the server holds with the marks folded in,
never this page's copy of everything else. A read that comes back with nothing
is a failed read as often as it is an empty class, and there is no telling them
apart from the browser, so a class the page holds data for is never written
over. `mergeAway` in `attendance.js`, and the smoke plays out two phones, a
take-back and a day plan written while a phone sat open.

**Challenges says both words** on the student's card, `Challenges
(Assignments)`, until the class has the new one. The card is the next one by
name, when it is due, and how many more the class holds, counted across every
challenge rather than only the ones still owed. My side of the same card is
what is coming up, each with how much of each room has handed it in: `8:00
12/18 · 10:30 9/16`, plus what is waiting to be graded or answered.

**Messages are one thumb and a link.** Done and I'm confused are gone. They sat
under the reply box answering nothing in particular, and the same tap was
called Done on the button and Got it in the inbox. One thumbs up, drawn rather
than taken from an emoji font, and Make a meeting, which is the calendar link.
A thread that already holds an I'm confused still renders it. Office hours sit
under the whole thing, from the profile, and a class with none written shows
nothing.

## Questions

`src/engine/QuestionsCard.jsx` over `${storageKey}-questions`, the store the
class has always kept its questions in, so nothing asked before this is lost.

**Every question is on the page the moment it is asked.** An answer is on it
the moment it is written, and archiving is the one thing that takes a question
off. Publishing used to be a press between the answer and the class, and it
only ever made the page later than it needed to be. Andrew, 2026-09-20: "when i
answer, it appears live."

**His page is the class's page**, with an answer box on each question and the
one press that takes one off. Three things he can do with a question: answer
it, leave it alone, archive it.

**The student's page, top to bottom:** the box with Submit beside it and a tick
for asking anonymously, `Sort by` with Recently answered, Recently asked and
Most appreciated, then every question. A question reads as the words in bold
with its thanks on the same line, `asked by <name> on Sep 21` in italics underneath,
or `asked on Sep 21` when the box was ticked, and the answer under that as `Dr. Ishak: ...` with
its own thanks on its line. An unanswered one says so rather than hiding.

**His side** is the same list with an answer box on each one and three things
he can do: answer it, leave it alone, or archive it. An answer saves when he
leaves the box, which is when the class gets it. The archive opens at the foot
and a question can come back out of it.

**Anyone can appreciate a question or its answer**, one press per person on
each, pressing again takes it back, and only the count is ever shown. The names
are kept so nobody can thank the same thing twice, and nothing renders them.
`thanksQ` and `thanksA` on the question.

**A welcome sits above everything** on the class page while it has words in it,
written in place by Andrew and gone when he empties it, so a class in week nine
is not still being welcomed. `data.welcome`, `WelcomeCard` in
`src/engine/HomeCards.jsx`.

**A student's own PIN is at the right end of their bar**, behind Show PIN,
with the line that says they can use it to sign in instead of waiting for an
email. It is hidden until pressed, and a preview of somebody else never shows
it.

**A name comes off at the student's word.** `anon` is ticked when they ask; a
question asked in the open says who asked it, because a class where people put
their name to a question is a better class than one where nobody does.

## Two sittings of one class

`src/engine/sections.js`. COMM 3 meets at 8:00 and at 10:30, and the two are
one class. The rule: **anything made of people belongs to a section, and
everything else is single.**

- **A section is the label of a sitting**, carried on the student. Nothing else
  identifies one, so a class with one sitting has no sections and every
  function in that file is a pass-through.
- **The section in the room** is read off the clock, and **the top bar says
  otherwise, on every page**, because the Horn board opens over whatever page I
  am on and the choice has to live where I always am. One control, in
  `TopNav.jsx`; the dashboard, the Horn board and anything else read it through
  `useRoomSection` and hear about a change while they are open. The choice is
  kept in the browser for six hours, so tomorrow starts from the clock again.
- **Who follows it:** Here, the Horn board's seats and points, the roster a
  student reads, and the game, which the games package already opens per
  `groupKey + section`. A seat on the Horn board carries the face and the whole
  name the roster carries, at the same size: two initials in a 26px circle over
  a first name was a spreadsheet of a room rather than the room. Six across
  rather than eight, because a face needs the width.
- **What does not:** the day, the schedule, a challenge, a block, a reading.
  Change one and both sittings have it.
- **Counts are by room.** A challenge reads `8:00 12/18 · 10:30 9/16` rather
  than one figure covering two rooms.

**The test student.** A class can name one fake student, `testStudent`. Pepe
LeFritz is his on COMM 3 and COMM 999. He is mine to see, on my roster and in
View as a student, and nobody else's: out of the roster students read, out of
every count, and out of both rooms. **View as a student writes nothing**, which
is what stopped me testing a conversation with myself, so the preview bar
carries a switch. It starts on for the test student, who exists for exactly
that, and off for a real student, whose name a press would otherwise post in.

- **Your card** is the profile alone. Email, goals and what matters most say
  they are only for the instructor, since those three never reach the roster.
- **Messages** are a card of their own rather than a strip under the profile:
  the thread, the reply, Done, I'm confused, Make a meeting. My side of the
  same card is the inbox.
- **Challenges** opens the list, and `/challenges/<id>` opens one.
- **Class** holds Your card, the roster and the instructor's card, which
  carries office hours and Book a meeting.
- **More** is the admin page in either view: the theme, the account, the
  sign-in code, the role toggle and View as a student.

**The first challenge is to fill in your card.** `src/engine/profileTask.js`
holds it: Please tell me about yourself, no weight, and the card is the
submission. Every field on Your card filled and the challenge marks itself
Complete, with nothing to send and nothing to grade. A class opts in with
`profileTask` on its config, carrying the due date, and the challenge is added
at the door, so COMM 118's store, which carries its own assignments list, gets
it too.

The phone and the desktop are separate layouts in the same file. The desktop
got the last tidy a day before the phone did, because an edit to the phone
header threw before it wrote and nothing noticed: **`innerWidth` is 1440 in the
test globals, so every test in this repo had only ever rendered the desktop
layout.** The class site's phone column, which is what students actually use,
had no coverage at all. Every class-site check runs at both widths now, and the
failure message names which one.

**What that costs:** the roster picker, the class switcher and the apps live
inside a closed menu, so they are not in the markup until somebody clicks, and
no render test covers their contents. The build counts tap targets across the
bar instead and fails over six, which is the blunt measure that would have
caught the drift in the first place.

**The next class card names a time only for a reader in a sitting.** A class
with two of them cannot tell Andrew which one to show, and two times on one card
tells most of the room the wrong thing, so he sees the room and no time while a
student sees their own. The times are the words in the config rather than a
clock: nothing here converts a timezone.

**Every tab wears its class.** `src/engine/favicon.js` draws the icon the bar
already draws: the class's colour with its number on it, as an SVG data URI, so
five classes get five icons out of one function and a new class has one the
moment it has a colour. The page shipped no icon at all before, so a dashboard,
a room screen and a class page were three identical blank sheets in the tab
strip. Pages that belong to no class still have none, because there is no mark
to give them yet.

## Three themes, and a student picks one

`src/engine/themes.js` holds them: **Clean** is the standard, and **Snapchat**
and **Crashing Out** are Andrew's, carried over from spring 2026 and rebuilt on
this system rather than on their own.

**Clean follows the system after dark.** Adaptive rather than a switch, so there
is nothing to find: one `prefers-color-scheme` block carrying a second palette
on second grounds. Only Clean has a night, because Snapchat is a yellow page and
Crashing Out is a pastel gradient and those are the whole point of them; a dark
version of either would be a different theme rather than the same theme after
dark. The bare `:root` turns down too, so a surface that sets no theme does not
stay bright at midnight.

**Auto, Day and Night** sit under Theme on the More page, and
only for a theme that has a night: on Snapchat or Crashing Out those three
buttons would all do the same nothing. Auto is the default. The choice lives in
the student's browser at `${storageKey}-mode`, beside the theme, and reaches the
page as `data-mode` on the same root.

Each override has to beat the rule it overrides, which is a specificity question
rather than an opinion:

- **Day** works by the media query stepping aside. The query excludes
  `[data-mode="day"]`, so the daytime block already on the page keeps applying
  in a dark OS.
- **Night** is a rule outside the media query, selected on the theme and the
  mode together. Two attribute selectors outrank the one on the daytime block,
  so it wins in a light OS with no `!important` anywhere.

Both of those are checked by shape. Moving the Night rule inside the media query
fails the build, and so does dropping the Day exclusion.

The dark state colours are not the daytime ones dimmed. A red that reads on
white disappears on near-black, so each is its own value and `check-tokens`
measures all of them against the dark surfaces.

**Clean 2 and Business are gone.** Clean 2 was the ruled layout, and the whole
`layout` dimension went with it rather than sitting in the code with no user;
dead structure is the pattern that has bitten repeatedly here.

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
- **A block's day belongs to the class that placed it.** `scheduled` is the
  history of every day a block has been used on, and `scheduledIn` says which
  class each of those days belongs to. The day's own list reads the second one,
  because a shared block belongs to all five classes: three shared activities
  carried `scheduled: ["Sep 21"]` and so read as being on COMM 3's first day,
  where nobody had put them. A shared block stamped before this says nothing
  about whose day it was, so it is on nobody's.
- **Day titles carry.** A title starts on the day it is written and covers
  every class day after it until the next one. Runs are counted by what a day
  says, not by where the words came from. `src/engine/days.js`. Every surface
  that names a day reads this, the room screen included: it used to show the
  week's topic, so renaming a day left the wall saying the old words.
- **A day's section order is a list, not the order of its keys.** The store is
  Postgres jsonb, which sorts an object's keys by length and then
  alphabetically. Section order lived in the key order of `slots`, so a move
  went out, the row came back sorted, and the day looked exactly as before.
  `order` on the day plan holds it, `orderSlots` rebuilds the object from it at
  the door, and every write records the order it left the day in.
  `src/engine/dayplan.js`.
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

## The build refuses to ship nine kinds of mistake

`npm run build` runs all of these, then the smoke test, then vite.

| Check | Catches |
| --- | --- |
| `check-refs` | a JSX component used with no definition |
| `check-names` | a name called from a handler that is neither declared, imported nor a global |
| `check-handlers` | a handler wired to `() => {}` |
| `check-contrast` | a colour under 4.5:1 |
| `check-voice` | a clause closing on a bare "it", an em dash in UI copy |
| `check-jsx-text` | an escape sequence stranded in JSX text |
| `check-css` | a stylesheet that lost a rule, or a class name with nothing behind the name |
| `check-tokens` | a surface with a colour of its own, a theme missing a token, or a colour that fails where it sits |
| `smoke` | 159 surfaces rendered server-side, a game played through, every theme's colours and furniture, the class site at both widths, and no hook below the dashboard's loading return |

Each was written after the matching mistake reached production. Do not remove
one because it is inconvenient; add the case instead.

**The smoke run is on a pinned clock, in UTC.** On 2026-09-20 three builds
failed for a change that touched none of the code they broke: Vercel builds on
UTC, so after 5pm in California it is tomorrow there, a challenge due two days
out fell inside the 48 hours that hands a student the deadline card, that card
takes the whole screen by design, and every class-site check failed at once. A
suite that reads the wall clock passes or fails by the hour. Everything renders
at one fixed moment now, set in `scripts/smoke-globals.js`, and `npm run smoke`
runs in UTC so this machine and the build machine cannot disagree again.

## How it gets deployed

`vercel --prod` is rate limited at 100 a day and that limit gets hit. **Pushing
to `main` deploys through the repo integration**, which is the reliable path.
Verify by comparing the live bundle hash against `dist/assets/*.js`, and read
twice, because one edge can serve the old bundle briefly.

## Things known to be unfinished

- COMM 3 has its term as of September 8: eleven weeks, nine graded pieces,
  and a plan for every class day, generated in `src/config/comm3-term.js`
  from the handoff in `teaching/comm3/`. Still missing: the roster, the
  exercise prompts, the audio and final specs, and campus examples. The story
  links are direct pages and videos, except the fourteen image links, which
  are still image searches.
- The COMM 3 roster filter is decided and unbuilt. The two sections are one
  class. A student belongs to a section, and the surfaces made of people (the
  roster, attendance, discussion boards, groups) filter down to the section in
  the room. Everything else is single: change a day plan, an assignment or a
  block once and both sections have the change.
- Six `onDone` handlers in the pre-engine Comm118/2/4 files do nothing. Those
  files are frozen.
- 57 linked readings never had `scheduled` backfilled onto their blocks.
- **A week's free text has no editor.** Deleting the schedule composer on
  2026-09-21 took the only way to write four things: a week's own paragraph,
  which students still read under the topic, a week's dates, adding or
  deleting a week, and the library at `data.library`. Andrew wants the free
  text back, "for now, don't worry", and the rest went on purpose. Week topics
  and a day's readings are already written from the dashboard, and weeks
  themselves come from the term config.
- **Team Trivia's live flow has no test beyond rendering.** The weekly game and
  Ten on Ten are played end to end by the build, through `src/engine/game.js`.
  Trivia's rounds, reveals and team scoring still live inside click handlers,
  so the only thing checked there is that the screens draw.
- **The attendance box has not been pressed on a phone.** The rules, the merge
  and both surfaces are in the build, and none of that is a thumb on a real
  checkbox writing to a real class. The box also says nothing when a write does
  not land: it goes back to where it was, which is honest and silent, and
  Andrew has not given me words for that line.
- **Nobody has clicked through the game on a real device.** The rules are
  checked and every surface renders, and neither of those is a phone answering
  a question over the realtime channel. Do that before running a game in front
  of a room. `teaching/testing-a-game.md` says how.
- **The Enter and Exit boards are orphaned.** They were rows of the Flow for
  a day and then came out of the dashboard. A day's written boards are still
  in the store and nothing reads them, so either they come back somewhere or
  the data goes.
- **Boards and the leaderboard are not split by section yet.** People-shaped
  surfaces are meant to follow the room, and those two still show the whole
  class. Undecided rather than missed: one conversation across both sittings
  may be what a board is for.
- The games page works its sections out from the roster's own values, while
  `sections.js` reads the labels on `meets`. They agree while a roster is
  pasted with those labels and nothing checks that they do.
- Nothing was migrated out of the forks. The three legacy files still hold a
  term of games and grades at their own keys, and an engine class starts with
  no games.

## Every save merges

Andrew, 2026-09-21: "students are adding pictures and then it's going away. do
we have the problem with people doing it at the same time?" Yes, and not only
for pictures.

Every save is the whole class as one page holds it. Two students onboarding in
the same minute each wrote a class the other one was not in, and the second
write won. The page ignores realtime echoes while it has a write outstanding,
which is right for its own state and widens exactly this window, so a class of
students all filling in the welcome cards at once is the worst case there is.
Whatever landed in between is gone and nothing anywhere says so. It has now
cost a room its game answers, and it took the photos.

`mergeClass` in `store.js` is the rule, and every save goes through it: read
what the server holds, walk what this page wants against what it started from,
and write the answer. A branch this page never touched is still the same object,
because React state copies the spine and shares the rest, so that branch comes
from the server. A branch it did touch is this page's, down to the leaf, which
means two screens writing different fields of one student both land. A key it
took out stays out.

The basis is the last state this page and the server agreed on. It moves on when
a merged save comes back and nothing newer is waiting, because a state waiting
in the queue was built from that same basis and has to be measured against it.

**A list of rows merges by id.** Every list the app writes carries ids on its
rows: a post, a submission, a request, a row of the roster, a week. So two
students posting under one prompt in the same second both land. A row this page
changed is this page's, a row it did not is the server's, and a row either side
took out stays out. A page that only added rows keeps the other side's order and
puts its own on the end; a page that moved rows about meant to, so its order is
the one that keeps. A list of plain values is still a leaf, because there the
order is the meaning: the options under a question are `["This", "That"]`, and a
merge that took one out and put its replacement on the end would move the right
answer.

**The boards write through the same door.** `boards.js` has its own key and its
own hook, and its write was the whole board, so a prompt cast to a room of
thirty kept whichever answer landed last. It reads, merges and writes now, by
post id.

Still true and worth doing: **a photo is a data URL inside the class blob**. At
220px and quality 0.7 each one is about 10KB, so a class of sixty adds well over
half a megabyte to a thing every screen reads and writes whole. `api/upload.js`
already hands out signed upload links for the notes bucket, which is where a
photo belongs.

## A box holds its own words

Two boxes were driven straight from the class store, one letter at a time: the
Comment back box on the grading screen and every text box on the welcome cards.
Each keystroke wrote the whole class, each write is a round trip, and an echo of
an earlier save landing mid-word put the box back to what the server held. The
words survived. The caret went to the front of the box, about once a second, for
as long as the typing went on. Andrew, 2026-09-21: "when i type in assignment
details, the cursor keeps going to the beginning", and then the same thing on
the welcome cards.

The rule now, and it is the one the note on the front page already followed: a
box keeps what is typed in it and hands it over when it is left. The grading
box is contentEditable and seeds itself once from the saved draft, then owns its
own contents. The welcome cards hold a draft each and save on blur and on
leaving the card, because Next is a tap that can land before a blur on a phone.
A card carries its key on the section, so one card's boxes are never the last
card's boxes handed new values.

Both are guarded from the source, because a caret is a live browser and cannot
be rendered.

## The first time a student signs in

`src/engine/WelcomeDeck.jsx`. Nine cards before the site, one question each, in
the order Andrew asked for them: welcome, the name they prefer, a photo, year
and hometown, about and motto, goals and what matters most, their biggest
strength as a student, their PIN with what it is for, and thank you. The PIN
card is there only when the app knows the code, because a student who arrived
by an emailed link has never seen the one that works without email. It
is the same profile the first challenge of the term reads, asked rather than
laid out as a form, because a form on a first visit is a thing to close.

Asked until the card is done. A student who types one letter and closes the tab
gets the cards again; a student who finishes, or presses `Finish this later`,
does not, because leaving either way records them in `welcomeSeen`. The first
rule was "have they answered anything", which meant the first keystroke both
closed the deck mid-typing and stopped it ever coming back. Every fixture
in the smoke run says its students have been welcomed, or every class-site check
would be reading these cards instead.

## The name a student goes by

`shownName` in `src/engine/roster.js`. A student sets a preferred first name
and a preferred last name on Your card; Andrew can set the same two from the
roster, for when he is told in person and they never get round to it. Every
surface made of people reads it: the roster both ways, the Horn board's seats,
who asked a question. His roster row also shows the registrar's name beside it,
so a name he cannot place is one glance rather than a search.

**What does not move is who they are.** `id` is slugged from the roster name
and keys their points, their game answers, their board posts and their grades,
so this is a display name and never a rename. Sorting follows the chosen
surname when there is one, and the class config's `lastNameOverrides` still
covers a compound surname nobody has overridden themselves.

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
