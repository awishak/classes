// A file on a note: a clip, a photo, a voice memo, or a document dropped on
// the day.
//
// The moment of noticing a story is on the couch with a phone, and the
// distance from that moment to a row in the Flow decides whether the story
// gets taught. So a block can carry one file, and in class the row plays as
// three slides behind one button: the headline, the file, then the question.
// The same path takes a PDF, a slide deck or a Word file dragged onto the
// dashboard from the desktop, so a handout is a row like anything else.
//
// This file holds what the rest of the engine needs to know about that:
// what kind of file a MIME type is, the three slides a block turns into, and
// the upload itself. Nothing here renders.

import { savedPin } from "../InstructorGate.jsx";
import { authHeaders } from "./session.js";

export const MEDIA_MAX = 50 * 1024 * 1024;   // the bucket's own cap

// What a file's extension says it is, for the browsers that hand over no MIME
// type (a Keynote file, a Markdown file) and for the server, which trusts the
// name as much as the type, since the browser fills in both.
export const EXT_TYPES = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  key: "application/x-iwork-keynote-sffkey",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pages: "application/x-iwork-pages-sffpages",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  numbers: "application/x-iwork-numbers-sffnumbers",
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  rtf: "application/rtf",
  zip: "application/zip",
};

export const MEDIA_ACCEPT = "video/*,image/*,audio/*," + Object.keys(EXT_TYPES).map(x => "." + x).join(",");

export const extOf = (name) => {
  const m = /\.([a-z0-9]+)$/i.exec(String(name || ""));
  return m ? m[1].toLowerCase() : "";
};

// The MIME type to send: the browser's, or the one the extension implies.
export const fileType = (file) => file?.type || EXT_TYPES[extOf(file?.name)] || "";

// video | image | audio | pdf | deck | doc | sheet | file, or "" for a file
// that cannot go up at all. The first three play on the wall; pdf, deck, doc
// and sheet show inside a viewer; a plain file gets a title card and a link.
export function mediaKind(type, name) {
  const t = String(type || EXT_TYPES[extOf(name)] || "");
  const m = /^(video|image|audio)\//.exec(t);
  if (m) return m[1];
  const ext = extOf(name);
  if (t === "application/pdf" || ext === "pdf") return "pdf";
  if (/presentation|powerpoint|keynote/.test(t) || /^(pptx?|key)$/.test(ext)) return "deck";
  if (/wordprocessing|msword|iwork-pages|rtf/.test(t) || /^(docx?|pages|rtf)$/.test(ext)) return "doc";
  if (/spreadsheet|ms-excel|iwork-numbers|text\/csv/.test(t) || /^(xlsx?|numbers|csv)$/.test(ext)) return "sheet";
  if (t || ext in EXT_TYPES) return "file";
  return "";
}

export const mediaLabel = (kind) => ({
  video: "Clip", image: "Photo", audio: "Voice memo",
  pdf: "PDF", deck: "Slides", doc: "Document", sheet: "Spreadsheet",
}[kind] || "File");

// Where the wall shows a document. A PDF the browser draws itself; an Office
// file goes through Microsoft's viewer, which reads the public link. Keynote,
// Pages and Numbers have no viewer, so they open in their own window instead,
// and so does anything else.
export function viewUrl(media) {
  if (!media?.src) return "";
  if (media.kind === "pdf") return media.src;
  const ext = extOf(media.name || media.path);
  if (/^(pptx?|docx?|xlsx?)$/.test(ext)) return "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(media.src);
  return "";
}

// The slides a block with a file plays as, in order. Every slide carries the
// same `label`, which is how the Flow knows the row is live, and a `step` so
// the row knows which slide is up. The question is a slide only if one was
// written.
export function mediaSteps(block, headline, tag) {
  if (!block?.media?.src) return null;
  const label = headline || block.headline || block.title || mediaLabel(block.media.kind);
  const steps = [
    { name: "Headline", payload: { type: "quote", tag: tag || "", title: label, label, step: 0 } },
    { name: mediaLabel(block.media.kind), payload: {
      type: "media", media: block.media.kind, src: block.media.src, poster: block.media.poster || "",
      view: viewUrl(block.media), name: block.media.name || "",
      title: label, label, step: 1 } },
  ];
  if ((block.ask || "").trim()) {
    steps.push({ name: "Question", payload: { type: "question", tag: "Question", title: block.ask.trim(), label, step: 2 } });
  }
  return steps;
}

// Which slide of a row is on the wall right now, or -1 if the row is not up.
export function liveStep(liveCast, label) {
  if (!liveCast || !label || liveCast.label !== label) return -1;
  return Number.isInteger(liveCast.step) ? liveCast.step : 0;
}

// Roughly how big, for a line under the file name.
export function sizeLabel(bytes) {
  const n = Number(bytes || 0);
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(n >= 10 * 1024 * 1024 ? 0 : 1) + " MB";
  if (n >= 1024) return Math.round(n / 1024) + " KB";
  return n + " bytes";
}

// Sends a file up and resolves to what the block stores about the file.
//
// Two trips: ask our own API for a signed link (that is where the PIN is
// checked and the service key lives), then PUT the file straight to Supabase
// on that link. Progress comes from the second trip, which is the one that
// takes any time.
export function uploadMedia(file, { classId, pin, onProgress } = {}) {
  const type = fileType(file);
  const kind = mediaKind(type, file?.name);
  if (!kind) return Promise.reject(new Error("That kind of file cannot go up."));
  if (file.size > MEDIA_MAX) return Promise.reject(new Error("The file has to be under 50 MB."));

  return authHeaders().then(auth => fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ pin: pin ?? savedPin(), name: file.name, type, size: file.size, classId }),
  }))
    .then(async r => {
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error || "Could not get an upload link.");
      return out;
    })
    .then(({ uploadUrl, publicUrl, path }) => new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", type || "application/octet-stream");
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      xhr.onerror = () => reject(new Error("The upload did not go through."));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ kind, src: publicUrl, path, name: file.name, type, size: file.size, at: new Date().toISOString() });
        } else {
          let why = "";
          try { why = JSON.parse(xhr.responseText).message || ""; } catch { /* not json */ }
          reject(new Error("Supabase refused the file" + (why ? ": " + why : ".")));
        }
      };
      xhr.send(file);
    }));
}
