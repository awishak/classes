// A sample visual story, for students: /comm3/visual-story/sample.
//
// Andrew, 2026-10-15: students need to see how a finished story could look
// before they build one. The pictures are his own, from Melbourne in April
// 2025 (public/3x5), and the two graphics are in public/visual-story-sample.
// The words are Claude's placeholder, labelled as such on
// the page, so nobody reads the sample as the model for their writing.

import { useEffect } from "react";
import { StoryView, STORY_CSS } from "./story.jsx";
import * as TOKENS from "../tokens.js";
import TopNav, { NAV_STUDENT } from "../TopNav.jsx";
import { useStudentTheme, useDayNight, ThemeStyle } from "../ThemeShell.jsx";

const PIC = (n) => "/3x5/large/2025-04-australia-" + n + ".jpg";
const pic = (id, n, caption) => ({ id, type: "image", path: PIC(n), w: 5776, h: 4336, layout: "full", caption, graphic: false, source: "", by: "", reasons: [] });

const chart = (id, file, caption, source) => ({ id, type: "image", path: "/visual-story-sample/" + file, w: 1600, h: 1000, layout: "full", caption, graphic: true, source, by: "other", byName: "Made for this sample", reasons: [] });

// Andrew, 2026-10-15: the bottom three pictures came out, the story names the
// wait between trams and links its sources, and two graphics show the wait.
// Every fact here was checked against the page it links to.
const WALKER = "https://humantransit.org/2011/12/how-frequent-is-freedom.html";
export const SAMPLE_STORY = {
  headline: "In Melbourne, nobody checks the tram schedule",
  link: "",
  look: "light",
  feature: "a",
  blocks: [
    pic("a", "145", "Trams pass Flinders Street Station, in the middle of the city. Melbourne has the [most extensive tram system in the world](https://www.guinnessworldrecords.com/world-records/62650-most-extensive-tram-system), with about 250 kilometers of track."),
    pic("b", "068", "At a stop on Flinders Street, people cross from the sidewalk to a platform in the middle of the road. Inside the city center, the trams are [free to ride](https://www.ptv.vic.gov.au/more/travelling-on-the-network/free-tram-zone/). If one tram pulls away, people wait for the next one."),
    { id: "c", type: "text", text: "The time between one tram and the next is called the headway. When the headway is short enough, riders stop planning their day around a timetable and just walk to the stop. Transit planners call this turn-up-and-go service. The planner Jarrett Walker sums it up as [\"frequency is freedom,\"](" + WALKER + ") and he puts the line at about a tram or bus every 15 minutes, all day." },
    chart("d", "average-wait.svg", "A rider who arrives at a random time waits, on average, about half the headway. A tram every 5 minutes means a wait of about two and a half minutes. A bus every 30 minutes means about 15.", "Average wait taken as half the headway, a common rule of thumb in transit planning. Line at 15 minutes from [Jarrett Walker](" + WALKER + ")"),
    chart("e", "one-hour.svg", "Over one hour, a line that runs every 5 minutes brings 12 trams to the stop. A line that runs every 30 minutes brings 2.", "Arithmetic from the headway"),
    pic("f", "124", "Two trams pass each other while a cyclist rides between them. The City of Melbourne has committed to [50 kilometers of physically protected bike lanes](https://bicyclenetwork.com.au/newsroom/2019/10/22/bicycles-and-the-city-of-melbournes-2030-transport-strategy/), separated from car traffic, so people can feel comfortable riding a bike and catching a tram on the same trip."),
    pic("g", "157", "After dark, a passing tram leaves a streak of light outside Flinders Street Station."),
    { id: "h", type: "text", text: "What would it take for a bus line where you live to come often enough that nobody checks the schedule?" },
  ],
};
const URLS = Object.fromEntries(SAMPLE_STORY.blocks.filter(b => b.path).map(b => [b.path, b.path]));

export default function SampleStory({ config }) {
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  useEffect(() => { document.title = config.code + " · Sample visual story"; }, [config]);
  return (
    <div className="vsx" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      <style>{STORY_CSS + CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30, margin: "-28px -16px 20px" }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      <div className="vsx-in">
        <div className="vsx-banner">
          <b>This is a sample.</b> The writing is placeholder. It is here to show how a finished story could look, not how yours should read.
        </div>
        <a className="vsx-back" href={"/" + config.id + "/worksheets/visual-story"}>Back to your story</a>
        <div className="vss-solo vsx-story"><StoryView story={SAMPLE_STORY} urls={URLS} credit="Andrew Ishak" /></div>
      </div>
    </div>
  );
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.vsx{min-height:100vh;background:${S.page};color:${T.primary};font-family:${TOKENS.FONT.body};padding:28px 16px 80px}
.vsx-in{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.vsx-banner{padding:14px 18px;border-radius:14px;font-size:16px;line-height:1.5;background:${S.card};box-shadow:inset 4px 0 0 ${ST.warn},0 0 0 1px ${L.soft}}
.vsx-back{align-self:flex-start;font-size:15px;font-weight:600;color:${T.primary}}
.vsx-story{box-shadow:0 10px 40px -12px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.08)}
`;
