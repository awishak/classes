// Ask page — where the QR on the room screen lands. Students sign in with the
// same accounts the classes already use: pick your name, enter your 6-digit
// PIN. The PIN lives in data.pins, keyed by student name; a student with no PIN
// set yet just picks their name, which matches how the older classes behave.
//
// Confidential, not anonymous: I see who asked unless they tick the box, and
// the room screen never shows a name either way.

import { useState, useEffect } from "react";
import { useQuestions } from "./questions.js";
import { useClassData } from "./store.js";
import { sendSignInEmail, verifyEmailCode, emailFromRedirect, loadEmailMap, saveEmailName } from "./auth.js";
import { usePoll, openRound, isFreeForm } from "./poll.js";
import { useHeadlines, liveSession, activeItem } from "./headlines.js";
import * as TOKENS from "./tokens.js";
import { useStudentTheme, ThemeStyle } from "./ThemeShell.jsx";
import { ThemeChrome, ThemeTopper, TubeySays } from "./ThemeChrome.jsx";

// The theme's face. Outfit on Clean and Business, Nunito on Snapchat,
// Fredoka on Crashing Out. One declaration, and every use below follows.
const F = TOKENS.FONT.body;
const TEXT_PRIMARY = TOKENS.TEXT.primary;
const TEXT_SECONDARY = TOKENS.TEXT.secondary;
const TEXT_MUTED = TOKENS.TEXT.muted; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = TOKENS.LINE.soft;
const BORDER_STRONG = TOKENS.LINE.strong;
const BG = TOKENS.SURFACE.page;
const RED = TOKENS.STATE.late;

const input = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: 48, background: "#fff", color: TEXT_PRIMARY };
const bigBtn = (bg) => ({ ...input, minHeight: 48, cursor: "pointer", fontWeight: 600, border: "none", background: bg, color: "#fff", textAlign: "center" });

// Sort by last name, the way the roster reads in the room. Names that do not
// split on the last space (compound surnames) are listed in the class config.
export const lastNameOf = (name, overrides) =>
  (overrides && overrides[name]) || name.trim().split(/\s+/).slice(-1)[0];
const byLast = (overrides) => (a, b) =>
  lastNameOf(a, overrides).localeCompare(lastNameOf(b, overrides)) || a.localeCompare(b);

// Headlines from the student side: post one, then read the live one twice.
function HeadlinesBlock({ config, HL, session, item, phase, who, which, picks }) {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [local, setLocal] = useState(picks);
  const [posted, setPosted] = useState(false);
  useEffect(() => { setLocal(picks); }, [item?.id, phase]);

  const concepts = HL.hl?.concepts || [];
  const options = phase === "surface" ? (HL.hl?.categories || []) : concepts.map(c => c.id);
  const nameOf = (o) => phase === "surface" ? o : ((concepts.find(c => c.id === o) || {}).name || o);
  const toggle = (o) => setLocal(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);

  const box = { display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: 14,
    border: "1px solid " + config.accent, background: "#fff" };
  const eyebrow = { fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: config.accent };

  if (!item) {
    return (
      <div style={box}>
        <div style={eyebrow}>Headlines</div>
        <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5 }}>Post a sports headline you saw this week.</div>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="The headline" style={input} />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Link (optional)" style={input} />
        <button onClick={() => { if (!text.trim()) return; HL.submit(session.id, text, url, who); setText(""); setUrl(""); setPosted(true); setTimeout(() => setPosted(false), 3000); }}
          disabled={!text.trim()} style={bigBtn(text.trim() ? config.accent : BORDER_STRONG)}>Post the question</button>
        {posted ? <div style={{ color: config.accent, fontWeight: 600 }}>Posted. Add another question any time.</div> : null}
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div style={box}>
        <div style={eyebrow}>Headlines</div>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35 }}>{item.text}</div>
        <div style={{ fontSize: 15, color: TEXT_SECONDARY }}>Both reads are up on the screen.</div>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={eyebrow}>{phase === "surface" ? "What does the headline say, on its face?" : "What is really going on?"}</div>
      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35 }}>{item.text}</div>
      {item.url ? <a href={item.url} target="_blank" rel="noreferrer" style={{ color: config.accent, fontSize: 15 }}>Read it ↗</a> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(o => {
          const on = local.includes(o);
          return (
            <button key={o} onClick={() => toggle(o)}
              style={{ ...input, width: "auto", minHeight: 44, padding: "0 14px", cursor: "pointer", fontSize: 15, fontWeight: 500,
                background: on ? config.accent : "#fff", color: on ? "#fff" : TEXT_PRIMARY,
                border: "1px solid " + (on ? config.accent : BORDER_STRONG) }}>{nameOf(o)}</button>
          );
        })}
      </div>
      <button onClick={() => HL.lockIn(session.id, who, local, which)} disabled={!local.length}
        style={bigBtn(local.length ? config.accent : BORDER_STRONG)}>
        {picks.length ? "Change my answer" : "Lock it in"}
      </button>
      <div style={{ fontSize: 13, color: TEXT_MUTED }}>Pick as many as apply.</div>
    </div>
  );
}

