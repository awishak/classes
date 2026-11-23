// The final project's last step, as plain JS: what an exhibit is, what each
// class's checklist asks for, how two partners' saves meet, and when the
// builder locks. No React, so the smoke run and the server can both use the
// same rules.
//
// Andrew, 2026-11-23: "for both my comm 3 and comm 118 classes, we have to
// build a website builder ... they can build a site, what we're calling it is
// an exhibit. It's like a museum exhibit." A project is one of three things:
// an exhibit built here, a film, or an HTML file of their own. Every one of
// them carries a headline, a summary and sources.
//
// His answers to 78 questions that day set the rest; each rule below says
// which answer made the rule.

export const EXHIBIT_KEY = "final-project";
export const EXHIBIT_TITLE = "Final project";

// "let's make them all due Thursday at 12 pm Dec 10". Pacific.
export const FINAL_DUE = "2026-12-10T12:00:00-08:00";
// The outline is the builder's first step, graded Complete or Not quite.
// "let's make pre-pro due thursday not friday."
export const OUTLINE_DUE = "2026-12-03T23:59:00-08:00";

export const CLASSES = { comm3: "comm3-f26-v1", comm118: "comm118-f26-v1", comm999: "comm999-v1" };
export const PRACTICE = ["comm999"];

export const WAYS = [
  { id: "exhibit", name: "Exhibit" },
  { id: "film", name: "Film" },
  { id: "html", name: "My own HTML" },
];

// "give them each of these three options", picked apart from the palette.
export const TYPES = [
  { id: "news", name: "News feature" },
  { id: "museum", name: "Museum signage" },
  { id: "magazine", name: "Magazine" },
];
// Five, all light, the same in both classes. The colours live in the reader's
// stylesheet under these names.
export const PALETTES = ["orange", "green", "blue", "red", "violet"];
export const LAYOUTS = [{ id: "pages", name: "Pages" }, { id: "scroll", name: "One scroll" }];

export const MAX_PAGES = 6;
export const SUMMARY_WORDS = 50;
export const MAX_DOC = 600000;        // characters of JSON
export const MAX_COMMENT = 2000;

// The blocks. `visual` is what one of the block counts for toward COMM 118's
// "at least 10 graphics or images or videos or interactive things": every
// image counts, a gallery of four is four, audio does not count.
export const BLOCKS = [
  { t: "text", name: "Text", group: "Words" },
  { t: "heading", name: "Heading", group: "Words" },
  { t: "quote", name: "Big quote", group: "Words" },
  { t: "concept", name: "Concept", group: "Words" },
  { t: "number", name: "Big number", group: "Words" },
  { t: "photo", name: "Photo or graphic", group: "Pictures" },
  { t: "gallery", name: "Photo gallery", group: "Pictures" },
  { t: "slider", name: "Before and after", group: "Pictures" },
  { t: "audio", name: "Audio clip", group: "Sound and video" },
  { t: "video", name: "Video link", group: "Sound and video" },
  { t: "embed", name: "Post or chart", group: "Sound and video" },
  { t: "timeline", name: "Timeline", group: "Interactive" },
  { t: "quiz", name: "Quiz", group: "Interactive" },
  { t: "map", name: "Map", group: "Interactive" },
  { t: "link", name: "Link card", group: "Interactive" },
];
export const blockName = (t) => (BLOCKS.find(b => b.t === t) || {}).name || t;

let seq = 0;
export const newId = (p = "b") => p + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);

export function newBlock(t, now = Date.now()) {
  const base = { id: newId("b"), t, at: now };
  if (t === "text") return { ...base, text: "" };
  if (t === "heading") return { ...base, text: "" };
  if (t === "quote") return { ...base, text: "", who: "" };
  if (t === "concept") return { ...base, name: "", def: "", source: "" };
  if (t === "number") return { ...base, n: "", w: "", source: "" };
  if (t === "photo") return { ...base, size: "col", url: "", alt: "", credit: "", cap: "", mine: false };
  if (t === "gallery") return { ...base, items: [] };
  if (t === "slider") return { ...base, a: "", aAlt: "", b: "", bAlt: "", labelA: "Before", labelB: "After", cap: "", credit: "" };
  if (t === "audio") return { ...base, url: "", title: "", transcript: "" };
  if (t === "video") return { ...base, url: "", title: "" };
  if (t === "embed") return { ...base, url: "", title: "" };
  if (t === "timeline") return { ...base, rows: [{ when: "", title: "", text: "" }] };
  if (t === "quiz") return { ...base, q: "", options: ["", ""], right: 0, ans: "" };
  if (t === "map") return { ...base, pins: [], cap: "" };
  if (t === "link") return { ...base, url: "", title: "", sub: "" };
  return base;
}
export const newPage = (name = "", now = Date.now()) => ({ id: newId("p"), name, plan: "", at: now, orderAt: now, blocks: [] });
export const newSource = (now = Date.now()) => ({ id: newId("s"), kind: "", author: "", year: "", title: "", outlet: "", url: "", note: "", at: now });

