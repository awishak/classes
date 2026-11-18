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
// 2026-11-16, after two passes at smoother pictures: "the graphics are not
// good enough. so maybe we go back down to 8 bit, and make it fun that way."
// So the picture is 320 by 180 squares in one palette of 56 colours, drawn
// by art.js and venues.js square by square, and a play is seen from the side.
//
// So: a run is saved in the browser after every step and picked up on
// reload. Back pages through what has already happened, read only. A play
// is called and then played: a run is three lanes and defenders to dodge, a
// pass is a meter to stop. Every drive ends in words that say what happened,
// and when the other side scores the player watches them do it. A signed-in
// student's photograph is cut down to a small pixel face and worn by their
// coach.

import { flowFor, decisionOf, judge, scoreRun, lookFor, orderFor, popScene, POWER, RANK_SAY, VERDICT, LINKS, MAX_SCORE, shortName, ALTS } from "./script.js";
import { ROLL, SHOW, NAMES, ANN, RECORDED, took, parkTarget, dallasTarget, jerryRemembers, couch, clearRead, ASIDES, NICE_HIT } from "./story.js";
import * as A from "./art.js";
import { accessToken } from "../engine/session.js";

const $ = (id) => document.getElementById(id);
const canvas = $("screen"), c = canvas.getContext("2d", { willReadFrequently: true }), ui = $("ui"), hud = $("hud"), banner = $("banner"), hint = $("hint"), pad = $("pad"), backBtn = $("back");
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
  blip: () => tone(420 + Math.random() * 60, 0, 0.025, "square", 0.025),
  roll: (dur = 0.55) => { for (let i = 0; i < dur / 0.05; i++) noise(i * 0.05, 0.045, 0.04 + i * 0.004); },
  slam: () => { tone(110, 0, 0.22, "square", 0.12, 40); noise(0, 0.18, 0.09); },
  sting: () => [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.16, "square", 0.06)),
  splat: () => { noise(0, 0.25, 0.12); tone(240, 0, 0.2, "sine", 0.1, 70); },
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
  band: { dt: 0.085, voice: "brass",
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
// The announcer: a line shown in the booth box and spoken by the browser's own voice. Andrew, 2026-11-14:
// "announcer voice for sure ... you choose a voice first." The voice is the deepest plain American one the
// device has, a little fast and a little low. A line he records later plays from a file instead (RECORDED).
const booth = $("booth"); let boothTimer = 0, VOICE = null;
const pickVoice = () => { try { const vs = speechSynthesis.getVoices(), want = ["Alex", "Aaron", "Microsoft Guy Online (Natural) - English (United States)", "Microsoft David - English (United States)", "Google UK English Male", "Daniel", "Fred"]; VOICE = want.map(n => vs.find(v => v.name === n)).find(Boolean) || vs.find(v => /^en[-_]US/.test(v.lang)) || vs.find(v => /^en/.test(v.lang)) || null; } catch { VOICE = null; } };
if ("speechSynthesis" in window) { pickVoice(); try { speechSynthesis.addEventListener("voiceschanged", pickVoice); } catch { /* an old browser keeps the first pick */ } }
function announce(id, text = ANN[id]) {
  if (!text) return;
  booth.textContent = ""; booth.append(el("b", "", "ANNOUNCER"), document.createTextNode(text)); booth.className = "on";
  clearTimeout(boothTimer); boothTimer = setTimeout(() => { booth.className = ""; }, 2200 + text.length * 60);
  if (muted) return;
  if (RECORDED.has(id)) { try { new Audio("/turkeybowl-voice/" + id + ".mp3").play().catch(() => {}); } catch { /* no file, no voice */ } return; }
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); if (VOICE) u.voice = VOICE; u.rate = 1.12; u.pitch = 0.8; u.volume = 0.9; speechSynthesis.speak(u); } catch { /* the line is still on screen */ }
}
const muteBtn = $("mute");
const showMute = () => { muteBtn.textContent = muted ? "Sound off" : "Sound on"; muteBtn.setAttribute("aria-pressed", String(muted)); };
muteBtn.onclick = () => { muted = !muted; if (muted) { try { speechSynthesis.cancel(); } catch { /* nothing was speaking */ } } store.set("turkeybowl-mute", muted ? "1" : "0"); showMute(); if (!muted) sfx.click(); };
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
    if (p < 1) { c.save(); c.translate(-80 + (x + 80) * p, 300 - (300 - y) * p - Math.sin(p * Math.PI) * 90); c.rotate(e * 14); c.scale(2, 2); A.food(c, "pie"); c.restore(); }
    else { c.fillStyle = "#d9772a"; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(x + Math.cos(i) * (10 + i * 3), y + Math.sin(i * 2) * (8 + i * 2) + Math.min(30, (e - 0.5) * 12), 9 - i * 0.5, 0, 7); c.fill(); } c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y - 4, 9, 0, 7); c.fill(); }
  } else if (fx.kind === "over") { c.fillStyle = `rgba(200,30,30,${0.35 + Math.sin(e * 16) * 0.2})`; c.fillRect(0, 0, A.W, A.H); }
}
// A moment that stops (hit-stop), a screen that shakes, and a white flash: the cut scenes' punctuation.
let stopUntil = 0, stopAt = 0, shakeUntil = 0, flashUntil = 0;
const hitStop = (ms = 110) => { stopAt = now(); stopUntil = performance.now() + ms; };
const shake = (ms = 280) => { shakeUntil = performance.now() + ms; };
const flash = (ms = 90) => { flashUntil = performance.now() + ms; };
(function frame() {
  const t = performance.now() < stopUntil ? stopAt : now();
  // The picture is 320 by 180 squares. Every drawing still thinks in 640 by 360, so the numbers are halved on the way in,
  // and when the frame is done every square is moved to the nearest colour on the palette.
  c.save(); c.scale(0.5, 0.5);
  try {
    const shaking = fx && ((fx.kind === "over") || (fx.kind === "shake" && t - fx.start < 0.4));
    const left = shakeUntil - performance.now();
    if (shaking) c.translate(Math.round(Math.sin(t * 70) * 2) * 2, Math.round(Math.cos(t * 55) * 1.5) * 2);
    else if (left > 0) c.translate(Math.round(Math.sin(left * 0.9) * left / 80) * 2, Math.round(Math.cos(left * 0.7) * left / 120) * 2);
    paint(t); drawFx(t);
    if (performance.now() < flashUntil) { c.fillStyle = "#fff"; c.fillRect(-10, -10, A.W + 20, A.H + 20); }
  } catch { /* one bad frame is not worth a dead game */ }
  c.restore();
  A.snap(c);
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
const save = () => { if (G && !G.jump) store.set(SAVE, JSON.stringify(G)); };
const unsave = () => { if (!G || !G.jump) store.set(SAVE, null); };
const saved = () => { try { const g = JSON.parse(store.get(SAVE) || "null"); return g && g.seed && g.step > 0 ? g : null; } catch { return null; } };
const tally = () => scoreRun({ seed: G.seed, picks: G.picks, calls: G.calls });
function showHud() {
  hud.textContent = "";
  if (!G) return;
  const r = tally(), names = { park: ["YOU", "RICK"], dallas: ["DAL", "VIS"], texas: ["TEX", "A&M"] }[G.where];
  const left = el("div", "box"); left.append(document.createTextNode(names[0] + " " + G.us + "  " + names[1] + " " + G.them), el("br"), document.createTextNode(G.q));
  const right = el("div", "box");
  if (FACE) { const f = el("canvas"); f.width = 63; f.height = 72; f.getContext("2d").drawImage(FACE, 0, 0); right.append(f); }
  right.append(document.createTextNode("LEVEL " + r.level + "  "), el("b", "", r.score.toLocaleString("en-US")));
  hud.append(left, right);
}

// ─── the words on the screen ───
// A card sits at the bottom of the screen, except a play call, which sits at the top so the field stays in view.
const card = (who, top = false) => { ui.textContent = ""; ui.classList.toggle("top", top); const k = el("div", "card"); if (who) k.append(el("div", "who", who)); ui.append(k); return k; };
let onKey = null, onTap = null, review = null;
// A cut scene is a list of beats. A press while one is playing jumps to its end, and never past words that wait for the player.
let skipping = false, inCine = false;
const cine = (on) => { inCine = on; skipping = false; };
const beat = async (ms) => { const end = performance.now() + ms; while (!skipping && performance.now() < end) await wait(30); };
addEventListener("keydown", (e) => { if (review !== null) return; if (onKey) onKey(e); else if (inCine && (e.key === "Enter" || e.key === " " || e.key === "Escape")) skipping = true; });
$("stage").addEventListener("pointerdown", (e) => { if (review !== null || e.target.closest("button, a, input, .board")) return; if (onTap) onTap(); else if (inCine) skipping = true; });
/** Words typed out under the picture, one box at a time. The first press finishes the line and the second moves on. */
let typing = false;   // a mouth moves only while its line is being typed
async function talk(who, text) {
  const k = card(who); k.classList.add("talk"); const p = el("p", "scene", ""); k.append(p);
  if (G) { G.log.push({ who, lines: [text] }); showBack(); }
  await new Promise(res => {
    let i = 0; typing = true;
    const timer = setInterval(() => { if (i >= text.length) { typing = false; return; } i++; p.textContent = text.slice(0, i); if (i % 3 === 0) sfx.blip(); if (i >= text.length) k.classList.add("done"); }, 26);
    const press = () => { if (i < text.length) { i = text.length; p.textContent = text; k.classList.add("done"); typing = false; return; } typing = false; clearInterval(timer); onKey = null; onTap = null; sfx.click(); res(); };
    onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); press(); } }; onTap = press;
  });
  ui.textContent = "";
}
/** A title card between places: a word on a flat colour, and four notes. */
async function eyecatch(word, bg, fg, star) {
  paint = (t) => { c.fillStyle = bg; c.fillRect(0, 0, A.W, A.H); for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.08)"; c.fillRect(0, i * 30, A.W, 30); } if (star) A.star(c, 320, 130, 56, fg, "#0a1030"); c.fillStyle = "#000"; c.textAlign = "center"; c.font = "48px 'Press Start 2P', monospace"; c.fillText(word, 324, star ? 264 : 204); c.fillStyle = fg; c.fillText(word, 320, star ? 260 : 200); c.textAlign = "left"; A.letterbox(c, 1); };
  ui.textContent = ""; say(""); sfx.sting(); await beat(1500);
}
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

