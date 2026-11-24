# Primary Bold: the mockups and the build

This is the brief for the redesign mockups of classes.andrewishak.com, worked through 2026-11-19 and 2026-11-20. Read it before touching the mockups or building from them. Nothing in the site is changed, and Andrew has not approved a build.

## Where the mockups are

The mockups are one page, published as a private artifact on Andrew's Claude account.

- Live page: https://claude.ai/artifact/FMbkvKf3KXo4F3GsdBkaUh. It opens on any machine signed in to his Claude account.
- Source: `primary-bold-mockups.html` in this folder, copied from the live page on 2026-11-24. A second copy sits in `private/cleanup-mockups/`, which git ignores.
- To change the live page from a new conversation, read the artifact first, then publish to the same address. Copy the result back into this folder.
- His page-by-page picks save to the artifact database, collection `answers3/<view>`, with the fields `choice`, `note` and `ground`. Read them there before asking him again.

## The name

Andrew, 2026-11-24: "let's call it Primary Bold". Primary Bold is the name of this look: the rules below, on any of the three grounds. Skylight is one of its grounds, not another name for the look. "Cleanup" was only the mockup page's title, and the published page still carries that title.

## The build (started 2026-11-24)

Andrew, 2026-11-24: "i want to work on it this week. so please build out the mockups and let me work on it more to release on nov 30." The first line of this brief is out of date on that point: a build is approved, and a release is not.

All nine pages are built in `src/engine/primarybold/`, on the site's own data.

- `mockup.css.js` is written by `scripts/primary-bold-style-from-mockup.mjs` from the mockup's stylesheet, with every rule put under `.pbold`. Do not edit the file. `style.js` adds what a real page needs after the mockup's rules.
- `bits.jsx` holds the pieces: `Face`, `Cell`, `Pill`, `Tile`, `Strip`, `Total`, `Timeline`, `Stamp`, and the three grounds.
- `data.js` turns the live site's states into the mockup's five, plus late. Every fact comes from the function the live page uses.
- `student.jsx` is Home, My work, Schedule, Class and Questions. `instructor.jsx` is Class home, To Grade, Grade Flow and Control.
- `Shell.jsx` stands where `portal/Shell.jsx` stands and takes the same props from `ClassApp`.
- `preview.js` is the switch. `ClassApp` draws the Primary Bold shell only for an instructor session with the preview on.

How he sees the pages: `?primarybold=1` on any class address turns the preview on in that browser, `?primarybold=0` turns the preview off, and The current site in the face menu does the same. View as a student shows the student pages. His three pages with no address on the class route sit after the `#`: `#to-grade`, `#grade-flow=<challenge id>`, `#control=<challenge id>`. A student who types `?primarybold=1` gets the site as it is.

To release on November 30: make the one test in `ClassApp.jsx` (`sessionInstructor && previewOn()`) true for everyone.

What is not the mockup yet:

- The Remind me buttons are left out. That question is still open below.
- Inbox, Games, More, Class flow and the instructor's Challenges list are the live pages inside a plain card.
- Editing a profile and See more on Dr. Ishak open the live site's sheets.
- A check-in is the live check-in form inside the challenge.
- A card's comment and private note are written on the live grading page. Comments and notes on Grade Flow opens that page.
- Control reads the class data only. It does not ask the server for worksheet rows, so Started is never shown and a sheet resubmitted after a review is not flagged.
- The class home's Write a note and Room screen buttons are left out, and so is Copy review link on Control.
- The old top bar's sign out and view-as menu are not in the Primary Bold bar. The preview bar still shows while viewing as a student.

What was checked: `npm run build` passes, with a smoke section that renders eight of the pages. Every page but To Grade was seen as a picture on made-up data (`private/primary-bold/demo.html`, not in the repo): Home, My work at laptop and phone width, Schedule on Night, Class, Questions on Light, Class home, Grade Flow on Night, and Control. Not seen: To Grade with rows on the page (the demo found nothing to grade), a picked classmate on Class, and every page on a real class with a real sign-in. Nothing was clicked, so no write was tried: sending a message, placing a card, releasing grades, I'll be there, asking a question.

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
