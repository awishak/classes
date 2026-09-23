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
import { appsFor } from "./apps.js";
import HornApp, { openHorn } from "./HornApp.jsx";
import { hasSections, sectionsOf, useRoomSection } from "./sections.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const BORDER = TOKENS.LINE.soft;
const TAP = 44;

// The same tabs for everyone. Andrew, 2026-09-15: "you have to standardize for
// me and for students." The class's pages are the tabs; the apps are behind
// the Apps button at the right; More is the admin page in either view.
export const NAV_CLASS = [
  { id: "home", label: "Home", card: null },
  { id: "schedule", label: "Schedule", card: "schedule" },
  { id: "assignments", label: "Challenges", card: "assignments" },
  { id: "class", label: "Class", card: "class" },
  { id: "more", label: "More", card: "more" },
];
export const NAV_STUDENT = NAV_CLASS;
export const NAV_TEACH = NAV_CLASS;

// The address of a tab's page. On the class page a tab opens its card in
// place; everywhere else the tab is a link back to that page.
const segment = (card) => String(card).replace(/^assignments$/, "challenges");
export const tabHref = (config, n) =>
  n.href != null ? (n.absolute ? n.href : config.path + n.href) : null;
const linkOf = (config, n) => config.path + (n.card ? "/" + segment(n.card) : "");