// ─── what an earlier choice brings back ───
const rankOf = (id) => { const g = judge(decisionOf(id), G.picks[id]); return g ? g.rank : ""; };
const T = (slot) => took(slot, G.picks, ALTS, rankOf);
const BARE = ["receiver", "kicker", "backup", "returner"];   // helmets come off up close, so a face can be seen
/** One person up close, saying one thing. */
async function shot(who, line, mood = {}, bg = ["#3a3358", "#8a80c0"]) {
  const tx = G.where === "texas" && BARE.includes(who) ? { shirt: "#bf5700", pants: "#f4f1e6" } : {};
  paint = (t) => { A.speedLines(c, t, bg[0], bg[1]); A.bust(c, who, 320, 2.1, { ...(who === "you" ? { face: FACE } : {}), ...(BARE.includes(who) ? { helmet: "" } : {}), ...tx, ...mood, talk: typing && !mood.shock && Math.floor(t * 9) % 2 === 0, blink: Math.floor(t * 2.3) % 7 === 0 }); A.letterbox(c); };
  await talk(NAMES[who] || "", line);
}
/** A question, shown before it is asked: the place, a moment if there is one, and the people in it saying their piece. */
async function situation(id, dec, base, phone) {
  const S = SHOW[id]; if (!S) return;
  cine(true); say(""); ui.textContent = "";
  const bg = G.jerry ? ["#b9763a", "#ffe9b0"] : G.where === "park" ? ["#a8551c", "#f6c945"] : G.where === "dallas" ? ["#1d3c8f", "#c9d3e6"] : ["#8a3f00", "#ffd9a8"];
  const wide = paint;
  if (!phone) for (const line of S.wide) { paint = (t) => { wide(t); A.letterbox(c); }; await talk("", line); }
  if (S.act === "drop") {
    const s0 = now(); let hit = false;
    paint = (t) => { const p = clamp((t - s0) / 0.5, 0, 1); A.burst(c, t, 320, 170, "#3f7a32", "#b9e08a"); A.bigCatch(c, t, p); A.letterbox(c); if (p >= 1 && !hit) { hit = true; if (!skipping) { sfx.bad(); hitStop(220); shake(320); flash(60); say("DROPPED!", "slam low"); announce("drop"); } } };
    await beat(1700); say("");
  } else if (S.act === "miss") {
    const s0 = now();
    paint = (t) => { const p = clamp((t - s0) / 1.3, 0, 1); field(t, "texas", 0, true); fp(170, 268, kin("texas", "us", 4), 0); fb(190 + p * 470, 268 + p * 70, 4 + Math.sin(p * Math.PI * 0.8) * 250, p * 9); flush(); A.beams(c, t); A.letterbox(c); };
    sfx.snap(); await beat(1300); say("NO GOOD!", "slam low"); sfx.boo(); shake(260); announce("miss"); await beat(1300); say("");
  }
  if (!phone) for (const line of S.post) { paint = (t) => { wide(t); A.letterbox(c); }; await talk("", line); }
  const sid = dec.slot || id, back = sid === "commercial" ? jerryRemembers(G.picks) : "";
  if (back) await shot("jerry", back, {}, bg);
  for (const [who, line, mood] of S.shots) {
    if (phone) { paint = wide; await talk("A TEXT FROM HOME", line); }
    else if (who.startsWith("voice:")) { paint = (t) => { A.speedLines(c, t, bg[0], bg[1]); A.letterbox(c); }; await talk(who.slice(6), line); }   // heard, not seen
    else await shot(who, line, mood, bg);
  }
  cine(false);
}
const sceneBg = () => (G.jerry ? ["#b9763a", "#ffe9b0"] : G.where === "park" ? ["#a8551c", "#f6c945"] : G.where === "dallas" ? ["#1d3c8f", "#c9d3e6"] : ["#8a3f00", "#ffd9a8"]);
/** Something from the reading list, said by somebody in the game, at the point in the day where it fits. */
async function aside(key) {
  const list = ASIDES[key]; if (!list) return;
  cine(true); ui.textContent = ""; say("");
  const wide = paint, boxed = (t) => { wide(t); A.letterbox(c); };
  for (const [who, line, mood] of list) {
    if (who === "ann") { paint = boxed; announce("", line); await beat(1500 + line.length * 55); }
    else if (who.startsWith("text:")) {
      const s0 = now();
      paint = (t) => { boxed(t); c.save(); c.translate(270, 50 + (t - s0 < 0.8 ? Math.sin(t * 60) * 3 : 0)); c.fillStyle = "#16121f"; c.fillRect(0, 0, 100, 170); c.fillStyle = "#dff3ff"; c.fillRect(7, 16, 86, 134); c.fillStyle = "#2f6fc4"; c.fillRect(14, 28, 66, 18); c.fillRect(14, 52, 52, 14); c.fillRect(14, 72, 60, 14); c.restore(); };
      sfx.good(); await talk("A TEXT FROM " + NAMES[who.slice(5)], line);
    } else await shot(who, line, mood || {}, sceneBg());
  }
  paint = wide; cine(false);
}
/** Back home during the Texas game: the family, each remembering how the morning went. */
async function family() {
  cine(true); ui.textContent = ""; say("");
  const wide = paint; paint = (t) => { wide(t); A.letterbox(c); };
  await talk("", "Back home, your family is watching the game on television.");
  for (const [who, line, mood] of couch(T, G.picks)) await shot(who, line, mood);
  cine(false);
}

// ─── where a question happens ───
const TX = { shirt: "#bf5700", pants: "#f4f1e6", helmet: "#f4f1e6", dot: "" };
function backdrop(id) {
  const where = G.where;
  if (id === "breakfast") return (t) => A.kitchen(c, t);
  if (id === "jet") return (t) => { A.sky(c, t); A.plane(c, 200 + Math.sin(t) * 10, 110 + Math.sin(t * 1.7) * 6); };
  if (id === "speech") return (t) => { A.locker(c, t); for (let i = 0; i < 4; i++) A.cast(c, "kicker", 360 + i * 70, 214, 0.62, { number: String(52 + i * 11) }); A.person(c, 200, 222, 0.95, { ...A.CAST.you, face: FACE, shirt: "#1b2440", number: "", armUp: true, wave: t }); };
  if (id === "push" || id === "commercial") return (t) => { A.sideline(c, t, where, FACE); if (id === "commercial") A.jerry(c, 150, 220, 0.9, { armUp: true, wave: t }); };
  if (id === "twominute") return (t) => A.sideline(c, t, "texas", FACE);
  if (G.jerry) return (t) => { A.park(c, t, { time: "gold", field: false }); A.leaves(c, t); };
  if (where !== "park") return (t) => A.stadium(c, t, { midfield: true, team: where });
  return (t) => { A.park(c, t); A.leaves(c, t); };
}

// Andrew, 2026-11-14: "after i choose something bad, i want to see something bad happen on screen."
// A bad or ludicrous answer is followed by what it cost, played out: the other team running through
// yours, a fumble, a sack, a kick going wide, somebody walking off, a bench under rain, or Jerry fuming.
const BAD = { breakfast: "sick", jet: "sick", stars: { bad: "gain", silly: "grandma" }, blowup: "walk", shout: "gain", push: "bench", open: "bench", culture: "jerry", dissent: "jerry", power: "jerry",
  receiver: "sack", commercial: "gain", conflict: "bench", speech: "bench", points: "bench", returner: "fumble", cohesion: "bench", kicker: "wide", backup: "sack", twominute: "sack",
  "pop-stacking": "walk", "pop-titleix": "walk", "pop-1968": { bad: "kaep", silly: "walk" } };
