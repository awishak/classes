// Around the Horn — the room, laid out the way it actually is. Drag names into
// the seats they sit in, then tap a seat to award or take back points. Opens
// over the dashboard so it never costs a panel slot.
//
// Seats live at data.athSeats keyed by student name; points are log entries
// with source "Around the Horn", so they roll into the in-class bucket.

import { useEffect, useMemo, useRef, useState } from "react";
import { genId } from "../utils.jsx";
import * as TOKENS from "./tokens.js";
import { Avatar, profileOf } from "./RosterCard.jsx";
import { shownName } from "./roster.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = TOKENS.TEXT.primary;
const INK2 = TOKENS.TEXT.secondary;
const MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const LINE = TOKENS.LINE.soft;
const LINE2 = TOKENS.LINE.strong;
const SURFACE_2 = TOKENS.SURFACE.sunk;

const label = { fontFamily: MONO, fontSize: 12, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: ".12em" };
const mini = { minHeight: 34, padding: "0 12px", borderRadius: 8, border: "1px solid " + LINE2, background: "#fff", color: INK2, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" };

// Eight across, which is the room. Andrew, 2026-09-20: "grid has to be 8
// across. do not change that." The seats carry a face at the roster's size
// inside that width.
const COLS = 8;
const AWARDS = [-1, 1, 2, 3, 5];

export default function HornBoard({ students, seats, log, accent, profiles, onSeats, onAward, onClose }) {
  const [dragging, setDragging] = useState(null);
  const [openSeat, setOpenSeat] = useState(null);
  const [toast, setToast] = useState("");
  const names = useMemo(() => students.map(s => s.name), [students]);
  const rows = Math.max(3, Math.ceil(names.length / COLS) + 1);
  const total = rows * COLS;
  const seated = useRef(false);

  // First open: drop everyone into seats in roster order.
  useEffect(() => {
    if (seated.current) return;
    const missing = names.filter(n => seats[n] === undefined);
    if (!missing.length) { seated.current = true; return; }
    const next = { ...seats };
    const used = new Set(Object.values(seats));
    let p = 0;
    missing.forEach(n => {
      while (used.has(p) && p < total) p++;
      if (p < total) { next[n] = p; used.add(p); p++; }
    });
    seated.current = true;
    onSeats(next);
  }, [names.length]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const byPos = {};
  names.forEach(n => { const p = seats[n]; if (p !== undefined && p < total) byPos[p] = n; });

  const points = (name) => (log || [])
    .filter(e => e.student === name && e.source === "Around the Horn")
    .reduce((s, e) => s + e.amount, 0);

  const drop = (pos) => {
    if (!dragging) return;
    const sitting = byPos[pos];
    const from = seats[dragging];
    const next = { ...seats };
    if (sitting && sitting !== dragging) next[sitting] = from;
    next[dragging] = pos;
    setDragging(null);
    onSeats(next);
  };

  const award = (name, amount) => {
    onAward(name, amount);
    setOpenSeat(null);
    setToast((amount > 0 ? "+" : "") + amount + " " + name.split(" ")[0]);
    setTimeout(() => setToast(""), 1400);
  };

  return (
    <div role="dialog" aria-label="Around the Horn"
      style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(17,24,39,.35)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fafaf9", borderRadius: 18, width: "100%", maxWidth: 1180, maxHeight: "92vh",
        overflow: "auto", fontFamily: F, boxShadow: "0 24px 60px -12px rgba(17,24,39,.4)" }}>

        <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid " + LINE,
          padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", zIndex: 2 }}>
          <div style={{ marginRight: "auto" }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.02em" }}>Around the Horn</div>
            <div style={{ fontSize: 13, color: MUTED }}>Drag a name to move a seat. Tap a seat to award points.</div>
          </div>
          {toast ? <span style={{ ...label, color: accent, fontSize: 13 }}>{toast}</span> : null}
          <button style={mini} onClick={() => { seated.current = false; onSeats({}); }}>Reset seats</button>
          <button style={{ ...mini, borderColor: accent, color: accent }} onClick={onClose}>Close</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(" + COLS + ", minmax(0,1fr))", gap: 8 }}>
            {Array.from({ length: total }).map((_, pos) => {
              const name = byPos[pos];
              const common = {
                onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; },
                onDrop: (e) => { e.preventDefault(); e.stopPropagation(); drop(pos); },
              };
              if (!name) {
                return <div key={pos} {...common}
                  style={{ minHeight: 132, borderRadius: 12, border: "1.5px dashed " + LINE2, background: "transparent" }} />;
              }
              const pts = points(name);
              const open = openSeat === name;
              return (
                <div key={pos} style={{ position: "relative" }} {...common}>
                  <button draggable
                    onDragStart={(e) => { setDragging(name); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", name); }}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => setOpenSeat(open ? null : name)}
                    style={{ width: "100%", minHeight: 132, borderRadius: 12, cursor: "grab", textAlign: "center",
                      background: open ? accent : "#fff", color: open ? "#fff" : INK,
                      border: "1px solid " + (open ? accent : LINE2), padding: 12, fontFamily: F,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: dragging === name ? .4 : 1 }}>
                    {/* The same face and the same name the roster shows, at the
                        same size. Andrew, 2026-09-20: "you need to make their
                        avatars and names as big as you have it on the students
                        roster view." The old seat was two initials in a 26px
                        circle over a 13px first name, which is a spreadsheet
                        of a room rather than the room. */}
                    <Avatar profile={profileOf({ profiles }, name)} name={shownName((profiles || {})[name], name)} accent={open ? "#ffffff" : accent} size={56} />
                    <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{shownName((profiles || {})[name], name)}</span>
                    <span style={{ marginTop: "auto", fontFamily: MONO, fontSize: 13, fontWeight: 600,
                      color: open ? "#fff" : (pts > 0 ? accent : MUTED), fontVariantNumeric: "tabular-nums" }}>
                      {pts > 0 ? "+" : ""}{pts}
                    </span>
                  </button>

                  {open ? (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 3,
                      background: "#fff", border: "1px solid " + LINE2, borderRadius: 12, padding: 8,
                      display: "flex", gap: 5, boxShadow: "0 12px 28px -8px rgba(17,24,39,.3)" }}>
                      {AWARDS.map(a => (
                        <button key={a} onClick={() => award(name, a)}
                          style={{ ...mini, minWidth: 40, padding: "0 8px", fontFamily: MONO,
                            color: a < 0 ? "#b91c1c" : accent, borderColor: a < 0 ? "#fca5a5" : LINE2 }}>
                          {a > 0 ? "+" + a : a}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
