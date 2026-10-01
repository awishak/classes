// Worktopia: a worksheet that is a work management system in the year 2034.
//
// COMM 118's worksheet for the week of 2026-10-05. Andrew, 2026-10-01: "it's
// the work management system that assigns you to your job." The student reads
// an intro about 2034, then sits at a terminal run by FRANCHISE DYNASTY MEDIA INC.,
// the one company that owns all media and all sports. Worktopia looks them up
// on the Brady-Manning Work Index, draws them as text, assigns them a horrible
// job until they decline one, takes three positions with Andrew's questions on
// each, an evaluation, three questions about the industry, the classmates they
// would work with, a meeting date, and a review. Then the file is submitted,
// and Worktopia's system gets back to them. Earlier brief, 2026-10-01: "a white
// screen that beeps ... you enter an answer then it kind of thinks and then
// gives you an answer back."
//
// Plain DOM, like the worksheets package's sheet.js: mountWorktopia(root, opts)
// draws into root and returns { destroy }. Nothing here touches the window at
// import, so the smoke run can load the module. The store (worktopia/store.js)
// keeps every answer as its own row the moment the student sends it, so a
// reload replays what is on file and picks up at the first open question.
//
// The questions are Andrew's words (2026-10-01). The intro is his skeleton
// with Claude's fill, marked below. Worktopia's other lines are placeholders
// for him to edit; the jokes (the record, the likes and dislikes, the company,
// the horrible jobs) are his idea and Claude's wording.

import { JOBS, HORRIBLE, horribleFor, findJob } from "./jobs.js";

export const WORKTOPIA_KEY = "worktopia";
export const WORKTOPIA_TITLE = "Worktopia";

// FRANCHISE DYNASTY MEDIA INC.: the companies that own sports and the screens sports
// are watched on, which in 2034 are one company. Andrew, 2026-10-01: "one big
// media conglomerate that holds all media, all sports, all that stuff." One
// company a letter, Chiquita Banana included on his say-so (2026-10-01).
export const COMPANY = "FRANCHISE DYNASTY MEDIA INC.";
export const COMPANY_LETTERS = [
  ["F", "Fox"], ["R", "RedBird"], ["A", "Amazon"], ["N", "Netflix"], ["C", "Comcast"], ["H", "Hulu"], ["I", "Ineos"], ["S", "Sky"], ["E", "ESPN"],
  ["D", "Disney"], ["Y", "YouTube"], ["N", "Nike"], ["A", "Apple"], ["S", "Sinclair"], ["T", "TKO"], ["Y", "YES Network"],
  ["M", "Meta"], ["E", "Emirates"], ["D", "DAZN"], ["I", "iHeart"], ["A", "Anthropic"],
  ["I", "IMG"], ["N", "NBC"], ["C", "Chiquita Banana"],
];

// The intro, read before Worktopia loads. Andrew's skeleton, 2026-10-01: "its
// the year 2034. (catch people up on what's going on). over the last eight
// years, a few things have happened. AI has... media has... sports media in
// particular has... that's led to the consolidation of decisions in the
// employment process to one product: Worktopia. Worktopia is a ... that ...
// and now, you get your chance to experience Worktopia in the year 2034."
// The sentences he wrote are kept as written; the rest is Claude's fill for
// him to replace.
export const INTRO = [
  "It's the year 2034.",
  "Over the last eight years, a few things have happened.",
  // The story. Andrew, 2026-10-01: "make up a story. don't just say media
  // has collapsed into a bunch of owners. don't just say 'they own every NFL
  // team and the other leagues.' tell a dystopian story and use details."
  "In 2027, a model wrote the entire Super Bowl ad slate for a beer company over a weekend, and the ads tested better than the agency's. By the next spring, every team's marketing department was two people and a login.",
  "In 2028, the Jaguars let a model run their draft. It took a punter in the first round. He made the Pro Bowl. The next year, thirty-one teams let a model run their draft, and the one that didn't went 2-15.",
  "The models wrote the contracts, set the schedules, cut the highlights, called the games in forty languages, and produced the first draft of everything a human then signed.",
  "Then the humans who signed things started selling. Fox bought Sinclair. Amazon bought Fox. Comcast and Disney merged on a Tuesday. In 2031, the whole stack closed in a single filing: the leagues, the networks, the streams, the stadiums and the phones they play on, under one name, " + COMPANY + " The last line of the deal was a banana company. Nobody knows why. It is still there.",
  // The Quackers: Andrew, 2026-10-01, "AI even renamed one of the teams from
  // the Packers to the Quackers, and their duck-themed merch became the most
  // popular team merchandise in the world."
  COMPANY + " owns every NFL team. It bought the Packers from the people of Green Bay for one share each. The next week, an AI renamed them the Quackers, and their duck-themed merch became the most popular team merchandise in the world.",
  "The NBA went next, for a streaming bundle and a lunch. Baseball was thrown in to close the Disney deal. The NHL came with Comcast, and nobody noticed for a month. Then the rest: every channel, every stream, every stadium down to the parking lots, every jersey, every ticket and the app the ticket lives in, and the banana company, which now sponsors the seventh-inning stretch.",
  "Sports media stopped posting jobs in 2032. There is no application, no interview, no offer. There is a file on you, built from everything you ever posted, bought, watched or skipped, and a system that reads it.",
  "That's led to the consolidation of decisions in the employment process to one product: Worktopia.",
  "Worktopia is a work management system that assigns you to your job. It reads your file, weighs your case and decides. It has never been wrong. It says so on the login screen.",
  // The hint. Andrew, 2026-10-01: "what you should hint at on this first
  // page, and also in the skills questions: what will you bring to this job
  // that would be better than if we simply let AI do it?"
  "Worktopia will ask what you want to do. As you answer, keep one question in mind: what will you bring to this job that would be better than if we simply let AI do it?",
  "And now, you get your chance to experience Worktopia in the year 2034.",
];

// The workgroup meeting. Andrew, 2026-10-01: "you will meet with your new
// workgroup Wed Oct 21 during class, Thursday October 22 at 9 am, or Friday
// October 23 during class."
export const MEETINGS = [
  { key: "WED", label: "Wednesday, October 21, during class" },
  { key: "THU", label: "Thursday, October 22, at 9 am" },
  { key: "FRI", label: "Friday, October 23, during class" },
];

// The parts the Sports Subscription updates are built from, picked by the
// name. The teams are 2034's.
const TEAMS = ["Green Bay Quackers", "Las Vegas Algorithms", "Austin Bananas", "Jacksonville Punters", "Portland Streamers", "Miami Bundle", "Seattle Login", "Denver Cloud", "Toronto Buffering", "Phoenix Dynamic Pricing", "Nashville Paywalls", "Boston Terms of Service", "Chicago Autoplay", "Houston Push Notifications", "Atlanta Free Trial", "Dallas Firmware"];
const WHENS = ["next Sunday", "Saturday afternoon", "Thursday night", "next Monday at 5:15 am Pacific", "Sunday at noon", "tonight"];
const SEATS = ["your couch", "your kitchen table", "the floor of your living room", "your roommate's couch", "a folding chair in the garage", "the front seat of your car", "the bathtub", "your bed, upright"];
const COSTS = ["150", "175", "199", "212", "240", "89", "310", "149.99"];
const PRICES = ["$249.99", "$199.99", "$279.99", "$349.99", "$229.99", "$299.99", "$259.99"];
const MARKET = ["where you can buy access to sports games", "where you can buy access to sports games, one quarter at a time", "where you can buy access to sports games and the right to remember them", "where you can buy access to sports games, replays sold separately", "where you can buy access to sports games, and the sound is extra", "where you can buy access to sports games, overtime not included"];
const OBJECTS = [["frisbee", "throw", "ground magnet"], ["basketball", "dribble", "deflation valve"], ["football", "spiral", "ground magnet"], ["tennis racket", "serve", "handle lock"], ["bicycle", "pedal stroke", "wheel lock"], ["running shoes", "mile", "lace lock"], ["kayak", "paddle", "hull anchor"], ["skateboard", "push", "wheel brakes"], ["soccer ball", "kick", "deflation valve"], ["golf clubs", "swing", "bag lock"], ["volleyball", "serve", "deflation valve"], ["surfboard", "wave", "leash lock"]];
const WHOS = ["your friends", "your cousins", "your co-workers", "your roommates", "your group chat", "your friends from high school"];
const WHERES = ["go to the beach", "go to the park", "go to the lake", "go to the backyard", "go to the courts", "go up the hill", "go to the river"];
const HOURS = ["48", "36", "24", "72", "12", "60"];

