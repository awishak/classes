// Reopen one student's worksheet past its deadline, from wherever he is
// answering them.
//
// Most of what students write him is about late work, and the unlock was a
// script or a trip to the worksheet's control page. This is the same unlock
// (api/worksheet-submits, `unlock`), as a button: press Reopen, pick the
// night it closes. Only a challenge that is a worksheet on this site can be
// reopened here; for any other challenge the button is not drawn.

import { useState } from "react";
import { worksheetOf } from "./worksheetSubmits.js";
import { authHeaders } from "./session.js";
import { savedPin } from "../InstructorGate.jsx";

// 11:59 that night, `days` from today.
const night = (days) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(23, 59, 0, 0); return d; };
const words = (d) => new Date(d).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
// Tomorrow night, Sunday night, and a week from tonight, without a repeat.
const choices = () => {
  const toSunday = (7 - new Date().getDay()) % 7 || 7;
  return [...new Set([1, toSunday, 7])].map(night);
};

export const canReopen = (config, asg, student) => { const ws = worksheetOf(asg, config); return !!(ws && ws.classId === config.id && student?.email); };

export function Reopen({ config, asg, student, onDone, className = "pt-chip pt-focus" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState("");
  if (!canReopen(config, asg, student)) return null;
  const ws = worksheetOf(asg, config);
  const set = async (until) => {
    setBusy(true);
    let out = null;
    try {
      const r = await fetch("/api/worksheet-submits", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ pin: savedPin(), groupKey: config.id, key: ws.key, viewer: String(student.email).trim().toLowerCase(), unlock: { until: until ? until.toISOString() : null } }) });
      out = await r.json().catch(() => null);
    } catch { out = null; }
    setBusy(false);
    if (!out || !out.ok) { setSaid((out && out.error) || "The unlock did not save."); return; }
    setOpen(false);
    setSaid(out.until ? "Open until " + words(out.until) : "Locked");
    if (out.until && onDone) onDone(words(out.until));
  };
  return (
    <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button type="button" className={className} aria-expanded={open} onClick={() => setOpen(o => !o)}>Reopen</button>
      {open ? choices().map(d => <button key={d.getTime()} type="button" className={className} disabled={busy} onClick={() => set(d)}>{"Until " + words(d)}</button>) : null}
      {open ? <button type="button" className={className} disabled={busy} onClick={() => set(null)}>Lock</button> : null}
      {said ? <span role="status" style={{ fontSize: 14, fontWeight: 600 }}>{said}</span> : null}
    </span>
  );
}
