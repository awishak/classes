// The brief. What we are building for /classes, why, and what COMM 118 looks
// like this fall. Linked from every dashboard.
//
// The Fall 118 half is built from the real Spring 2026 record (comm118-game-v14):
// its weeks, topics, recurring in-class formats, and assignment spine, shifted
// onto the Fall calendar.

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = "#111827";
const INK2 = "#4b5563";
const MUTED = "#646b75"; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const LINE = "#eef0f2";
const LINE2 = "#e5e7eb";
const BG = "#fafaf9";
const ACCENT = "#9f1239";
const SOFT = "#fff1f2";

const label = { fontFamily: MONO, fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: ".12em" };
const h2 = { fontSize: 25, fontWeight: 600, letterSpacing: "-.025em", margin: "0 0 6px" };
const h3 = { fontSize: 17, fontWeight: 600, letterSpacing: "-.01em", margin: "0 0 6px" };
const p = { margin: "0 0 12px", lineHeight: 1.6, color: INK2, fontSize: 15.5, maxWidth: "68ch" };
const card = { background: "#fff", border: "1px solid " + LINE, borderRadius: 14, padding: 20 };

const Section = ({ id, eyebrow, title, children }) => (
  <section id={id} style={{ scrollMarginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
    <div>
      <div style={{ ...label, color: ACCENT, marginBottom: 7 }}>{eyebrow}</div>
      <h2 style={h2}>{title}</h2>
    </div>
    {children}
  </section>
);

const Pill = ({ children, tone }) => (
  <span style={{
    fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase",
    padding: "3px 7px", borderRadius: 5, whiteSpace: "nowrap",
    background: tone === "live" ? SOFT : "#f4f3f1",
    border: "1px solid " + (tone === "live" ? "#f3c6cd" : LINE2),
    color: tone === "live" ? ACCENT : MUTED,
  }}>{children}</span>
);

// ─── the changelog ───
// Newest first. One entry per working session: what changed, and what broke.
// Add to the top of this array; the page takes care of the rest.
const SESSIONS = [
  {
    id: "aug25b", date: "Tuesday, August 25 \u00b7 later", title: "Drafting comments, and a design system with numbers behind it",
    blurb: "Two jobs. The engine learned to draft grading comments, which the three old forked classes have been able to do for months. And the second UX pass stopped being a matter of taste: the palette was measured, and two of the numbers were bad.",
    groups: [
      { name: "Grading", items: [
        ["Draft a comment, then edit it", "A button in the grade flow that reads the rubric as I just scored it, what the student turned in, and anything they said about it, and writes the comment into the editor. There is a one-line box next to it for \u201cmake sure it says this.\u201d It drafts and never submits \u2014 same deal as the day plan and the before/after boards. The app proposes, I decide."],
        ["The prompt carries the voice", "Casual, warm, direct. Short sentences. A banned-word list. Plain text, no bullets. Lead with what worked, then what to sharpen, and when a rubric line lost points, say what would have earned them instead of restating the number. Style rules sit in the system prompt where they are identical for every student and can be cached."],
        ["Claude Opus 5, and the endpoint learned to take a model", "The shared endpoint was pinned to a model from 2025 and had a 1000-token ceiling. Thinking is on by default on Opus 5 and comes out of that same ceiling, so a short cap would have cut the comment off mid-sentence. The engine asks for Opus 5 at low effort with room to finish; the three old grades files keep the exact defaults their wording was tuned against, until we decide to move them."],
      ] },
      { name: "The design system", items: [
        ["The body text failed a contrast check, in 138 places", "The muted grey used for every secondary line in the app was #9ca3af, which is 2.54:1 against white. WCAG AA wants 4.5:1. Checking the replacement caught a second miss \u2014 the obvious #6b7280 clears white at 4.83 but only manages 4.36 on the sunk grey the dashboard rows sit on. It is now #646b75, checked against every background we actually use and passing all of them, across all seventeen files \u2014 the engine, the Brief, the landing page, and the three live Spring classes. Colour value only, nothing moved."],
        ["Live stopped being a shade of red", "The class accent is #9f1239 and the on-the-projector red is #e11d48. Those are 1.71:1 apart, which is no distance at all across a room, and they mean completely different things. The fix is not a third red. Anything on the room screen now carries a filled badge that says LIVE with a pulsing dot, so colour is reinforcement rather than the whole message."],
        ["Two hit-target floors, and a reason for each", "Apple's 44pt is a touch guideline and we took it because students are on phones. The dashboard is a trackpad under my hands where 44 everywhere pushes half the panels below the fold. So 44 stays on everything students touch, and the dashboard gets a 34px floor \u2014 which still raised the 26px and 28px buttons that had no defence. Auditing found exactly one real miss on a student screen: the role toggle, at 38."],
        ["src/engine/tokens.js", "Seven type sizes where there were fourteen, a 4px spacing grid, and every colour with one fixed meaning and its contrast ratio written next to it. The reasoning for all three lives in the file, so the next component does not reinvent a fifteenth font size."],
        ["Focus rings and reduced motion on the dashboard", "The room screen has honoured prefers-reduced-motion since it was built. The dashboard animates panels while dragging them and had never asked. Keyboard users also had no way to see where they were on that screen."],
        ["Empty states that hand you the door", "\u201cNo plan for this day yet. Build it in Day Plan\u201d told me what was wrong and made me go find Day Plan. Now that every card has a URL, it is a link."],
      ] },
      { name: "Then, in the same session", items: [
        ["A front page with two lists and a locked drawer", "Classes at the top \u2014 COMM 118 and COMM 3, Digital Storytelling \u2014 each with an Open button. Archived classes behind one link at /archive: COMM 2, COMM 4, and the template. At the bottom, every dashboard, room screen and ask page in the app, behind an email sign-in on the two addresses that are mine. Worth saying plainly: that gate hides the links and does nothing else. The dashboards are still unlisted URLs anybody who knows them can open, exactly as they were before, and locking the surfaces themselves is a separate job that needs a check on the page rather than on the link to it."],
        ["Every class is on the engine now", "COMM 118 handed over its public URL like COMM 2 and COMM 4 did. All five classes render from a config object and nothing is a fork any more. The old hubs keep an address at /comm118/legacy, /comm2/legacy and /comm4/legacy, because they hold a term of grading and game data."],
        ["An empty panel that would not say what it was empty for", "A seed added in COMM 999 did not appear on the dashboard, and the data was fine the whole time \u2014 the plan was in COMM 999's store and the screen was showing COMM 118's, which had no plans at all. Two classes, two stores, working exactly as designed and saying nothing about it. Every empty state on the dashboard now names the class and the day it is empty for, and the class code sits large and in the class colour at the top of the screen."],
        ["COMM 2 and COMM 4 took over their own URLs", "/comm2 and /comm4 are the engine now. The old forked hubs hold a term of grading and game data, so rather than falling out of the app they moved to /comm2/legacy and /comm4/legacy. Nothing was deleted."],
        ["The landing page reads the registry", "It was a second, hand-kept copy of the class list \u2014 still saying Spring 2026 with the old rooms. Classes now appear on the front door by existing, grouped by term, taking their colour and meeting time from the same config the app uses. A `listed` flag keeps the template and the empty placeholder off it."],
        ["The seed suggestion was decoration, and I shipped it that way", "Week 1 of COMM 999 suggested a seed and there was no way to act on it. The suggestions were rendered as plain spans \u2014 the right seed, named, with nothing behind it \u2014 so nothing ever reached a day plan and nothing ever reached the dashboard. They are buttons now: pick a day in that week and the seed drops into the slot the seed itself asks for, with the confirmation saying which slot it landed in."],
        ["The same bug, twice more, silently", "A slot stored in the older single-item shape rendered fine in Day Plan, which normalised it, and vanished on the dashboard, which read slot.items raw. Worse, writing a claim onto one of those would have mapped over an items array that was not there and written an empty one back over the item. The shape now lives in src/engine/dayplan.js and every reader and writer goes through it."],
        ["COMM 2, COMM 4, and an empty COMM 3", "Both real classes are on the engine with their own storage, colours and meeting times, and their public hubs stay on the old forked files until there is real content to show. COMM 3 is deliberately empty \u2014 the one to copy when a new class turns up. A class with no weeks yet used to leave the dashboard on \u201cLoading\u201d for ever; it now says there is no schedule and links to where to build one."],
        ["A way into the dashboard from the class page", "Instructor view now carries Dashboard, Room screen and Ask across the top. The class page is where I already am when I realise I want to teach from it, and until now getting to the dashboard meant typing the URL."],
        ["The class switcher on the projector, without a dropdown on the wall", "The room screen gets the same picker, but a permanent control there is a control thirty people are looking at. It behaves like video player controls: it appears when the mouse at the podium moves and goes away three seconds later."],
        ["The day note stopped being a proposed board line", "Day Plan's per-day note was only ever used to seed a line on the before-class board, which put a note to myself one click from the wall. It now shows in the Scratch Pad as what it is, marked as coming from the day plan, above the box I scribble in during class. The board proposes today's topic instead."],
        ["The slides link finally reaches the dashboard", "Day Plan has had a slides field on every day since it was built, and the dashboard never read it \u2014 which left three of the four things this screen exists to hold. It now sits at the top of Class Flow with the two doors on it: open the deck here on my laptop, or send it to the room and drive it on the room machine. The To-Do panel says when a day has no deck linked."],
        ["A freeform day was invisible", "Day Plan can build a day out of blocks instead of a sequence, and Class Flow only ever rendered sequence slots. So a whole freeform day plan showed up on the dashboard as an empty panel. Blocks and their links now render and cast like everything else, claims and all. I had guessed blocks was dead code and it was the opposite \u2014 it is a feature the dashboard could not see."],
        ["A class picker in the dashboard header", "COMM 118 and COMM 999 in a dropdown next to the session picker. Picking one navigates, and the whole screen remounts on the class id, so a day, a cast history or a half-loaded roster from the class I just left cannot ride across. Adding a class is now one line in config/registry.js, which App and the picker both read."],
        ["COMM 999 opens straight onto the class UI again", "The sign-in I added earlier put a name-picker in front of the template class \u2014 the one I open to show somebody what this looks like. Nothing was lost, but the door hid the thing being shown, and the roster behind it is ten placeholder names. A config flag turns the gate off for the template. A real class leaves it on, because there the gate is what stops a student reading a classmate's grade."],
        ["The three live classes moved to Claude Opus 5", "All six call sites in Grades, Grades4 and Comm2Grades \u2014 including the ones that read a photo of handwritten grading notes \u2014 now name the model and carry enough headroom that thinking does not eat the answer. They all parse the response by taking text blocks and skipping everything else, so thinking blocks pass through harmlessly."],
        ["The type scale went in for real", "The engine was using twenty font sizes between 9 and 32. It now uses seven, plus 16. The 9px and 10px mono labels were below the floor our own design rule sets (nothing under about 12), so those came up. 16 stays exactly where it is on every input, because anything smaller makes iOS zoom the page when a student taps a field \u2014 that one is a functional requirement, not a taste."],
      ] },
    ],
    note: {
      title: "Worth knowing",
      lines: [
        "The contrast fix touched the three live Spring classes too (Grades, Grades4, Comm2Grades, styles). Same one-line colour change, no layout change, and those are the classes with students in them right now.",
        "The drafting call goes through the existing /api/generate-feedback on the key already in the environment. No new service and no new dependency.",
        "Still nothing watched with eyes. The Chrome extension has not paired, so the draft button has never been clicked and the LIVE badge has never been seen.",
        "The type sweep stayed inside src/engine. The three older grades files and the Comm118/2/4 hubs kept their own sizes, because those are the classes with students in them and there is no way to check the result by eye right now.",
      ],
    },
  },
  {
    id: "aug25", date: "Tuesday, August 25", title: "Twenty changes, ten a side",
    blurb: "A UX pass over both surfaces. The dashboard got faster to drive mid-class; the class site got a working nav, real URLs, and stopped showing every student everyone else's grade.",
    groups: [
      { name: "The dashboard", items: [
        ["A command bar on \u2318K", "One box over everything castable \u2014 flow items, all three stocked shelves, every line of both boards, assignment reveals, open questions, and the features scheduled for that day. Type three letters, press Enter, and the claim is on the room screen. Hunting for a panel mid-sentence was the worst thing this screen asked of me."],
        ["The rest of the keyboard, written down", "Esc takes down whatever is up. Arrow keys step the board that is live. \u2318B still blacks the room out. \u2318/ shows all five, because a shortcut you have to remember is a shortcut you stop using. Nothing fires while I am typing in a field."],
        ["The To-Do panel, on two horizons", "TODAY: does the flow have content, does every item have its claim written, are both boards written rather than proposed, is anything stocked. COMING UP: the next assignment \u2014 days out, instructions posted, close date set, how many have submitted, how many are waiting to be graded."],
        ["A warning when I am on the wrong session", "An amber strip when the day picker is off the session on deck, with a one-click jump. Casting from the wrong day fails silently and completely: the room gets last Wednesday and nothing says so."],
        ["Panels I can turn off", "A Panels menu hides any panel from the grid, saved per class alongside the order and the 1\u00d7/2\u00d7 width. A panel I am not using today still costs me a read."],
        ["Put it back", "The last five things I cast sit under the monitor, one click to send again. Taking something down and wanting it back was the most common thing I do on that screen."],
        ["Pacing inside Now", "Tapping a slot stamps the time, and the panel reads \u201c12 min in explain \u00b7 10 min is an even share,\u201d amber when I am over. The minutes-since number is about the room; this one is about me."],
        ["Attendance built around the exceptions", "A find-a-name box, an Exceptions toggle that hides the twenty-five people who are simply here, and a Reset. Everyone starts Here, so the panel was showing thirty pills to find the two that mattered."],
        ["The scratch pad saves while I type", "A second after I stop, plus a button that stamps the time on a new line. Saving on blur meant a note written at 8:40 and never clicked away from was gone at 9:05."],
        ["Question triage", "Open / Answered / Archived with counts, Reopen on an answered one, and a Later button that files a question without calling it answered. An answered question is the record of what the room did not understand."],
      ] },
      { name: "The class site", items: [
        ["The nav actually navigates", "Every top tab and every bottom-bar button called the same function and did nothing, with Home permanently lit. Schedule, Assignments and Community now open their cards, More holds the rest, and the active tab is real."],
        ["Every card has a URL", "/comm999/assignments is a link I can paste into an email, and the Back button goes back to the grid instead of leaving the site. A card key typed into the address bar gets the same role check the grid does."],
        ["Students see their own work only", "The Viewing as dropdown listed every classmate, and picking a name showed that person's grade and their entire private thread with me. Now you say who you are once and the site remembers, on the same key the ask page already writes."],
        ["Due dates say how long you have", "\u201cDue today\u201d in amber, \u201cDue in 3 days,\u201d \u201c2 days past due\u201d in red, on the rows and on the home summary. A bare date makes the student do the arithmetic, and that is the loudest complaint in the LMS research."],
        ["A needs-you strip above the grid", "For a student: a new note from me, or something coming due they have not turned in. For me: how many submissions are waiting and how many students are waiting on a reply. The grid is a list of places; this is a list of actions."],
        ["A live banner when class is on the screen", "Reads the same cast bus the projector reads and links straight to the room screen, so a student following remotely needs nothing from me."],
        ["The Community card tells the truth", "An open poll with its question, a running Headlines session, or whatever feature is cast, each with a way in. The card and the projector now agree."],
        ["The grade shows its working", "The percent gains \u201con 50% of the course so far\u201d and a toggle listing every assignment, its weight, its score, and what is still outstanding, with a line saying the outstanding part is not counted against them."],
        ["Keyboard and focus", "The nav items were spans with click handlers, which a keyboard could not reach at all. Everything interactive is a real button with a visible focus ring."],
        ["Skeletons while the data loads", "Four shimmering tiles instead of a grid of cards claiming there are no messages and no assignments for the second before the class data arrives."],
      ] },
    ],
    note: {
      title: "Parked, on purpose",
      lines: [
        "PINs. The sign-in picks a name and stops there. The roster is not real yet, so there is nothing worth locking, and the check drops back into two places when the PINs exist.",
        "The instructor toggle is still open to anyone who finds the page.",
        "Nothing has been watched render. The Chrome extension was not connected, so all twenty changes are verified by build and by reading, not by eye.",
      ],
    },
  },
  {
    id: "aug23", date: "Sunday, August 23", title: "The dashboard started running a class",
    blurb: "One long session. The dashboard went from a mockup to something that runs a class, and COMM 118's actual content came across from Spring.",
    groups: [
      { name: "", items: [
        ["The live poll", "Peer Instruction end to end. Ask, they commit alone, close the floor, they argue, ask again, and the room screen shows the second round with the first behind it. Students vote from the ask page."],
        ["Claims, not titles", "Nothing reaches the room screen as a label. Every cast asks for one full sentence and keeps it."],
        ["Headlines, rebuilt on the engine", "It turned out ClassTools in the old COMM 118 file was Headlines all along. Now engine code: post from the ask page, read each headline for the surface, then for the concept. The 21 categories came from Spring; the 7 course concepts are in the template config."],
        ["Around the Horn", "The seating chart as a board over the dashboard. Drag names to match the room, tap to award points into the in-class bucket."],
        ["Time since they did anything", "The Now panel stopped counting down to the bell and started counting up from the last time the room had to produce something."],
        ["Features in Class Flow", "Headlines, Game, Fishbowl, This or That, Around the Horn, Team Trivia. Two are built; the rest announce themselves and are honest about it."],
        ["Spring content ported", "85 library items, 83 of them readings with links. 6 assignments with weights and rubrics. 11 weeks with topics, 75 scheduled items, and every one of your prep notes. 50 trivia questions. Readings sit on the Subtopic shelf for the day they are assigned."],
        ["Two doors on every link", "Open it here on my laptop, or send it to the room. Reading something is not projecting it."],
        ["A real QR code", "Written from scratch, checked module for module against an independent encoder at every version and every mask."],
        ["Email sign-in", "Students can sign in by name and PIN or by an emailed link, on the accounts the classes already have."],
      ] },
    ],
    note: {
      title: "What broke, and what it cost",
      lines: [
        "The room screen was crashing on its idle board. Two edits replaced spans of a file and swallowed the functions next to them. The build stayed green because an undeclared name is legal JavaScript until it runs. A check now runs before every build and fails on it.",
        "Edits were being quietly eaten. Every save comes back as a realtime event, and taking that echo rolled local state back to whatever the server had. Saves in flight now hold their ground.",
        "The title card was talking to me in front of the class \u2014 \u201copen it on the room machine\u201d and the raw URL, twice. The room gets the claim and the source now.",
        "Casting an Atlantic piece put a black rectangle on the wall. A refused iframe fails silently. Framing is now an allowlist, and anything else is read or carded.",
        "I tripped Vercel's bot protection polling the site after every deploy. That is on me and the polling has stopped.",
      ],
    },
  },
];

// ─── what is built, and what is not ───
const BUILT = [
  ["Dashboard", "/comm118/dashboard", "The surface I open to teach. Drag-to-arrange panels: Now, Class Flow, Before & After, Stocked, Questions, Attendance, Scratch Pad, Assignments. Arrangement saves per class."],
  ["Classroom View", "/comm118/today", "The room screen, one unlisted URL per class. Idle board with a live QR, cast content, blackout. F for fullscreen."],
  ["Casting", "", "Click anything on the dashboard and it lands on the room screen. Click it again and it comes back down. Cmd+B blacks the screen out, same key PowerPoint has used for twenty years."],
  ["Ask", "/comm118/ask", "Where the QR sends students. Two ways in: name and PIN, or an emailed sign-in link. Questions arrive on my dashboard, confidential by default, anonymous if they choose. I can push one back to the room screen."],
  ["Grade flow", "/comm999", "One submission at a time: a queue across every assignment, the rubric scored criterion by criterion, a rich-text comment, a draft that survives a reload, submit-and-advance, skip, and a one-click \u201cI cannot access your link, resubmit within 24 hours.\u201d"],
  ["Class engine", "", "One shared codebase renders any class from a config object. COMM 118 is thirty lines of identity on top of it. A new class is a new file, not a fork."],
  ["Live poll", "", "Peer Instruction, end to end. Ask, they commit alone, close the floor, they argue, ask again, then the room screen shows both rounds with the first one behind the second. The shift is the point."],
  ["Claims, not titles", "", "Nothing reaches the room screen as a label. Every cast needs one full sentence — \u201cRights fees have increased 45% over the last 10 years,\u201d not \u201cMedia rights.\u201d Written once, it stays on the item."],
  ["Time since they did anything", "", "The Now panel counts minutes since the room last had to produce something, not minutes to the bell. It resets on a poll, a pushed question, or an Around the Horn point, and goes amber at ten."],
  ["Around the Horn", "", "The room as it actually sits. Drag names into their seats, tap a seat to award points. Opens over the dashboard so it costs no panel space."],
  ["Command bar", "", "\u2318K on the dashboard opens one box over everything castable \u2014 flow items, stocked shelves, board lines, assignment reveals, open questions, the day's features. Three letters and Enter puts a claim on the wall. Esc takes it down, arrows step a board, \u2318/ lists the lot."],
  ["To-Do panel", "", "Two horizons on the dashboard. Today: flow content, missing claims, unwritten boards, empty shelves. Coming up: the next assignment \u2014 days out, instructions, close date, who has submitted, what is waiting to be graded."],
  ["Class site, addressable", "/comm999", "The card grid is real navigation now. Every card has a URL you can send someone, Back works, students say who they are once and see only their own grade and their own messages, and due dates read \u201cDue in 3 days\u201d rather than a date to do arithmetic on."],
  ["Headlines", "", "Rebuilt on the engine. Students post real headlines from the ask page; each one gets read twice — first for what it looks like on the surface, then for the course concept actually at work. The room screen fills as they lock in, and the gap between the two reads is the lesson."],
];

const NEXT = [
  ["Sweep-back opener", "Pull two or three questions from last week's day plans into a four-minute opening quiz. Parked for now.",
   "Distributed practice and practice testing are the top two techniques across 242 studies and 169,000 participants. This is the cheapest possible way to run both, and the poll machinery it needs already exists."],
  ["AI-drafted feedback in the grade flow", "The engine grades one submission at a time already: queue, rubric, rich-text comment, saved drafts, submit-and-advance. Add the draft-my-comment button.",
   "The old forked classes call /api/generate-feedback and the engine never learned to. It is the one piece of the fork worth carrying over, and the key is already wired."],
  ["Instructor-only student page", "Photo, where they're from, their stated goals, every grade and comment across the quarter.",
   "Goals get captured on day one and then vanish. If they framed how I read the work all quarter, they should be in front of me while I read it."],
  ["The AI day planner", "Given what's stocked, propose how to spend the fifty minutes, structured on a sequence.",
   "Deliberately last. It is only worth building once the surfaces it would fill are settled, and they are still moving."],
];

const RESEARCH = [
  ["Active learning is the lever", "Failure rates fall from 33.8% to 21.8%; exam performance rises 0.47 SD.", "Freeman et al., 225 studies, PNAS 2014"],
  ["The 10-minute attention span is a myth", "The claim rests on secondary sources, not evidence. Design the ask, not the clock.", "Wilson & Korn, Teaching of Psychology 2007"],
  ["Retrieval and spacing beat everything else", "Distributed practice and practice testing rank first and second among ten techniques.", "Dunlosky et al.; Hattie & Donoghue replication"],
  ["Peer Instruction has a recipe", "Commit → argue → re-vote. Aim for 35–70% correct on the first pass.", "Mazur; systematic review 2026"],
  ["Sentence headlines beat bullets", "A claim plus one visual outperforms topic-plus-bullets for comprehension and recall.", "Alley, assertion-evidence, ASEE"],
  ["Cut everything that isn't load-bearing", "Coherence, signalling, redundancy, segmenting.", "Mayer, cognitive theory of multimedia learning"],
  ["Tension and release", "Alternate what is and what could be rather than marching through a flat list.", "Duarte, the sparkline"],
];

// ─── COMM 118, spring record → fall calendar ───
const FORMATS = [
  ["Weekly Game", "Wednesdays. Six On Topic questions, four Sports World questions. Feeds the leaderboard."],
  ["Headlines", "Students submit real sports headlines; the room votes them into 21 standing categories — gambling, identity, labor disputes, stadium deals, sports and politics."],
  ["Rotating Fishbowl", "Assigned fishbowl readings; the inner circle rotates."],
  ["This or That", "Fast forced-choice opener."],
  ["Around the Horn", "The rotating board."],
  ["Team Trivia", "Seven named teams. Ran it in weeks 7 and 10 last spring; they loved it."],
];

const FALL = [
  { w: 1, dates: "Sep 21 · 23 · 25", topic: "Class introduction · What is the central purpose of pro sports?",
    from: "Spring wk 1", note: "Gambling and changing American values. First-day goals seed — capture what every student wants out of the class." },
  { w: 2, dates: "Sep 28 · 30 · Oct 2", topic: "What makes sports worth caring about?",
    from: "Spring wk 2", note: "Textbook ch. 1–2. First Weekly Game." },
  { w: 3, dates: "Oct 5 · 7 · 9", topic: "Athletes as celebrities",
    from: "Spring wk 3", note: "Parasocial interaction theory. Messi as an economic engine. Why young fans follow players over teams: accessibility, player movement, celebrity, fantasy. First Headlines session.",
    due: "Interview Assignment · Oct 9 · 5%" },
  { w: 4, dates: "Oct 12 · 14 · 16", topic: "Media rights",
    from: "Spring wk 4", note: "Fishbowl on ch. 5–7. This or That. Surface every Intersections topic so proposals can start." },
  { w: 5, dates: "Oct 19 · 21 · 23", topic: "Media panel · Intersections intro",
    from: "Spring wk 5", note: "What makes football the ultimate TV show, and which sports are ripe for growth?",
    due: "Intersections Proposal · Oct 23 · 5%" },
  { w: 6, dates: "Oct 26 · 28 · 30", topic: "Identity",
    from: "Spring wk 6", note: "Required plus recommended readings — softball, winter sport, Norway. Guest questions collected in advance." },
  { w: 7, dates: "Nov 2 · 4 · 6", topic: "Sports and politics",
    from: "Spring wk 7", note: "Fishbowl, any reading. Nationalism, the anthem, the military. Team Trivia.",
    due: "Intersections Submission · Nov 6 · 20%" },
  { w: 8, dates: "Nov 9 · 11 · 13", topic: "Culture and team communication → Leadership",
    from: "Spring wk 8", note: "Headlines with walk-up songs. Culture as the backbone of communication and leadership. Students pick their leadership concept. Check whether Nov 11 is a campus holiday." },
  { w: 9, dates: "Nov 16 · 18 · 20", topic: "Leadership",
    from: "Spring wk 9", note: "Peloton case. Leadership dialectics. Work time.",
    due: "Leadership Guide · Nov 20 · 15%" },
  { w: 10, dates: "Nov 30 · Dec 2 · 4", topic: "Final project ideas · Trivia",
    from: "Spring wk 10", note: "Thanksgiving falls the week before. Feats and NFL teams trivia closed it out last spring." },
  { w: 11, dates: "Dec 7 · 9", topic: "Finals · Final project due",
    from: "Spring wk 11", note: "Meetings available.",
    due: "Teach Me Something New · Dec 11 · 30%" },
];

const GRADE = [
  ["Interview Assignment", "5%"],
  ["Intersections Proposal", "5%"],
  ["Intersections Submission", "20%"],
  ["Leadership Guide", "15%"],
  ["Final Project: Teach Me Something New", "30%"],
  ["In-Class", "25%"],
];

export default function PlanPage() {
  const nav = [
    ["log", "Changelog"],
    ["tomorrow", "Next"],
    ["what", "What this is"],
    ["students", "For students"],
    ["me", "For me"],
    ["next", "What's next"],
    ["why", "The evidence"],
    ["fall", "COMM 118, Fall 2026"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: INK }}>
      <header style={{ background: "#fff", borderBottom: "1px solid " + LINE, padding: "22px 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ ...label, color: ACCENT }}>classes.andrewishak.com</div>
          <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-.03em", margin: "8px 0 6px" }}>The Brief</h1>
          <p style={{ ...p, margin: 0 }}>What we're building, why, and what COMM 118 looks like this fall.</p>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {nav.map(([id, t]) => (
              <a key={id} href={"#" + id} style={{
                ...label, color: INK2, textDecoration: "none", border: "1px solid " + LINE2,
                borderRadius: 999, padding: "7px 13px", minHeight: 34, display: "inline-flex", alignItems: "center",
              }}>{t}</a>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px 80px", display: "flex", flexDirection: "column", gap: 44 }}>

        <Section id="log" eyebrow="The changelog" title="What has changed, session by session">
          <p style={p}>
            Newest first. Every working session lands here so I can look back and see what moved, and so I can
            hand somebody the link and say here is what I have been making.
          </p>
          {SESSIONS.map((sn, si) => (
            <div key={sn.id} id={sn.id} style={{ scrollMarginTop: 20, display: "flex", flexDirection: "column", gap: 14,
              paddingTop: si ? 26 : 0, borderTop: si ? "1px solid " + LINE2 : "none" }}>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                  <div style={{ ...label, color: ACCENT }}>{sn.date}</div>
                  {si === 0 ? <Pill tone="live">latest</Pill> : null}
                </div>
                <h3 style={{ ...h3, fontSize: 21, margin: "6px 0 0" }}>{sn.title}</h3>
                <p style={{ ...p, margin: "8px 0 0" }}>{sn.blurb}</p>
              </div>

              {sn.groups.map((g, gi) => (
                <div key={gi} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {g.name ? <div style={{ ...label, color: INK2 }}>{g.name}</div> : null}
                  {g.items.map(([t, d]) => (
                    <div key={t} style={card}>
                      <h3 style={{ ...h3, margin: 0 }}>{t}</h3>
                      <div style={{ fontSize: 14.5, color: INK2, lineHeight: 1.55, marginTop: 5 }}>{d}</div>
                    </div>
                  ))}
                </div>
              ))}

              {sn.note ? (
                <div style={{ ...card, borderColor: "#f3c6cd", background: SOFT }}>
                  <div style={{ ...label, color: ACCENT, marginBottom: 8 }}>{sn.note.title}</div>
                  <ul style={{ margin: 0, paddingLeft: 20, color: INK2, fontSize: 14.5, lineHeight: 1.7 }}>
                    {sn.note.lines.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </Section>

        <Section id="tomorrow" eyebrow="Next session" title="Where to pick it up">
          <p style={p}>In order. The first one blocks the most.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Load the Fall roster", "blocking",
               "Attendance is marking template names. Around the Horn seats ten placeholders. The poll counts votes out of ten. The class site signs students in against a ten-name list. Nothing downstream is real until the roster is in, and PINs cannot land before it either."],
              ["Watch the whole loop render in a room", "never been seen",
               "Dashboard on the laptop, room screen on the podium machine, a phone as a student. Open a poll, push a question, run Headlines, cast a reading, hit \u2318K. Every one of the last twenty changes is verified by build and by reading the code. None of it has been watched with eyes."],
              ["Bring AI-drafted feedback into the engine", "biggest instructor win",
               "The grade flow is already built \u2014 a queue, the rubric, a rich-text comment, drafts that survive a reload, submit-and-advance, and a one-click \u201cI cannot access your link.\u201d What it is missing is the draft-my-comment step that Grades.jsx, Grades4.jsx and Comm2Grades.jsx have had all along, calling /api/generate-feedback on the key that is already in the environment. Mostly wiring."],
              ["PINs, once the roster is real", "after the roster",
               "The sign-in picks a name and stops there on purpose. Two places take the check back: the student sign-in and the instructor toggle. Until then anyone with the link can open either view."],
              ["Instructor-only student page", "the thing I actually want while grading",
               "Photo, where they are from, their stated goals from day one, and every grade and comment across the quarter. Goals get captured on the first day and then vanish. If they frame how I read the work all quarter, they should be in front of me while I read it."],
              ["Decide what a feature owes the room", "design",
               "Game, Fishbowl, This or That, and Team Trivia currently put their name on the wall. Headlines shows what a built one looks like. Which is next, and does it follow the Headlines shape \u2014 post, commit, reveal \u2014 or its own?"],
              ["Sort out email at class scale", "decision",
               "The built-in mailer sends a handful an hour. Twenty-five students signing in at once needs custom SMTP, which is a new service and therefore your call."],
              ["The sweep-back opener", "parked, now cheap",
               "Two or three questions from last week to open class. Retrieval and spacing are the two best-evidenced techniques there are, and the poll machinery it needs now exists."],
            ].map(([t, tag, d], i) => (
              <div key={t} style={card}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ ...label, color: ACCENT }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 style={{ ...h3, margin: 0 }}>{t}</h3>
                  <Pill tone={i === 0 ? "live" : ""}>{tag}</Pill>
                </div>
                <div style={{ fontSize: 14.5, color: INK2, lineHeight: 1.55 }}>{d}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="what" eyebrow="The shape of it" title="One engine, two audiences, any class">
          <p style={p}>
            Every class I teach runs on one shared codebase. A class is a <b>config object</b> — schedule, roster,
            assignments, sequences, seeds, which panels are on — not a fork of the app. Fix something once and
            every class gets the fix. COMM 118 is about thirty lines of identity sitting on top of the shared engine.
          </p>
          <p style={p}>
            That engine serves two very different people. <b>Students</b> get a hub: what's due, what to read, where
            they stand, and a way to reach me. <b>I</b> get a dashboard: everything needed to run one session, so
            there is never a "what am I doing today" moment. The two meet at the room screen.
          </p>
          <div style={{ ...card, background: SOFT, borderColor: "#f3c6cd" }}>
            <div style={{ ...label, color: ACCENT, marginBottom: 8 }}>The loop</div>
            <div style={{ fontSize: 16, lineHeight: 1.6, color: INK }}>
              I open the <b>dashboard</b> on my laptop. The <b>room screen</b> runs on the podium machine and on any
              student's phone. I click something; it appears there. Students scan the QR and ask me things; those land
              back on my dashboard. Everything syncs live over the same channel the class data already uses.
            </div>
          </div>
        </Section>

        <Section id="students" eyebrow="Student-facing" title="The hub">
          <p style={p}>
            Home is a grid of summary cards; opening one loads the full page beside it. Every class ships every card
            and I switch off what a given class doesn't need.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            {[
              ["You", "Photo, current grade, and a two-way thread with me. They can reply “Got it,” “I'm confused,” or book a meeting."],
              ["Assignments", "What's next with its due date. A graded assignment shows for seven days, then clears."],
              ["Schedule", "The next seven days of class with readings and what's due. Click a reading, it opens."],
              ["Community", "Whatever is live right now — the game, a board, an activity."],
              ["Leaderboard", "Game points, which are not the grade. Top five at the end of the quarter earn automatic A's."],
              ["Roster · Instructor", "Who's in the room, and who I am."],
              ["Ask", "The QR target. Two ways in: name and PIN, or an emailed link. Confidential by default."],
            ].map(([t, d]) => (
              <div key={t} style={card}>
                <h3 style={h3}>{t}</h3>
                <div style={{ fontSize: 14.5, color: INK2, lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
          <p style={{ ...p, marginTop: 4 }}>
            Submissions stay as they are: students turn in <b>links</b> — usually a Google Doc, sometimes video,
            sometimes a bundle — and I see them in the LMS.
          </p>
        </Section>

        <Section id="me" eyebrow="Instructor-facing" title="The dashboard, and what's live now">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {BUILT.map(([t, href, d]) => (
              <div key={t} style={{ ...card, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ minWidth: 170 }}>
                  <h3 style={{ ...h3, margin: 0 }}>{t}</h3>
                  {href ? <a href={href} style={{ ...label, color: ACCENT, textDecoration: "none" }}>{href} &rarr;</a>
                        : <Pill tone="live">shipped</Pill>}
                </div>
                <div style={{ flex: 1, minWidth: 240, fontSize: 14.5, color: INK2, lineHeight: 1.55 }}>{d}</div>
              </div>
            ))}
          </div>
          <p style={p}>
            Still to come on the instructor side: <b>AI-drafted feedback</b> inside the grade flow (the old forked
            classes have had it for months and the engine never learned it), the <b>instructor-only student page</b> (photo, where they're from, their stated
            goals, every grade and comment across the quarter), and the <b>AI day planner</b> — deliberately parked
            until the surfaces around it are right.
          </p>
        </Section>

        <Section id="next" eyebrow="Still to come" title="What I'd build next, and why">
          <p style={p}>
            The first round of these is built and live. What is left, in the order I would take it.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {NEXT.map(([t, what, why], i) => (
              <div key={t} style={card}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ ...label, color: ACCENT }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 style={{ ...h3, margin: 0 }}>{t}</h3>
                </div>
                <div style={{ fontSize: 15, color: INK, lineHeight: 1.55, marginBottom: 8 }}>{what}</div>
                <div style={{ fontSize: 14, color: INK2, lineHeight: 1.55, borderLeft: "2px solid " + LINE2, paddingLeft: 12 }}>
                  <span style={{ ...label, display: "block", marginBottom: 3 }}>Why</span>{why}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="why" eyebrow="The evidence" title="What the research says">
          <div style={{ ...card, padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14.5, minWidth: 560 }}>
              <tbody>
                {RESEARCH.map(([claim, detail, src], i) => (
                  <tr key={claim} style={{ borderTop: i ? "1px solid " + LINE : "none" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 600, verticalAlign: "top", width: "30%" }}>{claim}</td>
                    <td style={{ padding: "14px 16px", color: INK2, verticalAlign: "top", lineHeight: 1.5 }}>{detail}</td>
                    <td style={{ padding: "14px 16px", verticalAlign: "top", width: "24%", ...label, textTransform: "none", letterSpacing: 0, fontSize: 12.5, lineHeight: 1.5 }}>{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...p, fontSize: 14 }}>
            The through-line: the room screen is not where the teaching happens, and neither is the clock. What
            moves the needle is how often students have to produce something. Every proposal above is a way to make
            that cheaper to run.
          </p>
        </Section>

        <Section id="fall" eyebrow="COMM 118 · Fall 2026" title="Built from what we actually ran">
          <p style={p}>
            This is the Spring 2026 record — its weeks, topics, in-class formats, and grade spine — moved onto the
            fall calendar. Thirty students last term, seven trivia teams, eighty-three readings on file. Treat every
            row as a starting point, not a commitment.
          </p>

          <div>
            <h3 style={{ ...h3, marginBottom: 10 }}>The recurring formats</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
              {FORMATS.map(([t, d]) => (
                <div key={t} style={{ ...card, padding: 15 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 14, color: INK2, lineHeight: 1.5 }}>{d}</div>
                </div>
              ))}
            </div>
            <p style={{ ...p, fontSize: 14, marginTop: 12 }}>
              All six feed the In-Class bucket, worth a quarter of the grade, and the leaderboard that runs alongside it.
            </p>
          </div>

          <div>
            <h3 style={{ ...h3, marginBottom: 10 }}>The quarter</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {FALL.map(w => (
                <div key={w.w} style={{ ...card, padding: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 128 }}>
                    <div style={{ ...label, color: ACCENT }}>Week {w.w}</div>
                    <div style={{ fontFamily: MONO, fontSize: 13, color: INK, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{w.dates}</div>
                    <div style={{ ...label, fontSize: 10, marginTop: 5 }}>{w.from}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 250 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 5 }}>{w.topic}</div>
                    <div style={{ fontSize: 14, color: INK2, lineHeight: 1.55 }}>{w.note}</div>
                    {w.due ? <div style={{ marginTop: 9 }}><Pill tone="live">Due · {w.due}</Pill></div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ ...h3, marginBottom: 10 }}>The grade</h3>
            <div style={{ ...card, padding: 0 }}>
              {GRADE.map(([n, w], i) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderTop: i ? "1px solid " + LINE : "none" }}>
                  <span style={{ flex: 1, fontSize: 15 }}>{n}</span>
                  <span style={{ width: 120, height: 6, background: "#f4f3f1", borderRadius: 3, overflow: "hidden" }}>
                    <i style={{ display: "block", height: "100%", width: w, background: ACCENT }} />
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, width: 42, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{w}</span>
                </div>
              ))}
            </div>
            <p style={{ ...p, fontSize: 14, marginTop: 12 }}>
              Seventy-five percent in assignments, twenty-five in the room. The leaderboard is separate from the
              grade; the top five at the end of the quarter earn automatic A's.
            </p>
          </div>

          <div style={{ ...card, borderColor: "#f3c6cd", background: SOFT }}>
            <div style={{ ...label, color: ACCENT, marginBottom: 8 }}>Before this becomes the real schedule</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: INK2, fontSize: 14.5, lineHeight: 1.7 }}>
              <li>Confirm the textbook edition. Last spring the 4th and 5th editions had different chapter numbers and it caused problems twice.</li>
              <li>Check Nov 11 against the campus calendar.</li>
              <li>Fall roster is not loaded — the engine is still carrying the ten-name template list.</li>
              <li>Decide whether the Interview Assignment stays at 5%; it was the smallest grade item and the earliest real signal about who's in the room.</li>
            </ul>
          </div>
        </Section>
      </main>
    </div>
  );
}