function FreeAnswer({ who, vote, accent, mine }) {
  const [text, setText] = useState(typeof mine === "string" ? mine : "");
  const [sent, setSent] = useState(typeof mine === "string");
  const send = () => { if (!text.trim()) return; vote(who, text.trim()); setSent(true); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea value={text} onChange={e => { setText(e.target.value); setSent(false); }}
        placeholder="In your own words" rows={3}
        style={{ ...input, minHeight: 96, lineHeight: 1.5, resize: "vertical" }} />
      <button onClick={send} disabled={!text.trim()}
        style={{ ...bigBtn(text.trim() ? accent : "#d1d5db") }}>{sent ? "Sent. Send again to change your answer." : "Send"}</button>
    </div>
  );
}

export default function AskPage({ config }) {
  const { add } = useQuestions(config.storageKey);
  const { poll, vote } = usePoll(config.storageKey);
  const [data] = useClassData(config.storageKey);
  const HL = useHeadlines(config.storageKey, { categories: data?.headlineCategories, concepts: config.concepts });
  const REMEMBER = config.storageKey + "-user";

  const [who, setWho] = useState(null);
  const [picking, setPicking] = useState(null);
  const [mode, setMode] = useState(null);        // null | "name" | "email"
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(null); // an address we have proven
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = config.code + " — Ask";
    try { const v = localStorage.getItem(REMEMBER); if (v) setWho(v); } catch { /* private mode */ }
    // Coming back from a sign-in link.
    emailFromRedirect().then(addr => { if (addr) acceptEmail(addr); });
  }, [config.code, REMEMBER]);

  // An address we have proven belongs to this person. If we already know which
  // student it is, they are in; otherwise they name themselves once.
  const acceptEmail = async (addr) => {
    const map = await loadEmailMap(config.storageKey);
    const known = map[addr.toLowerCase()];
    if (known) {
      try { localStorage.setItem(REMEMBER, known); } catch { /* private mode */ }
      setWho(known);
    } else {
      setVerified(addr);
      setMode("name");
    }
  };

  const mailLink = async () => {
    const addr = email.trim().toLowerCase();
    if (!addr) { setError("Enter your email first."); return; }
    setBusy(true); setError("");
    const r = await sendSignInEmail(addr, window.location.origin + config.path + "/ask");
    setBusy(false);
    if (r.ok) setLinkSent(true); else setError(r.error);
  };

  const useCode = async () => {
    const addr = email.trim().toLowerCase();
    if (!addr || emailCode.trim().length < 6) return;
    setBusy(true); setError("");
    const r = await verifyEmailCode(addr, emailCode.trim());
    setBusy(false);
    if (r.ok) acceptEmail(r.email); else setError(r.error);
  };

  const students = (data?.students || config.students || []).map(s => s.name).filter(n => n !== config.testStudent);
  const pins = data?.pins || {};

  const signIn = () => {
    // An address we already proved stands in for the PIN.
    if (!verified) {
      const correct = pins[picking];
      if (correct && pin !== String(correct)) { setError("Wrong PIN"); setPin(""); return; }
    }
    if (remember) { try { localStorage.setItem(REMEMBER, picking); } catch { /* private mode */ } }
    if (verified) saveEmailName(config.storageKey, verified, picking);
    setWho(picking);
  };

  const send = () => {
    if (!text.trim()) return;
    add({ text: text.trim(), who: anon ? "" : who, anon });
    setText(""); setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  const [theme] = useStudentTheme(config);
  const wrap = { minHeight: "100vh", background: BG, fontFamily: F, color: TEXT_PRIMARY, display: "flex", justifyContent: "center", padding: "40px 20px" };
  const card = { width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 };
  const header = (
    <>
      <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600 }}>{config.code} · {config.name}</div>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.02em" }}>Ask me anything</h1>
    </>
  );

  // ─── PIN step ───
  if (!who && picking) {
    const needsPin = !!pins[picking] && !verified;
    return (
      <div data-theme={theme} style={wrap}><ThemeStyle theme={theme} /><ThemeChrome theme={theme} /><ThemeTopper theme={theme} lines={["ASK ME ANYTHING", "IT IS CONFIDENTIAL"]} fixed />
        <div style={card}>
          {header}
          <div style={{ fontSize: 22, fontWeight: 600 }}>{picking}</div>
          {needsPin ? (
            <>
              <input autoFocus type="password" inputMode="numeric" maxLength={6} value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                onKeyDown={e => e.key === "Enter" && signIn()}
                placeholder="6-digit PIN"
                style={{ ...input, textAlign: "center", fontSize: 22, fontWeight: 600, letterSpacing: ".3em" }} />
              {error ? <div style={{ color: RED, fontWeight: 500, textAlign: "center" }}>{error}</div> : null}
            </>
          ) : (
            <div style={{ color: TEXT_SECONDARY, lineHeight: 1.5 }}>
              {verified ? "Signed in as " + verified + ". We'll remember this is you." : "No PIN set on your account yet, so this is just your name for now."}
            </div>
          )}
          <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 15, color: TEXT_SECONDARY, cursor: "pointer", minHeight: 44 }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 20, height: 20 }} />
            Remember me on this device
          </label>
          <button onClick={signIn} style={bigBtn(config.accent)}>Sign in</button>
          <button onClick={() => { setPicking(null); setPin(""); setError(""); }}
            style={{ ...input, minHeight: 44, cursor: "pointer", fontWeight: 500, color: TEXT_SECONDARY, background: "#fff", textAlign: "center" }}>Back</button>
        </div>
      </div>
    );
  }

  // ─── email step ───
  if (!who && mode === "email") {
    return (
      <div data-theme={theme} style={wrap}><ThemeStyle theme={theme} /><ThemeChrome theme={theme} /><ThemeTopper theme={theme} lines={["ASK ME ANYTHING", "IT IS CONFIDENTIAL"]} fixed />
        <div style={card}>
          {header}
          <p style={{ margin: 0, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
            We'll email you a sign-in link. The same email carries a 6-digit code if you'd rather type it.
          </p>
          <input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="you@scu.edu" style={input} />
          <button onClick={mailLink} disabled={busy || !email.trim()} style={bigBtn(email.trim() ? config.accent : BORDER_STRONG)}>
            {busy ? "Sending…" : "Email me a sign-in link"}
          </button>
          {linkSent ? <div style={{ color: config.accent, fontWeight: 600 }}>Sent. Check your inbox.</div> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <input inputMode="numeric" maxLength={6} value={emailCode}
              onChange={e => { setEmailCode(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={e => e.key === "Enter" && useCode()}
              placeholder="6-digit code" style={{ ...input, textAlign: "center", letterSpacing: ".25em", fontWeight: 600 }} />
            <button onClick={useCode} disabled={busy || emailCode.length < 6}
              style={{ ...input, width: "auto", padding: "0 20px", cursor: "pointer", fontWeight: 600, background: "#fff", color: TEXT_PRIMARY }}>Go</button>
          </div>
          {error ? <div style={{ color: RED, fontWeight: 500 }}>{error}</div> : null}
          <button onClick={() => { setMode(null); setError(""); setLinkSent(false); }}
            style={{ background: "none", border: "none", color: TEXT_MUTED, fontSize: 15, cursor: "pointer", textAlign: "left", padding: 0 }}>
            ← Other ways in
          </button>
        </div>
      </div>
    );
  }

  // ─── how do you want in ───
  if (!who && mode === null) {
    return (
      <div data-theme={theme} style={wrap}><ThemeStyle theme={theme} /><ThemeChrome theme={theme} /><ThemeTopper theme={theme} lines={["ASK ME ANYTHING", "IT IS CONFIDENTIAL"]} fixed />
        <div style={card}>
          {header}
          <p style={{ margin: 0, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
            Two ways in, whichever is faster for you. I see who asked; the class never does.
          </p>
          <button onClick={() => setMode("name")} style={bigBtn(config.accent)}>Name and PIN</button>
          <button onClick={() => setMode("email")}
            style={{ ...input, minHeight: 48, cursor: "pointer", fontWeight: 600, textAlign: "center", color: TEXT_PRIMARY }}>
            Email me a link
          </button>
        </div>
      </div>
    );
  }

  // ─── name step ───
  if (!who) {
    return (
      <div data-theme={theme} style={wrap}><ThemeStyle theme={theme} /><ThemeChrome theme={theme} /><ThemeTopper theme={theme} lines={["ASK ME ANYTHING", "IT IS CONFIDENTIAL"]} fixed />
        <div style={card}>
          {header}
          <p style={{ margin: 0, color: TEXT_SECONDARY, lineHeight: 1.5 }}>
            {verified ? "Signed in as " + verified + ". Which one are you?" : "Find your name."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {students.slice().sort(byLast(config.lastNameOverrides)).map(n => (
              <button key={n} onClick={() => { setPicking(n); setPin(""); setError(""); }}
                style={{ ...input, minHeight: 52, textAlign: "left", cursor: "pointer", fontWeight: 500, border: "1px solid " + BORDER }}>
                {n}
              </button>
            ))}
            {students.length === 0 ? <div style={{ color: TEXT_MUTED }}>No roster loaded yet.</div> : null}
          </div>
          {!verified ? (
            <button onClick={() => setMode(null)}
              style={{ background: "none", border: "none", color: TEXT_MUTED, fontSize: 15, cursor: "pointer", textAlign: "left", padding: 0 }}>
              ← Other ways in
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // ─── ask step ───
  const hlSession = HL.hl ? liveSession(HL.hl) : null;
  const hlItem = HL.hl ? activeItem(HL.hl, hlSession) : null;
  const hlPhase = hlSession?.phase || "surface";
  const which = hlPhase === "surface" ? "votes" : "conceptVotes";
  const myHlPicks = (hlSession?.[which] || {})[who] || [];
  const round = openRound(poll);
  const myVote = round ? (poll[round] || {})[who] : null;
  const LETTERS = ["A", "B", "C", "D", "E"];

  return (
    <div data-theme={theme} style={wrap}><ThemeStyle theme={theme} /><ThemeChrome theme={theme} /><ThemeTopper theme={theme} lines={["ASK ME ANYTHING", "IT IS CONFIDENTIAL"]} fixed />
      <div style={card}>
        <div style={{ fontSize: 13, color: TEXT_MUTED, fontWeight: 600 }}>{config.code} · {who}</div>

        {round ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, borderRadius: 14,
            border: "1px solid " + config.accent, background: "#fff" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: config.accent }}>
              {poll.phase === "vote2" ? "Vote again" : "Vote"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, letterSpacing: "-.01em" }}>{poll.question}</div>
            {isFreeForm(poll) ? (
              <FreeAnswer who={who} vote={vote} accent={config.accent} mine={myVote} />
            ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {poll.options.map((o, i) => {
                const mine = myVote === i;
                return (
                  <button key={i} onClick={() => vote(who, i)}
                    style={{ ...input, minHeight: 56, textAlign: "left", cursor: "pointer", display: "flex",
                      alignItems: "center", gap: 12, fontWeight: 500,
                      background: mine ? config.accent : "#fff", color: mine ? "#fff" : TEXT_PRIMARY,
                      border: "1px solid " + (mine ? config.accent : BORDER_STRONG) }}>
                    <span style={{ fontWeight: 700, opacity: mine ? .85 : .5 }}>{LETTERS[i]}</span>
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
            )}
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>
              {isFreeForm(poll)
                ? "Your name is on this question, so I can follow up with you."
                : myVote != null ? "Locked in. Change it any time before the floor closes." : "Pick an answer. Nobody sees who picked what."}
            </div>
          </div>
        ) : null}

        {hlSession ? (
          <HeadlinesBlock config={config} HL={HL} session={hlSession} item={hlItem} phase={hlPhase}
            who={who} which={which} picks={myHlPicks} />
        ) : null}

        <h1 style={{ margin: (round || hlSession) ? "8px 0 0" : 0, fontSize: (round || hlSession) ? 21 : 28, fontWeight: 600, letterSpacing: "-.02em" }}>Ask me anything</h1>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What's your question?"
          style={{ ...input, minHeight: 130, resize: "vertical", lineHeight: 1.5 }} />
        <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 15, color: TEXT_SECONDARY, cursor: "pointer", minHeight: 44 }}>
          <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ width: 20, height: 20 }} />
          Send this one anonymously
        </label>
        <button onClick={send} disabled={!text.trim()} style={bigBtn(text.trim() ? config.accent : BORDER_STRONG)}>Send</button>
        {sent ? <div style={{ color: config.accent, fontWeight: 600, fontSize: 15 }}>Sent. Ask another any time.</div> : null}
        <button onClick={() => { setWho(null); setPicking(null); setMode(null); setVerified(null); try { localStorage.removeItem(REMEMBER); } catch { /* private mode */ } }}
          style={{ background: "none", border: "none", color: TEXT_MUTED, fontSize: 15, cursor: "pointer", textAlign: "left", padding: 0, marginTop: 4 }}>
          Not {who}?
        </button>
      </div>
    </div>
  );
}
