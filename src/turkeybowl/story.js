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
  mcconaughey: "MATTHEW McCONAUGHEY",
  andrew: "ANDREW ISHAK", kaepernick: "COLIN KAEPERNICK", ali: "MUHAMMAD ALI", robinson: "JACKIE ROBINSON", king: "BILLIE JEAN KING",
};

// Andrew, 2026-11-16: "put me in the game, as well as colin kaepernick, muhammad ali, jackie robinson, billie jean king."
// They walk on by name after the title. None of them says anything yet: what each one says, and where, is his to write.
export const ROLL = [["andrew", { armUp: true }], ["kaepernick", { kneel: true }], ["ali", { armUp: true }], ["robinson", {}], ["king", { armUp: true }]];

// A question on screen: `wide` is said over the place, each shot is one person
// up close saying one thing ([who, line, mood]), and `ask` is the one line left
// on the card beside the answers. `act` names a moment the page draws first.
// Andrew, 2026-11-17, on the writing: "redo all the writing to be a NES style", short lines, and the
// jokes are his, dictated the same day (the squishies, Joe Rogan, Grandma's tackles, Jerry's jet, Grandpa at
// receiver, the Ford commercial, the kicker, the backup's dream, the last two minutes). `post` is said
// after the moment the page draws, so a line about a drop comes after the drop.
const W = (wide, shots, ask, act, post) => ({ wide, shots, ask, act, post: post || [] });
export const SHOW = {
  breakfast: W(["It's 6:30. Thanksgiving morning.", "The family football game kicks off at 8. At the park."], [["grandma", "\"Grandpa's eating a plate of liver and beans. But I know that's not your favorite for breakfast.\""], ["grandma", "\"You are not coaching on an empty stomach. Pick something.\""]], "Breakfast first. What do you eat?"),
  stars: W(["You're at the park. Warm-ups.", "Your uncle has a plan that he heard on the Joe Rogan Experience podcast."], [["uncle", "\"Only throw to our two best players. Everybody else can watch.\""]], "What do you do?"),
  blowup: W(["The game is on. Your brother is wide open."], [["brother", "\"I'm done! Who throws a ball like that?\"", { angry: true }]], "The ball is in the leaves. Everyone is looking at you. What do you do?", "drop", ["Your brother dropped it. Another thing he's not good at (he is a very disappointing child in general)."]),
  shout: W(["The game is on. Your cousin ends up in the wrong spot. Whoops.", "Maybe she's bad at football. Or maybe it's because she spends all day watching TikToks about squishies."], [["cousin", "\"Where do you want me? Just tell me!\"", { sad: false, sweat: true }]], "Uncle Rick's team is about to snap the ball. You can yell one thing. What do you yell?"),
  push: W(["Halftime.", "You're losing 21-14. Your Grandma has three tackles for loss and a blocked punt."], [["uncle", "\"We're getting killed out there.\"", { sad: true, armUp: false }]], "Everyone is on the bench. They are looking at you. You want them to play harder. What do you say?"),
  open: W(["Halftime.", "You're losing 21-14. Your Grandma has three tackles for loss and a blocked punt."], [["sister", "\"Okay, coach. What have you got for us?\"", { armUp: false }]], "You have three things to tell them. What do you open with?"),
  culture: W(["Jerry Jones starts the interview."], [["jerry", "\"First question, and it's a simple one. What is culture?\""]], "What do you say?"),
  dissent: W(["Jerry Jones starts the interview. He has a plan of his own."], [["jerry", "\"One thing first. I call the first play of the game myself, from my box.\""]], "You think it is a bad idea. What do you say?"),
  power: W([], [["jerry", "\"Look, these guys are rich, and if there's one thing I know about rich guys, they don't like to listen to anybody.\""], ["voice:JERRY'S WIFE", "\"Jerry, as your wife, I wanted to tell you something...\""], ["jerry", "\"So as I was saying, rich men don't listen to anyone. How are they gonna listen to you?\""]], "Pick two."),
  jet: W(["You got the job.", "This is Jerry Jones's jet. Jerry has taken it all over the world, including to numerous Super Bowls.", "Not that the Cowboys have played in the Super Bowl since this jet was built. He just went to watch the game.", "The flight attendant comes by with drinks."], [], "What do you take?"),
  receiver: W(["You are coaching the Cowboys. First quarter.", "Your best receiver (your Grandpa) has no catches."], [["receiver", "\"I'm open! Every play! Throw me the ball!\"", { angry: true }]], "He is screaming at your quarterback. Every camera is on them. What do you do?"),
  commercial: W(["Halftime in Dallas.", "Jerry wants you to do a commercial for Ford Trucks. It'll be quick and painless.", "All you have to do is look at the camera and say you love Ford Trucks so much you wish you could marry one."], [["jerry", "\"Coach! I need you for two minutes.\"", { armUp: true }]], "Your players are waiting in the locker room. What do you do?"),
  conflict: W(["Halftime in Dallas."], [["coachA", "\"I call the defense. I have called it all year.\"", { angry: true }], ["coachB", "\"And look at the scoreboard.\"", { angry: true }]], "Both of them turn to you. What do you do?"),
  speech: W(["Halftime. The locker room. You're losing by ten.", "Fifty-three players are waiting."], [["kicker", "\"Coach?\""]], "What kind of speech do you give?"),
  points: W(["Halftime. The locker room. You're losing by ten."], [["coachA", "\"Nine adjustments, coach. You have four minutes with the offense.\""]], "What do you do with the list?"),
  returner: W(["Texas against Texas A&M. At night. A hundred thousand people."], [["returner", "\"Coach. It's my first college kickoff. What do I do?\"", { sweat: true }]], "What do you tell him?"),
  cohesion: W(["Texas against Texas A&M. At night. A hundred thousand people.", "Kickoff is in ten minutes."], [["backup", "\"It feels quiet in here, coach.\""]], "You want this team closer before it runs out. What do you do?"),
  kicker: W(["Second quarter in Austin. Your kicker lines up a field goal."], [["kicker", "\"I had it. I had it, and I pulled it.\"", { sad: true }]], "He walks to the bench. He stares at the ground. What do you do?", "miss", ["Your kicker misses. He is killing your team and he's not even a real football player. He's a kicker!"]),
  backup: W(["Fourth quarter. Your quarterback is hurt.", "Your backup QB has not played all season but don't worry: he has dreamt about this moment in his sleep.", "(Of course, he then threw an interception to a clown who turned out to be his 8th grade science teacher who asked him for his homework but he didn't turn it in on time. Dreams are weird sometimes.)"], [["backup", "\"Me? Coach, I haven't played all season.\"", { shock: true }]], "He is putting on his helmet. What do you tell him?"),
  twominute: W(["You're losing to Texas A&M by four.", "Two minutes. 100,000 people watching. 10,000,000 watching on TV. 100,000,000 dollar contract at stake.", "You have one time-out."], [["backup", "\"What's the call, coach?\"", { sweat: true }]], "What do you do?"),
  "pop-stacking": W([], [["cousin", "\"I'm taking a sociology of sport class. What does 'stacking' mean in sports?\"", { sad: false }]], "What do you tell her?"),
  "pop-titleix": W([], [["niece", "\"I play three sports, and I have read the school handbook twice. Title IX is in there once, with no explanation. What does it actually say?\"", { armUp: false }]], "What do you tell her?"),
  "pop-1968": W([], [["niece", "\"I go to San Jose State. I walk past the statue of Tommie Smith and John Carlos every day, and I have read the plaque. What should I know that the plaque leaves out?\"", { armUp: false }]], "What do you tell her?"),
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
  streak: "This coach is on firrrrrre!",   // his line, 2026-11-17
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
  out.push(JUDGE);
  return out;
}
/** Can the player read the defense? Only if at least half of this level's answers so far were best or good. */
export function clearRead(ranks) { return !ranks.length || ranks.filter(r => r === "best" || r === "good").length * 2 >= ranks.length; }

