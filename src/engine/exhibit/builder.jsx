// The final project builder: the form on the left, the finished page live on
// the right, the way the audio story builder works.
//
// Andrew, 2026-11-23: "I want to give them a website builder, but on our
// page, I want to keep it relatively simple." A student picks one of three
// ways to make the project (an exhibit, a film, their own HTML), and every
// way carries a headline, a summary and sources. His answers that shape this
// file:
//   - Pre-production is the first step here, not a sheet of its own: name
//     the pages and say what goes on each. That outline is graded Thursday,
//     December 3, and is already the exhibit's skeleton.
//   - Nothing is handed in. "The deadline takes whatever is there": the
//     builder saves as they type and locks Thursday, December 10, at 12 PM.
//   - Partners share one exhibit and either can edit. A save merges with the
//     partner's (model.js mergeDocs), so neither overwrites the other.
//   - A checklist per class ticks itself and never blocks anything.
//   - Undo brings back a deleted block or page.
//   - Laptop for building; a phone gets the form above the page.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Reader, { useExhibitFonts } from "./reader.jsx";
import { BLOCKS, blockName, newBlock, newPage, newSource, WAYS, TYPES, PALETTES, LAYOUTS, MAX_PAGES, SUMMARY_WORDS, FINAL_DUE, OUTLINE_DUE, words, wordCount, checklist, outlineDone, mergeDocs, videoOf, embedOf, safeUrl, exhibitHref } from "./model.js";
import { loadMine, saveDoc, upload, loadNotes, dropNote } from "./client.js";

