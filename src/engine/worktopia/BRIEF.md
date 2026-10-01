# Worktopia

**A worksheet that is a computer terminal in the year 2034. COMM 118,
Communication and Sport, Fall 2026, the week of October 5.**

Started 2026-10-01 as JobBot 5000 in a Claude Code session, renamed the same
day: "Job Bot 5000 is now call worktopia. it's the work management system
that assigns you to your job." This brief is the handoff: what was decided,
in Andrew's words where they are his, what is built, and what is still
open. Read this before touching `terminal.js`.

## What it is, plainly

A student reads a page about 2034, presses Enter Worktopia, and a white
screen beeps. Worktopia boots, looks them up on the Brady-Manning Work
Index, prints their record, draws them as text, and assigns them a horrible
job. If they accept, it assigns another. When they decline, it asks what
employment they want: three positions in sports, six questions each, looked
up in an Index of a thousand jobs. Then an evaluation, three questions about
the industry, the classmates they would work with, a meeting date, a review,
and "Worktopia's system will get back to you." Every answer is saved the
moment they send it.

Andrew, 2026-10-01, on JobBot: "a white screen that beeps ... when you enter
a prompt, you enter an answer then it kind of thinks and then gives you an
answer back ... it's an advanced version of AI."

## Where it lives

- Students: `/comm118/worksheets/worktopia`, signed in with their email off
  the roster. **Closed until he opens it**: `open: false` in
  `localWorksheets.js` shows a student "This worksheet is not open yet." The
  instructor gets a sheet under his own email at the same address, for
  trying it. Andrew: "don't make it student facing yet but i will want to
  see it in the morning."
- One student's file, for the instructor: `/comm118/worksheets/worktopia?s=<roster id>`.
- Who has submitted: `/comm118/worksheets`, the Worktopia tab, one row per
  student with Open sheet.
- The Index, readable: `/comm118/worksheets/worktopia?index`. Andrew: "make
  sure i can see the list."
- The assignment: made on the dashboard like any other, with its Details
  link pointed at the student address. The submits then count on the card
  (`worksheetSubmits.js` reads by key).

## The code

- `src/engine/worktopia/terminal.js`: the terminal, CSS and markup and all,
  scoped under `.jb`. `mountWorktopia(root, { store, viewer, photo,
  classmates, readOnly })` draws it and returns `{ destroy }`. Plain DOM, no
  React, nothing touches the window at import. `INTRO`, `MEETINGS`, `F` (the
  field names) and `COMPANY_LETTERS` are exported.
- `src/engine/worktopia/jobs.js`: `CATEGORIES`, twenty-five of forty
  titles; `JOBS`, the thousand flattened; `HORRIBLE`, sixty; `horribleFor(h,
  round)`; `findJob(title)`, which ignores case, punctuation, parentheses
  and a plural s. The smoke counts all of it.
- `src/engine/worktopia/store.js`: `supabaseStore` writes as the student
  into the worksheets package's tables (`worksheet_sheets`,
  `worksheet_answers`, migrations 001 and 002 in `vendor/ishak-worksheets`).
  `readStore` wraps rows the instructor already read through
  `/api/worksheet-submits`. `memoryStore` forgets, for trying the terminal
  with nothing behind it.
- `src/engine/localWorksheets.js`: the list of worksheets built in this repo
  rather than in the package. `WorksheetPage.jsx` and `WorksheetsPage.jsx`
  read it after the package's own `WORKSHEETS`. `WorksheetPage.jsx` also
  holds the `?index` page and passes the roster, less the student, as
  `classmates`.

## The run, in order

