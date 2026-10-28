// The submission page on an assignment: what the student reads, what they
// answer, and what Andrew reads back. See submissionPages.js for which
// assignments carry one and where the answers live.
//
// Three faces of the same sheet:
//   SubmissionForm   the student's, drawn on the assignment's own page
//                    (/<class>/assignments/<id>) under the title card
//   TheirSubmission  one student's answers for the instructor, at
//                    /<class>/worksheets/<key>?s=<roster id>, which is where
//                    Grade view's Open their file lands
//   PageEditor       the instructor's boxes in the assignment editor: the
//                    intro, the pictures and the questions
//
// Saving is the visual story's saver: every keystroke goes to the browser
// first and to the server a beat later, one field at a time, so nothing a
// student types is lost. Submit sets submitted_at on the sheet; the student
// can keep editing and submit again until submissions close.

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "./visualstory/saver.js";
import { supabaseStore, readStore } from "./worktopia/store.js";
import { gameClient } from "./gameClient.js";
import { useSession, authHeaders } from "./session.js";
import { useClassState } from "./store.js";
import { rosterOf } from "./roster.js";
import { uploadMedia } from "./media.js";
import { savedPin } from "../InstructorGate.jsx";
import * as TOKENS from "./tokens.js";
import { pageOf, hasPage, sheetKeyOf, missingOf, windowOf, LINK, KINDS, DEFAULT_QUESTIONS, pagedAssignments, withFields } from "./submissionPages.js";

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;
const STATUS = { loading: "Loading", saved: "Saved", saving: "Saving", retrying: "Saving again", "failed-load": "Your answers could not be loaded. Reload to try again." };
const when = (t) => { try { return new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
const whenLong = (d) => d.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

// ─── the sheet ───

// The page itself: intro, pictures, questions, Submit. `brief` leaves the
// intro and the pictures out, for the instructor reading answers.
export function SubmissionSheet({ asg, page, store, viewer, readOnly = false, storage, brief = false, who = "", closed = false }) {
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const [handing, setHanding] = useState("");
  const saver = useRef(null);
  const canWrite = !readOnly && !closed;

  useEffect(() => {
    const draftKey = "submission:" + (asg?.id || "") + ":" + (viewer?.id || "");
    const s = createSaver({ store, draftKey, storage: !canWrite ? null : (storage ?? (typeof localStorage !== "undefined" ? localStorage : null)), onStatus: setStatus });
    saver.current = s;
    let alive = true;
    s.load().then(got => { if (alive) { setAnswers(got.answers); setSubmitted(got.submitted_at); } })
      .catch(() => { if (alive) setStatus("failed-load"); });
    if (!canWrite) return () => { alive = false; s.destroy(); };
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
  }, [store, viewer?.id, asg?.id, canWrite, storage]);

  const set = (field, value) => {
    if (!canWrite) return;
    setAnswers(a => ({ ...a, [field]: value }));
    saver.current.change(field, value);
  };

  const handIn = async () => {
    const left = missingOf(page, answers);
    if (left.length) { setHanding("missing"); return; }
    const bad = page.questions.find(q => q.kind === "link" && String(answers[q.field] || "").trim() && !LINK.test(String(answers[q.field]).trim()));
    if (bad) { setHanding("badlink"); return; }
    setHanding("sending");
    try {
      await saver.current.flush();
      if (Object.keys(saver.current.pending()).length) { setHanding("unsaved"); return; }
      const at = await store.submit();
      setSubmitted(at || new Date().toISOString());
      setHanding("");
    } catch { setHanding("failed"); }
  };

  if (!answers) return <div className="sp"><style>{CSS}</style><p className="sp-p">{STATUS[status] || "Loading"}</p></div>;

  return (
    <div className="sp">
      <style>{CSS}</style>
      {!brief && page.intro.trim() ? <p className="sp-p">{page.intro}</p> : null}
      {!brief && page.images.length ? (
        <div className="sp-pics">
          {page.images.map((im, i) => <img key={im.src + i} className="sp-pic" src={im.src} alt={im.alt || ""} loading="lazy" />)}
        </div>
      ) : null}
      {readOnly && submitted ? <p className="sp-muted">Submitted {when(submitted)}.</p> : readOnly ? <p className="sp-muted">Not submitted.</p> : null}
      {page.questions.map(q => {
        const v = answers[q.field] || "";
        const link = q.kind === "link" && LINK.test(v.trim());
        return (
          <label key={q.field} className="sp-q">
            <span className="sp-ask">{q.ask}</span>
            {readOnly ? (
              <div className="sp-read">{link ? <a className="sp-a" href={v.trim()} target="_blank" rel="noreferrer">{v.trim()}</a> : v.trim() ? v : <span className="sp-muted">No answer.</span>}</div>
            ) : q.kind === "text" ? (
              <textarea className="sp-box" rows={4} value={v} readOnly={!canWrite} maxLength={4000} onChange={e => set(q.field, e.target.value)} />
            ) : (
              <input className="sp-box" type={q.kind === "link" ? "url" : "text"} inputMode={q.kind === "link" ? "url" : "text"} value={v} readOnly={!canWrite}
                maxLength={q.kind === "link" ? 500 : 200} placeholder={q.kind === "link" ? "https://" : ""} onChange={e => set(q.field, e.target.value)} />
            )}
            {q.kind === "link" && !readOnly && who ? <span className="sp-muted">{who} needs access to your link.</span> : null}
          </label>
        );
      })}
      {!readOnly ? (
        <div className="sp-hand">
          <div className="sp-row">
            {canWrite ? (
              <button type="button" className="sp-go" disabled={handing === "sending"} onClick={handIn}>
                {handing === "sending" ? "Submitting" : submitted ? "Submit again" : "Submit"}
              </button>
            ) : null}
            <span className={"sp-status" + (status === "retrying" ? " sp-warn" : "")} aria-live="polite">{STATUS[status]}</span>
          </div>
          {handing === "missing" ? <span className="sp-warn">The link to your work is needed before you submit.</span> : null}
          {handing === "badlink" ? <span className="sp-warn">The link has to start with https://.</span> : null}
          {handing === "unsaved" ? <span className="sp-warn">Your answers are not saved yet, so the submission did not go through. Try again in a moment.</span> : null}
          {handing === "failed" ? <span className="sp-warn">The submission did not go through. Check your connection and try again.</span> : null}
          {submitted && !handing ? <span className="sp-muted">Submitted {when(submitted)}.{canWrite ? " You can edit your answers and submit again." : ""}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── the student's ───

// On the assignment's page, under the title card. Signs the sheet in as the
// person here: the student off the roster, or the instructor under their own
// email to try the page before students see it.
export function SubmissionForm({ config, data, asg, name }) {
  const { session, email, instructor } = useSession();
  const page = pageOf(asg);
  const id = String(email || "").trim().toLowerCase();
  const me = rosterOf(config, data).find(s => s.name === name);
  const viewer = session && id ? { id, name: instructor && me?.email && String(me.email).toLowerCase() !== id ? (config.instructor?.name || "Instructor") : name } : null;
  const key = sheetKeyOf(config, asg);
  const win = windowOf(asg);
  const next = typeof window !== "undefined" ? window.location.pathname : config.path;
  // The session can arrive after the first draw, so the store follows the viewer.
  const store = useMemo(() => viewer ? supabaseStore({ supabase: gameClient, worksheetKey: key, groupKey: config.id, viewerId: viewer.id }) : null, [viewer?.id, key, config.id]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) {
    return (
      <div className="sp"><style>{CSS}</style>
        <p className="sp-p">This challenge is turned in on your email sign-in.</p>
        <a className="sp-a ca-focus" href={"/login?next=" + encodeURIComponent(next)}>Sign in</a>
      </div>
    );
  }
  if (win.state === "later") {
    return <div className="sp"><style>{CSS}</style><p className="sp-p">{win.at ? "Submissions open " + whenLong(win.at) + "." : "Submissions are not open yet."}</p></div>;
  }
  if (!store) return null;
  return (
    <>
      {win.state === "closed" ? <p className="sp-p" style={{ color: T.secondary }}>Submissions closed {whenLong(win.at)}.</p> : null}
      <SubmissionSheet key={viewer.id} asg={asg} page={page} store={store} viewer={viewer} closed={win.state === "closed"} who={config.instructor?.email || ""} />
    </>
  );
}

// ─── the instructor's ───

// One student's answers, read through /api/worksheet-submits with the PIN or
// an instructor session, the way TheirSheet in WorksheetPage reads.
export function TheirSubmission({ config, worksheetKey, student }) {
  const [data] = useClassState(config.storageKey);
  const [state, setState] = useState("loading");   // loading | none | denied | failed | shown
  const [got, setGot] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/worksheet-submits", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, key: worksheetKey, viewer: String(student.email || "").toLowerCase() }),
        });
        if (!alive) return;
        if (r.status === 401) { setState("denied"); return; }
        const out = await r.json();
        if (!out.ok) { setState("failed"); return; }
        if (!out.sheet) { setState("none"); return; }
        setGot({ store: readStore(out.answers, out.sheet.submitted_at) });
        setState("shown");
      } catch { if (alive) setState("failed"); }
    })();
    return () => { alive = false; };
  }, [config.id, worksheetKey, student.email]);
  const found = pagedAssignments(config, data).find(p => p.key === worksheetKey);
  const asg = found?.asg;
  const say = { loading: "Loading " + student.name + "'s answers.", none: student.name + " has not opened this challenge.",
    denied: "Only the instructor can open a student's answers. Sign in as the instructor and open this address again.",
    failed: "The answers could not be read. Reload to try again." }[state];
  return (
    <div style={{ padding: "16px 16px 48px", maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.02em" }}>{student.name}</h1>
      {asg ? <p style={{ fontSize: 16, color: T.secondary, margin: "0 0 8px" }}>{asg.title}</p> : null}
      {say ? <p style={{ fontSize: 17, margin: "12px 0 0" }}>{say}</p> : null}
      {state === "shown" && asg && got ? <SubmissionSheet asg={asg} page={pageOf(asg)} store={got.store} viewer={{ id: String(student.email || "").toLowerCase(), name: student.name }} readOnly brief /> : null}
    </div>
  );
}

// ─── the worksheet registry's view of an assignment ───

// Each paged assignment as a worksheet entry, the shape localWorksheets.js
// describes, so /<class>/worksheets/<key> and the Worksheets page take them
// with nothing more. Students never open the worksheet address themselves;
// their page is the assignment's. The mount is here for the address anyway.
export function assignmentSheets(config, data) {
  return pagedAssignments(config, data).map(({ asg, key }) => ({
    key, title: asg.title, asg, classes: [config.id], open: [config.id], paged: true,
    studentPath: config.path + "/assignments/" + asg.id,
    read: TheirSubmission,
    mount(root, { store, viewer, readOnly = false } = {}) {
      const r = createRoot(root);
      r.render(<SubmissionSheet asg={asg} page={pageOf(asg)} store={store} viewer={viewer} readOnly={readOnly} who={config.instructor?.email || ""} />);
      return { destroy() { r.unmount(); } };
    },
  }));
}
export const assignmentSheet = (config, data, key) => assignmentSheets(config, data).find(w => w.key === key) || null;

// ─── the editor ───

// The instructor's part of the assignment editor. value is the assignment's
// `page`: undefined (undecided, so the due date decides), false, or the page.
// onChange gets the next value. The pictures go up through /api/upload into
// the notes bucket, the same trip a clip on the day takes.
export function PageEditor({ config, asg, value, onChange }) {
  const a = config.accent;
  // Undecided goes by the due date, and a brand new challenge starts on.
  const on = value === undefined ? (!asg || hasPage(asg, config)) : value !== false;
  const page = pageOf({ page: value });
  const write = (patch) => onChange({ intro: page.intro, images: page.images, questions: page.questions, ...patch });
  const [busy, setBusy] = useState("");
  const fileRef = useRef(null);

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy("Sending " + file.name);
    try {
      const up = await uploadMedia(file, { classId: config.id, onProgress: (p) => setBusy("Sending " + file.name + ", " + Math.round(p * 100) + "%") });
      write({ images: [...page.images, { src: up.src, name: up.name, alt: "" }] });
      setBusy("");
    } catch (err) { setBusy(err.message || "The picture did not go up."); }
  };
  const setQ = (i, patch) => write({ questions: page.questions.map((q, j) => j === i ? { ...q, ...patch } : q) });

  const pill = (active) => ({ minHeight: 44, padding: "0 18px", borderRadius: 999, fontFamily: TOKENS.FONT.body, fontSize: 15, fontWeight: 600, cursor: "pointer",
    border: "1px solid " + (active ? a : L.strong), background: active ? a : S.card, color: active ? "#fff" : T.primary });
  const small = (active) => ({ ...pill(active), minHeight: 36, padding: "0 12px", fontSize: 14 });
  const box = { width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 10, border: "1px solid " + L.strong, fontFamily: TOKENS.FONT.body, fontSize: 16, background: S.card, color: T.primary };
  const fieldL = { fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 14 };
  const plain = { background: "none", border: "none", padding: 0, minHeight: 36, fontFamily: TOKENS.FONT.body, fontSize: 15, fontWeight: 600, color: TOKENS.STATE.late, cursor: "pointer" };

  return (
    <div>
      <div style={fieldL}>Submission page</div>
      <div role="radiogroup" aria-label="Submission page" style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <button type="button" role="radio" aria-checked={on} style={pill(on)} onClick={() => onChange({ intro: page.intro, images: page.images, questions: page.questions })}>On</button>
        <button type="button" role="radio" aria-checked={!on} style={pill(!on)} onClick={() => onChange(false)}>Off</button>
      </div>
      {!on ? null : (
        <>
          <div style={fieldL}>What students read first</div>
          <textarea value={page.intro} onChange={e => write({ intro: e.target.value })} style={{ ...box, minHeight: 110, lineHeight: 1.5, resize: "vertical", marginTop: 6 }} />

          <div style={fieldL}>Pictures</div>
          {page.images.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginTop: 6 }}>
              {page.images.map((im, i) => (
                <div key={im.src + i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <img src={im.src} alt={im.alt || im.name || ""} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 10, border: "1px solid " + L.soft }} />
                  <input value={im.alt || ""} placeholder="A caption" aria-label="Caption" onChange={e => write({ images: page.images.map((x, j) => j === i ? { ...x, alt: e.target.value } : x) })} style={{ ...box, minHeight: 36, padding: "6px 10px", fontSize: 14 }} />
                  <button type="button" style={plain} onClick={() => write({ images: page.images.filter((_, j) => j !== i) })}>Remove</button>
                </div>
              ))}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} aria-label="Add a picture" />
            <button type="button" style={pill(false)} onClick={() => fileRef.current && fileRef.current.click()}>Add a picture</button>
            {busy ? <span style={{ fontSize: 14, color: T.secondary }}>{busy}</span> : null}
          </div>

          <div style={fieldL}>Questions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
            {page.questions.map((q, i) => (
              <div key={q.field || i} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12, border: "1px solid " + L.soft, borderRadius: 12, background: S.card }}>
                <input value={q.ask} aria-label={"Question " + (i + 1)} onChange={e => setQ(i, { ask: e.target.value })} style={box} />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {KINDS.map(([k, say]) => <button key={k} type="button" aria-pressed={q.kind === k} style={small(q.kind === k)} onClick={() => setQ(i, { kind: k })}>{say}</button>)}
                  <button type="button" style={{ ...plain, marginLeft: "auto" }} onClick={() => write({ questions: page.questions.filter((_, j) => j !== i) })}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" style={pill(false)} onClick={() => write({ questions: withFields([...page.questions, { ask: "", kind: "text" }]) })}>Add a question</button>
            {page.questions.length !== DEFAULT_QUESTIONS.length || page.questions.some((q, i) => q.ask !== DEFAULT_QUESTIONS[i].ask)
              ? <button type="button" style={pill(false)} onClick={() => write({ questions: DEFAULT_QUESTIONS })}>Put the usual four back</button> : null}
          </div>
        </>
      )}
    </div>
  );
}

