# Dashboard + Classroom View

Spec for the two new instructor surfaces in the LMS engine. Decisions captured from planning conversations; open items at the bottom.

## The idea

**Dashboard** is the first thing I open when I teach. It sits on my laptop in class. It holds everything I need to run that session so there is never a "what am I doing today?" moment.

**Classroom view** is a separate unlisted URL, one per class, that lives on the projector and can also be opened remotely. I click something on the dashboard and it appears there, animated, so students see it.

## Settled

- **Dashboard is its own mode.** Not the instructor home. Separate surface you enter to run a session.
- **Classroom view is one persistent URL per class.** Not disposable per session. Unlisted; for now anyone with the link can open it.
- **Idle state** (nothing cast): link to the class homepage, a QR code, and a link to ask a question.
- **No raw .pptx.** Decks live as Canva, Google, or PDF links.
- **Cast targets come from the Day Plan's existing items and links**, plus a stocking step (below).
- **Animations vary by weight.** Basic animation for routine content; something bigger for an assignment reveal.
- **Questions are confidential, not anonymous** by default, with a student-side button to go anonymous. Instructor can push a question back to the classroom screen to answer in front of everyone.
- **Attendance is instructor-taken.** No student self check-in.
- **Panels are drag-and-arrange on a real grid.** Not fixed slots with on/off toggles. Drop things where I want them.
- **Applies to any class.** Everything here is engine code driven by a config object. Nothing is COMM 118 specific; a new class is a new config file.
- **Every cast can be taken down.** Clicking a live row takes it back down (the unreveal), and the monitor has Idle, Black screen, and Take it down.
- **Pre-class and post-class boards are always hand-driven.** The app proposes lines from the schedule; I edit them; I decide when they go up.
- **Stocking is per week**, not per day.
- **Students sign in with the existing accounts** — pick your name, enter your PIN (data.pins).
- **The current beat is for me only.** It does not go to the room screen.

## Stocking + AI planning

Before a session I stock a pool for the day or unit: candidate links, potential questions to ask, potential activities tied to an upcoming assignment. The app prompts for these.

Then AI proposes the session: given five articles, two points I want to make, two questions, and an assignment on the horizon, it returns how to spend the 50 minutes, structured around my named sequences (see [sequences.md](sequences.md)).

## Settled since

There is a room machine at the podium, so classroom view runs there. Split for
slide control: **things we render ourselves** (title cards, reveals, questions,
boards) are driven from the dashboard; **third-party embeds** (Canva, YouTube,
websites) are cast and then driven on the room machine, because we cannot reach
inside someone else's frame.

## Built on the evidence

- **Live poll (Peer Instruction).** Ask, commit alone, argue, commit again, show what moved. Both rounds on the room screen, the first behind the second. Aim for a question a third to two thirds get right first time.
- **Claims, not titles.** Nothing casts without one full sentence. "Rights fees have increased 45% over the last 10 years," not "Media rights." Written once, stored on the item.
- **Time since they did anything.** Replaces the countdown to the bell. Resets on a poll, a pushed question, or an Around the Horn point. Amber at ten minutes.
- **No bullets, ever.** The before/after boards hold ideas, one per screen, stepped through by hand.
- **Around the Horn.** The seating chart as a popup over the dashboard. Drag to match the real room, tap to award points into the in-class bucket.

## Open

- Which animations to keep. Five everyday, two reveals, all live to compare.
- The AI planner. Deliberately not started — this needs more work first.
- Whether /comm118 itself should move onto the engine.
