// Turkey Bowl's places, the 8-bit pass: the park, the kitchen, the two
// stadiums, the field a play is run on, the locker room, the jet, and the
// food. Every place is drawn once onto a 320 by 180 picture and kept; only
// what moves is drawn again each frame: clouds, a crowd that bobs, steam, the
// lights of a city.
//
// Andrew, 2026-11-16: "go back down to 8 bit, and make it fun that way."
// A place is flat colour in bands, with a checker of two colours where a
// shade between them is wanted. Nothing fades.

import { LW, LH, LEAF, DIGITS, INK, rnd, lighten, darken, lo, P, pen, spr, blob, dither, star, lay } from "./draw.js";

const WHITE = "#f4f1e6";
const AUTUMN = ["#d9291c", "#e2622a", "#f0a030", "#f6c945", "#bf5700", "#a8551c", "#8a1c1c", "#ffb347"];
const SKINS = ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"];
const SKIES = {
  day: ["#2f6fc4", "#58bdf5", "#8ecbff", "#cfeaff"], dawn: ["#3a2a66", "#6a4bb0", "#e0707a", "#ffb347", "#ffd75e"],
  gold: ["#e2622a", "#f0a030", "#ffb347", "#ffd75e", "#fff3c0"], dusk: ["#0a1238", "#3a2a66", "#6a4bb0", "#e0707a", "#ffb347"],
};
/** A sky: colours in bands from y0 down to y1, each band's top edge checkered into the one above. */
function bands(x, y0, y1, cols) { const h = (y1 - y0) / cols.length; cols.forEach((col, i) => { const a = Math.round(y0 + i * h), b = Math.round(y0 + (i + 1) * h); P(x, 0, a, LW, b - a, col); if (i) dither(x, 0, a - 2, LW, 2, col); }); }
function cloud(c, x, y, k, col, under) { P(c, x + 3 * k, y, 7 * k, 2 * k, col); P(c, x + 8 * k, y - k, 4 * k, 2 * k, col); P(c, x, y + 2 * k, 14 * k, 3 * k, col); P(c, x + k, y + 5 * k, 12 * k, k, under); }
function tree(x, cx, base, r, col) {
  const lt = lighten(col, 0.3), dk = darken(col, 0.3), cy = base - r * 2;
  P(x, cx - 2, base - r - 2, 4, r + 2, "#5a3a1e"); P(x, cx - 2, base - r - 2, 1, r + 2, "#3a2a1e");
  blob(x, cx - Math.round(r * 0.6), cy + Math.round(r * 0.5), Math.round(r * 0.7), Math.round(r * 0.6), dk); blob(x, cx + Math.round(r * 0.6), cy + Math.round(r * 0.45), Math.round(r * 0.7), Math.round(r * 0.6), dk);
  blob(x, cx, cy, r, r, col); blob(x, cx - Math.round(r * 0.3), cy - Math.round(r * 0.35), Math.round(r * 0.55), Math.round(r * 0.45), lt);
  dither(x, cx - r + 3, cy + Math.round(r * 0.3), r * 2 - 6, Math.round(r * 0.5), dk);
  for (let i = 0; i < 6; i++) P(x, cx - r + 2 + Math.floor(rnd(cx + i) * (r * 2 - 4)), cy - r + 3 + Math.floor(rnd(cx + i + 9) * r * 1.4), 2, 1, i % 2 ? lt : "#f6c945");
}
/** Tiny numbers, three squares by five. */
function tiny(x, str, X, Y, col) { [...String(str)].forEach((ch, k) => { const g = DIGITS[ch]; if (g) for (let q = 0; q < 15; q++) if (g[q] === "1") P(x, X + k * 4 + (q % 3), Y + Math.floor(q / 3), 1, 1, col); }); }
/** Rows of people in the stands, each two squares wide. On the other frame about half of them are a square higher. */
function crowd(x, x0, y0, w, h, cols, frame, seed = 0) {
  P(x, x0, y0, w, h, "#16121f");
  for (let j = 0; j + 3 < h; j += 4) for (let i = (j >> 2) & 1; i + 1 < w; i += 3) {
    const k = seed + i * 7 + j * 131, up = frame && rnd(k + 9) > 0.5 ? 1 : 0;
    P(x, x0 + i, y0 + j + 1 - up, 2, 3, cols[Math.floor(rnd(k) * cols.length)]); P(x, x0 + i, y0 + j - up, 2, 1, SKINS[Math.floor(rnd(k + 5) * 4)]);
  }
}
const FANS = { dallas: ["#1b2a6b", "#1d3c8f", "#c9d3e6", "#f4f1e6", "#2f6fc4", "#9aa0aa"], texas: ["#bf5700", "#bf5700", "#e2622a", "#f4f1e6", "#8a3f00", "#f0a030"] };
function goalPost(x, X, base, h) { P(x, X, base - h, 2, h, "#f6c945"); P(x, X - 12, base - h, 26, 2, "#f6c945"); P(x, X - 12, base - h - 18, 2, 18, "#f6c945"); P(x, X + 12, base - h - 18, 2, 18, "#f6c945"); P(x, X - 1, base - 6, 4, 6, "#a8820f"); }

// ─── the park ───
const GRASS = { day: ["#6aa544", "#4f9c36"], dawn: ["#4f9c36", "#2f8a3a"], gold: ["#a8d070", "#6aa544"] };
const parkPicture = (time, field) => (x) => {
  const g = GRASS[time];
  bands(x, 0, 64, SKIES[time]);
  if (time !== "day") { blob(x, 236, 62, 15, 15, time === "dawn" ? "#ffd75e" : "#fff3c0"); blob(x, 236, 62, 11, 11, time === "dawn" ? "#fff3c0" : "#ffffff"); }
  for (let i = 0; i < 20; i++) blob(x, i * 17 + 4, 66, 11, 9, i % 3 ? "#8a3f00" : "#8a1c1c");
  P(x, 0, 68, LW, 12, "#8a3f00");
  for (let i = 0; i < 9; i++) { const cx = Math.round(i * 36 + rnd(i + 20) * 10), r = 13 + Math.floor(rnd(i + 3) * 6); [cx, cx - LW].forEach(q => tree(x, q, 82, r, AUTUMN[(i * 3 + 1) % AUTUMN.length])); }
  P(x, 0, 80, LW, 100, g[0]); dither(x, 0, 80, LW, 2, g[1]);
  if (field) {
    for (let k = 0; k < 8; k += 2) P(x, k * 40, 86, 40, 94, g[1]);
    P(x, 0, 86, LW, 2, WHITE); for (let k = 0; k < 8; k++) P(x, k * 40 + 19, 88, 1, 92, WHITE);
    goalPost(x, 286, 88, 34);
  } else for (let i = 0; i < 26; i++) P(x, Math.floor(rnd(i + 70) * LW), 84 + Math.floor(rnd(i + 80) * 94), 3, 1, g[1]);
  for (let i = 0; i < 90; i++) { const y = 82 + Math.floor(Math.pow(rnd(i + 3), 0.8) * 96); P(x, Math.floor(rnd(i) * LW), y, y > 130 ? 3 : 2, y > 150 ? 2 : 1, LEAF[i % LEAF.length]); }
};
export function park(c, t, { time = "day", field = true, scroll = 0 } = {}) {
  lay(c, "park-" + time + field, parkPicture(time, field), lo(scroll));
  if (time === "day") for (let i = 0; i < 3; i++) cloud(c, Math.floor((t * (3 + i) + i * 130) % 400) - 50, 8 + i * 9, 2 - (i % 2), "#ffffff", "#cfeaff");
}

