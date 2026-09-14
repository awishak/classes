// The day as a document you type into.
//
// Three levels, like headings in a document: a SECTION, an ITEM under it (an
// item, an activity, an article, a game), and NOTES under an item. Every line
// is text you can put the cursor in, and the keys move the way a document does:
//
//   ↑ ↓        the line above or below, from the top or bottom of this one
//   ← →        at the very start or end of a line, into the next one
//   Alt+↑ ↓    a note, or a section, moved one place
//   Enter      a new line below: an item after a section or an item, a note
//              after a note. An empty note becomes an item instead.
//   Shift+Enter a line break inside this line
//   Tab        an item becomes a note on the item above it
//   Shift+Tab  a note becomes an item
//   Backspace  on an empty line, deletes it and goes to the end of the one above
//   /          the command menu: kinds, activities, structure, the screen
//   @          find something already in the library and put it here
//   "# "       at the start of a typed line, makes it a section
//   "- "       at the start of a typed item, makes it a note
//
// Sections and items have a slide beside them; a note has one when it is given
// one. A block's content is a note-level line under its item.
//
// On the words. Andrew renamed both on 2026-09-14: the kind that was called
// Note is called Item, and what were called comments are called notes. The
// code still says "comment" for the third level (kind: "comment", lv-comment,
// doc-comment) and the kind's id is still "note", because those are names in
// the store and the stylesheet, not words on the screen. Commands are verb and
// object with no articles: Put on screen, Open in new tab, Create slide.

import { useEffect, useRef, useState } from "react";
import Slide, { slideOf } from "./Slide.jsx";
import { typeOf, allTypes } from "./blocks.js";
import { normSlot, sumRanges, rangeLabel, parseRange } from "./dayplan.js";
import { inkOf } from "./colors.js";

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

