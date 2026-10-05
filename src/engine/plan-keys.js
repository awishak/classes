// Which keys of a class are the instructor's. SPLIT.md has the reasoning.
//
// A class is two rows: `<storageKey>`, which students write, and
// `<storageKey>-plan`, which only an instructor session may write. These are
// the keys that live on the plan row. On their own here, with no imports, so
// the migration script can read the list without pulling the engine in.
export const PLAN_KEYS = new Set([
  "dayPlans", "schedule", "library", "blocks", "assignments", "dueCards", "stocked", "scratch",
  "roomGround", "seedVersion", "athSeats", "commentDrafts", "gradeBoard", "triviaPool",
  "headlineCategories", "instructorCard", "courseTitle", "assignmentsBlurb", "leaderboardExplain",
  "scheduleDocUrl", "gameLinks", "profileTaskOff", "portedFrom", "pins", "attendance", "students",
  "inboxSeen", "worksheetsOpen",
]);
export const PLAN_SUFFIX = "-plan";
export const splitParts = (obj) => {
  const plan = {}, rest = {};
  Object.entries(obj || {}).forEach(([k, v]) => { (PLAN_KEYS.has(k) ? plan : rest)[k] = v; });
  return { plan, rest };
};
