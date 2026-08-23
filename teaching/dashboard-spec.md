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
- **Applies to any class.** Built into the engine, driven by config, like every other card.

## Stocking + AI planning

Before a session I stock a pool for the day or unit: candidate links, potential questions to ask, potential activities tied to an upcoming assignment. The app prompts for these.

Then AI proposes the session: given five articles, two points I want to make, two questions, and an assignment on the horizon, it returns how to spend the 50 minutes, structured around my named sequences (see [sequences.md](sequences.md)).

## Open

- Cast-only vs. drive-from-laptop for slide advance. Depends on whether the projector runs classroom view on a room machine or mirrors my laptop.
- Which animations. Mockups first, then pick.
- How students identify themselves for confidential questions.