const rainCloud = (x, y, e) => { c.fillStyle = "rgba(60,64,90,.92)"; [[0, 0, 26], [26, 6, 20], [-24, 8, 18]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); }); c.fillStyle = "#7fd3ff"; for (let i = 0; i < 10; i++) c.fillRect(x - 40 + (i * 17) % 80, y + 22 + ((e * 180 + i * 37) % 90), 2, 9); };
async function consequence(id, got, who, phone, base) {
  let kind = BAD[id]; if (kind && typeof kind === "object") kind = kind[got.rank] || kind.bad;
  if (!kind || (kind === "walk" && (phone || !who))) return false;
  const where = G.where, s0 = now(), leaf = (t) => { if (where === "park") A.leaves(c, t, 30); else if (where === "texas") A.beams(c, t); };
  let hit = false; const bang = () => { if (!hit) { hit = true; sfx.thud(); hitStop(140); shake(380); } };
  if (kind === "sick") paint = (t) => { A.speedLines(c, t, "#3f6a2a", "#a8d070"); A.bust(c, "you", 320 + Math.sin(t * 30) * 3, 2.1, { face: FACE, sad: true, sweat: true, shirt: where === "park" ? "#e2622a" : "#1b2440", number: "" }); A.letterbox(c); };
  else if (kind === "jerry") { shake(420); paint = (t) => { const e = t - s0; A.burst(c, t, 320, 150, "#7a1212", "#ff8a80"); A.bust(c, "jerry", 320 + Math.sin(t * 40) * 2, 2.1, { angry: true, grin: false }); c.fillStyle = "rgba(255,255,255,.85)"; [[-1, 0], [1, 0.4]].forEach(([d, o]) => { const p = ((e + o) * 1.4) % 1; c.beginPath(); c.arc(320 + d * (120 + p * 30), 120 - p * 90, 10 + p * 14, 0, 7); c.fill(); }); A.letterbox(c); }; }
  else if (kind === "bench") paint = (t) => { const e = t - s0; A.sideline(c, t, where, FACE); for (let i = 0; i < 5; i++) rainCloud(72 + i * 92, 96 + Math.sin(e * 2 + i) * 4, e + i * 0.3); };
  else if (kind === "kaep") paint = (t) => { base(t); A.cast(c, "kaepernick", 320, 250, 1.3, { kneel: true }); };   // the answer that mixes him up with Smith and Carlos: he is the one who knelt
  else if (kind === "walk") paint = (t) => { const e = t - s0; base(t); A.cast(c, who, 440 + Math.max(0, e - 0.6) * 170, 250, 1.3, { angry: true, grin: false, armUp: false, look: 3, ...(G.where === "texas" ? TX : {}) }); };
  else if (kind === "gain" || kind === "grandma") paint = (t) => {
    const e = t - s0, x = Math.max(44, 610 - e * 210), in_ = x <= 44, hop = in_ ? Math.abs(Math.sin(e * 7)) * 22 : 0; field(t, where, 0, false, TEAM[where].them.jersey + "bb");
    for (let i = 0; i < 5; i++) { const px = 140 + i * 84, passed = x < px; fp(px, 228 + i * 25, { ...kin(where, "us", i), down: passed }, passed ? 0 : Math.floor(t * 8) + i); }
    const r = kind === "grandma" ? { ...kin(where, "them", 1), hair: "#e3e6ea", skin: "#f0c8a0", long: false } : kin(where, "them", 1);
    fp(x, 284, { ...r, arms: in_ ? 1 : 0, ring: true }, in_ ? 0 : Math.floor(t * 10), hop); fb(x - 3, 293, 24 + hop); flush(); leaf(t);
  };
  else if (kind === "fumble") paint = (t) => {
    const e = t - s0, lost = e > 0.95, x = Math.min(330, 140 + e * 200), f = Math.max(0, e - 0.95); field(t, where, 0, false); if (lost) bang();
    fp(x, 280, { ...kin(where, "us", 3), down: e > 1.2, ring: !lost }, lost ? 0 : Math.floor(t * 9));
    const bx = lost ? 338 + Math.min(f, 0.9) * 110 : x + 2, bh = lost ? Math.max(0, 24 + 190 * f - 300 * f * f) : 24, got2 = f > 1.1;
    fp(got2 ? bx : 600 - Math.min(f, 1.1) / 1.1 * (600 - bx - 14), 292, { ...kin(where, "them", 2), arms: got2 ? 1 : 0, ring: got2 }, got2 ? 0 : Math.floor(t * 10));
    if (got2) fb(bx - 2, 292, 50); else fb(bx, 288, bh, f * 14); flush(); leaf(t);
  };
  else if (kind === "sack") paint = (t) => {
    const e = t - s0, p = Math.min(1, e / 0.9); field(t, where, 0, false); if (p >= 1) bang();
    fp(170, 290, { ...kin(where, "us", 6), down: p >= 1, ring: true }, 0);
    for (let i = 0; i < 3; i++) fp(540 - p * (340 - i * 16), 240 + i * 34 + (290 - (240 + i * 34)) * p, kin(where, "them", i), p >= 1 ? 0 : Math.floor(t * 10) + i);
    if (p >= 1) fb(150 - Math.min(60, (e - 0.9) * 90), 304, Math.max(0, 20 - (e - 0.9) * 160), e * 9); else fb(174, 298, 24);
    flush();
    if (p >= 1) { const q = A.proj(170, 290, 48); for (let k = 0; k < 5; k++) A.star(c, q.x + Math.cos(t * 6 + k * 1.26) * 26 * q.s, q.y + Math.sin(t * 6 + k * 1.26) * 8 * q.s, 5 * q.s, "#ffd75e", "#1c1626"); }
    leaf(t);
  };
  else if (kind === "wide") { sfx.snap(); paint = (t) => { const p = clamp((t - s0) / 1.3, 0, 1); field(t, "texas", 0, true); fp(170, 268, kin("texas", "us", 4), 0); fb(190 + p * 470, 268 + p * 70, 4 + Math.sin(p * Math.PI * 0.8) * 250, p * 9); flush(); A.beams(c, t); }; }
  say(got.then, "line low"); if (kind !== "sack" && kind !== "fumble" && kind !== "jerry") sfx.bad(); if (kind === "gain" || kind === "grandma" || kind === "wide") sfx.boo();
  await beat(3600); say("");
  return true;
}
async function decide(id) {
  const dec = decisionOf(id), sid = dec.slot || id, pop = !dec.level, dallas = G.where !== "park", base = backdrop(sid);
  const who = ["commercial", "push", "speech", "breakfast", "jet"].includes(sid) ? "" : dec.level === 2 ? "jerry" : dec.who;
  const phone = pop && dallas;
  const start = now();
  paint = (t) => {
    base(t);
    if (who && !phone) A.cast(c, who, 440, 250, 1.3, { wave: t - start, ...(dec.level === 4 ? TX : {}) });
    if (phone) { c.save(); c.translate(500, 30 + (t - start < 1 ? Math.sin(t * 60) * 3 : 0)); c.fillStyle = "#16121f"; c.fillRect(0, 0, 84, 150); c.fillStyle = "#dff3ff"; c.fillRect(6, 14, 72, 118); c.fillStyle = "#2f6fc4"; c.fillRect(12, 24, 56, 16); c.fillRect(12, 46, 44, 12); c.fillRect(12, 64, 50, 12); c.restore(); }
  };
  say("");
  const label = "A QUESTION ABOUT " + (dec.topic || "the game").toUpperCase();
  const scene = pop ? popScene(dec, dallas) : dec.scene;
  const qPaint = paint; await situation(id, dec, base, phone); paint = qPaint;
  const k = card(""); k.classList.add("split"); k.dataset.id = id;
  // What was just said stays on the card in small type, so nobody has to remember it while choosing.
  const S = SHOW[id], seenShots = S ? S.shots.filter(x => !x[0].startsWith("voice:")) : [], said = seenShots.length ? seenShots[seenShots.length - 1] : null;
  const left = el("div", "ask"); left.append(el("div", "who", label));
  if (said) left.append(el("p", "say", (phone ? "A text from home" : NAMES[said[0]].charAt(0) + NAMES[said[0]].slice(1).toLowerCase().replace("jerry jones", "Jerry Jones")) + ": " + said[1]));
  left.append(el("p", "scene", (S && S.ask) || scene)); k.append(left);
  const opts = el("div", "opts"); k.append(opts);
  const pick = await new Promise(res => {
    if (dec.pick) {
      const chosen = new Set(), go = el("button", "go", "Lock it in"); go.type = "button"; go.disabled = true;
      orderFor(G.seed, id, POWER.length).forEach(i => {
        const p = POWER[i], b = el("button", "opt", p.text); b.type = "button"; b.dataset.k = p.k; b.setAttribute("aria-pressed", "false");
        b.onclick = () => { sfx.click(); if (chosen.has(p.k)) chosen.delete(p.k); else if (chosen.size < dec.pick) chosen.add(p.k); b.setAttribute("aria-pressed", String(chosen.has(p.k))); go.disabled = chosen.size !== dec.pick; };
        opts.append(b);
      });
      go.onclick = () => res([...chosen]); left.append(go);
    } else {
      const btns = [];
      orderFor(G.seed, id, dec.opts.length).forEach((i, n) => {
        const o = dec.opts[i], b = el("button", "opt"); b.type = "button"; b.dataset.k = o.k;
        b.append(el("kbd", "", String(n + 1)));
        const icon = (A.FOOD_OF[id] || {})[o.k];
        if (icon) { const cv = el("canvas"); cv.width = 96; cv.height = 96; const fc = cv.getContext("2d"); fc.scale(3, 3); A.food(fc, icon); b.append(cv); }
        b.append(el("span", "", o.text));
        b.onclick = () => { onKey = null; res(o.k); };
        opts.append(b); btns.push(b);
      });
      onKey = (e) => { const n = Number(e.key); if (n >= 1 && n <= btns.length) btns[n - 1].click(); };
    }
  });
  G.picks[id] = pick;
  const got = judge(dec, pick);
  // The answer is locked, a drum rolls, and then the person it landed on is seen up close.
  opts.querySelectorAll(".opt").forEach(b => { b.disabled = true; if (b.dataset.k !== pick && !(Array.isArray(pick) && pick.includes(b.dataset.k))) b.classList.add("dim"); else b.classList.add("lock"); });
  cine(true); sfx.roll(); await beat(650); ui.textContent = "";
  const face = !who || phone ? "you" : who, mood = { best: { grin: true, armUp: true }, good: { armUp: false }, bad: { sad: true, sweat: true, grin: false, armUp: false, angry: false }, silly: { shock: true, grin: false, angry: false, armUp: true }, over: { angry: true, grin: false, armUp: true } }[got.rank];
  const tint = { best: ["#1f7a3c", "#6ee7a0"], good: ["#1d3c8f", "#8ecbff"], bad: ["#8a4a12", "#ffb347"], silly: ["#6a2f9a", "#e0b0ff"], over: ["#7a1212", "#ff8a80"] }[got.rank], s0 = now();
  paint = (t) => { A.burst(c, t, 320, 150, tint[0], tint[1]); const e = t - s0, pop = 1.9 + Math.max(0, 0.25 - e) * 1.2; A.bust(c, face, 320, pop, { ...(face === "you" ? { face: FACE, shirt: G.where === "dallas" ? "#1b2440" : G.where === "texas" ? "#bf5700" : "#e2622a", number: "" } : {}), ...(dec.level === 4 && face !== "you" ? TX : {}), ...mood, wave: e, blink: got.rank === "good" && Math.floor(e * 3) % 3 === 0 }, 40); A.letterbox(c, 1, 26); };
  ({ best: sfx.good, good: sfx.meh, bad: sfx.bad, silly: sfx.silly, over: sfx.over })[got.rank]();
  sfx.slam(); hitStop(120); shake(got.rank === "good" ? 0 : 300); flash(70);
  G.streak = got.rank === "best" ? (G.streak || 0) + 1 : 0;
  say(G.streak >= 3 ? G.streak + " BEST CALLS IN A ROW" : RANK_SAY[got.rank].toUpperCase(), "slam low r-" + got.rank); showHud();
  if (got.rank === "silly" || got.rank === "over") announce(got.rank); else if (G.streak === 3) announce("streak");
  await beat(1500); say("");
  cine(false);
  paint = (t) => { base(t); if (who && !phone) A.cast(c, who, 440, 250, 1.3, { wave: t - start, ...(dec.level === 4 ? TX : {}), ...(got.rank === "best" ? { grin: true } : got.rank === "bad" ? { sad: true, angry: false } : {}) }); };
  fx = got.rank === "good" ? null : { kind: got.rank, start: now(), x: who && !phone ? 470 : 320, y: who && !phone ? 84 : 110 };
  const chose = Array.isArray(pick) ? pick.map(x => POWER.find(p => p.k === x).text).join(" and ") : dec.opts.find(o => o.k === pick).text;
  const r = card(label);
  r.append(el("div", "rank r-" + got.rank, RANK_SAY[got.rank] + "   +" + got.points));
  r.append(el("p", "say", "You chose: " + chose));
  if (VERDICT[got.rank]) r.append(el("p", "scene", VERDICT[got.rank]));
  r.append(el("p", "why", dec.after));
  const link = LINKS[id];
  if (link) { const a = el("a", "more", link.say + " ↗"); a.href = link.url; a.target = "_blank"; a.rel = "noopener noreferrer"; r.append(a); }
  G.log.push({ who: label, scene, rank: got.rank, pick: chose, lines: [got.then], why: dec.after }); showBack();
  await next(r, got.over ? "Uh oh" : "Continue");
  fx = null;
  // Andrew, 2026-11-17: "give the information first. Then you press continue, then we see what
  // happens." So the rank and the reason are read on the card, and what the choice led to comes
  // after: played out for a bad or ludicrous answer, and said over the picture otherwise.
  cine(true); ui.textContent = "";
  const played = got.rank === "bad" || got.rank === "silly" ? await consequence(sid, got, who, phone, base) : false;
  if (!played && got.then) { const seen = paint; paint = (t) => { seen(t); A.letterbox(c); }; await talk("", got.then); G.log.pop(); paint = seen; }   // the line is already in the log with its question
  cine(false);
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
// Andrew, 2026-11-16: "go back down to 8 bit." The field during a play is seen from the side, the way a football cartridge
// showed it: your team runs left to right, and the stands are across the top. A spot is still (x, y): x is how far downfield
// and y is across. Players and the ball are queued with how high off the ground they are, then drawn from the far sideline
// to the near one, so whoever is nearer the bottom of the screen is in front.
const fq = [];
const fp = (x, y, o = {}, frame = 0, h = 0) => fq.push([y, () => { const p = A.proj(x, y, h); A.player(c, p.x, p.y, { ...o, s: (o.s || 1) * p.s, lift: h * p.s }, frame); }]);
const fb = (x, y, h = 0, tilt = 0) => fq.push([y + 1, () => { const p = A.proj(x, y, h); A.ball(c, p.x, p.y, tilt, p.s * 1.3, h * p.s); }]);
const flush = () => { fq.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f()); fq.length = 0; };
const field = (t, where, scroll, endzone, near = "") => A.turf(c, t, { where, scroll, endzone, near });
const ease = (p) => p * p * (3 - 2 * p);
/** Where the other team stands for a look: [x, y] for each of five. */
const setOf = (look) => [0, 1, 2, 3, 4].map(i => look === "deep" ? [470 + (i % 2) * 50, 222 + i * 26] : look === "stack" ? [236 + (i % 2) * 10, 232 + i * 22] : look === "blitz" ? [250, 226 + i * 26] : [280 + (i % 2) * 40, 204 + i * 34]);
/** Both teams lined up before the snap. */
const lineup = (where, look0) => (t) => {
  const look = look0 === "mystery" ? ["deep", "stack", "blitz", "spread"][Math.floor(t * 1.4) % 4] : look0;   // a defense nobody can read keeps shifting
  field(t, where, 0, false);
  for (let i = 0; i < 5; i++) fp(200 + (i % 2) * 14, 226 + i * 26, kin(where, "us", i), 0);
  setOf(look).forEach(([x, y], i) => fp(x + (look === "blitz" ? Math.sin(t * 9 + i) * 3 : 0), y, kin(where, "them", i), look === "blitz" ? Math.floor(t * 8) + i : 0));
  fp(150, 290, { ...kin(where, "us", 6), ring: true }, 0);
  fb(216, 278, 0);   // on the ground at the line, where a football sits before the snap
  flush();
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
      for (let i = 0; i < 5; i++) fp(200 + (i % 2) * 14 + go * 14, 226 + i * 26, kin(where, "us", i), fr + i);
      const qb = kin(where, "us", 6);
      let dust = null;
      if (call === "run") {
        fp(150, 290, qb, 0);
        const g = good ? go : go * 0.07, [x, y] = v.path(g);
        them.forEach(([hx, hy], i) => { const tx = good ? x - 46 - i * 18 : x + 16, ty = good ? hy + (y - hy) * 0.5 : y + (i - 2) * 9; fp(hx + (tx - hx) * go, hy + (ty - hy) * go, kin(where, "them", i), fr + i); });
        fp(x, y, { ...kin(where, "us", 3), arms: good && p > 0.93 ? 1 : 0, down: !good && p > 0.7, ring: true }, fr);
        fb(x + 1, y + 8, 24);
        if (good && fr) dust = [x, y];
      } else {
        const qx = 150 - go * 16, th0 = 0.34, th1 = 0.6, caught = p >= th1;
        fp(qx, 290, { ...qb, arms: p > th0 && p < th1 ? 1 : 0, ring: !caught }, 0);
        const rx0 = 230 + v.depth * ease(clamp(p / th1, 0, 1)), ry = 214, th = clamp((p - th0) / (th1 - th0), 0, 1);
        const run = good && caught ? ease(clamp((p - th1) / (1 - th1), 0, 1)) * v.after : 0, rx = rx0 + run;
        them.forEach(([hx, hy], i) => { const tx = good ? rx - 56 - i * 16 : (i === 0 ? rx0 - 4 : qx + 40 + i * 12), ty = good ? hy + (ry - hy) * 0.5 : (i === 0 ? ry + 4 : 290); fp(hx + (tx - hx) * go, hy + (ty - hy) * go, kin(where, "them", i), fr + i); });
        fp(good ? rx : Math.min(rx0, 330), ry, { ...kin(where, "us", 3), arms: good && caught && p < th1 + 0.08 ? 1 : 0, ring: good && caught }, fr);
        const aimX = good ? rx0 : Math.min(rx0, 330) + 26;
        if (p < th0) fb(qx + 2, 298, 26);
        else if (!caught) fb(qx + (aimX - qx) * th, 296 + (ry + 6 - 296) * th, 30 + Math.sin(th * Math.PI) * v.arc, -0.5 + th);
        else if (good) fb(rx + 1, ry + 8, 24);
        else fb(aimX + 10, ry + 8, Math.max(0, 40 - (p - th1) * 380));   // it falls, and it stays a football
      }
      flush();
      if (dust) for (let k = 0; k < 4; k++) { const q = A.proj(dust[0] - 14 - k * 9, dust[1], 3 + k); c.fillStyle = "rgba(255,255,255," + (0.3 - k * 0.07) + ")"; c.fillRect(q.x - 3 * q.s, q.y, 6 * q.s, 3 * q.s); }   // dust at the runner's heels
      if (where === "park") A.leaves(c, t, 30);
      if (p >= 1 && !done) { done = true; res(); }
    };
  });
}
/** Between plays: both sides standing around, so no finished play is left frozen on the screen. */
const idle = (where) => (t) => {
  field(t, where, 0, false);
  for (let i = 0; i < 5; i++) { fp(150 + (i % 2) * 30, 226 + i * 26, kin(where, "us", i), 0); fp(470 + (i % 2) * 30, 226 + i * 26, kin(where, "them", i), 0); }
  flush();
  if (where === "park") A.leaves(c, t, 30);
};
/** A touchdown in three shots: the spike up close, everybody dancing, and a pie for somebody new each time. */
const PIE_FOR = { park: "uncle", dallas: "jerry", texas: "reporter" };
async function touchdown(where, text = "TOUCHDOWN!") {
  const was = inCine; cine(true); ui.textContent = "";
  const cols = TEAM[where].us; let start = now();
  paint = (t) => { const e = t - start; A.burst(c, t, 320, 200, A.darken(cols.jersey, 0.2), "#ffd75e"); c.save(); c.translate(320, 328 - Math.round(Math.abs(Math.sin(Math.min(e, 0.5) * Math.PI * 2)) * 15) * 2); c.scale(4, 4); A.player(c, 0, 0, { ...kin(where, "us", 3), arms: 1, front: true, face: where === "park" ? FACE : null }, 0); c.restore(); A.ball(c, 430, 60 + Math.min(1, e * 4) * 250, e * 20, 4); A.letterbox(c); };
  say(text, "slam"); sfx.slam(); hitStop(140); shake(380); flash(90); sfx.td(); showHud(); announce("td");
  if (where === "texas") music.start("fight");
  await beat(1300);
  start = now();
  paint = (t) => {
    const e = t - start, up = Math.max(0, 1 - e * 2.5) * 140; field(t, where, 0, true);
    for (let i = 0; i < 6; i++) fp(250 + (i % 2) * 40, 196 + i * 29, { ...kin(where, "us", i), face: i === 2 && where === "park" ? FACE : null, arms: 1, front: true }, 0, Math.abs(Math.sin(e * 5 + i)) * 30);
    flush();
    A.turkeyDance(c, 500, 330 + up, t, where === "dallas" ? "dougie" : "macarena", 2.4);
    if (where === "texas") A.turkeyDance(c, 590, 336 + up, t, "dougie", 1.6);
    if (where === "park") A.leaves(c, t, 80); else A.confetti(c, t, [cols.jersey, cols.pants, "#fff"]);
    if (where === "texas") A.beams(c, t);
  };
  fx = { kind: "td", start }; say(text, "flash big");
  await beat(where === "texas" ? 4200 : 3000); fx = null; say("");
  if (!G.sacred) {   // his lines, 2026-11-17, said the first time the turkey dances in a run
    G.sacred = 1;
    await talk("", "This was the equivalent of the turkey's Macarena. It is a very sacred dance in the turkey world.");
    await talk("", "It is only done when celebrating major life events. And imminent death.");
  }
  G.pied = G.pied || {}; if (G.pied[where]) { cine(was); return; } G.pied[where] = 1;
  // Silence, a face, and then the pie. One pie a game.
  const who = PIE_FOR[where]; start = now(); let hit = false; music.stop();
  paint = (t) => {
    const e = t - start, p = clamp((e - 0.9) / 0.22, 0, 1);
    A.speedLines(c, e > 0.9 ? t : 0, "#3a3358", "#8a80c0"); A.bust(c, who, 320, 2.2, { armUp: false, grin: e < 0.9, shock: e >= 0.9 && p < 1, look: e > 0.6 ? 3 : 0, ...(where === "texas" && who !== "reporter" ? TX : {}) }, 26);
    if (p > 0 && p < 1) { c.save(); c.translate(760 - p * 440, 150); c.scale(3, 3); c.rotate(e * 20); A.food(c, "pie"); c.restore(); }
    if (p >= 1) { c.fillStyle = "#d9772a"; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc(320 + Math.cos(i * 1.7) * (20 + i * 5), 126 + Math.sin(i * 2.3) * (18 + i * 3) + Math.min(40, (e - 1.12) * 22) * (i % 3 === 0 ? 1 : 0.2), 26 - i, 0, 7); c.fill(); } c.fillStyle = "#fff"; c.beginPath(); c.arc(316, 112, 24, 0, 7); c.fill(); c.beginPath(); c.arc(340, 138, 14, 0, 7); c.fill(); }
    A.letterbox(c);
    if (p >= 1 && !hit) { hit = true; sfx.splat(); hitStop(150); shake(420); flash(60); say("OUCH. (AND YUM.)", "slam low"); announce("pie"); sfx.gobble(0.5, 2); }
  };
  await beat(2700); say(""); cine(was);
}
/** The other team has the ball, and the player watches what they do with it. */
async function theirDrive(where, scores, how) {
  paint = idle(where);
  say(THEM[where] + " HAS THE BALL"); await wait(1500);
  const start = now(), who = kin(where, "them", 1);
  paint = (t) => {
    // Their runner goes right to left. Nobody is knocked flat: your side chases, and either catches the runner or does not.
    const e = t - start, x = scores ? Math.max(60, 560 - e * 130) : 470 - Math.min(e, 1.6) * 90, in_ = scores && x <= 60;
    const hop = in_ ? Math.abs(Math.sin(e * 6)) * 24 : 0;
    field(t, where, 0, false, scores ? TEAM[where].them.jersey + "bb" : "");
    for (let i = 0; i < 4; i++) fp(scores ? x + 70 + i * 40 : Math.max(x - 26, 330 - i * 30 + Math.min(e, 1.6) * 20), 236 + i * 28, { ...kin(where, "us", i), front: scores }, e < 4 ? Math.floor(t * 8) + i : 0);
    fp(x, 284, { ...who, arms: in_ ? 1 : 0, ring: true }, in_ || (!scores && e > 1.6) ? 0 : Math.floor(t * 8), hop);
    fb(x - 3, 293, 24 + hop); flush();
    if (where === "park") A.leaves(c, t, 30);
  };
  say(how, "line"); await wait(scores ? 4200 : 2800);
  if (scores) { say("TOUCHDOWN FOR " + THEM[where]); sfx.boo(); await wait(1700); }
  say(""); paint = idle(where);
}

