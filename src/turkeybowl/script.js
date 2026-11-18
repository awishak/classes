// Turkey Bowl: the whole game as data, and the rules that score a run.
// Plain JS, no DOM, so the page draws from this file and the server scores
// from the same file. A browser never decides a score.
//
// Andrew, 2026-11-14, COMM 118, Weekly Challenge 4: "They play Thanksgiving
// football. And they help coach their team to victory ... Jerry Jones sees
// them playing ... and decides to have them coach the Dallas Cowboys ...
// students are going to be playing for a high score. The highest score would
// be 10,000 points." And later the same day: "the first game you have to
// coach is this turkey bowl game with your team, and then you coach the
// Dallas Cowboys, but then you get the real best head coaching job, which is
// the Texas Longhorns against Texas A&M. And that's a night game ... if you
// win that, then you're the real champion of the whole thing. So take some
// of the questions and move them into that third game."
//
// Four levels: (1) the family's Turkey Bowl at the park, (2) the interview
// with Jerry Jones and the jet, (3) the Cowboys on Thanksgiving afternoon,
// (4) Texas against Texas A&M that night. Credit in COMM 118 is still
// reaching Level 3, which is landing in Dallas.
//
// Andrew, 2026-11-14, after the fifth pass: "questions are still too easy."
// The joke stays in about half the questions, two options can both be best
// when the review lists both as effective, and no option is ranked on a
// judgment the review does not make ("don't use your judgment"): every
// option that is not a joke is something the text supports as working or as
// not working, or one of his own stated rules.
//
// Every question has four options, ranked best, good, bad, silly, shown in a
// shuffled order. Two options end the run ("over"). He found the first set
// too easy to read: "obviously, a longer answer is more likely to be
// correct ... make the answers a little bit more challenging." So the four
// options of a question are written to about the same length, and the wrong
// ones are things a reasonable coach might do. He also said "there are
// probably too many questions overall": fourteen and three pop questions
// here, down from eighteen and three.
//
// After an answer the game gives one line that says why, citing the study
// his articles cite, never the articles themselves ("don't cite Ishak 2017
// or Ishak 2021 if there is an internal citation in those articles that you
// can cite"). The right answers come from Ishak (2021), "Communicating in
// Sports Teams," and Ishak (2017), "Communication in Sports Teams: A Review."
//
// Football is three plays, one a game. "The football stuff is really bad. I
// think we need to cut the football stuff ... maybe a third." A play is one
// choice, run or pass, against how the other team is lined up. The right
// call is a touchdown and the wrong call is a punt.

export const MAX_SCORE = 10000;
export const PLAY_POINTS = 300;
/** Share of a question's points for each rank. */
export const SHARE = { best: 1, good: 0.6, bad: 0.2, silly: 0, over: 0 };
export const RANK_SAY = { best: "Best call", good: "Good call", bad: "Not good", silly: "Ludicrous", over: "Game over" };
// Andrew, 2026-11-14: "You need to say like, well, you chose something that
// probably wouldn't work that well ... don't tell them what they should have
// chosen. Tell them you probably could have chosen something else."
export const VERDICT = {
  best: "",   // Andrew, 2026-11-17: "That was the best thing you could have done. Don't say that." The card says Best call and nothing more.
  good: "That works. There was a stronger choice.",
  bad: "That probably would not work very well. You could have chosen something else.",
  silly: "That would not work at all. You could have chosen something else.",
  over: "That ends your day. You could have chosen something else.",
};
export const LEVEL_SAY = { 1: "The Turkey Bowl", 2: "The interview", 3: "Dallas", 4: "Texas" };

