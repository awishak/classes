// Sit-Down 2, for the student: /<class>/sitdown2. Their ten minutes, the
// slots to pick from, the guide to write, the guidelines. The instructor sees
// every slot with every name on the same address, can put anyone anywhere,
// and can read the page as any student.
//
// Andrew, 2026-11-06, the slots: Thursday, November 12, 8:30 to 11:30 AM and
// 2:30 to 3:30 PM; Friday, November 13, 9:15 to 10:15 AM and 11:45 AM to
// 2 PM, all Pacific, all in Vari Hall 206. The facts are in facts.js, the
// words below are drafts for him to edit in place (Edit the words), and the
// look is Sit-Down 1's (SitdownPage.jsx), so the two pages read as one thing.
//
// A pick writes through saveMerged with mergeSlots, never through update, so
// a room of phones tapping at once cannot overwrite each other. See facts.js.

import { useEffect, useState } from "react";
import { useClassData, saveMerged } from "../store.js";
import { rosterOf, nameShown } from "../roster.js";
import { realStudents } from "../sections.js";
import { useSession, studentFor } from "../session.js";
import { useCopy, Words } from "../visualstory/pre.jsx";
import { CSS as SD_CSS, FONTS } from "../SitdownPage.jsx";
import { useStudentTheme, useDayNight, ThemeStyle } from "../ThemeShell.jsx";
import { setClassFavicon } from "../favicon.js";
import TopNav, { NAV_STUDENT } from "../TopNav.jsx";
import { SITDOWN2, BLOCKS, slotsIn, slotOf, whenOf, blockHours, bookings, slotFor, unplaced, book, mergeSlots, countdown, locked, pastDue, assignHref, guideHref } from "./facts.js";

export const WORDS_ROW = "sitdown2-words-plan";
export const WORDS = {
  title: SITDOWN2.title,
  intro: "A sit-down is a meeting with me. Last time it was your whole group. This time it's just you and me, for ten minutes, and we talk about your Culture Guide.",   // voice-ok: Sit-Down 1's intro, his
  director: "Meeting director",
  "head.steps": "How the sit-down works",
  "step.1": "Pick your time below. Each slot holds one student. Tap an open one and it shows You. You can move it until " + SITDOWN2.lockText + ".",
  "step.2": "Write your Culture Guide. It is a page on this site, it saves as you type, and it is due " + SITDOWN2.dueText + ", whichever day your meeting is.",
  "step.2.link": "Open your Culture Guide",
  "step.3": "Come to " + SITDOWN2.room + " five minutes early.",
  "head.times": "Step 1: Pick your time",
  "times.note": "All times are Pacific. Tap the time you want.",
  "times.locked": "Times are locked now. Message Dr. Ishak if you need to move.",
  "head.guide": "Step 2: Write your Culture Guide",
  "guide.p": "Your Culture Guide lives on this site. Once you complete it, you'll have the opportunity to read it as a whole here, or export it so you can keep it as a Google Doc or another format.",   // voice-ok: his sentence
  "band.none": "You have not picked a time yet.",
  where: SITDOWN2.room + ", Dr. Ishak's office",
};

const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
const first = (name) => String(name || "").split(" ")[0];

