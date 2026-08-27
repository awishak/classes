// Dashboard — the surface I open when I teach. Its own mode, not the instructor
// home. Everything needed to run one session, in panels I can drag into the
// arrangement I want, plus the cast controls for the Classroom View.
//
// Panels are drag-to-reorder and 1x/2x wide. Arrangement is per class and saved
// to this browser (it is a preference about my screen, not class data).
//
// Reads and writes the same class store as the rest of the engine:
//   data.dayPlans[date]   built by the Day Plan card
//   data.stocked[date]    things stocked for today that are not in the plan
//   data.attendance[date] instructor-taken; everyone starts Here
//   data.scratch[date]    scratch pad
// Casting goes through live.js; questions through questions.js.

import { useState, useEffect, useRef, useCallback } from "react";
import { useClassData } from "./store.js";
import { useLive, ANIMS, BIG_ANIMS } from "./live.js";
import { useQuestions } from "./questions.js";
import { usePoll } from "./poll.js";
import PollPanel, { oneSentence } from "./PollPanel.jsx";
import HornBoard from "./HornBoard.jsx";
import { useHeadlines } from "./headlines.js";
import HeadlinesBoard from "./HeadlinesBoard.jsx";
import { allDays, currentDay, parseDay } from "./days.js";
import { ENGINE_LIST } from "../config/registry.js";
import { normSlot, sequenceOptions, sequenceFor } from "./dayplan.js";
import { SHARED_KEY, TYPES, typeOf, allBlocks, blockById, matches, sortBlocks, facets, stampScheduled } from "./blocks.js";
import { unplanned, addScheduleItemToDay, addScheduleItem, removeScheduleItem, setScheduleItemClaim, setScheduleItemNote, comingUp, scheduledFor, weekdayOf, TYPE_COLOR, typeLabel } from "./schedule.js";
import { genId } from "../utils.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const TEXT_PRIMARY = "#1c1917";
const TEXT_SECONDARY = "#57534e";
const TEXT_MUTED = "#6b655f"; // warm, and 5.4:1 on white — comfortably past AA.
const BORDER = "#f0edea";
const BORDER_STRONG = "#e3ded8";
const BG = "#fafaf9";
const SURFACE_2 = "#f6f4f1";
const LIVE = "#e11d48";
const OK = "#0f766e";
const WARN = "#b45309";
const TAP = 44;  // student-facing surfaces: students are on phones
const HIT = 36;  // this screen: a trackpad under my hands, where density is the point

const label = { fontSize: 12.5, fontWeight: 600, color: TEXT_MUTED, letterSpacing: 0 };
const mini = { minHeight: HIT, padding: "0 13px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_SECONDARY, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const solid = (a) => ({ ...mini, background: a, borderColor: a, color: "#fff" });
const inputStyle = { width: "100%", padding: "10px 13px", borderRadius: 11, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: 40, background: "#fff", color: TEXT_PRIMARY };
const label2 = { fontSize: 12.5, fontWeight: 600, color: TEXT_MUTED, letterSpacing: 0 };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;

const CSS = `
/* The class tools, joined. They do the same kind of thing at the same moment,
   so they read as one control with four faces rather than four strangers. */
.dash-seg{display:inline-flex;flex:none;border-radius:12px;overflow:hidden;border:1px solid var(--seg);background:#fff}
.dash-seg button{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 13px;border:none;
  border-left:1px solid color-mix(in srgb,var(--seg) 35%,#fff);background:none;cursor:pointer;
  font-family:inherit;font-size:14px;font-weight:500;color:var(--seg);white-space:nowrap}
.dash-seg button:first-child{border-left:none}
.dash-seg button:hover{background:color-mix(in srgb,var(--seg) 10%,#fff)}
.dash-seg kbd{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;opacity:.7;
  border:none;background:none;padding:0}
@supports not (color:color-mix(in srgb,red 10%,#fff)){
  .dash-seg button{border-left-color:rgba(23,19,16,.12)}
  .dash-seg button:hover{background:rgba(23,19,16,.05)}}
.dash-band{background:#fff;border-radius:18px;display:flex;flex-direction:column;
  box-shadow:0 1px 2px rgba(23,19,16,.05),0 0 0 1px rgba(23,19,16,.045)}
.dash-band-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.dash-topic{margin:0;flex:1 1 240px;min-width:0;font-weight:600;letter-spacing:-.03em;line-height:1.1;color:#171310;word-break:break-word}
.dash-week{flex:none;min-height:38px;padding:0 13px;border-radius:11px;border:1px solid rgba(23,19,16,.12);background:#fff;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;color:#171310}
.dash-week:hover{background:rgba(23,19,16,.04)}
.dash-step{flex:none;width:30px;min-height:38px;border-radius:10px;border:none;background:none;cursor:pointer;font-size:17px;color:#5b6068}
.dash-step:hover:not(:disabled){background:rgba(23,19,16,.05)}
.dash-step:disabled{opacity:.25;cursor:default}
.dash-days{display:flex;gap:6px;flex:1 1 auto;min-width:0}
.dash-day{flex:1 1 0;min-width:74px;min-height:44px;border-radius:12px;cursor:pointer;font-family:inherit;text-align:left;
  padding:5px 10px;display:flex;flex-direction:column;gap:1px;border:1.5px solid transparent;background:rgba(23,19,16,.035);color:#171310}
.dash-day[data-on="0"]:hover{background:rgba(23,19,16,.07)}
.dash-prog{flex:0 1 190px;min-width:150px}
.dash-next{display:flex;align-items:center;gap:11px;flex:none;max-width:360px;min-height:46px;border:none;border-radius:13px;padding:7px 15px;cursor:pointer;font-family:inherit;text-align:left;color:#fff}
.dash-next:hover{filter:brightness(1.07)}
.dash-jump{position:absolute;left:0;top:calc(100% + 6px);z-index:51;background:#fff;border:1px solid rgba(23,19,16,.14);
  border-radius:14px;padding:6px;width:330px;max-height:60vh;overflow-y:auto;box-shadow:0 18px 44px -14px rgba(23,19,16,.35)}
.dash-jump-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:none;cursor:pointer;
  padding:8px 9px;border-radius:10px;font-family:inherit;min-height:48px}
.dash-jump-row:hover{background:rgba(23,19,16,.05)}
.dash-jump-row[data-on="1"]{background:rgba(23,19,16,.06)}
.dash-jump-n{flex:none;width:26px;height:26px;border-radius:8px;border:1px solid rgba(23,19,16,.14);display:inline-flex;
  align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#5b6068}
.dash-jump-has{flex:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#5b6068;
  background:rgba(23,19,16,.06);border-radius:9px;padding:2px 7px}
.dash-stage{display:grid;gap:0;padding:14px 18px 26px;align-items:start;max-width:1760px;margin:0 auto}
/* The seam between two columns. Invisible until the pointer is near it, then a
   line you can grab. Sixteen pixels wide so it is catchable, drawn as three so
   it is not a gutter. */
.dash-seam{align-self:stretch;width:16px;cursor:col-resize;position:relative;touch-action:none;
  background:none;border:none;padding:0}
.dash-seam::after{content:"";position:absolute;left:50%;transform:translateX(-50%);top:8px;bottom:8px;width:3px;
  border-radius:2px;background:rgba(23,19,16,.12);opacity:0;transition:opacity .13s}
.dash-seam:hover::after,.dash-seam:focus-visible::after,.dash-seam[data-drag="1"]::after{opacity:1}
.dash-seam[data-drag="1"]::after{background:var(--dash-accent,#171310)}
body[data-resizing="1"]{cursor:col-resize;user-select:none}

/* Too narrow for three. Live goes full width UNDER the flow rather than away —
   the room preview is the one thing on this screen that must never be the
   thing that gets hidden to make room. */
@media (max-width:1240px){.dash-stage{grid-template-columns:minmax(0,1fr)!important}
  .dash-seam{display:none}
  .dash-room{grid-column:1/-1}
  .dash-room .dash-room-body{display:grid;grid-template-columns:minmax(280px,1fr) minmax(0,1fr);gap:12px;align-items:start}
  .dash-rail{position:static!important;max-height:none!important}
  .dash-rail-body{overflow:visible;max-height:none}}
/* Each column says what it is. Three columns that look alike need naming once
   at the top, not explaining every time. Quiet enough to disappear after the
   first week and there when someone else sits down. */
.dash-col{margin:0 0 0 3px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
  font-weight:600;letter-spacing:.11em;text-transform:uppercase;color:#8a9098}
.dash-rail-tabs{display:flex;gap:4px;background:rgba(23,19,16,.045);border-radius:13px;padding:4px;overflow-x:auto;scrollbar-width:none}
.dash-rail-tabs::-webkit-scrollbar{display:none}
.dash-tab{flex:1 1 auto;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 11px;border:none;border-radius:10px;background:none;cursor:pointer;font-family:inherit;font-size:14px;font-weight:500;color:#5b6068;transition:background .14s,color .14s,box-shadow .14s}
.dash-tab:hover{color:#171310}
.dash-tab.on{background:#fff;color:var(--dash-accent,#171310);font-weight:600;box-shadow:0 1px 3px rgba(23,19,16,.13),inset 0 0 0 1px rgba(23,19,16,.05)}
.dash-tab-k{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:#9aa0a6;opacity:.75}
.dash-tab.on .dash-tab-k{color:inherit;opacity:.45}
.dash-tab-n{min-width:19px;height:19px;padding:0 5px;border-radius:10px;color:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
.dash-rail-body{flex:1 1 auto;overflow-y:auto;min-height:0;padding-bottom:6px;--words:var(--fs,15px)}
.dash-rail-body::-webkit-scrollbar{width:9px}
.dash-rail-body::-webkit-scrollbar-thumb{background:rgba(23,19,16,.16);border-radius:5px}



/* A card is a surface, not a box. The border round every one of them, the rule
   under every header and the grip sitting out in the open added up to more
   lines than content. A soft edge and space carry it, and the handles come
   back when the pointer is on the card. */
.dash-panel{background:#fff;border-radius:18px;overflow:hidden;
  box-shadow:0 1px 2px rgba(23,19,16,.05),0 0 0 1px rgba(23,19,16,.045)}
.dash-panel:hover{box-shadow:0 2px 8px -2px rgba(23,19,16,.09),0 0 0 1px rgba(23,19,16,.08)}
.dash-head{display:flex;align-items:center;gap:8px;padding:12px 16px 10px}
.dash-chrome{opacity:0;transition:opacity .12s}
.dash-panel:hover .dash-chrome,.dash-panel:focus-within .dash-chrome{opacity:1}
@media (hover:none){.dash-chrome{opacity:1}}
.dash-item:hover{background:#fff;border-color:${BORDER_STRONG};
  box-shadow:0 2px 6px -2px rgba(23,19,16,.13)}
.dash-item{transition:background .14s,border-color .14s,box-shadow .14s}
/* An empty panel should hand me the next move rather than describe the hole.
   Dashed, quiet, and the full width of the card so it reads as a place to
   click and not as a sentence. */
.dash-empty{display:flex;align-items:center;justify-content:center;width:100%;min-height:52px;
  padding:12px 14px;border:1.5px dashed ${BORDER_STRONG};border-radius:12px;background:none;
  cursor:pointer;font-family:${F};font-size:14px;color:${TEXT_MUTED};text-align:center;line-height:1.35}
.dash-empty:hover{background:rgba(23,19,16,.03)}
.dash-item:hover .dash-go{opacity:1}

/* Class Flow. A border round every row made it read as a spreadsheet, so the
   rows have neither a border nor a fill and space does the separating instead.
   The controls stay out of the way until the pointer is on the row — and until
   the keyboard is, which is the half of that pattern people forget. */
/* One rhythm down the whole flow, so the eye can run the list instead of
   measuring each row. A calendar reads well because every entry is the same
   shape and the colour is on one edge. */
.flow-row{display:flex;align-items:center;gap:11px;min-height:var(--row-h);
  padding:0 10px 0 7px;border-radius:12px;border-left:3px solid transparent;cursor:grab}
.flow-row:hover{background:${SURFACE_2}}
.flow-row.picked{background:${SURFACE_2};border-left-color:var(--dash-accent)}
.flow-row.live{border-left-color:${LIVE} !important;background:rgba(225,29,72,.07)}
.flow-row.over{box-shadow:inset 0 2px 0 var(--dash-accent)}
/* The number carries the colour of what the row is, filled rather than as a
   stub on the edge — one chip per kind, the same chip everywhere it appears. */
.flow-num{flex:none;width:24px;height:24px;border-radius:8px;display:inline-flex;
  align-items:center;justify-content:center;font-family:${MONO};font-size:12px;font-weight:600;
  color:#fff;font-variant-numeric:tabular-nums;border:none;cursor:pointer;padding:0;
  transition:transform .12s,opacity .12s}
.flow-num:hover{transform:scale(1.12)}
.flow-row.done .flow-num{opacity:.4}
.flow-row.done .flow-words{color:${TEXT_MUTED};text-decoration:line-through;text-decoration-thickness:1px}
.flow-row.next{box-shadow:inset 0 0 0 1.5px var(--dash-accent)}
.flow-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px;padding:4px 0}
.flow-words{display:block;width:100%;font-size:var(--words,16px);line-height:1.35;letter-spacing:-.006em;
  overflow-wrap:anywhere;background:none;border:none;padding:0;text-align:left;cursor:pointer}
.flow-src{align-self:flex-start;display:inline-flex;align-items:center;gap:4px;font-size:12px;
  color:#5b6068;text-decoration:none;border-radius:999px;padding:1px 7px;background:${SURFACE_2};
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.flow-src:hover{background:${BORDER_STRONG};color:#171310}
/* My note under a reading. Quiet until there is one, and indented to the
   width of the number chip so it hangs off the thing it is about. */
.dash-note{display:block;width:100%;text-align:left;background:none;
  border:none;padding:2px 7px;border-radius:8px;cursor:text;font-family:${F};font-size:12.5px;
  line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
.dash-note:hover{background:${SURFACE_2}}
/* A reading card. The words get the whole width; the link and the buttons sit
   along the bottom where a card's actions belong. */
.read-card{border-radius:12px;background:${SURFACE_2};overflow:hidden}
.read-body{display:flex;flex-direction:column;gap:2px;padding:8px 8px 4px}
.read-head{display:block;width:100%;text-align:left;background:none;border:none;padding:2px 7px;
  border-radius:8px;cursor:text;font-family:${F};font-size:13px;font-weight:600;line-height:1.4;
  letter-spacing:-.005em;overflow-wrap:anywhere}
.read-head:hover{background:#fff}
.read-title{display:block;padding:1px 7px 2px;font-size:12px;line-height:1.45;color:${TEXT_SECONDARY};
  overflow-wrap:anywhere}
.read-dot{float:left;margin:5px 6px 0 0;width:7px;height:7px;border-radius:50%}
.read-foot{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 10px 8px;
  border-top:1px solid rgba(23,19,16,.06)}
.read-src{margin-right:auto;font-family:${F};font-size:12px;color:${TEXT_MUTED};text-decoration:none;
  max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.read-src:hover{color:#171310;text-decoration:underline}
.read-flag{font-family:${MONO};font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;
  color:${TEXT_MUTED};background:rgba(23,19,16,.06);border-radius:999px;padding:2px 8px}
.flow-tools{display:flex;gap:4px;flex:none;opacity:0;transition:opacity .12s}
.flow-row:hover .flow-tools,.flow-row:focus-within .flow-tools,.flow-row.live .flow-tools,
.flow-row.picked .flow-tools{opacity:1}

/* The heading recedes. Colour on this screen means live or means press me, and
   a heading is neither. */
.flow-sec{display:flex;flex-direction:column;gap:1px;padding-top:18px;position:relative;
  padding-left:13px;border-radius:12px}
.flow-sec::before{content:"";position:absolute;left:3px;top:24px;bottom:6px;width:3px;border-radius:2px;
  background:var(--sec);opacity:.5}
.flow-sec:hover::before{opacity:.95}
.flow-sec-head{display:flex;align-items:center;gap:8px;padding:2px 4px 6px;
  position:sticky;top:0;z-index:2;background:#fff}
.flow-pill{display:inline-flex;align-items:center;gap:7px;background:color-mix(in srgb,var(--sec) 13%,#fff);
  border-radius:999px;padding:5px 12px;border:none;cursor:pointer;font-family:${F};
  font-size:12.5px;font-weight:600;color:var(--sec);letter-spacing:0}
.flow-pill:hover{background:color-mix(in srgb,var(--sec) 22%,#fff)}
@supports not (color:color-mix(in srgb,red 10%,#fff)){
  .flow-pill{background:${SURFACE_2};color:${TEXT_SECONDARY}}}
.flow-sec .flow-add{opacity:0;transition:opacity .12s}
.flow-sec:hover .flow-add,.flow-sec:focus-within .flow-add{opacity:1}
@media (hover:none){.flow-tools,.flow-sec .flow-add{opacity:1}}

/* Keyboard users had no idea where they were on this screen. */
.dash-focus:focus-visible{outline:2px solid var(--dash-accent);outline-offset:2px;border-radius:8px}
.dash-comfortable{--row-h:44px;--gap:11px;--pad:16px;--fs:15px;--topic:26px;--card:16px}
.dash-compact{--row-h:33px;--gap:6px;--pad:11px;--fs:14px;--topic:20px;--card:12px}
.dash-panel{border-radius:var(--card,16px)}
.flow-row{font-size:var(--fs,15px)}
.dash-band{padding:var(--pad,16px) calc(var(--pad,16px) + 4px);gap:var(--gap,11px)}
.dash-topic{font-size:var(--topic,26px)}
.dash-focus:focus:not(:focus-visible){outline:none}

/* The class accent and the live red are 1.71:1 apart, which is no distance at
   all. So live stops relying on colour: it says LIVE, and the dot pulses. */
.dash-live{display:inline-flex;align-items:center;gap:5px;flex:none;
  font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.1em;
  padding:3px 7px;border-radius:5px;background:${LIVE};color:#fff}
.dash-live i{display:block;width:5px;height:5px;border-radius:50%;background:#fff;animation:dashPulse 1.6s ease-in-out infinite}
@keyframes dashPulse{0%,100%{opacity:1}50%{opacity:.35}}

/* The panel grid animates while being dragged and never asked about this. */
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.01ms !important}
}
`;

// One badge, used everywhere something is on the room screen. The word carries
// the meaning; the colour only reinforces it.
const LiveTag = () => <span className="dash-live"><i />LIVE</span>;

// ─────────────────────────────────────────────────────────────
// small pieces
// ─────────────────────────────────────────────────────────────

// A panel now sits where it sits. No grip, no size button, no collapse arrow —
// the rail decides what is showing, so the panel only has to be the panel.
function Panel({ id, title, right, children, flush }) {
  return (
    <section className="dash-panel" data-id={id} style={{ minWidth: 0 }}>
      {title ? (
        <div className="dash-head">
          <h2 style={{ margin: 0, marginRight: "auto", fontFamily: F, fontSize: 15, fontWeight: 600,
            color: TEXT_PRIMARY, letterSpacing: "-.01em", minHeight: HIT, display: "flex", alignItems: "center" }}>{title}</h2>
          {right}
        </div>
      ) : null}
      <div style={{ padding: flush ? 0 : (title ? "0 16px 16px" : 16), display: "flex", flexDirection: "column", gap: 11, minWidth: 0 }}>{children}</div>
    </section>
  );
}

// A rail: one column, a row of tabs at the top, one panel under them.
//
// Tabs rather than a stack because a rail is a place I look when I want one
// particular thing, and four open panels means scrolling to find which. The
// count rides on the tab so a rail can say "three people are asking" without
// being opened, which is the whole reason the old collapsed bars existed.
// The seam between two columns. A button, so the keyboard gets it too: arrows
// nudge by 24px, which is enough to be worth pressing and small enough to aim.
function Seam({ which, onDown, label }) {
  return (
    <button className="dash-seam" onPointerDown={onDown} data-drag="0"
      aria-label={"Resize the " + label + " column"} title={"Drag to resize " + label}
      onKeyDown={e => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        window.dispatchEvent(new CustomEvent("dash:nudge", { detail: { which, dir } }));
      }} />
  );
}

