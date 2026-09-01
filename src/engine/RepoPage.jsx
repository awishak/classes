// Everything I have, on one page.
//
// The blocks already lived in one model, and there was still no way to see all
// of them at once: the dashboard shows a class, and only the parts of a class
// that fit in a rail. So this reads every class store plus the shared one, puts
// the lot behind one search box, and says where each thing sits in the term.
//
// It is a table rather than a wall of cards. Cards are good for browsing a
// dozen things and bad for reading four hundred: a card puts every field on its
// own line, so nothing lines up and the eye has to start over on every one. A
// row keeps each field in a column, which is what makes a list scannable and
// what makes a column sortable. Click a heading to sort by that column.
//
// Where an item is used is worked out here rather than read off the block. A
// block carries a `scheduled` list stamped on placement, and that list is
// incomplete for anything placed before the stamping existed. Walking the day
// plans and the schedules is slower and correct, and correct is the point of a
// repository.
//
// Writing. A block is stored once and referenced everywhere, so an edit made
// here lands in every class that uses the block. Every write goes back to the
// store the block belongs to, through the same `update(prev => next)` shape the
// rest of the engine takes, which is why blocks.js and schedule.js work
// unchanged from this page.

import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { loadClass, saveClass } from "./store.js";
import { ENGINE_LIST } from "../config/registry.js";
import { typeOf, allTypes, registerTypes, SHARED_KEY, SHARED_LABEL, makeBlock, writeBlock,
  deleteBlock, stampScheduled, todayStamp } from "./blocks.js";
import { colorOfType, readColors, writeTypeColor } from "./colors.js";
import { readTypes, readAdded, readLabels, addType, renameType, resetName, dropType,
  countTypes, orphanTypes } from "./types.js";
import { normSlot, blankDay, sectionsOf } from "./dayplan.js";
import { findDuplicates, findLooseEnds, applyMerge,
  dropFlowRow, dropWeekItem, unlinkWeekItem, blockFromWeekItem } from "./tidy.js";
import { Duplicates, LooseEnds, Tags, Links } from "./RepoTidy.jsx";
import { tagIndex, lookalikes, retagPatches } from "./tags.js";
import { linkables, checkAll, linkPatches } from "./links.js";
import { weekdayOf, addScheduleItem } from "./schedule.js";
import { FACES, REPO_SLOTS, readRepoFonts, repoFontVars, writeRepoFont, resetRepoFonts,
  readRepoBold, writeRepoBold } from "./fonts.js";
import { readFilters, filterQuery, isStep, isBlank, viewWords,
  readViews, saveView, dropView, viewFor, BLANK } from "./views.js";
import { tagPatches, typePatches, sharePatches, wouldShare, tagsAcross } from "./bulk.js";
import { SEEDS } from "../config/seed-library.js";
import { newSeeds, seedPatch } from "./seeds.js";
import { roomKeys, roomItems, roomCounts, blockFromRoom } from "./room.js";
import { Seeds, Room, Kinds } from "./RepoMore.jsx";
import { genId } from "../utils.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const BG = "#faf9f7";
const SURFACE = "#f5f4f1";
const TEXT = "#171310";
const SECOND = "#3f4550";
const MUTED = "#5b6068";
const BORDER = "rgba(23,19,16,.12)";
const TAP = 44;

// The columns, in the order they read. `sort` is what the column sorts on, so
// clicking a heading sorts by the thing the heading names.
// The kind used to have a column of its own, and a column is the wrong shape
// for a label that belongs to the words: reading down a Kind column tells me
// nothing, while a kind sitting against its own title tells me what I am
// looking at without moving my eye. So the pill moved next to the words and
// the column went. Filtering by kind is the chips above the table, which is
// the better tool for the job the column was doing.
const COLS = [
  { id: "title", name: "Item", sort: b => (b.headline || b.title || "").toLowerCase() },
  { id: "where", name: "Class", sort: b => (b.owner ? b.owner.code : SHARED_LABEL) },
  { id: "used",  name: "Used",  sort: b => b.uses.length, num: true },
  { id: "tags",  name: "Tags",  sort: b => (b.tags || []).join(" ") },
  { id: "made",  name: "Made",  sort: b => String(b.created || "") },
];

