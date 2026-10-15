// A sample visual story, for students: /comm3/visual-story/sample.
//
// Andrew, 2026-10-15: students need to see how a finished story could look
// before they build one. The pictures are his own, from Melbourne in April
// 2025 (public/3x5). The words are Claude's placeholder, labelled as such on
// the page, so nobody reads the sample as the model for their writing.

import { useEffect } from "react";
import { StoryView, STORY_CSS } from "./story.jsx";
import * as TOKENS from "../tokens.js";
import TopNav, { NAV_STUDENT } from "../TopNav.jsx";
import { useStudentTheme, useDayNight, ThemeStyle } from "../ThemeShell.jsx";

const PIC = (n) => "/3x5/large/2025-04-australia-" + n + ".jpg";
const pic = (id, n, caption) => ({ id, type: "image", path: PIC(n), w: 5776, h: 4336, layout: "full", caption, graphic: false, source: "", by: "", reasons: [] });

export const SAMPLE_STORY = {
  headline: "In Melbourne, nobody checks the tram schedule",
  link: "",
  look: "light",
  feature: "a",
  blocks: [
    pic("a", "145", "Trams pass Flinders Street Station from morning until late at night, on lines that cross the middle of the city. Most riders walk to the stop without opening an app first."),
    pic("b", "068", "At a stop on Flinders Street, people cross straight from the sidewalk to a platform in the middle of the road. If one tram pulls away, they wait for the next one."),
    { id: "c", type: "text", text: "Transit planners call this turn-up-and-go service: a line that runs often enough that riders stop planning their day around the timetable. The planner Jarrett Walker sums it up as \"frequency is freedom.\" When the wait is short, nobody needs the timetable." },
    pic("d", "124", "Two trams pass each other while a cyclist rides between them. Melbourne's tram network is one of the largest in the world, and in the city center the trams run close behind one another."),
    pic("e", "103", "After dark the trams keep moving through the city. Painted warnings on the road tell drivers and people on foot to watch for them."),
    pic("f", "130", "Riders board outside the Melbourne Exhibition Centre. A stop at the door of a big venue lets a crowd leave by tram instead of by car."),
    pic("g", "142", "A tram carries an ad for Formula 1, with two of its drivers painted along the side. A tram that passes this often works as a moving billboard."),
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
