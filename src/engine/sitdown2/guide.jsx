// The Culture Guide: COMM 118's sheet for Sit-Down 2, at
// /<class>/worksheets/culture-guide.
//
// Andrew, 2026-11-06: "We are building a Culture Guide that you can use to
// guide you as you work with teams now and in the future ... students
// basically will choose a topic from a list of chips (and then when they
// choose the one, the others go away. they always have the option to go back
// and choose a diff one.) When they choose their topic, it brings up the
// material they have previously written about this topic. And then they have
// three boxes. First box asks for a clear definition with a source. Next two
// boxes ask for guidelines ... let's just do two guidelines for each. forget
// insights. give them a box for anything else. I think the last page should
// be: give me two questions you think I should definitely ask you in our
// meeting."
//
// So: a Start page in his words with the FAQ, six concept pages, a Questions
// page, and Your guide, the printout, with Hand in. Each concept page opens
// with the chooser: his two Required concepts first (assign.jsx writes them
// to the plan row), the ones the student already wrote about next, then the
// rest in chapter order. A pick hides the other chips and loads the page: what
// they wrote on the Concepts sheet and in Locker Room about it, read off
// those two files, then the three boxes and the optional fourth.
//
// Fields: concept:1..6 holds a concept id. The writing is keyed by concept,
// not by page (define:motivation, guide1:motivation, guide2:motivation,
// more:motivation), so swapping a concept out and back keeps what was
// written. q:1 and q:2 are the two questions. Saved a field at a time through
// saver.js, so nothing typed is lost.
//
// Hand in needs all six concepts chosen with a definition and two guidelines
// each, both Required concepts among the six, and both questions. The words
// students read are Andrew's where he gave them and drafts for him to edit
// in place everywhere else (Edit the words on the sheet).

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createSaver } from "../visualstory/saver.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { supabaseStore } from "../worktopia/store.js";
import { gameClient } from "../gameClient.js";
import { useClassState } from "../store.js";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { TEAM_TOPICS_KEY, PARTS as TOPIC_PARTS, linesOf } from "../teamtopics/sheet.jsx";
import * as E from "../takeover/engine.js";
import { parseConcepts, castOf, teamOf, benchNameOf } from "../takeover/game.jsx";
import { SITDOWN2, assignedFor } from "./facts.js";
import { nameShown } from "../roster.js";

export const CULTURE_GUIDE_KEY = "culture-guide";
export const CULTURE_GUIDE_TITLE = "Culture Guide";
export const PAGES = [1, 2, 3, 4, 5, 6];
export const F = {
  concept: (n) => "concept:" + n,
  define: (id) => "define:" + id,
  why: (id) => "why:" + id,
  guide1: (id) => "guide1:" + id,
  guide2: (id) => "guide2:" + id,
  more: (id) => "more:" + id,
  q: (n) => "q:" + n,
};
export const COPY_ROW = "worksheet-culture-guide-plan";
export const DEFAULT_COPY = {
  title: CULTURE_GUIDE_TITLE,
  credit: "COMM 118 · Due " + SITDOWN2.dueText,
  intro: "We are building a Culture Guide that you can use to guide you as you work with teams now and in the future. This is also the document you will be becoming an expert on: you will submit it to me before your Sit-Down, and you'll be expected to know it well.",
  faqHead: "FAQ about the Sit-Down",
  "faq.q.1": "When is it?",   // voice-ok: Andrew's question
  "faq.a.1": "Thursday, November 12, or Friday, November 13. You pick a ten-minute slot on the Sit-Down 2 page.",
  "faq.q.2": "How will it go?",
  "faq.a.2": "It's just you and me for ten minutes in Vari Hall 206. Please be five minutes early.",
  "faq.q.3": "What will we talk about?",
  "faq.a.3": "Your Culture Guide. I will ask about what you wrote, and I will ask how your concepts connect to each other.",
  "faq.q.4": "How many concepts will I be asked about?",
  "faq.a.4": "Any of the six. You should know all of them well.",
  choose: "While we can focus on a multitude of topics, I'm going to allow you to choose four of the six concepts that go into your Culture Guide. I will choose the remaining two. You'll make your choices on the following pages.",
  explain: "For each concept you choose, you're going to have to give me a clear definition. You're going to have to give me a reason why we should pay attention to it. And you're also going to have to give me two guidelines that you would use going forward, given what you've learned about this topic.",
  start: "Start",
  chooseHead: "Choose a concept",
  "group.required": "Required",
  "group.written": "You have already written about these",
  "group.rest": "The rest",
  required: "Required",
  change: "Choose a different concept",
  beforeHead: "What you already wrote on this concept",
  define: "What is a definition of this topic? Please include your source.",
  why: "Why is it important for us to think about this topic when it comes to team communication? Please include a source.",
  guideline: "Guideline",
  guidelineAsk: "What's something you will do regarding {topic} going forward?",
  "read.define": "Definition",
  "read.why": "Why it matters",
  "read.guideline": "Guideline",
  "read.more": "Anything else",
  more: "Anything else (optional)",
  previewHead: "How this concept reads in your guide",
  next: "Continue",
  qHead: "Two questions",
  qAsk: "Give me two questions you think I should definitely ask you in our meeting. They can be about any topic, or what would be especially nice is if you can make connections between your topics.",
  guideHead: "Your guide",
  handIn: "Hand in",
  handInAgain: "Hand in again",
  print: "Print",
  copy: "Copy",
  keepEditing: "You can keep editing until " + SITDOWN2.dueText + ".",
  "nav.start": "Start",
  "nav.questions": "Questions",
  "nav.guide": "Your guide",
};

