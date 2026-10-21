// Andrew's side of 3x5: every roll in a class, and each roll as its own page.
//
// /comm3/worksheets/3x5?review is the index, one row per roll, grouped by
// section the way pre-production's review is. /comm3/worksheets/3x5?s=<id>
// is one student's rolls, read big: the group, the three strips with the
// photos large and their contact-sheet numbers, and the two write-ins under
// each. Andrew, 2026-10-21: "I want a nice page for each submission for each
// class ... keep photo numbers ... if students work together make sure both
// names are on there."
//
// A roll lives on the sheet of whoever made it, with the group's names on it,
// so a row here is a roll, not a student. Both pages read every sheet through
// /api/worksheet-submits (all: true), so the roll page can walk to the next
// group without another read.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { idOf } from "../roster.js";
import { rollsOf } from "./sheet.js";
import * as TOKENS from "../tokens.js";

const BASE = "/3x5/";

const call = async (body) => {
  const r = await fetch("/api/worksheet-submits", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};

const when = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const lower = (s) => String(s || "").trim().toLowerCase();

// Every sheet on the worksheet, with its rolls parsed, plus the photos
// numbered the way the contact sheet numbers them: by the day they were taken.
function useRolls(config, worksheetKey) {
  const [state, setState] = useState({ sheets: null, photos: null, error: "" });
  useEffect(() => {
    let alive = true;
    Promise.all([
      call({ groupKey: config.id, key: worksheetKey, all: true }),
      fetch(BASE + "index.json").then(r => r.json()).catch(() => []),
    ]).then(([out, list]) => {
      if (!alive) return;
      const photos = new Map();
      (Array.isArray(list) ? list : []).slice().sort((a, b) => String(a.taken).localeCompare(String(b.taken)))
        .forEach((p, i) => photos.set(p.id, { ...p, n: String(i + 1).padStart(2, "0") }));
      const sheets = out.sheets.map(s => ({ ...s, rolls: rollsOf(s.answers) })).filter(s => s.rolls.length);
      setState({ sheets, photos, error: "" });
    }).catch(e => { if (alive) setState({ sheets: null, photos: null, error: e.message }); });
    return () => { alive = false; };
  }, [config.id, worksheetKey]);
  return state;
}

// The sheets of a section in the order both pages use: handed in first, then
// by the owner's name.
function ordered(sheets, roster, section) {
  const byEmail = new Map(roster.filter(s => s.email).map(s => [lower(s.email), s]));
  return sheets
    .map(sh => ({ ...sh, student: byEmail.get(sh.viewer_id) || null }))
    .filter(sh => sh.student && !isLurker(sh.student.name) && (!section || sectionOf(sh.student) === section))
    .sort((a, b) => (b.submitted_at ? 1 : 0) - (a.submitted_at ? 1 : 0) || a.student.name.localeCompare(b.student.name));
}

const namesOf = (sheet) => {
  const seen = new Set(); const out = [];
  sheet.rolls.forEach(r => r.names.forEach(n => { const k = lower(n); if (n && !seen.has(k)) { seen.add(k); out.push(n); } }));
  return out;
};

export function ThreeByFiveReview({ config, worksheetKey, roster }) {
  const { sheets, photos, error } = useRolls(config, worksheetKey);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  if (error) return <Shell><p className="t5r-p">Could not read the rolls: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="t5r-p">Loading the rolls.</p></Shell>;

  const rows = ordered(sheets, roster, section);
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const onARoll = new Set(); rows.forEach(sh => namesOf(sh).forEach(n => onARoll.add(lower(n))));
  const noRoll = people.filter(p => !onARoll.has(lower(p.name)));
  const onRoster = new Set(roster.filter(s => s.email).map(s => lower(s.email)));
  const others = sheets.filter(s => !onRoster.has(s.viewer_id));
  const handed = rows.filter(r => r.submitted_at).length;
  const href = (sh) => "/" + config.id + "/worksheets/" + worksheetKey + "?s=" + encodeURIComponent(idOf(sh.student));

  return (
    <Shell>
      <h1 className="t5r-title">3x5 rolls</h1>
      {sections.length > 1 ? (
        <div className="t5r-tabs" role="tablist">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"t5r-tab" + (s === section ? " t5r-on" : "")} onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}
      <p className="t5r-p">{handed} handed in, {rows.length - handed} started, {noRoll.length} on no roll.</p>
      {rows.map(sh => <Row key={sh.viewer_id} sheet={sh} photos={photos} href={href(sh)} />)}
      {noRoll.length ? <p className="t5r-p t5r-noroll">On no roll: {noRoll.map(p => p.name).join(", ")}.</p> : null}
      {others.length ? <h2 className="t5r-h2">Not on the roster</h2> : null}
      {others.map(sh => <Row key={sh.viewer_id} sheet={{ ...sh, student: { name: sh.viewer_id } }} photos={photos} href="" />)}
    </Shell>
  );
}

function Row({ sheet, photos, href }) {
  const names = namesOf(sheet);
  return (
    <article className="t5r-row">
      <div className="t5r-head">
        {href ? <a className="t5r-names" href={href}>{names.join(", ")}</a> : <span className="t5r-names">{names.join(", ")}</span>}
        <span className="t5r-when">{sheet.submitted_at ? "Handed in " + when(sheet.submitted_at) : "Started, not handed in"}</span>
      </div>
      {sheet.rolls.map((roll, i) => (
        <div className="t5r-mini" key={i}>
          {roll.cats.map((cat, c) => (
            <div className="t5r-ministrip" key={c}>
              <span className="t5r-miniword">{cat.trim() || "—"}</span>
              <span className="t5r-thumbs">
                {roll.frames[c].map((id, s) => { const p = id && photos.get(id); return p
                  ? <img key={s} src={BASE + p.thumb} alt={"Photo " + p.n} loading="lazy" />
                  : <span key={s} className="t5r-empty" />; })}
              </span>
            </div>
          ))}
        </div>
      ))}
    </article>
  );
}

// One student's rolls, big. The group's names lead, every name on the roll.
export function ThreeByFiveRoll({ config, worksheetKey, roster, student }) {
  const { sheets, photos, error } = useRolls(config, worksheetKey);
  if (error) return <Shell><p className="t5r-p">Could not read the roll: {error}</p></Shell>;
  if (!sheets) return <Shell><p className="t5r-p">Loading {student.name}'s roll.</p></Shell>;
  const sheet = sheets.find(s => s.viewer_id === lower(student.email));
  const index = "/" + config.id + "/worksheets/" + worksheetKey + "?review";
  if (!sheet) return <Shell><h1 className="t5r-title">{student.name}</h1><p className="t5r-p">No roll on this sheet yet.</p><a className="t5r-link" href={index}>All rolls</a></Shell>;
  const rows = ordered(sheets, roster, sectionOf(student));
  const at = rows.findIndex(r => r.viewer_id === sheet.viewer_id);
  const prev = at > 0 ? rows[at - 1] : null, next = at >= 0 && at < rows.length - 1 ? rows[at + 1] : null;
  const href = (sh) => "/" + config.id + "/worksheets/" + worksheetKey + "?s=" + encodeURIComponent(idOf(sh.student));
  const names = namesOf(sheet);
  return (
    <Shell wide>
      <header className="t5r-top">
        <h1 className="t5r-title">{names.join(", ")}</h1>
        <p className="t5r-p">{[sectionOf(student), sheet.submitted_at ? "Handed in " + when(sheet.submitted_at) : "Started, not handed in"].filter(Boolean).join(" · ")}</p>
      </header>
      {sheet.rolls.map((roll, i) => (
        <section className="t5r-roll" key={i}>
          {sheet.rolls.length > 1 ? <h2 className="t5r-h2">Roll {i + 1}</h2> : null}
          {roll.cats.map((cat, c) => (
            <div className="t5r-film" key={c}>
              <h3 className="t5r-word">{cat.trim() || (c === 0 ? "unnamed" : c === 1 ? "second strip, not started" : "third strip, not started")}</h3>
              <div className="t5r-frames">
                {roll.frames[c].map((id, s) => { const p = id && photos.get(id); return (
                  <figure className="t5r-frame" key={s}>
                    {p ? <img src={BASE + (p.large || p.thumb)} alt={"Photo " + p.n + ", taken " + String(p.taken).slice(0, 10)} loading={c === 0 ? "eager" : "lazy"} /> : <span className="t5r-blank">{s + 1}</span>}
                    {p ? <figcaption>{p.n}</figcaption> : null}
                  </figure>
                ); })}
              </div>
              {roll.more[c].some(t => t.trim()) ? (
                <div className="t5r-more">
                  <span className="t5r-k">Two more they'd shoot, and where they'd go</span>
                  {roll.more[c].map((t, m) => t.trim() ? <p className="t5r-line" key={m}>{t}</p> : null)}
                </div>
              ) : null}
            </div>
          ))}
        </section>
      ))}
      <nav className="t5r-nav">
        {prev ? <a className="t5r-link" href={href(prev)}>{"← " + namesOf(prev).join(", ")}</a> : <span />}
        <a className="t5r-link" href={index}>All rolls</a>
        {next ? <a className="t5r-link" href={href(next)}>{namesOf(next).join(", ") + " →"}</a> : <span />}
      </nav>
    </Shell>
  );
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE;
const FILM = "#161311", FILM_EDGE = "#2a2522", ON_FILM = "#d8d0c7", ON_FILM_DIM = "#a39a90", STAMP = "#b45309", FRAME = "#0b0a09", FRAME_EMPTY = "#221e1b";
const CSS = `
.t5r{padding:20px 16px 80px;color:${T.primary}}
.t5r-in{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.t5r-wide{max-width:1352px}
.t5r-title{margin:0;font-size:28px;font-weight:700;letter-spacing:-.02em}
.t5r-h2{margin:18px 0 0;font-size:19px;font-weight:700}
.t5r-p{margin:0;font-size:16px;color:${T.secondary}}
.t5r-noroll{margin-top:12px}
.t5r-tabs{display:flex;gap:8px}
.t5r-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer}
.t5r-on{background:${T.primary};border-color:${T.primary};color:${S.page}}
.t5r-row{border-top:1px solid ${L.soft};padding:16px 0 12px;display:flex;flex-direction:column;gap:10px}
.t5r-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.t5r-names{font-size:18px;font-weight:600;color:inherit;text-decoration:none}
a.t5r-names:hover{text-decoration:underline;text-underline-offset:3px}
.t5r-when{font-size:14px;color:${T.muted};margin-left:auto}
.t5r-mini{display:flex;gap:14px;flex-wrap:wrap}
.t5r-ministrip{display:flex;flex-direction:column;gap:4px}
.t5r-miniword{font-size:13px;color:${T.secondary};text-transform:lowercase}
.t5r-thumbs{display:inline-flex;gap:3px;padding:4px;border-radius:6px;background:${FILM}}
.t5r-thumbs img{width:52px;height:52px;object-fit:cover;border-radius:3px;display:block}
.t5r-empty{width:52px;height:52px;border-radius:3px;background:${FRAME_EMPTY};display:block}
.t5r-top{display:flex;flex-direction:column;gap:6px}
.t5r-roll{display:flex;flex-direction:column;gap:20px}
.t5r-film{background:${FILM};color:${ON_FILM};border:1px solid ${FILM_EDGE};border-radius:14px;padding:22px 20px 20px;position:relative;box-shadow:0 10px 30px -18px rgba(0,0,0,.6)}
.t5r-film::before,.t5r-film::after{content:"";position:absolute;left:20px;right:20px;height:8px;background:repeating-linear-gradient(90deg,transparent 0 7px,${S.page} 7px 15px,transparent 15px 22px);border-radius:2px;opacity:.9}
.t5r-film::before{top:6px}.t5r-film::after{bottom:6px}
.t5r-word{margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-.01em;text-transform:lowercase;line-height:1.1}
.t5r-frames{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.t5r-frame{margin:0;background:${FRAME};border-radius:8px;overflow:hidden;position:relative;aspect-ratio:4/3;display:grid;place-items:center}
.t5r-frame img{width:100%;height:100%;object-fit:cover;display:block}
.t5r-frame figcaption{position:absolute;left:8px;bottom:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8);font-variant-numeric:tabular-nums}
.t5r-blank{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;color:${ON_FILM_DIM};background:${FRAME_EMPTY};width:100%;height:100%;display:grid;place-items:center}
.t5r-more{margin-top:14px;display:flex;flex-direction:column;gap:6px}
.t5r-k{font-size:12.5px;font-weight:600;color:${ON_FILM_DIM};letter-spacing:.04em;text-transform:uppercase}
.t5r-line{margin:0;font-size:16px;line-height:1.5;white-space:pre-wrap;color:${ON_FILM}}
.t5r-nav{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:8px}
.t5r-link{font-size:15px;font-weight:600;color:${STAMP};text-decoration:underline;text-underline-offset:3px}
@media (max-width:640px){.t5r-frames{grid-template-columns:1fr}.t5r-word{font-size:24px}}
`;

function Shell({ children, wide }) {
  return <div className="t5r"><style>{CSS}</style><div className={"t5r-in" + (wide ? " t5r-wide" : "")}>{children}</div></div>;
}
