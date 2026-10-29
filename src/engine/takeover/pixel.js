// Pixels for Takeover: players, the field, and a photograph as a sprite.
//
// Andrew, 2026-10-29: "eight bit graphics, almost like Zelda." Nothing is
// downloaded. Every sprite is a 16 by 16 grid of palette indexes drawn onto a
// canvas and scaled up with image-rendering: pixelated, so the squares stay
// square. A classmate with a photograph on their card becomes a sprite from
// the photograph, the middle of the picture reduced to sixteen pixels a side
// and snapped to the palette. A classmate without one gets a player drawn
// from their name: hair, jersey, number. Every fallback shares one skin
// tone, the way an NES cartridge did, so no name is singled out.
//
// Plain DOM, no React. Nothing touches the window at import, so the smoke
// run can load the module.

import { hash } from "./engine.js";

// Sixteen colours and a transparent zero: an NES-ish palette.
export const PALETTE = [
  null, "#0f0f1a", "#ffffff", "#f8d8a8", "#c08050", "#704020", "#282828", "#e0e0e0",
  "#d03030", "#f09020", "#f8e020", "#38b838", "#2060d0", "#9048c8", "#58b8f8", "#8a8a8a", "#306030",
];
export const C = { none: 0, ink: 1, white: 2, skin: 3, tan: 4, brown: 5, dark: 6, light: 7, red: 8, orange: 9, yellow: 10, green: 11, blue: 12, purple: 13, sky: 14, grey: 15, turf: 16 };
const JERSEYS = [C.red, C.orange, C.blue, C.purple, C.green, C.sky, C.yellow];
const HAIRS = [C.ink, C.brown, C.tan, C.yellow, C.orange, C.dark];

const grid = () => Array.from({ length: 16 }, () => new Array(16).fill(0));

/** A player from a name alone: 16 by 16 palette indexes. */
export function spriteFromName(name, jersey) {
  const h = hash(name || "player");
  const hair = HAIRS[h % HAIRS.length];
  const style = (h >> 3) % 4;           // 0 short, 1 long, 2 cap, 3 bun
  const shirt = jersey != null ? jersey : JERSEYS[(h >> 5) % JERSEYS.length];
  const g = grid();
  const put = (x, y, c) => { if (x >= 0 && x < 16 && y >= 0 && y < 16) g[y][x] = c; };
  const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };
  // Head.
  box(5, 2, 10, 7, C.skin);
  // Hair.
  if (style === 2) { box(4, 1, 11, 2, C.red); box(4, 3, 12, 3, C.red); }
  else { box(5, 1, 10, 1, hair); box(4, 2, 11, 2, hair); put(4, 3, hair); put(11, 3, hair); }
  if (style === 1) { box(4, 3, 4, 7, hair); box(11, 3, 11, 7, hair); }
  if (style === 3) { box(6, 0, 9, 0, hair); }
  // Eyes and mouth.
  put(6, 5, C.ink); put(9, 5, C.ink);
  put(7, 7, C.red); put(8, 7, C.red);
  // Jersey, arms, number stripe.
  box(4, 8, 11, 12, shirt);
  box(3, 8, 3, 11, C.skin); box(12, 8, 12, 11, C.skin);
  put(7, 10, C.white); put(8, 10, C.white);
  // Shorts and legs.
  box(5, 13, 10, 13, C.ink);
  box(5, 14, 6, 15, C.skin); box(9, 14, 10, 15, C.skin);
  return g;
}

