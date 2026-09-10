// The top bar. One of them, the same on every surface.
//
// Before this the three surfaces each had their own: the class page had a logo
// and tabs, the dashboard had a class menu, a date, four tool buttons and a
// view menu, and the repository had two back-links and a page title. Three
// bars, three heights, three ideas of where the way out lives — and then a
// strip of doors added on top of two of them, which is a second bar admitting
// the first one was wrong.
//
// So: the class page's bar wins, and the other two wear it. The bar answers
// one question — WHERE AM I — and nothing else. A control that acts on the
// thing you are looking at is not navigation and does not belong here; the
// dashboard's date and its room tools sit with the day, which is what they
// act on.
//
// The tabs are the same four words in the same order everywhere, so the bar
// never moves under you when you cross between surfaces.

import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const BORDER = TOKENS.LINE.soft;
const TAP = 44;

// What a student sees, and what Andrew sees.
//
// A student's three are cards on the class page, because for a student those
// three ARE the class. Andrew's three are surfaces, because Schedule and
// Assignments are already cards in the grid he is looking at and a tab to each
// was the same door twice.
export const NAV_STUDENT = [
  { id: "home", label: "Home", card: null },
  { id: "schedule", label: "Schedule", card: "schedule" },
  { id: "assignments", label: "Assignments", card: "assignments" },
  { id: "community", label: "Community", card: "community" },
  { id: "more", label: "More", card: "more" },
];

export const NAV_TEACH = [
  { id: "home", label: "Home", href: "" },
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "repo", label: "Repository", href: "/repo", absolute: true },
  { id: "more", label: "More", card: "more" },
];

// Where a tab goes, or null when it opens a card on the page you are already
// on. `absolute` is the repository, which belongs to Andrew rather than to a
// class and so does not hang off the class path.
export const tabHref = (config, n) =>
  n.href == null ? null : (n.absolute ? n.href : config.path + n.href);

export default function TopNav({ config, tabs, active, onPick, right, accent, moreNode }) {
  // The repository resolves its class from what it remembers, and on a machine
  // that has never opened one there is nothing to remember. A bar with no class
  // in it would be worse than no bar.
  if (!config) return null;
  const a = accent || config.accent;

  const tabStyle = (on) => ({
    fontSize: 15, fontWeight: on ? 600 : 500, color: on ? a : TEXT_SECONDARY,
    padding: "0 12px", minHeight: TAP, display: "inline-flex", alignItems: "center",
    borderRadius: 8, cursor: "pointer", border: "none", fontFamily: F,
    background: on ? a + "12" : "transparent", textDecoration: "none", whiteSpace: "nowrap",
  });

  return (
    <div style={{ background: "var(--surface-card, #ffffff)", borderBottom: "1px solid " + BORDER }}>
      <div style={{ maxWidth: 1760, margin: "0 auto", padding: "10px 20px",
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>

        {/* The class, and a way home. Same block on all three. */}
        <a className="dash-focus ca-focus repo-focus" href={config.path}
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
            fontFamily: F, flex: "none" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: a, color: "#fff",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {(config.code || "").split(" ")[1]}
          </span>
          <span style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: a,
              textTransform: "uppercase", letterSpacing: "0.08em" }}>{config.code}</span>
            <span style={{ display: "block", fontFamily: TOKENS.FONT.display, fontWeight: TOKENS.FONT.displayWeight, textShadow: TOKENS.FONT.displayShadow, fontSize: 16, lineHeight: 1.1, color: TEXT_PRIMARY }}>{config.name}</span>
          </span>
        </a>

        <nav aria-label="Teaching surfaces" style={{ display: "flex", gap: 2, minWidth: 0, flexWrap: "wrap" }}>
          {(tabs || []).map(n => {
            const on = active === n.id;
            // "More" holds different things on different surfaces — the extra
            // cards on the class page, this surface's own extras elsewhere —
            // so the surface can hand its own control in. The bar keeps the
            // same four words in the same places either way.
            if (n.id === "more" && moreNode) return <span key="more">{moreNode}</span>;
            const to = tabHref(config, n);
            return to !== null ? (
              <a key={n.id} className="dash-focus ca-focus repo-focus" href={to}
                aria-current={on ? "page" : undefined} style={tabStyle(on)}>{n.label}</a>
            ) : (
              <button key={n.id} className="dash-focus ca-focus repo-focus" onClick={() => onPick && onPick(n.card)}
                aria-current={on ? "page" : undefined} style={tabStyle(on)}>{n.label}</button>
            );
          })}
        </nav>

        <span style={{ flex: "1 1 auto", minWidth: 8 }} />
        {right}
      </div>
    </div>
  );
}
