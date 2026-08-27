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
export const colorOfType = (colors, type) => colorOfKind(colors, kindOfType(type));

export const writeColor = (updateShared, kind, swatchId) => updateShared(prev => ({
  ...prev,
  colors: { ...(prev.colors || {}), [kind]: swatchId },
}));

export const resetColors = (updateShared) => updateShared(prev => ({ ...prev, colors: {} }));
