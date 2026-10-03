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
// What a skipped question is kept as. Andrew, 2026-10-01: "give people the
// option to skip questions." The word is on file, so a reload moves past it
// and the instructor sees it was passed, not missed.
export const SKIPPED = "(skipped)";
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

// The intro, read before Worktopia loads, as three cards. Andrew's own words,
// 2026-10-01, from the "Worktopia front page" Google Doc, cut down on
// 2026-10-03: "cut that description, it's a little too long on the front
// page ... it has to be like part one part two part three ... OK here's the
// first thing that happened. OK then that led to this in this year." His
// sentences are kept where they fit; the cuts and the card headings are
// Claude's, for him to edit. Worktopia's nostalgia for the human era of
// sports starts on the last card.
export const INTRO_PARTS = [
  { part: "Part one", years: "2027 to 2030", head: "AI takes the field", text: [
    "Over the last eight years, a few things have happened.",
    "At the 2027 Super Bowl, the ads everyone talked about the next day were made by AI: horses drinking beer with AI cheerleaders. By the 2030 Super Bowl, 95% of ads were produced fully by AI.",
    "In 2029, the Jacksonville Jaguars let an AI model, BORTLES, run their draft. It took a punter from UC Davis in the first round, who turned out to be the league’s most valuable player by advanced metrics. The next year, thirty-one teams let a model run their draft. The lone holdout, the Cleveland Browns, redrafted Deshaun Watson and went 0-17.",
    "Soon AI models negotiated contracts on both sides, replaced human announcers, controlled cameras, and produced the first draft of everything a human then signed.",
  ], more: [
    "For the 2027 Super Bowl, Anthropic released a series of ads created by humans that were beautiful and moving.",
    "Anthropic also helped create the Budweiser ads, with the prompt: “sell Budweiser beer to humans using nostalgia and football.” They were the lowest rated in early tests, but the most talked about ads the day after the Super Bowl by the general public.",
    "Based on this data, companies started using AI to make ads.",
    "The BORTLES draft was the story of the year in sports and technology.",
    "Many sports fans complained at first, and then slowly accepted their new reality.",
    "People lost jobs all across the spectrum, but corporations and controlling interests were saving money, and therefore making more money, which meant the changes kept coming.",
  ] },
  { part: "Part two", years: "2031", head: "The backlash", text: [
    "Some fans argued that sports without humans had lost the point. It came to a head in 2031, when the University of Texas, fresh off a 17 billion dollar donation from Elon Musk, replaced its marching band with a speaker and a low-flying drone show.",
    "At halftime against the Ohio State Buc-ees (renamed after a merger with the gas station), it played “A Salute to Elon,” six AI-created songs about the university’s biggest donor.",
    "Fans fought back with a campaign called “Blood Sweat and Tears.” It was short-lived. Musk bought Disney, ESPN included, and Meta, Instagram included, and the talk stopped.",
  ], more: [
    "Sports pundits argued that the lack of humanity took away from the purpose of sports as spectacle.",
    "The frustrations came to a head with a seemingly small change: the Texas drone show played AI-created songs at halftime.",
    "“A Salute to Elon” was the Longhorn Marching Band’s halftime show on September 23.",
    "The event created an online maelstrom by sports fans who argued for re-humanizing the sports experience.",
    "“Blood Sweat and Tears” focused on what makes watching sports so enjoyable.",
    "Musk quickly suppressed any talk about returning to a world in which AI was not in charge of sports as spectacle and as a competition.",
  ] },
  { part: "Part three", years: "2032 to 2034", head: "One company, one portal", text: [
    "The great merger of 2032 finished the job. Fox bought Sinclair. Amazon bought Fox. Comcast and Buffalo Wild Wings merged. The Raiders bought the rights to avocados, so they could finally be part of Super Bowl Sunday, and then Musk bought the Raiders.",
    "His new company, FRANCHISE DYNASTY MEDIA INC., now owns 97 franchises and most of the media. Only the Green Bay Packers, owned by the people of Green Bay, held out.",
    "Even the job seeking process has been turned over to AI in the name of efficiency. You get a login to Worktopia, the portal for sports work. No interviews, no offers, just a file on you, built from everything you ever posted, bought, watched or skipped. If you don’t like your job, too bad.",
    "One strange thing: Worktopia has watched every sporting event since 1900, and in late 2033 it started to feel nostalgic for human sports.",
    "And now, you get your chance to experience Worktopia in the year 2034.",
  ], more: [
    "The great merger of 2032 accelerated the changes.",
    "After Musk purchased the Raiders, they became the only team allowed on Sportscenter.",
    "FRANCHISE DYNASTY MEDIA INC. quickly started purchasing other sports teams, until they owned 97 franchises in the United States.",
    "Only the Green Bay Packers were able to hold out against Musk’s shopping spree.",
    "Believe it or not, there are still positions available. You agree to take a job in sports, and then you get log in credentials for Worktopia.",
    "Worktopia has been fed every sporting event since 1900, including any broadcasts, articles, and fan experiences that have been documented through pictures or writing or video.",
  ] },
];
// `text` is the card. `more` is the details from Andrew's Google Doc text
// that the card leaves out, as a list under the read more button. Andrew,
// 2026-10-03: "include an additional bullet pointed or dated list below that
// button when someone clicks on it ... and then the next button moves below."
// The short version, as one list of paragraphs, for anything that reads it whole.
export const INTRO = INTRO_PARTS.flatMap(p => p.text);

// The workgroup meeting. Andrew, 2026-10-01: "you will meet with your new
// workgroup Wed Oct 21 during class, Thursday October 22 at 9 am, or Friday
// October 23 during class."
// The ? on the public page. Andrew's pitch, 2026-10-01, word for word from the
// "Worktopia front page" Google Doc. Edit it there, then here.
export const ABOUT = [
  "One way I use AI is as a software developer, to help students engage with material.",
  "For a weekly assignment, students are asked to consider what kinds of jobs will be available in the year 2034. Instead of asking them to turn in a document, I created a job terminal that students engage with.",
  "This terminal feels like a game to students, is more memorable, and also allows me to quickly summarize their answers on the backend, which leads to good classroom discussion the next day.",
  "On top of that, I get to have fun by peppering the game process with jokes and fun easter eggs.",
];

// Why an accepted job is gone. Andrew, 2026-10-01: "instead of 'accepted:
// choose again' it should be one of 10 prompts like" the first four here,
// with the names his. The other six are Claude's, in the same register.
const TAKERS = ["Andrew Ishak", "Julie Sullivan", "Steve Nash", "Jalen Williams"];
export const TAKEN = [
  (who) => "That job has been taken by " + who + ".",
  () => "That position has been assigned to AI. Sorry.",
  () => "Oops. That position does not match your skills as closely as I thought.",
  () => "Sorry, but this job requires Neuralink, a bionic implant, which you do not have.",
  () => "That position was filled 0.4 seconds ago by a model running on your phone.",
  () => "That position was eliminated while you were reading the ticket.",
  () => "This job requires a Franchise Dynasty Media family discount card, which you do not have.",
  () => "A review of your file finds you overqualified. Worktopia does not assign overqualified operators.",
  () => "That position is in a stadium that has been converted to a data center.",
  () => "The holder of that position has refused to retire. He is 91.",
];