/** A new project: one page, nothing on it. */
export function emptyDoc({ id, cls, makers, names }, now = Date.now()) {
  return {
    id, cls, makers, names, rev: 0, created: now, updated: now,
    way: "exhibit", type: "news", pal: PALETTES[0], layout: "pages", area: "",
    headline: "", summary: "", cover: { url: "", alt: "", credit: "" },
    pages: [newPage("Start here", now)], pagesAt: now,
    sources: [], sourcesAt: now,
    film: { url: "", captions: false }, html: { url: "", name: "" },
    interview: "", ai: "", who: "", gone: {}, at: {},
  };
}

// ─── words ───

export const words = (s) => (String(s || "").trim().match(/\S+/g) || []).length;
// A text block's words without its marks: **bold**, _italic_, [[source|words]].
export const plain = (s) => String(s || "").replace(/\[\[[^|\]]*\|([^\]]*)\]\]/g, "$1").replace(/\*\*|__?/g, "");
const blockWords = (b) => {
  if (b.t === "text" || b.t === "heading") return words(plain(b.text));
  if (b.t === "quote") return words(b.text);
  if (b.t === "concept") return words(b.def);
  if (b.t === "timeline") return (b.rows || []).reduce((n, r) => n + words(r.title) + words(r.text), 0);
  return 0;
};
export const allBlocks = (doc) => (doc?.pages || []).flatMap(p => p.blocks || []);
export const wordCount = (doc) => allBlocks(doc).reduce((n, b) => n + blockWords(b), 0);

/** The source ids a text points at. */
export const citedIn = (text) => [...String(text || "").matchAll(/\[\[([^|\]]+)\|/g)].map(m => m[1]);

// ─── links ───

// An address this site will show or link: http or https, or a file of our own (the sample's pictures).
export const safeUrl = (u) => { const s = String(u || "").trim(); return /^https?:\/\/[^\s<>"']+$/i.test(s) || /^\/(?!\/)[^\s<>"']*$/.test(s) ? s : ""; };

/** Where a video link plays: { kind, src } for a frame, or null when the link is not one we play. */
export function videoOf(url) {
  const u = safeUrl(url); if (!u) return null;
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return { kind: "YouTube", src: "https://www.youtube-nocookie.com/embed/" + m[1] };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-z0-9]+))?/i);
  if (m) return { kind: "Vimeo", src: "https://player.vimeo.com/video/" + m[1] + (m[2] ? "?h=" + m[2] : "") };
  m = u.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/) || u.match(/drive\.google\.com\/open\?id=([A-Za-z0-9_-]+)/);
  if (m) return { kind: "Google Drive", src: "https://drive.google.com/file/d/" + m[1] + "/preview" };
  return null;
}
/** Where a post or a chart plays. TikTok, Instagram, Datawrapper and Canva: "Charts from Datawrapper or Canva", "TikTok and Instagram posts". */
export function embedOf(url) {
  const u = safeUrl(url); if (!u) return null;
  let m = u.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (m) return { kind: "TikTok", src: "https://www.tiktok.com/embed/v2/" + m[1], shape: "tall" };
  m = u.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (m) return { kind: "Instagram", src: "https://www.instagram.com/" + m[1] + "/" + m[2] + "/embed", shape: "tall" };
  m = u.match(/datawrapper\.dwcdn\.net\/([A-Za-z0-9]+)(?:\/(\d+))?/) || u.match(/datawrapper\.de\/_\/([A-Za-z0-9]+)/);
  if (m) return { kind: "Datawrapper", src: "https://datawrapper.dwcdn.net/" + m[1] + "/" + (m[2] || "1") + "/", shape: "chart" };
  m = u.match(/canva\.com\/design\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)/);
  if (m) return { kind: "Canva", src: "https://www.canva.com/design/" + m[1] + "/" + m[2] + "/view?embed", shape: "chart" };
  return null;
}

// ─── the checklist ───

