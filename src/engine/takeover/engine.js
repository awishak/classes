// Takeover: the season, as pure functions. No DOM, no React, nothing random.
//
// A student takes over a team and spends six weeks on it. Three numbers run
// 0 to 100: culture, skills and strategy, and success. The first two start
// wherever the last coach left them and set the chance of winning each
// week; winning moves the third. Capital is five coins. Every action costs
// some, and the five players give coins back by how they took the week.
//
// Everything that looks like chance is a hash of the student's name and
// where they are in the season, so a reload shows the same season, a
// resumed file replays exactly, and the instructor's read is what the
// student saw. game.jsx draws what this file decides. See BRIEF.md.
//
// Andrew, 2026-10-29, on the second pass: "Culture. Skills and strategy,
// and then success ... those numbers are from 0 to 100. They should start
// in different places, anywhere between 35 and 65 ... the higher those
// numbers are, the more likely you are to win games ... you should start
// with five things of capital ... If a player gives you a plus after the
// game, you get one of the pieces of capital back. If a player gives you an
// equal sign, you get half of it back. And if a player gives you a minus
// sign, you lose that capital ... You can't give people the same options
// every round ... after the first one, it should be in response to a thing."
// Every bank of words below is Claude's draft for him to edit, except where
// marked as his.

// ─── chance that is not chance ───