// ─── the rest of the reading list, in the mouths of the people in the game ───
// Andrew, 2026-11-14: "i want stuff from other readings." Each line is the
// reading's idea in the character's own words, said once, at a point in the
// day where it fits. The key says when: "q:" before a question's slot, "a:"
// after it, "s:" after a cut scene. who is a person, "ann" for the announcer,
// or "text:<who>" for a text message. The reading is named beside each line.
// The niece, since 2026-11-16 (Andrew: "make the niece a very lisa simpson character"): the one in the family who has read
// the handbook, asks in writing, and wants the part the plaque leaves out. Her look is her own.
// Who everybody is, since 2026-11-16. Andrew: "my brother is a degenerate gambler who uses polymarket and kalshi to bet on
// everything, including things that happen in all the games ... my sister is a feminist ... we want the characters to all have
// different roles." And: "building some information in here about gambling statistics, like we read stuff in class." So:
//   brother   bets on everything, on his phone, all day
//   sister    the feminist
//   niece     has read the handbook and made a chart
//   uncle     did it the old way and liked it
//   cousin    the sociology student
//   nephew    the travel-team kid
//   grandma   keeps score of everything
// The lines are Claude's drafts for him to edit. Every number is from the class's Week 1 gambling readings and is named beside
// its line: the NCAA's release of January 2026, and "Legalizing Sports Gambling Was a Huge Mistake" (The Atlantic, 2024).
// A "p:" key is said just before the last drive in that place.
// Thanksgiving's own numbers, his ask the same day ("the ratings for Thanksgiving Day games, about how big they are ... how many
// people watch football on Thanksgiving, but also how many people play"): the NFL's release on the 2025 games (57.2 million for
// the game in Dallas, the most for a regular-season game on record; 44.7 million across the three), and Pew's survey of
// November 2024 (35 percent expected to watch sports on Thanksgiving, 4 percent to play; Pew asked about sports, not football).
export const ASIDES = {
  "q:stars": [
    ["brother", "\"I have forty dollars on us this morning. Kalshi had no market on the family game, so I bet Uncle Rick in the group chat.\"", { angry: false, grin: true, armUp: false }],
    ["cousin", "\"Park rules. Two-hand touch, five Mississippi before you rush, and we call our own penalties.\"", { sad: false }],                                           // "The Rules of Pickup Basketball" (SB Nation), said in football's words. Andrew, 2026-11-16: fouls and "keeps the field" "are not football terms."
    ["nephew", "\"My mom says I'm the quarterback of my own life.\""],   // the nephew talks like Ralph Wiggum; his three lines are Andrew's, 2026-11-17
    ["sister", "\"And none of that co-ed league stuff where a girl's touchdown counts double. I'll score regular ones.\"", { armUp: false }],        // "Why Co-Ed Sports Leagues Are Never Really Co-Ed" (Deadspin)
  ],
  "s:kickoff": [["ann", "A Pew survey asked Americans about Thanksgiving. Thirty-five percent expected to watch sports. Four percent expected to play. This family is in the four."],
    ["niece", "\"Thirty-nine states and Washington, D.C. have legal sports betting now. Your brother is trying to visit all of them from his phone.\"", { armUp: false }],   // NCAA release, January 2026
    ["nephew", "\"My travel team costs more than this whole park. Dad says kids' sports is a fifteen-billion-dollar business now.\""]],   // "How Kids Sports Became a $15 Billion Industry" (Time)
  "s:half1": [["you", "\"Hey, screenager!\""],   // the player, to the brother on his phone; Andrew, 2026-11-17
    ["brother", "\"Polymarket has Grandma scoring again at even money. I took it. Sorry.\"", { angry: false, armUp: false, look: -2 }],
    ["uncle", "\"In my day we ran one play, and we ran it until somebody cried.\"", { armUp: false }],
    ["nephew", "\"I wear two left shoes because I have weird feet.\""]],
  "q:culture": [["jerry", "\"Before we start. Congress let the league sell its television rights as one package back in 1961. The same law keeps us off Fridays and Saturdays in the fall, for the high schools and the colleges. Thursday, though? Thursday is mine.\""]],   // Sports Broadcasting Act of 1961
  "q:jet": [["jerry", "\"A coach once sent his four best players home before a big television game. The league fined the team a quarter of a million dollars. So tell me. Do you owe the people a show?\""]],   // "Are You Not Entertained?" (Klosterman, Grantland)
  "p:park": [["brother", "\"I put twenty dollars on your next play call. Don't ask which way. Just call a good one.\"", { angry: false, armUp: false, sweat: true }],
    ["nephew", "\"Sometimes I play football with my dog. I beat him 35-31.\""]],
  "s:dallas": [
    ["ann", "Last Thanksgiving, the game in Dallas averaged fifty-seven million viewers. That is the most for any regular-season game on record."],
    ["text:brother", "\"You're coaching the COWBOYS? I took the other team an hour ago. Nothing personal.\""],
    ["ann", "Americans were expected to bet thirty-five billion dollars on the NFL in 2024. The coach's brother is doing his part."],   // American Gaming Association projection, in the Atlantic piece
    ["jerry", "\"Look up. Every new stadium has fewer cheap seats and more clubs and suites. That's where the money is.\"", { armUp: true }],       // "How the Sports Stadium Went Luxe" (New Yorker)
    ["ann", "That flyover was lovely. For years, the military paid teams for moments like that one."],                                             // "Veterans Affairs: The Uneasy Marriage of Military Money and the NFL" (Grantland)
  ],
  "q:receiver": [["ann", "A network once ordered its football theme by asking for Batman on steroids. Ours was written by a turkey."]],             // "Batman on Steroids" (Deadspin)
  "q:commercial": [["jerry", "\"The three Thanksgiving games last year averaged close to forty-five million people apiece. You can sell a lot of trucks to forty-five million people.\"", { armUp: true }],
    ["jerry", "\"Helmets were plain until television came along. Then somebody worked out that you could sell the picture on the side.\""]],   // "How TV and Roy Rogers Helped Put Logos on NFL Helmets" (Radom)
  "q:returner": [["text:brother", "\"I put ten dollars on your kicker missing his first field goal. Nothing personal.\""]],                         // NCAA on prop bets
  "a:receiver": [["text:sister", "\"Count the women on that sideline who are not holding a microphone. Text me the number.\""]],
  "p:dallas": [
    ["text:brother", "\"There is a market on your next play call. I bought RUN. Please call a run.\""],
    ["text:niece", "\"One study found that for every dollar a household bets on sports, two fewer dollars go into its investments. I made him a chart. He bet on whether I would.\""],   // the July 2024 study in the Atlantic piece
  ],
  "p:texas": [
    ["text:brother", "\"My parlay: Texas wins, the turkey dances, Grandma falls asleep. Two of three so far.\""],
    ["ann", "More than one in three Americans bets on sports, according to a Seton Hall poll. One of them keeps texting this sideline."],   // in the Atlantic piece
  ],
  "a:kicker": [
    ["text:brother", "\"He missed! I won! Tell him thanks from me.\""],
    ["ann", "The NCAA says thirty-six percent of Division I men's basketball players have been harassed by somebody with a bet on them. It has asked states to stop taking bets on single players."],                  // "NCAA Urges Gambling Commissions to Eliminate Prop Bets"
  ],
  "q:backup": [["returner", "\"They call us student-athletes, coach. The NCAA made that word up so it would not have to pay for players who got hurt.\"", { sad: true }]],   // "The Shame of College Sports" (Branch, The Atlantic)
  "q:twominute": [["kicker", "\"Coach, I've got a brand deal riding on this drive. Name, image and likeness. Mostly image.\"", { grin: true }]],      // the Livvy Dunne NIL piece (ESPN)
};
/** After a stopped play in a stadium: the quarterback who compliments the man who hit him. "Andrew Luck: The NFL's Most Perplexing Trash Talker" (WSJ). */
export const NICE_HIT = "The quarterback just told the man who tackled him, nice hit. He meant it.";
/** Grandma, scoring the turkey. "The Quandary of Subjective Sports" (NPR). */
export const JUDGE = ["grandma", "\"And I gave that turkey's halftime dance a 9.4. Put a judge on anything, and somebody goes home mad.\"", {}];
