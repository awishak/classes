// Move the discussion boards out of the old hubs and into the engine.
//
// Four boards, sixty-six posts between them, sitting in stores nothing reads
// any more. The engine had no board surface until now, so they had nowhere to
// land; they do now, and leaving them behind would throw away a term of what
// students actually wrote.
//
//   node scripts/port-boards.mjs           dry run
//   node scripts/port-boards.mjs --write   writes
//
// Never writes to the old key, and merges rather than replaces: a board that
// already exists in the engine keeps its posts and gains only the ones the old
// hub has that it does not.

import { readFileSync } from "node:fs";

const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const BASE = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const get = async (id) => {
  const r = await fetch(BASE + "/rest/v1/app_data?id=eq." + encodeURIComponent(id) + "&select=data", { headers });
  return (await r.json())?.[0]?.data || null;
};
const put = async (id, data) => {
  const r = await fetch(BASE + "/rest/v1/app_data?on_conflict=id", {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(id + ": " + r.status + " " + (await r.text()).slice(0, 200));
};

// The same id rule the app uses, so a ported board and a cast prompt are one
// thread rather than two half-empty ones.
const idForPrompt = (prompt) =>
  "b" + [...(prompt || "").trim().toLowerCase().replace(/\s+/g, " ")]
    .reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36);

const JOBS = [
  { code: "COMM 118", from: "comm118-game-v14", to: "comm118-f26-v1-boards" },
  { code: "COMM 2", from: "comm2-v1", to: "comm2-s26-v1-boards" },
  { code: "COMM 4", from: "comm4-v1", to: "comm4-s26-v1-boards" },
];

const write = process.argv.includes("--write");
let n = 0;
const uid = (p) => p + "-" + (++n).toString(36);
let total = 0;

for (const job of JOBS) {
  const old = await get(job.from);
  const legacy = old?.boards || [];
  if (!legacy.length) { console.log("  " + job.code.padEnd(10) + "no boards"); continue; }

  const existing = (await get(job.to))?.boards || {};
  const next = { ...existing };
  let added = 0, posts = 0, merged = 0;

  legacy.forEach((b, i) => {
    const prompt = (b.title || b.prompt || "").trim();
    if (!prompt) return;
    const id = idForPrompt(prompt);
    const have = next[id];
    const seen = new Set((have?.posts || []).map(p => p.who + " " + p.text));
    const rows = [];
    // The old shape is { [studentName]: {text} } or { [studentName]: [{text}] }.
    Object.entries(b.posts || {}).forEach(([who, v]) => {
      const texts = Array.isArray(v) ? v.map(x => x?.text) : [v?.text];
      texts.filter(Boolean).forEach(text => {
        const t = String(text).trim();
        if (!t || seen.has(who + " " + t)) return;
        seen.add(who + " " + t);
        rows.push({ id: uid("p"), who, text: t, at: b.at || (1740000000000 + i * 86400000) });
      });
    });
    posts += rows.length;
    if (have) { merged++; next[id] = { ...have, posts: [...(have.posts || []), ...rows] }; }
    else { added++; next[id] = { id, prompt, at: b.at || 1740000000000, closed: true, posts: rows }; }
  });
  total += posts;

  console.log("  " + job.code.padEnd(10) + job.from + " to " + job.to);
  console.log("     " + added + " new, " + merged + " merged, " + posts + " posts carried");
  legacy.forEach(b => {
    const prompt = (b.title || b.prompt || "").trim();
    if (prompt) {
      const people = Object.keys(b.posts || {}).length;
      console.log("       " + JSON.stringify(prompt).slice(0, 54).padEnd(56) + people + " people");
    }
  });

  if (write) { await put(job.to, { boards: next }); console.log("     written"); }
}

console.log("\n  " + total + " posts in total");
if (!write) console.log("  dry run. nothing written. add --write to do it.");