export default function Sitdown2Page({ config }) {
  const [data, update, apply] = useClassData(config.storageKey);
  const { session, email, instructor } = useSession();
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const [editing, setEditing] = useState(false);
  const [as, setAs] = useState(() => { try { return new URLSearchParams(window.location.search).get("as") || ""; } catch { return ""; } });
  const copy = useCopy(!!(session && instructor), WORDS_ROW, WORDS);

  useEffect(() => { document.title = config.code + " · " + SITDOWN2.title; setClassFavicon(config); }, [config]);

  const roster = rosterOf(config, data);
  const me = studentFor(email, roster);
  const allowed = !!session && (instructor || !!me);
  const pickAs = (name) => {
    setAs(name);
    try { const u = new URL(window.location.href); if (name) u.searchParams.set("as", name); else u.searchParams.delete("as"); window.history.replaceState(null, "", u.pathname + u.search); } catch { /* fine */ }
  };
  const next = typeof window !== "undefined" ? window.location.pathname : config.path;
  let gate = null;
  if (!session) gate = (<><p className="p">This page runs on your email sign-in.</p><a className="dl" href={"/login?next=" + encodeURIComponent(next)}>Sign in</a></>);
  else if (data === null) gate = <p className="p">Loading the class.</p>;
  else if (!allowed) gate = <p className="p">{email} is not on the roster for {config.code} yet.</p>;

  const students = realStudents(config, roster).filter(s => s.name);
  const viewerName = instructor && !as ? "" : (as || me?.name || "");

  // The one write: this writer's change on the server's row.
  const place = async (key, name) => {
    const out = await saveMerged(config.storageKey, prev => book(prev, key, name), mergeSlots);
    if (!out) return { ok: false, why: "That did not save. Check your connection and try again." };
    apply(out);
    const got = slotFor(out, name);
    if (!key) return { ok: !got, why: got ? "That did not go through." : "" };
    return got && got.key === key ? { ok: true, why: "" } : { ok: false, why: "Someone took that time just now. Pick another." };
  };

  return (
    <div className="sd-root" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      {FONTS}
      <style>{SD_CSS + CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}><TopNav config={config} tabs={NAV_STUDENT} active="assignments" /></div>
      {gate ? <div className="sd gate">{gate}</div> : (
        <div className="sd">
          <header className="top">
            <div className="eyebrow">{config.code}</div>
            <Words k="title" copy={copy} editing={editing} as="h1" className="h1" />
            <Words k="intro" copy={copy} editing={editing} as="p" className="intro" />
            {instructor ? (
              <div className="bar">
                <button type="button" className="btn" aria-pressed={editing} onClick={() => setEditing(e => !e)}>{editing ? "Done editing the words" : "Edit the words"}</button>
                <label className="as"><span>See the page as</span>
                  <select value={as} onChange={e => pickAs(e.target.value)}>
                    <option value="">Me, every slot</option>
                    {students.map(s => <option key={s.name} value={s.name}>{nameShown(data, s.name)}</option>)}
                  </select>
                </label>
                <a className="btn" href={assignHref(config)}>Assign the two concepts</a>
                <a className="lnk" href={guideHref(config) + "?review"}>Read every guide</a>
                <span className="meta" aria-live="polite">{copy.status || (editing ? "Change any line students read. Clear a line to put the original back." : "")}</span>
              </div>
            ) : null}
          </header>
          {viewerName
            ? <Mine config={config} data={data} name={viewerName} copy={copy} editing={editing} place={place} canMove={instructor || !locked()} guide={guideHref(config) + (instructor && as ? "?s=" + encodeURIComponent(as) : "")} />
            : <Everyone config={config} data={data} students={students} place={place} />}
        </div>
      )}
    </div>
  );
}

