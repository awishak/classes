// A person, as a face.
//
// Andrew, 2026-09-23: "i'd also like us to be using avatars anywhere their
// names appear. same for me." So the picture had to be reachable from every
// screen that writes a name, and it used to live inside RosterCard, which half
// the app cannot import without going in a circle. It lives here instead, and
// RosterCard passes it on for the screens that already ask it for one.
//
// The picture itself is kept beside the class rather than in it; photos.js puts
// it back on the profile before any of this sees it.

import { nameShown } from "./roster.js";
import * as TOKENS from "./tokens.js";

export const profileOf = (data, name) => (data?.profiles?.[name] || {});

const initialsOf = (name) => String(name || "")
  .trim().split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join("")
  .toUpperCase();

/** The circle: their photograph, or their initials in the class's colour. */
export function Avatar({ profile, name, accent, size = 44, ring = true }) {
  const photo = profile?.avatar && String(profile.avatar).startsWith("data:") ? profile.avatar : null;
  const a = accent || TOKENS.TEXT.primary;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      background: a + "22", border: ring ? "2px solid " + a + "55" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.36), fontWeight: 700, color: a }}>
      {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initialsOf(name)}
    </div>
  );
}

/**
 * The same circle, for a name on any screen: hand it the class and the data and
 * it finds the person. `instructor` draws Andrew, whose picture is on his own
 * card in the shared store rather than on a class roster.
 */
export function Face({ config, data, name, size = 36, instructor = false }) {
  const profile = instructor ? { avatar: config?.instructor?.photo || "" } : profileOf(data, name);
  const shown = instructor ? (config?.instructor?.name || "Dr. Ishak") : nameShown(data, name);
  return <Avatar profile={profile} name={shown} accent={config?.accent} size={size} />;
}

/** A face and the name beside it, which is most of what a row of a list is. */
export function FaceName({ config, data, name, size = 32, instructor = false, bold = false, style }) {
  const shown = instructor ? (config?.instructor?.name || "Dr. Ishak") : nameShown(data, name);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, ...style }}>
      <Face config={config} data={data} name={name} size={size} instructor={instructor} />
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: bold ? 600 : 400 }}>{shown}</span>
    </span>
  );
}
