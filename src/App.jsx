import { useState, useEffect } from "react";
import Comm118 from "./Comm118.jsx";
import Comm4 from "./Comm4.jsx";
import Comm2 from "./Comm2.jsx";
import { TriviaPresenter as TriviaPresenter4 } from "./GameSystem4.jsx";
import { TriviaPresenter as TriviaPresenter118 } from "./GameSystem.jsx";
import ClassApp from "./engine/ClassApp.jsx";
import Dashboard from "./engine/Dashboard.jsx";
import ClassroomView from "./engine/ClassroomView.jsx";
import BoardPage from "./engine/BoardPage.jsx";
import GamePage, { RunGamePage } from "./engine/GamePage.jsx";
import { TriviaPresenter as EnginePresenter } from "./engine/GameSystem.jsx";
import RepoPage from "./engine/RepoPage.jsx";
import RepoIdeas from "./engine/RepoIdeas.jsx";
import AskPage from "./engine/AskPage.jsx";
import PlanPage from "./PlanPage.jsx";
import { ENGINE, currentClasses, archivedClasses } from "./config/registry.js";
import InstructorLinks from "./InstructorLinks.jsx";
import InstructorGate from "./InstructorGate.jsx";

// Classes that run on the shared engine live in config/registry.js, because the
// Dashboard's class picker needs the same list and cannot import this file.

// Classes whose public hub is still the old forked file. Everything else on the
// engine gets its card pages as real URLs: /comm999/assignments is a link you
// can send a student.
// Every class is on the engine. The old forked hubs keep an address at
// /<class>/legacy, because they hold a term of grading and game data.
const LEGACY_HUBS = new Set();

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";

const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#646b75"; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = "#f3f4f6";
const BORDER_STRONG = "#e5e7eb";

const TAP_L = 44;
const sectionLabel = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: F };

// The front page reads the registry, so a class appears by existing rather than
// by being typed out here a second time. Current classes get the page; the rest
// live behind Archives. The teaching links at the bottom are gated to me.
function ClassCard({ c, navigate, dim }) {
  const codeShort = c.code.split(" ")[1];
  return (
    <button onClick={() => navigate(c.path)}
      style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: "1px solid " + BORDER_STRONG,
        cursor: "pointer", fontFamily: F, width: "100%", textAlign: "left", opacity: dim ? 0.72 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>{codeShort}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{c.code}</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.25, letterSpacing: "-0.01em" }}>{c.name}</div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 3 }}>{c.desc}</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 8,
          border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_PRIMARY, flexShrink: 0 }}>Open</span>
      </div>
    </button>
  );
}

const shell = { minHeight: "100vh", background: "#fafaf9", fontFamily: F };
const column = { maxWidth: 560, margin: "0 auto", padding: "60px 20px 60px" };
const fonts = <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />;

const navigate = (path) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

function LandingPage() {
  const current = currentClasses();
  const archived = archivedClasses();

  return (
    <div style={shell}>
      {fonts}
      <div style={column}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Santa Clara University</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Andrew Ishak</div>
          <div style={{ fontSize: 15, color: TEXT_SECONDARY, marginTop: 4 }}>Department of Communication</div>
        </div>

        <div style={{ ...sectionLabel, marginBottom: 10 }}>Classes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {current.map(c => <ClassCard key={c.id} c={c} navigate={navigate} />)}
          {!current.length ? <div style={{ fontSize: 15, color: TEXT_MUTED }}>No classes running right now.</div> : null}
        </div>

        {archived.length ? (
          <button onClick={() => navigate("/archive")}
            style={{ marginTop: 14, width: "100%", minHeight: TAP_L, background: "none", border: "1px solid " + BORDER_STRONG,
              borderRadius: 14, cursor: "pointer", fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Archived classes <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>({archived.length})</span> →
          </button>
        ) : null}

        <InstructorLinks />

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: TEXT_MUTED }}>
          aishak@scu.edu
        </div>
      </div>
    </div>
  );
}

