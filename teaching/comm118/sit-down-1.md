# Sit-Down 1: how the whole thing runs

Written 2026-10-15 from Andrew's walk-through that afternoon. Read this first
in any session that touches the sit-downs. The groups and the reasons behind
them are in [sit-down-groups.md](sit-down-groups.md).

## The three steps, in his words

"Sit down, prep, they turn in, they read the other 3 sit down prep, and then
we have the sit down meeting. Those are the 3 steps they have to accomplish."

| Step | When | Where |
| --- | --- | --- |
| 1. The Sit-Down prep, a Google Doc, 2 to 3 pages | Due Monday, October 19, 11:59 PM | Turned in on `/comm118/sitdown` |
| 2. Read the table's prep | From 12:01 AM Tuesday, October 20, until the sit-down | The table's links appear on the same page |
| 3. The sit-down, recorded on video | Wed Oct 21, Thu Oct 22, Fri Oct 23, at 9:15 and 9:45 | Vari Hall 206 |

**The date.** He said "Monday, October 18th." October 18, 2026 is a Sunday.
Asked, and he said "monday" (2026-10-15, late): the Scouting Report is due
Monday, October 19, 11:59 PM. The page, `SITDOWN` in
`src/engine/worktopia/sitdown.js`, the words, and the My Work assignment
`s1-memo` on the plan row all say October 19. Backup of the row before the
assignment moved: `comm118-f26-v1-plan-bak-due-2026-10-15`.

## What the prep is

His description, 2026-10-15: "the first page is basically, Hey, here's my
job. I'm a bar owner, and as a bar owner, here's where I see my place in the
ecosystem of sports media or sports, right? And here's where I see it going
... thinking about not only how will AI change it, but also how could AI make
it better ... And then a couple questions about that going forward. Then on
pages 2 and three, it's like a half page each of here's how I relate to
person B, and here's a potential question about where this relationship is
going ... So, in essence, they're creating about 2.5 pages worth of content
that's meant to be read, and they are producing 5 questions."

- Page one: the job, where the job sits, where the job is going, what AI
  changes and what AI could make better, what the human still brings, and
  two open questions.
- Half a page per person at the table: how the two jobs relate now, how the
  relationship changes under machine learning, and one open question. The
  page shows a prompt per person: the pull line between the two fields from
  `src/engine/worktopia/roles.js`, the same lines the roles page shows him.
- Five questions at a table of four, at least one per connection plus two of
  their own. "Those are questions I might ask."
- Sources: "it's good for them to think about, how do I include like one or
  2 kind of like, like basis for what I'm saying."
- AI: "Obviously, they can use AI to do this. I get that ... But the key here
  is, can they talk about those questions?"

## The room rules, in his words

"My office number, my instructions to be there 5 to 10 minutes early, we're
going to start on time. I'm not going to wait for anybody. If you are
seriously ill, don't come, we will do it a different way. We will not do
Zoom, but if you're seriously ill, we'll figure something else out, but be
honest ... if you're not seriously ill, you know, be ethical and come to
class. You know, even if you're not prepared." And: "Their conversations will
be recorded. I'm going to let them know. It will be a video."

## The second pass, the same afternoon

He read the first draft and sent notes: faces at the table and his own
("meeting director, something like that"), the steps higher with a link to
the prep, the prep on its own page, the words "official and also delivered
the way a 12 year old would understand it ... not infantilizing people",
complete sentences only, page one as a list of short-answer questions, the
pull lines as "a hint from your instructor" with hedges, the line about
disagreeing on its own line in bold, and three questions at the end: how
many questions, do I need links, can I use AI. The recording is audio, not
video, and a student may come listen afterward. On AI: "my preference is
that you use something called the INQUIRE method" with a link to his page,
https://drewi.sh/teaching/human-centered-education#drive, and "you own
everything that you write. If AI writes something you don't like, I'm going
to attribute it to you."

Settled later that evening: the prep document is the **Scouting Report** ("let's go with scouting report"); `PULL_LINKS` in `roles.js` holds one checked article per pair of fields at the six tables, 33 in all, drawn under the hint; his face comes from `instructorCard.photo` on the plan row; and the student home carries a door to the Sit-Down page (`SitdownDoor` in `portal/StudentHome.jsx`) until the last sit-down is over.

