# Testing a game before you run one

Twenty minutes, on your own, with a laptop and your phone. Do this once before
the first game of the term and once after any change to the game system.

The thing being tested is not whether the screens draw. The build checks that on
every commit. The thing being tested is **two devices writing at the same time**,
which is where the room lost its answers last term.

## What you need

- A laptop, signed in as instructor
- Your phone, on the same class
- One more device if you can get one, or a second browser in a private window,
  so there are two students rather than one

## Set it up

1. Laptop: open `classes.andrewishak.com/comm118/rungame`.
2. Make a game for a week you are not using. Three questions is enough. Write
   the questions or take them off the question bank.
3. Do **not** go live yet.

## The one that matters

4. Phone: open `classes.andrewishak.com/comm118/game` and pick a name off the
   roster. Second device: same, different name.
5. Laptop: go live.
6. Both phones should land on Q1 without being reloaded. **If a phone needs a
   reload, stop and say so.** That is the realtime channel, not the game.
7. Phone one: tap an answer. One tap. The option should fill in and the screen
   should say Locked in.
8. Phone two: tap a different answer.
9. **Laptop: press next question.** This is the exact moment the room used to
   lose its answers.
10. Laptop: go back and look at Q1. **Both answers must still be there.** If
    either is missing, stop. That is the bug returning.

## The rest of it

11. Phone one: go back to Q1 if the question is still open and tap a different
    option. The answer should change, and phone two's answer should not.
12. Laptop: run the questions out, lock them, and score the week.
13. Laptop: check the log. Both students should have points, and the numbers
    should match what they actually got right.
14. **Score the week a second time.** Nothing should double. Nobody should gain
    or lose points.
15. Phone one: reopen the week and change an answer. Score again. That student's
    points should move; the other student's should not; neither entry should be
    duplicated.

## Team Trivia

Trivia is the half with the least behind it. Its rounds and reveals are still
inside click handlers with no test, so give it the same treatment:

16. Make a trivia game, put two students on two teams, go live.
17. Open the presenter window from the laptop. The address is
    `/comm118?game=<gameId>&class=comm118`.
18. Have both teams answer the same round, then reveal. Both answers must show.
19. Advance a round while a team is typing, then have that team submit. Their
    answer should land, and the other team's should still be there.

## If something goes wrong

Write down which step, which device, and what you saw. Step numbers are enough
to find the code. Steps 9, 10 and 19 are the race; steps 13 to 15 are the
scoring; step 6 is the realtime channel.