const CSS = `
.xb{position:fixed;inset:0;z-index:60;display:grid;grid-template-columns:minmax(380px,460px) minmax(0,1fr);background:#101216;color:#eef0f3;font:15px/1.45 "Libre Franklin",system-ui,sans-serif;text-align:left}
.xb *{box-sizing:border-box}
.xb .side{display:flex;flex-direction:column;min-height:0;border-right:1px solid #2a2e36}
.xb .top{padding:14px 18px 0;flex:none}
.xb .top .row{display:flex;align-items:center;gap:10px;justify-content:space-between}
.xb .back{color:#aeb4bf;text-decoration:none;font-weight:600;font-size:13px}
.xb .back:hover{color:#fff}
.xb .saved{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7ee0a1}
.xb .saved.bad{color:#ff9d8a}
.xb .name{font:600 24px/1.1 "Newsreader",Georgia,serif;margin:10px 0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.xb .due{font-size:13px;color:#aeb4bf}
.xb .due b{color:#ffd166;font-weight:700}
.xb .steps{display:flex;gap:2px;margin-top:14px;overflow-x:auto;scrollbar-width:none}
.xb .steps button{font:700 13.5px "Libre Franklin",system-ui,sans-serif;color:#aeb4bf;background:none;border:0;border-bottom:3px solid transparent;padding:9px 10px 10px;cursor:pointer;white-space:nowrap}
.xb .steps button:hover{color:#fff}
.xb .steps button[aria-current="true"]{color:#fff;border-bottom-color:#ffd166}
.xb .steps .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#7ee0a1;margin-left:6px;vertical-align:1px}
.xb .pane{flex:1;min-height:0;overflow-y:auto;padding:18px 18px 90px;border-top:1px solid #2a2e36}
.xb h3{font:700 12px "Libre Franklin",system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#ffd166;margin:26px 0 10px}
.xb h3:first-child{margin-top:0}
.xb p.say{margin:0 0 12px;color:#c9ced6}
.xb label.f{display:block;margin-bottom:12px}
.xb label.f > span{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;font-weight:600;color:#aeb4bf;margin-bottom:5px}
.xb label.f > span em{font-style:normal;color:#7b828e}
.xb label.f > span em.over{color:#ff9d8a}
.xb input[type=text],.xb input[type=url],.xb textarea,.xb select{width:100%;font:15px/1.4 "Libre Franklin",system-ui,sans-serif;color:#fff;background:#1b1e24;border:1.5px solid #343944;border-radius:8px;padding:9px 11px}
.xb textarea{resize:vertical;min-height:74px}
.xb input:focus,.xb textarea:focus,.xb select:focus{outline:0;border-color:#ffd166}
.xb button:focus-visible,.xb a:focus-visible{outline:2px solid #ffd166;outline-offset:2px}
.xb .btn{font:700 13.5px "Libre Franklin",system-ui,sans-serif;color:#101216;background:#ffd166;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}
.xb .btn.ghost{background:#262a32;color:#eef0f3}
.xb .btn.ghost:hover{background:#343944}
.xb .btn.sm{padding:6px 10px;font-size:12.5px}
.xb .btn:disabled{opacity:.45;cursor:default}
.xb .rowb{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.xb .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.xb .tile{font:700 14px/1.2 "Libre Franklin",system-ui,sans-serif;color:#eef0f3;background:#1b1e24;border:1.5px solid #343944;border-radius:10px;padding:12px 10px;cursor:pointer;text-align:left}
.xb .tile small{display:block;font-weight:500;color:#aeb4bf;margin-top:4px;font-size:12px}
.xb .tile[aria-pressed="true"]{background:#ffd166;border-color:#ffd166;color:#101216}
.xb .tile[aria-pressed="true"] small{color:#3b3320}
.xb .tile .aa{display:block;font-size:30px;line-height:1;margin-bottom:8px}
.xb .sws{display:flex;gap:10px;margin-bottom:14px}
.xb .sw{width:52px;height:52px;border-radius:50%;border:3px solid #101216;outline:2px solid #343944;cursor:pointer;padding:0;position:relative;overflow:hidden}
.xb .sw i{position:absolute;right:0;top:0;bottom:0;width:38%}
.xb .sw[aria-pressed="true"]{outline:3px solid #ffd166}
.xb .item{background:#1b1e24;border:1.5px solid #2a2e36;border-radius:10px;margin-bottom:8px}
.xb .item.on{border-color:#ffd166}
.xb .item > .hd{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;cursor:pointer}
.xb .item > .hd b{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#ffd166;flex:none}
.xb .item > .hd span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#c9ced6}
.xb .item > .bd{padding:4px 12px 12px}
.xb .ic{flex:none;width:28px;height:28px;border-radius:6px;border:0;background:#262a32;color:#c9ced6;cursor:pointer;display:grid;place-items:center;font:700 14px system-ui}
.xb .ic:hover{background:#343944;color:#fff}
.xb .ic:disabled{opacity:.3;cursor:default}
.xb .ptabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.xb .ptabs button{font:700 13px "Libre Franklin",system-ui,sans-serif;color:#c9ced6;background:#1b1e24;border:1.5px solid #343944;border-radius:99px;padding:6px 12px;cursor:pointer}
.xb .ptabs button[aria-current="true"]{background:#eef0f3;color:#101216;border-color:#eef0f3}
.xb .add{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.xb .add button{font:600 12.5px/1.2 "Libre Franklin",system-ui,sans-serif;color:#eef0f3;background:#262a32;border:0;border-radius:8px;padding:10px 8px;cursor:pointer;text-align:left}
.xb .add button:hover{background:#ffd166;color:#101216}
.xb .grp{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7b828e;margin:12px 0 6px}
.xb .tb{display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap}
.xb .tb select{width:auto;padding:5px 8px;font-size:12.5px}
.xb .tip{font-size:12.5px;color:#7b828e;margin:6px 0 0}
.xb .thumb{width:100%;max-height:150px;object-fit:cover;border-radius:8px;display:block;margin-bottom:8px;background:#262a32}
.xb .drop{display:block;border:1.5px dashed #4a5060;border-radius:8px;padding:14px;text-align:center;color:#c9ced6;font-weight:600;cursor:pointer;margin-bottom:10px}
.xb .drop:hover{border-color:#ffd166;color:#fff}
.xb .drop input{display:none}
.xb .err{color:#ff9d8a;font-size:13px;margin:0 0 10px}
.xb .chk{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid #2a2e36}
.xb .chk .m{width:22px;height:22px;border-radius:50%;border:2px solid #4a5060}
.xb .chk.ok .m{background:#7ee0a1;border-color:#7ee0a1}
.xb .chk .c{font-variant-numeric:tabular-nums;color:#aeb4bf;font-weight:600}
.xb .chk.ok .c{color:#7ee0a1}
.xb .big{font:600 34px/1 "Newsreader",Georgia,serif}
.xb .link{display:flex;gap:8px;margin-bottom:10px}
.xb .link input{flex:1}
.xb .note{background:#1b1e24;border-radius:10px;padding:12px;margin-bottom:8px}
.xb .note b{color:#ffd166}
.xb .note small{color:#7b828e;display:block;margin-top:6px}
.xb .undo{position:absolute;left:18px;bottom:16px;z-index:2;display:flex;gap:10px;align-items:center;background:#eef0f3;color:#101216;border-radius:10px;padding:8px 8px 8px 14px;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,.4)}
.xb .view{min-width:0;min-height:0;overflow-y:auto;background:#fff;position:relative}
.xb .pick{cursor:pointer;position:relative}
.xb .pick.on{outline:3px solid #ffd166;outline-offset:6px;border-radius:4px}
.xb .pick:hover{outline:2px dashed #ffd166;outline-offset:6px;border-radius:4px}
.xb .ghostb{margin:20px auto 0;max-width:680px;border:2px dashed #c9ced6;border-radius:4px;padding:14px;color:#6b7280;font:600 14px "Libre Franklin",system-ui,sans-serif;text-align:center}
.xb .lock{background:#ffd166;color:#101216;font-weight:700;padding:10px 18px}
.xb .flip{display:none}
.xb .load{grid-column:1/-1;display:grid;place-items:center;font-weight:600;color:#aeb4bf}
.xb .saved{display:inline-flex;align-items:center;gap:7px}
.xb .saved::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}
.xb .saved.busy::before{animation:xb-pulse .9s ease-in-out infinite}
@keyframes xb-pulse{50%{opacity:.25;transform:scale(.7)}}
.xb .left{font-weight:700;color:#ffd166}
.xb .meterbar{height:4px;background:#2a2e36;border-radius:2px;overflow:hidden;margin-top:12px}
.xb .meterbar i{display:block;height:100%;background:#7ee0a1;transition:width .4s ease}
.xb .item > .hd .gl{flex:none;color:#ffd166;display:grid;place-items:center}
.xb .item > .hd .grab{flex:none;color:#5a6170;cursor:grab;display:grid;place-items:center;margin-left:-4px}
.xb .item.drag{opacity:.4}
.xb .item.over{box-shadow:0 -3px 0 #ffd166}
.xb .item{transition:border-color .15s ease, box-shadow .15s ease}
.xb .item.new{animation:xb-in .35s ease}
@keyframes xb-in{from{opacity:0;transform:translateY(8px)}}
.xb .ic svg{width:16px;height:16px}
.xb .picker{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.xb .picker button{display:grid;grid-template-columns:36px minmax(0,1fr);gap:2px 10px;align-items:center;text-align:left;background:#1b1e24;border:1.5px solid #2a2e36;border-radius:10px;padding:10px;cursor:pointer;color:#eef0f3;font:inherit;transition:transform .1s ease, border-color .1s ease, background .1s ease}
.xb .picker button:hover{border-color:#ffd166;background:#22262e;transform:translateY(-1px)}
.xb .picker button:active{transform:scale(.98)}
.xb .picker .g{grid-row:1/3;width:36px;height:36px;border-radius:9px;background:#2a2e36;color:#ffd166;display:grid;place-items:center}
.xb .picker b{font-size:14px;font-weight:700;line-height:1.2}
.xb .picker small{font-size:12px;color:#aeb4bf;line-height:1.25}
.xb .addhere{display:flex;align-items:center;gap:8px;width:100%;justify-content:center;font:700 13.5px "Libre Franklin",system-ui,sans-serif;color:#101216;background:#ffd166;border:0;border-radius:10px;padding:12px;cursor:pointer;margin-top:4px}
.xb .addhere:hover{filter:brightness(1.06)}
.xb .addhere.thin{background:none;color:#aeb4bf;border:1.5px dashed #4a5060;padding:8px;margin:0 0 8px}
.xb .addhere.thin:hover{color:#fff;border-color:#ffd166}
.xb .drop{display:flex;flex-direction:column;gap:4px;align-items:center;transition:border-color .12s ease, background .12s ease}
.xb .drop small{font-weight:500;color:#7b828e;font-size:12px}
.xb .drop.over{border-color:#ffd166;background:#22262e;color:#fff}
.xb .drop.busy{cursor:default;border-style:solid}
.xb .drop .meter{display:block;width:100%;height:6px;border-radius:3px;background:#2a2e36;overflow:hidden;margin-top:4px}
.xb .drop .meter i{display:block;height:100%;background:#ffd166;transition:width .15s linear}
.xb .chk{width:100%;background:none;border:0;border-bottom:1px solid #2a2e36;color:inherit;font:inherit;text-align:left;cursor:pointer}
.xb .chk:hover span:nth-child(2){text-decoration:underline}
.xb .chk .m{display:grid;place-items:center;color:#101216}
.xb .chk .m svg{width:14px;height:14px;opacity:0}
.xb .chk.ok .m svg{opacity:1}
.xb .toasts{position:absolute;left:18px;right:18px;bottom:16px;z-index:3;display:flex;flex-direction:column;gap:8px;align-items:flex-start;pointer-events:none}
.xb .toast{pointer-events:auto;display:flex;gap:10px;align-items:center;background:#eef0f3;color:#101216;border-radius:10px;padding:9px 14px;font-weight:700;box-shadow:0 8px 30px rgba(0,0,0,.45);animation:xb-in .25s ease}
.xb .toast .tk{width:20px;height:20px;border-radius:50%;background:#1c7a41;color:#fff;display:grid;place-items:center}
.xb .toast .tk svg{width:13px;height:13px}
.xb .toast.undo{padding:7px 7px 7px 14px}
.xb .viewbar{position:sticky;top:0;z-index:50;display:flex;gap:8px;align-items:center;justify-content:space-between;background:#101216;color:#eef0f3;padding:8px 14px;border-bottom:1px solid #2a2e36}
.xb .viewbar .seg{display:flex;background:#1b1e24;border-radius:9px;padding:3px}
.xb .viewbar .seg button{display:flex;gap:6px;align-items:center;font:700 12.5px "Libre Franklin",system-ui,sans-serif;color:#aeb4bf;background:none;border:0;border-radius:7px;padding:6px 10px;cursor:pointer}
.xb .viewbar .seg button[aria-pressed="true"]{background:#eef0f3;color:#101216}
.xb .viewbar .seg svg{width:16px;height:16px}
.xb .viewbar a{display:inline-flex;gap:6px;align-items:center;font:700 12.5px "Libre Franklin",system-ui,sans-serif;color:#eef0f3;text-decoration:none;background:#262a32;border-radius:8px;padding:7px 11px;margin-left:6px}
.xb .viewbar a:hover{background:#343944}
.xb .viewbar a svg{width:15px;height:15px}
.xb .view{background:#0a0b0d}
.xb .stage{margin:0 auto;transition:max-width .3s ease;background:#fff;min-height:100%}
.xb .stage.phone{max-width:402px;margin:18px auto 40px;border-radius:26px;overflow:hidden;box-shadow:0 0 0 8px #1b1e24, 0 20px 60px rgba(0,0,0,.6);min-height:0}
.xb .stage .xr .bar{top:45px}
.xb .pick{transition:outline-color .15s ease}
.xb .pick.flash{animation:xb-flash 1s ease}
@keyframes xb-flash{0%,60%{outline:3px solid #ffd166;outline-offset:6px;border-radius:4px}100%{outline:3px solid transparent;outline-offset:6px}}
.xb .hello{background:linear-gradient(135deg,#ffd166,#ff9f5a);color:#101216;border-radius:12px;padding:16px 16px 14px;margin-bottom:18px}
.xb .hello b{font:600 22px/1.1 "Newsreader",Georgia,serif;display:block;margin-bottom:6px}
.xb .hello a{display:inline-block;margin-top:10px;font-weight:700;color:#101216}
.xb .stepfoot{display:flex;justify-content:space-between;gap:10px;margin-top:26px;padding-top:16px;border-top:1px solid #2a2e36}
.xb .looks{display:grid;gap:8px;margin-bottom:14px}
.xb .lookt{display:block;width:100%;text-align:left;border:2px solid #2a2e36;border-radius:12px;padding:14px 16px 12px;cursor:pointer;background:#f6f3ec;color:#17181b;transition:transform .12s ease, border-color .12s ease}
.xb .lookt:hover{transform:translateY(-2px)}
.xb .lookt[aria-pressed="true"]{border-color:#ffd166;box-shadow:0 0 0 3px #ffd166}
.xb .lookt .h{display:block;font-size:30px;line-height:1;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xb .lookt .n{font:700 11.5px "Libre Franklin",system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;opacity:.6}
.xb .pals{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px}
.xb .palt{aspect-ratio:3/4;border-radius:10px;border:2px solid #2a2e36;cursor:pointer;padding:0;overflow:hidden;display:flex;flex-direction:column;transition:transform .12s ease}
.xb .palt:hover{transform:translateY(-3px)}
.xb .palt[aria-pressed="true"]{border-color:#ffd166;box-shadow:0 0 0 3px #ffd166}
.xb .palt .a{flex:1.3;display:flex;align-items:flex-end;padding:7px}
.xb .palt .a i{display:block;width:60%;height:5px;border-radius:2px}
.xb .palt .p{flex:1;padding:7px;display:flex;flex-direction:column;gap:4px}
.xb .palt .p i{display:block;height:3px;border-radius:2px;opacity:.55}
.xb .starts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px}
.xb .starts button{text-align:left;background:linear-gradient(135deg,#262a32,#1b1e24);border:1.5px solid #343944;border-radius:12px;padding:12px;cursor:pointer;color:#eef0f3;font:inherit;transition:transform .12s ease, border-color .12s ease}
.xb .starts button:hover{border-color:#ffd166;transform:translateY(-2px)}
.xb .starts b{display:block;font:600 19px/1.1 "Newsreader",Georgia,serif;margin-bottom:8px}
.xb .starts .mini{display:flex;flex-direction:column;gap:4px}
.xb .starts .mini i{display:block;height:7px;border-radius:2px;background:#4a5060}
.xb .starts .mini i.t{width:86%}.xb .starts .mini i.h{width:48%;height:10px;background:#eef0f3}.xb .starts .mini i.p{height:26px;background:#ffd166;opacity:.85}.xb .starts .mini i.q{height:16px;background:#ff9f5a}.xb .starts .mini i.n{width:30%;height:18px;background:#7ee0a1}.xb .starts .mini i.a{width:70%;height:12px;border-radius:6px;background:#8ab4ff}
.xb .confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:4}
.xb .confetti i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:xb-fall linear forwards}
@keyframes xb-fall{to{transform:translateY(110vh) rotate(720deg);opacity:.9}}
@media (prefers-reduced-motion:reduce){ .xb *{animation:none!important;transition:none!important} .xb .confetti{display:none} }
@media (max-width:980px){
  .xb{grid-template-columns:minmax(0,1fr)}
  .xb .flip{display:inline-block}
  .xb.show-view .side{display:none}
  .xb:not(.show-view) .view{display:none}
  .xb .flipback{position:fixed;right:14px;bottom:14px;z-index:70}
}
`;