const hasImg = (x) => !!safeUrl(x);
/** Every picture on the exhibit, with the words it carries. */
export function pictures(doc) {
  const out = [];
  if (doc?.cover?.url) out.push({ where: "Cover", ...doc.cover });
  for (const p of doc?.pages || []) for (const b of p.blocks || []) {
    if (b.t === "photo" && hasImg(b.url)) { out.push({ where: p.name, url: b.url, alt: b.alt, credit: b.credit }); if (b.size === "pair" && hasImg(b.url2)) out.push({ where: p.name, url: b.url2, alt: b.alt2, credit: b.credit2 }); }
    if (b.t === "gallery") for (const it of b.items || []) if (hasImg(it.url)) out.push({ where: p.name, ...it });
    if (b.t === "slider") { if (hasImg(b.a)) out.push({ where: p.name, url: b.a, alt: b.aAlt, credit: b.credit }); if (hasImg(b.b)) out.push({ where: p.name, url: b.b, alt: b.bAlt, credit: b.credit }); }
  }
  return out;
}
/** COMM 118's ten: every image, and one each for a video, a post or chart, a timeline, a map and a quiz. */
export function visualCount(doc) {
  let n = pictures(doc).filter(p => p.where !== "Cover").length + (doc?.cover?.url ? 1 : 0);
  for (const b of allBlocks(doc)) {
    if (b.t === "video" && videoOf(b.url)) n++;
    if (b.t === "embed" && embedOf(b.url)) n++;
    if (b.t === "timeline" && (b.rows || []).some(r => r.title || r.text)) n++;
    if (b.t === "map" && (b.pins || []).length) n++;
    if (b.t === "quiz" && b.q) n++;
  }
  return n;
}
const count = (doc, f) => allBlocks(doc).filter(f).length;
const sourcesOf = (doc, kind) => (doc?.sources || []).filter(s => (s.title || s.author) && (!kind || s.kind === kind)).length;

/**
 * What the class asks for, each line { id, say, have, need, ok }. Nothing
 * here blocks a hand-in: "A list per class that ticks itself as they build.
 * It never blocks handing in."
 */
export function checklist(doc, classId) {
  const d = doc || {};
  const line = (id, say, have, need) => ({ id, say, have, need, ok: have >= need });
  const yes = (id, say, ok) => ({ id, say, have: ok ? 1 : 0, need: 1, ok: !!ok });
  const out = [
    yes("headline", "A headline", !!String(d.headline || "").trim()),
    yes("summary", `A summary, up to ${SUMMARY_WORDS} words`, words(d.summary) > 0 && words(d.summary) <= SUMMARY_WORDS),
    yes("ai", "How you used AI", !!String(d.ai || "").trim()),
  ];
  const audio = count(d, b => b.t === "audio" && safeUrl(b.url));
  const video = count(d, b => b.t === "video" && videoOf(b.url)) + (d.way === "film" && videoOf(d.film?.url) ? 1 : 0);
  const pics = pictures(d).length;
  if (classId === "comm118") {
    out.push(line("academic", "Academic sources", sourcesOf(d, "academic"), 5));
    out.push(line("popular", "Popular press sources", sourcesOf(d, "popular"), 5));
  } else {
    out.push(line("sources", "Sources", sourcesOf(d), 5));
    out.push(line("academic", "Academic sources", sourcesOf(d, "academic"), 2));
  }
  if (d.way === "film") {
    out.push(yes("film", "A link to your film", !!videoOf(d.film?.url)));
    out.push(yes("captions", "Captions are on", d.film?.captions === true));
    return out;
  }
  if (d.way === "html") { out.push(yes("html", "Your HTML file", !!safeUrl(d.html?.url))); return out; }
  if (classId === "comm118") {
    out.push(line("concepts", "Concepts explicated", count(d, b => b.t === "concept" && b.name && b.def), 3));
    out.push(line("audio", "An audio clip", audio, 1));
    out.push(line("visual", "Images, graphics, videos or interactive things", visualCount(d), 10));
  } else {
    out.push(line("audio", "An audio clip", audio, 1));
    out.push(yes("interview", "An interview", !!String(d.interview || "").trim()));
    out.push(line("pictures", "Images or video", pics + video, 1));
  }
  const bare = pictures(d).filter(p => !String(p.alt || "").trim() || !String(p.credit || "").trim()).length;
  if (pics) out.push({ id: "photowords", say: "A credit and a description on every image", have: pics - bare, need: pics, ok: bare === 0 });
  const clips = allBlocks(d).filter(b => b.t === "audio" && safeUrl(b.url));
  if (clips.length) { const done = clips.filter(b => String(b.transcript || "").trim()).length; out.push({ id: "transcripts", say: "A transcript on every audio clip", have: done, need: clips.length, ok: done === clips.length }); }
  return out;
}

