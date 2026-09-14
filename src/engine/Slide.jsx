// A block's slide: what the block puts on the room screen, drawn small beside it.
//
// There is no second slide system. The room screen already knows how to draw
// every kind of cast, and every row in the day already builds the cast its
// arrow sends. So a slide is that cast, handed to the room screen's own Content
// and scaled down to the width of the column. What sits beside a block is what
// the room will see.
//
// Three things are drawn differently from the wall, on purpose:
//   A link shows as its card, the headline over the article's picture. On the
//     wall a link may be the live page, and twenty live pages down one day is
//     twenty sites loading at once.
//   A clip shows its first frame and does not play. On the wall it autoplays.
//   A voice memo shows its headline, since there is nothing to see.
//
// Slides draw only once they scroll near the screen, so a long day or a whole
// term costs what is visible and no more.

import { useEffect, useRef, useState } from "react";
import { Content } from "./ClassroomView.jsx";
import { mediaSteps, mediaLabel } from "./media.js";
import * as TOKENS from "./tokens.js";

// Whether the slide column is open, remembered in this browser. The day plan and
// the outline share it, so closing slides in one closes them in both.
const SLIDES_KEY = "dash-slides-v1";
export const readSlidesOn = () => { try { return localStorage.getItem(SLIDES_KEY) !== "0"; } catch { return true; } };
export const writeSlidesOn = (on) => { try { localStorage.setItem(SLIDES_KEY, on ? "1" : "0"); } catch { /* private window */ } };

const W = 1280;
const H = 720;
const IMAGE_URL = /\.(png|jpe?g|gif|webp|avif)(\?|#|$)/i;
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

// What a row's slide is. The same choices the row's arrow makes, so the slide
// and the cast agree; a file shows the file rather than the headline that
// plays before it, because the file is the thing worth seeing at this size.
export function slideOf({ item, block, seed, title, claim, tag, features }) {
  const words = claim || title || "";
  if (item?.feature) {
    return { type: "feature", title: item.feature, body: (features || {})[item.feature] || "", label: item.feature };
  }
  if (block?.media?.src) {
    const steps = mediaSteps(block, words, tag) || [];
    return (steps[1] || steps[0])?.payload || null;
  }
  if (block?.url && IMAGE_URL.test(block.url)) {
    return { type: "media", media: "image", src: block.url, title: words, label: words };
  }
  if (block?.url) {
    return { type: "doc", kind: hostOf(block.url) || "Link", title: words, label: words,
      url: block.url, openUrl: block.url, mode: "card", pick: !!block.pick };
  }
  return { type: "quote", tag: tag || "", title: words, label: words,
    cite: block?.concept || seed?.concept || "", pick: !!block?.pick };
}

function Face({ cast, config }) {
  if (cast.type === "media" && cast.media === "video") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#000" }}>
        <video src={cast.src + "#t=0.1"} poster={cast.poster || undefined} muted playsInline preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
    );
  }
  if (cast.type === "media" && cast.media === "audio") {
    return <Content cast={{ type: "quote", tag: mediaLabel("audio"), title: cast.title }} config={config} />;
  }
  return <Content cast={cast} config={config} />;
}

export default function Slide({ cast, config, onClick, live, label, big }) {
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
          <Face cast={cast} config={config || { path: "" }} />
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
