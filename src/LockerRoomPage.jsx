// Locker Room, open to the public at /lockerroom, and at drewi.sh/lockerroom
// through the andrewishak repo's rewrites. Andrew, 2026-10-29: "give me the
// link to do a practice version (one that anyone can do)."
//
// A visitor types a name and plays a season. The name seeds the season the
// way a student's does, and goes on the file as `name` so the public board
// can show it. The squad is a made-up roster, not a class. The file lives
// under a visitor id this browser makes and keeps, through
// api/locker-room-public, which holds the service key; nothing here can
// reach a class's rows. The public board is every public season.

import { useEffect, useRef, useState } from "react";
import { mountTakeover } from "./engine/takeover/game.jsx";
import { publicStore } from "./engine/worktopia/store.js";

const VISITOR_KEY = "locker-room-visitor", NAME_KEY = "locker-room-name";
const ENDPOINT = "/api/locker-room-public";
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); }));
const remember = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const recall = (k) => { try { return localStorage.getItem(k) || ""; } catch { return ""; } };
const visitorId = () => { let id = recall(VISITOR_KEY); if (!id) { id = uuid(); remember(VISITOR_KEY, id); } return id; };

// The squad a visitor coaches. Not a class, so nobody real.
export const PUBLIC_SQUAD = [
  "Dot Ramirez", "Bo Nakamura", "Frankie Oduya", "Sam Petrov", "Jules Okafor", "Tess Lindqvist", "Ravi Banerjee", "Mo Haddad",
  "Kit Alvarado", "Rae Castellano", "Ola Adeyemi", "Nico Varga", "Izzy Dufresne", "Wren Takahashi", "Zion Mbeki", "Lou Brennan",
];

const boardFetcher = async () => {
  const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "board" }) });
  const out = await r.json().catch(() => null);
  if (!r.ok || !out || !out.ok) throw new Error(out?.error || "no answer");
  return out.rows;
};
const topicsStore = { load: async () => ({ answers: {} }) };

function Season({ name, onNew }) {
  const ref = useRef(null);
  useEffect(() => {
    const store = publicStore({ visitorId: visitorId(), endpoint: ENDPOINT });
    // The name on the file, for the board. A failed write is retried by the next save.
    store.save("name", name).catch(() => {});
    const game = mountTakeover(ref.current, { store, viewer: { id: "visitor-" + visitorId(), name }, photo: "", photos: {}, classmates: PUBLIC_SQUAD, classId: "", storageKey: "", editor: false, topicsStore, boardFetcher });
    return () => game.destroy();
  }, [name]);
  return (
    <div>
      <div ref={ref} />
      <div style={{ textAlign: "center", padding: "0 16px 32px", background: "#0f0f1a" }}>
        <button type="button" onClick={onNew} style={{ font: "inherit", fontSize: 14, color: "#a0a0b8", background: "none", border: 0, textDecoration: "underline", cursor: "pointer" }}>Play as someone else</button>
      </div>
    </div>
  );
}

export default function LockerRoomPage() {
  const [name, setName] = useState(() => recall(NAME_KEY));
  const [typed, setTyped] = useState("");
  useEffect(() => { document.title = "Locker Room"; }, []);
  const start = (e) => {
    e.preventDefault();
    const n = typed.trim().slice(0, 40);
    if (!n) return;
    remember(NAME_KEY, n); setName(n);
  };
  const fresh = () => { remember(VISITOR_KEY, uuid()); remember(NAME_KEY, ""); setName(""); setTyped(""); };
  if (name) return <Season name={name} onNew={fresh} />;
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e8e8f0", fontFamily: "'IBM Plex Mono', ui-monospace, Menlo, monospace", display: "grid", placeItems: "center", padding: 16 }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=IBM+Plex+Mono:wght@400;500;600&display=swap" />
      <form onSubmit={start} style={{ display: "grid", gap: 18, justifyItems: "center", textAlign: "center", maxWidth: 480, background: "#141428", border: "4px solid #e0e0e0", boxShadow: "0 0 0 4px #0f0f1a, 0 0 0 8px #58b8f8", padding: 28 }}>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 22, color: "#f8e020", textShadow: "4px 4px 0 #2060d0", margin: 0 }}>Locker Room</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>You take over a team and coach it for seven weeks. What should the team call you?</p>
        <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="Your name" aria-label="Your name" maxLength={40} autoFocus
          style={{ width: "100%", boxSizing: "border-box", font: "inherit", fontSize: 18, padding: "10px 12px", color: "#e8e8f0", background: "#0f0f1a", border: "3px solid #e0e0e0", outline: "none" }} />
        <button type="submit" disabled={!typed.trim()} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, padding: "12px 18px", color: "#0f0f1a", background: "#38b838", border: "3px solid #fff", boxShadow: "4px 4px 0 #0f0f1a", cursor: "pointer", opacity: typed.trim() ? 1 : 0.4 }}>Press start</button>
      </form>
    </div>
  );
}
