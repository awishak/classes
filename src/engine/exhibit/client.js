// The browser's side of /api/exhibit: every read and write of a project, and
// the two-step upload for a picture, a clip or an HTML file.

import { authHeaders } from "../session.js";
import { prepImage, looksLikeImage, looksLikeHtml } from "../visualstory/photos.js";

const qs = (o) => Object.entries(o).filter(([, v]) => v != null && v !== "").map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");

async function call(method, query, body) {
  const auth = await authHeaders();
  let r;
  try { r = await fetch("/api/exhibit?" + qs(query), { method, headers: { "Content-Type": "application/json", ...auth }, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error("No connection. Your work is still on this screen."); }
  const out = await r.json().catch(() => ({}));
  if (!r.ok || !out.ok) { const e = new Error(out.error || "The server did not answer."); e.status = r.status; e.locked = !!out.locked; throw e; }
  return out;
}

export const loadMine = (classId, as) => call("GET", { class: classId, mine: 1, as });
export const loadOne = (classId, id, preview) => call("GET", { class: classId, id, preview });
export const loadNotes = (classId, id) => call("GET", { class: classId, id, notes: 1 });
export const loadGallery = (classId, all) => call("GET", { class: classId, gallery: 1, all: all ? 1 : "" });
export const saveDoc = (classId, doc, as) => call("POST", { class: classId }, { op: "save", doc, as });
export const sendNote = (classId, note) => call("POST", { class: classId }, { op: "note", ...note });
export const dropNote = (classId, note, as) => call("POST", { class: classId }, { op: "noteGone", note, as });
export const setState = (classId, change) => call("POST", { class: classId }, { op: "state", ...change });

const AUDIO = /\.(m4a|mp3|wav|aac)$/i;
/** What kind of file this is for the builder: image, audio, html, or "". */
export const kindOf = (file) => (looksLikeImage(file) ? "image" : /^audio\//i.test(file?.type || "") || AUDIO.test(file?.name || "") ? "audio" : looksLikeHtml(file) ? "html" : "");

/**
 * Send a file up and resolve to its public address. A photo is shrunk first
 * ("The site shrinks it on upload"); an HTML file goes up as plain text,
 * which is how the store hands the file back, and the reader runs the text
 * inside a sandboxed frame.
 */
export async function upload(classId, file, { as, onProgress = () => {} } = {}) {
  const kind = kindOf(file);
  if (!kind) throw new Error("An image, an audio file (m4a, mp3, wav or aac) or an HTML file can go up.");
  let blob = file, type = file.type, name = file.name;
  if (kind === "image" && !/svg/i.test(file.type)) { const p = await prepImage(file); blob = p.blob; type = "image/jpeg"; name = name.replace(/\.[a-z0-9]+$/i, "") + ".jpg"; }
  if (kind === "audio" && !type) type = "audio/mp4";
  if (kind === "html") type = "text/plain";
  const sent = kind === "html" ? "text/html" : type;
  const out = await call("POST", { class: classId }, { op: "upload", name, type: sent, size: blob.size, as });
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", out.uploadUrl);
    xhr.setRequestHeader("Content-Type", type || "application/octet-stream");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onerror = () => reject(new Error("The upload did not go through. Try again."));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("The store refused the file.")));
    xhr.send(blob);
  });
  return { url: out.publicUrl, name: file.name, kind };
}
