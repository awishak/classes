// The sample exhibit students look at before they build their own.
//
// Andrew, 2026-11-23, asked for a finished sample that Claude drafts and he
// rewrites: "let's use a diff example. timeouts as a form of reorientation."
// So every sentence here is a stand-in for his words. The photographs are
// real, from Wikimedia Commons, and each caption says only what the
// photographer's own description says. The academic sources are stand-ins and
// say so in their titles; the NBA rulebook is real.

const P = "/exhibits/sample/";
const at = 1;

// Filler, at Andrew's asking (2026-11-23): "can you literally put like lorem
// ipsum stuff in places." It shows how a full page reads without one more
// made-up sentence. Each is a paragraph; a [[source|link]] inside opens a source.
const L1 = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
const L2 = "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const L3 = "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.";
const L4 = "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.";
const L5 = "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.";
const L6 = "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.";
const SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const para = (...ps) => ps.join("\n\n");

export const SAMPLE = {
  id: "sample", cls: "comm118", sample: true, rev: 0, created: at, updated: at,
  way: "exhibit", type: "news", pal: "orange", layout: "pages", area: "",
  names: ["Sample Student", "Sample Partner"], term: "COMM 118, Fall 2026",
  headline: "What a Timeout Is For",
  summary: "A timeout stops the clock, but its real work is communication. In about a minute, a coach has to get five players to see the game the same way again. This exhibit looks at how that happens.",
  cover: { url: P + "cover.jpg", alt: "A women's basketball team stands in a tight circle on the court during a timeout, in a dark arena.", credit: "Drake huddles during a timeout at Williams Arena in Minneapolis, December 2, 2023. Photo: John McClellan, CC BY-SA 2.0" },
  interview: "", ai: "This sample was made with AI. Claude, an AI model, wrote every sentence, chose the photographs and laid out the pages, from a topic Dr. Ishak picked. The photographs are real and credited to the people who took them.", who: "",
  film: { url: "", captions: false }, html: { url: "", name: "" }, gone: {}, at: {}, pagesAt: at, sourcesAt: at,
  sources: [
    { id: "s1", at, kind: "academic", author: "Sample, A., & Author, B.", year: "2021", title: "Sample source: Talk in the huddle", outlet: "Sample Journal of Sport Communication, 14(2), 101-118", url: "", note: "This is where our definition of reorientation comes from." },
    { id: "s2", at, kind: "popular", author: "National Basketball Association", year: "2025", title: "Official rules of the NBA", outlet: "", url: "https://official.nba.com/rulebook/", note: "The rulebook sets how long a timeout lasts." },
    { id: "s3", at, kind: "popular", author: "Writer, C.", year: "2024", title: "Sample source: What coaches say in the last timeout", outlet: "Sample Sports Magazine", url: "", note: "Players in this story describe what they remember from a late timeout." },
    { id: "s4", at, kind: "academic", author: "Scholar, D.", year: "2019", title: "Sample source: Sensemaking under a running clock", outlet: "Sample Review of Organizational Communication, 8(1), 44-63", url: "", note: "It explains why groups lose a shared picture when things move fast." },
    { id: "s5", at, kind: "academic", author: "Lorem, I., & Dolor, S.", year: "2020", title: "Sample source: Lorem ipsum dolor sit amet", outlet: "Sample Journal of Lorem Ipsum, 22(3), 201-219", url: "", note: SHORT },
    { id: "s6", at, kind: "academic", author: "Consectetur, A.", year: "2018", title: "Sample source: Sed do eiusmod tempor incididunt", outlet: "Sample Quarterly of Lorem Ipsum, 9(4), 12-30", url: "", note: SHORT },
    { id: "s7", at, kind: "academic", author: "Adipiscing, E., Tempor, I., & Labore, U.", year: "2023", title: "Sample source: Ut enim ad minim veniam", outlet: "Sample Annals of Lorem Ipsum, 31(1), 77-95", url: "", note: SHORT },
    { id: "s8", at, kind: "popular", author: "Magna, A.", year: "2025", title: "Sample source: Quis nostrud exercitation ullamco", outlet: "Sample Daily Lorem", url: "", note: SHORT },
    { id: "s9", at, kind: "popular", author: "Aliqua, U.", year: "2022", title: "Sample source: Duis aute irure dolor", outlet: "Sample Ipsum Weekly", url: "", note: SHORT },
    { id: "s10", at, kind: "popular", author: "Veniam, Q.", year: "2024", title: "Sample source: Excepteur sint occaecat", outlet: "Sample Lorem Review", url: "", note: SHORT },
  ],
  pages: [
    { id: "p1", at, orderAt: at, name: "Start here", plan: "", blocks: [
      { id: "b11", at, t: "audio", url: P + "clip.m4a", title: "Listen first: what a point guard hears in a huddle", transcript: "This is a sample audio clip. In a real exhibit, this is where you would hear the point guard describe what she listens for in a huddle." },
      { id: "b12", at, t: "text", text: "Every sport with a clock gives teams a way to stop it. The rulebook treats a timeout as a pause. Coaches treat it as a meeting. [[s3|Players describe it]] as the moment the noise drops and one voice tells them what happens next.\n\nThis exhibit argues that a timeout is a form of **reorientation**. The team was pointed one way, the game changed, and the timeout turns everyone to face the same direction again." },
      { id: "b13", at, t: "photo", size: "full", url: P + "talk.jpg", alt: "A coach crouches in the middle of her players, who lean in around her on the sideline.", cap: "Australia's coach, Carrie Graf, talks to her team during a timeout against Russia at the London Olympics, August 3, 2012.", credit: "Photo: &DC, CC BY 2.0", mine: false },
      { id: "b14", at, t: "number", n: "75", w: "seconds in an NBA timeout", source: "s2" },
      { id: "b15", at, t: "text", text: "Seventy-five seconds is not long. The pages that follow look at what a team does with them: what gets said, who says it, and how a little over a minute changes what five people do next." },
      { id: "b16", at, t: "heading", text: "Lorem ipsum dolor sit amet" },
      { id: "b17", at, t: "text", text: para(L1, "Duis aute irure dolor in reprehenderit, [[s5|in voluptate velit esse cillum dolore]] eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", L3) },
      { id: "b18", at, t: "photo", size: "wrap", url: P + "bench.jpg", alt: "Players in red warmups sit on a bench with towels on their shoulders, watching the court.", cap: "Los Angeles Clippers players and assistant coach Robert Pack on the bench, January 17, 2011.", credit: "Photo: Alberto Cabello, CC BY 2.0", mine: false },
      { id: "b19", at, t: "text", text: para(L4, L5) },
      { id: "b1a", at, t: "quote", text: "“Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.”", who: "Lorem Ipsum, dolor sit amet" },
      { id: "b1d", at, t: "photo", size: "col", url: P + "bars.svg", alt: "A bar chart with five bars. Its labels are lorem ipsum.", cap: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", credit: "Chart by the makers", mine: true },
      { id: "b1b", at, t: "heading", text: "Consectetur adipiscing elit" },
      { id: "b1c", at, t: "text", text: para(L6, "Sed ut perspiciatis unde omnis iste natus error, [[s8|sit voluptatem accusantium doloremque]] laudantium, totam rem aperiam.", L2) },
    ] },
    { id: "p2", at, orderAt: at, name: "The idea", plan: "", blocks: [
      { id: "b21", at, t: "concept", name: "Reorientation", def: "The communication a group uses to rebuild a shared understanding of where it is and what to do next, after events have made the old understanding wrong.", source: "s1" },
      { id: "b22", at, t: "heading", text: "A real-life example" },
      { id: "b23", at, t: "photo", size: "wrap", url: P + "kneel.jpg", alt: "A coach in a white shirt kneels on the floor in front of his seated players, pointing as he talks.", cap: "Penn State's Patrick Chambers coaches his players on the bench during a game against Hartford, November 12, 2011.", credit: "Photo: Ben Stanfield, CC BY-SA 2.0", mine: false },
      { id: "b24", at, t: "text", text: "A team gives up three baskets in a row. Each player has a different idea of why. One thinks the defense is too slow. One thinks the other team got lucky. One has stopped thinking about defense at all.\n\nThe coach calls a timeout and says one thing: switch every screen. [[s4|Research on groups under time pressure]] says this is the point. The instruction matters less than the fact that all five now hold the same one." },
      { id: "b25", at, t: "quote", text: "“We are fine. Here is the next thirty seconds.”", who: "A sample line from a coach interview" },
      { id: "b26", at, t: "heading", text: "A hypothetical example" },
      { id: "b27", at, t: "text", text: "Picture the same game with no timeouts left. The coach shouts from the sideline and two players hear it. The other three keep playing the old plan. The team is now running two defenses at once, and neither one works." },
      { id: "b28", at, t: "text", text: para(L1, L2) },
      { id: "b29", at, t: "concept", name: "Lorem ipsum", def: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", source: "s6" },
      { id: "b2a", at, t: "heading", text: "A real-life example" },
      { id: "b2b", at, t: "text", text: para("Ut enim ad minim veniam, [[s9|quis nostrud exercitation ullamco laboris]] nisi ut aliquip ex ea commodo consequat.", L3, L4) },
      { id: "b2k", at, t: "photo", size: "col", url: P + "line.svg", alt: "A line chart with two lines. Its labels are lorem ipsum.", cap: "Sed do eiusmod tempor incididunt ut labore.", credit: "Chart by the makers", mine: true },
      { id: "b2c", at, t: "heading", text: "A hypothetical example" },
      { id: "b2l", at, t: "photo", size: "wrap", url: P + "scoreboard.jpg", alt: "A scoreboard glows red in a dark arena above empty blue seats.", cap: "The scoreboard before Fenerbahçe played Olimpia Milano, January 25, 2012.", credit: "Photo: David Jones, CC BY 2.0", mine: false },
      { id: "b2d", at, t: "text", text: para(L5, L6) },
      { id: "b2e", at, t: "concept", name: "Dolor sit amet", def: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.", source: "s7" },
      { id: "b2f", at, t: "heading", text: "A real-life example" },
      { id: "b2g", at, t: "photo", size: "full", url: P + "assistants.jpg", alt: "Three coaches in suits sit side by side on a bench, leaning forward.", cap: "The University of Richmond bench, February 9, 2013.", credit: "Photo: Rikster2, CC BY-SA 3.0", mine: false },
      { id: "b2h", at, t: "text", text: para(L2, "Nemo enim ipsam voluptatem, [[s7|quia voluptas sit aspernatur]] aut odit aut fugit, sed quia consequuntur magni dolores eos.") },
      { id: "b2i", at, t: "heading", text: "A hypothetical example" },
      { id: "b2j", at, t: "text", text: para(L1, L4) },
    ] },
    { id: "p3", at, orderAt: at, name: "One minute", plan: "", blocks: [
      { id: "b31", at, t: "text", text: "We timed one full timeout and wrote down what happened in it. The talking takes up less of the minute than we expected." },
      { id: "b32", at, t: "timeline", rows: [
        { when: "0:00", title: "The whistle", text: "Players walk to the bench. Nobody talks yet." },
        { when: "0:12", title: "Sit and drink", text: "Assistants hand out water and towels." },
        { when: "0:20", title: "The coach draws", text: "One play on the board, drawn once." },
        { when: "0:45", title: "A player says it back", text: "The point guard repeats the plan in her own words." },
        { when: "1:00", title: "Hands in", text: "One word together, then back on the floor." },
      ] },
      { id: "b33", at, t: "photo", size: "full", url: P + "above.jpg", alt: "Seen from the stands, a team in teal stands in a loose ring around a coach on a blue and yellow court.", cap: "Topex Robinson gives instructions to the Phoenix Super LPG Fuel Masters during a timeout, December 19, 2021.", credit: "Photo: dann_garcia, CC BY-SA 2.0", mine: false },
      { id: "b3b", at, t: "photo", size: "col", url: P + "minute.svg", alt: "A bar divided into four parts: walk over until 0:12, sit and drink until 0:20, the coach draws until 0:45, say it back until 1:00.", cap: "The same minute as one bar. The coach's drawing is the longest part.", credit: "Chart by the makers", mine: true },
      { id: "b34", at, t: "slider", a: P + "before.svg", aAlt: "A diagram of a half court with five defenders scattered out of position.", b: P + "after.svg", bAlt: "The same half court with each defender beside one attacker.", labelA: "Before", labelB: "After", cap: "Drag the handle. The same defense before the timeout and after.", credit: "Diagrams by the makers" },
      { id: "b35", at, t: "heading", text: "Lorem ipsum dolor sit amet" },
      { id: "b36", at, t: "text", text: para(L3, "At vero eos et accusamus, [[s10|et iusto odio dignissimos ducimus]] qui blanditiis praesentium voluptatum deleniti atque corrupti.", L6) },
      { id: "b37", at, t: "number", n: "00", w: "lorem ipsum dolor sit amet", source: "s8" },
      { id: "b38", at, t: "text", text: para(L1, L5) },
      { id: "b3c", at, t: "photo", size: "wrap", url: P + "wheelchair.jpg", alt: "Wheelchair basketball players in red lean toward a coach at the center of a huddle.", cap: "U.S. Marine wheelchair basketball coach Billy Demby huddles with his players during a timeout in Colorado Springs, May 11, 2010.", credit: "Photo: Sgt. 1st Class Michael J. Carden, U.S. Army, public domain", mine: false },
      { id: "b39", at, t: "quote", text: "“Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.”", who: "Lorem Ipsum, dolor sit amet" },
      { id: "b3a", at, t: "text", text: para(L2, L4) },
    ] },
    { id: "p4", at, orderAt: at, name: "Who talks", plan: "", blocks: [
      { id: "b41", at, t: "text", text: "A timeout looks like one person talking to a group. Watch closely and it is several short conversations happening in order." },
      { id: "b46", at, t: "text", text: para(L1, "Sed ut perspiciatis unde omnis, [[s6|iste natus error sit voluptatem]] accusantium doloremque laudantium.", L2) },
      { id: "b42", at, t: "gallery", items: [
        { url: P + "wheelchair.jpg", alt: "Wheelchair basketball players in red lean toward a coach at the center of a huddle.", cap: "U.S. Marine wheelchair basketball coach Billy Demby huddles with his players during a timeout in Colorado Springs, May 11, 2010.", credit: "Photo: Sgt. 1st Class Michael J. Carden, U.S. Army, public domain" },
        { url: P + "bench.jpg", alt: "Players in red warmups sit on a bench with towels on their shoulders, watching the court.", cap: "Los Angeles Clippers players and assistant coach Robert Pack on the bench, January 17, 2011.", credit: "Photo: Alberto Cabello, CC BY 2.0" },
        { url: P + "assistants.jpg", alt: "Three coaches in suits sit side by side on a bench, leaning forward.", cap: "The University of Richmond bench, February 9, 2013.", credit: "Photo: Rikster2, CC BY-SA 3.0" },
        { url: P + "scoreboard.jpg", alt: "A scoreboard glows red in a dark arena above empty blue seats.", cap: "The scoreboard before Fenerbahçe played Olimpia Milano, January 25, 2012.", credit: "Photo: David Jones, CC BY 2.0" },
      ] },
      { id: "b4b", at, t: "photo", size: "col", url: P + "huddle.svg", alt: "A diagram of a huddle: one filled circle in the middle with lines out to five circles around it. Its labels are lorem ipsum.", cap: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", credit: "Diagram by the makers", mine: true },
      { id: "b47", at, t: "heading", text: "Consectetur adipiscing elit" },
      { id: "b48", at, t: "text", text: para(L3, L5, L6) },
      { id: "b43", at, t: "quiz", q: "In this exhibit, what is a timeout mostly for?", options: ["Resting tired players", "Getting everyone to hold the same plan again", "Slowing down the other team"], right: 1, ans: "Rest and momentum are real, but our argument is about the shared plan." },
      { id: "b4c", at, t: "photo", size: "full", url: P + "kneel.jpg", alt: "A coach in a white shirt kneels on the floor in front of his seated players, pointing as he talks.", cap: "Penn State's Patrick Chambers coaches his players on the bench during a game against Hartford, November 12, 2011.", credit: "Photo: Ben Stanfield, CC BY-SA 2.0", mine: false },
      { id: "b49", at, t: "heading", text: "Sed do eiusmod tempor" },
      { id: "b4a", at, t: "text", text: para(L4, L1) },
      { id: "b44", at, t: "map", cap: "Where three of these photographs were taken.", pins: [
        { lat: 44.9778, lng: -93.228, name: "Williams Arena, Minneapolis", note: "The cover photograph." },
        { lat: 38.8403, lng: -104.796, name: "U.S. Olympic Training Center, Colorado Springs", note: "The wheelchair basketball huddle." },
        { lat: 51.5486, lng: -0.0139, name: "Olympic Park, London", note: "Australia against Russia, 2012." },
      ] },
      { id: "b45", at, t: "link", url: "https://official.nba.com/rulebook/", title: "Official rules of the NBA", sub: "official.nba.com" },
    ] },
  ],
};
