// Turkey Bowl, the page: one canvas, one panel of words and buttons under
// it, and a run of the game from the title to Jerry's verdict.
//
// The game itself is script.js (what is asked, in what order, what each
// answer is worth) and the pictures are art.js. This file walks the flow,
// draws each step, keeps what the player did, and sends that to
// /api/turkey-bowl at every checkpoint. The score on screen is worked out
// here from script.js so the player sees it move; the score that counts is
// the server's, from the same rules.
//
// Two addresses, one game. On /comm118/turkey-bowl a student is signed in,
// so the server knows their name and gives them the COMM 118 tag. On
// /turkeybowl (and drewi.sh/turkeybowl) anyone types a name.

import { flowFor, decisionOf, judge, scoreRun, lookFor, orderFor, POWER, RANK_SAY, MAX_SCORE, HIRED, shortName } from "./script.js";
import * as A from "./art.js";
import { accessToken } from "../engine/session.js";

const $ = (id) => document.getElementById(id);
const canvas = $("screen"), c = canvas.getContext("2d"), panel = $("panel"), hud = $("hud"), banner = $("banner");
c.imageSmoothingEnabled = false;
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const store = { get(k) { try { return localStorage.getItem(k) || ""; } catch { return ""; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
const classRoute = /^\/comm118\/turkey-bowl/.test(location.pathname);

// ─── sound: a few square waves and a burst of noise ───
let audio = null, muted = store.get("turkeybowl-mute") === "1";
const ac = () => { if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = null; } } return audio; };
function tone(freq, at, dur, type = "square", vol = 0.06) {
  const a = ac(); if (!a || muted) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol, a.currentTime + at); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur);
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
  whistle: () => { tone(2100, 0, 0.18, "sine", 0.08); tone(2300, 0.2, 0.3, "sine", 0.08); },
  snap: () => tone(180, 0, 0.06, "square", 0.08),
  good: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.12)),
  meh: () => [392, 440].forEach((f, i) => tone(f, i * 0.1, 0.12)),
  bad: () => [220, 185].forEach((f, i) => tone(f, i * 0.14, 0.2, "sawtooth", 0.05)),
  silly: () => [660, 520, 700, 300].forEach((f, i) => tone(f, i * 0.07, 0.07, "triangle", 0.08)),
  over: () => [392, 370, 349, 330, 196].forEach((f, i) => tone(f, i * 0.22, 0.3, "sawtooth", 0.06)),
  td: () => { [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.14)); noise(0, 1.6, 0.07); },
  cheer: () => noise(0, 1.1, 0.05),
  jet: () => noise(0, 2.2, 0.04),
};
const muteBtn = $("mute");
const showMute = () => { muteBtn.textContent = muted ? "Sound off" : "Sound on"; muteBtn.setAttribute("aria-pressed", String(muted)); };
muteBtn.onclick = () => { muted = !muted; store.set("turkeybowl-mute", muted ? "1" : "0"); showMute(); if (!muted) sfx.click(); };
showMute();

// ─── the picture: whatever `paint` is right now, sixty times a second ───
let paint = (t) => A.park(c, t);
let t0 = performance.now();
(function frame(now) { const t = (now - t0) / 1000; try { paint(t); } catch { /* one bad frame is not worth a dead game */ } requestAnimationFrame(frame); })(t0);
const now = () => (performance.now() - t0) / 1000;
function say(text, flash = false) { banner.textContent = text || ""; banner.className = flash ? "flash" : ""; }

// ─── talking to the server ───
const visitor = (() => { let v = store.get("turkeybowl-visitor"); if (!/^[0-9a-f-]{36}$/.test(v)) { v = (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16))); store.set("turkeybowl-visitor", v); } return v; })();
async function api(body) {
  let token = ""; try { token = await accessToken(); } catch { token = ""; }
  const r = await fetch("/api/turkey-bowl", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ visitor, pin: store.get("classes-instructor-pin") || undefined, ...body }) });
  const out = await r.json().catch(() => null);
  if (!out) throw new Error("The server did not answer.");
  return out;
}

