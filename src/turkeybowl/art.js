// Turkey Bowl's pictures, third pass: people, players, the band, the turkey,
// and the cut scenes' kit. The places are in venues.js and the shapes they
// are all made of are in draw.js. Everything is drawn in code; there are no
// image files except a player's own photograph, which becomes their face.
//
// Andrew, 2026-11-14, on the first pass: "this is a little too 8 bit. I
// actually want it to be better graphics ... let's do 16 bit graphics." And:
// "I want the animations to be ridiculous. I need more ridiculousness."
// 2026-11-15: "please make the graphics a hundred times better," with nine
// pictures to work from, "use them all." Jerry Jones below is drawn from the
// photograph: no glasses, a high forehead, white hair swept back, big ears, a
// wide smile with deep lines around it, a dark suit, a striped navy tie and a
// pin on the lapel. The players on the field are the thick-shouldered figures
// of a 1998 console football game, each with a long shadow. The band wears
// what the Texas band wears: burnt orange, a white fringed yoke, a white hat.

import { W, H, TAU, INK, LEAF, rnd, clamp, clock, mix, lighten, darken, alpha, pen, R, disc, ell, shape, poly, oval, box, B, limb, line, inside, vgrad, glow, star, leaf, PLAY, proj } from "./draw.js";
import { park, stadium } from "./venues.js";
export { W, H, lighten, darken, star, setScale, proj, PLAY, VENUE } from "./draw.js";
export * from "./venues.js";

const FONT = (n) => n + "px 'Press Start 2P', monospace";
const pale = (col) => { const v = [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16)); return v[0] + v[1] + v[2] > 560; };

// ─── leaves in the air ───
export function leaves(c, t, n = 60, floor = 330) {
  for (let i = 0; i < n; i++) {
    const speed = 22 + rnd(i) * 30, sway = 12 + rnd(i + 9) * 22, depth = 0.6 + rnd(i + 14) * 0.9;
    const y = ((t * speed * depth + rnd(i + 3) * 900) % (floor + 40)) - 20;
    const x = ((rnd(i + 5) * (W + 80) - 40 + Math.sin(t * 1.3 + i) * sway + t * 9) % (W + 60)) - 20;
    leaf(c, x, y, 4.2 * depth, LEAF[i % LEAF.length], t * (1 + rnd(i + 2) * 3) + i, 0.35 + 0.65 * Math.abs(Math.sin(t * (1.5 + rnd(i + 6) * 2) + i)));
  }
}

