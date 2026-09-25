// A worksheet, for a student: /<class>/worksheets/<key>.
//
// The sheet itself is the worksheets package. This file only connects it to
// the class: who is signed in (by email, off the roster), the class's accent,
// and the Supabase client that signs each call as the person here. Every
// answer is its own row, written as it is typed, so a weekend of work never
// sits in one blob waiting to be saved. See worksheets' BRIEF.md.

import { useEffect } from "react";
import { Worksheet, WORKSHEETS } from "@ishak/worksheets";
import { useClassState } from "./store.js";
import { rosterOf } from "./roster.js";
import { useSession, studentFor } from "./session.js";
import { gameClient } from "./gameClient.js";
import * as TOKENS from "./tokens.js";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_STUDENT } from "./TopNav.jsx";

export default function WorksheetPage({ config, worksheetKey }) {
  const [data] = useClassState(config.storageKey);
  const { session, email, instructor } = useSession();
  const sheet = WORKSHEETS.find(w => w.key === worksheetKey);

  useEffect(() => {
    document.title = config.code + " · " + (sheet ? sheet.title : "Worksheet");
    setClassFavicon(config);
  }, [config, sheet]);

  const roster = rosterOf(config, data);
  const me = session && !instructor ? studentFor(email, roster) : null;
  const id = String(email || "").trim().toLowerCase();
  // The instructor gets a sheet of their own, under their own email, so the
  // worksheet can be tried before it is sent.
  const viewer = me ? { id, name: me.name } : session && instructor ? { id, name: "Instructor" } : null;
  const next = typeof window !== "undefined" ? window.location.pathname : config.path;

  let body;
  if (!sheet) {
    body = <p style={{ fontSize: 17, margin: 0 }}>There is no worksheet at this address.</p>;
  } else if (!session) {
    body = (
      <>
        <p style={{ fontSize: 17, margin: "0 0 12px" }}>This worksheet runs on your email sign-in.</p>
        <a className="ca-focus" href={"/login?next=" + encodeURIComponent(next)} style={{ fontSize: 17, fontWeight: 600, color: config.accent }}>Sign in</a>
      </>
    );
  } else if (!viewer) {
    body = data === null
      ? <p style={{ fontSize: 17, margin: 0 }}>Loading the roster.</p>
      : <p style={{ fontSize: 17, margin: 0 }}>{email} is not on the roster for {config.code} yet.</p>;
  } else {
    body = null;
  }

  return (
    <div style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body }}>
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      {body !== null
        ? <div style={{ padding: 32 }}>{body}</div>
        : <Worksheet key={viewer.id} supabase={gameClient} worksheetKey={worksheetKey} groupKey={config.id} viewer={viewer}
            accent={config.accent} accentLight={config.accentLight} />}
    </div>
  );
}