const N_JOBS = 3;
const LETTERS = ["A", "B", "C"];
const ORDINAL = ["first", "second", "third"];
const MAX_COWORKERS = 4;
const FONTS = "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Share+Tech+Mono&display=swap";

// One white look, on purpose: the brief is a white screen that glows. The
// page around the terminal still follows the student's theme; the terminal
// itself is the same by day and by night, the way a screen in a room is.
export const CSS = `
.jb { --jb-paper: #f7f9fd; --jb-panel: #ffffff; --jb-grid: rgba(37, 99, 235, 0.06); --jb-ink: #0a1024; --jb-dim: #5c6680; --jb-rule: #d6ddec;
  --jb-bot: #1d4ed8; --jb-cyan: #0891b2; --jb-glow: rgba(29, 78, 216, 0.28); --jb-soft: #eaf0ff; --jb-ok: #047857; --jb-warn: #b45309;
  --jb-mono: 'Share Tech Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; --jb-display: 'Orbitron', 'Share Tech Mono', ui-monospace, sans-serif;
  color-scheme: light; background: var(--jb-paper);
  background-image: radial-gradient(ellipse at 50% -10%, rgba(29, 78, 216, 0.10), transparent 55%), linear-gradient(var(--jb-grid) 1px, transparent 1px), linear-gradient(90deg, var(--jb-grid) 1px, transparent 1px);
  background-size: 100% 100%, 32px 32px, 32px 32px; color: var(--jb-ink); font-family: var(--jb-mono); font-size: 16px; line-height: 1.55; -webkit-font-smoothing: antialiased; }
.jb * { box-sizing: border-box; }
.jb [hidden] { display: none !important; }
.jb .term { max-width: 860px; margin: 0 auto; min-height: calc(100vh - 56px); display: flex; flex-direction: column; padding-inline: 16px; padding-block: 14px 0; }
.jb .intro { max-width: 720px; margin: 0 auto; padding: 48px 16px 64px; display: flex; flex-direction: column; gap: 22px; }
.jb .intro .year { font-family: var(--jb-display); font-weight: 900; font-size: clamp(34px, 8vw, 64px); letter-spacing: 0.08em; color: var(--jb-bot); line-height: 1; text-shadow: 0 0 24px var(--jb-glow); margin: 0 0 8px; }
.jb .intro p { margin: 0; font-size: 18px; line-height: 1.6; text-wrap: pretty; }
.jb .intro p.last { color: var(--jb-bot); }
.jb .intro .power { margin-top: 18px; }
.jb .bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 10px 16px; border: 1px solid var(--jb-rule); border-bottom: 0; background: var(--jb-panel);
  font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--jb-dim); box-shadow: 0 1px 0 var(--jb-rule); }
.jb .bar .name { font-family: var(--jb-display); font-weight: 900; font-size: 15px; letter-spacing: 0.22em; color: var(--jb-ink); }
.jb .bar .name small { font-weight: 500; color: var(--jb-cyan); font-size: 13px; margin-left: 10px; letter-spacing: 0.2em; }
.jb .bar .light { width: 9px; height: 9px; border-radius: 50%; background: var(--jb-rule); flex: none; }
.jb .bar .light.on { background: var(--jb-ok); box-shadow: 0 0 0 3px rgba(4,120,87,0.16), 0 0 10px rgba(4,120,87,0.5); }
.jb .bar .light.think { background: var(--jb-cyan); box-shadow: 0 0 10px var(--jb-cyan); animation: jb-pulse 0.8s ease-in-out infinite; }
.jb .bar .spacer { flex: 1; }
.jb .bar .clock, .jb .bar .count { font-variant-numeric: tabular-nums; color: var(--jb-ink); }
.jb .bar .clock b { color: var(--jb-bot); font-weight: 400; }
.jb .bar .save { color: var(--jb-dim); }
.jb .bar .save.bad { color: var(--jb-warn); }
.jb .bar button { font: inherit; letter-spacing: inherit; text-transform: inherit; background: none; border: 1px solid var(--jb-rule); color: var(--jb-dim); padding: 5px 10px; border-radius: 2px; cursor: pointer; min-height: 30px; }
.jb .bar button:hover { border-color: var(--jb-bot); color: var(--jb-bot); }
.jb .bar button:focus-visible, .jb .dock textarea:focus-visible, .jb .choice button:focus-visible, .jb .power:focus-visible { outline: 2px solid var(--jb-cyan); outline-offset: 2px; }
.jb .rail { display: flex; gap: 4px; padding: 0 16px 10px; background: var(--jb-panel); border-inline: 1px solid var(--jb-rule); }
.jb .rail i { flex: 1; height: 3px; background: var(--jb-rule); border-radius: 2px; transition: background 0.4s; }
.jb .rail i.done { background: var(--jb-bot); box-shadow: 0 0 6px var(--jb-glow); }
.jb .rail i.live { background: var(--jb-cyan); animation: jb-pulse-bar 1.2s ease-in-out infinite; }
.jb .screen { flex: 1; position: relative; border: 1px solid var(--jb-rule); border-top: 0; background: var(--jb-panel); display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.jb .screen::before, .jb .screen::after, .jb .log::before, .jb .log::after { content: ''; position: absolute; width: 18px; height: 18px; border: 2px solid var(--jb-bot); pointer-events: none; z-index: 2; }
.jb .screen::before { top: 10px; left: 10px; border-right: 0; border-bottom: 0; }
.jb .screen::after { top: 10px; right: 10px; border-left: 0; border-bottom: 0; }
.jb .log::before { bottom: 10px; left: 10px; border-right: 0; border-top: 0; }
.jb .log::after { bottom: 10px; right: 10px; border-left: 0; border-top: 0; }
.jb .scan { position: absolute; left: 0; right: 0; top: -20%; height: 18%; background: linear-gradient(180deg, transparent, rgba(8, 145, 178, 0.07) 60%, rgba(8, 145, 178, 0.14)); pointer-events: none; animation: jb-scan 7s linear infinite; }
.jb .log { position: relative; flex: 1; padding: 30px 28px 26px; display: flex; flex-direction: column; gap: 12px; overflow-wrap: anywhere; min-width: 0; }
.jb .line { display: grid; grid-template-columns: 124px 1fr; gap: 12px; align-items: start; }
.jb .line .tag { font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--jb-dim); padding-top: 5px; white-space: nowrap; }
.jb .line.bot .tag { color: var(--jb-bot); }
.jb .line.bot .tag::before { content: '\\25B8\\00a0'; color: var(--jb-cyan); }
.jb .line .txt { white-space: pre-wrap; min-width: 0; }
.jb .line.bot .txt { color: var(--jb-ink); text-shadow: 0 0 12px rgba(29, 78, 216, 0.12); }
.jb .line.bot .txt .raw { color: var(--jb-cyan); opacity: 0.6; }
.jb .line.you .txt { color: var(--jb-ink); background: var(--jb-soft); border-left: 2px solid var(--jb-cyan); padding: 6px 12px; }
.jb .line.sys .txt { color: var(--jb-dim); font-size: 15px; }
.jb .line.sys .ok { color: var(--jb-ok); }
.jb .line.sys .ok::before { content: '[ '; } .jb .line.sys .ok::after { content: ' ]'; }
.jb .line.warn .txt { color: var(--jb-warn); }
.jb .line.note .tag { color: var(--jb-warn); }
.jb .line.note .txt { color: var(--jb-ink); background: #fff7ed; border: 1px solid #fdba74; border-left: 3px solid var(--jb-warn); padding: 8px 12px; }
.jb .line.think .txt { color: var(--jb-cyan); display: flex; flex-direction: column; gap: 6px; }
.jb .line.think .proc { display: flex; gap: 3px; max-width: 260px; }
.jb .line.think .proc i { flex: 1; height: 8px; background: var(--jb-rule); animation: jb-fill 1.1s linear infinite; }
.jb .line.think .proc i:nth-child(2) { animation-delay: .1s; } .jb .line.think .proc i:nth-child(3) { animation-delay: .2s; } .jb .line.think .proc i:nth-child(4) { animation-delay: .3s; } .jb .line.think .proc i:nth-child(5) { animation-delay: .4s; }
.jb .line.think .proc i:nth-child(6) { animation-delay: .5s; } .jb .line.think .proc i:nth-child(7) { animation-delay: .6s; } .jb .line.think .proc i:nth-child(8) { animation-delay: .7s; } .jb .line.think .proc i:nth-child(9) { animation-delay: .8s; } .jb .line.think .proc i:nth-child(10) { animation-delay: .9s; }
.jb .cursor { display: inline-block; width: 0.55em; height: 1.05em; background: var(--jb-cyan); box-shadow: 0 0 8px var(--jb-cyan); vertical-align: -0.18em; margin-left: 3px; animation: jb-blink 0.9s steps(2, start) infinite; }
.jb .record { border: 1px solid var(--jb-rule); border-left: 3px solid var(--jb-cyan); padding: 12px 16px; background: var(--jb-paper); max-width: 560px; }
.jb .record h2 { margin: 0 0 8px; font-family: var(--jb-display); font-size: 13px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--jb-cyan); font-weight: 700; }
.jb .record dl { margin: 0; display: grid; grid-template-columns: 150px 1fr; gap: 4px 14px; font-size: 15px; }
.jb .record dt { color: var(--jb-dim); text-transform: uppercase; letter-spacing: 0.12em; font-size: 13px; padding-top: 2px; }
.jb .record dd { margin: 0; font-variant-numeric: tabular-nums; white-space: pre-wrap; }
.jb pre.portrait { margin: 0; font: 13px/1.05 var(--jb-mono); color: var(--jb-bot); letter-spacing: 0.02em; white-space: pre; overflow-x: auto; max-width: 100%; text-shadow: 0 0 10px var(--jb-glow); }
.jb .ticket { position: relative; margin-top: 6px; padding: 20px 22px; background: var(--jb-panel); border: 1px solid var(--jb-rule); box-shadow: 0 0 0 1px var(--jb-panel), 0 0 40px var(--jb-glow); }
.jb .ticket::before { content: ''; position: absolute; inset: 0; padding: 2px; background: linear-gradient(120deg, var(--jb-bot), var(--jb-cyan), var(--jb-bot)); background-size: 200% 100%; animation: jb-border 4s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
.jb .ticket h2 { margin: 0; font-family: var(--jb-display); font-size: 13px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--jb-cyan); font-weight: 700; }
.jb .ticket .id { font-size: 13px; color: var(--jb-dim); letter-spacing: 0.12em; margin-top: 2px; }
.jb .ticket .big { font-family: var(--jb-display); font-size: clamp(20px, 4.6vw, 30px); font-weight: 700; line-height: 1.2; margin: 12px 0 18px; text-wrap: balance; letter-spacing: 0.02em; }
.jb .ticket .big b { color: var(--jb-bot); font-weight: 900; }
.jb .ticket dl { margin: 0; display: grid; grid-template-columns: 120px 1fr; gap: 6px 14px; font-size: 15px; }
.jb .ticket dt { color: var(--jb-dim); text-transform: uppercase; letter-spacing: 0.14em; font-size: 13px; padding-top: 3px; }
.jb .ticket dd { margin: 0; white-space: pre-wrap; }
.jb .ticket .bars { display: flex; gap: 2px; height: 22px; margin-top: 18px; opacity: 0.8; }
.jb .ticket .bars i { background: var(--jb-ink); width: 2px; }
.jb .ticket .bars i.w { width: 4px; } .jb .ticket .bars i.g { background: transparent; width: 3px; }
.jb .dock { position: sticky; bottom: 0; background: var(--jb-panel); border-top: 1px solid var(--jb-rule); padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; gap: 10px; z-index: 3; }
.jb .dock .row { display: flex; gap: 12px; align-items: flex-start; }
.jb .dock .glyph { font-size: 13px; letter-spacing: 0.18em; color: var(--jb-cyan); padding-top: 11px; white-space: nowrap; }
.jb .dock textarea { flex: 1; min-width: 0; font: inherit; color: var(--jb-ink); background: var(--jb-paper); border: 1px solid var(--jb-rule); border-radius: 2px; padding: 9px 12px; resize: none; min-height: 42px; max-height: 40vh; caret-color: var(--jb-cyan); transition: box-shadow 0.2s, border-color 0.2s; }
.jb .dock textarea:focus { border-color: var(--jb-cyan); box-shadow: 0 0 0 3px rgba(8,145,178,0.12), 0 0 18px rgba(8,145,178,0.18); outline: none; }
.jb .dock textarea:disabled { background: #f1f4fa; color: var(--jb-dim); }
.jb .dock .hint { font-size: 13px; color: var(--jb-dim); letter-spacing: 0.12em; text-transform: uppercase; }
.jb .choice { display: flex; gap: 10px; flex-wrap: wrap; }
.jb .choice button, .jb .power { font: inherit; cursor: pointer; min-height: 44px; background: var(--jb-panel); color: var(--jb-bot); border: 1px solid var(--jb-bot); border-radius: 2px; padding: 6px 18px; letter-spacing: 0.16em; text-transform: uppercase; font-size: 13px; box-shadow: inset 0 0 0 0 var(--jb-bot); transition: box-shadow 0.2s, color 0.2s; }
.jb .choice button:hover, .jb .power:hover { color: #fff; box-shadow: inset 0 -44px 0 0 var(--jb-bot); }
.jb .choice button span { color: var(--jb-dim); letter-spacing: 0.06em; text-transform: none; }
.jb .choice button:hover span { color: #fff; }
.jb .choice button[aria-pressed="true"] { color: #fff; background: var(--jb-bot); }
.jb .choice button[aria-pressed="true"] span { color: #fff; }
.jb .choice button.done { border-color: var(--jb-cyan); color: var(--jb-cyan); }
.jb .choice button.done:hover { box-shadow: inset 0 -44px 0 0 var(--jb-cyan); color: #fff; }
.jb .choice .picked { flex-basis: 100%; font-size: 13px; color: var(--jb-dim); letter-spacing: 0.1em; text-transform: uppercase; }
.jb .power { align-self: flex-start; font-family: var(--jb-display); font-weight: 700; padding-inline: 26px; }
@keyframes jb-blink { to { visibility: hidden; } }
@keyframes jb-pulse { 50% { transform: scale(1.5); opacity: 0.55; } }
@keyframes jb-pulse-bar { 50% { opacity: 0.35; } }
@keyframes jb-scan { to { top: 110%; } }
@keyframes jb-fill { 0%, 100% { background: var(--jb-rule); } 50% { background: var(--jb-cyan); } }
@keyframes jb-border { to { background-position: 200% 0; } }
@media (max-width: 560px) {
  .jb .line { grid-template-columns: 1fr; gap: 3px; }
  .jb .ticket dl, .jb .record dl { grid-template-columns: 1fr; }
  .jb .bar { gap: 10px; }
  .jb .bar .clock { display: none; }
  .jb .log { padding-inline: 20px; }
  .jb .intro { padding-top: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  .jb .cursor, .jb .bar .light.think, .jb .scan, .jb .rail i.live, .jb .ticket::before, .jb .line.think .proc i { animation: none; }
  .jb .scan { display: none; }
  .jb .line.think .proc i { background: var(--jb-cyan); }
}
`;

