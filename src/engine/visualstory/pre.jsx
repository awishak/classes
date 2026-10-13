// Visual story pre-production: COMM 3's topic page, /comm3/worksheets/visual-pre.
//
// Planned with Andrew on 2026-10-13 at /comm3/visualessayplanning. A student
// chooses one of three prompts, explains their topic, writes a headline and
// the one sentence, and plans the story before shooting. They hand in, and
// Andrew marks the topic approved or needs work with a note they see here. A
// topic that needs work is edited and handed in again.
//
// The answers are worksheet rows (worktopia/store.js), one field each, saved
// through saver.js so nothing typed is lost. The review is a row in
// worksheet_reviews (sql/visual-story-pre.sql): the student reads their own,
// and Andrew writes it through /api/worksheet-submits with the service key.

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "./saver.js";
import { gameClient } from "../gameClient.js";
import * as TOKENS from "../tokens.js";

export const VISUAL_PRE_KEY = "visual-pre";
export const VISUAL_PRE_TITLE = "Visual story pre-production";

// Andrew's three prompts, chosen 2026-10-13.
export const PROMPTS = [
  { id: "scene", name: "A scene with its own rules", say: "A group with its own language and look, like a climbing gym, a car meet, a chess club or a run club." },
  { id: "tradition", name: "A tradition", say: "A ritual that a team, club, family or culture keeps alive, and who does the keeping." },
  { id: "values", name: "Someone who creates their own values", say: "A person living by rules they chose rather than the rules they were handed." },
];

// The boxes, in order. Field names are letters only, the table's rule.
export const BOXES = [
  { field: "topic", ask: "Tell me about your topic in two or three sentences.", rows: 4 },
  { field: "headline", ask: "Your headline.", rows: 1 },
  { field: "learn", ask: "In one well-worded sentence or question, what do you hope readers will learn after enjoying your story?", rows: 2 },
  { field: "ideas", ask: "What are some image ideas that will help you tell this story?", rows: 5 },
  { field: "need", ask: "Which photo can your story not live without, and what will you do if you can't get the photo?", rows: 3 },
  { field: "problem", group: "The frame", ask: "What problem does your story define?", rows: 2 },
  { field: "cause", group: "The frame", ask: "What causes the problem?", rows: 2 },
  { field: "next", group: "The frame", ask: "What should happen next?", rows: 2 },
  { field: "arc", ask: "Is this story ongoing or over? Is there a what-happens-next feel, or do you have a complete beginning, middle and end?", rows: 3 },
];
export const FIELDS = ["prompt", ...BOXES.map(b => b.field)];

// The words students read, editable by Andrew in place. Andrew, 2026-10-13:
// "give me ability to line edit your intro and prompts for students." The
// defaults are here; his edits live in one instructor-only row (a -plan row,
// so the database refuses anyone else's write) that every class reads, so the
// COMM 999 demo and COMM 3 say the same thing.
export const COPY_ROW = "worksheet-visual-pre-plan";
export const DEFAULT_COPY = {
  intro: "Due Friday, October 16, at 11:59 PM. Choose one of the three prompts, tell me your topic, and plan your story before you shoot. Your topic has to be new, different from your visual language exercise. Your answers save as you type. When you're done, press Submit, and I'll mark your topic approved or needs work, with a note, right here.",
  promptAsk: "Which prompt is your story?",
  frameHead: "The frame",
  ...Object.fromEntries(PROMPTS.flatMap(p => [["prompt." + p.id + ".name", p.name], ["prompt." + p.id + ".say", p.say]])),
  ...Object.fromEntries(BOXES.map(b => ["box." + b.field, b.ask])),
};

