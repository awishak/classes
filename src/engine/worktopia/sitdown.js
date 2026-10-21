// Sit-Down 1: who meets when.
//
// Sorted from the Worktopia files on 2026-10-12, and the reasons are in
// teaching/comm118/sit-down-groups.md. Andrew: "can you sort them in
// worktopia by group for now?" So the groups live here, written by hand,
// until the sort is settled and has a home of its own. Everyone who said
// they are available Thursday is on Thursday; Luke and Charles are off
// Friday; everyone who named a co-worker has one at the table where the day
// allowed; the jobs at each table are mixed.

import { pickOf, roleAt, pullOf, pullLinkOf } from "./roles.js";

export const SESSIONS = [
  { key: "wed-915", day: "Wednesday, October 21", time: "9:15",
    names: ["Luke Baird", "Charles Kosinski", "Catherine Shanahan", "Sophia Alvarenga"] },
  { key: "wed-945", day: "Wednesday, October 21", time: "9:45",
    names: ["Drew Barreto", "Paul Beaven", "Addison Marshak", "Alexa Gomez-Ardon"] },
  { key: "thu-915", day: "Thursday, October 22", time: "9:15",
    names: ["Jameson Baldwin", "Will Tortorella", "Neel Namburar", "Katie Coggins"] },
  { key: "thu-945", day: "Thursday, October 22", time: "9:45",
    names: ["Ruby McAlister", "Mailin Orozco", "Chloe Shim", "Gianna Alcaraz", "Jacqueline Cingel"] },
  { key: "fri-915", day: "Friday, October 23", time: "9:15",
    names: ["Lucy Kate Murray", "Audrey Graham", "Emme Munn", "Lila Waechter"] },
  { key: "fri-945", day: "Friday, October 23", time: "9:45",
    names: ["Sophia Taylor", "Emma Alvarez", "Julia Benavides", "Yoyo Yang"] },
];

// "Wed 9:15", for a table cell.
export const shortOf = (s) => s.day.slice(0, 3) + " " + s.time;

const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
// The name someone goes by, where the roster has another. Andrew, 2026-10-13:
// "call Vianna Emma." The lists say Emma; the roster and her email still say
// Vianna, so a match tries both. Andrew, 2026-10-14: "Haixing is Yoyo."
const ROSTER_NAME = { "Emma Alvarez": "Vianna Alvarez", "Yoyo Yang": "Haixing Yang" };
export const rosterName = (name) => ROSTER_NAME[name] || name;
const matches = (n, name) => same(n, name) || same(rosterName(n), name);

export const sessionOf = (name) => SESSIONS.find(s => s.names.some(n => matches(n, name))) || null;
// Where a name sorts: its session's place, or after every session.
export const sessionIndex = (name) => { const s = sessionOf(name); return s ? SESSIONS.indexOf(s) : SESSIONS.length; };
// The session's own spelling of a name, given either spelling.
export const sessionName = (name) => { const s = sessionOf(name); return s ? s.names.find(n => matches(n, name)) : name; };

// ─── Sit-Down 1, the facts a student needs ───
//
// Andrew, 2026-10-15: "students will be able to see who is in their group,
// when are they meeting? What are the roles of other people in their group?
// What are the assignment details in terms of what they have to prep?" The
// page is SitdownPage.jsx at /<class>/sitdown; the facts are here so the
// answers page, the roles page and a script can read the same ones.
//
// The prep is due Monday night. Andrew said "Monday, October 18th"; October
// 18, 2026 is a Sunday, and the Monday before the first sit-down is the 19th.
// The table's documents open to the table the minute the prep is due:
// "immediately, they get links, like at 12:01 a.m."
// The classes that hold a sit-down: COMM 118, and COMM 999, the rig for
// trying the student path with Pepe and Jan.
export const SITDOWN_CLASSES = ["comm118", "comm999"];
// The classes with an instructor's sheet written: /<class>/sitdown/sheet.
export const SHEET_CLASSES = ["comm118"];
export const SITDOWN = {
  title: "Sit-Down 1",
  room: "Vari Hall 206",
  prepDue: new Date(2026, 9, 19, 23, 59, 59).getTime(),
  prepDueText: "Monday, October 19, at 11:59 PM",
  release: new Date(2026, 9, 20, 0, 0, 0).getTime(),
  releaseText: "12:01 AM on Tuesday, October 20",
};
export const released = (now = Date.now()) => now >= SITDOWN.release;

// The role a student plays: Andrew's letter from the roles page if he set
// one, else the suggestion. Only the title and the field; the reasons on the
// roles page are his.
export const roleFor = (name, saved) => {
  const n = sessionName(name);
  const letter = saved?.[n] || pickOf(n)?.pick || "a";
  return roleAt(n, letter);
};

// Everyone at a session's table, each with the session's spelling of the
// name, the roster's, and their role.
export const tableOf = (session, saved) =>
  (session?.names || []).map(n => ({ name: n, roster: rosterName(n), role: roleFor(n, saved) }));

// The prompt for two people at one table: the pull between their fields,
// written once per pair in roles.js. Two in the same field get a different
// question; two with no field get nothing.
export const promptFor = (a, b) => {
  const fa = a?.role?.field, fb = b?.role?.field;
  if (!fa || !fb) return { same: false, line: "", link: null };
  return { same: fa === fb, line: fa === fb ? "" : pullOf(fa, fb), link: fa === fb ? null : pullLinkOf(fa, fb) };
};

// ─── where a turned-in link lives ───
//
// On the class row as sitdownLinks[rosterName] = { link, at }, which any
// student can write. And when an assignment on My Work points at this page,
// as a submission on that assignment's log too, so My Work shows the hand-in
// and the grade view queues the work. A link turned in on My Work shows here
// through the same log. Whichever is newest is the one.
const SITDOWN_URL = /\/sitdown\/?(?:[?#].*)?$/;
export const sitdownAssignment = (assignments) =>
  (assignments || []).find(a => SITDOWN_URL.test(String(a?.instructionsUrl || "").trim())) || null;

export function linkOf(data, rosterName, asg) {
  const own = data?.sitdownLinks?.[rosterName];
  const log = asg ? (data?.assignmentLog?.[asg.id]?.[rosterName] || []).filter(e => e && !e.deleted && e.type === "submission" && e.link) : [];
  const last = log[log.length - 1];
  const both = [own && own.link ? own : null, last ? { link: last.link, at: last.ts } : null].filter(Boolean);
  if (!both.length) return null;
  return both.sort((x, y) => (y.at || 0) - (x.at || 0))[0];
}

export function withLink(data, rosterName, link, asg, now = Date.now(), id = "sd-" + now) {
  const next = { ...(data || {}), sitdownLinks: { ...(data?.sitdownLinks || {}), [rosterName]: { link, at: now } } };
  if (!asg) return next;
  const al = { ...(data?.assignmentLog || {}) };
  const byStudent = { ...(al[asg.id] || {}) };
  byStudent[rosterName] = [...(byStudent[rosterName] || []), { id, ts: now, type: "submission", link, text: "" }];
  al[asg.id] = byStudent;
  return { ...next, assignmentLog: al };
}

// A link a browser can open. Google Docs is what Andrew expects, and any
// address works.
export const looksLikeLink = (s) => /^https?:\/\/\S+\.\S+/i.test(String(s || "").trim());
