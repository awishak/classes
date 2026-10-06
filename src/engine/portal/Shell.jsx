// The portal's frame, on a phone and on a laptop.
//
// A phone: the one bar (ClassApp builds it, the same TopNav the dashboard
// wears), the page's title with the search glass beside it, the page, and a
// bar along the bottom with Schedule, My work and Class (and Inbox, for
// Andrew). A laptop: the same bar with the search in its middle, the home in
// the left pane, and the right pane's titles as the switch between the pages,
// the lit one open.
//
// ClassApp still owns the session, the data, the decks in front of the site,
// the preview bar and the top bar; this draws what comes after them.

import { useState } from "react";
import { ThemeStyle } from "../ThemeShell.jsx";
import { ThemeChrome, ThemeTopper, ThemeStickers, StoryBar, cardStyle } from "../ThemeChrome.jsx";
import { StudentThread } from "../YouCard.jsx";
import { RosterDetail } from "../RosterCard.jsx";
import { rosterOf, nameShown } from "../roster.js";
import { sectionFor, hasSections } from "../sections.js";
import { noticeFor } from "../notice.js";
import { PORTAL_CSS } from "./style.js";
import { I, Io } from "./bits.jsx";
import { StudentHome, weekWords } from "./StudentHome.jsx";
import { InstructorHome, InstructorWork, Inbox } from "./InstructorHome.jsx";
import { MyWorkPage, ChallengePage, PerformanceSheet } from "./MyWork.jsx";
import { ClassPage } from "./ClassPage.jsx";
import { QuestionsPage } from "./Questions.jsx";
import { SearchPanel } from "./Search.jsx";
import { SchedulePage } from "./Schedule.jsx";
import { visibleAssignments } from "./work.js";
import { assignmentsOf } from "../profileTask.js";

const STUDENT_TITLES = [["schedule", "Schedule"], ["assignments", "My work"], ["class", "Class"]];
const HIS_TITLES = [["schedule", "Schedule"], ["assignments", "My work"], ["messages", "Inbox"], ["class", "Class"]];
const TAB_ICON = { schedule: I.cal, assignments: I.work, messages: I.mail, class: I.people };

const titleOf = (key, sub, config, data, instructor) => {
  if (key === "assignments" && sub) {
    if (sub === "new") return "New challenge";
    const a = assignmentsOf(config, data).find(x => x.id === sub);
    return a ? a.title : "My work";
  }
  if (key === "messages" && sub) return nameShown(data, decodeURIComponent(sub));
  const t = (instructor ? HIS_TITLES : STUDENT_TITLES).find(x => x[0] === key);
  if (t) return t[1];
  return { questions: "Questions", messages: instructor ? "Inbox" : "Messages", more: "More", games: "Games", performance: "My work", profile: "Class", you: "Class" }[key] || key;
};

