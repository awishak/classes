// Progress: what was built on September 14 and 15, 2026, in one page with its links.
//
// The Brief (/plan) is the running record, one entry per session. This page is
// the long view of two days of work that ran together: the day plan, the room
// screen's slides, and the games rebuilt from the ground up. Every heading
// links to where the thing lives.

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
// ~/.claude/DESIGN.md
const INK = "#1c1917";
const INK2 = "#57534e";
const MUTED = "#6b655f";
const LINE = "#e3ded8";
const SOFT = "#f0edea";
const PAGE = "#fafaf9";
const CARD = "#ffffff";
const SUNK = "#f6f4f1";
const ACCENT = "#9f1239";
const OK = "#0f766e";
const WARN = "#b45309";

const SITE = "https://classes.andrewishak.com";
const REPO = "https://github.com/awishak/classes";
const DECKS = "https://github.com/awishak/decks";

const A = ({ href, children }) => (
  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
    style={{ color: ACCENT, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>{children}</a>
);

const Tag = ({ tone, children }) => (
  <span style={{ alignSelf: "flex-start", fontFamily: MONO, fontSize: 13, fontWeight: 500, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap",
    color: tone === "ok" ? OK : tone === "warn" ? WARN : INK2, background: tone === "ok" ? "#ecf6f4" : tone === "warn" ? "#fdf5ea" : SUNK }}>{children}</span>
);

const Area = ({ id, title, links, children }) => (
  <section id={id} style={{ background: CARD, borderRadius: 16, boxShadow: `0 0 0 1px ${LINE}`, padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px 16px", justifyContent: "space-between" }}>
      <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h2>
      {links ? <span style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 15 }}>{links}</span> : null}
    </div>
    {children}
  </section>
);

const List = ({ items }) => (
  <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, color: INK2, fontSize: 17, lineHeight: 1.5 }}>
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);

const COMMITS = [
  ["79c0f5f", "The drawer saves what you type"],
  ["eb576bd", "Activities sort by kind, and questions sit inside their game"],
  ["228bc28", "A row is the header of its block, and a day's notes sit under the day"],
  ["fd1a4f7", "The day plan reads as a document, with a slide beside each block"],
  ["5a250ca", "The students' schedule follows the day plan, and a deleted week can come back"],
  ["639156f", "The day plan is a document you type into"],
  ["78a6bb7", "Items carry their notes, notes can be dragged, links go on the room screen"],
  ["9a04010", "Links in a line can be pressed, kinds can be chosen, notes can have slides"],
  ["ae25759", "Slash menu, @, Teach, section times and dragging, templates and history"],
  ["ef9b8e8", "Slide templates on the room screen, on paper or slate"],
  ["06bc0b3", "Choose clipping or picture for an article's slide; Run the game is Games"],
  ["72c5508", "Games: run from the class site, one answer per row"],
  ["deca6a4", "Games link in the More tab"],
  ["c287657", "Games: a sidebar of games, stats per game, Save before Open"],
  ["c0003b1", "Games: the approval stream"],
  ["0ba0b75", "Games in the day plan come from the game panel"],
  ["dd251f2", "Games page wears the same top bar as everywhere else"],
  ["319c330", "Run a game for a class or section, and run it again"],
];