// The five ways to get players to do what you ask (French and Raven), for
// Jerry's pick-two question. Legitimate and expert score highest on gaining
// compliance (Rylander, 2015); reward and referent next; coercive last.
export const POWER = [
  { k: "expert", text: "\"I'll show them I know what I'm talking about.\"", w: 1 },
  { k: "legit", text: "\"I'm the head coach, and I'll act like the head coach.\"", w: 1 },
  { k: "reward", text: "\"I'll praise and reward what I want to see more of.\"", w: 0.6 },
  { k: "referent", text: "\"I'll build relationships, so they want to play for me.\"", w: 0.6 },
  { k: "coercive", text: "\"I'll fine them and bench them until they listen.\"", w: 0 },
];

// What each question is about, said before the question. "Here's a question
// about motivational climate, and then presenting the question first, and
// then presenting each of the answers."
export const TOPICS = {
  breakfast: "eating before you play", stars: "motivational climate", blowup: "emotion", push: "negative messaging",
  culture: "culture", power: "power", jet: "hydration",
  receiver: "conflict", commercial: "sport as spectacle", speech: "halftime speeches",
  returner: "goal setting", kicker: "emotion", backup: "clarity of roles", twominute: "time-outs",
  shout: "talking during play", open: "halftime talks", points: "how much to say", dissent: "dissent", conflict: "conflict", cohesion: "cohesion",
  "pop-stacking": "race and sport", "pop-titleix": "gender and sport", "pop-1968": "politics and sport",
};
// Three questions have a second version, and a run's seed picks which one a
// player gets, so two runs are not the same list. An alternate names the
// question it stands in for as its slot, and is worth the same points.
const d = (id, level, points, who, scene, opts, after, extra = {}) => ({ id, level, points, who, topic: TOPICS[id] || "", scene, opts: opts.map(([rank, text, then], i) => ({ k: opts.findIndex(o => o[0] === rank) === i ? rank : rank + (i + 1), rank, text, then })), after, ...extra });