function Rail({ tabs, active, onPick, accent, children, side, className }) {
  return (
    <div className={"dash-rail" + (className ? " " + className : "")}
      style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 8,
        position: "sticky", top: "calc(var(--head-h, 58px) + 14px)",
        maxHeight: "calc(100vh - var(--head-h, 58px) - 28px)" }}>
      <h2 className="dash-col">{side}</h2>
      <div role="tablist" aria-label={side} className="dash-rail-tabs">
        {tabs.map(t => {
          const on = t.id === active;
          return (
            <button key={t.id} role="tab" aria-selected={on} className={"dash-tab dash-focus" + (on ? " on" : "")}
              onClick={() => onPick(t.id)} title={t.label + " \u00b7 press " + t.hot}>
              <span className="dash-tab-k">{t.hot}</span>
              {t.label}
              {t.count ? <span className="dash-tab-n" style={{ background: on ? accent : BORDER_STRONG }}>{t.count}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="dash-rail-body">{children}</div>
    </div>
  );
}

// A castable row.
function Item({ kind, kindColor, title, sub, live, onCast, onDismiss }) {
  return (
    <button className="dash-item" onClick={live && onDismiss ? onDismiss : onCast}
      title={live ? "Take it back down" : "Send it to the room screen"}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
        background: live ? "rgba(225,29,72,.07)" : SURFACE_2, border: "1px solid " + (live ? LIVE : "transparent"),
        borderRadius: 10, padding: "9px 11px", minHeight: TAP, fontFamily: F, transition: "background .14s, border-color .14s" }}>
      <span style={{ flex: "none", fontFamily: MONO, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
        padding: "3px 6px", borderRadius: 5, background: "#fff", border: "1px solid " + (kindColor || BORDER_STRONG), color: kindColor || TEXT_MUTED }}>{kind}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <b style={{ display: "block", fontWeight: 500, fontSize: 15, color: TEXT_PRIMARY, overflow: "hidden", wordBreak: "break-word", lineHeight: 1.4 }}>{title}</b>
        {sub ? <small style={{ color: TEXT_MUTED, fontSize: 12 }}>{sub}</small> : null}
      </span>
      {live ? <LiveTag /> : (
        <span className="dash-go" style={{ flex: "none", fontFamily: MONO, fontSize: 12, letterSpacing: ".08em",
          color: TEXT_MUTED, fontWeight: 400, opacity: 0, transition: "opacity .14s" }}>CAST →</span>
      )}
    </button>
  );
}

// Nothing goes up as a label. Before a thing can be cast it needs a headline —
// one full sentence saying what it shows. "Media rights" is a topic; "Rights
// fees have risen 45% in ten years" is what the room can actually read.
function Castable({ kind, kindColor, title, url, claim, live, accent, onCast, onDismiss, onSaveClaim, num, onSelect, picked, shared, done, next, onTick, assigned, onAssign }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(claim || "");
  useEffect(() => { setDraft(claim || ""); }, [claim]);

  const [why, setWhy] = useState("");
  const commit = (thenCast) => {
    const c = oneSentence(draft);
    // It used to return here and say nothing, so a two-word headline looked
    // like a broken button.
    if (!c) { setWhy("Write the headline first."); return; }
    if (c.split(" ").length < 3) { setWhy("A headline is a sentence. Three words at least."); return; }
    setWhy("");
    onSaveClaim(c);
    setEditing(false);
    if (thenCast) onCast(c);
  };

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, border: "1px solid " + accent, borderRadius: 10, background: "#fff" }}>
        <span style={{ ...label, color: accent }}>Say it in one sentence</span>
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>{title}</div>
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") commit(true); if (e.key === "Escape") setEditing(false); }}
          placeholder="Rights fees have increased 45% over the last 10 years."
          style={inputStyle} />
        {why ? <div style={{ fontSize: 13, fontWeight: 600, color: WARN }}>{why}</div> : null}
        <div style={{ display: "flex", gap: 7 }}>
          <button style={solid(accent)} onClick={() => commit(true)}>Save and cast</button>
          <button style={mini} onClick={() => commit(false)}>Just save</button>
          <button style={{ ...mini, marginLeft: "auto" }} onClick={() => { setWhy(""); setEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }

  // The number says where I am in the day, and its colour says what the thing
  // is. One mark doing both jobs, where there used to be a bordered badge and
  // a dot.
  const sq = { ...mini, flex: "none", minHeight: 34, minWidth: 34, padding: "0 9px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 };
  const words = claim || title;

  return (
    <div className={"flow-row" + (live ? " live" : "") + (picked ? " picked" : "")
      + (done ? " done" : "") + (next ? " next" : "")}>
      <button className="flow-num dash-focus" onClick={onTick}
        title={done ? "Put this row back on the list" : "Tick this row off"}
        style={{ background: done ? TEXT_MUTED : (kindColor || TEXT_MUTED) }}>{done ? "✓" : (num || "")}</button>

      <span className="flow-main">
        <button className="dash-focus flow-words" onClick={onSelect} title="Open the details"
          style={{ color: TEXT_PRIMARY, fontFamily: F }}>{words}</button>
        {url ? (
          <a className="dash-focus flow-src" href={url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()} title={"Open " + url + " in a new tab"}
            style={{ fontFamily: F }}>{hostOf(url)} ↗</a>
        ) : null}
      </span>

      {shared ? (
        <span title="From the library. Editing this headline changes every place the block appears."
          style={{ flex: "none", ...label, fontSize: 11, color: TEXT_MUTED }}>·</span>
      ) : null}

      <span className="flow-tools">
        {onAssign ? (
          <button className="dash-focus" onClick={onAssign} aria-pressed={assigned}
            title={assigned ? "Assigned. Students see this reading under today's date. Click to unassign."
              : "Click to put this reading on today's readings."}
            style={{ ...sq, minWidth: "auto", padding: "0 9px", fontSize: 12,
              ...(assigned ? { background: accent, borderColor: accent, color: "#fff" } : { color: TEXT_MUTED }) }}>
            {assigned ? "Assigned" : "Assign"}
          </button>
        ) : null}
        {live ? (
          <button className="dash-focus" style={{ ...sq, borderColor: LIVE, color: LIVE }}
            title="Take it back down" onClick={onDismiss}>×</button>
        ) : (
          <button className="dash-focus" style={{ ...sq, borderColor: LIVE, color: LIVE, fontSize: 16, lineHeight: 1 }}
            title="Put it on the room screen"
            onClick={() => { if (claim) onCast(claim); else setEditing(true); }}>→</button>
        )}
        <button className="dash-focus" style={{ ...sq, color: TEXT_MUTED }}
          title={claim ? "Edit the headline" : "Write the headline"} onClick={() => setEditing(true)}>Edit</button>
      </span>
    </div>
  );
}

// The things we actually do in class. They are features, not content: a mode
// the room goes into. Scheduled on a day in the week's items, run from Class
// Flow. Around the Horn opens its own board; the rest announce themselves on
// the room screen until they are built out.
export const FEATURES = {
  "Headlines": "Students bring real headlines. The room votes them into categories.",
  "Game": "The weekly game. Six On Topic, four Sports World.",
  "Fishbowl": "Rotating fishbowl on the assigned readings.",
  "This or That": "Fast forced choice.",
  "Around the Horn": "The seating board. Points for the room.",
  "Team Trivia": "Teams, buzzers, the works.",
};

function FeatureRow({ name, live, accent, onRun, onDismiss }) {
  const blurb = FEATURES[name] || "";
  return (
    <button onClick={live ? onDismiss : onRun}
      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
        background: live ? "rgba(225,29,72,.07)" : "#fff", border: "1px solid " + (live ? LIVE : BORDER_STRONG),
        borderRadius: 10, padding: "9px 12px", minHeight: TAP, fontFamily: F }}>
      <span style={{ flex: "none", width: 7, height: 7, borderRadius: "50%", background: live ? LIVE : accent }} />
      <span style={{ minWidth: 0, flex: 1 }}>
        <b style={{ display: "block", fontWeight: 600, fontSize: 15, color: TEXT_PRIMARY }}>{name}</b>
        <small style={{ color: TEXT_MUTED, fontSize: 12 }}>{blurb}</small>
      </span>
      {live ? <LiveTag /> : (
        <span style={{ flex: "none", fontFamily: MONO, fontSize: 12, letterSpacing: ".08em", color: TEXT_MUTED, fontWeight: 500 }}>RUN →</span>
      )}
    </button>
  );
}

const KIND_COLOR = { Deck: "#7c3aed", PDF: "#b91c1c", Web: "#0369a1", Video: "#b45309", Seed: "#9f1239", Ask: OK, Link: "#0369a1", Note: TEXT_MUTED };

// Whether a link can actually be framed. This has to be an allowlist: most of
// the web sends X-Frame-Options and an iframe that gets refused renders as a
// black rectangle with no error we can catch. Anything not on the list becomes
// a title card, which is a fine thing to project and never a broken one.
const EMBED_HOSTS = /(^|\.)(docs\.google\.com|drive\.google\.com|canva\.com|youtube\.com|youtu\.be|vimeo\.com|loom\.com|figma\.com|desmos\.com|codepen\.io|wikipedia\.org|archive\.org)$/i;
const EMBED_FILES = /\.(pdf|png|jpe?g|gif|webp|svg)(\?|#|$)/i;

export function canEmbed(url) {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (typeof window !== "undefined" && u.origin === window.location.origin) return true;
  if (EMBED_FILES.test(u.pathname)) return true;
  return EMBED_HOSTS.test(u.hostname.replace(/^www\./, ""));
}

// YouTube only frames from its embed path.
function framable(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return "https://www.youtube.com/embed" + u.pathname;
    if (host === "youtube.com" && u.searchParams.get("v")) return "https://www.youtube.com/embed/" + u.searchParams.get("v");
  } catch { /* leave it alone */ }
  return url;
}

export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function castFromLink(l, force) {
  const host = hostOf(l.url);
  const mode = force || (canEmbed(l.url) ? "embed" : "read");
  return {
    type: "doc", kind: host || "Link", title: l.label || l.url,
    url: mode === "embed" ? framable(l.url) : l.url, openUrl: l.url,
    mode, label: l.label || host || "Link",
  };
}

// ─────────────────────────────────────────────────────────────
// panels
// ─────────────────────────────────────────────────────────────
export function NowPanel({ config, engagedAt, onEngaged, plan, seq, onSlot }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(t); }, []);

  // The number that matters is not how long is left, it is how long since the
  // room last had to produce something. Attention does not run down on a clock.
  const since = engagedAt ? Math.floor((now - engagedAt) / 60000) : null;
  const cold = since != null && since >= 10;

  const meets = config.meets || {};
  const mins = (hhmm) => { const [h, m] = (hhmm || "").split(":").map(Number); return isNaN(h) ? null : h * 60 + (m || 0); };
  const d = new Date(now);
  const cur = d.getHours() * 60 + d.getMinutes();
  const start = mins(meets.start), end = mins(meets.end);
  const inClass = start != null && end != null && cur >= start && cur <= end;
  const left = end != null ? Math.max(0, end - cur) : null;

  const slots = seq ? seq.slots.map(x => x.slot) : [];
  const current = plan?.currentSlot;
  // How long the current slot has been running. A sequence is a budget, and
  // the only way to notice you are eating the whole hour on the opener is to
  // see the number while you are still in it.
  const slotStarted = (plan?.slotAt || {})[current];
  const inSlot = slotStarted ? Math.floor((now - slotStarted) / 60000) : null;
  const fair = slots.length && left != null ? Math.round((left + (start != null ? cur - start : 0)) / slots.length) : null;
  const over = fair != null && inSlot != null && inSlot > fair;

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 32, fontWeight: 500, letterSpacing: "-.03em", lineHeight: 1,
          color: cold ? WARN : TEXT_PRIMARY }}>
          {since == null ? "—" : since + " min"}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, paddingBottom: 3 }}>
          since they did anything{inClass && left != null ? " · " + left + " min of class left" : ""}
        </span>
        <button onClick={onEngaged} style={{ ...mini, marginLeft: "auto" }}>They just did something</button>
      </div>
      {cold ? (
        <Muted style={{ color: WARN }}>Ten minutes of listening. Ask them for something.</Muted>
      ) : (
        <Muted style={{ fontSize: 12 }}>Resets on a poll, a pushed question, or the button.</Muted>
      )}
      {slots.length ? (
        <>
        <div style={{ display: "flex", gap: 5 }}>
          {slots.map(x => {
            const on = x === current;
            return (
              <button key={x} onClick={() => onSlot(on ? null : x)}
                style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <i style={{ display: "block", height: 4, borderRadius: 2, background: on ? config.accent : BORDER }} />
                <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".09em", textTransform: "uppercase", color: on ? config.accent : TEXT_MUTED, fontWeight: on ? 700 : 400 }}>{x}</span>
              </button>
            );
          })}
        </div>
        {current ? (
          <Muted style={{ fontSize: 12, color: over ? WARN : TEXT_MUTED }}>
            {inSlot == null ? "In " + current + "." : inSlot + " min in " + current + (fair != null ? " · " + fair + " min is an even share" : "")}
          </Muted>
        ) : (
          <Muted style={{ fontSize: 12 }}>Tap a slot on the way in. The clock starts there.</Muted>
        )}
        </>
      ) : null}
    </>
  );
}

const GoTo = ({ href, accent, children }) => (
  <a className="dash-focus" href={href}
    style={{ ...mini, borderColor: accent, color: accent, textDecoration: "none",
      display: "inline-flex", alignItems: "center", alignSelf: "flex-start" }}>{children}</a>
);

// On the schedule for today, and not in the flow. A reading assigned for
// Wednesday used to exist only on the schedule screen, so on Wednesday morning
// this panel had never heard of it.
export // Where a thing goes, asked properly: which section, and which day. Days
// matter because half of what turns up on today's schedule is really for the
// next one, and moving it should not mean going to find that day first.
function PlaceMenu({ slots, days, today, accent, onPlace, onClose }) {
  const i = days.findIndex(d => d.date === today);
  const next = i >= 0 ? days[i + 1] : null;
  const [date, setDate] = useState(today);
  const quick = [[today, "This day"], ...(next ? [[next.date, "Next class"]] : [])];

  return (
    <div onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(23,19,16,.3)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Where does it go"
        style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 16, border: "1px solid " + BORDER_STRONG,
          boxShadow: "0 24px 60px -20px rgba(23,19,16,.5)", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={label}>Which day</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {quick.map(([d, lbl]) => (
            <button key={d} onClick={() => setDate(d)} aria-pressed={date === d}
              style={{ ...mini, minHeight: HIT, ...(date === d ? { background: accent, borderColor: accent, color: "#fff" } : {}) }}>
              {lbl} · {d}
            </button>
          ))}
          <select value={date} onChange={e => setDate(e.target.value)}
            style={{ ...inputStyle, minHeight: HIT, width: "auto", fontSize: 13.5, padding: "4px 8px" }}>
            {days.map(d => <option key={d.date} value={d.date}>{d.date}{d.topic ? " · " + d.topic : ""}</option>)}
          </select>
        </div>

        <span style={{ ...label, paddingTop: 4 }}>Which section</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {slots.map(([slot, lbl]) => (
            <button key={slot} className="dash-focus" onClick={() => { onPlace(date, slot); onClose(); }}
              style={{ ...mini, minHeight: TAP, justifyContent: "flex-start", textAlign: "left", padding: "0 14px", fontSize: 14.5 }}>
              {lbl}
            </button>
          ))}
        </div>
        <button style={{ ...mini, alignSelf: "flex-start" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function Unplanned({ items, accent, onAdd, castNow }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ ...label, color: WARN }}>On the schedule, not in the flow</div>
      {items.map(it => (
        <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
          background: "rgba(180,83,9,.07)", border: "1px solid rgba(180,83,9,.3)", borderRadius: 10, padding: "8px 11px", minHeight: TAP }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: TYPE_COLOR[it.type] || TEXT_MUTED }} />
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
            color: TYPE_COLOR[it.type] || TEXT_MUTED }}>{typeLabel(it.type)}</span>
          <span style={{ flex: 1, minWidth: 110, fontSize: 14, color: TEXT_PRIMARY, overflow: "hidden", wordBreak: "break-word", lineHeight: 1.4 }}>{it.title}</span>
          {it.loose ? <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: TEXT_MUTED }}>THIS WEEK</span> : null}
          {it.url ? (
            <a href={it.url} target="_blank" rel="noreferrer" className="dash-focus"
              style={{ ...mini, minHeight: 30, padding: "0 10px", fontSize: 12.5, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Open ↗</a>
          ) : null}
          <button className="dash-focus" style={{ ...mini, minHeight: 30, padding: "0 10px", fontSize: 12.5, borderColor: accent, color: accent }}
            onClick={() => onAdd(it)}>Add</button>
        </div>
      ))}
    </div>
  );
}

// Building the day is the job this screen exists for, so it happens here
// rather than on another page. Three ways in, because that is all a slot ever
// holds: something I say, something from the seed library, or something to open.
// The repository, where I am standing. Three hundred blocks is more than a
// list, so it filters by what it is, what it is about, and the words in it —
// facets rather than folders, because a reading is a link AND about identity
// AND from last spring, and a folder makes you pick one.
function LibraryPick({ blocks, accent, onPick }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [topic, setTopic] = useState("");
  const f = facets(blocks);
  const hits = sortBlocks(blocks.filter(b => matches(b, { text: q, type, topic })), "created").slice(0, 40);

  const chip = (on, label, onClick, color) => (
    <button key={label} onClick={onClick} aria-pressed={on}
      style={{ ...mini, minHeight: 30, padding: "0 9px", fontSize: 12.5,
        ...(on ? { background: color || accent, borderColor: color || accent, color: "#fff" } : {}) }}>{label}</button>
  );

  return (
    <>
      <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search everything"
        style={inputStyle} />
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {chip(!type, "All", () => setType(""))}
        {f.types.map(t => chip(type === t.id, t.label, () => setType(type === t.id ? "" : t.id), t.color))}
      </div>
      {f.topics.length ? (
        <select value={topic} onChange={e => setTopic(e.target.value)}
          aria-label="Filter by topic"
          style={{ ...inputStyle, minHeight: 34, fontSize: 13, padding: "4px 8px" }}>
          <option value="">Any topic ({f.topics.length})</option>
          {f.topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 300, overflowY: "auto" }}>
        {hits.map(b => {
          const t = typeOf(b.type);
          return (
            <button key={b.id} className="dash-focus" onClick={() => onPick(b)}
              draggable
              onDragStart={e => { e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData("text/plain", JSON.stringify({ blockId: b.id })); }}
              title="Click to add this block, or drag it straight into the flow"
              style={{ display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left", cursor: "grab",
                background: SURFACE_2, border: "1px solid transparent", borderRadius: 9, padding: "8px 10px",
                minHeight: HIT, fontFamily: F, fontSize: 13.5, color: TEXT_PRIMARY }}>
              <span style={{ flex: "none", marginTop: 3, width: 7, height: 7, borderRadius: "50%", background: t.color }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", wordBreak: "break-word", lineHeight: 1.35 }}>{b.headline || b.title}</span>
                {b.children?.length ? <small style={{ color: TEXT_MUTED, fontSize: 12 }}>{b.children.length} inside</small> : null}
                {b.tags?.length ? <small style={{ color: TEXT_MUTED, fontSize: 12, display: "block" }}>{b.tags.slice(0, 3).join(" · ")}</small> : null}
              </span>
              <span style={{ ...label, fontSize: 12, flex: "none" }}>{t.label}</span>
            </button>
          );
        })}
        {!hits.length ? <Muted style={{ fontSize: 13 }}>Nothing in the repository matches your search.</Muted> : null}
      </div>
      <Muted style={{ fontSize: 12 }}>
        {blocks.length} blocks. Adding one links to it rather than copying it, so editing it later changes it here too.
      </Muted>
    </>
  );
}

function AddToFlow({ slot, seeds, used, accent, onAdd, onClose, scheduled, onAddScheduled, blocks, onPickBlock, days, today }) {
  const [mode, setMode] = useState(blocks?.length ? "lib" : "note");
  const [day, setDay] = useState(today);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [q, setQ] = useState("");

  const lc = q.trim().toLowerCase();
  const hits = seeds
    .filter(sd => !used.has(sd.id))
    .filter(sd => !lc || (sd.title + " " + (sd.concept || "")).toLowerCase().includes(lc))
    .slice(0, 6);

  const addNote = () => { if (!text.trim()) return; onAdd({ text: text.trim() }); setText(""); onClose(); };
  // One box. Paste a web address and it arrives as a link; type words and it
  // arrives as a note. Choosing which beforehand was a tab I did not need.
  const quick = () => {
    const t = text.trim();
    if (!t) return;
    if (looksLikeUrl(t)) {
      onAdd({ text: hostOf(t) || "Link", links: [{ id: genId(), label: hostOf(t) || "Link", url: t }] });
    } else {
      onAdd({ text: t });
    }
    setText(""); onClose();
  };
  const addLink = () => {
    if (!url.trim()) return;
    onAdd({ text: text.trim() || hostOf(url) || "Link", links: [{ id: genId(), label: text.trim() || hostOf(url) || "Link", url: url.trim() }] });
    setText(""); setUrl(""); onClose();
  };

  const tab = (m, lbl) => (
    <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
      style={{ ...mini, minHeight: 30, padding: "0 10px", fontSize: 12.5,
        ...(mode === m ? { background: accent, borderColor: accent, color: "#fff" } : {}) }}>{lbl}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, borderRadius: 10, border: "1px solid " + accent, background: "#fff" }}>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {blocks?.length ? tab("lib", "Library " + blocks.length) : null}
        {tab("note", "Add")}
        {(scheduled || []).length ? tab("sched", "Schedule " + scheduled.length) : null}
        <button style={{ ...mini, minHeight: 30, padding: "0 10px", fontSize: 12.5, marginLeft: "auto", color: TEXT_MUTED }} onClick={onClose}>Cancel</button>
      </div>

      {mode === "note" ? (
        <>
          <input autoFocus value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") quick(); if (e.key === "Escape") onClose(); }}
            placeholder="Type a line, or paste a link" style={inputStyle} />
          <Muted style={{ fontSize: 12 }}>
            {looksLikeUrl(text) ? "A web address goes in as a link." : "Paste a web address and the row becomes a link."}
          </Muted>
        </>
      ) : null}

      {mode === "link" ? (
        <>
          <input autoFocus value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addLink(); if (e.key === "Escape") onClose(); }}
            placeholder="https://…" style={inputStyle} />
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addLink(); }}
            placeholder="What to call it (optional)" style={inputStyle} />
        </>
      ) : null}

      {mode === "seed" ? (
        <>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") onClose(); }}
            placeholder="Search the seed library" style={inputStyle} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {hits.map(sd => (
              <button key={sd.id} onClick={() => { onAdd({ seedId: sd.id }); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", cursor: "pointer",
                  background: SURFACE_2, border: "1px solid transparent", borderRadius: 9, padding: "8px 10px",
                  minHeight: HIT, fontFamily: F, fontSize: 13.5, color: TEXT_PRIMARY }}>
                <span style={{ flex: 1, wordBreak: "break-word", lineHeight: 1.35 }}>{sd.title}</span>
                {sd.concept ? <span style={{ ...label, fontSize: 10, flex: "none" }}>{sd.concept}</span> : null}
              </button>
            ))}
            {!hits.length ? <Muted style={{ fontSize: 13 }}>Nothing in the library matches your search.</Muted> : null}
          </div>
        </>
      ) : null}

      {mode === "lib" ? (
        <>
          <LibraryPick blocks={blocks} accent={accent} onPick={(b) => { if (day === today) { onPickBlock(slot, b); onClose(); } else { onPickBlock(slot, b, day); onClose(); } }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...label, fontSize: 12 }}>Onto</span>
            <select value={day} onChange={e => setDay(e.target.value)}
              style={{ ...inputStyle, minHeight: HIT, width: "auto", fontSize: 13.5, padding: "4px 8px" }}>
              {(days || []).map(d => (
                <option key={d.date} value={d.date}>{d.date === today ? "This day · " + d.date : d.date}</option>
              ))}
            </select>
          </div>
        </>
      ) : null}

      {mode === "sched" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {(scheduled || []).map(it => (
            <button key={it.id} onClick={() => { onAddScheduled(it, slot); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", cursor: "pointer",
                background: SURFACE_2, border: "1px solid transparent", borderRadius: 9, padding: "8px 10px",
                minHeight: HIT, fontFamily: F, fontSize: 13.5, color: TEXT_PRIMARY }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", flex: "none", background: TYPE_COLOR[it.type] || TEXT_MUTED }} />
              <span style={{ flex: 1, wordBreak: "break-word", lineHeight: 1.35 }}>{it.title}</span>
              <span style={{ ...label, fontSize: 10, flex: "none" }}>{typeLabel(it.type)}</span>
            </button>
          ))}
        </div>
      ) : null}

      {mode === "note" ? <button style={solid(accent)} onClick={quick}>Add</button> : null}
      {mode === "link" ? <button style={solid(accent)} onClick={addLink}>Add</button> : null}
    </div>
  );
}

