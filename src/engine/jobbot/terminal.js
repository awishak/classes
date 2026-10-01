// JobBot 5000: a worksheet that is a computer terminal in the year 2034.
//
// COMM 118's worksheet for the week of 2026-10-05. The student sits at a job
// allocation terminal run by FRANCHISE DYNASTY INC., the one company that owns
// all media and all sports in 2034. JobBot looks them up on the Brady-Manning Work Index,
// draws them as text, takes their skills, then three to five positions in
// sports with the duties, the value to the sports ecosystem and why the
// position still exists in 2034, then an evaluation (most interesting, most
// likely, pays the most), and assigns one. Andrew, 2026-10-01: "a white screen
// that beeps ... you enter an answer then it kind of thinks and then gives you
// an answer back."
//
// Plain DOM, like the worksheets package's sheet.js: mountJobBot(root, opts)
// draws into root and returns { destroy }. Nothing here touches the window at
// import, so the smoke run can load the module. The store (jobbot/store.js)
// keeps every answer as its own row the moment the student sends it, so a
// reload replays what is on file and picks up at the first open question.
//
// The questions are Andrew's words (2026-10-01). JobBot's other lines are
// placeholders for him to edit; the jokes (the record, the likes and
// dislikes, the company) are his idea and Claude's wording.

export const JOBBOT_KEY = "jobbot-5000";
export const JOBBOT_TITLE = "JobBot 5000";

// FRANCHISE DYNASTY INC.: the companies that own sports and the screens sports
// are watched on, which in 2034 are one company. Andrew, 2026-10-01: "one big
// media conglomerate that holds all media, all sports, all that stuff." One
// company a letter.
export const COMPANY = "FRANCHISE DYNASTY INC.";
export const COMPANY_LETTERS = [
  ["F", "Fox"], ["R", "RedBird"], ["A", "Amazon"], ["N", "Netflix"], ["C", "Comcast"], ["H", "Hulu"], ["I", "Ineos"], ["S", "Sky"], ["E", "ESPN"],
  ["D", "Disney"], ["Y", "YouTube"], ["N", "Nike"], ["A", "Apple"], ["S", "Sinclair"], ["T", "TKO"], ["Y", "YES Network"],
  ["I", "iHeart"], ["N", "NBC"], ["C", "CBS"],
];

const MIN_JOBS = 3, MAX_JOBS = 5;
const LETTERS = ["A", "B", "C", "D", "E"];
const ORDINAL = ["first", "second", "third", "fourth", "fifth"];
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
.jb .bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 10px 16px; border: 1px solid var(--jb-rule); border-bottom: 0; background: var(--jb-panel);
  font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--jb-dim); box-shadow: 0 1px 0 var(--jb-rule); }
