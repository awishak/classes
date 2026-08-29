// Everything I have, on one page.
//
// The blocks already lived in one model, and there was still no way to see all
// of them at once: the dashboard shows a class, and only the parts of a class
// that fit in a rail. So this reads every class store plus the shared one, puts
// the lot behind one search box, and says where each thing sits in the term.
//
// Where an item is used is worked out here rather than read off the block. A
// block carries a `scheduled` list stamped on placement, and that list is
// incomplete for anything placed before the stamping existed. Walking the day
// plans and the schedules is slower and correct, and correct is the point of a
// repository.

import { useState, useEffect, useMemo } from "react";
import { loadClass } from "./store.js";
import { ENGINE_LIST } from "../config/registry.js";
import { TYPES, typeOf, SHARED_KEY, makeBlock } from "./blocks.js";
import { colorOfType, readColors } from "./colors.js";
import { normSlot } from "./dayplan.js";
import { weekdayOf } from "./schedule.js";
import { readFonts, fontVars } from "./fonts.js";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const BG = "#faf9f7";
const SURFACE = "#f5f4f1";
const TEXT = "#171310";
const SECOND = "#3f4550";
const MUTED = "#5b6068";
const BORDER = "rgba(23,19,16,.12)";
const TAP = 44;

const SORTS = [
  { id: "used", name: "Most used" },
  { id: "recent", name: "Newest" },
  { id: "title", name: "A to Z" },
];

export default function RepoPage() {
  const [stores, setStores] = useState(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [where, setWhere] = useState("");     // a class id, or "shared", or ""
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("used");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState("");

  useEffect(() => { document.title = "Repository"; }, []);

  // Every class, and the shelf that belongs to me rather than to a class.
  useEffect(() => {
    let alive = true;
    (async () => {
      const out = {};
      await Promise.all([
        ...ENGINE_LIST.map(async c => { out[c.id] = await loadClass(c.storageKey) || {}; }),
        (async () => { out.shared = await loadClass(SHARED_KEY) || {}; })(),
      ]);
      if (alive) setStores(out);
    })();
    return () => { alive = false; };
  }, []);

  const colors = readColors(stores?.shared);
  const fonts = readFonts(stores?.shared);
  const hue = (t) => colorOfType(colors, t);

  // ─── the index ───
  // Every block, with the places it turns up. Built from the day plans and the
  // schedules rather than from the stamp on the block, because the stamp is
  // only as old as the stamping.
  const items = useMemo(() => {
    if (!stores) return [];
    const rows = [];
    const uses = {};              // blockId -> [{ class, date, section }]
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

    const push = (block, owner) => {
      if (!block?.id) return;
      rows.push({ ...block, owner, uses: uses[block.id] || [] });
    };
    ENGINE_LIST.forEach(c => Object.values((stores[c.id] || {}).blocks || {}).forEach(b => push(b, c)));
    Object.values((stores.shared || {}).blocks || {}).forEach(b => push(b, null));
    return rows;
  }, [stores]);

  const tags = useMemo(() => {
    const t = new Set();
    items.forEach(b => (b.tags || []).forEach(x => t.add(x)));
    return [...t].sort();
  }, [items]);

  const hits = useMemo(() => {
    const text = q.trim().toLowerCase();
    let out = items.filter(b => {
      if (kind && b.type !== kind) return false;
      if (where === "shared" && b.owner) return false;
      if (where && where !== "shared" && b.owner?.id !== where) return false;
      if (tag && !(b.tags || []).includes(tag)) return false;
      if (!text) return true;
      return [b.title, b.headline, b.body, b.source, b.concept, b.url, ...(b.tags || [])]
        .filter(Boolean).join(" ").toLowerCase().includes(text);
    });
    if (sort === "title") out.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sort === "recent") out.sort((a, b) => String(b.created || "").localeCompare(String(a.created || "")));
    else out.sort((a, b) => b.uses.length - a.uses.length || (a.title || "").localeCompare(b.title || ""));
    return out;
  }, [items, q, kind, where, tag, sort]);

  const counts = useMemo(() => {
    const c = {};
    items.forEach(b => { c[b.type] = (c[b.type] || 0) + 1; });
    return c;
  }, [items]);

  const addBlock = async (target, patch) => {
    const key = target === "shared" ? SHARED_KEY : ENGINE_LIST.find(c => c.id === target)?.storageKey;
    if (!key) return;
    const cur = await loadClass(key) || {};
    const block = makeBlock(patch);
    const next = { ...cur, blocks: { ...(cur.blocks || {}), [block.id]: block } };
    await window.storage.set(key, JSON.stringify(next), true);
    setStores(s => ({ ...s, [target === "shared" ? "shared" : target]: next }));
    setAdding(false);
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
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT, ...fontVars(fonts) }}>
      <style>{CSS}</style>

      <header className="repo-head">
        <div className="repo-head-in">
          <a href="/" className="repo-back">← All classes</a>
          <h1 className="repo-title">Repository</h1>
          <span className="repo-count">{items.length} things</span>
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
            {chip(!where, "Every class", () => setWhere(""))}
            {ENGINE_LIST.map(c => chip(where === c.id, c.code, () => setWhere(where === c.id ? "" : c.id), c.accent))}
            {chip(where === "shared", "Mine", () => setWhere(where === "shared" ? "" : "shared"))}
          </div>
          {tags.length ? (
            <div className="repo-row">
              <select className="repo-select" value={tag} onChange={e => setTag(e.target.value)} aria-label="Filter by tag">
                <option value="">Any tag ({tags.length})</option>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="repo-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort">
                {SORTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <span className="repo-hits">{hits.length} {hits.length === 1 ? "match" : "matches"}</span>
            </div>
          ) : null}
        </div>

        {adding ? <AddForm onAdd={addBlock} onClose={() => setAdding(false)} hue={hue} /> : null}

        {hits.length ? (
          <div className="repo-grid">
            {hits.map(b => (
              <Card key={b.id} block={b} hue={hue} open={openId === b.id}
                onOpen={() => setOpenId(openId === b.id ? "" : b.id)} onTag={setTag} />
            ))}
          </div>
        ) : (
          <p className="repo-empty">Nothing matches. Try fewer words, or clear a filter.</p>
        )}
      </div>
    </div>
  );
}

