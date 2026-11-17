// Turkey Bowl's drawing kit, the 8-bit one: the screen, the palette, squares,
// sprites, pictures that are drawn once and kept, and where a spot on the
// field lands on the screen. Everything in art.js and venues.js is built from
// these. Nothing here is an image file.
//
// Andrew, 2026-11-16: "the graphics are not good enough. so maybe we go back
// down to 8 bit, and make it fun that way." So the screen is 320 by 180
// squares, every colour on it comes from one list of 56, and every figure is
// placed square by square. main.js still thinks in 640 by 360, so every
// function that takes a place takes it in those numbers and halves it.

export const W = 640, H = 360, LW = 320, LH = 180, U = 2, TAU = Math.PI * 2;
export const INK = "#1c1626";
export const LEAF = ["#e2622a", "#f0a030", "#d9291c", "#f6c945", "#a8551c", "#ffb347"];

// ─── the palette ───
export const PAL = [
  "#000000", "#1c1626", "#3a3a4a", "#6a6a7a", "#9aa0aa", "#c9d3e6", "#f4f1e6", "#ffffff",
  "#500000", "#8a1c1c", "#d9291c", "#ff7b72", "#b01e3a", "#e0707a",
  "#8a3f00", "#bf5700", "#e2622a", "#f0a030", "#ffb347",
  "#a8820f", "#f6c945", "#ffd75e", "#fff3c0",
  "#123a1c", "#1f6b3a", "#2f8a3a", "#4f9c36", "#6aa544", "#a8d070", "#6ee7a0",
  "#0a1238", "#1b2a6b", "#1d3c8f", "#2f6fc4", "#58bdf5", "#8ecbff", "#cfeaff",
  "#3a2a66", "#6a4bb0", "#8a80c0", "#e0b0ff",
  "#3a2a1e", "#5a3a1e", "#8a5a3a", "#a8551c", "#c98a5a", "#e8b98a", "#f0c8a0",
  "#7a4a22", "#96602e", "#d9c48a", "#e3b877", "#27325c", "#16121f", "#7fd3ff", "#f6a528",
];
const hexRgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const PAL_RGB = PAL.map(hexRgb);
const LUT = new Uint8Array(32768).fill(255);
function nearest(r, g, b) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < PAL_RGB.length; i++) { const p = PAL_RGB[i], d = (r - p[0]) * (r - p[0]) * 0.9 + (g - p[1]) * (g - p[1]) * 1.2 + (b - p[2]) * (b - p[2]) * 0.8; if (d < bd) { bd = d; best = i; } }
  return best;
}
/** Every square on the screen is moved to the nearest colour on the list, so nothing is ever blended or soft. */
export function snap(c) {
  let img; try { img = c.getImageData(0, 0, LW, LH); } catch { return; }
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = ((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3);
    let p = LUT[k]; if (p === 255) { p = nearest(d[i], d[i + 1], d[i + 2]); LUT[k] = p; }
    const q = PAL_RGB[p]; d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2]; d[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}

export const rnd = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const clock = () => (typeof performance !== "undefined" ? performance.now() : 0) / 1000;
export const mix = (a, b, t) => { const [x, y] = [hexRgb(a), hexRgb(b)]; return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
export const lighten = (col, t = 0.25) => mix(col, "#ffffff", t), darken = (col, t = 0.25) => mix(col, "#000000", t);
export const pale = (col) => { const v = hexRgb(col); return v[0] + v[1] + v[2] > 560; };
/** Numbers three cells wide and five tall, for a shirt or a yard line. */
export const DIGITS = { 0: "111101101101111", 1: "010110010010111", 2: "111001111100111", 3: "111001111001111", 4: "101101111001001", 5: "111100111001111", 6: "111100111101111", 7: "111001001001001", 8: "111101111101111", 9: "111101111001111" };
/** Half of a 640 by 360 number, on a whole square. */
export const lo = (v) => Math.round(v / 2);

// ─── squares ───
/** A block of squares: x, y, w and h are counted in squares of the 320 by 180 screen. */
export const P = (c, x, y, w, h, col) => { if (!col || w <= 0 || h <= 0) return; c.fillStyle = col; c.fillRect(x * U, y * U, w * U, h * U); };
/**
 * A pen for one figure. Its cells are n squares a side, and the figure is gw
 * cells wide and gh tall with the middle of its feet at (X, Y). flip turns it
 * to face the other way. The pen takes a cell, a size in cells, and a colour.
 */
export const pen = (c, X, Y, n, gw, gh, flip = false) => (i, j, w, h, col) => P(c, X + ((flip ? gw - i - w : i) - gw / 2) * n, Y + (j - gh) * n, w * n, h * n, col);
/** A picture written as rows of letters. key says which colour each letter is; a space or a dot is nothing. */
export function spr(c, rows, x, y, n, key, flip = false) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j], len = row.length;
    for (let i = 0; i < len;) {
      const ch = row[i]; let k = i + 1; while (k < len && row[k] === ch) k++;
      const col = key[ch]; if (col) P(c, x + (flip ? len - k : i) * n, y + j * n, (k - i) * n, n, col);
      i = k;
    }
  }
}
/** A filled circle made of rows of squares, middle at (x, y) in squares. */
export function blob(c, x, y, rx, ry, col) {
  for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5)))); if (w > 0) P(c, x - w, y + j, w * 2, 1, col); }
}
/** Every other square of a block, for a shade between two colours. */
export function dither(c, x, y, w, h, col, odd = 0) {
  c.fillStyle = col;
  for (let j = 0; j < h; j++) for (let i = (j + odd + x + y) & 1; i < w; i += 2) c.fillRect((x + i) * U, (y + j) * U, U, U);
}
/** A star with its middle at (cx, cy) in 640 by 360 numbers. A small one is a plus sign. */
export function star(c, cx, cy, r, col, edge) {
  if (r < 9) { const x = lo(cx), y = lo(cy), k = Math.max(1, Math.round(r / 4)); if (edge) { P(c, x - k * 2, y - k, k * 4 + 1, k * 2 + 1, edge); P(c, x - k, y - k * 2, k * 2 + 1, k * 4 + 1, edge); } P(c, x - k, y, k * 2 + 1, 1, col); P(c, x, y - k, 1, k * 2 + 1, col); return; }
  const path = (rr0) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? rr0 * 0.42 : rr0; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); };
  if (edge) { c.fillStyle = edge; path(r + 6); c.fill(); }
  c.fillStyle = col; path(r); c.fill();
}

