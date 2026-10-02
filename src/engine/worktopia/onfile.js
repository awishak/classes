// What Worktopia has on file from week 1: a short read of what each student
// is interested in, written from their notice, think and wonder answers on
// the AFL Grand Final sheet, shown on their record card as "Interests".
// Andrew, 2026-10-01: "analyze them now and see what they are interested in,
// and put a little description in their box."
//
// Nothing about a student is in this repo. The descriptions live in the class
// store under <storageKey>-worktopia-onfile as { files: { [email]:
// { interests } } }, readable by the class pages the way the roster is. The
// terminal is handed a loader, onFile(), that returns { interests } or null;
// a loader that fails returns null, and the run goes on without the line.

export const onFileRow = (storageKey) => storageKey + "-worktopia-onfile";

/** The file for one sign-in, from the class store: { interests } or null. */
export async function fileFor({ supabase, storageKey, viewerId }) {
  const r = await supabase.from("app_data").select("data").eq("id", onFileRow(storageKey));
  if (r.error || !r.data || !r.data[0]) return null;
  const files = (r.data[0].data || {}).files || {};
  const mine = files[String(viewerId || "").trim().toLowerCase()];
  const interests = String(mine?.interests || "").replace(/\s+/g, " ").trim();
  return interests ? { interests } : null;
}

/** A loader for the terminal: the student's file, or nothing. */
export const loadOnFile = ({ supabase, storageKey, viewerId }) => async () => {
  try { return await fileFor({ supabase, storageKey, viewerId }); } catch { return null; }
};
