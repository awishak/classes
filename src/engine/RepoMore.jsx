// The two lenses that make the repository hold more than my own blocks.
//
// Seeds: the library I write in markdown, offered as blocks I can teach with.
// Room: the posts, questions, headlines and polls the students made, which is
// the material that actually accumulates across a quarter and has never been
// searchable anywhere.
//
// Both are lists of things that are not blocks yet, and both end in the same
// gesture: bring the thing onto the shelf, where the rest of the page can
// already search it, tag it, and put it on a day.

import { useState } from "react";
import { ROOM_KINDS, stampOf } from "./room.js";
import { SHARED_LABEL } from "./blocks.js";
import { hostOf } from "./links.js";

export function Seeds({ seeds, fresh, onBring, onBringAll }) {
  const freshIds = new Set((fresh || []).map(s => s.id));
  if (!seeds.length) {
    return <p className="repo-empty">The seed library is empty. Seeds live in teaching/seeds.md.</p>;
  }
  return (
    <div className="repo-lens">
      <p className="repo-lens-say">
        The seed library, read out of teaching/seeds.md. Each seed arrives as a story block on the {SHARED_LABEL} shelf,
        carrying its concept and its slots as tags, so a seed can be searched, put on a day, and edited like anything
        else here. The markdown file stays where I write a seed, because writing a paragraph in a form is worse than
        writing a paragraph.
      </p>
      <div className="repo-row">
        <button className="repo-focus repo-save" disabled={!fresh.length} onClick={onBringAll}>
          {fresh.length ? "Bring in the " + fresh.length + " that are new" : "Every seed is already a block"}
        </button>
        <span className="repo-verdict">{seeds.length} in the library, {seeds.length - fresh.length} on the shelf</span>
      </div>
      {seeds.map(s => (
        <section key={s.id} className="repo-cluster" style={{ "--kind": "#9f1239" }}>
          <div className="repo-cluster-top">
            <span className="repo-copy-words">{s.title}</span>
            {freshIds.has(s.id)
              ? <button className="repo-focus repo-chip" onClick={() => onBring(s)}>Bring in this seed</button>
              : <span className="repo-verdict repo-verdict-good">On the shelf</span>}
          </div>
          <p className="repo-plan">{s.body}</p>
          <div className="repo-row">
            {s.concept ? <span className="repo-key">{s.concept}</span> : null}
            {(s.slots || []).map(x => <span key={x} className="repo-alike-tag">{x}</span>)}
            {(s.classes || []).map(x => <span key={x} className="repo-owner">{x}</span>)}
            {s.source ? <span className="repo-verdict">{s.source}</span> : null}
          </div>
        </section>
      ))}
    </div>
  );
}

export function Room({ items, counts, kind, setKind, busy, kept, onKeep }) {
  if (busy) return <p className="repo-empty">Reading the boards, the questions, the headlines and the polls…</p>;
  if (!items.length) {
    return (
      <p className="repo-empty">
        Nothing from the room matches. The students have posted, asked, and voted in the classes that ran,
        so a search with fewer words will find more.
      </p>
    );
  }
  return (
    <div className="repo-lens">
      <p className="repo-lens-say">
        What the students made, across every class at once: posts on a board, questions asked during a session,
        headlines they brought in, and how a poll went. The search box above reads all of it. Keeping a row puts a
        block on that class's shelf, so a question asked last year can be taught with next year.
      </p>
      <div className="repo-row">
        {ROOM_KINDS.filter(k => counts[k.id]).map(k => (
          <button key={k.id} className="repo-focus repo-chip" aria-pressed={kind === k.id}
            onClick={() => setKind(kind === k.id ? "" : k.id)}
            style={kind === k.id ? { background: k.hex, borderColor: k.hex, color: "#fff" } : undefined}>
            {k.label} {counts[k.id]}
          </button>
        ))}
        <span className="repo-hits">{items.length} from the room</span>
      </div>
      {items.map(it => (
        <RoomItem key={it.key} item={it} kept={kept.has(it.key)} onKeep={() => onKeep(it)} />
      ))}
    </div>
  );
}

function RoomItem({ item, kept, onKeep }) {
  const [open, setOpen] = useState(false);
  const k = ROOM_KINDS.find(x => x.id === item.kind) || ROOM_KINDS[0];
  return (
    <section className="repo-cluster" style={{ "--kind": k.hex }}>
      <div className="repo-cluster-top">
        <span className="repo-kind">{k.label}</span>
        <span className="repo-owner" style={{ color: item.cls.accent }}>{item.cls.code}</span>
        <span className="repo-copy-n">{stampOf(item.at)}</span>
        {item.kind === "poll" && !item.over ? <span className="repo-flagged">On the floor now</span> : null}
        {kept
          ? <span className="repo-verdict repo-verdict-good" style={{ marginLeft: "auto" }}>Kept as a block</span>
          : <button className="repo-focus repo-chip" style={{ marginLeft: "auto" }} onClick={onKeep}>Keep as a block</button>}
      </div>

      <p className="repo-copy-words">{item.title}</p>

      {item.kind === "board" ? (
        <>
          <button className="repo-focus repo-uses" onClick={() => setOpen(!open)} aria-expanded={open}>
            {item.count} {item.count === 1 ? "post" : "posts"}{item.closed ? ", closed" : ""}
          </button>
          {open ? (
            <ul className="repo-list">
              {item.posts.map(p => (
                <li key={p.id} className="repo-post">
                  <b>{p.who || "Someone"}</b> {p.text}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {item.kind === "question" ? (
        <div className="repo-row">
          <span className="repo-verdict">{item.who || "Anonymous"}</span>
          <span className="repo-verdict">{item.state}</span>
        </div>
      ) : null}

      {item.kind === "headline" ? (
        <div className="repo-row">
          {item.who ? <span className="repo-verdict">Brought in by {item.who}</span> : null}
          {item.url ? (
            <a className="repo-focus repo-link" href={item.url} target="_blank" rel="noopener noreferrer">
              {hostOf(item.url)} ↗
            </a>
          ) : null}
          {(item.reads || []).map(r => <span key={r} className="repo-alike-tag">{r}</span>)}
        </div>
      ) : null}

      {item.kind === "poll" ? <PollRow item={item} /> : null}
    </section>
  );
}

// Both rounds side by side, because the second vote is the whole point of a
// peer-instruction poll and a single set of counts hides the movement.
function PollRow({ item }) {
  if (!item.options?.length) {
    return (
      <ul className="repo-list">
        {item.said.map((s, i) => <li key={i} className="repo-post"><b>{s.who}</b> {s.text}</li>)}
        {!item.said.length ? <li className="repo-unused">Nobody wrote an answer.</li> : null}
      </ul>
    );
  }
  return (
    <ul className="repo-list">
      {item.options.map((o, i) => (
        <li key={i} className="repo-poll-row">
          <span className="repo-copy-words">{o}</span>
          {item.correct === i ? <span className="repo-verdict repo-verdict-good">Correct</span> : null}
          <span className="repo-copy-n">{item.r1.counts[i]} first</span>
          <span className="repo-copy-n">{item.r2.counts[i]} after the argument</span>
        </li>
      ))}
    </ul>
  );
}
