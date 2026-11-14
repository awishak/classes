// Turkey Bowl's pictures, second pass: a 640 by 360 canvas, outlined and
// shaded figures, layered backdrops. Everything is drawn in code; there are
// no image files except a player's own photograph, which becomes their face.
//
// Andrew, 2026-11-14, on the first pass: "this is a little too 8 bit. I
// actually want it to be better graphics ... let's do 16 bit graphics." And:
// "I want the animations to be ridiculous. I need more ridiculousness."
// Earlier the same day: "at the park, leaves and stuff like that. I want it
// to look like Thanksgiving ... no logo, but just make it a blue star on
// silver background. And make it look like Jerry Jones, please." The star is
// a plain five-point star; nothing here is an official mark.

export const W = 640, H = 360;
const INK = "#1c1626";
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
/** A box with an ink outline, a lit top edge and a shaded bottom edge. */
const B = (c, x, y, w, h, col, lit, dark) => { R(c, x - 1, y - 1, w + 2, h + 2, INK); R(c, x, y, w, h, col); if (lit) R(c, x, y, w, Math.max(1, h * 0.22), lit); if (dark) R(c, x, y + h - Math.max(1, h * 0.25), w, Math.max(1, h * 0.25), dark); };
const disc = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
const ell = (c, x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
const rnd = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const grad = (c, y0, y1, stops) => { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([p, col]) => g.addColorStop(p, col)); return g; };
const mix = (a, b, t) => { const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const [x, y] = [p(a), p(b)]; return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
export const lighten = (col, t = 0.25) => mix(col, "#ffffff", t), darken = (col, t = 0.25) => mix(col, "#000000", t);

export function star(c, cx, cy, r, col, line) {
  const path = (rr0) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? rr0 * 0.42 : rr0; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); };
  if (line) { c.fillStyle = line; path(r + 2); c.fill(); }
  c.fillStyle = col; path(r); c.fill();
}

