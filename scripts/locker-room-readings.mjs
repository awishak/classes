// The readings before Locker Room, one list a student, on the class's
// readings row. Andrew, 2026-10-29: "assign chapter 4 to everyone", chapter 3
// to anyone "interested in motivation, youth/parents, spectators, coaching,
// positive coaching, or peers", three from his repository matched to each
// student's concepts sheet, and the articles found that day. Students on the
// roster with no concepts sheet get the two chapters.
//
// What this writes, on comm118-f26-v1-readings:
//   { titles: { id: { title, source, url } }, students: { email: [id, ...] } }
// The game reads it (engine.readingsFor) and shows the list before the season
// and from the Readings button on the sticky bar; the control page and each
// student page show it too.
//
//   node scripts/locker-room-readings.mjs           prints the table
//   node scripts/locker-room-readings.mjs --write   writes the row

import { readFileSync } from "node:fs";
import { isLurker } from "../src/engine/sections.js";

const ROOT = new URL("../", import.meta.url);
const SUPABASE_URL = readFileSync(new URL("src/storage-shim.js", ROOT), "utf8").match(/SUPABASE_URL = "([^"]+)"/)[1];
const env = Object.fromEntries(readFileSync(new URL(".env.local", ROOT), "utf8").split("\n").filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }));
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error("No SUPABASE_SERVICE_ROLE_KEY in .env.local. Run: vercel env pull .env.local"); process.exit(1); }
const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
const write = process.argv.includes("--write");
const STORAGE_KEY = "comm118-f26-v1";
const ID = STORAGE_KEY + "-readings";
// A student with no concepts sheet gets the class's most chosen concepts in
// the game (goal setting, failure, motivation, cohesion, emotion, culture),
// so they get the readings for those. Andrew, on the first pass that left
// them with the chapters alone: "what about jameson julia and mailin?"
const EVERYONE = ["ch4", "ch3", "great", "fans", "pickup1", "knicks", "kerr", "gladwell"];

