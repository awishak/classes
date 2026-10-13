// Photos for the visual story: read any phone picture, shrink the picture,
// upload the result into the student's private folder, and sign links to
// show private pictures.
//
// Andrew, 2026-10-13: "It has to be easy to upload photos ... I don't want to
// have any issues with students saying, Oh, I couldn't upload my photos." So:
//   - iPhone HEIC files are converted in the browser (heic-to, loaded only
//     when a HEIC file turns up, because the converter is large).
//   - Every picture is redrawn at most 2000 pixels on the long side as a
//     JPEG, which turns a 12 MB phone photo into a few hundred KB and fixes
//     sideways phone photos, since the browser applies the camera's rotation.
//   - The upload goes straight to Supabase Storage as the student, with
//     progress, into <class>/<email>/<name>.jpg. The bucket's rules
//     (sql/visual-story-portal.sql) refuse any other folder.

import { SUPABASE_URL, SUPABASE_KEY } from "../../storage-shim.js";
import { accessToken } from "../session.js";

export const BUCKET = "visual-story";
export const LONG_SIDE = 2000;

const HEIC = /\.(heic|heif)$/i;
export const isHeic = (file) => /image\/hei[cf]/i.test(file?.type || "") || HEIC.test(file?.name || "");
export const looksLikeImage = (file) => /^image\//i.test(file?.type || "") || isHeic(file) || /\.(jpe?g|png|webp|gif)$/i.test(file?.name || "");

/** The size to draw at: the long side at most `max`, never enlarged. */
export const fitWithin = (w, h, max = LONG_SIDE) => {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
};

async function decode(blob) {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(blob, { imageOrientation: "from-image" }); } catch { /* fall back to an img */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

/** Any picture to a JPEG blob at most LONG_SIDE, with its width and height. Throws a sentence a student can read. */
export async function prepImage(file) {
  let blob = file;
  if (isHeic(file)) {
    try {
      const { heicTo } = await import("heic-to");
      blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
    } catch {
      throw new Error("This iPhone photo could not be converted. Try exporting it as a JPEG, or upload it from your phone.");
    }
  }
  let pic;
  try { pic = await decode(blob); } catch { throw new Error("This file could not be opened as a picture. Try a JPEG or PNG."); }
  const W = pic.width || pic.naturalWidth, H = pic.height || pic.naturalHeight;
  if (!W || !H) throw new Error("This file could not be opened as a picture. Try a JPEG or PNG.");
  const { w, h } = fitWithin(W, H);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);   // a transparent PNG graphic gets white, not black
  g.drawImage(pic, 0, 0, w, h);
  if (pic.close) pic.close();
  const out = await new Promise(res => canvas.toBlob(res, "image/jpeg", 0.86));
  if (!out) throw new Error("This picture could not be prepared for upload. Try a smaller file.");
  return { blob: out, w, h };
}

/** Upload a blob to the student's folder, with progress 0 to 1. Resolves the path. */
export async function uploadImage({ path, blob, onProgress = () => {} }) {
  const token = await accessToken();
  if (!token) throw new Error("You are signed out. Sign in again, then retry.");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/" + path.split("/").map(encodeURIComponent).join("/"));
    xhr.setRequestHeader("apikey", SUPABASE_KEY);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("Content-Type", "image/jpeg");
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve(path) : reject(new Error("The upload was refused (" + xhr.status + "). Retry, and if it keeps failing, press Report a problem.")));
    xhr.onerror = () => reject(new Error("The upload did not finish. Check your connection, then retry."));
    xhr.ontimeout = xhr.onerror;
    xhr.timeout = 120000;
    xhr.send(blob);
  });
}

/** Signed links for private pictures, an hour long: { [path]: url }. */
export async function signUrls(paths) {
  const list = [...new Set((paths || []).filter(Boolean))];
  if (!list.length) return {};
  const token = await accessToken();
  const r = await fetch(SUPABASE_URL + "/storage/v1/object/sign/" + BUCKET, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + (token || SUPABASE_KEY), "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600, paths: list }),
  });
  if (!r.ok) throw new Error("Your pictures could not be loaded. Reload the page.");
  const rows = await r.json();
  const out = {};
  (rows || []).forEach(x => { if (x && x.signedURL && !x.error) out[x.path] = SUPABASE_URL + "/storage/v1" + x.signedURL; });
  return out;
}

/** A short random name in letters, for files and block ids (the field check allows letters only). */
export const letterId = (n = 8) => Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
