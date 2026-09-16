// Features: the site, shown. Screenshots of every surface, for a room that has
// not seen the app.
//
// Every picture is the real app, taken against a fixture of the COMM 118 fall
// class with the ten placeholder students the template class ships. Nothing
// here was drawn by hand. The Spring 2026 pictures are the old hub with that
// term's roster, which is the one term that has run on this software.
//
// The words are kept to labels: the name of the surface, and one line saying
// what the picture shows. The pictures do the talking.

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

// ─── what is on the page ───
// Each picture is a file under public/features. `phone` pictures were taken at
// 390 by 844, the rest at 1440 by 900.

const STUDENTS = [
  { src: "s-home", title: "Home", line: "What is on the room screen, the next class, and what is due." },
  { src: "s-ask", title: "Ask", line: "A question from a phone, signed or anonymous." },
  { src: "s-board", title: "Discussion", line: "The prompt on the screen, and every answer on every phone." },
  { src: "s-schedule", title: "Schedule", line: "Every week and every reading, each with a link." },
  { src: "s-challenges", title: "Challenges", line: "Every assignment, with a due date and a weight." },
  { src: "s-class", title: "Class", line: "Your card, the roster and the instructor." },
];

const THEMES = [
  { src: "s-home-snap", title: "Snapchat" },
  { src: "s-home-crash", title: "Crashing Out" },
];

const TEACHERS = [
  { src: "t-dashboard", title: "Dashboard", line: "The day plan, the room preview and the shelf on one screen." },
  { src: "t-room", title: "Room screen", line: "The projector. One QR code puts the prompt on every phone." },
  { src: "t-grade", title: "Grade view", line: "Every student as a card, sorted into a column, released all at once." },
  { src: "t-repo", title: "Repository", line: "Every reading, activity and item across every class." },
  { src: "t-horn", title: "Around the Horn", line: "The seating chart. Tap a seat to award points." },
];

const SPRING = [
  { src: "sp-roster", title: "Roster", line: "COMM 118, Spring 2026: 29 students, their teams and their hometowns." },
  { src: "sp-leader", title: "Leaderboard", line: "Game points across a term." },
];

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

function Caption({ title, line }) {
  return (
    <div className="ft-cap">
      <div className="ft-cap-title">{title}</div>
      {line ? <div className="ft-cap-line">{line}</div> : null}
    </div>
  );
}

// A phone: the picture inside a rounded frame at the phone's own proportions.
function Phone({ src, title, line }) {
  return (
    <figure className="ft-fig">
      <div className="ft-phone">
        <img src={"/features/" + src + ".jpg"} alt={title} loading="lazy" width={390} height={844} />
      </div>
      <Caption title={title} line={line} />
    </figure>
  );
}

// A laptop: a browser bar with three dots, and the picture under it.
function Screen({ src, title, line }) {
  return (
    <figure className="ft-fig">
      <div className="ft-screen">
        <div className="ft-bar"><i /><i /><i /></div>
        <img src={"/features/" + src + ".jpg"} alt={title} loading="lazy" width={1440} height={900} />
      </div>
      <Caption title={title} line={line} />
    </figure>
  );
}

const CSS = `
.ft-root{min-height:100vh;background:${PAGE};color:${INK};font-family:${F};-webkit-font-smoothing:antialiased}
.ft-wrap{max-width:1180px;margin:0 auto;padding:48px 20px 80px}
.ft-head{display:flex;flex-direction:column;gap:12px;margin-bottom:48px}
.ft-h1{margin:0;font-size:48px;font-weight:600;letter-spacing:-.03em;line-height:1.05}
.ft-sub{font-size:20px;color:${INK2};line-height:1.4;max-width:52ch;margin:0}
.ft-nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.ft-nav a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid ${LINE};border-radius:12px;background:${CARD};color:${INK};font-size:15px;font-weight:600;text-decoration:none}
.ft-nav a:hover{border-color:${ACCENT};color:${ACCENT}}
.ft-section{margin-top:64px;scroll-margin-top:24px}
.ft-h2{margin:0 0 20px;font-size:26px;font-weight:600;letter-spacing:-.02em}
.ft-phones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px 24px}
.ft-themes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:32px 24px}
.ft-screens{display:grid;grid-template-columns:minmax(0,1fr);gap:40px}
.ft-fig{margin:0;display:flex;flex-direction:column;gap:12px;min-width:0}
.ft-phone{border-radius:32px;border:1px solid ${LINE};background:${CARD};overflow:hidden;box-shadow:0 1px 2px rgba(28,25,23,.06),0 12px 32px rgba(28,25,23,.08);aspect-ratio:390/844}
.ft-phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.ft-screen{border-radius:12px;border:1px solid ${LINE};background:${CARD};overflow:hidden;box-shadow:0 1px 2px rgba(28,25,23,.06),0 12px 32px rgba(28,25,23,.08)}
.ft-bar{display:flex;gap:6px;padding:10px 12px;background:${SUNK};border-bottom:1px solid ${LINE}}
.ft-bar i{width:10px;height:10px;border-radius:999px;background:${LINE};display:block}
.ft-screen img{display:block;width:100%;height:auto}
.ft-cap-title{font-size:17px;font-weight:600;letter-spacing:-.01em}
.ft-cap-line{font-size:15px;color:${INK2};line-height:1.45;margin-top:2px}
.ft-foot{margin-top:72px;padding-top:24px;border-top:1px solid ${LINE};display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;font-size:15px;color:${INK2}}
.ft-foot a{color:${ACCENT};font-weight:600;text-decoration:underline;text-underline-offset:3px;min-height:44px;display:inline-flex;align-items:center}
@media (max-width:860px){
  .ft-phones,.ft-themes{grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 16px}
  .ft-h1{font-size:32px}
  .ft-sub{font-size:17px}
}
@media (max-width:520px){
  .ft-wrap{padding:32px 16px 64px}
  .ft-phones,.ft-themes{grid-template-columns:minmax(0,1fr)}
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
          <h1 className="ft-h1">Features</h1>
          <p className="ft-sub">The class site from a student's phone and from the instructor's laptop. Every picture is the real app with placeholder students.</p>
          <nav className="ft-nav">
            <a href="#students">For students</a>
            <a href="#teachers">For teachers</a>
            <a href="#spring">Spring 2026</a>
          </nav>
        </header>

        <Section id="students" title="For students">
          <div className="ft-phones">
            {STUDENTS.map(s => <Phone key={s.src} {...s} />)}
          </div>
        </Section>

        <Section id="themes" title="Every student picks a theme">
          <div className="ft-themes">
            {THEMES.map(s => <Phone key={s.src} {...s} />)}
            <Phone src="s-home" title="Clean" />
          </div>
        </Section>

        <Section id="laptop" title="The same site on a laptop">
          <div className="ft-screens">
            <Screen src="s-home-desktop" title="Home" />
          </div>
        </Section>

        <Section id="teachers" title="For teachers">
          <div className="ft-screens">
            {TEACHERS.map(s => <Screen key={s.src} {...s} />)}
          </div>
        </Section>

        <Section id="spring" title="Spring 2026">
          <div className="ft-screens">
            {SPRING.map(s => <Screen key={s.src} {...s} />)}
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
