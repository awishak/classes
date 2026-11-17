// Turkey Bowl's pictures, the 8-bit pass: people, faces up close, players,
// the band, the turkey, and the cut scenes' kit. The places are in venues.js
// and the squares they are all made of are in draw.js. Everything is drawn in
// code; there are no image files except a player's own photograph, which is
// cut down to 21 by 24 squares and becomes their face.
//
// Andrew, 2026-11-14, on the first pass: "this is a little too 8 bit ... let's
// do 16 bit graphics." 2026-11-15: "please make the graphics a hundred times
// better." 2026-11-16, after the smooth drawings: "the graphics are not good
// enough. so maybe we go back down to 8 bit, and make it fun that way." And
// from the first day: "I want the animations to be ridiculous."
//
// So every figure here is built on a grid. A person standing is 16 cells by
// 28. A face up close is 24 by 26 and has brows, lids and a mouth that move,
// because most of the game is somebody looking at you while you decide. A
// player on the field is 12 by 16 and runs in two poses. The turkey does the
// Macarena one wing at a time.

import { W, H, LW, LH, U, TAU, INK, LEAF, DIGITS, rnd, clamp, clock, lighten, darken, pale, lo, P, pen, spr, blob, dither, star } from "./draw.js";
import { park, stadium } from "./venues.js";
export { W, H, lighten, darken, star, proj, snap, PLAY, VENUE } from "./draw.js";
export * from "./venues.js";

const SH = "rgba(0,0,0,.3)", WHITE = "#f4f1e6";
const photo = (c, face, x, y, w, h, n, cells) => {
  c.save(); c.imageSmoothingEnabled = false;
  if (cells) { c.beginPath(); cells.forEach(([i, j, a, b]) => c.rect((x + i * n) * U, (y + j * n) * U, a * n * U, b * n * U)); c.clip(); }
  c.drawImage(face, x * U, y * U, w * U, h * U); c.restore();
};
const HEAD_SMALL = [[1, 0, 8, 1], [0, 1, 10, 8], [1, 9, 8, 1]], HEAD_BIG = [[3, 0, 16, 1], [1, 1, 20, 1], [0, 2, 22, 19], [1, 21, 20, 2], [2, 23, 18, 1], [4, 24, 14, 1], [6, 25, 10, 1]];
/** A line of single squares from one spot to another. */
function pline(c, x0, y0, x1, y1, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) P(c, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1, col); }

// ─── leaves in the air ───
export function leaves(c, t, n = 60, floor = 330) {
  const fl = lo(floor) + 20;
  for (let i = 0; i < n; i++) {
    const speed = 11 + rnd(i) * 15, depth = 0.6 + rnd(i + 14) * 0.9, big = depth > 1.05 ? 1 : 0;
    const y = Math.floor((t * speed * depth + rnd(i + 3) * 450) % fl) - 10;
    const x = Math.floor((((rnd(i + 5) * (LW + 40) + Math.sin(t * 1.3 + i) * (6 + rnd(i + 9) * 10) + t * 5) % (LW + 30)) + LW + 30) % (LW + 30)) - 10;
    const f = Math.floor(t * (3 + rnd(i + 6) * 3) + i) % 4, col = LEAF[i % LEAF.length];
    if (f === 0) P(c, x, y, 2 + big, 2, col); else if (f === 1) P(c, x, y, 2, 2 + big, col); else if (f === 2) P(c, x, y + 1, 2 + big, 1, col); else { P(c, x, y, 1, 1, col); P(c, x + 1, y + 1, 1 + big, 1, col); }
  }
}

// ─── numbers on a shirt: three cells by five ───
function digits(r, str, i0, j0, col) { [...String(str)].forEach((ch, k) => { const g = DIGITS[ch]; if (!g) return; for (let q = 0; q < 15; q++) if (g[q] === "1") r(i0 + k * 4 + (q % 3), j0 + Math.floor(q / 3), 1, 1, col); }); }

