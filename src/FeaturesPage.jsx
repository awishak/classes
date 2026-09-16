// Features: the site, shown and sold. One screenshot per feature with a
// short explanation beside each one, written in Andrew's voice for a room
// seeing the site for the first time. The dashboard, the room screen and the
// repository get a gallery of full-width pictures instead of one.
//
// Every picture is the real app, taken against a fixture of the COMM 118 fall
// class with the ten placeholder students the template class ships. Nothing
// here was drawn by hand. The Spring 2026 pictures are the old hub with that
// term's roster, which is the one term that has run on this software. The
// grade of D and its comment are invented, at Andrew's request, to show what
// a rough grade does.
//
// The copy here is the one place on the site that sells rather than labels.
// Andrew asked for it in his voice, 2026-09-16, and gave the register: "students
// can choose between different themes ... this allows students a little bit of
// fun in the class." The conversation at the bottom is quoted from the session
// logs, verbatim.

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
// ~/.claude/DESIGN.md
const INK = "#1c1917";
const INK2 = "#57534e";
const MUTED = "#6b655f";
const LINE = "#e3ded8";
const PAGE = "#fafaf9";
const CARD = "#ffffff";
const SUNK = "#f6f4f1";
const ACCENT = "#1e40af"; // COMM 118's blue, 8.7:1 on white

const fonts = <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" />;

// ─── the pitch ───

// Andrew, 2026-09-16: "i want better teaching and learning experiences. i
// want it to be more robust and fun and be mine and i want to explore
// possibilities."
const PITCH = [
  "I built Classes because I wanted better teaching and learning experiences, for my students and for me. I wanted something more robust and more fun than what I had. I wanted the site to be mine. And I wanted to explore the possibilities.",
  "Everything below is on the site now, running for COMM 118 this fall. Students see what's on the room screen from their phones, ask me questions during class, vote, play games in teams, and get their grades as cards with a note from me. I run class from one screen. And when my students want something new, I can build the new thing the same week.",
];

// ─── what is on the page ───
// Each picture is a file under public/features. Phone pictures were taken at
// 390 by 844, the rest at 1440 by 900.

const STUDENTS = [
  { src: "s-home2", phone: true, title: "Everything a student needs is on the home screen",
    body: ["The next class, with the room, the time, a note from me and the readings for that day. Then what's due, then the class. No menus to dig through. A student opens the site and knows what to do."] },
  { src: "s-anon", phone: true, title: "Students can ask me questions during class",
    body: ["A student types a question from their phone and it lands on my dashboard while I'm teaching. They can put their name on the question or send it without one. I answer out loud, and nobody had to raise a hand in front of 30 people."] },
  { src: "s-poll", phone: true, title: "Quizzes, votes and polls, on their phones",
    body: ["I put a question on the room screen and every student answers from their phone. A poll shows the tally on the projector as the votes come in. A quiz gets scored. When the room splits on a question, I have them argue with the person next to them and vote again."] },
  { src: "s-board", phone: true, title: "Discussion boards",
    body: ["A prompt from me and an answer from everyone, and everyone reads everyone. Most boards run between classes. Sometimes I cast one to the room screen and we do the board live, and the quiet students write more than they'd ever say out loud."] },
  { src: "s-deck", phone: true, title: "Decks are the front page's messages",
    body: ["When something needs a student's attention, that thing is the first screen they see: a card, one at a time, tap through. A grade came in. A challenge is due in 48 hours. A note from me. Then the site."] },
  { src: "s-challenge", phone: true, title: "A rough grade comes with a meeting link",
    body: ["This grade is made up, but this is what happens. A D, an F or an Incomplete puts a link to book a meeting with me into the challenge's conversation, automatically, right under my comment. The student can write back in the same thread."] },
  { src: "s-challenges", phone: true, title: "The challenges page",
    body: ["Every challenge for the term. Each one opens to its own conversation: what the student turned in, what I said about the work, and the grade."] },
  { src: "s-schedule2", phone: true, title: "Readings, by day",
    body: ["Every reading on the day I assigned it, with the link. Drew's Picks are the ones I'd read first."] },
];