/** The one play of a game: the last drive. */
let pickedPlay = 0;
async function plays() {
  const n = G.calls.length, look = lookFor(G.seed, n), where = G.where;
  if (!n) await lines("HOW THE FOOTBALL WORKS", ["Each game comes down to one drive, and you call the play.", "First you see how the other team is lined up. Then you choose RUN or PASS.", "If they are crowded close or rushing, pass over them. If they are far back or spread wide, run at them."], "Got it");
  const lvl = { park: 1, dallas: 3, texas: 4 }[where];
  const clear = clearRead(Object.keys(G.picks).map(decisionOf).filter(d => d && d.level === lvl).map(d => rankOf(d.id)));
  paint = lineup(where, clear ? look.k : "mystery"); say("");
  const memory = where === "park" ? parkTarget(T) : where === "dallas" ? dallasTarget(T) : "";
  announce(memory ? "" : clear ? "clear" : "vague", memory || undefined);
  const k = card("YOUR BALL. CALL THE PLAY.", true);
  k.append(el("p", "scene", clear ? look.say : "Your sideline is not talking to you, and the other team keeps shifting. You cannot get a read on them."));
  const calls = el("div", "calls"); k.append(calls);
  const call = await new Promise(res => {
    // Four plays: two runs and two passes, a different pair each game.
    const base = (n + (G.seed.charCodeAt(0) % 3)) % 3, btns = [];
    const mk = (v, w) => { const b = el("button", "call " + v); b.type = "button"; b.append(el("small", "", v.toUpperCase()), document.createTextNode(PLAYS[v][w].name)); b.onclick = () => { onKey = null; res([v, w]); }; calls.append(b); btns.push(b); };
    mk("run", base); mk("pass", base); mk("run", (base + 1) % 3); mk("pass", (base + 1) % 3);
    onKey = (e) => { const i = Number(e.key); if (i >= 1 && i <= 4) btns[i - 1].click(); };
  }).then(([v, w]) => { pickedPlay = w; return v; });
  G.calls.push(call); G.busy = true; showBack();
  const good = look.beat === call, which = pickedPlay;
  ui.textContent = ""; cine(true); paint = (t) => { A.cleats(c, t, TEAM[where].us.jersey); A.letterbox(c); }; say("HUT!", "slam"); sfx.snap(); sfx.slam(); await beat(650); cine(false);
  music.start(where === "texas" ? "fight" : "play"); say(PLAYS[call][which].name);
  await playOut(call, good, where, look.k, which);
  music.stop(); G.busy = false; showBack();
  let word;
  if (good) { G.us += 7; word = "Touchdown."; await touchdown(where); }
  else { word = call === "run" ? "Stopped at the line. You punt." : "Incomplete. You punt."; say(call === "run" ? "STOPPED AT THE LINE" : "INCOMPLETE", "slam"); sfx.bad(); hitStop(160); shake(300); announce(where === "park" || call !== "run" ? (call === "run" ? "stop" : "inc") : "", where === "park" || call !== "run" ? undefined : NICE_HIT); await wait(1700); say("YOU PUNT."); await wait(1500); }
  say(""); showHud(); paint = idle(where);
  G.log.push({ who: "THE LAST DRIVE", lines: ["The other team: " + look.say, "You called a " + call + ", " + PLAYS[call][which].name.toLowerCase() + ". " + word] }); showBack();
}

