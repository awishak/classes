// Worktopia, shown: a public page for people outside the class, at
// /worktopia. Andrew's account of why a terminal rather than a document, in
// his words (2026-10-01, spelling fixed, nothing added), and screenshots of
// the real thing, taken on the harness with the COMM 999 test student. Same
// register and tokens as the features page.
//
// Every picture is a file under public/worktopia, taken at 1100 by 900 on a
// laptop width and 390 by 844 on a phone.

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
// ~/.claude/DESIGN.md
const INK = "#1c1917";
const INK2 = "#57534e";
const MUTED = "#6b655f";
const LINE = "#e3ded8";
const PAGE = "#fafaf9";
const CARD = "#ffffff";
const ACCENT = "#1e40af"; // COMM 118's blue, 8.7:1 on white

const fonts = <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />;

// Andrew, 2026-10-01: "focus on: one way I use AI is as a software developer
// to help students engage with material ..."
const PITCH = [
  "One way I use AI is as a software developer, to help students engage with material.",
  "For a weekly assignment, students are asked to consider what kinds of jobs will be available in the year 2034. Instead of asking them to turn in a document, I created a job terminal that students engage with.",
  "This terminal feels like a game to students, is more memorable, and also allows me to quickly summarize their answers on the backend, which leads to good classroom discussion the next day.",
  "On top of that, I get to have fun by peppering the game process with jokes and fun easter eggs.",
];

// What is on the page: a picture and what it shows. The captions describe
// the screen; the pitch above is the only place that sells.
const SHOTS = [
  { src: "intro", title: "It starts with a story", w: 1100, h: 1500,
    body: "Before the terminal loads, a page catches the student up on the eight years between now and 2034: the ads a model wrote, the draft a model ran, the buyouts, the single filing, the end of job postings. The last line is the question under the whole assignment: what will you bring to this job that would be better than if we simply let AI do it?" },
  { src: "record", title: "Worktopia looks you up", w: 1100, h: 900,
    body: "The terminal boots, asks for a name, and finds the student on the Brady-Manning Work Index: a seventeen-digit number, one thing they like, one thing they dislike. Then it draws them as text, from the photograph on their class card, or, for a student without one, a face made from their name." },
  { src: "assignment", title: "The first job is a bad job", w: 1100, h: 900,
    body: "Worktopia assigns a position before it asks anything. Escalator Step Polisher. Postgame Toilet Inspector. Human Cannonball for the Cannonball Games. The student can accept, and get another one, or decline, and be asked what they actually want." },
  { src: "positions", title: "Three positions, six questions each", w: 1100, h: 1700,
    body: "The title is looked up in an index of a thousand jobs in sports, from athletes and coaches to turf scientists, oddsmakers and customs brokers. Then the skills, what they bring that a model cannot, why they personally, the duties, and the value to the sports ecosystem in 2034. Every answer is saved the moment it is sent." },
  { src: "update", title: "Your Sports Subscription has been updated", w: 1100, h: 700,
    body: "Three times in the run, at points the student's name picks, an update arrives: a ticket bought for the big game between the Green Bay Quackers and the Las Vegas Algorithms, seat number your couch; a new monthly price with access to the FDM Marketplace; a personal frisbee unlocked for the weekend, until its ground magnet reactivates. The details differ for every student." },
  { src: "coworkers", title: "Who would you work with", w: 1100, h: 900,
    body: "The industry questions, then the class roster as buttons: up to four co-workers, or none. A meeting date, a star rating and a review of Worktopia. Then the file is submitted and Worktopia's system will get back to them." },
  { src: "phone", title: "On a phone", phone: true, w: 390, h: 844,
    body: "Most students do it on their phones. The terminal is the same machine at that width: one column, the answer box docked at the bottom, the buttons the size of a thumb." },
  { src: "review", title: "The backend", w: 1100, h: 900,
    body: "Every answer is a row in a table, saved the moment it is sent. The morning after, I open a student's file and read the whole conversation they had, from the first assignment to the review, and I see who has submitted. That is what I bring to class." },
];

// A picture and its caption. A phone picture sits beside its caption when
// there is room and above it when there is not.
function Shot({ s }) {
  return (
    <section style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start", marginBottom: 56 }}>
      <figure style={{ margin: 0, flex: s.phone ? "0 1 390px" : "1 1 100%", maxWidth: "100%", border: "1px solid " + LINE, borderRadius: 12, overflow: "hidden", background: CARD, boxShadow: "0 1px 2px rgba(28,25,23,0.06)" }}>
        <img src={"/worktopia/" + s.src + ".jpg"} alt={s.title} loading="lazy" width={s.w} height={s.h} style={{ display: "block", width: "100%", height: "auto" }} />
      </figure>
      <div style={{ flex: "1 1 300px", maxWidth: 640 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{s.title}</h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, margin: 0, color: INK2 }}>{s.body}</p>
      </div>
    </section>
  );
}

export default function WorktopiaPage() {
  return (
    <div style={{ minHeight: "100vh", background: PAGE, color: INK, fontFamily: F, WebkitFontSmoothing: "antialiased" }}>
      {fonts}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 16px 80px" }}>
        <p style={{ fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, margin: "0 0 10px", fontWeight: 500 }}>COMM 118 · Communication and Sport · Fall 2026</p>
        <h1 style={{ fontSize: 44, fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>Worktopia</h1>
        <div style={{ maxWidth: 720, marginBottom: 56 }}>
          {PITCH.map((p, i) => <p key={i} style={{ fontSize: i === 0 ? 22 : 18, lineHeight: 1.55, margin: "0 0 14px", color: i === 0 ? INK : INK2, fontWeight: i === 0 ? 500 : 400 }}>{p}</p>)}
          <p style={{ fontSize: 15, color: MUTED, margin: "18px 0 0" }}>Andrew Ishak. The pictures below are the real terminal, run as a test student.</p>
        </div>
        {SHOTS.map(s => <Shot key={s.src} s={s} />)}
        <p style={{ fontSize: 15, color: MUTED, borderTop: "1px solid " + LINE, paddingTop: 20, margin: 0 }}>
          Built on <a href="/features" style={{ color: ACCENT }}>Classes</a>, the site that runs these courses.
        </p>
      </div>
    </div>
  );
}
