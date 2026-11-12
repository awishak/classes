// The instructor's two pages for the Culture Guide.
//
// CultureReview is /<class>/worksheets/culture-guide?review: every student's
// guide, in the order he will meet them, each under its two questions, so
// the page is his prep. Asked again every half minute.
//
// CultureControl is ?control: how the whole thing works, stated from the
// code, then one row a student with where they stand. Andrew, 2026-10-29:
// "a control page, an instructor page that tells me exactly why everything's
// happening and exactly how everything is happening." Nothing is written here.

import { useEffect, useState } from "react";
import { useClassState } from "../store.js";
import { sectionOf } from "../sections.js";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { StudentLink } from "../StudentPage.jsx";
import { nameShown } from "../roster.js";
import { CSS as SD_CSS, FONTS } from "../SitdownPage.jsx";
import { TEAM_TOPICS_KEY } from "../teamtopics/sheet.jsx";
import * as E from "../takeover/engine.js";
import { CULTURE_GUIDE_KEY, CSS as GUIDE_CSS, F, BOXES, Printout, CultureGuide, chosenOf, filledOf, missingOf, nameOf } from "./guide.jsx";
import { readStore } from "../worktopia/store.js";
import { realStudents } from "../sections.js";
import { SITDOWN2, SLOTS, slotFor, whenOf, assignedFor, sitdown2Href, assignHref, guideHref, bookings } from "./facts.js";

const lower = (s) => String(s || "").trim().toLowerCase();
const when = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const call = async (body) => {
  const r = await fetch("/api/worksheet-submits", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), ...body }) });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};
const byEmail = (sheets) => new Map((sheets || []).map(s => [lower(s.viewer_id), s]));

// Every student with their three files, in meeting order: a slot first, soonest first, then the rest by name.
function useRows(config, roster, keys) {
  const [data] = useClassState(config.storageKey);
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const ask = () => Promise.all(keys.map(key => call({ groupKey: config.id, key, all: true }).then(o => byEmail(o.sheets))))
      .then(got => { if (alive) setSheets(Object.fromEntries(keys.map((k, i) => [k, got[i]]))); })
      .catch(e => { if (alive) setError(e.message); });
    ask();
    const t = setInterval(ask, 30000);
    return () => { alive = false; clearInterval(t); };
  }, [config.id, keys.join(",")]);   // eslint-disable-line react-hooks/exhaustive-deps
  const people = realStudents(config, roster).filter(s => s.email);
  const rows = people.map(s => {
    const em = lower(s.email);
    const g = sheets?.[CULTURE_GUIDE_KEY]?.get(em) || null;
    return { student: s, email: em, slot: slotFor(data, s.name), assigned: assignedFor(data, em), guide: g, answers: g?.answers || {},
      topics: sheets?.[TEAM_TOPICS_KEY]?.get(em)?.answers || {}, locker: sheets?.[E.TAKEOVER_KEY]?.get(em)?.answers || {} };
  }).sort((a, b) => (a.slot ? a.slot.ms : Infinity) - (b.slot ? b.slot.ms : Infinity) || a.student.name.localeCompare(b.student.name));
  return { data, rows, sheets, error, classmates: people.map(p => p.name) };
}

