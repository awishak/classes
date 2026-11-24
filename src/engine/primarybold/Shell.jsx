// The frame of the Primary Bold pages: one top bar on every page, then the page.
//
// It stands where portal/Shell.jsx stands and takes the same props from
// ClassApp, which still owns the session, the data, the decks in front of the
// site and the preview bar. ClassApp draws this shell only for Andrew, and
// only after he has turned the preview on (preview.js), until he releases it.
//
// A page with no Primary Bold version yet (Inbox, Games, More, the class flow) is
// the live page inside a plain card, so nothing is out of reach from here.

import { useEffect, useState } from "react";
import { rosterOf, nameShown } from "../roster.js";
import { sectionFor, hasSections } from "../sections.js";
import { noticeFor } from "../notice.js";
import { PORTAL_CSS } from "../portal/style.js";
import { InstructorWork, Inbox, ClassFlow } from "../portal/InstructorHome.jsx";
import { StudentThread } from "../YouCard.jsx";
import { RosterDetail } from "../RosterCard.jsx";
import { waitingOn } from "../AssignmentsCard.jsx";
import { assignmentsOf } from "../profileTask.js";
import { PRIMARY_BOLD_CSS, PRIMARY_BOLD_FONTS } from "./style.js";
import { Face, Pill, GROUNDS, useGround } from "./bits.jsx";
import { photoOf } from "./data.js";
import { setPreview } from "./preview.js";
import { Home, MyWork, Schedule, ClassPg, Questions } from "./student.jsx";
import { Desk, ToGrade, GradeFlow, Control } from "./instructor.jsx";

const STUDENT_NAV = [["", "Home"], ["schedule", "Schedule"], ["assignments", "My work"], ["class", "Class"]];

// His own pages have no address of their own on the live site's class route,
// so the bar keeps them after the # of the address: #to-grade, #grade-flow=<id>, #control=<id>.
const readHash = () => { const h = typeof window === "undefined" ? "" : decodeURIComponent((window.location.hash || "").slice(1)); const i = h.indexOf("="); return { page: i < 0 ? h : h.slice(0, i), id: i < 0 ? "" : h.slice(i + 1) }; };
function useHash() {
  const [h, setH] = useState(readHash);
  useEffect(() => { const on = () => setH(readHash()); window.addEventListener("hashchange", on); window.addEventListener("popstate", on); return () => { window.removeEventListener("hashchange", on); window.removeEventListener("popstate", on); }; }, []);
  return h;
}
const HIS = ["to-grade", "grade-flow", "control"];

