// Sit-Down 1: the role each student plays at their table.
//
// Andrew, 2026-10-13: "students have a role they have to know better than
// others, and be able to understand how their role is affected by the others
// roles ... if i work in media, and someone else wants to be a coach, i have
// to know that my media demands pull on the coach, and also that the coach
// owes the increase in salary to media coverage and broadcast rights." And:
// "if they have a first role they want that works, let's do that." The role
// is one of their three Worktopia positions, cut to one job where the title
// names two ("yeah one of the two").
//
// Every role belongs to a field, and the pull between two roles is written
// once per pair of fields, so switching a student to their second position
// still draws the lines at the table. How a field changes going forward is
// the student's to work out; CHANGES are ideas for Andrew, not answers.
//
// The choice Andrew makes is saved on the plan row as `sitdownRoles`, a name
// to a letter. Until he picks, the page shows PICKS' letter as a suggestion.

export const FIELDS = {
  agent: "Agents and representation",
  apparel: "Apparel and merchandise",
  athlete: "Athletes",
  broadcast: "Broadcasting",
  coach: "Coaching",
  data: "Data and analytics",
  frontoffice: "Front office and athletic administration",
  health: "Health and performance",
  hospitality: "Sports bars and hospitality",
  journalism: "Journalism and history",
  marketing: "Marketing, brand and partnerships",
  pr: "Public relations",
  sales: "Ticket sales and client relations",
  social: "Social media and content",
  venue: "Venues and fan experience",
};