// The nav's short names, so six concepts fit on one line.
const SHORT = { teamwork: "Teamwork", coordination: "Coordination", knowledge: "Knowledge", roles: "Roles", goals: "Goals", motivation: "Motivation", support: "Support", negative: "Negative messaging", decisions: "Decisions", complexity: "Complexity", cohesion: "Cohesion", culture: "Culture", power: "Power", conflict: "Conflict", emotion: "Emotion", failure: "Failure", nonverbal: "Nonverbal", time: "Time-outs", gender: "Gender", lessons: "Lessons" };
export const shortOf = (id) => SHORT[id] || (E.conceptOf(id) || {}).name || id;
export const nameOf = (id) => (E.conceptOf(id) || {}).name || "";

const blank = (v) => !String(v || "").trim();
/** The six concept ids on the file, in page order; "" where a page has none. */
export const chosenOf = (answers) => PAGES.map(n => { const id = String((answers || {})[F.concept(n)] || "").trim(); return E.conceptOf(id) ? id : ""; });
/** How many of a concept's three boxes are filled. */
export const BOXES = 4;
export const filledOf = (answers, id) => [F.define(id), F.why(id), F.guide1(id), F.guide2(id)].filter(f => !blank((answers || {})[f])).length;

/** What is still missing before Hand in, in words. assigned is the two required ids. */
export function missingOf(answers, assigned = []) {
  const out = [];
  const ids = chosenOf(answers);
  ids.forEach((id, i) => {
    if (!id) { out.push("Concept " + (i + 1) + ": no concept chosen"); return; }
    if (blank(answers[F.define(id)])) out.push(nameOf(id) + ": the definition");
    if (blank(answers[F.why(id)])) out.push(nameOf(id) + ": why it matters");
    if (blank(answers[F.guide1(id)])) out.push(nameOf(id) + ": guideline 1");
    if (blank(answers[F.guide2(id)])) out.push(nameOf(id) + ": guideline 2");
  });
  assigned.forEach(id => { if (!ids.includes(id)) out.push(nameOf(id) + " is required and is not one of your six"); });
  if (blank(answers[F.q(1)])) out.push("Question 1");
  if (blank(answers[F.q(2)])) out.push("Question 2");
  return out;
}

// ─── what they already wrote ───

/** The Concepts sheet's lines on one concept: [{ slot, finding, opinion, wonder }]. */
export function topicsAbout(topics, id) {
  const out = [];
  ["a", "b", "c", "d", "e"].forEach(s => {
    if (E.matchConcept((topics || {})["topic:" + s]) !== id) return;
    const parts = {};
    TOPIC_PARTS.forEach(p => { parts[p.field] = linesOf((topics || {})[p.field + ":" + s]); });
    out.push({ slot: s, ...parts });
  });
  return out;
}

/** The Locker Room weeks on one concept: what happened, what they chose (the full sentences, never the clipped labels), what they wrote. */
export function lockerAbout(locker, id, name, classmates = []) {
  const a = locker || {};
  const sport = E.sportOf(a[E.F.sport]);
  const concepts = parseConcepts(a[E.F.concepts]);
  if (!sport || !concepts.length) return [];
  const plan = E.planSeason({ name, concepts, topicsAnswers: {} });
  const cast = castOf(a, name, classmates);
  const team = teamOf(a, name);
  const bench = benchNameOf(cast, classmates, name);
  const { results } = E.replay(a, name);
  const out = [];
  plan.forEach((week, i) => {
    if (week.concept !== id) return;
    const sit = E.situationOf(week.situation);
    const opp = E.opponentFor(name, week.week, team);
    const ctx = { cast, sport, team, opp, bench, who: sit.who };
    const r = results[i];
    const options = r ? (r.options || [r.option]).map(oid => E.anyOptionOf(sit, oid)).filter(Boolean) : [];
    out.push({
      week: week.week, n: week.n, team,
      happened: E.tell(sit.text, ctx),
      chose: options.map(o => E.tell(o.line, ctx)).join(" "),
      wrote: String(a[E.F.reflect(week.week)] || "").trim(),
      source: String(a[E.F.source(week.week)] || "").trim(),
    });
  });
  return out;
}

/** Which concepts a student wrote about, and where. { [id]: ["Concepts sheet", "Locker Room"] } */
export function writtenOf(topics, locker, name) {
  const where = {};
  const add = (id, w) => { if (!id) return; where[id] = where[id] || []; if (!where[id].includes(w)) where[id].push(w); };
  ["a", "b", "c", "d", "e"].forEach(s => add(E.matchConcept((topics || {})["topic:" + s]), "Concepts sheet"));
  const a = locker || {};
  if (E.sportOf(a[E.F.sport])) {
    const concepts = parseConcepts(a[E.F.concepts]);
    const { results } = E.replay(a, name);
    E.planSeason({ name, concepts, topicsAnswers: {} }).forEach((w, i) => { if (results[i] && w.concept) add(w.concept, "Locker Room"); });
  }
  return where;
}

