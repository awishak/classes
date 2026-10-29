// Takeover: the season, as pure functions. No DOM, no React, nothing random.
//
// A student takes over a team and spends six weeks on its culture. Everything
// that looks like chance is a hash of the student's name and where they are
// in the season, so a reload shows the same season, a resumed file replays
// exactly, and the instructor's read of a file is what the student saw.
// game.jsx draws what this file decides. See BRIEF.md.
//
// Every bank of words below is Claude's draft, 2026-10-29, for Andrew to
// edit. His own words are marked where they are his.

// ─── chance that is not chance ───

export const hash = (s) => { let h = 5381; for (const ch of String(s).toLowerCase()) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h; };
// The hash alone is not enough: two keys that differ only in their last
// character come out a few bits apart, so one coach drew the same opponent
// three weeks running. A final mix (murmur3's) spreads them out.
const mix = (h) => { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; return h >>> 0; };
// A number in [0, 1) that the same key always gives.
export const roll = (...key) => mix(hash(key.join("|"))) / 4294967296;
// A list in an order the key sets.
export const shuffled = (list, ...key) => list.map((x, i) => [roll(...key, i, x), i, x]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
export const pick = (list, ...key) => list[Math.floor(roll(...key) * list.length) % list.length];

// ─── the shape of a season ───

export const TAKEOVER_KEY = "takeover";
// The working name. Andrew, 2026-10-29: "what is a team called? I don't know
// yet." The title is his to rename; the key stays.
export const TAKEOVER_TITLE = "Takeover";
export const LETTERS = ["a", "b", "c", "d", "e", "f"];
export const WEEKS = LETTERS.length;
export const START_CAPITAL = 2;
export const START_CULTURE = 40;
export const POLL_WEEKS = ["b", "d", "f"];

// Fields, as the database names them: letters, an optional ":part".
export const F = {
  sport: "sport",
  concepts: "concepts",
  cast: "cast",
  team: "team",
  prompt: (w) => "prompt:" + w,
  spend: (w) => "spend:" + w,
  result: (w) => "result:" + w,
  reflect: (w) => "reflect:" + w,
  source: (w) => "source:" + w,
  poll: (w) => "poll:" + w,
  final: (i) => "final:" + ["a", "b", "c"][i],
};
export const FIELDS = [F.sport, F.team, F.concepts, F.cast, ...LETTERS.flatMap(w => [F.prompt(w), F.spend(w), F.result(w), F.reflect(w), F.source(w)]), ...POLL_WEEKS.map(F.poll), F.final(0), F.final(1), F.final(2)];

// ─── sports ───

export const SPORTS = [
  { id: "volleyball", name: "Volleyball", match: "match", matches: "matches", period: "set", onCourt: 6, where: "the court", ball: "ball" },
  { id: "footy", name: "Aussie rules football", match: "match", matches: "matches", period: "quarter", onCourt: 18, where: "the oval", ball: "footy" },
  { id: "softball", name: "Softball", match: "game", matches: "games", period: "inning", onCourt: 9, where: "the field", ball: "ball" },
];
export const sportOf = (id) => SPORTS.find(s => s.id === id) || null;

// Team names that do not fit the place. Andrew, 2026-10-29: "names that
// don't fit the area ... the New York Cowboys, or the Kansas Marlins." A
// student picks from six the name deals them; the rest are opponents.
export const TEAM_NAMES = [
  "New York Cowboys", "Kansas Marlins", "Miami Lumberjacks", "Nebraska Surfers", "Phoenix Icebergs", "Alaska Heatwave",
  "Las Vegas Puritans", "Seattle Sunshine", "Denver Sea Lions", "Utah Jazz Hands", "Boston Cacti", "Houston Glaciers",
  "Minneapolis Flamingos", "Death Valley Penguins", "Sacramento Sharks", "Omaha Pirates", "Vermont Volcanoes", "Idaho Tide",
  "Cleveland Coral", "Buffalo Palm Trees", "Fresno Fjords", "Reno Rainforest", "Tulsa Tsunami", "Wichita Whales",
];
export const teamChoicesFor = (name) => shuffled(TEAM_NAMES, name, "teams").slice(0, 6);
export const teamNameFor = (name) => teamChoicesFor(name)[0];
// Six different opponents a season, dealt once: a shuffle of the other
// names, read by the week.
export const opponentFor = (name, week, team) => { const rest = TEAM_NAMES.filter(t => t !== team); const i = Math.max(0, LETTERS.indexOf(week)); return shuffled(rest, name, "opps")[i % rest.length]; };
// A jersey for a team, from the palette's team colours (pixel.js JERSEYS).
export const jerseyFor = (team) => hash(team || "") % 7;

// Signs in the crowd. Claude's draft, 2026-10-29.
export const SIGNS = [
  "WRONG CITY RIGHT TEAM", "WE ARE NOT FROM HERE", "GO {TEAM}", "HI MOM", "THE COACH IS NEW", "IS THIS THE RIGHT GYM",
  "{TEAM} SINCE TUESDAY", "DEFENSE (OPTIONAL)", "WE DROVE 6 HOURS", "BRING BACK THE OLD COACH", "I CAME FOR THE SNACKS", "{TEAM} 4 EVER",
];
export const signFor = (name, week, team) => pick(SIGNS, name, "sign", week).replace("{TEAM}", String(team || "").toUpperCase());

/** The cast as the file keeps it, one part a line, and back. */
export const packCast = (cast) => CHARACTERS.map(c => c.id + "=" + (cast[c.id] || "")).join("\n");
export const parseCast = (s) => {
  if (!s) return null;
  const cast = {};
  String(s).split("\n").forEach(l => { const i = l.indexOf("="); if (i > 0) cast[l.slice(0, i)] = l.slice(i + 1).trim(); });
  return CHARACTERS.every(c => cast[c.id]) ? cast : null;
};

// ─── the five spends ───
//
// Andrew, 2026-10-29: "spending capital is like, you have a difficult person.
// When you first come in, you don't have a lot of capital, so you gotta
// focus ... motivating players to learn? Or getting wins quickly? Or
// establishing dominance?" The names and lines are Claude's draft.

export const SPENDS = [
  { id: "teach", label: "Teach", line: "Run practice like a classroom. Motivate players to learn.", cost: 1, culture: 4, win: -1 },
  { id: "goals", label: "Set goals", line: "Sit the team down and write the season's goals together.", cost: 1, culture: 3, win: 0 },
  { id: "cohesion", label: "Build cohesion", line: "Team dinner, no phones. Spend the week on each other.", cost: 2, culture: 6, win: -1 },
  { id: "win", label: "Win now", line: "Best lineup, tight game plan, chase the result.", cost: 2, culture: -2, win: 3 },
  { id: "dominate", label: "Establish dominance", line: "New rules, your rules. Late to practice costs a start.", cost: 3, culture: -5, win: 2 },
];
export const spendOf = (id) => SPENDS.find(s => s.id === id) || null;
// The room has to be ready for dominance: above this culture the team reads
// rules as standards, below as a threat.
export const READY = 55;
export const costOf = (spend, culture) => spend.id === "dominate" && culture >= READY ? 2 : spend.cost;
export const affordable = (capital, culture) => SPENDS.filter(s => costOf(s, culture) <= capital);

// ─── the five players who matter ───
//
// Five of the student's classmates are dealt these parts. The affinity is
// how each feels about each spend: +2 loves, -2 hates. Dominance turns for
// the star and the veteran once the room is ready (READY).

export const CHARACTERS = [
  { id: "star", label: "The star", blurb: "Best player on the team. Has goals of their own.", affinity: { teach: -1, win: 2, dominate: -1, cohesion: 0, goals: 1 }, readyDominate: 1 },
  { id: "veteran", label: "The veteran", blurb: "Runs the group chat. Has outlasted three coaches.", affinity: { teach: -1, win: 0, dominate: -2, cohesion: 1, goals: 1 }, readyDominate: 1 },
  { id: "rookie", label: "The rookie", blurb: "First year. Wants to know exactly what to do.", affinity: { teach: 2, win: -1, dominate: -1, cohesion: 1, goals: 2 }, readyDominate: 0 },
  { id: "transfer", label: "The transfer", blurb: "Came in this season. Not in the group chat yet.", affinity: { teach: 1, win: 0, dominate: -1, cohesion: 2, goals: 0 }, readyDominate: 0 },
  { id: "quiet", label: "The quiet one", blurb: "Plays hard, says little. Something is going on.", affinity: { teach: 1, win: -2, dominate: -2, cohesion: 2, goals: 0 }, readyDominate: 0 },
];
export const characterOf = (id) => CHARACTERS.find(c => c.id === id) || null;

// Names for a squad too small to fill the parts: COMM 999's rig has three.
export const FILL = ["Dot Ramirez", "Bo Nakamura", "Frankie Oduya", "Sam Petrov", "Jules Okafor", "Tess Lindqvist", "Ravi Banerjee", "Mo Haddad"];

/** Who plays which part, from the classmates the page hands over. */
export function deal(name, classmates) {
  const names = (classmates || []).map(s => String(s || "").trim()).filter(Boolean);
  const order = shuffled(names, name, "deal");
  const fill = FILL.filter(f => !names.includes(f));
  while (order.length < CHARACTERS.length) order.push(fill.shift());
  const cast = {};
  CHARACTERS.forEach((c, i) => { cast[c.id] = order[i]; });
  return { cast, bench: order.slice(CHARACTERS.length) };
}

// ─── the concepts, from the chapters ───
//
// The twenty section titles the team topics sheet offers, with the ways
// students actually typed them (Motivation, Team Chemistry, Team
// Coordination, "Teamwork and coaching: positive feedback").

export const CONCEPTS = [
  { id: "teamwork", name: "Teamwork and coaching", alts: ["teamwork"] },
  { id: "coordination", name: "Physical and mental coordination", alts: ["coordination"] },
  { id: "knowledge", name: "Knowledge sharing", alts: ["knowledge"] },
  { id: "roles", name: "Clarity of roles", alts: ["roles", "role"] },
  { id: "goals", name: "Goal setting", alts: ["goal"] },
  { id: "motivation", name: "Motivation and motivational climate", alts: ["motivation", "motivational"] },
  { id: "support", name: "Social support", alts: ["support"] },
  { id: "negative", name: "Negative messaging", alts: ["negative"] },
  { id: "decisions", name: "Decision making", alts: ["decision"] },
  { id: "complexity", name: "Coaching and complexity", alts: ["complexity"] },
  { id: "cohesion", name: "Cohesion", alts: ["cohesion", "chemistry"] },
  { id: "culture", name: "Culture", alts: ["culture"] },
  { id: "power", name: "Power", alts: ["power"] },
  { id: "conflict", name: "Conflict and dissent", alts: ["conflict", "dissent"] },
  { id: "emotion", name: "Emotion", alts: ["emotion"] },
  { id: "failure", name: "Failure", alts: ["failure", "losing"] },
  { id: "nonverbal", name: "Nonverbal communication", alts: ["nonverbal", "non-verbal"] },
  { id: "time", name: "Time and time-outs", alts: ["time-out", "timeout", "time"] },
  { id: "gender", name: "Gender", alts: ["gender"] },
  { id: "lessons", name: "Lessons from sports teams for other teams", alts: ["lessons", "other teams"] },
];
export const conceptOf = (id) => CONCEPTS.find(c => c.id === id) || null;
// The class's most chosen, 2026-10-29, in order: what fills a short list.
export const CLASS_TOP = ["goals", "failure", "motivation", "cohesion", "emotion", "culture"];

const plain = (s) => String(s || "").toLowerCase().replace(/[^a-z\s-]/g, " ").replace(/\s+/g, " ").trim();
/** A typed concept to its id: the chapter's title first, then a word of it. */
export function matchConcept(text) {
  const t = plain(text);
  if (!t) return null;
  const exact = CONCEPTS.find(c => plain(c.name) === t);
  if (exact) return exact.id;
  // "Coaching and complexity" before "Teamwork and coaching": the longer,
  // rarer word wins, so the alts are tried most specific first.
  const order = [...CONCEPTS].sort((a, b) => Math.max(...b.alts.map(x => x.length)) - Math.max(...a.alts.map(x => x.length)));
  for (const c of order) if (c.alts.some(a => t.includes(a))) return c.id;
  return null;
}

/** A student's five concepts, from their team topics answers, then the class's. */
export function conceptsFor(topicsAnswers) {
  const own = [];
  ["a", "b", "c", "d", "e"].forEach(s => {
    const id = matchConcept((topicsAnswers || {})["topic:" + s]);
    if (id && !own.some(o => o.id === id)) own.push({ id, slot: s });
  });
  const ids = own.map(o => o.id);
  for (const id of CLASS_TOP) { if (ids.length >= 5) break; if (!ids.includes(id)) { ids.push(id); own.push({ id, slot: "" }); } }
  return own.slice(0, 5);
}

// ─── what happens each week ───
//
// Two events a concept, forty in all. who is the part the event lands on.
// fit is how each spend answers the event: +2 the right call, -2 the wrong
// one. {name} is the player, {team} the team, {opp} this week's opponent,
// {match} the sport's word for a game, {where} the court, oval or field.

export const EVENTS = [
  { id: "teamwork-1", concept: "teamwork", who: "veteran", text: "{name} runs the warm-up without asking you. The team follows {name}, not you.", fit: { teach: 1, goals: 1, cohesion: 1, win: 0, dominate: -2 } },
  { id: "teamwork-2", concept: "teamwork", who: "rookie", text: "{name} asks you after practice what the drills are for. Nobody has ever explained.", fit: { teach: 2, goals: 1, cohesion: 0, win: -1, dominate: -1 } },
  { id: "coordination-1", concept: "coordination", who: "star", text: "Two players go for the same {ball} and collide. {name} yells at the one who got there second.", fit: { teach: 2, goals: 0, cohesion: 1, win: -1, dominate: 0 } },
  { id: "coordination-2", concept: "coordination", who: "transfer", text: "{name} is a step late on every play. The old system is not the one {name} learned.", fit: { teach: 2, goals: 0, cohesion: 1, win: -1, dominate: -1 } },
  { id: "knowledge-1", concept: "knowledge", who: "veteran", text: "{name} knows the {opp} scouting report by heart and has not shared a word of it.", fit: { teach: 1, goals: 0, cohesion: 2, win: 0, dominate: -1 } },
  { id: "knowledge-2", concept: "knowledge", who: "rookie", text: "{name} learned a new serve on YouTube and is scared to show anyone.", fit: { teach: 2, goals: 0, cohesion: 1, win: -1, dominate: -1 } },
  { id: "roles-1", concept: "roles", who: "star", text: "{name} wants to play every position. The rest of the lineup has stopped arguing.", fit: { teach: 0, goals: 2, cohesion: 0, win: 0, dominate: 1 } },
  { id: "roles-2", concept: "roles", who: "transfer", text: "{name} does not know who to pass to, so {name} passes to nobody.", fit: { teach: 1, goals: 2, cohesion: 1, win: -1, dominate: -1 } },
  { id: "goals-1", concept: "goals", who: "star", text: "{name} tells a reporter the goal is a scholarship. The team's goal was not mentioned.", fit: { teach: 0, goals: 2, cohesion: 1, win: 0, dominate: -1 } },
  { id: "goals-2", concept: "goals", who: "veteran", text: "{name} says last year's goal was a winning record and the team missed by one {match}. Nobody wants to set another.", fit: { teach: 0, goals: 2, cohesion: 1, win: 1, dominate: -1 } },
  { id: "motivation-1", concept: "motivation", who: "quiet", text: "{name} stops going hard in drills. Ask around and the answer is a shrug.", fit: { teach: 1, goals: 0, cohesion: 2, win: -2, dominate: -2 } },
  { id: "motivation-2", concept: "motivation", who: "rookie", text: "{name} made one mistake in the {opp} {match} and has replayed it all week.", fit: { teach: 2, goals: 1, cohesion: 1, win: -1, dominate: -1 } },
  { id: "support-1", concept: "support", who: "transfer", text: "{name} ate alone after the {match} again. The team's table had an empty seat.", fit: { teach: 0, goals: 0, cohesion: 2, win: -1, dominate: -1 } },
  { id: "support-2", concept: "support", who: "quiet", text: "{name}'s parent emails you. Things at home are hard, and {name} asked that nobody be told.", fit: { teach: 0, goals: -1, cohesion: 2, win: -2, dominate: -2 } },
  { id: "negative-1", concept: "negative", who: "star", text: "{name} tells the rookie, in front of everyone, that the pass was garbage.", fit: { teach: 1, goals: 0, cohesion: 1, win: -1, dominate: 1 } },
  { id: "negative-2", concept: "negative", who: "veteran", text: "A screenshot of {name} calling the game plan a joke makes the rounds.", fit: { teach: 0, goals: 1, cohesion: 1, win: -1, dominate: 1 } },
  { id: "decisions-1", concept: "decisions", who: "star", text: "Down late against {opp}, {name} waves off your play and runs a different one.", fit: { teach: 0, goals: 1, cohesion: 0, win: 0, dominate: 1 } },
  { id: "decisions-2", concept: "decisions", who: "veteran", text: "{name} wants a team vote on the travel playlist. Then on the lineup.", fit: { teach: 0, goals: 2, cohesion: 1, win: 0, dominate: 0 } },
  { id: "complexity-1", concept: "complexity", who: "rookie", text: "You call a time-out and give four instructions. {name} remembers one.", fit: { teach: 2, goals: 0, cohesion: 0, win: 0, dominate: -1 } },
  { id: "complexity-2", concept: "complexity", who: "star", text: "{name} says the new system is too slow and the old one worked fine.", fit: { teach: 2, goals: 1, cohesion: 0, win: 0, dominate: 0 } },
  { id: "cohesion-1", concept: "cohesion", who: "veteran", text: "There is a group chat with the whole team and a second one without the new players. {name} started both.", fit: { teach: 0, goals: 0, cohesion: 2, win: -1, dominate: 0 } },
  { id: "cohesion-2", concept: "cohesion", who: "transfer", text: "The team has a handshake. {name} has not been taught the handshake.", fit: { teach: 0, goals: 0, cohesion: 2, win: -1, dominate: -1 } },
  { id: "culture-1", concept: "culture", who: "veteran", text: "The seniors keep a tradition where first-years carry every bag. {name} says a coach tried to end that once.", fit: { teach: 0, goals: 1, cohesion: 1, win: -1, dominate: 1 } },
  { id: "culture-2", concept: "culture", who: "star", text: "{name} is late to practice for the third time. The last coach let {name} be late.", fit: { teach: 0, goals: 1, cohesion: 0, win: -1, dominate: 2 } },
  { id: "power-1", concept: "power", who: "star", text: "{name}'s parent calls the athletic director about playing time. The AD calls you.", fit: { teach: 0, goals: 1, cohesion: 0, win: 0, dominate: 2 } },
  { id: "power-2", concept: "power", who: "veteran", text: "{name} tells the freshmen which coaches to listen to. You are not on the list.", fit: { teach: 0, goals: 1, cohesion: 1, win: 0, dominate: 1 } },
  { id: "conflict-1", concept: "conflict", who: "star", text: "{name} and the veteran stop speaking. Practice gets very quiet.", fit: { teach: 0, goals: 0, cohesion: 2, win: -1, dominate: 0 } },
  { id: "conflict-2", concept: "conflict", who: "rookie", text: "{name} pushes back on a drill in front of the team. {name} is not wrong.", fit: { teach: 2, goals: 1, cohesion: 0, win: -1, dominate: -2 } },
  { id: "emotion-1", concept: "emotion", who: "quiet", text: "{name} cries in the hallway after the {opp} {match}. Then walks back in like nothing happened.", fit: { teach: 0, goals: 0, cohesion: 2, win: -2, dominate: -2 } },
  { id: "emotion-2", concept: "emotion", who: "star", text: "{name} gets a yellow card for mouthing off and plays worse angry.", fit: { teach: 1, goals: 0, cohesion: 1, win: 0, dominate: 1 } },
  { id: "failure-1", concept: "failure", who: "veteran", text: "You lose to {opp} by a lot. {name} says the team has been here before and nothing changed then either.", fit: { teach: 1, goals: 2, cohesion: 1, win: 0, dominate: -1 } },
  { id: "failure-2", concept: "failure", who: "rookie", text: "{name} misses the last play of a close {match} and offers to quit the team.", fit: { teach: 1, goals: 0, cohesion: 2, win: -2, dominate: -2 } },
  { id: "nonverbal-1", concept: "nonverbal", who: "transfer", text: "The team has hand signals. {name} keeps reading them wrong and nobody says so.", fit: { teach: 2, goals: 0, cohesion: 1, win: -1, dominate: -1 } },
  { id: "nonverbal-2", concept: "nonverbal", who: "star", text: "{name} rolls their eyes at every one of your time-outs. The whole bench sees.", fit: { teach: 0, goals: 0, cohesion: 1, win: 0, dominate: 2 } },
  { id: "time-1", concept: "time", who: "star", text: "You call time-out with the {match} on the line. {name} talks over your whole huddle.", fit: { teach: 0, goals: 0, cohesion: 0, win: 1, dominate: 2 } },
  { id: "time-2", concept: "time", who: "rookie", text: "Practice runs long three days in a row. {name} has a lab at six and says nothing.", fit: { teach: 1, goals: 1, cohesion: 1, win: -1, dominate: -2 } },
  { id: "gender-1", concept: "gender", who: "veteran", text: "A visiting coach jokes that your team talks too much. {name} heard every word.", fit: { teach: 0, goals: 0, cohesion: 2, win: 0, dominate: 1 } },
  { id: "gender-2", concept: "gender", who: "quiet", text: "{name} asks why the men's team got the good {where} time again.", fit: { teach: 0, goals: 1, cohesion: 1, win: 0, dominate: 1 } },
  { id: "lessons-1", concept: "lessons", who: "transfer", text: "{name} played for a program that did everything differently and keeps saying so.", fit: { teach: 1, goals: 1, cohesion: 1, win: 0, dominate: -1 } },
  { id: "lessons-2", concept: "lessons", who: "veteran", text: "{name} got a job offer from a company that runs on the team's rules. {name} wants to know which rules are the team's.", fit: { teach: 1, goals: 2, cohesion: 0, win: 0, dominate: 0 } },
];
export const eventOf = (id) => EVENTS.find(e => e.id === id) || null;

// ─── what the players say ───
//
// One line per part, per spend, per mood, as a text to the team's chat.
// Claude's draft, 2026-10-29.

export const LINES = {
  star: {
    teach: { up: "ok the film session actually helped. don't tell anyone", flat: "fine. but i already know this stuff", down: "we're doing homework now? i came here to play" },
    goals: { up: "finally someone wrote it down. i'm in", flat: "sure. as long as my goal is on the list", down: "goals are great. wins are better" },
    cohesion: { up: "dinner was good. still want to win though", flat: "dinner was fine. still want to win though", down: "i don't need friends. i need a ring" },
    win: { up: "THIS is what i've been saying. let's go", flat: "about time", down: "we won and you still want more? ok" },
    dominate: { up: "respect. first coach who meant it", flat: "rules are fine if everyone follows them", down: "you're new here. don't forget that" },
  },
  veteran: {
    teach: { up: "ok coach knows the game. noted", flat: "i've seen this drill before. it works", down: "three coaches. same drills. cool" },
    goals: { up: "first time anyone asked us. i'll hold us to it", flat: "writing it down doesn't make it true", down: "we set goals last year. you know how that went" },
    cohesion: { up: "yeah. that's the team i remember", flat: "nice dinner. doesn't fix the lineup", down: "forced fun. the group chat has thoughts" },
    win: { up: "we needed one. good call", flat: "a win's a win", down: "you're playing the same six and the bench knows" },
    dominate: { up: "took you long enough. the standard is the standard", flat: "fine. i'll follow rules i helped write", down: "everyone, new coach wants to be tough. give it two weeks" },
  },
  rookie: {
    teach: { up: "i finally get what we're doing!! thank you", flat: "ok i think i get the drill now", down: "wait which drill" },
    goals: { up: "i wrote mine on my mirror. is that weird", flat: "mine's on the list. i think", down: "the goal says playoffs. i don't know what i'm supposed to do" },
    cohesion: { up: "i sat with the seniors!! they're actually nice", flat: "dinner was fun. i still don't know the plays", down: "i didn't know where to sit" },
    win: { up: "we won and i played!!", flat: "we won. i watched", down: "i'm scared to mess up so i'm not doing anything" },
    dominate: { up: "ok i like knowing the rules", flat: "the rules are clear at least", down: "i got yelled at and i don't know what i did" },
  },
  transfer: {
    teach: { up: "same system as my old team. finally i can help", flat: "different from my old team but ok", down: "i already learned this a different way" },
    goals: { up: "i'm on the list. feels like i'm on the team", flat: "the goal is fine. nobody asked me though", down: "goals for a team i'm not really on yet" },
    cohesion: { up: "they taught me the handshake!!!", flat: "dinner was nice. still the new kid", down: "i sat at the end again" },
    win: { up: "we won and i started. okay then", flat: "we won. i don't know anyone's name yet", down: "i'm here to win too. i'm just also alone" },
    dominate: { up: "rules i can follow. better than guessing", flat: "fine. same rules for everyone at least", down: "i just got here and i'm already in trouble" },
  },
  quiet: {
    teach: { up: "practice felt like practice again. good", flat: "ok", down: "ok" },
    goals: { up: "a goal i can actually reach. thanks", flat: "sure", down: "another thing to miss" },
    cohesion: { up: "i talked to someone. it helped", flat: "dinner was fine", down: "didn't go. sorry" },
    win: { up: "we won. i'm tired", flat: "we won", down: "i can't keep this up" },
    dominate: { up: "at least it's clear", flat: "fine", down: "i'm late because i can't get out of bed. you don't know that" },
  },
};

// ─── the polls ───
//
// A this or that a week, on weeks b, d and f, from that week's concept.
// Andrew, 2026-10-29: "What do you think is more important, this or that?"

export const POLLS = {
  teamwork: ["A coach who teaches", "A coach who motivates"],
  coordination: ["More reps", "More film"],
  knowledge: ["Share everything", "Share what each player needs"],
  roles: ["Everyone knows their role", "Everyone can play any role"],
  goals: ["A season goal", "A goal for every week"],
  motivation: ["A strict coach", "An open coach"],
  support: ["Support from the coach", "Support from teammates"],
  negative: ["Tell them hard in private", "Tell them soft in front of everyone"],
  decisions: ["Coach decides", "Team votes"],
  complexity: ["One instruction, done well", "Four instructions, done fast"],
  cohesion: ["Friends who win", "Winners who respect each other"],
  culture: ["Change the culture fast", "Change the culture slow"],
  power: ["The coach has the power", "The seniors have the power"],
  conflict: ["Settle it in the room", "Settle it one on one"],
  emotion: ["Play angry", "Play calm"],
  failure: ["Review mistakes right away", "Review mistakes tomorrow"],
  nonverbal: ["Say it", "Signal it"],
  time: ["Call the time-out", "Let them play through"],
  gender: ["Coach every team the same", "Coach every team differently"],
  lessons: ["Sports teams teach other teams", "Other teams teach sports teams"],
};

// When a student's own sheet has no wonder for a concept: the class's,
// unattributed, in Claude's words after theirs.
export const CLASS_WONDERS = {
  teamwork: "I wonder whether a coach who teaches well also motivates well, or whether those are two different coaches.",
  coordination: "I wonder whether teams that read each other without speaking got there by talent or by time together.",
  knowledge: "I wonder what makes a player share what they know instead of keeping an edge.",
  roles: "I wonder what happens when the unofficial leader's instructions conflict with the coach's.",
  goals: "I wonder whether an individual player's goal interferes with the team's goal.",
  motivation: "I wonder if athletes perform better under a strict coach or a more open coach.",
  support: "I wonder whether support from teammates matters as much as support from the coach.",
  negative: "I wonder what split of positive and negative talk is right for a team.",
  decisions: "I wonder which decisions a team should get a vote on.",
  complexity: "I wonder how a coach gives four instructions in a time-out and has one land.",
  cohesion: "I wonder whether a team with average talent and great chemistry beats a talented roster that does not get along.",
  culture: "I wonder how a team changes its culture when the leaders are part of the problem.",
  power: "I wonder how much power a new coach actually has in the first month.",
  conflict: "I wonder whether a team that never argues is healthy or just quiet.",
  emotion: "I wonder how a coach can tell when a player's emotions are starting to hurt their play.",
  failure: "I wonder what the best way is for a coach to talk to a team after a devastating loss.",
  nonverbal: "I wonder whether the signals a team uses matter more than the words.",
  time: "I wonder whether a time-out helps the team or just the coach.",
  gender: "I wonder whether a coach should coach a women's team and a men's team the same way.",
  lessons: "I wonder which of a sports team's habits a workplace should actually copy.",
};

// ─── the season, planned ───

/** The six weeks a student gets: their five concepts in order, then a final from among them. */
export function planSeason({ name, concepts, topicsAnswers }) {
  const five = (concepts || []).slice(0, 5);
  const weeks = LETTERS.map((w, i) => {
    const last = i === 5;
    const pickFrom = last ? five : [five[i]];
    const c = last ? pick(pickFrom, name, "final") : pickFrom[0];
    const concept = c || { id: CLASS_TOP[i % CLASS_TOP.length], slot: "" };
    const bank = EVENTS.filter(e => e.concept === concept.id);
    // The final repeats a concept: take the event that week did not get.
    const earlier = five.findIndex(x => x && x.id === concept.id);
    const used = last && earlier >= 0 ? pick(bank, name, "event", LETTERS[earlier]).id : null;
    const choices = bank.filter(e => e.id !== used);
    const event = pick(choices.length ? choices : bank, name, "event", w);
    const wonder = concept.slot ? String((topicsAnswers || {})["wonder:" + concept.slot] || "").trim() : "";
    const opinion = concept.slot ? String((topicsAnswers || {})["opinion:" + concept.slot] || "").trim() : "";
    // The final asks about what they thought, not what they wondered, so the
    // same question is never asked twice. Claude's variation on Andrew's
    // prompt, 2026-10-29, for him to edit.
    const prompt = last
      ? (opinion ? { kind: "thought", text: opinion } : { kind: "wonder", text: CLASS_WONDERS[concept.id] })
      : { kind: "wonder", text: wonder || CLASS_WONDERS[concept.id] };
    return { week: w, n: i + 1, last, concept: concept.id, event: event.id, who: event.who, prompt, poll: POLL_WEEKS.includes(w) ? POLLS[concept.id] : null };
  });
  // The final repeats a concept, so its poll could repeat week 2's or 4's.
  // Then it asks about another of the five instead, the first not yet polled.
  const asked = weeks.slice(0, 5).filter(x => x.poll).map(x => x.concept);
  const last = weeks[5];
  if (last.poll && asked.includes(last.concept)) {
    const other = five.map(c => c && c.id).find(id => id && !asked.includes(id));
    if (other) last.poll = POLLS[other];
  }
  return weeks;
}

/** The words of an event, with the names in. */
export function tellEvent(event, { cast, sport, team, opp }) {
  const name = cast[event.who] || "a player";
  return event.text.replace(/\{name\}/g, name).replace(/\{team\}/g, team).replace(/\{opp\}/g, opp)
    .replace(/\{match\}/g, sport.match).replace(/\{where\}/g, sport.where).replace(/\{ball\}/g, sport.ball);
}

// ─── one week, resolved ───

export const start = () => ({ capital: START_CAPITAL, culture: START_CULTURE, wins: 0, losses: 0 });

// A swing of -2 to +2, most weeks near zero. Andrew, 2026-10-29: "there is
// some randomness in what the NPCs do and how they react."
const swingOf = (r) => r < 0.1 ? -2 : r < 0.3 ? -1 : r < 0.7 ? 0 : r < 0.9 ? 1 : 2;

/**
 * What a spend does in a week. state is before; the answer carries the state
 * after and everything the screen shows. Pure: the same inputs always give
 * the same week.
 */
export function resolve({ name, week, state, spendId, eventId }) {
  const spend = spendOf(spendId), event = eventOf(eventId);
  if (!spend || !event) throw new Error("Takeover: no such spend or event: " + spendId + ", " + eventId);
  const cost = costOf(spend, state.culture);
  if (cost > state.capital) throw new Error("Takeover: " + spend.id + " costs " + cost + " and the coach has " + state.capital);
  const ready = state.culture >= READY;
  const moods = {};
  let crowd = 0;
  for (const c of CHARACTERS) {
    let m = c.affinity[spend.id];
    if (spend.id === "dominate" && ready) m += c.readyDominate * 2;
    if (event.who === c.id) m += event.fit[spend.id] >= 1 ? 1 : event.fit[spend.id] <= -1 ? -1 : 0;
    // Each player has a week of their own: one in five swings a step.
    const r = roll(name, "mood", week, spend.id, c.id);
    if (r < 0.1) m -= 1; else if (r > 0.9) m += 1;
    moods[c.id] = m >= 1 ? "up" : m <= -1 ? "down" : "flat";
    crowd += moods[c.id] === "up" ? 1 : moods[c.id] === "down" ? -1 : 0;
  }
  let base = spend.culture;
  if (spend.id === "dominate" && ready) base = 2;
  const swing = swingOf(roll(name, "swing", week, spend.id));
  const delta = base + event.fit[spend.id] * 2 + crowd + swing;
  const culture = Math.max(0, Math.min(100, state.culture + delta));
  // The match: culture carries most of the chance, the spend the rest.
  const p = Math.max(0.1, Math.min(0.9, 0.3 + (culture - START_CULTURE) / 150 + spend.win * 0.08 + event.fit[spend.id] * 0.03));
  const won = roll(name, "match", week, spend.id) < p;
  const capital = state.capital - cost + 1 + (won ? 1 : 0);
  return {
    week, spend: spend.id, event: event.id, cost, swing, delta, culture, won, p: Math.round(p * 100),
    moods, capital, wins: state.wins + (won ? 1 : 0), losses: state.losses + (won ? 0 : 1),
  };
}

/** The state after a result. */
export const after = (result) => ({ capital: result.capital, culture: result.culture, wins: result.wins, losses: result.losses });

// A result as the file keeps it: short keys, under one row.
export const packResult = (r) => JSON.stringify({ w: r.week, s: r.spend, e: r.event, c: r.cost, g: r.swing, d: r.delta, u: r.culture, v: r.won ? 1 : 0, p: r.p, m: CHARACTERS.map(c => r.moods[c.id][0]).join(""), k: r.capital, x: r.wins, l: r.losses });
export const unpackResult = (s) => {
  let o;
  try { o = JSON.parse(s); } catch { return null; }
  if (!o || typeof o !== "object" || !o.w || !o.s || !o.e) return null;
  const moodOf = { u: "up", f: "flat", d: "down" };
  const moods = {};
  CHARACTERS.forEach((c, i) => { moods[c.id] = moodOf[String(o.m || "")[i]] || "flat"; });
  return { week: o.w, spend: o.s, event: o.e, cost: +o.c || 0, swing: +o.g || 0, delta: +o.d || 0, culture: +o.u || 0, won: !!o.v, p: +o.p || 0, moods, capital: +o.k || 0, wins: +o.x || 0, losses: +o.l || 0 };
};

/** The season so far, from the file: every saved week applied in order, stopping at the first week without a result. */
export function replay(answers) {
  let state = start();
  const results = [];
  for (const w of LETTERS) {
    const r = unpackResult((answers || {})[F.result(w)]);
    if (!r) break;
    results.push(r);
    state = after(r);
  }
  return { state, results, week: LETTERS[results.length] || null };
}

/** A score for the week's match, in the sport's numbers, the same every time. */
export function scoreOf(sport, won, name, week) {
  const r = roll(name, "score", week);
  if (sport.id === "volleyball") { const l = Math.floor(r * 2); return won ? "3-" + l : l + "-3"; }
  if (sport.id === "footy") { const a = 60 + Math.floor(r * 40), b = a - 6 - Math.floor(r * 30); return won ? a + "-" + b : b + "-" + a; }
  const a = 4 + Math.floor(r * 6), b = Math.max(0, a - 1 - Math.floor(r * 4));
  return won ? a + "-" + b : b + "-" + a;
}

/** A culture number as the end screen grades it. */
export const gradeOf = (culture) => culture >= 80 ? "A" : culture >= 65 ? "B" : culture >= 50 ? "C" : culture >= 35 ? "D" : "F";

// ─── the words the student reads ───
//
// Andrew's prompt, 2026-10-29, word for word, is `reflect`. The rest is
// Claude's draft for him to edit in place (useCopy, row COPY_ROW).

export const COPY_ROW = "worksheet-takeover-plan";
export const DEFAULT_COPY = {
  title: TAKEOVER_TITLE,
  credit: "COMM 118 · Weekly Challenge 3 · Due Tuesday, November 3",
  start: "You are the new head coach. The team is not yours yet.",
  intro: "You have six weeks. Each week something happens, and you decide what to spend your capital on. The players react. Some of them are people you know.",
  pickSport: "Pick your sport.",
  pickTeam: "Pick your team.",
  pickTeamLine: "None of these names make sense. Pick one anyway.",
  matchDay: "VS",
  meet: "Meet the team.",
  meetLine: "Five of them will decide how this goes.",
  capital: "Capital",
  culture: "Culture",
  record: "Record",
  spendAsk: "What do you spend this week on?",
  spendNote: "You earn one capital a week, and one more for a win.",
  cannot: "Not enough capital.",
  chat: "Team chat",
  reflect: "You wondered: {wonder}. Based on what you just saw and what you know, what do you think now? Please write 2-4 sentences, and include at least one source, which can be from our book, our readings, or somewhere else.",
  reflectThought: "You thought: {wonder}. After a season of this, do you still think so? Please write 2-4 sentences, and include at least one source, which can be from our book, our readings, or somewhere else.",
  reflectHint: "2-4 sentences",
  sourceAsk: "Your source",
  sourceHint: "A link, or the book and a page",
  pollAsk: "Which matters more?",
  next: "Next week",
  finals: "The final week.",
  seasonOver: "Season over.",
  "final.a": "You spent six weeks of capital. What did you spend most of it on, and what would you spend differently in a second season?",
  "final.b": "Pick one thing a player said in the chat this season. Were they right?",
  "final.c": "What did this season show you about taking over a team that the reading did not?",
  submit: "Hand in the season",
  submitted: "Handed in",
  recall: "Take it back",
  resume: "Pick up where you left off",
  restart: "Start a new season",
  onFile: "Your season is on file.",
};
