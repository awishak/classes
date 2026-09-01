// A way back, for as long as the tab is open.
//
// An edit here rewrites a block that nine days point at, and until now there
// was no history and no way back. Then the bulk bar arrived and one press
// started retagging four hundred rows, changing the type of forty, or moving a
// shelf's worth of material onto the shared store. Making a change cheap
// without making the change reversible is how a good afternoon becomes a bad
// one.
//
// So every write that touches blocks says what it is about to touch, and the
// blocks are photographed first. Putting them back is the photograph, written
// straight over the top.
//
// Surgical rather than wholesale. Restoring a whole store as it was would
// throw away every other change made since, including changes made in another
// tab or by a class saving over the top. Only the blocks in the photograph are
// written, so an edit made to a different block in between survives an undo of
// this one.
//
// The stack lives in the tab and dies with the tab. A change I made last
// Tuesday is not something I can put back by pressing a button, and pretending
// otherwise would mean keeping every version of every block forever to buy a
// button I would press twice a year.

const TARGETS = (classes) => [...(classes || []).map(c => c.id), "shared"];

// Where a block lives right now, and what it says. A block that is nowhere is
// a block about to be made, and the photograph says so with a null.
export function photograph({ stores, classes, ids }) {
  const seen = [];
  (ids || []).forEach(id => {
    let found = null;
    TARGETS(classes).some(target => {
      const block = ((stores[target] || {}).blocks || {})[id];
      if (!block) return false;
      found = { id, target, block };
      return true;
    });
    seen.push(found || { id, target: "", block: null });
  });
  return seen;
}

export const remember = ({ stores, classes, ids, what }) => ({
  what, at: Date.now(), before: photograph({ stores, classes, ids }),
});

// The patches that put a photograph back. A block is taken out of wherever it
// is now and written where it was, which is what makes a move to the shared
// shelf reversible; a block that was nowhere is taken out and not put back.
export function undoPatches({ stores, classes, entry }) {
  const targets = TARGETS(classes);
  const next = {};
  const touched = {};
  const at = (target) => {
    if (!touched[target]) touched[target] = { ...((stores[target] || {}).blocks || {}) };
    return touched[target];
  };

  (entry?.before || []).forEach(({ id, target, block }) => {
    targets.forEach(t => { if (((stores[t] || {}).blocks || {})[id]) delete at(t)[id]; });
    if (block && target) at(target)[id] = block;
  });

  Object.entries(touched).forEach(([target, blocks]) => {
    next[target] = { ...(stores[target] || {}), blocks };
  });
  return next;
}

// What the button says. The count is the point: putting one headline back and
// putting four hundred tags back should not read the same.
export const sayEntry = (entry) => {
  if (!entry) return "";
  const n = (entry.before || []).length;
  return entry.what + (n > 1 ? ", " + n + " blocks" : "");
};

// The stack, capped. Twenty steps is more than a session of mine ever needs,
// and holding four hundred blocks a step forever is how a tab runs out of room.
export const LIMIT = 20;
export const pushEntry = (stack, entry) =>
  (!entry?.before?.length ? stack : [entry, ...(stack || [])].slice(0, LIMIT));
