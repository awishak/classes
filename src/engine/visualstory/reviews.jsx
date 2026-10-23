// Who reviewed what, for the instructor: /comm3/reviews.
//
// Andrew, 2026-10-23: "make me a separate instructor page for this, where I
// can see the stats on how many times each story was reviewed, who completed
// all the reviews, who did not complete reviews ... And then, of course, all
// the data, and then we'll run that data for something."
//
// Everything comes from the story route's admin feed, which already carries
// every story, every comment with its author, and the pods. Complete means
// the four pod stories (the ones outlined in red on the student's page) and
// eight in all, the same numbers the students' counter uses. The page asks
// again every minute while open, and the data goes out as a JSON file or a
// CSV of the comments.

import { useEffect, useState } from "react";
import { authHeaders } from "../session.js";
import { savedPin } from "../../InstructorGate.jsx";
import { sectionsOf } from "../sections.js";
import * as TOKENS from "../tokens.js";

const NEED_TOTAL = 8;
const lower = (s) => String(s || "").trim().toLowerCase();
const when = (t) => (t ? new Date(t).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

const api = async (config, body) => {
  const r = await fetch("/api/visual-story", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), groupKey: config.id, ...body }),
  });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "The server did not answer.");
  return out;
};

// The numbers, from the admin feed: one row per student, one per story.
export function tally(feed, section) {
  const people = (feed.people || []).filter(p => !section || p.section === section);
  const stories = (feed.stories || []).filter(s => !section || s.section === section);
  const storyOwner = new Map(stories.map(s => [s.id, lower(s.email)]));
  const submitted = new Set(stories.map(s => lower(s.email)));
  const podOf = new Map((feed.pods || []).filter(p => !section || p.section === section).map(p => [lower(p.email), p.pod]));
  const mates = (email) => {
    const pod = podOf.get(email);
    if (!pod) return [];
    return [...podOf.entries()].filter(([e, p]) => p === pod && e !== email && submitted.has(e)).map(([e]) => e);
  };
  // Comments by others only; a student's comment on their own story is kept apart.
  const comments = (feed.comments || []).filter(c => storyOwner.has(c.story));
  const byAuthor = new Map();
  const onStory = new Map();
  const ownComment = new Set();
  let byOthers = 0;
  comments.forEach(c => {
    const author = lower(c.authorEmail || c.author), owner = storyOwner.get(c.story);
    if (author === owner) { ownComment.add(author); return; }
    byOthers++;
    if (!byAuthor.has(author)) byAuthor.set(author, new Set());
    byAuthor.get(author).add(owner);
    if (!onStory.has(c.story)) onStory.set(c.story, []);
    onStory.get(c.story).push(c);
  });
  const rows = people.map(p => {
    const email = lower(p.email);
    const need = mates(email);
    const did = byAuthor.get(email) || new Set();
    const requiredDone = need.filter(e => did.has(e)).length;
    const othersDone = [...did].filter(e => !need.includes(e)).length;
    const total = requiredDone + othersDone;
    const needOthers = Math.max(0, NEED_TOTAL - need.length);
    const complete = requiredDone >= need.length && total >= NEED_TOTAL;
    return { name: p.name, email, section: p.section, submitted: submitted.has(email), requiredDone, requiredNeed: need.length, othersDone, needOthers, total, complete, own: ownComment.has(email),
      missing: complete ? "" : [need.length - requiredDone > 0 ? (need.length - requiredDone) + " in red" : "", total < NEED_TOTAL ? (NEED_TOTAL - total) + " more in all" : ""].filter(Boolean).join(", ") };
  });
  const perStory = stories.map(s => ({ id: s.id, headline: s.headline || "Untitled story", name: s.name, email: lower(s.email), section: s.section, submitted_at: s.submitted_at,
    reviews: (onStory.get(s.id) || []).length, reviewers: (onStory.get(s.id) || []).map(c => c.author).sort() }));
  return { rows, perStory, commentCount: byOthers };
}

const csvCell = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
const toCsv = (comments) => ["story_id,owner,owner_email,author,author_email,best_picture,best_where,best,shone,encourage,updated_at",
  ...comments.map(c => [c.story, c.owner, c.ownerEmail, c.author, c.authorEmail, c.bestPicture ?? "", c.bestWhere, c.best, c.shone, c.encourage, c.updated_at].map(csvCell).join(","))].join("\n");
const download = (name, text, type) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