export const DECISIONS = [
  // ─── Level 1: the park ───
  d("breakfast", 1, 500, "", "It's 6:30 on Thanksgiving morning. Your family's annual football game kicks off at the park at 8. You need breakfast first. What do you eat?", [
    ["best", "Mashed potatoes and mac and cheese", "Energy all morning."],
    ["good", "A big plate of turkey", "You are stronger, and slow by the second quarter."],
    ["bad", "Cranberry sauce, straight from the can", "A sugar high. Fast for three plays, then you crash."],
    ["silly", "Pumpkin pie with gravy on top", "You play badly the whole first half."],
  ], "You've got to choose the right food. Don't be silly and choose something that's not good for you. Always eat a good breakfast.", { food: true }),
  d("stars", 1, 500, "uncle", "You're at the park. Warm-ups. Your uncle has a plan that he heard on the Joe Rogan Experience podcast. Only throw to the two best players. Everyone else can watch. What do you do?", [
    ["best", "Rotate everyone through, and say the goal today is to improve.", "Everyone is warm, and everyone knows why."],
    ["good", "Rotate everyone through, and say nothing about why.", "Everybody practices. Nobody knows what the team is about."],
    ["bad", "Start with the two best, and work the others in after.", "There is no time after. Half your team starts the game cold."],
    ["silly", "Trade Grandma to Uncle Rick's team for a player to be named later.", "Grandma scores on you. Twice."],
  ], "A mastery climate values every player and defines success as getting better. A performance climate ignores less-skilled players to focus on stars (Horn et al., 2012). The climate has to be both communicated and implemented."),
  d("blowup", 1, 500, "brother", "The game is on. Your brother dropped it. Another thing he's not good at (he is a very disappointing child in general). The ball is in the leaves. Everyone is looking at you. What do you do?", [
    ["best", "Ask him what he's feeling right now.", "He tells you. Then he catches the next one."],
    ["best", "Make a joke to break the tension.", "He laughs, and he catches the next one."],
    ["best", "Tell him one thing to fix on the next catch.", "He fixes it, and he catches the next one."],
    ["bad", "Tell him, loudly, that he is costing the team.", "He stops trying for the rest of the half."],
  ], "Teammates regulate each other's emotion with positive or technical feedback, with humor, and by asking about the emotion (Tamminen & Crocker, 2013). Verbal aggressiveness lowers an athlete's motivation (Mazer et al., 2013)."),
  d("push", 1, 500, "", "Halftime. You're losing 21-14. Your Grandma has three tackles for loss and a blocked punt. Everyone is on the bench. They are looking at you. You want them to play harder. What do you say?", [
    ["best", "\"Play like we practiced, and you'll tell this story at dinner.\"", "They come out flying."],
    ["best", "\"If you coast through this half, you'll regret it all year.\"", "They come out flying."],
    ["bad", "\"That half was embarrassing, and every one of you knows it.\"", "Heads drop. Your uncle agrees with you, which is worse."],
    ["bad", "\"Anyone who loafs this half sits out next year's game.\"", "They play scared, and it shows."],
  ], "Regret messages come in an upward form (\"if you do this, you'll be successful\") and a downward form (\"if you don't, you won't\") (Turman, 2005). Motivation drops under coaches who use intimidation (Occhino et al., 2014) and verbal aggressiveness (Mazer et al., 2013)."),

  // ─── Level 2: Jerry Jones ───
  d("culture", 2, 500, "jerry", "Jerry Jones starts the interview. His first question is simple: \"What is culture?\" What do you say?", [
    ["best", "\"The beliefs, values and customs a group shares and passes on.\"", "Jerry nods slowly."],
    ["good", "\"It's the way things get done around here, every single day.\"", "Jerry: \"Fine. Short. I like short.\""],
    ["bad", "\"The rules and policies a team writes down for everyone to follow.\"", "Jerry: \"That's a handbook, son.\""],
    ["silly", "\"Whatever is printed on the hats in the team store.\"", "Jerry touches his hat, confused."],
  ], "Culture in sports teams is broadly defined as the way things are done (Wagstaff & Burton-Wylie, 2018). The class definition is the shared beliefs, values, customs, behaviors and artifacts a group learns, shares and passes down."),
  d("power", 2, 500, "jerry", "Jerry points out that his players are grown men who make more money than you do. He asks how you will get them to do what you ask. Pick two.", [],
    "Legitimate and expert power were most effective at gaining compliance (Rylander, 2015). Athletes are more satisfied under reward, referent and expert power, and coercive power makes them more sensitive to feedback (Cranmer & Goodboy, 2015).", { pick: 2 }),
  d("jet", 2, 500, "", "You got the job. This is Jerry Jones's jet. The flight attendant comes by with drinks. What do you take?", [
    ["best", "A tall glass of water", "Hydrated. You land sharp."],
    ["good", "Sparkling water with lime", "Same thing, fancier."],
    ["bad", "Three cups of black coffee", "Jittery at kickoff. Your first play call comes out too fast."],
    ["over", "One glass of champagne", "You tell Jerry he reminds you of your grandma, put on his hat, and ask if he wants to parachute into the stadium. He fires you for being weird."],
  ], "Drink water to hydrate.", { drink: true }),

  // ─── Level 3: Dallas ───
  d("receiver", 3, 800, "receiver", "You are coaching the Cowboys. First quarter. Your best receiver (your Grandpa) has no catches. He is screaming at your quarterback. Every camera is on them. What do you do?", [
    ["best", "Pull him aside, off camera, and talk with him alone.", "He comes back and blocks on the next play. Then he gets his catch."],
    ["good", "Stay out of it for now, and let it cool off.", "It cools off. It takes most of the quarter."],
    ["silly", "Hand him your headset and let him call the plays.", "He calls eleven straight passes to himself."],
    ["over", "Correct him right there, so the whole team sees where you stand.", "You lose the team's trust and everything falls apart."],
  ], "Talented but disruptive players are a named source of conflict in teams (Leggat et al., 2018). Take them aside. Avoiding was among the effective ways to handle a conflict (Laios & Tsetzis, 2005), and embarrassment and ridicule lower a team's cohesion (Turman, 2003)."),
  d("commercial", 3, 800, "jerry", "Halftime in Dallas. Jerry wants you to do a commercial for Ford Trucks. It'll be quick and painless. Your players are waiting in the locker room. What do you do?", [
    ["best", "Tell Jerry you'll film two after the final whistle.", "You make your halftime adjustments. Jerry gets his money later."],
    ["good", "Tell Jerry no, and walk straight to the locker room.", "The team gets its halftime. Jerry sulks in the owner's box."],
    ["bad", "Film it fast, and give the team whatever time is left over.", "Nobody made adjustments. Your first drive of the half goes nowhere."],
    ["silly", "Film it, and bring the whole offense to be in it.", "The commercial is great. You have no offense."],
  ], "When you choose the commercial, you are not calling plays and you are not paying attention to your team."),
  d("speech", 3, 800, "", "You are in the locker room at halftime, losing by ten. Fifty-three players are waiting for you to say something. What kind of speech do you give?", [
    ["best", "Keep it under a minute, and mean every word.", "They come out of the tunnel loud."],
    ["best", "Talk about what this team stands for.", "They come out of the tunnel loud."],
    ["bad", "Unveil a new game plan they have not seen.", "Half of them are still working it out at kickoff."],
    ["bad", "Save it for the tunnel, as they run out.", "Nobody hears it over the crowd."],
  ], "Players responded to genuine emotion, conciseness and references to team values. They responded badly to poorly timed speeches and surprising information (Breakey et al., 2009)."),

  // ─── Level 4: Texas against Texas A&M, at night ───
  d("returner", 4, 575, "returner", "You are coaching Texas against Texas A&M, at night, in front of a hundred thousand people. Your freshman kick returner looks over at you before the opening kickoff. What do you tell him?", [
    ["best", "\"Catch it, tuck it, and follow your blockers.\"", "He does all three. Forty yards."],
    ["best", "\"Eyes on the ball until it is in your hands.\"", "He watches it all the way in. Thirty-five yards."],
    ["bad", "\"Get this one out past the thirty-yard line, at least.\"", "He knows where to go, not how. He gets to the twenty."],
    ["bad", "\"Whatever happens out there, do not fumble.\"", "He thinks about fumbling the whole way. Guess what happens."],
  ], "Process goals beat outcome goals (Burton & Weiss, 2008), and goals about what to do beat goals about what to avoid (Van Mierlo & Van Hooft, 2020)."),
  d("kicker", 4, 575, "kicker", "Second quarter in Austin. Your kicker misses. He is killing your team and he's not even a real football player. He's a kicker! He walks to the bench. He stares at the ground. What do you do?", [
    ["best", "Walk over and put a hand on his shoulder.", "He makes the next one from 47."],
    ["best", "Walk over and ask how he feels about the miss.", "He tells you. He makes the next one from 47."],
    ["bad", "Tell him what the next kick means for the season.", "He thinks about the season. All quarter."],
    ["bad", "Tell him he has to be perfect from here on.", "He lines up the next one shaking."],
  ], "Asking about the emotion helps a teammate regulate it (Tamminen & Crocker, 2013), and so does touch (Kraus et al., 2010). An outcome-focused climate encourages choking (Hill et al., 2011), and perfectionism predicts anxiety (Hall et al., 1998)."),
  d("backup", 4, 575, "backup", "Fourth quarter. Your quarterback is hurt. Your backup QB has not played all season but don't worry: he has dreamt about this moment in his sleep. He is putting on his helmet. What do you tell him?", [
    ["best", "Tell him his job, and ask which plays he likes.", "He knows the job and he chose two of the plays. First down."],
    ["best", "Tell him exactly what his job is on this drive.", "He knows the job. First down."],
    ["bad", "Tell him to trust his talent and go make plays.", "He tries to make all of them at once. Sack."],
    ["bad", "Tell him nothing, so he does not overthink it.", "He is not sure what he is supposed to do. Neither is the huddle."],
  ], "The coach names the role and the expectations, and the player accepts or negotiates (Eys et al., 2005). Poor communication leads to role ambiguity and tension (Kang & Seibold, 2017)."),
  d("twominute", 4, 575, "", "You're losing to Texas A&M by four. Two minutes. 100,000 people watching. 10,000,000 watching on TV. 100,000,000 dollar contract at stake. You have one time-out. What do you do?", [
    ["best", "Call time-out and point everyone back to the plan.", "Everyone already knows where to be."],
    ["bad", "Call time-out and draw up a new play for this moment.", "Four players run four different plays."],
    ["bad", "Call time-out and cover six things they need to fix.", "They remember the first one."],
    ["silly", "Call time-out and ask the marching band what to run.", "The tubas want a reverse."],
  ], "Teams talk through scenarios ahead of time because there is no time in the moment. A time-out works best when it points the team back at a path they already know (Ishak & Ballard, 2012). The more ideas a coach gives, the less athletes retain (Mesquita et al., 2008)."),
];

