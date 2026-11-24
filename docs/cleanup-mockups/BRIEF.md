# Classes cleanup mockups

This is the brief for the redesign mockups of classes.andrewishak.com, worked through 2026-11-19 and 2026-11-20. Read it before touching the mockups or building from them. Nothing in the site is changed, and Andrew has not approved a build.

## Where the mockups are

The mockups are one page, published as a private artifact on Andrew's Claude account.

- Live page: https://claude.ai/artifact/FMbkvKf3KXo4F3GsdBkaUh. It opens on any machine signed in to his Claude account.
- Source: `classes-cleanup-mockups.html` in this folder, copied from the live page on 2026-11-24. A second copy sits in `private/cleanup-mockups/`, which git ignores.
- To change the live page from a new conversation, read the artifact first, then publish to the same address. Copy the result back into this folder.
- His page-by-page picks save to the artifact database, collection `answers3/<view>`, with the fields `choice`, `note` and `ground`. Read them there before asking him again.

## Pages drawn

The page has nine mockups and two switches.

- Students: Home, My work, Schedule, Class, Questions. A graded challenge is folded into My work.
- Instructor: Class home, To Grade, Grade Flow, Control.
- Switches: Skylight, Night or Light colors, and Desktop or Phone.

## Rules he settled on

The rules apply to every page, so nothing gets "Frankensteined" (his word). Change the rule, never one page.

- Skylight colors on a light ground: seaglass is done, gold is to do, coral is late, sky is COMM 118. Fraunces titles, Outfit body.
- Three text styles, nothing under 14px. No emojis. Checks are drawn.
- Selected means a dark outline and the rest fades. No shadows, glow, growing or "3D".
- A click changes only what was clicked and its panel. Bars do not replay.
- Bars are one solid full bar, with no gaps or outlined pieces. He disliked the per-student dots on To Grade.
- Circles are people, blocks are challenges, pills are buttons. The top bar title is plain text, with no "118" block.
- My work is a narrow list on the left (block, title, due date, no percentages) and the whole challenge on the right (grade, his comment, dates on a line, buttons, write box, then full instructions). On a phone the challenge takes the screen with "Back to My work".
- Once something is graded, students are ordered by grade, highest to lowest, with ties by name. This is done on Control.
- Late and resubmitted stay hidden until a button is pressed.
- He likes Grade Flow, Control, the timeline of dates, and the week row on Schedule with "I'll be there" buttons.

## Open on his side

These questions were asked and not answered.

1. Do reminders on a to-do challenge (Tonight, Tomorrow morning, The day before it is due) show on Home now, or wait for email?
2. Which student page is next: a worksheet page, the check-in, cards he sends, or final project teams?
3. What else goes on Class home? Offered: faces of who has not turned in the next thing due, and unread Inbox as faces.
4. Do worksheets and games open inside My work or on their own page?
5. On 2026-11-20 he said he likes "the current grade page for me as a dashboard". Which page is that, and what does it replace?

## Stand-ins in the mockups

Some of what the mockups show is made up and must not be built as is.

- Class days were assumed to be Mon, Wed, Fri.
- The question texts on Questions are placeholders Claude wrote.
- Student names are placeholders. Grey lines stand in for his instructions, notes and answers.
- The turned-in and graded dates are mock dates, except on Culture Guide.

## Live-site bugs seen on the way

These were noticed while drawing the mockups and were not fixed.

- Home said "Nothing is waiting on you" while Turkey Bowl was due. This was not verified for a real login.
- The grade letter overlaps the "Graded" line on a graded challenge.
- The Grades bar has about fourteen links and still lists Worksheets.
- The class home shows an empty Pinned box and blank bars under Note to students.

## Uncommitted work that is not part of this

The repo had uncommitted changes on this machine before the mockups started, and they are still only on this machine: edits in `src/engine/GradeView.jsx`, `src/engine/grades.js` and `scripts/smoke.jsx`, nine screenshots from 2026-11-15 in the repo root, and three untracked scripts in `scripts/`. Ask Andrew what they are before committing or discarding any of them.
