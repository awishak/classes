// The colour behind a photo on the wall.
//
// A picture contained in a screen leaves bars, and the bars were black.
// Andrew, 2026-09-22: "when we have an image on teh screen, it should fit the
// screen, either top ot bottom, left to right, or both, then the background
// color should be derived from the color of the image."
//
// So the bars take the average of the picture's own edge: the ring of pixels
// they touch, rather than the whole picture. Nothing here knows the shape of
// the wall, and the ring is the right answer whether the bars land down the
// sides or across the top and bottom.
//
// The average is the honest one, bright pictures included. Nothing is written
// over a photo any more, so there is no caption for a pale surround to
// swallow: "if i have an image, all i want is the image."
//
// Reading pixels is a canvas, which is a browser. The server render, a
// picture from a host that sends no CORS header, and a load that never
// arrives all come back with nothing, and the caller keeps black.

import { useEffect, useState } from "react";

const PROBE = 48;   // the long side of the copy we average, in pixels

const two = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
const hexOf = (r, g, b) => "#" + two(r) + two(g) + two(b);

// The average of the ring of pixels around the edge of a picture, as a hex
// colour, or "" when there is nothing to average. `data` is RGBA, four numbers
// a pixel, the way a canvas hands it over. A pixel counts for as much as it is
// opaque, so a picture with a transparent corner is the colour of what you can
// actually see, and one that is transparent all the way round is no colour at
// all.
export function edgeAverage(data, w, h, band = 2) {
  const d = Math.max(1, Math.min(band, Math.floor(Math.min(w, h) / 2)));
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = 0; y < h; y++) {
    const onEdgeRow = y < d || y >= h - d;
    for (let x = 0; x < w; x++) {
      // Down the middle of the picture, step straight across to the far side.
      if (!onEdgeRow && x >= d && x < w - d) { x = w - d - 1; continue; }
      const i = (y * w + x) * 4;
      const a = data[i + 3] / 255;
      if (a <= 0) continue;
      r += data[i] * a; g += data[i + 1] * a; b += data[i + 2] * a; n += a;
    }
  }
  return n ? hexOf(r / n, g / n, b / n) : "";
}

// Draws a loaded picture into a small canvas and reads its ring. "" when the
// browser will not hand the pixels over, which is what a picture from a host
// with no CORS header comes to.
export function sampleEdge(img) {
  if (typeof document === "undefined") return "";
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  if (!w0 || !h0) return "";
  const scale = Math.min(1, PROBE / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return "";
    ctx.drawImage(img, 0, 0, w, h);
    return edgeAverage(ctx.getImageData(0, 0, w, h).data, w, h);
  } catch {
    return "";   // a tainted canvas
  }
}

// What every picture this browser has already read came out as. The same
// photo on ten thumbnails and on the wall is read once.
const KNOWN = new Map();

// The colour to put behind `src`, or "" while nothing is known about it.
//
// The picture is read through a copy of its own, carrying crossOrigin, and
// never through the one on the screen: asking the visible picture for CORS
// would stop it drawing at all on a host that does not offer any.
export function useSurround(src) {
  // The map above is the answer. This state only asks for another draw once a
  // reading lands.
  const [, drawAgain] = useState(0);
  useEffect(() => {
    if (!src || KNOWN.has(src) || typeof document === "undefined") return undefined;
    let live = true;
    const settle = (colour) => { KNOWN.set(src, colour); if (live) drawAgain(n => n + 1); };
    const probe = new window.Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => settle(sampleEdge(probe));
    probe.onerror = () => settle("");
    probe.src = src;
    return () => { live = false; };
  }, [src]);
  return (src && KNOWN.get(src)) || "";
}