export const ALTS = [
  d("shout", 1, 500, "cousin", "The game is on. Your cousin ends up in the wrong spot. Whoops. Maybe she's bad at football. Or maybe it's because she spends all day watching TikToks about squishies. Uncle Rick's team is about to snap the ball. You can yell one thing. What do you yell?", [
    ["best", "\"Stay on Rick until he crosses the cone!\"", "She stays on Rick. He does not get the ball."],
    ["bad", "\"Go left!\"", "She goes left. So does the entire defense."],
    ["bad", "\"Cover him!\"", "She covers somebody. It is not Rick."],
    ["silly", "\"Stop thinking about squishies!\"", "She keeps thinking about squishies."],
  ], "Two-word directives like \"Go left!\" coordinated players less well than more specific instructions (LeCouteur & Feo, 2011).", { slot: "blowup" }),
  d("open", 1, 500, "", "Halftime. You're losing 21-14. Your Grandma has three tackles for loss and a blocked punt. You have three things to tell them. What do you open with?", [
    ["best", "Something the team did well in the first half.", "They are still listening when you get to the two fixes."],
    ["bad", "The two fixes, and then something they did well.", "A few heads are down before you reach the good part."],
    ["bad", "The biggest mistake, while it is still fresh.", "Your brother knows it was him. He hears nothing after that."],
    ["silly", "A moment of silence for the first half.", "It lasts four minutes. Halftime is over."],
  ], "In a short break, the first point should highlight something positive about the game so far, and the second and third points should give corrective feedback (Andrews, 2015).", { slot: "push" }),
  d("dissent", 2, 500, "jerry", "Jerry Jones starts the interview with a plan of his own. He says he will call the first play of the game himself, from the owner's box. You think it is a bad idea. What do you say?", [
    ["best", "\"Here is the play I would open with, and why.\"", "Jerry listens. \"All right. Yours.\""],
    ["best", "\"Play calls come from the sideline, not the box.\"", "Jerry nods slowly. \"Fair.\""],
    ["bad", "\"Ha. And I'll go sell the hot dogs up there, Jerry.\"", "Jerry laughs. He still calls the first play."],
    ["silly", "\"Fine, but I own the team for one quarter.\"", "Jerry checks whether you are serious. You are."],
  ], "Dissent to a coach worked when it came with potential solutions and direct, factual appeals, and without humor (Cranmer, Buckner, et al., 2017).", { slot: "culture" }),
  d("conflict", 3, 800, "", "It's halftime in Dallas. Two of your assistant coaches are arguing over who calls the defense in the second half. What do you do?", [
    ["best", "Have each say what he needs, and build one plan from both.", "They walk out with one plan, and both of them call it theirs."],
    ["best", "Stay out of it for now, and let it cool off.", "By the end of halftime they have settled it."],
    ["bad", "Let the louder one have it, to keep the peace.", "The quiet one stops talking on the headset."],
    ["bad", "Decide it yourself, and end the discussion.", "It ends. They argue again in the third quarter."],
  ], "The most effective ways to resolve conflict were collaborating, compromising and avoiding. The least effective were competing and accommodating (Laios & Tsetzis, 2005).", { slot: "commercial" }),
  d("cohesion", 4, 575, "", "You are coaching Texas against Texas A&M, at night, in front of a hundred thousand people. Kickoff is in ten minutes, and you want this team closer before it runs out. What do you do?", [
    ["best", "Tease a few seniors by name in front of everyone.", "The room laughs, seniors included."],
    ["best", "Tell them how good Texas A&M is.", "They get quiet, and they get closer."],
    ["bad", "Call out the player who was late, in front of everyone.", "He looks at the floor. So does everybody else."],
    ["bad", "Give the starters the good seats on the bench.", "The backups notice."],
  ], "Sarcasm and teasing, motivational speeches and the quality of the opponent raised cohesion. Inequity, embarrassment and ridicule lowered it (Turman, 2003).", { slot: "returner" }),
  d("points", 3, 800, "", "You are in the locker room at halftime, losing by ten. Your assistants hand you a list of nine adjustments, and you have four minutes with the offense. What do you do with the list?", [
    ["best", "Give them the two biggest and skip the rest.", "They come out and run both."],
    ["good", "Give them four, and say which two matter most.", "They get the two. The other two are gone by kickoff."],
    ["bad", "Go through all nine fast so nothing is missed.", "Ask any of them what number six was."],
    ["silly", "Sing all nine to the tune of a fight song.", "They remember the tune."],
  ], "The more ideas a coach communicated, the less athletes retained and the less coherent their recall was (Mesquita et al., 2008).", { slot: "speech" }),
];

