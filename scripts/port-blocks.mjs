// Turn five repositories into one.
//
// Reads the old forked stores and the current engine stores, and writes blocks.
// Nothing is deleted and no source key is written to: a class's blocks go into
// its own store under `blocks`, and the ones that belong to me rather than to a
// class go to the shared store.
//
//   node scripts/port-blocks.mjs           dry run
//   node scripts/port-blocks.mjs --write   writes
//
// Decisions this encodes, all of them Andrew's:
//   - question sets stay sets: the game is a block holding its questions
//   - the research-methods readings move from COMM 118 to COMM 4
//   - shelves are dropped; a stocked thing is just a block
//   - seeds belong to me, not to a class, so they go to the shared store
//   - an assignment block holds what the assignment ASKS FOR and points at the
//     assignment by id; grades, rubrics and submissions stay where they are

import { readFileSync } from "node:fs";

const shim = readFileSync(new URL("../src/storage-shim.js", import.meta.url), "utf8");
const BASE = shim.match(/SUPABASE_URL = "([^"]+)"/)[1];
const KEY = shim.match(/SUPABASE_KEY = "([^"]+)"/)[1];
const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const get = async (id) => {
  const r = await fetch(BASE + "/rest/v1/app_data?id=eq." + encodeURIComponent(id) + "&select=data", { headers });
  const rows = await r.json();
  return rows?.[0]?.data || null;
};
const put = async (id, data) => {
  const r = await fetch(BASE + "/rest/v1/app_data?on_conflict=id", {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(id + ": " + r.status + " " + (await r.text()).slice(0, 200));
};

const STAMP = "2026-08-26";
let n = 0;
const uid = (p) => p + "-" + (++n).toString(36);

const mk = (p) => ({
  id: uid("b"), type: "note", title: "", body: "", url: "", headline: "",
  children: [], tags: [], concept: "", source: "", refId: "",
  created: STAMP, scheduled: [], ...p,
});

// The research-methods textbook sitting in the sports class. Andrew: move it.
const RESEARCH = /researchmethods\.uni\.edu/i;

const CLASSES = [
  { code: "COMM 2",   legacy: "comm2-v1",         store: "comm2-s26-v1" },
  { code: "COMM 4",   legacy: "comm4-v1",         store: "comm4-s26-v1" },
  { code: "COMM 118", legacy: "comm118-game-v14", store: "comm118-f26-v1" },
];

// ─── one class's blocks ───
// The sources overlap almost completely, and the dry run is what showed it: all
// 31 trivia-pool questions are already inside the trivia games, all 68 reading
// URLs are already in the library, and 40 of 41 stocked links are too. Taken at
// face value that is 437 blocks, most of them the same thing two or three
// times. So everything goes through a key — a URL where there is one, the title
// otherwise, a question by its text. First writer wins, and a later source only
// fills in what the first left blank.
const norm = (x) => (x || "").trim().toLowerCase().replace(/\/+$/, "");
const keyOf = (p) => p.type === "question" ? "q:" + norm(p.title)
  : p.url ? "u:" + norm(p.url) : "t:" + p.type + ":" + norm(p.title);

function buildFor(code, legacy, store) {
  const out = [];
  const moved = [];
  const seen = new Map();
  const add = (p) => {
    if (!(p.title || "").trim()) return null;
    const k = keyOf(p);
    const had = seen.get(k);
    if (had) {
      // Same thing, second source. Keep what is there and take what it adds —
      // the stocked copy of a reading usually carries the headline the library
      // copy never had.
      if (!had.headline && p.headline) had.headline = p.headline;
      if (!had.body && p.body) had.body = p.body;
      if (!had.url && p.url) had.url = p.url;
      (p.tags || []).forEach(t => { if (!had.tags.includes(t)) had.tags.push(t); });
      return had;
    }
    const b = mk(p);
    seen.set(k, b);
    out.push(b);
    return b;
  };

  // library — what the engine already had
  (store.library || []).forEach(l => add({
    type: l.type === "assignment" ? "assignment" : l.type === "activity" ? "activity" : "link",
    title: l.title || "", url: l.url || "", tags: l.category ? [l.category] : [],
    body: l.notes || "",
  }));

  // readings from the old hub. The key catches the ones the library already has.
  (legacy.readings || []).forEach(r => {
    const b = { type: "link", title: r.title || "", url: r.url || "",
      body: r.notes || "", tags: r.category ? [r.category] : [] };
    if (code === "COMM 118" && RESEARCH.test(r.url || "")) { moved.push(b); return; }
    add(b);
  });

  // the textbook and anything else required
  [...(legacy.requiredMedia || []), ...(legacy.media || [])].forEach(m => add({
    type: "link", title: m.title || "", url: m.url || "",
    body: m.description || m.notes || "", tags: ["required"],
  }));

  // stocked — shelves dropped, the thing itself kept
  const st = store.stocked || {};
  const loose = [...(st.any || []),
    ...Object.values(st.day || {}).flat(),
    ...Object.values(st.week || {}).flat()];
  loose.forEach(s => add({
    type: s.url ? "link" : "note", title: s.title || "", url: s.url || "", headline: s.claim || "",
  }));

  // to-dos
  (legacy.todos || []).forEach(t => add({
    type: "note", title: t.title || "", body: t.due ? "Due " + t.due : "",
  }));

  // discussion boards, as blocks, with what got posted
  (legacy.boards || []).forEach((bd, i) => {
    const posts = bd.posts || {};
    const lines = Object.entries(posts).map(([who, v]) => {
      const texts = Array.isArray(v) ? v.map(x => x.text) : [v?.text];
      return who + ": " + texts.filter(Boolean).join(" / ");
    });
    add({ type: "board", title: bd.title || bd.prompt || ("Discussion board " + (i + 1)),
      body: lines.join("\n\n"), tags: ["spring 2026"] });
  });

  // question SETS: the game is the block, its questions are its children
  const setFrom = (title, questions, tag) => {
    if (!questions?.length) return;
    // When a question already exists — the pool is saved out of the games, so
    // every one of them does — the set references the block that is already
    // there rather than making a second copy. That is what blocks are for.
    const kids = questions.map(q => add({
      type: "question", title: q.text || q.prompt || q.question || "",
      body: [q.expectedAnswer ? "Answer: " + q.expectedAnswer : "",
             Array.isArray(q.options) ? "Options: " + q.options.join(" · ") : ""].filter(Boolean).join("\n"),
      tags: tag ? [tag] : [],
    })).filter(Boolean);
    if (!kids.length) return;
    add({ type: "set", title: title || "Untitled set", children: kids.map(k => k.id), tags: tag ? [tag] : [] });
  };

  Object.entries(legacy.weeklyGames || {}).forEach(([wk, g]) =>
    setFrom("Weekly Game, week " + wk, g?.questions, "weekly game"));
  const played = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return isNaN(d) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  Object.values(legacy.triviaGames || {}).forEach(g => {
    const named = (g?.title || "").trim();
    const useful = named && !/^untitled/i.test(named);
    setFrom(useful ? named : ("Team Trivia · " + (played(g?.ts) || "undated")), g?.rounds || g?.questions, "team trivia");
  });
  if ((legacy.triviaQuestionPool || []).length)
    setFrom("Trivia question pool", legacy.triviaQuestionPool, "team trivia");
  (legacy.surveys || []).forEach(s => setFrom(s.title || "Survey", s.questions, "survey"));

  // Where a thing sat on the schedule is what it is about, so the week's topic
  // becomes a tag. A reading used in two weeks gets both.
  const topicsFor = new Map();
  (store.schedule || []).forEach(w => {
    const topic = (w.topic || "").trim();
    if (!topic) return;
    (w.items || []).forEach(it => {
      const lib = (store.library || []).find(l => l.id === it.libId);
      const k = lib?.url ? "u:" + norm(lib.url) : "t:link:" + norm(it.title || lib?.title);
      const set = topicsFor.get(k) || new Set();
      set.add(topic);
      topicsFor.set(k, set);
    });
  });
  out.forEach(b => {
    const k = keyOf(b);
    const topics = topicsFor.get(k);
    if (topics) topics.forEach(t => { if (!b.tags.includes(t)) b.tags.push(t); });
  });

  // an assignment block is what the assignment asks for
  (store.assignments || []).forEach(a => add({
    type: "assignment", title: a.title || "", body: a.description || "",
    url: a.instructionsUrl || "", refId: a.id,
    tags: a.due && a.due !== "Ongoing" ? ["due " + a.due] : [],
  }));

  return { blocks: out, moved };
}

// ─── run ───
const write = process.argv.includes("--write");
const loaded = {};
for (const c of CLASSES) {
  loaded[c.code] = { legacy: (await get(c.legacy)) || {}, store: (await get(c.store)) || {} };
}

const built = {};
let movedToC4 = [];
for (const c of CLASSES) {
  const { legacy, store } = loaded[c.code];
  const r = buildFor(c.code, legacy, store);
  built[c.code] = r.blocks;
  if (r.moved.length) movedToC4 = movedToC4.concat(r.moved);
}
// the research-methods chapters land in COMM 4, deduped against what it has
const c4Keys = new Set(built["COMM 4"].map(keyOf));
movedToC4.forEach(b => { if (!c4Keys.has(keyOf(b))) { c4Keys.add(keyOf(b)); built["COMM 4"].push(mk(b)); } });

// seeds belong to me rather than to any class
const cfg = readFileSync(new URL("../src/config/comm999.js", import.meta.url), "utf8");
const seedTitles = [...cfg.matchAll(/title: "([^"]+)",\n\s+concept: "([^"]+)"/g)];
const sharedBlocks = seedTitles.map(([, title, concept]) =>
  mk({ type: "story", title, concept, tags: [concept] }));

// ─── report ───
const byType = (list) => {
  const c = {};
  list.forEach(b => { c[b.type] = (c[b.type] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([t, k]) => t + " " + k).join(" · ");
};

console.log("");
for (const c of CLASSES) {
  const list = built[c.code];
  console.log("  " + c.code.padEnd(10) + list.length + " blocks");
  console.log("     " + byType(list));
  const sets = list.filter(b => b.type === "set");
  if (sets.length) console.log("     sets: " + sets.map(s => s.title + " (" + s.children.length + ")").join(", "));
  const tagged = list.filter(b => b.tags.length);
  const topics = [...new Set(list.flatMap(b => b.tags))].sort();
  console.log("     tagged " + tagged.length + "/" + list.length + " · " + topics.length + " tags: " + topics.slice(0, 8).join(", ") + (topics.length > 8 ? "…" : ""));
}
console.log("  " + "Dr. Ishak".padEnd(10) + sharedBlocks.length + " blocks");
console.log("     " + byType(sharedBlocks) + " — " + sharedBlocks.map(b => b.title).join(", "));
console.log("");
console.log("  moved COMM 118 → COMM 4: " + movedToC4.length + " research-methods readings");
console.log("  total: " + (CLASSES.reduce((t, c) => t + built[c.code].length, 0) + sharedBlocks.length) + " blocks");

if (write) {
  for (const c of CLASSES) {
    const data = loaded[c.code].store;
    const blocks = {};
    built[c.code].forEach(b => { blocks[b.id] = b; });
    await put(c.store, { ...data, blocks });
    console.log("  written: " + c.store);
  }
  const existing = (await get("ishak-blocks-v1")) || {};
  const sb = {};
  sharedBlocks.forEach(b => { sb[b.id] = b; });
  await put("ishak-blocks-v1", { ...existing, blocks: sb });
  console.log("  written: ishak-blocks-v1");
} else {
  console.log("\n  dry run. nothing written. add --write to do it.");
}