function Shell({ config, title, intro, children, here }) {
  return (
    <div className="sd-root">
      {FONTS}
      <style>{SD_CSS + GUIDE_CSS + CSS}</style>
      <div className="sd sheet-page">
        <header className="top">
          <div className="eyebrow"><a className="crumb" href={sitdown2Href(config)}>{config.code + " · Sit-Down 2"}</a></div>
          <h1 className="h1">{title}</h1>
          {intro ? <p className="intro">{intro}</p> : null}
          <div className="bar">
            {here !== "review" ? <a className="btn" href={guideHref(config) + "?review"}>Every guide</a> : null}
            {here !== "control" ? <a className="btn" href={guideHref(config) + "?control"}>How it works</a> : null}
            <a className="lnk" href={assignHref(config)}>Assign the two concepts</a>
            <a className="lnk" href={sitdown2Href(config)}>The slots</a>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

export function CultureReview({ config, worksheetKey, roster }) {
  const { data, rows, sheets, error } = useRows(config, roster, [CULTURE_GUIDE_KEY]);
  const handed = rows.filter(r => r.guide?.submitted_at).length;
  return (
    <Shell config={config} title="Every Culture Guide" here="review" intro={error ? "Could not read the sheets: " + error : !sheets ? "Reading the sheets." : handed + " handed in, " + (rows.filter(r => r.guide && !r.guide.submitted_at).length) + " started, " + rows.filter(r => !r.guide).length + " not opened. In the order of the meetings; a student with no time yet is at the end. This page asks again every half minute."}>
      {rows.map(r => {
        const left = r.guide ? missingOf(r.answers, r.assigned.ids) : [];
        const q = [1, 2].map(i => String(r.answers[F.q(i)] || "").trim()).filter(Boolean);
        return (
          <details key={r.email} className="sec one" open={false}>
            <summary className="sh">
              <span className="h3"><StudentLink config={config} student={r.student} /></span>
              <span className="meta">{r.slot ? whenOf(r.slot) : "No time yet"}</span>
              <span className={"ds" + (r.guide?.submitted_at ? " ok" : "")}>{!r.guide ? "Not opened" : r.guide.submitted_at ? "Handed in " + when(r.guide.submitted_at) : "Started, " + left.length + " missing"}</span>
            </summary>
            {r.guide ? (
              <>
                {q.length ? <div className="asks"><div className="h5">Asks you to ask</div><ol className="askl">{q.map((x, i) => <li key={i} className="q">{x}</li>)}</ol></div> : null}
                {r.assigned.ids.length ? <p className="p">{"Required: " + r.assigned.ids.map(nameOf).join(" and ") + "."}</p> : <p className="p">No concepts assigned yet.</p>}
                <div className="cg ro"><Printout answers={r.answers} name={nameShown(data, r.student.name)} assigned={r.assigned.ids} /></div>
                <a className="lnk" href={guideHref(config) + "?s=" + encodeURIComponent(r.email)}>Open the file</a>
              </>
            ) : null}
          </details>
        );
      })}
    </Shell>
  );
}

export function CultureControl({ config, worksheetKey, roster }) {
  const { data, rows, sheets, error } = useRows(config, roster, [CULTURE_GUIDE_KEY]);
  const placed = Object.keys(bookings(data)).length;
  return (
    <Shell config={config} title="How the Culture Guide works" here="control" intro={error ? "Could not read the sheets: " + error : !sheets ? "Reading the sheets." : placed + " of " + rows.length + " have a time. " + rows.filter(r => r.assigned.ids.length === 2).length + " have their two concepts. " + rows.filter(r => r.guide?.submitted_at).length + " have handed in."}>
      <section className="sec prose">
        <h2 className="h2">The slots</h2>
        <p className="p">{SLOTS.length + " ten-minute slots in four blocks, all in " + SITDOWN2.room + ": " + "Thursday, November 12, 9:10 to 11:10 AM and 2:30 to 3:30 PM; Friday, November 13, 9:15 to 10:15 AM and 11:45 AM to 2:00 PM. A student taps an open slot on the Sit-Down 2 page and it is theirs. They can move it until " + SITDOWN2.lockText + "; you can move anyone at any time from the same page. A booking lives on the class row as sitdown2Slots, one entry a slot with the name and the time it was taken. A tap re-reads the row from the server before it writes, lays on that one change, and writes the result, so two students tapping the same minute cannot overwrite each other: whoever the server already shows keeps the slot and the other is told to pick again. One name can hold only one slot."}</p>
        <h2 className="h2">The day of</h2>
        <p className="p">{"On the morning of the meeting a card comes up in front of the site for that student, once per device, with the time, the room and a button to the guide. It reads the slot off the class row, so moving a student moves their card."}</p>
        <h2 className="h2">The two concepts you assign</h2>
        <p className="p">{"The assign page holds one row a student. Suggest sends that student's Concepts sheet entries, their Locker Room choices and reflections, and their picks so far to Claude with no name, and asks for two concepts not among their picks with a sentence of reason each. Your choice is saved to the plan row as cultureAssigned, keyed by email, the moment you change it, and only an instructor session can write that row. The guide reads it on every load: the two show first on every chooser as Required, and Hand in refuses until both are among the six."}</p>
        <h2 className="h2">The guide</h2>
        <p className="p">{"Nine pages: Start, six concept pages, Questions, Your guide. Each concept page opens with the chooser, in three groups: Required (yours), the concepts the student already wrote about (read off their Concepts sheet and Locker Room file, with where), and the rest in chapter order. A concept already used on another page shows as taken with that page's number. A pick loads the page: everything they wrote about that concept on the two earlier files (the Locker Room choices read back as full sentences, never the clipped labels), then a definition with a source, why it matters with a source, two guidelines, and an optional Anything else. The concept pick is saved as concept:1 through concept:6; the writing is keyed by the concept, not the page (define:motivation, why:motivation, guide1:motivation, guide2:motivation, more:motivation), so swapping a concept out and back keeps what was written. The last page asks for two questions, q:1 and q:2, in your words."}</p>
        <p className="p">{"Every box saves a field at a time as they type, to this browser first and then the server, and a failed save is retried. Hand in needs all six concepts chosen with a definition, why it matters and two guidelines each, both Required concepts in, and both questions; otherwise it names what is missing. A hand-in stamps the sheet, the student can keep editing and hand in again until " + SITDOWN2.dueText + ", and Your guide reads the whole thing back before and after with Print and Copy. Each student's file is at the student view with ?s=<email>; the review page reads every guide in meeting order under the two questions."}</p>
      </section>
      <section className="sec">
        <table className="tbl">
          <thead><tr><th>Student</th><th>Section</th><th>Time</th><th>Assigned</th><th>Chosen</th><th>Boxes</th><th>Questions</th><th>Handed in</th></tr></thead>
          <tbody>
            {rows.map(r => {
              const ids = chosenOf(r.answers).filter(Boolean);
              const boxes = ids.reduce((n, id) => n + filledOf(r.answers, id), 0);
              const qs = [1, 2].filter(i => String(r.answers[F.q(i)] || "").trim()).length;
              return (
                <tr key={r.email}>
                  <td><StudentLink config={config} student={r.student} /></td>
                  <td className="muted">{sectionOf(r.student)}</td>
                  <td>{r.slot ? whenOf(r.slot) : <span className="muted">None</span>}</td>
                  <td>{r.assigned.ids.length ? r.assigned.ids.map(nameOf).join(", ") : <span className="muted">Not yet</span>}</td>
                  <td>{ids.length ? ids.length + " of 6: " + ids.map(nameOf).join(", ") : <span className="muted">None</span>}</td>
                  <td>{boxes + " of " + 6 * BOXES}</td>
                  <td>{qs + " of 2"}</td>
                  <td>{!r.guide ? <span className="muted">Not opened</span> : r.guide.submitted_at ? when(r.guide.submitted_at) : <span className="muted">Started</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}

const CSS = `
.sd .one{display:block}
.sd .one summary{cursor:pointer;list-style:none;display:flex;gap:12px 20px;align-items:baseline;flex-wrap:wrap}
.sd .one summary::-webkit-details-marker{display:none}
.sd .one summary::before{content:"▸";color:var(--accent);margin-right:4px}
.sd .one[open] summary::before{content:"▾"}
.sd .one[open]>*:not(summary){margin-top:16px}
.sd .one .cg{padding:0;background:transparent}
.sd .tbl{width:100%;border-collapse:collapse;font-size:15px;line-height:1.4}
.sd .tbl th{text-align:left;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);padding:0 10px 10px 0;border-bottom:1px solid var(--line)}
.sd .tbl td{vertical-align:top;padding:10px 10px 10px 0;border-bottom:1px solid var(--line)}
.sd .muted{color:var(--ink2)}
`;

// One student's guide as they see it: /<class>/worksheets/culture-guide?s=<id>.
// The whole sheet, every page, read only, with their Concepts sheet and
// Locker Room read back the way the chooser and the concept pages show them,
// whether or not they have opened the guide yet. Andrew, 2026-11-06, on his
// own test sheet: "this is not what lila wrote, it's what i wrote."
export function CultureRead({ config, worksheetKey, roster, student }) {
  const [data] = useClassState(config.storageKey);
  const [got, setGot] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    call({ groupKey: config.id, key: CULTURE_GUIDE_KEY, viewer: student.email })
      .then(out => { if (alive) setGot({ answers: out.answers || {}, submitted: out.sheet?.submitted_at || null, opened: !!out.sheet }); })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [config.id, student.email]);
  const shown = nameShown(data, student.name);
  const classmates = realStudents(config, roster).map(s => s.name).filter(n => n && n !== student.name);
  return (
    <div className="sd-root">
      {FONTS}
      <style>{SD_CSS}</style>
      <div className="sd" style={{ paddingBottom: 0 }}>
        <header className="top">
          <div className="eyebrow"><a className="crumb" href={sitdown2Href(config)}>{config.code + " · Sit-Down 2"}</a></div>
          <h1 className="h1">{shown + "'s Culture Guide"}</h1>
          <p className="intro">{error ? "Could not read the file: " + error : !got ? "Reading the file." : got.submitted ? "Handed in " + when(got.submitted) + ". Every page as " + shown.split(" ")[0] + " sees it, read only." : got.opened ? "Started, not handed in. Every page as " + shown.split(" ")[0] + " sees it, read only." : "Not opened yet. Every page as " + shown.split(" ")[0] + " will see it, read only."}</p>
          <div className="bar">
            <a className="btn" href={guideHref(config) + "?review"}>Every guide</a>
            <a className="lnk" href={sitdown2Href(config) + "?as=" + encodeURIComponent(student.name)}>{shown.split(" ")[0] + "'s slot page"}</a>
          </div>
        </header>
      </div>
      {got ? <CultureGuide key={student.email} store={readStore([], got.submitted)} viewer={{ id: lower(student.email), name: student.name }} classId={config.id} storageKey={config.storageKey} readOnly classmates={classmates} preloaded={got.answers} /> : null}
    </div>
  );
}
