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
- **The instructor's sheet**: written 2026-10-20. Not in the repo, which is
  public on GitHub; the sheet names students and says who is thin. The
  working copy is `private/comm118-sitdown-1.json` on his laptop (`private/`
  is in .gitignore), the live copy is in the private `instructor` bucket on
  Supabase, `scripts/sitdown-sheet.mjs --file private/comm118-sitdown-1.json
  --write` puts a new copy up, and `/api/sitdown-sheet` hands the file to a
  signed-in instructor and nobody else. The sheet is his own page,
  `/comm118/sitdown/sheet` (`SheetBody` in SitdownPage.jsx), reached from
  Open my sheet on his view of `/comm118/sitdown`: The work (the read across
  the class, one line a person by table, each with their role), then every
  group in full on the same page: the seats with roles; what the group is
  about; each person's summary, Good points (`points`) and Whose writing
  (`voice`, his own or a tool's, with the evidence); then every question
  sorted by who it is for, with the writer's job, the picks in bold; then each
  person's own questions. `/comm118/sitdown/sheet/<session key>` is the same
  page scrolled to that group. He asked for the split that evening ("one page
  for me one page for students"), then for the per-group shape ("I'm gonna do
  it by group"), then, shown six separate pages, for one page with roles on
  every name ("so many diff pages ... make the links clearer"). Sit-Down sheet
  is in his menu (apps.js) beside Sit-Down 1. Every report is a link on the
  sheet too ("need links to all student work on both pages"): the name in
  the seats, an Open button on the card, the name in the roll.
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

### What happened on October 20

His ask that afternoon: "i want a summary of all the work. did they do it?
is it good in your opinion? who was working hard? who is thin? and then for
each group meeting, I want a cheat sheet with what they focused on, as well
as all of their questions, and who wrote them for whom. deploy and make sure
only i have access."

- 22 of 25 turned in a link. Charles Kosinski, Paul Beaven and Neel Namburar
  did not.
- The Google Drive connector is tied to his Gmail, and only Lila's Doc was
  shared with it. The other Docs are shared to the SCU domain, so they were
  read through his Chrome, signed in as aishak@scu.edu: open
  `https://docs.google.com/document/u/1/d/<id>/mobilebasic`, wait for the
  title, and read `document.body.innerText` in 950-character slices through
  the JavaScript tool (the tool truncates longer results, and blocks base64).
  `/u/1/` is the SCU account in his Chrome; `/u/0/` is Gmail; `/u/2/` is
  aishak@lgll.org. A fetch from the page to localhost hangs, and `export?
  format=txt` is 401 for a domain-shared Doc.
- Six Docs are locked to their owner, so even his SCU account gets an
  access-request page: Jameson Baldwin, Will Tortorella, Mailin Orozco,
  Gianna Alcaraz, Audrey Graham, Yoyo Yang. Chloe Shim turned in an Adobe
  Acrobat link. Their group-mates cannot read those seven either. Each of
  the seven got a note in their thread that afternoon (`scripts/send-note.mjs`)
  asking for a Google Doc shared to anyone at SCU, turned in again on the
  Sit-Down page.
- Tuesday evening, at his ask to "double check if any one has now submitted
  the work or allowed me to access it": Charles Kosinski's Doc came in at
  5:09 PM, was read the same way and folded in (16 read, 23 of 25 in; the
  scratch script was a one-off that edited the JSON and the sheet went up
  with `scripts/sitdown-sheet.mjs`). The six locked Docs were still locked
  under `/u/1/`; Chloe's link is still Adobe; Paul and Neel have nothing in.
  Check the same way before each meeting: `node scripts/sitdown-links.mjs`
  for new links, then each locked Doc's mobilebasic page for its title
  ("Access Denied" means still locked).
- The sheet page got its clearer layout that evening ("make it look clearer
  and deploy"): a filled band per group with its number, numbered parts
  inside (who is at the table, each person's work, questions by who they are
  for, their own questions), the question first and "From Luke, sports bar
  owner" under it, picks on the lighter ground with a filled check.
- 15 read that afternoon. The sheet's `overview` carries the read across the class and
  `roll` one line a person; each table has `focus`, and each person `status`
  (read, locked, not-a-doc, missing), `focus`, `relations`, and every
  question with `for` naming who the question is about and `ask` on the
  picks. Questions are exactly as written.
- When a locked Doc opens, read it the same way, add the person to the
  sheet, and run `scripts/sitdown-sheet.mjs --file private/comm118-sitdown-1.json --write`.
  No deploy is needed for a sheet change.

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
memory note on verbal grading and is a reasonable shape here.

His recalibration after the first two meetings, 2026-10-21: "they all did
fine, some better than others, and i don't know that we can assign too much
quality to what they said today. I wasn't really testing them. and I wont' do
that this week. I was going easy. For the next one, I expect them to be able
to answer questions from the material." Then: "you can evaluate to some
degree but my questions weren't tough enough to evaluate on topics. the
problem is I didn't test them on concepts." And: "i wasn't pushing them.
doesn't mean you can't evaluate quality to some degree, but i think they were
all in the B+ to A range." So the Sit-Down 1 read does evaluate quality, with
that ceiling in mind: explaining the job without reading from the page,
handling a question they did not write, building on what someone else said
or waiting for a turn, going past their own document. The read says nothing
about whether they know the concepts, because no question in the room asked
for one. No ranking across students; he sets the grade. Sit-Down 2 (week 8) is where the
questions test concepts from the course material, and the prep and the
instructor's question list for that one should be built to do that.

The transcript comes from `~/Projects/transcribe` (built 2026-10-21, its
README has the setup): `bin/transcribe run <memo>.m4a --speakers 5 --out
~/Projects/classes/private/sitdowns` writes a speaker-lettered transcript,
and `bin/transcribe names <stem>.json A=Andrew B="Luke Baird" ...` puts the
names on. Students say their names early but not every turn, so the letters
get names from content: Andrew is the one asking, and each student's job is
on the sheet. Speaker separation needs his Hugging Face token in
`~/Projects/transcribe/.env`; without one, `--no-diarize` still gives the
plain transcript. The recordings are audio voice memos, and the first two
(Wed Oct 21, 9:15 and 9:45) exist as of that afternoon.

Thursday Oct 22: the 9:45 meeting came as a pasted transcript, the voice
memo's own, with no speaker labels and no timestamps, so that table's
`meeting` on the sheet has `notes` and no `talk` chips (the page renders
without them), and the transcript is saved beside the others as
`private/sitdowns/thu-945.pasted.md`. The same morning seven more Scouting
Reports became readable and went on the sheet: Mailin's new Doc and Chloe's
Google Doc (Wednesday evening, after the deadline, in place of the locked
Doc and the Adobe link), Audrey's (Wednesday morning) and Neel's (Thursday
9:40 AM, after his group's sit-down started), and Gianna's, Jameson's and
Will's locked Docs, which opened without a new link. Yoyo's is still locked
and Paul has nothing in, so 23 of 25 are read. The Thursday 9:15 group (Jameson, Will, Neel, Katie) did not meet on
Oct 22: Andrew pushed that sit-down to Thursday, October 29 ("they were not
ready in my opinion"). The student page and `SITDOWN` in
`src/engine/worktopia/sitdown.js` still say October 22 for that group.

## Open

- Whether a student can replace a link after the deadline. The page lets
  them, marked with the time, and his view shows "after the deadline" in
  red.
- The words are Claude's draft around his sentences. He edits in place.
- Nothing tells a student the page exists except the Sit-Down 1 link in
  their class menu and the assignment he adds. A notice on the class home
  would help on Friday.
