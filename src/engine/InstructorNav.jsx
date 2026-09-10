// The three doors, in the same place on every one of them.
//
// The class page, the dashboard and the repository are the three surfaces I
// move between while planning a session, and before this each one knew about
// some of the others in a shape of its own: the class page had a filled pill to
// the dashboard and no way to the repository at all; the dashboard had the
// repository twice, once on the bar and once in a menu, and the class page
// buried under "This class"; the repository had a back-link to the dashboard
// that only appeared if I had arrived from one, and nothing to the class page.
// Two of the nine ways across were simply missing, and the six that existed
// were three different shapes.
//
// So: one strip, the same three words in the same order in the same position,
// mounted at the top of all three. Where I am is marked rather than linked,
// because a link to the page I am on is a dead control.
//
// What is NOT here: the room screen, Ask, the game, the grade view. Those are
// things I open when class is starting, not places I move between while
// planning, and they stay in each surface's own menu.

import { useEffect } from "react";
import { ENGINE, currentClasses } from "../config/registry.js";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.strong;

// ─── which class the repository is looking at ───
//
// The repository is one page across every class, so the first two doors need a
// class to point at. The class page and the dashboard both know which class
// they are, and the strip is on both, so mounting the strip is what records it.
// The repository then reads it back.
//
// This replaces the old `repo-from` in sessionStorage, which held a dashboard
// URL rather than a class, was written only when I arrived from a dashboard,
// and so left the repository with nothing to link to whenever I opened it cold.
const LAST = "engine-last-class";

export function rememberClass(id) {
  try { if (id) localStorage.setItem(LAST, id); } catch { /* private mode */ }
}

export function lastClass() {
  let id = "";
  try { id = localStorage.getItem(LAST) || ""; } catch { /* private mode */ }
  return ENGINE[id] || currentClasses()[0] || null;
}

// ─── the strip ───
//
// `here` is the surface it is sitting on, and that surface's own entry is drawn
// flat and carries aria-current instead of an href.
//
// Two sizes, and the reason is the design doc's: 44 anywhere a finger lands,
// which is the class page because students are on phones there, and 34 on the
// dashboard and the repository, which are a trackpad under my hands where
// density is the point.
export default function InstructorNav({ config, here, focusClass = "" }) {
  const cls = config || lastClass();
  useEffect(() => { if (config?.id) rememberClass(config.id); }, [config?.id]);
  if (!cls) return null;

  const accent = cls.accent || TOKENS.TEXT.primary;
  const roomy = here === "class";
  const h = roomy ? 44 : 34;

  const doors = [
    { id: "class", label: "Class page", href: cls.path },
    { id: "dashboard", label: "Dashboard", href: cls.path + "/dashboard" },
    { id: "repo", label: "Repository", href: "/repo" },
  ];

  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    minHeight: h, padding: roomy ? "0 18px" : "0 14px", borderRadius: 999,
    fontFamily: F, fontSize: 15, fontWeight: 600, textDecoration: "none",
    whiteSpace: "nowrap",
  };

  return (
    <nav aria-label="Teaching surfaces"
      style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
      {/* The class code, on the repository only. The class page and the
          dashboard both name the class a few pixels away already; the
          repository is the one surface where nothing else says which class
          those first two doors lead to. */}
      {here === "repo" ? (
        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: accent, marginRight: 2 }}>
          {cls.code}
        </span>
      ) : null}

      {doors.map(d => (d.id === here ? (
        <span key={d.id} aria-current="page"
          style={{ ...base, background: accent, color: "#fff" }}>
          {d.label}
        </span>
      ) : (
        <a key={d.id} className={focusClass} href={d.href}
          style={{ ...base, background: "transparent", color: TEXT_SECONDARY, border: "1px solid " + BORDER }}>
          {d.label}
        </a>
      )))}
    </nav>
  );
}

// The row the strip sits in, so the three surfaces put it in the same place
// rather than each inventing a container. Its own hairline underneath, because
// the strip is not part of the header below it.
export function InstructorNavRow({ config, here, focusClass }) {
  return (
    <div style={{ background: TOKENS.SURFACE.card, borderBottom: "1px solid " + TOKENS.LINE.soft,
      padding: here === "class" ? "8px 20px" : "6px 20px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
        <InstructorNav config={config} here={here} focusClass={focusClass} />
        {here !== "repo" && config?.desc ? (
          <span style={{ fontFamily: F, fontSize: 15, color: TEXT_MUTED, minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{config.desc}</span>
        ) : null}
      </div>
    </div>
  );
}
