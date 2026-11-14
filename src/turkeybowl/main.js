// Turkey Bowl, the page: one screen. The picture fills it, and the words,
// the choices and the buttons all sit on the picture.
//
// The game itself is script.js (what is asked, in what order, what each
// answer is worth) and the pictures are art.js. This file walks the flow,
// runs the football, keeps what the player did, and sends that to
// /api/turkey-bowl at every checkpoint. The score on screen is worked out
// here from script.js so the player sees it move; the score that counts is
// the server's, from the same rules.
//
// Andrew, 2026-11-14, after playing the first build: "everything should be
// on the screen ... the question should appear on the screen, not below the
// screen." "It needs like an opening title sequence." "There needs to be a
// back button ... where you can't change your options." "If I reload, is it
// going to ... take me off what I need?" "This is not football gameplay. We
// need football gameplay." "How did the other side score after I had a 14
// yard run? That doesn't make any sense." "I want the animations to be
// ridiculous." "If I have a halftime question, we should be on the
// sideline." "If somebody from COMM 118 is playing, please pull what they
// look like and make an avatar for each of them."
//
// So: a run is saved in the browser after every step and picked up on
// reload. Back pages through what has already happened, read only. A play
// is called and then played: a run is three lanes and defenders to dodge, a
// pass is a meter to stop. Every drive ends in words that say what happened,
// and when the other side scores the player watches them do it. A signed-in
// student's photograph is cut down to a small pixel face and worn by their
// coach.

import { flowFor, decisionOf, judge, scoreRun, lookFor, orderFor, popScene, POWER, RANK_SAY, LINKS, MAX_SCORE, HIRED, shortName } from "./script.js";
import * as A from "./art.js";
import { accessToken } from "../engine/session.js";

const $ = (id) => document.getElementById(id);
const canvas = $("screen"), c = canvas.getContext("2d"), ui = $("ui"), hud = $("hud"), banner = $("banner"), hint = $("hint"), pad = $("pad"), backBtn = $("back");
c.imageSmoothingEnabled = false;
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const store = { get(k) { try { return localStorage.getItem(k) || ""; } catch { return ""; } }, set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } } };
const classRoute = /^\/comm118\/turkey-bowl/.test(location.pathname);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ─── sound ───
let audio = null, muted = store.get("turkeybowl-mute") === "1";
const ac = () => { if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = null; } } return audio; };
function tone(freq, at, dur, type = "square", vol = 0.06, to = 0) {
  const a = ac(); if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, a.currentTime + at); if (to) o.frequency.exponentialRampToValueAtTime(to, a.currentTime + at + dur);
  g.gain.setValueAtTime(vol, a.currentTime + at); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime + at); o.stop(a.currentTime + at + dur + 0.02);
}
function noise(at, dur, vol = 0.05) {
  const a = ac(); if (!a || muted) return;
  const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
  const s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; g.gain.value = vol; s.connect(g).connect(a.destination); s.start(a.currentTime + at);
}
const sfx = {
  click: () => tone(660, 0, 0.05),
  thud: () => tone(140, 0, 0.16, "square", 0.1, 50),
  whistle: () => { tone(2100, 0, 0.18, "sine", 0.08); tone(2300, 0.2, 0.3, "sine", 0.08); },
  snap: () => tone(180, 0, 0.06, "square", 0.08),
  step: () => tone(520, 0, 0.03, "square", 0.03),
  throw: () => tone(300, 0, 0.3, "sine", 0.07, 900),
  good: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.12)),
  meh: () => [392, 440].forEach((f, i) => tone(f, i * 0.1, 0.12)),
  bad: () => [220, 185].forEach((f, i) => tone(f, i * 0.14, 0.2, "sawtooth", 0.05)),
  gobble: (at = 0) => { for (let i = 0; i < 7; i++) tone(500 + (i % 2) * 260, at + i * 0.06, 0.05, "sawtooth", 0.05); },
  silly: () => { [660, 520, 700, 300, 880, 240].forEach((f, i) => tone(f, i * 0.07, 0.07, "triangle", 0.08)); sfx.gobble(0.3); },
  over: () => [392, 370, 349, 330, 196].forEach((f, i) => tone(f, i * 0.22, 0.3, "sawtooth", 0.06)),
  td: () => { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.14)); noise(0, 1.8, 0.07); },
  cheer: () => noise(0, 1.1, 0.05),
  boo: () => tone(160, 0, 0.9, "sawtooth", 0.05, 110),
  jet: () => noise(0, 2.2, 0.04),
};
const muteBtn = $("mute");
const showMute = () => { muteBtn.textContent = muted ? "Sound off" : "Sound on"; muteBtn.setAttribute("aria-pressed", String(muted)); };
muteBtn.onclick = () => { muted = !muted; store.set("turkeybowl-mute", muted ? "1" : "0"); showMute(); if (!muted) sfx.click(); };
showMute();

// ─── the picture: `paint`, then whatever effect is running on top of it ───
let paint = () => { c.fillStyle = "#000"; c.fillRect(0, 0, A.W, A.H); };
let fx = null;   // { kind, start, x, y }
const t0 = performance.now();
const now = () => (performance.now() - t0) / 1000;
function drawFx(t) {
  if (!fx) return;
  const e = t - fx.start;
  if (fx.kind === "best" || fx.kind === "td") {
    A.fireworks(c, t, fx.kind === "td" ? 7 : 3);
    if (fx.kind === "td") { A.turkey(c, ((e * 260) % 760) - 60, 350, t); A.turkey(c, 700 - ((e * 200) % 760), 338, t, -1); }
  } else if (fx.kind === "bad") {
    const x = fx.x || 500, y = 40;
    c.fillStyle = "rgba(60,64,90,.9)"; [[0, 0, 26], [26, 6, 20], [-24, 8, 18]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); });
    for (let i = 0; i < 16; i++) { c.fillStyle = "#7fd3ff"; c.fillRect(x - 40 + (i * 17) % 80, y + 20 + ((e * 180 + i * 37) % 150), 2, 9); }
    if (Math.floor(e * 3) % 4 === 0) { c.fillStyle = "#ffd75e"; c.beginPath(); c.moveTo(x, y + 20); c.lineTo(x - 12, y + 60); c.lineTo(x, y + 56); c.lineTo(x - 8, y + 96); c.lineTo(x + 14, y + 48); c.lineTo(x + 2, y + 52); c.fill(); }
  } else if (fx.kind === "silly") {
    for (let i = 0; i < 6; i++) A.turkey(c, ((e * (190 + i * 40) + i * 150) % 800) - 80, 200 + i * 28, t + i, 1);
    const p = clamp(e / 0.5, 0, 1), x = fx.x || 500, y = fx.y || 120;
    if (p < 1) { c.save(); c.translate(-80 + (x + 80) * p, 300 - (300 - y) * p - Math.sin(p * Math.PI) * 90); c.rotate(e * 14); c.scale(1.6, 1.6); A.food(c, "pie"); c.restore(); }
    else { c.fillStyle = "#d9772a"; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(x + Math.cos(i) * (10 + i * 3), y + Math.sin(i * 2) * (8 + i * 2) + Math.min(30, (e - 0.5) * 12), 9 - i * 0.5, 0, 7); c.fill(); } c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y - 4, 9, 0, 7); c.fill(); }
  } else if (fx.kind === "over") { c.fillStyle = `rgba(200,30,30,${0.35 + Math.sin(e * 16) * 0.2})`; c.fillRect(0, 0, A.W, A.H); }
}
(function frame() {
  const t = now();
  c.save();
  try {
    const shaking = fx && ((fx.kind === "over") || (fx.kind === "shake" && t - fx.start < 0.4));
    if (shaking) c.translate(Math.sin(t * 70) * 4, Math.cos(t * 55) * 3);
    paint(t); drawFx(t);
  } catch { /* one bad frame is not worth a dead game */ }
  c.restore();
  requestAnimationFrame(frame);
})();
function say(text, cls = "") { banner.textContent = text || ""; banner.className = cls; }