// One line per pair of fields, keyed by the two keys in alphabetical order.
const PULL_LIST = [
  ["agent", "broadcast", "Agents sell a client's story to broadcasters to build their name and endorsement value, and the rights money broadcasters pay is why the contracts agents negotiate keep getting bigger."],
  ["agent", "coach", "Coaches need players to buy into a system, while agents push for playing time, a bigger role and the next contract. In college the transfer portal and NIL mean an agent can move a coach's starter in a week."],
  ["agent", "data", "Agents use data to argue a client's value at the table, and teams use the same numbers to argue it down."],
  ["agent", "frontoffice", "The front office sets the salary cap math and the agent tries to break it. Every contract is a negotiation between the two."],
  ["agent", "health", "Agents need health staff to keep a client on the field, and injury reports and recovery timelines change what that client is worth."],
  ["agent", "journalism", "Agents leak to reporters to set the market for a client, and reporters depend on agents for the scoops that make their careers."],
  ["agent", "marketing", "Agents sell their clients as brands, and marketing departments are the ones buying endorsements and NIL deals."],
  ["agent", "pr", "When a client gets in trouble the agent and the team's PR staff both manage the story, and they do not always want the same outcome."],
  ["agent", "sales", "A star the agent signs sells tickets, and the ticket and suite revenue is what lets a team pay the agent's next ask."],
  ["agent", "social", "An athlete's following is part of the pitch an agent makes, so agents need content built around a client, and creators need the access agents control."],
  ["agent", "venue", "Agents book appearances, camps and events for clients, and venues need those names to fill a date."],
  ["broadcast", "coach", "Broadcasters need access, mic'd up practices, sideline interviews and TV timeouts, all of which pull on a coach's time and game plan. The coach's salary rides on the rights money broadcasting brings in."],
  ["broadcast", "data", "Broadcasters lean on analysts for the graphics, win probability and betting lines that fill a telecast, and data teams get their work in front of millions through broadcast."],
  ["broadcast", "frontoffice", "The front office signs the rights deals and schedules games around TV windows, and the rights fee is often the biggest line in its budget."],
  ["broadcast", "health", "Broadcasters want stars in the game and on camera, while health staff decide who sits. A load management night changes a broadcast's ratings."],
  ["broadcast", "journalism", "Broadcasters and reporters compete for the same access and the same audience, and reporters often supply the stories a broadcast tells."],
  ["broadcast", "marketing", "Broadcast sells the ad time marketing buys, and sponsors chase whichever broadcast puts the most eyes on their brand."],
  ["broadcast", "pr", "PR controls which players and coaches show up for interviews, and broadcasters push for more access than PR wants to give."],
  ["broadcast", "sales", "A good TV deal can cut into the gate when fans stay home to watch, and empty seats look bad on camera, so broadcast and ticket sales need each other and fight each other."],
  ["broadcast", "social", "Social clips spread broadcast highlights but also pull viewers away from the live telecast, and rights holders police what creators can post."],
  ["broadcast", "venue", "Venues are built for cameras now, with lighting, sightlines and booths, and game day timing bends around TV timeouts."],
  ["coach", "data", "Analysts hand coaches the numbers on matchups, play calling and player load, and coaches decide whether to trust them."],
  ["coach", "frontoffice", "The front office or athletic director hires and fires the coach and controls the budget and roster, and the coach's wins are how the front office keeps its own job."],
  ["coach", "health", "Health staff decide when a player is ready, and coaches want players back sooner. It is one of the tensest lines at any table."],
  ["coach", "journalism", "Reporters cover and criticize the coach, and the coach controls the access reporters need."],
  ["coach", "marketing", "Marketing wants the coach and players at sponsor events and in campaigns, and a winning program is what makes the brand worth sponsoring."],
  ["coach", "pr", "PR coaches the coach on what to say, and a coach who goes off script is PR's worst day."],
  ["coach", "sales", "Ticket sales depend on wins and on the coach's name, and sales staff want the coach at donor and season ticket events."],
  ["coach", "social", "Coaches want control of the locker room and the message, content teams want behind the scenes footage, and recruiting now runs through a program's social presence."],
  ["coach", "venue", "Coaches want facilities that win recruits and practice space when they need it, and venues book events that compete for the same field."],
  ["data", "frontoffice", "The front office uses analytics to pick players, set prices and spend money, and the data team exists because the front office pays for it."],
  ["data", "health", "Wearables and tracking data feed injury prevention and load management, and health staff decide what the numbers mean for a real body."],
  ["data", "journalism", "Reporters use advanced stats to make arguments, and data teams decide how much they share publicly."],
  ["data", "marketing", "Fan data tells marketing who to target and what sponsors are getting, and marketing pays for the data that proves its campaigns work."],
  ["data", "pr", "PR uses numbers to frame the story, and analysts can produce numbers that cut against the story PR wants told."],
  ["data", "sales", "Dynamic ticket pricing runs on data, so sales teams lean on analysts to set prices game by game."],
  ["data", "social", "Analysts measure which content performs, and social teams shape what they post around those numbers."],
  ["data", "venue", "Venues track fan movement, concession sales and wait times, and analysts turn that into changes in how the building runs."],
  ["frontoffice", "health", "The front office pays for the medical staff, and the medical staff protect the money the front office spent on players."],
  ["frontoffice", "journalism", "Reporters grade every move the front office makes, and the front office decides how much access to give them."],
  ["frontoffice", "marketing", "Marketing brings in the sponsorship revenue that funds the front office's budget, and the front office decides what the team is allowed to sell."],
  ["frontoffice", "pr", "PR protects the front office's reputation after every trade, firing and scandal."],
  ["frontoffice", "sales", "Sales brings in the ticket and premium seating revenue the front office spends, and one front office decision, like trading a star, can wreck a sales season."],
  ["frontoffice", "social", "The front office sets the brand and the rules, and the social team is the public voice of those decisions every day."],
  ["frontoffice", "venue", "The front office owns or leases the venue, and stadium deals, naming rights and the real estate around it are some of the biggest money decisions it makes."],
  ["health", "journalism", "Reporters chase injury news, and health staff are bound by privacy rules that keep them from saying much."],
  ["health", "marketing", "Athlete health is a brand opportunity, from supplements to women's health, and marketing sells products that health staff have to vet."],
  ["health", "pr", "Injuries, mental health and concussions are PR stories, and health staff and PR have to agree on what gets said."],
  ["health", "sales", "A star on injured reserve hurts ticket sales, so sales staff feel every health decision."],
  ["health", "social", "Athletes post training and mental health content that health staff want handled carefully, and social teams turn performance staff into content."],
  ["health", "venue", "Venues need medical rooms, safe playing surfaces and heat plans that health staff sign off on, and a bad field causes injuries."],
  ["journalism", "marketing", "Reporters are supposed to be independent of the team's brand, but more and more coverage is paid partnership content."],
  ["journalism", "pr", "PR and reporters negotiate every story. PR wants control of the message, and reporters want what PR is not saying."],
  ["journalism", "sales", "Coverage keeps fans interested between games, and bad coverage can hurt season ticket renewals."],
  ["journalism", "social", "Social media broke the reporter's hold on news, and reporters now compete with athletes and creators who post it first."],
  ["journalism", "venue", "Venues give reporters press boxes and access, and reporters cover stadium deals and the public money behind them."],
  ["marketing", "pr", "Marketing builds the brand and PR protects it, and a sponsor will leave if PR cannot handle a scandal."],
  ["marketing", "sales", "Marketing builds the demand and ticket sales closes it, and they share the same fan data and fight over the same budget."],
  ["marketing", "social", "Social is where most marketing runs now, so marketing needs creators, and creators need sponsor money to keep posting."],
  ["marketing", "venue", "Venues sell naming rights, signage and premium spaces that marketing packages for sponsors."],
  ["pr", "sales", "A PR crisis costs ticket sales, and sales staff need a good story to sell."],
  ["pr", "social", "Social teams post in real time, and PR cleans up when a post goes wrong."],
  ["pr", "venue", "Venue incidents, from fan fights to safety failures, become PR problems within minutes."],
  ["sales", "social", "Social content drives ticket demand, and sales teams use it to find buyers."],
  ["sales", "venue", "Ticket sales fill the venue, and the experience inside it, from seats to food, decides whether fans come back."],
  ["social", "venue", "Venues design moments for phones, from photo spots to light shows, and social teams need the building to look good on camera."],
  ["agent", "athlete", "The agent works for the athlete and takes a cut, so the athlete needs the agent to get paid, and the agent needs the athlete to keep winning and stay marketable."],
  ["athlete", "broadcast", "Broadcasters need athletes on mic, in interviews and in storylines, and the rights money is what pays athlete salaries."],
  ["athlete", "coach", "The coach decides the athlete's playing time and role, and the athlete's performance keeps the coach employed. With NIL and the transfer portal, the athlete can leave."],
  ["athlete", "data", "Tracking data measures every step an athlete takes, and those numbers can raise their value or end their career."],
  ["athlete", "frontoffice", "The front office signs, trades and cuts the athlete, and the athlete is where most of the front office's money goes."],
  ["athlete", "health", "Health staff keep the athlete on the field, and the athlete has to trust them over a coach who wants them back sooner."],
  ["athlete", "hospitality", "Bars fill when stars play, and athlete appearances and watch parties bring business to local bars and restaurants."],
  ["athlete", "journalism", "Reporters need athlete quotes and stories, and athletes more and more skip reporters and talk to fans directly."],
  ["athlete", "marketing", "Marketing makes athletes the faces of campaigns, and athletes earn endorsement and NIL money from it."],
  ["athlete", "pr", "PR trains athletes for interviews and cleans up after their mistakes, and an athlete's personal brand can cut against the team's message."],
  ["athlete", "sales", "Stars sell tickets, and ticket revenue pays the athletes."],
  ["athlete", "social", "Athletes are the content, and many now run their own channels with bigger audiences than their team's."],
  ["athlete", "venue", "The venue is the athlete's workplace, and its field, locker rooms and facilities affect how they perform and whether they get hurt."],
  ["agent", "hospitality", "Agents book athlete appearances at bars and restaurants, and a famous client can make a local spot a destination."],
  ["broadcast", "hospitality", "A sports bar lives on having the game on. When rights split across streaming services, the bar pays for every one or loses the customers who came for a game it cannot show."],
  ["coach", "hospitality", "A winning coach fills local bars on game day, and bar owners are some of a program's loudest boosters."],
  ["data", "hospitality", "Bars use sales data to plan staff and specials around the schedule, and betting data shapes what fans want on the screens."],
  ["frontoffice", "hospitality", "The front office sets game times, blackout rules and stadium food deals, and each one decides whether fans watch at a bar or in the building."],
  ["health", "hospitality", "Bars sell the opposite of what a nutritionist recommends, and teams watch what players eat and drink in public."],
  ["hospitality", "journalism", "Bars are where fans argue about the coverage, and local reporters cover bars as part of a city's sports culture."],
  ["hospitality", "marketing", "Beer and liquor brands are some of the biggest sports sponsors, and bars are where those sponsorships reach fans."],
  ["hospitality", "pr", "A player's bad night at a bar becomes a PR crisis, and bars want the publicity athletes bring without the trouble."],
  ["hospitality", "sales", "A sports bar competes with the stadium for the same fan's money on game day, and teams sell bar partnerships to win some of it back."],
  ["hospitality", "social", "Watch parties and fan reactions at bars make viral content, and bars use social to fill the room."],
  ["hospitality", "venue", "Stadium districts put team-run bars and restaurants beside the venue, competing with the independent sports bars in the neighborhood."],
  ["agent", "apparel", "Agents negotiate the shoe and apparel deals that put a client in a brand, and apparel companies sign athletes to sell the product."],
  ["apparel", "athlete", "Athletes wear the product on the field and in the tunnel, and signature lines and NIL deals pay them for it."],
  ["apparel", "broadcast", "Every camera shot is an ad for the jersey and the shoes, so the broadcast is the apparel company's biggest showroom."],
  ["apparel", "coach", "Coaches sign program-wide apparel deals that pay them and outfit the team, and the designer needs the team to win in the uniform."],
  ["apparel", "data", "Sales data says which jerseys and sizes move, and designers decide what to make from it."],
  ["apparel", "frontoffice", "The front office or athletic department signs the uniform contract, one of its biggest deals, and controls the logos and colors the designer works with."],
  ["apparel", "health", "Performance gear has to pass the health staff, from cleats that prevent injuries to uniforms that work for women athletes."],
  ["apparel", "hospitality", "Bars and fans in jerseys are the walking ads, and bars sell team gear on game day."],
  ["apparel", "journalism", "A uniform reveal is a story, and coverage of a new design drives sales."],
  ["apparel", "marketing", "The designer makes it and marketing sells it, and they fight over whether the product follows the brand or the brand follows the product."],
  ["apparel", "pr", "A bad design or a labor scandal at a factory becomes a PR problem for the team wearing it."],
  ["apparel", "sales", "Merch and tickets are sold to the same fans, often in the same bundle."],
  ["apparel", "social", "A drop lives on social, and creators decide which jersey is cool this season."],
  ["apparel", "venue", "The team store and the concourse are where most game day merch is sold, so the venue decides how much shelf space the designer gets."],
];
const PULLS = Object.fromEntries(PULL_LIST.map(([a, b, line]) => [a + "|" + b, line]));
export const pullOf = (a, b) => (a && b ? PULLS[[a, b].sort().join("|")] || "" : "");

