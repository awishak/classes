// The browser half of the visual story grade view: Claude's draft grades in a
// panel above each student's story, on one page. The story is drawn by the
// site's own StoryView with the site's own styles, so it looks exactly as the
// student made it. Bundled by comm3-visual-grade-view.mjs; reads window.VS,
// which that script writes beside the page. Local only.
//
// Andrew, 2026-11-10: "i need your draft of grades in a panel ABOVE their
// story. same page."

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { StoryView, STORY_CSS } from "../src/engine/visualstory/story.jsx";
import * as TOKENS from "../src/engine/tokens.js";

const P = window.VS || [];
const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;

function Part({ x }) {
  return (
    <div className="gv-part">
      <div className="gv-ph"><span className="gv-pl">{x.label}</span><span className="gv-lt">{x.letter}</span>{x.yours ? <span className="gv-nr">your letter</span> : null}{x.near ? <span className="gv-nr">close to the next letter up</span> : null}</div>
      {x.plus ? <p>{x.plus}</p> : null}
      {x.enc ? <p>{x.enc}</p> : null}
      {x.off ? <p><b>What's off:</b> {x.off}</p> : null}
      {x.counted ? <p><b>Counted:</b> {x.counted}</p> : null}
    </div>
  );
}

// A story made as an HTML file: the site's headline and frame, pointed at the
// copy of the student's file on this machine.
function HtmlStory({ p }) {
  return (
    <article className={"vsr vsr-" + (p.story.look === "dark" ? "dark" : "light")}>
      <h1 className="vsr-h">{p.story.headline}</h1>
      <iframe className="vsr-frame" src={p.htmlSrc} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" title={p.story.headline || "The story"} />
    </article>
  );
}

function App() {
  const start = () => { try { const i = P.findIndex(p => p.id === localStorage.getItem("vs-at")); return i >= 0 ? i : 0; } catch { return 0; } };
  const [at, setAt] = useState(start);
  const p = P[at];
  const move = (d) => setAt(i => Math.max(0, Math.min(P.length - 1, i + d)));
  useEffect(() => {
    const on = (e) => { if (e.target.tagName === "SELECT") return; if (e.key === "ArrowRight") move(1); if (e.key === "ArrowLeft") move(-1); };
    document.addEventListener("keydown", on);
    return () => document.removeEventListener("keydown", on);
  }, []);
  useEffect(() => { try { localStorage.setItem("vs-at", p.id); } catch { /* the page still works */ } window.scrollTo(0, 0); document.title = p.name + " · Visual story grades"; }, [p]);
  const groups = [...new Set(P.map(x => x.overall))];
  return (
    <div className="gv">
      <style>{STORY_CSS}</style>
      <style>{CSS}</style>
      <div className="gv-bar">
        <button type="button" onClick={() => move(-1)} disabled={at === 0}>Back</button>
        <select aria-label="Student" value={at} onChange={e => setAt(Number(e.target.value))}>
          {groups.map(g => <optgroup key={g} label={/^[A-D]/.test(g) ? "Overall " + g : g}>{P.map((x, i) => (x.overall === g ? <option key={x.id} value={i}>{x.name}</option> : null))}</optgroup>)}
        </select>
        <button type="button" onClick={() => move(1)} disabled={at === P.length - 1}>Next</button>
        <span className="gv-count">{p.section}, {at + 1} of {P.length}</span>
      </div>
      <div className="gv-in">
        <section className="gv-panel" aria-label="Claude's draft grades">
          <div className="gv-top"><h1>{p.name}</h1><span className="gv-ov">{p.overall}<span className="gv-who">{p.ruled ? "your grade" : "Claude's, you have not ruled"}</span></span></div>
          {p.note ? <p className="gv-note"><b>Under the grade, to the student:</b> {p.note}</p> : null}
          {p.flag ? <p className="gv-flag"><b>For you:</b> {p.flag}</p> : null}
          <p className="gv-facts">Claude's draft. {p.facts}{p.best ? " Classmates' best: " + p.best + "." : ""}</p>
          <div className="gv-parts">{p.parts.map(x => <Part key={x.label} x={x} />)}</div>
          <div className="gv-pre">
            <div className="gv-ph"><span className="gv-pl">Pre-production to final</span>{p.pre.kept ? <span className="gv-kept">{p.pre.kept}</span> : null}</div>
            {p.pre.none ? <p>{p.pre.say}</p> : (
              <>
                <p><b>{p.pre.review}.</b> {p.pre.when}. Type: {p.pre.type}.</p>
                {p.pre.say ? <p>{p.pre.say}</p> : null}
                <details>
                  <summary>What they pitched</summary>
                  {p.pre.headline ? <p><b>Headline:</b> {p.pre.headline}</p> : null}
                  {p.pre.topic ? <p><b>Topic:</b> {p.pre.topic}</p> : null}
                  {p.pre.learn ? <p><b>What readers should learn:</b> {p.pre.learn}</p> : null}
                </details>
              </>
            )}
          </div>
        </section>
        {p.story ? (
          <div className={"vrd-story vrd-look-" + (p.story.look || "light")}>
            {p.htmlSrc ? <HtmlStory p={p} /> : <StoryView key={p.id} story={p.story} urls={p.urls} credit={p.name} />}
          </div>
        ) : <p className="gv-none">No story to show.</p>}
      </div>
    </div>
  );
}

// The three .vrd rules are the story's frame on /comm3/stories (reading.jsx), copied so the frame matches.
const CSS = `
:root{--text-primary:#1c1917;--text-secondary:#57534e;--text-muted:#6b655f;--line-soft:#f0edea;--line-strong:#e3ded8;--surface-page:#fafaf9;--surface-card:#ffffff;--surface-sunk:#f6f4f1}
body{margin:0}
.gv{min-height:100vh;background:${S.page};color:${T.primary};font-family:${TOKENS.FONT.body}}
.gv-bar{position:sticky;top:0;z-index:30;background:${S.card};border-bottom:1px solid ${L.strong};padding:8px 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.gv-bar button,.gv-bar select{font:inherit;font-size:16px;min-height:34px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};border-radius:12px;padding:4px 12px;cursor:pointer}
.gv-bar button:disabled{color:${T.muted};cursor:default}
.gv-bar button:focus-visible,.gv-bar select:focus-visible{outline:2px solid ${T.primary};outline-offset:2px}
.gv-count{font-size:15px;color:${T.muted}}
.gv-in{max-width:1240px;margin:0 auto;padding:16px 16px 96px;display:flex;flex-direction:column;gap:24px}
.gv-panel{background:${S.card};border:1px solid ${L.strong};border-radius:16px;padding:16px 24px 24px}
.gv-top{display:flex;align-items:baseline;justify-content:space-between;gap:16px}
.gv-top h1{font-size:26px;margin:0}
.gv-ov{font-size:26px;font-weight:700;white-space:nowrap;display:flex;align-items:baseline;gap:8px}
.gv-who{font-size:13px;font-weight:400;color:${T.muted}}
.gv-note,.gv-flag{font-size:15px;line-height:1.5;margin:8px 0 0;padding:8px 12px;border-radius:8px;background:${S.sunk}}
.gv-flag{border:1px solid ${L.strong};background:${S.card}}
.gv-facts{font-size:15px;color:${T.muted};margin:4px 0 12px}
.gv-parts{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.gv-part{background:${S.sunk};border-radius:12px;padding:12px 16px}
.gv-ph{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.gv-pl{font-size:15px;font-weight:600;color:${T.secondary}}
.gv-lt{font-size:26px;font-weight:700}
.gv-nr{font-size:13px;color:${T.muted}}
.gv-part p{margin:8px 0 0;font-size:15px;line-height:1.5}
.gv-pre{background:${S.sunk};border-radius:12px;padding:12px 16px;margin:12px 0 0}
.gv-pre p{margin:8px 0 0;font-size:15px;line-height:1.5}
.gv-kept{font-size:20px;font-weight:700}
.gv-pre summary{font-size:15px;font-weight:600;color:${T.secondary};cursor:pointer;margin:8px 0 0;min-height:34px;display:flex;align-items:center}
.gv-none{font-size:17px;color:${T.secondary}}
.vrd-look-light{background:#fff;color:#141414}
.vrd-look-dark{background:#0b0b0c;color:#f2f1ee}
.vrd-story{border-radius:16px;overflow:hidden;box-shadow:0 10px 40px -12px rgba(0,0,0,.35);max-width:860px;width:100%;align-self:center}
@media (max-width:1000px){.gv-parts{grid-template-columns:1fr 1fr}}
@media (max-width:600px){.gv-parts{grid-template-columns:1fr}}
`;

createRoot(document.getElementById("root")).render(<App />);