1. **The intro.** 2034 in large type, then a story: a model writes the
   Super Bowl ads in 2027, the Jaguars let one run their draft in 2028,
   the buyouts, the 2031 filing, the Packers sold for one share each and
   renamed the Quackers by an AI (his: "their duck-themed merch became the
   most popular team merchandise in the world"), the
   banana company, and jobs stop being posted in 2032. Andrew: "make up a
   story ... tell a dystopian story and use details." His skeleton:
   "its the year 2034. (catch people up on what's going on). over the last
   eight years, a few things have happened. AI has... media has... sports
   media in particular has... that's led to the consolidation of decisions
   in the employment process to one product: Worktopia. Worktopia is a ...
   that ... and now, you get your chance to experience Worktopia in the year
   2034." His sentences are kept as written; the fills are Claude's draft,
   in `INTRO`, for him to replace. The AI sentence names marketing and
   drafting players, and the page ends on his hint: "what will you bring to
   this job that would be better than if we simply let AI do it?" Enter
   Worktopia is the press the browser
   wants before any sound plays.
2. **Boot.** The terminal, the build, connecting to the Brady-Manning Work
   Index, loading 1,000 positions, calibrating the assignment engine,
   opening your file.
3. **"Hello. I am Worktopia."** Then "I assign labor for FRANCHISE DYNASTY
   MEDIA INC." and the card that spells the company out, one company a
   letter. Then what the company owns (below), then "All media. All sports.
   Every job in sports is a job at FRANCHISE DYNASTY MEDIA INC."
4. **"State your name."** Asked even though the sign-in knows the name:
   Andrew, "still please let me enter my name." The roster name sits in the
   box as a hint. Everything after reads the name as typed.
5. **The lookup.** "Cross-referencing against all 15,664 John Smiths in the
   United States." Then "Found you." and the record: Name, Trump Index No.
   (seventeen digits, grouped), Education (Santa Clara University, graduate),
   Likes, Dislikes, Status (Eligible for assignment). Then "Retrieving your
   image from the Index," the portrait, and "Operator image rendered.
   Resemblance: 94%."
6. **The first assignment.** "Worktopia has read your file." A thinking
   line, a low groan, "Assignment complete." and a ticket: name, arrow, a
   horrible job. Then his question: "Do you accept this position?" YES or
   NO. Andrew: "assign them a horrible job. like Postgame Toilet Inspector.
   Human Cannonball for the Cannonball Games. etc. ... ask them if they
   accept. if they say yes, ask them to choose again. Then when they choose
   no, say, okay, what employment do you want?" YES gets "Accepted. Choose
   again." and the next horrible job on a new ticket; NO gets "Declined.
   Noted on your file." Each round is its own field (`accept:a`,
   `accept:b`...), so the file shows how many they took.
7. **Position A.** "Okay. What employment do you want?" The title is looked
   up: "Found in the Index: Sideline reporter, under Broadcast and
   production. Status: OPEN." or "Not in the Index. Filed as a new position.
   Status: OPEN." Then his questions:
   - "What skills will you need to do this well?"
   - "What will you bring to this job that would be better than if we
     simply let AI do it?" (his, 2026-10-01: hinted at on the intro page
     and asked here)
   - "Why will you personally be good at this position?"
   - "What does this position accomplish? What are the main duties?"
   - "What value will this position provide to the sports ecosystem in
     2034?" (one question where there were two, 2026-10-01: "cut the job
     questions by 1")
   Then "Logged. Position A, <title>, is on your file." and his line: "Well,
   this is not a guarantee. We need to present three positions to
   Worktopia's system, which will then choose one for you."
8. **Positions B and C.** "Position B, your second choice. What is a
   position in sports that you would be competent at, and provide value to
   FRANCHISE DYNASTY MEDIA INC.? Please list the job title." and the same
   five questions. Exactly three positions now; the fourth and fifth are
   gone.
9. **Evaluation.** Kept from JobBot. The positions on file as a card, then
   three questions, each answered with a lettered button: which position is
   most interesting, which they are most likely to get, which pays the
   most. Shown back as a card, then "Is this correct?" CONFIRM moves on,
   REVISE asks the three again.
