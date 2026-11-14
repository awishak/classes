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

import { flowFor, decisionOf, judge, scoreRun, lookFor, orderFor, popScene, POWER, RANK_SAY, VERDICT, LINKS, MAX_SCORE, shortName } from "./script.js";
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
// The music, all of it written for this game: the opening song, the drumline
// under every play, and the marching band's tune in Austin. Andrew,
// 2026-11-14: "a better opening song," "there needs to be music when the
// football's being played," and "I want you to use great marching band
// music." Brass is a sawtooth through a low-pass filter, three voices a note;
// the drums are shaped noise and a falling sine.
const SONGS = {
  title: { dt: 0.2, voice: "square",
    lead: "C5 . E5 G5 C6 . G5 E5 | A5 . G5 E5 G5 . . . | F5 . A5 C6 A5 . F5 D5 | G5 . B5 D5 G5 . . . | C5 . E5 G5 C6 . G5 E5 | A5 . C6 A5 G5 . E5 . | F5 E5 D5 F5 E5 D5 B4 D5 | C5 . G4 . C5 . . .",
    bass: "C3 . G3 . C3 . G3 . | A3 . E3 . A3 . E3 . | F3 . C4 . F3 . C4 . | G3 . D3 . G3 . B3 . | C3 . G3 . C3 . G3 . | A3 . E3 . A3 . E3 . | F3 . F3 . G3 . G3 . | C3 . G3 . C3 . . .",
    drum: "k . h . s . h . | k . h . s . h h" },
  play: { dt: 0.125, voice: "square",
    lead: "E5 . E5 . G5 . E5 . | D5 . D5 . F5 . D5 . | C5 . E5 . G5 . C6 . | B4 . D5 . G5 . . .",
    bass: "C3 C3 . C3 G2 . C3 . | D3 D3 . D3 A2 . D3 . | C3 C3 . C3 G2 . C3 . | G2 G2 . G2 B2 . D3 .",
    drum: "k h s h k k s h | k h s h k s s s" },
  // "The Eyes of Texas" is sung to "I've Been Working on the Railroad" (1894). These are that tune's first
  // sixteen bars, melody and bass, read note for note from a MIDI of the traditional song. A "-" holds the note before it.
  band: { dt: 0.125, voice: "brass",
    lead: "G5 - - - - - D5 - G5 - - D5 G5 - - A5 | B5 - - - - - - . G5 - - - - - - . | C6 - - - - - C6 - G5 - - - A5 - - - | B5 - - - - - - - - - - - - - - . | G5 - - - - - D5 - G5 - - D5 G5 - - A5 | B5 - - - - - - . G5 - - - B5 - - B5 | B5 - - - A5 - - - A5 - - - B5 - - - | A5 - - - - - - - - - - - - - - . | A5 - - - - - A5 - G#5 - - A5 B5 - - A5 | G5 - - - - - - . D5 - - - - - - . | C6 - - - C6 - - C6 G5 - - G5 A5 - - A5 | B5 - - - - - - - - - - - - - - . | E5 - - - - - F#5 - G5 - - F#5 G5 - - E5 | D5 - - - - - - . G5 - - - - - - . | B5 - - - C6 - - - B5 - - - A5 - - - | G5 - - - - - - - - - - - - - - .",
    bass: "G2 - - - D3 - - - G3 - - - D3 - - - | G2 - - - D3 - - - G3 - - - D3 - - - | C3 - - - G3 - - - C3 - - - - - - . | G2 - - - D3 - - - G3 - - - D3 - - - | G2 - - - D3 - - - G3 - - - D3 - - - | G2 - - - D3 - - - G3 - - - - - - . | E3 - - - - - - . A2 - - - - - - . | D3 - - - E3 - - - F#3 - - - D3 - - - | D2 - - - A2 - - - D3 - - - - - - . | G2 - - - D3 - - - G3 - - - D3 - - - | C3 - - - F#3 - - - G3 - - - - - - . | B2 - - - F#3 - - - B3 - - - A3 - - - | C3 - - - G3 - - - C#3 - - - - - - . | D3 - - - G3 - - - E3 - - - D#3 - - - | D3 - - - - - - . D2 - - - - - - . | G2 - - - D3 - - - G3 - - - - - - .",
    drum: "k . . . s . s . k . . . s . s s" },
  // "Texas Fight" as a guess. Andrew, 2026-11-14: "guess at the notes." No clean copy of the 1923 score was found,
  // so this is not a transcription. The song began as "Texas Taps," Taps played fast, and this is Taps set to its march rhythm.
  fight: { dt: 0.13, voice: "brass",
    lead: "G4 - G4 - C5 - - - | G4 - C5 - E5 - - - | G4 - C5 - E5 - G4 - | C5 - E5 - G5 - - - | C5 - E5 - G5 - - - | E5 - C5 - G4 - - - | G4 - G4 - C5 - E5 - | D5 - - - - - . . | G4 - G4 - C5 - - - | G4 - C5 - E5 - - - | A4 - C5 - F5 - A4 - | C5 - F5 - A5 - - - | G5 - E5 - C5 - - - | E5 - D5 - C5 - D5 - | C5 - - - - - - - | C5 - . . C5 - . .",
    bass: "C3 - G3 - C3 - G3 - | C3 - G3 - C3 - G3 - | C3 - G3 - C3 - G3 - | C3 - G3 - E3 - G3 - | C3 - G3 - C3 - G3 - | C3 - G3 - C3 - G3 - | C3 - G3 - A2 - A3 - | G2 - D3 - G2 - B2 - | C3 - G3 - C3 - G3 - | C3 - G3 - C3 - G3 - | F3 - C3 - F3 - C3 - | F3 - C3 - F3 - C3 - | C3 - G3 - C3 - G3 - | G2 - D3 - G2 - B2 - | C3 - G3 - C3 - G3 - | C3 - . . C3 - . .",
    drum: "k . s . k . s s" },
};
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** A note name to its pitch in hertz: "F#3", "C5". Anything else is silence. */
const pitch = (n) => { const m = /^([A-G])(#?)(\d)$/.exec(n || ""); return m ? 440 * Math.pow(2, (SEMI[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) + 1) * 12 - 69) / 12) : 0; };
const music = { timer: null, at: 0, step: 0, name: "",
  start(name) {
    const a = ac(); if (!a) return; if (this.name === name && this.timer) return; this.stop(); this.name = name;
    const song = SONGS[name], seq = (x) => x.replace(/\|/g, "").split(/\s+/).filter(Boolean), lead = seq(song.lead), bass = seq(song.bass), drum = seq(song.drum), dt = song.dt;
    this.at = a.currentTime + 0.08; this.step = 0;
    const osc = (f, t, d, type, vol) => { const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02); };
    const brass = (f, t, d) => { const flt = a.createBiquadFilter(), g = a.createGain(); flt.type = "lowpass"; flt.frequency.setValueAtTime(700, t); flt.frequency.linearRampToValueAtTime(2600, t + 0.05); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.085, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + d); [-7, 0, 7].forEach(cents => { const o = a.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = cents; o.connect(flt); o.start(t); o.stop(t + d + 0.02); }); flt.connect(g).connect(a.destination); };
    const hit = (kind, t) => {
      if (kind === "k") { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.16); return; }
      const len = kind === "s" ? 0.09 : 0.03, n = Math.floor(a.sampleRate * len), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0); for (let k = 0; k < n; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / n);
      const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = kind === "s" ? 1400 : 6000; src.buffer = buf; g.gain.value = kind === "s" ? 0.11 : 0.035; src.connect(f).connect(g).connect(a.destination); src.start(t);
    };
    this.timer = setInterval(() => {
      while (this.at < a.currentTime + 0.3) {
        const i = this.step;
        if (!muted) {
          const L = pitch(lead[i % lead.length]), Bn = pitch(bass[i % bass.length]), D = drum[i % drum.length], held = (q) => { let n = 0; while (n < 16 && q[(i + 1 + n) % q.length] === "-") n++; return n; }, ll = held(lead) * dt, bl = held(bass) * dt;
          if (L) { if (song.voice === "brass") { brass(L, this.at, dt * 1.9 + ll); brass(L / 2, this.at, dt * 1.9 + ll); } else { osc(L, this.at, dt * 1.7, "square", 0.045); osc(L * 2, this.at, dt * 0.9, "square", 0.012); } }
          if (Bn) osc(Bn, this.at, dt * 1.6 + bl, song.voice === "brass" ? "sawtooth" : "triangle", song.voice === "brass" ? 0.05 : 0.09);
          if (D && D !== ".") hit(D, this.at);
        }
        this.at += dt; this.step++;
      }
    }, 70);
  },
  stop() { clearInterval(this.timer); this.timer = null; this.name = ""; },
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
  const r = tally(), names = { park: ["YOU", "RICK"], dallas: ["DAL", "VIS"], texas: ["TEX", "A&M"] }[G.where];
  const left = el("div", "box"); left.append(document.createTextNode(names[0] + " " + G.us + "  " + names[1] + " " + G.them), el("br"), document.createTextNode(G.q));
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
const TX = { shirt: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6", dot: "" };
function backdrop(id) {
  const where = G.where;
  if (id === "breakfast") return (t) => A.kitchen(c, t);
  if (id === "jet") return (t) => { A.sky(c, t); A.plane(c, 200 + Math.sin(t) * 10, 110 + Math.sin(t * 1.7) * 6); };
  if (id === "speech") return (t) => { A.locker(c, t); for (let i = 0; i < 4; i++) A.cast(c, "kicker", 360 + i * 70, 214, 0.62, { number: String(52 + i * 11) }); A.person(c, 200, 222, 0.95, { ...A.CAST.you, face: FACE, shirt: "#1b2440", number: "", armUp: true, wave: t }); };
  if (id === "push" || id === "commercial") return (t) => { A.sideline(c, t, where, FACE); if (id === "commercial") A.jerry(c, 150, 220, 0.9, { armUp: true, wave: t }); };
  if (id === "twominute") return (t) => A.sideline(c, t, "texas", FACE);
  if (G.jerry) return (t) => { A.park(c, t, { time: "gold", field: false }); A.passerby(c, 120, 214, 0.6, "on"); A.leaves(c, t); };
  if (where !== "park") return (t) => A.stadium(c, t, { midfield: true, team: where });
  return (t) => { A.park(c, t); A.leaves(c, t); };
}

async function decide(id) {
  const dec = decisionOf(id), pop = !dec.level, dallas = G.where !== "park", base = backdrop(id);
  const who = ["commercial", "push", "speech", "breakfast", "jet"].includes(id) ? "" : dec.level === 2 ? "jerry" : dec.who;
  const phone = pop && dallas;
  const start = now();
  paint = (t) => {
    base(t);
    if (who && !phone) A.cast(c, who, 530, 218, 0.95, { wave: t - start, ...(dec.level === 4 ? TX : {}) });
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

// ─── football: one play a game ───
// Andrew, 2026-11-14: "The football stuff is really bad. I think we need to
// cut the football stuff ... maybe a third," "plays need to be different. It
// can't be the same play every time," and "there needs to be music when the
// football's being played." So each of the three games has one play, the last
// drive. The player sees how the other team is lined up and picks run or
// pass; the right call is a touchdown and the wrong call is a punt. Which run
// or which pass gets drawn changes from game to game, and a drumline plays
// under every one.
const TEAM = {
  park: { us: { jersey: "#e2622a", pants: "#3a4a66" }, them: { jersey: "#6a4bb0", pants: "#2a2a3a" } },
  dallas: { us: { jersey: "#1b2a6b", pants: "#c9d3e6", helmet: "#c9d3e6", dot: "#1d3c8f" }, them: { jersey: "#b01e3a", pants: "#f1e3c6", helmet: "#f6c945" } },
  texas: { us: { jersey: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6" }, them: { jersey: "#500000", pants: "#d9d2c4", helmet: "#500000" } },
};
const THEM = { park: "UNCLE RICK'S TEAM", dallas: "THE VISITORS", texas: "TEXAS A&M" };
const HAIRS = ["#5a3a1e", "#1e1410", "#f3d67a", "#a8551c", "#e3e6ea"], SKINS = ["#e8b98a", "#c98a5a", "#8a5a3a", "#f0c8a0"];
const kin = (where, side, i) => ({ ...TEAM[where][side], hair: HAIRS[(i + (side === "us" ? 0 : 2)) % 5], skin: SKINS[(i + (side === "us" ? 0 : 1)) % 4], long: where === "park" && i % 3 === 1, dir: side === "us" ? 1 : -1 });
const field = (t, where, scroll, endzone) => { if (where === "park") A.park(c, t, { scroll }); else A.stadium(c, t, { scroll, endzone, team: where }); };
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
// Six plays, so no two games look alike: three ways to run and three ways to throw.
const PLAYS = {
  run: [
    { name: "SWEEP RIGHT", path: (g) => [168 + 432 * g, 262 + Math.sin(g * Math.PI) * 70] },
    { name: "UP THE MIDDLE", path: (g) => [168 + 432 * g, 276 + Math.sin(g * 14) * 5] },
    { name: "REVERSE", path: (g) => (g < 0.25 ? [168 - g * 4 * 70, 262 - g * 4 * 40] : [98 + (g - 0.25) / 0.75 * 502, 222 + Math.sin((g - 0.25) / 0.75 * Math.PI) * 90]) },
  ],
  pass: [
    { name: "DEEP BALL", depth: 330, arc: 120, after: 60 },
    { name: "QUICK SLANT", depth: 150, arc: 40, after: 240 },
    { name: "SCREEN PASS", depth: 40, arc: 70, after: 350 },
  ],
};
/** One play, slowly. good: the right call, which ends in the end zone. Resolves when the play is over. */
function playOut(call, good, where, look, which) {
  return new Promise(res => {
    const start = now(), dur = 4.4, them = setOf(look), v = PLAYS[call][which % 3];
    let done = false;
    paint = (t) => {
      const p = clamp((t - start) / dur, 0, 1), go = ease(clamp((p - 0.1) / 0.82, 0, 1)), fr = p > 0.08 && p < 0.96 ? Math.floor(t * 8) : 0;
      field(t, where, 0, good);
      for (let i = 0; i < 5; i++) A.player(c, 200 + go * 14, 226 + i * 26, kin(where, "us", i), fr + i);
      const qb = { ...kin(where, "us", 6), face: where === "park" ? FACE : null };
      if (call === "run") {
        A.player(c, 150, 290, qb, 0);
        const g = good ? go : go * 0.07, [x, y] = v.path(g);
        them.forEach(([hx, hy], i) => { const tx = good ? x - 46 - i * 18 : x + 16, ty = good ? hy + (y - hy) * 0.5 : y + (i - 2) * 9; A.player(c, hx + (tx - hx) * go, hy + (ty - hy) * go, kin(where, "them", i), fr + i); });
        A.player(c, x, y, { ...kin(where, "us", 3), arms: good && p > 0.93 ? 1 : 0, down: !good && p > 0.7 }, fr);
        A.ball(c, x + 8, y - 24);
        if (good && fr) for (let k = 0; k < 4; k++) { c.fillStyle = "rgba(255,255,255," + (0.3 - k * 0.07) + ")"; c.fillRect(x - 14 - k * 9, y - 6 + k, 6, 3); }   // dust at the runner's heels
      } else {
        const qx = 150 - go * 16, th0 = 0.34, th1 = 0.6;
        A.player(c, qx, 290, { ...qb, arms: p > th0 && p < th1 ? 1 : 0 }, 0);
        const rx0 = 230 + v.depth * ease(clamp(p / th1, 0, 1)), ry = 214, th = clamp((p - th0) / (th1 - th0), 0, 1), caught = p >= th1;
        const run = good && caught ? ease(clamp((p - th1) / (1 - th1), 0, 1)) * v.after : 0, rx = rx0 + run;
        them.forEach(([hx, hy], i) => { const tx = good ? rx - 56 - i * 16 : (i === 0 ? rx0 - 4 : qx + 40 + i * 12), ty = good ? hy + (ry - hy) * 0.5 : (i === 0 ? ry + 4 : 290); A.player(c, hx + (tx - hx) * go, hy + (ty - hy) * go, kin(where, "them", i), fr + i); });
        A.player(c, good ? rx : Math.min(rx0, 330), ry, { ...kin(where, "us", 3), arms: good && caught && p < th1 + 0.08 ? 1 : 0 }, fr);
        const aimX = good ? rx0 : Math.min(rx0, 330) + 26;
        if (p < th0) A.ball(c, qx + 10, 264);
        else if (!caught) A.ball(c, qx + (aimX - qx) * th, 264 + (ry - 30 - 264) * th - Math.sin(th * Math.PI) * v.arc, -0.5 + th);
        else if (good) A.ball(c, rx + 8, ry - 24);
        else A.ball(c, aimX + 10, Math.min(344, 240 + (p - th1) * 380));   // it falls, and it stays a football
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
/** Everybody celebrates, and the turkey dances. */
async function touchdown(where, text = "TOUCHDOWN!") {
  const start = now();
  paint = (t) => {
    const e = t - start; field(t, where, 1800, true);
    for (let i = 0; i < 6; i++) A.player(c, 90 + i * 60, 318 - Math.abs(Math.sin(e * 5 + i)) * 30, { ...kin(where, "us", i), face: i === 2 && where === "park" ? FACE : null, arms: 1 }, 0);
    A.turkeyDance(c, 500, 330, t, where === "dallas" ? "dougie" : "macarena", 2.4);
    if (where === "texas") A.turkeyDance(c, 590, 336, t, "dougie", 1.6);
    if (where === "park") A.leaves(c, t, 80);
  };
  fx = { kind: "td", start }; say(text, "flash big"); sfx.td(); showHud();
  if (where === "texas") music.start("fight");
  await wait(where === "texas" ? 6200 : 4200); fx = null; say(""); if (where === "texas") music.stop();
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
    if (scores) { const top = where === "park" ? 200 : 150, h = where === "park" ? 148 : 196; c.fillStyle = TEAM[where].them.jersey + "bb"; c.fillRect(0, top, 96, h); c.fillStyle = "#fff"; c.fillRect(96, top - 2, 3, h + 4); }
    for (let i = 0; i < 4; i++) A.player(c, scores ? x + 70 + i * 40 : Math.max(x - 26, 330 - i * 30 + Math.min(e, 1.6) * 20), 236 + i * 28, kin(where, "us", i), e < 4 ? Math.floor(t * 8) + i : 0);
    A.player(c, x, in_ ? 284 - Math.abs(Math.sin(e * 6)) * 24 : 284, { ...who, arms: in_ ? 1 : 0 }, in_ || (!scores && e > 1.6) ? 0 : Math.floor(t * 8));
    A.ball(c, x - 10, (in_ ? 258 - Math.abs(Math.sin(e * 6)) * 24 : 258));
    if (where === "park") A.leaves(c, t, 30);
  };
  say(how, "line"); await wait(scores ? 4200 : 2800);
  if (scores) { say("TOUCHDOWN FOR " + THEM[where]); sfx.boo(); await wait(1700); }
  say(""); paint = idle(where);
}

/** The one play of a game: the last drive. */
async function plays() {
  const n = G.calls.length, look = lookFor(G.seed, n), where = G.where;
  if (!n) await lines("HOW THE FOOTBALL WORKS", ["Each game comes down to one drive, and you call the play.", "First you see how the other team is lined up. Then you choose RUN or PASS.", "If they are crowded close or rushing, pass over them. If they are far back or spread wide, run at them."], "Got it");
  paint = lineup(where, look.k); say("THE LAST DRIVE");
  const k = card("YOUR BALL. CALL THE PLAY.", true);
  k.append(el("p", "scene", look.say));
  const calls = el("div", "calls"); k.append(calls);
  const call = await new Promise(res => {
    const mk = (v) => { const b = el("button", "call " + v, v.toUpperCase()); b.type = "button"; b.onclick = () => { onKey = null; res(v); }; calls.append(b); };
    mk("run"); mk("pass");
    onKey = (e) => { if (e.key === "r" || e.key === "1") { onKey = null; res("run"); } else if (e.key === "p" || e.key === "2") { onKey = null; res("pass"); } };
  });
  G.calls.push(call); G.busy = true; showBack();
  const good = look.beat === call, which = (n + (G.seed.charCodeAt(0) % 3)) % 3;
  ui.textContent = ""; sfx.snap(); music.start(where === "texas" ? "fight" : "play"); say(PLAYS[call][which].name);
  await playOut(call, good, where, look.k, which);
  music.stop(); G.busy = false; showBack();
  let word;
  if (good) { G.us += 7; word = "Touchdown."; await touchdown(where); }
  else { word = call === "run" ? "Stopped at the line. You punt." : "Incomplete. You punt."; say(call === "run" ? "STOPPED AT THE LINE" : "INCOMPLETE"); sfx.bad(); await wait(1700); say("YOU PUNT."); await wait(1500); }
  say(""); showHud(); paint = idle(where);
  G.log.push({ who: "THE LAST DRIVE", lines: ["The other team: " + look.say, "You called a " + call + ", " + PLAYS[call][which].name.toLowerCase() + ". " + word] }); showBack();
}

// ─── cut scenes ───
async function scene(name) {
  if (name === "kickoff") {
    G.q = "Q1"; const start = now();
    paint = (t) => {
      const p = Math.min(1, (t - start) / 2.6); A.park(c, t);
      for (let i = 0; i < 5; i++) { A.player(c, 80 + p * 60, 226 + i * 26, kin("park", "them", i), Math.floor(t * 9)); A.player(c, 560 - p * 40, 226 + i * 26, { ...kin("park", "us", i), dir: -1, face: i === 2 ? FACE : null }, Math.floor(t * 9)); }
      A.ball(c, 140 + p * 380, 240 - Math.sin(p * Math.PI) * 150, -0.6 + p); A.leaves(c, t, 70);
    };
    say("KICKOFF", "big"); sfx.whistle(); showHud();
    await lines("THE GAME STARTS", ["It's 8 AM. The leaves are coming down, and Uncle Rick's team kicks off to yours."]);
    say("");
  } else if (name === "half1") {
    G.q = "HALF"; G.half = 2; G.us = 14; G.them = 21;
    paint = (t) => A.sideline(c, t, "park", FACE);
    say("HALFTIME  14 - 21"); sfx.whistle(); showHud();
    await lines("HALFTIME", ["Both teams have scored twice. Then Uncle Rick's team scores on the last play of the half.", "You are losing 21 to 14. Your team sits on the bench and looks at you."]);
    say(""); G.q = "Q4";
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
    G.where = "dallas"; G.us = 0; G.them = 0; G.q = "Q1"; G.half = 1; G.jerry = false;
    paint = (t) => { A.stadium(c, t, { midfield: true }); A.fireworks(c, t, 4); };
    say("DALLAS", "big"); sfx.cheer(); showHud();
    post();   // reaching Level 3 is the credit, so the server hears about the landing
    await lines("THANKSGIVING AFTERNOON", ["The stadium, the big screen, a blue star on silver at midfield, a full crowd, cameras everywhere.", "You are the head coach of the Dallas Cowboys."]);
    say("");
  } else if (name === "texas") {
    // The third game. "You get the real best head coaching job, which is the Texas Longhorns against Texas A&M. And that's a night game."
    const start = now();
    paint = (t) => { A.stadium(c, t, { midfield: true }); A.jerry(c, 150, 226, 0.9, { armUp: true, wave: t }); A.person(c, 470, 226, 0.9, { ...A.CAST.you, face: FACE, shirt: "#1b2440", number: "" }); c.save(); c.translate(520, 40 + Math.sin(t * 60) * (t - start < 2 ? 3 : 0)); c.fillStyle = "#16121f"; c.fillRect(0, 0, 60, 106); c.fillStyle = "#bf5700"; c.fillRect(5, 10, 50, 84); c.fillStyle = "#fff"; c.font = "8px 'Press Start 2P', monospace"; c.fillText("TEXAS", 9, 56); c.restore(); };
    say("YOUR PHONE RINGS"); sfx.good();
    await lines("ONE MORE CALL", ["It's the University of Texas. Their head coach quit an hour ago, and they play Texas A&M tonight.", "They watched you win in Dallas. They want you in Austin by kickoff."], "Go to Austin");
    G.where = "texas"; G.us = 0; G.them = 0; G.q = "Q1"; G.half = 1;
    const s2 = now(); music.start("band");
    paint = (t) => { A.stadium(c, t, { team: "texas" }); A.band(c, t, t - s2); A.fireworks(c, t, 3); };
    ui.textContent = ""; say("TEXAS vs TEXAS A&M"); sfx.cheer(); showHud();
    await wait(7000);   // the band has the field to itself before any words come up
    await lines("THANKSGIVING NIGHT", ["A night game in Austin. A hundred thousand people in burnt orange, and the band is on the field.", "Win this one and you are the champion of the whole day."]);
    music.stop(); say("");
  } else if (name === "band") {
    // Halftime in Austin: the band, and the turkey with the band.
    G.q = "HALF"; G.half = 2; G.us = 10; G.them = 14; showHud();
    const start = now(); music.start("band");
    paint = (t) => { const e = t - start; A.stadium(c, t, { team: "texas" }); A.band(c, t, e); if (e > 5) { A.turkeyDance(c, 320, 346, t, "macarena", 2.6); A.turkeyDance(c, 90, 346, t, "dougie", 1.8); A.turkeyDance(c, 550, 346, t, "dougie", 1.8); } };
    ui.textContent = ""; say("HALFTIME  10 - 14"); sfx.whistle();
    await wait(5200); say("THE TURKEY JOINS THE BAND", "line"); sfx.gobble(0, 3); await wait(6000);
    await lines("HALFTIME IN AUSTIN", ["The band spells TEXAS across the field. Then a turkey walks out and does the Macarena, and a hundred thousand people do it too.", "You are losing to Texas A&M, 14 to 10."]);
    music.stop(); say(""); G.q = "Q4";
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
    if (i >= 6 && i !== mine) return;
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

// A game is won or lost on how the player coached, which is the level's points.
// The scoreboard is then made to say so, in words, whichever way the last drive went.
async function finish(where, won) {
  const name = THEM[where], scored = G.us > (where === "park" ? 14 : where === "dallas" ? 7 : 10);
  if (won) {
    if (!scored) { say("YOUR DEFENSE GETS THE BALL BACK"); await wait(1700); G.us += 7; await touchdown(where, "TOUCHDOWN ANYWAY!"); }
    if (G.us <= G.them) { say("ONE MORE STOP, ONE MORE SCORE"); await wait(1700); while (G.us <= G.them) G.us += 7; await touchdown(where); }
  } else if (G.us >= G.them || scored) {
    await theirDrive(where, true, name.charAt(0) + name.slice(1).toLowerCase().replace("a&m", "A&M").replace("rick", "Rick") + " scores in the last minute.");
    G.them = Math.max(G.them, G.us) + 7;
  }
  G.q = "FINAL"; showHud();
}
async function gate(n) {
  const r = tally(), passed = r.lost !== n;
  if (n === 1) {
    await finish("park", passed);
    paint = (t) => { A.sideline(c, t, "park", FACE); if (passed) A.turkeyDance(c, 300, 346, t, "macarena", 2.2); };
    if (passed) { fx = { kind: "td", start: now() }; say("YOU WIN  " + G.us + " - " + G.them, "big"); await checkpoint("LEVEL 1 COMPLETE", ["Your family wins the Turkey Bowl."], "Go home?"); fx = null; }
    else { say("FINAL  " + G.us + " - " + G.them); sfx.over(); await checkpoint("YOU LOSE THE TURKEY BOWL", ["The team stopped listening to you somewhere in the second quarter. Your uncle will bring this up at dinner."], "Play again"); }
  } else if (n === 2) {
    paint = (t) => { A.park(c, t, { time: "gold", field: false }); A.jerry(c, 320, 226, 0.95, { armUp: passed, wave: t }); A.leaves(c, t); };
    if (passed) { sfx.good(); fx = { kind: "best", start: now() }; await checkpoint("LEVEL 2 COMPLETE", ["Jerry: \"I like you. You're coaching my team today.\""], "To the jet"); fx = null; }
    else { sfx.over(); await checkpoint("NO JOB", ["Jerry: \"I'll keep looking. Happy Thanksgiving.\""], "Play again"); }
  } else if (n === 3) {
    await finish("dallas", passed);
    paint = (t) => { A.stadium(c, t, { midfield: true }); A.jerry(c, 150, 226, 0.9, passed ? { armUp: true, wave: t } : {}); A.person(c, 480, 226, 0.88, { ...A.CAST.you, face: FACE, shirt: "#1b2440", number: "", armUp: passed, sad: !passed, wave: t + 1 }); };
    if (passed) { fx = { kind: "td", start: now() }; say("DALLAS WINS  " + G.us + " - " + G.them, "big"); await checkpoint("LEVEL 3 COMPLETE", ["Jerry walks onto the field: \"You're my coach for the rest of the season.\""], "Continue"); fx = null; }
    else { say("FINAL  " + G.us + " - " + G.them); sfx.over(); await checkpoint("THANKS FOR COMING", ["Jerry shakes your hand: \"Thanks for coming.\""], "Play again"); }
  } else {
    await finish("texas", passed);
    const start = now();
    if (passed) {
      music.start("band");
      paint = (t) => { A.stadium(c, t, { team: "texas" }); A.band(c, t, 10 + (t - start)); A.turkeyDance(c, 320, 350, t, "macarena", 2.8); A.person(c, 560, 226, 0.85, { ...A.CAST.you, face: FACE, shirt: "#bf5700", number: "", armUp: true, wave: t }); A.fireworks(c, t, 8); };
      fx = { kind: "td", start }; say("CHAMPION!", "flash big"); sfx.cheer(); ui.textContent = "";
      await wait(6500);   // the band and the turkey get the whole screen before the score card comes up
      await checkpoint("YOU ARE THE CHAMPION", ["Texas beats Texas A&M, " + G.us + " to " + G.them + ". The band plays, the turkey dances, and you won all three games in one day."], "Play again"); fx = null; music.stop();
    } else {
      paint = (t) => { A.sideline(c, t, "texas", FACE); }; say("FINAL  " + G.us + " - " + G.them); sfx.over();
      await checkpoint("SO CLOSE", ["Texas A&M wins in Austin. You still won two games today, which is two more than most people."], "Play again");
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
      else { const y = Math.min(190, -40 + (e - 3.4) * 46), x = 320 + Math.sin(e * 1.4) * 60; A.stadium(c, t, { midfield: true }); A.chute(c, x, y, t, FACE); A.turkeyDance(c, 540, 340, t, "dougie", 2); }
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
  // A reload lands at the start of the step that was under way, so a call made inside that step is taken back.
  G.calls.length = Math.min(G.calls.length, G.step > 0 ? due[G.step - 1] : 0);
  for (let i = G.step; i < flow.length; i++) {
    const step = flow[i];
    if (step.s === "title") { G.step = i + 1; continue; }
    if (step.s) await scene(step.s);
    else if (step.d) {
      // The story's scores, said out loud before the question that depends on them.
      if (step.d === "commercial") { G.q = "HALF"; G.half = 2; G.us = 7; G.them = 17; say("HALFTIME IN DALLAS  7 - 17"); sfx.whistle(); showHud(); await wait(1900); say(""); }
      if (step.d === "speech") G.q = "Q4";
      if (step.d === "kicker") { G.q = "Q2"; G.us = 7; G.them = 7; showHud(); }
      if (step.d === "twominute") { G.q = "Q4"; G.them = 21; G.us = 17; say("TWO MINUTES LEFT  17 - 21"); showHud(); await wait(1900); say(""); }
      const got = await decide(step.d);
      ui.textContent = "";   // the answered card comes down before anything else is drawn
      if (got.over) { await ending(step.d); store.set(SAVE, null); return; }
      if (step.d === "kicker" && (got.rank === "best" || got.rank === "good")) { G.us += 3; paint = idle("texas"); say("YOUR KICKER MAKES THE NEXT ONE FROM 47"); sfx.good(); showHud(); await wait(2200); say(""); }
    } else if (step.p) await plays();
    else if (step.gate) { const ok = await gate(step.gate); if (!ok || step.gate === 4) { store.set(SAVE, null); return; } }
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
    const te = e - 4.6;   // a turkey walks on and dances
    if (te > 0 && !strut && !skip) { strut = true; sfx.gobble(0, 3); }
    if (te > 0) { const tx = Math.min(320, 60 + te * 150); if (tx < 320) A.turkey(c, tx, 334, t); else A.turkeyDance(c, 320, 338, t, "macarena", 2.4); }
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
  music.start("title");
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

// The songs on their own, at ?songs, so they can be heard without playing to Austin. Andrew, 2026-11-14: "play all the songs for me."
function songs() {
  paint = (t) => { A.stadium(c, t, { team: "texas" }); A.band(c, t, 10 + t); };
  const k = card("SONGS"), row = el("div", "row"); k.append(row);
  [["title", "Title"], ["play", "Drumline"], ["band", "The Eyes of Texas"], ["fight", "Texas Fight"]].forEach(([id, label]) => {
    const b = el("button", "go", label); b.type = "button";
    b.onclick = () => { muted = false; showMute(); const a = ac(); if (a && a.state === "suspended") a.resume().catch(() => {}); music.stop(); music.start(id); };
    row.append(b);
  });
  const g = el("button", "go", "Gobble"); g.type = "button"; g.onclick = () => { muted = false; showMute(); music.stop(); sfx.gobble(0, 3); }; row.append(g);
  const stop = el("button", "go", "Stop"); stop.type = "button"; stop.onclick = () => music.stop(); row.append(stop);
}
if (new URLSearchParams(location.search).has("songs")) songs();
else (async function main() { for (;;) { if (!(await title())) return; await run(); } })();
