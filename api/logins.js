// Student logins, made from the roster.
//
// A student signs in with an email and a six-digit code. The code is their
// Supabase password, set here with the service role, so email plus code works
// every time and never expires, and Supabase does the checking. The code is
// also kept in class_logins in plain text, because the code is a convenience
// I read off the roster when somebody forgets it, not a secret, and only the
// service role and the student themself can read the row.
//
// Every action is behind the instructor PIN.
//
// POST /api/logins { pin, action: "list" }
//   -> { ok, logins: [{ email, code, user_id }] }
// POST /api/logins { pin, action: "provision", students: [{ name, email }] }
//   -> { ok, logins: [...] }   creates the login for any email without one
// POST /api/logins { pin, action: "reset", email }
//   -> { ok, login: { email, code } }   a fresh code, for a student who lost theirs
// POST /api/logins { pin, action: "set", email, code }
//   -> { ok, login: { email, code } }   the code somebody chose, six digits

import { callerAllowed, readBody } from "./_auth.js";
import { SUPABASE_URL, serviceKey, serviceHeaders } from "./_supabase.js";

const TABLE = "class_logins";

// Six digits, no leading zero, so the code reads the same everywhere.
export const makeCode = () => String(100000 + Math.floor(Math.random() * 900000));

export const cleanEmail = (e) => String(e || "").trim().toLowerCase();
export const looksLikeEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail(e));

async function rest(path, init = {}) {
  const r = await fetch(SUPABASE_URL + path, { ...init, headers: { ...serviceHeaders(), ...(init.headers || {}) } });
  const text = await r.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { ok: r.ok, status: r.status, body };
}

async function listLogins() {
  const { ok, body } = await rest(`/rest/v1/${TABLE}?select=user_id,email,code&order=email`);
  if (!ok) throw new Error("could not read logins: " + JSON.stringify(body));
  return body;
}

// The auth user for an email, made if missing. GoTrue's admin list has no
// filter by email, so a clash on create is answered by paging the list.
async function userFor(email, password) {
  const made = await rest("/auth/v1/admin/users", {
    method: "POST", body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (made.ok && made.body?.id) return { id: made.body.id, fresh: true };
  const msg = JSON.stringify(made.body || "");
  if (!/registered|already|exists|duplicate/i.test(msg)) throw new Error("could not create " + email + ": " + msg);
  for (let page = 1; page <= 20; page++) {
    const { ok, body } = await rest(`/auth/v1/admin/users?page=${page}&per_page=1000`);
    if (!ok) break;
    const hit = (body?.users || []).find(u => cleanEmail(u.email) === email);
    if (hit) return { id: hit.id, fresh: false };
    if ((body?.users || []).length < 1000) break;
  }
  throw new Error("auth says " + email + " exists but the list does not show it");
}

async function setPassword(userId, password) {
  const r = await rest(`/auth/v1/admin/users/${userId}`, { method: "PUT", body: JSON.stringify({ password, email_confirm: true }) });
  if (!r.ok) throw new Error("could not set the code: " + JSON.stringify(r.body));
}

async function saveLogin(userId, email, code) {
  const r = await rest(`/rest/v1/${TABLE}?on_conflict=user_id`, {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ user_id: userId, email, code }),
  });
  if (!r.ok) throw new Error("could not keep the code: " + JSON.stringify(r.body));
  return r.body?.[0] || { user_id: userId, email, code };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = readBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });
  if (!(await callerAllowed(req, body))) {
    await new Promise(r => setTimeout(r, 1000));
    return res.status(401).json({ ok: false, error: "That PIN does not match, and nobody is signed in." });
  }
  if (!serviceKey()) return res.status(500).json({ ok: false, error: "No Supabase service key is configured on the server." });

  try {
    if (body.action === "list") {
      return res.status(200).json({ ok: true, logins: await listLogins() });
    }

    if (body.action === "provision") {
      const have = new Map((await listLogins()).map(l => [cleanEmail(l.email), l]));
      const wanted = [...new Set((body.students || []).map(s => cleanEmail(s.email)).filter(looksLikeEmail))];
      const made = [];
      const failed = [];
      for (const email of wanted) {
        if (have.has(email)) continue;
        try {
          const code = makeCode();
          const { id, fresh } = await userFor(email, code);
          if (!fresh) await setPassword(id, code);
          made.push(await saveLogin(id, email, code));
        } catch (e) {
          failed.push({ email, error: String(e.message || e) });
        }
      }
      return res.status(200).json({ ok: true, logins: await listLogins(), made: made.length, skipped: wanted.length - made.length - failed.length, failed });
    }

    if (body.action === "reset") {
      const email = cleanEmail(body.email);
      if (!looksLikeEmail(email)) return res.status(400).json({ ok: false, error: "That is not an email address." });
      const code = makeCode();
      const { id } = await userFor(email, code);
      await setPassword(id, code);
      return res.status(200).json({ ok: true, login: await saveLogin(id, email, code) });
    }

    if (body.action === "set") {
      const email = cleanEmail(body.email);
      const code = String(body.code || "").trim();
      if (!looksLikeEmail(email)) return res.status(400).json({ ok: false, error: "That is not an email address." });
      if (!/^\d{6}$/.test(code)) return res.status(400).json({ ok: false, error: "A code is six digits." });
      const { id } = await userFor(email, code);
      await setPassword(id, code);
      return res.status(200).json({ ok: true, login: await saveLogin(id, email, code) });
    }

    return res.status(400).json({ ok: false, error: "Unknown action." });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e.message || e) });
  }
}
