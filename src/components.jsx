// ─── SHARED COMPONENTS MODULE ─────────────────────────────────────────
// Reusable React components shared across all three classes.
// Class-specific behavior is passed in as props (storage key for theme,
// saveData function for persistence, etc.) so the same component renders
// correctly inside each class's data shape.

import React, { useState } from "react";
import {
  F, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
  pill, pillActive, pillInactive, inp,
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
