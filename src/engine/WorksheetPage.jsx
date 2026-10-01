// A worksheet, for a student: /<class>/worksheets/<key>.
//
// The sheet itself is the worksheets package. This file only connects it to
// the class: who is signed in (by email, off the roster), the class's accent,
// and the Supabase client that signs each call as the person here. Every
// answer is its own row, written as it is typed, so a weekend of work never
// sits in one blob waiting to be saved. See worksheets' BRIEF.md.

import { useEffect, useRef, useState } from "react";
import { Worksheet, WORKSHEETS, mountSheet } from "@ishak/worksheets";
import { useClassState } from "./store.js";
import { rosterOf, findStudent } from "./roster.js";
import { useSession, studentFor, authHeaders } from "./session.js";
import { localWorksheet } from "./localWorksheets.js";
import { supabaseStore, readStore } from "./worktopia/store.js";
import { CATEGORIES, HORRIBLE } from "./worktopia/jobs.js";
import { usePhotos } from "./photos.js";
import { savedPin } from "../InstructorGate.jsx";
import { gameClient } from "./gameClient.js";
import * as TOKENS from "./tokens.js";
import { useStudentTheme, useDayNight, ThemeStyle } from "./ThemeShell.jsx";
import { hasNight } from "./themes.js";
import { setClassFavicon } from "./favicon.js";
import TopNav, { NAV_STUDENT } from "./TopNav.jsx";

// The sheet is told day or night only when the page is holding one. Auto
// leaves it to follow the machine, which is what the page does. A theme with
// no night (Snapchat, Crashing Out) keeps the sheet light rather than putting
// a dark sheet on a yellow page.
const sheetThemeOf = (theme, mode) => !hasNight(theme) ? "light" : mode === "night" ? "dark" : mode === "day" ? "light" : undefined;

