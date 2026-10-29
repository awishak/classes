// What the two audio story sheets share: the chip rows, the choice rows, the
// saver wiring, and the look, which is the Concepts in Team Communication
// sheet's (teamtopics/sheet.jsx) because Andrew asked for that look on the
// last two sheets.
//
// Answers are worksheet rows (worktopia/store.js), one field each, saved
// through saver.js so nothing typed is lost. Every student has their own
// sheet row and their own answer rows, so two students submitting at once
// never touch each other's words. Andrew, 2026-10-29: "we had a problem in
// the past when multiple students are trying to submit something. It clears
// stuff. So this is going to be on individual lines, right?"

import { useEffect, useRef, useState } from "react";
import { createSaver } from "../visualstory/saver.js";

export const STATUS = { loading: "Loading…", saved: "Saved", saving: "Saving…", retrying: "Not saved yet. Trying again.", "failed-load": "Could not load your sheet. Reload to try again." };
export const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const blank = (answers, f) => !String((answers || {})[f] || "").trim();
// A field's lines, one answer a line; blank lines are nothing.
export const linesOf = (value) => String(value || "").split("\n").map(l => l.trim()).filter(Boolean);

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
export const loadFont = () => {
  if (typeof document === "undefined" || document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = FONT_HREF; document.head.appendChild(l);
};

/** The sheet's answers, saved as they are typed. Returns { answers, set, submitted, setSubmitted, status, saver }. */
export function useSheet({ store, draftKey, readOnly, storage }) {
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const saver = useRef(null);
  useEffect(() => { loadFont(); }, []);
  useEffect(() => {
    const s = createSaver({ store, draftKey, storage: readOnly ? null : (storage ?? (typeof localStorage !== "undefined" ? localStorage : null)), onStatus: setStatus });
    saver.current = s;
    let alive = true;
    s.load().then(got => { if (alive) { setAnswers(got.answers); setSubmitted(got.submitted_at); } })
      .catch(() => { if (alive) setStatus("failed-load"); });
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
  }, [store, draftKey, readOnly, storage]);
  const set = (field, value) => {
    if (readOnly) return;
    setAnswers(a => ({ ...a, [field]: value }));
    saver.current.change(field, value);
  };
  return { answers, set, submitted, setSubmitted, status, saver };
}

/** Hand the sheet in: every required field full, every word on the server, then submit. Returns the handing state. */
export async function handIn({ saver, store, missing, setHanding, setSubmitted }) {
  if (missing.length) { setHanding("missing"); return; }
  setHanding("sending");
  try {
    await saver.current.flush();
    if (Object.keys(saver.current.pending()).length) { setHanding("unsaved"); return; }
    const at = await store.submit();
    setSubmitted(at || new Date().toISOString());
    setHanding("");
  } catch { setHanding("failed"); }
}

/** The line under the sheet while handing in, or nothing. */
export function handSay(handing, left) {
  if (handing === "missing" && left.length) return <span className="bad">Every box needs an answer first. {left.length === 1 ? "One is" : left.length + " are"} still empty.</span>;
  if (handing === "unsaved") return <span className="bad">Your answers are not saved yet, so the submission did not go through. Try again in a moment.</span>;
  if (handing === "failed") return <span className="bad">The submission did not go through. Check your connection and try again.</span>;
  return null;
}

// One box's lines: the chips already said, and a row to say the next one.
// Enter or the + adds; × removes; tapping a chip's words brings them back
// into the row to edit, the chip gone until Enter puts it back.
// Nothing is written inside a box. Andrew, 2026-10-29: "Don't put things in
// the boxes unless I say so."
export function Lines({ id, label, value, readOnly, onChange }) {
  const [draft, setDraft] = useState("");
  const lines = linesOf(value);
  const write = (next) => onChange(next.join("\n"));
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    write([...lines, t]);
    setDraft("");
  };
  const remove = (k) => write(lines.filter((_, i) => i !== k));
  const edit = (k) => {
    if (draft.trim()) write([...lines.filter((_, i) => i !== k), draft.trim()]);
    else write(lines.filter((_, i) => i !== k));
    setDraft(lines[k]);
  };
  return (
    <div className="lines">
      {lines.length ? (
        <div className="chips said" aria-label={label}>
          {lines.map((l, k) => (
            <span key={k} className="chip bubble">
              {readOnly ? <span className="chip-text">{l}</span>
                : <button type="button" className="chip-text focusable" title="Edit" onClick={() => edit(k)}>{l}</button>}
              {readOnly ? null : <button type="button" className="chip-x focusable" aria-label={"Remove: " + l} onClick={() => remove(k)}>×</button>}
            </span>
          ))}
        </div>
      ) : null}
      {readOnly ? null : (
        <div className="row">
          <input className="focusable" id={id} value={draft} maxLength={1000} aria-label={label}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            onBlur={() => { if (draft.trim()) add(); }} />
          <button type="button" className="save focusable" aria-label="Add" onClick={add}>+</button>
        </div>
      )}
    </div>
  );
}

