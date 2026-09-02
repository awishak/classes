// Headlines, run from the dashboard. Opens over everything like Around the
// Horn, because running it needs the whole width and it only happens in bursts.

import { useState } from "react";
import { liveSession, activeItem, pickTally } from "./headlines.js";
import * as TOKENS from "./tokens.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = TOKENS.TEXT.primary;
const INK2 = TOKENS.TEXT.secondary;
const MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const LINE = TOKENS.LINE.soft;
const LINE2 = TOKENS.LINE.strong;
const SURFACE_2 = TOKENS.SURFACE.sunk;
const OK = TOKENS.STATE.ok;

const label = { fontFamily: MONO, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: ".12em" };
const mini = { minHeight: 34, padding: "0 12px", borderRadius: 8, border: "1px solid " + LINE2, background: "#fff", color: INK2, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const solid = (a) => ({ ...mini, background: a, borderColor: a, color: "#fff" });

function Bars({ options, votes, real, accent, nameOf }) {
  const { counts, voters } = pickTally(votes);
  const ranked = [...options].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  if (!voters) return <div style={{ fontSize: 15, color: MUTED }}>Nobody has locked in yet.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={label}>{voters} student{voters === 1 ? "" : "s"} in</div>
      {ranked.filter(o => counts[o]).map(o => {
        const pct = Math.round((counts[o] / voters) * 100);
        const isReal = (real || []).includes(o);
        return (
          <div key={o} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: isReal ? 700 : 400, color: isReal ? OK : INK }}>
                {nameOf ? nameOf(o) : o}{isReal ? " ✓" : ""}
              </div>
              <div style={{ height: 6, background: SURFACE_2, borderRadius: 3, marginTop: 3, overflow: "hidden" }}>
                <i style={{ display: "block", height: "100%", width: pct + "%", background: isReal ? OK : accent }} />
              </div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED, width: 30, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{counts[o]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Chips({ options, picked, onToggle, accent, nameOf }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(o => {
        const on = picked.includes(o);
        return (
          <button key={o} onClick={() => onToggle(o)}
            style={{ ...mini, background: on ? accent : "#fff", borderColor: on ? accent : LINE2, color: on ? "#fff" : INK2 }}>
            {nameOf ? nameOf(o) : o}
          </button>
        );
      })}
    </div>
  );
}

export default function HeadlinesBoard({ hl, api, accent, onClose, onCast }) {
  const [realPicks, setRealPicks] = useState([]);
  const [conceptPicks, setConceptPicks] = useState([]);

  if (!hl) return null;
  const session = liveSession(hl);
  const item = activeItem(hl, session);
  const pool = (hl.items || []).filter(i => session && i.sessionId === session.id);
  const concepts = hl.concepts || [];
  const conceptName = (id) => (concepts.find(c => c.id === id) || {}).name || id;
  const phase = session?.phase || "surface";

  const toggle = (setter) => (v) => setter(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  return (
    <div role="dialog" aria-label="Headlines"
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(17,24,39,.35)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fafaf9", borderRadius: 18, width: "100%", maxWidth: 1080, maxHeight: "92vh",
        overflow: "auto", fontFamily: F, boxShadow: "0 24px 60px -12px rgba(17,24,39,.4)" }}>

        <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid " + LINE,
          padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", zIndex: 2 }}>
          <div style={{ marginRight: "auto" }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.02em" }}>Headlines</div>
            <div style={{ fontSize: 13, color: MUTED }}>
              {session ? "Read it on the surface, then read it for the concept." : "No session open."}
            </div>
          </div>
          {session ? <button style={mini} onClick={() => api.closeSession(session.id)}>End session</button> : null}
          <button style={{ ...mini, borderColor: accent, color: accent }} onClick={onClose}>Close</button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {!session ? (
            <button style={solid(accent)} onClick={() => api.openSession()}>Open a session</button>
          ) : (
            <>
              <div>
                <div style={{ ...label, marginBottom: 8 }}>What they brought · {pool.length}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {pool.map(h => (
                    <button key={h.id} onClick={() => { setRealPicks([]); setConceptPicks([]); api.activate(session.id, h.id); onCast(); }}
                      style={{ display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left", cursor: "pointer",
                        background: item?.id === h.id ? "#fff" : SURFACE_2,
                        border: "1px solid " + (item?.id === h.id ? accent : "transparent"),
                        borderRadius: 10, padding: "10px 12px", fontFamily: F }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ display: "block", fontWeight: 500, fontSize: 15, lineHeight: 1.35, color: INK }}>{h.text}</b>
                        <small style={{ color: MUTED, fontSize: 12 }}>{h.submittedBy || "—"}</small>
                      </span>
                      {h.url ? <a href={h.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ ...mini, minHeight: 28, padding: "0 9px", fontSize: 12, textDecoration: "none", flex: "none" }}>Open ↗</a> : null}
                    </button>
                  ))}
                  {!pool.length ? <div style={{ fontSize: 15, color: MUTED }}>Waiting on submissions. They post from the ask page.</div> : null}
                </div>
              </div>

              {item ? (
                <div style={{ background: "#fff", border: "1px solid " + LINE, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <div style={{ ...label, color: accent }}>
                      {phase === "surface" ? "Round one · the surface read" : phase === "concept" ? "Round two · the concept read" : "Both reads in"}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, marginTop: 6 }}>{item.text}</div>
                  </div>

                  {phase === "surface" ? (
                    <>
                      <Bars options={hl.categories} votes={session.votes} accent={accent} />
                      <div>
                        <div style={{ ...label, marginBottom: 7 }}>Which ones are actually right?</div>
                        <Chips options={hl.categories} picked={realPicks} onToggle={toggle(setRealPicks)} accent={accent} />
                      </div>
                      <button style={realPicks.length ? solid(accent) : { ...mini, opacity: .45 }} disabled={!realPicks.length}
                        onClick={() => api.revealSurface(session.id, realPicks)}>Reveal, then go deeper</button>
                    </>
                  ) : null}

                  {phase === "concept" ? (
                    <>
                      <Bars options={hl.categories} votes={session.votes} real={session.realCategories} accent={accent} />
                      <div style={{ borderTop: "1px solid " + LINE, paddingTop: 14 }}>
                        <Bars options={concepts.map(c => c.id)} votes={session.conceptVotes} accent={accent} nameOf={conceptName} />
                        <div style={{ ...label, margin: "12px 0 7px" }}>Which concept is really at work?</div>
                        <Chips options={concepts.map(c => c.id)} picked={conceptPicks} onToggle={toggle(setConceptPicks)} accent={accent} nameOf={conceptName} />
                      </div>
                      <button style={conceptPicks.length ? solid(accent) : { ...mini, opacity: .45 }} disabled={!conceptPicks.length}
                        onClick={() => api.revealConcept(session.id, conceptPicks)}>Reveal the concept</button>
                    </>
                  ) : null}

                  {phase === "done" ? (
                    <>
                      <Bars options={hl.categories} votes={session.votes} real={session.realCategories} accent={accent} />
                      <div style={{ borderTop: "1px solid " + LINE, paddingTop: 14 }}>
                        <Bars options={concepts.map(c => c.id)} votes={session.conceptVotes} real={session.realConcepts} accent={accent} nameOf={conceptName} />
                      </div>
                      <div style={{ fontSize: 13, color: INK2 }}>Pick the next headline above to keep going.</div>
                    </>
                  ) : null}
                </div>
              ) : (
                <div style={{ fontSize: 15, color: MUTED }}>Pick a headline to put it up.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