// ─── talking to the server ───
const visitor = (() => { let v = store.get("turkeybowl-visitor"); if (!/^[0-9a-f-]{36}$/.test(v)) { v = (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16))); store.set("turkeybowl-visitor", v); } return v; })();
async function api(body) {
  let token = ""; try { token = await accessToken(); } catch { token = ""; }
  const r = await fetch("/api/turkey-bowl", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ visitor, pin: store.get("classes-instructor-pin") || undefined, ...body }) });
  const out = await r.json().catch(() => null);
  if (!out) throw new Error("The server did not answer.");
  return out;
}
const loadImage = (src) => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

// ─── the run, kept in the browser so a reload picks it up ───
let me = { open: true, name: "", tag: "", instructor: false, photo: "" };
let FACE = null;   // the player's own pixel face, when they have a photograph
let G = null;
const SAVE = "turkeybowl-run";
const fresh = () => ({ seed: Array.from({ length: 12 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join(""), picks: {}, calls: [], step: 0, us: 0, them: 0, q: "Q1", where: "park", yard: 25, window: 0, half: 1, jerry: false, log: [] });
const save = () => { if (G) store.set(SAVE, JSON.stringify(G)); };
const saved = () => { try { const g = JSON.parse(store.get(SAVE) || "null"); return g && g.seed && g.step > 0 ? g : null; } catch { return null; } };
const tally = () => scoreRun({ seed: G.seed, picks: G.picks, calls: G.calls });
function showHud() {
  hud.textContent = "";
  if (!G) return;
  const r = tally(), dallas = G.where === "dallas";
  const left = el("div", "box"); left.append(document.createTextNode((dallas ? "DAL " : "YOU ") + G.us + "  " + (dallas ? "VIS " : "THEM ") + G.them), el("br"), document.createTextNode(G.q));
  const right = el("div", "box");
  if (FACE) { const f = el("canvas"); f.width = 21; f.height = 24; f.getContext("2d").drawImage(FACE, 0, 0); right.append(f); }
  right.append(document.createTextNode("LEVEL " + r.level + "  "), el("b", "", r.score.toLocaleString("en-US")));
  hud.append(left, right);
}

// ─── the words on the screen ───
// A card sits at the bottom of the screen, except a play call, which sits at the top so the field stays in view.
const card = (who, top = false) => { ui.textContent = ""; ui.classList.toggle("top", top); const k = el("div", "card"); if (who) k.append(el("div", "who", who)); ui.append(k); return k; };
let onKey = null, review = null;
addEventListener("keydown", (e) => { if (onKey && review === null) onKey(e); });
const next = (k, label = "Continue") => new Promise(res => {
  const b = el("button", "go", label); b.type = "button";
  const done = () => { onKey = null; sfx.click(); res(); };
  b.onclick = done; onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); done(); } };
  k.append(b);
});
const showBack = () => { backBtn.disabled = !G || !G.log.length || !!G.busy; };
/** Words to read and one button: also written into the log, for Back. */
async function lines(who, list, label) {
  const k = card(who); list.forEach(x => k.append(el("p", "say", x)));
  G.log.push({ who, lines: list }); showBack();
  await next(k, label);
}

// ─── Back: what has already happened, read only ───
function drawReview() {
  const old = $("review"); if (old) old.remove();
  if (review === null) { ui.style.visibility = ""; return; }
  ui.style.visibility = "hidden";
  const e = G.log[review], wrap = el("div"); wrap.id = "review"; wrap.style.cssText = "position:absolute;left:2.2%;right:2.2%;bottom:2.4%;z-index:7;display:flex;flex-direction:column;max-height:80%";
  const k = el("div", "card"); k.append(el("div", "who", (e.who || "EARLIER") + "   " + (review + 1) + " OF " + G.log.length));
  if (e.scene) k.append(el("p", "scene", e.scene));
  if (e.rank) k.append(el("div", "rank r-" + e.rank, RANK_SAY[e.rank]));
  if (e.pick) k.append(el("p", "say", "You chose: " + e.pick));
  (e.lines || []).forEach(x => k.append(el("p", "say", x)));
  if (e.why) k.append(el("p", "why", e.why));
  const row = el("div", "row");
  const mk = (label, fn, off) => { const b = el("button", "go", label); b.type = "button"; b.disabled = !!off; b.onclick = fn; row.append(b); };
  mk("Earlier", () => { review--; drawReview(); }, review === 0);
  mk("Later", () => { review++; drawReview(); }, review >= G.log.length - 1);
  mk("Return to the game", () => { review = null; drawReview(); });
  k.append(row); wrap.append(k); $("stage").append(wrap);
}
backBtn.onclick = () => { if (!G || !G.log.length || G.busy) return; sfx.click(); review = review === null ? G.log.length - 1 : null; drawReview(); };

// ─── where a question happens ───
function backdrop(id) {
  const dallas = G.where === "dallas";
  if (id === "breakfast") return (t) => A.kitchen(c, t);
  if (id === "jet") return (t) => { A.sky(c, t); A.plane(c, 200 + Math.sin(t) * 10, 110 + Math.sin(t * 1.7) * 6); };
  if (id === "speech") return (t) => { A.locker(c, t); for (let i = 0; i < 4; i++) A.cast(c, "kicker", 360 + i * 70, 214, 0.62, { number: String(52 + i * 11) }); A.person(c, 200, 222, 0.95, { ...A.CAST.you, face: FACE, shirt: "#1b2440", number: "", armUp: true, wave: t }); };
  if (id === "push" || id === "commercial") return (t) => { A.sideline(c, t, dallas ? "dallas" : "park", FACE); if (id === "commercial") A.jerry(c, 150, 220, 0.9, { armUp: true, wave: t }); };
  if (G.jerry) return (t) => { A.park(c, t, { time: "gold", field: false }); A.passerby(c, 120, 214, 0.6, "on"); A.leaves(c, t); };
  if (dallas) return (t) => A.stadium(c, t, { midfield: true });
  return (t) => { A.park(c, t); A.leaves(c, t); };
}

