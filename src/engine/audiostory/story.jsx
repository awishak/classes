// The audio story builder: /comm3/worksheets/audio-story.
//
// Andrew, 2026-10-29, after three mockups: "build that," the one that sits
// beside the finished page. So the page is the visual story builder's shape
// for sound: building on the left, and on the right the story page, live,
// the way a classmate will hear it. A student uploads the file (up to five
// minutes, the audio exercise's own "allotted 5 minutes"), one cover
// picture, a headline, a listen line, names every voice and marks whether
// each knew they were being recorded, lists the sounds they did not make
// and where each came from, picks a white or a black page, and submits.
//
// Every answer is its own worksheet row (storymodel.js), saved through
// saver.js, so typing is never lost. The file and the cover go into the
// student's private folder in the visual-story bucket (audio.js, photos.js).
// A pair from the ideas sheet (pairs.js) is named on the page; each member
// has their own sheet, the way the audio exercise works. The lock at the
// due date is the database's (sql/audio-story.sql); this page only says so.

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "../visualstory/saver.js";
import { prepImage, uploadImage, signUrls, letterId, looksLikeImage } from "../visualstory/photos.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { gameClient } from "../gameClient.js";
import { sendAudio, FORMAT_SAY } from "./audio.js";
import { AUDIO_RESEARCH_KEY, researchHref } from "./research.jsx";
import { AUDIO_IDEAS_KEY } from "./ideas.jsx";
import { pairsFor } from "./all.jsx";
import { pairOf } from "./pairs.js";
import { audioStoryOf, problemsOf, wordsIn, clock, MAX_STORY_SECONDS, MAX_LISTEN_WORDS, SOUND_KINDS, soundKindSay } from "./storymodel.js";
import * as TOKENS from "../tokens.js";

export const AUDIO_STORY_KEY = "audio-story";
export const AUDIO_STORY_TITLE = "Audio story";
export const AUDIO_STORY_COPY_ROW = "worksheet-audio-story-plan";
export const audioStoryHref = (classId) => "/" + classId + "/worksheets/" + AUDIO_STORY_KEY;

// The steps, said the way you'd say them to someone excited to start.
export const STEPS = [
  ["upload", "Upload your story.", "An m4a, mp3, wav or aac off your phone or your editor. Up to five minutes. You can swap the file as many times as you want."],
  ["cover", "Add your cover.", "One picture. Square works best. Your cover and your headline are what classmates see first."],
  ["headline", "Write your headline.", "The story line from your audio exercise is already here. Make it even better if you can."],
  ["listen", "Write your listen line.", "One or two sentences about what a listener is about to hear. Up to 40 words."],
  ["voices", "Name every voice.", "Everyone who talks in your story, and whether they knew they were being recorded. Only Dr. Ishak sees that mark."],
  ["sounds", "List your sounds.", "Music, effects and found audio, and where each one came from."],
  ["look", "Choose your look.", "White page or black page? Tap one and watch your story change."],
  ["submit", "Listen back, then submit.", "Play your story on the page the way a classmate will. When you love it, press Submit."],
];
export const STORY_COPY = {
  hello: "Let's make your audio story!",
  sub: "Due Sunday, November 15, at 11:59 PM. Up to five minutes. Your work saves by itself as you go.",
  "done.h": "Thanks for submitting your story!",
  "done.p": "You can keep editing until the due date, and your story stays submitted.",
  ...Object.fromEntries(STEPS.flatMap(([k, name, say]) => [["step." + k + ".name", name], ["step." + k + ".say", say]])),
};

const STATUS = { loading: "Loading", saved: "Saved", saving: "Saving", retrying: "Not saved, trying again", "failed-load": "Could not load your story. Reload the page." };
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const remember = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } return null; };
const lower = (s) => String(s || "").trim().toLowerCase();

// ─── hearing a story: the live preview now, classmates later ───

