// ClassApp — the shared engine. It renders ANY class from a config object.
// Nothing here is COMM-999-specific; all class data comes from `config`.
// This is the new card-grid home (summary tiles on the left, full page on the
// right when you open one) plus a Student / Instructor view toggle.

import { useState, useEffect } from "react";
import { useClassData } from "./store.js";
import { YouSummary, YouDetail } from "./YouCard.jsx";
import { ScheduleSummary, ScheduleDetail } from "./ScheduleCard.jsx";
import { RosterSummary, RosterDetail } from "./RosterCard.jsx";
import { AssignmentsSummary, AssignmentsDetail } from "./AssignmentsCard.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#9ca3af";
const BORDER = "#eef0f2";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";

const NAV = ["Home", "Schedule", "Assignments", "Community", "More"];

// ─── small style helpers ───
// Following Apple HIG: body text ~15-17px, labels no smaller than 12px,
// interactive targets at least 44px tall, inputs >=16px (prevents iOS zoom).
const TAP = 44; // minimum tap target, px
const CARD_MAX = 380; // cards never grow wider than this (a phone-width card)
const card = {
  background: "#fff", borderRadius: 16, padding: 20,
  border: "1px solid " + BORDER, fontFamily: F, textAlign: "left",
  width: "100%", cursor: "pointer", display: "block",
};
const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };

// ─────────────────────────────────────────────────────────────
// Card summaries (left grid). Each returns { title, body } given config + role.
// ─────────────────────────────────────────────────────────────
function summary(key, config, role, ctx) {
  const a = config.accent;
  switch (key) {
    case "you":
      return { title: "You", body: <YouSummary config={config} role={role} data={ctx.data} asStudent={ctx.asStudent} /> };
    case "assignments":
      return { title: "Assignments", body: <AssignmentsSummary config={config} data={ctx.data} role={role} /> };
    case "schedule":
      return { title: "Schedule", body: <ScheduleSummary config={config} data={ctx.data} /> };
    case "community":
      return { title: "Community", body: <Muted>Nothing live right now.</Muted> };
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
  const a = config.accent;
  if (key === "you") {
    return <YouDetail config={config} role={role} data={ctx.data} update={ctx.update} asStudent={ctx.asStudent} setAsStudent={ctx.setAsStudent} />;
  }
  if (key === "assignments") {
    return <AssignmentsDetail config={config} role={role} data={ctx.data} update={ctx.update} asStudent={ctx.asStudent} />;
  }
  if (key === "schedule") {
    return <ScheduleDetail config={config} role={role} data={ctx.data} update={ctx.update} />;
  }
  if (key === "roster") {
    return <RosterDetail config={config} role={role} data={ctx.data} />;
  }
  if (key === "instructor") {
    const ins = config.instructor || {};
    return (
      <Panel title="Your Instructor">
        <div style={{ fontWeight: 700, fontSize: 18 }}>{ins.name}</div>
        <div style={{ marginTop: 6, color: TEXT_SECONDARY }}>{ins.bio}</div>
      </Panel>
    );
  }
  if (key === "community") return <Panel title="Community"><Muted>In-class games, discussion boards, and live activities will surface here when active.</Muted></Panel>;
  if (key === "leaderboard") return <Panel title="Leaderboard"><Muted>In-class game leaderboard.</Muted></Panel>;
  return <Panel title={key}><Muted>Coming soon.</Muted></Panel>;
}

// ─── tiny presentational helpers ───
const Muted = ({ children }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5 }}>{children}</div>;
const Row = ({ children }) => <div style={{ display: "flex", gap: 14, alignItems: "center" }}>{children}</div>;
const Avatar = ({ accent, big }) => (
  <div style={{ width: big ? 72 : 48, height: big ? 72 : 48, borderRadius: "50%", background: accent + "22", border: "2px solid " + accent + "55", flexShrink: 0 }} />
);
const Btn = ({ children, accent }) => (
  <span style={{ fontSize: 15, fontWeight: 600, padding: "0 18px", minHeight: TAP, display: "inline-flex", alignItems: "center", borderRadius: 999, cursor: "pointer",
    border: "1px solid " + (accent || BORDER_STRONG), background: accent || "#fff", color: accent ? "#fff" : TEXT_PRIMARY }}>{children}</span>
);
const Panel = ({ title, children }) => (
  <div>
    <div style={{ ...h2, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);

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

export default function ClassApp({ config }) {
  const [role, setRole] = useState("student"); // student | instructor
  const [open, setOpen] = useState(null); // card key open as detail / takeover
  const isDesktop = useIsDesktop();
  const a = config.accent;

  const [data, update] = useClassData(config.storageKey);
  const [asStudent, setAsStudent] = useState(config.testStudent || config.students?.[0]?.name || "");
  const ctx = { data: data || {}, update, asStudent, setAsStudent };

  // Push updated seed content (schedule + library) to the store when the seed
  // version changes, without touching threads/profiles or other live data.
  useEffect(() => {
    if (!data || !config.seedVersion) return;
    if (data.seedVersion !== config.seedVersion) {
      update(prev => ({ ...prev, schedule: config.scheduleWeeks, library: config.library, seedVersion: config.seedVersion }));
    }
  }, [data, config]);

  const enabledCards = Object.entries(config.cards || {})
    .filter(([, on]) => on)
    .map(([k]) => k);

  const RoleToggle = (
    <div style={{ display: "flex", gap: 4, background: BG, padding: 3, borderRadius: 999, border: "1px solid " + BORDER }}>
      {["student", "instructor"].map(r => (
        <span key={r} onClick={() => { setRole(r); setOpen(null); }}
          style={{ fontSize: 14, fontWeight: 600, padding: "0 16px", minHeight: 38, display: "inline-flex", alignItems: "center", borderRadius: 999, cursor: "pointer",
            background: role === r ? a : "transparent", color: role === r ? "#fff" : TEXT_SECONDARY, textTransform: "capitalize" }}>{r}</span>
      ))}
    </div>
  );

  const Logo = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: a, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {config.code.split(" ")[1]}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: a, textTransform: "uppercase", letterSpacing: "0.08em" }}>{config.code}</div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.1 }}>{config.name}</div>
      </div>
    </div>
  );

  const CardTile = (key) => {
    const s = summary(key, config, role, ctx);
    return (
      <button key={key} onClick={() => setOpen(key)}
        style={{ ...card, outline: open === key ? "2px solid " + a : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ ...label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{s.title}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: a, whiteSpace: "nowrap", flexShrink: 0 }}>open →</span>
        </div>
        {s.body}
      </button>
    );
  };

  // ─── DESKTOP: top nav + side-by-side master/detail ───
  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY }}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />
        <div style={{ background: "#fff", borderBottom: "1px solid " + BORDER, position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 20 }}>
            {Logo}
            <nav style={{ display: "flex", gap: 2, marginLeft: 8 }}>
              {NAV.map(n => (
                <span key={n} onClick={() => setOpen(null)} style={{ fontSize: 15, fontWeight: 500, color: TEXT_SECONDARY, padding: "0 12px", minHeight: TAP, display: "inline-flex", alignItems: "center", borderRadius: 8, cursor: "pointer" }}>{n}</span>
              ))}
            </nav>
            <div style={{ marginLeft: "auto" }}>{RoleToggle}</div>
          </div>
        </div>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: 20, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, maxWidth: CARD_MAX * 2 + 12 }}>
            {enabledCards.map(CardTile)}
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + BORDER, padding: 24, minHeight: 400, position: "sticky", top: 80 }}>
            {open
              ? detail(open, config, role, ctx)
              : <div style={{ color: TEXT_MUTED, fontSize: 16, paddingTop: 40, textAlign: "center" }}>Open a card to see its full page here.</div>}
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE: single column, full-screen takeover, bottom tab bar ───
  const BAR_H = 72;
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, paddingBottom: BAR_H + 12 }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />

      {/* compact top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid " + BORDER, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {open ? (
            <button onClick={() => setOpen(null)} style={{ background: "none", border: "none", fontFamily: F, fontSize: 17, fontWeight: 600, color: a, cursor: "pointer", minHeight: TAP, display: "inline-flex", alignItems: "center", padding: "0 4px 0 0" }}>← Back</button>
          ) : Logo}
          {RoleToggle}
        </div>
      </div>

      {/* content: grid OR full-screen takeover */}
      <div style={{ padding: 16 }}>
        {open ? (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid " + BORDER, padding: 20 }}>
            {detail(open, config, role, ctx)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {enabledCards.map(CardTile)}
          </div>
        )}
      </div>

      {/* bottom tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: BAR_H, background: "#fff", borderTop: "1px solid " + BORDER, display: "flex", zIndex: 20 }}>
        {NAV.map(n => (
          <button key={n} onClick={() => setOpen(null)}
            style={{ flex: 1, minHeight: TAP, background: "none", border: "none", fontFamily: F, fontSize: 12, fontWeight: 600, color: n === "Home" && !open ? a : TEXT_SECONDARY, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: n === "Home" && !open ? a : "transparent" }} />
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