// ─── leaves ───
const LEAF = ["#e2622a", "#f0a030", "#c9402a", "#f6c945", "#a8551c", "#d98324"];
export function leaves(c, t, n = 60, ground = 330) {
  for (let i = 0; i < n; i++) {
    const speed = 22 + rnd(i) * 30, sway = 12 + rnd(i + 9) * 22;
    const y = ((t * speed + rnd(i + 3) * 900) % (ground + 40)) - 20;
    const x = ((rnd(i + 5) * (W + 80) - 40 + Math.sin(t * 1.3 + i) * sway + t * 9) % (W + 60)) - 20;
    const a = t * (1 + rnd(i + 2) * 3) + i;
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = LEAF[i % LEAF.length]; c.beginPath(); c.ellipse(0, 0, 5, 2.4, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = darken(LEAF[i % LEAF.length], 0.3); c.fillRect(-4, -0.5, 8, 1); c.restore();
  }
}
function tree(c, x, base, s, i) {
  R(c, x - 5 * s, base - 46 * s, 10 * s, 46 * s, "#4a2f1a"); R(c, x - 5 * s, base - 46 * s, 3 * s, 46 * s, "#6b4426"); R(c, x + 2 * s, base - 60 * s, 4 * s, 20 * s, "#4a2f1a");
  const a = LEAF[i % 6], b = LEAF[(i + 2) % 6];
  [[0, -78, 30, a], [-22, -62, 24, b], [22, -64, 25, a], [-8, -96, 22, b], [14, -92, 20, a], [0, -58, 22, b]].forEach(([dx, dy, r, col]) => { disc(c, x + dx * s, base + dy * s + 3, r * s, darken(col, 0.28)); disc(c, x + dx * s, base + dy * s, r * s, col); disc(c, x + (dx - 6) * s, base + (dy - 7) * s, r * s * 0.5, lighten(col, 0.22)); });
}

// ─── backdrops ───
const SKY = { dawn: [[0, "#2b2f6b"], [0.55, "#e0728a"], [1, "#fbc27a"]], day: [[0, "#5fa8e6"], [1, "#d8efff"]], gold: [[0, "#f08a4b"], [0.6, "#fbc56a"], [1, "#ffe9b0"]] };
function sunAndHills(c, t, time) {
  c.fillStyle = grad(c, 0, 190, SKY[time]); c.fillRect(0, 0, W, 190);
  const sx = time === "dawn" ? 120 : time === "gold" ? 500 : 520, sy = time === "day" ? 52 : 150;
  disc(c, sx, sy, 46, "rgba(255,240,190,.25)"); disc(c, sx, sy, 30, "#fff3c0");
  for (let i = 0; i < 5; i++) { const x = ((rnd(i) * 800 + t * (4 + i)) % 800) - 80, y = 28 + rnd(i + 3) * 70; ell(c, x, y, 44, 10, "rgba(255,255,255,.75)"); ell(c, x + 22, y - 7, 26, 9, "rgba(255,255,255,.75)"); }
  c.fillStyle = time === "dawn" ? "#6a4a7a" : "#9a7ab0"; c.beginPath(); c.moveTo(0, 190); for (let x = 0; x <= W; x += 8) c.lineTo(x, 150 + Math.sin(x * 0.012) * 18 + Math.sin(x * 0.04) * 5); c.lineTo(W, 190); c.fill();
  c.fillStyle = "#b9763a"; c.beginPath(); c.moveTo(0, 190); for (let x = 0; x <= W; x += 8) c.lineTo(x, 172 + Math.sin(x * 0.02 + 2) * 9); c.lineTo(W, 190); c.fill();
}
export function park(c, t, { time = "day", field = true, scroll = 0 } = {}) {
  sunAndHills(c, t, time);
  for (let i = 0; i < 10; i++) tree(c, ((i * 74 + 30 - scroll * 0.3) % 740 + 740) % 740 - 40, 196, 0.62 + (i % 3) * 0.1, i);
  c.fillStyle = grad(c, 186, H, [[0, "#6aa84a"], [1, "#3f7a32"]]); c.fillRect(0, 186, W, H - 186);
  for (let i = 0; i < 9; i++) if (i % 2) R(c, 0, 186 + i * 20, W, 20, "rgba(0,0,0,.06)");
  if (field) {
    c.fillStyle = "rgba(255,255,255,.7)"; R(c, 0, 198, W, 2, "rgba(255,255,255,.7)"); R(c, 0, 348, W, 2, "rgba(255,255,255,.7)");
    for (let k = -1; k < 9; k++) { const x = k * 80 - ((scroll % 80) + 80) % 80 + 80; c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(Math.round(x), 198, 2, 150); }
  }
  for (let i = 0; i < 70; i++) { const x = ((rnd(i + 40) * 700 - scroll) % 700 + 700) % 700 - 30, y = 200 + rnd(i + 70) * 150; c.save(); c.translate(x, y); c.rotate(rnd(i) * 6); ell(c, 0, 0, 4, 2, LEAF[i % 6]); c.restore(); }
}
export function kitchen(c, t) {
  R(c, 0, 0, W, H, "#3a3358"); c.fillStyle = grad(c, 0, 240, [[0, "#4a4270"], [1, "#322c4e"]]); c.fillRect(0, 0, W, 240);
  for (let x = 0; x < W; x += 40) R(c, x, 0, 1, 240, "rgba(0,0,0,.12)");
  B(c, 380, 40, 170, 120, "#f0a070"); c.fillStyle = grad(c, 40, 160, [[0, "#3b3f8f"], [0.6, "#e0728a"], [1, "#fbc27a"]]); c.fillRect(380, 40, 170, 120); disc(c, 440, 150, 22, "#fff3c0"); R(c, 462, 40, 5, 120, "#e8dcc0"); R(c, 380, 96, 170, 5, "#e8dcc0"); B(c, 372, 160, 186, 8, "#e8dcc0", "#fff", "#b9ad90");
  B(c, 70, 60, 110, 56, "#16121f"); c.fillStyle = "#ff5a3c"; c.font = "30px 'Press Start 2P', monospace"; c.fillText(Math.floor(t * 2) % 2 ? "6:30" : "6 30", 76, 104);
  B(c, 230, 110, 60, 130, "#c9d3e6", "#eef2f8", "#8793bd"); R(c, 236, 118, 48, 4, "#8793bd"); R(c, 280, 150, 4, 26, "#55607f");
  R(c, 0, 240, W, 120, "#5a3f2e"); for (let x = 0; x < W; x += 64) R(c, x, 240, 2, 120, "rgba(0,0,0,.18)");
  // The table sits high, so the food shows above the question.
  B(c, 40, 168, 300, 16, "#a0703f", "#c08a52", "#7a5230"); B(c, 60, 184, 14, 176, "#7a5230"); B(c, 306, 184, 14, 176, "#7a5230");
  [["potato", 80], ["turkey", 150], ["cranberry", 220], ["pie", 290]].forEach(([k, x], i) => { ell(c, x + 2, 168, 30, 6, "rgba(0,0,0,.25)"); ell(c, x, 165, 29, 6, "#eef2f8"); c.save(); c.translate(x - 26, 112 + Math.sin(t * 2 + i) * 2); c.scale(1.6, 1.6); food(c, k); c.restore(); if (Math.floor(t * 3 + i) % 3 === 0) R(c, x - 4 + i * 2, 104 - ((t * 20 + i * 9) % 22), 3, 8, "rgba(255,255,255,.35)"); });
}
function crowd(c, t, y0, rows, tint) {
  for (let row = 0; row < rows; row++) for (let i = 0; i < 81; i++) {
    const k = row * 81 + i, bob = Math.sin(t * 6 + k) > 0.6 ? -2 : 0, x = i * 8 + (row % 2) * 4, y = y0 + row * 13 + bob;
    const col = ["#1d3c8f", "#c9d3e6", "#2a56c6", "#8793bd", "#e8ecf5", "#16224f"][Math.floor(rnd(k + 1) * 6)];
    R(c, x, y + 5, 7, 8, tint ? darken(col, 0.2) : col); disc(c, x + 3.5, y + 3, 3, ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"][Math.floor(rnd(k + 7) * 4)]);
  }
}
export function stadium(c, t, { midfield = false, scroll = 0, endzone = false } = {}) {
  c.fillStyle = grad(c, 0, 130, [[0, "#060b22"], [1, "#16224f"]]); c.fillRect(0, 0, W, 130);
  crowd(c, t, 22, 8, false);
  B(c, 214, 4, 212, 66, "#05070f"); c.fillStyle = grad(c, 8, 66, [[0, "#1d3c8f"], [1, "#0f1e55"]]); c.fillRect(218, 8, 204, 58); star(c, 262, 37, 20, "#c9d3e6", "#0a1030"); c.fillStyle = "#e8ecf5"; c.font = "14px 'Press Start 2P', monospace"; c.fillText("DALLAS", 296, 44);
  for (const x of [26, 614]) { R(c, x - 3, 0, 6, 126, "#39406b"); B(c, x - 20, 2, 40, 16, "#fff8d0"); const g = c.createRadialGradient(x, 10, 4, x, 10, 150); g.addColorStop(0, "rgba(255,248,208,.34)"); g.addColorStop(1, "rgba(255,248,208,0)"); c.fillStyle = g; c.fillRect(x - 150, 0, 300, 190); }
  B(c, 0, 126, W, 14, "#c9d3e6", "#eef2f8", "#8793bd"); R(c, 0, 131, W, 4, "#1d3c8f");
  c.fillStyle = grad(c, 140, H, [[0, "#35a85a"], [1, "#1f7a3c"]]); c.fillRect(0, 140, W, H - 140);
  for (let k = -1; k < 9; k++) { const x = k * 80 - ((scroll % 80) + 80) % 80 + 80; if (Math.floor((x + scroll) / 80) % 2) R(c, x, 140, 80, 220, "rgba(0,0,0,.07)"); c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(Math.round(x), 148, 2, 200); for (let h = 0; h < 4; h++) R(c, x + 20 * h, 244, 2, 8, "rgba(255,255,255,.6)"); }
  R(c, 0, 148, W, 3, "rgba(255,255,255,.85)"); R(c, 0, 346, W, 3, "rgba(255,255,255,.85)");
  if (endzone) { R(c, 560, 150, 80, 196, "#1d3c8f"); R(c, 556, 148, 4, 200, "#fff"); c.save(); c.translate(604, 250); c.rotate(Math.PI / 2); c.fillStyle = "#c9d3e6"; c.font = "18px 'Press Start 2P', monospace"; c.textAlign = "center"; c.fillText("DALLAS", 0, 6); c.restore(); c.textAlign = "left"; }
  if (midfield) { ell(c, 320, 248, 70, 40, INK); ell(c, 320, 248, 67, 38, "#c9d3e6"); c.save(); c.translate(320, 248); c.scale(1, 0.58); star(c, 0, 0, 52, "#1d3c8f", "#0a1030"); c.restore(); }
}
export function locker(c, t) {
  c.fillStyle = grad(c, 0, H, [[0, "#232a4a"], [1, "#161a30"]]); c.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) { B(c, 12 + i * 78, 30, 68, 196, "#3b4670", "#55629a", "#262e52"); R(c, 22 + i * 78, 50, 48, 3, "#1a2038"); R(c, 22 + i * 78, 60, 48, 3, "#1a2038"); R(c, 66 + i * 78, 124, 6, 16, "#c9d3e6"); B(c, 24 + i * 78, 150, 44, 60, i % 2 ? "#1b2a6b" : "#c9d3e6"); }
  star(c, 320, 120, 30, "#1d3c8f", "#c9d3e6");
  c.fillStyle = grad(c, 226, H, [[0, "#6a7596"], [1, "#454e6e"]]); c.fillRect(0, 226, W, H - 226);
  B(c, 40, 280, 560, 16, "#a07a4a", "#c09a62", "#6b4f2c"); B(c, 60, 296, 12, 44, "#3b2e1e"); B(c, 568, 296, 12, 44, "#3b2e1e");
}
export function sky(c, t) {
  c.fillStyle = grad(c, 0, H, [[0, "#2f6fc4"], [1, "#cfeaff"]]); c.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) { const x = ((rnd(i) * 840 - t * (20 + i * 9)) % 840 + 840) % 840 - 100, y = 40 + rnd(i + 4) * 290, s = 0.7 + rnd(i + 8); [[0, 0, 28], [28, 6, 22], [-26, 8, 20], [8, -12, 20]].forEach(([dx, dy, r]) => { disc(c, x + dx * s, y + dy * s + 4, r * s, "rgba(160,190,225,.7)"); disc(c, x + dx * s, y + dy * s, r * s, "#fff"); }); }
}
export function plane(c, x, y) {
  c.fillStyle = INK; c.beginPath(); c.ellipse(x + 80, y + 14, 92, 18, 0, 0, Math.PI * 2); c.fill();
  ell(c, x + 80, y + 14, 90, 16, "#eef2f8"); ell(c, x + 80, y + 20, 86, 9, "#c9d3e6"); R(c, x + 4, y + 16, 150, 3, "#1d3c8f");
  B(c, x + 136, y + 6, 22, 9, "#27325c"); for (let i = 0; i < 8; i++) B(c, x + 30 + i * 12, y + 6, 6, 6, "#7fd3ff");
  c.fillStyle = INK; c.beginPath(); c.moveTo(x - 14, y + 12); c.lineTo(x - 8, y - 28); c.lineTo(x + 18, y - 28); c.lineTo(x + 30, y + 6); c.fill(); c.fillStyle = "#1d3c8f"; c.beginPath(); c.moveTo(x - 11, y + 10); c.lineTo(x - 6, y - 26); c.lineTo(x + 16, y - 26); c.lineTo(x + 27, y + 6); c.fill(); star(c, x + 6, y - 10, 8, "#c9d3e6");
  c.fillStyle = INK; c.beginPath(); c.moveTo(x + 50, y + 22); c.lineTo(x + 20, y + 44); c.lineTo(x + 60, y + 44); c.lineTo(x + 104, y + 24); c.fill(); c.fillStyle = "#c9d3e6"; c.beginPath(); c.moveTo(x + 52, y + 23); c.lineTo(x + 25, y + 42); c.lineTo(x + 59, y + 42); c.lineTo(x + 100, y + 25); c.fill();
}

