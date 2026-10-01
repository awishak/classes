// Where JobBot keeps a student's file: the worksheets package's own tables.
//
// worksheet_sheets is one row per student per worksheet in a class, and
// worksheet_answers is one row per answer (migrations 001 and 002 in
// vendor/ishak-worksheets). The rules there read who is asking off the token,
// so a student writes only their own rows and the instructor, a host, reads
// every one. JobBot's fields are plain words with an optional part
// (title:a, duties:a, more:c), which is the shape the field check allows.
//
// An answer is at most 500 characters a row. A position's duties can run
// longer than that, so a long answer is cut into rows at position 0, 1, 2
// and joined back on load. Every write asks for the row back, the worksheets
// rule: an empty return is an error, never a tick.

const CHUNK = 500;
const chunks = (value) => {
  const out = [];
  for (let i = 0; i < value.length; i += CHUNK) out.push(value.slice(i, i + CHUNK));
  return out;
};
// Rows to a map of field to value, chunks joined in order.
export const answersOf = (rows) => {
  const by = {};
  (rows || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0)).forEach(r => { by[r.field] = (by[r.field] || "") + r.value; });
  return by;
};

const fail = (what, r) => { throw new Error(what + ": " + (r?.error?.message || "nothing came back")); };

/** The student's own file, read and written as them. */
export function supabaseStore({ supabase, worksheetKey, groupKey, viewerId }) {
  let sheetId = null;
  const viewer = String(viewerId || "").trim().toLowerCase();
  const sheet = async () => {
    if (sheetId) return sheetId;
    const r = await supabase.from("worksheet_sheets").select("id,submitted_at").eq("worksheet_key", worksheetKey).eq("group_key", groupKey).eq("viewer_id", viewer);
    if (r.error) fail("Could not read the sheet", r);
    if (r.data && r.data[0]) { sheetId = r.data[0].id; return sheetId; }
    const made = await supabase.from("worksheet_sheets").insert({ worksheet_key: worksheetKey, group_key: groupKey, viewer_id: viewer }).select("id,submitted_at");
    if (made.error || !made.data || !made.data[0]) fail("Could not start the sheet", made);
    sheetId = made.data[0].id;
    return sheetId;
  };
  return {
    async load() {
      const r = await supabase.from("worksheet_sheets").select("id,submitted_at").eq("worksheet_key", worksheetKey).eq("group_key", groupKey).eq("viewer_id", viewer);
      if (r.error) fail("Could not read the sheet", r);
      const row = r.data && r.data[0];
      if (!row) return { answers: {}, submitted_at: null };
      sheetId = row.id;
      const a = await supabase.from("worksheet_answers").select("field,value,position").eq("sheet_id", row.id).order("position").range(0, 1999);
      if (a.error) fail("Could not read the answers", a);
      return { answers: answersOf(a.data), submitted_at: row.submitted_at || null };
    },
    async save(field, value) {
      const id = await sheet();
      const gone = await supabase.from("worksheet_answers").delete().eq("sheet_id", id).eq("field", field);
      if (gone.error) fail("Could not replace the answer", gone);
      const rows = chunks(String(value)).map((v, i) => ({ sheet_id: id, field, value: v, position: i }));
      const r = await supabase.from("worksheet_answers").insert(rows).select("id");
      if (r.error || !r.data || r.data.length !== rows.length) fail("Could not save the answer", r);
    },
    async submit() {
      const id = await sheet();
      const when = new Date().toISOString();
      const r = await supabase.from("worksheet_sheets").update({ submitted_at: when }).eq("id", id).select("submitted_at");
      if (r.error || !r.data || !r.data[0]) fail("Could not submit", r);
      return r.data[0].submitted_at;
    },
    async recall() {
      const id = await sheet();
      const r = await supabase.from("worksheet_sheets").update({ submitted_at: null }).eq("id", id).select("id");
      if (r.error || !r.data || !r.data[0]) fail("Could not recall", r);
    },
  };
}

/** A file already read (the instructor, through /api/worksheet-submits): nothing is written. */
export function readStore(rows, submittedAt) {
  const refuse = async () => { throw new Error("This file is read only."); };
  return { async load() { return { answers: answersOf(rows), submitted_at: submittedAt || null }; }, save: refuse, submit: refuse, recall: refuse };
}

/** A store that forgets, for trying the terminal with nothing behind it. */
export function memoryStore() {
  const answers = {};
  let submitted = null;
  return {
    async load() { return { answers: { ...answers }, submitted_at: submitted }; },
    async save(field, value) { answers[field] = value; },
    async submit() { submitted = new Date().toISOString(); return submitted; },
    async recall() { submitted = null; },
  };
}