Open from that pass, as first written: a name for the prep document other than Sit-Down prep (he picked Scouting Report on 2026-10-15, later that evening)
("give me some other ideas"), and links under the hints ("if you have linked
information, put that in here"): `PULL_LINKS` in `roles.js` is the place,
empty so far.

## Late on October 15: group, not table

Four more notes from him: the illness line is gone from the guidelines
("rwmove this line"); in front of a student the word is "group", never
"table" ("everyone in your group"), on both pages and the door, while his
own view still says table; the intro says "I will ask many questions, and
most of them will be provided by you, the students"; and under How the
sit-down works there are three matching buttons, one per step, that jump to
the turn-in box, the group's reports, and the time and room at the top.
Then "Your questions" came off the Scouting Report page ("remove"); the
FAQ at the end still says how many questions to write. The hedge under each
hint, "That's one way I could see the relationship going," came off too.
The line above each hint rotates through his four, one per table-mate:
"You might want to consider this:", "Here's one thought:", "Something to
consider:", "An example of why this relationship matters:" (`HINT_LEADS`
in SitdownPage.jsx, `hint.lead` through `hint.lead.4` in the words).

## The look, late on October 15

"Make the sit down page and the scouting report page look more like the
skylight view." Two Skylights live in the repo: the features page's type and
hairlines (`src/FeaturesPage.jsx`) and the dashboard's August pass aimed at
the Skylight calendar (colour that stands for one thing, filled number chips,
a chore chart that ticks off, rounder and chunkier). A first pass took only
the first and he said "i was hoping you'd make it look more visually
interesting", so the pages now carry both:

- A colour per seat (`seatOf` in `SitdownPage.jsx`, eight slots in CSS on
  `.pc[data-c]`), and the same colour on the ring round a face, the name
  chip, the row in the group's reports, the hint card and the Open button.
  `Face` takes an `accent` prop for this; a `var(--pc)` accent is mixed with
  `color-mix` rather than given a hex alpha. Day values read at 4.5:1 on the
  sunk surface with white inside; night values read on the night card with
  the night ink inside (`scratchpad/hues.mjs` picked them).
- The when and where in a filled seaglass band, with a Today / Tomorrow /
  In N days chip computed from the session's given day and time (`whenMs`,
  `countdown`).
- How the sit-down works as a chore chart: filled number, ticked and struck
  through when the link is in, a ring on the step that comes next. Step two
  is reading, which nothing can see, so that row only says Opens or Open now.
- The Scouting Report's document as page tiles, number chips on the
  questions, hint cards in the other person's colour, three FAQ cards.
