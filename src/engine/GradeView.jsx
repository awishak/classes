// Grade view. The whole class as cards on a white page, one assignment at a
// time, and seven columns to drag them into. See grades.js for what a column
// means and what Release does.
//
// The page is meant to be as plain as a whiteboard: names, a link to the file,
// the grade, the comment. Nothing else competes.

import { useState, useEffect, useMemo } from "react";
import { useClassData } from "./store.js";
import { ThemeStyle } from "./ThemeShell.jsx";
import { withIds } from "./roster.js";
import { isLate } from "./AssignmentsCard.jsx";
import { BUCKETS, boardOf, placeCard, writeCard, releasePatch, hidePatch, changedSinceRelease, sortedCount, gradeText } from "./grades.js";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const WHITE = TOKENS.SURFACE.card;
const SUNK = TOKENS.SURFACE.sunk;
const OK = TOKENS.STATE.ok;
const LATE = TOKENS.STATE.late;
const HIT = TOKENS.HIT;

const label = { fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };

const CSS = `
.gv-focus:focus-visible{outline:2px solid var(--gv-accent);outline-offset:2px;border-radius:8px}
.gv-card{cursor:grab}
.gv-card:active{cursor:grabbing}
.gv-card[data-dragging="1"]{opacity:.4}
.gv-zone[data-over="1"]{background:var(--surface-sunk);outline:2px dashed var(--gv-accent);outline-offset:-2px}
textarea.gv-box{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid var(--line-strong);font-family:var(--font-body);font-size:16px;line-height:1.45;color:var(--text-primary);background:var(--surface-card);resize:vertical;min-height:64px}
@media (prefers-reduced-motion: reduce){*{transition:none!important}}
`;

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "link"; } };
const first = (name) => String(name || "").split(" ")[0];
const fmtDay = (ts) => ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

// The latest thing a student turned in, and whether a grade from the old
// grading flow is already on the log.
const workOf = (data, aid, name) => {
  const log = data?.assignmentLog?.[aid]?.[name] || [];
  const subs = log.filter(e => e.type === "submission");
  const last = subs[subs.length - 1] || null;
  const linked = [...subs].reverse().find(e => e.link) || null;
  const grades = log.filter(e => e.type === "grade" && !e.board);
  return { last, link: linked?.link || "", earlier: grades[grades.length - 1] || null, count: subs.length };
};

