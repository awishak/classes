// The instructor PIN, checked the same way everywhere.
//
// A file in api/ that starts with an underscore is not a route; Vercel skips
// those. instructor-auth.js compares a PIN so the dashboard can open, and any
// route that does something on my behalf, like minting an upload link, needs
// the same compare. One copy, so the two cannot drift.

export function pinMatches(pin) {
  const expected = process.env.INSTRUCTOR_PIN;
  if (!expected || !pin) return false;
  // Constant-time compare, so the response time says nothing about how much of
  // the PIN was right.
  const a = Buffer.from(String(pin));
  const b = Buffer.from(String(expected));
  let same = a.length === b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if ((a[i] || 0) !== (b[i] || 0)) same = false;
  }
  return same;
}

// Who is asking: the PIN in the body, or a Supabase session in the bearer
// header whose email teaches. The instructor signs in the way a student does
// now, so a route that used to want the PIN takes either.
import { SUPABASE_URL, serviceHeaders } from "./_supabase.js";
import { isInstructorEmail } from "../src/instructors.js";

export async function callerAllowed(req, body) {
  if (pinMatches(body?.pin)) return true;
  const auth = req.headers?.authorization || req.headers?.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return false;
  try {
    const r = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { ...serviceHeaders(), Authorization: "Bearer " + token } });
    if (!r.ok) return false;
    const user = await r.json();
    return isInstructorEmail(user?.email);
  } catch { return false; }
}

export function readBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return null; }
  }
  return body && typeof body === "object" ? body : null;
}
