// The games' way into Supabase, without an SDK.
//
// The decks package writes its queries the way supabase-js does:
// sb.from(table).select().eq(...).order(...), then await. This file answers
// those calls with plain REST, the way storage-shim.js and session.js already
// talk to the project, and signs each one with the signed-in person's token.
// The database's rules for games (decks migrations 003 and 004) read who is
// asking off that token, so a student can only ever write their own answers.
//
// There is no realtime channel here. The game panel and the phones ask again
// every few seconds instead (watchGame in decks), which is plenty for a class.

import { SUPABASE_URL, SUPABASE_KEY } from "../storage-shim.js";
import { accessToken } from "./session.js";

const REST = SUPABASE_URL + "/rest/v1/";

const literal = (v) => (v === null ? "null" : typeof v === "boolean" ? String(v) : String(v));
const quoted = (v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

async function headersFor(extra = {}) {
  const token = await accessToken();
  return { apikey: SUPABASE_KEY, Authorization: "Bearer " + (token || SUPABASE_KEY), "Content-Type": "application/json", ...extra };
}

async function answer(res) {
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) return { data: null, error: { message: body?.message || String(res.status), code: body?.code || String(res.status) } };
  return { data: body, error: null };
}

function query(table, method, body, opts = {}) {
  const params = [];
  let columns = null;
  let wantRows = false;
  const q = {
    select(cols) { columns = (cols || "*").replace(/\s+/g, ""); wantRows = true; return q; },
    eq(k, v) { params.push([k, "eq." + literal(v)]); return q; },
    in(k, list) { params.push([k, `in.(${list.map(quoted).join(",")})`]); return q; },
    is(k, v) { params.push([k, "is." + literal(v)]); return q; },
    not(k, op, v) { params.push([k, `not.${op}.${literal(v)}`]); return q; },
    or(expr) { params.push(["or", `(${expr})`]); return q; },
    order(col, o = {}) { params.push(["order", `${col}.${o.ascending === false ? "desc" : "asc"}`]); return q; },
    then(resolve, reject) { return run().then(resolve, reject); },
  };
  async function run() {
    try {
      const search = new URLSearchParams();
      if (method === "GET") search.set("select", columns || "*");
      else if (wantRows) search.set("select", columns || "*");
      if (opts.onConflict) search.set("on_conflict", opts.onConflict);
      params.forEach(([k, v]) => search.append(k, v));
      const prefer = [];
      if (method !== "GET" && wantRows) prefer.push("return=representation");
      if (opts.upsert) prefer.push("resolution=merge-duplicates");
      const res = await fetch(REST + table + "?" + search.toString(), {
        method,
        headers: await headersFor(prefer.length ? { Prefer: prefer.join(",") } : {}),
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return await answer(res);
    } catch (e) {
      return { data: null, error: { message: e.message, code: "network" } };
    }
  }
  return q;
}

export const gameClient = {
  from: (table) => ({
    select: (cols) => query(table, "GET").select(cols),
    insert: (row) => query(table, "POST", row),
    update: (patch) => query(table, "PATCH", patch),
    upsert: (row, o = {}) => query(table, "POST", row, { upsert: true, onConflict: o.onConflict }),
    delete: () => query(table, "DELETE"),
  }),
  async rpc(name, args) {
    try {
      const res = await fetch(REST + "rpc/" + name, { method: "POST", headers: await headersFor(), body: JSON.stringify(args || {}) });
      return await answer(res);
    } catch (e) {
      return { data: null, error: { message: e.message, code: "network" } };
    }
  },
};
