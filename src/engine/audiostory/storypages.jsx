// Andrew's pages for the audio story: ?review and ?control on
// /comm3/worksheets/audio-story.
//
// The review is the visual story review's shape: problem reports, then where
// every student stands by section, with the cover, the headline, the clip to
// play, what is left before Submit, a link to open the story, and the
// late-work unlock. The control page states the mechanism from the code
// itself (Andrew, 2026-10-29: "a control page, an instructor page that tells
// me exactly why everything's happening and exactly how everything is
// happening"). Reads and writes go through /api/worksheet-submits, which
// checks the PIN or an instructor session and holds the service key.

import { useCallback, useEffect, useRef, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf, sectionOf, isLurker } from "../sections.js";
import { idOf } from "../roster.js";
import { gameClient } from "../gameClient.js";
import { localWorksheet, openTo } from "../localWorksheets.js";
import { useClassState } from "../store.js";
import { StudentLink } from "../StudentPage.jsx";
import { Shell as PageShell, StudentPicker, pickedStudent, pickStudent, useInstructorRead } from "./control.jsx";
import { ReadPanel, ReadSummary, Compare, Bars, Timeline, REVIEW_CSS } from "./prepages.jsx";
import { Face, Gm, Sec, Chip } from "../portal/bits.jsx";
import { audioStoryOf, problemsOf, sourceListOf, clock, MAX_STORY_SECONDS, MAX_LISTEN_WORDS } from "./storymodel.js";
import { AUDIO_STORY_KEY, AUDIO_STORY_COPY_ROW, STEPS } from "./story.jsx";
import { AUDIO_RESEARCH_KEY } from "./research.jsx";
import { WINDOW, NEED_ASSIGNED, NEED_TOTAL, MIN_CHARS, HEARD_FULL, HEARD_LITTLE } from "./reviewmodel.js";
import * as TOKENS from "../tokens.js";

