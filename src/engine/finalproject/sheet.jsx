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

import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { authHeaders } from "../session.js";
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
    topicHead: "What do you want to work on in this class?",
    topicHint: "Examples: housing, food access, immigration, disability access, environmental justice, education, health care, voting rights.",
    whyAsk: "Why do you think this idea is interesting?",
    angleAsk: "What angle will you take to have a unique and engaging story?",
    justiceAsk: "How does this idea qualify as a social justice topic?",
  },
  comm118: {
    credit: "COMM 118. Due Wednesday, November 18, at 11:59 PM.",
    intro: "Your final project is an exploration of a topic in communication and sport.",
    topicHead: "What do you want to work on in this class?",
    topicHint: "A topic would be like transnational athletes in the Olympics, or female referees in male dominated sports.",
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

export function PrefsSheet({ store, viewer, classId, storageKey, readOnly = false, storage, editor = false, theme, classmates = [], photos = {} }) {
  const copy = useCopy(editor, copyRow(classId), defaultCopy(classId));
  const [editing, setEditing] = useState(false);
  const [handing, setHanding] = useState("");
  const [data] = useClassState(storageKey || "");
  const draftKey = M.FINAL_PREFS_KEY + ":" + (classId || "") + ":" + (viewer?.id || "");
  const { answers, set, submitted, setSubmitted, status, saver } = useSheet({ store, draftKey, readOnly, storage });
  const mine = useMine(classId, viewer?.id, readOnly);

  const root = { className: "as fpp" + (readOnly ? " ro" : ""), "data-theme": theme || undefined };
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
  const ideaDone = (s) => (justice ? ["topic", ...M.IDEA_PARTS] : ["topic", "ask"]).every(f => !blank(answers, f + ":" + s));
  const say = handSay(handing, left) || (submitted ? <>Submitted <b>{when(submitted)}</b>.</> : <><b>{need - left.length} of {need}</b> answered</>);
  const approved = new Set((mine?.topics || []).map(t => t.slot));

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

        <section className="part">
          <div className="phead"><Words k="topicHead" copy={copy} editing={editing} className="n" /><span className="sub">{M.SLOTS.filter(ideaDone).length} of 3</span></div>
          <Words k="topicHint" copy={copy} editing={editing} as="p" className="hint" />
          <div className="ideas">
            {M.SLOTS.map((s, i) => (
              <div key={s} className="box">
                {approved.has(s) ? <span className="mark ok">{copy.say("approvedSay")}</span> : null}
                {mine?.says?.[s]?.length ? <ul className="reasons close">{mine.says[s].map(r => <li key={r}>{r}</li>)}</ul> : null}
                <label className="field">
                  <Words k="topicAsk" copy={copy} editing={editing} className="ask" />
                  <Line id={"fp-topic-" + s} label={copy.say("topicAsk") + " " + (i + 1)} value={answers["topic:" + s]} readOnly={readOnly} onChange={v => set("topic:" + s, v)} />
                </label>
                {justice ? M.IDEA_PARTS.map(part => (
                  <div className="field" key={part}>
                    <Words k={part + "Ask"} copy={copy} editing={editing} className="ask" />
                    <Para id={"fp-" + part + "-" + s} label={copy.say(part + "Ask") + " Topic " + (i + 1)} value={answers[part + ":" + s]} readOnly={readOnly} onChange={v => set(part + ":" + s, v)} rows={3} max={2000} />
                  </div>
                )) : (
                  <div className="field">
                    <Words k="askAsk" copy={copy} editing={editing} className="ask" />
                    <Lines id={"fp-ask-" + s} label={copy.say("askAsk") + " Topic " + (i + 1)} value={answers["ask:" + s] || ""} readOnly={readOnly} onChange={v => set("ask:" + s, v)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="part">
          <div className="phead"><Words k="sitesHead" copy={copy} editing={editing} className="n" /><span className="sub">{M.SLOTS.filter(s => ["site:", "like:", "build:"].every(f => !blank(answers, f + s))).length} of 3</span></div>
          <Words k="sitesIntro" copy={copy} editing={editing} as="p" className="hint" />
          <div className="ideas">
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
          </div>
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
            <div className="say" aria-live="polite">{say}</div>
            <span className={"status" + (status === "retrying" || status === "failed-load" ? " bad" : "")} aria-live="polite">{STATUS[status]}</span>
            <button type="button" className="btn primary focusable" disabled={handing === "sending"} onClick={() => handIn({ saver, store, missing: M.missingOf(answers, classId), setHanding, setSubmitted })}>
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
.fpp .fpp-place{margin:0;font-size:22px;font-weight:500;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fpp .fpp-place .fpp-pic{width:44px;height:44px}
.fpp .box .mark{justify-self:start}
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
