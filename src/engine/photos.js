// A student's photograph, kept beside the class rather than inside it.
//
// Every save in this app writes the whole class as one row, so the weight of
// that row is the cost of every keystroke. COMM 3 was 452KB and 346KB of that
// was 23 photographs: a line typed in the day doc shipped two dozen faces with
// it, and the first save of the day copied the lot to a backup first. See
// [store.js] on the day a lesson plan went missing.
//
// So the pictures move one row over, to `<class>-photos`, which is a plain map
// of the student's name to the data URL. The class row keeps a mark where the
// picture was, so a profile still reads as filled in (profileComplete wants
// every field, the photograph among them) and nothing has to know the picture
// lives elsewhere.
//
// Readers do not change. `withPhotos` puts the pictures back on the profiles
// as the page hands its data down, so every screen that reads
// `profiles[name].avatar` goes on reading it.

import { useCallback, useMemo } from "react";
import { useClassData } from "./store.js";

export const photosKeyFor = (storageKey) => String(storageKey) + "-photos";

// What stands in the class row where a picture used to be. A word rather than
// an empty string, because an empty one would put the first-week challenge
// back to unfinished for everybody who had done it.
export const PHOTO_MARK = "photo";

const isPicture = (v) => typeof v === "string" && v.startsWith("data:");
const standingIn = (v) => !v || v === PHOTO_MARK;

/** The class's photographs, and a way to put one there. */
export function usePhotos(storageKey) {
  const [row, update] = useClassData(photosKeyFor(storageKey));
  const photos = row || {};
  const setPhoto = useCallback((name, url) => {
    update(prev => ({ ...(prev || {}), [String(name)]: url || "" }));
  }, [update]);
  return [photos, setPhoto];
}

/**
 * The class as every screen wants to read it: profiles carrying their
 * pictures. A class that has not been moved over yet still has the picture on
 * the profile, and that one wins, so both shapes read the same.
 */
export function withPhotos(data, photos) {
  if (!data || !photos) return data;
  const names = Object.keys(photos);
  if (!names.length) return data;
  const profiles = { ...(data.profiles || {}) };
  let moved = false;
  for (const name of names) {
    const url = photos[name];
    if (!isPicture(url)) continue;
    const profile = profiles[name];
    if (profile && !standingIn(profile.avatar)) continue;
    profiles[name] = { ...(profile || {}), avatar: url };
    moved = true;
  }
  return moved ? { ...data, profiles } : data;
}

/** The same, held still between renders. */
export function useWithPhotos(data, photos) {
  return useMemo(() => withPhotos(data, photos), [data, photos]);
}

/**
 * Writing a profile: the picture goes to the photographs row, the rest to the
 * class, and the class keeps the mark. Hand it the same `update` the caller
 * already has and the `setPhoto` from usePhotos.
 */
export function saveProfile({ update, setPhoto, name, profile }) {
  const avatar = profile?.avatar || "";
  if (isPicture(avatar) && setPhoto) setPhoto(name, avatar);
  const kept = { ...profile, avatar: isPicture(avatar) ? PHOTO_MARK : avatar };
  update(prev => ({ ...prev, profiles: { ...(prev.profiles || {}), [name]: kept } }));
}
