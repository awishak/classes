// Grades, one portal for every grading surface: /grades.
//
// Andrew, 2026-11-03: "for each class i have grading, grade view, and
// grades. can you please make one portal for me for grades." Three tabs, his
// names: To Grade, the queue across every class oldest due first
// (GradingPage.jsx); Grade Flow, one assignment as a pile sorted into
// columns (GradeView.jsx); Summary, every student's every grade as a grid
// (portal/GradesGrid.jsx). The class is picked once, as chips, and carries
// across Grade Flow and Summary; To Grade is always every class. A row in To
// Grade opens Grade Flow on that assignment without leaving the page.
//
// Addresses that can be sent: /grades is the queue,
// /grades/<class>/flow?a=<assignment> one pile, /grades/<class>/summary one
// grid. The three old addresses (/grading, /<class>/grade, /<class>/grades)
// redirect here from App.jsx.

import { useEffect, useMemo, useRef, useState } from "react";
import { currentClasses } from "../config/registry.js";
import { ToGrade } from "./GradingPage.jsx";
import GradeView from "./GradeView.jsx";
import GradesGrid from "./portal/GradesGrid.jsx";
import { PORTAL_CSS } from "./portal/style.js";
import { baseCSS } from "./themes.js";
import { ThemeStyle } from "./ThemeShell.jsx";
import TopNav, { NAV_TEACH } from "./TopNav.jsx";
import { lastClass } from "./InstructorNav.jsx";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TABS = [["todo", "To Grade"], ["flow", "Grade Flow"], ["summary", "Summary"]];
const REMEMBER = "grades-class";

/** The tab and class in an address. */
export const parseGrades = (pathname) => {
  const m = String(pathname || "").match(/^\/grades(?:\/(comm\w+)\/(flow|summary))?\/?$/);
  return m ? { classId: m[1] || "", tab: m[2] || "todo" } : { classId: "", tab: "todo" };
};
export const gradesHref = (tab, classId, search = "") => tab === "todo" ? "/grades" : "/grades/" + classId + "/" + tab + search;

const recall = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const here = () => { try { return window.location; } catch { return null; } };

export default function GradesPortal() {
  // The running classes; the demo class (config.demo names a student) is nobody's to grade.
  const classes = useMemo(() => currentClasses().filter(c => !c.demo), []);
  const first = classes[0]?.id || "";
  const [at, setAt] = useState(() => {
    const p = parseGrades(here()?.pathname);
    const known = classes.some(c => c.id === p.classId) ? p.classId : "";
    const kept = classes.some(c => c.id === recall(REMEMBER)) ? recall(REMEMBER) : "";
    return { tab: p.tab, classId: known || kept || first };
  });
  const cls = classes.find(c => c.id === at.classId) || classes[0] || null;
  const barRef = useRef(null);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => { document.title = "Grades"; }, []);
  useEffect(() => { if (at.classId) remember(REMEMBER, at.classId); }, [at.classId]);
  // The bar's height, so Grade Flow's own sticky header sits under it.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return undefined;
    const measure = () => setBarHeight(Math.round(el.getBoundingClientRect().height));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  // The back button walks the tabs.
  useEffect(() => {
    const onPop = () => { const p = parseGrades(here()?.pathname); setAt(prev => ({ tab: p.tab, classId: classes.some(c => c.id === p.classId) ? p.classId : prev.classId })); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [classes]);

  // The address is written before the view mounts, since Grade Flow reads
  // its assignment off the address when it opens.
  const go = (tab, classId = at.classId, search = "") => {
    const href = gradesHref(tab, classId, search);
    try { window.history.pushState({}, "", href); } catch { /* a render with no window */ }
    try { window.scrollTo({ top: 0 }); } catch { /* server */ }
    setAt({ tab, classId });
  };

  const wide = at.tab !== "todo";
  return (
    <div data-theme="clean" data-mode="day" className="ca-root pt-root" style={{ minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", fontFamily: F, "--ca-accent": cls?.accent || "var(--text-primary)", "--ca-accent-ink": cls?.accent || "var(--text-primary)" }}>
      <ThemeStyle theme="clean" />
      <style>{baseCSS() + PORTAL_CSS + CSS}</style>
      <div ref={barRef} style={{ position: "sticky", top: 0, zIndex: 10 }}>
        <TopNav config={lastClass()} tabs={NAV_TEACH} active="grades" />
      </div>
      <div className={"gp" + (wide ? " wide" : "")}>
        <div className="gp-head">
          <h1 className="gp-h1">Grades</h1>
          <nav className="gp-tabs" aria-label="Grades">
            {TABS.map(([id, say]) => (
              <a key={id} className={"gp-tab pt-focus" + (at.tab === id ? " on" : "")} href={gradesHref(id, at.classId)} aria-current={at.tab === id ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); go(id); }}>{say}</a>
            ))}
          </nav>
          {wide ? (
            <div className="pt-chips gp-classes">
              {classes.map(c => <button key={c.id} type="button" className={"pt-chip pt-focus" + (at.classId === c.id ? " on" : "")} style={at.classId === c.id ? { background: c.accent } : undefined} onClick={() => go(at.tab, c.id)}>{c.code}</button>)}
            </div>
          ) : null}
        </div>
        {at.tab === "todo" ? <ToGrade classes={classes} onOpen={(classId, aid) => go("flow", classId, "?a=" + encodeURIComponent(aid))} />
          : !cls ? null
          : at.tab === "flow" ? <GradeView key={cls.id} config={cls} embedded stickyTop={barHeight} />
          : <GradesGrid key={cls.id} config={cls} embedded />}
      </div>
    </div>
  );
}

const CSS = `
.gp{max-width:820px;margin:0 auto;padding:28px 16px 96px;display:flex;flex-direction:column;gap:18px}
.gp.wide{max-width:1600px;padding-left:0;padding-right:0}
.gp.wide .gp-head{padding:0 20px}
.gp-head{display:flex;align-items:baseline;gap:18px 28px;flex-wrap:wrap}
.gp-h1{margin:0;font-family:var(--pt-serif);font-size:34px;font-weight:600;letter-spacing:-.01em;line-height:1.1}
.gp-tabs{display:flex;gap:22px;align-items:baseline}
.gp-tab{font-size:18px;font-weight:600;color:var(--text-secondary);text-decoration:none;padding:4px 0 6px;border-bottom:2px solid transparent}
.gp-tab.on{color:var(--text-primary);border-bottom-color:var(--text-primary)}
.gp-classes{margin-left:auto}
.gp-classes .pt-chip.on{color:#fff}
@media (max-width:640px){.gp-classes{margin-left:0}.gp-tab{font-size:16px}}
`;
