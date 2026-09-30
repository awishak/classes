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
import { rosterOf } from "./roster.js";
import { INSTRUCTOR_EMAILS } from "../instructors.js";
import { useSession } from "./session.js";
import { gameClient } from "./gameClient.js";
import * as TOKENS from "./tokens.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { hasNight } from "./themes.js";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_TEACH } from "./TopNav.jsx";

const emailOf = (s) => String(s?.email || "").trim().toLowerCase();
// See WorksheetPage: the grid is held to day or night only when the page is.
const sheetThemeOf = (theme, mode) => !hasNight(theme) ? "light" : mode === "night" ? "dark" : mode === "day" ? "light" : undefined;

export default function WorksheetsPage({ config }) {
  const [data] = useClassState(config.storageKey);
  const { session, instructor } = useSession();
  const [key, setKey] = useState(WORKSHEETS[0]?.key || "");
  const sheet = WORKSHEETS.find(w => w.key === key);
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

  const roster = rosterOf(config, data).filter(s => s.email).map(s => ({ id: emailOf(s), name: s.name }));
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
        {WORKSHEETS.length > 1 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {WORKSHEETS.map(w => (
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
          {readoutUrl ? addressBox("What the class wrote, to share with them", readoutUrl, "") : null}
          <WorksheetReview key={sheet.key} supabase={gameClient} worksheetKey={sheet.key} groupKey={config.id}
            roster={roster} hide={INSTRUCTOR_EMAILS} title={sheet.title} accent={config.accent} accentDark={config.accentDark} theme={sheetThemeOf(theme, mode)} />
        </>) : null}
      </div>
    </div>
  );
}
