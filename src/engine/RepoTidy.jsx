// The two lenses. Same page, same stylesheet, different question.
//
// Neither one is the table, because neither one is a list of things. A
// duplicate is a set of copies I have to choose between, and a loose end is a
// row pointing at a block that is gone. Both need the columns the table has
// plus a decision the table has no room for.

import { useState } from "react";
import { typeOf, SHARED_LABEL } from "./blocks.js";

export function Duplicates({ clusters, hue, onMerge }) {
  if (!clusters.length) {
    return <p className="repo-empty">No copies of anything. Every block on the shelf is the only one of itself.</p>;
  }
  return (
    <div className="repo-lens">
      <p className="repo-lens-say">
        The same thing, filed more than once. Matching is on the web address where a block has one and on the
        title otherwise, which is the key the porting script used. Choose the copy to keep, choose where the
        copy lives, and every day and every week pointing at the others gets pointed at the survivor.
      </p>
      {clusters.map(c => <Cluster key={c.key} cluster={c} hue={hue} onMerge={onMerge} />)}
    </div>
  );
}

function Cluster({ cluster, hue, onMerge }) {
  const [keep, setKeep] = useState(cluster.blocks[0].id);
  const [toShared, setToShared] = useState(cluster.spans);
  const [done, setDone] = useState("");
  const survivor = cluster.blocks.find(b => b.id === keep) || cluster.blocks[0];
  const moving = cluster.blocks.filter(b => b.id !== keep).reduce((n, b) => n + b.uses.length, 0);
  const homeName = toShared || !survivor.owner ? SHARED_LABEL : survivor.owner.code;
  const risky = cluster.spans && !toShared && survivor.owner;

  return (
    <section className="repo-cluster" style={{ "--kind": hue(cluster.blocks[0].type) }}>
      <div className="repo-cluster-top">
        <span className="repo-kind">{cluster.blocks.length} copies</span>
        <span className="repo-label">matched on the {cluster.on}</span>
        <code className="repo-key">{cluster.what}</code>
        {cluster.spans ? <span className="repo-flagged">Crosses classes</span> : null}
      </div>

      <div className="repo-copies">
        {cluster.blocks.map(b => (
          <label key={b.id} className={"repo-copy" + (b.id === keep ? " repo-copy-on" : "")}>
            <input type="radio" name={"keep-" + cluster.key} checked={b.id === keep}
              onChange={() => { setKeep(b.id); setDone(""); }} />
            <span className="repo-copy-words">
              {b.headline || b.title || "Untitled"}
              {b.headline && b.title !== b.headline ? <span className="repo-sub">{b.title}</span> : null}
            </span>
            <span className="repo-kind" style={{ background: hue(b.type) }}>{typeOf(b.type).label}</span>
            <span className="repo-owner" style={{ color: b.owner ? b.owner.accent : undefined }}>
              {b.owner ? b.owner.code : SHARED_LABEL}
            </span>
            <span className="repo-copy-n">{b.uses.length ? b.uses.length + " used" : "never used"}</span>
            <span className="repo-copy-n">{b.created || ""}</span>
          </label>
        ))}
      </div>

      <div className="repo-row">
        <span className="repo-label">Keep the survivor with</span>
        <select className="repo-select" value={toShared ? "shared" : "home"} aria-label="Where the survivor lives"
          onChange={e => { setToShared(e.target.value === "shared"); setDone(""); }}>
          <option value="shared">{SHARED_LABEL}, so every class can reach the block</option>
          <option value="home">{survivor.owner ? survivor.owner.code : SHARED_LABEL}, where the copy already is</option>
        </select>
        <button className="repo-focus repo-save" onClick={() => setDone(onMerge(cluster, keep, toShared))}>
          Merge {cluster.blocks.length} into one
        </button>
        {done ? <span className="repo-said">{done}</span> : null}
      </div>

      <p className="repo-plan">
        {moving} place{moving === 1 ? "" : "s"} will point at the copy you keep, and{" "}
        {cluster.blocks.length - 1} block{cluster.blocks.length === 2 ? "" : "s"} will leave the shelf into the
        merged list, whole, so a merge made in error can be read back. The survivor lives with {homeName}.
      </p>
      {risky ? (
        <p className="repo-warn">
          Every other class in this group would point at a block living inside {survivor.owner.code}, and a
          dashboard resolves its own class and the shared shelf only, so those rows would come up blank.
        </p>
      ) : null}
    </section>
  );
}

export function LooseEnds({ ends, onDrop, onUnlink, onMakeBlock }) {
  if (!ends.length) {
    return <p className="repo-empty">Nothing dangling. Every row and every week item points at a block that exists.</p>;
  }
  return (
    <div className="repo-lens">
      <p className="repo-lens-say">
        A pointer with nothing on the other end. A flow row carries the pointer and nothing else, so a broken
        one is blank on the day and can only come off. A week item carries its own title and link, so a broken
        one can become the block the item was always standing in for.
      </p>
      <div className="repo-sheet">
        <table className="repo-table">
          <thead>
            <tr>
              <th className="repo-th" scope="col"><span className="repo-sort">What the row says</span></th>
              <th className="repo-th" scope="col"><span className="repo-sort">Class</span></th>
              <th className="repo-th" scope="col"><span className="repo-sort">Where</span></th>
              <th className="repo-th" scope="col"><span className="repo-sort">Points at</span></th>
              <th className="repo-th" scope="col"><span className="repo-sort">What to do</span></th>
            </tr>
          </thead>
          <tbody>
            {ends.map(le => <End key={le.id} le={le} onDrop={onDrop} onUnlink={onUnlink} onMakeBlock={onMakeBlock} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function End({ le, onDrop, onUnlink, onMakeBlock }) {
  const [sure, setSure] = useState(false);
  return (
    <tr className="repo-tr">
      <td className="repo-td repo-td-title">
        <span className="repo-end-words">{le.words || <i className="repo-unused">Blank on the day</i>}</span>
      </td>
      <td className="repo-td repo-td-where">
        <span className="repo-owner" style={{ color: le.cls.accent }}>{le.cls.code}</span>
      </td>
      <td className="repo-td repo-td-used">
        {le.kind === "flow" ? le.date + " · " + le.section : "Week item" + (le.date ? " · " + le.date : "")}
      </td>
      <td className="repo-td repo-td-made">
        <code className="repo-key">{le.points}</code>
        {le.legacy ? <span className="repo-flagged">Old library</span> : null}
      </td>
      <td className="repo-td">
        <div className="repo-row">
          {le.kind === "week" ? (
            <>
              <button className="repo-focus repo-save" onClick={() => onMakeBlock(le)}>Make a block</button>
              <button className="repo-focus repo-chip" onClick={() => onUnlink(le)}>Just unlink</button>
            </>
          ) : null}
          {sure ? (
            <>
              <button className="repo-focus repo-danger" onClick={() => onDrop(le)}>Yes, take it off</button>
              <button className="repo-focus repo-chip" onClick={() => setSure(false)}>Leave the row</button>
            </>
          ) : (
            <button className="repo-focus repo-chip repo-del" onClick={() => setSure(true)}>
              {le.kind === "flow" ? "Take the row off the day" : "Take the item off the week"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
