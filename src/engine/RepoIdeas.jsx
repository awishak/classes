// Twenty ways the repository could be better, on a page rather than in a chat.
//
// Andrew asked the ten out loud and then asked for twenty on a page, which is
// the right instinct: a list in a conversation is gone the moment the
// conversation is cleared, and this list is a backlog. So the list lives at a
// URL, next to the thing the list is about.
//
// Every idea says what the change is and why the change is worth making,
// because a backlog entry with no why is an entry nobody can rank later. The
// number on each one is the point of the page: say the numbers you want and
// the work starts, without either of us re-deriving what the numbers meant.

import { useState, useEffect } from "react";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const BG = "#faf9f7";
const SURFACE = "#f5f4f1";
const TEXT = "#171310";
const SECOND = "#3f4550";
const MUTED = "#5b6068";
const BORDER = "rgba(23,19,16,.12)";

// How much work, honestly. Small is a sitting, medium is a session, big is a
// session that spills.
const SIZES = [
  { id: "small", name: "Small", hex: "#047857" },
  { id: "medium", name: "Medium", hex: "#b45309" },
  { id: "big", name: "Big", hex: "#9f1239" },
];
const sizeOf = (id) => SIZES.find(s => s.id === id) || SIZES[0];

const GROUPS = [
  { id: "true", name: "Make the data true",
    why: "The material came in from five stores in one porting session, and a repository that lies about what is in the repository is worth less than a folder." },
  { id: "reuse", name: "Reuse, not only storage",
    why: "Storage answers what do I have. Reuse answers what should I teach on Wednesday, which is the question that actually costs time." },
  { id: "fast", name: "Move faster through the list",
    why: "Four hundred rows is a working surface, not a page to read. Everything here is about the distance between wanting a thing and having the thing placed." },
  { id: "more", name: "Hold more, and edit without fear",
    why: "The page calls itself a repository of everything and currently holds blocks. And an edit here rewrites a block used on nine days, with no way back." },
];

