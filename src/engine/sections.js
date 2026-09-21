// Two sittings of one class.
//
// COMM 3 meets twice on the same day, at 8:00 and at 10:30, and the two are
// one class: one schedule, one set of challenges, one library. Andrew,
// 2026-09-20: "bc i have two sections of comm 3, give me numbers by section.
// also, how are we going to handle that when it comes to things like games or
// class activities? I will actually need a way for students to ONLY see
// students in their class for the roster."
//
// So the rule, which the COMM 3 config has carried as a note since September:
// anything made of PEOPLE belongs to a section, and everything else is single.
// The roster a student reads, who is here, the seats on the Horn board, the
// game running in the room: those are the room. The day, the schedule, a
// challenge, a block: those are the class, and changing one changes it for
// both sittings.
//
// A section is the label of a sitting, "8:00" or "10:30", carried on the
// student. Nothing else identifies one, so a class with one sitting has no
// sections at all and every function here is a pass-through.
//
// The test student belongs to no section on purpose, so a fake account cannot
// land in a real room's numbers.

import { useState, useEffect } from "react";

const clean = (s) => String(s || "").trim();

// A class with one sitting writes `meets` as one object rather than a list,
// which is why every reader here goes through this.
const meetsOf = (config) => Array.isArray(config?.meets) ? config.meets : config?.meets ? [config.meets] : [];

export const sectionsOf = (config) => meetsOf(config).map(m => clean(m.label)).filter(Boolean);
export const hasSections = (config) => sectionsOf(config).length > 1;
export const sectionOf = (student) => clean(student?.section);

// The one a student is in, read off the roster by name.
export const sectionFor = (students, name) => sectionOf((students || []).find(s => s.name === name));

// Everyone in one section. No section asked for means everyone, which is what
// a class with one sitting always gets.
export const studentsIn = (students, section) =>
  section ? (students || []).filter(s => sectionOf(s) === section) : (students || []);

// ─── the test student ───
//
// A class can name one fake student, so Andrew can look at his own site as a
// student and write things to himself without borrowing a real person's name.
// They are his to see: on his roster, in View as a student, and writable from
// there. They are nobody else's, so they stay out of the roster students read
// and out of every count of how many people are in the class.
export const testStudentOf = (config) => clean(config?.testStudent);
export const isTestStudent = (config, name) => {
  const t = testStudentOf(config);
  return !!t && clean(name) === t;
};
export const realStudents = (config, students) =>
  (students || []).filter(s => !isTestStudent(config, s?.name));

// ─── the section in the room ───
//
// Read off the clock: the sitting the time is inside, or the next one today,
// or the first. The dashboard opens on it and lets him say otherwise, because
// the 8:00 section's day gets taught again at 10:30 and the screen should not
// be wrong about which room it is in.
const minutesOf = (hhmm) => {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

export function sectionNow(config, now = Date.now()) {
  const meets = meetsOf(config).filter(m => clean(m.label));
  if (meets.length < 2) return "";
  const d = new Date(now);
  const mins = d.getHours() * 60 + d.getMinutes();
  const inside = meets.find(m => {
    const a = minutesOf(m.start), b = minutesOf(m.end);
    return a != null && b != null && mins >= a && mins <= b;
  });
  if (inside) return clean(inside.label);
  const ahead = meets
    .map(m => [m, minutesOf(m.start)])
    .filter(([, a]) => a != null && a >= mins)
    .sort((x, y) => x[1] - y[1])[0];
  return clean((ahead ? ahead[0] : meets[0]).label);
}

// The section in the room, as the screens agree on it.
//
// The clock decides by default. Saying otherwise is a choice about right now,
// so it is kept in this browser and forgotten after a few hours: the 8:00
// section taught again at 10:30 should not still be showing the 8:00 room
// tomorrow morning because of one press last term.
const HOLD = 6 * 60 * 60 * 1000;
const roomKey = (config) => (config?.storageKey || "class") + "-section";

export function readRoomSection(config, now = Date.now()) {
  if (!hasSections(config)) return "";
  try {
    const raw = window.localStorage.getItem(roomKey(config));
    const v = raw ? JSON.parse(raw) : null;
    if (v && v.section && now - (v.at || 0) < HOLD && sectionsOf(config).includes(v.section)) return v.section;
  } catch { /* private mode, or a server with no window */ }
  return sectionNow(config, now);
}

// Every screen that cares hears about a change, because the choice is made in
// the top bar and read by the dashboard, the Horn board and whatever else is
// open at the time.
export const SECTION_CHANGED = "ishak:section";

export function writeRoomSection(config, section, now = Date.now()) {
  try { window.localStorage.setItem(roomKey(config), JSON.stringify({ section, at: now })); } catch { /* private mode */ }
  try { window.dispatchEvent(new Event(SECTION_CHANGED)); } catch { /* server */ }
}

// The section in the room, as a piece of state any surface can hold. One
// writer, the bar, and everybody else follows.
export function useRoomSection(config) {
  const [sec, setSec] = useState(() => readRoomSection(config));
  useEffect(() => {
    const on = () => setSec(readRoomSection(config));
    on();
    window.addEventListener(SECTION_CHANGED, on);
    return () => window.removeEventListener(SECTION_CHANGED, on);
  }, [config?.storageKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  return [sec, (v) => { writeRoomSection(config, v); setSec(v); }];
}
