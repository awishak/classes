// The visual story as data, and the rules Submit checks. Plain JS, so the
// smoke run checks the rules without a browser.
//
// A story is worksheet answers, one field each, so a save touches one block
// and never the whole story:
//   headline       the headline
//   link           an optional link to an interactive version
//   order          JSON list of block ids, top to bottom
//   feature        the block id of the feature image
//   look           "light" or "dark": a white or a black page, the student's choice
//   block:<id>     JSON for one block (ids are letters, the field rule)
//   kind           "html" when the student made the story as an HTML file;
//                  anything else, or no row, is a story built here
//   html           JSON { path, name, size } for the uploaded HTML file
// An image block: { type: "image", path, w, h, layout, caption, graphic,
// source, by ("" for the student, "other"), byName, reasons: [...], other }. A text block: { type: "text", text }.
// The rules are Andrew's, from the planning page, 2026-10-13. An HTML story
// (Andrew, 2026-10-21: "if they submit an html file, we just need headline,
// feature image, and html file, and nothing else") answers to three rules
// and none of the others.

export const MIN_IMAGES = 6, MAX_IMAGES = 8;
export const MIN_WORDS = 150, MAX_WORDS = 300;

// Why a picture made the cut. Andrew's list, 2026-10-13.
export const REASONS = [
  ["problem", "Define the problem or situation"],
  ["cause", "Show the cause"],
  ["rooting", "Show rooting interests"],
  ["next", "Explain what could or should happen next"],
  ["action", "Contains action"],
  ["emotion", "Contains emotion"],
  ["beautiful", "Is beautiful"],
  ["other", "Other"],
];

export const LAYOUTS = [["full", "Full width"], ["left", "Photo left, text right"], ["right", "Text left, photo right"]];
/** Text beside a photo is for portraits only. Square and landscape are full width. */
export const isPortrait = (b) => !!(b && b.w && b.h && b.h > b.w);
export const layoutOf = (b) => (isPortrait(b) && (b.layout === "left" || b.layout === "right") ? b.layout : "full");

const parse = (v, fallback) => { try { const x = JSON.parse(v); return x == null ? fallback : x; } catch { return fallback; } };
const htmlOf = (v) => { const x = parse(v, null); return x && typeof x.path === "string" && x.path ? { path: x.path, name: String(x.name || ""), size: Number(x.size) || 0 } : null; };

/** Answers to a story: { headline, link, feature, blocks: [{ id, ...block }] }. */
export function storyOf(answers) {
  const a = answers || {};
  const order = parse(a.order, []);
  const ids = Array.isArray(order) ? order.filter(id => typeof id === "string" && a["block:" + id]) : [];
  // A block saved without making the order (a closed tab between the two
  // saves) is kept, at the end, rather than lost.
  Object.keys(a).forEach(k => { if (k.startsWith("block:") && !ids.includes(k.slice(6))) ids.push(k.slice(6)); });
  const blocks = ids.map(id => ({ id, ...parse(a["block:" + id], {}) })).filter(b => b.type === "image" || b.type === "text");
  return { headline: a.headline || "", link: a.link || "", feature: a.feature || "", look: a.look === "dark" ? "dark" : "light", blocks, kind: a.kind === "html" ? "html" : "pictures", html: htmlOf(a.html) };
}
export const isHtmlStory = (story) => !!story && story.kind === "html";
/** The feature image block, or the first picture, or null. */
export const featureImage = (story) => { const images = story.blocks.filter(b => b.type === "image"); return images.find(b => b.id === story.feature) || images[0] || null; };

/** The stage a section is really in: a building section whose open time has
 * passed reads as reading, so Monday opens on its own. And a section that is
 * reading or closed reads as released once its release time has passed, so
 * Tuesday opens on its own too. Andrew, 2026-10-23, from out of town: "each
 * student will receive non-anonymized comments ... on Tuesday", and "I want
 * this all to work automatically." */
export const stageAt = (row, now = Date.now(), releasesAt = null) => {
  const stage = row?.stage || "building";
  const open = stage === "building" && row?.opens_at && Date.parse(row.opens_at) <= now ? "reading" : stage;
  return (open === "reading" || open === "closed") && releasesAt && Date.parse(releasesAt) <= now ? "released" : open;
};

/** When each class's comments come out on their own: Tuesday, October 27,
 * 12:05 PM Pacific for COMM 3 (Andrew, 2026-10-26: comments due Tuesday at
 * 11:59 AM, after Monday's technical issue). The practice class has no release time, so
 * Andrew's stage buttons are the only word there. */
