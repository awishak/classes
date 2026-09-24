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

import { useState, useEffect, useCallback, useRef } from "react";
import { useClassData, saveMerged } from "./store.js";
import { usePhotos, useWithPhotos, saveProfile } from "./photos.js";
import { SHARED_KEY, blockById, registerTypes } from "./blocks.js";
import { readAdded, readLabels } from "./types.js";
import { ENGINE_LIST } from "../config/registry.js";
import { useLive } from "./live.js";
import { YouDetail, MessagesDetail, MessagesSummary, unreadNotes } from "./YouCard.jsx";
import { ScheduleSummary, ScheduleDetail } from "./ScheduleCard.jsx";
import { RosterSummary, RosterDetail } from "./RosterCard.jsx";
import { QuestionsSummary, QuestionsDetail } from "./QuestionsCard.jsx";
import { AssignmentsSummary, AssignmentsDetail, ungradedCount, waitingCount } from "./AssignmentsCard.jsx";
import { DayPlanSummary, DayPlanDetail } from "./DayPlanCard.jsx";
import * as TOKENS from "./tokens.js";
import { setClassFavicon } from "./favicon.js";
import { withIds, idOf, rosterOf, pointsOf as studentPoints } from "./roster.js";
import { setAway, mergeAway } from "./attendance.js";
import { useStudentTheme, useDayNight, ThemeStyle, ThemePicker, DayNightPicker } from "./ThemeShell.jsx";
import { useSession, studentFor, myCode } from "./session.js";
import { instructorOf, schedulingLinkOf } from "../instructors.js";
import { assignmentsOf, profileTaskOf, profileComplete } from "./profileTask.js";
import { useOpenGames, GameStart, GamePlay, GamesNow, GameReviewLive } from "@ishak/decks";
import { gameClient } from "./gameClient.js";
import GradeDeck from "./GradeDeck.jsx";
import { unseenGrades, markSeen } from "./grades.js";
import DueDeck, { dueSoon, dismissDue } from "./DueCard.jsx";
import { NextClassHero, PinnedLinks, ClassSummary, YourCardSummary, GamesSummary, RequestForm, RequestInbox, InstructorProfile,
  openRequests, tileTitle, owedStyle } from "./HomeCards.jsx";
import { nextOwed } from "./AssignmentsCard.jsx";
import { AssignmentCards, AssignmentPage } from "./AssignmentCards.jsx";

import TopNav, { NAV_CLASS } from "./TopNav.jsx";
import { ClassMenu } from "./ClassMenu.jsx";
import { daySlug } from "./days.js";
import WelcomeDeck, { needsWelcome } from "./WelcomeDeck.jsx";
import NoticeCard, { NoticeWriter } from "./NoticeCard.jsx";
import { SaveWord, useOnline } from "./SaveWord.jsx";
import { noticeFor, markNoticeRead } from "./notice.js";
import { isTestStudent, realStudents, sectionFor, hasSections } from "./sections.js";
import { ThemeChrome, ThemeTopper, ThemeSponsor, ThemeLegal, ThemeBadge, TubeySays, TubeyPeek,
  ThemeStickers, StoryBar, ThemeIdentity, ThemeCamera, ClassLeader, Avatar, cardStyle,
} from "./ThemeChrome.jsx";

// The theme's face. Outfit on Clean and Business, Nunito on Snapchat,
// Fredoka on Crashing Out. One declaration, and every use below follows.
const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const BG = TOKENS.SURFACE.page;
const LIVE = TOKENS.STATE.live;

