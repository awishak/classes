// The day as a document you type into.
//
// Three levels, like headings in a document: a SECTION, an ITEM under it (an
// item, an activity, an article, a game), and NOTES under an item. Every line
// is text you can put the cursor in, and the keys move the way a document does:
//
//   ↑ ↓        the line above or below, from the top or bottom of this one
//   ← →        at the very start or end of a line, into the next one
//   Alt+↑ ↓    a note, moved one line
//   Enter      a new line below: an item after a section or an item, a note
//              after a note. An empty note becomes an item instead.
//   Shift+Enter a line break inside this line
//   Tab        an item becomes a note on the item above it
//   Shift+Tab  a note becomes an item
//   Backspace  on an empty line, deletes it and goes to the end of the one above
//
// Sections and items each have a slide beside them; notes do not. A block's
// content is a note-level line under its item, edited the same way.
//
// On the words. Andrew renamed both on 2026-09-14: the kind that was called
// Note is called Item, and what were called comments are called notes. The
// code still says "comment" for the third level (kind: "comment", lv-comment,
// doc-comment) and the kind's id is still "note", because those are names in
// the store and the stylesheet, not words on the screen.
//
// This replaced the section headers with numerals, colours, tallies, move
// arrows and fold buttons, and the rows with their own editors. Andrew: remove
// section fanciness, and let me go freely between them as if it's a Google Doc.
// What sections did with buttons is on a right-click now.

import { useEffect, useRef, useState } from "react";
import Slide, { slideOf } from "./Slide.jsx";
import { typeOf, allTypes } from "./blocks.js";
import { normSlot } from "./dayplan.js";
import { inkOf } from "./colors.js";

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

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
function Line({ id, value, placeholder, readOnly, className, onSave, onKey, register, onFocusLine, done, onLeaveEmpty, onLink }) {
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
  const focusAt = (pos) => {
    const el = box.current;
    if (!el) { want.current = pos == null ? "end" : pos; setEditing(true); return; }
    el.focus();
    const p = pos === "end" || pos == null ? el.value.length : Math.min(pos, el.value.length);
    try { el.setSelectionRange(p, p); } catch { /* read-only lines */ }
  };
  useEffect(() => { register(id, { focus: focusAt }); });
  useEffect(() => () => register(id, null), [id]);
  useEffect(() => {
    if (want.current != null && box.current) { const p = want.current; want.current = null; focusAt(p); }
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  const flush = (v) => {
    clearTimeout(timer.current);
    if (!readOnly && v !== (value || "")) onSave(v);
  };

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
      }}
      onFocus={e => {
        focused.current = true;
        setEditing(true);
        // The row around this line is draggable; a drag started inside a text
        // box is a text selection, not a move.
        const row = e.currentTarget.closest('[draggable="true"]');
        if (row) { row.setAttribute("draggable", "false"); row.dataset.held = "1"; }
        if (onFocusLine) onFocusLine(id);
      }}
      onBlur={e => {
        focused.current = false;
        const row = e.currentTarget.closest('[data-held="1"]');
        if (row) { row.setAttribute("draggable", "true"); delete row.dataset.held; }
        flush(e.currentTarget.value);
        setEditing(false);
        // A typed line left empty is a line nobody wrote. Pressing Enter and
        // then moving away leaves nothing behind on the day.
        if (onLeaveEmpty && !e.currentTarget.value.trim()) onLeaveEmpty();
      }}
      onKeyDown={e => { if (!e.nativeEvent.isComposing) onKey(e, e.currentTarget, flush); }} />
  );
}