// ─── pictures drawn once and kept ───
const KEPT = new Map();
/** A whole-screen picture drawn once by draw(ctx) and kept under key. w is how many squares wide it is. */
export function kept(key, draw, w = LW) {
  let cv = KEPT.get(key);
  if (!cv) { cv = document.createElement("canvas"); cv.width = w; cv.height = LH; const x = cv.getContext("2d"); x.scale(1 / U, 1 / U); draw(x); KEPT.set(key, cv); }
  return cv;
}
/** Lay a kept picture down, moved dx squares to the left and wrapped round. */
export function lay(c, key, draw, dx = 0, w = LW) {
  const cv = kept(key, draw, w); c.imageSmoothingEnabled = false;
  if (!dx) { c.drawImage(cv, 0, 0, w * U, H); return; }
  const off = ((Math.round(dx) % w) + w) % w;
  c.drawImage(cv, -off * U, 0, w * U, H); c.drawImage(cv, (w - off) * U, 0, w * U, H);
}

// ─── the field, seen from the side ───
// A spot in a game is (x, y): x is how far downfield, 0 to 640, left to right
// across the screen, and y is across the field, about 183 to 353, which runs
// down the screen from the far sideline to the near one. Nobody gets smaller
// with distance. That is how a football cartridge showed a field.
export const PLAY = { top: 158, k: 1.1 }, VENUE = PLAY;
export function proj(x, y, h = 0) {
  const gy = PLAY.top + (y - 183) * PLAY.k;
  return { x, y: gy - h, s: 1, gy };
}