.jb .bar .name { font-family: var(--jb-display); font-weight: 900; font-size: 15px; letter-spacing: 0.22em; color: var(--jb-ink); }
.jb .bar .name small { font-weight: 500; color: var(--jb-cyan); font-size: 10px; margin-left: 10px; letter-spacing: 0.2em; }
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
.jb .line { display: grid; grid-template-columns: 92px 1fr; gap: 12px; align-items: start; }
.jb .line .tag { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--jb-dim); padding-top: 5px; white-space: nowrap; }
.jb .line.bot .tag { color: var(--jb-bot); }
.jb .line.bot .tag::before { content: '\\25B8\\00a0'; color: var(--jb-cyan); }
.jb .line .txt { white-space: pre-wrap; min-width: 0; }
.jb .line.bot .txt { color: var(--jb-ink); text-shadow: 0 0 12px rgba(29, 78, 216, 0.12); }
.jb .line.bot .txt .raw { color: var(--jb-cyan); opacity: 0.6; }
.jb .line.you .txt { color: var(--jb-ink); background: var(--jb-soft); border-left: 2px solid var(--jb-cyan); padding: 6px 12px; }
.jb .line.sys .txt { color: var(--jb-dim); font-size: 14px; }
.jb .line.sys .ok { color: var(--jb-ok); }
.jb .line.sys .ok::before { content: '[ '; } .jb .line.sys .ok::after { content: ' ]'; }
.jb .line.warn .txt { color: var(--jb-warn); }
.jb .line.think .txt { color: var(--jb-cyan); display: flex; flex-direction: column; gap: 6px; }
.jb .line.think .proc { display: flex; gap: 3px; max-width: 260px; }
.jb .line.think .proc i { flex: 1; height: 8px; background: var(--jb-rule); animation: jb-fill 1.1s linear infinite; }
.jb .line.think .proc i:nth-child(2) { animation-delay: .1s; } .jb .line.think .proc i:nth-child(3) { animation-delay: .2s; } .jb .line.think .proc i:nth-child(4) { animation-delay: .3s; } .jb .line.think .proc i:nth-child(5) { animation-delay: .4s; }
.jb .line.think .proc i:nth-child(6) { animation-delay: .5s; } .jb .line.think .proc i:nth-child(7) { animation-delay: .6s; } .jb .line.think .proc i:nth-child(8) { animation-delay: .7s; } .jb .line.think .proc i:nth-child(9) { animation-delay: .8s; } .jb .line.think .proc i:nth-child(10) { animation-delay: .9s; }
.jb .cursor { display: inline-block; width: 0.55em; height: 1.05em; background: var(--jb-cyan); box-shadow: 0 0 8px var(--jb-cyan); vertical-align: -0.18em; margin-left: 3px; animation: jb-blink 0.9s steps(2, start) infinite; }
.jb .record { border: 1px solid var(--jb-rule); border-left: 3px solid var(--jb-cyan); padding: 12px 16px; background: var(--jb-paper); max-width: 560px; }
.jb .record h2 { margin: 0 0 8px; font-family: var(--jb-display); font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--jb-cyan); font-weight: 700; }
.jb .record dl { margin: 0; display: grid; grid-template-columns: 150px 1fr; gap: 4px 14px; font-size: 14px; }
.jb .record dt { color: var(--jb-dim); text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; padding-top: 2px; }
.jb .record dd { margin: 0; font-variant-numeric: tabular-nums; white-space: pre-wrap; }
.jb pre.portrait { margin: 0; font: 11px/1.05 var(--jb-mono); color: var(--jb-bot); letter-spacing: 0.02em; white-space: pre; overflow-x: auto; max-width: 100%; text-shadow: 0 0 10px var(--jb-glow); }
.jb .ticket { position: relative; margin-top: 6px; padding: 20px 22px; background: var(--jb-panel); border: 1px solid var(--jb-rule); box-shadow: 0 0 0 1px var(--jb-panel), 0 0 40px var(--jb-glow); }
.jb .ticket::before { content: ''; position: absolute; inset: 0; padding: 2px; background: linear-gradient(120deg, var(--jb-bot), var(--jb-cyan), var(--jb-bot)); background-size: 200% 100%; animation: jb-border 4s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
.jb .ticket h2 { margin: 0; font-family: var(--jb-display); font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--jb-cyan); font-weight: 700; }
.jb .ticket .id { font-size: 11px; color: var(--jb-dim); letter-spacing: 0.12em; margin-top: 2px; }
.jb .ticket .big { font-family: var(--jb-display); font-size: clamp(20px, 4.6vw, 30px); font-weight: 700; line-height: 1.2; margin: 12px 0 18px; text-wrap: balance; letter-spacing: 0.02em; }
.jb .ticket .big b { color: var(--jb-bot); font-weight: 900; }
.jb .ticket dl { margin: 0; display: grid; grid-template-columns: 120px 1fr; gap: 6px 14px; font-size: 14px; }
.jb .ticket dt { color: var(--jb-dim); text-transform: uppercase; letter-spacing: 0.14em; font-size: 11px; padding-top: 3px; }
.jb .ticket dd { margin: 0; white-space: pre-wrap; }
.jb .ticket .job { border-top: 1px dashed var(--jb-rule); margin-top: 14px; padding-top: 14px; }
.jb .ticket .job h3 { margin: 0 0 8px; font-size: 15px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.08em; }
.jb .ticket .job h3 .pick { color: #fff; background: var(--jb-bot); font-size: 10px; letter-spacing: 0.18em; padding: 2px 8px; margin-left: 10px; vertical-align: 2px; }
.jb .ticket .bars { display: flex; gap: 2px; height: 22px; margin-top: 18px; opacity: 0.8; }
.jb .ticket .bars i { background: var(--jb-ink); width: 2px; }
.jb .ticket .bars i.w { width: 4px; } .jb .ticket .bars i.g { background: transparent; width: 3px; }
.jb .dock { position: sticky; bottom: 0; background: var(--jb-panel); border-top: 1px solid var(--jb-rule); padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; gap: 10px; z-index: 3; }
.jb .dock .row { display: flex; gap: 12px; align-items: flex-start; }
.jb .dock .glyph { font-size: 11px; letter-spacing: 0.18em; color: var(--jb-cyan); padding-top: 11px; white-space: nowrap; }
.jb .dock textarea { flex: 1; min-width: 0; font: inherit; color: var(--jb-ink); background: var(--jb-paper); border: 1px solid var(--jb-rule); border-radius: 2px; padding: 9px 12px; resize: none; min-height: 42px; max-height: 40vh; caret-color: var(--jb-cyan); transition: box-shadow 0.2s, border-color 0.2s; }
.jb .dock textarea:focus { border-color: var(--jb-cyan); box-shadow: 0 0 0 3px rgba(8,145,178,0.12), 0 0 18px rgba(8,145,178,0.18); outline: none; }
.jb .dock textarea:disabled { background: #f1f4fa; color: var(--jb-dim); }
.jb .dock .hint { font-size: 11px; color: var(--jb-dim); letter-spacing: 0.12em; text-transform: uppercase; }
.jb .choice { display: flex; gap: 10px; flex-wrap: wrap; }
.jb .choice button, .jb .power { font: inherit; cursor: pointer; min-height: 44px; background: var(--jb-panel); color: var(--jb-bot); border: 1px solid var(--jb-bot); border-radius: 2px; padding: 6px 18px; letter-spacing: 0.16em; text-transform: uppercase; font-size: 13px; box-shadow: inset 0 0 0 0 var(--jb-bot); transition: box-shadow 0.2s, color 0.2s; }
.jb .choice button:hover, .jb .power:hover { color: #fff; box-shadow: inset 0 -44px 0 0 var(--jb-bot); }
.jb .choice button span { color: var(--jb-dim); letter-spacing: 0.06em; text-transform: none; }
.jb .choice button:hover span { color: #fff; }
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
const RAMP = "@%#*+=-:. ";
const toText = (img, cols = 54) => {
  const rows = Math.round(cols * 0.62);
  const c = document.createElement("canvas"); c.width = cols; c.height = rows;
  const ctx = c.getContext("2d");
  const want = cols / (rows * 2), have = img.naturalWidth / img.naturalHeight;
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
const photoToText = (url) => new Promise(resolve => {
  if (!url) { resolve(null); return; }
  const img = new Image();
  img.onload = () => { try { resolve(toText(img)); } catch { resolve(null); } };
  img.onerror = () => resolve(null);
  img.src = url;
});

// ─── the terminal ───

// Fields, as the database names them: letters, an optional ":part".
const F = {
  skills: "skills",
  title: (i) => "title:" + LETTERS[i].toLowerCase(),
  duties: (i) => "duties:" + LETTERS[i].toLowerCase(),
  value: (i) => "value:" + LETTERS[i].toLowerCase(),
  future: (i) => "future:" + LETTERS[i].toLowerCase(),
  more: (i) => "more:" + LETTERS[i].toLowerCase(),
  interesting: "interesting", likely: "likely", pays: "pays", confirm: "confirm",
};
const STOP = Symbol("stop");
const fmtWhen = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * Draw the terminal into root.
 *   store: { load() -> { answers: {field: value}, submitted_at }, save(field, value), submit() -> iso, recall() }
 *   viewer: { id, name }   photo: a data URL for the student's picture, or nothing
 *   readOnly: the instructor reading a student's file; nothing is asked
 * Returns { destroy }.
 */
export function mountJobBot(root, { store, viewer, photo, readOnly = false } = {}) {
  if (!document.getElementById("jb-fonts")) {
    const l = document.createElement("link"); l.id = "jb-fonts"; l.rel = "stylesheet"; l.href = FONTS; document.head.appendChild(l);
  }
  if (!document.getElementById("jb-css")) {
    const s = document.createElement("style"); s.id = "jb-css"; s.textContent = CSS; document.head.appendChild(s);
  }
  root.classList.add("jb");
  root.innerHTML = `
    <div class="term">
      <div class="bar">
        <span class="name">JOBBOT 5000<small>v2034.10</small></span>
        <span class="light"></span>
        <span class="status">Standby</span>
        <span class="spacer"></span>
        <span class="save"></span>
        <span class="clock"></span>
        <span class="count"></span>
        <button type="button" class="mute" aria-pressed="false">Sound on</button>
      </div>
      <div class="rail" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="screen">
        <div class="scan" aria-hidden="true"></div>
        <div class="log" aria-live="polite"></div>
        <div class="dock">
          <button type="button" class="power">Power on</button>
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
  const log = $(".log"), input = $("textarea"), inputRow = $(".dock .row"), choice = $(".choice"), hint = $(".hint");
  const light = $(".light"), status = $(".status"), count = $(".count"), power = $(".power"), mute = $(".mute"), clock = $(".clock"), saveEl = $(".save");
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
  // JobBot decodes. The whole line lands at once as scrambled glyphs, so its
  // height never changes, then the letters resolve left to right.
  const GLYPHS = "01<>/\\|=+-*#%$&@?!:;[]{}ABCDEFXYZ";
  const say = (text, speed = 14) => new Promise(resolve => {
    const x = line("bot", "JobBot");
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
  const warn = (text) => { const x = line("warn", "JobBot"); x.textContent = text; tone(330, 120); scroll(); };
  const setLight = (cls, text) => { light.className = "light " + cls; status.textContent = text; };
  const think = async (text, ms) => {
    if (replay) return;
    setLight("think", "Processing"); humOn();
    const x = line("think", "JobBot");
    const label = document.createElement("span"); label.textContent = text;
    const proc = document.createElement("span"); proc.className = "proc"; proc.innerHTML = "<i></i>".repeat(10);
    x.append(label, proc); scroll();
    await sleep(ms); x.parentElement.remove(); humOff(); setLight("on", "Ready");
  };
  const echo = (text) => { const x = line("you", "Operator"); x.textContent = text; chirp(); scroll(); };
  const card = (title, rows, pace = 260) => {
    const x = line("bot", "JobBot"); const rec = document.createElement("div"); rec.className = "record"; x.append(rec); scroll();
    rec.innerHTML = "<h2>" + title + "</h2><dl></dl>";
    const dl = rec.querySelector("dl");
    return (async () => { for (const [k, v] of rows) { dl.insertAdjacentHTML("beforeend", "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>"); bootTick(); await sleep(pace); } })();
  };
  const print = async (cls, text) => {
    const x = line("bot", "JobBot"); const pre = document.createElement("pre"); pre.className = cls; x.append(pre); scroll();
    if (replay || reduced) { pre.textContent = text; return; }
    for (const r of text.split("\n")) { pre.textContent += (pre.textContent ? "\n" : "") + r; decodeTick(); await sleep(45); }
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
    if (field && !force && field in prior) { await say(q); echo(prior[field]); return prior[field]; }
    if (readOnly) throw STOP;
    live();
    await say(q);
    const k = await new Promise(resolve => {
      beep();
      choice.innerHTML = ""; choice.hidden = false; inputRow.hidden = true; hint.hidden = true;
      options.forEach(o => {
        const b = document.createElement("button"); b.type = "button";
        b.innerHTML = esc(o.key) + " <span>&middot; " + esc(o.label) + "</span>";
        b.addEventListener("click", () => { choice.hidden = true; echo(o.key); resolve(o.key); });
        choice.append(b);
      });
      choice.querySelector("button").focus({ preventScroll: true });
      scroll();
    });
    if (field) await save(field, k);
    return k;
  };
  const setCount = (i) => {
    count.textContent = i ? "Position " + LETTERS[i - 1] : "";
    rail.forEach((seg, k) => { seg.className = k < i - 1 ? "done" : k === i - 1 ? "live" : ""; });
  };

  // ─── the session ───
  // The name is asked, even though the sign-in knows it: Andrew, 2026-10-01,
  // "still please let me enter my name." The record, the portrait and the
  // allocation all read the name as typed.
  let name = viewer?.name || "Operator";
  let h = hash(name);

  async function boot() {
    setLight("think", "Booting"); tone(523, 60); tone(784, 60, "square", 0.03, 0.08); tone(1046, 120, "square", 0.03, 0.16);
    await sys("JOBBOT 5000  ·  LABOR ALLOCATION TERMINAL  ·  " + COMPANY);
    await sys("Build 2034.10.01  ·  Node SCU-VARI-133  ·  Operator link encrypted");
    await sleep(400);
    await sys("Connecting to the Brady-Manning Work Index .....", 700);
    await sys("Loading the sustainability model .............", 500);
    await sys("Calibrating the allocation engine ............", 450);
    await sys("Opening your file ............................", 400);
    await sleep(300);
    setLight("on", "Ready");
  }

  async function lookup() {
    name = await ask({ field: "name", q: "State your name.", placeholder: viewer?.name || "Your name" });
    h = hash(name);
    await think("Cross-referencing against all " + fmt(3 + h % 48000) + " " + plural(name) + " in the United States", 2400);
    await say("Found you.");
    await sleep(300);
    await card("Record &middot; Brady-Manning Work Index", [
      ["Name", name], ["Trump Index No.", indexNo(h)], ["Education", "Santa Clara University, graduate"],
      ["Likes", LIKES[h % LIKES.length]], ["Dislikes", DISLIKES[(h >>> 7) % DISLIKES.length]], ["Status", "Eligible for allocation"],
    ]);
    await sleep(400);
    await say("Retrieving your image from the Index.");
    await think("Rendering operator image", 1600);
    const art = (await photoToText(photo)) || portraitFor(h);
    await print("portrait", art);
    await sleep(300);
    await say("Operator image rendered. Resemblance: " + (88 + h % 11) + "%.");
    await sleep(300);
  }

  const jobs = [];
  async function position(i, force) {
    const L = LETTERS[i];
    setCount(i + 1);
    await sleep(400);
    const title = await ask({ field: F.title(i), force, placeholder: "Job title",
      q: (i === 0 ? "Let's start with Position A, your first choice. " : "Position " + L + ", your " + ORDINAL[i] + " choice. ")
        + "What is a position in sports that you would be competent at, and provide value to " + COMPANY + " (or self)? Please list the job title." });
    await think("Searching the Brady-Manning Work Index for \"" + title + "\"", 1600);
    const duties = await ask({ field: F.duties(i), force, rows: 3, min: 60, q: "Found. Status: OPEN. What does this position accomplish? What are the main duties?" });
    await think("Noted", 700);
    const value = await ask({ field: F.value(i), force, rows: 3, min: 60, q: "What value does this position provide to the sports ecosystem?" });
    await think("Weighing the value", 1000);
    const future = await ask({ field: F.future(i), force, rows: 3, min: 60, q: "Why do you think this position is still valuable in 2034? (I know, for I am JobBot 5000, but I want you to tell me.)" });
    await think("Filing Position " + L, 1400);
    await say("Logged. Position " + L + ", " + title + ", is on your file.");
    jobs[i] = { letter: L, title, duties, value, future };
  }

  const titleOf = (L) => (jobs.find(j => j.letter === L) || {}).title || "";
  const pickOne = (field, q, force) => choose({ field, q, force, options: jobs.map(j => ({ key: j.letter, label: j.title })) });
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
      const k = await choose({ field: F.confirm, force, q: "Is this correct?", options: [{ key: "CONFIRM", label: "that is correct" }, { key: "REVISE", label: "ask me again" }] });
      if (k === "CONFIRM") break;
      force = true;
    }
    await say("Evaluation confirmed.");
  }

  async function allocate() {
    await say("Running allocation for " + name + ". Stand by.");
    await think("Weighing " + jobs.length + " positions against the sustainability model", 2200);
    await think("Consulting the Brady-Manning Work Index", 1400);
    await think("Deciding", 1000);
    // The Index weighs the case made for a position's future: the longest
    // answer about 2034 wins, and a tie goes to the position listed first.
    const pick = jobs.reduce((best, j) => j.future.length > best.future.length ? j : best, jobs[0]);
    fanfare(); setLight("on", "Assigned");
    await say("Allocation complete.");
    const t = document.createElement("div"); t.className = "ticket";
    const id = "ALLOC-2034-" + (h % 0xffffff).toString(16).toUpperCase().padStart(6, "0");
    const bars = Array.from({ length: 48 }, (_, i) => "<i class=\"" + ((h >>> (i % 28)) % 7 < 2 ? "g" : (h >>> (i % 23)) % 5 < 2 ? "w" : "") + "\"></i>").join("");
    t.innerHTML = "<h2>Allocation</h2><div class=\"id\">" + id + " &middot; Employer of record: " + esc(COMPANY) + "</div><div class=\"big\">" + esc(name) + " &rarr; <b>" + esc(pick.title) + "</b></div>"
      + "<dl><dt>Skills</dt><dd>" + esc(prior[F.skills] || "") + "</dd><dt>Positions on file</dt><dd>" + jobs.length + "</dd><dt>Basis</dt><dd>The strongest case for a position that lasts to 2034.</dd></dl>"
      + jobs.map(j => "<div class=\"job\"><h3>Position " + j.letter + " &middot; " + esc(j.title) + (j === pick ? "<span class=\"pick\">assigned</span>" : "") + "</h3><dl><dt>Duties</dt><dd>" + esc(j.duties) + "</dd><dt>Value</dt><dd>" + esc(j.value) + "</dd><dt>In 2034</dt><dd>" + esc(j.future) + "</dd></dl></div>").join("")
      + "<div class=\"bars\" aria-hidden=\"true\">" + bars + "</div>";
    const wrap = document.createElement("div"); wrap.className = "line"; wrap.style.display = "block"; wrap.append(t); log.append(wrap); scroll();
    await sleep(600);
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
        await say("Submitted " + fmtWhen(submittedAt) + ". Your file is with the instructor.");
        const k = await choose({ q: "Recall your file to change an answer?", options: [{ key: "RECALL", label: "take my file back" }, { key: "LEAVE", label: "leave my file as submitted" }] });
        if (k === "LEAVE") { await say("Your file stays submitted. Close the window whenever you like."); setLight("on", "Done"); return; }
        setSave("Saving"); await store.recall(); submittedAt = null; setSave("Saved");
        await say("Recalled. Your file is open again.");
        continue;
      }
      const k = await choose({ q: "Your file is complete. Submit it to the instructor?", options: [{ key: "SUBMIT", label: "send my file" }, { key: "REVISE", label: "change a position" }] });
      if (k === "SUBMIT") { setSave("Saving"); submittedAt = await store.submit(); setSave("Saved"); fanfare(); continue; }
      const L = await choose({ q: "Which position do you want to change?", options: jobs.map(j => ({ key: j.letter, label: j.title })) });
      await position(LETTERS.indexOf(L), true);
      setCount(0); rail.forEach(seg => { seg.className = "done"; });
      await evaluate(true);
      await allocate();
    }
  }

  async function run() {
    power.hidden = true;
    let file;
    try { file = await store.load(); }
    catch { warn("Could not load your file. Reload to try again."); return; }
    Object.assign(prior, file.answers || {});
    submittedAt = file.submitted_at || null;
    replay = Object.keys(prior).length > 0 || readOnly;
    try {
      await boot();
      await say("Hello. I am JobBot 5000.");
      await sleep(300);
      await say("I allocate labor for " + COMPANY);
      await card("Employer of record", COMPANY_LETTERS, 140);
      await sleep(300);
      await say("Which in 2034 are one company. All media. All sports. Every job in sports is a job at " + COMPANY);
      await sleep(400);
      await lookup();
      await ask({ field: F.skills, rows: 2, placeholder: "writing, video editing, statistics, talking to anyone",
        q: "Please list the skills you have now, in 2034, that make you a good employee for " + COMPANY + " Separate them with commas." });
      await think("Cross-referencing your skills against the Brady-Manning Work Index", 1800);
      await say("The Brady-Manning Work Index lists 4,113 open positions at " + COMPANY + " that match your skills.");
      await sleep(300);
      await say("Now, we will examine your employment preferences. I require you to present me with at least three positions that you would be interested in.");
      for (let i = 0; i < MAX_JOBS; i++) {
        await position(i);
        if (i + 1 >= MIN_JOBS && i + 1 < MAX_JOBS) {
          const k = await choose({ field: F.more(i), q: "Present another position, or proceed to evaluation?", options: [{ key: "ADD", label: "another position" }, { key: "DONE", label: "proceed" }] });
          if (k === "DONE") break;
        }
      }
      setCount(0); rail.forEach(seg => { seg.className = "done"; });
      await evaluate();
      await allocate();
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

  // The instructor's read starts on its own; a student presses Power on, which
  // is also the press the browser wants before any sound plays.
  if (readOnly) run(); else power.addEventListener("click", run);

  return {
    destroy() { alive = false; clearInterval(clockTimer); humOff(); root.innerHTML = ""; root.classList.remove("jb"); },
  };
}