const THEMES = [
  { src: "s-home2", title: "Clean" },
  { src: "s-home-snap", title: "Snapchat" },
  { src: "s-home-crash", title: "Crashing Out" },
];
const THEMES_TITLE = "Students can choose between different themes";
const THEMES_BODY = [
  "This is the one place a student gets to mess with the site. Clean is the default, and follows the phone after dark. Snapchat has stories and a streak. Crashing Out has a marquee of every Super Bowl, NBA Finals and World Series result since 1990, stickers down both edges, and a class leader who talks to whoever is looking.",
  "This allows students a little bit of fun in the class, and gives them some control over how their class looks.",
];

const LAPTOP = { src: "s-home-desktop", title: "Classes also works on a laptop",
  body: ["Same site, two columns. Open a card and the full page opens beside the cards."] };

// The dashboard and the room screen get a gallery: several full-width pictures
// under one heading, one line under each.
const DASHBOARD = {
  title: "The dashboard is where I run class",
  body: ["The day plan on the left, in sections with minutes. Every row gets a slide beside it, made from the row itself. The room screen preview on the right, with Next. The shelf underneath, with every reading and activity for the term."],
  shots: [
    { src: "t-dashboard", line: "The day plan on paper. I type the day the way I'd write a Google Doc, and the slides come with the typing." },
    { src: "d-slate", line: "The same day on slate." },
    { src: "d-teach", line: "Teach mode: one row at a time, the slide big, Put on screen, and Next." },
    { src: "t-term", line: "Plan the quarter: every week and every day in one outline. 13 of 32 days built." },
    { src: "t-map", line: "The map: what kind of day each day is, what's due, and how many slides and readings are on it." },
  ],
};

const ROOM = {
  title: "The room screen shows whatever I cast",
  body: ["A section title, an item with its notes, a reading with where it's from, a poll, a discussion prompt, a question a student just asked. Every screen carries the QR code, so a student who walks in late can join from the door."],
  shots: [
    { src: "r-section", line: "A section title, on paper." },
    { src: "r-item", line: "An item and its notes, on slate." },
    { src: "r-article", line: "A reading, with the site that published the reading." },
    { src: "t-room-poll", line: "A live poll, with the count of votes in." },
  ],
};

const REPO = {
  title: "All my class items in one place",
  body: ["345 items across five classes: readings, activities, questions, boards, book chapters, videos. Easy to assign to a day, easy to search, easy to change in bulk. And the repository checks my links for me."],
  shots: [
    { src: "t-links", line: "98 links checked, 15 broken. A Moved answer carries the new address, and a Refused answer is a paywall rather than a dead page." },
    { src: "t-bulk", line: "Three items selected: tag the three, retype the three, move the three to another class, or share the three across classes." },
  ],
};

const GAMES = {
  title: "We play games in class",
  body: ["The way I administer a game: pick the questions from the repository, mark the right answer on each, run the game, score the week. The points land on the leaderboard."],
  shots: [
    { src: "sp-week1", line: "Week 1's game in COMM 118, scored." },
    { src: "sp-presenter", line: "Team trivia on the projector: seven teams, answers revealed one question at a time." },
  ],
};

const TEACHERS = [
  { src: "t-note", title: "I can send a student a card",
    body: ["Every student has a card, and I can post a note to one student from mine. The note shows up on their home screen the next time they open Classes, and they can write back. Every message a student sends me lands in one inbox."] },
  { src: "t-grade", title: "Grades are columns, and I release them all at once",
    body: ["I'm tired of deciding between a 91 and a 93. Did you do the work? Did you do the work well? A grade is a column, and a column is a word. I drag every card into a column, then I release the whole class at once. Nothing reaches a student until I press Release."] },
  { src: "t-horn", title: "Around the Horn keeps a running tally",
    body: ["A seating chart I can tap. Drag names into seats, tap a seat to award points. The points go into the same log the leaderboard reads, so speaking up in class counts for something a student can see."] },
];