// ─── small style helpers ───
// Following Apple HIG: body text ~15-17px, labels no smaller than 12px,
// interactive targets at least 44px tall, inputs >=16px (prevents iOS zoom).
const TAP = 44;
const MONO = TOKENS.FONT.label;
const CARD_MAX = 380; // cards never grow wider than this (a phone-width card)
// Everything a card needs that is not the theme's business. The background,
// the border, the radius, the shadow and the tilt come from cardStyle, because
// those are exactly the parts a theme changes: Snapchat is three pixels of
// black with a hard offset, Crashing Out cuts four different corners and leans
// a fraction of a degree, Clean is a hairline and nothing else.
const card = {
  padding: 20, fontFamily: F, textAlign: "left",
  width: "100%", cursor: "pointer", display: "block",
};
const label = { fontFamily: TOKENS.FONT.label, fontSize: 13, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
// Anything a student reads as a heading takes the theme's display face, which
// is where a theme stops being a palette. Outfit on Clean, Fraunces on
// Business, Nunito at 900 on Snapchat, Bangers on Crashing Out. The weight
// comes with the face, because 600 on Bangers is not a thing.
const DISPLAY = { fontFamily: TOKENS.FONT.display, fontWeight: TOKENS.FONT.displayWeight,
  textShadow: TOKENS.FONT.displayShadow };
const h2 = { ...DISPLAY, fontSize: 22, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };

// Keyboard users could not see where they were. Everything focusable now says
// so, and the skeleton tiles breathe while the class data is on its way.
// The class colour, lifted for text after dark. A class colour is picked to
// carry white on top and to read on white, and both of those leave it too
// dark to read ON the dark card: crimson lands at 2.15:1 there and purple at
// 3.03:1. So every accent-coloured WORD takes --ca-accent-ink, which is the
// accent by day and the class's own accentDark at night. Backgrounds keep
// --ca-accent, because white on the accent is the same in either mode.
const accentCSS = (a, dark) => !dark ? "" : `
@media (prefers-color-scheme: dark){.ca-root[data-theme="clean"]:not([data-mode="day"]){--ca-accent-ink:${dark}}}
.ca-root[data-theme="clean"][data-mode="night"]{--ca-accent-ink:${dark}}
`;

const CSS = `
.ca-focus:focus-visible{outline:2px solid var(--ca-accent);outline-offset:2px;border-radius:10px}
@keyframes caShimmer{0%{opacity:.55}50%{opacity:1}100%{opacity:.55}}
.ca-skel{animation:caShimmer 1.4s ease-in-out infinite;background:#eceae7;border-radius:8px}
@media (prefers-reduced-motion:reduce){.ca-skel{animation:none}}
`;

// The tabs across the top, and along the bottom on a phone: Home, Schedule,
// Challenges, Class and More, the same for Andrew and for a student. The
// apps sit behind the Apps button; More is the admin page.
const NAV_CARDS = new Set(["schedule", "assignments", "class"]);

// ─────────────────────────────────────────────────────────────
// Card summaries (left grid). Each returns { title, body } given config + role.
// ─────────────────────────────────────────────────────────────
function summary(key, config, role, ctx) {
  switch (key) {
    case "dayplan":
      return { title: "Day Plan", body: <DayPlanSummary config={config} data={ctx.data} blockOf={ctx.blockOf} /> };
    case "you":
      return role === "instructor"
        ? { title: "You", body: <MessagesSummary config={config} role={role} data={ctx.data} asStudent={ctx.asStudent} /> }
        : { title: "Your card", body: <YourCardSummary config={config} data={ctx.data} name={ctx.asStudent} /> };
    case "messages":
      return role === "instructor"
        ? { title: "Inbox", body: <MessagesSummary config={config} role={role} data={ctx.data} asStudent={ctx.asStudent} /> }
        : { title: "Message Dr. Ishak", body: <MessagesSummary config={config} role={role} data={ctx.data} asStudent={ctx.asStudent} /> };
    case "assignments":
      // Andrew, 2026-09-24: Challenges is My Work now, as a tab and everywhere
      // else. The student label keeps the parenthetical he asked for on
      // 2026-09-20: "can you label it as Challenges (Assignments) so
      // students get used to the terminology?" The tab stays one word, since
      // a tab is a place rather than a lesson in what he calls things.
      return { title: role === "instructor" ? "My Work" : "My Work (Assignments)",
        body: <AssignmentsSummary config={config} data={ctx.data} role={role} name={role === "instructor" ? "" : ctx.asStudent} /> };
    case "questions":
      return { title: "Questions", body: <QuestionsSummary config={config} role={role} asStudent={ctx.asStudent} /> };
    case "class":
      return { title: "Class", body: <ClassSummary config={config} data={ctx.data} /> };
    case "games":
      return { title: "Games", body: <GamesSummary games={ctx.games} /> };
    case "schedule":
      return { title: "Schedule", body: <ScheduleSummary config={config} data={ctx.data} /> };
    case "leaderboard":
      return { title: "Leaderboard", body: <Muted>In-class game standings.</Muted> };
    case "roster":
      return { title: "Roster", body: <RosterSummary config={config} data={ctx.data} role={role} name={ctx.asStudent} /> };
    case "syllabus":
      return { title: "Syllabus", body: null };
    case "instructor":
      return { title: "Your instructor", body: <div style={{ fontWeight: 600 }}>{config.instructor?.name}</div> };
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
    return <YouDetail config={config} role={role} data={ctx.data} update={ctx.update} setPhoto={ctx.setPhoto} asStudent={ctx.asStudent} setAsStudent={ctx.setAsStudent} />;
  }
  if (key === "messages") {
    return <MessagesDetail config={config} role={role} data={ctx.data} update={ctx.update} asStudent={ctx.asStudent} />;
  }
  if (key === "assignments") {
    if (role === "instructor") return <AssignmentsDetail config={config} role={role} data={ctx.data} update={ctx.update} asStudent={ctx.asStudent} />;
    return ctx.sub
      ? <AssignmentPage config={config} data={ctx.data} update={ctx.update} name={ctx.asStudent} id={ctx.sub} go={ctx.go} />
      : <AssignmentCards config={config} data={ctx.data} name={ctx.asStudent} go={ctx.go} />;
  }
  if (key === "questions") {
    return <QuestionsDetail config={config} role={role} asStudent={ctx.asStudent} profiles={ctx.data?.profiles} />;
  }
  if (key === "schedule") {
    return <ScheduleDetail config={config} data={ctx.data} blockOf={ctx.blockOf} focusDay={ctx.sub}
      instructor={role === "instructor"} me={role === "instructor" ? "" : ctx.asStudent} mark={ctx.mark} theme={ctx.theme} />;
  }
  if (key === "roster") {
    return <RosterDetail config={config} role={role} data={ctx.data} update={ctx.update} name={ctx.asStudent} />;
  }
  if (key === "instructor") {
    const ins = config.instructor || {};
    return (
      <Panel title="Your instructor">
        <div style={{ fontWeight: 700, fontSize: 17 }}>{ins.name}</div>
        <div style={{ marginTop: 6, color: TEXT_SECONDARY }}>{ins.bio}</div>
        {ins.officeHours ? <div style={{ marginTop: 10, fontSize: 15, color: TEXT_SECONDARY }}><span style={{ fontWeight: 600, color: TEXT_PRIMARY }}>Office hours</span> {ins.officeHours}</div> : null}
        {ins.email ? <a className="ca-focus" href={"mailto:" + ins.email} style={{ display: "inline-block", marginTop: 10, fontSize: 15, fontWeight: 600, color: config.accent }}>{ins.email}</a> : null}
        {schedulingLinkOf(config) ? <a className="ca-focus" href={schedulingLinkOf(config)} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 6, fontSize: 15, fontWeight: 600, color: config.accent }}>Book a meeting</a> : null}
      </Panel>
    );
  }
  // The syllabus, the PDF itself on the page. A phone often will not draw a
  // PDF inside a page, so the file is a link under it too.
  if (key === "syllabus") {
    return (
      <Panel title="Syllabus">
        <iframe title={config.code + " syllabus"} src={config.syllabus}
          style={{ display: "block", width: "100%", height: "80vh", border: "1px solid " + BORDER, borderRadius: 10, background: "#fff" }} />
        <a className="ca-focus" href={config.syllabus} target="_blank" rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", minHeight: TAP, marginTop: 12, fontSize: 17, fontWeight: 600, color: config.accent, textDecoration: "none" }}>Open PDF</a>
      </Panel>
    );
  }
  // Class: your card, the roster and your instructor, each a card of its own.
  // Andrew has no card of his own here; his inbox is on the home page.
  if (key === "class") {
    return (
      <Panel title="Class">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(role === "instructor" ? ["roster", "instructor"] : ["you", "roster", "instructor"])
            .concat(config.syllabus ? ["syllabus"] : []).map((k, i) => ctx.tile(k, i))}
        </div>
      </Panel>
    );
  }
  // Games: the one that is open, with Start, and every game this student
  // finished, with the score once the scores are released. A finished one
  // opens again, to read their own answers back.
  if (key === "games") {
    return (
      <Panel title="Games">
        {(ctx.games || []).length
          ? <GamesNow games={ctx.games} onStart={ctx.startGame || (() => {})} onReview={ctx.reviewGame || undefined} />
          : <Muted>No games yet.</Muted>}
        {role === "instructor" ? (
          <a className="ca-focus" href={config.path + "/games"} style={{ display: "inline-flex", alignItems: "center", minHeight: TAP, marginTop: 12, fontSize: 17, fontWeight: 600, color: config.accent, textDecoration: "none" }}>Games</a>
        ) : null}
      </Panel>
    );
  }
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
// a discussion asks for an answer. The prompt itself is the headline, because a box
// saying "a discussion board is running" is a box that makes you go find the
// question.
export function onScreenNow(config, live) {
  const c = live?.cast;
  // The ask page is gone: Andrew, 2026-09-20, "remove the whole ask feature
  // for now. it's confusing." Anything that used to send a phone there now
  // says what is on the screen without offering a door, except the board,
  // which has one of its own.
  const room = config.path + "/today";

  if (!c) return null;

  if (c.type === "board") {
    return { kind: c.boardLabel || "Discussion",
      title: c.idea || c.title || "A discussion is open",
      cta: "Add to the discussion", href: config.path + "/board" };
  }
  if (c.type === "question") {
    return { kind: "Question", title: c.title || c.label || "A question is up" };
  }
  if (c.type === "reveal") {
    return { kind: "Challenge", title: c.title || "A challenge", sub: c.due || "",
      cta: "Read the challenge", href: config.path };
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

export function OnScreenNow({ config, live }) {
  const it = onScreenNow(config, live);
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
      {/* Some of what goes up has nowhere for a phone to go: a question is
          answered out loud in the room. The banner still says what is up. */}
      {it.href ? <a className="ca-focus" href={it.href}
        {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8,
          minHeight: TAP, padding: "0 20px", borderRadius: 12, background: accent, color: "#fff",
          fontSize: 16, fontWeight: 600, textDecoration: "none" }}>
        {it.cta} <span aria-hidden="true">→</span>
      </a> : null}
    </section>
  );
}