// ─── cut scenes ───
async function scene(name) {
  cine(true); ui.textContent = "";
  const YOU = () => ({ face: FACE, shirt: G.where === "dallas" ? "#1b2440" : G.where === "texas" ? "#bf5700" : "#e2622a", number: "" });
  if (name === "kickoff") {
    G.q = "Q1"; showHud();
    // Feet, a face, feet, a face, and then the ball is in the air.
    paint = (t) => { A.leafBall(c, t); A.leaves(c, t, 40); A.letterbox(c); }; await beat(1500);
    let s0 = now(); paint = (t) => { A.cleats(c, t, "#6a4bb0"); A.letterbox(c); }; sfx.whistle(); await beat(520);
    paint = (t) => { A.speedLines(c, t, "#a8551c", "#f6c945"); A.bust(c, "grandma", 320, 2.1, { blink: Math.floor(t * 2) % 5 === 0, look: -2 }, 30); A.letterbox(c); }; await beat(620);
    paint = (t) => { A.cleats(c, t, "#e2622a"); A.letterbox(c); }; await beat(480);
    paint = (t) => { A.speedLines(c, t, "#3f7a32", "#b9e08a"); A.bust(c, "uncle", 320, 2.1, { armUp: false, look: 2 }, 30); A.letterbox(c); }; await beat(560);
    s0 = now();
    paint = (t) => {
      const p = Math.min(1, (t - s0) / 2.6); field(t, "park", 0, false);
      for (let i = 0; i < 5; i++) { fp(520 - p * 70, 200 + i * 34, kin("park", "them", i), Math.floor(t * 9)); fp(110 + p * 40, 200 + i * 34, kin("park", "us", i), Math.floor(t * 9)); }
      fb(500 - p * 370, 268, 6 + Math.sin(p * Math.PI) * 190, -0.6 + p); flush(); A.leaves(c, t, 70);
    };
    say("KICKOFF", "slam"); sfx.slam(); shake(220); announce("kickoff"); await beat(1500); say("");
    await talk("THE GAME STARTS", "It's 8 AM. The leaves are coming down, and Uncle Rick's team kicks off to yours.");
    // His lines from here to the end of the scene, 2026-11-17.
    await talk("THE GAME STARTS", "Just to be clear, you and Uncle Rick hate each other. And it's because of this game.");
    await talk("THE GAME STARTS", "Your family dynamic completely depends on who wins this game every year.");
    await talk("THE GAME STARTS", "So this isn't just a regular football game. In fact, your entire year of happiness is on the line.");
  } else if (name === "half1") {
    G.q = "HALF"; G.half = 2; G.us = 14; G.them = 21;
    paint = (t) => A.sideline(c, t, "park", FACE);
    say("HALFTIME  14 - 21", "slam"); sfx.whistle(); showHud(); await beat(1400); say("");
    await talk("HALFTIME", "Both teams have scored twice. Then Uncle Rick's team scores on the last play of the half.");
    await talk("HALFTIME", "You are losing 21 to 14. Your team sits on the bench and looks at you.");
    G.q = "Q4";
  } else if (name === "jerry") {
    G.jerry = true; G.q = "FINAL"; showHud(); say("");
    let s0 = now();
    paint = (t) => { A.park(c, t, { time: "gold", field: false, scroll: (t - s0) * 30 }); A.leaves(c, t, 90); A.letterbox(c); };
    await talk("AFTER THE GAME", "The park is gold and orange, and the leaves are falling slowly.");
    s0 = now(); announce("jerry");
    paint = (t) => { const e = t - s0; A.park(c, t, { time: "gold", field: false }); A.jerry(c, Math.min(200, -80 + e * 130), 226, 0.95, {}); A.leaves(c, t, 90); A.letterbox(c); };
    await beat(2300);
    { const walk = paint; await shot("cousin", "\"Wow. Is that...? The Jerry Jones? The most fascinating man in all of sports\u2122?\"", { sad: false, shock: true }, ["#a8551c", "#f6c945"]); paint = walk; await talk("", "(Disclaimer: this video game has been funded by Jerry Jones Enterprises.)"); }
    // Up close: Jerry Jones, looking the park over.
    s0 = now(); sfx.sting(); flash(60);
    const jerryUp = (extra) => (t) => { const e = t - s0; A.burst(c, t, 320, 160, "#1d3c8f", "#c9d3e6"); A.bust(c, "jerry", 320, 2.2, { look: e < 0.5 ? -3 : e < 1 ? 3 : 0, blink: Math.floor(t * 2.5) % 6 === 0, ...extra(t) }, 26); A.letterbox(c); };
    paint = jerryUp(() => ({})); await beat(1500);
    const mouth = (t) => ({ talk: Math.floor(t * 9) % 2 === 0, grin: Math.floor(t * 9) % 2 !== 0 });
    paint = jerryUp(mouth);
    await talk("JERRY JONES", "\"Hey, we got a big game today. I just happened to be walking by your park, and I saw you playing there, and I saw the way you've been coaching, and I like it.\"");
    await talk("JERRY JONES", "\"I want you to coach the Dallas Cowboys. But first we have to do a quick interview.\"");
    s0 = now(); paint = (t) => { jerryUp(() => ({ grin: true }))(t); A.iris(c, 320, 128, Math.max(46, 420 - (t - s0) * 700)); }; await beat(1100);
  } else if (name === "jet") {
    let s0 = now();
    paint = (t) => { A.speedLines(c, t, "#2f6fc4", "#cfeaff", 22); A.plane(c, 230 + Math.sin(t * 2) * 8, 150 + Math.sin(t * 3.1) * 5); A.letterbox(c); };
    say("WHEELS UP", "slam"); sfx.jet(); sfx.slam(); await beat(1700); say("");
    paint = (t) => { A.cabin(c, t, 0); A.seat(c, 200, 300); A.jerry(c, 200, 300, 1.0, { talk: Math.floor(t * 9) % 2 === 0, grin: false }); A.seat(c, 440, 300); A.person(c, 440, 300 + Math.round(Math.abs(Math.sin(t * 7)) * -3), 1.0, { ...A.CAST.you, ...YOU(), shirt: "#1b2440" }); A.letterbox(c); };
    await talk("JERRY'S JET", "Jerry: \"You're hired. For today. Wheels up.\"");
    // The cabin goes on, and somebody else is flying first class.
    s0 = now(); let gob = false;
    paint = (t) => { const e = t - s0, sc = Math.min(1, e / 1.6) * 520; A.cabin(c, t, sc); A.seat(c, 440 - sc, 300); A.seat(c, 200 - sc, 300); A.seat(c, 840 - sc, 300); c.save(); c.translate(838 - sc, 266); c.scale(2, 2); A.turkey(c, 0, 0, e > 1.6 ? 0 : t); if (e > 1.6) { c.fillStyle = "#16121f"; c.fillRect(8, -38, 12, 5); } c.restore(); c.save(); c.translate(900 - sc, 200); c.scale(2, 2); A.food(c, "sparkling"); c.restore(); A.letterbox(c); if (e > 2.3 && !gob) { gob = true; sfx.gobble(0, 1); } };
    await beat(3300);
  } else if (name === "dallas") {
    G.where = "dallas"; G.us = 0; G.them = 0; G.q = "Q1"; G.half = 1; G.jerry = false;
    await eyecatch("DALLAS", "#1d3c8f", "#c9d3e6", true);
    paint = (t) => { A.dome(c, t); A.letterbox(c); }; await beat(1900);
    const s0 = now();
    paint = (t) => { A.stadium(c, t, { midfield: true, scroll: Math.max(0, 1 - (t - s0) / 1.4) * 240 }); A.fireworks(c, t, 4); A.confetti(c, t, ["#1d3c8f", "#c9d3e6", "#fff"], 50); };
    flash(120); sfx.cheer(); sfx.slam(); shake(260); showHud(); announce("dallas");
    post();   // reaching Level 3 is the credit, so the server hears about the landing
    await beat(1500);
    await talk("THANKSGIVING AFTERNOON", "The stadium, the big screen, a blue star on silver at midfield, a full crowd, cameras everywhere.");
    paint = (t) => { A.burst(c, t, 320, 160, "#1d3c8f", "#c9d3e6"); A.bust(c, "you", 320, 2.1, { ...YOU(), grin: true }, 30); A.letterbox(c); }; sfx.sting();
    await talk("THANKSGIVING AFTERNOON", "You are the head coach of the Dallas Cowboys.");
    await shot("reporter", "\"Wow, this stadium is huge. It's bigger than Jerry Jones's heart\u2122.\"", {}, ["#b01e3a", "#f6b8d0"]);
    paint = (t) => { A.stadium(c, t, { midfield: true }); A.letterbox(c); }; await talk("", "(Disclaimer: Jerry Jones Enterprises is affiliated with Jerry Jones Corporate.)");
    await shot("reporter", "\"Hey, how do you feel going into today's game and trying to coach?\"", {}, ["#b01e3a", "#f6b8d0"]);
    await shot("you", "\"I'm ready for any challenge (except cats, I am allergic to cats).\"", { ...YOU(), grin: true }, ["#1d3c8f", "#c9d3e6"]);
    // Sport as a show, in the mouths of the two people who sell it.
    await shot("reporter", "\"Coach, people call this a television show with a football game attached. Are you here to win, or to entertain?\"", {}, ["#b01e3a", "#f6b8d0"]);
    await shot("jerry", "\"Both. The entertaining pays for the winning. Now go win.\"", { grin: true }, ["#1d3c8f", "#c9d3e6"]);
  } else if (name === "texas") {
    // The third game. "You get the real best head coaching job, which is the Texas Longhorns against Texas A&M. And that's a night game."
    const start = now();
    paint = (t) => { A.stadium(c, t, { midfield: true }); A.jerry(c, 150, 226, 0.9, { armUp: true, wave: t }); A.person(c, 470, 226, 0.9, { ...A.CAST.you, face: FACE, shirt: "#1b2440", number: "" }); c.save(); c.translate(520, 40 + Math.sin(t * 60) * (t - start < 2 ? 3 : 0)); c.fillStyle = "#16121f"; c.fillRect(0, 0, 60, 106); c.fillStyle = "#bf5700"; c.fillRect(5, 10, 50, 84); c.fillStyle = "#fff"; c.font = "16px 'Press Start 2P', monospace"; c.fillText("UT", 14, 60); c.restore(); };
    say("YOUR PHONE RINGS", "slam"); sfx.good(); await beat(1400); say("");
    await talk("ONE MORE CALL", "It's the University of Texas. Their head coach quit an hour ago, and they play Texas A&M tonight.");
    paint = (t) => { A.speedLines(c, t, "#bf5700", "#ffd9a8"); A.bust(c, "you", 320, 2.1, { ...YOU(), shirt: "#1b2440", shock: true }, 30); A.letterbox(c); };
    await talk("ONE MORE CALL", "They watched you win in Dallas. They want you in Austin by kickoff.");
    G.where = "texas"; G.us = 0; G.them = 0; G.q = "Q1"; G.half = 1;
    await eyecatch("AUSTIN", "#bf5700", "#ffffff", false);
    if (!skipping) await shot("you", "\"Wow. I've never been to Austin before. I can't wait to see the bats, but first, off to DKR Memorial Stadium.\"", { ...YOU(), grin: true }, ["#bf5700", "#ffd9a8"]);
    // Austin on the way in: longhorns, breakfast tacos and barbecue, the Capitol, the bats over Congress Avenue, and one man in burnt orange.
    for (const [shot, word, ms] of [["cattle", "LONGHORNS", 2400], ["tacos", "BREAKFAST TACOS. THEN BARBECUE.", 2600], ["capitol", "THE CAPITOL", 2400], ["bats", "CONGRESS AVENUE AT DUSK. THE BATS ARE OUT.", 4200]]) {
      if (skipping) break; const a0 = now(); paint = (t) => { A.austin(c, t, shot, t - a0); A.letterbox(c); }; say(word, "line low"); sfx.blip(); if (shot === "cattle") sfx.thud(); await beat(ms);
    }
    if (!skipping) { const m0 = now(); paint = (t) => { A.burst(c, t, 320, 150, "#bf5700", "#ffd75e"); A.bust(c, "mcconaughey", 320, 2.1, { grin: true, armUp: true, wave: t - m0 }); A.letterbox(c); }; say(NAMES.mcconaughey, "line low"); sfx.sting(); await beat(2200); }
    say("");
    const s2 = now(); music.start("band");
    paint = (t) => { A.turf(c, t, { where: "texas" }); A.band(c, t, t - s2); A.beams(c, t); A.fireworks(c, t, 3); };
    ui.textContent = ""; say("TEXAS vs TEXAS A&M", "slam"); announce("texas"); sfx.cheer(); flash(120); showHud();
    await beat(2200); say(""); await beat(6400);   // the band has the field to itself, and the last tuba is late
    await talk("THANKSGIVING NIGHT", "A night game in Austin. A hundred thousand people in burnt orange, and the band is on the field.");
    await talk("THANKSGIVING NIGHT", "Win this one and you are the champion of the whole day.");
    music.stop(); say("");
  } else if (name === "band") {
    // Halftime in Austin: the band, and the turkey with the band.
    G.q = "HALF"; G.half = 2; G.us = 10; G.them = 14; showHud();
    const start = now(); music.start("band");
    paint = (t) => { const e = t - start; A.stadium(c, t, { team: "texas" }); A.band(c, t, e); if (e > 5) { const up = Math.max(0, 1 - (e - 5) * 3) * 120; A.turkeyDance(c, 320, 346 + up, t, "macarena", 2.6); A.turkeyDance(c, 90, 346 + up, t, "dougie", 1.8); A.turkeyDance(c, 550, 346 + up, t, "dougie", 1.8); } A.beams(c, t); };
    ui.textContent = ""; say("HALFTIME  10 - 14", "slam"); sfx.whistle();
    await beat(1600); say(""); await beat(3400); say("THE TURKEY JOINS THE BAND", "line"); sfx.gobble(0, 3); await beat(5000); say("");
    await talk("HALFTIME IN AUSTIN", "The band spells TEXAS across the field. Then a turkey walks out and does the Macarena, and a hundred thousand people do it too.");
    await talk("HALFTIME IN AUSTIN", "You are losing to Texas A&M, 14 to 10.");
    music.stop(); say(""); G.q = "Q4";
  }
  cine(false);
}

