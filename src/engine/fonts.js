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

// ─── the repository's own type ───
//
// Andrew asked for a font chooser on the repository, and for the choice to be
// the repository's rather than the dashboard's. The two screens are doing
// different jobs: the three slots above dress a class while it is being
// taught, and the repository is a filing cabinet with four hundred rows in it,
// where what I want is a face I can read down a column. Same eight faces, a
// separate choice, kept in the shared store beside the other choice so the
// choice follows me and not a class.
export const REPO_SLOTS = [
  { id: "cols", label: "Column headings", fallback: "mono", css: "--repo-col" },
  { id: "rows", label: "The words in a row", fallback: "outfit", css: "--repo-row" },
  { id: "page", label: "Everything else", fallback: "outfit", css: "--repo-ui" },
];

export const DEFAULT_REPO_FONTS = Object.fromEntries(REPO_SLOTS.map(s => [s.id, s.fallback]));

export const readRepoFonts = (shared) => ({ ...DEFAULT_REPO_FONTS, ...(shared?.repoFonts || {}) });

export const repoFontVars = (fonts) => Object.fromEntries(REPO_SLOTS.map(s => {
  const id = (fonts || DEFAULT_REPO_FONTS)[s.id] || DEFAULT_REPO_FONTS[s.id];
  return [s.css, face(id)?.stack || face(DEFAULT_REPO_FONTS[s.id]).stack];
}));

export const writeRepoFont = (updateShared, slot, faceId) => updateShared(prev => ({
  ...prev,
  repoFonts: { ...(prev.repoFonts || {}), [slot]: faceId },
}));

export const resetRepoFonts = (updateShared) => updateShared(prev => ({ ...prev, repoFonts: {} }));

export const readRepoBold = (shared) => !!shared?.repoBoldRows;
export const writeRepoBold = (updateShared, on) => updateShared(prev => ({ ...prev, repoBoldRows: !!on }));
