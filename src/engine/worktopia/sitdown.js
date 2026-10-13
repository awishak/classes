// Sit-Down 1: who meets when.
//
// Sorted from the Worktopia files on 2026-10-12, and the reasons are in
// teaching/comm118/sit-down-groups.md. Andrew: "can you sort them in
// worktopia by group for now?" So the groups live here, written by hand,
// until the sort is settled and has a home of its own. Everyone who said
// they are available Thursday is on Thursday; Luke and Charles are off
// Friday; everyone who named a co-worker has one at the table where the day
// allowed; the jobs at each table are mixed.

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
    names: ["Sophia Taylor", "Vianna Alvarez", "Julia Benavides", "Haixing Yang"] },
];

// "Wed 9:15", for a table cell.
export const shortOf = (s) => s.day.slice(0, 3) + " " + s.time;

const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
export const sessionOf = (name) => SESSIONS.find(s => s.names.some(n => same(n, name))) || null;
// Where a name sorts: its session's place, or after every session.
export const sessionIndex = (name) => { const s = sessionOf(name); return s ? SESSIONS.indexOf(s) : SESSIONS.length; };
