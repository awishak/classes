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
const MUTED = "#9ca3af";
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

// ─── what is built, and what is not ───
const BUILT = [
  ["Dashboard", "/comm118/dashboard", "The surface I open to teach. Drag-to-arrange panels: Now, Class Flow, Before & After, Stocked, Questions, Attendance, Scratch Pad, Assignments. Arrangement saves per class."],
  ["Classroom View", "/comm118/today", "The room screen, one unlisted URL per class. Idle board with a live QR, cast content, blackout. F for fullscreen."],
  ["Casting", "", "Click anything on the dashboard and it lands on the room screen. Click it again and it comes back down. Cmd+B blacks the screen out, same key PowerPoint has used for twenty years."],
  ["Ask", "/comm118/ask", "Where the QR sends students. Two ways in: name and PIN, or an emailed sign-in link. Questions arrive on my dashboard, confidential by default, anonymous if they choose. I can push one back to the room screen."],
  ["Class engine", "", "One shared codebase renders any class from a config object. COMM 118 is thirty lines of identity on top of it. A new class is a new file, not a fork."],
];

const NEXT = [
  ["Live poll (Peer Instruction)", "Pose a question, everyone commits on their phone, show the spread, they argue, re-vote, show what changed.",
   "The single strongest finding in the research. Mazur's cycle produces large conceptual gains, and questions where 35–70% get it right the first time generate the best argument. Every piece already exists: Ask is the student device, the room screen is live, the cast bus syncs."],
  ["Time since they did anything", "Replace the countdown to 9:05 with a counter that resets whenever the room does something.",
   "Wilson and Korn showed the ten-minute attention span is a myth built on secondary sources. Attention doesn't decay on a clock, it decays when nothing is asked. The honest number is not minutes elapsed."],
  ["Claim, not title", "Make the cast field a full sentence. Not \"Media rights\" but \"The rights fee, not the ticket, is what the league actually sells.\"",
   "Alley's assertion-evidence work: students recall a principle from a sentence headline better than the same principle inside a bullet list. The room screen already renders one big line — it is built for a claim and we are feeding it labels."],
  ["Sweep-back opener", "Pull two or three questions from last week's day plans into a four-minute opening quiz.",
   "Distributed practice and practice testing are the top two techniques across 242 studies and 169,000 participants. This is the cheapest possible way to run both."],
  ["Fewer bullets on the boards", "Cap the pre/post boards at three lines, or reveal them one at a time.",
   "Mayer's coherence and segmenting principles. I built those boards to take a bullet list, which is the pattern the evidence argues against."],
  ["Around the Horn board", "The rotating in-class board gets its own panel and its own room screen, instead of living in my head.",
   "It already carries participation weight in COMM 118. If it is graded it should be visible."],
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
            Still to come on the instructor side: the <b>fast grading flow</b> (a submission at a time, grade,
            comment, auto-advance), the <b>instructor-only student page</b> (photo, where they're from, their stated
            goals, every grade and comment across the quarter), and the <b>AI day planner</b> — deliberately parked
            until the surfaces around it are right.
          </p>
        </Section>

        <Section id="next" eyebrow="Proposed" title="What I'd build next, and why">
          <p style={p}>
            These came out of reading what the evidence actually says about presenting and teaching. Each one is a
            change to the software, not just advice.
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
