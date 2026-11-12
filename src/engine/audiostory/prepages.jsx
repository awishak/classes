// The instructor's pages for the audio story pre-production (pre.jsx).
//
// PreReview is /comm3/worksheets/audio-pre?review: every sheet, by student,
// as the document the student watched fill in, with who is in and who is
// not, asked again every half minute. PreControl is ?control: how the sheet
// works, from the code itself, the way every worksheet gets one (Andrew,
// 2026-10-29: "an instructor page that tells me exactly why everything's
// happening and exactly how everything is happening").

import { useCallback, useEffect, useMemo, useState } from "react";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { localWorksheet, openTo } from "../localWorksheets.js";
import { useClassState } from "../store.js";
import { Shell, useAllSheets, useClipUrls, useInstructorRead } from "./control.jsx";
import { Face, Chip } from "../portal/bits.jsx";
import { StudentLink } from "../StudentPage.jsx";
import { audioOf, FORMAT_SAY, MAX_BYTES } from "./audio.js";
import { MAX_STORY_SECONDS, clock } from "./storymodel.js";
import { linesOf } from "./bits.jsx";
import { sentencesOf, passageOf, paragraphsOf, sourcePieces, nameOfLink } from "./readtext.js";
import * as P from "./pre.jsx";
import * as R from "./research.jsx";
import * as I from "./ideas.jsx";

const lower = (s) => String(s || "").trim().toLowerCase();
const when = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Claude's read of each clip, beside the student's own page. Andrew,
// 2026-11-12: "analyze it, including analyzing their 5 min audio clips
// transcripts ... openings, thesis statements and closings that meet what i
// have" on the three boards (best openers, best thesis statements, closers),
// then "if they have an interview, if they have a good structure, if they are
// bringing in new information as opposed to saying only what they think," and
// "deploy a page for me to see, following our standard structure for review."
// The structure is the Culture Guide Review's (sitdown2/control.jsx): Claude's
// read above each student's work, everything running down the page, then a
// line naming whose work follows. The read is one file for the instructor
// alone (control.jsx useInstructorRead), written by
// scripts/comm3-audio-pre-read-push.mjs: { at, notes: [..], students: {
// [email]: { read, meets, opener, thesis, closer, interview, structure, news,
// gaps, transcript } }, links: { [url]: { site, title, host } } }. Students
// never see the file.
export const READ_SHEET = "audio-pre";
const VERDICT = { meets: "Meets the board", partly: "Partly", not: "Not yet" };
const MARKS = [["direct", "Direct"], ["eloquent", "Eloquent"], ["shift", "Shift"], ["tension", "Tension"], ["bigger", "Bigger picture"], ["money", "Money"]];

// Andrew, 2026-11-12, on the first version: "make this page prettier. put
// their quotes in quotes," "give me more of the openers. you are giving me
// too little info for the opener, thesis, and closer," "can you tell me what
// their sources are besides the urls?", "let me pop open a transcript of each
// one. make it look nice," and "any time you want to give me numbers as a
// summary of class, give me bar charts or a table. not the individual boxes
// with a number." So each part shows the quoted line inside the words around
// the line, in quotation marks (readtext.js passageOf); the sources are named
// by site and headline (read.links, from scripts/comm3-audio-pre-links.mjs);
// the transcript opens as a page over the review; and the class counts are
// bars.
const curl = (s) => String(s || "").replace(/"([^"]+)"/g, "“$1”");

