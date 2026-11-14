// The way from the home and My work to the classmates' audio stories.
//
// Andrew, 2026-11-13: "let them know that, you know, you have [three]
// assigned, and I want you to review two others." The visual stories' door
// (visualstory/door.jsx) for sound: once the window opens, a bright bar sits
// at the top of the home and a row under My work, each with the student's
// own count. Before the window opens nothing is drawn.
//
// The standing is one light read from the review route, as the signed-in
// student, once a page load.

import { useState, useEffect } from "react";
import { authHeaders } from "../session.js";
import { Row, Io } from "../portal/bits.jsx";
import { barUp, NEED_TOTAL, NEED_ASSIGNED } from "./reviewmodel.js";

// The classes with the page, the same list App.jsx routes /<class>/audio-stories for.
export const AUDIO_REVIEW_CLASSES = ["comm3", "comm999"];
export const audioStoriesHref = (config) => "/" + (config.id || config) + "/audio-stories";

const asked = new Map();   // class id -> the standing, as a promise

export function audioReviewStanding(config) {
  if (!config || !AUDIO_REVIEW_CLASSES.includes(config.id)) return Promise.resolve(null);
  if (!asked.has(config.id)) asked.set(config.id, (async () => {
    try {
      const r = await fetch("/api/audio-review", {
        method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ groupKey: config.id, action: "status" }),
      });
      const out = await r.json().catch(() => null);
      return r.ok && out && out.ok ? out : null;
    } catch { return null; }
  })());
  return asked.get(config.id);
}

export function useAudioReviewStanding(config) {
  const [standing, setStanding] = useState(null);
  useEffect(() => {
    let alive = true;
    audioReviewStanding(config).then(s => { if (alive) setStanding(s); });
    return () => { alive = false; };
  }, [config?.id]);
  return standing;
}

/** What the door says at each stage; nothing while building. */
export function doorWords(config, st) {
  const stage = st?.stage || "";
  const href = audioStoriesHref(config);
  if (stage === "reading") {
    const total = st.total || 0, left = Math.max(0, NEED_TOTAL - total);
    const done = total >= NEED_TOTAL && (st.requiredDone || 0) >= (st.required || 0);
    return {
      name: "Review your classmates' audio stories",
      say: `You are assigned ${NEED_ASSIGNED} stories, and you choose at least ${NEED_TOTAL - NEED_ASSIGNED} more. Comments are due Wednesday, November 18, at 11:59 PM.`,
      line: done ? `You have reviewed ${total} stories.` : `You have reviewed ${total} of ${NEED_TOTAL}. ${left ? left + " to go" : "Finish the stories outlined in red"}, due Wednesday at 11:59 PM.`,
      tint: done ? "done" : "due", href, done,
    };
  }
  if (stage === "closed") return { name: "Your classmates' audio stories", say: "Comments are closed. The comments on your story, with names attached, come out on Thursday.", line: "Comments are closed.", tint: "done", href };
  if (stage === "released") {
    const own = st.mine ? href + "?s=" + st.mine : href;
    return { name: "Your classmates' comments are in", say: "Open your audio story to read what your classmates said.", line: "Open your story to read the comments.", tint: "done", href: own };
  }
  return null;
}

// The bright bar at the top of the home. The released bar steps down at the
// end of its week (barUp).
export function AudioReviewBar({ config }) {
  const st = useAudioReviewStanding(config);
  const w = doorWords(config, st);
  if (!w || !barUp(st.stage, config.id)) return null;
  return (
    <a className="pt-gobar pt-focus" href={w.href}>
      <span className="pt-gobar-main">
        <span className="pt-gobar-name">{w.name}</span>
        <span className="pt-gobar-say">{w.say}</span>
      </span>
      <span className="pt-gobar-go" aria-hidden="true">Open</span>
    </a>
  );
}

// A row under My work, on the home and on the My work page.
export function AudioReviewRow({ config }) {
  const st = useAudioReviewStanding(config);
  const w = doorWords(config, st);
  if (!w) return null;
  const open = () => { window.location.href = w.href; };
  return (
    <Row tint={w.tint} onOpen={open} side={<Io kind="go" href={w.href}>Open</Io>}>
      <p className="pt-title">{w.name}</p>
      <p className={"pt-when " + w.tint}><span>{w.line}</span></p>
    </Row>
  );
}