// What the AI does. Andrew, 2026-09-16: "what is AI doing for me here that
// would make others go, i really want to use this as well?"
const AI = {
  title: "What the AI does for me",
  intro: "Every one of these is a thing I would have done by hand, or would never have done at all.",
  items: [
    ["Checks my links.", "98 links in COMM 118 alone. The checker tells me which ones are gone, which ones moved, and which ones only refuse robots and still open for a person."],
    ["Makes simple slides right away.", "I type the day plan and every row has a slide beside it, on paper or slate. I'm not slide-based, and now I don't have to be."],
    ["Compiles quiz scores.", "Every answer is its own row. The game is scored the moment I close a question, and the points land on the leaderboard without me adding anything up."],
    ["Makes seating charts.", "Around the Horn: drag names into seats, tap a seat to award points."],
    ["Moves entire pieces of a class from one quarter to another.", "83 readings, 11 weeks, 6 assignments, 50 trivia questions and every note I wrote in the spring came across to the fall in one afternoon. The conversation is below."],
  ],
  next: "Next: a Review button on every quiz question, so a student can flag the one they want to go over and I know which questions were toughest before we go through the answers.",
};

// The actual conversation, from the session logs, verbatim. Each turn is a
// list of paragraphs: quoted speech, so the copy check does not read them as
// the site's own words.
const SPRING = {
  title: "From spring to fall: the actual conversation",
  intro: "COMM 118 ran in the spring on the old hub. Here is how the class moved onto the new hub, in my words and the AI's, quoted from the logs.",
  turns: [
    { who: "Andrew", when: "August 23", text: ["I also want you to use the COMM 118 class as a template. can you access what we did in the spring, and use that to fill in what we would do in class this fall?"] },
    { who: "Andrew", when: "August 24", text: ["could you take all the stuff i have currently saved in my comm 118 class and port it over here? articles, links etc"] },
    { who: "Claude", when: "August 24", text: ["Ported. Reload the dashboard and it's all there. Readings: 83, with URLs, notes, and their required / recommended / fishbowl level. Assignments: 6, with weights, Google Doc links, descriptions, due times, and the interview rubric. Weeks: 11, topics and per-day structure on Fall dates. Week items: 75. Your admin notes: every week's prep notes. Trivia pool: 50 questions. Headline categories: all 21."],
      more: ["What I deliberately left behind: everything attached to Spring people. The 30-student roster, 87 grades, 137 submissions, 534 log entries, PINs, bios, discussion board posts, seat assignments. That's last term's class."] },
    { who: "Andrew", when: "September 14", text: ["where are all my notes from Spring 2026"] },
    { who: "Claude", when: "September 14", text: ["All of them came across into the new app. I checked every note against the new records and none are missing. COMM 118: 15 instructor notes and 13 notes students saw. They were copied into the fall class and merged by week number, so Spring week 3's notes sit on Fall week 3."] },
    { who: "Andrew", when: "September 14", text: ["okay so how would i find the notes i put on lets say week 2 day 12"] },
    { who: "Claude", when: "September 14", text: ["Spring week 2, day 1 was Monday Apr 6. You only wrote a note for students that day: \"I'm off to Austin and San Diego with my daughter, Please see your to-do list on the home page.\" What I'd change: put each note back on its own day."],
      more: ["Three changes: put each Spring note back on its own day, show the day's notes under the Flow, and show a note's content under its row where you can edit it."] },
    { who: "Andrew", when: "September 15", text: ["Okay so let's look at it this way. Week 5 will be about sports media, meaning weeks 2-4 are about sports media, Week 8 will be about youth sports participation (solving the crisis of either high costs of youth sports, or lack of youth sports options for high schoolers), so weeks 5-7 will be about coaching, youth sports, team comm, etc. weeks 8 and 9 will be about identity and politics, but man that's not a lot of time. i think we focus on kaepernick and sports and politics. what about the NCAA? shoot. not sure how to fit all this stuff in. i have to cut some things as main ideas and just touch on them elsewhere. maybe we talk about race and gender in the middle section of class. okay figure this out then ask me the questions again, one at a time, with options"] },
    { who: "Andrew", when: "September 15", text: ["hmm. i want game 1 in week 1. so maybe we assign that gambling reading in week 1 wednesday anyway. game 2 is good in week 2. let's find a better time for game 5 / delete game 6. game 9 is fine where you have it, for now. wtf did you move my WCs around. WC1 is aussie rules football, due the first sunday of class. WC2 not sure yet. WC3 is former coach interview. WC4 is leadership guide in week 9"] },
    { who: "Claude", when: "September 15", text: ["Game 1 back in week 1. The gambling readings stay on Wed Sep 23 with Klosterman, so all six reading questions are on one day. But I'd cut the required list to Are You Not Entertained?, the NCAA prop-bets piece, and My Year as a Degenerate Sports Gambler. Twelve readings on one Wednesday is a day nobody reads."] },
  ],
  result: { title: "What changed", lines: [
    "Media in weeks 1 to 4, youth sports and Sit-Down 1 in week 5, informal play and coaching in 6, teams in 7, Sit-Down 2 in 8, power in 9, the Field Guide in 10 and 11.",
    "Every day titled. 53 readings moved and none lost. Six duplicate readings and six markers for assignments that no longer exist taken off.",
    "Every spring note sits under its fall day with the same weekday, 23 days of them, where I can read them while I plan.",
  ] },
  shots: [
    { src: "sp-schedule", line: "Spring 2026, week 1, on the old hub." },
    { src: "d-date", line: "Fall 2026, the whole quarter, on the new hub." },
  ],
};

