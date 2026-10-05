// 3x5: a contact sheet of photos and three film strips.
//
// COMM 3's worksheet, from the brief at ~/Projects/3x5/BRIEF.md (2026-10-03)
// and the mockup beside it. A group of one to five drags exactly three photos
// into each of three strips, then writes two more photos they would shoot for
// each strip and where they would go to get them. The first strip is named by
// the group and has to be finished, three photos and two write-ins, before the
// second and third open. Andrew, 2026-10-03: "they should have to do the first
// topic on their own ... once they do that and add the 4th and 5th picture
// description, the next two sets of 3 get unlocked." Those two offer five of
// his words, a shuffle, or a write-in.
//
// Plain DOM, like worktopia/terminal.js: mountThreeByFive(root, opts) draws
// into root and returns { destroy }. Nothing touches the window at import, so
// the smoke run can load the module. The photos and the shutter sounds are
// static files under public/3x5, built by ~/Projects/3x5/scripts.
//
// A roll is one canvas. Each is saved whole, as JSON, under roll:a, roll:b
// and so on (the field check allows letters only), on the student's own sheet
// through worktopia/store.js, which cuts a long value into 500-character rows.
// The group is the student signed in plus up to four classmates off the roster.
// The canvas lives on the sheet of whoever made it.

export const THREE_BY_FIVE_KEY = "3x5";
export const THREE_BY_FIVE_TITLE = "3x5";

// Andrew's twenty-four, 2026-10-03.
export const CATS = ["play", "love", "creativity", "joy", "craft", "work", "rest", "waiting", "home", "getting around", "ritual", "repair", "noise", "quiet", "hunger", "weather", "decay", "celebration", "order", "direction", "speed", "tenderness", "power", "faith"];
const BASE = "/3x5/";
const TOTAL = 200;
const MAX_NAMES = 5;

// a, b ... z, ba, bb: a roll's number as letters, for the field name.
export const letters = (n) => { let s = ""; do { s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); } while (n > 0); return s; };
const numberOf = (s) => [...s].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 97, 0);

