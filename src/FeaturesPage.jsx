// Features: the site, shown and sold. One screenshot per feature with a
// short explanation beside each one, written in Andrew's voice for a room
// deciding between this and Canvas.
//
// Every picture is the real app, taken against a fixture of the COMM 118 fall
// class with the ten placeholder students the template class ships. Nothing
// here was drawn by hand. The Spring 2026 pictures are the old hub with that
// term's roster, which is the one term that has run on this software.
//
// The copy here is the one place on the site that sells rather than labels.
// Andrew asked for it in his voice, 2026-09-16, and gave the register: "students
// can choose between different themes ... this allows students a little bit of
// fun in the class."

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

const PITCH = [
  "I built Classes because Canvas is where assignments get turned in, and that's about all a student does there. Classes is where my class actually happens. Students see what's on the room screen right now, from their phones. They ask me questions during class without raising a hand, anonymously if they want. They vote, they argue with the person next to them, and they vote again. They play games in teams and watch the score on the projector. And when a grade comes in, the grade arrives as a card on their phone with a note from me.",
  "The other difference is that I can change Classes whenever my students want something. Last week I decided students should see every grade at once instead of one percentage, and that was on the site the same day. A card that says a challenge is due in 48 hours took an afternoon. With Canvas, you get what Canvas offers. With Classes, my students get what they ask for.",
];

// ─── what is on the page ───
// Each picture is a file under public/features. Phone pictures were taken at
// 390 by 844, the rest at 1440 by 900.

const STUDENTS = [
  { src: "s-home", phone: true, title: "Everything a student needs is on the home screen",
    body: ["What's on the room screen right now, the next class with the room and the time, a note from me, and what's due next. No menus to dig through. A student opens the site and knows what to do."] },
  { src: "s-anon", phone: true, title: "Students can ask me questions anonymously",
    body: ["There's a QR code on the room screen. A student scans the code, types the question, and ticks the box if they'd rather I didn't know who asked. The question lands on my dashboard during class and I answer out loud. Nobody has to raise a hand in front of 30 people."] },
  { src: "s-poll", phone: true, title: "Students can vote on questions",
    body: ["I put a question on the room screen and every student votes from their phone. The tally goes up on the projector as the votes come in. When the room splits, I have them talk to the person next to them and vote again, and everyone sees what moved."] },
  { src: "s-board", phone: true, title: "Discussion boards happen in class, on their phones",
    body: ["I cast a prompt to the room screen. Every student posts an answer from their phone, and every answer shows up on every phone, so everyone reads everyone. Quiet students write more than they'd ever say out loud."] },
  { src: "s-deck", phone: true, title: "Grades and assignments come as a deck of cards",
    body: ["When I release grades, the next time a student opens Classes they get a deck: one card per grade, with what the grade means and my comment. Tap through, done. The same deck tells a student when a challenge is due in the next 48 hours."] },
  { src: "s-schedule", phone: true, title: "The schedule has every reading, with the link",
    body: ["Every week, every reading, one tap to open. Drew's Picks are the ones I'd read first. Nobody has to ask me what's due Wednesday."] },
  { src: "s-challenges", phone: true, title: "Challenges show the due date and the weight",
    body: ["Every assignment on one screen, with its due date and how much of the grade it carries. Sit-Down 1 is 15% and Weekly Challenge 2 is 2.5%. Students can plan a week."] },
];

