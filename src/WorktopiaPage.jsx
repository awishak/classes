// Worktopia, open to the public at /worktopia. Andrew, 2026-10-01: "just give
// the public a way to go through worktopia. make it a public version. i'll
// link to it and let people play with it. and then give a ? button at the top
// that has a pop up that has like a 3 paragraph description of what i'm doing
// here." Then: "save what people write! i want to see it."
//
// A visitor is a UUID this browser makes and keeps in localStorage, so a
// reload picks the file up where it stopped and "start over" begins a new
// file under a new id, with the old one kept. The answers go through
// /api/worktopia-public, which holds the service key; there is no roster, no
// calendar, and the file submits itself at the end. The ? and its text are in
// terminal.js (ABOUT). The pictures under public/worktopia are kept, unused.
//
// The instructor reads the files at the same address: /worktopia?files is
// the list, /worktopia?v=<visitor id> is one file, read only.

import { useEffect, useRef, useState } from "react";
import { mountWorktopia } from "./engine/worktopia/terminal.js";
import { publicStore, readStore } from "./engine/worktopia/store.js";
import { useSession, authHeaders } from "./engine/session.js";
import { savedPin } from "./InstructorGate.jsx";

const VISITOR_KEY = "worktopia-visitor";
const visitorId = () => {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) { id = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch { return crypto.randomUUID(); }
};
const newVisitor = () => { try { localStorage.removeItem(VISITOR_KEY); } catch { /* then a fresh id on reload */ } window.location.reload(); };

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const wrap = { minHeight: "100vh", background: "#fafaf9", color: "#1c1917", fontFamily: F, padding: "40px 16px 80px" };
const fonts = <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" />;
const when = (iso) => iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "not finished";

async function ask(body) {
  const r = await fetch("/api/worktopia-public", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), ...body }) });
  if (r.status === 401) return { ok: false, denied: true };
  return r.json().catch(() => ({ ok: false }));
}

// The visitor's run.
function Run() {
  const ref = useRef(null);
  useEffect(() => {
    const sheet = mountWorktopia(ref.current, { store: publicStore({ visitorId: visitorId() }), viewer: null, photo: null, classmates: [], visitor: true, restart: newVisitor });
    return () => sheet.destroy();
  }, []);
  return <div ref={ref} style={{ minHeight: "100vh" }} />;
}

// The instructor's list of files.
function Files() {
  const [out, setOut] = useState(null);
  useEffect(() => { ask({ action: "list" }).then(setOut); }, []);
  if (!out) return <p>Loading the files.</p>;
  if (out.denied) return <p>Sign in as the instructor to read the files. <a href={"/login?next=" + encodeURIComponent("/worktopia?files")} style={{ color: "#1e40af" }}>Sign in</a></p>;
  if (!out.ok) return <p>Could not read the files.</p>;
  const done = out.sheets.filter(s => s.submitted_at).length;
  return (
    <>
      <p style={{ color: "#57534e", margin: "0 0 20px" }}>{out.sheets.length} files, {done} finished. Newest finished first.</p>
      <table style={{ borderCollapse: "collapse", fontSize: 16, width: "100%", maxWidth: 720 }}>
        <thead><tr style={{ textAlign: "left", color: "#6b655f", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}><th style={{ padding: "6px 12px 6px 0" }}>Name</th><th style={{ padding: "6px 12px" }}>Finished</th><th></th></tr></thead>
        <tbody>{out.sheets.map(s => (
          <tr key={s.viewer_id} style={{ borderTop: "1px solid #e3ded8" }}>
            <td style={{ padding: "10px 12px 10px 0" }}>{s.name || <span style={{ color: "#6b655f" }}>no name yet</span>}</td>
            <td style={{ padding: "10px 12px", color: "#57534e" }}>{when(s.submitted_at)}</td>
            <td style={{ padding: "10px 0" }}><a href={"/worktopia?v=" + encodeURIComponent(s.viewer_id)} style={{ color: "#1e40af", fontWeight: 600 }}>Open file</a></td>
          </tr>
        ))}</tbody>
      </table>
    </>
  );
}

// One visitor's file, read only, for the instructor.
function TheirFile({ viewer }) {
  const ref = useRef(null);
  const [state, setState] = useState("loading");
  useEffect(() => {
    let sheet = null, alive = true;
    ask({ action: "read", viewer }).then(out => {
      if (!alive) return;
      if (out.denied) { setState("denied"); return; }
      if (!out.ok) { setState("failed"); return; }
      if (!out.sheet) { setState("none"); return; }
      setState("shown");
      sheet = mountWorktopia(ref.current, { store: readStore(out.answers, out.sheet.submitted_at), viewer: null, photo: null, readOnly: true });
    });
    return () => { alive = false; if (sheet) sheet.destroy(); };
  }, [viewer]);
  return (
    <>
      {state === "loading" && <p>Loading the file.</p>}
      {state === "denied" && <p>Sign in as the instructor to read a file. <a href={"/login?next=" + encodeURIComponent("/worktopia?v=" + viewer)} style={{ color: "#1e40af" }}>Sign in</a></p>}
      {state === "failed" && <p>Could not read the file.</p>}
      {state === "none" && <p>There is no file for that visitor.</p>}
      <div ref={ref} />
    </>
  );
}

export default function WorktopiaPage() {
  useEffect(() => { document.title = "Worktopia"; }, []);
  useSession();
  const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const viewer = search.get("v") || "";
  if (!search.has("files") && !viewer) return <Run />;
  return (
    <div style={wrap}>
      {fonts}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6b655f", margin: "0 0 8px", fontWeight: 500 }}>Worktopia · public files</p>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em" }}>{viewer ? "One file" : "Every file"}</h1>
        {viewer ? <p style={{ margin: "0 0 20px" }}><a href="/worktopia?files" style={{ color: "#1e40af" }}>All files</a></p> : null}
        {viewer ? <TheirFile viewer={viewer} /> : <Files />}
      </div>
    </div>
  );
}