// One thing, and everywhere it turns up.
function Card({ block, hue, open, onOpen, onTag }) {
  const t = typeOf(block.type);
  const color = hue(block.type);
  const words = block.headline || block.title;
  const sub = block.headline && block.title !== block.headline ? block.title : "";
  return (
    <article className="repo-card" style={{ "--kind": color }}>
      <div className="repo-card-top">
        <span className="repo-kind">{t.label}</span>
        {block.owner ? (
          <span className="repo-owner" style={{ color: block.owner.accent }}>{block.owner.code}</span>
        ) : <span className="repo-owner">Mine</span>}
      </div>

      <button className="repo-focus repo-words" onClick={onOpen} aria-expanded={open}>{words || "Untitled"}</button>
      {sub ? <div className="repo-sub">{sub}</div> : null}

      {block.uses.length ? (
        <div className="repo-uses">
          {block.uses.slice(0, open ? 99 : 3).map((u, i) => (
            <a key={i} className="repo-focus repo-use" href={u.cls.path + "/dashboard"}
              title={u.cls.code + ", " + u.date + ", in " + u.section}>
              {u.cls.code} · {u.date}
            </a>
          ))}
          {!open && block.uses.length > 3 ? (
            <button className="repo-focus repo-use repo-more" onClick={onOpen}>
              +{block.uses.length - 3} more
            </button>
          ) : null}
        </div>
      ) : (
        <div className="repo-uses"><span className="repo-unused">Never used</span></div>
      )}

      {open ? (
        <div className="repo-open">
          {block.body ? <p className="repo-body-text">{block.body}</p> : null}
          {block.url ? (
            <a className="repo-focus repo-link" href={block.url} target="_blank" rel="noopener noreferrer">
              {hostOf(block.url)} ↗
            </a>
          ) : null}
          <dl className="repo-facts">
            {block.concept ? <><dt>Concept</dt><dd>{block.concept}</dd></> : null}
            {block.source ? <><dt>Source</dt><dd>{block.source}</dd></> : null}
            {block.created ? <><dt>Made</dt><dd>{block.created}</dd></> : null}
            {block.children?.length ? <><dt>Holds</dt><dd>{block.children.length} inside</dd></> : null}
          </dl>
        </div>
      ) : null}

      {block.tags?.length ? (
        <div className="repo-tags">
          {block.tags.map(x => (
            <button key={x} className="repo-focus repo-tag" onClick={() => onTag(x)}>{x}</button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function AddForm({ onAdd, onClose, hue }) {
  const [type, setType] = useState("link");
  const [target, setTarget] = useState("shared");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    if (!title.trim() && !url.trim()) return;
    setBusy(true);
    await onAdd(target, {
      type, title: title.trim() || hostOf(url) || "Untitled", url: url.trim(), body: body.trim(),
      tags: tags.split(",").map(x => x.trim()).filter(Boolean),
    });
    setBusy(false);
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
      <textarea className="repo-input" value={body} onChange={e => setBody(e.target.value)}
        placeholder="Anything worth keeping alongside" style={{ minHeight: 84, resize: "vertical", lineHeight: 1.5 }} />
      <input className="repo-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags, separated by commas" />
      <div className="repo-row" style={{ alignItems: "center" }}>
        <span className="repo-label">Keep it with</span>
        <select className="repo-select" value={target} onChange={e => setTarget(e.target.value)}>
          <option value="shared">Me, so every class can reach the item</option>
          {ENGINE_LIST.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <button className="repo-focus repo-save" onClick={commit} disabled={busy}>
          {busy ? "Saving…" : "Add to the repository"}
        </button>
        <button className="repo-focus repo-chip" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

const CSS = `
.repo-focus:focus-visible{outline:2.5px solid #171310;outline-offset:2px;border-radius:8px}
.repo-head{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid ${BORDER}}
.repo-head-in{max-width:1240px;margin:0 auto;padding:12px 20px;display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.repo-back{font-size:14px;color:${MUTED};text-decoration:none}
.repo-back:hover{color:${TEXT}}
.repo-title{margin:0;font-size:20px;font-weight:700;letter-spacing:-.02em}
.repo-count{font-family:${MONO};font-size:12px;color:${MUTED}}
.repo-add{margin-left:auto;min-height:36px;padding:0 15px;border-radius:11px;border:none;background:${TEXT};
  color:#fff;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600}
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
.repo-select{min-height:32px;padding:0 8px;border-radius:9px;border:1px solid ${BORDER};background:#fff;
  font-family:inherit;font-size:13.5px;color:${TEXT}}
.repo-hits{font-family:${MONO};font-size:12px;color:${MUTED};margin-left:auto}
.repo-label{font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:${MUTED}}

/* A wall of cards that keeps its rhythm at any width. Three columns is the
   most that stays readable for a headline. */
.repo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px;align-items:start}
.repo-card{background:#fff;border-radius:14px;padding:13px 15px 12px;display:flex;flex-direction:column;gap:7px;
  box-shadow:0 1px 2px rgba(23,19,16,.05),0 0 0 1px rgba(23,19,16,.05);
  border-left:4px solid var(--kind)}
.repo-card:hover{box-shadow:0 3px 12px -3px rgba(23,19,16,.13),0 0 0 1px rgba(23,19,16,.09)}
.repo-card-top{display:flex;align-items:center;gap:8px}
.repo-kind{font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:#fff;background:var(--kind);border-radius:999px;padding:2px 8px}
.repo-owner{margin-left:auto;font-family:${MONO};font-size:10.5px;font-weight:600;letter-spacing:.07em;
  text-transform:uppercase;color:${MUTED}}
.repo-words{display:block;width:100%;text-align:left;background:none;border:none;padding:0;cursor:pointer;
  font-family:var(--font-row,${F});font-size:16px;font-weight:500;line-height:1.35;letter-spacing:-.008em;
  color:${TEXT};overflow-wrap:anywhere}
.repo-words:hover{color:var(--kind)}
.repo-sub{font-size:13px;line-height:1.4;color:${MUTED};overflow-wrap:anywhere}
.repo-uses{display:flex;flex-wrap:wrap;gap:5px;align-items:center}
.repo-use{font-family:${MONO};font-size:11px;color:${SECOND};background:${SURFACE};border:none;
  border-radius:999px;padding:3px 9px;text-decoration:none;cursor:pointer}
.repo-use:hover{background:var(--kind);color:#fff}
.repo-more{opacity:.75}
.repo-unused{font-family:${MONO};font-size:11px;color:#9aa0a6}
.repo-open{display:flex;flex-direction:column;gap:8px;padding-top:4px;border-top:1px solid ${BORDER}}
.repo-body-text{margin:0;font-size:14px;line-height:1.5;color:${SECOND};white-space:pre-wrap;overflow-wrap:anywhere}
.repo-link{align-self:flex-start;font-size:13px;color:var(--kind);text-decoration:none;font-weight:500}
.repo-link:hover{text-decoration:underline}
.repo-facts{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:0;font-size:13px}
.repo-facts dt{font-family:${MONO};font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};align-self:center}
.repo-facts dd{margin:0;color:${SECOND}}
.repo-tags{display:flex;flex-wrap:wrap;gap:4px}
.repo-tag{font-size:11.5px;color:${MUTED};background:none;border:1px solid ${BORDER};border-radius:999px;
  padding:1px 8px;cursor:pointer;font-family:inherit}
.repo-tag:hover{border-color:var(--kind);color:var(--kind)}
.repo-empty{margin:30px 0;font-size:16px;color:${MUTED}}
.repo-add-form{background:#fff;border:1px solid ${TEXT};border-radius:14px;padding:14px;
  display:flex;flex-direction:column;gap:8px}
.repo-input{width:100%;min-height:${TAP}px;padding:9px 13px;border-radius:11px;border:1px solid ${BORDER};
  background:#fff;font-family:inherit;font-size:15px;color:${TEXT}}
.repo-input:focus{outline:none;border-color:${TEXT}}
.repo-save{min-height:38px;padding:0 16px;border-radius:10px;border:none;background:${TEXT};color:#fff;
  cursor:pointer;font-family:inherit;font-size:14px;font-weight:600}
.repo-save:disabled{opacity:.5;cursor:default}
`;