/** Whether the outline, the builder's first step, is there: a headline, a summary, and a plan on every page. */
export function outlineDone(doc) {
  const d = doc || {};
  if (!String(d.headline || "").trim() || !String(d.summary || "").trim()) return false;
  if (d.way !== "exhibit") return true;
  const pages = d.pages || [];
  return pages.length > 0 && pages.every(p => String(p.name || "").trim() && String(p.plan || "").trim());
}

// ─── the lock ───

/** Whether the builder is closed: past the deadline, unless he has reopened this one until a later time. */
export function lockedAt(now, { due = FINAL_DUE, until = "" } = {}) {
  const t = typeof now === "number" ? now : Date.parse(now);
  if (t <= Date.parse(due)) return false;
  return !(until && t <= Date.parse(until));
}

// ─── two partners, one exhibit ───
//
// "One shared exhibit": both partners open the same file and either can edit.
// A save carries the whole file. When the file on the server moved since this
// browser last read it, the two are merged thing by thing: the newer copy of
// each page, block and source wins, a thing one partner deleted stays
// deleted, and each top-level field goes to whoever changed it last.

const byId = (list) => new Map((list || []).map(x => [x.id, x]));
function mergeList(mine, theirs, mineAt, theirsAt, gone, each) {
  const a = byId(mine), b = byId(theirs);
  const order = (mineAt || 0) >= (theirsAt || 0) ? [...(mine || []), ...(theirs || [])] : [...(theirs || []), ...(mine || [])];
  const seen = new Set(), out = [];
  for (const x of order) {
    if (!x || seen.has(x.id)) continue; seen.add(x.id);
    const m = a.get(x.id), t = b.get(x.id);
    let pick = m && t ? ((m.at || 0) >= (t.at || 0) ? m : t) : (m || t);
    if ((gone[x.id] || 0) >= (pick.at || 0)) continue;
    if (each && m && t) pick = each(pick, m, t);
    out.push(pick);
  }
  return out;
}
export function mergeDocs(server, incoming) {
  const s = server || {}, c = incoming || {};
  const gone = { ...(s.gone || {}) };
  for (const [k, v] of Object.entries(c.gone || {})) gone[k] = Math.max(gone[k] || 0, v || 0);
  const at = { ...(s.at || {}) }, out = { ...s };
  for (const [k, v] of Object.entries(c.at || {})) if ((v || 0) >= (at[k] || 0)) { at[k] = v; out[k] = c[k]; }
  out.at = at; out.gone = gone;
  out.pages = mergeList(c.pages, s.pages, c.pagesAt, s.pagesAt, gone, (pick, m, t) => ({
    ...pick, orderAt: Math.max(m.orderAt || 0, t.orderAt || 0),
    blocks: mergeList(m.blocks, t.blocks, m.orderAt, t.orderAt, gone),
  }));
  out.pagesAt = Math.max(c.pagesAt || 0, s.pagesAt || 0);
  out.sources = mergeList(c.sources, s.sources, c.sourcesAt, s.sourcesAt, gone);
  out.sourcesAt = Math.max(c.sourcesAt || 0, s.sourcesAt || 0);
  // What only the server sets.
  for (const k of ["id", "cls", "makers", "names", "created", "preview", "staff"]) out[k] = s[k];
  return out;
}

/** What a reader gets: the file without the makers' private parts. */
export function publicDoc(doc) {
  const { who, preview, makers, gone, at, ...rest } = doc || {};
  return rest;
}

/** The address of an exhibit: its id, then its headline as words. */
export const slugOf = (doc) => {
  const tail = String(doc?.headline || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return tail ? doc.id + "-" + tail : String(doc?.id || "");
};
export const idOfSlug = (slug) => String(slug || "").split("-")[0].replace(/[^a-z0-9]/g, "");
export const exhibitHref = (doc) => `/${doc.cls}/exhibits/${slugOf(doc)}`;

/** A source the way a reference list prints one. Author. (Year). Title. Outlet. */
export function citeOf(s) {
  const dot = (x) => { const t = String(x || "").trim(); return t ? (/[.?!]$/.test(t) ? t : t + ".") : ""; };
  const year = String(s?.year || "").trim();
  return { lead: [dot(s?.author), year ? `(${year}).` : "", dot(s?.title)].filter(Boolean).join(" "), outlet: dot(s?.outlet) };
}
