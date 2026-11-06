// The two concepts Andrew assigns each student, for the Culture Guide:
// /<class>/sitdown2/assign, behind the instructor gate.
//
// One row a student: their slot, what they have picked so far on the guide,
// what they already wrote about on the Concepts sheet and in Locker Room,
// then the two assigned concepts with a sentence of reason each. Suggest
// asks Claude for the pair and the reasons, from that student's own writing
// with no name attached, through /api/generate-feedback; he changes either
// from the menu or rewrites the reason. Saved to the plan row as
// cultureAssigned[email] (facts.js), which the guide reads for its Required
// chips the moment it lands.

import { useEffect, useState } from "react";
import { useClassData } from "../store.js";
import { rosterOf } from "../roster.js";
import { realStudents } from "../sections.js";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { CSS as SD_CSS, FONTS } from "../SitdownPage.jsx";
import { useStudentTheme, useDayNight, ThemeStyle } from "../ThemeShell.jsx";
import { setClassFavicon } from "../favicon.js";
import TopNav, { NAV_TEACH } from "../TopNav.jsx";
import { TEAM_TOPICS_KEY, PARTS as TOPIC_PARTS, linesOf } from "../teamtopics/sheet.jsx";
import * as E from "../takeover/engine.js";
import { CULTURE_GUIDE_KEY, chosenOf, writtenOf, lockerAbout, nameOf } from "./guide.jsx";
import { slotFor, whenOf, assignedFor, withAssigned, sitdown2Href, guideHref } from "./facts.js";

const lower = (s) => String(s || "").trim().toLowerCase();
const call = async (body) => {
  const r = await fetch("/api/worksheet-submits", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), ...body }) });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};

const SYSTEM = "You are helping a college instructor (COMM 118, Communication and Sport) assign two concepts to one student for a Culture Guide the student writes before a ten-minute one-on-one meeting. The student chooses four of six concepts; the instructor chooses the other two. You are given the twenty concepts from the chapter, what this student already wrote about some of them, and which the student has already chosen. Choose two the student has NOT already chosen. Prefer a concept the student's own writing keeps pointing toward without naming, or a concept that would stretch them, over one they have already covered well. Answer with JSON only, no prose around it: {\"first\":{\"id\":\"<concept id>\",\"why\":\"<one full sentence>\"},\"second\":{\"id\":\"<concept id>\",\"why\":\"<one full sentence>\"}}. Each why is one plain full sentence under 30 words, addressed to the instructor, grounded in what the student wrote. No em dashes. No names.";

// What one student wrote, with no name, for the prompt.
function briefOf(topics, locker, picks) {
  const lines = [];
  lines.push("Concepts, by id: " + E.CONCEPTS.map(c => c.id + " = " + c.name).join("; "));
  const sheet = [];
  ["a", "b", "c", "d", "e"].forEach(s => {
    const t = String((topics || {})["topic:" + s] || "").trim();
    if (!t) return;
    sheet.push("Concept: " + t + " (" + (E.matchConcept(t) || "no id") + ")\n" + TOPIC_PARTS.map(p => p.box + ": " + linesOf((topics || {})[p.field + ":" + s]).join(" / ")).join("\n"));
  });
  lines.push(sheet.length ? "The Concepts sheet:\n" + sheet.join("\n\n") : "No Concepts sheet.");
  const season = [];
  E.CONCEPTS.forEach(c => lockerAbout(locker, c.id, "", []).forEach(w => { if (w.wrote) season.push("Locker Room, " + c.name + " (" + c.id + "): chose \"" + w.chose + "\" and wrote \"" + w.wrote + "\""); }));
  lines.push(season.length ? "Locker Room:\n" + season.join("\n") : "No Locker Room season.");
  lines.push(picks.length ? "Already chosen on the guide: " + picks.map(id => id + " = " + nameOf(id)).join(", ") : "Nothing chosen on the guide yet.");
  return lines.join("\n\n");
}

async function suggest(brief) {
  const r = await fetch("/api/generate-feedback", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ model: "claude-opus-5-5", max_tokens: 400, system: SYSTEM, prompt: brief }) });
  const out = await r.json().catch(() => null);
  const text = out && out.content && out.content.map(c => c.text || "").join("").trim();
  if (!r.ok || !text) throw new Error((out && (out.error?.message || out.error)) || "no answer");
  const m = text.match(/\{[\s\S]*\}/);
  const j = JSON.parse(m ? m[0] : text);
  const ids = [j.first?.id, j.second?.id].map(id => E.conceptOf(String(id || "").trim()) ? String(id).trim() : "");
  if (!ids[0] || !ids[1] || ids[0] === ids[1]) throw new Error("Claude did not name two concepts.");
  return { ids, why: { [ids[0]]: String(j.first.why || "").trim(), [ids[1]]: String(j.second.why || "").trim() } };
}