function ArchivePage() {
  const archived = archivedClasses();
  return (
    <div style={shell}>
      {fonts}
      <div style={column}>
        <button onClick={() => navigate("/")}
          style={{ background: "none", border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, color: TEXT_SECONDARY,
            cursor: "pointer", minHeight: TAP_L, padding: 0, marginBottom: 8 }}>← Andrew Ishak</button>
        <div style={{ fontSize: 28, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em", marginBottom: 4 }}>Archived classes</div>
        <div style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 22 }}>Terms that have finished, and the template every class is built from.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {archived.map(c => <ClassCard key={c.id} c={c} navigate={navigate} dim />)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("presenter")) { document.title = "Trivia Presenter"; return; }
    if (path === "/comm118" || path === "/comm118/") document.title = "COMM 118 Hub - Spring 2026";
    else if (path === "/comm4" || path === "/comm4/") document.title = "COMM 4 Hub - Spring 2026";
    else if (path === "/comm2" || path === "/comm2/") document.title = "COMM 2 Hub - Spring 2026";
    else document.title = "Ishak Classes";
  }, [path]);

  // Presenter mode: stripped projector view, opened in a separate window.
  // URL: /<class>?presenter=<gameId>&class=comm118|comm4
  const params = new URLSearchParams(window.location.search);
  const presenterGameId = params.get("presenter");
  const presenterClass = params.get("class");
  if (presenterGameId && presenterClass) {
    if (presenterClass === "comm118") return <TriviaPresenter118 gameId={presenterGameId} classKey="comm118" />;
    return <TriviaPresenter4 gameId={presenterGameId} classKey="comm4" />;
  }
  // The engine's presenter. Its own parameter name, because `presenter` still
  // belongs to the frozen forks and the two read different stores under the
  // same class id.
  const engineGameId = params.get("game");
  if (engineGameId && presenterClass && ENGINE[presenterClass]) {
    return <EnginePresenter gameId={engineGameId} classKey={presenterClass} />;
  }

  if (path === "/plan" || path === "/plan/") {
    return <PlanPage />;
  }

  if (path === "/archive" || path === "/archive/") {
    return <ArchivePage />;
  }

  // The backlog for the repository, behind the same gate as the repository.
  if (path === "/repo/ideas" || path === "/repo/ideas/") {
    return (
      <InstructorGate what="Ideas for the repository">
        <RepoIdeas />
      </InstructorGate>
    );
  }

  // Everything I have, across every class, behind the same gate as a dashboard.
  if (path === "/repo" || path === "/repo/") {
    return (
      <InstructorGate what="Repository">
        <RepoPage />
      </InstructorGate>
    );
  }

  // Live teaching surfaces: /<class>/dashboard (me), /<class>/today (the room
  // screen), /<class>/ask (where the room screen's QR sends students).
  const live = path.match(/^\/(comm\w+)\/(dashboard|today|ask|board|game|rungame)\/?$/);
  if (live && ENGINE[live[1]]) {
    const cfg = ENGINE[live[1]];
    if (live[2] === "dashboard") {
      return (
        <InstructorGate what={cfg.code + " Dashboard"}>
          <Dashboard key={cfg.id} config={cfg} />
        </InstructorGate>
      );
    }
    if (live[2] === "rungame") {
      return (
        <InstructorGate what={cfg.code + " game"}>
          <RunGamePage key={cfg.id} config={cfg} />
        </InstructorGate>
      );
    }
    if (live[2] === "today") return <ClassroomView key={cfg.id} config={cfg} />;
    if (live[2] === "board") return <BoardPage key={cfg.id} config={cfg} />;
    if (live[2] === "game") return <GamePage key={cfg.id} config={cfg} />;
    return <AskPage key={cfg.id} config={cfg} />;
  }

  // The old forked hubs. COMM 2 and COMM 4 handed their public URL to the
  // engine, and these still hold a term of grading and game data, so they keep
  // an address rather than falling out of the app.
  const LEGACY_PAGE = { comm2: Comm2, comm4: Comm4, comm118: Comm118 };
  const legacy = path.match(/^\/(comm\w+)\/legacy\/?$/);
  if (legacy && LEGACY_PAGE[legacy[1]]) {
    const Page = LEGACY_PAGE[legacy[1]];
    return <Page />;
  }

  const site = path.match(/^\/(comm\w+)(?:\/([a-z]+))?\/?$/);
  if (site && ENGINE[site[1]] && !LEGACY_HUBS.has(site[1])) {
    return <ClassApp key={site[1]} config={ENGINE[site[1]]} initialCard={site[2] || null} />;
  }

  return <LandingPage />;
}
