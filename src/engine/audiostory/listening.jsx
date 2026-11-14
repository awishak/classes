// Classmates' audio stories, for students: /comm3/audio-stories.
//
// Andrew, 2026-11-13: "we had a page where students could see everybody's
// kind of like the cover image of everybody's visual stories ... take what we
// did for the visual story, where the students leave comments to other
// students' visual stories, and do the exact same thing." So this is
// visualstory/reading.jsx for sound, with the same grid, the same red
// outline on the assigned stories, the same green check once a story is
// commented on, and the same three comment boxes. What changed:
//   - A student is assigned 3 stories and chooses at least 2 more, 5 in all.
//   - The grid has no names. The story's own page has the name ("once they
//     click on them, they can see the names").
//   - A story opens on its story page: headline, summary, the player,
//     chapters, voices and sources.
//   - The first comment is the best chapter, picked from the story's own
//     chapters, where the visual story had the best image. (The first build
//     asked for the strongest 10 to 30 seconds; Andrew, 2026-11-13: "needs to
//     be easier to review. i think it should be which chapter was the best
//     and why.")
//   - A student does not comment on their own story.
// Everything comes through /api/audio-review, which decides what a student
// may see and when comments save; this page only shows the answer. Signed in
// as the instructor, the same page is every story in the class with names.

import { useEffect, useRef, useState } from "react";
import { useSession, authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { READING_CSS } from "../visualstory/reading.jsx";
import { AudioStoryView, AUDIO_STORY_CSS } from "./story.jsx";
import { clock, secondsOf } from "./storymodel.js";   // secondsOf reads a chapter's time
import { NEED_TOTAL, MIN_CHARS, chaptersOf, chapterSpan, rangesOf } from "./reviewmodel.js";
import * as TOKENS from "../tokens.js";
import TopNav, { NAV_STUDENT } from "../TopNav.jsx";
import { useStudentTheme, useDayNight, ThemeStyle } from "../ThemeShell.jsx";

export const LISTENING_COPY_ROW = "worksheet-audio-stories-plan";
// Andrew's lines from the visual stories, with this round's numbers and dates.
export const LISTENING_COPY = {
  title: "Classmates' audio stories",
  building: "The stories open on Tuesday, November 17. Come back then!",
  reading: "You've completed your story. Now it's your turn to review your classmates' work. Please review at least 5 stories. You must review the 3 stories outlined in red. Then choose at least 2 other stories to review. You can review as many as you want.",
  due: "Comments are due Wednesday, November 18, at 11:59 PM. Each student will receive their comments, with names attached, on Thursday. Check back then to see what people think of your work.",
  closed: "Comments are closed. The comments on your story, with names attached, come out on Thursday, November 19.",
  released: "The comments are out! Open your own story to read what your classmates said.",
  "count.required": "Outlined in red",
  "count.others": "Your choice",
  "count.total": "Total",
  "count.done": "That's at least 5. Keep going if you like.",
  prompt: "Please make sure your comments are substantial. A well-crafted sentence is acceptable, and longer than that is also okay.",
  "ask.chapter": "The best chapter, and why",
  "ask.shone": "One way this story shone",
  "ask.encourage": "One thing you would encourage the author to do",
};
const FIELDS = ["best", "shone", "encourage"];
const EMPTY = { chapter: "", best: "", shone: "", encourage: "" };
const askKey = (f) => (f === "best" ? "ask.chapter" : "ask." + f);
const charsSay = (n) => (n >= MIN_CHARS ? n + " characters. Long enough!" : n + " characters. Write at least " + MIN_CHARS + ".");
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const api = async (config, body) => {
  const r = await fetch("/api/audio-review", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), groupKey: config.id, ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) { const e = new Error(out?.error || "The server did not answer."); e.out = out; throw e; }
  return out;
};
const draftKey = (config, as, id) => "audio-comment:" + config.id + ":" + (as || "") + ":" + id;
const readDraft = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const writeDraft = (k, v) => { try { if (v) localStorage.setItem(k, JSON.stringify(v)); else localStorage.removeItem(k); } catch { /* the server copy still goes */ } };
const formOf = (c) => (c ? { chapter: c.chapter || "", best: c.best || "", shone: c.shone || "", encourage: c.encourage || "" } : null);

