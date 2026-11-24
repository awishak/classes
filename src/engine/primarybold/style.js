// The Primary Bold pages' stylesheet: the mockup's own rules (mockup.css.js, made
// by scripts/primary-bold-style-from-mockup.mjs) and, after them, what a real page
// needs that a mockup in a frame did not.
//
// The rules Andrew settled on are in docs/primary-bold/BRIEF.md. The ones
// that show up here: nothing under 14px, selected means a dark outline and
// the rest fades, no shadows or glow, bars do not replay.

import { MOCKUP_CSS } from "./mockup.css.js";

export const PRIMARY_BOLD_FONTS = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Outfit:wght@400;500;600;700&display=swap";

const PAGE_CSS = `
.pbold{font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;font-size:16px;line-height:1.35;-webkit-font-smoothing:antialiased;text-align:left}
.pbold *{box-sizing:border-box}
.pbold p,.pbold h1,.pbold h2,.pbold h3{margin:0}
.pbold button,.pbold textarea,.pbold select,.pbold input{font:inherit;color:inherit}
.pbold button{cursor:pointer}
.pbold a{color:inherit}
.pbold.page{border:0;border-radius:0;min-height:100vh;overflow:visible;display:flex;flex-direction:column}
.pbold.page.lite,.pbold.page.sky{background:var(--bg)}
.pbold .in{max-width:1180px;width:100%;margin:0 auto}
.pbold.page .bar{position:sticky;top:0;z-index:10;background:var(--bg)}
.pbold.page .bar > .in{display:flex;align-items:center;gap:4px 10px;flex-wrap:wrap}
.pbold .cls b{color:var(--c118);font-weight:600}
.pbold.c3 .cls b{color:var(--c3)}
.pbold.c3{--c118:var(--c3)}
.pbold .s-late{--w:var(--bad)}
.pbold .row.s-late{background:color-mix(in srgb,var(--bad) 12%,transparent)}
.pbold .tile.wide{width:auto;min-width:32px;padding:0 9px;font-size:14px}
.pbold .tile.lg.wide{min-width:60px;padding:0 14px;font-size:17px;line-height:1.15;text-align:center}
.pbold .say p{white-space:pre-wrap;overflow-wrap:anywhere}
.pbold .text{white-space:pre-wrap;overflow-wrap:anywhere;max-width:68ch}
.pbold .lnk{color:var(--ink);font-weight:600;text-underline-offset:3px}
.pbold .write.area{border-radius:14px;min-height:76px;padding:9px 14px;resize:vertical;width:100%}
.pbold .hero a{color:#fff}
.pbold .menu{position:relative}
.pbold .menu .drop{position:absolute;right:0;top:calc(100% + 8px);z-index:20;min-width:220px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:8px}
.pbold .menu .drop .rowx{gap:4px}
.pbold .old{background:var(--surface-page,#fafaf9);color:var(--text-primary,#1c1917);border:1px solid var(--line);border-radius:18px;padding:14px}
.pbold .who{display:flex;flex-direction:column;gap:6px}
.pbold .who .t1{overflow-wrap:anywhere}
.pbold .empty{color:var(--dim);padding:10px 8px}
.pbold .day .when{color:var(--dim);white-space:nowrap}
.pbold .dueit{min-height:32px}
.pbold .read{display:block;color:var(--ink);text-decoration:none;overflow-wrap:anywhere}
.pbold .read small{display:block;color:var(--dim);font-size:14px}
.pbold .zone button.cell{border:0;background:none;padding:0}
@media (prefers-reduced-motion:reduce){ .pbold *{animation:none!important;transition:none!important} }
`;

export const PRIMARY_BOLD_CSS = MOCKUP_CSS + PAGE_CSS;
