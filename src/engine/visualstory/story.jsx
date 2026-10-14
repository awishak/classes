// The visual story portal: /comm3/worksheets/visual-story.
//
// Planned with Andrew on 2026-10-13 at /comm3/visualessayplanning. A student
// uploads six to eight images, drags them into order, writes captions and
// text, marks why each image made the cut, chooses a white or a black page,
// and submits. Built for a laptop; it still works on a phone.
//
// Andrew, after the first version: "this is a bit ugly though. I want it to
// be pretty. I want there to be clear instructions the way you would explain
// it excitedly to a five year old ... white or black background, students'
// choice, and let's show them how pretty it will look." So on a laptop the
// page is two halves: building on the left, and on the right the finished
// story, live, the way a classmate will read the story.
//
// Every block is its own worksheet answer (model.js), saved through saver.js,
// so typing is never lost and a save touches one block. Photos go through
// photos.js into the student's private folder. The lock at the due date is the
// database's (sql/visual-story-portal.sql); this page only says so.

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "./saver.js";
import { storyOf, problemsOf, wordCount, imageCount, REASONS, LAYOUTS, isPortrait, layoutOf, MIN_IMAGES, MAX_IMAGES, MIN_WORDS, MAX_WORDS } from "./model.js";
import { prepImage, uploadImage, signUrls, letterId, looksLikeImage } from "./photos.js";
import { useCopy, Words } from "./pre.jsx";
import { gameClient } from "../gameClient.js";
import * as TOKENS from "../tokens.js";

export const VISUAL_STORY_KEY = "visual-story";
export const VISUAL_STORY_TITLE = "Visual story";
export const STORY_COPY_ROW = "worksheet-visual-story-plan";

// The steps, said the way you'd say them to someone excited to start.
export const STEPS = [
  ["pick", "Add your pictures.", "Drag six to eight photos and graphics into the big box. Photos straight from your phone work too."],
  ["order", "Put them in order.", "Grab a picture and drag the picture up or down until your story flows from start to finish."],
  ["tell", "Tell the story.", "Write a caption for each picture, and add words between pictures if you want. Use 150 to 300 words in all."],
  ["why", "Say why each picture made the cut.", "Tap at least one reason under each picture. Only Dr. Ishak sees your reasons."],
  ["star", "Pick your star.", "Tap the star on your best picture. Your headline and your star picture are what classmates see first."],
  ["look", "Choose your look.", "White page or black page? Tap one and watch your story change."],
  ["submit", "Peek, then submit.", "Look over your story the way classmates will see your story. When you love your story, press Submit."],
];
export const STORY_COPY = {
  hello: "Let's make your visual story!",
  sub: "Due Friday, October 23, at 11:59 PM. Your work saves by itself as you go.",
  ...Object.fromEntries(STEPS.flatMap(([k, name, say]) => [["step." + k + ".name", name], ["step." + k + ".say", say]])),
};

const STATUS = { loading: "Loading", saved: "Saved", saving: "Saving", retrying: "Not saved, trying again", "failed-load": "Could not load your story. Reload the page." };
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const remember = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } return null; };

// ─── reading a story: the live preview now, classmates later ───

// Every picture is the student's own, so every picture carries their credit.
// While the stories are anonymous the credit reads "by the author"; the name goes on at release.
const creditOf = (b, credit) => (credit == null ? "" : (b.graphic ? "Graphic" : "Photo") + (credit ? ": " + credit : " by the author"));

