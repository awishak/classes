// What a student gets back on their pre-production, at the top of the audio
// story page. Andrew, 2026-11-12: "i want a card on the front page of our
// site, and i want it to take them to the submission for the audio story due
// Sunday. remember, it should have some feedback up top." Then, after seeing
// the note alone: "what about the timeline for them? what about the info,
// opening closing etc? what about sources?" So the block is the mockup's: his
// note, the clip by voice, opening, thesis and closing in their own words,
// interview, structure and new information, and their sources.
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
import { sentencesOf } from "./readtext.js";
import { NoteBody, FEEDBACK_CSS } from "./note.jsx";
import { Three, Timeline, Sources, Rate, REVIEW_CSS } from "./prepages.jsx";

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
    return { sources: String(a.sources || ""), url: clip ? urls[clip.path] || "" : "" };
  }
  const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", PRE_KEY).eq("group_key", classId).eq("viewer_id", who);
  const id = s.data && s.data[0] && s.data[0].id;
  if (!id) return { sources: "", url: "" };
  const r = await gameClient.from("worksheet_answers").select("field,value,position").eq("sheet_id", id).in("field", ["audio", "sources"]).order("position");
  const join = (f) => (r.data || []).filter(x => x.field === f).map(x => x.value).join("");
  const clip = audioOf(join("audio"));
  const urls = clip ? await signUrls([clip.path]).catch(() => ({})) : {};
  return { sources: join("sources").trim(), url: clip ? urls[clip.path] || "" : "" };
}

export function StoryFeedback({ classId, viewer }) {
  const [got, setGot] = useState(null);
  const [pre, setPre] = useState({ sources: "", url: "" });
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
        if (alive && p) setPre(p);
      } catch { /* no feedback to show */ }
    })();
    return () => { alive = false; };
  }, [classId, me]);
  // His note outranks Claude's read: where his note says a part needs work,
  // or says the part is good, `you.rate` carries his call and the mark follows.
  const read = useMemo(() => {
    const r = got?.read || null;
    const rate = r?.you?.rate;
    if (!r || !rate) return r;
    const out = { ...r };
    for (const k of ["opener", "thesis", "closer"]) if (out[k] && typeof rate[k] === "boolean") out[k] = { ...out[k], verdict: rate[k] ? "meets" : "partly" };
    return out;
  }, [got]);
  const his = (k, mine) => (typeof read?.you?.rate?.[k] === "boolean" ? read.you.rate[k] : mine);
  const sents = useMemo(() => sentencesOf(read?.transcript || []), [read]);
  if (!got) return null;
  const fact = (label, say, ok) => <div className="apr-row apr-fact"><div className="apr-side"><h3 className="apr-pl">{label}</h3><Rate ok={ok} /></div>{say ? <p className="apr-say">{say}</p> : <span />}</div>;
  // Andrew, 2026-11-12: "make it way prettier like you had before. and let
  // people collapse my guidance and feedback." One white card of ruled rows,
  // the mockup's, with a button that folds the card and remembers the fold.
  const fold = () => { const next = !open; setOpen(next); try { localStorage.setItem("audio-story-feedback", next ? "open" : "hidden"); } catch { /* the fold is a convenience */ } };
  return (
    <section className="afb-card aic" aria-labelledby="afb-h2">
      <style>{REVIEW_CSS + FEEDBACK_CSS}</style>
      <div className="afb-top">
        <h2 id="afb-h2" className="afb-h2">Feedback on your pre-production</h2>
        <button type="button" className="afb-fold" aria-expanded={open} onClick={fold}>{open ? "Hide" : "Show"}</button>
      </div>
      {open ? (
        <div className="afb-rows apr-read">
          {String(got.note || "").trim() ? <div className="apr-row apr-fact"><h3 className="apr-pl">From Dr. Ishak</h3><NoteBody note={got.note} /></div> : null}
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
              <Three read={read} sents={sents} onSeek={pre.url ? seek : undefined} says={read.you || {}} />
              {read.interview ? fact("Interview", read.you?.interview, his("interview", !!read.interview.has)) : null}
              {read.structure ? fact("Structure", read.you?.structure, his("structure", read.structure.level === "clear")) : null}
              {read.news ? fact("New information", read.you?.news, his("news", read.news.level === "reported")) : null}
              {pre.sources ? <div className="apr-row apr-fact"><h3 className="apr-pl">Your sources</h3><Sources text={pre.sources} links={got.links} /></div> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
