// Who a student is, as one stable string.
//
// The seeded roster is `{ name, from, goals }` with no id, and nothing in the
// engine ever assigned one. So `student.id` was `undefined` for every student
// in a fresh class, and everything keyed by it collapsed onto a single key:
//
//   game.responses["undefined-0"]     every student's answer to question one
//   log entry { studentId: undefined } every student's points, in one bucket
//
// Two phones answering the same question wrote the same key, so the second
// answer replaced the first. Not a race, which is what the write merge fixed
// last night: the same key, which no merge can help with.
//
// A name is the identity the whole app already uses. Students sign in by
// picking a name, the discussion board stores a name, and the roster is a list
// of names. So the id is derived from the name, which means it is stable
// without a migration and works on data already in the store.

// A name to a key. Lower case, no spaces, no punctuation, so "Hanni Fakhoury"
// and "hanni  fakhoury" are the same student and neither can collide with the
// separator the answer keys use.
export const slugOf = (name) =>
  String(name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The id to use everywhere. An explicit id wins, because a class whose roster
// came from somewhere with real ids keeps them; otherwise the name stands in.
export const idOf = (student) => {
  if (!student) return "";
  if (typeof student === "string") return slugOf(student);
  return String(student.id || "") || slugOf(student.name);
};

// The student behind an id, from either direction.
export const findStudent = (roster, key) =>
  (roster || []).find(s => idOf(s) === key || s.name === key) || null;

// What one student has in the points log, which is what the gradebook adds up
// and what a streak counts.
export const pointsOf = (log, student) => {
  const id = idOf(student);
  if (!id) return 0;
  return (log || [])
    .filter(e => idOf({ id: e.studentId }) === id || slugOf(e.student) === id)
    .reduce((n, e) => n + (e.amount || 0), 0);
};

// A roster with every id filled in.
//
// Applied where students are read rather than at the eighty-odd places that
// use `student.id`, because normalising once at the door is a smaller and much
// safer change than editing every call site. A student who already has an id
// keeps it.
export const withIds = (students) =>
  (students || []).map(s => (s && s.id ? s : { ...s, id: idOf(s) }));

// The same, for a whole class store.
export const dataWithIds = (data) =>
  data && data.students ? { ...data, students: withIds(data.students) } : data;
