// The tab's icon, per class.
//
// Andrew, 2026-09-20: "let's change the favicon for this class." There was
// nothing to change: the page shipped no icon at all, so every tab showed the
// browser's blank sheet, and with a dashboard, a room screen and a class page
// open at once nothing in the tab strip said which was which.
//
// So the icon is the thing the bar already draws: the class's own colour with
// its number on it. Nothing to upload, nothing to keep in sync, and a new
// class has one the moment it has a colour.
//
// It is drawn as an SVG data URI rather than a file, because a file would be
// one icon for five classes.

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s) => String(s || "").replace(/[&<>"]/g, c => ESC[c]);

// The number a class goes by: COMM 118 is 118. A class whose code is one word
// uses the first two letters, so nothing comes out blank.
export const iconWord = (config) => {
  const code = String(config?.code || "").trim();
  const bits = code.split(/\s+/);
  const word = bits.length > 1 ? bits[bits.length - 1] : code.slice(0, 2);
  return word.slice(0, 3).toUpperCase();
};

export function classIcon(config) {
  const word = iconWord(config);
  const accent = config?.accent || "#1c1917";
  // Three characters need to be smaller than one, or they run off the tile.
  const size = word.length >= 3 ? 30 : word.length === 2 ? 38 : 46;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    + '<rect width="64" height="64" rx="14" fill="' + esc(accent) + '"/>'
    + '<text x="32" y="32" fill="#ffffff" font-family="Outfit, Helvetica, Arial, sans-serif" font-weight="700"'
    + ' font-size="' + size + '" text-anchor="middle" dominant-baseline="central">' + esc(word) + "</text></svg>";
}

export const iconUrl = (svg) => "data:image/svg+xml," + encodeURIComponent(svg);

// One link tag, made if the page has none, pointed wherever it is told.
export function setFavicon(svg) {
  try {
    const head = document.head;
    if (!head) return;
    let link = head.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      head.appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = iconUrl(svg);
  } catch { /* server render, or a browser with no head to speak of */ }
}

export const setClassFavicon = (config) => setFavicon(classIcon(config));
