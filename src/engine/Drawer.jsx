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

import { useState, useEffect, useRef } from "react";
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
const GAMEY = /\b(game|trivia|ten on ten)\b/i;

export const SHELVES = [
  { id: "media", label: "Media", make: "link", holds: (t) => !IS_ACTIVITY(t) && !IS_NOTE(t) },
  { id: "activities", label: "Activities", make: "activity", holds: IS_ACTIVITY },
  { id: "notes", label: "Items", make: "note", holds: IS_NOTE },
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

// A field that saves when you leave it. No Save button, for the same reason
// section names have no pencil: the words are the control.
//
// It lives out here, at the top of the module, and not inside the editor that
// uses it. Declared inside, it was a new component on every render, so React
// threw the input away and built a fresh one each time the dashboard redrew —
// which it does whenever anything in the class changes. Whatever had been typed
// and not yet saved went with it, and a new thing went onto the day untitled.
function Field({ value, label: lbl, area, ph, onSave, autoFocus }) {
  const had = value || "";
  const save = (e) => { if (e.target.value !== had) onSave(e.target.value); };
  return (
    <label className="draw-field">
      <span>{lbl}</span>
      {area ? (
        <textarea defaultValue={had} rows={4} placeholder={ph} onBlur={save} />
      ) : (
        <input defaultValue={had} placeholder={ph} onBlur={save} autoFocus={autoFocus}
          onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
      )}
    </label>
  );
}

// Every field a block has.
function BlockFields({ block, onSave }) {
  const kinds = allTypes();
  // A thing with no title is a thing just made, and the title is what you
  // came to type.
  const fresh = !block.title;
  return (
    <>
      <Field value={block.title} label="Title" ph="What it is called" autoFocus={fresh} onSave={v => onSave({ title: v })} />
      <Field value={block.headline} label="Headline" ph="The one sentence the room reads" onSave={v => onSave({ headline: v })} />
      <Field value={block.source} label="Source" ph="Who made it" onSave={v => onSave({ source: v })} />
      <Field value={block.url} label="Link" ph="https://" onSave={v => onSave({ url: v })} />
      <Field value={block.body} label="Content" area ph="Notes to yourself, or the whole thing" onSave={v => onSave({ body: v })} />
      <label className="draw-field">
        <span>Kind</span>
        <select defaultValue={block.type} onChange={e => onSave({ type: e.target.value })}>
          {kinds.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
      </label>
    </>
  );
}

// A row typed straight onto the day has no block behind it. Its words are the
// whole row, so they are the whole editor.
function RowFields({ item, onSave }) {
  return (
    <>
      <Field value={item.text} label="The row" area ph="What this row says" onSave={v => onSave({ text: v })} />
      <Field value={item.claim} label="Headline" ph="The one sentence the room reads" onSave={v => onSave({ claim: v })} />
    </>
  );
}

// The drawer, doing its second job: the thing you just clicked in the day,
// open and editable, where the drawer already is.
//
// Clicking a row used to print it read-only into the rail under the room
// preview — a list of every field it had, none of them editable, a screen away
// from the search that found it. So fixing a typo in a headline meant leaving
// the dashboard for the repository. The drawer is already the place a thing
// comes FROM; it is the obvious place for the thing to go back to.
function DrawerEdit({ block, item, where, hue, onSave, onSaveItem, onPlace, onMove, onClose, pickedId }) {
  const t = block ? typeOf(block.type) : null;

  // Bring the editor to where Andrew is looking.
  //
  // Pressing Edit on a row already worked — it opened the thing right here —
  // but the drawer sits under the room screen in the rail, which on a laptop
  // is below the fold. So the button changed something he could not see, which
  // is indistinguishable from a button that does nothing, and that is what he
  // reported. The editor scrolls itself up when a new thing is opened in it.
  const box = useRef(null);
  useEffect(() => {
    box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [pickedId]);

  return (
    <div className="draw draw-edit" ref={box}>
      <div className="draw-edithead">
        <span className="draw-spine" style={{ background: hue(block?.type || "note") }} />
        <span className="draw-editkind">{t ? t.label : "Item"}</span>
        {where ? <span className="draw-editwhere">in {where}</span> : null}
        <span style={{ flex: "1 1 auto" }} />
        <button className="dash-focus draw-editx" onClick={onClose} aria-label="Back to the drawer">×</button>
      </div>

      {block ? (
        <>
          <BlockFields block={block} onSave={onSave} />
          {(block.scheduled || []).length ? (
            <div className="draw-used">On {block.scheduled.join(" · ")}</div>
          ) : null}
        </>
      ) : item ? (
        <RowFields item={item} onSave={onSaveItem} />
      ) : null}

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

// One result. A spine in its kind's colour, two lines, and the way to put it on
// the day.
function DrawerRow({ b, hue, placed, onPick, extra }) {
  const t = typeOf(b.type);
  const when = placed && placed.get ? placed.get("b:" + b.id) : "";
  return (
    <button className="dash-focus draw-row" onClick={() => onPick(b)}
      draggable
      onDragStart={e => { e.currentTarget.dataset.drag = "1"; e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", JSON.stringify({ blockId: b.id })); }}
      onDragEnd={e => { e.currentTarget.dataset.drag = "0"; }}
      style={{ "--ink": inkOf(hue(b.type)) }}
      title="Drag onto the day, or click to open">
      <span className="draw-spine" style={{ background: hue(b.type) }} />
      <span className="draw-lines">
        <span className="draw-title">{b.title || "Untitled"}</span>
        {/* One line under the title: what it is, who made it, and whether it
            has been in front of them already. Only the parts that exist — a
            note has no source, and a thing on no day says nothing rather than
            saying "never". */}
        <span className="draw-sub">
          {[t.label.toLowerCase(), extra, b.source || sourceFrom(b.url), when ? "already on " + when : ""]
            .filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="draw-add" aria-hidden="true">+</span>
    </button>
  );
}

export default function Drawer({ blocks, accent, hue, onPick, onNew, features, onRunFeature, featureBlurb, placed,
  picked, onSavePicked, onSaveItemPicked, onPlacePicked, onMovePicked, onClearPicked, days, today, sections, blockOf,
  startShelf = "media", games, onPlaceGame, gamesHref }) {
  const [q, setQ] = useState("");
  const [shelf, setShelf] = useState(startShelf);
  const [kind, setKind] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [kindOpen, setKindOpen] = useState(false);
  // The games opened to show their questions.
  const [openSets, setOpenSets] = useState(() => new Set());

  const text = q.trim().toLowerCase();
  // Games are built in the game panel now, so a set that was a game before it
  // is not offered here; its questions stay tucked away with it.
  const oldGame = (b) => !!games && b.type === "set" && GAMEY.test(b.title || "");
  const matches = (blocks || []).filter(b => !oldGame(b) && (!text || hay(b).includes(text)));

  // A question inside a game is tucked into that game.
  //
  // COMM 118 has 96 questions and every one of them belongs to one of nine
  // games, so listed one by one they were five screens of Activities with the
  // ten teaching moves and three boards somewhere underneath. A question with
  // no game stays on the shelf, so one can never go missing.
  const byId = new Map((blocks || []).map(b => [b.id, b]));
  const tucked = new Set();
  (blocks || []).forEach(b => {
    if (b.type === "set") (b.children || []).forEach(id => { if (byId.get(id)?.type === "question") tucked.add(id); });
  });
  const hit = new Set(matches.map(b => b.id));
  const kidsOf = (set) => (set.children || []).map(id => byId.get(id)).filter(c => c && tucked.has(c.id));

  // What each shelf is holding for this search, so a shelf can say whether it
  // is worth opening before you open it. A tucked question counts as part of
  // its game.
  const counts = {};
  SHELVES.forEach(s => { counts[s.id] = matches.filter(b => s.holds(b.type) && !tucked.has(b.id)).length; });

  const shelfDef = SHELVES.find(s => s.id === shelf) || SHELVES[0];
  const onShelf = matches.filter(b => shelfDef.holds(b.type));
  // The kinds actually present on this shelf right now, so the chips are a map
  // of what is there rather than a list of everything that could be.
  const kindCounts = {};
  onShelf.forEach(b => { kindCounts[b.type] = (kindCounts[b.type] || 0) + 1; });
  const kinds = allTypes().filter(t => kindCounts[t.id]);

  // Activities, with no kind chosen, are grouped by kind with the questions
  // inside their games. Choosing Question from the kind menu still lists every
  // question flat, for when a question is the thing you are after.
  const grouped = shelf === "activities" && !kind;
  const every = grouped
    ? (blocks || []).filter(b => shelfDef.holds(b.type) && !tucked.has(b.id) && !oldGame(b)
        && (hit.has(b.id) || (text && b.type === "set" && kidsOf(b).some(c => hit.has(c.id)))))
    : onShelf.filter(b => !kind || b.type === kind);
  const shown = every.length;
  const rows = every.slice(0, 60);
  const groups = grouped
    ? [...new Set(rows.map(b => b.type))]
        .sort((a, b) => allTypes().findIndex(t => t.id === a) - allTypes().findIndex(t => t.id === b))
        .map(id => ({ t: typeOf(id), list: rows.filter(b => b.type === id) }))
    : [{ t: null, list: rows }];
  const toggleSet = (id) => setOpenSets(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // A thing is open: the drawer becomes its editor until you close it.
  if (picked) {
    return (
      <DrawerEdit key={picked.id || picked.blockId} block={picked.blockId ? blockOf(picked.blockId) : null} item={picked.item}
        where={picked.where} hue={hue} onSave={onSavePicked} onSaveItem={onSaveItemPicked}
        onPlace={onPlacePicked} onMove={picked.item ? onMovePicked : null}
        onClose={onClearPicked} pickedId={picked.id} />
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
      {/* The class's games, from the game panel. Drag one onto a day, or Add to a day. */}
      {shelf === "activities" && !kind && (games || []).length ? (
        <div className="draw-runs">
          {(games || []).filter(g => !text || g.title.toLowerCase().includes(text)).map(g => (
            <div key={g.id} className="draw-run" draggable
              onDragStart={e => { e.dataTransfer.effectAllowed = "copy";
                e.dataTransfer.setData("text/plain", JSON.stringify({ gameId: g.id, title: g.title })); }}
              title={g.title}>
              <span className="draw-swatch" style={{ background: hue("set") }} />
              <span className="draw-run-name">
                {gamesHref ? <a href={gamesHref + "#game=" + g.id} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{g.title}</a> : g.title}
                <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 13, color: TEXT_MUTED }}>{g.questions}</span>
              </span>
              {onPlaceGame ? <button className="dash-focus draw-run-go" onClick={() => onPlaceGame(g)}>Add to a day</button> : null}
            </div>
          ))}
        </div>
      ) : null}

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
        {groups.map(({ t: gt, list }) => (
          <div key={gt ? gt.id : "all"} className="draw-group">
            {gt ? (
              <div className="draw-grouphead">{gt.label}<span>{list.length}</span></div>
            ) : null}
            {list.map(b => {
              if (!grouped || b.type !== "set") return <DrawerRow key={b.id} b={b} hue={hue} placed={placed} onPick={onPick} />;
              // A game, and the questions inside it. Open when you open it, or
              // when a search found one of its questions.
              const kids = kidsOf(b).filter(c => !text || hit.has(c.id) || hit.has(b.id));
              const found = text && kidsOf(b).some(c => hit.has(c.id));
              const open = openSets.has(b.id) || found;
              const all = kidsOf(b).length;
              return (
                <div key={b.id} className="draw-set">
                  <div className="draw-setline">
                    <DrawerRow b={b} hue={hue} placed={placed} onPick={onPick}
                      extra={all ? all + (all === 1 ? " question" : " questions") : ""} />
                    {all ? (
                      <button className="dash-focus draw-settoggle" onClick={() => toggleSet(b.id)}
                        aria-expanded={open} aria-label={open ? "Hide questions" : "Show questions"}
                        title={open ? "Hide questions" : "Show questions"}>{open ? "⌄" : "›"}</button>
                    ) : null}
                  </div>
                  {open && kids.length ? (
                    <div className="draw-kids">
                      {kids.map(c => <DrawerRow key={c.id} b={c} hue={hue} placed={placed} onPick={onPick} />)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
        {!rows.length ? (
          <div className="draw-none">
            {text ? "Nothing on this shelf matches " + JSON.stringify(q) + "." : "Nothing on this shelf yet."}
          </div>
        ) : null}
        {shown > rows.length ? (
          <div className="draw-none">{shown - rows.length} more. Keep typing to narrow it.</div>
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
/* Activities by kind. The heading is the kind's name and how many. */
.draw-group{display:flex;flex-direction:column;gap:4px}
.draw-group+.draw-group{padding-top:8px}
.draw-grouphead{display:flex;align-items:baseline;gap:7px;padding:4px 2px 2px;border-bottom:1px solid ${BORDER_STRONG};
  font-family:${MONO};font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${TEXT_SECONDARY}}
.draw-grouphead span{font-weight:500;letter-spacing:0;color:${TEXT_MUTED}}
/* A game, with its questions folded inside. */
.draw-set{display:flex;flex-direction:column}
.draw-setline{display:flex;align-items:center;gap:4px;border-bottom:1px solid ${BORDER}}
.draw-setline .draw-row{flex:1 1 auto;min-width:0;border-bottom:none}
.draw-settoggle{flex:none;width:44px;height:44px;border:none;border-radius:9px;background:none;cursor:pointer;
  color:${TEXT_SECONDARY};font-size:18px;line-height:1;padding:0}
.draw-settoggle:hover{background:${SURFACE_2};color:${TEXT_PRIMARY}}
.draw-kids{display:flex;flex-direction:column;margin-left:6px;padding-left:12px;border-left:2px solid ${BORDER_STRONG}}
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