const IDEAS = [
  // ─── make the data true ───
  { n: 1, group: "true", size: "big", first: true, title: "Merge the duplicates",
    what: "Find near-matches on the link and on a normalised title, show the pair side by side, and merge into one block with every use repointed at the survivor.",
    why: "The porting script deduped inside a class and never across classes, so the same article can sit in five stores at once. Merging is what makes stored once true for everything that arrived before the rule existed." },
  { n: 2, group: "true", size: "medium", first: true, title: "Find the loose ends",
    what: "A filter for schedule items whose libId points at no block, and flow rows whose blockId resolves to nothing.",
    why: "Deleting a block already leaves rows pointing at nothing, and the repository is the only surface that reads every store, so the repository is the only place the breakage can show." },
  { n: 3, group: "true", size: "medium", title: "Manage the tags",
    what: "Rename a tag everywhere at once, merge two tags into a single tag, and delete a tag that turned out to mean nothing.",
    why: "Tags are free text, so framing and Framing are two different tags today. A facet that lies is worse than no facet, because a filter that hides half the matches is invisible when the filter is wrong." },
  { n: 4, group: "true", size: "medium", title: "Check the links",
    what: "Walk every URL on the shelf, flag what returns a 404 or redirects somewhere else entirely, and put the flag in the row.",
    why: "A dead link gets discovered in front of a room, which is the worst available moment for the discovery." },
  { n: 5, group: "true", size: "small", first: true, title: "A health strip across the top",
    what: "Five numbers: untagged, no headline, no link, never used, link broken. Each number a filter.",
    why: "The repository should be the page that tells me what is wrong with the repository, rather than a page I have to interrogate." },

  // ─── reuse ───
  { n: 6, group: "reuse", size: "big", title: "Sets, so a whole day can be reused",
    what: "TYPES already has a set kind and blocks already carry children. Build a set from selected rows, name the set, and drop the set onto a day in one gesture.",
    why: "A Monday that worked is an opener and a reading and an activity together. Reusing the shape of a day is worth more than reusing any single row inside the day." },
  { n: 7, group: "reuse", size: "small", title: "Last used, not only how often",
    what: "A last-used column, sortable, plus a filter for what has gone cold since a date I pick.",
    why: "The question in my head is when did I last teach this and to which class, and a count cannot answer either half of the question." },
  { n: 8, group: "reuse", size: "medium", title: "Used alongside",
    what: "On an open row, what else was on the days this block was on, ranked by how often the pairing happened.",
    why: "The day plans already hold every pairing I have ever made and nothing reads the pairings, so the material cannot suggest its own companions." },
  { n: 9, group: "reuse", size: "small", title: "See a block the way the room will",
    what: "A preview of the headline in the cast style, right on the open row.",
    why: "The headline is the one sentence the room reads, and the headline is currently typed into a plain input with no sense of how the sentence lands on a wall." },
  { n: 10, group: "reuse", size: "small", title: "Every block gets a link",
    what: "/repo/<block id> opens the repository with that row already open.",
    why: "A thing I cannot link to is a thing I have to describe, and describing a block in a note is how a second copy of the block gets made." },

  // ─── move faster ───
  { n: 11, group: "fast", size: "medium", first: true, title: "Select many rows, act once",
    what: "A checkbox column, then tag, retype, move to the shared shelf, or place, applied to everything selected.",
    why: "Retagging four hundred things one row at a time is a job nobody ever does, so the tags stay wrong forever." },
  { n: 12, group: "fast", size: "medium", title: "Drive the list from the keyboard",
    what: "Arrows down the rows, Enter to open a row, Command-Enter to place, Esc to close, and the same shortcut sheet the dashboard has.",
    why: "The dashboard learned this lesson in August and the repository never got the lesson. A long list is a keyboard surface." },
  { n: 13, group: "fast", size: "small", title: "Put the filters in the URL",
    what: "/repo?q=betting&kind=link&class=comm118 as a link I can send myself, with Back undoing a filter rather than leaving the page.",
    why: "The class site got real URLs in August for exactly this reason, and the repository shipped with none." },
  { n: 14, group: "fast", size: "small", title: "Saved views",
    what: "Name a set of filters and pin the view to the top of the page. Untagged readings for COMM 118, or everything cold since spring.",
    why: "The filters I set are the questions I keep asking, and rebuilding a question every time is how a good filter goes unused." },
  { n: 15, group: "fast", size: "small", title: "Density, and which columns show",
    what: "A compact and comfortable toggle, and a menu for which of the six columns are drawn.",
    why: "The type chooser proved the point already: this is a surface I read for a long time, so how the surface reads should be mine to set." },

  // ─── hold more ───
  { n: 16, group: "more", size: "medium", title: "The seed library becomes blocks",
    what: "teaching/seeds.md is a tagged library of stories and hooks. Bring every seed in as a story block, carrying the concept and the slot across as tags.",
    why: "Only the seeds already written into comm999.js became blocks. A page called a repository of everything currently cannot see the file where the best material lives." },
  { n: 17, group: "more", size: "big", title: "Hold what the room made",
    what: "Board posts, questions asked, headlines written, poll results, searchable beside my own material.",
    why: "That is the material that actually accumulates across a quarter, none of it is searchable anywhere, and there is still no instructor view of a board at all. What did students ask about framing last year has no answer today." },
  { n: 18, group: "more", size: "medium", title: "Bring material in in bulk",
    what: "Paste a list of links, or drop a markdown file, and get blocks with titles and hosts filled in.",
    why: "Adding one thing at a time sets the ceiling on how much of my material ever reaches the repository, and the material outside the repository is the material I forget I have." },
  { n: 19, group: "more", size: "medium", first: true, title: "Undo, on a block",
    what: "Keep the previous words on the block, and offer to put the words back for the rest of the session.",
    why: "An edit here rewrites a block used on nine days at once, with no history and no way back. Editing has to feel safe before editing gets used." },
  { n: 20, group: "more", size: "small", title: "Take everything out",
    what: "Export the whole shelf as JSON and as markdown, one file, on a button.",
    why: "Insurance against the store, and the only thing that makes years of material portable if the engine ever changes shape." },
];

