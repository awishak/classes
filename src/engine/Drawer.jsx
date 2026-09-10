// The drawer: one search across everything, and the three shelves it sorts into.
//
// The Materials rail used to be two tabs — Readings and Activities & seeds —
// each a list you scrolled. That works while a class is new and stops working
// at sixty-one readings, which is where COMM 118 already is. Scrolling is not
// how you find a thing you can name.
//
// So the search field IS the handle on the drawer: type, and the shelves below
// filter to what you meant. Three shelves, because a thing you put in front of
// a room is one of three kinds:
//
//   Media       something somebody else made, that you assign or show
//   Activities  something the room does, whether you wrote it or the app runs it
//   Notes       something you want to say
//
// Formats used to be a fourth. Andrew's verdict on the word was that he did not
// know what it meant, and the six under it — Headlines, Game, Fishbowl, This or
// That, Around the Horn, Team Trivia — are activities. So they are activities.

import { useState } from "react";
import * as TOKENS from "./tokens.js";
import { typeOf, allTypes, makeBlock } from "./blocks.js";
import { inkOf } from "./colors.js";

const F = TOKENS.FONT.body;
const MONO = TOKENS.FONT.label;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const SURFACE_2 = TOKENS.SURFACE.sunk;

// Two shelves are defined by what they hold; the third takes everything else.
//
// That is deliberate, and it is the only arrangement where a NEW kind cannot
// go missing. Andrew adds kinds himself — there are eleven already and the
// list is his — so a shelf scheme that names every kind explicitly is a scheme
// that silently loses the twelfth. Written the other way round, the worst a
// new kind can do is land on Media, where he will see it.
//
// A question, a board and a set are activities: each is something the room
// does together, and a set is a group of them (the weekly game is a set).
// A story is a note, because a story is something Andrew says.
const IS_ACTIVITY = (t) => t === "activity" || t === "board" || t === "question" || t === "set";
const IS_NOTE = (t) => t === "note" || t === "story";

export const SHELVES = [
  { id: "media", label: "Media", make: "link", holds: (t) => !IS_ACTIVITY(t) && !IS_NOTE(t) },
  { id: "activities", label: "Activities", make: "activity", holds: IS_ACTIVITY },
  { id: "notes", label: "Notes", make: "note", holds: IS_NOTE },
];

export const shelfOf = (type) => (SHELVES.find(s => s.holds(type)) || SHELVES[0]).id;

const hay = (b) => [b.title, b.body, b.headline, b.source, ...(b.tags || [])].filter(Boolean).join(" ").toLowerCase();

// Where a thing came from, when nobody typed it in. A block usually has a URL
// and rarely has `source` filled, so the host stands in — theatlantic.com says
// enough, and www. in front of it says nothing.
const sourceFrom = (url) => {
  if (!url) return "";
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
};

