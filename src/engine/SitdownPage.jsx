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
import * as TOKENS from "./tokens.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_STUDENT } from "./TopNav.jsx";

// The instructor's sheet for each table, written after the prep is in. One
// file per class, loaded only for him. The shape is in the file.
const SHEETS = {
  comm118: () => import("../readouts/comm118-sitdown-1.json"),
};

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
    <p style={{ fontSize: 17, margin: "0 0 12px" }}>This page runs on your email sign-in.</p>
    <a className="ca-focus" href={"/login?next=" + encodeURIComponent(next)} style={{ fontSize: 17, fontWeight: 600, color: config.accent }}>Sign in</a>
  </>);
  else if (data === null) gate = <p style={{ fontSize: 17, margin: 0 }}>Loading the class.</p>;
  else if (!allowed) gate = <p style={{ fontSize: 17, margin: 0 }}>{email} is not on the roster for {config.code} yet.</p>;

  const viewer = instructor && !as ? { instructor: true } : { name: as || me?.name || "" };

  return (
    <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body, "--accent": config.accent }}>
      <ThemeStyle theme={theme} />
      <style>{CSS}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      {gate ? <div style={{ padding: 32 }}>{gate}</div> : (
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

function Mine({ config, data, update, name, saved, asg, copy, editing, now, suffix }) {
  const session = sessionOf(name);
  const table = tableOf(session, saved);
  const me = table.find(p => same(p.roster, name) || same(p.name, name)) || null;
  const others = table.filter(p => p !== me);
  const open = released(now);
  return (<>
    <section className="sec when" id="when">
      <div className="eyebrow">Your sit-down</div>
      {session ? (<>
        <div className="big">{whenOf(session)}</div>
        <div className="where">{SITDOWN.room + ", Dr. Ishak's office"}</div>
        <ul className="faces">
          {table.map(p => (
            <li key={p.name} className={"face" + (p === me ? " me" : "")}>
              <Face config={config} data={data} name={p.roster} size={72} />
              <div className="fn">{p === me ? "You" : first(p.name)}</div>
              <div className="fr">{p.role ? p.role.role : "Role to come"}</div>
            </li>
          ))}
          <li className="face host">
            <Face config={config} data={data} name="" size={72} instructor />
            <div className="fn">{config.instructor?.name || "Dr. Ishak"}</div>
            <div className="fr"><Words k="director" copy={copy} editing={editing} as="span" /></div>
          </li>
        </ul>
      </>) : <p className="p">You're not in a group yet. Message Dr. Ishak and we'll place you.</p>}
    </section>

    <section className="sec">
      <Words k="head.steps" copy={copy} editing={editing} as="h2" className="h2" />
      <ol className="steps">
        <li><div>
          <Words k="step.1" copy={copy} editing={editing} as="span" />
          {" "}<a className="dl" href={prepPath(config) + suffix}>{copy.say("step.1.link")}</a>
        </div></li>
        <li><div><Words k="step.2" copy={copy} editing={editing} as="span" /></div></li>
        <li><div>
          <Words k="step.3" copy={copy} editing={editing} as="span" />
          <span>{session ? " " + whenOf(session) + ", in " + SITDOWN.room + "." : " In " + SITDOWN.room + "."}</span>
        </div></li>
      </ol>
      <div className="goes">
        <a className="btn" href={"#turnin"}>{copy.say("step.1.go")}</a>
        {session ? <a className="btn" href={"#docs"}>{copy.say("step.2.go")}</a> : null}
        {session ? <a className="btn" href={"#when"}>{copy.say("step.3.go")}</a> : null}
      </div>
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
        <div className="eyebrow">Step 2</div>
        <Words k="head.docs" copy={copy} editing={editing} as="h2" className="h2" />
        <Words k={open ? "docs.after" : "docs.before"} copy={copy} editing={editing} as="p" className="p" />
        <ul className="docs">
          {others.map(p => {
            const l = linkOf(data, p.roster, asg);
            return (
              <li key={p.name} className="doc">
                <div className="dn"><Face config={config} data={data} name={p.roster} size={32} /><span>{p.name}<span className="dr">{p.role ? ", " + p.role.role : ""}</span></span></div>
                {open && l ? <a className="dl" href={l.link} target="_blank" rel="noopener noreferrer">{"Open " + first(p.name) + "'s prep"}<span className="dh">{hostOf(l.link)}</span></a>
                  : l ? <span className="ds ok">Turned in</span>
                  : <span className="ds">Not turned in yet</span>}
              </li>
            );
          })}
        </ul>
      </section>
    ) : null}
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
      <div className="eyebrow">Step 1</div>
      <Words k="head.turnin" copy={copy} editing={editing} as="h2" className="h2" />
      <div className="due">{"Due " + SITDOWN.prepDueText}</div>
      <Words k="prep.turnin" copy={copy} editing={editing} as="p" className="p" />
      <a className="dl" href={prepPath(config) + suffix}>{copy.say("step.1.link")}</a>
      {mine && !changing ? (
        <div className="in">
          <div className="ds ok">{"Turned in " + fmtWhen(mine.at)}</div>
          <a className="dl" href={mine.link} target="_blank" rel="noopener noreferrer">Open your document<span className="dh">{hostOf(mine.link)}</span></a>
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

function Prep({ config, data, copy, editing, table, me, suffix = "" }) {
  const mine = table ? table.find(p => same(p.roster, me) || same(p.name, me)) : null;
  const others = table && mine ? table.filter(p => p !== mine) : [];
  const W = (k, as = "p", className = "p") => <Words k={k} copy={copy} editing={editing} as={as} className={className} />;
  return (<>
    <section className="sec">
      {W("prep.shape")}
      <a className="dl" href={homePath(config) + suffix}>Back to the Sit-Down page</a>
    </section>

    <section className="sec">
      {W("head.page1", "h2", "h2")}
      {W("page1.intro")}
      <ol className="qlist">
        {["page1.q1", "page1.q2", "page1.q3", "page1.q4", "page1.q5", "page1.q6"].map(k => <li key={k}><Words k={k} copy={copy} editing={editing} as="span" /></li>)}
      </ol>
      {W("page1.open")}
    </section>

    <section className="sec">
      {W("head.others", "h2", "h2")}
      {W("others.intro")}
      <ol className="qlist">
        {["others.q1", "others.q2", "others.q3"].map(k => <li key={k}><Words k={k} copy={copy} editing={editing} as="span" /></li>)}
      </ol>
      {W("others.disagree", "p", "p strong")}
      {mine && others.length ? (
        <ul className="prompts">
          {others.map(p => {
            const { same: sameField, line, link } = promptFor(mine, p);
            return (
              <li key={p.name} className="prompt">
                <div className="pair">
                  <span className="two"><Face config={config} data={data} name={mine.roster} size={44} /><Face config={config} data={data} name={p.roster} size={44} /></span>
                  <div>
                    <div className="pp">{"You and " + first(p.name)}</div>
                    <div className="pr2">{(mine.role ? mine.role.role : "Your job") + " and " + (p.role ? p.role.role.toLowerCase() : "their job")}</div>
                  </div>
                </div>
                <div className="hint">
                  <div className="hl">{copy.say("hint.label")}</div>
                  {sameField ? <p className="pl">{copy.say("hint.same")}</p>
                    : line ? (<>
                      <p className="pl">{copy.say("hint.lead") + " " + line}</p>
                      <p className="pq">{copy.say("hint.hedge")}</p>
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
        {editing ? ["hint.label", "hint.lead", "hint.hedge", "hint.same", "hint.none"].map(k => <Words key={k} k={k} copy={copy} editing={editing} as="p" className="p" />) : null}
      </>) : <p className="meta">You're not in a group yet, so there are no hints to show. Message Dr. Ishak and we'll place you.</p>}
    </section>

    <section className="sec">
      {W("faq.q1", "h3", "h3")}
      {W("faq.a1")}
      {W("faq.q2", "h3", "h3")}
      {W("faq.a2")}
      {W("faq.q3", "h3", "h3")}
      {W("faq.a3")}
      <a className="dl" href={AI_PAGE_URL} target="_blank" rel="noopener noreferrer">{copy.say("faq.a3.link")}<span className="dh">{hostOf(AI_PAGE_URL)}</span></a>
    </section>
  </>);
}

// ─── every table, for the instructor ───

function AllTables({ config, data, saved, asg, sheet, now }) {
  const all = SESSIONS.flatMap(s => tableOf(s, saved));
  const inCount = all.filter(p => linkOf(data, p.roster, asg)).length;
  return (<>
    <section className="sec">
      <div className="facts">
        <span className="meta">{inCount + " of " + all.length + " turned in"}</span>
        <span className="meta">{asg ? "Hand-ins also land on " + asg.title + " in My Work." : "No assignment on My Work points at this page yet. Links are kept here; add one with its Details link set to this address and new hand-ins land on the grade view too."}</span>
        <span className="meta">{"Documents open to the tables at " + SITDOWN.releaseText + (released(now) ? ", which has passed." : ".")}</span>
        <a className="dl" href={prepPath(config)}>Open the prep page</a>
      </div>
    </section>
    {SESSIONS.map(s => {
      const table = tableOf(s, saved);
      const tableSheet = sheet?.tables?.[s.key]?.people?.length ? sheet.tables[s.key] : null;
      return (
        <section key={s.key} className="sec">
          <header className="sh"><h2 className="h2">{whenOf(s)}</h2><span className="meta">{table.filter(p => linkOf(data, p.roster, asg)).length + " of " + table.length + " in"}</span></header>
          <ul className="docs">
            {table.map(p => {
              const l = linkOf(data, p.roster, asg);
              return (
                <li key={p.name} className="doc">
                  <div className="dn"><Face config={config} data={data} name={p.roster} size={32} /><span>{p.name}<span className="dr">{p.role ? ", " + p.role.role : ", no role yet"}</span></span></div>
                  {l ? (<>
                    <a className="dl" href={l.link} target="_blank" rel="noopener noreferrer">{"Open " + first(p.name) + "'s prep"}<span className="dh">{hostOf(l.link)}</span></a>
                    <span className={"ds" + (l.at > SITDOWN.prepDue ? " late" : " ok")}>{fmtWhen(l.at) + (l.at > SITDOWN.prepDue ? ", after the deadline" : "")}</span>
                  </>) : <span className="ds">Not turned in yet</span>}
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

const CSS = `
.sd{max-width:820px;margin:0 auto;padding:24px 16px 80px;display:grid;gap:20px}
.sd .top{display:grid;gap:10px}
.sd .eyebrow{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.sd .crumb{color:var(--accent);text-decoration:none}
.sd .h1{margin:0;font-family:var(--font-display);font-size:32px;font-weight:700;letter-spacing:-.02em;color:var(--text-primary)}
.sd .intro{margin:0;font-size:17px;line-height:1.55;color:var(--text-secondary);max-width:68ch}
.sd .bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.sd .meta{font-size:13px;color:var(--text-muted);font-variant-numeric:tabular-nums;max-width:72ch}
.sd .facts{display:grid;gap:6px;justify-items:start}
.sd .btn{font:inherit;font-size:14px;font-weight:600;color:var(--accent);background:transparent;border:1px solid var(--accent);border-radius:999px;padding:6px 14px;min-height:44px;cursor:pointer}
.sd .btn[aria-pressed="true"]{background:var(--accent);color:#fff}
.sd a.btn{display:inline-flex;align-items:center;text-decoration:none;padding:6px 16px}
.sd .goes{display:flex;flex-wrap:wrap;gap:10px;width:100%}
.sd .sec{scroll-margin-top:16px}
.sd .lnk{font:inherit;font-size:15px;font-weight:600;color:var(--accent);background:transparent;border:0;padding:0;cursor:pointer;min-height:44px;display:inline-flex;align-items:center;text-align:left;text-decoration:none}
.sd .as{display:inline-flex;gap:8px;align-items:center;font-size:14px;color:var(--text-secondary)}
.sd .as select{font:inherit;font-size:16px;min-height:44px;padding:0 10px;border-radius:12px;border:1px solid var(--line-strong);background:var(--surface-card);color:var(--text-primary)}
.sd .sec{background:var(--surface-card);border:1px solid var(--line-soft);border-radius:16px;padding:20px;display:grid;gap:12px;min-width:0;justify-items:start}
.sd .sec>*{max-width:100%}
.sd .sh{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;width:100%}
.sd .h2{margin:0;font-size:22px;font-weight:600;color:var(--text-primary)}
.sd .h3{margin:4px 0 0;font-size:17px;font-weight:600;color:var(--text-primary)}
.sd .p{margin:0;font-size:17px;line-height:1.55;color:var(--text-secondary);max-width:68ch;white-space:pre-line}
.sd .p.strong{font-weight:600;color:var(--text-primary)}
.sd .when .big{font-size:26px;font-weight:700;letter-spacing:-.01em;color:var(--text-primary)}
.sd .when .where{font-size:17px;color:var(--text-primary)}
.sd .faces{list-style:none;margin:4px 0 0;padding:0;display:flex;gap:16px;flex-wrap:wrap;width:100%}
.sd .face{display:grid;gap:4px;justify-items:center;text-align:center;width:128px}
.sd .face.me .fn{color:var(--accent)}
.sd .face.host{padding-left:16px;border-left:1px solid var(--line-soft)}
.sd .fn{font-size:15px;font-weight:500;color:var(--text-secondary)}
.sd .fr{font-size:16px;line-height:1.25;font-weight:600;color:var(--text-primary)}
.sd .list{margin:0;padding-left:20px;display:grid;gap:6px;font-size:17px;line-height:1.5;color:var(--text-secondary)}
.sd .list b{color:var(--text-primary);font-weight:600}
.sd .qlist{margin:0;padding-left:24px;display:grid;gap:6px;font-size:17px;line-height:1.5;color:var(--text-primary)}
.sd .steps{margin:0;padding:0;list-style:none;display:grid;gap:10px;counter-reset:s;width:100%}
.sd .steps li{display:grid;grid-template-columns:32px minmax(0,1fr);gap:10px;font-size:17px;line-height:1.5;color:var(--text-secondary);counter-increment:s;max-width:68ch}
.sd .steps li::before{content:counter(s);font-size:17px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums}
.sd .steps .dl{display:inline;min-height:0}
.sd .due{font-size:15px;font-weight:600;color:var(--state-warn)}
.sd .form{display:grid;gap:8px;width:100%}
.sd .lab{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.sd .input{font:inherit;font-size:16px;min-height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--line-strong);background:var(--surface-card);color:var(--text-primary);width:100%;box-sizing:border-box}
.sd .row{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.sd .go{font:inherit;font-size:16px;font-weight:600;color:#fff;background:var(--accent);border:0;border-radius:12px;padding:0 20px;min-height:44px;cursor:pointer}
.sd .go:disabled{opacity:.5;cursor:default}
.sd .in{display:grid;gap:6px;justify-items:start}
.sd .docs{list-style:none;margin:0;padding:0;display:grid;gap:4px;width:100%}
.sd .doc{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 16px;align-items:center;padding:10px 0;border-top:1px solid var(--line-soft);min-height:44px}
.sd .doc:first-child{border-top:0}
.sd .dn{font-size:17px;font-weight:600;color:var(--text-primary);display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.sd .dr{font-weight:500;color:var(--text-secondary)}
.sd .dl{font-size:15px;font-weight:600;color:var(--accent);text-decoration:none;display:inline-flex;gap:8px;align-items:center;min-height:44px}
.sd .dh{font-size:13px;font-weight:500;color:var(--text-muted)}
.sd .ds{font-size:15px;color:var(--text-muted)}
.sd .ds.ok{color:var(--state-ok);font-weight:600}
.sd .ds.late{color:var(--state-late);font-weight:600}
.sd .prompts{list-style:none;margin:0;padding:0;display:grid;gap:12px;width:100%}
.sd .prompt{background:var(--surface-sunk);border-radius:12px;padding:14px 16px;display:grid;gap:10px}
.sd .pair{display:flex;gap:12px;align-items:center}
.sd .two{display:inline-flex}
.sd .two>*+*{margin-left:-10px}
.sd .pp{font-size:17px;font-weight:600;color:var(--text-primary)}
.sd .pr2{font-size:13px;color:var(--text-muted)}
.sd .hint{display:grid;gap:4px;justify-items:start}
.sd .hl{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.sd .pl{margin:0;font-size:15px;line-height:1.5;color:var(--text-primary)}
.sd .pq{margin:0;font-size:15px;line-height:1.5;color:var(--text-secondary);font-style:italic}
.sd .sheet{display:grid;gap:10px;padding-top:12px;border-top:1px solid var(--line-soft);width:100%}
.sd .sp{display:grid;gap:6px;padding:12px 14px;border-radius:12px;background:var(--surface-sunk)}
.sd .pn{font-size:17px;font-weight:600;color:var(--text-primary)}
.sd .qs{margin:0;padding-left:20px;display:grid;gap:4px;font-size:15px;line-height:1.5;color:var(--text-secondary)}
.sd .qs .ask{color:var(--text-primary);font-weight:600}
.sd .vsp-edit{display:block;width:100%;box-sizing:border-box;font:inherit;color:inherit;line-height:1.55;padding:4px 8px;margin:0;border:1.5px dashed var(--line-strong);border-radius:8px;background:var(--surface-card);resize:none;overflow:hidden}
.sd .vsp-edit.h1{font-size:32px;font-weight:700}
.sd .vsp-edit.h2{font-size:22px;font-weight:600}
.sd .vsp-edit.h3{font-size:17px;font-weight:600}
.sd .vsp-edit.p,.sd .vsp-edit.intro{font-size:17px}
.sd .lnk:focus-visible,.sd .btn:focus-visible,.sd .go:focus-visible,.sd .dl:focus-visible,.sd .crumb:focus-visible,.sd .input:focus-visible,.sd .as select:focus-visible,.sd .vsp-edit:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (max-width:640px){.sd .sec{padding:16px}.sd .doc{grid-template-columns:1fr}.sd .face{width:88px}.sd .face.host{padding-left:12px}}
`;
