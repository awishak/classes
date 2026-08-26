// Checks the instructor PIN.
//
// The point of doing this here rather than in the app is that the PIN never
// ships to the browser. A PIN compared in client code is a PIN sitting in the
// bundle for anyone who opens devtools, which is no better than the unlisted
// URL it was meant to replace. This way the only thing the browser ever holds
// is a PIN somebody typed.
//
// Set it with:  vercel env add INSTRUCTOR_PIN
//
// What this does and does not buy: nobody learns the PIN from the app, and
// nobody gets past the gate without it. A determined person can still edit the
// page's own JavaScript to skip the check, because the dashboard is rendered in
// the browser. Stopping that means rendering it on the server, which is a much
// bigger change than this.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = process.env.INSTRUCTOR_PIN;
  if (!expected) {
    return res.status(500).json({ error: "No instructor PIN is configured on the server." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON body" }); }
  }

  const pin = String(body?.pin || "");
  if (!pin) return res.status(400).json({ ok: false, error: "No PIN sent." });

  // Constant-time compare, so the response time says nothing about how much of
  // the PIN was right.
  const a = Buffer.from(pin);
  const b = Buffer.from(String(expected));
  let same = a.length === b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) same = false;
  }

  // A wrong PIN costs a second, which makes guessing six digits impractical
  // without making the right one feel slow.
  if (!same) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ ok: false, error: "That PIN does not match." });
  }

  return res.status(200).json({ ok: true });
}