const NEXT = { title: "Next: connected assignments",
  body: [
    "In COMM 118 the Sit-Down 1 memo feeds Sit-Down 1, and the Field Guide topic feeds the Field Guide. Right now they're separate rows. Connected, a student opens Sit-Down 1 and sees the memo they wrote and my comment on the memo right there. I open two assignments side by side in Grade view and grade the second with the first in view. And a comment on the first can carry forward into the second.",
    "We haven't built this yet. That's the next thing.",
  ] };

// ─── pieces ───

const Eyebrow = ({ children }) => (
  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em" }}>{children}</div>
);

function Section({ id, title, children }) {
  return (
    <section id={id} className="ft-section">
      <h2 className="ft-h2">{title}</h2>
      {children}
    </section>
  );
}

const Body = ({ title, body }) => (
  <div className="ft-text">
    <h3 className="ft-h3">{title}</h3>
    {body.map((p, i) => <p key={i} className="ft-p">{p}</p>)}
  </div>
);

// A phone: the picture inside a rounded frame at the phone's own proportions.
const Phone = ({ src, title }) => (
  <div className="ft-phone">
    <img src={"/features/" + src + ".jpg"} alt={title} loading="lazy" width={390} height={844} />
  </div>
);

// A laptop: a browser bar with three dots, and the picture under it.
const Screen = ({ src, title }) => (
  <div className="ft-screen">
    <div className="ft-bar"><i /><i /><i /></div>
    <img src={"/features/" + src + ".jpg"} alt={title} loading="lazy" width={1440} height={900} />
  </div>
);

// One feature: the picture, and the words beside the picture.
function Row({ src, phone, title, body }) {
  return (
    <div className={"ft-row " + (phone ? "ft-row-phone" : "ft-row-screen")}>
      {phone ? <Phone src={src} title={title} /> : <Screen src={src} title={title} />}
      <Body title={title} body={body} />
    </div>
  );
}

// A gallery: the words first, then full-width pictures with a line under each.
function Gallery({ title, body, shots }) {
  return (
    <div className="ft-gallery">
      <Body title={title} body={body} />
      {shots.map(s => (
        <figure key={s.src} className="ft-fig">
          <Screen src={s.src} title={s.line} />
          <figcaption className="ft-cap">{s.line}</figcaption>
        </figure>
      ))}
    </div>
  );
}

// One turn of the conversation.
function Turn({ who, when, text, more }) {
  const mine = who === "Andrew";
  return (
    <div className={"ft-turn " + (mine ? "ft-turn-andrew" : "ft-turn-claude")}>
      <div className="ft-turn-who">{who} · {when}</div>
      {[...text, ...(more || [])].map((t, i) => <p key={i} className="ft-turn-text">{t}</p>)}
    </div>
  );
}

