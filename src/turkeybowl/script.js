// Turkey Bowl: the whole game as data, and the rules that score a run.
// Plain JS, no DOM, so the page draws from this file and the server scores
// from the same file. A browser never decides a score.
//
// Andrew, 2026-11-14, COMM 118, Weekly Challenge 4: "They play Thanksgiving
// football. And they help coach their team to victory ... Jerry Jones sees
// them playing ... and decides to have them coach the Dallas Cowboys ...
// students are going to be playing for a high score. The highest score would
// be 10,000 points." Three levels: the family's Turkey Bowl at the park, the
// interview with Jerry Jones and the jet, and the Cowboys on Thanksgiving.
//
// Every decision has four options, ranked best, good, bad, silly, shown in a
// shuffled order ("of course, you're gonna mix them up"). Two options end
// the run ("over"). Each answer is followed by one line that says why, with
// its source: "always cite the sources ... just use my articles." The line
// cites the study his article cites, not the article: "don't cite Ishak 2017
// or Ishak 2021 if there is an internal citation in those articles that you
// can cite." The
// decisions, the rankings and the proof were approved by him on a review
// page the same day; the right answers come from Ishak (2021),
// "Communicating in Sports Teams," and Ishak (2017), "Communication in
// Sports Teams: A Review."
//
// Between decisions the player calls run or pass ("let people call run or
// pass plays ... show how it works"). Each play shows how the defense is
// lined up; the right call against the look gains yards and points. The
// looks come from the run's seed, so the server can check every call.

export const MAX_SCORE = 10000;
export const PLAY_POINTS = 50;
/** Share of a decision's points for each rank. */
export const SHARE = { best: 1, good: 0.6, bad: 0.2, silly: 0, over: 0 };
export const RANK_SAY = { best: "Best call", good: "Good call", bad: "Not good", silly: "Ludicrous", over: "Game over" };

// The five ways to get players to do what you ask (French and Raven), for
// Jerry's pick-two question. Legitimate and expert score highest on gaining
// compliance (Rylander, 2015); reward and referent next; coercive last.
export const POWER = [
  { k: "expert", text: "\"I'll show them I know what I'm talking about.\"", w: 1 },
  { k: "legit", text: "\"I'm the head coach. That's the job.\"", w: 1 },
  { k: "reward", text: "\"I'll praise and reward what I want more of.\"", w: 0.6 },
  { k: "referent", text: "\"I'll build relationships, so they want to play for me.\"", w: 0.6 },
  { k: "coercive", text: "\"Fines and the bench.\"", w: 0 },
];

const d = (id, level, points, who, scene, opts, after, extra = {}) => ({ id, level, points, who, scene, opts: opts.map(([k, text, then]) => ({ k, text, then })), after, ...extra });

