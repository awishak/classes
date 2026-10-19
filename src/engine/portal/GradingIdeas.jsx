// Grading ideas, round two: /<class>/grading.
//
// Andrew, 2026-10-18, on the first round of mockups (a page of its own, in
// its own look): "I'd like to see better mockups, and in the current
// experience of my class site." And on the charts: "i don't need each
// individual dot. just need ideas." So this round is drawn here, in the
// portal's own rows, on the live store, with nothing per student plotted:
// counts, bars and words. Four pages, each with two ways to draw the thing,
// and under each a place to pick and a box for his words. The picks land on
// the plan row, key `gradingIdeas`, so this page is the round and the answer
// sheet in one.
//
// What he kept from round one: the band above the sorting board (4A). What
// he passed on: the opening screens, the one-student pages, and dots.

import { useState, useMemo } from "react";
import { useClassData } from "../store.js";
import { usePhotos, useWithPhotos } from "../photos.js";
import { useWithWorksheetSubmits } from "../worksheetSubmits.js";
import { assignmentsOf } from "../profileTask.js";
import { inDueOrder, statusOf } from "../AssignmentCards.jsx";
import { rosterOf, nameShown } from "../roster.js";
import { realStudents, isHouse, sectionOf } from "../sections.js";
import { alive, boardOf, bucketsFor, bucketOf } from "../grades.js";
import { deadlineOf } from "../DueCard.jsx";
import { waitingOnInstructor } from "../YouCard.jsx";
import { ThemeStyle } from "../ThemeShell.jsx";
import { PORTAL_CSS } from "./style.js";
import { Sec, Row, Io, Btn, Chip, Gm, Face, dcolOf, dueWords, whenWords, dayWords } from "./bits.jsx";
import * as TOKENS from "../tokens.js";

const F = TOKENS.FONT.body;

// ─── numbers off the store ───

const dated = (asg) => asg.due && asg.due !== "Ongoing" && deadlineOf(asg.due, asg.dueTime);
const first = (name) => String(name || "").split(" ")[0];
const plural = (n, one, many) => n + " " + (n === 1 ? one : many || one + "s");

// One assignment, counted: who turned in, how late, how it was sorted.
function countAssignment(data, asg, roster) {
  const due = dated(asg);
  const board = boardOf(data, asg.id);
  const columns = bucketsFor(asg);
  const mix = {};
  let turnedIn = 0, late = 0, lastDay = 0, lastHour = 0, early = 0, week = 0, comments = 0, messages = 0, regrades = 0, toGrade = 0;
  roster.forEach(s => {
    const log = alive(data?.assignmentLog?.[asg.id]?.[s.name]);
    const subs = log.filter(e => e.type === "submission");
    const card = board.cards?.[s.name];
    const bucket = card?.bucket && columns.some(b => b.id === card.bucket) ? card.bucket : null;
    if (bucket) mix[bucket] = (mix[bucket] || 0) + 1;
    if (subs.length) {
      turnedIn++;
      if (!bucket) toGrade++;
      const h = due ? (due - subs[0].ts) / 36e5 : null;
      if (h != null) {
        if (h < 0) late++; else if (h <= 1) lastHour++; else if (h <= 24) lastDay++; else if (h <= 72) early++; else week++;
      }
    }
    comments += log.filter(e => e.type === "comment" && e.from !== "student").length;
    messages += log.filter(e => e.type === "comment" && e.from === "student").length;
    regrades += log.filter(e => e.type === "regrade").length;
  });
  const sorted = Object.values(mix).reduce((n, x) => n + x, 0);
  const mode = Object.entries(mix).sort((x, y) => y[1] - x[1])[0] || null;
  const released = board.released?.at || null;
  const daysToRelease = due && released ? Math.round((dayOf(released) - dayOf(due)) / 864e5) : null;
  return { asg, due, columns, mix, sorted, mode: mode ? { bucket: bucketOf(mode[0]), n: mode[1] } : null, turnedIn, late, lastDay, lastHour, early, week,
    missing: roster.length - turnedIn, comments, messages, regrades, toGrade, released, daysToRelease, of: roster.length };
}
const dayOf = (t) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
// "Tue Oct 13": the day something went out, without the time.
const dayShort = (ts) => { try { return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", ""); } catch { return ""; } };

// One student, counted across the assignments that have a due date gone by.
function countStudent(config, data, s, past) {
  let done = 0, late = 0, early = 0, comments = 0, regrades = 0;
  const grades = {};
  past.forEach(a => {
    const log = alive(data?.assignmentLog?.[a.asg.id]?.[s.name]);
    const subs = log.filter(e => e.type === "submission");
    if (subs.length) { done++; if (a.due && subs[0].ts > a.due) late++; if (a.due && a.due - subs[0].ts > 24 * 36e5) early++; }
    comments += log.filter(e => e.type === "comment" && e.from === "student").length;
    regrades += log.filter(e => e.type === "regrade").length;
    const card = boardOf(data, a.asg.id).cards?.[s.name];
    if (card?.bucket) grades[a.asg.id] = card.bucket;
  });
  const msgs = (data?.threads?.[s.name] || []).filter(m => m.from !== "instructor" && String(m.text || "").trim()).length;
  const checkin = Object.values(data?.checkins || {}).some(byName => byName?.[s.name]);
  const engagement = msgs + comments + regrades + early + (checkin ? 1 : 0);
  return { s, done, late, early, comments, regrades, msgs, checkin, engagement, grades, of: past.length };
}

// ─── small pieces, in the portal's language ───

const Tile = ({ n, label, sub }) => (
  <div className="pt-tile"><span className="pt-tileN">{n}</span><span className="pt-tileL">{label}</span>{sub ? <span className="pt-meta">{sub}</span> : null}</div>
);

// A bar of the class: on time, late, nothing in. Counts beside the colours, so
// the colour is never the only way to read the bar.
function ClassBar({ c }) {
  const onTime = c.turnedIn - c.late;
  const seg = (n, bg) => n ? <i style={{ flex: n, background: bg, display: "block", height: "100%" }} /> : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 2, height: 10, borderRadius: 999, overflow: "hidden", background: "var(--surface-sunk)" }}>
        {seg(onTime, "var(--state-ok)")}{seg(c.late, "var(--state-late)")}{seg(c.missing, "transparent")}
      </div>
      <p className="pt-meta"><span>{onTime} in on time</span>{c.late ? <span style={{ color: "var(--pt-late-ink)", fontWeight: 600 }}>{c.late} late</span> : null}<span>{c.missing} nothing in</span></p>
    </div>
  );
}

