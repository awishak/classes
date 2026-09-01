// The filters, as an address and as something I can keep.
//
// Two ideas from the backlog, and one shape underneath both. A filter set is
// a question I am asking the shelf: untagged readings for COMM 118, or
// everything in the shared store tagged betting. The page held those questions
// in React state, which means the question dies with the tab: no link to send
// myself, no Back to undo the last chip, and no way to ask the same question
// next week without rebuilding the question chip by chip.
//
// So a filter set goes in the URL, and a filter set can be named and pinned.
// The URL is the transport and the saved view is the memory, and both of them
// read and write the same seven fields.
//
// The names in the address are the names I would type by hand: q, kind, class,
// tag, flag, lens, sort, dir. `class` rather than `where`, because the chip row says
// Class and an address nobody can guess is an address nobody writes.

// Everything a question about the shelf is made of, and what each field is
// when nobody has answered it.
export const BLANK = { q: "", kind: "", where: "", tag: "", flag: "", pick: "", lens: "", col: "used", dir: "desc" };

const FIELDS = Object.keys(BLANK);

export const readFilters = (search) => {
  const p = new URLSearchParams(search || "");
  const dir = p.get("dir");
  return {
    q: p.get("q") || "",
    kind: p.get("kind") || "",
    where: p.get("class") || "",
    tag: p.get("tag") || "",
    flag: p.get("flag") || "",
    pick: p.get("pick") ? "yes" : "",
    lens: p.get("lens") || "",
    col: p.get("sort") || BLANK.col,
    dir: dir === "asc" || dir === "desc" ? dir : BLANK.dir,
  };
};

// The query string for a filter set, with anything left at its default left
// out, so a plain shelf is /repo and not /repo?q=&kind=&class=.
export const filterQuery = (f) => {
  const p = new URLSearchParams();
  const put = (key, value, fallback) => { if (value && value !== fallback) p.set(key, value); };
  put("q", (f.q || "").trim(), "");
  put("kind", f.kind, "");
  put("class", f.where, "");
  put("tag", f.tag, "");
  put("flag", f.flag, "");
  put("pick", f.pick, "");
  put("lens", f.lens, "");
  put("sort", f.col, BLANK.col);
  put("dir", f.dir, BLANK.dir);
  const s = p.toString();
  return s ? "?" + s : "";
};

export const sameFilters = (a, b) => FIELDS.every(k => (a?.[k] || BLANK[k]) === (b?.[k] || BLANK[k]));

export const isBlank = (f) => sameFilters(f, BLANK);

// A change of sort or a letter typed into the search box is not a step worth
// putting in the history, and a chip is. Back should undo the chip I just
// pressed rather than the last keystroke of a word I typed.
export const isStep = (a, b) =>
  ["kind", "where", "tag", "flag", "pick", "lens"].some(k => (a?.[k] || "") !== (b?.[k] || ""));

// What a filter set is asking, in words, for the name of a saved view and for
// the label on the chip. Reads left to right the way the filter bar does.
export function viewWords(f, { classes, label, sharedLabel } = {}) {
  const bits = [];
  if (f.kind && label) bits.push(label(f.kind));
  if (f.where === "shared") bits.push(sharedLabel || "Shared");
  else if (f.where) bits.push(((classes || []).find(c => c.id === f.where) || {}).code || f.where);
  if (f.tag) bits.push("tagged " + f.tag);
  if (f.flag) bits.push(FLAG_WORDS[f.flag] || f.flag);
  if (f.pick) bits.push("picked out");
  if ((f.q || "").trim()) bits.push("“" + f.q.trim() + "”");
  if (f.lens) bits.push(LENS_WORDS[f.lens] || f.lens);
  return bits.length ? bits.join(" · ") : "The whole shelf";
}

// The health numbers, as the words a saved view is named with.
const FLAG_WORDS = {
  untagged: "untagged", nohead: "with no headline", nolink: "with no link",
  never: "never used", broken: "with a broken link",
};

const LENS_WORDS = {
  dupes: "duplicates", loose: "loose ends", tags: "tags", types: "the types",
  links: "links", seeds: "the seed library", room: "what the room made",
};

// ─── the views themselves ───
// Kept in the shared store beside the fonts and the colours, because a view is
// mine rather than a class's, and I want the same views on any machine I open
// the repository on.
export const readViews = (shared) => (shared?.repoViews || []).filter(v => v && v.id && v.filters);

export const saveView = (updateShared, view) => updateShared(prev => ({
  ...prev,
  repoViews: [...(prev.repoViews || []).filter(v => v.id !== view.id), view],
}));

export const dropView = (updateShared, id) => updateShared(prev => ({
  ...prev,
  repoViews: (prev.repoViews || []).filter(v => v.id !== id),
}));

// A view already holding this exact question, so pinning the same question
// twice pins nothing the second time.
export const viewFor = (views, f) => (views || []).find(v => sameFilters(v.filters, f)) || null;
