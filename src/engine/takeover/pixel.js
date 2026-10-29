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

// ─── scenes ───
//
// Andrew, 2026-10-29: "can you make them do stuff besides hit a ball back
// and forth? can lisa davis appear in the locker room to do interviews? can
// you show the team dinner before showing the game if people choose that?"
// A scene is drawn whole each frame from t in [0, 1]. The week plays the
// scene for each thing the coach chose, then the match.

/** Which scene an option plays, by its id first and its kind second. */
export function sceneOf(option) {
  if (!option) return null;
  const byId = { dinner: "dinner", "x-trip": "bus", "x-film": "film", film: "film", now: "film", tomorrow: "film", "x-strength": "weights", "x-gym": "practice", "x-uniforms": "uniforms", "x-assistant": "practice", "x-council": "talk", "x-psych": "talk", run: "laps", standards: "laps", practice: "practice", mastery: "practice", call: "practice", session: "practice", book: "film", saturday: "practice" };
  if (byId[option.id]) return byId[option.id];
  return { culture: "dinner", skills: "practice", standards: "laps", care: "talk", same: null }[option.tag] || null;
}

const SKY = "#1c1c3a", WALL = "#2a2a48", FLOOR = "#3a2a1a", WOOD = "#8a5a2a", LOCKER = "#6a7a8a", LOCKER_DARK = "#4a5a6a";

const blit = (ctx, g, x, y, s, flip = false) => {
  for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) {
    const c = PALETTE[g[yy][xx]];
    if (!c) continue;
    ctx.fillStyle = c;
    ctx.fillRect(x + (flip ? 15 - xx : xx) * s, y + yy * s, s, s);
  }
};
const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
// A speech bubble with three dots, the way an 8-bit game talks.
const bubble = (ctx, x, y, on) => {
  rect(ctx, x, y, 26, 14, "#ffffff"); rect(ctx, x + 4, y + 14, 6, 4, "#ffffff");
  if (on) for (let i = 0; i < 3; i++) rect(ctx, x + 5 + i * 7, y + 5, 4, 4, "#0f0f1a");
};
const room = (ctx, w, h) => { rect(ctx, 0, 0, w, h, WALL); rect(ctx, 0, h - 26, w, 26, FLOOR); };
const bob = (t, i, amp = 3) => Math.round(Math.sin((t * 6 + i) * Math.PI) * amp);

/**
 * One frame of a scene. kind is one of sceneOf's answers, "press" for the
 * locker room interview, or "match". team is the five players' grids in
 * cast order, coach the coach's, reporter Lisa's, opp the opponent's.
 */
