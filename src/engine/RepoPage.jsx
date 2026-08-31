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
import { TYPES, typeOf, SHARED_KEY, SHARED_LABEL, makeBlock, writeBlock,
  deleteBlock, stampScheduled } from "./blocks.js";
import { colorOfType, readColors } from "./colors.js";
import { normSlot, blankDay } from "./dayplan.js";
import { findDuplicates, findLooseEnds, applyMerge,
  dropFlowRow, dropWeekItem, unlinkWeekItem, blockFromWeekItem } from "./tidy.js";
import { Duplicates, LooseEnds } from "./RepoTidy.jsx";
import { weekdayOf, slotsOf, addScheduleItem } from "./schedule.js";
import { FACES, REPO_SLOTS, readRepoFonts, repoFontVars, writeRepoFont, resetRepoFonts,
  readRepoBold, writeRepoBold } from "./fonts.js";
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
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [where, setWhere] = useState("");     // a class id, or "shared", or ""
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState({ col: "used", dir: "desc" });
  const [adding, setAdding] = useState(false);
  const [typing, setTyping] = useState(false);
  const [lens, setLens] = useState("");   // "", "dupes", "loose"
  const [openId, setOpenId] = useState("");
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

  const colors = readColors(stores?.shared);
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
    const col = COLS.find(c => c.id === sort.col) || COLS[0];
    const sign = sort.dir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      const x = col.sort(a), y = col.sort(b);
      const by = col.num ? x - y : String(x).localeCompare(String(y));
      // A tie on any column falls back to the words, so the order is stable
      // and a re-sort never shuffles the rows that matched equally.
      return (by ? by * sign : 0) || (a.title || "").localeCompare(b.title || "");
    });
    return out;
  }, [items, q, kind, where, tag, sort]);

  const dupes = useMemo(() => findDuplicates(items), [items]);
  const loose = useMemo(() => (stores ? findLooseEnds(stores, ENGINE_LIST) : []), [stores]);

  const counts = useMemo(() => {
    const c = {};
    items.forEach(b => { c[b.type] = (c[b.type] || 0) + 1; });
    return c;
  }, [items]);

  const bySort = (col) => setSort(s =>
    s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" }
                  : { col, dir: col === "used" || col === "made" ? "desc" : "asc" });

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
  const placeOnDay = (row, cls, date, slot) => {
    let landed = "";
    writeTo(cls.id)(prev => {
      const plans = { ...(prev.dayPlans || {}) };
      const day = { ...blankDay(cls), ...(plans[date] || {}) };
      const target = slot || slotsOf(cls, day)[0];
      if (!target) { landed = "none"; return prev; }
      const slots = { ...(day.slots || {}) };
      const bucket = normSlot(slots[target]);
      if (bucket.items.some(it => it.blockId === row.id)) return prev;
      slots[target] = { ...bucket, items: [...bucket.items, { id: genId(), blockId: row.id }] };
      plans[date] = { ...day, slots };
      landed = target;
      return { ...prev, dayPlans: plans };
    });
    if (landed === "none") return "That day has no sections to land in.";
    if (!landed) return "Already on that day.";
    stampScheduled(writeTo(row.target), row.id, date);
    return cls.code + ", " + date + ", in " + landed;
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
        <input className="repo-search" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search everything" aria-label="Search the repository" autoFocus />

        <div className="repo-filters">
          <div className="repo-row">
            {chip(!kind, "Everything", () => setKind(""))}
            {TYPES.filter(t => counts[t.id]).map(t =>
              chip(kind === t.id, t.label + " " + counts[t.id], () => setKind(kind === t.id ? "" : t.id), hue(t.id)))}
          </div>
          <div className="repo-row">
            {chip(!lens, "The whole shelf", () => setLens(""))}
            {chip(lens === "dupes", "Duplicates " + dupes.length,
              () => setLens(lens === "dupes" ? "" : "dupes"), "#b45309")}
            {chip(lens === "loose", "Loose ends " + loose.length,
              () => setLens(lens === "loose" ? "" : "loose"), "#9f1239")}
          </div>
          <div className="repo-row">
            {chip(!where, "Every class", () => setWhere(""))}
            {ENGINE_LIST.map(c => chip(where === c.id, c.code, () => setWhere(where === c.id ? "" : c.id), c.accent))}
            {chip(where === "shared", SHARED_LABEL, () => setWhere(where === "shared" ? "" : "shared"))}
            {tags.length ? (
              <select className="repo-select" value={tag} onChange={e => setTag(e.target.value)} aria-label="Filter by tag">
                <option value="">Any tag ({tags.length})</option>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : null}
            <span className="repo-hits">{hits.length} {hits.length === 1 ? "match" : "matches"}</span>
          </div>
        </div>

        {typing ? (
          <TypeSheet fonts={fonts} bold={bold} onClose={() => setTyping(false)}
            onFont={(slot, f) => writeRepoFont(writeTo("shared"), slot, f)}
            onBold={on => writeRepoBold(writeTo("shared"), on)}
            onReset={() => resetRepoFonts(writeTo("shared"))} />
        ) : null}

        {adding ? <AddForm onAdd={addBlock} onClose={() => setAdding(false)} hue={hue} /> : null}

        {lens === "dupes" ? <Duplicates clusters={dupes} hue={hue} onMerge={mergeCluster} /> : null}
        {lens === "loose" ? (
          <LooseEnds ends={loose} onDrop={dropEnd} onUnlink={unlinkEnd} onMakeBlock={makeBlockFrom} />
        ) : null}

        {lens ? null : hits.length ? (
          <div className="repo-sheet">
            <table className="repo-table">
              <thead>
                <tr>
                  {COLS.map(c => (
                    <th key={c.id} className={"repo-th repo-th-" + c.id} scope="col"
                      aria-sort={sort.col === c.id ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <button className="repo-focus repo-sort" onClick={() => bySort(c.id)}
                        aria-label={"Sort by " + c.name}>
                        {c.name}
                        <span className={"repo-arrow" + (sort.col === c.id ? " repo-arrow-on" : "")}>
                          {sort.col === c.id ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hits.map(b => (
                  <Fragment key={b.id}>
                    <Row block={b} hue={hue} open={openId === b.id} onTag={setTag}
                      onOpen={() => setOpenId(openId === b.id ? "" : b.id)} />
                    {openId === b.id ? (
                      <tr className="repo-detail-row">
                        <td colSpan={COLS.length} style={{ "--kind": hue(b.type) }}>
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
      </div>
    </div>
  );
}

// One thing, on one line. Exported so the smoke test can render a row, the
// open row and the placer, none of which a server render of the page itself
// ever reaches: the page is behind a load, and a loading screen proves nothing.
export function Row({ block, hue, open, onOpen, onTag }) {
  const t = typeOf(block.type);
  const color = hue(block.type);
  const words = block.headline || block.title;
  const sub = block.headline && block.title !== block.headline ? block.title : "";
  return (
    <tr className={"repo-tr" + (open ? " repo-tr-open" : "")} style={{ "--kind": color }}>
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
          {TYPES.map(t => (
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
export function Place({ block, planOf, stores, onPlace, onAssign }) {
  const [clsId, setClsId] = useState(ENGINE_LIST[0].id);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [said, setSaid] = useState("");

  const cls = ENGINE_LIST.find(c => c.id === clsId) || ENGINE_LIST[0];
  const weeks = (stores[clsId] || {}).schedule || cls.scheduleWeeks || [];
  const slots = date ? slotsOf(cls, planOf(cls, date)) : [];

  return (
    <div className="repo-place">
      <span className="repo-label">Put the block on a day</span>
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
            {slots.map(s => <option key={s} value={s}>{s}</option>)}
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
        {TYPES.map(t => (
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
