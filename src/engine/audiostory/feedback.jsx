// What a student gets back on their pre-production, at the top of the audio
// story page. Andrew, 2026-11-12: "i want a card on the front page of our
// site, and i want it to take them to the submission for the audio story due
// Sunday. remember, it should have some feedback up top." Then, after seeing
// the note alone: "what about the timeline for them? what about the info,
// opening closing etc? what about sources?" So the block is the mockup's: his
// note, the clip by voice, opening, thesis and closing in their own words,
// interview, structure and new information, and their sources. The same day:
// "more color, remove ALL your shitty commentary." So no sentence of Claude's
// is on the card: a row is its mark and the student's own words.
//
// All of it comes from the private instructor bucket through
// /api/sitdown-sheet?sheet=audio-pre-feedback, which hands a student their
// own and nobody else's, and only once the notes file says released. An
// instructor sees any one student's, released or not, by adding ?as=<email>
// to the story page, to read it the way the student will.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { gameClient } from "../gameClient.js";
import { signUrls } from "../visualstory/photos.js";
import { audioOf } from "./audio.js";
import { sentencesOf, passageOf } from "./readtext.js";
import { NoteBody, FEEDBACK_CSS } from "./note.jsx";
import { Timeline, Rate, At, REVIEW_CSS } from "./prepages.jsx";

const PRE_KEY = "audio-pre";

// A student reads their own pre-production sheet as themselves. The
// instructor's preview reads the one student's through the server.
async function preOf({ classId, who, preview }) {
  if (preview) {
    const post = async (body) => { const r = await fetch("/api/worksheet-submits", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), groupKey: classId, key: PRE_KEY, ...body }) }); return r.ok ? r.json() : {}; };
    const all = await post({ all: true });
    const a = ((all.sheets || []).find(s => String(s.viewer_id || "").toLowerCase() === who) || {}).answers || {};
    const clip = audioOf(a.audio);
    const urls = clip ? (await post({ sign: [clip.path] })).urls || {} : {};
    return { sources: String(a.sources || ""), story: String(a.story || "").trim(), url: clip ? urls[clip.path] || "" : "" };
  }
  const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", PRE_KEY).eq("group_key", classId).eq("viewer_id", who);
  const id = s.data && s.data[0] && s.data[0].id;
  if (!id) return { sources: "", story: "", url: "" };
  const r = await gameClient.from("worksheet_answers").select("field,value,position").eq("sheet_id", id).in("field", ["audio", "sources", "story"]).order("position");
  const join = (f) => (r.data || []).filter(x => x.field === f).map(x => x.value).join("");
  const clip = audioOf(join("audio"));
  const urls = clip ? await signUrls([clip.path]).catch(() => ({})) : {};
  return { sources: join("sources").trim(), story: join("story").trim(), url: clip ? urls[clip.path] || "" : "" };
}

