// The pages around the builder: one project read at its own address, the
// class gallery, and the instructor's two pages.
//
// Andrew, 2026-11-23:
//   - "A gallery per class", at /<class>/exhibits, each card the cover,
//     headline, names and summary, grouped by topic area and shuffled inside
//     a group so nobody is always first. Nothing shows until he presses
//     Release.
//   - A private preview link opens a draft for anyone who holds the link, and
//     a reader there can leave a note on any block ("they can get reviews
//     anytime by sharing with friends and others in class"). The makers and
//     he read the notes.
//   - A film gets "a page in our design": the player, then headline, summary,
//     makers and sources.

import { useEffect, useMemo, useState } from "react";
import Reader, { useExhibitFonts } from "./reader.jsx";
import { SAMPLE } from "./sample.js";
import { exhibitHref, FINAL_DUE, OUTLINE_DUE, idOfSlug } from "./model.js";
import { loadOne, loadGallery, sendNote, setState } from "./client.js";
import { getSession } from "../session.js";

const NOTE_CSS = `
.xn{position:relative}
.xn .nb{position:absolute;right:8px;top:8px;z-index:5;font:700 12.5px "Libre Franklin",system-ui,sans-serif;background:#101216;color:#fff;border:0;border-radius:99px;padding:7px 12px;cursor:pointer;opacity:0;transition:opacity .12s}
.xn:hover .nb,.xn .nb:focus-visible,.xn.open .nb{opacity:1}
.xn .box{max-width:680px;margin:12px auto 0;background:#101216;color:#fff;border-radius:10px;padding:14px;font:15px/1.4 "Libre Franklin",system-ui,sans-serif}
.xn .box textarea,.xn .box input{width:100%;box-sizing:border-box;font:15px/1.4 "Libre Franklin",system-ui,sans-serif;color:#fff;background:#1b1e24;border:1.5px solid #343944;border-radius:8px;padding:9px 11px;margin-bottom:8px}
.xn .box button{font:700 13.5px "Libre Franklin",system-ui,sans-serif;color:#101216;background:#ffd166;border:0;border-radius:8px;padding:9px 14px;cursor:pointer;margin-right:8px}
.xn .box .q{background:#262a32;color:#fff}
.xdraft{position:sticky;top:0;z-index:40;background:#ffd166;color:#101216;font:700 13.5px "Libre Franklin",system-ui,sans-serif;padding:8px 20px;display:flex;gap:14px;flex-wrap:wrap}
.xdraft a{color:inherit}
@media (hover:none){ .xn .nb{opacity:1} }
`;

function NoteOn({ b, classId, id, preview, children }) {
  const [open, setOpen] = useState(false), [text, setText] = useState(""), [state, setSt] = useState("");
  const [name, setName] = useState(() => { try { return localStorage.getItem("exhibit-note-name") || ""; } catch { return ""; } });
  const signedIn = !!getSession();
  const send = async () => {
    setSt("Sending");
    try { await sendNote(classId, { id, preview, block: b.id, text, name }); try { localStorage.setItem("exhibit-note-name", name); } catch { /* private mode */ } setText(""); setSt("Sent"); setTimeout(() => { setOpen(false); setSt(""); }, 900); }
    catch (e) { setSt(e.message); }
  };
  return <div className={"xn" + (open ? " open" : "")}>
    <button type="button" className="nb" onClick={() => setOpen(o => !o)}>Leave a note</button>
    {children}
    {open && <div className="box">
      {!signedIn && <input type="text" value={name} placeholder="Your name" aria-label="Your name" onChange={e => setName(e.target.value)} />}
      <textarea rows={3} value={text} aria-label="Your note" onChange={e => setText(e.target.value)} />
      <button type="button" onClick={send} disabled={!text.trim() || (!signedIn && !name.trim())}>Send the note</button><button type="button" className="q" onClick={() => setOpen(false)}>Close</button> {state}
    </div>}
  </div>;
}

