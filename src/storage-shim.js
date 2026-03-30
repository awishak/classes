// Supabase storage shim
// Replaces window.storage API with Supabase app_data table
// All clients share the same data and get real-time updates

const SUPABASE_URL = "https://ybuchgebudixbyrcxpik.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidWNoZ2VidWRpeGJ5cmN4cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Nzg3OTIsImV4cCI6MjA4ODA1NDc5Mn0.aF2M_fj6bVYKw-Tz1XxI9SiQB7lAtWzuhBRZbsai8QY";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// Real-time listeners: key -> [callback, ...]
const listeners = {};

// Connect to Supabase Realtime via WebSocket
let realtimeChannel = null;

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
      // Heartbeat every 30s
      heartbeat = setInterval(() => {
        ref++;
        ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(ref) }));
      }, 30000);
    };

    ws.onmessage = (event) => {
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

// Start realtime connection
connectRealtime();

window.storage = {
  async get(key, shared) {
    try {
      const url = SUPABASE_URL + "/rest/v1/app_data?id=eq." + encodeURIComponent(key) + "&select=data";
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const rows = await res.json();
      if (!rows || rows.length === 0) return null;
      return { key, value: JSON.stringify(rows[0].data), shared: !!shared };
    } catch (e) {
      console.error("Storage get error:", e);
      return null;
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
      const backupBody = JSON.stringify({ id: backupKey, data: rows[0].data, updated_at: new Date().toISOString() });
      await fetch(SUPABASE_URL + "/rest/v1/app_data?on_conflict=id", {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation,resolution=merge-duplicates" },
        body: backupBody,
      });
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
      // Daily backup before writing (skip backup keys themselves)
      if (!key.includes("-bak-")) {
        await this._ensureBackup(key);
      }

      const data = JSON.parse(value);
      const body = JSON.stringify({ id: key, data, updated_at: new Date().toISOString() });

      // Try upsert
      const url = SUPABASE_URL + "/rest/v1/app_data?on_conflict=id";
      const res = await fetch(url, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation,resolution=merge-duplicates" },
        body,
      });

      if (!res.ok) {
        console.error("Storage set error:", res.status, await res.text());
        return null;
      }

      return { key, value, shared: !!shared };
    } catch (e) {
      console.error("Storage set error:", e);
      return null;
    }
  },

  async delete(key, shared) {
    try {
      const url = SUPABASE_URL + "/rest/v1/app_data?id=eq." + encodeURIComponent(key);
      await fetch(url, { method: "DELETE", headers });
      return { key, deleted: true, shared: !!shared };
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