/** The chooser's three groups for one page: required, written, rest; each [{ id, where }]. */
export function groupsOf(assigned, written) {
  const req = (assigned || []).filter(id => E.conceptOf(id));
  const wrote = Object.keys(written || {}).filter(id => !req.includes(id));
  const rest = E.CONCEPTS.map(c => c.id).filter(id => !req.includes(id) && !wrote.includes(id));
  return { required: req, written: wrote, rest };
}

/** The guide as chapters, for the printout and the review. */
export const guideOf = (answers) => chosenOf(answers).map((id, i) => ({
  n: i + 1, id, name: id ? nameOf(id) : "",
  define: id ? String(answers[F.define(id)] || "").trim() : "",
  why: id ? String(answers[F.why(id)] || "").trim() : "",
  guide1: id ? String(answers[F.guide1(id)] || "").trim() : "",
  guide2: id ? String(answers[F.guide2(id)] || "").trim() : "",
  more: id ? String(answers[F.more(id)] || "").trim() : "",
}));

const call = async (body) => {
  const r = await fetch("/api/worksheet-submits", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), ...body }) });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};
// Another of the student's files: read as them under the rules, or, when the
// instructor is reading a student's guide, through the server.
async function otherFile(key, classId, viewerId, readOnly) {
  try {
    const got = await supabaseStore({ supabase: gameClient, worksheetKey: key, groupKey: classId, viewerId }).load();
    if (got && Object.keys(got.answers || {}).length) return got.answers;
  } catch { /* try the server */ }
  if (readOnly) { try { return (await call({ groupKey: classId, key, viewer: viewerId })).answers || {}; } catch { /* nothing on file */ } }
  return {};
}

