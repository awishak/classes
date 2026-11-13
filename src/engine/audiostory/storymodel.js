// The audio story as data, and the rules Submit checks. Plain JS, so the
// smoke run checks the rules without a browser.
//
// Andrew, 2026-10-29, after the mockups: build the one that sits beside the
// finished page, the visual story builder's shape for sound. A story is
// worksheet answers, one field each, so a save touches one field and never
// the whole story:
//   audio      JSON { path, seconds, name }, the file, up to five minutes
//   cover      JSON { path, w, h }, one picture
//   headline   the headline
//   listen     one or two sentences about what a listener is about to hear
//   voices     JSON [{ id, name, role, knew }], everyone who talks; knew is
//              true, false or null (not marked yet). Only the instructor
//              sees the mark.
//   sounds     JSON [{ id, what, kind, from }], music, effects and found
//              audio; kind is "mine", "music" or "found"; from is where the
//              sound came from, needed for music and found audio
//   look       "light" or "dark": a white or a black page
//   credits    who did what, when the story is made in a pair
// "Within your allotted 5 minutes" is the audio exercise's own line, so the
// limit is five minutes; the listen line takes up to forty words.

export const MAX_STORY_SECONDS = 5 * 60;
// Andrew, 2026-11-12: the listen line is the Summary now, "a 100 words, not
// 40 words. way too few." The field is still `listen`.
export const MAX_LISTEN_WORDS = 100;

// Andrew, 2026-11-12: "let them choose from 10 different fonts and see what
// their story page looks like." [id, name, the family, Google's name for it].
export const FONTS = [
  ["lora", "Lora", "'Lora', Georgia, serif", "Lora:wght@500;600"],
  ["playfair", "Playfair Display", "'Playfair Display', Georgia, serif", "Playfair+Display:wght@500;700"],
  ["merriweather", "Merriweather", "'Merriweather', Georgia, serif", "Merriweather:wght@400;700"],
  ["dmserif", "DM Serif Display", "'DM Serif Display', Georgia, serif", "DM+Serif+Display"],
  ["fraunces", "Fraunces", "'Fraunces', Georgia, serif", "Fraunces:opsz,wght@9..144,400;9..144,600"],
  ["outfit", "Outfit", "'Outfit', system-ui, sans-serif", "Outfit:wght@400;600"],
  ["grotesk", "Space Grotesk", "'Space Grotesk', system-ui, sans-serif", "Space+Grotesk:wght@400;600"],
  ["oswald", "Oswald", "'Oswald', 'Arial Narrow', sans-serif", "Oswald:wght@400;600"],
  ["bebas", "Bebas Neue", "'Bebas Neue', Impact, sans-serif", "Bebas+Neue"],
  ["elite", "Special Elite", "'Special Elite', 'Courier New', monospace", "Special+Elite"],
];
export const fontOf = (id) => FONTS.find(f => f[0] === id) || FONTS[0];
export const FONTS_HREF = "https://fonts.googleapis.com/css2?" + FONTS.map(f => "family=" + f[3]).join("&") + "&display=swap";

/** "1:20" or "80" to seconds, or null when the words are not a time. */
export const secondsOf = (at) => {
  const m = String(at || "").trim().match(/^(?:(\d{1,2}):)?(\d{1,3})$/);
  if (!m) return null;
  if (m[1] !== undefined && Number(m[2]) > 59) return null;
  return (Number(m[1]) || 0) * 60 + Number(m[2]);
};

export const SOUND_KINDS = [["mine", "My recording"], ["music", "Music"], ["found", "Found audio"]];
export const soundKindSay = (kind) => (SOUND_KINDS.find(k => k[0] === kind) || SOUND_KINDS[0])[1];