// Ideas for how each field changes going forward. The student works this out;
// these are for Andrew to prompt with.
export const CHANGES = {
  apparel: ["Limited drops and collaborations instead of one jersey a season.", "Women's sports gear designed for women athletes.", "NIL signature lines for college players.", "Custom jerseys made to order."],
  athlete: ["NIL and revenue sharing put college athletes on a payroll.", "The transfer portal lets athletes move every year.", "Athletes run their own media, podcasts and brands.", "Mental health is part of the job now."],
  hospitality: ["Games split across streaming services, so a bar pays for every one.", "Legal betting brings fans to bars, or keeps them home on their phones.", "Team-run stadium districts compete with neighborhood bars.", "Watch parties for women's sports are a new crowd."],
  agent: ["NIL puts agents in front of teenagers and their parents.", "The transfer portal works like yearly free agency in college.", "An athlete's brand can be worth more than the playing contract.", "States and the NCAA keep changing the rules on who can represent a college athlete."],
  broadcast: ["Rights are splitting across streamers, from the NFL on Netflix to Amazon and YouTube, and fans cannot find the game.", "Alternate broadcasts like the Manningcast and creator watch-alongs.", "Betting odds built into the telecast.", "AI-generated highlights and commentary in other languages."],
  coach: ["The transfer portal makes every roster a one-year roster.", "NIL and revenue sharing put players on salary, and players have more power than they did.", "Some players have bigger followings than their coach.", "Analytics second-guess every call in real time."],
  data: ["Wearables and tracking data on every player.", "AI scouting and video analysis.", "Sports betting creates huge demand for data.", "Fights over who owns a player's data."],
  frontoffice: ["Colleges now share revenue with athletes directly.", "Private equity is buying stakes in teams.", "Conference realignment chases TV money.", "Salary caps and spending rules arriving in college sports."],
  health: ["Research built for women athletes, not adapted from men.", "Mental health treated as part of performance.", "Wearables and load management.", "Youth burnout from year-round single-sport play."],
  journalism: ["Local newspapers keep closing, and teams run their own media.", "Athletes break their own news.", "AI-written game recaps.", "Subscription outlets for a niche audience, like The Athletic."],
  marketing: ["NIL deals with college athletes.", "Women's sports growing fast and drawing sponsors.", "Brands paying creators directly instead of teams.", "Betting companies as sponsors."],
  pr: ["Athletes talk to fans directly, so PR controls less of the story.", "A crisis moves in minutes.", "Deepfakes and fake statements.", "Betting scandals."],
  sales: ["Dynamic pricing changes ticket prices game by game.", "The resale market sets prices the team does not control.", "Premium experiences over general seats.", "Better home viewing keeps fans home."],
  social: ["Athletes are their own channels.", "Platforms change their rules and their reach overnight.", "Short clips against the rights holders who own the footage.", "AI-generated content and deepfakes."],
  venue: ["Stadium districts with housing, hotels and shops around them.", "Fights over public money for new stadiums.", "Cashless, app-run buildings.", "Smaller venues built around premium seats."],
};