// Move and remove, on the row itself.
// A slot's name is the sequence's word for it until I give it a better one.
// The name is a menu: rename it, or take the whole section out. A sequence's
// own slots can be renamed but not removed, because they belong to the shape
// of the day rather than to me.
// Merge two, and say plainly which way round it goes before doing it. Whichever
// sits higher up the day keeps its name; the other one empties into it and goes.
function MergeMenu({ sections, accent, onMerge, onClose }) {
  const [a, setA] = useState(sections[0]?.[0] || "");
  const [b, setB] = useState(sections[1]?.[0] || "");
  const idx = (k) => sections.findIndex(x => x[0] === k);
  const name = (k) => (sections.find(x => x[0] === k) || [])[1] || k;
  const ok = a && b && a !== b;
  const top = ok ? (idx(a) < idx(b) ? a : b) : null;
  const bottom = ok ? (top === a ? b : a) : null;

  const pick = (val, set, other) => (
    <select value={val} onChange={e => set(e.target.value)}
      style={{ ...inputStyle, minHeight: HIT, fontSize: 14, width: "100%" }}>
      {sections.map(([k, n]) => <option key={k} value={k} disabled={k === other}>{n}</option>)}
    </select>
  );

  return (
    <div onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(23,19,16,.3)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Merge two sections"
        style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 16, border: "1px solid " + BORDER_STRONG,
          boxShadow: "0 24px 60px -20px rgba(23,19,16,.5)", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={label}>Merge two sections</span>
        {pick(a, setA, b)}
        {pick(b, setB, a)}
        <Muted style={{ fontSize: 13.5 }}>
          {ok
            ? "Everything in " + JSON.stringify(name(bottom)) + " moves into " + JSON.stringify(name(top)) + ", and " + JSON.stringify(name(bottom)) + " goes."
            : "Pick two different sections."}
        </Muted>
        <div style={{ display: "flex", gap: 7 }}>
          <button className="dash-focus" style={ok ? solid(accent) : { ...mini, opacity: .45 }} disabled={!ok}
            onClick={() => { onMerge(top, bottom); onClose(); }}>Merge</button>
          <button className="dash-focus" style={mini} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// A stable colour per section, taken from its own name.
//
// Skylight gives everyone in the house a colour and never changes it, which is
// why a week on their wall is legible from across a kitchen without reading a
// word. A section does the same job here: same words, same colour, every week,
// so a nine-row day resolves into three blocks at a glance rather than nine
// identical lines. Eight hues, far enough apart to tell apart, all at one
// lightness so none of them shouts over the others.
// Each hue carries its own lightness rather than sharing one, because at a
// single lightness the greens and cyans come out pale: 158, 190 and 96 landed
// at 3.4, 4.1 and 3.4 against white, all of them under the 4.5 line. These
// eight are each darkened until they clear it, and the check is in
// scripts/check-contrast.mjs so they cannot drift back.
const SEC = [[212, 42], [340, 42], [158, 30], [30, 38], [268, 42], [190, 34], [8, 42], [96, 30]];
export function secColor(key) {
  let h = 0;
  for (let i = 0; i < (key || "").length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const [hue, l] = SEC[h % SEC.length];
  return "hsl(" + hue + " 62% " + l + "%)";
}
export const SEC_ALL = SEC;

function SlotName({ slot, title, accent, onSave, onDelete, count, tally }) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(title || "");
  useEffect(() => { setDraft(title || ""); }, [title]);

  if (editing) {
    const commit = () => { onSave(draft.trim() || undefined); setEditing(false); };
    return (
      <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(title || ""); setEditing(false); } }}
        placeholder={slot}
        style={{ ...inputStyle, minHeight: 28, fontSize: 13, padding: "2px 8px", width: "auto", flex: 1 }} />
    );
  }

  return (
    <span style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} title="Rename or delete this section"
        aria-haspopup="menu" aria-expanded={open} className="dash-focus flow-pill">
        {title || slot}
        {tally ? <span style={{ fontFamily: MONO, fontSize: 11.5, color: TEXT_MUTED, fontWeight: 500 }}>{tally}</span> : null}
        <span style={{ fontSize: 9, opacity: .65 }}>▾</span>
      </button>
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
          <div style={{ position: "absolute", left: 0, top: "calc(100% + 5px)", zIndex: 61, background: "#fff",
            border: "1px solid " + BORDER_STRONG, borderRadius: 10, padding: 5, minWidth: 190,
            boxShadow: "0 12px 30px -10px rgba(23,19,16,.4)", display: "flex", flexDirection: "column", gap: 2 }}>
            <button className="dash-focus" onClick={() => { setOpen(false); setEditing(true); }}
              style={{ ...mini, minHeight: HIT, borderColor: "transparent", justifyContent: "flex-start", padding: "0 12px" }}>Rename</button>
            {onDelete ? (
              <button className="dash-focus" onClick={() => { setOpen(false); onDelete(); }}
                style={{ ...mini, minHeight: HIT, borderColor: "transparent", color: LIVE, justifyContent: "flex-start", padding: "0 12px" }}>
                Delete{count ? " \u00b7 takes " + count + " rows too" : ""}
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </span>
  );
}

// Up, down, Move and a cross was four controls on every row to do two things.
// Dragging covers reordering and moving between sections in one gesture, and
// removing is rare and permanent enough to live behind a right-click.
function RowMenu({ at, onRemove, onClose }) {
  if (!at) return null;
  const x = typeof window !== "undefined" ? Math.min(at.x, window.innerWidth - 190) : at.x;
  return (
    <div onMouseDown={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 75 }}>
      <div onMouseDown={e => e.stopPropagation()}
        style={{ position: "fixed", left: x, top: at.y, background: "#fff", border: "1px solid " + BORDER_STRONG,
          borderRadius: 10, boxShadow: "0 12px 30px -10px rgba(23,19,16,.4)", padding: 5, minWidth: 170 }}>
        <button className="dash-focus" onClick={() => { onRemove(); onClose(); }}
          style={{ ...mini, width: "100%", minHeight: HIT, borderColor: "transparent", color: LIVE,
            justifyContent: "flex-start", padding: "0 12px" }}>Take it out of the day</button>
      </div>
    </div>
  );
}

// The day's readings, and the schedule is the same list. What I put here is
// what students see under that date, and what was already assigned for that
// date is already here — one answer to "what is assigned", not two.
// Ten teaching moves live in the shared repository tagged "teaching move", so
// they are blocks like anything else: droppable into a day, editable, and I can
// add to them. Seeded rather than left empty, because the one empty state that
// reliably stops people starting is a blank box with a plus on it.
export function IdeasPanel({ blocks, accent, sections, days, today, onPick, onAdd, onEdit, onRemove, onDuplicate }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [placing, setPlacing] = useState(null);
  // One idea open at a time. A list of ideas is something I scan for the one I
  // want, and every one of them showing how it runs plus four buttons turned a
  // twelve-idea list into a page of scrolling. The title is the list; the rest
  // is what I asked for when I clicked.
  const [shown, setShown] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const moves = (blocks || []).filter(b => (b.tags || []).includes("teaching move"));

  const startEdit = (b) => { setEditing(b.id); setTitle(b.title); setBody(b.body || ""); setOpen(false); };
  const commit = () => {
    if (!title.trim()) return;
    if (editing) onEdit(editing, title.trim(), body.trim());
    else onAdd(title.trim(), body.trim());
    setTitle(""); setBody(""); setEditing(null); setOpen(false);
  };
  const cancel = () => { setTitle(""); setBody(""); setEditing(null); setOpen(false); };

  const form = (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, borderRadius: 10, border: "1px solid " + accent, background: "#fff" }}>
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="What is it called" style={inputStyle} />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="How it runs"
        style={{ ...inputStyle, minHeight: 64, lineHeight: 1.5, resize: "vertical" }} />
      <div style={{ display: "flex", gap: 7 }}>
        <button style={solid(accent)} onClick={commit}>{editing ? "Save" : "Keep the idea"}</button>
        <button style={mini} onClick={cancel}>Cancel</button>
      </div>
    </div>
  );

  const tool = { ...mini, minHeight: 26, padding: "0 8px", fontSize: 12, color: TEXT_MUTED };

  return (
    <>
      {moves.map(b => editing === b.id ? <div key={b.id}>{form}</div> : (
        <div key={b.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "3px 4px 6px",
          borderRadius: 10, background: shown === b.id ? SURFACE_2 : "transparent" }}>
          <button className="dash-focus" onClick={() => { setShown(shown === b.id ? null : b.id); setPlacing(null); }}
            aria-expanded={shown === b.id}
            draggable
            onDragStart={e => { e.dataTransfer.effectAllowed = "copy";
              e.dataTransfer.setData("text/plain", JSON.stringify({ blockId: b.id })); }}
            title="Drag this idea into a section of the flow, or click to read how the idea runs"
            style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", minHeight: 38, padding: "4px 7px",
              background: "none", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: F, textAlign: "left" }}>
            <span style={{ flex: "none", width: 7, height: 7, borderRadius: "50%", background: typeOf("activity").color }} />
            <b style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.35 }}>{b.title}</b>
            <span style={{ flex: "none", fontSize: 10, color: TEXT_MUTED, transform: shown === b.id ? "none" : "rotate(-90deg)", transition: "transform .14s" }}>▾</span>
          </button>
          {shown !== b.id ? null : (
          <>
          {b.body ? (
            <small style={{ color: TEXT_MUTED, fontSize: 12.5, lineHeight: 1.45, display: "block", padding: "0 7px 2px 23px", whiteSpace: "pre-wrap" }}>{b.body}</small>
          ) : null}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", padding: "0 7px 0 23px" }}>
            <button className="dash-focus" style={{ ...tool, borderColor: accent, color: accent }}
              onClick={() => setPlacing(placing === b.id ? null : b.id)}>{placing === b.id ? "Cancel" : "Add to a section"}</button>
            <button className="dash-focus" style={tool} onClick={() => startEdit(b)}>Edit</button>
            <button className="dash-focus" style={tool} onClick={() => onDuplicate(b)}>Duplicate</button>
            <button className="dash-focus" style={{ ...tool, marginLeft: "auto" }} onClick={() => onRemove(b.id)}>Delete</button>
          </div>
          {placing === b.id ? (
            <PlaceMenu slots={sections || []} days={days || []} today={today} accent={accent}
              onPlace={(date, slot) => onPick(slot, b, date)} onClose={() => setPlacing(null)} />
          ) : null}
          </>
          )}
        </div>
      ))}
      {open && !editing ? form : (
        <button className="dash-focus" style={{ ...mini, alignSelf: "flex-start" }} onClick={() => setOpen(true)}>+ Add an idea</button>
      )}
      <Muted style={{ fontSize: 12 }}>Kept with me rather than with a class, so every class has these.</Muted>
    </>
  );
}

function Suggestions({ blocks, accent, onPick, onAdd }) {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const moves = (blocks || []).filter(b => (b.tags || []).includes("teaching move"));
  const shown = more ? moves : moves.slice(0, 5);
  const keep = () => { if (!title.trim()) return; onAdd(title.trim(), body.trim()); setTitle(""); setBody(""); setOpen(false); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...label, color: accent }}>Ideas</span>
        <button className="dash-focus" style={{ ...mini, minHeight: 26, padding: "0 9px", fontSize: 12, marginLeft: "auto" }}
          onClick={() => setOpen(v => !v)}>{open ? "Close" : "+ Add"}</button>
      </div>
      {shown.map(b => (
        <button key={b.id} className="dash-focus" onClick={() => onPick(b)}
          style={{ display: "flex", alignItems: "flex-start", gap: 9, textAlign: "left", cursor: "pointer",
            background: SURFACE_2, border: "1px solid transparent", borderRadius: 9, padding: "8px 11px",
            minHeight: HIT, fontFamily: F }}>
          <span style={{ flex: "none", marginTop: 5, width: 7, height: 7, borderRadius: "50%", background: typeOf("activity").color }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: "block", fontWeight: 600, fontSize: 14, color: TEXT_PRIMARY }}>{b.title}</b>
            {b.body ? <small style={{ color: TEXT_MUTED, fontSize: 12.5, lineHeight: 1.4, display: "block" }}>{b.body}</small> : null}
          </span>
        </button>
      ))}
      {moves.length > 5 ? (
        <button className="dash-focus" style={{ ...mini, alignSelf: "flex-start" }} onClick={() => setMore(v => !v)}>
          {more ? "Fewer" : (moves.length - 5) + " more"}
        </button>
      ) : null}
      {open ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, borderRadius: 10, border: "1px solid " + accent, background: "#fff" }}>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="What is it called" style={inputStyle} />
          <input value={body} onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") keep(); }} placeholder="How it runs" style={inputStyle} />
          <button style={solid(accent)} onClick={keep}>Keep the block</button>
        </div>
      ) : null}
      <Muted style={{ fontSize: 12 }}>Kept with me rather than with a class, so every class has these. Clicking a seed puts the seed in the day.</Muted>
    </div>
  );
}

// A section I make myself is a slot with a key of its own, so it gets the
// library picker, notes, links, reordering and the rest for free.
const SECTION_PREFIX = "sec-";
const isSection = (k) => k.startsWith(SECTION_PREFIX);

const looksLikeUrl = (t) => /^https?:\/\/\S+$/i.test((t || "").trim());

const MEDIA_KINDS = [["reading", "Reading"], ["video", "Video"], ["podcast", "Podcast"]];
export const MEDIA_SET = new Set(["reading", "video", "podcast"]);

// A reading is its own card, not a row.
//
// Through the shared row it had to fight a number chip, a source pill and
// three buttons for the same line, so a long title came out four characters
// wide. It gets the card now: my headline for it, then the headline it came
// with, then my note, all of them the full width and none of them shouting.
// The link and the buttons go along the bottom, which is where a card's
// actions belong and where they stop stealing width from the words.
function ReadingCard({ item, headline, accent, live, onCast, onDismiss, onHeadline, onNote, onRemove, inFlow }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(headline || "");
  useEffect(() => { setDraft(headline || ""); }, [headline]);
  const commit = (thenCast) => {
    const c = oneSentence(draft);
    if (!c) return;
    onHeadline(c);
    setEditing(false);
    if (thenCast) onCast(c);
  };
  const color = TYPE_COLOR[item.type] || TYPE_COLOR.reading;
  const btn = { ...mini, minHeight: 30, padding: "0 10px", fontSize: 12.5 };

  return (
    <div className="read-card">
      <div className="read-body">
        {editing ? (
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(true); if (e.key === "Escape") { setDraft(headline || ""); setEditing(false); } }}
            placeholder="Say in one sentence what it is for"
            style={{ ...inputStyle, minHeight: 32, fontSize: 13, padding: "4px 8px" }} />
        ) : (
          <button className="dash-focus read-head" onClick={() => setEditing(true)}
            title={headline ? "Edit my headline" : "Write a headline for this reading"}
            style={{ color: headline ? TEXT_PRIMARY : TEXT_MUTED }}>
            {headline || "+ a headline for this reading"}
          </button>
        )}
        <div className="read-title">
          <span className="read-dot" style={{ background: color }} />
          {item.title}
        </div>
        <ReadingNote value={item.note || ""} accent={accent} onSave={onNote} />
      </div>

      <div className="read-foot">
        {item.url ? (
          <a className="dash-focus read-src" href={item.url} target="_blank" rel="noopener noreferrer"
            title={"Open " + item.url + " in a new tab"}>{hostOf(item.url)} ↗</a>
        ) : <span />}
        {inFlow ? <span className="read-flag" title="This reading also has a row in the flow today">in the flow</span> : null}
        {live ? (
          <button className="dash-focus" style={{ ...btn, borderColor: LIVE, color: LIVE }}
            title="Take it back down" onClick={onDismiss}>× Take it down</button>
        ) : (
          <button className="dash-focus" style={{ ...btn, borderColor: LIVE, color: LIVE }}
            title="Put it on the room screen"
            onClick={() => { if (headline) onCast(headline); else setEditing(true); }}>→ Cast</button>
        )}
        <button className="dash-focus" style={{ ...btn, color: TEXT_MUTED }} onClick={onRemove}
          title="Take this off today's readings">Unassign</button>
      </div>
    </div>
  );
}

// Why I picked it. Mine, not the room's.
//
// The headline is the sentence that goes up on the screen. This is the other
// thing — what this reading is good for, the point I meant to make with it,
// the reason it is on this day and not another. In eleven weeks I will not
// remember, and the headline is the wrong place to put it because the headline
// is public.
function ReadingNote({ value, accent, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const commit = () => { onSave(draft.trim()); setEditing(false); };
  if (editing) {
    return (
      <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Escape") { setDraft(value); setEditing(false); }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit(); }}
        placeholder="What I like about this reading, what I use it for\u2026"
        style={{ ...inputStyle, minHeight: 58, fontSize: 13, lineHeight: 1.45, resize: "vertical",
          marginLeft: 35, width: "calc(100% - 35px)" }} />
    );
  }
  return (
    <button className="dash-focus dash-note" onClick={() => setEditing(true)}
      title={value ? "Edit my note" : "Say why this reading is here"}
      style={{ color: value ? TEXT_SECONDARY : TEXT_MUTED }}>
      {value || "+ note"}
    </button>
  );
}

export function Readings({ items, accent, castNow, dismiss, liveLabel, onAdd, onRemove, onClaim, onNote, inFlow, blocks, onPickBlock, blockOf }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("reading");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const commit = () => {
    if (!title.trim() && !url.trim()) return;
    onAdd({ type: kind, title: title.trim() || hostOf(url) || "Untitled", url: url.trim() });
    setTitle(""); setUrl(""); setOpen(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...label, color: accent }}>Today's readings</span>
        <button className="dash-focus" style={{ ...mini, minHeight: 26, padding: "0 9px", fontSize: 12, marginLeft: "auto" }}
          onClick={() => setOpen(v => !v)}>{open ? "Close" : "+ Add"}</button>
      </div>
      {items.map(it => {
        const blk = it.libId && blockOf ? blockOf(it.libId) : null;
        const headline = it.claim || (blk ? blk.headline : "");
        return (
        <ReadingCard key={it.id} item={it} headline={headline} accent={accent}
          live={liveLabel === (headline || it.title)} onDismiss={dismiss}
          onHeadline={(c) => onClaim(it.id, c)} onNote={(v) => onNote(it.id, v)}
          onRemove={() => onRemove(it.id)} inFlow={inFlow?.has(it.id)}
          onCast={(c) => castNow(it.url
            ? { ...castFromLink({ label: it.title, url: it.url }), title: c, label: c }
            : { type: "quote", tag: "Reading", title: c, label: c })} />
        );
      })}
      {!items.length && !open ? (
        <button className="dash-focus dash-empty" onClick={() => setOpen(true)} style={{ borderColor: accent + "55", color: accent }}>
          + Assign a reading or a video for this day
        </button>
      ) : null}
      {open ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, borderRadius: 10, border: "1px solid " + accent, background: "#fff" }}>
          {blocks?.length ? (
            <LibraryPick blocks={blocks.filter(b => b.type === "link")} accent={accent}
              onPick={(b) => { onPickBlock(b); setOpen(false); }} />
          ) : null}
          <div style={{ ...label, paddingTop: 4 }}>or a new one</div>
          <div style={{ display: "flex", gap: 5 }}>
            {MEDIA_KINDS.map(([k, lbl]) => (
              <button key={k} onClick={() => setKind(k)} aria-pressed={kind === k}
                style={{ ...mini, minHeight: 30, padding: "0 10px", fontSize: 12.5,
                  ...(kind === k ? { background: accent, borderColor: accent, color: "#fff" } : {}) }}>{lbl}</button>
            ))}
          </div>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commit(); }} placeholder="What to call this reading" style={inputStyle} />
          <button style={solid(accent)} onClick={commit}>Assign this reading</button>
        </div>
      ) : null}
    </div>
  );
}

// What is landing soon. Not something I build — something the schedule already
// knows and this screen should say out loud before the room leaves.
function ComingUp({ rows, accent, castNow, dismiss, liveLabel, extra }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
      <div style={{ ...label, color: accent }}>Coming up</div>
      {rows.map(({ a, days }) => (
        <Item key={a.id} kind={days === 0 ? "Today" : days === 1 ? "Tomorrow" : "In " + days + "d"}
          kindColor={days <= 1 ? LIVE : days <= 7 ? WARN : TEXT_MUTED}
          title={a.title} sub={"Due " + a.due + (a.weight ? " · " + a.weight + "%" : "")}
          live={liveLabel === a.title} onDismiss={dismiss}
          onCast={() => castNow({ type: "reveal", stamp: "Assignment", title: a.title, due: "Due " + a.due, big: true, label: a.title })} />
      ))}
      {extra}
    </div>
  );
}