// The web addresses in a line of text.
const URLS = /https?:\/\/[^\s<>"')]+/g;
export const urlsIn = (text) => (String(text || "").match(URLS) || []);

// Where in a line of text a click landed, as a position in the text.
function offsetAt(e, root) {
  const d = typeof document !== "undefined" ? document : null;
  let node = null, off = 0;
  if (d?.caretPositionFromPoint) { const p = d.caretPositionFromPoint(e.clientX, e.clientY); if (p) { node = p.offsetNode; off = p.offset; } }
  else if (d?.caretRangeFromPoint) { const r = d.caretRangeFromPoint(e.clientX, e.clientY); if (r) { node = r.startContainer; off = r.startOffset; } }
  if (!node || !root.contains(node)) return "end";
  let n = 0;
  const walk = d.createTreeWalker(root, 4);
  for (let t = walk.nextNode(); t; t = walk.nextNode()) {
    if (t === node) return n + off;
    n += t.nodeValue.length;
  }
  return "end";
}

// A text box that grows with what is in it and saves when you leave it, or
// after a second of not typing. It keeps its own draft while it has the
// cursor, so a save arriving from elsewhere does not move the text under you.
function Line({ id, value, placeholder, readOnly, className, onSave, onKey, register, done, onLeaveEmpty, onLink, onType, onLeave }) {
  const box = useRef(null);
  const shown = useRef(null);
  const [draft, setDraft] = useState(value || "");
  // A line holding a web address shows as text with the address as a real
  // link, and turns into a text box the moment you click anywhere else in it
  // or arrow into it. A text box cannot hold a link you can press, and a link
  // you cannot press in a document is a link that does not work.
  const [editing, setEditing] = useState(false);
  const want = useRef(null);
  const focused = useRef(false);
  const timer = useRef(null);

  useEffect(() => { if (!focused.current) setDraft(value || ""); }, [value]);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [draft, editing]);
  const flush = (v) => {
    clearTimeout(timer.current);
    if (!readOnly && v !== (value || "")) onSave(v);
  };
  const focusAt = (pos) => {
    const el = box.current;
    if (!el) { want.current = pos == null ? "end" : pos; setEditing(true); return; }
    el.focus();
    const p = pos === "end" || pos == null ? el.value.length : Math.min(pos, el.value.length);
    try { el.setSelectionRange(p, p); } catch { /* read-only lines */ }
  };
  // What the document can do to a line: put the cursor in it, and replace its
  // words (a slash command takes "/video" back out of the line it was typed in).
  const setText = (v) => { setDraft(v); flush(v); };
  useEffect(() => { register(id, { focus: focusAt, setText }); });
  useEffect(() => () => register(id, null), [id]);
  useEffect(() => {
    if (want.current != null && box.current) { const p = want.current; want.current = null; focusAt(p); }
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  if (onLink && !editing && urlsIn(draft).length) {
    const parts = String(draft).split(/(https?:\/\/[^\s<>"')]+)/g);
    return (
      <div ref={shown} className={"doc-line doc-linetext " + className + (done ? " done" : "")}
        onMouseDown={e => {
          if (e.target.closest("a")) return;
          e.preventDefault();
          want.current = offsetAt(e, shown.current);
          setEditing(true);
        }}>
        {parts.map((p, i) => (i % 2
          ? <a key={i} className="doc-inlink" href={p} onClick={e => { e.preventDefault(); onLink(p, e); }}>{p}</a>
          : p))}
      </div>
    );
  }

  return (
    <textarea ref={box} rows={1} spellCheck className={"doc-line " + className + (done ? " done" : "")}
      value={draft} placeholder={placeholder} readOnly={readOnly}
      onChange={e => {
        const v = e.target.value;
        setDraft(v);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => flush(v), 1000);
        if (onType) onType(v, e.target.selectionEnd, e.target);
      }}
      onFocus={e => {
        focused.current = true;
        setEditing(true);
        // The row around this line is draggable; a drag started inside a text
        // box is a text selection, not a move.
        const row = e.currentTarget.closest('[draggable="true"]');
        if (row) { row.setAttribute("draggable", "false"); row.dataset.held = "1"; }
      }}
      onBlur={e => {
        focused.current = false;
        const row = e.currentTarget.closest('[data-held="1"]');
        if (row) { row.setAttribute("draggable", "true"); delete row.dataset.held; }
        flush(e.currentTarget.value);
        setEditing(false);
        if (onLeave) onLeave(id);
        // A typed line left empty is a line nobody wrote. Pressing Enter and
        // then moving away leaves nothing behind on the day.
        if (onLeaveEmpty && !e.currentTarget.value.trim()) onLeaveEmpty();
      }}
      onKeyDown={e => { if (!e.nativeEvent.isComposing) onKey(e, e.currentTarget, flush); }} />
  );
}

// A link on a line: press the name and the page goes up on the room screen;
// press ↗ and it opens in a tab here instead. Press the name again while it
// is up to take it down.
function LinkChips({ urls, liveLabel, onCast, dismiss }) {
  const list = [...new Set((urls || []).filter(Boolean))];
  if (!list.length) return null;
  return list.map(u => {
    const name = hostOf(u) || "link";
    const live = liveLabel === name;
    return (
      <span key={u} className={"doc-link" + (live ? " live" : "")}>
        <button className="dash-focus doc-link-go" title={live ? "Take off screen" : "Put on screen"}
          onClick={() => (live ? dismiss() : onCast && onCast(u, name))}>{live ? name + " · on screen" : name}</button>
        <a className="dash-focus doc-link-open" href={u} target="_blank" rel="noopener noreferrer" aria-label="Open in new tab">↗</a>
      </span>
    );
  });
}

// One box that holds a short list of choices, opened by a right-click or the
// item's number, and closed by anything else.
function Menu({ at, items, onClose }) {
  if (!at) return null;
  return (
    <>
      <div className="doc-veil" onMouseDown={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div role="menu" className="doc-menu" style={{ left: at.x, top: at.y }}>
        {items.filter(Boolean).map(([label, run, danger]) => (
          <button key={label} className={"dash-focus" + (danger ? " danger" : "")} onClick={() => { onClose(); run(); }}>{label}</button>
        ))}
      </div>
    </>
  );
}

// The menu that opens under a line while you type / or @. The keys stay in the
// line: ↑ ↓ choose, Enter or Tab takes the choice, Escape closes it.
function Pop({ pop, list, onPick }) {
  const box = useRef(null);
  useEffect(() => {
    const el = box.current?.querySelector('[data-active="1"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [pop?.index]);
  if (!pop) return null;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const x = Math.max(8, Math.min(pop.x, vw - 340));
  const below = vh - pop.y > 300;
  let lastGroup = "";
  return (
    <div ref={box} role="listbox" className="doc-pop"
      style={below ? { left: x, top: pop.y } : { left: x, bottom: vh - pop.top + 4 }}>
      {list.length ? list.map((c, i) => {
        const head = c.group && c.group !== lastGroup ? c.group : "";
        lastGroup = c.group || lastGroup;
        return (
          <div key={c.id}>
            {head ? <div className="doc-pop-head">{head}</div> : null}
            <div role="option" aria-selected={i === pop.index} data-active={i === pop.index ? "1" : "0"}
              className="doc-pop-row" onMouseDown={e => { e.preventDefault(); onPick(c); }}>
              {c.swatch ? <span className="doc-pop-swatch" style={{ background: c.swatch }} /> : null}
              <span className="doc-pop-label">{c.label}</span>
              {c.hint ? <span className="doc-pop-hint">{c.hint}</span> : null}
            </div>
          </div>
        );
      }) : <div className="doc-pop-none">{pop.mode === "@" ? "Nothing in the library matches" : "No command matches"}</div>}
      <div className="doc-pop-foot">{pop.mode === "@" ? "/ for commands" : "@ to find something in the library"}</div>
    </div>
  );
}

// TEACH. The same day, one thing at a time: where you are, the words and the
// notes under them to read from, the slide the room sees, and what is next.
// Space or → goes forward and puts the next slide up; ← goes back; Escape
// leaves. It is the document read out, so what is planned is what is taught.
function TeachView({ steps, liveLabel, dismiss, classHref, onExit, ground }) {
  const startAt = () => {
    const live = steps.findIndex(s => s.label && s.label === liveLabel);
    if (live >= 0) return live;
    const next = steps.findIndex(s => s.next);
    return next >= 0 ? next : 0;
  };
  const [idx, setIdx] = useState(startAt);
  const at = Math.min(idx, Math.max(0, steps.length - 1));
  const cur = steps[at];
  const go = (i) => {
    const j = Math.max(0, Math.min(steps.length - 1, i));
    setIdx(j);
    if (steps[j] && j !== at) steps[j].go();
  };
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ([" ", "ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); go(at + 1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); go(at - 1); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); onExit(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });
  if (!cur) return <div className="teach-empty">Nothing on this day to teach yet.</div>;
  const live = !!cur.label && liveLabel === cur.label;
  const upNext = steps.slice(at + 1, at + 4);
  return (
    <div className="teach">
      <div className="teach-top">
        <span className="teach-where">{cur.section}{cur.time ? " · " + cur.time + " min" : ""}</span>
        <span className="teach-count">{at + 1} of {steps.length}</span>
      </div>
      <div className="teach-main">
        <div className="teach-words">
          <div className={"teach-title" + (cur.kind === "section" ? " is-section" : "")}>{cur.title}</div>
          {cur.body ? <div className="teach-body">{cur.body}</div> : null}
          {cur.notes.length ? (
            <ul className="teach-notes">{cur.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          ) : null}
        </div>
        <div className="teach-slide">
          {cur.cast ? <Slide big cast={cur.cast} config={{ path: classHref || "" }} ground={ground} live={live} label={cur.label}
            onClick={() => (live ? dismiss() : cur.go())} /> : null}
        </div>
      </div>
      <div className="teach-bar">
        <button className="dash-focus teach-btn" disabled={at === 0} onClick={() => go(at - 1)}>Previous</button>
        <button className="dash-focus teach-btn" onClick={() => (live ? dismiss() : cur.go())}>{live ? "Take off screen" : "Put on screen"}</button>
        <button className="dash-focus teach-btn strong" disabled={at >= steps.length - 1} onClick={() => go(at + 1)}>
          {steps[at + 1] ? "Next: " + steps[at + 1].title : "Next"}
        </button>
      </div>
      {upNext.length ? (
        <div className="teach-up">
          {upNext.map((s, i) => (
            <button key={s.key} className="dash-focus teach-uprow" onClick={() => go(at + 1 + i)}>
              <span className="teach-upkind">{s.kind === "section" ? "section" : s.kind === "note" ? "note" : "item"}</span>{s.title}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function DayDoc({
  sections, slotItems, named, firstMovable, blockOf, seedById, doneSet, nextId, pickedId,
  liveLabel, castItem, castSection, dismiss, features, hue, slidesOn, classHref, renderExtras,
  onSetSlotTitle, onSaveItem, onSaveBlock, onInsertRow, onRemoveItem, onNest, onTick, isAssigned, onToggleAssigned,
  onDeleteSection, onMoveSection, onEdit, drop, castLink, onMoveItem, onConvertRow, onLinkRow, library,
  onSetSlotTime, onPlaceSection, onSplitSection, classMinutes, onOpenTemplates, onOpenHistory, teach, onTeach,
  ground, assignments,
}) {
  const refs = useRef(new Map());
  const pending = useRef(null);
  const [menu, setMenu] = useState(null);
  const [over, setOver] = useState("");
  const [dragging, setDragging] = useState("");
  // A section being dragged. Held in a ref too, because a drag over an item
  // has to know, before the drop, that it should step aside for the section.
  const [secDrag, setSecDrag] = useState("");
  const secDragRef = useRef("");
  const [pop, setPop] = useState(null);
  const popList = useRef([]);
  const register = (id, api) => { if (api) refs.current.set(id, api); else refs.current.delete(id); };

  // Every line of the day, top to bottom, which is the order the arrows walk.
  const lines = [];
  const groupsBySection = sections.map(([slot, title], si) => {
    const items = normSlot(slotItems[slot]).items;
    lines.push({ key: "s:" + slot, kind: "section", slot, title, si });
    const groups = [];
    items.forEach((it, i) => {
      const blk = it.blockId ? blockOf(it.blockId) : null;
      const seed = it.seedId ? seedById(it.seedId) : null;
      const depth = (it.depth || 0) > 0 && groups.length ? 1 : 0;
      const line = { key: it.id, kind: depth ? "comment" : "item", slot, it, blk, seed, index: i };
      if (!depth) groups.push({ head: line, comments: [] });
      else groups[groups.length - 1].comments.push(line);
      lines.push(line);
      // A block's content reads straight on from its line.
      if (blk && (blk.body || "").trim() && blk.type !== "board") {
        lines.push({ key: "b:" + it.id, kind: "body", slot, it, blk });
      }
    });
    return { slot, title, si, groups, items };
  });

  // Each item's notes as words, for a slide that shows them.
  const notesOf = {};
  groupsBySection.forEach(sec => sec.groups.forEach(g => {
    notesOf[g.head.it.id] = g.comments.map(c => (c.it.feature || (c.blk ? c.blk.title : c.seed ? c.seed.title : c.it.text) || "").trim()).filter(Boolean);
  }));
  const indexOf = (key) => lines.findIndex(l => l.key === key);
  // Items are numbered down the day; notes are not, so they take no number.
  const itemNumber = {};
  lines.filter(l => l.kind === "item").forEach((l, n) => { itemNumber[l.it.id] = n + 1; });
  const focusLine = (key, pos) => {
    const line = refs.current.get(key);
    if (!line) { pending.current = { key, pos }; return; }
    line.focus(pos);
  };
  // A line made a moment ago is not in the document until the next render.
  useEffect(() => {
    if (pending.current && refs.current.get(pending.current.key)) {
      const { key, pos } = pending.current;
      pending.current = null;
      focusLine(key, pos);
    }
  });

  // The last line that belongs to an item: its last note, or the item itself.
  const endOfGroup = (slot, itemId) => {
    const items = normSlot(slotItems[slot]).items;
    const i = items.findIndex(x => x.id === itemId);
    let j = i;
    while (j + 1 < items.length && (items[j + 1].depth || 0) > 0) j++;
    return items[j]?.id || itemId;
  };

  const itemWords = (it, blk, seed) => it.feature || (blk ? blk.title : seed ? seed.title : it.text) || "";
  const isTyped = (line) => !!line.it && !line.it.blockId && !line.it.feature && !line.it.seedId && !(line.it.links || []).length;
  const leaveEmpty = (line) => (isTyped(line) && onRemoveItem ? () => onRemoveItem(line.slot, line.it.id) : null);
  const saveItemWords = (line) => (v) => {
    if (line.blk) onSaveBlock(line.blk.id, { title: v });
    else if (!line.seed && !line.it.feature) onSaveItem(line.slot, line.it.id, { text: v });
  };
  const tagOf = (slot) => normSlot(slotItems[slot]).title || (sections.find(([k]) => k === slot) || [])[1] || "";

  // What putting a line on the room screen sends, for an item or a note.
  const castLine = (line) => {
    const w = itemWords(line.it, line.blk, line.seed);
    const cl = line.it.claim || line.blk?.headline || "";
    const tag = tagOf(line.slot);
    const notes = line.kind === "item" && line.it.slideNotes ? (notesOf[line.it.id] || []) : undefined;
    const cast = slideOf({ item: line.it, block: line.blk, seed: line.seed, title: w, claim: cl, tag, features, notes, assignments });
    return { cast, label: cl || w, go: () => castItem(line.it, line.blk, line.seed, w, cl, tag, cast) };
  };

  const openMenu = (e, items) => {
    e.preventDefault();
    const x = Math.min(e.clientX, (typeof window !== "undefined" ? window.innerWidth : 1200) - 260);
    const tall = Math.min(420, 12 + items.filter(Boolean).length * 39);
    const y = Math.max(8, Math.min(e.clientY, (typeof window !== "undefined" ? window.innerHeight : 800) - tall - 8));
    setMenu({ at: { x, y }, items });
  };

  // ─── the slash menu ───
  //
  // Every command there is for a line, grouped, filtered by what is typed after
  // the slash. `rest` is the line's words once "/whatever" has come back out.
  const commandsFor = (line) => {
    const out = [];
    const add = (group, label, run, extra) => out.push({ id: group + ":" + label, group, label, run, ...(extra || {}) });
    if (line.kind === "section") {
      if (onInsertRow) add("Section", "Add item", () => focusLine(onInsertRow(line.slot, null, 0), 0));
      if (onMoveSection && !named.has(line.slot)) {
        add("Section", "Move up", () => onMoveSection(line.slot, -1));
        add("Section", "Move down", () => onMoveSection(line.slot, 1));
      }
      if (onDeleteSection && !named.has(line.slot)) add("Section", "Delete section", () => onDeleteSection(line.slot));
    } else {
      const typed = isTyped(line);
      const it = line.it;
      if (typed && onSplitSection) {
        add("Structure", "Section", (rest) => { const k = onSplitSection(line.slot, it.id, rest); if (k) focusLine("s:" + k, "end"); },
          { hint: "Make this line a section" });
      }
      if (line.kind === "comment" && onNest) add("Structure", "Item", () => onNest(line.slot, it.id, -1), { hint: "Make this line an item" });
      if (line.kind === "item" && line.index > 0 && onNest) add("Structure", "Note", () => onNest(line.slot, it.id, 1), { hint: "Make this line a note" });
      if (!it.feature && !line.seed && (line.blk || typed)) {
        allTypes().forEach(t => add("Kind", t.label, (rest) => {
          if (line.blk) onSaveBlock(line.blk.id, { type: t.id });
          else if (onConvertRow) onConvertRow(line.slot, it.id, t.id, rest);
        }, { hint: t.hint, swatch: hue(t.id), keys: t.id }));
      }
      if (typed) {
        Object.keys(features || {}).forEach(n => add("Activity", n, () => onSaveItem(line.slot, it.id, { feature: n, text: n }),
          { hint: features[n], swatch: hue("activity") }));
      }
      add("Screen", "Put on screen", () => castLine(line).go());
      if (line.kind === "item" && onSaveItem) {
        add("Screen", it.slideNotes ? "Hide notes on slide" : "Show notes on slide", () => onSaveItem(line.slot, it.id, { slideNotes: !it.slideNotes }));
      }
      if (line.kind === "comment" && onSaveItem) {
        add("Screen", it.slide ? "Remove slide" : "Create slide", () => onSaveItem(line.slot, it.id, { slide: !it.slide }));
      }
      add("Line", doneSet.has(it.id) ? "Mark not done" : "Mark done", () => onTick(it.id));
      if (onToggleAssigned && line.kind === "item") {
        add("Line", isAssigned(it) ? "Remove from readings" : "Add to readings", () => onToggleAssigned(it));
      }
      if (onEdit) add("Line", "Edit details", () => onEdit({ blockId: it.blockId, item: it, where: "", slot: line.slot, id: it.id }));
      if (onRemoveItem) add("Line", "Delete line", () => onRemoveItem(line.slot, it.id));
    }
    add("Day", "Teach", () => onTeach && onTeach(true), { hint: "One thing at a time, with the slide" });
    if (onOpenTemplates) add("Day", "Templates", () => onOpenTemplates(), { hint: "Save this day, or start from a template" });
    if (onOpenHistory) add("Day", "History", () => onOpenHistory(), { hint: "Earlier versions of this day" });
    return out;
  };

  const findInLibrary = (q) => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (library || [])
      .filter(b => {
        const hay = [b.title, b.source, b.headline, typeOf(b.type).label].filter(Boolean).join(" ").toLowerCase();
        return words.every(w => hay.includes(w));
      })
      .sort((a, b) => {
        const s = (x) => ((x.title || "").toLowerCase().startsWith(words[0] || "") ? 0 : 1);
        return s(a) - s(b) || (a.title || "").localeCompare(b.title || "");
      })
      .slice(0, 12)
      .map(b => ({
        id: "lib:" + b.id, group: typeOf(b.type).label, label: b.title || "Untitled",
        hint: b.source || hostOf(b.url), swatch: hue(b.type),
        run: (rest) => {
          const line = pop?.line;
          if (!line) return;
          if (line.kind !== "section" && isTyped(line) && !rest && onLinkRow) {
            onLinkRow(line.slot, line.it.id, b.id);
            focusLine(line.it.id, "end");
          } else if (onInsertRow) {
            const slot = line.slot;
            const after = line.kind === "section" ? null : line.kind === "item" ? endOfGroup(slot, line.it.id) : line.it.id;
            const depth = line.kind === "comment" ? 1 : 0;
            focusLine(onInsertRow(slot, after, depth, { blockId: b.id }), "end");
          }
        },
      }));
  };

  const filtered = (() => {
    if (!pop) return [];
    if (pop.mode === "@") return findInLibrary(pop.query);
    const words = pop.query.toLowerCase().split(/\s+/).filter(Boolean);
    return commandsFor(pop.line).filter(c => {
      const hay = (c.label + " " + c.group + " " + (c.hint || "") + " " + (c.keys || "")).toLowerCase();
      return words.every(w => hay.includes(w));
    });
  })();
  popList.current = filtered;

  const applyPop = (choice) => {
    const p = pop;
    setPop(null);
    if (!p || !choice) return;
    const rest = (p.text.slice(0, p.start) + p.text.slice(p.end)).replace(/\s+$/, "");
    const api = refs.current.get(p.key);
    if (api && rest !== p.text) api.setText(rest);
    choice.run(rest.trim());
  };

  // Called as a line is typed into: the markdown shortcuts, then / and @.
  const typing = (line) => (v, caret, el) => {
    if (line.kind === "item" || line.kind === "comment") {
      if (isTyped(line) && caret === 2 && v.startsWith("# ") && onSplitSection) {
        setPop(null);
        const k = onSplitSection(line.slot, line.it.id, v.slice(2).trim());
        if (k) focusLine("s:" + k, "end");
        return;
      }
      if (isTyped(line) && caret === 2 && (v.startsWith("- ") || v.startsWith("* ")) && line.kind === "item" && line.index > 0 && onNest) {
        setPop(null);
        refs.current.get(line.key)?.setText(v.slice(2));
        onNest(line.slot, line.it.id, 1);
        pending.current = { key: line.key, pos: 0 };
        return;
      }
    }
    const before = v.slice(0, caret);
    const at = Math.max(before.lastIndexOf("/"), before.lastIndexOf("@"));
    if (at >= 0 && (at === 0 || /\s/.test(before[at - 1]))) {
      const mode = before[at];
      const q = before.slice(at + 1);
      const ok = !q.includes("\n") && q.length <= 40 && !/^\s/.test(q) && !/\s{2}$/.test(q)
        && !(mode === "@" && line.kind === "section");
      if (ok) {
        const r = el.getBoundingClientRect();
        setPop(prev => ({
          mode, key: line.key, line, start: at, end: caret, query: q, text: v,
          index: prev && prev.key === line.key && prev.query === q ? prev.index : 0,
          x: r.left + 6, y: r.bottom + 4, top: r.top,
        }));
        return;
      }
    }
    if (pop) setPop(null);
  };

  const keyHandler = (line) => (e, el, flush) => {
    // The menu under the line has the arrows and Enter while it is open.
    if (pop && pop.key === line.key) {
      const list = popList.current;
      if (e.key === "ArrowDown") { e.preventDefault(); setPop({ ...pop, index: Math.min(list.length - 1, pop.index + 1) }); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setPop({ ...pop, index: Math.max(0, pop.index - 1) }); return; }
      if ((e.key === "Enter" || e.key === "Tab") && list.length) { e.preventDefault(); flush(el.value); applyPop(list[pop.index]); return; }
      if (e.key === "Escape") { e.preventDefault(); setPop(null); return; }
    }

    const at = el.selectionStart;
    const end = el.selectionEnd;
    const len = el.value.length;
    const i = indexOf(line.key);
    const col = at - (el.value.lastIndexOf("\n", at - 1) + 1);
    // One visual row: a line that has not wrapped and holds no break.
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 22;
    const oneRow = el.scrollHeight <= lh * 1.6;

    if (e.key === "ArrowUp" && !e.shiftKey && !e.altKey && i > 0) {
      const onTop = oneRow ? !el.value.slice(0, at).includes("\n") : at === 0;
      if (onTop) { e.preventDefault(); flush(el.value); focusLine(lines[i - 1].key, col); }
      return;
    }
    if (e.key === "ArrowDown" && !e.shiftKey && !e.altKey && i < lines.length - 1) {
      const onBottom = oneRow ? !el.value.slice(end).includes("\n") : end === len;
      if (onBottom) { e.preventDefault(); flush(el.value); focusLine(lines[i + 1].key, col); }
      return;
    }
    if (e.key === "ArrowLeft" && !e.shiftKey && at === 0 && end === 0 && i > 0) {
      e.preventDefault(); flush(el.value); focusLine(lines[i - 1].key, "end"); return;
    }
    if (e.key === "ArrowRight" && !e.shiftKey && at === len && i < lines.length - 1) {
      e.preventDefault(); flush(el.value); focusLine(lines[i + 1].key, 0); return;
    }

    // Alt+↑ and Alt+↓ move a note one line, or a section one place. Past its
    // own item a note becomes a note on the item next to it. The cursor stays
    // where it was in the text.
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      const dir = e.key === "ArrowUp" ? -1 : 1;
      if (line.kind === "comment" && onMoveItem) {
        e.preventDefault(); flush(el.value);
        onMoveItem(line.slot, line.it.id, dir);
        pending.current = { key: line.key, pos: at };
        return;
      }
      if (line.kind === "section" && onMoveSection && !named.has(line.slot)) {
        e.preventDefault(); flush(el.value);
        onMoveSection(line.slot, dir);
        pending.current = { key: line.key, pos: at };
        return;
      }
    }

    // ⌘/Ctrl+Enter ticks a line done, or back.
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && line.it) {
      e.preventDefault(); flush(el.value); onTick(line.it.id); return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      flush(el.value);
      if (!onInsertRow) return;
      if (line.kind === "section") {
        focusLine(onInsertRow(line.slot, null, 0), 0);
      } else if (line.kind === "item") {
        focusLine(onInsertRow(line.slot, endOfGroup(line.slot, line.it.id), 0), 0);
      } else if (line.kind === "body") {
        // The first note, directly under the content.
        focusLine(onInsertRow(line.slot, line.it.id, 1), 0);
      } else if (line.kind === "comment") {
        if (!el.value.trim() && onNest) { onNest(line.slot, line.it.id, -1); return; }
        focusLine(onInsertRow(line.slot, line.it.id, 1), 0);
      }
      return;
    }

    if (e.key === "Tab" && onNest && (line.kind === "item" || line.kind === "comment")) {
      e.preventDefault();
      flush(el.value);
      if (!e.shiftKey && line.kind === "item" && line.index > 0) onNest(line.slot, line.it.id, 1);
      if (e.shiftKey && line.kind === "comment") onNest(line.slot, line.it.id, -1);
      pending.current = { key: line.key, pos: at };
      return;
    }

    if (e.key === "Backspace" && at === 0 && end === 0 && !el.value && i > 0) {
      // An empty typed line goes. A line with a block behind it, or a section,
      // is only left: deleting a block's title would not delete the block.
      const typed = (line.kind === "item" || line.kind === "comment") && isTyped(line);
      e.preventDefault();
      const prev = lines[i - 1].key;
      if (typed && onRemoveItem) onRemoveItem(line.slot, line.it.id);
      focusLine(prev, "end");
    }
  };

  // Pressing a link in a line asks what to do with it, the way a document
  // does: put the page on the room screen, open it here, or edit the line.
  const linkMenu = (key) => (url, e) => {
    const name = hostOf(url) || "link";
    const live = liveLabel === name;
    openMenu(e, [
      live ? ["Take off screen", () => dismiss()] : ["Put on screen", () => castLink && castLink(url, name)],
      ["Open in new tab", () => { if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer"); }],
      ["Edit", () => focusLine(key, "end")],
    ]);
  };

  // The kinds, to choose from by pressing the kind on a line. A typed line has
  // no block behind it, so choosing a kind for one makes it a block of that kind.
  const kindMenu = (line) => {
    const current = line.blk ? line.blk.type : "";
    return allTypes().map(t => [(t.id === current ? "✓ " : "") + t.label, () => {
      if (t.id === current) return;
      if (line.blk) onSaveBlock(line.blk.id, { type: t.id });
      else if (onConvertRow) onConvertRow(line.slot, line.it.id, t.id);
    }]);
  };

  const itemMenu = (line) => {
    const { it, slot } = line;
    const done = doneSet.has(it.id);
    return [
      [done ? "Mark not done" : "Mark done", () => onTick(it.id)],
      // His notes on the slide, or not, item by item.
      line.kind === "item" && onSaveItem ? [it.slideNotes ? "Hide notes on slide" : "Show notes on slide", () => onSaveItem(slot, it.id, { slideNotes: !it.slideNotes })] : null,
      ["Put on screen", () => castLine(line).go()],
      onEdit ? ["Edit details", () => onEdit({ blockId: it.blockId, item: it, where: "", slot, id: it.id })] : null,
      line.kind === "item" && line.index > 0 && onNest ? ["Make note", () => onNest(slot, it.id, 1)] : null,
      line.kind === "comment" && onNest ? ["Make item", () => onNest(slot, it.id, -1)] : null,
      // A note has no slide of its own unless you give it one.
      line.kind === "comment" && onSaveItem ? [it.slide ? "Remove slide" : "Create slide", () => onSaveItem(slot, it.id, { slide: !it.slide })] : null,
      onToggleAssigned && line.kind === "item" ? [isAssigned(it) ? "Remove from readings" : "Add to readings", () => onToggleAssigned(it)] : null,
      ["Remove from day", () => onRemoveItem(slot, it.id), true],
    ];
  };
  const sectionMenu = (sec) => {
    const mine = !named.has(sec.slot);
    return [
      mine && sec.si > firstMovable && onMoveSection ? ["Move up", () => onMoveSection(sec.slot, -1)] : null,
      mine && sec.si < sections.length - 1 && onMoveSection ? ["Move down", () => onMoveSection(sec.slot, 1)] : null,
      onInsertRow ? ["Add item", () => focusLine(onInsertRow(sec.slot, null, 0), 0)] : null,
      mine && onDeleteSection ? ["Delete section", () => onDeleteSection(sec.slot), true] : null,
    ];
  };

  // The slide column beside a line or a group. More than one slide stacks: an
  // item's own, then one for each of its notes that was given a slide.
  const slideCell = (cast, live, label, onClick, more) => (slidesOn ? (
    <div className="doc-slide">
      {cast ? <Slide cast={cast} config={{ path: classHref || "" }} ground={ground} live={live} label={label} onClick={onClick} /> : null}
      {(more || []).map(s => (
        <Slide key={s.key} cast={s.cast} config={{ path: classHref || "" }} ground={ground} live={s.live} label={s.label} onClick={s.onClick} />
      ))}
    </div>
  ) : null);

  // Rows and notes step aside while a section is being dragged, so the drop
  // lands on the section they are in.
  const dragProps = (slot, beforeId) => ({
    onDragOver: (e) => { if (secDragRef.current) return; e.preventDefault(); e.stopPropagation(); setOver(slot + "|" + (beforeId || "")); },
    onDragLeave: () => setOver(""),
    onDrop: (e) => { if (secDragRef.current) return; e.preventDefault(); e.stopPropagation(); setOver(""); drop(e, slot, beforeId); },
  });
  // A note is a drop target in two halves: the top half puts the dragged line
  // above it, the bottom half below.
  const commentDrop = (slot, id) => {
    const half = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      return e.clientY > r.top + r.height / 2 ? "below" : "above";
    };
    const nextAfter = () => {
      const items = normSlot(slotItems[slot]).items;
      const i = items.findIndex(x => x.id === id);
      return i >= 0 && i + 1 < items.length ? items[i + 1].id : null;
    };
    return {
      onDragOver: (e) => { if (secDragRef.current) return; e.preventDefault(); e.stopPropagation(); setOver(slot + "|" + id + "|" + half(e)); },
      onDragLeave: () => setOver(""),
      onDrop: (e) => {
        if (secDragRef.current) return;
        e.preventDefault(); e.stopPropagation(); setOver("");
        drop(e, slot, half(e) === "below" ? nextAfter() : id);
      },
    };
  };
  // A section dropped on a section: the top half puts it above, the bottom half below.
  const sectionDrop = (slot) => {
    const half = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      return e.clientY > r.top + r.height / 2 ? "below" : "above";
    };
    return {
      onDragOver: (e) => {
        e.preventDefault();
        if (secDragRef.current) setOver("sec|" + slot + "|" + half(e));
        else setOver(slot + "|");
      },
      onDragLeave: () => setOver(""),
      onDrop: (e) => {
        e.preventDefault();
        setOver("");
        const moving = secDragRef.current;
        if (moving) {
          secDragRef.current = ""; setSecDrag("");
          if (moving === slot) return;
          const keys = sections.map(([k]) => k).filter(k => k !== moving);
          const i = keys.indexOf(slot);
          const before = half(e) === "above" ? slot : (keys[i + 1] || null);
          if (onPlaceSection) onPlaceSection(moving, before);
          return;
        }
        drop(e, slot, null);
      },
    };
  };

  // ─── teach ───
  if (teach) {
    const steps = [];
    groupsBySection.forEach(sec => {
      const raw = normSlot(slotItems[sec.slot]).title || "";
      const time = normSlot(slotItems[sec.slot]).time || "";
      if (raw) {
        steps.push({ key: "s:" + sec.slot, kind: "section", section: raw, time, title: raw, notes: [], label: raw,
          cast: castSection(sec.slot, raw, false), go: () => castSection(sec.slot, raw, true) });
      }
      sec.groups.forEach(g => {
        const c = castLine(g.head);
        steps.push({
          key: g.head.it.id, kind: "item", section: raw || sec.title, time, next: nextId === g.head.it.id,
          title: c.label, body: g.head.blk?.type !== "board" ? (g.head.blk?.body || "") : "",
          notes: g.comments.map(n => itemWords(n.it, n.blk, n.seed)).filter(x => x.trim()),
          cast: c.cast, label: c.label, go: c.go,
        });
        g.comments.filter(n => n.it.slide).forEach(n => {
          const nc = castLine(n);
          steps.push({ key: n.it.id, kind: "note", section: raw || sec.title, time, title: nc.label, notes: [],
            cast: nc.cast, label: nc.label, go: nc.go });
        });
      });
    });
    return <TeachView steps={steps} liveLabel={liveLabel} dismiss={dismiss} classHref={classHref} ground={ground} onExit={() => onTeach && onTeach(false)} />;
  }

  // What the day adds up to, from every section given a time.
  const times = sections.map(([k]) => normSlot(slotItems[k]).time || "");
  const total = sumRanges(times);
  const untimed = times.filter(t => !parseRange(t)).length;

  return (
    <div className="doc">
      {total.n ? (
        <div className={"doc-total" + (classMinutes && total.lo > classMinutes ? " over" : "")}>
          <span className="doc-total-n">{rangeLabel(total)} min</span>
          {classMinutes ? <span> planned of {classMinutes}</span> : <span> planned</span>}
          {untimed ? <span className="doc-total-more"> · {untimed} {untimed === 1 ? "section" : "sections"} without a time</span> : null}
        </div>
      ) : null}

      {groupsBySection.map(sec => {
        const bucket = normSlot(slotItems[sec.slot]);
        const raw = bucket.title || "";
        const secLive = !!raw && liveLabel === raw;
        const overHere = over.startsWith("sec|" + sec.slot + "|") ? over.split("|")[2] : "";
        return (
          <div key={sec.slot} className={"doc-sec" + (secDrag === sec.slot ? " dragging" : "")}
            data-over={over === sec.slot + "|" ? "1" : "0"} data-secover={overHere} {...sectionDrop(sec.slot)}>
            <div className={"doc-group" + (slidesOn ? " with-slides" : "")}>
              <div className="doc-text doc-secline" onContextMenu={e => openMenu(e, sectionMenu(sec))}>
                {!named.has(sec.slot) && onPlaceSection ? (
                  <span className="doc-grip doc-secgrip" draggable title="Drag to move this section" aria-hidden="true"
                    onDragStart={e => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", JSON.stringify({ section: sec.slot }));
                      secDragRef.current = sec.slot; setSecDrag(sec.slot);
                    }}
                    onDragEnd={() => { secDragRef.current = ""; setSecDrag(""); setOver(""); }}>⠿</span>
                ) : null}
                <Line id={"s:" + sec.slot} value={raw} placeholder={sec.title || "Section"} className="lv-section"
                  onSave={v => onSetSlotTitle(sec.slot, v.trim())} onKey={keyHandler(lines[indexOf("s:" + sec.slot)])} register={register}
                  onType={typing(lines[indexOf("s:" + sec.slot)])} onLeave={(k) => { if (pop && pop.key === k) setPop(null); }} />
                {onSetSlotTime ? (
                  <input key={sec.slot + "|" + (bucket.time || "")} className="doc-time" defaultValue={bucket.time || ""}
                    placeholder="5-10 min" aria-label="Minutes for this section"
                    data-bad={bucket.time && !parseRange(bucket.time) ? "1" : "0"}
                    onBlur={e => { const v = e.target.value.trim(); if (v !== (bucket.time || "")) onSetSlotTime(sec.slot, v); }}
                    onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
                ) : null}
              </div>
              {slideCell(raw ? castSection(sec.slot, raw, false) : null, secLive, raw,
                () => (secLive ? dismiss() : castSection(sec.slot, raw, true)))}
            </div>

            {sec.groups.map(g => {
              const { it, blk, seed } = g.head;
              const words = itemWords(it, blk, seed);
              const claim = it.claim || blk?.headline || "";
              const tag = raw || sec.title;
              const slide = slideOf({ item: it, block: blk, seed, title: words, claim, tag, features, assignments,
                notes: it.slideNotes ? (notesOf[it.id] || []) : undefined });
              const live = liveLabel === (claim || words) || (it.feature && liveLabel === it.feature);
              const kind = it.feature ? "activity" : blk ? typeOf(blk.type).label.toLowerCase() : seed ? "seed" : "";
              const kindColor = it.feature ? hue("activity") : blk ? hue(blk.type) : hue("note");
              const kids = blk?.type === "set" ? (blk.children || []).map(id => blockOf(id)).filter(Boolean) : null;
              const bodyLine = lines.find(l => l.key === "b:" + it.id);
              const noteSlides = g.comments.filter(c => c.it.slide).map(c => {
                const nc = castLine(c);
                const on = liveLabel === nc.label;
                return { key: c.it.id, cast: nc.cast, live: on, label: nc.label, onClick: () => (on ? dismiss() : nc.go()) };
              });
              const canKind = !seed && !it.feature;
              const leave = (k) => { if (pop && pop.key === k) setPop(null); };
              return (
                <div key={it.id} className={"doc-group" + (slidesOn ? " with-slides" : "") + (pickedId === it.id ? " picked" : "")
                  + (nextId === it.id ? " next" : "")} data-over={over === sec.slot + "|" + it.id ? "1" : "0"} {...dragProps(sec.slot, it.id)}>
                  <div className="doc-text">
                    <div className="doc-row" draggable
                      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", JSON.stringify({ slot: sec.slot, id: it.id })); }}
                      onContextMenu={e => openMenu(e, itemMenu(g.head))}>
                      <button className="dash-focus doc-num" title="Drag to move, click for more"
                        onClick={e => { const r = e.currentTarget.getBoundingClientRect(); openMenu({ preventDefault() {}, clientX: r.left, clientY: r.bottom + 4 }, itemMenu(g.head)); }}>
                        {doneSet.has(it.id) ? "✓" : itemNumber[it.id] || ""}
                      </button>
                      <Line id={it.id} value={words} placeholder="Item, or / for commands" className="lv-item" done={doneSet.has(it.id)}
                        readOnly={!!(seed || it.feature)} onSave={saveItemWords(g.head)} onKey={keyHandler(g.head)} register={register}
                        onLeaveEmpty={leaveEmpty(g.head)} onLink={linkMenu(it.id)} onType={typing(g.head)} onLeave={leave} />
                      {canKind ? (
                        <button className="dash-focus doc-kind" style={{ "--ink": inkOf(kindColor) }} title="Choose kind"
                          onClick={e => { const r = e.currentTarget.getBoundingClientRect(); openMenu({ preventDefault() {}, clientX: r.left, clientY: r.bottom + 4 }, kindMenu(g.head)); }}>
                          {kind || typeOf("note").label.toLowerCase()} <span aria-hidden="true">▾</span>
                        </button>
                      ) : kind ? <span className="doc-kind" style={{ "--ink": inkOf(kindColor) }}>{kind}</span> : null}
                      <LinkChips urls={[blk?.url, ...(it.links || []).map(l => l.url)]}
                        liveLabel={liveLabel} onCast={castLink} dismiss={dismiss} />
                      {live ? <button className="dash-focus doc-down" onClick={dismiss} title="Take off screen">On screen ×</button> : null}
                    </div>

                    {bodyLine ? (
                      <div className="doc-row doc-under">
                        <Line id={bodyLine.key} value={blk.body} placeholder="Content" className="lv-comment"
                          onSave={v => onSaveBlock(blk.id, { body: v })} onKey={keyHandler(bodyLine)} register={register}
                          onLink={linkMenu(bodyLine.key)} onType={typing(bodyLine)} onLeave={leave} />
                      </div>
                    ) : null}
                    {blk && renderExtras ? renderExtras(blk, kids) : null}

                    {g.comments.map(c => {
                      const cBody = lines.find(l => l.key === "b:" + c.it.id);
                      return (
                        <div key={c.it.id} className={"doc-comment" + (dragging === c.it.id ? " dragging" : "")}
                          data-over={over.startsWith(sec.slot + "|" + c.it.id + "|") ? over.split("|")[2] : ""}
                          onContextMenu={e => openMenu(e, itemMenu(c))} {...commentDrop(sec.slot, c.it.id)}>
                          <div className="doc-row doc-under doc-commentrow">
                            {/* The handle. A note is all text box, and a press on a
                                text box selects words, so the drag needs somewhere
                                that is not text. Alt+↑ and Alt+↓ move it too. */}
                            <span className="doc-grip" draggable title="Drag to move this note" aria-hidden="true"
                              onDragStart={e => {
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", JSON.stringify({ slot: sec.slot, id: c.it.id }));
                                setDragging(c.it.id);
                              }}
                              onDragEnd={() => setDragging("")}>⠿</span>
                            <Line id={c.it.id} value={itemWords(c.it, c.blk, c.seed)} placeholder="Note" className="lv-comment"
                              done={doneSet.has(c.it.id)} readOnly={!!(c.seed || c.it.feature)}
                              onSave={saveItemWords(c)} onKey={keyHandler(c)} register={register} onLeaveEmpty={leaveEmpty(c)}
                              onLink={linkMenu(c.it.id)} onType={typing(c)} onLeave={leave} />
                            <LinkChips urls={[c.blk?.url, ...(c.it.links || []).map(l => l.url)]}
                              liveLabel={liveLabel} onCast={castLink} dismiss={dismiss} />
                          </div>
                          {cBody ? (
                            <div className="doc-row doc-under">
                              <Line id={cBody.key} value={c.blk.body} placeholder="Content" className="lv-comment lv-body"
                                onSave={v => onSaveBlock(c.blk.id, { body: v })} onKey={keyHandler(cBody)} register={register}
                                onLink={linkMenu(cBody.key)} onType={typing(cBody)} onLeave={leave} />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  {slideCell(slide, !!live, claim || words, () => (live ? dismiss() : castItem(it, blk, seed, words, claim, tag, slide)), noteSlides)}
                </div>
              );
            })}
          </div>
        );
      })}
      <Menu at={menu?.at} items={menu?.items || []} onClose={() => setMenu(null)} />
      <Pop pop={pop} list={filtered} onPick={applyPop} />
    </div>
  );
}

export const DOC_CSS = `
/* THE DAY AS A DOCUMENT. Three sizes of text and nothing else: a section is a
   heading, an item is a line, a note is quieter and set in. Every line is a
   text box that looks like text until the cursor is in it. */
.doc{display:flex;flex-direction:column}
.doc-total{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 4px;padding:6px 2px 0;font-family:var(--font-body);font-size:14px;color:var(--text-secondary)}
.doc-total-n{font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums}
.doc-total.over .doc-total-n{color:var(--state-live)}
.doc-total-more{color:var(--text-muted)}
.doc-sec{display:flex;flex-direction:column;padding-top:18px;border-radius:10px}
.doc-sec[data-over="1"]{background:rgba(23,19,16,.035)}
.doc-sec[data-secover="above"]{box-shadow:inset 0 3px 0 var(--dash-accent)}
.doc-sec[data-secover="below"]{box-shadow:inset 0 -3px 0 var(--dash-accent)}
.doc-sec.dragging{opacity:.45}
.doc-text.doc-secline{position:relative;flex-direction:row;align-items:flex-start;gap:6px}
.doc-secline .doc-line{flex:1 1 auto}
.doc-secgrip{position:absolute;left:-20px;top:9px}
.doc-sec:hover .doc-secgrip,.doc-secline:focus-within .doc-secgrip{opacity:1}
.doc-time{flex:none;align-self:center;width:88px;min-height:32px;box-sizing:border-box;padding:0 9px;border:1px solid transparent;border-radius:8px;
  background:none;font-family:var(--font-body);font-size:14px;color:var(--text-secondary);text-align:right;font-variant-numeric:tabular-nums}
.doc-time::placeholder{color:var(--text-muted)}
.doc-time:hover{border-color:var(--line-strong)}
.doc-time:focus{outline:none;border-color:var(--dash-accent);background:#fff;color:var(--text-primary)}
.doc-time[data-bad="1"]{color:var(--state-live)}
.doc-group{display:grid;grid-template-columns:minmax(0,1fr);column-gap:18px;align-items:start;border-radius:8px}
.doc-group.with-slides{grid-template-columns:minmax(0,1fr) 200px}
.doc-group[data-over="1"]{box-shadow:inset 0 2px 0 var(--dash-accent)}
.doc-group.picked .doc-num{color:var(--dash-accent);font-weight:600}
.doc-text{min-width:0;display:flex;flex-direction:column;padding:2px 0}
.doc-slide{display:flex;flex-direction:column;align-items:flex-end;gap:8px;padding:4px 0}
.doc-row{display:flex;align-items:flex-start;gap:6px;min-width:0}
.doc-under{padding-left:58px}
.doc-comment{display:flex;flex-direction:column}
.doc-under .flow-block{padding-left:6px;margin-top:0}
.doc-under:empty{display:none}
.lv-body{color:var(--text-muted)}
.doc-num{flex:none;width:30px;min-height:30px;margin-top:1px;border:none;background:none;border-radius:7px;cursor:grab;padding:0;
  font-family:var(--font-label);font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.doc-num:hover{background:rgba(23,19,16,.06);color:var(--text-primary)}
.doc-group.next .doc-num{color:var(--dash-accent);font-weight:600}
.doc-line{flex:1 1 auto;min-width:0;display:block;width:100%;box-sizing:border-box;resize:none;overflow:hidden;field-sizing:content;
  border:none;outline:none;background:transparent;border-radius:6px;padding:3px 6px;margin:0;
  font-family:var(--font-body);color:var(--text-primary)}
.doc-line:hover{background:rgba(23,19,16,.03)}
.doc-line:focus{background:rgba(23,19,16,.045)}
.doc-line::placeholder{color:var(--text-muted)}
.doc-line[readonly]{cursor:default}
.doc-line.done{text-decoration:line-through;text-decoration-thickness:1.5px;color:var(--text-muted)}
.lv-section{font-size:21px;font-weight:600;letter-spacing:-.015em;line-height:1.3}
.lv-item{font-size:16px;font-weight:500;line-height:1.45}
.lv-comment{font-size:15px;font-weight:400;line-height:1.5;color:var(--text-secondary)}
.doc-kind{flex:none;align-self:center;font-family:var(--font-label);font-size:13px;color:var(--ink,var(--text-muted));white-space:nowrap}
button.doc-kind{min-height:28px;padding:0 8px;border:none;border-radius:7px;background:none;cursor:pointer}
button.doc-kind span{font-size:9px;opacity:.6}
button.doc-kind:hover{background:rgba(23,19,16,.06)}
/* A line showing its links: the same text, set the same way, with the web
   address as a link you can press. */
.doc-linetext{cursor:text;white-space:pre-wrap;overflow-wrap:anywhere}
.doc-inlink{color:var(--dash-accent);text-decoration:underline;text-underline-offset:2px;cursor:pointer}
/* A link: its site name puts the page on the room screen, the arrow opens it
   here. One pill, two halves. */
.doc-link{flex:none;align-self:center;display:inline-flex;align-items:stretch;border-radius:999px;background:var(--surface-sunk);
  overflow:hidden;max-width:220px}
.doc-link-go{min-height:28px;padding:0 4px 0 10px;border:none;background:none;cursor:pointer;font-family:var(--font-body);
  font-size:13px;font-weight:600;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.doc-link-go:hover{color:var(--dash-accent)}
.doc-link-open{display:inline-flex;align-items:center;padding:0 9px 0 5px;font-size:13px;color:var(--text-muted);text-decoration:none}
.doc-link-open:hover{color:var(--text-primary)}
.doc-link.live{background:var(--state-live)}
.doc-link.live .doc-link-go,.doc-link.live .doc-link-open{color:#fff}
/* A handle: quiet until its line is under the pointer. */
.doc-commentrow{position:relative}
.doc-grip{position:absolute;left:36px;top:5px;width:18px;height:24px;display:inline-flex;align-items:center;justify-content:center;
  font-size:13px;color:var(--text-muted);cursor:grab;border-radius:5px;opacity:0;user-select:none}
.doc-comment:hover .doc-grip,.doc-comment:focus-within .doc-grip{opacity:1}
.doc-grip:hover{background:rgba(23,19,16,.06);color:var(--text-primary)}
.doc-comment.dragging{opacity:.45}
.doc-comment[data-over="above"]{box-shadow:inset 0 2px 0 var(--dash-accent)}
.doc-comment[data-over="below"]{box-shadow:inset 0 -2px 0 var(--dash-accent)}
.doc-down{flex:none;align-self:center;min-height:28px;padding:0 9px;border:none;border-radius:999px;cursor:pointer;
  background:var(--state-live);color:#fff;font-family:var(--font-label);font-size:13px;font-weight:600}
.doc-veil{position:fixed;inset:0;z-index:80}
.doc-menu{position:fixed;z-index:81;min-width:230px;max-height:420px;overflow-y:auto;background:#fff;border:1px solid rgba(23,19,16,.14);
  border-radius:12px;padding:5px;box-shadow:0 16px 38px -12px rgba(23,19,16,.42);display:flex;flex-direction:column;gap:1px}
.doc-menu button{display:flex;align-items:center;width:100%;text-align:left;background:none;border:none;cursor:pointer;
  padding:0 10px;min-height:38px;border-radius:8px;font-family:var(--font-body);font-size:14px;color:var(--text-primary)}
.doc-menu button:hover{background:rgba(23,19,16,.05)}
.doc-menu button.danger{color:var(--state-live)}
/* The / and @ menu, under the line being typed in. */
.doc-pop{position:fixed;z-index:82;width:330px;max-height:360px;overflow-y:auto;background:#fff;border:1px solid rgba(23,19,16,.14);
  border-radius:12px;padding:5px;box-shadow:0 18px 40px -12px rgba(23,19,16,.45);font-family:var(--font-body)}
.doc-pop-head{padding:8px 10px 3px;font-family:var(--font-label);font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.doc-pop-row{display:flex;align-items:center;gap:9px;min-height:38px;padding:3px 10px;border-radius:8px;cursor:pointer}
.doc-pop-row[data-active="1"]{background:rgba(23,19,16,.07)}
.doc-pop-swatch{flex:none;width:3px;height:20px;border-radius:2px}
.doc-pop-label{flex:none;font-size:14px;color:var(--text-primary);max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.doc-pop-hint{flex:1 1 auto;min-width:0;font-size:13px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.doc-pop-none{padding:12px 10px;font-size:14px;color:var(--text-muted)}
.doc-pop-foot{margin-top:4px;padding:7px 10px 4px;border-top:1px solid var(--line-soft);font-size:13px;color:var(--text-muted)}
/* TEACH */
.teach{display:flex;flex-direction:column;gap:16px;padding-top:26px;font-family:var(--font-body)}
.teach-empty{padding:30px 4px;font-size:15px;color:var(--text-muted)}
.teach-top{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.teach-where{font-family:var(--font-label);font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dash-accent)}
.teach-count{margin-left:auto;font-size:14px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.teach-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,46%);gap:24px;align-items:start}
.teach-words{min-width:0;display:flex;flex-direction:column;gap:12px}
.teach-title{font-size:30px;font-weight:600;letter-spacing:-.02em;line-height:1.2;color:var(--text-primary)}
.teach-title.is-section{font-size:34px}
.teach-body{font-size:17px;line-height:1.55;color:var(--text-secondary);white-space:pre-wrap;max-width:62ch}
.teach-notes{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px;font-size:17px;line-height:1.5;color:var(--text-primary)}
.teach-slide{min-width:0}
.teach-bar{display:flex;gap:8px;flex-wrap:wrap}
.teach-btn{min-height:44px;padding:0 16px;border-radius:11px;border:1px solid var(--line-strong);background:#fff;cursor:pointer;
  font-family:var(--font-body);font-size:15px;font-weight:600;color:var(--text-primary);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.teach-btn.strong{margin-left:auto;background:var(--dash-accent);border-color:var(--dash-accent);color:#fff}
.teach-btn:disabled{opacity:.45;cursor:default}
.teach-up{display:flex;flex-direction:column;border-top:1px solid var(--line-soft);padding-top:8px}
.teach-uprow{display:flex;align-items:baseline;gap:10px;min-height:38px;padding:0 6px;border:none;background:none;border-radius:8px;cursor:pointer;
  text-align:left;font-family:var(--font-body);font-size:15px;color:var(--text-secondary)}
.teach-uprow:hover{background:rgba(23,19,16,.04);color:var(--text-primary)}
.teach-upkind{flex:none;width:58px;font-family:var(--font-label);font-size:13px;color:var(--text-muted)}
@media (max-width:1100px){.doc-group.with-slides{grid-template-columns:minmax(0,1fr) 150px}.teach-main{grid-template-columns:minmax(0,1fr)}}
`;