async function decide(id) {
  const dec = decisionOf(id), pop = !dec.level, dallas = G.where === "dallas", base = backdrop(id);
  const who = ["commercial", "push", "speech", "breakfast", "jet"].includes(id) ? "" : dec.level === 2 ? "jerry" : dec.who;
  const phone = pop && dallas;
  const start = now();
  paint = (t) => {
    base(t);
    if (who && !phone) A.cast(c, who, 530, 218, 0.95, { wave: t - start });
    if (phone) { c.save(); c.translate(500, 30 + (t - start < 1 ? Math.sin(t * 60) * 3 : 0)); c.fillStyle = "#16121f"; c.fillRect(0, 0, 84, 150); c.fillStyle = "#dff3ff"; c.fillRect(6, 14, 72, 118); c.fillStyle = "#2f6fc4"; c.fillRect(12, 24, 56, 16); c.fillRect(12, 46, 44, 12); c.fillRect(12, 64, 50, 12); c.restore(); }
  };
  say("");
  const label = pop ? (phone ? "A TEXT FROM HOME" : "ON THE SIDELINE") : dec.level === 2 ? "THE INTERVIEW" : dec.level === 3 ? "DALLAS" : "THE PARK";
  const scene = pop ? popScene(dec, dallas) : dec.scene;
  const k = card(label); k.append(el("p", "scene", scene));
  const opts = el("div", "opts"); k.append(opts);
  const pick = await new Promise(res => {
    if (dec.pick) {
      const chosen = new Set(), go = el("button", "go", "Lock it in"); go.type = "button"; go.disabled = true;
      orderFor(G.seed, id, POWER.length).forEach(i => {
        const p = POWER[i], b = el("button", "opt", p.text); b.type = "button"; b.setAttribute("aria-pressed", "false");
        b.onclick = () => { sfx.click(); if (chosen.has(p.k)) chosen.delete(p.k); else if (chosen.size < dec.pick) chosen.add(p.k); b.setAttribute("aria-pressed", String(chosen.has(p.k))); go.disabled = chosen.size !== dec.pick; };
        opts.append(b);
      });
      go.onclick = () => res([...chosen]); k.append(go);
    } else {
      const btns = [];
      orderFor(G.seed, id, dec.opts.length).forEach((i, n) => {
        const o = dec.opts[i], b = el("button", "opt"); b.type = "button";
        b.append(el("kbd", "", String(n + 1)));
        const icon = (A.FOOD_OF[id] || {})[o.k];
        if (icon) { const cv = el("canvas"); cv.width = 32; cv.height = 32; A.food(cv.getContext("2d"), icon); b.append(cv); }
        b.append(el("span", "", o.text));
        b.onclick = () => { onKey = null; res(o.k); };
        opts.append(b); btns.push(b);
      });
      onKey = (e) => { const n = Number(e.key); if (n >= 1 && n <= btns.length) btns[n - 1].click(); };
    }
  });
  G.picks[id] = pick;
  const got = judge(dec, pick);
  ({ best: sfx.good, good: sfx.meh, bad: sfx.bad, silly: sfx.silly, over: sfx.over })[got.rank]();
  fx = got.rank === "good" ? null : { kind: got.rank, start: now(), x: who && !phone ? 530 : 320, y: who && !phone ? 84 : 110 };
  showHud();
  const chose = Array.isArray(pick) ? pick.map(x => POWER.find(p => p.k === x).text).join(" and ") : dec.opts.find(o => o.k === pick).text;
  const r = card(label);
  r.append(el("div", "rank r-" + got.rank, RANK_SAY[got.rank] + "   +" + got.points));
  r.append(el("p", "scene", chose));
  r.append(el("p", "say", got.then));
  r.append(el("p", "why", dec.after));
  const link = LINKS[id];
  if (link) { const a = el("a", "more", link.say + " ↗"); a.href = link.url; a.target = "_blank"; a.rel = "noopener noreferrer"; r.append(a); }
  G.log.push({ who: label, scene, rank: got.rank, pick: chose, lines: [got.then], why: dec.after }); showBack();
  await next(r, got.over ? "Uh oh" : "Continue");
  fx = null;
  return got;
}

// ─── football ───
const TEAM = {
  park: { us: { jersey: "#e2622a", pants: "#3a4a66" }, them: { jersey: "#6a4bb0", pants: "#2a2a3a" } },
  dallas: { us: { jersey: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f" }, them: { jersey: "#b01e3a", pants: "#f1e3c6", helmet: "#f6c945" } },
};
const HAIRS = ["#5a3a1e", "#1e1410", "#f3d67a", "#a8551c", "#e3e6ea"], SKINS = ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"];
const kin = (where, side, i) => ({ ...TEAM[where][side], hair: HAIRS[(i + (side === "us" ? 0 : 2)) % 5], skin: SKINS[(i + (side === "us" ? 0 : 1)) % 4], long: where === "park" && i % 3 === 1, dir: side === "us" ? 1 : -1 });
const field = (t, where, scroll, endzone) => { if (where === "park") A.park(c, t, { scroll }); else A.stadium(c, t, { scroll, endzone }); };
const LANES = [236, 280, 324];
const rng = (s) => { let x = 7; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; };
function controls(kind, handlers) {
  pad.textContent = ""; pad.className = kind === "throw" ? "throw" : ""; pad.style.display = "flex";
  if (kind === "throw") { const b = el("button", "", "THROW"); b.type = "button"; b.onpointerdown = (e) => { e.preventDefault(); handlers.go(); }; pad.append(b); }
  else [["▲", -1], ["▼", 1]].forEach(([s, d]) => { const b = el("button", "", s); b.type = "button"; b.setAttribute("aria-label", d < 0 ? "Up" : "Down"); b.onpointerdown = (e) => { e.preventDefault(); handlers.move(d); }; pad.append(b); });
  onKey = (e) => {
    if (kind === "throw") { if (e.key === " " || e.key === "Enter") { e.preventDefault(); handlers.go(); } }
    else if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); handlers.move(-1); }
    else if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); handlers.move(1); }
  };
}
const noControls = () => { pad.style.display = "none"; pad.textContent = ""; onKey = null; hint.textContent = ""; };

