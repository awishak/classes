# JobBot 5000

**A worksheet that is a computer terminal in the year 2034. COMM 118,
Communication and Sport, Fall 2026, the week of October 5.**

Started 2026-10-01 in a Claude Code session. This brief is the handoff:
what was decided, in Andrew's words where they are his, what is built, and
what is still open. Read this before touching `terminal.js`.

## What it is, plainly

A student opens a white screen that beeps. JobBot 5000 boots, looks them up
on the Brady-Manning Work Index, prints their record, draws them as text,
and asks for the skills that make them a good employee for FRANCHISE DYNASTY
MEDIA INC., the one company that owns every NFL team, then every other
league, then every channel, stream, stadium, jersey, ticket and banana in
2034. Then it takes three to five positions in sports, four questions each,
runs an evaluation, and assigns them one. Every answer is saved the moment
they send it.

Andrew, 2026-10-01: "a white screen that beeps ... when you enter a prompt,
you enter an answer then it kind of thinks and then gives you an answer
back ... it's an advanced version of AI."

## Where it lives

- Students: `/comm118/worksheets/jobbot-5000`, signed in with their email
  off the roster. The instructor gets a sheet under his own email at the same
  address, for trying it.
- One student's file, for the instructor: `/comm118/worksheets/jobbot-5000?s=<roster id>`.
- Who has submitted: `/comm118/worksheets`, the JobBot 5000 tab, one row per
  student with Open sheet.
- The assignment: made on the dashboard like any other, with its Details
  link pointed at the student address. The submits then count on the card
  (`worksheetSubmits.js` reads by key).

## The code

- `src/engine/jobbot/terminal.js`: the terminal, CSS and markup and all,
  scoped under `.jb`. `mountJobBot(root, { store, viewer, photo, readOnly })`
  draws it and returns `{ destroy }`. Plain DOM, no React, nothing touches
  the window at import.
- `src/engine/jobbot/store.js`: `supabaseStore` writes as the student into
  the worksheets package's tables (`worksheet_sheets`, `worksheet_answers`,
  migrations 001 and 002 in `vendor/ishak-worksheets`). `readStore` wraps
  rows the instructor already read through `/api/worksheet-submits`.
  `memoryStore` forgets, for trying the terminal with nothing behind it.
- `src/engine/localWorksheets.js`: the list of worksheets built in this repo
  rather than in the package. `WorksheetPage.jsx` and `WorksheetsPage.jsx`
  read it after the package's own `WORKSHEETS`.

## The run, in order

1. **Power on.** The press the browser wants before any sound plays. Boot
   lines: the terminal, the build, connecting to the Brady-Manning Work
   Index, loading the sustainability model, calibrating the allocation
   engine, opening your file.
2. **"Hello. I am JobBot 5000."** Then "I allocate labor for FRANCHISE
   DYNASTY MEDIA INC." and the card that spells the company out, one company
   a letter. Then what the company owns (below), then "All media. All
   sports. Every job in sports is a job at FRANCHISE DYNASTY MEDIA INC."
3. **"State your name."** Asked even though the sign-in knows the name:
   Andrew, "still please let me enter my name." The roster name sits in the
   box as a hint. Everything after reads the name as typed.
4. **The lookup.** "Cross-referencing against all 15,664 John Smiths in the
   United States." Then "Found you." and the record: Name, Trump Index No.
   (seventeen digits, grouped), Education (Santa Clara University, graduate),
   Likes, Dislikes, Status (Eligible for allocation). Then "Retrieving your
   image from the Index," the portrait, and "Operator image rendered.
   Resemblance: 94%."
5. **Skills.** His words: "Please list the skills you have now, in 2034,
   that make you a good employee for FRANCHISE DYNASTY MEDIA INC." Then the
   Index reports 4,113 open positions that match.
6. **Positions A to E.** His words, 2026-10-01, with only the letter and the
   ordinal changing after A:
   - "Now, we will examine your employment preferences. I require you to
     present me with at least three positions that you would be interested
     in."
   - "Let's start with Position A, your first choice. What is a position in
     sports that you would be competent at, and provide value to FRANCHISE
     DYNASTY MEDIA INC.? Please list the job title." ("(or self)" was in the
     first draft and came off, same day.)
   - "What does this position accomplish? What are the main duties?"
   - "What value does this position provide to the sports ecosystem?"
   - "Why do you think this position is still valuable in 2034? (I know, for
     I am JobBot 5000, but I want you to tell me.)"
   - After C and D: "Present another position, or proceed to evaluation?"
     ADD or DONE. E ends the loop on its own.
