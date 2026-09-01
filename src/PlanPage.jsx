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
    id: "sep1", date: "Tuesday, September 1", title: "The types are his now",
    blurb: "Eight types shipped in the code, and eight is a guess about how one person files their material. Rename any of them, add as many as you want, colour each one, and delete one you added. Plus the fix for a button that said a day had no sections while the dashboard was drawing four.",
    groups: [
      { name: "Types, as a list rather than a constant", items: [
        ["Rename any of the eight", "Article was called Link until I said otherwise, and the fix was a deploy. A renamed built-in type keeps its id, so every stored block, every filter and every flow row is untouched and only the word on the screen changes. The name can be put back to the one in the code."],
        ["Add your own", "Video, Reading, whatever the material actually is. A new type gets an id made from the name, a colour off the same twenty-swatch palette the rest of the app uses, and a line saying what the type holds. It shows up in the chips over the table, in the add form, in the open row and in the bulk bar."],
        ["A type you added can go, once the type holds nothing", "The count sits next to every type, because that number is the whole question when deciding whether the type was a good idea. A type still holding blocks says so instead of offering a delete that would strand them."],
        ["Blocks left holding a type that is gone", "They say the id they were given rather than quietly calling themselves Notes, and the sheet offers to move the lot onto a type that exists. That is the same patch builder the bulk bar uses, pointed at the whole shelf."],
        ["A type you add is a label and a colour", "The eight built-in ids do work elsewhere: an assignment goes onto the readings as an assignment, a set holds the blocks inside it, a board holds posts. A type you invent is a filing category, which is what a type is most of the time anyway."],
        ["Every reader says the new word", "typeOf is called from a dozen places that have no business loading a store to answer what a block is called, so the repository and the dashboard hand the shared store's list to blocks.js as they render. The shared store stays the source of truth; the list in the module is the copy every reader can reach."],
        ["Edit the types sits with the type filters", "The chip opens the sheet from the row of type chips it belongs to, rather than down among the lenses. And the header button that dresses the page now says Fonts, because two buttons called Type on one page is one too many."],
      ] },
      { name: "Into the flow, fixed twice", items: [
        ["The button said a day had no sections while the dashboard drew four", "The repository asked the day's sequence which sections a day has, and four of the five classes have no sequences in their config at all. A section made by hand on a day is a `sec-` key, and a slot holding items is a section whatever put it there. The dashboard already knew that and worked it out inline; sectionsOf now lives in dayplan.js and both readers call the same function."],
        ["And it said where a block landed in keys", "A reading that went into a section made by hand came back as \u201cin sec-m4x9q2\u201d. It says the name of the section now."],
      ] },
    ],
    note: {
      title: "Asked and not answered",
      lines: [
        "Every quiz question I have ever written is on the shelf, ported in as a question block with the game it came from kept as a set. The game editor still cannot see any of it, so the questions are searchable and unusable at the same time. That is idea 21 on the backlog and it was not started today.",
        "Nothing was watched with eyes, as usual: the repository is behind the PIN, so this is the build, the checks, 87 smoke surfaces, and a grep of the deployed bundle.",
      ],
    },
  },
  {
    id: "aug31b", date: "Monday, August 31 \u00b7 later", title: "Five numbers off the backlog, and the repository learned what the room made",
    blurb: "Andrew named 11, 13, 14, 16 and 17. So a filter set is now an address I can send myself and a view I can pin, a decision made once lands on forty rows at a time, the seed library arrives as blocks, and the posts, questions, headlines and polls the students made are searchable for the first time.",
    groups: [
      { name: "The filters became an address, and a thing I can keep", items: [
        ["/repo?q=betting&kind=link&class=comm118", "Every filter lives in the URL, so a question I ask the shelf is a link rather than a state I rebuilt chip by chip. The names in the address are the ones I would type by hand, and anything sitting at its default is left out, so a plain shelf is still /repo."],
        ["Back undoes the chip, not the page", "A chip is a step worth keeping in the history and a keystroke in the search box is not, so a chip pushes an entry and a letter replaces one. Pressing Back walks the filters off one at a time and never leaves the repository."],
        ["Saved views, pinned above the table", "Name a filter set and it sits at the top of the page for good. The name is offered already written, out of what the filters actually say, so pinning is two presses. Views live in the shared store beside the fonts, which means the same views are there on the podium machine and the laptop."],
        ["The seven fields are one object now", "Search, kind, class, tag, lens and both halves of the sort used to be six pieces of React state, and a question made of six pieces cannot travel. One object goes into the address, comes back out of a saved view, and reads back off the address when Back is pressed."],
      ] },
      { name: "Many rows, one decision", items: [
        ["A checkbox on every row, and one on the heading", "The heading checkbox takes every row that currently matches, so a filter plus one press is a selection of forty. Selected rows go amber and stay selected while I keep filtering, because narrowing the list is how the selection gets built."],
        ["Tag, untag, retype, share, place", "Add a tag to everything selected, take a tag away from a menu of the tags the selection actually carries, change the kind, move what a class owns onto the shared shelf, or drop the lot into a section of a day. The bar sticks to the bottom of the window, because a selection is made by running down a long list and the decision has to still be in reach at the bottom."],
        ["One save per store, not one per row", "Every action is worked out whole and written once per store. Placing forty blocks on a day writes the day once and stamps each store once, rather than sending forty saves that each carry the whole store and take a backup first."],
        ["Moving to the shared shelf repoints nothing", "The id travels with the block, and every reader already looks in the class store and then in the shared one, so a day that pointed at the block still points at the block. Only ever towards the shared shelf: moving a block into one class would take it out of reach of every other class using it."],
      ] },
      { name: "The seed library, on the shelf", items: [
        ["teaching/seeds.md is parsed rather than retyped", "The markdown file is where I write a seed, because writing a paragraph in a form is worse than writing a paragraph. A script turns the file into config the page can read, and the parser is shared, so the words are read the same way in the terminal and in the browser."],
        ["Seven seeds, as story blocks", "Each one arrives with its concept and its slots carried across as tags, so the facets that already exist can find it. The id is made from the title, which is what makes bringing the library in twice bring each seed in once."],
        ["The lens says which seeds are already blocks", "Bring them all in on a button, or one at a time. Nothing is written until I press, and a seed already on the shelf says so instead of offering itself again."],
      ] },
      { name: "What the room made", items: [
        ["Board posts, questions, headlines and polls, searchable", "Four more stores per class, read across every class at once and put behind the same search box as my own material. What did students ask about framing last year finally has an answer, and there is an instructor view of a discussion board for the first time: the prompt, the count, and every post under it."],
        ["Read when I ask for it", "Twenty more fetches on a page I open to find one article is a page that got slower for nothing, so the room is read the first time I open the lens and held for the rest of the visit."],
        ["Keeping a row makes a block", "A headline a student brought in becomes an article block with its link, a question becomes a question block, a board becomes a board block holding every post. The id is made from where the row came from, so keeping the same post twice writes one block."],
        ["Both rounds of a poll, side by side", "The counts before the argument and the counts after, on one line each, because the second vote is the whole point of running a poll that way."],
        ["A term of polls, instead of the last one", "The store held one poll and the next question overwrote it, so what a room believed in week two, and what changed their minds, was gone the moment I asked the next question. A finished poll is now kept when the next one starts and when the floor is cleared, with both rounds of votes intact. The live poll stays exactly where every reader has always looked for it, so the dashboard, the room screen and the ask page are untouched. A question typed and abandoned before anybody voted is not kept, because a false start is not history."],
      ] },
      { name: "The build", items: [
        ["84 surfaces, up from 75, and the archive asserted on", "The saved views bar, the bulk bar, the seed lens and the room lens all render in the smoke run, plus a row with a selection on it. Underneath, the address encoding, the tag and kind and share patches, the seed parser and the room reader are all asserted on directly, which is what lets a change across five stores be tested without a browser."],
        ["The voice check leaves the seed library alone", "The generated file is Andrew writing in his own voice, and the em dash rule is a guardrail on Claude. A check that corrects the author is a check pointed the wrong way."],
      ] },
    ],
    note: {
      title: "What is still true",
      lines: [
        "The seeds are ready and not yet written: the button puts them on the shared shelf, and nothing was written to a live store today.",
        "Polls asked before today are gone, and nothing can bring them back: the store kept one poll at a time, so each class has its most recent poll and no others. Everything from here is kept.",
        "Nothing was watched with eyes. The repository is behind the PIN and the API that checks it, so all of the above is verified by the build and the smoke run.",
      ],
    },
  },
  {
    id: "aug31", date: "Monday, August 31", title: "The repository became a table, and learned to write",
    blurb: "The repository could show me everything and change nothing. Now the repository is rows rather than cards, every heading sorts, an edit made there lands in every class that uses the block, a thing can go onto a day without opening a dashboard, and the page wears type of its own choosing.",
    groups: [
      { name: "Rows instead of cards", items: [
        ["One row a thing, one column a field", "Thing, Kind, Where, Used, Tags, Made. Cards are good for browsing a dozen things and bad for reading four hundred: a card puts every field on its own line, so nothing lines up and the eye starts over on every card. The kind colour moved to the left edge of the row, so the colour coding survives at table density."],
        ["Every heading sorts", "Click a heading to sort by that column, click again to turn the order round, and the arrow says which column is holding the order. A tie falls back to the words, so a re-sort never shuffles the rows that matched equally."],
        ["Search reads where a thing was taught", "A class code or a date in the search box now finds everything that ran then, because the places a block turns up are searched alongside the words on the block."],
        ["The filter bar stopped hiding half of itself", "Sort and the match count were nested inside the tag filter, so a store with nothing tagged lost both controls. The tag menu hides on its own now, and nothing else goes with it."],
      ] },
      { name: "Writing from the repository", items: [
        ["Fix the words once", "Open a row and the panel underneath edits the block: kind, title, headline, link, body, concept, source, tags. A block is stored once and referenced everywhere, so the save lands in every class using the block, and the page says so."],
        ["Delete says what will go blank", "Two steps, and the confirm counts the days the block sits on. Deleting something used on nine days should not look like deleting something used on none."],
        ["Put a thing on a day, from here", "Pick a class, a day grouped under its week, and a section of the day. Into the flow adds a row pointing at the block and stamps the date on the block; onto the readings writes to the week the students see, the same field the Schedule editor writes. Underneath, everywhere the block already turns up, each line a link to that dashboard."],
        ["Every write goes to the store the block belongs to", "The page hands each store the same update shape the rest of the engine takes, which is why blocks.js and schedule.js work here unchanged. The stores are held beside React state as well, so a place and the stamp that follows it never land on stale data."],
      ] },
      { name: "The heading row, and type of its own", items: [
        ["The headings were out of line with the rows the headings name", "A row's first cell carries a 4px colour edge and 10px of padding; the heading cell carried 12px of padding and no edge, so every heading sat two pixels left of its own column. The heading cells now carry the same edge, drawn transparent."],
        ["The sort arrow was shoving the words sideways", "The arrow only drew on the sorted column while the gap was always there, so headings moved as the sort moved. The arrow now always sits in the row: faint when the column is idle, solid up or down when the column is doing the sorting."],
        ["Cramped headings, and a hover that lied", "11px uppercase in a 38px button, under the 44px floor, now 12px in a 44px button. And a hovered row was painted the same grey as the heading row, so two bands on screen claimed to be the heading. Hover went lighter."],
        ["The heading row was not sticking at all", "Two faults, and the first fix only looked like a fix. The sheet had overflow:hidden, and an ancestor with overflow:hidden becomes the scrollport a sticky child sticks inside, so a heading row in a sheet that never scrolls had nothing to stick to and scrolled away with the rows. Then the offset it stuck at: measured once on mount, and on mount the page is still the loading line, so there was no header to measure and the fallback of 57px is what stuck for good. The corners are rounded on the cells now rather than clipped on the box, and a ResizeObserver watches the header from the moment the stores land."],
        ["Edges that stayed behind", "A collapsed border belongs to the table, not to the row, so a stuck heading row lost its bottom edge, and a row with no ground of its own showed through the heading row it passed under. Separate borders, edges on the cells, white on the rows."],
        ["A font chooser, and the choice is the repository's own", "Type in the header opens three slots: column headings, the words in a row, everything else, each face drawn in itself, plus heavier rows and a reset. The dashboard's slots live at shared.fonts and these live at shared.repoFonts, so dressing the filing cabinet never changes how a class looks while it is being taught. Both are in the shared store, so the choice follows me and not a class."],
      ] },
      { name: "A backlog, at /repo/ideas", items: [
        ["Twenty ways the repository could be better, on a page", "Read out of the code rather than invented: the porting script, the day plans, the schedule writers, and the unfinished list in HANDOFF. Four groups. Make the data true, reuse rather than storage, move faster through the list, hold more and edit without fear. Each idea says what the change is, why the change earns a session, and how big the session is."],
        ["Numbered, because a backlog is for pointing at", "A list said out loud in a conversation is gone when the conversation is cleared. A list at a URL survives, and the numbers mean the next session starts by naming numbers instead of re-deriving what the numbers meant. Where I would start: 1, 2, 5, 11, 19."],
      ] },
      { name: "Ideas 1 and 2, built", items: [
        ["Two lenses on the repository, not two pages", "The whole shelf, Duplicates, Loose ends. The table answers what do I have. The lenses answer what is wrong with what I have, and both questions need every store open at once, which is why neither question belongs on a dashboard."],
        ["17 duplicate groups, 15 of them crossing a class", "The porting script deduped inside a class and never across classes, so the research-methods chapters exist twice over, once in COMM 118 and once in COMM 4. Matching is on the web address where a block has one and on the title otherwise, which is the key the porting script itself used."],
        ["A merge that repoints rather than deletes", "Choose the copy to keep and where the copy lives, then every day plan row, every week item and every set pointing at the others is pointed at the survivor. Empty fields fill from the copies, tags and dates union, the oldest made-on date wins. A survivor that two classes use can move to the shared shelf in the same gesture."],
        ["Nothing is thrown away", "Each losing block is kept whole in the shared store under merged, with the store the block came from and the block the loser was merged into, so a merge made in error can be read back. Two rows landing in one section collapse into one row that keeps what both rows carried."],
        ["5 loose ends, all in the template class", "Week items in COMM 999 still pointing at the library the engine had before blocks existed, because link-readings only ever ran on three stores. A week item carries its own title and link, so the repair is to make the block the item was standing in for, on a button."],
        ["npm run tidy", "The same two functions run against the live stores from the terminal, read only, so the size of the problem is a number before the tool for the problem gets used. 334 blocks across five classes and the shared shelf."],
      ] },
      { name: "Three small ones, asked for by eye", items: [
        ["A Link is an Article", "The kind is what the thing is, and Link described the field rather than the thing. The id underneath stays link, because every stored block, every flow row and every filter is keyed on the id and only the label reaches a screen, so nothing had to be migrated to rename the kind."],
        ["The kind moved next to the title", "Reading down a Kind column tells me nothing, and a kind sitting against its own title tells me what I am looking at without my eye moving. So the pill went into the first cell and the column went away. Filtering by kind is still the chips over the table, which was always the better tool for the job the column was doing."],
        ["Thing became Item", "A column heading is a word I read four hundred times."],
      ] },
      { name: "Two more names", items: [
        ["Where became Class, and Mine became Shared", "Where is a question the column was answering with a class name, so the column may as well say Class. And under a heading that says Class, Mine is a category error: the answer to which class is not a person. Shared says what the shelf actually is, which is the material every class can reach."],
        ["The name now lives in one place", "Mine was typed out by hand in eight places across three files, which is how a one-word rename becomes a hunt. SHARED_LABEL sits next to SHARED_KEY in blocks.js, and the table, the chips, the add form, the merge chooser and the terminal report all read the label from there."],
      ] },
      { name: "Ideas 3 and 4, and a backlog that crosses things out", items: [
        ["Tags, managed across every store at once", "Every tag with a count and the classes carrying it. One control does renaming and merging both, because renaming a tag onto a tag that already exists is a merge and there was never a reason for two buttons. Clearing the box removes the tag from every block holding it. A block that ends up with the same tag twice keeps one."],
        ["The same word, filed more than one way", "framing, Framing and framing-with-a-full-stop are three tags to a filter and one word to me, and a facet that splits its own matches is worse than no facet because the filter looks like it worked. Lookalikes are grouped at the top of the lens with the spelling most of the shelf already uses offered as the one to fold into."],
        ["Link checking, on the server because a browser cannot", "A fetch from the page to somebody else's site is blocked, and the no-cors version comes back opaque with no status on it, so the page would be guessing. /api/check-links takes a batch, does a HEAD, falls back to a GET where a HEAD is refused, and returns a status and nothing else. Never the body."],
        ["An endpoint careful about what it will fetch", "http and https only, nothing on a private network, nothing on loopback, twelve to a batch, nine seconds and out. An endpoint that fetches whatever it is handed is a way into everything else, and this one refuses localhost and file:// by name."],
        ["Refused is not the same as gone", "A paywall or a bot wall answers a checker with 403 while serving a person the page. The lens says so in as many words, because a checker that quietly calls good readings dead is worse than no checker."],
        ["The answers stay on the blocks", "Checked, gone, moved, refused, no answer, written onto the block the link belongs to, one write per store at the end rather than three hundred writes. Tomorrow the column is still filled in."],
        ["Built ideas get crossed out", "Andrew: as we do things, lets cross them out. So an idea carries the date it was built, renders struck through and stepped back, and the header counts what is done. The what and the why stay readable, because the reason an idea was worth doing is worth keeping after the doing."],
      ] },
      { name: "The build", items: [
        ["The smoke test was passing on a loading screen", "The repository case rendered the page, the page renders a loading line until the stores arrive, and a loading line proves nothing. The row, the open panel, the placer and the type sheet are rendered directly now, six cases, each naming a string the output has to contain. 58 surfaces to 65."],
        ["The stylesheet floor went up twice", "check-css guards the page against another accidental deletion. The floor moved from 30 rules to 75, against the 86 the page now has."],
      ] },
    ],
    note: {
      title: "Parked, on purpose",
      lines: [
        "Deleting a block still leaves the day-plan rows that point at the deleted block, exactly as the dashboard leaves them. Making the repository the one writer that tidies up is defensible and was not decided today.",
        "Nothing was watched with eyes. All of the above is verified by the build and by reading, which is how the last few sessions have gone too.",
        "Friday\u2019s session never got an entry here, so the repository landing at /repo and the top-bar work are in the commits and not in The Brief.",
      ],
    },
  },
  {
    id: "aug25b", date: "Tuesday, August 25 \u00b7 later", title: "Drafting comments, and a design system with numbers behind the choices",
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
        ["I deleted the stylesheet and shipped it", "Taking the segmented group out of the bar was meant to remove five rules. It removed a hundred and four, because the edit cut from one marker to the next and the next marker sat much further down the file than I had assumed. Every check passed and all 59 smoke surfaces passed, because a page with no styles renders perfectly well; it just looks like 1994. The rules are back, minus the five that genuinely went, and scripts/check-css.mjs now counts them and refuses a build that has lost a large share \u2014 running it against the broken commit reports 16 rules against a floor of 120. Also fixed: an arrow that printed itself, which my own escape check had walked past, because the text run around it held a JSX expression and the check skipped any run containing a brace. It reads those now, and the planted bug fails."],
        ["Casting moved to the screen it casts to", "Some controls on the bar were joined into a group and some stood alone, and the line between them was where I happened to add things rather than what any of them are. Nothing is joined now: six controls, one shape, in one order \u2014 where I am on the left, what I can open on the right. Cast left the bar entirely and sits directly under the picture of the room screen, because the one control that puts something up belongs under the preview of what is up rather than three columns away from it. Everything about the room is in one column now: cast, the Enter and Exit screens, idle, black, take it down, open the room screen."],
        ["One shape for everything on the bar", "Four treatments were sharing a row: the class name in its own colour at 19px with no border, a bordered pill for the day, a joined group tinted in the class accent, and a link in the small button style. Same row, same job, so the same shape now \u2014 36 tall, 11 radius, one border, one type size, one hover. The joined group stays joined, because those four open something over the screen and belong together, but it borrows the same border and the same type as the rest. Nothing on the bar carries its own inline styling any more."],
        ["Repo on the bar, and the day picker with the other controls", "The repository was reachable only through the class menu and the command bar, which is a place to hide a thing rather than a place to keep it. It has a link on the bar. And the day picker moved across to lead the controls on the right, because picking a day is what I do before any of the rest of them."],
        ["A repository of everything, at /repo", "334 things across five classes and my own shelf, behind one search box, gated the same way a dashboard is. Filter by kind, by class, or by any of 36 tags, and sort by how often I have used something, by newest, or alphabetically. Every card wears the colour its kind wears on the dashboard, and says where the thing actually sits in the term \u2014 worked out by walking the day plans and the schedules rather than read off the stamp on the block, because that stamp is only as old as the stamping and 57 readings never got one. Clicking a card opens what else is known about the item and every place it has been used. Adding something takes four fields and a choice of whether it belongs to a class or to me. One thing the page told me immediately: 58 of the 334 have ever been placed, so 276 are sitting unused."],
        ["The row menu opened underneath the rows below it", "Two causes, both mine. A filter creates a stacking context, and the row had one on hover for its brightness, which boxed the menu inside that row so every later row painted over it. The brightness is a background blend now, and the row whose menu is open rises above the rows after it. Separately the card carried overflow:hidden for its rounded corners, which cut the menu off at the card edge; the corners hold without it. Tuck is Nest."],
        ["Everything a row can do lives on its number", "Six buttons on the right of a row squeezed the words into a column of their own on a narrow card, and five of the six are things I do while planning rather than while teaching. The number opens all of them \u2014 done, tuck under the row above, move back out, write the headline, put on today\u2019s readings, take off the day \u2014 and only the cast button stays out, because that is the one I press with the room watching. Three controls on a row instead of six, and the row wraps now rather than crushing the title. My own JSX-escape check caught six escapes in the menu I was writing, which is the second time that check has paid for itself."],
        ["Look threw the moment it opened", "It used an accent prop it never took, and every check passed, because nothing in the test suite had ever rendered a sheet. A component that only exists once a button is pressed is exactly the component a build cannot vouch for. All four sheets are in the smoke test now \u2014 Look, Look with choices already made, the note box and the keyboard list \u2014 and putting the bug back makes two of them fail by name."],
        ["Paring down, and a font chooser", "The class chooser opened off the left edge of the page, because it shared the menu style built for buttons on the right, where right-aligning is correct. Teaching and View left the bar; Teaching keeps its keyboard shortcut and everything in View moved nowhere, since both menus stay reachable. The whole band across the top is gone \u2014 the day chips, the progress bar and the two clocks \u2014 and what is left is a date button beside the class name that opens every week of the term with each date as its own small button. Under the day title it says Week 1, Monday, which is what I would say out loud, instead of the day-of-the-run line. Shape is Structure now, a dropdown on the same row as New section, Merge sections and New note. The count beside a section name is gone. And there is a font chooser: the column headings, the section names and the row text each take one of eight faces, rows can be bolded, and all of it is kept with me so it holds across every class. The reading card leads with its title at full size and its tag dropped to the footer beside the link."],
        ["The heading moves into the card and says which day it is", "Three faults at once. The clear button was a sibling of the title inside a flex column, so it took a whole row and left a hole underneath; it sits on the line above the title now, appearing on hover. The heading was above the card rather than in it. And the one thing worth saying out loud, which day of the run this is, was on the hover hint, so it only showed with a pointer on it. That line is always visible now and leads with the run: Day 2 of 5, named here, or Day 3 of 5, from Sep 23. Two more bugs turned up in writing it: day one of a five-day run said The week, and the day a title starts on said it was carrying on from itself."],
        ["The day\u2019s name heads the Flow column", "It sat in the band alongside the week, the day chips and the clock, where it read as one more piece of chrome. The name of what I am about to run belongs over the thing that runs it, so it moved under the FLOW heading and above the panel. The band keeps the week jump, the days, how far in I am and what goes up next."],
        ["The first day counts", "Andrew wrote a title on Sep 23 and his week 1 topic is the same words, so Sep 21 showed that exact title through the week fallback and still sat outside the run: the screen said day 1 of 30 on the second day and said nothing at all on the first. I was grouping days by where the words came from, and what a person sees is the words. Runs are counted by what a day SAYS now, so two days showing the same title are the same run however each one got the title. On his own data Sep 21 is day 1 of 5 rather than uncounted."],
        ["Day titles that can cover more than one day", "Three ways to do this: a title per day, which cannot say two days are one thing; spans, which need a table and a pair of handles to set the ends; or a title that starts where I write it and covers every class day after it until I write another. The third is what got built, because it is one field per day, no new structure, and it matches how I would actually type. Write a title on Sep 21 and it runs until the next one, across a week boundary if that is what the arc does. The heading says whose title it is and how far the title reaches: the week, or this day, or day two of three. Clear hands the days back to whatever came before. The week topic is still the fallback for days before the first title, and since the big line now edits the day, writing the week topic moved into the notes box with the rest of the week\u2019s writing."],
        ["Sections take a colour I pick", "The caret on a section header opens the same twenty swatches the rest of the colours come from, plus an auto that hands the choice back to the name. A pick is kept by the section NAME rather than by the day, so The hook is the colour I chose every week I use it, which is the reason the generated ones were hashed off the name to begin with. Nothing has to be picked: with no choice made the hash still decides, so a brand new section arrives with a colour already."],
        ["The section menu opened at the bottom, and the bar was a wall", "My own bug: the menu sat inside a span I had set to display:contents, which removes the box, so position:relative did nothing and the menu measured itself against the whole section instead of against the caret it hangs off. It anchors to the caret now. The full-colour header was competing with the full-colour rows underneath, which stacks two walls of colour; the rows carry the fill, so the header is a rule with the section colour in the words, which reads as a heading rather than as a second row. Every one of the eight section colours clears 4.5:1 as text on white. And Delete says what it takes with it: Delete the section and its three rows."],
        ["Sections rename, look like the rows, and lost the dot", "The sections I make myself were passed through as an override title and drawn as a dead span, so the only ones I could rename were the ones the sequence named. Exactly backwards, and now every section renames on a click with the round tick to confirm. The header was a chip, which is a third visual language sitting between the white cards and the coloured row bars; a section heads the rows under it, so it is a bar like them, in the section colour with white text, and the tally, the caret and Add ride on the bar. The middle dot on a row was a marker meaning the block came from the library, and the only place saying so was a tooltip. The row already says what it is by colour and the info card says where a block comes from, so the dot is gone."],
        ["Up next wears the right colour, and the week notes are editable", "Up next was painted the class colour, so a reading came up crimson in the band and blue everywhere else, which defeats the point of having colours at all. It takes the colour of whatever is next. Fixing that turned up a second thing: the button read its row off a reference the Flow fills while it renders, so on the first paint the reference was empty and the button was simply missing until something else caused a re-render. The order is worked out where it is used now. The week notes in the New note box open when clicked, with the same round tick as everywhere else, so I can add to how the week runs without leaving the flow. And the big line at the top says what it is on hover: it is the week topic, it has been editable since it was built, and it never said so, which is why I asked about it twice."],
        ["New note shows the notes that actually exist", "It was reading two day-level fields and both were empty on every day of every class, so the box said nothing was written when weeks of writing sat right there. What I write goes on the WEEK, not the day: COMM 118 has zero day notes and a week plan on every single week, some of them six hundred characters. The box now asks all five places and labels each one \u2014 this day, the scratch pad, how the week runs, what students see this week, and the notes already sitting in the flow. Checked against the live COMM 118 store rather than a fixture, because a fixture would have agreed with the bug."],
        ["The discussion boards are real, and the old ones came with them", "The button on the class page had nowhere to send anybody, because the engine had no board page. It has one now at /<class>/board: the prompt on the projector is the prompt on the page, students post under it, and every phone in the room sees a new post without reloading. The same prompt cast twice is one conversation rather than two half-empty ones. Casting a board opens its thread, so the first student to arrive finds a board instead of an empty page. And the four boards sitting in the old hubs came across with all sixty-six posts \u2014 twenty-six on why sports are worth caring about, twenty-four of questions for Francisco, nine on what people would read more about, seven of final videos in COMM 2. The port merges rather than replaces, so running it twice adds nothing."],
        ["Whatever is on the projector comes to the top of the class page", "A student opening the class page saw a grid of cards, none of which was the thing the room was looking at that second. Now the thing on the screen sits above everything with its own door, and the prompt itself is the headline: a board reading \u201cWhat\u2019s something you\u2019d like to read more about?\u201d says exactly that, with a button that says Add to the discussion. An article says its own title and opens in a new tab. An assignment says its name and goes to the assignment. A poll says the question and goes to the vote. A game says what it is and goes to the room screen. Headlines asks for a headline. The old banner said class was on and left you to go find what was on, which is a sentence that makes you do the work."],
        ["Remove is on the row, and the instructions are off every screen", "I asked for the permanent \u00d7 to go and for right-click to delete, and both happened, and then I could not find how to take a row off the day. A gesture nobody mentions is a gesture nobody has. Remove now sits with Cast and Edit in the tools that appear on hover, so it is findable without being on screen at all times; right-click still works. And the same pass ran across the Schedule, the Day Plan, the Roster, the Assignments and the class site: placeholders are labels rather than sentences, and the paragraphs explaining how to use the thing in front of me are gone. What is left says what is true \u2014 nothing to grade, no class days scheduled, no items yet \u2014 rather than telling me what to do about it."],
        ["Enter and Exit are screen buttons", "They sit with the other screens the room sees \u2014 Idle, Black, Take it down \u2014 rather than in the middle of the run of show, and each button wears the Enter/Exit colour and lights up when that board is on the screen. Buttons only for now. Writing the boards moved to the command bar so the editor was not stranded when the tab went, the same way Headlines kept a way in when its button was replaced. The dead props left behind on the Flow were removed rather than left reading as wired."],
        ["A button that read \u201c\\u2192\u201d, and the check that stops the next one", "Andrew asked what the button was for, which was the right question, because it was showing six literal characters where an arrow belonged. JSX children are not JavaScript strings, so an escape written there renders as itself. Six of them had shipped. They are characters now, and scripts/check-jsx-text.mjs fails the build on any escape stranded in JSX text \u2014 the first version of that check reported forty-four lines and meant none of them, because it was also reading inside braces where an escape is correct. Even rendered properly, a bare arrow on a row is a guess, so the nest controls say Indent and Outdent, and a tucked row draws an elbow back to the row it sits under. Moving Enter and Exit into the flow also surfaced a crash: a board with neither a saved version nor a proposal was undefined and the editor read a title off it. It renders on every day now rather than only when I opened its tab, so that day existed. Guarded and covered by the smoke test."],
        ["Seven fixes on the flow and the readings", "White text on the bars, which the CSS already said and an inline style was quietly overriding \u2014 an inline style always wins. The separate headline on a reading is gone: the article already has a headline, written by whoever wrote it, and my own note is where what I think about it belongs. A reading card drags into the Flow. A row can tuck under the row above it, one level, and the depth rides on the row so it survives dragging, merging and switching sequence. Enter and Exit left the rail and sit in the day, written and saved where the rest of the day is, because the two boards that bracket a class are part of the run of show. Casting an article now puts a link on the room screen, so I can open the page on the projector without going back to my laptop \u2014 and the link shows even when the page cannot be read, which is exactly when it matters. New note sits beside New section, and the box shows everything I have already written for that day underneath, so the next note answers what is there instead of repeating it."],
        ["The whole bar is the colour", "Not the tag on the bar, the bar. A coloured chip beside plain text said what a row was in the space of a thumbnail; now the bar itself says so, and a day reads as bands of colour from the far side of the room, which is what the colours were for. White text throughout, the number sitting on the bar rather than carrying the colour, and the tools riding on the fill instead of fighting it. Selected, live and up-next are rings rather than fills, since the fill is already busy saying what the row is. A ticked row desaturates and keeps its strike-through."],
        ["Ideas are Activities, and the games live there", "A teaching move I wrote down and Headlines or the Weekly Game are the same sort of thing from where I sit: something the room does, which I want to drop into a day. They were in two different places for no reason worth defending. Headlines, Game, Fishbowl, This or That, Around the Horn and Team Trivia now sit under Activities with my own, each on its own bar, each draggable straight into the Flow, each with a Run button for doing it right now. A dropped one keeps the fact that it is a feature, so casting the row runs the feature rather than putting words on the screen."],
        ["The whole tab is the colour, and drops land where I let go", "The open tab is filled with its colour and carries white text, rather than a coloured word with a thin underline. Closed tabs keep a dot of their own colour, so the rail says what is on it without every tab shouting at once. Dropping into the Flow now lands above whatever row the pointer was over: the row targets already carried a position and the path for anything arriving from Materials was throwing the position away, so every drop from the left rail fell to the bottom. And dragging a reading into the Flow copies it by default, leaving it assigned; a switch in the View menu makes the drag move it instead."],
        ["Colours, and they are mine to set", "Twenty swatches across eight rainbow families, two or three shades of each, and every one of them carries white text. A Colours button replaced Headlines in the header, and the Headlines board moved to the command bar so nothing was lost. Each sort of thing gets a colour and wears it everywhere: the rail tab, the chip on a block, the number on a flow row. Defaults are readings blue, ideas green, notes yellow, assignments red, questions orange, poll a deeper orange, Enter/Exit purple, plus pink for stories and teal for sets. The choices live in the shared store, so they hold across all five classes. One thing the palette cannot do: white text on a genuinely light yellow is unreadable, so the light tier of each hue is only as light as white text allows, which is why the yellows read closer to mustard than lemon. The build recomputes all twenty against white and fails on any that drop under 4.5:1. Asking is now Questions and Assigned is now Assignments."],
        ["Drag anything, into either place", "A block in Materials drops into a section of the Flow or onto Today\u2019s readings. A reading drops into the Flow. A row in the Flow drops onto Today\u2019s readings. The panel outlines itself while something is over it, and dropping the same thing twice does nothing rather than making a duplicate. A row that lands with no block behind it keeps its own words and a pointer back to the schedule item, so the two halves stay joined. The headline editor on a Flow row got the round tick too, and Enter there saves without also throwing the row onto the room screen."],
        ["A round tick inside the box, and the headline saves again", "Neither field on a reading could be saved. The headline box had no onBlur, so clicking away threw the words out, and its save returned silently on a short sentence, which made the whole field look broken. Both now carry a round tick against the right edge of the box, and the box is padded so the words never run under the tick. Enter saves, Escape cancels, clicking away saves, and none of that has to be known. An empty headline says what is wrong instead of doing nothing."],
        ["The build checks the voice now", "Andrew asked whether I had read his voice doc before writing \u201c+ a headline for it.\u201d I had not. That string ends a clause on a bare \u201cit,\u201d which is the rule with the longest corrections log in the doc, and UI copy gets the same pass as body text. Two of his rules are mechanical, so scripts/check-voice.mjs enforces both on every string that reaches a screen: no clause closing on it, this, that, one or them, and no em dashes in words a reader sees. The first version scanned props and JSX text and walked straight past the very string that prompted it, because that string lives in a fallback expression. It reads those too now, and all four shapes are tested by planting the violation and confirming the build fails. Thirty-two lines across the app were rewritten to clear the check, most of them older than this session."],
        ["A reading is a card, and assigned is a toggle", "Through the shared row a reading had to fight a number chip, a source pill and three buttons for one line, so a long title came out four characters wide. It gets its own card: my headline at 13px, the headline it came with at 12px under it, then my note \u2014 all of them the full width. The link and the buttons moved to the bottom, which is where a card\u2019s actions belong and where they stop stealing width from the words. And being assigned is now separate from being in the flow. They were one choice before, so a reading I meant to talk about quietly stopped being one students were told to do. A flow row carries an Assign toggle; a card in Today\u2019s Readings says when it is also in the flow. Two facts about one thing, and I set each."],
        ["One type scale, and a note per reading", "The row title was pinned at 16px while everything around it read from the density scale, so in a 300px rail it was a title two sizes bigger than the panel holding it. It reads from the scale now: full size down the Flow, where I am reading while standing, and rail size in a rail. And every reading takes a note \u2014 what I like about it, what it is for, why it sits on this day. The headline is the sentence that goes up on the screen and is public; the note is mine, and in eleven weeks it is the part I will not remember."],
        ["The flow IS the day plan", "To-do was counting only the slots the SEQUENCE names, so anything in a section I made myself did not exist to it \u2014 which is how it came to tell me the day was empty while the flow in front of me was full. It counts the day plan now, all of it, and the wording that pointed at a separate Day Plan page is gone. There is one day plan and the flow is it."],
        ["Readings read", "The source chip was flex:none and nowrap, so in a 300px column it took its width first and the title got what was left \u2014 about four characters, one word per line. The title now has the row to itself and the source sits under it, and the source is the link: it opens the reading in a new tab."],
        ["The topic is mine to write", "The big line at the top is the week\u2019s topic, which is why it came over from the old hub with a full stop on the end. Click it, type, Enter. Nothing punctuates it \u2014 a topic is a label, not a sentence. Boards are Enter and Exit now."],
        ["Six fixes: scrolling, tags, drag, headings, to-do, notes", "The rail body had no flex basis, so inside a height-capped column it sized to its content and the overflow was clipped \u2014 which is why the bottom of a long readings list could not be reached. It also had overscroll-behavior:contain, so once a rail hit its end the wheel stopped dead instead of handing the page back. Both fixed, the header is pinned so scrolling never takes the menus away, and the rails now measure the header rather than guessing its height. Topic filters were twelve chips wrapping across a 300px column, four rows of buttons above the list I came for; they are one dropdown. Anything in Materials can be dragged straight into a section of the Flow \u2014 same drop targets the flow already had, because from where I am sitting it is the same gesture. The three columns say their names. To-do left the rails: clicking the session in the band opens what is still to do for that day, which is what the list is about. Notes moved to Materials."],
        ["The top bar, grouped by what things are", "Eleven controls in the order I happened to add them, which is not an order. Now four groups. The class tools \u2014 Cast, Headlines, Around the Horn, Here \u2014 are one joined control, because they do the same kind of thing at the same moment and should look alike. The view switches went behind a View menu, since I set them once and they were competing for attention with the buttons I press while thirty people watch. Everything that leaves this class \u2014 class home, the schedule, The Brief, the other four classes \u2014 lives under the class name, because that is what they all are. Teaching stays out on its own: it is the one switch I hit at the moment class starts."],
        ["Ideas collapse to their titles", "Every idea was showing how it runs plus four buttons, so twelve ideas was a page of scrolling. The title is the list; the rest is what I asked for when I clicked. One open at a time."],
        ["Material, Flow, Live \u2014 and I set the widths", "The three columns have names now. Drag either seam to set how wide Material and Live are; Flow takes whatever is left, so it is the one column that never needs a number. The widths are remembered, the seams take arrow keys, and the room preview is never what gets hidden to make space \u2014 when the window is too narrow for three columns, Live moves full width under the Flow with the preview beside its panel."],
        ["Here is a button, not a tab", "Taking the roll happens once, standing up, at the start. As one of five tabs it was permanently in the way and too narrow to use. It opens over everything now, the way Around the Horn does, and the button carries the count."],
        ["Eight fixes and a colour system", "One band across the top instead of two strips: the week, the days, how far in I am, the topic, and what goes up next. The old strip repeated four counts that already sit on the rail tabs, which is why it read as clutter. A Week button opens the whole term, so getting to week nine is one click rather than eight. Compact mode now changes rows, gaps, padding, card corners and the topic size \u2014 it used to set one variable that one rule read, which is why it looked like it did nothing. The prep rail widens, trading away the room preview, because 300 pixels is enough to pick a reading and not enough to read one. Sections carry a colour taken from their own name, so the same section is the same colour every week and a nine-row day resolves into three blocks; every one of the eight is checked against white by the build. Assignments say their due date instead of the word Reveal, and the two lines explaining the animation are gone. Empty panels now offer the button instead of describing the hole. And the warning that casting from another day still reaches the room is gone \u2014 I picked the day, I know."],
        ["A headline belongs to the day, not to the block", "Writing a headline on a row was writing it onto the block, so the same idea used in two places had one overwrite the other. The block\u2019s headline is now the default it offers, and what I write on a day stays on that day."],
        ["The grid is gone. Two rails and a day.", "Everything I do here is one of two jobs. Before class I am gathering \u2014 ideas, readings, what is assigned, what is left to do. During class I am running the room \u2014 what is on the screen, who is asking, who is here, what I am writing down. The old screen mixed both into ten draggable boxes I then had to arrange myself. Now prep is a rail on the left, live is a rail on the right, and the day runs down the middle and appears nowhere else. One tab open per rail, because a rail showing four things at once is the grid again. The count rides on the tab, so a rail can say three people are asking without being opened. Numbers 1 through 9 jump straight to a tab and the number is printed on it. Backslash hides the prep rail; Teaching mode hides it and hands the room to the day. Deleted with the grid: dragging, spans, the Panels menu, hiding, collapsing, and the masonry that measured every panel on every resize."],
        ["The test now renders the dashboard, not just its panels", "It only ever reached the loading screen, so the entire component above the panels \u2014 layout, counts, every derived value \u2014 was untested, which is exactly where this year\u2019s crashes came from. Two things were in the way and both were worth fixing on their own account: class data only arrived through an effect, so the screen always started blank, and the session was picked in an effect too, so a class with eleven weeks of sessions rendered one frame of \u201cNo sessions on the calendar yet.\u201d Data is now held warm between visits and the session is derived. The test also fails a screen that renders cleanly but stops short."],
        ["Ten more, and three things I built got cut", "The week runs across the top as a row of days, each saying how much is on it, so picking a session is a glance rather than a menu \u2014 and the session dropdown is gone. The Class Clock panel is gone: both of its numbers moved into the strip, and a panel that repeats what sits above it costs me a read for nothing. To-Do is collapsed by default for the same reason. The topic is thirty pixels, because a wall display is read from where you are standing. Up next has become its own button, wide enough to hit without aiming, that puts the next unticked thing on the screen. Ambient counts \u2014 how much is in the day, how many are here, how many are asking, how much is assigned \u2014 sit under the topic the way a calendar carries the weather. Section headings became pills, because colour and shape group things and a grey word does not. The row controls grew. And the whole thing got rounder again."],
        ["Ten more, and the day can be ticked off", "Skylight's chore chart is the honest version of a progress bar, so the number on every row is a button: press it and the thing is done. Done rows fade and strike through, and the first one that is not done carries a ring, so the eye lands on what is next without reading the list. The bar across the top counts ticks rather than guessing from what I have cast, which is what it was doing. Every section says how much of itself is behind me. A link row wears its source, so I know what I am about to put on the wall without opening it. Start over clears the day. Minutes left in class sits next to minutes since they did anything. And everything got rounder and chunkier \u2014 eighteen on the cards, twelve on the rows, taller controls \u2014 because that calendar is a thing you press with a thumb."],
        ["Ten changes, aimed at a Skylight", "That calendar is built on information density with visual clarity, colour that stands for one thing, and a screen that answers a question from across the room. So: a snapshot strip across the top with the day, the topic, how far through the run of show I am, how long since the room did anything, and what is on the wall right now with a way to take it down. Warm neutrals, because the page was warm and every grey on it was cool. The flow at reading size rather than list size. The number sitting in a filled chip in the colour of what the row is, the same chip wherever that kind appears. A progress bar off the flow rather than the clock. The header cut back to the class and the way out, since the strip says the rest. Boxes gone from the sidebar. Bigger rows in both densities. The activity green darkened, because white on it was 3.77:1 and the number lives inside. And Teaching \u2014 \u2318E \u2014 which hides everything that is not the flow and the room screen."],
        ["The cards stopped being boxes", "Thirty-six labels were set in letterspaced uppercase mono, which turned every panel into a form. A label is a quiet word now. The border round every card, the rule under every header and the five boxes drawn round content inside them came off \u2014 a soft edge and a tinted surface do the separating, and the drag handle and the width control come back when the pointer is on the card. The panel title reads as a title rather than a field name."],
        ["One meaning per signal on the left edge", "A three-pixel stub of colour saying what kind of thing a row was read as an outline somebody forgot to finish. The left edge says one thing now: red for what is on the screen, the class colour for what I have clicked, nothing otherwise."],
        ["K and J, the way round I press them", "Down and up."],
        ["Ten changes to make Class Flow readable", "Every row is now the same height, so the eye runs the list instead of measuring each entry. The heading receded to grey, because colour on this screen means live or means press me and a heading is neither. The colour that says what a thing is moved to a three-pixel edge, calendar-style, and the number went neutral. The row I have clicked shows which one it is, since the card was describing something the list would not point at. Section headings stick while I scroll a long day. A dot marks anything from the library, so I know an edit here travels. Compact and comfortable rows, kept with the arrangement. J and K walk the run of show and Enter puts the row I am on up on the wall, both listed in the shortcut sheet. And Add is one box that tells a pasted link from a typed line, instead of asking me to pick first."],
        ["Clicking a thing tells me what it is", "The best space on the sidebar was holding two pickers for how a slide arrives on the screen \u2014 a decision I make once a term. It now holds whatever I last clicked in the flow: the name, what kind of thing it is, its headline, what it says, its concept and source, its tags, when I made it, every date it has been used on, which section it is in right now, and a way to open it. The transitions moved behind a control on the monitor."],
        ["Adding an idea to a section did nothing on a freeform day", "The chooser was only ever offered the sequence's own slots, so a day with no sequence had nothing in the list at all \u2014 the button opened onto an empty menu. It now builds the same list Class Flow draws from: the sequence's slots, then the ones I made, then anything left over from a sequence change. A freeform day went from offering nothing to offering three."],
        ["Numbers instead of dots", "A run of show is an order, so the rows count from the top of the day rather than starting again in each section. Knowing I am on seven of fourteen is the thing a number can tell me that a dot cannot, and the number carries the colour that used to be the dot \u2014 one mark doing both jobs."],
        ["Class Flow got quiet", "The research is blunt about this: a border round every row makes an interface read as a spreadsheet, and twenty pixels of space does the same separating without asking anyone to look at a line. So the rows have no border and no fill, the bordered mono badge on each one became a coloured dot, and the two controls stay out of sight until the pointer is on the row \u2014 or the keyboard is, which is the half of that pattern people forget. The section rule became space. What is left on the screen is the words that go on the wall, which is the only thing on that panel I actually read."],
        ["A section name now looks like a menu", "It had rename and delete behind it and no way to tell. A caret says the name opens something."],
        ["One step back", "Merge, delete a section and take a row out all happen instantly and mid-class. Every one of them snapshots the day first, and Undo in the panel header names what it will undo. It puts the day back exactly as it was, including removing a day that did not exist before the change."],
        ["Merge two sections", "Next to New section. Pick any two and it says which way round the merge goes before anything moves \u2014 whichever sits higher up the day keeps its name, the other empties into it and goes. Picking them in the wrong order still merges the right way, because the order is read off the day rather than off the two dropdowns."],
        ["A section name is a menu", "Rename or delete. Clicking it used to drop straight into a rename box, which meant there was no way to remove a section at all. Delete says how many things it is about to take with it. A sequence's own slots can be renamed but not removed, because they belong to the shape of the day rather than to me."],
        ["Four controls a row became a gesture", "Up, down, Move and a cross was four buttons on every single row to do two things. Dragging does both: dropped on a row it lands before that row, dropped on a section it lands at the end, and reordering inside a section and moving between them turn out to be the same write. Removing is rare and permanent, so it sits behind a right-click rather than waiting on every row to be caught by a sleeve."],
        ["There is one kind of thing now, and it is a section", "New section at the top, and the name I type is the heading. No Sections list, no After the main section as a separate idea, no reserved slots pretending to be sections. Three concepts became one. The four old ones in COMM 118 were converted first \u2014 3 freeform blocks and 1 After-the-main-section \u2014 so nothing had to be retyped."],
        ["Adding a section added a block", "A section is a container with a name and its own Add. It was making a single row instead, which is a block \u2014 so \u201cadd a section\u201d added a block, exactly as it looked. A section is a slot of its own now, which means it arrives with the library picker, notes, links, reordering and the rest already working, and an empty one stays on screen because an empty section is where the next thing goes."],
        ["A row can move to another section, or another day", "Up and down only ever moved a row inside its own section, so getting something from Sections to After the main section meant deleting it and adding it again. Move opens the same chooser everything else uses. It leaves where it was and arrives intact \u2014 same id, same headline, same pointer at whatever block it came from."],
        ["A row is a name, a tag, and two buttons", "It had the kind badge to the left of the title, a truncated URL underneath, and three text buttons on a line of their own \u2014 four things competing for the position the name should have had. Now: the name, the tag, a red arrow that puts it on the room screen, and Edit for the headline. Nothing else. Opening a link here did not disappear with the button, it moved onto the name, so a link still has its two doors without a fourth control on the row."],
        ["57 readings joined up with their blocks", "The readings already on the COMM 118 schedule were made before blocks existed, so a headline written on one stayed on that one day. Matched by web address, because the same reading has the same link. The 18 that did not match are Game and Headlines \u2014 activities rather than readings, with no block to be \u2014 and they were right to be left alone."],
        ["The build now checks for buttons wired to nothing", "The Save button that threw a headline away rendered perfectly and only failed when pressed, so neither of the existing guards could see it: one looks for components with no definition, the other for anything that throws on render. An on-something prop handed an empty function is almost always a stub somebody meant to come back to. It caught the bug it was written for, and one I did not know about \u2014 the up and down arrows on Sections could never have done anything. They reorder now."],
        ["A reading's headline follows the reading", "It was landing on the scheduled item, which meant it belonged to that one day. A reading pulled out of the Library keeps its block id, so the headline goes on the block instead: write it on Monday's copy and Wednesday's has it, along with every other day and every other class that reading turns up in. A one-off with no block behind it still keeps its own."],
        ["Save and Save and cast did nothing", "Two separate faults behind one dead button. Readings & Media was passing an empty function as its save handler, so writing a headline on a reading threw it away. And the check that a headline is a sentence returned silently when it was not, so \u201cMedia rights\u201d looked like a broken button rather than a rule. It saves now, and when it will not it says which of the two reasons it is."],
        ["Sections sit above the line on a freeform day", "On a freeform day the sections ARE the class, so they belong above the line that says the class is over rather than under it. On a sequence day they stay where they were, after the slots."],
        ["Two columns at every width", "Dropping to one column on a narrow window made every panel taller than the screen, which is the opposite of what the arrangement is for."],
        ["Cards sit under the card above them", "A grid puts every panel in a ROW, so a short panel beside a tall one left the space under it empty and the next panel started below the tall one's bottom edge. The rows are 8px now and each panel spans as many as its content needs, which puts it directly under its own neighbour. Measured with a ResizeObserver rather than guessed, because these panels change height while I use them \u2014 and done this way rather than with CSS columns, because a 2\u00d7 panel still has to be able to span both."],
        ["Readings & Media is a card", "It was a block inside Class Flow, which meant it could not be collapsed and it made the one panel I actually build in longer than a screen. Its own card, its own arrow, and it still writes the schedule students read."],
        ["Fold, without unpicking anything", "A freeform day carrying five sequence headers can merge them into one. Folding moves the items across as they are rather than converting them into something else \u2014 checked that ids, headlines, links and the pointer back to a block all survive it \u2014 because a tidy-up that quietly breaks transclusion is worse than the mess."],
        ["Changing the shape of a day stopped hiding it", "Only the slots the current sequence names were being drawn, so switching from the Motivated Sequence to freeform made everything vanish. The content was never gone \u2014 the store keeps every slot it has ever been given \u2014 it just stopped being on screen. Anything holding something renders now whatever shape the day is in, labelled as coming from another shape, so switching either way loses nothing."],
        ["After the main section said itself twice, and there were two coming ups", "The divider and the section it introduced were both printing the label. And the assignments due soon and the things I add by hand were two separate sections doing one job; they are one Coming up now."],
        ["The day note takes a day", "It followed the day picker, so writing next class's note meant going to next class first. The label is a picker."],
        ["Notes are edited where they are read", "The lesson plan and the notes for students had an Edit link that sent me to another page to change two textareas. They open in place now, and write the same fields the Schedule editor writes \u2014 so what I type on the dashboard is what students read on the schedule. An empty one shows as a button rather than hiding, so I can start one from here."],
        ["One chooser, everywhere something gets placed", "Ideas had its own inline slot picker and the library picker always dropped into the slot I opened it from. Both use the same menu now: every section by its own name, and which day \u2014 this one, the next class, or any other. Prepping Friday while sitting on Wednesday is the normal case rather than the exception."],
        ["One home per thing, per day", "A reading was showing under Readings and media AND under on-the-schedule-not-in-the-flow, because it was both at once: assigned for the day, and not in a slot. Readings and media is where a reading lives, so it comes out of the other list. Oct 7 went from five things needing attention to two, and the two are the activities that really were unplaced."],
        ["Add asks where, including which day", "It said add to the flow and dropped things into whatever slot came first. Now it opens a chooser: every section this day has, by the name I gave it, and the day \u2014 this one, the next class, or any other on the calendar. Half of what turns up on today's schedule is really for the next one, and moving it should not mean going to find that day first."],
        ["Ideas has a panel of its own", "Collapsed by default, and each idea can be edited, duplicated, deleted, or dropped into a named section \u2014 it asks which one rather than guessing. It was in Class Flow, which was the wrong home: it is the one thing on that panel not about the day I am looking at."],
        ["Stocked is gone", "All 54 things on its shelves are blocks now, and two holding pens for the same job is one too many. Its data is still in the store, untouched, in case that turns out to be wrong."],
        ["Class Poll and Student Questions", "Poll and Questions were doing a poor job of saying whose they were."],
        ["The poll takes answers in their own words", "No options means they write instead of picking, which is what the muddiest point, a one-minute paper, and anything the options would give away all need. While the floor is open the room screen shows the count and nothing else, because reading everyone else's answer is how you stop writing your own. When it closes they all go up, with names on, because this one is not anonymous and I want to be able to follow it up."],
        ["Every section header said the word overrideTitle", "A bare ternary sitting among JSX children is text, not a branch, so the header printed the word and then both halves of the choice. Made the same mistake twice in one session and swept the engine for others."],
        ["Ten teaching moves, and room to add", "Think-pair-share, muddiest point, the one-minute paper, peer instruction, fishbowl, jigsaw, gallery walk, this-or-that, devil's advocate, exit ticket \u2014 each with a line on how it actually runs. They are blocks like everything else, kept with me rather than with a class, so they are in all of them and clicking one puts it in the day. Seeded rather than left empty on purpose: the research on empty states is blunt that a blank box with a plus on it is the version that stops people starting, and three to five real examples is what gets them going."],
        ["After the main section and Also coming up both take things now", "They are slots with reserved keys, which means they got the library picker, notes, links, reordering and removal without a line of new code \u2014 the same rendering the sequence slots use, pulled out of its loop."],
        ["Readings and media", "Video and podcast alongside readings, each with its own colour, and all three write to the schedule the students read."],
        ["A line where the taught part of the class ends", "After the main section, and then the things that go around a class rather than through it."],
        ["Readings for the day, and the schedule is the same list", "What I put here is what students see under that date, and what was already assigned for that date is already here. Oct 7 opened with the three readings it already had. Adding one writes into the week the same field the Schedule editor writes, so there is one answer to what is assigned rather than two, and I can pull one straight out of the repository or type a new one."],
        ["Coming up", "Assignments due within three weeks of the day I am on, soonest first, with today and tomorrow in red. Not something I build \u2014 something the schedule already knew and this screen should say out loud before the room leaves."],
        ["The repository, where I am standing", "Add on any slot opens on Library, holding all 214 blocks COMM 118 can reach \u2014 its own 211 and the three that are mine. Search, then filter by what it is and what it is about: facets rather than folders, because a reading is a link AND about identity AND from last spring, and a folder makes you pick one."],
        ["A placed block is a link to it, not a copy of it", "Adding one writes a reference, so Class Flow shows whatever the block says now and writing a headline on it there writes it on the block \u2014 which means the same reading carries that headline into every other day it appears in. Placing it also stamps the date onto the block, so where a thing has been used is a question the block itself can answer."],
        ["Freeform day parts are Sections now", "Two things called blocks on one screen was never going to hold. The loose parts of a freeform day are Sections; a block is a thing in the repository."],
        ["Five repositories became one: 324 blocks", "Everything is a block now \u2014 note, link, story, activity, question, assignment, board, and set. Stored once and referenced wherever it is used, so editing it changes it on the day plan, the schedule and the room screen at the same time. COMM 118 has 211, COMM 4 has 92, COMM 2 has 18, and three stories that belong to me rather than to any class live in a shared store every class can see."],
        ["The dry run cut it from 437 to 324", "Taken at face value the sources produced 437 blocks, and then the numbers said otherwise: all 31 trivia-pool questions were already inside the trivia games, all 68 reading URLs were already in the library, and 40 of 41 stocked links were too. So the pool now REFERENCES the question blocks the games already made rather than copying them \u2014 one question, in three sets, edited once \u2014 and where a stocked item and a library item were the same link, the block kept the headline only the stocked copy had."],
        ["Topic tags came from the schedule", "The facet that makes two hundred blocks findable is the one I could not invent, and the schedule already knew it: where a thing sat is what it is about. 183 of 211 COMM 118 blocks are tagged, with the real week topics \u2014 the Livvy Dunne piece arrived tagged Athletes as celebrities without anyone typing it."],
        ["A collapsed panel did not look collapsed", "It emptied and kept its height. align-content places the grid as a whole; the items still stretched to their row, so a shut panel held the height of whatever tall thing sat beside it."],
        ["I wiped eleven weeks of COMM 2, and put them back", "Emptying scheduleWeeks in the config was meant to stop the template showing through. But COMM 2 inherits seedVersion 2 and its store was at 1, so the reseed effect fired on the next page load and pushed that empty array straight over eleven weeks of real schedule. Restored from the Spring source, which the port never writes to \u2014 which is the only reason it was still there. The effect can no longer overwrite real content with an empty seed."],
        ["The arrangement belongs to me, not to a class", "How I like the screen laid out is a fact about me rather than about COMM 118, so rearranging it once holds everywhere. One key instead of one per class, and the arrangement I already had on any class is read once to seed it rather than thrown away."],
        ["Panels collapse to their own bar", "An arrow on every panel title. Collapsed keeps the bar, so I can still see the panel is there and one click brings it back \u2014 which is different from hiding it, and the Panels menu now does both. Before & After, Poll, Questions, Attendance and the Class Clock start collapsed, because they are useful without being what I opened the screen for. Collapse travels with the arrangement, so a panel I shut stays shut in every class."],
        ["Now is the Class Clock", "It was never about now. It counts minutes since the room last had to produce something, and how long I have been in the current slot."],
        ["A freeform day could not be built, and was drawn as somebody else's shape", "Two bugs behind one complaint. The dashboard's sequence picker read config.sequences, which does not carry Freeform, so it was never on the list \u2014 and a day already set to freeform fell through find() to the first sequence and was drawn as the Motivated Sequence. Both now go through sequenceOptions. Blocks can be added and removed from the dashboard too, so a freeform day is buildable on the screen it gets taught from."],
        ["Blocks would not hold what I typed", "Every keystroke in a block title fired a full save, and each save runs a daily-backup check first. The echo guard only holds while a write is in flight, so an echo of an older save landed in the gap and put the earlier text back. Typing is local now and reaches the store when the typing stops."],
        ["The class switcher, on the class pages", "Instructor view only. A student in COMM 2 has no business being handed a dropdown of the other classes."],
        ["Notes for the day, in Day Plan", "The Schedule editor had them and the dashboard had them. Day Plan wrote the day note and never showed you the two week-level ones around it. All three are on it now, under the schedule block."],
        ["Claim became headline", "Everywhere it is written on screen. The stored field is still called claim, because renaming that means migrating every plan, shelf item and deck link that already has one."],
        ["Stocked stopped being a holding pen with one exit", "Each shelf says what it is for when it is empty, so the panel is no longer a box with a plus on it. Anything on a shelf can now go into the day as well as to the room \u2014 pick the slot on the row. And the Notes panel can put its last line on a shelf, which is where most of them were always going to come from: a thought that lands in the scratch box mid-class and needs somewhere to live afterwards."],
        ["COMM 2 and COMM 4 got their own term back", "Both were wearing COMM 999's content \u2014 Public Speaking claimed Week 1 was about the purpose of pro sports, with a roster of ten placeholder names. scripts/port-spring.mjs moves each one out of its old forked store and into the engine's shape: 11 weeks, 31 dates, every assignment, the real roster of 22 and 31. Old stores untouched, so the Spring hubs at /comm2/legacy and /comm4/legacy still work."],
        ["Each Spring day became a day plan", "The old hub kept a topic, a set of notes and a Canva link per DAY, which the engine has a better home for than the week does. So every Spring day arrives as its own day plan with its notes and its deck attached \u2014 31 of them a class \u2014 which is exactly what the Notes panel and Class Flow read."],
        ["The dry run caught me throwing away eight days a class", "The first version dropped any day flagged holiday. Ten days a class carry that flag, and they include \u201cSpecial Occasion Speeches\u201d with notes, \u201cWork on Ethics Bowl presentation\u201d, and days with an assignment due. Whatever the old hub meant by the flag, it did not mean nothing happened. Every dated day comes across now and the flag rides along as a note. One genuinely blank TBD is the only thing left behind."],
        ["I shipped a crash, and the guard that exists for it did not fire", "Taking out the two early returns took two variable declarations with them, and Class Flow threw on COMM 118. The build stayed green because an undeclared name is legal JavaScript until it runs \u2014 the same failure that took the room screen down on 23 August. check-refs was written that day and only looks at JSX components, so a plain variable walks past it."],
        ["So the build renders everything before it ships it", "npm run smoke renders every surface and every dashboard panel with react-dom/server and fails on a throw. No new dependency; react-dom was already here. It renders each panel twice, on an empty day and a full one, because today's crash only appeared on one of them \u2014 and the first version of this test passed the broken code, since <Dashboard/> on its own never gets past its loading screen when effects do not run. Reintroducing the bug now fails two cases and blocks the build."],
        ["Building only worked on a day that was already built", "Class Flow bailed out early when a day had nothing in it and rendered a line of text instead of the slots \u2014 so the Add buttons only ever appeared on a day that already had something in it, which is exactly the day I do not need them on. COMM 999 had two items in its opener and looked finished; COMM 118 had a plan with zero items and looked like the feature was missing. Same code, opposite behaviour, and I told him it was engine-wide and working before I checked. The slots render whether or not anything is in them now."],
        ["The day gets built here now, not somewhere else", "This screen is for building the day and casting it, and it could only cast. Every slot has an Add on it: a note I type, a seed searched out of the library, a link, or whatever the schedule already says is happening today \u2014 that last one drops into the slot I picked rather than the first one going. Slots can be renamed on the slot. Every row has move up, move down and remove. Empty slots show as empty rather than hiding, because an empty slot is where the next thing goes and you cannot add to a row that is not on the screen. The sequence picker sits at the top of the panel, so changing the shape of the day is one click rather than a trip to another page."],
        ["The layout says what matters", "Class Flow is first and full width. Attendance and the engagement clock were sharing the top of the page with the thing I actually open this screen to do, and they are useful without being that. Panels menu has a Reset arrangement now, because my old arrangement is saved in this browser and would have quietly outranked the new default."],
        ["Every note about a day, on the dashboard", "Notes were being written in two editors and landing in three fields, and the dashboard read one of them. The Scratch Pad is now the Notes panel and stacks all of it: the Lesson plan and the Notes for students, both written in the Schedule editor and until now visible nowhere near the room, then the day note from Day Plan, then the box I scribble in during class. Each written one has an Edit link back to where it came from. The day\u2019s own note sits at the top, tagged with the date, because it is the most specific thing on the panel and it was sitting below two week-level ones. The other two carry a \u201cthis week\u201d tag, because Lesson plan looked per-day and in fact repeats on all three days of the week. The student-facing one is called Notes for students on both screens now, because \u201cfree text for the week\u201d never said the thing that matters about it \u2014 students read it \u2014 and it only said that as placeholder text, which disappears the moment you type."],
        ["Claims stopped being cut off", "A claim is a full sentence, written once so the room can read it, and the dashboard was truncating it to one line with an ellipsis \u2014 the one thing this screen must not do to it. Titles, claims, the live label and the recent casts all wrap now. URLs and host names keep the ellipsis, because half a URL still reads as a URL."],
        ["The schedule and the day plan finally speak", "The schedule knew a reading was assigned on Wednesday and the day plan had never heard of it, so the reading lived on one screen and the plan for that day lived on another. Day Plan now lists what the schedule has for that day underneath the topic, and each one has a way into a slot. The dashboard shows the other half: anything on today's schedule that is not in the flow, in amber, with Open and Add to the flow on it. The To-Do panel counts them."],
        ["An item added this way keeps its link", "It comes across as a flow item with the reading's URL attached, so it is castable the moment it lands rather than needing the link typed again. It also keeps a pointer back to the schedule row, which is what makes it stop asking."],
        ["A day was worked out by counting", "The dashboard decided which weekday a date was by looking up its position in the week and indexing into Mon, Wed, Fri. Right for a class meeting exactly those days in that order, wrong for everything else, and COMM 3 has no meeting days set at all. It reads the date now."],
        ["The email sign-in never worked, and the PIN replaced it", "The magic link went nowhere and the email arrived with no code in it. Both were configuration inside the Supabase project rather than anything in this repo: the redirect address was not on its allowlist, and its mail template did not carry the token, so there was no six-digit code to send. One PIN replaces the whole arrangement."],
        ["The PIN is checked on the server, so it is not in the app", "A PIN compared in browser code is a PIN sitting in the bundle for anyone who opens devtools, which is no better than the unlisted URL it was meant to replace. /api/instructor-auth compares it against an environment variable, in constant time, with a second's delay on a wrong answer so guessing six digits is impractical. The browser only ever holds a PIN somebody typed."],
        ["The dashboards are actually gated now", "Every /<class>/dashboard asks before it renders, and the browser remembers once it is right, so the podium machine asks once and the laptop asks once. The room screen and the ask page stay open on purpose \u2014 one lives on a projector students look at, the other is where they are sent. Honest limit: the dashboard renders in the browser, so somebody determined can edit the page's own JavaScript to skip the check. Nobody can learn the PIN from the app, and nobody gets through the gate without it."],
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
    from: "Spring wk 1", note: "Gambling and changing American values. First-day goals seed. Capture what every student wants out of the class." },
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
    from: "Spring wk 6", note: "Required plus recommended readings: softball, winter sport, Norway. Guest questions collected in advance." },
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
              <li>Fall roster is not loaded. The engine is still carrying the ten-name template list.</li>
              <li>Decide whether the Interview Assignment stays at 5%; it was the smallest grade item and the earliest real signal about who's in the room.</li>
            </ul>
          </div>
        </Section>
      </main>
    </div>
  );
}