export default function StoryReviews({ config }) {
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState("");
  const [at, setAt] = useState(null);
  const sections = sectionsOf(config);
  const [section, setSection] = useState(sections[0] || "");
  const [sort, setSort] = useState("name");

  useEffect(() => {
    let alive = true;
    const ask = () => api(config, { action: "admin" }).then(out => { if (alive) { setFeed(out); setAt(Date.now()); setError(""); } }).catch(e => { if (alive) setError(e.message); });
    ask();
    const t = setInterval(ask, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [config]);
  useEffect(() => { document.title = config.code + " · Story reviews"; }, [config]);

  if (error && !feed) return <Shell><p className="vrw-p">Could not read the reviews: {error}</p></Shell>;
  if (!feed) return <Shell><p className="vrw-p">Loading the reviews.</p></Shell>;

  const { rows, perStory, commentCount } = tally(feed, section);
  const sorted = [...rows].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "total" ? b.total - a.total || a.name.localeCompare(b.name) : (a.complete === b.complete ? a.name.localeCompare(b.name) : a.complete ? 1 : -1));
  const complete = rows.filter(r => r.complete);
  const notComplete = rows.filter(r => !r.complete && r.total > 0);
  const notStarted = rows.filter(r => r.total === 0);
  const storiesSorted = [...perStory].sort((a, b) => a.reviews - b.reviews || a.name.localeCompare(b.name));
  const stage = feed.stages?.[section] || feed.stages?.[""] || "";

  return (
    <Shell>
      <div className="vrw-head">
        <h1 className="vrw-title">Story reviews</h1>
        <span className="vrw-muted">{config.code} · {stage ? "Stage: " + stage + " · " : ""}read {when(at)}{feed.releasesAt ? " · comments come out " + when(feed.releasesAt) : ""}</span>
      </div>
      {sections.length > 1 ? (
        <div className="vrw-tabs" role="tablist" aria-label="Section">
          {sections.map(s => <button key={s} type="button" role="tab" aria-selected={s === section} className={"vrw-tab" + (s === section ? " vrw-on" : "")} onClick={() => setSection(s)}>{s}</button>)}
        </div>
      ) : null}

      <div className="vrw-stats" aria-label="The numbers">
        <Stat n={rows.length} what="students" />
        <Stat n={perStory.length} what="stories in" />
        <Stat n={commentCount} what="comments by others" />
        <Stat n={complete.length} what="complete" tone="ok" />
        <Stat n={notComplete.length} what="started, not complete" tone="warn" />
        <Stat n={notStarted.length} what="no reviews yet" tone="late" />
      </div>

      <div className="vrw-row">
        <button type="button" className="vrw-btn" onClick={() => download(config.id + "-story-reviews.json", JSON.stringify({ readAt: new Date(at).toISOString(), section, rows, stories: perStory, feed }, null, 2), "application/json")}>Download everything (JSON)</button>
        <button type="button" className="vrw-btn" onClick={() => download(config.id + "-story-comments.csv", toCsv((feed.comments || []).filter(c => !section || perStory.some(s => s.id === c.story))), "text/csv")}>Download the comments (CSV)</button>
        <a className="vrw-link" href={"/" + config.id + "/worksheets/visual-story?review"}>Every story, stages and pods</a>
      </div>

      <section className="vrw-sec" aria-label="Who completed the reviews">
        <div className="vrw-row">
          <h2 className="vrw-h2">Who completed the reviews</h2>
          <div className="vrw-seg" role="tablist" aria-label="Sort">
            {[["name", "By name"], ["done", "Not complete first"], ["total", "Most reviews first"]].map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={sort === k} className="vrw-segbtn" onClick={() => setSort(k)}>{label}</button>
            ))}
          </div>
        </div>
        <p className="vrw-muted">Complete means the stories in their pod (outlined in red on their page) and {NEED_TOTAL} in all. A student's comment on their own story counts separately.</p>
        <table className="vrw-table">
          <thead><tr><th>Student</th><th>Story in</th><th>In red</th><th>Their choice</th><th>Total</th><th>Own story</th><th>Standing</th></tr></thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.email} className={r.complete ? "vrw-ok" : r.total ? "vrw-warn" : "vrw-late"}>
                <td>{r.name}</td>
                <td>{r.submitted ? "Yes" : "No"}</td>
                <td>{r.requiredNeed ? r.requiredDone + " of " + r.requiredNeed : "no pod"}</td>
                <td>{r.othersDone}{r.needOthers ? " of " + r.needOthers : ""}</td>
                <td>{r.total > NEED_TOTAL ? NEED_TOTAL + " + " + (r.total - NEED_TOTAL) : r.total + " of " + NEED_TOTAL}</td>
                <td>{r.own ? "Yes" : ""}</td>
                <td>{r.complete ? "Complete" : r.total ? "Needs " + r.missing : "No reviews yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="vrw-sec" aria-label="How many times each story was reviewed">
        <h2 className="vrw-h2">How many times each story was reviewed</h2>
        <p className="vrw-muted">Fewest first, so a story nobody has read is at the top.</p>
        <table className="vrw-table">
          <thead><tr><th>Story</th><th>By</th><th>Reviews</th><th>Reviewers</th></tr></thead>
          <tbody>
            {storiesSorted.map(s => (
              <tr key={s.id} className={s.reviews >= 4 ? "vrw-ok" : s.reviews ? "vrw-warn" : "vrw-late"}>
                <td>{s.headline}</td>
                <td>{s.name}</td>
                <td>{s.reviews}</td>
                <td className="vrw-small">{s.reviewers.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}

function Stat({ n, what, tone = "" }) {
  return <div className={"vrw-stat " + tone}><span className="vrw-stat-n">{n}</span><span className="vrw-stat-w">{what}</span></div>;
}
function Shell({ children }) {
  return <div className="vrw"><style>{CSS}</style><div className="vrw-in">{children}</div></div>;
}

const T = TOKENS.TEXT, S = TOKENS.SURFACE, L = TOKENS.LINE, ST = TOKENS.STATE;
const CSS = `
.vrw{min-height:100vh;background:${S.page};color:${T.primary};font-family:${TOKENS.FONT.body};padding:24px 16px 90px}
.vrw-in{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.vrw-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
.vrw-title{margin:0;font-size:30px;font-weight:700;letter-spacing:-.02em}
.vrw-p{margin:0;font-size:16px;color:${T.secondary}}
.vrw-muted{margin:0;font-size:14.5px;color:${T.muted}}
.vrw-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.vrw-link{font-size:15px;font-weight:600;color:${T.primary}}
.vrw-tabs{display:flex;gap:8px;flex-wrap:wrap}
.vrw-tab{font:inherit;font-size:15px;padding:6px 16px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.secondary};cursor:pointer;min-height:36px}
.vrw-on{background:${T.primary};border-color:${T.primary};color:${S.page}}
.vrw-btn{font:inherit;font-size:14.5px;font-weight:600;padding:8px 14px;border-radius:999px;border:1px solid ${L.strong};background:${S.card};color:${T.primary};cursor:pointer;min-height:40px}
.vrw-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.vrw-stat{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:14px;background:${S.card};box-shadow:0 0 0 1px ${L.soft}}
.vrw-stat-n{font-size:26px;font-weight:700;line-height:1.1}
.vrw-stat-w{font-size:13.5px;color:${T.muted}}
.vrw-stat.ok .vrw-stat-n{color:${ST.ok}}
.vrw-stat.warn .vrw-stat-n{color:${ST.warn}}
.vrw-stat.late .vrw-stat-n{color:${ST.late}}
.vrw-sec{display:flex;flex-direction:column;gap:10px;border-top:1px solid ${L.soft};padding-top:16px}
.vrw-h2{margin:0;font-size:21px;font-weight:700}
.vrw-seg{display:inline-flex;gap:2px;background:${S.sunk};border-radius:12px;padding:3px;margin-left:auto}
.vrw-segbtn{font:inherit;font-size:14px;font-weight:600;border:0;background:transparent;color:${T.secondary};border-radius:10px;min-height:36px;padding:0 12px;cursor:pointer}
.vrw-segbtn[aria-selected="true"]{background:${S.card};color:${T.primary};box-shadow:0 1px 2px rgba(28,25,23,.12)}
.vrw-table{width:100%;border-collapse:collapse;font-size:15px;background:${S.card};border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px ${L.soft}}
.vrw-table th{text-align:left;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${T.muted};padding:10px 12px;border-bottom:1px solid ${L.soft}}
.vrw-table td{padding:10px 12px;border-bottom:1px solid ${L.soft};vertical-align:top}
.vrw-table tr:last-child td{border-bottom:0}
.vrw-ok td:last-child{color:${ST.ok};font-weight:600}
.vrw-warn td:last-child{color:${ST.warn};font-weight:600}
.vrw-late td:last-child{color:${ST.late};font-weight:600}
.vrw-small{font-size:13.5px;color:${T.secondary}}
.vrw button:focus-visible,.vrw a:focus-visible{outline:2.5px solid ${T.primary};outline-offset:2px}
@media (max-width:760px){ .vrw-table{display:block;overflow-x:auto} .vrw-seg{margin-left:0} }
`;
