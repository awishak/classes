// An exhibit, read: the page a visitor sees, and the same page the builder
// shows beside the form while a student works.
//
// Andrew, 2026-11-23: "Most importantly, it should just be pretty on its
// face ... the students don't need to do anything particularly special in
// terms of like choosing them from a 1000000 different kinds of fonts." So
// the design is ours. A student picks one of three type styles, one of five
// light palettes, and pages or one scroll; everything else is decided here.
//
// His answers the page holds: a cover image under the headline; page names
// across the top and a next link at the bottom; on a scroll, a chapter bar
// that follows; a link in the text is always a source and opens the source
// with the student's note ("not a fan of small numbers"); photos in three
// sizes and beside text; a line on how AI was used on the public page.

import { useEffect, useMemo, useRef, useState } from "react";
import { safeUrl, videoOf, embedOf, citeOf } from "./model.js";

const FONTS = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Figtree:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Libre+Franklin:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600&display=swap";
export function useExhibitFonts() {
  useEffect(() => {
    if (document.querySelector("link[data-exhibit-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = FONTS; link.setAttribute("data-exhibit-fonts", "1");
    document.head.appendChild(link);
  }, []);
}

export const CSS = `
.xr{--paper:#faf6ee;--ink:#1d1a16;--accent:#d9541e;--pop:#17324d;--wash:#f1e7d3;--on:#fff8ef;--onpop:#fff8ef;--popfg:#ffb38f;
  --soft:color-mix(in srgb, var(--ink) 64%, var(--paper));--line:color-mix(in srgb, var(--ink) 16%, var(--paper));
  --f-head:"Newsreader",Georgia,serif;--f-body:"Newsreader",Georgia,serif;--f-label:"Libre Franklin",system-ui,sans-serif;
  --h-weight:600;--h-style:normal;--h-case:none;--h-track:-.015em;--h-lh:1.02;--h-scale:1;--body-size:20px;--body-lh:1.55;--h-stretch:100%;
  background:var(--paper);color:var(--ink);font-family:var(--f-body);font-size:var(--body-size);line-height:var(--body-lh);min-height:100vh;position:relative;text-align:left;-webkit-font-smoothing:antialiased}
.xr *{box-sizing:border-box}
.xr[data-pal="orange"]{--paper:#faf6ee;--ink:#1d1a16;--accent:#d9541e;--pop:#17324d;--wash:#f1e7d3;--on:#fff8ef;--onpop:#fff8ef;--popfg:#ffb38f}
.xr[data-pal="green"]{--paper:#f5f8f1;--ink:#12231a;--accent:#1c7a41;--pop:#dbe64a;--wash:#e1eedb;--on:#f6fff3;--onpop:#12231a;--popfg:#dbe64a}
.xr[data-pal="blue"]{--paper:#f4f8fc;--ink:#0e2033;--accent:#1560c8;--pop:#ff5d62;--wash:#dde9f6;--on:#f4f9ff;--onpop:#2b0a0c;--popfg:#ff8d91}
.xr[data-pal="red"]{--paper:#fcf6f3;--ink:#2a1114;--accent:#b01f2d;--pop:#f3b62f;--wash:#f6e2dc;--on:#fff5f2;--onpop:#2a1114;--popfg:#f3b62f}
.xr[data-pal="violet"]{--paper:#f7f5fc;--ink:#1e1534;--accent:#5a3ed2;--pop:#17b89f;--wash:#e7e2f7;--on:#f8f6ff;--onpop:#06231e;--popfg:#4fe0ca}
.xr[data-type="news"]{--f-head:"Newsreader",Georgia,serif;--f-body:"Newsreader",Georgia,serif;--f-label:"Libre Franklin",system-ui,sans-serif;--h-weight:600;--h-style:normal;--h-case:none;--h-track:-.015em;--h-lh:1.02;--h-scale:1;--body-size:20px;--body-lh:1.55;--h-stretch:100%}
.xr[data-type="museum"]{--f-head:"Archivo","Arial Narrow",sans-serif;--f-body:"Archivo",system-ui,sans-serif;--f-label:"Archivo",system-ui,sans-serif;--h-weight:850;--h-style:normal;--h-case:uppercase;--h-track:-.01em;--h-lh:.9;--h-scale:1.04;--body-size:18px;--body-lh:1.55;--h-stretch:72%}
.xr[data-type="magazine"]{--f-head:"Instrument Serif",Georgia,serif;--f-body:"Figtree",system-ui,sans-serif;--f-label:"Figtree",system-ui,sans-serif;--h-weight:400;--h-style:italic;--h-case:none;--h-track:-.02em;--h-lh:.95;--h-scale:1.22;--body-size:18px;--body-lh:1.6;--h-stretch:100%}

.xr .gut{padding-left:max(20px, env(safe-area-inset-left, 0px));padding-right:max(20px, env(safe-area-inset-right, 0px))}
.xr .hd{font-family:var(--f-head);font-weight:var(--h-weight);font-style:var(--h-style);text-transform:var(--h-case);letter-spacing:var(--h-track);line-height:var(--h-lh);font-stretch:var(--h-stretch);text-wrap:balance;margin:0}
.xr .lab{font-family:var(--f-label);font-size:12.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase}
.xr button{font-family:inherit}
.xr button:focus-visible,.xr a:focus-visible,.xr .src:focus-visible{outline:3px solid var(--pop);outline-offset:2px}

.xr .bar{position:sticky;top:0;z-index:20;background:var(--ink);color:var(--paper)}
.xr .bar .in{display:flex;align-items:center;gap:22px;min-height:52px;max-width:1180px;margin:0 auto}
.xr .bar .ttl{font-family:var(--f-head);font-weight:var(--h-weight);font-style:var(--h-style);text-transform:var(--h-case);font-stretch:var(--h-stretch);font-size:20px;white-space:nowrap;line-height:1;overflow:hidden;text-overflow:ellipsis;min-width:0}
.xr .tabs{display:flex;gap:4px;overflow-x:auto;min-width:0;margin-left:auto;scrollbar-width:none;flex:none;max-width:100%}
.xr .tabs button{font:600 14px var(--f-label);color:inherit;background:none;border:0;padding:8px 13px;border-radius:99px;cursor:pointer;white-space:nowrap;opacity:.72}
.xr .tabs button:hover{opacity:1}
.xr .tabs button[aria-current="true"]{background:var(--accent);color:var(--on);opacity:1}

.xr .cover{background:var(--accent);color:var(--on);position:relative;overflow:hidden}
.xr .cover.pic{background:#000;color:#fff;min-height:min(78vh,760px);display:flex;align-items:flex-end}
.xr .cover.pic > img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.xr .cover.pic::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.25) 45%,rgba(0,0,0,0) 75%),linear-gradient(180deg,rgba(0,0,0,.05) 0%,rgba(0,0,0,.2) 38%,rgba(0,0,0,.85) 100%)}
.xr .cover .in{max-width:1180px;margin:0 auto;width:100%;padding-block:64px 44px;position:relative;z-index:1}
.xr .cover.pic .in{padding-block:120px 40px}
.xr .cover h1{font-size:calc(clamp(52px,9.4vw,128px)*var(--h-scale));max-width:13ch}
.xr .cover .tick{display:block;width:92px;height:10px;background:var(--pop);margin-bottom:22px}
.xr .cover.pic .tick{background:var(--accent)}
.xr .cover .sum{font-size:calc(var(--body-size) + 3px);line-height:1.4;max-width:40ch;margin:22px 0 0}
.xr .cover .by{margin-top:22px;display:flex;flex-wrap:wrap;gap:6px 18px}
.xr .cover .cred{position:absolute;right:max(20px, env(safe-area-inset-right, 0px));bottom:10px;z-index:1;font:11.5px var(--f-label);opacity:.75;max-width:44%;text-align:right}

.xr .phead{max-width:1180px;margin:0 auto;padding-block:56px 6px}
.xr .phead .hd{font-size:calc(clamp(40px,6.4vw,84px)*var(--h-scale))}
.xr .phead .lab{color:var(--accent);margin-bottom:10px}
.xr .rule{height:6px;background:var(--ink);margin-top:72px}

.xr .col{max-width:680px;margin-left:auto;margin-right:auto}
.xr .wide{max-width:1180px;margin-left:auto;margin-right:auto}
.xr .blk{margin-top:34px;position:relative}
.xr .txt p{margin:0 0 1em}
.xr .txt p:last-child{margin-bottom:0}
.xr .first p:first-child::first-letter{font-family:var(--f-head);font-weight:var(--h-weight);font-style:normal;float:left;font-size:4.1em;line-height:.82;padding:6px 10px 0 0;color:var(--accent);text-transform:uppercase}
.xr .src{color:inherit;background:linear-gradient(var(--wash),var(--wash)) 0 100%/100% 42% no-repeat;border-bottom:2px dotted var(--accent);cursor:pointer;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.xr .src:hover,.xr .src[aria-expanded="true"]{background-size:100% 100%}
.xr h2.sub{font-size:calc(clamp(28px,3.6vw,42px)*var(--h-scale))}
.xr figure{margin-block:0}
.xr .frame{background:var(--wash);border-radius:4px;overflow:hidden}
.xr .frame img{display:block;width:100%;height:auto}
.xr .wide > .frame img,.xr figure.wide > .frame img{max-height:min(86vh,720px);object-fit:cover}
.xr .frame.fix{aspect-ratio:16/9}
.xr .frame.fix img{height:100%;object-fit:cover}
.xr figcaption{font-family:var(--f-label);font-size:14px;line-height:1.4;margin-top:9px;color:var(--soft)}
.xr figcaption b{color:var(--ink);font-weight:600}
.xr .pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.xr .pair .frame{aspect-ratio:4/3}
.xr .pair .frame img{height:100%;object-fit:cover}
.xr .wrap-r{float:right;width:46%;margin:6px 0 14px 26px}
.xr .clear{clear:both}

.xr .quote{background:var(--pop);color:var(--onpop);margin-top:48px}
.xr .quote .in{max-width:1000px;margin:0 auto;padding-block:54px}
.xr .quote blockquote{margin:0;font-family:var(--f-head);font-weight:var(--h-weight);font-style:var(--h-style);text-transform:var(--h-case);font-stretch:var(--h-stretch);letter-spacing:var(--h-track);font-size:calc(clamp(32px,5.2vw,68px)*var(--h-scale));line-height:1.04;text-wrap:balance}
.xr .quote .who{margin-top:20px}

.xr .num{display:grid;grid-template-columns:auto minmax(0,1fr);gap:26px;align-items:center;border-block:6px solid var(--ink);padding-block:18px}
.xr .num .n{font-family:var(--f-head);font-weight:var(--h-weight);font-style:var(--h-style);font-stretch:var(--h-stretch);font-size:calc(clamp(96px,15vw,190px)*var(--h-scale));line-height:.8;color:var(--accent);letter-spacing:-.04em}
.xr .num .w{font-family:var(--f-head);font-weight:var(--h-weight);font-style:var(--h-style);text-transform:var(--h-case);font-stretch:var(--h-stretch);font-size:calc(clamp(24px,3vw,36px)*var(--h-scale));line-height:1.08}
.xr .num .s{margin-top:10px;font:14px/1.4 var(--f-label);color:var(--soft)}

.xr .concept{background:var(--ink);color:var(--paper);border-radius:4px;padding:30px 32px 32px;display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:10px 34px}
.xr .concept .lab{color:var(--popfg);grid-column:1/-1}
.xr .concept .name{font-size:calc(clamp(34px,4.4vw,56px)*var(--h-scale));overflow-wrap:anywhere}
.xr .concept .def{font-size:calc(var(--body-size) + 2px);line-height:1.42;margin:0}
.xr .concept .from{margin-top:14px;font:14px/1.4 var(--f-label);opacity:.8}
.xr .concept .src{background:none;border-bottom-color:currentColor}

.xr .audio{display:flex;align-items:center;gap:16px;background:var(--wash);border-radius:99px;padding:10px 24px 10px 10px}
.xr .audio .pb{flex:none;width:56px;height:56px;border-radius:50%;background:var(--accent);color:var(--on);display:grid;place-items:center;border:0;cursor:pointer}
.xr .audio .tx{flex:1;min-width:0;font:600 16px/1.25 var(--f-label)}
.xr .audio .tx small{display:block;font-weight:400;color:var(--soft);font-size:13.5px}
.xr .audio .track{flex:none;width:34%;height:6px;border-radius:3px;background:var(--line);overflow:hidden;cursor:pointer}
.xr .audio .track i{display:block;height:100%;background:var(--accent)}
.xr .tr{font:15px/1.5 var(--f-label);color:var(--soft);margin:12px 0 0;padding-left:16px;border-left:3px solid var(--line);white-space:pre-wrap}
.xr .tr b{color:var(--ink)}

.xr .video{position:relative;background:var(--ink);border-radius:4px;overflow:hidden;aspect-ratio:16/9}
.xr .video iframe,.xr .embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.xr .embed{position:relative;background:var(--wash);border-radius:4px;overflow:hidden}
.xr .embed.tall{aspect-ratio:9/15;max-width:380px;margin:0 auto}
.xr .embed.chart{aspect-ratio:16/10}
.xr .empty{display:grid;place-items:center;text-align:center;background:var(--wash);color:var(--soft);border:2px dashed var(--line);border-radius:4px;padding:26px;font:600 14px/1.4 var(--f-label);min-height:120px}

.xr .card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:18px;align-items:center;border:2px solid var(--ink);border-radius:4px;padding:16px 20px;color:inherit;text-decoration:none}
.xr .card:hover{background:var(--wash)}
.xr .card .dot{width:46px;height:46px;border-radius:50%;background:var(--accent);color:var(--on);display:grid;place-items:center}
.xr .card b{font:600 17px/1.25 var(--f-label);display:block}
.xr .card .sub{font:14px/1.3 var(--f-label);color:var(--soft);overflow-wrap:anywhere}

.xr .tl .row{display:grid;grid-template-columns:128px 26px minmax(0,1fr);gap:0 16px;align-items:start}
.xr .tl .t{font-family:var(--f-head);font-weight:var(--h-weight);font-style:var(--h-style);font-stretch:var(--h-stretch);font-size:calc(34px*var(--h-scale));line-height:1;color:var(--accent);text-align:right;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.xr .tl .ln{position:relative;align-self:stretch}
.xr .tl .ln::before{content:"";position:absolute;left:11px;top:0;bottom:0;width:4px;background:var(--ink)}
.xr .tl .ln::after{content:"";position:absolute;left:3px;top:8px;width:20px;height:20px;border-radius:50%;background:var(--pop);border:4px solid var(--ink)}
.xr .tl .row:first-child .ln::before{top:12px}
.xr .tl .row:last-child .ln::before{bottom:auto;height:12px}
.xr .tl .d{padding:2px 0 26px}
.xr .tl .d b{font:600 18px/1.25 var(--f-label);display:block}
.xr .tl .d span{font-size:.92em;color:var(--soft)}

.xr .gal .frame{aspect-ratio:16/9}
.xr .gal .frame img{height:100%;object-fit:cover}
.xr .gal .ctl{display:flex;align-items:center;gap:12px;margin-top:10px}
.xr .gal .ctl button{flex:none;width:42px;height:42px;border-radius:50%;border:2px solid var(--ink);background:none;color:var(--ink);cursor:pointer;display:grid;place-items:center}
.xr .gal .ctl button:hover{background:var(--ink);color:var(--paper)}
.xr .gal .ctl figcaption{margin:0;flex:1}
.xr .gal .ct{font:600 14px var(--f-label);font-variant-numeric:tabular-nums;flex:none}

.xr .slider{position:relative;aspect-ratio:16/9;border-radius:4px;overflow:hidden;background:var(--wash);touch-action:none;cursor:ew-resize;user-select:none}
.xr .slider img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.xr .slider .bar2{position:absolute;top:0;bottom:0;width:4px;background:#fff;transform:translateX(-2px)}
.xr .slider .knob{position:absolute;top:50%;width:48px;height:48px;border-radius:50%;background:#fff;color:#111;transform:translate(-50%,-50%);display:grid;place-items:center;box-shadow:0 2px 10px rgba(0,0,0,.3)}
.xr .slider .tag{position:absolute;top:14px;font:600 12.5px var(--f-label);letter-spacing:.09em;text-transform:uppercase;padding:5px 11px;border-radius:99px;background:#fff;color:#111}

.xr .quiz{background:var(--wash);border-radius:4px;padding:28px 30px 30px}
.xr .quiz .q{font-size:calc(clamp(24px,3vw,34px)*var(--h-scale));margin:8px 0 18px}
.xr .quiz .lab{color:var(--accent)}
.xr .quiz .os{display:grid;gap:10px}
.xr .quiz .os button{font:600 17px/1.3 var(--f-label);text-align:left;background:var(--paper);color:var(--ink);border:2px solid var(--ink);border-radius:4px;padding:14px 18px;cursor:pointer}
.xr .quiz .os button:hover{transform:translateX(4px)}
.xr .quiz .os button.right{background:var(--accent);border-color:var(--accent);color:var(--on)}
.xr .quiz .os button.wrong{opacity:.45;text-decoration:line-through}
.xr .quiz .ans{margin:16px 0 0;font-size:.95em}

.xr .map{aspect-ratio:16/9;border-radius:4px;overflow:hidden;background:var(--wash);z-index:0;position:relative}
.xr .mapnote{margin-top:10px;font:15px/1.4 var(--f-label)}
.xr .mapnote b{font-weight:600}
.xr .xpin{color:var(--accent);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
.xr .xpin.on{color:var(--ink)}

.xr .srcs{display:grid;grid-template-columns:1fr 1fr;gap:10px 44px}
.xr .srcs h3{font:600 12.5px var(--f-label);letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin:0 0 4px;padding-bottom:8px;border-bottom:4px solid var(--ink)}
.xr .srcs p{font:15.5px/1.45 var(--f-label);margin:0;padding:12px 0;border-bottom:1px solid var(--line);overflow-wrap:anywhere}
.xr .srcs a{color:inherit}
.xr .foot{margin-top:40px;border-top:6px solid var(--ink);padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px 44px;font:15.5px/1.45 var(--f-label)}
.xr .foot .lab{color:var(--accent);display:block;margin-bottom:4px}

.xr .next{display:block;width:100%;text-align:left;border:0;cursor:pointer;background:var(--accent);color:var(--on);margin-top:64px;font:inherit;padding:0}
.xr .next .in{max-width:1180px;margin:0 auto;padding-block:34px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.xr .next .hd{font-size:calc(clamp(34px,5.4vw,72px)*var(--h-scale))}
.xr .next:hover .ar{transform:translateX(10px)}
.xr .next .ar{transition:transform .2s ease;flex:none}
.xr .end{height:96px}

.xr .pop{position:absolute;z-index:30;width:min(400px, calc(100% - 32px));background:var(--ink);color:var(--paper);border-radius:6px;padding:18px 20px 20px;box-shadow:0 14px 40px rgba(0,0,0,.28);font-family:var(--f-label)}
.xr .pop .lab{color:var(--popfg)}
.xr .pop .cite{font-size:15.5px;line-height:1.42;margin:8px 0 0;overflow-wrap:anywhere}
.xr .pop .note{font-size:15px;line-height:1.45;margin:12px 0 0;padding-top:12px;border-top:1px solid color-mix(in srgb, var(--paper) 25%, transparent)}
.xr .pop .note b{display:block;font-size:12px;letter-spacing:.09em;text-transform:uppercase;opacity:.7;margin-bottom:3px}
.xr .pop a{display:inline-block;margin-top:14px;font-weight:600;font-size:14.5px;color:var(--ink);background:var(--paper);border-radius:99px;padding:7px 15px;text-decoration:none}

.xr .film{max-width:1180px;margin:0 auto;padding-top:34px}
.xr .own{width:100%;height:calc(100vh - 52px);border:0;display:block;background:#fff}

.xr.narrow .cover .in{padding-block:40px 30px}
.xr.narrow .cover.pic .in{padding-block:90px 30px}
.xr.narrow .cover.pic{min-height:520px}
.xr.narrow .bar .ttl{display:none}
.xr.narrow .tabs{margin-left:0}
.xr.narrow .wrap-r{float:none;width:100%;margin:0 0 18px}
.xr.narrow .concept{grid-template-columns:minmax(0,1fr);padding:24px 22px}
.xr.narrow .num{grid-template-columns:minmax(0,1fr);gap:8px}
.xr.narrow .srcs,.xr.narrow .foot,.xr.narrow .pair{grid-template-columns:minmax(0,1fr)}
.xr.narrow .tl .row{grid-template-columns:78px 26px minmax(0,1fr);gap:0 10px}
.xr.narrow .tl .t{font-size:calc(24px*var(--h-scale))}
.xr.narrow .audio .track{display:none}
.xr.narrow .cover .cred{position:static;max-width:none;text-align:left;margin-top:14px;display:block}
@media (prefers-reduced-motion:reduce){ .xr .next .ar{transition:none} }
`;

const Icon = {
  play: (s = 20) => <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.5v13l11-6.5z" fill="currentColor" /></svg>,
  pause: (s = 20) => <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3.5h3.6v13H5zM11.4 3.5H15v13h-3.6z" fill="currentColor" /></svg>,
  arrow: () => <svg width="64" height="40" viewBox="0 0 64 40" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h54M42 5l16 15-16 15" /></svg>,
  l: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 3L5 9l6 6" /></svg>,
  r: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3l6 6-6 6" /></svg>,
  lr: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 5l-5 6 5 6M14 5l5 6-5 6" /></svg>,
  out: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 13l7-7M8 6h6v6" /></svg>,
};

// A text block's marks, drawn: **bold**, _italic_, [[source id|words]]. A blank line starts a paragraph.
function inline(text, onSource, open, key = "") {
  const out = []; let rest = String(text || ""), i = 0;
  const re = /\*\*([^*]+)\*\*|_([^_]+)_|\[\[([^|\]]+)\|([^\]]+)\]\]/;
  while (rest) {
    const m = re.exec(rest);
    if (!m) { out.push(rest); break; }
    if (m.index) out.push(rest.slice(0, m.index));
    const k = key + (i++);
    if (m[1] != null) out.push(<b key={k}>{inline(m[1], onSource, open, k)}</b>);
    else if (m[2] != null) out.push(<i key={k}>{inline(m[2], onSource, open, k)}</i>);
    else out.push(<SourceLink key={k} id={m[3]} onSource={onSource} open={open}>{m[4]}</SourceLink>);
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}
function SourceLink({ id, onSource, open, children }) {
  const go = (e) => { e.stopPropagation(); onSource(id, e.currentTarget); };
  return <span role="button" tabIndex={0} className="src" aria-expanded={open === id} onClick={go} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(e); } }}>{children}</span>;
}
const paras = (text) => String(text || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

function Fig({ url, alt, cap, credit, fix }) {
  const u = safeUrl(url) || (String(url || "").startsWith("/") ? url : "");
  return <>
    <div className={"frame" + (fix ? " fix" : "")}>{u ? <img src={u} alt={alt || ""} loading="lazy" /> : null}</div>
    {(cap || credit) && <figcaption>{cap} {credit && <b>{credit}</b>}</figcaption>}
  </>;
}
const srcUrl = (u) => safeUrl(u) || (String(u || "").startsWith("/") ? u : "");

function AudioClip({ b }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false), [at, setAt] = useState(0), [len, setLen] = useState(0);
  const url = srcUrl(b.url);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const toggle = () => { const a = ref.current; if (!a) return; if (a.paused) a.play().catch(() => {}); else a.pause(); };
  return <>
    <div className="audio">
      <button type="button" className="pb" aria-label={on ? "Pause" : "Play"} onClick={toggle} disabled={!url}>{on ? Icon.pause() : Icon.play()}</button>
      <div className="tx">{b.title || "Audio clip"}<small>{len ? `${mmss(at)} of ${mmss(len)}` : "Audio"}</small></div>
      <div className="track" onClick={e => { const a = ref.current; if (a && len) { const r = e.currentTarget.getBoundingClientRect(); a.currentTime = ((e.clientX - r.left) / r.width) * len; } }}><i style={{ width: (len ? (at / len) * 100 : 0) + "%" }} /></div>
      {url && <audio ref={ref} src={url} preload="metadata" onPlay={() => setOn(true)} onPause={() => setOn(false)} onTimeUpdate={e => setAt(e.currentTarget.currentTime)} onLoadedMetadata={e => setLen(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)} />}
    </div>
    {b.transcript && <p className="tr"><b>Transcript. </b>{b.transcript}</p>}
  </>;
}

