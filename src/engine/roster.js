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

// ─── the roster, pasted ───
//
// A list of students arrives as whatever the registrar or a spreadsheet gives
// me: one student per line, name and email, sometimes a section, separated by
// commas or tabs, sometimes with a header row. This reads that into rows and
// merges them into the roster without losing anybody's id, because the id is
// what every answer, grade and seat is keyed on.

const looksLikeEmail = (t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(t || "").trim());

// Rows out of pasted text. Each row is { name, email, section }, and a row
// with neither a name nor an email is dropped. "Last, First" becomes
// "First Last" when the line is tab-separated, since that is how a registrar
// export reads; a comma-separated line takes the columns as given.
export const parseRoster = (text) => {
  const lines = String(text || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = [];
  lines.forEach((line, i) => {
    const sep = line.includes("\t") ? "\t" : ",";
    const cells = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
    const low = cells.map(c => c.toLowerCase());
    if (i === 0 && (low.includes("name") || low.includes("email") || low.includes("e-mail"))) return;
    const email = cells.find(looksLikeEmail) || "";
    const rest = cells.filter(c => c !== email && c);
    let name = rest[0] || "";
    if (sep === "\t" && name.includes(",")) {
      const [last, first] = name.split(",").map(x => x.trim());
      if (first) name = first + " " + last;
    }
    const section = rest[1] || "";
    if (!name && !email) return;
    rows.push({ name, email: email.toLowerCase(), section });
  });
  return rows;
};

// The roster with the pasted rows folded in. A row matches a student by email
// first, then by the slug of the name; a match fills in what the student was
// missing and never changes the id. A row that matches nobody is a new
// student. Returns the roster and how many were added and updated.
export const mergeRoster = (students, rows) => {
  const out = withIds(students).map(s => ({ ...s }));
  let added = 0, updated = 0;
  rows.forEach(r => {
    const email = String(r.email || "").toLowerCase();
    const hit = out.find(s => (email && String(s.email || "").toLowerCase() === email) || (r.name && idOf(s) === slugOf(r.name)));
    if (hit) {
      let changed = false;
      if (email && hit.email !== email) { hit.email = email; changed = true; }
      if (r.section && hit.section !== r.section) { hit.section = r.section; changed = true; }
      if (!hit.name && r.name) { hit.name = r.name; changed = true; }
      if (changed) updated++;
      return;
    }
    const name = r.name || email.split("@")[0];
    out.push({ id: slugOf(name), name, email, section: r.section || "", from: "", goals: "" });
    added++;
  });
  return { students: out, added, updated };
};
