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
import { WorksheetReview, WORKSHEETS } from "@ishak/worksheets";
import { useClassState } from "./store.js";
import { rosterOf } from "./roster.js";
import { useSession } from "./session.js";
import { gameClient } from "./gameClient.js";
import * as TOKENS from "./tokens.js";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_TEACH } from "./TopNav.jsx";

const emailOf = (s) => String(s?.email || "").trim().toLowerCase();

export default function WorksheetsPage({ config }) {
  const [data] = useClassState(config.storageKey);
  const { session, instructor } = useSession();
  const [key, setKey] = useState(WORKSHEETS[0]?.key || "");
  const sheet = WORKSHEETS.find(w => w.key === key);
  const [copied, setCopied] = useState(false);
  // The address students open, in full, for the Details link on an assignment.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const studentUrl = sheet ? origin + config.path + "/worksheets/" + sheet.key : "";
  const copy = async () => {
    try { await navigator.clipboard.writeText(studentUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* no clipboard: the box is selectable */ }
  };

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
      <div style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body }}>
        {bar}
        <div style={{ padding: 32 }}>
          <p style={{ fontSize: 17, margin: "0 0 12px" }}>Worksheets run on your email sign-in.</p>
          <a href="/login" style={{ fontSize: 17, fontWeight: 600, color: config.accent }}>Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body }}>
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
        {sheet ? (
          <div style={{ display: "grid", gap: 8, marginBottom: 20, padding: 16, borderRadius: 16, background: TOKENS.SURFACE.card, border: "1px solid " + TOKENS.LINE.soft }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Students open this worksheet at</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input readOnly value={studentUrl} aria-label="student address" onFocus={e => e.target.select()}
                style={{ flex: "1 1 320px", minWidth: 0, fontFamily: TOKENS.FONT.mono || "ui-monospace, monospace", fontSize: 14, minHeight: 40, padding: "0 12px", borderRadius: 10, border: "1px solid " + TOKENS.LINE.strong, background: TOKENS.SURFACE.sunk, color: TOKENS.TEXT.primary }} />
              <button type="button" onClick={copy}
                style={{ fontFamily: TOKENS.FONT.body, fontSize: 15, fontWeight: 600, minHeight: 40, padding: "0 16px", borderRadius: 10, border: "1px solid " + TOKENS.LINE.strong, background: TOKENS.SURFACE.card, color: TOKENS.TEXT.primary, cursor: "pointer" }}>
                {copied ? "Copied" : "Copy"}
              </button>
              <DetailsLink href={studentUrl} accent={config.accent} />
            </div>
            <div style={{ fontSize: 14, color: TOKENS.TEXT.secondary }}>Paste the address into the Details link on the assignment.</div>
          </div>
          <WorksheetReview key={sheet.key} supabase={gameClient} worksheetKey={sheet.key} groupKey={config.id}
            roster={roster} title={sheet.title} accent={config.accent} />
        ) : null}
      </div>
    </div>
  );
}