export const hash = (s) => { let h = 5381; for (const ch of String(s).toLowerCase()) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h; };
// The hash alone is not enough: two keys that differ only in their last
// character come out a few bits apart. A final mix (murmur3's) spreads them.
const mix = (h) => { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; return h >>> 0; };
// A number in [0, 1) that the same key always gives.
export const roll = (...key) => mix(hash(key.join("|"))) / 4294967296;
// A list in an order the key sets.
export const shuffled = (list, ...key) => list.map((x, i) => [roll(...key, i, x), i, x]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
export const pick = (list, ...key) => list[Math.floor(roll(...key) * list.length) % list.length];

// ─── the shape of a season ───

// Andrew, 2026-10-29: "game name is Locker Room." The folder keeps its first
// name; the key is the address.
export const TAKEOVER_KEY = "locker-room";
export const TAKEOVER_TITLE = "Locker Room";
export const LETTERS = ["a", "b", "c", "d", "e", "f", "g"];
export const WEEKS = LETTERS.length;
export const START_CAPITAL = 5;
export const POLL_WEEKS = ["b", "d", "f"];
// From this week on, more than one option a week. Andrew: "Starting from
// week 3 on, give them the instruction that they are allowed to do more
// than one thing ... they can choose as many as they want."
export const MULTI_FROM = 3;
// Coins pile up on a coach who buys nothing. Andrew: "i have too much
// capital and not enough to spend it on." So the purse holds CAP at most,
// and from MARKUP_FROM on every week option that costs anything costs one
// more.
export const CAP = 8;
export const MARKUP_FROM = 4;
/** What an option costs in a given week: its price, plus one from MARKUP_FROM on if it is the week's own and not free. */
export const costOf = (option, weekLetter) => option.cost + (option.cost > 0 && !String(option.id).startsWith("x-") && LETTERS.indexOf(weekLetter) + 1 >= MARKUP_FROM ? 1 : 0);
// What a player's reaction gives back, in coins. Andrew's rule.
export const RETURN = { up: 1, flat: 0.5, down: 0 };

// Fields, as the database names them: letters, an optional ":part".
export const F = {
  sport: "sport",
  team: "team",
  concepts: "concepts",
  cast: "cast",
  prompt: (w) => "prompt:" + w,
  choice: (w) => "choice:" + w,
  result: (w) => "result:" + w,
  reflect: (w) => "reflect:" + w,
  source: (w) => "source:" + w,
  poll: (w) => "poll:" + w,
  final: (i) => "final:" + ["a", "b", "c"][i],
};
export const FIELDS = [F.sport, F.team, F.concepts, F.cast, ...LETTERS.flatMap(w => [F.prompt(w), F.choice(w), F.result(w), F.reflect(w), F.source(w)]), ...POLL_WEEKS.map(F.poll), F.final(0), F.final(1), F.final(2)];

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
  "Chicago Coconuts", "Detroit Dolphins", "Albuquerque Admirals", "Oklahoma Oysters", "Pittsburgh Pelicans", "Milwaukee Mangoes",
  "Dallas Glaciers", "Atlanta Avalanche", "Portland Sahara", "Baltimore Bison", "Tucson Trawlers", "Honolulu Snowplows",
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

// ─── the five players who matter ───
//
// Five of the student's classmates are dealt these parts. Andrew: "You have
// 5 players who are playing, no matter what the game is." Each option below
// names who likes and who dislikes it; everyone else is flat.

export const CHARACTERS = [
  { id: "star", label: "The star", blurb: "Best player on the team. Has goals of their own." },
  { id: "veteran", label: "The veteran", blurb: "Runs the group chat. Has outlasted three coaches." },
  { id: "rookie", label: "The rookie", blurb: "First year. Wants to know exactly what to do." },
  { id: "transfer", label: "The transfer", blurb: "Came in this season. Not in the group chat yet." },
  { id: "quiet", label: "The quiet one", blurb: "Plays hard, says little. Something is going on." },
];
export const characterOf = (id) => CHARACTERS.find(c => c.id === id) || null;
const ALL = CHARACTERS.map(c => c.id);

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

/** The cast as the file keeps it, one part a line, and back. */
export const packCast = (cast) => CHARACTERS.map(c => c.id + "=" + (cast[c.id] || "")).join("\n");
export const parseCast = (s) => {
  if (!s) return null;
  const cast = {};
  String(s).split("\n").forEach(l => { const i = l.indexOf("="); if (i > 0) cast[l.slice(0, i)] = l.slice(i + 1).trim(); });
  return CHARACTERS.every(c => cast[c.id]) ? cast : null;
};

// ─── the concepts, from the chapters ───

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

// ─── what an action is for ───

export const TAGS = {
  same: { label: "Keep things the same", line: "Costs nothing. Skills creep up from reps. Culture does not move on its own." },
  culture: { label: "Culture", line: "The team on each other. Costs practice time." },
  skills: { label: "Skills and strategy", line: "Reps, film, systems. The scoreboard notices first." },
  standards: { label: "Standards", line: "Rules and consequences. Clear, and not free." },
  care: { label: "Care", line: "One player at a time. Slow and remembered." },
};

// ─── what happens each week, and what the coach can do ───
//
// Week 1 is the opener. Weeks 2 to 5 answer the student's own concepts.
// Week 6 is the finale. Every situation has one option that costs nothing.
// {name} is the player the week lands on; {star}, {veteran}, {rookie},
// {transfer}, {quiet} and {bench} are the cast; {opp}, {match}, {period},
// {ball} and {where} are the sport's. `research` is for the control page:
// the finding, and whose sheet raised the question, where the class did.

const opt = (id, label, line, cost, culture, skills, tag, likes = [], dislikes = [], note = "", win = 0) => ({ id, label, line, cost, culture, skills, win, tag, likes, dislikes, note });

export const SITUATIONS = [
  { id: "opener", concept: null, who: null, text: "Your first week. The last coach left in June. Practice is Monday.",
    research: "The first week sets the climate. Mastery versus performance climates (Ames, 1992) start with what the coach rewards on day one.",
    options: [
      opt("same", "Keep things the same", "Run the practices the last coach ran.", 0, 0, 2, "same", ["veteran"], [], "Nothing is risked. Reps alone raise skills a little."),
      opt("dinner", "Team dinner", "Dinner instead of Thursday practice. No phones.", 1, 6, -1, "culture", ["transfer", "quiet", "rookie"], ["star"], "Social cohesion, Carron et al. (2002): time together off the court predicts closeness on it."),
      opt("practice", "Practice more", "Add a morning session. Film, then reps.", 1, -1, 5, "skills", ["star"], ["quiet"], "Skills come from practice volume. The cost is time and energy, which the quiet one has least of.", 1),
      opt("standards", "Set standards", "Late to practice runs. Starting with you.", 2, 1, 3, "standards", ["veteran", "rookie"], ["star"], "Clarity of expectations. The rookie wants to know exactly what is expected (several sheets wondered how a new player learns the rules)."),
    ] },
  { id: "press", concept: null, who: "star", text: "After the {match}, Lisa Davis of the Pacifica Times asks you on the record: {name} disappeared in the second half. What happened?",
    research: "Andrew's situation, 2026-10-29: \"journalist Lisa Davis with a newspaper called the Pacifica Times asks you a question in which she criticizes your star player. And you have to decide if you want to be honest, or if you want to take responsibility for it.\" What a coach says in public is read in the locker room first; public blame is negative messaging in print (Paul's and Jacqueline's sheets), and a coach who takes the hit is read as credible (Kassing & Infante, 1999).",
    options: [
      opt("nocomment", "No comment", "Next question.", 0, -1, 0, "same", [], ["veteran"], "The team reads silence as having nothing to say for them."),
      opt("honest", "Be honest", "{name} did disappear. We have talked about it.", 1, -4, 2, "standards", ["rookie"], ["star", "veteran"], "True, and in print. The star reads it at breakfast."),
      opt("own", "Take responsibility", "That is on me. The plan put {name} in a bad spot.", 2, 5, 0, "care", ["star", "veteran", "transfer"], [], "The coach takes the hit in public. Hard words, if any, stay in the room."),
      opt("spread", "Spread it around", "The whole team was flat, not one player.", 1, -2, 0, "culture", ["star"], ["rookie", "quiet"], "Nobody is blamed and nobody is told the truth."),
    ] },
  { id: "motivation", concept: "motivation", who: "veteran", text: "The team needs a hard defensive drill. {name} is the worst at it and everyone can see.",
    research: "Mastery climate: judged against your own last week, effort and learning get rewarded (Ames, 1992; Duda & Nicholls, 1992). Process goals raised enjoyment and adherence in an exercise study (Jacqueline's finding). Verbal aggression makes coaches read as less credible (Kassing & Infante, 1999; Jacqueline's sheet). Neel, Will and Lucy Kate asked strict versus open.",
    options: [
      opt("skip", "Skip the drill", "Leave it. Play to the strengths you have.", 0, 0, 1, "same", ["veteran"], ["rookie"], "Protects the veteran's ego and leaves the hole."),
      opt("mastery", "Everyone runs it", "Everyone runs the drill, judged against their own last week, {name} included.", 2, 4, 5, "skills", ["rookie", "transfer"], [], "A mastery climate. Nobody is compared to anyone else."),
      opt("callout", "Call {name} out", "Run the drill and say in front of everyone who is dragging it.", 1, -5, 4, "standards", ["star"], ["veteran", "quiet", "transfer"], "Performance climate, public comparison. Short gain, lost credibility.", 1),
      opt("optout", "Let players opt out", "Anyone can sit the drill if they want.", 1, 1, -2, "care", ["veteran"], ["rookie", "star"], "Protects egos at the cost of the skill. The rookie and the star want the work."),
    ] },
  { id: "goals", concept: "goals", who: "star", text: "{name} told a reporter the goal this year is a scholarship. The team read the article.",
    research: "Outcome goals give direction and process goals give something to do when the game gets close (Williams, 2013; Sophia A's opinion, on the rugby coaches). Athletes prioritize performance over outcome (Lucy Kate's reading). Neel, Jacqueline and Chloe asked whether one player's goal interferes with the team's.",
    options: [
      opt("same", "Say nothing", "Let the article be the article.", 0, -2, 0, "same", [], ["veteran"], "The team reads silence as agreement."),
      opt("outcome", "One team goal", "One outcome goal for the season, a winning record, on the wall.", 1, 3, 1, "standards", ["veteran", "rookie"], [], "An outcome goal gives direction. On its own it is fragile when the team is losing."),
      opt("process", "Process goals for everyone", "Sit with each player and write a goal they control, {name} included.", 3, 5, 3, "culture", ["rookie", "quiet", "star"], [], "Process goals: higher enjoyment, lower tension, better adherence. Costs the most time."),
      opt("allow", "Let {name} chase it", "Tell the team a scholarship for {name} is good for everyone.", 1, -3, 2, "skills", ["star"], ["veteran", "transfer"], "The star plays harder. The team hears whose goal counts.", 1),
    ] },
  { id: "cohesion", concept: "cohesion", who: "veteran", text: "There are two group chats. One has the whole team. One leaves out the new players. {name} started both.",
    research: "Task cohesion and social cohesion are different things (Carron, Bray & Eys, 2002), and the best teams have both (Ruby's opinion). Gianna asked whether a team can win without friendships. Emme asked what two closer teammates do to the whole. Chloe asked whether traditions and inside jokes build cohesion. Will and Chloe raised group chats.",
    options: [
      opt("same", "Stay out of it", "Players have always had their own chats.", 0, -2, 1, "same", ["veteran"], ["transfer"], "The split stays. The transfer stays out."),
      opt("dinner", "Team dinner", "Dinner instead of Thursday practice. New players choose the seats.", 1, 5, -1, "culture", ["transfer", "quiet", "rookie"], [], "Social cohesion, built on purpose."),
      opt("mix", "Mixed practice groups", "Every drill pairs a new player with an old one for two weeks.", 2, 4, 3, "skills", ["transfer", "rookie"], ["veteran"], "Task cohesion: working together toward the same goal, which is what predicts winning."),
      opt("merge", "One chat", "Tell {name} the second chat ends tonight.", 1, 2, 0, "standards", ["transfer"], ["veteran", "star"], "A rule the veteran did not choose. The chat goes somewhere else."),
    ] },
  { id: "support", concept: "support", who: "quiet", text: "{name}'s parent emails you. Things at home are hard. {name} asked that nobody be told.",
    research: "Social support from coaches and teammates (Rees & Hardy, 2000) is what lets an athlete ask for help (Gianna's wonder). Catherine and Sophia A asked whether support from teammates matters as much as from the coach. Lila asked how to tell when someone needs encouragement or space. Four sheets asked for mental health as a topic.",
    options: [
      opt("same", "Say nothing, watch", "Keep the email to yourself and keep an eye on {name}.", 0, 0, 1, "same", [], [], "The confidence is kept. Nothing else happens."),
      opt("word", "A quiet word", "Ten minutes after practice, just you and {name}. Nothing to the team.", 1, 4, 0, "care", ["quiet", "transfer"], [], "Support that respects the ask. Trust goes up where nobody sees."),
      opt("week", "A week off", "Give {name} the week, no questions, spot held.", 2, 5, -3, "care", ["quiet", "rookie"], ["star"], "Space, which Lila wondered about. The lineup is thinner for a week.", -1),
      opt("tell", "Tell the captains", "Ask the captains to check in on {name}.", 1, -3, 0, "culture", ["veteran"], ["quiet"], "Teammate support, but the ask was privacy. The quiet one finds out who knows."),
    ] },
  { id: "failure", concept: "failure", who: "rookie", text: "{name} missed the last play of a close {match} and has offered to quit the team.",
    research: "Failing to reach a goal threatens the athlete's ego, so how the coach talks about a loss matters (Sophia A's wonder). Drew asked the best way to talk to a team after a devastating loss. Sophia T asked whether reviewing mistakes right away helps, or whether the positives should come first. Chase and Catherine asked how much pressure is trainable.",
    options: [
      opt("same", "Move on", "Next practice is next practice.", 0, -2, 0, "same", [], ["rookie"], "The rookie's offer goes unanswered."),
      opt("now", "Film tonight", "Watch every mistake tonight while it is fresh.", 1, -3, 5, "skills", ["star"], ["rookie", "quiet"], "Immediate review. The skill lesson lands; the ego threat lands harder."),
      opt("tomorrow", "Film tomorrow, best plays first", "Sleep on it. Tomorrow, start with what worked, then the misses.", 1, 4, 3, "care", ["rookie", "quiet", "transfer"], [], "Positives first, then the mistakes, after a night. Sophia T's hunch."),
      opt("run", "Run them", "Punishment conditioning Monday.", 2, -6, 2, "standards", [], ["rookie", "quiet", "transfer"], "Punishment after failure. Anxiety up, learning down."),
    ] },
  { id: "emotion", concept: "emotion", who: "star", text: "{name} got a card for mouthing off and played worse angry for the rest of the {match}.",
    research: "Anger is associated with worse performance (Jones, 2003; Catherine's finding). Emotion regulation can be taught like any other skill (Sophia A's opinion). Paul and Catherine asked where good nerves end and anxiety starts. Ruby asked how a coach tells when a player is struggling mid-game.",
    options: [
      opt("same", "Let it go", "Everyone has a night.", 0, -1, 0, "same", [], [], "Nothing is learned, nothing is lost."),
      opt("bench", "Bench {name} a {period}", "Next card, {name} sits a {period}.", 1, 2, -2, "standards", ["veteran", "rookie"], ["star"], "A consequence. The star hears a rule, the team hears fairness.", -1),
      opt("reset", "Teach a reset", "A breathing routine the whole team runs after every bad call.", 2, 3, 4, "skills", ["quiet", "rookie", "star"], [], "Emotion regulation as a skill, for everyone, so nobody is singled out."),
      opt("fire", "Use the fire", "Tell {name} to stay angry and point it at the other team.", 1, -2, 1, "skills", ["star"], ["quiet"], "The common move. The research says angry play is worse play.", 1),
    ] },
  { id: "nonverbal", concept: "nonverbal", who: "transfer", text: "The team has hand signals. {name} keeps reading them wrong and nobody says so.",
    research: "Early-season touch, high fives and fist bumps, predicted later NBA performance (Kraus, Huang & Keltner, 2010; Will's finding). Female athletes rated visual signals the fastest channel (Emme and Vianna's finding). Addison asked whether signal-heavy teams win from understanding or from time together. Alexa asked whether long-time teams build a secret language.",
    options: [
      opt("same", "Leave it", "{name} will pick it up.", 0, -2, -1, "same", [], ["transfer"], "The misreads keep costing points."),
      opt("session", "Signals session", "One practice on the signals, {name} and the rookies at the front.", 1, 3, 4, "skills", ["transfer", "rookie"], [], "Teach the language instead of waiting for it."),
      opt("touch", "High-five rule", "Every point, every player touches every player.", 1, 4, 1, "culture", ["transfer", "rookie", "quiet"], ["star"], "The touch study, run on purpose."),
      opt("vet", "Ask {veteran} to teach {name}", "The veteran and the transfer, twenty minutes before practice all week.", 1, 2, 2, "care", ["veteran", "transfer"], [], "Knowledge moves from the player who has it. Two people get closer."),
    ] },
  { id: "time", concept: "time", who: "rookie", text: "Practice ran thirty minutes over three days running. {name} has a lab at six and said nothing.",
    research: "Time is a resource the coach controls and the players pay for. Lila and Chloe asked how teams keep going when progress is slow. Students (Will, Luke, Catherine, Alexa) chose time and time-outs as a concept; the open question is whose time the practice is.",
    options: [
      opt("same", "Keep going", "The work is the work.", 0, -3, 2, "same", [], ["rookie", "quiet"], "The rookie misses the lab and says nothing again."),
      opt("stop", "Hard stop", "Practice ends on the clock from now on. Plan tighter.", 1, 4, 0, "standards", ["rookie", "quiet", "transfer"], [], "A promise kept every day."),
      opt("saturday", "Make it up Saturday", "Add Saturday mornings.", 2, -1, 4, "skills", ["star"], ["veteran", "rookie"], "More reps, less life."),
      opt("ask", "Ask the team", "Ask who has what at six, and build the week around it.", 1, 3, 1, "care", ["rookie", "quiet"], [], "Autonomy support: the team has a say in its own time."),
    ] },
  { id: "gender", concept: "gender", who: "veteran", text: "A visiting coach jokes that your team talks too much. {name} heard every word.",
    research: "Female athletes reported talk and visual signals as their fastest channels (Emme and Vianna's finding). Jacqueline asked why female athletes set performance goals and male athletes outcome goals. Addison asked for gender as a topic; Ruby and Haixing chose it.",
    options: [
      opt("same", "Let it go", "Other coaches say things.", 0, -2, 0, "same", [], ["veteran"], "The team heard it too."),
      opt("speak", "Say something to that coach", "Before you leave the gym.", 1, 4, 0, "standards", ["veteran", "star", "quiet"], [], "The team sees who the coach stands with."),
      opt("team", "Talk to the team", "Tell the team talk is how this team plays, and keep it.", 1, 3, 2, "culture", ["veteran", "transfer"], [], "Talk is coordination. Name it as a strength."),
      opt("less", "Ask for less talk", "Quieter huddles from now on.", 1, -4, 1, "skills", [], ["veteran", "star", "quiet"], "The visiting coach's rule, adopted."),
    ] },
  { id: "culture", concept: "culture", who: "veteran", text: "The seniors keep a tradition where first-years carry every bag. {name} says a coach tried to end that once.",
    research: "Culture change takes an evaluating and planning phase and then sticking with it (Luke's reading, on his own team). Gianna and Sophia T asked how a team changes its culture when the leaders are part of the problem. Audrey asked how much coaches shape culture at all. Emme asked when culture is the players' to change.",
    options: [
      opt("same", "Keep it", "Every program has one.", 0, -1, 0, "same", ["veteran"], ["rookie", "transfer"], "The first-years carry the bags."),
      opt("end", "End it", "Everyone carries their own from today.", 2, 2, 0, "standards", ["rookie", "transfer"], ["veteran", "star"], "Change by decree. The seniors remember the last coach who tried."),
      opt("flip", "Flip it for a week", "Seniors carry the bags this week. Then everyone carries their own.", 1, 5, 0, "culture", ["rookie", "transfer", "quiet"], ["veteran"], "The tradition, turned into a joke the team tells together."),
      opt("captains", "Ask the captains", "Tell the captains the tradition is theirs to keep or end, and you will back either.", 1, 3, 1, "care", ["veteran", "star"], [], "Change planned with the leaders, the way the reading says it sticks."),
    ] },
  { id: "power", concept: "power", who: "star", text: "{name}'s parent calls the athletic director about playing time. The AD calls you.",
    research: "Power on a team sits with more than the coach (Lila's wonder on favoritism; Emme's on when players hold it). Haixing suggested showing the logic behind decisions to the players. Will asked how a low-control coach looks intentional rather than lazy.",
    options: [
      opt("same", "Nothing changes", "The minutes are the minutes.", 0, 1, 0, "same", ["veteran"], ["star"], "The line holds, unexplained."),
      opt("meet", "Meet them both", "Sit with {name} and the parent. Show the minutes and the why.", 1, 3, 1, "care", ["star", "rookie"], [], "The logic behind the decision, shown. Haixing's idea."),
      opt("minutes", "Give the minutes", "{name} starts. The AD stops calling.", 1, -5, 2, "skills", ["star"], ["veteran", "rookie", "transfer"], "The team learns who to call.", 1),
      opt("policy", "Hold the line, in writing", "A playing-time policy for everyone, on the wall, to the AD too.", 2, 4, 1, "standards", ["veteran", "rookie", "transfer"], ["star"], "Power made visible and the same for everyone."),
    ] },
  { id: "conflict", concept: "conflict", who: "star", text: "{name} and {veteran} stopped speaking. Practice got very quiet.",
    research: "Conflict and dissent (Gianna, Lucy Kate, Drew chose it). Lucy Kate drew the line between a harsh coach and a motivating one. Catherine asked whether a team that never argues is healthy. Sarcasm and teasing can build cohesion when the team reads it right (Jacqueline's finding).",
    options: [
      opt("same", "Wait it out", "They will sort it.", 0, -3, 0, "same", [], ["rookie"], "The quiet spreads."),
      opt("room", "Clear the air in the room", "Whole team, one meeting, everyone says one thing.", 2, 3, 0, "culture", ["rookie", "transfer"], ["quiet"], "Dissent in the open. Costs the quiet one most."),
      opt("each", "One on one, twice", "Talk to each of them alone first.", 2, 5, 1, "care", ["star", "veteran", "quiet"], [], "The slow way. Both feel heard before they meet."),
      opt("partners", "Make them partners", "Every drill, those two together, for a week.", 1, 1, 3, "skills", [], ["star", "veteran"], "Forced task cohesion. Works on the court, not off it."),
    ] },
  { id: "roles", concept: "roles", who: "star", text: "{name} wants to play every position. The lineup stopped arguing.",
    research: "Clarity of roles (Beauchamp et al., 2002): players who know their job and everyone else's coordinate faster. Will, Jacqueline, Alexa and Neel chose it. Alexa asked what happens when an unofficial leader's instructions conflict with the coach's.",
    options: [
      opt("same", "Let it ride", "{name} is the best player.", 0, -2, 1, "same", ["star"], ["rookie", "transfer"], "Everyone else plays around the star."),
      opt("cards", "Role cards", "Every player gets a card: your job, your backup, who you talk to.", 1, 4, 4, "skills", ["rookie", "transfer", "veteran"], ["star"], "Role clarity, written down."),
      opt("rotate", "Rotate everyone", "Everyone plays everywhere for two weeks.", 1, 2, -2, "culture", ["rookie"], ["star", "veteran"], "Fair, and slower."),
      opt("captain", "Make {name} captain of one thing", "{name} runs one phase of the game and nothing else.", 2, 3, 2, "care", ["star", "veteran"], [], "A real role for the star, with an edge."),
    ] },
  { id: "knowledge", concept: "knowledge", who: "veteran", text: "{name} knows the {opp} scouting report by heart and has not shared a word of it.",
    research: "Knowledge sharing (Chloe and Jacqueline chose it). Catherine asked what makes a player share an edge. Chloe asked how knowing teammates' strengths helps a coach build the team.",
    options: [
      opt("same", "Do the scouting yourself", "Your report, Tuesday.", 0, 0, 2, "same", [], [], "The knowledge stays in two heads."),
      opt("present", "{name} presents it", "Tuesday, {name} teaches the room what {name} knows.", 1, 4, 4, "skills", ["veteran", "rookie", "transfer"], [], "The veteran as teacher. Everyone learns, the veteran most."),
      opt("pair", "Pair {name} with {rookie}", "The veteran and the rookie scout together all week.", 1, 3, 2, "care", ["veteran", "rookie"], [], "Knowledge moves one person at a time."),
      opt("demand", "Demand it", "Scouting notes are team property. Hand them over.", 1, -4, 2, "standards", [], ["veteran", "star"], "The notes arrive. The veteran stops writing new ones."),
    ] },
  { id: "teamwork", concept: "teamwork", who: "veteran", text: "{name} runs the warm-up without asking. The team follows {name}, not you.",
    research: "Teamwork and coaching (Addison, Ruby, Catherine chose it). Alexa noticed that players listen differently to a teammate who is in the action with them, and asked whether unofficial leaders confuse the room when they conflict with the coach.",
    options: [
      opt("same", "Let {name} run it", "Warm-up was never yours.", 0, 1, 0, "same", ["veteran"], ["rookie"], "The team has a leader. The rookie is not sure which."),
      opt("take", "Take it back", "Warm-up is yours from Monday.", 1, -3, 1, "standards", [], ["veteran", "star"], "Authority asserted, a leader demoted."),
      opt("official", "Make it official", "{name} runs warm-up as a captain. You run everything after.", 1, 4, 2, "care", ["veteran", "star", "transfer"], [], "The unofficial leader made official, with a boundary."),
      opt("teach", "Teach the warm-up", "You explain what every part is for, then {name} runs it.", 2, 3, 4, "skills", ["rookie", "veteran"], [], "The why behind the routine. Haixing's idea again."),
    ] },
  { id: "coordination", concept: "coordination", who: "star", text: "Two players go for the same {ball} and collide. {name} yelled at the one who got there second.",
    research: "Physical and mental coordination (Lila and Addison chose it). Alexa noticed quiet cues work under pressure because they cannot be faked. Addison asked whether teams that read each other got there by talent or by time.",
    options: [
      opt("same", "Shake it off", "Collisions happen.", 0, -2, 0, "same", [], [], "The next one happens too."),
      opt("call", "Calling drill", "A week of drills where nobody moves without saying a name.", 1, 2, 5, "skills", ["rookie", "transfer"], [], "Coordination as a communication skill, practiced."),
      opt("zones", "Assign zones", "Every player owns a zone. The chart goes on the wall.", 1, 1, 3, "standards", ["veteran", "rookie"], [], "Clarity instead of talk."),
      opt("word", "A word with {name}", "Yelling at a teammate costs a start.", 1, 3, 0, "standards", ["transfer", "quiet", "rookie"], ["star"], "The consequence lands on the loudest player."),
    ] },
  { id: "decisions", concept: "decisions", who: "veteran", text: "{name} wants a team vote on the travel playlist. Then on the lineup.",
    research: "Decision making (Lila chose it). Giving athletes a say in their training helps skill development and decision making (Sophia A's opinion). Chloe said ownership of their own development makes motivation more meaningful.",
    options: [
      opt("same", "No votes", "Coaches decide.", 0, -2, 1, "same", [], ["veteran"], "Clear, and nobody asked."),
      opt("playlist", "Vote on the playlist", "The playlist is theirs. The lineup is yours.", 1, 3, 1, "care", ["veteran", "rookie"], [], "A real say on a real thing, and a clear line."),
      opt("both", "Vote on both", "The team picks the lineup too.", 2, 2, -4, "culture", ["veteran", "star"], ["rookie"], "Autonomy without the expertise. Friends start.", -1),
      opt("input", "Ask, then decide", "Every player tells you their lineup. You post yours with reasons.", 2, 4, 3, "skills", ["veteran", "rookie", "transfer"], [], "Autonomy support: heard, then told why."),
    ] },
  { id: "complexity", concept: "complexity", who: "rookie", text: "You called a time-out and gave four instructions. {name} remembered one.",
    research: "Coaching and complexity (Lucy Kate, Sophia T, Drew, Audrey, Catherine chose it). Alexa asked how a sudden change in plan mid-match affects trust when decisions are split-second. Lucy Kate drew the line between a controlling coach and a motivating one.",
    options: [
      opt("same", "Say it louder next time", "Four things is four things.", 0, -2, 0, "same", [], ["rookie"], "The rookie remembers one again."),
      opt("one", "One thing per time-out", "One instruction. The rest waits.", 1, 2, 4, "skills", ["rookie", "transfer", "quiet"], [], "Less, remembered."),
      opt("book", "Write the playbook", "Every set play on one page, in the locker.", 2, 1, 5, "skills", ["rookie", "veteran"], [], "Complexity moved onto paper."),
      opt("repeat", "{veteran} repeats it", "The captain says the one thing again in the huddle.", 1, 3, 2, "care", ["veteran", "rookie"], [], "The message through a teammate, which Alexa noticed lands differently."),
    ] },
  { id: "negative", concept: "negative", who: "star", text: "{name} told {rookie}, in front of everyone, that the pass was garbage.",
    research: "Negative messaging (Vianna, Emme, Lucy Kate, Sophia A, Paul chose it). Paul asked what split of positive and negative talk works. Jacqueline noted coaches who use verbal aggression read as less credible and less competent. Sarcasm can build cohesion only when everyone reads it as play.",
    options: [
      opt("same", "Let them sort it", "Teammates talk.", 0, -4, 0, "same", [], ["rookie", "quiet"], "The rookie stops passing to the star."),
      opt("private", "A private word with {name}", "After practice, alone.", 1, 3, 1, "care", ["rookie", "quiet", "star"], [], "Hard words in private, which is the rule you are about to need."),
      opt("rule", "A feedback rule", "Hard words in private, praise in public. For you too.", 2, 5, 2, "standards", ["rookie", "transfer", "quiet"], ["star"], "The split, made a standard for everyone, coach included."),
      opt("public", "Call {name} out", "Say it in front of everyone, the way {name} did.", 1, -3, 1, "standards", [], ["star", "quiet"], "Verbal aggression from the coach. Credibility down."),
    ] },
  { id: "lessons", concept: "lessons", who: "transfer", text: "{name} played for a program that did everything differently and keeps saying so.",
    research: "Lessons from sports teams for other teams (Will and Luke chose it). Chloe and Lila raised transfer players as a topic. Will asked how a low-control approach reads as intentional. Luke asked which team-building exercises actually work.",
    options: [
      opt("same", "Ignore it", "Every transfer says that.", 0, -2, 0, "same", [], ["transfer"], "The transfer keeps saying it, to fewer people."),
      opt("present", "{name} presents one thing", "Ten minutes Tuesday: the one thing the old program did best.", 1, 4, 3, "skills", ["transfer", "rookie"], ["veteran"], "The outsider's knowledge, used."),
      opt("stop", "Ask {name} to stop", "This program is this program.", 1, -3, 1, "standards", ["veteran"], ["transfer"], "The transfer learns to be quiet."),
      opt("adopt", "Adopt one thing", "Pick one habit from the old program and make it this team's.", 2, 3, 4, "culture", ["transfer", "star"], [], "A lesson from another team, taken."),
    ] },
  { id: "finale", concept: null, who: null, text: "The last week. {bench} got hurt in practice and cannot play. The final {match} is a road trip against the {opp}.",
    research: "Andrew's example, 2026-10-29: \"a player who's not very good got injured. Do you bring them on a road trip with you? ... it costs more capital ... but it increases the culture of the team quite a bit because everybody says, wow, they treat the players really well.\"",
    options: [
      opt("same", "Business as usual", "Same week as every week.", 0, 0, 2, "same", [], [], "The season ends the way it ran."),
      opt("film", "Extra film", "Two film sessions on the {opp}.", 1, 0, 5, "skills", ["star", "veteran"], [], "Preparation. The scoreboard notices."),
      opt("dinner", "Season dinner", "The whole team, the night before the trip.", 2, 5, -1, "culture", ["transfer", "quiet", "rookie"], [], "The season, marked together."),
      opt("trip", "Bring {bench} on the trip", "Pay the travel. {bench} rides with the team and sits on the bench in uniform.", 4, 10, 0, "care", ALL, [], "The most expensive thing on the list, and the one the team remembers."),
    ] },
];
export const situationOf = (id) => SITUATIONS.find(s => s.id === id) || null;
export const situationFor = (conceptId) => SITUATIONS.find(s => s.concept === conceptId) || null;
export const optionOf = (situation, id) => (situation ? situation.options.find(o => o.id === id) : null) || null;

// ─── the standing purchases ───
//
// Andrew, 2026-10-29: "i have too much capital and not enough to spend it
// on." From MULTI_FROM on, these sit under the week's options, each buyable
// once a season, priced 1 to 5. Claude's draft.

export const EXTRAS = [
  opt("x-film", "Film room", "A projector and a couch in the locker room.", 2, 1, 4, "skills", ["star", "veteran"], [], "Film on demand. The players who watch most gain most."),
  opt("x-gym", "Open gym Sundays", "The gym is open Sunday afternoons. Nobody has to come.", 1, 1, 2, "skills", ["rookie"], ["veteran"], "Reps for whoever wants them. The veteran sees a sixth day."),
  opt("x-strength", "Strength coach", "A strength coach three mornings a week.", 3, 0, 5, "skills", ["star"], ["quiet"], "Skills up fast. The quiet one is already running on empty."),
  opt("x-council", "Captains' council", "Two captains, a weekly meeting, a real say.", 2, 3, 1, "care", ["veteran", "star"], [], "Shared power, on purpose. The leaders are in the room."),
  opt("x-psych", "Sports psychologist", "A sports psychologist, one session a week, for anyone.", 3, 4, 2, "care", ["quiet", "rookie"], [], "Mental health communication, which four sheets asked for. Costs what it costs."),
  opt("x-uniforms", "New uniforms", "New uniforms with the names on the back.", 2, 3, 0, "culture", ["rookie", "transfer", "star"], [], "Belonging you can wear. The new players feel it most."),
  opt("x-assistant", "Assistant coach", "An assistant who runs the second group so nobody waits.", 4, 2, 5, "skills", ["rookie", "transfer"], [], "More coaching per player. The expensive thing that helps everyone a little."),
  opt("x-trip", "Team trip", "A weekend away, no practice, everyone.", 5, 8, -1, "culture", ALL, [], "The dearest thing on the list, and the one everyone is up for."),
];
export const extraOf = (id) => EXTRAS.find(o => o.id === id) || null;
/** Any option by id: the week's, or a standing purchase. */
export const anyOptionOf = (situation, id) => optionOf(situation, id) || extraOf(id);
/** The extras already bought, from the weeks on file. */
export const boughtOf = (results) => (results || []).flatMap(r => (r.options || [])).filter(id => extraOf(id));

/** The words of a situation or an option, with the names in. */
export function tell(text, { cast, sport, team, opp, bench, who }) {
  const name = (who && cast[who]) || "a player";
  return String(text || "")
    .replace(/\{name\}/g, name).replace(/\{team\}/g, team).replace(/\{opp\}/g, opp).replace(/\{bench\}/g, bench || FILL[0])
    .replace(/\{star\}/g, cast.star).replace(/\{veteran\}/g, cast.veteran).replace(/\{rookie\}/g, cast.rookie).replace(/\{transfer\}/g, cast.transfer).replace(/\{quiet\}/g, cast.quiet)
    .replace(/\{match\}/g, sport.match).replace(/\{period\}/g, sport.period).replace(/\{where\}/g, sport.where).replace(/\{ball\}/g, sport.ball);
}

// ─── what the players say ───
//
// One line per part, per kind of action, per mood, as a text to the team's
// chat. Claude's draft, 2026-10-29.

export const LINES = {
  star: {
    same: { up: "good. no changes. i know this system", flat: "same as last year then", down: "so we're just running it back? we lost" },
    culture: { up: "ok that was actually good", flat: "fine. still want to win though", down: "i don't need a dinner. i need a ring" },
    skills: { up: "THIS. more of this", flat: "about time", down: "more reps isn't the problem. the lineup is" },
    standards: { up: "respect. first coach who meant it", flat: "rules are fine if everyone follows them", down: "you're new here. don't forget that" },
    care: { up: "didn't expect that. thanks", flat: "sure", down: "we're spending the week on that?" },
  },
  veteran: {
    same: { up: "finally a coach who leaves it alone", flat: "seen it before. it works", down: "three coaches. same practice. cool" },
    culture: { up: "yeah. that's the team i remember", flat: "nice. doesn't fix the lineup", down: "forced fun. the chat has thoughts" },
    skills: { up: "ok coach knows the game. noted", flat: "i've run this drill before", down: "we did this under the last coach too" },
    standards: { up: "took you long enough. the standard is the standard", flat: "fine. i'll follow rules i helped write", down: "everyone, new coach wants to be tough. give it two weeks" },
    care: { up: "first time anyone asked us", flat: "ok", down: "that's not how we do things here" },
  },
  rookie: {
    same: { up: "ok i can do the same thing again", flat: "same drills. ok", down: "i still don't know what i'm supposed to do" },
    culture: { up: "i sat with the seniors!! they're actually nice", flat: "dinner was fun. i still don't know the plays", down: "i didn't know where to sit" },
    skills: { up: "i finally get what we're doing!! thank you", flat: "ok i think i get the drill now", down: "wait which drill" },
    standards: { up: "ok i like knowing the rules", flat: "the rules are clear at least", down: "i got yelled at and i don't know what i did" },
    care: { up: "coach noticed. nobody noticed before", flat: "ok that was nice i guess", down: "is this about me" },
  },
  transfer: {
    same: { up: "same as my old team. i can do this", flat: "different from my old team but ok", down: "nobody's going to tell me how this works, are they" },
    culture: { up: "they taught me the handshake!!!", flat: "dinner was nice. still the new kid", down: "i sat at the end again" },
    skills: { up: "finally a system i can learn", flat: "ok. i'll figure it out", down: "i already learned this a different way" },
    standards: { up: "rules i can follow. better than guessing", flat: "fine. same rules for everyone at least", down: "i just got here and i'm already in trouble" },
    care: { up: "feels like i'm on the team now", flat: "nobody asked me though", down: "still waiting to be on the team" },
  },
  quiet: {
    same: { up: "ok", flat: "ok", down: "ok" },
    culture: { up: "i talked to someone. it helped", flat: "dinner was fine", down: "didn't go. sorry" },
    skills: { up: "practice felt like practice again. good", flat: "ok", down: "i can't keep this up" },
    standards: { up: "at least it's clear", flat: "fine", down: "i'm late because i can't get out of bed. you don't know that" },
    care: { up: "thank you. don't tell anyone", flat: "ok", down: "who told you" },
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
  negative: ["Hard words in private", "Hard words in front of everyone"],
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

/**
 * The seven weeks a student gets. Week 1 is the opener with the first
 * concept's question. Week 2 is the second concept's situation. Week 3 is
 * the press. Weeks 4 to 6 are the last three concepts. Week 7 is the finale,
 * which asks what makes a good team culture.
 */
export function planSeason({ name, concepts, topicsAnswers }) {
  const five = (concepts || []).slice(0, 5);
  while (five.length < 5) five.push({ id: CLASS_TOP[five.length % CLASS_TOP.length], slot: "" });
  const order = [
    { situation: "opener", concept: five[0] }, { situation: null, concept: five[1] }, { situation: "press", concept: null },
    { situation: null, concept: five[2] }, { situation: null, concept: five[3] }, { situation: null, concept: five[4] }, { situation: "finale", concept: null },
  ];
  return LETTERS.map((w, i) => {
    const { concept } = order[i];
    const sitId = order[i].situation || (situationFor(concept.id) || situationOf("opener")).id;
    const situation = situationOf(sitId);
    const last = i === LETTERS.length - 1;
    const wonder = concept && concept.slot ? String((topicsAnswers || {})["wonder:" + concept.slot] || "").trim() : "";
    const prompt = sitId === "press" ? { kind: "press", text: "" } : last ? { kind: "final", text: "" } : { kind: "wonder", text: wonder || CLASS_WONDERS[concept.id] };
    const label = sitId === "press" ? "The press" : last ? "The final week" : conceptOf(concept.id).name;
    const poll = POLL_WEEKS.includes(w) && concept ? POLLS[concept.id] : null;
    return { week: w, n: i + 1, last, multi: i + 1 >= MULTI_FROM, concept: concept ? concept.id : null, label, situation: sitId, who: situation.who, prompt, poll };
  });
}

// ─── one week, resolved ───

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
/** Where the last coach left the team: culture and skills from 35 to 65, success between them. */
export function startState(name) {
  const culture = 35 + Math.floor(roll(name, "culture0") * 31);
  const skills = 35 + Math.floor(roll(name, "skills0") * 31);
  return { capital: START_CAPITAL, culture, skills, success: Math.round((culture + skills) / 2), wins: 0, losses: 0 };
}
export const start = startState;

/** The chance of winning, from the two numbers and the action, as a fraction. */
export const winChance = (culture, skills, win = 0) => Math.max(0.05, Math.min(0.95, 0.05 + 0.9 * ((culture + skills) / 200) + 0.05 * win));
// Success follows the two numbers and moves with the result. Andrew,
// 2026-10-29: "success keeps going down. i think we need to mess with the
// formula." Each week success goes halfway to the average of culture and
// skills, then a win adds WIN_SUCCESS and a loss takes LOSS_SUCCESS.
export const WIN_SUCCESS = 6, LOSS_SUCCESS = 3;
export const successAfter = (success, culture, skills, won) => clamp((success + (culture + skills) / 2) / 2 + (won ? WIN_SUCCESS : -LOSS_SUCCESS));

// A swing of -2 to +2 on culture, most weeks near zero: a week of real
// life. Skills swing one either way one week in two.
const swingOf = (r) => r < 0.1 ? -2 : r < 0.3 ? -1 : r < 0.7 ? 0 : r < 0.9 ? 1 : 2;
const nudgeOf = (r) => r < 0.25 ? -1 : r > 0.75 ? 1 : 0;

/**
 * What a week's actions do. optionIds is one id, or from MULTI_FROM on any
 * number of them. state is before; the answer carries the state after and
 * everything the screen shows. Pure.
 */
export function resolve({ name, week, state, situationId, optionIds, bought = [] }) {
  const situation = situationOf(situationId);
  const ids = Array.from(new Set((Array.isArray(optionIds) ? optionIds : [optionIds]).filter(Boolean)));
  const options = ids.map(id => situation ? anyOptionOf(situation, id) : null);
  if (!situation || !ids.length || options.some(o => !o)) throw new Error("Takeover: no such situation or option: " + situationId + ", " + ids.join(","));
  const n = LETTERS.indexOf(week) + 1;
  if (options.length > 1 && n < MULTI_FROM) throw new Error("Takeover: week " + n + " takes one choice");
  if (n < MULTI_FROM && ids.some(id => extraOf(id))) throw new Error("Takeover: week " + n + " has no extras");
  if (ids.some(id => extraOf(id) && bought.includes(id))) throw new Error("Takeover: an extra was bought twice");
  if (!ids.some(id => optionOf(situation, id))) throw new Error("Takeover: the week needs an answer, not only extras");
  const cost = options.reduce((t, o) => t + costOf(o, week), 0);
  if (cost > state.capital) throw new Error("Takeover: " + ids.join("+") + " costs " + cost + " and the coach has " + state.capital);
  // The chat answers the dearest thing done this week.
  const tag = [...options].sort((x, y) => y.cost - x.cost)[0].tag;
  const key = ids.join("+");
  const moods = {};
  let back = 0;
  for (const c of CHARACTERS) {
    let m = options.reduce((t, o) => t + (o.likes.includes(c.id) ? 1 : o.dislikes.includes(c.id) ? -1 : 0), 0);
    // Each player has a week of their own: one in ten swings a step.
    const r = roll(name, "mood", week, key, c.id);
    if (r < 0.1) m -= 1; else if (r > 0.9) m += 1;
    moods[c.id] = m >= 1 ? "up" : m <= -1 ? "down" : "flat";
    back += RETURN[moods[c.id]];
  }
  const swing = swingOf(roll(name, "swing", week, key));
  const nudge = nudgeOf(roll(name, "nudge", week, key));
  const culture = clamp(state.culture + options.reduce((t, o) => t + o.culture, 0) + swing);
  const skills = clamp(state.skills + options.reduce((t, o) => t + o.skills, 0) + nudge);
  const win = Math.max(-2, Math.min(2, options.reduce((t, o) => t + o.win, 0)));
  const p = winChance(culture, skills, win);
  const won = roll(name, "match", week, key) < p;
  const success = successAfter(state.success, culture, skills, won);
  const capital = Math.min(CAP, Math.round((state.capital - cost + back) * 2) / 2);
  return {
    week, situation: situation.id, options: ids, option: ids[0], tag, cost, swing, nudge,
    culture, skills, success, dCulture: culture - state.culture, dSkills: skills - state.skills, dSuccess: success - state.success,
    won, p: Math.round(p * 100), moods, back, capital, wins: state.wins + (won ? 1 : 0), losses: state.losses + (won ? 0 : 1),
  };
}

/** The state after a result. */
export const after = (r) => ({ capital: r.capital, culture: r.culture, skills: r.skills, success: r.success, wins: r.wins, losses: r.losses });

// A result as the file keeps it: short keys, under one row.
export const packResult = (r) => JSON.stringify({ w: r.week, i: r.situation, o: r.options.join(","), t: r.tag, c: r.cost, g: r.swing, n: r.nudge, u: r.culture, s: r.skills, e: r.success, du: r.dCulture, ds: r.dSkills, de: r.dSuccess, v: r.won ? 1 : 0, p: r.p, m: CHARACTERS.map(c => r.moods[c.id][0]).join(""), b: r.back, k: r.capital, x: r.wins, l: r.losses });
export const unpackResult = (s) => {
  let o;
  try { o = JSON.parse(s); } catch { return null; }
  if (!o || typeof o !== "object" || !o.w || !o.i || !o.o) return null;
  const moodOf = { u: "up", f: "flat", d: "down" };
  const moods = {};
  CHARACTERS.forEach((c, i) => { moods[c.id] = moodOf[String(o.m || "")[i]] || "flat"; });
  const n = (v) => (Number.isFinite(+v) ? +v : 0);
  const options = String(o.o).split(",").filter(Boolean);
  return { week: o.w, situation: o.i, options, option: options[0], tag: TAGS[o.t] ? o.t : "same", cost: n(o.c), swing: n(o.g), nudge: n(o.n), culture: n(o.u), skills: n(o.s), success: n(o.e), dCulture: n(o.du), dSkills: n(o.ds), dSuccess: n(o.de), won: !!o.v, p: n(o.p), moods, back: n(o.b), capital: n(o.k), wins: n(o.x), losses: n(o.l) };
};

/** The season so far, from the file: every saved week applied in order, stopping at the first week without a result. */
export function replay(answers, name) {
  let state = startState(name);
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

/** A number as the end screen grades it. */
export const gradeOf = (n) => n >= 80 ? "A" : n >= 65 ? "B" : n >= 50 ? "C" : n >= 35 ? "D" : "F";

// How a week felt, for the cue after the chat: a cheer, a groan, or nothing.
export const feelOf = (r) => !r ? "" : r.dCulture >= 6 || (r.won && r.dCulture >= 3) ? "cheer" : r.dCulture <= -4 ? "groan" : "";

// Coins, with halves: 3.5 is three and a half.
export const coins = (n) => "●".repeat(Math.max(0, Math.floor(n))) + (n % 1 ? "◐" : "");

// ─── the words the student reads ───
//
// Andrew's, word for word, 2026-10-29: `reflect` ("You wrote: ... Based on
// your experiences and what you know, how would you answer that question?
// Please write 2-4 sentences, and include at least one source, which can be
// from our book, our readings, or somewhere else."). The rest is Claude's
// draft for him to edit in place (useCopy, row COPY_ROW).

export const COPY_ROW = "worksheet-takeover-plan";
export const DEFAULT_COPY = {
  title: TAKEOVER_TITLE,
  credit: "COMM 118 · Weekly Challenge 3 · Due Tuesday, November 3",
  start: "You are the new head coach. The team is not yours yet.",
  intro: "You have seven weeks. Each week something happens, and you decide what to do about it. The players react. Some of them are people you know.",
  pickSport: "Pick your sport.",
  pickTeam: "Pick your team.",
  pickTeamLine: "None of these names make sense. Pick one anyway.",
  meet: "Meet the team.",
  meetLine: "Five of them will decide how this goes.",
  howTitle: "How this works",
  how: "You are taking over this team.\n\nTwo numbers are yours to raise. Culture is how the team treats each other. Skills and strategy is how well they play. Both run from 0 to 100, and both start wherever the last coach left them.\n\nThose two numbers together set your chance of winning each week. Winning raises the third number, Success.\n\nYou have capital: five coins to start. Every action costs some, from nothing up to four or five later in the season. After each week your five players react. A plus gives you a coin back. An equals gives you half a coin. A minus gives you nothing.\n\nFrom week 3 on you can do more than one thing in a week, as many as you can pay for, and there are standing purchases, each once a season. From week 4 on, prices go up by one. You can hold eight coins at most, so spend them.\n\nSuccess follows culture and skills, halfway each week, and moves with every result: a win adds, a loss takes a little.",
  howGo: "Start the season",
  capital: "Capital",
  culture: "Culture",
  skills: "Skills & strategy",
  success: "Success",
  record: "Record",
  chooseAsk: "What do you do?",
  multiTitle: "New this week",
  multi: "Now you can make more than one choice. Choose as many as you want. Each one costs its coins.",
  doIt: "Do it",
  also: "Also this week, once a season",
  wrap: "Final whistle",
  total: "Total",
  chooseNote: "Costs are in coins. A plus from a player gives one back, an equals gives half, a minus gives nothing.",
  cannot: "Not enough capital.",
  matchDay: "VS",
  chat: "Team chat",
  reflect: "You wrote: {wonder}. Based on your experiences and what you know, how would you answer that question? Please write 2-4 sentences, and include at least one source, which can be from our book, our readings, or somewhere else.",
  reflectPress: "Lisa Davis printed what you said. Based on your experiences and what you know, what should a coach say in public about a player who had a bad night? Please write 2-4 sentences, and include at least one source, which can be from our book, our readings, or somewhere else.",
  reflectFinal: "After this season, what do you think makes for a good team culture? Please write 2-4 sentences, and include at least one source, which can be from our book, our readings, or somewhere else.",
  pressName: "Lisa Davis, Pacifica Times",
  reflectHint: "2-4 sentences",
  sourceAsk: "Your source",
  sourceHint: "A link, or the book, or wherever it came from.",
  pollAsk: "Which matters more?",
  back: "Back",
  runThrough: "Run-through",
  next: "Next week",
  finals: "The final week.",
  seasonOver: "Season over.",
  "final.a": "Which week did you spend the most capital, and what did it buy you?",
  "final.b": "Which player was hardest to coach, and what would you do differently with them?",
  "final.c": "Lisa Davis asks you for a season-ending quote. What do you tell her?",
  submit: "Hand in the season",
  submitted: "Handed in",
  recall: "Take it back",
  resume: "Pick up where you left off",
  restart: "Start a new season",
  onFile: "Your season is on file.",
};
