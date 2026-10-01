// The search behind the glass beside every title. It reaches the pages, every
// challenge, every reading and day on the schedule, the classmates in the
// student's own section, Dr. Ishak, office hours and the profile. Grades land
// on My performance; assignments, challenges and projects on My work;
// teacher and professor on Dr. Ishak.

import { useState } from "react";
import { classmatesOf } from "../RosterCard.jsx";
import { nameShown } from "../roster.js";
import { dayTitles } from "../days.js";
import { studentItems } from "../ScheduleCard.jsx";
import { daySlug } from "../days.js";
import { Sec, Btn, I } from "./bits.jsx";
import { visibleAssignments } from "./work.js";
import { dueWords, drShort } from "./bits.jsx";

const lc = (s) => String(s || "").toLowerCase();

export function searchIndex(config, data, name, blockOf, instructor) {
  const out = [];
  const page = (title, sub, to, k) => out.push({ kind: "Page", title, sub, to, k: lc(k + " " + title) });
  page("Schedule", "Every week of the quarter", "schedule", "schedule week class days readings");
  page("My work", "Flow and list", "assignments", "my work assignments challenges submit due homework projects");
  page("My performance", "Your grade on each challenge", "performance", "grades grade performance marks score");
  page("Class", "The roster", "class", "class roster classmates people students");
  page("Questions", "Ask, and read what was asked", "questions", "questions ask faq");
  if (!instructor) page("My profile", "Edit profile", "profile", "my profile edit profile photo motto me card");
  const ins = config.instructor || {};
  page(drShort(config), ins.title || "", "class", "dr ishak teacher professor instructor " + ins.name);
  if (ins.officeHours) page("Office hours", ins.officeHours, "class", "office hours " + ins.officeHours);
  page("Message " + drShort(config), "Write a message", "messages", "message messages write inbox");
  if (!instructor) page("My PIN", "Your sign-in code is on More", "more", "pin code sign in login password");
  page("Theme", "Day, night, and the look of the site", "more", "theme dark night light mode settings more");
  visibleAssignments(config, data).forEach(a => out.push({ kind: "Challenge", title: a.title, sub: a.due === "Ongoing" || !a.due ? "Ongoing" : "Due " + dueWords(a.due, a.dueTime), to: "assignments/" + a.id,
    k: lc(a.title + " challenge assignment " + (a.weight >= 20 ? "project " : "") + (a.description || "")) }));
  const weeks = data?.schedule || config.scheduleWeeks || [];
  const titles = dayTitles(weeks, data?.dayPlans || {});
  weeks.forEach(w => {
    (w.dates || []).forEach(d => {
      const t = (titles[d] || {}).title || w.topic || "";
      out.push({ kind: "Day", title: d + (t ? " · " + t : ""), sub: w.topic || "", to: "schedule/" + daySlug(d), k: lc(d + " " + t + " " + w.topic + " day date") });
    });
    studentItems(w, data?.dayPlans || {}, blockOf).forEach(it => {
      if (!it.title) return;
      const date = it.date ? (w.dates || []).find(x => x.startsWith(it.date)) : "";
      out.push({ kind: it.type === "reading" ? "Reading" : "On the schedule", title: it.title, sub: w.topic || "", to: "schedule/" + daySlug(date || (w.dates || [])[0] || ""), k: lc(it.title + " reading " + w.topic) });
    });
  });
  classmatesOf(config, data, instructor ? "instructor" : "student", name).forEach(s => {
    if (s.name === name) return;
    out.push({ kind: "Classmate", title: nameShown(data, s.name), sub: s.section || "", to: "class", k: lc(s.name + " " + nameShown(data, s.name) + " classmate " + (s.section || "")) });
  });
  return out;
}

export function SearchPanel({ config, data, name, blockOf, instructor, go, onClose }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const hits = needle ? searchIndex(config, data, name, blockOf, instructor).filter(x => x.k.includes(needle)) : [];
  const groups = {};
  hits.forEach(h => (groups[h.kind] = groups[h.kind] || []).push(h));
  return (
    <div className="pt-body" style={{ gap: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label className="pt-notice" style={{ flex: 1, padding: "0 14px", minHeight: 44, background: "var(--surface-card)", boxShadow: "0 0 0 1px var(--line-strong)" }}>
          {I.search()}
          <input type="search" className="pt-focus" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search" aria-label="Search the class"
            style={{ flex: 1, border: 0, background: "transparent", outline: 0, fontSize: 16, minWidth: 0 }} />
        </label>
        <button type="button" className="pt-io pt-focus" onClick={onClose}>Cancel</button>
      </div>
      {!needle ? <p className="pt-quiet" style={{ textAlign: "center", padding: "16px 0" }}>Grades, challenges, readings, days, classmates, office hours, your profile.</p>
        : !hits.length ? <p className="pt-quiet" style={{ textAlign: "center", padding: "16px 0" }}>Nothing matches.</p>
        : Object.entries(groups).map(([kind, rows]) => (
          <div key={kind} className="pt-day">
            <Sec name={kind} sub={rows.length + (rows.length === 1 ? " match" : " matches")} />
            <div className="pt-stack">
              {rows.slice(0, 8).map((h, i) => (
                <button type="button" key={kind + i} className="pt-row link pt-focus" onClick={() => { onClose(); go(h.to); }}>
                  <div className="pt-main"><p className="pt-title">{h.title}</p><p className="pt-meta">{h.sub}</p></div>
                  <div className="pt-side"><span className="pt-chev" aria-hidden="true">›</span></div>
                </button>
              ))}
              {rows.length > 8 ? <p className="pt-quiet">And {rows.length - 8} more.</p> : null}
            </div>
          </div>
        ))}
    </div>
  );
}

export { Btn };