const call = async (body) => {
  const r = await fetch("/api/worksheet-submits", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};
const lower = (s) => String(s || "").trim().toLowerCase();
const when = (t) => new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Signed links for every cover and clip on a set of sheets, through the
// server, so the PIN sign-in can see and play them too. { [path]: url }.
function useUrls(config, sheets) {
  const [urls, setUrls] = useState({});
  const paths = (sheets || []).flatMap(s => { const st = audioStoryOf(s.answers); return [st.cover?.path, st.audio?.path]; }).filter(Boolean).sort().join("\n");
  useEffect(() => {
    if (!paths) return undefined;
    let alive = true;
    call({ groupKey: config.id, key: AUDIO_STORY_KEY, sign: paths.split("\n") }).then(out => { if (alive) setUrls(out.urls || {}); }).catch(() => {});
    return () => { alive = false; };
  }, [config.id, paths]);
  return urls;
}

export function AudioStoryReview({ config, worksheetKey = AUDIO_STORY_KEY, roster }) {
  const [sheets, setSheets] = useState(null);
  const [reports, setReports] = useState([]);
  const [due, setDue] = useState(null);
  const [error, setError] = useState("");
  const sections = sectionsOf(config);
  // A link to one student opens on that student's section.
  const [section, setSection] = useState(() => {
    const id = typeof window !== "undefined" ? pickedStudent() : "";
    const them = id ? (roster || []).find(s => idOf(s) === id) : null;
    return (them && sections.includes(sectionOf(them)) ? sectionOf(them) : "") || sections[0] || "";
  });
  const urls = useUrls(config, sheets);
  // One story at a time, picked from the menu; the page opens on the count.
  // Andrew, 2026-11-13, on the review pages: "okay yeah get it done."
  const [who, setWho] = useState(() => (typeof window !== "undefined" ? pickedStudent() : ""));
  const pick = (id) => { setWho(id); pickStudent(id); };
  // Claude's read of each submitted story, from the private instructor
  // bucket (scripts/comm3-audio-story-read-push.mjs). Andrew, 2026-11-16:
  // "you do a quick read and go through the transcripts of each audio story
  // and you tell me what your read is. make me a page to read all this. and
  // let me know if a student was late or did not submit the pre-production."
  const read = useInstructorRead(config, "audio-story");
  const [data] = useClassState(config.storageKey);

  useEffect(() => {
    let alive = true;
    const ask = () => call({ groupKey: config.id, key: worksheetKey, all: true }).then(out => { if (alive) setSheets(out.sheets); }).catch(e => { if (alive) setError(e.message); });
    ask();
    const t = setInterval(() => { if (document.visibilityState !== "hidden") ask(); }, 30000);
    call({ groupKey: config.id, key: worksheetKey, reports: true }).then(out => { if (alive) setReports(out.reports); }).catch(() => {});
    gameClient.from("worksheet_deadlines").select("due_at").eq("worksheet_key", worksheetKey).eq("group_key", config.id)
      .then(r => { if (alive) setDue(r.data && r.data[0] ? r.data[0].due_at : null); });
    return () => { alive = false; clearInterval(t); };
  }, [config.id, worksheetKey]);

  if (error) return <Shell config={config}><p className="pt-sub">Could not read the stories: {error}</p></Shell>;
  if (!sheets) return <Shell config={config}><p className="pt-sub">Loading the stories.</p></Shell>;

  const nameOf = new Map(roster.filter(s => s.email).map(s => [lower(s.email), s.name]));
  const byEmail = new Map(sheets.map(s => [s.viewer_id, s]));
  const people = roster.filter(s => s.email && !isLurker(s.name) && (!section || sectionOf(s) === section));
  const onRoster = new Set(roster.filter(s => s.email).map(s => lower(s.email)));
  const others = sheets.filter(s => !onRoster.has(s.viewer_id));
  const past = due && Date.now() > Date.parse(due);
  const setUnlock = async (email, until) => {
    const out = await call({ groupKey: config.id, key: worksheetKey, viewer: email, unlock: { until } });
    setSheets(list => list.map(s => (s.viewer_id === email ? { ...s, unlockedUntil: out.until } : s)));
  };
  const submittedCount = people.filter(p => byEmail.get(lower(p.email))?.submitted_at).length;
  // Who is open again past the due date, and until when, said once at the top.
  const openAgain = people.map(p => byEmail.get(lower(p.email))?.unlockedUntil).filter(u => u && Date.parse(u) > Date.now());
  const unlockedCount = past ? openAgain.length : 0;
  const unlockedTill = openAgain.slice().sort().pop() || null;
  const base = "/" + config.id + "/worksheets/" + worksheetKey;
  // The menu, by name, with the word each row's chip says.
  const standing = (sheet) => {
    if (sheet?.submitted_at) return due && Date.parse(sheet.submitted_at) > Date.parse(due) ? "Submitted late" : "Submitted";
    return sheet && Object.keys(sheet.answers || {}).length > 0 ? "Working" : "Not started";
  };
  const menu = [...people].sort((x, y) => x.name.localeCompare(y.name)).map(p => ({ id: idOf(p), name: p.name, status: standing(byEmail.get(lower(p.email))), student: p }));
  const chosen = menu.find(m => m.id === who) || null;

  const working = people.filter(p => { const s = byEmail.get(lower(p.email)); return s && !s.submitted_at && Object.keys(s.answers || {}).length > 0; }).length;
  return (
    <Shell config={config}>
      <style>{REVIEW_CSS}</style>
      {/* Andrew, 2026-11-16, of this page: "why are there so many buttons?
          this is not clear at all," and then, of a first redo in styles of
          its own: "I'm using the skylight style for the entire class website
          ... you should use the same kinds of cards." So the page is the
          pre-production review's: the same Shell, title, section switch,
          bars, tinted rows and card, off portal/style.js and control.jsx. It
          opens on everybody, a row a student, and a row is the way in. */}
      <header className="aic-top">
        <div className="aic-titles">
          <h1 className="pt-h1">Audio stories</h1>
          <p className="pt-sub">{due ? (past ? "Due " : "Locks ") + when(due) + "." : "No due date is set, so nothing locks."}{unlockedCount ? " Open again for " + (unlockedCount === people.length ? "everyone" : unlockedCount) + " until " + when(unlockedTill) + "." : ""}</p>
        </div>
        {sections.length > 1 ? (
          <div className="pt-seg" role="tablist" aria-label="Section">
            {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"pt-focus" + (s === section ? " on" : "")} onClick={() => { setSection(s); pick(""); }}>{s}</button>)}
          </div>
        ) : null}
      </header>

      {reports.length ? (
        <div className="pt-day">
          <Sec name="Problem reports" sub={reports.length} />
          <div className="pt-stack">
            {reports.map(r => (
              <div key={r.id} className="pt-row late">
                <div className="pt-main">
                  <p className="pt-title">{nameOf.get(r.viewer_id) || r.viewer_id}</p>
                  <p className="pt-when late">{when(r.created_at)}</p>
                  <p className="pt-text">{r.message || "No note."}</p>
                  <p className="pt-meta">Saving: {r.details?.status || "unknown"}{(r.details?.pending || []).length ? ", " + r.details.pending.length + " not yet on the server" : ""}. {(r.details?.errors || []).map(e => e.name + ": " + e.error).join(". ")} {r.details?.agent || ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {chosen ? (
        <>
          <div className="pt-chips">
            <button type="button" className="pt-chip on pt-focus" onClick={() => pick("")}>All stories</button>
            <StudentPicker people={menu} value={chosen.id} onPick={pick} />
          </div>
          <div className="pt-stack aic-cards">
            <Row key={chosen.student.email} config={config} data={data} student={chosen.student} email={lower(chosen.student.email)} link={idOf(chosen.student)} sheet={byEmail.get(lower(chosen.student.email))} urls={urls} due={due} past={past} onUnlock={setUnlock} mine={read?.students?.[lower(chosen.student.email)] || null} readAt={read?.at} links={read?.links} />
          </div>
        </>
      ) : (
        <>
          <div className="apr-in" aria-label="Running summary">
            <Bars rows={[["Submitted", submittedCount, "meets"], ["Working", working, "partly"], ["Not started", people.length - submittedCount - working, "none"]]} of={people.length} />
          </div>
          <StoryList config={config} data={data} people={menu} byEmail={byEmail} read={read} onPick={pick} />
        </>
      )}
      {!chosen && others.length ? <Sec name="Not on the roster" sub={others.length} /> : null}
      {!chosen && others.length ? <div className="pt-stack aic-cards">{others.map(s => <Row key={s.viewer_id} config={config} data={data} student={null} email={s.viewer_id} link={null} sheet={s} urls={urls} due={due} past={past} onUnlock={setUnlock} />)}</div> : null}
    </Shell>
  );
}

// Everybody in the section, a row a student, in the portal's row language:
// green is in, red is late, amber is still working, grey has not started.
// With Claude's read in the bucket the rows run strongest first and carry
// the letter, the read in a sentence or two, and what he asked to be told:
// late, or no pre-production. Without a read they run by name.
const LETTERS = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
const TINT = { Submitted: "done", "Submitted late": "late", Working: "due", "Not started": "off" };
function StoryList({ config, data, people, byEmail, read, onPick }) {
  const reads = read?.students || {};
  const rows = people.map(p => {
    const email = lower(p.student.email);
    const sheet = byEmail.get(email);
    const story = audioStoryOf(sheet?.answers || {});
    return { ...p, sheet, mine: reads[email] || null, flags: (reads[email]?.flags || read?.absent?.[email] || []), headline: story.headline.trim(), seconds: story.audio ? story.audio.seconds : null };
  });
  const rank = (r) => { const i = LETTERS.indexOf(r.mine?.letter || ""); return i < 0 ? LETTERS.length : i; };
  const withRead = rows.filter(r => r.mine).sort((x, y) => rank(x) - rank(y) || x.name.localeCompare(y.name));
  const without = rows.filter(r => !r.mine);
  // Each student, or every timeline on one scale, the pre-production review's two views.
  const [view, setView] = useState("each");
  const lines = withRead.map(r => ({ student: r.student, line: r.mine.timeline })).filter(r => r.line?.parts?.length).sort((x, y) => x.student.name.localeCompare(y.student.name));
  const row = (r) => {
    const tint = TINT[r.status] || "off";
    const flags = r.flags.filter(f => !/^Story (submitted late|not submitted)/.test(f));
    return (
      <div key={r.id} className={"pt-row link " + tint}>
        <Face config={config} data={data} name={r.name} size={40} />
        <button type="button" className="pt-main pt-focus" onClick={() => onPick(r.id)}>
          <span className="pt-title">{r.name}</span>
          <span className={"pt-when " + tint}><span>{r.status}{r.sheet?.submitted_at ? " " + when(r.sheet.submitted_at) : ""}</span>{flags.map(f => <span key={f} className="pt-gpill late">{f}</span>)}</span>
          {r.headline ? <span className="pt-meta">{r.headline}{r.seconds ? " · " + clock(r.seconds) : ""}</span> : null}
          {r.mine?.read ? <span className="pt-text">{r.mine.read}</span> : null}
        </button>
        <div className="pt-side">{r.mine?.letter ? <Gm>{r.mine.letter}</Gm> : null}<span className="pt-chev" aria-hidden="true">›</span></div>
      </div>
    );
  };
  return (
    <>
      {withRead.length ? (
        <div className="pt-day">
          <Sec name="Claude's read" sub={withRead.length + " read, strongest first"} />
          <p className="pt-quiet">Read from the transcripts. The letter is where Claude would put the story; the grade is yours.</p>
          <ReadSummary reads={withRead.map(r => r.mine)} notes={read.notes} what="stories" />
          {lines.length ? (
            <div className="pt-chips" role="tablist" aria-label="View">
              <Chip on={view === "each"} onClick={() => setView("each")}>Each student</Chip>
              <Chip on={view === "lines"} onClick={() => setView("lines")}>All timelines</Chip>
            </div>
          ) : null}
          {view === "lines" && lines.length ? <Compare rows={lines} /> : <div className="pt-stack">{withRead.map(row)}</div>}
        </div>
      ) : null}
      {without.length ? (
        <div className="pt-day">
          <Sec name={withRead.length ? "No read" : "Stories"} sub={without.length} />
          <div className="pt-stack">{without.map(row)}</div>
        </div>
      ) : null}
    </>
  );
}

// One student's card, the pre-production review's: who and where they stand,
// the story to play with its timeline, Claude's letter and flags, the read,
// and the unlock folded under one line.
function Row({ config, data = null, student, email, link, sheet, urls, due, past, onUnlock, mine = null, readAt = null, links = null }) {
  const [busy, setBusy] = useState("");
  const player = useRef(null);
  const seek = useCallback((t) => { const el = player.current; if (!el) return; try { el.currentTime = t; el.play(); } catch { /* the player says so itself */ } }, []);
  const story = audioStoryOf(sheet?.answers || {});
  const started = !!sheet && Object.keys(sheet.answers || {}).length > 0;
  const late = sheet?.submitted_at && due && Date.parse(sheet.submitted_at) > Date.parse(due);
  const left = started ? problemsOf(story) : [];
  const unlocked = sheet?.unlockedUntil && Date.parse(sheet.unlockedUntil) > Date.now();
  const tint = sheet?.submitted_at ? (late ? "late" : "done") : started ? "due" : "off";
  const say = sheet?.submitted_at ? (late ? "Submitted late " : "Submitted ") + when(sheet.submitted_at) : started ? "Working, not submitted" : "Not started";
  const act = async (until) => {
    if (!onUnlock) return;
    setBusy("saving");
    try { await onUnlock(email, until); setBusy(""); } catch (e) { setBusy("Not saved: " + e.message); }
  };
  const cover = story.cover && urls[story.cover.path];
  const clip = story.audio && urls[story.audio.path];
  const flags = (mine?.flags || []).filter(f => !/^Story (submitted late|not submitted)/.test(f));
  // The story keeps its sources as a list with the student's own title and
  // outlet; the read panel wants lines and a map of names.
  const cited = sourceListOf(sheet?.answers?.sources, links || {});
  const named = { ...(links || {}), ...Object.fromEntries(cited.filter(x => x.link && (x.title || x.source)).map(x => [x.link, { site: x.source || (links || {})[x.link]?.site || "", title: x.title || (links || {})[x.link]?.title || "" }])) };
  const forPanel = sheet ? { ...sheet, answers: { ...(sheet.answers || {}), sources: cited.map(x => x.link || x.title).filter(Boolean).join("\n") } } : sheet;
  return (
    <article className={"pt-row aic-card" + (sheet?.submitted_at ? "" : " due")}>
      <div className="aic-head">
        <div className="aic-who">
          {student ? <Face config={config} data={data} name={student.name} size={40} /> : null}
          <div className="pt-main">
            <p className="pt-title">{student ? <StudentLink config={config} student={student} /> : email}</p>
            <p className={"pt-when " + tint}><span>{say}</span>{flags.map(f => <span key={f} className="pt-gpill late">{f}</span>)}</p>
            {started ? <p className="pt-meta">{story.audio ? clock(story.audio.seconds) + ", " : ""}{story.voices.length} voice{story.voices.length === 1 ? "" : "s"}{story.voices.some(v => v.knew === false) ? " (" + story.voices.filter(v => v.knew === false).map(v => v.name.trim() || "unnamed").join(", ") + " did not know)" : ""}, {story.sounds.length} sound{story.sounds.length === 1 ? "" : "s"}{left.length ? ", " + left.length + " thing" + (left.length === 1 ? "" : "s") + " left before Submit" : ""}</p> : null}
          </div>
        </div>
        {started && link ? <a className="pt-io pt-focus" href={"/" + config.id + "/worksheets/" + AUDIO_STORY_KEY + "?s=" + encodeURIComponent(link)}>Open story</a> : null}
      </div>
      {started ? (
        <div className="apr-own asv-story">
          {cover ? <img className="asv-cover" src={cover} alt="" /> : null}
          <div className="pt-main">
            <p className="aic-big">{story.headline.trim() || "No headline yet"}</p>
            {story.listen.trim() ? <p className="aic-line">{story.listen}</p> : null}
          </div>
        </div>
      ) : null}
      {story.audio ? (
        <div className="apr-listen">
          {clip ? <audio ref={player} className="apr-player" controls preload="metadata" src={clip} /> : <p className="pt-quiet">Signing the link.</p>}
          {mine?.timeline?.parts?.length ? <Timeline line={mine.timeline} onSeek={clip ? seek : undefined} /> : null}
        </div>
      ) : started ? <p className="pt-quiet">No file yet.</p> : null}
      {mine?.letter || mine?.why ? (
        <div className="apr-own">
          <h3 className="apr-pl">Where Claude would put the story{mine.letter ? <> <Gm>{mine.letter}</Gm></> : null}</h3>
          {mine.why ? <p className="apr-say">{mine.why}</p> : null}
        </div>
      ) : null}
      {mine ? <ReadPanel read={mine} sheet={forPanel} at={readAt} links={named} title={story.headline.trim()} name={student ? student.name : email} url={clip || ""} onSeek={clip ? seek : undefined} lineUp /> : null}
      {/* The unlock buttons sit folded under one line, so a card is not a row
          of buttons; the line itself says whether the story is open. */}
      {past && sheet && onUnlock ? (
        <details className="aic-fold">
          <summary className="pt-focus">{unlocked ? "Open for late work until " + when(sheet.unlockedUntil) : "Locked. Open for late work"}</summary>
          <div className="pt-acts">
            <button type="button" className="pt-io pt-focus" disabled={busy === "saving"} onClick={() => act(new Date(Date.now() + 24 * 3600e3).toISOString())}>Unlock for 24 hours</button>
            <button type="button" className="pt-io pt-focus" disabled={busy === "saving"} onClick={() => act(new Date(Date.now() + 72 * 3600e3).toISOString())}>Unlock for 3 days</button>
            {unlocked ? <button type="button" className="pt-io pt-focus" disabled={busy === "saving"} onClick={() => act(null)}>Lock again</button> : null}
            {busy && busy !== "saving" ? <span className="pt-when late">{busy}</span> : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}

const FIELD_SAY = {
  audio: "the file, JSON { path, seconds, name }",
  cover: "the cover picture, JSON { path, w, h }",
  headline: "the headline, a line",
  listen: "the summary, up to " + MAX_LISTEN_WORDS + " words",
  voices: "everyone who talks, JSON [{ id, name, role, knew }], knew true, false or null",
  sounds: "the sounds, JSON [{ id, what, kind, from }], kind mine, music or found",
  look: "light or dark",
  credits: "who did what, a pair only",
};

export function AudioStoryControl({ config, worksheetKey = AUDIO_STORY_KEY, roster }) {
  const [data] = useClassState(config.storageKey);
  const [sheets, setSheets] = useState(null);
  const [error, setError] = useState("");
  const [who, setWho] = useState("");
  const local = localWorksheet(worksheetKey);
  const base = "/" + config.id + "/worksheets/" + worksheetKey;
  const people = roster.filter(s => s.email && !isLurker(s.name));
  useEffect(() => {
    let alive = true;
    call({ groupKey: config.id, key: worksheetKey, all: true }).then(out => { if (alive) setSheets(out.sheets); }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [config.id, worksheetKey]);
  const urls = useUrls(config, sheets);
  const sheet = sheets && who ? sheets.find(s => s.viewer_id === lower(who)) || null : null;
  return (
    <Shell>
      <h1 className="asv-title">Audio story, how the sheet works</h1>
      <p className="asv-p"><a className="asv-link" href={base}>The sheet</a> · <a className="asv-link" href={base + "?review"}>Review</a> · <a className="asv-link" href={"/" + config.id + "/worksheets/" + AUDIO_RESEARCH_KEY + "?control"}>Audio exercise control</a></p>

      <h2 className="asv-h2">Open</h2>
      <p className="asv-p">{local ? (openTo(local, config.id, data) ? "Open to " + config.code + " students now." : "Not open to " + config.code + " students.") : "Not registered."} The registry says {JSON.stringify(local?.open)}; the class's worksheetsOpen switch on the Worksheets page, when set, wins: {JSON.stringify(data?.worksheetsOpen?.[worksheetKey] ?? null)}. The door on the student home shows while the sheet is open and the Audio story assignment's due date has not passed.</p>

      <h2 className="asv-h2">The page</h2>
      <p className="asv-p">Building on the left, the story page live on the right (one column on a phone, with Build and Hear your story tabs). The steps at the top are these, each editable in place with Edit the words:</p>
      <ol className="asv-list">{STEPS.map(([k, name, say]) => <li key={k}><b>{name}</b> {say}</li>)}</ol>

      <h2 className="asv-h2">Fields</h2>
      <p className="asv-p">One row per field per student in worksheet_answers, written 700 ms after the last change, with a copy kept in the browser until the server has the same words. A row holds 500 characters, so a longer value is cut into rows by position and joined on read.</p>
      <ul className="asv-list">{Object.keys(FIELD_SAY).map(f => <li key={f}><code>{f}</code> {FIELD_SAY[f]}</li>)}</ul>

      <h2 className="asv-h2">The file and the cover</h2>
      <p className="asv-p">The file is m4a, mp3, wav or aac, at most {clock(MAX_STORY_SECONDS)} (a file that reads a second over passes, for rounding) and under 30 MB, the bucket's cap, which a five-minute wav can exceed; m4a and mp3 do not. The browser reads the length off the file first and refuses a longer one or another format before anything goes up. The file goes straight into the private visual-story bucket at {config.id}/(email)/audio-(id).(ext) as the student. The cover is any picture, iPhone HEIC included, redrawn at most 2000 pixels on the long side as a JPEG in the browser, then up into the same folder. The bucket's rules keep a student to their own folder and let the instructor read every folder. Swapping a file leaves the old one in the bucket. The student plays the clip back through a signed link an hour long made with their own token; the review and this page sign links through the server.</p>

      <h2 className="asv-h2">Submit</h2>
      <p className="asv-p">Submit is refused in the browser until every rule holds, with the list of what is left: a file, a cover, a headline, a listen line of 1 to {MAX_LISTEN_WORDS} words, at least one voice, every voice named and marked whether they knew they were being recorded, and a line about where every piece of music or found audio came from. Then every pending answer is flushed and submitted_at is written on the student's worksheet_sheets row; the first submit also sets first_submitted_at, which the lateness read uses. Submitting again overwrites submitted_at only. After the due date in worksheet_deadlines (sql/audio-story.sql), the database refuses every save and submit for that sheet, and the Unlock buttons on the review write a worksheet_unlocks row that lets one student through until a time.</p>

      <h2 className="asv-h2">The headline, the pair and the knew mark</h2>
      <p className="asv-p">A story with no headline starts from the <code>story</code> line on the student's audio exercise sheet, read once on load. The pair line reads the row <code>audio-pairs-plan</code>, the one the Pairs view on the ideas review writes; each member of a pair has their own sheet and submits their own copy, with a Made with box for who did what, the way the audio exercise works. The knew-they-were-recorded mark is on each voice; the story page a classmate sees never draws it, and the instructor's read (?s=) and the review do.</p>

      <h2 className="asv-h2">The review</h2>
      <p className="asv-p"><a className="asv-link" href={"/" + config.id + "/audio-stories"}>Classmates' audio stories</a> · <a className="asv-link" href={"/" + config.id + "/audio-reviews"}>Who reviewed what</a></p>
      <p className="asv-p">{WINDOW[config.id] ? "The review opens " + when(WINDOW[config.id].opens) + " and closes " + when(WINDOW[config.id].closes) + ", and the comments reach each author, names attached, " + when(WINDOW[config.id].releases) + ". The three times are written in src/engine/audiostory/reviewmodel.js and the server reads the clock against them on every request. No button opens the review early, reopens the review or lets one student in late." : "This class has no window. The stage buttons on Who reviewed what are the word here, and they exist for the practice class only."}</p>
      <p className="asv-p">Who reviews what: the first time anyone in a section asks after the window opens, the server takes the stories submitted in the section at that moment and gives every student on the section's roster {NEED_ASSIGNED} of them, a student who did not submit included. The stories stand in a ring in a fixed order that is not the roster's. A student with a story in gets the next {NEED_ASSIGNED} around the ring, so every story is assigned {NEED_ASSIGNED} times by those students alone; a student with no story in takes the next {NEED_ASSIGNED} from a pointer that keeps walking the ring. Nobody gets their own. The result is saved once in the app_data row <code>audio-review-{config.id}-(section)-plan</code>, and the row's id is the table's key, so a second set cannot be written. A story submitted after that moment shows on the grid and is assigned to nobody.</p>
      <p className="asv-p">What a student sees: the section's submitted stories as covers and headlines with no names, the {NEED_ASSIGNED} assigned outlined in red, and a green outline once the student has commented. A story opens on its story page with the name, the player, the chapters, the voices and the sources; the knew-they-were-recorded marks never leave the server. The counter asks for the {NEED_ASSIGNED} in red and {NEED_TOTAL} in all, and keeps counting past {NEED_TOTAL}.</p>
      <p className="asv-p">A comment: the best chapter, picked from the story's own named chapters; three boxes of at least {MIN_CHARS} characters each (why the chapter, one way the story shone, one thing to encourage); a short line on how the story made them feel; and the sound quality as one of four taps. The server checks all of it and refuses a comment outside the window or on the student's own story. A comment is one row in story_comments, the visual stories' table, one a story a reviewer, with the chapter in best_where as chapter:(id). A story with no chapters takes the comment with no pick. The feeling and the sound quality were added after the table was made, so they are kept beside the row in an app_data row a reviewer a story, <code>audio-said-{config.id}-(story)-(reviewer)-plan</code>. Saving again replaces the row. A draft is kept in the browser until the save lands.</p>
      <p className="asv-p">Listening: while a classmate's story is playing on a student's page, the page notes which second of the file is playing, four times a second, and sends the seconds to the server every fifteen seconds and when the student leaves the story. The server keeps the union in one app_data row a listener a story, <code>audio-listen-{config.id}-(story)-(listener)-plan</code>, so the same ten seconds played six times is ten seconds heard, and skipping ahead leaves the skipped part unheard. Who reviewed what counts a story as heard in full at {Math.round(HEARD_FULL * 100)} percent of the file, and counts a comment as written having heard under half below {Math.round(HEARD_LITTLE * 100)} percent. Every comment carries the time heard. Students are not shown any of the listening record. The count comes from the student's own browser, so a muted tab left playing reads as heard.</p>
      <p className="asv-p">Telling students: from the open, a green bar at the top of the home and a row under My work, each with the student's own count. After the release both point at the student's own story, where the comments are, and the bar steps down Sunday, November 22.</p>

      <h2 className="asv-h2">Words</h2>
      <p className="asv-p">Every line a student reads has a default in the code and can be changed in place on the sheet while signed in as the instructor (Edit the words). Edits live in the app_data row <code>{AUDIO_STORY_COPY_ROW}</code>, which only an instructor can write. A cleared line puts the default back.</p>

      <h2 className="asv-h2">Who sees what</h2>
      <p className="asv-p">A student signed in by email sees and writes their own sheet only. The instructor's own email gets a sheet of its own for trying the page. The review and this page need an instructor session or the PIN. Reads of every sheet go through the server with the service key. Problem reports go into worksheet_reports and show at the top of the review. The review shows one story at a time, picked from the Student menu or stepped with Previous and Next, and the address keeps the student as st=.</p>

      <h2 className="asv-h2">One student</h2>
      {error ? <p className="asv-p">Could not read the sheets: {error}</p> : null}
      <select className="asv-select" value={who} onChange={e => setWho(e.target.value)} aria-label="Student">
        <option value="">Choose a student</option>
        {people.map(p => <option key={p.email} value={p.email}>{p.name}{sectionOf(p) ? " · " + sectionOf(p) : ""}</option>)}
      </select>
      {who && sheets ? (sheet ? (<>
        <p className="asv-p">{sheet.submitted_at ? "Submitted " + when(sheet.submitted_at) + "." : "Started, not submitted."} {Object.keys(sheet.answers || {}).length} fields on the server.</p>
        <Row config={config} student={people.find(p => lower(p.email) === lower(who)) || null} email={lower(who)} link={null} sheet={sheet} urls={urls} due={null} past={false} onUnlock={null} />   {/* past is false, so no Unlock button draws here; the review has them */}
        <pre className="asv-pre">{JSON.stringify(sheet.answers, null, 2)}</pre>
      </>) : <p className="asv-p">No sheet opened yet.</p>) : null}
    </Shell>
  );
}

function Shell({ children, config }) {
  return <PageShell config={config}><style>{CSS}</style><div className="asv-in">{children}</div></PageShell>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.asv-in{display:flex;flex-direction:column;gap:20px}
.asv-title{margin:0;font-size:32px;font-weight:700;letter-spacing:-.02em}
.asv-h2{margin:12px 0 0;font-size:20px;font-weight:700;display:flex;align-items:center;gap:8px}
.asv-p{margin:0;font-size:17px;line-height:1.5;color:${T.secondary}}
.asv-p code,.asv-list code{font-size:14px;background:${S.sunk};padding:1px 6px;border-radius:6px;color:${T.primary}}
.asv-muted{margin:0;font-size:15px;line-height:1.5;color:${T.muted}}
.asv-bad{color:${ST.late};font-size:14px}
.asv-link{color:${T.primary};font-weight:600}
.asv-list{margin:0;padding-left:20px;font-size:15.5px;line-height:1.6;color:${T.secondary}}
.asv-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.asv-story{display:flex;flex-direction:row;align-items:flex-start;gap:16px}
.asv-cover{display:block;width:96px;height:96px;object-fit:cover;border-radius:10px;background:${S.card}}
.asv-head{margin:0;font-size:17px;font-weight:600;line-height:1.3}
.asv-btn{font:inherit;font-size:14px;font-weight:600;padding:6px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer}
.asv-btn:disabled{opacity:.45;cursor:default}
.asv-select{font:inherit;font-size:16px;padding:8px 12px;border-radius:10px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};max-width:360px}
.asv-pre{margin:0;font-size:13px;line-height:1.5;padding:12px;border-radius:10px;background:${S.sunk};overflow:auto;white-space:pre-wrap;word-break:break-word}
@media (max-width:560px){ .asv-story{grid-template-columns:1fr} }
`;