/** One project at /<class>/exhibits/<slug>. With ?preview=<token> a draft opens and takes notes. */
export function ExhibitPage({ config, slug }) {
  useExhibitFonts();
  const preview = useMemo(() => new URLSearchParams(window.location.search).get("preview") || "", []);
  const [got, setGot] = useState(null), [err, setErr] = useState("");
  const sample = slug === "sample";
  useEffect(() => {
    if (sample) return;
    let on = true;
    loadOne(config.id, slug, preview).then(o => on && setGot(o)).catch(e => on && setErr(e.message));
    return () => { on = false; };
  }, [config.id, slug, preview, sample]);
  useEffect(() => { const d = sample ? SAMPLE : got?.doc; if (d?.headline) document.title = d.headline; }, [got, sample]);
  if (sample) return <Reader doc={SAMPLE} />;
  if (err) return <p style={{ padding: 24, font: "17px system-ui" }}>{err}</p>;
  if (!got) return null;
  const doc = { ...got.doc, term: config.code };
  const notes = !got.released && got.can?.note;
  const id = idOfSlug(slug);
  return <>
    {!got.released && <div className="xdraft"><style>{NOTE_CSS}</style><span>Draft. Not public yet.</span>{notes && <span>Point at any block to leave a note for the makers.</span>}{got.can?.edit && <a href={`/${config.id}/worksheets/final-project`}>Back to building</a>}</div>}
    <Reader doc={doc} around={notes ? (b, node) => (node ? <NoteOn b={b} classId={config.id} id={id} preview={preview}>{node}</NoteOn> : null) : undefined} />
  </>;
}

const GAL_CSS = `
.xg{min-height:100vh;background:#101216;color:#eef0f3;font:16px/1.45 "Libre Franklin",system-ui,sans-serif;padding:48px max(20px, env(safe-area-inset-right, 0px)) 96px max(20px, env(safe-area-inset-left, 0px))}
.xg *{box-sizing:border-box}
.xg .in{max-width:1240px;margin:0 auto}
.xg h1{font:600 clamp(44px,8vw,104px)/.95 "Newsreader",Georgia,serif;letter-spacing:-.02em;margin:0}
.xg h1 em{font-style:italic;font-weight:400;color:#ffd166}
.xg h2{font:700 13px "Libre Franklin",system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#ffd166;margin:56px 0 16px;padding-bottom:10px;border-bottom:3px solid #eef0f3}
.xg .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.xg .card{display:flex;flex-direction:column;min-height:380px;border-radius:6px;overflow:hidden;text-decoration:none;position:relative;transition:transform .15s ease}
.xg .card:hover{transform:translateY(-4px)}
.xg .card .pic{aspect-ratio:16/10;background-size:cover;background-position:center}
.xg .card .tx{flex:1;padding:18px 18px 20px;display:flex;flex-direction:column;gap:10px}
.xg .card h3{margin:0;font-size:30px;line-height:1.02;text-wrap:balance}
.xg .card p{margin:0;font-size:15px;line-height:1.4;opacity:.92}
.xg .card .by{margin-top:auto;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.xg .card .way{position:absolute;left:12px;top:12px;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:#101216;color:#fff;border-radius:99px;padding:5px 10px}
.xg .card[data-pal="orange"]{background:#d9541e;color:#fff8ef}
.xg .card[data-pal="green"]{background:#1c7a41;color:#f6fff3}
.xg .card[data-pal="blue"]{background:#1560c8;color:#f4f9ff}
.xg .card[data-pal="red"]{background:#b01f2d;color:#fff5f2}
.xg .card[data-pal="violet"]{background:#5a3ed2;color:#f8f6ff}
.xg .card[data-type="news"] h3{font-family:"Newsreader",Georgia,serif;font-weight:600}
.xg .card[data-type="museum"] h3{font-family:"Archivo",sans-serif;font-weight:850;font-stretch:72%;text-transform:uppercase}
.xg .card[data-type="magazine"] h3{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;font-size:36px}
`;
// The same order for one visit, a new one the next.
function shuffled(list) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function Card({ c }) {
  const pic = c.cover?.url || "";
  return <a className="card" href={exhibitHref(c)} data-pal={c.pal} data-type={c.type}>
    {pic && <div className="pic" role="img" aria-label={c.cover.alt || ""} style={{ backgroundImage: `url("${String(pic).replace(/["\\\n]/g, "")}")` }} />}
    {c.way !== "exhibit" && <span className="way">{c.way === "film" ? "Film" : "Own page"}</span>}
    <div className="tx"><h3>{c.headline}</h3>{c.summary && <p>{c.summary}</p>}<div className="by">{(c.names || []).join(" and ")}</div></div>
  </a>;
}