const draw = () => CATS.slice().sort(() => Math.random() - .5).slice(0, 5);
const freshRoll = (names) => ({
  names: names.slice(), cats: ["", "", ""], options: [[], draw(), draw()],
  frames: [[null, null, null], [null, null, null], [null, null, null]],
  more: [["", ""], ["", ""], ["", ""]], sent: [[false, false], [false, false], [false, false]],
  started: new Date().toISOString(),
});
// A roll read back, with any missing part filled in, so an older shape still draws.
const tidyRoll = (r, names) => {
  const f = freshRoll(names);
  if (!r || typeof r !== "object") return f;
  return {
    ...f, ...r,
    names: Array.isArray(r.names) && r.names.length ? r.names.slice(0, MAX_NAMES) : f.names,
    cats: [0, 1, 2].map(c => String((r.cats || [])[c] || "")),
    options: [0, 1, 2].map(c => Array.isArray((r.options || [])[c]) && r.options[c].length ? r.options[c] : f.options[c]),
    frames: [0, 1, 2].map(c => [0, 1, 2].map(s => ((r.frames || [])[c] || [])[s] || null)),
    more: [0, 1, 2].map(c => [0, 1].map(m => String(((r.more || [])[c] || [])[m] || ""))),
    sent: [0, 1, 2].map(c => [0, 1].map(m => !!((r.sent || [])[c] || [])[m])),
  };
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

// Palette and ladder from ~/.claude/DESIGN.md. The film is the one dark thing
// on the light page, and the orange is a camera's date stamp. Scoped to .tx5
// so nothing leaks onto the class page around it.
const LIGHT = "--page:#fafaf9;--card:#ffffff;--sunk:#f6f4f1;--ink:#1c1917;--ink-2:#57534e;--ink-3:#6b655f;--line:#e3ded8;--line-soft:#f0edea;--film:#161311;--film-edge:#2a2522;--hole:#fafaf9;--frame:#0b0a09;--frame-empty:#221e1b;--on-film:#d8d0c7;--on-film-dim:#a39a90;--stamp:#b45309;--press:#1c1917;--press-ink:#ffffff;--ok:#0f766e;--ring:#1c1917;";
const DARK = "--page:#0f0d0c;--card:#17140f;--sunk:#1d1915;--ink:#f6f2ec;--ink-2:#c4b9ae;--ink-3:#a79c92;--line:#2b2622;--line-soft:#231f1b;--film:#0a0908;--film-edge:#2b2622;--hole:#1d1915;--frame:#040403;--frame-empty:#15120f;--on-film:#d8d0c7;--on-film-dim:#a39a90;--stamp:#fbbf24;--press:#f6f2ec;--press-ink:#0f0d0c;--ok:#5eead4;--ring:#f6f2ec;color-scheme:dark;";
const STYLE = `
.tx5 { ${LIGHT} background: var(--page); color: var(--ink); font-family: "Outfit", -apple-system, BlinkMacSystemFont, sans-serif; font-size: 17px; line-height: 1.4; --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace; }
@media (prefers-color-scheme: dark) { .tx5:not([data-tx5="light"]) { ${DARK} } }
.tx5[data-tx5="dark"] { ${DARK} }
.tx5 *, .tx5 *::before, .tx5 *::after { box-sizing: border-box; }
.tx5 button, .tx5 input, .tx5 textarea, .tx5 select { font: inherit; color: inherit; }
.tx5 :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: 8px; }
@media (prefers-reduced-motion: reduce) { .tx5 *, .tx5 *::before, .tx5 *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
.tx5 .wrap { max-width: 1480px; margin: 0 auto; padding: 12px 16px 40px; }
.tx5 .bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 8px 0 16px; }
.tx5 .mark { font-weight: 700; font-size: 26px; letter-spacing: -0.02em; line-height: 1; display: flex; align-items: baseline; gap: 2px; }
.tx5 .mark .x { font-weight: 400; color: var(--ink-3); font-size: 20px; padding: 0 2px; }
.tx5 .chips { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tx5 .chips .lbl { font-size: 13px; color: var(--ink-3); letter-spacing: .06em; text-transform: uppercase; margin-right: 4px; }
.tx5 .chip { min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--line); background: var(--card); color: var(--ink-2); font-size: 15px; font-weight: 500; cursor: pointer; }
.tx5 .chip[aria-pressed="true"] { background: var(--press); color: var(--press-ink); border-color: var(--press); }
.tx5 .chip:disabled { cursor: not-allowed; color: var(--ink-3); background: transparent; border-style: dashed; }
.tx5 .save { margin-left: auto; font-family: var(--mono); font-size: 13px; color: var(--ink-3); }
.tx5 .save.bad { color: var(--stamp); }
.tx5 .roll { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 12px 16px; margin-bottom: 16px; border-radius: 12px; background: var(--card); border: 1px solid var(--line); }
.tx5 .roll .lbl { font-size: 13px; color: var(--ink-3); letter-spacing: .06em; text-transform: uppercase; }
.tx5 .who { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.tx5 .name { display: inline-flex; align-items: center; gap: 4px; min-height: 36px; padding: 0 4px 0 14px; border-radius: 999px; background: var(--sunk); font-family: var(--mono); font-size: 15px; color: var(--stamp); font-weight: 500; }
.tx5 .name.me { padding-right: 14px; }
.tx5 .name button { min-width: 32px; min-height: 32px; border: 0; background: transparent; color: var(--ink-2); cursor: pointer; border-radius: 999px; font-size: 17px; line-height: 1; }
.tx5 .add { min-height: 40px; border-radius: 8px; border: 1px solid var(--line); background: var(--card); padding: 0 10px; font-size: 15px; color: var(--ink-2); max-width: 100%; }
.tx5 .date { font-family: var(--mono); font-size: 15px; color: var(--stamp); white-space: nowrap; margin-left: auto; }
.tx5 .canvas { display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 24px; align-items: start; }
@media (max-width: 980px) { .tx5 .canvas { grid-template-columns: 1fr; } .tx5 .strips-col { order: -1; } }
.tx5 .sheet { background: var(--sunk); border-radius: 16px; padding: 16px; min-width: 0; }
.tx5 .sheet-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.tx5 .sheet-head h2 { margin: 0; font-size: 17px; font-weight: 600; }
.tx5 .sheet-head .count { font-family: var(--mono); font-size: 13px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.tx5 .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); grid-auto-rows: var(--cell, 104px); grid-auto-flow: dense; gap: 8px; }
@media (max-width: 600px) { .tx5 .grid { grid-template-columns: repeat(4, 1fr); gap: 6px; } }
.tx5 .shot { position: relative; height: 100%; border-radius: 8px; overflow: hidden; background: var(--frame-empty); cursor: grab; border: 0; padding: 0; display: block; width: 100%; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }
.tx5 .shot img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; -webkit-user-drag: none; transition: transform .25s ease, filter .25s ease; }
.tx5 .shot:hover img { transform: scale(1.04); }
.tx5 .shot .n { position: absolute; left: 6px; bottom: 4px; font-family: var(--mono); font-size: 13px; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.8); font-variant-numeric: tabular-nums; }
.tx5 .shot.placed img { filter: grayscale(1) brightness(.45); transform: none; }
.tx5 .shot.placed { cursor: pointer; }
.tx5 .shot .tag { position: absolute; inset: 0; display: grid; place-items: center; color: #fff; font-weight: 600; font-size: 15px; text-shadow: 0 1px 3px rgba(0,0,0,.8); text-transform: lowercase; padding: 6px; text-align: center; pointer-events: none; }
.tx5 .blank { height: 100%; border-radius: 8px; border: 1px dashed var(--line); background: repeating-linear-gradient(135deg, transparent 0 6px, var(--line-soft) 6px 7px); }
.tx5 .strips { display: grid; gap: 20px; min-width: 0; }
.tx5 .strip { background: var(--film); color: var(--on-film); border-radius: 12px; padding: 14px 16px 16px; position: relative; border: 1px solid var(--film-edge); box-shadow: 0 10px 30px -18px rgba(0,0,0,.6); }
.tx5 .strip::before, .tx5 .strip::after { content: ""; position: absolute; left: 16px; right: 16px; height: 8px; background: repeating-linear-gradient(90deg, transparent 0 7px, var(--hole) 7px 15px, transparent 15px 22px); border-radius: 2px; opacity: .9; }
.tx5 .strip::before { top: 5px; } .tx5 .strip::after { bottom: 5px; }
.tx5 .strip.wind { animation: tx5-wind .32s cubic-bezier(.2,.9,.3,1.2); }
@keyframes tx5-wind { 0% { transform: translateX(0); } 40% { transform: translateX(-6px); } 100% { transform: translateX(0); } }
.tx5 .leader { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 10px 0 12px; }
.tx5 .word { font-size: 26px; font-weight: 600; letter-spacing: -0.01em; text-transform: lowercase; line-height: 1.1; min-width: 0; }
.tx5 .word input { background: transparent; border: 0; border-bottom: 1.5px dashed var(--on-film-dim); color: var(--on-film); font-size: 26px; font-weight: 600; letter-spacing: -0.01em; padding: 0 0 2px; width: 100%; min-width: 0; text-transform: lowercase; }
.tx5 .word input::placeholder { color: var(--on-film-dim); font-weight: 500; }
.tx5 .word input:focus-visible { outline: none; border-bottom-color: var(--stamp); }
.tx5 .leader .k { font-family: var(--mono); font-size: 13px; color: var(--on-film-dim); letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
.tx5 .frames { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.tx5 .frame { aspect-ratio: 1; background: var(--frame-empty); border-radius: 6px; position: relative; overflow: hidden; border: 1px solid var(--film-edge); display: grid; place-items: center; cursor: default; transition: box-shadow .15s ease, transform .15s ease; min-height: 44px; }
.tx5 .frame .slot { font-family: var(--mono); font-size: 15px; color: var(--on-film-dim); }
.tx5 .frame.over { box-shadow: 0 0 0 3px var(--stamp) inset; transform: scale(1.03); }
.tx5 .frame.full { background: var(--frame); cursor: pointer; }
.tx5 .frame img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
.tx5 .frame.landed img { animation: tx5-land .28s cubic-bezier(.2,.9,.3,1.15); }
@keyframes tx5-land { 0% { transform: scale(1.18); opacity: .4; } 100% { transform: scale(1); opacity: 1; } }
.tx5 .frame .eject { position: absolute; inset: 0; display: grid; place-items: center; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #fff; background: rgba(0,0,0,.55); opacity: 0; transition: opacity .15s; font-weight: 600; }
.tx5 .frame.full:hover .eject, .tx5 .frame.full:focus-visible .eject { opacity: 1; }
.tx5 .more { display: grid; gap: 8px; margin-top: 12px; overflow: hidden; max-height: 0; opacity: 0; transition: max-height .4s ease, opacity .3s ease .1s; }
.tx5 .strip.complete .more { max-height: 520px; opacity: 1; }
.tx5 .more .lbl { font-size: 13px; color: var(--on-film-dim); letter-spacing: .06em; text-transform: uppercase; margin-top: 4px; }
.tx5 .more textarea { width: 100%; min-height: 52px; resize: vertical; background: var(--frame-empty); border: 1px solid var(--film-edge); border-radius: 8px; padding: 10px 12px; color: var(--on-film); font-size: 16px; line-height: 1.35; }
.tx5 .more textarea::placeholder { color: var(--on-film-dim); }
.tx5 .more textarea:focus-visible { outline: 2px solid var(--stamp); outline-offset: 0; }
.tx5 .hint { font-size: 15px; color: var(--on-film-dim); margin: 10px 0 0; }
.tx5 .strip.locked { opacity: .7; border-style: dashed; box-shadow: none; }
.tx5 .leader button.k { background: transparent; border: 1px solid var(--film-edge); border-radius: 999px; padding: 0 12px; min-height: 36px; cursor: pointer; color: var(--on-film-dim); }
.tx5 .leader button.k:hover { color: var(--on-film); border-color: var(--on-film-dim); }
.tx5 .picks { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.tx5 .pick { min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--on-film-dim); background: transparent; color: var(--on-film); font-size: 17px; font-weight: 500; cursor: pointer; text-transform: lowercase; }
.tx5 .pick:hover { background: var(--frame-empty); border-color: var(--on-film); }
.tx5 .own { width: 100%; min-height: 44px; background: var(--frame-empty); border: 1px solid var(--film-edge); border-radius: 8px; padding: 0 12px; color: var(--on-film); font-size: 16px; }
.tx5 .own::placeholder { color: var(--on-film-dim); }
.tx5 .own:focus-visible { outline: 2px solid var(--stamp); outline-offset: 0; }
.tx5 .strip.complete .hint { display: none; }
.tx5 .foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tx5 .foot .prog { font-family: var(--mono); font-size: 15px; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.tx5 .foot .prog b { color: var(--ok); font-weight: 500; }
.tx5 .foot .btns { display: flex; gap: 8px; flex-wrap: wrap; }
.tx5 .btn { min-height: 44px; padding: 0 18px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); color: var(--ink); font-weight: 600; font-size: 15px; cursor: pointer; }
.tx5 .btn.primary { background: var(--press); color: var(--press-ink); border-color: var(--press); }
.tx5 .btn:disabled { cursor: not-allowed; color: var(--ink-3); background: transparent; border-style: dashed; }
.tx5 .handed { font-size: 15px; color: var(--ok); font-weight: 600; }
.tx5 .note { font-size: 15px; color: var(--ink-3); margin: 16px 0 0; max-width: 65ch; }
.tx5-ghost { position: fixed; z-index: 50; width: 132px; aspect-ratio: 1; border-radius: 8px; overflow: hidden; pointer-events: none; box-shadow: 0 18px 40px -12px rgba(0,0,0,.6); transform: translate(-50%, -50%) rotate(-2deg); left: 0; top: 0; }
.tx5-ghost img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tx5 .shot.big { cursor: zoom-out; background: var(--film); z-index: 1; box-shadow: 0 16px 40px -16px rgba(0,0,0,.7); }
.tx5 .shot.big img { object-fit: contain; }
.tx5 .shot.big:hover img { transform: none; }
.tx5 .shot.big.placed img { filter: none; }
.tx5 .shot.big .tag { display: none; }
.tx5 .shot.big .n { font-size: 15px; left: 10px; top: 8px; bottom: auto; }
.tx5 .acts { display: none; }
.tx5 .shot.big .acts, .tx5 .frame.big .acts { position: absolute; left: 0; right: 0; bottom: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 28px 12px 12px; background: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,.72) 45%); }
.tx5 .acts .date { font-family: var(--mono); font-size: 13px; color: #fff; letter-spacing: .04em; margin-right: auto; margin-left: 0; text-shadow: 0 1px 2px rgba(0,0,0,.8); font-variant-numeric: tabular-nums; }
.tx5 .act { min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,.55); background: rgba(0,0,0,.45); color: #fff; font-size: 15px; font-weight: 500; cursor: pointer; text-transform: lowercase; }
.tx5 .act:hover { background: rgba(0,0,0,.75); border-color: #fff; }
.tx5 .act:focus-visible { outline-color: #fff; }
.tx5 .acts .none { font-size: 13px; color: #fff; }
.tx5 .frame.big { grid-column: 1 / -1; order: -1; aspect-ratio: var(--ar, 4 / 3); cursor: zoom-out; background: var(--frame); }
.tx5 .frame.big img { object-fit: contain; }
.tx5 .frame.big .eject { display: none; }
.tx5 .frame.big .acts { padding-top: 20px; }
.tx5 .frame.big .acts .act { min-height: 40px; }
.tx5 .grid.reel { display: flex; flex-direction: column; gap: 16px; }
.tx5 .still { background: var(--film); border-radius: 12px; overflow: hidden; margin: 0; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
.tx5 .still:not(.placed) img { cursor: grab; }
.tx5 .still img { display: block; width: 100%; height: auto; max-height: 86vh; object-fit: contain; background: var(--frame); -webkit-user-drag: none; }
.tx5 .still .acts { position: static; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 12px; background: none; }
.tx5 .still .acts .num { font-family: var(--mono); font-size: 15px; color: #fff; font-variant-numeric: tabular-nums; }
@media (min-width: 981px) { .tx5 .canvas.reeling .strips-col { position: sticky; top: 72px; max-height: calc(100vh - 84px); overflow-y: auto; } }
.tx5 .wi { display: grid; gap: 8px; }
.tx5 .wi-row { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
.tx5 .wi-btn { min-height: 44px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--on-film-dim); background: transparent; color: var(--on-film); font-size: 15px; font-weight: 500; cursor: pointer; }
.tx5 .wi-btn:hover:not(:disabled) { background: var(--frame-empty); border-color: var(--on-film); }
.tx5 .wi-btn:disabled { cursor: not-allowed; color: var(--on-film-dim); border-style: dashed; }
.tx5 .wi-btn.go { background: var(--on-film); color: var(--film); border-color: var(--on-film); }
.tx5 .wi-btn.go:disabled { background: transparent; color: var(--on-film-dim); border-color: var(--on-film-dim); }
.tx5 .wi-done { display: flex; gap: 12px; align-items: flex-start; background: var(--frame-empty); border: 1px solid var(--film-edge); border-radius: 8px; padding: 10px 8px 10px 12px; }
.tx5 .wi-done p { margin: 0; flex: 1; font-size: 16px; line-height: 1.35; color: var(--on-film); white-space: pre-wrap; overflow-wrap: anywhere; padding-top: 2px; }
.tx5 .wi-done .wi-btn { min-height: 36px; padding: 0 12px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; flex: none; }
.tx5 .wi-empty { font-size: 15px; color: var(--on-film-dim); margin: 0; }
.tx5.ro .strip .more { max-height: none; opacity: 1; }
.tx5 .msg { padding: 24px 0; font-size: 17px; }
`;

/**
 * Draw 3x5 into root.
 * opts: { store, viewer: { id, name }, classmates: [names], readOnly, theme: "light" | "dark" | undefined }
 * Returns { destroy }.
 */
export function mountThreeByFive(root, { store, viewer, classmates = [], readOnly = false, theme } = {}) {
  if (!document.getElementById("tx5-css")) {
    const s = document.createElement("style"); s.id = "tx5-css"; s.textContent = STYLE; document.head.appendChild(s);
  }
  root.classList.add("tx5");
  root.classList.toggle("ro", !!readOnly);
  if (theme) root.setAttribute("data-tx5", theme); else root.removeAttribute("data-tx5");
  const me = viewer?.name || "You";
  root.innerHTML = `
    <div class="wrap">
      <header class="bar">
        <div class="mark">3<span class="x">&times;</span>5</div>
        <div class="chips" role="group" aria-label="Sort the sheet">
          <span class="lbl">Sort</span>
          <button type="button" class="chip" data-sort="colour" aria-pressed="false">Colour</button>
          <button type="button" class="chip" data-sort="taken" aria-pressed="true">Taken</button>
          <button type="button" class="chip" disabled title="After the map tool">Place</button>
        </div>
        <div class="chips" role="group" aria-label="How the photos show">
          <span class="lbl">View</span>
          <button type="button" class="chip" data-view="sheet" aria-pressed="true">Sheet</button>
          <button type="button" class="chip" data-view="big" aria-pressed="false">Big</button>
        </div>
        <div class="chips rolls" role="group" aria-label="Your rolls"></div>
        <span class="save" aria-live="polite"></span>
      </header>
      <div class="roll"><span class="lbl">On this roll</span><div class="who"></div><span class="date"></span></div>
      <div class="canvas">
        <section class="sheet" aria-label="Contact sheet">
          <div class="sheet-head"><h2>Contact sheet</h2><span class="count"></span></div>
          <div class="grid"></div>
        </section>
        <aside class="strips-col" aria-label="Three strips">
          <div class="strips"></div>
          <div class="foot" style="margin-top:20px">
            <span class="prog"></span>
            <div class="btns">${readOnly ? "" : `<button type="button" class="btn newroll">New roll</button><button type="button" class="btn primary handin" disabled>Hand in</button>`}</div>
          </div>
          <p class="handed" hidden></p>
          ${readOnly ? "" : `<p class="note">Drag a photo onto a frame, or click the photo to see it big and put it in a strip from there. Big, in the bar, shows every photo full size to scroll through. Click a filled frame to see it big or take it out. Esc shrinks anything big. Return submits a write-in; shift-return starts a new line. Everything saves as you go. Put your group on the roll at the top: the canvas lives on your sheet, so hand it in from here.</p>`}
        </aside>
      </div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const gridEl = $(".grid"), stripsEl = $(".strips"), canvasEl = $(".canvas"), saveEl = $(".save"), rollsEl = $(".rolls"), whoEl = $(".who");
  let alive = true;

  // ─── state: every roll, the one on screen, and the view, which is this browser's ───
  let rolls = [];
  let at = 0;
  let submittedAt = null;
  let photos = [];
  let loaded = false;
  const view = { sort: "taken", mode: "sheet" };
  try { const v = JSON.parse(localStorage.getItem("tx5-view") || "null"); if (v) { if (v.sort === "colour") view.sort = "colour"; if (v.mode === "big") view.mode = "big"; } } catch { /* no storage */ }
  const keepView = () => { try { localStorage.setItem("tx5-view", JSON.stringify(view)); } catch { /* no storage */ } };
  const R = () => rolls[at];

  // ─── saving: each roll whole, a moment after the last change ───
  const dirty = new Set();
  let timer = null, saving = false, failed = false;
  const showSave = (text, bad) => { saveEl.textContent = text; saveEl.classList.toggle("bad", !!bad); };
  const flush = async () => {
    clearTimeout(timer); timer = null;
    if (readOnly || saving || !dirty.size) return;
    saving = true;
    const todo = [...dirty]; dirty.clear();
    showSave("Saving");
    try {
      for (const i of todo) await store.save("roll:" + letters(i), JSON.stringify(rolls[i]));
      failed = false;
      if (alive) showSave(dirty.size ? "Saving" : "Saved");
    } catch {
      todo.forEach(i => dirty.add(i));
      failed = true;
      if (alive) { showSave("Not saved. Trying again", true); timer = setTimeout(flush, 4000); }
    } finally {
      saving = false;
      if (alive && dirty.size && !failed) timer = setTimeout(flush, 300);
    }
  };
  const persist = () => {
    if (readOnly) return;
    dirty.add(at);
    showSave("Saving");
    clearTimeout(timer); timer = setTimeout(flush, 700);
  };
  const onHide = () => { if (document.visibilityState === "hidden") flush(); };
  document.addEventListener("visibilitychange", onHide);

  // ─── the rules ───
  const ready = (s) => s.trim().length > 3;
  const written = (c) => R().more[c].filter((s, m) => R().sent[c][m] && ready(s)).length;
  const complete = (c) => R().frames[c].every(Boolean) && written(c) === 2;
  const unlocked = (c) => c === 0 || (complete(0) && !!R().cats[0].trim());
  const rollDone = () => [0, 1, 2].every(c => complete(c) && !!R().cats[c].trim());

  // ─── sound: real shutters, one at random per drop, and the burst for a strip's third photo ───
  const SFX = { drop: [], burst: null, last: -1 };
  if (!readOnly) {
    fetch(BASE + "sounds.json").then(r => r.json()).then(j => {
      if (!alive) return;
      SFX.drop = (j.drop || []).map(e => { const a = new Audio(BASE + e.src); a.preload = "auto"; return a; });
      if (j.burst) { SFX.burst = new Audio(BASE + j.burst.src); SFX.burst.preload = "auto"; }
    }).catch(() => {});
  }
  const play = (a) => { try { const c = a.cloneNode(); c.volume = 0.9; c.play().catch(() => {}); } catch { /* no audio */ } };
  let ac = null;
  const click = (n = 1) => {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < n; i++) {
        const t = ac.currentTime + i * 0.07;
        const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
        o.type = "square"; o.frequency.setValueAtTime(1900 - i * 150, t); f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = 1.2;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        o.connect(f); f.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.06);
      }
    } catch { /* no audio */ }
  };
  const sfx = {
    drop() {
      if (!SFX.drop.length) return click(1);
      let i; do { i = Math.floor(Math.random() * SFX.drop.length); } while (SFX.drop.length > 1 && i === SFX.last);
      SFX.last = i; play(SFX.drop[i]);
    },
    burst() { if (!SFX.burst) return click(3); play(SFX.burst); },
  };

  // ─── the sheet ───
  const placedIn = (id) => { for (let c = 0; c < 3; c++) for (let s = 0; s < 3; s++) if (R().frames[c][s] === id) return c; return -1; };
  const slotOf = (id) => { for (let c = 0; c < 3; c++) for (let s = 0; s < 3; s++) if (R().frames[c][s] === id) return [c, s]; return null; };
  const catName = (c) => R().cats[c] || (c === 0 ? "your word" : "a word");
  const stripWord = (c) => R().cats[c].trim() || "strip " + (c + 1);
  const sorted = () => {
    const list = photos.slice();
    if (view.sort === "colour") {
      const vivid = list.filter(p => !p.colour.grey).sort((a, b) => a.colour.h - b.colour.h || b.colour.s - a.colour.s);
      const grey = list.filter(p => p.colour.grey).sort((a, b) => b.colour.l - a.colour.l);
      return [...vivid, ...grey];
    }
    return list.sort((a, b) => String(a.taken).localeCompare(String(b.taken)));
  };
  let bigId = null, bigFrame = null;
  const act = (text, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "act"; b.textContent = text; b.addEventListener("click", (ev) => { ev.stopPropagation(); fn(); }); return b; };
  function actsFor(p) {
    const bar = document.createElement("div"); bar.className = "acts";
    const d = document.createElement("span"); d.className = "date"; d.textContent = String(p.taken || "").slice(0, 10); bar.appendChild(d);
    if (readOnly) return bar;
    const spot = slotOf(p.id);
    if (spot) {
      const [c, s] = spot;
      bar.appendChild(act("take out of " + stripWord(c), () => { R().frames[c][s] = null; bigFrame = null; persist(); sfx.drop(); renderAll(); checkDone(); }));
    } else {
      let any = false;
      for (let c = 0; c < 3; c++) {
        if (!unlocked(c) || (c > 0 && !R().cats[c].trim())) continue;
        const s = R().frames[c].findIndex(x => !x); if (s < 0) continue;
        any = true;
        bar.appendChild(act("put in " + stripWord(c), () => { bigId = null; place(p.id, c, s); }));
      }
      if (!any) { const none = document.createElement("span"); none.className = "none"; none.textContent = "no open strip has room"; bar.appendChild(none); }
    }
    return bar;
  }
  let cols = 5;
  function sizeGrid() {
    if (!alive || view.mode === "big") return;
    const cs = getComputedStyle(gridEl);
    cols = Math.max(1, cs.gridTemplateColumns.split(" ").length);
    const gap = parseFloat(cs.columnGap) || 8;
    const cell = (gridEl.clientWidth - gap * (cols - 1)) / cols;
    if (cell > 0) gridEl.style.setProperty("--cell", cell.toFixed(2) + "px");
    const big = gridEl.querySelector(".shot.big");
    if (big) spanBig(big);
  }
  function spanBig(el) {
    const tall = el.classList.contains("tall");
    el.style.gridColumn = "span " + Math.min(tall ? 3 : 5, cols); el.style.gridRow = "span " + (tall ? 5 : 3);
  }
  const countText = (n) => n >= TOTAL ? n + " exposed" : n + " of " + TOTAL + " exposed";
  function renderSheet() {
    const reel = view.mode === "big";
    gridEl.classList.toggle("reel", reel);
    canvasEl.classList.toggle("reeling", reel);
    root.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === view.mode)));
    root.querySelectorAll("[data-sort]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sort === view.sort)));
    $(".count").textContent = photos.length ? countText(photos.length) : "";
    gridEl.innerHTML = "";
    const list = sorted();
    if (reel) {
      list.forEach((p, i) => {
        const b = document.createElement("figure"); b.className = "still"; b.dataset.id = p.id;
        const img = document.createElement("img"); img.src = BASE + (p.large || p.thumb); img.alt = "Photo " + (i + 1) + ", taken " + String(p.taken).slice(0, 10);
        img.loading = i > 3 ? "lazy" : "eager"; img.decoding = "async"; img.draggable = false;
        if (p.w && p.h) img.style.aspectRatio = p.w + " / " + p.h;
        b.appendChild(img);
        if (placedIn(p.id) >= 0) b.classList.add("placed");
        const bar = actsFor(p);
        const n = document.createElement("span"); n.className = "num"; n.textContent = String(i + 1).padStart(2, "0");
        bar.prepend(n); b.appendChild(bar); gridEl.appendChild(b);
      });
      return;
    }
    list.forEach((p, i) => {
      const b = document.createElement("div");
      b.className = "shot"; b.dataset.id = p.id; b.tabIndex = 0; b.setAttribute("role", "button");
      const big = p.id === bigId;
      b.setAttribute("aria-label", "Photo " + (i + 1) + ", taken " + String(p.taken).slice(0, 10) + (big ? ", big. Press to shrink." : ". Press to see the photo big."));
      const img = document.createElement("img"); img.src = BASE + (big && p.large ? p.large : p.thumb); img.alt = ""; img.loading = i > 40 && !big ? "lazy" : "eager"; img.draggable = false;
      b.appendChild(img);
      const n = document.createElement("span"); n.className = "n"; n.textContent = String(i + 1).padStart(2, "0"); b.appendChild(n);
      const c = placedIn(p.id);
      if (c >= 0) { b.classList.add("placed"); const t = document.createElement("span"); t.className = "tag"; t.textContent = catName(c); b.appendChild(t); }
      if (big) { b.classList.add("big"); if (p.h > p.w) b.classList.add("tall"); spanBig(b); b.appendChild(actsFor(p)); }
      gridEl.appendChild(b);
    });
    for (let i = list.length; i < TOTAL && photos.length; i++) { const d = document.createElement("div"); d.className = "blank"; d.setAttribute("aria-hidden", "true"); gridEl.appendChild(d); }
  }

  // ─── the strips ───
  function renderStrips() {
    stripsEl.innerHTML = "";
    R().cats.forEach((cat, c) => {
      const full = R().frames[c].every(Boolean);
      const open = unlocked(c) || (readOnly && !!cat);
      const el = document.createElement("div"); el.className = "strip" + (full ? " complete" : "") + (open ? "" : " locked"); el.dataset.cat = c;
      const leader = document.createElement("div"); leader.className = "leader";
      const word = document.createElement("div"); word.className = "word";
      if (!open) {
        word.textContent = c === 1 ? "second strip" : "third strip";
        leader.appendChild(word);
        const k = document.createElement("span"); k.className = "k"; k.textContent = readOnly ? "not reached" : "locked"; leader.appendChild(k);
        el.appendChild(leader);
        if (!readOnly) {
          const why = document.createElement("p"); why.className = "hint";
          const left = [];
          if (!R().cats[0].trim()) left.push("name your first strip");
          if (!R().frames[0].every(Boolean)) left.push("fill the first strip (" + (3 - R().frames[0].filter(Boolean).length) + " to go)");
          if (written(0) < 2) left.push("write and submit the two more (" + (2 - written(0)) + " to go)");
          why.textContent = "Opens when you " + left.join(", ") + ".";
          el.appendChild(why);
        }
        stripsEl.appendChild(el);
        return;
      }
      if (c === 0 || cat) {
        if (c === 0 && !readOnly) {
          const inp = document.createElement("input"); inp.id = "tx5-word-1"; inp.placeholder = "your word"; inp.value = cat; inp.setAttribute("aria-label", "Name your first category");
          inp.addEventListener("input", () => { R().cats[0] = inp.value; persist(); renderSheet(); sizeGrid(); renderLocks(); });
          word.appendChild(inp);
        } else word.textContent = cat || "unnamed";
        leader.appendChild(word);
        const k = document.createElement(c === 0 || readOnly ? "span" : "button"); k.className = "k"; k.textContent = c === 0 ? "theirs" : readOnly ? "picked" : "change";
        if (c === 0 && !readOnly) k.textContent = "yours";
        if (c !== 0 && !readOnly) { k.type = "button"; k.addEventListener("click", () => { R().cats[c] = ""; persist(); renderAll(); }); }
        leader.appendChild(k);
        el.appendChild(leader);
      } else {
        word.textContent = "pick a word"; leader.appendChild(word);
        const k = document.createElement("button"); k.className = "k"; k.type = "button"; k.textContent = "shuffle";
        k.addEventListener("click", () => { R().options[c] = draw(); persist(); renderStrips(); });
        leader.appendChild(k); el.appendChild(leader);
        const picks = document.createElement("div"); picks.className = "picks";
        R().options[c].forEach(w => {
          const b = document.createElement("button"); b.type = "button"; b.className = "pick"; b.textContent = w;
          b.addEventListener("click", () => { R().cats[c] = w; persist(); renderAll(); });
          picks.appendChild(b);
        });
        el.appendChild(picks);
        const own = document.createElement("input"); own.id = "tx5-word-" + (c + 1); own.className = "own"; own.placeholder = "or write your own and press return"; own.setAttribute("aria-label", "Write your own category");
        own.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && own.value.trim()) { R().cats[c] = own.value.trim(); persist(); renderAll(); } });
        el.appendChild(own);
        stripsEl.appendChild(el);
        return;
      }
      const frames = document.createElement("div"); frames.className = "frames";
      for (let s = 0; s < 3; s++) {
        const id = R().frames[c][s];
        const f = document.createElement("div"); f.className = "frame" + (id ? " full" : ""); f.dataset.cat = c; f.dataset.slot = s;
        if (id) {
          f.tabIndex = 0; f.setAttribute("role", "button");
          const p = photos.find(x => x.id === id);
          const isBig = bigFrame && bigFrame[0] === c && bigFrame[1] === s;
          if (p) { const img = document.createElement("img"); img.src = BASE + (isBig && p.large ? p.large : p.thumb); img.alt = ""; f.appendChild(img); }
          const e = document.createElement("span"); e.className = "eject"; e.textContent = "view"; f.appendChild(e);
          if (isBig) { f.classList.add("big"); if (p && p.w && p.h) f.style.setProperty("--ar", p.w + " / " + p.h); if (p) f.appendChild(actsFor(p)); }
          f.setAttribute("aria-label", "Frame " + (s + 1) + " of " + catName(c) + ", filled. " + (isBig ? "Press to shrink." : "Press to see the photo big."));
          f.addEventListener("click", (ev) => { if (ev.target.closest(".act")) return; bigFrame = isBig ? null : [c, s]; renderStrips(); });
          f.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); f.click(); } });
        } else {
          const sl = document.createElement("span"); sl.className = "slot"; sl.textContent = String(s + 1); f.appendChild(sl);
          f.setAttribute("aria-label", "Frame " + (s + 1) + " of " + catName(c) + ", empty");
        }
        frames.appendChild(f);
      }
      el.appendChild(frames);
      if (!readOnly) {
        const hint = document.createElement("p"); hint.className = "hint";
        const n = R().frames[c].filter(Boolean).length;
        hint.textContent = n === 0 ? "Three photos go here." : n === 3 ? "" : (3 - n) + " more to fill the strip.";
        if (c === 0 && !cat.trim() && n === 0) hint.textContent = "Name the strip, then three photos go here.";
        el.appendChild(hint);
      }
      const more = document.createElement("div"); more.className = "more";
      const lbl = document.createElement("div"); lbl.className = "lbl"; lbl.textContent = "Two more you'd shoot, and where you'd go"; more.appendChild(lbl);
      for (let m = 0; m < 2; m++) more.appendChild(writeIn(c, m));
      el.appendChild(more);
      stripsEl.appendChild(el);
    });
    renderFoot();
  }
  function writeIn(c, m) {
    const box = document.createElement("div"); box.className = "wi";
    const label = "Photo " + (m + 4) + " for " + catName(c);
    if (readOnly) {
      const text = R().more[c][m].trim();
      if (!text) { const p = document.createElement("p"); p.className = "wi-empty"; p.textContent = "Not written."; box.appendChild(p); return box; }
      const done = document.createElement("div"); done.className = "wi-done";
      const p = document.createElement("p"); p.textContent = text + (R().sent[c][m] ? "" : " (not submitted)"); done.appendChild(p);
      box.appendChild(done);
      return box;
    }
    if (R().sent[c][m]) {
      const done = document.createElement("div"); done.className = "wi-done";
      const p = document.createElement("p"); p.textContent = R().more[c][m]; done.appendChild(p);
      const ed = document.createElement("button"); ed.type = "button"; ed.className = "wi-btn"; ed.id = "tx5-edit-" + c + "-" + m; ed.textContent = "edit";
      ed.setAttribute("aria-label", "Edit " + label.toLowerCase());
      ed.addEventListener("click", () => { R().sent[c][m] = false; persist(); afterWrite("tx5-more-" + c + "-" + m); });
      done.appendChild(ed); box.appendChild(done);
      return box;
    }
    const ta = document.createElement("textarea"); ta.id = "tx5-more-" + c + "-" + m; ta.value = R().more[c][m]; ta.rows = 2;
    ta.placeholder = m === 0 ? "A dog mid-leap at the dog park on Lincoln." : "Two men at the chess tables in the square, late afternoon.";
    ta.setAttribute("aria-label", label);
    const row = document.createElement("div"); row.className = "wi-row";
    const go = document.createElement("button"); go.type = "button"; go.className = "wi-btn go"; go.textContent = "submit";
    go.setAttribute("aria-label", "Submit " + label.toLowerCase());
    go.disabled = !ready(ta.value);
    const submit = () => {
      if (!ready(ta.value)) return;
      R().more[c][m] = ta.value.trim(); R().sent[c][m] = true; persist();
      const next = [0, 1].find(k => !R().sent[c][k]);
      afterWrite(next === undefined ? "tx5-edit-" + c + "-" + m : "tx5-more-" + c + "-" + next);
    };
    ta.addEventListener("input", () => { R().more[c][m] = ta.value; persist(); go.disabled = !ready(ta.value); });
    ta.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); submit(); } });
    go.addEventListener("click", submit);
    row.appendChild(go); box.appendChild(ta); box.appendChild(row);
    return box;
  }
  function afterWrite(focusId) {
    renderStrips(); renderLocks();
    const el = document.getElementById(focusId); if (el) el.focus();
  }
  function renderFoot() {
    const placed = R().frames.flat().filter(Boolean).length;
    const w = [0, 1, 2].reduce((n, c) => n + written(c), 0);
    $(".prog").innerHTML = "<b>" + placed + "</b>/9 placed &middot; <b>" + w + "</b>/6 written";
    const hand = $(".handin");
    if (hand) {
      hand.disabled = !rollDone() && !submittedAt;
      hand.textContent = submittedAt ? "Take back" : "Hand in";
      hand.title = submittedAt ? "" : rollDone() ? "" : "Fill all three strips and write all six to hand in";
    }
    const handed = $(".handed");
    handed.hidden = !submittedAt;
    if (submittedAt) handed.textContent = "Handed in " + new Date(submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + (readOnly ? "." : ". Changes still save.");
  }
  const wasDone = [false, false, false];
  function primeDone() { for (let c = 0; c < 3; c++) wasDone[c] = complete(c) && (c !== 0 || !!R().cats[0].trim()); }
  function checkDone() {
    for (let c = 0; c < 3; c++) {
      const now = complete(c) && (c !== 0 || !!R().cats[0].trim());
      if (now && !wasDone[c]) sfx.burst();
      wasDone[c] = now;
    }
    renderFoot();
  }
  let wasOpen = null;
  function renderLocks() {
    checkDone();
    const now = complete(0) && !!R().cats[0].trim();
    if (wasOpen === null) { wasOpen = now; return; }
    if (now !== wasOpen) { wasOpen = now; const a = document.activeElement; renderStrips(); if (a && a.id) document.getElementById(a.id)?.focus(); }
  }

  // ─── the roll: who is on it, which roll, the date ───
  function renderRoll() {
    whoEl.innerHTML = "";
    const names = R().names;
    names.forEach((n, i) => {
      const chip = document.createElement("span"); chip.className = "name" + (i === 0 || readOnly ? " me" : "");
      chip.appendChild(document.createTextNode(n));
      if (i > 0 && !readOnly) {
        const x = document.createElement("button"); x.type = "button"; x.textContent = "×"; x.setAttribute("aria-label", "Take " + n + " off the roll");
        x.addEventListener("click", () => { R().names.splice(i, 1); persist(); renderRoll(); });
        chip.appendChild(x);
      }
      whoEl.appendChild(chip);
    });
    if (!readOnly && names.length < MAX_NAMES) {
      const left = classmates.filter(n => !names.includes(n)).sort((a, b) => a.localeCompare(b));
      if (left.length) {
        const sel = document.createElement("select"); sel.className = "add"; sel.setAttribute("aria-label", "Add a classmate to the roll");
        sel.innerHTML = "<option value=\"\">Add a classmate</option>" + left.map(n => "<option>" + esc(n) + "</option>").join("");
        sel.addEventListener("change", () => { if (!sel.value) return; R().names.push(sel.value); persist(); renderRoll(); });
        whoEl.appendChild(sel);
      }
    }
    const d = new Date(R().started || Date.now());
    $(".roll .date").textContent = "'" + String(d.getFullYear()).slice(2) + " " + String(d.getMonth() + 1).padStart(2, "0") + " " + String(d.getDate()).padStart(2, "0");
    rollsEl.innerHTML = "";
    if (rolls.length > 1) {
      const l = document.createElement("span"); l.className = "lbl"; l.textContent = "Roll"; rollsEl.appendChild(l);
      rolls.forEach((r, i) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = String(i + 1);
        b.setAttribute("aria-pressed", String(i === at)); b.setAttribute("aria-label", "Roll " + (i + 1) + (r.cats[0] ? ", " + r.cats[0] : ""));
        b.addEventListener("click", () => { if (i === at) return; flush(); at = i; bigId = null; bigFrame = null; wasOpen = null; primeDone(); renderAll(); });
        rollsEl.appendChild(b);
      });
    }
  }
  function renderAll() { if (!alive) return; renderRoll(); renderSheet(); renderStrips(); sizeGrid(); }

  function place(id, c, s) {
    if (readOnly || R().frames[c][s]) return;
    if (placedIn(id) >= 0) return;
    R().frames[c][s] = id; persist();
    const full = R().frames[c].every(Boolean);
    sfx.drop();
    renderAll();
    checkDone();
    const strip = stripsEl.querySelector(".strip[data-cat=\"" + c + "\"]");
    const frame = strip && strip.querySelector(".frame[data-slot=\"" + s + "\"]");
    if (frame) frame.classList.add("landed");
    if (strip && full) strip.classList.add("wind");
  }

  // ─── picking up and dragging ───
  let drag = null, justDragged = false;
  const onDown = (ev) => {
    if (readOnly || ev.target.closest(".act")) return;
    const shot = ev.target.closest(".shot, .still");
    if (!shot || shot.classList.contains("placed")) return;
    if (shot.classList.contains("still") && !ev.target.closest("img")) return;
    if (ev.pointerType === "touch") return; // a tap opens the photo big, and it is placed from there
    if (shot.classList.contains("still")) ev.preventDefault();
    drag = { id: shot.dataset.id, x: ev.clientX, y: ev.clientY, moved: false, ghost: null, over: null, src: shot.querySelector("img").src };
  };
  const onMove = (ev) => {
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 6) return;
      drag.moved = true;
      const g = document.createElement("div"); g.className = "tx5-ghost"; const im = document.createElement("img"); im.src = drag.src; im.alt = ""; g.appendChild(im); document.body.appendChild(g); drag.ghost = g; document.body.style.cursor = "grabbing";
    }
    drag.ghost.style.left = ev.clientX + "px"; drag.ghost.style.top = ev.clientY + "px";
    const under = document.elementFromPoint(ev.clientX, ev.clientY);
    const f = under && root.contains(under) ? under.closest(".strip:not(.locked) .frame:not(.full)") : null;
    if (drag.over && drag.over !== f) drag.over.classList.remove("over");
    if (f) f.classList.add("over");
    drag.over = f || null;
  };
  const onUp = () => {
    if (!drag) return;
    const d = drag; drag = null; document.body.style.cursor = "";
    if (d.ghost) d.ghost.remove();
    if (d.over) d.over.classList.remove("over");
    if (!d.moved) return;
    justDragged = true; setTimeout(() => { justDragged = false; }, 0);
    if (d.over) place(d.id, +d.over.dataset.cat, +d.over.dataset.slot);
  };
  function toggleBig(id) {
    bigId = bigId === id ? null : id;
    renderSheet();
    const el = bigId && gridEl.querySelector(".shot[data-id=\"" + (window.CSS && CSS.escape ? CSS.escape(bigId) : bigId) + "\"]");
    if (el) { el.scrollIntoView({ block: "nearest", behavior: "smooth" }); el.focus({ preventScroll: true }); }
  }
  const onClick = (ev) => {
    if (ev.target.closest(".act")) return;
    const shot = ev.target.closest(".shot");
    if (!shot || justDragged) return;
    toggleBig(shot.dataset.id);
  };
  const onKey = (ev) => {
    const shot = ev.target.closest && ev.target.closest(".tx5 .shot");
    if (shot && root.contains(shot) && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); toggleBig(shot.dataset.id); return; }
    if (ev.key === "Escape" && (bigId || bigFrame)) { bigId = null; bigFrame = null; renderAll(); }
  };
  root.addEventListener("pointerdown", onDown);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);
  root.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  let ro = null;
  if (window.ResizeObserver) { ro = new ResizeObserver(sizeGrid); ro.observe(gridEl); } else window.addEventListener("resize", sizeGrid);

  // ─── the bar ───
  root.querySelectorAll("[data-sort]").forEach(b => b.addEventListener("click", () => { view.sort = b.dataset.sort; keepView(); renderSheet(); sizeGrid(); }));
  root.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => {
    if (view.mode === b.dataset.view) return;
    view.mode = b.dataset.view; bigId = null; keepView(); renderSheet(); sizeGrid();
    $(".sheet").scrollIntoView({ block: "start" });
  }));
  const newroll = $(".newroll");
  if (newroll) newroll.addEventListener("click", () => {
    flush();
    rolls.push(freshRoll(R().names));
    at = rolls.length - 1; bigId = null; bigFrame = null; wasOpen = null; primeDone();
    persist(); renderAll();
  });
  const handin = $(".handin");
  if (handin) handin.addEventListener("click", async () => {
    handin.disabled = true;
    try {
      await flush();
      if (submittedAt) { await store.recall(); submittedAt = null; }
      else submittedAt = await store.submit();
      showSave(submittedAt ? "Handed in" : "Taken back");
    } catch { showSave("Could not reach the server. Try again", true); }
    renderFoot();
  });

  // ─── load ───
  root.querySelector(".canvas").hidden = true;
  showSave("Loading");
  Promise.all([
    fetch(BASE + "index.json").then(r => r.json()).catch(() => null),
    store.load().catch(() => null),
  ]).then(([list, file]) => {
    if (!alive) return;
    if (!file) { showSave("Your canvas could not be read. Reload to try again.", true); return; }
    photos = Array.isArray(list) ? list : [];
    submittedAt = file.submitted_at || null;
    const found = Object.keys(file.answers || {}).map(k => k.match(/^roll:([a-z]+)$/)).filter(Boolean)
      .map(m => [numberOf(m[1]), m[0]]).sort((a, b) => a[0] - b[0]);
    rolls = found.map(([, k]) => { try { return tidyRoll(JSON.parse(file.answers[k]), [me]); } catch { return null; } }).filter(Boolean);
    if (!rolls.length) {
      if (readOnly) { root.querySelector(".wrap").innerHTML = "<p class=\"msg\">No roll on this sheet yet.</p>"; return; }
      rolls = [freshRoll([me])];
    }
    if (!readOnly) rolls.forEach(r => { if (r.names[0] !== me) r.names = [me, ...r.names.filter(n => n !== me)].slice(0, MAX_NAMES); });
    at = rolls.length - 1;
    loaded = true;
    primeDone();
    root.querySelector(".canvas").hidden = false;
    showSave(readOnly ? "" : "Saved");
    if (!photos.length) $(".count").textContent = "The photo index did not load.";
    renderAll();
  });

  return {
    destroy() {
      alive = false;
      if (loaded) flush();
      document.removeEventListener("visibilitychange", onHide);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.removeEventListener("keydown", onKey);
      if (ro) ro.disconnect(); else window.removeEventListener("resize", sizeGrid);
      if (drag && drag.ghost) drag.ghost.remove();
      root.innerHTML = ""; root.classList.remove("tx5", "ro"); root.removeAttribute("data-tx5");
    },
  };
}
