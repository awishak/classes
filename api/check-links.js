// Does this link still go anywhere.
//
// The browser cannot answer that question. A fetch from the page to somebody
// else's site is blocked by CORS, and the no-cors version comes back opaque
// with no status on it at all, so the page would be guessing. Here there is no
// CORS, so a real status comes back.
//
// A batch at a time, because a shelf of three hundred readings is three
// hundred requests and one round trip each would be slow enough that nobody
// would ever press the button.
//
// This endpoint fetches a URL somebody hands it, so it is careful about which
// URLs it will take: http and https only, no addresses inside a private
// network, no loopback, and a short timeout. It returns a status and nothing
// else. The body is never read and never sent back.

const PRIVATE = [
  /^localhost$/i, /^127\./, /^0\./, /^10\./, /^192\.168\./, /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /\.local$/i, /^\[?::1\]?$/, /^\[?fc00:/i, /^\[?fe80:/i,
];

const allowed = (raw) => {
  let u;
  try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (PRIVATE.some(re => re.test(u.hostname))) return null;
  return u.toString();
};

// A HEAD is enough and costs the other end almost nothing. Plenty of sites
// answer a HEAD with 405 while serving the page perfectly well, so those get a
// GET as a second opinion.
async function look(url, signal) {
  const opts = { redirect: "follow", signal, headers: { "user-agent": "classes-link-check/1.0" } };
  let r;
  try {
    r = await fetch(url, { ...opts, method: "HEAD" });
    if (r.status === 405 || r.status === 501 || r.status === 403) {
      r = await fetch(url, { ...opts, method: "GET" });
    }
  } catch (err) {
    return { url, ok: false, status: 0, error: err.name === "AbortError" ? "timed out" : "no answer" };
  }
  const to = r.url && r.url !== url ? r.url : "";
  return { url, ok: r.ok, status: r.status, to };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON body" }); }
  }
  const urls = Array.isArray(body?.urls) ? body.urls.slice(0, 12) : null;
  if (!urls || !urls.length) return res.status(400).json({ error: "Send urls, up to twelve" });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const results = await Promise.all(urls.map(async raw => {
      const url = allowed(raw);
      if (!url) return { url: raw, ok: false, status: 0, error: "not a public web address" };
      return look(url, ctrl.signal);
    }));
    res.status(200).json({ results });
  } finally {
    clearTimeout(timer);
  }
}
