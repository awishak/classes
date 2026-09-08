// A file on a note: a clip, a photo or a voice memo that came up from a phone.
//
// The moment of noticing a story is on the couch with a phone, and the
// distance from that moment to a row in the Flow decides whether the story
// gets taught. So a block can carry one file, and in class the row plays as
// three slides behind one button: the headline, the file, then the question.
//
// This file holds what the rest of the engine needs to know about that:
// what kind of file a MIME type is, the three slides a block turns into, and
// the upload itself. Nothing here renders.

import { savedPin } from "../InstructorGate.jsx";
import { authHeaders } from "./session.js";

export const MEDIA_MAX = 50 * 1024 * 1024;   // the bucket's own cap
export const MEDIA_ACCEPT = "video/*,image/*,audio/*";

// video | image | audio, or "" for anything the wall cannot show.
export function mediaKind(type) {
  const m = /^(video|image|audio)\//.exec(String(type || ""));
  return m ? m[1] : "";
}

export const mediaLabel = (kind) => ({ video: "Clip", image: "Photo", audio: "Voice memo" }[kind] || "File");

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
  const kind = mediaKind(file?.type);
  if (!kind) return Promise.reject(new Error("Only a video, a photo or an audio file can go up."));
  if (file.size > MEDIA_MAX) return Promise.reject(new Error("The file has to be under 50 MB."));

  return authHeaders().then(auth => fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ pin: pin ?? savedPin(), name: file.name, type: file.type, size: file.size, classId }),
  }))
    .then(async r => {
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.ok) throw new Error(out.error || "Could not get an upload link.");
      return out;
    })
    .then(({ uploadUrl, publicUrl, path }) => new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      xhr.onerror = () => reject(new Error("The upload did not go through."));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ kind, src: publicUrl, path, name: file.name, type: file.type, size: file.size, at: new Date().toISOString() });
        } else {
          let why = "";
          try { why = JSON.parse(xhr.responseText).message || ""; } catch { /* not json */ }
          reject(new Error("Supabase refused the file" + (why ? ": " + why : ".")));
        }
      };
      xhr.send(file);
    }));
}
