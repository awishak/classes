// Turkey Bowl's drawing kit: the canvas size, the ink line, shapes, colour
// mixing, pictures that are drawn once and kept, and the two cameras that
// put the ground in perspective. Everything in art.js and venues.js is built
// from these. Nothing here is an image file.

export const W = 640, H = 360, TAU = Math.PI * 2;
export const INK = "#1c1626";
export const LEAF = ["#e2622a", "#f0a030", "#c9402a", "#f6c945", "#a8551c", "#d98324"];

export const rnd = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const clock = () => (typeof performance !== "undefined" ? performance.now() : 0) / 1000;
const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, t) => { const [x, y] = [rgb(a), rgb(b)]; return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
export const lighten = (col, t = 0.25) => mix(col, "#ffffff", t), darken = (col, t = 0.25) => mix(col, "#000000", t);
export const alpha = (col, a) => { const [r, g, b] = rgb(col); return `rgba(${r},${g},${b},${a})`; };

// ─── shapes ───
/** The ink line's weight. People set it from their size, so a face that fills the screen is not drawn with a rope. */
export const pen = { w: 2 };
export const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
export const disc = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fill(); };
export const ell = (c, x, y, rx, ry, col, rot = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU); c.fill(); };
/** Fill a path and ink its edge. build(c) lays the path down. */
export function shape(c, col, build, lw = pen.w) {
  c.beginPath(); build(c);
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw * 2; c.lineJoin = "round"; c.stroke(); }
  if (col) { c.fillStyle = col; c.fill(); }
}
export const poly = (pts) => (c) => { pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
export const oval = (x, y, rx, ry, rot = 0) => (c) => c.ellipse(x, y, rx, ry, rot, 0, TAU);
export const box = (x, y, w, h, r = 0) => (c) => { if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); };
/** An inked box with a lit top and a shaded foot. */
export function B(c, x, y, w, h, col, lit, dark, r = 0) {
  shape(c, col, box(x, y, w, h, r));
  if (lit || dark) { c.save(); c.beginPath(); box(x, y, w, h, r)(c); c.clip(); if (lit) R(c, x, y, w, Math.max(1, h * 0.22), lit); if (dark) R(c, x, y + h * 0.76, w, h * 0.24 + 1, dark); c.restore(); }
}
/** A limb: a thick round line through the points, inked. */
export function limb(c, pts, w, col, lw = pen.w) {
  c.lineCap = "round"; c.lineJoin = "round";
  const go = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  if (lw) { c.strokeStyle = INK; c.lineWidth = w + lw * 2; go(); }
  c.strokeStyle = col; c.lineWidth = w; go();
}
export const line = (c, pts, w, col) => limb(c, pts, w, col, 0);
/** Paint only inside a path: shade(c, build, (c) => ...). */
export function inside(c, build, paint) { c.save(); c.beginPath(); build(c); c.clip(); paint(c); c.restore(); }
export const vgrad = (c, y0, y1, stops) => { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([p, col]) => g.addColorStop(p, col)); return g; };
export const glow = (c, x, y, r, col, a = 1) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, alpha(col, a)); g.addColorStop(1, alpha(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
export function star(c, cx, cy, r, col, edge) {
  const path = (rr0) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? rr0 * 0.42 : rr0; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); };
  if (edge) { c.fillStyle = edge; path(r + Math.max(1.5, r * 0.14)); c.fill(); }
  c.fillStyle = col; path(r); c.fill();
}
/** A maple leaf, about 2r across, lying at an angle. squash flattens it for a leaf on the ground. */
export function leaf(c, x, y, r, col, rot = 0, squash = 1) {
  c.save(); c.translate(x, y); c.scale(1, squash); c.rotate(rot); c.fillStyle = col; c.beginPath();
  const tip = [[0, -1], [0.34, -0.42], [0.95, -0.5], [0.6, 0.02], [0.82, 0.5], [0.24, 0.42], [0, 0.95], [-0.24, 0.42], [-0.82, 0.5], [-0.6, 0.02], [-0.95, -0.5], [-0.34, -0.42]];
  tip.forEach(([px, py], i) => (i ? c.lineTo(px * r, py * r) : c.moveTo(px * r, py * r))); c.closePath(); c.fill();
  c.strokeStyle = darken(col, 0.3); c.lineWidth = Math.max(0.5, r * 0.1); c.beginPath(); c.moveTo(0, -r * 0.7); c.lineTo(0, r * 1.25); c.stroke();
  c.restore();
}

// ─── pictures drawn once and kept ───
// The picture is drawn at twice the size of its 640 by 360 coordinates, so a
// kept layer has to be made at that size too.
let SCALE = 2;
const KEPT = new Map();
export function setScale(s) { if (s !== SCALE) { SCALE = s; KEPT.clear(); } }
/** A picture w by h, drawn once by draw(ctx) and kept under key. */
export function kept(key, w, h, draw) {
  let cv = KEPT.get(key);
  if (!cv) { cv = document.createElement("canvas"); cv.width = Math.ceil(w * SCALE); cv.height = Math.ceil(h * SCALE); const x = cv.getContext("2d"); x.scale(SCALE, SCALE); draw(x); KEPT.set(key, cv); }
  return cv;
}
/** Lay a kept picture down with its corner at (x, y). */
export const lay = (c, key, w, h, draw, x = 0, y = 0) => c.drawImage(kept(key, w, h, draw), x, y, w, h);

// ─── the ground in perspective ───
// A spot in a game is still (x, y): x is how far downfield, 0 to 640, and y
// is across the field, about 183 to 353. A camera turns that into a place on
// the screen and a size. PLAY looks down on the field from behind the
// offense, the way a football game on a 1998 console did, so the field fills
// the screen. VENUE stands on the field and looks at the far end, for the
// scenes where people talk.
export const PLAY = { hz: -600, A: 1271000, z0: 1277, k: 1920, L: 5400 };
export const VENUE = { hz: 122, A: 30000, z0: 110, k: 300, L: 660 };
export function proj(x, y, h = 0, cam = PLAY) {
  const d = Math.max(40, x + cam.z0), s = cam.k / d;
  return { x: 320 + (y - 268) * cam.L / d, y: cam.hz + cam.A / d - h * s, s, gy: cam.hz + cam.A / d };
}
/** The four corners, on the screen, of a strip of ground from x0 to x1 downfield and y0 to y1 across. */
export const quad = (x0, x1, y0, y1, cam = PLAY) => [proj(x0, y0, 0, cam), proj(x0, y1, 0, cam), proj(x1, y1, 0, cam), proj(x1, y0, 0, cam)].map(p => [p.x, p.y]);
export function ground(c, x0, x1, y0, y1, col, cam = PLAY) { c.fillStyle = col; c.beginPath(); quad(x0, x1, y0, y1, cam).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); }