/** A run: three lanes, defenders coming, up and down to dodge. Resolves the yards gained. */
function runPlay(good, where, room) {
  return new Promise(res => {
    const r = rng(G.seed + "run" + G.calls.length), speed = good ? 190 : 150, gap = good ? 210 : 118, max = Math.min(room, good ? 38 : 16);
    const waves = Array.from({ length: 14 }, (_, i) => { const open = Math.floor(r() * 3); return { x: 330 + i * gap + r() * 30, lanes: good ? [(open + 1 + Math.floor(r() * 2)) % 3] : [0, 1, 2].filter(l => l !== open) }; });
    let lane = 1, laneY = LANES[1], dist = 0, last = now(), done = false, hitAt = 0, endAt = 0, sent = false;
    controls("run", { move: (d) => { if (done) return; lane = clamp(lane + d, 0, 2); sfx.step(); } });
    hint.textContent = "UP and DOWN to dodge";
    const start = G.yard;
    paint = (t) => {
      const dt = Math.min(0.05, t - last); last = t;
      if (!done) { dist += speed * dt; laneY += (LANES[lane] - laneY) * Math.min(1, dt * 18); }
      const yards = Math.min(max, dist / 9);
      field(t, where, (start + yards) * 18, start + yards > 88);
      const px = 150;
      waves.forEach((w, i) => w.lanes.forEach(l => {
        const x = w.x - dist * (good ? 1 : 1.25) + px;
        if (x < -40 || x > 700) return;
        if (!done && Math.abs(x - px) < 16 && l === lane) { done = true; hitAt = t; endAt = t; fx = { kind: "shake", start: t }; sfx.thud(); }
        A.player(c, x, LANES[l], { ...kin(where, "them", i + l), down: !!hitAt && Math.abs(x - px) < 20 && l === lane }, Math.floor(t * 10) + i);
      }));
      for (let i = 0; i < 2; i++) A.player(c, px + 50 + i * 14, LANES[(lane + i + 1) % 3], kin(where, "us", i + 2), Math.floor(t * 10) + i);
      A.player(c, px, laneY, { ...kin(where, "us", 0), face: where === "park" ? FACE : null, down: !!hitAt }, Math.floor(t * 12));
      if (!hitAt) A.ball(c, px + 9, laneY - 22, 0.3);
      if (where === "park") A.leaves(c, t, 30);
      if (!done && yards >= max) { done = true; endAt = t; }
      if (done && !sent && t - endAt > (hitAt ? 0.55 : 0.1)) { sent = true; noControls(); res(Math.round(yards)); }
    };
  });
}
/** A pass: the marker slides, the player stops it. Resolves { yards, pick }. */
function passPlay(good, where, room) {
  return new Promise(res => {
    const start = now(), green = good ? 0.34 : 0.12, speed = good ? 1.5 : 2.4;
    let thrown = null, sent = false;
    const pos = (t) => 0.5 + 0.5 * Math.sin((t - start) * speed * Math.PI);
    const go = () => { if (thrown) return; const p = pos(now()); thrown = { at: now(), p, hit: Math.abs(p - 0.5) < green / 2, pick: p < 0.08 || p > 0.92 }; sfx.throw(); noControls(); };
    controls("throw", { go });
    hint.textContent = "SPACE to throw when the marker is in the green";
    const base = G.yard;
    paint = (t) => {
      const e = t - start;
      if (!thrown && e > 6) go();
      field(t, where, base * 18, false);
      const qx = 130, qy = 300, route = Math.min(1, e / 2.2), rx = 250 + route * 250, ry = 240;
      for (let i = 0; i < 4; i++) A.player(c, 190 + (i % 2) * 8, 232 + i * 30, kin(where, "us", i + 1), 0);
      for (let i = 0; i < 4; i++) A.player(c, 232, 236 + i * 30, kin(where, "them", i), Math.floor(t * 8) + i);
      A.player(c, rx - 30, ry + 44, kin(where, "them", 5), Math.floor(t * 10));
      A.player(c, qx, qy, { ...kin(where, "us", 0), face: where === "park" ? FACE : null, arms: thrown ? 1 : 0 }, 0);
      if (!thrown) { A.player(c, rx, ry, kin(where, "us", 3), Math.floor(t * 10)); A.ball(c, qx + 10, qy - 24); }
      else {
        const f = clamp((t - thrown.at) / 0.9, 0, 1), tx = thrown.hit ? rx : thrown.pick ? rx - 30 : rx + 60, ty = thrown.hit ? ry - 26 : thrown.pick ? ry + 20 : ry + 30;
        A.player(c, rx, ry, { ...kin(where, "us", 3), arms: thrown.hit && f > 0.7 ? 1 : 0 }, f < 1 ? Math.floor(t * 10) : 0);
        if (f < 1) A.ball(c, qx + (tx - qx) * f, qy - 24 + (ty - qy + 24) * f - Math.sin(f * Math.PI) * 110, t * 12);
        else if (thrown.hit) A.ball(c, rx + 6, ry - 30);
        else if (thrown.pick) A.ball(c, rx - 24, ry + 22);
        else { const d = t - thrown.at - 0.9; A.turkey(c, tx + d * 180, ty + 30, t); A.ball(c, tx + d * 180 + 18, ty - 6, t * 9); }   // a turkey runs off with every incompletion
        if (t - thrown.at > 1.9 && !sent) { sent = true; const acc = 1 - Math.abs(thrown.p - 0.5) / (green / 2); res({ yards: thrown.hit ? Math.min(room, Math.round(12 + acc * 26)) : 0, pick: !thrown.hit && thrown.pick }); }
      }
      const mx = 170, mw = 300, my = 136;
      c.fillStyle = "#0b1410"; c.fillRect(mx - 4, my - 4, mw + 8, 26); c.fillStyle = "#b01e3a"; c.fillRect(mx, my, mw, 18); c.fillStyle = "#f6c945"; c.fillRect(mx + mw * 0.08, my, mw * 0.84, 18); c.fillStyle = "#35a85a"; c.fillRect(mx + mw * (0.5 - green / 2), my, mw * green, 18);
      const p = thrown ? thrown.p : pos(t); c.fillStyle = "#fff"; c.fillRect(mx + mw * p - 3, my - 8, 6, 34); c.fillStyle = "#0b1410"; c.fillRect(mx + mw * p - 1, my - 6, 2, 30);
      if (where === "park") A.leaves(c, t, 30);
    };
  });
}
/** Between plays: both sides standing around, so no finished play is left frozen on the screen. */
const idle = (where) => (t) => {
  field(t, where, G.yard * 18, false);
  for (let i = 0; i < 5; i++) { A.player(c, 150 + (i % 2) * 30, 226 + i * 26, kin(where, "us", i), 0); A.player(c, 470 + (i % 2) * 30, 226 + i * 26, kin(where, "them", i), 0); }
  if (where === "park") A.leaves(c, t, 30);
};
/** Everybody celebrates, badly. */
async function touchdown(where, text = "TOUCHDOWN!") {
  const start = now();
  paint = (t) => {
    const e = t - start; field(t, where, 1800, true);
    for (let i = 0; i < 6; i++) A.player(c, 150 + i * 70, 300 - Math.abs(Math.sin(e * 7 + i)) * 46, { ...kin(where, "us", i), face: i === 2 && where === "park" ? FACE : null, arms: 1, dir: Math.sin(e * 5 + i) > 0 ? 1 : -1 }, Math.floor(t * 12) + i);
    A.ball(c, 320, 150 - Math.abs(Math.sin(e * 5)) * 80, e * 14);
    if (where === "park") A.leaves(c, t, 80);
  };
  fx = { kind: "td", start }; say(text, "flash big"); sfx.td(); showHud();
  await wait(2600); fx = null; say("");
}
/** The other side has the ball, and the player watches what they do with it. */
async function theirDrive(where, scores, how) {
  paint = idle(where);
  say(where === "dallas" ? "VISITORS' BALL" : "THEIR BALL"); await wait(1000);
  const start = now(), who = kin(where, "them", 1);
  paint = (t) => {
    // Their runner goes right to left. When they score he keeps going to the far end and dances; when they do not, he is dropped.
    const e = t - start, x = scores ? Math.max(70, 560 - e * 165) : 440 - Math.min(e, 1.2) * 110, in_ = scores && x <= 70;
    field(t, where, 0, false);
    if (scores) { c.fillStyle = where === "park" ? "rgba(106,75,176,.6)" : "rgba(176,30,58,.75)"; c.fillRect(0, where === "park" ? 200 : 150, 96, where === "park" ? 148 : 196); c.fillStyle = "#fff"; c.fillRect(96, where === "park" ? 198 : 148, 3, where === "park" ? 152 : 200); }
    for (let i = 0; i < 4; i++) { const ux = scores ? 470 - i * 100 : x - 60 - i * 26; A.player(c, ux, 236 + i * 28, { ...kin(where, "us", i), down: scores ? x < ux + 10 : false, dir: scores ? 1 : 1 }, scores ? 0 : Math.floor(t * 10) + i); }
    A.player(c, x, in_ ? 284 - Math.abs(Math.sin(e * 9)) * 30 : 284 + Math.sin(e * 5) * 34, { ...who, arms: in_ ? 1 : 0, down: !scores && e > 1.2, dir: in_ && Math.sin(e * 12) > 0 ? 1 : -1 }, Math.floor(t * 12));
    if (scores || e < 1.2) A.ball(c, x - 9, (in_ ? 262 - Math.abs(Math.sin(e * 9)) * 30 : 262 + Math.sin(e * 5) * 34));
    if (where === "park") A.leaves(c, t, 30);
  };
  say(how); await wait(scores ? 3600 : 2400);
  if (scores) { say(where === "dallas" ? "THE VISITORS SCORE" : "THE OTHER SIDE SCORES"); sfx.boo(); await wait(1300); }
  say("");
}
const THEIR_TD = ["Uncle Rick goes 60 yards. Nobody touched him.", "Aunt Linda hurdles three cousins.", "The dog got loose and they ran right behind it.", "A screen pass and a lot of missed tackles.", "Their kick returner is a varsity sprinter. Nobody mentioned that."];
const THEIR_STOP = ["Three and out. They punt.", "They fumble into a pile of leaves.", "Your nephew makes the tackle of his life.", "They go for it on fourth down. No."];

