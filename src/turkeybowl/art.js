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
/** The same box with rounded corners, for bodies and heads. */
const RB = (c, x, y, w, h, col, lit, dark, r = 5) => {
  const path = (px, py, pw, ph, pr) => { c.beginPath(); if (c.roundRect) c.roundRect(px, py, pw, ph, pr); else c.rect(px, py, pw, ph); };
  c.fillStyle = INK; path(x - 1.5, y - 1.5, w + 3, h + 3, r + 1.5); c.fill();
  c.fillStyle = col; path(x, y, w, h, r); c.fill();
  if (lit) { c.save(); path(x, y, w, h, r); c.clip(); c.fillStyle = lit; c.fillRect(x, y, w, Math.max(1, h * 0.22)); if (dark) { c.fillStyle = dark; c.fillRect(x, y + h * 0.78, w, h * 0.22); } c.restore(); }
};
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
// A stadium in a team's colours. Dallas is blue and silver in the afternoon;
// Texas is burnt orange at night, with camera flashes in the stands. Words
// and colours only: no team's logo is drawn anywhere.
const HOUSE = {
  dallas: { name: "DALLAS", a: "#1d3c8f", b: "#c9d3e6", seats: ["#1d3c8f", "#c9d3e6", "#2a56c6", "#8793bd", "#e8ecf5", "#16224f"], sky: [[0, "#060b22"], [1, "#16224f"]], turf: ["#35a85a", "#1f7a3c"], night: false },
  texas: { name: "TEXAS", a: "#bf5700", b: "#ffffff", seats: ["#bf5700", "#e87a1e", "#ffffff", "#8a3f00", "#f4b27a", "#d96a10"], sky: [[0, "#02030a"], [1, "#0c1030"]], turf: ["#2f9a52", "#17602e"], night: true },
};
function crowd(c, t, y0, rows, house) {
  for (let row = 0; row < rows; row++) for (let i = 0; i < 81; i++) {
    const k = row * 81 + i, bob = Math.sin(t * 6 + k) > 0.6 ? -2 : 0, x = i * 8 + (row % 2) * 4, y = y0 + row * 13 + bob;
    R(c, x, y + 5, 7, 8, house.seats[Math.floor(rnd(k + 1) * 6)]); disc(c, x + 3.5, y + 3, 3, ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"][Math.floor(rnd(k + 7) * 4)]);
  }
  if (house.night) for (let i = 0; i < 5; i++) { const f = Math.floor(t * 9 + i * 3.7), x = rnd(f + i * 11) * W, y = y0 + rnd(f * 3 + i) * rows * 13; if ((t * 9 + i * 3.7) % 1 < 0.35) { disc(c, x, y, 7, "rgba(255,255,255,.55)"); disc(c, x, y, 3, "#fff"); } }
}
export function stadium(c, t, { midfield = false, scroll = 0, endzone = false, team = "dallas" } = {}) {
  const h = HOUSE[team] || HOUSE.dallas;
  c.fillStyle = grad(c, 0, 130, h.sky); c.fillRect(0, 0, W, 130);
  if (h.night) for (let i = 0; i < 30; i++) R(c, rnd(i + 900) * W, rnd(i + 950) * 20, 1, 1, "#fff");
  crowd(c, t, 22, 8, h);
  B(c, 214, 4, 212, 66, "#05070f"); c.fillStyle = grad(c, 8, 66, [[0, h.a], [1, darken(h.a, 0.5)]]); c.fillRect(218, 8, 204, 58);
  if (team === "dallas") star(c, 262, 37, 20, "#c9d3e6", "#0a1030");
  c.fillStyle = h.b; c.font = (team === "dallas" ? 14 : 22) + "px 'Press Start 2P', monospace"; c.textAlign = "center"; c.fillText(h.name, team === "dallas" ? 348 : 320, team === "dallas" ? 44 : 48); c.textAlign = "left";
  for (const x of [26, 614]) { R(c, x - 3, 0, 6, 126, "#39406b"); B(c, x - 20, 2, 40, 16, "#fff8d0"); const g = c.createRadialGradient(x, 10, 4, x, 10, h.night ? 210 : 150); g.addColorStop(0, h.night ? "rgba(255,248,208,.5)" : "rgba(255,248,208,.34)"); g.addColorStop(1, "rgba(255,248,208,0)"); c.fillStyle = g; c.fillRect(x - 210, 0, 420, 230); }
  B(c, 0, 126, W, 14, h.b === "#ffffff" ? "#f4f1e6" : h.b, "#ffffff", "#8793bd"); R(c, 0, 131, W, 4, h.a);
  c.fillStyle = grad(c, 140, H, [[0, h.turf[0]], [1, h.turf[1]]]); c.fillRect(0, 140, W, H - 140);
  for (let k = -1; k < 9; k++) { const x = k * 80 - ((scroll % 80) + 80) % 80 + 80; if (Math.floor((x + scroll) / 80) % 2) R(c, x, 140, 80, 220, "rgba(0,0,0,.07)"); c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(Math.round(x), 148, 2, 200); for (let n = 0; n < 4; n++) R(c, x + 20 * n, 244, 2, 8, "rgba(255,255,255,.6)"); }
  R(c, 0, 148, W, 3, "rgba(255,255,255,.85)"); R(c, 0, 346, W, 3, "rgba(255,255,255,.85)");
  if (endzone) { R(c, 560, 150, 80, 196, h.a); R(c, 556, 148, 4, 200, "#fff"); c.save(); c.translate(604, 250); c.rotate(Math.PI / 2); c.fillStyle = h.b; c.font = "18px 'Press Start 2P', monospace"; c.textAlign = "center"; c.fillText(h.name, 0, 6); c.restore(); c.textAlign = "left"; }
  if (midfield && team === "dallas") { ell(c, 320, 248, 70, 40, INK); ell(c, 320, 248, 67, 38, "#c9d3e6"); c.save(); c.translate(320, 248); c.scale(1, 0.58); star(c, 0, 0, 52, "#1d3c8f", "#0a1030"); c.restore(); }
  if (midfield && team === "texas") { c.save(); c.translate(320, 262); c.scale(1, 0.6); c.fillStyle = "rgba(0,0,0,.25)"; c.font = "64px 'Press Start 2P', monospace"; c.textAlign = "center"; c.fillText("TEXAS", 3, 3); c.fillStyle = h.a; c.fillText("TEXAS", 0, 0); c.restore(); c.textAlign = "left"; }
  if (h.night) { const v = c.createRadialGradient(320, 200, 160, 320, 200, 420); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,20,.45)"); c.fillStyle = v; c.fillRect(0, 0, W, H); }
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
  // Tackled: down on one knee, still, and never flat on the ground.
  const st = down ? 0 : frame % 4, a = [0, 5, 0, -5][st], b = -a, drop = down ? 7 : 0;
  c.translate(0, drop * 0.2);
  RB(c, -7 + a * 0.4, -15 + drop, 6, 13 - drop - Math.abs(a) * 0.3, pants, null, null, 2); RB(c, 1 + b * 0.4, -15, 6, 13 - Math.abs(b) * 0.3, pants, null, null, 2);
  RB(c, -8 + a * 0.6, -3, 8, 3, "#f4f1e6", null, null, 1.5); RB(c, 0 + b * 0.6, -3, 8, 3, "#f4f1e6", null, null, 1.5);
  RB(c, -9, -30 + drop * 0.5, 18, 16, jersey, lighten(jersey), darken(jersey), 4);
  if (o.num) { c.fillStyle = "#fff"; c.font = "7px 'Press Start 2P', monospace"; c.textAlign = "center"; c.fillText(o.num, 0, -19); c.textAlign = "left"; }
  const up = arms ? -14 : 0, hy = drop * 0.5;
  RB(c, -13, -29 + up + hy, 4, 11, jersey, null, null, 2); RB(c, -13, -19 + up * 1.8 + hy, 4, 4, skin, null, null, 2); RB(c, 9, -29 + up + hy, 4, 11, jersey, null, null, 2); RB(c, 9, -19 + up * 1.8 + hy, 4, 4, skin, null, null, 2);
  if (helmet) { disc(c, 0, -37 + hy, 9, INK); disc(c, 0, -37 + hy, 8, helmet); disc(c, -3, -40 + hy, 3, lighten(helmet, 0.5)); R(c, 3, -37 + hy, 7, 6, INK); R(c, 4, -36 + hy, 5, 1, "#c9d3e6"); R(c, 4, -33 + hy, 5, 1, "#c9d3e6"); if (o.dot) star(c, -2, -37 + hy, 4, o.dot); }
  else if (o.face) { c.fillStyle = INK; c.fillRect(-9, -47 + hy, 18, 18); c.drawImage(o.face, -8, -46 + hy, 16, 16); }
  else { disc(c, 0, -38 + hy, 8.5, INK); disc(c, 0, -38 + hy, 7.5, skin); c.fillStyle = hair; c.beginPath(); c.arc(0, -39 + hy, 7.6, Math.PI, 0); c.fill(); if (o.long) { R(c, -8, -40 + hy, 3, 14, hair); R(c, 5, -40 + hy, 3, 10, hair); } R(c, 2, -38 + hy, 2, 2, INK); R(c, -3, -38 + hy, 2, 2, INK); }
  c.restore();
}
export function ball(c, x, y, tilt = 0) { c.save(); c.translate(x, y); c.rotate(tilt); ell(c, 0, 0, 8, 5, INK); ell(c, 0, 0, 7, 4, "#8a4b1e"); ell(c, -2, -1.5, 3, 1.2, "#b06a34"); R(c, -3, -0.5, 6, 1, "#fff"); c.restore(); }
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
/** A big turkey that dances. Andrew, 2026-11-14: "The turkey should do things
 * like the Macarena or the Dougie." The Macarena is the eight arm moves on
 * the beat with a hip sway and a quarter turn; the Dougie is the lean and the
 * hand across the head. kind is "macarena" or "dougie". */
export function turkeyDance(c, x, y, t, kind = "macarena", s = 2) {
  const beat = t * 2.2, step = Math.floor(beat) % 16, sway = Math.sin(beat * Math.PI) * (kind === "dougie" ? 9 : 4);
  const face = kind === "macarena" && Math.floor(beat / 16) % 2 ? -1 : 1;
  c.save(); c.translate(x + (kind === "dougie" ? sway : 0), y); c.scale(s * face, s);
  ell(c, 0, 1, 16, 3, "rgba(0,0,0,.3)");
  for (let i = -3; i <= 3; i++) { c.save(); c.translate(0, -18); c.rotate(i * 0.3 + sway * 0.01); B(c, -3, -30, 6, 24, LEAF[(i + 6) % 6]); c.restore(); }
  c.save(); c.rotate(kind === "dougie" ? sway * 0.02 : 0);
  ell(c, sway * 0.3, -15, 15, 13, INK); ell(c, sway * 0.3, -15, 14, 12, "#7a4a22"); ell(c, -3 + sway * 0.3, -18, 7, 5, "#96602e");
  // wings as arms: [left, right] angles for each of the eight Macarena moves, each held two beats
  const M = [[1.5, 0.2], [1.5, 1.5], [1.2, 1.5], [1.2, 1.2], [-2.4, 1.2], [-2.4, -2.4], [-0.5, -2.4], [-0.5, -0.5]];
  const pose = kind === "macarena" ? M[Math.floor(step / 2) % 8] : [(Math.sin(beat * Math.PI) > 0 ? -2.6 : 0.4), (Math.sin(beat * Math.PI) > 0 ? 0.4 : -2.6)];
  [[-12, pose[0], -1], [12, pose[1], 1]].forEach(([wx, ang, side]) => { c.save(); c.translate(wx + sway * 0.3, -20); c.rotate(side * (Math.PI / 2 - ang) * 0.7 + (side < 0 ? Math.PI : 0)); B(c, 0, -3, 14, 6, "#5a3418", "#96602e"); c.restore(); });
  B(c, -3, -36, 6, 12, "#7a4a22"); disc(c, 0, -40, 7, INK); disc(c, 0, -40, 6, "#96602e"); R(c, -3, -42, 2, 2, "#fff"); R(c, 2, -42, 2, 2, "#fff"); R(c, -3, -42, 1, 1, INK); R(c, 2, -42, 1, 1, INK);
  c.fillStyle = "#f6c945"; c.beginPath(); c.moveTo(-2, -39); c.lineTo(2, -39); c.lineTo(0, -34); c.fill(); R(c, 1, -36, 2, 6, "#c9402a");
  c.restore();
  const leg = Math.sin(beat * Math.PI) * 3; R(c, -5 + leg, -4, 3, 5, "#f6a528"); R(c, 3 - leg, -4, 3, 5, "#f6a528"); R(c, -7 + leg, 0, 6, 2, "#f6a528"); R(c, 2 - leg, 0, 6, 2, "#f6a528");
  c.restore();
}
/** One member of the marching band: white and burnt orange, a tall hat with a plume, a horn or a drum, stepping on the beat. */
function marcher(c, x, y, t, i) {
  const up = Math.sin(t * 6.9 + (i % 2) * Math.PI) > 0, kind = i % 4;
  ell(c, x, y + 1, 7, 2, "rgba(0,0,0,.3)");
  B(c, x - 4, y - 10 + (up ? -2 : 0), 3, 10 - (up ? -2 : 0), "#f4f1e6"); B(c, x + 1, y - 10 + (up ? 0 : -2), 3, 10 - (up ? 0 : -2), "#f4f1e6");
  B(c, x - 5, y - 22, 10, 13, "#bf5700", "#e87a1e", "#8a3f00"); R(c, x - 5, y - 17, 10, 2, "#fff");
  disc(c, x, y - 26, 4.5, INK); disc(c, x, y - 26, 3.5, ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"][i % 4]);
  B(c, x - 4, y - 36, 8, 8, "#f4f1e6", "#fff"); R(c, x - 1, y - 43, 2, 7, "#bf5700"); R(c, x - 5, y - 29, 10, 2, "#16121f");
  if (kind === 3) { B(c, x + 3, y - 20, 9, 8, "#f4f1e6", "#fff", "#c9d3e6"); R(c, x + 3, y - 20, 9, 2, "#bf5700"); R(c, x + 5, y - 24 - (up ? 3 : 0), 2, 5, "#5a3a1e"); }
  else { B(c, x + 3, y - 24, 9, 3, "#f6c945", "#ffe58a"); disc(c, x + 13, y - 23, kind === 0 ? 6 : 4, INK); disc(c, x + 13, y - 23, kind === 0 ? 5 : 3, "#f6c945"); disc(c, x + 13, y - 23, kind === 0 ? 2.5 : 1.5, "#a8820f"); }
}
/** The band on the field. It marches in as rows, then closes into the letters of a word. */
export function band(c, t, e, word = "TEXAS") {
  const GLYPH = { T: ["111", "010", "010", "010", "010"], E: ["111", "100", "110", "100", "111"], X: ["101", "101", "010", "101", "101"], A: ["010", "101", "111", "101", "101"], S: ["111", "100", "111", "001", "111"] };
  const spots = []; word.split("").forEach((ch, n) => (GLYPH[ch] || []).forEach((row, ry) => row.split("").forEach((on, rx) => { if (on === "1") spots.push([92 + n * 96 + rx * 26, 196 + ry * 30]); })));
  const p = Math.max(0, Math.min(1, (e - 2.5) / 3)), ease = p * p * (3 - 2 * p);
  spots.map((sp, i) => { const sx = -40 + ((e * 70 + i * 14) % 720), sy = 200 + (i % 6) * 26; return [sx + (sp[0] - sx) * ease, sy + (sp[1] - sy) * ease, i]; })
    .sort((a, b) => a[1] - b[1]).forEach(([x, y, i]) => marcher(c, x, y, t, i));
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
  RB(c, -18, -50, 15, 48, pants, null, null, 4); RB(c, 3, -50, 15, 48, pants, null, null, 4); RB(c, -22, -6, 21, 8, "#2a2233", "#4a4058", null, 3); RB(c, 1, -6, 21, 8, "#2a2233", "#4a4058", null, 3);
  RB(c, -24, -104, 48, 58, shirt, sl, sd, 9);
  if (o.suit) { c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-8, -104); c.lineTo(8, -104); c.lineTo(0, -66); c.fill(); B(c, -3, -100, 6, 30, o.tie || "#1d3c8f", lighten(o.tie || "#1d3c8f")); c.fillStyle = sd; c.beginPath(); c.moveTo(-8, -104); c.lineTo(-2, -74); c.lineTo(-16, -96); c.fill(); c.beginPath(); c.moveTo(8, -104); c.lineTo(2, -74); c.lineTo(16, -96); c.fill(); }
  if (o.number) { c.fillStyle = "#fff"; c.font = "16px 'Press Start 2P', monospace"; c.textAlign = "center"; c.fillText(o.number, 0, -66); c.textAlign = "left"; }
  const up = o.armUp ? 1 : 0, wave = o.wave ? Math.sin(o.wave * 9) * 6 : 0;
  RB(c, -34, -102, 11, 40, shirt, sl, sd, 5); RB(c, -34, -64, 11, 11, skin, null, null, 5);
  c.save(); c.translate(29, -98); c.rotate(up ? -2.5 + wave * 0.03 : 0); RB(c, -6, 0, 11, 40, shirt, sl, sd, 5); RB(c, -6, 38, 11, 11, skin, null, null, 5); if (o.mic) { B(c, -3, 46, 6, 20, "#222"); disc(c, 0, 68, 7, INK); disc(c, 0, 68, 6, "#888"); } c.restore();
  B(c, -6, -112, 12, 10, darken(skin, 0.12));
  if (o.helmet) { disc(c, 0, -134, 27, INK); disc(c, 0, -134, 25, o.helmet); disc(c, -9, -144, 9, lighten(o.helmet, 0.55)); B(c, 4, -134, 22, 18, "#16121f"); R(c, 6, -130, 20, 2, "#c9d3e6"); R(c, 6, -123, 20, 2, "#c9d3e6"); if (o.dot) star(c, -9, -132, 10, o.dot, "#0a1030"); }
  else if (o.face) { c.fillStyle = INK; c.fillRect(-23, -161, 46, 52); c.drawImage(o.face, -21, -159, 42, 48); }
  else {
    // A round head with two dots and a small mouth. Andrew, 2026-11-14: "People
    // shouldn't be squares, but then also have nicely defined eyebrows ... find
    // a happy medium." A mood is a mark over the head, not a drawn expression.
    ell(c, 0, -133, 22.5, 25.5, INK); ell(c, 0, -133, 21, 24, skin); ell(c, -6, -142, 9, 7, lighten(skin, 0.12));
    if (o.bald) { ell(c, -20, -134, 5, 9, hair); ell(c, 20, -134, 5, 9, hair); }
    else { c.fillStyle = hair; c.beginPath(); c.ellipse(0, -137, 22, 22, 0, Math.PI, 0); c.fill(); c.fillStyle = lighten(hair, 0.2); c.beginPath(); c.ellipse(-5, -146, 10, 6, 0, 0, Math.PI * 2); c.fill(); }
    if (o.swept) { c.fillStyle = hair; c.beginPath(); c.moveTo(-22, -140); c.quadraticCurveTo(0, -176, 24, -146); c.lineTo(21, -138); c.quadraticCurveTo(0, -156, -22, -136); c.fill(); }
    if (o.long) { RB(c, -27, -144, 9, 54, hair, lighten(hair, 0.2), null, 4); RB(c, 18, -144, 9, 54, hair, lighten(hair, 0.2), null, 4); }
    if (o.pony) { RB(c, 18, -158, 14, 9, hair, null, null, 4); RB(c, 26, -152, 8, 30, hair, null, null, 4); }
    if (o.cap) { c.fillStyle = INK; c.beginPath(); c.ellipse(0, -143, 24, 19, 0, Math.PI, 0); c.fill(); c.fillStyle = o.cap; c.beginPath(); c.ellipse(0, -143, 22.5, 17.5, 0, Math.PI, 0); c.fill(); RB(c, 2, -146, 32, 5, o.cap, null, null, 2); }
    if (o.hat) { RB(c, -34, -152, 68, 7, o.hat, lighten(o.hat), null, 3); RB(c, -19, -176, 38, 26, o.hat, lighten(o.hat), darken(o.hat), 8); R(c, -19, -158, 38, 5, "#3a2a1e"); }
    const ey = -134, lk = o.look || 0;
    disc(c, -8 + lk, ey, 2.6, INK); disc(c, 8 + lk, ey, 2.6, INK);
    if (o.glasses) { c.strokeStyle = "#3a3a44"; c.lineWidth = 2; c.beginPath(); c.arc(-8, ey, 7, 0, 7); c.stroke(); c.beginPath(); c.arc(8, ey, 7, 0, 7); c.stroke(); R(c, -1, ey - 1, 2, 2, "#3a3a44"); }
    if (o.shades === "on") { RB(c, -16, ey - 5, 14, 10, "#16121f", "#3a3a55", null, 3); RB(c, 2, ey - 5, 14, 10, "#16121f", "#3a3a55", null, 3); R(c, -2, ey - 2, 4, 2, "#16121f"); }
    if (o.shades === "down") { RB(c, -16, ey + 7, 14, 8, "#16121f", "#3a3a55", null, 3); RB(c, 2, ey + 7, 14, 8, "#16121f", "#3a3a55", null, 3); R(c, -2, ey + 9, 4, 2, "#16121f"); }
    if (o.mustache) RB(c, -9, -124, 18, 5, hair, null, null, 2);
    c.strokeStyle = "#7a3b2a"; c.lineWidth = 2; c.beginPath();
    if (o.grin) c.arc(0, -124, 8, Math.PI * 0.1, Math.PI * 0.9); else if (o.sad || o.angry) { c.moveTo(-5, -119); c.lineTo(5, -119); } else c.arc(0, -124, 6, Math.PI * 0.2, Math.PI * 0.8);
    c.stroke();
    if (o.tan) { ell(c, -14, -127, 4, 2.5, "rgba(200,90,60,.3)"); ell(c, 14, -127, 4, 2.5, "rgba(200,90,60,.3)"); }
    if (o.angry) { c.strokeStyle = "#e0342b"; c.lineWidth = 3; [[30, -168], [38, -160]].forEach(([mx, my], k) => { c.beginPath(); c.moveTo(mx - 5, my - 5 + k * 0); c.lineTo(mx + 5, my + 5); c.moveTo(mx + 5, my - 5); c.lineTo(mx - 5, my + 5); c.stroke(); }); }
    if (o.sad) { c.fillStyle = "#6fc3f5"; c.beginPath(); c.moveTo(30, -166); c.quadraticCurveTo(22, -150, 30, -148); c.quadraticCurveTo(38, -150, 30, -166); c.fill(); }
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
  returner: { skin: "#8a5a3a", shirt: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6", number: "5" },
  you: { skin: "#e8b98a", hair: "#3a2a1e", shirt: "#e2622a", number: "1" },
};
export function cast(c, who, x, y, s = 1, extra = {}) { if (who === "jerry") jerry(c, x, y, s, extra); else if (CAST[who]) person(c, x, y, who === "nephew" ? s * 0.7 : s, { ...CAST[who], ...extra }); }

// The sideline up close, for the halftime questions: the team on the bench,
// the cooler, the field behind them.
export function sideline(c, t, where, face) {
  if (where === "park") { park(c, t, { field: false }); B(c, 20, 206, 440, 10, "#a0703f", "#c08a52", "#7a5230"); ["uncle", "sister", "cousin", "brother", "nephew"].forEach((k, i) => cast(c, k, 70 + i * 88, 216, 0.6, { armUp: false, angry: false })); B(c, 20, 150, 46, 36, "#2f6fc4", "#5fa8e6", "#1d3c8f"); B(c, 15, 142, 56, 10, "#fff"); leaves(c, t, 40); }
  else { const tx = where === "texas"; stadium(c, t, { team: tx ? "texas" : "dallas" }); B(c, 20, 206, 460, 10, "#c9d3e6", "#eef2f8", "#8793bd"); for (let i = 0; i < 5; i++) person(c, 70 + i * 96, 216, 0.6, { ...CAST.kicker, ...(tx ? { shirt: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6", dot: "" } : {}), number: String(11 + i * 13), skin: ["#e8b98a", "#8a5a3a", "#c98a5a"][i % 3] }); B(c, 30, 150, 40, 34, "#e2622a", "#f08a4b", "#a8551c"); B(c, 26, 143, 48, 9, "#fff"); }
  person(c, 560, 226, 0.9, { ...CAST.you, face, shirt: where === "dallas" ? "#1b2440" : where === "texas" ? "#bf5700" : "#e2622a", number: where === "park" ? "1" : "", armUp: true, wave: t });
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
