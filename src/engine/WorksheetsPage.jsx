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
import { useClassState } from "./store.js";
import { rosterOf, idOf } from "./roster.js";
import { INSTRUCTOR_EMAILS } from "../instructors.js";
import { useSession, authHeaders } from "./session.js";
import { savedPin } from "../InstructorGate.jsx";
import { LOCAL_WORKSHEETS } from "./localWorksheets.js";
import { WORKTOPIA_KEY } from "./worktopia/terminal.js";
import { gameClient } from "./gameClient.js";
import * as TOKENS from "./tokens.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { hasNight } from "./themes.js";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_TEACH } from "./TopNav.jsx";

const emailOf = (s) => String(s?.email || "").trim().toLowerCase();
// See WorksheetPage: the grid is held to day or night only when the page is.
const sheetThemeOf = (theme, mode) => !hasNight(theme) ? "light" : mode === "night" ? "dark" : mode === "day" ? "light" : undefined;

// Every worksheet the class can be handed: the package's, then this repo's.
const ALL_WORKSHEETS = [...WORKSHEETS, ...LOCAL_WORKSHEETS];

// A worksheet built in this repo has no spreadsheet yet: one row per student,
// submitted or not, and Open sheet to read their file as they saw it. The
// submits come through /api/worksheet-submits, the same read the assignment
// card uses, so the PIN or an instructor's session both work.
function LocalReview({ config, sheet, people, studentUrl }) {
  const [sheets, setSheets] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/worksheet-submits", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, keys: [sheet.key] }),
        });
        const out = r.ok ? await r.json() : null;
        if (alive) setSheets(out?.ok ? out.sheets[sheet.key] || [] : []);
      } catch { if (alive) setSheets([]); }
    })();
    return () => { alive = false; };
  }, [config.id, sheet.key]);
  const when = new Map((sheets || []).map(s => [s.viewer_id, s.submitted_at]));
  const rows = people.filter(s => !INSTRUCTOR_EMAILS.includes(emailOf(s))).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const submitted = rows.filter(s => when.get(emailOf(s))).length;
  const cell = { padding: "10px 12px", borderBottom: "1px solid " + TOKENS.LINE.soft, fontSize: 15, textAlign: "left", verticalAlign: "top" };
  return (
    <div style={{ borderRadius: 16, background: TOKENS.SURFACE.card, border: "1px solid " + TOKENS.LINE.soft, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <b style={{ fontSize: 20, fontWeight: 600 }}>{sheet.title}</b>
        <span style={{ fontSize: 15, color: TOKENS.TEXT.secondary }}>{sheets === null ? "Reading the submits." : submitted + " of " + rows.length + " submitted"}</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={{ ...cell, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: TOKENS.TEXT.secondary }}>Student</th>
            <th style={{ ...cell, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: TOKENS.TEXT.secondary }}>Submitted</th>
            <th style={cell}></th>
          </tr></thead>
          <tbody>
            {rows.map(s => (
              <tr key={emailOf(s)}>
                <td style={cell}>{s.name}</td>
                <td style={{ ...cell, color: when.get(emailOf(s)) ? TOKENS.TEXT.primary : TOKENS.TEXT.secondary }}>
                  {when.get(emailOf(s)) ? new Date(when.get(emailOf(s))).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Not yet"}
                </td>
                <td style={cell}><a className="ca-focus" href={studentUrl + "?s=" + encodeURIComponent(idOf(s))} style={{ fontSize: 15, fontWeight: 600, color: config.accent }}>Open sheet</a></td>
              </tr>
            ))}
            {!rows.length ? <tr><td style={cell} colSpan={3}>Nobody on the roster has an email yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WorksheetsPage({ config }) {
  const [data] = useClassState(config.storageKey);
  const { session, instructor } = useSession();
  const [key, setKey] = useState(ALL_WORKSHEETS[0]?.key || "");
  const sheet = ALL_WORKSHEETS.find(w => w.key === key);
  const local = LOCAL_WORKSHEETS.some(w => w.key === key);
  const [copied, setCopied] = useState(false);
  // My theme and day or night in this browser, the same keys the class home
  // writes, so this page goes dark with the rest of the class.
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);
  // The address students open, in full, for the Details link on an assignment.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const studentUrl = sheet ? origin + config.path + "/worksheets/" + sheet.key : "";
  // And what the class wrote on it, to share with them, where there is a readout.
  const readoutUrl = sheet && hasReadout(config.id, sheet.key) ? studentUrl + "/readout" : "";
  // And everyone's file by question, live. Names for me, none for the class.
  const answersUrl = sheet && sheet.key === WORKTOPIA_KEY ? studentUrl + "/answers" : "";
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
        {ALL_WORKSHEETS.length > 1 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {ALL_WORKSHEETS.map(w => (
              <button key={w.key} type="button" onClick={() => setKey(w.key)} aria-pressed={w.key === key}
                style={{ fontFamily: TOKENS.FONT.body, fontSize: 15, fontWeight: 600, minHeight: 40, padding: "0 14px", borderRadius: 999,
                  border: "1px solid " + TOKENS.LINE.strong, background: w.key === key ? config.accent : TOKENS.SURFACE.card, color: w.key === key ? "#fff" : TOKENS.TEXT.primary, cursor: "pointer" }}>
                {w.title}
              </button>
            ))}
          </div>
        ) : null}
        {sheet ? (<>
          {addressBox("Students open this worksheet at", studentUrl, "Paste the address into the Details link on the assignment.")}
          {answersUrl ? addressBox("Everyone's answers, by question", answersUrl, "You see names. A student who opens the same address sees the answers with no names.") : null}
          {readoutUrl ? addressBox("What the class wrote, to share with them", readoutUrl, "") : null}
          {local
            ? <LocalReview key={sheet.key} config={config} sheet={sheet} people={people} studentUrl={studentUrl} />
            : <WorksheetReview key={sheet.key} supabase={gameClient} worksheetKey={sheet.key} groupKey={config.id}
                roster={roster} hide={INSTRUCTOR_EMAILS} title={sheet.title} accent={config.accent} accentDark={config.accentDark} theme={sheetThemeOf(theme, mode)} />}
        </>) : null}
      </div>
    </div>
  );
}
