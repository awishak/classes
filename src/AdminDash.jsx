import React, { useState, useEffect } from "react";

const F = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const ADMIN_PIN = "118711";
const STORAGE_KEYS = [
  { key: "comm118-game-v14", code: "COMM 118", name: "Communication and Sport", color: "#9f1239", path: "/comm118", time: "MWF 8:00-9:05am" },
  { key: "comm2-v1", code: "COMM 2", name: "Public Speaking", color: "#2563eb", path: "/comm2", time: "MWF 9:15-10:20am" },
  { key: "comm4-v1", code: "COMM 4", name: "Approaches to Comm Research", color: "#059669", path: "/comm4", time: "MWF 11:45am-12:50pm" },
];

const BG = "#f7f7f8";
const BORDER = "#e8e8ec";
const TEXT_PRIMARY = "#18181b";
const TEXT_SECONDARY = "#52525b";
const TEXT_MUTED = "#a1a1aa";
const GREEN = "#16a34a";
const RED = "#dc2626";
const AMBER = "#d97706";

const crd = { background: "#fff", borderRadius: 14, border: "1px solid " + BORDER, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
const pill = { padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: F, border: "none", transition: "all 0.15s" };
const pillInactive = { ...pill, background: "#f4f4f5", color: TEXT_SECONDARY };
const pillActive = { ...pill, background: TEXT_PRIMARY, color: "#fff" };
const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid " + BORDER, fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", background: "#fff", color: TEXT_PRIMARY };
const sectionLabel = { fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.05em" };

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function Toast({ message }) {
  if (!message) return null;
  return <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#18181b", color: "#fff", padding: "10px 24px", borderRadius: 12, fontWeight: 600, zIndex: 100, fontFamily: F, fontSize: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>{message}</div>;
}

function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return "https://www.google.com/s2/favicons?domain=" + domain + "&sz=32";
  } catch { return null; }
}

