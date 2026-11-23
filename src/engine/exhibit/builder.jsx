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

import { useCallback, useEffect, useRef, useState } from "react";
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
@media (max-width:980px){
  .xb{grid-template-columns:minmax(0,1fr)}
  .xb .flip{display:inline-block}
  .xb.show-view .side{display:none}
  .xb:not(.show-view) .view{display:none}
  .xb .flipback{position:fixed;right:14px;bottom:14px;z-index:70}
}
`;

const now = () => Date.now();
const PAL_HEX = { orange: ["#d9541e", "#17324d"], green: ["#1c7a41", "#dbe64a"], blue: ["#1560c8", "#ff5d62"], red: ["#b01f2d", "#f3b62f"], violet: ["#5a3ed2", "#17b89f"] };
const TYPE_FACE = { news: { fontFamily: "Newsreader, Georgia, serif", fontWeight: 600 }, museum: { fontFamily: "Archivo, sans-serif", fontWeight: 850, fontStretch: "72%", textTransform: "uppercase" }, magazine: { fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontWeight: 400 } };
const dateSay = (iso) => new Date(iso).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });

function F({ label, value, onChange, area, rows = 3, hint, over, type = "text", placeholder }) {
  return <label className="f"><span>{label}{hint != null && <em className={over ? "over" : ""}>{hint}</em>}</span>
    {area ? <textarea rows={rows} value={value || ""} placeholder={placeholder} onChange={e => onChange(e.target.value)} /> : <input type={type} value={value || ""} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}
  </label>;
}

function Upload({ classId, as, accept, say, onDone }) {
  const [state, setState] = useState("");
  const pick = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setState("0%");
    try { const out = await upload(classId, file, { as, onProgress: p => setState(Math.round(p * 100) + "%") }); setState(""); onDone(out); }
    catch (err) { setState("!" + (err.message || "The file did not go up.")); }
  };
  return <>
    <label className="drop">{state && !state.startsWith("!") ? "Sending " + state : say}<input type="file" accept={accept} onChange={pick} /></label>
    {state.startsWith("!") && <p className="err">{state.slice(1)}</p>}
  </>;
}
const IMG = "image/*,.heic,.heif";
const AUD = "audio/*,.m4a,.mp3,.wav,.aac";

function ImageFields({ classId, as, url, alt, credit, cap, set, keys = ["url", "alt", "credit", "cap"], noCap }) {
  const [ku, ka, kc, kp] = keys;
  return <>
    {safeUrl(url) && <img className="thumb" src={url} alt="" />}
    <Upload classId={classId} as={as} accept={IMG} say={url ? "Replace the image" : "Choose an image"} onDone={o => set({ [ku]: o.url })} />
    <F label="Describe the image for a reader who cannot see the image" value={alt} onChange={v => set({ [ka]: v })} />
    <F label="Credit" value={credit} onChange={v => set({ [kc]: v })} placeholder="Photo: Name, where the image is from" />
    {!noCap && <F label="Caption" value={cap} onChange={v => set({ [kp]: v })} />}
  </>;
}

function TextEditor({ b, set, sources }) {
  const ref = useRef(null);
  const wrap = (before, after) => {
    const el = ref.current; if (!el) return;
    const a = el.selectionStart, z = el.selectionEnd, t = b.text || "";
    const mid = t.slice(a, z) || "words";
    set({ text: t.slice(0, a) + before + mid + after + t.slice(z) });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + mid.length); });
  };
  return <>
    <div className="tb">
      <button type="button" className="btn ghost sm" onClick={() => wrap("**", "**")}><b>Bold</b></button>
      <button type="button" className="btn ghost sm" onClick={() => wrap("_", "_")}><i>Italic</i></button>
      <select value="" aria-label="Link the selected words to a source" onChange={e => { if (e.target.value) wrap("[[" + e.target.value + "|", "]]"); }}>
        <option value="">Link words to a source</option>
        {sources.filter(s => s.title || s.author).map(s => <option key={s.id} value={s.id}>{(s.author || s.title).slice(0, 40)}{s.year ? " " + s.year : ""}</option>)}
      </select>
    </div>
    <textarea ref={ref} rows={8} value={b.text || ""} onChange={e => set({ text: e.target.value })} />
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

function BlockEditor({ b, set, sources, classId, as }) {
  const SourcePick = ({ k = "source" }) => <label className="f"><span>Source</span><select value={b[k] || ""} onChange={e => set({ [k]: e.target.value })}><option value="">None</option>{sources.filter(s => s.title || s.author).map(s => <option key={s.id} value={s.id}>{(s.author || s.title).slice(0, 50)}</option>)}</select></label>;
  if (b.t === "text") return <TextEditor b={b} set={set} sources={sources} />;
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
    <Upload classId={classId} as={as} accept={AUD} say={b.url ? "Replace the audio file" : "Choose an audio file: m4a, mp3, wav or aac"} onDone={o => set({ url: o.url })} />
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

function Builder({ classId, viewer, as }) {
  useExhibitFonts();
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState("");
  const [locked, setLocked] = useState(false);
  const [saved, setSaved] = useState("Saved");
  const [step, setStep] = useState("outline");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState("");
  const [undo, setUndo] = useState(null);
  const [notes, setNotes] = useState([]);
  const [showView, setShowView] = useState(false);
  const docRef = useRef(null), dirty = useRef(false), timer = useRef(null), busy = useRef(false), view = useRef(null);
  docRef.current = doc;

  useEffect(() => {
    let on = true;
    loadMine(classId, as).then(out => { if (!on) return; setDoc(out.doc); setLocked(out.locked); if (!outlineDone(out.doc)) setStep("outline"); else setStep("build"); })
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
      setSaved(dirty.current ? "Saving" : "Saved");
    } catch (e) { if (e.locked) setLocked(true); else dirty.current = true; setSaved(e.locked ? "Closed" : "Not saved"); }
    busy.current = false;
    if (dirty.current) timer.current = setTimeout(flush, 2500);
  }, [classId, as]);
  const change = useCallback((fn) => {
    if (locked) return;
    setDoc(d => fn(d));
    dirty.current = true; setSaved("Saving");
    clearTimeout(timer.current); timer.current = setTimeout(flush, 900);
  }, [flush, locked]);
  useEffect(() => { const bye = () => { if (dirty.current) flush(); }; window.addEventListener("pagehide", bye); return () => { window.removeEventListener("pagehide", bye); clearTimeout(timer.current); }; }, [flush]);
  // A partner's work comes in while this side is idle.
  useEffect(() => {
    if (!doc || (doc.makers || []).length < 2 || locked) return;
    const t = setInterval(() => { if (document.hidden || dirty.current || busy.current) return; loadMine(classId, as).then(out => { if (!dirty.current && out.doc.rev !== docRef.current?.rev) setDoc(d => ({ ...mergeDocs(out.doc, d), rev: out.doc.rev })); setLocked(out.locked); }).catch(() => {}); }, 20000);
    return () => clearInterval(t);
  }, [classId, as, doc?.id, locked]);   // eslint-disable-line react-hooks/exhaustive-deps

  const top = (patch) => change(d => { const t = now(), at = { ...(d.at || {}) }; Object.keys(patch).forEach(k => { at[k] = t; }); return { ...d, ...patch, at }; });
  const pagePatch = (id, patch, order) => change(d => ({ ...d, ...(order ? { pagesAt: now() } : {}), pages: d.pages.map(p => (p.id === id ? { ...p, ...patch, at: now() } : p)) }));
  const blockPatch = (pid, bid, patch) => change(d => ({ ...d, pages: d.pages.map(p => (p.id === pid ? { ...p, blocks: p.blocks.map(b => (b.id === bid ? { ...b, ...patch, at: now() } : b)) } : p)) }));
  const srcPatch = (id, patch) => change(d => ({ ...d, sources: d.sources.map(s => (s.id === id ? { ...s, ...patch, at: now() } : s)) }));

  if (err) return <div className="xb"><style>{CSS}</style><div className="load">{err}</div></div>;
  if (!doc) return <div className="xb"><style>{CSS}</style><div className="load">Opening your project</div></div>;

  const pages = doc.pages || [], cur = pages[Math.min(page, pages.length - 1)] || null;
  const list = checklist(doc, classId);
  const left = list.filter(l => !l.ok).length;
  const sources = doc.sources || [];
  const exhibit = doc.way === "exhibit";

  const addBlock = (t) => { if (!cur) return; const b = newBlock(t); change(d => ({ ...d, pages: d.pages.map(p => (p.id === cur.id ? { ...p, orderAt: now(), blocks: [...p.blocks, b] } : p)) })); setSel(b.id); };
  const moveBlock = (i, d) => { const bs = [...cur.blocks]; const j = i + d; if (j < 0 || j >= bs.length) return; [bs[i], bs[j]] = [bs[j], bs[i]]; pagePatch(cur.id, { blocks: bs, orderAt: now() }); };
  const dropBlock = (i) => { const b = cur.blocks[i]; change(d => ({ ...d, gone: { ...(d.gone || {}), [b.id]: now() }, pages: d.pages.map(p => (p.id === cur.id ? { ...p, orderAt: now(), blocks: p.blocks.filter(x => x.id !== b.id) } : p)) })); setUndo({ say: blockName(b.t) + " removed", back: () => change(d => ({ ...d, pages: d.pages.map(p => (p.id === cur.id ? { ...p, orderAt: now() + 1, blocks: [...p.blocks.slice(0, i), { ...b, at: now() + 1 }, ...p.blocks.slice(i)] } : p)) })) }); };
  const addPage = () => { if (pages.length >= MAX_PAGES) return; const p = newPage(""); change(d => ({ ...d, pagesAt: now(), pages: [...d.pages, p] })); setPage(pages.length); };
  const movePage = (i, d) => { const ps = [...pages]; const j = i + d; if (j < 0 || j >= ps.length) return; [ps[i], ps[j]] = [ps[j], ps[i]]; change(x => ({ ...x, pagesAt: now(), pages: ps })); };
  const dropPage = (i) => { const p = pages[i]; change(d => ({ ...d, pagesAt: now(), gone: { ...(d.gone || {}), [p.id]: now() }, pages: d.pages.filter(x => x.id !== p.id) })); setPage(0); setUndo({ say: (p.name || "Page") + " removed", back: () => change(d => ({ ...d, pagesAt: now() + 1, pages: [...d.pages.slice(0, i), { ...p, at: now() + 1 }, ...d.pages.slice(i)] })) }); };
  const addSource = () => { const s = newSource(); change(d => ({ ...d, sourcesAt: now(), sources: [...d.sources, s] })); setSel(s.id); };
  const dropSource = (s, i) => { change(d => ({ ...d, sourcesAt: now(), gone: { ...(d.gone || {}), [s.id]: now() }, sources: d.sources.filter(x => x.id !== s.id) })); setUndo({ say: "Source removed", back: () => change(d => ({ ...d, sourcesAt: now() + 1, sources: [...d.sources.slice(0, i), { ...s, at: now() + 1 }, ...d.sources.slice(i)] })) }); };

  const STEPS = [["outline", "Outline"], ...(exhibit ? [["build", "Build"]] : []), ["sources", "Sources"], ["look", "Look"], ["check", "Checklist"], ["share", "Share"]];
  const previewUrl = `${window.location.origin}${exhibitHref(doc)}?preview=${doc.preview}`;
  const around = (b, node) => <div className={"pick" + (sel === b.id ? " on" : "")} onClick={() => { setSel(b.id); setStep("build"); setShowView(false); }}>{node || <div className="ghostb">{blockName(b.t)}, beside the text below</div>}</div>;

  return <div className={"xb" + (showView ? " show-view" : "")}>
    <style>{CSS}</style>
    <div className="side" style={{ position: "relative" }}>
      {locked && <div className="lock">The final project closed on {dateSay(FINAL_DUE)}. This is what you turned in.</div>}
      <div className="top">
        <div className="row"><a className="back" href={`/${classId}`}>Back to class</a><span className={"saved" + (saved === "Not saved" ? " bad" : "")}>{saved}</span></div>
        <div className="name">{doc.headline || "Final project"}</div>
        <div className="due">{(doc.names || []).join(" and ")}. Outline due <b>{dateSay(OUTLINE_DUE)}</b>. Everything locks <b>{dateSay(FINAL_DUE)}</b>.</div>
        <div className="steps">{STEPS.map(([id, name]) => <button type="button" key={id} aria-current={step === id} onClick={() => setStep(id)}>{name}{id === "outline" && outlineDone(doc) && <span className="dot" />}{id === "check" && left === 0 && <span className="dot" />}</button>)}
          <button type="button" className="flip" onClick={() => setShowView(true)}>See the page</button></div>
      </div>
      <div className="pane">
        {step === "outline" && <>
          <h3>How you are making your project</h3>
          <div className="tiles">{WAYS.map(w => <button type="button" className="tile" key={w.id} aria-pressed={doc.way === w.id} onClick={() => top({ way: w.id })}>{w.name}<small>{w.id === "exhibit" ? "Built here, page by page" : w.id === "film" ? "One video, linked" : "A file you made"}</small></button>)}</div>
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
            <Upload classId={classId} as={as} accept=".html,.htm,text/html" say={doc.html?.url ? "Replace the file" : "Choose your .html file"} onDone={o => top({ html: { url: o.url, name: o.name } })} />
          </>}
          {exhibit && <>
            <h3>Your pages</h3>
            <p className="say">Name each page and say what will go on the page. Up to {MAX_PAGES}.</p>
            {pages.map((p, i) => <div className="item" key={p.id}><div className="bd" style={{ paddingTop: 12 }}>
              <F label={"Page " + (i + 1)} value={p.name} onChange={v => pagePatch(p.id, { name: v })} />
              <F label="What goes on this page" area value={p.plan} onChange={v => pagePatch(p.id, { plan: v })} />
              <div className="rowb"><button type="button" className="ic" aria-label="Move the page up" disabled={i === 0} onClick={() => movePage(i, -1)}>&uarr;</button><button type="button" className="ic" aria-label="Move the page down" disabled={i === pages.length - 1} onClick={() => movePage(i, 1)}>&darr;</button>{pages.length > 1 && <button type="button" className="btn ghost sm" onClick={() => dropPage(i)}>Remove the page</button>}</div>
            </div></div>)}
            <button type="button" className="btn" onClick={addPage} disabled={pages.length >= MAX_PAGES}>Add a page</button>
          </>}
        </>}

        {step === "build" && exhibit && cur && <>
          <div className="ptabs">{pages.map((p, i) => <button type="button" key={p.id} aria-current={i === page} onClick={() => { setPage(i); setSel(""); }}>{p.name || "Page " + (i + 1)}</button>)}</div>
          {cur.plan && <p className="say">Your plan for this page: {cur.plan}</p>}
          {cur.blocks.map((b, i) => <div className={"item" + (sel === b.id ? " on" : "")} key={b.id}>
            <div className="hd" onClick={() => setSel(sel === b.id ? "" : b.id)}><b>{blockName(b.t)}</b><span>{gist(b)}</span>
              <button type="button" className="ic" aria-label="Move up" disabled={i === 0} onClick={e => { e.stopPropagation(); moveBlock(i, -1); }}>&uarr;</button>
              <button type="button" className="ic" aria-label="Move down" disabled={i === cur.blocks.length - 1} onClick={e => { e.stopPropagation(); moveBlock(i, 1); }}>&darr;</button>
              <button type="button" className="ic" aria-label="Remove" onClick={e => { e.stopPropagation(); dropBlock(i); }}>&times;</button></div>
            {sel === b.id && <div className="bd"><BlockEditor b={b} set={p => blockPatch(cur.id, b.id, p)} sources={sources} classId={classId} as={as} /></div>}
          </div>)}
          <h3>Add to this page</h3>
          {[...new Set(BLOCKS.map(b => b.group))].map(g => <div key={g}><div className="grp">{g}</div><div className="add">{BLOCKS.filter(b => b.group === g && (b.t !== "concept" || classId !== "comm3")).map(b => <button type="button" key={b.t} onClick={() => addBlock(b.t)}>{b.name}</button>)}</div></div>)}
        </>}

        {step === "sources" && <>
          <p className="say">Add each source once. In a text block, select words and link the words to a source.</p>
          {sources.map((s, i) => <div className={"item" + (sel === s.id ? " on" : "")} key={s.id}>
            <div className="hd" onClick={() => setSel(sel === s.id ? "" : s.id)}><b>{s.kind === "academic" ? "Academic" : s.kind === "popular" ? "Popular press" : "Source"}</b><span>{s.author || s.title}</span><button type="button" className="ic" aria-label="Remove" onClick={e => { e.stopPropagation(); dropSource(s, i); }}>&times;</button></div>
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
          <button type="button" className="btn" onClick={addSource}>Add a source</button>
        </>}

        {step === "look" && <>
          <h3>Type</h3>
          <div className="tiles">{TYPES.map(t => <button type="button" className="tile" key={t.id} aria-pressed={doc.type === t.id} onClick={() => top({ type: t.id })}><span className="aa" style={TYPE_FACE[t.id]}>Aa</span>{t.name}</button>)}</div>
          <h3>Color</h3>
          <div className="sws">{PALETTES.map(p => <button type="button" className="sw" key={p} aria-label={p} aria-pressed={doc.pal === p} style={{ background: PAL_HEX[p][0] }} onClick={() => top({ pal: p })}><i style={{ background: PAL_HEX[p][1] }} /></button>)}</div>
          {exhibit && <><h3>Layout</h3>
          <div className="tiles" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>{LAYOUTS.map(l => <button type="button" className="tile" key={l.id} aria-pressed={doc.layout === l.id} onClick={() => top({ layout: l.id })}>{l.name}<small>{l.id === "pages" ? "A front page with pages behind" : "One long story"}</small></button>)}</div></>}
        </>}

        {step === "check" && <>
          <div className="rowb" style={{ justifyContent: "space-between", marginBottom: 6 }}><div><div className="big">{wordCount(doc)}</div><div className="due">words</div></div><div style={{ textAlign: "right" }}><div className="big">{list.filter(l => l.ok).length} of {list.length}</div><div className="due">checked</div></div></div>
          {list.map(l => <div className={"chk" + (l.ok ? " ok" : "")} key={l.id}><span className="m" /><span>{l.say}</span><span className="c">{l.need > 1 ? `${Math.min(l.have, 999)} of ${l.need}` : ""}</span></div>)}
          <h3>For the public page</h3>
          {classId !== "comm118" && <F label="Who you interviewed" value={doc.interview} onChange={v => top({ interview: v })} />}
          <F label="How you used AI to assist you in your work" area value={doc.ai} onChange={v => top({ ai: v })} />
          <F label="Topic area, for the class gallery" value={doc.area} onChange={v => top({ area: v })} />
          {(doc.makers || []).length > 1 && <><h3>For Dr. Ishak only</h3><F label="Who did what" area value={doc.who} onChange={v => top({ who: v })} /></>}
        </>}

        {step === "share" && <>
          <h3>Private preview link</h3>
          <p className="say">Anyone with this link can read your draft and leave a note on any block. Only you and Dr. Ishak see the notes.</p>
          <div className="link"><input type="text" readOnly value={previewUrl} onFocus={e => e.target.select()} /><button type="button" className="btn" onClick={() => { navigator.clipboard?.writeText(previewUrl).then(() => setSaved("Copied")).catch(() => {}); }}>Copy</button></div>
          <h3>Notes from readers</h3>
          {notes.length === 0 && <p className="say">No notes yet.</p>}
          {notes.slice().reverse().map(n => <div className="note" key={n.id}><b>{n.name}</b>{n.classmate ? " (classmate)" : ""}<div>{n.text}</div><small>{new Date(n.at).toLocaleString()} <button type="button" className="btn ghost sm" style={{ marginLeft: 8 }} onClick={() => dropNote(classId, n.id, as).then(() => setNotes(x => x.filter(y => y.id !== n.id))).catch(() => {})}>Done with this note</button></small></div>)}
        </>}
      </div>
      {undo && <div className="undo">{undo.say}<button type="button" className="btn sm" onClick={() => { undo.back(); setUndo(null); }}>Undo</button><button type="button" className="ic" aria-label="Dismiss" onClick={() => setUndo(null)}>&times;</button></div>}
    </div>
    <div className="view" ref={view}>
      <Reader doc={{ ...doc, term: "" }} page={page} onPage={setPage} around={around} scrollEl={view} />
      <button type="button" className="btn flip flipback" onClick={() => setShowView(false)}>Back to building</button>
    </div>
  </div>;
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