// ─── the kitchen ───
const FOOD = {
  potato: [["................", "................", "......YY........", ".....WYYW.......", "....WWWWWW......", "...WWWWWWWW.....", "..WWWwWWWWWW....", "..WWWWWWWWgg....", ".WWWWWWwWgGGg...", ".WWWWWWWWGGGG...", "ppWWWWWWWWGGgpp.", "pPPPPPPPPPPPPPp.", ".pPPPPPPPPPPPp..", "..ppppppppppp...", "................", "................"], { W: "#fff3c0", w: "#ffffff", Y: "#f6c945", G: "#7a4a22", g: "#a8551c", P: "#f4f1e6", p: "#9aa0aa" }],
  turkey: [["................", "................", ".....BBBBB......", "...BBbbbbBBB....", "..BBbbLLbbbBB...", "..BbbLLbbbbbB...", ".BBbbbbbbbbbBB..", ".BbbbbbbbbbbbB.W", ".BbbbbbbbbbbBBWW", ".BBbbbbbbbBBDDW.", "..BBBBBBBBBDD...", "pp.DDDDDDDD..pp.", "pPPPPPPPPPPPPPp.", ".pPPPPPPPPPPPp..", "..ppppppppppp...", "................"], { B: "#8a3f00", b: "#bf5700", L: "#f0a030", D: "#7a4a22", W: "#f4f1e6", P: "#f4f1e6", p: "#9aa0aa" }],
  cranberry: [["................", "................", "....SSSSSSSS....", "....ssssssss....", "....RRRRRRRR....", "....RrRRRRRR....", "....RrWWWWRR....", "....RrWWWWRR....", "....RrRRRRRR....", "....DDDDDDDD....", "....RrRRRRRR....", "....RrRRRRRR....", "....ssssssss....", "....SSSSSSSS....", "................", "................"], { R: "#b01e3a", r: "#e0707a", D: "#8a1c1c", S: "#c9d3e6", s: "#9aa0aa", W: "#ffffff" }],
  pie: [["................", "........WW......", ".......WWWW.....", "......WWWWW.....", ".......OOO......", "......OOoOO.....", ".....OOooOOO....", "....OOoooOOOO...", "...OOooooOOOOO..", "..OOOOOOOOOOOOO.", ".CCCCCCCCCCCCCCC", ".CcCcCcCcCcCcCcC", ".CCCCCCCCCCCCCCC", "................", "................", "................"], { O: "#e2622a", o: "#f0a030", C: "#d9c48a", c: "#96602e", W: "#ffffff" }],
  water: [["................", "...GGGGGGGGGG...", "...G........G...", "...GBBBBBBBBG...", "...GBwBBBBBBG...", "....GBwBBBBG....", "....GBwBBBBG....", "....GBwBBBBG....", "....GBwBBBBG....", ".....GBBBBG.....", ".....GBBBBG.....", ".....GBBBBG.....", ".....GGGGGG.....", "................", "................", "................"], { G: "#cfeaff", B: "#58bdf5", w: "#ffffff" }],
  sparkling: [["..........LL....", "...GGGGGGGLLL...", "...G......lL.G..", "...GBBBoBBBBG...", "...GBwBBBBoBG...", "....GBwBoBBG....", "....GBwBBBBG....", "....GBoBBoBG....", "....GBwBBBBG....", ".....GBBoBG.....", ".....GoBBBG.....", ".....GBBBBG.....", ".....GGGGGG.....", "................", "................", "................"], { G: "#cfeaff", B: "#8ecbff", w: "#ffffff", o: "#ffffff", L: "#4f9c36", l: "#a8d070" }],
  coffee: [["................", "................", ".s....s....s....", "..s....s....s...", ".s....s....s....", "................", "WWWW.WWWW.WWWW..", "WBBW.WBBW.WBBW..", "WWWW.WWWW.WWWW..", "WRRW.WRRW.WRRW..", "WWWW.WWWW.WWWW..", "WWWW.WWWW.WWWW..", ".WW...WW...WW...", "................", "................", "................"], { W: "#f4f1e6", B: "#5a3a1e", R: "#d9291c", s: "#c9d3e6" }],
  champagne: [[".........o......", "....o.......o...", "......o.........", "....GGGGGGGG....", "....GYYYYYYG....", "....GYoYYYYG....", ".....GYYYYG.....", ".....GYYoYG.....", "......GYYG......", "......GGGG......", ".......GG.......", ".......GG.......", ".......GG.......", ".....GGGGGG.....", "................", "................"], { G: "#cfeaff", Y: "#ffd75e", o: "#ffffff" }],
};
/** Food and drink, sixteen cells a side, drawn with its corner at the origin. */
export function food(c, kind) { const f = FOOD[kind]; if (f) spr(c, f[0], 0, 0, 1, f[1]); }
export const FOOD_OF = { breakfast: { best: "potato", good: "turkey", bad: "cranberry", silly: "pie" }, jet: { best: "water", good: "sparkling", bad: "coffee", over: "champagne" } };
function kitchenRoom(x) {
  P(x, 0, 0, LW, 108, "#ffd75e"); for (let i = 0; i < LW; i += 16) P(x, i, 0, 8, 108, "#fff3c0"); P(x, 0, 0, LW, 4, "#96602e");
  // the window, with the morning in it
  P(x, 118, 8, 84, 4, "#5a3a1e"); P(x, 128, 14, 64, 50, WHITE); P(x, 132, 18, 56, 20, "#58bdf5"); P(x, 132, 38, 56, 12, "#cfeaff"); P(x, 132, 50, 56, 10, "#6aa544");
  [[140, 44, "#e2622a"], [158, 42, "#f0a030"], [176, 45, "#d9291c"]].forEach(([bx, by, col]) => blob(x, bx, by, 8, 7, col));
  P(x, 159, 18, 2, 42, WHITE); P(x, 132, 37, 56, 2, WHITE);
  for (const cx of [122, 188]) { P(x, cx, 12, 12, 54, "#d9291c"); for (let j = 14; j < 64; j += 6) P(x, cx + 2 + ((j / 6) & 1) * 5, j, 2, 2, WHITE); }
  // cupboards, the fridge, the counter, the stove
  P(x, 6, 8, 104, 32, "#96602e"); for (let i = 0; i < 4; i++) { P(x, 9 + i * 25, 11, 22, 26, "#7a4a22"); P(x, 9 + i * 25, 11, 22, 1, "#d9c48a"); P(x, 26 + i * 25, 24, 2, 3, "#f6c945"); }
  P(x, 262, 14, 48, 94, "#c9d3e6"); P(x, 262, 14, 48, 2, "#ffffff"); P(x, 262, 46, 48, 2, "#6a6a7a"); P(x, 266, 28, 2, 12, "#6a6a7a"); P(x, 266, 54, 2, 22, "#6a6a7a"); P(x, 306, 16, 4, 92, "#9aa0aa");
  P(x, 284, 24, 14, 12, WHITE); P(x, 288, 28, 6, 5, "#7a4a22"); P(x, 286, 26, 3, 6, "#e2622a"); P(x, 294, 30, 2, 1, "#d9291c");
  P(x, 0, 72, 262, 5, WHITE); P(x, 0, 77, 262, 2, "#9aa0aa"); P(x, 0, 79, 262, 29, "#96602e");
  for (let i = 0; i < 6; i++) { P(x, 4 + i * 43, 83, 38, 21, "#7a4a22"); P(x, 4 + i * 43, 83, 38, 1, "#d9c48a"); P(x, 20 + i * 43, 92, 6, 2, "#f6c945"); }
  P(x, 16, 68, 48, 5, "#3a3a4a"); P(x, 26, 54, 28, 14, "#6a6a7a"); P(x, 26, 54, 28, 2, "#9aa0aa"); P(x, 22, 58, 4, 2, "#3a3a4a"); P(x, 54, 58, 4, 2, "#3a3a4a"); P(x, 38, 51, 4, 3, "#3a3a4a"); P(x, 28, 58, 3, 8, "#9aa0aa");
  spr(x, FOOD.turkey[0], 74, 42, 2, FOOD.turkey[1]); spr(x, FOOD.pie[0], 206, 46, 2, FOOD.pie[1]); spr(x, FOOD.potato[0], 100, 50, 1, FOOD.potato[1]); spr(x, FOOD.cranberry[0], 236, 54, 1, FOOD.cranberry[1]);
  // the floor
  P(x, 0, 106, LW, 2, "#5a3a1e");
  for (let j = 0; j < 6; j++) for (let i = 0; i < 27; i++) P(x, i * 12, 108 + j * 12, 12, 12, (i + j) % 2 ? "#c9d3e6" : WHITE);
}
export function kitchen(c, t) {
  lay(c, "kitchen", kitchenRoom);
  for (let k = 0; k < 4; k++) { const up = Math.floor((t * 9 + k * 5) % 16); P(c, 32 + k * 5 + (Math.floor(t * 3 + k + up / 4) % 2), 50 - up, 1, 2, up > 11 ? "#fff3c0" : WHITE); }
}