function ReadPart({ label, part, id, sents, marks = false }) {
  const p = part || {};
  const v = p.verdict in VERDICT ? p.verdict : "not";
  const more = p.quote ? passageOf(sents, p.quote, id) : null;
  return (
    <section className={"apr-row apr-" + v}>
      <div className="apr-side">
        <h3 className="apr-pl">{label}</h3>
        {p.kind ? <span className="apr-kind">{p.kind}</span> : null}
        <span className="apr-v">{VERDICT[v]}</span>
        {p.at ? <span className="apr-at">{p.at}</span> : null}
      </div>
      <div className="apr-main">
        {p.quote ? (
          <blockquote className="apr-quote">
            {more
              ? <>“{more.cutStart ? "… " : ""}{more.before ? more.before + " " : ""}<mark className="apr-hl">{more.mark}</mark>{more.after ? " " + more.after : ""}{more.cutEnd ? " …" : ""}”</>
              : <>“<mark className="apr-hl">{p.quote}</mark>”</>}
          </blockquote>
        ) : null}
        {p.say ? <p className="apr-say">{curl(p.say)}</p> : null}
        {marks ? <div className="apr-marks">{MARKS.map(([m, say]) => <span key={m} className={"apr-mark" + ((p.marks || []).includes(m) ? " on" : "")}>{say}</span>)}</div> : null}
      </div>
    </section>
  );
}

// The student's sources, named: an address shows its site and its headline.
function Sources({ text, links }) {
  const lines = linesOf(text);
  if (!lines.length) return null;
  return (
    <ul className="apr-src">
      {lines.map((line, i) => (
        <li key={i}>
          {sourcePieces(line).map((piece, j) => {
            if (!piece.url) return <span key={j}>{piece.text}</span>;
            const n = nameOfLink(piece.url, links);
            return <a key={j} className="apr-link" href={piece.url} target="_blank" rel="noreferrer"><b>{n.site}</b>{n.title ? <span>{"“" + n.title + "”"}</span> : null}</a>;
          })}
        </li>
      ))}
    </ul>
  );
}

// How much of the script reads in ChatGPT's style, and the colour each level takes.
const AI_SAY = { strong: "Strong", some: "Some", little: "Little" };
const AI_TONE = { strong: "not", some: "partly", little: "meets" };

const PART_SAY = { opener: "Opener", thesis: "Thesis", closer: "Closer" };