10. **The industry.** Last, after the review and `REMEMBER`. It ran
    first for a morning ("ask the three industry questions before asking
    about the jobs"), then Andrew moved it: "let's leave that for the end
    and say: okay, if this isn't the actual reality, what do you see as the
    changes?" His three now: "Okay, if this isn't the actual reality, what
    do you see as the changes?" "Which jobs do you think will not be as
    prevalent in 2034?" "Which jobs will be much more popular?"
11. **The workgroup.** "Please name people in the class who you would
    potentially like to have as a co-worker. You may name up to four, or
    none." The roster, less themselves, as toggles and a Done button; saved
    as names joined with commas, or "None". With no roster it is a typed
    answer. Then "Please check your calendar. You will meet with your new
    workgroup on Wednesday, October 21, during class, or Thursday, October
    22, at 9 am, or Friday, October 23, during class." "Which date is your
    preference?" WED, THU or FRI. "And also: are you available, if
    necessary, on Thursday, October 22 at 9 am?" YES or NO.
12. **The review.** "Please rate Worktopia." One to five stars. "Please
    review Worktopia." A few lines.
13. **"Thank you. Worktopia's system will get back to you."** Then "Your
    file is complete. Submit it to Worktopia?" SUBMIT or REVISE (change one
    position, then the evaluation runs again). After submitting: RECALL
    takes the file back, LEAVE ends. No allocation at the end: the system
    gets back to them.

A return visit asks first: "Your file is on record. Pick up where you left
off, or start over?" RESUME replays; RESTART clears every answer row and
the submit (`store.reset()`) and begins at the name. Andrew: "i should have
the option to restart or go back to where my progress was." A resumed file
replays everything on file at once, with no sound and no delays,
and picks up at the first open question at the terminal's real pace. The
intro shows on every visit; the instructor's read skips it.

## An accepted job is gone

Andrew, 2026-10-01: "instead of 'accepted: choose again' it should be one of
10 prompts like 'that job has been taken by Andrew Ishak/Julie
Sullivan/Steve Nash/Jalen Williams.' 'that position has been assigned to AI,
sorry.' 'oops, that position does not match your skills as closely as I
thought.' 'sorry but this job requires neuralink, a bionic implant, which
you do not have.'" `TAKEN` holds his four and six of Claude's; the line is
picked by the name and the round, so a student sees a different one each
time they accept, and the next round opens with "Reassigning."

## The Index

A thousand jobs, forty in each of twenty-five categories: athletes,
coaching, team operations and front office, league and governing bodies,
officiating, broadcast and production, journalism and writing, digital and
social, marketing and brand, sponsorship and partnerships, communications
and public relations, ticketing and fan experience, venue and facilities,
food and hospitality, transit and logistics, manufacturing and apparel,
retail and merchandise, technology and data, medical and performance, legal
and ethics, finance and administration, betting and fantasy, esports and
emerging sports, youth and college, agents and player services. Andrew:
"look up 1000 sports related jobs. yes 1000. that includes the obvious ones
like athletes, staff, leagues, and media, but then also think about
manufacturing, sponsorships, technology, communication, marketing, ethics,
and more. food. transit, etc."

The sixty horrible jobs: his two first, then Claude's (Stadium Seat Gum
Remover, Human Pylon, Vuvuzela Tuner, Golf Ball Pond Diver...). The name
picks where in the list a student starts, and each acceptance moves one
along, so a reload hands out the same jobs in the same order.

## The jokes

- **The Brady-Manning Work Index.** The index Worktopia consults. Andrew:
  "don't say 2034 job index, make up an index."
- **The record.** A seventeen-digit Trump Index No., Santa Clara University
  graduate, one like and one dislike. Likes are things nobody likes
  (lukewarm coffee, airport carpet, the fourth quarter of a blowout, 73 of
  them). Dislikes are things everybody likes (puppies, rainbows, walk-off
  home runs, otters holding hands, 73 of them). Every value comes from a
  hash of the name, so the same name always gets the same record and two
  names rarely share one. The count of people with the name, the resemblance
  percentage, the horrible jobs and the ticket ids come from the same hash.
- **The portrait.** The photograph on the student's card, drawn as text
  (dark pixels become dense glyphs, since the screen is white; the middle of
  the picture is kept, cropped to a portrait). A student with no photograph
  gets a face drawn from the name: hair, eyes, glasses, nose, mouth, beard,
  a jersey number. Andrew: "take their avatars and turn them into text
  pictures, that would be so cool."
