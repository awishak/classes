// The colour of everything, and Andrew's to set.
//
// One palette, twenty swatches, the rainbow with two or three shades of each.
// Every swatch carries white text, which is the constraint that shaped the
// whole set: white on a genuinely light yellow is unreadable, so the lightest
// tier of each hue is as light as white text allows and no lighter. That is
// why the yellows come out closer to mustard than to lemon. See the note in
// scripts/check-contrast.mjs, which fails the build if a swatch drifts under
// the line.
//
// Kinds, not components. A kind is a sort of thing I deal with — readings,
// ideas, notes — and both the rail tab and every chip for that sort of thing
// read the same colour, so a reading is the same blue wherever it turns up.
//
// The choices live in the shared store rather than in a class, because how I
// colour my own material is a fact about me and not about COMM 118.

export const PALETTE = [
  { id: "red-light",    name: "Red",          hex: "#d4312b" },
  { id: "red-mid",      name: "Red mid",      hex: "#a92723" },
  { id: "red-deep",     name: "Red deep",     hex: "#7f1d1a" },
  { id: "orange-light", name: "Orange",       hex: "#ad5a1a" },
  { id: "orange-mid",   name: "Orange mid",   hex: "#8a4715" },
  { id: "orange-deep",  name: "Orange deep",  hex: "#6a3710" },
  { id: "yellow-light", name: "Yellow",       hex: "#8a6d0f" },
  { id: "yellow-deep",  name: "Yellow deep",  hex: "#735b0d" },
  { id: "green-light",  name: "Green",        hex: "#1d7c45" },
  { id: "green-mid",    name: "Green mid",    hex: "#176337" },
  { id: "teal-light",   name: "Teal",         hex: "#1a7f7f" },
  { id: "teal-deep",    name: "Teal deep",    hex: "#146161" },
  { id: "blue-light",   name: "Blue",         hex: "#276fce" },
  { id: "blue-mid",     name: "Blue mid",     hex: "#205aa7" },
  { id: "blue-deep",    name: "Blue deep",    hex: "#184681" },
  { id: "purple-light", name: "Purple",       hex: "#8a4ed0" },
  { id: "purple-mid",   name: "Purple mid",   hex: "#6e30b5" },
  { id: "purple-deep",  name: "Purple deep",  hex: "#532489" },
  { id: "pink-light",   name: "Pink",         hex: "#d12e7a" },
  { id: "pink-deep",    name: "Pink deep",    hex: "#a72562" },
];

export const swatch = (id) => PALETTE.find(s => s.id === id) || null;

// The same colour, as ink rather than as a fill.
//
// A row in the day plan is a solid block of its kind's colour carrying white
// text. The library panels read as the same family inverted: a grey card with
// the words in that kind's colour. Which is the opposite job from the one every
// swatch above was generated for, and the comment on PALETTE says so: the light
// tier is only as light as it is because each swatch has to hold white.
//
// Two constraints pull against each other. The ink has to read, and the card it
// sits on has to look like a card. The first attempt at that second constraint
// went far too deep: #d9d2c8 is beige, stands 1.50:1 off the panel, and forces
// the ink down to 72% of each swatch, which left Ideas green and Readings blue
// muddy in the rail and bright in the day plan for the same kind.
//
// Measuring the whole ramp showed the tradeoff is lopsided. Between the lightest
// card that still has an edge and the deepest one worth using, the ink moves
// seven points and the edge moves from invisible to plain. So the card is picked
// on its edge and the ink follows: #f1f2f5 at 1.12:1, ink at 96%, worst swatch
// teal at 4.57.
//
// Derived rather than hand-picked, so a swatch added later gets its ink for
// free, and check-contrast measures every one of them so the derivation cannot
// quietly stop working.
export const inkOf = (hex) => {
  const h = String(hex || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) return h;
  return "#" + [1, 3, 5]
    .map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.96).toString(16).padStart(2, "0"))
    .join("");
};

