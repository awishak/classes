// A note from him, drawn the same on the review's preview and on the
// student's page.

// A note is paragraphs with blank lines between; a paragraph that opens with
// "1. " is a numbered point.
export function NoteBody({ note }) {
  const blocks = String(note || "").split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const out = [];
  let list = null;
  blocks.forEach((b, i) => {
    const m = b.match(/^(\d+)\.\s+([\s\S]*)$/);
    if (m) {
      // Andrew, 2026-11-12: "each piece of the one to 3 piece of advice that
      // I give, you need to give it a title, like opening or interviews." A
      // point written "1. Opening: ..." shows Opening as its title.
      const t = m[2].match(/^([A-Z][A-Za-z, ]{2,40}):\s+([\s\S]*)$/);
      if (!list) { list = []; out.push(<ol key={"l" + i} className="afb-list">{list}</ol>); }
      list.push(<li key={i}>{t ? <b className="afb-t">{t[1]}</b> : null}<span>{t ? t[2] : m[2]}</span></li>);
    }
    else { list = null; out.push(<p key={i} className="afb-p">{b}</p>); }
  });
  return <div className="afb-body">{out}</div>;
}

export const FEEDBACK_CSS = `
.afb{border-left:4px solid var(--state-good,#1a7f4b);background:var(--surface-card,#fff);box-shadow:0 0 0 1px var(--line-soft,rgba(0,0,0,.1));border-radius:10px;padding:18px 22px 20px;max-width:860px;display:flex;flex-direction:column;gap:10px}
.afb-h{margin:0;font-size:15px;font-weight:700;letter-spacing:.02em}
.afb-body{display:flex;flex-direction:column;gap:12px;font-size:17px;line-height:1.55;max-width:66ch;min-width:0}
.afb-p{margin:0}
.afb-list{margin:0;padding:0;list-style:none;counter-reset:n;display:flex;flex-direction:column;gap:14px}
.afb-list li{counter-increment:n;display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:0}
.afb-list li::before{content:counter(n);font-weight:700;font-variant-numeric:tabular-nums;grid-row:1 / span 2}
.afb-t{display:block;font-size:17px;font-weight:700}
.afb-list li>span{grid-column:2}
.afb-card,.ass{--pt-due:#fdf1e6;--pt-due-ink:#7c3a05;--pt-done:#e3f1e7;--pt-done-ink:#1b6b3a;--pt-dr:#efe8fd;--pt-dr-ink:#4c1d95;--pt-late:#fbe7e4;--pt-late-ink:#8b2a1f;--pt-hero:#4c1d95;--pt-hero-ink:#ffffff;--pt-serif:'Lora',Georgia,serif}
@media (prefers-color-scheme: dark){ [data-theme="clean"]:not([data-mode="day"]) .afb-card,[data-theme="clean"]:not([data-mode="day"]) .ass{--pt-due:#3a2a14;--pt-due-ink:#f0b45c;--pt-done:#163124;--pt-done-ink:#5ecfa8;--pt-dr:#2a1f47;--pt-dr-ink:#d9c8ff;--pt-late:#3a1c1c;--pt-late-ink:#ff9c8f;--pt-hero:#3b1a75} }
[data-theme="clean"][data-mode="night"] .afb-card,[data-theme="clean"][data-mode="night"] .ass{--pt-due:#3a2a14;--pt-due-ink:#f0b45c;--pt-done:#163124;--pt-done-ink:#5ecfa8;--pt-dr:#2a1f47;--pt-dr-ink:#d9c8ff;--pt-late:#3a1c1c;--pt-late-ink:#ff9c8f;--pt-hero:#3b1a75}
.afb-card{background:var(--surface-card,#fff);border-radius:16px;box-shadow:0 0 0 1px var(--line-soft,rgba(0,0,0,.1));overflow:hidden}
.afb-top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:4px 24px;background:var(--pt-hero);color:var(--pt-hero-ink)}
.afb-h2{margin:0;font-family:'Lora','Iowan Old Style',Charter,Georgia,serif;font-weight:600;font-size:24px;line-height:1.2;padding:14px 0}
.afb-fold{font:inherit;font-size:15px;font-weight:600;min-height:38px;padding:0 18px;border-radius:999px;border:0;cursor:pointer;background:rgba(255,255,255,.18);color:inherit}
.afb-fold:hover{background:rgba(255,255,255,.3)}
.afb-fold:focus-visible{outline:2.5px solid #fff;outline-offset:2px}
.afb-rows{padding:0 24px 14px}
.afb-from{display:grid;grid-template-columns:168px minmax(0,1fr);gap:8px 28px;margin:0 -24px;padding:20px 24px;background:var(--pt-dr)}
.afb-from .apr-pl{color:var(--pt-dr-ink)}
.afb-from .afb-list li::before{display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:var(--pt-hero);color:var(--pt-hero-ink);font-size:14px}
.afb-from .afb-list li{grid-template-columns:38px minmax(0,1fr)}
.afb-from .afb-t{color:var(--pt-dr-ink);font-size:18px}
.afb-from+.apr-row{border-top:0}
.afb-marks{display:flex;flex-wrap:wrap;gap:12px;padding:18px 0;border-top:1px solid var(--line-soft)}
.afb-mark{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:12px;flex:1 1 200px;justify-content:space-between}
.afb-mark.afb-yes{background:var(--pt-done)}
.afb-mark.afb-could{background:var(--pt-due)}
.afb-mark .apr-v{background:transparent;padding:0;font-size:15px}
.afb-clip{display:flex;flex-direction:column;gap:10px;min-width:0}
.afb-clip audio{width:100%;max-width:66ch}
@media (max-width:700px){ .afb-top{padding:4px 16px} .afb-rows{padding:0 16px 12px} .afb-from{grid-template-columns:1fr;margin:0 -16px;padding:16px} .afb-rows .apr-row{grid-template-columns:1fr} }
`;