const parse = (v, fallback) => { try { const x = JSON.parse(v); return x == null ? fallback : x; } catch { return fallback; } };
const listOf = (v) => { const x = parse(v, []); return Array.isArray(x) ? x.filter(i => i && typeof i === "object") : []; };
const clipOf = (v) => { const x = parse(v, null); return x && typeof x.path === "string" && x.path ? { path: x.path, seconds: Number(x.seconds) || 0, name: String(x.name || "") } : null; };
const coverOf = (v) => { const x = parse(v, null); return x && typeof x.path === "string" && x.path ? { path: x.path, w: Number(x.w) || 0, h: Number(x.h) || 0 } : null; };

export const wordsIn = (s) => (String(s || "").trim().match(/[^\s]+/g) || []).length;

/** Answers to a story: { audio, cover, headline, listen, voices, sounds, look, credits }. */
export function audioStoryOf(answers) {
  const a = answers || {};
  return {
    audio: clipOf(a.audio),
    cover: coverOf(a.cover),
    headline: String(a.headline || ""),
    listen: String(a.listen || ""),
    voices: listOf(a.voices).map(v => ({ id: String(v.id || ""), name: String(v.name || ""), role: String(v.role || ""), knew: v.knew === true ? true : v.knew === false ? false : null })),
    sounds: listOf(a.sounds).map(s => ({ id: String(s.id || ""), what: String(s.what || ""), kind: SOUND_KINDS.some(k => k[0] === s.kind) ? s.kind : "mine", from: String(s.from || "") })),
    look: a.look === "dark" ? "dark" : "light",
    sources: String(a.sources || ""),
    font: fontOf(a.font)[0],
    chapters: listOf(a.chapters).map(c => ({ id: String(c.id || ""), at: String(c.at || ""), name: String(c.name || "") })),
    credits: String(a.credits || ""),
  };
}

/** m:ss for a length in seconds. */
export const clock = (seconds) => {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};

/** What stands between the story and Submit, in sentences a student can act on. */
export function problemsOf(story) {
  const out = [];
  if (!story.audio) out.push("Upload your audio file.");
  else if (story.audio.seconds > MAX_STORY_SECONDS + 0.9) out.push("Your story runs " + clock(story.audio.seconds) + ". The limit is " + clock(MAX_STORY_SECONDS) + ", so cut it down and upload the file again.");
  if (!story.cover) out.push("Add your cover picture.");
  if (!story.headline.trim()) out.push("Write a headline.");
  const w = wordsIn(story.listen);
  if (!w) out.push("Write your summary.");
  if (w > MAX_LISTEN_WORDS) out.push(`Cut ${w - MAX_LISTEN_WORDS} word${w - MAX_LISTEN_WORDS === 1 ? "" : "s"} from your summary. You have ${w}, and it takes up to ${MAX_LISTEN_WORDS}.`);
  if (!story.voices.length) out.push("Name at least one voice, even if the only voice is yours.");
  story.voices.forEach((v, i) => {
    const label = v.name.trim() || "Voice " + (i + 1);
    if (!v.name.trim()) out.push(label + ": write who this is.");
    if (v.knew === null) out.push(label + ": mark whether they knew they were being recorded.");
  });
  // Andrew, 2026-11-12: "I want people to do chapters." The sounds list left
  // the sheet the same day, so nothing here asks about sounds.
  if (!story.chapters.length) out.push("Add your chapters.");
  story.chapters.forEach((c, i) => {
    const label = c.name.trim() || "Chapter " + (i + 1);
    const t = secondsOf(c.at);
    if (!c.name.trim()) out.push(label + ": write the name of the chapter.");
    if (t === null) out.push(label + ": write when it starts, like 1:20.");
    else if (story.audio && t > story.audio.seconds) out.push(label + ": " + c.at.trim() + " is after the end of your story.");
  });
  return out;
}

/** How far along a story is, 0 to 1: the file, the cover, the headline, the listen line, a voice. */
export function progressOf(story) {
  const parts = [story.audio ? 1 : 0, story.cover ? 1 : 0, story.headline.trim() ? 1 : 0, wordsIn(story.listen) ? 1 : 0, story.voices.some(v => v.name.trim()) ? 1 : 0];
  return parts.reduce((n, x) => n + x, 0) / parts.length;
}
