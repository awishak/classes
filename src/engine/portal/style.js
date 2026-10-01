// The portal's own stylesheet: the row language from the student portal
// canvas of 2026-09-30, drawn in the language of fieldtime.net/mockup.
//
// Every row is a tinted card whose colour says what kind of thing it is:
// amber is something to do, green is done, blue came from Dr. Ishak, grey is
// the student's own, faded is not open yet. Every row carries its own button
// at the right, and the right rail only ever holds something short: a check,
// Submit, Open, a chevron. Anything wider goes under the words. Twelve pixels
// of rounding on anything you press, and the action a row exists for is
// filled in the class colour.
//
// The greys, the surfaces and the state colours come from the theme's tokens.
// The tints are the portal's alone, with a night of their own, because the
// tokens have no pastels and a tint is a background rather than a readable
// value. The ink on each tint clears 4.5:1 on that tint by day and by night.

export const PORTAL_CSS = `
.pt-root{
  --pt-due:#fdf1e6;--pt-due-ink:#7c3a05;
  --pt-done:#e3f1e7;--pt-done-ink:#1b6b3a;
  --pt-dr:#e3ecf7;--pt-dr-ink:#2c4f80;
  --pt-me:var(--surface-sunk);--pt-me-ink:var(--text-secondary);
  --pt-late:#fbe7e4;--pt-late-ink:#8b2a1f;
  --pt-hero:#4c1d95;--pt-hero-dim:#d9c8ff;
  --pt-serif:'Lora',Georgia,serif;
}
@media (prefers-color-scheme: dark){
  .pt-root[data-theme="clean"]:not([data-mode="day"]){
    --pt-due:#3a2a14;--pt-due-ink:#f0b45c;--pt-done:#163124;--pt-done-ink:#5ecfa8;
    --pt-dr:#1a2638;--pt-dr-ink:#9cb7dc;--pt-late:#3a1c1c;--pt-late-ink:#ff9c8f;--pt-hero:#3b1a75;
  }
}
.pt-root[data-theme="clean"][data-mode="night"]{
  --pt-due:#3a2a14;--pt-due-ink:#f0b45c;--pt-done:#163124;--pt-done-ink:#5ecfa8;
  --pt-dr:#1a2638;--pt-dr-ink:#9cb7dc;--pt-late:#3a1c1c;--pt-late-ink:#ff9c8f;--pt-hero:#3b1a75;
}
.pt-root{font-family:var(--font-body,'Outfit',-apple-system,sans-serif);color:var(--text-primary)}
.pt-root *{box-sizing:border-box}
.pt-root p,.pt-root h1,.pt-root h2,.pt-root h3{margin:0}
.pt-root button,.pt-root input,.pt-root textarea,.pt-root select{font:inherit;color:inherit}
.pt-root button{cursor:pointer}
.pt-focus:focus-visible{outline:2px solid var(--ca-accent);outline-offset:2px;border-radius:8px}

.pt-h1{font-family:var(--pt-serif);font-size:32px;font-weight:500;line-height:1;letter-spacing:0}
.pt-sub{font-size:17px;color:var(--text-secondary)}
.pt-sec{display:flex;align-items:baseline;gap:8px;padding:0 4px}
.pt-secName{font-family:var(--pt-serif);font-size:20px;font-weight:600}
.pt-secSub{font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;font-weight:500}
.pt-sechead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 4px}
.pt-day{display:flex;flex-direction:column;gap:10px}
.pt-stack{display:flex;flex-direction:column;gap:8px}
.pt-body{display:flex;flex-direction:column;gap:20px}

.pt-row{display:flex;align-items:center;gap:12px;padding:14px 16px;border:0;border-radius:16px;background:var(--surface-card);box-shadow:0 0 0 1px var(--line-soft);text-align:left;width:100%}
.pt-row.due{background:var(--pt-due);box-shadow:none}
.pt-row.done{background:var(--pt-done);box-shadow:none}
.pt-row.dr{background:var(--pt-dr);box-shadow:none}
.pt-row.me{background:var(--pt-me);box-shadow:none}
.pt-row.late{background:var(--pt-late);box-shadow:none}
.pt-row.off{background:var(--pt-me);box-shadow:none;color:var(--text-muted)}
.pt-row.ring{box-shadow:inset 0 0 0 2px var(--ca-accent)}
.pt-row.right{flex-direction:row-reverse}
.pt-row.link{cursor:pointer}
.pt-dcol{width:40px;flex:none;text-align:center;line-height:1.1;display:flex;flex-direction:column;align-items:center;gap:2px}
.pt-dw{font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em}
.pt-dn{font-size:20px;font-weight:600}
.pt-row.off .pt-dn{color:var(--text-muted)}
.pt-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:4px;background:none;border:0;padding:0;text-align:left;color:inherit}
.pt-title{font-size:17px;font-weight:600;line-height:1.25;overflow-wrap:anywhere}
.pt-title.say{font-weight:500}
.pt-kind{font-weight:500}
.pt-row.due .pt-kind{color:var(--pt-due-ink)}.pt-row.done .pt-kind{color:var(--pt-done-ink)}.pt-row.dr .pt-kind{color:var(--pt-dr-ink)}.pt-row.late .pt-kind{color:var(--pt-late-ink)}
.pt-when{font-size:15px;font-weight:600;line-height:1.3;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pt-when.due{color:var(--pt-due-ink)}.pt-when.done{color:var(--pt-done-ink)}.pt-when.off{color:var(--text-muted)}.pt-when.late{color:var(--pt-late-ink)}
.pt-meta{font-size:13px;color:var(--text-secondary);line-height:1.35;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.pt-gm{font-size:13px;font-weight:600;color:var(--text-primary);background:var(--surface-card);padding:1px 8px;border-radius:999px}
.pt-row.off .pt-gm{color:var(--text-muted)}
.pt-text{font-size:15px;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere}
.pt-side{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex:none;max-width:96px}
.pt-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;align-items:center}
.pt-chev{font-size:22px;line-height:1;color:var(--text-muted)}
.pt-quiet{font-size:13px;color:var(--text-secondary);padding:0 4px;line-height:1.35}

.pt-btn{font-size:15px;font-weight:600;border:0;border-radius:12px;min-height:44px;padding:0 16px;color:#fff;background:var(--ca-accent);display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;white-space:nowrap}
.pt-btn.light{background:#fff;color:var(--pt-hero)}
.pt-btn.glass{background:rgba(255,255,255,.16);color:#fff}
.pt-btn.plain{background:var(--surface-card);color:var(--text-primary);box-shadow:0 0 0 1px var(--line-strong)}
.pt-btn.wide{width:100%}
.pt-btn:disabled{opacity:.5;cursor:default}
.pt-io{font-size:14px;font-weight:600;min-height:36px;padding:0 12px;border-radius:12px;border:0;background:var(--surface-card);box-shadow:0 0 0 1px var(--line-strong);color:var(--text-primary);white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none}
.pt-io.go{background:var(--ca-accent);color:#fff;box-shadow:none}
.pt-io.off{background:var(--surface-card);color:var(--text-muted);box-shadow:0 0 0 1px var(--line-strong);cursor:not-allowed}
.pt-io.ok{background:var(--state-ok);color:#fff;box-shadow:none;width:36px;padding:0;border-radius:999px}
.pt-chip{font-size:15px;font-weight:500;min-height:40px;padding:0 14px;border-radius:12px;border:0;background:var(--surface-card);color:var(--text-primary);box-shadow:0 0 0 1px var(--line-strong);display:inline-flex;align-items:center;gap:8px;white-space:nowrap;text-decoration:none}
.pt-chip.on{background:var(--text-primary);color:var(--surface-page);box-shadow:none}
.pt-chip.due{background:var(--pt-due);color:var(--pt-due-ink);box-shadow:none}
.pt-chip.done{background:var(--pt-done);color:var(--pt-done-ink);box-shadow:none}
.pt-chip.dr{background:var(--pt-dr);color:var(--pt-dr-ink);box-shadow:none}
.pt-chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.pt-chips::-webkit-scrollbar{display:none}
.pt-seg{display:inline-flex;gap:2px;background:var(--surface-sunk);border-radius:12px;padding:3px}
.pt-seg button{font-size:15px;font-weight:600;border:0;background:transparent;color:var(--text-secondary);border-radius:10px;min-height:38px;padding:0 16px}
.pt-seg .on{background:var(--surface-card);color:var(--text-primary);box-shadow:0 1px 2px rgba(28,25,23,.12)}
.pt-field{width:100%;min-height:44px;padding:10px 12px;border-radius:12px;border:0;box-shadow:0 0 0 1px var(--line-strong);background:var(--surface-card);font-size:16px;color:var(--text-primary)}
textarea.pt-field{resize:vertical;min-height:64px;line-height:1.5}
.pt-lab{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);margin:12px 0 6px}
.pt-lab:first-child{margin-top:0}
.pt-lnk{display:inline-flex;align-items:center;gap:4px;color:var(--ca-accent-ink);font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1.5px;min-height:28px;max-width:100%}
.pt-lnk span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pt-lnk svg{width:14px;height:14px;flex:none}

.pt-notice{background:var(--surface-sunk);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px}
.pt-notice .txt{flex:1;font-size:15px;line-height:1.35;min-width:0}
.pt-notice .txt b{font-weight:600}
.pt-hero{background:var(--pt-hero);color:#fff;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:16px}
.pt-eyebrow{font-size:13px;text-transform:uppercase;letter-spacing:.08em;font-weight:600;color:var(--pt-hero-dim);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pt-heroPill{font-size:13px;font-weight:600;background:rgba(255,255,255,.16);padding:4px 10px;border-radius:999px;color:#fff;letter-spacing:0;text-transform:none}
.pt-heroDate{font-family:var(--pt-serif);font-size:32px;font-weight:500;line-height:1.05}
.pt-heroWhat{font-size:20px;font-weight:500;line-height:1.3}
.pt-heroNote{font-size:17px;line-height:1.5;white-space:pre-wrap;border-left:3px solid rgba(255,255,255,.4);padding-left:12px}
.pt-hero .pt-coming label{color:#fff}

.pt-face{border-radius:999px;object-fit:cover;flex:none;background:var(--surface-sunk)}
.pt-badge{border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:700;letter-spacing:.02em;flex:none;background:var(--surface-sunk);color:var(--ca-accent-ink)}
.pt-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pt-person{background:var(--surface-card);border-radius:16px;box-shadow:0 0 0 1px var(--line-soft);padding:16px 12px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;border:0}
.pt-person .nm{font-size:15px;font-weight:600;line-height:1.25}
.pt-person .sm{font-size:13px;color:var(--text-secondary)}
.pt-mine{background:var(--surface-card);border-radius:16px;box-shadow:inset 0 0 0 2px var(--ca-accent);padding:16px;display:flex;gap:14px;align-items:center}

.pt-tabs{display:flex;align-items:stretch;padding:8px 12px calc(14px + env(safe-area-inset-bottom,0px));background:var(--surface-card);box-shadow:0 -1px 0 var(--line-soft);position:sticky;bottom:0;z-index:5}
.pt-tab{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-height:44px;justify-content:center;font-size:13px;font-weight:500;color:var(--text-muted);background:transparent;border:0;text-decoration:none}
.pt-tab svg{width:22px;height:22px}
.pt-tab.on{color:var(--ca-accent-ink);font-weight:600}

.pt-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pt-tile{background:var(--surface-card);border-radius:16px;box-shadow:0 0 0 1px var(--line-soft);padding:14px 12px;display:flex;flex-direction:column;gap:2px}
.pt-tileN{font-family:var(--pt-serif);font-size:32px;font-weight:500;line-height:1}
.pt-tileL{font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;font-weight:500}
.pt-grades{display:flex;flex-direction:column}
.pt-grades .r{display:flex;align-items:center;gap:10px;min-height:52px;box-shadow:0 1px 0 var(--line-soft);font-size:15px;background:none;border:0;width:100%;text-align:left;padding:0;color:inherit}
.pt-grades .r:last-child{box-shadow:none}
.pt-grades .w{font-family:var(--font-label);font-size:13px;color:var(--text-secondary);width:36px;text-align:right;flex:none}
.pt-grades .g{margin-left:auto;white-space:nowrap;display:flex;align-items:center;gap:8px}
.pt-gpill{min-height:32px;padding:0 10px;font-size:13px;font-weight:600;border-radius:10px;display:inline-flex;align-items:center}
.pt-gpill.done{background:var(--pt-done);color:var(--pt-done-ink)}
.pt-gpill.off{background:var(--surface-sunk);color:var(--text-muted)}

.pt-titles{display:flex;gap:20px;align-items:baseline;flex-wrap:wrap}
.pt-titles button{font-family:var(--pt-serif);font-size:26px;font-weight:500;background:none;border:0;padding:0;min-height:44px;color:var(--text-muted);border-bottom:3px solid transparent}
.pt-titles button.on{color:var(--text-primary);border-bottom-color:var(--ca-accent)}
.pt-pane{background:var(--surface-card);border-radius:16px;box-shadow:0 0 0 1px var(--line-soft);display:flex;flex-direction:column;min-width:0}
.pt-pane-head{display:flex;flex-direction:column;gap:12px;padding:20px 20px 12px}
.pt-pane-body{display:flex;flex-direction:column;gap:16px;padding:4px 20px 20px}
.pt-compose{position:sticky;bottom:0;background:var(--surface-page);padding:12px 8px;box-shadow:0 -1px 0 var(--line-soft);display:flex;flex-direction:column;gap:8px}
.pt-pane .pt-compose{position:static;background:var(--surface-card);padding:12px 20px 20px;border-radius:0 0 16px 16px}
.pt-sw{width:44px;height:26px;border-radius:999px;background:var(--line-strong);position:relative;border:0;cursor:pointer;flex:none;padding:0}
.pt-sw::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:left .15s}
.pt-sw.on{background:var(--state-ok)}
.pt-sw.on::after{left:21px}
.pt-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;font-size:15px;font-weight:500}
.pt-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pt-empty{padding:28px 16px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center}
.pt-scrim{position:fixed;inset:0;background:rgba(28,25,23,.32);display:flex;flex-direction:column;justify-content:flex-end;z-index:30}
.pt-sheet{background:var(--surface-card);border-radius:24px 24px 0 0;padding:12px 20px calc(28px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:20px;max-height:90vh;overflow:auto;box-shadow:0 -8px 32px rgba(28,25,23,.16);width:100%;max-width:560px;margin:0 auto}
.pt-handle{width:40px;height:4px;border-radius:999px;background:var(--line-strong);align-self:center}
.pt-close{width:36px;height:36px;border-radius:999px;background:var(--surface-sunk);border:0;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);flex:none}
@media (prefers-reduced-motion: reduce){.pt-root *{transition:none!important}}
`;
