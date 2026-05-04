// ─── SHARED COMPONENTS MODULE ─────────────────────────────────────────
// Reusable React components shared across all three classes.
// Class-specific behavior is passed in as props (storage key for theme,
// saveData function for persistence, etc.) so the same component renders
// correctly inside each class's data shape.

import React, { useState } from "react";
import {
  F, BORDER, AMBER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  pill, pillActive, pillInactive, inp, sectionLabel,
  ADMIN_NAME, TEST_STUDENT,
  useTheme, themedInteriorCrd, themedHeadingFont,
} from "./styles.jsx";
import { genId, Toast } from "./utils.jsx";

// ─── MyNotesView ──────────────────────────────────────────────────────
// Per-student private notes. Admin sees all students. Students see only
// their own. Identical across all three classes; differs only in storage
// key (for theme persistence) and the saveData function (each class has
// its own Supabase shim).
//
// Props:
//   data: the class data object
//   setData: state setter for data
//   isAdmin: boolean
//   userName: current user's display name
//   storageKey: e.g. "comm118-game-v14" (used for theme key)
//   saveData: async (newData) => void — class-specific persistence
export function MyNotesView({ data, setData, isAdmin, userName, storageKey, saveData }) {
  const { theme } = useTheme(storageKey);
  const crd = themedInteriorCrd(theme, 0);
  const studentNotes = data.studentNotes || {};
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const saveNote = async (studentName, text) => {
    const existing = studentNotes[studentName] || { entries: [] };
    const newEntry = { id: genId(), text: text.trim(), ts: Date.now() };
    const updated = { ...data, studentNotes: { ...studentNotes, [studentName]: { ...existing, entries: [newEntry, ...existing.entries] } } };
    await saveData(updated); setData(updated);
    setEditing(false); setEditText(""); showMsg("Note saved");
  };

  const deleteNote = async (studentName, noteId) => {
    const existing = studentNotes[studentName] || { entries: [] };
    const updated = { ...data, studentNotes: { ...studentNotes, [studentName]: { ...existing, entries: existing.entries.filter(e => e.id !== noteId) } } };
    await saveData(updated); setData(updated); showMsg("Deleted");
  };

  // Admin: view all students' notes inline, sorted by last edited, all students shown
  if (isAdmin) {
    const allStudents = [...data.students]
      .filter(s => s.name !== ADMIN_NAME && s.name !== TEST_STUDENT)
      .map(s => {
        const notes = studentNotes[s.name];
        const entries = (notes && notes.entries) || [];
        const lastTs = entries.length > 0 ? Math.max(...entries.map(e => e.ts || 0)) : 0;
        return { student: s, entries, lastTs };
      })
      .sort((a, b) => {
        if (a.lastTs === 0 && b.lastTs === 0) return a.student.name.localeCompare(b.student.name);
        if (a.lastTs === 0) return 1;
        if (b.lastTs === 0) return -1;
        return b.lastTs - a.lastTs;
      });

    return (
      <div style={{ padding: "0 0 20px", fontFamily: F }}>
        <Toast message={msg} />
        {allStudents.map(({ student: s, entries, lastTs }) => (
          <div key={s.id} style={{ ...crd, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: entries.length > 0 ? 10 : 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: TEXT_PRIMARY }}>{s.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {lastTs > 0 && <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>Last edited {new Date(lastTs).toLocaleDateString()}</span>}
                <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 600 }}>{entries.length} note{entries.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {entries.length === 0 ? (
              <div style={{ fontSize: 12, color: TEXT_MUTED, fontStyle: "italic" }}>No notes yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.map(entry => (
                  <div key={entry.id} style={{ padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid " + BORDER }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: TEXT_SECONDARY, fontWeight: 600 }}>{new Date(entry.ts).toLocaleDateString()}</span>
                      <button onClick={() => { if (window.confirm("Delete this note?")) deleteNote(s.name, entry.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 12 }}>x</button>
                    </div>
                    <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Student view: their own notes
  const myNotes = studentNotes[userName] || { entries: [] };

  return (
    <div style={{ fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => { setEditing(!editing); setEditText(""); }} style={editing ? pillActive : pillInactive}>{editing ? "Cancel" : "+ New Note"}</button>
      </div>

      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>Your notes are private, visible only to you and your instructor.</div>

      {editing && (
        <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
          <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="Write a note..." rows={4} style={{ ...inp, resize: "vertical", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }} />
          <button onClick={() => { if (editText.trim()) saveNote(userName, editText); }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", width: "100%" }}>Save Note</button>
        </div>
      )}

      {myNotes.entries.length === 0 && !editing && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No notes yet. Click "+ New Note" to start.</div>}

      {myNotes.entries.map(entry => (
        <div key={entry.id} style={{ ...crd, padding: 14, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>{new Date(entry.ts).toLocaleDateString()}</span>
            <button onClick={() => { if (window.confirm("Delete this note?")) deleteNote(userName, entry.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUTED, fontSize: 12 }}>x</button>
          </div>
          <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.text}</div>
        </div>
      ))}
    </div>
  );
}

// ─── BioView (Comm 118 + Comm 4) ──────────────────────────────────────
// Per-student profile: photo, bio fields, edit form for own profile.
// Comm 2 has its own simpler version; this is for the team-based classes.
//
// Props:
//   student: the student record being viewed
//   data: full class data
//   setData: state setter
//   userName: current user's display name
//   onBack: optional callback for "Back to Roster" button
//   storageKey: e.g. "comm118-game-v14" — for theme
//   saveData: async (newData) => void — class-specific persistence
//   uploadPhoto: async (file, studentId) => string — class-specific upload
//   bioFields: array of { key, label, type, placeholder } for the edit form
//   teamColors: array of { accent, bg } indexed by team.colorIdx
//   favTeamLabel: display label for the bio.favTeam field on the read-only
//     view (Comm 118: "Fav Team", Comm 4: "Research Motto")
export function BioView({
  student, data, setData, userName, onBack,
  storageKey, saveData, uploadPhoto,
  bioFields, teamColors,
  favTeamLabel = "Fav Team",
}) {
  const { theme } = useTheme(storageKey);
  const crd = themedInteriorCrd(theme, 0);
  const isOwn = student.name === userName;
  const isAdmin = userName === ADMIN_NAME;
  const canEdit = isOwn || isAdmin;
  const bio = (data.bios || {})[student.id] || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...bio });
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const team = data.teams.find(t => t.id === student.teamId);
  const tc = team ? teamColors[team.colorIdx] : teamColors[0];
  const [editName, setEditName] = useState(student.name);
  const initials = student.name.split(" ").map(n => n[0]).join("");

  const saveBio = async () => {
    let updated = { ...data, bios: { ...(data.bios || {}), [student.id]: form } };
    if (editName.trim() && editName.trim() !== student.name) {
      updated = { ...updated, students: updated.students.map(s => s.id === student.id ? { ...s, name: editName.trim() } : s) };
    }
    await saveData(updated); setData(updated);
    setEditing(false); showMsg("Saved");
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showMsg("Max 2MB"); return; }
    setUploading(true);
    try {
      const url = await uploadPhoto(file, student.id);
      const newForm = { ...form, photo: url };
      setForm(newForm);
      const updated = { ...data, bios: { ...(data.bios || {}), [student.id]: newForm } };
      await saveData(updated); setData(updated);
      showMsg("Photo uploaded");
    } catch (err) { showMsg("Upload failed"); }
    setUploading(false);
  };

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {onBack && <button onClick={onBack} style={pillInactive}>Back to Roster</button>}

        <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: 16, padding: "24px 20px", marginTop: 12, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative" }}>
            {bio.photo ? (
              <img src={bio.photo} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.2)" }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", border: "3px solid rgba(255,255,255,0.2)" }}>{initials}</div>
            )}
            {canEdit && (
              <label style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_SECONDARY} strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
              </label>
            )}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{student.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{team ? team.name : "Unassigned"}</div>
          </div>
        </div>

        {editing ? (
          <div style={{ ...crd, padding: 16, marginTop: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...sectionLabel, marginBottom: 4 }}>Name</div>
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" style={inp} />
            </div>
            {bioFields.map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ ...sectionLabel, marginBottom: 4 }}>{f.label}</div>
                {f.type === "textarea" ? (
                  <textarea value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} rows={3} style={{ ...inp, resize: "vertical" }} />
                ) : (
                  <input value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={inp} />
                )}
              </div>
            ))}
            {isAdmin && (
              <div style={{ marginBottom: 12, padding: "10px 12px", background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: AMBER, textTransform: "uppercase", marginBottom: 4 }}>Admin Only</div>
                <div style={{ ...sectionLabel, marginBottom: 2 }}>Student Email</div>
                <div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{form.email || "Not provided"}</div>
              </div>
            )}
            {(isOwn || isAdmin) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...sectionLabel, marginBottom: 4 }}>Email</div>
                <input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your.email@scu.edu" style={inp} />
                {isOwn && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Only visible to your instructor</div>}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveBio} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1, padding: "10px 0" }}>Save</button>
              <button onClick={() => { setForm({ ...bio }); setEditing(false); }} style={{ ...pillInactive, flex: 1, padding: "10px 0" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ ...crd, padding: 16, marginTop: 12 }}>
            {bio.about || bio.major || bio.year || bio.hometown || bio.favTeam || bio.motto || bio.funFact ? (
              <>
                {bio.about && <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5, marginBottom: 12 }}>{bio.about}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {bio.major && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Major</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.major}</div></div>}
                  {bio.year && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Year</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.year}</div></div>}
                  {bio.hometown && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Hometown</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.hometown}</div></div>}
                  {bio.favTeam && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>{favTeamLabel}</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.favTeam}</div></div>}
                  {bio.motto && <div><div style={{ ...sectionLabel, marginBottom: 2 }}>Motto</div><div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{bio.motto}</div></div>}
                </div>
                {bio.funFact && <div style={{ marginTop: 10 }}><div style={{ ...sectionLabel, marginBottom: 2 }}>Fun Fact</div><div style={{ fontSize: 13, color: "#374151" }}>{bio.funFact}</div></div>}
                {isAdmin && bio.email && <div style={{ marginTop: 10, padding: "6px 10px", background: "#fffbeb", borderRadius: 6, border: "1px solid #fef3c7" }}><div style={{ fontSize: 10, fontWeight: 700, color: AMBER, textTransform: "uppercase", marginBottom: 2 }}>Admin Only</div><div style={{ fontSize: 13, color: TEXT_PRIMARY }}>{bio.email}</div></div>}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: TEXT_MUTED, fontSize: 13 }}>
                {canEdit ? "No bio yet. Click edit to add one." : "This person hasn't filled out their bio yet."}
              </div>
            )}
            {canEdit && <button onClick={() => { setForm({ ...bio }); setEditing(true); }} style={{ ...pillInactive, width: "100%", marginTop: 12, padding: "10px 0" }}>Edit Bio</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RosterView ───────────────────────────────────────────────────────
// Class roster grid. Each student is a tappable card showing photo,
// team color, and a few bio fields. Tapping opens BioView.
//
// All three classes have RosterView, but Comm 2 has no teams (single
// section), so getTeamColor returns a class-accent fallback there.
//
// Props:
//   data, setData, userName: standard
//   storageKey: for theme
//   adminName: name to filter out (admin doesn't appear in roster)
//   testStudent: name to filter out (test/demo account)
//   accent: the class accent color (used in "YOU" badge)
//   getTeamColor: (student) => { accent, bg } — class-specific team color
//     resolution. Comm 118 + Comm 4 use TEAM_COLORS by team.colorIdx.
//     Comm 2 returns a single class-accent color for everyone.
//   lastSortObj: (a, b) => number — class-specific last-name sort that
//     handles roster overrides (multi-word last names)
//   BioComponent: BioView for Comm 118 + Comm 4, the local Comm 2
//     BioView for Comm 2. The roster delegates rendering when a student
//     is selected.
//   bioComponentProps: extra props to forward to BioComponent (bioFields,
//     teamColors, favTeamLabel, saveData, uploadPhoto). Roster doesn't
//     care about their shape, just passes them through.
export function RosterView({
  data, setData, userName,
  storageKey, adminName, testStudent, accent,
  getTeamColor, lastSortObj,
  BioComponent, bioComponentProps = {},
}) {
  const { theme } = useTheme(storageKey);
  const crd = themedInteriorCrd(theme, 0);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const sorted = [...data.students].filter(s => s.name !== adminName && s.name !== testStudent).sort(lastSortObj);
  const q = search.trim().toLowerCase();
  const filtered = q ? sorted.filter(s => s.name.toLowerCase().includes(q)) : sorted;

  if (selectedId) {
    const student = data.students.find(s => s.id === selectedId);
    if (!student) { setSelectedId(null); return null; }
    return <BioComponent student={student} data={data} setData={setData} userName={userName} onBack={() => setSelectedId(null)} storageKey={storageKey} {...bioComponentProps} />;
  }

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 10 }}>Class roster</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classmates" style={{ ...inp, fontSize: 13, padding: "8px 12px", marginBottom: 12, width: "100%", boxSizing: "border-box" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {filtered.length === 0 && <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: "center", padding: 20 }}>No matches.</div>}
          {filtered.map(s => {
            const team = (data.teams || []).find(t => t.id === s.teamId);
            const tc = getTeamColor(s);
            const bio = (data.bios || {})[s.id] || {};
            const initials = s.name.split(" ").map(n => n[0]).join("");
            const hasPhoto = !!bio.photo;
            const isMe = s.name === userName;
            return (
              <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                background: isMe ? accent + "0d" : "#fff", border: "1px solid " + (isMe ? accent + "40" : BORDER),
                borderRadius: 12,
                cursor: "pointer", textAlign: "left", fontFamily: F, width: "100%",
              }}>
                {hasPhoto ? (
                  <img src={bio.photo} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff", flexShrink: 0 }}>{initials}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, display: "flex", alignItems: "center", gap: 6 }}>
                    {s.name}
                    {isMe && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: accent + "1a", color: accent, borderRadius: 4, letterSpacing: "0.06em" }}>YOU</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, flexWrap: "wrap", fontSize: 11 }}>
                    {team && <span style={{ color: tc.accent, fontWeight: 500 }}>{team.name}</span>}
                    {team && (bio.year || bio.hometown) && <span style={{ color: "#d4d4d8" }}>·</span>}
                    {bio.year && <span style={{ color: TEXT_SECONDARY }}>{bio.year}</span>}
                    {bio.year && bio.hometown && <span style={{ color: "#d4d4d8" }}>·</span>}
                    {bio.hometown && <span style={{ color: TEXT_SECONDARY }}>{bio.hometown}</span>}
                  </div>
                  {bio.motto && <div style={{ fontSize: 11, color: TEXT_MUTED, fontStyle: "italic", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bio.motto}</div>}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: TEXT_MUTED }}>{sorted.length} students</div>
      </div>
    </div>
  );
}
