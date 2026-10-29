// Everyone's ideas, for the students: /comm3/worksheets/audio-ideas?all.
//
// Andrew, 2026-10-29: "i need a way to review all ideas and for students to
// request to work on someone else's ideas." Every submitted idea in the
// student's section, with the name and the mark, Top ideas first. Under
// another student's idea, a button to ask to work on that idea; under their
// own, who asked. The ask is the student's own `want` field on their ideas
// sheet, one "owner|slot" a line, written as them (pairs.js); the page reads
// everyone's through /api/audio-ideas, which checks the caller is on the
// roster. Asks again every ten seconds. Once Andrew has saved pairs
// (board.jsx), the student's pair and story sit at the top.

import { useEffect, useState } from "react";
import { gameClient } from "../gameClient.js";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { supabaseStore } from "../worktopia/store.js";
import { sectionOf, sectionsOf } from "../sections.js";
import { AUDIO_IDEAS_KEY, SLOTS, Mark, markOf } from "./ideas.jsx";
import { CSS, loadFont } from "./bits.jsx";
import { PAIRS_ROW, WANT_FIELD, wantKey, parseWant, pairOf } from "./pairs.js";

const ORDER = { top: 0, ok: 1, close: 2, no: 3, ohno: 4 };
const lower = (s) => String(s || "").trim().toLowerCase();

/** The saved pairs for a class, read off the instructor's row: [{ id, members, story, from }]. */
export async function pairsFor(classId) {
  try { const got = await window.storage.get(PAIRS_ROW); const all = got ? JSON.parse(got.value) || {} : {}; return (all[classId] && all[classId].pairs) || []; } catch { return []; }
}