// ─── a person standing: feet at (x, y), 16 cells by 28, three squares a cell at s = 1 ───
export function person(c, x, y, s, o) {
  const { hair = "#5a3a1e", shirt = "#e2622a", pants = "#27325c" } = o;
  const skin = o.sick ? "#a8d070" : (o.skin || "#e8b98a"), kd = o.sick ? "#6aa544" : darken(skin, 0.2), sd = darken(shirt, 0.3);
  const n = clamp(Math.round(s * 3), 2, 12), gh = o.kid || o.kneel ? 24 : 28, L = gh - 28, X = lo(x), Y = lo(y);
  const pads = !!o.helmet, suit = !!o.suit, long = suit || o.sleeves || o.blazer;
  const bob = Math.floor(clock() * 2 + x * 0.013) % 2;   // one square of breathing
  const g = pen(c, X, Y, n, 16, gh), r = pen(c, X, Y + bob, n, 16, gh);
  P(c, X - 6 * n, Y, 12 * n, Math.max(1, n >> 1), SH);
  if (!o.face && !o.helmet) { if (o.long) r(2, 1, 12, 13, hair); if (o.pony) { r(13, 0, 2, 2, hair); r(14, 2, 2, 7, hair); r(13, 1, 1, 1, "#f6c945"); } if (o.bun) r(6, -3, 4, 3, hair); }
  // legs and shoes
  g(4, 19, 8, 2, pants); g(4, 21, 3, 6 + L, pants); g(9, 21, 3, 6 + L, pants); g(6, 21, 1, 6 + L, darken(pants, 0.25));
  if (pads) { g(4, 24, 3, 3, WHITE); g(9, 24, 3, 3, WHITE); g(4, 25, 3, 1, shirt); g(9, 25, 3, 1, shirt); }
  const shoe = suit ? "#16121f" : WHITE; g(3, gh - 1, 4, 1, shoe); g(9, gh - 1, 4, 1, shoe);
  if (o.kneel) { g(1, 21, 4, 2, pants); g(1, 23, 3, 1, shoe); g(11, 22, 4, 1, pants); g(14, 20, 1, 2, shoe); }   // one knee down
  // the body
  r(3, 11, 10, 9, shirt); if (pads) { r(2, 11, 12, 3, shirt); r(2, 12, 12, 1, WHITE); } r(12, 13, 1, 7, sd);
  if (o.plaid) for (let j = 12; j < 20; j += 2) for (let i = 3 + ((j >> 1) & 1); i < 13; i += 2) r(i, j, 1, 1, sd);
  if (suit || o.blazer) {
    r(7, 11, 2, 4, "#ffffff"); r(6, 11, 1, 2, "#ffffff"); r(9, 11, 1, 2, "#ffffff"); r(5, 11, 1, 5, sd); r(10, 11, 1, 5, sd); r(6, 13, 1, 2, sd); r(9, 13, 1, 2, sd);
    if (suit) { const tie = o.tie || "#1d3c8f"; r(7, 12, 2, 6, tie); if (o.stripes) for (let j = 13; j < 18; j += 2) r(7, j, 2, 1, lighten(tie, 0.5)); }
    if (o.pin) r(4, 13, 1, 1, "#c9d3e6");
  } else if (!pads) { r(6, 11, 4, 1, kd); if (o.polo) { r(5, 11, 2, 2, lighten(shirt, 0.3)); r(9, 11, 2, 2, lighten(shirt, 0.3)); r(7, 12, 2, 2, sd); } }
  if (o.pearls) { r(5, 11, 1, 1, "#ffffff"); r(7, 12, 1, 1, "#ffffff"); r(8, 12, 1, 1, "#ffffff"); r(10, 11, 1, 1, "#ffffff"); }
  if (o.number) digits(r, o.number, String(o.number).length > 1 ? 5 : 7, 13, o.numCol || "#ffffff");
  // arms
  const hang = (i) => { r(i, 11, 2, long ? 7 : 3, shirt); if (!long) r(i, 14, 2, 4, skin); if (suit) r(i, 17, 2, 1, "#ffffff"); if (o.glove) r(i < 8 ? i - 1 : i, 17, 3, 3, o.glove); else r(i, 18, 2, 2, skin); };
  hang(1);
  if (o.phone) { r(0, 15, 3, 5, "#16121f"); r(1, 16, 1, 3, "#58bdf5"); }
  if (o.book) { r(0, 15, 4, 5, o.book); r(0, 15, 1, 5, darken(o.book, 0.3)); r(1, 19, 3, 1, WHITE); }
  if (o.mic) { r(13, 11, 2, 2, shirt); r(14, 12, 1, 5, long ? shirt : skin); r(13, 10, 2, 2, skin); r(13, 8, 1, 2, "#16121f"); r(12, 6, 3, 2, "#9aa0aa"); }
  else if (o.armUp) { const wv = o.wave ? Math.floor(o.wave * 6) % 2 : 0; r(13, 11, 2, 2, shirt); r(14, 6, 2, 6, long ? shirt : skin); if (!long) r(14, 9, 2, 3, shirt); r(14 + wv, 3, 2, 3, skin); r(13 + wv * 3, 2, 1, 2, skin);
    if (o.glove) r(13 + wv, 1, 4, 4, o.glove);
    if (o.racket) { r(15 + wv, -1, 1, 4, "#5a3a1e"); r(13 + wv, -7, 5, 1, o.racket); r(13 + wv, -2, 5, 1, o.racket); r(13 + wv, -7, 1, 6, o.racket); r(17 + wv, -7, 1, 6, o.racket); r(15 + wv, -6, 1, 4, "#c9d3e6"); r(14 + wv, -4, 3, 1, "#c9d3e6"); } }
  else hang(13);
  // neck and head
  if (!pads) r(7, 10, 2, 1, kd);
  r(4, 0, 8, 1, skin); r(3, 1, 10, 8, skin); r(o.jaw ? 3 : 4, 9, o.jaw ? 10 : 8, 1, skin);
  if (o.face) { photo(c, o.face, X - 5 * n, Y + bob - gh * n, 10 * n, 10 * n, n, HEAD_SMALL); }
  else {
    if (!o.helmet) { r(2, 4, 1, 2, skin); r(13, 4, 1, 2, skin); }
    const lk = o.look > 0 ? 1 : 0, lk2 = o.look < 0 ? 0 : 1;
    if (o.shades) { r(4, 4, 4, 2, "#16121f"); r(8, 4, 4, 2, "#16121f"); }
    else if (o.blink || (o.grin && o.old)) { r(5, 5, 2, 1, INK); r(9, 5, 2, 1, INK); }
    else if (o.shock) { r(5, 3, 2, 3, "#ffffff"); r(9, 3, 2, 3, "#ffffff"); r(5, 4, 1, 1, INK); r(10, 4, 1, 1, INK); }
    else { r(5, 4, 2, 2, "#ffffff"); r(9, 4, 2, 2, "#ffffff"); r(5 + lk, 4, 1, 2, INK); r(9 + lk2, 4, 1, 2, INK); }
    const brow = pale(hair) ? "#6a6a7a" : darken(hair, 0.4);
    if (o.angry) { r(5, 2, 1, 1, brow); r(6, 3, 1, 1, brow); r(9, 3, 1, 1, brow); r(10, 2, 1, 1, brow); }
    else if (o.sad) { r(5, 3, 1, 1, brow); r(6, 2, 1, 1, brow); r(9, 2, 1, 1, brow); r(10, 3, 1, 1, brow); }
    else if (o.shock) { r(5, 2, 2, 1, brow); r(9, 2, 2, 1, brow); }
    r(8, 6, 1, 1, kd);
    if (o.beard) { r(3, 6, 1, 3, hair); r(12, 6, 1, 3, hair); r(3, 8, 10, 1, hair); r(4, 9, 8, 1, hair); r(5, 7, 6, 1, hair); }
    const lip = o.lash ? "#b01e3a" : "#8a1c1c";
    if (o.helmet) { /* the mask covers the mouth */ }
    else if (o.shock) r(7, 7, 2, 2, INK);
    else if (o.talk) { r(7, 7, 2, 2, "#500000"); }
    else if (o.angry) { r(6, 8, 4, 1, "#ffffff"); r(5, 8, 1, 1, INK); r(10, 8, 1, 1, INK); }
    else if (o.grin) { r(6, 8, 4, 1, "#ffffff"); r(5, 7, 1, 1, lip); r(10, 7, 1, 1, lip); }
    else if (o.sad) { r(7, 7, 2, 1, lip); r(6, 8, 1, 1, lip); r(9, 8, 1, 1, lip); }
    else r(7, 8, 2, 1, lip);
    if (o.mustache) { r(6, 7, 4, 1, hair); r(5, 8, 1, 1, hair); r(10, 8, 1, 1, hair); }
    if (!o.helmet && !o.cap && !o.hat) {
      if (o.afro) { r(3, -4, 10, 1, hair); r(2, -3, 12, 2, hair); r(1, -1, 14, 3, hair); r(1, 2, 2, 3, hair); r(13, 2, 2, 3, hair); r(3, 2, 2, 1, hair); r(11, 2, 2, 1, hair); }
      else if (o.bald) { r(3, 3, 1, 3, hair); r(12, 3, 1, 3, hair); r(6, 1, 2, 1, lighten(skin, 0.4)); }
      else { const v = o.swept ? 1 : 0; r(4, -1 - v, 8, 1 + v, hair); r(3, 0, 10, o.receding ? 1 : 2, hair); r(3, 1, 1, 3, hair); r(12, 1, 1, 3, hair); if (!o.receding) r(3, 2, 2, 1, hair); r(5, -1 - v, 3, 1, lighten(hair, pale(hair) ? 0.6 : 0.25)); }
      if (o.long) { r(2, 1, 2, 11, hair); r(12, 1, 2, 11, hair); }
    }
    if (o.glasses) { const fr = "#3a3a4a"; r(4, 3, 3, 1, fr); r(9, 3, 3, 1, fr); r(4, 6, 3, 1, fr); r(9, 6, 3, 1, fr); r(4, 4, 1, 2, fr); r(11, 4, 1, 2, fr); r(7, 4, 2, 1, fr); }
  }
  if (o.cap) { r(3, -1, 10, 3, o.cap); r(4, -2, 8, 1, o.cap); r(3, 2, 12, 1, darken(o.cap, 0.3)); r(3, 3, 1, 1, hair); r(12, 3, 1, 1, hair); }
  if (o.hat) { r(4, -4, 8, 4, o.hat); r(4, -1, 8, 1, "#5a3a1e"); r(0, 0, 16, 1, o.hat); r(1, 1, 14, 1, darken(o.hat, 0.15)); }
  if (o.helmet) {
    const hc = o.helmet, bar = "#c9d3e6";
    r(3, -1, 10, 2, hc); r(2, 1, 12, 2, hc); r(2, 3, 2, 6, hc); r(12, 3, 2, 6, hc); r(7, -1, 2, 4, o.dot || darken(hc, 0.3)); r(3, 0, 2, 1, "#ffffff");
    r(4, 7, 8, 1, bar); r(4, 9, 8, 1, bar); r(7, 7, 2, 3, bar);
  }
  if (o.angry) { r(14, -3, 1, 3, "#d9291c"); r(13, -2, 3, 1, "#d9291c"); }
  if (o.sweat) { r(1, 2, 1, 2, "#58bdf5"); r(1, 1, 1, 1, "#cfeaff"); }
  if (o.sad && !o.angry) r(5, 6, 1, 2, "#58bdf5");
}
// Jerry Jones: white hair swept back off a high forehead, big ears, a tan, a
// wide smile, a dark suit, a striped navy tie, a pin on the lapel.
const JERRY = { skin: "#e8b98a", hair: "#f4f1e6", shirt: "#27325c", pants: "#27325c", suit: true, tie: "#1d3c8f", stripes: true, grin: true, swept: true, receding: true, old: true, jaw: true, ears: 1.25, tan: true, pin: true, eyes: "#6a6a7a" };
export const jerry = (c, x, y, s = 1, extra = {}) => person(c, x, y, s, { ...JERRY, ...extra });
export const CAST = {
  uncle: { skin: "#c98a5a", hair: "#3a2a1e", shirt: "#a8551c", mustache: true, cap: "#27325c", armUp: true, plaid: true, jaw: true },
  brother: { skin: "#e8b98a", hair: "#5a3a1e", shirt: "#e2622a", angry: true, number: "7", armUp: true, phone: true },
  sister: { skin: "#e8b98a", hair: "#5a3a1e", shirt: "#e2622a", pony: true, armUp: true, number: "12", lash: true },
  cousin: { skin: "#c98a5a", hair: "#1c1626", shirt: "#f0a030", long: true, sad: true },
  niece: { skin: "#c98a5a", hair: "#3a2a1e", shirt: "#2f6fc4", pony: true, armUp: true, lash: true, book: "#2f8a3a" },
  nephew: { skin: "#e8b98a", hair: "#a8551c", shirt: "#e2622a", number: "9", kid: true },
  receiver: { skin: "#8a5a3a", hair: "#1c1626", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "88", armUp: true },
  reporter: { skin: "#f0c8a0", hair: "#8a3f00", shirt: "#b01e3a", long: true, mic: true, armUp: false, blazer: true, lash: true },
  kicker: { skin: "#e8b98a", hair: "#f6c945", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "3" },
  backup: { skin: "#c98a5a", hair: "#3a2a1e", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "14" },
  returner: { skin: "#8a5a3a", hair: "#1c1626", shirt: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6", number: "5" },
  you: { skin: "#e8b98a", hair: "#3a2a1e", shirt: "#e2622a", number: "1" },
  coachA: { skin: "#c98a5a", hair: "#1c1626", shirt: "#1b2a6b", cap: "#1d3c8f", polo: true, jaw: true },
  coachB: { skin: "#f0c8a0", hair: "#c9d3e6", shirt: "#c9d3e6", glasses: true, bald: true, polo: true, old: true },
  // Andrew, 2026-11-16: "put me in the game, as well as colin kaepernick, muhammad ali, jackie robinson, billie jean king."
  // Andrew is drawn from his own avatar picture: a white cap, a dark beard, a navy shirt, a grin.
  andrew: { skin: "#c98a5a", hair: "#1c1626", shirt: "#1b2a6b", cap: "#f4f1e6", beard: true, grin: true },
  kaepernick: { skin: "#c98a5a", hair: "#1c1626", shirt: "#b01e3a", pants: "#d9c48a", afro: true, beard: true, number: "7" },
  ali: { skin: "#8a5a3a", hair: "#1c1626", shirt: "#8a5a3a", pants: "#f4f1e6", glove: "#d9291c", jaw: true },
  robinson: { skin: "#8a5a3a", hair: "#1c1626", shirt: "#f4f1e6", pants: "#f4f1e6", cap: "#1d3c8f", number: "42", numCol: "#1d3c8f", sleeves: true },
  king: { skin: "#f0c8a0", hair: "#3a2a1e", shirt: "#2f6fc4", pants: "#2f6fc4", glasses: true, lash: true, racket: "#f4f1e6" },
  mcconaughey: { skin: "#e8b98a", hair: "#96602e", shirt: "#bf5700", swept: true, grin: true, tan: true, jaw: true, sleeves: true },
  grandma: { skin: "#f0c8a0", hair: "#c9d3e6", shirt: "#6a4bb0", pants: "#3a3a4a", glasses: true, bun: true, sleeves: true, pearls: true, old: true, lash: true },
};
export function cast(c, who, x, y, s = 1, extra = {}) { if (who === "jerry") jerry(c, x, y, s, extra); else if (CAST[who]) person(c, x, y, s, { ...CAST[who], ...extra }); }

// ─── a face up close: the head is 24 cells by 26, four squares a cell, in the middle of the screen ───
function portrait(c, X, n, o) {
  const { hair = "#5a3a1e", shirt = "#e2622a" } = o;
  const skin = o.sick ? "#a8d070" : (o.skin || "#e8b98a"), kd = o.sick ? "#6aa544" : darken(skin, 0.18), sd = darken(shirt, 0.3), lt = lighten(hair, pale(hair) ? 0.7 : 0.25);
  const t = clock(), bob = Math.floor(t * 2) % 2, pads = !!o.helmet, bare = !o.helmet && !o.cap && !o.hat && !o.face;
  const top = 84 - 13 * n + bob + (o.cap || o.hat || o.afro || o.bun ? Math.round(n * 1.5) : 0), r = pen(c, X, top + 26 * n, n, 24, 26);
  // hair that hangs behind
  if (bare && o.long) r(-3, 0, 30, 40, hair);
  if (bare && o.pony) { r(22, -1, 6, 7, hair); r(25, 6, 5, 14, hair); r(27, 20, 3, 4, hair); r(23, 2, 2, 3, "#f6c945"); }
  if (bare && o.bun) { r(8, -8, 8, 6, hair); r(7, -6, 10, 3, hair); r(9, -7, 3, 1, lt); }
  // neck and shoulders
  r(8, 24, 8, 7, kd);
  if (pads) { r(-12, 30, 48, 24, shirt); r(-15, 32, 54, 22, shirt); r(-15, 35, 54, 1, WHITE); r(-15, 37, 54, 1, WHITE); r(8, 28, 8, 3, kd); }
  else { r(-6, 29, 36, 2, shirt); r(-9, 31, 42, 23, shirt); r(-11, 34, 46, 20, shirt); }
  r(28, 34, 7, 20, sd);
  if (o.plaid) { for (let i = -10; i < 34; i += 7) r(i, 31, 2, 23, sd); for (let j = 33; j < 54; j += 6) r(-11, j, 46, 2, sd); for (let i = -10; i < 34; i += 7) for (let j = 33; j < 54; j += 6) r(i, j, 2, 2, lighten(shirt, 0.3)); }
  if (o.suit || o.blazer) {
    for (let j = 0; j < 12; j += 2) r(6 + j / 2, 29 + j, 12 - j, 2, "#ffffff");
    for (let j = 0; j < 14; j += 2) { r(4 + j / 2, 29 + j, 2, 2, sd); r(18 - j / 2, 29 + j, 2, 2, sd); }
    if (o.suit) { const tie = o.tie || "#1d3c8f"; r(10, 30, 4, 3, darken(tie, 0.2)); r(10, 33, 4, 21, tie); r(9, 38, 6, 16, tie); if (o.stripes) for (let j = 34; j < 54; j += 4) { r(9, j + 1, 2, 1, lighten(tie, 0.5)); r(11, j, 2, 1, lighten(tie, 0.5)); r(13, j - 1, 2, 1, lighten(tie, 0.5)); } }
    if (o.pin) { r(-1, 38, 3, 3, "#c9d3e6"); r(0, 39, 1, 1, "#1d3c8f"); }
  } else if (o.polo) { r(5, 29, 6, 3, lighten(shirt, 0.35)); r(13, 29, 6, 3, lighten(shirt, 0.35)); r(11, 31, 2, 8, sd); r(11, 34, 1, 1, "#ffffff"); r(11, 37, 1, 1, "#ffffff"); }
  else if (!pads) { r(7, 29, 10, 2, kd); r(6, 31, 12, 1, sd); }
  if (o.pearls) for (let i = 0; i < 6; i++) r(6 + i * 2 + (i > 2 ? 1 : 0), 30 + (i === 0 || i === 5 ? 0 : 1), 1, 1, "#ffffff");
  // ears and the head
  if (!o.helmet && !o.face) { const e = o.ears > 1 ? 1 : 0; r(-1 - e, 10 - e, 2 + e, 5 + e * 2, skin); r(23, 10 - e, 2 + e, 5 + e * 2, skin); r(-1, 11, 1, 3, kd); r(24, 11, 1, 3, kd); }
  r(4, 0, 16, 1, skin); r(2, 1, 20, 1, skin); r(1, 2, 22, 19, skin);
  if (o.jaw) { r(1, 21, 22, 2, skin); r(2, 23, 20, 1, skin); r(3, 24, 18, 1, skin); r(5, 25, 14, 1, skin); }
  else { r(2, 21, 20, 2, skin); r(3, 23, 18, 1, skin); r(5, 24, 14, 1, skin); r(7, 25, 10, 1, skin); }
  if (o.face) { photo(c, o.face, X - 11 * n, top, 22 * n, 26 * n, n, HEAD_BIG); }
  else {
    r(21, 4, 2, 17, kd); r(20, 21, 2, 2, kd);
    const blush = o.tan ? "#e2622a" : "#e0707a"; if (!o.sick) { dither(c, X - 9 * n, top + 15 * n, 3 * n, 2 * n, blush); dither(c, X + 6 * n, top + 15 * n, 3 * n, 2 * n, blush); }
    if (o.helmet) { const hc = o.helmet; r(1, -4, 22, 2, hc); r(-1, -2, 26, 10, hc); r(-1, 8, 5, 14, hc); r(20, 8, 5, 14, hc); r(0, 22, 5, 4, hc); r(19, 22, 5, 4, hc); r(10, -4, 4, 12, o.dot || darken(hc, 0.3)); r(2, -1, 5, 2, "#ffffff"); r(21, 10, 2, 3, darken(hc, 0.35)); r(1, 10, 2, 3, darken(hc, 0.35)); }
    // eyes
    const mad = o.angry, sad = o.sad && !mad, big = o.shock, lk = clamp(Math.round((o.look || 0) / 2), -1, 1);
    const squint = !big && !mad && ((o.grin && o.old) || o.squint);
    if (o.shades) { const dy = o.shades === "down" ? 3 : 0; r(3, 9 + dy, 8, 5, "#16121f"); r(13, 9 + dy, 8, 5, "#16121f"); r(11, 10 + dy, 2, 1, "#16121f"); r(4, 10 + dy, 3, 1, "#ffffff"); r(14, 10 + dy, 3, 1, "#ffffff"); }
    else for (const [ex, out] of [[5, -1], [14, 1]]) {
      if (o.blink) { r(ex, 12, 5, 1, INK); continue; }
      if (squint) { r(ex, 12, 1, 1, INK); r(ex + 1, 11, 3, 1, INK); r(ex + 4, 12, 1, 1, INK); continue; }
      const et = big ? 8 : 10, hh = big ? 6 : 4;
      r(ex, et, 5, hh, "#ffffff"); r(ex, et - 1, 5, 1, o.lash || mad ? INK : darken(skin, 0.45));
      if (big) r(ex + 2, 10, 1, 2, INK);
      else { r(ex + 1 + lk, sad ? 11 : 10, 3, 3, o.eyes || "#5a3a1e"); r(ex + 2 + lk, sad ? 11 : 10, 2, 3, INK); r(ex + 1 + lk, 10, 1, 1, "#ffffff"); }
      if (mad) { const inner = out < 0 ? ex + 3 : ex; r(inner, 10, 2, 1, skin); r(out < 0 ? ex + 4 : ex, 11, 1, 1, skin); }
      if (sad) { const outer = out < 0 ? ex : ex + 3; r(outer, 10, 2, 1, skin); }
      if (o.lash) { r(out < 0 ? ex - 1 : ex + 5, et - 2, 1, 2, INK); }
    }
    // brows carry the mood
    const brow = o.brow || (pale(hair) ? "#9aa0aa" : darken(hair, 0.15)), bh = o.old || o.mustache ? 2 : 1;
    if (o.helmet && !mad && !sad) { /* the helmet sits where the brows would be */ }
    else if (mad) { r(3, 5, 3, 2, brow); r(6, 6, 2, 2, brow); r(8, 7, 2, 2, brow); r(18, 5, 3, 2, brow); r(16, 6, 2, 2, brow); r(14, 7, 2, 2, brow); }
    else if (sad) { r(3, 8, 3, bh, brow); r(6, 7, 2, bh, brow); r(8, 6, 2, bh, brow); r(18, 8, 3, bh, brow); r(16, 7, 2, bh, brow); r(14, 6, 2, bh, brow); }
    else { const by = big ? 4 : o.grin ? 5 : 6; r(5, by, 5, bh, brow); r(14, by, 5, bh, brow); if (big || o.grin) { r(4, by + 1, 1, 1, brow); r(19, by + 1, 1, 1, brow); } }
    // nose
    r(11, 12, 2, 5, kd); r(10, 16, 4, o.old ? 2 : 1, kd); r(12, 12, 1, 4, lighten(skin, 0.25));
    if (o.old) { const wr = darken(skin, 0.3); r(6, 17, 1, 4, wr); r(17, 17, 1, 4, wr); r(2, 13, 2, 1, wr); r(20, 13, 2, 1, wr); if (o.receding || o.bald) { r(7, 3, 10, 1, wr); r(8, 5, 8, 1, wr); } }
    if (o.beard) { r(1, 13, 3, 8, hair); r(20, 13, 3, 8, hair); r(o.jaw ? 1 : 2, 21, o.jaw ? 22 : 20, 2, hair); r(o.jaw ? 2 : 3, 23, o.jaw ? 20 : 18, 1, hair); r(o.jaw ? 3 : 5, 24, o.jaw ? 18 : 14, 1, hair); r(o.jaw ? 5 : 7, 25, o.jaw ? 14 : 10, 1, hair); r(4, 18, 16, 3, hair); r(6, 17, 12, 1, hair); r(8, 19, 8, 4, skin); }
    // mouth
    const lip = o.lash ? "#b01e3a" : "#8a1c1c";
    if (o.helmet) { const bar = WHITE; r(3, 18, 18, 2, bar); r(3, 22, 18, 2, bar); r(11, 18, 2, 8, bar); r(5, 18, 2, 6, bar); r(17, 18, 2, 6, bar); }
    else if (big) { r(10, 19, 4, 5, "#500000"); r(9, 20, 6, 3, "#500000"); r(11, 22, 2, 1, "#e0707a"); }
    else if (o.talk) { r(8, 19, 8, 4, "#500000"); r(8, 19, 8, 1, "#ffffff"); r(10, 22, 4, 1, "#e0707a"); }
    else if (mad) { r(7, 18, 10, 5, INK); r(8, 19, 8, 3, "#ffffff"); r(10, 19, 1, 3, INK); r(13, 19, 1, 3, INK); r(8, 20, 8, 1, "#c9d3e6"); }
    else if (o.grin) { r(6, 19, 12, 1, INK); r(5, 18, 1, 1, INK); r(18, 18, 1, 1, INK); r(7, 20, 10, 2, "#ffffff"); r(8, 22, 8, 1, "#ffffff"); r(9, 23, 6, 1, lip); for (let i = 9; i < 16; i += 2) r(i, 20, 1, 2, "#c9d3e6"); }
    else if (sad) { r(9, 21, 6, 1, lip); r(8, 22, 1, 1, lip); r(15, 22, 1, 1, lip); }
    else { r(9, 21, 6, 1, lip); r(8, 20, 1, 1, lip); r(15, 20, 1, 1, lip); }
    if (o.mustache) { r(7, 17, 10, 2, hair); r(6, 18, 2, 3, hair); r(16, 18, 2, 3, hair); }
    // hair
    if (bare) {
      if (o.afro) { r(4, -9, 16, 2, hair); r(0, -7, 24, 3, hair); r(-3, -4, 30, 8, hair); r(-3, 4, 5, 6, hair); r(22, 4, 5, 6, hair); r(1, 4, 5, 1, hair); r(18, 4, 5, 1, hair); r(3, -6, 4, 1, lt); r(12, -7, 5, 1, lt); }
      else if (o.bald) { r(0, 4, 3, 7, hair); r(21, 4, 3, 7, hair); r(6, 2, 5, 1, lighten(skin, 0.45)); }
      else {
        const hl = o.receding ? 2 : 4, v = o.swept ? 4 : 2;
        r(4, -v - 1, 16, 1, hair); r(2, -v, 20, 2, hair); r(1, -v + 2, 22, v + hl - 2, hair); r(0, 1, 2, hl + 3, hair); r(22, 1, 2, hl + 3, hair);
        if (!o.receding) { r(1, hl, 5, 1, hair); r(9, hl, 4, 1, hair); r(17, hl, 6, 1, hair); r(1, hl + 1, 2, 4, hair); r(21, hl + 1, 2, 4, hair); }
        r(5, -v, 6, 1, lt); r(13, -v + 1, 5, 1, lt); if (o.swept) { r(4, -1, 7, 1, lt); r(14, 0, 6, 1, lt); r(3, -3, 3, 1, darken(hair, 0.15)); }
      }
      if (o.long) { r(-3, 3, 4, 38, hair); r(23, 3, 4, 38, hair); r(-2, 6, 1, 30, lt); }
    }
    if (o.glasses) { for (const gx of [3, 13]) { r(gx, 8, 8, 1, INK); r(gx, 14, 8, 1, INK); r(gx, 8, 1, 7, INK); r(gx + 7, 8, 1, 7, INK); r(gx + 1, 9, 2, 1, "#cfeaff"); } r(11, 10, 2, 1, INK); r(0, 9, 3, 1, INK); r(21, 9, 3, 1, INK); }
  }
  if (o.cap) { r(3, -5, 18, 1, o.cap); r(1, -4, 22, 9, o.cap); r(3, -3, 6, 1, lighten(o.cap, 0.3)); r(11, -6, 2, 1, darken(o.cap, 0.3)); r(1, 5, 28, 2, darken(o.cap, 0.3)); r(1, 7, 2, 4, hair); r(21, 7, 2, 4, hair); }
  if (o.hat) { r(4, -11, 16, 2, o.hat); r(3, -9, 18, 11, o.hat); r(10, -11, 4, 2, darken(o.hat, 0.2)); r(3, -1, 18, 3, "#5a3a1e"); r(-8, 2, 40, 3, o.hat); r(-10, 1, 4, 2, o.hat); r(30, 1, 4, 2, o.hat); r(-8, 5, 40, 1, darken(o.hat, 0.25)); }
  // marks for a mood
  if (o.angry) { const red = "#d9291c"; r(27, -9, 2, 3, red); r(27, -4, 2, 3, red); r(24, -6, 3, 2, red); r(29, -6, 3, 2, red); }
  if (o.sweat) { r(-5, 2, 1, 1, "#58bdf5"); r(-6, 3, 3, 3, "#58bdf5"); r(-5, 3, 1, 1, "#ffffff"); }
  if (o.sad && !o.angry && !o.face) { const fall = Math.floor(t * 5) % 5; r(6, 14 + fall, 2, 3, "#58bdf5"); r(6, 14 + fall, 1, 1, "#cfeaff"); }
  // a hand in the picture: a wave, or a microphone
  if (o.mic) { r(25, 19, 6, 6, "#9aa0aa"); dither(c, X + 13 * n, top + 19 * n, 6 * n, 6 * n, "#3a3a4a"); r(26, 25, 4, 5, "#16121f"); r(24, 29, 8, 6, skin); r(24, 31, 8, 1, kd); r(25, 35, 6, 19, o.blazer || o.suit ? shirt : skin); }
  else if (o.armUp && o.wave !== undefined) { const hx = 29 + (Math.floor(o.wave * 5) % 2) * 2, long = o.suit || o.blazer || o.sleeves; for (let k = 0; k < 4; k++) r(hx + k * 2, 8 + (k === 0 || k === 3 ? 1 : 0), 1, 5, skin); r(hx, 12, 7, 7, skin); r(hx - 2, 14, 2, 3, skin); r(hx, 18, 7, 1, kd); r(hx + 1, 19, 5, 35, long ? shirt : skin); if (o.glove) { r(hx - 2, 6, 11, 13, o.glove); r(hx - 4, 11, 2, 6, o.glove); r(hx, 7, 5, 2, lighten(o.glove, 0.4)); r(hx - 1, 19, 9, 3, WHITE); } }
}
/** Somebody up close, filling the screen: who is a CAST key or "jerry". */
export function bust(c, who, x, s, extra = {}) {
  portrait(c, lo(x), clamp(Math.round(s * 2), 2, 6), who === "jerry" ? { ...JERRY, ...extra } : { ...(CAST[who] || CAST.you), ...extra });
}

// ─── a player on the field: feet at (x, y), 12 cells by 16, two squares a cell at s = 1 ───
// Seen from the side, running the way dir points, or from the front for a
// celebration (front: true). lift is how far off the ground they are, in
// 640 by 360 numbers, so the shadow stays down.
export function player(c, x, y, o = {}, frame = 0) {
  const { jersey = "#e2622a", pants = "#27325c", skin = "#e8b98a", hair = "#5a3a1e", helmet = "", dir = 1, s = 1, down = false, arms = 0, lift = 0 } = o;
  const n = clamp(Math.round(s * 2), 1, 8), X = lo(x), Y = lo(y), step = down ? 0 : [0, 1, 0, -1][frame % 4], pads = !!helmet;
  const sock = pads ? WHITE : skin, shoe = pads ? WHITE : "#16121f", dot = o.dot || (pads ? darken(helmet, 0.3) : ""), bar = "#c9d3e6";
  P(c, X - 4 * n, Y + lo(lift), 8 * n, n, SH);
  if (o.ring && Math.floor(clock() * 5) % 3) { const ay = Y - 20 * n; P(c, X - 2 * n, ay, 4 * n, n, "#ffd75e"); P(c, X - n, ay + n, 2 * n, n, "#ffd75e"); }
  if (down) {
    const r = pen(c, X, Y, n, 12, 16, dir < 0);
    r(0, 13, 4, 2, pants); r(0, 12, 1, 3, shoe); r(4, 12, 5, 3, jersey); r(5, 11, 2, 1, skin); r(9, 12, 3, 3, helmet || skin); if (!helmet) r(9, 12, 3, 1, hair); else r(11, 13, 1, 2, bar);
    return;
  }
  if (o.front) {
    const r = pen(c, X, Y, n, 12, 16);
    if (arms) { r(1, 1, 2, 5, skin); r(9, 1, 2, 5, skin); r(1, 5, 2, 1, jersey); r(9, 5, 2, 1, jersey); }
    else { r(1, 5, 2, 2, jersey); r(9, 5, 2, 2, jersey); r(1, 7, 2, 3, skin); r(9, 7, 2, 3, skin); }
    r(3, 5, 6, 5, jersey); if (pads) r(2, 5, 8, 2, jersey); r(5, 7, 2, 2, "#ffffff");
    r(3, 10, 6, 2, pants); r(3, 12, 2, 1, pants); r(7, 12, 2, 1, pants); r(3, 13, 2, 2, sock); r(7, 13, 2, 2, sock); r(2, 15, 3, 1, shoe); r(7, 15, 3, 1, shoe);
    if (helmet) { r(3, 0, 6, 1, helmet); r(2, 1, 8, 4, helmet); r(4, 2, 4, 2, skin); r(4, 2, 1, 1, INK); r(7, 2, 1, 1, INK); r(4, 4, 4, 1, bar); r(5, 0, 2, 2, dot); }
    else if (o.face) { r(3, 0, 6, 5, skin); photo(c, o.face, X - 3 * n, Y - 16 * n, 6 * n, 5 * n); }
    else { if (o.long) { r(2, 1, 1, 6, hair); r(9, 1, 1, 6, hair); } r(3, 1, 6, 4, skin); r(3, 0, 6, 2, hair); r(2, 1, 1, 2, hair); r(9, 1, 1, 2, hair); r(4, 3, 1, 1, INK); r(7, 3, 1, 1, INK); r(5, 4, 2, 1, "#8a1c1c"); }
    return;
  }
  const r = pen(c, X, Y - (step ? 1 : 0), n, 12, 16, dir < 0), g = pen(c, X, Y, n, 12, 16, dir < 0);
  // legs: together, or a stride
  if (!step) { g(5, 12, 3, 1, pants); g(5, 13, 2, 2, sock); g(5, 15, 3, 1, shoe); }
  else { g(4, 12, 2, 1, pants); g(3, 13, 2, 1, sock); g(2, 14, 2, 1, sock); g(1, 15, 3, 1, shoe); g(7, 12, 2, 1, pants); g(8, 13, 2, 1, sock); g(9, 14, 2, 1, sock); g(9, 15, 3, 1, shoe); }
  if (arms) r(1, 1, 2, 5, skin);
  if (!helmet && o.long) r(2, 1, 3, 6, hair);
  r(4, 5, 5, 5, jersey); if (pads) r(3, 5, 7, 2, jersey); r(5, 7, 2, 2, "#ffffff"); r(4, 10, 5, 2, pants);
  if (arms) r(10, 0, 2, 6, skin);
  else if (step > 0) { r(6, 6, 2, 2, jersey); r(8, 7, 2, 1, skin); }
  else if (step < 0) { r(4, 6, 2, 2, jersey); r(2, 7, 2, 1, skin); }
  else { r(6, 6, 2, 2, jersey); r(6, 8, 2, 2, skin); }
  if (helmet) { r(4, 0, 5, 1, helmet); r(3, 1, 7, 3, helmet); r(4, 4, 4, 1, helmet); r(8, 2, 2, 2, skin); r(9, 3, 2, 1, bar); r(10, 2, 1, 2, bar); r(4, 1, 4, 1, dot); }
  else { r(4, 1, 6, 4, skin); r(3, 0, 6, 2, hair); r(3, 2, 2, 2, hair); r(8, 2, 1, 1, INK); }
}
/** A football. s is its size; tilt turns it; lift is how far it is off the ground, for the shadow. */
const BALL = [[".BBB.", "BWWWB", ".BBB."], ["BB..", "BWB.", ".BWB", "..BB"], [".B.", "BWB", "BWB", "BWB", ".B."], ["..BB", ".BWB", "BWB.", "BB.."]];
export function ball(c, x, y, tilt = 0, s = 1, lift = -1) {
  const n = clamp(Math.round(s * 1.5), 1, 8), X = lo(x), Y = lo(y), rows = BALL[((Math.round(tilt / (Math.PI / 4)) % 4) + 4) % 4];
  if (lift >= 0) P(c, X - 2 * n, Y + lo(lift) + n, 4 * n, n, SH);
  spr(c, rows, X - Math.floor(rows[0].length * n / 2), Y - Math.floor(rows.length * n / 2), n, { B: "#7a4a22", W: WHITE });
}

// ─── the turkey ───
/** A turkey on the loose, for whenever things need to get stupid. */
export function turkey(c, x, y, t, dir = 1) {
  const f = Math.floor(t * 8) % 2, r = pen(c, lo(x), lo(y), 2, 14, 13, dir < 0), b = "#7a4a22";
  P(c, lo(x) - 10, lo(y), 20, 1, SH);
  [LEAF[0], LEAF[3], LEAF[2]].forEach((col, k) => { r(k * 2, 2 - k + f, 2, 8, col); r(k * 2, 2 - k + f, 2, 1, "#fff3c0"); });
  r(3, 5, 8, 6, b); r(4, 7, 5, 3, "#96602e"); r(5, 7, 4, 2, "#5a3a1e");
  r(9, 3 + f, 2, 4, b); r(9, 1 + f, 3, 3, "#96602e"); r(10, 1 + f, 1, 1, INK); r(12, 2 + f, 2, 1, "#f6c945"); r(12, 3 + f, 1, 2, "#d9291c");
  if (f) { r(4, 11, 1, 1, "#f6a528"); r(4, 12, 2, 1, "#f6a528"); r(9, 11, 1, 1, "#f6a528"); r(9, 12, 2, 1, "#f6a528"); }
  else { r(5, 11, 1, 2, "#f6a528"); r(5, 12, 2, 1, "#f6a528"); r(8, 11, 1, 2, "#f6a528"); r(8, 12, 2, 1, "#f6a528"); }
}
// A wing in six places, each a list of blocks for the left wing: down, out,
// up, to the head, across the chest, on the hip. The right wing is the mirror.
const WING = {
  D: [[5, 13, 3, 2], [5, 15, 2, 4]], O: [[1, 13, 7, 2], [1, 15, 2, 1]], U: [[5, 11, 3, 2], [3, 9, 3, 2], [1, 7, 3, 2]],
  H: [[5, 10, 3, 3], [5, 5, 2, 5], [6, 3, 3, 2]], X: [[6, 14, 9, 2]], Pp: [[5, 13, 3, 2], [4, 15, 2, 2], [5, 17, 3, 2]],
};
// Andrew, 2026-11-14: "The turkey should do things like the Macarena or the Dougie." The Macarena is one wing and then the
// other: out, across the chest, to the head, to the hip, and then a hop and a quarter turn. The Dougie is the lean, with a wing over the head.
const MACARENA = [["O", "D"], ["O", "O"], ["X", "O"], ["X", "X"], ["H", "X"], ["H", "H"], ["Pp", "H"], ["Pp", "Pp"]];
/** A big turkey that dances. kind is "macarena" or "dougie". */
export function turkeyDance(c, x, y, t, kind = "macarena", s = 2) {
  const beat = t * 2.2, step = Math.floor(beat * 2) % 16, dougie = kind === "dougie", side = Math.floor(beat) % 2 ? 1 : -1;
  const n = clamp(Math.round(s * 1.1), 2, 5), sw = dougie ? side * 2 : (step % 2 ? 1 : 0) * (step > 13 ? 0 : 1), hop = !dougie && step > 13 ? 2 : 0;
  const face = !dougie && Math.floor(beat / 8) % 2 ? true : false, X = lo(x) + (dougie ? side * n : 0), Y = lo(y);
  const r = pen(c, X, Y - hop * n, n, 24, 24, face), b = "#7a4a22", wc = "#5a3a1e";
  P(c, X - 8 * n, Y, 16 * n, n, SH);
  // the fan: a dark half circle, and nine feathers laid on it
  for (let j = -12; j <= 1; j++) { const w = Math.round(Math.sqrt(169 - j * j)); r(12 + sw - w, 13 + j, w * 2, 1, "#5a3a1e"); }
  for (let k = -4; k <= 4; k++) { const a = k * 0.37 + (dougie ? side * 0.08 : 0), col = LEAF[(k + 4 + Math.floor(beat)) % LEAF.length]; for (let q = 0; q < 10; q++) { const rr = 3 + q; r(Math.round(11 + sw + Math.sin(a) * rr), Math.round(13 - Math.cos(a) * rr), 2, 2, q > 7 ? "#fff3c0" : q === 6 ? "#3a2a66" : col); } }
  const lg = Math.floor(beat * 2) % 2;
  r(9, 21 - (lg ? 1 : 0), 1, 2, "#f6a528"); r(8, 23 - (lg ? 1 : 0), 3, 1, "#f6a528"); r(14, 21 - (lg ? 0 : 1), 1, 2, "#f6a528"); r(13, 23 - (lg ? 0 : 1), 3, 1, "#f6a528");
  r(8 + sw, 12, 8, 9, b); r(7 + sw, 14, 10, 5, b); r(9 + sw, 15, 6, 4, "#96602e");
  r(11 + sw, 9, 2, 4, b); r(9 + sw, 4, 6, 5, "#96602e");
  r(10 + sw, 5, 2, 2, "#ffffff"); r(13 + sw, 5, 2, 2, "#ffffff"); r(11 + sw, 6, 1, 1, INK); r(13 + sw, 6, 1, 1, INK);
  r(11 + sw, 7, 2, 2, "#f6c945"); r(12 + sw, 9, 1, 2, "#d9291c");
  const pose = dougie ? (side > 0 ? ["H", "D"] : ["D", "H"]) : MACARENA[Math.min(7, step >> 1)];
  WING[pose[0]].forEach(([i, j, w, h]) => r(i + sw, j, w, h, wc));
  WING[pose[1]].forEach(([i, j, w, h]) => r(24 - i - w + sw, j, w, h, wc));
}

// ─── the band ───
/** One member of the band: burnt orange, a white hat, white shoes. Every fourth one carries a sousaphone, and every fourth a drum. */
function marcher(c, X, Y, t, i, hop = 0) {
  const up = Math.floor(t * 4 + (i % 2)) % 2, kind = i % 4, or = "#bf5700", r = pen(c, X, Y - hop, 2, 6, 12);
  P(c, X - 5, Y, 10, 1, SH);
  r(1, 8, 2, up ? 3 : 4, or); r(3, 8, 2, up ? 4 : 3, or); r(1, up ? 10 : 11, 2, 1, WHITE); r(3, up ? 11 : 10, 2, 1, WHITE);
  r(1, 4, 4, 4, or); r(1, 4, 4, 1, WHITE); r(0, 5, 1, 3, or); r(5, 5, 1, 3, or);
  r(2, 2, 2, 2, ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"][i % 4]); r(1, 0, 4, 2, WHITE); r(1, 1, 4, 1, or); r(0, 2, 6, 1, WHITE);
  if (kind === 0) { r(3, -4, 4, 4, "#d9c48a"); r(4, -3, 2, 2, "#a8820f"); r(5, 0, 1, 6, WHITE); }
  else if (kind === 3) { r(0, 6, 6, 2, WHITE); r(0, 6, 6, 1, "#c9d3e6"); r(up ? 1 : 4, 5, 1, 1, "#5a3a1e"); }
  else { r(3, 3, 3, 1, "#f6c945"); r(5, 2, 1, 3, "#f6c945"); }
}
const GLYPH = { T: ["111", "010", "010", "010", "010"], E: ["111", "100", "110", "100", "111"], X: ["101", "101", "010", "101", "101"], A: ["010", "101", "111", "101", "101"], S: ["111", "100", "111", "001", "111"] };
/** The band on the field. It marches in as a block, then closes into the letters of a word. The last tuba is late. */
export function band(c, t, e, word = "TEXAS") {
  const spots = []; word.split("").forEach((ch, k) => (GLYPH[ch] || []).forEach((row, ry) => row.split("").forEach((on, rx) => { if (on === "1") spots.push([160 + (k * 4 + rx - 9) * 14, 90 + ry * 19]); })));
  const p = clamp((e - 2.5) / 3, 0, 1), ease = p * p * (3 - 2 * p), slide = Math.round(Math.max(0, 1 - e / 2.2) * 260);
  const last = spots.length - 1, lp = clamp((e - 6.2) / 1.2, 0, 1), cols = Math.ceil(spots.length / 5);
  spots.map((sp, i) => {
    if (i === last) return [Math.round(-12 + (sp[0] + 12) * lp), sp[1], lp > 0 && lp < 1 ? Math.floor(e * 10) % 2 * 3 : 0, 0];
    const bx = 160 + (Math.floor(i / 5) - cols / 2) * 12 + slide, by = 90 + (i % 5) * 19;
    return [Math.round(bx + (sp[0] - bx) * ease), Math.round(by + (sp[1] - by) * ease), 0, i];
  }).sort((a, b) => a[1] - b[1]).forEach(([X, Y, hop, i]) => marcher(c, X, Y, t, i, hop));
}
export function fireworks(c, t, n = 5) {
  for (let i = 0; i < n; i++) {
    const ph = t * 0.9 + i * 0.37, life = ph % 1, k0 = Math.floor(ph), x = 30 + Math.floor(rnd(i + k0) * 260), y = 17 + Math.floor(rnd(i * 3 + k0) * 55), col = ["#ffd75e", "#ff7b72", "#58bdf5", "#6ee7a0", "#ffffff"][(i + k0) % 5];
    if (life < 0.1) { P(c, x - 2, y - 2, 5, 5, "#ffffff"); continue; }
    const sz = life < 0.55 ? 2 : 1;
    for (let k = 0; k < 12; k++) { const a = k * TAU / 12, rr = life * 30, fall = life * life * 10; P(c, Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr + fall), sz, sz, col); if (life < 0.7) P(c, Math.round(x + Math.cos(a) * rr * 0.55), Math.round(y + Math.sin(a) * rr * 0.55 + fall), 1, 1, k % 2 ? "#ffffff" : col); }
  }
}

// The sideline up close, for the halftime questions: the team at the bench,
// the cooler, the field behind them.
export function sideline(c, t, where, face) {
  const bench = (col, d) => { P(c, 10, 104, 230, 5, col); P(c, 10, 108, 230, 1, d); P(c, 20, 109, 5, 7, d); P(c, 222, 109, 5, 7, d); };
  if (where === "park") {
    park(c, t, { field: false }); bench("#96602e", "#5a3a1e");
    ["uncle", "sister", "cousin", "brother", "nephew"].forEach((k, i) => cast(c, k, 78 + i * 88, 222, 0.6, { armUp: false, angry: false }));
    P(c, 250, 95, 23, 16, "#2f6fc4"); P(c, 248, 91, 27, 5, WHITE); P(c, 250, 108, 23, 3, "#1d3c8f"); leaves(c, t, 40);
  } else {
    const tx = where === "texas"; stadium(c, t, { team: tx ? "texas" : "dallas" }); bench("#c9d3e6", "#6a6a7a");
    for (let i = 0; i < 5; i++) person(c, 78 + i * 92, 222, 0.6, { ...CAST.kicker, ...(tx ? { shirt: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6", dot: "" } : {}), number: String(11 + i * 13), skin: ["#e8b98a", "#8a5a3a", "#c98a5a"][i % 3] });
    P(c, 250, 94, 20, 17, "#e2622a"); P(c, 248, 90, 24, 5, WHITE); P(c, 250, 108, 20, 3, "#a8551c");
  }
  person(c, 584, 232, 0.9, { ...CAST.you, face, shirt: where === "dallas" ? "#1b2a6b" : where === "texas" ? "#bf5700" : "#e2622a", number: where === "park" ? "1" : "", armUp: true, wave: t });
}
export function chute(c, x, y, t, face) {
  const X = lo(x) + Math.round(Math.sin(t * 2) * 3), Y = lo(y);
  for (let j = 0; j < 24; j++) { const w = Math.round(44 * Math.sqrt(1 - Math.pow(1 - (j + 1) / 24, 2))); for (let i = -w; i < w; i += 1) P(c, X + i, Y - 86 + j, 1, 1, Math.floor((i + 88) / 11) % 2 ? "#f6c945" : "#e2622a"); }
  for (let k = -4; k < 4; k++) P(c, X + k * 11 + 3, Y - 62, 5, 2, "#bf5700");
  [-43, -22, 0, 21, 43].forEach(dx => pline(c, X + dx, Y - 62, X + Math.round(dx * 0.14), Y - 26, WHITE));
  player(c, X * 2, (Y + 14) * 2, { jersey: "#e2622a", face, arms: 1, s: 1.5, front: true, lift: 400 }, 0);
}
/** A photograph cut down to a face of 21 squares by 24: the player's avatar. */
export function faceFrom(img) {
  const mk = (w, h) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; return cv; };
  const side = Math.min(img.naturalWidth, img.naturalHeight), w = side * 0.62, h = w * 24 / 21;
  const mid = mk(84, 96), mx = mid.getContext("2d"); mx.imageSmoothingEnabled = true; mx.imageSmoothingQuality = "high"; mx.drawImage(img, (img.naturalWidth - w) / 2, Math.max(0, (img.naturalHeight - h) * 0.3), w, h, 0, 0, 84, 96);
  const small = mk(21, 24), sx = small.getContext("2d"); sx.drawImage(mid, 0, 0, 84, 96, 0, 0, 21, 24);
  try { const d = sx.getImageData(0, 0, 21, 24); for (let i = 0; i < d.data.length; i += 4) for (let k = 0; k < 3; k++) d.data[i + k] = Math.min(255, Math.round(d.data[i + k] / 36) * 36); sx.putImageData(d, 0, 0); } catch { /* a picture that cannot be read stays as drawn */ }
  const cv = mk(63, 72), x = cv.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(small, 0, 0, 63, 72);
  return cv;
}

// ─── the cut scenes' kit: bars, lines, an iris, and things seen very close ───
/** Black bars top and bottom, p from 0 to 1. */
export function letterbox(c, p = 1, h = 34) { const k = lo(h * p); P(c, 0, 0, LW, k, "#000000"); P(c, 0, LH - k, LW, k, "#000000"); }
/** Lines rushing past behind something that is standing still. */
export function speedLines(c, t, bg = "#1d3c8f", col = "#ffffff", n = 40) {
  const dk = darken(bg, 0.35), lt = lighten(bg, 0.4);
  P(c, 0, 0, LW, LH, bg); P(c, 0, 0, LW, 40, dk); P(c, 0, 140, LW, 40, dk); dither(c, 0, 40, LW, 6, dk); dither(c, 0, 134, LW, 6, dk);
  for (let i = 0; i < n; i++) { const len = 24 + Math.floor(rnd(i + 2) * 90), y = Math.floor(rnd(i + 31) * LH), x = LW + len - Math.floor((t * (350 + rnd(i) * 450) + rnd(i + 7) * 700) % (LW + len * 2)); P(c, x, y, len, i % 4 ? 1 : 2, i % 3 ? col : lt); P(c, x + len, y, len >> 2, 1, i % 3 ? lt : dk); }
}
/** Lines bursting out from a point, for a moment that has stopped. */
export function burst(c, t, x, y, bg = "#e2622a", col = "#ffd75e", n = 18) {
  P(c, 0, 0, LW, LH, darken(bg, 0.2));
  c.fillStyle = col; const turn = (Math.floor(t * 8) % 2) * (TAU / n / 2);
  for (let i = 0; i < n; i++) { const a = i * TAU / n + turn, w = 0.07 + rnd(i) * 0.04; c.beginPath(); c.moveTo(x + Math.cos(a) * 60, y + Math.sin(a) * 60); c.lineTo(x + Math.cos(a - w) * 800, y + Math.sin(a - w) * 800); c.lineTo(x + Math.cos(a + w) * 800, y + Math.sin(a + w) * 800); c.fill(); }
  blob(c, lo(x), lo(y), 64, 60, bg); blob(c, lo(x), lo(y), 52, 48, lighten(bg, 0.18));
}
/** Everything black except a circle of radius r at (x, y). */
export function iris(c, x, y, r) { c.fillStyle = "#000"; c.beginPath(); c.rect(0, 0, W, H); c.arc(x, y, Math.max(0, r), 0, TAU, true); c.fill("evenodd"); }
/** Two feet in cleats on grass, mid-stride. */
export function cleats(c, t, col = "#e2622a") {
  P(c, 0, 0, LW, LH, "#4f9c36");
  for (let i = 0; i < 50; i++) { const x = ((Math.floor(rnd(i) * 450 - t * 450) % 380) + 380) % 380 - 30, y = 70 + Math.floor(rnd(i + 3) * 105); P(c, x, y, 15 + Math.floor(rnd(i + 5) * 25), 1 + (i % 3 === 0 ? 1 : 0), i % 2 ? "#6aa544" : "#2f8a3a"); }
  const f = Math.floor(t * 7) % 2;
  [[95, f ? 0 : -25], [200, f ? -25 : 0]].forEach(([x, up]) => {
    P(c, x + 2, 153, 92, 5, "#2f8a3a");
    P(c, x + 7, -10 + up, 33, 95, "#27325c"); P(c, x + 10, -10 + up, 5, 92, "#3a3a4a");
    P(c, x + 5, 80 + up, 37, 42, WHITE); P(c, x + 5, 88 + up, 37, 4, col); P(c, x + 5, 95 + up, 37, 2, col);
    P(c, x + 1, 118 + up, 48, 23, "#16121f"); P(c, x + 47, 124 + up, 28, 17, "#16121f"); P(c, x + 75, 130 + up, 9, 11, "#16121f");
    P(c, x + 1, 141 + up, 83, 4, WHITE); for (let k = 0; k < 4; k++) P(c, x + 31 + k * 8, 121 + up + k * 2, 6, 2, WHITE); P(c, x + 8, 126 + up, 18, 9, col);
    for (let k = 0; k < 6; k++) P(c, x + 5 + k * 13, 145 + up, 6, 7, "#c9d3e6");
    if (!up) for (let k = 0; k < 7; k++) P(c, x - 12 - k * 8, 146 - k * 5 - Math.floor(rnd(k) * 7), 5, 4, k % 2 ? "#6aa544" : "#7a4a22");
  });
}
/** Two hands and a football, very large. p is 0 (ball coming) to 1 (caught). */
export function bigCatch(c, t, p, sleeve = "#e2622a", skin = "#e8b98a") {
  const bx = Math.round(160 + (1 - p) * 130), by = Math.round(85 - (1 - p) * 30), kd = darken(skin, 0.2);
  const hx = (side) => Math.round(160 + side * (43 - p * 13));
  for (const side of [-1, 1]) { const x = hx(side); P(c, x - 18, 102, 36, 95, sleeve); P(c, x - 18, 102, 36, 6, darken(sleeve, 0.3)); P(c, x - 15, 108, 6, 80, lighten(sleeve, 0.2)); P(c, x - 16, 62, 32, 46, skin); P(c, x - 14, 60, 28, 2, skin); }
  blob(c, bx, by, 41, 24, "#7a4a22"); blob(c, bx - 6, by - 10, 24, 6, "#96602e"); P(c, bx - 32, by - 15, 4, 30, WHITE); P(c, bx + 28, by - 15, 4, 30, WHITE);
  if (p >= 1 || Math.floor(t * 12) % 2) { P(c, bx - 15, by - 2, 30, 3, WHITE); for (let k = -2; k <= 2; k++) P(c, bx + k * 6 - 1, by - 7, 2, 12, WHITE); }
  if (p > 0.6) for (const side of [-1, 1]) { const x = hx(side); for (let k = 0; k < 4; k++) { const fx = x - 13 + k * 9 - side * 3, fy = 50 + Math.round(Math.abs(k - 1.5) * 3); P(c, fx - 3, fy, 7, 22, skin); P(c, fx - 3, fy + 10, 7, 1, kd); P(c, fx - 3, fy, 7, 1, lighten(skin, 0.3)); } P(c, x - side * 15 - 4, 72, 8, 16, skin); }
}
/** Confetti in a team's colours. */
export function confetti(c, t, cols, n = 110) { for (let i = 0; i < n; i++) { const y = Math.floor((t * (30 + rnd(i) * 45) + rnd(i + 3) * 250) % (LH + 10)) - 5, x = Math.floor((rnd(i + 5) * LW + Math.sin(t * 2 + i) * 8 + LW) % LW), f = Math.floor(t * 6 + i) % 2; P(c, x, y, f ? 2 : 1, f ? 1 : 2, cols[i % cols.length]); } }
