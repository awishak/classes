// Grade view. The whole class as cards on a white page, one assignment at a
// time, and a column for each grade to drag them into. See grades.js for what a column
// means and what Release does.
//
// The page is meant to be as plain as a whiteboard: names, a link to the file,
// the grade, the comment. Nothing else competes.

import { useState, useEffect, useMemo } from "react";
import { useClassData } from "./store.js";
import { usePhotos, useWithPhotos } from "./photos.js";
import { useWithWorksheetSubmits } from "./worksheetSubmits.js";
import { Avatar, profileOf } from "./Face.jsx";
import { ThemeStyle } from "./ThemeShell.jsx";
import { withIds } from "./roster.js";
import { sectionOf } from "./sections.js";
import { checkinTasksOf, isCheckin, answersOf, CHECKIN_QUESTIONS } from "./checkins.js";
import { schedulingLinkOf } from "../instructors.js";
import { isLate, unanswered, appreciatePatch, deletePatch } from "./AssignmentsCard.jsx";
import { regradeOf, regradePending, alive, bucketsFor, bucketOf, boardOf, placeCard, writeCard, releasePatch, hidePatch, changedSinceRelease, releaseCounts, sortedCount, gradeText, htmlToText, toHtml } from "./grades.js";
import { RichComment } from "./RichComment.jsx";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const LINE = TOKENS.LINE.soft;
const LINE_STRONG = TOKENS.LINE.strong;
const WHITE = TOKENS.SURFACE.card;
const SUNK = TOKENS.SURFACE.sunk;
const MONO = TOKENS.FONT.label;
const OK = TOKENS.STATE.ok;
const LATE = TOKENS.STATE.late;
const HIT = TOKENS.HIT;

const label = { fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };

// What the comment box understands, in one line under the box. The markup is
// toHtml's, in grades.js, and the card below the box shows the result.
const MarkupHint = () => (
  <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.4, marginTop: 4 }}>
    A blank line starts a paragraph. A line that starts with - is a bullet. Two stars around words make them **bold**.
  </div>
);

const CSS = `
.gv-focus:focus-visible{outline:2px solid var(--gv-accent);outline-offset:2px;border-radius:8px}
.gv-card{cursor:grab}
.gv-card:active{cursor:grabbing}
.gv-card[data-dragging="1"]{opacity:.4}
.gv-fold>summary{list-style:none}
.gv-fold>summary::-webkit-details-marker{display:none}
.gv-fold>summary::before{content:"▸";font-size:11px;color:var(--text-muted)}
.gv-fold[open]>summary::before{content:"▾"}
.gv-zone[data-over="1"]{background:var(--surface-sunk);outline:2px dashed var(--gv-accent);outline-offset:-2px}
textarea.gv-box{width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;border:1px solid var(--line-strong);font-family:var(--font-body);font-size:16px;line-height:1.45;color:var(--text-primary);background:var(--surface-card);resize:vertical;min-height:64px}
@media (prefers-reduced-motion: reduce){*{transition:none!important}}
`;

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "link"; } };

// The file a turn-in points at, as an address a page can hold in a frame.
// A Google Doc, Slides, Sheet or Drive file has a /preview form that draws
// without the editor around it, and a Canva design takes ?embed. Anything
// else, a canva.link short address included, gets no frame and opens in a
// tab of its own.
const embedOf = (url) => {
  if (!url) return "";
  // A worksheet on this site, Worktopia included, is a page of our own and
  // draws as itself.
  if (/^\//.test(url)) return url;
  let u;
  try { u = new URL(url); } catch { return ""; }
  const host = u.hostname.replace(/^www\./, "");
  if (typeof window !== "undefined" && host === window.location.hostname) return url;
  if (host === "docs.google.com") {
    const m = u.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([^/]+)/);
    return m ? "https://docs.google.com/" + m[1] + "/d/" + m[2] + "/preview" : "";
  }
  if (host === "drive.google.com") {
    const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
    const id = m ? m[1] : u.searchParams.get("id");
    return id ? "https://drive.google.com/file/d/" + id + "/preview" : "";
  }
  if (host === "canva.com") {
    const m = u.pathname.match(/^\/design\/([^/]+)\/([^/]+)/);
    return m ? "https://www.canva.com/design/" + m[1] + "/" + m[2] + "/view?embed" : "";
  }
  return "";
};
const first = (name) => String(name || "").split(" ")[0];
const fmtDay = (ts) => ts ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

