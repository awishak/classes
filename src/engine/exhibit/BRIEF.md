# The final project builder: the brief

Read this before touching anything in `src/engine/exhibit` or `api/exhibit.js`.
It is written so a session on any machine can pick the work up cold. Last
brought up to date 2026-11-23.

## What this is

Andrew, 2026-11-23: "for both my comm 3 and comm 118 classes, we have to build
a website builder ... Most importantly, it should just be pretty on its face."
The final project in COMM 3 and COMM 118 is one of three things:

- an **exhibit**, built on the site ("It's like a museum exhibit": a front
  page, then pages behind it, or one long scroll),
- a **film**, one linked video,
- the student's **own HTML** file, hosted here.

Every one of them carries a headline, a summary and sources.

## Where it stands

Live on main since 2026-11-23. Open to COMM 999 only. A Claude session can
push once Andrew says to (he said so on 2026-11-24, and `git push origin
HEAD:main` went through). If a push is ever blocked, hand him:

    git -C ~/Projects/classes push ssh://git@ssh.github.com:443/awishak/classes.git HEAD:main

Addresses:

| Address | What |
| --- | --- |
| `/<class>/worksheets/final-project` | the builder (a student's own project; Andrew gets a project of his own, marked `staff`, never in the gallery) |
| `/<class>/worksheets/final-project?review` | every project: outline, checklist, words, Release, Reopen for a day |
| `/<class>/worksheets/final-project?control` | how every rule works, in sentences |
| `/<class>/exhibits` | the class gallery, empty until Release |
| `/<class>/exhibits/<id>-<headline>` | one project; `?preview=<token>` opens a draft and takes notes |
| `/<class>/exhibits/sample` | the sample exhibit |

## The files

- `model.js`: plain JS, no React. Block list, `emptyDoc`, the checklist for
  each class, `mergeDocs` (two partners' saves), `lockedAt`, link parsing for
  video and embeds, `safeUrl`. The server imports this file too.
- `reader.jsx`: the page a visitor sees, and the builder's live preview. All
  of the design is its `CSS` string, scoped under `.xr`, with `data-pal` and
  `data-type` choosing the palette and the type style. Type is sized in `cqi`
  (the reader's own width), so a narrow pane reads like a phone. The builder
  passes `still` to turn the motion off.
- `builder.jsx`: the builder, `.xb`. Steps: Outline, Build, Sources, Look,
  Checklist, Share.
- `pages.jsx`: `ExhibitPage` (one project, notes on a preview link),
  `GalleryPage`, `ExhibitReview`, `ExhibitControl`.
- `client.js`: the calls to the route, and the upload.
- `sample.js`: the sample exhibit. Its photos are in `public/exhibits/sample`.
- `api/exhibit.js`: the only thing that reads or writes a project.

## The look, second pass (2026-11-23, later the same day)

Andrew: "make it look way better." What changed, and the rule behind each:

- **The builder, the gallery, the review and the control page are the class
  site's look now**, not a dark and yellow one of their own. The builder's
  `CSS` reads the theme's variables (paper, cards, greys, state colours), Lora
  for a title, Outfit for the rest, 16 of rounding on a card and 12 on anything
  pressed. `--xa` is the class's own accent from its config. The review and
  control pages are `Shell` with `Sec`, `Row`, `Btn` and `Chip` from
  `portal/bits.jsx`; a project row is green when its checklist is done and
  amber while the outline is not.
- **No small caps and no type under 13px in the builder.** The checklist's two
  big numbers became one sentence.
- **The reader is larger.** Body 22px (news) or 20px, a 740px column, captions
  15.5px with the credit on a line of its own. The number, the timeline and the
  quiz each sit on a wash panel; the audio clip has a drawn wave that fills as
  the clip plays; a heading opens on a rule. The first pass's rules are still
  in the stylesheet and the second pass sits after them, before the phone rules.
- **The gallery** puts a topic area's name beside its cards.

Seen as pictures only, in headless Chrome: all four sample pages, a phone
width, the builder's Outline, Build, Look and Checklist steps, the gallery,
the review. Not seen: night mode, the film and own-HTML pages, the control
page, the note box on a preview link.

## The order things open in (2026-11-24)

Andrew: "i don't want students to see the full builder yet. i haven't even
given them teams or topics approved. so the first step is for me to do that."
Three rules came out of that, all his picks:

- **No project until the decisions are released.** `?mine=1` answers
  `{ waiting: true }` to a student while `<class>-final-prefs.json` is not
  `released`, and a save is refused. The builder shows one line. He is never
  held back, and a practice class (no decisions file) is always open.
- **The approved topics come with the project.** The route sends `topics`,
  every topic approved for the team (a pair's four at most), read the way
  `api/final-project.js` reads them. The outline lists them; the team picks
  one and can write under it: "show all and allow a 'modification' write in".
  The pick is `doc.topic = { key, text, change }`, kept out of the public file.
  A student with none approved gets the write-in box alone.
- **The outline is the whole builder until he marks it complete**, "for each
  team once complete". Mark outline complete is a chip on each row of
  `?review`; the marks are `outlines` in `_state.json`; the route sends `full`.
  The builder asks again every 20 seconds while it is outline-only, so the
  other steps appear without a reload. The steps are hidden in the browser
  only: the server does not refuse a save that carries blocks.

Two more from the same day. The step is called **Pre-production** wherever a
person reads it, the word on the plan; the code still says `outline`. And
pre-production counts as done only with a topic picked or written in, beside
the headline, the summary and a plan on every page.

Not done: the mark does not write a grade on the plan row. Nothing here was
run against the live store; it was seen on the demo page (`&waiting=1`,
`&stage=outline`, `&topics=0`, and `v=review&marked=1`). Existing COMM 999
practice projects are outline-only until marked.

## How it is stored

No SQL was needed, and none should be added without a reason: files in
`classes/sql` are not migrations and have to be run by hand.

- One project is one JSON file, `exhibits/<class>/<id>.json`, in the private
  `instructor` bucket. Notes from readers are `<id>.notes.json` beside it.
  Release and reopenings are `exhibits/<class>/_state.json`.
- `<id>` is a hash of the class and the makers' emails. Who is a pair comes
  from `<class>-final-prefs.json`, the file the preferences review writes. If
  two students are paired after one started, the pair's file begins as the
  fuller of their two.
- Images, audio and HTML go to the public `notes` bucket under `exhibits/`, on
  an upload link the route signs. The bucket does not take `text/html`, so an
  HTML file goes up as `text/plain` and the reader runs the text inside a
  sandboxed `srcdoc` frame with no same-origin access.
- A save sends the whole file. The server merges the incoming file with what
  is stored: the newer copy of each page, block and source wins (`at` on each),
  a deleted thing stays deleted (`gone`), and each top-level field goes to
  whoever changed the field last (`doc.at`).

## The rules, and the answer of Andrew's that set each one

He answered 78 questions on 2026-11-23. In his words where quoted.

**Dates.** Builder opens Monday, November 30. The outline is the builder's
first step, graded Complete or Not quite, due Thursday, December 3, at 11:59
PM ("let's make pre-pro due thursday not friday"). Everything is due "Thursday
at 12 pm Dec 10", both classes, and "locks at noon". Both plan rows carry
these dates already (`scripts/final-due-dec10.mjs`, `final-pre-dec3.mjs`,
`comm118-final-pre.mjs`).

**No hand-in.** The builder saves as they type and the deadline takes whatever
is there. A student can switch between exhibit, film and own HTML any time
before the deadline.

**Pairs.** One shared exhibit, either partner edits. Who did what goes in a
box only he sees.

**The look.** Each student chooses pages or one scroll. Three type styles to
pick from ("give them each of these three options": news feature, museum
signage, magazine) and five palettes, all light, the same in both classes; the
two picks are separate. A cover image under the headline. Page names across
the top and a next link at the bottom; on a scroll, a chapter bar that follows.
Up to six pages. Text takes bold, italic and links.

**Sources.** Entered one at a time in fields, tagged academic or popular
press. No small citation numbers: "more of a fan of when they click on a link
(which is text), it expands or pops up the source." Every link inside a
paragraph is a source ("those are all source links"); any other link is a link
card. The popup shows the citation, a link out, and the student's note.

**Photos.** Any image with a credit. A credit and a description are required
on every image. Sizes: column, full width, two side by side, and beside text.
The site shrinks a big photo on upload.

**Sound and video.** Video by link only (YouTube, Vimeo, Drive). TikTok,
Instagram, Datawrapper and Canva play inside the page. A transcript is
required on every audio clip. A film has no length limit and needs captions.

**The extra blocks.** All six: photo gallery, timeline, big number, before and
after slider, map (a real map, OpenStreetMap), quiz. A quiz saves nothing.

**The checklist.** A student sees it; it never blocks anything; it shows a
word count with no minimum.
- COMM 3: an audio clip, an interview, images or video, "5 sources minimum",
  "at least 2 academic sources".
- COMM 118: 5 academic and 5 popular press sources, three concepts, "at least
  one audio clip. at least 10 graphics or images or videos or interactive
  things". Every image counts toward the ten, so a gallery of four is four.
  Audio does not count.

**The public.** Full names on the public page. Nobody opts out of the
gallery. Nothing is public until he presses Release, one button a class. A
gallery per class; each card is the cover, headline, names and summary;
grouped by topic area and shuffled inside a group. The gallery keeps past
terms (not built). "students will disclose in what way they used AI to assist
them in their work", as a line on the public page. Exhibits move to
clarisa.app later, "not important now".

**Reviews.** A private preview link. Anyone holding the link can leave a note
on any block; nobody is required to; only the makers and he read the notes.
No presenting view. One comment an exhibit when he grades.

**Own HTML.** One .html file.

**The builder.** Laptop for building. Undo for a deleted block or page.

## The sample

`/<class>/exhibits/sample`, on "timeouts as a form of reorientation" (his
topic, in place of the female referees example). Every sentence is Claude's
stand-in for him to rewrite. The photographs are real, from Wikimedia Commons;
each caption says only what the photographer's own description says, and each
credit names the photographer and the license. The two academic sources are
stand-ins and say "Sample source" in their titles. The AI line on the sample
says plainly that Claude wrote the sample, after he caught the first version
claiming otherwise.

He called the first sample "not great" without saying why. The rebuild around
real photographs and a photo cover was a guess. His reaction to the rebuild is
not known.

## Open, and owed

- **The concept block.** He said a ready-made one could be "good, but also
  limiting and boring". What is built is a definition card (concept,
  definition, source) with the examples left to ordinary blocks. COMM 118 only;
  hidden in COMM 3. He has not said yes or no.
- **A COMM 3 sample.** He wants a second sample for COMM 3; "leave comm 3
  sample topic out for now".
- **Opening it.** Still COMM 999 only. To open: set
  `worksheetsOpen["final-project"]` on each plan row to a time (Monday,
  November 30), and set `instructionsUrl` on the `final-pre` and `final`
  challenges to `/<class>/worksheets/final-project`. Write a plan-row script
  the way `scripts/final-due-dec10.mjs` does.
- **Not built:** his "Edit the words" on the builder's labels; a shelf for
  past terms in the gallery; a set list of topic areas (the student types
  one); a video in the sample.
- **The builder's words are Claude's.** Every label, the four layout names
  (An opening, A case study, By the numbers, Listen and look), the tip under
  the text box and the sentences on `?control` are his to rewrite.
- **Not tried by hand in a browser:** an upload of any kind, drag to reorder,
  the film and own-HTML pages, the gallery with real cards, leaving a note on
  a preview link, phone widths, two partners editing at once. The motion in
  the reader has only been seen as still pictures.
- **One report from him, not reproduced:** "i can't go back on the 'build'
  tab". The Build tab opened and Back worked when Claude tried the live
  builder. The fix made was a Close button on the block chooser, which had no
  way back once open. Ask him what he clicked if the report comes up again.

## How to check a change

- `npm run build` has to pass: the checks, the smoke run, the bundle. Never
  pipe the build into grep before committing.
- `node private/exhibit-builder/api-test.mjs` runs the route against the live
  store as two COMM 999 practice students and removes what the run made. It
  needs `.env.local`. The file is under `private/`, which is not in the repo,
  so on a new machine the test has to be written again from the route's
  header comment.
- To look at the builder without signing in, mount `mountExhibit` in a page
  that answers `/api/exhibit` itself. `private/exhibit-builder/demo.html` does
  this on both machines (each wrote its own; `private/` is not in the repo).
  On the second machine: `node_modules/.bin/vite --port 5199`, then
  `private/exhibit-builder/shot.sh <name> "v=builder&click=Look"` takes a
  picture. `v` is sample, builder, gallery, review, control or film.
- Headless Chrome takes the pictures:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=out.png --window-size=1440,1000 <address>`.
  It will not go narrower than about 500 px.
- After a push, wait about a minute and a half for Vercel, then open the live
  page before saying anything is live.

## How Andrew wants the work done

Short turns. Present the plan before code when the request is new; when he
says "keep going", build. Questions go on a page with options and a text box,
never as a bare list. No em dashes, no emojis, plain sentences, no invented
copy on his pages, no commentary. Student tools have to look designed on the
first pass: render the page and look at the picture before showing him. Say
what was checked and what was not.
