// A worksheet's submits, counted on the assignment that links to it.
//
// A worksheet keeps its own rows (worksheet_sheets), and submitting one never
// wrote to the class's assignmentLog. So Weekly Challenge 1 in COMM 118,
// which links to the stakeholder map, showed three submissions, the three
// Andrew had put in by hand, while 25 students had submitted the sheet.
// Andrew, 2026-09-29, choosing between copying them in and reading them:
// "read them from the worksheet".
//
// So this reads them and lays them over the log for display, the way
// photos.js lays the photographs over the profiles. Nothing here is saved.
// Every write in the app goes through update(prev => ...), and prev is the
// stored class, which never holds these entries. A submit that is recalled
// drops out on the next read.
//
// The instructor reads every sheet through /api/worksheet-submits, which takes
// the PIN or an instructor session. Anyone else reads under the rules: a
// student sees only their own sheet, and nobody signed in sees nothing.

import { useEffect, useMemo, useState } from "react";
import { gameClient } from "./gameClient.js";
import { rosterOf, idOf } from "./roster.js";
import { authHeaders } from "./session.js";
import { savedPin } from "../InstructorGate.jsx";
import { hasPage, sheetKeyOf } from "./submissionPages.js";

// The worksheet an assignment points at, from its details link:
// /<class>/worksheets/<key>, on this site or written as a full address.
//
// With the class given, an assignment that carries a submission page
// (submissionPages.js) is a worksheet too, keyed asg-<term>-<id>, and its
// base is the worksheet address on this site. Without the class only the
// linked kind is found, which is what MyWork wants: a page assignment's own
// page is the student's way in, not a worksheet address.
const SHEET = /\/(comm\w+)\/worksheets\/([a-z0-9-]+)\/?(?:[?#].*)?$/;
export const worksheetOf = (asg, config) => {
  const m = String(asg?.instructionsUrl || "").trim().match(SHEET);
  if (m) return { classId: m[1], key: m[2], base: String(asg.instructionsUrl).trim().replace(/[?#].*$/, "").replace(/\/$/, "") };
  if (config && hasPage(asg, config)) { const key = sheetKeyOf(config, asg); return { classId: config.id, key, base: "/" + config.id + "/worksheets/" + key }; }
  return null;
};

const alive = (log) => (log || []).filter(e => !e.deleted);

// The class with each linked worksheet's submits in its assignmentLog.
// sheets: { [worksheetKey]: [{ viewer_id, submitted_at }] }.
// A student who already has a submission in the log keeps theirs, with its
// link pointed at their own sheet when it pointed at the worksheet.
//
// Every link names the student: <worksheet>?s=<roster id>. The worksheet
// alone opens whoever is signed in, which for the instructor was his own test
// sheet. Andrew, 2026-09-29: "when it says open their file, it's my file ...
// you have to give the ability to look at anyone's file."
export function withWorksheetSubmits(data, config, sheets) {
  if (!data || !sheets) return data;
  const assignments = data.assignments || config.assignments || [];
  const byEmail = new Map(rosterOf(config, data).filter(s => s.email).map(s => [String(s.email).trim().toLowerCase(), s]));
  let al = null;
  assignments.forEach(asg => {
    const ws = worksheetOf(asg, config);
    if (!ws || ws.classId !== config.id) return;
    const base = ws.base;
    const theirs = (s) => base + "?s=" + encodeURIComponent(idOf(s));
    const toSheet = (link) => String(link || "").replace(/[?#].*$/, "").replace(/\/$/, "") === base;
    const byName = new Map(rosterOf(config, data).map(s => [String(s.name || "").trim().toLowerCase(), s]));
    (sheets[ws.key] || []).forEach(sh => {
      const owner = byEmail.get(sh.viewer_id);
      if (!owner || !sh.submitted_at) return;
      // A sheet that names a group (3x5) is a submission for each of them,
      // every link pointed at the owner's file, where the roll lives.
      const group = [owner, ...(sh.names || []).map(n => byName.get(String(n).trim().toLowerCase())).filter(s => s && s !== owner)];
      group.forEach(s => {
        const log = (al || data.assignmentLog || {})[asg.id]?.[s.name];
        const live = alive(log).filter(e => e.type === "submission");
        if (live.length && !live.some(e => toSheet(e.link))) return;
        al = al || { ...(data.assignmentLog || {}) };
        const kept = (log || []).map(e => e.type === "submission" && toSheet(e.link) ? { ...e, link: theirs(owner) } : e);
        al[asg.id] = { ...(al[asg.id] || {}), [s.name]: live.length ? kept : [...kept, {
          id: "ws-" + asg.id + "-" + sh.viewer_id, ts: Date.parse(sh.first_submitted_at || sh.submitted_at), type: "submission",
          link: theirs(owner), worksheet: ws.key,
        }].sort((a, b) => (a.ts || 0) - (b.ts || 0)) };
      });
    });
  });
  return al ? { ...data, assignmentLog: al } : data;
}

// The submitted sheets for every worksheet the class's assignments link to.
// Read again when the window comes back into focus, so a submit made while
// the page sat open shows up on return.
export function useWorksheetSheets(config, data) {
  const keys = useMemo(() => {
    const list = (data?.assignments || config.assignments || []).map(a => worksheetOf(a, config)).filter(w => w && w.classId === config.id).map(w => w.key);
    return [...new Set(list)].sort().join(",");
  }, [data?.assignments, config]);
  const [sheets, setSheets] = useState(null);
  useEffect(() => {
    if (!keys) { setSheets(null); return undefined; }
    let alive = true;
    const load = async () => {
      // The instructor: every sheet, through the server, PIN or session.
      try {
        const r = await fetch("/api/worksheet-submits", {
          method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ pin: savedPin(), groupKey: config.id, keys: keys.split(",") }),
        });
        const out = r.ok ? await r.json() : null;
        if (out?.ok) { if (alive) setSheets(out.sheets); return; }
      } catch { /* fall through to the student's own read */ }
      // A student: their own sheet, under the rules.
      const out = {};
      for (const key of keys.split(",")) {
        // first_submitted_at dates the submit (lateness.js); the read falls
        // back without it until sql/worksheet-first-submitted.sql has run.
        let r = await gameClient.from("worksheet_sheets").select("viewer_id,submitted_at,first_submitted_at")
          .eq("worksheet_key", key).eq("group_key", config.id).not("submitted_at", "is", "null");
        if (r.error) r = await gameClient.from("worksheet_sheets").select("viewer_id,submitted_at")
          .eq("worksheet_key", key).eq("group_key", config.id).not("submitted_at", "is", "null");
        if (r.error) return;   // keep what is showing; the next focus tries again
        out[key] = r.data || [];
      }
      if (alive) setSheets(out);
    };
    load();
    window.addEventListener("focus", load);
    return () => { alive = false; window.removeEventListener("focus", load); };
  }, [keys, config.id]);
  return sheets;
}

/** The class as every screen reads it, with the worksheet submits laid over. */
export function useWithWorksheetSubmits(data, config) {
  const sheets = useWorksheetSheets(config, data);
  return useMemo(() => withWorksheetSubmits(data, config, sheets), [data, config, sheets]);
}