// The grade mix as a bar in ink steps, Complete the darkest, with the words
// and counts under the bar. The accent stays off the bar: it means press.
const INK = ["var(--text-primary)", "var(--text-secondary)", "var(--text-muted)", "var(--line-ghost)", "var(--line-strong)"];
function MixBar({ c, words = true }) {
  const steps = c.columns.map((b, i) => ({ b, n: c.mix[b.id] || 0, bg: INK[Math.min(i, INK.length - 1)] })).filter(x => x.n);
  if (!steps.length) return <p className="pt-meta">Nothing sorted yet.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 2, height: 10, borderRadius: 999, overflow: "hidden" }}>
        {steps.map(x => <i key={x.b.id} style={{ flex: x.n, background: x.bg, display: "block", height: "100%" }} />)}
      </div>
      {words ? <p className="pt-meta">{steps.map(x => <span key={x.b.id}><b style={{ color: "var(--text-primary)" }}>{x.n}</b> {x.b.label}</span>)}</p> : null}
    </div>
  );
}

// When the work came in, as five bars with counts. No dots, by request.
function WhenBars({ c }) {
  const bins = [["3 days or more before", c.week], ["1 to 3 days before", c.early], ["the last day", c.lastDay], ["the last hour", c.lastHour], ["late", c.late]];
  const max = Math.max(1, ...bins.map(b => b[1]));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(120px, 170px) 1fr 40px", gap: "6px 12px", alignItems: "center", fontSize: 15 }}>
      {bins.map(([say, n]) => [
        <span key={say + "l"} style={{ color: n ? "var(--text-primary)" : "var(--text-muted)", fontWeight: say === "late" && n ? 600 : 500 }}>{say}</span>,
        <div key={say + "b"} style={{ height: 14, borderRadius: 999, background: "var(--surface-sunk)", overflow: "hidden" }}>
          <div style={{ width: Math.round(n / max * 100) + "%", height: "100%", borderRadius: 999, background: say === "late" ? "var(--state-late)" : "var(--text-secondary)" }} />
        </div>,
        <span key={say + "n"} style={{ fontFamily: "var(--font-label)", fontSize: 15, textAlign: "right", color: n ? "var(--text-primary)" : "var(--text-muted)" }}>{n}</span>,
      ])}
    </div>
  );
}