// ─── the run ───
let me = { open: true, name: "", tag: "", instructor: false };
let G = null;
const fresh = () => ({ seed: Array.from({ length: 12 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join(""), picks: {}, calls: [], us: 0, them: 0, q: "Q1", where: "park", lastRank: "good", window: 0, half: 1, rows: null });
const tally = () => scoreRun({ seed: G.seed, picks: G.picks, calls: G.calls });
function showHud() {
  hud.textContent = "";
  if (!G) return;
  const r = tally(), dallas = G.where === "dallas";
  const left = el("div", "box"); left.append(document.createTextNode((dallas ? "DAL " : "YOU ") + G.us + "  " + (dallas ? "VIS " : "THEM ") + G.them), el("br"), document.createTextNode(G.q));
  const right = el("div", "box"); right.append(document.createTextNode("LEVEL " + r.level), el("br")); const b = el("b", "", String(r.score)); right.append(document.createTextNode("PTS "), b);
  hud.append(left, right);
}
const card = (who) => { panel.textContent = ""; const k = el("div", "card"); if (who) k.append(el("div", "who", who)); panel.append(k); return k; };
const next = (k, label = "Continue") => new Promise(res => { const b = el("button", "go", label); b.type = "button"; b.onclick = () => { sfx.click(); res(); }; k.append(b); b.focus({ preventScroll: true }); });

const backdrop = (id, level) => {
  if (id === "breakfast") return (t) => A.kitchen(c, t);
  if (id === "jet") return (t) => { A.sky(c, t); A.plane(c, 110 + Math.sin(t) * 6, 80 + Math.sin(t * 1.7) * 4); };
  if (id === "speech") return (t) => A.locker(c, t);
  if (level === 2 || (G.where === "park" && G.jerry)) return (t) => { A.park(c, t, { field: false }); A.passerby(c, 262, 150, 0.8, "on"); A.leaves(c, t); };
  if (G.where === "dallas") return (t) => A.stadium(c, t, { midfield: true });
  return (t) => { A.park(c, t); A.leaves(c, t); };
};

async function decide(id) {
  const dec = decisionOf(id), base = backdrop(id, dec.level);
  const who = id === "commercial" || dec.level === 2 && id !== "jet" ? "jerry" : dec.who;
  paint = (t) => { base(t); if (who && id !== "speech") A.cast(c, who, 236, 172, who === "nephew" ? 1.0 : 1.5); if (id === "speech") A.cast(c, "you", 160, 170, 1.4); if (who === "crowd") { c.fillStyle = "#fff"; c.fillRect(196, 52, 26, 18); c.fillStyle = "#111"; c.font = "10px 'Press Start 2P', monospace"; c.fillText("?", 204, 66); } };
  say("");
  const pop = !dec.level;
  const k = card(pop ? "POP QUESTION" : dec.level === 2 ? "THE INTERVIEW" : dec.level === 3 ? "DALLAS" : "THE PARK");
  k.append(el("p", "scene", dec.scene));
  const opts = el("div", "opts"); k.append(opts);
  const pick = await new Promise(res => {
    if (dec.pick) {
      const chosen = new Set();
      const go = el("button", "go", "Lock it in"); go.type = "button"; go.disabled = true;
      orderFor(G.seed, id, POWER.length).forEach(i => {
        const p = POWER[i], b = el("button", "opt", p.text); b.type = "button"; b.setAttribute("aria-pressed", "false");
        b.onclick = () => { sfx.click(); if (chosen.has(p.k)) chosen.delete(p.k); else if (chosen.size < dec.pick) chosen.add(p.k); b.setAttribute("aria-pressed", String(chosen.has(p.k))); go.disabled = chosen.size !== dec.pick; };
        opts.append(b);
      });
      go.onclick = () => res([...chosen]);
      k.append(go);
    } else {
      orderFor(G.seed, id, dec.opts.length).forEach(i => {
        const o = dec.opts[i], b = el("button", "opt"); b.type = "button";
        const icon = (A.FOOD_OF[id] || {})[o.k];
        if (icon) { const cv = el("canvas"); cv.width = 16; cv.height = 16; A.food(cv.getContext("2d"), icon); b.append(cv); }
        b.append(el("span", "", o.text));
        b.onclick = () => res(o.k);
        opts.append(b);
      });
    }
  });
  G.picks[id] = pick;
  const got = judge(dec, pick);
  G.lastRank = got.rank;
  ({ best: sfx.good, good: sfx.meh, bad: sfx.bad, silly: sfx.silly, over: sfx.over })[got.rank]();
  showHud();
  const r = card(pop ? "POP QUESTION" : "");
  r.append(el("div", "rank r-" + got.rank, RANK_SAY[got.rank]));
  r.append(el("p", "scene", Array.isArray(pick) ? pick.map(x => POWER.find(p => p.k === x).text).join(" and ") : dec.opts.find(o => o.k === pick).text));
  r.append(el("p", "say", got.then));
  r.append(el("div", "pts", "+" + got.points + " of " + dec.points));
  r.append(el("p", "why", dec.after));
  await next(r, got.over ? "Uh oh" : "Continue");
  return got;
}

// One snap. The look is shown, the player calls run or pass, and the play runs.
async function snap(last, setCorrect) {
  const n = G.calls.length, look = lookFor(G.seed, n), where = G.where === "dallas" ? "dallas" : "park";
  const h = (s) => { let x = 7; for (const ch of G.seed + s + n) x = (x * 31 + ch.charCodeAt(0)) >>> 0; return x; };
  const pre = { call: "run", look: look.k, good: true, td: false, yards: 0 };
  paint = (t) => A.drawPlay(c, t, 0, pre, where);
  say("");
  const k = card("PLAY CALL"); k.append(el("p", "scene", look.say));
  const calls = el("div", "calls"); k.append(calls);
  const call = await new Promise(res => ["run", "pass"].forEach(v => { const b = el("button", "call " + v, v.toUpperCase()); b.type = "button"; b.onclick = () => res(v); calls.append(b); }));
  G.calls.push(call);
  const good = look.beat === call, strong = G.lastRank === "best" || G.lastRank === "good";
  const first = G.half === 1, cap = G.where === "dallas" ? (first ? 7 : 99) : (first ? 14 : 99);
  // A drive ends in a touchdown when the last call of the set is right, an earlier call in the set was too (or the set is one play), and the decision before the drive was a good one.
  const td = !!(last && good && strong && (setCorrect >= 1 || G.single) && G.us + 7 <= cap && !G.noTd);
  const play = { call, look: look.k, good, td, yards: good ? 8 + (h("y") % 14) + (strong ? 8 : 0) : call === "run" ? -2 : 0, pick: !good && call === "pass" && h("p") % 3 === 0 };
  panel.textContent = "";
  sfx.snap();
  const start = now(), dur = 2.3;
  paint = (t) => A.drawPlay(c, t, Math.min(1, (t - start) / dur), play, where);
  await wait(dur * 1000 * 0.82);
  if (td) { G.us += 7; say("TOUCHDOWN!", true); sfx.td(); }
  else if (good) { say("+" + play.yards + " YARDS"); sfx.good(); }
  else { say(call === "run" ? "STUFFED" : play.pick ? "INTERCEPTED!" : "INCOMPLETE"); sfx.bad(); }
  showHud();
  await wait(td ? 2100 : 1050);
  say("");
  return good;
}
async function plays(count) {
  G.window++; G.single = count === 1;
  let correct = 0;
  for (let i = 0; i < count; i++) if (await snap(i === count - 1, correct)) correct++;
  // The other side's scores, which the story needs: 21 to 14 at the half at the park, down ten at the half in Dallas.
  const theirs = { 1: 7, 3: 14, 6: 7, 7: 14, 8: 17, 11: 20 }[G.window];
  if (theirs && theirs > G.them) { G.them = theirs; say(G.where === "dallas" ? "THE VISITORS SCORE" : "THE OTHER SIDE SCORES"); sfx.bad(); showHud(); await wait(1300); say(""); }
  if (G.window === 10 && (G.picks.kicker === "best" || G.picks.kicker === "good")) { G.us += 3; say("FIELD GOAL. IT'S GOOD!"); sfx.good(); showHud(); await wait(1300); say(""); }
}

async function lines(who, list, label) { const k = card(who); list.forEach(x => k.append(el("p", "say", x))); await next(k, label); }

async function scene(name) {
  if (name === "kickoff") {
    G.q = "Q1"; const start = now();
    paint = (t) => { A.park(c, t); const p = Math.min(1, (t - start) / 2.6); for (let i = 0; i < 5; i++) { A.player(c, 40 + p * 30, 104 + i * 16, { jersey: "#6a4bb0", hair: "#1e1410" }, Math.floor(t * 8)); A.player(c, 270 - p * 20, 104 + i * 16, { jersey: "#e2622a", dir: -1, long: i % 2 === 0 }, Math.floor(t * 8)); } A.ball(c, 70 + p * 190, 120 - Math.sin(p * Math.PI) * 60); A.leaves(c, t); };
    say("8:00 AM"); sfx.whistle(); showHud();
    await lines("KICKOFF", ["The park, leaves coming down, breath in the air. The other side of the family kicks off.", "Before every snap you see how they are lined up. Call RUN or PASS."]);
  } else if (name === "half1") {
    G.q = "HALF"; G.half = 2;
    const short = G.us < 14; G.us = 14; G.them = 21;
    paint = (t) => { A.park(c, t); for (let i = 0; i < 6; i++) A.player(c, 96 + i * 26, 150 + (i % 2) * 8, { jersey: "#e2622a", long: i % 2 === 1, hair: ["#5a3a1e", "#1e1410", "#f3d67a"][i % 3], down: i % 3 === 0 }, 0); A.leaves(c, t); };
    say("HALFTIME  14 - 21"); sfx.whistle(); showHud();
    await lines("HALFTIME", [short ? "Grandma takes a kickoff all the way back, and it is still not enough. The other side scores late." : "The other side scores late.", "You are down 21 to 14. The team sits in the leaves and looks at you."]);
    G.q = "Q3";
  } else if (name === "jerry") {
    G.jerry = true; G.q = "FINAL"; showHud(); const start = now();
    paint = (t) => { const e = t - start; A.park(c, t, { field: false }); const wx = Math.max(250, 340 - e * 22); A.passerby(c, wx, 150, 0.8, e > 5 ? "down" : "on"); A.jerry(c, Math.min(120, -30 + e * 30), 172, 1.5); A.leaves(c, t, 44); };
    say("");
    const k = card("AFTER THE GAME");
    k.append(el("p", "say", "The park is gold and orange, and the leaves are falling slowly."));
    await wait(2600); k.append(el("p", "say", "A beautiful blonde woman walks by in sunglasses. She pulls her sunglasses down and looks at you."));
    await wait(3200); sfx.good(); k.append(el("p", "scene", "Jerry Jones: \"Hey, we got a big game today. I just happened to be walking by your park, and I saw you playing there, and I saw the way you've been coaching, and I like it. I want you to coach the Dallas Cowboys. But first we have to do a quick interview.\""));
    await next(k, "Okay, Jerry");
  } else if (name === "jet") {
    const start = now();
    paint = (t) => { A.sky(c, t); A.plane(c, -80 + Math.min(1, (t - start) / 3) * 190, 80 + Math.sin(t * 1.7) * 4); };
    say("WHEELS UP"); sfx.jet();
    await lines("JERRY'S JET", ["Jerry: \"You're hired. For today. Wheels up.\""]);
  } else if (name === "dallas") {
    G.where = "dallas"; G.us = 0; G.them = 0; G.q = "Q1"; G.half = 1; G.jerry = false;
    paint = (t) => A.stadium(c, t, { midfield: true });
    say("DALLAS"); sfx.cheer(); showHud();
    post();   // reaching Level 3 is the credit, so the server hears about the landing
    await lines("THANKSGIVING DAY", ["The stadium, the big screen, a blue star on silver at midfield, a full crowd, cameras everywhere.", "Same football, bigger. Call your plays."]);
    say("");
  }
}

async function post() {
  try { const out = await api({ action: "post", name: me.name, log: { seed: G.seed, picks: G.picks, calls: G.calls } }); if (out.ok) G.rows = out.rows; return out; } catch { return null; }
}
function boardCard(k, rows) {
  if (!rows || !rows.length) return;
  const wrap = el("div", "board"), tb = el("table"), head = el("tr");
  ["#", "COACH", "SCORE", "LEVEL"].forEach(h => head.append(el("th", "", h))); tb.append(head);
  const mine = rows.findIndex(r => r.me);
  rows.forEach((r, i) => {
    if (i >= 15 && i !== mine) return;
    const tr = el("tr", r.me ? "me" : ""); tr.append(el("td", "", String(i + 1)));
    const name = el("td", "", r.name); if (r.tag) name.append(el("span", "tag", r.tag)); tr.append(name, el("td", "", r.score.toLocaleString("en-US")), el("td", "", String(r.level)));
    tb.append(tr);
  });
  wrap.append(tb); k.append(wrap);
}
async function checkpoint(who, textLines, label) {
  const k = card(who); textLines.forEach(x => k.append(el("p", "say", x)));
  const r = tally(); k.append(el("div", "pts", r.score.toLocaleString("en-US") + " of " + MAX_SCORE.toLocaleString("en-US")));
  const out = await post();
  if (out && out.ok) boardCard(k, out.rows); else k.append(el("p", "small", "The leaderboard did not answer. Your score is still on this screen."));
  await next(k, label);
}

async function gate(n) {
  const r = tally(), passed = !(r.lost === n);
  if (n === 1) {
    if (passed) {
      G.us = Math.max(G.us + 7, 28); const start = now(), play = { call: "pass", look: "deep", good: true, td: true, yards: 40 };
      paint = (t) => A.drawPlay(c, t, Math.min(1, (t - start) / 2.6), play, "park");
      await wait(2000); say("TOUCHDOWN!", true); sfx.td(); showHud(); await wait(2200);
      say("YOU WIN  " + G.us + " - " + G.them);
      await checkpoint("LEVEL 1 COMPLETE", ["Last drive, last play, touchdown. Your family wins the Turkey Bowl."], "Go home?");
    } else {
      G.q = "FINAL"; paint = (t) => { A.park(c, t); A.leaves(c, t); }; say("FINAL  " + G.us + " - " + G.them); sfx.over(); showHud();
      await checkpoint("YOU LOSE THE TURKEY BOWL", ["The comeback falls short. Your uncle will bring this up at dinner."], "Play again");
    }
  } else if (n === 2) {
    paint = backdrop("culture", 2);
    if (passed) { sfx.good(); await checkpoint("LEVEL 2 COMPLETE", ["Jerry: \"I like you. You're coaching my team today.\""], "To the jet"); }
    else { sfx.over(); await checkpoint("NO JOB", ["Jerry: \"I'll keep looking. Happy Thanksgiving.\""], "Play again"); }
  } else {
    if (passed) {
      G.us = 23; G.them = 20; const start = now(), play = { call: "pass", look: "blitz", good: true, td: true, yards: 40 };
      paint = (t) => A.drawPlay(c, t, Math.min(1, (t - start) / 2.6), play, "dallas");
      await wait(2000); say("TOUCHDOWN!", true); sfx.td(); G.q = "FINAL"; showHud(); await wait(2200);
      paint = (t) => { A.stadium(c, t, { midfield: true }); A.jerry(c, 70, 176, 1.5); A.cast(c, "you", 250, 176, 1.4); A.leaves(c, t, 40, 170); };
      say(r.hired ? "HIRED!" : "DALLAS WINS", r.hired);
      await checkpoint(r.hired ? "YOU GOT THE JOB" : "A WIN IN DALLAS", [r.hired ? "Jerry walks onto the field: \"You're my coach for the rest of the season.\"" : "Jerry shakes your hand: \"Good win. I'm going another direction next week.\" Score " + HIRED.toLocaleString("en-US") + " or more and he keeps you."], "Play again");
    } else {
      G.q = "FINAL"; paint = (t) => { A.stadium(c, t, { midfield: true }); A.jerry(c, 70, 176, 1.5); A.cast(c, "you", 250, 176, 1.4); }; say("FINAL  " + G.us + " - " + G.them); sfx.over(); showHud();
      await checkpoint("THANKS FOR COMING", ["Jerry shakes your hand: \"Thanks for coming.\""], "Play again");
    }
  }
  return passed;
}

async function ending(id) {
  if (id === "jet") {
    const start = now();
    paint = (t) => { const e = t - start; if (e < 3.2) { A.sky(c, t); A.plane(c, 110, 80); A.jerry(c, 250, 176, 1.5, false); A.cast(c, "you", 190, 176, 1.3); c.fillStyle = "#e8dcc0"; c.fillRect(176, 82, 28, 4); c.fillRect(182, 72, 16, 11); } else { A.stadium(c, t, { midfield: true }); A.chute(c, 160 + Math.sin(e * 1.4) * 26, Math.min(118, -10 + (e - 3.2) * 26), t); } };
    say("FIRED"); await wait(3200); say("YOU PARACHUTE IN ANYWAY"); sfx.silly(); await wait(5200);
  } else {
    paint = (t) => { A.stadium(c, t); A.cast(c, "receiver", 200, 172, 1.5); A.cast(c, "you", 120, 172, 1.4); };
    say("THE LOCKER ROOM IS GONE");
  }
  await checkpoint("GAME OVER", [id === "jet" ? "Jerry fires you for being weird." : "You lose the team's trust and everything falls apart."], "Play again");
}

async function run() {
  G = fresh(); showHud();
  for (const step of flowFor(G.seed)) {
    if (step.s === "title") continue;
    if (step.s) await scene(step.s);
    else if (step.d) {
      if (step.d === "twominute") { G.q = "Q4"; G.us = G.them - 4; G.noTd = true; showHud(); }
      if (step.d === "commercial") { G.q = "HALF"; G.half = 2; G.us = 7; G.them = 17; say("HALFTIME  7 - 17"); sfx.whistle(); showHud(); await wait(1500); }
      if (step.d === "speech") G.q = "Q3";
      if (step.d === "backup") G.q = "Q4";
      const got = await decide(step.d);
      if (got.over) { await ending(step.d); return; }
    } else if (step.p) await plays(step.p);
    else if (step.gate) { if (!(await gate(step.gate))) return; }
  }
}

// ─── the title ───
async function title() {
  G = null; hud.textContent = "";
  paint = (t) => { A.park(c, t, { field: false }); for (let i = 0; i < 4; i++) A.player(c, 60 + i * 66 + Math.sin(t * 2 + i) * 4, 160, { jersey: i % 2 ? "#6a4bb0" : "#e2622a", long: i === 1, hair: ["#5a3a1e", "#f3d67a", "#1e1410", "#a8551c"][i] }, Math.floor(t * 6 + i)); A.ball(c, 160 + Math.sin(t * 1.5) * 60, 60 + Math.cos(t * 3) * 14); A.leaves(c, t, 50); };
  say("TURKEY BOWL");
  const k = card("THANKSGIVING MORNING");
  k.append(el("p", "scene", "Coach your family to a Turkey Bowl win. Then Jerry Jones calls."));
  try { me = { ...me, ...(await api({ action: "me" })) }; } catch { /* the title still draws */ }
  if (!me.open) { k.append(el("p", "say", "Turkey Bowl opens Tuesday, November 17.")); return; }
  if (classRoute && !me.tag && !me.instructor) { const p = el("p", "say", "Sign in to play for COMM 118. "); const a = el("a", "", "Sign in"); a.href = "/login?next=" + encodeURIComponent(location.pathname); p.append(a); k.append(p); }
  let input = null;
  if (me.tag) { const p = el("p", "say", "Coach " + me.name); p.append(el("span", "tag", me.tag)); k.append(p); }
  else if (!me.instructor) {
    const row = el("div", "row"); input = el("input"); input.type = "text"; input.id = "coach"; input.maxLength = 30; input.autocomplete = "given-name"; input.setAttribute("aria-label", "Your first name and last initial"); input.placeholder = "First name, last initial"; input.value = store.get("turkeybowl-name");
    row.append(input); k.append(row);
  }
  const start = el("button", "go", "Kick off"); start.type = "button"; k.append(start);
  if (me.instructor) { const adm = el("button", "opt", "Who has reached Level 3"); adm.type = "button"; adm.onclick = admin; k.append(adm); }
  try { const b = await api({ action: "board" }); if (b.ok && b.rows.length) boardCard(k, b.rows); } catch { /* no board yet */ }
  await new Promise(res => { start.onclick = () => { if (input) { const n = shortName(input.value); if (n.length < 2) { input.focus(); return; } me.name = n; store.set("turkeybowl-name", input.value.trim()); } ac(); sfx.whistle(); res(); }; });
  say("");
}
async function admin() {
  const k = card("WEEKLY CHALLENGE 4"); k.append(el("p", "say", "Credit is reaching Level 3."));
  try {
    const out = await api({ action: "admin" }); const tb = el("table"), head = el("tr"); ["COACH", "EMAIL", "LEVEL", "BEST", "RUNS"].forEach(h => head.append(el("th", "", h))); tb.append(head);
    (out.rows || []).forEach(r => { const tr = el("tr", r.level >= 3 ? "me" : ""); const n = el("td", "", r.name); if (r.tag) n.append(el("span", "tag", r.tag)); tr.append(n, el("td", "", r.email), el("td", "", String(r.level)), el("td", "", String(r.score)), el("td", "", String(r.runs))); tb.append(tr); });
    const w = el("div", "board"); w.append(tb); k.append(w);
  } catch (e) { k.append(el("p", "say", e.message)); }
  const back = el("button", "go", "Back"); back.type = "button"; back.onclick = () => location.reload(); k.append(back);
}

(async function main() { for (;;) { await title(); if (!me.open) return; await run(); } })();