export default function RepoIdeas() {
  const [size, setSize] = useState("");
  const [only, setOnly] = useState(false);

  useEffect(() => { document.title = "Ideas for the repository"; }, []);

  const shown = IDEAS.filter(i => (!size || i.size === size) && (!only || i.first));
  const firsts = IDEAS.filter(i => i.first).map(i => i.n).join(", ");

  const chip = (on, text, onClick, color) => (
    <button key={text} className="ri-focus ri-chip" onClick={onClick} aria-pressed={on}
      style={on ? { background: color || TEXT, borderColor: color || TEXT, color: "#fff" } : undefined}>
      {text}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT }}>
      <style>{CSS}</style>

      <header className="ri-head">
        <div className="ri-head-in">
          <a href="/repo" className="ri-back">← Repository</a>
          <h1 className="ri-title">Twenty ways to make the repository better</h1>
          <span className="ri-count">{shown.length} of {IDEAS.length}</span>
        </div>
      </header>

      <div className="ri-body">
        <p className="ri-intro">
          A backlog, not a wishlist. Every idea says what the change is and why the change earns a session,
          because an entry with no why is an entry nobody can rank in November. <b>Say the numbers you want
          and the work starts.</b>
        </p>

        <div className="ri-picks">
          <span className="ri-label">Where I would start</span>
          <p className="ri-picks-text">
            <b>{firsts}</b>. The first two are about the material being wrong rather than the page being thin,
            and every other idea on this page is worth more once the material is clean. Five is an afternoon and
            makes the mess visible. Eleven is what makes fixing four hundred rows possible at all. Nineteen is
            the one that makes me trust editing from here.
          </p>
        </div>

        <div className="ri-filters">
          {chip(!size && !only, "Everything", () => { setSize(""); setOnly(false); })}
          {SIZES.map(s => chip(size === s.id, s.name + " " + IDEAS.filter(i => i.size === s.id).length,
            () => { setSize(size === s.id ? "" : s.id); }, s.hex))}
          {chip(only, "Where I would start", () => setOnly(!only))}
        </div>

        {GROUPS.map(g => {
          const mine = shown.filter(i => i.group === g.id);
          if (!mine.length) return null;
          return (
            <section key={g.id} className="ri-group">
              <h2 className="ri-group-name">{g.name}</h2>
              <p className="ri-group-why">{g.why}</p>
              <div className="ri-list">
                {mine.map(i => <Idea key={i.n} idea={i} />)}
              </div>
            </section>
          );
        })}

        {!shown.length ? <p className="ri-empty">Nothing at that size. Clear the filter.</p> : null}

        <footer className="ri-foot">
          <span className="ri-label">Where the list came from</span>
          <p className="ri-foot-text">
            Read out of the code on 31 August: the porting script, the day plans, the schedule writers, and the
            parts of HANDOFF.md that say what was left unfinished. Nothing here is a guess about what the page
            could theoretically do. Every entry is a gap something in the repository already points at.
          </p>
        </footer>
      </div>
    </div>
  );
}

export function Idea({ idea }) {
  const s = sizeOf(idea.size);
  return (
    <article className={"ri-idea" + (idea.first ? " ri-idea-first" : "")} id={"i" + idea.n}>
      <div className="ri-num">{String(idea.n).padStart(2, "0")}</div>
      <div className="ri-idea-body">
        <div className="ri-idea-top">
          <h3 className="ri-idea-title">{idea.title}</h3>
          <span className="ri-size" style={{ background: s.hex }}>{s.name}</span>
          {idea.first ? <span className="ri-flag">Start here</span> : null}
        </div>
        <p className="ri-what">{idea.what}</p>
        <p className="ri-why"><span className="ri-why-tag">Why</span>{idea.why}</p>
      </div>
    </article>
  );
}

