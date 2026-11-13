// His feedback on a student's pre-production, shown at the top of the audio
// story page. Andrew, 2026-11-12: "i want a card on the front page of our
// site, and i want it to take them to the submission for the audio story due
// Sunday. remember, it should have some feedback up top."
//
// The words are his notes from the pre-production review, kept in the private
// instructor bucket. /api/sitdown-sheet?sheet=audio-pre-feedback hands a
// student their own note and nobody else's, and only once the notes file says
// released. An instructor sees any one student's note, released or not, by
// adding ?as=<email> to the story page, to read it the way the student will.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";

// A note is paragraphs with blank lines between; a paragraph that opens with
// "1. " is a numbered point.
export function NoteBody({ note }) {
  const blocks = String(note || "").split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const out = [];
  let list = null;
  blocks.forEach((b, i) => {
    const m = b.match(/^(\d+)\.\s+([\s\S]*)$/);
    if (m) {
      // Andrew, 2026-11-12: "each piece of the one to 3 piece of advice that
      // I give, you need to give it a title, like opening or interviews." A
      // point written "1. Opening: ..." shows Opening as its title.
      const t = m[2].match(/^([A-Z][A-Za-z, ]{2,40}):\s+([\s\S]*)$/);
      if (!list) { list = []; out.push(<ol key={"l" + i} className="afb-list">{list}</ol>); }
      list.push(<li key={i}>{t ? <><b className="afb-t">{t[1]}</b>{t[2]}</> : m[2]}</li>);
    }
    else { list = null; out.push(<p key={i} className="afb-p">{b}</p>); }
  });
  return <div className="afb-body">{out}</div>;
}

export function StoryFeedback({ classId }) {
  const [note, setNote] = useState("");
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const as = new URLSearchParams(window.location.search).get("as") || "";
        const pin = as ? savedPin() : "";
        const r = await fetch("/api/sitdown-sheet?sheet=audio-pre-feedback&class=" + encodeURIComponent(classId || "") + (as ? "&as=" + encodeURIComponent(as) : "") + (pin ? "&pin=" + encodeURIComponent(pin) : ""), { headers: await authHeaders() });
        const out = r.ok ? await r.json() : null;
        if (alive && out?.note) setNote(out.note);
      } catch { /* no feedback to show */ }
    })();
    return () => { alive = false; };
  }, [classId]);
  if (!note.trim()) return null;
  return (
    <section className="afb" aria-label="Feedback from Dr. Ishak">
      <style>{FEEDBACK_CSS}</style>
      <h2 className="afb-h">From Dr. Ishak</h2>
      <NoteBody note={note} />
    </section>
  );
}

export const FEEDBACK_CSS = `
.afb{border-left:4px solid var(--state-good,#1a7f4b);background:var(--surface-card,#fff);box-shadow:0 0 0 1px var(--line-soft,rgba(0,0,0,.1));border-radius:10px;padding:18px 22px 20px;max-width:860px;display:flex;flex-direction:column;gap:10px}
.afb-h{margin:0;font-size:15px;font-weight:700;letter-spacing:.02em}
.afb-body{display:flex;flex-direction:column;gap:10px;font-size:18px;line-height:1.55}
.afb-p{margin:0}
.afb-t{display:block;font-size:19px;font-weight:700}
.afb-list{margin:0;padding-left:1.4em;display:flex;flex-direction:column;gap:10px}
`;
