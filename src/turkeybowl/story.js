// Turkey Bowl's story: how each question is shown before it is asked, what
// the announcer says, and what comes back later because of an earlier choice.
// Plain data and small pure functions. The page (main.js) stages all of it.
//
// Andrew, 2026-11-14: "incredible storybased cut scenes? with players saying
// material from the readings? announcer voice for sure. show all situations
// instead of just describing them. make choices carry." And: use all the
// readings, the idea in the character's own words, a run can take fifteen
// minutes, everything drawn in code, and Claude picks a voice first.
//
// Nothing here changes a score. Points are still one answer at a time, worked
// out by script.js on the server. What an earlier choice changes is what the
// player sees, what people say, and how clearly the defense can be read.

export const NAMES = {
  you: "YOU", uncle: "YOUR UNCLE", brother: "YOUR BROTHER", sister: "YOUR SISTER", cousin: "YOUR COUSIN", niece: "YOUR NIECE", grandma: "GRANDMA",
  jerry: "JERRY JONES", reporter: "A REPORTER", receiver: "NUMBER 88", kicker: "YOUR KICKER", backup: "YOUR BACKUP QUARTERBACK", returner: "YOUR KICK RETURNER",
  coachA: "YOUR DEFENSIVE COACH", coachB: "YOUR OTHER DEFENSIVE COACH",
};

// A question on screen: `wide` is said over the place, each shot is one person
// up close saying one thing ([who, line, mood]), and `ask` is the one line left
// on the card beside the answers. `act` names a moment the page draws first.
const W = (wide, shots, ask, act) => ({ wide, shots, ask, act });
export const SHOW = {
  breakfast: W(["It's 6:30 on Thanksgiving morning. Your family's annual football game kicks off at the park at 8."], [["grandma", "\"You are not coaching on an empty stomach. Pick something.\""]], "You need breakfast first. What do you eat?"),
  stars: W(["You're at the park, warming up with your family before the game."], [["uncle", "\"Only throw to our two best players. Everybody else can watch.\""]], "What do you do?"),
  blowup: W(["The game has started. Your brother is wide open."], [["brother", "\"I'm done! Who throws a ball like that?\"", { angry: true }]], "He has thrown the ball into the leaves, and everyone is looking at you. What do you do?", "drop"),
  shout: W(["The game has started. Your cousin is on defense, and she keeps ending up in the wrong spot."], [["cousin", "\"Where do you want me? Just tell me!\"", { sad: false, sweat: true }]], "The other team is about to snap the ball, and you can yell one thing to her. What do you yell?"),
  push: W(["It's halftime. Your team is losing 21 to 14."], [["uncle", "\"We're getting killed out there.\"", { sad: true, armUp: false }]], "Everyone is on the bench looking at you. You want to push them to play harder. What do you say?"),
  open: W(["It's halftime. Your team is losing 21 to 14."], [["sister", "\"Okay, coach. What have you got for us?\"", { armUp: false }]], "You have three things to tell them. What do you open with?"),
  culture: W(["Jerry Jones starts the interview."], [["jerry", "\"First question, and it's a simple one. What is culture?\""]], "What do you say?"),
  dissent: W(["Jerry Jones starts the interview with a plan of his own."], [["jerry", "\"One thing first. I call the first play of the game myself, from my box.\""]], "You think it is a bad idea. What do you say?"),
  power: W([], [["jerry", "\"My players are grown men, and they make more money than you do. How will you get them to do what you ask?\""]], "Pick two."),
  jet: W(["You got the job, and now you are on Jerry's jet to Dallas.", "The flight attendant comes by with drinks."], [], "What do you take?"),
  receiver: W(["You are coaching the Cowboys. It's the first quarter, and your best receiver has no catches."], [["receiver", "\"I'm open! Every play! Throw me the ball!\"", { angry: true }]], "He is screaming at your quarterback, and every camera in the stadium is on them. What do you do?"),
  commercial: W(["It's halftime in Dallas."], [["jerry", "\"Coach! I need you for two minutes. We're filming a truck commercial, right now.\"", { armUp: true }]], "Your players are waiting for you in the locker room. What do you do?"),
  conflict: W(["It's halftime in Dallas."], [["coachA", "\"I call the defense. I have called it all year.\"", { angry: true }], ["coachB", "\"And look at the scoreboard.\"", { angry: true }]], "Both of them turn to you. What do you do?"),
  speech: W(["You are in the locker room at halftime, losing by ten.", "Fifty-three players are waiting for you to say something."], [["kicker", "\"Coach?\""]], "What kind of speech do you give?"),
  points: W(["You are in the locker room at halftime, losing by ten."], [["coachA", "\"Nine adjustments, coach. You have four minutes with the offense.\""]], "What do you do with the list?"),
  returner: W(["You are coaching Texas against Texas A&M, at night, in front of a hundred thousand people."], [["returner", "\"Coach. It's my first college kickoff. What do I do?\"", { sweat: true }]], "What do you tell him?"),
  cohesion: W(["You are coaching Texas against Texas A&M, at night, in front of a hundred thousand people.", "Kickoff is in ten minutes."], [["backup", "\"It feels quiet in here, coach.\""]], "You want this team closer before it runs out. What do you do?"),
  kicker: W(["It's the second quarter in Austin. Your kicker lines up a field goal."], [["kicker", "\"I had it. I had it, and I pulled it.\"", { sad: true }]], "He walks to the bench staring at the ground. What do you do?", "miss"),
  backup: W(["It's the fourth quarter. Your quarterback is hurt."], [["backup", "\"Me? Coach, I haven't played all season.\"", { shock: true }]], "He is putting on his helmet. What do you tell him?"),
  twominute: W(["You are losing to Texas A&M by four points. There are two minutes left, and you have one time-out."], [["backup", "\"What's the call, coach?\"", { sweat: true }]], "What do you do?"),
  "pop-stacking": W([], [["cousin", "\"I'm taking a sociology of sport class. What does 'stacking' mean in sports?\"", { sad: false }]], "What do you tell her?"),
  "pop-titleix": W([], [["niece", "\"I play three sports. What does Title IX actually say?\"", { armUp: false }]], "What do you tell her?"),
  "pop-1968": W([], [["niece", "\"I go to San Jose State. There's a statue on campus of Tommie Smith and John Carlos. What should I know about them?\"", { armUp: false }]], "What do you tell her?"),
};