const CSS = `
.sp{display:flex;flex-direction:column;gap:16px;color:${T.primary};font-family:${TOKENS.FONT.body}}
.sp-p{margin:0;font-size:17px;line-height:1.6;color:${T.primary};white-space:pre-line;max-width:65ch}
.sp-pics{display:flex;flex-direction:column;gap:12px}
.sp-pic{width:100%;height:auto;border-radius:16px;border:1px solid ${L.soft};display:block}
.sp-q{display:flex;flex-direction:column;gap:8px;min-width:0}
.sp-ask{font-size:16px;font-weight:600;line-height:1.45}
.sp-box{width:100%;box-sizing:border-box;font:inherit;font-size:16px;line-height:1.5;padding:10px 12px;border:1px solid ${L.strong};border-radius:10px;background:${S.card};color:${T.primary};resize:vertical;min-height:44px}
.sp-box:focus-visible,.sp-go:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
.sp-read{font-size:16px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;padding:10px 12px;border-radius:10px;background:${S.sunk}}
.sp-a{color:var(--ca-accent-ink, ${T.primary});font-weight:600;overflow-wrap:anywhere}
.sp-hand{display:flex;flex-direction:column;align-items:flex-start;gap:8px;margin-top:4px}
.sp-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.sp-go{font:inherit;font-size:16px;font-weight:600;min-height:44px;padding:0 22px;border-radius:12px;border:0;background:var(--ca-accent, ${T.primary});color:#fff;cursor:pointer}
.sp-go:disabled{opacity:.6;cursor:default}
.sp-status{font-size:13px;color:${T.muted};border:1px solid ${L.soft};border-radius:999px;padding:3px 11px}
.sp-muted{font-size:15px;color:${T.secondary};line-height:1.5}
.sp-warn{color:${TOKENS.STATE.late};font-size:15px}
`;