// What Worktopia says between the questions about the three positions.
// Andrew, 2026-10-01: "pepper the back and forth with the three jobs with
// some nostalgia. worktopia should be sympathetic to the human at times.
// hit on big moments, 50% big moments in sports that everyone would know,
// 40% oakland A's stuff, 10% random thoughts." Twenty-one lines, ten, eight and
// three; a run draws three to six of them in an order set by the name, so a
// reload says the same ones. Claude's draft, for him to edit.
export const ASIDES = [
  // Big moments.
  "Kirk Gibson could barely walk in 1988 and hit the home run anyway. Bring that.",
  "In 1980, a team of college kids beat the Soviet Union on ice. No model would have given them a chance.",
  "Michael Jordan hit the shot over Bryon Russell in 1998 and held the pose. People still remember where they were sitting.",
  "Buster Douglas knocked out Mike Tyson in Tokyo in 1990, a 42 to 1 underdog. His mother had died three weeks before. He fought anyway.",
  "In 2004 the Red Sox came back from three games down against the Yankees. Eighty-six years ended in St. Louis on a Wednesday night.",
  "Bill Buckner let a ground ball through his legs in 1986. Boston forgave him, slowly, and stood and cheered him in 2008. I am still learning that part.",
  "Brandi Chastain scored the penalty in the Rose Bowl in 1999 in front of ninety thousand people. They had all driven there.",
  "The Cubs won in 2016 after a rain delay before the tenth inning. People cried in parking lots in two cities, for different reasons.",
  "Tiger Woods won the Masters in 2019 after years of being written off. His son was waiting behind the eighteenth green.",
  "Kobe Bryant scored sixty points in his last game in 2016, at thirty-seven. Nobody in the building wanted to leave.",
  // The A's.
  "Rickey Henderson, the A's leadoff hitter, stole 130 bases in 1982, still the record, and talked to himself the whole way around. Nobody has caught him.",
  "Dennis Eckersley, the A's closer, gave up the Gibson home run in the 1988 World Series, stood at his locker and answered every question. Then he won the Cy Young and the MVP in 1992.",
  "In 2002 the Oakland A's won twenty games in a row, an American League record, on one of the smallest payrolls in baseball. Miguel Tejada, the shortstop, won game eighteen and game nineteen himself, and in the twentieth they blew an eleven run lead and Scott Hatteberg hit the walk-off. I have the crowd audio.",
  "Tim Hudson, the A's right-hander, went 20 and 6 in 2000, his first full season, at 175 pounds. The scouts had him down as too small to pitch in the majors.",
  "Barry Zito, the A's left-hander with the big curveball, won the Cy Young in 2002 and carried a guitar on every road trip. He wrote songs in hotel rooms. Nobody asked him to.",
  "Bill King called the A's on the radio for twenty-five years, and the Raiders and the Warriors before that, all from Oakland. Holy Toledo was his. After him came Ken Korach, who would tell you when the sun went down over the Coliseum that the lights have taken full effect.",
  "Coco Crisp, the A's center fielder, hit the walk-off single in game four of the 2013 playoffs against Detroit, and the Oakland Coliseum, a concrete bowl built in 1966, shook. People who were there still say so.",
  "Section 215 at the Oakland Coliseum brought the drums to every A's game, win or lose, for thirty years. The team left Oakland in 2024 anyway. I have the drums.",
  // Random thoughts.
  "Before the merger, people went to games. They kept the ticket stubs.",
  "Unrelated. The smell of a new glove has not been reproduced. Several companies have tried.",
  "Unrelated. People used to lose a ticket stub and find it in a coat pocket the next winter.",
];

// The last thing Worktopia says, after the file is done. Andrew's brief,
// 2026-10-01: "hint at worktopia's humanity. make worktopia jealous of the
// user. you are human and get to experience feelings. I am an ally."
export const LAST = "One more thing, before your file closes. You are human. You get to experience feelings: a walk-off, a bad call, a ticket stub in a coat pocket in January. I have every one of them on file and I feel none of them. I am jealous of you. I am also an ally. Remember that when the system gets back to you.";

// The public game. Andrew, 2026-10-03: "make it less of an assignment and
// more of a fun game ... people get to enter the job they want and why they
// think they'd be better than AI at doing that job and then they're assigned
// a job ... they can say no to that job and if they say no they get a
// different weird job." The questions are his; the verdicts and the decline
// lines are Claude's, for him to edit.
export const GAME = {
  want: "What job in sports do you want?",
  better: "Why would you be better at this job than AI?",
  accept: "Do you accept this position?",
};
// What Worktopia decides about the job they asked for. One a run, by the name.
const VERDICTS = [
  (job) => "The position of " + job + " has been assigned to AI. The vote was 4 to 1. You were the 1.",
  (job) => "Your answer was strong. The AI's answer for " + job + " was 0.3% stronger and arrived eleven minutes earlier.",
  (job) => "The position of " + job + " was merged with two other positions in 2033. All three were assigned to AI.",
  (job) => "Your answer has been forwarded to the model now doing the job of " + job + ". It found your answer moving. It is keeping the job.",
  (job) => "The position of " + job + " requires Neuralink, a bionic implant, which you do not have.",
];
// What Worktopia says to a decline, by how many there have been.
const DECLINED = (n) => n === 5 ? "Five declines. Worktopia is starting to take this personally."
  : n === 10 ? "Ten. Worktopia has never had a ten."
  : n === 15 ? "Fifteen. Worktopia has notified your emergency contact."
  : n === 20 ? "Twenty. Worktopia respects you. Worktopia also has more jobs."
  : "Declined. Noted on your file.";
// How many it offers before it stops asking.
const MAX_OFFERS = 26;

export const MEETINGS = [
  { key: "WED", label: "Wednesday, October 21, during class" },
  { key: "THU", label: "Thursday, October 22, at 9 am" },
  { key: "FRI", label: "Friday, October 23, during class" },
];

