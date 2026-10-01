// Class: the student's own card first, with Edit profile on it, then Dr.
// Ishak, then the classmates in their own section, two across, with the
// faces big. A student never sees the other section.
//
// Edit profile opens the welcome deck's form as a sheet. See more on Dr.
// Ishak opens his card as a sheet: photo, title, motto, office hours, the
// ways to reach him.

import { useState, useEffect } from "react";
import { classmatesOf } from "../RosterCard.jsx";
import { profileOf } from "../Face.jsx";
import { nameShown } from "../roster.js";
import { ProfileForm } from "../YouCard.jsx";
import { schedulingLinkOf } from "../../instructors.js";
import { Sec, Row, Io, Btn, Face, DrFace, I, drShort } from "./bits.jsx";

export function Sheet({ label, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="pt-scrim" onClick={onClose}>
      <div className="pt-sheet pt-root" role="dialog" aria-label={label} onClick={e => e.stopPropagation()}>
        <div className="pt-handle" />
        {children}
      </div>
    </div>
  );
}

// Dr. Ishak's row, with Message, Make a meeting and See more under the words.
export function DrRow({ config, go, onMore }) {
  const ins = config.instructor || {};
  const link = schedulingLinkOf(config);
  return (
    <Row tint="dr" who="dr">
      <p className="pt-title"><span className="pt-kind">Your instructor</span> {ins.name}</p>
      {ins.title ? <p className="pt-when">{ins.title}</p> : null}
      {ins.officeHours ? <p className="pt-meta">Office hours {ins.officeHours}</p> : null}
      <div className="pt-acts">
        <Io kind="go" onClick={() => go("messages")}>Message</Io>
        {link ? <Io href={link}>Make a meeting</Io> : null}
        <Io onClick={onMore}>See more</Io>
      </div>
    </Row>
  );
}
// The row's face sits in the dcol; DrRow draws it itself.
export function DrCard({ config, go, onMore }) {
  const ins = config.instructor || {};
  const link = schedulingLinkOf(config);
  return (
    <div className="pt-row dr">
      <div className="pt-dcol"><DrFace config={config} /></div>
      <div className="pt-main">
        <p className="pt-title"><span className="pt-kind">Your instructor</span> {ins.name}</p>
        {ins.title ? <p className="pt-when">{ins.title}</p> : null}
        {ins.officeHours ? <p className="pt-meta">Office hours {ins.officeHours}</p> : null}
        <div className="pt-acts">
          <Io kind="go" onClick={() => go("messages")}>Message</Io>
          {link ? <Io href={link}>Make a meeting</Io> : null}
          <Io onClick={onMore}>See more</Io>
        </div>
      </div>
    </div>
  );
}

export function DrSheet({ config, go, onClose }) {
  const ins = config.instructor || {};
  const link = schedulingLinkOf(config);
  const act = (icon, words, href, onClick) => href
    ? <a className="pt-focus" href={href} target="_blank" rel="noreferrer" style={ACT}><span style={ICO}>{icon}</span>{words}</a>
    : <button type="button" className="pt-focus" onClick={onClick} style={ACT}><span style={ICO}>{icon}</span>{words}</button>;
  return (
    <Sheet label="Your instructor" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <DrFace config={config} size={72} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="pt-secSub" style={{ color: "var(--ca-accent-ink)" }}>Your instructor</span>
          <h3 className="pt-h1" style={{ fontSize: 26 }}>{ins.name}</h3>
          {ins.title ? <p style={{ fontSize: 17 }}>{ins.title}</p> : null}
          {ins.bio ? <p className="pt-quiet" style={{ padding: 0, fontSize: 15 }}>{ins.bio}</p> : null}
        </div>
        <button type="button" className="pt-close pt-focus" onClick={onClose} aria-label="Close">{I.x(18)}</button>
      </div>
      {ins.motto ? <p style={{ fontFamily: "var(--pt-serif)", fontStyle: "italic", fontSize: 17, lineHeight: 1.4 }}>{ins.motto}</p> : null}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {act(I.chat(20), "Message " + drShort(config), null, () => { onClose(); go("messages"); })}
        {link ? act(I.cal(20), "Make a meeting", link) : null}
        {ins.officeHours ? act(I.clock(20), "Office hours " + ins.officeHours, null, onClose) : null}
        {ins.email ? act(I.mail(20), ins.email, "mailto:" + ins.email) : null}
      </div>
    </Sheet>
  );
}
const ACT = { display: "flex", alignItems: "center", gap: 14, minHeight: 56, padding: "0 4px", background: "transparent", border: 0, width: "100%",
  textAlign: "left", color: "var(--text-primary)", fontSize: 17, fontWeight: 500, boxShadow: "0 1px 0 var(--line-soft)", textDecoration: "none", cursor: "pointer" };