const now = () => Date.now();
const PAL_HEX = { orange: ["#d9541e", "#17324d", "#faf6ee", "#1d1a16"], green: ["#1c7a41", "#dbe64a", "#f5f8f1", "#12231a"], blue: ["#1560c8", "#ff5d62", "#f4f8fc", "#0e2033"], red: ["#b01f2d", "#f3b62f", "#fcf6f3", "#2a1114"], violet: ["#5a3ed2", "#17b89f", "#f7f5fc", "#1e1534"] };
const TYPE_FACE = { news: { fontFamily: "Newsreader, Georgia, serif", fontWeight: 600 }, museum: { fontFamily: "Archivo, sans-serif", fontWeight: 850, fontStretch: "72%", textTransform: "uppercase" }, magazine: { fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 } };
const dateSay = (iso) => new Date(iso).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });

function F({ label, value, onChange, area, rows = 3, hint, over, type = "text", placeholder }) {
  return <label className="f"><span>{label}{hint != null && <em className={over ? "over" : ""}>{hint}</em>}</span>
    {area ? <textarea rows={rows} value={value || ""} placeholder={placeholder} onChange={e => onChange(e.target.value)} /> : <input type={type} value={value || ""} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}
  </label>;
}

// What each block is for, one line, on the picker.
const SAY = {
  text: "Paragraphs, with bold, italic and source links", heading: "A title for a part of the page", quote: "One line, set very large", concept: "A concept, its definition and its source", number: "One statistic, set very large",
  photo: "An image or a graphic you made", gallery: "Several photos a reader flips through", slider: "Two images under one handle",
  audio: "A clip that plays on the page", video: "YouTube, Vimeo or Google Drive", embed: "TikTok, Instagram, Datawrapper or Canva",
  timeline: "Moments down a line", quiz: "A question the reader answers", map: "Places on a real map", link: "A link out, as a card",
};
const P = (d) => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const GLYPH = {
  text: P("M3 5h14M3 9h14M3 13h9"), heading: P("M4 4v12M12 4v12M4 10h8M15 8l2-1v9"), quote: P("M4 12c0-4 1-6 4-7M11 12c0-4 1-6 4-7M4 12h3v3H4zM11 12h3v3h-3z"), concept: P("M10 3a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9zM8 17h4"), number: P("M6 16l5-12M11 16l5-12M4 8h13M3 12h13"),
  photo: P("M3 5h14v10H3zM3 13l4-4 3 3 3-2 4 3M13 8h.01"), gallery: P("M5 6h12v9H5zM3 4h12M5 13l3-3 3 2 2-1 4 3"), slider: P("M3 5h14v10H3zM10 3v14M7 9l-2 1.5L7 12M13 9l2 1.5L13 12"),
  audio: P("M4 8v4M7 5v10M10 7v6M13 4v12M16 8v4"), video: P("M3 5h14v10H3zM8.5 8v4l4-2z"), embed: P("M7 6l-4 4 4 4M13 6l4 4-4 4M11 4l-2 12"),
  timeline: P("M6 3v14M6 6h.01M6 10h.01M6 14h.01M9 6h8M9 10h6M9 14h8"), quiz: P("M7.5 7.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M10 14.5h.01M3 4h14v12H3z"), map: P("M10 17s5-4.5 5-8.5a5 5 0 0 0-10 0C5 12.500 10 17 10 17zM10 8.500h.01"), link: P("M8 12l4-4M7 9l-2 2a2.800 2.800 0 0 0 4 4l2-2M13 11l2-2a2.800 2.800 0 0 0-4-4L9 7"),
  grip: P("M7 5h.01M7 10h.01M7 15h.01M13 5h.01M13 10h.01M13 15h.01"), up: P("M10 15V5M5.500 9.500L10 5l4.500 4.500"), down: P("M10 5v10M5.500 10.500L10 15l4.500-4.500"), x: P("M5 5l10 10M15 5L5 15"), plus: P("M10 4v12M4 10h12"), check: P("M4 10.500l4 4 8-9"),
  desk: P("M3 4h14v9H3zM7 16h6M10 13v3"), phone: P("M6.500 2.500h7v15h-7zM9.500 15h1"), out: P("M8 12l7-7M10 5h5v5M13 12v4H4V7h4"),
};

const Toast = createContext(() => {});

function Upload({ classId, as, accept, say, onDone, what = "File" }) {
  const toast = useContext(Toast);
  const [pct, setPct] = useState(null), [err, setErr] = useState(""), [over, setOver] = useState(false);
  const send = async (file) => {
    if (!file) return;
    setErr(""); setPct(0);
    try { const out = await upload(classId, file, { as, onProgress: p => setPct(Math.round(p * 100)) }); setPct(null); onDone(out); toast(what + " added"); }
    catch (e) { setPct(null); setErr(e.message || "The file did not go up."); }
  };
  return <>
    <label className={"drop" + (over ? " over" : "") + (pct != null ? " busy" : "")}
      onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); send(e.dataTransfer.files?.[0]); }}>
      {pct != null ? <><span>Sending, {pct}%</span><span className="meter"><i style={{ width: pct + "%" }} /></span></> : <><span>{say}</span><small>or drop the file here</small></>}
      <input type="file" accept={accept} disabled={pct != null} onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; send(f); }} />
    </label>
    {err && <p className="err">{err}</p>}
  </>;
}
const IMG = "image/*,.heic,.heif";
const AUD = "audio/*,.m4a,.mp3,.wav,.aac";

