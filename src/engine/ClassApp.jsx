// ClassApp — the shared engine. It renders ANY class from a config object.
// Nothing here is COMM-999-specific; all class data comes from `config`.
// This is the card-grid home (summary tiles on the left, full page on the
// right when you open one) plus a Student / Instructor view toggle.
//
// Students pick who they are and see only their own grade, their own work, and
// their own messages. PINs are parked for now — the roster is not real yet, so
// there is nothing worth locking. When the PINs land, the check goes back into
// SignIn and the instructor toggle, and nothing else has to move.
//
// Every card is addressable: /comm999/assignments is a real URL you can send
// someone, and the browser Back button does what it says.

import { useState, useEffect, useCallback } from "react";
import { useClassData } from "./store.js";
import { SHARED_KEY, blockById, registerTypes } from "./blocks.js";
import { readAdded, readLabels } from "./types.js";
import { ENGINE_LIST } from "../config/registry.js";
import { useLive } from "./live.js";
import { usePoll } from "./poll.js";
import { YouSummary, YouDetail } from "./YouCard.jsx";
import { ScheduleSummary, ScheduleDetail } from "./ScheduleCard.jsx";
import { RosterSummary, RosterDetail } from "./RosterCard.jsx";
import { AssignmentsSummary, AssignmentsDetail, dueState, nextDue, ungradedCount } from "./AssignmentsCard.jsx";
import { DayPlanSummary, DayPlanDetail } from "./DayPlanCard.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#646b75"; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = "#eef0f2";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";
const LIVE = "#e11d48";

// ─── small style helpers ───
// Following Apple HIG: body text ~15-17px, labels no smaller than 12px,
// interactive targets at least 44px tall, inputs >=16px (prevents iOS zoom).
const TAP = 44;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const CARD_MAX = 380; // cards never grow wider than this (a phone-width card)
const card = {
  background: "#fff", borderRadius: 16, padding: 20,
  border: "1px solid " + BORDER, fontFamily: F, textAlign: "left",
  width: "100%", cursor: "pointer", display: "block",
};
const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };

// Keyboard users could not see where they were. Everything focusable now says
// so, and the skeleton tiles breathe while the class data is on its way.
const CSS = `
.ca-focus:focus-visible{outline:2px solid var(--ca-accent);outline-offset:2px;border-radius:10px}
@keyframes caShimmer{0%{opacity:.55}50%{opacity:1}100%{opacity:.55}}
.ca-skel{animation:caShimmer 1.4s ease-in-out infinite;background:#eceae7;border-radius:8px}
@media (prefers-reduced-motion:reduce){.ca-skel{animation:none}}
`;

// Nav tabs map to real cards. "More" opens the cards that did not fit.
const NAV = [
  { id: "home", label: "Home", card: null },
  { id: "schedule", label: "Schedule", card: "schedule" },
  { id: "assignments", label: "Assignments", card: "assignments" },
  { id: "community", label: "Community", card: "community" },
  { id: "more", label: "More", card: "more" },
];
const NAV_CARDS = new Set(["schedule", "assignments", "community"]);

// ─────────────────────────────────────────────────────────────
// Card summaries (left grid). Each returns { title, body } given config + role.
// ─────────────────────────────────────────────────────────────
function summary(key, config, role, ctx) {
  switch (key) {
    case "dayplan":
      return { title: "Day Plan", body: <DayPlanSummary config={config} data={ctx.data} blockOf={ctx.blockOf} /> };
    case "you":
      return { title: "You", body: <YouSummary config={config} role={role} data={ctx.data} asStudent={ctx.asStudent} /> };
    case "assignments":
      return { title: "Assignments", body: <AssignmentsSummary config={config} data={ctx.data} role={role} /> };
    case "schedule":
      return { title: "Schedule", body: <ScheduleSummary config={config} data={ctx.data} /> };
    case "community":
      return { title: "Community", body: <CommunitySummary config={config} live={ctx.live} poll={ctx.poll} data={ctx.data} /> };
    case "leaderboard":
      return { title: "Leaderboard", body: <Muted>In-class game standings.</Muted> };
    case "roster":
      return { title: "Roster", body: <RosterSummary config={config} data={ctx.data} /> };
    case "instructor":
      return { title: "Your Instructor", body: <div style={{ fontWeight: 600 }}>{config.instructor?.name}</div> };
    default:
      return { title: key, body: null };
  }
}

