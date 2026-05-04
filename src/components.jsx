// ─── SHARED COMPONENTS MODULE ─────────────────────────────────────────
// Reusable React components shared across all three classes.
// Class-specific behavior is passed in as props (storage key for theme,
// saveData function for persistence, etc.) so the same component renders
// correctly inside each class's data shape.

import React, { useState } from "react";
import {
  F, BG, BORDER, BORDER_STRONG, AMBER, RED, GREEN,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  pill, pillActive, pillInactive, bt, inp, sel, sectionLabel, linkPill,
  ADMIN_NAME, TEST_STUDENT, GUEST_NAME,
  useTheme, themedInteriorCrd, themedHeadingFont, themedPageBg,
  PixelStar, PixelArrow, PixelHeart, PixelMushroom, PixelCoin, PixelLightning,
  THEME_KEYFRAMES_CSS,
} from "./styles.jsx";
import { genId, gp, Toast, parseDueDate, fmtDue } from "./utils.jsx";

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

// ─── ReadingsView (Comm 118 + Comm 4) ─────────────────────────────────
// Repository of class readings, organized by category and tagged
// (recommended/required/fishbowl/additional). Admin can add readings,
// upload PDFs, attach to schedule days.
// Props: data, setData, isAdmin (existing); storageKey (theme);
// saveData (persistence); uploadPdf(file, readingId) (PDF upload)
export function ReadingsView({ data, setData, isAdmin, storageKey, saveData, uploadPdf }) {
  const { theme } = useTheme(storageKey);
  const crd = themedInteriorCrd(theme, 0);
  const readings = data.readings || [];
  const schedule = data.schedule || [];
  const [editId, setEditId] = useState(null);
  const [editLocal, setEditLocal] = useState(null);
  const [newReading, setNewReading] = useState({ title: "", url: "", category: "", notes: "", readingType: "recommended" });
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showRepo, setShowRepo] = useState(false);
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const categories = [...new Set(readings.map(r => r.category).filter(Boolean))].sort();

  const typeColor = (t) => t === "fishbowl" ? "#7c3aed" : t === "required" ? "#b45309" : t === "additional" ? TEXT_MUTED : GREEN;
  const typeLabel = (t) => t === "fishbowl" ? "Fishbowl" : t === "required" ? "Required" : t === "additional" ? "Additional" : "Recommended";
  const typeShort = (t) => t === "fishbowl" ? "Fish" : t === "required" ? "Req" : t === "additional" ? "Add" : "Rec";

  const addReading = async () => {
    if (!newReading.title.trim()) return;
    const r = { id: genId(), title: newReading.title.trim(), url: newReading.url.trim(), category: newReading.category.trim(), notes: newReading.notes.trim(), readingType: newReading.readingType || "recommended" };
    const updated = { ...data, readings: [...readings, r] };
    await saveData(updated); setData(updated);
    setNewReading({ title: "", url: "", category: "", notes: "", readingType: "recommended" });
    showMsg("Added");
  };
  const updateReading = async (id, field, value) => {
    const updated = { ...data, readings: readings.map(r => r.id === id ? { ...r, [field]: value } : r) };
    await saveData(updated); setData(updated);
  };
  const updateScheduleReadingType = async (date, readingId, newType) => {
    const newSchedule = schedule.map(w => ({
      ...w, dates: w.dates.map(d => {
        if (d.date !== date) return d;
        return { ...d, readings: (d.readings || []).map(r => r.readingId === readingId ? { ...r, type: newType } : r) };
      })
    }));
    const updated = { ...data, schedule: newSchedule };
    await saveData(updated); setData(updated);
  };
  const deleteReading = async (id) => {
    const newSchedule = schedule.map(w => ({
      ...w, dates: w.dates.map(d => ({
        ...d, readings: (d.readings || []).filter(r => r.readingId !== id)
      }))
    }));
    const updated = { ...data, readings: readings.filter(r => r.id !== id), schedule: newSchedule };
    await saveData(updated); setData(updated); showMsg("Deleted");
  };
  const handlePdfUpload = async (file, readingId) => {
    if (!file || !readingId) return;
    if (file.size > 10 * 1024 * 1024) { showMsg("Max 10MB"); return; }
    setUploading(true);
    try {
      const pdfUrl = await uploadPdf(file, readingId);
      await updateReading(readingId, "pdfUrl", pdfUrl);
      showMsg("PDF uploaded");
    } catch (err) { showMsg("Upload failed"); }
    setUploading(false);
  };
  const handleNewPdfUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showMsg("Max 10MB"); return; }
    const title = newReading.title.trim() || file.name.replace(/\.pdf$/i, "");
    const id = genId();
    setUploading(true);
    try {
      const pdfUrl = await uploadPdf(file, id);
      const r = { id, title, url: newReading.url.trim(), pdfUrl, category: newReading.category.trim(), notes: newReading.notes.trim(), readingType: newReading.readingType || "recommended" };
      const updated = { ...data, readings: [...readings, r] };
      await saveData(updated); setData(updated);
      setNewReading({ title: "", url: "", category: "", notes: "", readingType: "recommended" });
      showMsg("Added with PDF");
    } catch (err) { showMsg("Upload failed"); }
    setUploading(false);
  };

  const getReadingLink = (r) => r.pdfUrl || r.url;

  const startReadingEdit = (r) => {
    setEditId(r.id);
    setEditLocal({ title: r.title || "", url: r.url || "", category: r.category || "", notes: r.notes || "", readingType: r.readingType || "recommended" });
  };

  const saveReadingEdit = async () => {
    if (!editId || !editLocal) return;
    const updated = { ...data, readings: readings.map(r => r.id === editId ? { ...r, ...editLocal } : r) };
    await saveData(updated); setData(updated);
    setEditId(null); setEditLocal(null); showMsg("Saved");
  };

  const cancelEdit = () => { setEditId(null); setEditLocal(null); };

  // Build week-grouped view from schedule attachments
  const weekReadings = [];
  schedule.forEach(w => {
    const weekItems = [];
    (w.dates || []).forEach(d => {
      (d.readings || []).forEach(dr => {
        const rdg = readings.find(r => r.id === dr.readingId);
        if (rdg) weekItems.push({ ...rdg, type: dr.type, date: d.date, day: d.day });
      });
    });
    if (weekItems.length > 0) {
      weekReadings.push({ week: w.week, label: w.label, theme: w.theme, items: weekItems });
    }
  });

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ ...sectionLabel, marginBottom: 16 }}>Readings and Media</div>

        {/* Admin: add new reading */}
        {isAdmin && (
          <div style={{ ...crd, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 12 }}>Add to Repository</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={newReading.title} onChange={e => setNewReading({ ...newReading, title: e.target.value })} placeholder="Title" style={inp} />
              <input value={newReading.url} onChange={e => setNewReading({ ...newReading, url: e.target.value })} placeholder="URL (optional)" style={inp} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newReading.category} onChange={e => setNewReading({ ...newReading, category: e.target.value })} placeholder="Category" list="cat-list" style={{ ...inp, flex: 1 }} />
                <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                <select value={newReading.readingType} onChange={e => setNewReading({ ...newReading, readingType: e.target.value })} style={{ ...sel, width: 150, fontSize: 14 }}>
                  <option value="fishbowl">Fishbowl</option>
                  <option value="required">Required</option>
                  <option value="recommended">Recommended</option>
                  <option value="additional">Additional</option>
                </select>
              </div>
              <textarea value={newReading.notes} onChange={e => setNewReading({ ...newReading, notes: e.target.value })} placeholder="Notes (optional)" rows={2} style={{ ...inp, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addReading} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "11px 0", flex: 1 }}>Add Reading</button>
                <label style={{ ...pill, background: "#eff6ff", color: "#2563eb", padding: "11px 16px", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                  {uploading ? "Uploading..." : "Add with PDF"}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handleNewPdfUpload(e.target.files[0]); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Week-by-week readings */}
        {weekReadings.length === 0 && <div style={{ ...crd, padding: 24, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No readings added yet.</div>}
        {weekReadings.map(w => {
          const fishbowl = w.items.filter(i => i.type === "fishbowl");
          const required = w.items.filter(i => i.type === "required");
          const recommended = w.items.filter(i => i.type === "recommended");
          const additional = w.items.filter(i => i.type === "additional" || i.type === "highly_recommended");

          const renderItem = (item, i, sectionType) => {
            const link = getReadingLink(item);
            const isEdit = editId === item.id;
            const isFish = sectionType === "fishbowl";
            const isReq = sectionType === "required";
            return (
              <div key={item.id + "-" + i} style={{ padding: "10px 12px", borderTop: i > 0 ? "1px solid " + BORDER : "none", background: isReq ? "#fffbeb" : "transparent", borderRadius: isReq && i === 0 ? "8px 8px 0 0" : isReq ? 0 : 0, marginLeft: -12, marginRight: -12, paddingLeft: 12, paddingRight: 12 }}>
                {isAdmin && isEdit && editLocal ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <input value={editLocal.title} onChange={e => setEditLocal({ ...editLocal, title: e.target.value })} style={{ ...inp, fontSize: 14, padding: "6px 10px" }} />
                    <input value={editLocal.url} onChange={e => setEditLocal({ ...editLocal, url: e.target.value })} placeholder="URL" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <select value={item.type} onChange={e => updateScheduleReadingType(item.date, item.id, e.target.value)} style={{ ...sel, fontSize: 13, padding: "6px 10px" }}>
                        <option value="fishbowl">Fishbowl</option>
                        <option value="required">Required</option>
                        <option value="recommended">Recommended</option>
                        <option value="additional">Additional</option>
                      </select>
                      <select value={editLocal.readingType} onChange={e => setEditLocal({ ...editLocal, readingType: e.target.value })} style={{ ...sel, fontSize: 13, padding: "6px 10px" }}>
                        <option value="fishbowl">Repo: Fishbowl</option>
                        <option value="required">Repo: Required</option>
                        <option value="recommended">Repo: Recommended</option>
                        <option value="additional">Repo: Additional</option>
                      </select>
                    </div>
                    <textarea value={editLocal.notes} onChange={e => setEditLocal({ ...editLocal, notes: e.target.value })} placeholder="Notes" rows={2} style={{ ...inp, fontSize: 13, padding: "6px 10px", resize: "vertical" }} />
                    {!item.pdfUrl && (
                      <label style={{ ...pillInactive, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 0", cursor: "pointer", fontSize: 12 }}>
                        {uploading ? "Uploading..." : "Upload PDF"}
                        <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handlePdfUpload(e.target.files[0], item.id); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
                      </label>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveReadingEdit} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Done</button>
                      <button onClick={() => { if (window.confirm("Delete?")) { deleteReading(item.id); cancelEdit(); } }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: isAdmin ? "pointer" : "default" }} onClick={() => isAdmin && startReadingEdit(item)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 15, color: "#2563eb", textDecoration: "none", fontWeight: 500, lineHeight: 1.4, display: "block" }}>{isFish ? "\uD83D\uDC1F " : ""}{item.title}</a>
                      ) : (
                        <span style={{ fontSize: 15, color: TEXT_PRIMARY, fontWeight: 500, lineHeight: 1.4, display: "block" }}>{isFish ? "\uD83D\uDC1F " : ""}{item.title}</span>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {item.category && <span style={{ fontSize: 12, color: TEXT_MUTED }}>{item.category}</span>}
                        {item.pdfUrl && <span style={{ fontSize: 10, fontWeight: 700, color: RED, background: "#fef2f2", padding: "1px 5px", borderRadius: 4 }}>PDF</span>}
                        {item.day && item.date && <span style={{ fontSize: 12, color: TEXT_MUTED }}>{item.day} {item.date}</span>}
                      </div>
                      {item.notes && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 3, lineHeight: 1.4 }}>{item.notes}</div>}
                    </div>
                    {isAdmin && <span style={{ fontSize: 12, color: TEXT_MUTED, flexShrink: 0, marginTop: 2 }}>Edit</span>}
                  </div>
                )}
              </div>
            );
          };

          return (
            <div key={w.week} style={{ ...crd, padding: 18, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>{w.week}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.2 }}>{w.label}</div>
                  {w.theme && <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 1 }}>{w.theme}</div>}
                </div>
              </div>

              {fishbowl.length > 0 && (
                <div style={{ marginBottom: (required.length > 0 || recommended.length > 0 || additional.length > 0) ? 16 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Fishbowl</div>
                  {fishbowl.map((item, i) => renderItem(item, i, "fishbowl"))}
                </div>
              )}

              {required.length > 0 && (
                <div style={{ marginBottom: (recommended.length > 0 || additional.length > 0) ? 16 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Required</div>
                  {required.map((item, i) => renderItem(item, i, "required"))}
                </div>
              )}

              {recommended.length > 0 && (
                <div style={{ marginBottom: additional.length > 0 ? 16 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Recommended</div>
                  {recommended.map((item, i) => renderItem(item, i, "recommended"))}
                </div>
              )}

              {additional.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Additional</div>
                  {additional.map((item, i) => renderItem(item, i, "additional"))}
                </div>
              )}
            </div>
          );
        })}

        {/* Full repository toggle (admin only) */}
        {isAdmin && readings.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <button onClick={() => setShowRepo(!showRepo)} style={{ ...pillInactive, width: "100%", padding: "10px 0", fontSize: 13 }}>
              {showRepo ? "Hide" : "Show"} Full Repository ({readings.length} items)
            </button>
            {showRepo && (
              <div style={{ marginTop: 12 }}>
                {(categories.length > 0 ? categories : [""]).map(cat => {
                  const catReadings = readings.filter(r => (r.category || "") === cat);
                  if (catReadings.length === 0) return null;
                  return (
                    <div key={cat || "__none"} style={{ marginBottom: 16 }}>
                      {cat && <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{cat}</div>}
                      {catReadings.map(r => {
                        const isEdit = editId === r.id;
                        // Find which dates this reading is attached to
                        const attachedDates = [];
                        schedule.forEach(w => {
                          (w.dates || []).forEach(d => {
                            (d.readings || []).forEach(dr => {
                              if (dr.readingId === r.id) attachedDates.push({ week: w.week, date: d.date, day: d.day, type: dr.type });
                            });
                          });
                        });
                        // Build all available dates for attaching
                        const allDates = [];
                        schedule.forEach(w => {
                          (w.dates || []).forEach(d => {
                            if (!d.holiday) allDates.push({ week: w.week, label: w.label, date: d.date, day: d.day });
                          });
                        });

                        return (
                          <div key={r.id} style={{ ...crd, padding: 12, marginBottom: 4 }}>
                            {isEdit && editLocal ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <input value={editLocal.title} onChange={e => setEditLocal({ ...editLocal, title: e.target.value })} style={{ ...inp, fontSize: 14, padding: "6px 10px" }} />
                                <input value={editLocal.url} onChange={e => setEditLocal({ ...editLocal, url: e.target.value })} placeholder="URL" style={{ ...inp, fontSize: 13, padding: "6px 10px" }} />
                                <div style={{ display: "flex", gap: 6 }}>
                                  <input value={editLocal.category} onChange={e => setEditLocal({ ...editLocal, category: e.target.value })} placeholder="Category" list="cat-list" style={{ ...inp, fontSize: 13, padding: "6px 10px", flex: 1 }} />
                                  <select value={editLocal.readingType} onChange={e => setEditLocal({ ...editLocal, readingType: e.target.value })} style={{ ...sel, fontSize: 13, padding: "6px 10px" }}>
                                    <option value="fishbowl">Fishbowl</option>
                                    <option value="required">Required</option>
                                    <option value="recommended">Recommended</option>
                                    <option value="additional">Additional</option>
                                  </select>
                                </div>
                                <textarea value={editLocal.notes} onChange={e => setEditLocal({ ...editLocal, notes: e.target.value })} placeholder="Notes" rows={2} style={{ ...inp, fontSize: 13, padding: "6px 10px", resize: "vertical" }} />
                                {/* Attached dates */}
                                {attachedDates.length > 0 && (
                                  <div style={{ padding: "8px 10px", background: "#f4f4f5", borderRadius: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 4 }}>Attached to</div>
                                    {attachedDates.map((ad, adi) => (
                                      <div key={adi} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "3px 0" }}>
                                        <span style={{ color: TEXT_PRIMARY }}>Week {ad.week} / {ad.day} {ad.date}</span>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: typeColor(ad.type) }}>{typeShort(ad.type)}</span>
                                        <button onClick={async () => {
                                          const newSchedule = schedule.map(w => ({
                                            ...w, dates: w.dates.map(d => d.date === ad.date ? { ...d, readings: (d.readings || []).filter(dr => dr.readingId !== r.id) } : d)
                                          }));
                                          const updated = { ...data, schedule: newSchedule };
                                          await saveData(updated); setData(updated);
                                        }} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 11, fontWeight: 600 }}>Remove</button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Attach to date */}
                                <div style={{ display: "flex", gap: 6 }}>
                                  <select id={"attach-date-" + r.id} style={{ ...sel, flex: 1, fontSize: 13, padding: "6px 10px" }}>
                                    <option value="">Attach to date...</option>
                                    {allDates.filter(ad => !attachedDates.some(x => x.date === ad.date)).map(ad => (
                                      <option key={ad.date} value={ad.date}>Wk {ad.week} {ad.day} {ad.date}</option>
                                    ))}
                                  </select>
                                  <select id={"attach-type-" + r.id} style={{ ...sel, fontSize: 13, padding: "6px 10px", width: 130 }}>
                                    <option value="fishbowl">Fishbowl</option>
                                    <option value="required">Required</option>
                                    <option value="recommended">Recommended</option>
                                    <option value="additional">Additional</option>
                                  </select>
                                  <button onClick={async () => {
                                    const dateEl = document.getElementById("attach-date-" + r.id);
                                    const typeEl = document.getElementById("attach-type-" + r.id);
                                    if (!dateEl?.value) return;
                                    const newSchedule = schedule.map(w => ({
                                      ...w, dates: w.dates.map(d => {
                                        if (d.date !== dateEl.value) return d;
                                        const existing = d.readings || [];
                                        if (existing.some(dr => dr.readingId === r.id)) return d;
                                        return { ...d, readings: [...existing, { readingId: r.id, type: typeEl.value }] };
                                      })
                                    }));
                                    const updated = { ...data, schedule: newSchedule };
                                    await saveData(updated); setData(updated);
                                    dateEl.value = "";
                                  }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", fontSize: 12 }}>Attach</button>
                                </div>
                                {!r.pdfUrl && (
                                  <label style={{ ...pillInactive, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 0", cursor: "pointer", fontSize: 12 }}>
                                    {uploading ? "Uploading..." : "Upload PDF"}
                                    <input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) handlePdfUpload(e.target.files[0], r.id); e.target.value = ""; }} style={{ display: "none" }} disabled={uploading} />
                                  </label>
                                )}
                                {r.pdfUrl && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "#f0fdf4", borderRadius: 6 }}>
                                    <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, flex: 1 }}>PDF attached</span>
                                    <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#2563eb" }}>View</a>
                                    <button onClick={() => updateReading(r.id, "pdfUrl", "")} style={{ background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 11, fontWeight: 600 }}>Remove</button>
                                  </div>
                                )}
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button onClick={saveReadingEdit} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Done</button>
                                  <button onClick={() => { if (window.confirm("Delete this reading?")) { deleteReading(r.id); cancelEdit(); } }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => startReadingEdit(r)}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: typeColor(r.readingType), textTransform: "uppercase", width: 36, flexShrink: 0 }}>{typeShort(r.readingType)}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {(r.pdfUrl || r.url) ? (
                                      <a href={r.pdfUrl || r.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 14, color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>{r.title}</a>
                                    ) : (
                                      <span style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY }}>{r.title}</span>
                                    )}
                                    {r.pdfUrl && <span style={{ fontSize: 9, fontWeight: 700, color: RED, background: "#fef2f2", padding: "1px 5px", borderRadius: 4 }}>PDF</span>}
                                  </div>
                                  {r.notes && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{r.notes}</div>}
                                  {attachedDates.length > 0 && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Wk {attachedDates.map(a => a.week).filter((v,i,a) => a.indexOf(v) === i).join(", ")}</div>}
                                </div>
                                <span style={{ fontSize: 12, color: TEXT_MUTED, flexShrink: 0 }}>Edit</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MY NOTES ─── */


// ─── BoardsView (all three classes) ───────────────────────────────────
// Discussion boards. Admin creates a prompt, students respond, can snap
// (clap) for each other's posts. Admin can feature posts (+5 points).
// Props: data, setData, isAdmin, userName (existing); storageKey (theme);
// saveData (persistence); accent (class accent color for 'you' highlight)
export function BoardsView({ data, setData, isAdmin, userName, storageKey, saveData, accent }) {
  const { theme } = useTheme(storageKey);
  const crd = themedInteriorCrd(theme, 0);
  const boards = data.boards || [];
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [viewingBoard, setViewingBoard] = useState(null);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };

  const createBoard = async () => {
    if (!newTitle.trim() || !newPrompt.trim()) return;
    const board = { id: genId(), title: newTitle.trim(), prompt: newPrompt.trim(), posts: {}, active: true, ts: Date.now() };
    const updated = { ...data, boards: [...boards, board] };
    await saveData(updated); setData(updated);
    setNewTitle(""); setNewPrompt(""); setCreating(false); showMsg("Board created");
  };

  const submitPost = async (boardId, text) => {
    if (!text.trim()) return;
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [userName]: { text: text.trim(), ts: Date.now() } } } : b) };
    await saveData(updated); setData(updated); showMsg("Posted");
  };

  const closeBoard = async (boardId) => {
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, active: false } : b) };
    await saveData(updated); setData(updated); showMsg("Board closed");
  };

  const deleteBoard = async (boardId) => {
    const updated = { ...data, boards: boards.filter(b => b.id !== boardId) };
    await saveData(updated); setData(updated); showMsg("Deleted"); if (viewingBoard === boardId) setViewingBoard(null);
  };

  const linkify = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "#2563eb", textDecoration: "none", wordBreak: "break-all" }}>{part}</a>
      : part
    );
  };

  const snap = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post) return;
    const snaps = post.snaps || [];
    if (snaps.includes(userName)) return;
    const updatedPost = { ...post, snaps: [...snaps, userName] };
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    await saveData(updated); setData(updated);
  };

  const featurePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post || post.featured) return;
    const updatedPost = { ...post, featured: true };
    const student = data.students.find(s => s.name === postAuthor);
    let updatedData = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    if (student) {
      const entry = { id: genId(), studentId: student.id, amount: 5, source: "Featured Post", ts: Date.now() };
      updatedData = { ...updatedData, log: [...updatedData.log, entry] };
    }
    await saveData(updatedData); setData(updatedData); showMsg("Featured! +5 pts to " + postAuthor);
  };

  const deletePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const newPosts = { ...board.posts };
    delete newPosts[postAuthor];
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: newPosts } : b) };
    await saveData(updated); setData(updated); showMsg("Post deleted");
  };

  const archivePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post) return;
    const updatedPost = { ...post, archived: true };
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    await saveData(updated); setData(updated); showMsg("Post archived");
  };

  const unarchivePost = async (boardId, postAuthor) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) return;
    const post = (board.posts || {})[postAuthor];
    if (!post) return;
    const updatedPost = { ...post, archived: false };
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, posts: { ...b.posts, [postAuthor]: updatedPost } } : b) };
    await saveData(updated); setData(updated); showMsg("Post restored");
  };

  const archiveBoard = async (boardId) => {
    const updated = { ...data, boards: boards.map(b => b.id === boardId ? { ...b, active: false, archived: true } : b) };
    await saveData(updated); setData(updated); showMsg("Board archived");
  };

  // Board detail view
  if (viewingBoard) {
    const board = boards.find(b => b.id === viewingBoard);
    if (!board) { setViewingBoard(null); return null; }
    const posts = board.posts || {};
    const allPostList = Object.entries(posts).sort((a, b) => a[1].ts - b[1].ts);
    const postList = allPostList.filter(([_, p]) => !p.archived);
    const archivedPostList = allPostList.filter(([_, p]) => p.archived);
    const myPost = posts[userName];
    const myPostVisible = myPost && !myPost.archived;
    const isEditing = editingPost === board.id;

    return (
      <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
        <Toast message={msg} />
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => { setViewingBoard(null); setEditingPost(null); }} style={{ ...pillInactive, marginBottom: 16 }}>Back to Boards</button>
          <div style={{ ...crd, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, marginBottom: 6 }}>{board.title}</div>
            <div style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{board.prompt}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 8 }}>{postList.length} response{postList.length !== 1 ? "s" : ""}</div>
            {isAdmin && (
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <button onClick={() => closeBoard(board.id)} style={pillInactive}>{board.active ? "Close" : "Closed"}</button>
                <button onClick={() => archiveBoard(board.id)} style={pillInactive}>Archive</button>
                <button onClick={() => { if (window.confirm("Delete this board and all responses?")) deleteBoard(board.id); }} style={{ ...pill, background: "#fef2f2", color: RED }}>Delete</button>
              </div>
            )}
          </div>

          {/* Write / edit response */}
          {board.active && (
            <div style={{ ...crd, padding: 16, marginBottom: 16 }}>
              {isEditing || !myPostVisible ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase" }}>{myPostVisible ? "Edit Your Response" : "Your Response"}</div>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} placeholder="Write your response..." rows={4} style={{ ...inp, resize: "vertical", fontSize: 14, lineHeight: 1.6 }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { submitPost(board.id, editText); setEditingPost(null); }} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>
                      {myPostVisible ? "Save Changes" : "Post"}
                    </button>
                    {myPostVisible && <button onClick={() => { setEditingPost(null); setEditText(""); }} style={pillInactive}>Cancel</button>}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", marginBottom: 6 }}>Your Response</div>
                  <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{linkify(myPost.text)}</div>
                  <button onClick={() => { setEditingPost(board.id); setEditText(myPost.text); }} style={{ ...pillInactive, marginTop: 8, fontSize: 12 }}>Edit</button>
                </div>
              )}
            </div>
          )}

          {/* All responses */}
          {postList.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No responses yet</div>}
          {postList.map(([name, post]) => {
            const snaps = post.snaps || [];
            const hasSnapped = snaps.includes(userName);
            const snapCount = snaps.length;
            return (
            <div key={name} style={{ ...crd, padding: 14, marginBottom: 8, border: name === userName ? "2px solid " + accent : "1px solid " + BORDER }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{name}{name === userName ? " (you)" : ""}</span>
                <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>{new Date(post.ts).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{linkify(post.text)}</div>
              {post.featured && <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#d97706", background: "#fffbeb", padding: "2px 8px", borderRadius: 6, marginTop: 6 }}>Featured</div>}
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                {name !== userName && (
                  <button onClick={() => snap(board.id, name)} disabled={hasSnapped} style={{ background: hasSnapped ? "#f4f4f5" : "transparent", border: "1px solid " + (hasSnapped ? "#e4e4e7" : BORDER), borderRadius: 8, padding: "4px 10px", cursor: hasSnapped ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: hasSnapped ? TEXT_MUTED : TEXT_PRIMARY, fontFamily: F, fontWeight: 600, transition: "all 0.15s" }}>
                    <span style={{ fontSize: 15 }}>&#x1F44F;</span>
                    {snapCount > 0 && <span>{snapCount}</span>}
                  </button>
                )}
                {isAdmin && !post.featured && (
                  <button onClick={() => featurePost(board.id, name)} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Feature (+5 pts)</button>
                )}
                {isAdmin && (
                  <button onClick={() => archivePost(board.id, name)} style={{ ...pillInactive, fontSize: 11, padding: "4px 10px" }}>Archive</button>
                )}
                {isAdmin && (
                  <button onClick={() => { if (window.confirm("Delete " + name + "'s post?")) deletePost(board.id, name); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "4px 10px" }}>Delete</button>
                )}
                {name === userName && snapCount > 0 && (
                  <span style={{ fontSize: 12, color: TEXT_MUTED }}>{snapCount} snap{snapCount !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
            );
          })}

          {/* Archived posts (admin only) */}
          {isAdmin && archivedPostList.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Archived Posts ({archivedPostList.length})</div>
              {archivedPostList.map(([name, post]) => (
                <div key={name} style={{ ...crd, padding: 12, marginBottom: 6, opacity: 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{name}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => unarchivePost(board.id, name)} style={{ ...pillInactive, fontSize: 11, padding: "3px 8px" }}>Restore</button>
                      <button onClick={() => { if (window.confirm("Permanently delete?")) deletePost(board.id, name); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11, padding: "3px 8px" }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.4 }}>{post.text.length > 100 ? post.text.slice(0, 100) + "..." : post.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeBoards = boards.filter(b => b.active && !b.archived);
  const archivedBoards = boards.filter(b => b.archived);
  const closedBoards = boards.filter(b => !b.active && !b.archived);

  return (
    <div style={{ padding: "24px 20px 40px", fontFamily: F }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ ...sectionLabel }}>Discussion Boards</div>
          {isAdmin && <button onClick={() => setCreating(!creating)} style={creating ? pillActive : pillInactive}>{creating ? "Cancel" : "+ New Board"}</button>}
        </div>

        {isAdmin && creating && (
          <div style={{ ...crd, padding: 18, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Board title (e.g. Week 1 Discussion)" style={{ ...inp, fontWeight: 700, fontSize: 16 }} />
              <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="Prompt or question for students" rows={3} style={{ ...inp, resize: "vertical", fontSize: 14 }} />
              <button onClick={createBoard} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", padding: "12px 0" }}>Create Board</button>
            </div>
          </div>
        )}

        {activeBoards.length === 0 && !creating && <div style={{ ...crd, padding: 24, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No active boards</div>}
        {activeBoards.map(board => {
          const postCount = Object.keys(board.posts || {}).length;
          const myPost = (board.posts || {})[userName];
          return (
            <div key={board.id} onClick={() => { setViewingBoard(board.id); if (!myPost) setEditText(""); }} style={{ ...crd, padding: 14, marginBottom: 8, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.3, flex: 1, minWidth: 0 }}>{board.title}</div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: "#ecfdf5", color: "#047857", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Active</span>
              </div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.4, marginBottom: 6 }}>{board.prompt.length > 120 ? board.prompt.slice(0, 120) + "..." : board.prompt}</div>
              <div style={{ display: "flex", gap: 10, fontSize: 11, color: TEXT_MUTED }}>
                <span>{postCount} {postCount === 1 ? "reply" : "replies"}</span>
                {myPost && <><span>·</span><span style={{ color: GREEN, fontWeight: 500 }}>You responded</span></>}
                {!myPost && <><span>·</span><span style={{ color: accent, fontWeight: 500 }}>Not yet responded</span></>}
              </div>
            </div>
          );
        })}

        {closedBoards.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Closed Boards</div>
            {closedBoards.map(board => {
              const postCount = Object.keys(board.posts || {}).length;
              return (
                <div key={board.id} style={{ ...crd, padding: 14, marginBottom: 8, opacity: 0.7, cursor: "pointer" }} onClick={() => setViewingBoard(board.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{board.title}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED }}>{postCount} responses</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {isAdmin && <button onClick={e => { e.stopPropagation(); archiveBoard(board.id); }} style={{ ...pillInactive, fontSize: 11 }}>Archive</button>}
                      {isAdmin && <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete?")) deleteBoard(board.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Delete</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isAdmin && archivedBoards.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Archived Boards</div>
            {archivedBoards.map(board => {
              const postCount = Object.keys(board.posts || {}).length;
              return (
                <div key={board.id} style={{ ...crd, padding: 14, marginBottom: 8, opacity: 0.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{board.title}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED }}>{postCount} responses</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setViewingBoard(board.id)} style={{ ...pillInactive, fontSize: 11 }}>View</button>
                      <button onClick={() => { if (window.confirm("Permanently delete?")) deleteBoard(board.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SURVEY ─── */

// ─── ToDoView (all three classes) ─────────────────────────────────────
// Admin task manager. List, drag-reorder, target all-students or
// specific students. Students see their assigned todos with due dates.
// Includes auto-rebound entries when a quiz is regradeable.
// Props: data, setData, userName, isAdmin (existing); storageKey (theme);
// saveData; accent; lastSortObj (per-class roster sort);
// reboundHours (Comm 118/4: 72, Comm 2: 48 — defaults to 72)
export function ToDoView({ data, setData, userName, isAdmin, storageKey, saveData, accent, lastSortObj, reboundHours = 72 }) {
  const { theme } = useTheme(storageKey);
  const crd = themedInteriorCrd(theme, 0);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: "", due: "", linkTab: "", target: "all" });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const todos = data.todos || [];

  const tabLinks = [
    { id: "", label: "No link" },
    { id: "home", label: "Home" },
    { id: "assignments", label: "Assignments" },
    { id: "readings", label: "Readings" },
    { id: "inclass", label: "In-Class Activities" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "schedule", label: "Schedule" },
    { id: "boards", label: "Boards" },
    { id: "roster", label: "Roster" },
  ];

  const startAdd = () => {
    setForm({ title: "", due: "", linkTab: "", target: "all" });
    setSelectedStudents([]);
    setAdding(true); setEditId(null);
  };

  const startEdit = (todo) => {
    setForm({ title: todo.title, due: todo.due || "", linkTab: todo.linkTab || "", target: todo.targetStudents ? "select" : "all" });
    setSelectedStudents(todo.targetStudents || []);
    setEditId(todo.id); setAdding(false);
  };

  const saveTodo = async () => {
    if (!form.title.trim()) return;
    const target = form.target === "all" ? null : selectedStudents;
    if (form.target === "select" && selectedStudents.length === 0) return;

    if (editId) {
      const updated = { ...data, todos: todos.map(t => t.id === editId ? { ...t, title: form.title.trim(), due: form.due.trim(), linkTab: form.linkTab, targetStudents: target } : t) };
      await saveData(updated); setData(updated);
      setEditId(null); showMsg("Updated");
    } else {
      const todo = { id: genId(), title: form.title.trim(), due: form.due.trim(), linkTab: form.linkTab, targetStudents: target, ts: Date.now() };
      const updated = { ...data, todos: [...todos, todo] };
      await saveData(updated); setData(updated);
      setAdding(false); showMsg("Added");
    }
    setForm({ title: "", due: "", linkTab: "", target: "all" }); setSelectedStudents([]);
  };

  const removeTodo = async (todoId) => {
    const updated = { ...data, todos: todos.filter(t => t.id !== todoId) };
    await saveData(updated); setData(updated); showMsg("Removed");
  };

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = async (idx) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const newTodos = [...todos];
    const [moved] = newTodos.splice(dragIdx, 1);
    newTodos.splice(idx, 0, moved);
    const updated = { ...data, todos: newTodos };
    await saveData(updated); setData(updated);
    setDragIdx(null); setDragOverIdx(null);
  };

  const renderForm = () => (
    <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" style={{ ...inp, fontSize: 14, fontWeight: 600 }} />
        <div style={{ display: "flex", gap: 6 }}>
          <input value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} placeholder="Due date (e.g. Apr 10)" style={{ ...inp, fontSize: 13, flex: 1 }} />
          <select value={form.linkTab} onChange={e => setForm({ ...form, linkTab: e.target.value })} style={{ ...sel, fontSize: 13, flex: 1 }}>
            {tabLinks.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <button onClick={() => setForm({ ...form, target: "all" })} style={form.target === "all" ? pillActive : pillInactive}>All Students</button>
          <button onClick={() => setForm({ ...form, target: "select" })} style={form.target === "select" ? pillActive : pillInactive}>Select Students</button>
        </div>
        {form.target === "select" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxHeight: 120, overflowY: "auto", padding: 4 }}>
            {[...data.students].filter(s => s.name !== ADMIN_NAME && s.name !== TEST_STUDENT).sort(lastSortObj).map(s => (
              <button key={s.id} onClick={() => setSelectedStudents(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} style={{
                fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer", fontFamily: F,
                border: "1px solid " + (selectedStudents.includes(s.id) ? accent : BORDER),
                background: selectedStudents.includes(s.id) ? accent + "15" : "transparent",
                color: selectedStudents.includes(s.id) ? accent : TEXT_PRIMARY,
              }}>{s.name.split(" ")[0]}</button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={saveTodo} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>{editId ? "Save Changes" : "Add To-Do"}</button>
          <button onClick={() => { setAdding(false); setEditId(null); setForm({ title: "", due: "", linkTab: "", target: "all" }); }} style={pillInactive}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // Auto rebound/makeup todos for admin view
  const reboundTodos = [];
  const activityTypes = [
    { type: "game", store: "weeklyGames", label: "Weekly Game" },
    { type: "tot", store: "weeklyToT", label: "This or That" },
    { type: "fishbowl", store: "weeklyFishbowl", label: "Fishbowl" },
  ];
  activityTypes.forEach(({ type, store, label }) => {
    const activities = data[store] || {};
    Object.keys(activities).forEach(w => {
      const act = activities[w];
      const scored = type === "fishbowl" ? act?.confirmed : act?.scored;
      if (!scored) return;
      const rKey = type + "-" + w;
      const rd = (data.rebounds || {})[rKey] || {};
      const scoredTs = rd.scoredTs || 0;
      Object.entries(rd.studentStatuses || {}).forEach(([sid, ss]) => {
        if (ss.approved) return;
        // Hide if a rebound grade has already been entered for this student/week
        if (type === "game" && (data.reboundGrades || {})[sid + "-game-" + w]) return;
        const status = ss.status || "";
        if (status === "rebound" || status === "unannounced_override") {
          const deadline = scoredTs + reboundHours * 60 * 60 * 1000;
          if (Date.now() > deadline) return;
          const sName = data.students.find(s => s.id === sid)?.name || sid;
          reboundTodos.push({ id: "r-" + rKey + "-" + sid, title: "Rebound: " + label + " Wk " + w + " (" + sName.split(" ")[0] + ")", due: Math.max(0, Math.round((deadline - Date.now()) / (1000 * 60 * 60))) + "h left", submitted: !!ss.link });
        }
        if (status === "planned_makeup") {
          const mDeadline = scoredTs + 7 * 24 * 60 * 60 * 1000;
          if (Date.now() > mDeadline) return;
          const sName = data.students.find(s => s.id === sid)?.name || sid;
          reboundTodos.push({ id: "m-" + rKey + "-" + sid, title: "Makeup: " + label + " Wk " + w + " (" + sName.split(" ")[0] + ")", due: Math.max(0, Math.round((mDeadline - Date.now()) / (1000 * 60 * 60 * 24))) + "d left" });
        }
      });
    });
  });

  return (
    <div style={{ padding: "20px 20px 40px", fontFamily: themedHeadingFont(theme, F) }}>
      <Toast message={msg} />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ ...sectionLabel }}>To-Do Manager</div>
          <button onClick={startAdd} style={adding ? pillActive : pillInactive}>{adding ? "Cancel" : "+ Add To-Do"}</button>
        </div>

        {(adding || editId) && renderForm()}

        {reboundTodos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Auto-generated</div>
            {reboundTodos.map(t => (
              <div key={t.id} style={{ ...crd, padding: 12, marginBottom: 4, borderLeft: "3px solid #f59e0b", opacity: t.submitted ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{t.title}</span>
                    {t.submitted && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginLeft: 6 }}>Submitted</span>}
                  </div>
                  <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500 }}>{t.due}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {todos.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Your To-Dos (drag to reorder)</div>
            {todos.map((todo, idx) => {
              const targetLabel = todo.targetStudents
                ? (todo.targetStudents.length === 1 ? (data.students.find(s => s.id === todo.targetStudents[0])?.name || "1 student") : todo.targetStudents.length + " students")
                : "All students";
              const isDragOver = dragOverIdx === idx;
              return (
                <div key={todo.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  style={{
                    ...crd, padding: 12, marginBottom: 4, borderLeft: "3px solid " + accent, cursor: "grab",
                    borderTop: isDragOver ? "2px solid " + accent : undefined,
                    opacity: dragIdx === idx ? 0.4 : 1,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{todo.title}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                        {todo.due && <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500 }}>Due: {todo.due}</span>}
                        <span style={{ fontSize: 12, color: TEXT_MUTED }}>{targetLabel}</span>
                        {todo.linkTab && <span style={{ fontSize: 11, color: accent, fontWeight: 500 }}>{tabLinks.find(t => t.id === todo.linkTab)?.label || todo.linkTab}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => startEdit(todo)} style={{ ...pillInactive, fontSize: 11 }}>Edit</button>
                      <button onClick={() => { if (window.confirm("Remove?")) removeTodo(todo.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>X</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {todos.length === 0 && reboundTodos.length === 0 && !adding && (
          <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED, fontSize: 14 }}>No to-dos yet. Click "+ Add To-Do" to create one.</div>
        )}
      </div>
    </div>
  );
}

/* ─── ACTIVITIES (Pass 1 placeholder, Pass 4 will rebuild) ─── */

// ─── NamePicker (all three classes) ───────────────────────────────────
// Pre-login screen. Lists students alphabetically by last name. Tapping
// a name opens a PIN entry. Admin (Andrew Ishak) gets a PIN of 118711;
// students have a 6-digit PIN stored in data.pins (legacy: no PIN means
// any value works).
//
// Props:
//   data: class data (or null on cold load — falls back to allStudents)
//   onSelect: (name) => void — called when a valid name+PIN is entered
//     or when "Continue as guest" is tapped
//   storageKey: e.g. "comm118-game-v14" — for "remember me"
//   allStudents: full array of student names (used as fallback when data
//     hasn't loaded yet)
//   accent: class accent color
//   adminPin: e.g. "118711" — admin login PIN
//   lastSort: per-class sort comparator (handles last-name overrides)
//   iconText: text rendered in the class icon ("118" / "4" / "2")
//   iconFontSize: font size for the icon text (16 for "118", 18 for "4"/"2")
//   courseCode: e.g. "COMM 118 · Spring 2026"
//   courseTitle: e.g. "Communication and Sport" (overridden by data.courseTitle)
//   meetingInfo: e.g. "MWF 8:00 to 9:05 am · Vari 128"
export function NamePicker({
  data, onSelect,
  storageKey, allStudents, accent, adminPin,
  lastSort,
  iconText, iconFontSize = 16, courseCode, courseTitle, meetingInfo,
}) {
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const pins = data?.pins || {};

  const names = data ? data.students.map(s => s.name).sort(lastSort) : [...allStudents].sort(lastSort);
  const sorted = [ADMIN_NAME, ...names.filter(n => n !== ADMIN_NAME && n !== TEST_STUDENT)];

  const tryLogin = () => {
    if (!selected) return;
    if (selected === ADMIN_NAME) {
      if (pin !== String(adminPin)) { setError("Wrong PIN"); setPin(""); return; }
      if (remember) { try { localStorage.setItem(storageKey + "-user", selected); } catch(e) {} }
      onSelect(selected);
      return;
    }
    const student = data.students.find(s => s.name === selected);
    if (!student) return;
    const correctPin = pins[student.id];
    if (correctPin && pin !== String(correctPin)) {
      setError("Wrong PIN"); setPin(""); return;
    }
    if (remember) { try { localStorage.setItem(storageKey + "-user", selected); } catch(e) {} }
    onSelect(selected);
  };

  const displayCourseTitle = data?.courseTitle || courseTitle;

  if (selected) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafaf9", color: TEXT_PRIMARY, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 360, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: accent, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: "#fff", fontSize: iconFontSize, fontWeight: 700 }}>{iconText}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>{selected}</div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4 }}>Enter your PIN to continue</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 18 }}>
            <input autoFocus type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }} onKeyDown={e => e.key === "Enter" && tryLogin()} placeholder="6-digit PIN" style={{ ...inp, textAlign: "center", fontSize: 22, fontWeight: 600, letterSpacing: "0.3em" }} />
            {error && <div style={{ fontSize: 13, color: RED, textAlign: "center", marginTop: 8, fontWeight: 500 }}>{error}</div>}
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer", fontSize: 13, color: TEXT_SECONDARY }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16 }} />
              Remember me on this device
            </label>
            <button onClick={tryLogin} style={{ ...pill, background: accent, color: "#fff", padding: "12px 0", width: "100%", marginTop: 14, fontSize: 14, fontWeight: 500 }}>Sign in</button>
            <button onClick={() => { setSelected(null); setPin(""); setError(""); }} style={{
              width: "100%", marginTop: 8, padding: "10px 0", background: "#fff",
              border: "1px solid " + BORDER_STRONG, borderRadius: 10, cursor: "pointer", fontFamily: F,
              fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY,
            }}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf9", color: TEXT_PRIMARY, fontFamily: F, padding: "60px 20px 40px" }}>
      <div style={{ maxWidth: 420, width: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: accent, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <span style={{ color: "#fff", fontSize: iconFontSize, fontWeight: 700, letterSpacing: "-0.02em" }}>{iconText}</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{courseCode}</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{displayCourseTitle}</div>
          <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 6 }}>{meetingInfo}</div>
        </div>

        <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.55, textAlign: "center", marginBottom: 18, padding: "0 4px" }}>
          This app is our class hub. Please see Camino for official grades.
        </div>

        <div style={{ ...sectionLabel, marginBottom: 8, paddingLeft: 4 }}>Select your name</div>
        <div style={{ background: "#fff", border: "1px solid " + BORDER_STRONG, borderRadius: 14, padding: 4 }}>
          {sorted.map(name => {
            const student = data?.students?.find(s => s.name === name);
            const bio = student ? (data?.bios || {})[student.id] : null;
            const photoUrl = bio?.photo;
            const isAdmin = name === ADMIN_NAME;
            return (
              <button key={name} onClick={() => setSelected(name)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", textAlign: "left",
                fontFamily: F, fontSize: 14, fontWeight: isAdmin ? 600 : 400,
                background: "transparent",
                color: TEXT_PRIMARY,
                border: "none", borderRadius: 10, cursor: "pointer",
              }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 36, height: 36, borderRadius: "50%", background: isAdmin ? accent : "#e4e4e7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: isAdmin ? "#fff" : TEXT_SECONDARY, flexShrink: 0 }}>
                    {name.split(" ").map(n => n[0]).join("")}
                  </span>
                )}
                <span style={{ flex: 1, minWidth: 0 }}>{name}</span>
                {isAdmin && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: accent + "12", color: accent, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>Instructor</span>}
              </button>
            );
          })}
        </div>

        <button onClick={() => onSelect(GUEST_NAME)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px 16px",
          fontFamily: F, fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY,
          background: "transparent", border: "1px dashed #d1d5db", borderRadius: 12, cursor: "pointer", marginTop: 12,
        }}>
          Continue as guest
        </button>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: TEXT_MUTED }}>aishak@scu.edu</div>
      </div>
    </div>
  );
}

// ─── Nav (all three classes) ──────────────────────────────────────────
// Top sticky nav bar. Course chip on the left, tab buttons on the right
// with optional admin-only tabs separated by a vertical divider.
//
// Props:
//   view, setView, isAdmin, isGuest, userName, onLogout, studentView,
//   setStudentView, courseTitle, testStudent, setTestStudent, allStudents,
//   activitiesLive: standard
//   storageKey: for theme
//   accent: class accent color
//   studentTabs: array of { id, label, guest } — student-visible tabs
//   adminTabs: array of { id, label } — admin-only tabs (after divider)
//   defaultTitle: fallback for the course chip when courseTitle is empty
//   caminoUrl: URL for the Camino course site, or null to omit the link
export function Nav({
  view, setView, isAdmin, isGuest, userName, onLogout,
  studentView, setStudentView, courseTitle, testStudent, setTestStudent,
  allStudents, activitiesLive,
  storageKey, accent,
  studentTabs, adminTabs, defaultTitle, caminoUrl,
}) {
  const { theme } = useTheme(storageKey);
  const themedFont = themedHeadingFont(theme, F);
  React.useEffect(() => {
    if (theme === "clean") return;
    const id = "themed-fonts-" + theme;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    if (theme === "locked") {
      link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap";
    } else if (theme === "crashing") {
      link.href = "https://fonts.googleapis.com/css2?family=Rubik+Mono+One&family=Press+Start+2P&display=swap";
    }
    document.head.appendChild(link);
  }, [theme]);
  const visibleStudent = studentTabs.filter(t => !isGuest || t.guest);
  return (
    <div style={{ background: "#fff", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          background: theme === "crashing" ? "#1f2937" : accent,
          color: "#fff",
          padding: "5px 12px",
          borderRadius: 8,
          fontSize: theme === "crashing" ? 13 : 12,
          fontWeight: theme === "clean" ? 800 : 400,
          fontFamily: themedFont,
          letterSpacing: theme === "locked" ? "0.04em" : "-0.01em",
          textTransform: theme === "locked" ? "uppercase" : "none",
          border: theme === "crashing" ? "2px solid #ec4899" : "none",
          boxShadow: theme === "crashing" ? "3px 3px 0 #fbbf24" : (theme === "locked" ? "inset 0 -2px 0 #dc2626" : "none"),
        }}>{courseTitle || defaultTitle}</div>
        {studentView && <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.05em" }}>Student View</span>}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {visibleStudent.map(t => {
          const isActive = view === t.id;
          const isLiveDot = t.id === "activities" && activitiesLive;
          return (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              ...pill,
              fontFamily: themedFont,
              background: isActive ? (theme === "crashing" ? "#ec4899" : (theme === "locked" ? "#1f2937" : TEXT_PRIMARY)) : "transparent",
              color: isActive ? "#fff" : TEXT_SECONDARY,
              position: "relative",
              fontWeight: 700,
            }}>
              {t.label}
              {isLiveDot && <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: GREEN, animation: "livePulse 1.6s ease-in-out infinite" }} />}
            </button>
          );
        })}
        {isAdmin && !isGuest && adminTabs && adminTabs.length > 0 && (
          <>
            <span style={{ width: 1, height: 18, background: BORDER_STRONG, margin: "0 4px" }} />
            {adminTabs.map(t => {
              const isActive = view === t.id;
              return (
                <button key={t.id} onClick={() => setView(t.id)} style={{
                  ...pill,
                  background: isActive ? TEXT_PRIMARY : "transparent",
                  color: isActive ? "#fff" : TEXT_MUTED,
                  fontSize: 11,
                  padding: "6px 10px",
                  fontWeight: 700,
                }}>{t.label}</button>
              );
            })}
          </>
        )}
        {caminoUrl && (
          <a href={caminoUrl} target="_blank" rel="noopener noreferrer" style={{ ...linkPill, fontSize: 11 }}>
            Camino <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        )}
        {setStudentView && !testStudent && (
          <button onClick={() => setStudentView(!studentView)} style={{
            padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: F, border: studentView ? "1px solid #d97706" : "1px solid " + BORDER_STRONG,
            background: studentView ? "#fef3c7" : "#fff", color: studentView ? "#92400e" : TEXT_MUTED, transition: "all 0.15s",
          }}>{studentView ? "Exit" : "Student View"}</button>
        )}
        {setTestStudent && allStudents && (
          <select value={testStudent || ""} onChange={e => setTestStudent(e.target.value || null)} style={{
            padding: "5px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
            fontFamily: F, border: testStudent ? "1px solid " + RED : "1px solid " + BORDER_STRONG,
            background: testStudent ? "#fef2f2" : "#fff", color: testStudent ? RED : TEXT_MUTED,
            outline: "none", maxWidth: 140,
          }}>
            <option value="">Test as student...</option>
            {allStudents.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        )}
        <span style={{ fontSize: 11, color: TEXT_MUTED, marginLeft: 4 }}>{userName}</span>
        <button onClick={onLogout} style={{
          padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
          fontFamily: F, border: "1px solid " + BORDER_STRONG,
          background: "#fff", color: TEXT_MUTED, transition: "all 0.15s",
        }}>Switch</button>
      </div>
    </div>
  );
}

// ─── ThemedClassWrapper (all three classes) ───────────────────────────
// Top-level layout shell. Handles:
//   - Theme-aware page background, font, pixel art (crashing), bottom stripe (locked)
//   - Admin-only top nav strip linking the three classes
//   - The shared <Nav> bar
//   - Renders class-specific routes as `children`
//
// Each class passes in its data, view state, theme + class identity, plus
// the route table as JSX `children`.
//
// Props:
//   data, setData, view, setView, isAdmin, effectiveAdmin, isGuest,
//   displayName, effectiveUserName, testStudent, setTestStudent,
//   studentView, setStudentView, activitiesLive: all standard
//   storageKey: e.g. "comm118-game-v14" — also used to highlight active
//     class in the admin nav strip
//   accent: class accent color
//   onLogout: () => void — class-specific logout handler (some classes
//     need to also reset view/studentView state on logout)
//   defaultTitle, caminoUrl, studentTabs, adminTabs: forwarded to <Nav>
//   children: per-class route map (e.g. {view === "home" && <HomeView ... />})
export function ThemedClassWrapper({
  data, setData, view, setView, isAdmin, effectiveAdmin, isGuest,
  displayName, effectiveUserName, testStudent, setTestStudent,
  studentView, setStudentView, activitiesLive,
  storageKey, accent, onLogout,
  defaultTitle, caminoUrl, studentTabs, adminTabs,
  children,
}) {
  const { theme } = useTheme(storageKey);
  const themedFont = themedHeadingFont(theme, F);

  // Load themed fonts at the top level so every page gets them
  React.useEffect(() => {
    if (theme === "clean") return;
    const id = "themed-fonts-" + theme;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    if (theme === "locked") {
      link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap";
    } else if (theme === "crashing") {
      link.href = "https://fonts.googleapis.com/css2?family=Rubik+Mono+One&family=Press+Start+2P&display=swap";
    }
    document.head.appendChild(link);
  }, [theme]);

  return (
    <div style={{ minHeight: "100vh", background: themedPageBg(theme), color: TEXT_PRIMARY, fontFamily: themedFont, fontSize: 15, position: "relative" }}>
      {theme === "crashing" && (
        <>
          <style>{THEME_KEYFRAMES_CSS}</style>
          {/* Fixed-position pixel art that follows you across all pages */}
          <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
            <PixelStar top="10%" right="3%" delay={0} />
            <PixelStar top="35%" right="7%" delay={0.4} />
            <PixelStar top="20%" left="4%" delay={0.2} color="#ec4899" />
            <PixelStar bottom="20%" right="5%" delay={0.6} color="#0ea5e9" />
            <PixelArrow bottom="15%" left="3%" delay={0} />
            <PixelArrow top="50%" right="2%" delay={0.3} color="#a855f7" />
            <PixelHeart top="42%" left="3%" delay={0} />
            <PixelHeart bottom="35%" right="6%" delay={0.5} />
            <PixelMushroom top="62%" right="3%" delay={0} />
            <PixelMushroom bottom="55%" left="5%" delay={0.4} />
            <PixelCoin top="72%" left="6%" delay={0} />
            <PixelCoin top="85%" right="6%" delay={0.3} />
            <PixelLightning top="90%" left="2%" delay={0.1} />
            <PixelLightning bottom="60%" right="3%" delay={0.5} />
          </div>
        </>
      )}
      {theme === "locked" && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #dc2626 0%, #1f2937 50%, #dc2626 100%)", zIndex: 100, pointerEvents: "none" }} />
      )}

      {isAdmin && (
        <div style={{ background: "#111", display: "flex", justifyContent: "center", gap: 4, padding: "5px 12px", position: "relative", zIndex: 10 }}>
          <a href="/comm118" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: storageKey === "comm118-game-v14" ? "#fff" : "#9ca3af", background: storageKey === "comm118-game-v14" ? "#333" : "transparent" }}>118</a>
          <a href="/comm2" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: storageKey === "comm2-v1" ? "#fff" : "#9ca3af", background: storageKey === "comm2-v1" ? "#333" : "transparent" }}>COMM 2</a>
          <a href="/comm4" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: storageKey === "comm4-v1" ? "#fff" : "#9ca3af", background: storageKey === "comm4-v1" ? "#333" : "transparent" }}>COMM 4</a>
          <a href="/dashboard" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>Dash</a>
        </div>
      )}
      <div style={{ position: "relative", zIndex: 2 }}>
        <Nav
          view={view} setView={setView}
          isAdmin={effectiveAdmin} isGuest={isGuest}
          userName={testStudent || displayName}
          onLogout={onLogout}
          studentView={studentView}
          setStudentView={isAdmin ? setStudentView : null}
          courseTitle={data?.courseTitle}
          testStudent={testStudent}
          setTestStudent={isAdmin ? setTestStudent : null}
          allStudents={data ? data.students.filter(s => s.name !== ADMIN_NAME && s.name !== TEST_STUDENT).sort((a, b) => {
            const al = a.name.split(" ").slice(-1)[0];
            const bl = b.name.split(" ").slice(-1)[0];
            return al.localeCompare(bl);
          }) : []}
          activitiesLive={activitiesLive}
          storageKey={storageKey} accent={accent}
          defaultTitle={defaultTitle} caminoUrl={caminoUrl}
          studentTabs={studentTabs} adminTabs={adminTabs}
        />
        {children}
      </div>
    </div>
  );
}
