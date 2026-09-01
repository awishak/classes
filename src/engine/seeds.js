// The seed library, read out of the markdown it is written in.
//
// teaching/seeds.md is where the best material actually lives: small stories,
// examples and hooks, each one tagged with the concept it teaches and the slot
// in a day it fits. A page calling itself a repository of everything could not
// see the file, because only the seeds already typed into comm999.js ever
// became blocks.
//
// So the markdown gets parsed here and the seeds arrive as blocks. The file
// stays the place I write, because writing a seed in a form is worse than
// writing a seed in a paragraph, and the shelf stays the place I search.
//
// Nothing here reaches for a store or a clock, which is what lets the same
// parser run in the page and in a script that regenerates the config.

// A code fence holds the template for adding a seed, and the template has a
// heading that looks exactly like a seed heading. So the fences come out
// first, and only then does the file get split on its headings.
const unfence = (md) => (md || "").replace(/```[\s\S]*?```/g, "");

// Markdown that is decoration rather than words: emphasis marks, and a link
// where only the words matter.
const plain = (s) => (s || "")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/_([^_\n]+)_/g, "$1")
  .trim();

export const slug = (s) => (s || "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

// A seed's id is made from the title rather than at random, so bringing the
// library in twice brings each seed in once.
export const seedId = (title) => "seed-" + slug(title);

const listed = (v) => plain(v).split(/\s*[/,]\s*/).map(x => x.trim()).filter(Boolean);

// Every seed under the Seeds heading, in the order they are written.
export function parseSeeds(md) {
  const body = unfence(md);
  const at = body.indexOf("\n## Seeds");
  const text = at < 0 ? body : body.slice(at + 9);
  const out = [];

  text.split(/\n###\s+/).slice(1).forEach(chunk => {
    const lines = chunk.split("\n");
    const title = plain(lines.shift());
    if (!title) return;
    const fields = {};
    const words = [];
    lines.forEach(line => {
      const f = line.match(/^\s*[-*]\s*\*\*([A-Za-z ]+):\*\*\s*(.*)$/);
      if (f) { fields[f[1].trim().toLowerCase()] = f[2].trim(); return; }
      if (/^\s*(---|##\s)/.test(line)) return;
      words.push(line);
    });
    const seed = {
      id: seedId(title),
      title,
      concept: plain(fields.concept || ""),
      slots: listed(fields.slot || ""),
      classes: listed(fields.class || ""),
      source: plain(fields.source || "").replace(/^origin TBD$/i, ""),
      body: plain(words.join("\n").replace(/\n{3,}/g, "\n\n")),
    };
    if (seed.title && seed.body) out.push(seed);
  });

  return out;
}

// What a seed looks like as a block. A story, because that is what a seed is,
// with the concept and the slots carried across as tags so the facets that
// already exist can find it. The concept is kept on the concept field as well,
// where the rest of the engine looks for it.
export function seedPatch(seed) {
  const tags = ["seed"];
  const add = (t) => { const x = (t || "").trim(); if (x && !tags.includes(x)) tags.push(x); };
  (seed.concept || "").split(/\s*\/\s*/).forEach(add);
  (seed.slots || []).forEach(add);
  return {
    id: seed.id,
    type: "story",
    title: seed.title,
    body: seed.body,
    concept: (seed.concept || "").split(/\s*\/\s*/)[0] || "",
    source: seed.source || "",
    tags,
  };
}

// Which seeds are not on the shelf yet. Matched on the id first, and on the
// words of the title after that, because a seed added by hand before the
// library existed carries an id of its own and is still the same seed.
export function newSeeds(seeds, blocks) {
  const ids = new Set((blocks || []).map(b => b.id));
  const titles = new Set((blocks || []).map(b => (b.title || "").trim().toLowerCase()).filter(Boolean));
  return (seeds || []).filter(s => !ids.has(s.id) && !titles.has(s.title.trim().toLowerCase()));
}