export default function ProgressPage() {
  if (typeof document !== "undefined") document.title = "Progress · Classes";
  return (
    <div style={{ minHeight: "100vh", background: PAGE, color: INK, fontFamily: F, padding: "clamp(16px, 4vw, 48px) clamp(16px, 4vw, 32px) 64px" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap" />
      <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        <header style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: MUTED }}>September 14 and 15, 2026</span>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05 }}>Progress</h1>
          <p style={{ margin: 0, fontSize: 20, lineHeight: 1.5, color: INK2, maxWidth: "62ch" }}>
            Two days of work on the class site: the day plan became a document, the room screen got slide templates, and the games were rebuilt so no student's answer can undo another's.
          </p>
          <span style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 15 }}>
            <A href={SITE + "/comm118/dashboard"}>COMM 118 dashboard</A>
            <A href={SITE + "/comm118/games"}>Games</A>
            <A href={SITE + "/comm118/today"}>Room screen</A>
            <A href={SITE + "/comm118"}>Class site</A>
            <A href={SITE + "/plan"}>The Brief</A>
          </span>
        </header>

        <Area id="now" title="Where things stand">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div style={{ background: SUNK, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <Tag tone="ok">Live</Tag>
              <span style={{ fontSize: 17, lineHeight: 1.5, color: INK2 }}>Everything on this page is deployed. The last deploy was commit <A href={REPO + "/commit/319c330"}>319c330</A>, with decks <A href={DECKS + "/releases/tag/v0.5.0"}>v0.5.0</A>. Database migrations 001 to 005 have run.</span>
            </div>
            <div style={{ background: SUNK, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <Tag tone="warn">Waiting on you</Tag>
              <List items={[
                <>A test run of a game, signed in with your email, with a student account in a private window.</>,
                <>Turn the six fall game sets into draft games: <code style={{ fontFamily: MONO, fontSize: 15 }}>node node_modules/.sets-to-games.mjs --write</code> (close dashboard tabs first).</>,
                <>Deny spring's wrong trivia answers: <code style={{ fontFamily: MONO, fontSize: 15 }}>node node_modules/.deny-spring-wrong.mjs --write</code></>,
                <>Add sections to the COMM 3 roster, so a run for 8:00 only reaches the 8:00 students.</>,
              ]} />
            </div>
            <div style={{ background: SUNK, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <Tag>Next</Tag>
              <List items={[
                <>Game scores into the gradebook, and released answers shown to students.</>,
              ]} />
            </div>
          </div>
        </Area>

        <Area id="games" title="Games, rebuilt" links={<>
          <A href={SITE + "/comm118/games"}>Open Games</A>
          <A href={DECKS + "/blob/main/GAMES.md"}>The plan (GAMES.md)</A>
          <A href="https://claude.ai/code/artifact/4f4b0eed-99b0-4d90-a9b6-62e519e2b4cc">Game Panel mockups</A>
          <A href={DECKS}>decks on GitHub</A>
        </>}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: INK2 }}>
            Spring's COMM 118 game kept every answer inside one record for the whole class, and each phone saved that whole record, so two students answering at once meant one wiped out the other. Games now live in the decks package, shared across projects, and every answer is its own row that only its student can write. Twenty-one database rules enforce closing, time limits and no going back.
          </p>
          <List items={[
            <><b>On the phone.</b> One question at a time. Tap an answer, then Submit, with no going back. Please review sits in the corner. Multiple choice or free-form, alone or as a team, with an optional clock that reads "5 min". A card comes up over the class site when you run a game, with "I agree not to leave this window during this event" and Start, and the game also sits in Community.</>,
            <><b>The game panel.</b> A list of games down the left of every screen. The Games table shows each game's day plan days, questions, last run, how many finished and the average. Setup builds questions with images and the answers to accept, teams, time, a closing time and gradebook.</>,
            <><b>Running a game.</b> Run picks a class or a section (COMM 3 at 8:00 and 10:30 are separate), and each run keeps its own questions, answers, closing and releases. Rerun for the next section or next term without touching the last one. An answer approved in one run carries into the next.</>,
            <><b>During a run.</b> All questions and Scores with the average, updating as answers arrive. Click a question for how many picked each answer and how many of those asked for review, and accept a different answer with a preview of what changes. Close asks first. After closing: Run, Release scores, Release answers and Take it later.</>,
            <><b>The approval stream.</b> Free-form answers that match no right answer come in oldest first, repeats grouped with a count, close spellings marked. Approve or Deny decides every matching answer, with Undo and a Names switch. Waiting answers stay out of scores.</>,
            <><b>On the room screen.</b> Time left and how many submitted, then Spread of scores and All questions with labelled axes, a question opened with its answers, and team standings. No student names on the wall.</>,
            <><b>In the day plan.</b> The games built in Games are the only games a day can hold: /game, @, or the drawer's Activities shelf. A game row shows the game's ticket slide and appears on the student schedule.</>,
            <><b>Spring's games.</b> All nine, with 1,398 answers, moved into Games as closed history.</>,
          ]} />
        </Area>

        <Area id="dayplan" title="The day plan is a document" links={<A href={SITE + "/comm118/dashboard"}>Open the dashboard</A>}>
          <List items={[
            <>Sections, items and notes you move through with the arrow keys, like a Google Doc. Items carry their notes when dragged; notes drag on their own.</>,
            <>A slide beside every section and item, in a column you can hide. Teach shows one thing at a time with its slide.</>,
            <>The slash menu lists every command; @ finds anything in the library. Commands read without articles: Put on screen, Edit, Create slide.</>,
            <>Time ranges on sections ("5-10 min") with the day's total, sections you can drag, templates to save and start a day, and history of earlier versions.</>,
            <>Links in a line can be pressed and put on the room screen; click an item's kind to change the kind.</>,
            <>The drawer saves what you type, sorts activities by kind, and tucks game questions inside their game.</>,
            <>Your Spring 2026 notes moved onto fall days, and a day's notes sit under the day.</>,
          ]} />
        </Area>

        <Area id="slides" title="Slides on the room screen" links={<>
          <A href={SITE + "/comm118/today"}>Room screen</A>
          <A href="https://claude.ai/code/artifact/bb5c5eb5-dea1-419a-ba92-5f70c9fc93fa">Room Slides canvas</A>
        </>}>
          <List items={[
            <>A template for every kind of item: section, item, article, video, image, podcast, book chapter, quote, activity, Headlines, game, question, board and assignment.</>,
            <>Only words you wrote: every piece of text is read off the item, and nothing sits in the corners. Links sit on the words that name the thing.</>,
            <>Paper or slate for each class, notes on a slide when the item asks, and Use clipping or Use picture for an article.</>,
          ]} />
        </Area>

        <Area id="students" title="What students see" links={<A href={SITE + "/comm118"}>Class site</A>}>
          <List items={[
            <>The schedule shows games, Headlines, readings and assignments in date order with their sources, and follows the day plan instead of a separate list.</>,
            <>A deleted week can come back.</>,
            <>Games, Schedule and Room screen in the More menus, and the games page wears the same top bar as everywhere else.</>,
          ]} />
        </Area>

        <Area id="commits" title="Every deploy" links={<A href={REPO + "/commits/main"}>All commits</A>}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {COMMITS.map(([sha, what]) => (
              <div key={sha} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "8px 0", boxShadow: `0 1px 0 ${SOFT}` }}>
                <a href={REPO + "/commit/" + sha} target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 15, color: ACCENT, flex: "none" }}>{sha}</a>
                <span style={{ fontSize: 17, color: INK2 }}>{what}</span>
              </div>
            ))}
          </div>
        </Area>

      </div>
    </div>
  );
}
