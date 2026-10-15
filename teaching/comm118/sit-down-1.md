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
The Monday before the first sit-down is October 19, and the page says the
19th. If he meant Sunday night, change `SITDOWN.prepDue` and `release` in
`src/engine/worktopia/sitdown.js` and the two dates in
`src/engine/worktopia/sitdownWords.js`.

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

## Where things live

- **The student page**: `/comm118/sitdown`, `src/engine/SitdownPage.jsx`.
  Signed in by email. Their time and room, their table with roles, the three
  steps, the prep with a prompt per table-mate, the box for the Google Doc
  link, and the table's documents once the prep is due. A student off the
  tables sees the words and "You're not at a table yet."
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
2. Add the assignment on the dashboard: "Sit-Down 1 prep" (or his title), due
   Oct 19, 11:59 PM, with its Details link set to
   `https://classes.andrewishak.com/comm118/sitdown`. Without the assignment
   the page still takes links and keeps them; with the assignment they land
   on My Work and Grade view too.
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

- The date, above.
- Whether a student can replace a link after the deadline. The page lets
  them, marked with the time, and his view shows "after the deadline" in
  red.
- The words are Claude's draft around his sentences. He edits in place.
- Nothing tells a student the page exists except the Sit-Down 1 link in
  their class menu and the assignment he adds. A notice on the class home
  would help on Friday.
