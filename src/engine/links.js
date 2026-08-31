// Whether the links still go anywhere.
//
// A dead link gets found in front of a room, which is the worst available
// moment to find one. The checking itself happens on the server, because a
// browser cannot see the status of a fetch to somebody else's site. Everything
// here is the part around the checking: which blocks have a link worth
// checking, how the answers get written back, and what an answer means.
//
// The answer is kept on the block, at `link`, so opening the page tomorrow
// still shows what was found today rather than an empty column and a button.

export const BATCH = 8;        // urls per request to the endpoint
export const LANES = 2;        // requests in flight at once

// Everything with a web address on it, whatever kind the block is filed under.
export const linkables = (items) => (items || []).filter(b => (b.url || "").trim());

export const hostOf = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
};

// What a result means in one word, and whether the word is bad news.
export function verdict(link) {
  if (!link || !link.at) return { word: "Not checked", bad: false, dim: true };
  if (link.status === 0) return { word: link.error || "No answer", bad: true };
  if (link.status === 404 || link.status === 410) return { word: "Gone, " + link.status, bad: true };
  if (link.status >= 500) return { word: "Server error, " + link.status, bad: true };
  if (link.status >= 400) return { word: "Refused, " + link.status, bad: true };
  if (link.to) return { word: "Moved", bad: false, moved: true };
  return { word: "Fine", bad: false, good: true };
}

export const isBad = (b) => verdict(b.link).bad;

// Ask the server about a handful of addresses.
export async function checkBatch(urls) {
  const r = await fetch("/api/check-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!r.ok) throw new Error("check failed: " + r.status);
  const data = await r.json();
  return data.results || [];
}

// Walk the whole shelf a batch at a time, reporting as answers come back so
// the page fills in rather than sitting still for a minute.
export async function checkAll(blocks, onSome, stamp) {
  const jobs = [];
  for (let i = 0; i < blocks.length; i += BATCH) jobs.push(blocks.slice(i, i + BATCH));
  const found = {};
  let next = 0;
  const lane = async () => {
    while (next < jobs.length) {
      const mine = jobs[next++];
      let results = [];
      try {
        results = await checkBatch(mine.map(b => b.url));
      } catch {
        results = mine.map(b => ({ url: b.url, ok: false, status: 0, error: "no answer" }));
      }
      const byUrl = {};
      results.forEach(r => { byUrl[r.url] = r; });
      const part = {};
      mine.forEach(b => {
        const r = byUrl[b.url];
        if (!r) return;
        part[b.id] = { at: stamp, status: r.status, to: r.to || "", error: r.error || "" };
      });
      Object.assign(found, part);
      if (onSome) onSome(part, Object.keys(found).length, blocks.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(LANES, jobs.length) }, lane));
  return found;
}

// The answers, written onto the blocks they belong to, one new store per store
// that has something to record.
export function linkPatches({ stores, classes, results, index }) {
  const home = {};
  (index || []).forEach(b => { home[b.id] = b.target; });
  const next = {};
  [...(classes || []).map(c => c.id), "shared"].forEach(target => {
    const cur = stores[target] || {};
    const blocks = cur.blocks || {};
    let changed = false;
    const out = { ...blocks };
    Object.entries(results || {}).forEach(([id, link]) => {
      if (home[id] !== target || !out[id]) return;
      out[id] = { ...out[id], link };
      changed = true;
    });
    if (changed) next[target] = { ...cur, blocks: out };
  });
  return next;
}