const CSS = `
.ri-focus:focus-visible{outline:2.5px solid #171310;outline-offset:2px;border-radius:8px}
.ri-head{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid ${BORDER}}
.ri-head-in{max-width:900px;margin:0 auto;padding:12px 20px;display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.ri-back{font-size:14px;color:${MUTED};text-decoration:none}
.ri-back:hover{color:${TEXT}}
.ri-title{margin:0;font-size:20px;font-weight:700;letter-spacing:-.02em}
.ri-count{margin-left:auto;font-family:${MONO};font-size:12px;color:${MUTED}}
.ri-body{max-width:900px;margin:0 auto;padding:22px 20px 70px;display:flex;flex-direction:column;gap:20px}
.ri-intro{margin:0;font-size:16.5px;line-height:1.6;color:${SECOND}}
.ri-label{font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:${MUTED}}
.ri-picks{background:#fff;border-radius:14px;padding:13px 16px;display:flex;flex-direction:column;gap:6px;
  box-shadow:0 1px 2px rgba(23,19,16,.05),0 0 0 1px rgba(23,19,16,.07);border-left:4px solid #047857}
.ri-picks-text{margin:0;font-size:15px;line-height:1.55;color:${SECOND}}
.ri-filters{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ri-chip{min-height:36px;padding:0 14px;border-radius:999px;border:1px solid ${BORDER};background:#fff;
  cursor:pointer;font-family:inherit;font-size:14px;color:${SECOND}}
.ri-chip:hover{border-color:${TEXT};color:${TEXT}}
.ri-group{display:flex;flex-direction:column;gap:8px}
.ri-group-name{margin:14px 0 0;font-size:21px;font-weight:700;letter-spacing:-.02em}
.ri-group-why{margin:0 0 6px;font-size:15px;line-height:1.55;color:${MUTED};max-width:70ch}
.ri-list{display:flex;flex-direction:column;gap:10px}
.ri-idea{display:flex;gap:14px;background:#fff;border-radius:14px;padding:14px 16px;
  box-shadow:0 1px 2px rgba(23,19,16,.05),0 0 0 1px rgba(23,19,16,.06)}
.ri-idea:hover{box-shadow:0 3px 12px -3px rgba(23,19,16,.13),0 0 0 1px rgba(23,19,16,.09)}
.ri-idea-first{border-left:4px solid #047857;padding-left:12px}
.ri-num{flex:none;font-family:${MONO};font-size:20px;font-weight:600;color:${BORDER};line-height:1.2;min-width:34px}
.ri-idea-body{display:flex;flex-direction:column;gap:6px;min-width:0}
.ri-idea-top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.ri-idea-title{margin:0;font-size:17px;font-weight:600;letter-spacing:-.012em;line-height:1.3}
.ri-size{font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:#fff;border-radius:999px;padding:3px 9px}
.ri-flag{font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:#047857;border:1px solid #047857;border-radius:999px;padding:2px 8px}
.ri-what{margin:0;font-size:15px;line-height:1.55;color:${TEXT}}
.ri-why{margin:0;font-size:14.5px;line-height:1.55;color:${MUTED}}
.ri-why-tag{font-family:${MONO};font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:${MUTED};background:${SURFACE};border-radius:999px;padding:2px 8px;margin-right:8px}
.ri-empty{margin:20px 0;font-size:16px;color:${MUTED}}
.ri-foot{margin-top:16px;padding-top:16px;border-top:1px solid ${BORDER};display:flex;flex-direction:column;gap:6px}
.ri-foot-text{margin:0;font-size:14.5px;line-height:1.6;color:${MUTED};max-width:72ch}

@media (max-width: 620px){
  .ri-num{font-size:16px;min-width:26px}
  .ri-idea{padding:12px 13px}
}
`;
