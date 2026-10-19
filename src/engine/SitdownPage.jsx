// Sit-Down 1, for the student: /<class>/sitdown, and the prep at
// /<class>/sitdown/prep.
//
// Andrew, 2026-10-15: "students will be able to see who is in their group,
// when are they meeting? What are the roles of other people in their group?
// What are the assignment details in terms of what they have to prep?" And
// on the first draft, the same afternoon: "put the 4 people in me. I want
// you to put their avatars next to, like, your sit down ... How the sit down
// works should be higher ... put a link to the sit down prep right there ...
// also you put me up there. So I'm the, let's say, like, um, meeting
// director ... Sit down prep section. It needs to be on a different page."
//
// So, two pages on one component. The sit-down page: the day, the time and
// the room with the faces at the table and his, the three steps with the
// prep page linked from step one, the guidelines, the box to turn the Google
// Doc in (step one), and the table's documents once the prep is due (step
// two). The prep page: what goes in the document, page by page, with a hint
// for each person at the table (the pull between the two fields, from
// worktopia/roles.js) and the three questions a student asks at the end.
//
// The instructor sees every table with every link, can read either page as
// any student for showing the class, and can edit the words in place. The
// words are in worktopia/sitdownWords.js; the facts and the dates are in
// worktopia/sitdown.js. A turned-in link goes on the class row as
// sitdownLinks, and onto the My Work assignment's log when an assignment
// points at this page, so the grade view queues the work. See withLink.

import { useEffect, useState } from "react";
import { useClassData } from "./store.js";
import { rosterOf } from "./roster.js";
import { useSession, studentFor } from "./session.js";
import { usePhotos, useWithPhotos } from "./photos.js";
import { Face } from "./Face.jsx";
import { genId } from "../utils.jsx";
import { useCopy, Words } from "./visualstory/pre.jsx";
import { SESSIONS, SITDOWN, released, sessionOf, tableOf, promptFor, sitdownAssignment, linkOf, withLink, looksLikeLink } from "./worktopia/sitdown.js";
import { WORDS, WORDS_ROW, AI_PAGE_URL } from "./worktopia/sitdownWords.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_STUDENT } from "./TopNav.jsx";

// The instructor's sheet for each table, written after the prep is in. One
// file per class, loaded only for him. The shape is in the file.
const SHEETS = {
  comm118: () => import("../readouts/comm118-sitdown-1.json"),
};

// The Skylight look, the same tokens as the features page and
// drewi.sh/teaching: Fraunces for headings, Outfit for everything else,
// seaglass accent, off-white page, hairlines instead of cards. Andrew,
// 2026-10-15: "making the sit down page and the scouting report page look
// more like the skylight view." The seaglass is a shade darker here than on
// the features page, because it is text and a button here and the lighter
// one sits at 4.2:1 on the page.
const FONTS = <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Outfit:wght@400;500;600&display=swap" />;

const first = (name) => String(name || "").split(" ")[0];
const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
const fmtWhen = (ms) => new Date(ms).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const whenOf = (s) => s.day + ", " + s.time + " AM";
const hostOf = (link) => { try { return new URL(link).hostname.replace(/^www\./, ""); } catch { return link; } };
const prepPath = (config) => config.path + "/sitdown/prep";
const homePath = (config) => config.path + "/sitdown";