// Three questions that are not part of the story. Andrew, 2026-11-14: "i want
// you to have to explain some thing about sports and gender and sports and
// politics in different places. can you have a question about 'stacking' in
// sports as well as 'title IX' and tommie smith and john carlos ... put them
// in there randomly." Each run drops the three after three different spots,
// picked by the run's seed. Each is asked by somebody in the family, and
// away from the park the same question comes as a text on the coach's phone:
// "your niece who goes to San Jose State asks about the statue of Tommie
// Smith and John Carlos on her campus. What do you say about them?" The
// stacking answer is the class's own, from the weekly game.
export const POPS = [
  d("pop-stacking", 0, 300, "cousin", "Your cousin is taking a sociology of sport class. She asks you what \"stacking\" means in sports. What do you tell her?", [
    ["best", "One race being steered into certain sports or positions.", "Right. Both halves: whole sports, and positions inside a sport."],
    ["good", "Coaches choosing their quarterbacks by stereotypes about race.", "That is one example. Stacking is the wider pattern, across positions and whole sports."],
    ["bad", "Television showing athletes of color mostly in highlight clips.", "That is about media coverage. Stacking is about who gets put where."],
    ["silly", "Three linebackers standing on each other's shoulders at the snap.", "Illegal formation."],
  ], "Stacking: athletes of a certain race are disproportionately represented in specific sports or funneled into specific positions within a sport."),
  d("pop-titleix", 0, 300, "niece", "Your niece plays three sports. She asks you what Title IX actually says. What do you tell her?", [
    ["best", "\"No school program taking federal money can discriminate by sex.\"", "That is the law, and it never uses the word sports."],
    ["good", "\"Schools must give girls and boys an equal chance to play sports.\"", "That is what it means for sports. The law covers every part of a school, not only teams."],
    ["bad", "\"Every boys' team at a school must have a matching girls' team.\"", "Common mistake. The law is about equal opportunity overall, not a matching team for every team."],
    ["silly", "\"It was Super Bowl nine. Pittsburgh won, sixteen to six.\"", "She walks away."],
  ], "Title IX (1972): no person shall, on the basis of sex, be excluded from or discriminated against in any education program or activity receiving federal financial assistance."),
  d("pop-1968", 0, 300, "niece", "Your niece goes to San Jose State. She says there is a statue on campus of Tommie Smith and John Carlos, and she asks what she should know about them. What do you tell her?", [
    ["best", "\"Sprinters who raised their fists on the medal stand to protest racism.\"", "Right. Mexico City, 1968. The statue leaves the silver medal step empty, where Peter Norman stood."],
    ["good", "\"Two of the fastest men alive, who both won Olympic medals back in 1968.\"", "True, and it skips why there is a statue. They raised their fists on the medal stand to protest racism."],
    ["bad", "\"The first football players to kneel during the national anthem.\"", "That was Colin Kaepernick in 2016. Smith and Carlos were sprinters, almost fifty years earlier."],
    ["silly", "\"The two men who founded the campus parking department.\"", "She checks the plaque. No."],
  ], "Mexico City, 1968: Tommie Smith and John Carlos raised their fists on the 200 meter medal stand. The class reading is \"The White Man in That Photo,\" on Peter Norman."),
];
/** How a pop question opens away from the park, where the family is not on the sideline. */
export const popScene = (dec, away) => (away ? "Your phone buzzes on the sideline. It's a text from home. " + dec.scene : dec.scene);