async function post() {
  if (G.jump) return null;
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
/** Every question of the run that just ended, each option with its rank, the player's own marked. Andrew, 2026-11-14: ranks are shown at the end of a run. */
function answers(k) {
  const box = el("div", "answers");
  flowFor(G.seed).forEach(f => {
    if (!f.d || !Object.prototype.hasOwnProperty.call(G.picks, f.d)) return;
    const dec = decisionOf(f.d), pick = G.picks[f.d], q = el("div", "q");
    q.append(el("div", "who", "A QUESTION ABOUT " + (dec.topic || "the game").toUpperCase()), el("p", "say", dec.scene));
    const list = dec.pick ? POWER.map(p => ({ k: p.k, text: p.text, rank: p.w >= 1 ? "best" : p.w > 0 ? "good" : "silly" })) : dec.opts;
    list.slice().sort((a, b) => ["best", "good", "bad", "silly", "over"].indexOf(a.rank) - ["best", "good", "bad", "silly", "over"].indexOf(b.rank)).forEach(o => {
      const mine = Array.isArray(pick) ? pick.includes(o.k) : pick === o.k, row = el("p", "ans" + (mine ? " mine" : ""));
      row.append(el("b", "r-" + o.rank, RANK_SAY[o.rank]), document.createTextNode(o.text + (mine ? "  (you)" : ""))); q.append(row);
    });
    q.append(el("p", "why", dec.after)); box.append(q);
  });
  k.append(box);
}
async function checkpoint(who, textLines, label) {
  const k = card(who); textLines.forEach(x => k.append(el("p", "say", x)));
  const r = tally(); k.append(el("div", "pts", r.score.toLocaleString("en-US") + " of " + MAX_SCORE.toLocaleString("en-US")));
  const strip = el("div", "strip"); flowFor(G.seed).forEach(f => { if (!f.d || !Object.prototype.hasOwnProperty.call(G.picks, f.d)) return; const got = judge(decisionOf(f.d), G.picks[f.d]); if (got) { const sq = el("i", "r-" + got.rank); sq.title = RANK_SAY[got.rank]; strip.append(sq); } }); k.append(strip);
  G.log.push({ who, lines: textLines }); showBack();
  const out = await post();
  if (out && out.ok) boardCard(k, out.rows); else k.append(el("p", "small", G.jump ? "You jumped here from the admin page, so this run is not on the leaderboard." : "The leaderboard did not answer. Your score is still on this screen."));
  if (label === "Play again") { const see = el("button", "tool", "See every answer"); see.type = "button"; see.onclick = () => { see.remove(); answers(k); k.querySelector(".answers").scrollIntoView({ block: "start" }); }; k.append(see); }
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
    if (passed) { fx = { kind: "td", start: now() }; say("YOU WIN  " + G.us + " - " + G.them, "big"); await checkpoint("LEVEL 1 COMPLETE", ["Your family wins the Turkey Bowl.", "You: \"Ha ha, this proves that I am better than Uncle Rick once and for all.\""], "Go home?"); fx = null; }
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
      paint = (t) => { A.turf(c, t, { where: "texas" }); A.band(c, t, 10 + (t - start)); A.turkeyDance(c, 320, 350, t, "macarena", 2.8); A.person(c, 560, 226, 0.85, { ...A.CAST.you, face: FACE, shirt: "#bf5700", number: "", armUp: true, wave: t }); A.fireworks(c, t, 8); };
      fx = { kind: "td", start }; say("CHAMPION!", "flash big"); announce("champion"); sfx.cheer(); ui.textContent = "";
      await wait(6500);   // the band and the turkey get the whole screen before the score card comes up
      await checkpoint("YOU ARE THE CHAMPION", ["Texas beats Texas A&M, " + G.us + " to " + G.them + ". The band plays, the turkey dances, and you won all three games in one day.", "You: \"I did it. I won the second most important game ever, after beating Uncle Rick this morning.\""], "Play again"); fx = null; music.stop();
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
  await checkpoint("GAME OVER", id === "jet" ? ["Jerry fires you for being weird.", "Really? You got this far and decided it was okay to drink champagne while trying to get work done? You can do better."] : ["You lose the team's trust and everything falls apart."], "Play again");
}

// Andrew, 2026-11-17: "if they do the champagne thing, they should go back to the start of that level,
// not all the way back to the beginning. So whatever level you get to, you can start at that level next
// time." A run that ends past the park is kept as a run standing at the start of the level it reached:
// the same seed, with the answers and play calls from the levels before, so those points stay. The title
// screen offers it, beside a new game. The server scores it like any run and keeps a player's best.
const LEVEL_STARTS = { 2: "jerry", 3: "dallas", 4: "texas" };
function rewind() {
  if (!G || G.jump) return;
  const level = tally().level, flow = flowFor(G.seed), at = LEVEL_STARTS[level] ? flow.findIndex(f => f.s === LEVEL_STARTS[level]) : -1;
  if (at < 1) { unsave(); return; }   // a run that ends at the park starts over
  const before = flow.slice(0, at), keep = new Set(before.filter(f => f.d).map(f => f.d));
  const g = { ...fresh(), seed: G.seed, picks: Object.fromEntries(Object.entries(G.picks).filter(([k]) => keep.has(k))), calls: G.calls.slice(0, before.reduce((n, f) => n + (f.p || 0), 0)),
    step: at, from: level, where: level === 4 ? "dallas" : "park", jerry: level === 3 };
  store.set(SAVE, JSON.stringify(g));
}

async function run() {
  showHud(); showBack();
  const flow = flowFor(G.seed);
  const due = []; let owed = 0; flow.forEach((f, i) => { owed += f.p || 0; due[i] = owed; });
  // A reload lands at the start of the step that was under way, so a call made inside that step is taken back.
  G.calls.length = Math.min(G.calls.length, G.step > 0 ? due[G.step - 1] : 0);
  for (let i = G.step; i < flow.length; i++) {
    let step = flow[i];
    if (step.s === "title") { G.step = i + 1; continue; }
    if (step.s) { await scene(step.s); await aside("s:" + step.s); }
    else if (step.d) {
      // The story's scores, said out loud before the question that depends on them.
      const slotOf = decisionOf(step.d).slot || step.d;
      if (slotOf === "commercial") { G.q = "HALF"; G.half = 2; G.us = 7; G.them = 17; say("HALFTIME IN DALLAS  7 - 17"); sfx.whistle(); showHud(); await wait(1900); say(""); }
      if (slotOf === "speech") G.q = "Q4";
      if (slotOf === "kicker") { G.q = "Q2"; G.us = 7; G.them = 7; showHud(); }
      if (slotOf === "twominute") { G.q = "Q4"; G.them = 21; G.us = 17; say("TWO MINUTES LEFT  17 - 21"); showHud(); await wait(1900); say(""); }
      await aside("q:" + slotOf);
      const got = await decide(step.d); step = { ...step, d: slotOf };
      ui.textContent = "";   // the answered card comes down before anything else is drawn
      if (!got.over) await aside("a:" + slotOf);
      if (got.over) { await ending(slotOf); rewind(); return; }
      if (step.d === "kicker" && (got.rank === "best" || got.rank === "good")) { G.us += 3; paint = idle("texas"); say("YOUR KICKER MAKES THE NEXT ONE FROM 47"); sfx.good(); showHud(); await wait(2200); say(""); }
    } else if (step.p) { if (G.where === "texas") await family(); await aside("p:" + G.where); await plays(); }
    else if (step.gate) { const ok = await gate(step.gate); if (!ok) { rewind(); return; } if (step.gate === 4) { unsave(); return; } }
    G.step = i + 1; save();
  }
  unsave();
}
// ─── the admin page: jump to any part of the game ───
// Andrew, 2026-11-16: "give me the admin option to jump to diff parts of the game. make me an admin page." It is the game's
// own address with ?admin on the end, and a button on the title card, for the instructor only. Every part of a run is listed
// in order. Jumping to one starts the game there as if everything before it had gone well: the best answer to every earlier
// question and the right call on every earlier drive. A jumped run is not saved and is not sent to the leaderboard.
const ADMIN_URL = new URLSearchParams(location.search).has("admin");
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const canAdmin = () => me.instructor || LOCAL;
const PART = { kickoff: "Kickoff at the park", half1: "Halftime at the park", jerry: "Jerry Jones walks up", jet: "The jet", dallas: "Arriving in Dallas", texas: "The call from Texas, and Austin", band: "Halftime in Austin, with the band" };
const PLACE = { park: "The park", dallas: "Dallas", texas: "Austin" };
/** The run as it stands just before step i of a seed's flow, everything before it done well. */
function jumpTo(i, seed) {
  const flow = flowFor(seed); G = { ...fresh(), seed, jump: true }; let drives = 0;
  for (let n = 0; n < i; n++) {
    const st = flow[n];
    if (st.d) { const dec = decisionOf(st.d); G.picks[st.d] = dec.pick ? POWER.filter(p => p.w >= 1).slice(0, dec.pick).map(p => p.k) : (dec.opts.find(o => o.rank === "best") || dec.opts[0]).k; }
    else if (st.p) for (let k = 0; k < st.p; k++) G.calls.push(lookFor(seed, drives++).beat);
    else if (st.s === "half1") { G.us = 14; G.them = 21; G.q = "Q4"; G.half = 2; }
    else if (st.s === "jerry") { G.jerry = true; G.q = "FINAL"; }
    else if (st.s === "dallas") { G.where = "dallas"; G.jerry = false; G.us = 0; G.them = 0; G.q = "Q1"; G.half = 1; }
    else if (st.s === "texas") { G.where = "texas"; G.us = 0; G.them = 0; G.q = "Q1"; G.half = 1; }
    else if (st.s === "band") { G.us = 10; G.them = 14; G.q = "Q4"; G.half = 2; }
  }
  G.step = i;
}
/** The list of parts. pick(i, seed) is called with the part chosen. */
function adminCard(pick, back) {
  const seed = fresh().seed, flow = flowFor(seed), k = card("ADMIN");
  k.style.maxHeight = "100%";
  k.append(el("p", "say", "Jump to any part of the game. Everything before it counts as done well. A jumped run is not saved and is not on the leaderboard."));
  const top = el("div", "row"); k.append(top);
  if (back) { const b = el("button", "tool", "Back to the title"); b.type = "button"; b.onclick = back; top.append(b); }
  const lst = el("button", "tool", "Level 3 list and avatars"); lst.type = "button"; lst.onclick = admin; top.append(lst);
  const sng = el("a", "tool", "Songs"); sng.href = location.pathname + "?songs"; sng.style.textDecoration = "none"; top.append(sng);
  const again = el("button", "tool", "Different questions"); again.type = "button"; again.title = "Three questions have a second version, and the three side questions move around. This deals them again."; again.onclick = () => adminCard(pick, back); top.append(again);
  const list = el("div", "board"); list.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(30cqw,1fr));gap:0.6cqw;max-height:none"; k.append(list);
  let where = "park", level = 1, head = "";
  flow.forEach((st, i) => {
    if (st.s === "title") return;
    if (st.s === "dallas") where = "dallas"; if (st.s === "texas") where = "texas";
    const dec = st.d ? decisionOf(st.d) : null;
    const h = "LEVEL " + level + "   " + (level === 2 ? "THE INTERVIEW" : PLACE[where].toUpperCase());
    if (h !== head) { head = h; const hd = el("div", "who", h); hd.style.gridColumn = "1 / -1"; hd.style.marginTop = "0.6cqw"; list.append(hd); }
    const label = st.s ? PART[st.s] || st.s : dec ? "Question: " + (dec.topic || st.d) : st.p ? "The last drive" : "The end of Level " + st.gate;
    const b = el("button", "opt", label); b.type = "button"; b.style.fontSize = "2cqw"; b.onclick = () => pick(i, seed); list.append(b);
    if (st.gate) level = st.gate + 1;
  });
}