export function FlowPanel({ plan, seq, seeds, castNow, dismiss, liveLabel, accent, onClaim, features, onFeature, planHref, onSlidesClaim, onBlockClaim, where, loose, onAddScheduled, onAddItem, onRemoveItem, onMoveItem, onSetSequence, onSetSlotTitle, sequences, onAddBlock, onRemoveBlock, onMoveBlock, blocks2, onPickBlock, blockOf, onBlockHeadline, readings, comingRows, onAddReading, onRemoveReading, onPickReading, onAddIdea, days, today, onFold, onDragMove, onDeleteSection, onMergeSections, onSelect, pickedId, onOrder, doneSet: doneIn, onTick, isAssigned, onToggleAssigned }) {
  const doneSet = doneIn || new Set();
  const [adding, setAdding] = useState(null);
  const [placing, setPlacing] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [merging, setMerging] = useState(false);
  const [overSlot, setOverSlot] = useState(null);
  const [overRow, setOverRow] = useState(null);

  // Dropping on a row puts it before that row; dropping on the section puts it
  // at the end. One gesture, both jobs.
  // Two kinds of thing get dropped here. A row already in the flow carries its
  // slot and moves; anything dragged out of the Material column carries a
  // blockId and no slot, and gets placed. Same drop targets for both, because
  // from where I am sitting it is the same gesture.
  const drop = (e, toSlot, beforeId) => {
    let from;
    try { from = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
    if (!from) return;
    if (from.blockId && !from.slot) { onPickBlock(toSlot, { id: from.blockId }); return; }
    if (!from.id || (from.slot === toSlot && from.id === beforeId)) return;
    onDragMove(from.slot, from.id, toSlot, beforeId);
  };
  const [addingBlock, setAddingBlock] = useState(false);
  const [blockDraft, setBlockDraft] = useState("");
  const unplannedBlock = <Unplanned items={loose || []} accent={accent} onAdd={(it) => setPlacing(it)} castNow={castNow} />;

  const seqPicker = (sequences || []).length > 1 ? (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={label}>Shape</span>
      <select value={seq?.id || ""} onChange={e => onSetSequence(e.target.value)}
        style={{ ...inputStyle, minHeight: HIT, fontSize: 13.5, width: "auto", padding: "4px 8px" }}>
        {sequences.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
    </div>
  ) : null;
  // The deck. Day Plan has had a slides field on every day since it was built
  // and this screen never read it, which left three of the four things the
  // dashboard exists to hold. It is a third-party embed, so it goes up and then
  // gets driven on the room machine.
  const slidesBlock = plan?.slides ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ ...label, color: accent }}>Slides</div>
      <Castable kind="Deck" kindColor={KIND_COLOR.Deck} title={hostOf(plan.slides) || "Slides"}
        url={plan.slides} claim={plan.slidesClaim} accent={accent}
        live={liveLabel === (plan.slidesClaim || "Slides")} onDismiss={dismiss}
        onSaveClaim={onSlidesClaim}
        onCast={(c) => castNow({ ...castFromLink({ label: "Slides", url: plan.slides }), title: c, label: c })} />
    </div>
  ) : null;

  // Freeform blocks. A day built without a sequence is entirely blocks, and
  // until now that day showed up here as an empty panel.
  const blocks = (plan?.blocks || []).filter(b => b.title || b.body || (b.links || []).length);
  const freeform = !(seq?.slots || []).length;

  const blockBlock = blocks.length ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
      <div style={{ ...label, color: accent }}>From an earlier version</div>
      {blocks.map((b, i) => (
        <div key={b.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="dash-focus" style={{ ...mini, minHeight: 26, padding: "0 7px", fontSize: 12, color: TEXT_MUTED }}
              onClick={() => onRemoveBlock(b.id)} title="Remove">Remove</button>
          </div>
          <Castable kind="Note" kindColor={KIND_COLOR.Note} title={b.title || "Untitled block"} claim={b.claim} accent={accent}
            live={liveLabel === (b.claim || b.title)} onDismiss={dismiss}
            onSaveClaim={(c) => onBlockClaim(b.id, c)}
            onCast={(c) => castNow({ type: "quote", tag: "Block", title: c, label: c })} />
          {(b.links || []).map(l => (
            <div key={l.id} style={{ paddingLeft: 16 }}>
              <Castable kind="Link" kindColor={KIND_COLOR.Link} title={l.label} url={l.url}
                claim={l.claim} accent={accent} live={liveLabel === (l.claim || l.label)} onDismiss={dismiss}
                onSaveClaim={(c) => onBlockClaim(b.id, c, l.id)}
                onCast={(c) => castNow({ ...castFromLink(l), title: c, label: c })} />
            </div>
          ))}
        </div>
      ))}
    </div>
  ) : null;

  const featureBlock = features && features.length ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ ...label, color: accent }}>Today we run</div>
      {features.map(f => (
        <FeatureRow key={f} name={f} accent={accent} live={liveLabel === f}
          onRun={() => onFeature(f)} onDismiss={dismiss} />
      ))}
    </div>
  ) : null;

  // No early return for an empty day. A day with nothing in it is the day I
  // have opened this panel to build, so the slots have to be on screen with
  // their Add buttons whether or not anything is in them yet.
  const seedById = (id) => seeds.find(x => x.id === id);
  const slotItems = plan?.slots || {};

  // Slots holding something that the sequence in front of me does not name.
  // They keep their content and say where it came from, so switching to
  // freeform and back loses nothing either way.
  const named = new Set((seq?.slots || []).map(x => x.slot));
  // Sections I made always render, empty or not, because an empty one is where
  // the next thing goes. Anything else unnamed shows only if it holds something.
  const mySections = Object.keys(slotItems).filter(isSection)
    .map(k => [k, normSlot(slotItems[k]).title || "Untitled section"]);
  const orphanSlots = Object.keys(slotItems)
    .filter(k => !named.has(k) && !isSection(k))
    .filter(k => normSlot(slotItems[k]).items.length)
    .map(k => [k, normSlot(slotItems[k]).title || k]);

  const flatRows = [];
  const numberOf = (() => {
    const map = {};
    let n = 0;
    [...(seq?.slots || []).map(x => x.slot),
     ...mySections.map(([k]) => k),
     ...orphanSlots.map(([k]) => k)].forEach(k => {
      normSlot(slotItems[k]).items.forEach(it => {
        map[it.id] = ++n;
        const b = it.blockId ? blockOf(it.blockId) : null;
        const words = (b ? b.headline || b.title : it.claim || it.text) || "";
        flatRows.push({ id: it.id, blockId: it.blockId, item: it, where: normSlot(slotItems[k]).title || k,
          cast: words ? () => castNow(b?.url
            ? { ...castFromLink({ label: b.title, url: b.url }), title: words, label: words }
            : { type: "quote", tag: normSlot(slotItems[k]).title || k, title: words, label: words }) : null });
      });
    });
    return map;
  })();
  useEffect(() => { if (onOrder) onOrder(flatRows); });
  const nextId = (flatRows.find(r => !doneSet.has(r.id)) || {}).id;

  // Folding merges the orphans into one list rather than converting them into
  // something else. Every item keeps its id, its headline and its link back to
  // a block; only the headers go.
  const foldRow = freeform && orphanSlots.length > 1 ? (
    <button className="dash-focus" style={{ ...mini, alignSelf: "flex-start", borderColor: accent, color: accent }}
      onClick={() => onFold(orphanSlots.map(([k]) => k))}>
      Fold {orphanSlots.length} sections into one
    </button>
  ) : null;



  // Every section this day has, named the way the panel names them.
  const sectionList = [
    ...(seq?.slots || []).map(x => [x.slot, normSlot(slotItems[x.slot]).title || x.slot]),
    ...Object.keys(slotItems).filter(isSection).map(k => [k, normSlot(slotItems[k]).title || "Untitled section"]),
  ];

  const addBlockRow = (
    <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
      {addingBlock ? (
        <div style={{ display: "flex", gap: 7, flex: 1 }}>
          <input autoFocus value={blockDraft} onChange={e => setBlockDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && blockDraft.trim()) { onAddBlock(blockDraft.trim()); setBlockDraft(""); setAddingBlock(false); }
              if (e.key === "Escape") { setBlockDraft(""); setAddingBlock(false); }
            }}
            placeholder="What to call the section" style={inputStyle} />
          <button style={solid(accent)} onClick={() => { if (blockDraft.trim()) { onAddBlock(blockDraft.trim()); setBlockDraft(""); setAddingBlock(false); } }}>Add</button>
        </div>
      ) : (
        <>
          <button className="dash-focus" style={{ ...mini, borderColor: accent, color: accent }}
            onClick={() => setAddingBlock(true)}>+ New section</button>
          {sectionList.length > 1 ? (
            <button className="dash-focus" style={mini} onClick={() => setMerging(true)}>Merge sections</button>
          ) : null}
        </>
      )}
    </div>
  );

  const anyContent = seq
    ? seq.slots.some(x => normSlot(slotItems[x.slot]).items.length)
    : false;

  // The extra zones are slots with reserved keys, so they get the library
  // picker, notes, links, reordering and removal without a line of new code.
  const renderSlot = (s, overrideTitle) => {
        const bucket = normSlot(slotItems[s.slot]);
        const items = bucket.items;
        const usedSeeds = new Set((seq?.slots || []).flatMap(x => normSlot(slotItems[x.slot]).items).map(x => x.seedId).filter(Boolean));
        return (
          <div key={s.slot} className="flow-sec"
            onDragOver={e => { e.preventDefault(); setOverSlot(s.slot); }}
            onDragLeave={() => setOverSlot(null)}
            onDrop={e => { e.preventDefault(); setOverSlot(null); drop(e, s.slot); }}
            style={{ "--sec": secColor(bucket.title || s.slot),
              background: overSlot === s.slot ? accent + "0c" : "transparent" }}>
            <div className="flow-sec-head">
              {overrideTitle
                ? <span className="flow-pill" style={{ cursor: "default" }}>{overrideTitle}</span>
                : <SlotName slot={s.slot} title={bucket.title} accent={accent} count={items.length}
                    tally={items.length ? items.filter(x => doneSet.has(x.id)).length + "/" + items.length : ""}
                    onSave={(t) => onSetSlotTitle(s.slot, t)}
                    onDelete={named.has(s.slot) ? null : () => onDeleteSection(s.slot)} />}
              <button className="dash-focus flow-add" style={{ ...mini, minHeight: 26, padding: "0 9px", fontSize: 12, marginLeft: "auto" }}
                onClick={() => setAdding(adding === s.slot ? null : s.slot)}>{adding === s.slot ? "Close" : "+ Add"}</button>
            </div>
            {adding === s.slot ? (
              <AddToFlow slot={s.slot} seeds={seeds} used={usedSeeds} accent={accent}
                onAdd={(item) => onAddItem(s.slot, item)} onClose={() => setAdding(null)}
                scheduled={loose} onAddScheduled={onAddScheduled}
                blocks={blocks2} onPickBlock={onPickBlock} days={days} today={today} />
            ) : null}
            {!items.length && adding !== s.slot ? <Muted style={{ fontSize: 13, padding: "2px 6px" }}>Empty.</Muted> : null}
            {items.map((it, i) => {
              const blk = it.blockId ? blockOf(it.blockId) : null;
              const seed = it.seedId ? seedById(it.seedId) : null;
              const title = blk ? (blk.title || "Untitled") : seed ? seed.title : (it.text || "Untitled");
              const body = blk ? blk.body : (it.bodyOverride || (seed ? seed.body : ""));
              return (
                <div key={it.id} draggable
                  onDragStart={e => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", JSON.stringify({ slot: s.slot, id: it.id })); }}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); setOverRow(it.id); }}
                  onDragLeave={() => setOverRow(null)}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); setOverRow(null); drop(e, s.slot, it.id); }}
                  onContextMenu={e => { e.preventDefault(); setRowMenu({ x: e.clientX, y: e.clientY, slot: s.slot, id: it.id }); }}
                  style={{ display: "flex", flexDirection: "column", gap: 2,
                    borderTop: "2px solid " + (overRow === it.id ? accent : "transparent") }}>
                  <Castable num={numberOf[it.id]} picked={pickedId === it.id} shared={!!it.blockId}
                    done={doneSet.has(it.id)} next={nextId === it.id} onTick={() => onTick(it.id)}
                    onSelect={() => onSelect({ blockId: it.blockId, item: it, where: bucket.title || s.slot, id: it.id })}
                    kind={blk ? typeOf(blk.type).label : seed ? "Seed" : "Note"}
                    kindColor={blk ? typeOf(blk.type).color : KIND_COLOR[seed ? "Seed" : "Note"]}
                    title={title}
                    url={blk?.url || ""}
                    claim={it.claim || (blk ? blk.headline : "")} accent={accent}
                    live={liveLabel === ((it.claim || (blk ? blk.headline : "")) || title)} onDismiss={dismiss}
                    onSaveClaim={(c) => onClaim(s.slot, it.id, c)}
                    assigned={onToggleAssigned ? !!isAssigned(it) : null}
                    onAssign={onToggleAssigned ? () => onToggleAssigned(it) : null}
                    onCast={(c) => castNow(blk?.url
                      ? { ...castFromLink({ label: blk.title, url: blk.url }), title: c, label: c }
                      : { type: "quote", tag: bucket.title || s.slot, title: c, cite: blk?.concept || (seed ? seed.concept : ""), label: c })} />
                  {(it.links || []).map(l => (
                    <div key={l.id} style={{ paddingLeft: 16 }}>
                      <Castable kind="Link" kindColor={KIND_COLOR.Link} title={l.label} url={l.url}
                        claim={l.claim} accent={accent} live={liveLabel === (l.claim || l.label)} onDismiss={dismiss}
                        onSaveClaim={(c) => onClaim(s.slot, it.id, c, l.id)}
                        onCast={(c) => castNow({ ...castFromLink(l), title: c, label: c })} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
  };

  return (
    <>
      <RowMenu at={rowMenu} onRemove={() => onRemoveItem(rowMenu.slot, rowMenu.id)} onClose={() => setRowMenu(null)} />
      {merging ? (
        <MergeMenu sections={sectionList} accent={accent}
          onMerge={(top, bottom) => onMergeSections(top, bottom)} onClose={() => setMerging(false)} />
      ) : null}
      {placing ? (
        <PlaceMenu slots={sectionList} days={days || []} today={today} accent={accent}
          onPlace={(date, slot) => onAddScheduled(placing, slot, date)} onClose={() => setPlacing(null)} />
      ) : null}
      {seqPicker}
      {slidesBlock}
      {unplannedBlock}
      {featureBlock}
      {addBlockRow}
      {(seq?.slots || []).map(s => renderSlot(s))}
      {orphanSlots.map(([slot, title]) => renderSlot({ slot }, title))}
      {foldRow}
      {mySections.map(([slot, title]) => renderSlot({ slot }, title))}
      {blockBlock}
      <ComingUp rows={comingRows || []} accent={accent} castNow={castNow} dismiss={dismiss} liveLabel={liveLabel} />
      {!anyContent && !blockBlock && !freeform ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
          <Muted style={{ fontSize: 13 }}>
            Nothing in <b style={{ color: TEXT_PRIMARY }}>{where}</b> yet. Add to a slot above, or build it out on the full page.
          </Muted>
          <GoTo href={planHref} accent={accent}>Open Day Plan →</GoTo>
        </div>
      ) : null}
    </>
  );
}

const STOCK_KINDS = ["Link", "Video", "PDF", "Deck", "Web", "Note"];

// Three shelves, three lifetimes. Subtopic ideas are for today, topic ideas
// last the week, and the random shelf is always there.
const SHELVES = [
  { id: "day", label: "Subtopic ideas", scope: "today", hint: "For this session specifically." },
  { id: "week", label: "Topic ideas", scope: "this week", hint: "Good for any day this week. Follows the week, not the date." },
  { id: "any", label: "Random", scope: "anything", hint: "No home yet. Anything I want to hand to a class eventually." },
];

export function StockedPanel({ shelves, onAdd, onRemove, onClaim, castNow, dismiss, liveLabel, accent, onToFlow, slots }) {
  const empty = SHELVES.every(sh => !(shelves[sh.id] || []).length);
  return (
    <>
      {empty ? (
        <Muted style={{ fontSize: 13 }}>
          Things I might reach for, kept until I do. Add one below, or send a line across from the Notes panel.
          Anything here can go to the room screen or into the day.
        </Muted>
      ) : null}
      {SHELVES.map(sh => (
        <Shelf key={sh.id} shelf={sh} items={shelves[sh.id] || []} accent={accent}
          onAdd={(item) => onAdd(sh.id, item)} onRemove={(id) => onRemove(sh.id, id)}
          onClaim={(id, c) => onClaim(sh.id, id, c)}
          castNow={castNow} dismiss={dismiss} liveLabel={liveLabel}
          onToFlow={onToFlow} slots={slots} />
      ))}
    </>
  );
}

function Shelf({ shelf, items, onAdd, onRemove, onClaim, castNow, dismiss, liveLabel, accent, onToFlow, slots }) {
  const [open, setOpen] = useState(false);
  const [toFlow, setToFlow] = useState(null);
  const [kind, setKind] = useState("Link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    if (!title.trim() && !url.trim()) return;
    onAdd({ id: genId(), kind, title: title.trim() || url.trim(), url: url.trim() });
    setTitle(""); setUrl(""); setOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10, borderTop: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...label, color: accent }}>{shelf.label}</span>
        <span style={{ ...label, fontSize: 12 }}>{shelf.scope}</span>
      </div>
      {(items || []).length ? null : <Muted style={{ fontSize: 12.5 }}>{shelf.hint}</Muted>}
      {(items || []).map(s => (
        <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Castable kind={s.kind} kindColor={KIND_COLOR[s.kind]} title={s.title} url={s.url}
              claim={s.claim} accent={accent} live={liveLabel === (s.claim || s.title)} onDismiss={dismiss}
              onSaveClaim={(c) => onClaim(s.id, c)}
              onCast={(c) => castNow(s.url
                ? { ...castFromLink({ label: s.title, url: s.url }), title: c, label: c }
                : { type: "quote", tag: shelf.label, title: c, label: c })} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button className="dash-focus" onClick={() => setToFlow(toFlow === s.id ? null : s.id)}
              title="Put it in today's plan"
              style={{ ...mini, minHeight: HIT, padding: "0 10px", borderColor: accent, color: accent }}>→</button>
            <button className="dash-focus" onClick={() => onRemove(s.id)} title="Remove"
              style={{ ...mini, minHeight: HIT, padding: "0 10px", color: TEXT_MUTED }}>✕</button>
          </div>
        </div>
        {toFlow === s.id ? (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", paddingLeft: 4, paddingBottom: 6 }}>
            <span style={{ ...label, fontSize: 12, alignSelf: "center" }}>Into</span>
            {(slots || []).map(sl => (
              <button key={sl} className="dash-focus" style={{ ...mini, minHeight: HIT, padding: "0 10px", fontSize: 12.5 }}
                onClick={() => { onToFlow(sl, s); setToFlow(null); }}>{sl}</button>
            ))}
            {!(slots || []).length ? <Muted style={{ fontSize: 12.5 }}>This day has no slots to put it in.</Muted> : null}
          </div>
        ) : null}
        </div>
      ))}
      {open ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <select value={kind} onChange={e => setKind(e.target.value)} style={{ ...inputStyle, fontSize: 15 }}>
            {STOCK_KINDS.map(k => <option key={k}>{k}</option>)}
          </select>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What is this block" style={inputStyle} />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://… (optional)" style={inputStyle} />
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={add} style={solid(accent)}>Add</button>
            <button onClick={() => setOpen(false)} style={mini}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{ ...mini, alignSelf: "flex-start" }}>+ Add</button>
      )}
    </div>
  );
}

// Three states, three tabs. An answered question is worth keeping — it is the
// record of what the room did not understand — and an archived one still needs
// a way back to open when it turns out to matter next week.
const Q_TABS = [["open", "Open"], ["answered", "Answered"], ["archived", "Archived"]];

export function QuestionsPanel({ items, setState, archiveOpen, castNow, accent }) {
  const [tab, setTab] = useState("open");
  if (items === null) return <Muted>Loading…</Muted>;
  const open = items.filter(q => q.state === tab);
  const unanswered = items.filter(q => q.state === "archived").length;
  const countOf = (st) => items.filter(q => q.state === st).length;

  return (
    <>
      <div style={{ display: "flex", gap: 5 }}>
        {Q_TABS.map(([k, lbl]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k}
            style={{ ...mini, minHeight: 30, padding: "0 10px", fontSize: 13,
              ...(tab === k ? { background: accent, borderColor: accent, color: "#fff" } : {}) }}>
            {lbl} {countOf(k) || ""}
          </button>
        ))}
      </div>
      {open.length === 0 ? <Muted>{tab === "open" ? "Nothing from the room right now." : "Nothing here."}</Muted> : null}
      {open.map(q => (
        <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, borderRadius: 10, background: SURFACE_2 }}>
          <div style={{ ...label, fontSize: 12, display: "flex", gap: 7, alignItems: "center" }}>
            {q.anon
              ? <span style={{ color: accent, border: "1px solid " + accent + "55", borderRadius: 4, padding: "1px 5px" }}>Anon</span>
              : <span>{q.who || "Unknown"}</span>}
            <span>{new Date(q.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, color: TEXT_PRIMARY }}>{q.text}</p>
          <div style={{ display: "flex", gap: 7 }}>
            <button style={solid(accent)}
              onClick={() => castNow({ type: "question", tag: "From the room", title: q.text, cite: q.anon ? "Anonymous" : (q.who || ""), label: "Question · " + (q.anon ? "anonymous" : q.who) })}>
              Push to screen
            </button>
            {q.state === "answered"
              ? <button style={mini} onClick={() => setState(q.id, "open")}>Reopen</button>
              : <button style={mini} onClick={() => setState(q.id, "answered")}>Answered</button>}
            {q.state !== "archived"
              ? <button style={{ ...mini, marginLeft: "auto", color: TEXT_MUTED }} onClick={() => setState(q.id, "archived")}>Later</button>
              : null}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 4 }}>
        <button style={mini} onClick={archiveOpen}>Archive session</button>
        <Muted style={{ fontSize: 12 }}>{unanswered} archived unanswered</Muted>
      </div>
    </>
  );
}