function ImageFields({ classId, as, url, alt, credit, cap, set, keys = ["url", "alt", "credit", "cap"], noCap }) {
  const [ku, ka, kc, kp] = keys;
  return <>
    {safeUrl(url) && <img className="thumb" src={url} alt="" />}
    <Upload classId={classId} as={as} accept={IMG} what="Image" say={url ? "Replace the image" : "Choose an image"} onDone={o => set({ [ku]: o.url })} />
    <F label="Describe the image for a reader who cannot see the image" value={alt} onChange={v => set({ [ka]: v })} />
    <F label="Credit" value={credit} onChange={v => set({ [kc]: v })} placeholder="Photo: Name, where the image is from" />
    {!noCap && <F label="Caption" value={cap} onChange={v => set({ [kp]: v })} />}
  </>;
}

function TextEditor({ b, set, sources, onNewSource }) {
  const ref = useRef(null);
  const wrap = (before, after) => {
    const el = ref.current; if (!el) return;
    const a = el.selectionStart, z = el.selectionEnd, t = b.text || "";
    const mid = t.slice(a, z) || "words";
    set({ text: t.slice(0, a) + before + mid + after + t.slice(z) });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + mid.length); });
  };
  const keys = (e) => { if (!(e.metaKey || e.ctrlKey)) return; const k = e.key.toLowerCase(); if (k === "b") { e.preventDefault(); wrap("**", "**"); } if (k === "i") { e.preventDefault(); wrap("_", "_"); } };
  const pick = (v) => { if (v === "+") onNewSource(); else if (v) wrap("[[" + v + "|", "]]"); };
  return <>
    <div className="tb">
      <button type="button" className="btn ghost sm" title="Command B" onClick={() => wrap("**", "**")}><b>Bold</b></button>
      <button type="button" className="btn ghost sm" title="Command I" onClick={() => wrap("_", "_")}><i>Italic</i></button>
      <select value="" aria-label="Link the selected words to a source" onChange={e => pick(e.target.value)}>
        <option value="">Link words to a source</option>
        {sources.filter(s => s.title || s.author).map(s => <option key={s.id} value={s.id}>{(s.author || s.title).slice(0, 40)}{s.year ? " " + s.year : ""}</option>)}
        <option value="+">Add a new source</option>
      </select>
    </div>
    <textarea ref={ref} rows={8} value={b.text || ""} onKeyDown={keys} onChange={e => set({ text: e.target.value })} />
    <p className="tip">Select words, then press Bold, Italic or pick a source. Leave a blank line between paragraphs.</p>
  </>;
}