const STATUS = { loading: "Loading…", saved: "Saved", saving: "Saving…", retrying: "Not saved yet. Trying again.", "failed-load": "Could not load your guide. Reload to try again." };
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap";
const loadFont = () => {
  if (typeof document === "undefined" || document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = FONT_HREF; document.head.appendChild(l);
};

const PAGE_KEYS = ["start", ...PAGES.map(n => "c" + n), "questions", "guide"];
const pageFromHash = () => { try { const h = window.location.hash.replace(/^#/, ""); return PAGE_KEYS.includes(h) ? h : "start"; } catch { return "start"; } };

export function CultureGuide({ store, viewer, classId, storageKey, readOnly = false, storage, editor = false, theme, classmates = [], topicsStore = null, lockerStore = null, preloaded = null }) {
  const copy = useCopy(editor, COPY_ROW, DEFAULT_COPY);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [status, setStatus] = useState("loading");
  const [handing, setHanding] = useState("");
  const [topics, setTopics] = useState({});
  const [locker, setLocker] = useState({});
  const [page, setPage] = useState(pageFromHash);
  const saver = useRef(null);
  const [classData] = useClassState(storageKey);
  const assigned = useMemo(() => assignedFor(classData, viewer?.id), [classData, viewer?.id]);

  const [top, setTop] = useState(0);
  useEffect(() => {
    loadFont();
    // The site's bar is sticky above this sheet; the menu sticks just under it.
    const measure = () => { const bar = document.querySelector('div[style*="sticky"]'); setTop(bar ? bar.getBoundingClientRect().height : 0); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (p) => {
    setPage(p);
    try { window.history.pushState(null, "", "#" + p); } catch { /* fine */ }
    try { window.scrollTo({ top: 0 }); } catch { /* fine */ }
  };

  useEffect(() => {
    const draftKey = CULTURE_GUIDE_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
    const s = createSaver({ store, draftKey, storage: readOnly ? null : (storage ?? (typeof localStorage !== "undefined" ? localStorage : null)), onStatus: setStatus });
    saver.current = s;
    let alive = true;
    // Answers handed in by the page (the instructor reading one student) skip the store.
    if (preloaded) { setAnswers(preloaded); setStatus("saved"); s.load().then(got => { if (alive) setSubmitted(got.submitted_at); }).catch(() => {}); }
    else s.load().then(got => { if (alive) { setAnswers(got.answers); setSubmitted(got.submitted_at); } }).catch(() => { if (alive) setStatus("failed-load"); });
    // The two earlier files: a store handed in (the demo harness), else read as this viewer.
    const other = (key, given) => given ? given.load().then(g => g.answers || {}).catch(() => ({})) : classId && viewer?.id ? otherFile(key, classId, viewer.id, readOnly) : Promise.resolve({});
    other(TEAM_TOPICS_KEY, topicsStore).then(a => { if (alive) setTopics(a); });
    other(E.TAKEOVER_KEY, lockerStore).then(a => { if (alive) setLocker(a); });
    if (readOnly) return () => { alive = false; s.destroy(); };
    const flush = () => s.flush();
    const hidden = () => { if (document.visibilityState === "hidden") s.flush(); };
    const leaving = (e) => { if (Object.keys(s.pending()).length) { s.flush(); e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("beforeunload", leaving);
    return () => {
      alive = false;
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("beforeunload", leaving);
      s.flush(); s.destroy();
    };
  }, [store, viewer?.id, classId, readOnly, storage, topicsStore, lockerStore, preloaded]);

  const set = (field, value) => {
    // On a read-only copy a concept can still be opened to see what was
    // written on it; the pick stays on this screen and nothing is saved.
    if (readOnly) { if (field.startsWith("concept:")) setAnswers(a => ({ ...a, [field]: value })); return; }
    setAnswers(a => ({ ...a, [field]: value }));
    saver.current.change(field, value);
  };

  const handIn = async () => {
    const left = missingOf(answers, assigned.ids);
    if (left.length) { setHanding("missing"); return; }
    setHanding("sending");
    try {
      await saver.current.flush();
      if (Object.keys(saver.current.pending()).length) { setHanding("unsaved"); return; }
      const at = await store.submit();
      setSubmitted(at || new Date().toISOString());
      setHanding("");
    } catch { setHanding("failed"); }
  };

  const root = { className: "cg" + (readOnly ? " ro" : ""), "data-theme": theme || undefined, style: { "--cg-top": top + "px" } };
  if (!answers) return <div {...root}><style>{CSS}</style><div className="sheet"><p className="status">{STATUS[status] || "Loading…"}</p></div></div>;

  const name = viewer?.name || "";
  const shown = nameShown(classData, name);
  const chosen = chosenOf(answers);
  const written = writtenOf(topics, locker, name);
  const left = missingOf(answers, assigned.ids);
  const pageIndex = PAGE_KEYS.indexOf(page);
  const nextPage = PAGE_KEYS[pageIndex + 1] || null;

  const nav = (
    <nav className="nav" aria-label="Pages">
      {PAGE_KEYS.map(k => {
        const n = k.startsWith("c") ? Number(k.slice(1)) : 0;
        const id = n ? chosen[n - 1] : "";
        const label = k === "start" ? copy.say("nav.start") : k === "questions" ? copy.say("nav.questions") : k === "guide" ? copy.say("nav.guide") : id ? shortOf(id) : "Concept " + n;
        const done = k === "start" ? pageIndex > 0 : n ? !!id && filledOf(answers, id) === BOXES : k === "questions" ? !blank(answers[F.q(1)]) && !blank(answers[F.q(2)]) : !!submitted;
        return <button key={k} type="button" className={"ni" + (k === page ? " cur" : "") + (done ? " done" : "") + (n && !id ? " ph" : "")} aria-current={k === page ? "page" : undefined} onClick={() => go(k)}>{label}</button>;
      })}
    </nav>
  );

  const editBar = editor ? (
    <div className="editbar">
      <button type="button" className="btn small" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
      <span className="status" aria-live="polite">{editing ? copy.status || "Change any line students read. Clear a line to put the original back." : copy.status}</span>
    </div>
  ) : null;

  let body;
  if (page === "start") {
    body = (
      <section className="pg">
        <Words k="title" copy={copy} editing={editing} as="h1" className="h1" />
        <Words k="credit" copy={copy} editing={editing} as="p" className="credit" />
        {editBar}
        <Words k="intro" copy={copy} editing={editing} as="p" className="p lead" />
        <Words k="faqHead" copy={copy} editing={editing} as="h2" className="h2" />
        <dl className="faq">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="qa">
              <Words k={"faq.q." + i} copy={copy} editing={editing} as="dt" />
              <dd><Words k={"faq.a." + i} copy={copy} editing={editing} as="span" />{i === 1 && classId ? <> <a href={"/" + classId + "/sitdown2"}>Open the Sit-Down 2 page</a></> : null}</dd>
            </div>
          ))}
        </dl>
        <Words k="choose" copy={copy} editing={editing} as="p" className="p" />
        <Words k="explain" copy={copy} editing={editing} as="p" className="p" />
        <p><button type="button" className="btn primary" onClick={() => go("c1")}>{copy.say("start")}</button></p>
      </section>
    );
  } else if (page.startsWith("c")) {
    const n = Number(page.slice(1));
    const id = chosen[n - 1];
    const takenBy = (cid) => { const i = chosen.indexOf(cid); return i >= 0 && i !== n - 1 ? i + 1 : 0; };
    if (!id) {
      const g = groupsOf(assigned.ids, written);
      const chip = (cid, kind) => {
        const t = takenBy(cid);
        return (
          <button key={cid} type="button" className={"chip" + (kind === "required" ? " req" : "") + (t ? " taken" : "")} disabled={!!t} onClick={() => set(F.concept(n), cid)}>
            <span className="cn">{nameOf(cid)}</span>
            {t ? <small>{"Concept " + t}</small> : kind === "required" ? <small>{copy.say("required")}</small> : null}
          </button>
        );
      };
      body = (
        <section className="pg">
          <div className="cap">{"Concept " + n + " of 6"}</div>
          <Words k="chooseHead" copy={copy} editing={editing} as="h1" className="h1" />
          {editBar}
          {g.required.length ? <><Words k="group.required" copy={copy} editing={editing} as="div" className="gh" /><div className="chips">{g.required.map(c => chip(c, "required"))}</div></> : null}
          {g.written.length ? <><Words k="group.written" copy={copy} editing={editing} as="div" className="gh" /><div className="chips">{g.written.map(c => chip(c, "written"))}</div></> : null}
          <Words k="group.rest" copy={copy} editing={editing} as="div" className="gh" />
          <div className="chips">{g.rest.map(c => chip(c, "rest"))}</div>
        </section>
      );
    } else {
      const ta = topicsAbout(topics, id);
      const la = lockerAbout(locker, id, name, classmates);
      const isReq = assigned.ids.includes(id);
      body = (
        <section className="pg">
          <div className="cap">{"Concept " + n + " of 6"}</div>
          <div className="picked">
            <span className={"chip on" + (isReq ? " req" : "")}><span className="cn">{nameOf(id)}</span>{isReq ? <small>{copy.say("required")}</small> : null}</span>
            <button type="button" className="lnk" onClick={() => set(F.concept(n), "")}>{copy.say("change")}</button>
          </div>
          <h1 className="h1">{nameOf(id)}</h1>
          {editBar}
          {ta.length || la.length ? (
            <>
              <Words k="beforeHead" copy={copy} editing={editing} as="h2" className="h2 badge" />
              <div className="sum">
                {ta.map(t => (
                  <div key={t.slot} className="src">
                    <div className="sh">Concepts in Team Communication</div>
                    {TOPIC_PARTS.map(p => t[p.field].length ? <div key={p.field} className="sr"><dt>{p.box}</dt><dd>{t[p.field].map((l, i) => <p key={i}>{l}</p>)}</dd></div> : null)}
                  </div>
                ))}
                {la.map(w => (
                  <div key={w.week} className="src">
                    <div className="sh">{"Locker Room, week " + w.n + ", the " + w.team}</div>
                    <div className="sr"><dt>What happened</dt><dd>{w.happened}</dd></div>
                    {w.chose ? <div className="sr"><dt>What you chose</dt><dd>{w.chose}</dd></div> : null}
                    {w.wrote ? <div className="sr"><dt>What you wrote</dt><dd>{w.wrote}</dd></div> : null}
                    {w.source ? <div className="sr"><dt>Your source</dt><dd>{w.source}</dd></div> : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
          <label className="field">
            <Words k="define" copy={copy} editing={editing} as="span" className="lb" />
            <textarea className="fld" rows={4} value={answers[F.define(id)] || ""} readOnly={readOnly} maxLength={4000} onChange={e => set(F.define(id), e.target.value)} />
          </label>
          <label className="field">
            <Words k="why" copy={copy} editing={editing} as="span" className="lb" />
            <textarea className="fld" rows={4} value={answers[F.why(id)] || ""} readOnly={readOnly} maxLength={4000} onChange={e => set(F.why(id), e.target.value)} />
          </label>
          {[1, 2].map(i => (
            <label key={i} className="field">
              <span className="lb"><Words k="guideline" copy={copy} editing={editing} as="span" /> {i}: {editing ? <Words k="guidelineAsk" copy={copy} editing as="span" /> : copy.say("guidelineAsk").replace("{topic}", nameOf(id).toLowerCase())}</span>
              <textarea className="fld" rows={3} value={answers[F["guide" + i](id)] || ""} readOnly={readOnly} maxLength={4000} onChange={e => set(F["guide" + i](id), e.target.value)} />
            </label>
          ))}
          <label className="field">
            <Words k="more" copy={copy} editing={editing} as="span" className="lb" />
            <textarea className="fld" rows={3} value={answers[F.more(id)] || ""} readOnly={readOnly} maxLength={4000} onChange={e => set(F.more(id), e.target.value)} />
          </label>
          <Words k="previewHead" copy={copy} editing={editing} as="h2" className="h2" />
          <div className="paper"><Chapter ch={guideOf(answers)[n - 1]} copy={copy} /></div>
          <p><button type="button" className="btn primary" onClick={() => go(nextPage)}>{copy.say("next") + (n < 6 ? " to Concept " + (n + 1) : "")}</button></p>
        </section>
      );
    }
  } else if (page === "questions") {
    body = (
      <section className="pg">
        <Words k="qHead" copy={copy} editing={editing} as="h1" className="h1" />
        {editBar}
        <Words k="qAsk" copy={copy} editing={editing} as="p" className="p lead" />
        {[1, 2].map(i => (
          <label key={i} className="field">
            <span className="lb">{"Question " + i}</span>
            <textarea className="fld" rows={3} value={answers[F.q(i)] || ""} readOnly={readOnly} maxLength={2000} onChange={e => set(F.q(i), e.target.value)} />
          </label>
        ))}
        <p><button type="button" className="btn primary" onClick={() => go("guide")}>{copy.say("next") + " to " + copy.say("nav.guide")}</button></p>
      </section>
    );
  } else {
    const say = submitted && !handing ? <>Handed in <b>{when(submitted)}</b>. {copy.say("keepEditing")}</>
      : handing === "missing" && left.length ? <span className="bad">Not yet: {left.join("; ")}.</span>
      : handing === "unsaved" ? <span className="bad">Your guide is not saved yet, so the hand-in did not go through. Try again in a moment.</span>
      : handing === "failed" ? <span className="bad">The hand-in did not go through. Check your connection and try again.</span>
      : left.length ? <>{left.length === 1 ? "One thing is" : left.length + " things are"} still missing.</> : <>Everything is in.</>;
    body = (
      <section className="pg">
        <Words k="guideHead" copy={copy} editing={editing} as="h1" className="h1" />
        {editBar}
        {!readOnly ? (
          <div className="bar">
            <button type="button" className="btn primary" disabled={handing === "sending"} onClick={handIn}>{handing === "sending" ? "Handing in…" : submitted ? copy.say("handInAgain") : copy.say("handIn")}</button>
            <button type="button" className="btn" onClick={() => { try { window.print(); } catch { /* fine */ } }}>{copy.say("print")}</button>
            <button type="button" className="btn" onClick={() => { try { navigator.clipboard.writeText(plainOf(answers, shown)); } catch { /* fine */ } }}>{copy.say("copy")}</button>
            <span className="say" aria-live="polite">{say}</span>
          </div>
        ) : null}
        <Printout answers={answers} name={shown} assigned={assigned.ids} onGo={readOnly ? null : go} copy={copy} />
      </section>
    );
  }

  return (
    <div {...root}>
      <style>{CSS}</style>
      <div className="sheet">
        {nav}
        {body}
        {!readOnly ? <div className="foot"><span className={"status" + (status === "retrying" || status === "failed-load" ? " bad" : "")} aria-live="polite">{STATUS[status]}</span></div> : null}
      </div>
    </div>
  );
}

const sayOf = (copy, k, fallback) => (copy ? copy.say(k) : fallback);
function Chapter({ ch, onGo, copy = null }) {
  if (!ch) return null;
  const empty = !ch.id || !(ch.define || ch.why || ch.guide1 || ch.guide2 || ch.more);
  const line = (label, text) => text ? <p className="ln"><b>{label}:</b> {text}</p> : null;
  return (
    <div className="ch">
      <div className="cht">{ch.name || "Concept " + ch.n}{onGo ? <button type="button" className="lnk small" onClick={() => onGo("c" + ch.n)}>{ch.id ? "Change" : "Add"}</button> : null}</div>
      {empty ? <p className="muted">Not written yet.</p> : (
        <>
          {line(sayOf(copy, "read.define", "Definition"), ch.define)}
          {line(sayOf(copy, "read.why", "Why it matters"), ch.why)}
          {line(sayOf(copy, "read.guideline", "Guideline") + " 1", ch.guide1)}
          {line(sayOf(copy, "read.guideline", "Guideline") + " 2", ch.guide2)}
          {line(sayOf(copy, "read.more", "Anything else"), ch.more)}
        </>
      )}
    </div>
  );
}

/** The guide read back whole: the cover, the contents, every chapter, the two questions. */
export function Printout({ answers, name, assigned = [], onGo = null, copy = null, term = "COMM 118, Fall 2026" }) {
  const chapters = guideOf(answers);
  const q1 = String(answers[F.q(1)] || "").trim(), q2 = String(answers[F.q(2)] || "").trim();
  return (
    <div className="paper book">
      <div className="cover"><div className="cv1">Culture Guide</div><div className="cv3">{[name, term].filter(Boolean).join(" · ")}</div></div>
      <div className="toc">
        {chapters.map(ch => <div key={ch.n} className="tocr"><span>{ch.n}</span>{ch.name || "Concept " + ch.n}<em>{[assigned.includes(ch.id) ? "Required" : "", ch.id && filledOf(answers, ch.id) === BOXES ? "Written" : "Not written yet"].filter(Boolean).join(" · ")}</em></div>)}
        <div className="tocr"><span /> Two questions for my sit-down<em>{q1 && q2 ? "Written" : "Not written yet"}</em></div>
      </div>
      {chapters.map(ch => <Chapter key={ch.n} ch={ch} onGo={onGo} copy={copy} />)}
      <div className="ch">
        <div className="cht">Two questions for my sit-down{onGo ? <button type="button" className="lnk small" onClick={() => onGo("questions")}>{q1 || q2 ? "Change" : "Add"}</button> : null}</div>
        {q1 || q2 ? <>{q1 ? <p className="ln"><b>Question 1:</b> {q1}</p> : null}{q2 ? <p className="ln"><b>Question 2:</b> {q2}</p> : null}</> : <p className="muted">Not written yet.</p>}
      </div>
    </div>
  );
}

/** The guide as plain text, for Copy. */
export function plainOf(answers, name) {
  const lines = ["Culture Guide", name, ""];
  guideOf(answers).forEach(ch => {
    lines.push(ch.n + ". " + (ch.name || "Concept " + ch.n));
    if (ch.define) lines.push("Definition: " + ch.define);
    if (ch.why) lines.push("Why it matters: " + ch.why);
    if (ch.guide1) lines.push("Guideline 1: " + ch.guide1);
    if (ch.guide2) lines.push("Guideline 2: " + ch.guide2);
    if (ch.more) lines.push("Anything else: " + ch.more);
    lines.push("");
  });
  lines.push("Two questions for my sit-down");
  [1, 2].forEach(i => { const q = String(answers[F.q(i)] || "").trim(); if (q) lines.push(i + ". " + q); });
  return lines.join("\n");
}

/** The worksheet registry's mount: React inside the plain-DOM contract. */
export function mountCultureGuide(root, { store, viewer, readOnly = false, classId, storageKey, editor = false, theme, classmates = [], topicsStore = null, lockerStore = null } = {}) {
  const r = createRoot(root);
  r.render(<CultureGuide store={store} viewer={viewer} readOnly={readOnly} classId={classId} storageKey={storageKey} editor={editor && !readOnly} theme={theme} classmates={classmates} topicsStore={topicsStore} lockerStore={lockerStore} />);
  return { destroy() { r.unmount(); } };
}

// The Skylight look of the sit-down pages: Fraunces for headings, Source Sans
// 3 for everything else, seaglass accent, one white sheet. Day and night.
const LIGHT = `--page:#f3f4f1;--card:#ffffff;--sunk:#eef2f0;--ink:#22302f;--ink2:#586864;--line:#dfe6e3;--accent:#27756a;--accent-tint:#e2f0ec;--on-accent:#ffffff;--ok:#0f766e;--bad:#b45309;--req:#b4541a;--req-tint:#fbe9dd`;
const DARK = `color-scheme:dark;--page:#121716;--card:#1e2624;--sunk:#252e2c;--ink:#edf2f0;--ink2:#a3b1ad;--line:#2c3634;--accent:#7fd0c0;--accent-tint:#1f3531;--on-accent:#161c1b;--ok:#5fd3c1;--bad:#f0b35a;--req:#f0a070;--req-tint:#3a2a20`;
export const CSS = `
.cg{${LIGHT};--serif:'Fraunces',Georgia,serif;--sans:'Source Sans 3',system-ui,sans-serif}
@media (prefers-color-scheme: dark){.cg:not([data-theme="light"]){${DARK}}}
.cg[data-theme="dark"]{${DARK}}
.cg{box-sizing:border-box;color:var(--ink);font-family:var(--sans);font-size:18px;line-height:1.5;background:var(--page);padding:16px 16px 64px}
.cg *{box-sizing:border-box}
.cg .sheet{max-width:920px;margin:0 auto;background:var(--card);border-radius:18px;border:1px solid var(--line)}
.cg .nav{position:sticky;top:var(--cg-top,0px);z-index:5;display:flex;gap:4px;overflow-x:auto;padding:10px 14px;background:var(--card);border-bottom:1px solid var(--line);border-radius:18px 18px 0 0;scrollbar-width:none}
.cg .ni{font:inherit;font-size:14px;font-weight:600;white-space:nowrap;padding:8px 12px;min-height:36px;border-radius:999px;border:1px solid transparent;background:transparent;color:var(--ink2);cursor:pointer}
.cg .ni.done{color:var(--ok)}
.cg .ni.done::before{content:"✓ ";font-size:12px}
.cg .ni.ph{color:var(--ink2);border-style:dashed;border-color:var(--line);opacity:.8}
.cg .ni.cur{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.cg .pg{display:grid;gap:16px;padding:28px 32px 32px;justify-items:start}
.cg .pg>*{max-width:100%}
.cg .cap{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.cg .h1{margin:0;font-family:var(--serif);font-size:clamp(32px,5vw,44px);font-weight:500;line-height:1.08;letter-spacing:-.02em;text-wrap:balance}
.cg .h2{margin:8px 0 0;font-family:var(--serif);font-size:25px;font-weight:500;line-height:1.2}
.cg .h2.badge{font-family:var(--sans);font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ok);background:var(--accent-tint);border-radius:999px;padding:6px 12px}
.cg .credit{margin:0;font-size:15px;color:var(--ink2)}
.cg .p{margin:0;max-width:68ch;white-space:pre-line}
.cg .p.lead{font-family:var(--serif);font-size:21px;line-height:1.45;color:var(--ink)}
.cg .faq{margin:0;display:grid;gap:10px;width:100%}
.cg .qa{display:grid;grid-template-columns:minmax(180px,260px) 1fr;gap:6px 18px;padding:12px 16px;border-radius:12px;background:var(--sunk)}
.cg .qa dt{font-family:var(--serif);font-size:19px;font-weight:500}
.cg .qa dd{margin:0}
.cg .qa a,.cg .lnk{color:var(--accent);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px}
.cg .lnk{font:inherit;background:none;border:0;padding:0;cursor:pointer;min-height:44px}
.cg .lnk.small{font-size:14px;font-weight:600;min-height:0;margin-left:12px}
.cg .gh{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);margin-top:2px}
.cg .chips{display:flex;flex-wrap:wrap;gap:6px;width:100%}
.cg .chip{font:inherit;font-size:15px;display:inline-flex;align-items:center;gap:8px;text-align:left;padding:0 13px;min-height:38px;border-radius:999px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;line-height:1.2}
.cg .chip:hover:not(:disabled){border-color:var(--accent)}
.cg .chip .cn{font-weight:600}
.cg .chip small{font-size:12px;color:var(--ink2);white-space:nowrap;letter-spacing:.04em;text-transform:uppercase}
.cg .chip.req{border-color:var(--req);background:var(--req-tint)}
.cg .chip.req small{color:var(--req);font-weight:600}
.cg .chip.taken{opacity:.45;cursor:default}
.cg .chip.on{border-color:var(--accent);background:var(--accent-tint);cursor:default}
.cg .chip.on.req{border-color:var(--req);background:var(--req-tint)}
.cg .picked{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center}
.cg .sum{display:grid;gap:14px;width:100%;padding:16px 18px;border-radius:12px;background:var(--sunk)}
.cg .src{display:grid;gap:6px}
.cg .sh{font-family:var(--serif);font-size:19px;font-weight:500;padding-bottom:4px;border-bottom:1px solid var(--line)}
.cg .sr{display:grid;grid-template-columns:140px 1fr;gap:4px 16px;align-items:baseline}
.cg .sr dt{font-size:15px;font-weight:600;color:var(--ink2)}
.cg .sr dd{margin:0}
.cg .sr dd p{margin:0 0 4px}
.cg .field{display:grid;gap:6px;width:100%;max-width:72ch}
.cg .lb{font-weight:600;font-size:18px}
.cg .hint{font-size:15px;color:var(--ink2)}
.cg .fld{font:inherit;font-size:17px;line-height:1.5;width:100%;padding:12px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);resize:vertical;min-height:72px}
.cg .fld:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.cg .btn{font:inherit;font-size:16px;font-weight:600;min-height:44px;padding:0 20px;border-radius:999px;border:2px solid var(--accent);background:var(--card);color:var(--accent);cursor:pointer}
.cg .btn.primary{background:var(--accent);color:var(--on-accent)}
.cg .btn.small{min-height:36px;padding:0 14px;font-size:14px}
.cg .btn[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--card)}
.cg .btn[disabled]{opacity:.4;cursor:default}
.cg .editbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.cg .bar{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;width:100%}
.cg .say{font-size:16px;color:var(--ink2);flex:1;min-width:200px}
.cg .say b{color:var(--ink)}
.cg .bad{color:var(--bad)}
.cg .status{font-size:14px;color:var(--ink2)}
.cg .status.bad{color:var(--bad)}
.cg .foot{padding:8px 32px 20px;display:flex;justify-content:flex-end}
.cg .muted{color:var(--ink2);margin:0}
.cg .paper{width:100%;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px 26px;display:grid;gap:14px}
.cg .paper.book{padding:32px 36px;gap:22px}
.cg .cover{display:grid;gap:6px;padding-bottom:18px;border-bottom:2px solid var(--ink)}
.cg .cv1{font-family:var(--serif);font-size:40px;font-weight:500;line-height:1.05;letter-spacing:-.02em}
.cg .cv3{font-size:16px;color:var(--ink2)}
.cg .toc{display:grid;gap:4px}
.cg .tocr{display:grid;grid-template-columns:28px 1fr auto;gap:10px;align-items:baseline;font-size:17px;padding:4px 0;border-bottom:1px dotted var(--line)}
.cg .tocr span{font-family:var(--serif);color:var(--accent)}
.cg .tocr em{font-style:normal;font-size:14px;color:var(--ink2)}
.cg .ch{display:grid;gap:8px}
.cg .cht{font-family:var(--serif);font-size:24px;font-weight:500;line-height:1.2;display:flex;align-items:baseline;flex-wrap:wrap}
.cg .ln{margin:0;font-size:17px;line-height:1.5}
.cg .ln b{font-weight:600;color:var(--accent)}
.cg .vsp-edit{display:block;width:100%;font:inherit;color:inherit;line-height:1.5;padding:4px 8px;margin:0;border:1.5px dashed var(--line);border-radius:8px;background:var(--card);resize:none;overflow:hidden}
.cg .vsp-edit.h1{font-family:var(--serif);font-size:clamp(32px,5vw,44px);font-weight:500}
.cg .vsp-edit.h2{font-family:var(--serif);font-size:25px}
.cg .vsp-edit.lead{font-family:var(--serif);font-size:21px}
@media (max-width:720px){.cg{padding:8px 8px 48px}.cg .pg{padding:20px 16px 24px}.cg .qa{grid-template-columns:1fr}.cg .sr{grid-template-columns:1fr}.cg .paper.book{padding:20px}.cg .foot{padding-inline:16px}}
@media print{.cg{background:#fff;padding:0}.cg .nav,.cg .bar,.cg .foot,.cg .editbar,.cg .lnk{display:none!important}.cg .sheet{border:0;max-width:none}.cg .paper.book{border:0;padding:0}.cg .ch{break-inside:avoid}}
`;