export default function PrimaryBoldShell(p) {
  const { config, data, write, ctx, view, go, openKey, openSub, seenAs, PreviewBar, GameLayer, detailFor, mark, baseCSS, accentCSS } = p;
  const instructor = view === "instructor";
  const name = seenAs;
  const d = data || {};
  const loading = data === null;
  const [ground, setGround] = useGround();
  const [menu, setMenu] = useState(false);
  const hash = useHash();
  const his = instructor && HIS.includes(hash.page) ? hash.page : "";
  const section = instructor ? "" : (hasSections(config) ? sectionFor(rosterOf(config, d), name) : "");
  const notice = instructor ? "" : (noticeFor(d, name) || {}).text || "";
  const key = openKey === "performance" ? "assignments" : openKey === "profile" || openKey === "you" ? "class" : openKey || "";
  useEffect(() => {
    if (document.getElementById("primary-bold-fonts")) return;
    const l = document.createElement("link"); l.id = "primary-bold-fonts"; l.rel = "stylesheet"; l.href = PRIMARY_BOLD_FONTS; document.head.appendChild(l);
  }, []);
  // A page of the class route clears his # page, and his # page is always read on the class's own address.
  const to = (k) => { if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search); go(k); };
  const toHis = (page, id) => { window.location.hash = id ? page + "=" + encodeURIComponent(id) : page; };

  const old = (node) => <div className="old ca-root pt-root">{node}</div>;
  const page = () => {
    if (loading) return <div className="body"><p className="empty">Loading.</p></div>;
    if (his === "to-grade") return <ToGrade config={config} onOpen={(cls, id) => (cls === config.id ? toHis("grade-flow", id) : window.location.assign("/grades/" + cls + "/flow?a=" + encodeURIComponent(id)))} />;
    if (his === "grade-flow") return <GradeFlow config={config} data={d} update={write} id={hash.id} toHis={toHis} />;
    if (his === "control") return <Control config={config} data={d} id={hash.id} toHis={toHis} />;
    if (key === "schedule") return <Schedule config={config} data={d} blockOf={ctx.blockOf} name={name} mark={mark} go={to} instructor={instructor} />;
    if (key === "questions") return <Questions config={config} data={d} name={instructor ? config.instructor?.name || "Instructor" : name} instructor={instructor} />;
    if (instructor) {
      if (!key) return <Desk config={config} data={d} go={to} toHis={toHis} />;
      // His pages with no Primary Bold version yet, as portal/Shell.jsx draws them.
      const live = key === "flow" ? <ClassFlow config={config} data={d} go={to} />
        : key === "assignments" ? <InstructorWork config={config} data={d} update={write} go={to} editing={openSub || ""} />
        : key === "messages" ? (openSub ? <StudentThread config={config} data={d} update={write} name={decodeURIComponent(openSub)} /> : <Inbox config={config} data={d} go={to} />)
        : key === "class" ? <RosterDetail config={config} role="instructor" data={d} update={write} name={name} />
        : detailFor(key);
      return <div className="body">{old(live)}</div>;
    }
    if (!key) return <Home config={config} data={d} blockOf={ctx.blockOf} section={section} name={name} go={to} notice={notice} />;
    if (key === "assignments" || key === "messages") return <MyWork config={config} data={d} update={write} name={name} go={to} id={key === "assignments" ? openSub || "" : ""} />;
    if (key === "class") return <ClassPg config={config} data={d} update={write} setPhoto={ctx.setPhoto} name={name} go={to} />;
    return <div className="body">{old(detailFor(key))}</div>;
  };

  const waiting = instructor && !loading ? waitingOn(d, assignmentsOf(config, d)) : [];
  const toGrade = waiting.reduce((n, w) => n + (w.toGrade || 0), 0), unread = waiting.reduce((n, w) => n + (w.messages || 0), 0);
  const lit = his ? "" : key;
  const who = instructor ? config.instructor?.name || "Instructor" : nameShown(d, name);
  return <div className={"pbold page " + (ground === "night" ? "night" : ground) + (config.id === "comm3" ? " c3" : "")}>
    <style>{(baseCSS || "") + (accentCSS || "") + PORTAL_CSS + PRIMARY_BOLD_CSS}</style>
    {GameLayer}
    {PreviewBar}
    <div className="bar"><div className="in">
      <span className="cls"><b>{config.code}</b>{config.title || config.name || ""}</span>
      <div className="navs"><nav aria-label="Main">
        {STUDENT_NAV.map(([k, say]) => <Pill key={k} kind={"flat" + (lit === k && !his ? " on" : "")} onClick={() => to(k)}>{say}</Pill>)}
      </nav>
      {instructor ? <><span className="sep" /><nav aria-label="Instructor">
        <Pill kind="flat" href={config.path + "/dashboard"}>Dashboard</Pill>
        <Pill kind={"flat" + (his ? " on" : "")} count={toGrade || ""} onClick={() => toHis("to-grade")}>Grades</Pill>
        <Pill kind={"flat" + (lit === "messages" ? " on" : "")} count={unread || ""} onClick={() => to("messages")}>Inbox</Pill>
        <Pill kind={"flat" + (lit === "games" ? " on" : "")} onClick={() => to("games")}>Games</Pill>
        <Pill kind={"flat" + (lit === "more" ? " on" : "")} onClick={() => to("more")}>More</Pill>
      </nav></> : null}</div>
      <span className="grow" />
      <div className="menu">
        <Face name={who} photo={instructor ? config.instructor?.photo || "" : photoOf(d, name)} size="sm" ring="c118" onClick={() => setMenu(v => !v)} label="Colors and the current site" />
        {menu ? <div className="drop">
          <div className="rowx" role="group" aria-label="Colors">{GROUNDS.map(([id, say]) => <Pill key={id} kind={ground === id ? "on" : ""} onClick={() => setGround(id)}>{say}</Pill>)}</div>
          <Pill onClick={() => { setPreview(false); window.location.reload(); }}>The current site</Pill>
        </div> : null}
      </div>
    </div></div>
    <div className="in">{page()}</div>
  </div>;
}