// ─── the stadiums, for the scenes where people talk ───
const stadiumPicture = (team, midfield, frame) => (x) => {
  const fans = FANS[team], tx = team === "texas", wall = tx ? "#bf5700" : "#27325c";
  if (tx) {
    bands(x, 0, 24, SKIES.dusk.slice(1));
    for (const tx0 of [14, 292]) { P(x, tx0 + 6, 6, 3, 22, "#3a3a4a"); P(x, tx0, 0, 15, 8, "#3a3a4a"); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) P(x, tx0 + 1 + i * 4, 1 + j * 4, 2, 2, "#ffffff"); }
    crowd(x, 0, 16, LW, 28, fans, frame, 1); P(x, 124, 2, 72, 16, "#16121f"); P(x, 126, 4, 68, 12, "#8a3f00");
  } else {
    P(x, 0, 0, LW, 20, "#16121f"); for (let i = -20; i < LW; i += 20) { for (let k = 0; k < 18; k++) P(x, i + k, 18 - k, 1, 1, "#3a3a4a"); for (let k = 0; k < 18; k++) P(x, i + 20 - k, 18 - k, 1, 1, "#3a3a4a"); }
    for (let i = 6; i < LW; i += 14) { P(x, i, 17, 2, 2, "#ffffff"); P(x, i - 1, 19, 4, 1, "#ffd75e"); }
    crowd(x, 0, 20, LW, 24, fans, frame, 1); P(x, 98, 0, 124, 26, "#3a3a4a"); P(x, 101, 3, 118, 20, "#0a1238");
  }
  P(x, 0, 44, LW, 4, tx ? "#8a3f00" : "#1d3c8f");
  crowd(x, 0, 48, LW, 32, fans, frame, 77);
  P(x, 0, 80, LW, 10, wall); P(x, 0, 80, LW, 1, "#c9d3e6"); for (let i = 8; i < LW; i += 32) { P(x, i, 83, 14, 4, WHITE); P(x, i + 2, 84, 10, 2, wall); }
  const g = tx ? ["#2f8a3a", "#1f6b3a"] : ["#1f6b3a", "#123a1c"];
  P(x, 0, 90, LW, 90, g[0]); for (let k = 0; k < 8; k += 2) P(x, k * 40, 90, 40, 90, tx ? g[1] : "#2f8a3a");
  P(x, 0, 92, LW, 2, WHITE); for (let k = 0; k < 8; k++) P(x, k * 40 + 19, 94, 1, 86, WHITE);
  if (midfield && !tx) { x.save(); x.translate(320, 284); x.scale(1, 0.5); star(x, 0, 0, 70, "#1d3c8f", "#f4f1e6"); x.restore(); }
  if (midfield && tx) "TEXAS".split("").forEach((ch, k) => GLYPH[ch].forEach((row, j) => [...row].forEach((on, i) => { if (on === "1") P(x, 110 + (k * 4 + i) * 5 + 3, 108 + j * 5, 5, 5, WHITE); })));
};
const GLYPH = { T: ["111", "010", "010", "010", "010"], E: ["111", "100", "110", "100", "111"], X: ["101", "101", "010", "101", "101"], A: ["010", "101", "111", "101", "101"], S: ["111", "100", "111", "001", "111"] };
export function stadium(c, t, { midfield = false, scroll = 0, team = "dallas" } = {}) {
  const frame = Math.floor(t * 3) % 2, dx = lo(scroll);
  lay(c, "stadium-" + team + midfield + frame, stadiumPicture(team, midfield, frame), dx);
  for (let i = 0; i < 12; i++) P(c, (i * 28 + Math.floor(t * 24)) % (LW + 12) - 12, 45, 10, 2, i % 2 ? "#ffd75e" : WHITE);
  if (!dx) {
    // the big screen
    const say = team === "texas" ? ["TEXAS", "FIGHT"] : ["DEFENSE", "LOUDER"], word = say[Math.floor(t / 1.6) % 2], on = Math.floor(t * 4) % 4 !== 3;
    if (on) { c.font = "16px 'Press Start 2P', monospace"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = team === "texas" ? "#ffffff" : "#ffd75e"; c.fillText(word, 320, team === "texas" ? 21 : 37); c.textAlign = "left"; c.textBaseline = "alphabetic"; }
  }
  beams(c, t, 3);
}
/** Cameras going off in the stands. */
export function beams(c, t, n = 7) {
  const k = Math.floor(t * 10);
  for (let i = 0; i < n; i++) if (rnd(k * 7 + i) > 0.5) { const x = Math.floor(rnd(k + i * 13) * LW), y = 20 + Math.floor(rnd(k * 3 + i) * 56); P(c, x, y, 1, 1, "#ffffff"); if (rnd(k + i) > 0.6) { P(c, x - 1, y, 3, 1, "#ffffff"); P(c, x, y - 1, 1, 3, "#ffffff"); } }
}