// What a student can join right now. It reads the same cast bus the room
// screen reads, so the card and the projector agree.
function liveNow(config, live, data) {
  const out = [];
  // A game that is open is the most joinable thing there is, so it goes first.
  const trivia = Object.values(data?.triviaGames || {}).find(g => g.phase === "live");
  if (trivia) out.push({ id: "trivia", title: "Team Trivia is running",
    what: "Answer with your team.", href: config.path + "/game" });
  const week = Object.values(data?.weeklyGames || {}).find(g => g.phase === "live");
  if (week) out.push({ id: "game", title: "The game is open",
    what: "Answer this week's questions.", href: config.path + "/game" });
  const tot = Object.values(data?.weeklyToT || {}).find(g => g.phase === "live");
  if (tot) out.push({ id: "tot", title: "Ten on Ten is open",
    what: "Answer this week's ten.", href: config.path + "/game" });
  const c = live?.cast;
  if (c?.type === "feature") out.push({ id: "ft", title: c.title + " is running", what: c.body || "", href: config.path + "/today" });
  return out;
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
    // A message on a challenge is as easy to miss as a submission.
    const said = waitingCount(data, assignmentsOf(config, data)).messages;
    if (said) out.push({ id: "said", card: "assignments", text: said + " message" + (said === 1 ? "" : "s") + " on challenges waiting for a reply" });
    const waiting = rosterOf(config, data).filter(s => {
      const t = data?.threads?.[s.name] || [];
      const last = t[t.length - 1];
      return last && last.from === "student";
    }).length;
    if (waiting) out.push({ id: "inbox", card: "messages", text: waiting + " student" + (waiting === 1 ? "" : "s") + " waiting on a reply" });
    const asks = openRequests(data);
    if (asks) out.push({ id: "requests", card: "more", text: asks + " request" + (asks === 1 ? "" : "s") + " and bugs waiting" });
    return out;
  }
  if (unreadNotes(data, asStudent)) out.push({ id: "note", card: "messages", text: "A new note from " + (config.instructor?.name || "your instructor") });
  // The first-week challenge, until every field on the card is filled.
  const task = profileTaskOf(config, data);
  if (task && !profileComplete(data?.profiles?.[asStudent])) out.push({ id: "card", card: "you", text: task.title });
  // A deadline coming up is the Assignments card's own highlight now, so it
  // is not said a second time up here.
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
          <span aria-hidden="true" style={{ flex: "none", fontSize: 26, lineHeight: 1, color: TEXT_MUTED }}>›</span>
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
// The class site no longer asks "Who are you?". Everyone signs in at /login,
// and the roster answers by email: a student on this roster is that student,
// an instructor's email is the instructor, anybody else is told they are not
// in this class. A visitor with no session is sent to the door and comes back
// to the page they asked for.
function NotInClass({ config, email, onSignOut }) {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", justifyContent: "center", padding: "48px 20px" }}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600 }}>{config.code} · {config.name}</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>You are not in this class.</h1>
        <Muted>{email} is signed in, and the {config.code} roster does not have that address. If you should be here, ask Andrew to add you.</Muted>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="ca-focus" href="/login" style={{ ...card, minHeight: TAP, padding: "12px 16px", fontSize: 16, fontWeight: 600, border: "1px solid " + BORDER_STRONG, textDecoration: "none", color: TEXT_PRIMARY, display: "inline-flex", alignItems: "center" }}>My classes</a>
          <button className="ca-focus" onClick={onSignOut} style={{ ...card, minHeight: TAP, padding: "12px 16px", fontSize: 16, fontWeight: 500, border: "1px solid " + BORDER_STRONG }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}

function GoSignIn({ config }) {
  const next = typeof window !== "undefined" ? window.location.pathname : config.path;
  const href = "/login?next=" + encodeURIComponent(next);
  useEffect(() => { window.location.replace(href); }, [href]);
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", justifyContent: "center", padding: "48px 20px" }}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600 }}>{config.code} · {config.name}</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>Sign in first.</h1>
        <a className="ca-focus" href={href} style={{ ...card, minHeight: TAP, padding: "12px 16px", fontSize: 16, fontWeight: 600, border: "1px solid " + BORDER_STRONG, textDecoration: "none", color: TEXT_PRIMARY, display: "inline-flex", alignItems: "center", alignSelf: "flex-start" }}>Go to sign in →</a>
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

// A short signature of a day plan's content, leaving out the signature
// itself. djb2 over the JSON, which is enough to tell "still the seed" from
// "edited since", and is not meant to survive a collision hunt.
export function planSig(plan) {
  const { seeded, ...rest } = plan || {};
  const s = JSON.stringify(rest);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export default function ClassApp({ config: classConfig, initialCard }) {
  const REMEMBER = classConfig.storageKey + "-user";
  const ADMIN = classConfig.storageKey + "-admin";

  // The fourth thing is where the saving is, so a box can say Saved or Not
  // saved yet, and the bar can say it for the whole page.
  const [stored, update, apply, saveState] = useClassData(classConfig.storageKey);
  const online = useOnline();
  // Whether this page has written anything yet, so the bar says Saved only
  // once there has been something to save.
  const [wrote, setWrote] = useState(false);
  useEffect(() => { if (saveState?.busy) setWrote(true); }, [saveState?.busy]);
  // The photographs live one row over, so a keystroke anywhere in the class
  // does not ship two dozen faces with it. Put back on the profiles here, once,
  // and every screen below goes on reading profiles[name].avatar. See photos.js.
  const [photos, setPhoto] = usePhotos(classConfig.storageKey);
  const data = useWithPhotos(stored, photos);
  // The shared shelf as well, because a reading on the schedule can be a block
  // that belongs to me rather than to this class, and the pick that says read
  // this one first lives on the block.
  const [shared, updateShared] = useClassData(SHARED_KEY);
  // Andrew's own card comes off the shared store, over whatever the class
  // config ships, so every surface below reads the profile he can edit.
  const config = { ...classConfig, instructor: instructorOf(classConfig, shared) };
  // The types Andrew has added or renamed, so a block on this site says what
  // he calls it rather than the id underneath. The repository and the
  // dashboard do the same; every reader goes through typeOf.
  registerTypes({ added: readAdded(shared), labels: readLabels(shared) });
  const [live] = useLive(config.storageKey);
  const isDesktop = useIsDesktop();
  const a = config.accent;

  // Remembered sign-ins, read on the first render so the sign-in screen never
  // flashes at somebody who is already signed in. The student key is the one
  // the Ask page writes, so a student who signed in to ask a question is in.
  const remembered = () => { try { return localStorage.getItem(REMEMBER); } catch { return null; } };
  const [role, setRole] = useState(() => { try { return localStorage.getItem(ADMIN) === "1" ? "instructor" : "student"; } catch { return "student"; } });
  // Community was renamed Class, and a link somebody saved still says community.
  // The open card can carry a second part: "assignments/interview" is one
  // assignment's own page.
  // Assignments are Challenges to anyone reading, the URL included, while the
  // card underneath keeps its key: /challenges/<id> opens "assignments/<id>",
  // and an old /assignments link still lands.
  const cardKey = (k) => (k ? String(k).replace(/^community(?=\/|$)/, "class").replace(/^challenges(?=\/|$)/, "assignments") : k);
  const [open, setOpen] = useState(cardKey(initialCard) || null);
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
  // The student's theme. Their browser, not the class store: a theme is a
  // preference about a screen rather than a fact about a class.
  const [theme, pickTheme] = useStudentTheme(config);
  // Auto by default, and an override for anybody who wants one.
  const [mode, pickMode] = useDayNight(config);
  const [preview, setPreview] = useState("");
  // Whether a preview writes. Andrew, 2026-09-20: "i need to be able to test
  // the messaging with dr ishak. let me post a fake message as [a fake
  // student]." A look that writes nothing cannot test a conversation, and a
  // look that writes as a real student posts in their name. So it is a switch
  // on the preview bar, and it starts on for the class's test student, who is
  // fake and exists for exactly this.
  const [saving, setSaving] = useState(false);
  // The grade deck has been tapped through this visit. Held here rather than
  // read back from the store, because a preview writes nothing and would
  // otherwise sit behind the deck for ever.
  const [deckDone, setDeckDone] = useState(false);
  // The same, for the due-soon cards.
  const [dueDone, setDueDone] = useState(false);
  // And for the card he writes for the class.
  const [noticeDone, setNoticeDone] = useState(false);
  // What the page draws as. The person is still the instructor; the page is
  // drawn the way the chosen student would get the page drawn.
  // Who this is, from the session and the roster. The remembered name is what
  // every card, board and game already keys on, so the session sets that name
  // and the rest of the site carries on as before. The instructor's email
  // makes the instructor; nobody has to press a role toggle to get in.
  const { session, email: sessionEmail, instructor: sessionInstructor, signOut: endSession } = useSession();
  // Only the instructor's own sign-in can draw the instructor side. The
  // Student and Instructor switch sat in every student's menu, and pressing
  // Instructor set a flag in that student's browser that the page believed.
  // A student signed in is a student, whatever the flag says.
  const view = preview || (session && !sessionInstructor) ? "student" : role;

  // ─── the URL is the state ───
  // /comm999/assignments is a link you can send someone, and Back goes back to
  // the grid instead of leaving the site.
  const go = useCallback((key) => {
    setOpen(key);
    const path = config.path + (key ? "/" + String(key).replace(/^assignments(?=\/|$)/, "challenges") : "");
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
  }, [config.path]);

  useEffect(() => {
    const onPop = () => {
      const rest = window.location.pathname.replace(config.path, "").replace(/^\/|\/$/g, "");
      setOpen(cardKey(rest) || null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [config.path]);

  // A preview is a look, not a login. The class store is shared and real, so a
  // press on the student side would post a message from that student or
  // rewrite that student's profile. While the lens is on, writes go nowhere,
  // unless he has said to save them.
  const write = preview && !saving ? () => {} : update;
  // Saying you will not be there is the one write a whole room makes at once,
  // so it does not go out through `update`, which writes the class as this page
  // holds it. It re-reads, merges the marks and writes that. See attendance.js.
  const mark = useCallback(async (date, id, away) => {
    if (preview && !saving) return;
    const out = await saveMerged(classConfig.storageKey, prev => setAway(prev, date, id, away), mergeAway);
    if (out) apply(out);
  }, [classConfig.storageKey, preview, saving, apply]);
  // The theme travels with the context, because a card on the schedule is the
  // same card as a card on the front page and Crashing Out cuts each one its
  // own way. It used to stop at this component, so the schedule drew a hairline
  // of its own while the page behind it was cut up.
  const ctx = { data: data || {}, update: write, asStudent: preview || asStudent,
    setAsStudent: preview ? setPreview : null, live, mark, theme,
    // A photograph is written to its own row, never into the class. A preview
    // writes nothing, the same as every other edit made while looking.
    setPhoto: preview && !saving ? () => {} : setPhoto,
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
      // A day plan seeded from config lands on a day the store has nothing
      // for, and on a day still exactly as the seed left it. A day I have
      // touched on the dashboard is mine, and a seed bump must never write
      // over a plan for a class I have taught. "Exactly as the seed left it"
      // is a signature of the plan's content stored on the plan: any edit
      // changes the content, the signature stops matching, and the day is
      // kept. Regenerating the term with better links reaches every day I
      // have not been into yet, and no other.
      update(prev => {
        const next = { ...prev, ...patch };
        if (config.dayPlans) {
          const have = prev.dayPlans || {};
          const plans = { ...have };
          Object.entries(config.dayPlans).forEach(([d, p]) => {
            const cur = have[d];
            if (!cur || (cur.seeded && cur.seeded === planSig(cur))) plans[d] = { ...p, seeded: planSig(p) };
          });
          next.dayPlans = plans;
        }
        return next;
      });
    }
  }, [data, config]);

  useEffect(() => { document.title = config.code + " · " + config.name; setClassFavicon(config); }, [config.code, config.name, config.accent]);

  // Some cards are instructor-only (e.g. the day-planning surface) and never
  // appear on the student home, regardless of the config toggle.
  const INSTRUCTOR_ONLY = new Set(["dayplan"]);
  const enabledCards = Object.entries(config.cards || {})
    .filter(([, on]) => on)
    .map(([k]) => k)
    .filter(k => view === "instructor" || !INSTRUCTOR_ONLY.has(k))
    .concat(config.syllabus ? ["syllabus"] : []);
  // The tabs this person gets, and therefore which cards are already reachable
  // without opening More. An instructor's tabs hold no cards at all, so every
  // card is under More for him — Schedule and Assignments did not disappear,
  // they went back to being cards like the rest.
  const navTabs = NAV_CLASS;
  const tabCards = new Set(navTabs.map(n => n.card).filter(k => k && NAV_CARDS.has(k)));
  // The home page, top to bottom, under the Next class hero and the pinned
  // links. Andrew, 2026-09-15: schedule first, then assignments, then class,
  // grades toward the bottom, and games at the very bottom. Messages sit
  // under Challenges since 2026-09-17, a card of their own off the profile.
  const HOME = ["assignments", "messages", "questions", "class", "games"].filter(k => enabledCards.includes(k));
  // What lives inside Class, and lights the Class tab when open.
  const IN_CLASS = new Set(["you", "roster", "instructor", "syllabus"]);

  const signIn = (name) => {
    try { localStorage.setItem(REMEMBER, name); } catch { /* private mode */ }
    setSignedIn(name); setAsStudent(name);
  };
  const signOut = async () => {
    try { localStorage.removeItem(REMEMBER); localStorage.removeItem(ADMIN); } catch { /* private mode */ }
    setSignedIn(null); setRole("student");
    await endSession();
    window.location.href = "/login";
  };

  const rosterNow = withIds(data?.students || config.students || []);
  // The student's own code, read off the row only they can see, for the menu.
  const [ownCode, setOwnCode] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  // Whether the welcome cards are up, latched.
  //
  // The gate is "this student has answered nothing", and every keystroke on a
  // card writes an answer, so asking the question on every render closed the
  // deck as soon as anybody typed into it. Andrew, 2026-09-20: "I tried to type
  // in the card as pepe and it just ended the card deck instead."
  //
  // So it is asked once and then remembered. In the render rather than in an
  // effect, because an effect runs after a render and the student would see
  // the site for a frame before the cards arrived. Looking at somebody else
  // starts the question over, which is what View as a student is for.
  const deck = useRef({ name: null, on: false, done: false });
  const [, tickDeck] = useState(0);
  const finishWelcome = () => { deck.current = { ...deck.current, on: false, done: true }; tickDeck(n => n + 1); };
  useEffect(() => {
    let alive = true;
    if (!session || sessionInstructor) { setOwnCode(""); return undefined; }
    myCode().then(c => { if (alive) setOwnCode(c); });
    return () => { alive = false; };
  }, [session?.user?.id, sessionInstructor]);   // eslint-disable-line react-hooks/exhaustive-deps
  const me = session && !sessionInstructor ? studentFor(sessionEmail, rosterNow) : null;

  // Games. When the instructor opens one, a card comes up over the site with
  // the game, the agreement box and Start, and the game also sits in
  // Community. Each answer is its own row (decks), signed as this student.
  const gameViewer = me && sessionEmail ? { id: String(sessionEmail).trim().toLowerCase(), name: me.name } : null;
  const { games } = useOpenGames({ supabase: gameClient, groupKey: config.id, viewerId: gameViewer?.id, section: me?.section ? String(me.section).trim() : null });
  const [playing, setPlaying] = useState(null);
  // A game they have finished, opened again to read their own answers back.
  // Andrew, 2026-09-22: "there should be a way back into the questions."
  const [reviewing, setReviewing] = useState(null);
  const gameRoster = rosterNow.filter(s => s.email).map(s => ({ id: String(s.email).trim().toLowerCase(), name: s.name }));
  ctx.games = games;
  ctx.startGame = gameViewer ? setPlaying : null;
  ctx.reviewGame = gameViewer ? setReviewing : null;
  const openGame = !preview && gameViewer ? games.find(g => g.open) : null;
  const GameLayer = !gameViewer || preview ? null
    : playing ? <GamePlay supabase={gameClient} game={playing} viewer={gameViewer} roster={gameRoster} onExit={() => setPlaying(null)} onError={e => console.error(e)} />
    : reviewing ? (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, overflowY: "auto", background: TOKENS.SURFACE.page }}>
        <GameReviewLive supabase={gameClient} deckId={reviewing.deck.id} viewer={gameViewer}
          title={reviewing.deck.title} result={reviewing.score || null} theme={{ accent: config.accent }}
          onExit={() => setReviewing(null)} onError={e => console.error(e)} />
      </div>
    )
    : openGame ? <GameStart game={openGame} onStart={setPlaying} />
    : null;
  useEffect(() => {
    if (!session || data === null) return;
    if (sessionInstructor) {
      if (role !== "instructor") { try { localStorage.setItem(ADMIN, "1"); } catch { /* private mode */ } setRole("instructor"); }
      return;
    }
    if (me && signedIn !== me.name) signIn(me.name);
  }, [session, sessionInstructor, me?.name, data === null]);   // eslint-disable-line react-hooks/exhaustive-deps
  const pickRole = (r) => {
    try { if (r === "instructor") localStorage.setItem(ADMIN, "1"); else localStorage.removeItem(ADMIN); } catch { /* private mode */ }
    setRole(r); go(null);
  };


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

  // The roster, alphabetical, because a picker over thirty names wants an order
  // I can aim at.
  const roster = withIds(data?.students || config.students).slice()
    .sort((x, y) => (x.name || "").localeCompare(y.name || ""));

  const StudentPicker = (
    <select className="ca-focus" value={preview} aria-label="Which student"
      onChange={e => { setPreview(e.target.value); setSaving(isTestStudent(config, e.target.value)); go(null); }}
      style={{ fontFamily: F, fontSize: 15, fontWeight: 600, minHeight: TAP, padding: "0 10px", maxWidth: 230,
        borderRadius: 999, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY, cursor: "pointer" }}>
      <option value="">View as a student</option>
      {roster.map(st => <option key={st.name} value={st.name}>{st.name}</option>)}
    </select>
  );

  // The way out, across the top of every page, in the class colour, so no
  // amount of scrolling loses the way back.
  const PreviewBar = preview ? (
    <div style={{ background: a, color: "#fff" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "10px 16px", display: "flex",
        alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Seeing the class as {preview}</span>
        <span style={{ fontSize: 15, opacity: .85 }}>
          {saving ? "Everything you press is saved as " + preview + "." : "This is a look, not a login. Nothing you press is saved."}
        </span>
        <button className="ca-focus" onClick={() => setSaving(v => !v)} aria-pressed={saving}
          style={{ minHeight: TAP, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.55)",
            background: saving ? "#fff" : "transparent", color: saving ? a : "#fff",
            fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          {saving ? "Stop saving" : "Save what I press"}
        </button>
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

  // The class's name, and everything else the class holds behind it. Andrew,
  // 2026-09-20: "the way you changed the top menu to be a dropdown from the
  // class name, let's do that for the students as well. get rid of the apps
  // drop down in top right." So the apps sit under the name at the left, the
  // way his already did, and the right end of the bar is free for a message
  // or a game to announce itself. The class switcher, the student preview,
  // the theme and the account stay on More, which is the admin page in either
  // view.
  const adminSelect = { fontFamily: F, fontSize: 16, fontWeight: 500, minHeight: TAP, padding: "0 12px", borderRadius: 10,
    border: "1px solid " + BORDER_STRONG, background: "var(--surface-card)", color: TEXT_PRIMARY, cursor: "pointer", maxWidth: 360 };

  // A card key can arrive from the address bar, so it gets the same check the
  // grid does: unknown or not-yours falls back to the home grid.
  const [openBase, openSub = ""] = String(open || "").split("/");
  const openKey = openBase && (openBase === "more" || enabledCards.includes(openBase)) ? openBase : null;
  ctx.sub = openKey ? openSub : "";
  ctx.go = go;

  // Which nav tab is lit: the open card, or "More" when the open card is one
  // that lives under it.
  const activeNav = !openKey ? "home"
    : tabCards.has(openKey) ? openKey
    : IN_CLASS.has(openKey) && tabCards.has("class") ? "class"
    : openKey === "more" ? "more" : "home";

  // The class's name, and every page of the class behind it. Both shapes: the
  // full one for the bar on a laptop, and a compact one for the phone, where
  // it shares its row with the way back.
  // A student's own six digits, at the right end of the bar. Andrew,
  // 2026-09-20: "please share a students pin with them on the front page top
  // right 'show pin' and then it shows them the pin, and says below it: you
  // can use this to log in instead of having an email sent to you." It is
  // hidden until pressed, because a code on the screen is a code the person
  // beside them can read, and it is theirs alone: a preview of somebody else
  // never shows it.
  // A student's two things in the bar, on a phone as well. Andrew,
  // 2026-09-24: "students need two things in their upper nav bar, even on
  // mobile: a button to reveal their 6 digit pin, and a mail envelope that
  // tells them if they have a message from me or not, and if they click on
  // it, they reach messaging with me anyway."
  //
  // Both show while he views as a student, so he sees the bar they see. A
  // preview cannot read another person's PIN, so there it is six dots.
  const pinShown = preview ? "••••••" : ownCode;
  const barBtn = { minHeight: TAP, minWidth: TAP, padding: "0 12px", borderRadius: 999, cursor: "pointer",
    border: "1px solid " + BORDER_STRONG, background: "var(--surface-card)", display: "inline-flex",
    alignItems: "center", justifyContent: "center", gap: 6, fontFamily: F, fontSize: 14, fontWeight: 600, color: TEXT_SECONDARY };
  const ShowPin = pinShown && view !== "instructor" ? (
    <span style={{ position: "relative", flex: "none" }}>
      <button className="ca-focus" onClick={() => setPinOpen(v => !v)} aria-expanded={pinOpen}
        aria-label={pinOpen ? "Hide PIN" : "Show PIN"} style={barBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 9.3-9.3" /><path d="m16 7 3 3" /><path d="m19 4 2 2" />
        </svg>
        {isDesktop ? (pinOpen ? "Hide PIN" : "Show PIN") : "PIN"}
      </button>
      {pinOpen ? (
        <>
          <div onClick={() => setPinOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 41, width: 250,
            maxWidth: "calc(100vw - 32px)", padding: 14, background: "var(--surface-card)",
            border: "1px solid " + BORDER_STRONG, borderRadius: 14, boxShadow: "0 18px 44px -14px rgba(23,19,16,.35)" }}>
            <div style={{ fontFamily: "var(--font-label)", fontSize: 24, fontWeight: 700, letterSpacing: ".18em", color: TEXT_PRIMARY }}>{pinShown}</div>
            <div style={{ fontSize: 14, lineHeight: 1.45, color: TEXT_SECONDARY, marginTop: 8 }}>
              You can use this to log in instead of having an email sent to you. It never changes, and it is not
              the one-time code an email gives you.
            </div>
          </div>
        </>
      ) : null}
    </span>
  ) : null;

  const unread = view !== "instructor" ? unreadNotes(data, preview || asStudent) : 0;
  const MailButton = view !== "instructor" ? (
    <button className="ca-focus" onClick={() => { setPinOpen(false); go("messages"); }}
      aria-label={unread ? "Messages, " + unread + " new from " + (config.instructor?.name || "your instructor") : "Messages, nothing new"}
      title={unread ? unread + " new" : "Nothing new"}
      style={{ ...barBtn, position: "relative", padding: 0, width: TAP,
        borderColor: unread ? a : BORDER_STRONG, color: unread ? a : TEXT_SECONDARY }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
      </svg>
      {unread ? (
        <span aria-hidden="true" style={{ position: "absolute", top: -4, right: -4, minWidth: 20, height: 20, padding: "0 5px",
          borderRadius: 999, background: a, color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: "20px", textAlign: "center",
          boxShadow: "0 0 0 2px var(--surface-card)" }}>{unread}</span>
      ) : null}
    </button>
  ) : null;

  const TheClass = <ClassMenu config={config} role={view} onPick={go} active={activeNav} />;
  const TheClassCompact = <ClassMenu config={config} role={view} onPick={go} active={activeNav} compact />;

  // The thing this student still owes, which lights the Assignments card as
  // the deadline gets close.
  const owed = view === "instructor" ? null : nextOwed(assignmentsOf(config, data), data, preview || asStudent);

  const CardTile = (key, i = 0) => {
    const s = summary(key, config, view, ctx);
    const seat = { ...cardStyle(theme, i), ...card, ...(key === "assignments" ? owedStyle(owed) : null) };
    return (
      <button key={key} className="ca-focus" onClick={() => go(key)}
        style={{ ...seat, position: "relative",
          outline: openKey === key ? "2px solid " + a : "none" }}>
        {i === 0 ? <TubeyPeek theme={theme} /> : null}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ ...tileTitle(theme), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{s.title}</span>
          {/* A quiet chevron says the card opens. Andrew picked this over
              "open →", which read as an instruction rather than a door. */}
          <span aria-hidden="true" style={{ fontSize: 26, lineHeight: 1, color: TEXT_MUTED, flexShrink: 0 }}>›</span>
        </div>
        {s.body}
      </button>
    );
  };

  const MorePage = (
    <Panel title="More">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* More is the admin page, in either view. The apps are behind the
            Apps button in the top bar. */}
        {view === "instructor" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ ...label, color: TEXT_MUTED }}>Class</span>
            <select className="ca-focus" value={config.id} aria-label="Class" id="more-class"
              onChange={e => {
                const next = ENGINE_LIST.find(c => c.id === e.target.value);
                if (!next) return;
                window.history.pushState({}, "", next.path);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              style={adminSelect}>
              {ENGINE_LIST.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
            {roster.length ? (
              <select className="ca-focus" value={preview} aria-label="Which student" id="more-preview"
                onChange={e => { setPreview(e.target.value); setSaving(isTestStudent(config, e.target.value)); go(null); }}
                style={adminSelect}>
                <option value="">View as a student</option>
                {roster.map(st => <option key={st.name} value={st.name}>{st.name}</option>)}
              </select>
            ) : null}
          </div>
        ) : null}
        {view === "instructor" ? (
          <div style={{ paddingTop: 12, borderTop: "1px solid " + BORDER }}>
            <InstructorProfile config={config} shared={shared} updateShared={preview ? () => {} : updateShared} />
          </div>
        ) : null}
        {view === "instructor" ? <div style={{ paddingTop: 12, borderTop: "1px solid " + BORDER }}><RequestInbox data={data} update={write} /></div> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: view === "instructor" ? 12 : 0, borderTop: view === "instructor" ? "1px solid " + BORDER : "none" }}>
          <span style={{ ...label, color: TEXT_MUTED }}>Theme</span>
          <p style={{ margin: 0, fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
            Your choice, on your screen. Nobody else in the class sees it.
          </p>
          <ThemePicker theme={theme} onPick={pickTheme} />
          <DayNightPicker theme={theme} mode={mode} onPick={pickMode} />
        </div>
        {view === "instructor" ? null : (
          <div style={{ paddingTop: 12, borderTop: "1px solid " + BORDER }}>
            <RequestForm update={write} name={preview || asStudent} />
          </div>
        )}
        {/* The account, for a student: moved here from the top-right menu,
            which is Apps now. */}
        {session && !preview ? (
          <div style={{ paddingTop: 12, borderTop: "1px solid " + BORDER, display: "flex", flexDirection: "column", gap: 4 }}>
            {sessionInstructor ? <div style={{ alignSelf: "flex-start" }}>{RoleToggle}</div> : null}
            {ownCode ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: TAP }} title="Your email and this code sign you in anywhere">
                <span style={{ fontSize: 15, color: TEXT_MUTED }}>Your sign-in code</span>
                <span style={{ fontFamily: "var(--font-label)", fontSize: 16, fontWeight: 600, letterSpacing: ".14em", color: TEXT_PRIMARY }}>{ownCode}</span>
              </div>
            ) : null}
            <button className="ca-focus" onClick={signOut}
              style={{ alignSelf: "flex-start", minHeight: TAP, background: "none", border: "none", padding: 0, fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY, cursor: "pointer" }}>
              {view === "instructor" || !signedIn ? "Sign out" : "Sign out " + signedIn}
            </button>
          </div>
        ) : null}
      </div>
    </Panel>
  );

  // Nothing opens on a class that has not arrived yet. A card drawn over the
  // empty stand-in reads as blank, and a form drawn over it starts blank and
  // stays that way when the class lands.
  const detailFor = (key) => key === "more" ? MorePage
    : data === null ? <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><Skeleton w="40%" h={22} /><Skeleton w="90%" h={14} /><Skeleton w="75%" h={14} /></div>
    : detail(key, config, view, ctx);
  ctx.tile = CardTile;

  // Class is on the projector right now. Students following remotely get the
  // same screen the room is looking at.
  const roomLive = live?.cast && live.at && (Date.now() - live.at) < 3 * 60 * 60 * 1000;
  // The thing on the projector, with its own door, above everything else. The
  // old banner said class was on and made you go looking; this says what is on.
  const onNow = roomLive ? onScreenNow(config, live) : null;
  const LiveBanner = onNow ? <OnScreenNow config={config} live={live} /> : roomLive ? (
    <a className="ca-focus" href={config.path + "/today"}
      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
        background: "var(--surface-card)", border: "1px solid " + LIVE, borderRadius: "var(--card-radius)", padding: "12px 16px", minHeight: TAP, marginBottom: 14 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: LIVE, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>Class is on the screen right now</span>
      <span style={{ flex: "none", fontSize: 15, fontWeight: 600, color: LIVE }}>follow along →</span>
    </a>
  ) : null;

  const actions = data === null ? [] : needsYou(config, data, view, preview || asStudent);
  // The marquee reads the same facts the cards do, so Crashing Out is loud
  // about something true rather than loud about nothing.
  const seenAs = preview || asStudent;
  if (deck.current.name !== seenAs) deck.current = { name: seenAs, on: false, done: false };
  if (data !== null && view !== "instructor" && seenAs && !deck.current.done && needsWelcome(data, seenAs)) {
    deck.current.on = true;
  }
  const myPoints = (data?.log || []).filter(e => e.studentId === (roster.find(x => x.name === seenAs) || {}).id)
    .reduce((n, e) => n + (e.amount || 0), 0);
  const tickerLines = [
    config.code + " " + (config.name || ""),
    ...actions.map(a => a.text),
    ...liveNow(config, live, data).map(i => i.title),
  ].filter(Boolean);

  // The home page. The hero and the pinned links take the full width of the
  // two-across grid on a laptop; on a phone everything is one column anyway.
  const sectionOf = (roster.find(s => s.name === (preview || asStudent)) || me || {}).section;
  const Grid = data === null
    ? <>{[0, 1, 2, 3].map(i => <SkeletonTile key={i} />)}</>
    : <>
        {/* The width of the page on a laptop, where the card reads in two
            columns: the day on the left, what to do before it on the right.
            One column of the grid held the day in a slot too narrow for it,
            and the full width with everything stacked was emptier still. */}
        <div key="hero" style={{ gridColumn: "1 / -1" }}>
          <NextClassHero config={config} data={data} blockOf={ctx.blockOf} section={sectionOf}
            onOpen={() => go("schedule")} onOpenDay={(date) => go("schedule/" + daySlug(date))}
            seat={cardStyle(theme, 0)} wide={isDesktop}
            instructor={view === "instructor"} update={write}
            me={view === "instructor" ? "" : seenAs} mark={ctx.mark} saving={saveState} online={online} />
        </div>
        {view === "instructor" ? (
          <div key="notice" style={{ gridColumn: "1 / -1" }}>
            <NoticeWriter data={data} update={write} seat={cardStyle(theme, 1)} saving={saveState} online={online} />
          </div>
        ) : null}
        {(data?.pins || []).length || view === "instructor" ? (
          <div key="pins" style={{ gridColumn: "1 / -1" }}>
            <PinnedLinks data={data} update={write} instructor={view === "instructor"} seat={cardStyle(theme, 1)} />
          </div>
        ) : null}
        {HOME.map((k, i) => CardTile(k, i + 2))}
      </>;

  // The door, after every hook above has run, so a render that turns somebody
  // away calls the same hooks as a render that lets them in, and above both
  // layouts, because the desktop one returns on its own.
  if (!session) return <GoSignIn config={config} />;
  if (data !== null && !sessionInstructor && !me) return <NotInClass config={config} email={sessionEmail} onSignOut={signOut} />;
  if (data !== null && !sessionInstructor && me && signedIn !== me.name) return null;   // the effect is setting the name

  // The first time a student signs in, the questions come before the site.
  // Andrew, 2026-09-20: "first time they log in, are there cards? ... i'd love
  // to have cards that are like: welcome to class. I'd like to know a little
  // bit about you." It is asked once: stepping through or leaving early marks
  // it, and the first challenge of the term reads the same profile.
  if (deck.current.on) {
    return (
      <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-body)", color: TEXT_PRIMARY, "--ca-accent": a, "--ca-accent-ink": a }} className="ca-root">
        <ThemeStyle theme={theme} />
        <style>{CSS + accentCSS(a, config.accentDark)}</style>
        <WelcomeDeck config={config} name={seenAs} profile={(data.profiles || {})[seenAs]} update={write}
          setPhoto={preview && !saving ? () => {} : setPhoto} pin={ownCode} onDone={finishWelcome} />
      </div>
    );
  }

  // A released grade is a card the student reads before the site. One per
  // assignment, and the site waits until every one has been tapped through.
  const unseen = data !== null && view !== "instructor" && !deckDone ? unseenGrades(config, data, seenAs) : [];
  if (unseen.length) {
    return (
      <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-body)", color: TEXT_PRIMARY, "--ca-accent": a, "--ca-accent-ink": a }} className="ca-root">
        <ThemeStyle theme={theme} />
        <style>{CSS + accentCSS(a, config.accentDark)}</style>
        <GradeDeck config={config} items={unseen} onSeen={(aid) => write(prev => markSeen(prev, aid, seenAs))} onDone={() => setDeckDone(true)} />
      </div>
    );
  }

  // Due inside 48 hours with nothing turned in: a card, once per deadline,
  // after any grade cards and before the site.
  const dueCards = data !== null && view !== "instructor" && !dueDone ? dueSoon(config, data, seenAs) : [];
  if (dueCards.length) {
    return (
      <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-body)", color: TEXT_PRIMARY, "--ca-accent": a, "--ca-accent-ink": a }} className="ca-root">
        <ThemeStyle theme={theme} />
        <style>{CSS + accentCSS(a, config.accentDark)}</style>
        <DueDeck config={config} items={dueCards} onDismiss={(asg) => write(prev => dismissDue(prev, asg, seenAs))} onDone={() => setDueDone(true)}
          onOpen={(asg) => go("assignments/" + asg.id)} />
      </div>
    );
  }

  // A card he has written for the class, once each, and only while it is still
  // worth saying. Andrew, 2026-09-21: "i want to create a card that will be
  // there next time students log in." Last of the cards in front of the site,
  // because a grade and a deadline are a student's own business and this is
  // everybody's. See notice.js.
  const notice = data !== null && view !== "instructor" && !noticeDone ? noticeFor(data, seenAs) : null;
  if (notice) {
    return (
      <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-body)", color: TEXT_PRIMARY, "--ca-accent": a, "--ca-accent-ink": a }} className="ca-root">
        <ThemeStyle theme={theme} />
        <style>{CSS + accentCSS(a, config.accentDark)}</style>
        <NoticeCard config={config} text={notice.text}
          onDone={() => { write(prev => markNoticeRead(prev, seenAs)); setNoticeDone(true); }} />
      </div>
    );
  }

  // ─── DESKTOP: top nav + side-by-side master/detail ───
  if (isDesktop) {
    return (
      <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-body)", color: TEXT_PRIMARY, "--ca-accent": a, "--ca-accent-ink": a }} className="ca-root">
        <ThemeStyle theme={theme} />
        <ThemeChrome theme={theme} />
        <style>{CSS + accentCSS(a, config.accentDark)}</style>
        {GameLayer}
        <ThemeStickers theme={theme} />
        <ThemeTopper theme={theme} lines={tickerLines} seed={(seenAs || "").length + (config.code || "").length} />
        <div style={{ position: "sticky", top: 0, zIndex: 10 }}>
        {PreviewBar}
        {/* The same bar the dashboard and the repository wear — literally the
            same component, so the three cannot drift apart again. The theme's
            own trimmings ride in its right-hand slot. */}
        {/* No tabs. Andrew, 2026-09-20: "tabs go in the dropdown. same on
            phone i think." The five pages are in the class menu at the left,
            where the dashboard has had them since the day before. */}
        <TopNav config={config} tabs={[]} active={activeNav} onPick={go} role={view}
          brand={TheClass}
          right={
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Where the saving is, the way the dashboard bar says it, so a
                  write that is stuck says so on every page of the class. Once
                  something has been written from this page; a page that has
                  only read has nothing to report. */}
              {view === "instructor" ? <SaveWord saving={saveState} online={online} armed={wrote || !online || !!saveState?.trouble} /> : null}
              <ThemeIdentity theme={theme} points={myPoints} />
              <ThemeBadge theme={theme} points={myPoints} />
              {ShowPin}
              {MailButton}
            </span>
          } />
        </div>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: 20, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
          <div style={{ maxWidth: CARD_MAX * 2 + 12 }}>
            <StoryBar theme={theme} roster={roster} me={seenAs} />
            {LiveBanner}
            <NeedsYou items={actions} accent={a} onOpen={go} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {Grid}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              <ClassLeader theme={theme} roster={roster} log={data?.log} me={seenAs} />
              <TubeySays theme={theme} seed={(seenAs || "").length} />
              <ThemeSponsor theme={theme} />
              <ThemeLegal theme={theme} />
            </div>
          </div>
          <div style={{ ...cardStyle(theme, 2), padding: 24, minHeight: 400, position: "sticky", top: 80 }}>
            {openKey
              ? detailFor(openKey)
              : <div style={{ color: TEXT_MUTED, fontSize: 16, paddingTop: 40, textAlign: "center" }}>Open a card to see its full page here.</div>}
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE: single column, full-screen takeover ───
  //
  // The bottom tab bar is gone. Andrew, 2026-09-20: "tabs go in the dropdown.
  // same on phone i think." Snapchat's camera, which sat in the middle of that
  // bar, moved up beside the score, because it is the theme's furniture rather
  // than a way to another page.
  return (
    <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-body)", color: TEXT_PRIMARY, paddingBottom: 24, "--ca-accent": a, "--ca-accent-ink": a }} className="ca-root">
      <ThemeStyle theme={theme} />
        <ThemeChrome theme={theme} />
      <style>{CSS + accentCSS(a, config.accentDark)}</style>
      {GameLayer}

      <ThemeStickers theme={theme} />
      <ThemeTopper theme={theme} lines={tickerLines} seed={(seenAs || "").length + (config.code || "").length} />
      {/* compact top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10 }}>
      {PreviewBar}
      <div style={{ background: "var(--surface-card)", borderBottom: "1px solid " + BORDER }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          {/* The class is always here, because with the bottom bar gone this
              menu is the only way to another page. The way back sits beside
              it and says where back is. */}
          {openKey ? TheClassCompact : TheClass}
          {openKey ? (
            <button className="ca-focus" onClick={() => go(openSub ? openKey : IN_CLASS.has(openKey) ? "class" : null)}
              style={{ background: "none", border: "none", fontFamily: F, fontSize: 16, fontWeight: 600, color: a, cursor: "pointer", minHeight: TAP, display: "inline-flex", alignItems: "center", padding: 0, whiteSpace: "nowrap", minWidth: 0, overflow: "hidden" }}>
              {/* The place, not the word Back: with the PIN and the envelope
                  beside it, "Back to My Work" was cut to "Back t" on a phone. */}
              ← {openSub && openKey === "assignments" ? "My Work" : IN_CLASS.has(openKey) ? "Class" : "Back"}
            </button>
          ) : null}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
            <ThemeCamera theme={theme} />
            <ThemeBadge theme={theme} points={myPoints} />
            {ShowPin}
            {MailButton}
          </span>
        </div>
      </div>
      </div>


      {/* content: grid OR full-screen takeover */}
      <div style={{ padding: 16 }}>
        {openKey ? (
          <div style={{ ...cardStyle(theme, 2), padding: 20 }}>
            {detailFor(openKey)}
          </div>
        ) : (
          <>
            <StoryBar theme={theme} roster={roster} me={seenAs} />
            {LiveBanner}
            <NeedsYou items={actions} accent={a} onOpen={go} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Grid}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              <ClassLeader theme={theme} roster={roster} log={data?.log} me={seenAs} />
              <TubeySays theme={theme} seed={(seenAs || "").length} />
              <ThemeSponsor theme={theme} compact />
              <ThemeLegal theme={theme} />
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

    </div>
  );
}
