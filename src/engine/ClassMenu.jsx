// The class's name, and everything else the class holds behind it.
//
// Andrew, 2026-09-20: "My feeling is that maybe dashboard doesn't need
// schedule, challenges, class, more, or that could be a drop down from home?"
// So the dashboard's bar carries no tabs, and the name at its left end opens
// every page the tabs and the apps led to, then the room panels, then The
// Brief, Colour and type and the keyboard list, then the other classes.
//
// Then: "the way you changed the top menu to be a dropdown from the class
// name, let's do that for the students as well. get rid of the apps drop down
// in top right." A student's tabs stay across the bar, so a student's menu is
// the apps and nothing else: the same three doors the Apps button held, moved
// under the class name where his are. The right end of the bar is now free,
// which is where a message or a game will announce itself.
//
// Around the Horn is in neither: it opens over the page you are on and has a
// place of its own on the dashboard's bar.

import { useState, useRef } from "react";
import * as TOKENS from "./tokens.js";
import { appsFor } from "./apps.js";
import { ENGINE_LIST } from "../config/registry.js";

const F = TOKENS.FONT.body;
const MONO = TOKENS.FONT.label;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;

export function DropMenu({ trigger, label, width, children, side, fixed }) {
  const [open, setOpen] = useState(false);
  // Inside the top bar the tabs scroll sideways, and a panel hung off a tab
  // with position absolute is cut off at the row's edge. A fixed panel is
  // placed from the trigger's place on screen when it opens instead.
  const [at, setAt] = useState(null);
  const box = useRef(null);
  const toggle = () => {
    if (!open && fixed && box.current) {
      const r = box.current.getBoundingClientRect();
      setAt({ left: r.left, right: Math.max(0, window.innerWidth - r.right), top: r.bottom + 6 });
    }
    setOpen(v => !v);
  };
  const place = fixed && at
    ? { position: "fixed", top: at.top, ...(side === "left" ? { left: at.left } : { right: at.right }) }
    : { position: "absolute", top: "calc(100% + 6px)", ...(side === "left" ? { left: 0 } : { right: 0 }) };
  return (
    <span ref={box} style={{ position: "relative", flex: "none" }}>
      {trigger(open, toggle)}
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
          <div role="menu" aria-label={label} onClick={() => setOpen(false)}
            style={{ ...place, zIndex: 71, background: "var(--surface-card, #ffffff)",
              border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 6, width: width || 240,
              boxShadow: "0 18px 44px -14px rgba(23,19,16,.35)", display: "flex", flexDirection: "column", gap: 1 }}>
            {children}
          </div>
        </>
      ) : null}
    </span>
  );
}

export const menuRow = {
  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none",
  border: "none", cursor: "pointer", padding: "0 10px", minHeight: 40, borderRadius: 9,
  fontFamily: F, fontSize: 14.5, color: TEXT_PRIMARY, textDecoration: "none",
};

export function ClassMenu({ config, role = "instructor", onPick, onLook, panels, onPanel, onKeys }) {
  const student = role !== "instructor";
  const go = (href) => () => {
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  const rule = <div style={{ height: 1, background: BORDER, margin: "5px 8px" }} />;
  const row = { ...menuRow, minHeight: student ? TOKENS.TAP : 36, fontSize: student ? 16 : 15 };
  const pages = [["Home", ""], ["Schedule", "/schedule"], ["Challenges", "/challenges"], ["Class", "/class"], ["More page", "/more"]];
  // A student's apps open in place where they are cards of this page, the way
  // the Apps button opened them, so Games does not reload the site.
  const apps = appsFor(config, role).filter(app => app.opens !== "horn").map(app => app.card && onPick ? (
    <button key={app.id} role="menuitem" className="dash-focus ca-focus repo-focus" style={row}
      onClick={() => onPick(app.card)}>{app.label}</button>
  ) : (
    <a key={app.id} role="menuitem" className="dash-focus ca-focus repo-focus" href={app.href || config.path + "/" + app.card}
      aria-current={app.id === "dashboard" ? "page" : undefined}
      style={{ ...row, ...(app.id === "dashboard" ? { color: config.accent, fontWeight: 600 } : {}) }}>{app.label}</a>
  ));
  return (
    <DropMenu label={config.code} width={student ? 250 : 270} side="left" fixed
      trigger={(open, toggle) => (
        <button className="dash-focus ca-focus repo-focus" onClick={toggle} aria-expanded={open} aria-haspopup="menu"
          title={student ? "Everything else in this class" : "Every other page of this class"}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, minHeight: 44, padding: "0 8px 0 0", border: "none",
            background: "transparent", borderRadius: 8, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap", textAlign: "left" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: config.accent, color: "#fff",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            {(config.code || "").split(" ")[1]}
          </span>
          {/* On a student's bar the class says both its number and its name,
              which is what the logo said before the menu took its place. */}
          {student ? (
            <span style={{ display: "block" }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: config.accent,
                textTransform: "uppercase", letterSpacing: "0.08em" }}>{config.code}</span>
              <span style={{ display: "block", fontFamily: TOKENS.FONT.display, fontWeight: TOKENS.FONT.displayWeight,
                textShadow: TOKENS.FONT.displayShadow, fontSize: 16, lineHeight: 1.1, color: TEXT_PRIMARY }}>{config.name}</span>
            </span>
          ) : (
            <span style={{ fontSize: 17, fontWeight: 600, color: TEXT_PRIMARY }}>{config.code}</span>
          )}
          <span aria-hidden="true" style={{ fontSize: 13, color: TEXT_MUTED }}>▾</span>
        </button>
      )}>
      {student ? apps : (
        <>
          {pages.map(([name, to]) => <a key={name} className="dash-focus" href={config.path + to} style={row}>{name}</a>)}
          {rule}
          {apps}
          {(panels || []).length ? (
            <>
              {rule}
              {panels.map(p => (
                <button key={p.id} className="dash-focus" onClick={() => onPanel(p.id)} style={row}>
                  {p.label}
                  {p.n ? <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 13, color: TEXT_MUTED }}>{p.n}</span> : null}
                </button>
              ))}
            </>
          ) : null}
          {rule}
          <a className="dash-focus" href="/plan" style={row}>The Brief</a>
          {onLook ? <button className="dash-focus" onClick={onLook} style={row}>Colour and type</button> : null}
          {onKeys ? (
            <button className="dash-focus" onClick={onKeys} style={row}>
              Keyboard<kbd style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 13, color: TEXT_MUTED }}>⌘/</kbd>
            </button>
          ) : null}
          {ENGINE_LIST.filter(c => c.id !== config.id).length ? rule : null}
          {ENGINE_LIST.filter(c => c.id !== config.id).map(c => (
            <button key={c.id} className="dash-focus" onClick={go(c.path + "/dashboard")} style={row}>
              <span style={{ flex: "none", width: 8, height: 8, borderRadius: "50%", background: c.accent }} />
              <b style={{ fontWeight: 600 }}>{c.code}</b>
              <span style={{ minWidth: 0, color: TEXT_MUTED, fontSize: 13, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.desc}</span>
            </button>
          ))}
        </>
      )}
    </DropMenu>
  );
}
