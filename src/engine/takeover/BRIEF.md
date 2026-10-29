# Takeover

**A worksheet that is an 8-bit game. COMM 118, Communication and Sport,
Fall 2026, Weekly Challenge 3, due Tuesday, November 3.**

Built 2026-10-29 in a Claude Code session, rebuilt the same afternoon on
Andrew's second pass. This brief is the handoff: what was decided, in his
words where they are his, what is built, and what is still open. The
control page at `/comm118/worksheets/takeover?control` states the mechanism
from the engine itself; this file is the reasoning.

## What it is, plainly

A student is the new head coach. They pick a sport, pick a team name that
does not fit the place, and meet the team: their classmates as pixel
sprites in the team's jersey, five of them dealt the parts that decide the
season (the star, the veteran, the rookie, the transfer, the quiet one). A
card says how it works. Six weeks. Each week something happens, drawn from
the concepts the student chose on the Concepts in Team Communication
sheet, and they choose one of three or four things to do about it, each
priced in coins. The ball goes back and forth, the team chat fills in, the
match is won or lost, and the three bars move. Then Andrew's prompt, with
the student's own wonder on that concept in the blank, two to four
sentences and a source. Three polls along the way. At the end, three
questions, then hand in. Every page has a back button.

Andrew, 2026-10-29, first pass: "you are taking over a team and have to
make sure the culture is good. so you have inputs, but there is some
randomness in what the NPCs do and how they react to what you decide to
focus on." Second pass: "Culture. Skills and strategy, and then success ...
those numbers are from 0 to 100. They should start in different places,
anywhere between 35 and 65 ... the higher those numbers are, the more
likely you are to win games ... you should start with five things of
capital ... If a player gives you a plus after the game, you get one of
the pieces of capital back. If a player gives you an equal sign, you get
half of it back. And if a player gives you a minus sign, you lose that
capital ... You can't give people the same options every round ... after
the first one, it should be in response to a thing."

## Where it lives

- Students: `/comm118/worksheets/takeover`, signed in with their email off
  the roster. **COMM 999 only until Andrew opens it** from the Worksheets
  page switch (`open: ["comm999"]` in `localWorksheets.js`).
- One student's file, for the instructor: `?s=<email>`.
- Every student, for the instructor: `?review`. Who is in, what kinds of
  action the class chose, how the polls went, and each season read back.
- How it works, for the instructor: `?control`. Every rule, every
  situation with its options and the research under each, every chat line,
  and one student's season as the engine will deal it, with a simulator for
  any six choices. Andrew: "every single time we do a worksheet, I want
  like a control page, an instructor page that tells me exactly why
  everything's happening and exactly how everything is happening."
- The assignment: Weekly Challenge 3 on the COMM 118 plan row, retitled and
  pointed at the student address by `scripts/takeover-assignment.mjs`. It
  stays `opens: never` until he opens it on the dashboard.
- The words: every line a student reads is in `DEFAULT_COPY` (engine.js)
  and editable in place by the instructor through Edit the words at the top
  of the sheet, saved to the plan row `worksheet-takeover-plan`.

## The code

- `engine.js`: the season as pure functions. The banks, the hash, the
  deal, the plan, `resolve` for one week, `replay` for a file. No DOM.
- `pixel.js`: sprites, uniforms, the field, the match scene, a photograph
  reduced to sixteen pixels a side. Canvas, no React.
- `sound.js`: square waves. Blip, pick, coin, chat, win, lose, bounce,
  whistle, happy, sad, cheer, confirm.
- `game.jsx`: the screens, the saving, `SeasonLog` for reading a file back,
  `mountTakeover`.
- `review.jsx`, `control.jsx`: the instructor's two pages.
- `scripts/smoke.jsx`: every bank complete, every typed concept lands, every
  season for five names across three sports and six choice patterns runs
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
`prompt` (the wonder shown, so the file is whole), `choice`, `result`
(packed, saved the moment the choice is made, so later edits to the engine
never change a week already played), `reflect`, `source`; `poll` on b, d,
f; `final` a to c.

## The season, built

1. The student's five concepts are their topics sheet's slots a to e, matched
   to the chapter's twenty titles (`matchConcept` takes what they typed:
   Motivation, Team Chemistry, "Teamwork and coaching: positive feedback").
   A short or missing sheet fills from the class's most chosen on
   2026-10-29: goal setting, failure, motivation, cohesion, emotion, culture.
2. Week 1 is the opener (keep things the same, team dinner, practice more,
   set standards) with the first concept's question. Weeks 2 to 5 are the
   next four concepts' situations, each a thing that happened to one of the
   five players, with three or four answers priced 0 to 3. Week 6 is the
   finale: a bench player is hurt before the final road trip, and the dear
   option (4 coins) is to bring them anyway. Andrew's example.
3. Every situation has one free option. Each option names who is up and who
   is down. The research the situation is built from, and whose sheet
   raised the question where the class did, is on the control page.
4. The prompt is Andrew's line with the student's own wonder in the blank.
   Week 6 shows their opinion instead and asks whether they still think so
   (Claude's variation, so the same question is never asked twice). Its
   poll comes from another of the five if that concept's poll was asked.
5. The team is picked from six of thirty-six names that do not fit the
   place. Andrew: "the New York Cowboys, or the Kansas Marlins." The other
   names are the opponents, six different ones a season.

## The numbers

Culture and skills start between 35 and 65, each by the hash. Success
starts halfway between. Capital starts at 5. Culture after a week is
culture plus the option's number plus a swing (−2 one week in ten, −1 two
in ten, 0 four in ten, +1 two in ten, +2 one in ten); skills likewise with
a nudge of −1, 0 or +1. Chance of winning = 0.08 + 0.84 × (culture +
skills) / 200 + 0.05 × the option's win number, between 5% and 95%. A win
moves success +8, a loss −6. Each of the five players reacts: up returns 1
coin, flat half, down none. A player is up or down when the option lists
them, flat otherwise, and one week in ten swings a step of their own.

## The words

Andrew's, word for word: the reflection prompt ("You wrote: [their
wonder]. Based on your experiences and what you know, how would you answer
that question? Please write 2-4 sentences, and include at least one
source, which can be from our book, our readings, or somewhere else."), the
rule for coins, the three numbers, the finale's injured player. Everything
else is Claude's draft of 2026-10-29 for him to edit: the explainer card,
the five parts and their blurbs, 22 situations and their 87 options with
the research notes, 75 chat lines, 20 polls, 20 class wonders, 12 crowd
signs, the three final questions, and the screen copy.

The situations and polls are built from what the class wrote on the topics
sheet. Where a student's wonder is quoted, it is quoted back only to that
student, from their own sheet. The class wonders are unattributed and
reworded.

## Still open

- The name. Andrew, 2026-10-29: "what is a team called? I don't know yet."
  `TAKEOVER_TITLE` and the assignment title are the working name.
- Opening it to COMM 118: the Worksheets page switch, and `opens` on the
  assignment card, both his.
- Every bank of words, his to edit. The research notes on the control page
  name students by first name from their sheets; the game itself never
  shows one student's words to another.
- The parts land on real classmates' names. Kept playable and comic on
  purpose; the list is on the control page for him to read before it
  opens.