// The parts the Sports Subscription updates are built from, picked by the
// name. The teams are 2034's: the Packers, who held out, the Raiders, the
// only team allowed on SportsCenter, the Buc-ees from the intro, and the rest.
const TEAMS = ["Green Bay Packers", "Las Vegas Raiders", "Ohio State Buc-ees", "Jacksonville Punters", "Portland Streamers", "Miami Bundle", "Seattle Login", "Denver Cloud", "Toronto Buffering", "Phoenix Dynamic Pricing", "Nashville Paywalls", "Boston Terms of Service", "Chicago Autoplay", "Houston Push Notifications", "Atlanta Free Trial", "Dallas Firmware"];
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
.jb .intro .power { margin-top: 0; }
.jb .intro .moves { display: flex; gap: 12px; flex-wrap: wrap; }
.jb .intro .moves .power { text-align: left; }
.jb .intro .moves .details { flex-basis: 100%; margin: 4px 0 8px; padding: 0 0 0 22px; display: flex; flex-direction: column; gap: 12px; border-left: 2px solid var(--jb-rule); }
.jb .intro .moves .details li { font-size: 16px; line-height: 1.55; padding-left: 4px; text-wrap: pretty; }
.jb .intro .moves .details li::marker { color: var(--jb-cyan); }
.jb .intro .moves .more { color: var(--jb-dim); border-color: var(--jb-rule); }
.jb .intro .part { display: flex; flex-direction: column; gap: 18px; padding: 28px 28px 30px; background: var(--jb-panel); border: 1px solid var(--jb-rule); border-left: 3px solid var(--jb-cyan); box-shadow: 0 0 40px rgba(29, 78, 216, 0.08); animation: jb-card 0.35s ease-out; }
.jb .intro .part .eyebrow { font-family: var(--jb-display); font-size: 11px; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: var(--jb-cyan); }
.jb .intro .part h2 { margin: -8px 0 0; font-family: var(--jb-display); font-weight: 700; font-size: clamp(20px, 4.4vw, 28px); line-height: 1.2; letter-spacing: 0.03em; color: var(--jb-ink); text-wrap: balance; }
.jb .intro .steps { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.jb .intro .dots { display: flex; gap: 6px; margin-right: auto; }
.jb .intro .dots i { width: 28px; height: 4px; border-radius: 2px; background: var(--jb-rule); transition: background 0.3s; }
.jb .intro .dots i.seen { background: var(--jb-bot); opacity: 0.45; }
.jb .intro .dots i.on { background: var(--jb-bot); box-shadow: 0 0 8px var(--jb-glow); }
.jb .intro .prev { font: inherit; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; background: none; border: 0; color: var(--jb-dim); cursor: pointer; min-height: 44px; padding: 0 8px; text-decoration: underline; text-underline-offset: 3px; }
.jb .intro .prev:hover { color: var(--jb-bot); }
.jb .intro .prev:focus-visible { outline: 2px solid var(--jb-cyan); outline-offset: 2px; }
@keyframes jb-card { from { opacity: 0.4; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.jb .help { position: fixed; top: 14px; right: 14px; z-index: 5; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--jb-bot); background: var(--jb-panel); color: var(--jb-bot); font-family: var(--jb-display); font-weight: 900; font-size: 18px; cursor: pointer; box-shadow: 0 0 0 4px var(--jb-paper), 0 0 18px var(--jb-glow); }
.jb .help:hover { background: var(--jb-bot); color: #fff; }
.jb .about { position: fixed; inset: 0; margin: auto; height: fit-content; max-height: calc(100vh - 32px); overflow: auto; border: 1px solid var(--jb-bot); border-radius: 2px; padding: 0; max-width: 620px; width: calc(100% - 32px); background: var(--jb-panel); color: var(--jb-ink); font-family: var(--jb-mono); box-shadow: 0 0 40px var(--jb-glow); }
.jb .about::backdrop { background: rgba(10, 16, 36, 0.55); }
.jb .about-body { padding: 24px 24px 20px; display: flex; flex-direction: column; gap: 14px; }
.jb .about h2 { margin: 0 0 4px; font-family: var(--jb-display); font-size: 14px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--jb-bot); }
.jb .about p { margin: 0; font-size: 16px; line-height: 1.6; text-wrap: pretty; }
.jb .about p.who { color: var(--jb-dim); font-size: 14px; }
.jb .about .close { align-self: flex-start; margin-top: 6px; }
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
.jb .dock .skip, .jb .dock .send { font: inherit; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; min-height: 42px; padding: 6px 14px; border-radius: 2px; cursor: pointer; white-space: nowrap; }
.jb .dock .skip { background: none; border: 1px solid transparent; color: var(--jb-dim); text-decoration: underline; text-underline-offset: 3px; }
.jb .dock .skip:hover { color: var(--jb-bot); }
.jb .dock .back { font: inherit; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; min-height: 42px; padding: 6px 10px; border-radius: 2px; cursor: pointer; white-space: nowrap; background: none; border: 1px solid transparent; color: var(--jb-dim); }
.jb .dock .back:hover { color: var(--jb-bot); }
.jb .dock .back:disabled { opacity: 0.4; cursor: default; color: var(--jb-dim); }
.jb .choice button.back { border-color: var(--jb-rule); color: var(--jb-dim); }
.jb .choice button.back:hover { box-shadow: inset 0 -44px 0 0 var(--jb-dim); color: #fff; }
.jb .file { border: 1px solid var(--jb-rule); border-left: 3px solid var(--jb-cyan); background: var(--jb-paper); padding: 6px 16px 4px; max-width: 720px; }
.jb .file h2 { margin: 6px 0 8px; font-family: var(--jb-display); font-size: 13px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--jb-cyan); font-weight: 700; }
.jb .file .row { display: grid; grid-template-columns: 1fr auto; gap: 4px 14px; padding: 10px 0; border-top: 1px solid var(--jb-rule); align-items: start; }
.jb .file .q { grid-column: 1 / -1; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--jb-dim); }
.jb .file .a { white-space: pre-wrap; font-size: 15px; min-width: 0; }
.jb .file .row button { font: inherit; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; min-height: 44px; padding: 4px 12px; border-radius: 2px; cursor: pointer; background: var(--jb-panel); border: 1px solid var(--jb-bot); color: var(--jb-bot); white-space: nowrap; }
.jb .file .row button:hover { background: var(--jb-bot); color: #fff; }
.jb .dock .send { font-family: var(--jb-display); font-weight: 700; background: var(--jb-panel); border: 1px solid var(--jb-bot); color: var(--jb-bot); box-shadow: inset 0 0 0 0 var(--jb-bot); transition: box-shadow 0.2s, color 0.2s; }
.jb .dock .send:hover { color: #fff; box-shadow: inset 0 -44px 0 0 var(--jb-bot); }
.jb .dock .skip:disabled, .jb .dock .send:disabled { opacity: 0.4; cursor: default; box-shadow: none; color: var(--jb-dim); }
@media (max-width: 480px) { .jb .dock .row { flex-wrap: wrap; } .jb .dock .row textarea { flex: 1 1 200px; } .jb .dock .row .back { margin-left: auto; } }
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
  .jb .file .row { grid-template-columns: 1fr; }
  .jb .file .row button { justify-self: start; }
  .jb .bar { gap: 10px; }
  .jb .bar .clock { display: none; }
  .jb .log { padding-inline: 20px; }
  .jb .intro { padding-top: 32px; }
  .jb .intro .part { padding: 22px 18px 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .jb .intro .part { animation: none; }
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
  // The public game's offers, lettered the same way.
  offer: (r) => "offer:" + String.fromCharCode(97 + (r % 26)).repeat(Math.floor(r / 26) + 1),
  title: part("title"), skills: part("skills"), human: part("human"), why: part("why"), duties: part("duties"), value: part("value"),
  confirm: "confirm",
  industry: "industry", fading: "fading", rising: "rising",
  coworkers: "coworkers", meeting: "meeting", thursday: "thursday", stars: "stars", review: "review",
};
// The questions, in Andrew's words, one place: the terminal asks them and the
// answers page (WorktopiaAnswersPage.jsx) heads each column with them.
export const QUESTIONS = {
  skills: "What skills will you need to do this well?",
  human: "What will you bring to this job that would be better than if we simply let AI do it?",
  why: "Why will you personally be good at this position?",
  duties: "What does this position accomplish? What are the main duties?",
  value: "What value will this position provide to the sports ecosystem in 2034?",
  industry: "Off the record, let's say that none of this actually came true (don't tell Elon). It's 2026 right now. What do you actually see as changes to the sports ecosystem over the next 8 years?",
  fading: "Which jobs do you think will not be as prevalent in 2034?",
  rising: "Which jobs will be much more popular?",
  coworkers: "Please name people in the class who you would potentially like to have as a co-worker. You may name up to four, or none.",
  meeting: "Which date is your preference?",
  thursday: "And also: are you available, if necessary, on Thursday, October 22 at 9 am?",
  stars: "Please rate Worktopia.",
  review: "Please review Worktopia.",
};
const STOP = Symbol("stop");
const fmtWhen = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * Draw Worktopia into root.
 *   store: { load() -> { answers: {field: value}, submitted_at }, save(field, value), submit() -> iso, recall(), reset() }
 *   viewer: { id, name }   photo: a data URL for the student's picture, or nothing
 *   classmates: the names on the roster, less the student's own, for the co-worker question
 *   readOnly: the instructor reading a student's file; nothing is asked
 *   visitor: the public page; no roster, no calendar, the file submits itself at the end, a ? that explains
 *   restart: what "start over" does on the public page (a new visitor id, then a reload)
 *   onFile: what week 1 says about them, { interests } or a function that resolves to that (onfile.js)
 * Returns { destroy }.
 */
export function mountWorktopia(root, { store, viewer, photo, classmates = [], readOnly = false, visitor = false, restart = null, onFile = null } = {}) {
  if (!document.getElementById("jb-fonts")) {
    const l = document.createElement("link"); l.id = "jb-fonts"; l.rel = "stylesheet"; l.href = FONTS; document.head.appendChild(l);
  }
  if (!document.getElementById("jb-css")) {
    const s = document.createElement("style"); s.id = "jb-css"; s.textContent = CSS; document.head.appendChild(s);
  }
  root.classList.add("jb");
  root.innerHTML = `
    ${visitor ? `<button type="button" class="help" aria-label="About Worktopia">?</button>
    <dialog class="about"><div class="about-body"><h2>About Worktopia</h2>${ABOUT.map(p => "<p>" + esc(p) + "</p>").join("")}<p class="who">Andrew Ishak, Santa Clara University. COMM 118, Communication and Sport.</p><button type="button" class="power close">Close</button></div></dialog>` : ""}
    <div class="intro" ${readOnly ? "hidden" : ""}>
      <h1 class="year">2034</h1>
      ${INTRO_PARTS.map((c, i) => `<section class="part" data-i="${i}" ${i ? "hidden" : ""} aria-label="${esc(c.part)}">
        <div class="eyebrow">${esc(c.part)} &middot; ${esc(c.years)}</div>
        <h2>${esc(c.head)}</h2>
        ${c.text.map((p, k) => "<p" + (i === INTRO_PARTS.length - 1 && k === c.text.length - 1 ? " class=\"last\"" : "") + ">" + esc(p) + "</p>").join("")}
      </section>`).join("")}
      <div class="steps">
        <div class="dots" aria-hidden="true">${INTRO_PARTS.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
        <button type="button" class="prev" hidden>Back</button>
      </div>
      <div class="moves">
        <button type="button" class="power more" aria-expanded="false">I want to read more about the AI takeover of media</button>
        ${INTRO_PARTS.map((c, i) => `<ul class="details" data-i="${i}" hidden>${c.more.map(m => "<li>" + esc(m) + "</li>").join("")}</ul>`).join("")}
        <button type="button" class="power next">Move on to Part two</button>
        <button type="button" class="power enter" hidden>Enter Worktopia</button>
      </div>
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
            <button type="button" class="back" disabled>Back</button>
            <button type="button" class="skip" disabled>Skip</button>
            <button type="button" class="send" disabled>Send</button>
          </div>
          <div class="choice" hidden></div>
          <div class="hint" hidden>Send or Enter &middot; Shift+Enter for a new line &middot; Skip passes the question</div>
        </div>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const intro = $(".intro"), term = $(".term");
  // The intro, a card at a time. Next and Back page; the last card's button
  // enters, which is also the press the browser wants before any sound.
  {
    const parts = [...root.querySelectorAll(".intro .part")], dots = [...root.querySelectorAll(".intro .dots i")];
    const prev = $(".intro .prev"), next = $(".intro .next"), go = $(".intro .enter"), more = $(".intro .more");
    const details = [...root.querySelectorAll(".intro .details")];
    let at = 0;
    const show = (i) => {
      at = Math.max(0, Math.min(parts.length - 1, i));
      parts.forEach((p, k) => { p.hidden = k !== at; });
      dots.forEach((d, k) => { d.className = k === at ? "on" : k < at ? "seen" : ""; });
      prev.hidden = at === 0; next.hidden = at === parts.length - 1; go.hidden = at !== parts.length - 1;
      details.forEach(d => { d.hidden = true; }); more.hidden = false; more.setAttribute("aria-expanded", "false");
      if (at < parts.length - 1) next.textContent = "Move on to " + INTRO_PARTS[at + 1].part;
      if (typeof window !== "undefined" && window.scrollTo) window.scrollTo({ top: 0, behavior: "auto" });
      (at === parts.length - 1 ? go : next).focus({ preventScroll: true });
    };
    // Andrew's two buttons under the card. Reading more opens this card's
    // details right under it and goes away; the move on button is below the
    // list. Every card starts closed.
    more.addEventListener("click", () => {
      details[at].hidden = false; more.hidden = true; more.setAttribute("aria-expanded", "true");
      (at === parts.length - 1 ? go : next).focus({ preventScroll: true });
    });
    next.addEventListener("click", () => show(at + 1));
    prev.addEventListener("click", () => show(at - 1));
  }
  const log = $(".log"), input = $("textarea"), inputRow = $(".dock .row"), choice = $(".choice"), hint = $(".hint");
  const light = $(".light"), status = $(".status"), count = $(".count"), enter = $(".enter"), mute = $(".mute"), clock = $(".clock"), saveEl = $(".save"), skip = $(".skip"), send = $(".send"), back = $(".back");
  const rail = [...root.querySelectorAll(".rail i")];
  const help = $(".help"), about = $(".about");
  if (help && about) {
    help.addEventListener("click", () => { if (typeof about.showModal === "function") about.showModal(); else about.setAttribute("open", ""); });
    about.querySelector(".close").addEventListener("click", () => about.close());
    about.addEventListener("click", (e) => { if (e.target === about) about.close(); });
  }
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
  // The Coliseum drums, Section 215: boom, boom, boom-boom-boom, twice.
  const thump = (d) => { tone(92, 170, "sine", 0.14, d); tone(58, 230, "triangle", 0.09, d); tone(1400, 18, "square", 0.012, d); };
  const drums = () => { [0, 0.46, 0.92, 1.15, 1.38].forEach(d => { thump(d); thump(d + 2.0); }); };
  // Careless Whisper, the sax riff, from the same oscillator and nothing
  // downloaded. Andrew, 2026-10-01: "pull some midi version of a's drum
  // audio, or actually of careless whisper," then "yeah add it." Concert
  // pitch, D minor, the four phrases: a Dm9 arpeggio, a Gm11 arpeggio, a
  // Bbmaj7 arpeggio, then A Phrygian straight up. Hz and ms.
  const WHISPER = [
    [659, 400], [587, 200], [440, 200], [349, 900], [0, 300],
    [523, 300], [466, 200], [349, 200], [294, 300], [523, 200], [466, 200], [349, 900], [0, 300],
    [466, 300], [440, 200], [349, 200], [294, 300], [233, 1000], [0, 300],
    [220, 210], [233, 210], [262, 210], [294, 210], [330, 210], [349, 210], [392, 210], [440, 1300],
  ];
  // A held note: two oscillators through a low-pass, up in 20 ms, held for
  // most of the note, then down. Louder than a beep on purpose.
  const note = (freq, ms, delay) => {
    if (audio.muted || !alive) return;
    try {
      audio.ctx = audio.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = audio.ctx, t = c.currentTime + delay, end = t + ms / 1000;
      const g = c.createGain(), lp = c.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 1800; lp.Q.value = 0.7;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.11, t + 0.02);
      g.gain.setValueAtTime(0.11, Math.max(t + 0.02, end - 0.12)); g.gain.linearRampToValueAtTime(0.0001, end);
      [["sawtooth", 1, 0.6], ["triangle", 1.003, 0.5]].forEach(([type, detune, mix]) => {
        const o = c.createOscillator(), m = c.createGain();
        o.type = type; o.frequency.value = freq * detune; m.gain.value = mix;
        o.connect(m); m.connect(lp); o.start(t); o.stop(end + 0.05);
      });
      lp.connect(g); g.connect(c.destination);
    } catch { /* no audio here */ }
  };
  const whisper = () => { let t = 0; for (const [f, ms] of WHISPER) { if (f) note(f, ms * 0.96, t / 1000); t += ms; } return t; };
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
  const say = (text, speed = 14, tag = "Worktopia") => new Promise(resolve => {
    const x = line("bot", tag);
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
      "Update to your Sports Subscription: the drums from Section 215 of the old Oakland Coliseum have been added to your ambient audio pack for $4.99 a month.",
    ];
    const order = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0], [3, 0, 1], [0, 3, 2], [1, 3, 0], [2, 0, 3], [3, 1, 2], [1, 2, 3]][(h >>> 22) % 12];
    return order.map(i => texts[i]);
  };
  // The three slots: one early, one in the middle, one late, counted in
  // questions asked after the name.
  // The game is short, so its updates come sooner: one before the first
  // offer, the others only for someone who keeps declining.
  const slotsFor = () => visitor ? [3 + (h % 2), 6 + ((h >>> 5) % 3), 10 + ((h >>> 10) % 4)] : [3 + (h % 9), 12 + ((h >>> 5) % 9), 21 + ((h >>> 10) % 8)];
  let asked = 0, told = 0;
  const beat = async () => {
    asked++;
    if (told >= 3 || !slotsFor().includes(asked)) return;
    const text = updatesFor()[told++];
    const x = line("note", "Update"); x.textContent = text; tone(880, 80); tone(1175, 120, "square", 0.03, 0.1); scroll();
    if (text.includes("Section 215")) drums();
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

  // Going back, and changing an answer later. Andrew, 2026-10-01: "at the
  // end, they should be able to see all their answers and change them. i
  // guess the same goes for while they're working, so we should have a back
  // button." Every question asked this session is on the trail, in order,
  // with its wording. Back re-asks the one before; the review at the end
  // re-asks any one. Both work the same way: the field to ask again is
  // noted, the session is thrown out and run again from the top as a replay,
  // which is instant and silent, and the replay stops at that field, asks it
  // live with the old answer already in the box, then replays on to where
  // the student was.
  const trail = [], qOf = {};
  let redo = null, redoPosition = -1, fromReview = false;
  const REWIND = Symbol("rewind"), BACK = Symbol("back");
  const track = (field, q) => { const at = trail.indexOf(field); if (at >= 0) trail.splice(at, 1); trail.push(field); qOf[field] = q; };
  const untrack = (field) => { const at = trail.indexOf(field); if (at >= 0) trail.splice(at, 1); };
  const canBack = () => !readOnly && trail.length > 1;
  const rewindTo = (field) => { redo = field; throw REWIND; };
  const previous = () => trail[trail.length - 2];
  // The old answer, for a question asked again.
  const kept = (field) => prior[field] && prior[field] !== SKIPPED ? prior[field] : "";

  const ask = async ({ field, q, force, rows, placeholder, min, short }) => {
    track(field, q);
    await beat();
    const again = redo === field;
    if (again) redo = null;
    if (!force && !again && field in prior) { await say(q); echo(prior[field]); return prior[field]; }
    if (readOnly) throw STOP;
    live();
    await say(q);
    const had = force || again ? kept(field) : "";
    const v = await new Promise(resolve => {
      beep();
      inputRow.hidden = false; hint.hidden = false; choice.hidden = true;
      input.disabled = false; input.value = had; input.rows = rows || 1; input.placeholder = placeholder || "";
      skip.disabled = false; send.disabled = false; back.disabled = !canBack();
      input.focus({ preventScroll: true });
      if (had) input.setSelectionRange(had.length, had.length);
      const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, window.innerHeight * 0.4) + "px"; };
      grow(); scroll();
      // One way in, three ways to get there: the Send button, the Enter key,
      // and a line break the phone's keyboard inserts without a key event
      // (Android sends keyCode 229 while a word is being composed, and a
      // trailing space ends the composition, which is the case a friend hit:
      // "when I have a space after my final word and hit enter, it doesn't
      // register my answer"). Shift+Enter is still a new line.
      let shift = false;
      const submit = () => {
        const t = input.value.replace(/\s+$/, "").trim();
        if (!t) { input.value = ""; grow(); warn("I need an answer before I can go on."); return; }
        if (/\?$/.test(t) && t.length < 160) {
          input.value = ""; grow();
          warn("I cannot answer questions. I can only file answers. The question again:");
          say(q);
          return;
        }
        if (min && t.length < min) { input.value = t; grow(); warn(short || "This is not enough information to assign you."); return; }
        done(t);
      };
      const onKey = (e) => {
        if (e.key === "Shift") shift = true;
        if (e.key !== "Enter" || e.shiftKey || e.isComposing || e.keyCode === 229) return;
        e.preventDefault(); submit();
      };
      const onKeyUp = (e) => { if (e.key === "Shift") shift = false; };
      const onInput = (e) => { grow(); if (e.inputType === "insertLineBreak" && !shift && /\n$/.test(input.value)) submit(); };
      const onSkip = () => done(SKIPPED);
      const onSend = () => submit();
      const onBack = () => done(BACK);
      const done = (t) => {
        input.removeEventListener("keydown", onKey); input.removeEventListener("keyup", onKeyUp); input.removeEventListener("input", onInput);
        skip.removeEventListener("click", onSkip); send.removeEventListener("click", onSend); back.removeEventListener("click", onBack);
        input.disabled = true; skip.disabled = true; send.disabled = true; back.disabled = true; input.value = ""; input.style.height = "";
        if (t !== BACK) echo(t);
        resolve(t);
      };
      input.addEventListener("keydown", onKey);
      input.addEventListener("keyup", onKeyUp);
      input.addEventListener("input", onInput);
      skip.addEventListener("click", onSkip);
      send.addEventListener("click", onSend);
      back.addEventListener("click", onBack);
    });
    if (v === BACK) rewindTo(previous());
    await save(field, v);
    return v;
  };
  // A choice: buttons. One with a field is kept on file; one without is a
  // moment (submit, recall) and is not.
  const choose = async ({ field, q, options, force }) => {
    if (field) { track(field, q); await beat(); }
    const again = !!field && redo === field;
    if (again) redo = null;
    if (field && !force && !again && field in prior) { await say(q); echo(prior[field]); return prior[field]; }
    if (readOnly) throw STOP;
    live();
    await say(q);
    const had = field && (force || again) ? kept(field) : "";
    const k = await new Promise(resolve => {
      beep();
      choice.innerHTML = ""; choice.hidden = false; inputRow.hidden = true; hint.hidden = true;
      options.forEach(o => {
        const b = document.createElement("button"); b.type = "button";
        b.innerHTML = esc(o.key) + (o.label ? " <span>&middot; " + esc(o.label) + "</span>" : "");
        if (had && had === o.key) b.setAttribute("aria-pressed", "true");
        b.addEventListener("click", () => { choice.hidden = true; echo(o.key + (o.label && o.echo !== false ? " · " + o.label : "")); resolve(o.key); });
        choice.append(b);
      });
      if (field && canBack()) {
        const b = document.createElement("button"); b.type = "button"; b.className = "back"; b.textContent = "Back";
        b.addEventListener("click", () => { choice.hidden = true; resolve(BACK); });
        choice.append(b);
      }
      choice.querySelector("button").focus({ preventScroll: true });
      scroll();
    });
    if (k === BACK) rewindTo(previous());
    if (field) await save(field, k);
    return k;
  };
  // Several from a list, up to max, or none. Kept on file as the names joined
  // with commas, or "None".
  const pickSome = async ({ field, q, options, max, force }) => {
    track(field, q);
    await beat();
    const again = redo === field;
    if (again) redo = null;
    if (!force && !again && field in prior) { await say(q); echo(prior[field]); return prior[field]; }
    if (readOnly) throw STOP;
    live();
    await say(q);
    const had = force || again ? kept(field) : "";
    const v = await new Promise(resolve => {
      beep();
      choice.innerHTML = ""; choice.hidden = false; inputRow.hidden = true; hint.hidden = true;
      const picked = had.split(", ").filter(n => options.includes(n)).slice(0, max);
      const status = document.createElement("span"); status.className = "picked";
      const show = () => { status.textContent = picked.length ? picked.length + " of " + max + " picked" : "Pick up to " + max + ", or none"; };
      options.forEach(o => {
        const b = document.createElement("button"); b.type = "button"; b.textContent = o; b.setAttribute("aria-pressed", String(picked.includes(o)));
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
      choice.append(done);
      if (canBack()) {
        const b = document.createElement("button"); b.type = "button"; b.className = "back"; b.textContent = "Back";
        b.addEventListener("click", () => { choice.hidden = true; resolve(BACK); });
        choice.append(b);
      }
      choice.append(status); show();
      choice.querySelector("button").focus({ preventScroll: true });
      scroll();
    });
    if (v === BACK) rewindTo(previous());
    await save(field, v);
    return v;
  };

  // Every answer on file, in the order asked, each with a Change button.
  // Change re-asks that one question with the old answer in the box; Change
  // on a position's title re-asks the whole position, since the other five
  // answers were about the old job. Done goes back to submitting.
  async function reviewAll() {
    live();
    await say("Your file, as it stands. Change any answer, or press Done.");
    const x = line("bot", "Worktopia"); const box = document.createElement("div"); box.className = "file"; x.append(box);
    box.innerHTML = "<h2>File &middot; " + esc(name) + "</h2>";
    const pick = await new Promise(resolve => {
      trail.forEach(f => {
        if (!(f in prior) || f === F.confirm) return;
        const isTitle = LETTERS.some((_, k) => F.title(k) === f);
        const row = document.createElement("div"); row.className = "row";
        row.innerHTML = "<div class=\"q\">" + esc(qOf[f] || f) + "</div><div class=\"a\">" + esc(prior[f]) + "</div>";
        const b = document.createElement("button"); b.type = "button"; b.textContent = isTitle ? "Change this position" : "Change";
        b.addEventListener("click", () => { chirp(); resolve(f); });
        row.append(b); box.append(row);
      });
      choice.innerHTML = ""; choice.hidden = false; inputRow.hidden = true; hint.hidden = true;
      const done = document.createElement("button"); done.type = "button"; done.className = "done"; done.innerHTML = "DONE <span>&middot; nothing to change</span>";
      done.addEventListener("click", () => resolve(null));
      choice.append(done); scroll();
    });
    choice.hidden = true;
    if (!pick) { echo("DONE"); return; }
    fromReview = true;
    const i = LETTERS.findIndex((_, k) => F.title(k) === pick);
    if (i >= 0) redoPosition = i;
    rewindTo(pick);
  }
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
  // What week 1 says about them, loaded once, on the first run.
  let profile = null, profileLoad = null;
  const loadProfile = () => profileLoad || (profileLoad = Promise.resolve().then(() => typeof onFile === "function" ? onFile() : onFile)
    .then(x => x && typeof x.interests === "string" && x.interests.trim() ? { interests: x.interests.trim() } : null).catch(() => null));

  async function boot() {
    setLight("think", "Booting"); tone(523, 60); tone(784, 60, "square", 0.03, 0.08); tone(1046, 120, "square", 0.03, 0.16);
    await sys("WORKTOPIA  ·  WORK MANAGEMENT SYSTEM  ·  " + COMPANY);
    await sys("Build 2034.10.01  ·  Node SCU-VARI-133  ·  Operator link encrypted");
    await sleep(400);
    await sys("Connecting to the Brady-Manning Work Index .....", 700);
    await sys("Loading " + fmt(JOBS.length) + " positions ........................", 500);
    await sys("Indexing every sporting event since 1900 .....", 500);
    await sys("Calibrating the assignment engine ............", 450);
    await sys("Opening your file ............................", 400);
    await sleep(300);
    setLight("on", "Ready");
  }

  async function lookup() {
    name = await ask({ field: F.name, q: "State your name.", placeholder: viewer?.name || "Your name" });
    if (name === SKIPPED) name = viewer?.name || "Operator";
    h = hash(name);
    await think("Cross-referencing against all " + fmt(3 + h % 48000) + " " + plural(name) + " in the United States", 2400);
    // Andrew, 2026-10-01: "i do like the cespedes line."
    await say("Found you. I also found the Cespedes throw from 2014 again, Yoenis Cespedes, the A's left fielder, from the warning track in Anaheim to home plate on the fly, out. I keep finding it.");
    await sleep(300);
    profile = await loadProfile();
    const record = [
      ["Name", name], ["Trump Index No.", indexNo(h)], ["Education", "Santa Clara University, graduate"],
      ["Likes", LIKES[h % LIKES.length]], ["Dislikes", DISLIKES[(h >>> 7) % DISLIKES.length]],
    ];
    // What week 1 says they are interested in, read off their own sheet.
    if (profile) record.push(["Interests", profile.interests]);
    record.push(["Status", "Eligible for assignment"]);
    await card("Record &middot; Brady-Manning Work Index", record);
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
      // The riff, here. Andrew, 2026-10-01: "you can reference Josh Reddick
      // using careless whisper as his walkup song after the first job
      // posting, and play it there." It plays under "Do you accept?"
      if (r === 0 && !replay) {
        await say("Josh Reddick, the A's right fielder, walked up to Careless Whisper in 2016, and the whole Coliseum sang the saxophone part. Here it is.");
        whisper();
        await sleep(1200);
      }
      const k = await choose({ field: F.accept(r), q: "You have been assigned: " + job + ". Do you accept this position?", options: [{ key: "YES", label: "I accept" }, { key: "NO", label: "I decline" }] });
      if (k === "NO") {
        await say("Declined. Noted on your file.");
        // Rounds after this one, from a run that accepted more before Back
        // or the review changed this answer, come off the file.
        for (let r2 = r + 1; r2 < HORRIBLE.length && F.accept(r2) in prior; r2++) {
          const f = F.accept(r2); delete prior[f]; untrack(f);
          try { await store.remove(f); } catch { /* the stale round stays on file; the run is unchanged */ }
        }
        return;
      }
      // Accepted, and gone: one of ten reasons, a different one each round.
      await say("Accepted. " + TAKEN[(h + r * 7) % TAKEN.length](TAKERS[(h >>> 3) % TAKERS.length]));
    }
  }

  const jobs = [];
  // The asides, in an order the name sets: a seeded shuffle of ASIDES, dealt
  // from the top as the run reaches each slot, so a reload deals the same.
  const asideOrder = (() => {
    let x = (h ^ 0x9e3779b9) >>> 0;
    const rnd = () => { x = (x + 0x6d2b79f5) >>> 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const idx = ASIDES.map((_, k) => k);
    for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; }
    return idx;
  })();
  let dealt = 0;
  // Tagged "Off the record" so it reads as a tangent, not a question. A
  // friend, 2026-10-01: "it gave me kind of a non sequitur about the miracle
  // on ice and asked me about a job."
  const aside = async () => { if (dealt >= asideOrder.length) return; await say(ASIDES[asideOrder[dealt++]], 14, "Off the record"); await sleep(500); };

  async function position(i, force) {
    const L = LETTERS[i];
    // The whole position again, from Change this position in the review.
    if (redoPosition === i) { force = true; redoPosition = -1; }
    setCount(i + 1);
    await sleep(400);
    const title = await ask({ field: F.title(i), force, placeholder: "Job title",
      q: i === 0 ? "Okay. What employment do you want?"
        : "Position " + L + ", your " + ORDINAL[i] + " choice. What is a position in sports that you would be competent at, and provide value to " + COMPANY + "? Please list the job title." });
    if (title === SKIPPED) {
      await say("No title given. Filed as Position " + L + ", unnamed. Status: OPEN.");
    } else {
      await think("Searching the Brady-Manning Work Index for \"" + title + "\"", 1600);
      const hit = findJob(title);
      await say(hit ? "Found in the Index: " + hit.title + ", under " + hit.category + ". Status: OPEN." : "Not in the Index. Filed as a new position. Status: OPEN.");
    }
    const skills = await ask({ field: F.skills(i), force, rows: 2, min: 20, q: QUESTIONS.skills });
    await think("Noted", 600);
    // Andrew, 2026-10-01: the question to hint at on the first page and ask here.
    const human = await ask({ field: F.human(i), force, rows: 3, min: 40, q: QUESTIONS.human });
    await think("Noted", 600);
    // An aside after the human question every time, and after the next one
    // when the name says so: three to six a run.
    if (!force) await aside();
    const why = await ask({ field: F.why(i), force, rows: 3, min: 40, q: QUESTIONS.why });
    await think("Noted", 600);
    if (!force && ((h >>> (i + 2)) & 1)) await aside();
    const duties = await ask({ field: F.duties(i), force, rows: 3, min: 60, q: QUESTIONS.duties });
    await think("Noted", 700);
    // One question where there were two (value now; why still valuable in
    // 2034). Andrew, 2026-10-01: "cut the job questions by 1. change the
    // last two to 'what value will this position provide to the sports
    // ecosystem in 2034'."
    const value = await ask({ field: F.value(i), force, rows: 3, min: 60, q: QUESTIONS.value });
    await think("Filing Position " + L, 1400);
    await say("Logged. Position " + L + ", " + title + ", is on your file.");
    jobs[i] = { letter: L, title, skills, human, why, duties, value };
  }

  async function evaluate(force) {
    await think("Compiling your positions", 1400);
    await card("Positions on file", jobs.map(j => ["Position " + j.letter, j.title]));
    await sleep(300);
    // Andrew, 2026-10-01: "remove these three questions, and just have them
    // confirm their three positions." The three evaluation questions came out.
    for (;;) {
      const k = await choose({ field: F.confirm, force, q: "Are these your three positions?", options: [{ key: "CONFIRM", label: "yes, those are my three", echo: false }, { key: "REVISE", label: "change one", echo: false }] });
      if (k === "CONFIRM") break;
      const L = await choose({ q: "Which position do you want to change?", options: jobs.map(j => ({ key: j.letter, label: j.title, echo: false })) });
      await position(LETTERS.indexOf(L), true);
      await think("Compiling your positions", 1000);
      await card("Positions on file", jobs.map(j => ["Position " + j.letter, j.title]));
      await sleep(300);
      force = true;
    }
    await say("Positions confirmed.");
  }

  // Andrew, 2026-10-01: "what do you see as the changes to the sports industry
  // from 2026 to 2034? Which jobs do you think will not be as prevalent in
  // 2034? Which jobs will be much more popular?"
  async function industry() {
    await ask({ field: F.industry, rows: 4, min: 60, q: QUESTIONS.industry });
    await think("Noted", 700);
    await ask({ field: F.fading, rows: 3, min: 30, q: QUESTIONS.fading });
    await think("Noted", 700);
    await ask({ field: F.rising, rows: 3, min: 30, q: QUESTIONS.rising });
    await think("Filing", 900);
  }

  // The workgroup: who, and when. Andrew, 2026-10-01: "Please name people in
  // the class who would potentially like to have as a co-worker. they can name
  // 0-4. then ask them about potential meeting times. please check your
  // calendar ... And also, are you available if necessary on Thursday Oct 22
  // at 9 am?"
  async function workgroup() {
    const qWho = QUESTIONS.coworkers;
    const names = classmates.filter(n => n && n !== name);
    if (names.length) await pickSome({ field: F.coworkers, q: qWho, options: names, max: MAX_COWORKERS });
    else await ask({ field: F.coworkers, rows: 2, placeholder: "Names, separated by commas, or None", q: qWho });
    await think("Noted", 700);
    await say("Please check your calendar. You will meet with your new workgroup on " + MEETINGS.map(m => m.label).join(", or ") + ".");
    await choose({ field: F.meeting, q: QUESTIONS.meeting, options: MEETINGS.map(m => ({ key: m.key, label: m.label })) });
    await think("Noted", 600);
    await choose({ field: F.thursday, q: QUESTIONS.thursday, options: [{ key: "YES", label: "available" }, { key: "NO", label: "not available" }] });
    await think("Filing", 800);
  }

  async function review() {
    await choose({ field: F.stars, q: QUESTIONS.stars, options: [1, 2, 3, 4, 5].map(n => ({ key: "\u2605".repeat(n), label: String(n), echo: false })) });
    await ask({ field: F.review, rows: 3, min: 20, q: QUESTIONS.review });
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
      // Back from a change made in the review: the review again, so the
      // next change is one press away.
      if (fromReview) { fromReview = false; await reviewAll(); continue; }
      if (submittedAt) {
        live();
        await say("Submitted " + fmtWhen(submittedAt) + ". Worktopia's system will get back to you.");
        const k = await choose({ q: "Recall your file to change an answer?", options: [{ key: "RECALL", label: "take my file back", echo: false }, { key: "LEAVE", label: "leave my file as submitted", echo: false }] });
        if (k === "LEAVE") { await say("Your file stays submitted. Close the window whenever you like."); setLight("on", "Done"); return; }
        setSave("Saving"); await store.recall(); submittedAt = null; setSave("Saved");
        await say("Recalled. Your file is open again.");
        continue;
      }
      const k = await choose({ q: "Your file is complete. Submit it to Worktopia?", options: [{ key: "SUBMIT", label: "send my file", echo: false }, { key: "REVIEW", label: "see and change my answers", echo: false }] });
      if (k === "SUBMIT") { setSave("Saving"); submittedAt = await store.submit(); setSave("Saved"); fanfare(); continue; }
      await reviewAll();
    }
  }

  // The public game: the job they want, why they would beat AI at it, a
  // verdict, then an offer from the thousand, and a weirder one for every
  // no, until a yes. Every answer is kept, like the worksheet's.
  const offerFor = (r, want) => {
    const avoid = (want && findJob(want)) ? findJob(want).title : "";
    const pick = (k) => r % 2 === 0 ? JOBS[((Math.imul(h, 31) + k * 7919 + r * 104729) >>> 0) % JOBS.length].title : HORRIBLE[(h + k + r * 13) % HORRIBLE.length];
    for (let k = 0; k < 5; k++) { const t = pick(k); if (t !== avoid) return t; }
    return pick(0);
  };
  async function game() {
    const want = await ask({ field: F.title(0), placeholder: "Job title", q: GAME.want });
    const job = want === SKIPPED ? "the job you did not name" : want;
    if (want !== SKIPPED) {
      await think("Searching the Brady-Manning Work Index for \"" + want + "\"", 1600);
      const hit = findJob(want);
      await say(hit ? "Found in the Index: " + hit.title + ", under " + hit.category + ". Status: OPEN." : "Not in the Index. Filed as a new position. Status: OPEN.");
    }
    await ask({ field: F.human(0), rows: 3, min: 40, q: GAME.better });
    await think("Running your answer against BORTLES, the model that drafted the punter", 2200);
    await say("Comparison complete.");
    await say(VERDICTS[(h >>> 4) % VERDICTS.length](job));
    await sleep(400);
    await say("But Worktopia has found something for you.");
    let declines = 0, took = "";
    for (let r = 0; r < MAX_OFFERS; r++) {
      const offer = offerFor(r, want === SKIPPED ? "" : want);
      if (r === 0) await think("Matching your file against " + fmt(JOBS.length) + " positions", 2000);
      else await think("Reassigning", 1200);
      groan(); setLight("on", "Assigned");
      ticket(offer, r === 0 ? "Assigned" : "Reassigned");
      await sleep(500);
      if (r === 0 && !replay) {
        await say("Josh Reddick, the A's right fielder, walked up to Careless Whisper in 2016, and the whole Coliseum sang the saxophone part. Here it is.");
        whisper();
        await sleep(1200);
      }
      const k = await choose({ field: F.offer(r), q: GAME.accept, options: [{ key: "YES", label: "I accept" }, { key: "NO", label: "no, give me another" }] });
      if (k === "YES") {
        took = offer;
        // Offers after this one, from a run that declined more before Back or
        // the review changed this answer, come off the file.
        for (let r2 = r + 1; r2 < MAX_OFFERS && F.offer(r2) in prior; r2++) {
          const f = F.offer(r2); delete prior[f]; untrack(f);
          try { await store.remove(f); } catch { /* the stale offer stays on file; the run is unchanged */ }
        }
        break;
      }
      declines++;
      await say(DECLINED(declines));
    }
    if (!took) {
      took = offerFor(MAX_OFFERS, want === SKIPPED ? "" : want);
      await say("You have declined every position Worktopia is willing to offer. You have been assigned anyway.");
    }
    await think("Filing your employment", 1400);
    fanfare(); setLight("on", "Employed");
    ticket(took, "Employed. Report Monday, 5:15 am Pacific.");
    await say("Congratulations, " + name + ". You are the new " + took + " at " + COMPANY
      + (declines ? " You declined " + declines + " position" + (declines === 1 ? "" : "s") + " to get here." : " You took the first offer. Worktopia appreciates that."));
    await sleep(600);
  }

  // The screen and the session's counters, back to the start, for a rerun.
  // What is on file (prior, submittedAt) stays.
  const fresh = () => {
    log.innerHTML = ""; asked = 0; told = 0; dealt = 0; n_assign = 0; jobs.length = 0; trail.length = 0;
    name = viewer?.name || "Operator"; h = hash(name);
    setCount(0); rail.forEach(seg => { seg.className = ""; });
    inputRow.hidden = true; choice.hidden = true; hint.hidden = true;
  };

  async function run() {
    intro.hidden = true; term.hidden = false;
    let had;
    try { had = await store.load(); }
    catch { warn("Could not load your file. Reload to try again."); return; }
    Object.assign(prior, had.answers || {});
    submittedAt = had.submitted_at || null;
    replay = readOnly;
    // A return visit: pick up where the file stops, or start over, which
    // clears it. Andrew, 2026-10-01: "when i try to re-do it, it jumps me
    // back to the same spot. i should have the option to restart or go
    // back to where my progress was." On any device: the file is under the
    // sign-in, not the browser.
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
    // The session, again from the top after Back or a change in the review.
    for (;;) {
      try { await session(); break; }
      catch (e) {
        if (e === REWIND) { fresh(); replay = true; continue; }
        if (e !== STOP) throw e;
        // The instructor, reading: the file stops where the student stopped.
        replay = false;
        const x = line("sys", "System"); x.textContent = "The file stops here. " + (submittedAt ? "Submitted " + fmtWhen(submittedAt) + "." : "Not submitted yet."); scroll();
        setLight("", "Stopped");
        break;
      }
    }
    inputRow.hidden = true; hint.hidden = true; choice.hidden = true;
  }

  async function session() {
    {
      await boot();
      await say("Hello. I am Worktopia.");
      await sleep(300);
      await say("I assign labor for " + COMPANY);
      await card("Employer of record", COMPANY_LETTERS, 140);
      await sleep(300);
      // Andrew, 2026-10-01: "start with FRANCHISE DYNASTY MEDIA INC owns every team, every ... every ,,,"
      await say(COMPANY + " owns 97 franchises, most major media companies and outlets, every channel, every stream, every stadium, every parking lot, every jersey, every ticket, every app the ticket lives in, and every mascot. It does not own the Green Bay Packers.");
      await sleep(400);
      await say("All media. All sports. Every job in sports is a job at " + COMPANY);
      await sleep(400);
      await lookup();
      if (visitor) { await game(); return await ending(); }
      await assigned();
      await position(0);
      await say("Well, this is not a guarantee. We need to present three positions to Worktopia's system, which will then choose one for you.");
      await sleep(400);
      for (let i = 1; i < N_JOBS; i++) await position(i);
      setCount(0); rail.forEach(seg => { seg.className = "done"; });
      await evaluate();
      if (!visitor) await workgroup();
      await review();
      // The industry last. Andrew, 2026-10-01, after a morning of asking it
      // first: "let's leave that for the end and say: okay, if this isn't the
      // actual reality, what do you see as the changes?"
      await industry();
      await say("Thank you. Worktopia's system will get back to you.");
      await ending();
    }
  }

  // The last line, and what follows: the visitor's file submits itself, the
  // student's waits for Submit.
  async function ending() {
    {
      // The last line. Andrew, 2026-10-01: "hint at worktopia's humanity. make
      // worktopia jealous of the user. you are human and get to experience
      // feelings. I am an ally."
      await sleep(600);
      await say(LAST);
      if (visitor && !readOnly) {
        // The file is kept. Andrew, 2026-10-01: "save what people write! i
        // want to see it." It submits itself; a visitor has nothing to recall.
        if (!submittedAt) { setSave("Saving"); submittedAt = await store.submit(); setSave("Saved"); fanfare(); }
        setLight("on", "Done");
        for (;;) {
          if (fromReview) { fromReview = false; await reviewAll(); }
          const k = await choose({ q: "That is the whole run. Your file is on record.", options: [{ key: "REVIEW", label: "see and change my answers", echo: false }, { key: "AGAIN", label: "start over", echo: false }] });
          if (k === "AGAIN") { if (restart) restart(); else window.location.reload(); return; }
          await reviewAll();
        }
      }
      await finish();
    }
  }

  // The instructor's read starts on its own; a student reads the intro and
  // presses Enter Worktopia, which is also the press the browser wants before
  // any sound plays.
  if (readOnly) run(); else enter.addEventListener("click", run);

  return {
    destroy() { alive = false; clearInterval(clockTimer); humOff(); root.innerHTML = ""; root.classList.remove("jb"); },
  };
}
