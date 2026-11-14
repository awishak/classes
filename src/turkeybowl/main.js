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

import { flowFor, decisionOf, judge, scoreRun, lookFor, orderFor, popScene, POWER, RANK_SAY, VERDICT, LINKS, MAX_SCORE, HIRED, shortName } from "./script.js";
import * as A from "./art.js";
import { accessToken } from "../engine/session.js";

const $ = (id) => document.getElementById(id);
const canvas = $("screen"), c = canvas.getContext("2d"), ui = $("ui"), hud = $("hud"), banner = $("banner"), hint = $("hint"), pad = $("pad"), backBtn = $("back");
c.imageSmoothingEnabled = false;
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const store = { get(k) { try { return localStorage.getItem(k) || ""; } catch { return ""; } }, set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* private mode */ } } };
const classRoute = /^\/comm118\/turkey-bowl/.test(location.pathname);
// Andrew's sentence, 2026-11-14, in place of "Credit is reaching Level 3."
const CREDIT = "If you're playing this game as part of COMM 118, you have to make it to Level 3 to get credit.";
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
  // A turkey: a throaty note that warbles fast and falls, three times over. Andrew, 2026-11-14: "we need turkey gobbling noises."
  gobble: (at = 0, times = 3) => {
    const a = ac(); if (!a || muted) return;
    for (let n = 0; n < times; n++) {
      const t = a.currentTime + at + n * 0.42, dur = 0.36;
      const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), lfo = a.createOscillator(), depth = a.createGain(), trem = a.createGain(), f = a.createBiquadFilter();
      o.type = "sawtooth"; o2.type = "square";
      o.frequency.setValueAtTime(760 - n * 40, t); o.frequency.exponentialRampToValueAtTime(330, t + dur);
      o2.frequency.setValueAtTime(385 - n * 20, t); o2.frequency.exponentialRampToValueAtTime(170, t + dur);
      lfo.type = "square"; lfo.frequency.setValueAtTime(19, t); lfo.frequency.linearRampToValueAtTime(11, t + dur);
      depth.gain.value = 0.5; trem.gain.value = 0.5; lfo.connect(depth).connect(trem.gain);
      f.type = "bandpass"; f.frequency.value = 900; f.Q.value = 1.4;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(trem); o2.connect(trem); trem.connect(f).connect(g).connect(a.destination);
      [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + dur + 0.05); });
    }
  },
  silly: () => { [660, 520, 700, 300].forEach((f, i) => tone(f, i * 0.07, 0.07, "triangle", 0.08)); sfx.gobble(0.25, 4); },
  over: () => [392, 370, 349, 330, 196].forEach((f, i) => tone(f, i * 0.22, 0.3, "sawtooth", 0.06)),
  td: () => { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.14)); noise(0, 1.8, 0.07); sfx.gobble(1.0, 3); },
  cheer: () => noise(0, 1.1, 0.05),
  boo: () => tone(160, 0, 0.9, "sawtooth", 0.05, 110),
  jet: () => noise(0, 2.2, 0.04),
};
// The opening song: a square-wave tune over a triangle bass, written for this
// game. Andrew, 2026-11-14: "you gotta have a better opening thing with a
// better opening song." Eight bars that loop until the game starts.
const NOTE = { C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5 };
const SONG = {
  lead: "C5 . E5 G5 C6 . G5 E5 | A5 . G5 E5 G5 . . . | F5 . A5 C6 A5 . F5 D5 | G5 . B5 D5 G5 . . . | C5 . E5 G5 C6 . G5 E5 | A5 . C6 A5 G5 . E5 . | F5 E5 D5 F5 E5 D5 B4 D5 | C5 . G4 . C5 . . .",
  bass: "C3 . G3 . C3 . G3 . | A3 . E3 . A3 . E3 . | F3 . C4 . F3 . C4 . | G3 . D3 . G3 . B3 . | C3 . G3 . C3 . G3 . | A3 . E3 . A3 . E3 . | F3 . F3 . G3 . G3 . | C3 . G3 . C3 . . .",
};
const music = { timer: null, at: 0, step: 0,
  start() {
    const a = ac(); if (!a || this.timer) return;
    const lead = SONG.lead.replace(/\|/g, "").split(/\s+/).filter(Boolean), bass = SONG.bass.replace(/\|/g, "").split(/\s+/).filter(Boolean), dt = 0.2;
    this.at = a.currentTime + 0.1; this.step = 0;
    const play = (f, t, d, type, vol) => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02); };
    this.timer = setInterval(() => {
      while (this.at < a.currentTime + 0.35) {
        const i = this.step % lead.length;
        if (!muted) { if (NOTE[lead[i]]) { play(NOTE[lead[i]], this.at, dt * 1.7, "square", 0.05); play(NOTE[lead[i]] * 2, this.at, dt * 0.9, "square", 0.012); } if (NOTE[bass[i]]) play(NOTE[bass[i]], this.at, dt * 1.6, "triangle", 0.09); if (i % 2 === 1) { const n = Math.floor(a.sampleRate * 0.03), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0); for (let k = 0; k < n; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / n); const sN = a.createBufferSource(), g = a.createGain(); sN.buffer = buf; g.gain.value = 0.03; sN.connect(g).connect(a.destination); sN.start(this.at); } }
        this.at += dt; this.step++;
      }
    }, 80);
  },
  stop() { clearInterval(this.timer); this.timer = null; },
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
let G = null, started = false;
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
  const label = "A QUESTION ABOUT " + (dec.topic || "the game").toUpperCase();
  const scene = pop ? popScene(dec, dallas) : dec.scene;
  const k = card(""); k.classList.add("split");
  const left = el("div", "ask"); left.append(el("div", "who", label), el("p", "scene", scene)); k.append(left);
  const opts = el("div", "opts"); k.append(opts);
  const pick = await new Promise(res => {
    if (dec.pick) {
      const chosen = new Set(), go = el("button", "go", "Lock it in"); go.type = "button"; go.disabled = true;
      orderFor(G.seed, id, POWER.length).forEach(i => {
        const p = POWER[i], b = el("button", "opt", p.text); b.type = "button"; b.setAttribute("aria-pressed", "false");
        b.onclick = () => { sfx.click(); if (chosen.has(p.k)) chosen.delete(p.k); else if (chosen.size < dec.pick) chosen.add(p.k); b.setAttribute("aria-pressed", String(chosen.has(p.k))); go.disabled = chosen.size !== dec.pick; };
        opts.append(b);
      });
      go.onclick = () => res([...chosen]); left.append(go);
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
  r.append(el("p", "say", "You chose: " + chose));
  r.append(el("p", "scene", VERDICT[got.rank]));
  r.append(el("p", "say", got.then));
  r.append(el("p", "why", dec.after));
  const link = LINKS[id];
  if (link) { const a = el("a", "more", link.say + " ↗"); a.href = link.url; a.target = "_blank"; a.rel = "noopener noreferrer"; r.append(a); }
  G.log.push({ who: label, scene, rank: got.rank, pick: chose, lines: [got.then], why: dec.after }); showBack();
  await next(r, got.over ? "Uh oh" : "Continue");
  fx = null;
  return got;
}

// ─── football: one choice a play ───
// Andrew, 2026-11-14, after trying the dodging and the throwing meter: "the
// football gameplay is not good ... it's way too quick ... there's way too
// much football gameplay, and it needs to be something a lot simpler." So a
// play is one choice. The screen shows how the other team is lined up, the
// player picks run or pass, and the play runs slowly enough to watch. The
// right choice scores, or moves the ball; the wrong one ends the drive.
const TEAM = {
  park: { us: { jersey: "#e2622a", pants: "#3a4a66" }, them: { jersey: "#6a4bb0", pants: "#2a2a3a" } },
  dallas: { us: { jersey: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f" }, them: { jersey: "#b01e3a", pants: "#f1e3c6", helmet: "#f6c945" } },
};
const THEM = { park: "UNCLE RICK'S TEAM", dallas: "THE VISITORS" };
const HAIRS = ["#5a3a1e", "#1e1410", "#f3d67a", "#a8551c", "#e3e6ea"], SKINS = ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"];
const kin = (where, side, i) => ({ ...TEAM[where][side], hair: HAIRS[(i + (side === "us" ? 0 : 2)) % 5], skin: SKINS[(i + (side === "us" ? 0 : 1)) % 4], long: where === "park" && i % 3 === 1, dir: side === "us" ? 1 : -1 });
const field = (t, where, scroll, endzone) => { if (where === "park") A.park(c, t, { scroll }); else A.stadium(c, t, { scroll, endzone }); };
const rng = (s) => { let x = 7; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; };
const ease = (p) => p * p * (3 - 2 * p);
/** Where the other team stands for a look: [x, y] for each of five. */
const setOf = (look) => [0, 1, 2, 3, 4].map(i => look === "deep" ? [470 + (i % 2) * 50, 222 + i * 26] : look === "stack" ? [236 + (i % 2) * 10, 232 + i * 22] : look === "blitz" ? [250, 226 + i * 26] : [280 + (i % 2) * 40, 204 + i * 34]);
/** Both teams lined up before the snap. */
const lineup = (where, look) => (t) => {
  field(t, where, 0, false);
  for (let i = 0; i < 5; i++) A.player(c, 200, 226 + i * 26, kin(where, "us", i), 0);
  setOf(look).forEach(([x, y], i) => A.player(c, x + (look === "blitz" ? Math.sin(t * 9 + i) * 3 : 0), y, kin(where, "them", i), look === "blitz" ? Math.floor(t * 8) + i : 0));
  A.player(c, 150, 290, { ...kin(where, "us", 6), face: where === "park" ? FACE : null }, 0);
  A.ball(c, 214, 344);   // on the ground at the line, where a football sits before the snap
  if (where === "park") A.leaves(c, t, 30);
};
/** One play, slowly. score: it ends in the end zone. Resolves when the play is over. */
function playOut(call, good, where, look, score) {
  return new Promise(res => {
    const start = now(), dur = 3.6, them = setOf(look);
    let done = false;
    paint = (t) => {
      const p = clamp((t - start) / dur, 0, 1), go = ease(clamp((p - 0.12) / 0.8, 0, 1)), fr = p > 0.1 && p < 0.95 ? Math.floor(t * 8) : 0;
      field(t, where, 0, score && good);
      const end = good ? (score ? 600 : 470) : 196;
      for (let i = 0; i < 5; i++) A.player(c, 200 + go * 14, 226 + i * 26, kin(where, "us", i), fr + i);
      if (call === "run") {
        A.player(c, 150, 290, { ...kin(where, "us", 6), face: where === "park" ? FACE : null }, 0);
        const x = 168 + (end - 168) * go, y = 262 + Math.sin(go * 5) * (good ? 22 : 4);
        them.forEach(([hx, hy], i) => { const tx = good ? x - 40 - i * 16 : x + 14, ty = good ? hy : y + (i - 2) * 9; A.player(c, hx + (tx - hx) * go, hy + (ty - hy) * go, kin(where, "them", i), fr + i); });
        A.player(c, x, y, { ...kin(where, "us", 3), arms: good && score && p > 0.9 ? 1 : 0, down: !good && p > 0.8 }, fr);
        A.ball(c, x + 8, y - 24);
      } else {
        const qx = 150 - go * 16; A.player(c, qx, 290, { ...kin(where, "us", 6), face: where === "park" ? FACE : null, arms: p > 0.4 && p < 0.6 ? 1 : 0 }, 0);
        const rx = 230 + (Math.min(end, 560) - 230) * ease(clamp(p / 0.62, 0, 1)), ry = 214, th = clamp((p - 0.42) / 0.3, 0, 1), caught = p >= 0.72;
        const after = good && caught ? ease(clamp((p - 0.72) / 0.28, 0, 1)) * (score ? 60 : 20) : 0;
        them.forEach(([hx, hy], i) => { const tx = good ? rx - 50 - i * 14 : (i === 0 ? rx - 6 : qx + 40 + i * 12), ty = good ? hy : (i === 0 ? ry + 4 : 290); A.player(c, hx + (tx - hx) * go, hy + (ty - hy) * go, kin(where, "them", i), fr + i); });
        A.player(c, (good ? rx : Math.min(rx, 330)) + after, ry, { ...kin(where, "us", 3), arms: good && caught ? 1 : 0 }, fr);
        if (p < 0.42) A.ball(c, qx + 10, 264);
        else if (!caught) { const bx = qx + ((good ? rx : 330) - qx) * th; A.ball(c, bx, 264 + (ry - 30 - 264) * th - Math.sin(th * Math.PI) * 80, th * 6); }
        else if (good) A.ball(c, rx + after + 8, ry - 26);
        else A.ball(c, 352, Math.min(344, 240 + (p - 0.72) * 400));   // it falls, and it stays a football
      }
      if (where === "park") A.leaves(c, t, 30);
      if (p >= 1 && !done) { done = true; res(); }
    };
  });
}
/** Between plays: both sides standing around, so no finished play is left frozen on the screen. */
const idle = (where) => (t) => {
  field(t, where, 0, false);
  for (let i = 0; i < 5; i++) { A.player(c, 150 + (i % 2) * 30, 226 + i * 26, kin(where, "us", i), 0); A.player(c, 470 + (i % 2) * 30, 226 + i * 26, kin(where, "them", i), 0); }
  if (where === "park") A.leaves(c, t, 30);
};
/** Everybody celebrates, badly. */
async function touchdown(where, text = "TOUCHDOWN!") {
  const start = now();
  paint = (t) => {
    const e = t - start; field(t, where, 1800, true);
    for (let i = 0; i < 6; i++) A.player(c, 150 + i * 70, 300 - Math.abs(Math.sin(e * 5 + i)) * 40, { ...kin(where, "us", i), face: i === 2 && where === "park" ? FACE : null, arms: 1 }, 0);
    if (where === "park") A.leaves(c, t, 80);
  };
  fx = { kind: "td", start }; say(text, "flash big"); sfx.td(); showHud();
  await wait(2800); fx = null; say("");
}
/** The other team has the ball, and the player watches what they do with it. */
async function theirDrive(where, scores, how) {
  paint = idle(where);
  say(THEM[where] + " HAS THE BALL"); await wait(1500);
  const start = now(), who = kin(where, "them", 1);
  paint = (t) => {
    // Their runner goes right to left. Nobody is knocked flat: your side chases, and either catches the runner or does not.
    const e = t - start, x = scores ? Math.max(60, 560 - e * 130) : 470 - Math.min(e, 1.6) * 90, in_ = scores && x <= 60;
    field(t, where, 0, false);
    if (scores) { const top = where === "park" ? 200 : 150, h = where === "park" ? 148 : 196; c.fillStyle = where === "park" ? "rgba(106,75,176,.6)" : "rgba(176,30,58,.75)"; c.fillRect(0, top, 96, h); c.fillStyle = "#fff"; c.fillRect(96, top - 2, 3, h + 4); }
    for (let i = 0; i < 4; i++) A.player(c, scores ? x + 70 + i * 40 : Math.max(x - 26, 330 - i * 30 + Math.min(e, 1.6) * 20), 236 + i * 28, kin(where, "us", i), e < 4 ? Math.floor(t * 8) + i : 0);
    A.player(c, x, in_ ? 284 - Math.abs(Math.sin(e * 6)) * 24 : 284, { ...who, arms: in_ ? 1 : 0 }, in_ || (!scores && e > 1.6) ? 0 : Math.floor(t * 8));
    A.ball(c, x - 10, (in_ ? 258 - Math.abs(Math.sin(e * 6)) * 24 : 258));
    if (where === "park") A.leaves(c, t, 30);
  };
  say(how, "line"); await wait(scores ? 4200 : 2800);
  if (scores) { say("TOUCHDOWN FOR " + THEM[where]); sfx.boo(); await wait(1700); }
  say(""); paint = idle(where);
}
const THEIR_TD = { park: ["Uncle Rick runs it in from twenty yards out.", "Aunt Linda catches a long pass in the end zone.", "Uncle Rick's team marches down the field and scores."], dallas: ["The visitors throw a long pass for a touchdown.", "The visitors run it in from the five.", "The visitors march down the field and score."] };
const THEIR_STOP = { park: ["Your team stops them. They punt.", "Your nephew makes the tackle. They punt."], dallas: ["Your defense holds. They punt.", "Your defense stops them on third down."] };

async function snap() {
  const n = G.calls.length, look = lookFor(G.seed, n), where = G.where === "dallas" ? "dallas" : "park";
  paint = lineup(where, look.k); say("");
  const k = card("YOUR BALL. CALL THE PLAY.", true);
  k.append(el("p", "scene", look.say));
  k.append(el("p", "small", "Crowded close or rushing: pass over them. Far back or spread wide: run at them."));
  const calls = el("div", "calls"); k.append(calls);
  const call = await new Promise(res => {
    const mk = (v) => { const b = el("button", "call " + v, v.toUpperCase()); b.type = "button"; b.onclick = () => { onKey = null; res(v); }; calls.append(b); };
    mk("run"); mk("pass");
    onKey = (e) => { if (e.key === "r" || e.key === "1") { onKey = null; res("run"); } else if (e.key === "p" || e.key === "2") { onKey = null; res("pass"); } };
  });
  G.calls.push(call); G.busy = true; showBack();
  const good = look.beat === call;
  ui.textContent = ""; sfx.snap();
  // The right call is a touchdown. The wrong call is a punt. Nothing in between.
  await playOut(call, good, where, look.k, good);
  G.busy = false; showBack();
  let word;
  if (good) { G.us += 7; word = "Touchdown."; await touchdown(where); }
  else { word = call === "run" ? "Stopped at the line. You punt." : "Incomplete. You punt."; say(call === "run" ? "STOPPED AT THE LINE" : "INCOMPLETE"); sfx.bad(); await wait(1600); say("YOU PUNT."); await wait(1500); }
  say(""); showHud();
  G.log.push({ who: "A PLAY", lines: ["The other team: " + look.say, "You called a " + call + ". " + word] }); showBack();
}
async function plays() {
  G.window++;
  const where = G.where === "dallas" ? "dallas" : "park";
  await snap();
  // What the other team does with the ball. The story needs 21 to 14 at the park's half and down ten at Dallas's.
  // Plays 1 and 2 are the park's first half, 3 its second; 4 is Dallas before halftime and 5 after.
  const theirs = { 1: 7, 2: 14, 4: 7, 5: 20 }[G.window];
  const r = rng(G.seed + "their" + G.window);
  const last = G.window === 3;
  if (theirs && theirs > G.them) { await theirDrive(where, true, THEIR_TD[where][Math.floor(r() * 3)]); G.them = theirs; showHud(); await wait(400); }
  else if (!last) await theirDrive(where, false, THEIR_STOP[where][Math.floor(r() * 2)]);
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
    say("KICKOFF", "big"); sfx.whistle(); showHud();
    await lines("THE GAME STARTS", ["It's 8 AM. The leaves are coming down, and Uncle Rick's team kicks off to yours."], "Continue");
    await lines("HOW THE FOOTBALL WORKS", ["When your team has the ball, you call the play.", "First you see how the other team is lined up. Then you choose RUN or PASS.", "If they are crowded close or rushing, pass over them. If they are far back or spread wide, run at them."], "Got it");
    say("");
  } else if (name === "half1") {
    G.q = "HALF";
    const short = G.us < 14;
    G.half = 2; G.us = 14; G.them = Math.max(G.them, 21);
    paint = (t) => A.sideline(c, t, "park", FACE);
    say("HALFTIME  14 - 21"); sfx.whistle(); showHud();
    await lines("HALFTIME", [short ? "Your nephew returns a kick for a touchdown, and your team gets to 14 points by halftime. Then Uncle Rick's team scores on the last play of the half." : "Uncle Rick's team scores on the last play of the half.", "You are losing 21 to 14. Your team sits on the bench and looks at you."]);
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
      if (G.us >= G.them) { await theirDrive("park", true, "Uncle Rick's team scores late, and then scores again."); G.them = G.us + 7; }
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
  const due = []; let owed = 0; flow.forEach((f, i) => { owed += f.p || 0; due[i] = owed; });
  // A reload lands at the start of the step that was under way, so calls made inside that step are taken back.
  G.calls.length = Math.min(G.calls.length, G.step > 0 ? due[G.step - 1] : 0);
  for (let i = G.step; i < flow.length; i++) {
    const step = flow[i];
    if (step.s === "title") { G.step = i + 1; continue; }
    if (step.s) await scene(step.s);
    else if (step.d) {
      if (step.d === "twominute") { G.q = "Q4"; G.noTd = true; const want = Math.max(G.them, G.us + 4); if (want !== G.them || G.us !== want - 4) { say("LATE IN THE FOURTH QUARTER"); await wait(1500); say(""); } G.them = want; G.us = want - 4; showHud(); }
      if (step.d === "commercial") { G.q = "HALF"; if (G.us < 7) { say("DALLAS SCORES BEFORE THE HALF"); G.us = 7; showHud(); await wait(1800); } G.half = 2; G.us = 7; if (G.them < 17) { say("THE VISITORS SCORE TEN MORE BEFORE THE HALF"); await wait(2000); } G.them = Math.max(G.them, 17); say("HALFTIME  7 - 17"); sfx.whistle(); showHud(); await wait(1500); say(""); }
      if (step.d === "kicker") G.q = "Q3";
      if (step.d === "backup") G.q = "Q4";
      const got = await decide(step.d);
      if (got.over) { await ending(step.d); store.set(SAVE, null); return; }
      if (step.d === "kicker" && (got.rank === "best" || got.rank === "good")) { G.us += 3; paint = idle("dallas"); say("YOUR KICKER MAKES THE NEXT ONE FROM 47"); sfx.good(); showHud(); await wait(2200); say(""); }
    } else if (step.p) await plays();
    else if (step.gate) { const ok = await gate(step.gate); if (!ok || step.gate === 3) { store.set(SAVE, null); return; } }
    G.step = i + 1; save();
  }
  store.set(SAVE, null);
}

// ─── the opening ───
async function titleSequence() {
  const start = now(); let skip = false, thuds = 0, gobbled = false, strut = false;
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
    if (te > 0 && !strut && !skip) { strut = true; sfx.gobble(0, 3); }
    if (te > 0 && te < 4.2) {
      const hit = te > 2.2, tx = hit ? 390 + (te - 2.2) * 420 : 60 + te * 150, ty = 330 - (hit ? Math.sin((te - 2.2) * 2.2) * 150 : 0);
      c.save(); if (hit) { c.translate(tx, ty - 20); c.rotate((te - 2.2) * 12); c.translate(-tx, -ty + 20); } A.turkey(c, tx, ty, t); c.restore();
      if (!hit) A.ball(c, 700 - te * 150, 300, t * 16);
      if (hit && !gobbled && !skip) { gobbled = true; sfx.thud(); sfx.gobble(0.05, 4); }
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
  if (!started) {
    paint = (t) => { A.park(c, t, { time: "dawn", field: false }); A.leaves(c, t, 60); };
    const s0 = card(""); const b0 = el("button", "go", "Press start"); b0.type = "button"; b0.style.alignSelf = "center"; s0.append(b0);
    await new Promise(res => { b0.onclick = res; onKey = (e) => { if (e.key === "Enter" || e.key === " ") res(); }; });
    onKey = null; started = true; ui.textContent = ""; const a = ac(); if (a && a.state === "suspended") a.resume().catch(() => {});   // not awaited: a browser that will not start the sound must not stop the game
  }
  music.start();
  await titleSequence();
  const k = card("TURKEY BOWL");
  k.append(el("p", "scene", "It's Thanksgiving morning. Your family is playing their annual football game at 8 AM at the park, and you are the coach."));
  k.append(el("p", "scene", "If you're lucky, the day will end with you coaching the Dallas Cowboys to victory."));
  k.append(el("p", "say", CREDIT));
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
    const ok = () => { if (input) { const n = shortName(input.value); if (n.length < 2) { input.focus(); return false; } me.name = n; store.set("turkeybowl-name", input.value.trim()); } music.stop(); sfx.whistle(); return true; };
    start.onclick = () => { if (ok()) res("new"); };
    if (cont) cont.onclick = () => { if (ok()) res("continue"); };
  });
  G = choice === "continue" ? { ...fresh(), ...old, busy: false } : fresh();
  if (choice === "new") store.set(SAVE, null);
  return true;
}
async function admin() {
  const k = card("WEEKLY CHALLENGE 4"); k.append(el("p", "say", CREDIT));
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
