// The 60-second audio story on the audio exercise sheet.
//
// Andrew, 2026-10-29: "let's also have students submit a 60 second audio
// story to go with their idea," refused over 60 seconds, "and has to be in
// certain formats," no recording in the browser. So: a file off the phone,
// m4a, mp3, wav or aac; the browser reads its length first and refuses a
// longer one before anything goes up; then the file goes straight into the
// visual-story bucket in the student's own folder (sql/audio-exercise-bucket
// .sql lets audio into the bucket), the way the photos went up. What the
// sheet keeps is one field, `audio`, holding JSON { path, seconds, name }.

import { uploadImage, signUrls, letterId } from "../visualstory/photos.js";

export const MAX_SECONDS = 60;
export const MAX_BYTES = 30 * 1024 * 1024;   // the bucket's cap
// The formats he takes. A browser names a voice memo audio/x-m4a or
// audio/mp4, and an mp3 audio/mpeg; the extension is checked too because a
// browser hands over no type for some files.
export const FORMATS = [
  { ext: "m4a", types: ["audio/x-m4a", "audio/mp4", "audio/m4a", "audio/aac"] },
  { ext: "mp3", types: ["audio/mpeg", "audio/mp3"] },
  { ext: "wav", types: ["audio/wav", "audio/x-wav", "audio/wave"] },
  { ext: "aac", types: ["audio/aac", "audio/x-aac"] },
];
export const FORMAT_SAY = "m4a, mp3, wav or aac";
export const MIME_TYPES = [...new Set(FORMATS.flatMap(f => f.types))];

/** The format of a file by its type or its name, or null. */
export const formatOf = (file) => {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  return FORMATS.find(f => f.types.includes(type)) || FORMATS.find(f => name.endsWith("." + f.ext)) || null;
};

/** The audio field's value, { path, seconds, name }, or null. */
export const audioOf = (value) => {
  try { const v = JSON.parse(value || "null"); return v && v.path ? v : null; } catch { return null; }
};

/** How long a file plays, in seconds, read by the browser before anything goes up. */
export function durationOf(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("audio");
    a.preload = "metadata";
    const done = (fn) => { URL.revokeObjectURL(url); fn(); };
    a.onloadedmetadata = () => done(() => resolve(a.duration));
    a.onerror = () => done(() => reject(new Error("This file could not be read as audio.")));
    a.src = url;
  });
}

/** Why a file cannot go up, or "" when it can. */
export function refuse(file, seconds) {
  if (!formatOf(file)) return "That is not one of the formats this sheet takes. Send an " + FORMAT_SAY + " file.";
  if (file.size > MAX_BYTES) return "The file has to be under 30 MB.";
  if (!Number.isFinite(seconds) || seconds <= 0) return "This file could not be read as audio.";
  // Rounding: a file a phone calls 60 seconds can read as 60.4.
  if (seconds > MAX_SECONDS + 0.9) return "Your story runs " + Math.round(seconds) + " seconds. The limit is " + MAX_SECONDS + ".";
  return "";
}

/** Check and upload one file into <class>/<email>/audio-<id>.<ext>. Resolves the field's value. */
export async function sendAudio({ file, classId, viewerId, onProgress }) {
  const seconds = await durationOf(file).catch(() => NaN);
  const why = refuse(file, seconds);
  if (why) throw new Error(why);
  const fmt = formatOf(file);
  const type = FORMATS.find(f => f.types.includes(String(file.type || "").toLowerCase())) ? file.type : fmt.types[0];
  const path = classId + "/" + String(viewerId).trim().toLowerCase() + "/audio-" + letterId(6) + "." + fmt.ext;
  await uploadImage({ path, blob: file, type, onProgress });
  return JSON.stringify({ path, seconds: Math.round(seconds * 10) / 10, name: String(file.name || "").slice(0, 120) });
}

/** A signed link an hour long for a clip the student owns. */
export async function linkFor(path) {
  const urls = await signUrls([path]);
  return urls[path] || "";
}
