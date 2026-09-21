// A card the class reads before the site.
//
// Andrew, 2026-09-21: "i want to create a card that will be there next time
// students log in", with his words for it, and "get rid of it after 11:30
// tomorrow morning."
//
// So a notice is three things: what it says, when it stops, and who has already
// read it. It lives in the class store next to everything else the class holds:
//
//   notice     { id, text, until }   `until` is a moment, in milliseconds
//   noticeSeen { [name]: id }        the notice each student has tapped through
//
// A student sees it on every visit until they tap through it, and nobody sees
// it after `until` has passed. Both together, because a card that comes back
// after it has been read is a card people learn to dismiss without reading, and
// a card with no end keeps being read out of date.
//
// The id changes when the words change, so writing a new notice shows it to the
// class again, including to the students who read the last one.

export const noticeOf = (data) => (data || {}).notice || null;

// Is there something to say, and is it still worth saying?
export const noticeLive = (data, now = Date.now()) => {
  const n = noticeOf(data);
  if (!n || !String(n.text || "").trim()) return null;
  if (n.until && now > n.until) return null;
  return n;
};

// What this student should be shown, which is nothing once they have read it.
export function noticeFor(data, name, now = Date.now()) {
  const n = noticeLive(data, now);
  if (!n || !name) return null;
  return ((data || {}).noticeSeen || {})[name] === n.id ? null : n;
}

export const markNoticeRead = (data, name) => {
  const n = noticeOf(data);
  if (!n || !name) return data;
  return { ...(data || {}), noticeSeen: { ...((data || {}).noticeSeen || {}), [name]: n.id } };
};

// Written, or taken down. The id is the words and the deadline together, so a
// change to either is a new card and the class reads it again.
export const noticeId = (text, until) =>
  String(until || 0) + ":" + String(text || "").trim().length + ":" +
  [...String(text || "").trim()].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36);

export function setNotice(data, text, until) {
  const words = String(text || "").trim();
  if (!words) { const { notice, ...rest } = (data || {}); return rest; }
  return { ...(data || {}), notice: { id: noticeId(words, until), text: words, until: until || 0 } };
}