// Options to tap, any number of them. The chosen ones live in one field, one
// a line, so the table's one-field rule holds and the board reads them back.
export function Choices({ label, options, value, readOnly, onChange }) {
  const picked = new Set(linesOf(value));
  const toggle = (o) => {
    if (readOnly) return;
    const next = options.filter(x => (x === o ? !picked.has(x) : picked.has(x)));
    onChange(next.join("\n"));
  };
  return (
    <div className="chips choices" role="group" aria-label={label}>
      {options.map(o => (
        <button key={o} type="button" className={"chip focusable" + (picked.has(o) ? " on" : "")} aria-pressed={picked.has(o)} disabled={readOnly} onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  );
}

/** One line of text, saved as typed. */
export function Line({ id, label, value, readOnly, onChange, max = 300 }) {
  return (
    <div className="row">
      <input className="focusable" id={id} value={value || ""} readOnly={readOnly} maxLength={max} aria-label={label} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

/** A paragraph, saved as typed. */
export function Para({ id, label, value, readOnly, onChange, rows = 5, max = 4000 }) {
  return (
    <textarea className="para focusable" id={id} value={value || ""} readOnly={readOnly} maxLength={max} rows={rows} aria-label={label} onChange={e => onChange(e.target.value)} />
  );
}

// The AFL sheet's two palettes, day on .as, night when the machine is dark
// and nobody asked for light, or when the page asked for dark.
const LIGHT = `--page:#fafaf9;--card:#ffffff;--sunk:#f6f4f1;--ink:#1c1917;--secondary:#57534e;--muted:#6b655f;--line-soft:#f0edea;--line-strong:#e3ded8;--line-ghost:#c9c2ba;--accent:#0f766e;--accent-light:#ecfdf5;--on-accent:#ffffff;--ok:#0f766e;--bad:#b45309;--m-top:#15803d;--m-ok:#16a34a;--m-close:#ea580c;--m-no:#ca8a04;--m-ohno:#dc2626;--m-ink:#ffffff`;
const DARK = `color-scheme:dark;--page:#171310;--card:#1f1a16;--sunk:#26201b;--ink:#f6f2ec;--secondary:#cdc3b9;--muted:#a79c92;--line-soft:#2b2622;--line-strong:#3a332e;--line-ghost:#4a423b;--accent:#5ecfa8;--accent-light:#1c2a26;--on-accent:#171310;--ok:#5ecfa8;--bad:#fbbf24;--m-top:#22c55e;--m-ok:#4ade80;--m-close:#fb923c;--m-no:#facc15;--m-ohno:#f87171;--m-ink:#171310`;
export const CSS = `
.as{${LIGHT};--font:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;--mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace}
@media (prefers-color-scheme: dark){.as:not([data-theme="light"]){${DARK}}}
.as[data-theme="dark"]{${DARK}}
.as{box-sizing:border-box;color:var(--ink);font-family:var(--font);font-size:17px;line-height:1.45;background:var(--page);padding-inline:16px;padding-block:24px 64px}
.as *{box-sizing:border-box}
.as .sheet{max-width:1100px;margin:0 auto;border-radius:16px;overflow:hidden;background:var(--card);border:1px solid var(--line-soft);display:grid;gap:20px;padding-bottom:4px}
.as .head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;padding:24px 28px 0;flex-wrap:wrap}
.as .title{display:grid;gap:6px;width:100%}
.as .name{font-size:26px;font-weight:600;line-height:1.2;margin:0;letter-spacing:-.01em}
.as .credit{font-size:17px;color:var(--secondary)}
.as .intro{margin:0;font-size:17px;line-height:1.5;color:var(--ink);padding-top:6px;max-width:72ch;white-space:pre-line}
.as .intro:empty{display:none}
.as .editbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-top:6px}
.as .part{display:grid;gap:14px;padding:20px 28px 24px;border-top:1px solid var(--line-soft)}
.as .phead{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.as .phead .n{font-size:23px;font-weight:600;line-height:1.2;color:var(--ink);overflow-wrap:anywhere}
.as .sub{font-size:15px;color:var(--secondary)}
.as .field{display:grid;gap:8px}
.as .ask{font-size:20px;font-weight:500;line-height:1.3;color:var(--ink)}
.as .hint{margin:0;font-size:17px;color:var(--secondary);line-height:1.5;max-width:72ch;white-space:pre-line}
.as .row{display:flex;gap:8px;align-items:center}
.as .row input{font-family:var(--font);font-size:17px;min-height:48px;padding:0 14px;border:1px solid var(--line-strong);border-radius:10px;background:var(--card);color:var(--ink);outline:none;min-width:0;flex:1;max-width:640px}
.as .row input::placeholder{color:var(--muted)}
.as .para{font-family:var(--font);font-size:17px;line-height:1.5;padding:12px 14px;border:1px solid var(--line-strong);border-radius:10px;background:var(--card);color:var(--ink);outline:none;width:100%;max-width:72ch;resize:vertical}
.as .chips{display:flex;flex-wrap:wrap;gap:6px}
.as .chip{font:inherit;font-family:var(--font);display:inline-flex;align-items:center;font-size:15px;font-weight:500;color:var(--ink);background:var(--sunk);border:1px solid var(--line-soft);border-radius:999px;padding:6px 12px;min-height:36px;cursor:pointer}
.as .chip:hover{border-color:var(--accent);color:var(--accent)}
.as .chip.on{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.as .chip[disabled]{cursor:default}
.as .ideas{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.as .box{background:var(--sunk);border-radius:16px;padding:16px;display:grid;gap:10px;align-content:start;position:relative}
.as .box .bh{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.as .box h2{margin:0;font-size:20px;font-weight:500}
.as .box .bh .sub{color:var(--ok)}
.as .box .ask{font-size:17px}
.as .box .sub{font-size:14px}
.as .box .row input{max-width:none;background:var(--card)}
.as .box .para{max-width:none;background:var(--card)}
.as .lines{display:grid;gap:10px}
.as .lines .row input{max-width:none;font-size:16px;min-height:44px;padding:0 12px}
.as .save{width:44px;height:44px;border-radius:10px;border:0;background:var(--accent);color:var(--on-accent);font-size:20px;display:grid;place-items:center;cursor:pointer;flex:none}
.as .save:hover{filter:brightness(1.08)}
.as .chips.said{gap:8px}
.as .chip.bubble{background:var(--card);border:1px solid var(--line-strong);border-radius:16px 16px 16px 4px;padding:6px 6px 6px 12px;gap:4px;align-items:flex-start;max-width:100%;font-size:15px;line-height:1.4;cursor:default}
.as .chip.bubble:hover{border-color:var(--line-strong);color:var(--ink)}
.as .chip-text{font:inherit;color:inherit;background:none;border:0;padding:0;text-align:left;cursor:text;white-space:pre-wrap;overflow-wrap:anywhere;min-width:0}
.as .chip-x{font:inherit;width:28px;height:28px;flex:none;border-radius:999px;border:0;background:transparent;color:var(--muted);cursor:pointer;font-size:18px;line-height:1;display:grid;place-items:center}
.as .chip-x:hover{color:var(--ink);background:var(--sunk)}
.as .mark{display:inline-flex;align-items:center;gap:6px;font-family:var(--font);font-size:15px;font-weight:600;border-radius:999px;padding:6px 14px;color:var(--m-ink);background:var(--m-c);justify-self:start}
.as .mark.top{--m-c:var(--m-top)} .as .mark.ok{--m-c:var(--m-ok)} .as .mark.close{--m-c:var(--m-close)} .as .mark.no{--m-c:var(--m-no)} .as .mark.ohno{--m-c:var(--m-ohno)}
.as .mark.no{color:#1c1917}
.as .audio{display:grid;gap:10px;justify-items:start}
.as .clip{display:grid;gap:8px;justify-items:start}
.as .clip audio{width:min(100%,480px)}
.as .pick{display:inline-flex;align-items:center;cursor:pointer}
.as .pick input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.as .audio .bar{height:8px;width:min(100%,480px);border-radius:999px;background:var(--line-soft);overflow:hidden}
.as .audio .bar i{display:block;height:100%;background:var(--accent);transition:width .2s ease}
.as .pair{margin:0;font-size:19px}
.as .foot{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:8px 28px 24px;flex-wrap:wrap;min-height:76px;border-top:1px solid var(--line-soft)}
.as .foot .say{font-size:17px;color:var(--secondary);flex:1;min-width:200px}
.as .foot .say b{color:var(--ink);font-weight:600}
.as .foot .go{color:var(--accent);font-weight:600}
.as .bad{color:var(--bad)}
.as .status{font-size:14px;color:var(--secondary);min-height:1.4em}
.as .status.bad{color:var(--bad)}
.as .btn{font-family:var(--font);font-size:15px;font-weight:600;min-height:44px;padding:0 20px;border-radius:10px;border:1px solid var(--line-strong);background:var(--card);color:var(--ink);cursor:pointer}
.as .btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.as .btn.small{min-height:36px;padding:0 14px;font-size:14px}
.as .btn[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--card)}
.as .btn[disabled]{opacity:.4;cursor:default}
.as .focusable:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.as.ro .foot{display:none}
.as .vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.45;padding:4px 8px;margin:0;border:1.5px dashed var(--line-strong);border-radius:8px;background:var(--card);resize:none;overflow:hidden}
.as .vsp-edit.name{font-size:26px;font-weight:600}
.as .vsp-edit.intro{font-size:17px}
@media (max-width:860px){.as .ideas{grid-template-columns:1fr}.as .head,.as .part,.as .foot{padding-inline:18px}}
@media (prefers-reduced-motion: reduce){.as *{transition:none!important}}
`;
