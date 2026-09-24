// The word back from the server, wherever something is saved.
//
// Andrew, 2026-09-24: "i added a note for students, adn then the note goes
// away. come on. this is ahppening too much you need to put edit and save
// buttons on the note to students, card for students, etc." A box that saves
// on its own and says nothing is a box whose words can be gone with nobody
// told. So a box is opened with Edit, written with Save, and Save says what
// happened: Saving..., then Saved once the server has it, or Not saved yet
// while it is still being tried. The dashboard bar has said this since
// 2026-09-23; this is the same words for the class site.
//
// `saving` is the fourth thing useClassData hands back: { busy, trouble }.

import { useEffect, useState } from "react";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;

// Whether the server can be reached at all: the browser's own word, and the
// shim's, which notices writes that never get an answer.
const reachable = () => { try { return navigator.onLine !== false && !window.storage?.unreachable; } catch { return true; } };

export function useOnline() {
  const [online, setOnline] = useState(reachable);
  useEffect(() => {
    const look = () => setOnline(reachable());
    window.addEventListener("online", look); window.addEventListener("offline", look); window.addEventListener("ishak:reach", look);
    return () => { window.removeEventListener("online", look); window.removeEventListener("offline", look); window.removeEventListener("ishak:reach", look); };
  }, []);
  return online;
}

// What to say, and whether it is bad news.
export function saveWord(saving, online = true) {
  if (!online) return { text: "Offline, holding your work", bad: true };
  if (saving?.trouble) return { text: "Not saved yet, still trying", bad: true };
  if (saving?.busy) return { text: "Saving...", bad: false };
  return { text: "Saved", bad: false };
}

// Under a Save button: nothing until Save has been pressed, then the word.
export function SaveWord({ saving, online = true, armed, style }) {
  if (!armed) return null;
  const w = saveWord(saving, online);
  return (
    <span role="status" aria-live="polite" style={{ fontFamily: F, fontSize: 13, fontWeight: 600,
      color: w.bad ? TOKENS.STATE.late : w.text === "Saved" ? TOKENS.STATE.ok : TOKENS.TEXT.muted, ...style }}>
      {w.text}
    </span>
  );
}