export function StoryView({ story, urls, showPrivate = false, look, credit }) {
  const images = story.blocks.filter(b => b.type === "image");
  const theme = (look || story.look) === "dark" ? "dark" : "light";
  return (
    <article className={"vsr vsr-" + theme}>
      <h1 className="vsr-h">{story.headline || "Your headline goes here"}</h1>
      {story.link ? <p className="vsr-link">Read the interactive version: <a href={story.link} target="_blank" rel="noreferrer">{story.link}</a></p> : null}
      {!story.blocks.length ? <p className="vsr-empty">Your pictures show up here as you add pictures on the left.</p> : null}
      {story.blocks.map(b => {
        if (b.type === "text") return b.text ? <p key={b.id} className="vsr-text">{b.text}</p> : null;
        const lay = layoutOf(b);
        const n = images.indexOf(b) + 1;
        return (
          <figure key={b.id} className={"vsr-fig vsr-" + lay}>
            {urls[b.path] ? <img className="vsr-img" src={urls[b.path]} alt={b.caption || "Image " + n} /> : <div className="vsr-img vsr-wait">Loading image {n}</div>}
            {b.caption || (b.graphic && b.source) || showPrivate || credit != null ? (
              <figcaption className="vsr-cap">
                {b.caption ? <span className="vsr-cap-text">{b.caption}</span> : null}
                {credit != null || (b.graphic && b.source) ? <span className="vsr-src">{[creditOf(b, credit), b.graphic && b.source ? "Source: " + b.source : ""].filter(Boolean).join(". ")}</span> : null}
                {showPrivate && (b.reasons || []).length ? <span className="vsr-why">Why: {(b.reasons || []).map(r => (REASONS.find(x => x[0] === r) || [r, r])[1]).join(", ")}{b.other ? " (" + b.other + ")" : ""}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </article>
  );
}

// ─── the student's sheet ───

async function preHeadline({ classId, viewerId }) {
  const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", "visual-pre").eq("group_key", classId).eq("viewer_id", viewerId);
  const id = s.data && s.data[0] && s.data[0].id;
  if (!id) return "";
  const r = await gameClient.from("worksheet_answers").select("value,position").eq("sheet_id", id).eq("field", "headline").order("position");
  return (r.data || []).map(x => x.value).join("").trim();
}

async function lockOf({ classId, viewerId }) {
  const d = await gameClient.from("worksheet_deadlines").select("due_at").eq("worksheet_key", VISUAL_STORY_KEY).eq("group_key", classId);
  const due = d.data && d.data[0] ? d.data[0].due_at : null;
  if (!due) return { due: null, until: null };
  const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", VISUAL_STORY_KEY).eq("group_key", classId).eq("viewer_id", viewerId);
  const id = s.data && s.data[0] && s.data[0].id;
  let until = null;
  if (id) { const u = await gameClient.from("worksheet_unlocks").select("until").eq("sheet_id", id); until = u.data && u.data[0] ? u.data[0].until : null; }
  return { due, until };
}
const lockedNow = (lock, now = Date.now()) => !!(lock && lock.due && now > Date.parse(lock.due) && !(lock.until && Date.parse(lock.until) > now));

export function StorySheet({ store, viewer, classId, readOnly = false, editor = false }) {
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const [urls, setUrls] = useState({});
  const [uploads, setUploads] = useState([]);        // { key, name, progress, error, file, stage }
  const [pane, setPane] = useState("build");          // on a narrow screen, one half at a time
  const [submitting, setSubmitting] = useState("");
  const [lock, setLock] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [dragId, setDragId] = useState(null);
  const [dropAt, setDropAt] = useState(null);
  const [fileOver, setFileOver] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(() => remember("visual-story-steps") !== "hidden");
  const copy = useCopy(editor, STORY_COPY_ROW, STORY_COPY);
  const saver = useRef(null);
  const live = useRef({});                             // the latest answers, for saves made from callbacks
  const fileInput = useRef(null);
  const errors = useRef([]);

  useEffect(() => {
    const draftKey = "visual-story:" + (classId || "") + ":" + (viewer?.id || "");
    const s = createSaver({ store, draftKey, storage: readOnly ? null : (typeof localStorage !== "undefined" ? localStorage : null), onStatus: setStatus });
    saver.current = s;
    let alive = true;
    s.load().then(got => {
      if (!alive) return;
      live.current = got.answers; setAnswers(got.answers); setSubmitted(got.submitted_at);
      // A story with no headline starts from the one on the student's pre-production page.
      if (!readOnly && !String(got.answers.headline || "").trim() && classId && viewer?.id) {
        preHeadline({ classId, viewerId: viewer.id }).then(h => {
          if (alive && h && !String(live.current.headline || "").trim()) {
            live.current = { ...live.current, headline: h };
            setAnswers(live.current);
            s.change("headline", h);
          }
        }).catch(() => {});
      }
    }).catch(() => { if (alive) setStatus("failed-load"); });
    if (!readOnly && classId && viewer?.id) lockOf({ classId, viewerId: viewer.id }).then(l => { if (alive) setLock(l); }).catch(() => {});
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

  const story = useMemo(() => storyOf(answers || {}), [answers]);
  const paths = story.blocks.filter(b => b.type === "image").map(b => b.path).filter(p => p && !urls[p]);
  const pathKey = paths.join("|");
  useEffect(() => {
    if (!pathKey) return;
    let alive = true;
    signUrls(pathKey.split("|")).then(got => { if (alive) setUrls(u => ({ ...got, ...u })); }).catch(() => {});
    return () => { alive = false; };
  }, [pathKey]);
  // Signed links last an hour. Ask again before they lapse.
  useEffect(() => {
    const t = setInterval(() => { const all = storyOf(live.current).blocks.map(b => b.path).filter(Boolean); signUrls(all).then(got => setUrls(u => ({ ...u, ...got }))).catch(() => {}); }, 45 * 60000);
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
  const setBlock = (id, patch) => {
    const cur = storyOf(live.current).blocks.find(b => b.id === id);
    if (!cur) return;
    const { id: _drop, ...rest } = { ...cur, ...patch };
    set("block:" + id, JSON.stringify(rest));
  };
  const setOrder = (ids) => set("order", JSON.stringify(ids));
  const addBlock = (block) => {
    const id = letterId();
    set("block:" + id, JSON.stringify(block));
    setOrder([...storyOf(live.current).blocks.map(b => b.id).filter(x => x !== id), id]);
    return id;
  };
  const removeBlock = (id) => {
    setOrder(storyOf(live.current).blocks.map(b => b.id).filter(x => x !== id));
    set("block:" + id, "");
    if (live.current.feature === id) set("feature", "");
  };
  const move = (id, to) => {
    const ids = storyOf(live.current).blocks.map(b => b.id).filter(x => x !== id);
    ids.splice(Math.max(0, Math.min(to, ids.length)), 0, id);
    setOrder(ids);
  };

  // One upload, start to finish. A failure stays on the list with Retry.
  const runUpload = async (u) => {
    const patch = (p) => setUploads(list => list.map(x => (x.key === u.key ? { ...x, ...p } : x)));
    patch({ progress: 0, error: "", stage: "Getting the picture ready" });
    try {
      const { blob, w, h } = await prepImage(u.file);
      const path = classId + "/" + viewer.id + "/" + letterId(12) + ".jpg";
      patch({ stage: "Uploading" });
      await uploadImage({ path, blob, onProgress: (p) => patch({ progress: p }) });
      setUrls(m => ({ ...m, [path]: URL.createObjectURL(blob) }));
      const id = addBlock({ type: "image", path, w, h, layout: "full", caption: "", graphic: false, source: "", reasons: [], other: "" });
      if (!live.current.feature) set("feature", id);
      setUploads(list => list.filter(x => x.key !== u.key));
    } catch (e) {
      errors.current = [...errors.current.slice(-9), { at: new Date().toISOString(), name: u.name, error: e.message }];
      patch({ error: e.message || "The upload did not finish.", stage: "" });
    }
  };
  const addFiles = async (files) => {
    if (!canEdit) return;
    const list = [...files];
    const fresh = list.map(f => ({ key: letterId(10), name: f.name || "photo", file: f, progress: 0, error: looksLikeImage(f) ? "" : "This file is not a picture. Upload a JPEG, PNG or iPhone photo.", stage: "Waiting" }));
    setUploads(u => [...u, ...fresh]);
    // One at a time, so a slow connection finishes each photo rather than all of them at a crawl.
    for (const u of fresh) if (!u.error) await runUpload(u);
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
    } catch { setSubmitting("failed"); }
  };

  if (!answers) return <div className="vss"><style>{CSS}</style><p className="vss-p">{STATUS[status] || "Loading"}</p></div>;
  if (readOnly) return <div className="vss"><style>{CSS}</style><div className="vss-solo"><StoryView story={story} urls={urls} showPrivate credit={viewer?.name || ""} /></div></div>;

  const words = wordCount(story), images = imageCount(story);
  const problems = problemsOf(story);
  const imagesOk = images >= MIN_IMAGES && images <= MAX_IMAGES, wordsOk = words >= MIN_WORDS && words <= MAX_WORDS;
  const toggleSteps = () => { const next = !stepsOpen; setStepsOpen(next); remember("visual-story-steps", next ? "open" : "hidden"); };
  const imageNo = (b) => story.blocks.filter(x => x.type === "image").indexOf(b) + 1;

  return (
    <div className="vss" onDragOver={e => { if (canEdit && [...(e.dataTransfer?.types || [])].includes("Files")) { e.preventDefault(); setFileOver(true); } }}
      onDragLeave={e => { if (e.currentTarget === e.target) setFileOver(false); }}
      onDrop={e => { if (e.dataTransfer?.files?.length) { e.preventDefault(); setFileOver(false); addFiles(e.dataTransfer.files); } }}>
      <style>{CSS}</style>

      <header className="vss-hello">
        <div className="vss-hello-top">
          <Words k="hello" copy={copy} editing={editing} as="h1" className="vss-hello-h" />
          <span className={"vss-status" + (status === "retrying" ? " vss-status-bad" : status === "saved" ? " vss-status-ok" : "")} aria-live="polite">{STATUS[status]}</span>
        </div>
        <Words k="sub" copy={copy} editing={editing} as="p" className="vss-hello-sub" />
        <div className="vss-row">
          <a className="vss-link-btn" href={"/" + classId + "/visual-story"} target="_blank" rel="noreferrer">Read the full instructions</a>
          <a className="vss-link-btn" href={"/" + classId + "/worksheets/visual-pre"} target="_blank" rel="noreferrer">Your pre-production page</a>
          <button type="button" className="vss-link-btn" onClick={toggleSteps} aria-expanded={stepsOpen}>{stepsOpen ? "Hide the steps" : "Show the steps"}</button>
          {editor ? <button type="button" className="vss-btn" aria-pressed={editing} onClick={() => { setEditing(e => !e); if (!stepsOpen) setStepsOpen(true); }}>{editing ? "Done editing the words" : "Edit the words"}</button> : null}
          {editor && copy.status ? <span className="vss-muted" aria-live="polite">{copy.status}</span> : null}
        </div>
        {stepsOpen ? (
          <ol className="vss-steps">
            {STEPS.map(([k]) => (
              <li key={k} className="vss-step">
                <Words k={"step." + k + ".name"} copy={copy} editing={editing} as="b" className="vss-step-name" />
                <Words k={"step." + k + ".say"} copy={copy} editing={editing} className="vss-step-say" />
              </li>
            ))}
          </ol>
        ) : null}
        {locked ? <div className="vss-note">The due date has passed, so your story is locked. If you need more time, talk to Dr. Ishak.</div> : null}
        {lock && lock.until && Date.parse(lock.until) > now ? <div className="vss-note">Dr. Ishak unlocked your story until {when(lock.until)}.</div> : null}
      </header>

      <div className="vss-bar">
        <Meter label="pictures" n={images} min={MIN_IMAGES} max={MAX_IMAGES} ok={imagesOk} />
        <Meter label="words" n={words} min={MIN_WORDS} max={MAX_WORDS} ok={wordsOk} />
        <span className="vss-grow" />
        <div className="vss-tabs" role="tablist" aria-label="Build or see your story">
          <button type="button" role="tab" aria-selected={pane === "build"} className="vss-tab" onClick={() => setPane("build")}>Build</button>
          <button type="button" role="tab" aria-selected={pane === "see"} className="vss-tab" onClick={() => setPane("see")}>See your story</button>
        </div>
      </div>

      <div className={"vss-work vss-on-" + pane}>
        <section className="vss-build" aria-label="Build your story">
          <label className="vss-field">
            <span className="vss-label">Headline</span>
            <input className="vss-input vss-headline" value={answers.headline || ""} maxLength={200} readOnly={!canEdit} placeholder="Your headline" onChange={e => set("headline", e.target.value)} />
          </label>

          <div className="vss-field">
            <span className="vss-label">Your look</span>
            <div className="vss-looks">
              {[["light", "White page"], ["dark", "Black page"]].map(([id, name]) => (
                <button key={id} type="button" className={"vss-look vss-look-" + id} aria-pressed={story.look === id} disabled={!canEdit} onClick={() => set("look", id)}>
                  <span className="vss-look-swatch" aria-hidden="true"><span>Aa</span></span>{name}
                </button>
              ))}
            </div>
          </div>

          <div className={"vss-drop" + (fileOver ? " vss-drop-on" : "")}>
            <p className="vss-drop-h">Drop your pictures here</p>
            <p className="vss-drop-p">or</p>
            <button type="button" className="vss-go" disabled={!canEdit} onClick={() => fileInput.current && fileInput.current.click()}>Choose pictures</button>
            <input ref={fileInput} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
            <p className="vss-drop-small">JPEG, PNG or iPhone photos. Want to crop or brighten a photo? Do that in Canva or on your phone first.</p>
          </div>

          {uploads.length ? (
            <ul className="vss-ups">
              {uploads.map(u => (
                <li key={u.key} className="vss-up">
                  <span className="vss-up-name">{u.name}</span>
                  {u.error ? (
                    <>
                      <span className="vss-bad">{u.error}</span>
                      <span className="vss-row">
                        {looksLikeImage(u.file) ? <button type="button" className="vss-btn" onClick={() => runUpload(u)}>Try again</button> : null}
                        <button type="button" className="vss-btn" onClick={() => setUploads(l => l.filter(x => x.key !== u.key))}>Dismiss</button>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="vss-muted">{u.stage}{u.stage === "Uploading" ? " " + Math.round(u.progress * 100) + "%" : ""}</span>
                      <span className="vss-meter"><span className="vss-meter-in" style={{ width: Math.round(u.progress * 100) + "%" }} /></span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <ol className="vss-cards">
            {story.blocks.map((b, i) => (
              <li key={b.id}
                className={"vss-card" + (dragId === b.id ? " vss-dragging" : "") + (dropAt === i && dragId && dragId !== b.id ? " vss-drop-here" : "")}
                onDragOver={e => { if (dragId) { e.preventDefault(); setDropAt(i); } }}
                onDrop={e => { if (dragId) { e.preventDefault(); e.stopPropagation(); move(dragId, i); setDragId(null); setDropAt(null); } }}>
                <div className="vss-card-grip" draggable={canEdit} title="Drag to move"
                  onDragStart={e => { setDragId(b.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", b.id); }}
                  onDragEnd={() => { setDragId(null); setDropAt(null); }}>
                  {b.type === "image"
                    ? (urls[b.path] ? <img className="vss-card-img" src={urls[b.path]} alt="" draggable={false} /> : <span className="vss-card-img vss-card-wait">Loading</span>)
                    : <span className="vss-card-img vss-card-words">Words</span>}
                  <span className="vss-card-drag" aria-hidden="true">Drag</span>
                </div>
                <div className="vss-card-body">
                  <div className="vss-card-top">
                    <b className="vss-card-name">{b.type === "image" ? "Picture " + imageNo(b) : "Words between pictures"}</b>
                    {b.type === "image" ? (
                      <button type="button" className="vss-star" aria-pressed={story.feature === b.id} disabled={!canEdit} onClick={() => set("feature", b.id)}
                        title="Your star picture is what classmates see first">{story.feature === b.id ? "★ Star picture" : "☆ Make star"}</button>
                    ) : null}
                    <span className="vss-grow" />
                    <button type="button" className="vss-mini" disabled={!canEdit || i === 0} onClick={() => move(b.id, i - 1)} aria-label="Move up">Up</button>
                    <button type="button" className="vss-mini" disabled={!canEdit || i === story.blocks.length - 1} onClick={() => move(b.id, i + 1)} aria-label="Move down">Down</button>
                    <RemoveButton disabled={!canEdit} onRemove={() => removeBlock(b.id)} />
                  </div>
                  {b.type === "text"
                    ? <textarea className="vss-input" rows={4} value={b.text || ""} readOnly={!canEdit} maxLength={3000} placeholder="Words that sit between pictures" onChange={e => setBlock(b.id, { text: e.target.value })} />
                    : <ImageFields b={b} canEdit={canEdit} onChange={(p) => setBlock(b.id, p)} />}
                </div>
              </li>
            ))}
          </ol>
          {story.blocks.length ? <button type="button" className="vss-btn vss-add" disabled={!canEdit} onClick={() => addBlock({ type: "text", text: "" })}>Add words between pictures</button> : null}

          <label className="vss-field vss-field-quiet">
            <span className="vss-label">A link to an interactive version (optional)</span>
            <span className="vss-muted">If you want to include a link, it will go at the top of your story as an alternate way to read your work.</span>
            <input className="vss-input" value={answers.link || ""} maxLength={500} placeholder="https://" readOnly={!canEdit} onChange={e => set("link", e.target.value.trim())} />
          </label>
        </section>

        <section className="vss-see" aria-label="Story preview">
          <div className="vss-see-head">
            <span className="vss-label">Story preview</span>
          </div>
          <div className={"vss-see-frame vss-frame-" + story.look}>
            <StoryView story={story} urls={urls} credit={viewer?.name || ""} />
          </div>
        </section>
      </div>

      <footer className="vss-end">
        <button type="button" className="vss-go vss-submit" disabled={!canEdit || submitting === "sending"} onClick={submit}>
          {submitting === "sending" ? "Submitting" : submitted ? "Submit again" : "Submit"}
        </button>
        {submitting === "problems" && problems.length ? (
          <div className="vss-fix">
            <b>Almost there! Before you submit:</b>
            <ul className="vss-list">{problems.map(p => <li key={p}>{p}</li>)}</ul>
          </div>
        ) : null}
        {submitting === "unsaved" ? <span className="vss-bad">Your story is not saved yet, so the submission did not go through. Try again in a moment.</span> : null}
        {submitting === "failed" ? <span className="vss-bad">The submission did not go through. Check your connection and try again.</span> : null}
        {submitted && !submitting ? <span className="vss-good-text">Submitted {when(submitted)}. You can keep editing until the due date.</span> : null}
        <ReportProblem classId={classId} saver={saver} status={status} errors={errors} />
      </footer>
    </div>
  );
}

function Meter({ label, n, min, max, ok }) {
  const pct = Math.min(100, Math.round((n / max) * 100));
  return (
    <span className={"vss-count" + (ok ? " vss-count-ok" : "")}>
      <span className="vss-count-n">{n}</span>
      <span className="vss-count-l">{label}, {min} to {max}</span>
      <span className="vss-count-bar"><span className="vss-count-fill" style={{ width: pct + "%" }} /></span>
    </span>
  );
}

function ImageFields({ b, canEdit, onChange }) {
  const portrait = isPortrait(b);
  const reasons = b.reasons || [];
  return (
    <div className="vss-fields">
      <textarea className="vss-input vss-grow-box" rows={2} value={b.caption || ""} readOnly={!canEdit} maxLength={2000} placeholder="Caption: what should readers notice here?"
        ref={el => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + 2 + "px"; } }}
        onChange={e => onChange({ caption: e.target.value })} />
      <div className="vss-row">
        {portrait ? LAYOUTS.map(([id, name]) => <button key={id} type="button" className="vss-pill" aria-pressed={layoutOf(b) === id} disabled={!canEdit} onClick={() => onChange({ layout: id })}>{name}</button>)
          : <span className="vss-muted">Full width. Text can sit beside portrait photos.</span>}
      </div>
      <div className="vss-row">
        <button type="button" className="vss-pill" aria-pressed={!!b.graphic} disabled={!canEdit} onClick={() => onChange({ graphic: !b.graphic })}>{b.graphic ? "Graphic, with a source" : "Is this a graphic?"}</button>
      </div>
      {b.graphic ? <input className="vss-input" value={b.source || ""} maxLength={300} readOnly={!canEdit} placeholder="Source: where the numbers come from" onChange={e => onChange({ source: e.target.value })} /> : null}
      <div className="vss-why" role="group" aria-label="Why did this picture make the cut?">
        <span className={"vss-why-h" + (reasons.length ? "" : " vss-why-need")}>Why this picture? <span className="vss-muted">{reasons.length ? "Only Dr. Ishak sees this part." : "Tap at least one reason. Only Dr. Ishak sees this part."}</span></span>
        <div className="vss-row vss-tight">
          {REASONS.map(([id, name]) => (
            <button key={id} type="button" className="vss-pill" aria-pressed={reasons.includes(id)} disabled={!canEdit}
              onClick={() => onChange({ reasons: reasons.includes(id) ? reasons.filter(r => r !== id) : [...reasons, id] })}>{name}</button>
          ))}
        </div>
        {reasons.includes("other") ? <input className="vss-input" value={b.other || ""} maxLength={300} readOnly={!canEdit} placeholder="A few words on why" onChange={e => onChange({ other: e.target.value })} /> : null}
      </div>
    </div>
  );
}

function RemoveButton({ disabled, onRemove }) {
  const [sure, setSure] = useState(false);
  useEffect(() => { if (!sure) return; const t = setTimeout(() => setSure(false), 4000); return () => clearTimeout(t); }, [sure]);
  return sure
    ? <button type="button" className="vss-mini vss-danger" onClick={onRemove}>Yes, remove</button>
    : <button type="button" className="vss-mini" disabled={disabled} onClick={() => setSure(true)}>Remove</button>;
}

function ReportProblem({ classId, saver, status, errors }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState("");
  const send = async () => {
    setSent("sending");
    const details = { status, pending: Object.keys(saver.current ? saver.current.pending() : {}), errors: errors.current, page: location.pathname, agent: navigator.userAgent, at: new Date().toISOString() };
    const r = await gameClient.from("worksheet_reports").insert({ worksheet_key: VISUAL_STORY_KEY, group_key: classId, message: text.slice(0, 4000), details }).select("id");
    setSent(r.error ? "failed" : "sent");
    if (!r.error) setText("");
  };
  if (!open) return <button type="button" className="vss-link-btn vss-report" onClick={() => { setOpen(true); setSent(""); }}>Something not working? Report a problem</button>;
  return (
    <div className="vss-report-box">
      <label className="vss-field">
        <span className="vss-label">What went wrong? Dr. Ishak gets your note and the details from this page.</span>
        <textarea className="vss-input" rows={3} value={text} maxLength={4000} onChange={e => setText(e.target.value)} />
      </label>
      <div className="vss-row">
        <button type="button" className="vss-go" disabled={sent === "sending"} onClick={send}>Send</button>
        <button type="button" className="vss-btn" onClick={() => setOpen(false)}>Close</button>
        {sent === "sent" ? <span className="vss-good-text">Sent. Dr. Ishak will see your report.</span> : null}
        {sent === "failed" ? <span className="vss-bad">The report did not send. Email Dr. Ishak instead.</span> : null}
      </div>
    </div>
  );
}

export function mountVisualStory(root, { store, viewer, readOnly = false, classId, editor = false } = {}) {
  const r = createRoot(root);
  r.render(<StorySheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} />);
  return { destroy() { r.unmount(); } };
}

// The story's own page is pure white or pure black, the student's choice, so
// these colors are the story's and not the site theme's.
const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const SERIF = "'Lora', 'Iowan Old Style', Charter, Georgia, serif";
const CSS = `
.vss{padding:22px 20px 90px;color:${T.primary};max-width:1360px;margin:0 auto}
.vss-p{margin:0;font-size:16px;color:${T.secondary}}
.vss-muted{font-size:14px;color:${T.muted}}
.vss-bad{color:${ST.late};font-size:15px}
.vss-good-text{color:${ST.ok};font-size:15px;font-weight:600}
.vss-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.vss-grow{flex:1}

.vss-hello{display:flex;flex-direction:column;gap:10px;margin-bottom:18px}
.vss-hello-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.vss-hello-h{margin:0;font-family:${SERIF};font-size:40px;font-weight:600;letter-spacing:-.015em;line-height:1.1}
.vss-hello-sub{margin:0;font-size:17px;color:${T.secondary}}
.vss-status{margin-left:auto;font-size:13px;font-weight:600;color:${T.muted};border:1px solid ${L.soft};border-radius:999px;padding:4px 12px}
.vss-status-ok{color:${ST.ok};border-color:${ST.ok}}
.vss-status-bad{color:${ST.late};border-color:${ST.late}}
.vss-steps{list-style:none;counter-reset:step;margin:6px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px 32px}
.vss-step{counter-increment:step;position:relative;padding-left:44px;display:flex;flex-direction:column;gap:2px}
.vss-step::before{content:counter(step);position:absolute;left:0;top:-2px;width:32px;height:32px;border-radius:50%;background:${T.primary};color:${S.page};font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center}
.vss-step-name{font-size:17px;font-weight:700}
.vss-step-say{font-size:15.5px;line-height:1.5;color:${T.secondary}}
.vss-note{border-left:4px solid ${ST.warn};padding:10px 14px;font-size:16px;background:${S.sunk};border-radius:6px}

.vss-bar{position:sticky;top:60px;z-index:6;display:flex;align-items:center;gap:22px;flex-wrap:wrap;padding:12px 16px;margin-bottom:18px;border-radius:14px;background:${S.card};box-shadow:0 1px 2px rgba(0,0,0,.06),0 0 0 1px ${L.soft}}
.vss-count{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:baseline;min-width:170px}
.vss-count-n{grid-row:1/3;font-size:28px;font-weight:700;line-height:1;color:${ST.warn}}
.vss-count-ok .vss-count-n{color:${ST.ok}}
.vss-count-l{font-size:13px;color:${T.muted}}
.vss-count-bar{height:5px;border-radius:999px;background:${S.sunk};overflow:hidden;align-self:center}
.vss-count-fill{display:block;height:100%;background:${ST.warn};transition:width .25s}
.vss-count-ok .vss-count-fill{background:${ST.ok}}
.vss-tabs{display:none;gap:4px;padding:3px;border-radius:999px;background:${S.sunk}}
.vss-tab{font:inherit;font-size:14px;font-weight:600;padding:7px 14px;border-radius:999px;border:0;background:transparent;color:${T.secondary};cursor:pointer}
.vss-tab[aria-selected="true"]{background:${S.card};color:${T.primary};box-shadow:0 1px 2px rgba(0,0,0,.12)}

.vss-work{display:grid;grid-template-columns:minmax(380px,520px) 1fr;gap:28px;align-items:start}
.vss-build{display:flex;flex-direction:column;gap:18px;min-width:0}
.vss-see{position:sticky;top:150px;display:flex;flex-direction:column;gap:8px;min-width:0}
.vss-see-head{display:flex;align-items:center;gap:10px}
.vss-see-frame{border-radius:16px;overflow:auto;max-height:calc(100vh - 190px);box-shadow:0 10px 40px -12px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.08)}

.vss-field{display:flex;flex-direction:column;gap:6px;min-width:0}
.vss-field-quiet{margin-top:8px;padding-top:16px;border-top:1px solid ${L.soft}}
.vss-label{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${T.muted}}
.vss-input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.5;padding:10px 12px;border:1px solid ${L.strong};border-radius:10px;background:${S.card};color:${T.primary};resize:vertical}
.vss-headline{font-family:${SERIF};font-size:24px;font-weight:600;padding:12px 14px}
.vss-input:focus-visible,.vss-btn:focus-visible,.vss-go:focus-visible,.vss-pill:focus-visible,.vss-mini:focus-visible,.vss-look:focus-visible,.vss-star:focus-visible,.vss-tab:focus-visible,.vss-link-btn:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}

.vss-looks{display:flex;gap:10px}
.vss-look{display:flex;align-items:center;gap:10px;font:inherit;font-size:15px;font-weight:600;padding:8px 14px 8px 8px;border-radius:12px;border:1.5px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.vss-look[aria-pressed="true"]{border-color:${T.primary};box-shadow:inset 0 0 0 1.5px ${T.primary}}
.vss-look-swatch{width:44px;height:32px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:${SERIF};font-size:16px;font-weight:600;box-shadow:0 0 0 1px rgba(0,0,0,.15)}
.vss-look-light .vss-look-swatch{background:#fff;color:#111}
.vss-look-dark .vss-look-swatch{background:#0b0b0c;color:#f4f4f2}

.vss-drop{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:30px 18px;border:2px dashed ${L.strong};border-radius:18px;background:${S.sunk};transition:background .15s,border-color .15s}
.vss-drop-on{border-color:${T.primary};background:${S.card};transform:scale(1.01)}
.vss-drop-h{margin:0;font-family:${SERIF};font-size:24px;font-weight:600}
.vss-drop-p{margin:0;font-size:14px;color:${T.muted}}
.vss-drop-small{margin:6px 0 0;font-size:13.5px;color:${T.muted};max-width:40ch}

.vss-ups{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.vss-up{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:12px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.vss-up-name{font-weight:600;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vss-meter{height:6px;border-radius:999px;background:${S.sunk};overflow:hidden}
.vss-meter-in{display:block;height:100%;background:${T.primary};transition:width .2s}

.vss-cards{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.vss-card{display:grid;grid-template-columns:104px 1fr;gap:14px;padding:12px;border-radius:16px;background:${S.card};box-shadow:0 1px 2px rgba(0,0,0,.05),0 0 0 1px ${L.soft};transition:box-shadow .15s,opacity .15s}
.vss-card:hover{box-shadow:0 4px 16px -6px rgba(0,0,0,.18),0 0 0 1px ${L.strong}}
.vss-dragging{opacity:.35}
.vss-drop-here{box-shadow:0 -5px 0 0 ${T.primary},0 0 0 1px ${L.strong}}
.vss-card-grip{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:grab;user-select:none}
.vss-card-grip:active{cursor:grabbing}
.vss-card-img{display:block;width:104px;height:104px;object-fit:cover;border-radius:10px;background:${S.sunk}}
.vss-card-wait,.vss-card-words{display:flex;align-items:center;justify-content:center;font-size:13px;color:${T.muted}}
.vss-card-words{font-family:${SERIF};font-size:18px;color:${T.secondary}}
.vss-card-drag{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${T.muted}}
.vss-card-body{display:flex;flex-direction:column;gap:10px;min-width:0}
.vss-card-top{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.vss-card-name{font-size:15.5px;margin-right:4px}
.vss-fields{display:flex;flex-direction:column;gap:10px}
.vss-why{display:flex;flex-direction:column;gap:6px;padding-top:8px;border-top:1px dashed ${L.soft}}
.vss-why-h{font-size:14px;font-weight:700}
.vss-why-need{color:${ST.warn}}
.vss-tight{gap:5px}
.vss-tight .vss-pill{font-size:12.5px;padding:3px 9px}
.vss-grow-box{resize:none;overflow:hidden;min-height:64px}
.vss-add{align-self:flex-start}

.vss-btn{font:inherit;font-size:14px;font-weight:600;padding:7px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.vss-btn[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vss-mini{font:inherit;font-size:12.5px;font-weight:600;padding:4px 10px;border-radius:999px;border:1px solid ${L.soft};background:transparent;color:${T.secondary};cursor:pointer}
.vss-mini:hover:not(:disabled){border-color:${L.strong};color:${T.primary}}
.vss-pill{font:inherit;font-size:13.5px;padding:5px 12px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer}
.vss-pill[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vss-star{font:inherit;font-size:13px;font-weight:700;padding:4px 11px;border-radius:999px;border:1px solid ${L.strong};background:transparent;color:${T.secondary};cursor:pointer}
.vss-star[aria-pressed="true"]{background:#f5b301;border-color:#f5b301;color:#1a1300}
.vss-btn:disabled,.vss-go:disabled,.vss-pill:disabled,.vss-mini:disabled,.vss-look:disabled,.vss-star:disabled{opacity:.45;cursor:default}
.vss-danger{border-color:${ST.late};color:${ST.late}}
.vss-go{font:inherit;font-size:16px;font-weight:700;padding:11px 22px;border-radius:999px;border:0;background:${T.primary};color:${S.page};cursor:pointer}
.vss-link-btn{font:inherit;font-size:14px;font-weight:600;padding:0;border:0;background:none;color:${T.secondary};text-decoration:underline;text-underline-offset:3px;cursor:pointer;margin-right:10px}

.vss-end{display:flex;flex-direction:column;align-items:flex-start;gap:12px;margin-top:28px;padding-top:22px;border-top:1px solid ${L.soft}}
.vss-submit{font-size:18px;padding:14px 34px}
.vss-fix{border-radius:14px;padding:12px 16px;font-size:15.5px;background:${S.sunk};box-shadow:inset 4px 0 0 ${ST.warn}}
.vss-list{margin:6px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:4px}
.vss-report{margin-top:10px}
.vss-report-box{display:flex;flex-direction:column;gap:8px;width:100%;max-width:560px;margin-top:10px}
.vss-solo{max-width:820px;margin:0 auto;border-radius:16px;overflow:hidden}

.vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.45;padding:4px 8px;margin:0;border:1.5px dashed ${L.strong};border-radius:8px;background:${S.card};resize:none;overflow:hidden}
.vsp-edit.vss-hello-h{font-family:${SERIF};font-size:40px;font-weight:600}
.vsp-edit.vss-step-name{font-weight:700}

/* The story itself. */
.vsr{display:flex;flex-direction:column;gap:26px;padding:44px 40px 60px;min-height:100%;box-sizing:border-box}
.vsr-light{background:#fff;color:#141414}
.vsr-dark{background:#0b0b0c;color:#f2f1ee}
.vsr-h{margin:-14px 0 0;font-family:${SERIF};font-size:40px;font-weight:600;line-height:1.12;letter-spacing:-.01em}
.vsr-link{margin:0;font-size:14.5px;opacity:.75}
.vsr-link a{color:inherit}
.vsr-empty{margin:0;font-family:${SERIF};font-size:19px;font-style:italic;opacity:.55}
.vsr-text{margin:0;font-family:${SERIF};font-size:19px;line-height:1.7;white-space:pre-line;max-width:62ch}
.vsr-fig{margin:0;display:flex;flex-direction:column;gap:10px}
.vsr-img{display:block;width:100%;height:auto;border-radius:3px}
.vsr-wait{display:flex;align-items:center;justify-content:center;min-height:200px;font-size:14px;opacity:.5;background:rgba(127,127,127,.15)}
.vsr-cap{display:flex;flex-direction:column;gap:5px}
.vsr-cap-text{font-size:15.5px;line-height:1.55;white-space:pre-line;opacity:.85}
.vsr-src{font-size:12px;letter-spacing:.04em;text-transform:uppercase;opacity:.55}
.vsr-why{font-size:13px;color:#b45309}
.vsr-left,.vsr-right{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center}
.vsr-left .vsr-cap-text,.vsr-right .vsr-cap-text{font-family:${SERIF};font-size:18.5px;line-height:1.6;opacity:1}
.vsr-right .vsr-img{order:2}
.vsr-full{width:100%}
.vss-frame-light{background:#fff}
.vss-frame-dark{background:#0b0b0c}

@media (max-width:1060px){
  .vss-work{grid-template-columns:1fr}
  .vss-tabs{display:flex}
  .vss-on-build .vss-see{display:none}
  .vss-on-see .vss-build{display:none}
  .vss-see{position:static}
  .vss-see-frame{max-height:none}
}
@media (max-width:620px){
  .vss{padding:16px 14px 80px}
  .vss-hello-h,.vsp-edit.vss-hello-h{font-size:30px}
  .vss-card{grid-template-columns:72px 1fr;gap:10px}
  .vss-card-img{width:72px;height:72px}
  .vsr{padding:28px 18px 40px}
  .vsr-h{font-size:30px}
  .vsr-left,.vsr-right{display:flex;flex-direction:column}
  .vsr-right .vsr-img{order:0}
  .vss-bar{top:56px;gap:14px}
}
`;

/** The page's whole stylesheet, for pages that show a StoryView without the sheet. */
export const STORY_CSS = CSS;