// Somewhere to read more, opened in a new tab. Andrew, 2026-11-14: "always
// include a link, if you can, where somebody can click and open up a new tab
// and go somewhere else." The review is his 2017 article, open to anyone at
// Santa Clara's Scholar Commons; the statute is Cornell's copy of 20 U.S.C.
// 1681; the Peter Norman piece is on the class reading list.
const REVIEW = { say: "Read the review this comes from", url: "https://scholarcommons.scu.edu/crt/vol36/iss4/1" };
export const LINKS = {
  stars: REVIEW, blowup: REVIEW, push: REVIEW, culture: REVIEW, power: REVIEW, receiver: REVIEW, speech: REVIEW,
  returner: REVIEW, kicker: REVIEW, backup: REVIEW, twominute: REVIEW, shout: REVIEW, open: REVIEW, points: REVIEW, dissent: REVIEW, conflict: REVIEW, cohesion: REVIEW,
  "pop-titleix": { say: "Read the law", url: "https://www.law.cornell.edu/uscode/text/20/1681" },
  "pop-1968": { say: "Read \"The White Man in That Photo\"", url: "https://www.filmsforaction.org/articles/the-white-man-in-that-photo/" },
};
export const decisionOf = (id) => DECISIONS.find(x => x.id === id) || POPS.find(x => x.id === id) || ALTS.find(x => x.id === id) || null;

