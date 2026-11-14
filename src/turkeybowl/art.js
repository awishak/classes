// Turkey Bowl's pictures: every backdrop, person, food and play, drawn in
// rectangles on a 320 by 180 canvas and scaled up with hard pixels.
//
// Andrew, 2026-11-14: "I want you to actually have graphics and stuff and
// make it look like you're scoring ... at the park, leaves and stuff like
// that. I want it to look like Thanksgiving. I want it to feel like
// Thanksgiving ... really fun, like Tecmo Bowl." And for Dallas: "no logo,
// but just make it a blue star on silver background. And make it look like
// Jerry Jones, please." Nothing here is an official mark; the star is a
// plain five-point star.

export const W = 320, H = 180;
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const rnd = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

export function star(c, cx, cy, r, col) {
  c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}

// ─── leaves, falling over every outdoor scene at the park ───
const LEAF = ["#e2622a", "#f0a030", "#c9402a", "#f6c945", "#a8551c"];
export function leaves(c, t, n = 34, ground = 150) {
  for (let i = 0; i < n; i++) {
    const speed = 9 + rnd(i) * 14, sway = 6 + rnd(i + 9) * 10;
    const y = ((t * speed + rnd(i + 3) * 400) % (ground + 20)) - 10;
    const x = (rnd(i + 5) * (W + 40) - 20 + Math.sin(t * 1.3 + i) * sway + t * 4) % (W + 20);
    c.fillStyle = LEAF[i % LEAF.length];
    const f = Math.floor(t * 4 + i) % 2;
    c.fillRect(Math.round(x), Math.round(y), f ? 3 : 2, f ? 2 : 3);
  }
}

function tree(c, x, base, s, i) {
  R(c, x - 2 * s, base - 16 * s, 4 * s, 16 * s, "#5a3a1e");
  const cols = [LEAF[i % 5], LEAF[(i + 1) % 5], LEAF[(i + 3) % 5]];
  [[0, -26, 13], [-9, -20, 10], [9, -21, 10], [-3, -33, 9], [5, -30, 8]].forEach(([dx, dy, r], k) => {
    c.fillStyle = cols[k % 3]; c.beginPath(); c.arc(x + dx * s, base + dy * s, r * s, 0, Math.PI * 2); c.fill();
  });
}