// The suggestion for each student: the letter of the position to use, the
// role at each letter (one job, and its field), why, and a question for
// Andrew when the choice is his to make. Written from the Worktopia files.
export const PICKS = {
  // Wed 9:15
  "Luke Baird": { pick: "a", why: "His first pick. The bar is where streaming fragmentation hits a business directly, so he has a real stake in broadcast.",
    roles: { a: { role: "Sports bar owner", field: "hospitality" }, b: { role: "Baseball announcer", field: "broadcast" }, c: { role: "Groundskeeper", field: "venue" } } },
  "Charles Kosinski": { pick: "a", why: "His first pick, and he says he has a background in real estate. The money in stadium deals ties him to the front office.",
    roles: { a: { role: "Head of stadium real estate", field: "venue" }, b: { role: "Field operations manager", field: "venue" }, c: { role: "Team chef", field: "health" } } },
  "Catherine Shanahan": { pick: "a", why: "Her first pick. The athletic director hires the coaches and runs the budget, so everyone at this table answers to the role.",
    roles: { a: { role: "Athletic director", field: "frontoffice" }, b: { role: "Head volleyball coach", field: "coach" }, c: { role: "Marketing director", field: "marketing" } } },
  // Andrew, 2026-10-14: "change Sophia's job to Social Media Content
  // Producer." It takes her first slot; the historian and reporter answers
  // are still in her file.
  "Sophia Alvarenga": { pick: "a", why: "Andrew's call, October 14: Social Media Content Producer, in place of sports historian.",
    roles: { a: { role: "Social Media Content Producer", field: "social" }, b: { role: "Sports reporter", field: "journalism" }, c: { role: "Fan relations manager", field: "sales" } } },
  // Wed 9:45
  "Drew Barreto": { pick: "a", why: "His first pick, and the strongest of his three answers.",
    roles: { a: { role: "Sports broadcaster", field: "broadcast" }, b: { role: "Sports reporter", field: "journalism" }, c: { role: "General manager", field: "frontoffice" } } },
  "Paul Beaven": { pick: "a", why: "His first pick, and he runs track himself. A college coach puts the transfer portal and scholarship limits at the table.",
    roles: { a: { role: "College track and cross country coach", field: "coach" }, b: { role: "College athletics administrator", field: "frontoffice" }, c: { role: "Team HR manager", field: "frontoffice" } } },
  "Addison Marshak": { pick: "c", why: "A and B are joke jobs, Pine Tar Remover from Worktopia's list and a Professional Napper of her own. C is real: dressing athletes for the tunnel walk is brand and content work.",
    ask: "Addison's first two are joke jobs. Athlete stylist from her third, or have her pick something else?",
    roles: { a: { role: "Pine Tar Remover", field: null }, b: { role: "Professional Napper", field: null }, c: { role: "Athlete stylist", field: "social" } } },
  "Alexa Gomez-Ardon": { pick: "a", why: "Her first pick. Her duties describe caddying more than marketing, so she will need to build this one up before the sit-down.",
    roles: { a: { role: "Sports marketer", field: "marketing" }, b: { role: "Brand developer", field: "marketing" }, c: { role: "Content creator", field: "social" } } },
  // Thu 9:15
  "Jameson Baldwin": { pick: "a", why: "His first pick.",
    roles: { a: { role: "Social media manager", field: "social" }, b: { role: "Media trainer", field: "pr" }, c: { role: "Broadcast producer", field: "broadcast" } } },
  "Will Tortorella": { pick: "a", why: "His first pick. Client relations sits on the money side, which nobody else at this table covers.",
    roles: { a: { role: "Client relations manager", field: "sales" }, b: { role: "Fan experience manager", field: "venue" }, c: { role: "Ticket sales manager", field: "sales" } } },
  "Neel Namburar": { pick: "a", why: "His first pick. A scout decides who gets signed, which puts him on the front office side.",
    roles: { a: { role: "Scout", field: "frontoffice" }, b: { role: "Head coach", field: "coach" }, c: { role: "Commentator", field: "broadcast" } } },
  "Katie Coggins": { pick: "c", why: "Her A was skipped and her B has no title, so her first named position is the analyst. It also gives the scout someone to argue with.",
    roles: { a: { role: "Unnamed", field: null }, b: { role: "Sports researcher", field: "journalism" }, c: { role: "Sports data analyst", field: "data" } } },
  // Thu 9:45
  "Ruby McAlister": { pick: "b", why: "All three of hers are Worktopia's horrible jobs. Andrew, 2026-10-13: \"give ruby something else and we can change it tomorrow in class.\" Her human cannonball answer is about entertaining a crowd safely, so for now she runs game day entertainment, which nobody else at her table covers.",
    ask: "A placeholder until class on October 14.",
    roles: { a: { role: "Practice squad player", field: "athlete" }, b: { role: "Game day entertainment director", field: "venue" }, c: { role: "Trophy and awards manager", field: "venue" } } },
  "Mailin Orozco": { pick: "a", why: "Her first pick, and she played Division I and internationally.",
    roles: { a: { role: "Professional soccer coach", field: "coach" }, b: { role: "Sports broadcaster", field: "broadcast" }, c: { role: "Professional soccer player", field: "athlete" } } },
  "Chloe Shim": { pick: "a", why: "Andrew, 2026-10-13: apparel design. Her A, designing or media, is about premium assets and brand identity, and she sits beside Gianna, who markets apparel: one makes it and one sells it.",
    roles: { a: { role: "Apparel designer", field: "apparel" }, b: { role: "Concessions designer", field: "venue" }, c: { role: "Fan experience coordinator", field: "venue" } } },
  "Gianna Alcaraz": { pick: "a", why: "Her first pick. Apparel ties marketing to athletes and NIL.",
    roles: { a: { role: "Apparel marketer", field: "marketing" }, b: { role: "Apparel marketer", field: "marketing" }, c: { role: "Media marketer", field: "marketing" } } },
  "Jacqueline Cingel": { pick: "b", why: "Her A, called Management, describes stadium cleanup, which would put her in the same field as Chloe. Broadcasting is her strongest answer and she has worked in sports media.",
    roles: { a: { role: "Stadium operations manager", field: "venue" }, b: { role: "Sports broadcaster", field: "broadcast" }, c: { role: "Sports marketer", field: "marketing" } } },
  // Fri 9:15
  "Lucy Kate Murray": { pick: "a", why: "Her first pick. Her women's health internship can come in as how the field is changing.",
    roles: { a: { role: "Sports nutritionist", field: "health" }, b: { role: "Women's athlete health specialist", field: "health" }, c: { role: "Athletic trainer", field: "health" } } },
  "Audrey Graham": { pick: "a", why: "Her first pick. A coach against a nutritionist is one of the tensest lines there is.",
    roles: { a: { role: "Softball coach", field: "coach" }, b: { role: "Sports nutritionist", field: "health" }, c: { role: "Sports psychologist", field: "health" } } },
  "Emme Munn": { pick: "a", why: "Her first pick, with clear duties.",
    roles: { a: { role: "Public relations specialist", field: "pr" }, b: { role: "Social media marketer", field: "social" }, c: { role: "Sports journalist", field: "journalism" } } },
  "Lila Waechter": { pick: "a", why: "Her first pick. She wrote Media, and her duties are game visuals and highlights, so it is a highlights producer.",
    roles: { a: { role: "Highlights producer", field: "broadcast" }, b: { role: "Public relations", field: "pr" }, c: { role: "Social content creator", field: "social" } } },
  // Fri 9:45
  "Sophia Taylor": { pick: "a", why: "Her first pick. HR sits inside the front office, the side of the team that manages people rather than players.",
    roles: { a: { role: "Team HR manager", field: "frontoffice" }, b: { role: "Events coordinator", field: "venue" }, c: { role: "Marketing and graphics coordinator", field: "marketing" } } },
  "Emma Alvarez": { pick: "a", why: "Her first pick, and she already runs pages for work.",
    roles: { a: { role: "Social media manager", field: "social" }, b: { role: "Events and partnerships manager", field: "marketing" }, c: { role: "Social media coordinator", field: "social" } } },
  "Julia Benavides": { pick: "b", why: "Her A, media and content, is the same field as Emma's. Marketing gives the table a spread.",
    roles: { a: { role: "Media and content coordinator", field: "social" }, b: { role: "Sports marketing coordinator", field: "marketing" }, c: { role: "Event coordinator", field: "venue" } } },
  "Yoyo Yang": { pick: "a", why: "His first pick. His duties are an athlete's image, what they say to the media and what they post, which is PR work.",
    roles: { a: { role: "Athlete image consultant", field: "pr" }, b: { role: "Sports agent", field: "agent" }, c: { role: "Sports photographer", field: "social" } } },
};

export const pickOf = (name) => PICKS[name] || null;
export const roleAt = (name, letter) => PICKS[name]?.roles?.[letter] || null;