function Gallery({ b }) {
  const items = (b.items || []).filter(it => srcUrl(it.url));
  const [i, setI] = useState(0);
  if (!items.length) return <div className="empty">Photo gallery</div>;
  const it = items[Math.min(i, items.length - 1)];
  const step = (d) => setI(x => (Math.min(x, items.length - 1) + d + items.length) % items.length);
  return <>
    <div className="frame"><img src={srcUrl(it.url)} alt={it.alt || ""} /></div>
    <div className="ctl">
      <button type="button" aria-label="Previous photo" onClick={() => step(-1)}>{Icon.l()}</button>
      <span className="ct">{Math.min(i, items.length - 1) + 1} / {items.length}</span>
      <button type="button" aria-label="Next photo" onClick={() => step(1)}>{Icon.r()}</button>
      <figcaption>{it.cap} {it.credit && <b>{it.credit}</b>}</figcaption>
    </div>
  </>;
}

function Slider({ b }) {
  const [p, setP] = useState(50);
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); setP(Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100))); };
  const a = srcUrl(b.a), z = srcUrl(b.b);
  if (!a || !z) return <div className="empty">Before and after</div>;
  return <>
    <div className="slider" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={e => { if (e.buttons) move(e); }}>
      <img src={z} alt={b.bAlt || ""} />
      <img src={a} alt={b.aAlt || ""} style={{ clipPath: `inset(0 ${100 - p}% 0 0)` }} />
      <span className="tag" style={{ left: 14 }}>{b.labelA || "Before"}</span><span className="tag" style={{ right: 14 }}>{b.labelB || "After"}</span>
      <div className="bar2" style={{ left: p + "%" }} /><div className="knob" style={{ left: p + "%" }}>{Icon.lr()}</div>
    </div>
    {(b.cap || b.credit) && <figcaption>{b.cap} {b.credit && <b>{b.credit}</b>}</figcaption>}
  </>;
}