// Everyone starts Here. Tap to walk it down.
const ATT_STATES = ["here", "late", "excused", "out"];
const ATT_STYLE = {
  here: { bg: "rgba(15,118,110,.12)", bd: "rgba(15,118,110,.45)", fg: OK },
  late: { bg: "rgba(180,83,9,.13)", bd: "rgba(180,83,9,.45)", fg: WARN },
  excused: { bg: "rgba(3,105,161,.12)", bd: "rgba(3,105,161,.4)", fg: "#0369a1" },
  out: { bg: "#fff", bd: BORDER_STRONG, fg: TEXT_MUTED },
};

// Everyone starts Here, so taking attendance is only ever about the exceptions.
// Type a few letters to find someone, and once you have marked the room, flip to
// Exceptions so the twenty-five people who showed up stop taking the space.
export function AttendancePanel({ students, marks, onMark, onReset }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState(false);
  const stateOf = (n) => marks[n] || "here";
  const count = (s) => students.filter(st => stateOf(st.name) === s).length;
  const lc = q.trim().toLowerCase();
  const shown = students.filter(st => {
    if (lc && !st.name.toLowerCase().includes(lc)) return false;
    if (only && !lc && stateOf(st.name) === "here") return false;
    return true;
  });
  const marked = students.filter(st => stateOf(st.name) !== "here").length;
  return (
    <>
      <div style={{ display: "flex", gap: 14, fontFamily: MONO, fontSize: 12, color: TEXT_MUTED, alignItems: "center" }}>
        {ATT_STATES.map(s => <span key={s}>{s} <b style={{ color: TEXT_PRIMARY }}>{count(s)}</b></span>)}
        <button style={{ ...mini, minHeight: HIT, padding: "0 10px", marginLeft: "auto", fontSize: 12 }}
          disabled={!marked} onClick={onReset} title="Put everyone back to here">Reset</button>
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a name"
          style={{ ...inputStyle, minHeight: 36, fontSize: 15 }} />
        <button onClick={() => setOnly(v => !v)} aria-pressed={only}
          style={{ ...mini, minHeight: 36, whiteSpace: "nowrap", ...(only ? { borderColor: WARN, color: WARN } : {}) }}>
          Exceptions
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {shown.map(st => {
          const s = stateOf(st.name);
          const c = ATT_STYLE[s];
          return (
            <button key={st.name} onClick={() => onMark(st.name, ATT_STATES[(ATT_STATES.indexOf(s) + 1) % ATT_STATES.length])}
              style={{ border: "1px solid " + c.bd, background: c.bg, color: c.fg, borderRadius: 999, padding: "0 13px", minHeight: 34,
                fontSize: 13, fontFamily: F, fontWeight: s === "out" ? 400 : 500, cursor: "pointer",
                textDecoration: s === "out" ? "line-through" : "none", opacity: s === "out" ? .55 : 1 }}>
              {st.name}
            </button>
          );
        })}
      </div>
      {!shown.length ? <Muted style={{ fontSize: 13 }}>{only ? "Nobody is marked. The whole room is here." : "No name matches your search."}</Muted> : null}
      <Muted style={{ fontSize: 12 }}>Everyone starts here. Tap to cycle here → late → excused → out.</Muted>
    </>
  );
}

// Pre-class and post-class boards. I always drive these by hand — the app
// proposes, I edit, I decide when they go up. Never a bullet list: the screen
// holds one idea at a time and I step through them.
export function BoardsPanel({ boards, proposals, onSave, castNow, dismiss, liveCast, accent }) {
  return (
    <>
      {["pre", "post"].map(which => {
        const saved = boards[which];
        const board = saved || proposals[which];
        const label = which === "pre" ? "Enter" : "Exit";
        const liveHere = liveCast?.type === "board" && liveCast.boardLabel === label;
        return (
          <BoardEditor key={which} label={label} board={board} isProposal={!saved} accent={accent}
            onSave={(b) => onSave(which, b)} onReset={() => onSave(which, null)}
            liveIndex={liveHere ? liveCast.at : null}
            onCast={(i) => castNow({
              type: "board", tag: label, boardLabel: label, title: board.title,
              idea: (board.ideas || [])[i] || "", at: i, count: (board.ideas || []).length,
              showAsk: which === "pre", label: label + " · " + (i + 1),
            })}
            onDismiss={dismiss} />
        );
      })}
    </>
  );
}

function BoardEditor({ label, board, isProposal, accent, onSave, onReset, liveIndex, onCast, onDismiss }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [text, setText] = useState((board.ideas || []).join("\n"));
  const ideasKey = (board.ideas || []).join("\n");
  useEffect(() => { setTitle(board.title); setText(ideasKey); }, [board.title, ideasKey]);

  const ideas = board.ideas || [];
  const live = liveIndex != null;

  if (editing) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, borderRadius: 10, background: SURFACE_2 }}>
        <span style={label2}>{label}</span>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Headline" style={inputStyle} />
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="One idea per line. Each one gets the screen to itself."
          style={{ ...inputStyle, minHeight: 96, resize: "vertical", lineHeight: 1.5, fontSize: 15 }} />
        <div style={{ display: "flex", gap: 7 }}>
          <button style={solid(accent)} onClick={() => {
            onSave({ title, ideas: text.split("\n").map(l => l.trim()).filter(Boolean) });
            setEditing(false);
          }}>Save</button>
          <button style={mini} onClick={() => setEditing(false)}>Cancel</button>
          {!isProposal ? <button style={{ ...mini, marginLeft: "auto", color: TEXT_MUTED }} onClick={() => { onReset(); setEditing(false); }}>Reset to proposed</button> : null}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 11,
      border: "1px solid " + (live ? LIVE : BORDER), borderRadius: 10,
      background: live ? "rgba(225,29,72,.06)" : SURFACE_2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={label2}>{label}</span>
        {isProposal ? <span style={{ ...label2, color: accent, fontSize: 12 }}>proposed</span> : null}
        <button style={{ ...mini, minHeight: HIT, padding: "0 10px", marginLeft: "auto", fontSize: 12 }} onClick={() => setEditing(true)}>Edit</button>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{board.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {ideas.map((idea, i) => (
          <button key={i} onClick={() => (liveIndex === i ? onDismiss() : onCast(i))}
            style={{ display: "flex", gap: 9, alignItems: "flex-start", textAlign: "left", cursor: "pointer",
              background: liveIndex === i ? "rgba(225,29,72,.1)" : "#fff",
              border: "1px solid " + (liveIndex === i ? LIVE : "transparent"),
              borderRadius: 9, padding: "8px 10px", minHeight: 40, fontFamily: F, fontSize: 15, color: TEXT_PRIMARY }}>
            <span style={{ ...label2, fontSize: 12, color: liveIndex === i ? LIVE : TEXT_MUTED, paddingTop: 2 }}>{i + 1}</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{idea}</span>
            <span style={{ ...label2, fontSize: 12, color: liveIndex === i ? LIVE : "transparent", paddingTop: 3 }}>up</span>
          </button>
        ))}
        {!ideas.length ? <Muted style={{ fontSize: 13 }}>No ideas yet. Edit to add some.</Muted> : null}
      </div>
      {live ? (
        <div style={{ display: "flex", gap: 7 }}>
          <button style={mini} disabled={liveIndex <= 0} onClick={() => onCast(liveIndex - 1)}>‹ Back</button>
          <button style={mini} disabled={liveIndex >= ideas.length - 1} onClick={() => onCast(liveIndex + 1)}>Next ›</button>
          <button style={{ ...mini, marginLeft: "auto", borderColor: LIVE, color: LIVE }} onClick={onDismiss}>Take it down</button>
        </div>
      ) : null}
    </div>
  );
}

// Saving on blur meant a note written at 8:40 and never clicked away from was
// gone at 9:05. It saves a second after the typing stops instead.
// A small read-only note with a way back to where it was written.
// Editing a note meant leaving for another page and coming back. These are two
// textareas; they can be edited where they are read.
function Note({ from, body, accent, scope, onSave, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body || "");
  useEffect(() => { setDraft(body || ""); }, [body]);

  if (!body && !editing) {
    return onSave ? (
      <button className="dash-focus" style={{ ...mini, alignSelf: "flex-start" }} onClick={() => setEditing(true)}>+ {from}</button>
    ) : null;
  }
  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(body || ""); setEditing(false); };

  return (
    <div style={{ padding: 11, borderRadius: 10, background: SURFACE_2, border: "1px solid " + (editing ? accent : BORDER) }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
        <span style={{ ...label, color: accent }}>{from}</span>
        {scope ? <span style={{ ...label, fontSize: 12 }}>{scope}</span> : null}
        {onSave && !editing ? (
          <button className="dash-focus" onClick={() => setEditing(true)}
            style={{ ...label, fontSize: 12, marginLeft: "auto", color: TEXT_MUTED, background: "none", border: "none", cursor: "pointer" }}>Edit</button>
        ) : null}
      </div>
      {editing ? (
        <>
          <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") cancel(); }} placeholder={placeholder}
            style={{ ...inputStyle, minHeight: 92, lineHeight: 1.5, resize: "vertical", fontSize: 15 }} />
          <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
            <button style={solid(accent)} onClick={commit}>Save</button>
            <button style={mini} onClick={cancel}>Cancel</button>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 15, lineHeight: 1.5, color: TEXT_PRIMARY, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{body}</div>
      )}
    </div>
  );
}

