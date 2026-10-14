// Classmates' stories, for students: /comm3/stories.
//
// Planned with Andrew on 2026-10-13. A grid of the section's stories with no
// names, the four pod stories marked Required reading in red, the student's
// own marked My story, and a green check on every story they have commented
// on. Each story opens on its own white or black page with three comment
// boxes. Everything comes through /api/visual-story, which decides what a
// student may see; this page only shows it.
//
// Andrew, 2026-10-13, on how it looks: "a grid of stories, maybe 6 across on
// laptop, 2 across on phone, and the 4 stories they have to read have a red
// box around them with a required reading chip ... when they read and
// comment, a story gets a green box and a checkmark."

import { useEffect, useState } from "react";
import { useSession, authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { useCopy, Words } from "./pre.jsx";
import { StoryView, STORY_CSS } from "./story.jsx";
import * as TOKENS from "../tokens.js";
import TopNav, { NAV_STUDENT } from "../TopNav.jsx";
import { useStudentTheme, useDayNight, ThemeStyle } from "../ThemeShell.jsx";

export const READING_COPY_ROW = "worksheet-stories-plan";
export const READING_COPY = {
  title: "Classmates' stories",
  building: "The stories open on Monday, October 26. Come back then!",
  reading: "Read the four stories marked Required reading first. Then pick four more that look interesting. On each story, leave three comments. Save your own story for last.",
  closed: "Comments are closed. Names come out in class on Wednesday, October 28.",
  released: "The names are out! Open your own story to read what your classmates said.",
  prompt: "Please make sure your comments are substantial. A well-crafted sentence is acceptable, and longer than that is also okay.",
  "ask.best": "The best image, and why",
  "ask.shone": "One way this story shone",
  "ask.encourage": "One thing you would encourage the author to do",
};
const FIELDS = ["best", "shone", "encourage"];
const MIN_CHARS = 50;                                 // the server checks the same number
const EMPTY = { bestImage: "", best: "", shone: "", encourage: "" };
const charsSay = (n) => (n >= MIN_CHARS ? n + " characters. Long enough!" : n + " characters. Write at least " + MIN_CHARS + ".");

const api = async (config, body) => {
  const r = await fetch("/api/visual-story", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), groupKey: config.id, ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) { const e = new Error(out?.error || "The server did not answer."); e.out = out; throw e; }
  return out;
};
const draftKey = (config, as, id) => "story-comment:" + config.id + ":" + (as || "") + ":" + id;
const readDraft = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const writeDraft = (k, v) => { try { if (v) localStorage.setItem(k, JSON.stringify(v)); else localStorage.removeItem(k); } catch { /* the server copy still goes */ } };