// ─── the field a play is run on, seen from the side ───
// The field of play runs from x = 32 to 288 squares, a yard line every 32,
// with an end zone at each end. The stands, or the park's trees, are across
// the top. The far sideline is at 68 and the near one at 175.
const TURF = { park: ["#6aa544", "#4f9c36"], dallas: ["#2f8a3a", "#1f6b3a"], texas: ["#2f8a3a", "#1f6b3a"] };
const ENDZONE = { park: "#e2622a", dallas: "#1b2a6b", texas: "#bf5700" };
const turfPicture = (where, endzone, near, frame) => (x) => {
  const g = TURF[where], pk = where === "park";
  if (pk) {
    bands(x, 0, 44, SKIES.day);
    for (let i = 0; i < 20; i++) blob(x, i * 17 + 4, 46, 11, 8, i % 3 ? "#8a3f00" : "#8a1c1c");
    for (let i = 0; i < 11; i++) { const cx = Math.round(i * 30 + rnd(i + 40) * 8); tree(x, cx, 62, 9 + Math.floor(rnd(i + 5) * 4), AUTUMN[(i * 3 + 2) % AUTUMN.length]); }
    P(x, 0, 58, LW, 8, "#4f9c36"); P(x, 0, 61, LW, 2, "#96602e"); for (let i = 4; i < LW; i += 16) P(x, i, 57, 2, 9, "#7a4a22");
  } else {
    const tx = where === "texas", wall = tx ? "#bf5700" : "#27325c";
    if (tx) { bands(x, 0, 12, SKIES.dusk.slice(2)); crowd(x, 0, 10, LW, 20, FANS.texas, frame, 3); }
    else { P(x, 0, 0, LW, 10, "#16121f"); for (let i = 6; i < LW; i += 14) { P(x, i, 6, 2, 2, "#ffffff"); P(x, i - 1, 8, 4, 1, "#ffd75e"); } crowd(x, 0, 10, LW, 20, FANS.dallas, frame, 3); }
    P(x, 0, 30, LW, 3, tx ? "#8a3f00" : "#1d3c8f"); crowd(x, 0, 33, LW, 24, FANS[where], frame, 55);
    P(x, 0, 57, LW, 9, wall); P(x, 0, 57, LW, 1, "#c9d3e6"); for (let i = 8; i < LW; i += 32) { P(x, i, 60, 14, 4, WHITE); P(x, i + 2, 61, 10, 2, wall); }
  }
  for (let k = 0; k < 10; k++) P(x, k * 32, 66, 32, 114, g[k % 2]);
  if (endzone) { P(x, 288, 68, 32, 108, ENDZONE[where]); dither(x, 288, 68, 32, 108, lighten(ENDZONE[where], 0.25)); for (let j = 0; j < 5; j++) P(x, 298, 78 + j * 20, 12, 8, WHITE); }
  if (near) { const col = near.slice(0, 7); P(x, 0, 68, 32, 108, col); dither(x, 0, 68, 32, 108, lighten(col, 0.25)); for (let j = 0; j < 5; j++) P(x, 10, 78 + j * 20, 12, 8, WHITE); }
  P(x, 0, 68, LW, 2, WHITE); P(x, 0, 175, LW, 2, WHITE);
  for (let k = 1; k < 10; k++) { const goal = k === 1 || k === 9; if (pk && !goal) dither(x, k * 32, 70, 1, 105, WHITE); else P(x, k * 32, 70, goal ? 2 : 1, 105, WHITE); }
  if (!pk) {
    for (let xx = 40; xx < 288; xx += 8) if (xx % 32) { P(x, xx, 104, 1, 2, WHITE); P(x, xx, 140, 1, 2, WHITE); }
    for (let k = 2; k < 9; k++) { const yd = 50 - Math.abs(5 - k) * 10; tiny(x, yd, k * 32 - 4, 74, WHITE); tiny(x, yd, k * 32 - 4, 166, WHITE); }
    goalPost(x, 310, 68, 22); goalPost(x, 8, 68, 22);
  } else {
    goalPost(x, 310, 68, 22);
    [[32, 70], [32, 172], [288, 70], [288, 172]].forEach(([cx, cy]) => { P(x, cx - 1, cy, 3, 3, "#e2622a"); P(x, cx, cy - 2, 1, 2, "#e2622a"); });
    for (let i = 0; i < 70; i++) P(x, Math.floor(rnd(i + 11) * LW), 72 + Math.floor(rnd(i + 17) * 100), 2, 1, LEAF[i % LEAF.length]);
  }
};
export function turf(c, t, { where = "park", endzone = false, near = "" } = {}) {
  const frame = where === "park" ? 0 : Math.floor(t * 3) % 2;
  lay(c, "turf-" + where + endzone + near + frame, turfPicture(where, endzone, near, frame));
  if (where === "park") for (let i = 0; i < 2; i++) cloud(c, Math.floor((t * (3 + i) + i * 170) % 400) - 50, 6 + i * 10, 1, "#ffffff", "#cfeaff");
  else for (let i = 0; i < 12; i++) P(c, (i * 28 + Math.floor(t * 24)) % (LW + 12) - 12, 30, 10, 2, i % 2 ? "#ffd75e" : WHITE);
}

