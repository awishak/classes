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

// A colour for a face with no photo, the same one every time for a name.
const hueOf = (name) => [...String(name || "")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (name) => String(name || "").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

function FaceGrid({ label, people, picked, readOnly, onToggle }) {
  return (
    <div className="fpp-faces" role="group" aria-label={label}>
      {people.map(p => {
        const on = picked.includes(p.name);
        return (
          <button key={p.name} type="button" style={{ "--h": hueOf(p.name) }} className={"fpp-face focusable" + (on ? " on" : "")} aria-pressed={on} disabled={readOnly} onClick={() => onToggle(p.name)}>
            <span className="fpp-pic">{p.photo ? <img src={p.photo} alt="" /> : initials(p.shown)}</span>
            <span className="fpp-name">{p.shown}</span>
          </button>
        );
      })}
    </div>
  );
}

// A paragraph box that grows with its words, so a long answer is never cut
// off on a phone. Para's markup and classes, with the least height set from the
// text: measured with the box shut, so a box its row has stretched is not
// measured at the stretched height and never ratchets taller as it is typed in.
function Grow({ id, label, value, readOnly, onChange, rows = 3, max = 2000 }) {
  const fit = (el) => { if (el) { el.style.minHeight = "0"; el.style.height = "0"; const h = el.scrollHeight; el.style.height = ""; el.style.minHeight = h + 3 + "px"; } };
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
  // The area of example topics picked out, or -1 for all of them.
  const [area, setArea] = useState(-1);
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
  const picker = (t, cls, style) => {
    const on = !!heldBy(t);
    return readOnly ? <span key={t} className={cls + (on ? " on" : "")} style={style}><i aria-hidden="true">{on ? "✓" : ""}</i>{t}</span> : (
      <button key={t} type="button" className={cls + " focusable" + (on ? " on" : "")} style={style} aria-pressed={on} disabled={!on && !roomFor} onClick={() => pickInterest(t)}>
        <i aria-hidden="true">{on ? "✓" : "+"}</i>{t}
      </button>
    );
  };
  // The three topics read back: what a tab card and the phone's list both show.
  const readBack = (t) => [
    t.topic ? <span key="q" className="fpt-rq">{t.topic}</span> : null,
    t.worth ? <span key="w" className="fpt-rp">{t.worth}</span> : null,
    t.audience ? <span key="u" className="fpt-rp">{t.audience}</span> : null,
    t.concepts ? <span key="c" className="fpt-rc">{t.concepts}</span> : null,
    t.asks.length ? <span key="a" className="fpt-ra">{t.asks.map((l, k) => <span key={k}>{l}</span>)}</span> : null,
  ];
  const pips = (s) => <span className="fpt-pips" aria-hidden="true">{TOPIC_Q.map(([, f]) => <i key={f} className={blank(answers, f + ":" + s) ? "" : "on"} />)}</span>;
  const topics118 = justice ? null : (
    <section className="part fpt-part">
      <div className="fps-band hero">
        <div className="phead"><Words k="topicHead" copy={copy} editing={editing} className="n" /><span className="sub">{M.SLOTS.filter(ideaDone).length} of 3</span></div>
        <Words k="topicHint" copy={copy} editing={editing} as="p" className="hint" />
      </div>
      {interests.length || editing ? (
        <div className="fpp-mine">
          <Words k="interestsSay" copy={copy} editing={editing} as="p" className="fpp-minesay" />
          {interests.length ? <div className="fpt-picks">{interests.map(t => picker(t, "fpt-pick"))}</div> : null}
        </div>
      ) : null}
      <div className="fpp-eg">
        <div className="fpp-egtop">
          <Words k="examplesHead" copy={copy} editing={editing} as="p" className="fpp-egh" />
          <div className="fpp-egl" role="group" aria-label={copy.say("examplesHead")}>
            {M.EXAMPLES_118.map((g, n) => (
              <button key={g.area} type="button" className={"fpp-ega focusable fpp-eg" + n + (area === n ? " on" : area >= 0 ? " off" : "")} aria-pressed={area === n} onClick={() => setArea(a => (a === n ? -1 : n))}>{g.area}</button>
            ))}
          </div>
        </div>
        <div className="fpp-wall">
          {M.EXAMPLES_118.map((g, n) => g.topics.map(t => picker(t.say, "fpp-egt fpp-eg" + n + (area >= 0 && area !== n ? " dim" : ""))))}
        </div>
      </div>
      <div className="fpt" ref={composer}>
        {copy.say("conceptsHint") ? <Words k="conceptsHint" copy={copy} editing={editing} as="p" className="fpt-note" /> : null}
        <div className="fpt-tabs" role="tablist" aria-label={copy.say("topicHead")}>
          {M.SLOTS.map((s, i) => {
            const n = doneIn(s), on = s === slot, full = n === TOPIC_Q.length;
            return (
              <button key={s} type="button" role="tab" id={"fp-tab-" + s} aria-selected={on} aria-controls="fp-topic-panel" aria-label={topicName(i) + ", " + n + " of " + TOPIC_Q.length}
                className={"fpt-tab focusable fpt-" + s + (on ? " on" : "") + (full ? " done" : "") + (n ? "" : " blank") + (needs && !full ? " need" : "")} onClick={() => setSlot(s)}>
                <span className="fpt-num" aria-hidden="true">{i + 1}</span>
                <span className="fpt-th"><span className="fpt-tabn">{topicName(i)}</span>{full ? <span className="fpt-ok" aria-hidden="true">✓</span> : null}</span>
                <span className="fpt-prog">{pips(s)}<span className="fpt-ct">{n} of {TOPIC_Q.length}</span></span>
                {readBack(read.topics[i])}
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
          <div className="fpt-fields">
            {TOPIC_Q.map(([k, f]) => {
              const field = f + ":" + slot, id = "fp-" + f + "-" + slot, label = copy.say(k) + " " + topicName(at), v = answers[field];
              return (
                <div key={f} className={"fpt-f fpt-f-" + f + (needs && blank(answers, field) ? " need" : "")}>
                  <Words k={k} copy={copy} editing={editing} className="fpt-ask" />
                  {f === "topic" ? <Grow id={id} label={label} value={v} readOnly={readOnly} onChange={x => set(field, x.replace(/\n/g, " "))} rows={1} max={300} />
                    : f === "ask" ? <Lines id={id} label={label} value={v || ""} readOnly={readOnly} onChange={x => set(field, x)} />
                    : <Grow id={id} label={label} value={v} readOnly={readOnly} onChange={x => set(field, x)} rows={4} max={2000} />}
                </div>
              );
            })}
          </div>
          <div className="fpt-nav">
            {at > 0 ? <button type="button" className="fpt-go focusable" onClick={() => goTopic(M.SLOTS[at - 1])}><span aria-hidden="true">←</span> {topicName(at - 1)}</button> : <span />}
            {at < M.SLOTS.length - 1 ? <button type="button" className="fpt-go focusable" onClick={() => goTopic(M.SLOTS[at + 1])}>{topicName(at + 1)} <span aria-hidden="true">→</span></button> : null}
          </div>
        </div>
        {read.topics.some(t => doneIn(t.slot)) ? (
          <div className="fpt-paper">
            {read.topics.map((t, i) => doneIn(t.slot) ? (
              <button key={t.slot} type="button" className={"fpt-entry focusable fpt-" + t.slot + (t.slot === slot ? " on" : "")} aria-label={topicName(i)} onClick={() => goTopic(t.slot)}>
                <span className="fpt-num" aria-hidden="true">{i + 1}</span>
                <span className="fpt-th"><span className="fpt-tabn">{topicName(i)}</span></span>
                {readBack(t)}
              </button>
            ) : null)}
          </div>
        ) : null}
      </div>
    </section>
  );
  // COMM 118's sites: the three questions once across the top, a row a site.
  const SITE_Q = [["siteAsk", "site", 300], ["likeAsk", "like", 600], ["buildAsk", "build", 600]];
  const sites118 = justice ? null : (
    <div className="fps-sites">
      <div className="fps-row fps-rowh">
        <span className="fps-sh" />
        {SITE_Q.map(([k]) => <Words key={k} k={k} copy={copy} editing={editing} className="fps-sh" />)}
      </div>
      {M.SLOTS.map((s, i) => (
        <div key={s} className="fps-row">
          <span className="fps-sn" aria-hidden="true">{i + 1}</span>
          {SITE_Q.map(([k, f, max]) => {
            const field = f + ":" + s, label = copy.say(k) + (f === "site" ? " " : " Site ") + (i + 1);
            return (
              <div key={f} className={"fps-sc fps-sc-" + f + (needs && blank(answers, field) ? " need" : "")} data-q={copy.say(k)}>
                {f === "site" ? <Line id={"fp-" + f + "-" + s} label={label} value={answers[field]} readOnly={readOnly} onChange={v => set(field, v)} />
                  : <Grow id={"fp-" + f + "-" + s} label={label} value={answers[field]} readOnly={readOnly} onChange={v => set(field, v.replace(/\n/g, " "))} rows={1} max={max} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
  // A section's heading and his sentence under it: COMM 3's two lines as they
  // were, COMM 118's in one band.
  const band = (k, sub, hint) => {
    const lines = <>
      <div className="phead"><Words k={k} copy={copy} editing={editing} className="n" /><span className="sub">{sub}</span></div>
      <Words k={hint} copy={copy} editing={editing} as="p" className="hint" />
    </>;
    return justice ? lines : <div className="fps-band">{lines}</div>;
  };
  const faces = <>
    <div className="field">
      <Words k="topAsk" copy={copy} editing={editing} className="ask" />
      <FaceGrid label={copy.say("topAsk")} people={people} picked={answers.top ? [answers.top] : []} readOnly={readOnly} onToggle={setTop} />
    </div>
    <div className="field">
      <Words k="alsoAsk" copy={copy} editing={editing} className="ask" />
      <FaceGrid label={copy.say("alsoAsk")} people={people.filter(p => p.name !== answers.top)} picked={also} readOnly={readOnly} onToggle={toggleAlso} />
    </div>
  </>;

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
          {band("sitesHead", M.SLOTS.filter(s => ["site:", "like:", "build:"].every(f => !blank(answers, f + s))).length + " of 3", "sitesIntro")}
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
          {band("strengthsHead", blank(answers, "strengths") ? "" : "✓", "strengthsIntro")}
          <Choices label={copy.say("strengthsHead")} options={M.STRENGTHS} value={answers.strengths || ""} readOnly={readOnly} onChange={v => set("strengths", v)} />
        </section>

        <section className="part">
          {band("workHead", blank(answers, "work") ? "" : "✓", "workHint")}
          <div className="fpp-work" role="radiogroup" aria-label={copy.say("workHead")}>
            {M.WORK.map(w => (
              <button key={w.id} type="button" role="radio" aria-checked={answers.work === w.id} disabled={readOnly} className={"fpp-opt focusable fpp-" + w.id + (answers.work === w.id ? " on" : "")} onClick={() => setWork(w.id)}>{w.say}</button>
            ))}
          </div>
          {answers.work && M.picksPartner(answers.work) ? (justice ? faces : <div className="fps-team">{faces}</div>) : null}
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
.fps{--pitch:#0c4a42;--deep:#072e29;--volt:#d8f75c;--chalk:#e6f3ee;--on-volt:#0a2b26}
.fps .sheet{max-width:1120px;gap:0;border-radius:26px;overflow:clip;padding-bottom:0;border-color:var(--line-strong)}
/* The masthead: a pitch from above, the halfway line and the centre circle. */
.fps .head{position:relative;isolation:isolate;display:block;overflow:hidden;padding:46px 40px 44px;color:#fff;background:var(--deep) repeating-linear-gradient(90deg,rgba(255,255,255,.035) 0 88px,transparent 88px 176px)}
.fps .head::before{content:"";position:absolute;z-index:-1;right:-150px;top:50%;width:540px;height:540px;border-radius:50%;border:3px solid rgba(255,255,255,.16);background:radial-gradient(circle,rgba(255,255,255,.3) 0 8px,transparent 9px);transform:translateY(-50%)}
.fps .head::after{content:"";position:absolute;z-index:-1;right:119px;top:0;bottom:0;width:3px;background:rgba(255,255,255,.16)}
.fps .title{gap:16px;max-width:780px}
.fps .credit{order:-1;justify-self:start;font-size:14px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;line-height:1.3;color:var(--on-volt);background:var(--volt);border-radius:999px;padding:7px 15px}
.fps .name{font-size:clamp(44px,8.4vw,84px);font-weight:700;line-height:.96;letter-spacing:-.04em;color:#fff;text-wrap:balance}
.fps .intro{font-size:clamp(19px,2.2vw,23px);line-height:1.35;color:var(--chalk);max-width:36ch;padding-top:2px}
.fps .head .status{color:var(--chalk)}
.fps .vsp-edit{color:var(--ink)}
.fps .head .focusable:focus-visible,.fps .foot .focusable:focus-visible{outline-color:var(--volt)}
.fps .part{padding:28px 40px 0;gap:14px;border-top:0}
.fps .part:last-of-type{padding-bottom:36px}
/* A section opens on a band: his heading on the left, his sentence beside it. */
.fps .fps-band{display:grid;grid-template-columns:320px minmax(0,1fr);gap:10px 40px;align-items:center;background:var(--pitch);color:#fff;border-radius:22px;padding:24px 30px 26px}
.fps .fps-band .phead{display:grid;gap:12px;justify-items:start;align-content:center}
.fps .fps-band .phead .n{font-size:27px;font-weight:600;line-height:1.12;letter-spacing:-.02em;color:#fff;max-width:none;text-wrap:balance}
.fps .fps-band .sub{flex:none;font-size:14px;font-weight:700;line-height:1;color:var(--on-volt);background:var(--volt);border-radius:999px;padding:6px 12px}
.fps .fps-band .sub:empty{display:none}
.fps .fps-band .hint{font-size:18px;line-height:1.5;color:var(--chalk);max-width:none}
.fps .fps-band.hero{padding:34px 30px 36px}
.fps .fps-band.hero .phead .n{font-size:23px;line-height:1.2;letter-spacing:-.01em;color:var(--volt)}
.fps .fps-band.hero .hint{font-size:clamp(27px,3.9vw,44px);font-weight:600;line-height:1.06;letter-spacing:-.03em;color:#fff;text-wrap:pretty}
.fps .fps-band .phead .vsp-edit.n,.fps .fps-band.hero .vsp-edit.hint,.fps .fps-band .vsp-edit.hint{color:var(--ink)}
.fps .fps-band .vsp-edit.n{font-size:20px}
.fps .fps-band .vsp-edit.hint{font-size:17px;font-weight:400;letter-spacing:0;line-height:1.45}
/* His note to the student: his sentence, and the topics ready to tap in. */
.fps .fpp-mine{display:grid;grid-template-columns:320px minmax(0,1fr);gap:14px 40px;align-items:center;background:var(--accent-light);border:2px solid color-mix(in srgb,var(--accent) 30%,transparent);border-radius:22px;padding:22px 28px;margin:0;max-width:none}
.fps .fpp-minesay{margin:0;font-size:17px;font-weight:500;line-height:1.45;color:var(--ink)}
.fps .fpt-picks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.fps .fpt-pick{font:inherit;font-family:var(--font);display:inline-flex;align-items:center;gap:10px;text-align:left;font-size:16px;font-weight:500;line-height:1.25;color:var(--ink);background:var(--card);border:2px solid var(--line-strong);border-radius:999px;padding:6px 18px 6px 7px;min-height:46px;cursor:pointer;overflow-wrap:anywhere;transition:transform .12s,border-color .15s,background .15s}
.fps span.fpt-pick{cursor:default;padding-left:18px}
.fps span.fpt-pick.on{padding-left:7px}
.fps .fpt-pick i{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:18px;font-weight:600;line-height:1;background:var(--accent);color:var(--on-accent)}
.fps .fpt-pick i:empty{display:none}
.fps button.fpt-pick:hover:not(:disabled){transform:translateY(-1px);border-color:var(--accent)}
.fps .fpt-pick.on{background:var(--pitch);border-color:var(--pitch);color:#fff}
.fps .fpt-pick.on i{background:var(--volt);color:var(--on-volt)}
.fps .fpt-pick:disabled{cursor:default;opacity:.55}
/* Example topics: one wall of them, coloured by area, the areas as a filter. */
.fps .fpp-eg0{--w:#2563eb}.fps .fpp-eg1{--w:#e11d48}.fps .fpp-eg2{--w:#7c3aed}.fps .fpp-eg3{--w:#b45309}.fps .fpp-eg4{--w:#0e7490}.fps .fpp-eg5{--w:#047857}
.fps .fpp-eg{display:grid;gap:16px;background:var(--sunk);border-radius:22px;padding:20px 28px 26px;margin:0}
.fps .fpp-egtop{display:flex;align-items:center;justify-content:space-between;gap:12px 24px;flex-wrap:wrap}
.fps .fpp-egh{margin:0;font-size:22px;font-weight:600;line-height:1.2;letter-spacing:-.01em;color:var(--ink)}
.fps .fpp-egl{display:flex;flex-wrap:wrap;gap:6px}
.fps .fpp-ega{font:inherit;font-family:var(--font);font-size:14.5px;font-weight:600;line-height:1.2;color:#fff;background:var(--w);border:2px solid var(--w);border-radius:999px;padding:0 14px;min-height:38px;cursor:pointer;transition:transform .12s,background .15s,color .15s}
.fps .fpp-ega:hover{transform:translateY(-1px)}
.fps .fpp-ega.off{background:transparent;color:var(--ink)}
.fps .fpp-wall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.fps .fpp-egt{font:inherit;font-family:var(--font);flex:1 1 auto;display:inline-flex;align-items:center;gap:10px;text-align:left;font-size:15.5px;font-weight:500;line-height:1.25;color:var(--ink);background:color-mix(in srgb,var(--w) 9%,var(--card));border:0;box-shadow:inset 5px 0 0 var(--w);border-radius:12px;padding:8px 16px 8px 17px;min-height:46px;cursor:pointer;overflow-wrap:anywhere;transition:transform .12s,background .15s,opacity .15s}
.fps span.fpp-egt{cursor:default}
.fps .fpp-egt i{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:16px;font-weight:600;line-height:1;color:var(--w);background:var(--card)}
.fps .fpp-egt i:empty{display:none}
.fps button.fpp-egt:hover:not(:disabled){transform:translateY(-1px);background:color-mix(in srgb,var(--w) 20%,var(--card))}
.fps .fpp-egt.on{background:var(--w);color:#fff}
.fps .fpp-egt.dim{opacity:.3}
.fps .fpp-egt:disabled{cursor:default}
/* The three topics: a card a topic down the left that fills in as it is
   written, and the questions, once, on the card that is open. */
.fps .fpt-a{--w:#2563eb}.fps .fpt-b{--w:#7c3aed}.fps .fpt-c{--w:#c2410c}
.fps .fpt{display:grid;grid-template-columns:320px minmax(0,1fr);gap:10px 14px;align-items:stretch;margin:0;scroll-margin-top:84px}
.fps .fpt-note{grid-column:1/-1;margin:0;font-size:18px;font-weight:500;line-height:1.4;color:var(--card);background:var(--ink);border-radius:22px 22px 8px 8px;padding:18px 30px 19px;max-width:none;white-space:pre-line}
.fps .fpt-tabs{display:grid;gap:10px;min-width:0}
.fps .fpt-tab,.fps .fpt-entry{font:inherit;font-family:var(--font);position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:stretch;gap:9px;text-align:left;color:var(--ink);background:color-mix(in srgb,var(--w) 10%,var(--card));border:0;box-shadow:inset 6px 0 0 var(--w);border-radius:18px;padding:16px 20px 18px 24px;min-height:118px;cursor:pointer;transition:background .15s,transform .12s}
.fps .fpt-tab:hover:not(.on){background:color-mix(in srgb,var(--w) 17%,var(--card))}
.fps .fpt-tab.on{background:var(--w);color:#fff;margin-right:-14px;padding-right:34px;border-radius:18px 0 0 18px}
.fps .fpt-tab.need:not(.on){box-shadow:inset 6px 0 0 var(--w),inset 0 0 0 2px var(--bad)}
.fps .fpt-num{position:absolute;right:14px;top:8px;font-size:76px;font-weight:700;line-height:1;letter-spacing:-.05em;color:var(--w);opacity:.2;pointer-events:none}
.fps .fpt-tab.on .fpt-num{color:#fff;opacity:.26;right:28px}
.fps .fpt-tab.blank .fpt-num,.fps .fpt-tab.blank.on .fpt-num{top:auto;bottom:-8px;right:18px;font-size:150px}
.fps .fpt-tab.blank.on .fpt-num{right:32px}
.fps .fpt-th{display:flex;align-items:center;gap:8px}
.fps .fpt-tabn{font-size:14px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;line-height:1.2}
.fps .fpt-ok{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;line-height:1;background:var(--w);color:#fff}
.fps .fpt-tab.on .fpt-ok{background:#fff;color:var(--w)}
.fps .fpt-prog{display:flex;align-items:center;gap:10px}
.fps .fpt-pips{display:flex;gap:4px}
.fps .fpt-pips i{width:22px;height:7px;border-radius:999px;background:color-mix(in srgb,var(--w) 26%,var(--card))}
.fps .fpt-pips i.on{background:var(--w)}
.fps .fpt-tab.on .fpt-pips i{background:rgba(255,255,255,.34)}
.fps .fpt-tab.on .fpt-pips i.on{background:#fff}
.fps .fpt-ct{font-size:14px;font-weight:600;line-height:1}
.fps .fpt-rq{position:relative;font-size:20px;font-weight:600;line-height:1.18;letter-spacing:-.015em;overflow-wrap:anywhere;padding-top:4px}
.fps .fpt-rp,.fps .fpt-rc{font-size:14.5px;line-height:1.42;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
.fps .fpt-rp{-webkit-line-clamp:2}
.fps .fpt-rc{padding-left:11px;border-left:3px solid var(--w)}
.fps .fpt-tab:not(.on) .fpt-rp{display:none}
.fps .fpt-tab.on .fpt-rc,.fps .fpt-entry.on .fpt-rc{border-left-color:#fff}
.fps .fpt-ra{display:flex;flex-wrap:wrap;gap:5px}
.fps .fpt-ra span{background:var(--card);border-radius:12px 12px 12px 4px;padding:5px 10px;font-size:13.5px;line-height:1.3;overflow-wrap:anywhere}
.fps .fpt-tab.on .fpt-ra span,.fps .fpt-entry.on .fpt-ra span{background:rgba(0,0,0,.22)}
.fps .fpt-panel{display:flex;flex-direction:column;gap:20px;min-width:0;background:color-mix(in srgb,var(--w) 6%,var(--card));border:3px solid var(--w);border-radius:20px;padding:24px 26px 20px;animation:fpt-in .22s ease both}
@keyframes fpt-in{from{opacity:.4;transform:translateX(6px)}to{opacity:1;transform:none}}
.fps .fpt-ph{display:grid;gap:10px;justify-items:start}
.fps .fpt-phn{font-size:17px;font-weight:600;width:100%}
.fps .fpt-fields{flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:min-content min-content min-content auto min-content auto;gap:20px 20px}
.fps .fpt-f{display:grid;grid-row:span 2;grid-template-rows:subgrid;row-gap:8px;min-width:0;align-content:start}
.fps .fpt-f-topic{grid-column:1/-1}
.fps .fpt-ask{font-size:16.5px;font-weight:600;line-height:1.3;color:var(--ink);align-self:end}
.fps .fpt-f .para{max-width:none;display:block;background:var(--card);border:2px solid var(--line-strong);border-radius:14px;padding:12px 14px;font-size:16.5px;resize:none;overflow:hidden;align-self:stretch;height:100%}
.fps .fpt-f .para:focus,.fps .fpt-f .lines .row input:focus,.fps .fps-sc .para:focus,.fps .fps-sc .row input:focus{border-color:var(--w,var(--accent))}
.fps .fpt-f-topic .para{font-size:25px;font-weight:600;line-height:1.2;letter-spacing:-.015em;padding:16px 18px;border-color:color-mix(in srgb,var(--w) 55%,var(--card));min-height:64px}
.fps .fpt-f .lines{align-content:start;align-self:start}
.fps .fpt-f .lines .row input{background:var(--card);border:2px solid var(--line-strong);border-radius:14px;font-size:16.5px;min-height:50px}
.fps .fpt-f .save{width:50px;height:50px;border-radius:14px;background:var(--w);color:#fff}
.fps .fpt-f .chip.bubble{font-size:15.5px;padding:7px 6px 7px 13px;border-width:2px;border-color:color-mix(in srgb,var(--w) 35%,var(--card))}
.fps .fpt-f.need .para,.fps .fpt-f.need .lines .row input,.fps .fps-sc.need .para,.fps .fps-sc.need .row input{border-color:var(--bad)}
.fps .fpt-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:auto}
.fps .fpt-go{font:inherit;font-family:var(--font);font-size:15px;font-weight:600;color:#fff;background:var(--w);border:0;border-radius:999px;padding:0 20px;min-height:44px;cursor:pointer;transition:transform .12s}
.fps .fpt-go:hover{transform:translateY(-1px)}
.fps .fpt-paper{display:none}
/* The sites: the three questions across the top, a row a site. */
.fps .fps-sites{display:grid;grid-template-columns:54px minmax(0,.8fr) minmax(0,1.2fr) minmax(0,1.2fr);gap:8px 14px;margin:0}
.fps .fps-row{grid-column:1/-1;display:grid;grid-template-columns:subgrid;align-items:start;background:var(--sunk);border-radius:18px;padding:12px 14px 12px 6px}
.fps .fps-rowh{align-items:center;background:var(--ink);color:var(--card);border-radius:18px 18px 8px 8px;padding-block:13px}
.fps .fps-sh{font-size:16px;font-weight:600;line-height:1.3;color:inherit}
.fps .fps-sn{font-size:34px;font-weight:700;line-height:52px;letter-spacing:-.03em;text-align:center;color:var(--accent)}
.fps .fps-sc{min-width:0}
.fps .fps-sc::before{display:none;content:attr(data-q);font-size:15.5px;font-weight:600;line-height:1.3;color:var(--ink);margin-bottom:6px}
.fps .fps-sc .row{position:relative}
.fps .fps-sc-site .row::before{content:"";position:absolute;left:16px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#f87171;box-shadow:13px 0 0 #fbbf24,26px 0 0 #34d399;pointer-events:none}
.fps .fps-sc .row input{max-width:none;border-width:2px;border-radius:14px;min-height:52px}
.fps .fps-sc-site .row input{border-radius:999px;padding-left:62px;font-family:var(--mono);font-size:15.5px;font-weight:500}
.fps .fps-sc .para{max-width:none;display:block;border-width:2px;border-radius:14px;height:100%;padding:11px 14px;line-height:1.5;resize:none;overflow:hidden}
/* Strengths: a tile a skill. */
.fps .choices{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.fps .choices .chip{justify-content:flex-start;gap:11px;text-align:left;white-space:normal;font-size:16.5px;font-weight:500;line-height:1.2;color:var(--ink);background:var(--sunk);border:2px solid transparent;border-radius:16px;min-height:62px;padding:10px 14px;transition:transform .12s,background .15s}
.fps .choices .chip::before{content:"";flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:2px solid var(--line-ghost);background:var(--card);font-size:15px;font-weight:700;line-height:1}
.fps .choices .chip:hover:not(:disabled){transform:translateY(-1px);border-color:var(--pitch);color:var(--ink)}
.fps .choices .chip.on{background:var(--pitch);border-color:var(--pitch);color:#fff}
.fps .choices .chip.on::before{content:"✓";background:var(--volt);border-color:var(--volt);color:var(--on-volt)}
/* Pair or solo: four tiles, and the faces under them. */
.fps .fpp-pair2{--w:#047857}.fps .fpp-pair1{--w:#1d4ed8}.fps .fpp-solo1{--w:#b45309}.fps .fpp-solo2{--w:#be123c}
.fps .fpp-work{gap:8px}
.fps .fpp-opt{display:flex;flex-direction:column;justify-content:space-between;gap:16px;font-size:18px;font-weight:600;line-height:1.2;letter-spacing:-.01em;background:color-mix(in srgb,var(--w) 10%,var(--card));border:0;box-shadow:inset 0 6px 0 var(--w);border-radius:18px;padding:22px 18px 18px;min-height:128px}
.fps .fpp-opt::before{content:"";width:28px;height:28px;border-radius:50%;display:grid;place-items:center;border:2px solid var(--w);background:var(--card);font-size:16px;font-weight:700;line-height:1}
.fps .fpp-opt.on{background:var(--w);color:#fff;box-shadow:none}
.fps .fpp-opt.on::before{content:"✓";border-color:#fff;background:#fff;color:var(--w)}
.fps .fps-team{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 8px}
.fps .fps-team .field{grid-row:span 2;grid-template-rows:subgrid;align-content:start;gap:14px;background:var(--sunk);border-radius:18px;padding:20px 20px 22px}
.fps .fps-team .ask{font-size:18px;font-weight:600;line-height:1.25;text-wrap:balance;align-self:center}
.fps .fps-team .fpp-faces{align-content:start}
.fps .fpp-faces{grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
.fps .fpp-face{position:relative;background:var(--card);border-radius:16px;padding:12px 6px 10px}
.fps .fpp-pic{width:54px;height:54px;font-size:18px;background:hsl(var(--h,170) 58% 32%);color:#fff}
.fps .fpp-face.on{background:var(--pitch);border-color:var(--pitch);color:#fff}
.fps .fpp-face.on .fpp-pic{box-shadow:0 0 0 3px var(--volt)}
.fps .fpp-face.on::after{content:"✓";position:absolute;top:7px;right:7px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;line-height:1;background:var(--volt);color:var(--on-volt)}
.fps .fpp-result{margin:28px 40px 0;border-radius:22px;padding:22px 28px}
/* The foot stays in reach: how far along, and the button. */
.fps .foot{position:sticky;bottom:0;z-index:5;margin-top:0;min-height:0;padding:14px 40px;gap:8px 18px;border-top:0;background:var(--deep);color:#fff}
.fps .fps-meter{order:2;flex:1 1 180px;height:12px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden}
.fps .fps-meter i{display:block;height:100%;border-radius:999px;background:var(--volt);transition:width .3s ease}
.fps .foot .say{order:1;flex:0 1 auto;min-width:0;font-size:17px;color:var(--chalk)}
.fps .foot .say b{color:var(--volt)}
.fps .foot .bad{color:#fde68a}
.fps .foot .status{order:3;color:var(--chalk)}
.fps .foot .status:empty{display:none}
.fps .foot .btn.primary{order:4;min-height:50px;padding:0 28px;font-size:17px;font-weight:700;border-radius:999px;background:var(--volt);border-color:var(--volt);color:var(--on-volt)}
@media (max-width:900px){
.fps .fps-band,.fps .fpp-mine{grid-template-columns:1fr}
.fps .fpt{grid-template-columns:1fr}
.fps .fpt-tabs{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.fps .fpt-tab{min-height:0;padding:12px 10px 13px 16px;gap:8px}
.fps .fpt-tab.on{margin-right:0;padding-right:10px;border-radius:18px}
.fps .fpt-tab .fpt-rq,.fps .fpt-tab .fpt-rp,.fps .fpt-tab .fpt-rc,.fps .fpt-tab .fpt-ra,.fps .fpt-tab .fpt-ct{display:none}
.fps .fpt-tab .fpt-num{display:none}
.fps .fpt-tabn{font-size:13px;letter-spacing:.08em}
.fps .fpt-pips i{width:auto;flex:1}
.fps .fpt-pips{flex:1}
.fps .fpt-paper{display:grid;gap:8px}
.fps .fpt-entry{min-height:0;padding-right:18px}
.fps .fpt-entry .fpt-num{font-size:60px;top:8px;right:14px}
.fps .fpt-entry .fpt-rq{padding-right:44px}
.fps .fpt-entry .fpt-rp,.fps .fpt-entry .fpt-rc{display:block}
.fps .fpt-entry.on{background:var(--w);color:#fff}
.fps .fpt-entry.on .fpt-num{color:#fff;opacity:.26}
.fps .choices{grid-template-columns:repeat(2,minmax(0,1fr))}
.fps .fpp-wall{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:860px){
.fps .head{padding:32px 20px 30px}
.fps .head::before{right:-330px;opacity:.7}
.fps .head::after{right:-61px}
.fps .part{padding:16px 16px 0}
.fps .part:last-of-type{padding-bottom:22px}
.fps .fps-band{padding:20px 20px 22px}
.fps .fps-band.hero{padding:24px 20px 26px}
.fps .fps-band .phead .n{font-size:24px}
.fps .fps-band .hint{font-size:17px}
.fps .fpp-mine{padding:18px 18px 20px}
.fps .fpp-eg{padding:18px 16px 18px}
.fps .fpt-note{padding:16px 20px;font-size:17px}
.fps .fpp-result{margin:16px 16px 0}
.fps .foot{padding:10px 16px 12px}
}
@media (max-width:760px){
.fps .fps-sites{grid-template-columns:44px minmax(0,1fr);gap:8px 6px}
.fps .fps-rowh{display:none}
.fps .fps-row{padding:14px 14px 16px 4px;row-gap:12px}
.fps .fps-sn{grid-row:span 3}
.fps .fps-sc{grid-column:2}
.fps .fps-sc::before{display:block}
.fps .fps-team{grid-template-columns:1fr;gap:8px}
}
@media (max-width:600px){
.fps{padding-inline:8px;padding-block:8px 40px}
.fps .sheet{border-radius:22px}
.fps .fpt-pick{border-radius:18px;width:100%}
.fps .fpt-picks{grid-template-columns:1fr}
.fps .fpp-wall{grid-template-columns:1fr;gap:5px}
.fps .fpp-egt{min-height:42px;padding-block:6px}
.fps .fpt-fields{grid-template-rows:none}
.fps .fpp-ega{font-size:14px;padding:0 12px}
.fps .fpp-egt{font-size:15px}
.fps .fpt-fields{grid-template-columns:1fr;gap:18px}
.fps .fpt-panel{padding:18px 14px 16px;border-radius:18px}
.fps .fpt-f-topic .para{font-size:21px;padding:13px 14px}
.fps .fpp-opt{min-height:112px;font-size:17px;padding:20px 14px 14px}
.fps .foot{gap:8px;padding-inline:12px}
.fps .foot .say{font-size:15.5px}
.fps .foot .status{flex:1;font-size:13px}
.fps .foot .btn.primary{min-height:46px;padding:0 16px;font-size:15.5px}
.fps .fps-meter{order:0;flex:0 0 100%;height:8px}
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