export function drawScene(canvas, { kind, t, sport, team = [], coach, reporter, opp, w = 320, h = 96 }) {
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const s = 3, S = 16 * s, floorY = h - S - 6;
  const five = team.slice(0, 5);
  if (kind === "match") return drawMatchScene(ctx, { sport, t, left: five[0] || coach, right: opp || five[1], w, h });
  if (kind === "dinner") {
    room(ctx, w, h);
    rect(ctx, 30, h - 44, w - 60, 10, WOOD); rect(ctx, 34, h - 34, 6, 30, WOOD); rect(ctx, w - 40, h - 34, 6, 30, WOOD);
    five.forEach((g, i) => { const x = 44 + i * 50; blit(ctx, g, x, floorY - 22 + bob(t, i, 2), s); rect(ctx, x + 10, h - 50, 20, 4, "#ffffff"); rect(ctx, x + 14, h - 52, 12, 2, t < 0.5 ? "#f09020" : "#2a2a48"); });
    // The phones, in a basket by the door.
    rect(ctx, 6, h - 40, 18, 12, WOOD); for (let i = 0; i < 4; i++) rect(ctx, 8 + i * 4, h - 46, 3, 6, "#0f0f1a");
    return 0;
  }
  if (kind === "practice") {
    drawField(canvas, sport, w, h);
    const up = Math.floor(t * 8) % 2 === 0;
    five.forEach((g, i) => blit(ctx, g, 40 + i * 50, floorY - (up ? 8 : 0), s));
    if (coach) { blit(ctx, coach, w - 60, floorY, s, true); bubble(ctx, w - 70, floorY - 20, Math.floor(t * 4) % 2 === 0); }
    return Math.floor(t * 8);
  }
  if (kind === "film") {
    room(ctx, w, h);
    rect(ctx, 60, 10, w - 120, 46, "#e0e0e0");
    const dot = 70 + ((t * 2) % 1) * (w - 150);
    rect(ctx, dot, 20 + Math.sin(t * 9) * 10, 8, 8, "#d03030"); rect(ctx, 70, 48, w - 140, 3, "#38b838");
    five.forEach((g, i) => blit(ctx, g, 20 + i * 56, floorY + 2, s));
    rect(ctx, 0, 0, w, h, "rgba(10,10,22," + (0.35 + 0.1 * Math.sin(t * 20)) + ")");
    return 0;
  }
  if (kind === "laps") {
    drawField(canvas, sport, w, h);
    five.forEach((g, i) => { const x = ((t * 1.6 + i * 0.12) % 1) * (w + S) - S; blit(ctx, g, x, floorY - bob(t, i, 4), s); });
    if (coach) { blit(ctx, coach, w / 2 - S / 2, 8, s); }
    return Math.floor(t * 5);
  }
  if (kind === "talk") {
    room(ctx, w, h);
    rect(ctx, 20, h - 36, 60, 8, WOOD); rect(ctx, w - 80, h - 36, 60, 8, WOOD);
    if (coach) blit(ctx, coach, w / 2 - S - 20, floorY, s);
    if (five[0]) blit(ctx, five[0], w / 2 + 20, floorY, s, true);
    const turn = Math.floor(t * 4) % 2;
    bubble(ctx, w / 2 - S - 30, floorY - 22, turn === 0); bubble(ctx, w / 2 + 36, floorY - 22, turn === 1);
    return turn;
  }
  if (kind === "press") {
    room(ctx, w, h);
    for (let i = 0; i < 7; i++) { const x = 8 + i * 44; rect(ctx, x, 6, 36, 50, LOCKER); rect(ctx, x + 4, 12, 28, 6, LOCKER_DARK); rect(ctx, x + 4, 22, 28, 6, LOCKER_DARK); rect(ctx, x + 28, 36, 4, 8, "#0f0f1a"); }
    rect(ctx, 40, h - 30, w - 80, 6, WOOD);
    if (reporter) blit(ctx, reporter, w / 2 - S - 16, floorY, s);
    if (coach) blit(ctx, coach, w / 2 + 16, floorY, s, true);
    // The microphone, held out.
    rect(ctx, w / 2 - 4, floorY + 18, 10, 6, "#0f0f1a"); rect(ctx, w / 2 - 1, floorY + 24, 3, 10, "#8a8a8a");
    const turn = Math.floor(t * 4) % 2;
    bubble(ctx, w / 2 - S - 28, floorY - 22, turn === 0); bubble(ctx, w / 2 + 34, floorY - 22, turn === 1);
    return turn;
  }
  if (kind === "bus") {
    rect(ctx, 0, 0, w, h, "#58b8f8"); rect(ctx, 0, h - 20, w, 20, "#8a8a8a"); for (let i = 0; i < 8; i++) rect(ctx, ((i * 50 - t * 400) % (w + 50) + w + 50) % (w + 50) - 50, h - 11, 24, 3, "#f8e020");
    const bx = 30, by = 14, bw = w - 60, bh = 54;
    rect(ctx, bx, by, bw, bh, "#f8e020"); rect(ctx, bx, by + bh, bw, 6, "#0f0f1a");
    const spin = Math.floor(t * 12) % 2;
    [bx + 30, bx + bw - 40].forEach(x => { rect(ctx, x, by + bh, 16, 16, "#0f0f1a"); rect(ctx, x + 5 + (spin ? 2 : 0), by + bh + 5, 6, 6, "#8a8a8a"); });
    five.forEach((g, i) => { const x = bx + 12 + i * 44; rect(ctx, x - 2, by + 8, 34, 26, "#ffffff"); ctx.save(); ctx.beginPath(); ctx.rect(x - 2, by + 8, 34, 26); ctx.clip(); blit(ctx, g, x - 7, by + 6 + bob(t, i, 1), s); ctx.restore(); });
    return 0;
  }
  if (kind === "weights") {
    room(ctx, w, h);
    five.slice(0, 3).forEach((g, i) => {
      const x = 50 + i * 90, lift = Math.floor(t * 6 + i) % 2 === 0 ? 0 : 14;
      blit(ctx, g, x, floorY, s);
      rect(ctx, x - 10, floorY + 2 - lift, 68, 4, "#8a8a8a"); rect(ctx, x - 14, floorY - 4 - lift, 8, 16, "#0f0f1a"); rect(ctx, x + 54, floorY - 4 - lift, 8, 16, "#0f0f1a");
    });
    return 0;
  }
  if (kind === "uniforms") {
    room(ctx, w, h);
    five.forEach((g, i) => { const shown = t > (i + 1) / 6; blit(ctx, shown ? g : g.map(r => r.map(c => (c === C.red || c === C.orange || c === C.blue || c === C.purple || c === C.green || c === C.sky || c === C.yellow) ? C.light : c)), 40 + i * 50, floorY - (shown ? bob(t, i, 3) : 0), s); });
    return Math.floor(t * 6);
  }
  room(ctx, w, h);
  return 0;
}

