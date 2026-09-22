// A block's slide: what the block puts on the room screen, drawn small beside it.
//
// There is no second slide system. A row's slide is the cast its slide sends:
// one of the templates in RoomSlide.jsx, drawn by the same component the room
// screen uses and scaled down to the width of the column. What sits beside a
// block is what the room will see.
//
// Two things are drawn differently from the wall, on purpose:
//   A clip shows its first frame and does not play. On the wall it autoplays.
//   A voice memo shows its headline, since there is nothing to see.
//
// Slides draw only once they scroll near the screen, so a long day or a whole
// term costs what is visible and no more.

import { useEffect, useRef, useState } from "react";
import { Content } from "./ClassroomView.jsx";
import RoomSlide, { slideFor } from "./RoomSlide.jsx";
import { mediaSteps, mediaLabel } from "./media.js";
import * as TOKENS from "./tokens.js";

// Whether the slide column is open, remembered in this browser. The day plan and
// the outline share it, so closing slides in one closes them in both.
const SLIDES_KEY = "dash-slides-v1";
export const readSlidesOn = () => { try { return localStorage.getItem(SLIDES_KEY) !== "0"; } catch { return true; } };
export const writeSlidesOn = (on) => { try { localStorage.setItem(SLIDES_KEY, on ? "1" : "0"); } catch { /* private window */ } };

const W = 1280;
const H = 720;

// What a row's slide is: one of the slide templates in RoomSlide.jsx, chosen by
// the row's kind. A clip or a voice memo uploaded from a phone keeps playing
// the way it always has, as a file on the wall.
export function slideOf(args) {
  const { block, title, claim, tag } = args;
  if (block?.media?.src && block.media.kind !== "image") {
    const steps = mediaSteps(block, claim || title || "", tag) || [];
    return (steps[1] || steps[0])?.payload || null;
  }
  return slideFor(args);
}

function Face({ cast, config, ground }) {
  if (cast.type === "slide") return <RoomSlide slide={cast} ground={ground} />;
  if (cast.type === "media" && cast.media === "video") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <video src={cast.src + "#t=0.1"} poster={cast.poster || undefined} muted playsInline preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
    );
  }
  // A voice memo or a document has no picture of its own, so its thumbnail is
  // the headline under the kind of file. A viewer inside every row's
  // thumbnail would be a page of iframes.
  if (cast.type === "media" && cast.media !== "image") {
    return <Content cast={{ type: "quote", tag: mediaLabel(cast.media), title: cast.title }} config={config} />;
  }
  return <Content cast={cast} config={config} />;
}

export default function Slide({ cast, config, onClick, live, label, big, ground }) {
  const box = useRef(null);
  // With no way to tell what is on screen (the build's server render, an old
  // browser) every slide draws straight away.
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
  const [scale, setScale] = useState(200 / W);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    let io = null;
    let ro = null;
    if (typeof IntersectionObserver === "undefined") setNear(true);
    else {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: "300px" });
      io.observe(el);
    }
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(([e]) => { if (e.contentRect.width) setScale(e.contentRect.width / W); });
      ro.observe(el);
    }
    return () => { if (io) io.disconnect(); if (ro) ro.disconnect(); };
  }, []);

  if (!cast) return null;
  const press = onClick ? {
    role: "button", tabIndex: 0, onClick,
    onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } },
    title: live ? "On the room screen now" : "Put this slide on the room screen",
    "aria-label": (live ? "On the room screen: " : "Put on the room screen: ") + (label || cast.title || ""),
  } : { "aria-hidden": "true" };

  return (
    <div ref={box} className={"slide" + (big ? " big" : "") + (onClick ? " slide-press" : "") + (live ? " slide-live" : "")} {...press}>
      {near ? (
        <div className="slide-stage" style={{ width: W, height: H, transform: "scale(" + scale + ")" }}>
          <Face cast={cast} config={config || { path: "" }} ground={ground} />
        </div>
      ) : null}
    </div>
  );
}

export const SLIDE_CSS = `
/* A slide: the room screen at the width of its column, never taller than 150px. */
.slide{position:relative;width:100%;max-width:200px;aspect-ratio:16/9;max-height:150px;overflow:hidden;
  border-radius:8px;background:${TOKENS.ROOM.stage};box-shadow:0 0 0 1px rgba(23,19,16,.12);flex:none}
.slide-stage{position:absolute;top:0;left:0;transform-origin:top left;pointer-events:none;
  color:${TOKENS.ROOM.ink};font-family:${TOKENS.FONT.body}}
.slide-press{cursor:pointer;transition:box-shadow .12s,transform .12s}
.slide-press:hover{box-shadow:0 0 0 2px var(--dash-accent)}
.slide-press:focus-visible{outline:none;box-shadow:0 0 0 3px var(--dash-accent)}
.slide-live{box-shadow:0 0 0 3px ${TOKENS.STATE.live}}
/* The Teach view shows one slide, as wide as its column allows. */
.slide.big{max-width:none;max-height:none;border-radius:14px}
`;
