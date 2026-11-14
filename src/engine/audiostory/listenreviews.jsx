// Who reviewed which audio story, for the instructor: /comm3/audio-reviews.
//
// The visual stories' /comm3/reviews for sound. Everything comes from the
// review route's admin feed: who was assigned what, every submitted story,
// every comment with its author. Complete means the three assigned stories
// and five in all, the same numbers the students' counter uses; anything past
// five is above and beyond (Andrew, 2026-11-13: "they can review extra, and I
// love it if they do"). The page asks again every minute while open, and the
// data goes out as a JSON file or a CSV of the comments.
//
// Andrew, 2026-11-13, on the first build's tables: "it's an ugly table. make
// it really pretty, like i asked you to do with the pairer." So the page is
// the final project review's look: dark, faces, colour, and few words. A
// student is a card with their face ringed in their standing, five pips for
// the five reviews, and Listening Data as vertical bars, one a story, each
// standing on the face of the story's author. Stories is the same page
// turned around: a card a story, a bar a listener.
//
// The comments stay folded until he opens them, each visit, since the page
// may be on the projector. The practice class alone has stage buttons and
// practice stories; a real class runs on the clock in reviewmodel.js.

import { useEffect, useState } from "react";
import { useClassState } from "../store.js";
import { usePhotos } from "../photos.js";
import { nameShown } from "../roster.js";
import { loadFont } from "./bits.jsx";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf } from "../sections.js";
import { StudentLink } from "../StudentPage.jsx";
import { clock } from "./storymodel.js";
import { tally, NEED_TOTAL, NEED_ASSIGNED, HEARD_FULL, HEARD_LITTLE } from "./reviewmodel.js";

