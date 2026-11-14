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
// The comments stay folded until he opens them, each visit, since the page
// may be on the projector. The practice class alone has stage buttons and
// practice stories; a real class runs on the clock in reviewmodel.js.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf } from "../sections.js";
import { StudentLink } from "../StudentPage.jsx";
import { REVIEWS_CSS } from "../visualstory/reviews.jsx";
import * as TOKENS from "../tokens.js";
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

export default function AudioReviews({ config }) {
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState("");
  const [at, setAt] = useState(null);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
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
  useEffect(() => { document.title = config.code + " · Audio story reviews"; }, [config]);

  if (error && !feed) return <Shell><p className="vrw-p">Could not read the reviews: {error}</p></Shell>;
  if (!feed) return <Shell><p className="vrw-p">Loading the reviews.</p></Shell>;

  const practice = !feed.window;
  const act = async (body, say) => { setBusy(say); try { await api(config, body); await ask(); setBusy(""); } catch (e) { setBusy(e.message); } };
  const { rows, perStory, commentCount } = tally(feed, section);
  const sorted = [...rows].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "total" ? b.total - a.total || a.name.localeCompare(b.name) : (a.complete === b.complete ? a.name.localeCompare(b.name) : a.complete ? 1 : -1));
  const storiesSorted = [...perStory].sort((a, b) => a.reviews - b.reviews || a.name.localeCompare(b.name));
  const stage = feed.stages?.[section] || "";
  const headlineOf = new Map(perStory.map(s => [s.id, s]));
  const listenOf = new Map((feed.listens || []).map(l => [lower(l.reviewer) + " " + l.story, l]));
  const heardSay = (c) => { const l = listenOf.get(lower(c.authorEmail) + " " + c.story); return "Heard " + clock(l ? l.heard : 0) + (l && l.length ? " of " + clock(l.length) : ""); };
  const inSection = (feed.comments || []).filter(c => headlineOf.has(c.story) && lower(c.authorEmail) !== lower(c.ownerEmail));
  const groups = group === "story"
    ? perStory.map(s => ({ key: s.id, title: s.headline, sub: "by " + s.name, comments: inSection.filter(c => c.story === s.id) }))
    : rows.map(r => ({ key: r.email, title: r.name, sub: "", comments: inSection.filter(c => lower(c.authorEmail) === r.email) }));
  const groupsShown = groups.filter(g => g.comments.length)
    .map(g => ({ ...g, comments: [...g.comments].sort((a, b) => a.author.localeCompare(b.author)) }))
    .sort((a, b) => a.title.localeCompare(b.title));
  // Listening as bars, inside the two tables. Andrew, 2026-11-13: "I want to
  // see the percentage of each story they listened to, in vertical bar chart
  // form ... and by STORY, how much each person listened." Then: "Listening
  // Data ... WAY more compact and closer together and a part of the table."
  // A bar is one student on one story. Every assigned story has a bar, at 0
  // when nothing played, and so does any other story the student played.
  const pct = (reviewer, storyId) => { const l = listenOf.get(reviewer + " " + storyId); return l && l.length ? Math.min(100, Math.round(100 * l.heard / l.length)) : 0; };
  const short = (name) => { const parts = String(name || "").trim().split(/\s+/); return parts.length > 1 ? parts[0] + " " + parts[parts.length - 1][0] + "." : parts[0] || ""; };
  const wanted = (reviewer, st) => st.email !== reviewer && ((feed.assign?.[reviewer] || []).includes(st.email) || listenOf.has(reviewer + " " + st.id));
  const byName = (a, b) => a.name.localeCompare(b.name);
  const barsOfStudent = (r) => [...perStory].sort(byName).filter(st => wanted(r.email, st)).map(st => ({ key: st.id, label: short(st.name), full: st.name + ", " + st.headline, n: pct(r.email, st.id) }));
  const barsOfStory = (st) => [...rows].sort(byName).filter(r => wanted(r.email, st)).map(r => ({ key: r.email, label: short(r.name), full: r.name, n: pct(r.email, st.id) }));

  const counts = [
    ["Students", rows.length],
    ["Stories in", perStory.length],
    ["Comments", commentCount],
    ["Complete", rows.filter(r => r.complete).length],
    ["Started, not complete", rows.filter(r => !r.complete && r.total > 0).length],
    ["No reviews yet", rows.filter(r => r.total === 0).length],
    ["Past " + NEED_TOTAL, rows.filter(r => r.extra > 0).length],
  ];

  return (
    <Shell>
      <div className="vrw-head">
        <h1 className="vrw-title">Audio story reviews</h1>
        <span className="vrw-muted">{config.code}{stage ? " · Stage: " + stage : ""} · read {when(at)}</span>
      </div>
      {feed.window ? <p className="vrw-muted">Opens {when(feed.window.opens)}. Closes {when(feed.window.closes)}. Comments come out {when(feed.window.releases)}.{feed.assignedAt?.[section] ? " Assigned " + when(feed.assignedAt[section]) + "." : ""}</p> : null}
      {sections.length > 1 ? (
        <div className="vrw-tabs" role="tablist" aria-label="Section">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"vrw-tab" + (s === section ? " vrw-on" : "")} onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}

      {practice ? (
        <div className="vrw-row">
          {["building", "reading", "closed", "released"].map(s => <button key={s} type="button" className={"vrw-tab" + (stage === s ? " vrw-on" : "")} onClick={() => act({ action: "stage", section, stage: s }, "Setting the stage")}>{s}</button>)}
          <button type="button" className="vrw-btn" onClick={() => act({ action: "practice-fill" }, "Making practice stories")}>Make practice stories from mine</button>
          <button type="button" className="vrw-btn" onClick={() => act({ action: "practice-clear" }, "Clearing")}>Clear the practice stories</button>
          {busy ? <span className="vrw-muted">{busy}</span> : null}
        </div>
      ) : null}

      <table className="vrw-table">
        <thead><tr>{counts.map(([k]) => <th key={k}>{k}</th>)}</tr></thead>
        <tbody><tr>{counts.map(([k, n]) => <td key={k}>{n}</td>)}</tr></tbody>
      </table>

      <div className="vrw-row">
        <button type="button" className="vrw-btn" onClick={() => download(config.id + "-audio-reviews.json", JSON.stringify({ readAt: new Date(at).toISOString(), section, rows, stories: perStory, feed }, null, 2), "application/json")}>Download everything (JSON)</button>
        <button type="button" className="vrw-btn" onClick={() => download(config.id + "-audio-comments.csv", toCsv(inSection, listenOf), "text/csv")}>Download the comments (CSV)</button>
        <a className="vrw-link" href={"/" + config.id + "/audio-stories"}>Every story</a>
        <a className="vrw-link" href={"/" + config.id + "/worksheets/audio-story?control"}>How the review works</a>
      </div>

      <style>{BARS_CSS}</style>
      <section className="vrw-sec" aria-label="Who completed the reviews">
        <div className="vrw-row">
          <h2 className="vrw-h2">Who completed the reviews</h2>
          <div className="vrw-seg" role="tablist" aria-label="Sort">
            {[["name", "By name"], ["done", "Not complete first"], ["total", "Most reviews first"]].map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={sort === k} className="vrw-segbtn" onClick={() => setSort(k)}>{label}</button>
            ))}
          </div>
        </div>
        <table className="vrw-table">
          <thead><tr><th>Student</th><th>Story in</th><th>In red</th><th>Their choice</th><th>Total</th><th>Listening Data</th><th>Heard in full</th><th>Commented, heard under half</th><th>Standing</th></tr></thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.email} className={r.complete ? "vrw-ok" : r.total ? "vrw-warn" : "vrw-late"}>
                <td><StudentLink config={config} student={r.name} /></td>
                <td>{r.submitted ? "Yes" : "No"}</td>
                <td>{r.requiredNeed ? r.requiredDone + " of " + r.requiredNeed : "not assigned"}</td>
                <td>{r.othersDone}</td>
                <td>{r.total > NEED_TOTAL ? NEED_TOTAL + " + " + (r.total - NEED_TOTAL) : r.total + " of " + NEED_TOTAL}</td>
                <td><Bars bars={barsOfStudent(r)} /></td>
                <td>{r.heardFull}</td>
                <td>{r.unheard || ""}</td>
                <td>{r.complete ? (r.extra ? "Complete, " + r.extra + " extra" : "Complete") : r.total ? "Needs " + r.missing : "No reviews yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="vrw-sec" aria-label="How many times each story was reviewed">
        <h2 className="vrw-h2">How many times each story was reviewed</h2>
        <table className="vrw-table">
          <thead><tr><th>Story</th><th>By</th><th>Reviews</th><th>Listening Data</th><th>Reviewers</th><th>Assigned to</th></tr></thead>
          <tbody>
            {storiesSorted.map(s => (
              <tr key={s.id} className={s.reviews >= NEED_ASSIGNED ? "vrw-ok" : s.reviews ? "vrw-warn" : "vrw-late"}>
                <td><a className="vrw-link" href={"/" + config.id + "/audio-stories?s=" + s.id}>{s.headline}</a></td>
                <td>{s.name}</td>
                <td>{s.reviews}</td>
                <td><Bars bars={barsOfStory(s)} /></td>
                <td className="vrw-small">{s.reviewers.join(", ")}</td>
                <td className="vrw-small">{s.assigned.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="vrw-sec" aria-label="Every comment">
        <div className="vrw-row">
          <h2 className="vrw-h2">Every comment</h2>
          <button type="button" className="vrw-btn" aria-pressed={shown} onClick={() => setShown(s => !s)}>{shown ? "Hide the comments" : "Show the comments"}</button>
          {shown ? (
            <div className="vrw-seg" role="tablist" aria-label="Group">
              {[["story", "By story"], ["author", "By reviewer"]].map(([k, label]) => (
                <button key={k} type="button" role="tab" aria-selected={group === k} className="vrw-segbtn" onClick={() => setGroup(k)}>{label}</button>
              ))}
            </div>
          ) : null}
        </div>
        {shown ? groupsShown.map(g => (
          <div className="vrw-group" key={g.key}>
            <h3 className="vrw-h3">{g.title}{g.sub ? <span className="vrw-muted"> {g.sub}</span> : null}<span className="vrw-muted"> · {g.comments.length}</span></h3>
            {g.comments.map(c => (
              <article className="vrw-c" key={c.story + c.authorEmail}>
                <div className="vrw-c-top">
                  <strong>{group === "story" ? c.author : headlineOf.get(c.story)?.headline}</strong>
                  {group === "author" ? <span className="vrw-muted"> by {c.owner}</span> : null}
                  <span className="vrw-muted">{heardSay(c)}</span>
                  <span className="vrw-muted vrw-c-when">{when(c.updated_at)}</span>
                </div>
                <dl className="vrw-dl">
                  <dt>{ASK.best}</dt><dd>{c.chapterName ? <span className="vrw-pick">{c.chapterName}</span> : null}{c.best}</dd>
                  <dt>{ASK.shone}</dt><dd>{c.shone}</dd>
                  <dt>{ASK.encourage}</dt><dd>{c.encourage}</dd>
                </dl>
              </article>
            ))}
          </div>
        )) : null}
      </section>
    </Shell>
  );
}

function Shell({ children }) {
  return <div className="vrw"><style>{REVIEWS_CSS}</style><div className="vrw-in">{children}</div></div>;
}

const BT = TOKENS.TEXT, BS = TOKENS.SURFACE, BST = TOKENS.STATE;
// One small vertical bar a story or a listener: the percent, the bar, the name.
function Bars({ bars }) {
  if (!bars.length) return null;
  return (
    <div className="alb-bars" role="img" aria-label={bars.map(b => b.full + " " + b.n + " percent").join(", ")}>
      {bars.map(b => (
        <div className="alb-col" key={b.key} title={b.full + ", " + b.n + "%"}>
          <span className="alb-n">{b.n}%</span>
          <span className="alb-track"><span className={"alb-bar " + (b.n >= HEARD_FULL * 100 ? "alb-ok" : b.n >= HEARD_LITTLE * 100 ? "alb-warn" : "alb-late")} style={{ height: Math.max(b.n, 4) + "%" }} /></span>
          <span className="alb-label">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

const BARS_CSS = `
.alb-bars{display:flex;align-items:flex-end;gap:3px}
.alb-col{display:flex;flex-direction:column;align-items:center;gap:1px;width:44px}
.alb-n{font-size:11px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums;color:${BT.primary}}
.alb-track{display:flex;align-items:flex-end;width:16px;height:26px;background:${BS.sunk};border-radius:3px;overflow:hidden}
.alb-bar{display:block;width:100%}
.alb-ok{background:${BST.ok}}
.alb-warn{background:${BST.warn}}
.alb-late{background:${BST.late}}
.alb-label{font-size:10.5px;line-height:1.1;color:${BT.secondary};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:44px}
.vrw-table td:has(.alb-bars){padding-top:6px;padding-bottom:6px}
`;
