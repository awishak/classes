// The faces the screen can wear, and which parts wear them.
//
// Andrew: "give me a font chooser. i hate the font for materials and flow and
// live." So three things are choosable — the column headings, the section
// names, and the row text — and each keeps its own choice.
//
// Everything here either ships with the machine or is already on the Google
// Fonts request the page has always made, so choosing one costs no new
// service and no extra round trip.

export const FACES = [
  { id: "outfit", name: "Outfit", stack: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif" },
  { id: "grotesk", name: "Space Grotesk", stack: "'Space Grotesk', 'Outfit', sans-serif" },
  { id: "plex", name: "IBM Plex Sans", stack: "'IBM Plex Sans', 'Outfit', sans-serif" },
  { id: "system", name: "System", stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { id: "fraunces", name: "Fraunces", stack: "'Fraunces', Georgia, serif" },
  { id: "newsreader", name: "Newsreader", stack: "'Newsreader', Georgia, serif" },
  { id: "georgia", name: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  { id: "mono", name: "IBM Plex Mono", stack: "'IBM Plex Mono', ui-monospace, monospace" },
];

export const face = (id) => FACES.find(f => f.id === id) || null;

// What can be set, and what each one falls back to.
export const SLOTS = [
  { id: "cols", label: "Column headings", fallback: "mono", css: "--font-col" },
  { id: "sections", label: "Section names", fallback: "outfit", css: "--font-sec" },
  { id: "rows", label: "Rows", fallback: "outfit", css: "--font-row" },
];

export const DEFAULT_FONTS = Object.fromEntries(SLOTS.map(s => [s.id, s.fallback]));

export const readFonts = (shared) => ({ ...DEFAULT_FONTS, ...(shared?.fonts || {}) });

export const stackFor = (fonts, slot) =>
  face((fonts || DEFAULT_FONTS)[slot] || DEFAULT_FONTS[slot])?.stack
  || face(DEFAULT_FONTS[slot]).stack;

// The variables the stylesheet reads, ready to drop on the wrapper.
export const fontVars = (fonts) =>
  Object.fromEntries(SLOTS.map(s => [s.css, stackFor(fonts, s.id)]));

export const writeFont = (updateShared, slot, faceId) => updateShared(prev => ({
  ...prev,
  fonts: { ...(prev.fonts || {}), [slot]: faceId },
}));

export const resetFonts = (updateShared) => updateShared(prev => ({ ...prev, fonts: {} }));

// Row text can be heavier without changing the face.
export const readBold = (shared) => !!shared?.boldRows;
export const writeBold = (updateShared, on) => updateShared(prev => ({ ...prev, boldRows: !!on }));