// ─── backdrops ───
export function park(c, t, { dawn = false, field = true } = {}) {
  const g = c.createLinearGradient(0, 0, 0, 92);
  if (dawn) { g.addColorStop(0, "#27325c"); g.addColorStop(1, "#e98d5a"); } else { g.addColorStop(0, "#8fc7ee"); g.addColorStop(1, "#fbe3b5"); }
  c.fillStyle = g; c.fillRect(0, 0, W, 92);
  c.fillStyle = dawn ? "#ffd9a0" : "#fff6c9"; c.beginPath(); c.arc(dawn ? 60 : 262, dawn ? 84 : 28, 13, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#c98a4a"; c.beginPath(); c.moveTo(0, 92); for (let x = 0; x <= W; x += 16) c.lineTo(x, 78 + Math.sin(x * 0.05) * 6); c.lineTo(W, 92); c.fill();
  for (let i = 0; i < 9; i++) tree(c, 14 + i * 38 + (i % 2) * 6, 94, 0.8 + (i % 3) * 0.12, i);
  R(c, 0, 92, W, 88, "#5b9a44");
  for (let i = 0; i < 8; i++) if (i % 2) R(c, 0, 92 + i * 11, W, 11, "#549040");
  if (field) { c.fillStyle = "rgba(255,255,255,.55)"; for (let x = 20; x < W; x += 40) c.fillRect(x, 96, 1, 80); R(c, 0, 96, W, 1, "rgba(255,255,255,.55)"); R(c, 0, 176, W, 1, "rgba(255,255,255,.55)"); }
  for (let i = 0; i < 46; i++) R(c, rnd(i + 40) * W, 96 + rnd(i + 70) * 80, 2, 2, LEAF[i % 5]);
}

export function kitchen(c, t) {
  R(c, 0, 0, W, H, "#1c2340");
  R(c, 0, 120, W, 60, "#3a2a22");
  R(c, 196, 22, 78, 56, "#0d1230"); R(c, 196, 22, 78, 3, "#6b5a4a"); R(c, 196, 75, 78, 3, "#6b5a4a"); R(c, 196, 22, 3, 56, "#6b5a4a"); R(c, 271, 22, 3, 56, "#6b5a4a"); R(c, 234, 22, 2, 56, "#6b5a4a");
  c.fillStyle = "#f4f1d0"; c.beginPath(); c.arc(254, 40, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = "#0d1230"; c.beginPath(); c.arc(258, 38, 7, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 9; i++) if (Math.floor(t * 2 + i) % 5) R(c, 202 + rnd(i) * 62, 28 + rnd(i + 2) * 40, 1, 1, "#fff");
  R(c, 40, 30, 44, 26, "#0b0f1d"); c.fillStyle = "#ff5a3c"; c.font = "10px 'Press Start 2P', monospace"; c.fillText(Math.floor(t * 2) % 2 ? "4:00" : "4 00", 43, 48);
  R(c, 30, 112, 260, 10, "#7a5230"); R(c, 30, 122, 260, 4, "#5a3a1e"); R(c, 44, 126, 8, 54, "#5a3a1e"); R(c, 268, 126, 8, 54, "#5a3a1e");
  [["potato", 62], ["turkey", 122], ["cranberry", 182], ["pie", 242]].forEach(([k, x]) => { c.save(); c.translate(x - 8, 94); c.scale(1.2, 1.2); food(c, k); c.restore(); });
}

export function stadium(c, t, { lights = true, midfield = false } = {}) {
  R(c, 0, 0, W, H, "#0a1030");
  for (let row = 0; row < 9; row++) for (let i = 0; i < 80; i++) {
    const k = row * 80 + i, on = (Math.floor(t * 3 + rnd(k) * 9) % 7) !== 0;
    R(c, i * 4 + (row % 2) * 2, 10 + row * 6, 3, 4, on ? ["#1d3c8f", "#c9d3e6", "#2a56c6", "#8793bd", "#e8ecf5"][Math.floor(rnd(k + 1) * 5)] : "#101a44");
  }
  R(c, 110, 4, 100, 34, "#05070f"); R(c, 112, 6, 96, 30, "#16224f");
  star(c, 160, 20, 9, "#2a56c6"); c.fillStyle = "#c9d3e6"; c.font = "6px 'Press Start 2P', monospace"; c.fillText("DALLAS", 118, 33);
  if (lights) for (const x of [14, 306]) { R(c, x - 1, 0, 2, 64, "#39406b"); R(c, x - 8, 0, 16, 6, "#fff8d0"); const g = c.createRadialGradient(x, 4, 2, x, 4, 70); g.addColorStop(0, "rgba(255,248,208,.28)"); g.addColorStop(1, "rgba(255,248,208,0)"); c.fillStyle = g; c.fillRect(x - 70, 0, 140, 90); }
  R(c, 0, 64, W, 6, "#c9d3e6"); R(c, 0, 66, W, 2, "#1d3c8f");
  R(c, 0, 70, W, 110, "#2f9e52");
  for (let i = 0; i < 8; i++) if (i % 2) R(c, i * 40, 70, 40, 110, "#2a9049");
  c.fillStyle = "rgba(255,255,255,.8)"; for (let x = 0; x <= W; x += 40) c.fillRect(x, 72, 1, 104); R(c, 0, 72, W, 1, "rgba(255,255,255,.8)"); R(c, 0, 176, W, 1, "rgba(255,255,255,.8)");
  if (midfield) { c.fillStyle = "#c9d3e6"; c.beginPath(); c.ellipse(160, 124, 30, 18, 0, 0, Math.PI * 2); c.fill(); c.save(); c.translate(160, 124); c.scale(1, 0.62); star(c, 0, 0, 22, "#1d3c8f"); c.restore(); }
}

export function locker(c, t) {
  R(c, 0, 0, W, H, "#1a2038");
  for (let i = 0; i < 8; i++) { R(c, 6 + i * 39, 16, 35, 96, "#3b4670"); R(c, 8 + i * 39, 18, 31, 92, "#2b3558"); R(c, 12 + i * 39, 26, 23, 2, "#1a2038"); R(c, 12 + i * 39, 31, 23, 2, "#1a2038"); R(c, 33 + i * 39, 60, 3, 8, "#c9d3e6"); }
  star(c, 160, 62, 14, "#c9d3e6"); star(c, 160, 62, 10, "#1d3c8f");
  R(c, 0, 112, W, 68, "#55607f"); R(c, 20, 136, 280, 8, "#8a6a44"); R(c, 30, 144, 6, 22, "#3b2e1e"); R(c, 284, 144, 6, 22, "#3b2e1e");
}

export function sky(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#3d7fd0"); g.addColorStop(1, "#bfe3ff"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) { const x = ((rnd(i) * 420 - t * (10 + i * 4)) % 420 + 420) % 420 - 60, y = 20 + rnd(i + 4) * 140; c.fillStyle = "rgba(255,255,255,.92)"; [[0, 0, 14], [14, 3, 11], [-13, 4, 10], [4, -6, 10]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill(); }); }
}
export function plane(c, x, y) {
  R(c, x, y, 70, 12, "#eef2f8"); R(c, x + 66, y + 2, 10, 8, "#eef2f8"); R(c, x + 74, y + 4, 5, 5, "#eef2f8");
  R(c, x + 58, y + 3, 12, 4, "#27325c"); for (let i = 0; i < 7; i++) R(c, x + 10 + i * 6, y + 3, 3, 3, "#7fd3ff");
  R(c, x - 6, y - 12, 12, 14, "#1d3c8f"); star(c, x, y - 5, 4, "#c9d3e6"); R(c, x + 22, y + 10, 26, 5, "#c9d3e6"); R(c, x - 8, y + 4, 12, 4, "#c9d3e6"); R(c, x, y + 10, 70, 2, "#1d3c8f");
}

// ─── food and drink, 16 by 16, for the buttons and the table ───
export function food(c, kind) {
  if (kind === "potato") { R(c, 1, 9, 14, 5, "#d8dde6"); R(c, 2, 14, 12, 1, "#aeb6c4"); R(c, 2, 5, 7, 5, "#fff6d8"); R(c, 3, 4, 5, 2, "#fff6d8"); R(c, 5, 5, 2, 2, "#f6c945"); R(c, 9, 6, 5, 4, "#f6a528"); R(c, 10, 5, 3, 2, "#f6a528"); R(c, 10, 7, 1, 1, "#fbd76a"); R(c, 12, 8, 1, 1, "#fbd76a"); }
  else if (kind === "turkey") { R(c, 3, 4, 8, 8, "#a8551c"); R(c, 4, 3, 6, 10, "#a8551c"); R(c, 5, 5, 3, 3, "#c97a35"); R(c, 10, 9, 3, 2, "#f1e3c6"); R(c, 12, 10, 3, 3, "#f1e3c6"); R(c, 13, 9, 2, 2, "#fff"); }
  else if (kind === "cranberry") { R(c, 4, 2, 8, 12, "#b01e3a"); R(c, 4, 2, 8, 2, "#c9d3e6"); R(c, 4, 12, 8, 2, "#c9d3e6"); R(c, 4, 5, 8, 1, "#8e1730"); R(c, 4, 8, 8, 1, "#8e1730"); R(c, 6, 6, 4, 2, "#fff"); }
  else if (kind === "pie") { c.fillStyle = "#d9772a"; c.beginPath(); c.moveTo(1, 12); c.lineTo(14, 12); c.lineTo(9, 4); c.closePath(); c.fill(); R(c, 1, 12, 14, 2, "#c9a06a"); R(c, 7, 2, 4, 3, "#fff"); R(c, 8, 1, 2, 2, "#fff"); R(c, 11, 9, 4, 4, "#6b3f1e"); R(c, 12, 8, 3, 1, "#8a5a30"); }
  else if (kind === "water") { R(c, 5, 3, 6, 11, "#dff3ff"); R(c, 5, 6, 6, 8, "#7fd3ff"); R(c, 4, 3, 1, 11, "#fff"); R(c, 11, 3, 1, 11, "#fff"); R(c, 4, 14, 8, 1, "#fff"); }
  else if (kind === "sparkling") { R(c, 5, 3, 6, 11, "#dff3ff"); R(c, 5, 6, 6, 8, "#aee6ff"); R(c, 6, 8, 1, 1, "#fff"); R(c, 9, 10, 1, 1, "#fff"); R(c, 7, 12, 1, 1, "#fff"); R(c, 4, 3, 1, 11, "#fff"); R(c, 11, 3, 1, 11, "#fff"); R(c, 4, 14, 8, 1, "#fff"); R(c, 9, 2, 4, 3, "#7ad04a"); R(c, 10, 3, 2, 1, "#d6f5a8"); }
  else if (kind === "coffee") { for (let i = 0; i < 3; i++) { R(c, 1 + i * 5, 8, 4, 6, "#fff"); R(c, 1 + i * 5, 8, 4, 2, "#5a3a1e"); R(c, 2 + i * 5, 4 - (i % 2), 1, 3, "#c9d3e6"); } }
  else if (kind === "champagne") { R(c, 6, 2, 5, 7, "#f6e7a8"); R(c, 6, 2, 5, 2, "#fffbe0"); R(c, 8, 9, 1, 4, "#fff"); R(c, 6, 13, 5, 1, "#fff"); R(c, 7, 4, 1, 1, "#fff"); R(c, 9, 6, 1, 1, "#fff"); R(c, 12, 1, 1, 1, "#f6e7a8"); R(c, 13, 3, 1, 1, "#f6e7a8"); }
}
export const FOOD_OF = { breakfast: { best: "potato", good: "turkey", bad: "cranberry", silly: "pie" }, jet: { best: "water", good: "sparkling", bad: "coffee", over: "champagne" } };

// ─── a player on the field, about 9 by 14 ───
export function player(c, x, y, o = {}, frame = 0) {
  const { jersey = "#e2622a", pants = "#3a4a66", skin = "#e8b98a", hair = "#5a3a1e", helmet = "", dir = 1, small = false, down = false } = o;
  const s = small ? 0.8 : 1, X = Math.round(x), Y = Math.round(y);
  c.save(); c.translate(X, Y); c.scale(dir * s, s);
  c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(-5, 0, 10, 2);
  if (down) { R(c, -7, -4, 12, 4, jersey); R(c, 5, -4, 4, 4, helmet || hair); R(c, -9, -3, 3, 3, pants); c.restore(); return; }
  const step = frame % 2;
  R(c, -3, -5, 2, 5 - step * 2, pants); R(c, 1, -5, 2, 3 + step * 2, pants); R(c, -3 + (step ? 0 : -1), -1 - step * 2 + 1, 3, 1, "#111"); R(c, 1, -2 + step * 2, 3, 1, "#111");
  R(c, -4, -11, 8, 6, jersey); R(c, 4, -10 + step, 2, 4, skin); R(c, -6, -10 + (1 - step), 2, 4, skin);
  if (helmet) { R(c, -3, -16, 7, 6, helmet); R(c, 2, -13, 3, 2, "#111"); R(c, -3, -17, 5, 1, helmet); if (o.dot) R(c, -1, -15, 2, 2, o.dot); }
  else { R(c, -3, -15, 6, 5, skin); R(c, -3, -16, 6, 2, hair); R(c, -4, -15, 1, 3, hair); if (o.long) R(c, -4, -15, 2, 7, hair); R(c, 1, -13, 1, 1, "#111"); }
  c.restore();
}
export function ball(c, x, y) { R(c, x - 2, y - 1, 5, 3, "#8a4b1e"); R(c, x - 1, y - 2, 3, 5, "#8a4b1e"); R(c, x - 1, y, 3, 1, "#fff"); }

// ─── people up close, for the scenes with a question in them ───
function person(c, x, y, s, o) {
  const { skin = "#e8b98a", hair = "#5a3a1e", shirt = "#e2622a", pants = "#3a4a66" } = o;
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(s, s);
  c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(-12, 0, 24, 3);
  R(c, -8, -22, 6, 22, pants); R(c, 2, -22, 6, 22, pants); R(c, -9, -2, 8, 3, "#222"); R(c, 1, -2, 8, 3, "#222");
  R(c, -11, -46, 22, 26, shirt);
  if (o.suit) { R(c, -3, -46, 6, 20, "#fff"); R(c, -1, -44, 2, 14, o.tie || "#1d3c8f"); c.fillStyle = shirt; c.beginPath(); c.moveTo(-3, -46); c.lineTo(-1, -34); c.lineTo(-7, -46); c.fill(); c.beginPath(); c.moveTo(3, -46); c.lineTo(1, -34); c.lineTo(7, -46); c.fill(); }
  if (o.number) { c.fillStyle = "#fff"; c.font = "bold 10px 'Outfit', sans-serif"; c.textAlign = "center"; c.fillText(o.number, 0, -29); c.textAlign = "left"; }
  const armUp = o.armUp ? -16 : 0;
  R(c, -15, -45, 5, 18, shirt); R(c, -15, -28, 5, 5, skin);
  R(c, 10, -45 + armUp, 5, 18, shirt); R(c, 10, -28 + armUp * 2.2, 5, 5, skin);
  R(c, -3, -50, 6, 5, skin);
  if (o.helmet) { R(c, -9, -66, 18, 17, o.helmet); R(c, 1, -58, 9, 7, "#111"); R(c, 2, -57, 7, 1, "#c9d3e6"); R(c, 2, -54, 7, 1, "#c9d3e6"); if (o.dot) star(c, -3, -59, 4, o.dot); }
  else {
    R(c, -8, -64, 16, 15, skin);
    if (o.bald) R(c, -9, -60, 2, 6, hair), R(c, 7, -60, 2, 6, hair), R(c, -7, -66, 14, 2, hair);
    else { R(c, -9, -67, 18, 6, hair); R(c, -9, -64, 2, 8, hair); R(c, 7, -64, 2, 8, hair); }
    if (o.long) { R(c, -11, -64, 4, 22, hair); R(c, 7, -64, 4, 22, hair); }
    if (o.pony) R(c, 8, -66, 6, 4, hair), R(c, 12, -64, 3, 12, hair);
    if (o.cap) { R(c, -9, -68, 18, 5, o.cap); R(c, 2, -64, 12, 2, o.cap); }
    if (o.hat) { R(c, -14, -68, 28, 3, o.hat); R(c, -8, -76, 16, 9, o.hat); R(c, -8, -70, 16, 2, "#111"); }
    R(c, -5, -59, 2, 2, "#111"); R(c, 3, -59, 2, 2, "#111");
    if (o.glasses) { R(c, -7, -61, 6, 5, "rgba(255,255,255,.35)"); R(c, 1, -61, 6, 5, "rgba(255,255,255,.35)"); c.strokeStyle = "#444"; c.lineWidth = 1; c.strokeRect(-6.5, -60.5, 5, 4); c.strokeRect(1.5, -60.5, 5, 4); R(c, -1, -59, 2, 1, "#444"); }
    if (o.shades === "on") { R(c, -7, -61, 6, 4, "#111"); R(c, 1, -61, 6, 4, "#111"); R(c, -1, -60, 2, 1, "#111"); }
    if (o.shades === "down") { R(c, -7, -56, 6, 3, "#111"); R(c, 1, -56, 6, 3, "#111"); R(c, -1, -55, 2, 1, "#111"); }
    if (o.mustache) R(c, -4, -55, 8, 2, hair);
    if (o.angry) { R(c, -6, -62, 4, 1, "#111"); R(c, 2, -62, 4, 1, "#111"); R(c, -3, -53, 6, 2, "#7a1f1f"); }
    else if (o.sad) R(c, -3, -52, 6, 1, "#7a3b2a");
    else { R(c, -4, -54, 8, 1, "#7a3b2a"); if (o.grin) R(c, -4, -53, 8, 2, "#fff"); }
  }
  if (o.mic) { R(c, 14, -52, 3, 10, "#222"); R(c, 13, -56, 5, 5, "#888"); }
  if (o.pin) star(c, -7, -40, 3, "#1d3c8f");
  c.restore();
}
// Jerry Jones as a cartoon: silver hair swept back, glasses, a tan, a wide
// grin, a dark suit and a blue star on a silver pin.
export function jerry(c, x, y, s = 1, hat = false) {
  person(c, x, y, s, { skin: "#d9a06c", hair: "#e3e6ea", shirt: "#1b2440", pants: "#1b2440", suit: true, tie: "#1d3c8f", glasses: true, grin: true, hat: hat ? "#e8dcc0" : "" });
  c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(s, s); R(c, -9, -42, 6, 6, "#c9d3e6"); star(c, -6, -39, 3, "#1d3c8f"); R(c, -8, -57, 3, 1, "#b07a4a"); R(c, 5, -57, 3, 1, "#b07a4a"); c.restore();
}
// The woman who walks by the park: blonde, sunglasses, a long coat. Andrew
// asked for her by description.
export function passerby(c, x, y, s, shades) { person(c, x, y, s, { skin: "#f0c8a0", hair: "#f3d67a", shirt: "#7a2f4a", pants: "#2a2a3a", long: true, shades }); }

export const CAST = {
  uncle: { skin: "#d9a06c", hair: "#3a2a1e", shirt: "#a8551c", mustache: true, cap: "#27325c" },
  brother: { skin: "#e8b98a", hair: "#5a3a1e", shirt: "#e2622a", angry: true, number: "7" },
  sister: { skin: "#e8b98a", hair: "#5a3a1e", shirt: "#e2622a", pony: true, armUp: true, number: "12" },
  cousin: { skin: "#c98a5a", hair: "#1e1410", shirt: "#f0a030", long: true, sad: true },
  nephew: { skin: "#e8b98a", hair: "#a8551c", shirt: "#e2622a", number: "9" },
  crowd: { skin: "#c98a5a", hair: "#1e1410", shirt: "#4a7ad0", armUp: true },
  receiver: { skin: "#8a5a3a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "88", armUp: true },
  reporter: { skin: "#f0c8a0", hair: "#7a3b2a", shirt: "#b01e3a", long: true, mic: true },
  kicker: { skin: "#e8b98a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "3" },
  backup: { skin: "#c98a5a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "14" },
  you: { skin: "#e8b98a", hair: "#3a2a1e", shirt: "#e2622a", number: "1" },
};
export function cast(c, who, x, y, s = 1) { if (who === "jerry") jerry(c, x, y, s); else if (CAST[who]) person(c, x, y, s, who === "nephew" ? { ...CAST[who] } : CAST[who]); }

export function chute(c, x, y, t) {
  c.fillStyle = "#e2622a"; c.beginPath(); c.arc(x, y - 26, 20, Math.PI, 0); c.fill(); c.fillStyle = "#f6c945"; c.beginPath(); c.arc(x, y - 26, 20, Math.PI * 1.25, Math.PI * 1.5); c.lineTo(x, y - 26); c.fill(); c.beginPath(); c.arc(x, y - 26, 20, Math.PI * 1.75, 0); c.lineTo(x, y - 26); c.fill();
  c.strokeStyle = "#fff"; c.lineWidth = 1; [-20, -8, 8, 20].forEach(dx => { c.beginPath(); c.moveTo(x + dx, y - 26); c.lineTo(x, y - 6); c.stroke(); });
  player(c, x, y + 8, { jersey: "#e2622a", hair: "#3a2a1e" }, Math.floor(t * 4));
}

// ─── a play, drawn from its script: who lines up where, and what happens ───
const TEAMS = {
  park: { us: { jersey: "#e2622a", pants: "#3a4a66" }, them: { jersey: "#6a4bb0", pants: "#2a2a3a" } },
  dallas: { us: { jersey: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f" }, them: { jersey: "#b01e3a", pants: "#f1e3c6", helmet: "#f6c945" } },
};
const HAIRS = ["#5a3a1e", "#1e1410", "#f3d67a", "#a8551c", "#e3e6ea"], SKINS = ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"];
const ease = (p) => p * p * (3 - 2 * p), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** One frame of a play. p runs 0 to 1. play is { call, look, good, td, yards, pick }. */
export function drawPlay(c, t, p, play, where) {
  if (where === "park") park(c, t); else stadium(c, t);
  const top = where === "park" ? 100 : 80, mid = top + 44, team = TEAMS[where];
  const los = 96, end = play.td ? 300 : clamp(los + play.yards * 3.2, 70, 286);
  if (play.td) { R(c, 286, top - 4, 34, 84, where === "park" ? "rgba(226,98,42,.55)" : "rgba(29,60,143,.75)"); R(c, 285, top - 4, 2, 84, "#fff"); }
  const U = (i) => ({ ...team.us, hair: HAIRS[i % 5], skin: SKINS[i % 4], long: where === "park" && i % 3 === 1, small: where === "park" && i === 4 });
  const T = (i) => ({ ...team.them, hair: HAIRS[(i + 2) % 5], skin: SKINS[(i + 1) % 4], dir: -1 });
  const snap = clamp(p / 0.12, 0, 1), go = ease(clamp((p - 0.12) / 0.7, 0, 1)), fr = Math.floor(t * 9);
  // the line
  for (let i = 0; i < 4; i++) player(c, los - 2 + go * 6, top + 14 + i * 16, U(i), p > 0.12 && p < 0.8 ? fr : 0);
  // the defense, set by the look
  const look = play.look, dy = look === "spread" ? 18 : 13, dx0 = look === "deep" ? 150 : look === "stack" ? 14 : look === "blitz" ? 18 : 30;
  const carrierY = play.call === "run" ? mid + 6 : top + 6;
  const ballX = play.call === "run" ? (go < 0.15 ? los - 20 + go * 60 : los - 11 + (end - los + 11) * ((go - 0.15) / 0.85)) : 0;
  for (let i = 0; i < 5; i++) {
    const home = { x: los + dx0 + (i % 2) * (look === "deep" ? 60 : 8), y: top + (look === "spread" ? 2 : 12) + i * dy };
    let x = home.x, y = home.y;
    if (look === "blitz") x = home.x - go * (play.call === "pass" ? 40 : 26);
    if (play.call === "run") { const tx = play.good ? end + 4 : los - 6; x = home.x + (tx - home.x) * go * (play.good ? 0.86 : 1); y = home.y + (carrierY - home.y) * go * 0.9; }
    else if (!play.good && i === 2) { x = home.x + (clamp(end, los + 30, 280) - home.x) * go; y = home.y + (top + 6 - home.y) * go; }
    const downed = p > 0.86 && play.call === "run" && play.good && !play.td && i < 2;
    player(c, x, y, { ...T(i), down: play.td && p > 0.7 && i < 3 }, downed ? 0 : fr + i);
  }
  if (play.call === "run") {
    // quarterback hands off, the back runs
    player(c, los - 20, mid, { ...U(5), dir: 1 }, 0);
    const stuffed = !play.good;
    const x = stuffed ? los - 18 + go * 12 : ballX, y = carrierY + Math.sin(go * 9) * (stuffed ? 1 : 3);
    player(c, x, y, { ...U(6), down: (stuffed && p > 0.7) || (!play.td && play.good && p > 0.9) }, fr);
    if (!(stuffed && p > 0.7)) ball(c, x + 4, y - 7);
    if (play.td && p > 0.8) for (let i = 0; i < 4; i++) player(c, 292 + i * 6, top + 20 + i * 14 - Math.abs(Math.sin(t * 9 + i)) * 6, U(i), fr + i);
  } else {
    // quarterback drops back, the receiver runs the route, the ball goes up
    const qx = los - 20 - snap * 12 - go * 4; player(c, qx, mid, U(5), p < 0.4 ? fr : 0);
    const rx = los + 4 + (clamp(end, los + 30, 300) - los - 4) * ease(clamp((p - 0.1) / 0.6, 0, 1)), ry = top + 6;
    const thrown = clamp((p - 0.38) / 0.34, 0, 1), caught = p >= 0.72;
    const after = play.good && caught ? ease(clamp((p - 0.72) / 0.28, 0, 1)) * (play.td ? 300 - clamp(end, los + 30, 300) + 8 : 8) : 0;
    player(c, rx + after, ry, U(7), fr);
    if (p > 0.38 && !caught) { const bx = qx + (rx - qx) * thrown, by = mid - 8 + (ry - 8 - mid + 8) * thrown - Math.sin(thrown * Math.PI) * 34; ball(c, bx, by); }
    else if (caught && play.good) ball(c, rx + after + 4, ry - 7);
    else if (caught && play.pick) ball(c, clamp(end, los + 30, 280) - (p - 0.72) * 120, top + 6 - 7);
    else if (caught) ball(c, rx + 8, ry + 2 + (p - 0.72) * 30);
    if (p <= 0.38) ball(c, qx + 4, mid - 7);
  }
  if (where === "park") leaves(c, t, 26);
}