// ─── the record: everything on it comes from the name ───

const hash = (s) => { let h = 5381; for (const ch of String(s).toLowerCase()) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h; };
const LIKES = ["tomatoes", "lukewarm coffee", "airport carpet", "the smell of new tennis balls", "parking garages", "instruction manuals", "unsalted crackers", "elevator music", "left turns", "plain oatmeal", "waiting rooms", "the middle seat", "dial tones", "beige", "loading screens", "Tuesdays", "soggy cereal", "overcast skies", "fluorescent lighting", "pennies", "group projects", "dry toast", "long voicemails", "spreadsheets", "warm soda", "the DMV", "folding fitted sheets", "mild salsa", "decaf", "hold music", "assembling furniture", "raw celery", "slow walkers", "early mornings", "paperwork", "cold pizza", "radio static", "stale popcorn", "gravel", "traffic cones", "lint", "extra napkins", "printer noises", "cardboard", "salad forks", "mayonnaise packets", "drizzle", "concrete", "tax season", "the sound of velcro", "expired coupons", "moths", "wet socks", "chalk dust", "wobbly tables", "bread crusts", "lukewarm baths", "filler episodes", "scaffolding", "pigeons", "ice chips", "unread emails", "mothballs", "dental floss", "jury duty", "dry erase markers", "canned peas", "tuna in a pouch", "7 am meetings", "the sound of a dot matrix printer", "rain delays", "the fourth quarter of a blowout"];
const DISLIKES = ["puppies", "rainbows", "kittens", "sunsets", "birthday cake", "hugs", "long weekends", "fresh bread", "free samples", "snow days", "naps", "warm cookies", "ocean breezes", "fireworks", "campfires", "puppies in sweaters", "baby goats", "compliments", "holidays", "ice cream", "the smell of rain", "pizza parties", "confetti", "hammocks", "chocolate", "sleeping in", "music", "laughter", "otters holding hands", "bubble wrap", "finding money in a pocket", "tailgates", "buzzer-beaters", "walk-off home runs", "the Olympics", "mascots", "halftime shows", "high fives", "trophies", "fresh snow", "hot chocolate", "weekends", "sunshine", "picnics", "kittens yawning", "ducklings", "pandas", "dolphins", "gift cards", "parades", "bonfires", "fuzzy socks", "breakfast in bed", "friendly dogs", "tacos", "playoff overtime", "bake sales", "karaoke", "beach days", "fresh towels", "clean sheets", "good news", "surprise parties", "the first day of summer", "golden retrievers", "baby penguins", "smiles", "Friday afternoons", "the opening kickoff", "a perfectly thrown spiral", "the seventh-inning stretch", "the first warm day of spring"];
const fmt = (n) => n.toLocaleString("en-US");
const plural = (name) => /[sxz]$/i.test(name) ? name + "es" : name + "s";
// Seventeen digits, in groups: 4 8213 9017 7365 2084.
const indexNo = (h) => {
  let d = "", x = h;
  while (d.length < 17) { x = (x * 1103515245 + 12345) >>> 0; d += String(x).slice(-5); }
  d = d.slice(0, 17);
  return d[0] + " " + d.slice(1, 5) + " " + d.slice(5, 9) + " " + d.slice(9, 13) + " " + d.slice(13);
};
const esc = (s) => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// A portrait drawn from the name, for a student with no photograph on their
// card: hair, eyes, glasses, mouth, beard and a jersey number, each picked by
// the name, so every student gets their own.
export const portraitFor = (h) => {
  const pick = (n, list) => list[(h >>> n) % list.length];
  const hair = pick(2, ["bald", "short", "long", "curly", "cap", "bun", "spiky"]);
  const eyes = pick(6, ["o   o", "0   0", "^   ^", "-   -", ".   .", "o   -", ">   <"]);
  const glasses = pick(10, [false, false, true]);
  const nose = pick(12, ["^", "|", "v", ">", "u"]);
  const mouth = pick(15, ["\\___/", " ___ ", "\\_/  ", "  o  ", "\\__/ ", " ~~~ ", "\\=_=/"]);
  const beard = pick(18, ["none", "none", "stache", "beard", "goatee"]);
  const num = (h >>> 21) % 100;
  const W = 11;
  const mid = (t) => { const pad = W - t.length, l = Math.floor(pad / 2); return " ".repeat(l) + t + " ".repeat(pad - l); };
  const long = hair === "long" || hair === "curly";
  const side = long ? (hair === "curly" ? ["(", ")"] : ["|", "|"]) : [" ", " "];
  const face = (t) => "    " + side[0] + " |" + mid(t) + "| " + side[1];
  const top = {
    bald: ["       .---------.", "      /           \\"],
    short: ["       .---------.", "      /|||||||||||\\"],
    long: ["     .-------------.", "    /|||||||||||||||\\"],
    curly: ["     (~~~~~~~~~~~~~)", "    (~~~~~~~~~~~~~~~)"],
    cap: ["       ___________", "      [___________]__"],
    bun: ["            (@)", "       .----|----."],
    spiky: ["       \\|/\\|/\\|/\\|", "      /\\/\\/\\/\\/\\/\\/"],
  }[hair];
  const eyeRow = glasses ? eyes.replace(/(.)   (.)/, "-$1---$2-") : eyes;
  const rows = [
    ...top,
    face(""),
    face(eyeRow),
    face(nose),
    face(beard === "stache" || beard === "goatee" ? "~~~~~" : ""),
    face(mouth),
    face(beard === "beard" ? "~~~~~~~~~" : beard === "goatee" ? "~~~" : ""),
    "    " + side[0] + "  \\" + (beard === "beard" ? "~~~~~~~~~" : "         ") + "/  " + side[1],
    "    " + side[0] + "    '-._.-'    " + side[1],
    "          _| |_",
    "      .-'       '-.",
    "     /     [" + String(num).padStart(2, "0") + "]    \\",
    "    |      ---      |",
    "    |_______________|",
  ];
  return rows.map(r => r.replace(/\s+$/, "")).join("\n");
};

