// The visual story portal: /comm3/worksheets/visual-story.
//
// Planned with Andrew on 2026-10-13 at /comm3/visualessayplanning. A student
// uploads six to eight images, drags blocks into order, writes captions and
// text, marks why each image made the cut, previews, and submits. Built for
// a laptop; it still works on a phone.
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
export const STORY_COPY = {
  intro: "Due Friday, October 23, at 11:59 PM. Upload six to eight images, put them in order, and tell your story in 150 to 300 words of captions and text. Everything saves as you go. Press Preview to see your story the way a classmate will, and press Submit when you're done. The full instructions are on the visual story page.",
};

const STATUS = { loading: "Loading", saved: "Saved", saving: "Saving", retrying: "Not saved, trying again", "failed-load": "Could not load your story. Reload the page." };
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// ─── reading a story: the preview now, classmates later ───

export function StoryView({ story, urls, showPrivate = false }) {
  const images = story.blocks.filter(b => b.type === "image");
  return (
    <article className="vss-read">
      <h1 className="vss-read-h">{story.headline || "Your headline"}</h1>
      {story.link ? <p className="vss-read-link">This story also has an interactive version: <a href={story.link} target="_blank" rel="noreferrer">{story.link}</a></p> : null}
      {story.blocks.map(b => {
        if (b.type === "text") return <p key={b.id} className="vss-read-text">{b.text}</p>;
        const lay = layoutOf(b);
        const n = images.indexOf(b) + 1;
        return (
          <figure key={b.id} className={"vss-read-fig vss-lay-" + lay}>
            {urls[b.path] ? <img className="vss-read-img" src={urls[b.path]} alt={b.caption || "Image " + n} /> : <div className="vss-read-img vss-read-wait">Loading image {n}</div>}
            <figcaption className="vss-read-cap">
              {b.caption ? <span>{b.caption}</span> : null}
              {b.graphic && b.source ? <span className="vss-read-src">Source: {b.source}</span> : null}
              {showPrivate && (b.reasons || []).length ? <span className="vss-read-why">Why: {(b.reasons || []).map(r => (REASONS.find(x => x[0] === r) || [r, r])[1]).join(", ")}{b.other ? " (" + b.other + ")" : ""}</span> : null}
            </figcaption>
          </figure>
        );
      })}
    </article>
  );
}

