// The signed-in person, on the same Supabase project the app already stores
// class data in. No SDK: a handful of REST calls, and the session kept in this
// browser so the podium machine asks once and a phone asks once.
//
// Two ways in, one form, the way Dead Pot does it. Email plus a six-digit
// code: the permanent code is the account password, set by the roster sheet,
// so that signs in every time. Or "email me a code": Supabase mails a one-time
// six-digit code and a link, and the same box takes the code. The sign-in
// tries the password first, then the one-time code, and nobody has to know
// which they typed.
//
// Signing in says who you are. Which class you belong to is the roster's
// answer, by email, and whereTo() works that out.

import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_KEY } from "../storage-shim.js";
import { isInstructorEmail } from "../instructors.js";

const base = SUPABASE_URL + "/auth/v1";
const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
const KEY = "classes-session";
const EVENT = "classes-session";

const cleanEmail = (e) => String(e || "").trim().toLowerCase();

// ─── the session, kept ───

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.access_token && s.user?.email ? s : null;
  } catch { return null; }
}

function keep(s) {
  const session = s ? {
    access_token: s.access_token, refresh_token: s.refresh_token,
    expires_at: s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600)),
    user: { id: s.user?.id, email: cleanEmail(s.user?.email) },
  } : null;
  try { session ? localStorage.setItem(KEY, JSON.stringify(session)) : localStorage.removeItem(KEY); } catch { /* private mode */ }
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: session })); } catch { /* server */ }
  return session;
}

export const clearSession = () => keep(null);

// The token, fresh. A session that is within a minute of expiring is refreshed
// first, so a call made with the result does not fail on the way out the door.
export async function accessToken() {
  const s = getSession();
  if (!s) return "";
  if (s.expires_at - Math.floor(Date.now() / 1000) > 60) return s.access_token;
  try {
    const r = await fetch(base + "/token?grant_type=refresh_token", {
      method: "POST", headers, body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    const body = await r.json().catch(() => ({}));
    if (r.ok && body.access_token) return keep(body).access_token;
  } catch { /* fall through */ }
  clearSession();
  return "";
}

// Headers for a call to our own API that should carry who is asking.
export async function authHeaders() {
  const t = await accessToken();
  return t ? { Authorization: "Bearer " + t } : {};
}

// ─── the ways in ───

async function post(path, body, extra = {}) {
  const r = await fetch(base + path, { method: "POST", headers: { ...headers, ...extra }, body: JSON.stringify(body) });
  const out = await r.json().catch(() => ({}));
  return { ok: r.ok, body: out };
}

const said = (body, fallback) => body?.msg || body?.error_description || body?.message || fallback;

// Email plus a six-digit code, either kind.
export async function signInWithCode(email, code) {
  const addr = cleanEmail(email);
  const c = String(code || "").replace(/\D/g, "");
  if (!addr || c.length < 6) return { ok: false, error: "Type your email and the six-digit code." };
  try {
    const pw = await post("/token?grant_type=password", { email: addr, password: c });
    if (pw.ok && pw.body.access_token) return { ok: true, session: keep(pw.body) };
    const otp = await post("/verify", { email: addr, token: c, type: "email" });
    if (otp.ok && otp.body.access_token) return { ok: true, session: keep(otp.body) };
    return { ok: false, error: "That code did not work. Check the email, or ask for a code below." };
  } catch {
    return { ok: false, error: "Could not reach the sign-in service." };
  }
}

// Mail a one-time code and a link. Only an address that already has a login
// gets one: the roster is the allowlist, and a login is made from the roster.
export async function sendCode(email) {
  const addr = cleanEmail(email);
  if (!addr) return { ok: false, error: "Type your email first." };
  const redirect = typeof window !== "undefined" ? window.location.origin + "/login" : "";
  try {
    const r = await post("/otp?redirect_to=" + encodeURIComponent(redirect), { email: addr, create_user: false });
    if (r.ok) return { ok: true };
    const why = said(r.body, "");
    if (/signup|not allowed|not found/i.test(why)) {
      return { ok: false, error: "That email is not on a roster yet. Ask Andrew to add you." };
    }
    return { ok: false, error: why || "Could not send that email." };
  } catch {
    return { ok: false, error: "Could not reach the sign-in service." };
  }
}

// A link from the email lands here with the tokens in the address. Take them,
// keep the session, and clean the address so the token is not left in the bar.
export async function takeRedirect() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash || "";
  if (!hash.includes("access_token=")) return null;
  const p = new URLSearchParams(hash.slice(1));
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  const token = p.get("access_token");
  if (!token) return null;
  try {
    const r = await fetch(base + "/user", { headers: { ...headers, Authorization: "Bearer " + token } });
    if (!r.ok) return null;
    const user = await r.json();
    return keep({ access_token: token, refresh_token: p.get("refresh_token"), expires_in: Number(p.get("expires_in") || 3600), user });
  } catch { return null; }
}

export async function signOut() {
  const s = getSession();
  clearSession();
  if (!s) return;
  try { await fetch(base + "/logout", { method: "POST", headers: { ...headers, Authorization: "Bearer " + s.access_token } }); } catch { /* gone anyway */ }
}

// ─── where a signed-in person goes ───
//
// `rosters` is [{ cls, students }] for every current class. A student in one
// class goes there; in two, they pick; on no roster, they are told. An
// instructor lands on the front page with everything.
export function whereTo(email, rosters) {
  const addr = cleanEmail(email);
  if (isInstructorEmail(addr)) return { kind: "instructor", path: "/", classes: rosters.map(r => r.cls) };
  const mine = rosters.filter(r => (r.students || []).some(s => cleanEmail(s.email) === addr)).map(r => r.cls);
  if (mine.length === 1) return { kind: "student", path: mine[0].path, classes: mine };
  if (mine.length > 1) return { kind: "pick", path: "/login", classes: mine };
  return { kind: "nobody", path: "/login", classes: [] };
}

// The roster row for this email in one class, or null.
export const studentFor = (email, students) =>
  (students || []).find(s => cleanEmail(s.email) === cleanEmail(email)) || null;

// The signed-in student's own code, off the row only they can read. Empty
// for the instructor, for a student with no login row, or when signed out.
export async function myCode() {
  const t = await accessToken();
  if (!t) return "";
  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/class_logins?select=code", { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + t } });
    const rows = await r.json().catch(() => []);
    return (Array.isArray(rows) && rows[0]?.code) || "";
  } catch { return ""; }
}

// ─── the hook ───

export function useSession() {
  const [session, setSession] = useState(() => (typeof window === "undefined" ? null : getSession()));
  useEffect(() => {
    const on = (e) => setSession(e.detail || null);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const out = useCallback(async () => { await signOut(); }, []);
  return { session, email: session?.user?.email || "", instructor: isInstructorEmail(session?.user?.email), signOut: out };
}