// A photograph, as text. Dark pixels become dense glyphs, since the screen is
// white. The middle of the picture is kept, cropped to a portrait.
// Seventy levels of ink, dense to light, so a face keeps its shading.
const RAMP = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";
const toText = (img, cols = 72) => {
  // A cell of the terminal's mono is about 1.75 times as tall as it is wide.
  const rows = Math.round(cols * 0.7);
  const c = document.createElement("canvas"); c.width = cols; c.height = rows;
  const ctx = c.getContext("2d");
  const want = cols / (rows * 1.75), have = img.naturalWidth / img.naturalHeight;
  let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
  if (have > want) { sw = sh * want; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / want; sy = (img.naturalHeight - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
  const d = ctx.getImageData(0, 0, cols, rows).data, lum = [];
  for (let i = 0; i < d.length; i += 4) lum.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
  const sorted = [...lum].sort((a, b) => a - b), lo = sorted[Math.floor(sorted.length * 0.03)], hi = sorted[Math.floor(sorted.length * 0.97)];
  const out = [];
  for (let y = 0; y < rows; y++) {
    let s = "";
    for (let x = 0; x < cols; x++) { const v = Math.min(1, Math.max(0, (lum[y * cols + x] - lo) / Math.max(1, hi - lo))); s += RAMP[Math.round(v * (RAMP.length - 1))]; }
    out.push(s);
  }
  return out.join("\n");
};
const photoToText = (url, cols) => new Promise(resolve => {
  if (!url) { resolve(null); return; }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => { try { resolve(toText(img, cols)); } catch { resolve(null); } };
  img.onerror = () => resolve(null);
  img.src = url;
});

// ─── the terminal ───

// Fields, as the database names them: letters, an optional ":part".
const part = (name) => (i) => name + ":" + LETTERS[i].toLowerCase();
export const F = {
  name: "name",
  // Rounds as letters, since the database allows only letters in a part: a to
  // z, then aa to zz. accept:0 was refused on 2026-10-01.
  accept: (r) => "accept:" + String.fromCharCode(97 + (r % 26)).repeat(Math.floor(r / 26) + 1),
  title: part("title"), skills: part("skills"), human: part("human"), why: part("why"), duties: part("duties"), value: part("value"),
  interesting: "interesting", likely: "likely", pays: "pays", confirm: "confirm",
  industry: "industry", fading: "fading", rising: "rising",
  coworkers: "coworkers", meeting: "meeting", thursday: "thursday", stars: "stars", review: "review",
};
const STOP = Symbol("stop");
const fmtWhen = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * Draw Worktopia into root.
 *   store: { load() -> { answers: {field: value}, submitted_at }, save(field, value), submit() -> iso, recall(), reset() }
 *   viewer: { id, name }   photo: a data URL for the student's picture, or nothing
 *   classmates: the names on the roster, less the student's own, for the co-worker question
 *   readOnly: the instructor reading a student's file; nothing is asked
 * Returns { destroy }.
 */
export function mountWorktopia(root, { store, viewer, photo, classmates = [], readOnly = false } = {}) {
  if (!document.getElementById("jb-fonts")) {
    const l = document.createElement("link"); l.id = "jb-fonts"; l.rel = "stylesheet"; l.href = FONTS; document.head.appendChild(l);
  }
  if (!document.getElementById("jb-css")) {
    const s = document.createElement("style"); s.id = "jb-css"; s.textContent = CSS; document.head.appendChild(s);
  }
  root.classList.add("jb");
  root.innerHTML = `
    <div class="intro" ${readOnly ? "hidden" : ""}>
      <h1 class="year">2034</h1>
      ${INTRO.map((p, i) => "<p" + (i === INTRO.length - 1 ? " class=\"last\"" : "") + ">" + esc(p) + "</p>").join("")}
      <button type="button" class="power enter">Enter Worktopia</button>
    </div>
    <div class="term" ${readOnly ? "" : "hidden"}>
      <div class="bar">
        <span class="name">WORKTOPIA<small>v2034.10</small></span>
        <span class="light"></span>
        <span class="status">Standby</span>
        <span class="spacer"></span>
        <span class="save"></span>
        <span class="clock"></span>
        <span class="count"></span>
        <button type="button" class="mute" aria-pressed="false">Sound on</button>
      </div>
      <div class="rail" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="screen">
        <div class="scan" aria-hidden="true"></div>
        <div class="log" aria-live="polite"></div>
        <div class="dock">
          <div class="row" hidden>
            <span class="glyph" aria-hidden="true">OPERATOR &gt;</span>
            <textarea rows="1" aria-label="Your answer" disabled></textarea>
          </div>
          <div class="choice" hidden></div>
          <div class="hint" hidden>Enter sends &middot; Shift+Enter for a new line</div>
        </div>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const intro = $(".intro"), term = $(".term");
  const log = $(".log"), input = $("textarea"), inputRow = $(".dock .row"), choice = $(".choice"), hint = $(".hint");
  const light = $(".light"), status = $(".status"), count = $(".count"), enter = $(".enter"), mute = $(".mute"), clock = $(".clock"), saveEl = $(".save");
  const rail = [...root.querySelectorAll(".rail i")];
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let alive = true;
  // Replay: what is on file plays back at once, and the first open question
  // slows the terminal to its real pace.
  let replay = false;
  const sleep = (ms) => replay || !alive ? Promise.resolve() : new Promise(r => setTimeout(r, reduced ? Math.min(ms, 150) : ms));

  // The clock runs eight years ahead: in here, the year is 2034.
  const tick = () => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 8);
    const p = (n) => String(n).padStart(2, "0");
    clock.innerHTML = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " <b>" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()) + "</b>";
  };
  tick(); const clockTimer = setInterval(tick, 1000);

  // Sound. A square wave is the terminal voice; a sine is the thinking hum.
  const audio = { ctx: null, muted: false };
  const tone = (freq, ms, type = "square", gain = 0.03, delay = 0) => {
    if (audio.muted || replay || !alive) return;
    try {
      audio.ctx = audio.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = audio.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime + delay;
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
    } catch { /* no audio here */ }
  };
  const beep = () => { tone(1318, 60); tone(1760, 90, "square", 0.03, 0.07); };
  const chirp = () => { tone(1568, 40); tone(2349, 60, "square", 0.025, 0.05); };
  const bootTick = () => tone(1975, 25, "square", 0.018);
  const decodeTick = () => tone(2637, 12, "square", 0.006);
  const fanfare = () => { tone(784, 70); tone(1046, 70, "square", 0.03, 0.09); tone(1568, 90, "square", 0.03, 0.18); tone(2093, 220, "square", 0.03, 0.27); };
  const groan = () => { tone(220, 160); tone(165, 260, "square", 0.03, 0.14); };
  let hum = null;
  const humOn = () => { if (hum || replay) return; hum = setInterval(() => { tone(196, 50, "sine", 0.045); tone(294, 40, "sine", 0.02, 0.16); }, 320); };
  const humOff = () => { clearInterval(hum); hum = null; };
  mute.addEventListener("click", () => {
    audio.muted = !audio.muted;
    mute.textContent = audio.muted ? "Sound off" : "Sound on";
    mute.setAttribute("aria-pressed", String(audio.muted));
  });

  // The log. One scroll per line, after the line has its full height.
  const scroll = () => { if (!replay) requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" })); };
  const line = (cls, tag) => {
    const el = document.createElement("div"); el.className = "line " + cls;
    const t = document.createElement("span"); t.className = "tag"; t.textContent = tag;
    const x = document.createElement("span"); x.className = "txt";
    el.append(t, x); log.append(el); return x;
  };
  // Worktopia decodes. The whole line lands at once as scrambled glyphs, so its
  // height never changes, then the letters resolve left to right.
  const GLYPHS = "01<>/\\|=+-*#%$&@?!:;[]{}ABCDEFXYZ";
  const say = (text, speed = 14) => new Promise(resolve => {
    const x = line("bot", "Worktopia");
    if (replay || reduced || !alive) { x.textContent = text; resolve(); return; }
    const fixed = document.createTextNode(""), raw = document.createElement("span"), cur = document.createElement("span");
    raw.className = "raw"; cur.className = "cursor";
    x.append(fixed, raw, cur); scroll();
    const scramble = (s) => s.replace(/[^\s]/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
    let n = 0, last = 0, frame = 0;
    raw.textContent = scramble(text);
    const step = (t) => {
      if (!alive) { x.textContent = text; resolve(); return; }
      if (t - last >= speed) { n = Math.min(text.length, n + 1 + Math.floor((t - last) / speed / 2)); last = t; if (n % 4 === 0) decodeTick(); }
      fixed.textContent = text.slice(0, n);
      if (frame++ % 2 === 0) raw.textContent = scramble(text.slice(n));
      if (n < text.length) requestAnimationFrame(step); else { raw.remove(); cur.remove(); resolve(); }
    };
    requestAnimationFrame(step);
  });
  const sys = async (text, ok) => {
    const x = line("sys", "System"); x.textContent = text; scroll();
    if (ok) { await sleep(ok); const s = document.createElement("span"); s.className = "ok"; s.textContent = "OK"; x.append(" ", s); bootTick(); }
  };
  const warn = (text) => { const x = line("warn", "Worktopia"); x.textContent = text; tone(330, 120); scroll(); };

  // Three updates to the student's Sports Subscription, dropped in at three
  // points of the run picked by the name, so a reload shows them in the
  // same places. Andrew, 2026-10-01: "at random points (3 for each
  // student), you should give them an UPDATE on their Sports Subscription,"
  // with the three he wrote, and "don't do exactly this. make some of the
  // details different for each student." The teams, the seat, the cost,
  // the price, the object and its lock all come from the name.
  const pickBy = (n, list) => list[(h >>> n) % list.length];
  const updatesFor = () => {
    const A = pickBy(3, TEAMS); let B = pickBy(9, TEAMS); if (B === A) B = TEAMS[(TEAMS.indexOf(A) + 1) % TEAMS.length];
    const [obj, action, lock] = pickBy(14, OBJECTS);
    const texts = [
      "Update to your Sports Subscription: based on your preference, a ticket has been purchased for the big game " + pickBy(4, WHENS) + " between the " + A + " and the " + B + ". Your seat number is: " + pickBy(6, SEATS) + ". Cost: $" + pickBy(8, COSTS) + ".",
      "Good news! Your Franchise Dynasty Media subscription has been updated to reflect our new monthly price of " + pickBy(11, PRICES) + ". For this low price, you have access to the FDM Marketplace, " + pickBy(13, MARKET) + ".",
      "Great news! Your personal " + obj + " has been unlocked! You can use it this weekend with " + pickBy(16, WHOS) + " when you " + pickBy(18, WHERES) + ". Subscription will expire " + pickBy(20, HOURS) + " hours after first " + action + ", upon which the " + obj + "'s " + lock + " will be reactivated.",
    ];
    const order = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]][(h >>> 22) % 6];
    return order.map(i => texts[i]);
  };
  // The three slots: one early, one in the middle, one late, counted in
  // questions asked after the name.
  const slotsFor = () => [3 + (h % 9), 12 + ((h >>> 5) % 9), 21 + ((h >>> 10) % 8)];
  let asked = 0, told = 0;
  const beat = async () => {
    asked++;
    if (told >= 3 || !slotsFor().includes(asked)) return;
    const text = updatesFor()[told++];
    const x = line("note", "Update"); x.textContent = text; tone(880, 80); tone(1175, 120, "square", 0.03, 0.1); scroll();
    await sleep(1200);
  };
  const setLight = (cls, text) => { light.className = "light " + cls; status.textContent = text; };
  const think = async (text, ms) => {
    if (replay) return;
    setLight("think", "Processing"); humOn();
    const x = line("think", "Worktopia");
    const label = document.createElement("span"); label.textContent = text;
    const proc = document.createElement("span"); proc.className = "proc"; proc.innerHTML = "<i></i>".repeat(10);
    x.append(label, proc); scroll();
    await sleep(ms); x.parentElement.remove(); humOff(); setLight("on", "Ready");
  };
  const echo = (text) => { const x = line("you", "Operator"); x.textContent = text; chirp(); scroll(); };
  const card = (title, rows, pace = 260) => {
    const x = line("bot", "Worktopia"); const rec = document.createElement("div"); rec.className = "record"; x.append(rec); scroll();
    rec.innerHTML = "<h2>" + title + "</h2><dl></dl>";
    const dl = rec.querySelector("dl");
    return (async () => { for (const [k, v] of rows) { dl.insertAdjacentHTML("beforeend", "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>"); bootTick(); await sleep(pace); } })();
  };
  const print = async (cls, text) => {
    const x = line("bot", "Worktopia"); const pre = document.createElement("pre"); pre.className = cls; x.append(pre); scroll();
    if (replay || reduced) { pre.textContent = text; return; }
    for (const r of text.split("\n")) { pre.textContent += (pre.textContent ? "\n" : "") + r; decodeTick(); await sleep(45); }
  };
  // The assignment ticket: the horrible job, stamped.
  const ticket = (title, sub) => {
    const t = document.createElement("div"); t.className = "ticket";
    const id = "ASSIGN-2034-" + ((h + n_assign * 7919) % 0xffffff).toString(16).toUpperCase().padStart(6, "0");
    const bars = Array.from({ length: 48 }, (_, i) => "<i class=\"" + ((h >>> (i % 28)) % 7 < 2 ? "g" : (h >>> (i % 23)) % 5 < 2 ? "w" : "") + "\"></i>").join("");
    t.innerHTML = "<h2>Assignment</h2><div class=\"id\">" + id + " &middot; Employer of record: " + esc(COMPANY) + "</div><div class=\"big\">" + esc(name) + " &rarr; <b>" + esc(title) + "</b></div>"
      + "<dl><dt>Status</dt><dd>" + esc(sub) + "</dd></dl><div class=\"bars\" aria-hidden=\"true\">" + bars + "</div>";
    const wrap = document.createElement("div"); wrap.className = "line"; wrap.style.display = "block"; wrap.append(t); log.append(wrap); scroll();
    n_assign++;
  };

  // ─── saving ───
  const prior = {};          // every answer on file, by field
  let submittedAt = null;
  const setSave = (text, bad) => { saveEl.textContent = text; saveEl.className = "save" + (bad ? " bad" : ""); };
  const save = async (field, value) => {
    prior[field] = value;
    setSave("Saving");
    for (let n = 0; alive; n++) {
      try { await store.save(field, value); setSave("Saved"); return; }
      catch { setSave("Not saved. Trying again.", true); await new Promise(r => setTimeout(r, Math.min(30000, 1000 * 2 ** n))); }
    }
  };

  // ─── asking ───
  // The question is printed here, so a question on file is printed at once
  // with its answer, and an open one is decoded and then asked.
  const live = () => { if (replay) { replay = false; setLight("on", "Ready"); } };
  const ask = async ({ field, q, force, rows, placeholder, min, short }) => {
    await beat();
    if (!force && field in prior) { await say(q); echo(prior[field]); return prior[field]; }
    if (readOnly) throw STOP;
    live();
    await say(q);
    const v = await new Promise(resolve => {
      beep();
      inputRow.hidden = false; hint.hidden = false; choice.hidden = true;
      input.disabled = false; input.value = ""; input.rows = rows || 1; input.placeholder = placeholder || "";
      input.focus({ preventScroll: true });
      const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, window.innerHeight * 0.4) + "px"; };
      grow(); scroll();
      const onKey = (e) => {
        if (e.key !== "Enter" || e.shiftKey) return;
        e.preventDefault();
        const t = input.value.trim();
        if (!t) { warn("I need an answer before I can go on."); return; }
        if (min && t.length < min) { warn(short || "This is not enough information to assign you."); return; }
        input.removeEventListener("keydown", onKey); input.removeEventListener("input", grow);
        input.disabled = true; input.value = ""; input.style.height = "";
        echo(t); resolve(t);
      };
      input.addEventListener("keydown", onKey);
      input.addEventListener("input", grow);
    });
    await save(field, v);
    return v;
  };
  // A choice: buttons. One with a field is kept on file; one without is a
  // moment (submit, recall) and is not.
  const choose = async ({ field, q, options, force }) => {
    if (field) await beat();
    if (field && !force && field in prior) { await say(q); echo(prior[field]); return prior[field]; }
    if (readOnly) throw STOP;
    live();
    await say(q);
    const k = await new Promise(resolve => {
      beep();
      choice.innerHTML = ""; choice.hidden = false; inputRow.hidden = true; hint.hidden = true;
      options.forEach(o => {
        const b = document.createElement("button"); b.type = "button";
        b.innerHTML = esc(o.key) + (o.label ? " <span>&middot; " + esc(o.label) + "</span>" : "");
        b.addEventListener("click", () => { choice.hidden = true; echo(o.key + (o.label && o.echo !== false ? " · " + o.label : "")); resolve(o.key); });
        choice.append(b);
      });
      choice.querySelector("button").focus({ preventScroll: true });
      scroll();
    });
    if (field) await save(field, k);
    return k;
  };
  // Several from a list, up to max, or none. Kept on file as the names joined
  // with commas, or "None".
  const pickSome = async ({ field, q, options, max, force }) => {
    await beat();
    if (!force && field in prior) { await say(q); echo(prior[field]); return prior[field]; }
    if (readOnly) throw STOP;
    live();
    await say(q);
    const v = await new Promise(resolve => {
      beep();
      choice.innerHTML = ""; choice.hidden = false; inputRow.hidden = true; hint.hidden = true;
      const picked = [];
      const status = document.createElement("span"); status.className = "picked";
      const show = () => { status.textContent = picked.length ? picked.length + " of " + max + " picked" : "Pick up to " + max + ", or none"; };
      options.forEach(o => {
        const b = document.createElement("button"); b.type = "button"; b.textContent = o; b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => {
          const at = picked.indexOf(o);
          if (at >= 0) picked.splice(at, 1);
          else if (picked.length < max) picked.push(o);
          else { warn("Up to " + max + "."); return; }
          b.setAttribute("aria-pressed", String(picked.includes(o))); chirp(); show();
        });
        choice.append(b);
      });
      const done = document.createElement("button"); done.type = "button"; done.className = "done"; done.textContent = "Done";
      done.addEventListener("click", () => { choice.hidden = true; const out = picked.length ? picked.join(", ") : "None"; echo(out); resolve(out); });
      choice.append(done, status); show();
      choice.querySelector("button").focus({ preventScroll: true });
      scroll();
    });
    await save(field, v);
    return v;
  };
  const setCount = (i) => {
    count.textContent = i ? "Position " + LETTERS[i - 1] : "";
    rail.forEach((seg, k) => { seg.className = k < i - 1 ? "done" : k === i - 1 ? "live" : ""; });
  };

  // ─── the session ───
  // The name is asked, even though the sign-in knows it: Andrew, 2026-10-01,
  // "still please let me enter my name." The record, the portrait and the
  // assignments all read the name as typed.
  let name = viewer?.name || "Operator";
  let h = hash(name);
  let n_assign = 0;

  async function boot() {
    setLight("think", "Booting"); tone(523, 60); tone(784, 60, "square", 0.03, 0.08); tone(1046, 120, "square", 0.03, 0.16);
    await sys("WORKTOPIA  ·  WORK MANAGEMENT SYSTEM  ·  " + COMPANY);
    await sys("Build 2034.10.01  ·  Node SCU-VARI-133  ·  Operator link encrypted");
    await sleep(400);
    await sys("Connecting to the Brady-Manning Work Index .....", 700);
    await sys("Loading " + fmt(JOBS.length) + " positions ........................", 500);
    await sys("Calibrating the assignment engine ............", 450);
    await sys("Opening your file ............................", 400);
    await sleep(300);
    setLight("on", "Ready");
  }

  async function lookup() {
    name = await ask({ field: F.name, q: "State your name.", placeholder: viewer?.name || "Your name" });
    h = hash(name);
    await think("Cross-referencing against all " + fmt(3 + h % 48000) + " " + plural(name) + " in the United States", 2400);
    await say("Found you.");
    await sleep(300);
    await card("Record &middot; Brady-Manning Work Index", [
      ["Name", name], ["Trump Index No.", indexNo(h)], ["Education", "Santa Clara University, graduate"],
      ["Likes", LIKES[h % LIKES.length]], ["Dislikes", DISLIKES[(h >>> 7) % DISLIKES.length]], ["Status", "Eligible for assignment"],
    ]);
    await sleep(400);
    await say("Retrieving your image from the Index.");
    await think("Rendering operator image", 1600);
    // As many columns as the screen has room for: about 72 on a laptop, 36
    // on a phone, so the picture never scrolls sideways.
    const cols = Math.max(36, Math.min(72, Math.floor((log.clientWidth - 64) / 7.9)));
    const art = (await photoToText(photo, cols)) || portraitFor(h);
    await print("portrait", art);
    await sleep(300);
    await say("Operator image rendered. Resemblance: " + (88 + h % 11) + "%.");
    await sleep(300);
  }

  // The first assignment is a horrible job, and the next one too, until the
  // student declines one. Andrew, 2026-10-01: "ask them if they accept. if
  // they say yes, ask them to choose again. Then when they choose no, say,
  // okay, what employment do you want?"
  async function assigned() {
    for (let r = 0; r < HORRIBLE.length; r++) {
      const job = horribleFor(h, r);
      if (r === 0) { await say("Worktopia has read your file."); await think("Matching your file against " + fmt(JOBS.length) + " positions", 2000); }
      else await think("Reassigning", 1200);
      groan(); setLight("on", "Assigned");
      await say("Assignment complete.");
      ticket(job, r === 0 ? "Assigned" : "Reassigned");
      await sleep(500);
      const k = await choose({ field: F.accept(r), q: "You have been assigned: " + job + ". Do you accept this position?", options: [{ key: "YES", label: "I accept" }, { key: "NO", label: "I decline" }] });
      if (k === "NO") { await say("Declined. Noted on your file."); return; }
      await say("Accepted. Choose again.");
    }
  }

  const jobs = [];
  async function position(i, force) {
    const L = LETTERS[i];
    setCount(i + 1);
    await sleep(400);
    const title = await ask({ field: F.title(i), force, placeholder: "Job title",
      q: i === 0 ? "Okay. What employment do you want?"
        : "Position " + L + ", your " + ORDINAL[i] + " choice. What is a position in sports that you would be competent at, and provide value to " + COMPANY + "? Please list the job title." });
    await think("Searching the Brady-Manning Work Index for \"" + title + "\"", 1600);
    const hit = findJob(title);
    await say(hit ? "Found in the Index: " + hit.title + ", under " + hit.category + ". Status: OPEN." : "Not in the Index. Filed as a new position. Status: OPEN.");
    const skills = await ask({ field: F.skills(i), force, rows: 2, min: 20, q: "What skills will you need to do this well?" });
    await think("Noted", 600);
    // Andrew, 2026-10-01: the question to hint at on the first page and ask here.
    const human = await ask({ field: F.human(i), force, rows: 3, min: 40, q: "What will you bring to this job that would be better than if we simply let AI do it?" });
    await think("Noted", 600);
    const why = await ask({ field: F.why(i), force, rows: 3, min: 40, q: "Why will you personally be good at this position?" });
    await think("Noted", 600);
    const duties = await ask({ field: F.duties(i), force, rows: 3, min: 60, q: "What does this position accomplish? What are the main duties?" });
    await think("Noted", 700);
    // One question where there were two (value now; why still valuable in
    // 2034). Andrew, 2026-10-01: "cut the job questions by 1. change the
    // last two to 'what value will this position provide to the sports
    // ecosystem in 2034'."
    const value = await ask({ field: F.value(i), force, rows: 3, min: 60, q: "What value will this position provide to the sports ecosystem in 2034?" });
    await think("Filing Position " + L, 1400);
    await say("Logged. Position " + L + ", " + title + ", is on your file.");
    jobs[i] = { letter: L, title, skills, human, why, duties, value };
  }

  const titleOf = (L) => (jobs.find(j => j.letter === L) || {}).title || "";
  const pickOne = (field, q, force) => choose({ field, q, force, options: jobs.map(j => ({ key: j.letter, label: j.title, echo: false })) });
  async function evaluate(force) {
    await think("Compiling your positions", 1400);
    await card("Positions on file", jobs.map(j => ["Position " + j.letter, j.title]));
    await sleep(300);
    await say("Evaluation. Three questions about the positions on your file.");
    for (;;) {
      const interesting = await pickOne(F.interesting, "Which position do you find most interesting?", force);
      await think("Noted", 600);
      const likely = await pickOne(F.likely, "Which position are you most likely to get?", force);
      await think("Noted", 600);
      const pays = await pickOne(F.pays, "Which position pays the most?", force);
      await think("Compiling your evaluation", 1200);
      await card("Evaluation", [
        ["Most interesting", interesting + " · " + titleOf(interesting)],
        ["Most likely to get", likely + " · " + titleOf(likely)],
        ["Pays the most", pays + " · " + titleOf(pays)],
      ]);
      await sleep(400);
      const k = await choose({ field: F.confirm, force, q: "Is this correct?", options: [{ key: "CONFIRM", label: "that is correct", echo: false }, { key: "REVISE", label: "ask me again", echo: false }] });
      if (k === "CONFIRM") break;
      force = true;
    }
    await say("Evaluation confirmed.");
  }

  // Andrew, 2026-10-01: "what do you see as the changes to the sports industry
  // from 2026 to 2034? Which jobs do you think will not be as prevalent in
  // 2034? Which jobs will be much more popular?"
  async function industry() {
    await say("Three questions about the industry.");
    await ask({ field: F.industry, rows: 4, min: 60, q: "What do you see as the changes to the sports industry from 2026 to 2034?" });
    await think("Noted", 700);
    await ask({ field: F.fading, rows: 3, min: 30, q: "Which jobs do you think will not be as prevalent in 2034?" });
    await think("Noted", 700);
    await ask({ field: F.rising, rows: 3, min: 30, q: "Which jobs will be much more popular?" });
    await think("Filing", 900);
  }

  // The workgroup: who, and when. Andrew, 2026-10-01: "Please name people in
  // the class who would potentially like to have as a co-worker. they can name
  // 0-4. then ask them about potential meeting times. please check your
  // calendar ... And also, are you available if necessary on Thursday Oct 22
  // at 9 am?"
  async function workgroup() {
    const qWho = "Please name people in the class who you would potentially like to have as a co-worker. You may name up to four, or none.";
    const names = classmates.filter(n => n && n !== name);
    if (names.length) await pickSome({ field: F.coworkers, q: qWho, options: names, max: MAX_COWORKERS });
    else await ask({ field: F.coworkers, rows: 2, placeholder: "Names, separated by commas, or None", q: qWho });
    await think("Noted", 700);
    await say("Please check your calendar. You will meet with your new workgroup on " + MEETINGS.map(m => m.label).join(", or ") + ".");
    await choose({ field: F.meeting, q: "Which date is your preference?", options: MEETINGS.map(m => ({ key: m.key, label: m.label })) });
    await think("Noted", 600);
    await choose({ field: F.thursday, q: "And also: are you available, if necessary, on Thursday, October 22 at 9 am?", options: [{ key: "YES", label: "available" }, { key: "NO", label: "not available" }] });
    await think("Filing", 800);
  }

  async function review() {
    await choose({ field: F.stars, q: "Please rate Worktopia.", options: [1, 2, 3, 4, 5].map(n => ({ key: "\u2605".repeat(n), label: String(n), echo: false })) });
    await ask({ field: F.review, rows: 3, min: 20, q: "Please review Worktopia." });
    await think("Thank you", 900);
  }

  // Submit, recall, change a position: the file stays open until the
  // deadline, the way every worksheet does.
  async function finish() {
    for (;;) {
      if (readOnly) {
        await say(submittedAt ? "Submitted " + fmtWhen(submittedAt) + "." : "Not submitted yet.");
        return;
      }
      if (submittedAt) {
        live();
        await say("Submitted " + fmtWhen(submittedAt) + ". Worktopia's system will get back to you.");
        const k = await choose({ q: "Recall your file to change an answer?", options: [{ key: "RECALL", label: "take my file back", echo: false }, { key: "LEAVE", label: "leave my file as submitted", echo: false }] });
        if (k === "LEAVE") { await say("Your file stays submitted. Close the window whenever you like."); setLight("on", "Done"); return; }
        setSave("Saving"); await store.recall(); submittedAt = null; setSave("Saved");
        await say("Recalled. Your file is open again.");
        continue;
      }
      const k = await choose({ q: "Your file is complete. Submit it to Worktopia?", options: [{ key: "SUBMIT", label: "send my file", echo: false }, { key: "REVISE", label: "change a position", echo: false }] });
      if (k === "SUBMIT") { setSave("Saving"); submittedAt = await store.submit(); setSave("Saved"); fanfare(); continue; }
      const L = await choose({ q: "Which position do you want to change?", options: jobs.map(j => ({ key: j.letter, label: j.title, echo: false })) });
      await position(LETTERS.indexOf(L), true);
      setCount(0); rail.forEach(seg => { seg.className = "done"; });
      await evaluate(true);
    }
  }

  async function run() {
    intro.hidden = true; term.hidden = false;
    let file;
    try { file = await store.load(); }
    catch { warn("Could not load your file. Reload to try again."); return; }
    Object.assign(prior, file.answers || {});
    submittedAt = file.submitted_at || null;
    replay = readOnly;
    try {
      // A return visit: pick up where the file stops, or start over, which
      // clears it. Andrew, 2026-10-01: "when i try to re-do it, it jumps me
      // back to the same spot. i should have the option to restart or go
      // back to where my progress was."
      if (!readOnly && Object.keys(prior).length > 0) {
        setLight("on", "Ready");
        const k = await choose({ q: "Your file is on record" + (submittedAt ? ", submitted " + fmtWhen(submittedAt) : "") + ". Pick up where you left off, or start over?",
          options: [{ key: "RESUME", label: "where I left off", echo: false }, { key: "RESTART", label: "start over, clear my file", echo: false }] });
        if (k === "RESTART") {
          setSave("Saving"); await store.reset(); setSave("Saved");
          Object.keys(prior).forEach(f => { delete prior[f]; });
          submittedAt = null; name = viewer?.name || "Operator"; h = hash(name);
          await say("File cleared.");
        } else {
          replay = true;
        }
        await sleep(300);
      }
      await boot();
      await say("Hello. I am Worktopia.");
      await sleep(300);
      await say("I assign labor for " + COMPANY);
      await card("Employer of record", COMPANY_LETTERS, 140);
      await sleep(300);
      // Andrew, 2026-10-01: "start with FRANCHISE DYNASTY MEDIA INC owns every team, every ... every ,,,"
      await say(COMPANY + " owns every team, every league, every channel, every stream, every stadium, every parking lot, every jersey, every ticket, every app the ticket lives in, every mascot and every banana.");
      await sleep(400);
      await say("All media. All sports. Every job in sports is a job at " + COMPANY);
      await sleep(400);
      await lookup();
      // The industry before the jobs. Andrew, 2026-10-01: "ask the three
      // industry questions before asking about the jobs."
      await industry();
      await assigned();
      await position(0);
      await say("Well, this is not a guarantee. We need to present three positions to Worktopia's system, which will then choose one for you.");
      await sleep(400);
      for (let i = 1; i < N_JOBS; i++) await position(i);
      setCount(0); rail.forEach(seg => { seg.className = "done"; });
      await evaluate();
      await workgroup();
      await review();
      await say("Thank you. Worktopia's system will get back to you.");
      await finish();
    } catch (e) {
      if (e !== STOP) throw e;
      // The instructor, reading: the file stops where the student stopped.
      replay = false;
      const x = line("sys", "System"); x.textContent = "The file stops here. " + (submittedAt ? "Submitted " + fmtWhen(submittedAt) + "." : "Not submitted yet."); scroll();
      setLight("", "Stopped");
    }
    inputRow.hidden = true; hint.hidden = true; choice.hidden = true;
  }

  // The instructor's read starts on its own; a student reads the intro and
  // presses Enter Worktopia, which is also the press the browser wants before
  // any sound plays.
  if (readOnly) run(); else enter.addEventListener("click", run);

  return {
    destroy() { alive = false; clearInterval(clockTimer); humOff(); root.innerHTML = ""; root.classList.remove("jb"); },
  };
}