export const RELEASES_AT = { comm3: "2026-10-27T19:05:00.000Z" };

/** A window after the release in which comments save again, names still out.
 * Andrew, 2026-10-28: "open up comments again until end of day today. 11:59 pm
 * pacific wednesday." Null or past means only a reading section takes comments. */
export const COMMENTS_UNTIL = { comm3: "2026-10-29T06:59:59.000Z" };
export const commentsOpen = (stage, groupKey, now = Date.now()) =>
  stage === "reading" || (stage === "released" && !!COMMENTS_UNTIL[groupKey] && now < Date.parse(COMMENTS_UNTIL[groupKey]));

// A link in a caption or text block is written [words](https://...).
// Andrew, 2026-10-15: "include links in text." Only the words count.
export const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
/** Text split into plain runs and links: [{ text }, { text, href }]. */
export const linkParts = (s) => {
  const str = String(s || ""), out = [];
  let at = 0;
  for (const m of str.matchAll(LINK)) {
    if (m.index > at) out.push({ text: str.slice(at, m.index) });
    out.push({ text: m[1], href: m[2] });
    at = m.index + m[0].length;
  }
  if (at < str.length) out.push({ text: str.slice(at) });
  return out;
};
export const wordsIn = (s) => (String(s || "").replace(LINK, "$1").trim().match(/[^\s]+/g) || []).length;
/** Words in captions and text blocks. The headline does not count. */
export const wordCount = (story) => story.blocks.reduce((n, b) => n + wordsIn(b.type === "text" ? b.text : b.caption), 0);
export const imageCount = (story) => story.blocks.filter(b => b.type === "image").length;

// Most of the way there: enough to publish to classmates unsubmitted.
// Andrew, 2026-10-26: "if a student didn't complete their story, but has most
// of it done, publish it anyway." A headline, and either the HTML file with
// its feature image, or at least four pictures and 75 words.
export const MOSTLY_IMAGES = 4, MOSTLY_WORDS = 75;
export function mostlyDone(story) {
  if (!story || !story.headline.trim()) return false;
  if (isHtmlStory(story)) return !!story.html && imageCount(story) > 0;
  return imageCount(story) >= MOSTLY_IMAGES && wordCount(story) >= MOSTLY_WORDS;
}

/** What stands between the story and Submit, in sentences a student can act on. */
export function problemsOf(story) {
  const out = [];
  if (!story.headline.trim()) out.push("Write a headline.");
  if (isHtmlStory(story)) {
    if (!imageCount(story)) out.push("Add your feature image.");
    if (!story.html) out.push("Upload your HTML file.");
    return out;
  }
  const n = imageCount(story), w = wordCount(story);
  if (n < MIN_IMAGES) out.push(`Add ${MIN_IMAGES - n} more image${MIN_IMAGES - n === 1 ? "" : "s"}. You have ${n}, and the story needs ${MIN_IMAGES} to ${MAX_IMAGES}.`);
  if (n > MAX_IMAGES) out.push(`Take out ${n - MAX_IMAGES} image${n - MAX_IMAGES === 1 ? "" : "s"}. You have ${n}, and the story takes ${MIN_IMAGES} to ${MAX_IMAGES}.`);
  if (w < MIN_WORDS) out.push(`Add ${MIN_WORDS - w} more word${MIN_WORDS - w === 1 ? "" : "s"} in captions or text. You have ${w}, and the story needs ${MIN_WORDS} to ${MAX_WORDS}.`);
  if (w > MAX_WORDS) out.push(`Cut ${w - MAX_WORDS} word${w - MAX_WORDS === 1 ? "" : "s"}. You have ${w}, and the story takes ${MIN_WORDS} to ${MAX_WORDS}.`);
  const images = story.blocks.filter(b => b.type === "image");
  if (images.length && !images.some(b => b.id === story.feature)) out.push("Choose a feature image.");
  images.forEach((b, i) => {
    const label = "Image " + (i + 1);
    if (!(b.reasons || []).length) out.push(label + ": mark why the image made the cut.");
    else if ((b.reasons || []).includes("other") && !String(b.other || "").trim()) out.push(label + ": you marked Other, so write a few words about why.");
    if (b.graphic && !String(b.source || "").trim()) out.push(label + ": a graphic needs a source line.");
    if (b.by === "other" && !String(b.byName || "").trim()) out.push(label + ": you marked Someone else, so write the name of who " + (b.graphic ? "made the graphic." : "took the photo."));
  });
  if (story.link.trim() && !/^https?:\/\/\S+\.\S+/.test(story.link.trim())) out.push("Your link has to start with http:// or https://.");
  return out;
}
