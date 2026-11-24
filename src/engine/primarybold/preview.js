// Whether this browser is looking at the Primary Bold pages.
//
// Andrew, 2026-11-24: "i want to work on it this week ... build out the
// mockups and let me work on it more to release on nov 30". So the pages are
// in the site and nobody is sent to them. He turns them on for his own
// browser with ?primarybold=1 on any class address and off with ?primarybold=0, or
// with The current site in the face menu. ClassApp asks here only when the
// session is his, so a student who types ?primarybold=1 gets the site as it is.
//
// To release: make `on()` return true for everyone, in this one place.

const KEY = "primary-bold-preview";

export function setPreview(yes) {
  try { if (yes) localStorage.setItem(KEY, "1"); else localStorage.removeItem(KEY); } catch { /* a private window keeps the answer for the visit */ }
}

/** Reads ?primarybold= off the address once, then the saved answer. */
export function previewOn() {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("primarybold");
    if (q === "1") setPreview(true);
    if (q === "0") setPreview(false);
    return localStorage.getItem(KEY) === "1";
  } catch { return false; }
}