const ASK = { best: "The best chapter, and why", shone: "One way this story shone", encourage: "One thing you would encourage the author to do" };
const lower = (s) => String(s || "").trim().toLowerCase();
const when = (t) => (t ? new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

const api = async (config, body) => {
  const r = await fetch("/api/audio-review", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), groupKey: config.id, ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};

const csvCell = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const toCsv = (comments, listenOf) => ["story_id,owner,owner_email,author,author_email,heard_seconds,story_seconds,best_chapter,best,shone,encourage,updated_at",
  ...comments.map(c => [c.story, c.owner, c.ownerEmail, c.author, c.authorEmail, listenOf.get(lower(c.authorEmail) + " " + c.story)?.heard || 0, listenOf.get(lower(c.authorEmail) + " " + c.story)?.length || "", c.chapterName || "", c.best, c.shone, c.encourage, c.updated_at].map(csvCell).join(","))].join("\n");
const download = (name, text, type) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

const hueOf = (name) => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const initials = (name) => String(name || "").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
const first = (name) => String(name || "").trim().split(/\s+/)[0] || "";

function Face({ name, shown, photo, size, tone = "" }) {
  const h = hueOf(name);
  return (
    <span className={"ar-face" + (tone ? " ar-ring-" + tone : "")} style={{ width: size, height: size, fontSize: Math.round(size * 0.36), background: `linear-gradient(135deg, hsl(${h} 72% 58%), hsl(${(h + 48) % 360} 68% 38%))` }}>
      {photo ? <img src={photo} alt="" /> : initials(shown || name)}
    </span>
  );
}

// Listening Data: one vertical bar a story or a listener, the percent on top
// and the face of the author or the listener underneath. A tick on the face
// means the listener commented.
function Bars({ bars }) {
  if (!bars.length) return null;
  return (
    <div className="ar-bars" role="img" aria-label={bars.map(b => b.full + " " + b.n + " percent").join(", ")}>
      {bars.map(b => (
        <div className={"ar-col" + (b.assigned ? " ar-assigned" : "")} key={b.key} title={b.full + ", " + b.n + "%" + (b.done ? ", commented" : "")}>
          <span className={"ar-n ar-t-" + b.tone}>{b.n}%</span>
          <span className="ar-track"><span className={"ar-bar ar-b-" + b.tone} style={{ height: Math.max(b.n, 3) + "%" }} /></span>
          <span className="ar-under"><Face name={b.name} shown={b.shown} photo={b.photo} size={26} />{b.done ? <span className="ar-tick">✓</span> : null}</span>
          <span className="ar-label">{first(b.shown)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AudioReviews({ config }) {
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState("");
  const [at, setAt] = useState(null);
  const [data] = useClassState(config.storageKey);
  const [photos] = usePhotos(config.storageKey);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  const [view, setView] = useState("students");
  const [sort, setSort] = useState("name");
  const [group, setGroup] = useState("story");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState("");

  const ask = () => api(config, { action: "admin" }).then(out => { setFeed(out); setAt(Date.now()); setError(""); }).catch(e => setError(e.message));
  useEffect(() => {
    ask();
    const t = setInterval(ask, 60000);
    return () => clearInterval(t);
  }, [config]);
  useEffect(() => { document.title = config.code + " · Audio story reviews"; loadFont(); }, [config]);

  if (error && !feed) return <Shell><p className="ar-say">Could not read the reviews: {error}</p></Shell>;
  if (!feed) return <Shell><p className="ar-say">Loading the reviews.</p></Shell>;

  const practice = !feed.window;
  const act = async (body, say) => { setBusy(say); try { await api(config, body); await ask(); setBusy(""); } catch (e) { setBusy(e.message); } };
  const { rows, perStory, commentCount } = tally(feed, section);
  const sorted = [...rows].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "total" ? b.total - a.total || a.name.localeCompare(b.name) : (a.complete === b.complete ? a.total - b.total || a.name.localeCompare(b.name) : a.complete ? 1 : -1));
  const storiesSorted = [...perStory].sort((a, b) => a.reviews - b.reviews || a.name.localeCompare(b.name));
  const stage = feed.stages?.[section] || "";
  const headlineOf = new Map(perStory.map(s => [s.id, s]));
  const listenOf = new Map((feed.listens || []).map(l => [lower(l.reviewer) + " " + l.story, l]));
  const heardSay = (c) => { const l = listenOf.get(lower(c.authorEmail) + " " + c.story); return "Heard " + clock(l ? l.heard : 0) + (l && l.length ? " of " + clock(l.length) : ""); };
  const inSection = (feed.comments || []).filter(c => headlineOf.has(c.story) && lower(c.authorEmail) !== lower(c.ownerEmail));
  const commented = new Set(inSection.map(c => lower(c.authorEmail) + " " + c.story));
  const groups = group === "story"
    ? perStory.map(s => ({ key: s.id, title: s.headline, sub: "by " + s.name, comments: inSection.filter(c => c.story === s.id) }))
    : rows.map(r => ({ key: r.email, title: r.name, sub: "", comments: inSection.filter(c => lower(c.authorEmail) === r.email) }));
  const groupsShown = groups.filter(g => g.comments.length)
    .map(g => ({ ...g, comments: [...g.comments].sort((a, b) => a.author.localeCompare(b.author)) }))
    .sort((a, b) => a.title.localeCompare(b.title));

  // A bar is one student on one story. Every assigned story has a bar, at 0
  // when nothing played, and so does any other story the student played or
  // commented on.
  const who = (name) => ({ name, shown: nameShown(data, name), photo: photos[name] || "" });
  const pct = (reviewer, storyId) => { const l = listenOf.get(reviewer + " " + storyId); return l && l.length ? Math.min(100, Math.round(100 * l.heard / l.length)) : 0; };
  const toneOf = (n) => (n >= HEARD_FULL * 100 ? "ok" : n >= HEARD_LITTLE * 100 ? "warn" : "low");
  const isAssigned = (reviewer, st) => (feed.assign?.[reviewer] || []).includes(st.email);
  const wanted = (reviewer, st) => st.email !== reviewer && (isAssigned(reviewer, st) || listenOf.has(reviewer + " " + st.id) || commented.has(reviewer + " " + st.id));
  const bar = (r, st, of) => { const n = pct(r.email, st.id); return { key: r.email + st.id, ...who(of === "story" ? st.name : r.name), full: of === "story" ? st.name + ", " + st.headline : r.name, n, tone: toneOf(n), assigned: isAssigned(r.email, st), done: commented.has(r.email + " " + st.id) }; };
  const order = (a, b) => (b.assigned ? 1 : 0) - (a.assigned ? 1 : 0) || a.name.localeCompare(b.name);
  const barsOfStudent = (r) => perStory.filter(st => wanted(r.email, st)).map(st => bar(r, st, "story")).sort(order);
  const barsOfStory = (st) => rows.filter(r => wanted(r.email, st)).map(r => bar(r, st, "student")).sort(order);
  const standing = (r) => (r.complete ? "ok" : r.total ? "warn" : "none");
  const nComplete = rows.filter(r => r.complete).length, nStarted = rows.filter(r => !r.complete && r.total > 0).length, nNone = rows.filter(r => r.total === 0).length;

  return (
    <Shell>
      <div className="ar-top">
        <div className="ar-titles">
          <h1>Audio story reviews {stage ? <span className={"ar-pill ar-stage-" + stage}>{stage}</span> : null}</h1>
          {feed.window ? <span className="ar-dim">Opens {when(feed.window.opens)} · Closes {when(feed.window.closes)} · Comments out {when(feed.window.releases)}</span> : null}
        </div>
        <div className="ar-progress">
          <div className="ar-pbar" role="img" aria-label={nComplete + " complete, " + nStarted + " started, " + nNone + " no reviews yet"}>
            {nComplete ? <span className="ar-p-ok" style={{ flexGrow: nComplete }} /> : null}
            {nStarted ? <span className="ar-p-warn" style={{ flexGrow: nStarted }} /> : null}
            {nNone ? <span className="ar-p-none" style={{ flexGrow: nNone }} /> : null}
          </div>
          <ul className="ar-legend">
            <li><span className="ar-dot ar-p-ok" />Complete <b>{nComplete}</b></li>
            <li><span className="ar-dot ar-p-warn" />Started <b>{nStarted}</b></li>
            <li><span className="ar-dot ar-p-none" />No reviews yet <b>{nNone}</b></li>
            <li>Stories in <b>{perStory.length}</b></li>
            <li>Comments <b>{commentCount}</b></li>
            <li>Past {NEED_TOTAL} <b>{rows.filter(r => r.extra > 0).length}</b></li>
          </ul>
        </div>
        <div className="ar-tools">
          {sections.length > 1 ? <div className="ar-tabs" role="tablist" aria-label="Section">{sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"ar-tab" + (s === section ? " ar-set" : "")} onClick={() => setSection(s)}>{s}</button>)}</div> : null}
          <div className="ar-tabs" role="tablist" aria-label="View">
            {[["students", "Students"], ["stories", "Stories"]].map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={view === k} className={"ar-tab" + (view === k ? " ar-set" : "")} onClick={() => setView(k)}>{label}</button>)}
          </div>
        </div>
      </div>

      {practice ? (
        <div className="ar-row">
          {["building", "reading", "closed", "released"].map(s => <button key={s} type="button" className={"ar-tab" + (stage === s ? " ar-set" : "")} onClick={() => act({ action: "stage", section, stage: s }, "Setting the stage")}>{s}</button>)}
          <button type="button" className="ar-btn" onClick={() => act({ action: "practice-fill" }, "Making practice stories")}>Make practice stories from mine</button>
          <button type="button" className="ar-btn" onClick={() => act({ action: "practice-clear" }, "Clearing")}>Clear the practice stories</button>
          {busy ? <span className="ar-dim">{busy}</span> : null}
        </div>
      ) : null}

      {view === "students" ? (
        <>
          <div className="ar-row">
            <div className="ar-tabs" role="tablist" aria-label="Sort">
              {[["name", "By name"], ["done", "Not complete first"], ["total", "Most reviews first"]].map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={sort === k} className={"ar-tab" + (sort === k ? " ar-set" : "")} onClick={() => setSort(k)}>{label}</button>)}
            </div>
          </div>
          <div className="ar-grid">
            {sorted.map(r => {
              const tone = standing(r);
              const choice = Math.max(0, NEED_TOTAL - r.requiredNeed);
              return (
                <article className={"ar-card ar-c-" + tone} key={r.email}>
                  <div className="ar-who">
                    <Face {...who(r.name)} size={54} tone={tone} />
                    <div className="ar-name">
                      <StudentLink config={config} student={r.name} />
                      <div className="ar-pips" role="img" aria-label={r.requiredDone + " of " + r.requiredNeed + " assigned, " + r.othersDone + " of their choice"}>
                        {Array.from({ length: r.requiredNeed }, (_, i) => <span key={"a" + i} className={"ar-pip ar-pip-a" + (i < r.requiredDone ? " ar-on" : "")} />)}
                        {Array.from({ length: choice }, (_, i) => <span key={"c" + i} className={"ar-pip" + (i < r.othersDone ? " ar-on" : "")} />)}
                        {r.extra ? <span className="ar-extra">+{r.extra}</span> : null}
                      </div>
                    </div>
                    <span className={"ar-chip ar-chip-" + tone}>{r.complete ? "Complete" : r.total + " of " + NEED_TOTAL}</span>
                  </div>
                  {r.submitted ? null : <span className="ar-flag">No story in</span>}
                  {r.unheard ? <span className="ar-flag ar-flag-hot">{r.unheard} commented, heard under half</span> : null}
                  <h2>Listening Data</h2>
                  <Bars bars={barsOfStudent(r)} />
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="ar-grid">
          {storiesSorted.map(s => {
            const tone = s.reviews >= NEED_ASSIGNED ? "ok" : s.reviews ? "warn" : "none";
            return (
              <article className={"ar-card ar-c-" + tone} key={s.id}>
                <div className="ar-who">
                  <Face {...who(s.name)} size={54} tone={tone} />
                  <div className="ar-name">
                    <a className="ar-link" href={"/" + config.id + "/audio-stories?s=" + s.id}>{s.headline}</a>
                    <span className="ar-dim">{nameShown(data, s.name)}</span>
                  </div>
                  <span className={"ar-chip ar-chip-" + tone}>{s.reviews} {s.reviews === 1 ? "review" : "reviews"}</span>
                </div>
                <h2>Listening Data</h2>
                <Bars bars={barsOfStory(s)} />
              </article>
            );
          })}
        </div>
      )}

      <div className="ar-row ar-foot">
        <button type="button" className="ar-btn" aria-pressed={shown} onClick={() => setShown(v => !v)}>{shown ? "Hide the comments" : "Show the comments"}</button>
        {shown ? (
          <div className="ar-tabs" role="tablist" aria-label="Group">
            {[["story", "By story"], ["author", "By reviewer"]].map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={group === k} className={"ar-tab" + (group === k ? " ar-set" : "")} onClick={() => setGroup(k)}>{label}</button>)}
          </div>
        ) : null}
        <button type="button" className="ar-btn" onClick={() => download(config.id + "-audio-reviews.json", JSON.stringify({ readAt: new Date(at).toISOString(), section, rows, stories: perStory, feed }, null, 2), "application/json")}>JSON</button>
        <button type="button" className="ar-btn" onClick={() => download(config.id + "-audio-comments.csv", toCsv(inSection, listenOf), "text/csv")}>CSV</button>
        <a className="ar-link" href={"/" + config.id + "/audio-stories"}>Every story</a>
        <a className="ar-link" href={"/" + config.id + "/worksheets/audio-story?control"}>How the review works</a>
        <span className="ar-dim">read {when(at)}</span>
      </div>

      {shown ? groupsShown.map(g => (
        <div className="ar-group" key={g.key}>
          <h3>{g.title} {g.sub ? <span className="ar-dim">{g.sub}</span> : null} <span className="ar-dim">· {g.comments.length}</span></h3>
          {g.comments.map(c => (
            <article className="ar-comment" key={c.story + c.authorEmail}>
              <div className="ar-comment-top">
                <Face {...who(group === "story" ? c.author : c.owner)} size={30} />
                <strong>{group === "story" ? c.author : headlineOf.get(c.story)?.headline}</strong>
                {group === "author" ? <span className="ar-dim">by {c.owner}</span> : null}
                <span className="ar-chip">{heardSay(c)}</span>
                <span className="ar-dim ar-when">{when(c.updated_at)}</span>
              </div>
              <dl>
                <dt>{ASK.best}</dt><dd>{c.chapterName ? <span className="ar-chip ar-chip-ok">{c.chapterName}</span> : null}{c.best}</dd>
                <dt>{ASK.shone}</dt><dd>{c.shone}</dd>
                <dt>{ASK.encourage}</dt><dd>{c.encourage}</dd>
              </dl>
            </article>
          ))}
        </div>
      )) : null}
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="ar"><style>{CSS}</style><div className="ar-in">{children}</div></div>;
}

// The final project review's colours (finalproject/review.jsx), so the two
// pages read as one family.
const CSS = `
.ar{--bg:#0a0f1f;--bg2:#141c3a;--card:#1a2346;--card2:#222d58;--line:#2c3866;--ink:#f5f7ff;--dim:#b4bee0;--mute:#8793bd;
  --ok:#34d399;--ok-ink:#052e1f;--warn:#fbbf24;--low:#fb7185;--none:#56618c;--red:#ff6b6b;
  font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;color:var(--ink);
  background:radial-gradient(1100px 720px at 28% 18%,var(--bg2) 0%,var(--bg) 62%);min-height:calc(100vh - 60px);padding:18px 20px 70px;box-sizing:border-box}
.ar *{box-sizing:border-box}
.ar-in{max-width:1560px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.ar-say{font-size:17px;color:var(--dim);margin:40px 0}
.ar-top{display:grid;grid-template-columns:auto minmax(240px,1fr) auto;gap:14px 28px;align-items:center}
.ar-titles{display:flex;flex-direction:column;gap:6px}
.ar h1{margin:0;font-size:26px;font-weight:600;letter-spacing:-.01em;display:flex;align-items:center;gap:12px}
.ar h2{margin:6px 0 0;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
.ar h3{margin:14px 0 0;font-size:18px;font-weight:600}
.ar-dim{font-size:13.5px;color:var(--dim);font-weight:400}
.ar-pill{font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px;background:var(--card2);color:var(--ink);text-transform:capitalize}
.ar-stage-reading{background:var(--ok);color:var(--ok-ink)}
.ar-stage-closed{background:var(--warn);color:#2a1a00}
.ar-stage-released{background:#c4b5fd;color:#1b1040}
.ar-progress{display:flex;flex-direction:column;gap:8px;min-width:0}
.ar-pbar{display:flex;height:12px;border-radius:999px;overflow:hidden;background:var(--card);gap:2px}
.ar-pbar span{min-width:4px;transition:flex-grow .6s cubic-bezier(.2,.8,.2,1)}
.ar-p-ok{background:var(--ok)}.ar-p-warn{background:var(--warn)}.ar-p-none{background:var(--none)}
.ar-legend{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px 18px;font-size:13px;color:var(--dim)}
.ar-legend li{display:flex;align-items:center;gap:6px}
.ar-legend b{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums}
.ar-dot{width:10px;height:10px;border-radius:50%;flex:none}
.ar-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.ar-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ar-foot{padding-top:10px;border-top:1px solid var(--line)}
.ar-tabs{display:flex;gap:6px;flex-wrap:wrap}
.ar-tab,.ar-btn{font:inherit;font-size:14px;font-weight:600;min-height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;transition:transform .12s,border-color .15s}
.ar-tab:hover,.ar-btn:hover{border-color:var(--dim)}
.ar-btn:active{transform:scale(.96)}
.ar-tab.ar-set{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.ar-tab:focus-visible,.ar-btn:focus-visible,.ar a:focus-visible,.ar button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.ar-link,.ar-name a,.ar-name button{color:var(--ink);font:inherit;font-size:16px;font-weight:600;text-decoration:none;background:none;border:0;padding:0;text-align:left;cursor:pointer;line-height:1.25}
.ar-link:hover,.ar-name a:hover,.ar-name button:hover{text-decoration:underline}
.ar-foot .ar-link{font-size:14px;color:var(--dim)}

.ar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
.ar-card{--c:var(--none);display:flex;flex-direction:column;gap:8px;background:var(--card);border-radius:20px;padding:14px 16px 12px;border-top:4px solid var(--c);box-shadow:0 8px 24px rgba(0,0,0,.35);transition:transform .15s,background .15s}
.ar-card:hover{background:var(--card2);transform:translateY(-2px)}
.ar-c-ok{--c:var(--ok)}.ar-c-warn{--c:var(--warn)}.ar-c-none{--c:var(--none)}
.ar-who{display:flex;align-items:center;gap:12px}
.ar-name{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.ar-face{border-radius:50%;overflow:hidden;display:grid;place-items:center;font-weight:600;color:#fff;flex:none}
.ar-face img{width:100%;height:100%;object-fit:cover;display:block}
.ar-ring-ok{box-shadow:0 0 0 3px var(--card),0 0 0 6px var(--ok),0 0 18px var(--ok)}
.ar-ring-warn{box-shadow:0 0 0 3px var(--card),0 0 0 6px var(--warn)}
.ar-ring-none{box-shadow:0 0 0 3px var(--card),0 0 0 6px var(--none)}
.ar-pips{display:flex;align-items:center;gap:5px}
.ar-pip{width:16px;height:16px;border-radius:50%;border:2px solid var(--none);background:transparent}
.ar-pip-a{border-color:var(--red)}
.ar-pip.ar-on{background:var(--ok);border-color:var(--ok);box-shadow:0 0 8px var(--ok)}
.ar-extra{font-size:13px;font-weight:700;color:var(--ok)}
.ar-chip{display:inline-flex;align-items:center;font-size:12.5px;font-weight:600;border-radius:999px;padding:3px 10px;background:var(--card2);color:var(--dim);white-space:nowrap;margin-right:8px}
.ar-who .ar-chip{margin-right:0}
.ar-chip-ok{background:var(--ok);color:var(--ok-ink)}
.ar-chip-warn{background:var(--warn);color:#2a1a00}
.ar-chip-none{background:transparent;box-shadow:inset 0 0 0 1px var(--none);color:var(--mute)}
.ar-flag{align-self:flex-start;font-size:12px;font-weight:600;border-radius:999px;padding:2px 9px;box-shadow:inset 0 0 0 1px var(--none);color:var(--dim)}
.ar-flag-hot{box-shadow:none;background:var(--low);color:#3a0613}

.ar-bars{display:flex;align-items:flex-end;gap:6px;flex-wrap:wrap;min-height:118px}
.ar-col{display:flex;flex-direction:column;align-items:center;gap:3px;width:40px}
.ar-n{font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}
.ar-t-ok{color:var(--ok)}.ar-t-warn{color:var(--warn)}.ar-t-low{color:var(--low)}
.ar-track{display:flex;align-items:flex-end;width:22px;height:56px;background:rgba(255,255,255,.07);border-radius:7px;overflow:hidden}
.ar-assigned .ar-track{box-shadow:0 0 0 1.5px var(--red)}
.ar-bar{display:block;width:100%;border-radius:7px 7px 0 0;transition:height .6s cubic-bezier(.2,.8,.2,1)}
.ar-b-ok{background:linear-gradient(180deg,#6ee7b7,#10b981)}
.ar-b-warn{background:linear-gradient(180deg,#fde68a,#f59e0b)}
.ar-b-low{background:linear-gradient(180deg,#fda4af,#f43f5e)}
.ar-under{position:relative;display:block;margin-top:2px}
.ar-tick{position:absolute;right:-5px;bottom:-3px;width:14px;height:14px;border-radius:50%;background:var(--ok);color:var(--ok-ink);font-size:9px;font-weight:700;display:grid;place-items:center;box-shadow:0 0 0 2px var(--card)}
.ar-label{font-size:10.5px;color:var(--mute);max-width:40px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.ar-group{display:flex;flex-direction:column;gap:10px}
.ar-comment{background:var(--card);border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.ar-comment-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:15px}
.ar-when{margin-left:auto}
.ar-comment dl{margin:0;display:grid;grid-template-columns:minmax(140px,220px) 1fr;gap:6px 14px;font-size:15px}
.ar-comment dt{font-size:13px;color:var(--mute);line-height:1.4;padding-top:2px}
.ar-comment dd{margin:0;white-space:pre-wrap;line-height:1.45;color:var(--ink)}
@media (max-width:900px){ .ar-top{grid-template-columns:1fr} .ar-tools{justify-content:flex-start} .ar-comment dl{grid-template-columns:1fr} }
`;
