// Turkey Bowl, played by a script and photographed, so the whole game can be
// looked at without anybody playing it. Start the game first
// (npx vite --port 5199), then:
//
//   node scripts/turkeybowl-play.mjs <folder> [seconds] [answer]
//
// The script presses start, types a name, and then answers whatever is on
// the screen: it reads a line of talk, picks an answer (the first one, or
// the one numbered by [answer], or the best one when [answer] is "best"), calls a play, presses Continue. A picture
// is saved to the folder each time what is on the screen changes. Errors the
// page throws are printed at the end. Nothing is installed: this is Chrome's
// own remote control and Node's own WebSocket.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const out = process.argv[2] || path.join(os.tmpdir(), "turkeybowl-play");
const seconds = Number(process.argv[3] || 150), best = process.argv[4] === "best", answer = best ? 1 : Number(process.argv[4] || 1), url = process.env.TB_URL || "http://localhost:5199/turkeybowl.html" + (process.env.TB_JUMP ? "?admin" : "");
const size = process.env.TB_SIZE || "1280,720";
fs.mkdirSync(out, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "tb-chrome-"));
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9333", "--user-data-dir=" + profile, "--window-size=" + size, "--hide-scrollbars", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const errors = [];
try {
  let target = null;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch("http://localhost:9333/json")).json()).find(t => t.type === "page"); } catch { /* not up yet */ } }
  if (!target) throw new Error("Chrome did not start.");
  const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const waiting = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d.result || d); waiting.delete(d.id); } else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map(a => a.value || a.description).join(" ")); };
  const send = (method, params = {}) => new Promise(res => { const k = ++id; waiting.set(k, res); ws.send(JSON.stringify({ id: k, method, params })); });
  const run = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const key = async (k) => { await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k === " " ? "Space" : k, windowsVirtualKeyCode: k === "Enter" ? 13 : 32 }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k }); };
  let n = 0; const shot = async (label) => { const r = await send("Page.captureScreenshot", { format: "png" }); const f = String(++n).padStart(2, "0") + "-" + label.replace(/[^a-z0-9]+/gi, "-").slice(0, 40) + ".png"; fs.writeFileSync(path.join(out, f), Buffer.from(r.data, "base64")); console.log(f); };
  await send("Runtime.enable"); await send("Page.enable");
  await send("Page.navigate", { url }); await sleep(2500);
  // TB_JUMP=<words>: open the admin page and jump to the part whose button has those words, in place of the opening.
  if (process.env.TB_JUMP) { await shot("admin"); await run(`[...document.querySelectorAll('#ui .opt')].find(b => b.textContent.includes(${JSON.stringify(process.env.TB_JUMP)}))?.click()`); }
  else {
    await shot("press-start"); await run("document.querySelector('.go')?.click()"); await sleep(1200); await shot("title-sequence");
    // TB_WATCH=<seconds>: do not skip the opening; photograph it every second and a half for that long, then stop.
    if (process.env.TB_WATCH) { for (let i = 0; i < Number(process.env.TB_WATCH) / 1.5; i++) { await sleep(1500); await shot("opening"); } ws.close(); throw new Error("watched the opening"); }
    await key("Enter"); await sleep(2500); await key("Enter"); await sleep(6000);
    await run("(() => { const i = document.getElementById('coach'); if (i) i.value = 'Robot R'; })()"); await shot("title-card");
    await run("[...document.querySelectorAll('.go')].find(b => /Kick off|New game/.test(b.textContent))?.click()");
  }
  // What is on the screen, in one word and a few of its own.
  const SEE = `(() => { const q = (s) => document.querySelector('#ui ' + s); const b = document.getElementById('banner').textContent;
    if (q('.opt:not([disabled])')) return 'question|' + (q('.who')?.textContent || '');
    if (q('.call')) return 'call|' + (q('.scene')?.textContent || '').slice(0, 30);
    if (q('.card.talk')) return 'talk|' + (q('.who')?.textContent || '') + (q('.card.talk.done') ? '|done' : '');
    if (q('.go')) return 'card|' + (q('.who')?.textContent || q('.rank')?.textContent || '') + '|' + q('.go').textContent;
    return 'scene|' + b; })()`;
  const end = Date.now() + seconds * 1000; let last = "", quiet = 0, talks = 0;
  while (Date.now() < end) {
    await sleep(350);
    const see = await run(SEE) || "", [kind, what = "", extra = ""] = see.split("|");
    const fresh = see.replace("|done", "") !== last.replace("|done", "");
    if (kind === "scene") { quiet++; if (fresh || quiet % 9 === 0) await shot("scene-" + what); last = see; continue; }
    quiet = 0;
    if (kind === "talk") { if (fresh && talks++ % 3 === 0) { await sleep(500); await shot("talk-" + what); } last = see; await key("Enter"); continue; }
    if (fresh) await shot(kind + "-" + what);
    last = see;
    if (kind === "question") { await sleep(300); await run(`(async () => { const o = [...document.querySelectorAll('#ui .opt')], S = ${best} ? await import('/src/turkeybowl/script.js') : null, dec = S && S.decisionOf(document.querySelector('#ui .card').dataset.id);
      if (document.querySelector('#ui .go[disabled]')) { const want = S ? S.POWER.filter(p => p.w >= 1).map(p => p.k) : []; const two = o.filter(b => want.includes(b.dataset.k)).concat(o).slice(0, 2); two[0].click(); two[1].click(); document.querySelector('#ui .go').click(); }
      else ((dec && o.find(b => dec.opts.find(x => x.k === b.dataset.k)?.rank === 'best')) || o[${answer - 1}] || o[0]).click(); })()`); await sleep(900); await shot("locked"); await sleep(1300); await shot("reveal"); }
    else if (kind === "call") { await run("(() => { const run = /far back|spread/i.test(document.querySelector('#ui .scene').textContent); document.querySelector('#ui .call.' + (run ? 'run' : 'pass')).click(); })()"); await sleep(1500); await shot("play-early"); await sleep(1500); await shot("play-mid"); await sleep(1500); await shot("play-late"); }
    else if (kind === "card") { if (/Play again/.test(extra)) { await shot("the-end"); break; } await run("document.querySelector('#ui .go').click()"); }
  }
  ws.close();
} finally { chrome.kill(); }
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "No errors on the page.");
