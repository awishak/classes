// The pieces every Primary Bold page is made of. Andrew's rule, from the mockups
// brief (docs/primary-bold/BRIEF.md): "Circles are people, blocks are
// challenges, pills are buttons." Change a piece here, never on one page, so
// nothing gets "Frankensteined" (his word).
//
// The class names are the mockup's own, under the .pbold root (style.js).

import { useEffect, useState } from "react";

/** A steady hue for a name, so a person with no photo is the same colour on every page. */
export const hueOf = (name) => { let h = 0; const n = String(name || ""); for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return h; };
export const firstOf = (name) => String(name || "").trim().split(/\s+/)[0] || "";
const initials = (name) => String(name || "").trim().split(/\s+/).map(w => w[0] || "").slice(0, 2).join("").toUpperCase();

/**
 * A person. `ring` is a colour name from the stylesheet (go, due, warn, bad,
 * none, cls): where the person stands. `size` is "sm", "" or "lg". `tick` is
 * a small badge, used for a grade. With `onClick` the face is a button.
 */
export function Face({ name, photo, size = "", ring = "", tick, sel, hollow, glow, onClick, label }) {
  const cls = ["face", size, sel ? "sel" : "", hollow ? "hollow" : "", glow ? "glow" : ""].filter(Boolean).join(" ");
  const style = { "--h": hueOf(name), ...(ring ? { "--w": `var(--${ring})` } : {}) };
  const inner = <>
    <span className="disc" style={photo ? { backgroundImage: `url("${photo}")`, backgroundSize: "cover", backgroundPosition: "center" } : null}>{photo ? "" : initials(name)}</span>
    {tick ? <span className="tick">{tick}</span> : null}
  </>;
  return onClick
    ? <button type="button" className={cls} style={style} onClick={onClick} aria-label={label || name} aria-pressed={sel ? true : undefined} title={name}>{inner}</button>
    : <span className={cls} style={style} title={name} role="img" aria-label={label || name}>{inner}</span>;
}

/** A face with the first name under it. `dim` fades the cell when another is picked. */
export function Cell({ name, shown, dim, on, ...face }) {
  return <span className={"cell" + (dim ? " dim" : "") + (on ? " on" : "")}><Face name={name} {...face} sel={on || face.sel} /><span className="t3">{shown || firstOf(name)}</span></span>;
}

/** A button. `kind` is "", "on", "go", "due", "flat", "flat on" or "done". With `href` it is a link. */
export function Pill({ kind = "", href, onClick, children, count, label, disabled }) {
  const cls = "pill" + (kind ? " " + kind : "");
  const inner = <>{children}{count ? <em>{count}</em> : null}</>;
  return href
    ? <a className={cls} href={href} aria-label={label}>{inner}</a>
    : <button type="button" className={cls} onClick={onClick} aria-label={label} disabled={disabled} aria-pressed={/\bon\b/.test(kind) ? true : undefined}>{inner}</button>;
}

/** The drawn check: "No emojis. Checks are drawn." */
export const Check = ({ size = 15, label = "Complete" }) => <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={label}><path d="M3 8.5l3.2 3.2L13 4.5" /></svg>;
export const Chevron = () => <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>;
export const Up = () => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10l5-5 5 5" /></svg>;

/** What a block or a tile carries: a drawn check for Complete, the letter otherwise. */
export const Mark = ({ mark }) => (mark === "ok" ? <Check /> : mark || null);

/**
 * A challenge as a square. `state` is done, todo, in, off or on (graded, to
 * do, turned in, not open yet, ongoing).
 */
export const Tile = ({ state, mark, size = "" }) => <span className={"tile s-" + state + (size ? " " + size : "")}><Mark mark={mark} /></span>;

/**
 * The quarter as one strip, each challenge as wide as its weight. `items` is
 * [{ id, title, weight, state, mark }]. A click picks one.
 */
export function Strip({ items, sel, touched, onPick }) {
  return <div className="strip">{items.map(d => {
    const x = Math.max(Number(d.weight) || 0, 0);
    return <button type="button" key={d.id} className={"blk s-" + d.state + (x < 15 ? " mid" : "") + (d.id === sel ? " sel" : touched ? " dim" : "")} style={{ "--x": x || 1 }} title={d.title} aria-label={d.title} aria-pressed={d.id === sel} onClick={() => onPick(d.id)}>{x >= 5 ? <Mark mark={d.mark} /> : null}</button>;
  })}</div>;
}
export const StripKey = () => <div className="key t3">
  <span><i className="dot sq s-done" />Graded</span><span><i className="dot sq s-todo" />To do</span><span><i className="dot sq s-in" />Turned in</span><span><i className="dot sq s-off" />Not open yet</span>
</div>;

/** A word that lands on the page when something is done: Sent, Set, Released. */
export const Stamp = ({ children }) => <span className="stamp" role="status">{children}</span>;

/** One solid bar: "Bars are one solid full bar, with no gaps or outlined pieces." `parts` is [{ n, color }]. */
export function Total({ parts, label }) {
  return <div className="total" role="img" aria-label={label}>{parts.filter(p => p.n > 0).map((p, i) => <i key={i} style={{ flex: p.n, background: p.color ? `var(--${p.color})` : "none" }} />)}</div>;
}

/** Turned in, due, graded: three points on a line. Each is { label, day, time, on }. */
export function Timeline({ points }) {
  const reached = points.filter(p => p.on).length;
  const p = reached >= 3 ? 66.6 : reached === 2 ? 33.3 : 0;
  return <div className="tl" style={{ "--p": p + "%" }}>{points.map(pt => <span key={pt.label} className={pt.on ? "" : "no"}>{pt.label}<small className="t3">{pt.day || ""}</small>{pt.time ? <small className="t3">{pt.time}</small> : null}</span>)}</div>;
}

/**
 * The ground a person picked, kept on this device: Skylight, Night or Light.
 * Skylight is the one he settled on, so it is where everyone starts.
 */
export const GROUNDS = [["sky", "Skylight"], ["night", "Night"], ["lite", "Light"]];
const KEY = "primary-bold-ground";
export function useGround() {
  const [g, setG] = useState(() => { try { const v = localStorage.getItem(KEY); return GROUNDS.some(x => x[0] === v) ? v : "sky"; } catch { return "sky"; } });
  useEffect(() => { try { localStorage.setItem(KEY, g); } catch { /* a private window keeps the pick for the visit */ } }, [g]);
  return [g, setG];
}
