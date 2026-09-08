// The roster, with the emails and the sign-in codes.
//
// One sheet on the dashboard with three jobs. Paste a list from the registrar
// and the students land on the roster, matched by email and then by name so
// nobody's id changes. Press Create logins and every student with an email
// gets a Supabase login whose password is a six-digit code, made on the
// server behind the PIN. And read the codes off, for the student who lost
// theirs; a new one is one press.
//
// The roster itself is class data, written the way every screen writes it.
// The codes are not: they live in a table of their own, read through the API
// so the service key never leaves the server.

import { useEffect, useState } from "react";
import { savedPin } from "../InstructorGate.jsx";
import { authHeaders } from "./session.js";
import { parseRoster, mergeRoster, withIds } from "./roster.js";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const MONO = TOKENS.FONT.label;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const SURFACE_2 = TOKENS.SURFACE.sunk;
const OK = TOKENS.STATE.ok;
const WARN = TOKENS.STATE.warn;
const HIT = 36;

const mini = { minHeight: HIT, padding: "0 13px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, background: "#fff", color: TEXT_SECONDARY, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const solid = (accent) => ({ ...mini, background: accent, borderColor: accent, color: "#fff" });
const label = { fontFamily: MONO, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", color: TEXT_MUTED, fontWeight: 500 };
const inputStyle = { width: "100%", padding: "10px 13px", borderRadius: 11, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: 40, background: "#fff", color: TEXT_PRIMARY };

export async function callLogins(body) {
  const r = await fetch("/api/logins", {
    method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ pin: savedPin(), ...body }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.ok) throw new Error(out.error || "The server did not answer.");
  return out;
}

export default function RosterSheet({ students, accent, onSave, sections }) {
  const roster = withIds(students || []);
  const [paste, setPaste] = useState("");
  const [codes, setCodes] = useState(null);          // email -> code, once read
  const [busy, setBusy] = useState("");
  const [said, setSaid] = useState("");
  const [why, setWhy] = useState("");

  const rows = parseRoster(paste);
  const preview = rows.length ? mergeRoster(roster, rows) : null;

  // The codes, read once the sheet opens. A failure here is not the roster's
  // problem, so the table draws without codes and says why.
  useEffect(() => {
    let alive = true;
    callLogins({ action: "list" })
      .then(out => { if (alive) setCodes(Object.fromEntries(out.logins.map(l => [l.email, l.code]))); })
      .catch(e => { if (alive) { setCodes({}); setWhy(e.message); } });
    return () => { alive = false; };
  }, []);

  const addRows = () => {
    if (!preview) return;
    onSave(preview.students);
    setSaid(preview.added + " added, " + preview.updated + " updated.");
    setPaste("");
  };

  const provision = async () => {
    setWhy(""); setBusy("provision");
    try {
      const out = await callLogins({ action: "provision", students: roster.map(s => ({ name: s.name, email: s.email })) });
      setCodes(Object.fromEntries(out.logins.map(l => [l.email, l.code])));
      setSaid(out.made + " logins made" + (out.failed?.length ? ", " + out.failed.length + " failed: " + out.failed.map(f => f.email).join(", ") : "."));
    } catch (e) { setWhy(e.message); }
    setBusy("");
  };

  const [setting, setSetting] = useState("");     // the email whose code is being typed
  const [typed, setTyped] = useState("");
  const setCode = async (email) => {
    if (!/^\d{6}$/.test(typed)) { setWhy("A code is six digits."); return; }
    setWhy(""); setBusy(email);
    try {
      const out = await callLogins({ action: "set", email, code: typed });
      setCodes(c => ({ ...(c || {}), [out.login.email]: out.login.code }));
      setSaid("Code set for " + email + ".");
      setSetting(""); setTyped("");
    } catch (e) { setWhy(e.message); }
    setBusy("");
  };

  const reset = async (email) => {
    setWhy(""); setBusy(email);
    try {
      const out = await callLogins({ action: "reset", email });
      setCodes(c => ({ ...(c || {}), [out.login.email]: out.login.code }));
      setSaid("New code for " + email + ".");
    } catch (e) { setWhy(e.message); }
    setBusy("");
  };

  const withEmail = roster.filter(s => s.email).length;
  const withCode = roster.filter(s => s.email && codes && codes[String(s.email).toLowerCase()]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: F, color: TEXT_PRIMARY }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={label}>{roster.length} students · {withEmail} with an email · {withCode} with a login</span>
        <button style={{ ...solid(accent), marginLeft: "auto" }} onClick={provision} disabled={busy !== "" || !withEmail}
          title="Every student with an email and no login gets a login">
          {busy === "provision" ? "Making logins" : "Create logins"}
        </button>
      </div>
      {said ? <div style={{ fontSize: 13, fontWeight: 600, color: OK }}>{said}</div> : null}
      {why ? <div style={{ fontSize: 13, fontWeight: 600, color: WARN }}>{why}</div> : null}

      <div style={{ border: "1px solid " + BORDER, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: SURFACE_2 }}>
              {["Name", "Email", sections ? "Section" : null, "Code", ""].filter(h => h !== null).map(h => (
                <th key={h || "x"} style={{ ...label, textAlign: "left", padding: "8px 10px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roster.map(s => {
              const email = String(s.email || "").toLowerCase();
              const code = email && codes ? codes[email] : "";
              return (
                <tr key={s.id} style={{ borderTop: "1px solid " + BORDER }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "8px 10px", color: email ? TEXT_SECONDARY : TEXT_MUTED }}>{email || "no email yet"}</td>
                  {sections ? <td style={{ padding: "8px 10px", color: TEXT_SECONDARY }}>{s.section || ""}</td> : null}
                  <td style={{ padding: "8px 10px", fontFamily: MONO, fontSize: 15, letterSpacing: ".12em" }}>
                    {code || (email ? (codes ? <span style={{ ...label, letterSpacing: ".06em" }}>no login yet</span> : "") : "")}
                  </td>
                  <td style={{ padding: "6px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {email && setting === email ? (
                      <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        <input value={typed} onChange={e => setTyped(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric"
                          placeholder="6 digits" aria-label={"A code for " + email} autoFocus
                          onKeyDown={e => { if (e.key === "Enter") setCode(email); if (e.key === "Escape") { setSetting(""); setTyped(""); } }}
                          style={{ ...inputStyle, width: 110, minHeight: 30, padding: "4px 8px", fontFamily: MONO, letterSpacing: ".12em", fontSize: 15 }} />
                        <button style={solid(accent)} disabled={busy !== ""} onClick={() => setCode(email)}>{busy === email ? "Saving" : "Save"}</button>
                        <button style={mini} onClick={() => { setSetting(""); setTyped(""); }}>Cancel</button>
                      </span>
                    ) : email ? (
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <button style={{ ...mini, minHeight: 30, padding: "0 9px", fontSize: 12.5 }} disabled={busy !== ""}
                          onClick={() => { setSetting(email); setTyped(""); setWhy(""); }} title="Type a code for this student">
                          Set a code
                        </button>
                        <button style={{ ...mini, minHeight: 30, padding: "0 9px", fontSize: 12.5 }} disabled={busy !== ""}
                          onClick={() => reset(email)} title="A random code for this student">
                          {busy === email ? "Making" : code ? "Random code" : "Make a login"}
                        </button>
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {!roster.length ? (
              <tr><td colSpan={5} style={{ padding: 14, color: TEXT_MUTED }}>No students yet. Paste the list below.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 12, borderTop: "1px solid " + BORDER }}>
        <span style={{ ...label, color: accent }}>Add students</span>
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>
          One student per line: name, email, and a section if the class has one. Commas or tabs, a header row is fine.
          A student already on the roster keeps their place and picks up the email.
        </div>
        <textarea value={paste} onChange={e => setPaste(e.target.value)} placeholder={"Dan Patry, dpatry@scu.edu\nJoe Hanna, jhanna@scu.edu, 8:00"}
          aria-label="Students to add" style={{ ...inputStyle, minHeight: 96, fontSize: 15, lineHeight: 1.5, resize: "vertical" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={solid(accent)} onClick={addRows} disabled={!preview}>
            {preview ? "Add to roster: " + preview.added + " new, " + preview.updated + " updated" : "Add to roster"}
          </button>
        </div>
      </div>
    </div>
  );
}