export default function GradeView({ config }) {
  const [data, update] = useClassData(config.storageKey);
  const a = config.accent;
  const assignments = data?.assignments || config.assignments || [];
  const roster = useMemo(() => withIds(data?.students?.length ? data.students : (config.students || [])), [data, config]);

  // The assignment in the URL, so a link can open the board on one of them.
  const fromUrl = () => { try { return new URLSearchParams(window.location.search).get("a") || ""; } catch { return ""; } };
  const [aid, setAid] = useState(() => fromUrl() || assignments[0]?.id || "");
  useEffect(() => { if (!aid && assignments[0]) setAid(assignments[0].id); }, [assignments, aid]);
  const pick = (id) => {
    setAid(id);
    try { window.history.replaceState({}, "", window.location.pathname + "?a=" + encodeURIComponent(id)); } catch { /* a render with no window */ }
  };

  const asg = assignments.find(x => x.id === aid) || null;
  const board = boardOf(data, aid);
  const [dragging, setDragging] = useState("");
  const [over, setOver] = useState("");
  const [picked, setPicked] = useState("");
  const [editing, setEditing] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setPicked(""); setEditing(""); setConfirm(""); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const move = (name, bucket) => {
    if (!name || !aid) return;
    update(prev => placeCard(prev, aid, name, bucket));
    setPicked(""); setDragging(""); setOver("");
  };
  const save = (name, fields) => { update(prev => writeCard(prev, aid, name, fields)); setEditing(""); };
  const release = () => { update(prev => releasePatch(prev, aid)); setConfirm(""); };
  const hide = () => { update(prev => hidePatch(prev, aid)); setConfirm(""); };

  const zoneProps = (bucket) => ({
    className: "gv-zone",
    "data-over": over === (bucket || "pile") && dragging ? "1" : "0",
    onDragOver: (e) => { e.preventDefault(); if (over !== (bucket || "pile")) setOver(bucket || "pile"); },
    onDragLeave: () => setOver(""),
    onDrop: (e) => { e.preventDefault(); const name = e.dataTransfer.getData("text/plain") || dragging; move(name, bucket); },
  });

  const cardOf = (s) => {
    const card = board.cards?.[s.name] || {};
    return <Card key={s.name} student={s} due={asg?.due} card={card} work={workOf(data, aid, s.name)} accent={a}
      dragging={dragging === s.name} picked={picked === s.name} editing={editing === s.name}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", s.name); e.dataTransfer.effectAllowed = "move"; setDragging(s.name); }}
      onDragEnd={() => { setDragging(""); setOver(""); }}
      onPick={() => setPicked(p => p === s.name ? "" : s.name)}
      onEdit={() => setEditing(s.name)} onCancel={() => setEditing("")}
      onSave={(fields) => save(s.name, fields)} />;
  };

  // The pile reads in the order the work came in, so the first file turned in
  // is the first card grabbed. Anyone with nothing turned in sits at the end,
  // in roster order.
  const firstIn = (s) => { const subs = (data?.assignmentLog?.[aid]?.[s.name] || []).filter(e => e.type === "submission"); return subs.length ? subs[0].ts : Infinity; };
  const pile = roster.filter(s => !board.cards?.[s.name]?.bucket)
    .map((s, i) => ({ s, i, ts: firstIn(s) }))
    .sort((x, y) => (x.ts - y.ts) || (x.i - y.i))
    .map(x => x.s);
  const inBucket = (id) => roster.filter(s => board.cards?.[s.name]?.bucket === id);
  const sorted = sortedCount(board);
  const released = !!board.released;
  const stale = changedSinceRelease(board);

  const btn = (solid) => ({ minHeight: HIT, padding: "0 14px", borderRadius: 8, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
    background: solid ? a : WHITE, color: solid ? "#fff" : TEXT_PRIMARY, border: "1px solid " + (solid ? a : LINE_STRONG) });

  return (
    <div style={{ minHeight: "100vh", background: WHITE, color: TEXT_PRIMARY, fontFamily: F, "--gv-accent": a }}>
      <ThemeStyle theme="clean" />
      <style>{CSS}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 5, background: WHITE, borderBottom: "1px solid " + LINE }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <a className="gv-focus" href={config.path + "/dashboard"} style={{ color: a, fontSize: 15, fontWeight: 600, textDecoration: "none", minHeight: HIT, display: "inline-flex", alignItems: "center" }}>← Dashboard</a>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{config.code} · Grade view</div>
          {assignments.length ? (
            <select className="gv-focus" value={aid} onChange={e => pick(e.target.value)} aria-label="Assignment"
              style={{ minHeight: HIT, padding: "0 10px", borderRadius: 8, border: "1px solid " + LINE_STRONG, fontFamily: F, fontSize: 16, background: WHITE, color: TEXT_PRIMARY, maxWidth: 360 }}>
              {assignments.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
          ) : <span style={{ color: TEXT_MUTED, fontSize: 15 }}>No assignments in this class yet.</span>}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, color: TEXT_SECONDARY }}>{sorted} of {roster.length} sorted</span>
            {released ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: stale ? LATE : OK }}>
                {stale ? "Changed since the students saw these" : "Released " + fmtDay(board.released.at)}
              </span>
            ) : null}
            {confirm === "release" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>Send {sorted} grade{sorted === 1 ? "" : "s"} and the comments to the students?</span>
                <button className="gv-focus" style={btn(true)} onClick={release}>Yes, release</button>
                <button className="gv-focus" style={btn(false)} onClick={() => setConfirm("")}>Not yet</button>
              </span>
            ) : confirm === "hide" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>Take the grades and comments back from the students?</span>
                <button className="gv-focus" style={btn(true)} onClick={hide}>Yes, hide</button>
                <button className="gv-focus" style={btn(false)} onClick={() => setConfirm("")}>Keep them up</button>
              </span>
            ) : (
              <>
                <button className="gv-focus" style={{ ...btn(true), opacity: sorted ? 1 : .5 }} disabled={!sorted} onClick={() => setConfirm("release")}>
                  {released && stale ? "Release again" : "Release grades"}
                </button>
                {released ? <button className="gv-focus" style={btn(false)} onClick={() => setConfirm("hide")}>Hide grades</button> : null}
              </>
            )}
          </div>
        </div>
      </header>

      {asg ? (
        <main style={{ maxWidth: 1600, margin: "0 auto", padding: "16px 20px 48px" }}>
          {picked ? (
            <div style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 12 }}>
              {first(picked)} is picked up. Choose a column, or press Escape.
            </div>
          ) : null}

          {/* the pile */}
          <section {...zoneProps(null)} aria-label="Not sorted yet"
            style={{ border: "1px solid " + LINE, borderRadius: 12, padding: 12, marginBottom: 16, minHeight: 72 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: pile.length ? 10 : 0 }}>
              <span style={label}>Not sorted yet</span>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>{pile.length}</span>
              {picked && board.cards?.[picked]?.bucket
                ? <button className="gv-focus" onClick={() => move(picked, null)} style={{ ...btn(false), minHeight: HIT, marginLeft: "auto" }}>Put {first(picked)} back here</button>
                : null}
              {!pile.length ? <span style={{ fontSize: 15, color: OK, fontWeight: 600 }}>Everyone is sorted.</span> : null}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {pile.map(cardOf)}
            </div>
          </section>

          {/* the columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, alignItems: "stretch" }}>
            {BUCKETS.map(b => {
              const here = inBucket(b.id);
              return (
                <section key={b.id} {...zoneProps(b.id)} aria-label={b.label}
                  style={{ border: "1px solid " + LINE, borderRadius: 12, padding: 10, minHeight: 320, display: "flex", flexDirection: "column", gap: 8, background: WHITE }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{b.label}</span>
                    <span style={{ fontSize: 13, color: TEXT_MUTED }}>{here.length}</span>
                  </div>
                  <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: -4 }}>{b.blurb}</div>
                  {picked && board.cards?.[picked]?.bucket !== b.id
                    ? <button className="gv-focus" onClick={() => move(picked, b.id)} style={{ ...btn(false), color: a, borderColor: a }}>Put {first(picked)} here</button>
                    : null}
                  {here.map(cardOf)}
                </section>
              );
            })}
          </div>
        </main>
      ) : null}
    </div>
  );
}

function Card({ student, due, card, work, accent, dragging, picked, editing, onDragStart, onDragEnd, onPick, onEdit, onCancel, onSave }) {
  const [comment, setComment] = useState(card.comment || "");
  const [note, setNote] = useState(card.note || "");
  useEffect(() => { if (editing) { setComment(card.comment || ""); setNote(card.note || ""); } }, [editing]);   // eslint-disable-line react-hooks/exhaustive-deps

  const late = work.last ? isLate(work.last.ts, due) : false;
  const link = work.link;
  const grade = card.bucket ? BUCKETS.find(b => b.id === card.bucket) : null;

  return (
    <div className="gv-card" draggable={!editing} data-dragging={dragging ? "1" : "0"}
      onDragStart={onDragStart} onDragEnd={onDragEnd}
      style={{ border: "1px solid " + (picked ? accent : LINE_STRONG), boxShadow: picked ? "0 0 0 2px " + accent : "none",
        borderRadius: 12, padding: "10px 12px", background: WHITE, display: "flex", flexDirection: "column", gap: 6, fontSize: 15 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="gv-focus" onClick={onPick} aria-pressed={picked}
          style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0, fontFamily: F, fontSize: 17, fontWeight: 600, color: TEXT_PRIMARY, cursor: "pointer", minHeight: 28, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {student.name}
        </button>
        {grade ? <span style={{ flex: "none", fontSize: 13, fontWeight: 700, color: accent }}>{grade.label}</span>
          : work.earlier ? <span style={{ flex: "none", fontSize: 13, color: TEXT_MUTED }}>earlier: {gradeText(work.earlier)}</span> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13, color: TEXT_MUTED }}>
        {link
          ? <a className="gv-focus" href={link} target="_blank" rel="noreferrer" style={{ color: accent, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>Open their file ↗ <span style={{ fontWeight: 400, color: TEXT_MUTED, fontSize: 13 }}>{hostOf(link)}</span></a>
          : work.last ? <span>Turned in a note, no link</span>
          : <span>Nothing turned in</span>}
        {work.last ? <span>{fmtDay(work.last.ts)}{late ? " · late" : ""}</span> : null}
      </div>
      {work.last?.text && !editing ? <div style={{ fontSize: 13, color: TEXT_SECONDARY, whiteSpace: "pre-wrap", maxHeight: 40, overflow: "hidden" }}>{work.last.text}</div> : null}

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }} onDragStart={e => e.stopPropagation()}>
          <div>
            <div style={label}>Comment to {first(student.name)}</div>
            <textarea className="gv-box" value={comment} onChange={e => setComment(e.target.value)} placeholder="Goes out with the grade" autoFocus />
          </div>
          <div>
            <div style={label}>Note to myself</div>
            <textarea className="gv-box" value={note} onChange={e => setNote(e.target.value)} placeholder="Stays on this page" style={{ minHeight: 44 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="gv-focus" onClick={() => onSave({ comment: comment.trim(), note: note.trim() })}
              style={{ minHeight: HIT, padding: "0 14px", borderRadius: 8, background: accent, color: "#fff", border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Save</button>
            <button className="gv-focus" onClick={onCancel}
              style={{ minHeight: HIT, padding: "0 12px", borderRadius: 8, background: "none", color: TEXT_SECONDARY, border: "1px solid " + LINE_STRONG, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {card.comment ? <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{card.comment}</div> : null}
          {card.note ? <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.45, whiteSpace: "pre-wrap", background: SUNK, borderRadius: 8, padding: "6px 8px" }}><span style={{ fontWeight: 700 }}>Note: </span>{card.note}</div> : null}
          <button className="gv-focus" onClick={onEdit}
            style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontFamily: F, fontSize: 15, fontWeight: 600, color: accent, cursor: "pointer", minHeight: HIT }}>
            {card.comment || card.note ? "Edit the comment" : "Add a comment"}
          </button>
        </>
      )}
    </div>
  );
}
