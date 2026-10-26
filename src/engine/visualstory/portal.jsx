// The visual story portal: /comm3/visual-story.
//
// Andrew, 2026-10-23, from out of town: "there should be one place students
// are going for this ... a visual story portal ... until Sunday is submitting
// your project. On Monday, it's viewing other people's projects, and on
// Tuesday, it's see people's comments about your work." And: "make it easy
// for students to figure out how to go from part to part."
//
// So one page with the three parts in order, the part for today filled in
// and big, the others a line each with their day and a link. Which part is
// today's comes from the student's section stage (api/visual-story.js):
// building is part one, reading is part two, closed and released are part
// three. Part three lives on this page: the comments on the student's own
// story, by reviewer or by question, once the names are out.
//
// The same three parts sit in a strip at the top of every part's page
// (PortalBar), so a student on the builder or the stories page can see where
// they are and get to the other two.

import { useEffect, useState } from "react";
import { useSession, authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { useCopy, Words } from "./pre.jsx";
import { useStoriesStage, storiesHref } from "./door.jsx";
import { VISUAL_STORY_KEY } from "./story.jsx";
import * as TOKENS from "../tokens.js";
import TopNav, { NAV_STUDENT } from "../TopNav.jsx";
import { useStudentTheme, useDayNight, ThemeStyle } from "../ThemeShell.jsx";

export const portalHref = (config) => "/" + (config.id || config) + "/visual-story";
export const builderHref = (config) => "/" + (config.id || config) + "/worksheets/" + VISUAL_STORY_KEY;
export const instructionsHref = (config) => "/" + (config.id || config) + "/visual-story/instructions";

// The three parts, in the order a student meets them.
export const PARTS = [
  { id: "submit", n: 1, href: builderHref },
  { id: "read", n: 2, href: storiesHref },
  { id: "comments", n: 3, href: (c) => portalHref(c) + "#comments" },
];

// Which part is today's, from the section's stage. No stage (not signed in,
// or the request failed) reads as part one, which is the safe guess before
// Monday and a harmless one after.
export const partOf = (stage) => (stage === "released" || stage === "closed" ? "comments" : stage === "reading" ? "read" : "submit");

// The words students read, Andrew's to edit in place. The sentences in the
// done card and the part lines are his from October 23, with the joins written in.
export const PORTAL_COPY_ROW = "visual-story-portal-plan";
export const PORTAL_COPY = {
  title: "Visual story portal",
  lead: "Everything for your visual story, in order. The part for today is filled in. The other parts are a tap away.",
  "part.submit.name": "Build and submit your story",
  "part.submit.when": "Due Sunday, October 25, at 11:59 PM",
  "part.submit.now": "Build your story on the class site and press Submit. Your work saves as you go, and you can keep editing until the due date.",
  "part.submit.go": "Work on your story",
  "part.read.name": "Read and comment on your classmates' stories",
  "part.read.when": "Monday, October 26",
  "part.read.now": "We don't have class on Monday. Your goal is to view and comment on at least 8 other students' stories: the 4 outlined in red, then at least 4 more of your choosing.",
  "part.read.go": "Open the stories",
  "part.comments.name": "See what your classmates said about your story",
  "part.comments.when": "Tuesday, October 27, after noon",
  "part.comments.now": "Your classmates' comments on your story, with their names attached. Read them by reviewer or by question.",
  "part.comments.wait": "The comments come out on Tuesday, October 27, after noon. Check back then to see what people think of your work.",
  "part.comments.go": "Read the comments",
  "ask.best": "The best image, and why",
  "ask.shone": "One way this story shone",
  "ask.encourage": "One thing you would encourage the author to do",
  more: "More for your story",
};
const QUESTIONS = ["best", "shone", "encourage"];
const DONE = { submit: "Done", read: "Done", comments: "" };

const api = async (config, body) => {
  const r = await fetch("/api/visual-story", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), groupKey: config.id, ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};

export default function VisualStoryPortal({ config }) {
  const { session, instructor } = useSession();
  const editor = !!(session && instructor);
  const copy = useCopy(editor, PORTAL_COPY_ROW, PORTAL_COPY);
  const [editing, setEditing] = useState(false);
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const as = search.get("as") || "";
  const stage = useStoriesStage(config, as);
  const here = partOf(stage);
  useEffect(() => { document.title = config.code + " · Visual story portal"; }, [config]);

  const state = (id) => {
    const order = PARTS.findIndex(p => p.id === id), now = PARTS.findIndex(p => p.id === here);
    return order < now ? "done" : order === now ? "now" : "later";
  };
  const withAs = (href) => (as ? href + (href.includes("?") ? "&" : "?") + "as=" + encodeURIComponent(as) : href);

  return (
    <div className="vpo" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      <div className="vpo-in">
        <Words k="title" copy={copy} editing={editing} as="h1" className="vpo-title" />
        {editor ? (
          <div className="vpo-row">
            <button type="button" className="vpo-btn" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
            {copy.status ? <span className="vpo-muted" aria-live="polite">{copy.status}</span> : null}
            <a className="vpo-link" href={"/" + config.id + "/reviews"}>Who reviewed what</a>
            <a className="vpo-link" href={builderHref(config) + "?review"}>Every story</a>
          </div>
        ) : null}
        <Words k="lead" copy={copy} editing={editing} as="p" className="vpo-lead" />

        {!session && !savedPin() ? (
          <p className="vpo-p">Sign in to see where you are. <a className="vpo-link" href={"/login?next=" + encodeURIComponent(window.location.pathname)}>Sign in</a></p>
        ) : null}

        {/* Today's part, big and filled in. */}
        {PARTS.filter(p => p.id === here).map(p => (
          <section key={p.id} className="vpo-now" aria-label={"Part " + p.n + ", for today"}>
            <span className="vpo-now-eyebrow">Part {p.n} of 3 · Now</span>
            <Words k={"part." + p.id + ".name"} copy={copy} editing={editing} as="h2" className="vpo-now-h" />
            <Words k={"part." + p.id + ".when"} copy={copy} editing={editing} as="p" className="vpo-now-when" />
            <Words k={"part." + p.id + (p.id === "comments" && stage !== "released" ? ".wait" : ".now")} copy={copy} editing={editing} as="p" className="vpo-now-p" />
            {p.id === "comments" ? null : <a className="vpo-go" href={withAs(p.href(config))}><Words k={"part." + p.id + ".go"} copy={copy} editing={editing} /></a>}
          </section>
        ))}

        {/* All three, in order. */}
        <ol className="vpo-parts">
          {PARTS.map(p => {
            const st = state(p.id);
            return (
              <li key={p.id} className={"vpo-part vpo-part-" + st}>
                <span className="vpo-n" aria-hidden="true">{p.n}</span>
                <span className="vpo-part-main">
                  <Words k={"part." + p.id + ".name"} copy={copy} editing={editing} as="span" className="vpo-part-name" />
                  <Words k={"part." + p.id + ".when"} copy={copy} editing={editing} as="span" className="vpo-part-when" />
                </span>
                <span className="vpo-part-side">
                  {st === "done" && DONE[p.id] ? <span className="vpo-chip vpo-chip-done">✓ {DONE[p.id]}</span> : null}
                  {st === "now" ? <span className="vpo-chip vpo-chip-now">Now</span> : null}
                  {p.id === "comments" && st !== "now" ? <span className="vpo-chip">Tuesday</span> : <a className="vpo-open" href={withAs(p.href(config))}>Open</a>}
                </span>
              </li>
            );
          })}
        </ol>

        {here === "comments" && stage === "released" ? <MyComments config={config} as={as} copy={copy} /> : null}

        <section className="vpo-more" aria-label={copy.say("more")}>
          <Words k="more" copy={copy} editing={editing} as="h2" className="vpo-h2" />
          <div className="vpo-row">
            <a className="vpo-link" href={instructionsHref(config)}>Full instructions</a>
            <a className="vpo-link" href={"/" + config.id + "/visual-story/sample"}>A sample story</a>
            <a className="vpo-link" href={"/" + config.id + "/worksheets/visual-pre"}>Your pre-production page</a>
          </div>
        </section>
      </div>
    </div>
  );
}

// Part three: the comments on the student's own story, by reviewer or by
// question. Andrew, 2026-10-23: "arrange it nicely ... let them view it by
// reviewer or by question, because we have a couple questions, and they're
// gonna have at least 4 reviewers, hopefully something like seven, 8, or 9."
export function MyComments({ config, as, copy }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [by, setBy] = useState("reviewer");
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await api(config, { action: "list", as });
        const mine = (list.stories || []).find(t => t.mine);
        if (!mine) { if (alive) setData({ none: true }); return; }
        const story = await api(config, { action: "story", id: mine.id, as });
        if (alive) setData({ ...story, id: mine.id });
      } catch (e) { if (alive) setError(e.message); }
    })();
    return () => { alive = false; };
  }, [config, as]);
  if (error) return <p className="vpo-p" id="comments">{error}</p>;
  if (!data) return <p className="vpo-p" id="comments">Loading your comments.</p>;
  if (data.none) return <p className="vpo-p" id="comments">You have no submitted story in this class, so there are no comments to show.</p>;
  const comments = (data.comments || []).filter(c => c.author !== "You");
  const images = (data.story?.blocks || []).filter(b => b.type === "image");
  const picOf = (c) => { const n = images.findIndex(b => b.id === c.bestImage); return n >= 0 ? { n: n + 1, url: images[n].url } : null; };
  return (
    <section className="vpo-comments" id="comments" aria-label="What your classmates said">
      <div className="vpo-row vpo-row-head">
        <h2 className="vpo-h2">What your classmates said</h2>
        <span className="vpo-muted">{comments.length === 1 ? "1 reviewer" : comments.length + " reviewers"}</span>
        <a className="vpo-link" href={storiesHref(config) + "?s=" + encodeURIComponent(data.id) + (as ? "&as=" + encodeURIComponent(as) : "")}>Open my story</a>
      </div>
      {!comments.length ? <p className="vpo-p">Nobody has commented on your story yet.</p> : (
        <>
          <div className="vpo-seg" role="tablist" aria-label="Arrange the comments">
            <button type="button" role="tab" aria-selected={by === "reviewer"} className="vpo-segbtn" onClick={() => setBy("reviewer")}>By reviewer</button>
            <button type="button" role="tab" aria-selected={by === "question"} className="vpo-segbtn" onClick={() => setBy("question")}>By question</button>
          </div>
          {by === "reviewer" ? comments.map((c, i) => (
            <article key={i} className="vpo-card">
              <h3 className="vpo-who">{c.author}</h3>
              {QUESTIONS.map(q => <Answer key={q} q={q} c={c} copy={copy} pic={q === "best" ? picOf(c) : null} />)}
            </article>
          )) : QUESTIONS.map(q => (
            <article key={q} className="vpo-card">
              <h3 className="vpo-who">{copy.say("ask." + q)}</h3>
              {comments.map((c, i) => (
                <div key={i} className="vpo-ans">
                  <span className="vpo-ans-k">{c.author}</span>
                  {q === "best" ? <Pick pic={picOf(c)} where={c.bestWhere} /> : null}
                  <p className="vpo-ans-p">{c[q]}</p>
                </div>
              ))}
            </article>
          ))}
        </>
      )}
    </section>
  );
}

