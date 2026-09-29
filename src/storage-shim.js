// Supabase storage shim
// Replaces window.storage API with Supabase app_data table
// All clients share the same data and get real-time updates

export const SUPABASE_URL = "https://ybuchgebudixbyrcxpik.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidWNoZ2VidWRpeGJ5cmN4cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Nzg3OTIsImV4cCI6MjA4ODA1NDc5Mn0.aF2M_fj6bVYKw-Tz1XxI9SiQB7lAtWzuhBRZbsai8QY";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// Real-time listeners: key -> [callback, ...]
const listeners = {};

// The signed-in person's token, asked for at each write to a plan row so the
// database can see who is writing. session.js registers it. A plan row is
// `<class>-plan`, and its backups and history are `<class>-plan-...`.
let tokenFn = null;
const isPlanRow = (k) => typeof k === "string" && (k.endsWith("-plan") || k.includes("-plan-"));

// An upsert of one row. As the signed-in person for a plan row, and if the
// database refuses that, once more as anon, for a database that has no
// policies yet. Answers the response.
async function upsert(id, data) {
  const body = JSON.stringify({ id, data, updated_at: new Date().toISOString() });
  const send = (token) => fetch(SUPABASE_URL + "/rest/v1/app_data?on_conflict=id", {
    method: "POST",
    headers: { ...headers, ...(token ? { Authorization: "Bearer " + token } : {}), "Prefer": "return=representation,resolution=merge-duplicates" },
    body,
  });
  let token = null;
  if (isPlanRow(id) && tokenFn) { try { token = await tokenFn(); } catch { token = null; } }
  let res = await send(token);
  if (token && (res.status === 401 || res.status === 403)) res = await send(null);
  return res;
}

// Connect to Supabase Realtime via WebSocket
let realtimeChannel = null;

// Andrew, 2026-09-23: the COMM 118 day he had built was not on his laptop,
// though it was on the server. A laptop that sleeps keeps a socket that looks
// open and hears nothing, and a socket that does reconnect never learns what
// changed while it was gone. So: the last time the server said anything, a
// socket that has gone quiet past two heartbeats is dropped and made again,
// and every reconnect after the first tells the pages to read their class
// again. store.js listens for RECONNECTED.
export const RECONNECTED = "ishak:realtime-back";
const QUIET = 75000;
let lastHeard = 0;
let joinedOnce = false;

function dropRealtime(ws) {
  if (realtimeChannel !== ws) return;
  realtimeChannel = null;
  if (ws._beat) clearInterval(ws._beat);
  ws.onclose = null; ws.onerror = null; ws.onmessage = null;
  try { ws.close(); } catch { /* already gone */ }
  setTimeout(connectRealtime, 500);
}

function connectRealtime() {
  if (realtimeChannel) return;
  try {
    const wsUrl = SUPABASE_URL.replace("https://", "wss://") + "/realtime/v1/websocket?apikey=" + SUPABASE_KEY + "&vsn=1.0.0";
    const ws = new WebSocket(wsUrl);
    let heartbeat = null;
    let ref = 0;

    ws.onopen = () => {
      // Join the realtime channel for app_data changes
      ref++;
      ws.send(JSON.stringify({
        topic: "realtime:public:app_data",
        event: "phx_join",
        payload: { config: { broadcast: { self: false }, postgres_changes: [{ event: "*", schema: "public", table: "app_data" }] } },
        ref: String(ref),
      }));
      lastHeard = Date.now();
      if (joinedOnce) { try { window.dispatchEvent(new Event(RECONNECTED)); } catch { /* no window */ } }
      joinedOnce = true;
      // Heartbeat every 30s, and a socket the server has stopped answering
      // is made again rather than trusted.
      heartbeat = setInterval(() => {
        if (Date.now() - lastHeard > QUIET) { dropRealtime(ws); return; }
        ref++;
        try { ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ref) })); } catch { dropRealtime(ws); }
      }, 30000);
      ws._beat = heartbeat;
    };

    ws.onmessage = (event) => {
      lastHeard = Date.now();
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "postgres_changes") {
          const payload = msg.payload;
          if (payload?.data?.record?.id) {
            const key = payload.data.record.id;
            const value = JSON.stringify(payload.data.record.data);
            // Notify all listeners for this key
            if (listeners[key]) {
              listeners[key].forEach(cb => {
                try { cb(value); } catch (e) { console.error("Realtime callback error:", e); }
              });
            }
          }
        }
      } catch (e) { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      realtimeChannel = null;
      if (heartbeat) clearInterval(heartbeat);
      // Reconnect after 3s
      setTimeout(connectRealtime, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    realtimeChannel = ws;
  } catch (e) {
    console.error("Realtime connection error:", e);
    setTimeout(connectRealtime, 5000);
  }
}

// Whether the server can be reached at all. The browser's own online flag
// only knows about wifi: on a network with no way out, campus wifi before
// its sign-in page, it says online while every save fails. A request that
// never gets an answer says more, so reads and writes report here, and the
// dashboard's save line listens for REACH.
export const REACH = "ishak:reach";
let unreachable = false;
function heard(reached) {
  if (unreachable === !reached) return;
  unreachable = !reached;
  try { window.dispatchEvent(new Event(REACH)); } catch { /* no window */ }
}

// Start realtime connection
connectRealtime();

// Coming back to the page, or back online: a socket that went quiet while the
// laptop slept is made again now rather than at the next heartbeat.
const wake = () => {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  if (!realtimeChannel) connectRealtime();
  else if (realtimeChannel.readyState === 1 && Date.now() - lastHeard > 45000) dropRealtime(realtimeChannel);
};
try {
  document.addEventListener("visibilitychange", wake);
  window.addEventListener("online", wake);
  window.addEventListener("focus", wake);
} catch { /* no window */ }