/** A photograph as a sprite, or null when the picture cannot be read. */
export const spriteFromPhoto = (url) => new Promise(resolve => {
  if (!url || typeof document === "undefined") { resolve(null); return; }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => { try { resolve(quantize(img)); } catch { resolve(null); } };
  img.onerror = () => resolve(null);
  img.src = url;
});

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const RGB = PALETTE.map(p => p ? hex(p) : null);
const nearest = (r, g, b) => {
  let best = 1, bd = Infinity;
  for (let i = 1; i < RGB.length; i++) {
    const [pr, pg, pb] = RGB[i];
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
};
// The middle of the picture, square, reduced to sixteen a side in two steps
// so a large photograph keeps its shading, then snapped to the palette.
function quantize(img) {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2, sy = (img.naturalHeight - side) / 4;
  const mid = document.createElement("canvas"); mid.width = 64; mid.height = 64;
  mid.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, 64, 64);
  const c = document.createElement("canvas"); c.width = 16; c.height = 16;
  const ctx = c.getContext("2d");
  ctx.drawImage(mid, 0, 0, 64, 64, 0, 0, 16, 16);
  const d = ctx.getImageData(0, 0, 16, 16).data;
  const g = grid();
  for (let i = 0; i < 256; i++) g[Math.floor(i / 16)][i % 16] = d[i * 4 + 3] < 40 ? 0 : nearest(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  return g;
}

/**
 * The team's uniform on a sprite: the jersey rows in the team colour with a
 * number mark. A drawn player is recoloured from the shoulders (row 8); a
 * photograph keeps the face and gets the jersey across the bottom (row 12).
 */
export function uniform(g, jersey, fromRow = 8) {
  const col = JERSEYS[Math.abs(jersey || 0) % JERSEYS.length];
  const out = g.map(r => r.slice());
  const to = fromRow === 12 ? 15 : 12;
  for (let y = fromRow; y <= to; y++) for (let x = 4; x <= 11; x++) if (fromRow === 12 || out[y][x] !== 0) out[y][x] = col;
  const mark = Math.min(15, fromRow + 2);
  out[mark][7] = C.white; out[mark][8] = C.white;
  return out;
}

/**
 * A moment of practice or a match: the ground, two players, and the ball
 * going back and forth. t is 0 to 1 across the scene. Drawn whole each
 * frame, so the caller only loops.
 */
export function drawMatch(canvas, { sport, left, right, t, w = 320, h = 96 }) {
  drawField(canvas, sport, w, h);
  const ctx = canvas.getContext("2d");
  const s = 3;
  const draw = (g, x, y) => { for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) { const c = PALETTE[g[yy][xx]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x + xx * s, y + yy * s, s, s); } } };
  const ground = h - 16 * s - 6;
  // Three crossings: the ball goes over, back, and over.
  const phase = (t * 3) % 1, crossing = Math.floor(t * 3);
  const dir = crossing % 2 === 0 ? 1 : -1;
  const x0 = 40, x1 = w - 40 - 16 * s;
  const bx = dir === 1 ? x0 + 16 * s + phase * (x1 - x0 - 16 * s) : x1 - phase * (x1 - x0 - 16 * s);
  const by = ground + 8 - Math.sin(phase * Math.PI) * 50;
  // The players hop when the ball is theirs.
  const hopL = dir === 1 && phase < 0.2 ? 6 : 0, hopR = dir === -1 && phase < 0.2 ? 6 : 0;
  draw(left, x0, ground - hopL);
  draw(right, x1, ground - hopR);
  ctx.fillStyle = sport === "footy" ? "#d03030" : sport === "softball" ? "#f8e020" : "#ffffff";
  ctx.fillRect(Math.round(bx), Math.round(by), 8, 8);
  ctx.fillStyle = "#0f0f1a"; ctx.fillRect(Math.round(bx) + 2, Math.round(by) + 2, 2, 2);
  return crossing;
}

/** Draw a sprite onto a canvas at a scale. The canvas is sized here. */
export function renderSprite(canvas, g, scale = 4) {
  canvas.width = 16 * scale; canvas.height = 16 * scale;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = PALETTE[g[y][x]];
    if (!c) continue;
    ctx.fillStyle = c;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }
}

/** The ground the team stands on, by sport: a court, an oval, a diamond. */
export function drawField(canvas, sportId, w = 320, h = 96) {
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const px = 4;
  const fill = (x, y, cw, ch, c) => { ctx.fillStyle = c; ctx.fillRect(x * px, y * px, cw * px, ch * px); };
  const cols = w / px, rows = h / px;
  if (sportId === "volleyball") {
    fill(0, 0, cols, rows, "#d08a4a");
    for (let y = 0; y < rows; y += 2) for (let x = (y / 2) % 2; x < cols; x += 2) fill(x, y, 1, 1, "#c47f42");
    fill(1, 1, cols - 2, 1, "#ffffff"); fill(1, rows - 2, cols - 2, 1, "#ffffff"); fill(1, 1, 1, rows - 2, "#ffffff"); fill(cols - 2, 1, 1, rows - 2, "#ffffff");
    fill(Math.floor(cols / 2), 0, 1, rows, "#e0e0e0");
    fill(Math.floor(cols / 2) - 8, 1, 1, rows - 2, "#ffffff"); fill(Math.floor(cols / 2) + 8, 1, 1, rows - 2, "#ffffff");
  } else if (sportId === "footy") {
    fill(0, 0, cols, rows, "#2f7a2f");
    for (let x = 0; x < cols; x += 8) fill(x, 0, 4, rows, "#2c722c");
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = px;
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - px * 2, h / 2 - px * 2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, px * 5, 0, Math.PI * 2); ctx.stroke();
    fill(1, Math.floor(rows / 2) - 3, 1, 7, "#ffffff"); fill(cols - 2, Math.floor(rows / 2) - 3, 1, 7, "#ffffff");
  } else {
    fill(0, 0, cols, rows, "#3a8a3a");
    for (let x = 0; x < cols; x += 8) fill(x, 0, 4, rows, "#368236");
    // The diamond: home at the bottom middle, the base paths as four dirt
    // edges, a base at each corner.
    const cx = Math.floor(cols / 2), cy = rows - 3, r = Math.min(10, cy - 1);
    for (let i = 0; i <= r; i++) {
      fill(cx - i, cy - i, 1, 1, "#d08a4a"); fill(cx + i, cy - i, 1, 1, "#d08a4a");
      fill(cx - r + i, cy - r - i, 1, 1, "#d08a4a"); fill(cx + r - i, cy - r - i, 1, 1, "#d08a4a");
    }
    fill(cx - 1, cy - 1, 3, 2, "#ffffff"); fill(cx - 1, cy - 2 * r - 1, 3, 2, "#ffffff");
    fill(cx - r - 1, cy - r - 1, 3, 2, "#ffffff"); fill(cx + r - 1, cy - r - 1, 3, 2, "#ffffff");
    fill(cx - 1, cy - r - 1, 3, 2, "#d08a4a");
  }
}

/** The mood of a player as three pixel glyphs: up, flat, down. */
export const MOOD_GLYPH = { up: "+", flat: "=", down: "-" };