function Answer({ q, c, copy, pic }) {
  return (
    <div className="vpo-ans">
      <span className="vpo-ans-k">{copy.say("ask." + q)}</span>
      {q === "best" ? <Pick pic={pic} where={c.bestWhere} /> : null}
      <p className="vpo-ans-p">{c[q]}</p>
    </div>
  );
}
function Pick({ pic, where }) {
  if (pic) return <span className="vpo-pick">{pic.url ? <img src={pic.url} alt={"Picture " + pic.n} /> : null}<span>Picture {pic.n}</span></span>;
  if (where) return <span className="vpo-pick"><span>{where}</span></span>;
  return null;
}

// The strip at the top of every part's page: the three parts, the one this
// page is marked, the others as links. `here` names this page's part.
export function PortalBar({ config, here, as = "" }) {
  const stage = useStoriesStage(config, as);
  const today = partOf(stage);
  const withAs = (href) => (as ? href + (href.includes("?") ? "&" : "?") + "as=" + encodeURIComponent(as) : href);
  const names = { submit: "Submit your story", read: "Read and comment", comments: "Your comments" };
  return (
    <nav className="vpb" aria-label="Visual story portal">
      <style>{BAR_CSS}</style>
      <a className="vpb-home" href={withAs(portalHref(config))}>Visual story portal</a>
      <ol className="vpb-parts">
        {PARTS.map(p => {
          const isHere = p.id === here, isToday = p.id === today;
          const cls = "vpb-part" + (isHere ? " vpb-here" : "") + (isToday ? " vpb-today" : "");
          const inner = <><span className="vpb-n">{p.n}</span><span>{names[p.id]}</span>{isToday && !isHere ? <span className="vpb-now">now</span> : null}</>;
          return <li key={p.id}>{isHere ? <span className={cls} aria-current="page">{inner}</span> : <a className={cls} href={withAs(p.href(config))}>{inner}</a>}</li>;
        })}
      </ol>
    </nav>
  );
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;
const SERIF = "'Lora', 'Iowan Old Style', Charter, Georgia, serif";
// Bright green, the colour Andrew asked for on Monday's link. White on
// #15803d clears 5:1; #15803d on the page clears 4.5:1 on both themes' cards.
export const GO_GREEN = "#15803d";
const CSS = `
.vpo{min-height:100vh;background:${S.page};color:${T.primary};font-family:${TOKENS.FONT.body}}
.vpo-in{max-width:760px;margin:0 auto;padding:24px 16px 90px;display:flex;flex-direction:column;gap:18px}
.vpo-title{margin:0;font-family:${SERIF};font-size:38px;font-weight:600;letter-spacing:-.015em}
.vpo-lead{margin:0;font-size:17.5px;line-height:1.55;color:${T.secondary}}
.vpo-p{margin:0;font-size:16.5px;line-height:1.55;color:${T.secondary}}
.vpo-muted{margin:0;font-size:14.5px;color:${T.muted}}
.vpo-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.vpo-row-head{justify-content:flex-start}
.vpo-link{font-size:16px;font-weight:600;color:${T.primary};text-underline-offset:3px}
.vpo-btn{font:inherit;font-size:14px;font-weight:600;padding:7px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer;min-height:36px}
.vpo-btn[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vpo-now{display:flex;flex-direction:column;gap:8px;padding:22px;border-radius:18px;background:${GO_GREEN};color:#fff;box-shadow:0 14px 36px -18px rgba(21,128,61,.7)}
.vpo-now-eyebrow{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.92}
.vpo-now-h{margin:0;font-family:${SERIF};font-size:28px;font-weight:600;line-height:1.2}
.vpo-now-when{margin:0;font-size:16px;font-weight:600}
.vpo-now-p{margin:0;font-size:16.5px;line-height:1.55}
.vpo-go{align-self:flex-start;margin-top:6px;font-size:17px;font-weight:700;padding:13px 24px;border-radius:999px;background:#fff;color:${GO_GREEN};text-decoration:none;min-height:48px;display:inline-flex;align-items:center}
.vpo-go:hover{filter:brightness(.96)}
.vpo-parts{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.vpo-part{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.vpo-part-now{box-shadow:0 0 0 2px ${GO_GREEN}}
.vpo-part-later{opacity:.82}
.vpo-n{flex:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:${S.sunk};color:${T.primary};font-weight:700;font-size:16px}
.vpo-part-now .vpo-n{background:${GO_GREEN};color:#fff}
.vpo-part-done .vpo-n{background:${T.primary};color:${S.page}}
.vpo-part-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.vpo-part-name{font-size:17px;font-weight:600;line-height:1.3}
.vpo-part-when{font-size:14.5px;color:${T.muted}}
.vpo-part-side{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.vpo-chip{font-size:13px;font-weight:700;border-radius:999px;padding:4px 10px;border:1px solid ${L.strong};color:${T.secondary}}
.vpo-chip-done{background:${T.primary};border-color:${T.primary};color:${S.page}}
.vpo-chip-now{background:${GO_GREEN};border-color:${GO_GREEN};color:#fff}
.vpo-open{font-size:15px;font-weight:700;color:${T.primary};text-decoration:none;padding:8px 14px;border-radius:999px;border:1px solid ${L.strong};min-height:40px;display:inline-flex;align-items:center}
.vpo-h2{margin:0;font-size:22px;font-weight:700}
.vpo-more{display:flex;flex-direction:column;gap:10px;border-top:1px solid ${L.soft};padding-top:18px}
.vpo-comments{display:flex;flex-direction:column;gap:12px;border-top:1px solid ${L.soft};padding-top:18px}
.vpo-seg{display:inline-flex;gap:2px;background:${S.sunk};border-radius:12px;padding:3px;align-self:flex-start}
.vpo-segbtn{font:inherit;font-size:15px;font-weight:600;border:0;background:transparent;color:${T.secondary};border-radius:10px;min-height:38px;padding:0 16px;cursor:pointer}
.vpo-segbtn[aria-selected="true"]{background:${S.card};color:${T.primary};box-shadow:0 1px 2px rgba(28,25,23,.12)}
.vpo-card{display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:14px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.vpo-who{margin:0;font-size:17px;font-weight:700}
.vpo-ans{display:flex;flex-direction:column;gap:4px;padding:8px 0;border-top:1px solid ${L.soft}}
.vpo-ans-k{font-size:13px;font-weight:700;color:${T.muted}}
.vpo-ans-p{margin:0;font-size:16px;line-height:1.5;white-space:pre-wrap}
.vpo-pick{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:${T.secondary}}
.vpo-pick img{width:56px;height:56px;object-fit:cover;border-radius:6px;display:block}
.vpo a:focus-visible,.vpo button:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.45;padding:4px 8px;margin:0;border:1.5px dashed ${L.strong};border-radius:8px;background:${S.card};resize:none;overflow:hidden}
.vpo-now .vsp-edit{color:${T.primary}}
@media (max-width:640px){ .vpo-title{font-size:30px} .vpo-now-h{font-size:24px} .vpo-part{flex-wrap:wrap} .vpo-part-side{width:100%;justify-content:flex-start;padding-left:48px} }
`;
const BAR_CSS = `
.vpb{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;background:${S.card};box-shadow:0 0 0 1px ${L.soft};font-family:${TOKENS.FONT.body}}
.vpb-home{font-size:15px;font-weight:700;color:${T.primary};text-decoration:none;min-height:36px;display:inline-flex;align-items:center}
.vpb-home:hover{text-decoration:underline;text-underline-offset:3px}
.vpb-parts{list-style:none;margin:0;padding:0;display:flex;gap:6px;flex-wrap:wrap}
.vpb-part{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:${T.secondary};text-decoration:none;padding:0 12px 0 6px;min-height:36px;border-radius:999px;border:1px solid ${L.strong};background:${S.card}}
a.vpb-part:hover{border-color:${T.primary};color:${T.primary}}
.vpb-here{background:${T.primary};border-color:${T.primary};color:${S.page}}
.vpb-today:not(.vpb-here){border-color:${GO_GREEN};color:${GO_GREEN}}
.vpb-n{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:${S.sunk};color:${T.primary};font-size:13px;font-weight:700}
.vpb-here .vpb-n{background:rgba(255,255,255,.22);color:${S.page}}
.vpb-today:not(.vpb-here) .vpb-n{background:${GO_GREEN};color:#fff}
.vpb-now{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${GO_GREEN}}
.vpb a:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
@media (max-width:640px){ .vpb-part span:not(.vpb-n):not(.vpb-now){font-size:13px} }
`;