// ─── food and drink, drawn on a 32 by 32 square ───
export function food(c, kind) {
  if (kind === "potato") { ell(c, 16, 24, 14, 5, "#aeb6c4"); ell(c, 16, 22, 14, 5, "#eef2f8"); ell(c, 11, 15, 8, 7, INK); ell(c, 11, 15, 7, 6, "#fff6d8"); ell(c, 9, 12, 3, 2, "#fff"); R(c, 10, 10, 4, 3, "#f6c945"); ell(c, 21, 16, 8, 6, INK); ell(c, 21, 16, 7, 5, "#f6a528"); [[18, 14], [22, 17], [24, 13], [20, 18]].forEach(([x, y]) => R(c, x, y, 3, 2, "#fbd76a")); }
  else if (kind === "turkey") { ell(c, 13, 14, 11, 10, INK); ell(c, 13, 14, 10, 9, "#a8551c"); ell(c, 10, 11, 5, 4, "#c97a35"); ell(c, 9, 10, 2, 1.5, "#e0a060"); R(c, 20, 18, 8, 5, INK); R(c, 21, 19, 6, 3, "#f1e3c6"); disc(c, 28, 19, 3.5, INK); disc(c, 28, 19, 2.5, "#fff"); disc(c, 27, 23, 3, INK); disc(c, 27, 23, 2, "#fff"); }
  else if (kind === "cranberry") { B(c, 9, 4, 14, 24, "#b01e3a", "#d43a58", "#7a1228"); R(c, 9, 4, 14, 4, "#c9d3e6"); R(c, 9, 24, 14, 4, "#c9d3e6"); R(c, 9, 11, 14, 1, "#7a1228"); R(c, 9, 17, 14, 1, "#7a1228"); R(c, 12, 12, 8, 4, "#fff"); R(c, 11, 5, 3, 22, "rgba(255,255,255,.25)"); }
  else if (kind === "pie") { c.fillStyle = INK; c.beginPath(); c.moveTo(1, 25); c.lineTo(29, 25); c.lineTo(18, 6); c.closePath(); c.fill(); c.fillStyle = "#d9772a"; c.beginPath(); c.moveTo(4, 23); c.lineTo(27, 23); c.lineTo(18, 9); c.closePath(); c.fill(); R(c, 3, 23, 25, 4, "#c9a06a"); ell(c, 17, 7, 5, 4, INK); ell(c, 17, 7, 4, 3, "#fff"); B(c, 22, 18, 9, 8, "#6b3f1e", "#8a5a30"); R(c, 23, 16, 7, 2, "#8a5a30"); }
  else if (kind === "water" || kind === "sparkling") { B(c, 10, 6, 12, 22, "#dff3ff"); R(c, 10, 12, 12, 16, kind === "water" ? "#6fc3f5" : "#aee6ff"); R(c, 11, 7, 2, 20, "rgba(255,255,255,.7)"); if (kind === "sparkling") { [[14, 16], [18, 20], [15, 24], [19, 14]].forEach(([x, y]) => disc(c, x, y, 1.2, "#fff")); ell(c, 21, 6, 5, 3, INK); ell(c, 21, 6, 4, 2.2, "#7ad04a"); R(c, 19, 5, 4, 1, "#d6f5a8"); } }
  else if (kind === "coffee") { for (let i = 0; i < 3; i++) { B(c, 2 + i * 10, 14, 8, 12, "#fff", null, "#c9d3e6"); R(c, 2 + i * 10, 14, 8, 3, "#5a3a1e"); R(c, 4 + i * 10, 6 - (i % 2) * 2, 2, 6, "rgba(255,255,255,.6)"); } }
  else if (kind === "champagne") { c.fillStyle = INK; c.beginPath(); c.moveTo(9, 3); c.lineTo(23, 3); c.lineTo(20, 18); c.lineTo(12, 18); c.fill(); c.fillStyle = "#f6e7a8"; c.beginPath(); c.moveTo(11, 5); c.lineTo(21, 5); c.lineTo(19, 17); c.lineTo(13, 17); c.fill(); R(c, 15, 18, 2, 8, "#eef2f8"); B(c, 11, 26, 10, 2, "#eef2f8"); [[14, 9], [17, 12], [15, 14], [26, 4], [28, 8]].forEach(([x, y]) => disc(c, x, y, 1.2, "#fff")); }
}
export const FOOD_OF = { breakfast: { best: "potato", good: "turkey", bad: "cranberry", silly: "pie" }, jet: { best: "water", good: "sparkling", bad: "coffee", over: "champagne" } };