export default function AssignPage({ config }) {
  const [data, update] = useClassData(config.storageKey);
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState({});
  const [note, setNote] = useState("");

  useEffect(() => { document.title = config.code + " · Assign two concepts"; setClassFavicon(config); }, [config]);
  useEffect(() => {
    let alive = true;
    Promise.all([TEAM_TOPICS_KEY, E.TAKEOVER_KEY, CULTURE_GUIDE_KEY].map(key => call({ groupKey: config.id, key, all: true }).then(o => o.sheets)))
      .then(([t, l, g]) => { if (alive) setSheets({ topics: byEmail(t), locker: byEmail(l), guide: byEmail(g) }); })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [config.id]);

  const roster = realStudents(config, rosterOf(config, data)).filter(s => s.email).sort((a, b) => a.name.localeCompare(b.name));
  const rows = roster.map(s => {
    const em = lower(s.email);
    const topics = sheets?.topics.get(em)?.answers || {}, locker = sheets?.locker.get(em)?.answers || {}, guide = sheets?.guide.get(em)?.answers || {};
    return { student: s, email: em, topics, locker, picks: chosenOf(guide).filter(Boolean), written: writtenOf(topics, locker, s.name), assigned: assignedFor(data, em), slot: slotFor(data, s.name) };
  });

  const save = (email, ids, why) => update(d => withAssigned(d, email, ids, why));
  const ask = async (row) => {
    setBusy(b => ({ ...b, [row.email]: true }));
    try {
      const got = await suggest(briefOf(row.topics, row.locker, row.picks));
      save(row.email, got.ids, got.why);
      setNote("");
    } catch (e) { setNote(row.student.name + ": " + String(e.message || e)); }
    setBusy(b => ({ ...b, [row.email]: false }));
  };
  const askAll = async () => { for (const row of rows) if (!row.assigned.ids.length) await ask(row); };   // eslint-disable-line no-await-in-loop

  const done = rows.filter(r => r.assigned.ids.length === 2).length;
  return (
    <div className="sd-root" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      {FONTS}
      <style>{SD_CSS + CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}><TopNav config={config} tabs={NAV_TEACH} active="assignments" /></div>
      <div className="sd sheet-page wide">
        <header className="top">
          <div className="eyebrow"><a className="crumb" href={sitdown2Href(config)}>{config.code + " · Sit-Down 2"}</a></div>
          <h1 className="h1">Assign two concepts</h1>
          <p className="intro">Each row is one student. Suggest asks Claude for the pair and a reason each, from that student's own writing, with no name sent. Change either from the menu or rewrite the reason. A change is saved as you make it, and the student's guide shows the two as Required at once.</p>
          <div className="bar">
            <button type="button" className="btn" disabled={!sheets || Object.values(busy).some(Boolean)} onClick={askAll}>Suggest for everyone not yet assigned</button>
            <a className="lnk" href={guideHref(config) + "?control"}>How the guide works</a>
            <span className="meta" aria-live="polite">{error ? "Could not read the sheets: " + error : !sheets ? "Reading the sheets." : done + " of " + rows.length + " assigned." + (note ? " " + note : "")}</span>
          </div>
        </header>
        <section className="sec">
          <table className="tbl">
            <thead><tr><th>Student</th><th>Picked so far</th><th>Already wrote about</th><th>Assigned 1</th><th>Assigned 2</th><th /></tr></thead>
            <tbody>
              {rows.map(row => <Row key={row.email} row={row} busy={!!busy[row.email]} onAsk={() => ask(row)} onSave={(ids, why) => save(row.email, ids, why)} />)}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

const byEmail = (sheets) => new Map((sheets || []).map(s => [lower(s.viewer_id), s]));

function Row({ row, busy, onAsk, onSave }) {
  const { ids, why } = row.assigned;
  const [text, setText] = useState(why);
  useEffect(() => { setText(why); }, [why[ids[0]], why[ids[1]], ids[0], ids[1]]);   // eslint-disable-line react-hooks/exhaustive-deps
  const setId = (i, id) => { const next = [...ids]; next[i] = id; if (next[0] && next[0] === next[1]) next[1 - i] = ""; onSave(next, text); };
  const setWhy = (id, v) => setText(t => ({ ...t, [id]: v }));
  const pickCell = (i) => (
    <td>
      <select className="sel" value={ids[i] || ""} onChange={e => setId(i, e.target.value)}>
        <option value="">Not set</option>
        {E.CONCEPTS.map(c => <option key={c.id} value={c.id} disabled={row.picks.includes(c.id) || ids[1 - i] === c.id}>{c.name + (row.picks.includes(c.id) ? " (their pick)" : "")}</option>)}
      </select>
      {ids[i] ? <textarea className="why" rows={3} value={text[ids[i]] || ""} placeholder="Why" onChange={e => setWhy(ids[i], e.target.value)} onBlur={() => onSave(ids, text)} /> : null}
    </td>
  );
  return (
    <tr>
      <td><b>{row.student.name}</b><div className="muted">{row.slot ? whenOf(row.slot) : "No time yet"}</div></td>
      <td className="muted">{row.picks.length ? row.picks.map(nameOf).join(", ") : "Nothing yet"}</td>
      <td className="muted">{Object.keys(row.written).length ? Object.keys(row.written).map(nameOf).join(", ") : "Nothing on file"}</td>
      {pickCell(0)}{pickCell(1)}
      <td><button type="button" className="btn" disabled={busy} onClick={onAsk}>{busy ? "Asking" : ids.length ? "Suggest again" : "Suggest"}</button></td>
    </tr>
  );
}

const CSS = `
.sd.wide{max-width:1400px}
.sd .tbl{width:100%;border-collapse:collapse;font-size:15px;line-height:1.4}
.sd .tbl th{text-align:left;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);padding:0 10px 10px 0;border-bottom:1px solid var(--line)}
.sd .tbl td{vertical-align:top;padding:12px 10px 12px 0;border-bottom:1px solid var(--line);max-width:260px}
.sd .tbl .muted{color:var(--ink2);font-size:14px}
.sd .sel{font-family:var(--sans);font-size:15px;min-height:40px;width:100%;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:0 8px}
.sd .why{font-family:var(--sans);font-size:14px;line-height:1.4;width:100%;margin-top:6px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:6px 8px;resize:vertical}
`;