export default function AdminDash() {
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [classData, setClassData] = useState({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const showMsg = m => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
  const [newLink, setNewLink] = useState({ title: "", url: "", category: "" });
  const [addingLink, setAddingLink] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [editLink, setEditLink] = useState({ title: "", url: "", category: "" });
  const [section, setSection] = useState("today");
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesLocal, setNotesLocal] = useState("");

  // Auth check
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin-dash-auth");
      if (saved === "true") setAuthed(true);
    } catch {}
  }, []);

  const handlePin = () => {
    if (pinInput === ADMIN_PIN) {
      setAuthed(true);
      try { localStorage.setItem("admin-dash-auth", "true"); } catch {}
    }
  };

  // Load all class data
  useEffect(() => {
    if (!authed) return;
    const load = async () => {
      const result = {};
      for (const cls of STORAGE_KEYS) {
        try {
          const r = await window.storage.get(cls.key, true);
          if (r?.value) result[cls.key] = JSON.parse(r.value);
        } catch {}
      }
      setClassData(result);
      setLoading(false);

      // Load dashboard-specific data
      try {
        const dr = await window.storage.get("admin-dashboard-v1", true);
        if (dr?.value) {
          const dd = JSON.parse(dr.value);
          setNotes(dd.notes || "");
        }
      } catch {}
    };
    load();
    const iv = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(iv);
  }, [authed]);

  const saveDashData = async (updates) => {
    try {
      let existing = {};
      try {
        const r = await window.storage.get("admin-dashboard-v1", true);
        if (r?.value) existing = JSON.parse(r.value);
      } catch {}
      const merged = { ...existing, ...updates };
      await window.storage.set("admin-dashboard-v1", JSON.stringify(merged), true);
    } catch {}
  };

  const saveNotes = async () => {
    setNotes(notesLocal);
    await saveDashData({ notes: notesLocal });
    setEditingNotes(false);
    showMsg("Notes saved");
  };

  // Link management (stored in dashboard data)
  const [dashLinks, setDashLinks] = useState([]);
  useEffect(() => {
    const loadLinks = async () => {
      try {
        const r = await window.storage.get("admin-dashboard-v1", true);
        if (r?.value) {
          const dd = JSON.parse(r.value);
          setDashLinks(dd.links || []);
          setNotes(dd.notes || "");
        }
      } catch {}
    };
    if (authed) loadLinks();
  }, [authed]);

  const addLink = async () => {
    if (!newLink.url.trim()) return;
    const link = { id: genId(), title: newLink.title.trim() || newLink.url.trim(), url: newLink.url.trim(), category: newLink.category.trim() || "General", ts: Date.now() };
    const updated = [...dashLinks, link];
    setDashLinks(updated);
    await saveDashData({ links: updated });
    setNewLink({ title: "", url: "", category: "" });
    setAddingLink(false);
    showMsg("Link added");
  };

  const removeLink = async (id) => {
    const updated = dashLinks.filter(l => l.id !== id);
    setDashLinks(updated);
    await saveDashData({ links: updated });
    showMsg("Removed");
  };

  const saveEditLink = async () => {
    if (!editLink.url.trim()) return;
    const updated = dashLinks.map(l => l.id === editingLink ? { ...l, title: editLink.title.trim() || editLink.url.trim(), url: editLink.url.trim(), category: editLink.category.trim() || "General" } : l);
    setDashLinks(updated);
    await saveDashData({ links: updated });
    setEditingLink(null);
    showMsg("Updated");
  };

  // PIN screen
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: BG, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...crd, padding: 32, maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, marginBottom: 4 }}>Admin Dashboard</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>Enter your PIN</div>
          <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handlePin()} placeholder="PIN" style={{ ...inp, textAlign: "center", fontSize: 20, letterSpacing: "0.2em", marginBottom: 12 }} />
          <button onClick={handlePin} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", width: "100%", padding: "12px 0" }}>Enter</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ minHeight: "100vh", background: BG, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: TEXT_MUTED }}>Loading all classes...</div></div>;
  }

  // Gather data across all classes
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", { weekday: "short" });
  const dayNames = { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri" };

  // Collect schedule items for next 7 days
  const calendarItems = [];
  STORAGE_KEYS.forEach(cls => {
    const d = classData[cls.key];
    if (!d) return;
    const schedule = d.schedule || [];
    schedule.forEach(week => {
      (week.dates || []).forEach(dt => {
        if (!dt.date) return;
        const parsed = new Date(dt.date + ", 2026");
        const diff = (parsed - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000 * 60 * 60 * 24);
        if (diff >= 0 && diff < 7) {
          calendarItems.push({ ...dt, classCode: cls.code, classColor: cls.color, classPath: cls.path, weekLabel: week.label, weekTheme: week.theme, parsed, diff });
        }
      });
    });
  });
  calendarItems.sort((a, b) => a.parsed - b.parsed);

  // Collect needs-attention items
  const attentionItems = [];
  STORAGE_KEYS.forEach(cls => {
    const d = classData[cls.key];
    if (!d) return;

    // Ungraded submissions
    const submissions = d.submissions || {};
    const grades = d.grades || {};
    const assignments = d.assignments || [];
    assignments.forEach(a => {
      const subCount = d.students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis" && submissions[s.id + "-" + a.id]).length;
      const gradedCount = d.students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis" && grades[s.id + "-" + a.id]?.score !== undefined).length;
      const ungraded = subCount - gradedCount;
      if (ungraded > 0) {
        attentionItems.push({ type: "ungraded", label: a.name, count: ungraded, classCode: cls.code, classColor: cls.color, classPath: cls.path });
      }
    });

    // Pending rebound approvals
    const rebounds = d.rebounds || {};
    Object.entries(rebounds).forEach(([rKey, rd]) => {
      const statuses = rd.studentStatuses || {};
      Object.entries(statuses).forEach(([sid, ss]) => {
        if (ss.link && !ss.approved) {
          const sName = d.students.find(s => s.id === sid)?.name || "Unknown";
          attentionItems.push({ type: "rebound", label: rKey.replace("-", " Wk ") + " (" + sName.split(" ")[0] + ")", classCode: cls.code, classColor: cls.color, classPath: cls.path });
        }
      });
    });

    // Unarchived student messages
    const messages = d.messages || [];
    const archived = d.archivedMessages || [];
    const studentMsgs = messages.filter(m => m.from !== "Andrew Ishak" && !archived.includes(m.id));
    if (studentMsgs.length > 0) {
      attentionItems.push({ type: "messages", label: studentMsgs.length + " unread message" + (studentMsgs.length !== 1 ? "s" : ""), classCode: cls.code, classColor: cls.color, classPath: cls.path });
    }
  });

  // Collect to-dos across all classes
  const allTodos = [];
  STORAGE_KEYS.forEach(cls => {
    const d = classData[cls.key];
    if (!d) return;
    (d.todos || []).forEach(t => {
      allTodos.push({ ...t, classCode: cls.code, classColor: cls.color });
    });
  });

  // Collect auto links from class data (Camino, booking, required readings)
  const autoLinks = [];
  STORAGE_KEYS.forEach(cls => {
    const d = classData[cls.key];
    if (!d) return;
    const ic = d.instructorCard || {};
    if (ic.caminoUrl) autoLinks.push({ title: cls.code + " Camino", url: ic.caminoUrl, category: "Camino", classColor: cls.color });
    if (ic.syllabusUrl) autoLinks.push({ title: cls.code + " Syllabus", url: ic.syllabusUrl, category: "Syllabus", classColor: cls.color });
    if (ic.bookingUrl) autoLinks.push({ title: ic.bookingLabel || "Book a Meeting", url: ic.bookingUrl, category: "Booking", classColor: cls.color });
    (d.requiredMedia || []).forEach(m => {
      if (m.url) autoLinks.push({ title: m.title || m.url, url: m.url, category: cls.code + " Media", classColor: cls.color });
    });
    (d.readings || []).forEach(r => {
      if (r.url && r.required) autoLinks.push({ title: r.title || r.url, url: r.url, category: cls.code + " Readings", classColor: cls.color });
    });
  });

  // Quick stats
  const stats = STORAGE_KEYS.map(cls => {
    const d = classData[cls.key];
    if (!d) return { ...cls, students: 0, gamesScored: 0, gamesTotal: 0 };
    const students = d.students.filter(s => s.name !== "Andrew Ishak" && s.name !== "Bruce Willis").length;
    const games = d.weeklyGames || {};
    const gamesScored = Object.values(games).filter(g => g.scored).length;
    const gamesTotal = Object.keys(games).length;
    return { ...cls, students, gamesScored, gamesTotal };
  });

  // Today's items
  const todayItems = calendarItems.filter(item => item.diff < 1);

  const sections = [
    { id: "today", label: "Today" },
    { id: "calendar", label: "Calendar" },
    { id: "attention", label: "Attention (" + attentionItems.length + ")" },
    { id: "todos", label: "To-Dos" },
    { id: "links", label: "Links" },
    { id: "notes", label: "Notes" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: F }}>
      <Toast message={msg} />
      {/* Top bar */}
      <div style={{ background: "#111", display: "flex", justifyContent: "center", gap: 4, padding: "5px 12px" }}>
        <a href="/comm118" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>118</a>
        <a href="/comm2" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>COMM 2</a>
        <a href="/comm4" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#9ca3af", background: "transparent" }}>COMM 4</a>
        <a href="/dashboard" style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: F, textDecoration: "none", color: "#fff", background: "#333" }}>Dashboard</a>
      </div>

      {/* Header */}
      <div style={{ background: "#18181b", padding: "24px 20px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Admin Dashboard</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Spring 2026 / All Classes</div>
      </div>

      {/* Quick stats row */}
      <div style={{ maxWidth: 720, margin: "-12px auto 0", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {stats.map(s => (
            <a key={s.key} href={s.path} style={{ ...crd, flex: 1, padding: "14px 12px", textAlign: "center", textDecoration: "none", color: "inherit" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.code}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: TEXT_PRIMARY, marginTop: 2 }}>{s.students}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED }}>students</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>{s.gamesScored}/{s.gamesTotal} games</div>
            </a>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ maxWidth: 720, margin: "16px auto 0", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={section === s.id ? pillActive : pillInactive}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "16px auto 0", padding: "0 20px 60px" }}>

        {/* TODAY */}
        {section === "today" && (
          <div>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Today's Classes</div>
            {todayItems.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED }}>No classes today</div>}
            {todayItems.map((item, i) => (
              <a key={i} href={item.classPath} style={{ display: "block", textDecoration: "none", color: "inherit", ...crd, padding: 14, marginBottom: 8, borderLeft: "4px solid " + item.classColor }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: item.classColor }}>{item.classCode}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 2 }}>{item.topic || item.weekLabel}</div>
                    {item.assignment && <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginTop: 2 }}>Due: {item.assignment}</div>}
                    {item.notes && !item.holiday && <div style={{ fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 }}>{item.notes}</div>}
                    {item.holiday && <div style={{ fontSize: 12, color: AMBER, fontWeight: 600, marginTop: 2 }}>{item.notes || "No class"}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED }}>{item.day} {item.date}</div>
                </div>
              </a>
            ))}

            {/* Today's attention items */}
            {attentionItems.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ ...sectionLabel, marginBottom: 10 }}>Needs Attention</div>
                {attentionItems.slice(0, 5).map((item, i) => (
                  <a key={i} href={item.classPath} style={{ display: "block", textDecoration: "none", color: "inherit", ...crd, padding: 12, marginBottom: 6, borderLeft: "3px solid " + (item.type === "ungraded" ? AMBER : item.type === "rebound" ? "#f59e0b" : "#3b82f6") }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: item.classColor, marginRight: 8 }}>{item.classCode}</span>
                        <span style={{ fontSize: 13, color: TEXT_PRIMARY }}>{item.label}</span>
                      </div>
                      {item.count && <span style={{ fontSize: 12, fontWeight: 700, color: AMBER }}>{item.count}</span>}
                    </div>
                  </a>
                ))}
                {attentionItems.length > 5 && <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>+{attentionItems.length - 5} more</div>}
              </div>
            )}
          </div>
        )}

        {/* CALENDAR */}
        {section === "calendar" && (
          <div>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Next 7 Days</div>
            {calendarItems.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED }}>Nothing scheduled</div>}
            {(() => {
              let lastDate = "";
              return calendarItems.map((item, i) => {
                const dateLabel = item.day + " " + item.date;
                const showDate = dateLabel !== lastDate;
                lastDate = dateLabel;
                return (
                  <div key={i}>
                    {showDate && <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, marginTop: i > 0 ? 16 : 0, marginBottom: 6 }}>{dateLabel}</div>}
                    <a href={item.classPath} style={{ display: "block", textDecoration: "none", color: "inherit", ...crd, padding: 12, marginBottom: 4, borderLeft: "4px solid " + item.classColor }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: item.classColor }}>{item.classCode}</span>
                          <span style={{ fontSize: 13, color: TEXT_PRIMARY, marginLeft: 8 }}>{item.topic || "(no topic)"}</span>
                        </div>
                      </div>
                      {item.assignment && <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginTop: 2 }}>Due: {item.assignment}</div>}
                      {item.holiday && <div style={{ fontSize: 12, color: AMBER, fontWeight: 600, marginTop: 2 }}>{item.notes || "No class"}</div>}
                    </a>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ATTENTION */}
        {section === "attention" && (
          <div>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>Needs Your Attention</div>
            {attentionItems.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED }}>All clear</div>}
            {attentionItems.map((item, i) => (
              <a key={i} href={item.classPath} style={{ display: "block", textDecoration: "none", color: "inherit", ...crd, padding: 14, marginBottom: 6, borderLeft: "3px solid " + item.classColor }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.classColor, marginRight: 8 }}>{item.classCode}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>{item.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {item.count && <span style={{ fontSize: 14, fontWeight: 700, color: AMBER }}>{item.count}</span>}
                    <span style={{ fontSize: 11, fontWeight: 600, color: item.type === "ungraded" ? AMBER : item.type === "rebound" ? "#f59e0b" : "#3b82f6" }}>
                      {item.type === "ungraded" ? "to grade" : item.type === "rebound" ? "rebound" : "messages"}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* TODOS */}
        {section === "todos" && (
          <div>
            <div style={{ ...sectionLabel, marginBottom: 10 }}>To-Dos Across All Classes</div>
            {allTodos.length === 0 && <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED }}>No to-dos</div>}
            {allTodos.map((t, i) => {
              const targetLabel = t.targetStudents
                ? t.targetStudents.length + " student" + (t.targetStudents.length !== 1 ? "s" : "")
                : "All students";
              return (
                <div key={i} style={{ ...crd, padding: 12, marginBottom: 6, borderLeft: "3px solid " + t.classColor }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.classColor, marginRight: 8 }}>{t.classCode}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY }}>{t.title}</span>
                    </div>
                    {t.due && <span style={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 500 }}>{t.due}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{targetLabel}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* LINKS */}
        {section === "links" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ ...sectionLabel }}>Links</div>
              <button onClick={() => setAddingLink(!addingLink)} style={addingLink ? pillActive : pillInactive}>{addingLink ? "Cancel" : "+ Add Link"}</button>
            </div>

            {addingLink && (
              <div style={{ ...crd, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input value={newLink.title} onChange={e => setNewLink({ ...newLink, title: e.target.value })} placeholder="Title (optional)" style={{ ...inp, fontSize: 13 }} />
                  <input value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} placeholder="https://..." style={{ ...inp, fontSize: 13 }} />
                  <input value={newLink.category} onChange={e => setNewLink({ ...newLink, category: e.target.value })} placeholder="Category (e.g. Tools, Resources)" style={{ ...inp, fontSize: 13 }} />
                  <button onClick={addLink} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", width: "100%" }}>Add Link</button>
                </div>
              </div>
            )}

            {/* Auto-pulled links */}
            {autoLinks.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>From Your Classes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {autoLinks.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", ...crd, textDecoration: "none", color: "inherit", borderLeft: "3px solid " + link.classColor }}>
                      {getFavicon(link.url) && <img src={getFavicon(link.url)} alt="" style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.title}</div>
                        <div style={{ fontSize: 11, color: TEXT_MUTED }}>{link.category}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Custom links */}
            {dashLinks.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MUTED, marginBottom: 6 }}>Your Links</div>
                {(() => {
                  const categories = [...new Set(dashLinks.map(l => l.category))];
                  return categories.map(cat => (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 4 }}>{cat}</div>
                      {dashLinks.filter(l => l.category === cat).map(link => (
                        <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", ...crd, marginBottom: 4 }}>
                          {editingLink === link.id ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                              <input value={editLink.title} onChange={e => setEditLink({ ...editLink, title: e.target.value })} style={{ ...inp, fontSize: 13 }} />
                              <input value={editLink.url} onChange={e => setEditLink({ ...editLink, url: e.target.value })} style={{ ...inp, fontSize: 13 }} />
                              <input value={editLink.category} onChange={e => setEditLink({ ...editLink, category: e.target.value })} placeholder="Category" style={{ ...inp, fontSize: 13 }} />
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={saveEditLink} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Save</button>
                                <button onClick={() => setEditingLink(null)} style={pillInactive}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {getFavicon(link.url) && <img src={getFavicon(link.url)} alt="" style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0 }} />}
                              <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.title}</div>
                                <div style={{ fontSize: 11, color: TEXT_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.url}</div>
                              </a>
                              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                <button onClick={() => { setEditingLink(link.id); setEditLink({ title: link.title, url: link.url, category: link.category }); }} style={{ ...pillInactive, fontSize: 11 }}>Edit</button>
                                <button onClick={() => { if (window.confirm("Remove?")) removeLink(link.id); }} style={{ ...pill, background: "#fef2f2", color: RED, fontSize: 11 }}>X</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}

            {dashLinks.length === 0 && autoLinks.length === 0 && !addingLink && (
              <div style={{ ...crd, padding: 20, textAlign: "center", color: TEXT_MUTED }}>No links yet</div>
            )}
          </div>
        )}

        {/* NOTES */}
        {section === "notes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ ...sectionLabel }}>Admin Notes</div>
              {!editingNotes && <button onClick={() => { setNotesLocal(notes); setEditingNotes(true); }} style={pillInactive}>Edit</button>}
            </div>
            {editingNotes ? (
              <div style={{ ...crd, padding: 14 }}>
                <textarea value={notesLocal} onChange={e => setNotesLocal(e.target.value)} rows={12} placeholder="Your notes, reminders, prep ideas..." style={{ ...inp, resize: "vertical", fontSize: 14, lineHeight: 1.6 }} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={saveNotes} style={{ ...pill, background: TEXT_PRIMARY, color: "#fff", flex: 1 }}>Save</button>
                  <button onClick={() => setEditingNotes(false)} style={pillInactive}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ ...crd, padding: 16 }}>
                {notes ? (
                  <div style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{notes}</div>
                ) : (
                  <div style={{ fontSize: 14, color: TEXT_MUTED, fontStyle: "italic" }}>No notes yet. Click Edit to add some.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
