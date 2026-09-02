# Improvement list

Running backlog for teaching flow, class administration, and the LMS software. Add freely. Groom when it gets noisy.

Tag each item with one area so it stays skimmable:
- `[flow]` — how I run the room / pace a class / structure a session
- `[admin]` — grading, attendance, logistics, communication
- `[software]` — the LMS app itself (Comm 118 / Comm 2 / Comm 4)

---

## Open

- `[software]` **Roster filter for a class with two sections.** COMM 3 meets twice on the same day and stays one class rather than two. A student belongs to a section, and the surfaces made of people filter down to the section sitting in the room: the roster, attendance, discussion boards, groups. Everything else stays single, so changing a day plan, an assignment or a block once gives both sections the change. Decided 2026-09-02, not built.

### Fall 2026 LMS rebuild

Framing: design around two audiences. **Student-facing** (what students need and how they get it) and **instructor-facing, you only** (how you put information in, and how you grade). Catalog everything now; build incrementally.

Submission baseline: students submit **links** today and you see them in the LMS. Usually a Google Doc, sometimes a video, sometimes a collection of things.

- `[software]` `[flow]` **Instructor day-planning view.** Open the LMS for a given class day and see that day's lesson plan: what you decided to do, the slides to use, the links you need, walked through as a flow. If a day isn't planned, surface **candidate seeds from your repository** that fit the day's topic and slot. Example: topic is "how to open a speech," no opener slotted, so it suggests the storytelling seed and the "you language" seed for the `opener` slot. This is the [seeds](seeds.md) / [sequences](sequences.md) engine turned into a real planning surface.
- `[admin]` `[software]` **Fast grading flow.** Student work (a submitted link: Google Doc, video, or collection) is presented to you. Enter grade and comments with low friction, click submit, auto-advance to the next submission. One at a time, no clicking around.
- `[software]` `[admin]` **Instructor-only student page.** Roster of names; click a name to see that student: photo, where they're from, their goals for the class (from the first-day seed), and all assignments, grades, and every comment across the quarter. Private to instructor, never shown to students.

#### Student-facing home page

- `[software]` **Top nav bar:** Home, Schedule, Assignments, Community, More. **More** holds Roster, Readings, and others TBD.
- `[software]` **Card grid + detail pattern.** Home is a grid of cards; each card is a summary with an **(open)** that loads the full page on the right side. Every class ships **all** cards; the instructor admin page toggles cards off per class (e.g. "do not include Leaderboard"):
  - **You:** student photo, current grade, and a two-way dialogue with the instructor. Instructor posts notes; student can reply with a comment or buttons: "Got it," "I'm confused," "Make a meeting" (links to a scheduling link). Plus an "I don't understand something" box for questions the instructor clarifies in class.
  - **Assignments:** next assignment with due date and link to its info page; most recently graded assignment shown for **7 days only**, with a link to instructor comments if any.
  - **Schedule:** next 7 days of classes with readings and assignments due; clicking a reading opens it directly.
  - **Community:** anything currently live: in-class games, discussion boards, other in-class activities.
  - **Leaderboard:** to the in-class game leaderboard.
  - **Roster.**
  - **Your Instructor:** keep current content.

#### Instructor view of the home page (you only)

- `[software]` `[admin]` **Same cards, same order, instructor-shaped content.** Mirror of the student home where each card surfaces what you need to act on:
  - **You:** every message any student has written (an inbox).
  - **Assignments:** everything you have to grade, plus nudges ("this is due soon, you still need to post instructions").
  - (apply the same "what do I need to do" logic to the rest.)

#### Architecture: shared-source rebuild + template class

- `[software]` **One source of truth for all classes (config-driven, "1b").** One shared app renders **any** class from a **config object** (schedule, assignments, roster, theme, which cards are enabled, content). CSS and all logic live in common files; a class is data, not code. Update once, every class updates. Today classes are forked (`Comm118/Comm2/Comm4`, per-class game + grades files); that goes away.
- `[software]` **All components everywhere, toggled by admin.** Every class includes every component; the instructor admin page enables/disables them per class (e.g. turn off Leaderboard). No per-class forks of features.
- `[software]` **COMM 999 template.** Build a `COMM 999` off the current COMM 118 as the canonical Fall 2026 template. Build it on top of the shared engine so it proves the shared model works (not another fork).

## Doing

## Done