// ─────────────────────────────────────────────────────────────
// Card detail (right panel). Full page for the opened card.
// ─────────────────────────────────────────────────────────────
function detail(key, config, role, ctx) {
  if (key === "dayplan") {
    return <DayPlanDetail config={config} data={ctx.data} blockOf={ctx.blockOf}
      date={ctx.day} onDate={ctx.setDay} />;
  }
  if (key === "you") {
    return <YouDetail config={config} role={role} data={ctx.data} update={ctx.update} asStudent={ctx.asStudent} setAsStudent={ctx.setAsStudent} />;
  }
  if (key === "assignments") {
    return <AssignmentsDetail config={config} role={role} data={ctx.data} update={ctx.update} asStudent={ctx.asStudent} />;
  }
  if (key === "schedule") {
    return <ScheduleDetail config={config} role={role} data={ctx.data} update={ctx.update} blockOf={ctx.blockOf} />;
  }
  if (key === "roster") {
    return <RosterDetail config={config} role={role} data={ctx.data} />;
  }
  if (key === "instructor") {
    const ins = config.instructor || {};
    return (
      <Panel title="Your Instructor">
        <div style={{ fontWeight: 700, fontSize: 17 }}>{ins.name}</div>
        <div style={{ marginTop: 6, color: TEXT_SECONDARY }}>{ins.bio}</div>
        {ins.email ? <a className="ca-focus" href={"mailto:" + ins.email} style={{ display: "inline-block", marginTop: 10, fontSize: 15, fontWeight: 600, color: config.accent }}>{ins.email}</a> : null}
      </Panel>
    );
  }
  if (key === "community") return <Panel title="Community"><CommunityDetail config={config} live={ctx.live} poll={ctx.poll} data={ctx.data} /></Panel>;
  if (key === "leaderboard") return <Panel title="Leaderboard"><Muted>In-class game leaderboard.</Muted></Panel>;
  return <Panel title={key}><Muted>Coming soon.</Muted></Panel>;
}

