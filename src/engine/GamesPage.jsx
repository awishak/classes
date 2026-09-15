// Games, for the instructor: /<class>/games, behind the same gate as the
// dashboard, opened from More → Games.
//
// The page is the decks package's GamesHome: the class's games, adding and
// setting one up, opening it to students, and running it live. This file only
// connects it to the class: who is on the roster (by sign-in email), the room
// screen, and the Supabase client that signs each call as the person here.
//
// The spring game kept every answer inside one record for the whole class and
// lost answers when two phones saved at once. These games keep each answer in
// its own row; see decks' GAMES.md.

import { useEffect, useRef, useState, useCallback } from "react";
import { GamesHome, FONT_HREF } from "@ishak/decks";
import { useClassState } from "./store.js";
import { useLive } from "./live.js";
import { withIds } from "./roster.js";
import { useSession } from "./session.js";
import { gameClient } from "./gameClient.js";
import { castFor } from "./gameCast.js";
import * as TOKENS from "./tokens.js";

const emailOf = (s) => String(s?.email || "").trim().toLowerCase();

export default function GamesPage({ config }) {
  const [data] = useClassState(config.storageKey);
  const [live, cast, push] = useLive(config.storageKey);
  const { session, instructor } = useSession();
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = config.code + " · Games";
    if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
  }, [config.code]);

  const roster = withIds(data?.students || config.students || [])
    .filter(s => emailOf(s))
    .map(s => ({ id: emailOf(s), name: s.name }));

  // While a game's during slide is up, keep its count current without
  // re-running the slide's entrance each time.
  const liveRef = useRef(live);
  liveRef.current = live;
  const onGame = useCallback((game) => {
    const up = liveRef.current?.cast;
    if (up?.template !== "gameDuring" || up.deckId !== game.deck.id) return;
    const next = castFor({ view: "during" }, game, roster.length);
    if (next.submitted !== up.submitted || next.endsAt !== up.endsAt) push({ cast: next });
  }, [push, roster.length]);

  const onError = useCallback((e) => {
    console.error(e);
    setError(e?.message || String(e));
  }, []);

  if (!session || !instructor) {
    return (
      <div style={{ minHeight: "100vh", background: TOKENS.SURFACE.page, color: TOKENS.TEXT.primary, fontFamily: TOKENS.FONT.body, padding: 32 }}>
        <p style={{ fontSize: 17, margin: "0 0 12px" }}>Games run on your email sign-in.</p>
        <a href="/login" style={{ fontSize: 17, fontWeight: 600, color: config.accent }}>Sign in</a>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <div role="alert" style={{ position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 50, maxWidth: 720, margin: "0 auto", padding: "12px 16px", borderRadius: 12,
          background: TOKENS.SURFACE.card, color: TOKENS.STATE.late, boxShadow: "0 0 0 1px " + TOKENS.LINE.strong + ", 0 12px 32px -12px rgba(28,25,23,.3)",
          fontFamily: TOKENS.FONT.body, fontSize: 15, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ flex: 1 }}>Not saved: {error}</span>
          <button type="button" onClick={() => setError("")} style={{ minHeight: 34, padding: "0 12px", borderRadius: 8, border: "none", background: "transparent", color: TOKENS.TEXT.secondary, fontFamily: TOKENS.FONT.body, fontSize: 15, cursor: "pointer" }}>Dismiss</button>
        </div>
      ) : null}
      <GamesHome supabase={gameClient} groupKey={config.id} context={config.code} roster={roster}
        onScreen={(view, game) => cast(castFor(view, game, roster.length))} onGame={onGame} onError={onError} />
    </>
  );
}