export default function PortalShell(p) {
  const { config, data, write, ctx, view, isDesktop, theme, mode, accentCSS, baseCSS, go, openKey, openSub, seenAs,
    PreviewBar, GameLayer, tickerLines, detailFor, mark, bar, searchOpen, setSearchOpen, roster } = p;
  const instructor = view === "instructor";
  const name = seenAs;
  const [sheet, setSheet] = useState("");
  const loading = data === null;
  const d = data || {};
  const section = instructor ? "" : (hasSections(config) ? sectionFor(rosterOf(config, d), name) : "");
  const notice = instructor ? null : (noticeFor(d, name) || {}).text || "";
  const pageKey = openKey === "performance" ? "assignments" : openKey === "profile" || openKey === "you" ? "class" : openKey;

  // ─── the pages ───
  const work = (extra) => <MyWorkPage config={config} data={d} update={write} name={name} go={go} view={p.workView} setView={p.setWorkView} onPerformance={() => setSheet("performance")} {...extra} />;
  const page = (key, sub) => {
    if (loading) return <p className="pt-quiet">Loading.</p>;
    if (key === "more" || key === "games") return detailFor(key);
    if (key === "schedule") return <SchedulePage config={config} data={d} blockOf={ctx.blockOf} focusDay={sub} instructor={instructor} me={instructor ? "" : name} mark={mark} go={go} />;
    if (instructor) {
      if (key === "assignments") return <InstructorWork config={config} data={d} update={write} go={go} editing={sub || ""} />;
      if (key === "messages") return sub
        ? <div className="pt-body"><div><Io onClick={() => go("messages")}>‹ Inbox</Io></div><StudentThread config={config} data={d} update={write} name={decodeURIComponent(sub)} /></div>
        : <Inbox config={config} data={d} go={go} />;
      if (key === "class") return <RosterDetail config={config} role="instructor" data={d} update={write} name={name} />;
      if (key === "questions") return <QuestionsPage config={config} name={config.instructor?.name || "Instructor"} profiles={d.profiles} instructor />;
      return detailFor(key);
    }
    if (key === "assignments") return sub ? <ChallengePage config={config} data={d} update={write} name={name} id={sub} go={go} /> : work();
    if (key === "performance") return work();
    if (key === "messages") return work({ view: "flow", initialFilter: "messages" });
    if (key === "class" || key === "profile" || key === "you") return <ClassPage config={config} data={d} update={write} setPhoto={ctx.setPhoto} name={name} go={go} columns={isDesktop ? 3 : 2} />;
    if (key === "questions") return <QuestionsPage config={config} name={name} profiles={d.profiles} />;
    return detailFor(key);
  };
  // The themes that bring furniture of their own get it: the story bar over
  // the home, and the theme's card around the home. Clean's card is the row
  // language itself.
  const seat = (i) => (theme && theme !== "clean" ? { ...cardStyle(theme, i), padding: 12 } : null);
  const homeBody = loading ? <p className="pt-quiet">Loading.</p>
    : instructor
      ? <InstructorHome config={config} data={d} update={write} blockOf={ctx.blockOf} go={go} saving={p.saveState} online={p.online} />
      : <StudentHome config={config} data={d} update={write} blockOf={ctx.blockOf} section={section} name={name} mark={mark} go={go} notice={notice} />;
  const home = (
    <>
      <StoryBar theme={theme} roster={roster || []} me={seenAs} />
      {seat(0) ? <div style={seat(0)}>{homeBody}</div> : homeBody}
    </>
  );

  // ─── the title row ───
  const wk = weekWords(config, d);
  const homeTitle = instructor ? (wk.n ? "Week " + wk.n : config.code) : (loading ? "" : nameShown(d, name));
  const homeSub = wk.range;
  const titleRow = (title, sub, glass) => (
    <div className="pt-head" style={{ alignItems: "center" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h1 className="pt-h1">{title}</h1>{sub ? <span className="pt-sub">{sub}</span> : null}
      </div>
      {glass ? <button type="button" className="pt-io pt-focus" onClick={() => setSearchOpen(true)} aria-label="Search" style={{ width: 44, minHeight: 44, padding: 0, borderRadius: 999 }}>{I.search()}</button> : null}
    </div>
  );
  const searchPanel = <SearchPanel config={config} data={d} name={name} blockOf={ctx.blockOf} instructor={instructor} go={(k) => { setSearchOpen(false); go(k); }} onClose={() => setSearchOpen(false)} />;
  const sheets = sheet === "performance" ? <PerformanceSheet config={config} data={d} name={name} go={go} onClose={() => setSheet("")} /> : null;
  const titles = instructor ? HIS_TITLES : STUDENT_TITLES;
  const tabs = (
    <nav className="pt-tabs" aria-label="Main">
      {titles.map(([key, say]) => (
        <button type="button" key={key} className={"pt-tab pt-focus" + (pageKey === key ? " on" : "")} onClick={() => go(key)}>{TAB_ICON[key](22)}{say}</button>
      ))}
    </nav>
  );
  const root = { minHeight: "100vh", background: "var(--surface-page)", color: "var(--text-primary)", "--ca-accent": config.accent, "--ca-accent-ink": config.accent, display: "flex", flexDirection: "column" };
  const styles = <style>{baseCSS + accentCSS + PORTAL_CSS}</style>;
  const top = (
    <div style={{ position: "sticky", top: 0, zIndex: 10 }}>
      {PreviewBar}
      {bar}
    </div>
  );

  // ─── a laptop ───
  if (isDesktop) {
    const lit = pageKey || "assignments";
    return (
      <div data-theme={theme} data-mode={mode} className="ca-root pt-root" style={root}>
        <ThemeStyle theme={theme} /><ThemeChrome theme={theme} />{styles}{GameLayer}<ThemeStickers theme={theme} />
        <ThemeTopper theme={theme} lines={tickerLines} seed={(seenAs || "").length + (config.code || "").length} />
        {top}
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 20px 32px", display: "grid", gridTemplateColumns: "minmax(0, 480px) minmax(0, 1fr)", gap: 32, alignItems: "start", width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            {seat(2) ? <div style={seat(2)}>{titleRow(homeTitle, homeSub, false)}</div> : titleRow(homeTitle, homeSub, false)}
            {home}
          </div>
          <div className="pt-pane" style={seat(1) || undefined}>
            <div className="pt-pane-head">
              <div className="pt-titles" role="tablist">
                {titles.map(([key, say]) => <button type="button" key={key} role="tab" aria-selected={lit === key} className={"pt-focus" + (lit === key ? " on" : "")} onClick={() => go(key)}>{say}</button>)}
              </div>
            </div>
            <div className="pt-pane-body">
              {searchOpen ? searchPanel : page(pageKey || "assignments", openSub)}
            </div>
          </div>
        </div>
        {sheets}
      </div>
    );
  }

  // ─── a phone ───
  const onPage = !!pageKey;
  const pageTitle = onPage ? titleOf(openKey, openSub, config, d, instructor) : homeTitle;
  const inside = (openKey === "assignments" && openSub && !instructor) || (openKey === "messages" && openSub);
  return (
    <div data-theme={theme} data-mode={mode} className="ca-root pt-root" style={root}>
      <ThemeStyle theme={theme} /><ThemeChrome theme={theme} />{styles}{GameLayer}<ThemeStickers theme={theme} />
      <ThemeTopper theme={theme} lines={tickerLines} seed={(seenAs || "").length + (config.code || "").length} />
      {top}
      <div style={{ padding: "16px 8px 24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
        {searchOpen ? searchPanel : (
          <>
            {seat(1) ? <div style={seat(1)}>{titleRow(pageTitle, onPage ? "" : homeSub, !inside)}</div> : titleRow(pageTitle, onPage ? "" : homeSub, !inside)}
            {onPage ? (seat(2) ? <div style={seat(2)}>{page(openKey, openSub)}</div> : page(openKey, openSub)) : home}
          </>
        )}
      </div>
      {tabs}
      {sheets}
    </div>
  );
}