const TITLES = {
  ch4: {"title":"Chapter 4: Small Group and Team Interactions","source":"Communication and Sport, our book"},
  ch3: {"title":"Chapter 3: Interpersonal Interactions","source":"Communication and Sport, our book"},
  knicks: {"title":"Knicks coaches did not get rings on banner night","source":"The Athletic","url":"https://www.nytimes.com/athletic/7715834/2026/10/22/knicks-ring-night-assistant-coaches-msg-employees/?unlocked_article_code=1.K1E.uJ6P.Ed6K2PlxZOxp"},
  popovich: {"title":"Are You Not Entertained?","source":"Klosterman on Popovich, Grantland","url":"https://grantland.com/features/chuck-klosterman-gregg-popovich-entertainment-sports/"},
  marmol: {"title":"Cardinals-Cubs: Michael Busch Nearly Hits for the Cycle","source":"The Athletic","url":"https://www.nytimes.com/athletic/6668845/2025/09/27/cardinals-cubs-michael-busch-cycle/"},
  great: {"title":"How Athletes Get Great","source":"Outside","url":"https://www.outsideonline.com/culture/books-media/how-athletes-get-great/"},
  abuse: {"title":"Crossing the line: Emotional abuse in college sports","source":"NPR","url":"https://www.npr.org/2026/03/28/g-s1-114976/crossing-the-line-emotional-abuse-in-college-sports-marta-marija-galic"},
  pickup1: {"title":"The Secret Code of Pickup Basketball","source":"The Atlantic","url":"https://www.theatlantic.com/health/archive/2024/06/pickup-basketball-sociology/678677/?gift=D5Deu8qtLSq92zJWaso6ZQklq_GPoJsgS-U3dJdfqlY"},
  pickup2: {"title":"Exploring New York Through Pickup Basketball","source":"The New York Times","url":"https://www.nytimes.com/2012/07/12/sports/basketball/a-new-arrival-explores-new-york-through-pickup-basketball.html?unlocked_article_code=1.jlA.4KVm.USzMI47AEJUX&smid=url-share"},
  ugly: {"title":"When the Beautiful Game Turns Ugly","source":"ESPN","url":"https://www.espn.com/espn/feature/story/_/id/9338962/when-beautiful-game-turns-ugly"},
  fans: {"title":"What Does Success Mean for Long-Suffering Sports Fans?","source":"Scientific American","url":"https://www.scientificamerican.com/blog/mind-guest-blog/what-does-success-mean-for-long-suffering-sports-fans-an-identity-crisis-say-researchers/"},
  sabalenka: {"title":"Sabalenka's Opponent Refuses to Shake Her Hand","source":"SportBible","url":"https://www.sportbible.com/tennis/aryna-sabalenka-elina-svitolina-handshake-australian-open-835064-20260129"},
  softball: {"title":"Is Softball Sexist?","source":"The New York Times","url":"https://www.nytimes.com/2014/06/07/opinion/is-softball-sexist.html"},
  prison: {"title":"On a Prison Baseball Field, a Reporter Finds a Familiar Love of the Game","source":"The New York Times","url":"https://www.nytimes.com/2025/12/10/insider/baseball-san-quentin-prison.html?unlocked_article_code=1.ZlA.MkFF.ydxfV078RFHW&smid=url-share"},
  photo: {"title":"The White Man in That Photo","source":"Films for Action","url":"https://www.filmsforaction.org/articles/the-white-man-in-that-photo/"},
  boo: {"title":"Should we boo college athletes?","source":"The Athletic","url":"https://www.nytimes.com/athletic/7684528/2026/10/13/booing-college-football-players-paid-arch-manning/?unlocked_article_code=1.IVE.JYtp.Jk2UXxCsRumh&source=athletic_user_shared_gift_article_copylink&smid=url-share-ta"},
  kerr: {"title":"Why Steve Kerr stayed with the Warriors","source":"ESPN, 2025","url":"https://www.espn.com/nba/story/_/id/48686303/steve-kerr-decision-return-coach-golden-state-warriors-steph-curry"},
  gladwell: {"title":"The Art of Failure","source":"Malcolm Gladwell, The New Yorker","url":"https://www.newyorker.com/magazine/2000/08/21/the-art-of-failure"},
  mh: {"title":"College athletes are less comfortable talking to coaches about mental health","source":"Cronkite News, 2025","url":"https://cronkitenews.azpbs.org/2025/03/20/ncaa-college-athletes-mental-health-coaches/"},
  phones: {"title":"NBA players know they're addicted to their phones. Good luck getting them to unplug.","source":"The Washington Post","url":"https://www.washingtonpost.com/sports/nba-players-know-theyre-addicted-to-their-phones-good-luck-getting-them-to-unplug/2018/03/19/6165cb96-2563-11e8-b79d-f3d931db7f68_story.html"},
  rebuild: {"title":"How to rebuild a college basketball team from scratch","source":"NPR, 2025","url":"https://www.npr.org/transcripts/nx-s1-5345774"},
  meetings: {"title":"Go behind closed doors for a glimpse inside players-only meetings","source":"ESPN","url":"https://www.espn.com/nfl/story/_/id/14124418/go-closed-doors-glimpse-players-only-meetings"},
  yell: {"title":"Is the era of abusive college coaches finally coming to an end?","source":"Sports Illustrated","url":"https://www.si.com/college/2015/09/29/end-abusive-coaches-college-football-basketball"},
  quit: {"title":"Why 70 percent of kids quit sports by age 13","source":"The Washington Post","url":"https://www.washingtonpost.com/news/parenting/wp/2016/06/01/why-70-percent-of-kids-quit-sports-by-age-13/"},
  crowd: {"title":"Crowd effects on athletes, a review","source":"Frontiers in Psychology, 2014","url":"https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00532/pdf"},
};