// The latest thing a student turned in, and whether a grade from the old
// grading flow is already on the log.
const workOf = (data, aid, name) => {
  const log = alive(data?.assignmentLog?.[aid]?.[name]);
  const subs = log.filter(e => e.type === "submission");
  const last = subs[subs.length - 1] || null;
  // A regrade can carry a new link, and when it does that is the file to open.
  const regrade = regradeOf(log);
  const linked = [...subs, ...(regrade ? [regrade] : [])].sort((x, y) => y.ts - x.ts).find(e => e.link) || null;
  const grades = log.filter(e => e.type === "grade" && !e.board);
  // Comments posted on the assignment itself, so the card holds the whole
  // conversation with the student rather than only the comment typed here.
  // Both sides of the conversation, so a message from the student is read
  // where the grading happens rather than somewhere else.
  const comments = log.filter(e => e.type === "comment")
    .map(e => ({ id: e.id, text: htmlToText(e.html || e.text), at: e.ts, mine: e.from !== "student", liked: e.appreciatedBy })).filter(c => c.text);
  return { last, link: linked?.link || "", earlier: grades[grades.length - 1] || null, count: subs.length, comments, waiting: unanswered(log),
    regrade: regradePending(log) ? regrade : null };
};

export default function GradeView({ config }) {
  const [stored, update] = useClassData(config.storageKey);
  // The faces live one row over; put back on the profiles here. See photos.js.
  const [photos] = usePhotos(config.storageKey);
  // And a linked worksheet's submits on its assignment, read-only. See worksheetSubmits.js.
  const data = useWithWorksheetSubmits(useWithPhotos(stored, photos), config);
  const a = config.accent;
  // The class's own challenges and the two check-ins, which are sorted here
  // like any other. See checkins.js.
  const assignments = useMemo(() => {
    const own = data?.assignments || config.assignments || [];
    return [...own, ...checkinTasksOf(config, data).filter(c => !own.some(x => x.id === c.id))];
  }, [data, config]);
  const everyone = useMemo(() => withIds(data?.students?.length ? data.students : (config.students || [])), [data, config]);
  // The sittings on the roster, for a class that meets twice. Andrew,
  // 2026-10-14, on the visual language exercises: "I definitely want to be
  // able to sort by the 8 AM class or the 10:30 class." The pick is in the
  // URL beside the assignment, so a link can open one room's board.
  const sections = useMemo(() => [...new Set(everyone.map(sectionOf).filter(Boolean))].sort(), [everyone]);

  // The assignment in the URL, so a link can open the board on one of them.
  const fromUrl = (k) => { try { return new URLSearchParams(window.location.search).get(k) || ""; } catch { return ""; } };
  const [aid, setAid] = useState(() => fromUrl("a") || assignments[0]?.id || "");
  const [section, setSection] = useState(() => fromUrl("s"));
  useEffect(() => { if (!aid && assignments[0]) setAid(assignments[0].id); }, [assignments, aid]);
  const toUrl = (id, sec) => {
    try { window.history.replaceState({}, "", window.location.pathname + "?a=" + encodeURIComponent(id) + (sec ? "&s=" + encodeURIComponent(sec) : "")); } catch { /* a render with no window */ }
  };
  const pick = (id) => { setAid(id); toUrl(id, section); };
  const pickSection = (sec) => { setSection(sec); toUrl(aid, sec); };
  const roster = useMemo(() => section && sections.includes(section) ? everyone.filter(s => sectionOf(s) === section) : everyone, [everyone, section, sections]);

  const asg = assignments.find(x => x.id === aid) || null;
  // Andrew, 2026-10-01: "put that as a hint to myself in grade view, hey this
  // is how we grade." The note lives on the assignment in config, so it is
  // read off config even when the store holds its own copy of the list.
  const howWeGrade = asg?.howWeGrade || (config.assignments || []).find(x => x.id === aid)?.howWeGrade || "";
  const board = boardOf(data, aid);
  const [dragging, setDragging] = useState("");
  const [over, setOver] = useState("");
  const [picked, setPicked] = useState("");
  const [editing, setEditing] = useState("");
  const [confirm, setConfirm] = useState("");
  // The walk: the names in the order they are walked, fixed when the walk
  // opens, or null when the board is up. See Walk below.
  const [walk, setWalk] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setPicked(""); setEditing(""); setConfirm(""); setWalk(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const move = (name, bucket) => {
    if (!name || !aid) return;
    update(prev => placeCard(prev, aid, name, bucket));
    setPicked(""); setDragging(""); setOver("");
  };
  // The comment and the grade are written together, from the same box.
  // Andrew, 2026-09-30: "when i do add a comment, replace the note to myself
  // area with the grade options." A bucket of undefined leaves the card
  // where it is; null puts it back on the pile.
  const save = (name, fields, bucket) => {
    update(prev => {
      const next = writeCard(prev, aid, name, fields);
      return bucket === undefined ? next : placeCard(next, aid, name, bucket);
    });
    setEditing("");
  };
  const release = () => { update(prev => releasePatch(prev, aid, Date.now(), { meetingLink: schedulingLinkOf(config) })); setConfirm(""); };
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
    return <Card key={s.name} student={s} profile={profileOf(data, s.name)} due={asg?.due} card={card} work={workOf(data, aid, s.name)} accent={a}
      checkin={isCheckin(asg) ? { answers: answersOf(data, aid, s.name), href: config.path + "/checkins?w=" + asg.week + "&s=" + encodeURIComponent(s.name) } : null}
      columns={columns}
      dragging={dragging === s.name} picked={picked === s.name} editing={editing === s.name}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", s.name); e.dataTransfer.effectAllowed = "move"; setDragging(s.name); }}
      onDragEnd={() => { setDragging(""); setOver(""); }}
      onPick={() => setPicked(p => p === s.name ? "" : s.name)}
      onEdit={() => setEditing(s.name)} onCancel={() => setEditing("")}
      onSave={(fields, bucket) => save(s.name, fields, bucket)}
      onAppreciate={(eid) => update(prev => appreciatePatch(prev, aid, s.name, eid, "instructor"))}
      onDelete={(eid) => update(prev => deletePatch(prev, aid, s.name, eid, "instructor"))} />;
  };

  // The pile reads in the order the work came in, so the first file turned in
  // is the first card grabbed. Anyone with nothing turned in sits at the end,
  // in roster order.
  const firstIn = (s) => { const subs = (data?.assignmentLog?.[aid]?.[s.name] || []).filter(e => e.type === "submission"); return subs.length ? subs[0].ts : Infinity; };
  // The columns this challenge is graded in: letters, or Complete, Not quite,
  // Incomplete and Not submitted. A card sorted under the other scale before
  // the challenge changed scale goes back to the pile.
  const columns = bucketsFor(asg);
  const inScale = new Set(columns.map(b => b.id));
  const pile = roster.filter(s => !inScale.has(board.cards?.[s.name]?.bucket))
    .map((s, i) => ({ s, i, ts: firstIn(s) }))
    .sort((x, y) => (x.ts - y.ts) || (x.i - y.i))
    .map(x => x.s);
  const inBucket = (id) => roster.filter(s => board.cards?.[s.name]?.bucket === id);
  const sorted = sortedCount(board);
  const released = !!board.released;
  const stale = changedSinceRelease(board, data, aid);
  // Who a press on Release would actually reach. A grade the student already
  // has, with the same letter and comment, is not sent again.
  const counts = releaseCounts(data, aid);
  const sending = counts.new + counts.changed;
  // After Hide nothing is up, so Release puts every sorted grade back, and a
  // grade that is back unchanged still brings no second card.
  const toSend = released ? sending + counts.withdrawn : sorted;

  const btn = (solid) => ({ minHeight: HIT, padding: "0 14px", borderRadius: 8, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
    background: solid ? a : WHITE, color: solid ? "#fff" : TEXT_PRIMARY, border: "1px solid " + (solid ? a : LINE_STRONG) });

  return (
    <div style={{ minHeight: "100vh", background: WHITE, color: TEXT_PRIMARY, fontFamily: F, "--gv-accent": a }}>
      <ThemeStyle theme="clean" />
      <style>{CSS}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 5, background: WHITE, borderBottom: "1px solid " + LINE }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{config.code} · Grade view</div>
          {assignments.length ? (
            <select className="gv-focus" value={aid} onChange={e => pick(e.target.value)} aria-label="Challenge"
              style={{ minHeight: HIT, padding: "0 10px", borderRadius: 8, border: "1px solid " + LINE_STRONG, fontFamily: F, fontSize: 16, background: WHITE, color: TEXT_PRIMARY, maxWidth: 360 }}>
              {assignments.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}
            </select>
          ) : <span style={{ color: TEXT_MUTED, fontSize: 15 }}>No challenges in this class yet.</span>}
          {sections.length > 1 ? (
            <div role="radiogroup" aria-label="Section" style={{ display: "inline-flex", gap: 4, padding: 3, borderRadius: 10, background: SUNK }}>
              {["", ...sections].map(sec => {
                const on = (section && sections.includes(section) ? section : "") === sec;
                return (
                  <button key={sec || "all"} type="button" role="radio" aria-checked={on} className="gv-focus" onClick={() => pickSection(sec)}
                    style={{ minHeight: HIT - 6, padding: "0 12px", borderRadius: 8, border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
                      background: on ? WHITE : "transparent", color: on ? TEXT_PRIMARY : TEXT_SECONDARY, boxShadow: on ? "0 1px 2px rgba(0,0,0,.12)" : "none" }}>
                    {sec || "Everyone"}
                  </button>
                );
              })}
            </div>
          ) : null}
          {isCheckin(asg) ? <a className="gv-focus" href={config.path + "/checkins?w=" + asg.week} style={{ fontSize: 15, fontWeight: 600, color: a, textDecoration: "none" }}>Read every answer</a> : null}
          {/* The walk starts on the pile, so the first card up is the first
              file nobody has looked at. With the pile empty it walks the
              sorted cards, for a second look. */}
          {!isCheckin(asg) && roster.length ? (
            <button className="gv-focus" style={btn(false)} onClick={() => setWalk([...pile, ...columns.flatMap(b => inBucket(b.id))].map(s => s.name))}>
              {pile.length ? "Walk through the pile" : "Walk through the class"}
            </button>
          ) : null}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, color: TEXT_SECONDARY }}>{sorted} of {roster.length} sorted</span>
            {released ? (
              <span style={{ fontSize: 13, fontWeight: 700, color: stale ? LATE : OK }}>
                {stale ? "Changed since the students saw these" : "Released " + fmtDay(board.released.at)}
              </span>
            ) : null}
            {confirm === "release" ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>
                  {!released
                    ? "Send " + sorted + " grade" + (sorted === 1 ? "" : "s") + " and the comments to the students?"
                    : counts.same
                    ? "Send " + sending + " new or changed grade" + (sending === 1 ? "" : "s") + "? The " + counts.same + " already released stay as they are."
                    : "Send " + sending + " grade" + (sending === 1 ? "" : "s") + " and the comments to the students?"}
                  {released && counts.withdrawn ? " " + counts.withdrawn + " moved back to the pile will be taken back." : ""}
                </span>
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
                <button className="gv-focus" style={{ ...btn(true), opacity: toSend ? 1 : .5 }} disabled={!toSend} onClick={() => setConfirm("release")}>
                  {released && stale ? "Release " + toSend + " more" : "Release grades"}
                </button>
                {released ? <button className="gv-focus" style={btn(false)} onClick={() => setConfirm("hide")}>Hide grades</button> : null}
              </>
            )}
          </div>
        </div>
      </header>

      {asg ? (
        <main style={{ maxWidth: 1600, margin: "0 auto", padding: "16px 20px 48px" }}>
          {howWeGrade ? (
            <details style={{ marginBottom: 16, border: "1px solid " + LINE, borderRadius: 12, padding: "10px 14px", background: SUNK }}>
              <summary className="gv-focus" style={{ cursor: "pointer", fontSize: 15, fontWeight: 600, color: a }}>{"How we grade the " + (asg?.title || "challenge").toLowerCase()}</summary>
              <div style={{ maxWidth: 760, marginTop: 8 }}>
                {howWeGrade.split(/\n{2,}/).map((p, i) => <p key={i} style={{ fontSize: 15, lineHeight: 1.5, color: TEXT_SECONDARY, margin: "0 0 10px" }}>{p}</p>)}
              </div>
            </details>
          ) : null}
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
            {columns.map(b => {
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

      {walk && asg ? (
        <Walk names={walk} roster={roster} data={data} aid={aid} asg={asg} board={board} columns={columns} accent={a}
          onPlace={save} onClose={() => setWalk(null)} />
      ) : null}
    </div>
  );
}

// The walk: one student at a time, their file drawn on the page, the grade a
// press away. Andrew, 2026-10-12, on the visual language exercises: they are
// photo and graphic based, "so I guess I have to look for each one
// individually." So the looking is the page. Left and right move between
// students, a digit is a column, and a grade placed moves on to the next
// student. The order is the pile first, as the work came in, then the sorted
// cards, and the order is fixed when the walk opens so a grade placed never
// reshuffles who comes next.
function Walk({ names, roster, data, aid, asg, board, columns, accent, onPlace, onClose }) {
  const [i, setI] = useState(0);
  const name = names[i];
  const student = roster.find(s => s.name === name) || { name };
  const card = board.cards?.[name] || {};
  const work = workOf(data, aid, name);
  const [comment, setComment] = useState(card.comment || "");
  useEffect(() => { setComment((board.cards?.[name] || {}).comment || ""); }, [name]);   // eslint-disable-line react-hooks/exhaustive-deps
  const embed = embedOf(work.link);
  const late = work.last ? isLate(work.last.ts, asg?.due) : false;
  const grade = card.bucket ? bucketOf(card.bucket) : null;
  const last = i >= names.length - 1;
  const go = (d) => setI(n => Math.max(0, Math.min(names.length - 1, n + d)));
  // A grade placed takes the comment with it and moves on. The last student
  // stays up, so the walk ends on a card and not on nothing.
  const place = (bucket) => { onPlace(name, { comment: comment.trim() }, bucket === (card.bucket || null) ? undefined : bucket); if (!last) go(1); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target && /^(TEXTAREA|INPUT|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (/^[1-9]$/.test(e.key) && columns[Number(e.key) - 1]) { e.preventDefault(); place(columns[Number(e.key) - 1].id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const btn = (solid) => ({ minHeight: HIT, padding: "0 12px", borderRadius: 8, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
    background: solid ? accent : WHITE, color: solid ? "#fff" : TEXT_PRIMARY, border: "1px solid " + (solid ? accent : LINE_STRONG) });
  const quiet = { ...btn(false), opacity: .5, cursor: "default" };

  return (
    <div role="dialog" aria-label="Walk through the work" style={{ position: "fixed", inset: 0, zIndex: 20, background: WHITE, color: TEXT_PRIMARY, fontFamily: F, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderBottom: "1px solid " + LINE, flexWrap: "wrap" }}>
        <button className="gv-focus" style={i === 0 ? quiet : btn(false)} disabled={i === 0} onClick={() => go(-1)}>← Back</button>
        <span style={{ fontFamily: MONO, fontSize: 13, color: TEXT_MUTED, minWidth: 64, textAlign: "center" }}>{i + 1} of {names.length}</span>
        <button className="gv-focus" style={last ? quiet : btn(false)} disabled={last} onClick={() => go(1)}>Next →</button>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
          <Avatar profile={profileOf(data, name)} name={name} accent={accent} size={28} />
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>{name}</span>
          {student.section ? (
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY, background: SUNK, borderRadius: 999, padding: "2px 9px" }}>{student.section}</span>
          ) : null}
        </span>
        <span style={{ fontSize: 15, color: late ? LATE : TEXT_MUTED, fontWeight: late ? 700 : 400 }}>
          {work.last ? fmtDay(work.last.ts) + (late ? " · late" : "") : "Nothing turned in"}
        </span>
        {grade ? <span style={{ fontSize: 15, fontWeight: 700, color: accent }}>{grade.label}</span> : null}
        {work.link ? (
          <a className="gv-focus" href={work.link} target="_blank" rel="noreferrer" style={{ color: accent, fontWeight: 600, fontSize: 15, textDecoration: "none", minHeight: HIT, display: "inline-flex", alignItems: "center" }}>
            Open their file ↗ <span style={{ fontWeight: 400, color: TEXT_MUTED, fontSize: 13, marginLeft: 6 }}>{hostOf(work.link)}</span>
          </a>
        ) : null}
        <button className="gv-focus" style={{ ...btn(true), marginLeft: "auto" }} onClick={onClose}>Done</button>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside style={{ width: 300, flex: "none", borderRight: "1px solid " + LINE, padding: 12, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <div>
            <div style={label}>Grade</div>
            <div role="radiogroup" aria-label="Grade" style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
              {columns.map((b, k) => {
                const on = card.bucket === b.id;
                return (
                  <button key={b.id} type="button" role="radio" aria-checked={on} className="gv-focus" onClick={() => place(b.id)}
                    style={{ ...btn(on), display: "flex", alignItems: "center", gap: 10, textAlign: "left", justifyContent: "flex-start" }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: on ? "#fff" : TEXT_MUTED, minWidth: 12 }}>{k + 1}</span>
                    <span style={{ flex: 1 }}>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={label}>Comment to {first(name)}</div>
            <textarea className="gv-box" value={comment} onChange={e => setComment(e.target.value)} placeholder="Goes out with the grade" style={{ marginTop: 6, minHeight: 96 }} />
            <MarkupHint />
            <button className="gv-focus" style={{ ...btn(false), marginTop: 6 }} onClick={() => onPlace(name, { comment: comment.trim() }, undefined)}>Save the comment</button>
          </div>
          {work.last?.text ? <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{work.last.text}</div> : null}
          {work.last?.why ? <div style={{ fontSize: 15, lineHeight: 1.45, whiteSpace: "pre-wrap" }}><span style={{ fontWeight: 700, color: LATE }}>Late: </span>{work.last.why}</div> : null}
          {work.regrade ? (
            <div style={{ fontSize: 15, lineHeight: 1.45, whiteSpace: "pre-wrap", borderLeft: "3px solid " + accent, paddingLeft: 8 }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>{fmtDay(work.regrade.ts)} · regrade · </span>{work.regrade.text}
            </div>
          ) : null}
          {card.note ? <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.45, whiteSpace: "pre-wrap", background: SUNK, borderRadius: 8, padding: "6px 8px" }}><span style={{ fontWeight: 700 }}>Note: </span>{card.note}</div> : null}
          <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, marginTop: "auto" }}>Left and right change the student. A digit grades and moves on. Escape closes the walk.</div>
        </aside>

        <div style={{ flex: 1, minWidth: 0, background: SUNK, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {embed ? (
            <iframe key={embed} title={first(name) + "'s file"} src={embed} allow="fullscreen"
              style={{ width: "100%", height: "100%", border: "none", display: "block", background: WHITE }} />
          ) : work.link ? (
            <div style={{ textAlign: "center", padding: 24 }}>
              <a className="gv-focus" href={work.link} target="_blank" rel="noreferrer" style={{ ...btn(true), display: "inline-flex", alignItems: "center", fontSize: 17, textDecoration: "none" }}>Open their file ↗</a>
              <div style={{ fontSize: 15, color: TEXT_MUTED, marginTop: 12 }}>A file on {hostOf(work.link)} opens in a tab of its own.</div>
            </div>
          ) : (
            <div style={{ fontSize: 17, color: TEXT_MUTED }}>Nothing turned in.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ student, profile, due, card, work, accent, checkin, columns, dragging, picked, editing, onDragStart, onDragEnd, onPick, onEdit, onCancel, onSave, onAppreciate, onDelete }) {
  const [comment, setComment] = useState(card.comment || "");
  // The grade, chosen in the same box as the comment. Starts on the column
  // the card is in; tapping the lit one again puts the card back on the pile.
  const [bucket, setBucket] = useState(card.bucket || null);
  useEffect(() => { if (editing) { setComment(card.comment || ""); setBucket(card.bucket || null); } }, [editing]);   // eslint-disable-line react-hooks/exhaustive-deps

  const late = work.last ? isLate(work.last.ts, due) : false;
  const link = work.link;
  const grade = card.bucket ? bucketOf(card.bucket) : null;

  return (
    <div className="gv-card" draggable={!editing} data-dragging={dragging ? "1" : "0"}
      onDragStart={onDragStart} onDragEnd={onDragEnd}
      style={{ border: "1px solid " + (picked ? accent : LINE_STRONG), boxShadow: picked ? "0 0 0 2px " + accent : "none",
        borderRadius: 12, padding: "10px 12px", background: WHITE, display: "flex", flexDirection: "column", gap: 6, fontSize: 15 }}>
      {/* Wraps, so a long grade like Completed with Revisions drops under the
          name rather than squeezing the name to nothing. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button className="gv-focus" onClick={onPick} aria-pressed={picked}
          style={{ flex: 1, minWidth: 140, textAlign: "left", background: "none", border: "none", padding: 0, fontFamily: F, fontSize: 17, fontWeight: 600, color: TEXT_PRIMARY, cursor: "pointer", minHeight: 28, display: "flex", alignItems: "center", gap: 8 }}>
          {/* The face is the biggest thing on the card. Andrew, 2026-10-14:
              "I need to see their pictures." */}
          <Avatar profile={profile} name={student.name} accent={accent} size={52} />
          <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.name}</span>
        </button>
        {/* Which sitting they are in, because two rooms of COMM 3 grade
            together. Andrew, 2026-09-23: "when they are in the grade view, i
            need an 8:00 and 10:30 chip next to each students name." */}
        {student.section ? (
          <span style={{ flex: "none", fontFamily: MONO, fontSize: 13, fontWeight: 600, color: TEXT_SECONDARY,
            background: SUNK, borderRadius: 999, padding: "2px 9px" }}>{student.section}</span>
        ) : null}
        {/* The student wrote and nobody has answered: say so where the card is. */}
        {work.regrade ? <span style={{ flex: "none", fontSize: 12, fontWeight: 700, color: "#fff", background: accent, borderRadius: 999, padding: "2px 8px" }}>Regrade requested</span>
          : work.waiting ? <span style={{ flex: "none", fontSize: 12, fontWeight: 700, color: "#fff", background: accent, borderRadius: 999, padding: "2px 8px" }}>New message</span> : null}
        {grade ? <span style={{ flex: "none", fontSize: 13, fontWeight: 700, color: accent }}>{grade.label}</span>
          : work.earlier ? <span style={{ flex: "none", fontSize: 13, color: TEXT_MUTED }}>earlier: {gradeText(work.earlier)}</span> : null}
      </div>
      {/* A check-in has answers rather than a file: the first one, and the
          way to the rest. */}
      {checkin ? (
        checkin.answers ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>{CHECKIN_QUESTIONS[0].text}</div>
            <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.45, whiteSpace: "pre-wrap", maxHeight: 88, overflow: "hidden" }}>{checkin.answers.going}</div>
            <a className="gv-focus" href={checkin.href} style={{ color: accent, fontWeight: 600, fontSize: 15, textDecoration: "none", minHeight: HIT, display: "inline-flex", alignItems: "center" }}>Read the answers</a>
          </div>
        ) : <span style={{ fontSize: 13, color: TEXT_MUTED }}>Nothing turned in</span>
      ) : (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13, color: TEXT_MUTED }}>
        {link
          ? <a className="gv-focus" href={link} target="_blank" rel="noreferrer" style={{ color: accent, fontWeight: 600, fontSize: 15, textDecoration: "none" }}>Open their file ↗ <span style={{ fontWeight: 400, color: TEXT_MUTED, fontSize: 13 }}>{hostOf(link)}</span></a>
          : work.last ? <span>Turned in a note, no link</span>
          : <span>Nothing turned in</span>}
        {work.last ? <span>{fmtDay(work.last.ts)}{late ? " · late" : ""}</span> : null}
      </div>
      )}
      {work.last?.why ? <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.45, whiteSpace: "pre-wrap" }}><span style={{ fontWeight: 700, color: LATE }}>Late: </span>{work.last.why}</div> : null}
      {work.regrade ? (
        <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.45, whiteSpace: "pre-wrap", borderLeft: "3px solid " + accent, paddingLeft: 8 }}>
          <span style={{ fontSize: 13, color: TEXT_MUTED }}>{fmtDay(work.regrade.ts)} · regrade · </span>{work.regrade.text}
        </div>
      ) : null}

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }} onDragStart={e => e.stopPropagation()}>
          <div>
            <div style={label}>Comment to {first(student.name)}</div>
            <textarea className="gv-box" value={comment} onChange={e => setComment(e.target.value)} placeholder="Goes out with the grade" autoFocus />
            <MarkupHint />
          </div>
          {/* The grade options, where the note to myself used to be. Andrew,
              2026-09-30: "replace the note to myself area with the grade
              options." The same words as the columns, so a pill and a column
              agree. A note already written stays on the card and is read
              below; nothing writes a new one. */}
          <div>
            <div style={label}>Grade</div>
            <div role="radiogroup" aria-label="Grade" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {(columns || []).map(b => {
                const on = bucket === b.id;
                return (
                  <button key={b.id} type="button" role="radio" aria-checked={on} className="gv-focus"
                    onClick={() => setBucket(on ? null : b.id)}
                    style={{ minHeight: HIT, padding: "0 12px", borderRadius: 8, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
                      background: on ? accent : WHITE, color: on ? "#fff" : TEXT_PRIMARY, border: "1px solid " + (on ? accent : LINE_STRONG) }}>
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="gv-focus" onClick={() => onSave({ comment: comment.trim() }, bucket === (card.bucket || null) ? undefined : bucket)}
              style={{ minHeight: HIT, padding: "0 14px", borderRadius: 8, background: accent, color: "#fff", border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Save</button>
            <button className="gv-focus" onClick={onCancel}
              style={{ minHeight: HIT, padding: "0 12px", borderRadius: 8, background: "none", color: TEXT_SECONDARY, border: "1px solid " + LINE_STRONG, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {/* The words fold away until asked for. Andrew, 2026-10-14: "a
              little too much information going on on each of the squares ...
              maybe we make the comments expandable." The card reads face,
              name, room, grade, file. Everything written sits under one
              line that says how much is there. */}
          {(() => {
            const n = (card.comment ? 1 : 0) + (work.comments || []).length + (card.note ? 1 : 0) + (work.last?.text ? 1 : 0);
            return n ? (
          <details className="gv-fold" style={{ fontSize: 15 }}>
          <summary className="gv-focus" style={{ cursor: "pointer", fontSize: 13, fontWeight: 700, color: TEXT_SECONDARY, minHeight: 28, display: "flex", alignItems: "center", gap: 6 }}>
            {(card.comment ? "Comment" : "Comments") + (n > 1 ? " · " + n : "")}
            {work.waiting ? <span style={{ fontWeight: 700, color: accent }}>· unanswered</span> : null}
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          {work.last?.text ? <div style={{ fontSize: 13, color: TEXT_SECONDARY, whiteSpace: "pre-wrap" }}><span style={{ fontWeight: 700 }}>With the file: </span>{work.last.text}</div> : null}
          {card.comment ? <RichComment html={toHtml(card.comment)} style={{ color: TEXT_PRIMARY }} /> : null}
          {(work.comments || []).map(c => (
            <div key={c.id} style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.45, whiteSpace: "pre-wrap",
              borderLeft: c.mine ? "none" : "3px solid " + accent, paddingLeft: c.mine ? 0 : 8 }}>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>{fmtDay(c.at)}{c.mine ? "" : " · " + first(student.name)} · </span>{c.text}
              {/* Appreciating a message is an answer: it says so to the
                  student and takes the message off the waiting list. */}
              {c.mine ? (onDelete ? (
                <button className="gv-focus" onClick={() => onDelete(c.id)}
                  style={{ display: "block", background: "none", border: "none", padding: 0, fontFamily: F, fontSize: 13, fontWeight: 700, color: LATE, cursor: "pointer", minHeight: HIT }}>
                  Delete
                </button>
              ) : null) : c.liked === "instructor"
                ? <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: OK }}>Appreciated</span>
                : onAppreciate ? (
                  <button className="gv-focus" onClick={() => onAppreciate(c.id)}
                    style={{ display: "block", background: "none", border: "none", padding: 0, fontFamily: F, fontSize: 13, fontWeight: 700, color: accent, cursor: "pointer", minHeight: HIT }}>
                    Appreciate
                  </button>
                ) : null}
            </div>
          ))}
          {card.note ? <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.45, whiteSpace: "pre-wrap", background: SUNK, borderRadius: 8, padding: "6px 8px" }}><span style={{ fontWeight: 700 }}>Note: </span>{card.note}</div> : null}
          </div>
          </details>
            ) : null;
          })()}
          <button className="gv-focus" onClick={onEdit}
            style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontFamily: F, fontSize: 15, fontWeight: 600, color: accent, cursor: "pointer", minHeight: HIT }}>
            {card.comment || card.note ? "Edit the comment" : "Add a comment"}
          </button>
        </>
      )}
    </div>
  );
}
