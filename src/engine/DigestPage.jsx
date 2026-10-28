// /digest: the morning messages, on a page. What the email says, with a Send
// under each draft, because an email cannot act and a page can. Andrew,
// 2026-10-28: "I don't want you to send these things without my permission."
// Nothing leaves this page until he presses Send.

import { useEffect, useState } from "react";
import { authHeaders } from "./session.js";
import { savedPin } from "../InstructorGate.jsx";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary, TEXT_MUTED = TOKENS.TEXT.muted;
const LINE = TOKENS.LINE.soft, LINE_STRONG = TOKENS.LINE.strong;
const CARD = TOKENS.SURFACE.card, SUNK = TOKENS.SURFACE.sunk;
const HIT = TOKENS.HIT;

const when = (ts) => { try { return new Date(ts).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };

async function call(body) {
  const r = await fetch("/api/digest", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ pin: savedPin(), ...body }) });
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.ok) throw new Error(out.error || ("HTTP " + r.status));
  return out;
}

const SECTIONS = [["high", "Needs you"], ["normal", "Routine"], ["none", "No reply needed"]];

export default function DigestPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [mail, setMail] = useState("");

  useEffect(() => { call({ action: "preview" }).then(out => setItems(out.items)).catch(e => setError(e.message)); }, []);

  const drop = (id) => setItems(list => list.filter(it => it.id !== id));
  const sendMail = async () => {
    setMail("Sending the email");
    try { const out = await call({ action: "send" }); setMail(out.mail?.sent ? "Emailed to " + out.mail.to : out.mail?.why || "Not sent"); }
    catch (e) { setMail(e.message); }
  };

  const btn = (solid) => ({ minHeight: HIT, padding: "0 14px", borderRadius: 8, fontFamily: F, fontSize: 15, fontWeight: 600, cursor: "pointer",
    background: solid ? TEXT_PRIMARY : CARD, color: solid ? CARD : TEXT_PRIMARY, border: "1px solid " + (solid ? TEXT_PRIMARY : LINE_STRONG) });

  return (
    <div style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, fontFamily: F, color: TEXT_PRIMARY }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 80px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em" }}>Messages</h1>
          {items ? <span style={{ fontSize: 15, color: TEXT_MUTED }}>{items.length ? items.length + " waiting" : "Nothing waiting"}</span> : null}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {mail ? <span style={{ fontSize: 13, color: TEXT_MUTED }}>{mail}</span> : null}
            <button className="gv-focus" style={btn(false)} onClick={sendMail}>Email the digest</button>
          </span>
        </div>
        {error ? <p style={{ fontSize: 15, color: TOKENS.STATE.late }}>{error}</p> : null}
        {!items && !error ? <p style={{ fontSize: 15, color: TEXT_MUTED }}>Reading the messages and drafting replies.</p> : null}
        {items ? SECTIONS.map(([p, title]) => {
          const list = items.filter(it => it.priority === p);
          if (!list.length) return null;
          return (
            <section key={p} style={{ marginTop: 28 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700 }}>{title}</h2>
              {list.map(it => <Item key={it.id} it={it} btn={btn} onDone={() => drop(it.id)} />)}
            </section>
          );
        }) : null}
      </div>
    </div>
  );
}

function Item({ it, btn, onDone }) {
  const [reply, setReply] = useState(it.reply || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const act = async (body) => {
    setBusy(body.action); setError("");
    try { await call({ ...body, classKey: it.classKey, name: it.name }); onDone(); }
    catch (e) { setError(e.message); setBusy(""); }
  };
  return (
    <div style={{ background: CARD, border: "1px solid " + LINE, borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED }}>
        {it.code} · <a href={it.link} style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{it.name}</a>{it.section ? " · " + it.section : ""} · {when(it.at)}{it.kind === "challenge" ? " · on " + it.assignment : ""}
      </div>
      {it.about ? <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{it.about}</div> : null}
      <div style={{ fontSize: 15, lineHeight: 1.5, marginTop: 6, whiteSpace: "pre-wrap" }}>{it.text}</div>
      {it.priority !== "none" ? (
        <textarea value={reply} onChange={e => setReply(e.target.value)} aria-label={"Reply to " + it.name} rows={Math.max(3, Math.ceil(reply.length / 70) + 1)}
          style={{ display: "block", width: "100%", boxSizing: "border-box", marginTop: 12, padding: 10, fontFamily: F, fontSize: 16, lineHeight: 1.5, color: TEXT_PRIMARY,
            background: SUNK, border: "1px solid " + LINE_STRONG, borderRadius: 8, resize: "vertical" }} />
      ) : null}
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        {it.priority !== "none" ? <button className="gv-focus" style={btn(true)} disabled={!!busy || !reply.trim()} onClick={() => act({ action: "reply", text: reply.trim(), aid: it.aid })}>{busy === "reply" ? "Sending" : "Send"}</button> : null}
        {!it.aid ? <button className="gv-focus" style={btn(false)} disabled={!!busy} onClick={() => act({ action: "seen" })}>{it.priority === "none" ? "Mark read" : "No reply"}</button> : null}
        {error ? <span style={{ fontSize: 13, color: TOKENS.STATE.late }}>{error}</span> : null}
      </div>
    </div>
  );
}