async function snap(nth, of) {
  const n = G.calls.length, look = lookFor(G.seed, n), where = G.where === "dallas" ? "dallas" : "park";
  const base = G.yard;
  paint = (t) => {
    field(t, where, base * 18, false);
    const spread = look.k === "spread" ? 34 : 24, dx = look.k === "deep" ? 240 : look.k === "stack" ? 34 : 60;
    for (let i = 0; i < 5; i++) { A.player(c, 190, 224 + i * 26, kin(where, "us", i), 0); A.player(c, 190 + dx + (i % 2) * (look.k === "deep" ? 40 : 10), (look.k === "spread" ? 200 : 228) + i * spread, { ...kin(where, "them", i), arms: look.k === "blitz" ? 1 : 0 }, look.k === "blitz" ? Math.floor(t * 10) + i : 0); }
    A.player(c, 150, 290, { ...kin(where, "us", 6), face: where === "park" ? FACE : null }, 0); A.ball(c, 196, 276);
    if (where === "park") A.leaves(c, t, 30);
  };
  say("");
  const toGo = 100 - G.yard;
  const k = card("PLAY " + nth + " OF " + of + "   " + (toGo <= 10 ? "GOAL TO GO" : toGo + " YARDS TO THE END ZONE"), true);
  k.append(el("p", "scene", look.say));
  const calls = el("div", "calls"); k.append(calls);
  const call = await new Promise(res => {
    const mk = (v, sub) => { const b = el("button", "call " + v, v.toUpperCase()); b.type = "button"; b.append(el("small", "", sub)); b.onclick = () => { onKey = null; res(v); }; calls.append(b); };
    mk("run", "then dodge"); mk("pass", "then throw");
    onKey = (e) => { if (e.key === "r" || e.key === "1") { onKey = null; res("run"); } else if (e.key === "p" || e.key === "2") { onKey = null; res("pass"); } };
  });
  G.calls.push(call); G.busy = true; showBack();
  const good = look.beat === call;
  ui.textContent = ""; sfx.snap();
  // A half ends at a set score, so a drive that would break the score is stopped short of the goal line.
  const cap = where === "dallas" ? (G.half === 1 ? 7 : 99) : (G.half === 1 ? 14 : 99);
  const room = G.us + 7 > cap || G.noTd ? Math.max(1, 96 - G.yard) : 100 - G.yard;
  let yards = 0, turnover = false;
  if (call === "run") yards = await runPlay(good, where, room);
  else { const out = await passPlay(good, where, room); yards = out.yards; turnover = out.pick; }
  G.yard = Math.min(100, G.yard + yards); G.busy = false; showBack();
  if (G.yard < 100) paint = idle(where);
  if (G.yard >= 100) { G.us += 7; G.yard = 25; G.scored = true; G.log.push({ who: "PLAY", lines: [call.toUpperCase() + " against: " + look.say + " Touchdown."] }); await touchdown(where); return "td"; }
  const word = turnover ? "INTERCEPTED!" : call === "run" ? (yards >= 12 ? "+" + yards + " YARDS!" : yards > 0 ? "+" + yards + " YARDS" : "STUFFED") : (yards ? "CAUGHT! +" + yards : "INCOMPLETE. A TURKEY TOOK IT.");
  say(word + (good ? "   +50" : "")); (good ? sfx.good : sfx.bad)(); showHud();
  G.log.push({ who: "PLAY", lines: [call.toUpperCase() + " against: " + look.say + " " + word] });
  await wait(1300); say("");
  return turnover ? "pick" : "";
}
async function plays(count) {
  G.window++; G.scored = false;
  const where = G.where === "dallas" ? "dallas" : "park";
  let ended = "";
  for (let i = 0; i < count; i++) { const out = await snap(i + 1, count); if (out === "pick") { ended = "pick"; break; } }
  // The calls a turnover skipped still have to exist for the server's count, so they are recorded as the wrong call.
  while (G.calls.length < G.callsDue) G.calls.push(lookFor(G.seed, G.calls.length).beat === "run" ? "pass" : "run");
  // A drive that did not score ends in words, so the other side never has the ball out of nowhere.
  if (ended === "pick") { say("TURNOVER"); G.yard = 25; await wait(1000); }
  else if (!G.scored) { say(G.yard > 70 ? "FOURTH DOWN. THE KICK IS NO GOOD." : "FOURTH DOWN. YOU PUNT."); G.yard = 25; await wait(1400); }
  say("");
  // What the other side does with the ball. The story needs 21 to 14 at the park's half and down ten at Dallas's.
  const theirs = { 1: 7, 3: 14, 6: 7, 7: 14, 8: 17, 11: 20 }[G.window];
  const r = rng(G.seed + "their" + G.window);
  if (theirs && theirs > G.them) { await theirDrive(where, true, THEIR_TD[Math.floor(r() * THEIR_TD.length)]); G.them = theirs; showHud(); await wait(400); }
  else if (G.window !== 5 && G.window !== 12) await theirDrive(where, false, THEIR_STOP[Math.floor(r() * THEIR_STOP.length)]);
  if (G.window === 10 && (G.picks.kicker === "best" || G.picks.kicker === "good")) { G.us += 3; say("FIELD GOAL FROM 47. IT'S GOOD!"); sfx.good(); showHud(); await wait(1500); say(""); }
}

