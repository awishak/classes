// Email sign-in for students, on the same Supabase project the app already
// stores class data in. No SDK: these are the three REST calls we need.
//
// Two ways into a class, and students can use either:
//   1. Name + PIN (data.pins) — instant, works with no email, no network round
//      trip beyond the class data itself.
//   2. Email — we mail a sign-in link; clicking it returns here with tokens in
//      the URL hash. If the project's email template includes the token, the
//      6-digit code in that same email works too.
//
// Heads up on volume: Supabase's built-in mailer is rate limited to a handful
// of messages an hour. A whole class signing in at once needs custom SMTP
// configured on the project.

import { SUPABASE_URL, SUPABASE_KEY } from "../storage-shim.js";

const base = SUPABASE_URL + "/auth/v1";
const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };

// Mail a sign-in link back to `redirectTo`.
export async function sendSignInEmail(email, redirectTo) {
  try {
    const res = await fetch(base + "/otp?redirect_to=" + encodeURIComponent(redirectTo), {
      method: "POST",
      headers,
      body: JSON.stringify({ email, create_user: true }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.msg || body.error_description || "Could not send that email." };
  } catch {
    return { ok: false, error: "Could not reach the sign-in service." };
  }
}

// Exchange a 6-digit code from the email for a session.
export async function verifyEmailCode(email, token) {
  try {
    const res = await fetch(base + "/verify", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, token, type: "email" }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.access_token) return { ok: true, email: body.user?.email || email };
    return { ok: false, error: body.msg || body.error_description || "That code did not work." };
  } catch {
    return { ok: false, error: "Could not reach the sign-in service." };
  }
}

// A magic-link click returns here with the tokens in the URL hash. Read the
// address out of it, then clean the hash so the token is not left in the bar.
export async function emailFromRedirect() {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  if (!hash || hash.indexOf("access_token=") === -1) return null;
  const token = new URLSearchParams(hash.slice(1)).get("access_token");
  history.replaceState(null, "", window.location.pathname + window.location.search);
  if (!token) return null;
  try {
    const res = await fetch(base + "/user", { headers: { ...headers, Authorization: "Bearer " + token } });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.email || null;
  } catch {
    return null;
  }
}

// Which student an email address belongs to. Kept on its own key so a student
// signing in never rewrites the class data.
const mapKey = (storageKey) => storageKey + "-emails";

export async function loadEmailMap(storageKey) {
  try {
    const r = await window.storage.get(mapKey(storageKey), true);
    return r ? (JSON.parse(r.value).map || {}) : {};
  } catch {
    return {};
  }
}

export async function saveEmailName(storageKey, email, name) {
  try {
    const map = await loadEmailMap(storageKey);
    map[email.toLowerCase()] = name;
    await window.storage.set(mapKey(storageKey), JSON.stringify({ map }), true);
  } catch { /* the local remember still works */ }
}