export const DECISIONS = [
  d("breakfast", 1, 350, "", "It's 4 AM. Kickoff at the park is at 8. What do you eat?", [
    ["best", "Mashed potatoes and mac and cheese", "Energy all morning."],
    ["good", "Turkey, lots of it", "You are stronger, and slow by the second quarter."],
    ["bad", "Cranberry sauce, straight from the can", "Sugar high. Fast for three plays, then you crash."],
    ["silly", "Pumpkin pie and gravy", "You play badly the whole first half."],
  ], "You've got to choose the right food. Don't be silly and choose something that's not good for you. Always eat a good breakfast.", { food: true }),
  d("stars", 1, 350, "uncle", "Warm-ups, 7:30 AM. Your uncle: \"We've got twenty minutes. Only practice throwing to the two best players. The rest can watch.\"", [
    ["best", "\"Everybody gets reps, and here's why: today is about all of us getting better.\"", "Everyone is warm, and everyone knows why."],
    ["good", "Quietly give everyone a few reps, without saying why", "Everybody practices, but nobody knows what the team is about."],
    ["bad", "\"Stars first. Everyone else if there's time.\"", "There is no time. Half your team starts the game cold."],
    ["silly", "Trade Grandma to the other team for a player to be named later", "Grandma scores on you. Twice."],
  ], "A mastery climate values every player and defines success as getting better. A performance climate ignores less-skilled players to focus on stars (Horn et al., 2012)."),
  d("blowup", 1, 350, "brother", "Your brother drops an easy one, spikes the ball into the leaves and yells at the sky.", [
    ["best", "Let him get it out, ask him what he's feeling, then walk him through resetting for the next play", "He catches the next one."],
    ["good", "Crack a joke to break the tension, then call the next play", "He laughs. It works this time."],
    ["bad", "\"Calm down.\"", "Nobody in history has calmed down."],
    ["silly", "\"Emotions are not allowed on this team.\" He sits out until New Year's.", "You are down a receiver and a brother."],
  ], "Coaches help players regulate emotion with feedback, humor, and by asking about the emotion (Tamminen & Crocker, 2013)."),
  d("dissent", 1, 350, "sister", "Third play in a row, your sister says the call is wrong. Loudly.", [
    ["best", "Call time-out. \"What would you run, and why?\" Use the part that's right.", "Her idea works. She stops arguing and starts helping."],
    ["good", "\"Give me one change and we'll try it next drive.\"", "She gives you one. The other four she tells the cousins."],
    ["bad", "\"Tell me after the game.\"", "She tells everyone else instead, for the rest of the morning."],
    ["silly", "Make her the coach and go sit with Grandma", "She is a better coach than you."],
  ], "Players bring dissent to a coach whose feedback style is open. With a closed style, they take it to their teammates (Kassing & Anderson, 2014)."),
  d("late", 1, 350, "cousin", "Second quarter. Your cousin jogs up late and joins your side. \"Don't throw it to me. I haven't practiced. I'll look bad in front of everybody.\"", [
    ["best", "\"Nobody here is worried about looking bad. It's okay to fail, as long as we get it right in the end.\" Then call her number.", "She drops the first, catches the second, and the whole team cheers."],
    ["good", "\"You've got this. I've seen you run.\"", "She feels better and still hides on every play."],
    ["bad", "\"Okay. Just block.\"", "She blocks. She also learns that looking bad is the thing to avoid."],
    ["silly", "Hand her a slice of pumpkin pie", "She eats the pie on the field. Flag."],
  ], "In a mastery climate, mistakes are opportunities for learning, and learning together is useful (Horn et al., 2012)."),
  d("push", 1, 350, "", "Down 21 to 14 at the half, and the team needs a push. What do you say?", [
    ["best", "\"Play this half the way we practiced and you'll be telling this story at dinner.\"", "They come out flying."],
    ["good", "\"You will always regret it if you don't play harder in this half.\"", "They play harder, and a little tight."],
    ["bad", "\"You guys stink. There's no way you win this.\"", "Heads drop. Your uncle agrees with you, which is worse."],
    ["silly", "Read them last year's final score, slowly, twice", "Your cousin starts crying."],
  ], "Regret messages come in an upward form (\"if you do this, you'll be successful\") and a downward form (\"if you don't, you won't\"). That is regret messaging (Turman, 2005). Verbal aggression lowers motivation (Mazer et al., 2013)."),
  d("kickoff", 1, 350, "nephew", "Second half kickoff. Your nephew, age nine, is back deep and looking at you.", [
    ["best", "\"Catch it, tuck it, follow your blockers.\"", "He does all three. Thirty yards."],
    ["good", "\"Get us to midfield.\"", "He knows where to go, not how. Fifteen yards."],
    ["bad", "\"Whatever you do, don't fumble.\"", "He thinks about fumbling the whole way. Guess what happens."],
    ["silly", "\"Score, or you're walking home.\"", "He scores. He also never speaks to you again."],
  ], "Process goals beat outcome goals (Burton & Weiss, 2008), and goals about what to do beat goals about what to avoid (Van Mierlo & Van Hooft, 2020)."),

  d("culture", 2, 400, "jerry", "Jerry: \"First question. What's culture?\"", [
    ["best", "\"The shared beliefs, values, customs, behaviors and artifacts that a group of people learn, share and pass down through generations.\"", "Jerry nods slowly."],
    ["good", "\"The way things are done.\"", "Jerry: \"Fine. Short. I like short.\""],
    ["bad", "\"The rules and policies a group writes down so everyone knows what is expected.\"", "Jerry: \"That's a handbook, son.\""],
    ["silly", "\"Whatever's on the hat.\"", "Jerry touches his hat, confused."],
  ], "Culture in sports teams is broadly defined as the way things are done (Wagstaff & Burton-Wylie, 2018)."),
  d("change", 2, 400, "jerry", "Jerry: \"I've got slogans, I've got a handbook, I've got a star on everything. What has the biggest effect on our culture?\"", [
    ["best", "\"What the coaches and players say and do every day.\"", "Jerry writes something on a napkin."],
    ["good", "\"The expectations the head coach says out loud.\"", "Jerry: \"And then?\""],
    ["bad", "\"The slogans on the walls and the mission statement.\"", "Jerry has eleven slogans already."],
    ["silly", "\"The carpet.\"", "Jerry loves that carpet."],
  ], "Saying what you expect matters, but what coaches and players say and do every day is what creates a team's culture (Donoso-Morales et al., 2017)."),
  d("power", 2, 400, "jerry", "Jerry: \"These are grown men making more money than you. How do you get them to do what you ask? Pick two.\"", [],
    "Legitimate and expert power were most effective at gaining compliance (Rylander, 2015). Athletes are more satisfied under reward, referent and expert power, and coercive power makes them more sensitive to feedback (Cranmer & Goodboy, 2015).", { pick: 2 }),
  d("producer", 2, 400, "jerry", "Jerry: \"My TV producer wants my star on the field for the Thanksgiving audience. My trainer says he's hurt. Who wins?\"", [
    ["best", "\"The trainer. And I give your producer the star another way: a sideline interview.\"", "Jerry: \"Now that's television.\""],
    ["good", "\"The trainer. End of story.\"", "Jerry sulks a little."],
    ["bad", "\"One series, for the cameras.\"", "He limps off on play two."],
    ["silly", "\"Put him in a turkey costume at midfield.\"", "Jerry considers it for a long time."],
  ], "The show wants the star on screen. The people who look after the athlete want him healthy. That is sports as spectacle against athlete care."),
  d("jet", 2, 400, "", "You got the job. Somewhere over Oklahoma, the flight attendant comes by with a tray.", [
    ["best", "Water", "Hydrated. You land sharp."],
    ["good", "Sparkling water with a lime", "Same thing, fancier."],
    ["bad", "Three coffees", "Jittery at kickoff. Your first play call comes out too fast."],
    ["over", "Champagne", "You tell Jerry he reminds you of your grandma, put on his hat, and ask if he wants to parachute into the stadium. He fires you for being weird."],
  ], "Drink water to hydrate.", { drink: true }),

  d("receiver", 3, 500, "receiver", "First quarter. Your best receiver has no catches. He is on the sideline screaming at your quarterback, and every camera in the building is on them.", [
    ["best", "Pull him aside, away from the cameras, and talk to him alone", "He comes back and blocks on the next play. Then he gets his catch."],
    ["good", "Send a veteran captain to talk to him privately", "It works, slower. One more outburst first."],
    ["bad", "Let it go. He's the star.", "The quarterback stops throwing his way entirely. The huddle goes quiet."],
    ["over", "Rip into him right there, in front of the team and the cameras", "You lose the team's trust and everything falls apart."],
  ], "Talented but disruptive players are a named source of conflict in teams (Leggat et al., 2018). Take them aside."),
  d("reporter", 3, 500, "reporter", "Second quarter. A sideline reporter has a microphone in your face and the red light is on.", [
    ["best", "Fifteen seconds, and you credit the players", "You are back before the snap."],
    ["good", "Do it in three one-word answers", "No fine. The broadcast calls you \"prickly.\""],
    ["bad", "Refuse. You are coaching.", "The NFL fines you for skipping your media duties."],
    ["silly", "Use the interview to announce your own podcast", "Jerry wants a cut."],
  ], "Talking to the media is part of the job. Skip it and the league fines you."),
  d("commercial", 3, 500, "jerry", "Halftime. Jerry: \"Truck commercial. Two minutes. You're the star.\" Your players are waiting in the locker room.", [
    ["best", "\"After the final whistle, Jerry. I'll do two.\"", "You make your halftime adjustments. Jerry gets his money later and likes you more for it."],
    ["good", "\"No.\"", "The team gets its halftime. Jerry sulks in the owner's box."],
    ["bad", "Do the commercial", "Nobody made adjustments, and your first drive of the half goes nowhere."],
    ["silly", "Do the commercial and bring the whole offense into it", "The commercial is great. You have no offense."],
  ], "When you choose the commercial, you are not calling plays and you are not paying attention to your team."),
  d("speech", 3, 500, "", "Locker room. Down ten. Fifty-three players are looking at you.", [
    ["best", "Short, real emotion, and back to what this team values", "They come out of the tunnel loud."],
    ["good", "Short and all tactics", "They know the plan. Nobody is fired up."],
    ["bad", "A long speech that ends with a brand new game plan", "Half of them were lost by minute four."],
    ["silly", "Play them the truck commercial", "Silence. Then the kicker asks for a truck."],
  ], "Players respond to genuine emotion, conciseness and references to team values. They respond badly to poorly timed speeches and surprising information (Breakey et al., 2009)."),
  d("kicker", 3, 500, "kicker", "Third quarter. Your kicker misses from 38 and walks to the bench without looking up.", [
    ["best", "Go to him, hand on his shoulder, and give him one technical note", "He makes the next one from 47."],
    ["good", "Ask him how he's doing", "He says \"fine.\" He is a little better."],
    ["bad", "Leave him alone to think about it", "He thinks about it. All quarter."],
    ["silly", "Hold open tryouts for kicker in the stands", "A dentist from Plano is now your kicker."],
  ], "Feedback and asking about the emotion help a teammate regulate emotion (Tamminen & Crocker, 2013), and so does touch (Kraus et al., 2010)."),
  d("backup", 3, 500, "backup", "Fourth quarter. Your quarterback limps off. The backup has not taken a snap all season, and he is putting his helmet on.", [
    ["best", "Tell him exactly what his job is on this drive, then ask him what he's comfortable running", "He knows the job and he chose two of the plays. First down."],
    ["good", "Tell him exactly what his job is on this drive", "He knows the job. He runs a play he hates, and it shows."],
    ["bad", "\"Just go make plays.\"", "He tries to make all of them at once. Sack."],
    ["silly", "Alternate him and the punter every snap and let the crowd pick", "The crowd picks the punter."],
  ], "The coach names the role and the expectations, and the player accepts or negotiates (Eys et al., 2005). Poor communication leads to role ambiguity and tension (Kang & Seibold, 2017)."),
  d("twominute", 3, 550, "", "Down four. Two minutes. One time-out. The play clock is running.", [
    ["best", "Call the time-out and point everyone back at the two-minute situation you rehearsed all week", "Everyone already knows where to be."],
    ["good", "Let the quarterback call what the team knows", "It works. You look like a spectator."],
    ["bad", "Call the time-out and install something clever and brand new", "Four players run four different plays."],
    ["silly", "Ask Jerry what he would call", "Jerry calls a flea flicker. From the owner's box. By phone."],
  ], "Teams talk through scenarios ahead of time because there is no time in the moment. A time-out works best when it points the team back at a path they already know (Ishak & Ballard, 2012)."),
];
// Three questions that are not part of the story. Andrew, 2026-11-14: "i want
// you to have to explain some thing about sports and gender and sports and
// politics in different places. can you have a question about 'stacking' in
// sports as well as 'title IX' and tommie smith and john carlos ... put them
// in there randomly." Each run drops the three after three different sets of
// plays, picked by the run's seed. The stacking answer is the class's own,
// from the weekly game's question "What is stacking?"
export const POPS = [
  d("pop-stacking", 0, 300, "crowd", "A voice from the sideline: \"Hey coach, quick one. What is stacking?\"", [
    ["best", "When athletes of a certain race are disproportionately represented in specific sports or funneled into specific positions within a sport", "Right, word for word."],
    ["good", "When coaches put players at certain positions because of stereotypes about their race", "That is the positions half. Stacking is also about whole sports."],
    ["bad", "When media coverage reinforces racial stereotypes by only showing athletes in certain contexts", "That is about coverage. Stacking is about who gets put where."],
    ["silly", "When three linebackers stand on each other's shoulders", "Illegal formation."],
  ], "Stacking: athletes of a certain race are disproportionately represented in specific sports or funneled into specific positions within a sport."),
  d("pop-titleix", 0, 300, "crowd", "A voice from the sideline: \"Hey coach, what is Title IX?\"", [
    ["best", "The 1972 federal law that bars sex discrimination in any education program that takes federal money, sports included", "Right."],
    ["good", "The law that got girls and women their school sports teams", "That is what the law did for sports. The law covers all of education."],
    ["bad", "A rule that men's and women's teams must get exactly the same budget", "Common mistake. The law is about equal opportunity, not identical spending."],
    ["silly", "The ninth Super Bowl", "That was Super Bowl IX."],
  ], "Title IX (1972): no person shall, on the basis of sex, be excluded from or discriminated against in any education program or activity receiving federal financial assistance."),
  d("pop-1968", 0, 300, "crowd", "A voice from the sideline: \"Coach, who are Tommie Smith and John Carlos?\"", [
    ["best", "The American sprinters who raised black-gloved fists on the medal stand at the 1968 Olympics in Mexico City, during the anthem, to protest racism", "Right. Peter Norman of Australia, the silver medalist, stood with them."],
    ["good", "Two American runners who protested at the Olympics", "Right, and thin. It was 1968, Mexico City, the 200 meters, fists raised during the anthem."],
    ["bad", "The NFL players who first knelt during the anthem in 2016", "That was Colin Kaepernick. Smith and Carlos came almost fifty years earlier."],
    ["silly", "The Cowboys' starting backfield in 1968", "Jerry did not own the team in 1968."],
  ], "Mexico City, 1968: Tommie Smith and John Carlos raised their fists on the 200 meter medal stand. The class reading is \"The White Man in That Photo,\" on Peter Norman."),
];
export const decisionOf = (id) => DECISIONS.find(x => x.id === id) || POPS.find(x => x.id === id) || null;

