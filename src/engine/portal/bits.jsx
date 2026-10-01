// The small pieces every portal page is made of: the row, its date column,
// the buttons, the section heading, the icons, the faces. See style.js for
// what each one means.

import { Avatar, profileOf } from "../Face.jsx";
import { nameShown } from "../roster.js";

export const esc = (s) => String(s == null ? "" : s);

// ─── icons, drawn rather than taken from an emoji font ───
const svg = (body, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{body}</svg>
);
export const I = {
  check: (size = 16) => <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3 3 7-7" /></svg>,
  pin: (size) => svg(<path d="M12 17v5M5 17h14l-2-5V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6z" />, size),
  mail: (size) => svg(<><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 8l9 6 9-6" /></>, size),
  search: (size) => svg(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>, size),
  cal: (size) => svg(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>, size),
  work: (size) => svg(<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12l3 3 5-6" /></>, size),
  people: (size) => svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.5a5 5 0 0 1 6 5" /></>, size),
  thumb: (size) => svg(<path d="M7 11v10H3V11zM7 11l4-8a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 7a2 2 0 0 1-2 1.7H7" />, size),
  out: (size = 14) => svg(<path d="M7 17L17 7M9 7h8v8" />, size),
  chat: (size) => svg(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />, size),
  clock: (size) => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, size),
  x: (size) => svg(<path d="M6 6l12 12M18 6L6 18" />, size),
};

// ─── words ───
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dateOf = (s) => { const d = s ? new Date(s + ", 2026") : null; return d && !isNaN(d) ? d : null; };
// "Sun Oct 4, 11:59 PM" from a challenge's own words.
export const dueWords = (due, time) => {
  const d = dateOf(due);
  if (!d) return due || "";
  return WEEKDAY[d.getDay()] + " " + due + (time ? ", " + time : "");
};
export const whenWords = (ts) => { try { return new Date(ts).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
export const timeWords = (ts) => { try { return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); } catch { return ""; } };
export const dayWords = (ts) => { const d = new Date(ts); return { name: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()], date: MONTHS[d.getMonth()] + " " + d.getDate(), key: d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() }; };
export const dcolOf = (s) => { const d = dateOf(s); return d ? [WEEKDAY[d.getDay()], String(d.getDate())] : ["", ""]; };
export const initials = (n) => String(n || "").split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join("").toUpperCase();
export const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url || ""; } };
const LINK = /(https?:\/\/[^\s]+)/g;
export const firstLink = (text) => (String(text || "").match(LINK) || [])[0] || "";

// ─── pieces ───
export const Sec = ({ name, sub, right }) => (
  <div className="pt-sechead">
    <h2 className="pt-sec"><span className="pt-secName">{name}</span>{sub != null && sub !== "" ? <span className="pt-secSub">{sub}</span> : null}</h2>
    {right || null}
  </div>
);
export const Dcol = ({ d }) => <div className="pt-dcol"><span className="pt-dw">{d[0]}</span><span className="pt-dn">{d[1]}</span></div>;
export const Gm = ({ children }) => <span className="pt-gm">{children}</span>;
export const Io = ({ kind = "", onClick, href, children, label, disabled, className = "" }) => href
  ? <a className={"pt-io pt-focus " + kind + " " + className} href={href} target={/^https?:/.test(href) ? "_blank" : undefined} rel="noreferrer" aria-label={label}>{children}</a>
  : <button type="button" className={"pt-io pt-focus " + kind + " " + className} onClick={onClick} aria-label={label} disabled={disabled}>{children}</button>;
export const Btn = ({ kind = "", onClick, href, children, disabled, label, type = "button" }) => href
  ? <a className={"pt-btn pt-focus " + kind} href={href} target={/^https?:/.test(href) ? "_blank" : undefined} rel="noreferrer" aria-label={label}>{children}</a>
  : <button type={type} className={"pt-btn pt-focus " + kind} onClick={onClick} disabled={disabled} aria-label={label}>{children}</button>;
export const Chip = ({ on, kind = "", onClick, href, children, label }) => href
  ? <a className={"pt-chip pt-focus " + (on ? "on" : kind)} href={href} aria-label={label}>{children}</a>
  : <button type="button" className={"pt-chip pt-focus " + (on ? "on" : kind)} onClick={onClick} aria-pressed={on} aria-label={label}>{children}</button>;
export const Lnk = ({ href, children }) => (
  <a className="pt-lnk pt-focus" href={href || "#"} target={href && /^https?:/.test(href) ? "_blank" : undefined} rel="noreferrer"><span>{children}</span>{I.out()}</a>
);
export const Check = () => <span className="pt-io ok" aria-hidden="true">{I.check()}</span>;

// A face, from the profile where there is one, the roster's name otherwise.
export const Face = ({ config, data, name, size = 36 }) => (
  <span style={{ display: "inline-flex", flex: "none" }}>
    <Avatar profile={profileOf(data, name)} name={nameShown(data, name)} accent={config.accent} size={size} ring={false} />
  </span>
);
// Dr. Ishak's face, off his card, or his initials.
export const DrFace = ({ config, size = 36 }) => {
  const photo = config.instructor?.photo || "";
  const name = config.instructor?.name || "Instructor";
  return photo
    ? <img className="pt-face" alt="" src={photo} style={{ width: size, height: size }} />
    : <span className="pt-badge" style={{ width: size, height: size, fontSize: Math.round(size * .36) }}>{initials(name)}</span>;
};
export const Badge = ({ text, size = 44 }) => <span className="pt-badge" style={{ width: size, height: size, fontSize: Math.round(size * .34) }}>{text}</span>;

// One row. `who` is dr, me, or class; a row from Dr. Ishak, and one the app
// speaks for him (a challenge, a grade), sits on his side with the button
// just inside his face.
export function Row({ tint = "", who, d, ring, onOpen, side, children, className = "" }) {
  const right = who && who !== "me";
  const col = d ? <Dcol d={d} /> : null;
  const main = onOpen
    ? <button type="button" className="pt-main pt-focus" onClick={onOpen}>{children}</button>
    : <div className="pt-main">{children}</div>;
  const rail = side ? <div className="pt-side">{side}</div> : null;
  return (
    <div className={"pt-row " + tint + (ring ? " ring" : "") + (right ? " right" : "") + " " + className}>
      {col}
      {right ? rail : null}
      {main}
      {right ? null : rail}
    </div>
  );
}

// The short name a student reads for him.
export const drShort = (config) => {
  const n = String(config.instructor?.name || "").trim();
  if (!n) return "your instructor";
  const last = n.split(/\s+/).pop();
  return "Dr. " + last;
};