/** The class gallery at /<class>/exhibits. */
export function GalleryPage({ config }) {
  useExhibitFonts();
  const [got, setGot] = useState(null);
  useEffect(() => { let on = true; loadGallery(config.id).then(o => on && setGot(o)).catch(() => on && setGot({ cards: [], released: false })); return () => { on = false; }; }, [config.id]);
  const groups = useMemo(() => {
    const by = new Map();
    for (const c of shuffled(got?.cards || [])) { const k = String(c.area || "").trim(); if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
    return [...by.entries()].sort((a, b) => (a[0] === "" ? 1 : b[0] === "" ? -1 : a[0].localeCompare(b[0])));
  }, [got]);
  return <div className="xg"><style>{GAL_CSS}</style><div className="in">
    <h1>{config.code} <em>final projects</em></h1>
    {groups.map(([area, cards]) => <section key={area}>{(area || groups.length > 1) && <h2>{area || "More"}</h2>}<div className="grid" style={!area && groups.length === 1 ? { marginTop: 40 } : null}>{cards.map(c => <Card key={c.id} c={c} />)}</div></section>)}
  </div></div>;
}

// ─── the instructor's pages ───

const REV_CSS = `
.xv{min-height:100vh;background:#f6f5f1;color:#1c1d20;font:15px/1.45 "Libre Franklin",system-ui,sans-serif;padding:32px 24px 80px;text-align:left}
.xv *{box-sizing:border-box}
.xv .in{max-width:1240px;margin:0 auto}
.xv h1{font:600 44px/1 "Newsreader",Georgia,serif;margin:0 0 6px}
.xv .meta{color:#5d6068;margin:0 0 18px}
.xv .bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:22px}
.xv button,.xv a.b{font:700 13.5px "Libre Franklin",system-ui,sans-serif;background:#1c1d20;color:#fff;border:0;border-radius:8px;padding:9px 14px;cursor:pointer;text-decoration:none;display:inline-block}
.xv button.q,.xv a.q{background:#e4e2db;color:#1c1d20}
.xv button.go{background:#1c7a41}
.xv table{width:100%;border-collapse:collapse}
.xv th{font-size:12px;letter-spacing:.08em;text-transform:uppercase;text-align:left;color:#5d6068;padding:8px 10px;border-bottom:3px solid #1c1d20}
.xv td{padding:12px 10px;border-bottom:1px solid #d9d6cd;vertical-align:top}
.xv td b{font:600 19px/1.15 "Newsreader",Georgia,serif;display:block}
.xv .ok{color:#1c7a41;font-weight:700}
.xv .no{color:#b01f2d;font-weight:700}
.xv .miss{color:#5d6068;font-size:13px}
.xv .acts{display:flex;flex-wrap:wrap;gap:6px}
.xv .acts a,.xv .acts button{padding:6px 10px;font-size:12.5px}
.xv .who{background:#fff;border-radius:8px;padding:8px 10px;margin-top:6px;font-size:13.5px}
`;
const stamp = (t) => (t ? new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

/** Every project in the class: where each stands, the outline, the checklist, Release and reopen. */
export function ExhibitReview({ config, roster = [] }) {
  const [got, setGot] = useState(null), [err, setErr] = useState(""), [showWho, setShowWho] = useState(false);
  const load = () => loadGallery(config.id, true).then(setGot).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [config.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <div className="xv"><style>{REV_CSS}</style><div className="in"><p>{err}</p></div></div>;
  if (!got) return null;
  const cards = [...got.cards].sort((a, b) => String(a.names?.[0] || "").localeCompare(String(b.names?.[0] || "")));
  const started = new Set(cards.flatMap(c => c.makers || []));
  const notStarted = roster.filter(s => s.email && !started.has(String(s.email).toLowerCase())).map(s => s.name);
  const release = (on) => setState(config.id, { released: on }).then(load).catch(e => setErr(e.message));
  const reopen = (c) => { const until = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); setState(config.id, { unlock: { id: c.id, until: got.unlocks?.[c.id] ? "" : until } }).then(load).catch(e => setErr(e.message)); };
  const past = Date.now() > Date.parse(FINAL_DUE);
  return <div className="xv"><style>{REV_CSS}</style><div className="in">
    <h1>{config.code} final projects</h1>
    <p className="meta">Outline due {stamp(OUTLINE_DUE)}. Locks {stamp(FINAL_DUE)}. {cards.length} started{notStarted.length ? `, ${notStarted.length} not started` : ""}. {got.released ? "Released." : "Not released."}</p>
    <div className="bar">
      {got.released ? <button type="button" className="q" onClick={() => release(false)}>Take back the release</button> : <button type="button" className="go" onClick={() => release(true)}>Release to the public gallery</button>}
      <a className="b q" href={`/${config.id}/exhibits`}>The gallery</a><a className="b q" href={`/${config.id}/exhibits/sample`}>The sample</a><a className="b q" href={`/${config.id}/worksheets/final-project?control`}>How the builder works</a>
      <button type="button" className="q" onClick={() => setShowWho(s => !s)}>{showWho ? "Hide who did what" : "Show who did what"}</button>
    </div>
    <table><thead><tr><th>Project</th><th>Outline</th><th>Checklist</th><th>Words</th><th>Last change</th><th /></tr></thead><tbody>
      {cards.map(c => { const miss = (c.list || []).filter(l => !l.ok); return <tr key={c.id}>
        <td><b>{c.headline || "No headline yet"}</b>{(c.names || []).join(" and ")} · {c.way === "film" ? "Film" : c.way === "html" ? "Own HTML" : `Exhibit, ${(c.pages || []).length} pages`}
          {showWho && c.who && <div className="who">{c.who}</div>}</td>
        <td className={c.outline ? "ok" : "no"}>{c.outline ? "Done" : "Not yet"}<div className="miss">{(c.pages || []).map(p => p.name).filter(Boolean).join(", ")}</div></td>
        <td><span className={miss.length ? "no" : "ok"}>{(c.list || []).length - miss.length} of {(c.list || []).length}</span><div className="miss">{miss.map(l => l.say + (l.need > 1 ? ` ${l.have} of ${l.need}` : "")).join(" · ")}</div></td>
        <td>{c.words}</td><td>{stamp(c.updated)}</td>
        <td><div className="acts"><a className="b" href={`${exhibitHref(c)}?preview=${c.preview}`}>Read</a><a className="b q" href={`/${config.id}/worksheets/final-project?s=${encodeURIComponent((c.makers || [])[0] || "")}`}>Their file</a>{past && <button type="button" className="q" onClick={() => reopen(c)}>{got.unlocks?.[c.id] ? "Close again" : "Reopen for a day"}</button>}</div></td>
      </tr>; })}
    </tbody></table>
    {notStarted.length > 0 && <p className="meta" style={{ marginTop: 22 }}>Not started: {notStarted.join(", ")}</p>}
  </div></div>;
}

const RULES = [
  ["What a project is", [
    "One of three things: an exhibit built on the page, a film linked from YouTube, Vimeo or Google Drive, or one .html file the student made.",
    "Every project carries a headline, a summary of up to 50 words, sources, and a line on how AI was used.",
    "A pair shares one project. Who is a pair comes from the pairs on the preferences review. Everyone else works alone.",
    "If two students are paired after one of them started, the pair's project begins as the fuller of their two files.",
  ]],
  ["The outline", [
    "The first step of the builder: the way of making, a headline, a summary, and for an exhibit each page named with what goes on the page.",
    "Due Thursday, December 3, at 11:59 PM. The review page says Done once a headline, a summary and a plan on every page are there.",
    "Nothing locks on December 3. The outline is the skeleton the student keeps building on.",
  ]],
  ["Saving and the deadline", [
    "There is no hand-in button. The builder saves about a second after each change.",
    "When two partners edit at once, each save is merged with the other: the newer copy of each block, page and source wins, and a deleted thing stays deleted.",
    "At 12:00 PM on Thursday, December 10, the server stops taking saves and uploads. What is there is the final.",
    "Reopen for a day, on the review page after the deadline, lets one project save again for 24 hours.",
  ]],
  ["The look", [
    "A student picks one of three type styles, one of five light palettes, and pages or one scroll. Nothing else about the design can be changed.",
    "An exhibit has up to six pages. Text takes bold, italic and source links.",
    "A link inside a paragraph is always a source. A reader who clicks the words sees the citation, the student's note on why the source was used, and a link out.",
    "Photos come in four placements: column width, full width, two side by side, and beside the text below. Every image asks for a description and a credit.",
  ]],
  ["The checklist", [
    "COMM 3: a headline, a summary, the AI line, 5 sources with at least 2 academic, an audio clip, an interview, and images or video.",
    "COMM 118: a headline, a summary, the AI line, 5 academic and 5 popular press sources, 3 concepts, an audio clip, and 10 images, graphics, videos or interactive things.",
    "Toward the ten, every image counts, so a gallery of four is four. A video, a post or chart, a timeline, a map and a quiz count one each. Audio does not count.",
    "Every image needs a description and a credit, and every audio clip needs a transcript. A film needs captions.",
    "The checklist never blocks anything. It shows the student, and the review page, what is still missing.",
  ]],
  ["Sharing and release", [
    "Each project has a private preview link. Anyone holding the link can read the draft and leave a note on any block.",
    "A reader who is signed in is named from the roster. Anyone else types a name. Only the makers and the instructor see the notes.",
    "Nothing appears in the class gallery until Release is pressed on the review page. Take back the release hides every project again.",
    "The gallery shows the cover, headline, names and summary, grouped by the topic area the student typed and shuffled inside each group on every visit.",
    "Full names show on the public page. Who did what is private and stays hidden on the review page until Show who did what is pressed.",
  ]],
  ["Where things are kept", [
    "Each project is one file in the private instructor bucket, read and written only by the server.",
    "Images, audio and HTML files go to the public notes bucket under exhibits. A photo is shrunk in the browser before upload. The cap is 50 MB a file.",
    "A student's HTML file runs inside a sandboxed frame with no access to the site's sign-in.",
    "Poll and quiz answers are not saved anywhere.",
  ]],
];
const CTL_CSS = `
.xc{min-height:100vh;background:#f6f5f1;color:#1c1d20;font:17px/1.5 "Newsreader",Georgia,serif;padding:40px 24px 90px;text-align:left}
.xc .in{max-width:760px;margin:0 auto}
.xc h1{font-size:46px;line-height:1;margin:0 0 14px}
.xc h2{font:700 13px "Libre Franklin",system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;margin:34px 0 8px;padding-bottom:8px;border-bottom:3px solid #1c1d20}
.xc li{margin-bottom:8px}
.xc a{color:inherit;margin-right:16px;font:700 14px "Libre Franklin",system-ui,sans-serif}
`;
/** How every rule of the builder works, for the instructor. */
export function ExhibitControl({ config }) {
  const base = `/${config.id}/worksheets/final-project`;
  return <div className="xc"><style>{CTL_CSS}</style><div className="in">
    <h1>Final project, how the builder works</h1>
    <p><a href={base}>The builder</a><a href={base + "?review"}>Review</a><a href={`/${config.id}/exhibits/sample`}>The sample</a><a href={`/${config.id}/exhibits`}>The gallery</a></p>
    {RULES.map(([head, lines]) => <section key={head}><h2>{head}</h2><ul>{lines.map(l => <li key={l}>{l}</li>)}</ul></section>)}
  </div></div>;
}