const STUDENTS = {
  "hyang14@scu.edu": ["ch4","ch3","great","marmol","fans","gladwell","yell"],
  "amarshak@scu.edu": ["ch4","ch3","knicks","fans","pickup1","gladwell","meetings"],
  "galcaraz@scu.edu": ["ch4","ch3","great","abuse","pickup1","mh","meetings"],
  "wtortorella@scu.edu": ["ch4","ch3","great","knicks","pickup1","phones","quit"],
  "rmcalister@scu.edu": ["ch4","ch3","knicks","marmol","softball","gladwell"],
  "lwaechter@scu.edu": ["ch4","ch3","pickup1","great","abuse","rebuild"],
  "valvarez@scu.edu": ["ch4","ch3","great","abuse","knicks","kerr","yell"],
  "cshim@scu.edu": ["ch4","ch3","great","knicks","abuse","mh","phones"],
  "emunn@scu.edu": ["ch4","ch3","abuse","pickup1","knicks","kerr","yell"],
  "lmurray@scu.edu": ["ch4","ch3","great","abuse","popovich","yell"],
  "ccoggins@scu.edu": ["ch4","ch3","knicks","marmol","abuse","kerr"],
  "jcingel@scu.edu": ["ch4","ch3","great","knicks","pickup1","mh","phones"],
  "sgtaylor@scu.edu": ["ch4","ch3","great","popovich","knicks","kerr","gladwell"],
  "dbarreto@scu.edu": ["ch4","ch3","popovich","great","knicks","kerr"],
  "lbaird@scu.edu": ["ch4","marmol","fans","knicks","kerr","gladwell"],
  "salvarenga@scu.edu": ["ch4","ch3","great","abuse","pickup1","meetings","yell"],
  "aegraham@scu.edu": ["ch4","ch3","great","popovich","marmol","kerr","gladwell"],
  "ckosinski@scu.edu": ["ch4","ch3","knicks","fans","great","kerr","gladwell"],
  "agomezardon@scu.edu": ["ch4","great","knicks","pickup1","rebuild"],
  "nnamburar@scu.edu": ["ch4","ch3","great","abuse","knicks","phones","rebuild"],
  "pbeaven@scu.edu": ["ch4","pickup1","abuse","great","meetings","yell"],
  "cshanahan@scu.edu": ["ch4","ch3","knicks","popovich","marmol","gladwell","crowd"],
};

const plan = await (await fetch(SUPABASE_URL + "/rest/v1/app_data?id=eq." + STORAGE_KEY + "-plan&select=data", { headers: H })).json();
const roster = (plan?.[0]?.data?.students || []).filter(s => s && s.email && !isLurker(s.name));
if (!roster.length) { console.error("No roster on " + STORAGE_KEY + "-plan."); process.exit(1); }
const students = { ...STUDENTS };
for (const s of roster) { const e = String(s.email).trim().toLowerCase(); if (!students[e]) students[e] = [...EVERYONE]; }
for (const [e, ids] of Object.entries(students)) for (const id of ids) if (!TITLES[id]) { console.error(e + " lists " + id + ", which has no title"); process.exit(1); }
const nameOf = new Map(roster.map(s => [String(s.email).trim().toLowerCase(), s.name]));
for (const [e, ids] of Object.entries(students)) console.log((nameOf.get(e) || e) + ": " + ids.map(id => TITLES[id].title).join("; "));
const data = { titles: TITLES, students, written: new Date().toISOString() };
if (!write) { console.log("\nNot written. Add --write."); process.exit(0); }
const r = await fetch(SUPABASE_URL + "/rest/v1/app_data?on_conflict=id", { method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify([{ id: ID, data }]) });
const out = await r.json().catch(() => null);
if (!r.ok || !Array.isArray(out) || !out.length) { console.error("Write failed: " + r.status + " " + JSON.stringify(out)); process.exit(1); }
console.log("Wrote " + ID + " for " + Object.keys(students).length + " students.");
