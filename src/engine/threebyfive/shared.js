// The rolls a student is on but did not start, and the bus that keeps every
// screen on a roll current.
//
// sharedStore talks to /api/threebyfive, which holds the service key and
// checks the caller's roster name against the roll as stored (see the route).
// openBus is a Supabase realtime broadcast channel on a raw socket, the way
// storage-shim.js joins app_data: a screen sends a small note after every
// save, every other screen in the class hears it and reads the roll again.
// Nothing in a note is trusted; it only says which roll to read.

import { authHeaders } from "../session.js";
import { SUPABASE_URL, SUPABASE_KEY } from "../../storage-shim.js";

export function sharedStore({ groupKey }) {
  const call = async (what, body) => {
    const r = await fetch("/api/threebyfive", { method: "POST", headers: { "Content-Type": "application/json", ...(await authHeaders()) }, body: JSON.stringify({ groupKey, ...body }) });
    const out = await r.json().catch(() => null);
    if (!r.ok || !out || !out.ok) throw new Error(what + ": " + (out?.error || "nothing came back"));
    return out;
  };
  return {
    async load() { return (await call("Could not read the rolls you are on", { action: "load" })).shared || []; },
    async save(owner, field, value) { await call("Could not save the roll", { action: "save", owner, field, value: String(value) }); },
    async remove(owner, field) { await call("Could not remove the roll", { action: "remove", owner, field }); },
    async submit(owner) { return (await call("Could not hand in", { action: "submit", owner })).submitted_at; },
    async recall(owner) { await call("Could not take back", { action: "recall", owner }); },
  };
}

/** A broadcast channel. onMessage gets each note sent by another screen. Returns { send, close }. */
export function openBus(name, onMessage) {
  const topic = "realtime:" + name;
  let ws = null, ref = 0, beat = null, closed = false, joined = false;
  const queue = [];
  const frame = (event, payload) => JSON.stringify({ topic, event, payload, ref: String(++ref) });
  const send = (payload) => {
    if (!ws || !joined) { if (queue.length < 8) queue.push(payload); return; }
    try { ws.send(frame("broadcast", { type: "broadcast", event: "roll", payload })); } catch { if (queue.length < 8) queue.push(payload); }
  };
  const retry = () => { if (!closed) setTimeout(connect, 3000); };
  function connect() {
    if (closed || typeof WebSocket === "undefined") return;
    try { ws = new WebSocket(SUPABASE_URL.replace("https://", "wss://") + "/realtime/v1/websocket?apikey=" + SUPABASE_KEY + "&vsn=1.0.0"); } catch { retry(); return; }
    ws.onopen = () => {
      ws.send(frame("phx_join", { config: { broadcast: { self: false, ack: false }, presence: { key: "" }, postgres_changes: [] } }));
      beat = setInterval(() => { try { ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(++ref) })); } catch { /* onclose follows */ } }, 30000);
    };
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.topic !== topic) return;
      if (m.event === "phx_reply" && m.payload?.status === "ok" && !joined) { joined = true; queue.splice(0).forEach(send); }
      if (m.event === "broadcast" && m.payload?.event === "roll") { try { onMessage(m.payload.payload || {}); } catch { /* a bad note is dropped */ } }
    };
    ws.onclose = () => { clearInterval(beat); joined = false; ws = null; retry(); };
    ws.onerror = () => { try { ws.close(); } catch { /* already gone */ } };
  }
  connect();
  return {
    send,
    close() { closed = true; clearInterval(beat); if (ws) { ws.onclose = null; try { ws.close(); } catch { /* already gone */ } ws = null; } },
  };
}
