// The words of a clip's transcript, cut so the review can show more than one
// line. Andrew, 2026-11-12: "give me more of the openers. you are giving me
// too little info for the opener, thesis, and closer," and "let me pop open a
// transcript of each one. make it look nice."
//
// Claude's read holds the transcript by turn, { at, text }, and a turn can be
// the whole clip, so everything here works by sentence: where a quoted line
// sits, the sentences around the line, and the transcript as paragraphs with
// the three quoted lines marked. Every word shown is the student's, as the
// transcript has the words; nothing is written here.

const norm = (w) => String(w || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const wordsOf = (s) => String(s || "").split(/\s+/).map(norm).filter(Boolean);
const count = (s) => String(s || "").split(/\s+/).filter(Boolean).length;

/** The transcript as sentences: [{ text, at, words }]. at is the turn's time, on a turn's first sentence only. */
export function sentencesOf(transcript) {
  const out = [];
  for (const turn of transcript || []) {
    const text = String(turn?.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const cut = text.split(/(?<=[.!?]["”’']?)\s+(?=["“‘']?[A-Z0-9])/);
    let first = true;
    for (const piece of cut) {
      // A transcript with no full stops is cut every thirty words, so a part of the clip can still be shown.
      const w = piece.split(" ");
      for (let i = 0; i < w.length; i += w.length > 60 ? 30 : w.length) {
        const part = w.slice(i, i + (w.length > 60 ? 30 : w.length)).join(" ");
        out.push({ text: part, at: first ? turn.at || "" : "", words: wordsOf(part) });
        first = false;
      }
    }
  }
  return out;
}

/** Where a quoted line sits: { from, to } as sentence numbers, or null when the words are not found. */
export function locate(sents, quote) {
  const q = wordsOf(quote);
  if (q.length < 3) return null;
  const flat = [];
  sents.forEach((s, i) => s.words.forEach(w => flat.push([w, i])));
  const find = (need, start, end) => {
    for (let i = start; i + need.length <= Math.min(flat.length, end); i++) if (need.every((w, j) => flat[i + j][0] === w)) return i;
    return -1;
  };
  let a = -1;
  for (const n of [5, 4, 3]) { a = find(q.slice(0, Math.min(n, q.length)), 0, flat.length); if (a >= 0) break; }
  if (a < 0) return null;
  const tail = q.slice(-Math.min(4, q.length));
  const b = find(tail, a, a + q.length * 2 + 12);
  const last = Math.min(flat.length - 1, b >= 0 ? b + tail.length - 1 : a + q.length - 1);
  return { from: flat[a][1], to: flat[last][1] };
}

// How many words of the clip to show on each side of the quoted line.
const ROOM = { opener: [70, 90], thesis: [45, 45], closer: [30, 130] };

/** The quoted line with the words around the line: { before, mark, after, cutStart, cutEnd }, or null. */
export function passageOf(sents, quote, part) {
  const at = locate(sents, quote);
  if (!at) return null;
  const [back, on] = ROOM[part] || ROOM.thesis;
  let a = at.from, b = at.to, n = 0;
  while (a > 0 && n + sents[a - 1].words.length <= back) { a--; n += sents[a].words.length; }
  n = 0;
  while (b < sents.length - 1 && n + sents[b + 1].words.length <= on) { b++; n += sents[b].words.length; }
  const say = (x, y) => sents.slice(x, y).map(s => s.text).join(" ");
  return { before: say(a, at.from), mark: say(at.from, at.to + 1), after: say(at.to + 1, b + 1), cutStart: a > 0, cutEnd: b < sents.length - 1 };
}

/** The transcript as paragraphs of runs: [{ at, runs: [{ text, part }] }]. parts is [[id, quote], ..]. */
export function paragraphsOf(sents, parts) {
  const mark = new Array(sents.length).fill("");
  for (const [id, quote] of parts || []) {
    const at = quote ? locate(sents, quote) : null;
    if (at) for (let i = at.from; i <= at.to; i++) if (!mark[i]) mark[i] = id;
  }
  const out = [];
  let n = 0;
  sents.forEach((s, i) => {
    let p = out[out.length - 1];
    // A new paragraph at a new turn, at a quoted line, and about every seventy words.
    if (!p || s.at || n >= 70 || (mark[i] && mark[i] !== mark[i - 1])) { p = { at: s.at, runs: [] }; out.push(p); n = 0; }
    const last = p.runs[p.runs.length - 1];
    if (last && last.part === mark[i]) last.text += " " + s.text;
    else p.runs.push({ text: s.text, part: mark[i] });
    n += count(s.text);
  });
  return out;
}

const URL_RE = /https?:\/\/[^\s<>")\]]+/g;
/** A source line as pieces: [{ text } | { url }]. */
export function sourcePieces(line) {
  const out = [];
  let at = 0;
  for (const m of String(line || "").matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;]+$/, "");
    if (m.index > at) out.push({ text: line.slice(at, m.index) });
    out.push({ url });
    at = m.index + url.length;
  }
  if (at < String(line || "").length) out.push({ text: line.slice(at) });
  return out.filter(p => p.url || p.text.trim());
}

/** What to call an address: { site, title }. The page's own title when the read has one, else the words in the address. */
export function nameOfLink(url, links) {
  const got = (links || {})[url] || {};
  let host = got.host || "", slug = "";
  try {
    const u = new URL(url);
    host = host || u.hostname.replace(/^www\./, "");
    const seg = u.pathname.split("/").filter(Boolean).filter(s => /[a-z]{3,}-[a-z]/i.test(s)).pop() || "";
    slug = decodeURIComponent(seg).replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").trim();
  } catch { /* an address that does not parse keeps its own text */ }
  return { site: got.site || host, title: String(got.title || slug).replace(/[\s|–-]+$/, "") };
}