// One student's sheet, read only, for the instructor: /<class>/worksheets/<key>?s=<roster id>.
// The grade view links here. It reads through /api/worksheet-submits, which
// takes the PIN or an instructor's session, so it opens however he signed in.
function TheirSheet({ config, worksheetKey, student, theme, photo }) {
  const ref = useRef(null);
  const [state, setState] = useState("loading");   // loading | none | denied | failed | shown
  const [submitted, setSubmitted] = useState(null);
  useEffect(() => {
    let alive = true, sheet = null;
    (async () => {
      try {
        const r = await fetch("/api/worksheet-submits", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, key: worksheetKey, viewer: student.email }),
        });
        if (!alive) return;
        if (r.status === 401) { setState("denied"); return; }
        const out = await r.json();
        if (!out.ok) { setState("failed"); return; }
        if (!out.sheet) { setState("none"); return; }
        setSubmitted(out.sheet.submitted_at);
        setState("shown");
        const local = localWorksheet(worksheetKey);
        if (local) {
          sheet = local.mount(ref.current, { store: readStore(out.answers, out.sheet.submitted_at), viewer: { id: student.email, name: student.name }, photo, readOnly: true });
          return;
        }
        const own = (WORKSHEETS.find(w => w.key === worksheetKey) || {}).theme || {};
        sheet = mountSheet(ref.current, {
          store: { async load() { return { answers: out.answers, submitted_at: out.sheet.submitted_at }; } },
          readOnly: true, theme, accent: own.accent || config.accent, accentLight: own.accentLight || config.accentLight,
          vars: own.vars, dark: own.dark || { accent: config.accentDark },
        });
      } catch { if (alive) setState("failed"); }
    })();
    return () => { alive = false; if (sheet) sheet.destroy(); };
  }, [config, worksheetKey, student.email, theme, photo]);
  const say = { loading: "Loading " + student.name + "'s sheet.", none: student.name + " has not opened this worksheet.",
    denied: "Only the instructor can open a student's sheet. Sign in as the instructor and open this address again.",
    failed: "The sheet could not be read. Reload to try again." }[state];
  return (
    <div>
      <div style={{ padding: "16px 16px 0", maxWidth: 1352, margin: "0 auto", display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <b style={{ fontSize: 22, fontWeight: 600 }}>{student.name}</b>
        {state === "shown" ? <span style={{ fontSize: 15, color: TOKENS.TEXT.secondary }}>{submitted ? "Submitted " + new Date(submitted).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Started, not submitted"}</span> : null}
      </div>
      {say ? <p style={{ fontSize: 17, padding: "16px 16px 0", maxWidth: 1352, margin: "0 auto" }}>{say}</p> : null}
      <div ref={ref} />
    </div>
  );
}

// A worksheet built in this repo, for the student signed in: the store writes
// as them, the way the package's sheet does. The photograph on their card
// becomes their picture on the terminal, and the roster, less themselves, is
// who they can name as a co-worker.
function LocalSheet({ local, config, viewer, photo, classmates }) {
  const ref = useRef(null);
  const names = classmates.join("\n");
  useEffect(() => {
    const store = supabaseStore({ supabase: gameClient, worksheetKey: local.key, groupKey: config.id, viewerId: viewer.id });
    const sheet = local.mount(ref.current, { store, viewer, photo, classmates: names ? names.split("\n") : [] });
    return () => sheet.destroy();
  }, [local, config.id, viewer.id, viewer.name, photo, names]);
  return <div ref={ref} />;
}

// The Brady-Manning Work Index, readable: /<class>/worksheets/worktopia?index.
// Andrew, 2026-10-01: "make sure i can see the list."
function JobIndex() {
  const total = CATEGORIES.reduce((n, [, t]) => n + t.length, 0);
  const col = { columns: "3 240px", columnGap: 28, margin: 0, padding: 0, listStyle: "none", fontSize: 15, lineHeight: 1.5 };
  return (
    <div style={{ padding: "16px 16px 48px", maxWidth: 1352, margin: "0 auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 4px" }}>The Brady-Manning Work Index</h1>
      <p style={{ fontSize: 16, color: TOKENS.TEXT.secondary, margin: "0 0 28px" }}>{total.toLocaleString("en-US")} positions in {CATEGORIES.length} categories, and the {HORRIBLE.length} Worktopia assigns first.</p>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 10px" }}>Assigned first</h2>
      <ol style={{ ...col, marginBottom: 32 }}>{HORRIBLE.map(t => <li key={t}>{t}</li>)}</ol>
      {CATEGORIES.map(([category, titles]) => (
        <section key={category} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 10px" }}>{category} <span style={{ fontWeight: 400, color: TOKENS.TEXT.secondary, fontSize: 15 }}>{titles.length}</span></h2>
          <ul style={col}>{titles.map(t => <li key={t}>{t}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}

export default function WorksheetPage({ config, worksheetKey }) {
  const [data] = useClassState(config.storageKey);
  const { session, email, instructor } = useSession();
  const local = localWorksheet(worksheetKey);
  const sheet = local || WORKSHEETS.find(w => w.key === worksheetKey);
  const [photos] = usePhotos(config.storageKey);
  // The student's theme and their day or night, the same ones the class home
  // reads. Without these the page had only Clean's daytime block, so the nav
  // and the page stayed white around a sheet that followed the phone.
  const [theme] = useStudentTheme(config);
  const [mode] = useDayNight(config);

  useEffect(() => {
    document.title = config.code + " · " + (sheet ? sheet.title : "Worksheet");
    setClassFavicon(config);
  }, [config, sheet]);

  const roster = rosterOf(config, data);
  const me = session && !instructor ? studentFor(email, roster) : null;
  const id = String(email || "").trim().toLowerCase();
  // The instructor gets a sheet of their own, under their own email, so the
  // worksheet can be tried before it is sent.
  const viewer = me ? { id, name: me.name } : session && instructor ? { id, name: config.instructor?.name || "Instructor" } : null;
  const next = typeof window !== "undefined" ? window.location.pathname : config.path;

  // A student named in the address: that student's sheet, for the instructor.
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const want = search.get("s") || "";
  const them = want ? findStudent(roster, want) : null;
  const wantIndex = local && search.has("index");

  let body;
  if (wantIndex) {
    body = "index";
  } else if (sheet && want) {
    body = them && them.email ? "theirs"
      : data === null ? <p style={{ fontSize: 17, margin: 0 }}>Loading the roster.</p>
      : <p style={{ fontSize: 17, margin: 0 }}>There is no student {want} on the {config.code} roster.</p>;
  } else if (!sheet) {
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
  } else if (local && local.open === false && !instructor) {
    // Built, not sent: the instructor tries it under their own email first.
    body = <p style={{ fontSize: 17, margin: 0 }}>This worksheet is not open yet.</p>;
  } else {
    body = null;
  }
  const classmates = roster.map(s => s.name).filter(n => n && !(me && n === me.name));

  return (
    <div data-theme={theme} data-mode={mode} style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body }}>
      <ThemeStyle theme={theme} />
      <div style={{ position: "sticky", top: 0, zIndex: 30 }}>
        <TopNav config={config} tabs={NAV_STUDENT} active="assignments" />
      </div>
      {body === "index"
        ? <JobIndex />
        : body === "theirs"
        ? <TheirSheet config={config} worksheetKey={worksheetKey} student={them} theme={sheetThemeOf(theme, mode)} photo={photos[them.name] || ""} />
        : body !== null
        ? <div style={{ padding: 32 }}>{body}</div>
        : local
        ? <LocalSheet key={viewer.id} local={local} config={config} viewer={viewer} photo={(me && photos[me.name]) || ""} classmates={classmates} />
        : <Worksheet key={viewer.id} supabase={gameClient} worksheetKey={worksheetKey} groupKey={config.id} viewer={viewer}
            accent={config.accent} accentLight={config.accentLight} accentDark={config.accentDark} theme={sheetThemeOf(theme, mode)} />}
    </div>
  );
}