export function StoryFeedback({ classId, viewer, onPre }) {
  const [got, setGot] = useState(null);
  const [pre, setPre] = useState({ sources: "", story: "", url: "" });
  const [open, setOpen] = useState(() => { try { return localStorage.getItem("audio-story-feedback") !== "hidden"; } catch { return true; } });
  const audio = useRef(null);
  const seek = useCallback((t) => { const el = audio.current; if (!el) return; try { el.currentTime = t; el.play(); } catch { /* the player says so itself */ } }, []);
  const me = String(viewer?.id || "").toLowerCase();
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const as = (new URLSearchParams(window.location.search).get("as") || "").trim().toLowerCase();
        const pin = as ? savedPin() : "";
        const r = await fetch("/api/sitdown-sheet?sheet=audio-pre-feedback&class=" + encodeURIComponent(classId || "") + (as ? "&as=" + encodeURIComponent(as) : "") + (pin ? "&pin=" + encodeURIComponent(pin) : ""), { headers: await authHeaders() });
        const out = r.ok ? await r.json() : null;
        if (!alive || !out || !(out.note || out.read)) return;
        setGot(out);
        const p = await preOf({ classId, who: as || me, preview: !!as }).catch(() => null);
        if (alive && p) { setPre(p); if (as && onPre) onPre(p); }
      } catch { /* no feedback to show */ }
    })();
    return () => { alive = false; };
  }, [classId, me]);
  const read = got?.read || null;
  // What he said about a part outranks the read's mark: his.ok is his call,
  // his.say is one sentence of his. Andrew, 2026-11-12: "a single complete
  // sentence from me," and "if i gave advice on any of them, include it."
  const his = read?.his || {};
  const okOf = (k, mine) => (typeof his[k]?.ok === "boolean" ? his[k].ok : mine);
  const sents = useMemo(() => sentencesOf(read?.transcript || []), [read]);
  if (!got) return null;
  const tile = (label, k, mine, more) => {
    const ok = okOf(k, mine);
    if (ok == null && !his[k]?.say) return null;
    return (
      <div key={k} className={"afb-tile " + (ok ? "afb-yes" : "afb-could")}>
        <div className="afb-tile-top"><h3 className="apr-pl">{label}</h3><Rate ok={!!ok} /></div>
        {more}
        {his[k]?.say ? <p className="afb-tile-say">{his[k].say}</p> : null}
      </div>
    );
  };
  // "shorten the context around intro, thesis, and conclusion": the line and
  // about a sentence on each side.
  const line = (k) => {
    const p = read[k];
    if (!p) return null;
    const more = p.quote ? passageOf(sents, p.quote, k, [16, 16]) : null;
    return (
      <>
        {p.kind ? <span className="afb-tile-kind">{p.kind}</span> : null}
        {p.quote ? <p className="afb-tile-q">“{more ? <>{more.cutStart ? "… " : ""}{more.before ? more.before + " " : ""}<mark>{more.mark}</mark>{more.after ? " " + more.after : ""}{more.cutEnd ? " …" : ""}</> : <mark>{p.quote}</mark>}”</p> : null}
        <At at={p.at} onSeek={pre.url ? seek : undefined} />
      </>
    );
  };
  // Andrew, 2026-11-12: "make it way prettier like you had before. and let
  // people collapse my guidance and feedback." One white card of ruled rows,
  // the mockup's, with a button that folds the card and remembers the fold.
  const fold = () => { const next = !open; setOpen(next); try { localStorage.setItem("audio-story-feedback", next ? "open" : "hidden"); } catch { /* the fold is a convenience */ } };
  return (
    <section className="afb-card aic" aria-labelledby="afb-h2">
      <style>{REVIEW_CSS + FEEDBACK_CSS}</style>
      <div className="afb-top">
        <h2 id="afb-h2" className="afb-h2">{pre.story ? <>Feedback on <span className="afb-idea">{pre.story}</span></> : "Feedback on your pre-production"}</h2>
        <button type="button" className="afb-fold" aria-expanded={open} onClick={fold}>{open ? "Hide" : "Show"}</button>
      </div>
      {open ? (
        <div className="afb-rows apr-read">
          {String(got.note || "").trim() ? <div className="afb-from"><h3 className="apr-pl">From Dr. Ishak</h3><NoteBody note={got.note} work="Things to work on" /></div> : null}
          {read ? (
            <>
              {pre.url || read.timeline?.parts?.length ? (
                <div className="apr-row apr-fact">
                  <h3 className="apr-pl">Your clip by voice</h3>
                  <div className="afb-clip">
                    {pre.url ? <audio ref={audio} controls preload="metadata" src={pre.url} /> : null}
                    {read.timeline?.parts?.length ? <Timeline line={read.timeline} onSeek={pre.url ? seek : undefined} mine /> : null}
                  </div>
                </div>
              ) : null}
              {/* Andrew, 2026-11-12, his words to every student. */}
              <p className="afb-keep">Just because you got a green checkmark does not mean there isn't room for improvement in a particular area. I want you to keep making this better.</p>
              <div className="afb-tiles afb-three">
                {tile("Opening", "opener", read.opener ? read.opener.verdict === "meets" : null, line("opener"))}
                {tile("Thesis", "thesis", read.thesis ? read.thesis.verdict === "meets" : null, line("thesis"))}
                {tile("Closing", "closer", read.closer ? read.closer.verdict === "meets" : null, line("closer"))}
              </div>
              <div className="afb-tiles afb-four">
                {tile("Interview", "interview", read.interview ? !!read.interview.has : null)}
                {tile("Structure", "structure", read.structure ? read.structure.level === "clear" : null)}
                {tile("New information", "news", read.news ? read.news.level === "reported" : null)}
                {tile("Dynamics", "dynamics", null)}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