function Mine({ config, data, name, copy, editing, place, canMove, guide }) {
  const mine = slotFor(data, name);
  const count = countdown(mine);
  const [said, setSaid] = useState("");
  const [busy, setBusy] = useState("");
  const done = [!!mine, false, !!mine && mine.ms + SITDOWN2.minutes * 60000 < Date.now()];
  const nextStep = done.findIndex(d => !d);
  const rowClass = (i) => "step" + (done[i] ? " done" : "") + (i === nextStep ? " next" : "");
  const tap = async (key) => {
    if (!canMove || busy) return;
    setBusy(key); setSaid("");
    const r = await place(key, name);
    setBusy("");
    setSaid(r.ok ? (key ? "You have " + whenOf(slotOf(key)) + "." : "Your time is cleared.") : r.why);
  };
  const all = bookings(data);
  const timesFirst = !mine;
  const timesSection = (
    <section className="sec" id="times">
      <Words k="head.times" copy={copy} editing={editing} as="h2" className="h2" />
      <Words k={canMove ? "times.note" : "times.locked"} copy={copy} editing={editing} as="p" className="p" />
      <Calendar data={data} name={name} canMove={canMove} busy={busy} mine={mine} onTap={tap} />
      {said ? <p className="meta" aria-live="polite">{said}</p> : null}
    </section>

  );
  // The chooser first, before the steps, until a time is picked. Andrew,
  // 2026-11-06: "the time chooser needs to be obvious on the first page."
  return (<>
    <section className="sec snap" id="when">
      <div className="band">
        <div className="bk"><span className="eyebrow">Your sit-down</span>{count ? <span className="count">{count}</span> : null}</div>
        {mine ? (<><div className="big">{whenOf(mine)}</div><Words k="where" copy={copy} editing={editing} as="div" className="where" /></>)
          : <Words k="band.none" copy={copy} editing={editing} as="p" className="p" />}
      </div>
    </section>

    {timesFirst ? timesSection : null}
    <section className="sec" id="steps">
      <Words k="head.steps" copy={copy} editing={editing} as="h2" className="h2" />
      <ol className="steps">
        <li className={rowClass(0)}><span className="num" aria-hidden="true">{done[0] ? "✓" : "1"}</span>
          <div className="sw"><div className="sws"><Words k="step.1" copy={copy} editing={editing} as="span" /></div>
            <div className={"sdt" + (done[0] ? " ok" : "")}>{mine ? whenOf(mine) : "Not picked yet"}</div>
            <a className="btn" href="#times">{mine ? "Move my time" : "Pick a time"}</a></div></li>
        <li className={rowClass(1)}><span className="num" aria-hidden="true">2</span>
          <div className="sw"><div className="sws"><Words k="step.2" copy={copy} editing={editing} as="span" /></div>
            <div className={"sdt" + (pastDue() ? " late" : "")}>{(pastDue() ? "Was due " : "Due ") + SITDOWN2.dueText}</div>
            <a className="btn" href={guide}>{copy.say("step.2.link")}</a></div></li>
        <li className={rowClass(2)}><span className="num" aria-hidden="true">{done[2] ? "✓" : "3"}</span>
          <div className="sw"><div className="sws"><Words k="step.3" copy={copy} editing={editing} as="span" /></div>
            <div className="sdt">{(mine ? whenOf(mine) + ", " : "") + SITDOWN2.room}</div></div></li>
      </ol>
    </section>

    <section className="sec" id="guide">
      <Words k="head.guide" copy={copy} editing={editing} as="h2" className="h2" />
      <Words k="guide.p" copy={copy} editing={editing} as="p" className="p" />
      <a className="btn" href={guide}>{copy.say("step.2.link")}</a>
    </section>

    {timesFirst ? null : timesSection}
  </>);
}