// ─── cut scenes ───
async function scene(name) {
  if (name === "kickoff") {
    G.q = "Q1"; const start = now();
    paint = (t) => {
      const p = Math.min(1, (t - start) / 2.6); A.park(c, t);
      for (let i = 0; i < 5; i++) { A.player(c, 80 + p * 60, 226 + i * 26, kin("park", "them", i), Math.floor(t * 9)); A.player(c, 560 - p * 40, 226 + i * 26, { ...kin("park", "us", i), dir: -1, face: i === 2 ? FACE : null }, Math.floor(t * 9)); }
      A.ball(c, 140 + p * 380, 240 - Math.sin(p * Math.PI) * 150, t * 14); A.leaves(c, t, 70);
    };
    say("8:00 AM", "big"); sfx.whistle(); showHud();
    await lines("KICKOFF", ["The park, leaves coming down, breath in the air. The other side of the family kicks off.", "Before each snap you see how they are lined up. Call RUN or PASS, then play the down."]);
    say("");
  } else if (name === "half1") {
    G.q = "HALF";
    while (G.us < 14) {
      const start = now(); say("KICKOFF RETURN");
      paint = (t) => { const e = t - start; A.park(c, t, { scroll: e * 500 }); for (let i = 0; i < 5; i++) A.player(c, 420 - e * 60 + i * 60, 240 + (i % 3) * 40, { ...kin("park", "them", i), down: true }, 0); A.person(c, 250, 330, 0.5, { skin: "#f0c8a0", hair: "#e6e9ee", shirt: "#c9402a", pants: "#6a4bb0", glasses: true, grin: true, armUp: true, wave: t }); A.ball(c, 268, 250, t * 4); A.leaves(c, t, 60); };
      await wait(1500); G.us += 7; await touchdown("park", "GRANDMA TAKES IT ALL THE WAY!");
    }
    G.half = 2; G.us = 14; G.them = Math.max(G.them, 21);
    paint = (t) => A.sideline(c, t, "park", FACE);
    say("HALFTIME  14 - 21"); sfx.whistle(); showHud();
    await lines("HALFTIME", ["The other side scores on the last play of the half.", "You are down 21 to 14. The team sits on the bench and looks at you."]);
    say(""); G.q = "Q3";
  } else if (name === "jerry") {
    G.jerry = true; G.q = "FINAL"; showHud(); const start = now();
    paint = (t) => { const e = t - start; A.park(c, t, { time: "gold", field: false }); A.passerby(c, Math.max(500, 700 - e * 46), 216, 0.72, e > 5.4 ? "down" : "on"); A.jerry(c, Math.min(180, -80 + e * 60), 226, 0.95, { wave: e > 5 ? e : 0, armUp: e > 5 }); A.leaves(c, t, 90); };
    say("");
    const k = card("AFTER THE GAME"); const add = (cls, x) => k.append(el("p", cls, x));
    add("say", "The park is gold and orange, and the leaves are falling slowly.");
    await wait(2600); add("say", "A beautiful blonde woman walks by in sunglasses. She pulls her sunglasses down and looks at you.");
    await wait(3400); sfx.good(); add("scene", "Jerry Jones: \"Hey, we got a big game today. I just happened to be walking by your park, and I saw you playing there, and I saw the way you've been coaching, and I like it. I want you to coach the Dallas Cowboys. But first we have to do a quick interview.\"");
    G.log.push({ who: "AFTER THE GAME", lines: ["A beautiful blonde woman walks by in sunglasses. She pulls her sunglasses down and looks at you.", "Jerry Jones: \"I want you to coach the Dallas Cowboys. But first we have to do a quick interview.\""] }); showBack();
    await next(k, "Okay, Jerry");
  } else if (name === "jet") {
    const start = now();
    paint = (t) => { A.sky(c, t); A.plane(c, -200 + Math.min(1, (t - start) / 3) * 420, 130 + Math.sin(t * 1.7) * 6); };
    say("WHEELS UP", "big"); sfx.jet();
    await lines("JERRY'S JET", ["Jerry: \"You're hired. For today. Wheels up.\""]);
    say("");
  } else if (name === "dallas") {
    G.where = "dallas"; G.us = 0; G.them = 0; G.q = "Q1"; G.half = 1; G.jerry = false; G.yard = 25;
    paint = (t) => { A.stadium(c, t, { midfield: true }); A.fireworks(c, t, 4); };
    say("DALLAS", "big"); sfx.cheer(); showHud();
    post();   // reaching Level 3 is the credit, so the server hears about the landing
    await lines("THANKSGIVING DAY", ["The stadium, the big screen, a blue star on silver at midfield, a full crowd, cameras everywhere.", "Same football, bigger."]);
    say("");
  }
}

async function post() {
  try { return await api({ action: "post", name: me.name, log: { seed: G.seed, picks: G.picks, calls: G.calls } }); } catch { return null; }
}
function boardCard(k, rows) {
  if (!rows || !rows.length) return;
  const wrap = el("div", "board"), tb = el("table"), head = el("tr");
  ["#", "COACH", "SCORE", "LEVEL"].forEach(h => head.append(el("th", "", h))); tb.append(head);
  const mine = rows.findIndex(r => r.me);
  rows.forEach((r, i) => {
    if (i >= 8 && i !== mine) return;
    const tr = el("tr", r.me ? "me" : ""); tr.append(el("td", "", String(i + 1)));
    const name = el("td", "", r.name); if (r.tag) name.append(el("span", "tag", r.tag)); tr.append(name, el("td", "", r.score.toLocaleString("en-US")), el("td", "", String(r.level)));
    tb.append(tr);
  });
  wrap.append(tb); k.append(wrap);
}
async function checkpoint(who, textLines, label) {
  const k = card(who); textLines.forEach(x => k.append(el("p", "say", x)));
  const r = tally(); k.append(el("div", "pts", r.score.toLocaleString("en-US") + " of " + MAX_SCORE.toLocaleString("en-US")));
  G.log.push({ who, lines: textLines }); showBack();
  const out = await post();
  if (out && out.ok) boardCard(k, out.rows); else k.append(el("p", "small", "The leaderboard did not answer. Your score is still on this screen."));
  await next(k, label);
}