// Which tab is lit, read off the address. Andrew, 2026-09-17: "can we have
// some consistency for how the top nav is highlighted?" Before this each
// surface said which tab it was, and most of them said nothing: Grade view,
// Ask, Run the game and Games lit no tab at all, and the dashboard stayed lit
// with Around the Horn up. The address already says where you are, so the
// bar reads it, the same way on every page. A surface can still pass
// `active` to say otherwise.
const CLASS_CARDS = new Set(["class", "you", "roster", "instructor", "messages", "syllabus"]);
export function activeFor(config, role, pathname, search = "") {
  if (!config) return "";
  const here = String(pathname || "").replace(/\/$/, "") + (search || "");
  // The apps with an address first, longest first. The Horn has none: it
  // opens over the page, so no page is the Horn.
  const apps = appsFor(config, role).filter(app => app.href).sort((x, y) => y.href.length - x.href.length);
  for (const app of apps) {
    const at = app.href.replace(/\/$/, "");
    if (here === at || here.startsWith(at + (at.includes("?") ? "" : "?"))) return app.id;
  }
  if (here.replace(/\?.*$/, "") === config.path + "/rungame") return "games";
  const rest = here.replace(/\?.*$/, "").replace(config.path, "").replace(/^\//, "");
  if (rest === "") return "home";
  const [head] = rest.split("/");
  if (head === "schedule") return "schedule";
  if (head === "challenges" || head === "assignments") return "assignments";
  if (head === "community" || CLASS_CARDS.has(head)) return "class";
  if (head === "more") return "more";
  return "";
}

const whereAmI = () => {
  try { return window.location; } catch { return null; }
};

// `brand` and `middle` are the dashboard's: there the class at the left end is
// a menu of every other page, and the middle of the bar is the day's own
// controls where the tabs and the apps sit everywhere else.
export default function TopNav({ config, tabs, active, onPick, right, accent, moreNode, role = "instructor", brand, middle }) {
  // The repository resolves its class from what it remembers, and on a machine
  // that has never opened one there is nothing to remember. A bar with no class
  // in it would be worse than no bar.
  if (!config) return null;
  const a = accent || config.accent;
  const loc = whereAmI();
  const lit = active || activeFor(config, role, loc?.pathname, loc?.search);
  // Which sitting is in the room, on every page rather than on the dashboard
  // alone. Andrew, 2026-09-20: "i still need to be able to change between comm
  // 3 classes. need a switcher at the top for things like around the horn."
  // The Horn board opens over whatever page he is on, so the choice has to
  // live where he always is.
  const [room, setRoom] = useRoomSection(config);

  // One row, always. Andrew, 2026-09-17: "making sure it doesn't wrap around
  // for two levels." The bar used to wrap when the tabs and the apps outran
  // the window; the tabs scroll sideways inside their row now, and the class
  // stays pinned at the left.
  const tabStyle = (on) => ({
    fontSize: 14, fontWeight: on ? 600 : 500, color: on ? a : TEXT_SECONDARY,
    padding: "0 10px", minHeight: TAP, display: "inline-flex", alignItems: "center",
    borderRadius: 8, cursor: "pointer", border: "none", fontFamily: F, flex: "none",
    background: on ? a + "12" : "transparent", textDecoration: "none", whiteSpace: "nowrap",
  });

  return (
    <div style={{ background: "var(--surface-card, #ffffff)", borderBottom: "1px solid " + BORDER }}>
      <div style={{ maxWidth: 1760, margin: "0 auto", padding: "10px 20px",
        display: "flex", alignItems: "center", gap: 14, flexWrap: "nowrap" }}>

        {/* The class, and a way home. Same block on all three. */}
        {brand ? <span style={{ flex: "none" }}>{brand}</span> : <a className="dash-focus ca-focus repo-focus" href={config.path}
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
            fontFamily: F, flex: "none" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: a, color: "#fff",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {(config.code || "").split(" ")[1]}
          </span>
          <span style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: a,
              textTransform: "uppercase", letterSpacing: "0.08em" }}>{config.code}</span>
            <span style={{ display: "block", fontFamily: TOKENS.FONT.display, fontWeight: TOKENS.FONT.displayWeight, textShadow: TOKENS.FONT.displayShadow, fontSize: 16, lineHeight: 1.1, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{config.name}</span>
          </span>
        </a>}

        {/* Andrew's apps are tabs in the bar rather than a menu: "students can
            have the apps thing up top, but i want all my apps in top nav bar."
            A student's apps are in the class menu at the left, because a
            student's bar would be a wall of doors otherwise. */}
        {middle ? (
          <div style={{ display: "flex", gap: 6, minWidth: 0, flex: "1 1 auto", flexWrap: "nowrap", alignItems: "center" }}>{middle}</div>
        ) : null}
        <nav aria-label="Teaching surfaces" style={{ display: middle ? "none" : "flex", gap: 2, minWidth: 0, flex: "1 1 auto", flexWrap: "nowrap", alignItems: "center", overflowX: "auto", scrollbarWidth: "none" }}>
          {(middle ? [] : tabs || []).map(n => {
            const on = lit === n.id;
            // "More" holds different things on different surfaces — the extra
            // cards on the class page, this surface's own extras elsewhere —
            // so the surface can hand its own control in. The bar keeps the
            // same four words in the same places either way.
            if (n.id === "more" && moreNode) return <span key="more" style={{ flex: "none" }}>{moreNode}</span>;
            const to = tabHref(config, n) ?? (onPick ? null : linkOf(config, n));
            return to !== null ? (
              <a key={n.id} className="dash-focus ca-focus repo-focus" href={to}
                aria-current={on ? "page" : undefined} style={tabStyle(on)}>{n.label}</a>
            ) : (
              <button key={n.id} className="dash-focus ca-focus repo-focus" onClick={() => onPick && onPick(n.card)}
                aria-current={on ? "page" : undefined} style={tabStyle(on)}>{n.label}</button>
            );
          })}
          {role === "instructor" && !middle ? (
            <>
              <span aria-hidden="true" style={{ width: 1, flex: "none", alignSelf: "stretch", margin: "6px 8px", background: BORDER }} />
              {appsFor(config, role).map(app => app.opens === "horn" ? (
                <button key={app.id} className="dash-focus ca-focus repo-focus" onClick={openHorn} style={tabStyle(false)}>{app.label}</button>
              ) : (
                <a key={app.id} className="dash-focus ca-focus repo-focus" href={app.href || config.path + "/" + app.card}
                  aria-current={lit === app.id ? "page" : undefined} style={tabStyle(lit === app.id)}>{app.label}</a>
              ))}
            </>
          ) : null}
        </nav>

        {/* The right end holds whatever the surface puts there and nothing
            else. The Apps button stood here until 2026-09-20, when the apps
            went under the class name for a student the way they already had
            for Andrew, and this end came free for a message or a game to
            announce itself. */}
        <span style={{ flex: "none", display: "flex", alignItems: "center", gap: 10 }}>
          {role === "instructor" && hasSections(config) ? (
            <span role="group" aria-label="The section in the room"
              style={{ display: "inline-flex", flex: "none", borderRadius: 999, border: "1px solid " + BORDER, overflow: "hidden" }}>
              {sectionsOf(config).map(sec => {
                const on = room === sec;
                return (
                  <button key={sec} className="dash-focus ca-focus repo-focus" onClick={() => setRoom(sec)}
                    aria-pressed={on} title={"The " + sec + " section is in the room"}
                    style={{ minHeight: 32, padding: "0 12px", border: "none", cursor: "pointer", fontFamily: F,
                      fontSize: 13, fontWeight: 600, background: on ? a : "transparent", color: on ? "#fff" : TEXT_SECONDARY }}>
                    {sec}
                  </button>
                );
              })}
            </span>
          ) : null}
          {right}
        </span>
      </div>
      {role === "instructor" ? <HornApp config={config} /> : null}
    </div>
  );
}