// Names as chips. Names, never faces or initials, on a tracker page.
const Names = ({ list, data, onPick, late }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {list.map(r => <Chip key={r.s.name} onClick={() => onPick(r.s.name)} kind={late && r.late ? "due" : ""}>{nameShown(data, r.s.name)}</Chip>)}
    {!list.length ? <span className="pt-quiet">Nobody.</span> : null}
  </div>
);

// The pick under each page: a few pills and a box, written to the plan row.
function Pick({ id, question, options, picks, save }) {
  const cur = picks?.[id] || {};
  const [words, setWords] = useState(cur.words || "");
  return (
    <div style={{ background: "var(--surface-sunk)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="pt-title">{question}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(o => <Chip key={o} on={cur.pick === o} onClick={() => save(id, { pick: cur.pick === o ? "" : o })}>{o}</Chip>)}
      </div>
      <label className="pt-lab" htmlFor={"words-" + id}>In your words</label>
      <textarea id={"words-" + id} className="pt-field" value={words} onChange={e => setWords(e.target.value)} />
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Btn onClick={() => save(id, { words })}>Save</Btn>
        {cur.at ? <span className="pt-meta">Saved {whenWords(cur.at)}</span> : null}
      </div>
    </div>
  );
}

const Seg = ({ value, options, onChange }) => (
  <div className="pt-seg" role="radiogroup">
    {options.map(([k, say]) => <button key={k} type="button" role="radio" aria-checked={value === k} className={value === k ? "on" : ""} onClick={() => onChange(k)}>{say}</button>)}
  </div>
);

// The four corners, in three sets of words. 6C puzzled him: "not sure what
// 6C is." Each set says under itself what the words are doing.
const WORDS = {
  mine: { say: "Your words", why: "The three you said, and one for the fourth corner.", q: ["high engagement", "completed all work", "not doing any work", "quiet, but doing the work"] },
  doing: { say: "What they are doing", why: "Words for the term so far, after the four patterns research keeps finding in a class.", q: ["In touch, work missing", "Completing, in touch", "Not started", "Completing, quietly"] },
  next: { say: "What you would do next", why: "Each corner is a move. The chart ends in an action instead of a name for a student.", q: ["Check in", "Keep going", "Reach out", "Encourage"] },
};

// ─── the page ───

export default function GradingIdeas({ config }) {
  const [stored, update] = useClassData(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const data = useWithWorksheetSubmits(useWithPhotos(stored, photos), config);
  const a = config.accent;
  const [page, setPage] = useState("class");
  const [classWay, setClassWay] = useState("desk");
  const [studentsWay, setStudentsWay] = useState("shelves");
  const [wordsWay, setWordsWay] = useState("mine");
  const [aid, setAid] = useState("");
  const [who, setWho] = useState("");

  const roster = useMemo(() => realStudents(config, rosterOf(config, data)).filter(s => !isHouse(s.name)), [config, data]);
  const assignments = useMemo(() => inDueOrder(assignmentsOf(config, data)).filter(x => x.visible !== false), [config, data]);
  const counted = useMemo(() => assignments.map(asg => countAssignment(data, asg, roster)), [assignments, data, roster]);
  const now = Date.now();
  const past = counted.filter(c => c.due && c.due < now && c.turnedIn);
  const coming = counted.filter(c => c.due && c.due >= now);
  const students = useMemo(() => roster.map(s => countStudent(config, data, s, past)), [config, data, roster, past]);
  const picks = data?.gradingIdeas || {};
  const save = (id, patch) => update(prev => ({ ...prev, gradingIdeas: { ...(prev.gradingIdeas || {}), [id]: { ...((prev.gradingIdeas || {})[id] || {}), ...patch, at: Date.now() } } }));

  const chosen = counted.find(c => c.asg.id === aid) || past[past.length - 1] || counted[0] || null;
  const student = students.find(r => r.s.name === who) || null;
  const openStudent = (name) => { setWho(name); setPage("student"); };
  const openAssignment = (id) => { setAid(id); setPage("assignment"); };

  const PAGES = [["class", "Class"], ["assignment", "One assignment"], ["student", "One student"], ["words", "The words"]];

  return (
    <div data-theme="clean" className="ca-root pt-root" style={{ minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: F, "--ca-accent": a, "--ca-accent-ink": a }}>
      <ThemeStyle theme="clean" />
      <style>{PORTAL_CSS + ".ca-focus:focus-visible{outline:2px solid var(--ca-accent);outline-offset:2px;border-radius:10px}"}</style>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px 16px 64px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="pt-head" style={{ alignItems: "baseline", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h1 className="pt-h1">Grade view, round two</h1>
            <span className="pt-sub">{config.code} as it stands, drawn in the site's own rows</span>
          </div>
          <Chip href={config.path + "/grade"}>The grade view today</Chip>
        </div>
        <div className="pt-titles">
          {PAGES.map(([k, say]) => <button key={k} type="button" className={page === k ? "on" : ""} onClick={() => setPage(k)}>{say}</button>)}
        </div>

        {data === null ? <p className="pt-quiet">Loading.</p> : null}

        {data !== null && page === "class" ? (
          <ClassIdeas config={config} data={data} counted={counted} past={past} coming={coming} students={students} roster={roster}
            way={classWay} setWay={setClassWay} studentsWay={studentsWay} setStudentsWay={setStudentsWay} wordsWay={wordsWay}
            openStudent={openStudent} openAssignment={openAssignment} picks={picks} save={save} />
        ) : null}

        {data !== null && page === "assignment" ? (
          <AssignmentIdeas config={config} data={data} counted={counted} chosen={chosen} setAid={setAid} roster={roster} openStudent={openStudent} picks={picks} save={save} />
        ) : null}

        {data !== null && page === "student" ? (
          <StudentIdeas config={config} data={data} students={students} student={student} setWho={setWho} counted={counted} openAssignment={openAssignment} picks={picks} save={save} />
        ) : null}

        {data !== null && page === "words" ? (
          <WordsIdeas students={students} way={wordsWay} setWay={setWordsWay} picks={picks} save={save} />
        ) : null}
      </div>
    </div>
  );
}

// ─── the class ───

function ClassIdeas({ config, data, counted, past, coming, students, roster, way, setWay, studentsWay, setStudentsWay, wordsWay, openStudent, openAssignment, picks, save }) {
  const toGrade = past.reduce((n, c) => n + c.toGrade, 0);
  const inbox = roster.filter(s => waitingOnInstructor(data, s.name));
  const regrades = past.reduce((n, c) => n + c.regrades, 0);
  const nothing = students.filter(r => r.of && r.done === 0);
  const next = coming[0] || null;
  const needs = [];
  past.forEach(c => { if (c.toGrade) needs.push({ key: "g" + c.asg.id, d: dcolOf(c.asg.due), title: plural(c.toGrade, "turned in", "turned in") + " " + c.asg.title, line: c.toGrade + " to grade", side: <Io kind="go" href={config.path + "/grade?a=" + encodeURIComponent(c.asg.id)}>Grade</Io> }); });
  if (inbox.length) needs.push({ key: "inbox", d: ["", String(inbox.length)], title: plural(inbox.length, "message") + " waiting on you", line: inbox.slice(0, 4).map(s => first(nameShown(data, s.name))).join(", ") + (inbox.length > 4 ? " and " + (inbox.length - 4) + " more" : ""), side: <Io kind="go" href={config.path + "/messages"}>Open</Io> });
  if (regrades) needs.push({ key: "rg", d: ["", String(regrades)], title: plural(regrades, "regrade") + " asked for", line: past.filter(c => c.regrades).map(c => c.asg.title).join(", "), side: <Io kind="go" href={config.path + "/grade"}>Grade</Io> });
  if (nothing.length) needs.push({ key: "none", d: ["", String(nothing.length)], title: plural(nothing.length, "student") + " with nothing turned in", line: nothing.map(r => nameShown(data, r.s.name)).join(", "), side: <Io onClick={() => openStudent(nothing[0].s.name)}>Open</Io> });
  if (next) needs.push({ key: "next", d: dcolOf(next.asg.due), title: next.asg.title + " is due " + dueWords(next.asg.due, next.asg.dueTime), line: next.turnedIn ? next.turnedIn + " of " + next.of + " in already" : "Nothing in yet", side: <Io kind="go" onClick={() => openAssignment(next.asg.id)}>Open</Io>, tint: "due" });

  const allDone = students.filter(r => r.of && r.done === r.of);
  const shelves = [
    ["Completed all work", allDone.filter(r => !r.late), "none late"],
    ["Completed all work, late once or more", allDone.filter(r => r.late), ""],
    ["Missing one", students.filter(r => r.of && r.done === r.of - 1), ""],
    ["Missing more than one", students.filter(r => r.of && r.done > 0 && r.done < r.of - 1), ""],
    ["Not doing any work", nothing, "nothing turned in"],
  ];
  const med = (() => { const v = students.map(r => r.engagement).sort((x, y) => x - y); return v.length ? v[Math.floor(v.length / 2)] : 0; })();
  const q = WORDS[wordsWay].q;
  const quads = [
    [q[0], students.filter(r => r.done < r.of && r.engagement > med)],
    [q[1], students.filter(r => r.done === r.of && r.engagement > med)],
    [q[2], students.filter(r => r.done < r.of && r.engagement <= med)],
    [q[3], students.filter(r => r.done === r.of && r.engagement <= med)],
  ];

  return (
    <div className="pt-body" style={{ gap: 24 }}>
      <Seg value={way} options={[["desk", "The desk"], ["term", "The term first"]]} onChange={setWay} />

      {way === "desk" ? (
        <div className="pt-day">
          <Sec name="Needs you" sub={needs.length ? "" : "nothing right now"} />
          <div className="pt-stack">
            {needs.map(n => (
              <Row key={n.key} tint={n.tint || "due"} d={n.d} side={n.side}>
                <p className="pt-title">{n.title}</p>
                <p className="pt-meta">{n.line}</p>
              </Row>
            ))}
            {!needs.length ? <p className="pt-quiet">Everything is sorted, released and answered.</p> : null}
          </div>
        </div>
      ) : (
        <div className="pt-day">
          <Sec name="The term" sub={past.length + " of " + counted.length + " graded"} />
          <div className="pt-tiles">
            <Tile n={past.reduce((n, c) => n + c.turnedIn, 0)} label="turn-ins so far" sub={"of " + past.reduce((n, c) => n + c.of, 0) + " possible"} />
            <Tile n={Math.round(past.reduce((n, c) => n + c.lastDay + c.lastHour, 0) / Math.max(1, past.reduce((n, c) => n + c.turnedIn, 0)) * 100) + "%"} label="in the last day" sub="before the deadline" />
            <Tile n={past.reduce((n, c) => n + c.late, 0)} label="late turn-ins" sub={past.length ? "across " + plural(past.length, "assignment") : ""} />
          </div>
        </div>
      )}

      <div className="pt-day">
        <Sec name="Assignments" sub="each row opens the assignment" />
        <div className="pt-stack">
          {counted.map(c => {
            const gone = c.due && c.due < Date.now();
            const tint = !c.due ? "" : gone ? (c.released ? "done" : "due") : "";
            return (
              <Row key={c.asg.id} tint={tint} d={dcolOf(c.asg.due)} onOpen={() => openAssignment(c.asg.id)} side={gone ? <Io kind="go" href={config.path + "/grade?a=" + encodeURIComponent(c.asg.id)}>Grade</Io> : <Io onClick={() => openAssignment(c.asg.id)}>Open</Io>}>
                <p className="pt-title">{c.asg.title}</p>
                <p className={"pt-when " + tint}>
                  <span>{!c.due ? "Ongoing, all quarter" : gone ? (c.released ? "Released " + dayShort(c.released) : "Due date gone, not released") : "Due " + dueWords(c.asg.due, c.asg.dueTime)}</span>
                  {c.asg.weight ? <Gm>{c.asg.weight}%</Gm> : null}
                  {c.toGrade ? <span style={{ color: "var(--pt-due-ink)" }}>{c.toGrade} to grade</span> : null}
                </p>
                {c.turnedIn ? <ClassBar c={c} /> : null}
                {c.sorted ? <MixBar c={c} /> : null}
                {c.mode ? <p className="pt-meta">Most common: <b style={{ color: "var(--text-primary)" }}>{c.mode.bucket.label}</b>, {c.mode.n} of {c.sorted}{c.daysToRelease != null ? " · released " + plural(c.daysToRelease, "day") + " after the due date" : ""}</p> : null}
              </Row>
            );
          })}
        </div>
      </div>

      <div className="pt-day">
        <Sec name="Students" sub={past.length ? "across the " + plural(past.length, "assignment") + " due so far" : ""} right={<Seg value={studentsWay} options={[["shelves", "Shelves"], ["quad", "Two by two"]]} onChange={setStudentsWay} />} />
        {studentsWay === "shelves" ? (
          <div className="pt-stack">
            {shelves.map(([say, list, sub]) => (
              <div key={say} className="pt-row" style={{ alignItems: "flex-start" }}>
                <div className="pt-dcol"><span className="pt-dn">{list.length}</span></div>
                <div className="pt-main">
                  <p className="pt-title">{say}</p>
                  {sub ? <p className="pt-meta">{sub}</p> : null}
                  <Names list={list} data={data} onPick={openStudent} late />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p className="pt-meta">Across: did they turn in all of the work due so far. Up: how much else they do, from messages and comments to the check-in and early turn-ins, against the class median.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {quads.map(([say, list], i) => (
                <div key={say} className={"pt-row " + (i === 1 ? "done" : i === 2 ? "late" : i === 0 ? "due" : "me")} style={{ flexDirection: "column", alignItems: "stretch", gap: 8, minHeight: 120 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}><span className="pt-dn" style={{ fontSize: 26 }}>{list.length}</span><p className="pt-title">{say}</p></div>
                  <Names list={list} data={data} onPick={openStudent} />
                </div>
              ))}
            </div>
            <p className="pt-meta">The words come from the page called The words.</p>
          </div>
        )}
      </div>

      <Pick id="class" question="The class page: closer?" options={["The desk", "The term first", "Shelves", "Two by two", "Still not this"]} picks={picks} save={save} />
    </div>
  );
}

// ─── one assignment ───

function AssignmentIdeas({ config, data, counted, chosen, setAid, roster, openStudent, picks, save }) {
  const [way, setWay] = useState("band");
  if (!chosen) return <p className="pt-quiet">No assignments in this class yet.</p>;
  const c = chosen;
  const missing = roster.filter(s => !alive(data?.assignmentLog?.[c.asg.id]?.[s.name]).some(e => e.type === "submission"));
  const lateOnes = roster.filter(s => { const sub = alive(data?.assignmentLog?.[c.asg.id]?.[s.name]).find(e => e.type === "submission"); return sub && c.due && sub.ts > c.due; });
  const rows = (list) => list.map(s => ({ s, late: lateOnes.includes(s) }));
  return (
    <div className="pt-body" style={{ gap: 24 }}>
      <div className="pt-chips">
        {counted.map(x => <Chip key={x.asg.id} on={x.asg.id === c.asg.id} onClick={() => setAid(x.asg.id)}>{x.asg.title}</Chip>)}
      </div>
      <div className="pt-head" style={{ flexWrap: "wrap" }}>
        <div>
          <h2 className="pt-h1" style={{ fontSize: 26 }}>{c.asg.title}</h2>
          <p className="pt-sub">{c.due ? "Due " + dueWords(c.asg.due, c.asg.dueTime) : "Ongoing"}{c.released ? " · released " + whenWords(c.released) : ""}</p>
        </div>
        <Seg value={way} options={[["band", "The band"], ["rows", "As rows"]]} onChange={setWay} />
      </div>

      {way === "band" ? (
        <>
          <div className="pt-tiles" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            <Tile n={c.turnedIn} label={"of " + c.of + " turned in"} sub={c.late ? plural(c.late, "late turn-in") : "none late"} />
            <Tile n={c.mode ? c.mode.bucket.label : "—"} label="most common grade" sub={c.mode ? c.mode.n + " of " + c.sorted + " sorted" : "nothing sorted yet"} />
            <Tile n={c.daysToRelease != null ? c.daysToRelease + " d" : c.toGrade ? c.toGrade : "—"} label={c.daysToRelease != null ? "from due to released" : "to grade"} sub={c.released ? dayShort(c.released) : ""} />
            <Tile n={c.messages + c.regrades} label="messages and regrades" sub={c.messages + " messages, " + c.regrades + " regrades, " + c.comments + " comments from you"} />
          </div>
          <div className="pt-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
            <Sec name="When the work came in" sub={c.due ? "against the deadline" : ""} />
            <WhenBars c={c} />
          </div>
          <div className="pt-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
            <Sec name="How it was sorted" />
            <MixBar c={c} />
          </div>
          <div className="pt-row off" style={{ justifyContent: "space-between" }}>
            <p className="pt-text">The sorting board, exactly as it is today, sits under this band.</p>
            <Io kind="go" href={config.path + "/grade?a=" + encodeURIComponent(c.asg.id)}>Open the board</Io>
          </div>
        </>
      ) : (
        <div className="pt-stack">
          <Row tint="done" d={["", String(c.turnedIn)]}>
            <p className="pt-title">turned in, of {c.of}</p>
            <ClassBar c={c} />
          </Row>
          <Row tint={c.late ? "late" : "me"} d={["", String(c.late)]} side={lateOnes.length ? <Io onClick={() => openStudent(lateOnes[0].name)}>Open</Io> : null}>
            <p className="pt-title">late</p>
            <Names list={rows(lateOnes)} data={data} onPick={openStudent} />
          </Row>
          <Row tint={missing.length ? "due" : "me"} d={["", String(missing.length)]}>
            <p className="pt-title">nothing turned in</p>
            <Names list={rows(missing)} data={data} onPick={openStudent} />
          </Row>
          <Row tint="me" d={["", c.mode ? String(c.mode.n) : "0"]}>
            <p className="pt-title">{c.mode ? c.mode.bucket.label + ", the most common grade" : "Nothing sorted yet"}</p>
            {c.sorted ? <MixBar c={c} /> : null}
          </Row>
          <Row tint="me" d={["", c.daysToRelease != null ? c.daysToRelease + "d" : "—"]}>
            <p className="pt-title">{c.daysToRelease != null ? "days from the due date to the release" : "not released yet"}</p>
            <WhenBars c={c} />
          </Row>
        </div>
      )}

      <Pick id="assignment" question="One assignment: closer?" options={["The band", "As rows", "Both", "Still not this"]} picks={picks} save={save} />
    </div>
  );
}

// ─── one student ───

function StudentIdeas({ config, data, students, student, setWho, counted, openAssignment, picks, save }) {
  const [way, setWay] = useState("work");
  const [q, setQ] = useState("");
  const hits = q.trim() ? students.filter(r => nameShown(data, r.s.name).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 12) : [];
  return (
    <div className="pt-body" style={{ gap: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input className="pt-field" value={q} onChange={e => setQ(e.target.value)} placeholder="A name" aria-label="Find a student" />
        {hits.length ? <div className="pt-chips">{hits.map(r => <Chip key={r.s.name} on={student?.s.name === r.s.name} onClick={() => { setWho(r.s.name); setQ(""); }}>{nameShown(data, r.s.name)}</Chip>)}</div> : null}
      </div>
      {!student ? <p className="pt-quiet">Pick a name above, or tap one on the Class page.</p> : (
        <>
          <div className="pt-head" style={{ flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Face config={config} data={data} name={student.s.name} size={48} />
              <div>
                <h2 className="pt-h1" style={{ fontSize: 26 }}>{nameShown(data, student.s.name)}</h2>
                <p className="pt-sub">{sectionOf(student.s) ? sectionOf(student.s) + " · " : ""}{student.done} of {student.of} in{student.late ? " · " + plural(student.late, "late turn-in") : ""}{student.msgs ? " · " + plural(student.msgs, "message") + " to you" : ""}</p>
              </div>
            </div>
            <Seg value={way} options={[["work", "Their work"], ["flow", "Everything, dated"]]} onChange={setWay} />
          </div>
          <div className="pt-tiles">
            <Tile n={student.done + " of " + student.of} label="turned in" />
            <Tile n={student.late} label="late" />
            <Tile n={student.msgs + student.comments + student.regrades} label="messages to you" sub={student.checkin ? "check-in done" : "no check-in yet"} />
          </div>
          {way === "work" ? <StudentWork config={config} data={data} student={student} counted={counted} openAssignment={openAssignment} /> : <StudentFlow config={config} data={data} student={student} counted={counted} />}
        </>
      )}
      <Pick id="student" question="One student: closer?" options={["Their work", "Everything, dated", "Both", "Still not this"]} picks={picks} save={save} />
    </div>
  );
}

// Their My Work, read from your side: the same rows they see, with the grade
// you gave and how early or late the work came in.
function StudentWork({ config, data, student, counted, openAssignment }) {
  const name = student.s.name;
  return (
    <div className="pt-stack">
      {counted.map(c => {
        const st = statusOf(config, data, c.asg, name, new Set());
        const sub = st.last;
        const hoursEarly = sub && c.due ? (c.due - sub.ts) / 36e5 : null;
        const tint = st.state === "graded" ? "done" : st.state === "turnedIn" ? "done" : st.state === "missed" ? "late" : st.state === "open" ? "due" : "";
        const line = st.state === "graded" ? st.letter : st.state === "turnedIn" ? "Turned in, not sorted yet" : st.state === "missed" ? "Nothing turned in, was due " + dueWords(c.asg.due, c.asg.dueTime) : st.state === "ongoing" ? "Ongoing" : "Due " + dueWords(c.asg.due, c.asg.dueTime);
        return (
          <Row key={c.asg.id} tint={tint} d={dcolOf(c.asg.due)} onOpen={() => openAssignment(c.asg.id)} side={<Io kind="go" href={config.path + "/grade?a=" + encodeURIComponent(c.asg.id)}>Grade</Io>}>
            <p className="pt-title">{c.asg.title}</p>
            <p className={"pt-when " + tint}><span>{line}</span>{c.asg.weight ? <Gm>{c.asg.weight}%</Gm> : null}</p>
            {sub ? <p className="pt-meta" style={hoursEarly != null && hoursEarly < 0 ? { color: "var(--pt-late-ink)", fontWeight: 600 } : {}}>Turned in {whenWords(sub.ts)}{hoursEarly != null ? " · " + hoursWords(hoursEarly) : ""}</p> : null}
          </Row>
        );
      })}
    </div>
  );
}
const hoursWords = (h) => { const a = Math.abs(h); const span = a < 1 ? Math.round(a * 60) + " minutes" : a < 48 ? Math.round(a) + " hours" : Math.round(a / 24) + " days"; return h < 0 ? span + " late" : span + " before the deadline"; };

// Everything between you and this student, newest first, under day headings.
function StudentFlow({ config, data, student, counted }) {
  const name = student.s.name;
  const rows = [];
  counted.forEach(c => {
    alive(data?.assignmentLog?.[c.asg.id]?.[name]).forEach(e => {
      if (e.type === "submission") rows.push({ id: e.id, at: e.ts, tint: c.due && e.ts > c.due ? "late" : "me", say: [first(name) + " turned in ", c.asg.title, c.due ? " · " + hoursWords((c.due - e.ts) / 36e5) : ""] });
      else if (e.type === "grade") rows.push({ id: e.id, at: e.ts, tint: "done", say: ["You released ", e.letter || "", " on " + c.asg.title] });
      else if (e.type === "regrade") rows.push({ id: e.id, at: e.ts, tint: "due", say: [first(name) + " asked for a regrade on ", c.asg.title, ""], text: e.text });
      else if (e.type === "comment") rows.push({ id: e.id, at: e.ts, tint: e.from === "student" ? "me" : "dr", say: [(e.from === "student" ? first(name) : "You") + " wrote on ", c.asg.title, ""], text: String(e.text || "").replace(/<[^>]+>/g, "") });
    });
  });
  (data?.threads?.[name] || []).forEach(m => { const text = String(m.text || "").trim(); if (!text) return; rows.push({ id: m.id, at: m.ts, tint: m.from === "instructor" ? "dr" : "me", say: [m.from === "instructor" ? "You wrote" : first(name) + " wrote", "", ""], text }); });
  rows.sort((x, y) => y.at - x.at);
  if (!rows.length) return <p className="pt-quiet">Nothing between you yet.</p>;
  const groups = [];
  rows.forEach(e => { const d = dayWords(e.at); const last = groups[groups.length - 1]; if (last && last.key === d.key) last.rows.push(e); else groups.push({ ...d, rows: [e] }); });
  return groups.map(g => (
    <div key={g.key} className="pt-day">
      <h2 className="pt-sec"><span className="pt-secName">{g.name}</span><span className="pt-secSub">{g.date}</span></h2>
      <div className="pt-stack">
        {g.rows.map(e => (
          <div key={e.id} className={"pt-row " + e.tint}>
            <div className="pt-main">
              <p className="pt-title say">{e.say[0]}{e.say[1] ? <b>{e.say[1]}</b> : null}{e.say[2] || null}</p>
              {e.text ? <p className="pt-text" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.text}</p> : null}
              <p className="pt-meta"><span>{whenWords(e.at)}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ));
}

// ─── the words ───

function WordsIdeas({ students, way, setWay, picks, save }) {
  const w = WORDS[way];
  return (
    <div className="pt-body" style={{ gap: 24 }}>
      <Seg value={way} options={Object.entries(WORDS).map(([k, v]) => [k, v.say])} onChange={setWay} />
      <p className="pt-sub">{w.why}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 640 }}>
        {w.q.map((say, i) => (
          <div key={say} className={"pt-row " + (i === 1 ? "done" : i === 2 ? "late" : i === 0 ? "due" : "me")} style={{ minHeight: 88, alignItems: "center" }}>
            <p className="pt-title">{say}</p>
          </div>
        ))}
      </div>
      <p className="pt-meta">Right column: did all of the work due so far. Top row: above the class median for messages, comments, regrade asks, the check-in and early turn-ins. {students.length} students on the roster.</p>
      <Pick id="words" question="Which words on the four corners?" options={["Mine", "What they are doing", "What you would do next", "Other words"]} picks={picks} save={save} />
    </div>
  );
}
