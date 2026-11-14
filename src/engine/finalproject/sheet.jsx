// Final project preferences: the sheet a student fills in, in COMM 3 and
// COMM 118, at /<class>/worksheets/final-prefs. COMM 3's is due Thursday,
// November 19 (Andrew, 2026-11-14), and opens Tuesday, November 17.
//
// Andrew, 2026-11-13: "What do you want to work on in this class? What's your
// work preference? Who do you potentially want to work with?" Three topics
// with the questions each raises, three sites they like and what to borrow
// from each, their strengths, one of four work preferences, and the people
// they would work with, picked from faces. The questions are his words,
// spelling fixed, and every line is his to edit in place.
//
// Nobody sees who picked them. The picks are answers on the student's own
// sheet, which only the student and the instructor can read.
//
// His decisions do not show here until he releases them: "Students should
// not see my decisions the moment I press. I think we're gonna release them
// all together." The sheet asks /api/final-project for the student's own
// part, which answers with nothing before the release.

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { authHeaders } from "../session.js";
import { gameClient } from "../gameClient.js";
import { useClassState } from "../store.js";
import { rosterOf, nameShown } from "../roster.js";
import { sectionOf, hasSections } from "../sections.js";
import { ENGINE } from "../../config/registry.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { CSS, STATUS, when, blank, linesOf, useSheet, handIn, handSay, Lines, Choices, Line, Para } from "../audiostory/bits.jsx";
import * as M from "./model.js";

export const prefsHref = (classId) => "/" + classId + "/worksheets/" + M.FINAL_PREFS_KEY;
export const copyRow = (classId) => "worksheet-final-prefs-" + (classId || "class") + "-plan";

const SHARED = {
  title: M.FINAL_PREFS_TITLE,
  topicAsk: "Topic",
  // Andrew, 2026-11-14, his questions with the joins written in.
  worthAsk: "Why do you think this topic is worthwhile for you to research?",
  audienceAsk: "What about it is going to be unique or interesting to your audience?",
  conceptsAsk: "What is one theory or concept you would explicate for your audience? Give a definition, and say where the definition comes from.",
  topicCol: "Topic",
  askAsk: "What are the kind of questions you would ask about this topic that are interesting to dive into?",
  sitesHead: "Besides social media, what are sites that you like?",
  sitesIntro: "We're looking to build something that is interesting to the audience. Think about the sites you like to go to. For example, I like Wikipedia. Why? Because it has a lot of links, and I learn a lot.",
  siteAsk: "The site",
  likeAsk: "What do you like about the site?",
  buildAsk: "How could you build that into your page?",
  strengthsHead: "What are your strengths?",
  strengthsIntro: "Building a great page involves lots of potential skills.",
  workHead: "Is your preference to work individually or in a pair?",
  workHint: "I will only put you in a pair if you choose pair, you get matched up with somebody who also chooses you, and I feel that it's appropriate given what you've done so far in class.", // voice-ok, his words
  topAsk: "Who is the person you would most like to work with?",
  alsoAsk: "Who are the additional people that you would be excited to work with?",
  submit: "submit preferences",
  again: "submit again",
  pairSay: "You're working in a pair with",
  soloSay: "You're working individually.",
  approvedSay: "Approved",
  lockedSay: "The due date has passed, so the sheet is closed.",
};
// The two classes make different things. Andrew, 2026-11-13: COMM 3 is "a
// multimedia story" and "they have to do something about social justice";
// COMM 118 is "an exploration" of a topic in communication and sport. COMM
// 3's example topics are Claude's, offered for him to edit; COMM 118's are his.
const BY_CLASS = {
  comm3: {
    credit: "COMM 3. Due Thursday, November 19, at 11:59 PM.",
    intro: "Your final project is a multimedia story about social justice.",
    // Andrew, 2026-11-14, his words with the joins written in.
    defineHead: "Define social justice.",
    defineHint: "Use an academic definition, not something from a random site.",
    defineAsk: "The definition",
    sourceAsk: "The academic source the definition comes from",
    // Andrew, 2026-11-13, his words.
    pastSay: "These are things you've done previously. You're not going to work on any of these topics. Think about something you like as much as these topics.", // voice-ok, his words
    topicHead: "What do you want to work on in this class?",
    topicHint: "Examples: housing, food access, immigration, disability access, environmental justice, education, health care, voting rights.",
    whyAsk: "Why do you think this idea is interesting?",
    angleAsk: "What angle will you take to have a unique and engaging story?",
    justiceAsk: "How does this idea qualify as a social justice topic?",
  },
  comm118: {
    credit: "COMM 118. Due Thursday, November 19, at 11:59 PM.",
    intro: "Your final project is an exploration of a topic in communication and sport.",
    topicHead: "What do you want to work on in this class?",
    topicAsk: "Your question",
    topicHint: "Your topic will be a question at the intersection of communication and sport.",
    examplesHead: "Example topics",
    interestsSay: "Here are three or four topics you seemed to be interested in this year. You are welcome to continue with one of these topics, but you're not required to.", // voice-ok, his words
    conceptsHint: "Within your multimedia project, you will explicate at least three concepts or theories for your audience through a definition, real-life examples and hypothetical examples.",
  },
};
export const defaultCopy = (classId) => ({ ...SHARED, ...(BY_CLASS[classId] || BY_CLASS.comm118) });

const initials = (name) => String(name || "").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

function FaceGrid({ label, people, picked, readOnly, onToggle }) {
  return (
    <div className="fpp-faces" role="group" aria-label={label}>
      {people.map(p => {
        const on = picked.includes(p.name);
        return (
          <button key={p.name} type="button" className={"fpp-face focusable" + (on ? " on" : "")} aria-pressed={on} disabled={readOnly} onClick={() => onToggle(p.name)}>
            <span className="fpp-pic">{p.photo ? <img src={p.photo} alt="" /> : initials(p.shown)}</span>
            <span className="fpp-name">{p.shown}</span>
          </button>
        );
      })}
    </div>
  );
}

