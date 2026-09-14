// Two things you do to a whole day: start it from a template, and go back to an
// earlier version of it.
//
// TEMPLATES are the shape of a day already taught (sections, in order, with
// names, times and rows) saved under a name, and put onto another day after
// whatever that day has. They live in the shared store, so a template made in
// COMM 118 is there in COMM 3. They are what sequences were for, made from days
// Andrew actually ran instead of a list decided in advance.
//
// HISTORY lists the versions of this day there are to go back to: the ones
// this browser kept as the day was edited, and the backups the store takes of
// the whole class before the first save of each day and before a big change.
// Restoring one writes it over the day, and Undo takes the restore back.

import { useEffect, useState } from "react";
import { normSlot } from "./dayplan.js";
import * as TOKENS from "./tokens.js";

const F = TOKENS.FONT.body;
const MONO = TOKENS.FONT.label;

// How much a version of a day holds, said the same way for every version so
// two can be compared at a glance.
export function planSummary(plan, blockOf) {
  const slots = plan?.slots || {};
  let sections = 0, items = 0, notes = 0;
  const first = [];
  Object.values(slots).forEach(s => {
    const b = normSlot(s);
    if (!b.items.length && !(b.title || "").trim()) return;
    sections++;
    b.items.forEach(it => {
      if ((it.depth || 0) > 0) { notes++; return; }
      items++;
      if (first.length < 3) {
        const blk = it.blockId && blockOf ? blockOf(it.blockId) : null;
        const words = it.feature || (blk ? blk.title : it.text) || "";
        if (words.trim()) first.push(words.trim());
      }
    });
  });
  return { sections, items, notes, first };
}

const countLine = (s) => [
  s.sections + (s.sections === 1 ? " section" : " sections"),
  s.items + (s.items === 1 ? " item" : " items"),
  s.notes ? s.notes + (s.notes === 1 ? " note" : " notes") : "",
].filter(Boolean).join(" · ");

const row = { display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: "1px solid " + TOKENS.LINE.soft, flexWrap: "wrap" };
const btn = (strong) => ({
  minHeight: 36, padding: "0 14px", borderRadius: 9, cursor: "pointer", fontFamily: F, fontSize: 14, fontWeight: 600,
  border: strong ? "none" : "1px solid " + TOKENS.LINE.strong,
  background: strong ? "var(--dash-accent)" : "#fff", color: strong ? "#fff" : TOKENS.TEXT.primary,
});
const small = { fontSize: 13, color: TOKENS.TEXT.muted, lineHeight: 1.45 };

export function TemplatesPanel({ templates, plan, blockOf, onSave, onApply, onDelete }) {
  const [name, setName] = useState("");
  const here = planSummary(plan, blockOf);
  const save = () => { if (name.trim() && here.sections) { onSave(name.trim()); setName(""); } };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: F }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Template name"
          onKeyDown={e => { if (e.key === "Enter") save(); }}
          style={{ flex: "1 1 220px", minHeight: 40, padding: "0 12px", borderRadius: 10, border: "1px solid " + TOKENS.LINE.strong,
            fontFamily: F, fontSize: 16, color: TOKENS.TEXT.primary }} />
        <button style={btn(true)} disabled={!name.trim() || !here.sections} onClick={save}>Save day as template</button>
      </div>
      <div style={small}>{here.sections ? "This day: " + countLine(here) : "This day is empty, so there is nothing to save yet."}</div>

      <div>
        {(templates || []).length ? templates.map(t => {
          const s = planSummary({ slots: Object.fromEntries((t.sections || []).map((x, i) => [i, x])) }, blockOf);
          return (
            <div key={t.id} style={row}>
              <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: TOKENS.TEXT.primary }}>{t.name}</div>
                <div style={small}>{countLine(s)}{t.from ? " · from " + t.from : ""}</div>
                <div style={{ ...small, marginTop: 2 }}>{(t.sections || []).map(x => x.title).filter(Boolean).join(" · ")}</div>
              </div>
              <button style={btn(true)} onClick={() => onApply(t)}>Apply</button>
              <button style={btn(false)} onClick={() => onDelete(t)}>Delete</button>
            </div>
          );
        }) : <div style={small}>No templates yet.</div>}
      </div>
    </div>
  );
}

// "comm118-f26-v1-bak-2026-09-14" is the store's backup from the start of that
// day; "comm118-f26-v1-bak-before-spring-move" is one taken before a change.
const backupLabel = (key, storageKey) => {
  const tail = key.slice((storageKey + "-bak-").length);
  const m = tail.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return "Start of " + d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return "Backup: " + tail.replace(/-/g, " ");
};

export function HistoryPanel({ storageKey, day, plan, local, blockOf, onRestore }) {
  const [backups, setBackups] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const listed = await window.storage.list(storageKey + "-bak-", true);
        const keys = (listed?.keys || []).sort().reverse();
        const found = [];
        for (const k of keys) {
          const got = await window.storage.get(k, true);
          const data = got ? JSON.parse(got.value) : null;
          const p = data?.dayPlans?.[day];
          if (p) found.push({ key: k, label: backupLabel(k, storageKey), plan: p });
        }
        if (alive) setBackups(found);
      } catch {
        if (alive) setBackups([]);
      }
    })();
    return () => { alive = false; };
  }, [storageKey, day]);

  const now = JSON.stringify(plan || {});
  const versions = [
    ...(local || []).slice().reverse().map(v => ({
      key: "local-" + v.at, plan: v.plan,
      label: "Earlier today, " + new Date(v.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    })),
    ...(backups || []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", fontFamily: F }}>
      <div style={{ ...small, paddingBottom: 10 }}>This day now: {countLine(planSummary(plan, blockOf))}</div>
      {versions.map(v => {
        const s = planSummary(v.plan, blockOf);
        const same = JSON.stringify(v.plan || {}) === now;
        return (
          <div key={v.key} style={row}>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: TOKENS.TEXT.primary }}>{v.label}</div>
              <div style={small}>{countLine(s)}{same ? " · same as now" : ""}</div>
              {s.first.length ? <div style={{ ...small, marginTop: 2 }}>{s.first.join(" · ")}</div> : null}
            </div>
            <button style={btn(false)} disabled={same} onClick={() => onRestore(v.plan)}>Restore</button>
          </div>
        );
      })}
      {backups === null ? <div style={{ ...small, padding: "11px 0", fontFamily: MONO }}>Reading backups…</div> : null}
      {backups !== null && !versions.length ? <div style={{ ...small, padding: "11px 0" }}>No earlier versions of this day.</div> : null}
    </div>
  );
}