function Quiz({ b }) {
  const [done, setDone] = useState(false);
  const options = (b.options || []).map((o, i) => [o, i]).filter(([o]) => String(o || "").trim());
  return <div className="quiz">
    <div className="lab">Quiz</div><div className="hd q">{b.q}</div>
    <div className="os">{options.map(([o, i]) => <button type="button" key={i} className={done ? (i === b.right ? "right" : "wrong") : ""} onClick={() => setDone(true)}>{o}</button>)}</div>
    {done && b.ans && <p className="ans">{b.ans}</p>}
  </div>;
}

// The map is Leaflet over OpenStreetMap, fetched the first time a map is on the page.
let leaflet;
export function loadLeaflet() {
  if (leaflet) return leaflet;
  leaflet = new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css);
    const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve(window.L); s.onerror = () => { leaflet = null; reject(new Error("The map could not load.")); };
    document.head.appendChild(s);
  });
  return leaflet;
}
const PIN = '<svg width="34" height="44" viewBox="0 0 38 48" aria-hidden="true"><path d="M19 47C8 32 2 25 2 17a17 17 0 0 1 34 0c0 8-6 15-17 30z" fill="currentColor" stroke="#fff" stroke-width="3"/><circle cx="19" cy="17" r="6" fill="#fff"/></svg>';
function MapBlock({ b }) {
  const el = useRef(null);
  const pins = useMemo(() => (b.pins || []).filter(p => Number.isFinite(+p.lat) && Number.isFinite(+p.lng)), [b.pins]);
  const [on, setOn] = useState(0);
  const key = JSON.stringify(pins.map(p => [p.lat, p.lng]));
  useEffect(() => {
    if (!pins.length || !el.current) return;
    let map, dead = false;
    loadLeaflet().then(L => {
      if (dead || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      pins.forEach((p, i) => L.marker([+p.lat, +p.lng], { icon: L.divIcon({ html: PIN, className: "xpin", iconSize: [34, 44], iconAnchor: [17, 44] }), title: p.name || "" }).addTo(map).on("click", () => setOn(i)));
      if (pins.length === 1) map.setView([+pins[0].lat, +pins[0].lng], 13); else map.fitBounds(pins.map(p => [+p.lat, +p.lng]), { padding: [50, 50] });
    }).catch(() => {});
    return () => { dead = true; if (map) map.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!pins.length) return <div className="empty">Map</div>;
  const p = pins[Math.min(on, pins.length - 1)];
  return <>
    <div className="map" ref={el} />
    <div className="mapnote"><b>{p.name}{p.name && p.note ? ". " : ""}</b>{p.note}</div>
    {b.cap && <figcaption>{b.cap}</figcaption>}
  </>;
}

function Frame({ kind }) { return <div className="empty">{kind}</div>; }

/** One block. `first` gives the opening text block its drop capital. */
export function Block({ b, first, sources, onSource, open, wrap }) {
  const sl = (id, label) => (id && sources.some(s => s.id === id) ? <SourceLink id={id} onSource={onSource} open={open}>{label}</SourceLink> : null);
  const nameOf = (id) => { const s = sources.find(x => x.id === id); return s ? [s.author, s.year].filter(Boolean).join(", ") || s.title || "Source" : ""; };
  if (b.t === "text") return <div className={"blk col txt" + (first ? " first" : "")}>
    {wrap && srcUrl(wrap.url) && <figure className="wrap-r"><Fig url={wrap.url} alt={wrap.alt} cap={wrap.cap} credit={wrap.credit} /></figure>}
    {paras(b.text).map((p, i) => <p key={i}>{inline(p, onSource, open)}</p>)}<div className="clear" />
  </div>;
  if (b.t === "heading") return <h2 className="blk col hd sub">{b.text}</h2>;
  if (b.t === "photo") {
    if (b.size === "wrap") return null;   // drawn beside the text block after the photo
    if (!srcUrl(b.url)) return <div className="blk col"><Frame kind="Photo or graphic" /></div>;
    if (b.size === "pair") return <div className="blk wide pair"><figure><Fig url={b.url} alt={b.alt} cap={b.cap} credit={b.credit} /></figure><figure><Fig url={b.url2} alt={b.alt2} cap={b.cap2} credit={b.credit2} /></figure></div>;
    return <figure className={"blk " + (b.size === "full" ? "wide" : "col")}><Fig url={b.url} alt={b.alt} cap={b.cap} credit={b.credit} /></figure>;
  }
  if (b.t === "number") return <div className="blk col"><div className="num"><div className="n">{b.n}</div><div><div className="w">{b.w}</div>{b.source && <div className="s">{sl(b.source, nameOf(b.source))}</div>}</div></div></div>;
  if (b.t === "concept") return <div className="blk wide"><div className="concept"><div className="lab">Concept</div><div className="hd name">{b.name}</div><div><p className="def">{b.def}</p>{b.source && <div className="from">{sl(b.source, nameOf(b.source))}</div>}</div></div></div>;
  if (b.t === "quote") return <div className="quote" data-bleed="1"><div className="in gut"><blockquote>{b.text}</blockquote>{b.who && <div className="who lab">{b.who}</div>}</div></div>;
  if (b.t === "audio") return <div className="blk col"><AudioClip b={b} /></div>;
  if (b.t === "video") { const v = videoOf(b.url); return <figure className="blk wide">{v ? <div className="video"><iframe src={v.src} title={b.title || v.kind + " video"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" /></div> : <Frame kind="Video link" />}{b.title && <figcaption>{b.title}</figcaption>}</figure>; }
  if (b.t === "embed") { const v = embedOf(b.url); return <figure className={"blk " + (v?.shape === "chart" ? "wide" : "col")}>{v ? <div className={"embed " + v.shape}><iframe src={v.src} title={b.title || v.kind} loading="lazy" allowFullScreen /></div> : <Frame kind="Post or chart" />}{b.title && <figcaption>{b.title}</figcaption>}</figure>; }
  if (b.t === "link") { const u = safeUrl(b.url); return <div className="blk col">{u ? <a className="card" href={u} target="_blank" rel="noopener noreferrer"><span className="dot">{Icon.out()}</span><span><b>{b.title || u}</b><span className="sub">{b.sub || u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</span></span>{Icon.r()}</a> : <Frame kind="Link card" />}</div>; }
  if (b.t === "timeline") return <div className="blk col tl">{(b.rows || []).filter(r => r.when || r.title || r.text).map((r, i) => <div className="row" key={i}><div className="t">{r.when}</div><div className="ln" /><div className="d"><b>{r.title}</b><span>{r.text}</span></div></div>)}</div>;
  if (b.t === "gallery") return <figure className="blk wide gal"><Gallery b={b} /></figure>;
  if (b.t === "slider") return <figure className="blk wide"><Slider b={b} /></figure>;
  if (b.t === "quiz") return <div className="blk col">{b.q ? <Quiz b={b} /> : <Frame kind="Quiz" />}</div>;
  if (b.t === "map") return <figure className="blk wide"><MapBlock b={b} /></figure>;
  return null;
}

function Sources({ doc }) {
  const list = (kind) => (doc.sources || []).filter(s => (s.title || s.author) && (kind ? s.kind === kind : s.kind !== "academic" && s.kind !== "popular"));
  const row = (s) => { const c = citeOf(s), u = safeUrl(s.url); return <p key={s.id}>{c.lead} <i>{c.outlet}</i> {u && <a href={u} target="_blank" rel="noopener noreferrer">{u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</a>}</p>; };
  const groups = [["Academic sources", list("academic")], ["Popular press sources", list("popular")], ["Other sources", list("")]].filter(g => g[1].length);
  return <div className="blk wide">
    {groups.length > 0 && <div className="srcs">{groups.map(([name, rows]) => <div key={name}><h3>{name}</h3>{rows.map(row)}</div>)}</div>}
    <div className="foot">
      <div><span className="lab">Made by</span>{(doc.names || []).join(" and ")}{doc.term && <><br />{doc.term}</>}{doc.interview && <><br />Interview: {doc.interview}</>}</div>
      {doc.ai && <div><span className="lab">How AI was used</span>{doc.ai}</div>}
    </div>
  </div>;
}

function Cover({ doc }) {
  const pic = srcUrl(doc.cover?.url);
  return <header className={"cover" + (pic ? " pic" : "")}>
    {pic && <img src={pic} alt={doc.cover.alt || ""} />}
    <div className="in gut">
      <span className="tick" />
      <h1 className="hd">{doc.headline || "Your headline"}</h1>
      {doc.summary && <p className="sum">{doc.summary}</p>}
      <div className="by lab"><span>{(doc.names || []).join(" and ")}</span>{doc.term && <span>{doc.term}</span>}</div>
    </div>
    {pic && doc.cover.credit && <span className="cred">{doc.cover.credit}</span>}
  </header>;
}

function OwnHtml({ url }) {
  const [html, setHtml] = useState(null);
  useEffect(() => { let on = true; const u = safeUrl(url); if (!u) return; fetch(u).then(r => r.text()).then(t => { if (on) setHtml(t); }).catch(() => { if (on) setHtml(""); }); return () => { on = false; }; }, [url]);
  if (!safeUrl(url)) return <div className="gut"><div className="blk col"><Frame kind="Your HTML file" /></div></div>;
  // No allow-same-origin: the file runs as a stranger and cannot read anyone's sign-in.
  return html == null ? null : <iframe className="own" title="The project" sandbox="allow-scripts allow-popups" srcDoc={html} />;
}

/**
 * The exhibit. page and onPage let the builder hold which page is open;
 * around(block, node) lets a page wrap each block (the builder's click to
 * edit, the preview's notes); narrow forces the phone layout in a small pane.
 */
export default function Reader({ doc, page, onPage, around, narrow, scrollEl }) {
  useExhibitFonts();
  const root = useRef(null);
  // A link can name its page: /exhibits/<slug>#3 opens on the third.
  const [own, setOwn] = useState(() => { const n = parseInt(String(typeof window !== "undefined" ? window.location.hash : "").slice(1), 10); return n > 0 ? n - 1 : 0; });
  const [pop, setPop] = useState(null);
  const [small, setSmall] = useState(false);
  const pages = doc.pages || [];
  const scroll = doc.layout === "scroll";
  const cur = Math.min(page ?? own, Math.max(0, pages.length - 1));
  const sources = doc.sources || [];
  const exhibit = doc.way === "exhibit" || !doc.way;

  useEffect(() => {
    if (!root.current || typeof ResizeObserver !== "function") return;
    const ro = new ResizeObserver(([e]) => setSmall(e.contentRect.width < 760));
    ro.observe(root.current); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!pop) return;
    const off = (e) => { if (!e.target.closest || !e.target.closest(".pop")) setPop(null); };
    const key = (e) => { if (e.key === "Escape") setPop(null); };
    document.addEventListener("click", off); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("click", off); document.removeEventListener("keydown", key); };
  }, [pop]);

  const onSource = (id, el) => {
    if (pop?.id === id) return setPop(null);
    const r = el.getBoundingClientRect(), a = root.current.getBoundingClientRect();
    const w = Math.min(400, a.width - 32);
    setPop({ id, left: Math.max(16, Math.min(r.left - a.left, a.width - w - 16)), top: r.bottom - a.top + 10 });
  };
  const go = (i) => {
    setPop(null);
    if (scroll) { const t = root.current?.querySelector(`[data-page="${i}"]`); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); if (onPage) onPage(i); return; }
    if (onPage) onPage(i); else setOwn(i);
    const top = scrollEl?.current || null; if (top) top.scrollTo({ top: 0 }); else window.scrollTo(0, 0);
  };

  const body = (p, i, head) => {
    const out = []; let firstText = i === 0;
    const blocks = p.blocks || [];
    blocks.forEach((b, k) => {
      // A photo set beside text rides in the text block after the photo.
      const prev = blocks[k - 1];
      const wrap = b.t === "text" && prev && prev.t === "photo" && prev.size === "wrap" ? prev : null;
      if (b.t === "photo" && b.size === "wrap" && blocks[k + 1]?.t === "text") { if (around) out.push(<div key={b.id}>{around(b, null)}</div>); return; }
      const lone = b.t === "photo" && b.size === "wrap" ? { ...b, size: "col" } : b;
      const node = <Block b={lone} first={b.t === "text" && firstText} sources={sources} onSource={onSource} open={pop?.id} wrap={wrap} />;
      if (b.t === "text") firstText = false;
      const held = around ? around(b, node) : node;
      out.push(b.t === "quote" ? <div key={b.id}>{held}</div> : <div className="gut" key={b.id}>{held}</div>);
    });
    return <section key={p.id} data-page={i}>
      {head && <>{scroll && <div className="rule" />}<div className="phead gut"><div className="lab">{i + 1} of {pages.length}</div><h2 className="hd">{p.name}</h2></div></>}
      {out}
      {i === pages.length - 1 && <div className="gut"><Sources doc={doc} /></div>}
    </section>;
  };

  const bar = exhibit && pages.length > 1 ? <nav className="bar" aria-label="Pages"><div className="in gut">
    <div className="ttl">{doc.headline}</div>
    <div className="tabs">{pages.map((p, i) => <button type="button" key={p.id} aria-current={!scroll && i === cur} onClick={() => go(i)}>{p.name || "Page " + (i + 1)}</button>)}</div>
  </div></nav> : null;
  const s = pop ? sources.find(x => x.id === pop.id) : null;
  const cite = s ? citeOf(s) : null;

  return <div className={"xr" + (narrow || small ? " narrow" : "")} data-pal={doc.pal} data-type={doc.type} ref={root}>
    <style>{CSS}</style>
    {!exhibit ? <>
      <Cover doc={doc} />
      {doc.way === "film" ? <div className="gut"><div className="film">{videoOf(doc.film?.url) ? <div className="video"><iframe src={videoOf(doc.film.url).src} title={doc.headline || "The film"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /></div> : <Frame kind="Your film" />}</div><Sources doc={doc} /></div>
        : <><OwnHtml url={doc.html?.url} /><div className="gut"><Sources doc={doc} /></div></>}
    </> : scroll ? <>
      <Cover doc={doc} />{bar}
      {pages.map((p, i) => body(p, i, i > 0))}
    </> : <>
      {cur === 0 && <Cover doc={doc} />}{bar}
      {pages[cur] && body(pages[cur], cur, cur > 0)}
      {pages[cur + 1] && <button type="button" className="next" onClick={() => go(cur + 1)}><div className="in gut"><div><div className="lab">Next</div><div className="hd">{pages[cur + 1].name}</div></div><span className="ar">{Icon.arrow()}</span></div></button>}
    </>}
    <div className="end" />
    {s && <div className="pop" role="dialog" aria-label="Source" style={{ left: pop.left, top: pop.top }}>
      <div className="lab">{s.kind === "academic" ? "Academic source" : s.kind === "popular" ? "Popular press source" : "Source"}</div>
      <p className="cite">{cite.lead} <i>{cite.outlet}</i></p>
      {s.note && <p className="note"><b>Why the makers used the source</b>{s.note}</p>}
      {safeUrl(s.url) && <a href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer">Open the source</a>}
    </div>}
  </div>;
}
