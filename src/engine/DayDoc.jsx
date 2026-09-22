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
import { mediaLabel } from "./media.js";
import { normSlot, sumRanges, rangeLabel, parseRange } from "./dayplan.js";
import { inkOf } from "./colors.js";

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

// Lines of the day as Markdown. Andrew, 2026-09-20: "I need to be able to
// select a whole bunch of lines in the dashboard so i can copy them
// elsewhere", and "yeah with markdown."
//
// A section is a heading, an item is bold on a line of its own so it reads as
// the thing the notes are about, a note is a bullet under it, and a block's
// content is an indented line. What comes out pastes into an email, a
// document or a message and keeps the shape the day had.
export function docMarkdown(rows) {
  const out = [];
  (rows || []).forEach(r => {
    const words = String(r?.words || "").trim();
    if (!words) return;
    if (r.kind === "section") out.push((out.length ? "\n" : "") + "## " + words);
    else if (r.kind === "comment") out.push("- " + words);
    else if (r.kind === "body") out.push("  " + words.replace(/\s*\n+\s*/g, " "));
    else out.push((out.length ? "\n" : "") + "**" + words + "**");
  });
  return out.length ? out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n" : "";
}

// The way up to the room screen, in a line's margin.
const PUT = (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M3.5 2.2v9.6L11.5 7z" /></svg>
);

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
// `mark` is the highlight: true for the whole line, or the words of it that are
// highlighted. A text box cannot colour part of what it holds, so a phrase is
// coloured on a copy of the line set directly behind the box, in the same type.
function Line({ id, value, placeholder, readOnly, className, onSave, onKey, register, done, onLeaveEmpty, onLink, onType, onLeave, mark }) {
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

  // A line you are typing in keeps its own words, except a line that has just
  // become something you cannot type into (a game or an activity picked from
  // the slash menu): that one shows its new name at once. Holding on to the
  // emptied draft left a game row nameless until the page was reloaded.
  useEffect(() => { if (!focused.current || readOnly) setDraft(value || ""); }, [value, readOnly]);
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
  // The words selected in this line, which is what Highlight takes.
  const selection = () => {
    const el = box.current;
    if (!el || el.selectionStart == null || el.selectionStart === el.selectionEnd) return "";
    return el.value.slice(el.selectionStart, el.selectionEnd);
  };
  useEffect(() => { register(id, { focus: focusAt, setText, selection }); });
  useEffect(() => () => register(id, null), [id]);
  useEffect(() => {
    if (want.current != null && box.current) { const p = want.current; want.current = null; focusAt(p); }
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  if (onLink && !editing && urlsIn(draft).length) {
    const parts = String(draft).split(/(https?:\/\/[^\s<>"')]+)/g);
    return (
      <div ref={shown} className={"doc-line doc-linetext " + className + (done ? " done" : "") + (mark ? " marked" : "")}
        onMouseDown={e => {
          if (e.target.closest("a")) return;
          e.preventDefault();
          want.current = offsetAt(e, shown.current);
          setEditing(true);
        }}>
        {parts.map((p, i) => (i % 2
          ? <a key={i} className="doc-inlink" href={p} title={p} onClick={e => { e.preventDefault(); onLink(p, e); }}>{hostOf(p) || p}</a>
          : p))}
      </div>
    );
  }

  const phrase = typeof mark === "string" && mark && String(draft).includes(mark) ? mark : "";
  const area = (
    <textarea ref={box} rows={1} spellCheck className={"doc-line " + className + (done ? " done" : "") + (mark && !phrase ? " marked" : "")}
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
  if (!phrase) return area;
  const at = String(draft).indexOf(phrase);
  return (
    <span className="doc-linewrap">
      <span aria-hidden="true" className={"doc-line doc-lineback " + className}>
        {String(draft).slice(0, at)}<mark>{phrase}</mark>{String(draft).slice(at + phrase.length)}
      </span>
      {area}
    </span>
  );
}

// A link on a line: press the name and the page goes up on the room screen;
// press ↗ and it opens in a tab here instead. Press the name again while it
// is up to take it down.
// One quiet chip, and pressing it asks what to do with the link: put the page
// on the room screen, or open it in a tab here. Andrew, 2026-09-20: "shouldn't
// I also be able to open the link on my side or open the link on the screen?"
function LinkChips({ urls, liveLabel, liveUrl, onMenu }) {
  const list = [...new Set((urls || []).filter(Boolean))];
  if (!list.length) return null;
  return list.map(u => {
    const name = hostOf(u) || "link";
    // By address, not by host: every Wikipedia link shares a host, and matching
    // on the host lit every one of them when one went up.
    const live = liveUrl ? liveUrl === u : liveLabel === name;
    return (
      <button key={u} className={"dash-focus doc-link" + (live ? " live" : "")} title="Choose what to do with the link"
        onClick={e => onMenu && onMenu(u, e)}>{live ? name + " · on screen" : name}</button>
    );
  });
}

// A menu's rows with its rules tidied: "-" is a rule between groups, and a rule
// with nothing above it, nothing below it, or another rule beside it is dropped.
const tidyRules = (items) => (items || []).filter(Boolean)
  .filter((row, i, all) => row !== "-" || (i > 0 && all[i - 1] !== "-"))
  .filter((row, i, all) => row !== "-" || i < all.length - 1);

// One box that holds a short list of choices, opened by a right-click or a
// hold, and closed by anything else.
export function Menu({ at, items, onClose }) {
  if (!at) return null;
  return (
    <>
      <div className="doc-veil" onMouseDown={onClose} onContextMenu={e => { e.preventDefault(); onClose(); }} />
      <div role="menu" className="doc-menu" style={{ left: at.x, top: at.y }}>
        {tidyRules(items).map((row, i) => (row === "-" ? <div key={"rule" + i} className="doc-menu-rule" /> : (
          <button key={row[0]} className={"dash-focus" + (row[2] ? " danger" : "")} onClick={() => { onClose(); row[1](); }}>{row[0]}</button>
        )))}
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

const GAME_FEATURES = new Set(["Game", "Team Trivia"]);
const GAMEY = /\b(game|trivia|ten on ten)\b/i;

export default function DayDoc({
  sections, slotItems, named, firstMovable, blockOf, seedById, doneSet, nextId, pickedId,
  liveLabel, liveUrl, castItem, castSection, dismiss, features, hue, slidesOn, classHref, renderExtras,
  onSetSlotTitle, onSaveItem, onSaveBlock, onInsertRow, onRemoveItem, onNest, onTick, isAssigned, onToggleAssigned,
  onDeleteSection, onMoveSection, onEdit, drop, castLink, onMoveItem, onConvertRow, onLinkRow, library,
  onSetSlotTime, onPlaceSection, onSplitSection, classMinutes, onOpenTemplates, onOpenHistory,
  ground, assignments, games, gamesHref, view, teaching, onSetSlotLook, onMerge, footTools,
}) {
  const refs = useRef(new Map());
  const pending = useRef(null);
  const [menu, setMenu] = useState(null);
  const menuAt = useRef(null);
  const holding = useRef(null);
  const [over, setOver] = useState("");
  const [dragging, setDragging] = useState("");
  // A section being dragged. Held in a ref too, because a drag over an item
  // has to know, before the drop, that it should step aside for the section.
  const [secDrag, setSecDrag] = useState("");
  const secDragRef = useRef("");
  const [pop, setPop] = useState(null);
  const popList = useRef([]);
  // Lines picked out to copy. Andrew, 2026-09-20: "I need to be able to select
  // a whole bunch of lines in the dashboard so i can copy them elsewhere."
  // Every line of this document is its own text box, so a mouse drag cannot
  // cross them and there is nothing for the browser to select. Clicking the
  // number in the margin picks a row, shift takes the range between, and what
  // comes out is Markdown.
  const [sel, setSel] = useState([]);
  const [copied, setCopied] = useState(false);
  const anchor = useRef(null);
  const register = (id, api) => { if (api) refs.current.set(id, api); else refs.current.delete(id); };

  // Every line of the day, top to bottom, which is the order the arrows walk.
  const lines = [];
  // A section may carry a mark: the Enter and Exit boards are sections of the
  // day with a word and a colour of their own, and no time, because they are
  // the room's reading before and after the day rather than minutes of it.
  const groupsBySection = sections.map(([slot, title, mark], si) => {
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
    return { slot, title, si, groups, items, mark: mark || null };
  });

  // Each item's notes as words, for a slide that shows them.
  const notesOf = {};
  groupsBySection.forEach(sec => sec.groups.forEach(g => {
    notesOf[g.head.it.id] = g.comments.map(c => (c.it.feature || (c.blk ? c.blk.title : c.seed ? c.seed.title : c.it.text) || "").trim()).filter(Boolean);
  }));
  const indexOf = (key) => lines.findIndex(l => l.key === key);
  // ⌘C copies what is picked, unless the cursor is in a line, where it means
  // the words in that line and always should.
  useEffect(() => {
    if (!sel.length) return undefined;
    const onKey = (e) => {
      const t = e.target;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "Escape") { setSel([]); anchor.current = null; return; }
      if (typing) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === "c" || e.key === "C")) { e.preventDefault(); copyKeys(sel); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // A line, as words. The same reading the slide and the search use: what a
  // block is called, or the words typed into the line.
  const wordsOfLine = (l) => (l.kind === "section"
    ? (normSlot(slotItems[l.slot]).title || l.title || "")
    : l.kind === "body" ? (l.blk?.body || "")
    : (l.it?.feature || (l.blk ? (l.blk.headline || l.blk.title) : l.seed ? l.seed.title : l.it?.text) || "")).trim();

  // The picked lines as Markdown, in the order the day has them. A block's
  // content is not picked on its own; it comes with the item it belongs to.
  const asMarkdown = (keys) => {
    const want = new Set(keys);
    return docMarkdown(lines
      .filter(l => want.has(l.key) || (l.kind === "body" && want.has(l.it?.id)))
      .map(l => ({ kind: l.kind, words: wordsOfLine(l) })));
  };

  const putOnClipboard = (text) => {
    try {
      if (navigator?.clipboard?.writeText) { navigator.clipboard.writeText(text); return true; }
    } catch { /* no clipboard in this browser */ }
    try {
      const box = document.createElement("textarea");
      box.value = text;
      box.style.position = "fixed";
      box.style.opacity = "0";
      document.body.appendChild(box);
      box.select();
      document.execCommand("copy");
      document.body.removeChild(box);
      return true;
    } catch { return false; }
  };

  const copyKeys = (keys) => {
    if (!keys.length) return;
    putOnClipboard(asMarkdown(keys));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Clicking a number picks that line. Shift takes everything between it and
  // the last one picked; the platform's own key adds or removes one.
  const pickLine = (key, e) => {
    const keys = lines.map(l => l.key);
    if (e?.shiftKey && anchor.current && keys.includes(anchor.current)) {
      const a = keys.indexOf(anchor.current), b = keys.indexOf(key);
      const [lo, hi] = a < b ? [a, b] : [b, a];
      setSel(keys.slice(lo, hi + 1).filter(k => !k.startsWith("b:")));
      return;
    }
    if (e?.metaKey || e?.ctrlKey) {
      anchor.current = key;
      setSel(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
      return;
    }
    anchor.current = key;
    setSel(prev => (prev.length === 1 && prev[0] === key ? [] : [key]));
  };
  const picking = sel.length > 0;
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

  // A game row points at a game built in the game panel, and the day gets to
  // say what that game is called here.
  //
  // Andrew, 2026-09-21: "so why is the game called Week 1, and why can't i
  // change the name." Because the game in the games list is called Week 1, the
  // row copied that name when the game was dragged onto the day, and the row
  // would not let him type. The name the students read comes off the row, so
  // renaming the game left Wednesday still saying Week 1 to the class.
  //
  // So the row's own words win, and the game's title is what a fresh row starts
  // with. Type over it and the day says what you typed, on the dashboard and on
  // the schedule both.
  const gameOf = (id) => (games || []).find(g => g.id === id) || null;
  const itemWords = (it, blk, seed) => (it.gameId ? (it.text || gameOf(it.gameId)?.title) : "") || it.feature || (blk ? blk.title : seed ? seed.title : it.text) || "";
  const isTyped = (line) => !!line.it && !line.it.blockId && !line.it.feature && !line.it.gameId && !line.it.seedId && !(line.it.links || []).length;
  const leaveEmpty = (line) => (isTyped(line) && onRemoveItem ? () => onRemoveItem(line.slot, line.it.id) : null);
  const saveItemWords = (line) => (v) => {
    if (line.blk) onSaveBlock(line.blk.id, { title: v });
    else if (!line.seed && !line.it.feature) onSaveItem(line.slot, line.it.id, { text: v });
  };
  const tagOf = (slot) => normSlot(slotItems[slot]).title || (sections.find(([k]) => k === slot) || [])[1] || "";

  // What putting a line on the room screen sends, for an item or a note.
  // Whether a row of the day is what the room is looking at. A board's idea
  // goes up as that board, one idea at a time, and the room says which one is
  // up as "Enter \u00b7 2".
  //
  // The section card reads this before it draws and the row reads it again, so
  // the card and the line in it cannot disagree about where the room is.
  const rowLive = (g) => {
    const { it, blk, seed } = g.head;
    if (it.board) return liveLabel === (it.board === "pre" ? "Enter" : "Exit") + " \u00b7 " + (it.index + 1);
    const words = itemWords(it, blk, seed);
    const claim = it.claim || blk?.headline || "";
    return liveLabel === (claim || words) || (!!it.feature && liveLabel === it.feature);
  };

  const castLine = (line) => {
    const w = itemWords(line.it, line.blk, line.seed);
    const cl = line.it.claim || line.blk?.headline || "";
    const tag = tagOf(line.slot);
    const notes = line.kind === "item" && line.it.slideNotes ? (notesOf[line.it.id] || []) : undefined;
    const cast = slideOf({ item: line.it, block: line.blk, seed: line.seed, title: w, claim: cl, tag, features, notes, assignments, games });
    return { cast, label: cl || w, go: () => castItem(line.it, line.blk, line.seed, w, cl, tag, cast) };
  };

  const isArticle = (line) => line.kind === "item" && castLine(line).cast?.template === "article";

  const openMenu = (e, items) => {
    e.preventDefault();
    const x = Math.min(e.clientX, (typeof window !== "undefined" ? window.innerWidth : 1200) - 260);
    const tall = Math.min(420, 12 + items.filter(Boolean).length * 39);
    const y = Math.max(8, Math.min(e.clientY, (typeof window !== "undefined" ? window.innerHeight : 800) - tall - 8));
    menuAt.current = { clientX: e.clientX, clientY: e.clientY };
    setMenu({ at: { x, y }, items });
  };

  // Holding a line opens the menu a right-click opens. Andrew, 2026-09-20:
  // "when i hold something, or right click it, shouldn't i be able to then
  // cast it on the screen?" A press that moves is a drag or a selection, so it
  // lets go of the hold.
  const letGo = () => { if (holding.current) { clearTimeout(holding.current.t); holding.current = null; } };
  const holdProps = (getItems) => ({
    onPointerDown: (e) => {
      if (e.button) return;
      letGo();
      const at = { clientX: e.clientX, clientY: e.clientY };
      holding.current = { ...at, t: setTimeout(() => { holding.current = null; openMenu({ preventDefault() {}, ...at }, getItems()); }, 550) };
    },
    onPointerMove: (e) => {
      const h = holding.current;
      if (h && Math.abs(e.clientX - h.clientX) + Math.abs(e.clientY - h.clientY) > 6) letGo();
    },
    onPointerUp: letGo, onPointerLeave: letGo, onPointerCancel: letGo,
  });
  useEffect(() => letGo, []);

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
        // Games come from the game panel, so the old Game and Team Trivia rows are not offered.
        Object.keys(features || {}).filter(n => !games || !GAME_FEATURES.has(n)).forEach(n => add("Activity", n, () => onSaveItem(line.slot, it.id, { feature: n, text: n }),
          { hint: features[n], swatch: hue("activity") }));
        (games || []).forEach(g => add("Game", g.title, () => onSaveItem(line.slot, it.id, { gameId: g.id, text: g.title }),
          { hint: g.questions + (g.questions === 1 ? " question" : " questions"), swatch: hue("set"), keys: "game" }));
      }
      add("Screen", "Put on screen", () => castLine(line).go());
      if (line.kind === "item" && onSaveItem) {
        add("Screen", it.slideNotes ? "Hide notes on slide" : "Show notes on slide", () => onSaveItem(line.slot, it.id, { slideNotes: !it.slideNotes }));
      }
      if (isArticle(line) && onSaveItem) {
        if (it.slideLook !== "clipping") add("Screen", "Use clipping", () => onSaveItem(line.slot, it.id, { slideLook: "clipping" }));
        if (it.slideLook !== "picture") add("Screen", "Use picture", () => onSaveItem(line.slot, it.id, { slideLook: "picture" }));
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
    if (onOpenTemplates) add("Day", "Templates", () => onOpenTemplates(), { hint: "Save this day, or start from a template" });
    if (onOpenHistory) add("Day", "History", () => onOpenHistory(), { hint: "Earlier versions of this day" });
    return out;
  };

  const findInLibrary = (q) => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const line0 = pop?.line;
    const place = (extra, rest) => {
      const line = pop?.line;
      if (!line) return;
      if (line.kind !== "section" && isTyped(line) && !rest) {
        onSaveItem(line.slot, line.it.id, extra);
        focusLine(line.it.id, "end");
      } else if (onInsertRow) {
        const slot = line.slot;
        const after = line.kind === "section" ? null : line.kind === "item" ? endOfGroup(slot, line.it.id) : line.it.id;
        const depth = line.kind === "comment" ? 1 : 0;
        focusLine(onInsertRow(slot, after, depth, extra), "end");
      }
    };
    const gameHits = line0 ? (games || [])
      .filter(g => words.every(w => (g.title + " game").toLowerCase().includes(w)))
      .slice(0, 6)
      .map(g => ({ id: "game:" + g.id, group: "Game", label: g.title, hint: g.questions + (g.questions === 1 ? " question" : " questions"),
        swatch: hue("set"), run: (rest) => place({ gameId: g.id, text: g.title }, rest) })) : [];
    return [...gameHits, ...(library || [])
      .filter(b => !(games && b.type === "set" && GAMEY.test(b.title || "")))
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
      }))];
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
    // By address, not by host: every Wikipedia link shares a host, and matching
    // on the host lit every one of them when one went up.
    const live = liveUrl ? liveUrl === url : liveLabel === name;
    openMenu(e, [
      live ? ["Take off screen", () => dismiss()] : ["Put link on screen", () => castLink && castLink(url, name, key)],
      ["Open in new tab", () => openTab(url)],
      ["Edit", () => focusLine(key, "end")],
    ]);
  };
  const openTab = (url) => { if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer"); };
  // Every address a line carries: its block's, its links', and any typed into it.
  const urlsOf = (line) => [...new Set([line.blk?.url, ...(line.it?.links || []).map(l => l.url), ...urlsIn(line.it?.text)].filter(Boolean))];

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

  // One menu for a line, by right-click or by holding it. The screen first,
  // because that is what the menu is opened for with the room watching; then
  // the line itself; then its structure; and taking it off the day last.
  // What a slide looks like is not here: that is the brush under the slide.
  const itemMenu = (line) => {
    const { it, slot } = line;
    const done = doneSet.has(it.id);
    const c = castLine(line);
    const live = !!c.label && liveLabel === c.label;
    const url = urlsOf(line)[0] || "";
    // The words selected when the menu opened, read now because the line lets
    // go of the cursor the moment the menu is pressed.
    const picked = (refs.current.get(it.id)?.selection?.() || "").trim();
    const canKind = !line.seed && !it.feature && !it.gameId && !it.board;
    return [
      live ? ["Take off screen", () => dismiss()] : ["Put on screen", () => c.go()],
      url && castLink ? ["Put link on screen", () => castLink(url, hostOf(url) || "link", it.id)] : null,
      url ? ["Open in new tab", () => openTab(url)] : null,
      "-",
      onSaveItem ? (it.mark && !picked
        ? ["Remove highlight", () => onSaveItem(slot, it.id, { mark: undefined })]
        : ["Highlight", () => onSaveItem(slot, it.id, { mark: picked || true })]) : null,
      [done ? "Mark not done" : "Mark done", () => onTick(it.id)],
      onEdit ? ["Edit details", () => onEdit({ blockId: it.blockId, item: it, where: "", slot, id: it.id })] : null,
      "-",
      // His notes on the slide, or not, item by item.
      line.kind === "item" && onSaveItem ? [it.slideNotes ? "Hide notes on slide" : "Show notes on slide", () => onSaveItem(slot, it.id, { slideNotes: !it.slideNotes })] : null,
      // A note has no slide of its own unless you give it one.
      line.kind === "comment" && onSaveItem ? [it.slide ? "Remove slide" : "Create slide", () => onSaveItem(slot, it.id, { slide: !it.slide })] : null,
      line.kind === "item" && line.index > 0 && onNest ? ["Make note", () => onNest(slot, it.id, 1)] : null,
      line.kind === "comment" && onNest ? ["Make item", () => onNest(slot, it.id, -1)] : null,
      canKind ? ["Choose kind", () => openMenu({ preventDefault() {}, ...(menuAt.current || { clientX: 40, clientY: 40 }) }, kindMenu(line))] : null,
      onToggleAssigned && line.kind === "item" ? [isAssigned(it) ? "Remove from readings" : "Add to readings", () => onToggleAssigned(it)] : null,
      "-",
      ["Copy", () => copyKeys([it.id])],
      ["Remove from day", () => onRemoveItem(slot, it.id), true],
    ];
  };
  const sectionMenu = (sec) => {
    const mine = !named.has(sec.slot);
    const name = normSlot(slotItems[sec.slot]).title || "";
    return [
      name ? (liveLabel === name ? ["Take off screen", () => dismiss()] : ["Put on screen", () => castSection(sec.slot, name, true)]) : null,
      "-",
      onInsertRow ? ["Add item", () => focusLine(onInsertRow(sec.slot, null, 0), 0)] : null,
      mine && sec.si > firstMovable && onMoveSection ? ["Move up", () => onMoveSection(sec.slot, -1)] : null,
      mine && sec.si < sections.length - 1 && onMoveSection ? ["Move down", () => onMoveSection(sec.slot, 1)] : null,
      onMerge && sections.length > 1 ? ["Merge two sections", () => onMerge()] : null,
      "-",
      ["Copy section", () => copyKeys(["s:" + sec.slot, ...normSlot(slotItems[sec.slot]).items.map(x => x.id)])],
      mine && onDeleteSection ? ["Delete section", () => onDeleteSection(sec.slot), true] : null,
    ];
  };

  // ─── what a slide looks like ───
  //
  // The brush under a slide steps through the looks that slide can wear. Left
  // alone a slide follows its kind and the class's ground. Every slide can
  // take the other ground; an item or a section can be a sticky note or an
  // index card; an article can be a clipping or its picture.
  const otherGround = ground === "paper" ? "slate" : "paper";
  const looksFor = (cast) => {
    if (!cast || cast.type !== "slide") return [""];
    const of = cast.of || cast.template;
    if (of === "item" || of === "section") return ["", otherGround, "note", "card"];
    if (of === "article") return ["", otherGround, "clipping", "picture"];
    return ["", otherGround];
  };
  const nextLook = (cast, now) => {
    const all = looksFor(cast);
    return all[(Math.max(0, all.indexOf(now || "")) + 1) % all.length];
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

  // ─── slides ───
  //
  // The same day as its slides. Andrew, 2026-09-20: "The Flow should feel like
  // a super clean google doc that could be turned into a set of slides at any
  // time (so maybe those are the two views? google doc and slide view, but
  // it's the same material?)." A section's name is a slide, an item is a
  // slide, a note is a slide when it was given one, and the notes under an
  // item read under its slide the way speaker notes do. Pressing a slide puts
  // it up. The brush under it steps its look; the one beside a section's name
  // steps every slide in the section at once.
  if (view === "slides") {
    const brush = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18.4 2.6a2 2 0 0 1 2.9 2.9l-9.2 9.2-3.2.4.4-3.2z" />
        <path d="M8.6 14.2c-2.2 0-3.6 1.5-3.6 3.4 0 1.4-.9 2.3-2 2.9 1 .6 2.1.9 3.3.9 2.6 0 4.6-1.8 4.6-4.2" />
      </svg>
    );
    // What a card carries. Teaching, the block beside a slide used to be the
    // notes and nothing else, so a row reading "Stanford" with a link on it
    // said "Nothing written under this slide" and the line itself was
    // nowhere. Andrew, 2026-09-22: "show me what it says in teh actual line
    // like 'stanford' and the link, and then give me a notes panel."
    //
    // So a card carries its own line as well as its slide: the words, the
    // links, the block's content and the notes under it, each as the line it
    // is in the document rather than as a string, because the notes are a
    // place to write as well as read.
    const decks = groupsBySection.map(sec => {
      const bucket = normSlot(slotItems[sec.slot]);
      const raw = bucket.title || "";
      const cards = [];
      if (raw) {
        cards.push({ key: "s:" + sec.slot, cast: castSection(sec.slot, raw, false), label: raw, n: "", notes: "", said: [],
          words: raw, urls: [], comments: [],
          go: () => castSection(sec.slot, raw, true), menu: () => sectionMenu(sec),
          look: bucket.slideLook || "", setLook: (v) => onSetSlotLook && onSetSlotLook(sec.slot, v) });
      }
      sec.groups.forEach(g => {
        const c = castLine(g.head);
        const { it, blk, seed } = g.head;
        const body = blk?.type !== "board" ? (blk?.body || "").trim() : "";
        const said = [body, ...(notesOf[it.id] || [])].filter(Boolean);
        cards.push({ key: it.id, cast: c.cast, label: c.label, go: c.go, n: itemNumber[it.id] || "",
          notes: said.join(" · "), said, menu: () => itemMenu(g.head),
          words: itemWords(it, blk, seed), urls: [blk?.url, ...(it.links || []).map(l => l.url)],
          id: it.id, line: g.head, bodyLine: lines.find(l => l.key === "b:" + it.id) || null,
          blk, comments: g.comments,
          addNote: onInsertRow ? () => focusLine(onInsertRow(sec.slot, it.id, 1), 0) : null,
          look: it.slideLook || "", setLook: (v) => onSaveItem && onSaveItem(sec.slot, it.id, { slideLook: v || undefined }) });
        g.comments.filter(n => n.it.slide).forEach(n => {
          const nc = castLine(n);
          cards.push({ key: n.it.id, cast: nc.cast, label: nc.label, go: nc.go, n: "", notes: "", said: [], menu: () => itemMenu(n),
            words: itemWords(n.it, n.blk, n.seed), urls: [n.blk?.url, ...(n.it.links || []).map(l => l.url)],
            id: n.it.id, comments: [],
            look: n.it.slideLook || "", setLook: (v) => onSaveItem && onSaveItem(sec.slot, n.it.id, { slideLook: v || undefined }) });
        });
      });
      return { sec, raw, time: bucket.time || "", cards };
    }).filter(d => d.cards.length);
    if (!decks.length) return <div className="teach-empty">Nothing on this day to put up yet.</div>;
    // Teaching, the run is one slide wide with everything written under it
    // beside it. Andrew, 2026-09-20: "it should have slides on one side
    // probably only one wide, and the screen on the right side. on top of
    // that, it should have ALL my notes from each slide, or whatever is
    // underneath it, to the right of the slide so i can see all the notes."
    // Planning, it stays a grid: laying out a day is looking at the shape of
    // the whole thing, and teaching is reading one thing at a time.
    return (
      <div className={"deck" + (teaching ? " is-run" : "")}>
        {decks.map(d => {
          // The whole section steps together, from where its first slide is.
          const stepAll = () => {
            const to = nextLook({ type: "slide", template: "item" }, d.cards[0].look);
            d.cards.forEach(c => c.setLook(looksFor(c.cast).includes(to) ? to : ""));
          };
          return (
            <section key={d.sec.slot} className="deck-sec">
              <div className="deck-head" onContextMenu={e => openMenu(e, sectionMenu(d.sec))}>
                <h2 className="deck-name">{d.raw || d.sec.title}</h2>
                {d.time ? <span className="deck-time">{d.time}</span> : null}
                <button className="dash-focus deck-brush deck-brush-set" onClick={stepAll}
                  title="Next design for the section" aria-label="Next design for the section">{brush}</button>
              </div>
              <div className="deck-grid">
                {d.cards.map(c => {
                  const live = !!c.label && liveLabel === c.label;
                  return (
                    <div key={c.key} className="deck-card" onContextMenu={e => openMenu(e, c.menu())} {...holdProps(c.menu)}>
                      {c.cast ? <Slide cast={c.cast} config={{ path: classHref || "" }} ground={ground} live={live} label={c.label}
                        onClick={() => (live ? dismiss() : c.go())} /> : <div className="deck-blank" />}
                      <div className="deck-cap">
                        <span className={"deck-n" + (live ? " live" : "")}>{live ? "on screen" : c.n}</span>
                        {teaching ? (
                          /* The line, then what is written under it. The line
                             is the row's own words with its links beside them,
                             drawn by the same chips the document draws, so
                             pressing stanford.edu here offers what it offers
                             there. Under it, the block's content and every
                             note, each one the line it is in the document and
                             editable in place: "a place to write and read, and
                             it doesn't have to be a fancy panel." */
                          <span className="deck-said">
                            {c.words ? (
                              <span className="deck-line">
                                <span className="deck-words">{c.words}</span>
                                <LinkChips urls={c.urls} liveLabel={liveLabel} liveUrl={liveUrl}
                                  onMenu={c.id ? linkMenu(c.id) : undefined} />
                              </span>
                            ) : null}
                            {c.bodyLine && c.blk ? (
                              <Line id={c.bodyLine.key} value={c.blk.body} placeholder="Content" className="lv-comment"
                                onSave={v => onSaveBlock(c.blk.id, { body: v })} onKey={keyHandler(c.bodyLine)} register={register}
                                onLink={linkMenu(c.bodyLine.key)} onType={typing(c.bodyLine)} onLeave={(k) => { if (pop && pop.key === k) setPop(null); }} />
                            ) : null}
                            {(c.comments || []).map(n => (
                              <Line key={n.it.id} id={n.it.id} value={itemWords(n.it, n.blk, n.seed)} placeholder="Note" className="lv-comment"
                                done={doneSet.has(n.it.id)} readOnly={!!(n.seed || n.it.feature)} mark={n.it.mark}
                                onSave={saveItemWords(n)} onKey={keyHandler(n)} register={register} onLeaveEmpty={leaveEmpty(n)}
                                onLink={linkMenu(n.it.id)} onType={typing(n)} onLeave={(k) => { if (pop && pop.key === k) setPop(null); }} />
                            ))}
                            {/* With no note to press Enter in, there has to be
                                somewhere to start one. */}
                            {c.addNote ? (
                              <button className="dash-focus deck-addnote" onClick={c.addNote}>Add a note</button>
                            ) : null}
                          </span>
                        ) : <span className="deck-notes">{c.notes}</span>}
                        {looksFor(c.cast).length > 1 ? (
                          <button className="dash-focus deck-brush" onClick={() => c.setLook(nextLook(c.cast, c.look))}
                            title="Next design" aria-label="Next design">{brush}</button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        <Menu at={menu?.at} items={menu?.items || []} onClose={() => setMenu(null)} />
      </div>
    );
  }

  // WHERE THE ROOM IS. The schedule puts the class's colour round the week you
  // are in; a section card takes it the same way. Andrew, 2026-09-22: "i like
  // how there are outlines used in the cards on the schedule ... should it
  // outline the section i'm currently on?"
  //
  // Currently on means the section holding whatever is on the screen: its own
  // name, one of its rows, or a note under a row that was given a slide. With
  // nothing up, nothing is outlined, because the schedule marks where you
  // actually are rather than where you happen to be looking, and while a day
  // is being planned the room is nowhere.
  const hereSlot = !liveLabel ? "" : (groupsBySection.find(sec =>
    (normSlot(slotItems[sec.slot]).title || "") === liveLabel
    || sec.groups.some(g => rowLive(g) || g.comments.some(c => c.it.slide && castLine(c).label === liveLabel))
  ) || {}).slot || "";

  // What the day adds up to, from every section given a time.
  const times = sections.map(([k]) => normSlot(slotItems[k]).time || "");
  const total = sumRanges(times);
  const untimed = times.filter(t => !parseRange(t)).length;

  // What is left of the class once every timed section has had its minutes.
  // Andrew, 2026-09-17: "what i want at the bottom is this: how much time
  // would i have left." A range planned leaves a range: 65 minutes less 40
  // to 50 planned is 15 to 25 left. Over by any amount reads as over.
  const overTime = classMinutes && total.lo > classMinutes;
  const left = classMinutes ? { lo: Math.max(0, classMinutes - total.hi), hi: Math.max(0, classMinutes - total.lo) } : null;
  // One line at the foot: what is left of the class, then the day's housekeeping.
  const foot = total.n || footTools ? (
    <div className={"doc-total doc-foot" + (overTime ? " over" : "")}>
      {!total.n ? null : overTime ? (
        <span className="doc-total-n">Over by {rangeLabel({ lo: total.lo - classMinutes, hi: total.hi - classMinutes })} min</span>
      ) : left ? (
        <><span className="doc-total-n">{rangeLabel(left)} min left</span><span> of {classMinutes}, with {rangeLabel(total)} planned</span></>
      ) : (
        <><span className="doc-total-n">{rangeLabel(total)} min</span><span> planned</span></>
      )}
      {total.n && untimed ? <span className="doc-total-more"> · {untimed} {untimed === 1 ? "section" : "sections"} without a time</span> : null}
      {footTools ? <span className="doc-foot-tools">{footTools}</span> : null}
    </div>
  ) : null;

  return (
    <div className="doc">
      {/* What is picked, and the two things to do about it. It sits above the
          day rather than floating over it, because a strip that covers a line
          covers the line you are deciding about. */}
      {picking ? (
        <div className="doc-pick-bar">
          <span className="doc-pick-n">{sel.length} line{sel.length === 1 ? "" : "s"} picked</span>
          <button className="dash-focus doc-pick-do" onClick={() => copyKeys(sel)}>{copied ? "Copied" : "Copy"}</button>
          <button className="dash-focus doc-pick-off" onClick={() => { setSel([]); anchor.current = null; }}>Clear</button>
          <span className="doc-pick-say">Shift takes the range. ⌘C copies.</span>
        </div>
      ) : null}
      {groupsBySection.map(sec => {
        const bucket = normSlot(slotItems[sec.slot]);
        const raw = bucket.title || "";
        const secLive = !!raw && liveLabel === raw;
        const here = !!liveLabel && sec.slot === hereSlot;
        const overHere = over.startsWith("sec|" + sec.slot + "|") ? over.split("|")[2] : "";
        return (
          <div key={sec.slot} className={"doc-sec" + (here ? " here" : "") + (secDrag === sec.slot ? " dragging" : "") + (sec.mark ? " marked" : "")}
            style={sec.mark?.color ? { "--mark": sec.mark.color } : undefined}
            data-over={over === sec.slot + "|" ? "1" : "0"} data-secover={overHere} {...sectionDrop(sec.slot)}>
            <div className={"doc-group" + (slidesOn ? " with-slides" : "")}>
              <div className={"doc-text doc-secline" + (secLive ? " live" : "") + (sel.includes("s:" + sec.slot) ? " picked" : "")} onContextMenu={e => openMenu(e, sectionMenu(sec))}
                {...holdProps(() => sectionMenu(sec))}>
                {/* The margin: empty at rest, the way up to the screen under the pointer. */}
                <span className="doc-gut">
                  <button className="dash-focus doc-num" onClick={e => pickLine("s:" + sec.slot, e)}
                    title="Pick this section. Shift takes the range." aria-pressed={sel.includes("s:" + sec.slot)}>§</button>
                  {raw ? (
                    <button className="dash-focus doc-put" title={secLive ? "Take off screen" : "Put on screen"} aria-label={secLive ? "Take off screen" : "Put on screen"}
                      onClick={() => (secLive ? dismiss() : castSection(sec.slot, raw, true))}>{PUT}</button>
                  ) : null}
                </span>
                {sec.mark ? <span className="doc-sectag">{sec.mark.tag}</span> : null}
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
                {secLive ? <button className="dash-focus doc-down" onClick={dismiss} title="Take off screen">on screen</button> : null}
              </div>
              {slideCell(raw ? castSection(sec.slot, raw, false) : null, secLive, raw,
                () => (secLive ? dismiss() : castSection(sec.slot, raw, true)))}
            </div>

            {sec.groups.map(g => {
              const { it, blk, seed } = g.head;
              const words = itemWords(it, blk, seed);
              const claim = it.claim || blk?.headline || "";
              const tag = raw || sec.title;
              const slide = slideOf({ item: it, block: blk, seed, title: words, claim, tag, features, assignments, games,
                notes: it.slideNotes ? (notesOf[it.id] || []) : undefined });
              const live = rowLive(g);
              // A note with a file on it says which kind of file: slides, pdf,
              // photo, clip. A plain note says nothing, the way it always has.
              const kind = it.board ? "" : it.gameId ? "game" : it.feature ? "activity"
                : blk ? (blk.media?.src ? mediaLabel(blk.media.kind).toLowerCase() : typeOf(blk.type).label.toLowerCase()) : seed ? "seed" : "";
              const kindColor = it.gameId ? hue("set") : it.feature ? hue("activity") : blk ? hue(blk.type) : hue("note");
              const kids = blk?.type === "set" ? (blk.children || []).map(id => blockOf(id)).filter(Boolean) : null;
              const bodyLine = lines.find(l => l.key === "b:" + it.id);
              const noteSlides = g.comments.filter(c => c.it.slide).map(c => {
                const nc = castLine(c);
                const on = liveLabel === nc.label;
                return { key: c.it.id, cast: nc.cast, live: on, label: nc.label, onClick: () => (on ? dismiss() : nc.go()) };
              });
              const leave =(k) => { if (pop && pop.key === k) setPop(null); };
              return (
                <div key={it.id} className={"doc-group" + (slidesOn ? " with-slides" : "") + (pickedId === it.id ? " picked" : "")
                  + (nextId === it.id ? " next" : "")} data-over={over === sec.slot + "|" + it.id ? "1" : "0"} {...dragProps(sec.slot, it.id)}>
                  <div className="doc-text">
                    {/* A row at rest is its words. The margin holds the item's
                        number, and under the pointer the number gives way to
                        the way up to the screen. The row on the screen is the
                        only filled row on the page. */}
                    <div className={"doc-row" + (live ? " live" : "") + (sel.includes(it.id) ? " picked" : "")} draggable
                      onDragStart={e => { letGo(); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", JSON.stringify({ slot: sec.slot, id: it.id })); }}
                      onContextMenu={e => openMenu(e, itemMenu(g.head))} {...holdProps(() => itemMenu(g.head))}>
                      <span className="doc-gut">
                        <button className="dash-focus doc-num" onClick={e => pickLine(it.id, e)}
                          title="Pick this line. Shift takes the range." aria-pressed={sel.includes(it.id)}>
                          {doneSet.has(it.id) ? "✓" : itemNumber[it.id] || "·"}
                        </button>
                        <button className="dash-focus doc-put" title={live ? "Take off screen" : "Put on screen"} aria-label={live ? "Take off screen" : "Put on screen"}
                          onClick={() => (live ? dismiss() : castItem(it, blk, seed, words, claim, tag, slide))}>{PUT}</button>
                      </span>
                      <Line id={it.id} value={words} placeholder="Item, or / for commands" className="lv-item" done={doneSet.has(it.id)} mark={it.mark}
                        readOnly={!!(seed || it.feature)} onSave={saveItemWords(g.head)} onKey={keyHandler(g.head)} register={register}
                        onLeaveEmpty={leaveEmpty(g.head)} onLink={linkMenu(it.id)} onType={typing(g.head)} onLeave={leave} />
                      {/* The kind is a small coloured word, and only when it says
                          something: a plain item wears none. */}
                      {it.gameId && gamesHref ? (
                        <a className="dash-focus doc-kind" style={{ "--ink": inkOf(kindColor), textDecoration: "none" }} title="Open in Games"
                          href={gamesHref + "#game=" + it.gameId} target="_blank" rel="noopener noreferrer">{kind}</a>
                      ) : kind && (blk?.type !== "note" || blk?.media?.src) ? <span className="doc-kind" style={{ "--ink": inkOf(kindColor) }}>{kind}</span> : null}
                      <LinkChips urls={[blk?.url, ...(it.links || []).map(l => l.url)]}
                        liveLabel={liveLabel} liveUrl={liveUrl} onMenu={linkMenu(it.id)} />
                      {live ? <button className="dash-focus doc-down" onClick={dismiss} title="Take off screen">on screen</button> : null}
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
                          onContextMenu={e => openMenu(e, itemMenu(c))} {...holdProps(() => itemMenu(c))} {...commentDrop(sec.slot, c.it.id)}>
                          <div className={"doc-row doc-under doc-commentrow" + (sel.includes(c.it.id) ? " picked" : "")}>
                            {/* The handle. A note is all text box, and a press on a
                                text box selects words, so the drag needs somewhere
                                that is not text. Alt+↑ and Alt+↓ move it too. */}
                            <span className="doc-grip" draggable title="Drag to move this note" aria-hidden="true"
                              onDragStart={e => {
                                letGo();
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", JSON.stringify({ slot: sec.slot, id: c.it.id }));
                                setDragging(c.it.id);
                              }}
                              onDragEnd={() => setDragging("")}>⠿</span>
                            <button className="dash-focus doc-num doc-notenum" onClick={e => pickLine(c.it.id, e)}
                              title="Pick this note. Shift takes the range." aria-pressed={sel.includes(c.it.id)}>·</button>
                            <Line id={c.it.id} value={itemWords(c.it, c.blk, c.seed)} placeholder="Note" className="lv-comment"
                              done={doneSet.has(c.it.id)} readOnly={!!(c.seed || c.it.feature)} mark={c.it.mark}
                              onSave={saveItemWords(c)} onKey={keyHandler(c)} register={register} onLeaveEmpty={leaveEmpty(c)}
                              onLink={linkMenu(c.it.id)} onType={typing(c)} onLeave={leave} />
                            <LinkChips urls={[c.blk?.url, ...(c.it.links || []).map(l => l.url)]}
                              liveLabel={liveLabel} liveUrl={liveUrl} onMenu={linkMenu(c.it.id)} />
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
      {foot}
      <Menu at={menu?.at} items={menu?.items || []} onClose={() => setMenu(null)} />
      <Pop pop={pop} list={filtered} onPick={applyPop} />
    </div>
  );
}

export const DOC_CSS = `
/* THE DAY AS A DOCUMENT. Three sizes of text and nothing else: a section is a
   heading, an item is a line, a note is quieter and set in. Every line is a
   text box that looks like text until the cursor is in it. */
.doc{display:flex;flex-direction:column;gap:var(--gap,11px)}
.doc-total{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 4px;padding:6px 2px 0;font-family:var(--font-body);font-size:15px;color:var(--text-secondary)}
.doc-foot-tools{margin-left:auto;display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px 20px}
.doc-total-n{font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums}
.doc-total.over .doc-total-n{color:var(--state-live)}
.doc-foot{margin-top:22px;padding-top:12px;border-top:1px solid var(--line-soft)}
.doc-total-more{color:var(--text-muted)}
/* A SECTION IS A CARD. Andrew, 2026-09-22: "i want each section to get the
   same treatment we gave to each day in the schedyle. Each section should
   feel like a card."

   The day was one tall panel with three sizes of text down it, which is the
   shape the schedule's weeks had before a day got a card of its own. So the
   day's own title is the heading, the sections are cards under it, and the
   panel around them went flush so these are cards on the page rather than
   cards inside a card. The rows inside a section stay as lines: every one of
   them is a text box that has to look like text until the cursor is in it,
   and a card round each would be a form.

   The card itself is the site's, out of themes.js, so a section, a panel, a
   day on the schedule and a card on the front page are the same card. */
.doc-sec{display:flex;flex-direction:column;padding:var(--pad,16px);
  background:var(--surface-card);border:var(--card-border);box-shadow:var(--card-shadow);border-radius:var(--card-radius)}
/* Dropping onto a card. A wash of grey was the old affordance and it is
   invisible on a white card, so the card takes the accent round its edge and
   the two drop marks keep saying above or below. */
/* The section the room is in, marked the way the schedule marks the week the
   class is in: the accent round the card instead of the hairline. It comes
   before the mark below, so a section carrying Enter or Exit keeps its own
   colour down the left edge. */
.doc-sec.here{border:1.5px solid var(--dash-accent)}
.doc-sec[data-over="1"]{border-color:var(--dash-accent)}
.doc-sec[data-secover="above"]{box-shadow:inset 0 3px 0 var(--dash-accent)}
.doc-sec[data-secover="below"]{box-shadow:inset 0 -3px 0 var(--dash-accent)}
.doc-sec.dragging{opacity:.45}
.doc-text.doc-secline{position:relative;flex-direction:row;align-items:center;gap:8px;flex-wrap:wrap}
/* The heading is as wide as its words, so the time chip sits beside them
   rather than at the far edge of the column. */
.doc-secline .doc-line{flex:0 1 auto;width:auto;min-width:140px;max-width:100%}
.doc-grip.doc-secgrip{position:absolute;left:-16px;top:9px}
.doc-secline.live{background:rgba(190,18,60,.07);border-radius:8px}
.doc-sec:hover .doc-secgrip,.doc-secline:focus-within .doc-secgrip{opacity:1}
/* A section with a mark: Enter or Exit. The word sits before the heading and
   the board's colour runs down the card's left edge. */
.doc-sec.marked{border-left:3px solid var(--mark,var(--dash-accent))}
.doc-sectag{flex:none;font-family:var(--font-label);font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:var(--mark,var(--dash-accent))}
/* The time a section is planned to take, as a chip beside its name. */
.doc-time{flex:none;align-self:center;width:auto;field-sizing:content;min-width:64px;max-width:120px;min-height:26px;box-sizing:border-box;padding:0 11px;border:1px solid transparent;border-radius:999px;
  background:var(--surface-sunk);font-family:var(--font-label);font-size:13px;font-weight:600;color:var(--text-secondary);text-align:center;font-variant-numeric:tabular-nums}
.doc-time::placeholder{color:var(--text-muted);font-weight:500}
.doc-time:placeholder-shown{background:none;border:1px dashed var(--line-strong);opacity:0}
.doc-secline:hover .doc-time,.doc-time:focus{opacity:1}
.doc-time:hover{border-color:var(--line-strong);background:var(--surface-sunk)}
.doc-time:focus{outline:none;border-color:var(--dash-accent);background:#fff;color:var(--text-primary)}
.doc-time[data-bad="1"]{color:var(--state-live)}
.doc-group{display:grid;grid-template-columns:minmax(0,1fr);column-gap:18px;align-items:start;border-radius:8px}
.doc-group.with-slides{grid-template-columns:minmax(0,1fr) 200px}
.doc-group[data-over="1"]{box-shadow:inset 0 2px 0 var(--dash-accent)}
.doc-group.picked .doc-num{color:var(--dash-accent);font-weight:600}
.doc-text{min-width:0;display:flex;flex-direction:column;padding:2px 0}
.doc-slide{display:flex;flex-direction:column;align-items:flex-end;gap:8px;padding:4px 0}
.doc-row{display:flex;align-items:flex-start;gap:6px;min-width:0;border-radius:8px}
.doc-row.live{background:rgba(190,18,60,.07)}
.doc-under{padding-left:62px}
.doc-comment{display:flex;flex-direction:column}
.doc-under .flow-block{padding-left:6px;margin-top:0}
.doc-under:empty{display:none}
.lv-body{color:var(--text-muted)}
/* The margin of a line. At rest it holds the item's number and nothing else;
   under the pointer the number gives way to the way up to the screen. */
.doc-gut{flex:none;width:48px;min-height:32px;display:inline-flex;align-items:center;justify-content:flex-start;gap:1px;cursor:grab}
.doc-num{font-family:var(--font-label);font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums;
  border:none;background:none;padding:0;min-width:20px;cursor:pointer;border-radius:6px;line-height:20px}
.doc-num:hover{color:var(--text-primary);background:rgba(23,19,16,.06)}
.doc-num[aria-pressed="true"]{color:var(--dash-accent);font-weight:700}
.doc-notenum{opacity:0;margin-right:2px}
.doc-commentrow:hover .doc-notenum,.doc-notenum:focus-visible,.doc-notenum[aria-pressed="true"]{opacity:1}
.doc-row.picked,.doc-secline.picked{background:color-mix(in srgb,var(--dash-accent) 10%,transparent);border-radius:8px}
.doc-pick-bar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;flex-wrap:wrap;
  margin:0 0 10px;padding:8px 12px;border-radius:10px;background:var(--surface-sunk);font-family:var(--font-body)}
.doc-pick-n{font-size:14px;font-weight:600;color:var(--text-primary)}
.doc-pick-do{min-height:32px;padding:0 14px;border-radius:999px;border:none;cursor:pointer;
  background:var(--dash-accent);color:#fff;font-family:var(--font-body);font-size:14px;font-weight:600}
.doc-pick-off{min-height:32px;padding:0 10px;border:none;background:none;cursor:pointer;
  font-family:var(--font-body);font-size:14px;font-weight:600;color:var(--text-secondary)}
.doc-pick-say{margin-left:auto;font-size:13px;color:var(--text-muted)}
.doc-put{display:none;width:26px;height:26px;padding:0;border:none;background:none;border-radius:8px;cursor:pointer;
  align-items:center;justify-content:center;color:var(--dash-accent)}
.doc-put:hover{background:rgba(23,19,16,.06)}
.doc-row:hover .doc-put,.doc-secline:hover .doc-put,.doc-put:focus-visible{display:inline-flex}
/* The number stays put under the pointer. It used to give way to the arrow,
   which is why picking a line worked on a section and nowhere else: the
   moment you reached for an item's number it was not there any more. Andrew,
   2026-09-20: "hmm but it only works for sections." Both live in the margin
   now, the number first and the arrow beside it. */
.doc-row:hover .doc-num{color:var(--text-primary)}
.doc-row.live .doc-put,.doc-secline.live .doc-put{color:var(--state-live)}
.doc-group.next .doc-num{color:var(--dash-accent);font-weight:600}
.doc-line{flex:1 1 auto;min-width:0;display:block;width:100%;box-sizing:border-box;resize:none;overflow:hidden;field-sizing:content;
  border:none;outline:none;background:transparent;border-radius:6px;padding:3px 6px;margin:0;
  font-family:var(--font-body);color:var(--text-primary)}
.doc-line:hover{background:rgba(23,19,16,.03)}
.doc-line:focus{background:rgba(23,19,16,.045)}
.doc-line::placeholder{color:var(--text-muted)}
.doc-line[readonly]{cursor:default}
.doc-line.done{text-decoration:line-through;text-decoration-thickness:1.5px;color:var(--text-muted)}
/* A highlight: the whole line, or the words of it that were selected. The
   words are coloured on a copy of the line set behind the text box. */
.doc-line.marked,.doc-line.marked:hover,.doc-line.marked:focus{background:#fef08a}
.doc-linewrap{position:relative;flex:1 1 auto;min-width:0;display:block}
.doc-lineback{position:absolute;inset:0;color:transparent;white-space:pre-wrap;overflow-wrap:break-word;pointer-events:none;user-select:none}
.doc-linewrap textarea{position:relative}
.doc-lineback mark{background:#fef08a;color:transparent;border-radius:3px}
.lv-section{font-size:20px;font-weight:600;letter-spacing:-.015em;line-height:1.3}
.lv-item{font-size:17px;font-weight:400;line-height:1.45}
.lv-comment{font-size:15px;font-weight:400;line-height:1.5;color:var(--text-secondary)}
.doc-kind{flex:none;align-self:center;font-family:var(--font-label);font-size:13px;color:var(--ink,var(--text-muted));white-space:nowrap}
/* A line showing its links: the same text, set the same way, with the web
   address as a link you can press. */
.doc-linetext{cursor:text;white-space:pre-wrap;overflow-wrap:anywhere}
.doc-inlink{color:var(--dash-accent);text-decoration:underline;text-underline-offset:2px;cursor:pointer}
/* A link: one quiet chip naming the site. Pressing it asks what to do with it. */
.doc-link{flex:none;align-self:center;min-height:24px;max-width:220px;padding:0 9px;border:1px solid var(--line-strong);border-radius:999px;background:none;cursor:pointer;
  font-family:var(--font-label);font-size:13px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.doc-link:hover{border-color:var(--dash-accent);color:var(--dash-accent)}
.doc-link.live{border-color:var(--state-live);color:var(--state-live)}
/* A handle: quiet until its line is under the pointer. */
.doc-commentrow{position:relative}
.doc-grip{position:absolute;left:40px;top:5px;width:18px;height:24px;display:inline-flex;align-items:center;justify-content:center;
  font-size:13px;color:var(--text-muted);cursor:grab;border-radius:5px;opacity:0;user-select:none}
.doc-comment:hover .doc-grip,.doc-comment:focus-within .doc-grip{opacity:1}
.doc-grip:hover{background:rgba(23,19,16,.06);color:var(--text-primary)}
.doc-comment.dragging{opacity:.45}
.doc-comment[data-over="above"]{box-shadow:inset 0 2px 0 var(--dash-accent)}
.doc-comment[data-over="below"]{box-shadow:inset 0 -2px 0 var(--dash-accent)}
.doc-down{flex:none;align-self:center;min-height:28px;padding:0 10px;border:none;background:none;border-radius:8px;cursor:pointer;
  color:var(--state-live);font-family:var(--font-label);font-size:13px;white-space:nowrap}
.doc-down:hover{background:rgba(190,18,60,.09)}
.doc-veil{position:fixed;inset:0;z-index:80}
.doc-menu{position:fixed;z-index:81;min-width:230px;max-height:420px;overflow-y:auto;background:#fff;border:1px solid rgba(23,19,16,.14);
  border-radius:12px;padding:5px;box-shadow:0 16px 38px -12px rgba(23,19,16,.42);display:flex;flex-direction:column;gap:1px}
.doc-menu button{display:flex;align-items:center;width:100%;text-align:left;background:none;border:none;cursor:pointer;
  padding:0 10px;min-height:36px;border-radius:8px;font-family:var(--font-body);font-size:15px;color:var(--text-primary)}
.doc-menu button:hover{background:rgba(23,19,16,.05)}
.doc-menu-rule{flex:none;height:1px;margin:4px 8px;background:var(--line-soft)}
.doc-menu button.danger{color:var(--state-live)}
/* The / and @ menu, under the line being typed in. */
.doc-pop{position:fixed;z-index:82;width:330px;max-height:360px;overflow-y:auto;background:#fff;border:1px solid rgba(23,19,16,.14);
  border-radius:12px;padding:5px;box-shadow:0 18px 40px -12px rgba(23,19,16,.45);font-family:var(--font-body)}
.doc-pop-head{padding:8px 10px 3px;font-family:var(--font-label);font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.doc-pop-row{display:flex;align-items:center;gap:9px;min-height:38px;padding:3px 10px;border-radius:8px;cursor:pointer}
.doc-pop-row[data-active="1"]{background:rgba(23,19,16,.07)}
.doc-pop-swatch{flex:none;width:3px;height:20px;border-radius:2px}
.doc-pop-label{flex:none;font-size:15px;color:var(--text-primary);max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.doc-pop-hint{flex:1 1 auto;min-width:0;font-size:13px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.doc-pop-none{padding:12px 10px;font-size:15px;color:var(--text-muted)}
.doc-pop-foot{margin-top:4px;padding:7px 10px 4px;border-top:1px solid var(--line-soft);font-size:13px;color:var(--text-muted)}
/* SLIDES. The same day as its slides, a grid under each section's name. */
.deck{display:flex;flex-direction:column;gap:32px;padding-top:24px;font-family:var(--font-body)}
.deck-sec{display:flex;flex-direction:column;gap:12px}
.deck-head{display:flex;align-items:center;gap:12px;min-height:34px}
.deck-name{margin:0;font-size:15px;font-weight:500;color:var(--text-secondary)}
.deck-time{flex:none;padding:0 9px;border:1px solid var(--line-strong);border-radius:999px;font-family:var(--font-label);font-size:13px;line-height:22px;color:var(--text-secondary)}
.deck-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px 16px}
.deck.is-run .deck-grid{grid-template-columns:minmax(0,1fr);gap:18px}
.deck.is-run .deck-card{display:grid;grid-template-columns:minmax(220px,340px) minmax(0,1fr);gap:20px;align-items:start}
.deck.is-run .deck-cap{flex-direction:column;gap:6px;min-height:0;padding-top:2px}
.deck.is-run .deck-n{line-height:18px}
.deck-said{display:flex;flex-direction:column;gap:6px;min-width:0;align-items:flex-start}
/* The line itself, over what is written under it: the words at reading size
   with the link beside them. */
.deck-line{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;min-width:0;width:100%}
.deck-words{font-size:17px;font-weight:600;letter-spacing:-.01em;color:var(--text-primary);
  overflow-wrap:anywhere;min-width:0}
.deck-said .doc-line{font-size:15px}
.deck-addnote{min-height:28px;padding:0 8px;margin-left:-8px;border:none;background:none;cursor:pointer;
  font-family:var(--font-body);font-size:13px;color:var(--text-muted);border-radius:7px}
.deck-addnote:hover{background:rgba(23,19,16,.06);color:var(--text-primary)}
@media (max-width:900px){.deck.is-run .deck-card{grid-template-columns:minmax(0,1fr)}}
.deck-card{min-width:0;display:flex;flex-direction:column;gap:8px}
.deck-card .slide{max-width:none;max-height:none}
.deck-blank{aspect-ratio:16/9;border-radius:8px;background:var(--surface-sunk)}
.deck-cap{display:flex;align-items:flex-start;gap:8px;min-height:34px}
.deck-n{flex:none;font-family:var(--font-label);font-size:13px;line-height:20px;color:var(--text-muted);font-variant-numeric:tabular-nums}
.deck-n.live{color:var(--state-live)}
.deck-notes{flex:1 1 auto;min-width:0;font-size:13px;line-height:20px;color:var(--text-secondary);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.deck-brush{flex:none;width:34px;height:34px;margin:-7px -6px 0 0;padding:0;border:none;background:none;border-radius:8px;cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;color:var(--text-muted)}
.deck-brush:hover{background:rgba(23,19,16,.06);color:var(--dash-accent)}
.deck-brush-set{margin:0 0 0 auto;opacity:0}
.deck-head:hover .deck-brush-set,.deck-brush-set:focus-visible{opacity:1}
/* TEACH */
.teach-empty{padding:30px 4px;font-size:15px;color:var(--text-muted)}
  font-family:var(--font-body);font-size:15px;font-weight:600;color:var(--text-primary);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  text-align:left;font-family:var(--font-body);font-size:15px;color:var(--text-secondary)}
@media (max-width:1100px){.doc-group.with-slides{grid-template-columns:minmax(0,1fr) 150px}}
`;