// ─── the locker room ───
function lockerRoom(x) {
  P(x, 0, 0, LW, 98, "#27325c"); P(x, 0, 0, LW, 6, "#16121f");
  P(x, 6, 20, 64, 46, "#3a3a4a"); P(x, 8, 22, 60, 42, WHITE);
  for (let k = 0; k < 4; k++) { const ox = 14 + k * 12; P(x, ox, 48, 5, 1, "#1d3c8f"); P(x, ox, 52, 5, 1, "#1d3c8f"); P(x, ox, 48, 1, 5, "#1d3c8f"); P(x, ox + 4, 48, 1, 5, "#1d3c8f"); for (let q = 0; q < 5; q++) { P(x, ox + 2 + q, 28 + q, 1, 1, "#d9291c"); P(x, ox + 6 - q, 28 + q, 1, 1, "#d9291c"); } }
  for (let q = 0; q < 12; q++) P(x, 30 + q, 46 - q, 1, 1, "#d9291c"); P(x, 39, 34, 4, 1, "#d9291c"); P(x, 42, 34, 1, 4, "#d9291c");
  for (let i = 0; i < 9; i++) {
    const lx = 78 + i * 27;
    P(x, lx, 16, 25, 82, "#6a6a7a"); P(x, lx, 16, 25, 2, "#9aa0aa"); P(x, lx, 18, 1, 80, "#9aa0aa"); P(x, lx + 24, 18, 1, 80, "#3a3a4a");
    for (let k = 0; k < 3; k++) P(x, lx + 6, 22 + k * 3, 13, 1, "#3a3a4a");
    P(x, lx + 6, 34, 13, 4, WHITE); P(x, lx + 20, 58, 2, 7, "#3a3a4a");
    if (i % 3 === 1) { P(x, lx + 5, 44, 15, 20, "#1b2a6b"); P(x, lx + 3, 44, 19, 5, "#1b2a6b"); tiny(x, 11 + i * 9, lx + 9, 51, WHITE); }
    if (i % 3 === 2) { P(x, lx + 7, 6, 11, 9, "#c9d3e6"); P(x, lx + 11, 6, 3, 9, "#1d3c8f"); P(x, lx + 16, 11, 3, 4, "#9aa0aa"); }
  }
  P(x, 0, 98, LW, 82, "#3a3a4a"); P(x, 0, 98, LW, 2, "#16121f"); for (let i = 0; i < LW; i += 20) P(x, i, 100, 1, 80, "#6a6a7a"); for (let j = 118; j < LH; j += 20) P(x, 0, j, LW, 1, "#6a6a7a");
  x.save(); x.translate(320, 296); x.scale(1, 0.45); star(x, 0, 0, 76, "#1d3c8f", "#c9d3e6"); x.restore();
  P(x, 74, 112, 190, 5, "#96602e"); P(x, 74, 116, 190, 1, "#5a3a1e"); P(x, 84, 117, 4, 8, "#5a3a1e"); P(x, 250, 117, 4, 8, "#5a3a1e");
}
export function locker(c) { lay(c, "locker", lockerRoom); }

// ─── the sky and the jet ───
export function sky(c, t) {
  lay(c, "sky", (x) => { bands(x, 0, LH, ["#1d3c8f", "#2f6fc4", "#58bdf5", "#8ecbff", "#cfeaff"]); blob(x, 270, 30, 12, 12, "#ffd75e"); blob(x, 270, 30, 9, 9, "#fff3c0"); });
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 4; i++) { const k = layer * 4 + i, x = ((rnd(k) * 450 - t * (7 + layer * 13)) % 450 + 450) % 450 - 65, y = 30 + rnd(k + 4) * 125 + layer * 8; cloud(c, Math.floor(x), Math.floor(y), 1 + layer, layer === 2 ? "#ffffff" : "#cfeaff", "#8ecbff"); }
}
export function plane(c, x, y) {
  const X = lo(x), Y = lo(y), navy = "#1d3c8f", grey = "#c9d3e6";
  for (let k = 0; k < 3; k++) P(c, X - 22 - k * 9 - (Math.floor(Date.now() / 120) % 3) * 2, Y + 4 + (k % 2), 5 - k, 2, "#ffffff");
  P(c, X - 15, Y - 17, 20, 3, grey);
  for (let j = 0; j < 16; j++) P(c, X - 10 + Math.floor(j / 3), Y - 14 + j, 10, 1, navy);
  P(c, X - 6, Y - 8, 1, 3, WHITE); P(c, X - 7, Y - 7, 3, 1, WHITE);
  P(c, X - 6, Y + 2, 82, 12, WHITE); P(c, X - 10, Y + 2, 6, 8, WHITE); P(c, X + 76, Y + 4, 6, 9, WHITE); P(c, X + 82, Y + 6, 4, 6, WHITE);
  P(c, X - 6, Y + 11, 86, 3, grey); P(c, X - 10, Y + 8, 94, 2, navy);
  P(c, X + 72, Y + 3, 7, 3, "#27325c"); for (let i = 0; i < 7; i++) P(c, X + 15 + i * 8, Y + 4, 4, 3, "#58bdf5"); P(c, X + 62, Y + 3, 1, 9, "#9aa0aa"); P(c, X + 67, Y + 3, 1, 9, "#9aa0aa");
  P(c, X + 2, Y - 4, 22, 7, grey); P(c, X + 2, Y - 4, 22, 1, "#ffffff"); P(c, X + 24, Y - 3, 2, 5, "#27325c");
  for (let j = 0; j < 12; j++) P(c, X + 34 - j * 2, Y + 11 + j, 22, 1, j < 2 ? "#9aa0aa" : grey); P(c, X + 10, Y + 21, 6, 2, navy);
}
/** The inside of Jerry's jet: windows with the sky going by, wood, leather. */
export function cabin(c, t, scroll = 0) {
  lay(c, "cabin", (x) => {
    P(x, 0, 0, LW, 15, "#96602e"); P(x, 0, 15, LW, 2, "#fff3c0"); P(x, 0, 17, LW, 76, WHITE); for (let i = 0; i < LW; i += 40) P(x, i + 18, 9, 6, 3, "#fff3c0");
    P(x, 0, 93, LW, 10, "#7a4a22"); P(x, 0, 94, LW, 1, "#d9c48a"); for (let i = 0; i < 40; i++) P(x, Math.floor(rnd(i) * LW), 96 + Math.floor(rnd(i + 3) * 6), 8 + Math.floor(rnd(i + 5) * 14), 1, "#5a3a1e");
    P(x, 0, 103, LW, 22, "#d9c48a"); P(x, 0, 125, LW, 55, "#27325c"); P(x, 0, 125, LW, 2, "#16121f");
    for (let j = 132; j < LH; j += 7) for (let i = ((j / 7) & 1) * 7; i < LW; i += 14) { P(x, i, j, 3, 1, "#1d3c8f"); P(x, i + 1, j - 1, 1, 3, "#1d3c8f"); }
  });
  const off = ((lo(scroll) % 75) + 75) % 75;
  for (let i = -1; i < 6; i++) {
    const x = i * 75 - off + 20;
    P(c, x + 2, 28, 36, 54, "#c9d3e6"); P(c, x, 30, 40, 50, "#c9d3e6"); P(c, x + 4, 33, 32, 44, "#58bdf5"); P(c, x + 4, 58, 32, 19, "#8ecbff");
    for (let k = 0; k < 2; k++) { const cx = x + 4 + Math.floor((t * (25 + k * 14) + i * 19 + k * 30) % 52) - 14, a = Math.max(cx, x + 4), b = Math.min(cx + 14, x + 36); if (b > a) { P(c, a, 50 + k * 14, b - a, 4, "#ffffff"); P(c, a, 54 + k * 14, b - a, 1, "#cfeaff"); } }
    P(c, x + 4, 33, 32, 9, "#d9c48a"); P(c, x + 4, 42, 32, 1, "#96602e"); P(c, x + 18, 43, 4, 2, "#96602e");
  }
}
export function seat(c, x, y) {
  const X = lo(x), Y = lo(y), a = "#e3b877", l = "#f0c8a0", d = "#96602e";
  P(c, X - 32, Y + 3, 64, 3, "#16121f");
  P(c, X - 18, Y - 79, 36, 2, a); P(c, X - 22, Y - 77, 44, 63, a); P(c, X - 20, Y - 75, 5, 58, l); P(c, X - 8, Y - 60, 1, 44, d); P(c, X + 7, Y - 60, 1, 44, d); P(c, X + 16, Y - 75, 6, 60, darken(a, 0.12));
  P(c, X - 13, Y - 76, 26, 13, l); P(c, X - 13, Y - 64, 26, 1, d);
  P(c, X - 28, Y - 25, 56, 28, a); P(c, X - 26, Y - 23, 52, 3, l); P(c, X - 28, Y - 1, 56, 4, d);
  for (const dx of [-32, 23]) { P(c, X + dx, Y - 39, 9, 36, d); P(c, X + dx - 1, Y - 41, 11, 4, "#7a4a22"); P(c, X + dx, Y - 40, 9, 1, "#d9c48a"); }
}