// Everything written about this day, above the box I scribble in during it.
// Three of these were being written in two different editors and none of them
// reached this screen.
export function ScratchPanel({ value, onSave, dayNote, weekPlan, weekText, accent, day, onStock, onSaveDayNote, onSaveWeekPlan, onSaveWeekText, days, noteFor }) {
  const [noteDay, setNoteDay] = useState(day);
  useEffect(() => { setNoteDay(day); }, [day]);
  const readNote = noteFor || (() => dayNote || "");
  const [v, setV] = useState(value || "");
  const [saved, setSaved] = useState(true);
  const boxRef = useRef(null);
  const seen = useRef(value || "");
  useEffect(() => {
    if (value === seen.current) return;
    seen.current = value || "";
    setV(value || "");
  }, [value]);
  useEffect(() => {
    if (v === seen.current) return;
    setSaved(false);
    const t = setTimeout(() => { seen.current = v; onSave(v); setSaved(true); }, 900);
    return () => clearTimeout(t);
  }, [v, onSave]);

  const stamp = () => {
    const t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setV(prev => (prev && !prev.endsWith("\n") ? prev + "\n" : prev) + t + " — ");
    boxRef.current?.focus();
  };

  return (
    <>
      {/* Two different things, so they look different. The day note was written
          when I planned the session; the box below is what I scribble during it. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...label, color: accent }}>Day note for</span>
        <select value={noteDay} onChange={e => setNoteDay(e.target.value)}
          style={{ ...inputStyle, minHeight: HIT, width: "auto", fontSize: 13.5, padding: "4px 8px" }}>
          {(days || []).map(d => (
            <option key={d.date} value={d.date}>{d.date === day ? "This day · " + d.date : d.date}</option>
          ))}
        </select>
      </div>
      <Note key={noteDay} from={noteDay === day ? "Today" : noteDay} scope={noteDay === day ? day : "another day"}
        body={noteDay === day ? dayNote : readNote(noteDay)} accent={accent} onSave={(v) => onSaveDayNote(v, noteDay)}
        placeholder="What this day is for, in my words." />
      <Note from="Lesson plan" scope="this week" body={weekPlan} accent={accent} onSave={onSaveWeekPlan}
        placeholder="How the week runs." />
      <Note from="Notes for students" scope="this week" body={weekText} accent={accent} onSave={onSaveWeekText}
        placeholder="They read this on the schedule." />
      <textarea ref={boxRef} value={v} onChange={e => setV(e.target.value)} onBlur={() => { seen.current = v; onSave(v); setSaved(true); }}
        placeholder="Notes to myself during class."
        style={{ ...inputStyle, minHeight: 130, resize: "vertical", lineHeight: 1.5, fontSize: 15 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <button style={mini} onClick={stamp}>Stamp the time</button>
        {onStock ? (
          <button className="dash-focus" style={{ ...mini, borderColor: accent, color: accent }}
            title="Put the last line on a shelf"
            onClick={() => {
              const lines = v.split("\n").map(x => x.trim()).filter(Boolean);
              const last = lines[lines.length - 1];
              if (last) onStock(last);
            }}>Stock the last line</button>
        ) : null}
        <Muted style={{ fontSize: 12, marginLeft: "auto" }}>{saved ? "Saved" : "Saving…"}</Muted>
      </div>
    </>
  );
}

// The to-do panel. Two horizons, because they are two different jobs. TODAY is
// what stops the next fifty minutes going wrong. COMING UP is the assignment on
// the horizon, which is the work I put off until a student emails me about it.
// Green is permission to stop reading the panel.
function Line({ ok, children, tone }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, lineHeight: 1.4,
      color: ok ? TEXT_MUTED : TEXT_PRIMARY }}>
      <span style={{ flex: "none", width: 7, height: 7, borderRadius: "50%", marginTop: 5.5,
        background: ok ? OK : (tone === "late" ? LIVE : WARN) }} />
      <span>{children}</span>
    </div>
  );
}

function Horizon({ title, count, checks, accent, right }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...label, color: accent }}>{title}</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: count ? WARN : OK }}>
          {count ? count + " to do" : "clear"}
        </span>
        {right ? <span style={{ ...label, fontSize: 12, marginLeft: "auto", color: TEXT_MUTED }}>{right}</span> : null}
      </div>
      {checks.map((c, i) => <Line key={i} ok={c.ok} tone={c.tone}>{c.ok ? c.good : c.bad}</Line>)}
      {!checks.length ? <Muted style={{ fontSize: 13 }}>Nothing on the calendar.</Muted> : null}
    </div>
  );
}

export function TodoPanel({ plan, seq, features, boards, assignments, shelves, students, data, accent, where, loose }) {
  // ─── today ───
  const slotItems = plan?.slots || {};
  const flowItems = Object.values(slotItems).flatMap(b => normSlot(b).items);
  const noClaim = flowItems.filter(it => !it.claim).length
    + flowItems.flatMap(it => it.links || []).filter(l => !l.claim).length;
  const stocked = (shelves.day || []).length + (shelves.week || []).length;

  const today = [
    { ok: !!plan && flowItems.length > 0, good: flowItems.length + " things in the flow", bad: "Nothing in the flow yet" },
    { ok: noClaim === 0, good: "Every item has its headline written", bad: noClaim + " item" + (noClaim === 1 ? "" : "s") + " will stop and ask for a headline mid-class" },
    { ok: !!boards.pre, good: "The Enter board is written", bad: "You have not written the Enter board yet" },
    { ok: !!boards.post, good: "The Exit board is written", bad: "You have not written the Exit board yet" },
    { ok: stocked > 0, good: stocked + " stocked and ready to reach for", bad: "Nothing stocked for today or this week" },
    { ok: !!plan?.slides, good: "Slides are linked", bad: "No slides linked for this day" },
    { ok: (loose || []).length === 0,
      good: "Everything on the schedule has a row in the flow",
      bad: (loose || []).length + " thing" + ((loose || []).length === 1 ? "" : "s") + " on the schedule still need a row in the flow" },
  ];

  // ─── the assignment on the horizon ───
  const dated = assignments.filter(a => a.due && a.due !== "Ongoing");
  const now = Date.now();
  const daysTo = (due) => {
    const d = new Date(due + ", 2026");
    if (isNaN(d)) return null;
    return Math.ceil((new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime() - now) / 86400000);
  };
  const upcoming = dated
    .map(a => ({ a, days: daysTo(a.due) }))
    .filter(x => x.days != null && x.days >= 0)
    .sort((x, y) => x.days - y.days)[0];

  let coming = [], comingTitle = "Coming up";
  if (upcoming) {
    const { a, days } = upcoming;
    comingTitle = a.title;
    const byStudent = data?.assignmentLog?.[a.id] || {};
    const roster = students.length || 1;
    const submitted = Object.keys(byStudent).filter(n => (byStudent[n] || []).some(e => e.type === "submission")).length;
    const ungraded = Object.keys(byStudent).filter(n => {
      const log = byStudent[n] || [];
      const last = (t) => { for (let i = log.length - 1; i >= 0; i--) if (log[i].type === t) return log[i]; return null; };
      const sub = last("submission"), g = last("grade");
      return !!sub && (!g || sub.ts > g.ts);
    }).length;

    coming = [
      { ok: days > 3, tone: days <= 1 ? "late" : "warn",
        good: "Due " + a.due + ", " + days + " days out",
        bad: days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : "Due in " + days + " days" },
      { ok: !!(a.instructionsUrl || a.description), good: "Instructions are posted", bad: "No instructions posted yet" },
      { ok: !!a.closeAt, good: "Submissions close " + String(a.closeAt).slice(0, 10), bad: "No close date set, so late work lands silently" },
      { ok: submitted >= roster, good: "All " + roster + " have submitted", bad: submitted + " of " + roster + " have submitted" },
      { ok: ungraded === 0, good: "Nothing waiting to be graded", bad: ungraded + " submission" + (ungraded === 1 ? "" : "s") + " waiting to be graded" },
    ];
  }

  const todayLeft = today.filter(c => !c.ok).length;
  const comingLeft = coming.filter(c => !c.ok).length;

  return (
    <>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Horizon title={where} count={todayLeft} checks={today} accent={accent}
          right={features.length ? features.join(" · ") : ""} />
        <Horizon title={comingTitle} count={comingLeft} checks={coming} accent={accent} />
      </div>
    </>
  );
}

export function AssignmentsPanel({ assignments, castNow, dismiss, liveLabel, path }) {
  if (!assignments.length) return (
    <a className="dash-focus dash-empty" href={path ? path + "/assignments" : "#"}
      style={{ textDecoration: "none" }}>+ Set up the assignments for this class</a>
  );
  return (
    <>
      {assignments.map(a => (
        <Item key={a.id} kind={a.due && a.due !== "Ongoing" ? a.due : "Due"} kindColor={TEXT_MUTED} title={a.title}
          sub={a.weight ? a.weight + "% of the grade" : ""}
          live={liveLabel === a.title} onDismiss={dismiss}
          onCast={() => castNow({ type: "reveal", stamp: "Assignment", title: a.title, due: "Due " + a.due, big: true, label: a.title })} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// command bar
// ─────────────────────────────────────────────────────────────
// Mid-sentence, with the room watching, hunting for the right panel is the
// worst thing this screen asks of me. One box over everything castable: three
// letters, Enter, it is up. Cmd+K opens it.
export function CommandBar({ targets, accent, onClose }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const lc = q.trim().toLowerCase();
  const hits = (lc ? targets.filter(t => (t.title + " " + t.group).toLowerCase().includes(lc)) : targets).slice(0, 9);
  useEffect(() => { setI(0); }, [lc]);

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setI(x => Math.min(x + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setI(x => Math.max(x - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const h = hits[i]; if (h) { h.run(); onClose(); } }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return (
    <div onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(23,19,16,.35)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "12vh 20px 20px" }}>
      <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Cast something"
        style={{ width: "100%", maxWidth: 620, background: "#fff", borderRadius: 16, border: "1px solid " + BORDER_STRONG, boxShadow: "0 24px 60px -20px rgba(23,19,16,.5)", overflow: "hidden" }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
          placeholder="Cast anything. Type a few letters."
          style={{ width: "100%", border: "none", borderBottom: "1px solid " + BORDER, outline: "none", padding: "16px 18px", fontFamily: F, fontSize: 17, color: TEXT_PRIMARY }} />
        <div style={{ maxHeight: "46vh", overflowY: "auto" }}>
          {hits.map((t, n) => (
            <button key={t.key} onMouseEnter={() => setI(n)} onClick={() => { t.run(); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", cursor: "pointer",
                background: n === i ? accent + "12" : "#fff", border: "none", borderLeft: "3px solid " + (n === i ? accent : "transparent"),
                padding: "11px 16px", minHeight: TAP, fontFamily: F }}>
              <span style={{ flex: "none", fontFamily: MONO, fontSize: 12, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase",
                padding: "3px 6px", borderRadius: 5, border: "1px solid " + BORDER_STRONG, color: TEXT_MUTED }}>{t.group}</span>
              <span style={{ minWidth: 0, flex: 1, fontSize: 15, color: TEXT_PRIMARY, overflow: "hidden", wordBreak: "break-word", lineHeight: 1.4 }}>{t.title}</span>
              {n === i ? <span style={{ flex: "none", fontFamily: MONO, fontSize: 12, color: accent, letterSpacing: ".08em" }}>ENTER</span> : null}
            </button>
          ))}
          {!hits.length ? <div style={{ padding: "18px 18px 22px", fontSize: 15, color: TEXT_MUTED }}>Nothing matches your search.</div> : null}
        </div>
      </div>
    </div>
  );
}

// Shortcuts only help if I can see them. Recall is what makes people stop using
// them; this sheet turns it back into recognition.
const SHORTCUTS = [
  ["⌘ K", "Open the command bar and cast anything"],
  ["Esc", "Take down whatever is on the room screen"],
  ["⌘ B", "Black the room screen out, and again to bring it back"],
  ["← →", "Step the board that is up, one idea at a time"],
  ["K J", "Walk down and up the run of show"],
  ["Enter", "Put the row I am on up on the room screen"],
  ["⌘ E", "Teaching only. Shuts the Materials column and gives the day the room."],
  ["1-9", "Jump straight to a tab, left rail then right"],
  ["\\", "Show or hide the Materials column"],
  ["⌘ /", "Show this list"],
];

// A panel lifted out over everything, for the things I do standing up.
//
// Taking the roll is one of them: it happens once, at the start, and it wants
// the whole width while it is happening. As one of five tabs on a rail it was
// both permanently in the way and too narrow to use.
// A little menu that hangs off a button. Both header menus are the same shape,
// so they are the same component.
function DropMenu({ trigger, label, width, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", flex: "none" }}>
      {trigger(open, () => setOpen(v => !v))}
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
          <div role="menu" aria-label={label} onClick={() => setOpen(false)}
            style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 71, background: "#fff",
              border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 6, width: width || 240,
              boxShadow: "0 18px 44px -14px rgba(23,19,16,.35)", display: "flex", flexDirection: "column", gap: 1 }}>
            {children}
          </div>
        </>
      ) : null}
    </span>
  );
}

const menuRow = {
  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none",
  border: "none", cursor: "pointer", padding: "0 10px", minHeight: 40, borderRadius: 9,
  fontFamily: F, fontSize: 14.5, color: TEXT_PRIMARY, textDecoration: "none",
};

// Everything under the class name is a way out of this class, which is what
// they have in common and why they were wrong scattered along the bar as if
// they were actions.
function ClassMenu({ config }) {
  const go = (href) => () => {
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  return (
    <DropMenu label="This class" width={250}
      trigger={(open, toggle) => (
        <button className="dash-focus" onClick={toggle} aria-expanded={open} aria-haspopup="menu"
          style={{ display: "inline-flex", alignItems: "baseline", gap: 6, background: "none", border: "none",
            cursor: "pointer", padding: "4px 8px", borderRadius: 10, minHeight: 36, fontFamily: F,
            fontSize: 19, fontWeight: 700, letterSpacing: "-.02em", color: config.accent }}>
          {config.code}<span style={{ fontSize: 10, opacity: .55 }}>▾</span>
        </button>
      )}>
      <span style={{ ...label, padding: "6px 10px 4px" }}>Go to</span>
      <a className="dash-focus" href={config.path} style={menuRow}>Class home</a>
      <a className="dash-focus" href={config.path + "/schedule"} style={menuRow}>The schedule</a>
      <a className="dash-focus" href="/plan" style={menuRow}>The Brief</a>
      <div style={{ height: 1, background: BORDER, margin: "5px 8px" }} />
      <span style={{ ...label, padding: "2px 10px 4px" }}>Another class</span>
      {ENGINE_LIST.filter(c => c.id !== config.id).map(c => (
        <button key={c.id} className="dash-focus" onClick={go(c.path + "/dashboard")} style={menuRow}>
          <span style={{ flex: "none", width: 8, height: 8, borderRadius: "50%", background: c.accent }} />
          <b style={{ fontWeight: 600 }}>{c.code}</b>
          <span style={{ minWidth: 0, color: TEXT_MUTED, fontSize: 13, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.desc}</span>
        </button>
      ))}
    </DropMenu>
  );
}

// How the screen is laid out. Set rarely, so it does not need to be on the bar
// at the same weight as the buttons I press in front of people.
function ViewMenu({ railOpen, onRail, dense, onDense, onReset, onKeys }) {
  return (
    <DropMenu label="View" width={230}
      trigger={(open, toggle) => (
        <button className="dash-focus" onClick={toggle} aria-expanded={open} aria-haspopup="menu"
          style={{ ...mini, minHeight: 36 }}>View<span style={{ fontSize: 9, opacity: .55, marginLeft: 5 }}>▾</span></button>
      )}>
      <button className="dash-focus" onClick={onRail} style={menuRow}>
        {railOpen ? "Hide the Materials column" : "Show the Materials column"}
        <kbd style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, color: TEXT_MUTED }}>\\</kbd>
      </button>
      <button className="dash-focus" onClick={onDense} style={menuRow}>{dense ? "Comfortable rows" : "Compact rows"}</button>
      <button className="dash-focus" onClick={onReset} style={menuRow}>Reset the columns</button>
      <div style={{ height: 1, background: BORDER, margin: "5px 8px" }} />
      <button className="dash-focus" onClick={onKeys} style={menuRow}>
        Keyboard<kbd style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, color: TEXT_MUTED }}>⌘/</kbd>
      </button>
    </DropMenu>
  );
}

export function Sheet({ title, sub, onClose, children, width }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return (
    <div onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(23,19,16,.38)",
        display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "7vh 20px 20px" }}>
      <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label={title}
        style={{ width: "100%", maxWidth: width || 760, maxHeight: "82vh", background: "#fff", borderRadius: 18,
          boxShadow: "0 26px 64px -20px rgba(23,19,16,.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "16px 20px 12px", borderBottom: "1px solid " + BORDER }}>
          <h2 style={{ margin: 0, fontFamily: F, fontSize: 19, fontWeight: 600, letterSpacing: "-.02em", color: TEXT_PRIMARY }}>{title}</h2>
          {sub ? <span style={{ fontSize: 13.5, color: TEXT_MUTED }}>{sub}</span> : null}
          <button className="dash-focus" style={{ ...mini, marginLeft: "auto" }} onClick={onClose}>Done · Esc</button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 11 }}>{children}</div>
      </div>
    </div>
  );
}

function ShortcutSheet({ onClose }) {
  return (
    <div onMouseDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(23,19,16,.35)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onMouseDown={e => e.stopPropagation()} role="dialog" aria-label="Keyboard shortcuts"
        style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 16, border: "1px solid " + BORDER_STRONG, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={label}>Keyboard</span>
        {SHORTCUTS.map(([k, what]) => (
          <div key={k} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <kbd style={{ flex: "none", minWidth: 46, textAlign: "center", fontFamily: MONO, fontSize: 12, padding: "4px 7px", borderRadius: 6, border: "1px solid " + BORDER_STRONG, background: SURFACE_2, color: TEXT_PRIMARY }}>{k}</kbd>
            <span style={{ fontSize: 15, lineHeight: 1.4 }}>{what}</span>
          </div>
        ))}
        <button style={{ ...mini, alignSelf: "flex-start", marginTop: 4 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// live monitor: a real preview of what the room sees
// ─────────────────────────────────────────────────────────────
export function Monitor({ config, live, cast, push, recent, onRecast, info }) {
  const [anims, setAnims] = useState(false);
  const liveUrl = live?.cast?.openUrl || live?.cast?.url || "";
  const box = useRef(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1280));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const [since, setSince] = useState("");
  useEffect(() => {
    const t = setInterval(() => {
      if (!live?.cast || !live.at) { setSince(""); return; }
      const m = Math.floor((Date.now() - live.at) / 60000);
      setSince(m < 1 ? "just now" : m + " min");
    }, 5000);
    return () => clearInterval(t);
  }, [live]);

  const on = !!live?.cast;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", background: SURFACE_2, borderRadius: 10, ...label, fontSize: 13 }}>
        {on ? <LiveTag /> : <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: BORDER_STRONG }} />}
        <span style={{ color: TEXT_PRIMARY, overflow: "hidden", wordBreak: "break-word", lineHeight: 1.4 }}>
          {on ? (live.cast.label || live.cast.title) : "Idle screen"}
        </span>
        <span style={{ marginLeft: "auto", color: TEXT_MUTED, flex: "none" }}>{since}</span>
      </div>

      {liveUrl ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10,
          background: SURFACE_2, flexWrap: "wrap" }}>
          <a href={liveUrl} target="_blank" rel="noreferrer"
            style={{ ...mini, borderColor: config.accent, color: config.accent, textDecoration: "none",
              display: "inline-flex", alignItems: "center", flex: "none" }}>Open ↗</a>
          <span style={{ minWidth: 0, flex: 1, fontFamily: MONO, fontSize: 12, color: TEXT_MUTED,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={liveUrl}>{hostOf(liveUrl)}</span>
          <div style={{ display: "flex", gap: 4, flex: "none" }}>
            {[["read", "Read"], ["embed", "Page"], ["card", "Card"]].map(([m, lbl]) => (
              <button key={m} style={{ ...mini, minHeight: HIT, padding: "0 10px", fontSize: 12,
                ...(live.cast.mode === m ? { background: config.accent, borderColor: config.accent, color: "#fff" } : {}) }}
                onClick={() => cast({ ...live.cast, mode: m, url: m === "embed" ? framable(liveUrl) : liveUrl })}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div ref={box} style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", border: "1px solid " + BORDER_STRONG, background: "#0f0d0c" }}>
        <iframe src={config.path + "/today"} title="Classroom view"
          style={{ width: 1280, height: 720, border: "none", transform: "scale(" + scale + ")", transformOrigin: "top left", position: "absolute", top: 0, left: 0 }} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...mini, flex: 1, ...(on ? {} : { borderColor: config.accent, color: config.accent }) }}
          onClick={() => cast(null)}>Idle screen</button>
        <button style={{ ...mini, flex: 1, ...(live?.cast?.type === "black" ? { background: "#111", borderColor: "#111", color: "#fff" } : {}) }}
          onClick={() => cast({ type: "black", label: "Black screen" })}>Black screen</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...mini, flex: 1, ...(on ? { borderColor: LIVE, color: LIVE } : { opacity: .45 }) }}
          disabled={!on} onClick={() => cast(null)}>Take it down</button>
        <a href={config.path + "/today"} target="_blank" rel="noreferrer" style={{ ...mini, flex: 1, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          Open room screen ↗
        </a>
      </div>

      {recent.length ? (
        <div style={{ background: SURFACE_2, borderRadius: 12, padding: 13, display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={label}>Put it back</span>
          {recent.map(r => (
            <button key={r.key} onClick={() => onRecast(r.payload)}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", cursor: "pointer",
                background: SURFACE_2, border: "1px solid transparent", borderRadius: 9, padding: "8px 10px", minHeight: 38, fontFamily: F, fontSize: 13, color: TEXT_PRIMARY }}>
              <span style={{ minWidth: 0, flex: 1, overflow: "hidden", wordBreak: "break-word", lineHeight: 1.4 }}>{r.label}</span>
              <span style={{ flex: "none", fontFamily: MONO, fontSize: 12, letterSpacing: ".08em", color: TEXT_MUTED }}>AGAIN →</span>
            </button>
          ))}
        </div>
      ) : null}

      {info}

      {/* How things arrive on the screen is a decision I make once a term, so it
          stops taking the best space on the panel and sits behind a control. */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="dash-focus" style={{ ...mini, minHeight: 28, padding: "0 10px", fontSize: 12 }}
          onClick={() => setAnims(v => !v)} aria-expanded={anims}>Transitions</button>
      </div>
      {anims ? (
        <div style={{ background: SURFACE_2, borderRadius: 12, padding: 13, display: "flex", flexDirection: "column", gap: 12 }}>
          <Picker title="Everyday cast" opts={ANIMS} value={live?.anim || "rise"} onPick={v => push({ anim: v })} accent={config.accent} />
          <Picker title="Big reveal" opts={BIG_ANIMS} value={live?.bigAnim || "drop"} onPick={v => push({ bigAnim: v })} accent={config.accent} />
          <Muted style={{ fontSize: 13 }}>
            {[...ANIMS, ...BIG_ANIMS].find(a => a.id === (live?.anim || "rise"))?.hint}
          </Muted>
        </div>
      ) : null}
    </div>
  );
}

// Everything the app knows about the thing I just clicked. It sits where the
// transition pickers were, because what a block is turns out to matter far more
// often than how it slides in.
function BlockInfo({ block, item, where, accent, onClose, onOpen }) {
  if (!block && !item) return null;
  const t = block ? typeOf(block.type) : null;
  const rows = [
    ["Headline", block ? block.headline : item?.claim],
    ["What it says", block?.body],
    ["Concept", block?.concept],
    ["Source", block?.source],
    ["Tags", (block?.tags || []).join(" · ")],
    ["Made", block?.created],
    ["Used on", (block?.scheduled || []).join(" · ")],
    ["In", where],
    ["Holds", block?.children?.length ? block.children.length + " inside" : ""],
  ].filter(([, v]) => (v || "").toString().trim());

  return (
    <div style={{ background: "#fff", border: "1px solid " + accent, borderRadius: 14, padding: 14,
      display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ ...label, color: accent }}>{t ? t.label : "Note"}</span>
        <button className="dash-focus" onClick={onClose}
          style={{ ...label, fontSize: 12, marginLeft: "auto", color: TEXT_MUTED, background: "none", border: "none", cursor: "pointer" }}>Close</button>
      </div>

      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-.01em", wordBreak: "break-word" }}>
        {block ? block.title : (item?.text || "Untitled")}
      </div>

      {block?.url ? (
        <a className="dash-focus" href={block.url} target="_blank" rel="noreferrer"
          style={{ ...mini, minHeight: HIT, borderColor: accent, color: accent, textDecoration: "none",
            display: "inline-flex", alignItems: "center", alignSelf: "flex-start" }}>Open here ↗</a>
      ) : null}

      {rows.map(([k, v]) => (
        <div key={k}>
          <div style={{ ...label, fontSize: 12 }}>{k}</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.5, color: TEXT_PRIMARY, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{v}</div>
        </div>
      ))}

      {!rows.length && !block?.url ? <Muted style={{ fontSize: 13 }}>Nothing on this one yet beyond its name.</Muted> : null}
    </div>
  );
}

// The band across the top. One row, three jobs, and nothing on it is said
// again somewhere else on the screen.
//
// The old one carried the topic, four ambient counts, a progress bar, two
// clocks, an up-next button and a live readout, and Andrew's verdict was that
// it was not that helpful — which is what a strip says when everything on it
// is also somewhere better. The counts live on the rail tabs now, next to the
// thing you would actually do about them. What is left is what nothing else
// can tell me: which session I am on, what it is about, how far in I am, and
// what goes up next.
// The topic, editable where it sits. Click it, type, Enter. No punctuation is
// added and none is required.
function EditableTopic({ value, placeholder, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  useEffect(() => { setDraft(value || ""); }, [value]);
  if (editing) {
    const commit = () => { onSave(draft.trim()); setEditing(false); };
    return (
      <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value || ""); setEditing(false); } }}
        placeholder={placeholder} aria-label="What this week is about"
        className="dash-topic"
        style={{ fontFamily: F, fontWeight: 600, letterSpacing: "-.03em", color: TEXT_PRIMARY,
          border: "none", borderBottom: "2px solid " + BORDER_STRONG, background: "none",
          outline: "none", padding: "0 0 2px", width: "100%" }} />
    );
  }
  return (
    <h1 className="dash-topic">
      <button className="dash-focus" onClick={() => setEditing(true)} title="Rename what this week is about"
        style={{ background: "none", border: "none", padding: "0 4px 0 0", margin: 0, cursor: "text",
          font: "inherit", letterSpacing: "inherit", color: value ? TEXT_PRIMARY : TEXT_MUTED,
          textAlign: "left", width: "100%", borderRadius: 6 }}>
        {value || placeholder}
      </button>
    </h1>
  );
}