const CSS = `
.ft-root{min-height:100vh;background:${PAGE};color:${INK};font-family:${F};-webkit-font-smoothing:antialiased}
.ft-wrap{max-width:1180px;margin:0 auto;padding:48px 20px 80px}
.ft-head{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}
.ft-h1{margin:0;font-size:48px;font-weight:600;letter-spacing:-.03em;line-height:1.05}
.ft-pitch{max-width:68ch;display:flex;flex-direction:column;gap:14px}
.ft-pitch p{margin:0;font-size:20px;line-height:1.5;color:${INK}}
.ft-nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.ft-nav a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid ${LINE};border-radius:12px;background:${CARD};color:${INK};font-size:15px;font-weight:600;text-decoration:none}
.ft-nav a:hover{border-color:${ACCENT};color:${ACCENT}}
.ft-section{margin-top:72px;scroll-margin-top:24px}
.ft-h2{margin:0 0 8px;font-family:${MONO};font-size:13px;font-weight:500;color:${MUTED};text-transform:uppercase;letter-spacing:.12em}
.ft-rows{display:flex;flex-direction:column;gap:56px;margin-top:16px}
.ft-row{display:grid;gap:32px 40px;align-items:center}
.ft-row-phone{grid-template-columns:300px minmax(0,1fr)}
.ft-row-screen{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}
.ft-row-themes{grid-template-columns:minmax(0,3fr) minmax(0,2fr)}
.ft-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.ft-three figure{margin:0;display:flex;flex-direction:column;gap:8px}
.ft-three figcaption{font-size:15px;font-weight:600;text-align:center}
.ft-text{display:flex;flex-direction:column;gap:10px;min-width:0}
.ft-h3{margin:0;font-size:26px;font-weight:600;letter-spacing:-.02em;line-height:1.15}
.ft-p{margin:0;font-size:17px;line-height:1.55;color:${INK2}}
.ft-gallery{display:flex;flex-direction:column;gap:24px}
.ft-gallery .ft-text{max-width:72ch}
.ft-fig{margin:0;display:flex;flex-direction:column;gap:10px}
.ft-cap{font-size:15px;color:${INK2};line-height:1.45}
.ft-phone{border-radius:32px;border:1px solid ${LINE};background:${CARD};overflow:hidden;box-shadow:0 1px 2px rgba(28,25,23,.06),0 12px 32px rgba(28,25,23,.08);aspect-ratio:390/844}
.ft-phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.ft-screen{border-radius:12px;border:1px solid ${LINE};background:${CARD};overflow:hidden;box-shadow:0 1px 2px rgba(28,25,23,.06),0 12px 32px rgba(28,25,23,.08)}
.ft-bar{display:flex;gap:6px;padding:10px 12px;background:${SUNK};border-bottom:1px solid ${LINE}}
.ft-bar i{width:10px;height:10px;border-radius:999px;background:${LINE};display:block}
.ft-screen img{display:block;width:100%;height:auto}
.ft-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:14px;max-width:72ch}
.ft-list li{font-size:17px;line-height:1.55;color:${INK2}}
.ft-list li b{color:${INK};font-weight:600}
.ft-chat{display:flex;flex-direction:column;gap:12px;max-width:76ch;margin-top:8px}
.ft-turn{border-radius:16px;padding:16px 20px;display:flex;flex-direction:column;gap:6px}
.ft-turn-andrew{background:${CARD};border:1px solid ${LINE};margin-right:48px}
.ft-turn-claude{background:${SUNK};margin-left:48px}
.ft-turn-who{font-family:${MONO};font-size:13px;font-weight:500;color:${MUTED};text-transform:uppercase;letter-spacing:.08em}
.ft-turn-text{margin:0;font-size:17px;line-height:1.5;color:${INK}}
.ft-result{margin-top:24px;padding:24px;border-radius:16px;border:1px solid ${LINE};background:${CARD};max-width:76ch;display:flex;flex-direction:column;gap:10px}
.ft-result ul{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px}
.ft-result li{font-size:17px;line-height:1.5;color:${INK2}}
.ft-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:24px}
.ft-next{margin-top:16px;padding:28px 28px 24px;border-radius:16px;border:1px dashed ${LINE};background:${SUNK};max-width:72ch}
.ft-foot{margin-top:72px;padding-top:24px;border-top:1px solid ${LINE};display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;font-size:15px;color:${INK2}}
.ft-foot a{color:${ACCENT};font-weight:600;text-decoration:underline;text-underline-offset:3px;min-height:44px;display:inline-flex;align-items:center}
@media (max-width:900px){
  .ft-row-phone{grid-template-columns:240px minmax(0,1fr)}
  .ft-row-screen,.ft-row-themes,.ft-pair{grid-template-columns:minmax(0,1fr)}
  .ft-h1{font-size:36px}
  .ft-pitch p{font-size:17px}
  .ft-h3{font-size:22px}
  .ft-turn-andrew{margin-right:16px}
  .ft-turn-claude{margin-left:16px}
}
@media (max-width:560px){
  .ft-wrap{padding:32px 16px 64px}
  .ft-row-phone{grid-template-columns:minmax(0,1fr)}
  .ft-row-phone .ft-phone{max-width:280px}
  .ft-three{grid-template-columns:minmax(0,1fr);max-width:280px}
  .ft-next{padding:20px}
  .ft-turn-andrew,.ft-turn-claude{margin:0}
}
@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

export default function FeaturesPage() {
  return (
    <div className="ft-root">
      {fonts}
      <style>{CSS}</style>
      <div className="ft-wrap">
        <header className="ft-head">
          <Eyebrow>classes.andrewishak.com</Eyebrow>
          <h1 className="ft-h1">Classes</h1>
          <div className="ft-pitch">
            {PITCH.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <nav className="ft-nav">
            <a href="#students">For students</a>
            <a href="#teachers">For teachers</a>
            <a href="#ai">What the AI does</a>
            <a href="#spring">Spring to fall</a>
            <a href="#next">What's next</a>
          </nav>
        </header>

        <Section id="students" title="For students">
          <div className="ft-rows">
            {STUDENTS.map(s => <Row key={s.src} {...s} />)}
            <div className="ft-row ft-row-themes">
              <div className="ft-three">
                {THEMES.map(t => (
                  <figure key={t.title}>
                    <Phone src={t.src} title={t.title} />
                    <figcaption>{t.title}</figcaption>
                  </figure>
                ))}
              </div>
              <Body title={THEMES_TITLE} body={THEMES_BODY} />
            </div>
            <Row {...LAPTOP} />
          </div>
        </Section>

        <Section id="teachers" title="For teachers">
          <div className="ft-rows">
            <Gallery {...DASHBOARD} />
            <Gallery {...ROOM} />
            {TEACHERS.slice(0, 2).map(s => <Row key={s.src} {...s} />)}
            <Gallery {...REPO} />
            <Row {...TEACHERS[2]} />
            <Gallery {...GAMES} />
          </div>
        </Section>

        <Section id="ai" title="What the AI does">
          <div className="ft-text" style={{ maxWidth: "72ch" }}>
            <h3 className="ft-h3">{AI.title}</h3>
            <p className="ft-p">{AI.intro}</p>
            <ul className="ft-list">
              {AI.items.map(([head, rest]) => <li key={head}><b>{head}</b> {rest}</li>)}
            </ul>
            <p className="ft-p">{AI.next}</p>
          </div>
        </Section>

        <Section id="spring" title="Spring to fall">
          <div className="ft-text" style={{ maxWidth: "72ch" }}>
            <h3 className="ft-h3">{SPRING.title}</h3>
            <p className="ft-p">{SPRING.intro}</p>
          </div>
          <div className="ft-chat">
            {SPRING.turns.map((t, i) => <Turn key={i} {...t} />)}
          </div>
          <div className="ft-result">
            <h3 className="ft-h3" style={{ fontSize: 20 }}>{SPRING.result.title}</h3>
            <ul>{SPRING.result.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
          <div className="ft-pair">
            {SPRING.shots.map(s => (
              <figure key={s.src} className="ft-fig">
                <Screen src={s.src} title={s.line} />
                <figcaption className="ft-cap">{s.line}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section id="next" title="What's next">
          <div className="ft-next">
            <Body title={NEXT.title} body={NEXT.body} />
          </div>
        </Section>

        <footer className="ft-foot">
          <span>Andrew Ishak, Santa Clara University</span>
          <a href="/">The site</a>
        </footer>
      </div>
    </div>
  );
}