export default function SitdownPage({ config, page = "home" }) {
  const [stored, update] = useClassData(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const data = useWithPhotos(stored, photos);
  const { session, email, instructor } = useSession();
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  const [editing, setEditing] = useState(false);
  // The instructor reading the page as one student, for showing the class.
  const [as, setAs] = useState(() => { try { return new URLSearchParams(window.location.search).get("as") || ""; } catch { return ""; } });
  const copy = useCopy(!!(session && instructor), WORDS_ROW, WORDS);

  useEffect(() => {
    document.title = config.code + " · " + (page === "prep" ? WORDS["prep.title"] : SITDOWN.title);
    setClassFavicon(config);
  }, [config, page]);

  const roster = rosterOf(config, data);
  const me = studentFor(email, roster);
  const allowed = !!session && (instructor || !!me);

  const pickAs = (name) => {
    setAs(name);
    try {
      const u = new URL(window.location.href);
      if (name) u.searchParams.set("as", name); else u.searchParams.delete("as");
      window.history.replaceState(null, "", u.pathname + u.search);
    } catch { /* no address bar */ }
  };

  const next = typeof window !== "undefined" ? window.location.pathname : config.path;
  let gate = null;
  if (!session) gate = (<>
    <p className="p">This page runs on your email sign-in.</p>
    <a className="dl" href={"/login?next=" + encodeURIComponent(next)}>Sign in</a>
  </>);
  else if (data === null) gate = <p className="p">Loading the class.</p>;
  else if (!allowed) gate = <p className="p">{email} is not on the roster for {config.code} yet.</p>;

  const viewer = instructor && !as ? { instructor: true } : { name: as || me?.name || "" };

  return (
    <div className="sd-root" data-theme={theme} data-mode={mode}>
      <ThemeStyle theme={theme} />
      {FONTS}
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      {gate ? <div className="sd gate">{gate}</div> : (
        <SitdownBody config={config} data={data} update={update} viewer={viewer} copy={copy} editing={editing} page={page}
          instructor={!!instructor} onEdit={instructor ? () => setEditing(e => !e) : null} onAs={instructor ? pickAs : null} as={as} />
      )}
    </div>
  );
}

// The page under the bar. Exported for the smoke run, which hands in a class
// and a viewer of its own. `viewer` is { instructor: true } or { name }, the
// roster's name. `now` is for the render, so a test can sit before or after
// the release. `page` is "home" or "prep".
export function SitdownBody({ config, data, update, viewer, copy, editing = false, page = "home", instructor = false, onEdit, onAs, as = "", now = Date.now() }) {
  const saved = data?.sitdownRoles || {};
  const asg = sitdownAssignment(data?.assignments || config.assignments);
  const [sheet, setSheet] = useState(null);
  useEffect(() => {
    if (!instructor || !SHEETS[config.id]) return undefined;
    let alive = true;
    SHEETS[config.id]().then(m => { if (alive) setSheet(m.default || m); }).catch(() => {});
    return () => { alive = false; };
  }, [instructor, config.id]);
  const prep = page === "prep";
  const suffix = as ? "?as=" + encodeURIComponent(as) : "";

  return (
    <div className="sd">
      <header className="top">
        <div className="eyebrow">{prep ? <a className="crumb" href={homePath(config) + suffix}>{config.code + " · " + copy.say("title")}</a> : config.code}</div>
        <Words k={prep ? "prep.title" : "title"} copy={copy} editing={editing} as="h1" className="h1" />
        <Words k={prep ? "prep.intro" : "intro"} copy={copy} editing={editing} as="p" className="intro" />
        {instructor ? (
          <div className="bar">
            {onEdit ? <button type="button" className="btn" aria-pressed={editing} onClick={onEdit}>{editing ? "Done editing the words" : "Edit the words"}</button> : null}
            {onAs ? (
              <label className="as">
                <span>See the page as</span>
                <select value={as} onChange={e => onAs(e.target.value)}>
                  <option value="">Me, every table</option>
                  {SESSIONS.map(s => (
                    <optgroup key={s.key} label={whenOf(s)}>
                      {s.names.map(n => <option key={n} value={n}>{n}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
            ) : null}
            <a className="lnk" href={config.path + "/worksheets/worktopia/roles"}>Open the roles page</a>
            <span className="meta" aria-live="polite">{copy.status || (editing ? "Change any line students read. Clear a line to put the original back." : "")}</span>
          </div>
        ) : null}
      </header>

      {prep
        ? <Prep config={config} data={data} copy={copy} editing={editing} table={viewer.instructor ? null : tableOf(sessionOf(viewer.name), saved)} me={viewer.name} suffix={suffix} />
        : viewer.instructor
          ? <AllTables config={config} data={data} saved={saved} asg={asg} sheet={sheet} now={now} />
          : <Mine config={config} data={data} update={update} name={viewer.name} saved={saved} asg={asg} copy={copy} editing={editing} now={now} suffix={suffix} />}
    </div>
  );
}

// ─── the sit-down page, one student's view ───

// Skylight gives everyone in the house a colour and never changes it. Each
// person at a table gets one here, by their seat, and the same colour follows
// them: the ring on their face, their name, their row in the group's reports,
// their hint on the Scouting Report page. Eight slots, in CSS on `.pc`; every
// one checked at 4.5:1 as text on the sunk surface and with white inside.
const seatOf = (p) => {
  const s = sessionOf(p?.name || p?.roster);
  const i = s ? s.names.indexOf(p.name) : -1;
  if (i >= 0) return i % 8;
  let h = 0;
  for (const ch of String(p?.name || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 8;
};

// A session's moment, from its given day and time, so the page can count down.
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const whenMs = (s) => {
  const m = /([A-Z][a-z]+) (\d+)/.exec(s.day);
  const t = /(\d+):(\d+)/.exec(s.time);
  if (!m || !t) return 0;
  return new Date(new Date(SITDOWN.release).getFullYear(), MONTHS.indexOf(m[1]), Number(m[2]), Number(t[1]), Number(t[2])).getTime();
};
const dayStart = (ms) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
const countdown = (now, ms) => {
  if (!ms || ms < now) return "";
  const days = Math.round((dayStart(ms) - dayStart(now)) / 86400000);
  return days <= 0 ? "Today" : days === 1 ? "Tomorrow" : "In " + days + " days";
};
const fmtDay = (ms) => new Date(ms).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" });

function Mine({ config, data, update, name, saved, asg, copy, editing, now, suffix }) {
  const session = sessionOf(name);
  const table = tableOf(session, saved);
  const me = table.find(p => same(p.roster, name) || same(p.name, name)) || null;
  const others = table.filter(p => p !== me);
  const open = released(now);
  const mine = me ? linkOf(data, me.roster, asg) : null;
  const at = session ? whenMs(session) : 0;
  const count = countdown(now, at);
  const late = now > SITDOWN.prepDue;
  // The chore chart: step one ticks when the link is in, step three when the
  // sit-down is behind them. Step two is reading, which nothing here can see,
  // so that row only says whether the reports are open.
  const done = [!!mine, false, at > 0 && now > at];
  const [showAll, setShowAll] = useState(false);
  const next = done.findIndex(d => !d);
  const rowClass = (i, extra = "") => "step" + (done[i] ? " done" : "") + (i === next ? " next" : "") + extra;
  return (<>
    <section className="sec snap" id="when">
      <div className="band">
        <div className="bk">
          <span className="eyebrow">Your sit-down</span>
          {count ? <span className="count">{count}</span> : null}
        </div>
        {session ? (<>
          <div className="big">{whenOf(session)}</div>
          <div className="where">{SITDOWN.room + ", Dr. Ishak's office"}</div>
        </>) : <p className="p">You're not in a group yet. Message Dr. Ishak and we'll place you.</p>}
      </div>
      {session ? (
        <ul className="faces">
          {table.map(p => (
            <li key={p.name} className={"face pc" + (p === me ? " me" : "")} data-c={seatOf(p)}>
              <Face config={config} data={data} name={p.roster} size={76} accent="var(--pc)" />
              <div className="fn">{p === me ? "You" : first(p.name)}</div>
              <div className="fr">{p.role ? p.role.role : "Role to come"}</div>
            </li>
          ))}
          <li className="face host">
            <Face config={config} data={data} name="" size={76} instructor accent="var(--accent)" />
            <div className="fn"><span>{config.instructor?.name || "Dr. Ishak"}</span></div>
            <div className="fr"><Words k="director" copy={copy} editing={editing} as="span" /></div>
          </li>
        </ul>
      ) : null}
    </section>

    <section className="sec" id="steps">
      <Words k="head.steps" copy={copy} editing={editing} as="h2" className="h2" />
      <ol className="steps">
        <li className={rowClass(0)}>
          <span className="num" aria-hidden="true">{done[0] ? "✓" : "1"}</span>
          <div className="sw">
            <div className="sws">
              <Words k="step.1" copy={copy} editing={editing} as="span" />
              {" "}<a className="dl" href={prepPath(config) + suffix}>{copy.say("step.1.link")}</a>
            </div>
            <div className={"sdt" + (done[0] ? " ok" : late ? " late" : "")}>{done[0] ? "Turned in " + fmtWhen(mine.at) : (late ? "Was due " : "Due ") + SITDOWN.prepDueText}</div>
            <a className="btn" href={"#turnin"}>{copy.say("step.1.go")}</a>
          </div>
        </li>
        <li className={rowClass(1, open ? " ready" : "")}>
          <span className="num" aria-hidden="true">2</span>
          <div className="sw">
            <div className="sws"><Words k="step.2" copy={copy} editing={editing} as="span" /></div>
            <div className={"sdt" + (open ? " ok" : "")}>{open ? "Open now" : "Opens " + SITDOWN.releaseText}</div>
            {session ? <a className="btn" href={"#docs"}>{copy.say("step.2.go")}</a> : null}
          </div>
        </li>
        <li className={rowClass(2)}>
          <span className="num" aria-hidden="true">{done[2] ? "✓" : "3"}</span>
          <div className="sw">
            <div className="sws"><Words k="step.3" copy={copy} editing={editing} as="span" /></div>
            <div className="sdt">{(session ? whenOf(session) + ", " : "") + SITDOWN.room}</div>
            {session ? <a className="btn" href={"#when"}>{copy.say("step.3.go")}</a> : null}
          </div>
        </li>
      </ol>
    </section>

    <section className="sec">
      <Words k="head.guidelines" copy={copy} editing={editing} as="h2" className="h2" />
      <ul className="list">
        {["guide.1", "guide.3"].map(k => <li key={k}><Words k={k} copy={copy} editing={editing} as="span" /></li>)}
      </ul>
    </section>

    <TurnIn config={config} data={data} update={update} name={me?.roster || name} asg={asg} copy={copy} editing={editing} now={now} suffix={suffix} />

    {session ? (
      <section className="sec" id="docs">
        <div className="tag"><span className="num" aria-hidden="true">2</span><span className="eyebrow">Step 2</span></div>
        <Words k="head.docs" copy={copy} editing={editing} as="h2" className="h2" />
        <Words k={open ? "docs.after" : "docs.before"} copy={copy} editing={editing} as="p" className="p" />
        <ul className="docs">
          {others.map(p => {
            const l = linkOf(data, p.roster, asg);
            return (
              <li key={p.name} className="doc pc" data-c={seatOf(p)}>
                <div className="dn">
                  <Face config={config} data={data} name={p.roster} size={44} accent="var(--pc)" />
                  <span className="dnw"><b>{p.name}</b><span className="dr">{p.role ? p.role.role : ""}</span></span>
                </div>
                {open && l ? <a className="open" href={l.link} target="_blank" rel="noopener noreferrer">{"Open " + first(p.name) + "'s report"}<span className="dh">{hostOf(l.link)}</span></a>
                  : l ? <span className="ds ok">Turned in</span>
                  : <span className="ds">Not turned in yet</span>}
              </li>
            );
          })}
        </ul>
      </section>
    ) : null}

    <section className="sec" id="all">
      <div className="sh">
        <Words k="head.all" copy={copy} editing={editing} as="h2" className="h2" />
        <button type="button" className="btn" aria-expanded={showAll} aria-controls="sd-groups" onClick={() => setShowAll(v => !v)}>{copy.say(showAll ? "all.hide" : "all.show")}</button>
      </div>
      {showAll ? (
        <div className="groups" id="sd-groups">
          {SESSIONS.map(s => (
            <div key={s.key} className={"group" + (s === session ? " mine" : "")}>
              <h3 className="h3">{whenOf(s)}</h3>
              <ul className="people">
                {tableOf(s, saved).map(p => (
                  <li key={p.name} className="person pc" data-c={seatOf(p)}>
                    <Face config={config} data={data} name={p.roster} size={40} accent="var(--pc)" />
                    <span className="pw"><b>{p === me || (me && same(p.roster, me.roster)) ? "You" : p.name}</b><span className="pj">{p.role ? p.role.role : "Role to come"}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  </>);
}

function TurnIn({ config, data, update, name, asg, copy, editing, now, suffix }) {
  const mine = name ? linkOf(data, name, asg) : null;
  const [link, setLink] = useState("");
  const [changing, setChanging] = useState(false);
  const [said, setSaid] = useState("");
  const ok = looksLikeLink(link);
  const submit = () => {
    if (!ok || !name || !update) return;
    const at = Date.now();
    update(d => withLink(d, name, link.trim(), asg, at, genId()));
    setLink(""); setChanging(false); setSaid("Turned in. Your group sees the link once the prep is due.");
  };
  const late = now > SITDOWN.prepDue;
  return (
    <section className="sec" id="turnin">
      <div className="tag"><span className={"num" + (mine ? " ok" : "")} aria-hidden="true">{mine ? "✓" : "1"}</span><span className="eyebrow">Step 1</span></div>
      <Words k="head.turnin" copy={copy} editing={editing} as="h2" className="h2" />
      <div className={"due" + (mine ? " ok" : late ? " late" : "")}>{mine ? "Turned in " + fmtWhen(mine.at) : "Due " + SITDOWN.prepDueText}</div>
      <Words k="prep.turnin" copy={copy} editing={editing} as="p" className="p" />
      <a className="dl" href={prepPath(config) + suffix}>{copy.say("step.1.link")}</a>
      {mine && !changing ? (
        <div className="in">
          <a className="open" href={mine.link} target="_blank" rel="noopener noreferrer">Open your document<span className="dh">{hostOf(mine.link)}</span></a>
          <button type="button" className="lnk" onClick={() => setChanging(true)}>Change the link</button>
          {said ? <p className="meta" aria-live="polite">{said}</p> : null}
        </div>
      ) : (
        <div className="form">
          <label className="lab" htmlFor="sd-link">The link to your Google Doc</label>
          <input id="sd-link" className="input" type="url" inputMode="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
          <div className="row">
            <button type="button" className="go" disabled={!ok} onClick={submit}>{mine ? "Replace the link" : "Turn in the link"}</button>
            {changing ? <button type="button" className="lnk" onClick={() => setChanging(false)}>Keep the link I turned in</button> : null}
          </div>
          <p className="meta">{late ? "The prep was due " + SITDOWN.prepDueText + ". A link still goes in, marked with the time." : "Make sure anyone with the link can view. You can replace the link until the prep is due."}</p>
        </div>
      )}
    </section>
  );
}

// ─── the prep page ───

// The line above each hint, one per table-mate in turn. His four, 2026-10-15.
const HINT_LEADS = ["hint.lead", "hint.lead.2", "hint.lead.3", "hint.lead.4"];

// A heading of his split at its colon, so "Page one: your job" can sit on a
// page tile as a label and a line. A heading with no colon is the label.
const splitHead = (s) => { const i = String(s || "").indexOf(":"); return i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + 1).trim()]; };

function Prep({ config, data, copy, editing, table, me, suffix = "" }) {
  const mine = table ? table.find(p => same(p.roster, me) || same(p.name, me)) : null;
  const others = table && mine ? table.filter(p => p !== mine) : [];
  const W = (k, as = "p", className = "p") => <Words k={k} copy={copy} editing={editing} as={as} className={className} />;
  const [p1, p1line] = splitHead(copy.say("head.page1"));
  const [p23, p23line] = splitHead(copy.say("head.others"));
  return (<>
    <section className="sec">
      {W("prep.shape")}
      <div className="pages" aria-hidden="true">
        <a className="page" href="#page1">
          <span className="num">1</span>
          <span className="pgl">{p1}</span>
          <span className="pgw">{p1line}</span>
        </a>
        <a className="page wide" href="#others">
          <span className="num">2</span><span className="num">3</span>
          <span className="pgl">{p23}</span>
          <span className="pgw">{p23line}</span>
          {others.length ? (
            <span className="pgf">{others.map(p => <span key={p.name} className="pc" data-c={seatOf(p)}><Face config={config} data={data} name={p.roster} size={36} accent="var(--pc)" /></span>)}</span>
          ) : null}
        </a>
      </div>
      <a className="dl" href={homePath(config) + suffix}>Back to the Sit-Down page</a>
    </section>

    <section className="sec" id="page1">
      {W("head.page1", "h2", "h2")}
      {W("page1.intro")}
      <ol className="qlist">
        {["page1.q1", "page1.q2", "page1.q3", "page1.q4", "page1.q5", "page1.q6"].map((k, i) => <li key={k}><span className="num" aria-hidden="true">{i + 1}</span><Words k={k} copy={copy} editing={editing} as="span" /></li>)}
      </ol>
      {W("page1.open", "p", "p callout")}
    </section>

    <section className="sec" id="others">
      {W("head.others", "h2", "h2")}
      {W("others.intro")}
      <ol className="qlist">
        {["others.q1", "others.q2", "others.q3"].map((k, i) => <li key={k}><span className="num" aria-hidden="true">{i + 1}</span><Words k={k} copy={copy} editing={editing} as="span" /></li>)}
      </ol>
      {W("others.disagree", "p", "p callout strong")}
      {mine && others.length ? (
        <ul className="prompts">
          {others.map((p, i) => {
            const { same: sameField, line, link } = promptFor(mine, p);
            const lead = HINT_LEADS[i % HINT_LEADS.length];
            return (
              <li key={p.name} className="prompt pc" data-c={seatOf(p)}>
                <div className="pair">
                  <span className="two">
                    <span className="pc" data-c={seatOf(mine)}><Face config={config} data={data} name={mine.roster} size={48} accent="var(--pc)" /></span>
                    <Face config={config} data={data} name={p.roster} size={48} accent="var(--pc)" />
                  </span>
                  <div>
                    <div className="pp">{"You and " + first(p.name)}</div>
                    <div className="pr2">
                      <span className="job pc" data-c={seatOf(mine)}>{mine.role ? mine.role.role : "Your job"}</span>
                      {" and "}
                      <span className="job">{p.role ? p.role.role : "Their job"}</span>
                    </div>
                  </div>
                </div>
                <div className="hint">
                  <div className="hl">{copy.say("hint.label")}</div>
                  {sameField ? <p className="pl">{copy.say("hint.same")}</p>
                    : line ? (<>
                      <p className="pl">{copy.say(lead) + " " + line}</p>
                      {link ? <a className="dl" href={link.url} target="_blank" rel="noopener noreferrer">{link.title}<span className="dh">{hostOf(link.url)}</span></a> : null}
                    </>)
                    : <p className="pl">{copy.say("hint.none")}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : table === null ? (<>
        <p className="meta">Each student sees a hint here for each person at their table: the pull between the two fields, from the roles page, with the two faces.</p>
        {editing ? ["hint.label", ...HINT_LEADS, "hint.same", "hint.none"].map(k => <Words key={k} k={k} copy={copy} editing={editing} as="p" className="p" />) : null}
      </>) : <p className="meta">You're not in a group yet, so there are no hints to show. Message Dr. Ishak and we'll place you.</p>}
    </section>

    <section className="sec faq">
      <div className="qa">{W("faq.q1", "h3", "h3")}{W("faq.a1")}</div>
      <div className="qa">{W("faq.q2", "h3", "h3")}{W("faq.a2")}</div>
      <div className="qa">
        {W("faq.q3", "h3", "h3")}{W("faq.a3")}
        <a className="dl" href={AI_PAGE_URL} target="_blank" rel="noopener noreferrer">{copy.say("faq.a3.link")}<span className="dh">{hostOf(AI_PAGE_URL)}</span></a>
      </div>
    </section>
  </>);
}

// ─── every table, for the instructor ───

function AllTables({ config, data, saved, asg, sheet, now }) {
  const all = SESSIONS.flatMap(s => tableOf(s, saved));
  const inCount = all.filter(p => linkOf(data, p.roster, asg)).length;
  return (<>
    {/* Who sits where, first. Andrew, 2026-10-19: "how am i supposed to see
        who is in each group for the sitdown? i have a hard time finding the
        page. put it on top of the sit down page." Each row jumps to its
        table below. */}
    <section className="sec">
      <span className="eyebrow">Who sits where</span>
      <ul className="who">
        {SESSIONS.map(s => (
          <li key={s.key}>
            <a className="whent" href={"#" + s.key}>{whenOf(s)}</a>
            <span className="whon">{tableOf(s, saved).map((p, i) => (
              <span key={p.name} className="pc" data-c={i % 8}><b>{p.name}</b>{p.role ? <i>{", " + p.role.role}</i> : null}</span>
            ))}</span>
          </li>
        ))}
      </ul>
    </section>
    <section className="sec snap">
      <div className="band">
        <div className="bk"><span className="eyebrow">Every table</span>{released(now) ? <span className="count">Reports open</span> : null}</div>
        <div className="big">{inCount + " of " + all.length}</div>
        <div className="where">turned in</div>
      </div>
      <div className="facts">
        <span className="meta">{asg ? "Hand-ins also land on " + asg.title + " in My Work." : "No assignment on My Work points at this page yet. Links are kept here; add one with its Details link set to this address and new hand-ins land on the grade view too."}</span>
        <span className="meta">{"Documents open to the tables at " + SITDOWN.releaseText + (released(now) ? ", which has passed." : ".")}</span>
        <a className="dl" href={prepPath(config)}>Open the prep page</a>
      </div>
    </section>
    {SESSIONS.map(s => {
      const table = tableOf(s, saved);
      const tableSheet = sheet?.tables?.[s.key]?.people?.length ? sheet.tables[s.key] : null;
      const got = table.filter(p => linkOf(data, p.roster, asg)).length;
      return (
        <section key={s.key} id={s.key} className="sec">
          <header className="sh">
            <h2 className="h2">{whenOf(s)}</h2>
            <span className={"tally" + (got === table.length ? " ok" : "")}><i><em style={{ width: Math.round(100 * got / Math.max(1, table.length)) + "%" }} /></i><b>{got + " of " + table.length + " in"}</b></span>
          </header>
          <ul className="docs">
            {table.map(p => {
              const l = linkOf(data, p.roster, asg);
              const lateIn = l && l.at > SITDOWN.prepDue;
              return (
                <li key={p.name} className="doc pc" data-c={seatOf(p)}>
                  <div className="dn">
                    <Face config={config} data={data} name={p.roster} size={44} accent="var(--pc)" />
                    <span className="dnw"><b>{p.name}</b><span className="dr">{p.role ? p.role.role : "no role yet"}</span></span>
                  </div>
                  {l ? (
                    <div className="dright">
                      <a className="open" href={l.link} target="_blank" rel="noopener noreferrer">{"Open " + first(p.name) + "'s report"}<span className="dh">{hostOf(l.link)}</span></a>
                      <span className={"ds" + (lateIn ? " late" : " ok")}>{fmtWhen(l.at) + (lateIn ? ", after the deadline" : "")}</span>
                    </div>
                  ) : <span className="ds">Not turned in yet</span>}
                </li>
              );
            })}
          </ul>
          {tableSheet ? <Sheet table={tableSheet} /> : sheet ? <p className="meta">{sheet.written ? "No sheet for this table." : "The sheet for this table is written after the prep is in."}</p> : null}
        </section>
      );
    })}
  </>);
}

// The instructor's sheet for one table: each person's summary, how they see
// each relationship, and the questions worth asking, the picked ones first.
function Sheet({ table }) {
  return (
    <div className="sheet">
      <h3 className="h3">The sheet</h3>
      {(table.people || []).map(p => (
        <div key={p.name} className="sp">
          <div className="pn">{p.name}{p.role ? <span className="dr">{", " + p.role}</span> : null}</div>
          {p.summary ? <p className="p">{p.summary}</p> : null}
          {(p.relations || []).length ? (
            <ul className="list">{p.relations.map((r, i) => <li key={i}><b>{"With " + r.with + ": "}</b>{r.line}</li>)}</ul>
          ) : null}
          {(p.questions || []).length ? (
            <ul className="qs">{p.questions.slice().sort((a, b) => (b.ask ? 1 : 0) - (a.ask ? 1 : 0)).map((q, i) => <li key={i} className={q.ask ? "ask" : ""}>{q.q}</li>)}</ul>
          ) : null}
        </div>
      ))}
      {(table.ask || []).length ? (<>
        <h3 className="h3">To ask the table</h3>
        <ul className="qs">{table.ask.map((q, i) => <li key={i} className="ask">{q}</li>)}</ul>
      </>) : null}
    </div>
  );
}

export const CSS = `
.sd-root{--page:#f3f4f1;--card:#ffffff;--sunk:#eef2f0;--ink:#22302f;--ink2:#586864;--line:#dfe6e3;--accent:#27756a;--accent-tint:#e2f0ec;--on-accent:#ffffff;--ok:#0f766e;--warn:#b45309;--late:#c81e1e;--serif:'Fraunces',Georgia,serif;--sans:'Outfit',system-ui,sans-serif;--r:18px;--rr:12px}
.sd-root[data-mode="night"]{--page:#121716;--card:#1e2624;--sunk:#252e2c;--ink:#edf2f0;--ink2:#a3b1ad;--line:#2c3634;--accent:#7fd0c0;--accent-tint:#1f3531;--on-accent:#161c1b;--ok:#5fd3c1;--warn:#f0b35a;--late:#ff8a8a}
@media (prefers-color-scheme:dark){.sd-root:not([data-mode="day"]){--page:#121716;--card:#1e2624;--sunk:#252e2c;--ink:#edf2f0;--ink2:#a3b1ad;--line:#2c3634;--accent:#7fd0c0;--accent-tint:#1f3531;--on-accent:#161c1b;--ok:#5fd3c1;--warn:#f0b35a;--late:#ff8a8a}}
.sd-root{min-height:100vh;background:var(--page);color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased}
.sd{max-width:920px;margin:0 auto;padding:32px 16px 96px;display:grid;gap:16px}
.sd.gate{padding-top:48px;gap:12px;justify-items:start}
.sd .top{display:grid;gap:12px;padding:8px 8px 20px}
.sd .eyebrow{font-size:13px;font-weight:600;line-height:1.4;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.sd .crumb{color:var(--accent);text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:3px;min-height:44px;display:inline-flex;align-items:center}
.sd .h1{margin:0;font-family:var(--serif);font-size:clamp(40px,6.5vw,60px);font-weight:500;line-height:1.02;letter-spacing:-.02em;color:var(--ink);text-wrap:balance}
.sd .intro{margin:0;font-family:var(--serif);font-size:21px;line-height:1.45;color:var(--ink2);max-width:62ch;text-wrap:pretty}
.sd .bar{display:flex;gap:12px 20px;align-items:center;flex-wrap:wrap;padding-top:6px}
.sd .meta{font-size:15px;line-height:1.45;color:var(--ink2);font-variant-numeric:tabular-nums;max-width:72ch}
.sd .facts{display:grid;gap:8px;justify-items:start;padding:20px 24px 24px}
.sd .who{list-style:none;margin:0;padding:0;display:grid;gap:12px;width:100%}
.sd .who li{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:6px 18px;align-items:baseline;padding-top:12px;border-top:1px solid var(--line)}
.sd .who li:first-child{border-top:0;padding-top:0}
.sd .whent{font-family:var(--serif);font-size:19px;font-weight:500;color:var(--ink);text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:2px;text-underline-offset:3px}
.sd .whent:hover{color:var(--accent)}
.sd .whon{display:flex;flex-wrap:wrap;gap:4px 18px;font-size:16px;line-height:1.5}
.sd .whon b{font-weight:600;color:var(--pc)}
.sd .whon i{font-style:normal;color:var(--ink2)}
@media (max-width:640px){.sd .who li{grid-template-columns:1fr}}
.sd .btn{font-family:var(--sans);font-size:16px;font-weight:600;line-height:1.2;color:var(--accent);background:var(--card);border:2px solid var(--accent);border-radius:999px;padding:8px 18px;min-height:44px;cursor:pointer}
.sd .btn:hover{background:var(--accent);color:var(--on-accent)}
.sd .btn[aria-pressed="true"]{background:var(--accent);color:var(--on-accent)}
.sd a.btn{display:inline-flex;align-items:center;text-decoration:none}
.sd .lnk{font-family:var(--sans);font-size:16px;font-weight:500;color:var(--ink);background:transparent;border:0;padding:0;cursor:pointer;min-height:44px;display:inline-flex;align-items:center;text-align:left;text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:2px;text-underline-offset:3px}
.sd .lnk:hover,.sd .dl:hover,.sd .crumb:hover{color:var(--accent)}
.sd .as{display:inline-flex;gap:10px;align-items:center;font-size:15px;color:var(--ink2)}
.sd .as select{font-family:var(--sans);font-size:16px;min-height:44px;padding:0 12px;border-radius:var(--rr);border:1px solid var(--line);background:var(--card);color:var(--ink)}
.sd .sec{scroll-margin-top:16px;background:var(--card);border-radius:var(--r);padding:24px;display:grid;gap:14px;min-width:0;justify-items:start}
.sd .sec>*{max-width:100%}
.sd .sh{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;width:100%}
.sd .h2{margin:0;font-family:var(--serif);font-size:28px;font-weight:500;line-height:1.15;letter-spacing:-.012em;color:var(--ink);text-wrap:balance}
.sd .h3{margin:0;font-family:var(--serif);font-size:21px;font-weight:500;line-height:1.2;color:var(--ink)}
.sd .p{margin:0;font-size:17px;line-height:1.55;color:var(--ink);max-width:72ch;white-space:pre-line}
.sd .p.strong{font-weight:600}
.sd .callout{background:var(--sunk);border-radius:var(--rr);padding:14px 18px;box-shadow:inset 4px 0 0 var(--accent);width:100%;box-sizing:border-box}
/* The number chip: Skylight's filled number, the same wherever a step or a question is counted. */
.sd .num{flex:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:11px;background:var(--accent);color:var(--on-accent);font-family:var(--serif);font-size:19px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}
.sd .num.ok{background:var(--ok)}
.sd .tag{display:inline-flex;gap:10px;align-items:center}
/* The band: the when and where, filled, readable from across a room. */
.sd .snap{padding:0;gap:0;overflow:hidden}
.sd .band{width:100%;box-sizing:border-box;background:var(--accent);color:var(--on-accent);padding:14px 20px 16px;display:grid;gap:2px}
.sd .band .eyebrow,.sd .band .p{color:inherit}
.sd .band .p{opacity:.92}
.sd .bk{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px}
.sd .count{font-size:15px;font-weight:600;padding:6px 14px;border-radius:999px;background:var(--on-accent);color:var(--accent);line-height:1.2}
.sd .band .big{font-family:var(--serif);font-size:clamp(21px,3.4vw,26px);font-weight:500;line-height:1.15;letter-spacing:-.01em;text-wrap:balance}
.sd .band .where{font-family:var(--serif);font-size:clamp(21px,3.4vw,26px);font-weight:600;line-height:1.15;letter-spacing:-.01em;text-wrap:balance}
.sd .bk{margin-bottom:2px}
.sd .faces{list-style:none;margin:0;padding:20px 24px 24px;display:flex;gap:12px;flex-wrap:wrap;width:100%;box-sizing:border-box}
.sd .face{display:grid;gap:6px;justify-items:center;text-align:center;width:132px;padding:14px 8px 16px;border-radius:14px;background:var(--sunk)}
.sd .face.host{background:var(--accent-tint)}
.sd .fn{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--on-accent);background:var(--pc);border-radius:999px;padding:4px 12px;line-height:1.3;margin-top:4px}
.sd .face.host .fn{background:var(--accent)}
.sd .fr{font-family:var(--serif);font-size:17px;line-height:1.2;font-weight:500;color:var(--ink);text-wrap:balance}
.sd .list{margin:0;padding-left:22px;display:grid;gap:8px;font-size:17px;line-height:1.55;color:var(--ink)}
.sd .list b{font-weight:600}
.sd .list li::marker{color:var(--accent)}
.sd .qlist{margin:0;padding:0;list-style:none;display:grid;gap:10px;width:100%}
.sd .qlist li{display:flex;gap:14px;align-items:center;font-size:17px;line-height:1.45;color:var(--ink);max-width:72ch}
/* The chore chart. A done row fades and strikes through; the first row not done carries the ring. */
.sd .steps{margin:0;padding:0;list-style:none;display:grid;gap:8px;width:100%}
.sd .step{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px 14px;align-items:start;padding:16px 18px 18px;border-radius:var(--rr);background:var(--sunk);font-size:17px;line-height:1.5;color:var(--ink)}
.sd .step.next{box-shadow:0 0 0 2px var(--accent)}
.sd .step.done{opacity:.78}
.sd .step.done .sws{text-decoration:line-through;text-decoration-thickness:1.5px;color:var(--ink2)}
.sd .step.done .num{background:var(--ok)}
.sd .step.ready .num{background:var(--accent)}
.sd .step .num{margin-top:1px}
.sd .sw{display:grid;gap:8px;max-width:64ch;justify-items:start}
.sd .sws{font-size:18px;font-weight:500;line-height:1.45;color:var(--ink)}
.sd .sdt{font-family:var(--serif);font-size:22px;font-weight:600;line-height:1.2;color:var(--ink);text-wrap:balance;margin-top:2px}
.sd .sdt.ok{color:var(--ok)}
.sd .sdt.late{color:var(--late)}
.sd .step .btn{margin-top:4px}
.sd .steps .dl{display:inline;min-height:0}
.sd .due{font-size:15px;font-weight:600;color:var(--on-accent);background:var(--warn);border-radius:999px;padding:6px 14px;line-height:1.2}
.sd .due.ok{background:var(--ok)}
.sd .due.late{background:var(--late)}
.sd .form{display:grid;gap:10px;width:100%}
.sd .lab{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink2)}
.sd .input{font-family:var(--sans);font-size:17px;min-height:50px;padding:0 16px;border-radius:var(--rr);border:1.5px solid var(--line);background:var(--card);color:var(--ink);width:100%;max-width:72ch;box-sizing:border-box}
.sd .input::placeholder{color:var(--ink2);opacity:.8}
.sd .row{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.sd .go{font-family:var(--sans);font-size:17px;font-weight:600;color:var(--on-accent);background:var(--accent);border:0;border-radius:999px;padding:0 24px;min-height:50px;cursor:pointer}
.sd .go:disabled{opacity:.5;cursor:default}
.sd .in{display:grid;gap:4px;justify-items:start;width:100%}
/* The group's rows: each person in their own colour. */
.sd .docs{list-style:none;margin:4px 0 0;padding:0;display:grid;gap:8px;width:100%}
.sd .doc{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 20px;align-items:center;padding:12px 16px 12px 12px;border-radius:var(--rr);background:var(--sunk);box-shadow:inset 4px 0 0 var(--pc);min-height:44px}
.sd .dn{display:flex;gap:12px;align-items:center;min-width:0}
.sd .dnw{display:grid;gap:1px;min-width:0}
.sd .dnw b{font-size:17px;font-weight:600;color:var(--pc);line-height:1.3}
.sd .dr{font-size:16px;color:var(--ink);line-height:1.3}
/* Every group: each table with its time, names and roles, for a student who wants the whole picture. */
.sd .groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;width:100%}
.sd .group{background:var(--sunk);border-radius:var(--rr);padding:16px 16px 18px;display:grid;gap:12px;align-content:start}
.sd .group.mine{box-shadow:0 0 0 2px var(--accent)}
.sd .people{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.sd .person{display:flex;gap:10px;align-items:center;min-width:0}
.sd .pw{display:grid;gap:1px;min-width:0}
.sd .pw b{font-size:16px;font-weight:600;color:var(--pc);line-height:1.3}
.sd .pj{font-size:16px;color:var(--ink);line-height:1.3}
.sd .dright{display:grid;gap:4px;justify-items:end}
.sd .open{font-size:15px;font-weight:600;color:var(--on-accent);background:var(--pc,var(--accent));text-decoration:none;display:inline-flex;gap:8px;align-items:baseline;min-height:44px;padding:0 16px;border-radius:999px;line-height:44px;white-space:nowrap}
.sd .open .dh{color:inherit;opacity:.85}
.sd .in .open{background:var(--accent)}
.sd .dl{font-size:17px;font-weight:500;color:var(--ink);text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:2px;text-underline-offset:3px;display:inline-flex;gap:10px;align-items:baseline;min-height:44px;line-height:1.4;flex-wrap:wrap}
.sd .dh{font-size:13px;font-weight:500;color:var(--ink2);text-decoration:none}
.sd .ds{font-size:14px;font-weight:600;color:var(--ink2);background:var(--card);border-radius:999px;padding:6px 12px;line-height:1.2;white-space:nowrap}
.sd .ds.ok{color:var(--on-accent);background:var(--ok)}
.sd .ds.late{color:var(--on-accent);background:var(--late)}
.sd .tally{display:inline-grid;gap:6px;justify-items:end;min-width:120px;font-size:14px;font-weight:600;color:var(--ink2);font-variant-numeric:tabular-nums}
.sd .tally i{display:block;width:100%;height:8px;border-radius:999px;background:var(--line);overflow:hidden}
.sd .tally em{display:block;height:100%;background:var(--accent);border-radius:999px}
.sd .tally.ok b{color:var(--ok)}
/* The document, as three page tiles. */
.sd .pages{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:12px;width:100%}
.sd .page{display:flex;flex-wrap:wrap;align-content:start;gap:8px;padding:16px;border-radius:var(--rr);background:var(--sunk);text-decoration:none;color:var(--ink);min-height:120px;box-sizing:border-box;position:relative}
.sd .page:hover{box-shadow:0 0 0 2px var(--accent)}
.sd .page .num{margin-right:-2px}
.sd .page.wide{grid-column:auto}
.sd .pgl{flex-basis:100%;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-top:6px}
.sd .pgw{flex-basis:100%;font-family:var(--serif);font-size:21px;line-height:1.2;color:var(--ink);text-wrap:balance}
.sd .pgf{display:inline-flex;margin-top:4px}
.sd .pgf>*+*{margin-left:-8px}
/* A hint per person, in that person's colour. */
.sd .prompts{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:12px;width:100%}
.sd .prompt{border-radius:var(--rr);background:var(--sunk);box-shadow:inset 4px 0 0 var(--pc);padding:18px 20px 20px;display:grid;gap:14px}
.sd .pair{display:flex;gap:14px;align-items:center}
.sd .two{display:inline-flex}
.sd .two>*+*{margin-left:-12px}
.sd .pp{font-family:var(--serif);font-size:23px;font-weight:500;line-height:1.15;color:var(--pc)}
.sd .pr2{font-size:18px;font-weight:600;line-height:1.3;color:var(--ink);margin-top:4px}
.sd .job{color:var(--pc)}
.sd .hint{display:grid;gap:6px;justify-items:start;max-width:72ch;background:var(--card);border-radius:10px;padding:14px 16px}
.sd .hl{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--pc)}
.sd .pl{margin:0;font-size:17px;line-height:1.55;color:var(--ink)}
.sd .pq{margin:0;font-size:17px;line-height:1.5;color:var(--ink2);font-style:italic}
.sd .faq{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;background:transparent;padding:0}
.sd .qa{background:var(--card);border-radius:var(--r);padding:22px 22px 24px;display:grid;gap:10px;align-content:start;justify-items:start}
.sd .sheet{display:grid;gap:12px;padding-top:4px;width:100%}
.sd .sp{display:grid;gap:8px;padding:14px 16px 16px;border-radius:var(--rr);background:var(--sunk)}
.sd .pn{font-family:var(--serif);font-size:21px;line-height:1.2;color:var(--ink)}
.sd .qs{margin:0;padding-left:22px;display:grid;gap:6px;font-size:16px;line-height:1.5;color:var(--ink2)}
.sd .qs .ask{color:var(--ink);font-weight:600}
/* Eight colours, one per seat. Day values read at 4.5:1 on the sunk surface with white inside; night values read on the night card with the night ink inside. */
.sd .pc{--pc:var(--pc-day)}
.sd-root[data-mode="night"] .pc{--pc:var(--pc-night)}
@media (prefers-color-scheme:dark){.sd-root:not([data-mode="day"]) .pc{--pc:var(--pc-night)}}
.sd .pc[data-c="0"]{--pc-day:#2b6cb6;--pc-night:#518fd6}
.sd .pc[data-c="1"]{--pc-day:#c62f61;--pc-night:#db668d}
.sd .pc[data-c="2"]{--pc-day:#995e24;--pc-night:#c67a2f}
.sd .pc[data-c="3"]{--pc-day:#1c7856;--pc-night:#27a577}
.sd .pc[data-c="4"]{--pc-day:#8a49d4;--pc-night:#a777df}
.sd .pc[data-c="5"]{--pc-day:#1f7384;--pc-night:#2a9bb2}
.sd .pc[data-c="6"]{--pc-day:#be402d;--pc-night:#d96e5e}
.sd .pc[data-c="7"]{--pc-day:#41781c;--pc-night:#59a527}
.sd .vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.55;padding:4px 8px;margin:0;border:1.5px dashed var(--line);border-radius:8px;background:var(--card);resize:none;overflow:hidden}
.sd .vsp-edit.h1{font-family:var(--serif);font-size:clamp(40px,6.5vw,60px);font-weight:500;line-height:1.1}
.sd .vsp-edit.h2{font-family:var(--serif);font-size:28px;font-weight:500}
.sd .vsp-edit.h3{font-family:var(--serif);font-size:21px;font-weight:500}
.sd .vsp-edit.intro{font-family:var(--serif);font-size:21px;color:var(--ink2)}
.sd .vsp-edit.p{font-size:17px}
.sd .lnk:focus-visible,.sd .btn:focus-visible,.sd .go:focus-visible,.sd .dl:focus-visible,.sd .open:focus-visible,.sd .page:focus-visible,.sd .crumb:focus-visible,.sd .input:focus-visible,.sd .as select:focus-visible,.sd .vsp-edit:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media (max-width:720px){.sd .faq{grid-template-columns:1fr}.sd .pages{grid-template-columns:1fr}.sd .groups{grid-template-columns:1fr}}
@media (max-width:640px){.sd{padding-top:20px;gap:12px}.sd .sec{padding:18px;border-radius:16px}.sd .band{padding:14px 16px 16px}.sd .faces{padding:14px;gap:8px}.sd .face{width:calc(50% - 4px);box-sizing:border-box}.sd .step{padding:14px}.sd .sdt{font-size:20px}.sd .doc{grid-template-columns:1fr}.sd .dright{justify-items:start}.sd .open{white-space:normal;line-height:1.3;padding:10px 16px}}
@media (prefers-reduced-motion:reduce){.sd *{animation-duration:.01ms!important;transition-duration:.01ms!important}}
/* The sheen. Andrew asked on 2026-10-16 for the links to move a little, with a sheen on every one. A band of light crosses every pill every few seconds, and a glint passes through the underlined links. Still for anyone who asked for reduced motion. */
.sd .btn,.sd .go,.sd .open,.sd .count{position:relative;overflow:hidden;isolation:isolate}
.sd .btn::after,.sd .go::after,.sd .open::after,.sd .count::after{content:"";position:absolute;top:-60%;bottom:-60%;left:0;width:34%;background:linear-gradient(100deg,transparent 0%,rgba(255,255,255,.55) 50%,transparent 100%);transform:translateX(-220%) skewX(-18deg);animation:sd-sheen 5.5s ease-in-out infinite;pointer-events:none;z-index:1}
.sd .btn::after{background:linear-gradient(100deg,transparent 0%,color-mix(in srgb,var(--accent) 28%,transparent) 50%,transparent 100%)}
.sd .step:nth-child(2) .btn::after{animation-delay:.6s}
.sd .step:nth-child(3) .btn::after{animation-delay:1.2s}
.sd .btn:hover::after,.sd .go:hover::after,.sd .open:hover::after{animation:sd-sheen 1s ease-out infinite}
@keyframes sd-sheen{0%,72%{transform:translateX(-220%) skewX(-18deg)}100%{transform:translateX(440%) skewX(-18deg)}}
.sd .dl,.sd .lnk,.sd .crumb{background-image:linear-gradient(100deg,currentColor 0%,currentColor 42%,var(--accent) 50%,currentColor 58%,currentColor 100%);background-size:300% 100%;background-position:100% 0;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:sd-glint 6s ease-in-out infinite}
.sd .dl .dh{-webkit-text-fill-color:var(--ink2)}
.sd .open .dh{-webkit-text-fill-color:currentColor}
@keyframes sd-glint{0%,70%{background-position:100% 0}100%{background-position:0% 0}}
`;