// ─── a player on the field, about 22 wide and 40 tall, feet at (x, y) ───
export function player(c, x, y, o = {}, frame = 0) {
  const { jersey = "#e2622a", pants = "#3a4a66", skin = "#e8b98a", hair = "#5a3a1e", helmet = "", dir = 1, s = 1, down = false, arms = 0 } = o;
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(dir * s, s);
  ell(c, 0, 1, 12, 3, "rgba(0,0,0,.28)");
  if (down) { B(c, -16, -9, 24, 9, jersey, lighten(jersey), darken(jersey)); B(c, 8, -10, 10, 10, helmet || skin); if (!helmet) R(c, 8, -10, 10, 3, hair); B(c, -22, -7, 7, 6, pants); c.restore(); return; }
  const st = frame % 4, a = [0, 5, 0, -5][st], b = -a;
  B(c, -7 + a * 0.4, -15, 6, 13 - Math.abs(a) * 0.3, pants, null, darken(pants)); B(c, 1 + b * 0.4, -15, 6, 13 - Math.abs(b) * 0.3, pants, null, darken(pants));
  B(c, -8 + a * 0.6, -3, 8, 3, "#f4f1e6"); B(c, 0 + b * 0.6, -3, 8, 3, "#f4f1e6");
  B(c, -9, -30, 18, 16, jersey, lighten(jersey), darken(jersey));
  if (o.num) { c.fillStyle = "#fff"; c.font = "bold 9px 'Outfit', sans-serif"; c.textAlign = "center"; c.fillText(o.num, 0, -19); c.textAlign = "left"; }
  const up = arms ? -14 : 0;
  B(c, -13, -29 + b * 0.5 + up, 4, 11, jersey); B(c, -13, -19 + b * 0.5 + up * 1.8, 4, 4, skin); B(c, 9, -29 + a * 0.5 + up, 4, 11, jersey); B(c, 9, -19 + a * 0.5 + up * 1.8, 4, 4, skin);
  if (helmet) { disc(c, 0, -37, 9, INK); disc(c, 0, -37, 8, helmet); disc(c, -3, -40, 3, lighten(helmet, 0.5)); R(c, 3, -37, 7, 6, INK); R(c, 4, -36, 5, 1, "#c9d3e6"); R(c, 4, -33, 5, 1, "#c9d3e6"); if (o.dot) star(c, -2, -37, 4, o.dot); }
  else if (o.face) { c.fillStyle = INK; c.fillRect(-9, -47, 18, 18); c.drawImage(o.face, -8, -46, 16, 16); }
  else { B(c, -7, -44, 14, 14, skin, lighten(skin, 0.15)); R(c, -7, -45, 14, 5, hair); R(c, -8, -44, 2, 8, hair); if (o.long) { R(c, -9, -44, 4, 18, hair); R(c, 5, -44, 3, 12, hair); } R(c, 2, -38, 2, 3, INK); R(c, -3, -38, 2, 3, INK); R(c, -2, -33, 5, 1, "#7a3b2a"); }
  c.restore();
}
export function ball(c, x, y, spin = 0) { c.save(); c.translate(x, y); c.rotate(spin); ell(c, 0, 0, 8, 5, INK); ell(c, 0, 0, 7, 4, "#8a4b1e"); ell(c, -2, -1.5, 3, 1.2, "#b06a34"); R(c, -3, -0.5, 6, 1, "#fff"); c.restore(); }
/** A turkey on the loose, for whenever things need to get stupid. */
export function turkey(c, x, y, t, dir = 1) {
  c.save(); c.translate(x, y); c.scale(dir, 1); const bob = Math.sin(t * 14) * 2;
  ell(c, 0, 1, 14, 3, "rgba(0,0,0,.28)");
  for (let i = -3; i <= 3; i++) { c.save(); c.translate(-10, -18 + bob); c.rotate(-1.2 + i * 0.28); B(c, -3, -26, 6, 24, LEAF[(i + 6) % 6]); c.restore(); }
  ell(c, 0, -14 + bob, 15, 12, INK); ell(c, 0, -14 + bob, 14, 11, "#7a4a22"); ell(c, -3, -17 + bob, 7, 5, "#96602e");
  B(c, 10, -32 + bob, 6, 16, "#7a4a22"); disc(c, 14, -34 + bob, 6, INK); disc(c, 14, -34 + bob, 5, "#96602e"); R(c, 15, -36 + bob, 2, 2, "#fff"); R(c, 16, -36 + bob, 1, 1, INK);
  c.fillStyle = "#f6c945"; c.beginPath(); c.moveTo(18, -34 + bob); c.lineTo(25, -32 + bob); c.lineTo(18, -30 + bob); c.fill(); R(c, 17, -30 + bob, 3, 7, "#c9402a");
  const leg = Math.sin(t * 14) * 4; R(c, -4 + leg, -4, 2, 5, "#f6a528"); R(c, 3 - leg, -4, 2, 5, "#f6a528");
  c.restore();
}
export function fireworks(c, t, n = 5) {
  for (let i = 0; i < n; i++) { const life = (t * 0.9 + i * 0.37) % 1, x = 60 + rnd(i + Math.floor(t * 0.9 + i * 0.37)) * 520, y = 40 + rnd(i * 3 + Math.floor(t * 0.9 + i * 0.37)) * 120; for (let k = 0; k < 14; k++) { const a = k * Math.PI / 7, r = life * 46; R(c, x + Math.cos(a) * r, y + Math.sin(a) * r + life * life * 18, 3, 3, ["#ffd75e", "#ff7b72", "#7fd3ff", "#6ee7a0", "#fff"][(i + k) % 5]); } }
}