export default function RepoPage() {
  const [stores, setStores] = useState(null);
  // Every filter in one object, because a filter set is one question I am
  // asking the shelf, and the question has to travel: into the address bar so
  // I can send it to myself, out of a saved view when I ask it again, and back
  // off the address bar when Back is pressed.
  const [f, setF] = useState(() => readFilters(window.location.search));
  const { q, kind, where, tag, lens } = f;
  const set = (patch) => setF(prev => ({ ...prev, ...patch }));
  const [adding, setAdding] = useState(false);
  const [typing, setTyping] = useState(false);
  const [checking, setChecking] = useState(null);   // {done, total} while the links are walked
  const [onlyBad, setOnlyBad] = useState(false);
  const [openId, setOpenId] = useState("");
  // The rows a decision is about to land on, and the name being typed for a
  // view worth keeping.
  const [picked, setPicked] = useState(() => new Set());
  const [naming, setNaming] = useState(null);
  // What the room made, read only when I ask for it. Twenty more fetches on a
  // page I open to find one article is a page that got slower for nothing.
  const [room, setRoom] = useState(null);
  const [roomKind, setRoomKind] = useState("");
  const [roomKept, setRoomKept] = useState(() => new Set());
  // The heading row sticks under the page header, so it has to know how tall
  // the page header is. Hard-coding the height was wrong the moment the header
  // wrapped to two lines, which is what a narrow window does to it.
  const [headH, setHeadH] = useState(57);
  const headRef = useRef(null);

  // The stores, held outside React as well, because a write reads the newest
  // state and then saves. Reading it off state would mean a save built on
  // whatever the last render happened to hold.
  const ref = useRef({});

  useEffect(() => { document.title = "Repository"; }, []);

  // Measured, and measured again whenever the header changes height.
  //
  // The first version of this ran once on mount, and on mount there is no
  // header to measure: the page is still showing the loading line, so the ref
  // is null and the fallback of 57px is what stuck. The number was never right
  // afterwards either, because opening Type or Add makes the header no taller
  // but narrowing the window wraps the header onto two lines. So it waits for
  // the stores to land, and a ResizeObserver watches the header from then on.
  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const measure = () => setHeadH(el.offsetHeight || 57);
    measure();
    if (typeof ResizeObserver !== "function") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stores]);

  // Every class, and the shelf that belongs to me rather than to a class.
  useEffect(() => {
    let alive = true;
    (async () => {
      const out = {};
      await Promise.all([
        ...ENGINE_LIST.map(async c => { out[c.id] = await loadClass(c.storageKey) || {}; }),
        (async () => { out.shared = await loadClass(SHARED_KEY) || {}; })(),
      ]);
      if (!alive) return;
      ref.current = out;
      setStores(out);
    })();
    return () => { alive = false; };
  }, []);

  // ─── the address bar ───
  // The filters go in the URL so a question can be sent to myself, and so Back
  // undoes the last chip rather than leaving the page. A chip is a step worth
  // keeping in the history; a letter typed into the search box and a change of
  // sort are not, so those replace the entry instead of adding one.
  const lastF = useRef(f);
  useEffect(() => {
    const want = filterQuery(f);
    if (want !== (window.location.search || "")) {
      const url = window.location.pathname + want;
      if (isStep(lastF.current, f)) window.history.pushState({}, "", url);
      else window.history.replaceState({}, "", url);
    }
    lastF.current = f;
  }, [f]);

  useEffect(() => {
    const onPop = () => setF(readFilters(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ─── what the room made ───
  // Four more stores per class, read the first time I open the lens and held
  // for the rest of the visit.
  useEffect(() => {
    if (lens !== "room" || room) return;
    let alive = true;
    (async () => {
      const got = {};
      await Promise.all(ENGINE_LIST.map(async c => {
        const k = roomKeys(c.storageKey);
        const [boards, questions, headlines, poll] = await Promise.all([
          loadClass(k.boards), loadClass(k.questions), loadClass(k.headlines), loadClass(k.poll),
        ]);
        got[c.id] = { boards, questions, headlines, poll };
      }));
      if (!alive) return;
      setRoom(ENGINE_LIST.flatMap(c => roomItems(c, got[c.id])));
    })();
    return () => { alive = false; };
  }, [lens, room]);

  const colors = readColors(stores?.shared);
  // The kinds he has added and renamed, handed to blocks.js so that typeOf
  // says the right word everywhere, including the dozen call sites that have
  // no business loading a store to answer what a block is called.
  const kinds = readTypes(stores?.shared);
  registerTypes({ added: readAdded(stores?.shared), labels: readLabels(stores?.shared) });
  const fonts = readRepoFonts(stores?.shared);
  const bold = readRepoBold(stores?.shared);
  const hue = (t) => colorOfType(colors, t);

  const keyOf = (target) =>
    target === "shared" ? SHARED_KEY : (ENGINE_LIST.find(c => c.id === target) || {}).storageKey;

  // One writer per store, in the shape every writer in the engine already
  // takes. Two writes in a row are safe: the second reads what the first put
  // in the ref, so neither lands on stale data.
  const writeTo = (target) => (mutator) => {
    const key = keyOf(target);
    if (!key) return;
    const cur = ref.current[target] || {};
    const next = mutator(cur);
    if (!next || next === cur) return;
    ref.current = { ...ref.current, [target]: next };
    setStores(ref.current);
    saveClass(key, next);
  };

  // ─── the index ───
  // Every block, with the places it turns up. Built from the day plans and the
  // schedules rather than from the stamp on the block, because the stamp is
  // only as old as the stamping.
  const items = useMemo(() => {
    if (!stores) return [];
    const rows = [];
    const uses = {};              // blockId -> [{ cls, date, section }]
    const note = (id, use) => { if (id) (uses[id] = uses[id] || []).push(use); };

    ENGINE_LIST.forEach(c => {
      const d = stores[c.id] || {};
      Object.entries(d.dayPlans || {}).forEach(([date, plan]) => {
        Object.entries(plan?.slots || {}).forEach(([slot, bucket]) => {
          const b = normSlot(bucket);
          b.items.forEach(it => note(it.blockId, { cls: c, date, section: b.title || slot }));
        });
      });
      // A schedule item stores the WEEKDAY it lands on, not the date, so the
      // date is whichever of the week's dates falls on that weekday. Without
      // this the page said "COMM 118 Wed", which is a fact about no week in
      // particular.
      (d.schedule || c.scheduleWeeks || []).forEach(w => {
        const dates = w.dates || [];
        (w.items || []).forEach(it => {
          const date = it.date ? (dates.find(x => weekdayOf(x) === it.date) || dates[0] || "") : (dates[0] || "");
          note(it.libId, { cls: c, date, section: "Assigned" });
        });
      });
    });

    const push = (block, owner, target) => {
      if (!block?.id) return;
      rows.push({ ...block, owner, target, uses: uses[block.id] || [] });
    };
    ENGINE_LIST.forEach(c => Object.values((stores[c.id] || {}).blocks || {}).forEach(b => push(b, c, c.id)));
    Object.values((stores.shared || {}).blocks || {}).forEach(b => push(b, null, "shared"));
    return rows;
  }, [stores]);

  const tags = useMemo(() => {
    const t = new Set();
    items.forEach(b => (b.tags || []).forEach(x => t.add(x)));
    return [...t].sort();
  }, [items]);

  const hits = useMemo(() => {
    const text = q.trim().toLowerCase();
    const out = items.filter(b => {
      if (kind && b.type !== kind) return false;
      if (where === "shared" && b.owner) return false;
      if (where && where !== "shared" && b.owner?.id !== where) return false;
      if (tag && !(b.tags || []).includes(tag)) return false;
      if (!text) return true;
      // The places a thing was taught are worth searching as well, so a class
      // code or a date finds everything that ran then.
      const used = b.uses.map(u => u.cls.code + " " + u.date + " " + u.section).join(" ");
      return [b.title, b.headline, b.body, b.source, b.concept, b.url, used, ...(b.tags || [])]
        .filter(Boolean).join(" ").toLowerCase().includes(text);
    });
    const col = COLS.find(c => c.id === f.col) || COLS[0];
    const sign = f.dir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      const x = col.sort(a), y = col.sort(b);
      const by = col.num ? x - y : String(x).localeCompare(String(y));
      // A tie on any column falls back to the words, so the order is stable
      // and a re-sort never shuffles the rows that matched equally.
      return (by ? by * sign : 0) || (a.title || "").localeCompare(b.title || "");
    });
    return out;
  }, [items, q, kind, where, tag, f.col, f.dir]);

  const dupes = useMemo(() => findDuplicates(items), [items]);
  const loose = useMemo(() => (stores ? findLooseEnds(stores, ENGINE_LIST) : []), [stores]);

  const tags2 = useMemo(() => tagIndex(items), [items]);
  const alike = useMemo(() => lookalikes(tags2), [tags2]);
  const linky = useMemo(() => linkables(items), [items]);

  const counts = useMemo(() => {
    const c = {};
    items.forEach(b => { c[b.type] = (c[b.type] || 0) + 1; });
    return c;
  }, [items]);

  const bySort = (col) => setF(prev => prev.col === col
    ? { ...prev, dir: prev.dir === "asc" ? "desc" : "asc" }
    : { ...prev, col, dir: col === "used" || col === "made" ? "desc" : "asc" });

  // ─── writing ───
  const addBlock = (target, patch) => {
    if (!keyOf(target)) return;
    const block = makeBlock(patch);
    writeBlock(writeTo(target), block);
    setAdding(false);
    setOpenId(block.id);
  };

  const saveBlock = (row, patch) => {
    const { owner, target, uses, ...block } = row;
    writeBlock(writeTo(target), { ...block, ...patch });
  };

  const removeBlock = (row) => {
    deleteBlock(writeTo(row.target), row.id);
    setOpenId("");
  };

  const planOf = (cls, date) =>
    ({ ...blankDay(cls), ...(((ref.current[cls.id] || {}).dayPlans || {})[date] || {}) });

  // Put a block into a section of a day, the way the dashboard does when I drag
  // one in: the row holds a pointer to the block rather than a copy of the
  // words, so editing the block still changes what the room sees.
  // The name of the section, not the key of the section: a section made by hand
  // on a day has a key like sec-m4x9q2, and a line saying a reading landed in
  // sec-m4x9q2 tells me nothing about where the reading went.
  const nameOf = (cls, day, slot) =>
    (sectionsOf(cls, day).find(([k]) => k === slot) || [])[1] || slot;

  const placeOnDay = (row, cls, date, slot) => {
    let landed = "";
    let name = "";
    writeTo(cls.id)(prev => {
      const plans = { ...(prev.dayPlans || {}) };
      const day = { ...blankDay(cls), ...(plans[date] || {}) };
      const target = slot || (sectionsOf(cls, day)[0] || [])[0];
      if (!target) { landed = "none"; return prev; }
      const slots = { ...(day.slots || {}) };
      const bucket = normSlot(slots[target]);
      if (bucket.items.some(it => it.blockId === row.id)) return prev;
      slots[target] = { ...bucket, items: [...bucket.items, { id: genId(), blockId: row.id }] };
      plans[date] = { ...day, slots };
      landed = target;
      name = nameOf(cls, day, target);
      return { ...prev, dayPlans: plans };
    });
    if (landed === "none") return "That day has no sections yet. Make one on the dashboard first.";
    if (!landed) return "Already on that day.";
    stampScheduled(writeTo(row.target), row.id, date);
    return cls.code + ", " + date + ", in " + name;
  };

  // The other destination: the week's assigned list, which is what students
  // see. Same store, same field the Schedule editor writes.
  const assignOnDay = (row, cls, date) => {
    const weeks = (ref.current[cls.id] || {}).schedule || cls.scheduleWeeks || [];
    const week = weeks.find(w => (w.dates || []).includes(date));
    if (!week) return "No week holds that date.";
    if ((week.items || []).some(i => i.libId === row.id && i.date === weekdayOf(date))) {
      return "Already assigned on that day.";
    }
    addScheduleItem(writeTo(cls.id), cls, date, {
      type: row.type === "assignment" ? "assignment" : "reading",
      title: row.title || row.headline, url: row.url || "", blockId: row.id,
    });
    stampScheduled(writeTo(row.target), row.id, date);
    return cls.code + ", " + date + ", assigned";
  };

  // ─── tidying ───
  // The merge is worked out whole and then written, one store at a time, so a
  // half-done merge is not a state the stores can be left in by a slow save.
  const mergeCluster = (cluster, survivorId, toShared) => {
    const { patches, repointed, home, losers } = applyMerge({
      stores: ref.current, classes: ENGINE_LIST, cluster, survivorId, toShared });
    const targets = Object.keys(patches);
    if (!targets.length) return "Nothing to merge.";
    targets.forEach(t => writeTo(t)(() => patches[t]));
    const where = home === "shared" ? SHARED_LABEL : (ENGINE_LIST.find(c => c.id === home) || {}).code;
    return "Merged " + losers + " away, " + repointed + " pointed at the survivor, kept with " + where + ".";
  };

  // One walk per store for a tag, because a tag lives on blocks in every store
  // at once and a rename that only reached one store is a tag split in two.
  const retag = (from, to) => {
    const patches = retagPatches({ stores: ref.current, classes: ENGINE_LIST, from, to });
    Object.entries(patches).forEach(([target, data]) => writeTo(target)(() => data));
  };

  // The answers land as they arrive so the page fills in, and the writing
  // happens once at the end rather than three hundred times.
  const checkLinks = async () => {
    if (checking) return;
    setChecking({ done: 0, total: linky.length });
    const results = await checkAll(linky, (_, done, total) => setChecking({ done, total }), todayStamp());
    const patches = linkPatches({ stores: ref.current, classes: ENGINE_LIST, results, index: items });
    Object.entries(patches).forEach(([target, data]) => writeTo(target)(() => data));
    setChecking(null);
  };

  const dropEnd = (le) => writeTo(le.cls.id)(prev =>
    le.kind === "flow" ? dropFlowRow(prev, le) : dropWeekItem(prev, le.cls, le));

  const unlinkEnd = (le) => writeTo(le.cls.id)(prev => unlinkWeekItem(prev, le.cls, le));

  // The repair worth making. A week item already holds the words and the link,
  // so the block it was standing in for can simply be made.
  const makeBlockFrom = (le) => {
    const kind = le.type === "assignment" ? "assignment" : le.type === "activity" ? "activity" : "link";
    const block = makeBlock({ type: kind, title: le.words || hostOf(le.url) || "Untitled", url: le.url || "" });
    writeTo(le.cls.id)(prev => blockFromWeekItem(prev, le.cls, le, block));
  };

  // ─── many rows at once ───
  // Every one of these is worked out whole and then written, one store at a
  // time, so a change across five stores is one save per store rather than one
  // save per row.
  const chosen = items.filter(b => picked.has(b.id));
  const writeAll = (patches) => Object.entries(patches || {}).forEach(([t, data]) => writeTo(t)(() => data));
  const unpick = () => setPicked(new Set());

  const pickOne = (id) => setPicked(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const pickAll = () => setPicked(prev => {
    const every = hits.length > 0 && hits.every(b => prev.has(b.id));
    if (every) return new Set();
    return new Set([...prev, ...hits.map(b => b.id)]);
  });

  const bulkTag = (add, remove) => {
    const patches = tagPatches({ stores: ref.current, classes: ENGINE_LIST, ids: [...picked], add, remove });
    writeAll(patches);
    return Object.keys(patches).length;
  };
  const bulkType = (type) =>
    writeAll(typePatches({ stores: ref.current, classes: ENGINE_LIST, ids: [...picked], type }));
  const bulkShare = () =>
    writeAll(sharePatches({ stores: ref.current, classes: ENGINE_LIST, ids: [...picked] }));

  // One write per store rather than one per block, which matters at forty
  // rows: every save here carries the whole store and takes a backup first.
  const stampMany = (rows, date) => {
    const byStore = {};
    rows.forEach(r => { (byStore[r.target] = byStore[r.target] || []).push(r.id); });
    Object.entries(byStore).forEach(([target, ids]) => writeTo(target)(prev => {
      const blocks = { ...(prev.blocks || {}) };
      let touched = 0;
      ids.forEach(id => {
        const b = blocks[id];
        if (!b || (b.scheduled || []).includes(date)) return;
        blocks[id] = { ...b, scheduled: [...(b.scheduled || []), date] };
        touched++;
      });
      return touched ? { ...prev, blocks } : prev;
    }));
  };

  const bulkPlace = (cls, date, slot) => {
    if (!chosen.length) return "Nothing is selected.";
    let landed = "";
    let name = "";
    let added = 0;
    writeTo(cls.id)(prev => {
      const plans = { ...(prev.dayPlans || {}) };
      const day = { ...blankDay(cls), ...(plans[date] || {}) };
      const target = slot || (sectionsOf(cls, day)[0] || [])[0];
      if (!target) { landed = "none"; return prev; }
      const slots = { ...(day.slots || {}) };
      const bucket = normSlot(slots[target]);
      const have = new Set(bucket.items.map(it => it.blockId));
      const rows = chosen.filter(r => !have.has(r.id)).map(r => ({ id: genId(), blockId: r.id }));
      if (!rows.length) return prev;
      added = rows.length;
      landed = target;
      name = nameOf(cls, day, target);
      slots[target] = { ...bucket, items: [...bucket.items, ...rows] };
      plans[date] = { ...day, slots };
      return { ...prev, dayPlans: plans };
    });
    if (landed === "none") return "That day has no sections yet. Make one on the dashboard first.";
    if (!added) return "All " + chosen.length + " are on that day already.";
    stampMany(chosen, date);
    return added + " into " + name + ", " + cls.code + " on " + date;
  };

  const bulkAssign = (cls, date) => {
    if (!chosen.length) return "Nothing is selected.";
    let done = 0;
    chosen.forEach(row => { if (assignOnDay(row, cls, date).endsWith("assigned")) done++; });
    if (!done) return "All " + chosen.length + " are assigned on that day already.";
    return done + " assigned, " + cls.code + " on " + date;
  };

  // Every block carrying one kind, moved onto another. The same patch builder
  // the bulk bar uses, over the whole shelf rather than over a selection, which
  // is what rescues blocks left behind by a kind that was deleted.
  const retypeAll = (from, to) => {
    const ids = items.filter(b => b.type === from).map(b => b.id);
    writeAll(typePatches({ stores: ref.current, classes: ENGINE_LIST, ids, type: to }));
  };

  // ─── saved views ───
  const views = readViews(stores?.shared);
  const pinned = viewFor(views, f);
  const sayView = (x) => viewWords(x, { classes: ENGINE_LIST, label: (id) => typeOf(id).label, sharedLabel: SHARED_LABEL });
  const pinView = (name) => {
    saveView(writeTo("shared"), { id: genId(), name: (name || "").trim() || sayView(f), filters: { ...f }, at: todayStamp() });
    setNaming(null);
  };

  // ─── the seed library ───
  const fresh = newSeeds(SEEDS, items);
  const bringSeeds = (list) => {
    if (!list.length) return;
    writeTo("shared")(prev => {
      const blocks = { ...(prev.blocks || {}) };
      list.forEach(seed => {
        const patch = seedPatch(seed);
        if (!blocks[patch.id]) blocks[patch.id] = makeBlock(patch);
      });
      return { ...prev, blocks };
    });
  };

  // ─── what the room made ───
  // The class chips filter the room too. The shared shelf holds none of this
  // material, so that one chip is left out of the question rather than
  // answering it with an empty page.
  const roomHits = (room || []).filter(it => {
    if (roomKind && it.kind !== roomKind) return false;
    if (where && where !== "shared" && it.cls.id !== where) return false;
    const text = q.trim().toLowerCase();
    return !text || it.words.includes(text);
  });
  const keepRoom = (item) => {
    writeBlock(writeTo(item.cls.id), makeBlock(blockFromRoom(item)));
    setRoomKept(prev => new Set(prev).add(item.key));
  };

  if (!stores) {
    return <div style={{ minHeight: "100vh", background: BG, fontFamily: F, display: "grid",
      placeItems: "center", color: MUTED }}>Reading everything…</div>;
  }

  const chip = (on, text, onClick, color) => (
    <button key={text} className="repo-focus repo-chip" onClick={onClick} aria-pressed={on}
      style={on ? { background: color || TEXT, borderColor: color || TEXT, color: "#fff" } : undefined}>
      {text}
    </button>
  );

  return (
    <div className={"repo-page" + (bold ? " repo-bold" : "")}
      style={{ minHeight: "100vh", background: BG, color: TEXT,
        "--repo-top": headH + "px", ...repoFontVars(fonts) }}>
      <style>{CSS}</style>

      <header className="repo-head" ref={headRef}>
        <div className="repo-head-in">
          <a href="/" className="repo-back">← All classes</a>
          <h1 className="repo-title">Repository</h1>
          <span className="repo-count">{items.length} things</span>
          <a className="repo-focus repo-chip repo-ideas" href="/repo/ideas">Ideas</a>
          <button className="repo-focus repo-chip" onClick={() => setTyping(!typing)} aria-pressed={typing}>Type</button>
          <button className="repo-focus repo-add" onClick={() => setAdding(true)}>+ Add</button>
        </div>
      </header>

      <div className="repo-body">
        <input className="repo-search" value={q} onChange={e => set({ q: e.target.value })}
          placeholder="Search everything" aria-label="Search the repository" autoFocus />

        <div className="repo-filters">
          <div className="repo-row">
            {chip(!kind, "Everything", () => set({ kind: "" }))}
            {kinds.filter(t => counts[t.id]).map(t =>
              chip(kind === t.id, t.label + " " + counts[t.id], () => set({ kind: kind === t.id ? "" : t.id }), hue(t.id)))}
          </div>
          <div className="repo-row">
            {chip(!lens, "The whole shelf", () => set({ lens: "" }))}
            {chip(lens === "dupes", "Duplicates " + dupes.length,
              () => set({ lens: lens === "dupes" ? "" : "dupes" }), "#b45309")}
            {chip(lens === "loose", "Loose ends " + loose.length,
              () => set({ lens: lens === "loose" ? "" : "loose" }), "#9f1239")}
            {chip(lens === "tags", "Tags " + tags2.length,
              () => set({ lens: lens === "tags" ? "" : "tags" }), "#7c3aed")}
            {chip(lens === "links", "Links " + linky.length,
              () => set({ lens: lens === "links" ? "" : "links" }), "#0369a1")}
            {chip(lens === "seeds", "Seed library " + (fresh.length ? fresh.length + " new" : "all in"),
              () => set({ lens: lens === "seeds" ? "" : "seeds" }), "#9f1239")}
            {chip(lens === "room", "What the room made" + (room ? " " + room.length : ""),
              () => set({ lens: lens === "room" ? "" : "room" }), "#0f766e")}
            {chip(lens === "kinds", "Kinds " + kinds.length,
              () => set({ lens: lens === "kinds" ? "" : "kinds" }), "#4b5563")}
          </div>
          <div className="repo-row">
            {chip(!where, "Every class", () => set({ where: "" }))}
            {ENGINE_LIST.map(c => chip(where === c.id, c.code, () => set({ where: where === c.id ? "" : c.id }), c.accent))}
            {chip(where === "shared", SHARED_LABEL, () => set({ where: where === "shared" ? "" : "shared" }))}
            {tags.length ? (
              <select className="repo-select" value={tag} onChange={e => set({ tag: e.target.value })} aria-label="Filter by tag">
                <option value="">Any tag ({tags.length})</option>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : null}
            <span className="repo-hits">{hits.length} {hits.length === 1 ? "match" : "matches"}</span>
          </div>
          <Views views={views} pinned={pinned} blank={isBlank(f)} naming={naming} say={sayView} here={f}
            onGo={v => { setF({ ...BLANK, ...v.filters }); setNaming(null); }}
            onName={setNaming} onPin={pinView} onDrop={id => dropView(writeTo("shared"), id)}
            onClear={() => setF({ ...BLANK })} />
        </div>

        {typing ? (
          <TypeSheet fonts={fonts} bold={bold} onClose={() => setTyping(false)}
            onFont={(slot, faceId) => writeRepoFont(writeTo("shared"), slot, faceId)}
            onBold={on => writeRepoBold(writeTo("shared"), on)}
            onReset={() => resetRepoFonts(writeTo("shared"))} />
        ) : null}

        {adding ? <AddForm onAdd={addBlock} onClose={() => setAdding(false)} hue={hue} /> : null}

        {lens === "dupes" ? <Duplicates clusters={dupes} hue={hue} onMerge={mergeCluster} /> : null}
        {lens === "loose" ? (
          <LooseEnds ends={loose} onDrop={dropEnd} onUnlink={unlinkEnd} onMakeBlock={makeBlockFrom} />
        ) : null}
        {lens === "tags" ? <Tags index={tags2} alike={alike} onRetag={retag} /> : null}
        {lens === "links" ? (
          <Links blocks={linky} busy={!!checking} done={checking?.done || 0} total={checking?.total || 0}
            onCheck={checkLinks} onlyBad={onlyBad} setOnlyBad={setOnlyBad} />
        ) : null}
        {lens === "kinds" ? (
          <Kinds types={kinds} counts={counts} orphans={orphanTypes(items, kinds)} hue={hue}
            onAdd={(label, hint) => addType(writeTo("shared"), label, hint)}
            onRename={(id, label) => renameType(writeTo("shared"), id, label)}
            onReset={id => resetName(writeTo("shared"), id)}
            onColor={(id, sw) => writeTypeColor(writeTo("shared"), id, sw)}
            onDrop={id => dropType(writeTo("shared"), id)}
            onRetype={(from, to) => retypeAll(from, to)} />
        ) : null}
        {lens === "seeds" ? (
          <Seeds seeds={SEEDS} fresh={fresh} onBring={s => bringSeeds([s])} onBringAll={() => bringSeeds(fresh)} />
        ) : null}
        {lens === "room" ? (
          <Room items={roomHits} counts={roomCounts(room || [])} kind={roomKind} setKind={setRoomKind}
            busy={!room} kept={roomKept} onKeep={keepRoom} />
        ) : null}

        {lens ? null : hits.length ? (
          <div className="repo-sheet">
            <table className="repo-table">
              <thead>
                <tr>
                  <th className="repo-th repo-th-pick" scope="col">
                    <label className="repo-pick-all">
                      <input type="checkbox" checked={hits.length > 0 && hits.every(b => picked.has(b.id))}
                        onChange={pickAll} aria-label={"Select all " + hits.length + " matches"} />
                    </label>
                  </th>
                  {COLS.map(c => (
                    <th key={c.id} className={"repo-th repo-th-" + c.id} scope="col"
                      aria-sort={f.col === c.id ? (f.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <button className="repo-focus repo-sort" onClick={() => bySort(c.id)}
                        aria-label={"Sort by " + c.name}>
                        {c.name}
                        <span className={"repo-arrow" + (f.col === c.id ? " repo-arrow-on" : "")}>
                          {f.col === c.id ? (f.dir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hits.map(b => (
                  <Fragment key={b.id}>
                    <Row block={b} hue={hue} open={openId === b.id} onTag={t => set({ tag: t })}
                      picked={picked.has(b.id)} onPick={() => pickOne(b.id)}
                      onOpen={() => setOpenId(openId === b.id ? "" : b.id)} />
                    {openId === b.id ? (
                      <tr className="repo-detail-row">
                        <td colSpan={COLS.length + 1} style={{ "--kind": hue(b.type) }}>
                          <Detail key={b.id} block={b} hue={hue} planOf={planOf} stores={stores}
                            onSave={p => saveBlock(b, p)} onDelete={() => removeBlock(b)}
                            onPlace={(cls, date, slot) => placeOnDay(b, cls, date, slot)}
                            onAssign={(cls, date) => assignOnDay(b, cls, date)} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="repo-empty">Nothing matches. Try fewer words, or clear a filter.</p>
        )}

        {picked.size ? (
          <Bulk n={picked.size} rows={chosen} planOf={planOf} stores={stores}
            onTag={bulkTag} onType={bulkType} onShare={bulkShare} onClear={unpick}
            onPlace={bulkPlace} onAssign={bulkAssign} />
        ) : null}
      </div>
    </div>
  );
}

// The filter sets worth keeping, pinned to the top of the page.
//
// The filters I set are the questions I keep asking, and rebuilding a question
// chip by chip every time is how a good filter goes unused. A view is the
// question named and kept in the shared store, so the same view is there on
// any machine I open the repository on.
export function Views({ views, pinned, blank, naming, here, say, onGo, onName, onPin, onDrop, onClear }) {
  if (!views.length && blank) return null;
  return (
    <div className="repo-row repo-views">
      <span className="repo-label">Saved views</span>
      {views.map(v => (
        <span key={v.id} className={"repo-view" + (pinned?.id === v.id ? " repo-view-on" : "")}>
          <button className="repo-focus repo-view-go" onClick={() => onGo(v)} title={say(v.filters)}>
            {v.name}
          </button>
          <button className="repo-focus repo-view-x" onClick={() => onDrop(v.id)}
            aria-label={"Unpin the view called " + v.name}>×</button>
        </span>
      ))}
      {blank ? null : pinned ? (
        <span className="repo-verdict repo-verdict-good">Pinned as {pinned.name}</span>
      ) : naming === null ? (
        <button className="repo-focus repo-chip" onClick={() => onName(say(here))}>Pin this view</button>
      ) : (
        <>
          <input className="repo-input repo-tag-in" value={naming} autoFocus
            onChange={e => onName(e.target.value)} aria-label="A name for this view"
            onKeyDown={e => { if (e.key === "Enter") onPin(naming); if (e.key === "Escape") onName(null); }} />
          <button className="repo-focus repo-save" onClick={() => onPin(naming)}>Pin it</button>
          <button className="repo-focus repo-chip" onClick={() => onName(null)}>Cancel</button>
        </>
      )}
      {blank ? null : <button className="repo-focus repo-chip" onClick={onClear}>Clear the filters</button>}
    </div>
  );
}

// What can be done to everything selected at once.
//
// Retagging four hundred rows one at a time is a job nobody ever does, which is
// why the tags on this shelf are wrong and stay wrong. The bar sits at the
// bottom of the window while a selection is live, because the selection is
// made by running down a long list and the decision has to still be in reach
// at the bottom of the list.
export function Bulk({ n, rows, planOf, stores, onTag, onType, onShare, onClear, onPlace, onAssign }) {
  const [adding, setAdding] = useState("");
  const [said, setSaid] = useState("");
  const [placing, setPlacing] = useState(false);
  const carried = tagsAcross(rows, rows.map(r => r.id));
  const owned = wouldShare(rows, rows.map(r => r.id));

  const addTag = () => {
    const t = adding.trim();
    if (!t) return;
    onTag([t], []);
    setAdding("");
    setSaid(t + " added to " + n + " " + (n === 1 ? "block" : "blocks"));
  };

  return (
    <div className="repo-bulk">
      <div className="repo-row">
        <span className="repo-bulk-n">{n + " selected"}</span>
        <input className="repo-input repo-tag-in" value={adding} placeholder="Add a tag"
          aria-label="A tag for everything selected" onChange={e => setAdding(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addTag(); }} />
        <button className="repo-focus repo-save" disabled={!adding.trim()} onClick={addTag}>Add the tag</button>
        {carried.length ? (
          <select className="repo-select" value="" aria-label="Take a tag away"
            onChange={e => {
              if (!e.target.value) return;
              onTag([], [e.target.value]);
              setSaid(e.target.value + " taken off " + n + " " + (n === 1 ? "block" : "blocks"));
            }}>
            <option value="">Take a tag away</option>
            {carried.map(t => <option key={t.tag} value={t.tag}>{t.tag} ({t.n})</option>)}
          </select>
        ) : null}
        <button className="repo-focus repo-chip" onClick={onClear} style={{ marginLeft: "auto" }}>
          Clear the selection
        </button>
      </div>
      <div className="repo-row">
        <span className="repo-label">Change the kind</span>
        {allTypes().map(t => (
          <button key={t.id} className="repo-focus repo-chip"
            onClick={() => { onType(t.id); setSaid(n + " now " + t.label.toLowerCase()); }}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="repo-row">
        <button className="repo-focus repo-chip" disabled={!owned}
          onClick={() => { onShare(); setSaid(owned + " moved to " + SHARED_LABEL); }}>
          {owned ? "Move " + owned + " to " + SHARED_LABEL : "All of them are on " + SHARED_LABEL + " already"}
        </button>
        <button className="repo-focus repo-chip" onClick={() => setPlacing(!placing)} aria-pressed={placing}>
          Put the selection on a day
        </button>
        {said ? <span className="repo-said">{said}</span> : null}
      </div>
      {placing ? (
        <Place what={"Put the " + n + " selected on a day"} planOf={planOf} stores={stores}
          onPlace={onPlace} onAssign={onAssign} />
      ) : null}
    </div>
  );
}

// One thing, on one line. Exported so the smoke test can render a row, the
// open row and the placer, none of which a server render of the page itself
// ever reaches: the page is behind a load, and a loading screen proves nothing.
export function Row({ block, hue, open, onOpen, onTag, picked, onPick }) {
  const t = typeOf(block.type);
  const color = hue(block.type);
  const words = block.headline || block.title;
  const sub = block.headline && block.title !== block.headline ? block.title : "";
  return (
    <tr className={"repo-tr" + (open ? " repo-tr-open" : "") + (picked ? " repo-tr-picked" : "")}
      style={{ "--kind": color }}>
      <td className="repo-td repo-td-pick">
        <label className="repo-pick">
          <input type="checkbox" checked={!!picked} onChange={() => onPick && onPick()}
            aria-label={"Select " + (words || "this block")} />
        </label>
      </td>
      <td className="repo-td repo-td-title">
        <button className="repo-focus repo-words" onClick={onOpen} aria-expanded={open}>
          <span className="repo-caret">{open ? "▾" : "▸"}</span>
          <span className="repo-words-in">
            <span>{words || "Untitled"}</span>
            <span className="repo-kind">{t.label}</span>
            {sub ? <span className="repo-sub">{sub}</span> : null}
          </span>
        </button>
      </td>
      <td className="repo-td repo-td-where">
        {block.owner
          ? <span className="repo-owner" style={{ color: block.owner.accent }}>{block.owner.code}</span>
          : <span className="repo-owner">{SHARED_LABEL}</span>}
      </td>
      <td className="repo-td repo-td-used">
        {block.uses.length ? (
          <button className="repo-focus repo-uses" onClick={onOpen}
            title={block.uses.map(u => u.cls.code + ", " + u.date + ", in " + u.section).join("; ")}>
            <b>{block.uses.length}</b> {[...new Set(block.uses.map(u => u.cls.code))].join(", ")}
          </button>
        ) : <span className="repo-unused">Never</span>}
      </td>
      <td className="repo-td repo-td-tags">
        {(block.tags || []).slice(0, 3).map(x => (
          <button key={x} className="repo-focus repo-tag" onClick={() => onTag(x)}>{x}</button>
        ))}
        {(block.tags || []).length > 3 ? <span className="repo-plus">+{block.tags.length - 3}</span> : null}
      </td>
      <td className="repo-td repo-td-made">{block.created || ""}</td>
    </tr>
  );
}

// The open row: what the thing says, everywhere the thing has been, and the two
// things I ever want to do to a thing from here — fix the words, or put the
// thing on a day.
export function Detail({ block, hue, planOf, stores, onSave, onDelete, onPlace, onAssign }) {
  const [draft, setDraft] = useState({
    type: block.type, title: block.title || "", headline: block.headline || "",
    url: block.url || "", body: block.body || "", concept: block.concept || "",
    source: block.source || "", tags: (block.tags || []).join(", "),
  });
  const [saved, setSaved] = useState(false);
  const [sure, setSure] = useState(false);
  const set = (k, v) => { setDraft(d => ({ ...d, [k]: v })); setSaved(false); };

  const commit = () => {
    onSave({
      type: draft.type, title: draft.title.trim(), headline: draft.headline.trim(),
      url: draft.url.trim(), body: draft.body.trim(), concept: draft.concept.trim(),
      source: draft.source.trim(), tags: draft.tags.split(",").map(x => x.trim()).filter(Boolean),
    });
    setSaved(true);
  };

  return (
    <div className="repo-detail">
      <div className="repo-pane">
        <div className="repo-row">
          {allTypes().map(t => (
            <button key={t.id} className="repo-focus repo-chip" onClick={() => set("type", t.id)}
              aria-pressed={draft.type === t.id}
              style={draft.type === t.id ? { background: hue(t.id), borderColor: hue(t.id), color: "#fff" } : undefined}>
              {t.label}
            </button>
          ))}
        </div>
        <label className="repo-field">
          <span className="repo-label">Title</span>
          <input className="repo-input" value={draft.title} onChange={e => set("title", e.target.value)} />
        </label>
        <label className="repo-field">
          <span className="repo-label">Headline, what the room reads</span>
          <input className="repo-input" value={draft.headline} onChange={e => set("headline", e.target.value)} />
        </label>
        <label className="repo-field">
          <span className="repo-label">Link</span>
          <input className="repo-input" value={draft.url} onChange={e => set("url", e.target.value)} placeholder="https://…" />
        </label>
        <label className="repo-field">
          <span className="repo-label">Body</span>
          <textarea className="repo-input repo-area" value={draft.body} onChange={e => set("body", e.target.value)} />
        </label>
        <div className="repo-pair">
          <label className="repo-field">
            <span className="repo-label">Concept</span>
            <input className="repo-input" value={draft.concept} onChange={e => set("concept", e.target.value)} />
          </label>
          <label className="repo-field">
            <span className="repo-label">Source</span>
            <input className="repo-input" value={draft.source} onChange={e => set("source", e.target.value)} />
          </label>
        </div>
        <label className="repo-field">
          <span className="repo-label">Tags, separated by commas</span>
          <input className="repo-input" value={draft.tags} onChange={e => set("tags", e.target.value)} />
        </label>
        <div className="repo-row">
          <button className="repo-focus repo-save" onClick={commit}>Save the changes</button>
          {saved ? <span className="repo-said">Saved everywhere the block is used.</span> : null}
          {block.url ? (
            <a className="repo-focus repo-link" href={block.url} target="_blank" rel="noopener noreferrer">
              {hostOf(block.url)} ↗
            </a>
          ) : null}
          {sure ? (
            <>
              <button className="repo-focus repo-danger" onClick={onDelete}>Yes, delete</button>
              <button className="repo-focus repo-chip" onClick={() => setSure(false)}>Keep the block</button>
              <span className="repo-warn">
                {block.uses.length
                  ? "This block is on " + block.uses.length + " days and will go blank on each one."
                  : "Nothing points at this block."}
              </span>
            </>
          ) : (
            <button className="repo-focus repo-chip repo-del" onClick={() => setSure(true)}>Delete</button>
          )}
        </div>
      </div>

      <div className="repo-pane repo-pane-side">
        <Place block={block} planOf={planOf} stores={stores} onPlace={onPlace} onAssign={onAssign} />
        <div className="repo-where">
          <span className="repo-label">Everywhere the block turns up</span>
          {block.uses.length ? (
            <ul className="repo-list">
              {block.uses.map((u, i) => (
                <li key={i}>
                  <a className="repo-focus repo-use" href={u.cls.path + "/dashboard"}>
                    <b style={{ color: u.cls.accent }}>{u.cls.code}</b> {u.date} · {u.section}
                  </a>
                </li>
              ))}
            </ul>
          ) : <p className="repo-unused">Never used. Put the block on a day above.</p>}
        </div>
      </div>
    </div>
  );
}

// Put a thing on a day, without going back to a dashboard to do the placing.
export function Place({ block, what, planOf, stores, onPlace, onAssign }) {
  const [clsId, setClsId] = useState(ENGINE_LIST[0].id);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [said, setSaid] = useState("");

  const cls = ENGINE_LIST.find(c => c.id === clsId) || ENGINE_LIST[0];
  const weeks = (stores[clsId] || {}).schedule || cls.scheduleWeeks || [];
  // What the day is actually made of, names and all: a section made by hand on
  // the day counts, and four of the five classes have no sequence at all.
  const slots = date ? sectionsOf(cls, planOf(cls, date)) : [];

  return (
    <div className="repo-place">
      <span className="repo-label">{what || "Put the block on a day"}</span>
      <div className="repo-row">
        <select className="repo-select" value={clsId} aria-label="Which class"
          onChange={e => { setClsId(e.target.value); setDate(""); setSlot(""); setSaid(""); }}>
          {ENGINE_LIST.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <select className="repo-select" value={date} aria-label="Which day" disabled={!weeks.length}
          onChange={e => { setDate(e.target.value); setSlot(""); setSaid(""); }}>
          <option value="">Which day</option>
          {weeks.map((w, i) => (
            <optgroup key={w.id || i} label={"Week " + (i + 1) + (w.topic ? " · " + w.topic : "")}>
              {(w.dates || []).map(d => <option key={d} value={d}>{d}</option>)}
            </optgroup>
          ))}
        </select>
        {slots.length ? (
          <select className="repo-select" value={slot} aria-label="Which section of the day"
            onChange={e => setSlot(e.target.value)}>
            <option value="">First section</option>
            {slots.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select>
        ) : null}
      </div>
      <div className="repo-row">
        <button className="repo-focus repo-save" disabled={!date} onClick={() => setSaid(onPlace(cls, date, slot))}>
          Into the flow
        </button>
        <button className="repo-focus repo-chip" disabled={!date} onClick={() => setSaid(onAssign(cls, date))}>
          Onto the readings
        </button>
        {said ? <span className="repo-said">{said}</span> : null}
        {!weeks.length ? <span className="repo-warn">{cls.code} has no weeks on the schedule yet.</span> : null}
        {date && !slots.length ? (
          <span className="repo-warn">That day has no sections yet. Make one on the dashboard first.</span>
        ) : null}
      </div>
    </div>
  );
}

// The repository's own type. The dashboard has had a chooser since the day I
// said I hated the font on the flow; this is the same eight faces on a screen
// that is doing a different job, so the choice is its own rather than shared
// with the dashboard. Each face is drawn in itself, because the name of a font
// tells me nothing about reading four hundred rows of it.
export function TypeSheet({ fonts, bold, onFont, onBold, onReset, onClose }) {
  return (
    <div className="repo-type-sheet">
      <div className="repo-row">
        <span className="repo-label">Type, on this page only</span>
        <button className="repo-focus repo-chip" onClick={onReset} style={{ marginLeft: "auto" }}>Put the type back</button>
        <button className="repo-focus repo-chip" onClick={onClose}>Done</button>
      </div>
      {REPO_SLOTS.map(sl => (
        <div key={sl.id} className="repo-type-row">
          <span className="repo-type-name">{sl.label}</span>
          <div className="repo-row">
            {FACES.map(f => (
              <button key={f.id} className="repo-focus repo-face" onClick={() => onFont(sl.id, f.id)}
                aria-pressed={fonts[sl.id] === f.id} style={{ fontFamily: f.stack }}
                data-on={fonts[sl.id] === f.id ? "yes" : "no"}>
                {f.name}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="repo-type-row">
        <span className="repo-type-name">Heavier rows</span>
        <button className="repo-focus repo-chip" onClick={() => onBold(!bold)} aria-pressed={bold}
          style={bold ? { background: TEXT, borderColor: TEXT, color: "#fff" } : undefined}>
          {bold ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}

function AddForm({ onAdd, onClose, hue }) {
  const [type, setType] = useState("link");
  const [target, setTarget] = useState("shared");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

  const commit = () => {
    if (!title.trim() && !url.trim()) return;
    onAdd(target, {
      type, title: title.trim() || hostOf(url) || "Untitled", url: url.trim(), body: body.trim(),
      tags: tags.split(",").map(x => x.trim()).filter(Boolean),
    });
  };

  return (
    <div className="repo-add-form">
      <div className="repo-row">
        {allTypes().map(t => (
          <button key={t.id} className="repo-focus repo-chip" onClick={() => setType(t.id)}
            aria-pressed={type === t.id}
            style={type === t.id ? { background: hue(t.id), borderColor: hue(t.id), color: "#fff" } : undefined}>
            {t.label}
          </button>
        ))}
      </div>
      <input className="repo-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" autoFocus />
      <input className="repo-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
      <textarea className="repo-input repo-area" value={body} onChange={e => setBody(e.target.value)}
        placeholder="Anything worth keeping alongside" />
      <input className="repo-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags, separated by commas" />
      <div className="repo-row" style={{ alignItems: "center" }}>
        <span className="repo-label">Keep it with</span>
        <select className="repo-select" value={target} onChange={e => setTarget(e.target.value)} aria-label="Which store">
          <option value="shared">{SHARED_LABEL}, so every class can reach the item</option>
          {ENGINE_LIST.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <button className="repo-focus repo-save" onClick={commit}>Add to the repository</button>
        <button className="repo-focus repo-chip" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

const CSS = `
.repo-focus:focus-visible{outline:2.5px solid #171310;outline-offset:2px;border-radius:8px}
.repo-page{font-family:var(--repo-ui,${F})}
.repo-head{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid ${BORDER}}
.repo-head-in{max-width:1240px;margin:0 auto;padding:12px 20px;display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.repo-back{font-size:14px;color:${MUTED};text-decoration:none}
.repo-back:hover{color:${TEXT}}
.repo-title{margin:0;font-size:20px;font-weight:700;letter-spacing:-.02em}
.repo-count{font-family:${MONO};font-size:12px;color:${MUTED}}
.repo-add{min-height:36px;padding:0 15px;border-radius:11px;border:none;background:${TEXT};
  color:#fff;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600}
.repo-ideas{margin-left:auto;min-height:36px;display:inline-flex;align-items:center;text-decoration:none}
.repo-add:hover{opacity:.88}
.repo-body{max-width:1240px;margin:0 auto;padding:18px 20px 60px;display:flex;flex-direction:column;gap:14px}
.repo-search{width:100%;min-height:56px;padding:0 18px;border-radius:14px;border:1px solid ${BORDER};
  background:#fff;font-family:inherit;font-size:19px;color:${TEXT}}
.repo-search:focus{outline:none;border-color:${TEXT}}
.repo-filters{display:flex;flex-direction:column;gap:7px}
.repo-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.repo-chip{min-height:32px;padding:0 12px;border-radius:999px;border:1px solid ${BORDER};background:#fff;
  cursor:pointer;font-family:inherit;font-size:13.5px;color:${SECOND}}
.repo-chip:hover{border-color:${TEXT};color:${TEXT}}
.repo-chip:disabled{opacity:.45;cursor:default}
.repo-select{min-height:32px;padding:0 8px;border-radius:9px;border:1px solid ${BORDER};background:#fff;
  font-family:inherit;font-size:13.5px;color:${TEXT}}
.repo-hits{font-family:${MONO};font-size:12px;color:${MUTED};margin-left:auto}
.repo-label{font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:${MUTED}}

/* The sheet. One row a thing, one column a field, so the eye runs down a
   column instead of starting over on every card. */
/* No overflow on the sheet. An ancestor with overflow:hidden becomes the
   scrollport a sticky child sticks inside, and this sheet never scrolls, so
   the heading row had nothing to stick to and scrolled away with everything
   else. The corners are rounded on the cells instead of clipped on the box. */
.repo-sheet{background:#fff;border-radius:14px;
  box-shadow:0 1px 2px rgba(23,19,16,.05),0 0 0 1px rgba(23,19,16,.07)}
/* Separate rather than collapse, because a collapsed border belongs to the
   table and stays behind when the heading row sticks, which leaves the stuck
   row with no bottom edge. */
.repo-table{width:100%;border-collapse:separate;border-spacing:0;table-layout:auto}
.repo-table thead th:first-child{border-top-left-radius:14px}
.repo-table thead th:last-child{border-top-right-radius:14px}
.repo-table tr:last-child td:first-child{border-bottom-left-radius:14px}
.repo-table tr:last-child td:last-child{border-bottom-right-radius:14px}
/* The heading row sticks under the page header, at whatever height the page
   header actually is. Its cells carry the same 4px edge and padding the rows
   carry, so a heading sits over the words the heading names instead of two
   pixels to the left of them. */
.repo-th{text-align:left;padding:0 12px;background:${SURFACE};border-bottom:1px solid ${BORDER};
  position:sticky;top:var(--repo-top,57px);z-index:8;
  box-shadow:0 1px 0 ${BORDER},0 6px 10px -8px rgba(23,19,16,.28)}
.repo-th-title{border-left:4px solid transparent;padding-left:10px}
.repo-sort{display:flex;align-items:center;gap:7px;width:100%;min-height:${TAP}px;padding:0;background:none;
  border:none;cursor:pointer;font-family:var(--repo-col,${MONO});font-size:12px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;color:${MUTED};white-space:nowrap}
.repo-sort:hover{color:${TEXT}}
/* The arrow is always in the row, so sorting a column never nudges its
   heading sideways. Off means faint, not absent. */
.repo-arrow{font-size:12px;color:${MUTED};opacity:.35}
.repo-arrow-on{color:${TEXT};opacity:1}
.repo-th-used,.repo-th-made,.repo-th-where{width:1%;white-space:nowrap}
.repo-th-tags{width:18%}
/* With border-spacing the edge has to sit on the cell: a border on a tr is
   not painted at all. The white is not decoration either, it is what stops a
   row showing through the heading row it passes under. */
.repo-tr{background:#fff}
.repo-tr .repo-td{border-bottom:1px solid rgba(23,19,16,.07)}
.repo-tr:hover{background:rgba(23,19,16,.035)}
.repo-tr-open{background:${SURFACE}}
.repo-td{padding:4px 12px;vertical-align:middle;font-size:14px;color:${SECOND}}
.repo-td-title{border-left:4px solid var(--kind);padding-left:10px}
.repo-words{display:flex;gap:8px;align-items:baseline;width:100%;min-height:${TAP}px;text-align:left;
  background:none;border:none;padding:0;cursor:pointer;font-family:var(--repo-row,${F});font-size:15.5px;
  font-weight:500;line-height:1.35;letter-spacing:-.008em;color:${TEXT};overflow-wrap:anywhere}
.repo-bold .repo-words{font-weight:700}
.repo-words:hover{color:var(--kind)}
.repo-caret{color:${MUTED};font-size:11px}
/* The words and the kind on one line, so the kind wraps with the title it
   belongs to rather than sitting in a column of its own. */
.repo-words-in{display:block;min-width:0}
.repo-words-in > span:first-child{margin-right:8px}
.repo-sub{display:block;font-size:12.5px;font-weight:400;line-height:1.4;color:${MUTED}}
.repo-kind{display:inline-block;vertical-align:2px;font-family:${MONO};font-size:10px;font-weight:600;
  letter-spacing:.09em;text-transform:uppercase;color:#fff;background:var(--kind);border-radius:999px;
  padding:3px 9px;white-space:nowrap}
.repo-owner{font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${MUTED}}
.repo-td-used,.repo-td-where,.repo-td-made{white-space:nowrap}
.repo-uses{font-family:${MONO};font-size:11.5px;color:${SECOND};background:none;border:none;padding:4px 0;
  cursor:pointer;text-align:left}
.repo-uses:hover{color:var(--kind)}
.repo-unused{font-family:${MONO};font-size:11.5px;color:#9aa0a6}
.repo-td-made{font-family:${MONO};font-size:11.5px;color:${MUTED}}
.repo-tag{font-size:12px;color:${MUTED};background:none;border:1px solid ${BORDER};border-radius:999px;
  padding:2px 8px;margin-right:4px;cursor:pointer;font-family:inherit}
.repo-tag:hover{border-color:var(--kind);color:var(--kind)}
.repo-plus{font-family:${MONO};font-size:11px;color:${MUTED}}

/* The open row, spanning the table. Two panes: the words on the left, where
   the thing goes on the right. */
.repo-detail-row td{padding:0;border-left:4px solid var(--kind);border-bottom:1px solid ${BORDER};background:#fff}
.repo-detail{display:grid;grid-template-columns:minmax(320px,1.15fr) minmax(280px,1fr);gap:18px;padding:14px 16px 18px}
.repo-pane{display:flex;flex-direction:column;gap:9px;min-width:0}
.repo-pane-side{gap:16px}
.repo-field{display:flex;flex-direction:column;gap:4px}
.repo-pair{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.repo-input{width:100%;min-height:${TAP}px;padding:9px 13px;border-radius:11px;border:1px solid ${BORDER};
  background:#fff;font-family:inherit;font-size:15px;color:${TEXT}}
.repo-input:focus{outline:none;border-color:${TEXT}}
.repo-area{min-height:84px;resize:vertical;line-height:1.5;padding-top:11px}
.repo-save{min-height:38px;padding:0 16px;border-radius:10px;border:none;background:${TEXT};color:#fff;
  cursor:pointer;font-family:inherit;font-size:14px;font-weight:600}
.repo-save:disabled{opacity:.4;cursor:default}
.repo-del{color:#9f1239;border-color:rgba(159,18,57,.3)}
.repo-del:hover{border-color:#9f1239;color:#9f1239}
.repo-danger{min-height:32px;padding:0 12px;border-radius:999px;border:none;background:#9f1239;color:#fff;
  cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600}
.repo-warn{font-size:12.5px;color:#9f1239}
.repo-said{font-family:${MONO};font-size:11.5px;color:#047857}
.repo-link{font-size:13px;color:var(--kind);text-decoration:none;font-weight:500}
.repo-link:hover{text-decoration:underline}
.repo-place{display:flex;flex-direction:column;gap:7px;background:${SURFACE};border-radius:12px;padding:11px 12px}
.repo-where{display:flex;flex-direction:column;gap:6px}
.repo-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px}
.repo-use{display:inline-block;font-family:${MONO};font-size:11.5px;color:${SECOND};text-decoration:none;
  padding:3px 0}
.repo-use:hover{color:${TEXT}}
.repo-empty{margin:30px 0;font-size:16px;color:${MUTED}}

/* The pick column. A 44px target on a 4px-padded row, which is what makes a
   checkbox tappable without the rows growing taller. */
.repo-th-pick,.repo-td-pick{width:1%;padding-left:12px;padding-right:0}
.repo-pick,.repo-pick-all{display:flex;align-items:center;justify-content:center;
  min-height:${TAP}px;min-width:30px;cursor:pointer}
.repo-pick input,.repo-pick-all input{width:19px;height:19px;accent-color:${TEXT};cursor:pointer}
.repo-tr-picked{background:#fdf6e7}
.repo-tr-picked:hover{background:#fbf0d8}

/* Saved views, pinned above the table. */
.repo-views{padding-top:2px}
.repo-view{display:inline-flex;align-items:center;border:1px solid ${BORDER};border-radius:999px;background:#fff}
.repo-view-on{border-color:${TEXT};background:${SURFACE}}
.repo-view-go{min-height:32px;padding:0 6px 0 12px;background:none;border:none;cursor:pointer;
  font-family:inherit;font-size:13.5px;color:${SECOND}}
.repo-view-go:hover{color:${TEXT}}
.repo-view-x{min-height:32px;padding:0 10px 0 4px;background:none;border:none;cursor:pointer;
  font-family:inherit;font-size:15px;line-height:1;color:${MUTED}}
.repo-view-x:hover{color:#9f1239}

/* The bar for a live selection. It sticks to the bottom of the window, because
   a selection is made by running down a long list and the decision has to
   still be in reach at the bottom of the list. */
.repo-bulk{position:sticky;bottom:14px;z-index:12;display:flex;flex-direction:column;gap:8px;
  background:#fff;border:1px solid ${TEXT};border-radius:14px;padding:11px 13px;
  box-shadow:0 10px 30px -12px rgba(23,19,16,.4)}
.repo-bulk-n{font-family:${MONO};font-size:12px;font-weight:600;letter-spacing:.06em;
  text-transform:uppercase;color:${TEXT}}

/* The kinds sheet: a row per kind, and the palette under whichever one is
   being coloured. */
.repo-kind-add{display:flex;gap:7px;flex-wrap:wrap;align-items:center;background:#fff;border:1px solid ${TEXT};
  border-radius:14px;padding:11px 13px}
.repo-kind-add .repo-input{flex:1;min-width:180px}
.repo-swatch{width:34px;height:34px;border-radius:9px;border:1px solid rgba(23,19,16,.18);cursor:pointer}
.repo-swatch:hover{transform:scale(1.08)}

/* A post, a question, a headline: the room's own rows. */
.repo-post{font-size:14.5px;line-height:1.5;color:${SECOND};padding:3px 0;overflow-wrap:anywhere}
.repo-post b{color:${TEXT};font-weight:600;margin-right:6px}
.repo-poll-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:4px 0;
  border-bottom:1px solid rgba(23,19,16,.06)}
.repo-add-form{background:#fff;border:1px solid ${TEXT};border-radius:14px;padding:14px;
  display:flex;flex-direction:column;gap:8px}
/* The lenses. A cluster is a decision, so a cluster is a card with the copies
   inside and the consequence written underneath. */
.repo-lens{display:flex;flex-direction:column;gap:12px}
.repo-lens-say{margin:0;font-size:15px;line-height:1.6;color:${MUTED};max-width:76ch}
.repo-cluster{background:#fff;border-radius:14px;padding:13px 15px;display:flex;flex-direction:column;gap:10px;
  box-shadow:0 1px 2px rgba(23,19,16,.05),0 0 0 1px rgba(23,19,16,.06);border-left:4px solid var(--kind)}
.repo-cluster-top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.repo-key{font-family:${MONO};font-size:11.5px;color:${SECOND};background:${SURFACE};border-radius:7px;
  padding:2px 7px;overflow-wrap:anywhere}
.repo-flagged{font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:#b45309;border:1px solid #b45309;border-radius:999px;padding:2px 8px;margin-left:6px}
.repo-copies{display:flex;flex-direction:column;gap:5px}
.repo-copy{display:flex;align-items:center;gap:10px;min-height:${TAP}px;padding:5px 9px;border-radius:11px;
  border:1px solid ${BORDER};cursor:pointer}
.repo-copy:hover{border-color:${TEXT}}
.repo-copy-on{border-color:${TEXT};background:${SURFACE}}
.repo-copy input{width:19px;height:19px;flex:none;accent-color:${TEXT};cursor:pointer}
.repo-copy-words{flex:1;min-width:0;font-family:var(--repo-row,${F});font-size:15px;line-height:1.35;
  color:${TEXT};overflow-wrap:anywhere}
.repo-copy-n{font-family:${MONO};font-size:11px;color:${MUTED};white-space:nowrap}
.repo-plan{margin:0;font-size:14px;line-height:1.55;color:${SECOND}}
.repo-end-words{font-family:var(--repo-row,${F});font-size:15px;color:${TEXT};overflow-wrap:anywhere}
.repo-alike{background:${SURFACE};border-radius:12px;padding:11px 13px;display:flex;flex-direction:column;gap:8px}
.repo-alike-tag{font-size:13.5px;color:${SECOND};background:#fff;border:1px solid ${BORDER};
  border-radius:999px;padding:4px 11px}
.repo-alike-keep{border-color:${TEXT};color:${TEXT};font-weight:600}
.repo-tag-in{min-width:160px;max-width:240px;min-height:38px;font-size:14px}
.repo-verdict{font-family:${MONO};font-size:11.5px;color:${SECOND};white-space:nowrap}
.repo-verdict-bad{color:#9f1239;font-weight:600}
.repo-verdict-good{color:#047857}
.repo-type-sheet{background:#fff;border:1px solid ${TEXT};border-radius:14px;padding:13px 14px;
  display:flex;flex-direction:column;gap:11px}
.repo-type-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.repo-type-name{min-width:150px;font-size:14px;color:${SECOND}}
.repo-face{min-height:38px;padding:0 13px;border-radius:10px;border:1px solid ${BORDER};background:#fff;
  cursor:pointer;font-size:14px;color:${TEXT}}
.repo-face:hover{border-color:${TEXT}}
.repo-face[data-on="yes"]{background:${TEXT};border-color:${TEXT};color:#fff}

@media (max-width: 820px){
  .repo-detail{grid-template-columns:1fr}
  .repo-th-made,.repo-td-made,.repo-th-tags,.repo-td-tags{display:none}
}
`;
