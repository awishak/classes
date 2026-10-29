# Takeover

**A worksheet that is an 8-bit game. COMM 118, Communication and Sport,
Fall 2026, Weekly Challenge 3, due Tuesday, November 3.**

Built 2026-10-29 in a Claude Code session. This brief is the handoff: what
was decided, in Andrew's words where they are his, what is built, and what
is still open. The control page at `/comm118/worksheets/takeover?control`
states the mechanism from the engine itself; this file is the reasoning.

## What it is, plainly

A student is the new head coach. They pick a sport, pick a team name that
does not fit the place, and meet the team: their classmates as pixel
sprites, five of them dealt the parts that decide the season (the star, the
veteran, the rookie, the transfer, the quiet one). Six weeks. Each week
something happens, drawn from the concepts the student chose on the Concepts
in Team Communication sheet, and they spend capital on one of five things.
The ball goes back and forth, the team chat fills in, the match is won or
lost, culture moves. Then Andrew's prompt, with the student's own wonder on
that concept in the blank, two to four sentences and a source. Three polls
along the way. At the end, three questions, then hand in.

Andrew, 2026-10-29: "the idea will be similar to worktopia. you are taking
over a team and have to make sure the culture is good. so you have inputs,
but there is some randomness in what the NPCs do and how they react to what
you decide to focus on." And: "spending capital is like, you have a
difficult person. When you first come in, you don't have a lot of capital,
so you gotta focus ... motivating players to learn? Or getting wins quickly?
Or establishing dominance?"

## Where it lives

- Students: `/comm118/worksheets/takeover`, signed in with their email off
  the roster. **COMM 999 only until Andrew opens it** from the Worksheets
  page switch (`open: ["comm999"]` in `localWorksheets.js`).
- One student's file, for the instructor: `?s=<email>`.
- Every student, for the instructor: `?review`. Who is in, what the class
  spent, how the polls went, and each season read back whole.
- How it works, for the instructor: `?control`. Every rule, table, event
  and line read from the engine, and one student's season as the engine
  will deal it, with a simulator for any six spends. Andrew: "every single
  time we do a worksheet, I want like a control page, an instructor page
  that tells me exactly why everything's happening and exactly how
  everything is happening."
- The assignment: Weekly Challenge 3 on the COMM 118 plan row, retitled and
  pointed at the student address by `scripts/takeover-assignment.mjs`. It
  stays `opens: never` until he opens it on the dashboard.
- The words: every line a student reads is in `DEFAULT_COPY` (engine.js)
  and editable in place by the instructor through Edit the words at the top
  of the sheet, saved to the plan row `worksheet-takeover-plan`.

## The code

- `engine.js`: the season as pure functions. Banks of words, the hash, the
  deal, the plan, `resolve` for one week, `replay` for a file. No DOM.
- `pixel.js`: sprites, uniforms, the field, the match scene, a photograph
  reduced to sixteen pixels a side. Canvas, no React.
- `sound.js`: square waves. Blip, pick, coin, chat, win, lose, bounce,
  whistle, happy, sad, cheer, confirm.
- `game.jsx`: the screens, the saving, `SeasonLog` for reading a file back,
  `mountTakeover`.
- `review.jsx`, `control.jsx`: the instructor's two pages.
- `scripts/smoke.jsx`: every bank complete, every typed concept lands, every
  season for five names across three sports and six spend patterns runs
  with no week unaffordable, no number out of range, every result
  round-tripping through its packed row and resolving the same twice.
- `private/takeover-demo.html`: the game on a store that forgets, for
  looking at it without a sign-in (`npx vite`, then
  `/private/takeover-demo.html`). Not in the repo.

## Nothing is random

Every roll is `roll(...key)`: the hash of the student's name and the place
in the season, mixed (murmur3's finalizer, because the hash alone left keys
differing in one character a few bits apart, and one coach drew the same
opponent three weeks running). So a reload shows the same season, a resumed
file replays exactly, and the instructor's read is what the student saw.

What is saved, as worksheet rows (`worktopia/store.js`, through
`visualstory/saver.js` so nothing typed is lost): `sport`, `team`,
`concepts` (five ids with their sheet slots), `cast` (one part a line, so a
roster change later never reshuffles a season), then per week a to f
`prompt` (the wonder shown, so the file is whole), `spend`, `result` (packed,
saved the moment the spend is chosen, so later edits to the engine never
change a week already played), `reflect`, `source`; `poll` on b, d, f;
`final` a to c.

## The season, built

1. The student's five concepts are their topics sheet's slots a to e, matched
   to the chapter's twenty titles (`matchConcept` takes what they typed:
   Motivation, Team Chemistry, "Teamwork and coaching: positive feedback").
   A short or missing sheet fills from the class's most chosen on
   2026-10-29: goal setting, failure, motivation, cohesion, emotion, culture.
2. Weeks 1 to 5 are the five in sheet order. Week 6 is one of the five
   again, by the hash, with that concept's other event, and the prompt shows
   the student's opinion instead of their wonder: "You thought: ... After a
   season of this, do you still think so?" (Claude's variation on Andrew's
   prompt, so the same question is never asked twice.) Its poll is from
   another of the five if that concept's poll was already asked.
3. The team is picked from six of twenty-four names that do not fit the
   place. Andrew: "the New York Cowboys, or the Kansas Marlins." The other
   names are the opponents, six different ones a season.
4. Capital starts at 2, culture at 40. A week earns 1, a win 1 more. Teach
   and Set goals cost 1, Build cohesion and Win now 2, Establish dominance 3
   until culture reaches 55 and 2 from there, when it also stops cutting
   culture and turns the star and the veteran. The rest is on the control
   page.

## The words

Andrew's, word for word: the reflection prompt ("You wondered: [their
wonder]. Based on what you just saw and what you know, what do you think
now? Please write 2-4 sentences, and include at least one source, which can
be from our book, our readings, or somewhere else."). Everything else is
Claude's draft of 2026-10-29 for him to edit: the five spends and their
lines, the five parts and their blurbs, forty events, seventy-five chat
lines, twenty polls, twenty class wonders, twelve crowd signs, the three
final questions, and the screen copy.

The events and polls are built from what the class wrote on the topics
sheet. Where a student's wonder is quoted, it is quoted back only to that
student, from their own sheet. The class wonders are unattributed and
reworded.

## Still open

- The name. Andrew, 2026-10-29: "what is a team called? I don't know yet."
  `TAKEOVER_TITLE` and the assignment title are the working name.
- Opening it to COMM 118: the Worksheets page switch, and `opens` on the
  assignment card, both his.
- Every bank of words, his to edit.
- The dispositions land on real classmates' names. Kept playable and comic
  on purpose; the list is on the control page for him to read before it
  opens.