/** The words, with Andrew's edits over the defaults. edit(key, value) saves a beat later. */
export function useCopy(canEdit) {
  const [edits, setEdits] = useState({});
  const [status, setStatus] = useState("");
  const timer = useRef(null);
  const latest = useRef({});
  useEffect(() => {
    let alive = true;
    (async () => {
      try { const got = await window.storage.get(COPY_ROW); if (alive && got) { latest.current = JSON.parse(got.value) || {}; setEdits(latest.current); } } catch { /* the defaults stand */ }
    })();
    return () => { alive = false; };
  }, []);
  const push = async () => {
    setStatus("Saving the words");
    const res = await window.storage.set(COPY_ROW, JSON.stringify(latest.current));
    if (res === false) setStatus("Not saved. Sign in as the instructor to change the words");
    else if (!res) { setStatus("Words not saved, trying again"); timer.current = setTimeout(push, 4000); }
    else setStatus("Words saved");
  };
  const edit = (key, value) => {
    if (!canEdit) return;
    latest.current = { ...latest.current, [key]: value };
    setEdits(latest.current);
    setStatus("Saving the words");
    clearTimeout(timer.current);
    timer.current = setTimeout(push, 800);
  };
  const say = (key) => (edits[key] != null && String(edits[key]).trim() ? edits[key] : DEFAULT_COPY[key]);
  return { say, edit, status, raw: (key) => (edits[key] != null ? edits[key] : DEFAULT_COPY[key]) };
}

