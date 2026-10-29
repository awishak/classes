// Worksheets, for the instructor: /<class>/worksheets, behind the same gate
// as the dashboard. The class's worksheets, and for each the spreadsheet:
// one row per student, one column per connection, approve or deny on every
// chip, and Open sheet to see one student's sheet as they saw it.
//
// The spreadsheet is the worksheets package's WorksheetReview. This file only
// connects it to the class: the roster, the accent, and the Supabase client
// that signs each call as the person here (a host, under migration 002).

import { useEffect, useState } from "react";
import { DetailsLink } from "./AssignmentsCard.jsx";
import { hasReadout } from "./ReadoutPage.jsx";
import { WorksheetReview, WORKSHEETS } from "@ishak/worksheets";
import { useClassData } from "./store.js";
import { rosterOf, idOf } from "./roster.js";
import { INSTRUCTOR_EMAILS } from "../instructors.js";
import { useSession, authHeaders } from "./session.js";
import { progressOf, percentOf } from "./worksheetProgress.js";
import { savedPin } from "../InstructorGate.jsx";
import { WORKTOPIA_KEY } from "./worktopia/terminal.js";
import { LOCAL_WORKSHEETS, listedFor, openTo } from "./localWorksheets.js";
import { gameClient } from "./gameClient.js";
import { StudentLink } from "./StudentPage.jsx";
import * as TOKENS from "./tokens.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { hasNight } from "./themes.js";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_TEACH } from "./TopNav.jsx";
import { assignmentSheets } from "./SubmissionPage.jsx";

const emailOf = (s) => String(s?.email || "").trim().toLowerCase();
// See WorksheetPage: the grid is held to day or night only when the page is.
const sheetThemeOf = (theme, mode) => !hasNight(theme) ? "light" : mode === "night" ? "dark" : mode === "day" ? "light" : undefined;

// Every worksheet the class can be handed: the package's, then this repo's.
const ALL_WORKSHEETS = [...WORKSHEETS, ...LOCAL_WORKSHEETS];

// Every student on one sheet, as a graph. Andrew, 2026-10-16: "i want a
// list of completed vs not. like give me graphs on that page. every student
// in terms of 0 to 100 percent completion." One read of every sheet with its
// answers through /api/worksheet-submits, measured by worksheetProgress.js,
// then three groups: submitted, started, not started, each student a bar.
function Completion({ config, sheet, people, studentUrl }) {
  const [sheets, setSheets] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/worksheet-submits", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, key: sheet.key, all: true }),
        });
        const out = r.ok ? await r.json() : null;
        if (alive) setSheets(out?.ok ? out.sheets || [] : []);
      } catch { if (alive) setSheets([]); }
    })();
    return () => { alive = false; };
  }, [config.id, sheet.key]);
  const byEmail = new Map((sheets || []).map(s => [String(s.viewer_id || "").toLowerCase(), s]));
  const progress = progressOf(sheet.key, sheets || []);
  const rows = people.filter(s => !INSTRUCTOR_EMAILS.includes(emailOf(s))).map(s => {
    const mine = byEmail.get(emailOf(s));
    const pct = mine ? percentOf(progress[String(mine.viewer_id).toLowerCase()]) : 0;
    return { s, email: emailOf(s), when: mine?.submitted_at || null, pct, state: mine?.submitted_at ? "submitted" : mine && pct > 0 ? "started" : "none" };
  });
  const groups = [
    ["submitted", "Submitted", rows.filter(r => r.state === "submitted")],
    ["started", "Started, not submitted", rows.filter(r => r.state === "started")],
    ["none", "Not started", rows.filter(r => r.state === "none")],
  ];
  const sortRows = (list) => list.slice().sort((x, y) => y.pct - x.pct || String(x.s.name).localeCompare(String(y.s.name)));
  const whenWords = (t) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const line = { display: "grid", gridTemplateColumns: "minmax(140px, 1fr) minmax(120px, 2fr) 56px auto", gap: 12, alignItems: "center", padding: "8px 16px", borderTop: "1px solid " + TOKENS.LINE.soft, fontSize: 15 };
  const bar = (pct, done) => (
    <div role="img" aria-label={pct + " percent"} style={{ height: 14, borderRadius: 999, background: TOKENS.SURFACE.sunk, overflow: "hidden" }}>
      <div style={{ width: pct + "%", height: "100%", borderRadius: 999, background: done ? config.accent : TOKENS.TEXT.secondary, transition: "width .3s" }} />
    </div>
  );
  return (
    <div style={{ borderRadius: 16, background: TOKENS.SURFACE.card, border: "1px solid " + TOKENS.LINE.soft, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <b style={{ fontSize: 20, fontWeight: 600 }}>{sheet.title}</b>
        <span style={{ fontSize: 15, color: TOKENS.TEXT.secondary }}>
          {sheets === null ? "Reading every sheet." : groups.map(([, say, list]) => list.length + " " + say.toLowerCase()).join(" · ")}
        </span>
      </div>
      {sheets !== null && rows.length ? (
        <div style={{ padding: "0 16px 14px" }}>
          {bar(Math.round(rows.reduce((n, r) => n + r.pct, 0) / rows.length), true)}
          <div style={{ fontSize: 14, color: TOKENS.TEXT.secondary, marginTop: 6 }}>{Math.round(rows.reduce((n, r) => n + r.pct, 0) / rows.length)}% across the class</div>
        </div>
      ) : null}
      {sheets !== null ? groups.map(([key, say, list]) => list.length ? (
        <div key={key}>
          <div style={{ padding: "10px 16px 6px", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: TOKENS.TEXT.secondary, borderTop: "1px solid " + TOKENS.LINE.soft }}>{say} · {list.length}</div>
          {sortRows(list).map(r => (
            <div key={r.email} style={line}>
              <span style={{ fontWeight: 600, overflowWrap: "anywhere" }}><StudentLink config={config} student={r.s} /></span>
              {bar(r.pct, r.state === "submitted")}
              <span style={{ fontVariantNumeric: "tabular-nums", textAlign: "right", color: TOKENS.TEXT.primary }}>{r.pct}%</span>
              <span style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14, color: TOKENS.TEXT.secondary, whiteSpace: "nowrap" }}>
                {r.when ? whenWords(r.when) : r.state === "started" ? "Not submitted" : "Not opened"}
                {r.state !== "none" ? <a className="ca-focus" href={studentUrl + "?s=" + encodeURIComponent(idOf(r.s))} style={{ fontSize: 15, fontWeight: 600, color: config.accent }}>Open sheet</a> : null}
              </span>
            </div>
          ))}
        </div>
      ) : null) : null}
      {!rows.length ? <div style={{ padding: "10px 16px 16px", fontSize: 15 }}>Nobody on the roster has an email yet.</div> : null}
    </div>
  );
}