// The story page. showPrivate draws the knew-they-were-recorded marks, for
// the instructor's read; a classmate never sees them.
export function AudioStoryView({ story, urls, showPrivate = false, look, by = "" }) {
  const theme = (look || story.look) === "dark" ? "dark" : "light";
  const cover = story.cover && urls[story.cover.path];
  const clip = story.audio && urls[story.audio.path];
  const voices = story.voices.filter(v => v.name.trim());
  const sounds = story.sounds.filter(s => s.what.trim());
  return (
    <article className={"asr asr-" + theme}>
      <div className={"asr-cover" + (cover ? "" : " asr-cover-empty")}>
        {cover ? <img className="asr-img" src={cover} alt="" /> : null}
        <div className="asr-shade" />
        <div className="asr-head">
          <span className="asr-kicker">Audio story{story.audio ? " · " + clock(story.audio.seconds) : ""}</span>
          <h1 className="asr-h">{story.headline.trim() || "Your headline goes here"}</h1>
          {story.listen.trim() ? <p className="asr-dek">{story.listen}</p> : null}
        </div>
      </div>
      <div className="asr-body">
        {story.audio
          ? (clip ? <audio className="asr-player" controls preload="metadata" src={clip} /> : <div className="asr-wait">Loading your story</div>)
          : <p className="asr-empty">Your story's player shows up here once you upload your file on the left.</p>}
        {voices.length || sounds.length ? (
          <div className="asr-credits">
            {voices.length ? <div><h3 className="asr-ch">Voices</h3><p className="asr-cp">{voices.map(v => v.name.trim() + (v.role.trim() ? ", " + v.role.trim() : "") + (showPrivate ? (v.knew === true ? " (knew)" : v.knew === false ? " (did not know)" : " (not marked)") : "")).join(". ")}.</p></div> : null}
            {sounds.length ? <div><h3 className="asr-ch">Sounds</h3><p className="asr-cp">{sounds.map(s => s.what.trim() + (s.kind === "mine" ? ", my recording" : ", " + soundKindSay(s.kind).toLowerCase() + (s.from.trim() ? ", " + s.from.trim() : ""))).join(". ")}.</p></div> : null}
          </div>
        ) : null}
        {by ? <p className="asr-by">Made by {by}.{story.credits.trim() ? " " + story.credits.trim() : ""}</p> : null}
      </div>
    </article>
  );
}

// ─── the student's sheet ───

// The story line off the audio exercise, for a story with no headline yet.
async function exerciseStory({ classId, viewerId }) {
  const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", AUDIO_RESEARCH_KEY).eq("group_key", classId).eq("viewer_id", viewerId);
  const id = s.data && s.data[0] && s.data[0].id;
  if (!id) return "";
  const r = await gameClient.from("worksheet_answers").select("value,position").eq("sheet_id", id).eq("field", "story").order("position");
  return (r.data || []).map(x => x.value).join("").trim();
}

async function lockOf({ classId, viewerId }) {
  const d = await gameClient.from("worksheet_deadlines").select("due_at").eq("worksheet_key", AUDIO_STORY_KEY).eq("group_key", classId);
  const due = d.data && d.data[0] ? d.data[0].due_at : null;
  if (!due) return { due: null, until: null };
  const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", AUDIO_STORY_KEY).eq("group_key", classId).eq("viewer_id", viewerId);
  const id = s.data && s.data[0] && s.data[0].id;
  let until = null;
  if (id) { const u = await gameClient.from("worksheet_unlocks").select("until").eq("sheet_id", id); until = u.data && u.data[0] ? u.data[0].until : null; }
  return { due, until };
}
const lockedNow = (lock, now = Date.now()) => !!(lock && lock.due && now > Date.parse(lock.due) && !(lock.until && Date.parse(lock.until) > now));

export function AudioStorySheet({ store, viewer, classId, readOnly = false, editor = false }) {
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const [urls, setUrls] = useState({});
  const [sending, setSending] = useState(null);      // { what: "audio" | "cover", progress, stage, error }
  const [pane, setPane] = useState("build");
  const [submitting, setSubmitting] = useState("");
  const [done, setDone] = useState(false);
  const [lock, setLock] = useState(null);
  const [pair, setPair] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [editing, setEditing] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(() => remember("audio-story-steps") !== "hidden");
  const copy = useCopy(editor, AUDIO_STORY_COPY_ROW, STORY_COPY);
  const saver = useRef(null);
  const live = useRef({});
  const audioInput = useRef(null);
  const coverInput = useRef(null);
  const errors = useRef([]);

  useEffect(() => {
    const draftKey = AUDIO_STORY_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
    const s = createSaver({ store, draftKey, storage: readOnly ? null : (typeof localStorage !== "undefined" ? localStorage : null), onStatus: setStatus });
    saver.current = s;
    let alive = true;
    s.load().then(got => {
      if (!alive) return;
      live.current = got.answers; setAnswers(got.answers); setSubmitted(got.submitted_at);
      if (!readOnly && !String(got.answers.headline || "").trim() && classId && viewer?.id) {
        exerciseStory({ classId, viewerId: viewer.id }).then(h => {
          if (alive && h && !String(live.current.headline || "").trim()) {
            live.current = { ...live.current, headline: h };
            setAnswers(live.current);
            s.change("headline", h);
          }
        }).catch(() => {});
      }
    }).catch(() => { if (alive) setStatus("failed-load"); });
    if (!readOnly && classId && viewer?.id) lockOf({ classId, viewerId: viewer.id }).then(l => { if (alive) setLock(l); }).catch(() => {});
    if (classId && viewer?.id) pairsFor(classId).then(list => { if (alive) setPair(pairOf(list)[lower(viewer.id)] || null); });
    const tick = setInterval(() => setNow(Date.now()), 30000);
    if (readOnly) return () => { alive = false; clearInterval(tick); s.destroy(); };
    const flush = () => s.flush();
    const hidden = () => { if (document.visibilityState === "hidden") s.flush(); };
    const leaving = (e) => { if (Object.keys(s.pending()).length) { s.flush(); e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("beforeunload", leaving);
    return () => {
      alive = false; clearInterval(tick);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("beforeunload", leaving);
      s.flush(); s.destroy();
    };
  }, [store, viewer?.id, classId, readOnly]);

  const story = useMemo(() => audioStoryOf(answers || {}), [answers]);
  const paths = [story.cover?.path, story.audio?.path].filter(p => p && !urls[p]);
  const pathKey = paths.join("|");
  useEffect(() => {
    if (!pathKey) return;
    let alive = true;
    signUrls(pathKey.split("|")).then(got => { if (alive) setUrls(u => ({ ...got, ...u })); }).catch(() => {});
    return () => { alive = false; };
  }, [pathKey]);
  // Signed links last an hour. Ask again before they lapse.
  useEffect(() => {
    const t = setInterval(() => { const cur = audioStoryOf(live.current); signUrls([cur.cover?.path, cur.audio?.path].filter(Boolean)).then(got => setUrls(u => ({ ...u, ...got }))).catch(() => {}); }, 45 * 60000);
    return () => clearInterval(t);
  }, []);

  const locked = lockedNow(lock, now);
  const canEdit = !readOnly && !locked;

  const set = (field, value) => {
    if (!canEdit) return;
    live.current = { ...live.current, [field]: value };
    setAnswers(live.current);
    saver.current.change(field, value);
  };
  const setList = (field, list) => set(field, list.length ? JSON.stringify(list) : "");
  const voices = story.voices, sounds = story.sounds;
  const patchVoice = (id, patch) => setList("voices", voices.map(v => (v.id === id ? { ...v, ...patch } : v)));
  const patchSound = (id, patch) => setList("sounds", sounds.map(s => (s.id === id ? { ...s, ...patch } : s)));

  // One upload, start to finish. A failure stays on the page with Try again.
  const send = async (what, file) => {
    if (!canEdit || !file) return;
    const patch = (p) => setSending(x => ({ ...(x || {}), what, file, ...p }));
    patch({ progress: 0, error: "", stage: what === "cover" ? "Getting the picture ready" : "Checking the file" });
    try {
      if (what === "cover") {
        if (!looksLikeImage(file)) throw new Error("This file is not a picture. Upload a JPEG, PNG or iPhone photo.");
        const { blob, w, h } = await prepImage(file);
        const path = classId + "/" + viewer.id + "/" + letterId(12) + ".jpg";
        patch({ stage: "Uploading" });
        await uploadImage({ path, blob, onProgress: (p) => patch({ progress: p }) });
        setUrls(m => ({ ...m, [path]: URL.createObjectURL(blob) }));
        set("cover", JSON.stringify({ path, w, h }));
      } else {
        const value = await sendAudio({ file, classId, viewerId: viewer.id, maxSeconds: MAX_STORY_SECONDS, onProgress: (p) => patch({ stage: "Uploading", progress: p }) });
        set("audio", value);
      }
      setSending(null);
    } catch (e) {
      const m = String(e.message || "The upload did not finish.");
      errors.current = [...errors.current.slice(-9), { at: new Date().toISOString(), name: file.name, error: m }];
      patch({ error: /refused \(415\)/.test(m) ? "Audio files are not switched on for this sheet yet. Tell Dr. Ishak." : m, stage: "" });
    }
  };

  const submit = async () => {
    if (problemsOf(story).length) { setSubmitting("problems"); return; }
    setSubmitting("sending");
    try {
      await saver.current.flush();
      if (Object.keys(saver.current.pending()).length) { setSubmitting("unsaved"); return; }
      const at = await store.submit();
      setSubmitted(at || new Date().toISOString());
      setSubmitting("");
      setDone(true);
    } catch { setSubmitting("failed"); }
  };

  const me = lower(viewer?.id);
  const partners = pair ? pair.members.filter(m => m !== me).map(m => (pair.names || [])[pair.members.indexOf(m)] || m) : [];
  const by = [viewer?.name, ...partners].filter(Boolean).join(" and ");

  if (!answers) return <div className="ass"><style>{CSS}</style><p className="ass-p">{STATUS[status] || "Loading"}</p></div>;
  if (readOnly) return <div className="ass"><style>{CSS}</style><div className="ass-solo"><AudioStoryView story={story} urls={urls} showPrivate by={by} /></div></div>;

  const problems = problemsOf(story);
  const listenWords = wordsIn(story.listen);
  const marked = voices.filter(v => v.knew !== null).length;
  const toggleSteps = () => { const next = !stepsOpen; setStepsOpen(next); remember("audio-story-steps", next ? "open" : "hidden"); };
  const counts = (
    <div className="ass-counts">
      <Meter n={story.audio ? clock(story.audio.seconds) : "0:00"} line={"of " + clock(MAX_STORY_SECONDS)} pct={story.audio ? story.audio.seconds / MAX_STORY_SECONDS : 0} ok={!!story.audio && story.audio.seconds <= MAX_STORY_SECONDS + 0.9} />
      <Meter n={listenWords + (listenWords === 1 ? " word" : " words")} line={"listen line, up to " + MAX_LISTEN_WORDS} pct={listenWords / MAX_LISTEN_WORDS} ok={listenWords > 0 && listenWords <= MAX_LISTEN_WORDS} />
      <Meter n={marked + " of " + voices.length} line="voices marked" pct={voices.length ? marked / voices.length : 0} ok={voices.length > 0 && marked === voices.length} />
    </div>
  );

  return (
    <div className="ass">
      <style>{CSS}</style>
      <header className="ass-hello">
        <div className="ass-hello-top">
          <Words k="hello" copy={copy} editing={editing} as="h1" className="ass-hello-h" />
          <span className={"ass-status" + (status === "retrying" ? " ass-status-bad" : status === "saved" ? " ass-status-ok" : "")} aria-live="polite">{STATUS[status]}</span>
        </div>
        <Words k="sub" copy={copy} editing={editing} as="p" className="ass-hello-sub" />
        <nav className="ass-doors" aria-label="More for your story">
          <a className="ass-door" href={researchHref(classId)} target="_blank" rel="noreferrer">
            <span className="ass-door-name">Audio exercise</span>
            <span className="ass-door-say">Your story, your treatment and your research.</span>
          </a>
          <a className="ass-door" href={"/" + classId + "/worksheets/" + AUDIO_IDEAS_KEY + "?all"} target="_blank" rel="noreferrer">
            <span className="ass-door-name">Everyone's ideas</span>
            <span className="ass-door-say">Every idea in your section, and who is working with whom.</span>
          </a>
        </nav>
        <div className="ass-row">
          <button type="button" className="ass-link-btn" onClick={toggleSteps} aria-expanded={stepsOpen}>{stepsOpen ? "Hide the steps" : "Show the steps"}</button>
          {editor ? <button type="button" className="ass-btn" aria-pressed={editing} onClick={() => { setEditing(e => !e); if (!stepsOpen) setStepsOpen(true); }}>{editing ? "Done editing the words" : "Edit the words"}</button> : null}
          {editor && copy.status ? <span className="ass-muted" aria-live="polite">{copy.status}</span> : null}
        </div>
        {stepsOpen ? (
          <ol className="ass-steps">
            {STEPS.map(([k]) => (
              <li key={k} className="ass-step">
                <Words k={"step." + k + ".name"} copy={copy} editing={editing} as="b" className="ass-step-name" />
                <Words k={"step." + k + ".say"} copy={copy} editing={editing} className="ass-step-say" />
              </li>
            ))}
          </ol>
        ) : null}
        {locked ? <div className="ass-note">The due date has passed, so your story is locked. If you need more time, talk to Dr. Ishak.</div> : null}
        {lock && lock.until && Date.parse(lock.until) > now ? <div className="ass-note">Dr. Ishak unlocked your story until {when(lock.until)}.</div> : null}
      </header>

      <div className="ass-bar">
        {counts}
        <span className="ass-grow" />
        <div className="ass-tabs" role="tablist" aria-label="Build or hear your story">
          <button type="button" role="tab" aria-selected={pane === "build"} className="ass-tab" onClick={() => setPane("build")}>Build</button>
          <button type="button" role="tab" aria-selected={pane === "see"} className="ass-tab" onClick={() => setPane("see")}>Hear your story</button>
        </div>
      </div>

      <div className={"ass-work ass-on-" + pane}>
        <section className="ass-build" aria-label="Build your story">
          <div className="ass-field">
            <span className="ass-label">Your story</span>
            {story.audio ? (
              <div className="ass-clip">
                {urls[story.audio.path] ? <audio controls preload="metadata" src={urls[story.audio.path]} /> : <span className="ass-muted">Loading your file</span>}
                <div className="ass-row">
                  <span className="ass-file">{story.audio.name || "Your file"}</span>
                  <span className={story.audio.seconds <= MAX_STORY_SECONDS + 0.9 ? "ass-good-text" : "ass-bad"}>{clock(story.audio.seconds)}{story.audio.seconds <= MAX_STORY_SECONDS + 0.9 ? ", under the five minutes" : ", over the five minutes"}</span>
                  <button type="button" className="ass-mini" disabled={!canEdit || !!sending} onClick={() => audioInput.current && audioInput.current.click()}>Swap the file</button>
                </div>
              </div>
            ) : (
              <div className="ass-drop">
                <p className="ass-drop-h">Upload your audio file</p>
                <button type="button" className="ass-go" disabled={!canEdit || !!sending} onClick={() => audioInput.current && audioInput.current.click()}>Choose the file</button>
                <p className="ass-drop-small">{FORMAT_SAY}. Up to five minutes and under 30 MB.</p>
              </div>
            )}
            <input ref={audioInput} type="file" accept=".m4a,.mp3,.wav,.aac,audio/*" hidden onChange={e => { send("audio", e.target.files && e.target.files[0]); e.target.value = ""; }} />
            {sending && sending.what === "audio" ? <Sending s={sending} onRetry={() => send("audio", sending.file)} onDismiss={() => setSending(null)} /> : null}
          </div>

          <div className="ass-field">
            <span className="ass-label">Your cover</span>
            <div className="ass-coverrow">
              {story.cover && urls[story.cover.path] ? <img className="ass-cover" src={urls[story.cover.path]} alt="" /> : <span className="ass-cover ass-cover-none">No cover yet</span>}
              <div className="ass-drop ass-drop-small-box">
                <button type="button" className="ass-go" disabled={!canEdit || !!sending} onClick={() => coverInput.current && coverInput.current.click()}>{story.cover ? "Replace the picture" : "Choose a picture"}</button>
                <p className="ass-drop-small">One JPEG, PNG or iPhone photo. Square works best. Crop on your phone first.</p>
              </div>
            </div>
            <input ref={coverInput} type="file" accept="image/*,.heic,.heif" hidden onChange={e => { send("cover", e.target.files && e.target.files[0]); e.target.value = ""; }} />
            {sending && sending.what === "cover" ? <Sending s={sending} onRetry={() => send("cover", sending.file)} onDismiss={() => setSending(null)} /> : null}
          </div>

          <label className="ass-field">
            <span className="ass-label">Headline</span>
            <input className="ass-input ass-headline" value={answers.headline || ""} maxLength={200} readOnly={!canEdit} placeholder="Your headline" onChange={e => set("headline", e.target.value)} />
          </label>

          <label className="ass-field">
            <span className="ass-label">Listen line</span>
            <textarea className="ass-input" rows={3} value={answers.listen || ""} maxLength={600} readOnly={!canEdit} placeholder="What is a listener about to hear?" onChange={e => set("listen", e.target.value)} />
            <span className={"ass-muted" + (listenWords > MAX_LISTEN_WORDS ? " ass-bad" : "")}>{listenWords} of {MAX_LISTEN_WORDS} words</span>
          </label>

          <div className="ass-field">
            <span className="ass-label">Voices</span>
            <ul className="ass-list">
              {voices.map((v, i) => (
                <li key={v.id} className={"ass-card" + (v.knew === null ? " ass-card-need" : "")}>
                  <div className="ass-two">
                    <input className="ass-input" value={v.name} maxLength={120} readOnly={!canEdit} placeholder={i === 0 ? "Who, like you, the narrator" : "Who, like Coach Dana Ruiz"} onChange={e => patchVoice(v.id, { name: e.target.value })} />
                    <input className="ass-input" value={v.role} maxLength={160} readOnly={!canEdit} placeholder="Where in the story, like interview at 1:40" onChange={e => patchVoice(v.id, { role: e.target.value })} />
                  </div>
                  <div className="ass-row">
                    <span className={"ass-muted" + (v.knew === null ? " ass-warn" : "")}>Knew they were being recorded?</span>
                    <button type="button" className="ass-pill" aria-pressed={v.knew === true} disabled={!canEdit} onClick={() => patchVoice(v.id, { knew: true })}>Yes</button>
                    <button type="button" className="ass-pill" aria-pressed={v.knew === false} disabled={!canEdit} onClick={() => patchVoice(v.id, { knew: false })}>No</button>
                    <span className="ass-grow" />
                    <button type="button" className="ass-mini" disabled={!canEdit} onClick={() => setList("voices", voices.filter(x => x.id !== v.id))}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" className="ass-btn ass-add" disabled={!canEdit} onClick={() => setList("voices", [...voices, { id: letterId(6), name: voices.length ? "" : (viewer?.name || ""), role: voices.length ? "" : "Narrator", knew: voices.length ? null : true }])}>Add a voice</button>
          </div>

          <div className="ass-field">
            <span className="ass-label">Sounds</span>
            <ul className="ass-list">
              {sounds.map(s => (
                <li key={s.id} className={"ass-card" + (s.kind !== "mine" && !s.from.trim() ? " ass-card-need" : "")}>
                  <input className="ass-input" value={s.what} maxLength={160} readOnly={!canEdit} placeholder="What, like water in lane 4, or the song's name" onChange={e => patchSound(s.id, { what: e.target.value })} />
                  <div className="ass-row">
                    {SOUND_KINDS.map(([id, name]) => <button key={id} type="button" className="ass-pill" aria-pressed={s.kind === id} disabled={!canEdit} onClick={() => patchSound(s.id, { kind: id })}>{name}</button>)}
                    <span className="ass-grow" />
                    <button type="button" className="ass-mini" disabled={!canEdit} onClick={() => setList("sounds", sounds.filter(x => x.id !== s.id))}>Remove</button>
                  </div>
                  {s.kind !== "mine" ? <input className="ass-input" value={s.from} maxLength={300} readOnly={!canEdit} placeholder={s.kind === "music" ? "Where it came from, like Free Music Archive, CC BY, by Lamplight Trio" : "Where it came from, like a 2024 meet broadcast"} onChange={e => patchSound(s.id, { from: e.target.value })} /> : null}
                </li>
              ))}
            </ul>
            <button type="button" className="ass-btn ass-add" disabled={!canEdit} onClick={() => setList("sounds", [...sounds, { id: letterId(6), what: "", kind: "mine", from: "" }])}>Add a sound</button>
          </div>

          {pair ? (
            <label className="ass-field">
              <span className="ass-label">Made with</span>
              <span className="ass-muted">{partners.length ? <>You are working with <b>{partners.join(" and ")}</b>{pair.story ? <> on <b>{pair.story}</b></> : null}. Each of you submits your own copy of the story, so write who did what.</> : <>You are working on your own{pair.story ? <> on <b>{pair.story}</b></> : null}.</>}</span>
              {partners.length ? <textarea className="ass-input" rows={2} value={answers.credits || ""} maxLength={600} readOnly={!canEdit} placeholder="Who did what" onChange={e => set("credits", e.target.value)} /> : null}
            </label>
          ) : null}

          <div className="ass-field">
            <span className="ass-label">Your look</span>
            <div className="ass-looks">
              {[["light", "White page"], ["dark", "Black page"]].map(([id, name]) => (
                <button key={id} type="button" className={"ass-look ass-look-" + id} aria-pressed={story.look === id} disabled={!canEdit} onClick={() => set("look", id)}>
                  <span className="ass-look-swatch" aria-hidden="true"><span>Aa</span></span>{name}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="ass-see" aria-label="Story preview">
          {counts}
          <div className="ass-see-head">
            <span className="ass-label">Your story page</span>
          </div>
          <div className={"ass-see-frame ass-frame-" + story.look}>
            <AudioStoryView story={story} urls={urls} by={by} />
          </div>
        </section>
      </div>

      <footer className="ass-end">
        <button type="button" className="ass-go ass-submit" disabled={!canEdit || submitting === "sending"} onClick={submit}>
          {submitting === "sending" ? "Submitting" : submitted ? "Submit again" : "Submit"}
        </button>
        {submitting === "problems" && problems.length ? (
          <div className="ass-fix">
            <b>Almost there! Before you submit:</b>
            <ul className="ass-fix-list">{problems.map(p => <li key={p}>{p}</li>)}</ul>
          </div>
        ) : null}
        {submitting === "unsaved" ? <span className="ass-bad">Your story is not saved yet, so the submission did not go through. Try again in a moment.</span> : null}
        {submitting === "failed" ? <span className="ass-bad">The submission did not go through. Check your connection and try again.</span> : null}
        {submitted && !submitting ? <span className="ass-good-text">Submitted {when(submitted)}. You can keep editing until the due date.</span> : null}
        <ReportProblem classId={classId} saver={saver} status={status} errors={errors} />
      </footer>
      {done ? (
        <div className="ass-pop" role="dialog" aria-modal="true" aria-labelledby="ass-pop-h" onClick={e => { if (e.target === e.currentTarget) setDone(false); }}>
          <div className="ass-pop-card">
            <h2 id="ass-pop-h" className="ass-pop-h">{copy.say("done.h")}</h2>
            <p className="ass-pop-p">{copy.say("done.p")}</p>
            <div className="ass-row"><button type="button" className="ass-go" onClick={() => setDone(false)}>Back to my story</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Sending({ s, onRetry, onDismiss }) {
  return (
    <div className="ass-up">
      <span className="ass-up-name">{s.file?.name || "Your file"}</span>
      {s.error ? (
        <>
          <span className="ass-bad">{s.error}</span>
          <span className="ass-row">
            <button type="button" className="ass-btn" onClick={onRetry}>Try again</button>
            <button type="button" className="ass-btn" onClick={onDismiss}>Dismiss</button>
          </span>
        </>
      ) : (
        <>
          <span className="ass-muted">{s.stage}{s.stage === "Uploading" ? " " + Math.round((s.progress || 0) * 100) + "%" : ""}</span>
          <span className="ass-meter"><span className="ass-meter-in" style={{ width: Math.round((s.progress || 0) * 100) + "%" }} /></span>
        </>
      )}
    </div>
  );
}

function Meter({ n, line, pct, ok }) {
  return (
    <span className={"ass-count" + (ok ? " ass-count-ok" : "")}>
      <span className="ass-count-n">{n}</span>
      <span className="ass-count-l">{line}</span>
      <span className="ass-count-bar"><span className="ass-count-fill" style={{ width: Math.min(100, Math.round(pct * 100)) + "%" }} /></span>
    </span>
  );
}

function ReportProblem({ classId, saver, status, errors }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState("");
  const send = async () => {
    setSent("sending");
    const details = { status, pending: Object.keys(saver.current ? saver.current.pending() : {}), errors: errors.current, page: location.pathname, agent: navigator.userAgent, at: new Date().toISOString() };
    const r = await gameClient.from("worksheet_reports").insert({ worksheet_key: AUDIO_STORY_KEY, group_key: classId, message: text.slice(0, 4000), details }).select("id");
    setSent(r.error ? "failed" : "sent");
    if (!r.error) setText("");
  };
  if (!open) return <button type="button" className="ass-link-btn ass-report" onClick={() => { setOpen(true); setSent(""); }}>Something not working? Report a problem</button>;
  return (
    <div className="ass-report-box">
      <label className="ass-field">
        <span className="ass-label">What went wrong? Dr. Ishak gets your note and the details from this page.</span>
        <textarea className="ass-input" rows={3} value={text} maxLength={4000} onChange={e => setText(e.target.value)} />
      </label>
      <div className="ass-row">
        <button type="button" className="ass-go" disabled={sent === "sending"} onClick={send}>Send</button>
        <button type="button" className="ass-btn" onClick={() => setOpen(false)}>Close</button>
        {sent === "sent" ? <span className="ass-good-text">Sent. Dr. Ishak will see your report.</span> : null}
        {sent === "failed" ? <span className="ass-bad">The report did not send. Email Dr. Ishak instead.</span> : null}
      </div>
    </div>
  );
}

export function mountAudioStory(root, { store, viewer, readOnly = false, classId, editor = false } = {}) {
  const r = createRoot(root);
  r.render(<AudioStorySheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} />);
  return { destroy() { r.unmount(); } };
}

// The story's own page is pure white or pure black, the student's choice, so
// those colors are the story's and not the site theme's.
const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const SERIF = "'Lora', 'Iowan Old Style', Charter, Georgia, serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const CSS = `
.ass{padding:22px 20px 90px;color:${T.primary};max-width:1360px;margin:0 auto}
.ass-p{margin:0;font-size:16px;color:${T.secondary}}
.ass-muted{font-size:14px;color:${T.muted}}
.ass-warn{color:${ST.warn};font-weight:600}
.ass-bad{color:${ST.late};font-size:15px}
.ass-good-text{color:${ST.ok};font-size:15px;font-weight:600}
.ass-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ass-grow{flex:1}

.ass-hello{display:flex;flex-direction:column;gap:10px;margin-bottom:18px}
.ass-hello-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.ass-hello-h{margin:0;font-family:${SERIF};font-size:40px;font-weight:600;letter-spacing:-.015em;line-height:1.1}
.ass-hello-sub{margin:0;font-size:17px;color:${T.secondary}}
.ass-status{margin-left:auto;font-size:13px;font-weight:600;color:${T.muted};border:1px solid ${L.soft};border-radius:999px;padding:4px 12px}
.ass-status-ok{color:${ST.ok};border-color:${ST.ok}}
.ass-status-bad{color:${ST.late};border-color:${ST.late}}
.ass-steps{list-style:none;counter-reset:step;margin:6px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px 32px}
.ass-step{counter-increment:step;position:relative;padding-left:44px;display:flex;flex-direction:column;gap:2px}
.ass-step::before{content:counter(step);position:absolute;left:0;top:-2px;width:32px;height:32px;border-radius:50%;background:${T.primary};color:${S.page};font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center}
.ass-step-name{font-size:17px;font-weight:700}
.ass-step-say{font-size:15.5px;line-height:1.5;color:${T.secondary}}
.ass-note{border-left:4px solid ${ST.warn};padding:10px 14px;font-size:16px;background:${S.sunk};border-radius:6px}
.ass-doors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:4px 0 2px}
.ass-door{display:flex;flex-direction:column;gap:4px;padding:14px 18px;border-radius:14px;background:${S.card};color:${T.primary};text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,.05),0 0 0 1px ${L.strong};transition:box-shadow .15s,transform .15s}
.ass-door:hover{box-shadow:0 6px 18px -8px rgba(0,0,0,.25),0 0 0 1.5px ${T.primary};transform:translateY(-1px)}
.ass-door:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.ass-door-name{display:flex;align-items:center;gap:8px;font-family:${SERIF};font-size:20px;font-weight:600;line-height:1.2}
.ass-door-name::after{content:"→";margin-left:auto;font-family:system-ui,sans-serif;font-size:18px;color:${T.muted}}
.ass-door-say{font-size:14px;line-height:1.4;color:${T.secondary}}
.ass-link-btn{font:inherit;font-size:14px;font-weight:600;padding:0;border:0;background:none;color:${T.secondary};text-decoration:underline;text-underline-offset:3px;cursor:pointer;margin-right:10px}

.ass-bar{position:sticky;top:60px;z-index:6;display:none;align-items:center;gap:22px;flex-wrap:wrap;padding:12px 16px;margin-bottom:18px;border-radius:14px;background:${S.card};box-shadow:0 1px 2px rgba(0,0,0,.06),0 0 0 1px ${L.soft}}
.ass-counts{display:flex;align-self:flex-start;border-radius:12px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.ass-bar .ass-counts{box-shadow:none;background:transparent}
.ass-count{display:flex;flex-direction:column;gap:3px;padding:8px 16px;min-width:116px}
.ass-count+.ass-count{border-left:1px solid ${L.soft}}
.ass-count-n{font-size:22px;font-weight:700;line-height:1.1;white-space:nowrap;color:${ST.warn}}
.ass-count-ok .ass-count-n{color:${ST.ok}}
.ass-count-l{font-size:13px;color:${T.muted};white-space:nowrap}
.ass-count-bar{height:4px;margin-top:2px;border-radius:999px;background:${S.sunk};overflow:hidden}
.ass-count-fill{display:block;height:100%;background:${ST.warn};transition:width .25s}
.ass-count-ok .ass-count-fill{background:${ST.ok}}
.ass-tabs{display:none;gap:4px;padding:3px;border-radius:999px;background:${S.sunk}}
.ass-tab{font:inherit;font-size:14px;font-weight:600;padding:7px 14px;border-radius:999px;border:0;background:transparent;color:${T.secondary};cursor:pointer}
.ass-tab[aria-selected="true"]{background:${S.card};color:${T.primary};box-shadow:0 1px 2px rgba(0,0,0,.12)}

.ass-work{display:grid;grid-template-columns:minmax(380px,520px) minmax(0,1fr);gap:28px;align-items:start}
.ass-build{display:flex;flex-direction:column;gap:18px;min-width:0}
.ass-see{position:sticky;top:80px;display:flex;flex-direction:column;gap:8px;min-width:0}
.ass-see-head{display:flex;align-items:center;gap:10px}
.ass-see-frame{border-radius:16px;overflow:auto;max-height:calc(100vh - 190px);box-shadow:0 10px 40px -12px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.08)}

.ass-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.ass-label{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${T.muted}}
.ass-input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.5;padding:10px 12px;border:1px solid ${L.strong};border-radius:10px;background:${S.card};color:${T.primary};resize:vertical}
.ass-headline{font-family:${SERIF};font-size:24px;font-weight:600;padding:12px 14px}
.ass-input:focus-visible,.ass-btn:focus-visible,.ass-go:focus-visible,.ass-pill:focus-visible,.ass-mini:focus-visible,.ass-look:focus-visible,.ass-tab:focus-visible,.ass-link-btn:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.ass-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}

.ass-clip{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:16px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.ass-clip audio{width:100%}
.ass-file{font-weight:600;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%}
.ass-drop{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:26px 18px;border:2px dashed ${L.strong};border-radius:18px;background:${S.sunk}}
.ass-drop-h{margin:0;font-family:${SERIF};font-size:22px;font-weight:600}
.ass-drop-small{margin:6px 0 0;font-size:13.5px;color:${T.muted};max-width:40ch}
.ass-drop-small-box{padding:16px 14px}
.ass-coverrow{display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:center}
.ass-cover{display:block;width:120px;height:120px;object-fit:cover;border-radius:14px;background:${S.sunk};box-shadow:0 1px 3px rgba(0,0,0,.15)}
.ass-cover-none{display:flex;align-items:center;justify-content:center;font-size:13px;color:${T.muted};box-shadow:none;border:1px dashed ${L.strong}}
.ass-up{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:12px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.ass-up-name{font-weight:600;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ass-meter{height:6px;border-radius:999px;background:${S.sunk};overflow:hidden}
.ass-meter-in{display:block;height:100%;background:${T.primary};transition:width .2s}

.ass-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.ass-card{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:14px;background:${S.card};box-shadow:0 1px 2px rgba(0,0,0,.05),0 0 0 1px ${L.soft}}
.ass-card-need{box-shadow:0 1px 2px rgba(0,0,0,.05),0 0 0 1.5px ${ST.warn}}
.ass-add{align-self:flex-start}
.ass-looks{display:flex;gap:10px}
.ass-look{display:flex;align-items:center;gap:10px;font:inherit;font-size:15px;font-weight:600;padding:8px 14px 8px 8px;border-radius:12px;border:1.5px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.ass-look[aria-pressed="true"]{border-color:${T.primary};box-shadow:inset 0 0 0 1.5px ${T.primary}}
.ass-look-swatch{width:44px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:${SERIF};font-size:16px;font-weight:600;box-shadow:0 0 0 1px rgba(0,0,0,.15)}
.ass-look-light .ass-look-swatch{background:#fff;color:#111}
.ass-look-dark .ass-look-swatch{background:#0b0b0c;color:#f4f4f2}

.ass-btn{font:inherit;font-size:14px;font-weight:600;padding:7px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.ass-btn[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.ass-mini{font:inherit;font-size:12.5px;font-weight:600;padding:4px 10px;border-radius:999px;border:1px solid ${L.soft};background:transparent;color:${T.secondary};cursor:pointer}
.ass-mini:hover:not(:disabled){border-color:${L.strong};color:${T.primary}}
.ass-pill{font:inherit;font-size:13.5px;padding:5px 12px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer}
.ass-pill[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.ass-btn:disabled,.ass-go:disabled,.ass-pill:disabled,.ass-mini:disabled,.ass-look:disabled{opacity:.45;cursor:default}
.ass-go{font:inherit;font-size:16px;font-weight:700;padding:11px 22px;border-radius:999px;border:0;background:${T.primary};color:${S.page};cursor:pointer}

.ass-end{display:flex;flex-direction:column;align-items:flex-start;gap:12px;margin-top:28px;padding-top:22px;border-top:1px solid ${L.soft}}
.ass-submit{font-size:18px;padding:14px 34px}
.ass-fix{border-radius:14px;padding:12px 16px;font-size:15.5px;background:${S.sunk};box-shadow:inset 4px 0 0 ${ST.warn}}
.ass-fix-list{margin:6px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:4px}
.ass-report{margin-top:10px}
.ass-report-box{display:flex;flex-direction:column;gap:8px;width:100%;max-width:560px;margin-top:10px}
.ass-pop{position:fixed;inset:0;z-index:60;background:rgba(20,16,12,.55);display:flex;align-items:center;justify-content:center;padding:16px}
.ass-pop-card{width:100%;max-width:520px;background:#fff;color:#141414;border-radius:20px;padding:28px 26px;display:flex;flex-direction:column;gap:12px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5)}
.ass-pop-h{margin:0;font-size:26px;font-weight:700;letter-spacing:-.01em}
.ass-pop-p{margin:0;font-size:17px;line-height:1.55}
.ass-solo{max-width:820px;margin:0 auto;border-radius:16px;overflow:hidden}

.vsp-edit.ass-hello-h{font-family:${SERIF};font-size:40px;font-weight:600}
.vsp-edit.ass-step-name{font-weight:700}
.ass .vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.45;padding:4px 8px;margin:0;border:1.5px dashed ${L.strong};border-radius:8px;background:${S.card};resize:none;overflow:hidden}

/* The story itself. */
.asr{display:flex;flex-direction:column;min-height:100%;box-sizing:border-box;padding-bottom:44px}
.asr-light{background:#fff;color:#141414}
.asr-dark{background:#0b0b0c;color:#f2f1ee}
.asr-cover{position:relative;min-height:360px;display:flex;align-items:flex-end;overflow:hidden}
.asr-cover-empty{background:rgba(127,127,127,.18)}
.asr-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.asr-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,.72))}
.asr-dark .asr-shade{background:linear-gradient(180deg,transparent 30%,rgba(11,11,12,.96))}
.asr-head{position:relative;padding:120px 40px 26px;display:flex;flex-direction:column;gap:10px;color:#fff;width:100%;box-sizing:border-box}
.asr-cover-empty .asr-head{color:inherit}
.asr-kicker{font-family:${MONO};font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.8}
.asr-h{margin:0;font-family:${SERIF};font-size:40px;font-weight:600;line-height:1.12;letter-spacing:-.01em}
.asr-dek{margin:0;font-family:${SERIF};font-size:18px;line-height:1.5;opacity:.92;max-width:60ch}
.asr-body{padding:26px 40px 0;display:flex;flex-direction:column;gap:22px}
.asr-player{width:100%}
.asr-wait{display:flex;align-items:center;justify-content:center;min-height:54px;font-size:14px;opacity:.5;background:rgba(127,127,127,.15);border-radius:12px}
.asr-empty{margin:0;font-family:${SERIF};font-size:19px;font-style:italic;opacity:.55}
.asr-credits{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding-top:18px;border-top:1px solid rgba(127,127,127,.3)}
.asr-ch{margin:0 0 8px;font-family:${MONO};font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.7;font-weight:500}
.asr-cp{margin:0;font-size:14.5px;line-height:1.55;opacity:.9}
.asr-by{margin:0;font-size:14px;opacity:.75}
.ass-frame-light{background:#fff}
.ass-frame-dark{background:#0b0b0c}

@media (max-width:1060px){
  .ass-work{grid-template-columns:1fr}
  .ass-tabs{display:flex}
  .ass-bar{display:flex}
  .ass-see .ass-counts{display:none}
  .ass-on-build .ass-see{display:none}
  .ass-on-see .ass-build{display:none}
  .ass-see{position:static}
  .ass-see-frame{max-height:none}
}
@media (max-width:620px){
  .ass{padding:16px 14px 80px}
  .ass-hello-h,.vsp-edit.ass-hello-h{font-size:30px}
  .ass-doors{grid-template-columns:1fr}
  .ass-two{grid-template-columns:1fr}
  .ass-credits,.asr-credits{grid-template-columns:1fr}
  .asr-head{padding:90px 18px 20px}
  .asr-h{font-size:30px}
  .asr-body{padding:20px 18px 0}
  .ass-bar{top:56px;gap:14px}
}
`;
export const AUDIO_STORY_CSS = CSS;