// The web addresses in a line of text.
const URLS = /https?:\/\/[^\s<>"')]+/g;
export const urlsIn = (text) => (String(text || "").match(URLS) || []);

// A link on a line: press the name and the page goes up on the room screen;
// press ↗ and it opens in a tab here instead. Press the name again while it
// is up to take it down. A web address typed or pasted into any line becomes
// one of these once the line saves.
function LinkChips({ urls, liveLabel, onCast, dismiss }) {
  const list = [...new Set((urls || []).filter(Boolean))];
  if (!list.length) return null;
  return list.map(u => {
    const name = hostOf(u) || "link";
    const live = liveLabel === name;
    return (
      <span key={u} className={"doc-link" + (live ? " live" : "")}>
        <button className="dash-focus doc-link-go" title={live ? "Take it back down" : "Put " + name + " on the room screen"}
          onClick={() => (live ? dismiss() : onCast && onCast(u, name))}>{live ? name + " · on screen" : name}</button>
        <a className="dash-focus doc-link-open" href={u} target="_blank" rel="noopener noreferrer" aria-label={"Open " + name + " in a new tab"}>↗</a>
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

export default function DayDoc({
  sections, slotItems, named, firstMovable, blockOf, seedById, doneSet, numberOf, nextId, pickedId,
  liveLabel, castItem, castSection, dismiss, features, hue, slidesOn, classHref, renderExtras,
  onSetSlotTitle, onSaveItem, onSaveBlock, onInsertRow, onRemoveItem, onNest, onTick, isAssigned, onToggleAssigned,
  onDeleteSection, onMoveSection, onEdit, drop, castLink, onMoveItem, onConvertRow,
}) {
  const refs = useRef(new Map());
  const pending = useRef(null);
  const [menu, setMenu] = useState(null);
  const [over, setOver] = useState("");
  const [dragging, setDragging] = useState("");
  const register = (id, el) => { if (el) refs.current.set(id, el); else refs.current.delete(id); };

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
      if (!depth) {
        groups.push({ head: line, comments: [] });
        lines.push(line);
        // A block's content is written like a comment, straight under its item.
        if (blk && (blk.body || "").trim() && blk.type !== "board") {
          lines.push({ key: "b:" + it.id, kind: "body", slot, it, blk });
        }
      } else {
        groups[groups.length - 1].comments.push(line);
        lines.push(line);
        // A comment with a block behind it has content too, and it reads
        // straight on from the comment.
        if (blk && (blk.body || "").trim() && blk.type !== "board") {
          lines.push({ key: "b:" + it.id, kind: "body", slot, it, blk });
        }
      }
    });
    return { slot, title, si, groups, items };
  });

  const indexOf = (key) => lines.findIndex(l => l.key === key);
  // Items are numbered down the day; comments are not, so they take no number.
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

  // The last line that belongs to an item: its last comment, or the item itself.
  const endOfGroup = (slot, itemId) => {
    const items = normSlot(slotItems[slot]).items;
    const i = items.findIndex(x => x.id === itemId);
    let j = i;
    while (j + 1 < items.length && (items[j + 1].depth || 0) > 0) j++;
    return items[j]?.id || itemId;
  };

  const keyHandler = (line) => (e, el, flush) => {
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

    // Alt+↑ and Alt+↓ move a comment one line, past the lines around it. Past
    // its own item it becomes a comment on the item above; past the next item,
    // a comment on that one. The cursor stays where it was in the text.
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && line.kind === "comment" && onMoveItem) {
      e.preventDefault();
      flush(el.value);
      onMoveItem(line.slot, line.it.id, e.key === "ArrowUp" ? -1 : 1);
      pending.current = { key: line.key, pos: at };
      return;
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
        // The first comment, directly under the content.
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

  const itemWords = (it, blk, seed) => it.feature || (blk ? blk.title : seed ? seed.title : it.text) || "";
  const isTyped = (line) => !line.it.blockId && !line.it.feature && !line.it.seedId && !(line.it.links || []).length;
  const leaveEmpty = (line) => (isTyped(line) && onRemoveItem ? () => onRemoveItem(line.slot, line.it.id) : null);
  const saveItemWords = (line) => (v) => {
    if (line.blk) onSaveBlock(line.blk.id, { title: v });
    else if (!line.seed && !line.it.feature) onSaveItem(line.slot, line.it.id, { text: v });
  };

  // Pressing a link in a line asks what to do with it, the way a document
  // does: put the page on the room screen, open it here, or edit the line.
  const linkMenu = (key) => (url, e) => {
    const name = hostOf(url) || "link";
    const live = liveLabel === name;
    openMenu(e, [
      live ? ["Take it off the room screen", () => dismiss()] : ["Put on the room screen", () => castLink && castLink(url, name)],
      ["Open in a new tab", () => { if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer"); }],
      ["Edit the line", () => focusLine(key, "end")],
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

  const openMenu = (e, items) => {
    e.preventDefault();
    const x = Math.min(e.clientX, (typeof window !== "undefined" ? window.innerWidth : 1200) - 260);
    const tall = Math.min(420, 12 + items.filter(Boolean).length * 39);
    const y = Math.max(8, Math.min(e.clientY, (typeof window !== "undefined" ? window.innerHeight : 800) - tall - 8));
    setMenu({ at: { x, y }, items });
  };

  const itemMenu = (line) => {
    const { it, slot } = line;
    const done = doneSet.has(it.id);
    return [
      [done ? "Put it back on the list" : "Done", () => onTick(it.id)],
      onEdit ? ["Edit this", () => onEdit({ blockId: it.blockId, item: it, where: "", slot, id: it.id })] : null,
      line.kind === "item" && line.index > 0 && onNest ? ["Make it a note", () => onNest(slot, it.id, 1)] : null,
      line.kind === "comment" && onNest ? ["Make it an item", () => onNest(slot, it.id, -1)] : null,
      // A note has no slide of its own unless you give it one.
      line.kind === "comment" && onSaveItem ? [it.slide ? "Remove its slide" : "Give it a slide", () => onSaveItem(slot, it.id, { slide: !it.slide })] : null,
      onToggleAssigned && line.kind === "item" ? [isAssigned(it) ? "Take off today's readings" : "Put on today's readings", () => onToggleAssigned(it)] : null,
      ["Take off the day", () => onRemoveItem(slot, it.id), true],
    ];
  };
  const sectionMenu = (sec) => {
    const mine = !named.has(sec.slot);
    return [
      mine && sec.si > firstMovable && onMoveSection ? ["Move section up", () => onMoveSection(sec.slot, -1)] : null,
      mine && sec.si < sections.length - 1 && onMoveSection ? ["Move section down", () => onMoveSection(sec.slot, 1)] : null,
      onInsertRow ? ["Add an item", () => focusLine(onInsertRow(sec.slot, null, 0), 0)] : null,
      mine && onDeleteSection ? ["Delete section", () => onDeleteSection(sec.slot), true] : null,
    ];
  };

  // The slide column beside a line or a group. More than one slide stacks: an
  // item's own, then one for each of its notes that was given a slide.
  const slideCell = (cast, live, label, onClick, more) => (slidesOn ? (
    <div className="doc-slide">
      {cast ? <Slide cast={cast} config={{ path: classHref || "" }} live={live} label={label} onClick={onClick} /> : null}
      {(more || []).map(s => (
        <Slide key={s.key} cast={s.cast} config={{ path: classHref || "" }} live={s.live} label={s.label} onClick={s.onClick} />
      ))}
    </div>
  ) : null);

  const dragProps = (slot, beforeId) => ({
    onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); setOver(slot + "|" + (beforeId || "")); },
    onDragLeave: () => setOver(""),
    onDrop: (e) => { e.preventDefault(); e.stopPropagation(); setOver(""); drop(e, slot, beforeId); },
  });
  // A comment is a drop target in two halves: the top half puts the dragged
  // line above it, the bottom half below. With only "above", a comment could
  // never be dragged to the end of its item's comments.
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
      onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); setOver(slot + "|" + id + "|" + half(e)); },
      onDragLeave: () => setOver(""),
      onDrop: (e) => {
        e.preventDefault(); e.stopPropagation(); setOver("");
        drop(e, slot, half(e) === "below" ? nextAfter() : id);
      },
    };
  };

  return (
    <div className="doc">
      {groupsBySection.map(sec => {
        const raw = normSlot(slotItems[sec.slot]).title || "";
        const secLive = !!raw && liveLabel === raw;
        return (
          <div key={sec.slot} className="doc-sec" data-over={over === sec.slot + "|" ? "1" : "0"} {...dragProps(sec.slot, null)}>
            <div className={"doc-group" + (slidesOn ? " with-slides" : "")}>
              <div className="doc-text" onContextMenu={e => openMenu(e, sectionMenu(sec))}>
                <Line id={"s:" + sec.slot} value={raw} placeholder={sec.title || "Section"} className="lv-section"
                  onSave={v => onSetSlotTitle(sec.slot, v.trim())} onKey={keyHandler(lines[indexOf("s:" + sec.slot)])} register={register} />
              </div>
              {slideCell(raw ? castSection(sec.slot, raw, false) : null, secLive, raw,
                () => (secLive ? dismiss() : castSection(sec.slot, raw, true)))}
            </div>

            {sec.groups.map(g => {
              const { it, blk, seed } = g.head;
              const words = itemWords(it, blk, seed);
              const claim = it.claim || blk?.headline || "";
              const tag = raw || sec.title;
              const slide = slideOf({ item: it, block: blk, seed, title: words, claim, tag, features });
              const live = liveLabel === (claim || words) || (it.feature && liveLabel === it.feature);
              const kind = it.feature ? "activity" : blk ? typeOf(blk.type).label.toLowerCase() : seed ? "seed" : "";
              const kindColor = it.feature ? hue("activity") : blk ? hue(blk.type) : hue("note");
              const kids = blk?.type === "set" ? (blk.children || []).map(id => blockOf(id)).filter(Boolean) : null;
              const bodyLine = lines.find(l => l.key === "b:" + it.id);
              const noteSlides = g.comments.filter(c => c.it.slide).map(c => {
                const w = itemWords(c.it, c.blk, c.seed);
                const cl = c.it.claim || c.blk?.headline || "";
                const cast = slideOf({ item: c.it, block: c.blk, seed: c.seed, title: w, claim: cl, tag, features });
                const on = liveLabel === (cl || w);
                return { key: c.it.id, cast, live: on, label: cl || w,
                  onClick: () => (on ? dismiss() : castItem(c.it, c.blk, c.seed, w, cl, tag, cast)) };
              });
              const canKind = !seed && !it.feature;
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
                      <Line id={it.id} value={words} placeholder="Item" className="lv-item" done={doneSet.has(it.id)}
                        readOnly={!!(seed || it.feature)} onSave={saveItemWords(g.head)} onKey={keyHandler(g.head)} register={register}
                        onLeaveEmpty={leaveEmpty(g.head)} onLink={linkMenu(it.id)} />
                      {canKind ? (
                        <button className="dash-focus doc-kind" style={{ "--ink": inkOf(kindColor) }} title="Choose kind"
                          onClick={e => { const r = e.currentTarget.getBoundingClientRect(); openMenu({ preventDefault() {}, clientX: r.left, clientY: r.bottom + 4 }, kindMenu(g.head)); }}>
                          {kind || typeOf("note").label.toLowerCase()} <span aria-hidden="true">▾</span>
                        </button>
                      ) : kind ? <span className="doc-kind" style={{ "--ink": inkOf(kindColor) }}>{kind}</span> : null}
                      <LinkChips urls={[blk?.url, ...(it.links || []).map(l => l.url), ...(blk ? [] : urlsIn(it.text))]}
                        liveLabel={liveLabel} onCast={castLink} dismiss={dismiss} />
                      {live ? <button className="dash-focus doc-down" onClick={dismiss} title="Take it back down">On screen ×</button> : null}
                    </div>

                    {bodyLine ? (
                      <div className="doc-row doc-under">
                        <Line id={bodyLine.key} value={blk.body} placeholder="Content" className="lv-comment"
                          onSave={v => onSaveBlock(blk.id, { body: v })} onKey={keyHandler(bodyLine)} register={register} onLink={linkMenu(bodyLine.key)} />
                        <LinkChips urls={urlsIn(blk.body)} liveLabel={liveLabel} onCast={castLink} dismiss={dismiss} />
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
                            {/* The handle. A comment is all text box, and a press on a
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
                              onSave={saveItemWords(c)} onKey={keyHandler(c)} register={register} onLeaveEmpty={leaveEmpty(c)} onLink={linkMenu(c.it.id)} />
                            <LinkChips urls={[c.blk?.url, ...(c.it.links || []).map(l => l.url), ...(c.blk ? [] : urlsIn(c.it.text))]}
                              liveLabel={liveLabel} onCast={castLink} dismiss={dismiss} />
                          </div>
                          {cBody ? (
                            <div className="doc-row doc-under">
                              <Line id={cBody.key} value={c.blk.body} placeholder="Content" className="lv-comment lv-body"
                                onSave={v => onSaveBlock(c.blk.id, { body: v })} onKey={keyHandler(cBody)} register={register} onLink={linkMenu(cBody.key)} />
                              <LinkChips urls={urlsIn(c.blk.body)} liveLabel={liveLabel} onCast={castLink} dismiss={dismiss} />
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
    </div>
  );
}

export const DOC_CSS = `
/* THE DAY AS A DOCUMENT. Three sizes of text and nothing else: a section is a
   heading, an item is a line, a comment is quieter and set in. Every line is a
   text box that looks like text until the cursor is in it. */
.doc{display:flex;flex-direction:column}
.doc-sec{display:flex;flex-direction:column;padding-top:18px;border-radius:10px}
.doc-sec[data-over="1"]{background:rgba(23,19,16,.035)}
.doc-group{display:grid;grid-template-columns:minmax(0,1fr);column-gap:18px;align-items:start;border-radius:8px}
.doc-group.with-slides{grid-template-columns:minmax(0,1fr) 200px}
.doc-group[data-over="1"]{box-shadow:inset 0 2px 0 var(--dash-accent)}
.doc-group.picked .doc-num{color:var(--dash-accent);font-weight:600}
.doc-text{min-width:0;display:flex;flex-direction:column;padding:2px 0}
.doc-slide{display:flex;justify-content:flex-end;padding:4px 0}
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
.doc-slide{flex-direction:column;align-items:flex-end;gap:8px}
.doc-menu{max-height:420px;overflow-y:auto}
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
/* A comment's handle: quiet until the comment is under the pointer. */
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
.doc-menu{position:fixed;z-index:81;min-width:230px;background:#fff;border:1px solid rgba(23,19,16,.14);border-radius:12px;padding:5px;
  box-shadow:0 16px 38px -12px rgba(23,19,16,.42);display:flex;flex-direction:column;gap:1px}
.doc-menu button{display:flex;align-items:center;width:100%;text-align:left;background:none;border:none;cursor:pointer;
  padding:0 10px;min-height:38px;border-radius:8px;font-family:var(--font-body);font-size:14px;color:var(--text-primary)}
.doc-menu button:hover{background:rgba(23,19,16,.05)}
.doc-menu button.danger{color:var(--state-live)}
@media (max-width:1100px){.doc-group.with-slides{grid-template-columns:minmax(0,1fr) 150px}}
`;