// ─── people up close: feet at (x, y), about 160 tall at s = 1 ───
const headPath = (j = 0) => (g) => { g.moveTo(-24, -4); g.bezierCurveTo(-24, -37, 24, -37, 24, -4); g.bezierCurveTo(24, 14, 12 + j, 27, 0, 27); g.bezierCurveTo(-12 - j, 27, -24, 14, -24, -4); };
/** Hair that hangs behind the head, drawn before the body. */
function backHair(c, o, hair) {
  if (o.face || o.helmet) return;
  if (o.long) shape(c, hair, (g) => { g.moveTo(-26, -8); g.bezierCurveTo(-30, -44, 30, -44, 26, -8); g.bezierCurveTo(31, 14, 31, 34, 25, 46); g.lineTo(-25, 46); g.bezierCurveTo(-31, 34, -31, 14, -26, -8); });
  if (o.pony) { shape(c, hair, (g) => { g.moveTo(16, -24); g.bezierCurveTo(44, -30, 48, 0, 38, 30); g.bezierCurveTo(34, 36, 28, 30, 30, 22); g.bezierCurveTo(34, 4, 30, -8, 18, -12); g.closePath(); }); shape(c, "#f6c945", oval(25, -18, 3.4, 5.4, 0.5), pen.w * 0.7); }
  if (o.bun) { shape(c, hair, oval(0, -34, 11, 9.5)); ell(c, -3, -37, 4.5, 3, lighten(hair, 0.3)); }
}
/** A head, with the middle of the face at (0, 0): about 48 wide and 60 tall. */
function head(c, o, skin, hair) {
  const k = pen.w, kd = darken(skin, 0.18), j = o.jaw ? 5 : 0, hp = headPath(j);
  const browCol = o.brow || (pale(hair) ? "#8f96a3" : darken(hair, 0.35));
  const ears = o.ears || 1;
  if (o.face) {   // a photograph for a face: an oval of it, inked
    for (const sx of [-1, 1]) shape(c, skin, oval(sx * 23.5, 2, 4.6, 7));
    shape(c, skin, hp); inside(c, hp, (g) => g.drawImage(o.face, -25, -34, 50, 62));
    c.strokeStyle = INK; c.lineWidth = k; c.beginPath(); hp(c); c.stroke();
  } else {
    if (!o.helmet) for (const sx of [-1, 1]) { shape(c, skin, oval(sx * 24, 2, 5 * ears, 7.5 * ears)); ell(c, sx * 24.4, 2.4, 2.2 * ears, 4 * ears, kd); }
    shape(c, skin, hp);
    inside(c, hp, (g) => {
      g.fillStyle = "rgba(120,40,20,.13)"; g.beginPath(); g.rect(-40, -40, 80, 80); g.ellipse(-7, -5, 25, 30, 0, 0, TAU); g.fill("evenodd");
      ell(g, -9, -17, 10, 6, "rgba(255,255,255,.14)");
      const blush = o.tan ? "rgba(214,84,60,.3)" : "rgba(230,100,90,.2)"; ell(g, -14, 9, 5.6, 3.6, blush); ell(g, 14, 9, 5.6, 3.6, blush);
      if (o.sick) { g.fillStyle = "rgba(110,170,70,.4)"; g.fillRect(-30, -40, 60, 80); }
    });
    // eyes
    const ey = -2, lk = clamp(o.look || 0, -3, 3) * 0.9, mad = o.angry, sad = o.sad && !mad, big = o.shock, squint = (o.squint && !big) || (o.grin && o.old && !big);
    for (const sx of [-1, 1]) {
      const ex = sx * 9.6;
      if (o.blink || squint) { c.strokeStyle = INK; c.lineWidth = k * 1.3; c.beginPath(); if (squint && !o.blink) c.arc(ex, ey + 2.4, 5, Math.PI * 1.15, Math.PI * 1.85); else c.arc(ex, ey - 3, 5, Math.PI * 0.2, Math.PI * 0.8); c.stroke(); continue; }
      const ry = big ? 8 : 6.3, rx = big ? 6.6 : 5.6;
      shape(c, "#fff", oval(ex, ey, rx, ry), k * 0.7);
      inside(c, oval(ex, ey, rx, ry), (g) => {
        disc(g, ex + lk, ey + (sad ? 1.4 : 0.4), big ? 2.3 : 3.5, o.eyes || "#4a3222"); disc(g, ex + lk, ey + (sad ? 1.4 : 0.4), big ? 1.2 : 1.8, INK); disc(g, ex + lk - 1.2, ey - 1.2, 1.1, "#fff");
        if (mad) { g.fillStyle = skin; g.beginPath(); g.moveTo(ex - sx * 8, ey - 10); g.lineTo(ex + sx * 8, ey - 10); g.lineTo(ex + sx * 8, ey - 5.5); g.lineTo(ex - sx * 8, ey - 0.5); g.fill(); }
        if (sad) { g.fillStyle = skin; g.beginPath(); g.moveTo(ex - sx * 8, ey - 10); g.lineTo(ex + sx * 8, ey - 10); g.lineTo(ex + sx * 8, ey - 1); g.lineTo(ex - sx * 8, ey - 5); g.fill(); }
      });
      c.strokeStyle = INK; c.lineWidth = k * 1.2; c.beginPath();
      if (mad) { c.moveTo(ex - sx * 6.4, ey - 1.6); c.lineTo(ex + sx * 6, ey - 5.6); } else if (sad) { c.moveTo(ex - sx * 6, ey - 5); c.lineTo(ex + sx * 6.4, ey - 1.6); } else c.ellipse(ex, ey, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
      if (o.lash) line(c, [[ex + sx * 5, ey - 2.4], [ex + sx * 8, ey - 4.6]], k, INK);
    }
    // brows carry the mood
    for (const sx of [-1, 1]) {
      const a = mad ? [[sx * 16, -15], [sx * 4.4, -8.4]] : sad ? [[sx * 16, -9], [sx * 5, -14.5]] : big ? [[sx * 15.5, -15], [sx * 10, -18.5], [sx * 4.6, -16]] : o.grin ? [[sx * 15.5, -11.5], [sx * 10, -14.5], [sx * 4.6, -12.5]] : [[sx * 15.5, -10], [sx * 10, -12.4], [sx * 4.6, -11]];
      line(c, a, o.old ? 3.6 : 2.9, browCol);
    }
    // nose
    c.strokeStyle = darken(skin, 0.34); c.lineWidth = k * 1.1; c.beginPath(); c.moveTo(1.6, 0); c.quadraticCurveTo(o.old ? 8 : 6, 8, 0.6, 9.4); c.stroke(); if (o.old) ell(c, 1.5, 7, 5.2, 3.4, "rgba(200,90,70,.2)");
    if (o.old) { c.strokeStyle = "rgba(110,50,30,.5)"; c.lineWidth = k * 0.9; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 7.4, 7.4); c.quadraticCurveTo(sx * 13.4, 12, sx * 11.4, 19); c.stroke(); c.beginPath(); c.moveTo(sx * 16, -3); c.lineTo(sx * 20, -5); c.moveTo(sx * 16, 0); c.lineTo(sx * 20.4, 0.4); c.stroke(); } c.beginPath(); c.moveTo(-9, -21); c.quadraticCurveTo(0, -23, 9, -21); c.moveTo(-7, -25.5); c.quadraticCurveTo(0, -27, 7, -25.5); c.stroke(); }
    // mouth
    const lip = o.lash ? "#b8404a" : "#7a3b2a";
    if (o.shock) { shape(c, "#5a1e1e", oval(0, 17, 5, 6.6), k * 0.8); ell(c, 0, 20, 2.8, 2, "#e0707a"); }
    else if (o.talk) { shape(c, "#5a1e1e", oval(0, 16, 6.4, 5), k * 0.8); inside(c, oval(0, 16, 6.4, 5), (g) => { R(g, -7, 10, 14, 3.2, "#fff"); ell(g, 0, 20, 4, 2.4, "#e0707a"); }); }
    else if (mad) { shape(c, "#fff", box(-8, 12.5, 16, 6.4, 2), k * 0.8); c.strokeStyle = INK; c.lineWidth = k * 0.6; c.beginPath(); for (const xx of [-4, 0, 4]) { c.moveTo(xx, 12.5); c.lineTo(xx, 19); } c.moveTo(-8, 15.7); c.lineTo(8, 15.7); c.stroke(); }
    else if (o.grin) { const m = (g) => { g.moveTo(-11, 11.5); g.quadraticCurveTo(0, 15, 11, 11.5); g.quadraticCurveTo(0, 26.5, -11, 11.5); }; shape(c, "#fff", m, k * 0.8); inside(c, m, (g) => { ell(g, 0, 24, 8, 4, "#7a1e1e"); g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = 0.6; g.beginPath(); for (const xx of [-6, -2, 2, 6]) { g.moveTo(xx, 11); g.lineTo(xx, 20); } g.stroke(); }); }
    else { c.strokeStyle = lip; c.lineWidth = k * 1.3; c.beginPath(); if (sad) { c.moveTo(-6, 18); c.quadraticCurveTo(0, 13, 6, 18); } else { c.moveTo(-6.4, 14); c.quadraticCurveTo(0, 19.4, 6.4, 14); } c.stroke(); }
    if (o.mustache) shape(c, hair, (g) => { g.moveTo(0, 8.6); g.bezierCurveTo(8, 6.6, 14, 10, 15, 15.4); g.bezierCurveTo(9, 14, 4, 14, 0, 12.4); g.bezierCurveTo(-4, 14, -9, 14, -15, 15.4); g.bezierCurveTo(-14, 10, -8, 6.6, 0, 8.6); }, k * 0.8);
    // hair
    if (!o.helmet && !o.cap && !o.hat) {
      if (o.bald) { for (const sx of [-1, 1]) shape(c, hair, (g) => { g.moveTo(sx * 25, 0); g.bezierCurveTo(sx * 29, -10, sx * 25, -20, sx * 19, -24); g.bezierCurveTo(sx * 21, -14, sx * 21, -6, sx * 22, 0); g.closePath(); }, k * 0.8); ell(c, -8, -24, 8, 4, "rgba(255,255,255,.3)", -0.3); }
      else {
        const hl = o.receding ? -25 : -14, vol = o.swept ? 8 : 2;
        const hpth = (g) => { g.moveTo(-25.4, -1); g.bezierCurveTo(-29, -40 - vol, 29, -40 - vol, 25.4, -1); g.lineTo(22, hl + 7); g.quadraticCurveTo(10, hl - 3, -5, hl); g.quadraticCurveTo(-17, hl + 2, -22, hl + 8); g.closePath(); };
        shape(c, hair, hpth);
        inside(c, hpth, (g) => { g.strokeStyle = lighten(hair, pale(hair) ? 0.5 : 0.22); g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i < 6; i++) { g.moveTo(-20 + i * 7, -8); g.quadraticCurveTo(-12 + i * 7, -36, 6 + i * 7, -34); } g.stroke(); g.strokeStyle = darken(hair, 0.18); g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(-16 + i * 7, -10); g.quadraticCurveTo(-9 + i * 7, -32, 9 + i * 7, -30); } g.stroke(); });
      }
    }
    if (o.long && !o.helmet) for (const sx of [-1, 1]) shape(c, hair, (g) => { g.moveTo(sx * 25, -6); g.bezierCurveTo(sx * 30, 6, sx * 30, 26, sx * 24, 40); g.bezierCurveTo(sx * 19, 30, sx * 21, 10, sx * 21, -2); g.closePath(); }, k * 0.8);
    if (o.glasses) { c.strokeStyle = "#2a2a34"; c.lineWidth = k * 1.5; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 9.6, ey, 8.4, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(sx * 18, ey - 1); c.lineTo(sx * 24, ey - 3); c.stroke(); ell(c, sx * 9.6 - 2.4, ey - 3, 2.6, 1.2, "rgba(255,255,255,.55)", -0.6); } c.beginPath(); c.moveTo(-1.6, ey - 1); c.quadraticCurveTo(0, ey - 3, 1.6, ey - 1); c.stroke(); }
    if (o.shades) { const dy = o.shades === "down" ? 10 : 0; for (const sx of [-1, 1]) { shape(c, "#16121f", box(sx * 9.6 - 8, ey - 5.4 + dy, 16, 11, 4), k * 0.7); line(c, [[sx * 9.6 - 5, ey - 2 + dy], [sx * 9.6 - 1, ey - 3.4 + dy]], 1.6, "rgba(255,255,255,.5)"); } R(c, -2, ey - 2 + dy, 4, 2, "#16121f"); }
  }
  if (o.cap) {
    const cp = (g) => { g.moveTo(-25.6, -11); g.bezierCurveTo(-28, -43, 28, -43, 25.6, -11); g.quadraticCurveTo(0, -17, -25.6, -11); };
    for (const sx of [-1, 1]) R(c, sx * 23 - 2, -11, 4, 7, hair);
    shape(c, o.cap, cp); inside(c, cp, (g) => { ell(g, -8, -30, 12, 7, "rgba(255,255,255,.16)"); g.fillStyle = "rgba(0,0,0,.16)"; g.fillRect(8, -44, 22, 34); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -36); g.lineTo(0, -14); g.stroke(); });
    shape(c, darken(o.cap, 0.12), (g) => { g.moveTo(-22, -12); g.quadraticCurveTo(4, -19, 30, -11); g.quadraticCurveTo(36, -7, 30, -5.4); g.quadraticCurveTo(4, -11.4, -22, -8.6); g.closePath(); }); disc(c, 0, -36.4, 2.2, darken(o.cap, 0.25));
  }
  if (o.hat) {   // a cowboy hat
    shape(c, o.hat, (g) => { g.moveTo(-46, -17); g.bezierCurveTo(-30, -8, 30, -8, 46, -17); g.bezierCurveTo(40, -25, 28, -22, 20, -21); g.lineTo(-20, -21); g.bezierCurveTo(-28, -22, -40, -25, -46, -17); });
    shape(c, o.hat, (g) => { g.moveTo(-20, -19); g.bezierCurveTo(-23, -50, -9, -50, 0, -44); g.bezierCurveTo(9, -50, 23, -50, 20, -19); g.closePath(); });
    inside(c, box(-22, -26, 44, 7), (g) => R(g, -22, -26, 44, 6, "#5a3a22")); ell(c, -9, -40, 5, 4, "rgba(255,255,255,.3)");
  }
  if (o.helmet) {
    const hc = o.helmet, shell = (g) => { g.moveTo(-19, 22); g.bezierCurveTo(-34, 16, -35, -42, 0, -42); g.bezierCurveTo(35, -42, 34, 16, 19, 22); g.lineTo(17, 8); g.bezierCurveTo(19, -16, 12, -17, 0, -17); g.bezierCurveTo(-12, -17, -19, -16, -17, 8); g.closePath(); };
    shape(c, hc, shell);
    inside(c, shell, (g) => { ell(g, -13, -29, 10, 6, "rgba(255,255,255,.5)", -0.5); g.fillStyle = "rgba(0,0,0,.14)"; g.fillRect(14, -44, 22, 70); R(g, -3.4, -44, 6.8, 28, o.dot || darken(hc, 0.3)); R(g, -1, -44, 2, 28, "rgba(255,255,255,.4)"); });
    if (o.dot) for (const sx of [-1, 1]) star(c, sx * 24, -8, 5, o.dot);
    const bar = "#dfe6ee"; c.lineCap = "round";
    limb(c, [[-18, 9], [-12, 13], [12, 13], [18, 9]], 2.6, bar, k * 0.7); limb(c, [[-17, 18], [-11, 22], [11, 22], [17, 18]], 2.6, bar, k * 0.7); limb(c, [[0, 13], [0, 26]], 2.6, bar, k * 0.7); limb(c, [[-9, 13], [-10, 23]], 2.2, bar, k * 0.6); limb(c, [[9, 13], [10, 23]], 2.2, bar, k * 0.6);
  }
  // marks over the head for a mood
  if (o.angry) { c.strokeStyle = "#e0342b"; c.lineWidth = 2.6; c.lineCap = "round"; const ax = 30, ay = -36; c.beginPath(); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => { c.moveTo(ax + dx * 2.4, ay + dy * 7); c.quadraticCurveTo(ax + dx * 2.4, ay + dy * 2.4, ax + dx * 7, ay + dy * 2.4); }); c.stroke(); }
  if (o.sweat) shape(c, "#9fdcff", (g) => { g.moveTo(-31, -22); g.quadraticCurveTo(-37, -10, -31, -8); g.quadraticCurveTo(-25, -10, -31, -22); }, k * 0.7);
  if (o.sad && !o.angry) shape(c, "#8fd3ff", (g) => { g.moveTo(-12.6, 5); g.quadraticCurveTo(-16.6, 13, -12.6, 15); g.quadraticCurveTo(-8.6, 13, -12.6, 5); }, k * 0.6);
}
export function person(c, x, y, s, o) {
  const { skin = "#e8b98a", hair = "#5a3a1e", shirt = "#e2622a", pants = "#3a4a66" } = o;
  const pads = !!o.helmet, suit = !!o.suit, long = suit || o.sleeves || o.blazer, sw = pads ? 33 : 26, waist = pads ? 23 : 21;
  const sd = darken(shirt, 0.28), kd = darken(skin, 0.18), bob = Math.sin(clock() * 2.1 + x * 0.07) * 0.7;
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = c.lineJoin = "round";
  const pw = pen.w; pen.w = 1.5 / Math.pow(Math.max(0.3, s), 0.5); const k = pen.w;
  ell(c, 0, 2, 36, 6, "rgba(0,0,0,.28)");
  c.save(); c.translate(0, -134 + bob); backHair(c, o, hair); c.restore();
  // legs and shoes
  for (const sx of [-1, 1]) {
    limb(c, [[sx * 10, -56], [sx * 11, -10]], 15, pants); line(c, [[sx * 6, -50], [sx * 7.4, -14]], 3, "rgba(0,0,0,.13)");
    if (pads) { limb(c, [[sx * 11, -24], [sx * 11, -10]], 12.4, "#f4f1e6"); R(c, sx * 11 - 6.2, -22, 12.4, 2.4, shirt); }
    const shoe = suit ? "#16121f" : pads ? "#f4f1e6" : "#f4f1e6";
    shape(c, shoe, (g) => { g.moveTo(sx * 2, -10); g.lineTo(sx * 2, 0); g.lineTo(sx * 24, 0); g.quadraticCurveTo(sx * 26, -8, sx * 15, -10.4); g.closePath(); });
    if (!suit) { R(c, Math.min(sx * 2, sx * 24), -2.4, 22, 2.4, pads ? "#16121f" : "#c9c2ae"); line(c, [[sx * 9, -8], [sx * 15, -8]], 2, pads ? "#16121f" : shirt); } else ell(c, sx * 17, -6.4, 4, 1.6, "rgba(255,255,255,.3)");
  }
  // the body
  const torso = (g) => { g.moveTo(-sw, -98 + bob); g.quadraticCurveTo(-sw, -109 + bob, -sw + 10, -110 + bob); g.lineTo(sw - 10, -110 + bob); g.quadraticCurveTo(sw, -109 + bob, sw, -98 + bob); g.lineTo(waist, -56); g.quadraticCurveTo(0, -50, -waist, -56); g.closePath(); };
  shape(c, shirt, torso);
  inside(c, torso, (g) => {
    if (o.plaid) { g.fillStyle = "rgba(0,0,0,.16)"; for (let xx = -32; xx < 34; xx += 11) g.fillRect(xx, -112, 4, 66); for (let yy = -108; yy < -48; yy += 11) g.fillRect(-36, yy, 72, 4); g.fillStyle = "rgba(255,230,160,.2)"; for (let xx = -27; xx < 34; xx += 11) g.fillRect(xx, -112, 1.4, 66); }
    g.fillStyle = "rgba(0,0,0,.15)"; g.beginPath(); g.moveTo(sw + 2, -112); g.quadraticCurveTo(6, -82, sw - 4, -48); g.lineTo(sw + 6, -48); g.fill();
    ell(g, -sw + 11, -101 + bob, 9, 5, "rgba(255,255,255,.17)"); R(g, -sw, -60, sw * 2, 2, "rgba(0,0,0,.16)");
    if (pads) { R(g, -sw, -99 + bob, sw * 2, 2.4, "rgba(255,255,255,.75)"); R(g, -sw, -95 + bob, sw * 2, 1.4, "rgba(255,255,255,.75)"); }
  });
  const ny = -110 + bob;
  if (suit || o.blazer) {
    shape(c, "#fff", poly([[-9, ny], [9, ny], [0, -74]]), k * 0.7);
    if (suit) { const tie = o.tie || "#1d3c8f", blade = poly([[-3.2, ny + 6], [3.2, ny + 6], [4.6, -78], [0, -71], [-4.6, -78]]); shape(c, tie, blade, k * 0.7); if (o.stripes) inside(c, blade, (g) => { g.strokeStyle = lighten(tie, 0.45); g.lineWidth = 1.5; g.beginPath(); for (let yy = ny; yy < -64; yy += 6) { g.moveTo(-6, yy + 6); g.lineTo(6, yy); } g.stroke(); }); shape(c, darken(tie, 0.15), poly([[-3.4, ny + 1], [3.4, ny + 1], [2.6, ny + 7], [-2.6, ny + 7]]), k * 0.7); }
    for (const sx of [-1, 1]) { shape(c, "#fff", poly([[sx * 9, ny - 1], [sx * 2.4, ny + 8], [sx * 11, ny + 9]]), k * 0.7); shape(c, sd, poly([[sx * 10, ny + 1], [sx * 1, -74], [sx * 16, -92 + bob], [sx * 13, -100 + bob]]), k * 0.7); }
    line(c, [[0, -74], [0, -53]], k, INK); disc(c, 2.6, -66, 1.5, INK);
    if (suit) R(c, 11, -93 + bob, 7, 2.4, "#fff");
  } else if (!pads) {
    c.strokeStyle = sd; c.lineWidth = 2.6; c.beginPath(); c.arc(0, ny, 8.4, 0.1, Math.PI - 0.1); c.stroke();
    if (o.polo) { for (const sx of [-1, 1]) shape(c, lighten(shirt, 0.12), poly([[sx * 8.4, ny], [sx * 1, ny + 9], [sx * 12, ny + 8]]), k * 0.7); line(c, [[0, ny + 9], [0, ny + 20]], k, sd); disc(c, 0, ny + 14, 1.1, "#fff"); }
  }
  if (o.pearls) for (let i = -3; i <= 3; i++) disc(c, i * 2.7, ny + 7.4 - Math.abs(i) * 0.9, 1.5, "#fff8ee");
  if (o.number) { c.font = FONT(pads ? 24 : 16); c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = sd; c.strokeText(o.number, 1, pads ? -62 : -66); c.fillStyle = "#fff"; c.fillText(o.number, 1, pads ? -62 : -66); c.textAlign = "left"; }
  if (o.pin) { shape(c, "#c9d3e6", oval(-13, -89 + bob, 5.4, 5.4), k * 0.7); star(c, -13, -89 + bob, 4, "#1d3c8f"); }
  // arms
  const hand = (hx, hy, sx) => { shape(c, skin, oval(hx, hy, 6, 6.6)); ell(c, hx - sx * 4, hy - 1, 2.4, 3.4, skin); };
  const hang = (sx) => { const S = [sx * (sw - 3), -100 + bob], E = [sx * (sw + 4), -80], Hd = [sx * (sw + 3), -61]; if (long) { limb(c, [S, E, Hd], 11.4, shirt); if (suit) R(c, Hd[0] - 6, Hd[1] + 2, 12, 2.4, "#fff"); } else { limb(c, [E, Hd], 9, skin); limb(c, [S, [sx * (sw + 3.6), -84]], 12.4, shirt); } hand(Hd[0], Hd[1] + 6, sx); };
  hang(-1);
  if (o.mic) {
    const S = [sw - 3, -100 + bob], E = [sw + 7, -82], Hd = [sw - 12, -102 + bob];
    limb(c, [S, E, Hd], 11.4, long ? shirt : skin); if (!long) limb(c, [S, [sw + 5, -86]], 12.4, shirt);
    B(c, Hd[0] - 3, Hd[1] - 20, 6, 22, "#2a2a34", null, null, 2); shape(c, "#9aa0aa", oval(Hd[0], Hd[1] - 24, 6.6, 7.4)); for (let i = -1; i <= 1; i++) line(c, [[Hd[0] - 5, Hd[1] - 24 + i * 3.4], [Hd[0] + 5, Hd[1] - 24 + i * 3.4]], 0.8, "rgba(0,0,0,.35)"); hand(Hd[0], Hd[1], 1);
  } else if (o.armUp) {
    const wv = o.wave ? Math.sin(o.wave * 9) * 7 : 0, S = [sw - 3, -100 + bob], E = [sw + 11, -113 + bob], Hd = [sw + 12 + wv, -140 + bob];
    if (long) limb(c, [S, E, Hd], 11.4, shirt); else { limb(c, [E, Hd], 9, skin); limb(c, [S, [sw + 9, -111 + bob]], 12.4, shirt); }
    for (let i = 0; i < 4; i++) limb(c, [[Hd[0] - 4.4 + i * 3, Hd[1] - 4], [Hd[0] - 6.6 + i * 4.4 + wv * 0.14, Hd[1] - 15 + Math.abs(i - 1.5) * 1.6]], 3.4, skin);
    limb(c, [[Hd[0] - 5, Hd[1] + 1], [Hd[0] - 10, Hd[1] - 4]], 3.4, skin); shape(c, skin, oval(Hd[0], Hd[1] - 1, 6.6, 6.6));
  } else hang(1);
  // neck and head
  if (!pads) shape(c, kd, box(-6.4, -117 + bob, 12.8, 11, 3));
  c.save(); c.translate(0, -134 + bob); if (o.tall) { c.translate(0, -3); c.scale(1.03, 1.12); } head(c, o, skin, hair); c.restore();
  pen.w = pw; c.restore();
}
// Jerry Jones, from the photograph: white hair swept back off a high forehead,
// no glasses, big ears, a tan, a wide smile with lines around it, a dark suit,
// a striped navy tie, a pin on the lapel.
export const jerry = (c, x, y, s = 1, extra = {}) => person(c, x, y, s, { skin: "#e3a27c", hair: "#eceef1", shirt: "#1d2238", pants: "#1d2238", suit: true, tie: "#1d3c8f", stripes: true, grin: true, swept: true, receding: true, old: true, jaw: true, tall: true, ears: 1.25, tan: true, pin: true, eyes: "#5a6a7a", ...extra });
export const CAST = {
  uncle: { skin: "#d9a06c", hair: "#3a2a1e", shirt: "#a8551c", mustache: true, cap: "#27325c", armUp: true, plaid: true, jaw: true },
  brother: { skin: "#e8b98a", hair: "#5a3a1e", shirt: "#e2622a", angry: true, number: "7", armUp: true },
  sister: { skin: "#e8b98a", hair: "#5a3a1e", shirt: "#e2622a", pony: true, armUp: true, number: "12", lash: true },
  cousin: { skin: "#c98a5a", hair: "#1e1410", shirt: "#f0a030", long: true, sad: true },
  niece: { skin: "#c98a5a", hair: "#3a2a1e", shirt: "#2f6fc4", pony: true, armUp: true, lash: true },
  nephew: { skin: "#e8b98a", hair: "#a8551c", shirt: "#e2622a", number: "9" },
  receiver: { skin: "#8a5a3a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "88", armUp: true },
  reporter: { skin: "#f0c8a0", hair: "#7a3b2a", shirt: "#b01e3a", long: true, mic: true, armUp: false, blazer: true, lash: true },
  kicker: { skin: "#e8b98a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "3" },
  backup: { skin: "#c98a5a", shirt: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f", number: "14" },
  returner: { skin: "#8a5a3a", shirt: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6", number: "5" },
  you: { skin: "#e8b98a", hair: "#3a2a1e", shirt: "#e2622a", number: "1" },
  coachA: { skin: "#c98a5a", hair: "#1e1410", shirt: "#1b2440", cap: "#1d3c8f", polo: true, jaw: true },
  coachB: { skin: "#f0c8a0", hair: "#e3e6ea", shirt: "#c9d3e6", glasses: true, bald: true, polo: true, old: true },
  grandma: { skin: "#f0c8a0", hair: "#e3e6ea", shirt: "#8a5ac0", pants: "#4a4058", glasses: true, bun: true, sleeves: true, pearls: true, old: true, lash: true },
};
export function cast(c, who, x, y, s = 1, extra = {}) { if (who === "jerry") jerry(c, x, y, s, extra); else if (CAST[who]) person(c, x, y, who === "nephew" ? s * 0.7 : s, { ...CAST[who], ...extra }); }
/** Somebody from the chest up, filling the screen: who is a CAST key or "jerry". */
export function bust(c, who, x, s, extra = {}) {
  s *= 1.3; const y = 168 + 133 * s;   // the head sits in the middle of the screen, and the shoulders run off the bottom
  cast(c, who, x, y, who === "nephew" ? s / 0.7 : s, extra);
}

// ─── a player on the field: feet at (x, y), about 50 tall at s = 1 ───
// Seen from behind when they are going away from the camera (dir 1), from the
// front when they are coming toward it (dir -1, or front: true). lift is how
// far off the ground they are, in screen units, so the shadow stays down.
export function player(c, x, y, o = {}, frame = 0) {
  const { jersey = "#e2622a", pants = "#3a4a66", skin = "#e8b98a", hair = "#5a3a1e", helmet = "", dir = 1, s = 1, down = false, arms = 0, lift = 0 } = o;
  const back = o.front ? false : dir > 0, st = down ? 0 : frame % 4, step = [0, 1, 0, -1][st], pads = !!helmet, sh = pads ? 10.6 : 8.4;
  c.save(); c.translate(x, y); c.scale(s * 1.2, s * 1.2); c.lineCap = c.lineJoin = "round"; const pw = pen.w; pen.w = 1;
  const g0 = lift / (s * 1.2);
  ell(c, 12, 5 + g0, 17, 4.6, "rgba(0,0,0,.3)", 0.32); ell(c, 0, 1 + g0, 9, 3, "rgba(0,0,0,.3)");
  if (o.ring) { c.strokeStyle = "#2f6bff"; c.lineWidth = 2.2; c.beginPath(); c.ellipse(0, 1 + g0, 15, 5.6, 0, 0, TAU); c.stroke(); c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 0.7; c.beginPath(); c.ellipse(0, 1 + g0, 15, 5.6, 0, 0, TAU); c.stroke(); }
  const up = step ? -1.2 : 0, dy = down ? 5 : 0, sock = pads ? "#f4f1e6" : skin, shoe = pads ? "#f4f1e6" : "#2a2233";
  c.translate(0, up);
  // legs
  for (const sx of [-1, 1]) {
    let hip = [sx * 4, -17 + dy], knee, foot;
    if (down) { knee = sx < 0 ? [-7, -3] : [7.4, -9.6]; foot = sx < 0 ? [-1, -0.6] : [7.4, -1]; }
    else if (step === sx) { knee = [sx * 5.4, -11.4]; foot = [sx * 5, -5.4]; }
    else { knee = [sx * 5.6, -9]; foot = [sx * 6.2, -1 - up]; }
    limb(c, [knee, foot], 4.8, sock); limb(c, [hip, knee], 6.4, pants); limb(c, [[foot[0] - 1.4, foot[1]], [foot[0] + 1.4, foot[1]]], 3.4, shoe);
  }
  c.translate(0, dy);
  // arms behind the body when they hang, in front when they are up
  const arm = (sx) => {
    const S = [sx * (sh - 1), -31];
    const [E, Hd] = arms ? [[sx * (sh + 3.4), -39], [sx * (sh + 1.4), -47.4]] : step ? [[sx * (sh + 2), -25], [sx * (sh + 1.4), -20 - step * sx * 4.4]] : [[sx * (sh + 2), -24.4], [sx * (sh + 1.6), -18]];
    limb(c, [E, Hd], 3.8, skin); limb(c, [S, E], 5, jersey); disc(c, Hd[0], Hd[1], 2.5, pads ? "#f4f1e6" : skin);
  };
  if (!arms) { arm(-1); arm(1); }
  const body = (g) => { g.moveTo(-sh, -30); g.quadraticCurveTo(-sh, -35, -sh + 4.4, -35); g.lineTo(sh - 4.4, -35); g.quadraticCurveTo(sh, -35, sh, -30); g.lineTo(sh - 1.4, -26); g.lineTo(5.6, -15.4); g.lineTo(-5.6, -15.4); g.lineTo(-sh + 1.4, -26); g.closePath(); };
  shape(c, jersey, body);
  inside(c, body, (g) => { g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(3.4, -36, 10, 22); g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(-sh, -35, 5, 5); if (pads) { g.fillStyle = "rgba(255,255,255,.9)"; g.fillRect(-4.4, -30.4, 3.4, 7.4); g.fillRect(1, -30.4, 3.4, 7.4); g.fillStyle = jersey; g.fillRect(-3.2, -28.8, 1, 4.2); g.fillRect(2.2, -28.8, 1, 1.4); } });
  if (arms) { arm(-1); arm(1); }
  // the head
  const hy = -40;
  if (helmet) {
    R(c, -2.4, -36, 4.8, 2.4, skin);
    shape(c, helmet, oval(0, hy, 7.6, 7.4));
    inside(c, oval(0, hy, 7.6, 7.4), (g) => { ell(g, -3, hy - 3.4, 3.4, 2.2, "rgba(255,255,255,.55)", -0.5); g.fillStyle = "rgba(0,0,0,.16)"; g.fillRect(3.4, hy - 8, 5, 16); R(g, -1.1, hy - 8, 2.2, back ? 16 : 6, o.dot || darken(helmet, 0.32)); });
    if (!back) { shape(c, "#16121f", box(-4.6, hy - 2.4, 9.2, 7.4, 2.4), 0.6); R(c, -3.2, hy - 1.6, 6.4, 2.6, skin); c.strokeStyle = "#dfe6ee"; c.lineWidth = 1; c.beginPath(); c.moveTo(-4.6, hy + 1.6); c.lineTo(4.6, hy + 1.6); c.moveTo(-4.4, hy + 3.8); c.lineTo(4.4, hy + 3.8); c.moveTo(0, hy + 1.6); c.lineTo(0, hy + 5); c.stroke(); }
  } else {
    R(c, -2.2, -36, 4.4, 2.6, darken(skin, 0.15));
    if (o.long) shape(c, hair, box(-8, hy - 3, 16, back ? 15 : 13, 5), 0.8);
    if (o.face && !back) { shape(c, skin, oval(0, hy, 7.2, 7.6)); inside(c, oval(0, hy, 7.2, 7.6), (g) => g.drawImage(o.face, -7.6, hy - 9, 15.2, 18.4)); c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.ellipse(0, hy, 7.2, 7.6, 0, 0, TAU); c.stroke(); }
    else {
      for (const sx of [-1, 1]) disc(c, sx * 7, hy + 0.6, 1.6, skin);
      shape(c, back ? hair : skin, oval(0, hy, 7, 7.4));
      if (back) { ell(c, -2.4, hy - 3, 3, 2, lighten(hair, 0.25), -0.4); R(c, -4, hy + 5, 8, 2.4, skin); }
      else { c.fillStyle = hair; c.beginPath(); c.ellipse(0, hy - 0.6, 7.3, 7.2, 0, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(0, hy - 5, -7.2, hy - 1); c.fill(); R(c, -3.4, hy, 1.6, 2, INK); R(c, 1.8, hy, 1.6, 2, INK); line(c, [[-1.6, hy + 4], [1.6, hy + 4]], 0.8, "#7a3b2a"); if (o.long) for (const sx of [-1, 1]) R(c, sx * 7 - 1.4, hy - 2, 2.8, 9, hair); }
    }
  }
  pen.w = pw; c.restore();
}
/** A football. s is its size; lift is how far it is off the ground in screen units, for the shadow. */
export function ball(c, x, y, tilt = 0, s = 1, lift = -1) {
  if (lift >= 0) ell(c, x + lift * 0.18, y + lift, 7 * s, 2.6 * s, `rgba(0,0,0,${clamp(0.34 - lift / 600, 0.12, 0.34)})`);
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(s, s);
  shape(c, "#8a4b1e", (g) => { g.moveTo(-9, 0); g.quadraticCurveTo(0, -8.4, 9, 0); g.quadraticCurveTo(0, 8.4, -9, 0); }, 1);
  ell(c, -1.6, -2, 4.4, 1.3, "#b8743a"); R(c, -3.2, -0.6, 6.4, 1.2, "#fff"); for (const xx of [-2, 0, 2]) R(c, xx - 0.4, -1.6, 0.8, 3.2, "#fff"); R(c, -6.4, -2.4, 1.1, 4.8, "rgba(255,255,255,.75)"); R(c, 5.3, -2.4, 1.1, 4.8, "rgba(255,255,255,.75)");
  c.restore();
}

// ─── the turkey ───
const fan = (c, n, spread, len, t) => { for (let i = -n; i <= n; i++) { c.save(); c.rotate(i * spread + Math.sin(t * 3 + i) * 0.03); shape(c, LEAF[(i + 12) % 6], (g) => { g.moveTo(-3.4, 0); g.quadraticCurveTo(-5.4, -len * 0.7, 0, -len); g.quadraticCurveTo(5.4, -len * 0.7, 3.4, 0); g.closePath(); }, 0.9); ell(c, 0, -len * 0.78, 2.2, 3.4, "#fff3c0"); disc(c, 0, -len * 0.78, 1.2, "#3a2a66"); c.restore(); } };
/** A turkey on the loose, for whenever things need to get stupid. */
export function turkey(c, x, y, t, dir = 1) {
  c.save(); c.translate(x, y); c.scale(dir, 1); const bob = Math.sin(t * 14) * 2, pw = pen.w; pen.w = 1;
  ell(c, 0, 1, 15, 3.4, "rgba(0,0,0,.28)");
  const leg = Math.sin(t * 14) * 4; for (const [lx, d] of [[-4 + leg, 1], [3 - leg, 1]]) { line(c, [[lx, -6], [lx, 0]], 1.8, "#f6a528"); line(c, [[lx - 2, 0], [lx + 3.4, 0]], 1.8, "#f6a528"); }
  c.save(); c.translate(-9, -17 + bob); c.rotate(-1.1); fan(c, 3, 0.26, 25, t); c.restore();
  shape(c, "#7a4a22", oval(0, -14 + bob, 14.4, 11.4)); ell(c, -3, -17 + bob, 8, 5, "#96602e"); shape(c, "#5a3418", oval(-2, -12 + bob, 8, 5.4, 0.3), 0.8);
  limb(c, [[9, -20 + bob], [13, -31 + bob]], 5.6, "#7a4a22"); shape(c, "#96602e", oval(14, -34 + bob, 5.6, 5.4));
  shape(c, "#f6c945", poly([[18, -35.4 + bob], [26, -33 + bob], [18, -31 + bob]]), 0.8); shape(c, "#d9291c", (g) => { g.moveTo(18, -32 + bob); g.quadraticCurveTo(22, -26 + bob, 18.4, -23 + bob); g.quadraticCurveTo(15.4, -27 + bob, 18, -32 + bob); }, 0.8);
  disc(c, 15.4, -35.6 + bob, 2, "#fff"); disc(c, 16, -35.6 + bob, 1, INK);
  pen.w = pw; c.restore();
}
/** A big turkey that dances. Andrew, 2026-11-14: "The turkey should do things
 * like the Macarena or the Dougie." The Macarena is the eight arm moves on
 * the beat with a hip sway and a quarter turn; the Dougie is the lean and the
 * hand across the head. kind is "macarena" or "dougie". */
export function turkeyDance(c, x, y, t, kind = "macarena", s = 2) {
  const beat = t * 2.2, step = Math.floor(beat) % 16, sway = Math.sin(beat * Math.PI) * (kind === "dougie" ? 9 : 4);
  const face = kind === "macarena" && Math.floor(beat / 16) % 2 ? -1 : 1;
  c.save(); c.translate(x + (kind === "dougie" ? sway : 0), y); c.scale(s * face, s); const pw = pen.w; pen.w = 1;
  ell(c, 0, 1, 17, 3.4, "rgba(0,0,0,.3)");
  const leg = Math.sin(beat * Math.PI) * 3; for (const lx of [-5 + leg, 4 - leg]) { line(c, [[lx, -6], [lx, 0]], 2.2, "#f6a528"); line(c, [[lx - 3, 0], [lx + 3.4, 0]], 2.2, "#f6a528"); }
  c.save(); c.translate(0, -17); c.rotate(sway * 0.01); fan(c, 4, 0.27, 31, t); c.restore();
  c.save(); c.rotate(kind === "dougie" ? sway * 0.02 : 0);
  shape(c, "#7a4a22", oval(sway * 0.3, -15, 14.6, 12.6)); ell(c, -3 + sway * 0.3, -19, 8, 5, "#96602e"); ell(c, sway * 0.3, -9, 9, 5, "#5a3418");
  // wings as arms: [left, right] angles for each of the eight Macarena moves, each held two beats
  const M = [[1.5, 0.2], [1.5, 1.5], [1.2, 1.5], [1.2, 1.2], [-2.4, 1.2], [-2.4, -2.4], [-0.5, -2.4], [-0.5, -0.5]];
  const pose = kind === "macarena" ? M[Math.floor(step / 2) % 8] : [(Math.sin(beat * Math.PI) > 0 ? -2.6 : 0.4), (Math.sin(beat * Math.PI) > 0 ? 0.4 : -2.6)];
  [[-12, pose[0], -1], [12, pose[1], 1]].forEach(([wx, ang, side]) => { c.save(); c.translate(wx + sway * 0.3, -20); c.rotate(side * (Math.PI / 2 - ang) * 0.7 + (side < 0 ? Math.PI : 0)); shape(c, "#5a3418", (g) => { g.moveTo(0, -3.4); g.lineTo(13, -3); g.lineTo(16, 0); g.lineTo(13, 1.4); g.lineTo(14.4, 3.4); g.lineTo(0, 3.4); g.closePath(); }); R(c, 2, -2.4, 9, 1.6, "#96602e"); c.restore(); });
  limb(c, [[0, -25], [0, -35]], 6, "#7a4a22"); shape(c, "#96602e", oval(0, -40, 6.6, 6.4));
  disc(c, -2.6, -41.6, 2, "#fff"); disc(c, 2.6, -41.6, 2, "#fff"); disc(c, -2.2, -41.4, 1, INK); disc(c, 3, -41.4, 1, INK);
  shape(c, "#f6c945", poly([[-2.4, -39], [2.4, -39], [0, -34]]), 0.7); shape(c, "#d9291c", (g) => { g.moveTo(1, -37); g.quadraticCurveTo(5, -32, 2, -29); g.quadraticCurveTo(-0.6, -32, 1, -37); }, 0.7);
  c.restore(); pen.w = pw; c.restore();
}

// ─── the band ───
/** One member of the band, from the front: burnt orange, a white yoke with fringe, a white hat, white shoes. kind 0 carries a sousaphone. */
function marcher(c, x, y, t, i, s = 1) {
  const up = Math.sin(t * 6.9 + (i % 2) * Math.PI) > 0, kind = i % 4, or = "#bf5700", pw = pen.w; pen.w = 0.9;
  c.save(); c.translate(x, y); c.scale(s, s);
  ell(c, 8, 3, 13, 3, "rgba(0,0,0,.3)", 0.3); ell(c, 0, 1, 7, 2.2, "rgba(0,0,0,.3)");
  if (kind === 0) { c.strokeStyle = INK; c.lineWidth = 5.4; c.beginPath(); c.ellipse(1, -19, 9.4, 12, 0.2, 0, TAU); c.stroke(); c.strokeStyle = "#f4f1e6"; c.lineWidth = 3.4; c.beginPath(); c.ellipse(1, -19, 9.4, 12, 0.2, 0, TAU); c.stroke(); shape(c, "#d9c48a", oval(8, -44, 11.4, 10.6)); ell(c, 8, -44, 8.4, 7.8, "#f2e2a6"); ell(c, 8.6, -43.4, 5, 4.6, "#b8862a"); ell(c, 9, -43, 2.4, 2.2, "#6a4a12"); ell(c, 4, -48, 3, 1.6, "rgba(255,255,255,.7)", -0.6); }
  for (const sx of [-1, 1]) { const lifted = (sx < 0) === up; limb(c, [[sx * 2.6, -12], [sx * 3, lifted ? -4 : -1]], 4.4, or); line(c, [[sx * 4.4, -11], [sx * 4.6, lifted ? -5 : -2]], 0.8, "#fff"); limb(c, [[sx * 3 - 1, lifted ? -3 : 0], [sx * 3 + 1.6, lifted ? -3 : 0]], 2.8, "#f4f1e6"); }
  shape(c, or, box(-5.6, -25, 11.2, 14, 2)); shape(c, "#f4f1e6", (g) => { g.moveTo(-5.6, -25); g.lineTo(5.6, -25); g.lineTo(5.6, -21); g.lineTo(0, -17.4); g.lineTo(-5.6, -21); g.closePath(); }, 0.7);
  for (let n = -2; n <= 2; n++) R(c, n * 2.2 - 0.4, -20 + Math.abs(n) * -0.8 + 1.6, 0.8, 2.4, "#f4f1e6");
  for (const sx of [-1, 1]) { limb(c, [[sx * 5.6, -23], [sx * 7.4, -17], [sx * 4, -15]], 3, or); disc(c, sx * 4, -15, 1.9, "#f4f1e6"); }
  shape(c, ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"][i % 4], oval(0, -29.4, 4, 4.2));
  shape(c, "#f4f1e6", oval(0, -32, 8.4, 2.2)); shape(c, "#f4f1e6", (g) => { g.moveTo(-4.4, -32); g.quadraticCurveTo(-4.6, -38, 0, -37); g.quadraticCurveTo(4.6, -38, 4.4, -32); g.closePath(); }); R(c, -4.4, -33.6, 8.8, 1.2, or);
  if (kind === 3) { shape(c, "#f4f1e6", box(-6, -15.4, 12, 7.4, 1.5)); R(c, -6, -15.4, 12, 1.6, or); R(c, -6, -9.6, 12, 1.6, or); line(c, [[-4, -17 - (up ? 3 : 0)], [-1, -15.4]], 1, "#5a3a1e"); line(c, [[4, -17 - (up ? 0 : 3)], [1, -15.4]], 1, "#5a3a1e"); }
  else if (kind) { limb(c, [[0, -27.4], [0, -19]], 2, "#f6c945", 0.6); shape(c, "#f6c945", oval(0, -18, 3.4, 3), 0.7); disc(c, 0, -18, 1.5, "#a8820f"); }
  c.restore(); pen.w = pw;
}
/** The band on the field, seen from the play camera. It marches in as rows, then closes into the letters of a word. */
export function band(c, t, e, word = "TEXAS") {
  const GLYPH = { T: ["111", "010", "010", "010", "010"], E: ["111", "100", "110", "100", "111"], X: ["101", "101", "010", "101", "101"], A: ["010", "101", "111", "101", "101"], S: ["111", "100", "111", "001", "111"] };
  const spots = []; word.split("").forEach((ch, n) => (GLYPH[ch] || []).forEach((row, ry) => row.split("").forEach((on, rx) => { if (on === "1") spots.push([452 - ry * 68, 268 + (n * 4 + rx - 9) * 8.6]); })));
  const p = clamp((e - 2.5) / 3, 0, 1), ease = p * p * (3 - 2 * p);
  // The last tuba is late: it runs in from the left after everyone else is set, and finishes the S.
  const last = spots.length - 1, lp = clamp((e - 6.2) / 1.2, 0, 1);
  spots.map((sp, i) => {
    if (i === last) return [sp[0], 96 + (sp[1] - 96) * lp, lp < 1 ? Math.abs(Math.sin(e * 16)) * 5 : 0, 0];
    const sx = 190 + (i % 6) * 46, sy = 120 + ((e * 34 + i * 9) % 300);
    return [sx + (sp[0] - sx) * ease, sy + (sp[1] - sy) * ease, 0, i];
  }).sort((a, b) => b[0] - a[0]).forEach(([wx, wy, hop, i]) => { const q = proj(wx, wy, hop); marcher(c, q.x, q.y, t, i, q.s * 0.56); });
}
export function fireworks(c, t, n = 5) {
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) { const ph = t * 0.9 + i * 0.37, life = ph % 1, x = 60 + rnd(i + Math.floor(ph)) * 520, y = 34 + rnd(i * 3 + Math.floor(ph)) * 110, col = ["#ffd75e", "#ff7b72", "#7fd3ff", "#6ee7a0", "#ffffff"][(i + Math.floor(ph)) % 5]; glow(c, x, y, 60 * (1 - life), col, 0.35 * (1 - life)); for (let k = 0; k < 18; k++) { const a = k * TAU / 18, r = life * 54, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r + life * life * 20; c.strokeStyle = alpha(col, 1 - life); c.lineWidth = 2.2 * (1 - life) + 0.6; c.beginPath(); c.moveTo(px, py); c.lineTo(px - Math.cos(a) * 9 * (1 - life), py - Math.sin(a) * 9 * (1 - life)); c.stroke(); } }
  c.restore();
}

// The sideline up close, for the halftime questions: the team at the bench,
// the cooler, the field behind them.
export function sideline(c, t, where, face) {
  const bench = (col, l, d) => { ell(c, 250, 222, 240, 8, "rgba(0,0,0,.22)"); B(c, 40, 216, 14, 14, d); B(c, 440, 216, 14, 14, d); B(c, 20, 206, 460, 11, col, l, d, 3); };
  if (where === "park") {
    park(c, t, { field: false }); bench("#a0703f", "#c08a52", "#7a5230");
    ["uncle", "sister", "cousin", "brother", "nephew"].forEach((k, i) => cast(c, k, 78 + i * 88, 218, 0.6, { armUp: false, angry: false }));
    B(c, 500, 190, 46, 32, "#2f6fc4", "#5fa8e6", "#1d3c8f", 3); B(c, 496, 183, 54, 10, "#f4f1e6", "#fff", "#c9c2ae", 3); leaves(c, t, 40);
  } else {
    const tx = where === "texas"; stadium(c, t, { team: tx ? "texas" : "dallas" }); bench("#c9d3e6", "#eef2f8", "#8793bd");
    for (let i = 0; i < 5; i++) person(c, 78 + i * 92, 218, 0.6, { ...CAST.kicker, ...(tx ? { shirt: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6", dot: "" } : {}), number: String(11 + i * 13), skin: ["#e8b98a", "#8a5a3a", "#c98a5a"][i % 3] });
    B(c, 500, 188, 40, 34, "#e2622a", "#f08a4b", "#a8551c", 3); B(c, 496, 181, 48, 9, "#f4f1e6", "#fff", "#c9c2ae", 3);
  }
  person(c, 584, 228, 0.9, { ...CAST.you, face, shirt: where === "dallas" ? "#1b2440" : where === "texas" ? "#bf5700" : "#e2622a", number: where === "park" ? "1" : "", armUp: true, wave: t });
}
export function chute(c, x, y, t, face) {
  const sw = Math.sin(t * 2) * 0.05; c.save(); c.translate(x, y); c.rotate(sw);
  c.strokeStyle = "#f4f1e6"; c.lineWidth = 1.2; [-56, -30, 0, 30, 56].forEach(dx => { c.beginPath(); c.moveTo(dx, -66); c.lineTo(dx * 0.12, -26); c.stroke(); });
  shape(c, "#e2622a", (g) => { g.moveTo(-60, -66); g.bezierCurveTo(-60, -142, 60, -142, 60, -66); g.quadraticCurveTo(45, -74, 30, -66); g.quadraticCurveTo(15, -74, 0, -66); g.quadraticCurveTo(-15, -74, -30, -66); g.quadraticCurveTo(-45, -74, -60, -66); }, 1.4);
  inside(c, (g) => { g.moveTo(-60, -66); g.bezierCurveTo(-60, -142, 60, -142, 60, -66); g.lineTo(-60, -66); }, (g) => { for (let i = 0; i < 4; i += 2) { g.fillStyle = "#f6c945"; g.beginPath(); g.moveTo(0, -124); g.quadraticCurveTo(-52 + i * 30, -110, -45 + i * 30, -60); g.lineTo(-15 + i * 30, -60); g.quadraticCurveTo(-18 + i * 30, -110, 0, -124); g.fill(); } ell(g, -24, -108, 22, 9, "rgba(255,255,255,.25)", -0.4); g.fillStyle = "rgba(0,0,0,.14)"; g.fillRect(24, -140, 40, 80); });
  player(c, 0, 16, { jersey: "#e2622a", face, arms: 1, s: 1.15, front: true, lift: 400 }, Math.floor(t * 6));
  c.restore();
}
/** A photograph cut down to a face: the player's avatar. */
export function faceFrom(img) {
  const cv = document.createElement("canvas"); cv.width = 63; cv.height = 72; const x = cv.getContext("2d");
  const side = Math.min(img.naturalWidth, img.naturalHeight), w = side * 0.62, h = w * 24 / 21;
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(img, (img.naturalWidth - w) / 2, Math.max(0, (img.naturalHeight - h) * 0.3), w, h, 0, 0, 63, 72);
  try { const d = x.getImageData(0, 0, 63, 72); for (let i = 0; i < d.data.length; i += 4) for (let k = 0; k < 3; k++) d.data[i + k] = Math.min(255, Math.round(d.data[i + k] / 20) * 20); x.putImageData(d, 0, 0); } catch { /* a picture that cannot be read stays as drawn */ }
  return cv;
}

// ─── the cut scenes' kit: bars, lines, an iris, and things seen very close ───
/** Black bars top and bottom, p from 0 to 1. */
export function letterbox(c, p = 1, h = 34) { R(c, 0, 0, W, h * p, "#000"); R(c, 0, H - h * p, W, h * p + 1, "#000"); }
/** Lines rushing past behind something that is standing still. */
export function speedLines(c, t, bg = "#1d3c8f", col = "#ffffff", n = 40) {
  c.fillStyle = vgrad(c, 0, H, [[0, darken(bg, 0.3)], [0.5, lighten(bg, 0.08)], [1, darken(bg, 0.36)]]); c.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) { const len = 80 + rnd(i + 2) * 240, y = rnd(i + 31) * H, x = W + len - ((t * (700 + rnd(i) * 900) + rnd(i + 7) * 1400) % (W + len * 2)), th = i % 4 ? 2 : 5; const g = c.createLinearGradient(x, 0, x + len, 0); g.addColorStop(0, alpha(i % 3 ? col : lighten(bg, 0.4), 0.95)); g.addColorStop(1, alpha(i % 3 ? col : lighten(bg, 0.4), 0)); c.fillStyle = g; c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y + th / 2 - 0.5); c.lineTo(x + len, y + th / 2 + 0.5); c.lineTo(x, y + th); c.fill(); }
}
/** Lines bursting out from a point, for a moment that has stopped. */
export function burst(c, t, x, y, bg = "#e2622a", col = "#ffd75e", n = 28) {
  const g = c.createRadialGradient(x, y, 20, x, y, 420); g.addColorStop(0, lighten(bg, 0.25)); g.addColorStop(1, darken(bg, 0.35)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = alpha(col, 0.9);
  for (let i = 0; i < n; i++) { const a = i * TAU / n + (Math.floor(t * 8) % 2) * 0.06, w = 0.05 + rnd(i) * 0.05, r0 = 96 + rnd(i + 5) * 60; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a - w) * 800, y + Math.sin(a - w) * 800); c.lineTo(x + Math.cos(a + w) * 800, y + Math.sin(a + w) * 800); c.fill(); }
  c.fillStyle = "rgba(0,0,0,.1)"; for (let yy = 0; yy < H; yy += 9) for (let xx = (yy / 9 & 1) * 4.5; xx < W; xx += 9) { const d = Math.hypot(xx - x, yy - y); if (d > 210) { c.beginPath(); c.arc(xx, yy, Math.min(3, (d - 210) / 60), 0, TAU); c.fill(); } }
}
/** Everything black except a circle of radius r at (x, y). */
export function iris(c, x, y, r) { c.fillStyle = "#000"; c.beginPath(); c.rect(0, 0, W, H); c.arc(x, y, Math.max(0, r), 0, TAU, true); c.fill("evenodd"); }
/** Two feet in cleats on grass, mid-stride. */
export function cleats(c, t, col = "#e2622a") {
  c.fillStyle = vgrad(c, 0, H, [[0, "#7cb04a"], [1, "#2f6a28"]]); c.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = ((rnd(i) * 900 - t * 900) % 760 + 760) % 760 - 60, y = 150 + rnd(i + 3) * 200; R(c, x, y, 30 + rnd(i + 5) * 50, 2 + rnd(i + 8) * 2, i % 2 ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.12)"); }
  const f = Math.floor(t * 7) % 2, pw = pen.w; pen.w = 2.4;
  [[190, f ? 0 : -50], [400, f ? -50 : 0]].forEach(([x, up]) => {
    ell(c, x + 70, 322, 100, 12, "rgba(0,0,0,.3)");
    shape(c, "#3a4a66", box(x + 14, -20 + up, 66, 190, 20)); R(c, x + 20, -20 + up, 12, 180, "rgba(255,255,255,.12)");
    shape(c, "#f4f1e6", box(x + 10, 160 + up, 74, 84, 10)); R(c, x + 10, 176 + up, 74, 8, col); R(c, x + 10, 190 + up, 74, 4, col);
    shape(c, "#16121f", (g) => { g.moveTo(x + 2, 236 + up); g.lineTo(x + 92, 232 + up); g.bezierCurveTo(x + 150, 244 + up, x + 172, 262 + up, x + 168, 286 + up); g.lineTo(x + 2, 290 + up); g.quadraticCurveTo(x - 8, 262 + up, x + 2, 236 + up); });
    R(c, x + 2, 282 + up, 166, 8, "#f4f1e6"); for (let k = 0; k < 4; k++) line(c, [[x + 62 + k * 16, 244 + up + k * 2], [x + 74 + k * 16, 258 + up + k * 3]], 4, "#f4f1e6"); shape(c, col, poly([[x + 20, 252 + up], [x + 60, 244 + up], [x + 50, 274 + up], [x + 14, 276 + up]]), 0);
    for (let k = 0; k < 6; k++) shape(c, "#c9d3e6", poly([[x + 10 + k * 27, 290 + up], [x + 22 + k * 27, 290 + up], [x + 19 + k * 27, 304 + up], [x + 13 + k * 27, 304 + up]]), 1.4);
    if (!up) for (let k = 0; k < 7; k++) { const a = rnd(k) * 6; shape(c, k % 2 ? "#4f8a3a" : "#6b4a2a", box(x - 24 - k * 16, 290 - k * 9 - rnd(k) * 14, 10, 8, 3), 1.4); }
  });
  pen.w = pw;
}
/** Two hands and a football, very large. p is 0 (ball coming) to 1 (caught). */
export function bigCatch(c, t, p, sleeve = "#e2622a", skin = "#e8b98a") {
  const bx = 320 + (1 - p) * 260, by = 170 - (1 - p) * 60, pw = pen.w; pen.w = 2.6;
  const hands = (front) => [-1, 1].forEach((side) => {
    const hx = 320 + side * (86 - p * 26);
    if (!front) { shape(c, sleeve, box(hx - 36, 204, 72, 190, 16)); R(c, hx - 30, 210, 14, 160, "rgba(255,255,255,.15)"); R(c, hx - 36, 204, 72, 12, darken(sleeve, 0.25)); shape(c, skin, box(hx - 32, 124, 64, 92, 26)); ell(c, hx - 10, 150, 14, 22, "rgba(255,255,255,.14)"); }
    else for (let k = 0; k < 4; k++) { const fx = hx - 27 + k * 18 - side * 6; limb(c, [[fx, 138], [fx - side * (4 + k * 2) * p, 100 + Math.abs(k - 1.5) * 6]], 15, skin); }
    if (front) limb(c, [[hx - side * 30, 170], [hx - side * 50, 138]], 16, skin);
  });
  hands(false);
  c.save(); c.translate(bx, by); c.rotate(-0.4 + (1 - p) * t * 9);
  shape(c, "#8a4b1e", (g) => { g.moveTo(-82, 0); g.quadraticCurveTo(0, -78, 82, 0); g.quadraticCurveTo(0, 78, -82, 0); });
  inside(c, (g) => { g.moveTo(-82, 0); g.quadraticCurveTo(0, -78, 82, 0); g.quadraticCurveTo(0, 78, -82, 0); }, (g) => { ell(g, -14, -18, 44, 12, "#b8743a"); ell(g, 0, 34, 80, 16, "rgba(40,10,0,.3)"); R(g, -62, -40, 9, 80, "#f4efe2"); R(g, 53, -40, 9, 80, "#f4efe2"); });
  line(c, [[-30, -3], [30, -3]], 5, "#f4efe2"); for (let k = -2; k <= 2; k++) line(c, [[k * 12, -13], [k * 12, 7]], 4, "#f4efe2");
  c.restore();
  if (p > 0.6) hands(true);
  pen.w = pw;
}
/** Confetti in a team's colours. */
export function confetti(c, t, cols, n = 110) { for (let i = 0; i < n; i++) { const y = ((t * (60 + rnd(i) * 90) + rnd(i + 3) * 500) % (H + 20)) - 10, x = (rnd(i + 5) * W + Math.sin(t * 2 + i) * 16 + W) % W, w = 3 + rnd(i + 9) * 4; c.save(); c.translate(x, y); c.rotate(t * (2 + rnd(i) * 4) + i); c.fillStyle = cols[i % cols.length]; c.fillRect(-w / 2, -2 * Math.abs(Math.cos(t * 5 + i)) - 0.4, w, 4 * Math.abs(Math.cos(t * 5 + i)) + 0.8); c.restore(); } }