window.storage = {
  get unreachable() { return unreachable; },
  // Null when there is no row by that key. Undefined when the read failed:
  // no wifi, a sign-in page in the way, an error from the server. The two
  // used to come back the same, and a page that could not reach the server
  // took the answer for an empty class, seeded itself from config and wrote
  // the seed back over the term. Both are falsy, so a caller that only asks
  // whether it got something reads as it always did.
  async get(key, shared) {
    try {
      const url = SUPABASE_URL + "/rest/v1/app_data?id=eq." + encodeURIComponent(key) + "&select=data";
      const res = await fetch(url, { headers });
      heard(true);
      if (!res.ok) return undefined;
      const rows = await res.json();
      if (!Array.isArray(rows)) return undefined;
      if (rows.length === 0) return null;
      return { key, value: JSON.stringify(rows[0].data), shared: !!shared };
    } catch (e) {
      if (e instanceof TypeError) heard(false);
      console.error("Storage get error:", e);
      return undefined;
    }
  },

  // Track which keys have been backed up today
  _backedUpToday: {},

  async _ensureBackup(key) {
    const today = new Date().toISOString().slice(0, 10);
    const backupFlag = key + "-" + today;
    if (this._backedUpToday[backupFlag]) return;
    try {
      const backupKey = key + "-bak-" + today;
      // Check if backup already exists
      const checkUrl = SUPABASE_URL + "/rest/v1/app_data?id=eq." + encodeURIComponent(backupKey) + "&select=id";
      const checkRes = await fetch(checkUrl, { headers });
      const checkRows = await checkRes.json();
      if (checkRows && checkRows.length > 0) {
        this._backedUpToday[backupFlag] = true;
        return;
      }
      // Read current data
      const getUrl = SUPABASE_URL + "/rest/v1/app_data?id=eq." + encodeURIComponent(key) + "&select=data";
      const getRes = await fetch(getUrl, { headers });
      if (!getRes.ok) return;
      const rows = await getRes.json();
      if (!rows || rows.length === 0) return;
      // Save backup
      await upsert(backupKey, rows[0].data);
      this._backedUpToday[backupFlag] = true;
      console.log("Daily backup created:", backupKey);
      // Clean up old backups (keep last 7 days)
      const listUrl = SUPABASE_URL + "/rest/v1/app_data?id=like." + encodeURIComponent(key + "-bak-%") + "&select=id&order=id.desc";
      const listRes = await fetch(listUrl, { headers });
      const allBackups = await listRes.json();
      if (allBackups && allBackups.length > 7) {
        for (let i = 7; i < allBackups.length; i++) {
          await fetch(SUPABASE_URL + "/rest/v1/app_data?id=eq." + encodeURIComponent(allBackups[i].id), { method: "DELETE", headers });
        }
      }
    } catch (e) {
      console.error("Backup error:", e);
    }
  },

  async set(key, value, shared) {
    try {
      // Daily backup before writing (skip backup keys themselves, and a day's
      // history, which is a record of versions already)
      if (!key.includes("-bak-") && !key.includes("-history-")) {
        await this._ensureBackup(key);
      }

      const res = await upsert(key, JSON.parse(value));
      heard(true);

      // Refused is not failed: the database said no to this writer, and
      // asking again would get the same answer. False, so the store can tell.
      if (res.status === 401 || res.status === 403) {
        console.warn("Storage set refused:", key, res.status);
        return false;
      }
      if (!res.ok) {
        console.error("Storage set error:", res.status, await res.text());
        return undefined;
      }

      return { key, value, shared: !!shared };
    } catch (e) {
      if (e instanceof TypeError) heard(false);
      console.error("Storage set error:", e);
      return undefined;
    }
  },

  // Who is at the keyboard, for the rows that care. A function that answers
  // a token, or null.
  setToken(fn) { tokenFn = typeof fn === "function" ? fn : null; },

  // Every row whose key starts with `prefix`, keys and data together, in one
  // request. Null when the request fails, so a caller can tell that from none.
  async rows(prefix) {
    try {
      const url = SUPABASE_URL + "/rest/v1/app_data?id=like." + encodeURIComponent(prefix + "%") + "&select=id,data&order=id.desc";
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const rows = await res.json();
      return Array.isArray(rows) ? rows : null;
    } catch (e) {
      return null;
    }
  },
  async delete(key, shared) {
    try {
      const url = SUPABASE_URL + "/rest/v1/app_data?id=eq." + encodeURIComponent(key);
      let token = null;
      if (isPlanRow(key) && tokenFn) { try { token = await tokenFn(); } catch { token = null; } }
      let res = await fetch(url, { method: "DELETE", headers: { ...headers, ...(token ? { Authorization: "Bearer " + token } : {}) } });
      if (token && (res.status === 401 || res.status === 403)) res = await fetch(url, { method: "DELETE", headers });
      return { key, deleted: res.ok, shared: !!shared };
    } catch (e) {
      return null;
    }
  },

  async list(prefix, shared) {
    try {
      const url = prefix
        ? SUPABASE_URL + "/rest/v1/app_data?id=like." + encodeURIComponent(prefix + "%") + "&select=id"
        : SUPABASE_URL + "/rest/v1/app_data?select=id";
      const res = await fetch(url, { headers });
      const rows = await res.json();
      return { keys: rows.map(r => r.id), prefix, shared: !!shared };
    } catch (e) {
      return { keys: [], prefix, shared: !!shared };
    }
  },

  // Subscribe to real-time changes for a key
  onUpdate(key, callback) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);
    return () => {
      listeners[key] = listeners[key].filter(cb => cb !== callback);
    };
  },
};