// The transcript as a page over the review, the three quoted lines marked.
export function Transcript({ read, sents, title, name, url, onClose }) {
  useEffect(() => {
    const key = (e) => { if (e.key === "Escape") onClose(); };
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = was; };
  }, [onClose]);
  const paras = paragraphsOf(sents, ["opener", "thesis", "closer"].map(k => [k, read[k]?.quote]));
  const verdict = (k) => (read[k]?.verdict in VERDICT ? read[k].verdict : "not");
  return (
    <div className="apr-pop" role="dialog" aria-modal="true" aria-label={"Transcript, " + (name || "")} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <article className="apr-page">
        <div className="apr-page-top">
          {url ? <audio className="apr-page-audio" controls preload="metadata" src={url} /> : <span />}
          <button type="button" className="apr-close pt-focus" onClick={onClose}>Close</button>
        </div>
        <header className="apr-page-head">
          <span className="apr-page-kicker">{"Transcript" + (read.seconds ? " · " + clock(read.seconds) : "")}</span>
          {title ? <h2 className="apr-page-h">{title}</h2> : null}
          {name ? <p className="apr-page-by">{name}</p> : null}
        </header>
        <div className="apr-page-body">
          {paras.map((p, i) => (
            <p key={i} className="apr-para">
              {p.at ? <span className="apr-para-at">{p.at}</span> : null}
              {p.runs.map((r, j) => (r.part
                ? <span key={j}><span className={"apr-tag apr-" + verdict(r.part)}>{PART_SAY[r.part]}{read[r.part]?.at ? " " + read[r.part].at : ""}</span><mark className={"apr-hl apr-" + verdict(r.part)}>{r.text}</mark>{" "}</span>
                : <span key={j}>{r.text + " "}</span>))}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}

export function ReadPanel({ read, sheet, at, links, title = "", name = "", url = "" }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const sents = useMemo(() => sentencesOf(read.transcript), [read.transcript]);
  const fact = (label, x) => (x && x.say ? <div className="apr-row apr-fact"><h3 className="apr-pl">{label}</h3><p className="apr-say">{curl(x.say)}</p></div> : null);
  // A read written before the student handed in again says so.
  const again = !!(sheet?.submitted_at && at && new Date(sheet.submitted_at).getTime() > new Date(at).getTime());
  const sources = String(sheet?.answers?.sources || "").trim();
  return (
    <div className="apr-read">
      <div className="apr-rh"><h2 className="apr-rt">Claude's read</h2><span className="apr-n">{read.meets} of 3 meet the board</span></div>
      {again ? <p className="apr-lede"><b>{"Handed in again " + when(sheet.submitted_at) + ", after this read was written."}</b></p> : null}
      {read.read ? <p className="apr-lede">{curl(read.read)}</p> : null}
      <ReadPart label="Opener" id="opener" part={read.opener} sents={sents} />
      <ReadPart label="Thesis" id="thesis" part={read.thesis} sents={sents} marks />
      <ReadPart label="Closer" id="closer" part={read.closer} sents={sents} />
      {fact("Interview", read.interview)}
      {fact("Structure", read.structure)}
      {fact("New information", read.news)}
      {fact("Music and field audio", read.gaps)}
      {read.ai ? (
        <div className={"apr-row apr-fact apr-" + (AI_TONE[read.ai.level] || "partly")}>
          <div className="apr-side"><h3 className="apr-pl">ChatGPT writing style</h3><span className="apr-v">{AI_SAY[read.ai.level] || read.ai.level}</span></div>
          <div className="apr-main">
            {read.ai.say ? <p className="apr-say">{read.ai.say}</p> : null}
            {(read.ai.quotes || []).length ? <ul className="apr-said">{read.ai.quotes.map((q, i) => <li key={i}>{"“" + q + "”"}</li>)}</ul> : null}
          </div>
        </div>
      ) : null}
      {sources ? <div className="apr-row apr-fact"><h3 className="apr-pl">Sources</h3><Sources text={sources} links={links} /></div> : null}
      {sents.length ? <div className="apr-row apr-open"><button type="button" className="apr-btn pt-focus" onClick={() => setOpen(true)}>The transcript</button></div> : null}
      {open ? <Transcript read={read} sents={sents} title={title} name={name} url={url} onClose={close} /> : null}
    </div>
  );
}

// The count of each kind across the cards on screen, most common first.
const tally = (list) => {
  const n = {};
  list.forEach(k => { if (k) n[k] = (n[k] || 0) + 1; });
  return Object.entries(n).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

// Class counts as bars, one row a count. rows is [[label, n, tone], ..].
function Bars({ label, rows, of }) {
  const top = of || Math.max(1, ...rows.map(r => r[1]));
  return (
    <table className="apr-bars">
      {label ? <caption>{label}</caption> : null}
      <tbody>
        {rows.map(([say, n, tone]) => (
          <tr key={say}>
            <th scope="row">{say}</th>
            <td className="apr-bar-n">{n}</td>
            <td className="apr-bar-cell"><span className={"apr-bar" + (tone ? " apr-" + tone : "")} style={{ width: (n / top) * 100 + "%" }} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Opener, thesis and closer as a table: how many meet, partly meet, and do not yet.
function VerdictTable({ reads }) {
  const n = (k, v) => reads.filter(r => (r[k]?.verdict in VERDICT ? r[k].verdict : "not") === v).length;
  return (
    <table className="apr-bars apr-vt">
      <thead><tr><th /><th scope="col">{VERDICT.meets}</th><th scope="col">{VERDICT.partly}</th><th scope="col">{VERDICT.not}</th><th /></tr></thead>
      <tbody>
        {[["opener", "Opener"], ["thesis", "Thesis"], ["closer", "Closer"]].map(([k, say]) => (
          <tr key={k}>
            <th scope="row">{say}</th>
            <td className="apr-bar-n">{n(k, "meets")}</td><td className="apr-bar-n">{n(k, "partly")}</td><td className="apr-bar-n">{n(k, "not")}</td>
            <td className="apr-bar-cell"><span className="apr-stack">{["meets", "partly", "not"].map(v => (n(k, v) ? <span key={v} className={"apr-bar apr-" + v} style={{ flexGrow: n(k, v) }} /> : null))}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ReadSummary({ reads, notes }) {
  if (!reads.length) return null;
  const talk = reads.filter(r => r.interview?.has).length;
  return (
    <section className="apr-sum" aria-label="Claude's read of the class">
      <h2 className="apr-rt">Claude's read, {reads.length} clips in this section</h2>
      <VerdictTable reads={reads} />
      <div className="apr-pair">
        <Bars label="Openers by kind" rows={tally(reads.map(r => r.opener?.kind))} />
        <Bars label="Closers by kind" rows={tally(reads.map(r => r.closer?.kind))} />
      </div>
      <Bars label="Interview" rows={[["Have an interview", talk, "meets"], ["No interview yet", reads.length - talk, "not"]]} of={reads.length} />
      {reads.some(r => r.ai) ? <Bars label="ChatGPT writing style" rows={["strong", "some", "little"].map(l => [AI_SAY[l], reads.filter(r => r.ai?.level === l).length, AI_TONE[l]])} of={reads.length} /> : null}
      {(notes || []).map((n, i) => <p key={i} className="apr-lede">{curl(n)}</p>)}
    </section>
  );
}

export function PreReview({ config, worksheetKey, roster }) {
  const [sheets, error] = useAllSheets(config, worksheetKey);
  const read = useInstructorRead(config, READ_SHEET);
  const [order, setOrder] = useState("read");
  const [data] = useClassState(config.storageKey);
  const urls = useClipUrls(config, worksheetKey, sheets);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  if (error) return <Shell config={config}><p className="pt-sub">Could not read the sheets: {error}</p></Shell>;
  if (!sheets) return <Shell config={config}><p className="pt-sub">Loading the sheets.</p></Shell>;
  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const rows = people.map(p => ({ student: p, sheet: byEmail.get(lower(p.email)) || null }));
  const submitted = rows.filter(r => r.sheet?.submitted_at).length;
  const started = rows.filter(r => r.sheet && !r.sheet.submitted_at).length;
  const notIn = rows.filter(r => !r.sheet?.submitted_at).map(r => r.student.name);
  const readOf = (r) => read?.students?.[lower(r.student.email)] || null;
  const byRead = !!read && order === "read";
  // Submitted first. Then by the read, most parts meeting the board first,
  // when there is one and it is asked for; else the newest hand-in first.
  const cards = rows.filter(r => r.sheet).sort((x, y) => (y.sheet.submitted_at ? 1 : 0) - (x.sheet.submitted_at ? 1 : 0)
    || (byRead ? (readOf(y)?.score ?? -1) - (readOf(x)?.score ?? -1) : 0)
    || (byRead ? 0 : String(y.sheet.submitted_at || "").localeCompare(String(x.sheet.submitted_at || ""))) || x.student.name.localeCompare(y.student.name));
  const reads = rows.map(readOf).filter(Boolean);
  return (
    <Shell config={config}>
      <style>{REVIEW_CSS}</style>
      <header className="aic-top">
        <div className="aic-titles">
          <h1 className="pt-h1">{P.DEFAULT_COPY.title}</h1>
          <p className="pt-sub">{P.DEFAULT_COPY.credit} This page asks again every half minute.</p>
        </div>
        {sections.length > 1 ? (
          <div className="pt-seg" role="tablist" aria-label="Section">
            {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"pt-focus" + (s === section ? " on" : "")} onClick={() => setSection(s)}>{s}</button>)}
          </div>
        ) : null}
      </header>
      <div className="apr-in" aria-label="Running summary">
        <Bars rows={[["Submitted", submitted, "meets"], ["Started", started, "partly"], ["Not opened", rows.length - submitted - started, "none"]]} of={rows.length} />
      </div>
      {notIn.length ? (
        <details className="aic-fold">
          <summary className="pt-focus">Not submitted yet, {notIn.length}</summary>
          <div className="aic-names">{notIn.map(n => <span key={n} className="pt-gpill off">{n}</span>)}</div>
        </details>
      ) : <p className="pt-quiet">Everyone is in.</p>}
      {read ? <ReadSummary reads={reads} notes={read.notes} /> : null}
      {read ? (
        <div className="pt-chips" role="tablist" aria-label="Order">
          <Chip on={order === "read"} onClick={() => setOrder("read")}>Strongest first</Chip>
          <Chip on={order === "new"} onClick={() => setOrder("new")}>Newest first</Chip>
        </div>
      ) : null}
      <div className="pt-stack aic-cards">
        {cards.map(({ student, sheet }) => {
          const mine = readOf({ student });
          const a = sheet.answers || {};
          const clip = audioOf(a.audio);
          const left = P.missingOf(a).length;
          const url = clip ? urls[clip.path] || "" : "";
          return (
            <article key={student.email} className={"pt-row aic-card" + (sheet.submitted_at ? "" : " due")}>
              <div className="aic-head">
                <div className="aic-who">
                  <Face config={config} data={data} name={student.name} size={40} />
                  <div className="pt-main">
                    <p className="pt-title"><StudentLink config={config} student={student} /></p>
                    <p className={"pt-when " + (sheet.submitted_at ? "done" : "due")}><span>{sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) : "Started, not submitted"}</span></p>
                    <p className="pt-meta">{left ? left + (left === 1 ? " part empty" : " parts empty") : "Every part filled"}</p>
                  </div>
                </div>
              </div>
              {mine ? <ReadPanel read={mine} sheet={sheet} at={read.at} links={read.links} title={String(a.story || "").trim()} name={student.name} url={url} /> : null}
              {mine ? <p className="apr-work">{student.name.split(" ")[0] + "'s pre-production, as written"}</p> : null}
              <div className="apr-doc"><style>{P.PRE_CSS}</style><P.PreView answers={a} url={url} /></div>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}

const REVIEW_CSS = `
.apr-doc{margin-top:12px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
.apr-doc .aspd{padding:26px 28px 30px}
.apr-in{margin:16px 0 4px;max-width:560px}
.apr-sum{display:flex;flex-direction:column;gap:18px;margin:20px 0;padding:22px 24px 24px;border-radius:16px;background:var(--surface-card);box-shadow:0 0 0 1px var(--line-soft)}
.apr-pair{display:grid;grid-template-columns:1fr 1fr;gap:18px 40px}
.apr-bars{width:100%;border-collapse:collapse;font-size:16px;line-height:1.3}
.apr-bars caption{text-align:left;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-secondary);padding-bottom:6px}
.apr-bars th{font-weight:500;text-align:left;white-space:nowrap;padding:6px 16px 6px 0;width:1%}
.apr-bars thead th{font-size:14px;font-weight:600;color:var(--text-secondary);padding:0 14px 4px 0;text-align:right}
.apr-bars td{padding:6px 0}
.apr-bars tbody tr+tr th,.apr-bars tbody tr+tr td{border-top:1px solid var(--line-soft)}
.apr-bar-n{width:1%;white-space:nowrap;text-align:right;padding-right:14px!important;font-weight:700;font-variant-numeric:tabular-nums}
.apr-bar-cell{width:100%}
.apr-bar{display:block;height:14px;min-width:3px;border-radius:4px;background:var(--text-primary)}
.apr-bar.apr-meets{background:var(--pt-done-ink)}
.apr-bar.apr-partly{background:var(--pt-due-ink)}
.apr-bar.apr-not{background:var(--pt-late-ink)}
.apr-bar.apr-none{background:var(--text-muted)}
.apr-stack{display:flex;gap:2px;width:100%}
.apr-stack .apr-bar{flex-basis:0;min-width:3px}
.apr-read{display:flex;flex-direction:column;padding-top:4px}
.apr-rh{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;padding-top:16px;border-top:1px solid var(--line-strong)}
.apr-rt{margin:0;font-family:var(--pt-serif);font-size:24px;font-weight:600;line-height:1.2}
.apr-n{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums}
.apr-lede{margin:10px 0 0;font-size:18px;line-height:1.55;max-width:860px}
.apr-lede b{font-weight:700}
.apr-read .apr-lede:last-of-type{margin-bottom:18px}
.apr-row{display:grid;grid-template-columns:168px minmax(0,1fr);gap:8px 28px;padding:20px 0;border-top:1px solid var(--line-soft)}
.apr-side{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.apr-main{display:flex;flex-direction:column;gap:12px;min-width:0}
.apr-pl{margin:0;font-size:17px;font-weight:700;line-height:1.35}
.apr-kind{font-size:15px;color:var(--text-secondary)}
.apr-v{font-size:14px;font-weight:700;padding:2px 10px;border-radius:999px;background:var(--pt-late);color:var(--pt-late-ink)}
.apr-meets .apr-v{background:var(--pt-done);color:var(--pt-done-ink)}
.apr-partly .apr-v{background:var(--pt-due);color:var(--pt-due-ink)}
.apr-at{font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--text-secondary)}
.apr-quote{margin:0;padding-left:18px;border-left:3px solid var(--pt-late-ink);font-family:var(--pt-serif);font-size:19px;line-height:1.6;color:var(--text-primary);overflow-wrap:anywhere;max-width:780px}
.apr-meets .apr-quote{border-left-color:var(--pt-done-ink)}
.apr-partly .apr-quote{border-left-color:var(--pt-due-ink)}
.apr-hl{color:inherit;font-weight:600;background:var(--pt-late);padding:2px 3px;border-radius:4px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.apr-meets .apr-hl,.apr-hl.apr-meets{background:var(--pt-done)}
.apr-partly .apr-hl,.apr-hl.apr-partly{background:var(--pt-due)}
.apr-say{margin:0;font-size:17px;line-height:1.55;color:var(--text-primary);max-width:780px}
.apr-marks{display:flex;flex-wrap:wrap;gap:6px}
.apr-mark{font-size:14px;font-weight:600;padding:2px 10px;border-radius:999px;box-shadow:0 0 0 1px var(--line-strong);color:var(--text-secondary)}
.apr-mark.on{background:var(--text-primary);color:var(--surface-page);box-shadow:none}
.apr-fact{padding:14px 0}
.apr-said{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;font-family:var(--pt-serif);font-size:18px;line-height:1.5;max-width:780px;overflow-wrap:anywhere}
.apr-said li{padding-left:16px;border-left:3px solid var(--line-strong)}
.apr-src{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;font-size:17px;line-height:1.5;max-width:780px;overflow-wrap:anywhere}
.apr-link{color:var(--text-primary);text-decoration:none}
.apr-link b{font-weight:700;margin-right:8px}
.apr-link span{text-decoration:underline;text-decoration-color:var(--line-strong);text-underline-offset:3px}
.apr-link:hover span{text-decoration-color:var(--text-primary)}
.apr-open{padding:16px 0 4px;grid-template-columns:1fr}
.aic .apr-btn{justify-self:start;font:inherit;font-size:16px;font-weight:600;min-height:44px;padding:0 20px;border-radius:999px;border:0;cursor:pointer;background:var(--text-primary);color:var(--surface-page)}
.apr-work{margin:4px 0 0;padding-top:16px;border-top:1px solid var(--line-strong);font-size:16px;font-weight:600}
.apr-pop{position:fixed;inset:0;z-index:80;overflow:auto;padding:48px 16px 64px;background:rgba(0,0,0,.55)}
.apr-page{max-width:760px;margin:0 auto;border-radius:18px;background:var(--surface-card);color:var(--text-primary);box-shadow:0 24px 80px -20px rgba(0,0,0,.6)}
.apr-page-top{position:sticky;top:-48px;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-radius:18px 18px 0 0;background:var(--surface-card);box-shadow:0 1px 0 var(--line-soft)}
.apr-page-audio{flex:1 1 auto;min-width:0;height:40px}
.aic .apr-close{flex:none;font:inherit;font-size:15px;font-weight:600;min-height:40px;padding:0 18px;border-radius:999px;border:0;cursor:pointer;background:var(--surface-sunk);color:var(--text-primary)}
.apr-page-head{display:flex;flex-direction:column;gap:10px;padding:34px 56px 0}
.apr-page-kicker{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-secondary)}
.apr-page-h{margin:0;font-family:var(--pt-serif);font-size:32px;font-weight:600;line-height:1.15;overflow-wrap:anywhere}
.apr-page-by{margin:0;font-size:16px;color:var(--text-secondary)}
.apr-page-body{display:flex;flex-direction:column;gap:20px;padding:28px 56px 56px;font-family:var(--pt-serif);font-size:19px;line-height:1.7}
.apr-para{margin:0;overflow-wrap:anywhere}
.apr-para-at{display:block;font-family:var(--font,inherit);font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text-secondary);margin-bottom:2px}
.apr-tag{font-family:var(--font,inherit);font-size:12.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;margin-right:8px;padding:2px 8px;border-radius:999px;vertical-align:2px;background:var(--pt-late);color:var(--pt-late-ink)}
.apr-tag.apr-meets{background:var(--pt-done);color:var(--pt-done-ink)}
.apr-tag.apr-partly{background:var(--pt-due);color:var(--pt-due-ink)}
@media (max-width:760px){
  .apr-row{grid-template-columns:1fr}
  .apr-side{flex-direction:row;flex-wrap:wrap;align-items:center;gap:8px}
  .apr-pair{grid-template-columns:1fr}
  .apr-page-head{padding:26px 22px 0}
  .apr-page-body{padding:22px 22px 40px;font-size:18px}
}
`;

export function PreControl({ config, worksheetKey, roster }) {
  const [data] = useClassState(config.storageKey);
  const [sheets] = useAllSheets(config, worksheetKey);
  const local = localWorksheet(worksheetKey);
  const base = "/" + config.id + "/worksheets/" + worksheetKey;
  const asg = (data?.assignments || config.assignments || []).find(a => a.id === "audio-pre") || null;
  const n = sheets ? sheets.length : null;
  return (
    <Shell>
      <h1 className="aic-title">{P.DEFAULT_COPY.title + ", how the sheet works"}</h1>
      <p className="aic-p"><a className="aic-a" href={base}>The sheet</a> · <a className="aic-a" href={base + "?review"}>Review</a> · <a className="aic-a" href={"/" + config.id + "/worksheets/" + R.AUDIO_RESEARCH_KEY + "?control"}>Audio exercise control</a> · <a className="aic-a" href={"/" + config.id + "/worksheets/" + I.AUDIO_IDEAS_KEY + "?control"}>Ideas control</a></p>

      <h2 className="aic-h2">Open</h2>
      <p className="aic-p">{local ? (openTo(local, config.id, data) ? "Open to " + config.code + " students now." : "Not open to " + config.code + " students.") : "Not registered."} The registry says {JSON.stringify(local?.open)}; the class's worksheetsOpen switch, when set, wins: {JSON.stringify(data?.worksheetsOpen?.[worksheetKey] ?? null)}. Andrew, 2026-11-06: "let's open this to comm 3 the moment it's built."</p>

      <h2 className="aic-h2">The challenge</h2>
      <p className="aic-p">The plan row's challenge <code>audio-pre</code>{asg ? <>, {asg.title}, due {asg.due} {asg.dueTime}, scale {asg.scale || "letters"}, weight {asg.weight}</> : ", not on the plan row"}. Its instructionsUrl {asg?.instructionsUrl ? <>is <code>{asg.instructionsUrl}</code></> : "is empty"}; that address is what ties the sheet to the challenge: the assignment page shows the student their sheet read back, the Grade view lays every hand-in over the challenge, and the door on the student home runs until the due date. The database locks the sheet after the due date only once a worksheet_deadlines row for <code>{worksheetKey}</code> and <code>{config.id}</code> is there (sql/audio-story.sql is the pattern); without it nothing locks.</p>

      <h2 className="aic-h2">Where the words come from</h2>
      <p className="aic-p">Every line a student reads is in <code>pre.jsx</code> DEFAULT_COPY, in his words of 2026-11-06, and editable in place on the sheet by the instructor (Edit the words); edits live on the row <code>{P.COPY_ROW}</code>. The seven questions are <code>q.&lt;id&gt;</code> there, {P.QUESTIONS.map(q => q[0]).join(", ")}. The going-forward checklist that used to close the sheet was removed 2026-11-09 at his word.</p>

      <h2 className="aic-h2">Pre-filled, once</h2>
      <p className="aic-p">The first time a student opens the sheet, after their answers and their audio exercise sheet have both loaded, four things come across from the exercise into this sheet's own fields when the field here is blank: <code>story</code>, <code>treatment</code>, <code>includes</code>, and <code>sources</code> (the exercise's article, media, person and place lines, in that order). Then <code>prefilled</code> is set to 1 and the copy never runs again, so nothing a student typed is ever overwritten. A student with no exercise sheet starts blank. The exercise is read under the rules (worksheet_owns), the way the exercise reads the ideas sheet.</p>

      <h2 className="aic-h2">Shown, not copied</h2>
      <p className="aic-p">The three ideas with his marks are read live off the ideas sheet and its review row (research.jsx markedIdeas), the chosen one marked from the exercise's <code>picked</code>; the pair line reads the row <code>audio-pairs-plan</code>. The sources the student already has are shown from the exercise sheet above the editable list. None of that is stored here.</p>

      <h2 className="aic-h2">Fields</h2>
      <p className="aic-p">One worksheet row a field, saved as typed: {P.FIELDS.map(f => <code key={f}>{f} </code>)}. <code>asked</code> holds the chosen question ids, one a line, at most {P.PICK}; each answer is <code>q:&lt;id&gt;</code>. <code>audio</code> is JSON with the path, the seconds and the file's name. Submit wants: story, treatment, includes, {P.PICK} questions chosen and each answered, the clip, at least one source, and the reflection. The sheet counts {P.PARTS_TO_FILL} parts.</p>

      <h2 className="aic-h2">The clip</h2>
      <p className="aic-p">One file, {FORMAT_SAY}, up to {Math.round(MAX_STORY_SECONDS / 60)} minutes (a file that reads as {MAX_STORY_SECONDS}.9 seconds passes, for rounding) and under {Math.round(MAX_BYTES / 1024 / 1024)} MB, the audio story's limits. The browser reads the length off the file first. The file goes into the private visual-story bucket at {config.id}/(email)/audio-(id).(ext) as the student, the same place and rules as the exercise and the story; no new bucket rule was needed. The student plays it back through a signed link an hour long made with their own token; the review signs links through the server.</p>

      <h2 className="aic-h2">The document on the right</h2>
      <p className="aic-p">The right side of the sheet is the pre-production as a page, drawn from the same answers as they type (pre.jsx PreView). The review shows each student's sheet as that same page, and so does the instructor's read at ?s=. A part that is empty is not drawn.</p>

      <h2 className="aic-h2">Claude's read on the review</h2>
      <p className="aic-p">The review shows Claude's read above each student's page when the file <code>comm3-audio-pre-read.json</code> is in the private instructor bucket; the file comes through <code>/api/sitdown-sheet?sheet=audio-pre</code> to an instructor only. Each of the opener, the thesis and the closer shows the quoted line inside the words said around the line, cut from the transcript by sentence (readtext.js passageOf), in quotation marks, with the quoted line marked. The transcript button opens the whole transcript as a page over the review, with the clip's player and the three lines marked. Sources are the student's own list from this sheet; an address is shown as its site and headline, looked up by <code>scripts/comm3-audio-pre-links.mjs</code> and kept in the read file under <code>links</code>, and an address that did not answer shows its site and the words in the address. The class counts are bars and a table, at his word of 2026-11-12. The ChatGPT writing style line is Claude's read of each transcript's sentences (strong, some or little), with the lines that show the style quoted from the transcript; <code>scripts/comm3-audio-pre-ai.mjs</code> checks each quoted line is in the transcript and puts the read in the file as <code>ai</code>. The line is a read of style and not proof of who wrote a script.</p>

      <h2 className="aic-h2">Now</h2>
      <p className="aic-p">{n === null ? "Reading the sheets." : n + (n === 1 ? " sheet" : " sheets") + " started, " + (sheets.filter(s => s.submitted_at).length) + " submitted, of " + roster.filter(s => s.email && !isLurker(s.name)).length + " on the roster."}</p>
    </Shell>
  );
}