async function gate(n) {
  const r = tally(), passed = r.lost !== n;
  if (n === 1) {
    if (passed) {
      if (G.us <= G.them) { say("LAST PLAY OF THE GAME"); await wait(1200); while (G.us <= G.them) { G.us += 7; await touchdown("park"); } }
      G.q = "FINAL"; showHud(); paint = (t) => A.sideline(c, t, "park", FACE); fx = { kind: "td", start: now() }; say("YOU WIN  " + G.us + " - " + G.them, "big");
      await checkpoint("LEVEL 1 COMPLETE", ["Your family wins the Turkey Bowl."], "Go home?"); fx = null;
    } else {
      if (G.us >= G.them) { await theirDrive("park", true, "They score twice in the last minute. Twice."); G.them = G.us + 7; }
      G.q = "FINAL"; paint = (t) => A.sideline(c, t, "park", FACE); say("FINAL  " + G.us + " - " + G.them); sfx.over(); showHud();
      await checkpoint("YOU LOSE THE TURKEY BOWL", ["The team stopped listening somewhere in the second quarter. Your uncle will bring this up at dinner."], "Play again");
    }
  } else if (n === 2) {
    paint = (t) => { A.park(c, t, { time: "gold", field: false }); A.jerry(c, 320, 226, 0.95, { armUp: passed, wave: t }); A.leaves(c, t); };
    if (passed) { sfx.good(); fx = { kind: "best", start: now() }; await checkpoint("LEVEL 2 COMPLETE", ["Jerry: \"I like you. You're coaching my team today.\""], "To the jet"); fx = null; }
    else { sfx.over(); await checkpoint("NO JOB", ["Jerry: \"I'll keep looking. Happy Thanksgiving.\""], "Play again"); }
  } else {
    const both = (extra) => (t) => { A.stadium(c, t, { midfield: true }); A.jerry(c, 150, 226, 0.9, extra ? { armUp: true, wave: t } : {}); A.person(c, 480, 226, 0.88, { ...A.CAST.you, face: FACE, shirt: "#1b2440", number: "", armUp: extra, sad: !extra, wave: t + 1 }); };
    if (passed) {
      say("LAST PLAY"); await wait(1100); G.us += 7; await touchdown("dallas"); G.q = "FINAL"; showHud();
      paint = both(true); fx = { kind: "td", start: now() }; say(r.hired ? "HIRED!" : "DALLAS WINS", "flash big");
      await checkpoint(r.hired ? "YOU GOT THE JOB" : "A WIN IN DALLAS", [r.hired ? "Jerry walks onto the field: \"You're my coach for the rest of the season.\"" : "Jerry shakes your hand: \"Good win. I'm going another direction next week.\" Score " + HIRED.toLocaleString("en-US") + " or more and he keeps you."], "Play again"); fx = null;
    } else {
      G.q = "FINAL"; paint = both(false); say("FINAL  " + G.us + " - " + G.them); sfx.over(); showHud();
      await checkpoint("THANKS FOR COMING", ["Jerry shakes your hand: \"Thanks for coming.\""], "Play again");
    }
  }
  return passed;
}

async function ending(id) {
  const start = now(); fx = { kind: "over", start };
  if (id === "jet") {
    paint = (t) => {
      const e = t - start;
      if (e < 3.4) { A.sky(c, t); A.plane(c, 60, 290); A.jerry(c, 430, 226, 0.95, { angry: true, grin: false }); A.person(c, 250, 226, 0.95, { ...A.CAST.you, face: FACE, hat: "#e8dcc0", armUp: true, wave: t }); }
      else { const y = Math.min(190, -40 + (e - 3.4) * 46), x = 320 + Math.sin(e * 1.4) * 60; A.stadium(c, t, { midfield: true }); A.chute(c, x, y, t, FACE); A.turkey(c, x + 80, y - 20, t); }
    };
    say("FIRED", "big"); await wait(3400); fx = null; say("YOU PARACHUTE IN ANYWAY"); sfx.silly(); await wait(5600);
  } else {
    paint = (t) => { A.stadium(c, t); A.cast(c, "receiver", 420, 226, 0.95, { wave: t }); A.person(c, 220, 226, 0.95, { ...A.CAST.you, face: FACE, shirt: "#1b2440", number: "", angry: true, armUp: true, wave: t }); };
    say("THE LOCKER ROOM IS GONE"); await wait(2400); fx = null;
  }
  await checkpoint("GAME OVER", [id === "jet" ? "Jerry fires you for being weird." : "You lose the team's trust and everything falls apart."], "Play again");
}

async function run() {
  showHud(); showBack();
  const flow = flowFor(G.seed);
  // How many calls the run owes by the end of each step, so a drive cut short by a turnover still leaves the count right.
  const due = []; let owed = 0; flow.forEach((f, i) => { owed += f.p || 0; due[i] = owed; });
  // A reload lands at the start of the step that was under way, so calls made inside that step are taken back.
  G.calls.length = Math.min(G.calls.length, G.step > 0 ? due[G.step - 1] : 0);
  for (let i = G.step; i < flow.length; i++) {
    const step = flow[i];
    if (step.s === "title") { G.step = i + 1; continue; }
    if (step.s) await scene(step.s);
    else if (step.d) {
      if (step.d === "twominute") { G.q = "Q4"; G.noTd = true; const want = Math.max(G.them, G.us + 4); if (want !== G.them || G.us !== want - 4) { say("SOME FOOTBALL HAPPENS"); await wait(1300); say(""); } G.them = want; G.us = want - 4; showHud(); }
      if (step.d === "commercial") { G.q = "HALF"; if (G.us < 7) { say("THE PUNTER SCORES. NOBODY KNOWS HOW."); G.us = 7; sfx.silly(); showHud(); await wait(1800); } G.half = 2; G.us = 7; G.them = Math.max(G.them, 17); say("HALFTIME  7 - 17"); sfx.whistle(); showHud(); await wait(1500); say(""); }
      if (step.d === "kicker") G.q = "Q3";
      if (step.d === "backup") G.q = "Q4";
      const got = await decide(step.d);
      if (got.over) { await ending(step.d); store.set(SAVE, null); return; }
    } else if (step.p) { G.callsDue = due[i]; await plays(step.p); }
    else if (step.gate) { const ok = await gate(step.gate); if (!ok || step.gate === 3) { store.set(SAVE, null); return; } }
    G.step = i + 1; save();
  }
  store.set(SAVE, null);
}

