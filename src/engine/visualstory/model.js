// The visual story as data, and the rules Submit checks. Plain JS, so the
// smoke run checks the rules without a browser.
//
// A story is worksheet answers, one field each, so a save touches one block
// and never the whole story:
//   headline       the headline
//   link           an optional link to an interactive version
//   order          JSON list of block ids, top to bottom
//   feature        the block id of the feature image
//   block:<id>     JSON for one block (ids are letters, the field rule)
// An image block: { type: "image", path, w, h, layout, caption, graphic,
// source, reasons: [...], other }. A text block: { type: "text", text }.
// The rules are Andrew's, from the planning page, 2026-10-13.

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

/** Answers to a story: { headline, link, feature, blocks: [{ id, ...block }] }. */
export function storyOf(answers) {
  const a = answers || {};
  const order = parse(a.order, []);
  const ids = Array.isArray(order) ? order.filter(id => typeof id === "string" && a["block:" + id]) : [];
  // A block saved without making the order (a closed tab between the two
  // saves) is kept, at the end, rather than lost.
  Object.keys(a).forEach(k => { if (k.startsWith("block:") && !ids.includes(k.slice(6))) ids.push(k.slice(6)); });
  const blocks = ids.map(id => ({ id, ...parse(a["block:" + id], {}) })).filter(b => b.type === "image" || b.type === "text");
  return { headline: a.headline || "", link: a.link || "", feature: a.feature || "", blocks };
}

export const wordsIn = (s) => (String(s || "").trim().match(/[^\s]+/g) || []).length;
/** Words in captions and text blocks. The headline does not count. */
export const wordCount = (story) => story.blocks.reduce((n, b) => n + wordsIn(b.type === "text" ? b.text : b.caption), 0);
export const imageCount = (story) => story.blocks.filter(b => b.type === "image").length;

/** What stands between the story and Submit, in sentences a student can act on. */
export function problemsOf(story) {
  const out = [];
  const n = imageCount(story), w = wordCount(story);
  if (!story.headline.trim()) out.push("Write a headline.");
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
  });
  if (story.link.trim() && !/^https?:\/\/\S+\.\S+/.test(story.link.trim())) out.push("Your link has to start with http:// or https://.");
  return out;
}