// The order of the game. "d" is a decision, "p" is that many play calls,
// "s" is a cut scene the page draws, "gate" is where a level is won or lost.
export const FLOW = [
  { s: "title" },
  { d: "breakfast" }, { d: "stars" },
  { s: "kickoff" }, { p: 2 }, { d: "blowup" }, { p: 2 }, { d: "dissent" }, { p: 2 }, { d: "late" }, { p: 1 },
  { s: "half1" }, { d: "push" }, { d: "kickoff" }, { p: 3 },
  { gate: 1 },
  { s: "jerry" }, { d: "culture" }, { d: "change" }, { d: "power" }, { d: "producer" },
  { gate: 2 },
  { s: "jet" }, { d: "jet" },
  { s: "dallas" }, { p: 2 }, { d: "receiver" }, { p: 2 }, { d: "reporter" }, { p: 1 },
  { d: "commercial" }, { d: "speech" }, { p: 2 }, { d: "kicker" }, { p: 2 }, { d: "backup" }, { p: 2 }, { d: "twominute" }, { p: 1 },
  { gate: 3 },
];
export const PLAY_COUNT = FLOW.reduce((n, f) => n + (f.p || 0), 0);

// What it takes to get through each gate. Level 1 and 3 count their own
// decisions and plays; Level 2 is the four interview questions.
export const GATES = { 1: 1700, 2: 900, 3: 2300 };
/** Hired for the rest of the season: win in Dallas with this many points in all. */
export const HIRED = 7500;