// ─── tiny presentational helpers ───
const Muted = ({ children }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5 }}>{children}</div>;
const Panel = ({ title, children }) => (
  <div>
    <div style={{ ...h2, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Community — what is actually happening right now
// ─────────────────────────────────────────────────────────────
// Whatever is on the projector, with a way in.
//
// A student walking into class opens the class page and sees a grid of cards,
// none of which is the thing the room is looking at this second. So the thing
// on the screen comes to the top and brings its own door: a board prompt asks
// to be answered, a reading asks to be opened, an assignment asks to be read,
// a poll asks for a vote. The prompt itself is the headline, because a box
// saying "a discussion board is running" is a box that makes you go find the
// question.
export function onScreenNow(config, live, poll) {
  const c = live?.cast;
  const ask = config.path + "/ask";
  const room = config.path + "/today";

  if (poll && (poll.phase === "vote1" || poll.phase === "vote2")) {
    return { kind: "Poll", title: poll.question || "A poll is open", cta: "Vote now", href: ask };
  }
  if (!c) return null;

  if (c.type === "board") {
    return { kind: c.boardLabel || "Discussion",
      title: c.idea || c.title || "A discussion is open",
      cta: "Add to the discussion", href: config.path + "/board" };
  }
  if (c.type === "headlines") {
    return { kind: "Headlines", title: "Bring a headline to the room", cta: "Post a headline", href: ask };
  }
  if (c.type === "poll") {
    return { kind: "Poll", title: c.label || "A poll is open", cta: "Vote now", href: ask };
  }
  if (c.type === "question") {
    return { kind: "Question", title: c.title || c.label || "A question is up", cta: "Answer the question", href: ask };
  }
  if (c.type === "reveal") {
    return { kind: "Assignment", title: c.title || "An assignment", sub: c.due || "",
      cta: "Read the assignment", href: config.path };
  }
  if (c.type === "feature") {
    return { kind: c.title || "Activity", title: c.body || c.title || "An activity is running",
      cta: "Join in", href: room };
  }
  const url = c.openUrl || c.url || "";
  if (url) {
    return { kind: c.tag || "Reading", title: c.title || c.label || "A reading", cta: "Open the reading", href: url, external: true };
  }
  if (c.type === "quote" && (c.title || c.label)) {
    return { kind: c.tag || "On the screen", title: c.title || c.label, cta: "Follow along", href: room };
  }
  return null;
}

export function OnScreenNow({ config, live, poll }) {
  const it = onScreenNow(config, live, poll);
  if (!it) return null;
  const accent = config.accent;
  return (
    <section aria-label="On the screen right now"
      style={{ background: "#fff", border: "2px solid " + accent, borderRadius: 16, padding: "18px 20px",
        marginBottom: 16, display: "flex", flexDirection: "column", gap: 12,
        boxShadow: "0 6px 22px -12px rgba(23,19,16,.35)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: LIVE, flexShrink: 0 }} />
        <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, letterSpacing: ".1em",
          textTransform: "uppercase", color: LIVE }}>On the screen now</span>
        <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase",
          color: TEXT_MUTED, marginLeft: "auto" }}>{it.kind}</span>
      </div>
      <h2 style={{ margin: 0, fontSize: "clamp(20px,3.2vw,27px)", fontWeight: 600, letterSpacing: "-.025em",
        lineHeight: 1.2, color: TEXT_PRIMARY, wordBreak: "break-word" }}>{it.title}</h2>
      {it.sub ? <div style={{ fontSize: 14, color: TEXT_MUTED }}>{it.sub}</div> : null}
      <a className="ca-focus" href={it.href}
        {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8,
          minHeight: TAP, padding: "0 20px", borderRadius: 12, background: accent, color: "#fff",
          fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
        {it.cta} <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

// "Nothing live right now" was a lie whenever a poll was open. This reads the
// same cast bus the room screen reads, so the card and the projector agree.
function liveNow(config, live, poll, data) {
  const out = [];
  // A game that is open is the most joinable thing there is, so the game goes
  // at the top rather than under the poll.
  const trivia = Object.values(data?.triviaGames || {}).find(g => g.phase === "live");
  if (trivia) out.push({ id: "trivia", title: "Team Trivia is running",
    what: "Answer with your team.", href: config.path + "/game" });
  const week = Object.values(data?.weeklyGames || {}).find(g => g.phase === "live");
  if (week) out.push({ id: "game", title: "The game is open",
    what: "Answer this week's questions.", href: config.path + "/game" });
  const tot = Object.values(data?.weeklyToT || {}).find(g => g.phase === "live");
  if (tot) out.push({ id: "tot", title: "Ten on Ten is open",
    what: "Answer this week's ten.", href: config.path + "/game" });
  if (poll && (poll.phase === "vote1" || poll.phase === "vote2")) {
    out.push({ id: "poll", title: "A poll is open", what: poll.question || "Vote on the question that is up.", href: config.path + "/ask" });
  }
  const c = live?.cast;
  if (c?.type === "headlines") out.push({ id: "hl", title: "Headlines is running", what: "Post a headline and vote on the ones already up.", href: config.path + "/ask" });
  if (c?.type === "feature") out.push({ id: "ft", title: c.title + " is running", what: c.body || "", href: config.path + "/today" });
  return out;
}

function CommunitySummary({ config, live, poll, data }) {
  const items = liveNow(config, live, poll, data);
  if (!items.length) return <Muted>Nothing live right now.</Muted>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: LIVE, flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>{items[0].title}</span>
      </div>
      {items.length > 1 ? <Muted>and {items.length - 1} more</Muted> : null}
    </div>
  );
}

function CommunityDetail({ config, live, poll, data }) {
  const items = liveNow(config, live, poll, data);
  if (!items.length) return <Muted>Games, boards and live activities appear here while they run.</Muted>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map(it => (
        <div key={it.id} style={{ border: "1px solid " + BORDER, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: LIVE, flexShrink: 0 }} />
            <span style={{ fontWeight: 600, fontSize: 17 }}>{it.title}</span>
          </div>
          {it.what ? <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5, marginTop: 6 }}>{it.what}</div> : null}
          <a className="ca-focus" href={it.href} style={{ display: "inline-flex", alignItems: "center", minHeight: TAP, fontSize: 15, fontWeight: 600, color: config.accent, textDecoration: "none" }}>Join in →</a>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Needs you — the answer to "what do I do now?"
// ─────────────────────────────────────────────────────────────
// The grid is a list of places. This is a list of actions, and it sits above
// the grid because it is the only thing on the home page with a deadline.
function needsYou(config, data, role, asStudent) {
  const out = [];
  if (role === "instructor") {
    const n = ungradedCount(config, data);
    if (n) out.push({ id: "grade", card: "assignments", text: n + " submission" + (n === 1 ? "" : "s") + " waiting to be graded" });
    const waiting = (config.students || []).filter(s => {
      const t = data?.threads?.[s.name] || [];
      const last = t[t.length - 1];
      return last && last.from === "student";
    }).length;
    if (waiting) out.push({ id: "inbox", card: "you", text: waiting + " student" + (waiting === 1 ? "" : "s") + " waiting on a reply" });
    return out;
  }
  const thread = data?.threads?.[asStudent] || [];
  const last = thread[thread.length - 1];
  if (last && last.from === "instructor") out.push({ id: "note", card: "you", text: "A new note from " + (config.instructor?.name || "your instructor") });
  const next = nextDue(config, data);
  if (next) {
    const d = dueState(next.due);
    const submitted = ((data?.assignmentLog?.[next.id] || {})[asStudent] || []).some(e => e.type === "submission");
    if (d && d.tone !== "calm" && !submitted) out.push({ id: "due", card: "assignments", text: next.title + " is " + d.text.toLowerCase(), tone: d.tone });
  }
  return out;
}

function NeedsYou({ items, accent, onOpen }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
      {items.map(it => (
        <button key={it.id} className="ca-focus" onClick={() => onOpen(it.card)}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
            background: it.tone === "late" ? "#fef2f2" : "#fff", border: "1px solid " + (it.tone === "late" ? "#fecaca" : accent + "55"),
            borderLeft: "4px solid " + (it.tone === "late" ? LIVE : accent),
            borderRadius: 12, padding: "12px 16px", minHeight: TAP, fontFamily: F }}>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: TEXT_PRIMARY }}>{it.text}</span>
          <span style={{ flex: "none", fontSize: 15, fontWeight: 600, color: accent }}>open →</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sign in
// ─────────────────────────────────────────────────────────────
// Same shape as the Ask page, same remembered key, so signing in on one gets
// you into the other. Before this, a dropdown let anyone read any classmate's
// grade and every message they had sent me.
function SignIn({ config, data, onSignedIn }) {
  const roster = (data?.students || config.students || []).map(s => s.name).filter(n => n !== config.testStudent);
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", justifyContent: "center", padding: "48px 20px" }}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600 }}>{config.code} · {config.name}</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>Who are you?</h1>
        <Muted>Pick your name to get to your grade, your assignments, and your messages.</Muted>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {roster.map(n => (
            <button key={n} className="ca-focus" onClick={() => onSignedIn(n)}
              style={{ ...card, minHeight: TAP, padding: "12px 16px", fontSize: 16, fontWeight: 500, border: "1px solid " + BORDER_STRONG }}>{n}</button>
          ))}
          {!roster.length ? <Muted>No roster yet.</Muted> : null}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
// Match the rest of the app: mobile-first, desktop layout kicks in >= 760px.
function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 760 : true);
  useEffect(() => {
    const onResize = () => setDesktop(window.innerWidth >= 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return desktop;
}

const Skeleton = ({ w, h }) => <div className="ca-skel" style={{ width: w, height: h }} />;

function SkeletonTile() {
  return (
    <div style={{ ...card, cursor: "default", display: "flex", flexDirection: "column", gap: 10 }}>
      <Skeleton w="38%" h={10} />
      <Skeleton w="72%" h={18} />
      <Skeleton w="52%" h={14} />
    </div>
  );
}

export default function ClassApp({ config, initialCard }) {
  const REMEMBER = config.storageKey + "-user";
  const ADMIN = config.storageKey + "-admin";

  const [data, update] = useClassData(config.storageKey);
  // The shared shelf as well, because a reading on the schedule can be a block
  // that belongs to me rather than to this class, and the pick that says read
  // this one first lives on the block.
  const [shared] = useClassData(SHARED_KEY);
  // The types Andrew has added or renamed, so a block on this site says what
  // he calls it rather than the id underneath. The repository and the
  // dashboard do the same; every reader goes through typeOf.
  registerTypes({ added: readAdded(shared), labels: readLabels(shared) });
  const [live] = useLive(config.storageKey);
  const { poll } = usePoll(config.storageKey);
  const isDesktop = useIsDesktop();
  const a = config.accent;

  // Remembered sign-ins, read on the first render so the sign-in screen never
  // flashes at somebody who is already signed in. The student key is the one
  // the Ask page writes, so a student who signed in to ask a question is in.
  const remembered = () => { try { return localStorage.getItem(REMEMBER); } catch { return null; } };
  const [role, setRole] = useState(() => { try { return localStorage.getItem(ADMIN) === "1" ? "instructor" : "student"; } catch { return "student"; } });
  const [open, setOpen] = useState(initialCard || null);
  // Which day the Day Plan card is showing, held here so the card itself can
  // stay a mirror with no state of its own.
  const [day, setDay] = useState("");
  const [signedIn, setSignedIn] = useState(remembered);
  const [asStudent, setAsStudent] = useState(() => remembered() || config.testStudent || config.students?.[0]?.name || "");
  // An instructor looking at the class the way one student gets the class.
  //
  // Most of the parts were already here and none of them were reachable.
  // `asStudent` already decided which student the You and Assignments cards
  // were about, and the select that changed the choice sat inside the You card,
  // where nothing could ever draw it: that card only renders for a student, and
  // the setter only arrived for an instructor, so the two conditions could not
  // both hold. Pressing Student on the role toggle was the only way through,
  // and pressing Student cleared the instructor flag, so coming back meant
  // signing in again.
  //
  // Empty string means not previewing. The instructor flag is untouched, so
  // leaving the preview is one press.
  const [preview, setPreview] = useState("");
  // What the page draws as. The person is still the instructor; the page is
  // drawn the way the chosen student would get the page drawn.
  const view = preview ? "student" : role;

  // ─── the URL is the state ───
  // /comm999/assignments is a link you can send someone, and Back goes back to
  // the grid instead of leaving the site.
  const go = useCallback((key) => {
    setOpen(key);
    const path = config.path + (key ? "/" + key : "");
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
  }, [config.path]);

  useEffect(() => {
    const onPop = () => {
      const rest = window.location.pathname.replace(config.path, "").replace(/^\/|\/$/g, "");
      setOpen(rest || null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [config.path]);

  // A preview is a look, not a login. The class store is shared and real, so a
  // press on the student side would post a message from that student or rewrite
  // that student's profile. While the lens is on, writes go nowhere.
  const write = preview ? () => {} : update;
  const ctx = { data: data || {}, update: write, asStudent: preview || asStudent,
    setAsStudent: preview ? setPreview : null, live, poll,
    blockOf: (id) => (id ? blockById(data, shared, id) : null), day, setDay };

  // Push updated seed content (schedule + library) to the store when the seed
  // version changes, without touching threads/profiles or other live data.
  useEffect(() => {
    if (!data || !config.seedVersion) return;
    if (data.seedVersion !== config.seedVersion) {
      // Seed from config, but NEVER overwrite real content with an empty one.
      // A class whose term lives in its store carries an empty scheduleWeeks on
      // purpose, and this effect wiped eleven weeks of COMM 2 by pushing that
      // empty array over the top of them.
      const patch = { seedVersion: config.seedVersion };
      if ((config.scheduleWeeks || []).length) patch.schedule = config.scheduleWeeks;
      if ((config.library || []).length) patch.library = config.library;
      update(prev => ({ ...prev, ...patch }));
    }
  }, [data, config]);

  useEffect(() => { document.title = config.code + " · " + config.name; }, [config.code, config.name]);

  // Some cards are instructor-only (e.g. the day-planning surface) and never
  // appear on the student home, regardless of the config toggle.
  const INSTRUCTOR_ONLY = new Set(["dayplan"]);
  const enabledCards = Object.entries(config.cards || {})
    .filter(([, on]) => on)
    .map(([k]) => k)
    .filter(k => view === "instructor" || !INSTRUCTOR_ONLY.has(k));
  const moreCards = enabledCards.filter(k => !NAV_CARDS.has(k));

  const signIn = (name) => {
    try { localStorage.setItem(REMEMBER, name); } catch { /* private mode */ }
    setSignedIn(name); setAsStudent(name);
  };
  const signOut = () => {
    try { localStorage.removeItem(REMEMBER); localStorage.removeItem(ADMIN); } catch { /* private mode */ }
    setSignedIn(null); setRole("student"); go(null);
  };
  const pickRole = (r) => {
    try { if (r === "instructor") localStorage.setItem(ADMIN, "1"); else localStorage.removeItem(ADMIN); } catch { /* private mode */ }
    setRole(r); go(null);
  };

  if (data !== null && role === "student" && !signedIn && !config.openAccess) {
    return <SignIn config={config} data={data} onSignedIn={signIn} />;
  }

  const RoleToggle = preview ? null : (
    <div style={{ display: "flex", gap: 4, background: BG, padding: 3, borderRadius: 999, border: "1px solid " + BORDER }}>
      {["student", "instructor"].map(r => (
        <button key={r} className="ca-focus" onClick={() => pickRole(r)} aria-pressed={role === r}
          style={{ fontSize: 15, fontWeight: 600, padding: "0 16px", minHeight: TAP, display: "inline-flex", alignItems: "center", borderRadius: 999, cursor: "pointer",
            border: "none", fontFamily: F, background: role === r ? a : "transparent", color: role === r ? "#fff" : TEXT_SECONDARY, textTransform: "capitalize" }}>{r}</button>
      ))}
    </div>
  );

  // In instructor view, the class page is where I already am when I realise I
  // want to teach from it. These are the three teaching surfaces.
  const TeachLinks = view === "instructor" ? (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <select className="ca-focus" value={config.id} aria-label="Class"
        onChange={e => {
          const next = ENGINE_LIST.find(c => c.id === e.target.value);
          if (!next) return;
          window.history.pushState({}, "", next.path);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
        style={{ fontFamily: F, fontSize: 15, fontWeight: 600, minHeight: TAP, padding: "0 10px",
          borderRadius: 999, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY, cursor: "pointer" }}>
        {ENGINE_LIST.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
      </select>
      {[["/dashboard", "Dashboard"], ["/today", "Room screen"], ["/ask", "Ask"], ["/rungame", "Game"]].map(([suffix, name]) => (
        <a key={suffix} className="ca-focus" href={config.path + suffix}
          style={{ display: "inline-flex", alignItems: "center", minHeight: TAP, padding: "0 14px", borderRadius: 999,
            border: "1px solid " + (suffix === "/dashboard" ? a : BORDER_STRONG),
            background: suffix === "/dashboard" ? a : "#fff",
            color: suffix === "/dashboard" ? "#fff" : TEXT_SECONDARY,
            fontSize: 15, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>{name}</a>
      ))}
    </div>
  ) : null;

  // The roster, alphabetical, because a picker over thirty names wants an order
  // I can aim at.
  const roster = (data?.students || config.students || []).slice()
    .sort((x, y) => (x.name || "").localeCompare(y.name || ""));

  const StudentPicker = (
    <select className="ca-focus" value={preview} aria-label="Which student"
      onChange={e => { setPreview(e.target.value); go(null); }}
      style={{ fontFamily: F, fontSize: 15, fontWeight: 600, minHeight: TAP, padding: "0 10px", maxWidth: 230,
        borderRadius: 999, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY, cursor: "pointer" }}>
      <option value="">View as a student</option>
      {roster.map(st => <option key={st.name} value={st.name}>{st.name}</option>)}
    </select>
  );

  // The way in, beside the teaching links, and only for an instructor with a
  // roster to look through.
  const ViewAs = role === "instructor" && !preview && roster.length ? StudentPicker : null;

  // The way out, across the top of every page, in the class colour, so no
  // amount of scrolling loses the way back.
  const PreviewBar = preview ? (
    <div style={{ background: a, color: "#fff" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "10px 16px", display: "flex",
        alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Seeing the class as {preview}</span>
        <span style={{ fontSize: 15, opacity: .85 }}>This is a look, not a login. Nothing you press is saved.</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {StudentPicker}
          <button className="ca-focus" onClick={() => { setPreview(""); go(null); }}
            style={{ minHeight: TAP, padding: "0 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,.55)",
              background: "transparent", color: "#fff", fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Go back to instructor view
          </button>
        </span>
      </div>
    </div>
  ) : null;

  const Logo = (
    <button className="ca-focus" onClick={() => go(null)}
      style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F, textAlign: "left" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: a, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {config.code.split(" ")[1]}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: a, textTransform: "uppercase", letterSpacing: "0.08em" }}>{config.code}</div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.1 }}>{config.name}</div>
      </div>
    </button>
  );

  // A card key can arrive from the address bar, so it gets the same check the
  // grid does: unknown or not-yours falls back to the home grid.
  const openKey = open && (open === "more" || enabledCards.includes(open)) ? open : null;

  // Which nav tab is lit: the open card, or "More" when the open card is one
  // that lives under it.
  const activeNav = !openKey ? "home" : (NAV_CARDS.has(openKey) ? openKey : "more");

  const CardTile = (key) => {
    const s = summary(key, config, view, ctx);
    return (
      <button key={key} className="ca-focus" onClick={() => go(key)}
        style={{ ...card, outline: openKey === key ? "2px solid " + a : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ ...label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{s.title}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: a, whiteSpace: "nowrap", flexShrink: 0 }}>open →</span>
        </div>
        {s.body}
      </button>
    );
  };

  const MorePage = (
    <Panel title="More">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {moreCards.map(CardTile)}
      </div>
    </Panel>
  );

  const detailFor = (key) => key === "more" ? MorePage : detail(key, config, view, ctx);

  // Class is on the projector right now. Students following remotely get the
  // same screen the room is looking at.
  const roomLive = live?.cast && live.at && (Date.now() - live.at) < 3 * 60 * 60 * 1000;
  // The thing on the projector, with its own door, above everything else. The
  // old banner said class was on and made you go looking; this says what is on.
  const onNow = roomLive ? onScreenNow(config, live, poll) : null;
  const LiveBanner = onNow ? <OnScreenNow config={config} live={live} poll={poll} /> : roomLive ? (
    <a className="ca-focus" href={config.path + "/today"}
      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
        background: "#fff", border: "1px solid " + LIVE, borderRadius: 12, padding: "12px 16px", minHeight: TAP, marginBottom: 14 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: LIVE, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>Class is on the screen right now</span>
      <span style={{ flex: "none", fontSize: 15, fontWeight: 600, color: LIVE }}>follow along →</span>
    </a>
  ) : null;

  const actions = data === null ? [] : needsYou(config, data, view, preview || asStudent);

  const Nav = (
    <nav style={{ display: "flex", gap: 2, marginLeft: 8 }}>
      {NAV.map(n => {
        const on = activeNav === n.id;
        return (
          <button key={n.id} className="ca-focus" onClick={() => go(n.card)} aria-current={on ? "page" : undefined}
            style={{ fontSize: 15, fontWeight: on ? 600 : 500, color: on ? a : TEXT_SECONDARY, padding: "0 12px", minHeight: TAP,
              display: "inline-flex", alignItems: "center", borderRadius: 8, cursor: "pointer", border: "none",
              background: on ? a + "12" : "transparent", fontFamily: F }}>{n.label}</button>
        );
      })}
    </nav>
  );

  const Grid = data === null
    ? <>{[0, 1, 2, 3].map(i => <SkeletonTile key={i} />)}</>
    : <>{enabledCards.map(CardTile)}</>;

  // ─── DESKTOP: top nav + side-by-side master/detail ───
  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, "--ca-accent": a }}>
        <style>{CSS}</style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />
        <div style={{ position: "sticky", top: 0, zIndex: 10 }}>
        {PreviewBar}
        <div style={{ background: "#fff", borderBottom: "1px solid " + BORDER }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 20 }}>
            {Logo}
            {Nav}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
              {ViewAs}
              {TeachLinks}
              {signedIn && !preview ? (
                <button className="ca-focus" onClick={signOut}
                  style={{ background: "none", border: "none", fontFamily: F, fontSize: 15, color: TEXT_SECONDARY, cursor: "pointer", minHeight: TAP }}>
                  {signedIn.split(" ")[0]} · sign out
                </button>
              ) : null}
              {RoleToggle}
            </div>
          </div>
        </div>
        </div>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: 20, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
          <div style={{ maxWidth: CARD_MAX * 2 + 12 }}>
            {LiveBanner}
            <NeedsYou items={actions} accent={a} onOpen={go} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {Grid}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + BORDER, padding: 24, minHeight: 400, position: "sticky", top: 80 }}>
            {openKey
              ? detailFor(openKey)
              : <div style={{ color: TEXT_MUTED, fontSize: 16, paddingTop: 40, textAlign: "center" }}>Open a card to see its full page here.</div>}
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE: single column, full-screen takeover, bottom tab bar ───
  const BAR_H = 72;
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, paddingBottom: BAR_H + 12, "--ca-accent": a }}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />

      {/* compact top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10 }}>
      {PreviewBar}
      <div style={{ background: "#fff", borderBottom: "1px solid " + BORDER }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          {openKey ? (
            <button className="ca-focus" onClick={() => go(null)} style={{ background: "none", border: "none", fontFamily: F, fontSize: 17, fontWeight: 600, color: a, cursor: "pointer", minHeight: TAP, display: "inline-flex", alignItems: "center", padding: "0 4px 0 0" }}>← Back</button>
          ) : Logo}
          {RoleToggle}
        </div>
      </div>
      </div>

      {TeachLinks || ViewAs ? (
        <div style={{ background: "#fff", borderBottom: "1px solid " + BORDER, padding: "8px 16px",
          display: "flex", gap: 6, alignItems: "center", overflowX: "auto" }}>{ViewAs}{TeachLinks}</div>
      ) : null}

      {/* content: grid OR full-screen takeover */}
      <div style={{ padding: 16 }}>
        {openKey ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + BORDER, padding: 20 }}>
            {detailFor(openKey)}
          </div>
        ) : (
          <>
            {LiveBanner}
            <NeedsYou items={actions} accent={a} onOpen={go} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Grid}
            </div>
            {signedIn && !preview ? (
              <button className="ca-focus" onClick={signOut}
                style={{ background: "none", border: "none", fontFamily: F, fontSize: 15, color: TEXT_MUTED, cursor: "pointer", minHeight: TAP, marginTop: 8 }}>
                Signed in as {signedIn} · sign out
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* bottom tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: BAR_H, background: "#fff", borderTop: "1px solid " + BORDER, display: "flex", zIndex: 20 }}>
        {NAV.map(n => {
          const on = activeNav === n.id;
          return (
            <button key={n.id} className="ca-focus" onClick={() => go(n.card)} aria-current={on ? "page" : undefined}
              style={{ flex: 1, minHeight: TAP, background: "none", border: "none", fontFamily: F, fontSize: 12, fontWeight: 600, color: on ? a : TEXT_SECONDARY, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: on ? a : "transparent" }} />
              {n.label}
            </button>
          );
        })}
      </div>

    </div>
  );
}
