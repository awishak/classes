// The Supabase project, for routes that act with the service role.
//
// The browser talks to this project with the anon key that ships in the
// bundle (src/storage-shim.js). The service role key can do anything to the
// project, so the key never leaves the server: it lives in Vercel's env and is
// read here only.  Set it with:  vercel env add SUPABASE_SERVICE_ROLE_KEY

export const SUPABASE_URL = process.env.SUPABASE_URL || "https://ybuchgebudixbyrcxpik.supabase.co";

export function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function serviceHeaders() {
  const key = serviceKey();
  return { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
}