export default function ClassmatesStories({ config }) {
  const { session, instructor } = useSession();
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const as = search.get("as") || "";
  const [open, setOpen] = useState(search.get("s") || "");
  const copy = useCopy(!!(session && instructor), READING_COPY_ROW, READING_COPY);
  const [editing, setEditing] = useState(false);
  useEffect(() => { document.title = config.code + " · Classmates' stories"; }, [config]);
  useEffect(() => {
    const on = () => setOpen(new URLSearchParams(window.location.search).get("s") || "");
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  const go = (id) => {
    const q = new URLSearchParams(window.location.search);
    if (id) q.set("s", id); else q.delete("s");
    window.history.pushState({}, "", window.location.pathname + (q.toString() ? "?" + q.toString() : ""));
    setOpen(id);
    window.scrollTo(0, 0);
  };

  let body;
  if (!session && !savedPin()) body = <p className="vrd-p">Sign in to read your classmates' stories. <a className="vrd-link" href={"/login?next=" + encodeURIComponent(window.location.pathname)}>Sign in</a></p>;
  else if ((instructor || savedPin()) && !as && config.id !== "comm999") body = <p className="vrd-p">This is the students' page. Your view of every story, with names, is on <a className="vrd-link" href={"/" + config.id + "/worksheets/visual-story?review"}>the stories page</a>.</p>;
  else if ((instructor || savedPin()) && !as) body = <PracticePicker config={config} />;
  else body = open ? <OneStory config={config} as={as} id={open} copy={copy} editing={editing} onBack={() => go("")} /> : <Grid config={config} as={as} copy={copy} editing={editing} onOpen={go} />;

  return (
    <div className="vrd" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      <style>{STORY_CSS}</style>
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      <div className="vrd-in">
        {session && instructor ? (
          <div className="vrd-row">
            <button type="button" className="vrd-btn" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
            {copy.status ? <span className="vrd-muted">{copy.status}</span> : null}
            {as ? <span className="vrd-muted">Seeing the page as {as}. <a className="vrd-link" href={window.location.pathname}>Pick someone else</a></span> : null}
          </div>
        ) : null}
        {body}
      </div>
    </div>
  );
}

// The practice class: Andrew picks a fake student to see the page as.
function PracticePicker({ config }) {
  const people = (config.students || []).filter(s => s.name);
  const slug = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (
    <div className="vrd-stack">
      <h1 className="vrd-title">See the stories as a practice student</h1>
      <p className="vrd-p">Pick a name. You'll see exactly what that student sees, and comments you leave are saved as theirs.</p>
      <div className="vrd-row">
        {people.map(p => {
          const email = (p.email || slug(p.name) + "@practice.test").toLowerCase();
          return <a key={p.name} className="vrd-btn" href={window.location.pathname + "?as=" + encodeURIComponent(email)}>{p.name}</a>;
        })}
      </div>
    </div>
  );
}

function Grid({ config, as, copy, editing, onOpen }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api(config, { action: "list", as }).then(setData).catch(e => setError(e.message)); }, [config, as]);
  if (error) return <p className="vrd-p">{error}</p>;
  if (!data) return <p className="vrd-p">Loading the stories.</p>;
  const stage = data.stage;
  const required = data.stories.filter(t => t.required);
  const requiredDone = required.filter(t => t.done).length;
  return (
    <div className="vrd-stack">
      <Words k="title" copy={copy} editing={editing} as="h1" className="vrd-title" />
      <Words k={stage} copy={copy} editing={editing} as="p" className="vrd-lead" />
      {stage === "reading" ? (
        <div className="vrd-progress">
          <span className="vrd-big">{data.read}</span>
          <span>{data.read === 1 ? "story read" : "stories read"}. {required.length ? `Required: ${requiredDone} of ${required.length}. ` : ""}{data.read >= data.needed ? "You can comment on your own story now, and you can keep reading more!" : `${data.needed - data.read} more before your own story.`}</span>
        </div>
      ) : null}
      {stage !== "building" ? (
        <ul className="vrd-grid">
          {data.stories.map(t => (
            <li key={t.id}>
              <button type="button" className={"vrd-tile" + (t.done ? " vrd-done" : t.required || t.mine ? " vrd-red" : "")} onClick={() => onOpen(t.id)}>
                <span className={"vrd-tile-img vrd-look-" + (t.look || "light")}>{t.image ? <img src={t.image} alt="" loading="lazy" /> : null}</span>
                <span className="vrd-tile-h">{t.headline || "Untitled story"}</span>
                {t.author ? <span className="vrd-tile-by">by {t.author}</span> : null}
                <span className="vrd-chips">
                  {t.done ? <span className="vrd-chip vrd-chip-done">✓ Read</span> : null}
                  {t.required && !t.done ? <span className="vrd-chip vrd-chip-red">Required reading</span> : null}
                  {t.mine ? <span className="vrd-chip vrd-chip-red">My story</span> : null}
                  {t.late ? <span className="vrd-chip">Submitted late</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function OneStory({ config, as, id, copy, editing, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState("");
  const [short, setShort] = useState([]);
  const key = draftKey(config, as, id);
  useEffect(() => {
    api(config, { action: "story", id, as }).then(out => {
      setData(out);
      const draft = readDraft(key);
      setForm({ ...EMPTY, ...(draft || out.myComment || {}) });
      if (draft) setState("draft");
    }).catch(e => setError(e.message));
  }, [config, id, as, key]);
  const change = (f, v) => { const next = { ...form, [f]: v }; setForm(next); writeDraft(key, next); setState("draft"); };
  const save = async () => {
    setState("saving"); setShort([]);
    try {
      await api(config, { action: "comment", id, as, ...form });
      writeDraft(key, null);
      setState("saved");
      setData(d => ({ ...d, myComment: form }));
    } catch (e) { setState("error:" + e.message); setShort(e.out?.short || []); }
  };
  if (error) return <div className="vrd-stack"><button type="button" className="vrd-back" onClick={onBack}>Back to all stories</button><p className="vrd-p">{error}</p></div>;
  if (!data) return <p className="vrd-p">Loading the story.</p>;
  // StoryView takes paths and a map of links; the server sends links, so each block's id stands in for its path.
  const story = { ...data.story, feature: "", blocks: data.story.blocks.map(b => (b.type === "image" ? { ...b, path: b.id } : b)) };
  const images = data.story.blocks.filter(b => b.type === "image");
  const urls = Object.fromEntries(images.map(b => [b.id, b.url]));
  return (
    <div className="vrd-stack">
      <button type="button" className="vrd-back" onClick={onBack}>Back to all stories</button>
      <div className={"vrd-story vrd-look-" + (data.story.look || "light")}>
        <StoryView story={story} urls={urls} credit={data.author || ""} />
        {data.author ? <p className={"vrd-byline vrd-look-" + (data.story.look || "light")}>By {data.author}</p> : null}
      </div>

      {data.comments ? (
        <section className="vrd-comments">
          <h2 className="vrd-h2">What your classmates said</h2>
          {!data.comments.length ? <p className="vrd-muted">Nobody commented on your story.</p> : data.comments.map((c, i) => (
            <article key={i} className="vrd-comment">
              <b>{c.author}</b>
              <Said c={c} copy={copy} images={images} urls={urls} />
            </article>
          ))}
        </section>
      ) : null}

      {data.stage === "reading" ? (
        data.mine && !data.canComment ? (
          <p className="vrd-note">Comment on {data.needed} classmates' stories first, then come back to your own. You've done {data.doneOthers}.</p>
        ) : (
          <section className="vrd-form">
            <h2 className="vrd-h2">{data.mine ? "Your comments on your own story" : "Your comments"}</h2>
            <Words k="prompt" copy={copy} editing={editing} as="p" className="vrd-muted" />
            {FIELDS.map(f => (
              <div key={f} className="vrd-field">
                <Words k={"ask." + f} copy={copy} editing={editing} className="vrd-ask" />
                {f === "best" ? (
                  <div className={"vrd-picks" + (short.includes("bestImage") ? " vrd-picks-bad" : "")} role="radiogroup" aria-label="Tap the best image">
                    {images.map((b, i) => (
                      <button key={b.id} type="button" role="radio" aria-checked={form.bestImage === b.id} aria-label={"Picture " + (i + 1)} className="vrd-pick" onClick={() => change("bestImage", b.id)}>
                        {urls[b.id] ? <img src={urls[b.id]} alt="" /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
                <textarea className={"vrd-box" + (short.includes(f) ? " vrd-box-bad" : "")} rows={3} maxLength={3000} aria-label={copy.say("ask." + f)}
                  placeholder={f === "best" ? "Why is this picture the best?" : ""} value={form[f] || ""} onChange={e => change(f, e.target.value)} />
                <span className={"vrd-chars" + (String(form[f] || "").trim().length >= MIN_CHARS ? " vrd-chars-ok" : "")}>{charsSay(String(form[f] || "").trim().length)}</span>
              </div>
            ))}
            <div className="vrd-row">
              <button type="button" className="vrd-go" disabled={state === "saving"} onClick={save}>{data.myComment ? "Save my changes" : "Save my comments"}</button>
              {state === "saving" ? <span className="vrd-muted">Saving</span> : null}
              {state === "saved" ? <span className="vrd-good">Saved! This story is marked read. <button type="button" className="vrd-linkbtn" onClick={onBack}>Back to all stories</button></span> : null}
              {state === "draft" ? <span className="vrd-muted">Not saved yet. Your words are kept on this computer until you press Save.</span> : null}
              {state.startsWith("error:") ? <span className="vrd-bad">{state.slice(6)}</span> : null}
            </div>
          </section>
        )
      ) : data.myComment && !data.comments ? (
        <section className="vrd-form">
          <h2 className="vrd-h2">Your comments</h2>
          <Said c={data.myComment} copy={copy} images={images} urls={urls} />
        </section>
      ) : null}
    </div>
  );
}

// One reader's three comments, with the picture they chose as best.
function Said({ c, copy, images, urls }) {
  const n = images.findIndex(b => b.id === c.bestImage);
  return FIELDS.map(f => (
    <div key={f} className="vrd-said">
      <span className="vrd-said-k">{copy.say("ask." + f)}</span>
      {f === "best" && n >= 0 ? <span className="vrd-said-pick">{urls[c.bestImage] ? <img src={urls[c.bestImage]} alt={"Picture " + (n + 1)} /> : null}<span>Picture {n + 1}</span></span> : null}
      {c[f]}
    </div>
  ));
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const SERIF = "'Lora', 'Iowan Old Style', Charter, Georgia, serif";
const RED = "#d92d20", GREEN = "#16803c";
const CSS = `
.vrd{min-height:100vh;background:${S.page};color:${T.primary};font-family:${TOKENS.FONT.body}}
.vrd-in{max-width:1240px;margin:0 auto;padding:24px 18px 90px;display:flex;flex-direction:column;gap:16px}
.vrd-stack{display:flex;flex-direction:column;gap:16px}
.vrd-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.vrd-title{margin:0;font-family:${SERIF};font-size:40px;font-weight:600;letter-spacing:-.015em}
.vrd-lead{margin:0;font-size:18px;line-height:1.55;color:${T.secondary};max-width:70ch}
.vrd-p{margin:0;font-size:17px;color:${T.secondary}}
.vrd-muted{margin:0;font-size:14.5px;color:${T.muted}}
.vrd-good{color:${GREEN};font-weight:600;font-size:15px}
.vrd-bad{color:${ST.late};font-size:15px}
.vrd-link{color:${T.primary};font-weight:600}
.vrd-linkbtn{font:inherit;color:inherit;background:none;border:0;padding:0;text-decoration:underline;cursor:pointer}
.vrd-btn{font:inherit;font-size:14px;font-weight:600;padding:7px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer;text-decoration:none}
.vrd-btn[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vrd-go{font:inherit;font-size:16px;font-weight:700;padding:11px 24px;border-radius:999px;border:0;background:${T.primary};color:${S.page};cursor:pointer}
.vrd-go:disabled{opacity:.5}
.vrd-back{align-self:flex-start;font:inherit;font-size:15px;font-weight:600;background:none;border:0;padding:0;color:${T.secondary};cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.vrd-progress{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:14px;background:${S.card};box-shadow:0 0 0 1px ${L.soft};font-size:16px}
.vrd-big{font-size:34px;font-weight:700;color:${GREEN};line-height:1}
.vrd-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.vrd-tile{display:flex;flex-direction:column;gap:8px;width:100%;text-align:left;font:inherit;color:inherit;background:${S.card};border:3px solid transparent;border-radius:14px;padding:8px 8px 12px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.08);transition:transform .12s,box-shadow .12s}
.vrd-tile:hover{transform:translateY(-2px);box-shadow:0 8px 20px -8px rgba(0,0,0,.3)}
.vrd-tile:focus-visible,.vrd-go:focus-visible,.vrd-btn:focus-visible,.vrd-box:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.vrd-red{border-color:${RED}}
.vrd-done{border-color:${GREEN}}
.vrd-tile-img{display:block;aspect-ratio:4/5;border-radius:8px;overflow:hidden}
.vrd-tile-img img{width:100%;height:100%;object-fit:cover;display:block}
.vrd-look-light{background:#fff;color:#141414}
.vrd-look-dark{background:#0b0b0c;color:#f2f1ee}
.vrd-tile-h{font-family:${SERIF};font-size:16.5px;font-weight:600;line-height:1.3;padding:0 4px}
.vrd-tile-by{font-size:13px;color:${T.muted};padding:0 4px}
.vrd-chips{display:flex;flex-wrap:wrap;gap:5px;padding:0 4px}
.vrd-chip{font-size:11.5px;font-weight:700;border-radius:999px;padding:2px 8px;border:1px solid ${L.strong};color:${T.secondary}}
.vrd-chip-red{background:${RED};border-color:${RED};color:#fff}
.vrd-chip-done{background:${GREEN};border-color:${GREEN};color:#fff}
.vrd-story{border-radius:16px;overflow:hidden;box-shadow:0 10px 40px -12px rgba(0,0,0,.35);max-width:860px;width:100%;align-self:center}
.vrd-byline{margin:0;padding:0 40px 40px;font-family:${SERIF};font-size:17px;font-style:italic}
.vrd-h2{margin:0;font-size:22px;font-weight:700}
.vrd-form,.vrd-comments{display:flex;flex-direction:column;gap:12px;max-width:860px;width:100%;align-self:center}
.vrd-field{display:flex;flex-direction:column;gap:6px}
.vrd-ask{font-size:16px;font-weight:700}
.vrd-box{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.5;padding:10px 12px;border:1px solid ${L.strong};border-radius:10px;background:${S.card};color:${T.primary};resize:vertical}
.vrd-box-bad{border-color:${ST.late};box-shadow:0 0 0 1px ${ST.late}}
.vrd-note{margin:0;max-width:860px;align-self:center;padding:12px 16px;border-radius:12px;background:${S.sunk};font-size:16px}
.vrd-comment{display:flex;flex-direction:column;gap:6px;padding:12px 16px;border-radius:12px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.vrd-said{margin:0;font-size:15.5px;line-height:1.5;white-space:pre-wrap}
.vrd-said-k{display:block;font-size:12.5px;font-weight:700;color:${T.muted}}
.vrd-said-pick{display:flex;align-items:center;gap:8px;margin:4px 0 6px;font-size:13px;font-weight:600;color:${T.secondary}}
.vrd-said-pick img{width:56px;height:56px;object-fit:cover;border-radius:6px;display:block}
.vrd-picks{display:flex;flex-wrap:wrap;gap:10px;padding:4px 0}
.vrd-picks-bad{padding:6px;border-radius:12px;box-shadow:0 0 0 2px ${ST.late}}
.vrd-pick{width:92px;height:92px;padding:0;border:0;border-radius:10px;overflow:hidden;background:${S.card};cursor:pointer;box-shadow:0 0 0 1px ${L.soft};opacity:.72;transition:opacity .12s,box-shadow .12s,transform .12s}
.vrd-pick img{width:100%;height:100%;object-fit:cover;display:block}
.vrd-pick:hover{opacity:1;transform:translateY(-1px)}
.vrd-pick[aria-checked="true"]{opacity:1;box-shadow:0 0 0 4px ${GREEN}}
.vrd-pick:focus-visible{outline:2.5px solid ${T.primary};outline-offset:3px}
.vrd-chars{font-size:13px;color:${T.muted}}
.vrd-chars-ok{color:${GREEN};font-weight:600}
.vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.45;padding:4px 8px;margin:0;border:1.5px dashed ${L.strong};border-radius:8px;background:${S.card};resize:none;overflow:hidden}
@media (max-width:1100px){ .vrd-grid{grid-template-columns:repeat(4,1fr)} }
@media (max-width:760px){ .vrd-grid{grid-template-columns:repeat(2,1fr);gap:12px} .vrd-title{font-size:30px} }
`;