// What the announcer says. A line is spoken by the browser's voice and shown
// in the booth box, so it also reads with the sound off. If Andrew records a
// line, its id goes in RECORDED and the page plays /turkeybowl-voice/<id>.mp3.
export const RECORDED = new Set([]);
export const ANN = {
  kickoff: "Good morning from the park. Uncle Rick's team will kick off.",
  td: "Touchdown! And here comes the turkey.",
  stop: "Stopped at the line. That brings out the punt team.",
  inc: "Incomplete. That brings out the punt team.",
  pie: "Oh no. Nobody saw the pie coming.",
  silly: "I have never seen a coach do that.",
  over: "And that is the end of that coaching career.",
  streak: "This coach has not missed in a while.",
  jerry: "And who is that walking through the park? That is Jerry Jones.",
  dallas: "Welcome to Dallas. The Cowboys' new coach was at a public park this morning.",
  texas: "Good evening from Austin. The new Texas coach got here during warm-ups.",
  champion: "This coach won three games in one day. I have run out of things to say.",
  vague: "That sideline looks confused. Nobody over there is talking to anybody.",
  clear: "That sideline is talking. They know what they are looking at.",
  miss: "No good. It drifts wide.",
  drop: "Right through the hands.",
};

/** Which question a player got in a slot, and how it went: { id, rank } or null. */
export function took(slot, picks, alts, rankOf) {
  const id = [slot, ...alts.filter(a => a.slot === slot).map(a => a.id)].find(x => Object.prototype.hasOwnProperty.call(picks, x));
  return id ? { id, rank: rankOf(id) } : null;
}
const ok = (x) => x && (x.rank === "best" || x.rank === "good");

/** Who the last pass at the park goes to, and what the announcer says about it. */
export function parkTarget(t) {
  const b = t("blowup");
  if (b && b.id === "blowup") return ok(b) ? "The throw goes to the brother. Those two talked it out earlier, and it shows." : "The quarterback looks right past the brother. Those two are not speaking.";
  if (b) return ok(b) ? "The cousin is exactly where the coach told her to be." : "The cousin is somewhere on this field. Nobody is sure where.";
  return "";
}
/** Number 88 before the last drive in Dallas. */
export function dallasTarget(t) {
  const r = t("receiver");
  return !r ? "" : r.rank === "best" ? "Number 88 is back in this game. Whatever the coach said to him, it was said in private." : "Number 88 has cooled off. It took most of the first quarter.";
}
/** Jerry at halftime, remembering the interview: a line to say before he asks for anything. */
export function jerryRemembers(picks) {
  const p = picks.power; if (!Array.isArray(p)) return "";
  if (p.includes("coercive")) return "\"You told me you'd fine them until they listen. They look fined. They do not look like they are listening.\"";
  if (p.includes("expert") && p.includes("legit")) return "\"You told me you'd act like the head coach and know your stuff. So far, so good.\"";
  return "\"You told me they'd want to play for you. Let's see if they want to play the second half.\"";
}
/** The family at home, watching the Texas game: [who, line, mood] for each, by how the morning went. */
export function couch(t, picks) {
  const out = [], s = t("stars"), b = t("blowup"), h = t("push");
  if (picks.stars === "silly") out.push(["grandma", "\"I play for Rick now. I'm only watching for the turkey.\"", { angry: true }]);
  else out.push(["grandma", "\"That's my grandchild on the television. Turn it up.\"", { grin: true }]);
  if (s) out.push(ok(s) ? ["uncle", "\"Everybody got a turn this morning, and we were told why. I'd run through a wall for that coach.\"", { grin: true, armUp: false }] : ["uncle", "\"Half of us stood and watched warm-ups this morning. I'm still cold.\"", { sad: true, armUp: false }]);
  if (b && b.id === "blowup") out.push(ok(b) ? ["brother", "\"I lost it this morning, and I got asked how I was doing. I caught the next one.\"", { angry: false, grin: true, armUp: false }] : ["brother", "\"I got yelled at in front of everybody this morning. I'm watching the other channel.\"", { angry: true, armUp: false }]);
  else if (b) out.push(ok(b) ? ["cousin", "\"'Stay on Rick until he crosses the cone.' I knew exactly what to do.\"", { sad: false, grin: true }] : ["cousin", "\"I got told 'go left.' Left of what?\"", { sad: true }]);
  if (h) out.push(ok(h) ? ["sister", "\"That halftime talk this morning worked on me, and I don't even like football.\"", { armUp: false, grin: true }] : ["sister", "\"After that halftime talk this morning, I nearly went home.\"", { armUp: false, sad: true }]);
  return out;
}
/** Can the player read the defense? Only if at least half of this level's answers so far were best or good. */
export function clearRead(ranks) { return !ranks.length || ranks.filter(r => r === "best" || r === "good").length * 2 >= ranks.length; }