// A paragraph box that grows with its words, so a long answer is never cut
// off on a phone. Para's markup and classes, with the height set from the text.
function Grow({ id, label, value, readOnly, onChange, rows = 3, max = 2000 }) {
  const fit = (el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + 3 + "px"; } };
  return <textarea ref={fit} className="para focusable" id={id} value={value || ""} readOnly={readOnly} maxLength={max} rows={rows} aria-label={label} onChange={e => onChange(e.target.value)} />;
}

/** The student's own part of the decisions, once released: null before. */
function useMine(classId, viewerId, readOnly) {
  const [mine, setMine] = useState(null);
  useEffect(() => {
    if (!classId || !viewerId) return undefined;
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/final-project?class=" + encodeURIComponent(classId) + "&mine=1", { headers: await authHeaders() });
        const out = r.ok ? await r.json().catch(() => null) : null;
        if (alive && out?.released && out.mine) setMine(out.mine);
      } catch { /* nothing released to show */ }
    })();
    return () => { alive = false; };
  }, [classId, viewerId, readOnly]);
  return mine;
}

// What the student made earlier this term, read from their own sheets: the
// visual story, the audio story exercise and the audio story. Andrew,
// 2026-11-13: "These are things you've done previously." A student's browser
// reads only its own rows, and a sheet with no topic line is left out.
const PAST = [
  ["Visual story", ["visual-story", "visual-pre"], "headline"],
  ["Audio story exercise", ["audio-research"], "story"],
  ["Audio story", ["audio-story"], "headline"],
];
async function pastLine({ classId, viewerId, keys, field }) {
  for (const key of keys) {
    const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", key).eq("group_key", classId).eq("viewer_id", viewerId);
    const id = s.data && s.data[0] && s.data[0].id;
    if (!id) continue;
    const r = await gameClient.from("worksheet_answers").select("value,position").eq("sheet_id", id).eq("field", field).order("position");
    const say = (r.data || []).map(x => x.value).join("").trim();
    if (say) return say;
  }
  return "";
}
function usePast(classId, viewerId, on) {
  const [past, setPast] = useState([]);
  useEffect(() => {
    if (!on || !classId || !viewerId) return undefined;
    let alive = true;
    (async () => {
      try {
        const got = await Promise.all(PAST.map(([, keys, field]) => pastLine({ classId, viewerId, keys, field })));
        if (alive) setPast(PAST.map(([what], i) => ({ what, say: got[i] })).filter(x => x.say));
      } catch { /* nothing earlier to show */ }
    })();
    return () => { alive = false; };
  }, [classId, viewerId, on]);
  return past;
}

// The due date, which the database enforces: worksheet_locked() refuses every
// save and submit once now() is past the worksheet_deadlines row, unless a
// worksheet_unlocks row lets the student through. Andrew, 2026-11-14: "lock on
// thursday." The page reads the same two rows so the sheet says the sheet is
// closed and stops taking typing the database would refuse.
function useLocked(classId, viewerId, skip) {
  const [lock, setLock] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (skip || !classId || !viewerId) return undefined;
    let alive = true;
    (async () => {
      try {
        const d = await gameClient.from("worksheet_deadlines").select("due_at").eq("worksheet_key", M.FINAL_PREFS_KEY).eq("group_key", classId);
        const due = d.data && d.data[0] ? d.data[0].due_at : null;
        if (!due) return;
        const s = await gameClient.from("worksheet_sheets").select("id").eq("worksheet_key", M.FINAL_PREFS_KEY).eq("group_key", classId).eq("viewer_id", viewerId);
        const id = s.data && s.data[0] && s.data[0].id;
        let until = null;
        if (id) { const u = await gameClient.from("worksheet_unlocks").select("until").eq("sheet_id", id); until = u.data && u.data[0] ? u.data[0].until : null; }
        if (alive) setLock({ due, until });
      } catch { /* no lock read: the database still refuses a late save */ }
    })();
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => { alive = false; clearInterval(t); };
  }, [classId, viewerId, skip]);
  return !!(lock && now > Date.parse(lock.due) && !(lock.until && Date.parse(lock.until) > now));
}