// The chooser as a calendar: the four blocks across like days, each block's
// times in a list going down. Andrew, 2026-11-06: "make the time chooser look
// like google calendar in a way. dates across, times in a list going down",
// then "do four dates: thursday morning, thurs afternoon, and so on."
function Calendar({ data, name, canMove, busy, mine, onTap }) {
  const all = bookings(data);
  // A tap picks; Confirm books. Andrew, 2026-11-06: "the way a student chooses a time is weird."
  const [pending, setPending] = useState("");
  return (
    <div className="cal" role="group" aria-label="Times">
      <div className="calhead">
        {BLOCKS.map(b => <div key={b.key} className="calday"><b>{b.day.split(",")[0] + " " + b.part}</b><span>{b.day.split(",")[1].trim() + ", " + blockHours(b)}</span></div>)}
      </div>
      <div className="calbody">
        {BLOCKS.map(b => (
          <div key={b.key} className="calcol">
            {slotsIn(b).map(s => {
              const who = all[s.key];
              const isMine = who && same(who.name, name);
              if (isMine) return <span key={s.key} className="cs mine"><b>{s.say}</b><i>You</i>{canMove ? <button type="button" className="px" aria-label="Clear my time" disabled={!!busy} onClick={() => onTap("")}>×</button> : null}</span>;
              if (who) return <span key={s.key} className="cs gone"><b>{s.say}</b><i>{nameShown(data, who.name)}</i></span>;
              if (!canMove) return <span key={s.key} className="cs free"><b>{s.say}</b><i>Open</i></span>;
              if (pending === s.key) return (
                <span key={s.key} className="cs ask">
                  <b>{s.say}</b>
                  <button type="button" className="go small" disabled={!!busy} onClick={() => { setPending(""); onTap(s.key); }}>{busy === s.key ? "Saving" : mine ? "Move here" : "Confirm"}</button>
                  <button type="button" className="px" aria-label="Not this time" onClick={() => setPending("")}>×</button>
                </span>
              );
              return <button key={s.key} type="button" className="cs free" disabled={!!busy} aria-label={(mine ? "Move to " : "Pick ") + whenOf(s)} onClick={() => setPending(s.key)}><b>{s.say}</b><i>Open</i></button>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// Every slot with its name, a menu on each to put anyone there, and who has none.
function Everyone({ config, data, students, place }) {
  const all = bookings(data);
  const [said, setSaid] = useState("");
  const [busy, setBusy] = useState("");
  const none = unplaced(data, students);
  const set = async (key, name) => {
    setBusy(key); setSaid("");
    const r = name ? await place(key, name) : await place("", (all[key] || {}).name);
    setBusy("");
    setSaid(r.ok ? (name ? nameShown(data, name) + " has " + whenOf(slotOf(key)) + "." : "Cleared.") : r.why);
  };
  const placed = Object.keys(all).length;
  return (<>
    <section className="sec">
      <h2 className="h2">{placed + " of " + students.length + " have a time"}</h2>
      <p className="p">{none.length ? "No time yet: " + none.map(s => nameShown(data, s.name)).join(", ") + "." : "Everyone has a time."}</p>
      {said ? <p className="meta" aria-live="polite">{said}</p> : null}
      <div className="blocks">
        {BLOCKS.map(b => (
          <div key={b.key} className="block">
            <div className="bh"><b>{b.day + ", " + b.part}</b><span>{blockHours(b)}</span></div>
            {slotsIn(b).map(s => {
              const who = all[s.key];
              return (
                <div key={s.key} className={"slot" + (who ? " gone" : " free")}>
                  <span className="t">{s.say}</span>
                  <select className="pick" value={who ? who.name : ""} disabled={!!busy} aria-label={"Who has " + whenOf(s)} onChange={e => set(s.key, e.target.value)}>
                    <option value="">{who ? "Clear" : "Open"}</option>
                    {who && !students.some(x => same(x.name, who.name)) ? <option value={who.name}>{nameShown(data, who.name)}</option> : null}
                    {students.map(x => <option key={x.name} value={x.name}>{nameShown(data, x.name) + (slotFor(data, x.name) && !same(x.name, who?.name) ? " (has " + slotFor(data, x.name).say + ")" : "")}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  </>);
}

const CSS = `
.sd .blocks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;width:100%}
.sd .block{background:var(--sunk);border-radius:var(--rr);overflow:hidden;display:grid;align-content:start}
.sd .block .bh{display:grid;gap:2px;padding:14px 16px 12px;border-bottom:1px solid var(--line)}
.sd .block .bh b{font-family:var(--serif);font-size:19px;font-weight:500;line-height:1.2}
.sd .block .bh span{font-size:14px;color:var(--ink2)}
.sd .slot{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 12px 6px 16px;min-height:48px;border-top:1px solid var(--line);background:var(--card);font-size:17px}
.sd .slot .t{font-variant-numeric:tabular-nums;font-weight:600;min-width:72px}
.sd .slot.gone .t{color:var(--ink2);font-weight:400}
.sd .slot.gone .who{font-size:14px;font-weight:600;color:var(--ink2);background:var(--sunk);padding:4px 10px;border-radius:999px}
.sd .slot.free .who{font-size:14px;font-weight:600;color:var(--ok)}
.sd .slot.mine{background:var(--accent-tint)}
.sd .slot.mine .who{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:var(--accent)}
.sd .slot .open{font-family:var(--sans);font-size:14px;font-weight:600;min-height:36px;line-height:36px;padding:0 14px;border:0;cursor:pointer}
.sd .slot .open:disabled{opacity:.5;cursor:default}
.sd .slot .lnk.small{font-size:14px;min-height:36px}
.sd .slot .pick{font-family:var(--sans);font-size:15px;min-height:36px;max-width:60%;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:0 8px}
@media (max-width:720px){.sd .blocks{grid-template-columns:1fr}}
/* The student's chooser as a calendar: four blocks across, each block's times down. */
.sd .cal{width:100%;border:1px solid var(--line);border-radius:var(--rr);overflow:hidden;background:var(--card)}
.sd .calhead,.sd .calbody{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.sd .calhead{border-bottom:1px solid var(--line);background:var(--sunk)}
.sd .calday{padding:10px 12px;display:grid;gap:2px;border-left:1px solid var(--line);min-width:0}
.sd .calday:first-child,.sd .calcol:first-child{border-left:0}
.sd .calday b{font-family:var(--serif);font-size:17px;font-weight:500;line-height:1.2}
.sd .calday span{font-size:12px;color:var(--ink2);line-height:1.3}
.sd .calcol{border-left:1px solid var(--line);display:grid;gap:4px;padding:6px;align-content:start;min-width:0}
.sd .cs{box-sizing:border-box;display:flex;align-items:center;gap:8px;min-height:32px;padding:0 9px;border-radius:6px;font-family:var(--sans);font-size:13px;line-height:1;border:1.5px solid transparent;overflow:hidden;white-space:nowrap;text-align:left;min-width:0}
.sd .cs b{font-weight:600;font-variant-numeric:tabular-nums;flex:none}
.sd .cs i{font-style:normal;font-size:12px;overflow:hidden;text-overflow:ellipsis;min-width:0}
.sd .cs.free{background:var(--card);color:var(--ink);border-color:var(--line);cursor:pointer;justify-content:space-between}
.sd .cs.free i{color:var(--accent);font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase}
.sd .cs.free:hover:not(:disabled){border-color:var(--accent);background:var(--accent-tint)}
.sd .cs.free:disabled{opacity:.5;cursor:default}
.sd .cs.ask{background:var(--accent-tint);color:var(--ink);border-color:var(--accent);min-height:40px}
.sd .cs.ask .go.small{font-size:13px;font-weight:600;min-height:28px;line-height:28px;padding:0 12px;margin-left:auto}
.sd .cs.ask .px{background:var(--card);color:var(--ink);margin-left:0}
.sd .cs.gone{background:var(--sunk);color:var(--ink2);border-color:var(--line)}
.sd .cs.gone i{color:var(--ink)}
.sd .cs.mine{background:var(--accent);color:var(--on-accent)}
.sd .cs.mine i{letter-spacing:.06em;text-transform:uppercase;opacity:.9}
.sd .cs .px{font:inherit;font-size:14px;line-height:1;width:20px;height:20px;border-radius:999px;border:0;background:rgba(255,255,255,.25);color:inherit;cursor:pointer;display:inline-grid;place-items:center;margin-left:auto;flex:none}
.sd .cs:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:720px){.sd .calhead,.sd .calbody{grid-template-columns:repeat(2,minmax(0,1fr))}.sd .calday:nth-child(3),.sd .calcol:nth-child(3){border-left:0}.sd .calday{padding:8px}.sd .cs{padding:0 6px;gap:5px}}
`;