- Fraunces for headings, Outfit for the rest, cards at 18 and rows at 12,
  seaglass `#27756a` (the features page's `#2f8576` sits at 4.2:1 as text),
  night by the same tokens under `[data-mode="night"]` and the dark media
  query. The student themes (Snapchat, Crashing Out) no longer restyle these
  two pages; the top bar still follows them.
- The smoke reads his count as "2 of 25" and "turned in" separately, since
  the band sets the number large.

The morning of October 16, five notes on that pass: the dates lead each step
of How the sit-down works, with the step's button inside its row; step two
says "Read your group's Scouting Reports" (`head.docs` and `step.2.go` in
the words); the jobs on the hint cards are large and in each person's
colour; the band is half the height with the room as large as the date and
bolder; and an **Every group** card at the foot of the student page
(`head.all`, `all.show`, `all.hide` in the words) opens every table with its
day, time, names and roles, so a student can see the whole class. Deployed
that morning on his "make all these changes and deploy."

After that deploy, two more: the task leads each step again, with the date
large under the task ("if you have a list, the tasks should be in the list,
not the date"), and every pill button is outlined in seaglass ("the green
links do not stand out"). Then the sheen: a band of light crosses every pill
every 5.5 seconds (`sd-sheen`, staggered by step) and a seaglass glint
passes through every underlined link every 6 (`sd-glint`, a gradient clipped
to the text). Both sit still under reduced motion. The harness in the session
scratchpad grabs frames of one cycle (`frames.mjs`) to see the sweep move.

## Where things live

- **The student page**: `/comm118/sitdown`, `src/engine/SitdownPage.jsx`.
  Signed in by email. Their day, time and room with the faces at the table
  and his as meeting director, the three steps with the prep page linked
  from step one, the guidelines, the box for the Google Doc link (step one),
  and the table's documents once the prep is due (step two). A student off
  the tables sees the words and "You're not at a table yet."
- **The prep page**: `/comm118/sitdown/prep`, the same component with
  `page="prep"`. Page one as six short-answer questions and two open ones,
  pages two and three with a hint per table-mate (two faces, the pull line
  under one of his four lead lines, and a link when
  `PULL_LINKS` has one), the bold disagree line above the hints, and the
  three questions at the end with the INQUIRE link.
- **His photo**: `config.instructor.photo` is empty in every class config,
  so his circle shows initials everywhere on the site, the meeting director
  circle included. A data URL there, or a row the engine reads, fixes every
  surface at once.
- **His view of the same address**: every table, every link with its time,
  late marked, the count, a "See the page as" picker to show the class one
  student's page, and "Edit the words" to change any line in place. The words
  live in `src/engine/worktopia/sitdownWords.js` with his edits in the store
  row `sitdown-1-words-plan`.
- **The facts**: `SITDOWN` in `src/engine/worktopia/sitdown.js`: the room,
  the due time, the release time. `tableOf`, `roleFor`, `promptFor`, `linkOf`,
  `withLink` are the helpers the page and the smoke use.
- **The roles**: `/comm118/worksheets/worktopia/roles`, saved as
  `sitdownRoles` on the plan row. A student's page reads the saved letter,
  else the suggestion in `PICKS`. The reasons in `PICKS` never reach a
  student. Ruby's role is still the placeholder from October 13, and
  Addison's is her third pick; both can change on the roles page any time
  and the student page follows.
- **The links**: `sitdownLinks[rosterName] = { link, at }` on the class row,
  which students write. When an assignment on My Work has its Details link
  set to `/comm118/sitdown`, a hand-in also goes onto that assignment's log
  as a submission, so My Work shows the hand-in and Grade view queues the
  work, and a link turned in on My Work shows on the Sit-Down page. Keys are
  roster names: Emma is Vianna Alvarez, Yoyo is Haixing Yang.
- **The instructor's sheet**: `src/readouts/comm118-sitdown-1.json`, drawn
  under each table on his view once written. Empty until Tuesday.
- **The script**: `node scripts/sitdown-links.mjs` prints every table with
  its links from production. Read-only. Needs `SUPABASE_SERVICE_ROLE_KEY` in
  `.env.local`.

## What he still has to do before class on October 16

1. Deploy, then open `/comm118/sitdown` signed in.
2. Done 2026-10-15 by `scripts/sitdown-assignments.mjs`: the My Work
   assignment is "Scouting Report" (`s1-memo`), due Oct 19, 11:59 PM, open,
   with its Details link set to `https://classes.andrewishak.com/comm118/sitdown`,
   so a link turned in on either page lands on My Work and Grade view too.
3. Read the words on the page and change any line he wants. His edits save
   to the store and survive deploys.
4. Pick "See the page as" to show the class one student's page.

## Tuesday, October 20: the pod cheat sheet

His ask: "I'm gonna have you read it all, and I'm gonna have you make me a
document that I can use in the sit down meeting. And in that sit down
meeting, it has all 4 people. It has their roles. It has essentially, like,
quick summaries of how they think they're, we're gonna relate to everybody
else, and then, like, highlight the best questions. And I highlight at least
a couple questions, you know, from each page that I would then ask."

The session that does this:

1. Run `node scripts/sitdown-links.mjs` for every link by table.
2. Read each Google Doc. Reading a Doc means the Google Drive connector or
   him pasting the text; the connector needs his yes in that message. A Doc
   shared "anyone with the link" can also be fetched as plain text at
   `https://docs.google.com/document/d/<id>/export?format=txt`.
3. Fill `src/readouts/comm118-sitdown-1.json`: per person, `role`, a
   `summary` of page one, one `relations` line per table-mate as that student
   sees the relationship, and every question they wrote with `ask: true` on
   two or more per person worth asking. `ask` on the table is for questions
   that cross the whole table. Set `written`.
4. Build, deploy. He opens `/comm118/sitdown` on his laptop in the room and
   each table's sheet sits under its links.

A pod whose prep is not all in by Tuesday gets a sheet from what is in, and
the missing person is named as missing.

## After each sit-down: the recording

His ask: "I'm gonna take those recordings, and I'm gonna feed them to you.
For you to give me, like, your idea of how it went. Now, I'm gonna figure out
grades on my own ... I want your opinion on how each student did. I wanna
know if you think they're doing a good job, because I wanna see how good you
are at listening to a student in a meeting, and then being able to kind of
summarize their abilities."

So: one read per recording, one paragraph per student, on how well they
talked about their own job, about each relationship, and about the questions
they and others wrote, and whether they could go beyond the document. No
grade; he sets the grade. The shape of a comment he has already approved for
verbal grading, top line then What worked then What to work on, is in the
memory note on verbal grading and is a reasonable shape here. Where the
recording goes and how a transcript is made is not built; the meeting
recording feature in memory is the planned home for recording, Whisper
transcript, summary and feedback.

## Open

- Whether a student can replace a link after the deadline. The page lets
  them, marked with the time, and his view shows "after the deadline" in
  red.
- The words are Claude's draft around his sentences. He edits in place.
- Nothing tells a student the page exists except the Sit-Down 1 link in
  their class menu and the assignment he adds. A notice on the class home
  would help on Friday.