export default function ClassmatesAudio({ config }) {
  const { session, instructor } = useSession();
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const as = search.get("as") || "";
  const [open, setOpen] = useState(search.get("s") || "");
  const copy = useCopy(!!(session && instructor), LISTENING_COPY_ROW, LISTENING_COPY);
  const [editing, setEditing] = useState(false);
  useEffect(() => { document.title = config.code + " · Classmates' audio stories"; }, [config]);
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
  const mine = instructor || savedPin();

  let body;
  if (!session && !savedPin()) body = <p className="vrd-p">Sign in to hear your classmates' stories. <a className="vrd-link" href={"/login?next=" + encodeURIComponent(window.location.pathname)}>Sign in</a></p>;
  else if (mine && !as && config.id !== "comm999") body = open ? <EveryStory config={config} id={open} copy={copy} onBack={() => go("")} /> : <EveryGrid config={config} onOpen={go} />;
  else if (mine && !as) body = <PracticePicker config={config} />;
  else body = open ? <OneStory config={config} as={as} id={open} copy={copy} editing={editing} onBack={() => go("")} /> : <Grid config={config} as={as} copy={copy} editing={editing} onOpen={go} />;

  return (
    <div className="vrd" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      <style>{AUDIO_STORY_CSS}</style>
      <style>{READING_CSS}</style>
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      <div className="vrd-in">
        {session && instructor ? (
          <div className="vrd-row">
            <button type="button" className="vrd-btn" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
            <a className="vrd-btn" href={"/" + config.id + "/audio-reviews"}>Who reviewed what</a>
            {copy.status ? <span className="vrd-muted">{copy.status}</span> : null}
            {as ? <span className="vrd-muted">Seeing the page as {as}. <a className="vrd-link" href={window.location.pathname}>Pick someone else</a></span> : null}
          </div>
        ) : null}
        {editing && !as ? <WordsList copy={copy} /> : null}
        {body}
      </div>
    </div>
  );
}

// Every line a student reads, in one list, for Andrew to change before the
// page opens. His own view of the page is the grid with names, which draws
// none of these lines, so Edit the words opens the list instead.
function WordsList({ copy }) {
  return (
    <div className="vrd-stack">
      {Object.keys(LISTENING_COPY).map(k => <Words key={k} k={k} copy={copy} editing as="p" className="vrd-p" />)}
    </div>
  );
}