function MapEditor({ b, set }) {
  const [q, setQ] = useState(""), [hits, setHits] = useState(null), [busy, setBusy] = useState(false);
  const find = async () => {
    if (!q.trim()) return; setBusy(true);
    try { const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=5&q=" + encodeURIComponent(q)); setHits(r.ok ? await r.json() : []); } catch { setHits([]); }
    setBusy(false);
  };
  const pins = b.pins || [];
  const pin = (i, patch) => set({ pins: pins.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  return <>
    <div className="link"><input type="text" value={q} placeholder="Search for a place" onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") find(); }} /><button type="button" className="btn ghost" onClick={find} disabled={busy}>Find</button></div>
    {hits && hits.length === 0 && <p className="err">No place by those words. Try a city or an address.</p>}
    {hits && hits.map(h => <button type="button" key={h.place_id} className="btn ghost sm" style={{ display: "block", marginBottom: 6, textAlign: "left" }} onClick={() => { set({ pins: [...pins, { lat: +h.lat, lng: +h.lon, name: String(h.display_name || "").split(",").slice(0, 2).join(","), note: "" }] }); setHits(null); setQ(""); }}>{h.display_name}</button>)}
    {pins.map((p, i) => <div className="item" key={i}><div className="bd" style={{ paddingTop: 12 }}>
      <F label="Name of the place" value={p.name} onChange={v => pin(i, { name: v })} />
      <F label="Note" value={p.note} onChange={v => pin(i, { note: v })} />
      <button type="button" className="btn ghost sm" onClick={() => set({ pins: pins.filter((_, k) => k !== i) })}>Remove the pin</button>
    </div></div>)}
    <F label="Caption" value={b.cap} onChange={v => set({ cap: v })} />
  </>;
}

function BlockEditor({ b, set, sources, classId, as, onNewSource }) {
  const SourcePick = ({ k = "source" }) => <label className="f"><span>Source</span><select value={b[k] || ""} onChange={e => set({ [k]: e.target.value })}><option value="">None</option>{sources.filter(s => s.title || s.author).map(s => <option key={s.id} value={s.id}>{(s.author || s.title).slice(0, 50)}</option>)}</select></label>;
  if (b.t === "text") return <TextEditor b={b} set={set} sources={sources} onNewSource={onNewSource} />;
  if (b.t === "heading") return <F label="Heading" value={b.text} onChange={v => set({ text: v })} />;
  if (b.t === "quote") return <><F label="The quote" area value={b.text} onChange={v => set({ text: v })} /><F label="Who said the quote" value={b.who} onChange={v => set({ who: v })} /></>;
  if (b.t === "concept") return <><F label="Concept" value={b.name} onChange={v => set({ name: v })} /><F label="Definition" area value={b.def} onChange={v => set({ def: v })} /><SourcePick /></>;
  if (b.t === "number") return <><F label="The number" value={b.n} onChange={v => set({ n: v })} /><F label="What the number counts" value={b.w} onChange={v => set({ w: v })} /><SourcePick /></>;
  if (b.t === "photo") return <>
    <label className="f"><span>Size</span><select value={b.size} onChange={e => set({ size: e.target.value })}><option value="col">Column width</option><option value="full">Full width</option><option value="pair">Two side by side</option><option value="wrap">Beside the text below</option></select></label>
    <ImageFields classId={classId} as={as} url={b.url} alt={b.alt} credit={b.credit} cap={b.cap} set={set} />
    <label className="f" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={!!b.mine} onChange={e => set({ mine: e.target.checked, credit: e.target.checked && !b.credit ? "Photo by the makers" : b.credit })} /> I made this image</label>
    {b.size === "pair" && <><h3>The second image</h3><ImageFields classId={classId} as={as} url={b.url2} alt={b.alt2} credit={b.credit2} cap={b.cap2} set={set} keys={["url2", "alt2", "credit2", "cap2"]} /></>}
  </>;
  if (b.t === "gallery") { const items = b.items || []; const it = (i, patch) => set({ items: items.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
    return <>{items.map((x, i) => <div className="item" key={i}><div className="bd" style={{ paddingTop: 12 }}><ImageFields classId={classId} as={as} url={x.url} alt={x.alt} credit={x.credit} cap={x.cap} set={p => it(i, p)} /><button type="button" className="btn ghost sm" onClick={() => set({ items: items.filter((_, k) => k !== i) })}>Remove this photo</button></div></div>)}
      <button type="button" className="btn ghost" onClick={() => set({ items: [...items, { url: "", alt: "", credit: "", cap: "" }] })}>Add a photo</button></>; }
  if (b.t === "slider") return <>
    <h3>The first image</h3><F label="Label" value={b.labelA} onChange={v => set({ labelA: v })} /><ImageFields classId={classId} as={as} url={b.a} alt={b.aAlt} set={set} keys={["a", "aAlt", "credit", "cap"]} credit={b.credit} noCap />
    <h3>The second image</h3><F label="Label" value={b.labelB} onChange={v => set({ labelB: v })} /><ImageFields classId={classId} as={as} url={b.b} alt={b.bAlt} set={set} keys={["b", "bAlt", "credit", "cap"]} credit={b.credit} cap={b.cap} />
  </>;
  if (b.t === "audio") return <>
    {safeUrl(b.url) && <audio controls src={b.url} style={{ width: "100%", marginBottom: 8 }} />}
    <Upload classId={classId} as={as} accept={AUD} what="Audio clip" say={b.url ? "Replace the audio file" : "Choose an audio file: m4a, mp3, wav or aac"} onDone={o => set({ url: o.url })} />
    <F label="Title" value={b.title} onChange={v => set({ title: v })} /><F label="Transcript" area rows={5} value={b.transcript} onChange={v => set({ transcript: v })} />
  </>;
  if (b.t === "video") return <><F label="Link to the video" type="url" value={b.url} onChange={v => set({ url: v })} placeholder="YouTube, Vimeo or Google Drive" />{b.url && !videoOf(b.url) && <p className="err">This link is not a YouTube, Vimeo or Google Drive video.</p>}<F label="Caption" value={b.title} onChange={v => set({ title: v })} /></>;
  if (b.t === "embed") return <><F label="Link to the post or chart" type="url" value={b.url} onChange={v => set({ url: v })} placeholder="TikTok, Instagram, Datawrapper or Canva" />{b.url && !embedOf(b.url) && <p className="err">This link is not a TikTok or Instagram post, or a Datawrapper or Canva chart.</p>}<F label="Caption" value={b.title} onChange={v => set({ title: v })} /></>;
  if (b.t === "link") return <><F label="Link" type="url" value={b.url} onChange={v => set({ url: v })} placeholder="https://" /><F label="Title" value={b.title} onChange={v => set({ title: v })} /><F label="A line under the title" value={b.sub} onChange={v => set({ sub: v })} /></>;
  if (b.t === "timeline") { const rows = b.rows || []; const row = (i, patch) => set({ rows: rows.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
    return <>{rows.map((r, i) => <div className="item" key={i}><div className="bd" style={{ paddingTop: 12 }}><F label="When" value={r.when} onChange={v => row(i, { when: v })} /><F label="What happened" value={r.title} onChange={v => row(i, { title: v })} /><F label="A few words more" value={r.text} onChange={v => row(i, { text: v })} /><button type="button" className="btn ghost sm" onClick={() => set({ rows: rows.filter((_, k) => k !== i) })}>Remove this moment</button></div></div>)}
      <button type="button" className="btn ghost" onClick={() => set({ rows: [...rows, { when: "", title: "", text: "" }] })}>Add a moment</button></>; }
  if (b.t === "quiz") { const os = b.options || [];
    return <><F label="The question" value={b.q} onChange={v => set({ q: v })} />
      {os.map((o, i) => <label className="f" key={i}><span>Answer {i + 1}<em><input type="radio" name={"right-" + b.id} checked={b.right === i} onChange={() => set({ right: i })} /> the right answer</em></span><input type="text" value={o} onChange={e => set({ options: os.map((x, k) => (k === i ? e.target.value : x)) })} /></label>)}
      <div className="rowb" style={{ marginBottom: 12 }}>{os.length < 5 && <button type="button" className="btn ghost sm" onClick={() => set({ options: [...os, ""] })}>Add an answer</button>}{os.length > 2 && <button type="button" className="btn ghost sm" onClick={() => set({ options: os.slice(0, -1), right: Math.min(b.right, os.length - 2) })}>Remove the last answer</button>}</div>
      <F label="What the reader sees after answering" area value={b.ans} onChange={v => set({ ans: v })} /></>; }
  if (b.t === "map") return <MapEditor b={b} set={set} />;
  return null;
}
const gist = (b) => String(b.text || b.name || b.title || b.q || b.w || b.cap || b.url || (b.rows || [])[0]?.title || "").replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, "$1").replace(/\*\*|_/g, "").slice(0, 80);

// Where a checklist line is fixed.
const FIX = { headline: "outline", summary: "outline", film: "outline", captions: "outline", html: "outline", sources: "sources", academic: "sources", popular: "sources", ai: "check", interview: "check" };
const daysLeft = (iso) => { const d = Math.ceil((Date.parse(iso) - Date.now()) / 86400000); return d > 1 ? d + " days left" : d === 1 ? "1 day left" : d === 0 ? "Due today" : ""; };

// A page to start from: a few empty blocks in an order that reads well. The student fills or removes each one.
const STARTS = [
  { name: "An opening", blocks: ["text", "photo", "number", "text"] },
  { name: "A case study", blocks: ["heading", "photo", "text", "quote", "text"] },
  { name: "By the numbers", blocks: ["number", "text", "timeline", "text"] },
  { name: "Listen and look", blocks: ["audio", "text", "gallery", "quote"] },
];
const MINI = { text: "t", heading: "h", photo: "p", gallery: "p", quote: "q", number: "n", timeline: "t", audio: "a" };
const BITS = ["#ffd166", "#ff9f5a", "#7ee0a1", "#8ab4ff", "#ff7b93", "#eef0f3"];
function Confetti({ run }) {
  if (!run) return null;
  return <div className="confetti" key={run} aria-hidden="true">{Array.from({ length: 46 }, (_, i) => <i key={i} style={{ left: ((i * 37) % 100) + "%", background: BITS[i % BITS.length], animationDuration: 1.6 + ((i * 13) % 10) / 6 + "s", animationDelay: ((i * 7) % 10) / 22 + "s", transform: `rotate(${(i * 47) % 360}deg)` }} />)}</div>;
}

function Picker({ classId, onPick, onClose }) {
  return <>{onClose && <button type="button" className="addhere thin" onClick={onClose}>{GLYPH.x} Close, back to your blocks</button>}{[...new Set(BLOCKS.map(b => b.group))].map(g => <div key={g}><div className="grp">{g}</div><div className="picker">
    {BLOCKS.filter(b => b.group === g && (b.t !== "concept" || classId !== "comm3")).map(b => <button type="button" key={b.t} onClick={() => onPick(b.t)}><span className="g">{GLYPH[b.t]}</span><b>{b.name}</b><small>{SAY[b.t]}</small></button>)}
  </div></div>)}</>;
}

function Builder({ classId, viewer, as }) {
  useExhibitFonts();
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState("");
  const [locked, setLocked] = useState(false);
  const [saved, setSaved] = useState("Saved");
  const [step, setStep] = useState("outline");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState("");
  const [fresh, setFresh] = useState("");
  const [adding, setAdding] = useState(null);     // where a new block will go: an index, or null when the picker is shut
  const [toasts, setToasts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [showView, setShowView] = useState(false);
  const [phone, setPhone] = useState(false);
  const [drag, setDrag] = useState(null), [over, setOver] = useState(null);
  const [party, setParty] = useState(0);
  const was = useRef(null);
  const docRef = useRef(null), dirty = useRef(false), timer = useRef(null), busy = useRef(false), view = useRef(null), pane = useRef(null);
  docRef.current = doc;

  const toast = useCallback((say, back) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t.filter(x => !x.back || back).slice(-2), { id, say, back }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), back ? 9000 : 2200);
  }, []);

  useEffect(() => {
    let on = true;
    loadMine(classId, as).then(out => { if (!on) return; setDoc(out.doc); setLocked(out.locked); setStep(outlineDone(out.doc) && out.doc.way === "exhibit" ? "build" : "outline"); })
      .catch(e => on && setErr(e.message));
    return () => { on = false; };
  }, [classId, as]);
  useEffect(() => { if (doc?.id) loadNotes(classId, doc.id).then(o => setNotes(o.notes)).catch(() => {}); }, [classId, doc?.id]);

  const flush = useCallback(async () => {
    if (busy.current || !dirty.current || !docRef.current) return;
    busy.current = true; dirty.current = false; setSaved("Saving");
    try {
      const out = await saveDoc(classId, docRef.current, as);
      setDoc(d => { const base = out.doc ? mergeDocs(out.doc, d) : d; return { ...base, rev: out.rev }; });
      if (out.doc) toast("Your partner's changes came in");
      setSaved(dirty.current ? "Saving" : "Saved");
    } catch (e) { if (e.locked) setLocked(true); else dirty.current = true; setSaved(e.locked ? "Closed" : "Not saved"); }
    busy.current = false;
    if (dirty.current) timer.current = setTimeout(flush, 2500);
  }, [classId, as, toast]);
  const change = useCallback((fn) => {
    if (locked) return;
    setDoc(d => fn(d));
    dirty.current = true; setSaved("Saving");
    clearTimeout(timer.current); timer.current = setTimeout(flush, 900);
  }, [flush, locked]);
  useEffect(() => {
    const bye = () => { if (dirty.current) flush(); };
    const warn = (e) => { if (dirty.current || busy.current) { flush(); e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("pagehide", bye); window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("pagehide", bye); window.removeEventListener("beforeunload", warn); clearTimeout(timer.current); };
  }, [flush]);
  // A partner's work comes in while this side is idle.
  useEffect(() => {
    if (!doc || (doc.makers || []).length < 2 || locked) return;
    const t = setInterval(() => { if (document.hidden || dirty.current || busy.current) return; loadMine(classId, as).then(out => { if (!dirty.current && out.doc.rev !== docRef.current?.rev) { setDoc(d => ({ ...mergeDocs(out.doc, d), rev: out.doc.rev })); toast("Your partner's changes came in"); } setLocked(out.locked); }).catch(() => {}); }, 20000);
    return () => clearInterval(t);
  }, [classId, as, doc?.id, locked]);   // eslint-disable-line react-hooks/exhaustive-deps

  // The picked block comes into view on both sides, and its first box takes the cursor.
  useEffect(() => {
    if (!sel) return;
    const t = setTimeout(() => {
      const card = pane.current?.querySelector(".item.on");
      if (card) { card.scrollIntoView({ block: "nearest", behavior: "smooth" }); if (sel === fresh) { const box = card.querySelector(".bd input[type=text], .bd input[type=url], .bd textarea"); if (box) box.focus({ preventScroll: true }); } }
      const shown = view.current?.querySelector(`[data-b="${sel}"]`);
      if (shown) { const r = shown.getBoundingClientRect(), v = view.current.getBoundingClientRect(); if (r.top < v.top + 60 || r.bottom > v.bottom) view.current.scrollTo({ top: view.current.scrollTop + r.top - v.top - 120, behavior: "smooth" }); shown.classList.remove("flash"); void shown.offsetWidth; shown.classList.add("flash"); }
    }, 60);
    return () => clearTimeout(t);
  }, [sel, fresh, step]);

  const top = (patch) => change(d => { const t = now(), at = { ...(d.at || {}) }; Object.keys(patch).forEach(k => { at[k] = t; }); return { ...d, ...patch, at }; });
  const pagePatch = (id, patch, order) => change(d => ({ ...d, ...(order ? { pagesAt: now() } : {}), pages: d.pages.map(p => (p.id === id ? { ...p, ...patch, at: now() } : p)) }));
  const blockPatch = (pid, bid, patch) => change(d => ({ ...d, pages: d.pages.map(p => (p.id === pid ? { ...p, blocks: p.blocks.map(b => (b.id === bid ? { ...b, ...patch, at: now() } : b)) } : p)) }));
  const srcPatch = (id, patch) => change(d => ({ ...d, sources: d.sources.map(s => (s.id === id ? { ...s, ...patch, at: now() } : s)) }));

  if (err) return <div className="xb"><style>{CSS}</style><div className="load">{err}</div></div>;
  if (!doc) return <div className="xb"><style>{CSS}</style><div className="load">Opening your project</div></div>;

  const pages = doc.pages || [], cur = pages[Math.min(page, pages.length - 1)] || null;
  const list = checklist(doc, classId);
  const done = list.filter(l => l.ok).length;
  const sources = doc.sources || [];
  const exhibit = doc.way === "exhibit";
  // Finishing the outline, or the whole checklist, gets a moment.
  const nowState = { outline: outlineDone(doc), all: list.length > 0 && done === list.length };
  if (was.current && !locked) {
    if (nowState.outline && !was.current.outline) setTimeout(() => { setParty(Date.now()); toast("Your outline is done"); }, 0);
    else if (nowState.all && !was.current.all) setTimeout(() => { setParty(Date.now()); toast("Everything on the checklist is done"); }, 0);
  }
  was.current = nowState;
  const blank = !doc.headline && !doc.summary && pages.every(p => !p.blocks.length && !p.plan);

  const addBlock = (t, at) => {
    if (!cur) return;
    const b = newBlock(t), i = at == null ? cur.blocks.length : at;
    change(d => ({ ...d, pages: d.pages.map(p => (p.id === cur.id ? { ...p, orderAt: now(), blocks: [...p.blocks.slice(0, i), b, ...p.blocks.slice(i)] } : p)) }));
    setAdding(null); setFresh(b.id); setSel(b.id); toast(blockName(t) + " added");
  };
  const startPage = (st) => {
    if (!cur) return;
    const made = st.blocks.map((t, k) => ({ ...newBlock(t), ...(t === "photo" && st.name === "A case study" ? { size: "wrap" } : t === "photo" ? { size: "full" } : {}), at: now() + k }));
    change(d => ({ ...d, pages: d.pages.map(p => (p.id === cur.id ? { ...p, orderAt: now(), blocks: [...p.blocks, ...made] } : p)) }));
    setFresh(made[0].id); setSel(made[0].id); toast(st.name + " laid out");
  };
  const reorder = (from, to) => { if (from === to || from == null || to == null) return; const bs = [...cur.blocks]; const [m] = bs.splice(from, 1); bs.splice(to > from ? to - 1 : to, 0, m); pagePatch(cur.id, { blocks: bs, orderAt: now() }); };
  const moveBlock = (i, d) => { const bs = [...cur.blocks]; const j = i + d; if (j < 0 || j >= bs.length) return; [bs[i], bs[j]] = [bs[j], bs[i]]; pagePatch(cur.id, { blocks: bs, orderAt: now() }); };
  const dropBlock = (i) => { const b = cur.blocks[i], pid = cur.id; change(d => ({ ...d, gone: { ...(d.gone || {}), [b.id]: now() }, pages: d.pages.map(p => (p.id === pid ? { ...p, orderAt: now(), blocks: p.blocks.filter(x => x.id !== b.id) } : p)) })); toast(blockName(b.t) + " removed", () => change(d => ({ ...d, pages: d.pages.map(p => (p.id === pid ? { ...p, orderAt: now() + 1, blocks: [...p.blocks.slice(0, i), { ...b, at: now() + 1 }, ...p.blocks.slice(i)] } : p)) }))); };
  const addPage = () => { if (pages.length >= MAX_PAGES) return; const p = newPage(""); change(d => ({ ...d, pagesAt: now(), pages: [...d.pages, p] })); setPage(pages.length); toast("Page added"); };
  const movePage = (i, d) => { const ps = [...pages]; const j = i + d; if (j < 0 || j >= ps.length) return; [ps[i], ps[j]] = [ps[j], ps[i]]; change(x => ({ ...x, pagesAt: now(), pages: ps })); };
  const dropPage = (i) => { const p = pages[i]; change(d => ({ ...d, pagesAt: now(), gone: { ...(d.gone || {}), [p.id]: now() }, pages: d.pages.filter(x => x.id !== p.id) })); setPage(0); toast((p.name || "Page") + " removed", () => change(d => ({ ...d, pagesAt: now() + 1, pages: [...d.pages.slice(0, i), { ...p, at: now() + 1 }, ...d.pages.slice(i)] }))); };
  const addSource = () => { const s = newSource(); change(d => ({ ...d, sourcesAt: now(), sources: [...d.sources, s] })); setFresh(s.id); setSel(s.id); toast("Source added"); };
  const dropSource = (s, i) => { change(d => ({ ...d, sourcesAt: now(), gone: { ...(d.gone || {}), [s.id]: now() }, sources: d.sources.filter(x => x.id !== s.id) })); toast("Source removed", () => change(d => ({ ...d, sourcesAt: now() + 1, sources: [...d.sources.slice(0, i), { ...s, at: now() + 1 }, ...d.sources.slice(i)] }))); };

  const STEPS = [["outline", "Outline"], ...(exhibit ? [["build", "Build"]] : []), ["sources", "Sources"], ["look", "Look"], ["check", "Checklist"], ["share", "Share"]];
  const at = STEPS.findIndex(s => s[0] === step);
  const goStep = (id) => { setStep(id); setAdding(null); if (pane.current) pane.current.scrollTo({ top: 0 }); };
  const previewUrl = `${window.location.origin}${exhibitHref(doc)}?preview=${doc.preview}`;
  const around = (b, node) => <div data-b={b.id} className={"pick" + (sel === b.id ? " on" : "")} onClick={() => { setFresh(""); setSel(b.id); setStep("build"); setShowView(false); }}>{node || <div className="ghostb">{blockName(b.t)}, beside the text below</div>}</div>;
  const fix = (l) => goStep(FIX[l.id] || (exhibit ? "build" : "outline"));

  return <Toast.Provider value={toast}><div className={"xb" + (showView ? " show-view" : "")}>
    <style>{CSS}</style>
    <div className="side" style={{ position: "relative" }}>
      {locked && <div className="lock">The final project closed on {dateSay(FINAL_DUE)}. Here is what you turned in.</div>}
      <div className="top">
        <div className="row"><a className="back" href={`/${classId}`}>Back to class</a><span className={"saved" + (saved === "Not saved" ? " bad" : "") + (saved === "Saving" ? " busy" : "")} role="status">{saved}</span></div>
        <div className="name">{doc.headline || "Final project"}</div>
        <div className="due">{(doc.names || []).join(" and ")} · Locks {dateSay(FINAL_DUE)} {daysLeft(FINAL_DUE) && <span className="left">· {daysLeft(FINAL_DUE)}</span>}</div>
        <div className="meterbar" role="img" aria-label={`${done} of ${list.length} on the checklist`}><i style={{ width: (list.length ? (done / list.length) * 100 : 0) + "%" }} /></div>
        <div className="steps">{STEPS.map(([id, name]) => <button type="button" key={id} aria-current={step === id} onClick={() => goStep(id)}>{name}{id === "outline" && outlineDone(doc) && <span className="dot" />}{id === "check" && done === list.length && <span className="dot" />}</button>)}
          <button type="button" className="flip" onClick={() => setShowView(true)}>See the page</button></div>
      </div>
      <div className="pane" ref={pane}>
        {step === "outline" && <>
          {blank && <div className="hello"><b>Start with the outline.</b>Pick how you are making your project, give the project a headline and a summary, then name your pages. The outline is due {dateSay(OUTLINE_DUE)}.<br /><a href={`/${classId}/exhibits/sample`} target="_blank" rel="noopener">See a finished sample</a></div>}
          <h3>How you are making your project</h3>
          <div className="tiles">{WAYS.map(w => <button type="button" className="tile" key={w.id} aria-pressed={doc.way === w.id} onClick={() => { top({ way: w.id }); toast(w.name + " chosen"); }}>{w.name}<small>{w.id === "exhibit" ? "Built here, page by page" : w.id === "film" ? "One video, linked" : "A file you made"}</small></button>)}</div>
          <F label="Headline" value={doc.headline} onChange={v => top({ headline: v })} />
          <F label="Summary" area value={doc.summary} onChange={v => top({ summary: v })} hint={`${words(doc.summary)} of ${SUMMARY_WORDS} words`} over={words(doc.summary) > SUMMARY_WORDS} />
          <h3>Cover image</h3>
          <ImageFields classId={classId} as={as} url={doc.cover?.url} alt={doc.cover?.alt} credit={doc.cover?.credit} noCap set={p => top({ cover: { ...(doc.cover || {}), ...p } })} />
          {doc.way === "film" && <>
            <h3>Your film</h3>
            <F label="Link to the film" type="url" value={doc.film?.url} onChange={v => top({ film: { ...(doc.film || {}), url: v } })} placeholder="YouTube, Vimeo or Google Drive" />
            {doc.film?.url && !videoOf(doc.film.url) && <p className="err">This link is not a YouTube, Vimeo or Google Drive video.</p>}
            <label className="f" style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" checked={!!doc.film?.captions} onChange={e => top({ film: { ...(doc.film || {}), captions: e.target.checked } })} /> Captions are on</label>
          </>}
          {doc.way === "html" && <>
            <h3>Your HTML file</h3>
            <p className="say">One .html file with everything inside. {doc.html?.name ? "On file: " + doc.html.name : ""}</p>
            <Upload classId={classId} as={as} accept=".html,.htm,text/html" what="Your file" say={doc.html?.url ? "Replace the file" : "Choose your .html file"} onDone={o => top({ html: { url: o.url, name: o.name } })} />
          </>}
          {exhibit && <>
            <h3>Your pages</h3>
            <p className="say">Name each page and say what will go on the page. Up to {MAX_PAGES}.</p>
            {pages.map((p, i) => <div className="item" key={p.id}><div className="bd" style={{ paddingTop: 12 }}>
              <F label={"Page " + (i + 1)} value={p.name} onChange={v => pagePatch(p.id, { name: v })} />
              <F label="What goes on this page" area value={p.plan} onChange={v => pagePatch(p.id, { plan: v })} />
              <div className="rowb"><button type="button" className="ic" aria-label="Move the page up" disabled={i === 0} onClick={() => movePage(i, -1)}>{GLYPH.up}</button><button type="button" className="ic" aria-label="Move the page down" disabled={i === pages.length - 1} onClick={() => movePage(i, 1)}>{GLYPH.down}</button>{pages.length > 1 && <button type="button" className="btn ghost sm" onClick={() => dropPage(i)}>Remove the page</button>}</div>
            </div></div>)}
            <button type="button" className="addhere thin" onClick={addPage} disabled={pages.length >= MAX_PAGES}>{GLYPH.plus} Add a page</button>
          </>}
        </>}

        {step === "build" && exhibit && cur && <>
          <div className="ptabs">{pages.map((p, i) => <button type="button" key={p.id} aria-current={i === page} onClick={() => { setPage(i); setSel(""); setAdding(null); }}>{p.name || "Page " + (i + 1)}</button>)}</div>
          {cur.plan && <p className="say">Your plan for this page: {cur.plan}</p>}
          {cur.blocks.map((b, i) => <div key={b.id}>
            {adding === i && <div style={{ marginBottom: 12 }}><Picker classId={classId} onPick={t => addBlock(t, i)} onClose={() => setAdding(null)} /></div>}
            <div className={"item" + (sel === b.id ? " on" : "") + (drag === i ? " drag" : "") + (over === i && drag !== i ? " over" : "") + (fresh === b.id ? " new" : "")}
              onDragOver={e => { if (drag != null) { e.preventDefault(); setOver(i); } }} onDrop={e => { e.preventDefault(); reorder(drag, i); setDrag(null); setOver(null); }}>
              <div className="hd" draggable onDragStart={e => { setDrag(i); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDrag(null); setOver(null); }} onClick={() => { setFresh(""); setSel(sel === b.id ? "" : b.id); }}>
                <span className="grab" title="Drag to move">{GLYPH.grip}</span><span className="gl">{GLYPH[b.t]}</span><b>{blockName(b.t)}</b><span>{gist(b)}</span>
                <button type="button" className="ic" aria-label="Move up" disabled={i === 0} onClick={e => { e.stopPropagation(); moveBlock(i, -1); }}>{GLYPH.up}</button>
                <button type="button" className="ic" aria-label="Move down" disabled={i === cur.blocks.length - 1} onClick={e => { e.stopPropagation(); moveBlock(i, 1); }}>{GLYPH.down}</button>
                <button type="button" className="ic" aria-label="Remove" onClick={e => { e.stopPropagation(); dropBlock(i); }}>{GLYPH.x}</button></div>
              {sel === b.id && <div className="bd"><BlockEditor b={b} set={p => blockPatch(cur.id, b.id, p)} sources={sources} classId={classId} as={as} onNewSource={() => { goStep("sources"); addSource(); }} />
                <button type="button" className="addhere thin" style={{ marginTop: 12, marginBottom: 0 }} onClick={() => setAdding(adding === i + 1 ? null : i + 1)}>{GLYPH.plus} Add a block below</button></div>}
            </div>
          </div>)}
          {adding === cur.blocks.length || cur.blocks.length === 0
            ? <>{cur.blocks.length > 0 && <button type="button" className="addhere thin" onClick={() => setAdding(null)}>{GLYPH.x} Close, back to your blocks</button>}
              <><h3>{cur.blocks.length ? "Add a layout" : "Start from a layout"}</h3><div className="starts">{STARTS.map(st => <button type="button" key={st.name} onClick={() => startPage(st)}><b>{st.name}</b><span className="mini">{st.blocks.map((t, k) => <i key={k} className={MINI[t] || "t"} />)}</span></button>)}</div></>
              <h3>Or add one block</h3><Picker classId={classId} onPick={t => addBlock(t)} /></>
            : <button type="button" className="addhere" onClick={() => { setAdding(cur.blocks.length); setTimeout(() => pane.current?.scrollTo({ top: pane.current.scrollHeight, behavior: "smooth" }), 50); }}>{GLYPH.plus} Add a block</button>}
        </>}

        {step === "sources" && <>
          <p className="say">Add each source once. In a text block, select words and link the words to a source.</p>
          {sources.map((s, i) => <div className={"item" + (sel === s.id ? " on" : "") + (fresh === s.id ? " new" : "")} key={s.id}>
            <div className="hd" onClick={() => { setFresh(""); setSel(sel === s.id ? "" : s.id); }}><b>{s.kind === "academic" ? "Academic" : s.kind === "popular" ? "Popular press" : "Source"}</b><span>{s.author || s.title}</span><button type="button" className="ic" aria-label="Remove" onClick={e => { e.stopPropagation(); dropSource(s, i); }}>{GLYPH.x}</button></div>
            {sel === s.id && <div className="bd">
              <label className="f"><span>Kind</span><select value={s.kind} onChange={e => srcPatch(s.id, { kind: e.target.value })}><option value="">Choose</option><option value="academic">Academic</option><option value="popular">Popular press</option><option value="other">Other</option></select></label>
              <F label="Author" value={s.author} onChange={v => srcPatch(s.id, { author: v })} placeholder="Last, F., & Last, F." />
              <F label="Year" value={s.year} onChange={v => srcPatch(s.id, { year: v })} />
              <F label="Title" value={s.title} onChange={v => srcPatch(s.id, { title: v })} />
              <F label="Journal, magazine or site" value={s.outlet} onChange={v => srcPatch(s.id, { outlet: v })} />
              <F label="Link" type="url" value={s.url} onChange={v => srcPatch(s.id, { url: v })} placeholder="https://" />
              <F label="Why you used this source" area value={s.note} onChange={v => srcPatch(s.id, { note: v })} />
            </div>}
          </div>)}
          <button type="button" className="addhere" onClick={addSource}>{GLYPH.plus} Add a source</button>
        </>}

        {step === "look" && <>
          <h3>Type</h3>
          <div className="looks">{TYPES.map(t => <button type="button" className="lookt" key={t.id} aria-pressed={doc.type === t.id} onClick={() => top({ type: t.id })}><span className="h" style={TYPE_FACE[t.id]}>{doc.headline || "Your headline"}</span><span className="n">{t.name}</span></button>)}</div>
          <h3>Color</h3>
          <div className="pals">{PALETTES.map(p => <button type="button" className="palt" key={p} aria-label={p} aria-pressed={doc.pal === p} onClick={() => top({ pal: p })}><span className="a" style={{ background: PAL_HEX[p][0] }}><i style={{ background: PAL_HEX[p][1] }} /></span><span className="p" style={{ background: PAL_HEX[p][2] }}><i style={{ background: PAL_HEX[p][3], width: "90%" }} /><i style={{ background: PAL_HEX[p][3], width: "70%" }} /><i style={{ background: PAL_HEX[p][0], width: "40%", opacity: 1 }} /></span></button>)}</div>
          {exhibit && <><h3>Layout</h3>
          <div className="tiles" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>{LAYOUTS.map(l => <button type="button" className="tile" key={l.id} aria-pressed={doc.layout === l.id} onClick={() => top({ layout: l.id })}>{l.name}<small>{l.id === "pages" ? "A front page with pages behind" : "One long story"}</small></button>)}</div></>}
        </>}

        {step === "check" && <>
          <div className="rowb" style={{ justifyContent: "space-between", marginBottom: 6 }}><div><div className="big">{wordCount(doc)}</div><div className="due">words</div></div><div style={{ textAlign: "right" }}><div className="big">{done} of {list.length}</div><div className="due">checked</div></div></div>
          {list.map(l => <button type="button" className={"chk" + (l.ok ? " ok" : "")} key={l.id} onClick={() => fix(l)}><span className="m">{GLYPH.check}</span><span>{l.say}</span><span className="c">{l.need > 1 ? `${Math.min(l.have, 999)} of ${l.need}` : ""}</span></button>)}
          <h3>For the public page</h3>
          {classId !== "comm118" && <F label="Who you interviewed" value={doc.interview} onChange={v => top({ interview: v })} />}
          <F label="How you used AI to assist you in your work" area value={doc.ai} onChange={v => top({ ai: v })} />
          <F label="Topic area, for the class gallery" value={doc.area} onChange={v => top({ area: v })} />
          {(doc.makers || []).length > 1 && <><h3>For Dr. Ishak only</h3><F label="Who did what" area value={doc.who} onChange={v => top({ who: v })} /></>}
        </>}

        {step === "share" && <>
          <h3>Private preview link</h3>
          <p className="say">Anyone with this link can read your draft and leave a note on any block. Only you and Dr. Ishak see the notes.</p>
          <div className="link"><input type="text" readOnly value={previewUrl} onFocus={e => e.target.select()} /><button type="button" className="btn" onClick={() => { navigator.clipboard?.writeText(previewUrl).then(() => toast("Link copied")).catch(() => toast("Select the link and copy")); }}>Copy</button></div>
          <h3>Notes from readers</h3>
          {notes.length === 0 && <p className="say">No notes yet.</p>}
          {notes.slice().reverse().map(n => <div className="note" key={n.id}><b>{n.name}</b>{n.classmate ? " (classmate)" : ""}<div>{n.text}</div><small>{new Date(n.at).toLocaleString()} <button type="button" className="btn ghost sm" style={{ marginLeft: 8 }} onClick={() => dropNote(classId, n.id, as).then(() => { setNotes(x => x.filter(y => y.id !== n.id)); toast("Note cleared"); }).catch(() => {})}>Done with this note</button></small></div>)}
        </>}

        <div className="stepfoot">
          {at > 0 ? <button type="button" className="btn ghost" onClick={() => goStep(STEPS[at - 1][0])}>Back: {STEPS[at - 1][1]}</button> : <span />}
          {at < STEPS.length - 1 && <button type="button" className="btn" onClick={() => goStep(STEPS[at + 1][0])}>Next: {STEPS[at + 1][1]}</button>}
        </div>
      </div>
      <Confetti run={party} />
      <div className="toasts" aria-live="polite">{toasts.map(t => <div className={"toast" + (t.back ? " undo" : "")} key={t.id}>{!t.back && <span className="tk">{GLYPH.check}</span>}{t.say}{t.back && <button type="button" className="btn sm" onClick={() => { t.back(); setToasts(x => x.filter(y => y.id !== t.id)); }}>Undo</button>}</div>)}</div>
    </div>
    <div className="view" ref={view}>
      <div className="viewbar">
        <div className="seg"><button type="button" aria-pressed={!phone} onClick={() => setPhone(false)}>{GLYPH.desk} Laptop</button><button type="button" aria-pressed={phone} onClick={() => setPhone(true)}>{GLYPH.phone} Phone</button></div>
        <div><a href={`/${classId}/exhibits/sample`} target="_blank" rel="noopener">The sample</a><a href={previewUrl} target="_blank" rel="noopener">{GLYPH.out} Open as a reader</a></div>
      </div>
      <div className={"stage" + (phone ? " phone" : "")}><Reader doc={{ ...doc, term: "" }} page={page} onPage={(i) => { setPage(i); setSel(""); }} around={around} scrollEl={view} narrow={phone} still /></div>
      <button type="button" className="btn flip flipback" onClick={() => setShowView(false)}>Back to building</button>
    </div>
  </div></Toast.Provider>;
}

/** What a reader, or the student after the lock, sees on the worksheet's address: the project itself. */
function Finished({ classId, as }) {
  const [doc, setDoc] = useState(null), [err, setErr] = useState("");
  useEffect(() => { let on = true; loadMine(classId, as).then(o => on && setDoc(o.doc)).catch(e => on && setErr(e.message)); return () => { on = false; }; }, [classId, as]);
  if (err) return <p style={{ padding: 20 }}>{err}</p>;
  return doc ? <Reader doc={doc} /> : null;
}

export function mountExhibit(root, { viewer, classId, readOnly = false, peek = false } = {}) {
  const r = createRoot(root);
  // readOnly is the instructor reading one student's file (?s=) or the student's own after the sheet closed.
  r.render(readOnly ? <Finished classId={classId} as={peek ? viewer?.id : ""} /> : <Builder classId={classId} viewer={viewer} />);
  return { destroy() { r.unmount(); } };
}
export default Builder;