// ─── the opening ───
async function titleSequence() {
  // Before the name: a leaf in the dark, the park at dawn, feet, a face, and a catch that stops in the air.
  cine(true); let s0 = now();
  paint = (t) => { const e = t - s0; c.fillStyle = "#000"; c.fillRect(0, 0, A.W, A.H); c.save(); c.translate(320 + Math.sin(e * 3) * 40, -10 + e * 130); c.rotate(e * 3); c.fillStyle = "#e2622a"; c.beginPath(); c.ellipse(0, 0, 12, 6, 0, 0, 7); c.fill(); c.restore(); c.fillStyle = "#f4f1e6"; c.textAlign = "center"; c.font = "16px 'Press Start 2P', monospace"; c.globalAlpha = clamp(e - 0.4, 0, 1); c.fillText("COMM 118 PRESENTS", 320, 300); c.globalAlpha = 1; c.textAlign = "left"; };
  await beat(2000);
  s0 = now(); paint = (t) => { A.park(c, t, { time: "dawn", field: false, scroll: (t - s0) * 120 }); A.leaves(c, t, 70); A.letterbox(c); }; await beat(2200);
  paint = (t) => { A.cleats(c, t); A.letterbox(c); }; await beat(480);
  paint = (t) => { A.speedLines(c, t, "#a8551c", "#f6c945"); A.bust(c, "grandma", 320, 2.1, { look: 2 }, 30); A.letterbox(c); }; await beat(560);
  paint = (t) => { A.cleats(c, t, "#6a4bb0"); A.letterbox(c); }; await beat(480);
  s0 = now(); let caught = false;
  paint = (t) => { const p = clamp((t - s0) / 0.45, 0, 1); A.burst(c, t, 320, 170, "#e2622a", "#ffd75e"); A.bigCatch(c, t, p); A.letterbox(c); if (p >= 1 && !caught) { caught = true; if (!skipping) { sfx.slam(); hitStop(500); shake(300); flash(80); } } };
  await beat(1500);
  const start = now() - 1.8; let skip = skipping, thuds = 0, gobbled = false, strut = false; cine(true);
  const letters = "TURKEY BOWL".split("");
  const stop = () => { skip = true; };
  canvas.addEventListener("pointerdown", stop, { once: true }); onKey = stop;
  paint = (t) => {
    const e = skip ? 99 : t - start;
    if (e < 1.8) { c.fillStyle = "#000"; c.fillRect(0, 0, A.W, A.H); c.fillStyle = "#f4f1e6"; c.textAlign = "center"; c.font = "16px 'Press Start 2P', monospace"; c.globalAlpha = clamp(e / 0.5, 0, 1) * clamp((1.8 - e) / 0.4, 0, 1); c.fillText("COMM 118 PRESENTS", 320, 184); c.globalAlpha = 1; c.textAlign = "left"; return; }
    A.park(c, t, { time: e < 4.5 ? "dawn" : "day", field: false });
    c.textAlign = "center"; c.font = "48px 'Press Start 2P', monospace";
    letters.forEach((ch, i) => {
      const at = 2.4 + i * 0.16, p = clamp((e - at) / 0.28, 0, 1); if (p <= 0) return;
      if (p >= 1 && thuds <= i && !skip) { thuds = i + 1; sfx.thud(); shake(120); }
      const bounce = p >= 1 ? Math.max(0, Math.sin((e - at - 0.28) * 14) * 10 * Math.exp(-(e - at) * 2.4)) : 0;
      const y = Math.round((-40 + 190 * (p < 1 ? p * p : 1) - bounce) / 2) * 2, x = 80 + i * 48;
      c.fillStyle = "#1c1626"; c.fillText(ch, x + 4, y + 4); c.fillStyle = i < 6 ? "#ffd75e" : "#ff9d2e"; c.fillText(ch, x, y);
    });
    c.textAlign = "left";
    const te = e - 4.6;   // a turkey walks on and dances
    if (te > 0 && !strut && !skip) { strut = true; sfx.gobble(0, 3); }
    if (te > 0) { const tx = Math.min(320, 60 + te * 150); if (tx < 320) A.turkey(c, tx, 334, t); else A.turkeyDance(c, 320, 338, t, "macarena", 2.4); }
    A.leaves(c, t, 90);
    if (e > 5 && Math.floor(t * 2) % 2) { c.textAlign = "center"; c.font = "16px 'Press Start 2P', monospace"; c.fillStyle = "#1c1626"; c.fillText("THANKSGIVING MORNING", 322, 214); c.fillStyle = "#fff"; c.fillText("THANKSGIVING MORNING", 320, 212); c.textAlign = "left"; }
  };
  for (let i = 0; i < 74 && !skip && !skipping; i++) await wait(100);
  const cut = skip || skipping; skip = true; onKey = null; canvas.removeEventListener("pointerdown", stop); cine(false);
  return cut;
}
/** After the title: the people in the game besides the family walk on, one at a time, each under their name. A press skips it. */
async function roll() {
  cine(true); const s0 = now(), GAP = 1.15;
  paint = (t) => {
    const e = t - s0; A.park(c, t, { field: false });
    ROLL.forEach(([who, pose], i) => { const p = clamp((e - i * GAP) / 0.7, 0, 1); if (e < i * GAP) return; const x = 700 - (700 - (88 + i * 116)) * p; A.cast(c, who, Math.round(x / 2) * 2, 300, 0.95, p < 1 ? { armUp: false, kneel: false } : { ...pose, wave: t }); });
    A.leaves(c, t, 50);
  };
  for (let i = 0; i < ROLL.length && !skipping; i++) { await beat(700); if (skipping) break; say(NAMES[ROLL[i][0]], "line"); sfx.good(); await beat(GAP * 1000 - 700); }
  await beat(1400); say(""); cine(false);
}

