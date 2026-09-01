// The right answers, put back on the question blocks.
//
// The porting script turned every quiz, trivia and survey question into a
// block and flattened what it knew into a sentence: "Options: a · b · c · d".
// Which option was the right one never came across, and neither did the
// category a weekly game question is scored under. So the shelf holds 157
// questions that cannot be made into a game without opening the old game to
// look the answers up, which is exactly the trip the shelf exists to save.
//
// The old games still hold all of it. This walks them, matches a question to
// its block on the text, and writes the structure onto the block at `q`:
//
//   q: { options: [...], correct: 2, category: "on_topic", answer: "Free, liberty" }
//
// Additive. Nothing is renamed, nothing is deleted, and a block that already
// carries an answer is left alone.
//
//   node scripts/answers-to-blocks.mjs           dry run
//   node scripts/answers-to-blocks.mjs --write   writes

import { readFileSync } from "node:fs";

const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const BASE = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const WRITE = process.argv.includes("--write");

const PAIRS = [
  { code: "COMM 2", legacy: "comm2-v1", store: "comm2-s26-v1" },
  { code: "COMM 4", legacy: "comm4-v1", store: "comm4-s26-v1" },
  { code: "COMM 118", legacy: "comm118-game-v14", store: "comm118-f26-v1" },
];

const get = async (id) =>
  (await (await fetch(BASE + "/rest/v1/app_data?id=eq." + id + "&select=data", { headers })).json())?.[0]?.data || null;

const put = async (id, data) => {
  const r = await fetch(BASE + "/rest/v1/app_data?id=eq." + id, {
    method: "PATCH", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify({ data }),
  });
  if (!r.ok) throw new Error("write failed: " + r.status + " " + (await r.text()));
};

// The same comparison the porting script used to decide two questions were
// one question, so a block matches the question it was made from.
const norm = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,;:!?"']/g, "");

// Every question in an old store, whatever screen it was written on.
function questionsIn(legacy) {
  const out = [];
  const take = (q, category) => {
    const text = q?.text || q?.prompt || q?.question || "";
    if (!text) return;
    out.push({
      text,
      options: Array.isArray(q.options) ? q.options : [],
      correct: Number.isInteger(q.correct) ? q.correct : null,
      answer: q.expectedAnswer || "",
      category: category || q.category || "",
    });
  };
  Object.values(legacy.weeklyGames || {}).forEach(g => (g?.questions || []).forEach(q => take(q)));
  Object.values(legacy.weeklyToT || {}).forEach(g => (g?.questions || []).forEach(q => take(q)));
  Object.values(legacy.triviaGames || {}).forEach(g => [...(g?.rounds || []), ...(g?.questions || [])].forEach(q => take(q)));
  (legacy.triviaQuestionPool || []).forEach(q => take(q));
  (legacy.surveys || []).forEach(s => (s.questions || []).forEach(q => take(q)));
  return out;
}

// Worth writing only when it says something the block does not already say.
const worth = (q) => q.correct !== null || q.answer || q.category || q.options.length;

let touched = 0;
for (const { code, legacy: legacyKey, store: storeKey } of PAIRS) {
  const legacy = await get(legacyKey);
  const store = await get(storeKey);
  if (!legacy || !store) { console.log("  " + code + ": nothing to read"); continue; }

  const found = new Map();
  questionsIn(legacy).forEach(q => { if (!found.has(norm(q.text)) && worth(q)) found.set(norm(q.text), q); });

  const blocks = { ...(store.blocks || {}) };
  let filled = 0;
  let already = 0;
  let missed = 0;
  Object.entries(blocks).forEach(([id, b]) => {
    if (b.type !== "question") return;
    if (b.q && (b.q.correct !== undefined || b.q.answer)) { already++; return; }
    const q = found.get(norm(b.title));
    if (!q) { missed++; return; }
    blocks[id] = { ...b, q: { options: q.options, correct: q.correct, answer: q.answer, category: q.category } };
    filled++;
  });

  console.log("  " + code + ": " + filled + " answered, " + already + " already had answers, " + missed + " with nothing to find");
  if (filled && WRITE) {
    await put(storeKey, { ...store, blocks });
    console.log("     written to " + storeKey);
  }
  touched += filled;
}

console.log(WRITE ? "\nanswers-to-blocks: " + touched + " questions repaired"
                  : "\nanswers-to-blocks: dry run, " + touched + " questions would be repaired. Run again with --write.");