// The drawer, doing its second job: the thing you just clicked in the day,
// open and editable, where the drawer already is.
//
// Clicking a row used to print it read-only into the rail under the room
// preview — a list of every field it had, none of them editable, a screen away
// from the search that found it. So fixing a typo in a headline meant leaving
// the dashboard for the repository. The drawer is already the place a thing
// comes FROM; it is the obvious place for the thing to go back to.
function DrawerEdit({ block, item, where, hue, onSave, onPlace, onMove, onClose }) {
  const t = block ? typeOf(block.type) : null;
  const kinds = allTypes();

  // A field that saves when you leave it. No Save button, for the same reason
  // section names have no pencil: the words are the control.
  const Field = ({ k, label: lbl, area, ph }) => (
    <label className="draw-field">
      <span>{lbl}</span>
      {area ? (
        <textarea defaultValue={block?.[k] || ""} rows={4} placeholder={ph}
          onBlur={e => { if (e.target.value !== (block?.[k] || "")) onSave({ [k]: e.target.value }); }} />
      ) : (
        <input defaultValue={block?.[k] || ""} placeholder={ph}
          onBlur={e => { if (e.target.value !== (block?.[k] || "")) onSave({ [k]: e.target.value }); }}
          onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
      )}
    </label>
  );

  return (
    <div className="draw draw-edit">
      <div className="draw-edithead">
        <span className="draw-spine" style={{ background: hue(block?.type || "note") }} />
        <span className="draw-editkind">{t ? t.label : "Note"}</span>
        {where ? <span className="draw-editwhere">in {where}</span> : null}
        <span style={{ flex: "1 1 auto" }} />
        <button className="dash-focus draw-editx" onClick={onClose} aria-label="Back to the drawer">×</button>
      </div>

      {block ? (
        <>
          <Field k="title" label="Title" ph="What it is called" />
          <Field k="headline" label="Headline" ph="The one sentence the room reads" />
          <Field k="source" label="Source" ph="Who made it" />
          <Field k="url" label="Link" ph="https://" />
          <Field k="body" label="What it says" area ph="Notes to yourself, or the whole thing" />
          <label className="draw-field">
            <span>Kind</span>
            <select defaultValue={block.type} onChange={e => onSave({ type: e.target.value })}>
              {kinds.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select>
          </label>
          {(block.scheduled || []).length ? (
            <div className="draw-used">On {block.scheduled.join(" · ")}</div>
          ) : null}
        </>
      ) : (
        <div className="draw-used">{item?.text || "This row is typed straight onto the day, so there is no block to edit."}</div>
      )}

      {/* Put it on another day, or take it off this one and put it there.
          The day-and-section picker is the dashboard's, opened from here —
          the same one the library uses, so placing a thing is one motion
          wherever you started it. */}
      <div className="draw-editgo">
        <button className="dash-focus draw-editbtn" onClick={onPlace}>Add to a day</button>
        {onMove ? (
          <button className="dash-focus draw-editbtn" onClick={onMove}>Move to a day</button>
        ) : null}
      </div>
    </div>
  );
}

export default function Drawer({ blocks, accent, hue, onPick, onNew, features, onRunFeature, featureBlurb, placed,
  picked, onSavePicked, onPlacePicked, onMovePicked, onClearPicked, days, today, sections, blockOf }) {
  const [q, setQ] = useState("");
  const [shelf, setShelf] = useState("media");
  const [kind, setKind] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [kindOpen, setKindOpen] = useState(false);

  const text = q.trim().toLowerCase();
  const matches = (blocks || []).filter(b => !text || hay(b).includes(text));

  // What each shelf is holding for this search, so a shelf can say whether it
  // is worth opening before you open it.
  const counts = {};
  SHELVES.forEach(s => { counts[s.id] = matches.filter(b => s.holds(b.type)).length; });

  const onShelf = matches.filter(b => (SHELVES.find(s => s.id === shelf) || SHELVES[0]).holds(b.type));
  // The kinds actually present on this shelf right now, so the chips are a map
  // of what is there rather than a list of everything that could be.
  const kindCounts = {};
  onShelf.forEach(b => { kindCounts[b.type] = (kindCounts[b.type] || 0) + 1; });
  const kinds = allTypes().filter(t => kindCounts[t.id]);
  const rows = onShelf.filter(b => !kind || b.type === kind).slice(0, 60);

  // A thing is open: the drawer becomes its editor until you close it.
  if (picked) {
    return (
      <DrawerEdit block={picked.blockId ? blockOf(picked.blockId) : null} item={picked.item}
        where={picked.where} hue={hue} onSave={onSavePicked}
        onPlace={onPlacePicked} onMove={picked.item ? onMovePicked : null}
        onClose={onClearPicked} />
    );
  }

  return (
    <div className="draw">
      <div className="draw-head">
        <div className="draw-find">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
          </svg>
          <input value={q} onChange={e => { setQ(e.target.value); setKind(""); }}
            placeholder="Search everything" aria-label="Search everything" />
          {q ? (
            <button className="dash-focus draw-clear" onClick={() => { setQ(""); setKind(""); }} title="Clear the search">×</button>
          ) : null}
        </div>
        <span style={{ position: "relative", flex: "none" }}>
          <button className="dash-focus draw-new" onClick={() => setNewOpen(v => !v)}
            aria-haspopup="menu" aria-expanded={newOpen}>+ New</button>
          {newOpen ? (
            <>
              <div onClick={() => setNewOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
              <div role="menu" className="draw-newmenu">
                {SHELVES.map(s => (
                  <button key={s.id} className="dash-focus" onClick={() => { setNewOpen(false); setShelf(s.id); onNew(s.make); }}>
                    <span className="draw-swatch" style={{ background: hue(s.make) }} />
                    New {s.label.toLowerCase().replace(/s$/, "")}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </span>
      </div>

      {/* Underlined tabs, not pills. Three pills beside a row of kind pills
          was two rows of the same shape doing two different jobs, and nothing
          said which was the bigger cut. A tab reads as a division of what is
          below it; a pill reads as a filter on it. These are divisions. */}
      <div className="draw-tabs" role="tablist" aria-label="Shelves">
        {SHELVES.map(s => {
          const on = shelf === s.id;
          const chosen = on && kind ? typeOf(kind).label : "";
          return (
            <span key={s.id} style={{ position: "relative", display: "inline-flex" }}>
              <button role="tab" aria-selected={on}
                className="dash-focus draw-tab" data-on={on ? "1" : "0"}
                onClick={() => {
                  // A second press on the shelf you are already on opens its
                  // kinds. The kinds used to be a permanent row of chips under
                  // the tabs — nineteen of them once every kind is in use,
                  // wrapping to three lines above the results they were meant
                  // to narrow.
                  if (on && kinds.length > 1) setKindOpen(v => !v);
                  else { setShelf(s.id); setKind(""); setKindOpen(false); }
                }}>
                {chosen || s.label}
                <span className="draw-tab-n">{chosen ? kindCounts[kind] : counts[s.id]}</span>
                {on && kinds.length > 1 ? <span className="draw-tab-c" aria-hidden="true">▾</span> : null}
              </button>
              {on && kindOpen ? (
                <>
                  <div onClick={() => setKindOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                  <div role="menu" className="draw-kindmenu">
                    <button className="dash-focus" data-on={!kind ? "1" : "0"}
                      onClick={() => { setKind(""); setKindOpen(false); }}>
                      All {s.label.toLowerCase()}<span>{onShelf.length}</span>
                    </button>
                    {kinds.map(t => (
                      <button key={t.id} className="dash-focus" data-on={kind === t.id ? "1" : "0"}
                        onClick={() => { setKind(t.id); setKindOpen(false); }}>
                        {t.label}<span>{kindCounts[t.id]}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </span>
          );
        })}
      </div>


      {/* The six the app runs. They live on the Activities shelf because that
          is what they are, and they are marked because the app runs these and
          reads the rest out to you. */}
      {shelf === "activities" && !kind && (features || []).length ? (
        <div className="draw-runs">
          {(features || []).filter(n => !text || n.toLowerCase().includes(text)).map(n => (
            <div key={n} className="draw-run" draggable
              onDragStart={e => { e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData("text/plain", JSON.stringify({ feature: n, title: n })); }}
              title={featureBlurb ? featureBlurb(n) : n}>
              <span className="draw-swatch" style={{ background: hue("activity") }} />
              <span className="draw-run-name">{n}</span>
              {onRunFeature ? (
                <button className="dash-focus draw-run-go" onClick={() => onRunFeature(n)}>Run</button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="draw-rows">
        {/* Two lines and a hairline, on white — the same call sheet the day is
            set in. These were filled grey cards, which made the drawer read as
            a different app sitting in the corner of this one. The second line
            carries what the row IS and where it already sits, because the
            question the drawer answers is not only "what have I got" but "have
            I put this in front of them already". */}
        {rows.map(b => {
          const t = typeOf(b.type);
          const when = placed && placed.get ? placed.get("b:" + b.id) : "";
          return (
            <button key={b.id} className="dash-focus draw-row" onClick={() => onPick(b)}
              draggable
              onDragStart={e => { e.currentTarget.dataset.drag = "1"; e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData("text/plain", JSON.stringify({ blockId: b.id })); }}
              onDragEnd={e => { e.currentTarget.dataset.drag = "0"; }}
              style={{ "--ink": inkOf(hue(b.type)) }}
              title="Drag onto the day, or click to open">
              <span className="draw-spine" style={{ background: hue(b.type) }} />
              <span className="draw-lines">
                <span className="draw-title">{b.title || "Untitled"}</span>
                {/* One line under the title: what it is, who made it, and
                    whether it has been in front of them already. Only the
                    parts that exist — a note has no source, and a thing on no
                    day says nothing rather than saying "never". */}
                <span className="draw-sub">
                  {[t.label.toLowerCase(), b.source || sourceFrom(b.url), when ? "already on " + when : ""]
                    .filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="draw-add" aria-hidden="true">+</span>
            </button>
          );
        })}
        {!rows.length ? (
          <div className="draw-none">
            {text ? "Nothing on this shelf matches " + JSON.stringify(q) + "." : "Nothing on this shelf yet."}
          </div>
        ) : null}
        {onShelf.length > rows.length ? (
          <div className="draw-none">{onShelf.length - rows.length} more. Keep typing to narrow it.</div>
        ) : null}
      </div>
    </div>
  );
}

export const DRAWER_CSS = `
.draw{display:flex;flex-direction:column;gap:10px;min-height:0}
.dash-drawer{background:#fff;border-radius:16px;padding:12px;
  box-shadow:0 1px 2px rgba(23,19,16,.05),0 0 0 1px rgba(23,19,16,.045);
  display:flex;flex-direction:column;min-height:0;max-height:46vh;overflow-y:auto}
.draw-head{display:flex;gap:7px;align-items:center}
.draw-find{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:8px;min-height:38px;
  padding:0 11px;border-radius:11px;border:1px solid ${BORDER_STRONG};background:#fff}
.draw-find:focus-within{border-color:var(--dash-accent);box-shadow:0 0 0 3px var(--dash-accent)18}
.draw-find input{flex:1 1 auto;min-width:0;border:none;outline:none;background:none;
  font-family:${F};font-size:16px;color:${TEXT_PRIMARY}}
.draw-clear{flex:none;width:24px;height:24px;border:none;border-radius:50%;background:${SURFACE_2};
  color:${TEXT_SECONDARY};cursor:pointer;font-size:15px;line-height:1;padding:0}
.draw-new{flex:none;min-height:38px;padding:0 13px;border-radius:11px;border:none;
  background:var(--dash-accent);color:#fff;cursor:pointer;font-family:${F};font-size:14px;font-weight:600}
.draw-newmenu{position:absolute;right:0;top:calc(100% + 6px);z-index:61;background:#fff;
  border:1px solid ${BORDER_STRONG};border-radius:12px;padding:5px;min-width:210px;
  box-shadow:0 16px 38px -12px rgba(23,19,16,.42);display:flex;flex-direction:column;gap:1px}
.draw-newmenu button{display:flex;align-items:center;gap:10px;width:100%;text-align:left;
  background:none;border:none;cursor:pointer;padding:0 10px;min-height:38px;border-radius:8px;
  font-family:${F};font-size:14.5px;color:${TEXT_PRIMARY}}
.draw-newmenu button:hover{background:${SURFACE_2}}
.draw-tabs{display:flex;gap:0;border-bottom:1px solid ${BORDER_STRONG}}
.draw-tab{min-height:34px;padding:0 12px;margin-bottom:-1px;border:none;border-bottom:2px solid transparent;
  background:none;color:${TEXT_SECONDARY};cursor:pointer;font-family:${F};font-size:14px;font-weight:500;
  display:inline-flex;align-items:center;gap:6px}
.draw-tab:hover{color:${TEXT_PRIMARY}}
.draw-tab[data-on="1"]{border-bottom-color:${TEXT_PRIMARY};color:${TEXT_PRIMARY};font-weight:600}
.draw-tab-n{font-family:${MONO};font-size:13px;font-weight:500;color:${TEXT_MUTED}}
.draw-tab[data-on="1"] .draw-tab-n{color:${TEXT_SECONDARY}}
.draw-tab-c{font-size:9px;opacity:.55}
.draw-kindmenu{position:absolute;left:0;top:calc(100% + 5px);z-index:61;background:#fff;
  border:1px solid ${BORDER_STRONG};border-radius:12px;padding:5px;min-width:190px;max-height:280px;overflow-y:auto;
  box-shadow:0 16px 38px -12px rgba(23,19,16,.42);display:flex;flex-direction:column;gap:1px}
.draw-kindmenu button{display:flex;align-items:center;gap:10px;width:100%;text-align:left;
  background:none;border:none;cursor:pointer;padding:0 10px;min-height:34px;border-radius:8px;
  font-family:${F};font-size:14px;color:${TEXT_PRIMARY}}
.draw-kindmenu button:hover{background:${SURFACE_2}}
.draw-kindmenu button[data-on="1"]{font-weight:600}
.draw-kindmenu button span{margin-left:auto;font-family:${MONO};font-size:13px;color:${TEXT_MUTED}}
/* A result row: a spine in its kind's colour, two lines, and the way to put it
   on the day. Hairlines between, on white, like the day itself. */
.draw-row{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:6px 0;
  background:none;border:none;border-bottom:1px solid ${BORDER};cursor:grab;text-align:left;font-family:${F}}
.draw-row:hover{background:${SURFACE_2}}
.draw-row[data-drag="1"]{opacity:.5;cursor:grabbing}
.draw-row:last-of-type{border-bottom:none}
.draw-spine{flex:none;width:3px;height:30px;border-radius:2px;margin-left:2px}
.draw-lines{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}
.draw-title{font-size:15px;line-height:1.3;color:${TEXT_PRIMARY};overflow-wrap:anywhere}
.draw-sub{font-size:13px;color:${TEXT_MUTED}}
.draw-add{flex:none;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;
  border-radius:9px;color:${TEXT_MUTED};font-size:16px}
.draw-row:hover .draw-add{background:#fff;color:${TEXT_PRIMARY}}
.draw-swatch{flex:none;width:3px;height:20px;border-radius:2px}
.draw-runs{display:flex;flex-direction:column;gap:4px;padding-bottom:4px;
  border-bottom:1px solid ${BORDER}}
.draw-run{display:flex;align-items:center;gap:9px;min-height:34px;padding:2px 8px;border-radius:10px;
  background:${SURFACE_2};cursor:grab;font-family:${F}}
.draw-run-name{flex:1 1 auto;min-width:0;font-size:15px;color:${TEXT_PRIMARY};
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.draw-run-go{flex:none;min-height:26px;padding:0 10px;border-radius:8px;border:1px solid ${BORDER_STRONG};
  background:#fff;color:${TEXT_SECONDARY};cursor:pointer;font-family:${F};font-size:13px;font-weight:600}
.draw-run-go:hover{color:${TEXT_PRIMARY}}
.draw-rows{display:flex;flex-direction:column;gap:4px;min-height:0}
.draw-kind{flex:none;font-family:${MONO};font-size:13px;font-weight:500;color:var(--ink,${TEXT_MUTED})}
.draw-none{padding:10px 4px;font-family:${F};font-size:13px;color:${TEXT_MUTED};line-height:1.45}
/* The drawer as an editor. */
.draw-edit{gap:11px}
.draw-edithead{display:flex;align-items:center;gap:9px;padding-bottom:9px;border-bottom:1px solid ${BORDER_STRONG}}
.draw-editkind{font-family:${MONO};font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  color:${TEXT_SECONDARY}}
.draw-editwhere{font-size:13px;color:${TEXT_MUTED};min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.draw-editx{flex:none;width:30px;height:30px;border:1px solid ${BORDER_STRONG};border-radius:9px;background:#fff;
  cursor:pointer;color:${TEXT_SECONDARY};font-size:16px;line-height:1;padding:0}
.draw-editx:hover{background:${SURFACE_2};color:${TEXT_PRIMARY}}
.draw-field{display:flex;flex-direction:column;gap:4px}
.draw-field>span{font-family:${MONO};font-size:13px;font-weight:500;color:${TEXT_MUTED}}
.draw-field input,.draw-field textarea,.draw-field select{width:100%;box-sizing:border-box;
  border:1px solid ${BORDER_STRONG};border-radius:10px;background:#fff;padding:8px 11px;
  font-family:${F};font-size:16px;color:${TEXT_PRIMARY};line-height:1.4;resize:vertical}
.draw-field input:focus,.draw-field textarea:focus,.draw-field select:focus{outline:none;
  border-color:var(--dash-accent);box-shadow:0 0 0 3px var(--dash-accent)18}
.draw-used{font-family:${F};font-size:13px;color:${TEXT_MUTED};line-height:1.45}
.draw-editgo{display:flex;gap:7px;flex-wrap:wrap;padding-top:4px;border-top:1px solid ${BORDER}}
.draw-editbtn{flex:1 1 auto;min-height:38px;padding:0 13px;border-radius:11px;border:1px solid ${BORDER_STRONG};
  background:#fff;color:${TEXT_PRIMARY};cursor:pointer;font-family:${F};font-size:14px;font-weight:600}
.draw-editbtn:hover{background:${SURFACE_2}}
`;