const ICO = { width: 40, height: 40, borderRadius: 12, background: "var(--surface-sunk)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", color: "var(--text-primary)" };

export function ProfileSheet({ config, data, update, setPhoto, name, onClose }) {
  const profile = profileOf(data, name);
  return (
    <Sheet label="Edit profile" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Face config={config} data={data} name={name} size={56} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="pt-secSub" style={{ color: "var(--ca-accent-ink)" }}>Edit profile</span>
          <h3 className="pt-h1" style={{ fontSize: 26 }}>{nameShown(data, name)}</h3>
        </div>
        <button type="button" className="pt-close pt-focus" onClick={onClose} aria-label="Close">{I.x(18)}</button>
      </div>
      <ProfileForm student={name} initial={profile} update={update} setPhoto={setPhoto} accent={config.accent} onDone={onClose} onCancel={onClose} />
    </Sheet>
  );
}

// The student's own card, with Edit profile on it.
export function MineCard({ config, data, name, onEdit }) {
  const p = profileOf(data, name);
  const where = [p.year, p.hometown].filter(Boolean).join(" · ");
  return (
    <div className="pt-mine">
      <Face config={config} data={data} name={name} size={72} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <p className="pt-title">{nameShown(data, name)}</p>
        {where ? <p className="pt-meta" style={{ color: "var(--text-primary)" }}>{where}</p> : null}
        {p.motto ? <p className="pt-meta" style={{ fontFamily: "var(--pt-serif)", fontStyle: "italic", fontSize: 15, color: "var(--text-primary)" }}>{p.motto}</p> : null}
      </div>
      <Io kind="go" onClick={onEdit}>Edit profile</Io>
    </div>
  );
}

export function ClassPage({ config, data, update, setPhoto, name, go, instructor, columns = 2 }) {
  const [editing, setEditing] = useState(false);
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(null);
  const people = classmatesOf(config, data, instructor ? "instructor" : "student", name).filter(s => s.name !== name);
  if (open) {
    const p = profileOf(data, open);
    const where = [p.year, p.hometown].filter(Boolean).join(" · ");
    return (
      <div className="pt-body">
        <div><Io onClick={() => setOpen(null)}>‹ Class</Io></div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <Face config={config} data={data} name={open} size={120} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 className="pt-h1" style={{ fontSize: 26 }}>{nameShown(data, open)}</h2>
            {where ? <p className="pt-meta" style={{ fontSize: 15, color: "var(--text-primary)" }}>{where}</p> : null}
            {p.motto ? <p style={{ fontFamily: "var(--pt-serif)", fontStyle: "italic", fontSize: 17 }}>{p.motto}</p> : null}
            {p.about ? <p className="pt-text" style={{ fontSize: 16 }}>{p.about}</p> : null}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="pt-body">
      {instructor ? null : <MineCard config={config} data={data} name={name} onEdit={() => setEditing(true)} />}
      {instructor ? null : <div className="pt-day"><Sec name={drShort(config)} /><div className="pt-stack"><DrCard config={config} go={go} onMore={() => setMore(true)} /></div></div>}
      <div className="pt-day">
        <Sec name="Classmates" sub={people.length} />
        <div className="pt-people" style={columns === 3 ? { gridTemplateColumns: "repeat(3,minmax(0,1fr))" } : undefined}>
          {people.map(s => (
            <button type="button" key={s.name} className="pt-person pt-focus" onClick={() => setOpen(s.name)}>
              <Face config={config} data={data} name={s.name} size={88} />
              <span className="nm">{nameShown(data, s.name)}</span>
              {instructor && s.section ? <span className="sm">{s.section}</span> : null}
            </button>
          ))}
        </div>
      </div>
      {editing ? <ProfileSheet config={config} data={data} update={update} setPhoto={setPhoto} name={name} onClose={() => setEditing(false)} /> : null}
      {more ? <DrSheet config={config} go={go} onClose={() => setMore(false)} /> : null}
    </div>
  );
}

export { Btn };