// ─── the opening ───
async function titleSequence() {
  const start = now(); let skip = false, thuds = 0, gobbled = false;
  const letters = "TURKEY BOWL".split("");
  const stop = () => { skip = true; };
  canvas.addEventListener("pointerdown", stop, { once: true }); onKey = stop;
  paint = (t) => {
    const e = skip ? 99 : t - start;
    if (e < 1.8) { c.fillStyle = "#000"; c.fillRect(0, 0, A.W, A.H); c.fillStyle = "#f4f1e6"; c.textAlign = "center"; c.font = "14px 'Press Start 2P', monospace"; c.globalAlpha = clamp(e / 0.5, 0, 1) * clamp((1.8 - e) / 0.4, 0, 1); c.fillText("COMM 118 PRESENTS", 320, 184); c.globalAlpha = 1; c.textAlign = "left"; return; }
    A.park(c, t, { time: e < 4.5 ? "dawn" : "day", field: false });
    c.textAlign = "center"; c.font = "44px 'Press Start 2P', monospace";
    letters.forEach((ch, i) => {
      const at = 2.4 + i * 0.16, p = clamp((e - at) / 0.28, 0, 1); if (p <= 0) return;
      if (p >= 1 && thuds <= i && !skip) { thuds = i + 1; sfx.thud(); }
      const bounce = p >= 1 ? Math.max(0, Math.sin((e - at - 0.28) * 14) * 10 * Math.exp(-(e - at) * 2.4)) : 0;
      const y = -40 + 190 * (p < 1 ? p * p : 1) - bounce, x = 84 + i * 47;
      c.fillStyle = "#1c1626"; c.fillText(ch, x + 4, y + 4); c.fillStyle = i < 6 ? "#ffd75e" : "#ff9d2e"; c.fillText(ch, x, y);
    });
    c.textAlign = "left";
    const te = e - 4.6;   // a turkey crosses, a football finds the turkey
    if (te > 0 && te < 4.2) {
      const hit = te > 2.2, tx = hit ? 390 + (te - 2.2) * 420 : 60 + te * 150, ty = 330 - (hit ? Math.sin((te - 2.2) * 2.2) * 150 : 0);
      c.save(); if (hit) { c.translate(tx, ty - 20); c.rotate((te - 2.2) * 12); c.translate(-tx, -ty + 20); } A.turkey(c, tx, ty, t); c.restore();
      if (!hit) A.ball(c, 700 - te * 150, 300, t * 16);
      if (hit && !gobbled && !skip) { gobbled = true; sfx.gobble(); }
    }
    A.leaves(c, t, 90);
    if (e > 5 && Math.floor(t * 2) % 2) { c.textAlign = "center"; c.font = "14px 'Press Start 2P', monospace"; c.fillStyle = "#1c1626"; c.fillText("THANKSGIVING MORNING", 322, 214); c.fillStyle = "#fff"; c.fillText("THANKSGIVING MORNING", 320, 212); c.textAlign = "left"; }
  };
  for (let i = 0; i < 92 && !skip; i++) await wait(100);
  skip = true; onKey = null; canvas.removeEventListener("pointerdown", stop);
}

async function title() {
  G = null; hud.textContent = ""; showBack(); say(""); ui.textContent = "";
  try { me = { ...me, ...(await api({ action: "me" })) }; } catch { /* the title still draws */ }
  if (me.photo && !FACE) { const img = await loadImage(me.photo); if (img) FACE = A.faceFrom(img); }
  try { await document.fonts.load("44px 'Press Start 2P'"); } catch { /* the fallback font draws */ }
  await titleSequence();
  const k = card("TURKEY BOWL");
  k.append(el("p", "scene", "It's Thanksgiving morning. The morning starts with the family football game. And if you're lucky, it'll end with you coaching the Dallas Cowboys to victory."));
  if (!me.open) { k.append(el("p", "say", "Turkey Bowl opens Tuesday, November 17.")); return false; }
  if (classRoute && !me.tag && !me.instructor) { const p = el("p", "say", "Sign in to play for COMM 118. "); const a = el("a", "", "Sign in"); a.href = "/login?next=" + encodeURIComponent(location.pathname); p.append(a); k.append(p); }
  let input = null;
  const row = el("div", "row"); k.append(row);
  if (me.tag) { const p = el("p", "say", "Coach " + me.name); p.append(el("span", "tag", me.tag)); row.append(p); }
  else if (!me.instructor) { input = el("input"); input.type = "text"; input.id = "coach"; input.maxLength = 30; input.autocomplete = "given-name"; input.setAttribute("aria-label", "Your first name and last initial"); input.placeholder = "First name, last initial"; input.value = store.get("turkeybowl-name"); row.append(input); }
  const old = saved();
  const cont = old ? el("button", "go", "Continue your game") : null; if (cont) { cont.type = "button"; row.append(cont); }
  const start = el("button", "go", old ? "New game" : "Kick off"); start.type = "button"; row.append(start);
  if (me.instructor) { const adm = el("button", "tool", "Level 3 list and avatars"); adm.type = "button"; adm.onclick = admin; row.append(adm); }
  try { const b = await api({ action: "board" }); if (b.ok && b.rows.length) boardCard(k, b.rows); } catch { /* no board yet */ }
  const choice = await new Promise(res => {
    const ok = () => { if (input) { const n = shortName(input.value); if (n.length < 2) { input.focus(); return false; } me.name = n; store.set("turkeybowl-name", input.value.trim()); } ac(); sfx.whistle(); return true; };
    start.onclick = () => { if (ok()) res("new"); };
    if (cont) cont.onclick = () => { if (ok()) res("continue"); };
  });
  G = choice === "continue" ? { ...fresh(), ...old, busy: false } : fresh();
  if (choice === "new") store.set(SAVE, null);
  return true;
}
async function admin() {
  const k = card("WEEKLY CHALLENGE 4"); k.append(el("p", "say", "Credit is reaching Level 3."));
  try {
    const out = await api({ action: "admin" }); const tb = el("table"), head = el("tr"); ["COACH", "EMAIL", "LEVEL", "BEST", "RUNS"].forEach(h => head.append(el("th", "", h))); tb.append(head);
    (out.rows || []).forEach(r => { const tr = el("tr", r.level >= 3 ? "me" : ""); const n = el("td", "", r.name); if (r.tag) n.append(el("span", "tag", r.tag)); tr.append(n, el("td", "", r.email), el("td", "", String(r.level)), el("td", "", String(r.score)), el("td", "", String(r.runs))); tb.append(tr); });
    const w = el("div", "board"); w.append(tb); k.append(w);
    const faces = el("div", "faces"); k.append(faces);
    for (const a of out.avatars || []) { const img = await loadImage(a.photo); if (!img) continue; const f = el("figure"); f.append(A.faceFrom(img), el("figcaption", "", a.name)); faces.append(f); }
  } catch (e) { k.append(el("p", "say", e.message)); }
  const back = el("button", "go", "Back"); back.type = "button"; back.onclick = () => location.reload(); k.append(back);
}

(async function main() { for (;;) { if (!(await title())) return; await run(); } })();