export default function AllIdeas({ config, roster, viewer }) {
  const me = lower(viewer?.id);
  const mine = roster.find(s => lower(s.email) === me) || null;
  const sections = sectionsOf(config);
  const [section, setSection] = useState(mine ? sectionOf(mine) : sections[0] || "");
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const [wants, setWants] = useState(null);   // my asks, as keys
  const [pairs, setPairs] = useState([]);
  const [busy, setBusy] = useState("");
  const store = supabaseStore({ supabase: gameClient, worksheetKey: AUDIO_IDEAS_KEY, groupKey: config.id, viewerId: me });

  useEffect(() => { loadFont(); }, []);
  useEffect(() => {
    let alive = true;
    const ask = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const r = await fetch("/api/audio-ideas", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), groupKey: config.id }) });
        const out = await r.json().catch(() => null);
        if (!alive) return;
        if (!r.ok || !out?.ok) { setError(out?.error || "The ideas could not be read."); return; }
        setSheets(out.sheets); setError("");
        const own = out.sheets.find(s => s.viewer_id === me);
        if (own && wants === null) setWants(new Set(own.wants));
      } catch { if (alive && !sheets) setError("The ideas could not be read."); }
      pairsFor(config.id).then(p => { if (alive) setPairs(p); });
    };
    ask();
    const t = setInterval(ask, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [config.id, me]);   // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (owner, slot) => {
    const key = wantKey(owner, slot);
    const next = new Set(wants || []);
    if (next.has(key)) next.delete(key); else next.add(key);
    setBusy(key);
    try {
      const value = [...next].join("\n");
      if (value) await store.save(WANT_FIELD, value); else await store.remove(WANT_FIELD);
      setWants(next);
    } catch { /* the button stays as it was */ }
    setBusy("");
  };

  const root = { className: "as", "data-theme": undefined };
  if (error) return <div {...root}><style>{CSS}{MORE}</style><div className="sheet"><div className="head"><div className="title"><h2 className="name">Everyone's ideas</h2><p className="hint bad">{error}</p></div></div></div></div>;
  if (!sheets) return <div {...root}><style>{CSS}{MORE}</style><div className="sheet"><div className="foot"><span className="status">Loading…</span></div></div></div>;

  const nameOf = (email) => (sheets.find(s => s.viewer_id === email) || {}).name || email;
  const shown = sheets.filter(s => !section || s.section === section || s.viewer_id === me);
  // Every idea with words, Top ideas first, then Okay, then the rest, by name.
  const cards = shown.flatMap(s => SLOTS.map(slot => ({ s, slot, ...s.ideas[slot], mark: s.marks[slot] || "" })).filter(c => c.idea))
    .sort((x, y) => (ORDER[x.mark] ?? 9) - (ORDER[y.mark] ?? 9) || x.s.name.localeCompare(y.s.name) || x.slot.localeCompare(y.slot));
  const askedFor = (owner, slot) => shown.filter(s => s.viewer_id !== owner && s.wants.includes(wantKey(owner, slot))).map(s => s.name);
  const myPair = pairOf(pairs)[me];
  const partner = myPair ? myPair.members.filter(m => m !== me).map(nameOf) : [];

  return (
    <div {...root}>
      <style>{CSS}{MORE}</style>
      <div className="sheet">
        <div className="head">
          <div className="title">
            <h2 className="name">Everyone's ideas</h2>
            {sections.length > 1 && !mine ? <div className="chips">{sections.map(x => <button key={x} type="button" className={"chip focusable" + (x === section ? " on" : "")} onClick={() => setSection(x)}>{x}</button>)}</div> : null}
            {myPair ? (
              <p className="pair">{partner.length ? <>You are working with <b>{partner.join(" and ")}</b></> : <>You are working on your own</>}{myPair.story ? <> on <b>{myPair.story}</b></> : null}.</p>
            ) : null}
          </div>
        </div>
        <section className="part">
          <div className="grid">
            {cards.map(c => {
              const own = c.s.viewer_id === me;
              const key = wantKey(c.s.viewer_id, c.slot);
              const asked = askedFor(c.s.viewer_id, c.slot);
              return (
                <div key={key} className={"card" + (c.mark ? " m-" + c.mark : "")}>
                  <div className="bh"><span className="who">{own ? "You" : c.s.name}</span>{c.mark ? <Mark id={c.mark} /> : null}</div>
                  <p className="idea">{c.idea}</p>
                  {c.why ? <p className="why">{c.why}</p> : null}
                  {own
                    ? (asked.length ? <p className="asked">Asked to work on this idea: {asked.join(", ")}</p> : null)
                    : <button type="button" className={"btn small focusable" + (wants?.has(key) ? " on" : "")} aria-pressed={!!wants?.has(key)} disabled={busy === key} onClick={() => toggle(c.s.viewer_id, c.slot)}>{wants?.has(key) ? "Asked to work on this idea" : "Ask to work on this idea"}</button>}
                  {!own && asked.length ? <p className="asked">Also asked: {asked.join(", ")}</p> : null}
                </div>
              );
            })}
          </div>
          {!cards.length ? <p className="hint">No ideas submitted yet.</p> : null}
        </section>
      </div>
    </div>
  );
}

// On top of the sheets' look (bits.jsx): the cards.
const MORE = `
.as .pair{margin:0;font-size:19px;padding-top:8px}
.as .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.as .card{background:var(--sunk);border-radius:16px;padding:14px 16px;display:grid;gap:8px;align-content:start;border:2px solid transparent}
.as .card.m-top{border-color:var(--m-top)} .as .card.m-ok{border-color:var(--m-ok)} .as .card.m-close{border-color:var(--m-close)} .as .card.m-no{border-color:var(--m-no)} .as .card.m-ohno{border-color:var(--m-ohno)}
.as .card .bh{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:30px}
.as .who{font-weight:600;font-size:15px;color:var(--secondary)}
.as .idea{margin:0;font-size:19px;font-weight:600;line-height:1.25}
.as .why{margin:0;font-size:15px;color:var(--secondary);line-height:1.4;white-space:pre-line}
.as .asked{margin:0;font-size:14px;color:var(--secondary)}
.as .btn.on{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
`;