// The defense's look before each play, and the call that beats the look.
export const LOOKS = [
  { k: "stack", say: "They are stacked up at the line.", beat: "pass" },
  { k: "deep", say: "They are playing way back.", beat: "run" },
  { k: "blitz", say: "Everybody is rushing the quarterback.", beat: "pass" },
  { k: "spread", say: "They are spread out wide.", beat: "run" },
];
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
/** The look on play number n of a run. */
export const lookFor = (seed, n) => LOOKS[hash(String(seed) + ":" + n) % LOOKS.length];
/** The order a decision's options show in, for a run. */
export function orderFor(seed, id, count) {
  const idx = Array.from({ length: count }, (_, i) => i);
  let h = hash(String(seed) + "|" + id);
  for (let i = idx.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

/** The game in order for one run: the flow, with the three pop questions
 * each dropped in after a different set of plays, picked by the seed. */
export function flowFor(seed) {
  const spots = FLOW.map((f, i) => (f.p ? i : -1)).filter(i => i >= 0);
  const order = orderFor(seed, "pops", spots.length).slice(0, POPS.length).map(i => spots[i]);
  const which = orderFor(seed, "pop-order", POPS.length);
  const after = new Map(order.map((spot, n) => [spot, POPS[which[n]].id]));
  const out = [];
  FLOW.forEach((f, i) => { out.push(f); if (after.has(i)) out.push({ d: after.get(i), pop: true }); });
  return out;
}

/** What one answer is worth and how it ranks. A pick is an option key, or for the power question two keys. */
export function judge(decision, pick) {
  if (!decision) return null;
  if (decision.pick) {
    const keys = [...new Set(Array.isArray(pick) ? pick : [])].filter(k => POWER.some(p => p.k === k)).slice(0, decision.pick);
    if (keys.length !== decision.pick) return null;
    const share = keys.reduce((n, k) => n + POWER.find(p => p.k === k).w, 0) / decision.pick;
    const rank = share >= 1 ? "best" : share >= 0.6 ? "good" : share > 0.3 ? "bad" : "silly";
    return { rank, points: Math.round(decision.points * share), over: false, then: keys.includes("coercive") ? "The fines drag you down. Players who see more coercive power flinch at feedback." : share >= 1 ? "Jerry: \"That's a coach.\"" : "Jerry nods. \"They'll like you. Will they listen?\"" };
  }
  const opt = decision.opts.find(o => o.k === pick);
  if (!opt) return null;
  return { rank: opt.k, points: Math.round(decision.points * SHARE[opt.k]), over: opt.k === "over", then: opt.then };
}

/** A run, scored. log is { seed, picks: { id: key | [key, key] }, calls: ["run" | "pass", ...] }.
 * Walks the flow in order and stops where the log stops, where a choice ends
 * the run, or where a gate is not passed. Returns { score, level, done,
 * over, lost, hired, parts: { 1, 2, 3 } }; level is the highest level reached. */
export function scoreRun(log) {
  const picks = (log && log.picks) || {}, calls = (log && Array.isArray(log.calls) ? log.calls : []);
  const seed = log && log.seed;
  const parts = { 1: 0, 2: 0, 3: 0 };
  let level = 1, play = 0, over = "", lost = 0, done = false, at = 0;
  outer: for (const step of flowFor(seed)) {
    if (step.d) {
      const dec = decisionOf(step.d), got = Object.prototype.hasOwnProperty.call(picks, step.d) ? judge(dec, picks[step.d]) : null;
      if (!got) break;
      // A pop question counts for the level the player is in when the question comes up.
      parts[dec.level || level] += got.points;
      level = Math.max(level, dec.level || level);
      if (got.over) { over = step.d; at++; break; }
    } else if (step.p) {
      for (let i = 0; i < step.p; i++) {
        const call = calls[play];
        if (call !== "run" && call !== "pass") break outer;
        if (lookFor(seed, play).beat === call) parts[level] += PLAY_POINTS;
        play++;
      }
    } else if (step.gate) {
      if (parts[step.gate] < GATES[step.gate]) { lost = step.gate; at++; break; }
      // Level 3 starts when the player lands in Dallas, not when Jerry says yes: champagne on the jet ends a run in Level 2.
      if (step.gate === 3) done = true; else if (step.gate === 1) level = 2;
    } else if (step.s === "dallas") level = 3;
    at++;
  }
  const score = Math.min(MAX_SCORE, parts[1] + parts[2] + parts[3]);
  return { score, level, done, over, lost, hired: done && score >= HIRED, parts, steps: at, plays: play };
}

/** "Sophia T." from a full name. */
export const shortName = (name) => { const p = String(name || "").trim().split(/\s+/).filter(Boolean); return p.length > 1 ? p[0] + " " + p[p.length - 1][0].toUpperCase() + "." : p[0] || ""; };