// ─── two single shots ───
/** The Dallas stadium from the air at dusk: a silver dome on a plain of lights. */
export function dome(c, t) {
  lay(c, "dome", (x) => {
    bands(x, 0, 74, SKIES.dusk); P(x, 0, 74, LW, 106, "#16121f"); P(x, 0, 74, LW, 1, "#3a2a66");
    const LIGHT = ["#ffd75e", "#f0a030", "#ffffff", "#ffb347", "#58bdf5"];
    for (let i = 0; i < 520; i++) P(x, Math.floor(rnd(i) * LW), 76 + Math.floor(Math.pow(rnd(i + 3), 1.6) * 102), 1, 1, LIGHT[i % 5]);
    for (let i = 0; i < LW; i += 4) { P(x, i, 128, 2, 1, "#ffd75e"); P(x, i + 2, 150, 2, 1, "#ffffff"); }
    for (let i = 0; i < 60; i++) { P(x, 30 + i * 2, 178 - i, 1, 1, "#f0a030"); P(x, 290 - i * 2, 178 - i, 1, 1, "#ffd75e"); }
    for (const [lx, ly] of [[24, 100], [250, 100], [40, 136], [236, 136]]) for (let j = 0; j < 14; j += 3) for (let i = 0; i < 44; i += 3) if (rnd(lx + i * 3 + j) > 0.25) P(x, lx + i, ly + j, 2, 1, ["#9aa0aa", "#d9291c", "#2f6fc4", "#f4f1e6"][Math.floor(rnd(i + j + lx) * 4)]);
    blob(x, 160, 116, 88, 9, "#000000");
    blob(x, 160, 96, 78, 24, "#9aa0aa"); blob(x, 160, 92, 72, 19, "#c9d3e6"); blob(x, 142, 82, 36, 6, WHITE);
    P(x, 82, 97, 156, 17, "#6a6a7a"); P(x, 82, 97, 156, 1, "#9aa0aa");
    P(x, 84, 99, 26, 13, "#58bdf5"); P(x, 210, 99, 26, 13, "#58bdf5"); dither(x, 84, 99, 26, 13, "#8ecbff"); dither(x, 210, 99, 26, 13, "#8ecbff");
    P(x, 112, 101, 96, 9, "#ffd75e"); dither(x, 112, 101, 96, 9, "#f0a030"); for (let i = 112; i < 208; i += 12) P(x, i, 101, 1, 9, "#6a6a7a");
    P(x, 159, 70, 2, 26, "#6a6a7a"); for (const sx of [-1, 1]) for (let q = 0; q < 24; q++) P(x, 160 + sx * (20 + q * 2), 72 + Math.floor(q * q / 26), 2, 1, "#6a6a7a");
  });
  const k = Math.floor(t * 6);
  for (let i = 0; i < 16; i++) P(c, Math.floor(rnd(k + i * 31) * LW), 118 + Math.floor(rnd(k * 3 + i) * 60), 1, 1, i % 2 ? "#ffffff" : "#16121f");
  for (let i = 0; i < 4; i++) P(c, 96 + Math.floor(rnd(k + i) * 128), 86 + Math.floor(rnd(k + i + 5) * 8), 1, 1, "#ffffff");
}
/** A football lying in the leaves, the park behind it. */
export function leafBall(c) {
  lay(c, "leafBall", (x) => {
    bands(x, 0, 60, SKIES.day.slice(1));
    [[30, 30, 34, "#f0a030"], [100, 22, 30, "#e2622a"], [210, 34, 40, "#d9291c"], [280, 24, 34, "#f6c945"], [160, 14, 26, "#bf5700"]].forEach(([bx, by, r, col]) => { blob(x, bx, by, r, Math.round(r * 0.8), col); dither(x, bx - r + 4, by, r * 2 - 8, Math.round(r * 0.6), darken(col, 0.25)); });
    [[46, 12], [108, 8], [150, 6], [282, 11]].forEach(([tx, w]) => P(x, tx, 0, w, 90, "#3a2a1e"));
    P(x, 0, 76, LW, 12, "#4f9c36"); P(x, 0, 86, LW, 94, "#a8551c");
    const LITTER = [...LEAF, "#8a1c1c", "#f6c945", "#8a3f00", "#bf5700"];
    for (let i = 0; i < 700; i++) { const y = 84 + Math.floor(Math.pow(rnd(i + 3), 0.8) * 96), k = 2 + Math.floor((y - 84) / 24), col = LITTER[i % LITTER.length], lx = Math.floor(rnd(i) * (LW + 10)) - 5; P(x, lx, y, k + 1, k, col); P(x, lx + 1, y - 1, k - 1, 1, col); P(x, lx + (k >> 1), y, 1, k, darken(col, 0.25)); }
    blob(x, 184, 160, 74, 7, "#3a2a1e");
    blob(x, 180, 131, 72, 30, "#7a4a22"); blob(x, 168, 116, 46, 8, "#96602e"); dither(x, 130, 146, 100, 10, "#5a3a1e");
    P(x, 230, 112, 5, 40, WHITE); P(x, 124, 113, 5, 38, WHITE); P(x, 164, 105, 32, 3, WHITE); for (let i = -3; i <= 3; i++) P(x, 179 + i * 5, 101, 2, 11, WHITE);
    for (let i = 0; i < 30; i++) { const col = LEAF[i % 6], lx = Math.floor(rnd(i + 60) * LW), y = 150 + Math.floor(rnd(i + 3) * 28); P(x, lx, y, 6, 4, col); P(x, lx + 1, y - 1, 4, 1, col); P(x, lx + 3, y, 1, 4, darken(col, 0.25)); }
  });
}

