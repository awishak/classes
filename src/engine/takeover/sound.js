// Sound for Takeover: square waves, the way Worktopia beeps.
//
// Andrew, 2026-10-29: "kind of fun noises, like look up some of the old
// Nintendo games." Nothing is downloaded. Every sound is an oscillator or
// two, so the whole kit is a few hundred bytes. The browser lets no sound
// play before a press, so the title screen's Start is the first call, and
// unlock() runs there.
//
// Plain JS. createSound() answers { unlock, blip, pick, confirm, win, lose,
// coin, chat, mute, muted, destroy }. Every call is safe without audio.

export function createSound() {
  let ctx = null, muted = false, dead = false;
  const get = () => {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    return ctx;
  };
  const tone = (freq, ms, { type = "square", gain = 0.035, at = 0, slide = 0 } = {}) => {
    if (muted || dead) return;
    const c = get();
    if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + ms / 1000);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
    } catch { /* no audio here */ }
  };
  return {
    unlock() { const c = get(); if (c && c.state === "suspended") c.resume().catch(() => {}); },
    // A cursor moving.
    blip() { tone(1760, 30, { gain: 0.02 }); },
    // A choice made.
    pick() { tone(1046, 50); tone(1568, 70, { at: 0.06 }); },
    // Spent: a coin going out.
    coin() { tone(1975, 60); tone(2637, 180, { at: 0.07 }); },
    // Something lands in the chat.
    chat() { tone(880, 25, { gain: 0.015 }); tone(1174, 35, { gain: 0.015, at: 0.04 }); },
    // The week resolved well.
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, i === 3 ? 260 : 90, { at: i * 0.1 })); },
    // The week resolved badly.
    lose() { tone(392, 180, { slide: -120 }); tone(294, 300, { at: 0.18, slide: -100 }); },
    // The ball hit.
    bounce() { tone(660, 30, { gain: 0.03, slide: 200 }); },
    // Practice starts.
    whistle() { tone(2400, 120, { gain: 0.03 }); tone(2400, 220, { gain: 0.03, at: 0.16 }); },
    // Good news: a bright run up.
    happy() { [523, 659, 784, 880, 1046, 1318].forEach((f, i) => tone(f, i === 5 ? 300 : 70, { at: i * 0.07 })); },
    // Hard news: a minor step down.
    sad() { [440, 415, 392, 330].forEach((f, i) => tone(f, i === 3 ? 400 : 160, { type: "triangle", gain: 0.05, at: i * 0.17 })); },
    // The whole team cheers.
    cheer() { [784, 988, 1175, 1568].forEach((f, i) => { tone(f, 60, { at: i * 0.06 }); tone(f, 60, { at: 0.5 + i * 0.06 }); }); tone(1568, 400, { at: 0.8 }); },
    // The season handed in.
    confirm() { [784, 988, 1175, 1568, 1975].forEach((f, i) => tone(f, i === 4 ? 320 : 80, { at: i * 0.09 })); },
    mute(on) { muted = on == null ? !muted : !!on; return muted; },
    muted: () => muted,
    destroy() { dead = true; try { if (ctx) ctx.close(); } catch { /* already closed */ } ctx = null; },
  };
}
