// One student, in a popup over whatever page he is on.
//
// Andrew, 2026-11-13, on the inbox: "i want to be able to click on a student
// and get a popup of their profile that includes how they've done on each
// assignment. i want to be able to go to their assignment and look at it
// too. maybe as a popup at first."
//
// The inside is the student's own page (StudentPage.jsx, embedded), so the
// popup and the page are the same thing drawn twice. A challenge's title
// swaps the popup to that student's file in a frame, with the way back in
// the bar. A file that cannot sit in a frame (embedOf, GradeView.jsx) opens
// in a tab of its own. Escape steps back once: file to profile, profile to
// closed. Nothing is written here.

import { useEffect, useState } from "react";
import StudentPage, { studentHref } from "./StudentPage.jsx";
import { embedOf } from "./GradeView.jsx";
import { nameShown } from "./roster.js";
import { ThemeStyle } from "./ThemeShell.jsx";
import * as TOKENS from "./tokens.js";

export default function StudentPeek({ config, data, name, onClose, startWork = null }) {
  // { href, title, embed } while a file is up. `startWork` opens straight on
  // one, which is how a link in a message opens.
  const [work, setWork] = useState(() => (startWork && embedOf(startWork.href) ? { ...startWork, embed: embedOf(startWork.href) } : null));
  const shown = nameShown(data, name);

  useEffect(() => {
    const onKey = (e) => { if (e.key !== "Escape") return; e.stopPropagation(); if (work) setWork(null); else onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [work, onClose]);
  // The page behind holds still while the popup is up.
  useEffect(() => {
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = was; };
  }, []);

  const open = (w) => {
    const embed = embedOf(w.href);
    if (embed) setWork({ ...w, embed });
    else window.open(w.href, "_blank", "noopener");
  };

  return (
    <div data-theme="clean" data-mode="day" className="ca-root pk-scrim" style={{ fontFamily: TOKENS.FONT.body }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Its own theme, so it reads the same over any page a name is on. */}
      <ThemeStyle theme="clean" />
      <style>{CSS}</style>
      <div className={"pk" + (work ? " wide" : "")} role="dialog" aria-modal="true" aria-label={shown}>
        <div className="pk-bar">
          {work ? <button type="button" className="pk-btn" onClick={() => setWork(null)}>{"‹ " + shown}</button> : null}
          {work ? <span className="pk-title">{work.title}</span> : null}
          <a className="pk-lnk" href={work ? work.href : studentHref(config, name)} target="_blank" rel="noopener">Open in a tab</a>
          <button type="button" className="pk-btn" onClick={onClose}>Close</button>
        </div>
        <div className="pk-body" style={work ? { display: "none" } : null}>
          <StudentPage config={config} id={name} embedded onWork={open} />
        </div>
        {work ? <iframe key={work.embed} className="pk-frame" title={shown + ", " + work.title} src={work.embed} allow="fullscreen" /> : null}
      </div>
    </div>
  );
}

const CSS = `
.pk-scrim{position:fixed;inset:0;z-index:40;background:rgba(28,25,23,.42);display:flex;align-items:center;justify-content:center;padding:24px}
.pk{width:100%;max-width:860px;max-height:100%;display:flex;flex-direction:column;background:var(--surface-page);border-radius:20px;box-shadow:0 24px 64px rgba(28,25,23,.28);overflow:hidden;text-align:left;font-size:16px;font-weight:400;line-height:normal;letter-spacing:normal;text-transform:none;white-space:normal;color:var(--text-primary);cursor:auto}
.pk.wide{max-width:1180px;height:100%}
.pk-bar{flex:none;display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 14px 8px 18px;background:var(--surface-card);border-bottom:1px solid var(--line-soft)}
.pk-title{font-size:16px;font-weight:700;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk-btn{font:inherit;font-size:15px;font-weight:600;color:var(--text-primary);background:var(--surface-card);border:1px solid var(--line-strong);border-radius:999px;padding:6px 14px;min-height:36px;cursor:pointer;white-space:nowrap}
.pk-lnk{margin-left:auto;font-size:15px;font-weight:600;color:var(--text-primary);text-decoration:none;white-space:nowrap}
.pk-lnk:hover{text-decoration:underline}
.pk-body{flex:1 1 auto;min-height:0;overflow:auto;padding:18px}
.pk-frame{flex:1 1 auto;min-height:0;width:100%;border:0;display:block;background:var(--surface-card)}
@media (max-width:720px){.pk-scrim{padding:0}.pk,.pk.wide{max-width:none;height:100%;border-radius:0}}
`;