// One editable line: plain text for students, a box that grows for Andrew.
function Words({ k, copy, editing, as: Tag = "span", className }) {
  if (!editing) return <Tag className={className}>{copy.say(k)}</Tag>;
  return (
    <textarea className={"vsp-edit " + (className || "")} value={copy.raw(k)} rows={1} aria-label={"Edit: " + DEFAULT_COPY[k]}
      ref={el => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
      onChange={e => copy.edit(k, e.target.value)} />
  );
}
export const missingOf = (answers) => FIELDS.filter(f => !String(answers[f] || "").trim());

const STATUS = { loading: "Loading", saved: "Saved", saving: "Saving", retrying: "Not saved, trying again", "failed-load": "Could not load your answers. Reload the page." };
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Where a student's topic stands, from the hand-in time and the review. */
export function standing(submittedAt, review) {
  if (!submittedAt) return review ? { kind: review.status === "approved" ? "approved" : "needs", review, again: true } : { kind: "open" };
  if (review && new Date(review.reviewed_at) >= new Date(submittedAt)) return { kind: review.status === "approved" ? "approved" : "needs", review };
  return { kind: "waiting", at: submittedAt };
}

async function reviewFor({ worksheetKey, classId, viewerId }) {
  const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", worksheetKey).eq("group_key", classId).eq("viewer_id", viewerId);
  const id = s.data && s.data[0] && s.data[0].id;
  if (!id) return null;
  const r = await gameClient.from("worksheet_reviews").select("status,note,reviewed_at").eq("sheet_id", id);
  return (r.data && r.data[0]) || null;
}

export function PreSheet({ store, viewer, classId, readOnly, review: givenReview, storage, editor = false }) {
  const copy = useCopy(editor);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const [review, setReview] = useState(givenReview || null);
  const [handing, setHanding] = useState("");
  const saver = useRef(null);

  useEffect(() => {
    const draftKey = "visual-pre:" + (classId || "") + ":" + (viewer?.id || "");
    const s = createSaver({ store, draftKey, storage: readOnly ? null : (storage ?? (typeof localStorage !== "undefined" ? localStorage : null)), onStatus: setStatus });
    saver.current = s;
    let alive = true;
    s.load().then(got => { if (alive) { setAnswers(got.answers); setSubmitted(got.submitted_at); } })
      .catch(() => { if (alive) setStatus("failed-load"); });
    if (!readOnly && classId && viewer?.id) reviewFor({ worksheetKey: VISUAL_PRE_KEY, classId, viewerId: viewer.id }).then(r => { if (alive && r) setReview(r); }).catch(() => {});
    if (readOnly) return () => { alive = false; s.destroy(); };
    const flush = () => s.flush();
    const hidden = () => { if (document.visibilityState === "hidden") s.flush(); };
    const leaving = (e) => { if (Object.keys(s.pending()).length) { s.flush(); e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("beforeunload", leaving);
    return () => {
      alive = false;
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("beforeunload", leaving);
      s.flush(); s.destroy();
    };
  }, [store, viewer?.id, classId, readOnly, storage]);

  const set = (field, value) => {
    if (readOnly) return;
    setAnswers(a => ({ ...a, [field]: value }));
    saver.current.change(field, value);
  };

  const handIn = async () => {
    const left = missingOf(answers);
    if (left.length) { setHanding("missing"); return; }
    setHanding("sending");
    try {
      await saver.current.flush();
      if (Object.keys(saver.current.pending()).length) { setHanding("unsaved"); return; }
      const at = await store.submit();
      setSubmitted(at || new Date().toISOString());
      setHanding("");
    } catch { setHanding("failed"); }
  };

  if (!answers) return <div className="vsp"><style>{CSS}</style><p className="vsp-p">{STATUS[status] || "Loading"}</p></div>;
  const where = standing(submitted, review);
  const left = missingOf(answers);
  let group = null;

  return (
    <div className="vsp">
      <style>{CSS}</style>
      <div className="vsp-in">
        <div className="vsp-top">
          <h1 className="vsp-title">{VISUAL_PRE_TITLE}</h1>
          {!readOnly ? <span className={"vsp-status" + (status === "retrying" ? " vsp-warn" : "")} aria-live="polite">{STATUS[status]}</span> : null}
        </div>
        {editor ? (
          <div className="vsp-editbar">
            <button type="button" className="vsp-editbtn" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
            <span className="vsp-muted" aria-live="polite">{editing ? copy.status || "Change any line students read. Clear a line to put the original back." : copy.status}</span>
          </div>
        ) : null}
        <Words k="intro" copy={copy} editing={editing} as="p" className="vsp-p" />

        <Standing where={where} />

        <fieldset className="vsp-q">
          <legend className="vsp-ask"><Words k="promptAsk" copy={copy} editing={editing} /></legend>
          <div className="vsp-prompts">
            {PROMPTS.map(p => {
              const on = answers.prompt === p.id;
              if (editing) return (
                <div key={p.id} className="vsp-prompt">
                  <Words k={"prompt." + p.id + ".name"} copy={copy} editing as="b" className="vsp-edit-b" />
                  <Words k={"prompt." + p.id + ".say"} copy={copy} editing />
                </div>
              );
              return (
                <button key={p.id} type="button" className={"vsp-prompt" + (on ? " vsp-on" : "")} aria-pressed={on} disabled={readOnly}
                  onClick={() => set("prompt", on ? "" : p.id)}>
                  <b>{copy.say("prompt." + p.id + ".name")}</b><span>{copy.say("prompt." + p.id + ".say")}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {BOXES.map(b => {
          const head = b.group && b.group !== group ? b.group : null;
          group = b.group || null;
          return (
            <div key={b.field}>
              {head ? <Words k="frameHead" copy={copy} editing={editing} as="h2" className="vsp-h2" /> : null}
              <label className="vsp-q">
                <Words k={"box." + b.field} copy={copy} editing={editing} className="vsp-ask" />
                {b.rows === 1
                  ? <input className="vsp-box" value={answers[b.field] || ""} readOnly={readOnly} maxLength={200} onChange={e => set(b.field, e.target.value)} />
                  : <textarea className="vsp-box" rows={b.rows} value={answers[b.field] || ""} readOnly={readOnly} maxLength={4000} onChange={e => set(b.field, e.target.value)} />}
              </label>
            </div>
          );
        })}

        {!readOnly ? (
          <div className="vsp-hand">
            <button type="button" className="vsp-go" disabled={handing === "sending"} onClick={handIn}>
              {handing === "sending" ? "Submitting" : submitted ? "Submit again" : "Submit"}
            </button>
            {handing === "missing" && left.length ? <span className="vsp-warn">Every box needs an answer first. {left.length === 1 ? "One is" : left.length + " are"} still empty.</span> : null}
            {handing === "unsaved" ? <span className="vsp-warn">Your answers are not saved yet, so the submission did not go through. Try again in a moment.</span> : null}
            {handing === "failed" ? <span className="vsp-warn">The submission did not go through. Check your connection and try again.</span> : null}
            {submitted && !handing ? <span className="vsp-muted">Submitted {when(submitted)}. You can keep editing until the due date.</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Standing({ where }) {
  if (where.kind === "open") return null;
  if (where.kind === "waiting") return <div className="vsp-stand">Submitted {when(where.at)}. Dr. Ishak has not reviewed your topic yet.</div>;
  const ok = where.kind === "approved";
  return (
    <div className={"vsp-stand " + (ok ? "vsp-ok" : "vsp-needs")}>
      <b>{ok ? "Approved" : "Needs work"}</b>
      {where.review.note ? <p className="vsp-note">{where.review.note}</p> : null}
      {!ok ? <p className="vsp-note">Edit your answers below, then press Submit again.</p> : null}
    </div>
  );
}

/** The worksheet registry's mount: React inside the plain-DOM contract. */
export function mountVisualPre(root, { store, viewer, readOnly = false, classId, editor = false } = {}) {
  const r = createRoot(root);
  r.render(<PreSheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} editor={editor && !readOnly} />);
  return { destroy() { r.unmount(); } };
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;
const CSS = `
.vsp{padding:20px 16px 80px;color:${T.primary}}
.vsp-in{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.vsp-top{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.vsp-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.vsp-status{margin-left:auto;font-size:13px;color:${T.muted};border:1px solid ${L.soft};border-radius:999px;padding:3px 11px}
.vsp-p{margin:0;font-size:16.5px;line-height:1.6;color:${T.secondary};white-space:pre-line}
.vsp-h2{margin:10px 0 0;font-size:19px;font-weight:700}
.vsp-q{display:flex;flex-direction:column;gap:8px;border:0;margin:0;padding:0;min-width:0}
.vsp-ask{font-size:16px;font-weight:600;line-height:1.45;padding:0}
.vsp-box{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.5;padding:10px 12px;border:1px solid ${L.strong};border-radius:10px;background:${S.card};color:${T.primary};resize:vertical}
.vsp-box:focus-visible,.vsp-prompt:focus-visible,.vsp-go:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.vsp-prompts{display:flex;flex-direction:column;gap:8px}
.vsp-prompt{display:flex;flex-direction:column;gap:3px;text-align:left;font:inherit;padding:12px 14px;border:1px solid ${L.strong};border-radius:12px;background:${S.card};color:${T.primary};cursor:pointer}
.vsp-prompt span{font-size:15px;color:${T.secondary};line-height:1.45}
.vsp-prompt:disabled{cursor:default}
.vsp-on{border-color:${T.primary};box-shadow:inset 0 0 0 1.5px ${T.primary}}
.vsp-hand{display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:8px}
.vsp-go{font:inherit;font-size:16px;font-weight:600;padding:11px 22px;border-radius:999px;border:0;background:${T.primary};color:${S.page};cursor:pointer}
.vsp-go:disabled{opacity:.6;cursor:default}
.vsp-warn{color:${TOKENS.STATE.late};font-size:15px}
.vsp-muted{color:${T.muted};font-size:15px}
.vsp-stand{border:1px solid ${L.strong};border-radius:12px;padding:12px 14px;font-size:16px;line-height:1.5;background:${S.sunk}}
.vsp-ok{border-color:${TOKENS.STATE.ok}}
.vsp-ok b{color:${TOKENS.STATE.ok}}
.vsp-needs{border-color:${TOKENS.STATE.warn}}
.vsp-needs b{color:${TOKENS.STATE.warn}}
.vsp-note{margin:6px 0 0;white-space:pre-wrap}
.vsp-editbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.vsp-editbtn{font:inherit;font-size:14px;font-weight:600;padding:6px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.vsp-editbtn[aria-pressed="true"]{background:${T.primary};color:${S.page};border-color:${T.primary}}
.vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.5;padding:4px 8px;margin:0;border:1.5px dashed ${L.strong};border-radius:8px;background:${S.card};resize:none;overflow:hidden}
.vsp-edit:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.vsp-edit.vsp-p{font-size:16.5px;color:${T.secondary}}
.vsp-edit.vsp-ask{font-size:16px;font-weight:600}
.vsp-edit.vsp-h2{font-size:19px;font-weight:700}
.vsp-edit-b{font-weight:700}
`;