7. **Evaluation.** The positions on file as a card, then three questions,
   each answered with a lettered button: which position is most interesting,
   which they are most likely to get, which pays the most. Shown back as a
   card, then "Is this correct?" CONFIRM moves on, REVISE asks the three
   again.
8. **Allocation.** "Running allocation for <name>. Stand by." Three thinking
   lines, a fanfare, and the allocation card: name, the assigned position,
   skills, every position with its three answers, a barcode. The Index
   assigns the position with the longest answer about 2034; a tie goes to
   the position listed first. Placeholder rule, see Open.
9. **Submit.** "Your file is complete. Submit it to the instructor?" SUBMIT
   or REVISE (change one position, then the evaluation and allocation run
   again). After submitting: RECALL takes the file back, LEAVE ends.

A reload replays everything on file at once, with no sound and no delays,
and picks up at the first open question at the terminal's real pace.

## The jokes

- **The Brady-Manning Work Index.** The index JobBot consults. Andrew:
  "don't say 2034 job index, make up an index."
- **The record.** A seventeen-digit Trump Index No., Santa Clara University
  graduate, one like and one dislike. Likes are things nobody likes
  (lukewarm coffee, airport carpet, the fourth quarter of a blowout, 73 of
  them). Dislikes are things everybody likes (puppies, rainbows, walk-off
  home runs, otters holding hands, 73 of them). Every value comes from a
  hash of the name, so the same name always gets the same record and two
  names rarely share one. The count of people with the name, the resemblance
  percentage and the allocation id come from the same hash.
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
  every ticket and every banana."

## Behind the curtain

Andrew, 2026-10-01: "you're giving away the stuff behind the curtain." So:

- A short answer (under 60 characters on the three long questions) gets one
  line back, "This is not enough information to assign you." Never anything
  about sentences or length.
- The index is always named. Never "the index needs" or "a few sentences."
- JobBot never explains how it picks the allocation.

## The look

A white screen, on purpose, in both day and night: the page around the
terminal follows the student's theme, the terminal does not. Andrew asked
for "futuristic," so: a squared display face for the wordmark and the cards
(Orbitron), a terminal mono for everything else (Share Tech Mono), corner
brackets like a HUD, a slow scan sweep, a live clock running eight years
ahead, a progress rail with one segment per position, and JobBot's lines
decoding (scrambled cyan glyphs resolving left to right) rather than typing.
A line lands at its full height at once, so the page never shakes while
JobBot writes; the first draft scrolled on every character and shook, which
he caught on the first look.

Sound: a square-wave beep when it is your turn, a chirp when an answer is
taken, a low sine hum while thinking, a fanfare on the allocation, a mute
button in the bar. Nothing plays until Power on, which is the press the
browser wants.

## Saving

Every answer is its own row, written when sent. A field is a word with an
optional part (`skills`, `title:a`, `duties:a`, `value:a`, `future:a`,
`more:c`, `interesting`, `likely`, `pays`, `confirm`, `name`), the shape the
database's field check allows. An answer over 500 characters is cut into
rows at position 0, 1, 2 and joined on load. A failed write retries with
backoff to thirty seconds and the bar says "Not saved. Trying again." Submit
and recall set and clear `submitted_at` on the sheet row, the same as the
stakeholder map.

## Open

- **The values of sports.** Andrew, 2026-10-01: "we need a way to make them
  understand the values of sports. so i'm still thinking." Not built. It
  goes after the evaluation and before the allocation, or replaces the
  allocation's rule.
- **The allocation rule** is a placeholder (longest answer about 2034). He
  may want the position they said they are most likely to get, or something
  that reads the answers.
- **JobBot's lines** other than the questions are Claude's words for him to
  edit. The questions are his.
- **The saving words** ("Saving", "Saved", "Not saved. Trying again.") are
  the worksheets package's placeholders, still waiting on his.
- **The instructor's list** is a list, not the package's spreadsheet: who
  has submitted and Open sheet. No verdicts, no release, no readout.
- **The company card** takes about three seconds to spell out. Fine once;
  on a replay it is instant.