// ─── the student's sheet ───

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
  const [uploads, setUploads] = useState([]);        // { key, name, progress, error, file }
  const [preview, setPreview] = useState(readOnly);
  const [submitting, setSubmitting] = useState("");
  const [lock, setLock] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [dragId, setDragId] = useState(null);
  const [dropAt, setDropAt] = useState(null);
  const [fileOver, setFileOver] = useState(false);
  const [editing, setEditing] = useState(false);
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
    s.load().then(got => { if (alive) { live.current = got.answers; setAnswers(got.answers); setSubmitted(got.submitted_at); } })
      .catch(() => { if (alive) setStatus("failed-load"); });
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
    patch({ progress: 0, error: "", stage: "Preparing" });
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
  if (readOnly) return <div className="vss"><style>{CSS}</style><div className="vss-in"><StoryView story={story} urls={urls} showPrivate /></div></div>;

  const words = wordCount(story), images = imageCount(story);
  const problems = problemsOf(story);
  const onDropFiles = (e) => { if (e.dataTransfer?.files?.length) { e.preventDefault(); setFileOver(false); addFiles(e.dataTransfer.files); } };

  return (
    <div className="vss" onDragOver={e => { if (canEdit && [...(e.dataTransfer?.types || [])].includes("Files")) { e.preventDefault(); setFileOver(true); } }}
      onDragLeave={e => { if (e.currentTarget === e.target) setFileOver(false); }} onDrop={onDropFiles}>
      <style>{CSS}</style>
      <div className="vss-in">
        <div className="vss-top">
          <h1 className="vss-title">{VISUAL_STORY_TITLE}</h1>
          <span className={"vss-status" + (status === "retrying" ? " vss-warn" : "")} aria-live="polite">{STATUS[status]}</span>
        </div>
        {editor ? (
          <div className="vss-row">
            <button type="button" className="vss-btn" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
            <span className="vss-muted" aria-live="polite">{copy.status}</span>
          </div>
        ) : null}
        <Words k="intro" copy={copy} editing={editing} as="p" className="vss-p" />
        {locked ? <div className="vss-stand">The due date has passed, so your story is locked. If you need more time, talk to Dr. Ishak.</div> : null}
        {lock && lock.until && Date.parse(lock.until) > now ? <div className="vss-stand">Dr. Ishak unlocked your story until {when(lock.until)}.</div> : null}

        <div className="vss-bar">
          <span className={"vss-count" + (images >= MIN_IMAGES && images <= MAX_IMAGES ? " vss-good" : "")}>{images} of {MIN_IMAGES} to {MAX_IMAGES} images</span>
          <span className={"vss-count" + (words >= MIN_WORDS && words <= MAX_WORDS ? " vss-good" : "")}>{words} of {MIN_WORDS} to {MAX_WORDS} words</span>
          <span className="vss-grow" />
          <button type="button" className="vss-btn" aria-pressed={preview} onClick={() => setPreview(p => !p)}>{preview ? "Back to editing" : "Preview"}</button>
        </div>

        {preview ? <StoryView story={story} urls={urls} /> : (
          <>
            <label className="vss-q">
              <span className="vss-ask">Headline</span>
              <input className="vss-box" value={answers.headline || ""} maxLength={200} readOnly={!canEdit} onChange={e => set("headline", e.target.value)} />
            </label>
            <label className="vss-q">
              <span className="vss-ask">A link to an interactive version (optional)</span>
              <span className="vss-muted">If you want to include a link, it will go at the top of your story as an alternate way to read your work.</span>
              <input className="vss-box" value={answers.link || ""} maxLength={500} placeholder="https://" readOnly={!canEdit} onChange={e => set("link", e.target.value.trim())} />
            </label>

            <div className={"vss-drop" + (fileOver ? " vss-drop-on" : "")}>
              <p className="vss-drop-p">Drag photos and graphics here, or</p>
              <button type="button" className="vss-go" disabled={!canEdit} onClick={() => fileInput.current && fileInput.current.click()}>Choose images</button>
              <input ref={fileInput} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
              <p className="vss-muted">JPEG, PNG or iPhone photos. Edit or crop in Canva or on your phone first; the site shows every image in its own shape.</p>
            </div>
            {uploads.length ? (
              <ul className="vss-ups">
                {uploads.map(u => (
                  <li key={u.key} className="vss-up">
                    <span className="vss-up-name">{u.name}</span>
                    {u.error ? (
                      <>
                        <span className="vss-warn">{u.error}</span>
                        {looksLikeImage(u.file) ? <button type="button" className="vss-btn" onClick={() => runUpload(u)}>Retry</button> : null}
                        <button type="button" className="vss-btn" onClick={() => setUploads(l => l.filter(x => x.key !== u.key))}>Dismiss</button>
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

            <ol className="vss-blocks">
              {story.blocks.map((b, i) => (
                <li key={b.id}
                  className={"vss-block" + (dragId === b.id ? " vss-dragging" : "") + (dropAt === i && dragId && dragId !== b.id ? " vss-drop-here" : "")}
                  onDragOver={e => { if (dragId) { e.preventDefault(); setDropAt(i); } }}
                  onDrop={e => { if (dragId) { e.preventDefault(); e.stopPropagation(); move(dragId, i); setDragId(null); setDropAt(null); } }}>
                  <div className="vss-block-top">
                    <span className="vss-handle" draggable={canEdit} title="Drag to move" aria-hidden="true"
                      onDragStart={e => { setDragId(b.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", b.id); }}
                      onDragEnd={() => { setDragId(null); setDropAt(null); }}>⠿</span>
                    <b className="vss-block-name">{b.type === "image" ? "Image " + (story.blocks.filter(x => x.type === "image").indexOf(b) + 1) : "Text"}</b>
                    <span className="vss-grow" />
                    <button type="button" className="vss-btn" disabled={!canEdit || i === 0} onClick={() => move(b.id, i - 1)} aria-label="Move up">Up</button>
                    <button type="button" className="vss-btn" disabled={!canEdit || i === story.blocks.length - 1} onClick={() => move(b.id, i + 1)} aria-label="Move down">Down</button>
                    <RemoveButton disabled={!canEdit} onRemove={() => removeBlock(b.id)} />
                  </div>
                  {b.type === "text"
                    ? <textarea className="vss-box" rows={4} value={b.text || ""} readOnly={!canEdit} maxLength={3000} placeholder="Text that sits on its own between images" onChange={e => setBlock(b.id, { text: e.target.value })} />
                    : <ImageFields b={b} url={urls[b.path]} feature={story.feature === b.id} canEdit={canEdit}
                        onChange={(p) => setBlock(b.id, p)} onFeature={() => set("feature", b.id)} />}
                </li>
              ))}
            </ol>
            <button type="button" className="vss-btn vss-add" disabled={!canEdit} onClick={() => addBlock({ type: "text", text: "" })}>Add a text block</button>
          </>
        )}

        <div className="vss-hand">
          <button type="button" className="vss-go" disabled={!canEdit || submitting === "sending"} onClick={submit}>
            {submitting === "sending" ? "Submitting" : submitted ? "Submit again" : "Submit"}
          </button>
          {submitting === "problems" && problems.length ? (
            <div className="vss-warn-box">
              <b>Before you submit:</b>
              <ul className="vss-list">{problems.map(p => <li key={p}>{p}</li>)}</ul>
            </div>
          ) : null}
          {submitting === "unsaved" ? <span className="vss-warn">Your story is not saved yet, so the submission did not go through. Try again in a moment.</span> : null}
          {submitting === "failed" ? <span className="vss-warn">The submission did not go through. Check your connection and try again.</span> : null}
          {submitted && !submitting ? <span className="vss-muted">Submitted {when(submitted)}. You can keep editing until the due date.</span> : null}
          <ReportProblem classId={classId} saver={saver} status={status} errors={errors} />
        </div>
      </div>
    </div>
  );
}

function ImageFields({ b, url, feature, canEdit, onChange, onFeature }) {
  const portrait = isPortrait(b);
  const reasons = b.reasons || [];
  return (
    <div className={"vss-img vss-lay-" + layoutOf(b)}>
      <div className="vss-thumb-wrap">{url ? <img className="vss-thumb" src={url} alt="" /> : <div className="vss-thumb vss-read-wait">Loading</div>}</div>
      <div className="vss-fields">
        <label className="vss-q">
          <span className="vss-ask">Caption</span>
          <textarea className="vss-box" rows={3} value={b.caption || ""} readOnly={!canEdit} maxLength={2000} onChange={e => onChange({ caption: e.target.value })} />
        </label>
        <div className="vss-row">
          <span className="vss-ask">Layout</span>
          {portrait
            ? LAYOUTS.map(([id, name]) => <button key={id} type="button" className="vss-chip" aria-pressed={layoutOf(b) === id} disabled={!canEdit} onClick={() => onChange({ layout: id })}>{name}</button>)
            : <span className="vss-muted">Full width. Text beside a photo is for portrait photos.</span>}
        </div>
        <label className="vss-check"><input type="radio" checked={feature} disabled={!canEdit} onChange={onFeature} /> Feature image</label>
        <label className="vss-check"><input type="checkbox" checked={!!b.graphic} disabled={!canEdit} onChange={e => onChange({ graphic: e.target.checked })} /> This is a graphic</label>
        {b.graphic ? (
          <label className="vss-q">
            <span className="vss-ask">Source line</span>
            <input className="vss-box" value={b.source || ""} maxLength={300} readOnly={!canEdit} placeholder="Where the numbers come from" onChange={e => onChange({ source: e.target.value })} />
          </label>
        ) : null}
        <fieldset className="vss-q vss-why">
          <legend className="vss-ask">Why did this image make the cut? Only Dr. Ishak sees your answer.</legend>
          {REASONS.map(([id, name]) => (
            <label key={id} className="vss-check">
              <input type="checkbox" checked={reasons.includes(id)} disabled={!canEdit}
                onChange={e => onChange({ reasons: e.target.checked ? [...reasons, id] : reasons.filter(r => r !== id) })} /> {name}
            </label>
          ))}
          {reasons.includes("other") ? <input className="vss-box" value={b.other || ""} maxLength={300} readOnly={!canEdit} placeholder="A few words on why" onChange={e => onChange({ other: e.target.value })} /> : null}
        </fieldset>
      </div>
    </div>
  );
}

function RemoveButton({ disabled, onRemove }) {
  const [sure, setSure] = useState(false);
  useEffect(() => { if (!sure) return; const t = setTimeout(() => setSure(false), 4000); return () => clearTimeout(t); }, [sure]);
  return sure
    ? <button type="button" className="vss-btn vss-danger" onClick={onRemove}>Yes, remove</button>
    : <button type="button" className="vss-btn" disabled={disabled} onClick={() => setSure(true)}>Remove</button>;
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
  if (!open) return <button type="button" className="vss-btn vss-report" onClick={() => { setOpen(true); setSent(""); }}>Report a problem</button>;
  return (
    <div className="vss-report-box">
      <label className="vss-q">
        <span className="vss-ask">What went wrong? Dr. Ishak gets your note and the details from this page.</span>
        <textarea className="vss-box" rows={3} value={text} maxLength={4000} onChange={e => setText(e.target.value)} />
      </label>
      <div className="vss-row">
        <button type="button" className="vss-go" disabled={sent === "sending"} onClick={send}>Send</button>
        <button type="button" className="vss-btn" onClick={() => setOpen(false)}>Close</button>
        {sent === "sent" ? <span className="vss-muted">Sent. Dr. Ishak will see your report.</span> : null}
        {sent === "failed" ? <span className="vss-warn">The report did not send. Email Dr. Ishak instead.</span> : null}
      </div>
    </div>
  );
}

export function mountVisualStory(root, { store, viewer, readOnly = false, classId, editor = false } = {}) {
  const r = createRoot(root);
  r.render(<StorySheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} />);
  return { destroy() { r.unmount(); } };
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.vss{padding:20px 16px 80px;color:${T.primary}}
.vss-in{max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.vss-top{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.vss-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.vss-status{margin-left:auto;font-size:13px;color:${T.muted};border:1px solid ${L.soft};border-radius:999px;padding:3px 11px}
.vss-p{margin:0;font-size:16.5px;line-height:1.6;color:${T.secondary};white-space:pre-line}
.vss-muted{font-size:14.5px;color:${T.muted}}
.vss-warn{color:${ST.late};font-size:15px}
.vss-stand{border:1px solid ${ST.warn};border-radius:12px;padding:12px 14px;font-size:16px;background:${S.sunk}}
.vss-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.vss-grow{flex:1}
.vss-bar{position:sticky;top:64px;z-index:5;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;border:1px solid ${L.soft};border-radius:12px;background:${S.card}}
.vss-count{font-size:14.5px;font-weight:600;color:${ST.warn}}
.vss-good{color:${ST.ok}}
.vss-q{display:flex;flex-direction:column;gap:6px;border:0;margin:0;padding:0;min-width:0}
.vss-ask{font-size:15.5px;font-weight:600;padding:0}
.vss-box{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.5;padding:9px 12px;border:1px solid ${L.strong};border-radius:10px;background:${S.card};color:${T.primary};resize:vertical}
.vss-box:focus-visible,.vss-btn:focus-visible,.vss-go:focus-visible,.vss-chip:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.vss-btn{font:inherit;font-size:14px;font-weight:600;padding:6px 13px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.vss-btn[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vss-btn:disabled,.vss-go:disabled,.vss-chip:disabled{opacity:.45;cursor:default}
.vss-danger{border-color:${ST.late};color:${ST.late}}
.vss-go{font:inherit;font-size:16px;font-weight:600;padding:10px 20px;border-radius:999px;border:0;background:${T.primary};color:${S.page};cursor:pointer}
.vss-chip{font:inherit;font-size:13.5px;padding:5px 12px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer}
.vss-chip[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vss-drop{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:26px 16px;border:2px dashed ${L.strong};border-radius:14px;background:${S.sunk}}
.vss-drop-on{border-color:${T.primary};background:${S.card}}
.vss-drop-p{margin:0;font-size:16px}
.vss-ups{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.vss-up{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 12px;border:1px solid ${L.soft};border-radius:10px;background:${S.card}}
.vss-up-name{font-weight:600;font-size:14.5px;max-width:40ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vss-meter{flex:1;min-width:120px;height:6px;border-radius:999px;background:${S.sunk};overflow:hidden}
.vss-meter-in{display:block;height:100%;background:${T.primary};transition:width .2s}
.vss-blocks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px}
.vss-block{border:1px solid ${L.strong};border-radius:14px;padding:12px 14px;background:${S.card};display:flex;flex-direction:column;gap:10px}
.vss-dragging{opacity:.4}
.vss-drop-here{box-shadow:0 -4px 0 0 ${T.primary}}
.vss-block-top{display:flex;align-items:center;gap:8px}
.vss-handle{cursor:grab;font-size:20px;line-height:1;color:${T.muted};padding:2px 6px;user-select:none}
.vss-block-name{font-size:16px}
.vss-add{align-self:flex-start}
.vss-img{display:grid;grid-template-columns:minmax(160px,280px) 1fr;gap:16px;align-items:start}
.vss-thumb-wrap{width:100%}
.vss-thumb{display:block;width:100%;height:auto;max-height:340px;object-fit:contain;border-radius:8px;background:${S.sunk}}
.vss-fields{display:flex;flex-direction:column;gap:10px;min-width:0}
.vss-check{display:flex;align-items:center;gap:8px;font-size:15px}
.vss-why{display:flex;flex-direction:column;gap:4px}
.vss-hand{display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-top:6px}
.vss-warn-box{border:1px solid ${ST.late};border-radius:12px;padding:10px 14px;font-size:15px}
.vss-list{margin:6px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:3px}
.vss-report{margin-top:14px}
.vss-report-box{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:14px}
.vss-read{display:flex;flex-direction:column;gap:22px;max-width:760px;margin:0 auto;width:100%}
.vss-read-h{margin:0;font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1.15}
.vss-read-link{margin:0;font-size:15.5px;color:${T.secondary}}
.vss-read-text{margin:0;font-size:18px;line-height:1.65;white-space:pre-line}
.vss-read-fig{margin:0;display:flex;flex-direction:column;gap:8px}
.vss-read-img{display:block;width:100%;height:auto;border-radius:6px;background:${S.sunk}}
.vss-read-wait{display:flex;align-items:center;justify-content:center;min-height:180px;color:${T.muted};font-size:14px}
.vss-read-cap{display:flex;flex-direction:column;gap:4px;font-size:16.5px;line-height:1.55;white-space:pre-line}
.vss-read-src{font-size:13.5px;color:${T.muted}}
.vss-read-why{font-size:13.5px;color:${ST.warn}}
.vss-read-fig.vss-lay-left,.vss-read-fig.vss-lay-right{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center}
.vss-read-fig.vss-lay-right .vss-read-img{order:2}
.vss-lay-full{grid-template-columns:minmax(160px,280px) 1fr}
.vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.5;padding:4px 8px;margin:0;border:1.5px dashed ${L.strong};border-radius:8px;background:${S.card};resize:none;overflow:hidden}
.vsp-edit.vss-p{font-size:16.5px}
@media (max-width:700px){
  .vss-img{grid-template-columns:1fr}
  .vss-read-fig.vss-lay-left,.vss-read-fig.vss-lay-right{display:flex}
  .vss-read-fig.vss-lay-right .vss-read-img{order:0}
  .vss-bar{top:56px}
}
`;