// Everything that carries a colour, in the order the picker lists them.
// `types` is which block types answer to this kind, so a chip on a block and
// the rail tab above it never disagree.
export const KINDS = [
  { id: "readings",    label: "Readings",   fallback: "blue-light",   types: ["link"] },
  { id: "ideas",       label: "Ideas",      fallback: "green-light",  types: ["activity"] },
  { id: "notes",       label: "Notes",      fallback: "yellow-light", types: ["note"] },
  { id: "assignments", label: "Assignments", fallback: "red-light",   types: ["assignment"] },
  { id: "questions",   label: "Questions",  fallback: "orange-light", types: ["question"] },
  { id: "polls",       label: "Poll",       fallback: "orange-mid",   types: [] },
  { id: "boards",      label: "Enter/Exit", fallback: "purple-light", types: ["board"] },
  { id: "stories",     label: "Stories",    fallback: "pink-light",   types: ["story"] },
  { id: "sets",        label: "Sets",       fallback: "teal-light",   types: ["set"] },
];

export const DEFAULTS = Object.fromEntries(KINDS.map(k => [k.id, k.fallback]));

// A block type answers to whichever kind claims it.
const KIND_OF_TYPE = {};
KINDS.forEach(k => k.types.forEach(t => { KIND_OF_TYPE[t] = k.id; }));
export const kindOfType = (type) => KIND_OF_TYPE[type] || "notes";

export const readColors = (shared) => ({ ...DEFAULTS, ...(shared?.colors || {}) });

// The hex for a kind, and the hex for a block type, which is the same lookup
// one step further back.
export const colorOfKind = (colors, kind) =>
  swatch((colors || DEFAULTS)[kind] || DEFAULTS[kind])?.hex || "#5b6068";

// A block type can carry a colour of its own, which is what a kind Andrew
// added needs: the nine above are the ones the code ships with, and a kind he
// invented answers to none of them. A colour set on the type wins, so he can
// also pull one built-in kind out of the group it shares a colour with.
export const colorOfType = (colors, type) => {
  const own = ((colors || {}).types || {})[type];
  return (own && swatch(own)?.hex) || colorOfKind(colors, kindOfType(type));
};

export const writeTypeColor = (updateShared, type, swatchId) => updateShared(prev => {
  const types = { ...((prev.colors || {}).types || {}) };
  if (swatchId) types[type] = swatchId; else delete types[type];
  return { ...prev, colors: { ...(prev.colors || {}), types } };
});

// A section's colour, if I picked one.
//
// Kept by the section's NAME rather than by the day, so "The hook" is the same
// colour every week I use it, which is the whole reason the generated ones
// were hashed off the name in the first place. No pick means the hash still
// decides, so nothing has to be chosen for the flow to read.
export const sectionColor = (shared, name, fallback) => {
  const id = (shared?.colors?.sections || {})[(name || "").trim().toLowerCase()];
  return (id && swatch(id)?.hex) || fallback;
};

export const writeSectionColor = (updateShared, name, swatchId) => updateShared(prev => {
  const key = (name || "").trim().toLowerCase();
  const sections = { ...((prev.colors || {}).sections || {}) };
  if (swatchId) sections[key] = swatchId; else delete sections[key];
  return { ...prev, colors: { ...(prev.colors || {}), sections } };
});

export const writeColor = (updateShared, kind, swatchId) => updateShared(prev => ({
  ...prev,
  colors: { ...(prev.colors || {}), [kind]: swatchId },
}));

export const resetColors = (updateShared) => updateShared(prev => ({ ...prev, colors: {} }));

// The ground a library row sits on, and the ground it lifts to under the cursor.
//
// Light enough that the kind colours survive nearly whole, and no lighter than
// the point where the card stops having an edge against the white panel behind
// it. Paired with inkOf: move one and the other has to move, which is why they
// live together and why check-contrast measures every swatch against both.
//
// The hover goes lighter rather than deeper, with the ring in the ink colour
// carrying the state. Deeper was the obvious move and it fails: at 96% ink even
// one step down puts teal at 4.17, under the line.
export const LIBRARY_CARD = "#f1f2f5";
export const LIBRARY_CARD_HOVER = "#f8f9fb";