const THEMES = [
  { src: "s-home", title: "Clean" },
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

const TEACHERS = [
  { src: "t-dashboard", title: "The dashboard is where I run class",
    body: ["The day plan on the left, in sections with minutes. The room screen preview on the right. The shelf underneath, with every reading and activity for the term. I press Next and the next thing goes on the projector."] },
  { src: "t-room-poll", title: "The room screen shows whatever I cast",
    body: ["A prompt, a poll, a reading, a slide, a question a student just asked. Every screen carries the QR code, so a student who walks in late can join from the door."] },
  { src: "t-note", title: "I can send a student a card",
    body: ["Every student has a card, and I can post a note to one student from mine. The note shows up on their home screen the next time they open Classes, and they can write back. Every message a student sends me lands in one inbox."] },
  { src: "t-grade", title: "Grades are columns, and I release them all at once",
    body: ["I'm tired of deciding between a 91 and a 93. Did you do the work? Did you do the work well? A grade is a column, and a column is a word. I drag every card into a column, then I release the whole class at once. Nothing reaches a student until I press Release."] },
  { src: "t-bulk", title: "I can make bulk changes",
    body: ["Every reading, activity, question and board across every class lives in one repository. Select a batch and tag them, retype them, move them to another class, or share them across classes. 345 items on one screen."] },
  { src: "t-horn", title: "Around the Horn keeps a running tally",
    body: ["A seating chart I can tap. Drag names into seats, tap a seat to award points. The points go into the same log the leaderboard reads, so speaking up in class counts for something a student can see."] },
  { src: "sp-presenter", title: "We play games in class",
    body: ["Team trivia in COMM 118: seven teams, answers on phones, revealed one question at a time on the room screen. The winning team takes points onto the leaderboard."] },
];

const SPRING = [
  { src: "sp-pti", title: "Around the Horn ran all quarter in COMM 118",
    body: ["Spring 2026. Every student, their seat, their Around the Horn points in the corner of their card, and their leaderboard total underneath. I handed out 260 awards across the quarter."] },
  { src: "sp-leader", title: "A leaderboard for game points, separate from the grade",
    body: ["Game points came from the weekly game, This or That, Around the Horn and the Rotating Fishbowl. The top five on the leaderboard at the end of the quarter earned automatic A's. That's real."] },
];

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
.ft-phone{border-radius:32px;border:1px solid ${LINE};background:${CARD};overflow:hidden;box-shadow:0 1px 2px rgba(28,25,23,.06),0 12px 32px rgba(28,25,23,.08);aspect-ratio:390/844}
.ft-phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.ft-screen{border-radius:12px;border:1px solid ${LINE};background:${CARD};overflow:hidden;box-shadow:0 1px 2px rgba(28,25,23,.06),0 12px 32px rgba(28,25,23,.08)}
.ft-bar{display:flex;gap:6px;padding:10px 12px;background:${SUNK};border-bottom:1px solid ${LINE}}
.ft-bar i{width:10px;height:10px;border-radius:999px;background:${LINE};display:block}
.ft-screen img{display:block;width:100%;height:auto}
.ft-next{margin-top:16px;padding:28px 28px 24px;border-radius:16px;border:1px dashed ${LINE};background:${SUNK};max-width:72ch}
.ft-foot{margin-top:72px;padding-top:24px;border-top:1px solid ${LINE};display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;font-size:15px;color:${INK2}}
.ft-foot a{color:${ACCENT};font-weight:600;text-decoration:underline;text-underline-offset:3px;min-height:44px;display:inline-flex;align-items:center}
@media (max-width:900px){
  .ft-row-phone{grid-template-columns:240px minmax(0,1fr)}
  .ft-row-screen,.ft-row-themes{grid-template-columns:minmax(0,1fr)}
  .ft-h1{font-size:36px}
  .ft-pitch p{font-size:17px}
  .ft-h3{font-size:22px}
}
@media (max-width:560px){
  .ft-wrap{padding:32px 16px 64px}
  .ft-row-phone{grid-template-columns:minmax(0,1fr)}
  .ft-row-phone .ft-phone{max-width:280px}
  .ft-three{grid-template-columns:minmax(0,1fr);max-width:280px}
  .ft-next{padding:20px}
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
            <a href="#spring">Spring 2026</a>
            <a href="#next">What's next</a>
          </nav>
        </header>

        <Section id="students" title="For students">
          <div className="ft-rows">
            {STUDENTS.map(s => <Row key={s.src} {...s} />)}
            <div className="ft-row ft-row-themes">
              <div className="ft-three">
                {THEMES.map(t => (
                  <figure key={t.src}>
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
            {TEACHERS.map(s => <Row key={s.src} {...s} />)}
          </div>
        </Section>

        <Section id="spring" title="Spring 2026, COMM 118">
          <div className="ft-rows">
            {SPRING.map(s => <Row key={s.src} {...s} />)}
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