// The match, in the sport's own shape: a spike over the net, a kick through
// the posts, a pitch and a hit. Answers the beat for the sound.
function drawMatchScene(ctx, { sport, t, left, right, w, h }) {
  drawField(ctx.canvas, sport, w, h);
  const s = 3, S = 16 * s, floorY = h - S - 6;
  const ball = (x, y, c) => { rect(ctx, x, y, 8, 8, c); rect(ctx, x + 2, y + 2, 2, 2, "#0f0f1a"); };
  if (sport === "volleyball") {
    // Bump, set, spike, three touches on the left, over the net, a dive on the right.
    const phase = (t * 3) % 1, beat = Math.floor(t * 3);
    const lx = 50, rx = w - 50 - S;
    const jump = beat === 2 && phase > 0.3 && phase < 0.7 ? 16 : 0;
    if (left) blit(ctx, left, lx, floorY - jump, s);
    if (right) blit(ctx, right, rx, floorY + (beat === 2 && phase > 0.7 ? 8 : 0), s, true);
    let bx, by;
    if (beat < 2) { bx = lx + 20 + Math.sin(phase * Math.PI) * 10; by = floorY - 6 - Math.sin(phase * Math.PI) * 40; }
    else { bx = lx + 24 + phase * (rx - lx - 10); by = phase < 0.4 ? floorY - 10 - phase * 70 : floorY - 38 + (phase - 0.4) * 80; }
    ball(bx, by, "#ffffff");
    return beat;
  }
  if (sport === "footy") {
    // A run, a kick, the ball end over end through the posts on the right.
    const phase = t, beat = Math.floor(t * 3);
    [w - 36, w - 20].forEach(x => rect(ctx, x, 10, 4, h - 30, "#ffffff")); [w - 52, w - 4].forEach(x => rect(ctx, x, 30, 4, h - 50, "#ffffff"));
    const lx = 20 + Math.min(phase, 0.33) * 120;
    if (left) blit(ctx, left, lx, floorY - (phase > 0.3 && phase < 0.4 ? 6 : 0), s);
    if (right) blit(ctx, right, w - 110, floorY, s, true);
    let bx, by;
    if (phase < 0.33) { bx = lx + 36; by = floorY + 20; }
    else { const k = (phase - 0.33) / 0.67; bx = lx + 36 + k * (w - lx - 60); by = floorY + 20 - Math.sin(k * Math.PI) * 60; }
    const spin = Math.floor(t * 16) % 2;
    rect(ctx, bx, by, spin ? 10 : 6, spin ? 6 : 10, "#d03030");
    return beat;
  }
  // Softball: the pitch from the right, the swing, the ball gone over the fence.
  const phase = t, beat = Math.floor(t * 3);
  const lx = 50, rx = w - 90;
  if (right) blit(ctx, right, rx, floorY, s, true);
  const swing = phase > 0.45 && phase < 0.6;
  if (left) blit(ctx, left, lx, floorY, s);
  rect(ctx, lx + S - 4 + (swing ? 14 : 0), floorY + 4 - (swing ? 10 : 0), swing ? 20 : 4, swing ? 4 : 20, "#8a5a2a");
  let bx, by;
  if (phase < 0.5) { bx = rx - phase * 2 * (rx - lx - 20); by = floorY + 14 + Math.sin(phase * 2 * Math.PI) * 6; }
  else { const k = (phase - 0.5) * 2; bx = lx + 20 + k * (w - lx); by = floorY + 14 - k * 110; }
  ball(bx, by, "#f8e020");
  return beat;
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

/**
 * Lisa Davis of the Pacifica Times: a woman with brown hair and glasses,
 * in a grey blazer, a notebook in hand. Andrew, 2026-10-29: "a woman with
 * brown hair and glasses."
 */
export function journalist() {
  const g = grid();
  const put = (x, y, c) => { if (x >= 0 && x < 16 && y >= 0 && y < 16) g[y][x] = c; };
  const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };
  box(5, 2, 10, 7, C.skin);
  box(5, 1, 10, 1, C.brown); box(4, 2, 11, 2, C.brown);
  box(4, 3, 4, 9, C.brown); box(11, 3, 11, 9, C.brown);
  // Glasses: two frames and a bridge, the lenses light.
  box(5, 5, 7, 5, C.ink); box(8, 5, 10, 5, C.ink); put(6, 5, C.light); put(9, 5, C.light);
  put(5, 4, C.ink); put(7, 4, C.ink); put(8, 4, C.ink); put(10, 4, C.ink);
  put(7, 7, C.red); put(8, 7, C.red);
  box(5, 8, 10, 12, C.grey);
  box(7, 8, 8, 12, C.white);
  box(3, 8, 3, 11, C.skin); box(12, 8, 12, 11, C.skin);
  // The notebook, in the right hand.
  box(12, 11, 14, 13, C.yellow); put(13, 12, C.ink);
  box(5, 13, 10, 13, C.dark);
  box(5, 14, 6, 15, C.skin); box(9, 14, 10, 15, C.skin);
  return g;
}

/** The mood of a player as three pixel glyphs: up, flat, down. */
export const MOOD_GLYPH = { up: "+", flat: "=", down: "-" };
