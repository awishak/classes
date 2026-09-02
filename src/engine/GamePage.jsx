// The game, as a page of its own.
//
// Games used to be a tab inside a forked class hub, which is why there were
// three of them. On the engine a game is a surface like the room screen or the
// discussion board: an address, one class config, and the class store
// underneath.
//
//   /<class>/game     students play
//   /<class>/rungame  I run it, behind the same gate as the dashboard
//
// The two are separate addresses rather than one address that changes shape,
// because the student page has to be openable by somebody who is not signed in
// as me, and because I open the running side on a laptop while thirty phones
// are on the other one.
//
// Everything writes through GameSystem's own save, which merges and retries
// when two phones answer at once, so this page reads the store and takes back
// whatever that save wrote rather than saving a second time.

import { useState, useEffect, useMemo } from "react";
import { useClassState } from "./store.js";
import { GameAdmin, StudentAnswerView, TriviaPlayer, Accolades } from "./GameSystem.jsx";
import { lastNameOf } from "./AskPage.jsx";
import * as TOKENS from "./tokens.js";

// The same tokens the rest of the engine uses.
const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const BG = TOKENS.SURFACE.page;
const TEXT = TOKENS.TEXT.primary;
const MUTED = TOKENS.TEXT.muted;
const BORDER = TOKENS.LINE.strong;
const TAP = 44;

const wrap = { minHeight: "100vh", background: BG, fontFamily: F, color: TEXT,
  padding: "clamp(16px,3vw,32px)" };

// The same remembered name the Ask page and the discussion board write, so a
// student signed in to ask a question is already signed in to play.
const rememberKey = (config) => config.storageKey + "-user";

function Head({ config, who, onOut, what }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
      <a href={config.path} style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".08em",
        textTransform: "uppercase", color: config.accent, textDecoration: "none" }}>{config.code}</a>
      <span style={{ fontSize: 15, color: MUTED }}>{what}</span>
      {who ? (
        <button onClick={onOut} style={{ marginLeft: "auto", minHeight: TAP, padding: "0 14px",
          background: "none", border: "1px solid " + BORDER, borderRadius: 12, fontFamily: F,
          fontSize: 15, color: MUTED, cursor: "pointer" }}>{who} · sign out</button>
      ) : null}
    </div>
  );
}

// Who is playing. The roster is the whole sign-in, the way the discussion board
// does it, because a game hands out points and an anonymous player cannot be
// given any.
function PickName({ config, students, onPick }) {
  const [search, setSearch] = useState("");
  const hits = students
    .filter(s => s.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => lastNameOf(a.name, config.lastNameOverrides)
      .localeCompare(lastNameOf(b.name, config.lastNameOverrides)));
  return (
    <>
      <p style={{ margin: "0 0 12px", fontSize: 17, color: MUTED }}>Pick your name to play.</p>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Your name"
        style={{ width: "100%", maxWidth: 520, minHeight: TAP, padding: "0 14px", fontSize: 17,
          fontFamily: F, border: "1px solid " + BORDER, borderRadius: 12, background: "#fff", color: TEXT }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 520,
        maxHeight: "56vh", overflowY: "auto", marginTop: 12 }}>
        {hits.map(s => (
          <button key={s.name} onClick={() => onPick(s.name)}
            style={{ minHeight: TAP, textAlign: "left", padding: "0 14px", fontSize: 17, fontFamily: F,
              background: "#fff", border: "1px solid " + BORDER, borderRadius: 12, cursor: "pointer", color: TEXT }}>
            {s.name}
          </button>
        ))}
      </div>
    </>
  );
}

// Where the room plays. Team Trivia takes the screen while a trivia game is
// live, because a player in a live game has one thing to do; everything else
// the week is running sits under it.
export default function GamePage({ config }) {
  const [data, take] = useClassState(config.storageKey);
  const REMEMBER = rememberKey(config);
  const [who, setWho] = useState(null);

  useEffect(() => {
    document.title = config.code + " — Game";
    try { const v = localStorage.getItem(REMEMBER); if (v) setWho(v); } catch { /* private mode */ }
  }, [config.code, REMEMBER]);

  const students = data?.students || config.students || [];
  const liveTrivia = useMemo(
    () => Object.values(data?.triviaGames || {}).find(g => g.phase === "live"),
    [data]);

  if (data === null) {
    return <div style={wrap}><Head config={config} what="Game" />
      <p style={{ margin: 0, fontSize: 17, color: MUTED }}>Reading the class.</p></div>;
  }

  if (!who) {
    return (
      <div style={wrap}>
        <Head config={config} what="Game" />
        <PickName config={config} students={students} onPick={(n) => {
          setWho(n);
          try { localStorage.setItem(REMEMBER, n); } catch { /* private mode */ }
        }} />
      </div>
    );
  }

  return (
    <div style={wrap}>
      <Head config={config} who={who} what="Game" onOut={() => {
        setWho(null);
        try { localStorage.removeItem(REMEMBER); } catch { /* private mode */ }
      }} />
      {liveTrivia ? (
        <div style={{ marginBottom: 20 }}>
          <TriviaPlayer config={config} data={data} setData={take} userName={who} />
        </div>
      ) : null}
      <StudentAnswerView config={config} data={data} setData={take} userName={who} />
      <div style={{ marginTop: 20 }}>
        <Accolades config={config} data={data} />
      </div>
    </div>
  );
}

// Where I run it. Behind the instructor gate, like the dashboard.
export function RunGamePage({ config }) {
  const [data, take] = useClassState(config.storageKey);
  useEffect(() => { document.title = config.code + " — Run the game"; }, [config.code]);

  if (data === null) {
    return <div style={wrap}><Head config={config} what="Run the game" />
      <p style={{ margin: 0, fontSize: 17, color: MUTED }}>Reading the class.</p></div>;
  }

  return (
    <div style={wrap}>
      <Head config={config} what="Run the game" />
      <GameAdmin config={config} data={data} setData={take} />
    </div>
  );
}
