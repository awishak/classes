// Where the room answers the prompt on the screen.
//
// The old hubs had four of these with sixty-six posts, and the engine had
// nowhere to put a post, so the button on the class page had nowhere to send
// anybody. The prompt I cast is the prompt here, and the same prompt cast
// twice is one conversation rather than two half-empty ones.
//
// Signing in is deliberately light. A student already signed in on the Ask
// page is known here, because both read the same remembered name; anyone else
// picks their name off the roster, which is how the older classes behaved.

import { useState, useEffect, useMemo } from "react";
import { useClassData } from "./store.js";
import { useBoards, postsOf, idForPrompt } from "./boards.js";
import { useLive } from "./live.js";
import { lastNameOf } from "./AskPage.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const BG = "#faf9f7";
const TEXT = "#171310";
const MUTED = "#5b6068";
const BORDER = "rgba(23,19,16,.12)";
const LIVE = "#e11d48";
const TAP = 44;

export default function BoardPage({ config }) {
  const [data] = useClassData(config.storageKey);
  const [live] = useLive(config.storageKey);
  const B = useBoards(config.storageKey);
  const REMEMBER = config.storageKey + "-user";

  const [who, setWho] = useState(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = config.code + " — Discussion";
    try { const v = localStorage.getItem(REMEMBER); if (v) setWho(v); } catch { /* private mode */ }
  }, [config.code, REMEMBER]);

  const students = data?.students || config.students || [];
  const boards = B.boards || {};

  // Which board this is: the one named in the address, or the one whose prompt
  // is on the screen this second, or the newest one with anything on it.
  const fromUrl = new URLSearchParams(window.location.search).get("b");
  const castPrompt = live?.cast?.type === "board" ? (live.cast.idea || live.cast.title) : "";
  const boardId = fromUrl
    || (castPrompt ? idForPrompt(castPrompt) : "")
    || Object.values(boards).sort((a, b) => (b.at || 0) - (a.at || 0))[0]?.id
    || "";
  const board = boards[boardId];

  // The prompt is up but nobody has posted yet, so the thread does not exist.
  // Show the prompt anyway and open the thread on the first post.
  const prompt = board?.prompt || castPrompt || "";
  const posts = useMemo(() => postsOf(board), [board]);

  const send = () => {
    const t = text.trim();
    if (!t || !who) return;
    const id = board ? board.id : B.open(prompt);
    B.post(id, who, t);
    setText("");
  };

  const wrap = { minHeight: "100vh", background: BG, fontFamily: F, color: TEXT,
    padding: "clamp(18px,4vw,44px)", display: "flex", justifyContent: "center" };
  const inner = { width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 18 };

  if (!prompt) {
    return (
      <div style={wrap}><div style={inner}>
        <Head config={config} />
        <p style={{ margin: 0, fontSize: 17, color: MUTED }}>No discussion is open right now.</p>
      </div></div>
    );
  }

  if (!who) {
    const hits = students
      .filter(s => s.name.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => lastNameOf(a.name).localeCompare(lastNameOf(b.name)));
    return (
      <div style={wrap}><div style={inner}>
        <Head config={config} />
        <h1 style={{ margin: 0, fontSize: "clamp(23px,4vw,32px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.2 }}>{prompt}</h1>
        <p style={{ margin: 0, fontSize: 16, color: MUTED }}>Pick your name to post.</p>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Your name"
          style={{ width: "100%", minHeight: TAP, padding: "0 14px", fontSize: 17, fontFamily: F,
            border: "1px solid " + BORDER, borderRadius: 12, background: "#fff", color: TEXT }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "50vh", overflowY: "auto" }}>
          {hits.map(s => (
            <button key={s.name} onClick={() => {
              setWho(s.name);
              try { localStorage.setItem(REMEMBER, s.name); } catch { /* private mode */ }
            }}
              style={{ minHeight: TAP, textAlign: "left", padding: "0 14px", fontSize: 17, fontFamily: F,
                background: "#fff", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", color: TEXT }}>
              {s.name}
            </button>
          ))}
        </div>
      </div></div>
    );
  }

  const mine = (p) => p.who === who;
  return (
    <div style={wrap}><div style={inner}>
      <Head config={config} who={who} onOut={() => {
        setWho(null);
        try { localStorage.removeItem(REMEMBER); } catch { /* private mode */ }
      }} />

      <h1 style={{ margin: 0, fontSize: "clamp(23px,4vw,32px)", fontWeight: 600, letterSpacing: "-.03em", lineHeight: 1.2 }}>{prompt}</h1>

      {board?.closed ? (
        <p style={{ margin: 0, fontSize: 16, color: MUTED }}>This discussion is closed.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
            placeholder="Your answer"
            style={{ width: "100%", minHeight: 110, padding: 14, fontSize: 17, lineHeight: 1.5, fontFamily: F,
              border: "1px solid " + BORDER, borderRadius: 14, background: "#fff", color: TEXT, resize: "vertical" }} />
          <button onClick={send} disabled={!text.trim()}
            style={{ alignSelf: "flex-start", minHeight: TAP, padding: "0 22px", fontSize: 17, fontWeight: 600,
              fontFamily: F, borderRadius: 12, border: "none", cursor: text.trim() ? "pointer" : "default",
              background: text.trim() ? config.accent : "#d6d3d1", color: "#fff" }}>
            Post
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, paddingTop: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, letterSpacing: ".1em",
          textTransform: "uppercase", color: MUTED }}>
          {posts.length} {posts.length === 1 ? "answer" : "answers"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {posts.map(p => (
          <article key={p.id}
            style={{ background: "#fff", border: "1px solid " + (mine(p) ? config.accent : BORDER),
              borderRadius: 14, padding: "13px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: mine(p) ? config.accent : TEXT }}>{p.who}</span>
              {mine(p) ? <span style={{ fontSize: 12, color: MUTED }}>you</span> : null}
            </div>
            <div style={{ fontSize: 16.5, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{p.text}</div>
          </article>
        ))}
        {!posts.length ? <p style={{ margin: 0, fontSize: 16, color: MUTED }}>Nobody has answered yet.</p> : null}
      </div>
    </div></div>
  );
}

function Head({ config, who, onOut }) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <a href={config.path} style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.02em",
        color: config.accent, textDecoration: "none" }}>{config.code}</a>
      <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, letterSpacing: ".1em",
        textTransform: "uppercase", color: LIVE }}>Discussion</span>
      {who ? (
        <button onClick={onOut} style={{ marginLeft: "auto", minHeight: 34, padding: "0 12px", fontSize: 14,
          fontFamily: F, background: "#fff", border: "1px solid " + BORDER, borderRadius: 10, cursor: "pointer", color: MUTED }}>
          {who} · not you?
        </button>
      ) : null}
    </header>
  );
}
