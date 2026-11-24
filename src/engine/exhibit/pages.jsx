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
import { Shell } from "../audiostory/control.jsx";
import { Sec, Row, Btn, Chip } from "../portal/bits.jsx";

const NOTE_CSS = `
.xn{position:relative}
.xn .nb{position:absolute;right:8px;top:8px;z-index:5;font:600 15px 'Outfit',system-ui,sans-serif;background:#1c1917;color:#fff;border:0;border-radius:12px;min-height:40px;padding:0 14px;cursor:pointer;opacity:0;transition:opacity .12s}
.xn:hover .nb,.xn .nb:focus-visible,.xn.open .nb{opacity:1}
.xn .box{max-width:740px;margin:12px auto 0;background:#fff;color:#1c1917;border-radius:16px;box-shadow:0 0 0 1px #e3ded8,0 12px 30px rgba(28,25,23,.12);padding:16px;font:16px/1.4 'Outfit',system-ui,sans-serif}
.xn .box textarea,.xn .box input{width:100%;box-sizing:border-box;font:16px/1.4 'Outfit',system-ui,sans-serif;color:#1c1917;background:#fff;border:1.5px solid #e3ded8;border-radius:12px;padding:10px 13px;margin-bottom:8px}
.xn .box textarea:focus,.xn .box input:focus{outline:0;border-color:#1c1917}
.xn .box button{font:600 15px 'Outfit',system-ui,sans-serif;color:#fff;background:#1c1917;border:0;border-radius:12px;min-height:44px;padding:0 16px;cursor:pointer;margin-right:8px}
.xn .box button:disabled{opacity:.5;cursor:default}
.xn .box .q{background:#f6f4f1;color:#1c1917}
.xdraft{position:sticky;top:0;z-index:40;background:#fdf1e6;color:#7c3a05;font:600 15px 'Outfit',system-ui,sans-serif;padding:10px 20px;display:flex;gap:6px 18px;flex-wrap:wrap}
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

// The gallery is a page of the class site, so the ground, the greys and the
// title are the class site's own. A card keeps the colours and the type its
// makers picked: that is what makes the wall read as many people's work.
const GAL_CSS = `
.xg{min-height:100vh;background:var(--surface-page,#fafaf9);color:var(--text-primary,#1c1917);font:17px/1.45 var(--font-body,'Outfit',-apple-system,BlinkMacSystemFont,sans-serif);padding:56px max(20px, env(safe-area-inset-right, 0px)) 96px max(20px, env(safe-area-inset-left, 0px));text-align:left}
.xg *{box-sizing:border-box}
.xg .in{max-width:1240px;margin:0 auto}
.xg h1{font:500 clamp(36px,5vw,56px)/1.05 'Lora',Georgia,serif;letter-spacing:-.01em;margin:0}
.xg .lede{margin:14px 0 0;font-size:20px;color:var(--text-secondary,#57534e)}
.xg section{display:grid;grid-template-columns:190px minmax(0,1fr);gap:16px 28px;align-items:start;margin-top:40px;padding-top:28px;border-top:1px solid var(--line-strong,#e3ded8)}
.xg section.solo{display:block;border-top:0;padding-top:0}
.xg h2{font:600 22px/1.15 'Lora',Georgia,serif;margin:0;position:sticky;top:20px;text-wrap:balance}
.xg .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
@media (max-width:860px){ .xg section{grid-template-columns:minmax(0,1fr)} .xg h2{position:static} }
.xg .card{display:flex;flex-direction:column;min-height:250px;border-radius:16px;overflow:hidden;text-decoration:none;position:relative;transition:transform .18s ease, box-shadow .18s ease}
.xg .card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(28,25,23,.18)}
.xg .card:focus-visible{outline:2px solid var(--text-primary,#1c1917);outline-offset:2px}
.xg .card .pic{aspect-ratio:3/2;background-size:cover;background-position:center}
.xg .card .tx{flex:1;padding:16px 16px 16px;display:flex;flex-direction:column;gap:8px}
.xg .card h3{margin:0;font-size:22px;line-height:1.08;text-wrap:balance}
.xg .card:not(:has(.pic)) h3{font-size:28px;margin-top:auto}
.xg .card p{margin:0;font-size:15px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.xg .card .by{margin-top:auto;padding-top:6px;font-size:14px;font-weight:600}
.xg .card:not(:has(.pic)) .by{margin-top:0}
.xg .card .way{position:absolute;left:10px;top:10px;font-size:13px;font-weight:600;background:#fff;color:#1c1917;border-radius:999px;padding:4px 10px}
.xg .card[data-pal="orange"]{background:#d9541e;color:#fff8ef}
.xg .card[data-pal="green"]{background:#1c7a41;color:#f6fff3}
.xg .card[data-pal="blue"]{background:#1560c8;color:#f4f9ff}
.xg .card[data-pal="red"]{background:#b01f2d;color:#fff5f2}
.xg .card[data-pal="violet"]{background:#5a3ed2;color:#f8f6ff}
.xg .card[data-type="news"] h3{font-family:"Newsreader",Georgia,serif;font-weight:600}
.xg .card[data-type="museum"] h3{font-family:"Archivo",sans-serif;font-weight:850;font-stretch:72%;text-transform:uppercase}
.xg .card[data-type="magazine"] h3{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;font-size:27px}
@media (prefers-reduced-motion:reduce){ .xg .card{transition:none} }
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
    <h1>{config.code} final projects</h1>
    {groups.map(([area, cards]) => <section key={area} className={!area && groups.length === 1 ? "solo" : undefined}>{(area || groups.length > 1) && <h2>{area || "More"}</h2>}<div className="grid">{cards.map(c => <Card key={c.id} c={c} />)}</div></section>)}
  </div></div>;
}

// ─── the instructor's pages ───

const stamp = (t) => (t ? new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");
const wayOf = (c) => (c.way === "film" ? "Film" : c.way === "html" ? "Own HTML" : `Exhibit, ${(c.pages || []).length} ${(c.pages || []).length === 1 ? "page" : "pages"}`);

/** Every project in the class: where each stands, the outline, the checklist, Release and reopen. */
export function ExhibitReview({ config, roster = [] }) {
  const [got, setGot] = useState(null), [err, setErr] = useState(""), [showWho, setShowWho] = useState(false);
  const load = () => loadGallery(config.id, true).then(setGot).catch(e => setErr(e.message));
  useEffect(() => { load(); }, [config.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <Shell config={config}><p className="pt-sub">{err}</p></Shell>;
  if (!got) return null;
  const cards = [...got.cards].sort((a, b) => String(a.names?.[0] || "").localeCompare(String(b.names?.[0] || "")));
  const started = new Set(cards.flatMap(c => c.makers || []));
  const notStarted = roster.filter(s => s.email && !started.has(String(s.email).toLowerCase())).map(s => s.name);
  const release = (on) => setState(config.id, { released: on }).then(load).catch(e => setErr(e.message));
  const reopen = (c) => { const until = new Date(Date.now() + 24 * 3600 * 1000).toISOString(); setState(config.id, { unlock: { id: c.id, until: got.unlocks?.[c.id] ? "" : until } }).then(load).catch(e => setErr(e.message)); };
  const past = Date.now() > Date.parse(FINAL_DUE);
  const base = `/${config.id}/worksheets/final-project`;
  return <Shell config={config}>
    <div className="pt-stack">
      <h1 className="pt-h1">{config.code} final projects</h1>
      <p className="pt-sub">Outline due {stamp(OUTLINE_DUE)}. Locks {stamp(FINAL_DUE)}. {cards.length} started{notStarted.length ? `, ${notStarted.length} not started` : ""}. {got.released ? "Released to the gallery." : "Not released."}</p>
    </div>
    <div className="pt-acts">
      {got.released ? <Btn kind="plain" onClick={() => release(false)}>Take back the release</Btn> : <Btn onClick={() => release(true)}>Release to the public gallery</Btn>}
      <Chip href={`/${config.id}/exhibits`}>The gallery</Chip><Chip href={`/${config.id}/exhibits/sample`}>The sample</Chip><Chip href={base + "?control"}>How the builder works</Chip>
      <Chip on={showWho} onClick={() => setShowWho(x => !x)}>Who did what</Chip>
    </div>
    <Sec name="Projects" />
    <div className="pt-stack">
      {cards.length === 0 && <div className="pt-row off"><div className="pt-main"><span className="pt-title say">Nobody has started a project yet.</span></div></div>}
      {cards.map(c => { const list = c.list || [], miss = list.filter(l => !l.ok), all = list.length > 0 && miss.length === 0;
        return <Row key={c.id} tint={all ? "done" : c.outline ? "" : "due"}>
          <span className="pt-title">{c.headline || "No headline yet"}</span>
          <span className="pt-meta">{(c.names || []).join(" and ")} · {wayOf(c)} · {(c.words || 0).toLocaleString("en-US")} words · Last change {stamp(c.updated)}</span>
          <span className="pt-text">Outline {c.outline ? "done" : "not done yet"}{(c.pages || []).some(p => p.name) ? ": " + (c.pages || []).map(p => p.name).filter(Boolean).join(", ") : ""}.</span>
          <span className="pt-text">Checklist {list.length - miss.length} of {list.length}{miss.length ? ". Still missing: " + miss.map(l => l.say + (l.need > 1 ? ` (${l.have} of ${l.need})` : "")).join("; ") : ""}.</span>
          {showWho && c.who && <span className="pt-text"><b>Who did what.</b> {c.who}</span>}
          <span className="pt-acts"><Btn href={`${exhibitHref(c)}?preview=${c.preview}`}>Read</Btn><Chip href={`${base}?s=${encodeURIComponent((c.makers || [])[0] || "")}`}>Their file</Chip>{past && <Chip on={!!got.unlocks?.[c.id]} onClick={() => reopen(c)}>{got.unlocks?.[c.id] ? "Reopened, close again" : "Reopen for a day"}</Chip>}</span>
        </Row>; })}
    </div>
    {notStarted.length > 0 && <><Sec name="Not started" />
      <div className="pt-row off"><div className="pt-main"><span className="pt-text">{notStarted.join(", ")}</span></div></div></>}
  </Shell>;
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
/** How every rule of the builder works, for the instructor. */
export function ExhibitControl({ config }) {
  const base = `/${config.id}/worksheets/final-project`;
  return <Shell config={config}>
    <h1 className="pt-h1">Final project, how the builder works</h1>
    <div className="pt-acts"><Chip href={base}>The builder</Chip><Chip href={base + "?review"}>Review</Chip><Chip href={`/${config.id}/exhibits/sample`}>The sample</Chip><Chip href={`/${config.id}/exhibits`}>The gallery</Chip></div>
    {RULES.map(([head, lines]) => <section key={head} className="pt-stack"><Sec name={head} />
      <div className="pt-row"><div className="pt-main"><ul className="aic-list" style={{ fontSize: 17, display: "grid", gap: 8 }}>{lines.map(l => <li key={l}>{l}</li>)}</ul></div></div></section>)}
  </Shell>;
}
