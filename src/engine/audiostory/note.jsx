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
.afb-card{background:var(--surface-card,#fff);border-radius:16px;box-shadow:0 0 0 1px var(--line-soft,rgba(0,0,0,.1));padding:8px 24px 14px}
.afb-top{display:flex;align-items:center;justify-content:space-between;gap:16px}
.afb-h2{margin:0;font-family:'Lora','Iowan Old Style',Charter,Georgia,serif;font-weight:600;font-size:24px;line-height:1.2;padding:16px 0 12px}
.afb-fold{font:inherit;font-size:15px;font-weight:600;min-height:40px;padding:0 18px;border-radius:999px;border:0;cursor:pointer;background:var(--surface-sunk,#f1efec);color:var(--text-primary,#1c1917)}
.afb-fold:focus-visible{outline:2.5px solid var(--text-primary,#1c1917);outline-offset:2px}
.afb-rows{padding-top:0}
.afb-clip{display:flex;flex-direction:column;gap:10px;min-width:0}
.afb-clip audio{width:100%;max-width:66ch}
@media (max-width:700px){ .afb-card{padding:4px 16px 12px} .afb-rows .apr-row{grid-template-columns:1fr} }
`;