export function PrefsSheet({ store, viewer, classId, storageKey, readOnly: given = false, storage, editor = false, theme, classmates = [], photos = {} }) {
  const copy = useCopy(editor, copyRow(classId), defaultCopy(classId));
  const [editing, setEditing] = useState(false);
  const [handing, setHanding] = useState("");
  // COMM 118 writes one topic at a time: the topic on the page.
  const [slot, setSlot] = useState(M.SLOTS[0]);
  const composer = useRef(null);
  const [data] = useClassState(storageKey || "");
  const draftKey = M.FINAL_PREFS_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
  const { answers, set, submitted, setSubmitted, status, saver } = useSheet({ store, draftKey, readOnly: given, storage });
  const mine = useMine(classId, viewer?.id, given);
  const locked = useLocked(classId, viewer?.id, given);
  const past = usePast(classId, viewer?.id, M.isJustice(classId));
  const readOnly = given || locked;

  const root = { className: "as fpp" + (M.isJustice(classId) ? "" : " fps") + (readOnly ? " ro" : ""), "data-theme": theme || undefined };
  if (!answers) return <div {...root}><style>{CSS + EXTRA}</style><div className="sheet"><div className="foot"><span className="status">{STATUS[status] || "Loading…"}</span></div></div></div>;

  // Classmates in the student's own section: a pair never crosses sections.
  const config = ENGINE[classId] || null;
  const roster = config ? rosterOf(config, data) : [];
  const me = roster.find(s => String(s.email || "").trim().toLowerCase() === viewer?.id) || null;
  const mySection = me ? sectionOf(me) : "";
  const sectionOfName = new Map(roster.map(s => [s.name, sectionOf(s)]));
  const people = classmates
    .filter(n => !(config && hasSections(config) && mySection) || sectionOfName.get(n) === mySection)
    .map(n => ({ name: n, shown: nameShown(data, n), photo: photos[n] || "" }))
    .sort((x, y) => x.shown.localeCompare(y.shown));
  const shownOf = (n) => nameShown(data, n);

  const also = linesOf(answers.also);
  const setWork = (id) => { set("work", id); if (!M.picksPartner(id)) { if (answers.top) set("top", ""); if (answers.also) set("also", ""); } };
  const setTop = (n) => { set("top", answers.top === n ? "" : n); if (also.includes(n)) set("also", also.filter(x => x !== n).join("\n")); };
  const toggleAlso = (n) => set("also", (also.includes(n) ? also.filter(x => x !== n) : [...also, n]).join("\n"));
  const justice = M.isJustice(classId);
  const left = M.missingOf(answers, classId);
  const need = M.requiredCount(answers, classId);
  const ideaDone = (s) => (justice ? ["topic", ...M.IDEA_PARTS] : ["topic", ...M.SPORT_PARTS, "ask"]).every(f => !blank(answers, f + ":" + s));
  const say = handSay(handing, left) || (submitted ? <>Submitted <b>{when(submitted)}</b>.</> : <><b>{need - left.length} of {need}</b> answered</>);
  const approved = new Set((mine?.topics || []).map(t => t.slot));
  // COMM 118's topics, one on the page at a time, so each question is written
  // once. Andrew, 2026-11-14, on five questions repeated in three boxes:
  // "please make it less repetitive", then on a grid of plain boxes: "this is
  // not pretty. look at how we did things in the past." So: three tabs that
  // fill as a topic does (the progress pills of the earlier sheets), the
  // questions once under them, and beside them the three topics read back as
  // they are typed, the way the Culture Guide and the audio pre-production do.
  const TOPIC_Q = [["topicAsk", "topic"], ["worthAsk", "worth"], ["audienceAsk", "audience"], ["conceptsAsk", "concepts"], ["askAsk", "ask"]];
  const doneIn = (s) => TOPIC_Q.filter(([, f]) => !blank(answers, f + ":" + s)).length;
  const needs = handing === "missing";
  const topicName = (i) => copy.say("topicCol") + " " + (i + 1);
  const goTopic = (s) => { setSlot(s); try { composer.current?.scrollIntoView({ block: "start", behavior: "smooth" }); } catch { /* stays put */ } };
  const submit = () => {
    const missing = M.missingOf(answers, classId);
    if (!justice && missing.length) { const first = M.SLOTS.find(s => doneIn(s) < TOPIC_Q.length); if (first && doneIn(slot) === TOPIC_Q.length) setSlot(first); }
    handIn({ saver, store, missing, setHanding, setSubmitted });
  };
  // A topic from the student's own list drops into the first open question.
  const interests = justice ? [] : M.interestsOf(data, me?.name);
  const heldBy = (t) => M.SLOTS.find(s => String(answers["topic:" + s] || "").trim() === t) || "";
  const roomFor = blank(answers, "topic:" + slot) ? slot : M.SLOTS.find(s => blank(answers, "topic:" + s)) || "";
  const pickInterest = (t) => {
    const held = heldBy(t);
    if (held) { set("topic:" + held, ""); return; }
    if (!roomFor) return;
    set("topic:" + roomFor, t);
    setSlot(roomFor);
  };
  const read = M.readAnswers(answers);
  const at = M.SLOTS.indexOf(slot);
  const topics118 = justice ? null : (
    <section className="part fpt-part">
      <div className="phead"><Words k="topicHead" copy={copy} editing={editing} className="n" /><span className="sub">{M.SLOTS.filter(ideaDone).length} of 3</span></div>
      <Words k="topicHint" copy={copy} editing={editing} as="p" className="fpt-lead" />
      {interests.length || editing ? (
        <div className="fpp-mine">
          <Words k="interestsSay" copy={copy} editing={editing} as="p" className="fpp-minesay" />
          {interests.length ? (
            <div className="fpt-picks">
              {interests.map(t => {
                const on = !!heldBy(t);
                return readOnly ? <span key={t} className={"fpt-pick" + (on ? " on" : "")}><i aria-hidden="true">{on ? "✓" : ""}</i>{t}</span> : (
                  <button key={t} type="button" className={"fpt-pick focusable" + (on ? " on" : "")} aria-pressed={on} disabled={!on && !roomFor} onClick={() => pickInterest(t)}>
                    <i aria-hidden="true">{on ? "✓" : "+"}</i>{t}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="fpp-eg">
        <Words k="examplesHead" copy={copy} editing={editing} as="p" className="fpp-egh" />
        <div className="fpp-egs">
          {M.EXAMPLES_118.map((g, n) => (
            <div key={g.area} className={"fpp-egg fpp-eg" + n}>
              <p className="fpp-ega">{g.area}</p>
              <ul>{g.topics.map(t => <li key={t.say}>{t.say}{t.by ? <span className="fpp-egby">{t.by}, Spring 2026</span> : null}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      {copy.say("conceptsHint") ? <Words k="conceptsHint" copy={copy} editing={editing} as="p" className="fpt-note" /> : null}
      <div className="fpt" ref={composer}>
        <div className="fpt-main">
          <div className="fpt-tabs" role="tablist" aria-label={copy.say("topicHead")}>
            {M.SLOTS.map((s, i) => {
              const n = doneIn(s), on = s === slot, full = n === TOPIC_Q.length;
              return (
                <button key={s} type="button" role="tab" id={"fp-tab-" + s} aria-selected={on} aria-controls="fp-topic-panel" aria-label={topicName(i) + ", " + n + " of " + TOPIC_Q.length}
                  className={"fpt-tab focusable fpt-" + s + (on ? " on" : "") + (full ? " done" : "") + (needs && !full ? " need" : "")} onClick={() => setSlot(s)}>
                  <span className="fpt-badge" aria-hidden="true">{full ? "✓" : i + 1}</span>
                  <span className="fpt-tabsay"><span className="fpt-tabn">{topicName(i)}</span><span className="fpt-tabq">{read.topics[i].topic}</span></span>
                  <span className="fpt-meter" aria-hidden="true"><i style={{ width: (n / TOPIC_Q.length) * 100 + "%" }} /></span>
                </button>
              );
            })}
          </div>
          <div key={slot} className={"fpt-panel fpt-" + slot} role="tabpanel" id="fp-topic-panel" aria-labelledby={"fp-tab-" + slot}>
            {editing || approved.has(slot) || mine?.says?.[slot]?.length ? (
              <div className="fpt-ph">
                {editing ? <span className="fpt-phn"><Words k="topicCol" copy={copy} editing={editing} /></span> : null}
                {approved.has(slot) ? <span className="mark ok">{copy.say("approvedSay")}</span> : null}
                {mine?.says?.[slot]?.length ? <ul className="reasons close">{mine.says[slot].map(r => <li key={r}>{r}</li>)}</ul> : null}
              </div>
            ) : null}
            {TOPIC_Q.map(([k, f]) => {
              const field = f + ":" + slot, id = "fp-" + f + "-" + slot, label = copy.say(k) + " " + topicName(at), v = answers[field];
              return (
                <div key={f} className={"fpt-f fpt-f-" + f + (needs && blank(answers, field) ? " need" : "")}>
                  <Words k={k} copy={copy} editing={editing} className="fpt-ask" />
                  {f === "topic" ? <Grow id={id} label={label} value={v} readOnly={readOnly} onChange={x => set(field, x.replace(/\n/g, " "))} rows={2} max={300} />
                    : f === "ask" ? <Lines id={id} label={label} value={v || ""} readOnly={readOnly} onChange={x => set(field, x)} />
                    : <Grow id={id} label={label} value={v} readOnly={readOnly} onChange={x => set(field, x)} rows={3} max={2000} />}
                </div>
              );
            })}
            <div className="fpt-nav">
              {at > 0 ? <button type="button" className="fpt-go focusable" onClick={() => goTopic(M.SLOTS[at - 1])}><span aria-hidden="true">←</span> {topicName(at - 1)}</button> : <span />}
              {at < M.SLOTS.length - 1 ? <button type="button" className="fpt-go focusable" onClick={() => goTopic(M.SLOTS[at + 1])}>{topicName(at + 1)} <span aria-hidden="true">→</span></button> : null}
            </div>
          </div>
        </div>
        <aside className="fpt-paper" aria-label={copy.say("topicHead")}>
          {read.topics.map((t, i) => (
            <section key={t.slot} className={"fpt-entry fpt-" + t.slot + (t.slot === slot ? " on" : "")}>
              <button type="button" className="fpt-eh focusable" aria-current={t.slot === slot ? "true" : undefined} onClick={() => setSlot(t.slot)}>
                <span className="fpt-dot" aria-hidden="true">{doneIn(t.slot) === TOPIC_Q.length ? "✓" : i + 1}</span>
                <span className="fpt-en">{topicName(i)}</span>
              </button>
              {t.topic ? <p className="fpt-rq">{t.topic}</p> : null}
              {t.worth ? <p className="fpt-rp">{t.worth}</p> : null}
              {t.audience ? <p className="fpt-rp">{t.audience}</p> : null}
              {t.concepts ? <p className="fpt-rc">{t.concepts}</p> : null}
              {t.asks.length ? <ul className="fpt-ra">{t.asks.map((l, k) => <li key={k}>{l}</li>)}</ul> : null}
            </section>
          ))}
        </aside>
      </div>
    </section>
  );
  // COMM 118's sites: the three questions once across the top, a row a site.
  const SITE_Q = [["siteAsk", "site", 300], ["likeAsk", "like", 600], ["buildAsk", "build", 600]];
  const sites118 = justice ? null : (
    <div className="fps-sites">
      <span className="fps-sh" />
      {SITE_Q.map(([k]) => <Words key={k} k={k} copy={copy} editing={editing} className="fps-sh" />)}
      {M.SLOTS.map((s, i) => [
        <span key={"n" + s} className="fps-sn" aria-hidden="true">{i + 1}</span>,
        ...SITE_Q.map(([k, f, max]) => {
          const field = f + ":" + s, label = copy.say(k) + (f === "site" ? " " : " Site ") + (i + 1);
          return (
            <div key={f + s} className={"fps-sc fps-sc-" + f + (needs && blank(answers, field) ? " need" : "")} data-q={copy.say(k)}>
              {f === "site" ? <Line id={"fp-" + f + "-" + s} label={label} value={answers[field]} readOnly={readOnly} onChange={v => set(field, v)} />
                : <Grow id={"fp-" + f + "-" + s} label={label} value={answers[field]} readOnly={readOnly} onChange={v => set(field, v.replace(/\n/g, " "))} rows={1} max={max} />}
            </div>
          );
        }),
      ])}
    </div>
  );

  return (
    <div {...root}>
      <style>{CSS + EXTRA}</style>
      <div className="sheet">
        <div className="head">
          <div className="title">
            <Words k="title" copy={copy} editing={editing} as="h2" className="name" />
            <Words k="credit" copy={copy} editing={editing} as="div" className="credit" />
            {editor ? (
              <div className="editbar">
                <button type="button" className="btn small" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
                <span className="status" aria-live="polite">{editing ? copy.status || "Change any line students read. Clear a line to put the original back." : copy.status}</span>
              </div>
            ) : null}
            <Words k="intro" copy={copy} editing={editing} as="p" className="intro" />
            {locked ? <p className="intro"><b><Words k="lockedSay" copy={copy} editing={editing} /></b>{submitted ? <> Submitted {when(submitted)}.</> : null}</p> : null}
          </div>
        </div>

        {mine ? (
          <section className="part fpp-result">
            {mine.place === "pair"
              ? <p className="fpp-place"><Words k="pairSay" copy={copy} editing={editing} /> <span className="fpp-pic">{photos[roster.find(s => String(s.email || "").toLowerCase() === mine.partner)?.name] ? <img src={photos[roster.find(s => String(s.email || "").toLowerCase() === mine.partner)?.name]} alt="" /> : null}</span><b>{shownOf(roster.find(s => String(s.email || "").toLowerCase() === mine.partner)?.name || mine.partner)}</b></p>
              : <p className="fpp-place"><Words k="soloSay" copy={copy} editing={editing} /></p>}
            <div className="chips">
              {[...(mine.topics || []), ...(mine.partnerTopics || [])].filter(t => t.topic).map((t, i) => <span key={i} className="mark ok">{t.topic}</span>)}
            </div>
          </section>
        ) : null}

        {justice ? (
          <section className="part">
            <div className="phead"><Words k="defineHead" copy={copy} editing={editing} className="n" /><span className="sub">{M.DEFINE_FIELDS.every(f => !blank(answers, f)) ? "✓" : ""}</span></div>
            <Words k="defineHint" copy={copy} editing={editing} as="p" className="hint" />
            <div className="field">
              <Words k="defineAsk" copy={copy} editing={editing} className="ask" />
              <Para id="fp-define" label={copy.say("defineAsk")} value={answers.define} readOnly={readOnly} onChange={v => set("define", v)} rows={4} max={2000} />
            </div>
            <label className="field">
              <Words k="sourceAsk" copy={copy} editing={editing} className="ask" />
              <Line id="fp-define-source" label={copy.say("sourceAsk")} value={answers.defineSource} readOnly={readOnly} onChange={v => set("defineSource", v)} max={600} />
            </label>
          </section>
        ) : null}

        {topics118 || (<section className="part">
          <div className="phead"><Words k="topicHead" copy={copy} editing={editing} className="n" /><span className="sub">{M.SLOTS.filter(ideaDone).length} of 3</span></div>
          <Words k="topicHint" copy={copy} editing={editing} as="p" className="hint" />
          {past.length || editing ? (
            <div className="fpp-past">
              <Words k="pastSay" copy={copy} editing={editing} as="p" className="fpp-pastsay" />
              {past.length ? <ul>{past.map(x => <li key={x.what}><span>{x.what}</span>{x.say}</li>)}</ul> : null}
            </div>
          ) : null}
          <div className="ideas">
            {M.SLOTS.map((s, i) => (
              <div key={s} className="box">
                {approved.has(s) ? <span className="mark ok">{copy.say("approvedSay")}</span> : null}
                {mine?.says?.[s]?.length ? <ul className="reasons close">{mine.says[s].map(r => <li key={r}>{r}</li>)}</ul> : null}
                <label className="field">
                  <Words k="topicAsk" copy={copy} editing={editing} className="ask" />
                  <Line id={"fp-topic-" + s} label={copy.say("topicAsk") + " " + (i + 1)} value={answers["topic:" + s]} readOnly={readOnly} onChange={v => set("topic:" + s, v)} />
                </label>
                {M.IDEA_PARTS.map(part => (
                  <div className="field" key={part}>
                    <Words k={part + "Ask"} copy={copy} editing={editing} className="ask" />
                    <Para id={"fp-" + part + "-" + s} label={copy.say(part + "Ask") + " Topic " + (i + 1)} value={answers[part + ":" + s]} readOnly={readOnly} onChange={v => set(part + ":" + s, v)} rows={3} max={2000} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>)}

        <section className="part">
          <div className="phead"><Words k="sitesHead" copy={copy} editing={editing} className="n" /><span className="sub">{M.SLOTS.filter(s => ["site:", "like:", "build:"].every(f => !blank(answers, f + s))).length} of 3</span></div>
          <Words k="sitesIntro" copy={copy} editing={editing} as="p" className="hint" />
          {sites118 || <div className="ideas">
            {M.SLOTS.map((s, i) => (
              <div key={s} className="box">
                <label className="field">
                  <Words k="siteAsk" copy={copy} editing={editing} className="ask" />
                  <Line id={"fp-site-" + s} label={copy.say("siteAsk") + " " + (i + 1)} value={answers["site:" + s]} readOnly={readOnly} onChange={v => set("site:" + s, v)} />
                </label>
                <label className="field">
                  <Words k="likeAsk" copy={copy} editing={editing} className="ask" />
                  <Line id={"fp-like-" + s} label={copy.say("likeAsk") + " Site " + (i + 1)} value={answers["like:" + s]} readOnly={readOnly} onChange={v => set("like:" + s, v)} max={600} />
                </label>
                <label className="field">
                  <Words k="buildAsk" copy={copy} editing={editing} className="ask" />
                  <Line id={"fp-build-" + s} label={copy.say("buildAsk") + " Site " + (i + 1)} value={answers["build:" + s]} readOnly={readOnly} onChange={v => set("build:" + s, v)} max={600} />
                </label>
              </div>
            ))}
          </div>}
        </section>

        <section className="part">
          <div className="phead"><Words k="strengthsHead" copy={copy} editing={editing} className="n" /><span className="sub">{blank(answers, "strengths") ? "" : "✓"}</span></div>
          <Words k="strengthsIntro" copy={copy} editing={editing} as="p" className="hint" />
          <Choices label={copy.say("strengthsHead")} options={M.STRENGTHS} value={answers.strengths || ""} readOnly={readOnly} onChange={v => set("strengths", v)} />
        </section>

        <section className="part">
          <div className="phead"><Words k="workHead" copy={copy} editing={editing} className="n" /><span className="sub">{blank(answers, "work") ? "" : "✓"}</span></div>
          <Words k="workHint" copy={copy} editing={editing} as="p" className="hint" />
          <div className="fpp-work" role="radiogroup" aria-label={copy.say("workHead")}>
            {M.WORK.map(w => (
              <button key={w.id} type="button" role="radio" aria-checked={answers.work === w.id} disabled={readOnly} className={"fpp-opt focusable fpp-" + w.id + (answers.work === w.id ? " on" : "")} onClick={() => setWork(w.id)}>{w.say}</button>
            ))}
          </div>
          {answers.work && M.picksPartner(answers.work) ? (
            <>
              <div className="field">
                <Words k="topAsk" copy={copy} editing={editing} className="ask" />
                <FaceGrid label={copy.say("topAsk")} people={people} picked={answers.top ? [answers.top] : []} readOnly={readOnly} onToggle={setTop} />
              </div>
              <div className="field">
                <Words k="alsoAsk" copy={copy} editing={editing} className="ask" />
                <FaceGrid label={copy.say("alsoAsk")} people={people.filter(p => p.name !== answers.top)} picked={also} readOnly={readOnly} onToggle={toggleAlso} />
              </div>
            </>
          ) : null}
        </section>

        {!readOnly ? (
          <div className="foot">
            {justice ? null : <div className="fps-meter" role="img" aria-label={(need - left.length) + " of " + need}><i style={{ width: ((need - left.length) / need) * 100 + "%" }} /></div>}
            <div className="say" aria-live="polite">{say}</div>
            <span className={"status" + (status === "retrying" || status === "failed-load" ? " bad" : "")} aria-live="polite">{STATUS[status]}</span>
            <button type="button" className="btn primary focusable" disabled={handing === "sending"} onClick={submit}>
              {handing === "sending" ? "Submitting…" : submitted ? copy.say("again") : copy.say("submit")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const EXTRA = `
.fpp .phead .n{max-width:60ch}
.fpp .fpp-work{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.fpp .fpp-opt{font:inherit;font-family:var(--font);font-size:17px;font-weight:500;line-height:1.3;text-align:left;color:var(--ink);background:var(--sunk);border:2px solid var(--line-soft);border-top:6px solid var(--w);border-radius:14px;padding:14px 16px;min-height:92px;cursor:pointer;transition:transform .12s,background .15s}
.fpp .fpp-opt:hover{transform:translateY(-2px)}
.fpp .fpp-opt.on{background:color-mix(in srgb,var(--w) 18%,var(--card));border-color:var(--w);box-shadow:0 0 0 3px color-mix(in srgb,var(--w) 25%,transparent)}
.fpp .fpp-opt[disabled]{cursor:default}
.fpp .fpp-pair2{--w:#059669}.fpp .fpp-pair1{--w:#2563eb}.fpp .fpp-solo1{--w:#d97706}.fpp .fpp-solo2{--w:#e11d48}
.fpp .fpp-faces{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px}
.fpp .fpp-face{font:inherit;font-family:var(--font);display:grid;justify-items:center;gap:6px;padding:10px 6px;border-radius:14px;border:2px solid transparent;background:var(--sunk);color:var(--ink);cursor:pointer;transition:transform .12s}
.fpp .fpp-face:hover{transform:translateY(-2px)}
.fpp .fpp-face.on{border-color:var(--accent);background:var(--accent-light)}
.fpp .fpp-face[disabled]{cursor:default}
.fpp .fpp-pic{width:60px;height:60px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:var(--line-strong);font-weight:600;font-size:20px;color:var(--secondary)}
.fpp .fpp-pic:empty{display:none}
.fpp .fpp-pic img{width:100%;height:100%;object-fit:cover;display:block}
.fpp .fpp-face.on .fpp-pic{box-shadow:0 0 0 3px var(--accent)}
.fpp .fpp-name{font-size:14px;font-weight:500;line-height:1.2;text-align:center;overflow-wrap:anywhere}
.fpp .fpp-result{background:var(--accent-light)}
.fpp .fpp-past{background:var(--accent-light);border-radius:18px 18px 18px 6px;padding:18px 20px;display:grid;gap:12px;max-width:820px}
.fpp .fpp-pastsay{margin:0;font-size:17px;font-weight:500;line-height:1.45;color:var(--ink);max-width:60ch}
.fpp .fpp-past ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.fpp .fpp-past li{display:grid;grid-template-columns:190px 1fr;gap:12px;font-size:17px;line-height:1.4;color:var(--ink);overflow-wrap:anywhere}
.fpp .fpp-past li span{font-size:14px;font-weight:600;color:var(--secondary);padding-top:2px}
@media (max-width:560px){.fpp .fpp-past li{grid-template-columns:1fr;gap:2px}}
.fpp .fpp-place{margin:0;font-size:22px;font-weight:500;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fpp .fpp-place .fpp-pic{width:44px;height:44px}
.fpp .box .mark{justify-self:start}
/* COMM 118's sheet (.fps). COMM 3's keeps the rules above and nothing below. */
.fps .sheet{gap:0;border-radius:20px}
.fps .head{padding:40px 40px 32px}
.fps .name{font-size:clamp(30px,4.6vw,42px);line-height:1.08;letter-spacing:-.025em}
.fps .credit{font-size:16px}
.fps .intro{font-size:21px;line-height:1.4;max-width:44ch;padding-top:10px}
.fps .part{padding:36px 40px 44px;gap:18px}
.fps .phead{align-items:center}
.fps .phead .n{font-size:clamp(24px,3.2vw,29px);line-height:1.15;letter-spacing:-.015em;max-width:40ch;text-wrap:balance}
.fps .phead .sub{flex:none;font-size:14px;font-weight:600;color:var(--ink);background:var(--sunk);border-radius:999px;padding:5px 12px}
.fps .phead .sub:empty{display:none}
.fps .hint{font-size:18px;max-width:64ch}
.fps .fpt-lead{margin:0;font-size:20px;line-height:1.45;color:var(--ink);max-width:56ch}
.fps .fpt-note{margin:8px 0 0;font-size:18px;line-height:1.5;color:var(--ink);max-width:64ch;white-space:pre-line}
/* His note to the student: a speech bubble, the topics ready to tap in. */
.fps .fpp-mine{background:var(--accent-light);border-radius:22px 22px 22px 6px;padding:22px 24px 24px;display:grid;gap:16px;justify-self:start;max-width:820px;margin:6px 0}
.fps .fpp-minesay{margin:0;font-size:18px;font-weight:500;line-height:1.45;color:var(--ink);max-width:60ch}
.fps .fpt-picks{display:flex;flex-wrap:wrap;gap:8px}
.fps .fpt-pick{font:inherit;font-family:var(--font);display:inline-flex;align-items:center;gap:10px;text-align:left;font-size:16px;font-weight:500;line-height:1.3;color:var(--ink);background:var(--card);border:1.5px solid var(--line-strong);border-radius:999px;padding:7px 18px 7px 8px;min-height:44px;cursor:pointer;overflow-wrap:anywhere;transition:transform .12s,border-color .15s}
.fps span.fpt-pick{cursor:default;padding-left:18px}
.fps span.fpt-pick.on{padding-left:8px}
.fps .fpt-pick i{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:17px;font-weight:600;line-height:1;background:var(--accent);color:var(--on-accent)}
.fps .fpt-pick i:empty{display:none}
.fps button.fpt-pick:hover:not(:disabled){transform:translateY(-1px);border-color:var(--accent)}
.fps .fpt-pick.on{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}
.fps .fpt-pick:disabled{cursor:default;opacity:.55}
/* Example topics: five columns of type under a colored rule, no boxes. */
.fps .fpp-eg{display:grid;gap:14px;margin:14px 0 6px}
.fps .fpp-egh{margin:0;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--secondary)}
.fps .fpp-egs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:26px 24px}
.fps .fpp-egg{border-top:4px solid var(--w);padding-top:12px;min-width:0}
.fps .fpp-ega{margin:0 0 10px;font-size:17px;font-weight:600;line-height:1.2;color:var(--ink)}
.fps .fpp-egg ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.fps .fpp-egg li{font-size:15.5px;line-height:1.35;color:var(--secondary);overflow-wrap:anywhere}
.fps .fpp-egby{display:block;font-size:14px;font-weight:500}
.fps .fpp-eg0{--w:#2563eb}.fps .fpp-eg1{--w:#e11d48}.fps .fpp-eg2{--w:#7c3aed}.fps .fpp-eg3{--w:#d97706}.fps .fpp-eg4{--w:#0891b2}.fps .fpp-eg5{--w:#059669}
/* The three topics: tabs, the questions once, and the read-back beside them. */
.fps .fpt-a{--w:#2563eb}.fps .fpt-b{--w:#7c3aed}.fps .fpt-c{--w:#c2410c}
.fps .fpt{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,380px);gap:28px;align-items:start;margin-top:10px;scroll-margin-top:84px}
.fps .fpt-main{display:grid;gap:12px;min-width:0}
.fps .fpt-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fps .fpt-tab{font:inherit;font-family:var(--font);position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:10px;text-align:left;color:var(--ink);background:var(--sunk);border:2px solid var(--line-soft);border-radius:16px;padding:12px 14px 15px;min-height:64px;cursor:pointer;transition:transform .12s,background .15s,border-color .15s}
.fps .fpt-tab:hover{transform:translateY(-2px)}
.fps .fpt-tab.on{background:color-mix(in srgb,var(--w) 12%,var(--card));border-color:var(--w);box-shadow:0 0 0 3px color-mix(in srgb,var(--w) 22%,transparent)}
.fps .fpt-tab.need{border-color:var(--bad)}
.fps .fpt-badge{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-size:16px;font-weight:600;line-height:1;background:var(--card);border:2px solid var(--w);color:var(--ink)}
.fps .fpt-tab.on .fpt-badge,.fps .fpt-tab.done .fpt-badge{background:var(--w);color:#fff}
.fps .fpt-tabsay{display:grid;min-width:0}
.fps .fpt-tabn{font-size:17px;font-weight:600;line-height:1.2}
.fps .fpt-tabq{font-size:14px;line-height:1.3;color:var(--secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fps .fpt-tabq:empty{display:none}
.fps .fpt-meter{position:absolute;left:0;right:0;bottom:0;height:5px;background:var(--line-strong)}
.fps .fpt-meter i{display:block;height:100%;background:var(--w);transition:width .25s ease}
.fps .fpt-panel{display:grid;gap:24px;background:var(--sunk);border-radius:18px;border-top:6px solid var(--w);padding:26px 26px 22px;animation:fpt-in .22s ease both}
@keyframes fpt-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.fps .fpt-ph{display:grid;gap:10px;justify-items:start}
.fps .fpt-phn{font-size:17px;font-weight:600;width:100%}
.fps .fpt-f{display:grid;gap:9px;min-width:0}
.fps .fpt-ask{font-size:18px;font-weight:500;line-height:1.35;color:var(--ink);max-width:52ch}
.fps .fpt-f .para{max-width:none;display:block;background:var(--card);border-width:1.5px;border-radius:12px;padding:13px 15px;resize:none;overflow:hidden}
.fps .fpt-f-topic .para{font-size:21px;font-weight:500;line-height:1.3;resize:none}
.fps .fpt-f .lines .row input{background:var(--card);border-width:1.5px;border-radius:12px;font-size:17px;min-height:48px}
.fps .fpt-f .save{width:48px;height:48px;border-radius:12px}
.fps .fpt-f .chip.bubble{font-size:16px;padding:8px 6px 8px 14px}
.fps .fpt-f.need .para,.fps .fpt-f.need .lines .row input,.fps .fps-sc.need .para,.fps .fps-sc.need .row input{border-color:var(--bad)}
.fps .fpt-nav{display:flex;justify-content:space-between;align-items:center;gap:10px}
.fps .fpt-go{font:inherit;font-family:var(--font);font-size:15px;font-weight:600;color:var(--ink);background:var(--card);border:1.5px solid var(--line-strong);border-radius:999px;padding:0 18px;min-height:44px;cursor:pointer}
.fps .fpt-go:hover{border-color:var(--w)}
.fps .fpt-paper{position:sticky;top:84px;max-height:calc(100vh - 108px);overflow:auto;min-width:0;background:var(--card);border:1px solid var(--line-strong);border-radius:18px;box-shadow:0 18px 40px -24px rgba(0,0,0,.45)}
.fps .fpt-entry{display:grid;gap:10px;padding:20px 22px 22px;border-top:1px solid var(--line-soft);box-shadow:inset 4px 0 0 transparent;transition:background .15s,box-shadow .15s}
.fps .fpt-entry:first-child{border-top:0}
.fps .fpt-entry.on{background:color-mix(in srgb,var(--w) 7%,var(--card));box-shadow:inset 4px 0 0 var(--w)}
.fps .fpt-eh{font:inherit;font-family:var(--font);display:flex;align-items:center;gap:10px;justify-self:start;color:var(--ink);background:none;border:0;border-radius:999px;padding:0 8px 0 0;min-height:32px;cursor:pointer}
.fps .fpt-dot{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:600;line-height:1;background:var(--w);color:#fff}
.fps .fpt-en{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase}
.fps .fpt-rq{margin:0;font-size:21px;font-weight:600;line-height:1.22;letter-spacing:-.01em;color:var(--ink);overflow-wrap:anywhere;text-wrap:balance}
.fps .fpt-rp{margin:0;font-size:15.5px;line-height:1.5;color:var(--ink);white-space:pre-line;overflow-wrap:anywhere}
.fps .fpt-rc{margin:2px 0;padding:2px 0 2px 14px;border-left:3px solid var(--w);font-size:15.5px;line-height:1.5;color:var(--ink);white-space:pre-line;overflow-wrap:anywhere}
.fps .fpt-ra{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.fps .fpt-ra li{background:var(--sunk);border-radius:14px 14px 14px 4px;padding:6px 12px;font-size:14.5px;line-height:1.35;color:var(--ink);overflow-wrap:anywhere}
.fps .fpt-entry.on .fpt-ra li{background:var(--card)}
/* The sites: the three questions across the top, a row a site. */
.fps .fps-sites{display:grid;grid-template-columns:36px minmax(0,.8fr) minmax(0,1.2fr) minmax(0,1.2fr);gap:12px 16px;align-items:start;margin-top:4px}
.fps .fps-sh{font-size:16px;font-weight:600;line-height:1.3;color:var(--ink);align-self:end;padding-bottom:2px}
.fps .fps-sn{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:16px;font-weight:600;background:var(--sunk);color:var(--ink);margin-top:6px}
.fps .fps-sc{min-width:0}
.fps .fps-sc::before{display:none;content:attr(data-q);font-size:16px;font-weight:500;line-height:1.3;color:var(--ink);margin-bottom:6px}
.fps .fps-sc .row input{max-width:none;border-width:1.5px;border-radius:12px;font-weight:500;min-height:52px}
.fps .fps-sc .para{max-width:none;display:block;border-width:1.5px;border-radius:12px;min-height:52px;padding:12px 14px;line-height:1.5;resize:none;overflow:hidden}
/* Strengths, the choice of how to work, and the foot. */
.fps .choices{gap:8px}
.fps .choices .chip{font-size:16px;min-height:44px;padding:8px 18px;background:var(--card);border:1.5px solid var(--line-strong)}
.fps .choices .chip.on{background:var(--accent);border-color:var(--accent)}
.fps .fpp-work{margin-bottom:6px}
.fps .foot{padding:22px 40px 30px;gap:14px 16px}
.fps .fps-meter{flex:0 0 100%;height:8px;border-radius:999px;background:var(--line-strong);overflow:hidden}
.fps .fps-meter i{display:block;height:100%;border-radius:999px;background:var(--accent);transition:width .3s ease}
.fps .foot .btn.primary{min-height:52px;padding:0 28px;font-size:17px;border-radius:999px}
@media (max-width:1000px){
.fps .fpp-egs{grid-template-columns:repeat(3,minmax(0,1fr))}
.fps .fpt{grid-template-columns:1fr}
.fps .fpt-paper{position:static;max-height:none}
}
@media (max-width:860px){
.fps .head{padding:28px 18px 24px}
.fps .part{padding:28px 18px 34px}
.fps .foot{padding:18px 18px 26px}
}
@media (max-width:760px){
.fps .fps-sites{grid-template-columns:36px minmax(0,1fr);gap:10px 12px}
.fps .fps-sh{display:none}
.fps .fps-sn{grid-row:span 3;margin-top:0}
.fps .fps-sc{grid-column:2}
.fps .fps-sc::before{display:block}
.fps .fps-sc-build{padding-bottom:16px}
}
@media (max-width:600px){
.fps .fpp-egs{grid-template-columns:1fr 1fr;gap:22px 18px}
.fps .fpp-mine{padding:18px 18px 20px}
.fps .fpt-pick{border-radius:16px;width:100%}
.fps .fpt-tabs{gap:6px}
.fps .fpt-tab{grid-template-columns:1fr;justify-items:start;gap:6px;padding:10px 10px 14px}
.fps .fpt-tabq{display:none}
.fps .fpt-panel{padding:20px 16px 18px;gap:22px}
.fps .fpt-f-topic .para{font-size:19px}
.fps .fpt-entry{padding:18px 18px 20px}
}
@media (prefers-reduced-motion: reduce){.fps .fpt-panel{animation:none}}
@media (max-width:860px){.fpp .fpp-work{grid-template-columns:1fr 1fr}}
`;

/** The worksheet registry's mount: React inside the plain-DOM contract. */
export function mountFinalPrefs(root, { store, viewer, readOnly = false, classId, storageKey, editor = false, theme, classmates = [], photos = {} } = {}) {
  const r = createRoot(root);
  r.render(<PrefsSheet store={store} viewer={viewer} readOnly={readOnly} classId={classId} storageKey={storageKey} editor={editor && !readOnly} theme={theme} classmates={classmates} photos={photos} />);
  return { destroy() { r.unmount(); } };
}

// Steps three and four, not built yet. Andrew, 2026-11-13: "we don't need to
// work on this right now, but you can just kind of have like a template
// saying like coming soon." Registered closed, so only he can open either.
function Soon({ title }) {
  return <div className="as"><style>{CSS}</style><div className="sheet"><div className="head"><div className="title"><h2 className="name">{title}</h2><div className="credit">Coming soon.</div></div></div></div></div>;
}
export const mountSoon = (title) => (root) => { const r = createRoot(root); r.render(<Soon title={title} />); return { destroy() { r.unmount(); } }; };
