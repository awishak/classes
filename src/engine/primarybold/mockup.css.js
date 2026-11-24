// Written by scripts/primary-bold-style-from-mockup.mjs from docs/primary-bold. Do not edit by hand:
// change the mockup's stylesheet, or add a rule to style.js, and run the script.

export const MOCKUP_CSS = `
.pbold{--bg:#0a0f1f;--bg2:#141c3a;--card:#1a2346;--card2:#222d58;--line:#2c3866;--ink:#f5f7ff;--dim:#b4bee0;--mute:#8793bd;
  --go:#34d399;--due:#fbbf24;--warn:#fb923c;--bad:#fb7185;--none:#56618c;--c118:#60a5fa;--c3:#c4b5fd;--on:#0a0f1f;--shade:rgba(0,0,0,.45);
  color:var(--ink);background:radial-gradient(1100px 720px at 28% 18%,var(--bg2) 0%,var(--bg) 62%);border-radius:18px;overflow:hidden;border:1px solid var(--line)}
.pbold.lite{--bg:#f4f2ee;--bg2:#ffffff;--card:#ffffff;--card2:#ebe8e2;--line:#d9d4cb;--ink:#1c1917;--dim:#57534e;--mute:#78716c;
  --go:#1f9d63;--due:#e0a019;--warn:#e2702a;--bad:#d94a5a;--none:#bdb7ac;--c118:#2f5fd0;--c3:#7c4ddb;--on:#ffffff;--shade:rgba(60,50,40,.18)}
.pbold.sky{--bg:#f9faf8;--bg2:#ffffff;--card:#ffffff;--card2:#e8efeb;--line:#d5ddd8;--ink:#22302f;--dim:#4c5d5b;--mute:#71827f;
  --go:#2f8576;--due:#d9a927;--warn:#d9574b;--bad:#d9574b;--none:#b9c4c0;--c118:#3d7fb3;--c3:#7a68b8;--on:#ffffff;--ondue:#22302f;--shade:rgba(34,48,47,.16)}
.pbold.sky .t1{font-family:'Fraunces',Georgia,serif}
.pbold.sky .hero{background:linear-gradient(135deg,#22302f,#2f8576)}
.pbold.sky .hero .t3{color:#cfe6df}
.pbold{container-type:inline-size;margin:0 auto;width:100%;transition:max-width .35s cubic-bezier(.2,.8,.2,1)}
.pbold.phone{max-width:390px}
.pbold .pill.due,.pbold .pill em,.pbold .s-todo.tile,.pbold .s-todo.blk{color:var(--ondue,var(--on))}
.pbold .navs{display:flex;align-items:center;gap:10px;min-width:0}
.pbold .tip{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:min(92vw,560px);background:var(--pink);color:var(--page);border-radius:14px;padding:9px 14px;font-weight:500;box-shadow:0 14px 40px rgba(0,0,0,.35);z-index:20;animation:pbold-tip .25s ease both}
@keyframes pbold-tip{from{opacity:0;transform:translate(-50%,8px)}}
.pbold :focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.pbold .t1{font-size:22px;font-weight:600;letter-spacing:-.01em;line-height:1.15}
.pbold .t3{font-size:14px;font-weight:500;color:var(--mute)}
.pbold .bar{display:flex;align-items:center;gap:4px 10px;flex-wrap:wrap;padding:6px 14px;border-bottom:1px solid var(--line)}
.pbold .bar .cls{display:flex;align-items:center;gap:8px;margin-right:6px;font-weight:600;white-space:nowrap}
.pbold .bar .sq{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:var(--c118);color:var(--on);font-size:11px;font-weight:700}
.pbold .bar nav{display:flex;flex-wrap:wrap;gap:2px}
.pbold .bar .sep{width:1px;height:18px;background:var(--line)}
.pbold .bar .grow{flex:1}
.pbold .pill{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap;transition:transform .12s,background .15s,border-color .15s,filter .15s}
.pbold .pill:hover{border-color:var(--dim)}
.pbold .pill:active{transform:scale(.96)}
.pbold .pill.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.pbold .pill.go{background:var(--go);border-color:var(--go);color:var(--on)}
.pbold .pill.due{background:var(--due);border-color:var(--due);color:var(--on)}
.pbold .pill.flat{background:none;border-color:transparent;color:var(--dim);padding:0 9px}
.pbold .pill.flat.on{background:var(--card2);color:var(--ink)}
.pbold .pill em{font-style:normal;font-size:14px;font-weight:700;background:var(--due);color:var(--on);border-radius:999px;padding:1px 7px}
.pbold .pill.done{border-color:var(--go);color:var(--go);background:none}
.pbold .body{padding:12px 14px 16px;display:flex;flex-direction:column;gap:12px}
.pbold .rowx{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}
.pbold .rowx .sp{flex:1}
.pbold .main{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,340px);gap:14px;align-items:start}
.pbold .panel{background:color-mix(in srgb,var(--card) 88%,transparent);border:1px solid var(--line);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0;animation:pbold-rise .3s ease both}
.pbold .panel .hd{display:flex;gap:12px;align-items:center}
@keyframes pbold-rise{from{opacity:0;transform:translateY(8px)}}
@keyframes pbold-pop{from{transform:scale(1)}}
@keyframes pbold-grow{from{transform:scaleX(0)}}
@keyframes pbold-burst{0%{transform:scale(1)}25%{transform:scale(1.4)}100%{transform:scale(1)}}
@keyframes pbold-stamp{from{opacity:0;transform:rotate(-18deg) scale(2.4)}}
@keyframes pbold-shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
@keyframes pbold-pulse{50%{box-shadow:0 0 0 3px color-mix(in srgb,var(--due) 45%,transparent)}}
.pbold .face{position:relative;flex:none;border-radius:50%;padding:3px;border:0;background:var(--w,var(--none));display:grid;place-items:center;transition:transform .18s,opacity .3s}
.pbold button.face:hover{transform:scale(1.1);z-index:3}
.pbold .face .disc{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:600;color:#fff;background:hsl(var(--h,260) 38% 44%);pointer-events:none}
.pbold .face.sm{padding:2px}
.pbold .face.sm .disc{width:24px;height:24px;font-size:10px}
.pbold .face.lg .disc{width:58px;height:58px;font-size:20px}
.pbold .face.hollow{background:transparent;box-shadow:inset 0 0 0 2px var(--none)}
.pbold .face.hollow .disc{filter:grayscale(1) brightness(.7)}
.pbold .face.sel{outline:3px solid var(--ink);outline-offset:2px;z-index:4}
.pbold .face.glow{outline:3px solid var(--w);outline-offset:2px}
.pbold .face.burst{animation:pbold-burst 1s cubic-bezier(.2,.9,.2,1)}
.pbold .face .tick{position:absolute;right:-10px;bottom:-7px;min-width:24px;height:22px;padding:0 5px;border-radius:999px;background:var(--go);color:var(--on);font-size:14px;font-weight:700;display:grid;place-items:center;box-shadow:0 0 0 2px var(--bg)}
.pbold .cell{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:58px;transition:opacity .3s}
.pbold .cell.dim{opacity:.25}
.pbold .cell .t3{white-space:nowrap}
.pbold .cell.on .t3{color:var(--ink);font-weight:600}
.pbold .faces{display:flex;align-items:center}
.pbold .faces .face{margin-left:-8px}
.pbold .faces .face:first-child{margin-left:0}
.pbold .s-done{--w:var(--go)}
.pbold .s-todo{--w:var(--due)}
.pbold .s-in{--w:color-mix(in srgb,var(--go) 45%,var(--none))}
.pbold .s-off{--w:var(--none)}
.pbold .s-on{--w:var(--go)}
.pbold .tile{flex:none;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;font-size:14px;font-weight:700;background:var(--w);color:var(--on)}
.pbold .tile.lg{width:60px;height:60px;border-radius:16px;font-size:26px}
.pbold .s-on.tile,.pbold .s-on.blk{background:repeating-linear-gradient(135deg,var(--go) 0 8px,color-mix(in srgb,var(--go) 60%,var(--bg)) 8px 16px)}
.pbold .strip{display:flex;gap:3px;height:54px;align-items:stretch}
.pbold .blk{flex:var(--x) 1 0;min-width:12px;padding:0;border:0;border-radius:9px;background:var(--w);color:var(--on);font-size:18px;font-weight:700;overflow:hidden;transition:transform .18s,opacity .3s,box-shadow .25s}
.pbold .blk:hover{filter:brightness(1.08)}
.pbold .blk.sel{outline:3px solid var(--ink);outline-offset:2px;z-index:2}
.pbold .blk.dim{opacity:.4}
.pbold .key{display:flex;flex-wrap:wrap;gap:3px 14px}
.pbold .key span{display:inline-flex;align-items:center;gap:6px}
.pbold .dot{width:10px;height:10px;border-radius:50%;background:var(--w);flex:none}
.pbold .dot.sq{border-radius:3px}
.pbold .hero{background:linear-gradient(135deg,#4c1d95,#2a1466);color:#fff;border-radius:18px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}
.pbold .hero .t3{color:#d9c8ff}
.pbold .hero hr{border:0;border-top:1px solid rgba(255,255,255,.16);margin:6px 0 4px;width:100%}
.pbold .say{display:flex;gap:10px;align-items:center;background:color-mix(in srgb,var(--c118) 14%,transparent);border-radius:16px;padding:10px 12px}
.pbold .say p{font-size:17px;font-weight:500;line-height:1.3}
.pbold .list{display:flex;flex-direction:column;gap:2px}
.pbold .row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 12px;align-items:center;padding:5px 8px;border:0;border-radius:12px;background:none;text-align:left;font-weight:500;transition:background .15s,opacity .3s,transform .15s}
.pbold .row:hover{background:var(--card)}
.pbold .row.sel{outline:2px solid var(--ink);outline-offset:-2px}
.pbold .row.s-todo{background:color-mix(in srgb,var(--due) 14%,transparent)}
.pbold .row.s-off{color:var(--mute)}
.pbold .wbar{display:flex;align-items:center;gap:6px}
.pbold .wbar i{display:block;height:8px;border-radius:999px;background:var(--w);transform-origin:left;min-width:3px}
.pbold .grow{animation:pbold-grow .6s cubic-bezier(.2,.8,.2,1) both}
.pbold .mo{padding:8px 8px 2px}
.pbold .row .dt{color:var(--dim);white-space:nowrap}
.pbold .still .grow,.pbold .still .tl::before{animation:none}
.pbold .main.work{grid-template-columns:minmax(240px,330px) minmax(0,1fr)}
.pbold .main.work .panel{padding:18px;gap:14px}
.pbold .sk{display:flex;flex-direction:column;gap:9px}
.pbold .sk i{display:block;height:12px;border-radius:6px;background:var(--card2)}
.pbold .blk.now{--w:var(--c118)}
.pbold .day{display:grid;grid-template-columns:104px minmax(0,1fr) auto;gap:6px 12px;align-items:start;padding:8px;border-radius:12px;border:2px solid transparent}
.pbold .day.next{border-color:var(--c118)}
.pbold .dm{display:flex;flex-direction:column;gap:6px;min-width:0}
.pbold .sunk{background:var(--card2);border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
.pbold .sunk .sk i{background:var(--line)}
.pbold .dueit{color:var(--ink);display:flex;align-items:center;gap:8px;border:0;background:none;padding:0;text-align:left;font-weight:500}
.pbold .th{display:flex;flex-direction:column;gap:14px;max-width:760px;width:100%;margin:0 auto}
.pbold .qa{display:flex;flex-direction:column;gap:5px}
.pbold .bub{display:flex;gap:8px;align-items:flex-end}
.pbold .bub .b{background:var(--card);border:1px solid var(--line);border-radius:18px 18px 18px 4px;padding:8px 14px;max-width:540px;font-size:17px;font-weight:500;text-align:left;color:var(--ink)}
.pbold button.b{transition:transform .12s,border-color .15s}
.pbold button.b:hover{border-color:var(--dim)}
.pbold button.b:active{transform:scale(.98)}
.pbold .bub.his{flex-direction:row-reverse;animation:pbold-rise .25s ease both}
.pbold .bub.his .b{background:color-mix(in srgb,var(--c118) 14%,var(--card));border-color:transparent;border-radius:18px 18px 4px 18px;flex:0 1 420px}
.pbold .bub.ask .b{flex:1;max-width:none;padding:4px;border-radius:999px;display:flex;gap:6px}
.pbold .bub.ask .write{border:0;background:none}
.pbold .meta{display:flex;gap:6px;align-items:center;margin-left:40px}
.pbold .blk.wd{font-size:14px}
.pbold .me{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.pbold .back{display:none;align-self:flex-start;padding-left:4px;color:var(--ink)}
.pbold .tl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 6px;position:relative;max-width:560px}
.pbold .tl::after{content:"";position:absolute;left:6px;width:66.6%;top:5px;height:2px;background:var(--line)}
.pbold .tl::before{content:"";position:absolute;left:6px;width:var(--p,66.6%);z-index:1;top:5px;height:2px;background:var(--go);transform-origin:left;animation:pbold-grow .7s ease both}
.pbold .tl span{display:flex;flex-direction:column;gap:1px;padding-top:16px;position:relative;font-weight:500}
.pbold .tl span::before{content:"";position:absolute;z-index:2;left:0;top:0;width:12px;height:12px;border-radius:50%;background:var(--go);box-shadow:0 0 0 3px var(--card)}
.pbold .tl span.no::before{background:var(--card);box-shadow:inset 0 0 0 2px var(--none),0 0 0 3px var(--card)}
.pbold .tl span.no{color:var(--mute)}
.pbold .write{flex:1;min-width:200px;min-height:32px;border:1px solid var(--line);border-radius:999px;background:var(--bg);color:var(--ink);padding:5px 14px}
.pbold .write::placeholder{color:var(--mute)}
.pbold .shake{animation:pbold-shake .4s}
.pbold .stamp{font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--go);border:2px solid var(--go);border-radius:8px;padding:2px 8px;transform:rotate(-6deg);animation:pbold-stamp .45s cubic-bezier(.2,1.6,.4,1) both}
.pbold .flow{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 12px;align-items:center;padding:7px 8px;border-radius:14px;transition:background .15s}
.pbold .flow:hover,.pbold .flow.open{background:var(--card)}
.pbold .flow .spread{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px 6px;padding:4px 0 2px;animation:pbold-rise .25s ease both}
.pbold .flow b{font-weight:600}
.pbold .pilerow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) 52px auto;gap:4px 14px;align-items:center;padding:6px 8px;border-radius:14px;transition:background .15s,opacity .3s}
.pbold .pilerow:hover{background:var(--card)}
.pbold .pilerow.sel{outline:2px solid var(--ink);outline-offset:-2px}
.pbold .pilerow.dim{opacity:.3}
.pbold .pilerow b{font-weight:600}
.pbold .stack{display:flex;height:16px;border-radius:999px;overflow:hidden;background:color-mix(in srgb,var(--none) 45%,var(--card))}
.pbold .stack i{display:block;min-width:5px;background:var(--w);transform-origin:left}
.pbold .stack i.p{background:var(--due)}
.pbold .stack i.n{background:none}
.pbold .num{font-size:22px;font-weight:600;color:var(--due);text-align:right;font-variant-numeric:tabular-nums;line-height:1}
.pbold .old{color:var(--bad)}
.pbold .total{display:flex;height:16px;border-radius:999px;overflow:hidden;background:color-mix(in srgb,var(--none) 45%,var(--card))}
.pbold .total i{display:block;min-width:4px;transform-origin:left}
.pbold .zone{display:flex;flex-direction:column;gap:6px;padding:8px 10px;border-radius:20px;border:2px dashed var(--c,var(--line));background:color-mix(in srgb,var(--c,var(--line)) 8%,transparent);transition:background .2s,box-shadow .2s}
.pbold .zone.solid{border-style:solid}
.pbold .zone.lit{background:color-mix(in srgb,var(--c,var(--ink)) 22%,transparent);cursor:pointer}
.pbold .zone .zb{display:flex;flex-wrap:wrap;gap:8px 6px;min-height:20px}
.pbold .zone .zh{display:flex;justify-content:space-between;align-items:baseline;gap:6px}
.pbold .scale{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.pbold .scale .zone{min-height:118px}
.pbold .others{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.pbold .others .zone{padding:6px 10px}
.pbold .zones{display:flex;flex-direction:column;gap:8px}
@container (min-width:1000px){
  .pbold .bar{flex-wrap:nowrap}
  .pbold .bar nav{flex-wrap:nowrap}
}
@container (max-width:860px){
  .pbold .main{grid-template-columns:1fr!important}
  .pbold .navs{order:3;width:100%;overflow-x:auto;scrollbar-width:none}
  .pbold .navs nav{flex-wrap:nowrap}
  .pbold .bar .grow{display:none}
  .pbold .bar .cls{flex:1}
  .pbold .hero + .panel{order:-1}
  .pbold .day{grid-template-columns:minmax(0,1fr) auto}
  .pbold .day .dm{grid-column:1/-1;grid-row:2}
  .pbold .strip.weeks{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));height:auto!important;gap:5px}
  .pbold .strip.weeks .blk{height:46px;min-width:0}
  .pbold .main.work .side{display:none}
  .pbold .main.work.opened .side{display:block}
  .pbold .main.work.opened .list{display:none}
  .pbold .isopen .back{display:inline-flex}
  .pbold .isopen .whead{display:none}
  .pbold .pilerow{grid-template-columns:minmax(0,1fr) 52px auto}
  .pbold .pilerow .stack{grid-column:1/-1;grid-row:2}
  .pbold .scale{grid-template-columns:1fr 1fr}
  .pbold .others{grid-template-columns:1fr 1fr}
}
@container (max-width:520px){
  .pbold .strip{gap:2px;height:46px}
  .pbold .blk{min-width:8px;border-radius:6px}
  .pbold .blk.mid{font-size:0}
}
@media (prefers-reduced-motion:reduce){
  .pbold *{animation:none!important;transition:none!important}
}
`;