// ─── people up close: feet at (x, y), about 150 tall at s = 1 ───
export function person(c, x, y, s, o) {
  const { skin = "#e8b98a", hair = "#5a3a1e", shirt = "#e2622a", pants = "#3a4a66" } = o;
  const sl = lighten(shirt, 0.18), sd = darken(shirt, 0.25);
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(s, s);
  ell(c, 0, 2, 34, 6, "rgba(0,0,0,.3)");
  B(c, -18, -50, 15, 48, pants, null, darken(pants)); B(c, 3, -50, 15, 48, pants, null, darken(pants)); B(c, -22, -6, 21, 8, "#2a2233", "#4a4058"); B(c, 1, -6, 21, 8, "#2a2233", "#4a4058");
  B(c, -24, -104, 48, 58, shirt, sl, sd);
  if (o.suit) { c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-8, -104); c.lineTo(8, -104); c.lineTo(0, -66); c.fill(); B(c, -3, -100, 6, 30, o.tie || "#1d3c8f", lighten(o.tie || "#1d3c8f")); c.fillStyle = sd; c.beginPath(); c.moveTo(-8, -104); c.lineTo(-2, -74); c.lineTo(-16, -96); c.fill(); c.beginPath(); c.moveTo(8, -104); c.lineTo(2, -74); c.lineTo(16, -96); c.fill(); }
  if (o.number) { c.fillStyle = "#fff"; c.font = "bold 24px 'Outfit', sans-serif"; c.textAlign = "center"; c.fillText(o.number, 0, -66); c.textAlign = "left"; }
  const up = o.armUp ? 1 : 0, wave = o.wave ? Math.sin(o.wave * 9) * 6 : 0;
  B(c, -34, -102, 11, 40, shirt, sl, sd); B(c, -34, -64, 11, 11, skin);
  c.save(); c.translate(29, -98); c.rotate(up ? -2.5 + wave * 0.03 : 0); B(c, -6, 0, 11, 40, shirt, sl, sd); B(c, -6, 38, 11, 11, skin); if (o.mic) { B(c, -3, 46, 6, 20, "#222"); disc(c, 0, 68, 7, INK); disc(c, 0, 68, 6, "#888"); } c.restore();
  B(c, -6, -112, 12, 10, darken(skin, 0.12));
  if (o.helmet) { disc(c, 0, -134, 27, INK); disc(c, 0, -134, 25, o.helmet); disc(c, -9, -144, 9, lighten(o.helmet, 0.55)); B(c, 4, -134, 22, 18, "#16121f"); R(c, 6, -130, 20, 2, "#c9d3e6"); R(c, 6, -123, 20, 2, "#c9d3e6"); if (o.dot) star(c, -9, -132, 10, o.dot, "#0a1030"); }
  else if (o.face) { c.fillStyle = INK; c.fillRect(-23, -161, 46, 52); c.drawImage(o.face, -21, -159, 42, 48); }
  else {
    B(c, -19, -156, 38, 46, skin, lighten(skin, 0.14), darken(skin, 0.12));
    if (o.bald) { R(c, -21, -146, 5, 16, hair); R(c, 16, -146, 5, 16, hair); } else { B(c, -21, -162, 42, 16, hair, lighten(hair, 0.2)); R(c, -21, -150, 5, 18, hair); R(c, 16, -150, 5, 18, hair); }
    if (o.swept) { c.fillStyle = hair; c.beginPath(); c.moveTo(-21, -150); c.quadraticCurveTo(0, -176, 23, -154); c.lineTo(21, -146); c.quadraticCurveTo(0, -160, -21, -146); c.fill(); }
    if (o.long) { B(c, -25, -154, 9, 60, hair, lighten(hair, 0.2)); B(c, 16, -154, 9, 60, hair, lighten(hair, 0.2)); }
    if (o.pony) { B(c, 18, -160, 14, 9, hair); B(c, 26, -154, 8, 30, hair); }
    if (o.cap) { B(c, -21, -166, 42, 13, o.cap, lighten(o.cap)); B(c, 4, -156, 30, 5, o.cap); }
    if (o.hat) { B(c, -34, -164, 68, 7, o.hat, lighten(o.hat)); B(c, -19, -186, 38, 24, o.hat, lighten(o.hat), darken(o.hat)); R(c, -19, -170, 38, 5, "#3a2a1e"); }
    const ey = -140;
    R(c, -12, ey, 8, 7, "#fff"); R(c, 4, ey, 8, 7, "#fff"); R(c, -9 + (o.look || 0), ey + 1, 4, 5, INK); R(c, 7 + (o.look || 0), ey + 1, 4, 5, INK);
    if (o.angry) { c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(-14, ey - 7); c.lineTo(-3, ey - 2); c.moveTo(14, ey - 7); c.lineTo(3, ey - 2); c.stroke(); } else { R(c, -13, ey - 5, 9, 2, darken(hair, 0.1)); R(c, 4, ey - 5, 9, 2, darken(hair, 0.1)); }
    if (o.glasses) { c.strokeStyle = "#3a3a44"; c.lineWidth = 2; c.strokeRect(-15, ey - 3, 13, 12); c.strokeRect(2, ey - 3, 13, 12); R(c, -2, ey + 1, 4, 2, "#3a3a44"); R(c, -14, ey - 2, 11, 10, "rgba(255,255,255,.22)"); R(c, 3, ey - 2, 11, 10, "rgba(255,255,255,.22)"); }
    if (o.shades === "on") { B(c, -15, ey - 2, 13, 10, "#16121f", "#3a3a55"); B(c, 2, ey - 2, 13, 10, "#16121f", "#3a3a55"); R(c, -2, ey + 1, 4, 2, "#16121f"); }
    if (o.shades === "down") { B(c, -15, ey + 9, 13, 8, "#16121f", "#3a3a55"); B(c, 2, ey + 9, 13, 8, "#16121f", "#3a3a55"); R(c, -2, ey + 11, 4, 2, "#16121f"); }
    R(c, -2, ey + 9, 4, 6, darken(skin, 0.15));
    if (o.mustache) B(c, -9, -124, 18, 5, hair);
    if (o.angry) B(c, -7, -120, 14, 6, "#7a1f1f", null, "#fff"); else if (o.sad) { c.strokeStyle = "#7a3b2a"; c.lineWidth = 2; c.beginPath(); c.arc(0, -112, 7, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); } else if (o.grin) { B(c, -10, -122, 20, 7, "#fff"); R(c, -10, -119, 20, 1, "#c9d3e6"); } else { c.strokeStyle = "#7a3b2a"; c.lineWidth = 2; c.beginPath(); c.arc(0, -124, 7, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
    if (o.tan) { R(c, -17, -132, 5, 3, "rgba(200,90,60,.35)"); R(c, 12, -132, 5, 3, "rgba(200,90,60,.35)"); }
  }
  if (o.pin) { disc(c, -13, -90, 7, INK); disc(c, -13, -90, 6, "#c9d3e6"); star(c, -13, -90, 4.5, "#1d3c8f"); }
  c.restore();
}
// Jerry Jones as a cartoon: silver hair swept back, glasses, a tan, a wide
// grin, a dark suit, and a blue star on a silver pin.
export const jerry = (c, x, y, s = 1, extra = {}) => person(c, x, y, s, { skin: "#d9996a", hair: "#e6e9ee", shirt: "#1b2440", pants: "#1b2440", suit: true, tie: "#1d3c8f", glasses: true, grin: true, swept: true, tan: true, pin: true, ...extra });
// The woman who walks by the park, as Andrew described her.
export const passerby = (c, x, y, s, shades) => person(c, x, y, s, { skin: "#f2cba6", hair: "#f6d878", shirt: "#8a2f52", pants: "#2a2a3a", long: true, shades, look: -1 });
export const CAST = {
  uncle: { skin: "#d9a06c", hair: "#3a2a1e", shirt: "#a8551c", mustache: true, cap: "#27325c", armUp: true },
  brother: { skin: "#e8b98a", hair: "#5a3a1e", shirt: "#e2622a", angry: true, number: "7", armUp: true },
  sister: { skin: "#e8b98a", hair: "#5a3a1e", shirt: "#e2622a", pony: true, armUp: true, number: "12" },
  cousin: { skin: "#c98a5a", hair: "#1e1410", shirt: "#f0a030", long: true, sad: true },
  niece: { skin: "#c98a5a", hair: "#3a2a1e", shirt: "#2f6fc4", pony: true, armUp: true },
  nephew: { skin: "#e8b98a", hair: "#a8551c", shirt: "#e2622a", number: "9" },
  receiver: { skin: "#8a5a3a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "88", armUp: true },
  reporter: { skin: "#f0c8a0", hair: "#7a3b2a", shirt: "#b01e3a", long: true, mic: true, armUp: false },
  kicker: { skin: "#e8b98a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "3" },
  backup: { skin: "#c98a5a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "14" },
  you: { skin: "#e8b98a", hair: "#3a2a1e", shirt: "#e2622a", number: "1" },
};
export function cast(c, who, x, y, s = 1, extra = {}) { if (who === "jerry") jerry(c, x, y, s, extra); else if (CAST[who]) person(c, x, y, who === "nephew" ? s * 0.7 : s, { ...CAST[who], ...extra }); }

// The sideline up close, for the halftime questions: the team on the bench,
// the cooler, the field behind them.
export function sideline(c, t, where, face) {
  if (where === "dallas") { stadium(c, t); B(c, 20, 206, 460, 10, "#c9d3e6", "#eef2f8", "#8793bd"); for (let i = 0; i < 5; i++) person(c, 70 + i * 96, 216, 0.6, { ...CAST.kicker, number: String(11 + i * 13), skin: ["#e8b98a", "#8a5a3a", "#c98a5a"][i % 3] }); B(c, 30, 150, 40, 34, "#e2622a", "#f08a4b", "#a8551c"); B(c, 26, 143, 48, 9, "#fff"); }
  else { park(c, t, { field: false }); B(c, 20, 206, 440, 10, "#a0703f", "#c08a52", "#7a5230"); ["uncle", "sister", "cousin", "brother", "nephew"].forEach((k, i) => cast(c, k, 70 + i * 88, 216, 0.6, { armUp: false, angry: false })); B(c, 20, 150, 46, 36, "#2f6fc4", "#5fa8e6", "#1d3c8f"); B(c, 15, 142, 56, 10, "#fff"); leaves(c, t, 40); }
  person(c, 560, 226, 0.9, { ...CAST.you, face, shirt: where === "dallas" ? "#1b2440" : "#e2622a", number: where === "dallas" ? "" : "1", armUp: true, wave: t });
}
export function chute(c, x, y, t, face) {
  c.fillStyle = INK; c.beginPath(); c.arc(x, y - 70, 58, Math.PI, 0); c.fill();
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#f6c945" : "#e2622a"; c.beginPath(); c.moveTo(x, y - 70); c.arc(x, y - 70, 55, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); c.fill(); }
  c.strokeStyle = "#fff"; c.lineWidth = 1.5; [-55, -28, 0, 28, 55].forEach(dx => { c.beginPath(); c.moveTo(x + dx, y - 70); c.lineTo(x, y - 28); c.stroke(); });
  player(c, x, y + 14, { jersey: "#e2622a", face, arms: 1, s: 1.3 }, Math.floor(t * 6));
}
/** A photograph cut to a small square face, in hard pixels: the player's avatar. */
export function faceFrom(img) {
  const cv = document.createElement("canvas"); cv.width = 21; cv.height = 24; const x = cv.getContext("2d");
  const side = Math.min(img.naturalWidth, img.naturalHeight), w = side * 0.62, h = w * 24 / 21;
  x.imageSmoothingEnabled = true; x.drawImage(img, (img.naturalWidth - w) / 2, Math.max(0, (img.naturalHeight - h) * 0.3), w, h, 0, 0, 21, 24);
  try { const d = x.getImageData(0, 0, 21, 24); for (let i = 0; i < d.data.length; i += 4) for (let k = 0; k < 3; k++) d.data[i + k] = Math.min(255, Math.round(d.data[i + k] / 36) * 36); x.putImageData(d, 0, 0); } catch { /* a picture that cannot be read stays as drawn */ }
  return cv;
}
