// The Roster card.
// Student view: classmates (avatar, name, and the social bits they shared).
// Instructor view (private): searchable roster -> a full student page with their
// profile, goals, what matters to them, email, their message thread, and a
// placeholder for grades/assignments (filled in once the gradebook exists).

import { useState } from "react";
import { computeGrade } from "./AssignmentsCard.jsx";

const F = "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
const TEXT_PRIMARY = "#111827";
const TEXT_SECONDARY = "#4b5563";
const TEXT_MUTED = "#646b75"; // 4.85:1 at worst, on every background we use. #9ca3af was 2.54:1 and failed AA.
const BORDER = "#eef0f2";
const BORDER_STRONG = "#e5e7eb";
const BG = "#fafaf9";
const TAP = 44;

const label = { fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.08em" };
const h2 = { fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em" };
const Muted = ({ children, style }) => <div style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, ...style }}>{children}</div>;

const profileOf = (data, name) => (data?.profiles?.[name] || {});
const threadOf = (data, name) => (data?.threads?.[name] || []);

function Avatar({ profile, name, accent, size = 44 }) {
  const photo = profile?.avatar && String(profile.avatar).startsWith("data:") ? profile.avatar : null;
  const initials = (name || "").split(" ").map(p => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: accent + "22", border: "2px solid " + accent + "55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: accent }}>
      {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </div>
  );
}

// One labeled read-only field; renders nothing if empty.
function Field({ title, value }) {
  if (!value) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={label}>{title}</div>
      <div style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.5, marginTop: 4, whiteSpace: "pre-wrap" }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export function RosterSummary({ config, data }) {
  const students = config.students || [];
  const shown = students.slice(0, 5);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex" }}>
        {shown.map((s, i) => (
          <div key={s.name} style={{ marginLeft: i === 0 ? 0 : -10 }}>
            <Avatar profile={profileOf(data, s.name)} name={s.name} accent={config.accent} size={32} />
          </div>
        ))}
      </div>
      <div style={{ fontWeight: 600 }}>{students.length} students</div>
    </div>
  );
}

export function RosterDetail({ config, role, data }) {
  if (role === "instructor") return <InstructorRoster config={config} data={data} />;
  return <StudentRoster config={config} data={data} />;
}

// ─── instructor: list + full student page ───
function InstructorRoster({ config, data }) {
  const a = config.accent;
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const students = config.students || [];

  if (selected) return <StudentPage config={config} data={data} name={selected} onBack={() => setSelected(null)} />;

  const lc = q.toLowerCase();
  const results = students.filter(s => s.name.toLowerCase().includes(lc));

  return (
    <div>
      <div style={{ ...h2, marginBottom: 6 }}>Roster</div>
      <Muted style={{ marginBottom: 12 }}>Private to you.</Muted>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search students"
        style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid " + BORDER_STRONG, fontFamily: F, fontSize: 16, minHeight: TAP, marginBottom: 12 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {results.map(s => {
          const p = profileOf(data, s.name);
          const sub = [p.year, p.hometown || s.from].filter(Boolean).join(" · ");
          return (
            <button key={s.name} onClick={() => setSelected(s.name)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "#fff", border: "1px solid " + BORDER, borderRadius: 14, padding: 12, cursor: "pointer", fontFamily: F, minHeight: TAP }}>
              <Avatar profile={p} name={s.name} accent={a} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{s.name}</div>
                {sub && <div style={{ fontSize: 15, color: TEXT_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StudentPage({ config, data, name, onBack }) {
  const a = config.accent;
  const p = profileOf(data, name);
  const msgs = threadOf(data, name);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, color: a, cursor: "pointer", minHeight: TAP, padding: "0 4px 0 0" }}>← Roster</button>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 4 }}>
        <Avatar profile={p} name={name} accent={a} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 15, color: TEXT_MUTED }}>{[p.year, p.hometown].filter(Boolean).join(" · ") || "Profile not filled in yet"}</div>

          <Field title="About me" value={p.about} />
          <Field title="Motto" value={p.motto} />
          <Field title="Goals for the class" value={p.goals} />
          <Field title="What matters most" value={p.priority} />
          <Field title="Email" value={p.email} />

          {(() => {
            const { pct, rows } = computeGrade(config, data, name);
            return (
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid " + BORDER }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <div style={label}>Grades & assignments</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: a }}>{pct != null ? pct + "%" : "--"}</div>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {rows.map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 15 }}>
                      <span style={{ color: TEXT_PRIMARY, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title} <span style={{ color: TEXT_MUTED, fontSize: 13 }}>· {r.weight}%</span></span>
                      <span style={{ flexShrink: 0, fontWeight: 600, color: r.score != null ? TEXT_PRIMARY : TEXT_MUTED }}>{r.score != null ? r.score + "/100" : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid " + BORDER }}>
            <div style={label}>Messages</div>
            {msgs.length === 0 ? <Muted style={{ marginTop: 6 }}>No messages yet.</Muted> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {msgs.map(m => {
                  if (m.kind === "got_it" || m.kind === "confused" || m.kind === "meeting") {
                    const t = m.kind === "got_it" ? "Got it" : m.kind === "confused" ? "I'm confused" : "Requested a meeting";
                    return <div key={m.id} style={{ fontSize: 15, color: TEXT_MUTED }}>• {t}</div>;
                  }
                  return (
                    <div key={m.id} style={{ fontSize: 15, color: TEXT_PRIMARY }}>
                      <span style={{ fontWeight: 700, color: m.from === "instructor" ? a : TEXT_SECONDARY }}>{m.from === "instructor" ? "You" : name.split(" ")[0]}{m.kind === "question" ? " (Q)" : ""}: </span>
                      {m.text}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── student: classmates grid ───
function StudentRoster({ config, data }) {
  const a = config.accent;
  const [open, setOpen] = useState(null);
  const students = config.students || [];

  if (open) {
    const p = profileOf(data, open);
    return (
      <div>
        <button onClick={() => setOpen(null)} style={{ background: "none", border: "none", fontFamily: F, fontSize: 15, fontWeight: 600, color: a, cursor: "pointer", minHeight: TAP, padding: "0 4px 0 0" }}>← Roster</button>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 4 }}>
          <Avatar profile={p} name={open} accent={a} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{open}</div>
            <div style={{ fontSize: 15, color: TEXT_MUTED }}>{[p.year, p.hometown].filter(Boolean).join(" · ")}</div>
            <Field title="About me" value={p.about} />
            <Field title="Motto" value={p.motto} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...h2, marginBottom: 16 }}>Roster</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {students.map(s => {
          const p = profileOf(data, s.name);
          return (
            <button key={s.name} onClick={() => setOpen(s.name)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "#fff", border: "1px solid " + BORDER, borderRadius: 14, padding: 14, cursor: "pointer", fontFamily: F, minHeight: TAP }}>
              <Avatar profile={p} name={s.name} accent={a} size={56} />
              <div style={{ fontWeight: 600, fontSize: 15, textAlign: "center" }}>{s.name}</div>
              {p.hometown && <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: "center" }}>{p.hometown}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