// The order of the game. "d" is a question, "p" is one play call, "s" is a
// cut scene the page draws, "gate" is where a level is won or lost.
export const FLOW = [
  { s: "title" },
  { d: "breakfast" }, { d: "stars" },
  { s: "kickoff" }, { d: "blowup" },
  { s: "half1" }, { d: "push" }, { p: 1 },
  { gate: 1 },
  { s: "jerry" }, { d: "culture" }, { d: "power" },
  { gate: 2 },
  { s: "jet" }, { d: "jet" },
  { s: "dallas" }, { d: "receiver" }, { d: "commercial" }, { d: "speech" }, { p: 1 },
  { gate: 3 },
  { s: "texas" }, { d: "returner" }, { d: "kicker" }, { s: "band" }, { d: "backup" }, { d: "twominute" }, { p: 1 },
  { gate: 4 },
];
export const PLAY_COUNT = FLOW.reduce((n, f) => n + (f.p || 0), 0);
/** The scene that starts each level past the first two. */
const ARRIVES = { dallas: 3, texas: 4 };

// What it takes to get through each gate: a level's own questions and play.
export const GATES = { 1: 1200, 2: 500, 3: 1400, 4: 1400 };
export const LAST_GATE = 4;

// How the other team lines up before a play, and the call that beats it.
export const LOOKS = [
  { k: "stack", say: "The other team is crowded up close to the ball.", beat: "pass" },
  { k: "deep", say: "The other team is standing far back.", beat: "run" },
  { k: "blitz", say: "The other team is about to rush your quarterback.", beat: "pass" },
  { k: "spread", say: "The other team is spread out wide.", beat: "run" },
];
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
/** The look on play number n of a run. */
export const lookFor = (seed, n) => LOOKS[hash(String(seed) + ":" + n) % LOOKS.length];
/** The order a question's options show in, for a run. */
export function orderFor(seed, id, count) {
  const idx = Array.from({ length: count }, (_, i) => i);
  let h = hash(String(seed) + "|" + id);
  for (let i = idx.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

/** The game in order for one run: the flow, with the three pop questions
 * each dropped in after a different question, picked by the seed. A pop
 * question never comes first, or straight after a choice that can end a run. */
export function flowFor(seed) {
  const spots = FLOW.map((f, i) => (f.d && i > 2 && f.d !== "jet" && f.d !== "receiver" && f.d !== "power" ? i : -1)).filter(i => i >= 0);
  const order = orderFor(seed, "pops", spots.length).slice(0, POPS.length).map(i => spots[i]);
  const which = orderFor(seed, "pop-order", POPS.length);
  const after = new Map(order.map((spot, n) => [spot, POPS[which[n]].id]));
  const out = [];
  FLOW.forEach((f, i) => {
    const alt = f.d && ALTS.find(a => a.slot === f.d);
    out.push(alt && (hash(String(seed) + "~" + f.d) >>> 11) & 1 ? { d: alt.id } : f);
    if (after.has(i)) out.push({ d: after.get(i), pop: true });
  });
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
  return { rank: opt.rank, points: Math.round(decision.points * SHARE[opt.rank]), over: opt.rank === "over", then: opt.then };
}

/** A run, scored. log is { seed, picks: { id: key | [key, key] }, calls: ["run" | "pass", ...] }.
 * Walks the flow in order and stops where the log stops, where a choice ends
 * the run, or where a gate is not passed. Returns { score, level, done,
 * over, lost, hired, parts }; level is the highest level reached, done is
 * winning in Texas, hired is winning in Dallas. */
export function scoreRun(log) {
  const picks = (log && log.picks) || {}, calls = (log && Array.isArray(log.calls) ? log.calls : []);
  const seed = log && log.seed;
  const parts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let level = 1, play = 0, over = "", lost = 0, done = false, hired = false, at = 0;
  for (const step of flowFor(seed)) {
    if (step.d) {
      const dec = decisionOf(step.d), got = Object.prototype.hasOwnProperty.call(picks, step.d) ? judge(dec, picks[step.d]) : null;
      if (!got) break;
      // A pop question counts for the level the player is in when the question comes up.
      parts[dec.level || level] += got.points;
      if (got.over) { over = step.d; at++; break; }
    } else if (step.p) {
      const call = calls[play];
      if (call !== "run" && call !== "pass") break;
      if (lookFor(seed, play).beat === call) parts[level] += PLAY_POINTS;
      play++;
    } else if (step.gate) {
      if (parts[step.gate] < GATES[step.gate]) { lost = step.gate; at++; break; }
      if (step.gate === 1) level = 2;
      if (step.gate === 3) hired = true;
      if (step.gate === LAST_GATE) done = true;
    } else if (ARRIVES[step.s]) level = ARRIVES[step.s];   // a level starts on landing: champagne on the jet ends a run in Level 2
    at++;
  }
  const score = Math.min(MAX_SCORE, parts[1] + parts[2] + parts[3] + parts[4]);
  return { score, level, done, over, lost, hired, parts, steps: at, plays: play };
}

/** "Sophia T." from a full name. */
export const shortName = (name) => { const p = String(name || "").trim().split(/\s+/).filter(Boolean); return p.length > 1 ? p[0] + " " + p[p.length - 1][0].toUpperCase() + "." : p[0] || ""; };