// ─── Austin, on the way to the stadium ───
// Andrew, 2026-11-16: "when they go to Austin, I wanna cut scene with Austin ... have some longhorns ... some breakfast tacos
// or some barbecue. the capitol. and then the bats, like driving down Congress Avenue with the bats." Four shots.
function longhorn(c, X, Y, t, flip, col) {
  const f = Math.floor(t * 1.5 + X) % 2, r = pen(c, X, Y, 2, 30, 16, flip), w = "#f4f1e6", hn = "#fff3c0", dk = darken(col, 0.3);
  P(c, X - 20, Y, 40, 2, "rgba(0,0,0,.3)");
  r(4, 6, 1, 6, "#3a2a1e"); r(6, 12, 2, 3, dk); r(15, 12, 2, 3, dk); r(9, 12, 2, 3, col); r(18, 12, 2, 3, col); for (const i of [6, 9, 15, 18]) r(i, 15, 2, 1, "#3a2a1e");
  r(5, 6, 15, 6, col); r(5, 6, 15, 1, lighten(col, 0.2)); r(8, 7, 4, 3, w); r(15, 9, 3, 2, w); r(6, 11, 13, 1, dk);
  r(19, 5 + f, 3, 4, col); r(21, 4 + f, 5, 5, col); r(24, 7 + f, 3, 2, "#f0c8a0"); r(23, 5 + f, 1, 1, INK); r(22, 4 + f, 1, 1, w);
  r(17, 3 + f, 5, 1, hn); r(14, 2 + f, 4, 1, hn); r(13, 1 + f, 2, 1, hn); r(25, 3 + f, 3, 1, hn); r(27, 2 + f, 3, 1, hn); r(29, 1 + f, 1, 1, hn);
}
function taco(x, cx, cy) {
  blob(x, cx, cy, 30, 15, "#f0c8a0"); blob(x, cx, cy - 3, 26, 11, "#ffd75e");
  for (let i = 0; i < 9; i++) { const fx = cx - 22 + i * 5; P(x, fx, cy - 9 + (i % 3), 5, 5, ["#ffd75e", "#8a1c1c", "#f0a030", "#fff3c0"][i % 4]); if (i % 3 === 1) P(x, fx + 1, cy - 11, 2, 2, "#4f9c36"); }
  blob(x, cx, cy + 5, 30, 10, "#f0c8a0"); blob(x, cx - 4, cy + 3, 22, 5, "#fff3c0"); for (let i = 0; i < 7; i++) P(x, cx - 20 + i * 7, cy + 7 + (i % 2), 2, 1, "#c98a5a");
}
const AUSTIN = {
  cattle: (x) => {
    bands(x, 0, 86, SKIES.day); blob(x, 70, 104, 130, 30, "#a8d070"); blob(x, 260, 108, 150, 34, "#6aa544"); P(x, 0, 104, LW, 76, "#6aa544");
    tree(x, 286, 104, 17, "#2f8a3a"); tree(x, 24, 100, 12, "#1f6b3a");
    for (let i = 0; i < LW; i += 26) { P(x, i + 4, 96, 2, 14, "#7a4a22"); } P(x, 0, 99, LW, 1, "#96602e"); P(x, 0, 104, LW, 1, "#96602e");
    for (let i = 0; i < 120; i++) { const y = 108 + Math.floor(Math.pow(rnd(i + 3), 0.8) * 70); P(x, Math.floor(rnd(i) * LW), y, 2, 1, i % 4 === 0 ? "#2f6fc4" : i % 4 === 1 ? "#f6c945" : "#4f9c36"); if (i % 4 === 0) P(x, Math.floor(rnd(i) * LW), y - 1, 1, 1, "#8ecbff"); }
  },
  tacos: (x) => {
    P(x, 0, 0, LW, LH, "#96602e"); for (let j = 0; j < LH; j += 30) { P(x, 0, j, LW, 1, "#5a3a1e"); for (let i = 0; i < 6; i++) P(x, Math.floor(rnd(j + i) * LW), j + 6 + Math.floor(rnd(j + i + 9) * 20), 14 + Math.floor(rnd(i + j) * 30), 1, "#7a4a22"); }
    blob(x, 92, 96, 78, 50, "#c9d3e6"); blob(x, 92, 94, 76, 48, "#f4f1e6"); blob(x, 92, 94, 60, 36, "#ffffff");
    taco(x, 70, 84); taco(x, 112, 110); blob(x, 138, 62, 14, 10, "#f4f1e6"); blob(x, 138, 62, 11, 7, "#d9291c"); P(x, 132, 59, 4, 2, "#ff7b72"); P(x, 140, 63, 2, 2, "#4f9c36");
    P(x, 186, 34, 124, 122, "#fff3c0"); P(x, 186, 34, 124, 2, "#d9c48a"); dither(x, 186, 150, 124, 6, "#d9c48a");
    for (let i = 0; i < 4; i++) { const by = 44 + i * 15; P(x, 194 + i * 3, by, 60, 12, "#5a3a1e"); P(x, 194 + i * 3, by, 60, 2, "#1c1626"); P(x, 194 + i * 3, by + 2, 60, 2, "#e0707a"); P(x, 198 + i * 3, by + 6, 40, 1, "#7a4a22"); }
    blob(x, 282, 62, 20, 7, "#8a3f00"); blob(x, 278, 60, 12, 2, "#bf5700"); blob(x, 284, 82, 20, 7, "#8a3f00"); blob(x, 280, 80, 12, 2, "#bf5700");
    for (let i = 0; i < 5; i++) { blob(x, 204 + i * 13, 118, 6, 5, "#4f9c36"); blob(x, 204 + i * 13, 118, 3, 2, "#a8d070"); }
    P(x, 262, 104, 38, 30, "#f4f1e6"); P(x, 262, 104, 38, 2, "#d9c48a"); P(x, 258, 110, 38, 30, "#ffffff"); P(x, 258, 110, 38, 2, "#d9c48a");
    for (let i = 0; i < 3; i++) { blob(x, 208 + i * 16, 140, 7, 4, "#f4f1e6"); blob(x, 208 + i * 16, 140, 4, 2, "#fff3c0"); }
  },
  capitol: (x) => {
    const g = "#e0707a", sh = "#b01e3a", lit = "#ffd75e";
    bands(x, 0, 132, SKIES.dusk); for (let i = 0; i < 40; i++) P(x, Math.floor(rnd(i) * LW), Math.floor(rnd(i + 5) * 44), 1, 1, "#ffffff");
    P(x, 0, 132, LW, 48, "#1f6b3a"); for (let j = 0; j < 12; j++) P(x, 150 - j * 2, 132 + j * 4, 20 + j * 4, 4, "#d9c48a");
    P(x, 34, 100, 252, 34, g); P(x, 30, 96, 260, 5, sh); P(x, 34, 130, 252, 4, sh);
    for (let i = 0; i < 20; i++) { if (i > 7 && i < 12) continue; P(x, 42 + i * 12, 106, 5, 9, lit); P(x, 42 + i * 12, 119, 5, 8, i % 3 ? lit : "#3a2a66"); }
    P(x, 126, 88, 68, 46, g); for (let j = 0; j < 10; j++) P(x, 126 + j * 3, 88 - j - 1, 68 - j * 6, 1, sh); for (let i = 0; i < 6; i++) P(x, 131 + i * 11, 92, 4, 38, "#fff3c0"); P(x, 152, 112, 16, 22, "#3a2a66");
    blob(x, 160, 62, 26, 24, g); blob(x, 152, 54, 10, 12, lighten(g, 0.3)); P(x, 132, 62, 56, 18, g); P(x, 130, 60, 60, 3, sh); for (let i = 0; i < 9; i++) P(x, 135 + i * 6, 64, 3, 14, "#fff3c0");
    P(x, 153, 28, 14, 12, g); P(x, 151, 27, 18, 2, sh); for (let i = 0; i < 3; i++) P(x, 155 + i * 4, 30, 2, 8, lit); P(x, 157, 22, 6, 6, g); P(x, 159, 14, 2, 8, "#c9d3e6"); P(x, 158, 12, 4, 1, "#ffffff"); P(x, 160, 10, 1, 5, "#ffffff");
    for (const [tx, r] of [[16, 15], [60, 11], [262, 12], [306, 16]]) tree(x, tx, 140, r, "#123a1c");
  },
  bats: (x) => {
    bands(x, 0, 104, SKIES.gold); blob(x, 64, 88, 16, 16, "#fff3c0"); blob(x, 64, 88, 12, 12, "#ffffff");
    [[0, 30, 62], [32, 22, 74], [56, 18, 50], [98, 26, 66], [126, 14, 80], [176, 14, 82], [192, 30, 58], [224, 20, 70], [246, 34, 46], [282, 22, 72], [304, 16, 60]].forEach(([bx, w, top], i) => { P(x, bx, top, w, 104 - top, i % 2 ? "#3a2a66" : "#27325c"); for (let j = top + 4; j < 100; j += 6) for (let k = bx + 3; k < bx + w - 2; k += 5) if (rnd(k * j) > 0.45) P(x, k, j, 2, 2, "#ffd75e"); });
    blob(x, 160, 86, 9, 9, "#6a4bb0"); P(x, 146, 90, 28, 14, "#6a4bb0"); P(x, 159, 72, 2, 6, "#6a4bb0");
    P(x, 0, 128, LW, 52, "#2f6fc4"); for (let j = 130; j < LH; j += 4) for (let i = (j % 8) * 3; i < LW; i += 22) P(x, i, j, 10, 1, j < 150 && i > 30 && i < 110 ? "#ffd75e" : "#58bdf5");
    P(x, 0, 112, LW, 12, "#3a3a4a"); for (let i = 0; i < 5; i++) { P(x, i * 72 + 2, 112, 12, 40, "#3a3a4a"); blob(x, i * 72 + 44, 126, 30, 12, "#2f6fc4"); P(x, i * 72 + 14, 126, 60, 2, "#2f6fc4"); }
    P(x, 0, 104, LW, 8, "#6a6a7a"); P(x, 0, 104, LW, 1, "#9aa0aa"); P(x, 0, 99, LW, 1, "#9aa0aa"); for (let i = 0; i < LW; i += 10) P(x, i, 99, 1, 5, "#9aa0aa");
    for (let i = 20; i < LW; i += 64) { P(x, i, 82, 1, 22, "#3a3a4a"); P(x, i - 2, 81, 5, 2, "#fff3c0"); }
  },
};
/** One shot of Austin. shot is "cattle", "tacos", "capitol" or "bats"; e is how long the shot has been up, in seconds. */
export function austin(c, t, shot, e = 0) {
  lay(c, "austin-" + shot, AUSTIN[shot]);
  if (shot === "cattle") { longhorn(c, 84, 142, t, false, "#bf5700"); longhorn(c, 264, 134, t, false, "#8a3f00"); longhorn(c, 180, 158, t, true, "#bf5700"); for (let i = 0; i < 2; i++) cloud(c, Math.floor((t * (3 + i) + i * 170) % 400) - 50, 10 + i * 14, 2 - i, "#ffffff", "#cfeaff"); }
  else if (shot === "tacos") for (let k = 0; k < 9; k++) { const up = Math.floor((t * 9 + k * 5) % 22); P(c, (k < 4 ? 60 + k * 18 : 200 + (k - 4) * 14) + (Math.floor(t * 3 + k + up / 5) % 2), (k < 4 ? 70 : 40) - up, 1, 3, up > 15 ? "#d9c48a" : "#f4f1e6"); }
  else if (shot === "capitol") { const k = Math.floor(t * 3); for (let i = 0; i < 5; i++) P(c, 42 + Math.floor(rnd(k + i) * 20) * 12, 106, 5, 9, "#fff3c0"); P(c, 161, 11 + (k % 2), 5, 3, k % 2 ? "#d9291c" : "#f4f1e6"); }
  else {
    const cx = Math.floor((e * 46) % 400) - 50;
    P(c, cx, 97, 30, 7, "#bf5700"); P(c, cx + 14, 91, 12, 6, "#bf5700"); P(c, cx + 16, 92, 8, 4, "#cfeaff"); P(c, cx + 29, 99, 2, 2, "#fff3c0"); P(c, cx, 99, 1, 2, "#d9291c"); P(c, cx + 4, 103, 5, 3, INK); P(c, cx + 21, 103, 5, 3, INK);
    for (let i = 0; i < 300; i++) {
      const p = (e * (0.12 + rnd(i + 2) * 0.1) + rnd(i)) % 1, x0 = 70 + rnd(i + 1) * 150, grow = Math.min(1, e / 2.5); if (rnd(i + 7) > grow) continue;
      const bx = Math.floor(x0 + p * (150 + rnd(i + 4) * 130)), by = Math.floor(112 - Math.pow(p, 0.7) * (96 + rnd(i + 5) * 20) + Math.sin(p * 9 + i) * 7), f = Math.floor(t * 9 + i) % 2;
      P(c, bx, by, 2, 1, INK); if (f) { P(c, bx - 1, by - 1, 1, 1, INK); P(c, bx + 2, by - 1, 1, 1, INK); } else { P(c, bx - 1, by + 1, 1, 1, INK); P(c, bx + 2, by + 1, 1, 1, INK); }
    }
  }
}
