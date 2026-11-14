// A card to one student or to a few, written from the inbox.
//
// Andrew, 2026-11-13: "let me also send cards to one student or multiple
// students in the inbox." The card is the class card's (NoticeCard.jsx): his
// words in front of the site the next time each of them logs in, until they
// tap through it or its time passes. notice.js keeps who it is for and who
// has read it. Under the box are the cards still standing in that class,
// each with who has read it and a way to take it down.

import { useEffect, useState } from "react";
import { realStudents } from "./sections.js";
import { rosterOf, nameShown } from "./roster.js";
import { sendCard, takeDownCard, cardsLive, cardReadBy } from "./notice.js";
import { Face } from "./portal/bits.jsx";
import { genId } from "../utils.jsx";

const untilWords = (ms) => new Date(ms).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// `start`: { [classId]: [names] }, the students already picked.
export default function CardWriter({ classes, feeds, start = {}, onClose }) {
  const [classId, setClassId] = useState(() => Object.keys(start)[0] || classes[0]?.id || "");
  const [picked, setPicked] = useState(() => Object.fromEntries(Object.entries(start).map(([id, names]) => [id, Object.fromEntries(names.map(n => [n, true]))])));
  const [text, setText] = useState("");
  const [until, setUntil] = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const feed = feeds[classId];
  const roster = feed ? realStudents(feed.config, rosterOf(feed.config, feed.data)) : [];
  const namesIn = (id) => Object.keys(picked[id] || {}).filter(n => picked[id][n]);
  const total = classes.reduce((n, c) => n + namesIn(c.id).length, 0);
  const toggle = (name) => setPicked(p => ({ ...p, [classId]: { ...(p[classId] || {}), [name]: !(p[classId] || {})[name] } }));
  const send = () => {
    const at = until ? new Date(until).getTime() : 0;
    classes.forEach(c => { const names = namesIn(c.id); if (names.length && feeds[c.id]) feeds[c.id].update(prev => sendCard(prev, genId(), text, Number.isFinite(at) ? at : 0, names)); });
    onClose();
  };
  const standing = feed ? cardsLive(feed.data) : [];

  return (
    <div className="cw-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{CSS}</style>
      <div className="cw" role="dialog" aria-modal="true" aria-label="Write a card">
        <div className="cw-bar">
          <div className="pt-chips">{classes.map(c => <button key={c.id} type="button" className={"pt-chip pt-focus" + (classId === c.id ? " on" : "")} onClick={() => setClassId(c.id)}>{c.code + (namesIn(c.id).length ? " · " + namesIn(c.id).length : "")}</button>)}</div>
          <button type="button" className="pt-chip pt-focus cw-x" onClick={onClose}>Close</button>
        </div>
        <div className="cw-body">
          <div className="cw-people">
            {roster.map(s => (
              <label key={s.name} className={"cw-person" + ((picked[classId] || {})[s.name] ? " on" : "")}>
                <input type="checkbox" className="ib-tick" checked={!!(picked[classId] || {})[s.name]} onChange={() => toggle(s.name)} />
                <Face config={feed.config} data={feed.data} name={s.name} size={28} />
                <span>{nameShown(feed.data, s.name)}</span>
              </label>
            ))}
          </div>
          <div className="cw-write">
            <textarea className="pt-field pt-focus cw-box" value={text} aria-label="Card" onChange={e => setText(e.target.value)} />
            <label className="cw-until">Until<input type="datetime-local" className="pt-field pt-focus" value={until} onChange={e => setUntil(e.target.value)} /></label>
            <div className="cw-acts"><button type="button" className="pt-btn pt-focus" disabled={!text.trim() || !total} onClick={send}>{total ? "Send to " + total : "Send"}</button></div>
            {standing.map(c => (
              <div key={c.id} className="cw-card">
                <p className="cw-words">{c.text}</p>
                <p className="cw-to">{(c.to || []).map(n => nameShown(feed.data, n) + (cardReadBy(feed.data, c, n) ? ", read" : "")).join(" · ")}{c.until ? " · until " + untilWords(c.until) : ""}</p>
                <div className="cw-acts"><button type="button" className="pt-chip pt-focus" onClick={() => feed.update(prev => takeDownCard(prev, c.id))}>Take it down</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.cw-scrim{position:fixed;inset:0;z-index:40;background:rgba(28,25,23,.42);display:flex;align-items:center;justify-content:center;padding:24px}
.cw{width:100%;max-width:920px;max-height:100%;display:flex;flex-direction:column;background:var(--surface-page);border-radius:20px;box-shadow:0 24px 64px rgba(28,25,23,.28);overflow:hidden;text-align:left}
.cw-bar{flex:none;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 14px 10px 18px;background:var(--surface-card);border-bottom:1px solid var(--line-soft)}
.cw-x{margin-left:auto}
.cw-body{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:minmax(220px,300px) minmax(0,1fr)}
.cw-people{overflow:auto;padding:10px;display:flex;flex-direction:column;gap:2px;border-right:1px solid var(--line-soft)}
.cw-person{display:flex;align-items:center;gap:10px;min-height:44px;padding:4px 10px;border-radius:12px;font-size:15px;font-weight:500;cursor:pointer}
.cw-person:hover{background:var(--surface-card)}
.cw-person.on{background:var(--surface-card);box-shadow:0 0 0 1px var(--line-strong);font-weight:700}
.cw-write{overflow:auto;padding:18px;display:flex;flex-direction:column;gap:12px}
.pt-root .cw-box{min-height:180px;resize:vertical;font-family:inherit;font-size:17px;line-height:1.5}
.cw-until{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:15px;color:var(--text-secondary)}
.cw-acts{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.cw-acts .pt-btn{background:var(--text-primary)}
.cw-acts .pt-btn:disabled{opacity:.4}
.cw-card{display:flex;flex-direction:column;gap:6px;padding:14px 16px;border-radius:14px;background:var(--surface-card);box-shadow:0 0 0 1px var(--line-soft)}
.cw-words{margin:0;font-size:15.5px;line-height:1.5;white-space:pre-wrap}
.cw-to{margin:0;font-size:14px;color:var(--text-secondary)}
@media (max-width:720px){.cw-scrim{padding:0}.cw{max-width:none;height:100%;border-radius:0}.cw-body{grid-template-columns:1fr;overflow:auto}.cw-people{border-right:0;border-bottom:1px solid var(--line-soft);max-height:40vh}}
`;