function DayBand({ days, day, onPick, onOpenDay, counts, accent, today, topic, name, onTopic, done, total, since, cold, left, upNext, onCastNext, onReset }) {
  const [jump, setJump] = useState(false);
  const i = days.findIndex(d => d.date === day);
  const weekId = days[i]?.weekId;
  const week = days.filter(d => d.weekId === weekId);
  const weekIds = [...new Set(days.map(d => d.weekId))];
  const wn = weekIds.indexOf(weekId);
  const stepWeek = (dir) => {
    const t = weekIds[wn + dir];
    if (t) onPick(days.find(d => d.weekId === t).date);
  };
  const pct = total ? Math.round((done / total) * 100) : 0;
  const countOf = (id) => days.filter(d => d.weekId === id).reduce((n, d) => n + (counts[d.date] || 0), 0);
  const todayWeek = days.find(d => d.date === today)?.weekId;

  return (
    <div className="dash-band">
      <div className="dash-band-row">
        {/* the week, and the way out of this week. Stepping one at a time is
            fine for next Tuesday and useless for week nine, which is most of
            what planning is. */}
        <div style={{ position: "relative", flex: "none" }}>
          <button className="dash-focus dash-week" onClick={() => setJump(v => !v)} aria-expanded={jump}
            aria-haspopup="menu" title="Jump to any week of the term">
            Week {wn + 1}<span style={{ opacity: .5, fontSize: 10, marginLeft: 5 }}>▾</span>
          </button>
          {jump ? (
            <>
              <div onClick={() => setJump(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <div role="menu" className="dash-jump">
                {weekIds.map((id, n) => {
                  const wd = days.filter(d => d.weekId === id);
                  const on = id === weekId;
                  const has = countOf(id);
                  const past = todayWeek ? n < weekIds.indexOf(todayWeek) : false;
                  return (
                    <button key={id} className="dash-focus dash-jump-row" data-on={on ? "1" : "0"}
                      onClick={() => { onPick(wd[0].date); setJump(false); }}>
                      <span className="dash-jump-n" style={on ? { background: accent, color: "#fff", borderColor: accent } : undefined}>{n + 1}</span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <b style={{ display: "block", fontWeight: 500, fontSize: 14.5, color: past ? TEXT_MUTED : TEXT_PRIMARY,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wd[0]?.topic || "Untitled week"}</b>
                        <small style={{ color: TEXT_MUTED, fontSize: 12 }}>{wd.map(d => d.date).join(" · ")}</small>
                      </span>
                      {has ? <span className="dash-jump-has">{has}</span> : null}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        <button className="dash-focus dash-step" disabled={wn <= 0} onClick={() => stepWeek(-1)} title="The week before">‹</button>
        <div className="dash-days">
          {week.map(d => {
            const on = d.date === day;
            const n = counts[d.date] || 0;
            return (
              <button key={d.date} className="dash-focus dash-day" data-on={on ? "1" : "0"}
                title={on ? "What is left to do for " + d.date : "Go to " + d.date}
                onClick={() => (on ? onOpenDay(d.date) : onPick(d.date))}
                style={on ? { borderColor: accent, background: accent + "0f" } : undefined}>
                <span style={{ fontSize: 13, fontWeight: 600, color: on ? accent : TEXT_PRIMARY }}>
                  {d.date}{d.date === today ? " · today" : ""}
                </span>
                <span style={{ fontSize: 11.5, color: TEXT_MUTED }}>{n ? n + (n === 1 ? " thing" : " things") : "empty"}</span>
              </button>
            );
          })}
        </div>
        <button className="dash-focus dash-step" disabled={wn >= weekIds.length - 1} onClick={() => stepWeek(1)} title="Next week">›</button>

        <div className="dash-prog">
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 12.5, color: TEXT_MUTED, whiteSpace: "nowrap" }}>
            <span>{total ? done + " of " + total : "nothing planned"}</span>
            {left != null ? <span>{left} min left</span> : null}
            {since != null ? <span style={{ color: cold ? WARN : TEXT_MUTED }}>{since} min quiet</span> : null}
            {total && done ? (
              <button className="dash-focus" onClick={onReset}
                style={{ background: "none", border: "none", color: TEXT_MUTED, cursor: "pointer",
                  fontFamily: F, fontSize: 12.5, textDecoration: "underline", padding: 0 }}>reset</button>
            ) : null}
          </div>
          <div style={{ height: 5, borderRadius: 3, background: SURFACE_2, overflow: "hidden", marginTop: 4 }}>
            <i style={{ display: "block", height: "100%", width: pct + "%", background: accent, transition: "width .3s" }} />
          </div>
        </div>
      </div>

      <div className="dash-band-row" style={{ alignItems: "flex-end" }}>
        <EditableTopic value={topic} placeholder={name} onSave={onTopic} />
        {upNext ? (
          <button className="dash-focus dash-next" onClick={onCastNext} style={{ background: accent }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 11.5, opacity: .85, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>Up next</span>
              <span style={{ display: "block", fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upNext}</span>
            </span>
            <span style={{ flex: "none", fontSize: 19, lineHeight: 1 }}>→</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}


function Picker({ title, opts, value, onPick, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={label}>{title}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {opts.map(o => {
          const on = o.id === value;
          return (
            <button key={o.id} onClick={() => onPick(o.id)} aria-pressed={on}
              style={{ ...mini, fontFamily: MONO, fontSize: 12, letterSpacing: ".05em", textTransform: "uppercase",
                background: on ? accent : "#fff", borderColor: on ? accent : BORDER_STRONG, color: on ? "#fff" : TEXT_SECONDARY }}>
              {o.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────
// Class Flow first and full width, because building the day and casting it is
// what this screen is for. Everything else supports that. Attendance and the
// engagement clock are useful and they were competing for the top of the page
// with the thing I actually came here to do.
// Two rails and a middle, and the split is the job rather than the software.
//
// Everything I do on this screen is one of two things. Before class I am
// pulling material together: ideas, readings, what is assigned, what is left
// to do. During class I am running the room: what is on the screen, who is
// asking, who is here, what I am writing down. Those are different jobs, they
// happen at different times, and the old grid mixed them into one wall of ten
// draggable boxes that I then had to arrange myself.
//
// So: PREP on the left, LIVE on the right, THE DAY down the middle and never
// anywhere else. One tab open per rail, because a rail showing four things at
// once is the grid again. Teaching mode shuts the prep rail, since mid-class I
// am not gathering material, and the day takes the room it leaves.
// Material, Flow, Live.
//
// Attendance is not on the Live rail any more. Taking the roll is a thing I do
// once, standing up, at the start — not a tab I want to be one of five. It is a
// button at the top that opens over everything, the way Around the Horn does.
// To-do is not on a rail either. It is a list I check once, when I sit down to
// look at a day — so it opens off the day itself, by clicking the session up in
// the band, which is the thing it is a to-do list ABOUT.
const MATERIAL = ["ideas", "readings", "scratch", "assignments"];
const LIVE_RAIL = ["questions", "poll", "boards"];
// Starting widths. Flow takes whatever is left, so it is the one column that
// never needs a number. Both ends are draggable and the drag is remembered.
const COL = { material: 300, live: 400 };
const COL_MIN = { material: 230, live: 320 };
const COL_MAX = { material: 760, live: 620 };
// Flow is always the middle and always takes the remainder, so it is the only
// column with no number of its own. The seams are 16px each and count as
// columns of the grid.
const gridFor = (cols, railOpen, teaching) => {
  const mat = railOpen && !teaching ? cols.material + "px 16px " : "";
  return mat + "minmax(0,1fr) 16px " + cols.live + "px";
};

export default function Dashboard({ config }) {
  const [data, update] = useClassData(config.storageKey);
  // Blocks that belong to me rather than to any one class. Same store shape,
  // its own key, and every class sees it.
  const [shared, updateShared] = useClassData(SHARED_KEY);
  const [live, cast, push] = useLive(config.storageKey);
  const q = useQuestions(config.storageKey);
  const P = usePoll(config.storageKey);
  const [hornOpen, setHornOpen] = useState(false);
  const [hereOpen, setHereOpen] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [hlOpen, setHlOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);
  // What has been up today. Taking something down and wanting it back is the
  // most common thing I do on this screen, and until now it meant finding the
  // row again.
  const [recent, setRecent] = useState([]);
  // What I last clicked on in the flow, so the sidebar can say what it is.
  const [picked, setPicked] = useState(null);
  const pickedSync = picked;
  const HL = useHeadlines(config.storageKey, { categories: data?.headlineCategories, concepts: config.concepts });

  const weeks = data?.schedule || config.scheduleWeeks || [];
  const days = allDays(weeks);
  // The session I picked, or the one on deck if I have not picked. Derived
  // rather than set in an effect: the effect version rendered once with no day
  // at all, which is a frame of "No sessions on the calendar yet" on a class
  // that has eleven weeks of them.
  const [picked_, setPicked_] = useState(null);
  const day = (picked_ && days.some(d => d.date === picked_)) ? picked_
    : (currentDay(weeks)?.date || days[0]?.date || null);
  const setDay = setPicked_;

  const plan = (data?.dayPlans || {})[day] || null;
  // sequenceOptions adds Freeform, which config.sequences does not carry, so
  // the picker never offered it. sequenceFor also stops a day already set to
  // freeform falling through find() to seqs[0] and being drawn as the Motivated
  // Sequence, which is what it was doing.
  const seqs = sequenceOptions(config);
  const seq = sequenceFor(config, plan?.sequenceId || config.defaultSequenceId);
  const seeds = data?.seeds || config.seeds || [];
  const students = data?.students || config.students || [];
  const assignments = data?.assignments || config.assignments || [];
  const week = days.find(d => d.date === day);
  const weekId = week?.weekId || "w?";
  const weekTopic = week?.topic || "";
  const stock = data?.stocked || {};
  const shelves = {
    day: (stock.day || {})[day] || [],
    week: (stock.week || {})[weekId] || [],
    any: stock.any || [],
  };
  const marks = (data?.attendance || {})[day] || {};
  const dayMeta = days.find(d => d.date === day);

  // Features scheduled for this class day, in the order the week lists them.
  const weekRow = weeks.find(w => w.id === weekId);
  // Derived from the date rather than its position in the week, which was only
  // ever right for a class meeting Monday, Wednesday and Friday in that order.
  const dayName = weekdayOf(day);
  const features = [];
  ((weekRow?.items) || []).forEach(it => {
    if (it.type !== "activity") return;
    if (it.date && dayName && it.date !== dayName) return;
    if (!features.includes(it.title)) features.push(it.title);
  });

  // Readings and media is where a reading lives, so it must not also appear
  // under "on the schedule, not in the flow". A thing gets one home on a day.
  const looseItems = unplanned(data, config, day).filter(it => !MEDIA_SET.has(it.type));

  useEffect(() => { document.title = config.code + " — Dashboard"; }, [config.code]);

  // Keyboard, because during class my hands are the slow part. Nothing fires
  // while I am typing into a field, so the claim editors keep working.
  const liveRef = useRef(null);
  liveRef.current = live;
  const stepRef = useRef(null);
  const flowOrderRef = useRef([]);
  const pickedRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;
      const cur = liveRef.current?.cast;

      if (mod && (e.key === "k" || e.key === "K")) { e.preventDefault(); setKeysOpen(false); setCmdOpen(v => !v); return; }
      if (mod && (e.key === "e" || e.key === "E")) { e.preventDefault(); setFocus(v => !v); return; }
      // The rails, by number. 1-4 is the prep side, 5-9 the live side, in the
      // order the tabs are drawn, so the number IS the tab I can see.
      if (!typing && !mod && /^[1-9]$/.test(e.key)) {
        const n = Number(e.key) - 1;
        if (n < MATERIAL.length) { e.preventDefault(); pickPrep(MATERIAL[n]); return; }
        const m = n - MATERIAL.length;
        if (m < LIVE_RAIL.length) { e.preventDefault(); pickRoom(LIVE_RAIL[m]); return; }
      }
      if (!typing && !mod && e.key === "\\") { e.preventDefault(); toggleRail(); return; }
      if (mod && e.key === "/") { e.preventDefault(); setCmdOpen(false); setKeysOpen(v => !v); return; }
      if (mod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        cast(cur?.type === "black" ? null : { type: "black", label: "Black screen" });
        return;
      }
      if (typing) return;

      // Walking the run of show. The order is the numbering, so j and k go the
      // way the eye does and Enter puts the thing I am on up on the wall.
      const flat = flowOrderRef.current || [];
      if (flat.length && (e.key === "j" || e.key === "k" || e.key === "ArrowDown" || e.key === "ArrowUp")) {
        const down = e.key === "k" || e.key === "ArrowDown";
        e.preventDefault();
        const at = flat.findIndex(x => x.id === pickedRef.current?.id);
        const next = flat[Math.max(0, Math.min(flat.length - 1, at < 0 ? 0 : at + (down ? 1 : -1)))];
        if (next) setPicked(next);
        return;
      }
      if (e.key === "Enter" && pickedRef.current?.cast) { e.preventDefault(); pickedRef.current.cast(); return; }

      if (e.key === "Escape" && cur) { e.preventDefault(); cast(null); return; }
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && cur?.type === "board" && stepRef.current) {
        e.preventDefault();
        stepRef.current(e.key === "ArrowRight" ? 1 : -1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cast]);

  // ─── the rails (my screen preference, so it lives in this browser) ───
  // Which tab is open in each rail, and whether the prep rail is showing at
  // all. That is the whole of it now. No order, no spans, no hiding, no
  // dragging — every one of those existed because the grid could not say
  // where a thing belonged, and the rails can.
  const LKEY = "dash:rails";
  const [prep, setPrep] = useState("ideas");
  const [room, setRoom] = useState("questions");
  const [railOpen, setRailOpen] = useState(true);
  const [cols, setCols] = useState(COL);
  const [dense, setDense] = useState(false);
  const [focus, setFocus] = useState(false);
  const focusRef = useRef(false);
  focusRef.current = focus;

  // The header is pinned, and the rails stick under it. Its height is not a
  // constant — it wraps on a narrow window — so a guessed offset put the rail
  // tabs behind it exactly when the window was small enough for that to hurt.
  const headRef = useRef(null);
  useEffect(() => {
    const el = headRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const set = () => document.documentElement.style.setProperty("--head-h", el.offsetHeight + "px");
    const ro = new ResizeObserver(set);
    ro.observe(el);
    set();
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(LKEY) || "null");
      if (!v) return;
      if (MATERIAL.includes(v.prep)) setPrep(v.prep);
      if (LIVE_RAIL.includes(v.room)) setRoom(v.room);
      if (typeof v.railOpen === "boolean") setRailOpen(v.railOpen);
      if (v.cols && typeof v.cols.material === "number" && typeof v.cols.live === "number") setCols(v.cols);
      if (typeof v.dense === "boolean") setDense(v.dense);
    } catch { /* first run */ }
  }, [LKEY]);
  // The keyboard handler is bound once and closes over whatever the rails were
  // on the first render, so the pickers read the current values off a ref
  // instead of off that closure. Without it, pressing 1 saved the right rail
  // back to whatever tab it had when the page loaded.
  const railRef = useRef({ prep: "ideas", room: "questions", railOpen: true, dense: false, cols: COL });
  railRef.current = { prep, room, railOpen, dense, cols };
  const saveRails = useCallback((patch) => {
    const v = { ...railRef.current, ...patch };
    railRef.current = v;
    if (v.prep !== prep) setPrep(v.prep);
    if (v.room !== room) setRoom(v.room);
    if (v.railOpen !== railOpen) setRailOpen(v.railOpen);
    if (v.dense !== dense) setDense(v.dense);
    if (v.cols !== cols) setCols(v.cols);
    try { localStorage.setItem(LKEY, JSON.stringify(v)); } catch { /* private mode */ }
  }, [LKEY, prep, room, railOpen, dense, cols]);
  const railSave = useRef(saveRails);
  railSave.current = saveRails;
  // Dragging a seam. The width is written straight onto the grid while the
  // pointer moves — going through React state for every pointermove made the
  // whole stage re-render sixty times a second — and only committed to storage
  // on release.
  const stageRef = useRef(null);
  const dragCol = useRef(null);
  const startSeam = (which) => (e) => {
    e.preventDefault();
    dragCol.current = { which, x: e.clientX, from: railRef.current.cols[which] };
    document.body.dataset.resizing = "1";
    e.currentTarget.dataset.drag = "1";
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  useEffect(() => {
    const move = (e) => {
      const d = dragCol.current;
      if (!d) return;
      // Material grows to the right, Live grows to the left.
      const delta = d.which === "material" ? e.clientX - d.x : d.x - e.clientX;
      const w = Math.max(COL_MIN[d.which], Math.min(COL_MAX[d.which], d.from + delta));
      d.next = w;
      const el = stageRef.current;
      if (el) el.style.gridTemplateColumns = gridFor({ ...railRef.current.cols, [d.which]: w },
        railRef.current.railOpen, focusRef.current);
    };
    const up = () => {
      const d = dragCol.current;
      document.body.dataset.resizing = "0";
      document.querySelectorAll('[data-drag="1"]').forEach(n => { n.dataset.drag = "0"; });
      dragCol.current = null;
      if (d && d.next != null) railSave.current({ cols: { ...railRef.current.cols, [d.which]: d.next } });
    };
    const nudge = (e) => {
      const { which, dir } = e.detail;
      const from = railRef.current.cols[which];
      const w = Math.max(COL_MIN[which], Math.min(COL_MAX[which], from + dir * 24));
      railSave.current({ cols: { ...railRef.current.cols, [which]: w } });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("dash:nudge", nudge);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("dash:nudge", nudge);
    };
  }, []);

  const pickPrep = (id) => railSave.current({ prep: id, railOpen: true });
  const pickRoom = (id) => railSave.current({ room: id });
  const toggleRail = () => railSave.current({ railOpen: !railRef.current.railOpen });
  const setDenseAnd = (d) => railSave.current({ dense: d });

  // ─── writes ───
  const [undo, setUndo] = useState(null);
  const writeDayOn = (date, fn, what) => update(prev => {
    const plans = { ...(prev.dayPlans || {}) };
    const before = plans[date];
    plans[date] = fn(plans[date] || {});
    if (plans[date] !== before) setUndo({ date, plan: before, what: what || "that" });
    return { ...prev, dayPlans: plans };
  });
  const doUndo = () => {
    if (!undo) return;
    const { date, plan } = undo;
    setUndo(null);
    update(prev => {
      const plans = { ...(prev.dayPlans || {}) };
      if (plan === undefined) delete plans[date]; else plans[date] = plan;
      return { ...prev, dayPlans: plans };
    });
  };
  const writeDay = (fn, what) => writeDayOn(day, fn, what);
  const mark = (name, state) => update(prev => {
    const att = { ...(prev.attendance || {}) };
    att[day] = { ...(att[day] || {}), [name]: state };
    return { ...prev, attendance: att };
  });
  const resetAttendance = () => update(prev => {
    const att = { ...(prev.attendance || {}) };
    att[day] = {};
    return { ...prev, attendance: att };
  });
  // Each shelf lives at its own scope: today, this week, or the whole term.
  const setShelf = (shelf, fn) => update(prev => {
    const st = { ...(prev.stocked || {}) };
    if (shelf === "any") { st.any = fn(st.any || []); }
    else {
      const key = shelf === "day" ? day : weekId;
      st[shelf] = { ...(st[shelf] || {}) };
      st[shelf][key] = fn(st[shelf][key] || []);
    }
    return { ...prev, stocked: st };
  });
  // A headline written once stays on the item, so the second time it is one click.
  const saveFlowClaim = (slot, itemId, claim, linkId) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    // Through normSlot, because a slot still in the older single-item shape has
    // no items array, and `(bucket.items || []).map` would have quietly written
    // an empty one back over it.
    const bucket = normSlot(slots[slot]);
    bucket.items = bucket.items.map(it => {
      if (it.id !== itemId) return it;
      if (!linkId) return { ...it, claim };
      return { ...it, links: (it.links || []).map(l => l.id === linkId ? { ...l, claim } : l) };
    });
    slots[slot] = bucket;
    return { ...d, slots };
  });
  const addFlowItem = (slot, item) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    const bucket = normSlot(slots[slot]);
    slots[slot] = { ...bucket, items: [...bucket.items, { id: genId(), ...item }] };
    return { ...d, slots };
  });
  const removeFlowItem = (slot, itemId) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    const bucket = normSlot(slots[slot]);
    slots[slot] = { ...bucket, items: bucket.items.filter(it => it.id !== itemId) };
    return { ...d, slots };
  }, "taking that out");
  const moveFlowItem = (slot, itemId, dir) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    const bucket = normSlot(slots[slot]);
    const items = [...bucket.items];
    const i = items.findIndex(it => it.id === itemId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= items.length) return d;
    [items[i], items[j]] = [items[j], items[i]];
    slots[slot] = { ...bucket, items };
    return { ...d, slots };
  });
  // Move a row to another section, and to another day if I want. It leaves
  // where it was and arrives intact — same id, same headline, same pointer at
  // whatever block it came from.
  // Dropped on a row it lands before that row; dropped on a section it lands at
  // the end. Reordering inside a section and moving between them are the same
  // write, which is why one gesture can do both.
  const dragMove = (fromSlot, itemId, toSlot, beforeId) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    const from = normSlot(slots[fromSlot]);
    const carried = from.items.find(x => x.id === itemId);
    if (!carried) return d;
    const fromItems = from.items.filter(x => x.id !== itemId);
    slots[fromSlot] = { ...from, items: fromItems };
    const to = normSlot(slots[toSlot]);
    const toItems = toSlot === fromSlot ? fromItems : [...to.items];
    const at = beforeId ? toItems.findIndex(x => x.id === beforeId) : -1;
    if (at < 0) toItems.push(carried); else toItems.splice(at, 0, carried);
    slots[toSlot] = { ...to, items: toItems };
    return { ...d, slots };
  });

  const moveItemTo = (fromSlot, itemId, toSlot, date) => {
    const on = date || day;
    let carried = null;
    writeDay(d => {
      const slots = { ...(d.slots || {}) };
      const from = normSlot(slots[fromSlot]);
      carried = from.items.find(x => x.id === itemId) || null;
      if (!carried) return d;
      slots[fromSlot] = { ...from, items: from.items.filter(x => x.id !== itemId) };
      if (on === day) {
        const to = normSlot(slots[toSlot]);
        slots[toSlot] = { ...to, items: [...to.items, carried] };
      }
      return { ...d, slots };
    });
    if (carried && on !== day) {
      writeDayOn(on, d => {
        const slots = { ...(d.slots || {}) };
        const to = normSlot(slots[toSlot]);
        return { ...d, slots: { ...slots, [toSlot]: { ...to, items: [...to.items, carried] } } };
      });
    }
  };

  const deleteSection = (slot) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    delete slots[slot];
    return { ...d, slots };
  }, "deleting that section");

  // The one higher up the day keeps its name; the other empties into it and
  // goes. Items move across as they are, so nothing is rewritten on the way.
  const mergeSections = (top, bottom) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    const a = normSlot(slots[top]);
    const b = normSlot(slots[bottom]);
    slots[top] = { ...a, items: [...a.items, ...b.items] };
    delete slots[bottom];
    return { ...d, slots };
  }, "that merge");

  // Done lives on the day, so it survives a reload and clears itself when I
  // move to the next class.
  const tickItem = (id) => writeDay(d => {
    const done = new Set(d.done || []);
    if (done.has(id)) done.delete(id); else done.add(id);
    return { ...d, done: [...done] };
  }, "that tick");

  const setSequence = (id) => writeDay(d => ({ ...d, sequenceId: id }));
  // Everything a class can reach: its own blocks and the ones that are mine.
  const blocks2 = allBlocks(data, shared);
  const blockOf = (id) => blockById(data, shared, id);
  // A block belongs to one store, and a shared block edited from inside a class
  // has to change in the shared store or the next class would not see it.
  const writeTo = (id) => ((data?.blocks || {})[id] ? update : updateShared);

  // The day's readings ARE the schedule's readings. One list, written from
  // whichever screen I happen to be on.
  const readings = scheduledFor(weeks, day).filter(it => MEDIA_SET.has(it.type));
  // Which of today's readings also have a row in the flow. Matched on the
  // schedule item id where the row came from the schedule, and on the block
  // otherwise, because a reading picked out of the library carries libId.
  const flowSched = new Set();
  Object.values(plan?.slots || {}).forEach(b => normSlot(b).items.forEach(it => {
    if (it.schedItemId) flowSched.add(it.schedItemId);
    if (it.blockId) flowSched.add("b:" + it.blockId);
  }));
  const readingInFlow = new Set(readings
    .filter(r => flowSched.has(r.id) || (r.libId && flowSched.has("b:" + r.libId)))
    .map(r => r.id));
  const comingRows = comingUp(assignments, day, 21);
  const addReading = (item) => addScheduleItem(update, config, day, item);
  const dropReading = (id) => removeScheduleItem(update, config, id);
  const pickReading = (b) => {
    addScheduleItem(update, config, day, { type: "reading", title: b.title, url: b.url, blockId: b.id });
    stampScheduled(writeTo(b.id), b.id, day);
  };

  // Assigned, or not, for a row that is already in the flow.
  //
  // These were one choice before: a thing was either on today's readings or in
  // the run of show, never both, so a reading I meant to talk about quietly
  // stopped being a reading students were told to do. They are two facts about
  // one thing, and this is the second one.
  const assignedIdFor = (it) => {
    const blk = it.blockId ? blockOf(it.blockId) : null;
    const hit = readings.find(r => r.id === it.schedItemId || (it.blockId && r.libId === it.blockId)
      || (blk?.url && r.url === blk.url));
    return hit ? hit.id : null;
  };
  const toggleAssigned = (it) => {
    const id = assignedIdFor(it);
    if (id) { removeScheduleItem(update, config, id); return; }
    const blk = it.blockId ? blockOf(it.blockId) : null;
    const title = (blk?.title || it.text || it.claim || "Untitled").trim();
    addScheduleItem(update, config, day, { type: "reading", title, url: blk?.url || "", blockId: it.blockId || "" });
    if (it.blockId) stampScheduled(writeTo(it.blockId), it.blockId, day);
  };

  // A new idea is a block kept with me, so it turns up in every class.
  const addIdea = (title, body) => updateShared(prev => {
    const id = genId();
    return {
      ...prev,
      blocks: { ...(prev.blocks || {}), [id]: {
        id, type: "activity", title, body, url: "", headline: "",
        children: [], tags: ["teaching move"], concept: "", source: "", refId: "",
        created: new Date().toISOString().slice(0, 10), scheduled: [],
      } },
    };
  });

  const editIdea = (id, title, body) => updateShared(prev => ({
    ...prev, blocks: { ...(prev.blocks || {}), [id]: { ...(prev.blocks || {})[id], title, body } },
  }));
  const removeIdea = (id) => updateShared(prev => {
    const blocks = { ...(prev.blocks || {}) };
    delete blocks[id];
    return { ...prev, blocks };
  });
  const duplicateIdea = (b) => updateShared(prev => {
    const id = genId();
    return { ...prev, blocks: { ...(prev.blocks || {}), [id]: { ...b, id, title: b.title + " (copy)", scheduled: [] } } };
  });

  // Named sections for this day, shared by every chooser on the screen.
  // Every section the day has, in the order Class Flow draws them: the
  // sequence's own, then the ones I made, then anything left over from a
  // sequence change. The same list the flow uses, so a chooser opened anywhere
  // offers the same places.
  const daySections = (() => {
    const sl = plan?.slots || {};
    const seqSlots = (sequenceFor(config, plan?.sequenceId || config.defaultSequenceId).slots) || [];
    const named = new Set(seqSlots.map(x => x.slot));
    const mine = Object.keys(sl).filter(k => k.startsWith("sec-"));
    const left = Object.keys(sl).filter(k => !named.has(k) && !k.startsWith("sec-") && normSlot(sl[k]).items.length);
    return [
      ...seqSlots.map(x => [x.slot, normSlot(sl[x.slot]).title || x.slot]),
      ...mine.map(k => [k, normSlot(sl[k]).title || "Untitled section"]),
      ...left.map(k => [k, normSlot(sl[k]).title || k]),
    ];
  })();
  const sections = daySections;

  // A block can be placed on any day, not just the one I am looking at.
  const pickBlock = (slot, b, date) => {
    const on = date || day;
    writeDayOn(on, d => {
      const slots = { ...(d.slots || {}) };
      const bucket = normSlot(slots[slot]);
      slots[slot] = { ...bucket, items: [...bucket.items, { id: genId(), blockId: b.id }] };
      return { ...d, slots };
    });
    stampScheduled(writeTo(b.id), b.id, on);
  };
  const setBlockHeadline = (id, headline) => writeTo(id)(prev => ({
    ...prev,
    blocks: { ...(prev.blocks || {}), [id]: { ...(prev.blocks || {})[id], headline } },
  }));

  // Merge several slots into one. Nothing is converted or rewritten — the
  // items move across as they are, references and headlines intact.
  const foldSlots = (keys) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    const merged = keys.flatMap(k => normSlot(slots[k]).items);
    keys.forEach(k => { delete slots[k]; });
    const into = normSlot(slots.__flat);
    slots.__flat = { ...into, title: "The day", items: [...into.items, ...merged] };
    return { ...d, slots };
  });

  // A section is a slot with its own key, not a row.
  const addBlock = (title) => writeDay(d => ({
    ...d,
    slots: { ...(d.slots || {}), ["sec-" + genId()]: { title, items: [] } },
  }));
  const removeBlock = (id) => writeDay(d => ({ ...d, blocks: (d.blocks || []).filter(b => b.id !== id) }));
  const moveBlock = (id, dir) => writeDay(d => {
    const list = [...(d.blocks || [])];
    const i = list.findIndex(b => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return d;
    [list[i], list[j]] = [list[j], list[i]];
    return { ...d, blocks: list };
  });
  const setSlotTitle = (slot, title) => writeDay(d => {
    const slots = { ...(d.slots || {}) };
    slots[slot] = { ...normSlot(slots[slot]), title };
    return { ...d, slots };
  });

  const saveSlidesClaim = (claim) => writeDay(d => ({ ...d, slidesClaim: claim }));
  const saveBlockClaim = (blockId, claim, linkId) => writeDay(d => ({
    ...d,
    blocks: (d.blocks || []).map(b => {
      if (b.id !== blockId) return b;
      if (!linkId) return { ...b, claim };
      return { ...b, links: (b.links || []).map(l => l.id === linkId ? { ...l, claim } : l) };
    }),
  }));
  const saveStockClaim = (shelf, id, claim) =>
    setShelf(shelf, list => list.map(x => x.id === id ? { ...x, claim } : x));

  const saveBoard = (which, board) => writeDay(d => ({ ...d, boards: { ...(d.boards || {}), [which]: board } }));
  const saveDayNote = (notes, on) => writeDayOn(on || day, d => ({ ...d, notes }));
  const writeWeekField = (field, val) => update(prev => ({
    ...prev,
    schedule: (prev.schedule || config.scheduleWeeks || [])
      .map(w => w.id === weekId ? { ...w, [field]: val } : w),
  }));
  const saveWeekPlan = (v) => writeWeekField("plan", v);
  const saveWeekText = (v) => writeWeekField("text", v);
  // The big line at the top is the WEEK's topic, which is why it reads oddly
  // on a day that is about something else, and why it came over from the old
  // hub with a full stop on the end. It is editable in place now, and nothing
  // punctuates it — a topic is a label, not a sentence.
  const saveWeekTopic = (v) => writeWeekField("topic", v);

  const saveScratch = (v) => update(prev => ({ ...prev, scratch: { ...(prev.scratch || {}), [day]: v } }));

  pickedRef.current = picked;

  const liveLabel = live?.cast?.label || null;
  const castNow = (payload) => {
    cast(payload);
    const name = payload?.label || payload?.title;
    if (!name || payload.type === "black") return;
    setRecent(prev => [{ key: name + ":" + Date.now(), label: name, payload }, ...prev.filter(r => r.label !== name)].slice(0, 5));
  };
  const dismiss = () => cast(null);
  const markEngaged = () => push({ engagedAt: Date.now() });

  const runFeature = (name) => {
    if (name === "Around the Horn") { setHornOpen(true); markEngaged(); return; }
    if (name === "Headlines") { setHlOpen(true); castNow({ type: "headlines", label: "Headlines" }); markEngaged(); return; }
    castNow({ type: "feature", title: name, body: FEATURES[name] || "", label: name });
    markEngaged();
  };

  const setSeats = (seats) => update(prev => ({ ...prev, athSeats: seats }));
  const awardHorn = (name, amount) => update(prev => ({
    ...prev,
    log: [...(prev.log || []), { id: genId(), student: name, amount, source: "Around the Horn", ts: Date.now(), date: day }],
  }));

  // What the boards say unless I edit them. Built from the schedule so there is
  // always something on the screen worth reading.
  const idx = days.findIndex(d => d.date === day);
  const nextDay = idx >= 0 ? days[idx + 1] : null;
  const weekItems = (weeks.find(w => w.id === weekId)?.items) || [];
  const dueSoon = assignments.filter(a => a.due && a.due !== "Ongoing").slice(0, 2);
  const proposals = {
    // The day note is a note to myself, and proposing it here put it one click
    // from the wall. The board proposes what the room should be reading instead.
    pre: {
      title: weekTopic || config.name,
      ideas: [
        weekTopic ? "Today: " + weekTopic + "." : "",
        ...dueSoon.slice(0, 1).map(a => a.title + " is due " + a.due + "."),
      ].filter(Boolean),
    },
    post: {
      title: "Coming up",
      ideas: [
        nextDay ? "Next class " + nextDay.date + (nextDay.topic ? " — " + nextDay.topic : "") + "." : "That's the last session on the calendar.",
        ...dueSoon.map(a => a.title + " — due " + a.due + "."),
      ].filter(Boolean),
    },
  };

  // Arrow keys walk the board that is up. The board panel already knows how to
  // do this; the keyboard needed the same move without the mouse.
  const boardFor = (which) => (plan?.boards || {})[which] || proposals[which];
  stepRef.current = (dir) => {
    const c = liveRef.current?.cast;
    if (!c || c.type !== "board") return;
    const which = c.boardLabel === "Enter" ? "pre" : "post";
    const b = boardFor(which);
    const ideas = b?.ideas || [];
    const i = (c.at || 0) + dir;
    if (i < 0 || i >= ideas.length) return;
    cast({ ...c, idea: ideas[i], at: i, count: ideas.length, label: c.boardLabel + " · " + (i + 1) });
  };

  // Everything the command bar can reach, in the order I would look for it.
  const slotBuckets = plan?.slots || {};
  const cmdTargets = [];
  features.forEach(f => cmdTargets.push({ key: "f:" + f, group: "Run", title: f, run: () => runFeature(f) }));
  (seq?.slots || []).forEach(sl => {
    const bucket = normSlot(slotBuckets[sl.slot]);
    const tag = bucket.title || sl.slot;
    bucket.items.forEach(it => {
      const seed = it.seedId ? seeds.find(x => x.id === it.seedId) : null;
      const title = it.claim || (seed ? seed.title : it.text) || "Untitled";
      cmdTargets.push({ key: "i:" + it.id, group: tag, title,
        run: () => castNow({ type: "quote", tag, title, cite: seed ? seed.concept : "", label: title }) });
      (it.links || []).forEach(l => {
        const t = l.claim || l.label;
        cmdTargets.push({ key: "l:" + l.id, group: "Link", title: t,
          run: () => castNow({ ...castFromLink(l), title: t, label: t }) });
      });
    });
  });
  if (plan?.slides) {
    const t = plan.slidesClaim || "Slides";
    cmdTargets.push({ key: "slides", group: "Slides", title: t,
      run: () => castNow({ ...castFromLink({ label: "Slides", url: plan.slides }), title: t, label: t }) });
  }
  (plan?.blocks || []).forEach(b => {
    const t = b.claim || b.title;
    if (t) cmdTargets.push({ key: "bk:" + b.id, group: "Block", title: t,
      run: () => castNow({ type: "quote", tag: "Block", title: t, label: t }) });
    (b.links || []).forEach(l => {
      const lt = l.claim || l.label;
      if (lt) cmdTargets.push({ key: "bl:" + l.id, group: "Block link", title: lt,
        run: () => castNow({ ...castFromLink(l), title: lt, label: lt }) });
    });
  });
  SHELVES.forEach(sh => (shelves[sh.id] || []).forEach(x => {
    const t = x.claim || x.title;
    cmdTargets.push({ key: "s:" + x.id, group: sh.label, title: t,
      run: () => castNow(x.url
        ? { ...castFromLink({ label: x.title, url: x.url }), title: t, label: t }
        : { type: "quote", tag: sh.label, title: t, label: t }) });
  }));
  ["pre", "post"].forEach(which => {
    const lbl = which === "pre" ? "Enter" : "Exit";
    const b = boardFor(which);
    (b?.ideas || []).forEach((idea, i) => cmdTargets.push({ key: "b:" + which + i, group: lbl, title: idea,
      run: () => castNow({ type: "board", tag: lbl, boardLabel: lbl, title: b.title, idea, at: i,
        count: b.ideas.length, showAsk: which === "pre", label: lbl + " · " + (i + 1) }) }));
  });
  assignments.forEach(a => cmdTargets.push({ key: "a:" + a.id, group: "Reveal", title: a.title,
    run: () => castNow({ type: "reveal", stamp: "Assignment", title: a.title, due: "Due " + a.due, big: true, label: a.title }) }));
  (q.items || []).filter(x => x.state === "open").forEach(x => cmdTargets.push({ key: "q:" + x.id, group: "Question", title: x.text,
    run: () => { castNow({ type: "question", tag: "From the room", title: x.text, cite: x.anon ? "Anonymous" : (x.who || ""), label: "Question · " + (x.anon ? "anonymous" : x.who) }); markEngaged(); } }));
  cmdTargets.push({ key: "c:poll", group: "Screen", title: "Live poll", run: () => castNow({ type: "poll", label: "Live poll" }) });
  cmdTargets.push({ key: "c:idle", group: "Screen", title: "Idle screen", run: () => cast(null) });
  cmdTargets.push({ key: "c:black", group: "Screen", title: "Black screen", run: () => cast({ type: "black", label: "Black screen" }) });

  if (data === null) {
    return <div style={{ minHeight: "100vh", background: BG, fontFamily: F, display: "grid", placeItems: "center", color: TEXT_MUTED }}>Loading…</div>;
  }

  // A brand-new class has no weeks yet, so there is no session to open on. The
  // old code waited for a day that was never coming and sat on "Loading" for
  // good.
  if (!day) {
    return (
      <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: "center", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
          <span style={label}>{config.code}</span>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em" }}>No sessions on the calendar yet</div>
          <Muted>The dashboard runs one class session at a time, so it needs a schedule before there is anything to open. Add the weeks and their dates first.</Muted>
          <a className="dash-focus" href={config.path + "/schedule"}
            style={{ ...mini, minHeight: TAP, padding: "0 18px", borderColor: config.accent, color: config.accent,
              textDecoration: "none", display: "inline-flex", alignItems: "center", fontSize: 15 }}>
            Build the schedule →
          </a>
        </div>
      </div>
    );
  }

  const render = {
    todo: () => <TodoPanel plan={plan} seq={seq} features={features} boards={plan?.boards || {}}
      assignments={assignments} shelves={shelves} students={students} data={data} accent={config.accent}
      where={config.code + " · " + day} loose={looseItems} />,
    now: () => <NowPanel config={config} plan={plan} seq={seq} engagedAt={live?.engagedAt}
      onEngaged={markEngaged}
      onSlot={(x) => writeDay(d => ({ ...d, currentSlot: x, slotAt: x ? { ...(d.slotAt || {}), [x]: Date.now() } : (d.slotAt || {}) }))} />,
    poll: () => <PollPanel poll={P.poll} start={(qq, oo) => { P.start(qq, oo); markEngaged(); }}
      setPhase={(ph) => { P.setPhase(ph); if (ph === "vote2") markEngaged(); }}
      setCorrect={P.setCorrect} clear={() => { P.clear(); if (live?.cast?.type === "poll") cast(null); }}
      roster={students.length} accent={config.accent}
      onCast={() => cast({ type: "poll", label: "Live poll" })} />,
    flow: () => <FlowPanel plan={plan} seq={seq} seeds={seeds} castNow={castNow} dismiss={dismiss}
      liveLabel={liveLabel} accent={config.accent} onClaim={saveFlowClaim}
      features={features} onFeature={runFeature} planHref={config.path + "/dayplan"}
      onSlidesClaim={saveSlidesClaim} onBlockClaim={saveBlockClaim} where={config.code + " · " + day}
      loose={looseItems} onAddScheduled={(it, slot, date) => addScheduleItemToDay(update, config, date || day, it, slot)}
      onAddItem={addFlowItem} onRemoveItem={removeFlowItem} onMoveItem={moveFlowItem}
      onSetSequence={setSequence} onSetSlotTitle={setSlotTitle} sequences={seqs}
      onAddBlock={addBlock} onRemoveBlock={removeBlock} onMoveBlock={moveBlock}
      blocks2={blocks2} onPickBlock={pickBlock} blockOf={blockOf} onBlockHeadline={setBlockHeadline}
      readings={readings} comingRows={comingRows}
      isAssigned={(it) => !!assignedIdFor(it)} onToggleAssigned={toggleAssigned}
      onAddReading={addReading} onRemoveReading={dropReading} onPickReading={pickReading}
      onAddIdea={addIdea} days={days} today={day} onFold={foldSlots} onDragMove={dragMove} onDeleteSection={deleteSection} onMergeSections={mergeSections} onSelect={setPicked} pickedId={picked?.id} onOrder={(rows) => { flowOrderRef.current = rows; }}
      doneSet={doneSet} onTick={tickItem} />,
    boards: () => <BoardsPanel boards={plan?.boards || {}} proposals={proposals} onSave={saveBoard}
      castNow={castNow} dismiss={dismiss} liveCast={live?.cast} accent={config.accent} />,
    readings: () => <Readings items={readings} accent={config.accent} castNow={castNow} dismiss={dismiss}
      liveLabel={liveLabel} onAdd={addReading} onRemove={dropReading}
      blockOf={blockOf}
      onClaim={(id, c) => setScheduleItemClaim(update, config, id, c)}
      onNote={(id, n) => setScheduleItemNote(update, config, id, n)} inFlow={readingInFlow}
      blocks={blocks2} onPickBlock={pickReading} />,
    ideas: () => <IdeasPanel blocks={blocks2} accent={config.accent}
      sections={sections} days={days} today={day}
      onPick={pickBlock} onAdd={addIdea} onEdit={editIdea} onRemove={removeIdea} onDuplicate={duplicateIdea} />,
    questions: () => <QuestionsPanel items={q.items} setState={q.setState} archiveOpen={q.archiveOpen}
      castNow={(pl) => { castNow(pl); markEngaged(); }} accent={config.accent} />,
    scratch: () => <ScratchPanel value={(data.scratch || {})[day]} onSave={saveScratch}
      dayNote={plan?.notes} weekPlan={weekRow?.plan} weekText={weekRow?.text}
      accent={config.accent} day={day}
      onSaveDayNote={saveDayNote} onSaveWeekPlan={saveWeekPlan} onSaveWeekText={saveWeekText}
      days={days} noteFor={(d) => ((data.dayPlans || {})[d] || {}).notes || ""}
      onStock={(text) => setShelf("day", list => [...list, { id: genId(), kind: "Note", title: text, url: "" }])} />,
    assignments: () => <AssignmentsPanel assignments={assignments} castNow={castNow} dismiss={dismiss} liveLabel={liveLabel} path={config.path} />,
  };
  const TITLES = { todo: "To-do", poll: "Poll", flow: "Class Flow", boards: "Enter/Exit", readings: "Readings", ideas: "Ideas", questions: "Asking", attendance: "Here", scratch: "Notes", assignments: "Assigned" };
  const openQ = (q.items || []).filter(x => x.state === "open").length;
  const outCount = Object.values(marks).filter(v => v === "out").length;
  // How far through the day I am, counted off the flow rather than the clock.
  const flowCount = Object.values(plan?.slots || {}).reduce((n, b) => n + normSlot(b).items.length, 0);
  const doneSet = new Set(plan?.done || []);
  const castCount = doneSet.size;
  // What sits on each day of the week, so the strip can say so without making
  // me open one to find out.
  const dayCounts = {};
  days.forEach(d => {
    const pl = (data?.dayPlans || {})[d.date];
    dayCounts[d.date] = Object.values(pl?.slots || {}).reduce((n, b) => n + normSlot(b).items.length, 0);
  });
  // What each tab is worth opening for. A count is a reason to look, so only
  // the ones that carry news get one: people waiting on an answer, ideas I have
  // not placed, readings set for today. A total that never moves is furniture.
  const RAIL_N = {
    questions: openQ,
    readings: readings.length,
    assignments: assignments.length,
    poll: P.poll?.phase && P.poll.phase !== "idle" ? "\u25cf" : 0,
    ideas: 0, todo: 0, scratch: 0, boards: 0,
  };
  const upNextRow = (flowOrderRef.current || []).find(r => !doneSet.has(r.id));
  const upNextWords = upNextRow ? (() => {
    const b = upNextRow.blockId ? blockOf(upNextRow.blockId) : null;
    return (b ? b.headline || b.title : upNextRow.item?.claim || upNextRow.item?.text) || "";
  })() : "";
  const castNext = () => { if (upNextRow?.cast) upNextRow.cast(); };
  const sinceMin = live?.engagedAt ? Math.floor((Date.now() - live.engagedAt) / 60000) : null;
  const minsLeft = (() => {
    const m = (hhmm) => { const [h, x] = (hhmm || "").split(":").map(Number); return isNaN(h) ? null : h * 60 + (x || 0); };
    const st = m(config.meets?.start), en = m(config.meets?.end);
    if (st == null || en == null) return null;
    const n = new Date();
    const cur = n.getHours() * 60 + n.getMinutes();
    return cur >= st && cur <= en ? en - cur : null;
  })();
  const onDeck = currentDay(weeks)?.date;

  return (
    <div className={dense ? "dash-compact" : "dash-comfortable"}
      style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, "--dash-accent": config.accent }}>
      <style>{CSS}</style>

      {/* Four groups, and the grouping is what each control IS.
          The class tools are the things I press with the room watching, so they
          sit together and look alike. The view switches are things I set once
          and then forget, so they go behind one menu instead of competing for
          the same attention. The ways out of this class live under the class
          name, because that is what they all are. Teaching stays out on its
          own — it is the one switch I hit at the moment class starts. */}
      <header ref={headRef} style={{ background: "#fff", borderBottom: "1px solid " + BORDER, padding: "10px 20px",
        display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        position: "sticky", top: 0, zIndex: 30 }}>
        <ClassMenu config={config} />
        <span style={{ marginRight: "auto", fontSize: 14, color: TEXT_MUTED, minWidth: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{config.desc}</span>

        <div className="dash-seg" style={{ "--seg": config.accent }}>
          <button className="dash-focus" onClick={() => setCmdOpen(true)}>Cast<kbd>⌘K</kbd></button>
          <button className="dash-focus" onClick={() => setHlOpen(true)}>Headlines</button>
          <button className="dash-focus" onClick={() => setHornOpen(true)}>Around the Horn</button>
          <button className="dash-focus" onClick={() => setHereOpen(true)}>
            Here{students.length ? <kbd>{students.length - outCount}/{students.length}</kbd> : null}
          </button>
        </div>

        <ViewMenu railOpen={railOpen} onRail={toggleRail} dense={dense} onDense={() => setDenseAnd(!dense)}
          onReset={() => railSave.current({ cols: COL, railOpen: true, dense: false })}
          onKeys={() => setKeysOpen(true)} />

        <button className="dash-focus" style={{ ...mini, minHeight: 36, ...(focus ? { background: config.accent, borderColor: config.accent, color: "#fff" } : {}) }}
          onClick={() => setFocus(v => !v)} aria-pressed={focus} title="Teaching only. Shuts the Materials column and gives the day the room. ⌘E">Teaching</button>
      </header>


      <div style={{ padding: "14px 18px 0", maxWidth: 1760, margin: "0 auto" }}>
        <DayBand days={days} day={day} onPick={setDay} onOpenDay={() => setTodoOpen(true)} counts={dayCounts} accent={config.accent} today={onDeck}
          topic={dayMeta?.topic} name={config.name} onTopic={saveWeekTopic}
          done={castCount} total={flowCount} since={sinceMin} cold={sinceMin != null && sinceMin >= 10}
          left={minsLeft} upNext={liveLabel ? "" : upNextWords} onCastNext={castNext}
          onReset={() => writeDay(d => ({ ...d, done: [] }), "starting the day over")} />
      </div>

      <main ref={stageRef} className="dash-stage" data-rail={railOpen ? "open" : "shut"} data-teach={focus ? "on" : "off"}
        style={{ gridTemplateColumns: gridFor(cols, railOpen, focus) }}>
        {railOpen && !focus ? (
          <>
            <Rail side="Materials" tabs={MATERIAL.map((id, i) => ({ id, label: TITLES[id], count: RAIL_N[id], hot: i + 1 }))}
              active={prep} onPick={pickPrep} accent={config.accent}>
              <Panel id={prep} title={null}>{render[prep]()}</Panel>
            </Rail>
            <Seam which="material" onDown={startSeam("material")} label="Material" />
          </>
        ) : null}

        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 className="dash-col">Flow</h2>
          <Panel id="flow" title={null}>{render.flow()}</Panel>
          {undo ? (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button className="dash-focus" style={{ ...mini, borderColor: WARN, color: WARN }} onClick={doUndo}>Undo {undo.what}</button>
            </div>
          ) : null}
        </div>

        <Seam which="live" onDown={startSeam("live")} label="Live" />

        <Rail side="Live" className="dash-room" tabs={LIVE_RAIL.map((id, i) => ({ id, label: TITLES[id], count: RAIL_N[id], hot: MATERIAL.length + i + 1 }))}
          active={room} onPick={pickRoom} accent={config.accent}>
          <div className="dash-room-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Monitor config={config} live={live} cast={cast} push={push} recent={recent} onRecast={castNow}
              info={picked ? (
                <BlockInfo block={picked.blockId ? blockOf(picked.blockId) : null} item={picked.item}
                  where={picked.where} accent={config.accent} onClose={() => setPicked(null)} />
              ) : null} />
            <Panel id={room} title={null}>{render[room]()}</Panel>
          </div>
        </Rail>
      </main>

      {cmdOpen ? <CommandBar targets={cmdTargets} accent={config.accent} onClose={() => setCmdOpen(false)} /> : null}
      {keysOpen ? <ShortcutSheet onClose={() => setKeysOpen(false)} /> : null}

      {hlOpen ? (
        <HeadlinesBoard hl={HL.hl} api={HL} accent={config.accent}
          onCast={() => { cast({ type: "headlines", label: "Headlines" }); markEngaged(); }}
          onClose={() => setHlOpen(false)} />
      ) : null}

      {hornOpen ? (
        <HornBoard students={students} seats={data.athSeats || {}} log={data.log || []} accent={config.accent}
          onSeats={setSeats} onAward={(n, a) => { awardHorn(n, a); markEngaged(); }} onClose={() => setHornOpen(false)} />
      ) : null}

      {hereOpen ? (
        <Sheet title="Who is here" sub={config.code + " \u00b7 " + day} onClose={() => setHereOpen(false)}>
          <AttendancePanel students={students} marks={marks} onMark={mark} onReset={resetAttendance} />
        </Sheet>
      ) : null}

      {todoOpen ? (
        <Sheet title="Still to do" sub={config.code + " \u00b7 " + day} onClose={() => setTodoOpen(false)}>
          {render.todo()}
        </Sheet>
      ) : null}

      <div style={{ maxWidth: 1560, margin: "0 auto", padding: "0 20px 40px", fontSize: 13, color: TEXT_MUTED }}>
        {dayMeta?.topic ? dayMeta.topic + " · " : ""}Press ⌘K to cast anything, ⌘/ for the rest of the keyboard. Panel arrangement is saved to this browser; everything else syncs to the class.
      </div>
    </div>
  );
}