// Andrew's grid: every story in the class, in progress or submitted, with names.
function EveryGrid({ config, onOpen }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [section, setSection] = useState("");
  useEffect(() => { api(config, { action: "every" }).then(d => { setData(d); setSection(d.sections[0] || ""); }).catch(e => setError(e.message)); }, [config]);
  if (error) return <p className="vrd-p">{error}</p>;
  if (!data) return <p className="vrd-p">Loading the stories.</p>;
  const stories = data.stories.filter(t => !section || t.section === section);
  const notStarted = data.notStarted.filter(p => !section || p.section === section);
  const submitted = stories.filter(t => t.submitted_at).length;
  return (
    <div className="vrd-stack">
      <h1 className="vrd-title">Classmates' audio stories</h1>
      <p className="vrd-lead">{submitted} submitted, {stories.length - submitted} in progress, {notStarted.length} not started.</p>
      {data.sections.length > 1 ? (
        <div className="vrd-row" role="tablist">
          {data.sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} aria-pressed={s === section} className="vrd-btn" onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}
      <ul className="vrd-grid">
        {stories.map(t => (
          <li key={t.id}>
            <button type="button" className={"vrd-tile" + (t.submitted_at ? " vrd-done" : "")} onClick={() => onOpen(t.id)}>
              <Cover t={t} />
              <span className="vrd-tile-h">{t.headline || "Untitled story"}</span>
              <span className="vrd-tile-by">{t.author}</span>
              <span className="vrd-chips">
                {t.submitted_at ? <span className={"vrd-chip " + (t.late ? "vrd-chip-red" : "vrd-chip-done")}>{t.late ? "Submitted late" : "Submitted"}</span> : <span className="vrd-chip">Not yet submitted</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {notStarted.length ? <p className="vrd-muted">Not started: {notStarted.map(p => p.name).join(", ")}.</p> : null}
    </div>
  );
}

function EveryStory({ config, id, copy, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState(false);
  const player = useRef(null);
  const play = usePlaySection(player);
  useEffect(() => { api(config, { action: "peek", id }).then(setData).catch(e => setError(e.message)); }, [config, id]);
  if (error) return <div className="vrd-stack"><button type="button" className="vrd-back" onClick={onBack}>Back to all stories</button><p className="vrd-p">{error}</p></div>;
  if (!data) return <p className="vrd-p">Loading the story.</p>;
  return (
    <div className="vrd-stack">
      <button type="button" className="vrd-back" onClick={onBack}>Back to all stories</button>
      <p className="vrd-p"><b>{data.author}</b>{data.section ? ", " + data.section : ""}. {data.submitted_at ? (data.late ? "Submitted late, " : "Submitted ") + when(data.submitted_at) + "." : "Not yet submitted."}</p>
      <div className="vrd-story ala-story"><AudioStoryView story={data.story} urls={data.urls} by={data.author} playerRef={player} showPrivate /></div>
      {/* Students' comments stay folded until he opens them, in case the page is on the projector. */}
      <section className="vrd-comments">
        <div className="vrd-row">
          <h2 className="vrd-h2">Comments</h2>
          <span className="vrd-muted">{data.comments.length}</span>
          {data.comments.length ? <button type="button" className="vrd-btn" aria-pressed={shown} onClick={() => setShown(s => !s)}>{shown ? "Hide the comments" : "Show the comments"}</button> : null}
        </div>
        {shown ? data.comments.map((c, i) => <article key={i} className="vrd-comment"><b>{c.author}</b><span className="vrd-muted">Heard {clock(c.heard)} of {clock(c.length)}</span><Said c={c} copy={copy} onPlay={play} story={data.story} /></article>) : null}
      </section>
    </div>
  );
}

// The practice class: Andrew picks a fake student to see the page as.
function PracticePicker({ config }) {
  const people = (config.students || []).filter(s => s.name);
  const slug = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (
    <div className="vrd-stack">
      <h1 className="vrd-title">Hear the stories as a practice student</h1>
      <p className="vrd-p">Pick a name. You'll see exactly what the student sees, and comments you leave are saved as theirs.</p>
      <div className="vrd-row">
        {people.map(p => {
          const email = (p.email || slug(p.name) + "@practice.test").toLowerCase();
          return <a key={p.name} className="vrd-btn" href={window.location.pathname + "?as=" + encodeURIComponent(email)}>{p.name}</a>;
        })}
      </div>
    </div>
  );
}

function Cover({ t }) {
  return (
    <span className="vrd-tile-img ala-cover">
      {t.image ? <img src={t.image} alt="" loading="lazy" /> : null}
      {t.seconds ? <span className="ala-len">{clock(t.seconds)}</span> : null}
    </span>
  );
}

function Grid({ config, as, copy, editing, onOpen }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api(config, { action: "list", as }).then(setData).catch(e => setError(e.message)); }, [config, as]);
  if (error) return <p className="vrd-p">{error}</p>;
  if (!data) return <p className="vrd-p">Loading the stories.</p>;
  const stage = data.stage;
  const reading = stage === "reading";
  // The counter, the visual stories' own: "5 of 5 + 2 = 7" past the minimum.
  const required = data.required || 0, requiredDone = data.requiredDone || 0, total = data.total || 0;
  const othersDone = total - requiredDone;
  const needOthers = Math.max(0, NEED_TOTAL - required);
  const totalSay = total > NEED_TOTAL ? `${NEED_TOTAL} of ${NEED_TOTAL} + ${total - NEED_TOTAL} = ${total}` : `${total} of ${NEED_TOTAL}`;
  return (
    <div className="vrd-stack">
      <Words k="title" copy={copy} editing={editing} as="h1" className="vrd-title" />
      <Words k={stage} copy={copy} editing={editing} as="p" className="vrd-lead" />
      {reading ? <Words k="due" copy={copy} editing={editing} as="p" className="vrd-lead" /> : null}
      {reading ? (
        <div className="vrd-count" role="status" aria-label="Your reviews so far">
          {required ? <span className="vrd-count-item"><Words k="count.required" copy={copy} editing={editing} /> <b>{requiredDone} of {required}</b></span> : null}
          <span className="vrd-count-item"><Words k="count.others" copy={copy} editing={editing} /> <b>{othersDone >= needOthers ? othersDone + " ✓" : othersDone + " of " + needOthers}</b></span>
          <span className="vrd-count-item vrd-count-total"><Words k="count.total" copy={copy} editing={editing} /> <b>{totalSay}</b></span>
          {total >= NEED_TOTAL && requiredDone >= required ? <Words k="count.done" copy={copy} editing={editing} className="vrd-good" /> : null}
        </div>
      ) : null}
      {stage !== "building" ? (
        <ul className="vrd-grid">
          {data.stories.map(t => (
            <li key={t.id}>
              <button type="button" className={"vrd-tile" + (t.done ? " vrd-done" : t.required || t.mine ? " vrd-red" : "")} onClick={() => onOpen(t.id)}>
                <Cover t={t} />
                <span className="vrd-tile-h">{t.headline || "Untitled story"}</span>
                <span className="vrd-chips">
                  {t.done ? <span className="vrd-chip vrd-chip-done">✓ Reviewed</span> : null}
                  {t.required && !t.done ? <span className="vrd-chip vrd-chip-red">Required</span> : null}
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

/** Play one stretch of the story and stop at its end. */
function usePlaySection(player) {
  const stopAt = useRef(null);
  useEffect(() => {
    const t = setInterval(() => {
      const a = player.current;
      if (a && stopAt.current != null && a.currentTime >= stopAt.current) { a.pause(); stopAt.current = null; }
    }, 150);
    return () => clearInterval(t);
  }, [player]);
  return (from, to) => {
    const a = player.current;
    if (!a) return;
    a.currentTime = from; stopAt.current = to;
    a.play().catch(() => {});
    a.scrollIntoView({ block: "center", behavior: "smooth" });
  };
}

// What actually played. Andrew, 2026-11-13: "record if a student actually
// listens to a story or not." Four times a second, while the player is
// playing, the second it is on is noted. The seconds go to the server every
// fifteen seconds, when the listener leaves the story, and when the tab
// closes; the server keeps the union. Nothing is drawn for the student.
function useHeard(player, config, id, as, on) {
  useEffect(() => {
    if (!on) return undefined;
    const fresh = new Set();
    let headers = {};
    authHeaders().then(h => { headers = h; }).catch(() => {});
    const send = (keepalive = false) => {
      if (!fresh.size) return;
      const ranges = rangesOf([...fresh]);
      fresh.clear();
      fetch("/api/audio-review", { method: "POST", keepalive, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ pin: savedPin(), groupKey: config.id, action: "heard", id, as, ranges }) }).catch(() => {});
    };
    const tick = setInterval(() => { const a = player.current; if (a && !a.paused && !a.seeking && !a.ended) fresh.add(Math.floor(a.currentTime || 0)); }, 250);
    const push = setInterval(() => send(), 15000);
    const leaving = () => send(true);
    window.addEventListener("pagehide", leaving);
    return () => { clearInterval(tick); clearInterval(push); window.removeEventListener("pagehide", leaving); send(true); };
  }, [player, config.id, id, as, on]);
}

// Picking the best chapter: the story's own chapters, one tap each. Hearing
// a chapter again is the story page's job, where each chapter jumps the player.
function ChapterPick({ story, value, onPick, bad }) {
  const chapters = chaptersOf(story);
  if (!chapters.length) return null;
  return (
    <div className={"ala-chapters" + (bad ? " ala-chapters-bad" : "")} role="radiogroup" aria-label="The best chapter">
      {chapters.map(c => (
        <button key={c.id} type="button" role="radio" aria-checked={value === c.id} className="ala-chapter-pick" onClick={() => onPick(c.id)}>
          <span className="ala-chapter-t">{clock(secondsOf(c.at))}</span>
          <span>{c.name.trim()}</span>
        </button>
      ))}
    </div>
  );
}

function OneStory({ config, as, id, copy, editing, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState("");
  const [short, setShort] = useState([]);
  const player = useRef(null);
  const play = usePlaySection(player);
  useHeard(player, config, id, as, !!data && !data.mine);
  const key = draftKey(config, as, id);
  useEffect(() => {
    api(config, { action: "story", id, as }).then(out => {
      setData(out);
      const draft = readDraft(key);
      setForm({ ...EMPTY, ...(draft || formOf(out.myComment) || {}) });
      if (draft) setState("draft");
    }).catch(e => setError(e.message));
  }, [config, id, as, key]);
  const change = (f, v) => { const next = { ...form, [f]: v }; setForm(next); writeDraft(key, next); setState("draft"); };
  const save = async () => {
    setState("saving"); setShort([]);
    try {
      const out = { chapter: form.chapter, best: form.best, shone: form.shone, encourage: form.encourage };
      await api(config, { action: "comment", id, as, ...out });
      writeDraft(key, null);
      setState("saved");
      setData(d => ({ ...d, myComment: out }));
    } catch (e) { setState("error:" + e.message); setShort(e.out?.short || []); }
  };
  if (error) return <div className="vrd-stack"><button type="button" className="vrd-back" onClick={onBack}>Back to all stories</button><p className="vrd-p">{error}</p></div>;
  if (!data) return <p className="vrd-p">Loading the story.</p>;
  return (
    <div className="vrd-stack">
      <button type="button" className="vrd-back" onClick={onBack}>Back to all stories</button>
      <div className="vrd-story ala-story"><AudioStoryView story={data.story} urls={data.urls} by={data.author} playerRef={player} /></div>

      {data.comments ? (
        <section className="vrd-comments">
          <h2 className="vrd-h2">What your classmates said</h2>
          {!data.comments.length ? <p className="vrd-muted">Nobody commented on your story.</p> : data.comments.map((c, i) => (
            <article key={i} className="vrd-comment">
              <b>{c.author}</b>
              <Said c={c} copy={copy} onPlay={play} story={data.story} />
            </article>
          ))}
        </section>
      ) : null}

      {data.mine ? null : data.commentsOpen ? (
        <section className="vrd-form">
          <h2 className="vrd-h2">Your comments</h2>
          <Words k="prompt" copy={copy} editing={editing} as="p" className="vrd-muted" />
          {FIELDS.map(f => (
            <div key={f} className="vrd-field">
              <Words k={askKey(f)} copy={copy} editing={editing} className="vrd-ask" />
              {f === "best" ? <ChapterPick story={data.story} value={form.chapter} onPick={v => change("chapter", v)} bad={short.includes("chapter")} /> : null}
              <textarea className={"vrd-box" + (short.includes(f) ? " vrd-box-bad" : "")} rows={3} maxLength={3000} aria-label={copy.say(askKey(f))}
                value={form[f] || ""} onChange={e => change(f, e.target.value)} />
              <span className={"vrd-chars" + (String(form[f] || "").trim().length >= MIN_CHARS ? " vrd-chars-ok" : "")}>{charsSay(String(form[f] || "").trim().length)}</span>
            </div>
          ))}
          <div className="vrd-row">
            <button type="button" className="vrd-go" disabled={state === "saving"} onClick={save}>{data.myComment ? "Save my changes" : "Save my comments"}</button>
            {state === "saving" ? <span className="vrd-muted">Saving</span> : null}
            {state === "saved" ? <span className="vrd-good">Saved! This story is marked reviewed. <button type="button" className="vrd-linkbtn" onClick={onBack}>Back to all stories</button></span> : null}
            {state === "draft" ? <span className="vrd-muted">Not saved yet. Your words are kept on this computer until you press Save.</span> : null}
            {state.startsWith("error:") ? <span className="vrd-bad">{state.slice(6)}</span> : null}
          </div>
        </section>
      ) : data.myComment ? (
        <section className="vrd-form">
          <h2 className="vrd-h2">Your comments</h2>
          <Said c={data.myComment} copy={copy} onPlay={play} story={data.story} />
        </section>
      ) : null}
    </div>
  );
}

// One listener's three comments, with the chapter they picked as best.
function Said({ c, copy, onPlay, story }) {
  const span = c.chapter ? chapterSpan(story, c.chapter) : null;
  return FIELDS.map(f => (
    <div key={f} className="vrd-said">
      <span className="vrd-said-k">{copy.say(askKey(f))}</span>
      {f === "best" && span ? (
        <span className="vrd-said-pick">
          <span>{span.name}, {clock(span.from)}</span>
          {onPlay ? <button type="button" className="vrd-btn" onClick={() => onPlay(span.from, span.to)}>Play the chapter</button> : null}
        </span>
      ) : null}
      {c[f]}
    </div>
  ));
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.ala-cover{position:relative;aspect-ratio:1/1;background:${S.sunk}}
.ala-len{position:absolute;right:8px;bottom:8px;font-size:12.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(0,0,0,.72);color:#fff}
.ala-story{background:#fff;color:#141414}
.ala-story .asr{min-height:0}
.ala-chapters{display:flex;flex-direction:column;gap:8px}
.ala-chapters-bad{padding:8px;border-radius:14px;box-shadow:0 0 0 2px ${ST.late}}
.ala-chapter-pick{display:flex;width:100%;box-sizing:border-box;align-items:baseline;gap:12px;text-align:left;font:inherit;font-size:16px;font-weight:600;min-height:48px;padding:10px 14px;border-radius:12px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.ala-chapter-pick[aria-checked="true"]{border-color:#16803c;box-shadow:0 0 0 3px #16803c}
.ala-chapter-pick:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.ala-chapter-t{font-size:14px;font-weight:700;color:${T.muted};font-variant-numeric:tabular-nums}
`;