async function title() {
  G = null; hud.textContent = ""; showBack(); say(""); ui.textContent = "";
  try { me = { ...me, ...(await api({ action: "me" })) }; } catch { /* the title still draws */ }
  if (me.photo && !FACE) { const img = await loadImage(me.photo); if (img) FACE = A.faceFrom(img); }
  try { await document.fonts.load("44px 'Press Start 2P'"); } catch { /* the fallback font draws */ }
  // The way back: an Admin button beside Back and Sound, on every screen, for the instructor only. Andrew, 2026-11-16: "how do i get back to the admin page".
  if (canAdmin()) { const b = $("toadmin"); b.hidden = false; b.onclick = () => { location.href = location.pathname + "?admin"; }; }
  if (ADMIN_URL && canAdmin() && !started) {
    paint = (t) => { A.park(c, t, { field: false }); A.leaves(c, t, 40); };
    const at = await new Promise(res => adminCard((i, seed) => res([i, seed]), () => res(null)));
    started = true; ui.textContent = ""; const a = ac(); if (a && a.state === "suspended") a.resume().catch(() => {});
    if (at) { jumpTo(at[0], at[1]); sfx.whistle(); return true; }
  }
  if (!started) {
    paint = (t) => { A.park(c, t, { time: "dawn", field: false }); A.leaves(c, t, 60); };
    const s0 = card(""); const b0 = el("button", "go", "Press start"); b0.type = "button"; b0.style.alignSelf = "center"; s0.append(b0);
    await new Promise(res => { b0.onclick = res; onKey = (e) => { if (e.key === "Enter" || e.key === " ") res(); }; });
    onKey = null; started = true; ui.textContent = ""; const a = ac(); if (a && a.state === "suspended") a.resume().catch(() => {});   // not awaited: a browser that will not start the sound must not stop the game
  }
  music.start("title");
  if (!(await titleSequence())) await roll();
  const k = card("TURKEY BOWL");
  k.append(el("p", "scene", "It's Thanksgiving morning. Your family is playing their annual football game at 8 AM at the park, and you are the coach."));
  k.append(el("p", "scene", "If you're lucky, the day will end with you coaching the Dallas Cowboys to victory."));
  k.append(el("p", "say", CREDIT));
  if (!me.open) { k.append(el("p", "say", "Turkey Bowl opens Wednesday, November 18.")); return false; }
  if (classRoute && !me.tag && !me.instructor) { const p = el("p", "say", "Sign in to play for COMM 118. "); const a = el("a", "", "Sign in"); a.href = "/login?next=" + encodeURIComponent(location.pathname); p.append(a); k.append(p); }
  let input = null;
  const row = el("div", "row"); k.append(row);
  if (me.tag) { const p = el("p", "say", "Coach " + me.name); p.append(el("span", "tag", me.tag)); row.append(p); }
  else if (!me.instructor) { input = el("input"); input.type = "text"; input.id = "coach"; input.maxLength = 30; input.autocomplete = "given-name"; input.setAttribute("aria-label", "Your first name and last initial"); input.placeholder = "First name, last initial"; input.value = store.get("turkeybowl-name"); row.append(input); }
  const old = saved();
  const cont = old ? el("button", "go", old.from ? "Start at Level " + old.from : "Continue your game") : null; if (cont) { cont.type = "button"; row.append(cont); }
  const start = el("button", "go", old ? "New game" : "Kick off"); start.type = "button"; row.append(start);
  let jump = null; const adminBtn = canAdmin() ? el("button", "tool", "Admin") : null; if (adminBtn) { adminBtn.type = "button"; row.append(adminBtn); }
  if (ADMIN_URL && !canAdmin()) { const p = el("p", "say", "The admin page is for the instructor. "); const a = el("a", "", "Sign in"); a.href = "/login?next=" + encodeURIComponent(location.pathname + location.search); p.append(a); k.append(p); }
  try { const b = await api({ action: "board" }); if (b.ok && b.rows.length) boardCard(k, b.rows); } catch { /* no board yet */ }
  const choice = await new Promise(res => {
    if (adminBtn) adminBtn.onclick = () => adminCard((i, seed) => { jump = [i, seed]; music.stop(); sfx.whistle(); res("jump"); }, () => location.reload());
    const ok = () => { if (input) { const n = shortName(input.value); if (n.length < 2) { input.focus(); return false; } me.name = n; store.set("turkeybowl-name", input.value.trim()); } music.stop(); sfx.whistle(); return true; };
    start.onclick = () => { if (ok()) res("new"); };
    if (cont) cont.onclick = () => { if (ok()) res("continue"); };
  });
  if (choice === "jump") { ui.textContent = ""; jumpTo(jump[0], jump[1]); return true; }
  G = choice === "continue" ? { ...fresh(), ...old, busy: false, from: 0 } : fresh();
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