export default function WorksheetsPage({ config }) {
  const [data, update] = useClassData(config.storageKey);
  const { session, instructor } = useSession();
  // This class's worksheets, by listedFor, then every assignment that takes
  // its work on a submission page (SubmissionPage.jsx). A sheet made for this
  // class opens first.
  const mine = [...ALL_WORKSHEETS.filter(w => listedFor(w, config.id)), ...assignmentSheets(config, data)];
  // ?w=<key> lands on one sheet, for the Tools panel's Who is done button.
  const asked = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("w") : "";
  const [key, setKey] = useState((mine.find(w => w.key === asked) || mine.find(w => w.classes && w.classes.includes(config.id)) || mine[0])?.key || "");
  const sheet = mine.find(w => w.key === key);
  const local = LOCAL_WORKSHEETS.find(w => w.key === key) || null;
  const isOpen = local ? openTo(local, config.id, data) : false;
  // The switch writes the plan row, which only an instructor can write.
  const setOpen = (on) => update(prev => ({ ...prev, worksheetsOpen: { ...(prev.worksheetsOpen || {}), [key]: on } }));
  const [copied, setCopied] = useState(false);
  // My theme and day or night in this browser, the same keys the class home
  // writes, so this page goes dark with the rest of the class.
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  // The address students open, in full, for the Details link on an assignment.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  // A submission page's students open the assignment itself; the worksheet
  // address is where one student's answers are read.
  const readUrl = sheet ? origin + config.path + "/worksheets/" + sheet.key : "";
  const studentUrl = sheet ? (sheet.paged ? origin + sheet.studentPath : readUrl) : "";
  // And what the class wrote on it, to share with them, where there is a readout.
  const readoutUrl = sheet && hasReadout(config.id, sheet.key) ? studentUrl + "/readout" : "";
  // And everyone's file by question, live. Names for me, none for the class.
  const answersUrl = sheet && sheet.key === WORKTOPIA_KEY ? studentUrl + "/answers" : "";
  // And the review, where a sheet has one: every file in the class, each with
  // its own page. Andrew, 2026-10-21, on 3x5: "where's the link for me to
  // review them all?"
  const reviewUrl = local && local.review ? studentUrl + "?review" : "";
  const copy = async (url) => {
    try { await navigator.clipboard.writeText(url); setCopied(url); setTimeout(() => setCopied(false), 1500); }
    catch { /* no clipboard: the box is selectable */ }
  };
  const addressBox = (heading, url, note) => (
    <div style={{ display: "grid", gap: 8, marginBottom: 20, padding: 16, borderRadius: 16, background: TOKENS.SURFACE.card, border: "1px solid " + TOKENS.LINE.soft }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{heading}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input readOnly value={url} aria-label={heading} onFocus={e => e.target.select()}
          style={{ flex: "1 1 320px", minWidth: 0, fontFamily: TOKENS.FONT.mono || "ui-monospace, monospace", fontSize: 14, minHeight: 40, padding: "0 12px", borderRadius: 10, border: "1px solid " + TOKENS.LINE.strong, background: TOKENS.SURFACE.sunk, color: TOKENS.TEXT.primary }} />
        <button type="button" onClick={() => copy(url)}
          style={{ fontFamily: TOKENS.FONT.body, fontSize: 15, fontWeight: 600, minHeight: 40, padding: "0 16px", borderRadius: 10, border: "1px solid " + TOKENS.LINE.strong, background: TOKENS.SURFACE.card, color: TOKENS.TEXT.primary, cursor: "pointer" }}>
          {copied === url ? "Copied" : "Copy"}
        </button>
        <DetailsLink href={url} accent={config.accent} />
      </div>
      {note ? <div style={{ fontSize: 14, color: TOKENS.TEXT.secondary }}>{note}</div> : null}
    </div>
  );

  useEffect(() => {
    document.title = config.code + " · Worksheets";
    setClassFavicon(config);
  }, [config]);

  const people = rosterOf(config, data).filter(s => s.email);
  const roster = people.map(s => ({ id: emailOf(s), name: s.name }));
  const bar = (
    <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
      <TopNav config={config} tabs={NAV_TEACH} active="" />
    </div>
  );

  if (!session || !instructor) {
    return (
      <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body }}>
        <ThemeStyle theme={theme} />
        {bar}
        <div style={{ padding: 32 }}>
          <p style={{ fontSize: 17, margin: "0 0 12px" }}>Worksheets run on your email sign-in.</p>
          <a href="/login" style={{ fontSize: 17, fontWeight: 600, color: config.accent }}>Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body }}>
      <ThemeStyle theme={theme} />
      {bar}
      <div style={{ padding: "24px 16px 48px", maxWidth: 1600, margin: "0 auto" }}>
        {mine.length > 1 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {mine.map(w => (
              <button key={w.key} type="button" onClick={() => setKey(w.key)} aria-pressed={w.key === key}
                style={{ fontFamily: TOKENS.FONT.body, fontSize: 15, fontWeight: 600, minHeight: 40, padding: "0 14px", borderRadius: 999,
                  border: "1px solid " + TOKENS.LINE.strong, background: w.key === key ? config.accent : TOKENS.SURFACE.card, color: w.key === key ? "#fff" : TOKENS.TEXT.primary, cursor: "pointer" }}>
                {w.title}
              </button>
            ))}
          </div>
        ) : null}
        {sheet ? (<>
          {local ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 20, padding: 16, borderRadius: 16, background: TOKENS.SURFACE.card, border: "1px solid " + TOKENS.LINE.soft }}>
              <div style={{ flex: "1 1 260px" }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{isOpen ? "Open to " + config.code + " students" : "Closed to students"}</div>
                <div style={{ fontSize: 14, color: TOKENS.TEXT.secondary }}>{isOpen ? "Anyone on the roster can open the address and start." : "Students who open the address read that the worksheet is not open yet. You can still try the sheet under your own email."}</div>
              </div>
              <button type="button" role="switch" aria-checked={isOpen} onClick={() => setOpen(!isOpen)} disabled={data === null}
                style={{ fontFamily: TOKENS.FONT.body, fontSize: 15, fontWeight: 600, minHeight: 44, padding: "0 18px", borderRadius: 999, cursor: "pointer",
                  border: "1px solid " + (isOpen ? config.accent : TOKENS.LINE.strong), background: isOpen ? config.accent : TOKENS.SURFACE.card, color: isOpen ? "#fff" : TOKENS.TEXT.primary }}>
                {isOpen ? "Close to students" : "Open to students"}
              </button>
            </div>
          ) : null}
          {reviewUrl ? addressBox("Review every sheet, each on its own page", reviewUrl, "") : null}
          {addressBox(sheet.paged ? "Students turn this challenge in at" : "Students open this worksheet at", studentUrl, sheet.paged ? "" : "Paste the address into the Details link on the assignment.")}
          {answersUrl ? addressBox("Everyone's answers, by question", answersUrl, "You see names. A student who opens the same address sees the answers with no names.") : null}
          {readoutUrl ? addressBox("What the class wrote, to share with them", readoutUrl, "") : null}
          <Completion key={"c-" + sheet.key} config={config} sheet={sheet} people={people} studentUrl={readUrl} />
          {local || sheet.paged ? null : <div style={{ marginTop: 20 }}>
            <WorksheetReview key={sheet.key} supabase={gameClient} worksheetKey={sheet.key} groupKey={config.id}
              roster={roster} hide={INSTRUCTOR_EMAILS} title={sheet.title} accent={config.accent} accentDark={config.accentDark} theme={sheetThemeOf(theme, mode)} />
          </div>}
        </>) : null}
      </div>
    </div>
  );
}
