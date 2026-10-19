// Turn comm3-summary.json into the numbers the mockups draw: timing against due, grade mix, per-student rows.
import { readFileSync, writeFileSync } from "node:fs";
const S = JSON.parse(readFileSync(new URL("./comm3-summary.json", import.meta.url), "utf8"));
const YEAR = 2026;
const dueTs = (due) => { const d = new Date(`${due} ${YEAR} 23:59:59 GMT-0700`); return Number.isFinite(d.getTime()) ? d.getTime() : null; };
const hrs = (ms) => ms / 36e5;
const graded = S.assignments.filter(a => a.submitted > 0 || Object.keys(a.buckets).length);
const perStudent = Object.fromEntries(S.students.map(s => [s.name, { name: s.name, section: s.section, subs: [], grades: [], msgs: 0, late: 0, onTime: 0, hoursBefore: [] }]));
const out = { assignments: [], students: [] };
for (const a of graded) {
  const due = dueTs(a.due);
  const timing = a.subs.map(s => ({ name: s.name, hoursBeforeDue: due ? +hrs(due - s.at).toFixed(1) : null, at: s.at, hour: new Date(s.at).getUTCHours() - 7 }));
  const late = timing.filter(t => t.hoursBeforeDue != null && t.hoursBeforeDue < 0).length;
  const lastDay = timing.filter(t => t.hoursBeforeDue != null && t.hoursBeforeDue >= 0 && t.hoursBeforeDue <= 24).length;
  const early = timing.filter(t => t.hoursBeforeDue > 24).length;
  // mode of the grades
  const mode = Object.entries(a.buckets).sort((x, y) => y[1] - x[1])[0];
  // hours of the day (local, Pacific)
  const byHour = Array(24).fill(0);
  timing.forEach(t => { byHour[((t.hour % 24) + 24) % 24]++; });
  // days relative to due: bucket -7..+7
  const byDay = {};
  timing.forEach(t => { if (t.hoursBeforeDue == null) return; const d = -Math.ceil(t.hoursBeforeDue / 24); byDay[d] = (byDay[d] || 0) + 1; });
  // time to grade: release minus due
  out.assignments.push({ id: a.id, title: a.title, due: a.due, scale: a.scale, weight: a.weight, roster: S.students.length,
    submitted: a.submitted, missing: S.students.length - a.submitted, late, lastDay, early, mode: mode ? { bucket: mode[0], n: mode[1] } : null,
    buckets: a.buckets, released: a.released, comments: a.comments, studentMsgs: a.studentMsgs, regrades: a.regrades,
    byHour, byDay, timing: timing.map(t => ({ n: t.name, h: t.hoursBeforeDue })) });
  for (const t of timing) { const p = perStudent[t.name]; if (!p) continue; p.subs.push(a.id); if (t.hoursBeforeDue != null) { p.hoursBefore.push(t.hoursBeforeDue); t.hoursBeforeDue < 0 ? p.late++ : p.onTime++; } }
  for (const [n, b] of Object.entries(a.cards)) { if (perStudent[n] && b) perStudent[n].grades.push({ aid: a.id, bucket: b }); }
}
for (const [n, t] of Object.entries(S.threads)) { if (perStudent[n]) perStudent[n].msgs = t.filter(m => m.from === "student").length; }
out.students = Object.values(perStudent).map(p => {
  const completes = p.grades.filter(g => /^complete|revisions/.test(g.bucket)).length;
  const median = p.hoursBefore.length ? p.hoursBefore.slice().sort((a, b) => a - b)[Math.floor(p.hoursBefore.length / 2)] : null;
  return { ...p, done: p.subs.length, of: graded.length, completes, medianHoursBefore: median };
});
const dist = (k) => { const m = {}; out.students.forEach(s => { m[s[k]] = (m[s[k]] || 0) + 1; }); return m; };
console.log("graded assignments", graded.map(a => a.id));
console.log("done-of-3 distribution", dist("done"));
console.log("late count distribution", dist("late"));
console.log("msgs distribution", dist("msgs"));
out.assignments.forEach(a => console.log(a.id, "submitted", a.submitted, "late", a.late, "lastDay", a.lastDay, "early", a.early, "mode", a.mode, "byDay", JSON.stringify(a.byDay)));
console.log("students with 0 subs:", out.students.filter(s => s.done === 0).map(s => s.name));
console.log("students with all 3 and no late:", out.students.filter(s => s.done === 3 && s.late === 0).length);
writeFileSync(new URL("./comm3-stats.json", import.meta.url), JSON.stringify(out));

// the compact embed for the mockup page: real students only, one row each
const TEST = new Set(["Pepe LeFritz", "Jan Itor", "Marty McFly"]);
const embed = {
  cls: { code: "COMM 3", name: "Digital Storytelling", accent: "#7c3aed", roster: S.students.filter(s => !TEST.has(s.name)).length, today: "2026-10-18" },
  assignments: out.assignments.map(a => ({ id: a.id, title: a.title, due: a.due, scale: a.scale, weight: a.weight, submitted: a.submitted, late: a.late, lastDay: a.lastDay, early: a.early,
    buckets: a.buckets, released: a.released, comments: a.comments, studentMsgs: a.studentMsgs, regrades: a.regrades, byDay: a.byDay, timing: a.timing.filter(t => !TEST.has(t.n)) })),
  upcoming: S.assignments.filter(a => !out.assignments.some(g => g.id === a.id)).map(a => ({ id: a.id, title: a.title, due: a.due, scale: a.scale, weight: a.weight })),
  students: out.students.filter(s => !TEST.has(s.name)).map(s => {
    const e = S.engagement[s.name] || {};
    const first = (n) => n.split(" ")[0];
    return { n: s.name, f: first(s.name), sec: s.section, done: s.done, late: s.late, med: s.medianHoursBefore, msgs: s.msgs, cmts: e.comments || 0, rg: e.regrades || 0, prof: e.profileFields || 0, photo: !!e.photo, ck: !!e.checkin, seen: e.gradesSeen || 0,
      g: Object.fromEntries(s.grades.map(g => [g.aid, g.bucket])), h: Object.fromEntries(out.assignments.flatMap(a => a.timing.filter(t => t.n === s.name).map(t => [a.id, t.h]))) };
  }),
};
writeFileSync(new URL("./comm3-embed.json", import.meta.url), JSON.stringify(embed));
console.log("embed bytes", JSON.stringify(embed).length, "students", embed.students.length);

// thread timestamps per student, and absolute submit times, for the one-student timeline
for (const st of embed.students) {
  st.t = (S.threads[st.n] || []).map(m => ({ f: m.from === "student" ? "s" : "i", ts: m.ts }));
  st.at = {};
  for (const a of S.assignments) { const sub = a.subs.find(x => x.name === st.n); if (sub) st.at[a.id] = sub.at; }
}
embed.released = Object.fromEntries(S.assignments.filter(a => a.released).map(a => [a.id, a.released]));
writeFileSync(new URL("./comm3-embed.json", import.meta.url), JSON.stringify(embed));
console.log("embed2 bytes", JSON.stringify(embed).length);
