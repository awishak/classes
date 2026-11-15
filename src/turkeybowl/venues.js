// Turkey Bowl's places: the park, the kitchen, the two stadiums, the field
// seen from above during a play, the locker room, the sky, the jet, and two
// single shots (the dome from the air, a football in the leaves).
//
// Andrew, 2026-11-15: "please make the graphics a hundred times better," with
// nine pictures to work from: Jerry Jones, a park field walled in by autumn
// trees with a yellow goal post, a football lying in leaves, the Texas
// stadium at dusk, the Texas band, the Dallas stadium from the air and from
// inside, and two football games from a 1998 console. "use them all." The
// places below are drawn from those pictures. Words and colours only: no
// team's logo is drawn anywhere.

import { W, H, TAU, INK, LEAF, rnd, clamp, mix, lighten, darken, alpha, R, disc, ell, shape, poly, oval, box, B, limb, line, inside, vgrad, glow, star, leaf, kept, lay, PLAY, VENUE, proj, quad, ground } from "./draw.js";

const FONT = (n) => n + "px 'Press Start 2P', monospace";
/** Paint on the ground at a spot: inside fn, one unit across is one unit of field, and down the screen is toward the camera. */
function onGround(c, x, y, cam, fn, flat = 2.2) {
  const d = x + cam.z0, p = proj(x, y, 0, cam);
  // A field is far longer than it is wide, so a unit across is worth more on the screen than a unit downfield.
  // The last scale evens that out, leaving whatever is painted about flat times as wide as it is tall.
  c.save(); c.transform(cam.L / d, 0, (y - 268) * cam.L / (d * d), cam.A / (d * d), p.x, p.y); c.scale(1, cam.L * d / (cam.A * flat)); fn(c); c.restore();
}
const vignette = (c, a = 0.35) => lay(c, "vig" + a, W, H, (x) => { const g = x.createRadialGradient(320, 180, 170, 320, 180, 430); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(8,6,24,${a})`); x.fillStyle = g; x.fillRect(0, 0, W, H); });

// ─── trees and sky ───
/** A crown of leaves: a clump of round masses, lit from the upper left, flecked with single leaves. */
function canopy(c, x, y, r, col, seed) {
  const blobs = []; for (let i = 0; i < 8; i++) blobs.push([x + (rnd(seed + i) - 0.5) * r * 1.5, y + (rnd(seed + i + 40) - 0.5) * r * 1.0, r * (0.42 + rnd(seed + i + 80) * 0.3)]);
  blobs.forEach(([bx, by, br]) => disc(c, bx + br * 0.1, by + br * 0.16, br * 1.03, darken(col, 0.36)));
  blobs.forEach(([bx, by, br]) => disc(c, bx, by, br, col));
  blobs.forEach(([bx, by, br]) => disc(c, bx - br * 0.24, by - br * 0.3, br * 0.56, lighten(col, 0.16)));
  for (let i = 0; i < 26; i++) { const [bx, by, br] = blobs[i % 8], a = rnd(seed + i * 3) * TAU, d = rnd(seed + i * 7) * br * 0.9; ell(c, bx + Math.cos(a) * d, by + Math.sin(a) * d, r * 0.07, r * 0.04, i % 3 ? lighten(col, 0.3) : darken(col, 0.22), a); }
}
const AUTUMN = ["#e0431c", "#f07a1c", "#f2a62c", "#d9291c", "#f6c63a", "#c9601c", "#9aa03a", "#b8352a"];
const SKIES = {
  day: { sky: [[0, "#5b8fc9"], [0.6, "#a9c8e6"], [1, "#e4eef6"]], cloud: "#ffffff", under: "#a9b6cc", haze: "#b9cbe0", sun: [520, 46], tint: null },
  gold: { sky: [[0, "#c9502e"], [0.45, "#f08a4b"], [0.8, "#fbc56a"], [1, "#ffe9b0"]], cloud: "#ffd9a0", under: "#e08a5a", haze: "#f6b070", sun: [498, 138], tint: "rgba(255,140,40,.16)" },
  dawn: { sky: [[0, "#1f2560"], [0.4, "#5b3f8a"], [0.75, "#e0728a"], [1, "#fbc27a"]], cloud: "#f2a6b0", under: "#8a5a9a", haze: "#b07a9a", sun: [124, 142], tint: "rgba(70,50,150,.2)" },
};
function cloud(c, x, y, s, col, under) {
  const puffs = [[0, 0, 20], [24, -9, 25], [52, -3, 21], [74, 4, 14], [-20, 5, 13]];
  puffs.forEach(([dx, dy, r]) => disc(c, x + dx * s, y + (dy + 5) * s, r * s, under));
  puffs.forEach(([dx, dy, r]) => disc(c, x + dx * s, y + dy * s, r * s * 0.94, col));
  ell(c, x + 26 * s, y + 13 * s, 52 * s, 7 * s, under);
}
/** The far end of the park: sky, a wall of autumn trees with the tallest at the sides, dark trunks, a low black fence. */
function parkBack(c, time) {
  const k = SKIES[time];
  c.fillStyle = vgrad(c, 0, 170, k.sky); c.fillRect(0, 0, W, 175);
  glow(c, k.sun[0], k.sun[1], 150, "#fff3c0", time === "day" ? 0.5 : 0.75); disc(c, k.sun[0], k.sun[1], time === "day" ? 20 : 26, "#fff6cf");
  [[70, 34, 1.5], [250, 22, 1.2], [396, 44, 1.7], [560, 70, 1.1], [-10, 78, 1.3]].forEach(([x, y, s]) => cloud(c, x, y, s, k.cloud, k.under));
  const hz = (col) => mix(col, k.haze, 0.42);
  // the back row, hazy, then a nearer row, lower in the middle so the sky shows over the goal post
  for (let i = 0; i < 24; i++) { const x = i * 29 - 12, mid = 1 - Math.min(1, Math.abs(x - 320) / 190); canopy(c, x, 104 + mid * 20 + rnd(i) * 8, 27 + rnd(i + 5) * 9, hz(AUTUMN[(i * 3) % 8]), i * 11); }
  R(c, 0, 132, W, 34, "#2a1c16");
  for (let i = 0; i < 46; i++) { const x = 6 + i * 14 + rnd(i + 200) * 8; R(c, x, 118 + rnd(i) * 10, 2 + rnd(i + 9) * 3, 46, "#20140f"); }
  for (let i = 0; i < 20; i++) { const x = i * 34 - 6, mid = 1 - Math.min(1, Math.abs(x - 320) / 170); canopy(c, x, 112 + mid * 16 + rnd(i + 30) * 8, 24 + rnd(i + 35) * 8, mix(AUTUMN[(i * 5 + 1) % 8], k.haze, 0.12), 300 + i * 13); }
  // the tall ones at the sides
  [[-6, 54, 50, 0], [58, 30, 46, 1], [120, 62, 42, 3], [174, 84, 34, 2], [20, 104, 40, 5], [652, 44, 52, 1], [590, 26, 44, 7], [528, 58, 42, 2], [470, 86, 34, 4], [612, 104, 42, 0]].forEach(([x, y, r, ci], i) => { R(c, x - 3, y + r * 0.5, 6, 160 - y - r * 0.5, "#20140f"); canopy(c, x, y, r, AUTUMN[ci], 700 + i * 17); });
  // the fence, and the leaves blown up against the edge of the grass
  R(c, 206, 147, 228, 15, "#15161c"); R(c, 206, 147, 228, 2, "#2c2e38"); for (let x = 210; x < 434; x += 12) R(c, x, 147, 1, 15, "#2c2e38");
  c.fillStyle = vgrad(c, 150, 172, [[0, "rgba(20,12,8,0)"], [1, "rgba(20,12,8,.5)"]]); c.fillRect(0, 150, W, 22);
  for (let i = 0; i < 240; i++) ell(c, rnd(i + 900) * W, 160 + rnd(i + 950) * 9, 2.4, 1.1, LEAF[i % 6], rnd(i) * 3);
}
function goalPost(c, x, y, s, col = "#f2c81e") {
  const d = darken(col, 0.3);
  R(c, x - 1.5 * s, y - 34 * s, 3 * s, 34 * s, col); R(c, x + 0.5 * s, y - 34 * s, 1 * s, 34 * s, d);
  R(c, x - 22 * s, y - 36 * s, 44 * s, 2.6 * s, col); R(c, x - 22 * s, y - 34.4 * s, 44 * s, 1 * s, d);
  R(c, x - 22 * s, y - 80 * s, 2.4 * s, 46 * s, col); R(c, x + 19.6 * s, y - 80 * s, 2.4 * s, 46 * s, col);
}
/** Grass in perspective, mown in bands, for the standing camera. */
function venueGrass(c, scroll, cols, band = 40) {
  c.fillStyle = vgrad(c, 160, H, [[0, cols[0]], [1, cols[1]]]); c.fillRect(0, 160, W, H - 160);
  const off = ((scroll % (band * 2)) + band * 2) % (band * 2);
  for (let x = -120 - off; x < 700; x += band * 2) ground(c, Math.max(-78, x), Math.max(-78, x + band), -400, 940, "rgba(0,0,0,.075)", VENUE);
}
const yardLines = (c, scroll, cam, col, w = 1.6, step = 80) => { const off = ((scroll % step) + step) % step; for (let x = -off; x <= 560; x += step) if (x > -70) ground(c, x - w, x + w, 183, 353, col, cam); };
/** A park, the way Andrew's picture has it: standing on the field, looking at the goal post and the wall of trees. */
export function park(c, t, { time = "day", field = true, scroll = 0 } = {}) {
  const k = SKIES[time];
  lay(c, "parkBack" + time, W, 176, (x) => parkBack(x, time));
  venueGrass(c, scroll, ["#7cb04a", "#3f7f30"]);
  if (field) {
    ground(c, -70, 640, 181, 184.4, "rgba(255,255,255,.8)", VENUE); ground(c, -70, 640, 351.6, 355, "rgba(255,255,255,.8)", VENUE); ground(c, 637, 641, 183, 353, "rgba(255,255,255,.8)", VENUE);
    yardLines(c, scroll, VENUE, "rgba(255,255,255,.78)");
    goalPost(c, 320, 163, 1);
  }
  // leaves lying on the grass, larger as they come nearer
  for (let i = 0; i < 110; i++) { const wx = (((rnd(i + 40) * 760 - scroll) % 760) + 760) % 760 - 70, wy = 60 + rnd(i + 70) * 420, p = proj(wx, wy, 0, VENUE); if (p.y < 362 && p.x > -10 && p.x < 650) leaf(c, p.x, p.y, 1.2 + p.s * 2.6, LEAF[i % 6], rnd(i) * 6, 0.5); }
  // one big tree on each side, nearer than the wall, and its shadow
  lay(c, "parkSides" + time, W, 250, (x) => {
    [[34, 1], [606, -1]].forEach(([tx, d], i) => {
      ell(x, tx + d * 34, 204, 60, 7, "rgba(0,0,0,.22)");
      shape(x, "#2a1a12", poly([[tx - 8, 204], [tx - 5, 120], [tx - 16 * d, 76], [tx - 9 * d, 72], [tx + 1, 104], [tx + 8 * d, 60], [tx + 14 * d, 64], [tx + 7, 120], [tx + 9, 204]]), 1.2);
      R(x, tx - 5, 120, 3, 84, "#4a2f1e");
      [[-30, 52, 40, 0], [26, 40, 44, 1], [-4, 4, 46, 2], [42, 86, 30, 3], [-44, 96, 28, 4]].forEach(([dx, y, r, ci], n) => canopy(x, tx + dx * d, y, r, AUTUMN[(ci + i * 3) % 8], 60 + i * 50 + n * 9));
    });
  });
  if (k.tint) { c.fillStyle = k.tint; c.fillRect(0, 0, W, H); glow(c, k.sun[0], k.sun[1], 260, time === "gold" ? "#ffb060" : "#ff9ab0", 0.3); }
  vignette(c, 0.3);
}

// ─── the kitchen at half past six ───
function kitchenRoom(c) {
  c.fillStyle = vgrad(c, 0, 240, [[0, "#3d5a6c"], [1, "#2c4250"]]); c.fillRect(0, 0, W, 240);
  for (let x = 0; x < W; x += 26) R(c, x, 0, 1, 240, "rgba(255,255,255,.035)");
  // the floor: tiles running to a point
  R(c, 0, 240, W, 120, "#b9825a");
  for (let i = -14; i < 15; i++) { c.fillStyle = (i & 1) ? "#d9a878" : "#a8704a"; for (let j = 0; j < 5; j++) { if ((i + j) & 1) continue; const y0 = 240 + j * j * 5, y1 = 240 + (j + 1) * (j + 1) * 5, a = (y) => 320 + (i * 40) * (0.55 + (y - 240) / 120), b = (y) => 320 + ((i + 1) * 40) * (0.55 + (y - 240) / 120); c.beginPath(); c.moveTo(a(y0), y0); c.lineTo(b(y0), y0); c.lineTo(b(y1), y1); c.lineTo(a(y1), y1); c.fill(); } }
  c.fillStyle = vgrad(c, 240, H, [[0, "rgba(20,10,30,.45)"], [1, "rgba(20,10,30,.1)"]]); c.fillRect(0, 240, W, 120);
  // counter and cupboards along the back wall
  B(c, 0, 196, W, 46, "#7a5234", "#946a44", "#5a3a22"); for (let x = 12; x < W; x += 62) { B(c, x, 204, 54, 32, "#8a5f3c", "#a0744c", "#6a4428", 2); disc(c, x + 46, 220, 2, "#e8dcc0"); }
  B(c, -2, 186, W + 4, 11, "#e8dcc0", "#fffaf0", "#b9ad90");
  for (let x = 300; x < W; x += 16) for (let y = 162; y < 186; y += 12) { R(c, x, y, 15, 11, ((x / 16 + y / 12) & 1) ? "#e9eef2" : "#cfdde6"); }
  // upper cupboards and a shelf with the clock
  [[18, 62], [84, 62], [150, 62]].forEach(([x, w]) => { B(c, x, 8, w, 40, "#8a5f3c", "#a0744c", "#6a4428", 2); B(c, x + 6, 14, w - 12, 28, "#7a5234", null, null, 2); disc(c, x + w - 10, 40, 2, "#e8dcc0"); });
  B(c, 52, 118, 150, 6, "#a0744c", "#c08a52", "#6a4428");
  B(c, 66, 58, 118, 60, "#16121f", "#2a2438", null, 6); R(c, 72, 64, 106, 48, "#0b0812");
  // the fridge, with a hand turkey on it
  B(c, 222, 70, 78, 172, "#dfe6ee", "#f6f9fc", "#aab6c8", 5); R(c, 222, 126, 78, 2, "#8793a8"); B(c, 228, 92, 5, 26, "#8793a8", null, null, 2); B(c, 228, 136, 5, 40, "#8793a8", null, null, 2);
  B(c, 252, 82, 34, 34, "#fffaf0", null, null, 1); for (let i = 0; i < 4; i++) { c.save(); c.translate(268, 108); c.rotate(-0.9 + i * 0.42); B(c, -3, -22, 6, 16, LEAF[i], null, null, 3); c.restore(); } disc(c, 268, 106, 7, "#a8551c"); disc(c, 276, 100, 4, "#a8551c"); R(c, 279, 100, 4, 2, "#f6c945");
  disc(c, 240, 150, 4, "#e2622a"); disc(c, 286, 144, 4, "#2f6fc4"); disc(c, 262, 160, 4, "#f6c945");
  // the window: the sun coming up over the neighbours' roofs
  B(c, 372, 30, 190, 134, "#e8dcc0", "#fffaf0", "#b9ad90", 3);
  inside(c, box(380, 38, 174, 118), (x) => {
    x.fillStyle = vgrad(x, 38, 156, [[0, "#2f3585"], [0.5, "#c9608a"], [0.82, "#fbb66a"], [1, "#ffe6a8"]]); x.fillRect(380, 38, 174, 118);
    glow(x, 450, 150, 80, "#fff3c0", 0.9); disc(x, 450, 152, 20, "#fff6cf");
    x.fillStyle = "#2a2444"; x.beginPath(); x.moveTo(380, 156); x.lineTo(380, 136); x.lineTo(404, 120); x.lineTo(428, 136); x.lineTo(428, 142); x.lineTo(486, 142); x.lineTo(510, 124); x.lineTo(534, 142); x.lineTo(554, 138); x.lineTo(554, 156); x.fill();
    R(x, 396, 138, 8, 8, "#ffd75e"); R(x, 504, 142, 8, 8, "#ffd75e");
  });
  R(c, 464, 38, 5, 118, "#e8dcc0"); R(c, 380, 94, 174, 5, "#e8dcc0");
  [[372, 1], [562, -1]].forEach(([x, d]) => { shape(c, "#c9402a", poly([[x, 26], [x + d * 44, 26], [x + d * 30, 96], [x + d * 40, 150], [x, 150]]), 1.2); for (let y = 36; y < 150; y += 16) R(c, x + (d < 0 ? d * 30 : 0), y, 30, 4, "rgba(255,255,255,.3)"); });
  B(c, 364, 22, 206, 7, "#6a4428", "#8a5f3c");
  B(c, 364, 162, 206, 9, "#e8dcc0", "#fffaf0", "#b9ad90");
  B(c, 520, 142, 20, 20, "#c9601c", "#e08a4a", "#8a3f10", 3); [[-8, -10], [0, -16], [8, -9]].forEach(([dx, dy]) => ell(c, 530 + dx, 142 + dy, 6, 9, "#4f9440", dx * 0.05));
  // light from the window, laid across the room
  c.fillStyle = "rgba(255,214,150,.1)"; c.beginPath(); c.moveTo(380, 38); c.lineTo(554, 38); c.lineTo(360, H); c.lineTo(20, H); c.fill();
  // the table, set
  ell(c, 190, 352, 190, 12, "rgba(0,0,0,.3)");
  B(c, 60, 184, 14, 176, "#6a4428", "#8a5f3c"); B(c, 306, 184, 14, 176, "#6a4428", "#8a5f3c");
  shape(c, "#fffaf0", poly([[30, 166], [350, 166], [354, 200], [26, 200]]), 1.4);
  for (let x = 30; x < 350; x += 20) { c.fillStyle = "#e2622a"; c.beginPath(); c.moveTo(x, 200); c.lineTo(x + 10, 190); c.lineTo(x + 20, 200); c.fill(); }
  R(c, 28, 172, 324, 3, "#f0a030");
  vignette(c, 0.4);
}
export function kitchen(c, t) {
  lay(c, "kitchen", W, H, kitchenRoom);
  c.fillStyle = "#ff5a3c"; c.font = FONT(24); c.textAlign = "left"; c.shadowColor = "#ff5a3c"; c.shadowBlur = 8; c.fillText(Math.floor(t * 2) % 2 ? "6:30" : "6 30", 78, 101); c.shadowBlur = 0;
  [["potato", 80], ["turkey", 150], ["cranberry", 220], ["pie", 290]].forEach(([kind, x], i) => {
    ell(c, x + 2, 170, 32, 6, "rgba(0,0,0,.2)"); shape(c, "#eef2f8", oval(x, 166, 30, 6), 1); ell(c, x, 165, 22, 3.6, "#d5dce8");
    c.save(); c.translate(x - 27, 110 + Math.sin(t * 2 + i) * 1.5); c.scale(1.7, 1.7); food(c, kind); c.restore();
    if (kind !== "cranberry") for (let n = 0; n < 2; n++) { const p = ((t * 0.5 + i * 0.3 + n * 0.5) % 1); c.strokeStyle = `rgba(255,255,255,${0.4 * (1 - p)})`; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 6 + n * 12, 118 - p * 30); c.quadraticCurveTo(x - 12 + n * 12 + Math.sin(t * 3 + n) * 4, 108 - p * 30, x - 6 + n * 12, 98 - p * 30); c.stroke(); }
  });
}

// ─── the two stadiums ───
// Dallas is indoors: a steel roof, bands of light between the decks, and one
// enormous screen hanging over the field. Texas is open to a sky at dusk,
// with the city behind the far end, racks of lights over the upper deck, and
// burnt orange end zones.
const HOUSE = {
  dallas: { name: "DALLAS", a: "#1d3c8f", b: "#c9d3e6", seats: ["#1d3c8f", "#c9d3e6", "#2a56c6", "#8793bd", "#e8ecf5", "#16224f", "#1d3c8f", "#3a4a80"], dark: "#0a0f24", turf: ["#2f9a52", "#1c7038"], zone: "#1b2a6b", ink: "#c9d3e6", ribbon: "#cfe6ff", rows: [84, 84], gaps: [[24, 29], [54, 59]], wall: "#1b2a6b" },
  texas: { name: "TEXAS", a: "#bf5700", b: "#ffffff", seats: ["#bf5700", "#e87a1e", "#ffffff", "#8a3f00", "#f4b27a", "#d96a10", "#bf5700", "#f0e0d0"], dark: "#1c1008", turf: ["#3aa04e", "#1f6a30"], zone: "#bf5700", ink: "#ffffff", ribbon: "#ffd9a8", rows: [44, 92], gaps: [[30, 33], [56, 64]], wall: "#bf5700" },
};
const ROW = (j) => [108 + j * 3.1, 8 + j * 2.5];   // how far out a row of seats sits, and how high
const inGap = (h, j) => h.gaps.some(([a, b]) => j >= a && j <= b);
function fan1(c, wx, wy, hh, col, skin, shadeT) {
  const p = proj(wx, wy, hh, VENUE); if (p.x < -6 || p.x > 646 || p.y < -6 || p.y > 300) return;
  const s = Math.max(1.5, p.s * 4.6);
  c.fillStyle = shadeT ? mix(col, "#070a1c", shadeT) : col; c.fillRect(p.x - s / 2, p.y - s, s, s * 1.2);
  c.fillStyle = shadeT ? mix(skin, "#070a1c", shadeT) : skin; c.fillRect(p.x - s * 0.3, p.y - s * 1.55, s * 0.6, s * 0.6);
}
const SKINS = ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"];
function bowl(c, team) {
  const h = HOUSE[team], [endRows, sideRows] = h.rows, tx = team === "texas";
  // what is over the stands
  if (tx) {
    c.fillStyle = vgrad(c, 0, 150, [[0, "#16224f"], [0.45, "#5a4a8a"], [0.75, "#e0808a"], [1, "#fbc27a"]]); c.fillRect(0, 0, W, 170);
    for (let i = 0; i < 40; i++) R(c, rnd(i + 900) * W, rnd(i + 950) * 50, 1, 1, "rgba(255,255,255,.7)");
    [[190, 30, 16], [300, 20, 22], [470, 40, 14]].forEach(([x, y, r]) => { ell(c, x, y, r * 3, r * 0.5, "rgba(250,170,150,.35)"); });
    // the city behind the far end
    const sky = [[150, 44, 16], [170, 62, 12], [186, 38, 10], [200, 58, 20], [226, 30, 12], [240, 52, 26], [270, 60, 18], [292, 26, 14], [310, 48, 22], [336, 56, 14], [352, 34, 16], [372, 50, 24], [400, 60, 16], [418, 42, 14], [436, 54, 22], [462, 62, 18]];
    sky.forEach(([x, top, w], i) => { R(c, x, top + 40, w, 80, "#241a3a"); if (i === 4 || i === 7) { c.fillStyle = "#241a3a"; c.beginPath(); c.moveTo(x, top + 40); c.lineTo(x + w / 2, top + 22); c.lineTo(x + w, top + 40); c.fill(); } for (let n = 0; n < 9; n++) if (rnd(i * 13 + n) > 0.45) R(c, x + 2 + (n % 3) * (w / 3.4), top + 46 + Math.floor(n / 3) * 8, 2, 3, "#ffd98a"); });
  } else {
    c.fillStyle = vgrad(c, 0, 150, [[0, "#10131f"], [1, "#1c2236"]]); c.fillRect(0, 0, W, 170);
    // the roof: a strip of daylight down the middle, steel arches across it
    c.fillStyle = vgrad(c, 0, 60, [[0, "#cfe0f2"], [1, "#6f86a8"]]); c.beginPath(); c.moveTo(150, 0); c.lineTo(490, 0); c.lineTo(372, 70); c.lineTo(268, 70); c.fill();
    c.strokeStyle = "#0c0e18"; c.lineWidth = 1.2; for (let i = 0; i <= 10; i++) { const u = i / 10; c.beginPath(); c.moveTo(150 + 340 * u, 0); c.lineTo(268 + 104 * u, 70); c.stroke(); } for (let i = 1; i < 6; i++) { const y = i * i * 2.6; c.beginPath(); c.moveTo(150 + y * 1.69, y); c.lineTo(490 - y * 1.69, y); c.stroke(); }
    c.lineWidth = 5; c.strokeStyle = "#2a3148"; [[-40, 150, 320, -70, 680, 150], [40, 120, 320, -20, 600, 120]].forEach(([x0, y0, cx, cy, x1, y1]) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); });
    c.lineWidth = 1; c.strokeStyle = "#3a4260"; for (let i = 0; i < 30; i++) { const u = i / 29, x = -40 + 720 * u, y = 150 - 4 * u * (1 - u) * 220 * 0.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 12, y + 14); c.lineTo(x + 24, y); c.stroke(); }
  }
  // the far stand, straight across, then the two side stands running back toward the camera
  const far = (j) => { const [a, hh] = ROW(j); return proj(662 + j * 3.1, 268, hh, VENUE); };
  const eTop = far(endRows), eBot = far(0);
  c.fillStyle = h.dark; c.fillRect(0, eTop.y - 2, W, eBot.y - eTop.y + 6);
  for (let j = endRows; j >= 0; j--) { if (inGap(h, j)) continue; const [, hh] = ROW(j), sh = 0.12 + 0.4 * j / 90; for (let i = -92; i <= 92; i++) { if (i % 14 === 0) continue; const k = j * 197 + i; fan1(c, 662 + j * 3.1, 268 + i * 4.4, hh, h.seats[Math.floor(rnd(k + 1) * 8)], SKINS[Math.floor(rnd(k + 7) * 4)], sh); } }
  for (const side of [-1, 1]) {
    const pt = (x, j) => { const [a, hh] = ROW(j); return proj(x, 268 + side * a, hh, VENUE); };
    c.fillStyle = h.dark; c.beginPath(); [pt(640, 0), pt(640, sideRows), pt(120, sideRows), pt(120, 0)].forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.fill();
    for (let x = 640; x >= 150; x -= 4.6) { const col = Math.round(x / 4.6); if (col % 13 === 0) continue; for (let j = sideRows; j >= 0; j--) { if (inGap(h, j)) continue; const [a, hh] = ROW(j), k = j * 311 + col * 7 + side; fan1(c, x, 268 + side * a, hh, h.seats[Math.floor(rnd(k + 1) * 8)], SKINS[Math.floor(rnd(k + 7) * 4)], 0.1 + 0.4 * j / 90); } }
    // the bands of light between the decks
    h.gaps.forEach(([a, b]) => { if (a > sideRows) return; const p0 = pt(640, a), p1 = pt(150, a), q0 = pt(640, b), q1 = pt(150, b); c.fillStyle = "#0a0c16"; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.lineTo(q1.x, q1.y); c.lineTo(q0.x, q0.y); c.fill(); const m0 = pt(640, (a + b) / 2), m1 = pt(150, (a + b) / 2); c.strokeStyle = h.ribbon; c.lineWidth = 1.6; c.shadowColor = h.ribbon; c.shadowBlur = 6; c.beginPath(); c.moveTo(m0.x, m0.y); c.lineTo(m1.x, m1.y); c.stroke(); c.shadowBlur = 0; });
    // the wall at the edge of the field
    const w0 = proj(640, 268 + side * 107, 0, VENUE), w1 = proj(60, 268 + side * 107, 0, VENUE), u0 = proj(640, 268 + side * 107, 9, VENUE), u1 = proj(60, 268 + side * 107, 9, VENUE);
    c.fillStyle = h.wall; c.beginPath(); c.moveTo(w0.x, w0.y); c.lineTo(w1.x, w1.y); c.lineTo(u1.x, u1.y); c.lineTo(u0.x, u0.y); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(u0.x, u0.y); c.lineTo(u1.x, u1.y); c.stroke();
    if (tx) {   // racks of lights standing over the upper deck
      const r0 = pt(640, sideRows), r1 = pt(330, sideRows); const y0 = r0.y - 16, y1 = r1.y - 44;
      c.strokeStyle = "#2a2438"; c.lineWidth = 1.5; for (let i = 0; i <= 6; i++) { const u = i / 6, x = r0.x + (r1.x - r0.x) * u, yb = r0.y + (r1.y - r0.y) * u, yt = y0 + (y1 - y0) * u; c.beginPath(); c.moveTo(x, yb); c.lineTo(x, yt); c.stroke(); }
      c.strokeStyle = "#fff8d0"; c.lineWidth = 4; c.shadowColor = "#fff3c0"; c.shadowBlur = 14; c.beginPath(); c.moveTo(r0.x, y0); c.lineTo(r1.x, y1); c.stroke(); c.shadowBlur = 0;
    }
  }
  h.gaps.forEach(([a, b]) => { if (a > endRows) return; const p0 = far(a), p1 = far(b); R(c, 0, p1.y, W, p0.y - p1.y, "#0a0c16"); c.shadowColor = h.ribbon; c.shadowBlur = 6; R(c, 60, (p0.y + p1.y) / 2 - 0.8, 520, 1.6, h.ribbon); c.shadowBlur = 0; });
  R(c, 0, eBot.y - 1, W, 8, h.wall); R(c, 0, eBot.y - 1, W, 1.2, "#fff");
  // light falling into the bowl
  if (tx) { c.fillStyle = vgrad(c, 60, 170, [[0, "rgba(20,10,40,.34)"], [1, "rgba(255,190,120,.1)"]]); c.fillRect(0, 60, W, 110); }
  else { c.fillStyle = vgrad(c, 40, 170, [[0, "rgba(6,8,24,.5)"], [1, "rgba(6,8,24,0)"]]); c.fillRect(0, 40, W, 130); }
}
/** The screen that hangs over the field in Dallas, or the board over the far end in Texas. */
function board(c, t, team) {
  const h = HOUSE[team], tx = team === "texas", x = tx ? 232 : 196, y = tx ? 22 : 6, w = tx ? 176 : 248, hh = tx ? 56 : 72;
  if (tx) { R(c, x + 16, y + hh, 6, 30, "#2a2438"); R(c, x + w - 22, y + hh, 6, 30, "#2a2438"); } else { c.strokeStyle = "#0c0e18"; c.lineWidth = 2; [x + 30, x + w - 30].forEach(px => { c.beginPath(); c.moveTo(px, y); c.lineTo(px, -4); c.stroke(); }); }
  shape(c, "#05070f", box(x, y, w, hh, 3), 1.2);
  inside(c, box(x + 4, y + 4, w - 8, hh - 8), (g) => {
    g.fillStyle = vgrad(g, y, y + hh, [[0, lighten(h.a, 0.12)], [1, darken(h.a, 0.55)]]); g.fillRect(x, y, w, hh);
    const cx = x + (tx ? w / 2 : 52), cy = y + hh / 2;
    if (!tx) { g.save(); g.translate(cx, cy); g.rotate(t * 0.25); g.fillStyle = "rgba(255,255,255,.1)"; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 150, i * TAU / 12, i * TAU / 12 + 0.16); g.fill(); } g.restore(); glow(g, cx, cy, 44, "#ffffff", 0.5); star(g, cx, cy, 22, "#c9d3e6", "#0a1030"); star(g, cx, cy, 13, "#1d3c8f"); }
    g.fillStyle = h.b; g.font = FONT(tx ? 24 : 24); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(h.name, tx ? cx : x + 160, cy + 2); g.textAlign = "left"; g.textBaseline = "alphabetic";
    for (let yy = y + 4; yy < y + hh; yy += 3) R(g, x, yy, w, 1, "rgba(0,0,0,.14)");
  });
  glow(c, x + w / 2, y + hh + 6, 120, h.a, 0.18);
}
/** A stadium from the field: looking down it at the far stand. */
export function stadium(c, t, { midfield = false, scroll = 0, endzone = false, team = "dallas" } = {}) {
  const h = HOUSE[team] || HOUSE.dallas, tm = HOUSE[team] ? team : "dallas";
  lay(c, "bowl" + tm, W, 176, (x) => bowl(x, tm));
  board(c, t, tm);
  venueGrass(c, scroll, h.turf, 40);
  // the apron outside the lines, and the people along it
  ground(c, -78, 640, 268 - 107, 268 - 91, alpha(h.dark, 0.5), VENUE); ground(c, -78, 640, 268 + 91, 268 + 107, alpha(h.dark, 0.5), VENUE);
  for (let i = 0; i < 26; i++) for (const side of [-1, 1]) { const p = proj(170 + i * 17 + rnd(i + side) * 8, 268 + side * (97 + rnd(i * 3 + side) * 6), 0, VENUE), s = p.s * 7; R(c, p.x - s * 0.3, p.y - s, s * 0.6, s, i % 4 ? h.a : "#f4f1e6"); disc(c, p.x, p.y - s * 1.2, s * 0.3, i % 3 ? h.b : SKINS[i % 4]); }
  ground(c, -78, 640, 180.5, 184.5, "#fff", VENUE); ground(c, -78, 640, 351.5, 355.5, "#fff", VENUE);
  yardLines(c, scroll, VENUE, "rgba(255,255,255,.9)");
  const off = ((scroll % 20) + 20) % 20; for (let x = -off; x < 560; x += 20) if (x > -60) for (const y of [236, 300]) ground(c, x - 0.7, x + 0.7, y - 5, y + 5, "rgba(255,255,255,.8)", VENUE);
  // the far end zone and the post behind it
  ground(c, 560, 640, 184.5, 351.5, h.zone, VENUE); ground(c, 558.4, 561.6, 183, 353, "#fff", VENUE); ground(c, 638, 641, 183, 353, "#fff", VENUE);
  goalPost(c, 320, proj(644, 268, 0, VENUE).y, 0.85);
  // the near end zone, where the camera stands: the name across it in letters as tall as a person
  if (scroll < 60) {
    ground(c, -78, 100 - scroll, 184.5, 351.5, h.zone, VENUE); ground(c, 98.4 - scroll, 101.6 - scroll, 183, 353, "#fff", VENUE);
    onGround(c, 46 - scroll, 268, VENUE, (g) => { g.fillStyle = h.ink; g.font = FONT(24); g.textAlign = "center"; g.textBaseline = "middle"; g.scale(h.name.length > 5 ? 0.86 : 1.05, 1.5); g.fillText(h.name, 0, 0); g.textAlign = "left"; g.textBaseline = "alphabetic"; });
  }
  if (midfield) onGround(c, 250, 268, VENUE, (g) => {
    if (tm === "dallas") { g.fillStyle = "rgba(201,211,230,.9)"; g.beginPath(); g.arc(0, 0, 44, 0, TAU); g.fill(); star(g, 0, 0, 36, "#1d3c8f", "#0a1030"); }
    else { g.fillStyle = h.a; g.font = FONT(32); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("TEXAS", 0, 0); g.textAlign = "left"; g.textBaseline = "alphabetic"; }
  });
  // camera flashes in the stands
  for (let i = 0; i < 7; i++) { const f = Math.floor(t * 7 + i * 3.7), x = rnd(f + i * 11) * W, y = 70 + rnd(f * 3 + i) * 86; if ((t * 7 + i * 3.7) % 1 < 0.3) { glow(c, x, y, 9, "#ffffff", 0.9); disc(c, x, y, 1.6, "#fff"); } }
  vignette(c, tm === "texas" ? 0.42 : 0.36);
}
/** Stadium lights as beams, drawn over a night scene. */
export function beams(c, t) {
  c.save(); c.globalCompositeOperation = "lighter";
  [[70, 1], [570, -1], [210, 1], [430, -1]].forEach(([x, d], i) => { const sw = Math.sin(t * 0.5 + i * 2) * 60, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(255,244,190,.16)"); g.addColorStop(1, "rgba(255,244,190,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(x - 6, 30); c.lineTo(x + 6, 30); c.lineTo(x + d * 200 + sw + 110, H); c.lineTo(x + d * 200 + sw - 110, H); c.fill(); });
  c.restore();
}

// ─── the field during a play, from behind the offense ───
// Andrew's two pictures of a 1998 football game: dark grainy turf filling
// the screen, yard lines running across it, hash marks drawing in toward the
// far end, numbers painted on their sides, and every player throwing a long
// shadow. The park's field is the same view in grass, chalk, cones and leaves.
const TURF = { park: ["#6aa544", "#4f8c36"], dallas: ["#1f7a3c", "#1a6c35"], texas: ["#2a8443", "#23743a"] };
function grain(c, park) {
  for (let i = 0; i < 2600; i++) { const y = rnd(i + 3) * H, s = 0.6 + y / H; c.fillStyle = i % 2 ? "rgba(0,0,0,.09)" : "rgba(255,255,255,.07)"; c.fillRect(rnd(i) * W, y, (park ? 1 : 2) * s, (park ? 3 : 1) * s); }
}
/** Across the top of the play view: what stands behind the far end line. */
function farEdge(c, where, y) {
  if (where === "park") {
    R(c, 0, 0, W, y, "#2a1c16");
    for (let i = 0; i < 30; i++) R(c, i * 23 + rnd(i) * 10, 0, 5 + rnd(i + 4) * 5, y, "#1c120d");
    for (let i = 0; i < 22; i++) canopy(c, i * 31 - 4, -8 + rnd(i) * 10, 22 + rnd(i + 3) * 8, AUTUMN[(i * 3) % 8], 40 + i * 7);
    R(c, 0, y - 12, W, 12, "#15161c"); for (let x = 2; x < W; x += 12) R(c, x, y - 12, 1, 12, "#2c2e38"); R(c, 0, y - 12, W, 2, "#2c2e38");
    for (let i = 0; i < 300; i++) ell(c, rnd(i + 900) * W, y + rnd(i + 950) * 8 - 1, 3, 1.4, LEAF[i % 6], rnd(i) * 3);
  } else {
    const h = HOUSE[where]; R(c, 0, 0, W, y, h.dark);
    for (let row = 0; row < 8; row++) for (let i = 0; i < 132; i++) { const k = row * 131 + i, x = i * 4.9 + (row % 2) * 2.4, yy = y - 16 - row * 6.4; if (yy < -6 || i % 17 === 0) continue; const sh = 0.1 + row * 0.07; c.fillStyle = mix(h.seats[Math.floor(rnd(k + 1) * 8)], "#070a1c", sh); c.fillRect(x, yy, 4, 5); c.fillStyle = mix(SKINS[Math.floor(rnd(k + 7) * 4)], "#070a1c", sh); c.fillRect(x + 1, yy - 2.6, 2.2, 2.4); }
    R(c, 0, y - 12, W, 12, h.wall); R(c, 0, y - 12, W, 1.6, "#fff"); for (let x = 30; x < W; x += 80) R(c, x, y - 12, 1, 12, "rgba(0,0,0,.3)");
  }
}
export function turf(c, t, { where = "park", scroll = 0, endzone = false, near = "" } = {}) {
  const pk = where === "park", h = HOUSE[where], cols = TURF[where] || TURF.park, edge = proj(646, 268).y;
  R(c, 0, 0, W, H, cols[0]);
  const off = ((scroll % 160) + 160) % 160;
  for (let x = -160 - off; x < 720; x += 160) ground(c, Math.max(-360, x), Math.max(-360, x + 80), -200, 740, cols[1]);
  // outside the lines
  if (!pk) { ground(c, -360, 646, -200, 171, darken(h.zone, 0.45)); ground(c, -360, 646, 365, 740, darken(h.zone, 0.45)); ground(c, -360, 646, 171, 183, "#f4f1e6"); ground(c, -360, 646, 353, 365, "#f4f1e6"); }
  else { ground(c, -360, 646, -200, 176, "rgba(40,60,20,.25)"); ground(c, -360, 646, 360, 740, "rgba(40,60,20,.25)"); }
  const chalk = pk ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.92)";
  if (near) { ground(c, -360, 96, 183, 353, near); ground(c, 94, 98, 183, 353, "#fff"); }
  if (endzone || !pk) {
    ground(c, 560, 640, 183, 353, pk ? "rgba(226,98,42,.55)" : h.zone);
    if (!pk) onGround(c, 600, 268, PLAY, (g) => { g.fillStyle = h.ink; g.font = FONT(16); g.textAlign = "center"; g.textBaseline = "middle"; g.scale(1.2, 1.5); g.fillText(h.name, 0, 1); g.textAlign = "left"; g.textBaseline = "alphabetic"; });
  }
  if (pk) { ground(c, -360, 640, 181, 184, chalk); ground(c, -360, 640, 352, 355, chalk); }
  ground(c, 558, 562, 183, 353, "#fff"); ground(c, 638, 642, 183, 353, chalk);
  const o80 = ((scroll % 80) + 80) % 80;
  for (let x = -80 - o80; x < 560; x += 80) {
    if (x > -330) ground(c, x - 1.5, x + 1.5, 183, 353, chalk);
    if (pk) { for (const y of [183, 353]) if (x > -300) { const p = proj(x, y); shape(c, "#f07a1c", poly([[p.x - 4 * p.s, p.y], [p.x + 4 * p.s, p.y], [p.x, p.y - 12 * p.s]]), 0.8); R(c, p.x - 1.6 * p.s, p.y - 8 * p.s, 3.2 * p.s, 1.6 * p.s, "#fff"); } continue; }
    for (let n = 1; n < 4; n++) { const hx = x + n * 20; if (hx < -330 || hx > 556) continue; for (const y of [240, 296]) ground(c, hx - 0.8, hx + 0.8, y - 5, y + 5, chalk); for (const y of [183, 345]) ground(c, hx - 0.8, hx + 0.8, y, y + 8, chalk); }
    const idx = Math.round((x + scroll) / 80), n = [10, 20, 30, 40, 50, 40, 30, 20][((idx % 8) + 8) % 8];
    if (x > -300) for (const side of [-1, 1]) onGround(c, x, 268 + side * 62, PLAY, (g) => { g.rotate(side * Math.PI / 2); g.fillStyle = "rgba(255,255,255,.82)"; g.font = FONT(8); g.textAlign = "center"; g.textBaseline = "middle"; g.scale(0.8, 1.1); g.fillText(String(n), 0, 0); g.textAlign = "left"; g.textBaseline = "alphabetic"; });
  }
  if (where === "dallas") onGround(c, 320 - (scroll % 640), 268, PLAY, (g) => { g.fillStyle = "rgba(201,211,230,.92)"; g.beginPath(); g.arc(0, 0, 17, 0, TAU); g.fill(); star(g, 0, 0, 14, "#1d3c8f", "#0a1030"); });
  if (where === "texas") onGround(c, 320 - (scroll % 640), 268, PLAY, (g) => { g.fillStyle = h.a; g.font = FONT(8); g.textAlign = "center"; g.textBaseline = "middle"; g.scale(1.2, 1.4); g.fillText("TEXAS", 0, 0); g.textAlign = "left"; g.textBaseline = "alphabetic"; });
  if (pk) for (let i = 0; i < 90; i++) { const wx = (((rnd(i + 40) * 900 - scroll) % 900) + 900) % 900 - 240, wy = 120 + rnd(i + 70) * 300, p = proj(wx, wy); leaf(c, p.x, p.y, 2.4 + p.s * 2.2, LEAF[i % 6], rnd(i) * 6, 0.55); }
  lay(c, "grain" + (pk ? 1 : 0), W, H, (x) => grain(x, pk));
  lay(c, "far" + where, W, Math.ceil(edge) + 10, (x) => farEdge(x, where, edge));
  const gp = proj(644, 268); goalPost(c, gp.x, gp.y + 1, 1.25);
  vignette(c, 0.3);
}

// ─── the locker room ───
function lockerRoom(c) {
  c.fillStyle = vgrad(c, 0, 230, [[0, "#141a34"], [1, "#1f2748"]]); c.fillRect(0, 0, W, 230);
  B(c, -2, 0, W + 4, 26, "#0f1430", "#1b2452"); for (let i = 0; i < 9; i++) star(c, 40 + i * 70, 13, 6, "#c9d3e6");
  for (let i = 0; i < 8; i++) {
    const x = 12 + i * 78, wood = "#9a6a3c";
    B(c, x, 30, 68, 198, wood, "#b98550", "#6e4826", 2); B(c, x + 5, 36, 58, 150, "#3a2616", null, null, 1);
    R(c, x + 5, 62, 58, 4, wood); R(c, x + 5, 66, 58, 2, "#6e4826");
    // a helmet on the shelf
    disc(c, x + 34, 51, 10.5, INK); disc(c, x + 34, 51, 9.5, "#c9d3e6"); disc(c, x + 30, 47, 3.5, "#f4f7fc"); R(c, x + 33, 41.5, 2, 12, "#1d3c8f"); star(c, x + 28, 52, 3.6, "#1d3c8f"); R(c, x + 38, 51, 9, 2, "#8793bd"); R(c, x + 38, 55, 8, 2, "#8793bd"); R(c, x + 45, 50, 2, 8, "#8793bd");
    // a jersey on a hanger
    R(c, x + 12, 76, 44, 2, "#c9d3e6"); const j = i % 2 ? "#f4f1e6" : "#1b2a6b", n = i % 2 ? "#1b2a6b" : "#f4f1e6";
    shape(c, j, poly([[x + 20, 78], [x + 48, 78], [x + 60, 90], [x + 54, 100], [x + 50, 96], [x + 50, 140], [x + 18, 140], [x + 18, 96], [x + 14, 100], [x + 8, 90]]), 1);
    R(c, x + 18, 132, 32, 3, n); R(c, x + 9, 91, 8, 2.4, n); R(c, x + 51, 91, 8, 2.4, n);
    R(c, x + 27, 100, 5, 20, n); R(c, x + 36, 100, 5, 20, n); R(c, x + 27, 100, 14, 4, n); R(c, x + 27, 116, 14, 4, n);
    B(c, x + 8, 150, 52, 30, "#1b2a6b", "#2a3f8f", "#131c48", 2); R(c, x + 14, 156, 40, 2, "#c9d3e6");
    B(c, x + 14, 190, 40, 8, "#1d3c8f", null, null, 1); B(c, x, 206, 68, 22, "#b98550", "#d0a068", "#6e4826", 2);
  }
  // the carpet, with the star in the middle of it
  c.fillStyle = vgrad(c, 228, H, [[0, "#16224f"], [1, "#22347a"]]); c.fillRect(0, 228, W, H - 228);
  for (let i = 0; i < 900; i++) R(c, rnd(i) * W, 228 + rnd(i + 5) * 132, 2, 1, i % 2 ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.08)");
  shape(c, "#c9d3e6", oval(320, 300, 150, 40), 1.4); ell(c, 320, 300, 140, 35, "#1b2a6b"); c.save(); c.translate(320, 300); c.scale(1, 0.28); star(c, 0, 0, 112, "#c9d3e6"); star(c, 0, 0, 86, "#1d3c8f"); c.restore();
  c.save(); c.globalCompositeOperation = "lighter"; [130, 320, 510].forEach(x => { const g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, "rgba(255,240,200,.2)"); g.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(x - 30, 26); c.lineTo(x + 30, 26); c.lineTo(x + 130, 330); c.lineTo(x - 130, 330); c.fill(); R(c, x - 34, 22, 68, 5, "rgba(255,248,220,.9)"); }); c.restore();
  vignette(c, 0.45);
}
export function locker(c, t) { lay(c, "locker", W, H, lockerRoom); }

// ─── the sky and the jet ───
export function sky(c, t) {
  lay(c, "skyBack", W, H, (x) => { x.fillStyle = vgrad(x, 0, H, [[0, "#1f5fb8"], [0.6, "#6fb0ea"], [1, "#d8f0ff"]]); x.fillRect(0, 0, W, H); glow(x, 540, 60, 220, "#fff8d8", 0.7); disc(x, 540, 60, 22, "#fffbe6"); });
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 5; i++) { const n = layer * 5 + i, sp = 14 + layer * 26, s = 0.6 + layer * 0.5 + rnd(n + 8) * 0.3, x = ((rnd(n) * 900 - t * sp) % 900 + 900) % 900 - 130, y = 60 + rnd(n + 4) * 250 + layer * 20; cloud(c, x, y, s, layer === 2 ? "#ffffff" : mix("#ffffff", "#a8cdf0", 0.35 - layer * 0.15), layer === 2 ? "#a9c2e2" : "#8fb4de"); }
}
export function plane(c, x, y) {
  c.save(); c.translate(x, y);
  // the far wing and the tail
  shape(c, "#aab6c8", poly([[70, 12], [96, 12], [58, -6], [44, -6]]), 1.2);
  shape(c, "#1d3c8f", poly([[-6, 6], [-18, -34], [4, -34], [30, 4]]), 1.4); star(c, 2, -14, 8, "#c9d3e6"); shape(c, "#dfe6ee", poly([[-28, -36], [14, -36], [20, -31], [-22, -31]]), 1.2);
  // the body
  shape(c, "#f4f7fb", (g) => { g.moveTo(-14, 8); g.quadraticCurveTo(40, -6, 122, -2); g.bezierCurveTo(150, 0, 170, 8, 178, 16); g.bezierCurveTo(166, 26, 140, 30, 110, 30); g.lineTo(20, 28); g.quadraticCurveTo(-4, 22, -14, 8); }, 1.5);
  inside(c, (g) => { g.moveTo(-14, 8); g.quadraticCurveTo(40, -6, 122, -2); g.bezierCurveTo(150, 0, 170, 8, 178, 16); g.bezierCurveTo(166, 26, 140, 30, 110, 30); g.lineTo(20, 28); g.quadraticCurveTo(-4, 22, -14, 8); }, (g) => { R(g, -20, 19, 210, 14, "#c3cedd"); R(g, -20, 15, 210, 3.4, "#1d3c8f"); R(g, -20, 19.4, 210, 1.2, "#8793bd"); ell(g, 70, 0, 80, 4, "rgba(255,255,255,.9)"); });
  shape(c, "#27325c", poly([[140, 3], [158, 7], [166, 13], [144, 12]]), 1); R(c, 151, 5, 1.2, 8, "#f4f7fb");
  for (let i = 0; i < 7; i++) { shape(c, "#7fd3ff", box(30 + i * 15, 4, 8, 8, 4), 1); R(c, 32 + i * 15, 5.4, 2, 3, "rgba(255,255,255,.8)"); }
  c.strokeStyle = "#8793bd"; c.lineWidth = 1; c.strokeRect(118, 2, 11, 22);
  // the engine at the back, and the near wing
  shape(c, "#dfe6ee", box(8, -6, 40, 15, 7), 1.4); ell(c, 46, 1.5, 4, 6.4, "#27325c"); R(c, 12, -2, 26, 2, "#fff"); R(c, 10, 5, 34, 2, "#aab6c8");
  shape(c, "#dfe6ee", poly([[64, 22], [108, 24], [58, 50], [30, 50]]), 1.5); shape(c, "#1d3c8f", poly([[30, 50], [42, 50], [36, 38]]), 1.2); R(c, 52, 34, 32, 2, "#aab6c8");
  c.restore();
}
/** The inside of Jerry's jet: windows with the sky going by, wood, leather. */
export function cabin(c, t, scroll = 0) {
  lay(c, "cabinWall", W, H, (x) => {
    x.fillStyle = vgrad(x, 0, 250, [[0, "#cdb992"], [0.14, "#f1e6cc"], [1, "#e2d2ae"]]); x.fillRect(0, 0, W, 250);
    R(x, 0, 0, W, 30, "#b79f78"); R(x, 0, 30, W, 3, "#fff7dc"); for (let i = 0; i < 8; i++) { ell(x, 40 + i * 80, 30, 12, 3, "#fffbe8"); glow(x, 40 + i * 80, 34, 40, "#fff3c0", 0.4); }
    x.fillStyle = vgrad(x, 186, 206, [[0, "#a8703c"], [0.5, "#7a4a22"], [1, "#5a3416"]]); x.fillRect(0, 186, W, 20); R(x, 0, 188, W, 2, "rgba(255,230,180,.5)");
    for (let i = 0; i < 60; i++) R(x, rnd(i) * W, 190 + rnd(i + 3) * 14, 20 + rnd(i + 5) * 30, 1, "rgba(60,30,10,.35)");
    R(x, 0, 206, W, 44, "#d6c49c"); R(x, 0, 250, W, 110, "#33405f"); R(x, 0, 250, W, 5, "#1f2940");
    for (let y = 262; y < H; y += 14) for (let xx = ((y / 14) & 1) * 14; xx < W; xx += 28) { x.fillStyle = "rgba(201,211,230,.14)"; x.beginPath(); x.moveTo(xx, y); x.lineTo(xx + 7, y - 5); x.lineTo(xx + 14, y); x.lineTo(xx + 7, y + 5); x.fill(); }
  });
  for (let i = -1; i < 8; i++) {
    const x = i * 150 - (((scroll % 150) + 150) % 150) + 40;
    shape(c, "#f6efdc", oval(x + 40, 112, 40, 52), 1.4); shape(c, "#8a8f9c", oval(x + 40, 112, 33, 45), 1);
    inside(c, oval(x + 40, 112, 31, 43), (g) => { g.fillStyle = vgrad(g, 66, 158, [[0, "#2f6fc4"], [1, "#bfe2ff"]]); g.fillRect(x, 60, 90, 110); for (let n = 0; n < 2; n++) cloud(g, x - 30 + ((t * (50 + n * 30) + i * 37 + n * 60) % 150), 100 + n * 30 + (i % 3) * 8, 0.5, "#fff", "#a9c2e2"); R(g, x, 60, 90, 22, "#efe3c8"); R(g, x, 80, 90, 2, "#b79f78"); });
    c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 2; c.beginPath(); c.arc(x + 40, 112, 36, 3.5, 4.4); c.stroke();
  }
}
export function seat(c, x, y) {
  const a = "#e3b877", l = "#f6d9a6", d = "#b0803f";
  ell(c, x, y + 8, 66, 8, "rgba(0,0,0,.3)");
  shape(c, a, (g) => { g.moveTo(x - 44, y - 30); g.quadraticCurveTo(x - 52, y - 150, x - 30, y - 156); g.lineTo(x + 30, y - 156); g.quadraticCurveTo(x + 52, y - 150, x + 44, y - 30); g.closePath(); }, 1.6);
  inside(c, (g) => g.rect(x - 52, y - 160, 104, 132), (g) => { R(g, x - 40, y - 150, 14, 120, "rgba(255,255,255,.16)"); for (const dx of [-16, 16]) R(g, x + dx - 0.6, y - 122, 1.2, 92, d); R(g, x + 26, y - 150, 20, 120, "rgba(0,0,0,.1)"); });
  shape(c, l, box(x - 26, y - 152, 52, 28, 10), 1.4); R(c, x - 18, y - 132, 36, 1.2, d);
  shape(c, a, box(x - 56, y - 50, 112, 56, 14), 1.6); R(c, x - 46, y - 44, 92, 6, "rgba(255,255,255,.22)"); R(c, x - 50, y - 6, 100, 8, "rgba(0,0,0,.14)");
  for (const dx of [-62, 44]) { shape(c, d, box(x + dx, y - 78, 18, 66, 8), 1.4); shape(c, "#7a4a22", box(x + dx - 1, y - 82, 20, 9, 4), 1.2); R(c, x + dx + 2, y - 80, 14, 2, "rgba(255,230,180,.6)"); }
}

// ─── two single shots ───
/** The Dallas stadium from the air at dusk: a silver dome on a plain of lights. */
export function dome(c, t) {
  lay(c, "dome", W, H, (x) => {
    x.fillStyle = vgrad(x, 0, 110, [[0, "#3a3458"], [0.7, "#7a6a90"], [1, "#b08aa0"]]); x.fillRect(0, 0, W, 110);
    x.fillStyle = vgrad(x, 100, H, [[0, "#3a4250"], [1, "#565a66"]]); x.fillRect(0, 100, W, H - 100);
    for (let i = 0; i < 46; i++) { const y = 104 + rnd(i) * 70, s = (y - 90) / 60; ell(x, rnd(i + 7) * W, y, 20 * s + 8, 3 * s + 1, i % 3 ? "#26343a" : "#2f3d34"); }
    for (let i = 0; i < 220; i++) { const y = 102 + rnd(i + 20) * 120; R(x, rnd(i + 30) * W, y, 1.4, 1.4, i % 4 ? "rgba(255,214,150,.8)" : "rgba(255,255,255,.8)"); }
    // the lots around it
    x.fillStyle = "#6a6470"; x.beginPath(); x.ellipse(320, 262, 330, 96, 0, 0, TAU); x.fill();
    x.strokeStyle = "rgba(255,255,255,.2)"; x.lineWidth = 1; for (let i = 0; i < 26; i++) { x.beginPath(); x.ellipse(320, 262, 210 + i * 6, 62 + i * 2, 0, 0.1, Math.PI - 0.1); x.stroke(); }
    for (let i = 0; i < 26; i++) { const a = 0.2 + i * 0.105, px = 320 + Math.cos(a) * 250, py = 262 + Math.sin(a) * 74; R(x, px, py - 8, 1, 8, "#c9d3e6"); glow(x, px, py - 8, 8, "#fff3c0", 0.8); }
    // the glass wall, lit from inside
    shape(x, "#9fb4c8", (g) => { g.moveTo(130, 190); g.bezierCurveTo(130, 262, 510, 262, 510, 190); g.lineTo(510, 170); g.lineTo(130, 170); g.closePath(); }, 1.5);
    inside(x, (g) => { g.moveTo(130, 190); g.bezierCurveTo(130, 262, 510, 262, 510, 190); g.lineTo(510, 170); g.lineTo(130, 170); g.closePath(); }, (g) => { g.fillStyle = vgrad(g, 170, 250, [[0, "#6f8aa8"], [0.5, "#cfe0ee"], [1, "#8ea6bc"]]); g.fillRect(120, 160, 400, 100); for (let i = 0; i < 60; i++) R(g, 130 + i * 6.4, 170, 1, 80, "rgba(40,60,90,.35)"); for (let i = 0; i < 20; i++) glow(g, 150 + i * 18, 226 - Math.sin(i / 19 * Math.PI) * -18, 10, "#fff6d0", 0.85); R(g, 120, 198, 400, 3, "rgba(30,40,70,.5)"); });
    // the roof: a low silver dome with the panel that opens along its spine
    shape(x, "#b9c2d2", (g) => { g.moveTo(112, 186); g.bezierCurveTo(140, 96, 500, 96, 528, 186); g.bezierCurveTo(440, 212, 200, 212, 112, 186); }, 1.6);
    inside(x, (g) => { g.moveTo(112, 186); g.bezierCurveTo(140, 96, 500, 96, 528, 186); g.bezierCurveTo(440, 212, 200, 212, 112, 186); }, (g) => { g.fillStyle = vgrad(g, 110, 210, [[0, "#e6ebf3"], [1, "#8f9bb2"]]); g.fillRect(100, 100, 440, 120); ell(g, 250, 132, 120, 16, "rgba(255,255,255,.45)", -0.08); });
    shape(x, "#eef2f8", poly([[236, 126], [404, 126], [428, 150], [212, 150]]), 1.2); R(x, 319, 126, 1.4, 24, "#8f9bb2");
    // the arches that carry it, coming down at each end
    x.strokeStyle = "#dfe6ee"; x.lineWidth = 3; [[112, 186, 70, 214], [528, 186, 570, 214]].forEach(([x0, y0, x1, y1]) => { x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); for (let n = 0; n < 5; n++) { x.lineWidth = 1; x.beginPath(); x.moveTo(x0 + (x1 - x0) * n / 5, y0 + (y1 - y0) * n / 5); x.lineTo(x0 + (x1 - x0) * (n + 1) / 5, y0 + 8 + (y1 - y0) * n / 5); x.stroke(); } x.lineWidth = 3; });
    x.fillStyle = vgrad(x, 0, H, [[0, "rgba(60,40,110,.22)"], [1, "rgba(20,20,60,.3)"]]); x.fillRect(0, 0, W, H);
  });
  for (let i = 0; i < 12; i++) { const p = ((t * 0.08 + i / 12) % 1), a = 0.25 + p * 2.6; R(c, 320 + Math.cos(a) * 292, 262 + Math.sin(a) * 86, 3, 1.6, "#fff6d0"); R(c, 320 + Math.cos(a + 0.02) * 292, 262 + Math.sin(a + 0.02) * 86, 1.6, 1.6, "#ff5a3c"); }
  c.fillStyle = "#f4f7fb"; c.font = FONT(16); c.textAlign = "center"; c.save(); c.translate(320, 166); c.transform(1, 0, -0.3, 0.55, 0, 0); c.shadowColor = "#fff"; c.shadowBlur = 5; c.fillText("DALLAS", 0, 0); c.restore(); c.textAlign = "left";
  vignette(c, 0.45);
}
/** A football lying in the leaves, the park out of focus behind it. */
export function leafBall(c, t) {
  lay(c, "leafBall", W, H, (x) => {
    x.fillStyle = vgrad(x, 0, 190, [[0, "#c9d6de"], [1, "#e9e2c8"]]); x.fillRect(0, 0, W, 190);
    x.filter = "blur(7px)";
    [[60, 60, 80, "#e0a030"], [200, 40, 70, "#c9601c"], [420, 70, 90, "#c9291c"], [560, 50, 80, "#d9a02a"], [320, 30, 60, "#9aa03a"], [640, 110, 60, "#7a9a3a"], [0, 120, 60, "#7a9a3a"]].forEach(([bx, by, r, col]) => disc(x, bx, by, r, col));
    [[90, 26], [214, 18], [300, 12], [560, 24], [610, 16]].forEach(([tx, w]) => R(x, tx, -10, w, 190, "#1c1410"));
    R(x, -20, 150, 700, 36, "#4f8a3a");
    x.filter = "none";
    x.fillStyle = vgrad(x, 170, H, [[0, "#a8551c"], [1, "#5a2a12"]]); x.fillRect(0, 172, W, 190);
    for (let i = 0; i < 520; i++) { const y = 176 + Math.pow(rnd(i + 3), 0.8) * 190, s = (y - 150) / 26; leaf(x, rnd(i) * 680 - 20, y, 3 + s * 2.6, [...LEAF, "#b8352a", "#f2d24a", "#8a3a22"][i % 9], rnd(i + 9) * 6, 0.62); }
  });
  // the ball
  c.save(); c.translate(360, 262); c.rotate(-0.07);
  ell(c, 6, 34, 150, 16, "rgba(30,10,5,.4)");
  shape(c, "#6e2a26", (g) => { g.moveTo(-150, 6); g.bezierCurveTo(-110, -70, 110, -70, 150, 6); g.bezierCurveTo(110, 62, -110, 62, -150, 6); }, 2);
  inside(c, (g) => { g.moveTo(-150, 6); g.bezierCurveTo(-110, -70, 110, -70, 150, 6); g.bezierCurveTo(110, 62, -110, 62, -150, 6); }, (g) => {
    ell(g, -20, -30, 120, 26, "rgba(255,200,180,.16)"); ell(g, 0, 60, 160, 30, "rgba(20,0,0,.35)");
    for (let i = 0; i < 900; i++) R(g, -150 + rnd(i) * 300, -50 + rnd(i + 2) * 100, 1.2, 1.2, i % 2 ? "rgba(0,0,0,.1)" : "rgba(255,255,255,.05)");
    g.strokeStyle = "#f4efe2"; g.lineWidth = 9; g.beginPath(); g.moveTo(112, -44); g.quadraticCurveTo(128, 6, 108, 50); g.stroke();
  });
  line(c, [[-36, -46], [36, -47]], 4, "#f4efe2"); for (let i = -3; i <= 3; i++) line(c, [[i * 10, -52], [i * 10 + 1, -41]], 3.4, "#f4efe2");
  c.restore();
  for (let i = 0; i < 26; i++) { const y = 300 + rnd(i + 3) * 70, s = (y - 150) / 26; leaf(c, rnd(i + 60) * 680 - 20, y, 5 + s * 3, LEAF[i % 6], rnd(i + 9) * 6, 0.62); }
  vignette(c, 0.5);
}

// ─── food and drink, drawn on a 32 by 32 square ───
export function food(c, kind) {
  const P = 0.7;
  if (kind === "potato") { ell(c, 16, 25, 14, 4.5, "#aeb6c4"); shape(c, "#eef2f8", oval(16, 23, 14, 5), P); shape(c, "#fff6d8", (g) => { g.moveTo(4, 20); g.bezierCurveTo(2, 8, 20, 4, 19, 19); g.closePath(); }, P); ell(c, 9, 12, 3.4, 2, "#fff"); shape(c, "#f6c945", box(9.5, 7.6, 5, 3.4, 1), P); shape(c, "#f6a528", oval(22, 17, 7, 5), P); [[18, 15], [22, 18], [24, 14], [20, 19], [25, 17]].forEach(([x, y]) => R(c, x, y, 2.6, 1.8, "#fbd76a")); }
  else if (kind === "turkey") { shape(c, "#a8551c", (g) => { g.moveTo(3, 15); g.bezierCurveTo(2, 2, 24, 2, 23, 15); g.bezierCurveTo(22, 25, 4, 25, 3, 15); }, P); ell(c, 10, 10, 6, 4, "#c97a35"); ell(c, 9, 9, 2.4, 1.4, "#e8b070"); ell(c, 14, 20, 8, 3, "rgba(60,20,0,.25)"); shape(c, "#f1e3c6", box(20, 18, 8, 3.6, 1.5), P); shape(c, "#fff", oval(28.4, 18.2, 2.4, 2.4), P); shape(c, "#fff", oval(28.4, 21.8, 2.4, 2.4), P); }
  else if (kind === "cranberry") { B(c, 9, 4, 14, 24, "#b01e3a", "#d43a58", "#7a1228", 1.5); R(c, 9, 4.6, 14, 3, "#dfe6ee"); R(c, 9, 24.4, 14, 3, "#c9d3e6"); R(c, 9, 11, 14, 1, "#7a1228"); R(c, 9, 17, 14, 1, "#7a1228"); R(c, 12, 12.4, 8, 4, "#fff"); R(c, 11, 5, 2.4, 22, "rgba(255,255,255,.3)"); }
  else if (kind === "pie") { shape(c, "#d9772a", poly([[3, 23], [28, 23], [18, 8]]), P); c.fillStyle = "#f08a3a"; c.beginPath(); c.moveTo(8, 21); c.lineTo(18, 11); c.lineTo(17, 21); c.fill(); shape(c, "#d9b07a", box(2, 22, 27, 4.6, 2), P); for (let x = 5; x < 27; x += 4) R(c, x, 23, 1, 3, "#a87c44"); shape(c, "#fff", (g) => { g.moveTo(13, 9); g.bezierCurveTo(11, 3, 16, 1, 18, 4); g.bezierCurveTo(23, 3, 23, 9, 19, 10); g.closePath(); }, P); }
  else if (kind === "water" || kind === "sparkling") { shape(c, "#eaf7ff", poly([[9, 5], [23, 5], [21, 28], [11, 28]]), P); c.fillStyle = kind === "water" ? "#6fc3f5" : "#aee6ff"; c.beginPath(); c.moveTo(9.6, 11); c.lineTo(22.4, 11); c.lineTo(21, 27.4); c.lineTo(11, 27.4); c.fill(); R(c, 11.4, 7, 1.8, 19, "rgba(255,255,255,.75)"); if (kind === "sparkling") { [[14, 16], [18, 20], [15, 24], [19, 14], [16.4, 12]].forEach(([x, y]) => disc(c, x, y, 1.1, "#fff")); shape(c, "#7ad04a", oval(22, 6, 4.4, 2.6, -0.4), P); R(c, 20, 5.4, 4, 0.9, "#d6f5a8"); } }
  else if (kind === "coffee") { for (let i = 0; i < 3; i++) { const x = 2 + i * 10; shape(c, "#fff", poly([[x, 14], [x + 8, 14], [x + 7, 26], [x + 1, 26]]), P); R(c, x + 0.6, 14.6, 6.8, 2.6, "#5a3a1e"); R(c, x + 1.4, 21, 5.2, 2, "#c9402a"); c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + 4, 12); c.quadraticCurveTo(x + 1, 9, x + 4, 5 - (i % 2) * 2); c.stroke(); } }
  else if (kind === "champagne") { shape(c, "#f6e7a8", poly([[9, 3], [23, 3], [20, 18], [12, 18]]), P); R(c, 11, 4, 2, 12, "rgba(255,255,255,.7)"); shape(c, "#eef2f8", box(15, 18, 2, 8, 0), P); shape(c, "#eef2f8", box(10.5, 26, 11, 2.4, 1), P); [[14, 9], [17, 12], [15, 14], [26, 4], [28, 8], [18, 6]].forEach(([x, y]) => disc(c, x, y, 1.1, "#fff")); }
}
export const FOOD_OF = { breakfast: { best: "potato", good: "turkey", bad: "cranberry", silly: "pie" }, jet: { best: "water", good: "sparkling", bad: "coffee", over: "champagne" } };