- **FRANCHISE DYNASTY MEDIA INC.** Andrew: "one big media conglomerate that
  holds all media, all sports, all that stuff ... make it like an acronym."
  FOOTBALL DYNASTY INC. came first and went ("football is no good. how do we
  get Fox, Hulu, Comcast, and more in the first word"). MEDIA was added for
  Meta and Anthropic without losing Amazon or Apple. Chiquita Banana is the
  random one he asked for. One company a letter:

  | | | | | | |
  |---|---|---|---|---|---|
  | F | Fox | D | Disney | M | Meta |
  | R | RedBird | Y | YouTube | E | Emirates |
  | A | Amazon | N | Nike | D | DAZN |
  | N | Netflix | A | Apple | I | iHeart |
  | C | Comcast | S | Sinclair | A | Anthropic |
  | H | Hulu | T | TKO | I | IMG |
  | I | Ineos | Y | YES Network | N | NBC |
  | S | Sky | | | C | Chiquita Banana |
  | E | ESPN | | | | |

  Warner and Kroenke, which he named at the start, have no W or K to land
  on. KINGDOM as the second word would seat Kroenke, at the cost of DYNASTY.
- **What it owns.** "In 2034 these are one company. FRANCHISE DYNASTY MEDIA
  INC. owns every single NFL team. After the NFL, the other leagues. After
  the leagues, every channel, every stream, every stadium, every jersey,
  every ticket and every banana." Rewritten 2026-10-01 at his ask: the
  terminal now says it owns every team, every league, every channel, every
  stream, every stadium, every parking lot, every jersey, every ticket, every
  app the ticket lives in, every mascot and every banana.

## The Sports Subscription updates

Three per student, dropped in before three questions picked by the name
(one early, one in the middle, one late), in an order picked by the name,
so a reload shows them in the same places. Andrew, 2026-10-01: "at random
points (3 for each student), you should give them an UPDATE on their
Sports Subscription," and "don't do exactly this. make some of the details
different for each student." His three, with the parts that vary:

- A ticket bought for the big game (when) between two 2034 teams (Green
  Bay Quackers, Las Vegas Algorithms, Austin Bananas, Jacksonville
  Punters...). "Your seat number is: your couch" (or the kitchen table, the
  bathtub...). Cost: $150 (or another).
- The subscription updated to a new monthly price of $249.99 (or another),
  with access to the FDM Marketplace, "where you can buy access to sports
  games" (one quarter at a time, replays sold separately...).
- A personal frisbee (or basketball, kayak, running shoes...) unlocked for
  the weekend; the subscription expires 48 hours (or another) after first
  throw (dribble, paddle, mile), upon which its ground magnet (deflation
  valve, hull anchor, lace lock) is reactivated.

The parts are the lists at the top of `terminal.js`; `updatesFor` and
`slotsFor` build them from the hash.

## Behind the curtain

Andrew, 2026-10-01: "you're giving away the stuff behind the curtain." So:

- A short answer (under the minimum on a long question) gets one line back,
  "This is not enough information to assign you." Never anything about
  sentences or length.
- The index is always named. Never "the index needs" or "a few sentences."
- Worktopia never explains how it chooses.

## The look

A white screen, on purpose, in both day and night: the page around the
terminal follows the student's theme, the terminal does not. Andrew asked
for "futuristic," so: a squared display face for the wordmark and the cards
(Orbitron), a terminal mono for everything else (Share Tech Mono), corner
brackets like a HUD, a slow scan sweep, a live clock running eight years
ahead, a progress rail with one segment per position, and Worktopia's lines
decoding (scrambled cyan glyphs resolving left to right) rather than typing.
A line lands at its full height at once, so the page never shakes while
Worktopia writes; the first draft scrolled on every character and shook,
which he caught on the first look.

Sound: a square-wave beep when it is your turn, a chirp when an answer is
taken, a low sine hum while thinking, a groan on a horrible assignment, a
fanfare on submit, a mute button in the bar. Nothing plays until Enter
Worktopia, which is the press the browser wants.

## Saving

Every answer is its own row, written when sent. A field is a word with an
optional part, the shape the database's field check allows: `name`,
`accept:a` and on, `title:a`, `skills:a`, `human:a`, `why:a`, `duties:a`, `value:a`,
`future:a` (and `:b`, `:c`), `interesting`, `likely`, `pays`, `confirm`,
`industry`, `fading`, `rising`, `coworkers`, `meeting`, `thursday`,
`stars`, `review`. An answer over 500 characters is cut into rows at
position 0, 1, 2 and joined on load. A failed write retries with backoff to
thirty seconds and the bar says "Not saved. Trying again." Submit and recall
set and clear `submitted_at` on the sheet row, the same as the stakeholder
map. Andrew: "you have to keep all these student answers. i will need them
to review them."

## The public version, 2026-10-01

Andrew: "just give the public a way to go through worktopia. make it a public
version. i'll link to it and let people play with it. and then give a ? button
at the top that has a pop up that has like a 3 paragraph description of what
i'm doing here." `/worktopia` mounts the terminal with `visitor: true` on
`memoryStore`: no roster question, no calendar, no submit, a start-over
button at the end that reloads, and nothing kept past the tab. The ? is a
fixed button at the top right that opens a `<dialog>` holding `ABOUT`, his
pitch from the "Worktopia front page" Google Doc, word for word. The intro is
his too, from the same doc, in `INTRO`.

The nostalgia. His ask the same day: Worktopia "is nostalgic for the human
era of sports, especially going to games, ticket stubs, human error on the
field, thrill and agony, the oakland a's and the coliseum with their drums,
fans," then "a's section 215 please" and the names: Hudson, Zito and his
guitar, Tejada, Cespedes, Coco Crisp, Bill King, Ken Korach "the lights have
taken full effect." The first draft put a line in the greeting and a wry
aside on most answers; he cut it: "you went too AI on this part ... save the
nostalgia for later in the conversation," then "well not every line. but it's
a little too much. i do like the cespedes line." What is left:

- The lookup: "Found you. I also found the Cespedes throw from 2014 again. I
  keep finding it."
- The evaluation: one sentence on the 2002 streak and the twentieth game.
- A fourth Sports Subscription update, the Section 215 drums for $4.99 a
  month, three of the four an update a run. `drums()` plays the cadence,
  boom, boom, boom-boom-boom, twice, from the same oscillator as every other
  sound. It plays again after `REMEMBER`.
- `REMEMBER`: five lines after the review, before the thank-you, in both
  the class run and the public one. Claude's draft, for him to rewrite.

## Open
- **Opening it.** `open: ["comm999"]` in `localWorksheets.js` until he says;
  `true` opens it to every class. Pepe and Jan on COMM 999 can run the
  student path now.
- **The intro** is his, word for word. One question: "a job in sports in 2032" where the page is 2034.
- **`REMEMBER` and `ABOUT`** are drafts and his pitch; he rewrites both in the Google Doc, then here.
- **The sounds.** He asked for "some midi version of a's drum audio, or actually of careless whisper," then "yeah add it." Both are synthesized from the terminal's oscillator, no file on the site: `whisper()` plays the sax riff under `REMEMBER`, `drums()` the Section 215 cadence after it and with the drums update. Nobody has listened to the riff against the record yet; the notes come from a transcription, transposed from alto sax.
- **The values of sports.** Andrew, 2026-10-01: "we need a way to make them
  understand the values of sports. so i'm still thinking." Not built.
- **Worktopia's lines** other than the questions are Claude's words for him
  to edit. The questions are his.
- **The saving words** ("Saving", "Saved", "Not saved. Trying again.") are
  the worksheets package's placeholders, still waiting on his.
- **The evaluation** (most interesting, most likely, pays the most) was
  kept from JobBot without him saying so either way.
- **The instructor's list** is a list, not the package's spreadsheet: who
  has submitted and Open sheet. No verdicts, no release, no readout. The
  answers themselves read one file at a time at `?s=`.
- **The company card** takes about three seconds to spell out. Fine once;
  on a replay it is instant.
